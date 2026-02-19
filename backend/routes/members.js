const express = require('express');
const { PrismaClient } = require('@prisma/client');
const Joi = require('joi');
const { auth, authorize } = require('../middleware/auth');
const { generateCard } = require('../utils/cardGenerator');
const { sendEmail } = require('../utils/email');
const { sendSMS } = require('../utils/sms');
const { sendWhatsApp } = require('../utils/whatsapp');

const router = express.Router();
const prisma = new PrismaClient();

const memberSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  name: Joi.string().required(),
  phone: Joi.string().required(),
  address: Joi.string().optional().allow(''),
  dob: Joi.date().optional().allow(null),
  gender: Joi.string().optional().allow(''),
  cnic: Joi.string().optional().allow(''),
  monthlyFee: Joi.number().required(),
  planId: Joi.string().optional().allow(''),
  planType: Joi.string().valid('BASIC', 'PREMIUM').required()
});

router.post('/', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const transaction = await prisma.$transaction(async (tx) => {
      const { error } = memberSchema.validate(req.body);
      if (error) throw new Error(error.details[0].message);

      const { email, password, name, phone, address, dob, gender, cnic, monthlyFee, planId, planType } = req.body;
      
      const bcrypt = require('bcryptjs');
      const crypto = require('crypto');
      const hashedPassword = await bcrypt.hash(password, 10);
      
      const userId = crypto.randomUUID();
      const memberId = crypto.randomUUID();
      const membershipId = crypto.randomUUID();
      const cardId = crypto.randomUUID();
      
      // Create user
      const user = await tx.user.create({
        data: { 
          id: userId,
          email, 
          password: hashedPassword, 
          role: 'MEMBER' 
        }
      });

      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + 30);

      // Create member
      const member = await tx.member.create({
        data: {
          id: memberId,
          userId: user.id,
          name,
          phone,
          address: address || null,
          dob: dob ? new Date(dob) : null,
          gender: gender || null,
          cnic: cnic || null,
          monthlyFee,
          expiryDate
        }
      });

      // Create membership
      const membership = await tx.membership.create({
        data: {
          id: membershipId,
          memberId: member.id,
          planId: planId || null,
          planType,
          endDate: expiryDate,
          feeAmount: monthlyFee
        }
      });

      // Generate QR code and card
      const cardNumber = `GYM-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      const QRCode = require('qrcode');
      const qrCodeUrl = await QRCode.toDataURL(cardNumber);
      
      const card = await tx.card.create({
        data: {
          id: cardId,
          memberId: member.id,
          cardNumber,
          qrCodeUrl
        }
      });
      
      return { member, card, user };
    });

    try {
      // Send welcome email (outside transaction)
      await sendEmail(transaction.user.email, 'Welcome to Gym', 
        `Welcome ${transaction.member.name}! Your card number: ${transaction.card.cardNumber}`);
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
    }
    
    res.status(201).json({ 
      member: {
        ...transaction.member,
        card: transaction.card
      }, 
      card: transaction.card,
      message: 'Member created successfully with QR card'
    });
  } catch (error) {
    console.error('Member creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', status = 'all', planType = 'all' } = req.query;
    const skip = (page - 1) * limit;

    let where = {};
    
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
        { cnic: { contains: search } },
        { user: { email: { contains: search, mode: 'insensitive' } } }
      ];
    }
    
    if (status !== 'all') {
      where.status = status;
    }
    
    if (planType !== 'all') {
      where.membership = {
        some: { planType }
      };
    }

    const [members, total] = await Promise.all([
      prisma.member.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        include: { 
          user: { select: { email: true } }, 
          membership: { 
            take: 1, 
            orderBy: { startDate: 'desc' },
            include: { plan: true }
          },
          card: true,
          attendance: { take: 5, orderBy: { date: 'desc' } }
        },
        orderBy: { joinDate: 'desc' }
      }),
      prisma.member.count({ where })
    ]);

    res.json({ members, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const member = await prisma.member.findUnique({
      where: { id: req.params.id },
      include: { 
        user: { select: { email: true } }, 
        membership: { 
          orderBy: { startDate: 'desc' },
          include: { plan: true }
        }, 
        card: true, 
        attendance: { 
          take: 10, 
          orderBy: { date: 'desc' } 
        } 
      }
    });
    
    if (!member) return res.status(404).json({ error: 'Member not found' });
    res.json(member);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const { name, phone, address, dob, gender, cnic, monthlyFee, status, email, planId, planType } = req.body;
    
    const result = await prisma.$transaction(async (tx) => {
      // Update member
      const member = await tx.member.update({
        where: { id: req.params.id },
        data: { 
          name, 
          phone, 
          address: address || null, 
          dob: dob ? new Date(dob) : null, 
          gender: gender || null, 
          cnic: cnic || null,
          monthlyFee, 
          status 
        }
      });

      // Update user email if provided
      if (email) {
        await tx.user.update({
          where: { id: member.userId },
          data: { email }
        });
      }

      // Update membership if planId or planType provided
      if (planId || planType) {
        const membership = await tx.membership.findFirst({
          where: { memberId: req.params.id },
          orderBy: { startDate: 'desc' }
        });

        if (membership) {
          await tx.membership.update({
            where: { id: membership.id },
            data: {
              planId: planId || membership.planId,
              planType: planType || membership.planType,
              feeAmount: monthlyFee || membership.feeAmount
            }
          });
        }
      }

      return member;
    });
    
    res.json({ member: result, message: 'Member updated successfully' });
  } catch (error) {
    console.error('Member update error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', auth, authorize('ADMIN'), async (req, res) => {
  try {
    await prisma.member.delete({ where: { id: req.params.id } });
    res.json({ message: 'Member deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/export', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const members = await prisma.member.findMany({
      include: { user: { select: { email: true } }, membership: true }
    });
    
    const csv = [
      'Name,Email,Phone,CNIC,Status,Plan Type,Monthly Fee,Join Date,Expiry Date',
      ...members.map(m => [
        m.name,
        m.user?.email || '',
        m.phone,
        m.cnic || '',
        m.status,
        m.membership?.[0]?.planType || 'BASIC',
        m.monthlyFee,
        new Date(m.joinDate).toLocaleDateString(),
        new Date(m.expiryDate).toLocaleDateString()
      ].join(','))
    ].join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=members.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/card', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const card = await generateCard(req.params.id);
    res.json(card);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Block member
router.put('/:id/block', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const member = await prisma.member.update({
      where: { id: req.params.id },
      data: { status: 'blocked' }
    });
    res.json({ message: 'Member blocked successfully', member });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Send due message
router.post('/:id/send-due', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const { method } = req.body;
    
    // Validate method
    if (!['sms', 'email', 'whatsapp'].includes(method)) {
      return res.status(400).json({ error: 'Invalid method. Must be sms, email, or whatsapp' });
    }
    
    // Get settings (with fallback if not configured)
    let settings = await prisma.settings.findFirst();
    if (!settings) {
      // Use default settings if not configured
      settings = {
        gymName: 'Gym',
        enableSMS: true,
        enableEmail: true,
        enableWhatsApp: false,
        dueMessageTemplate: 'Dear {name}, your gym fees of Rs {amount} are overdue. Please clear your dues to avoid service interruption. - {gymName}'
      };
    }
    
    // Check if method is enabled
    if (method === 'sms' && settings.enableSMS === false) {
      return res.status(400).json({ error: 'SMS notifications are disabled in settings' });
    }
    if (method === 'email' && settings.enableEmail === false) {
      return res.status(400).json({ error: 'Email notifications are disabled in settings' });
    }
    if (method === 'whatsapp' && settings.enableWhatsApp === false) {
      return res.status(400).json({ error: 'WhatsApp notifications are disabled in settings' });
    }
    
    // Get member details
    const member = await prisma.member.findUnique({
      where: { id: req.params.id },
      include: { 
        user: true, 
        membership: { 
          take: 1, 
          orderBy: { startDate: 'desc' },
          include: { plan: true }
        } 
      }
    });
    
    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }
    
    // Validate contact information
    if ((method === 'sms' || method === 'whatsapp') && !member.phone) {
      return res.status(400).json({ error: 'Member phone number not available' });
    }
    if (method === 'email' && !member.user?.email) {
      return res.status(400).json({ error: 'Member email not available' });
    }
    
    // Build message from template or default
    const template = settings.dueMessageTemplate || 
      'Dear {name}, your gym fees of Rs {amount} are overdue. Please clear your dues to avoid service interruption. - {gymName}';
    
    const message = template
      .replace(/{name}/g, member.name)
      .replace(/{amount}/g, member.monthlyFee.toString())
      .replace(/{gymName}/g, settings.gymName)
      .replace(/{phone}/g, member.phone || '')
      .replace(/{email}/g, member.user?.email || '')
      .replace(/{expiryDate}/g, new Date(member.expiryDate).toLocaleDateString())
      .replace(/{plan}/g, member.membership?.[0]?.plan?.name || 'N/A');
    
    // Send message
    if (method === 'sms') {
      await sendSMS(member.phone, message);
    } else if (method === 'whatsapp') {
      await sendWhatsApp(member.phone, message);
    } else if (method === 'email') {
      await sendEmail(member.user.email, `Payment Due Reminder - ${settings.gymName}`, message);
    }
    
    res.json({ 
      success: true,
      message: `Due reminder sent via ${method}`,
      sentTo: method === 'email' ? member.user.email : member.phone
    });
  } catch (error) {
    console.error('Send due message error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Send renewal message
router.post('/:id/send-renewal', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const { method } = req.body;
    
    // Validate method
    if (!['sms', 'email', 'whatsapp'].includes(method)) {
      return res.status(400).json({ error: 'Invalid method. Must be sms, email, or whatsapp' });
    }
    
    // Get settings (with fallback if not configured)
    let settings = await prisma.settings.findFirst();
    if (!settings) {
      settings = {
        gymName: 'Gym',
        enableSMS: true,
        enableEmail: true,
        enableWhatsApp: false,
        renewalMessageTemplate: 'Dear {name}, your gym membership expires on {expiryDate}. Please renew to continue your fitness journey with us. - {gymName}'
      };
    }
    
    // Check if method is enabled
    if (method === 'sms' && settings.enableSMS === false) {
      return res.status(400).json({ error: 'SMS notifications are disabled in settings' });
    }
    if (method === 'email' && settings.enableEmail === false) {
      return res.status(400).json({ error: 'Email notifications are disabled in settings' });
    }
    if (method === 'whatsapp' && settings.enableWhatsApp === false) {
      return res.status(400).json({ error: 'WhatsApp notifications are disabled in settings' });
    }
    
    // Get member details
    const member = await prisma.member.findUnique({
      where: { id: req.params.id },
      include: { 
        user: true,
        membership: { 
          take: 1, 
          orderBy: { startDate: 'desc' },
          include: { plan: true }
        }
      }
    });
    
    if (!member) {
      return res.status(404).json({ error: 'Member not found' });
    }
    
    // Validate contact information
    if ((method === 'sms' || method === 'whatsapp') && !member.phone) {
      return res.status(400).json({ error: 'Member phone number not available' });
    }
    if (method === 'email' && !member.user?.email) {
      return res.status(400).json({ error: 'Member email not available' });
    }
    
    // Build message from template or default
    const template = settings.renewalMessageTemplate || 
      'Dear {name}, your gym membership expires on {expiryDate}. Please renew to continue your fitness journey with us. - {gymName}';
    
    const message = template
      .replace(/{name}/g, member.name)
      .replace(/{amount}/g, member.monthlyFee.toString())
      .replace(/{gymName}/g, settings.gymName)
      .replace(/{phone}/g, member.phone || '')
      .replace(/{email}/g, member.user?.email || '')
      .replace(/{expiryDate}/g, new Date(member.expiryDate).toLocaleDateString())
      .replace(/{plan}/g, member.membership?.[0]?.plan?.name || 'N/A');
    
    // Send message
    if (method === 'sms') {
      await sendSMS(member.phone, message);
    } else if (method === 'whatsapp') {
      await sendWhatsApp(member.phone, message);
    } else if (method === 'email') {
      await sendEmail(member.user.email, `Membership Renewal Reminder - ${settings.gymName}`, message);
    }
    
    res.json({ 
      success: true,
      message: `Renewal reminder sent via ${method}`,
      sentTo: method === 'email' ? member.user.email : member.phone
    });
  } catch (error) {
    console.error('Send renewal message error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Member payment report
router.get('/:id/payment-report', auth, async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      where: {
        membership: {
          memberId: req.params.id
        }
      },
      include: {
        membership: {
          include: {
            member: { select: { name: true } }
          }
        }
      },
      orderBy: { paymentDate: 'desc' }
    });
    
    const totalPaid = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    
    res.json({ payments, totalPaid, count: payments.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Member attendance report
router.get('/:id/attendance-report', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    let where = { memberId: req.params.id };
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }
    
    const attendance = await prisma.attendance.findMany({
      where,
      include: {
        member: { select: { name: true } }
      },
      orderBy: { date: 'desc' }
    });
    
    const totalDays = attendance.length;
    const avgHours = attendance
      .filter(a => a.checkOutTime)
      .reduce((sum, a) => {
        const hours = (new Date(a.checkOutTime) - new Date(a.checkInTime)) / (1000 * 60 * 60);
        return sum + hours;
      }, 0) / attendance.filter(a => a.checkOutTime).length || 0;
    
    res.json({ attendance, totalDays, avgHours: Math.round(avgHours * 100) / 100 });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
