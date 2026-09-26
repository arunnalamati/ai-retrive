require('dotenv').config();
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

// Import route handlers
const authRoutes = require('./routes/authRoutes');
const farmerRoutes = require('./routes/farmerRoutes');
const cropRoutes = require('./routes/cropRoutes');

// Initialize Express App
const app = express();

// Connect to Database
connectDB();

// Middleware
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g. Postman, mobile) or any localhost / 127.0.0.1 port
    if (!origin || /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root Information & Health Check
app.get('/', (req, res) => {
  res.json({
    project: 'Farmer Crop Information Portal API',
    status: 'Running',
    version: '1.0.0',
    documentation: {
      auth: ['POST /api/register', 'POST /api/login', 'GET /api/me'],
      farmers: ['GET /api/farmers', 'POST /api/farmers', 'PUT /api/farmers/:id', 'DELETE /api/farmers/:id'],
      crops: ['GET /api/crops', 'POST /api/crops', 'PUT /api/crops/:id', 'DELETE /api/crops/:id', 'GET /api/crops/stats/summary'],
    },
  });
});

app.get('/api', (req, res) => {
  res.json({ status: 'API is healthy and online' });
});

// Primary API Routes
app.use('/api', authRoutes);
app.use('/api/farmers', farmerRoutes);
app.use('/api/crops', cropRoutes);

// Route Aliases to satisfy root-level paths if called without /api
app.use('/', authRoutes);
app.use('/farmers', farmerRoutes);
app.use('/crops', cropRoutes);

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({
    success: false,
    message: `API endpoint '${req.originalUrl}' not found on this server`,
  });
});

// Central Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
  console.log(`🌾 Farmer Crop Portal Backend running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  console.log(`🔗 Base API URL: http://localhost:${PORT}/api`);
});

// Handle server listen errors (e.g. EADDRINUSE)
server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use by another running process.`);
  } else {
    console.error('Server error:', err.message);
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error(`Unhandled Rejection Error: ${err.message}`);
});

module.exports = app;
