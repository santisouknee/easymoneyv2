const db = require('../config/db');
const { logAudit } = require('../utils/logger');

// Helper to add months to a date string accurately
function addMonths(dateStr, months) {
  const d = new Date(dateStr);
  const originalDay = d.getDate();
  d.setMonth(d.getMonth() + months);
  
  // Adjust for month end overflow (e.g. Jan 31st + 1 month -> Feb 28/29)
  if (d.getDate() !== originalDay) {
    d.setDate(0);
  }
  return d.toISOString().split('T')[0];
}

async function getContracts(req, res) {
  try {
    const { search, status } = req.query;
    let sql = `
      SELECT c.*, cust.customer_name, cust.phone_number
      FROM contracts c
      JOIN customers cust ON c.customer_id = cust.id
    `;
    let params = [];
    let conditions = [];

    if (search) {
      conditions.push('(c.contract_number LIKE ? OR cust.customer_name LIKE ? OR cust.phone_number LIKE ?)');
      const searchParam = `%${search}%`;
      params.push(searchParam, searchParam, searchParam);
    }

    if (status) {
      conditions.push('c.status = ?');
      params.push(status);
    }

    if (conditions.length > 0) {
      sql += ' WHERE ' + conditions.join(' AND ');
    }

    sql += ' ORDER BY c.id DESC';
    const contracts = await db.query(sql, params);
    res.json(contracts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve contracts' });
  }
}

async function getContractById(req, res) {
  try {
    const { id } = req.params;
    const contracts = await db.query(
      `SELECT c.*, cust.customer_name, cust.phone_number, cust.customer_code
       FROM contracts c 
       JOIN customers cust ON c.customer_id = cust.id 
       WHERE c.id = ?`, 
      [id]
    );

    if (contracts.length === 0) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    const schedules = await db.query(
      'SELECT * FROM payment_schedules WHERE contract_id = ? ORDER BY installment_number ASC',
      [id]
    );

    const payments = await db.query(
      'SELECT p.*, u.full_name as recorder_name FROM payments p LEFT JOIN users u ON p.created_by = u.id WHERE p.contract_id = ? ORDER BY p.id DESC',
      [id]
    );

    res.json({
      contract: contracts[0],
      schedules,
      payments
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve contract details' });
  }
}

async function createContract(req, res) {
  try {
    const {
      contractNumber,
      customerId,
      productService,
      contractDate,
      totalAmount,
      downPaymentAmount,
      installmentPeriod,
      startDate,
      interestRate
    } = req.body;

    if (!contractNumber || !customerId || !productService || !contractDate || totalAmount === undefined || downPaymentAmount === undefined || !installmentPeriod || !startDate) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const checkNo = await db.query('SELECT id FROM contracts WHERE contract_number = ?', [contractNumber]);
    if (checkNo.length > 0) {
      return res.status(400).json({ error: 'Contract Number must be unique' });
    }

    const principal = parseFloat(totalAmount) - parseFloat(downPaymentAmount);
    if (principal < 0) {
      return res.status(400).json({ error: 'Down payment cannot exceed total contract amount' });
    }

    const interest = principal * (parseFloat(interestRate || 0) / 100) * (parseInt(installmentPeriod) / 365);
    const remainingBalance = Math.round((principal + interest) * 100) / 100;

    // Helper to add days to a date string
    const addDays = (dateStr, days) => {
      const d = new Date(dateStr);
      d.setDate(d.getDate() + days);
      return d.toISOString().split('T')[0];
    };

    const endDate = addDays(startDate, parseInt(installmentPeriod));

    const result = await db.run(
      `INSERT INTO contracts 
       (contract_number, customer_id, product_service, contract_date, total_amount, down_payment_amount, remaining_balance, installment_period, start_date, end_date, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active')`,
      [contractNumber, customerId, productService, contractDate, totalAmount, downPaymentAmount, remainingBalance, installmentPeriod, startDate, endDate]
    );

    const contractId = result.insertId;

    // Generate installments
    const baseInstallmentAmount = Math.floor((remainingBalance / installmentPeriod) * 100) / 100;
    let sumGenerated = 0;

    for (let i = 1; i <= installmentPeriod; i++) {
      let amountDue = baseInstallmentAmount;
      
      // Add remainder to final installment to prevent float loss
      if (i === parseInt(installmentPeriod)) {
        amountDue = Math.round((remainingBalance - sumGenerated) * 100) / 100;
      } else {
        sumGenerated += baseInstallmentAmount;
      }

      const dueDate = addDays(startDate, i);

      await db.run(
        `INSERT INTO payment_schedules (contract_id, due_date, installment_number, amount_due, amount_paid, balance, payment_status)
         VALUES (?, ?, ?, ?, 0.00, ?, 'pending')`,
        [contractId, dueDate, i, amountDue, amountDue]
      );
    }

    await logAudit(req.user.id, 'Create Contract', 'contracts', contractId, { contractNumber, totalAmount });

    res.status(201).json({ message: 'Contract and payment schedule created successfully', contractId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create contract' });
  }
}

async function updateContractStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body; // active, completed, cancelled, overdue

    if (!['active', 'completed', 'cancelled', 'overdue'].includes(status)) {
      return res.status(400).json({ error: 'Invalid contract status' });
    }

    await db.run('UPDATE contracts SET status = ? WHERE id = ?', [status, id]);

    await logAudit(req.user.id, 'Update Contract Status', 'contracts', id, { status });

    res.json({ message: 'Contract status updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update contract status' });
  }
}

async function deleteContract(req, res) {
  try {
    const { id } = req.params;

    const contract = await db.query('SELECT contract_number FROM contracts WHERE id = ?', [id]);
    if (contract.length === 0) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    // Checking if payments exist
    const payments = await db.query('SELECT id FROM payments WHERE contract_id = ?', [id]);
    if (payments.length > 0) {
      return res.status(400).json({ error: 'Cannot delete contract with completed payments. Void payments first.' });
    }

    await db.run('DELETE FROM contracts WHERE id = ?', [id]);

    await logAudit(req.user.id, 'Delete Contract', 'contracts', id, { contractNumber: contract[0].contract_number });

    res.json({ message: 'Contract deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete contract' });
  }
}

module.exports = {
  getContracts,
  getContractById,
  createContract,
  updateContractStatus,
  deleteContract
};
