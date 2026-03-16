const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Advanced Analytics Dashboard
router.get('/analytics', auth, async (req, res) => {
  try {
    const { startDate, endDate, period = 'month' } = req.query;
    
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), 0, 1);
    const end = endDate ? new Date(endDate) : new Date();

    // Revenue Analytics
    const revenueData = await prisma.payment.groupBy({
      by: ['paymentDate'],
      where: { paymentDate: { gte: start, lte: end } },
      _sum: { amount: true },
      _count: { id: true },
      orderBy: { paymentDate: 'asc' }
    });

    // Member Growth
    const memberGrowth = await prisma.member.groupBy({
      by: ['joinDate'],
      where: { joinDate: { gte: start, lte: end } },
      _count: { id: true },
      orderBy: { joinDate: 'asc' }
    });

    // Attendance Trends
    const attendanceTrends = await prisma.attendance.groupBy({
      by: ['date'],
      where: { date: { gte: start, lte: end } },
      _count: { id: true },
      orderBy: { date: 'asc' }
    });

    // Plan Performance
    const planPerformance = await prisma.membership.groupBy({
      by: ['planType'],
      _count: { id: true },
      _sum: { feeAmount: true },
      _avg: { feeAmount: true }
    });

    res.json({
      revenue: revenueData,
      memberGrowth,
      attendance: attendanceTrends,
      planPerformance
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Financial Reports
router.get('/financial', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const end = endDate ? new Date(endDate) : new Date();

    const [revenue, expenses, overdue, projections] = await Promise.all([
      // Total Revenue
      prisma.payment.aggregate({
        where: { paymentDate: { gte: start, lte: end } },
        _sum: { amount: true },
        _count: { id: true },
        _avg: { amount: true }
      }),
      
      // Expenses (from payroll and other transactions)
      prisma.transaction.aggregate({
        where: { 
          date: { gte: start, lte: end },
          type: 'DEBIT',
          category: { in: ['SALARY', 'EQUIPMENT', 'UTILITY', 'OTHER'] }
        },
        _sum: { amount: true }
      }),

      // Overdue Payments
      prisma.membership.count({
        where: { 
          paymentStatus: 'OVERDUE',
          endDate: { lt: new Date() }
        }
      }),

      // Revenue Projections (next 3 months)
      prisma.membership.aggregate({
        where: { 
          paymentStatus: { in: ['PAID', 'PENDING'] },
          endDate: { gte: new Date() }
        },
        _sum: { feeAmount: true }
      })
    ]);

    const netProfit = (revenue._sum.amount || 0) - (expenses._sum.amount || 0);
    const profitMargin = revenue._sum.amount ? (netProfit / revenue._sum.amount) * 100 : 0;

    res.json({
      revenue: revenue._sum.amount || 0,
      expenses: expenses._sum.amount || 0,
      netProfit,
      profitMargin: Math.round(profitMargin * 100) / 100,
      totalTransactions: revenue._count || 0,
      avgTransactionValue: revenue._avg.amount || 0,
      overduePayments: overdue,
      projectedRevenue: projections._sum.feeAmount || 0
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Member Analytics
router.get('/members', auth, async (req, res) => {
  try {
    const [demographics, retention, activity, plans] = await Promise.all([
      // Demographics
      prisma.member.groupBy({
        by: ['gender'],
        _count: { id: true },
        where: { status: 'active' }
      }),

      // Retention Rate (members who renewed)
      prisma.membership.groupBy({
        by: ['memberId'],
        having: { memberId: { _count: { gt: 1 } } },
        _count: { id: true }
      }),

      // Activity Levels
      prisma.attendance.groupBy({
        by: ['memberId'],
        where: { 
          date: { 
            gte: new Date(new Date().setDate(new Date().getDate() - 30)) 
          }
        },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10
      }),

      // Plan Distribution
      prisma.membership.groupBy({
        by: ['planType'],
        where: { paymentStatus: { in: ['PAID', 'PENDING'] } },
        _count: { id: true }
      })
    ]);

    // Get member details for top active members
    const topMemberIds = activity.map(a => a.memberId);
    const topMembers = await prisma.member.findMany({
      where: { id: { in: topMemberIds } },
      select: { id: true, name: true }
    });

    const topMembersWithActivity = activity.map(a => ({
      ...topMembers.find(m => m.id === a.memberId),
      visits: a._count.id
    }));

    res.json({
      demographics,
      retentionCount: retention.length,
      topMembers: topMembersWithActivity,
      planDistribution: plans
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Staff Performance
router.get('/staff', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate) : new Date();

    const [attendance, leaves, payroll, departments] = await Promise.all([
      // Staff Attendance
      prisma.staffattendance.groupBy({
        by: ['staffId', 'status'],
        where: { date: { gte: start, lte: end } },
        _count: { id: true }
      }),

      // Leave Analysis
      prisma.leave.groupBy({
        by: ['type', 'status'],
        where: { 
          startDate: { gte: start, lte: end }
        },
        _count: { id: true }
      }),

      // Payroll Summary
      prisma.payroll.aggregate({
        where: { 
          createdAt: { gte: start, lte: end }
        },
        _sum: { netSalary: true },
        _avg: { netSalary: true },
        _count: { id: true }
      }),

      // Department Performance
      prisma.staff.groupBy({
        by: ['department'],
        where: { status: 'active' },
        _count: { id: true },
        _avg: { salary: true }
      })
    ]);

    res.json({
      attendance,
      leaves,
      payroll: {
        totalPaid: payroll._sum.netSalary || 0,
        avgSalary: payroll._avg.netSalary || 0,
        totalPayrolls: payroll._count || 0
      },
      departments
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Trainer Performance Report
router.get('/trainers', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = startDate ? new Date(startDate) : new Date(new Date().setDate(new Date().getDate() - 30));
    const end = endDate ? new Date(endDate) : new Date();

    const trainers = await prisma.trainer.findMany({
      include: {
        user: { select: { email: true } },
        Renamedclass: {
          include: { enrollment: true }
        },
        trainerattendance: {
          where: { date: { gte: start, lte: end } }
        },
        attendance: {
          where: { date: { gte: start, lte: end } }
        }
      }
    });

    const result = trainers.map(t => ({
      id: t.id,
      name: t.name,
      email: t.user?.email,
      specialization: t.specialization,
      phone: t.phone,
      salary: t.salary,
      totalClasses: t.Renamedclass.length,
      activeClasses: t.Renamedclass.filter(c => c.status === 'active').length,
      totalEnrollments: t.Renamedclass.reduce((sum, c) => sum + c.enrollment.length, 0),
      memberCheckIns: t.attendance.length,
      attendanceDays: t.trainerattendance.length,
      presentDays: t.trainerattendance.filter(a => a.status === 'PRESENT').length,
      absentDays: t.trainerattendance.filter(a => a.status === 'ABSENT').length,
      classes: t.Renamedclass.map(c => ({
        id: c.id, name: c.name, schedule: c.schedule,
        capacity: c.maxCapacity, enrolled: c.enrollment.length,
        fee: c.fee, status: c.status
      }))
    }));

    // Specialization distribution
    const specDist = trainers.reduce((acc, t) => {
      const spec = t.specialization || 'General';
      acc[spec] = (acc[spec] || 0) + 1;
      return acc;
    }, {});
    const specializationDist = Object.entries(specDist).map(([name, count]) => ({ name, count }));

    res.json({ trainers: result, specializationDist });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Export Data
router.get('/export/:type', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const { type } = req.params;
    const { startDate, endDate, format = 'json' } = req.query;
    
    let data = [];
    let filename = '';
    
    switch (type) {
      case 'members':
        data = await prisma.member.findMany({
          include: { user: { select: { email: true } }, membership: true }
        });
        filename = 'members_export';
        break;
        
      case 'payments':
        data = await prisma.payment.findMany({
          where: startDate && endDate ? {
            paymentDate: { gte: new Date(startDate), lte: new Date(endDate) }
          } : {},
          include: { membership: { include: { member: { select: { name: true } } } } }
        });
        filename = 'payments_export';
        break;
        
      case 'attendance':
        data = await prisma.attendance.findMany({
          where: startDate && endDate ? {
            date: { gte: new Date(startDate), lte: new Date(endDate) }
          } : {},
          include: { member: { select: { name: true, phone: true } } }
        });
        filename = 'attendance_export';
        break;
        
      default:
        return res.status(400).json({ error: 'Invalid export type' });
    }
    
    if (format === 'csv') {
      // Convert to CSV
      const csv = convertToCSV(data);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}.csv`);
      res.send(csv);
    } else {
      res.json(data);
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper function to convert data to CSV
function convertToCSV(data) {
  if (!data.length) return '';
  
  const headers = Object.keys(data[0]).join(',');
  const rows = data.map(row => 
    Object.values(row).map(value => 
      typeof value === 'object' ? JSON.stringify(value) : value
    ).join(',')
  );
  
  return [headers, ...rows].join('\n');
}

module.exports = router;