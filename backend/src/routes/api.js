const express = require('express');
const router = express.Router();

const { authenticateToken, requireRole } = require('../middleware/auth');

// Controllers
const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const customerController = require('../controllers/customerController');
const contractController = require('../controllers/contractController');
const paymentController = require('../controllers/paymentController');
const reminderController = require('../controllers/reminderController');
const dashboardController = require('../controllers/dashboardController');
const reportController = require('../controllers/reportController');

// --- Auth Routes ---
router.post('/auth/login', authController.login);
router.get('/auth/me', authenticateToken, authController.getMe);

// --- User Management (Admin Only) ---
router.get('/users', authenticateToken, requireRole(['admin']), userController.getUsers);
router.post('/users', authenticateToken, requireRole(['admin']), userController.createUser);
router.put('/users/:id', authenticateToken, requireRole(['admin']), userController.updateUser);
router.delete('/users/:id', authenticateToken, requireRole(['admin']), userController.deleteUser);

// --- Customer Management ---
router.get('/customers', authenticateToken, customerController.getCustomers);
router.get('/customers/:id', authenticateToken, customerController.getCustomerById);
router.post('/customers', authenticateToken, customerController.createCustomer);
router.put('/customers/:id', authenticateToken, customerController.updateCustomer);
router.delete('/customers/:id', authenticateToken, requireRole(['admin']), customerController.deleteCustomer); // Admin only delete

// --- Contract / Order Management ---
router.get('/contracts', authenticateToken, contractController.getContracts);
router.get('/contracts/:id', authenticateToken, contractController.getContractById);
router.post('/contracts', authenticateToken, contractController.createContract);
router.put('/contracts/:id/status', authenticateToken, requireRole(['admin']), contractController.updateContractStatus);
router.delete('/contracts/:id', authenticateToken, requireRole(['admin']), contractController.deleteContract);

// --- Payments Collection ---
router.get('/payments', authenticateToken, paymentController.getPayments);
router.post('/payments', authenticateToken, paymentController.createPayment);
router.delete('/payments/:id', authenticateToken, requireRole(['admin']), paymentController.voidPayment); // Void is admin-only

// --- Reminders ---
router.get('/reminders', authenticateToken, reminderController.getReminderList);

// --- Dashboard ---
router.get('/dashboard/daily', authenticateToken, dashboardController.getDailyDashboard);
router.get('/dashboard/monthly', authenticateToken, dashboardController.getMonthlyDashboard);
router.get('/dashboard/cashflow', authenticateToken, dashboardController.getCashFlow);

// --- Reports ---
router.get('/reports/daily', authenticateToken, reportController.getDailyCollectionReport);
router.get('/reports/monthly', authenticateToken, reportController.getMonthlyCollectionReport);
router.get('/reports/overdue', authenticateToken, reportController.getOverdueReport);
router.get('/reports/statement/:customerId', authenticateToken, reportController.getCustomerStatement);

module.exports = router;
