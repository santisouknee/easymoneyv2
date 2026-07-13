const mysql = require('mysql2/promise');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const dbType = process.env.DB_TYPE || 'mysql';
let pool = null;
let sqliteDb = null;

async function initDb() {
  if (dbType === 'mysql') {
    try {
      // First try to connect without database to create it if it doesn't exist
      const conn = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
      });
      await conn.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME || 'easymoney'}\``);
      await conn.end();

      // Now create the pool
      pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'easymoney',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
      });
      console.log('MySQL Database Connected Successfully.');
    } catch (err) {
      console.warn('MySQL connection failed. Falling back to SQLite for local development.', err.message);
      setupSQLite();
    }
  } else {
    setupSQLite();
  }
}

function setupSQLite() {
  const dbPath = path.join(__dirname, '../../database.sqlite');
  sqliteDb = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error('Failed to open SQLite database:', err.message);
    } else {
      console.log('SQLite Database Connected (Fallback/Local Mode) at:', dbPath);
    }
  });
}

async function query(sql, params = []) {
  if (!pool && !sqliteDb) {
    await initDb();
  }

  // Convert MySQL query placeholders (?) to SQLite if needed (both use ? by default)
  if (pool) {
    const [rows] = await pool.execute(sql, params);
    return rows;
  } else if (sqliteDb) {
    return new Promise((resolve, reject) => {
      sqliteDb.all(sql, params, (err, rows) => {
        if (err) return reject(err);
        resolve(rows);
      });
    });
  } else {
    throw new Error('No database connection available');
  }
}

async function run(sql, params = []) {
  if (!pool && !sqliteDb) {
    await initDb();
  }

  if (pool) {
    const [result] = await pool.execute(sql, params);
    return { insertId: result.insertId, affectedRows: result.affectedRows };
  } else if (sqliteDb) {
    return new Promise((resolve, reject) => {
      sqliteDb.run(sql, params, function (err) {
        if (err) return reject(err);
        resolve({ insertId: this.lastID, affectedRows: this.changes });
      });
    });
  } else {
    throw new Error('No database connection available');
  }
}

module.exports = {
  initDb,
  query,
  run,
  getDbType: () => (pool ? 'mysql' : 'sqlite')
};
