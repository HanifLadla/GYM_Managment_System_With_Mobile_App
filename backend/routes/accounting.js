const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { randomUUID } = require('crypto');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// ── ACCOUNTS ──────────────────────────────────────────────────────────────────

router.get('/accounts', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const accounts = await prisma.account.findMany({
      orderBy: [{ type: 'asc' }, { accountName: 'asc' }],
      include: { _count: { select: { transaction: true } } }
    });
    res.json(accounts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/accounts', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const { accountName, type, description } = req.body;
    if (!accountName || !type) return res.status(400).json({ error: 'accountName and type are required' });
    const account = await prisma.account.create({
      data: { id: randomUUID(), accountName, type, description }
    });
    res.status(201).json(account);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/accounts/:id', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const { accountName, description } = req.body;
    const account = await prisma.account.update({
      where: { id: req.params.id },
      data: { accountName, description }
    });
    res.json(account);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/accounts/:id', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const count = await prisma.transaction.count({ where: { accountId: req.params.id } });
    if (count > 0) return res.status(400).json({ error: 'Cannot delete account with existing transactions' });
    await prisma.account.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── TRANSACTIONS ──────────────────────────────────────────────────────────────

router.get('/transactions', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const { category, accountId, date_from, date_to, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = {
      ...(category && { category }),
      ...(accountId && { accountId }),
      ...(date_from && date_to && { date: { gte: new Date(date_from), lte: new Date(date_to) } })
    };
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where, skip, take: parseInt(limit),
        orderBy: { date: 'desc' },
        include: { account: true, payment: true }
      }),
      prisma.transaction.count({ where })
    ]);
    res.json({ transactions, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/transactions', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const { accountId, amount, type, description, category, referenceId } = req.body;
    const transaction = await prisma.$transaction(async (tx) => {
      const newTxn = await tx.transaction.create({
        data: { id: randomUUID(), accountId, amount, type, description, category, referenceId, createdBy: req.user.id }
      });
      const account = await tx.account.findUnique({ where: { id: accountId } });
      const balanceChange = type === 'DEBIT' ? -parseFloat(amount) : parseFloat(amount);
      await tx.account.update({ where: { id: accountId }, data: { balance: parseFloat(account.balance) + balanceChange } });
      return newTxn;
    });
    res.status(201).json(transaction);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── JOURNAL ENTRIES ───────────────────────────────────────────────────────────

router.get('/journal-entries', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const { page = 1, limit = 50, search = '' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const where = search ? { description: { contains: search } } : {};
    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where, orderBy: { date: 'desc' }, skip, take: parseInt(limit),
        include: { account: true }
      }),
      prisma.transaction.count({ where })
    ]);
    // Group paired entries by referenceId so each journal entry shows as one row
    const grouped = {};
    const ungrouped = [];
    for (const t of transactions) {
      if (t.referenceId) {
        if (!grouped[t.referenceId]) grouped[t.referenceId] = [];
        grouped[t.referenceId].push(t);
      } else {
        ungrouped.push({ ...t, source: 'Manual' });
      }
    }
    const pairedEntries = Object.entries(grouped).map(([refId, txns]) => {
      const debit  = txns.find(t => t.type === 'DEBIT')  || txns[0];
      const credit = txns.find(t => t.type === 'CREDIT') || txns[1];
      return {
        id: refId,
        date: debit.date,
        amount: debit.amount,
        description: debit.description,
        category: debit.category,
        debitAccount: debit.account?.accountName,
        creditAccount: credit?.account?.accountName,
        source: 'Auto'
      };
    });
    const manual = ungrouped.map(t => ({
      id: t.id,
      date: t.date,
      amount: t.amount,
      description: t.description,
      category: t.category,
      debitAccount:  t.type === 'DEBIT'  ? t.account?.accountName : null,
      creditAccount: t.type === 'CREDIT' ? t.account?.accountName : null,
      source: 'Manual'
    }));
    const entries = [...pairedEntries, ...manual].sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json({ transactions: entries, total: entries.length, pages: Math.ceil(entries.length / parseInt(limit)) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/journal-entry', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const { debitAccountId, creditAccountId, amount, description, category, date } = req.body;
    if (!debitAccountId || !creditAccountId || !amount)
      return res.status(400).json({ error: 'debitAccountId, creditAccountId and amount are required' });
    if (debitAccountId === creditAccountId)
      return res.status(400).json({ error: 'Debit and credit accounts must be different' });
    const entryDate = date ? new Date(date) : new Date();
    const result = await prisma.$transaction(async (tx) => {
      const [debitAcc, creditAcc] = await Promise.all([
        tx.account.findUnique({ where: { id: debitAccountId } }),
        tx.account.findUnique({ where: { id: creditAccountId } })
      ]);
      if (!debitAcc || !creditAcc) throw new Error('Account not found');
      const cat = category || 'OTHER';
      const debitTxn = await tx.transaction.create({
        data: { id: randomUUID(), accountId: debitAccountId, amount, type: 'DEBIT', description, category: cat, date: entryDate, createdBy: req.user.id }
      });
      const creditTxn = await tx.transaction.create({
        data: { id: randomUUID(), accountId: creditAccountId, amount, type: 'CREDIT', description, category: cat, date: entryDate, createdBy: req.user.id }
      });
      await tx.account.update({ where: { id: debitAccountId }, data: { balance: parseFloat(debitAcc.balance) - parseFloat(amount) } });
      await tx.account.update({ where: { id: creditAccountId }, data: { balance: parseFloat(creditAcc.balance) + parseFloat(amount) } });
      return { debitTxn, creditTxn };
    });
    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── REPORTS ───────────────────────────────────────────────────────────────────

router.get('/balance-sheet', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const accounts = await prisma.account.findMany({ orderBy: [{ type: 'asc' }, { accountName: 'asc' }] });
    res.json({
      assets:      accounts.filter(a => a.type === 'ASSET').map(a => ({ ...a, balance: parseFloat(a.balance) })),
      liabilities: accounts.filter(a => a.type === 'LIABILITY').map(a => ({ ...a, balance: parseFloat(a.balance) })),
      equity:      accounts.filter(a => a.type === 'EQUITY').map(a => ({ ...a, balance: parseFloat(a.balance) })),
      totalAssets:      accounts.filter(a => a.type === 'ASSET').reduce((s, a) => s + parseFloat(a.balance), 0),
      totalLiabilities: accounts.filter(a => a.type === 'LIABILITY').reduce((s, a) => s + parseFloat(a.balance), 0),
      totalEquity:      accounts.filter(a => a.type === 'EQUITY').reduce((s, a) => s + parseFloat(a.balance), 0),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/profit-loss', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const { year = new Date().getFullYear(), month } = req.query;
    const startDate = month ? new Date(year, month - 1, 1) : new Date(year, 0, 1);
    const endDate   = month ? new Date(year, month, 0, 23, 59, 59) : new Date(year, 11, 31, 23, 59, 59);
    const transactions = await prisma.transaction.findMany({
      where: { date: { gte: startDate, lte: endDate } },
      include: { account: true }
    });
    const incomeAccounts  = {};
    const expenseAccounts = {};
    for (const t of transactions) {
      if (t.account.type === 'INCOME') {
        const key = t.account.accountName;
        incomeAccounts[key] = (incomeAccounts[key] || 0) + (t.type === 'CREDIT' ? parseFloat(t.amount) : -parseFloat(t.amount));
      }
      if (t.account.type === 'EXPENSE') {
        const key = t.account.accountName;
        expenseAccounts[key] = (expenseAccounts[key] || 0) + (t.type === 'DEBIT' ? parseFloat(t.amount) : -parseFloat(t.amount));
      }
    }
    const income   = Object.values(incomeAccounts).reduce((s, v) => s + v, 0);
    const expenses = Object.values(expenseAccounts).reduce((s, v) => s + v, 0);
    res.json({ income, expenses, netProfit: income - expenses, incomeAccounts, expenseAccounts, startDate, endDate });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
