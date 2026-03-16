const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { auth, authorize } = require('../middleware/auth');
const QRCode = require('qrcode');

const router = express.Router();
const prisma = new PrismaClient();
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// PUBLIC — no auth — verify payment by QR scan
router.get('/verify/:paymentId', async (req, res) => {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: req.params.paymentId },
      include: {
        membership: {
          include: { member: true, plan: true }
        }
      }
    });
    if (!payment) return res.status(404).json({ error: 'Payment not found' });

    const settings = await prisma.settings.findFirst();

    res.json({ payment, settings });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate QR data URL for a payment (used by slip)
router.get('/:id/qr', auth, async (req, res) => {
  try {
    const verifyUrl = `${FRONTEND_URL}/verify-payment/${req.params.id}`;
    const qr = await QRCode.toDataURL(verifyUrl, { errorCorrectionLevel: 'H', margin: 1, width: 200 });
    res.json({ qr, url: verifyUrl });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const resolveMemberIdForUser = async (userId) => {
  const member = await prisma.member.findUnique({
    where: { userId },
    select: { id: true },
  });
  return member?.id || null;
};

router.post('/', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const { memberId, membershipId, amount, method, notes } = req.body;
    
    let targetMembershipId = membershipId;
    
    // If memberId is provided instead of membershipId, find the active membership
    if (memberId && !membershipId) {
      const membership = await prisma.membership.findFirst({
        where: { memberId },
        orderBy: { startDate: 'desc' }
      });
      
      if (!membership) {
        return res.status(404).json({ error: 'No membership found for this member' });
      }
      
      // Check if already paid
      if (membership.paymentStatus === 'PAID') {
        return res.status(400).json({ error: 'Payment already completed for this membership period' });
      }
      
      targetMembershipId = membership.id;
    }
    
    if (!targetMembershipId) {
      return res.status(400).json({ error: 'Either memberId or membershipId is required' });
    }
    
    const crypto = require('crypto');
    const payment = await prisma.payment.create({
      data: { 
        id: crypto.randomUUID(),
        membershipId: targetMembershipId, 
        amount: parseFloat(amount), 
        method, 
        notes 
      }
    });

    await prisma.membership.update({
      where: { id: targetMembershipId },
      data: { paymentStatus: 'PAID' }
    });

    const membership = await prisma.membership.findUnique({
      where: { id: targetMembershipId },
      include: { member: true }
    });

    // Create accounting transaction
    let incomeAccount = await prisma.account.findFirst({
      where: { type: 'INCOME', accountName: { contains: 'Membership' } }
    });
    
    // Create income account if it doesn't exist
    if (!incomeAccount) {
      const crypto = require('crypto');
      incomeAccount = await prisma.account.create({
        data: {
          id: crypto.randomUUID(),
          accountName: 'Membership Income',
          type: 'INCOME',
          balance: 0,
          description: 'Income from member fees'
        }
      });
    }

    if (incomeAccount) {
      const crypto = require('crypto');
      const desc = `Payment from ${membership.member.name}${notes ? ' - ' + notes : ''}`;
      const amt = parseFloat(amount);

      // Find or create Cash account (asset side of double-entry)
      let cashAccount = await prisma.account.findFirst({
        where: { type: 'ASSET', accountName: { contains: 'Cash' } }
      });
      if (!cashAccount) {
        cashAccount = await prisma.account.create({
          data: { id: crypto.randomUUID(), accountName: 'Cash', type: 'ASSET', balance: 0, description: 'Cash on hand' }
        });
      }

      // DEBIT Cash (asset increases)
      await prisma.transaction.create({
        data: { id: crypto.randomUUID(), accountId: cashAccount.id, amount: amt, type: 'DEBIT', category: 'MEMBER_FEE', description: desc, referenceId: payment.id }
      });
      await prisma.account.update({
        where: { id: cashAccount.id },
        data: { balance: { increment: amt } }
      });

      // CREDIT Income
      await prisma.transaction.create({
        data: { id: crypto.randomUUID(), accountId: incomeAccount.id, amount: amt, type: 'CREDIT', category: 'MEMBER_FEE', description: desc, referenceId: payment.id }
      });
      await prisma.account.update({
        where: { id: incomeAccount.id },
        data: { balance: { increment: amt } }
      });
    }

    res.status(201).json(payment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const { startDate, endDate, method } = req.query;
    const where = {};

    if (req.user.role === 'MEMBER') {
      const memberId = await resolveMemberIdForUser(req.user.id);
      if (!memberId) {
        return res.status(403).json({ error: 'Access denied' });
      }
      where.membership = { memberId };
    }
    
    if (startDate && endDate) {
      where.paymentDate = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }
    
    if (method) {
      where.method = method;
    }
    
    const payments = await prisma.payment.findMany({
      where,
      include: { 
        membership: { 
          include: { member: true, plan: true } 
        } 
      },
      orderBy: { paymentDate: 'desc' }
    });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: req.params.id },
      include: { 
        membership: { 
          include: { member: true, plan: true } 
        } 
      }
    });
    if (!payment) return res.status(404).json({ error: 'Payment not found' });

    if (req.user.role === 'MEMBER') {
      const memberId = await resolveMemberIdForUser(req.user.id);
      if (!memberId || payment.membership?.member?.id !== memberId) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    res.json(payment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', auth, authorize('ADMIN'), async (req, res) => {
  try {
    // Get payment details before deleting
    const payment = await prisma.payment.findUnique({
      where: { id: req.params.id },
      include: { 
        membership: { include: { member: true } }
      }
    });
    
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }
    
    // Find and reverse accounting transaction by referenceId
    const transactions = await prisma.transaction.findMany({
      where: { referenceId: payment.id }
    });
    
    if (transactions && transactions.length > 0) {
      for (const txn of transactions) {
        // Decrease account balance
        await prisma.account.update({
          where: { id: txn.accountId },
          data: { balance: { decrement: parseFloat(txn.amount) } }
        });
        
        // Delete transaction
        await prisma.transaction.delete({ where: { id: txn.id } });
      }
    }
    
    // Delete the payment
    await prisma.payment.delete({ where: { id: req.params.id } });
    
    // Update membership status back to PENDING
    await prisma.membership.update({
      where: { id: payment.membershipId },
      data: { paymentStatus: 'PENDING' }
    });
    
    res.json({ message: 'Payment deleted and accounting reversed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/member/:memberId', auth, async (req, res) => {
  try {
    if (req.user.role === 'MEMBER') {
      const memberId = await resolveMemberIdForUser(req.user.id);
      if (!memberId || req.params.memberId !== memberId) {
        return res.status(403).json({ error: 'Access denied' });
      }
    }

    const payments = await prisma.payment.findMany({
      where: { membership: { memberId: req.params.memberId } },
      include: {
        membership: {
          include: { member: true, plan: true },
        },
      },
      orderBy: { paymentDate: 'desc' }
    });
    res.json(payments);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
