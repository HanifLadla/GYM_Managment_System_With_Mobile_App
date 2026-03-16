const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { auth, authorize } = require('../middleware/auth');
const Joi = require('joi');
const crypto = require('crypto');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();
const prisma = new PrismaClient();

// Multer setup for staff photos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/staff');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    cb(null, `${crypto.randomUUID()}${path.extname(file.originalname)}`);
  }
});
const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

// Photo upload endpoint
router.post('/staff/upload-photo', auth, authorize('ADMIN'), upload.single('photo'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({ url: `/uploads/staff/${req.file.filename}` });
});

// Validation schemas
const staffSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().min(10).max(15).required(),
  cnic: Joi.string().min(13).max(15).optional().allow(''),
  address: Joi.string().max(500).optional().allow(''),
  dob: Joi.date().optional().allow('', null),
  gender: Joi.string().valid('Male', 'Female', 'Other').optional().allow(''),
  joinDate: Joi.date().optional().allow('', null),
  photo: Joi.string().optional().allow('', null),
  department: Joi.string().min(2).max(50).required(),
  designation: Joi.string().min(2).max(50).required(),
  salary: Joi.number().positive().required(),
  commission: Joi.number().min(0).default(0),
  bankAccount: Joi.string().optional().allow('', null),
  emergencyContact: Joi.alternatives().try(Joi.object(), Joi.string()).optional().allow('', null)
});

const payrollSchema = Joi.object({
  staffId: Joi.string().required(),
  month: Joi.number().min(1).max(12).required(),
  year: Joi.number().min(2020).max(2030).required(),
  allowances: Joi.number().min(0).default(0),
  deductions: Joi.number().min(0).default(0),
  overtime: Joi.number().min(0).default(0),
  bonus: Joi.number().min(0).default(0)
});

// Staff Management
router.post('/staff', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const { error, value } = staffSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    // Check for duplicate email/CNIC
    const existing = await prisma.staff.findFirst({
      where: {
        OR: [
          { email: value.email },
          ...(value.cnic ? [{ cnic: value.cnic }] : [])
        ]
      }
    });

    if (existing) {
      return res.status(400).json({ error: 'Staff with this email or CNIC already exists' });
    }

    const staff = await prisma.staff.create({
      data: {
        ...value,
        id: crypto.randomUUID(),
        joinDate: value.joinDate ? new Date(value.joinDate) : new Date(),
        ...(value.dob ? { dob: new Date(value.dob) } : {}),
      }
    });
    
    res.status(201).json(staff);
  } catch (error) {
    console.error('Staff creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get staff only (excluding trainers)
router.get('/staff', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const staff = await prisma.staff.findMany({
      where: { status: 'active' },
      include: { 
        staffattendance: { take: 5, orderBy: { date: 'desc' } }, 
        leave: { take: 5, orderBy: { createdAt: 'desc' } } 
      }
    });
    res.json(staff);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get trainers only
router.get('/trainers', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const trainers = await prisma.trainer.findMany({
      include: {
        user: true,
        Renamedclass: true
      }
    });

    const trainerData = trainers.map(trainer => ({
      id: trainer.id,
      name: trainer.name,
      email: trainer.user?.email || 'N/A',
      phone: trainer.phone,
      specialization: trainer.specialization,
      classes: trainer.Renamedclass?.length || 0,
      availability: trainer.availability,
      type: 'trainer'
    }));

    res.json(trainerData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/staff/:id', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const staff = await prisma.staff.findUnique({
      where: { id: req.params.id },
      include: { staffattendance: true, leave: true, payroll: true }
    });
    res.json(staff);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/staff/:id', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const { emergencyContactName, emergencyContactPhone, ...body } = req.body;
    const data = {
      ...body,
      ...(body.dob ? { dob: new Date(body.dob) } : { dob: null }),
      ...(body.joinDate ? { joinDate: new Date(body.joinDate) } : {}),
    };
    const staff = await prisma.staff.update({
      where: { id: req.params.id },
      data
    });
    res.json(staff);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/staff/:id', auth, authorize('ADMIN'), async (req, res) => {
  try {
    await prisma.staff.update({
      where: { id: req.params.id },
      data: { status: 'inactive' }
    });
    res.json({ message: 'Staff deactivated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Attendance Management
router.post('/attendance', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const { staffId, date, status, checkIn, checkOut, notes } = req.body;
    const attendance = await prisma.staffattendance.create({
      data: {
        id: crypto.randomUUID(),
        staffId,
        date: new Date(date),
        status: status || 'PRESENT',
        ...(checkIn ? { checkIn: new Date(`${date}T${checkIn}`) } : {}),
        ...(checkOut ? { checkOut: new Date(`${date}T${checkOut}`) } : {}),
        ...(notes ? { notes } : {})
      },
      include: { staff: true }
    });
    res.status(201).json(attendance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Enhanced attendance endpoint to support trainers
router.get('/attendance', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const { staffId, startDate, endDate } = req.query;
    const where = {
      ...(staffId && { staffId }),
      ...(startDate && endDate && { date: { gte: new Date(startDate), lte: new Date(endDate) } })
    };
    
    const attendance = await prisma.staffattendance.findMany({
      where,
      include: { staff: true },
      orderBy: { date: 'desc' }
    });

    // Add trainer attendance records (if any exist in future)
    // For now, we'll create a unified view
    const attendanceWithType = attendance.map(att => ({
      ...att,
      staff: {
        ...att.staff,
        type: 'staff'
      }
    }));

    res.json(attendanceWithType);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/attendance/:id', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const attendance = await prisma.staffattendance.update({
      where: { id: req.params.id },
      data: req.body
    });
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Trainer Attendance Management
router.post('/trainer-attendance', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const { trainerId, date, status, checkIn, checkOut, notes } = req.body;
    if (!trainerId || !date) return res.status(400).json({ error: 'trainerId and date are required' });
    const record = await prisma.trainerattendance.create({
      data: {
        id: crypto.randomUUID(),
        trainerId,
        date: new Date(date),
        status: status || 'PRESENT',
        ...(checkIn ? { checkIn: new Date(`${date}T${checkIn}`) } : {}),
        ...(checkOut ? { checkOut: new Date(`${date}T${checkOut}`) } : {}),
        ...(notes ? { notes } : {})
      },
      include: { trainer: true }
    });
    res.status(201).json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/trainer-attendance', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const { trainerId, startDate, endDate } = req.query;
    const where = {
      ...(trainerId && { trainerId }),
      ...(startDate && endDate && { date: { gte: new Date(startDate), lte: new Date(endDate) } })
    };
    const records = await prisma.trainerattendance.findMany({
      where,
      include: { trainer: true },
      orderBy: { date: 'desc' }
    });
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/trainer-attendance/:id', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const { status, checkIn, checkOut, notes, date } = req.body;
    const existing = await prisma.trainerattendance.findUnique({ where: { id: req.params.id } });
    const baseDate = date || existing.date.toISOString().split('T')[0];
    const record = await prisma.trainerattendance.update({
      where: { id: req.params.id },
      data: {
        ...(status && { status }),
        ...(checkIn ? { checkIn: new Date(`${baseDate}T${checkIn}`) } : { checkIn: null }),
        ...(checkOut ? { checkOut: new Date(`${baseDate}T${checkOut}`) } : { checkOut: null }),
        ...(notes !== undefined && { notes })
      },
      include: { trainer: true }
    });
    res.json(record);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/trainer-attendance/:id', auth, authorize('ADMIN'), async (req, res) => {
  try {
    await prisma.trainerattendance.delete({ where: { id: req.params.id } });
    res.json({ message: 'Deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Leave Management
router.post('/leaves', auth, async (req, res) => {
  try {
    const { staffId, type, startDate, endDate, reason } = req.body;
    const leave = await prisma.leave.create({
      data: {
        id: crypto.randomUUID(),
        staffId,
        type,
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        reason
      },
      include: { staff: true }
    });
    res.status(201).json(leave);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/leaves', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const { staffId, status } = req.query;
    const where = {
      ...(staffId && { staffId }),
      ...(status && { status })
    };
    const leaves = await prisma.leave.findMany({
      where,
      include: { staff: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(leaves);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/leaves/:id', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const { status, approvedBy } = req.body;
    const leave = await prisma.leave.update({
      where: { id: req.params.id },
      data: {
        status,
        ...(status === 'APPROVED' && { approvedBy, approvedAt: new Date() })
      },
      include: { staff: true }
    });
    res.json(leave);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Payroll Management with Accounting Integration
router.post('/payroll', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const { error, value } = payrollSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { staffId, month, year, allowances, deductions, overtime, bonus } = value;
    
    // Check for duplicate payroll
    const existing = await prisma.payroll.findFirst({
      where: { staffId, month, year }
    });

    if (existing) {
      return res.status(400).json({ error: 'Payroll for this month already exists' });
    }

    let staff = await prisma.staff.findUnique({ where: { id: staffId } });
    let isTrainer = false;
    
    if (!staff) {
      const trainer = await prisma.trainer.findUnique({ where: { id: staffId } });
      if (!trainer) {
        return res.status(404).json({ error: 'Staff or trainer not found' });
      }
      
      // Create a temporary staff record for trainer payroll
      staff = await prisma.staff.create({
        data: {
          id: crypto.randomUUID(),
          name: trainer.name,
          email: `trainer_${trainer.id}@temp.com`,
          phone: trainer.phone,
          department: 'Training',
          designation: 'Trainer',
          salary: 50000,
          commission: 0,
          status: 'temp_trainer'
        }
      });
      isTrainer = true;
    }
    
    // Calculate net salary
    const basicSalary = staff ? parseFloat(staff.salary) : 50000; // Default trainer salary
    const totalAllowances = parseFloat(allowances || 0);
    const totalDeductions = parseFloat(deductions || 0);
    const commission = staff ? parseFloat(staff.commission || 0) : 0;
    const overtimePay = parseFloat(overtime || 0);
    const bonusAmount = parseFloat(bonus || 0);
    
    const netSalary = basicSalary + totalAllowances + commission + overtimePay + bonusAmount - totalDeductions;
    
    const payroll = await prisma.payroll.create({
      data: {
        id: crypto.randomUUID(),
        staffId: staff.id,
        month,
        year,
        basicSalary,
        allowances: totalAllowances,
        deductions: totalDeductions,
        commission,
        netSalary,
        status: 'pending'
      },
      include: { staff: true }
    });

    // Create accounting transaction for salary expense
    let salaryAccount = await prisma.account.findFirst({
      where: { 
        type: 'EXPENSE',
        accountName: 'Salary Expense'
      }
    });

    if (!salaryAccount) {
      salaryAccount = await prisma.account.create({
        data: {
          id: crypto.randomUUID(),
          accountName: 'Salary Expense',
          type: 'EXPENSE',
          balance: 0,
          description: 'Staff salary expenses'
        }
      });
    }

    await prisma.transaction.create({
      data: {
        id: crypto.randomUUID(),
        accountId: salaryAccount.id,
        amount: netSalary,
        type: 'DEBIT',
        category: 'SALARY',
        description: `Salary for ${staff.name} - ${month}/${year}${isTrainer ? ' (Trainer)' : ''}`,
        createdBy: req.user.id
      }
    });

    await prisma.account.update({
      where: { id: salaryAccount.id },
      data: { balance: { increment: netSalary } }
    });

    res.status(201).json(payroll);
  } catch (error) {
    console.error('Payroll creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/payroll', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const { staffId, month, year } = req.query;
    const where = {
      ...(staffId && { staffId }),
      ...(month && { month: parseInt(month) }),
      ...(year && { year: parseInt(year) })
    };
    const payroll = await prisma.payroll.findMany({
      where,
      include: { staff: true },
      orderBy: [{ year: 'desc' }, { month: 'desc' }]
    });
    res.json(payroll);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/payroll/:id', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const { status, paidDate } = req.body;
    
    const payroll = await prisma.payroll.update({
      where: { id: req.params.id },
      data: { 
        status,
        ...(status === 'paid' && { paidDate: paidDate ? new Date(paidDate) : new Date() })
      },
      include: { staff: true }
    });

    // If marking as paid, create cash/bank transaction
    if (status === 'paid') {
      let cashAccount = await prisma.account.findFirst({
        where: { 
          type: 'ASSET',
          accountName: { contains: 'Cash' }
        }
      });

      if (!cashAccount) {
        cashAccount = await prisma.account.create({
          data: {
            id: crypto.randomUUID(),
            accountName: 'Cash Account',
            type: 'ASSET',
            balance: 0,
            description: 'Cash and bank transactions'
          }
        });
      }

      await prisma.transaction.create({
        data: {
          id: crypto.randomUUID(),
          accountId: cashAccount.id,
          amount: payroll.netSalary,
          type: 'CREDIT',
          category: 'SALARY',
          description: `Salary payment to ${payroll.staff.name} - ${payroll.month}/${payroll.year}`,
          createdBy: req.user.id
        }
      });

      await prisma.account.update({
        where: { id: cashAccount.id },
        data: { balance: { decrement: payroll.netSalary } }
      });
    }

    res.json(payroll);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update HR stats to use actual trainer salaries
router.get('/stats', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const totalStaff = await prisma.staff.count({ where: { status: 'active' } });
    const totalTrainers = await prisma.trainer.count();
    const totalEmployees = totalStaff + totalTrainers;
    
    const pendingLeaves = await prisma.leave.count({ where: { status: 'PENDING' } });
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayAttendance = await prisma.staffattendance.count({ where: { date: { gte: today } } });
    const todayTrainerAttendance = await prisma.trainerattendance.count({ where: { date: { gte: today } } });
    const pendingPayroll = await prisma.payroll.count({ where: { status: 'pending' } });
    
    // Monthly salary expense from actual payroll records only
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const monthlyPayroll = await prisma.payroll.findMany({
      where: { month: currentMonth, year: currentYear },
      include: { staff: true }
    });
    const monthlySalaryExpense = monthlyPayroll.reduce((sum, p) => sum + Number(p.netSalary), 0);
    
    // Get actual trainer salaries from database
    const trainers = await prisma.trainer.findMany({ select: { salary: true } });
    const estimatedTrainerSalaries = trainers.reduce((sum, t) => sum + Number(t.salary || 50000), 0);

    // Department breakdown including trainers
    const departments = await prisma.staff.groupBy({
      by: ['department'],
      where: { status: 'active' },
      _count: { department: true }
    });
    
    // Add trainers as a department
    departments.push({
      department: 'Training',
      _count: { department: totalTrainers }
    });

    // Attendance rate
    const totalWorkingDays = new Date().getDate();
    const totalPossibleAttendance = totalEmployees * totalWorkingDays;
    const actualAttendance = await prisma.staffattendance.count({
      where: {
        date: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          lte: new Date()
        },
        status: 'PRESENT'
      }
    });
    const attendanceRate = totalPossibleAttendance > 0 ? (actualAttendance / totalPossibleAttendance) * 100 : 0;
    
    res.json({ 
      totalStaff: totalEmployees,
      totalTrainers,
      pendingLeaves, 
      todayAttendance: todayAttendance + todayTrainerAttendance, 
      pendingPayroll,
      monthlySalaryExpense: monthlySalaryExpense,
      estimatedTrainerSalaries,
      departments,
      attendanceRate: Math.round(attendanceRate)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk attendance marking
router.post('/attendance/bulk', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const { date, attendanceData } = req.body; // attendanceData: [{ staffId, status, checkIn, checkOut }]
    
    const results = [];
    for (const data of attendanceData) {
      const attendance = await prisma.staffAttendance.upsert({
        where: {
          staffId_date: {
            staffId: data.staffId,
            date: new Date(date)
          }
        },
        update: {
          status: data.status,
          checkIn: data.checkIn ? new Date(data.checkIn) : null,
          checkOut: data.checkOut ? new Date(data.checkOut) : null
        },
        create: {
          staffId: data.staffId,
          date: new Date(date),
          status: data.status,
          checkIn: data.checkIn ? new Date(data.checkIn) : null,
          checkOut: data.checkOut ? new Date(data.checkOut) : null
        },
        include: { staff: true }
      });
      results.push(attendance);
    }
    
    res.json(results);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate payroll for all staff
router.post('/payroll/generate-all', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const { month, year } = req.body;
    
    if (!month || !year) {
      return res.status(400).json({ error: 'Month and year are required' });
    }

    const activeStaff = await prisma.staff.findMany({
      where: { status: 'active' }
    });

    const results = [];
    for (const staff of activeStaff) {
      // Check if payroll already exists
      const existing = await prisma.payroll.findFirst({
        where: { staffId: staff.id, month, year }
      });

      if (!existing) {
        const netSalary = parseFloat(staff.salary) + parseFloat(staff.commission || 0);
        
        const payroll = await prisma.payroll.create({
          data: {
            id: crypto.randomUUID(),
            staffId: staff.id,
            month,
            year,
            basicSalary: staff.salary,
            allowances: 0,
            deductions: 0,
            commission: staff.commission || 0,
            netSalary,
            status: 'pending'
          },
          include: { staff: true }
        });
        results.push(payroll);
      }
    }

    res.json({ message: `Generated payroll for ${results.length} staff members`, payrolls: results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Staff performance report
router.get('/staff/:id/performance', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const { id } = req.params;
    const { startDate, endDate } = req.query;

    const staff = await prisma.staff.findUnique({ where: { id } });
    if (!staff) {
      return res.status(404).json({ error: 'Staff not found' });
    }

    const dateFilter = {
      ...(startDate && endDate && {
        date: {
          gte: new Date(startDate),
          lte: new Date(endDate)
        }
      })
    };

    // Attendance summary
    const attendance = await prisma.staffattendance.findMany({
      where: { staffId: id, ...dateFilter },
      orderBy: { date: 'desc' }
    });

    const attendanceSummary = {
      total: attendance.length,
      present: attendance.filter(a => a.status === 'PRESENT').length,
      absent: attendance.filter(a => a.status === 'ABSENT').length,
      halfDay: attendance.filter(a => a.status === 'HALF_DAY').length,
      late: attendance.filter(a => a.status === 'LATE').length
    };

    // Leave summary
    const leaves = await prisma.leave.findMany({
      where: { 
        staffId: id,
        ...(startDate && endDate && {
          startDate: {
            gte: new Date(startDate),
            lte: new Date(endDate)
          }
        })
      }
    });

    const leaveSummary = {
      total: leaves.length,
      approved: leaves.filter(l => l.status === 'APPROVED').length,
      pending: leaves.filter(l => l.status === 'PENDING').length,
      rejected: leaves.filter(l => l.status === 'REJECTED').length,
      byType: {
        sick: leaves.filter(l => l.type === 'SICK').length,
        casual: leaves.filter(l => l.type === 'CASUAL').length,
        annual: leaves.filter(l => l.type === 'ANNUAL').length,
        unpaid: leaves.filter(l => l.type === 'UNPAID').length
      }
    };

    // Payroll summary
    const payrolls = await prisma.payroll.findMany({
      where: { staffId: id },
      orderBy: [{ year: 'desc' }, { month: 'desc' }]
    });

    const totalEarnings = payrolls.reduce((sum, p) => sum + Number(p.netSalary), 0);

    res.json({
      staff,
      attendanceSummary,
      leaveSummary,
      payrollSummary: {
        totalPayrolls: payrolls.length,
        totalEarnings,
        averageSalary: payrolls.length > 0 ? totalEarnings / payrolls.length : 0
      },
      recentAttendance: attendance.slice(0, 10),
      recentLeaves: leaves.slice(0, 5),
      recentPayrolls: payrolls.slice(0, 6)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
