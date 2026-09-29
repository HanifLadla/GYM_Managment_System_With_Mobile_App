require('dotenv').config();

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const cron = require('node-cron');
const rateLimit = require('express-rate-limit');

// Routes
const authRoutes = require('./routes/auth');
const memberRoutes = require('./routes/members');
const attendanceRoutes = require('./routes/attendance');
const paymentRoutes = require('./routes/payments');
const trainerRoutes = require('./routes/trainers');
const classRoutes = require('./routes/classes');
const equipmentRoutes = require('./routes/equipment');
const expenseRoutes = require('./routes/expenses');
const settingsRoutes = require('./routes/settings');
const accountingRoutes = require('./routes/accounting');
const deviceRoutes = require('./routes/devices');
const hrRoutes = require('./routes/hr');
const dashboardRoutes = require('./routes/dashboard');
const plansRoutes = require('./routes/plans');
const reportsRoutes = require('./routes/reports');
const usersRoutes = require('./routes/users');

// Cron jobs
const {
  checkOverdueFees,
  checkExpiringMemberships,
  checkBirthdays,
  autoExpireMembers
} = require('./utils/cronJobs');

// ----------------------------------------------------
// Express App + HTTP Server
// ----------------------------------------------------

const app = express();
const server = http.createServer(app);

// ----------------------------------------------------
// Frontend URL
// ----------------------------------------------------

const FRONTEND_URL =
  process.env.FRONTEND_URL || 'http://localhost:5173';

// ----------------------------------------------------
// Socket.IO
// ----------------------------------------------------

const io = new Server(server, {
  cors: {
    origin: FRONTEND_URL,
    credentials: true
  }
});

global.io = io;

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// ----------------------------------------------------
// Middleware
// ----------------------------------------------------

app.use(
  helmet({
    crossOriginResourcePolicy: {
      policy: 'cross-origin'
    }
  })
);

app.use(
  cors({
    origin: FRONTEND_URL,
    credentials: true
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ----------------------------------------------------
// Uploaded Files
// ----------------------------------------------------

app.use(
  '/uploads',
  express.static(path.join(__dirname, 'uploads'))
);

// ----------------------------------------------------
// Rate Limiting
// ----------------------------------------------------

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/', limiter);

// ----------------------------------------------------
// API Routes
// ----------------------------------------------------

app.use('/api/auth', authRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/trainers', trainerRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/accounting', accountingRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/plans', plansRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/users', usersRoutes);

// ----------------------------------------------------
// Health Check
// ----------------------------------------------------

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK'
  });
});

// ----------------------------------------------------
// React Frontend - Production
// ----------------------------------------------------

if (process.env.NODE_ENV === 'production') {
  const frontendPath = path.join(__dirname, 'dist');

  // Serve React/Vite static files
  app.use(express.static(frontendPath));

  // React Router fallback
  // Any non-API route will load React index.html
  app.get('*', (req, res, next) => {

    // Never send index.html for API requests
    if (req.path.startsWith('/api/')) {
      return next();
    }

    res.sendFile(
      path.join(frontendPath, 'index.html'),
      (err) => {
        if (err) {
          next(err);
        }
      }
    );
  });
}

// ----------------------------------------------------
// API 404 Handler
// ----------------------------------------------------

app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found'
  });
});

// ----------------------------------------------------
// Error Handler
// ----------------------------------------------------

app.use((err, req, res, next) => {
  console.error(err.stack || err);

  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',

    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack
    })
  });
});

// ----------------------------------------------------
// Cron Jobs
// ----------------------------------------------------

cron.schedule('0 9 * * *', checkOverdueFees);

cron.schedule('0 10 * * *', checkExpiringMemberships);

cron.schedule('0 8 * * *', checkBirthdays);

cron.schedule('0 0 * * *', autoExpireMembers);

// ----------------------------------------------------
// Start Server
// ----------------------------------------------------

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log('========================================');
  console.log(`GMS Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`Frontend URL: ${FRONTEND_URL}`);

  if (process.env.NODE_ENV === 'production') {
    console.log(
      `Serving React frontend from: ${path.join(__dirname, 'dist')}`
    );
  }

  console.log('========================================');
});