require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const http = require('http');
const { Server } = require('socket.io');
const cron = require('node-cron');
const rateLimit = require('express-rate-limit');

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
const progressRoutes = require('./routes/progress');
const dashboardRoutes = require('./routes/dashboard');
const plansRoutes = require('./routes/plans');
const reportsRoutes = require('./routes/reports');
const usersRoutes = require('./routes/users');
const dietPlanRoutes = require('./routes/dietPlans');
const foodItemRoutes = require('./routes/foodItems');
const nutritionLogRoutes = require('./routes/nutritionLogs');
const { checkOverdueFees, checkExpiringMemberships, checkBirthdays } = require('./utils/cronJobs');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }
});

// Middleware
app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(morgan('dev'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100
});
app.use('/api/', limiter);

// Socket.io
global.io = io;
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('disconnect', () => console.log('Client disconnected:', socket.id));
});

// Routes
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
app.use('/api/progress', progressRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/plans', plansRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/diet-plans', dietPlanRoutes);
app.use('/api/food-items', foodItemRoutes);
app.use('/api/nutrition-logs', nutritionLogRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'OK' }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// Cron jobs
cron.schedule('0 9 * * *', checkOverdueFees); // Daily at 9 AM
cron.schedule('0 10 * * *', checkExpiringMemberships); // Daily at 10 AM
cron.schedule('0 8 * * *', checkBirthdays); // Daily at 8 AM

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
