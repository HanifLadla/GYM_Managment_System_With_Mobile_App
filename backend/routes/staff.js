const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.post('/', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const { name, role, phone, salary, commission } = req.body;
    const staff = await prisma.staff.create({
      data: { name, role, phone, salary, commission: commission || 0 }
    });
    res.status(201).json(staff);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const staff = await prisma.staff.findMany({
      where: { status: 'active' }
    });
    res.json(staff);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const { name, role, phone, salary, commission } = req.body;
    const staff = await prisma.staff.update({
      where: { id: req.params.id },
      data: { name, role, phone, salary, commission }
    });
    res.json(staff);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', auth, authorize('ADMIN'), async (req, res) => {
  try {
    await prisma.staff.update({
      where: { id: req.params.id },
      data: { status: 'inactive' }
    });
    res.json({ message: 'Staff deactivated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
