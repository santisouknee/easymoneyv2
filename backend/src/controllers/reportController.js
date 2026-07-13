const db = require('../config/db');

// Helper to calculate days overdue
function getDaysBetween(d1, d2) {
  const diffTime = Math.abs(d2 - d1);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

async function getDailyCollectionReport(req, res) {
  try {
    const { date, customerId, contractId } = req.query;
    const filterDate = date || new Date().toISOString().split('T')[0];

    let sql = `
      SELECT p.*, cust.customer_name, c.contract_number
      FROM payments p
      JOIN customers cust ON p.customer_id = cust.id
      JOIN contracts c ON p.contract_id = c.id
      WHERE p.payment_date = ?
    `;
    let params = [filterDate];

    if (customerId) {
      sql += ' AND p.customer_id = ?';
      params.push(customerId);
    }
    if (contractId) {
      sql += ' AND p.contract_id = ?';
      params.push(contractId);
    }

    sql += ' ORDER BY p.id DESC';
    const report = await db.query(sql, params);
    res.json(report);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate daily collection report' });
  }
}

async function getMonthlyCollectionReport(req, res) {
  try {
    const { year, month } = req.query;
    
    // Default to current month
    const filterYear = year || new Date().getFullYear();
    const filterMonth = month || String(new Date().getMonth() + 1).padStart(2, '0');
    const monthStr = `${filterYear}-${filterMonth}`;

    // Get all schedules due in that month
    const schedules = await db.query(
      `SELECT ps.*, c.contract_number, cust.customer_name 
       FROM payment_schedules ps
       JOIN contracts c ON ps.contract_id = c.id
       JOIN customers cust ON c.customer_id = cust.id
       WHERE ps.due_date LIKE ?`,
      [`${monthStr}%`]
    );

    let totalDue = 0;
    let totalCollected = 0;

    schedules.forEach(item => {
      totalDue += parseFloat(item.amount_due);
      totalCollected += parseFloat(item.amount_paid);
    });

    res.json({
      details: schedules,
      summary: {
        month: monthStr,
        totalDue,
        totalCollected,
        outstanding: totalDue - totalCollected
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate monthly collection report' });
  }
}

async function getOverdueReport(req, res) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const todayMs = new Date(today).getTime();

    const overdueSchedules = await db.query(
      `SELECT ps.*, c.contract_number, cust.customer_name, cust.phone_number
       FROM payment_schedules ps
       JOIN contracts c ON ps.contract_id = c.id
       JOIN customers cust ON c.customer_id = cust.id
       WHERE ps.due_date < ? AND ps.payment_status != 'paid' AND c.status = 'active'
       ORDER BY ps.due_date ASC`,
      [today]
    );

    const report = overdueSchedules.map(item => {
      const dueMs = new Date(item.due_date).getTime();
      return {
        ...item,
        amountOutstanding: parseFloat(item.amount_due) - parseFloat(item.amount_paid),
        daysOverdue: getDaysBetween(dueMs, todayMs)
      };
    });

    res.json(report);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate overdue report' });
  }
}

async function getCustomerStatement(req, res) {
  try {
    const { customerId } = req.params;

    const customer = await db.query('SELECT * FROM customers WHERE id = ?', [customerId]);
    if (customer.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    const contracts = await db.query(
      'SELECT * FROM contracts WHERE customer_id = ? ORDER BY id DESC',
      [customerId]
    );

    const statementDetails = [];

    for (const contract of contracts) {
      const payments = await db.query(
        'SELECT * FROM payments WHERE contract_id = ? ORDER BY payment_date ASC, id ASC',
        [contract.id]
      );

      const schedules = await db.query(
        'SELECT * FROM payment_schedules WHERE contract_id = ? ORDER BY installment_number ASC',
        [contract.id]
      );

      statementDetails.push({
        contract,
        payments,
        schedules
      });
    }

    res.json({
      customer: customer[0],
      statements: statementDetails
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve customer statement' });
  }
}

module.exports = {
  getDailyCollectionReport,
  getMonthlyCollectionReport,
  getOverdueReport,
  getCustomerStatement
};
