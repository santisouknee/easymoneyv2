const db = require('./db');
const bcrypt = require('bcryptjs');

async function setupTables() {
  const dbType = db.getDbType();
  console.log(`Setting up database tables for ${dbType}...`);

  const isMySQL = dbType === 'mysql';

  const queries = {
    users: isMySQL
      ? `CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          username VARCHAR(50) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          full_name VARCHAR(100) NOT NULL,
          email VARCHAR(100),
          role VARCHAR(20) DEFAULT 'staff',
          status VARCHAR(20) DEFAULT 'active',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )`
      : `CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          username TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          full_name TEXT NOT NULL,
          email TEXT,
          role TEXT DEFAULT 'staff',
          status TEXT DEFAULT 'active',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,

    customers: isMySQL
      ? `CREATE TABLE IF NOT EXISTS customers (
          id INT AUTO_INCREMENT PRIMARY KEY,
          customer_code VARCHAR(50) UNIQUE NOT NULL,
          customer_name VARCHAR(100) NOT NULL,
          phone_number VARCHAR(20) NOT NULL,
          email VARCHAR(100),
          address TEXT,
          national_id VARCHAR(50),
          status VARCHAR(20) DEFAULT 'active',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )`
      : `CREATE TABLE IF NOT EXISTS customers (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          customer_code TEXT UNIQUE NOT NULL,
          customer_name TEXT NOT NULL,
          phone_number TEXT NOT NULL,
          email TEXT,
          address TEXT,
          national_id TEXT,
          status TEXT DEFAULT 'active',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`,

    contracts: isMySQL
      ? `CREATE TABLE IF NOT EXISTS contracts (
          id INT AUTO_INCREMENT PRIMARY KEY,
          contract_number VARCHAR(50) UNIQUE NOT NULL,
          customer_id INT NOT NULL,
          product_service VARCHAR(255) NOT NULL,
          contract_date DATE NOT NULL,
          total_amount DECIMAL(12, 2) NOT NULL,
          down_payment_amount DECIMAL(12, 2) NOT NULL,
          remaining_balance DECIMAL(12, 2) NOT NULL,
          installment_period INT NOT NULL,
          start_date DATE NOT NULL,
          end_date DATE NOT NULL,
          status VARCHAR(20) DEFAULT 'active',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
        )`
      : `CREATE TABLE IF NOT EXISTS contracts (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          contract_number TEXT UNIQUE NOT NULL,
          customer_id INTEGER NOT NULL,
          product_service TEXT NOT NULL,
          contract_date TEXT NOT NULL,
          total_amount REAL NOT NULL,
          down_payment_amount REAL NOT NULL,
          remaining_balance REAL NOT NULL,
          installment_period INTEGER NOT NULL,
          start_date TEXT NOT NULL,
          end_date TEXT NOT NULL,
          status TEXT DEFAULT 'active',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
        )`,

    payment_schedules: isMySQL
      ? `CREATE TABLE IF NOT EXISTS payment_schedules (
          id INT AUTO_INCREMENT PRIMARY KEY,
          contract_id INT NOT NULL,
          due_date DATE NOT NULL,
          installment_number INT NOT NULL,
          amount_due DECIMAL(12, 2) NOT NULL,
          amount_paid DECIMAL(12, 2) DEFAULT 0.00,
          balance DECIMAL(12, 2) NOT NULL,
          payment_status VARCHAR(20) DEFAULT 'pending',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE
        )`
      : `CREATE TABLE IF NOT EXISTS payment_schedules (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          contract_id INTEGER NOT NULL,
          due_date TEXT NOT NULL,
          installment_number INTEGER NOT NULL,
          amount_due REAL NOT NULL,
          amount_paid REAL DEFAULT 0.00,
          balance REAL NOT NULL,
          payment_status TEXT DEFAULT 'pending',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE
        )`,

    payments: isMySQL
      ? `CREATE TABLE IF NOT EXISTS payments (
          id INT AUTO_INCREMENT PRIMARY KEY,
          receipt_number VARCHAR(50) UNIQUE NOT NULL,
          customer_id INT NOT NULL,
          contract_id INT NOT NULL,
          payment_date DATE NOT NULL,
          amount_paid DECIMAL(12, 2) NOT NULL,
          payment_method VARCHAR(50) NOT NULL,
          reference_number VARCHAR(100),
          remarks TEXT,
          created_by INT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
          FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE,
          FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
        )`
      : `CREATE TABLE IF NOT EXISTS payments (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          receipt_number TEXT UNIQUE NOT NULL,
          customer_id INTEGER NOT NULL,
          contract_id INTEGER NOT NULL,
          payment_date TEXT NOT NULL,
          amount_paid REAL NOT NULL,
          payment_method TEXT NOT NULL,
          reference_number TEXT,
          remarks TEXT,
          created_by INTEGER,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
          FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE,
          FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
        )`,

    reminders: isMySQL
      ? `CREATE TABLE IF NOT EXISTS reminders (
          id INT AUTO_INCREMENT PRIMARY KEY,
          contract_id INT NOT NULL,
          schedule_id INT NOT NULL,
          reminder_type VARCHAR(50) NOT NULL,
          status VARCHAR(20) DEFAULT 'pending',
          sent_at TIMESTAMP NULL DEFAULT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE,
          FOREIGN KEY (schedule_id) REFERENCES payment_schedules(id) ON DELETE CASCADE
        )`
      : `CREATE TABLE IF NOT EXISTS reminders (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          contract_id INTEGER NOT NULL,
          schedule_id INTEGER NOT NULL,
          reminder_type TEXT NOT NULL,
          status TEXT DEFAULT 'pending',
          sent_at TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (contract_id) REFERENCES contracts(id) ON DELETE CASCADE,
          FOREIGN KEY (schedule_id) REFERENCES payment_schedules(id) ON DELETE CASCADE
        )`,

    audit_logs: isMySQL
      ? `CREATE TABLE IF NOT EXISTS audit_logs (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT,
          action VARCHAR(100) NOT NULL,
          target_table VARCHAR(100),
          target_id INT,
          details TEXT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
        )`
      : `CREATE TABLE IF NOT EXISTS audit_logs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          user_id INTEGER,
          action TEXT NOT NULL,
          target_table TEXT,
          target_id INTEGER,
          details TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
        )`
  };

  // Run creations sequentially
  for (const [name, queryText] of Object.entries(queries)) {
    try {
      await db.run(queryText);
      console.log(`Table "${name}" setup completed.`);
    } catch (err) {
      console.error(`Error setting up table "${name}":`, err.message);
    }
  }

  // Seed default users if users table is empty
  const users = await db.query('SELECT COUNT(*) as count FROM users');
  const count = users[0].count || users[0]['COUNT(*)'] || 0;
  if (count === 0) {
    console.log('Seeding default users...');
    const adminHash = await bcrypt.hash('password123', 10);
    const staffHash = await bcrypt.hash('password123', 10);

    await db.run(
      'INSERT INTO users (username, password_hash, full_name, email, role, status) VALUES (?, ?, ?, ?, ?, ?)',
      ['admin', adminHash, 'System Administrator', 'admin@easymoney.com', 'admin', 'active']
    );

    await db.run(
      'INSERT INTO users (username, password_hash, full_name, email, role, status) VALUES (?, ?, ?, ?, ?, ?)',
      ['staff', staffHash, 'Staff Member', 'staff@easymoney.com', 'staff', 'active']
    );

    console.log('Default users seeded successfully (admin / password123, staff / password123).');
  }
}

module.exports = { setupTables };
