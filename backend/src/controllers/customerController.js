const db = require('../config/db');
const { logAudit } = require('../utils/logger');

async function getCustomers(req, res) {
  try {
    const { search } = req.query;
    let sql = 'SELECT * FROM customers';
    let params = [];

    if (search) {
      sql += ' WHERE customer_name LIKE ? OR customer_code LIKE ? OR phone_number LIKE ? OR national_id LIKE ?';
      const searchParam = `%${search}%`;
      params = [searchParam, searchParam, searchParam, searchParam];
    }
    
    sql += ' ORDER BY id DESC';
    const customers = await db.query(sql, params);
    res.json(customers);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve customers' });
  }
}

async function getCustomerById(req, res) {
  try {
    const { id } = req.params;
    const customers = await db.query('SELECT * FROM customers WHERE id = ?', [id]);
    if (customers.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    res.json(customers[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve customer details' });
  }
}

async function createCustomer(req, res) {
  try {
    const { customerCode, customerName, phoneNumber, email, address, nationalId, status } = req.body;
    if (!customerCode || !customerName || !phoneNumber) {
      return res.status(400).json({ error: 'Customer Code, Name, and Phone Number are required' });
    }

    const checkCode = await db.query('SELECT id FROM customers WHERE customer_code = ?', [customerCode]);
    if (checkCode.length > 0) {
      return res.status(400).json({ error: 'Customer Code must be unique' });
    }

    const result = await db.run(
      'INSERT INTO customers (customer_code, customer_name, phone_number, email, address, national_id, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [customerCode, customerName, phoneNumber, email || null, address || null, nationalId || null, status || 'active']
    );

    await logAudit(req.user.id, 'Create Customer', 'customers', result.insertId, { customerCode, customerName });

    res.status(201).json({ message: 'Customer created successfully', customerId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create customer' });
  }
}

async function updateCustomer(req, res) {
  try {
    const { id } = req.params;
    const { customerCode, customerName, phoneNumber, email, address, nationalId, status } = req.body;

    if (!customerCode || !customerName || !phoneNumber) {
      return res.status(400).json({ error: 'Customer Code, Name, and Phone Number are required' });
    }

    const checkCode = await db.query('SELECT id FROM customers WHERE customer_code = ? AND id != ?', [customerCode, id]);
    if (checkCode.length > 0) {
      return res.status(400).json({ error: 'Customer Code must be unique' });
    }

    await db.run(
      'UPDATE customers SET customer_code = ?, customer_name = ?, phone_number = ?, email = ?, address = ?, national_id = ?, status = ? WHERE id = ?',
      [customerCode, customerName, phoneNumber, email || null, address || null, nationalId || null, status || 'active', id]
    );

    await logAudit(req.user.id, 'Update Customer', 'customers', id, { customerCode, customerName, status });

    res.json({ message: 'Customer updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update customer' });
  }
}

async function deleteCustomer(req, res) {
  try {
    const { id } = req.params;

    const checkContracts = await db.query('SELECT id FROM contracts WHERE customer_id = ?', [id]);
    if (checkContracts.length > 0) {
      return res.status(400).json({ error: 'Cannot delete customer with active contracts' });
    }

    const customer = await db.query('SELECT customer_code, customer_name FROM customers WHERE id = ?', [id]);
    if (customer.length === 0) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    await db.run('DELETE FROM customers WHERE id = ?', [id]);

    await logAudit(req.user.id, 'Delete Customer', 'customers', id, { customerCode: customer[0].customer_code });

    res.json({ message: 'Customer deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete customer' });
  }
}

module.exports = {
  getCustomers,
  getCustomerById,
  createCustomer,
  updateCustomer,
  deleteCustomer
};
