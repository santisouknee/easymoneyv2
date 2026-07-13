const db = require('../config/db');

// Helper to calculate days between two dates
function getDaysBetween(d1, d2) {
  const diffTime = Math.abs(d2 - d1);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

async function getDailyDashboard(req, res) {
  try {
    const today = new Date().toISOString().split('T')[0];

    // 1. Today's Due Payments
    const dueToday = await db.query(
      `SELECT ps.*, c.contract_number, cust.customer_name 
       FROM payment_schedules ps
       JOIN contracts c ON ps.contract_id = c.id
       JOIN customers cust ON c.customer_id = cust.id
       WHERE ps.due_date = ?`,
      [today]
    );

    // 2. Today's Collection summary
    // Total due today (expected amount)
    let totalDueToday = 0;
    let totalCollectedToday = 0;
    
    dueToday.forEach(item => {
      totalDueToday += parseFloat(item.amount_due);
      totalCollectedToday += parseFloat(item.amount_paid);
    });

    const remainingAmount = totalDueToday - totalCollectedToday;
    const collectionPercentage = totalDueToday > 0 ? Math.round((totalCollectedToday / totalDueToday) * 100) : 0;

    // 3. Overdue Payments
    const overdueList = await db.query(
      `SELECT ps.*, c.contract_number, cust.customer_name, cust.phone_number 
       FROM payment_schedules ps
       JOIN contracts c ON ps.contract_id = c.id
       JOIN customers cust ON c.customer_id = cust.id
       WHERE ps.due_date < ? AND ps.payment_status != 'paid' AND c.status = 'active'
       ORDER BY ps.due_date ASC`,
      [today]
    );

    // Calculate days late for each overdue item
    const todayMs = new Date(today).getTime();
    const overdue = overdueList.map(item => {
      const dueMs = new Date(item.due_date).getTime();
      return {
        ...item,
        daysLate: getDaysBetween(dueMs, todayMs)
      };
    });

    res.json({
      todayDue: dueToday,
      collectionSummary: {
        totalDueToday,
        totalCollectedToday,
        remainingAmount,
        collectionPercentage
      },
      overdue
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load daily dashboard data' });
  }
}

async function getMonthlyDashboard(req, res) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = today.substring(0, 7); // YYYY-MM
    const isMySQL = db.getDbType() === 'mysql';

    // 1. KPI Cards
    const totalContractsResult = await db.query('SELECT COUNT(*) as count FROM contracts');
    const totalContracts = totalContractsResult[0].count || totalContractsResult[0]['COUNT(*)'] || 0;

    const activeContractsResult = await db.query('SELECT COUNT(*) as count FROM contracts WHERE status = "active"');
    const activeContracts = activeContractsResult[0].count || activeContractsResult[0]['COUNT(*)'] || 0;

    // Monthly due / collected (using schedules due in this month)
    const monthlySchedules = await db.query(
      `SELECT amount_due, amount_paid, payment_status, due_date FROM payment_schedules`
    );

    let monthlyDueAmount = 0;
    let monthlyCollectedAmount = 0;
    let overdueAmount = 0;
    let outstandingAmount = 0;

    monthlySchedules.forEach(item => {
      const scheduleMonth = item.due_date.substring(0, 7);
      const isOverdue = item.due_date < today && item.payment_status !== 'paid';

      if (scheduleMonth === currentMonth) {
        monthlyDueAmount += parseFloat(item.amount_due);
        monthlyCollectedAmount += parseFloat(item.amount_paid);
      }

      if (isOverdue) {
        overdueAmount += (parseFloat(item.amount_due) - parseFloat(item.amount_paid));
      }

      outstandingAmount += (parseFloat(item.amount_due) - parseFloat(item.amount_paid));
    });

    // 2. Charts Data
    // Collection Trend last 12 months
    const monthFormatQuery = isMySQL
      ? "DATE_FORMAT(payment_date, '%Y-%m')"
      : "strftime('%Y-%m', payment_date)";
      
    const collectionsTrend = await db.query(
      `SELECT ${monthFormatQuery} as month, SUM(amount_paid) as total 
       FROM payments 
       GROUP BY month 
       ORDER BY month DESC 
       LIMIT 12`
    );

    // Outstanding Balance trend (grouped by schedule due_date month)
    const scheduleMonthFormat = isMySQL
      ? "DATE_FORMAT(due_date, '%Y-%m')"
      : "strftime('%Y-%m', due_date)";

    const outstandingTrend = await db.query(
      `SELECT ${scheduleMonthFormat} as month, SUM(amount_due - amount_paid) as total
       FROM payment_schedules
       WHERE payment_status != 'paid'
       GROUP BY month
       ORDER BY month ASC
       LIMIT 12`
    );

    // Payment Status Distribution
    const statusDistribution = await db.query(
      `SELECT payment_status as status, COUNT(*) as count 
       FROM payment_schedules 
       GROUP BY payment_status`
    );

    // Add virtual overdue status count
    const statusCounts = { paid: 0, pending: 0, partial: 0, overdue: 0 };
    monthlySchedules.forEach(item => {
      if (item.due_date < today && item.payment_status !== 'paid') {
        statusCounts.overdue += 1;
      } else {
        statusCounts[item.payment_status] = (statusCounts[item.payment_status] || 0) + 1;
      }
    });

    // Top Customers by outstanding balance
    const topCustomers = await db.query(
      `SELECT cust.customer_name, SUM(ps.amount_due - ps.amount_paid) as outstanding
       FROM payment_schedules ps
       JOIN contracts c ON ps.contract_id = c.id
       JOIN customers cust ON c.customer_id = cust.id
       WHERE ps.payment_status != 'paid'
       GROUP BY cust.id
       ORDER BY outstanding DESC
       LIMIT 5`
    );

    res.json({
      kpis: {
        totalContracts,
        activeContracts,
        monthlyDueAmount,
        monthlyCollectedAmount,
        outstandingAmount,
        overdueAmount
      },
      charts: {
        collectionsTrend: collectionsTrend.reverse(),
        outstandingTrend,
        statusDistribution: [
          { status: 'Paid', count: statusCounts.paid },
          { status: 'Pending', count: statusCounts.pending },
          { status: 'Partial', count: statusCounts.partial },
          { status: 'Overdue', count: statusCounts.overdue }
        ],
        topCustomers
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load monthly dashboard data' });
  }
}

module.exports = {
  getDailyDashboard,
  getMonthlyDashboard
};
