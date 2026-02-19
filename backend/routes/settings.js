const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.get('/', auth, async (req, res) => {
  try {
    const settings = await prisma.settings.findFirst();
    res.json(settings || {});
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const data = req.body;
    
    const existing = await prisma.settings.findFirst();
    
    const updateData = {
      gymName: data.gymName,
      logoUrl: data.logoUrl || null,
      monthlyFeeDefault: data.monthlyFeeDefault ? parseFloat(data.monthlyFeeDefault) : 50,
      lateFee: data.lateFee ? parseFloat(data.lateFee) : 10,
      workingHours: data.workingHours || { open: '06:00', close: '22:00' },
      smsEmailConfig: data.smsEmailConfig || null,
      dueMessageTemplate: data.dueMessageTemplate || null,
      renewalMessageTemplate: data.renewalMessageTemplate || null,
      enableSMS: data.enableSMS ?? true,
      enableEmail: data.enableEmail ?? true,
      enableWhatsApp: data.enableWhatsApp ?? false,
      emailHost: data.emailHost || null,
      emailPort: data.emailPort ? parseInt(data.emailPort) : 587,
      emailUser: data.emailUser || null,
      emailPass: data.emailPass || null,
      twilioAccountSid: data.twilioAccountSid || null,
      twilioAuthToken: data.twilioAuthToken || null,
      twilioPhoneNumber: data.twilioPhoneNumber || null,
      twilioTestNumber: data.twilioTestNumber || null,
      whatsappApiUrl: data.whatsappApiUrl || null,
      whatsappApiKey: data.whatsappApiKey || null,
      whatsappPhoneId: data.whatsappPhoneId || null
    };
    
    let settings;
    if (existing) {
      settings = await prisma.settings.update({
        where: { id: existing.id },
        data: updateData
      });
    } else {
      settings = await prisma.settings.create({
        data: updateData
      });
    }
    
    res.json(settings);
  } catch (error) {
    console.error('Settings update error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
