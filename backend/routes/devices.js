const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { auth, authorize } = require('../middleware/auth');
const crypto = require('crypto');

const router = express.Router();
const prisma = new PrismaClient();

// ── Device CRUD ──────────────────────────────────────────────────────────────

router.get('/', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const devices = await prisma.device.findMany({ orderBy: { createdAt: 'desc' } });
    res.json(devices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const { name, type, location, ipAddress, macAddress, status, notes } = req.body;
    if (!name || !type || !location) return res.status(400).json({ error: 'name, type and location are required' });
    const device = await prisma.device.create({
      data: { id: crypto.randomUUID(), name, type, location, ipAddress, macAddress, status: status || 'online', notes }
    });
    res.status(201).json(device);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const { name, type, location, ipAddress, macAddress, status, notes } = req.body;
    const device = await prisma.device.update({
      where: { id: req.params.id },
      data: { name, type, location, ipAddress, macAddress, status, notes }
    });
    res.json(device);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', auth, authorize('ADMIN'), async (req, res) => {
  try {
    await prisma.device.delete({ where: { id: req.params.id } });
    res.json({ message: 'Device deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ping / heartbeat — devices call this to mark themselves online
router.post('/:id/ping', async (req, res) => {
  try {
    const device = await prisma.device.update({
      where: { id: req.params.id },
      data: { status: 'online', lastSeen: new Date() }
    });
    res.json({ ok: true, device });
  } catch {
    res.status(404).json({ error: 'Device not found' });
  }
});

// ── Access Log (real attendance records) ─────────────────────────────────────

router.get('/access-log', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const { limit = 50, date } = req.query;
    const where = date ? { date: { gte: new Date(date), lt: new Date(new Date(date).getTime() + 86400000) } } : {};
    const records = await prisma.attendance.findMany({
      where,
      include: { member: true },
      orderBy: { checkInTime: 'desc' },
      take: parseInt(limit)
    });
    res.json(records);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── Stats ─────────────────────────────────────────────────────────────────────

router.get('/stats', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const [total, online, offline, todayScans, totalScans] = await Promise.all([
      prisma.device.count(),
      prisma.device.count({ where: { status: 'online' } }),
      prisma.device.count({ where: { status: 'offline' } }),
      prisma.attendance.count({ where: { date: { gte: today } } }),
      prisma.attendance.count()
    ]);
    res.json({ total, online, offline, todayScans, totalScans });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ── Webhook — RFID / Biometric device card scan ───────────────────────────────

router.post('/webhook/card-scan', async (req, res) => {
  try {
    const { cardId, deviceId, timestamp } = req.body;

    // Mark device as seen
    if (deviceId) {
      await prisma.device.updateMany({
        where: { id: deviceId },
        data: { lastSeen: new Date(), status: 'online' }
      }).catch(() => {});
    }

    const card = await prisma.card.findUnique({
      where: { cardNumber: cardId },
      include: { member: { include: { membership: true } } }
    });

    if (!card) {
      global.io?.emit('gate:denied', { member: 'Unknown', reason: 'Invalid Card' });
      return res.json({ success: false, gateAccess: false, message: 'Invalid Card', relay: 'OFF' });
    }

    const member = card.member;

    if (member.status !== 'active') {
      global.io?.emit('gate:denied', { member: member.name, reason: 'Inactive Membership' });
      return res.json({ success: false, gateAccess: false, message: 'Membership Inactive', relay: 'OFF', displayText: `${member.name}\nMembership Inactive` });
    }

    if (new Date() > new Date(member.expiryDate)) {
      global.io?.emit('gate:denied', { member: member.name, reason: 'Expired' });
      return res.json({ success: false, gateAccess: false, message: 'Membership Expired', relay: 'OFF', displayText: `${member.name}\nExpired` });
    }

    const pendingMembership = member.membership?.find(m => m.paymentStatus === 'PENDING' || m.paymentStatus === 'OVERDUE');
    if (pendingMembership) {
      global.io?.emit('gate:denied', { member: member.name, reason: 'Fees Pending' });
      return res.json({ success: false, gateAccess: false, message: `Fees Pending`, relay: 'OFF', displayText: `${member.name}\nFees Pending` });
    }

    const attendance = await prisma.attendance.create({
      data: { id: crypto.randomUUID(), memberId: member.id, cardId, date: new Date() }
    });

    global.io?.emit('gate:granted', { member: member.name, time: attendance.checkInTime });

    res.json({
      success: true, gateAccess: true, message: `Welcome ${member.name}!`,
      relay: 'ON', relayDuration: 5,
      displayText: `Welcome\n${member.name}`,
      attendanceId: attendance.id,
      memberData: { name: member.name, expiryDate: member.expiryDate, photo: member.photo || null }
    });
  } catch (error) {
    console.error('Device webhook error:', error);
    res.status(500).json({ success: false, gateAccess: false, message: 'System Error', relay: 'OFF' });
  }
});

// ── Manual gate control ───────────────────────────────────────────────────────

router.post('/gate/control', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const { action, duration = 5 } = req.body;
    global.io?.emit('gate:control', { action, duration });
    res.json({ success: true, message: `Gate ${action}ed`, relay: action === 'open' ? 'ON' : 'OFF', duration });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
