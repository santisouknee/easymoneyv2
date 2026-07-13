const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Failed to open database:', err.message);
    process.exit(1);
  }
});

// Helper to run query with promises
function query(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) return reject(err);
      resolve(rows);
    });
  });
}

async function run() {
  try {
    console.log(`\n==================================================================`);
    console.log(`🔍 DATABASE INSPECTOR (SQLite Mode: ${dbPath})`);
    console.log(`==================================================================`);

    console.log('\n👤 1. USER ACCOUNTS (users table):');
    const users = await query('SELECT id, username, full_name, email, role, status FROM users');
    console.table(users);

    console.log('\n🤝 2. CUSTOMERS (customers table):');
    const customers = await query('SELECT id, customer_code, customer_name, phone_number, status FROM customers LIMIT 10');
    console.table(customers);

    console.log('\n📄 3. CONTRACTS (contracts table):');
    const contracts = await query('SELECT id, contract_number, product_service, total_amount, remaining_balance, status FROM contracts LIMIT 10');
    console.table(contracts);

    console.log('\n💳 4. RECENT PAYMENTS (payments table):');
    const payments = await query('SELECT id, receipt_number, amount_paid, payment_method, payment_date FROM payments ORDER BY id DESC LIMIT 10');
    console.table(payments);

    console.log(`==================================================================`);
  } catch (err) {
    console.error('Error querying database:', err.message);
  } finally {
    db.close();
  }
}

run();
