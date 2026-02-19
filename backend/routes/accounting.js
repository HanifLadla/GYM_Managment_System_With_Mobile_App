const express = require('express');
const { PrismaClient } = require('@prisma/client');
const Joi = require('joi');
const { auth, authorize } = require('../middleware/auth');
const { generateInvoicePDF } = require('../utils/pdfGenerator');

const router = express.Router();
const prisma = new PrismaClient();

// Accounts
router.get('/accounts', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const accounts = await prisma.account.findMany({
      include: { _count: { select: { transactions: true } } }
    });
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/accounts', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const { accountName, type, description } = req.body;
    const account = await prisma.account.create({
      data: { accountName, type, description }
    });
    res.status(201).json(account);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Transactions
router.get('/transactions', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const { category, date_from, date_to, page = 1, limit = 20 } = req.query;
    const skip = (page - 1) * limit;

    const where = {
      ...(category && { category }),
      ...(date_from && date_to && {
        date: { gte: new Date(date_from), lte: new Date(date_to) }
      })
    };

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        orderBy: { date: 'desc' },
        include: { account: true, payment: true }
      }),
      prisma.transaction.count({ where })
    ]);

    res.json({ transactions, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/transactions', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const { accountId, amount, type, description, category, referenceId } = req.body;
    
    const transaction = await prisma.$transaction(async (tx) => {
      const newTransaction = await tx.transaction.create({
        data: {
          accountId,
          amount,
          type,
          description,
          category,
          referenceId,
          createdBy: req.user.id
        }
      });

      const account = await tx.account.findUnique({ where: { id: accountId } });
      const balanceChange = type === 'DEBIT' ? -parseFloat(amount) : parseFloat(amount);
      
      await tx.account.update({
        where: { id: accountId },
        data: { balance: parseFloat(account.balance) + balanceChange }
      });

      return newTransaction;
    });

    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'CREATE_TRANSACTION',
        details: { transactionId: transaction.id, amount, type }
      }
    });

    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Balance Sheet
router.get('/balance-sheet', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const accounts = await prisma.account.findMany();
    
    const balanceSheet = {
      assets: accounts.filter(a => a.type === 'ASSET').reduce((sum, a) => sum + parseFloat(a.balance), 0),
      liabilities: accounts.filter(a => a.type === 'LIABILITY').reduce((sum, a) => sum + parseFloat(a.balance), 0),
      equity: accounts.filter(a => a.type === 'EQUITY').reduce((sum, a) => sum + parseFloat(a.balance), 0),
      accounts: accounts.map(a => ({ ...a, balance: parseFloat(a.balance) }))
    };

    res.json(balanceSheet);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Profit & Loss
router.get('/profit-loss', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const { period = 'MONTHLY', year = new Date().getFullYear(), month } = req.query;
    
    let startDate, endDate;
    if (period === 'MONTHLY' && month) {
      startDate = new Date(year, month - 1, 1);
      endDate = new Date(year, month, 0);
    } else {
      startDate = new Date(year, 0, 1);
      endDate = new Date(year, 11, 31);
    }

    const transactions = await prisma.transaction.findMany({
      where: {
        date: { gte: startDate, lte: endDate }
      },
      include: { account: true }
    });

    const income = transactions
      .filter(t => t.account.type === 'INCOME')
      .reduce((sum, t) => sum + (t.type === 'CREDIT' ? parseFloat(t.amount) : -parseFloat(t.amount)), 0);

    const expenses = transactions
      .filter(t => t.account.type === 'EXPENSE')
      .reduce((sum, t) => sum + (t.type === 'DEBIT' ? parseFloat(t.amount) : -parseFloat(t.amount)), 0);

    const profitLoss = {
      income,
      expenses,
      netProfit: income - expenses,
      period,
      startDate,
      endDate
    };

    res.json(profitLoss);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Invoices
router.post('/invoices', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const { memberId, transactionId, totalAmount, dueDate } = req.body;
    
    const invoiceNumber = `INV-${Date.now()}`;
    const pdfUrl = await generateInvoicePDF({ invoiceNumber, totalAmount, dueDate, memberId });

    const invoice = await prisma.invoice.create({
      data: {
        memberId,
        transactionId,
        invoiceNumber,
        totalAmount,
        dueDate: new Date(dueDate),
        pdfUrl,
        status: 'SENT'
      },
      include: { member: true, transaction: true }
    });

    res.status(201).json(invoice);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/invoices/:id', auth, async (req, res) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id },
      include: { member: true, transaction: true }
    });
    
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/invoices', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const invoices = await prisma.invoice.findMany({
      orderBy: { createdAt: 'desc' },
      include: { member: true }
    });
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
