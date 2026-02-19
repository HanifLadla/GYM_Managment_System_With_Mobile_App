const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { auth, authorize } = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const router = express.Router();
const prisma = new PrismaClient();

router.post('/', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const { email, password, name, specialization, phone, salary, availability } = req.body;
    
    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      return res.status(400).json({ error: 'Email already exists' });
    }
    
    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = crypto.randomUUID();
    const trainerId = crypto.randomUUID();
    
    const user = await prisma.user.create({
      data: { 
        id: userId,
        email, 
        password: hashedPassword, 
        role: 'TRAINER' 
      }
    });

    const trainer = await prisma.trainer.create({
      data: { 
        id: trainerId,
        userId: user.id, 
        name, 
        specialization, 
        phone, 
        salary: salary ? parseFloat(salary) : 50000,
        availability 
      }
    });

    res.status(201).json(trainer);
  } catch (error) {
    console.error('Trainer creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const trainers = await prisma.trainer.findMany({
      include: { user: { select: { email: true } }, Renamedclass: true }
    });
    res.json(trainers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const trainer = await prisma.trainer.findUnique({
      where: { id: req.params.id },
      include: { user: true, Renamedclass: true }
    });
    if (!trainer) return res.status(404).json({ error: 'Trainer not found' });
    res.json(trainer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const { name, specialization, phone, salary, availability } = req.body;
    const trainer = await prisma.trainer.update({
      where: { id: req.params.id },
      data: { 
        name, 
        specialization, 
        phone, 
        ...(salary && { salary: parseFloat(salary) }),
        availability 
      }
    });
    res.json(trainer);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', auth, authorize('ADMIN'), async (req, res) => {
  try {
    await prisma.trainer.delete({ where: { id: req.params.id } });
    res.json({ message: 'Trainer deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
