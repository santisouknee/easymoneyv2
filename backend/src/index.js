const express = require('express');
const cors = require('cors');
require('dotenv').config();

const db = require('./config/db');
const { setupTables } = require('./config/schema');
const apiRouter = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*', // Allow all origins for local dev / easy configuration
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

// Main entry init
async function bootstrap() {
  try {
    // 1. Initialize database connection (MySQL or SQLite fallback)
    await db.initDb();
    
    // 2. Build tables and seed basic data
    await setupTables();
    
    // 3. Setup Routes
    app.use('/api', apiRouter);

    // Default route
    app.get('/', (req, res) => {
      res.json({ message: 'Welcome to the Easy Money SME Down Payment Tracking API' });
    });

    // Global Error Handler
    app.use((err, req, res, next) => {
      console.error(err.stack);
      res.status(500).json({ error: 'Something went wrong on the server' });
    });

    // Start Server
    app.listen(PORT, () => {
      console.log(`==================================================`);
      console.log(`🚀 Server is running on http://localhost:${PORT}`);
      console.log(`🛡️  JWT Authentication and Audit Logging active`);
      console.log(`==================================================`);
    });
  } catch (err) {
    console.error('Failed to bootstrap server:', err.message);
    process.exit(1);
  }
}

bootstrap();
