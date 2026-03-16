const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { auth, authorize } = require('../middleware/auth');
const crypto = require('crypto');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();
const prisma = new PrismaClient();

// Logo upload storage
const logoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(__dirname, '../uploads/logo');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `gym-logo${ext}`);
  }
});
const uploadLogo = multer({
  storage: logoStorage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files allowed'));
  }
});

// Upload gym logo
router.post('/upload-logo', auth, authorize('ADMIN'), uploadLogo.single('logo'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const logoUrl = `/uploads/logo/${req.file.filename}`;
  res.json({ logoUrl });
});

router.get('/', auth, async (req, res) => {
  try {
    const settings = await prisma.settings.findFirst();
    if (!settings) return res.json({});
    // Parse workingHours JSON
    try { settings.workingHours = JSON.parse(settings.workingHours); } catch {}
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const d = req.body;

    const updateData = {
      updatedAt: new Date(),
      // Gym profile
      gymName:               d.gymName || 'My Gym',
      gymAddress:            d.gymAddress            || null,
      gymPhone:              d.gymPhone              || null,
      gymEmail:              d.gymEmail              || null,
      gymWebsite:            d.gymWebsite            || null,
      gymTagline:            d.gymTagline            || null,
      logoUrl:               d.logoUrl               || null,
      currency:              d.currency              || 'PKR',
      currencySymbol:        d.currencySymbol        || 'Rs',
      timezone:              d.timezone              || 'Asia/Karachi',
      // Fees
      monthlyFeeDefault:     d.monthlyFeeDefault ? parseFloat(d.monthlyFeeDefault) : 3000,
      lateFee:               d.lateFee           ? parseFloat(d.lateFee)           : 0,
      // Working hours stored as JSON string
      workingHours: JSON.stringify(
        d.workingHours && typeof d.workingHours === 'object'
          ? d.workingHours
          : { open: '06:00', close: '22:00' }
      ),
      // Membership
      membershipGraceDays:    d.membershipGraceDays    != null ? parseInt(d.membershipGraceDays)    : 3,
      autoRenewMembership:    d.autoRenewMembership    ?? false,
      membershipReminderDays: d.membershipReminderDays != null ? parseInt(d.membershipReminderDays) : 7,
      // Tax
      taxEnabled:   d.taxEnabled  ?? false,
      taxRate:      d.taxRate     ? parseFloat(d.taxRate) : 0,
      taxLabel:     d.taxLabel    || 'GST',
      taxNumber:    d.taxNumber   || null,
      // Payment slip
      paymentSlipHeader:   d.paymentSlipHeader   || null,
      paymentSlipFooter:   d.paymentSlipFooter   || null,
      paymentSlipNotes:    d.paymentSlipNotes    || null,
      showQrOnSlip:        d.showQrOnSlip        ?? true,
      showLogoOnSlip:      d.showLogoOnSlip      ?? true,
      slipPrimaryColor:    d.slipPrimaryColor    || '#3b82f6',
      bankName:            d.bankName            || null,
      bankAccountTitle:    d.bankAccountTitle    || null,
      bankAccountNumber:   d.bankAccountNumber   || null,
      bankIban:            d.bankIban            || null,
      // Notifications
      enableSMS:      d.enableSMS      ?? true,
      enableEmail:    d.enableEmail    ?? true,
      enableWhatsApp: d.enableWhatsApp ?? false,
      // Email SMTP
      emailHost: d.emailHost || 'smtp.gmail.com',
      emailPort: d.emailPort ? parseInt(d.emailPort) : 587,
      emailUser: d.emailUser || null,
      emailPass: d.emailPass || null,
      // Twilio SMS
      twilioAccountSid:  d.twilioAccountSid  || null,
      twilioAuthToken:   d.twilioAuthToken   || null,
      twilioPhoneNumber: d.twilioPhoneNumber || null,
      twilioTestNumber:  d.twilioTestNumber  || null,
      // WhatsApp
      whatsappApiUrl:  d.whatsappApiUrl  || null,
      whatsappApiKey:  d.whatsappApiKey  || null,
      whatsappPhoneId: d.whatsappPhoneId || null,
      // Templates
      dueMessageTemplate:     d.dueMessageTemplate     || null,
      renewalMessageTemplate: d.renewalMessageTemplate || null,
      welcomeMessageTemplate: d.welcomeMessageTemplate || null,
      // Security
      sessionTimeoutMins:    d.sessionTimeoutMins    != null ? parseInt(d.sessionTimeoutMins)    : 60,
      requirePasswordChange: d.requirePasswordChange ?? false,
    };

    const existing = await prisma.settings.findFirst();
    let settings;
    if (existing) {
      settings = await prisma.settings.update({ where: { id: existing.id }, data: updateData });
    } else {
      settings = await prisma.settings.create({ data: { id: crypto.randomUUID(), ...updateData } });
    }

    try { settings.workingHours = JSON.parse(settings.workingHours); } catch {}
    res.json(settings);
  } catch (error) {
    console.error('Settings update error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Test email connection
router.post('/test-email', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const { sendEmail } = require('../utils/email');
    const settings = await prisma.settings.findFirst();
    if (!settings?.emailUser) return res.status(400).json({ error: 'Email not configured' });
    await sendEmail(settings.emailUser, 'GMS Test Email', 'Your email configuration is working correctly!');
    res.json({ success: true, message: 'Test email sent successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Test SMS connection
router.post('/test-sms', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const { sendSMS } = require('../utils/sms');
    const settings = await prisma.settings.findFirst();
    const testNumber = settings?.twilioTestNumber || req.body.phone;
    if (!testNumber) return res.status(400).json({ error: 'No test number configured' });
    await sendSMS(testNumber, 'GMS Test SMS: Your SMS configuration is working correctly!');
    res.json({ success: true, message: `Test SMS sent to ${testNumber}` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
