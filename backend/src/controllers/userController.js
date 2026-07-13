const db = require('../config/db');
const bcrypt = require('bcryptjs');
const { logAudit } = require('../utils/logger');

async function getUsers(req, res) {
  try {
    const users = await db.query('SELECT id, username, full_name, email, role, status, created_at FROM users ORDER BY id DESC');
    res.json(users);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve users' });
  }
}

async function createUser(req, res) {
  try {
    const { username, password, fullName, email, role, status } = req.body;
    if (!username || !password || !fullName || !role) {
      return res.status(400).json({ error: 'Username, password, fullName, and role are required' });
    }

    const checkUser = await db.query('SELECT id FROM users WHERE username = ?', [username]);
    if (checkUser.length > 0) {
      return res.status(400).json({ error: 'Username is already taken' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const result = await db.run(
      'INSERT INTO users (username, password_hash, full_name, email, role, status) VALUES (?, ?, ?, ?, ?, ?)',
      [username, passwordHash, fullName, email || null, role, status || 'active']
    );

    await logAudit(req.user.id, 'Create User', 'users', result.insertId, { username, role });

    res.status(201).json({ message: 'User created successfully', userId: result.insertId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create user' });
  }
}

async function updateUser(req, res) {
  try {
    const { id } = req.params;
    const { fullName, email, role, status, password } = req.body;

    const user = await db.query('SELECT id FROM users WHERE id = ?', [id]);
    if (user.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    let queryStr = 'UPDATE users SET full_name = ?, email = ?, role = ?, status = ?';
    let params = [fullName, email || null, role, status || 'active'];

    if (password && password.trim() !== '') {
      const passwordHash = await bcrypt.hash(password, 10);
      queryStr += ', password_hash = ?';
      params.push(passwordHash);
    }

    queryStr += ' WHERE id = ?';
    params.push(id);

    await db.run(queryStr, params);

    await logAudit(req.user.id, 'Update User', 'users', id, { fullName, role, status });

    res.json({ message: 'User updated successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update user' });
  }
}

async function deleteUser(req, res) {
  try {
    const { id } = req.params;

    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'You cannot delete your own user account' });
    }

    const user = await db.query('SELECT id, username FROM users WHERE id = ?', [id]);
    if (user.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    await db.run('DELETE FROM users WHERE id = ?', [id]);

    await logAudit(req.user.id, 'Delete User', 'users', id, { username: user[0].username });

    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete user' });
  }
}

module.exports = {
  getUsers,
  createUser,
  updateUser,
  deleteUser
};
