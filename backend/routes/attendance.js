const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { auth } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.post('/checkin/:cardId', auth, async (req, res) => {
  try {
    // Get gym settings for gym name
    const settings = await prisma.settings.findFirst();
    const gymName = settings?.gymName || 'Fitness Center';

    const card = await prisma.card.findUnique({
      where: { cardNumber: req.params.cardId },
      include: { 
        member: { 
          include: { 
            membership: { 
              orderBy: { startDate: 'desc' },
              take: 1
            },
            user: true
          } 
        } 
      }
    });

    if (!card) {
      return res.status(404).json({ 
        error: 'Invalid QR Code', 
        gateAccess: false,
        message: 'Card not found in system',
        announcement: 'Invalid card. Please contact reception.'
      });
    }
    
    const member = card.member;
    
    // Validation 1: Check if member exists
    if (!member) {
      return res.status(404).json({ 
        error: 'Member not found', 
        gateAccess: false,
        message: 'Member record not found',
        announcement: 'Member not found. Please contact reception.'
      });
    }

    // Validation 2: Check membership status
    if (member.status !== 'active') {
      return res.status(403).json({ 
        error: 'Membership inactive', 
        gateAccess: false,
        message: `Membership status: ${member.status}. Please contact reception.`,
        announcement: `${member.name}, your membership is ${member.status}. Please contact reception.`
      });
    }

    // Validation 3: Check expiry date
    if (new Date() > new Date(member.expiryDate)) {
      return res.status(403).json({ 
        error: 'Membership expired', 
        gateAccess: false,
        message: `Membership expired on ${new Date(member.expiryDate).toLocaleDateString()}`,
        announcement: `${member.name}, your membership has expired. Please renew to continue.`
      });
    }

    // Validation 4: Check fees status
    const activeMembership = member.membership[0];
    if (activeMembership && (activeMembership.paymentStatus === 'PENDING' || activeMembership.paymentStatus === 'OVERDUE')) {
      return res.status(403).json({ 
        error: 'Fees pending', 
        gateAccess: false,
        message: `Fees Pending: $${activeMembership.feeAmount}. Please clear your dues.`,
        announcement: `${member.name}, you have pending fees of ${activeMembership.feeAmount} dollars. Please clear your dues at reception.`
      });
    }

    // Check if member is already checked in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const existingAttendance = await prisma.attendance.findFirst({
      where: {
        memberId: card.memberId,
        date: {
          gte: today,
          lt: tomorrow
        },
        checkOutTime: null
      }
    });

    if (existingAttendance) {
      // Member is already checked in - perform checkout
      const updatedAttendance = await prisma.attendance.update({
        where: { id: existingAttendance.id },
        data: { checkOutTime: new Date() },
        include: { member: true }
      });

      const checkoutMessage = `Goodbye ${member.name}! Thank you for visiting ${gymName}. Have a great day!`;
      const checkoutAnnouncement = `Goodbye ${member.name}! Thank you for visiting ${gymName}. Have a great day!`;

      global.io.emit('attendance:checkout', { 
        member: member.name, 
        time: updatedAttendance.checkOutTime,
        gateAccess: true,
        announcement: checkoutAnnouncement
      });
      
      return res.json({ 
        message: checkoutMessage,
        announcement: checkoutAnnouncement,
        attendance: updatedAttendance,
        gateAccess: true,
        action: 'checkout',
        memberName: member.name,
        gymName: gymName
      });
    }

    // Member not checked in - perform checkin
    const crypto = require('crypto');
    const attendance = await prisma.attendance.create({
      data: {
        id: crypto.randomUUID(),
        memberId: card.memberId,
        cardId: req.params.cardId,
        date: new Date()
      },
      include: { member: true }
    });

    const welcomeMessage = `Welcome ${member.name} to ${gymName}! Enjoy your workout!`;
    const welcomeAnnouncement = `Welcome ${member.name} to ${gymName}! Enjoy your workout!`;

    global.io.emit('attendance:checkin', { 
      member: member.name, 
      time: attendance.checkInTime,
      gateAccess: true,
      announcement: welcomeAnnouncement
    });
    
    res.json({ 
      message: welcomeMessage,
      announcement: welcomeAnnouncement,
      attendance,
      gateAccess: true,
      action: 'checkin',
      memberName: member.name,
      gymName: gymName
    });
  } catch (error) {
    console.error('QR Scan Error:', error);
    res.status(500).json({ 
      error: 'System error', 
      gateAccess: false,
      message: 'Please try again or contact reception',
      announcement: 'System error. Please try again or contact reception.'
    });
  }
});

router.post('/checkout/:attendanceId', auth, async (req, res) => {
  try {
    const attendance = await prisma.attendance.update({
      where: { id: req.params.attendanceId },
      data: { checkOutTime: new Date() },
      include: { member: true }
    });

    global.io.emit('attendance:checkout', { member: attendance.member.name, time: attendance.checkOutTime });
    
    res.json({ message: 'Check-out successful', attendance });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/member/:memberId', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const where = {
      memberId: req.params.memberId,
      ...(startDate && endDate && {
        date: { gte: new Date(startDate), lte: new Date(endDate) }
      })
    };

    const attendance = await prisma.attendance.findMany({
      where,
      orderBy: { date: 'desc' },
      include: { trainer: true }
    });

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/today', auth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const attendance = await prisma.attendance.findMany({
      where: { date: { gte: today } },
      include: { member: true },
      orderBy: { checkInTime: 'desc' }
    });

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/all', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const where = {};
    
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }
    
    const attendance = await prisma.attendance.findMany({
      where,
      include: { member: true },
      orderBy: { date: 'desc' },
      take: 100
    });

    res.json(attendance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const attendance = await prisma.attendance.findUnique({
      where: { id: req.params.id },
      include: { member: true, trainer: true }
    });
    if (!attendance) return res.status(404).json({ error: 'Attendance not found' });
    res.json(attendance);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    await prisma.attendance.delete({ where: { id: req.params.id } });
    res.json({ message: 'Attendance record deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
