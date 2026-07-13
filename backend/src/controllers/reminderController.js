const db = require('../config/db');

async function getReminderList(req, res) {
  try {
    const today = new Date().toISOString().split('T')[0];

    // Helper function to build date offset strings for MySQL and SQLite
    const isMySQL = db.getDbType() === 'mysql';
    
    // Dates for checking
    const in3Days = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const in7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    const sqlBase = `
      SELECT ps.*, c.contract_number, cust.customer_name, cust.phone_number, cust.email
      FROM payment_schedules ps
      JOIN contracts c ON ps.contract_id = c.id
      JOIN customers cust ON c.customer_id = cust.id
      WHERE ps.payment_status != 'paid' AND c.status = 'active'
    `;

    // 1. Overdue (due_date < today)
    const overdue = await db.query(
      `${sqlBase} AND ps.due_date < ? ORDER BY ps.due_date ASC`,
      [today]
    );

    // 2. Due Today (due_date = today)
    const dueToday = await db.query(
      `${sqlBase} AND ps.due_date = ? ORDER BY ps.due_date ASC`,
      [today]
    );

    // 3. Due in 3 days (due_date = in3Days)
    const dueIn3Days = await db.query(
      `${sqlBase} AND ps.due_date = ? ORDER BY ps.due_date ASC`,
      [in3Days]
    );

    // 4. Due in 7 days (due_date = in7Days)
    const dueIn7Days = await db.query(
      `${sqlBase} AND ps.due_date = ? ORDER BY ps.due_date ASC`,
      [in7Days]
    );

    res.json({
      overdue,
      dueToday,
      dueIn3Days,
      dueIn7Days
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve reminders' });
  }
}

module.exports = {
  getReminderList
};
