const db = require('../config/db');

async function logAudit(userId, action, targetTable, targetId, details) {
  try {
    const detailStr = typeof details === 'object' ? JSON.stringify(details) : details;
    await db.run(
      'INSERT INTO audit_logs (user_id, action, target_table, target_id, details) VALUES (?, ?, ?, ?, ?)',
      [userId || null, action, targetTable || null, targetId || null, detailStr || null]
    );
  } catch (err) {
    console.error('Failed to write audit log:', err.message);
  }
}

module.exports = { logAudit };
