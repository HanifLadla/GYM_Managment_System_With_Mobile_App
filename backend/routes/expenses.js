const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { auth, authorize } = require('../middleware/auth');
const Joi = require('joi');

const router = express.Router();
const prisma = new PrismaClient();

// Validation schemas
const expenseSchema = Joi.object({
  category: Joi.string().valid('SALARY', 'EQUIPMENT', 'UTILITY', 'RENT', 'MARKETING', 'MAINTENANCE', 'INSURANCE', 'OTHER').required(),
  amount: Joi.number().positive().required(),
  description: Joi.string().min(3).max(500).required(),
  date: Joi.date().max('now').optional(),
  paymentMethod: Joi.string().valid('CASH', 'CARD', 'BANK_TRANSFER', 'CHEQUE', 'UPI').required(),
  vendor: Joi.string().min(2).max(100).allow('').optional(),
  receiptUrl: Joi.string().uri().allow('').optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  isRecurring: Joi.boolean().optional(),
  recurringFrequency: Joi.string().valid('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY').optional(),
  approvedBy: Joi.string().optional()
});

const updateExpenseSchema = Joi.object({
  category: Joi.string().valid('SALARY', 'EQUIPMENT', 'UTILITY', 'RENT', 'MARKETING', 'MAINTENANCE', 'INSURANCE', 'OTHER').optional(),
  amount: Joi.number().positive().optional(),
  description: Joi.string().min(3).max(500).optional(),
  paymentMethod: Joi.string().valid('CASH', 'CARD', 'BANK_TRANSFER', 'CHEQUE', 'UPI').optional(),
  vendor: Joi.string().min(2).max(100).optional(),
  receiptUrl: Joi.string().uri().optional(),
  tags: Joi.array().items(Joi.string()).optional(),
  status: Joi.string().valid('PENDING', 'APPROVED', 'REJECTED').optional()
});

// Create expense
router.post('/', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const { error, value } = expenseSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { category, amount, description, date, paymentMethod, vendor, receiptUrl, tags, isRecurring, recurringFrequency } = value;
    
    // Validate recurring expense
    if (isRecurring && !recurringFrequency) {
      return res.status(400).json({ error: 'Recurring frequency is required for recurring expenses' });
    }

    // Get or create expense account
    const accountNames = {
      SALARY: 'Salary Expense',
      EQUIPMENT: 'Equipment Expense', 
      UTILITY: 'Utility Expense',
      RENT: 'Other Expense',
      MARKETING: 'Other Expense',
      MAINTENANCE: 'Other Expense',
      INSURANCE: 'Other Expense',
      OTHER: 'Other Expense'
    };

    const categoryMapping = {
      SALARY: 'SALARY',
      EQUIPMENT: 'EQUIPMENT',
      UTILITY: 'UTILITY',
      RENT: 'OTHER',
      MARKETING: 'OTHER',
      MAINTENANCE: 'OTHER',
      INSURANCE: 'OTHER',
      OTHER: 'OTHER'
    };

    let expenseAccount = await prisma.account.findFirst({
      where: { 
        type: 'EXPENSE',
        accountName: accountNames[category]
      }
    });
    
    if (!expenseAccount) {
      expenseAccount = await prisma.account.create({
        data: {
          accountName: accountNames[category],
          type: 'EXPENSE',
          balance: 0,
          description: `${category.toLowerCase()} expenses`
        }
      });
    }
    
    // Create transaction with metadata
    const transactionData = {
      accountId: expenseAccount.id,
      amount: parseFloat(amount),
      type: 'DEBIT',
      category: categoryMapping[category],
      description: `${description}${vendor ? ` - Vendor: ${vendor}` : ''}`,
      date: date ? new Date(date) : new Date(),
      createdBy: req.user.id
    };

    const transaction = await prisma.transaction.create({
      data: transactionData
    });
    
    // Update account balance
    await prisma.account.update({
      where: { id: expenseAccount.id },
      data: { balance: { increment: parseFloat(amount) } }
    });

    // Create expense metadata (using a separate table or JSON field)
    const expenseMetadata = {
      transactionId: transaction.id,
      paymentMethod,
      vendor: vendor || null,
      receiptUrl: receiptUrl || null,
      tags: tags || [],
      isRecurring: isRecurring || false,
      recurringFrequency: recurringFrequency || null,
      status: 'APPROVED',
      approvedBy: req.user.id,
      approvedAt: new Date()
    };

    // Store metadata in transaction description as JSON (since we don't have separate expense table)
    await prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        description: `${transactionData.description} | META: ${JSON.stringify(expenseMetadata)}`
      }
    });
    
    res.status(201).json({ ...transaction, metadata: expenseMetadata });
  } catch (error) {
    console.error('Expense creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get expenses with advanced filtering
router.get('/', auth, async (req, res) => {
  try {
    const { 
      startDate, 
      endDate, 
      category, 
      paymentMethod, 
      vendor, 
      minAmount, 
      maxAmount, 
      status,
      page = 1, 
      limit = 20,
      sortBy = 'date',
      sortOrder = 'desc'
    } = req.query;

    const where = { type: 'DEBIT' };
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Date range filter
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }
    
    // Category filter
    if (category && category !== 'all') {
      where.category = category;
    }

    // Amount range filter
    if (minAmount || maxAmount) {
      where.amount = {};
      if (minAmount) where.amount.gte = parseFloat(minAmount);
      if (maxAmount) where.amount.lte = parseFloat(maxAmount);
    }

    // Vendor filter
    if (vendor) {
      where.description = { contains: vendor };
    }

    // Payment method filter (from metadata)
    if (paymentMethod) {
      where.description = { contains: `"paymentMethod":"${paymentMethod}"` };
    }

    const [expenses, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: { account: true },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: parseInt(limit)
      }),
      prisma.transaction.count({ where })
    ]);

    // Parse metadata from description
    const expensesWithMetadata = expenses.map(expense => {
      let metadata = {};
      try {
        const metaMatch = expense.description.match(/META: ({.*})$/);
        if (metaMatch) {
          metadata = JSON.parse(metaMatch[1]);
          expense.description = expense.description.replace(/ \| META: {.*}$/, '');
        }
      } catch (e) {
        // Ignore parsing errors
      }
      return { ...expense, metadata };
    });
    
    res.json({
      expenses: expensesWithMetadata,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get comprehensive expense statistics
router.get('/stats', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const where = { type: 'DEBIT' };
    
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const expenses = await prisma.transaction.findMany({ where });
    
    const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    
    const today = expenses.filter(e => 
      new Date(e.date).toDateString() === new Date().toDateString()
    ).reduce((sum, e) => sum + Number(e.amount), 0);
    
    const thisMonth = expenses.filter(e => {
      const date = new Date(e.date);
      const now = new Date();
      return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    }).reduce((sum, e) => sum + Number(e.amount), 0);

    const thisYear = expenses.filter(e => {
      const date = new Date(e.date);
      const now = new Date();
      return date.getFullYear() === now.getFullYear();
    }).reduce((sum, e) => sum + Number(e.amount), 0);
    
    // Category breakdown
    const byCategory = {};
    expenses.forEach(e => {
      byCategory[e.category] = (byCategory[e.category] || 0) + Number(e.amount);
    });

    // Monthly trend (last 12 months)
    const monthlyTrend = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthExpenses = expenses.filter(e => {
        const expenseDate = new Date(e.date);
        return expenseDate.getMonth() === date.getMonth() && 
               expenseDate.getFullYear() === date.getFullYear();
      }).reduce((sum, e) => sum + Number(e.amount), 0);
      
      monthlyTrend.push({
        month: date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        amount: monthExpenses
      });
    }

    // Top vendors
    const vendorExpenses = {};
    expenses.forEach(e => {
      const vendorMatch = e.description.match(/Vendor: ([^|]+)/);
      if (vendorMatch) {
        const vendor = vendorMatch[1].trim();
        vendorExpenses[vendor] = (vendorExpenses[vendor] || 0) + Number(e.amount);
      }
    });
    
    const topVendors = Object.entries(vendorExpenses)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([vendor, amount]) => ({ vendor, amount }));

    // Average expense per category
    const avgByCategory = {};
    Object.keys(byCategory).forEach(category => {
      const categoryExpenses = expenses.filter(e => e.category === category);
      avgByCategory[category] = categoryExpenses.length > 0 ? 
        byCategory[category] / categoryExpenses.length : 0;
    });
    
    res.json({ 
      total, 
      today, 
      thisMonth, 
      thisYear,
      byCategory, 
      avgByCategory,
      monthlyTrend,
      topVendors,
      totalTransactions: expenses.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single expense with metadata
router.get('/:id', auth, async (req, res) => {
  try {
    const expense = await prisma.transaction.findUnique({
      where: { id: req.params.id },
      include: { account: true }
    });
    
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    // Parse metadata
    let metadata = {};
    try {
      const metaMatch = expense.description.match(/META: ({.*})$/);
      if (metaMatch) {
        metadata = JSON.parse(metaMatch[1]);
        expense.description = expense.description.replace(/ \| META: {.*}$/, '');
      }
    } catch (e) {
      // Ignore parsing errors
    }

    res.json({ ...expense, metadata });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update expense
router.put('/:id', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const { error, value } = updateExpenseSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const expense = await prisma.transaction.findUnique({
      where: { id: req.params.id }
    });

    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    const { category, amount, description, paymentMethod, vendor, receiptUrl, tags, status } = value;
    
    // If amount changed, update account balance
    if (amount && amount !== Number(expense.amount)) {
      const difference = parseFloat(amount) - Number(expense.amount);
      await prisma.account.update({
        where: { id: expense.accountId },
        data: { balance: { increment: difference } }
      });
    }

    // Parse existing metadata
    let existingMetadata = {};
    try {
      const metaMatch = expense.description.match(/META: ({.*})$/);
      if (metaMatch) {
        existingMetadata = JSON.parse(metaMatch[1]);
      }
    } catch (e) {
      // Ignore parsing errors
    }

    // Update metadata
    const updatedMetadata = {
      ...existingMetadata,
      ...(paymentMethod && { paymentMethod }),
      ...(vendor && { vendor }),
      ...(receiptUrl && { receiptUrl }),
      ...(tags && { tags }),
      ...(status && { status }),
      updatedBy: req.user.id,
      updatedAt: new Date()
    };

    const baseDescription = expense.description.replace(/ \| META: {.*}$/, '');
    const newDescription = description || baseDescription;
    const fullDescription = `${newDescription}${vendor ? ` - Vendor: ${vendor}` : ''} | META: ${JSON.stringify(updatedMetadata)}`;

    const updatedExpense = await prisma.transaction.update({
      where: { id: req.params.id },
      data: {
        ...(category && { category }),
        ...(amount && { amount: parseFloat(amount) }),
        description: fullDescription
      },
      include: { account: true }
    });

    res.json({ ...updatedExpense, metadata: updatedMetadata });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk operations
router.post('/bulk', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const { action, expenseIds } = req.body;
    
    if (!action || !expenseIds || !Array.isArray(expenseIds)) {
      return res.status(400).json({ error: 'Action and expense IDs are required' });
    }

    let result;
    switch (action) {
      case 'DELETE':
        const expenses = await prisma.transaction.findMany({
          where: { id: { in: expenseIds } }
        });
        
        // Reverse accounting for each expense
        for (const expense of expenses) {
          await prisma.account.update({
            where: { id: expense.accountId },
            data: { balance: { decrement: parseFloat(expense.amount) } }
          });
        }
        
        result = await prisma.transaction.deleteMany({
          where: { id: { in: expenseIds } }
        });
        break;
        
      case 'APPROVE':
        result = await prisma.transaction.updateMany({
          where: { id: { in: expenseIds } },
          data: {
            description: {
              // This is a simplified approach - in production, you'd want proper metadata handling
            }
          }
        });
        break;
        
      default:
        return res.status(400).json({ error: 'Invalid action' });
    }

    res.json({ message: `Bulk ${action.toLowerCase()} completed`, affected: result.count });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const expense = await prisma.transaction.findUnique({
      where: { id: req.params.id }
    });
    
    if (!expense) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    
    // Reverse accounting
    await prisma.account.update({
      where: { id: expense.accountId },
      data: { balance: { decrement: parseFloat(expense.amount) } }
    });
    
    await prisma.transaction.delete({ where: { id: req.params.id } });
    
    res.json({ message: 'Expense deleted and accounting reversed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
