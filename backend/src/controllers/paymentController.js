const db = require('../config/db');
const { logAudit } = require('../utils/logger');

// Helper to replay all payments of a contract to ensure schedules are perfectly updated
async function rebuildSchedules(contractId) {
  // 1. Reset all schedules to unpaid
  await db.run(
    `UPDATE payment_schedules 
     SET amount_paid = 0.00, balance = amount_due, payment_status = 'pending'
     WHERE contract_id = ?`,
    [contractId]
  );

  // 2. Fetch all valid payments for this contract sorted by id/date ASC
  const payments = await db.query(
    'SELECT * FROM payments WHERE contract_id = ? ORDER BY payment_date ASC, id ASC',
    [contractId]
  );

  // 3. Fetch contract details
  const contract = await db.query('SELECT total_amount, down_payment_amount FROM contracts WHERE id = ?', [contractId]);
  const downPayment = parseFloat(contract[0].down_payment_amount);
  const totalAmount = parseFloat(contract[0].total_amount);

  let totalAllocated = 0;

  // 4. Re-apply each payment to the schedules
  for (const payment of payments) {
    let paymentAmount = parseFloat(payment.amount_paid);
    totalAllocated += paymentAmount;

    // Get all schedules that are not fully paid
    const schedules = await db.query(
      `SELECT * FROM payment_schedules 
       WHERE contract_id = ? AND payment_status != 'paid' 
       ORDER BY installment_number ASC`,
      [contractId]
    );

    for (const schedule of schedules) {
      if (paymentAmount <= 0) break;

      const scheduleDue = Math.round(parseFloat(schedule.amount_due) * 100) / 100;
      const schedulePaid = Math.round(parseFloat(schedule.amount_paid) * 100) / 100;
      const needed = Math.round((scheduleDue - schedulePaid) * 100) / 100;
      const paymentAmountRound = Math.round(paymentAmount * 100) / 100;

      if (paymentAmountRound >= needed) {
        await db.run(
          `UPDATE payment_schedules 
           SET amount_paid = ?, balance = 0.00, payment_status = 'paid' 
           WHERE id = ?`,
          [scheduleDue, schedule.id]
        );
        paymentAmount -= needed;
      } else {
        const newPaid = Math.round((schedulePaid + paymentAmount) * 100) / 100;
        const newBalance = Math.round((scheduleDue - newPaid) * 100) / 100;
        const status = newBalance <= 0 ? 'paid' : 'partial';
        await db.run(
          `UPDATE payment_schedules 
           SET amount_paid = ?, balance = ?, payment_status = ? 
           WHERE id = ?`,
          [newPaid, newBalance, status, schedule.id]
        );
        paymentAmount = 0;
      }
    }
  }

  // 5. Update contract remaining balance and status
  const remainingBalance = totalAmount - downPayment - totalAllocated;
  const status = remainingBalance <= 0 ? 'completed' : 'active';

  await db.run(
    'UPDATE contracts SET remaining_balance = ?, status = ? WHERE id = ?',
    [Math.max(0, remainingBalance), status, contractId]
  );
}

async function getPayments(req, res) {
  try {
    const { search } = req.query;
    let sql = `
      SELECT p.*, cust.customer_name, c.contract_number, u.full_name as recorder_name
      FROM payments p
      JOIN customers cust ON p.customer_id = cust.id
      JOIN contracts c ON p.contract_id = c.id
      LEFT JOIN users u ON p.created_by = u.id
    `;
    let params = [];

    if (search) {
      sql += ` WHERE p.receipt_number LIKE ? 
                OR cust.customer_name LIKE ? 
                OR c.contract_number LIKE ? 
                OR p.reference_number LIKE ?`;
      const searchParam = `%${search}%`;
      params = [searchParam, searchParam, searchParam, searchParam];
    }

    sql += ' ORDER BY p.id DESC';
    const payments = await db.query(sql, params);
    res.json(payments);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve payments' });
  }
}

async function createPayment(req, res) {
  try {
    const {
      receiptNumber,
      customerId,
      contractId,
      paymentDate,
      amountPaid,
      paymentMethod,
      referenceNumber,
      remarks
    } = req.body;

    if (!receiptNumber || !customerId || !contractId || !paymentDate || !amountPaid || !paymentMethod) {
      return res.status(400).json({ error: 'Required fields: receiptNumber, customerId, contractId, paymentDate, amountPaid, paymentMethod' });
    }

    const checkReceipt = await db.query('SELECT id FROM payments WHERE receipt_number = ?', [receiptNumber]);
    if (checkReceipt.length > 0) {
      return res.status(400).json({ error: 'Receipt Number must be unique' });
    }

    const contract = await db.query('SELECT remaining_balance, status FROM contracts WHERE id = ?', [contractId]);
    if (contract.length === 0) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    if (contract[0].status === 'cancelled') {
      return res.status(400).json({ error: 'Cannot record payments on cancelled contracts' });
    }

    // Insert payment record
    const result = await db.run(
      `INSERT INTO payments 
       (receipt_number, customer_id, contract_id, payment_date, amount_paid, payment_method, reference_number, remarks, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [receiptNumber, customerId, contractId, paymentDate, amountPaid, paymentMethod, referenceNumber || null, remarks || null, req.user.id]
    );

    // Apply and rebuild schedules
    await rebuildSchedules(contractId);

    await logAudit(req.user.id, 'Record Payment', 'payments', result.insertId, { receiptNumber, amountPaid });

    res.status(201).json({ message: 'Payment recorded successfully', paymentId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to record payment' });
  }
}

async function voidPayment(req, res) {
  try {
    const { id } = req.params;

    const payment = await db.query('SELECT receipt_number, contract_id, amount_paid FROM payments WHERE id = ?', [id]);
    if (payment.length === 0) {
      return res.status(404).json({ error: 'Payment record not found' });
    }

    const { contract_id, receipt_number, amount_paid } = payment[0];

    // Delete payment record
    await db.run('DELETE FROM payments WHERE id = ?', [id]);

    // Recalculate schedule allocation without this payment
    await rebuildSchedules(contract_id);

    await logAudit(req.user.id, 'Void Payment', 'payments', id, { receiptNumber: receipt_number, amountPaid: amount_paid });

    res.json({ message: 'Payment voided successfully and schedules recalculated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to void payment' });
  }
}

module.exports = {
  getPayments,
  createPayment,
  voidPayment
};
