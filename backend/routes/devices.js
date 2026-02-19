const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

// Webhook for RFID/Biometric devices (ZKTeco, etc.)
router.post('/webhook/card-scan', async (req, res) => {
  try {
    const { cardId, deviceId, timestamp } = req.body;
    
    console.log('Device scan received:', { cardId, deviceId, timestamp });

    // Find card and member
    const card = await prisma.card.findUnique({
      where: { cardNumber: cardId },
      include: { member: { include: { memberships: true } } }
    });

    if (!card) {
      return res.json({ 
        success: false,
        gateAccess: false,
        message: 'Invalid Card',
        relay: 'OFF'
      });
    }

    const member = card.member;

    // Check 1: Membership Active
    if (member.status !== 'active') {
      global.io?.emit('gate:denied', { 
        member: member.name, 
        reason: 'Inactive Membership' 
      });
      
      return res.json({
        success: false,
        gateAccess: false,
        message: 'Membership Inactive - Contact Reception',
        relay: 'OFF',
        displayText: `${member.name}\nMembership Inactive`
      });
    }

    // Check 2: Expiry Date
    if (new Date() > new Date(member.expiryDate)) {
      global.io?.emit('gate:denied', { 
        member: member.name, 
        reason: 'Expired' 
      });
      
      return res.json({
        success: false,
        gateAccess: false,
        message: 'Membership Expired - Please Renew',
        relay: 'OFF',
        displayText: `${member.name}\nExpired: ${new Date(member.expiryDate).toLocaleDateString()}`
      });
    }

    // Check 3: Fees Status
    const pendingMembership = member.memberships.find(
      m => m.paymentStatus === 'PENDING' || m.paymentStatus === 'OVERDUE'
    );

    if (pendingMembership) {
      global.io?.emit('gate:denied', { 
        member: member.name, 
        reason: 'Fees Pending' 
      });
      
      return res.json({
        success: false,
        gateAccess: false,
        message: `Fees Pending: $${pendingMembership.feeAmount}`,
        relay: 'OFF',
        displayText: `${member.name}\nFees Pending: $${pendingMembership.feeAmount}`
      });
    }

    // All checks passed - Grant Access
    const attendance = await prisma.attendance.create({
      data: {
        memberId: member.id,
        cardId: cardId,
        date: new Date()
      }
    });

    global.io?.emit('gate:granted', { 
      member: member.name, 
      time: attendance.checkInTime 
    });

    // Return success with relay ON command
    res.json({
      success: true,
      gateAccess: true,
      message: `Welcome ${member.name}!`,
      relay: 'ON',
      relayDuration: 5, // seconds
      displayText: `Welcome\n${member.name}`,
      attendanceId: attendance.id,
      memberData: {
        name: member.name,
        expiryDate: member.expiryDate,
        photo: member.photo || null
      }
    });

  } catch (error) {
    console.error('Device webhook error:', error);
    res.status(500).json({ 
      success: false,
      gateAccess: false,
      message: 'System Error',
      relay: 'OFF'
    });
  }
});

// Manual gate control (for testing or manual override)
router.post('/gate/control', async (req, res) => {
  try {
    const { action, duration = 5 } = req.body; // action: 'open' or 'close'
    
    global.io?.emit('gate:control', { action, duration });
    
    res.json({ 
      success: true, 
      message: `Gate ${action}ed`,
      relay: action === 'open' ? 'ON' : 'OFF',
      duration 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get device status
router.get('/devices/status', async (req, res) => {
  try {
    // You can store device info in database
    res.json({
      devices: [
        { id: 'RFID-001', type: 'RFID Reader', status: 'online', location: 'Main Gate' },
        { id: 'DOOR-001', type: 'Door Controller', status: 'online', location: 'Main Gate' }
      ]
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
