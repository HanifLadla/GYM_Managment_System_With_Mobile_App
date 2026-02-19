const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { auth, authorize } = require('../middleware/auth');
const crypto = require('crypto');

const router = express.Router();
const prisma = new PrismaClient();

router.get('/', auth, async (req, res) => {
  try {
    const plans = await prisma.plan.findMany({
      where: { isActive: true },
      include: { _count: { select: { membership: true } } },
      orderBy: { price: 'asc' }
    });
    res.json(plans);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const { name, description, price, duration, features } = req.body;
    const plan = await prisma.plan.create({
      data: { 
        id: crypto.randomUUID(),
        name, 
        description, 
        price, 
        duration, 
        features: Array.isArray(features) ? JSON.stringify(features) : features
      }
    });
    res.status(201).json(plan);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const { name, description, price, duration, features, isActive } = req.body;
    const plan = await prisma.plan.update({
      where: { id: req.params.id },
      data: { 
        name, 
        description, 
        price, 
        duration, 
        features: Array.isArray(features) ? JSON.stringify(features) : features,
        isActive 
      }
    });
    res.json(plan);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', auth, authorize('ADMIN'), async (req, res) => {
  try {
    await prisma.plan.update({
      where: { id: req.params.id },
      data: { isActive: false }
    });
    res.json({ message: 'Plan deactivated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;