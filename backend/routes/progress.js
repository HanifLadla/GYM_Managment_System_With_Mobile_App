const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

// Get all progress records with pagination and filters
router.get('/', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', memberId = 'all' } = req.query;
    const skip = (page - 1) * limit;

    let where = {};
    
    if (search) {
      where.OR = [
        { member: { name: { contains: search, mode: 'insensitive' } } },
        { notes: { contains: search, mode: 'insensitive' } }
      ];
    }
    
    if (memberId !== 'all') {
      where.memberId = memberId;
    }

    const [progress, total] = await Promise.all([
      prisma.progress.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        include: {
          member: { select: { name: true, phone: true } }
        },
        orderBy: { date: 'desc' }
      }),
      prisma.progress.count({ where })
    ]);

    res.json({ progress, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', authenticate, async (req, res) => {
  try {
    const { memberId, weight, bmi, bodyFat, notes } = req.body;
    
    const progress = await prisma.progress.create({
      data: { 
        id: `P-${Date.now()}`,
        memberId, 
        weight: parseFloat(weight), 
        bmi: bmi ? parseFloat(bmi) : null, 
        bodyFat: bodyFat ? parseFloat(bodyFat) : null, 
        notes 
      },
      include: {
        member: { select: { name: true } }
      }
    });

    await prisma.member.update({
      where: { id: memberId },
      data: { 
        weight: parseFloat(weight), 
        bmi: bmi ? parseFloat(bmi) : undefined, 
        bodyFat: bodyFat ? parseFloat(bodyFat) : undefined 
      }
    });

    res.status(201).json(progress);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update progress record
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { weight, bmi, bodyFat, notes } = req.body;
    
    const progress = await prisma.progress.update({
      where: { id: req.params.id },
      data: { 
        weight: parseFloat(weight), 
        bmi: bmi ? parseFloat(bmi) : null, 
        bodyFat: bodyFat ? parseFloat(bodyFat) : null, 
        notes 
      },
      include: {
        member: { select: { name: true } }
      }
    });

    res.json(progress);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete progress record
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await prisma.progress.delete({
      where: { id: req.params.id }
    });
    res.json({ message: 'Progress record deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get progress by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const progress = await prisma.progress.findUnique({
      where: { id: req.params.id },
      include: {
        member: { 
          select: { 
            name: true, 
            phone: true, 
            email: true,
            user: { select: { email: true } }
          } 
        }
      }
    });
    
    if (!progress) {
      return res.status(404).json({ error: 'Progress record not found' });
    }
    
    res.json(progress);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/member/:memberId', authenticate, async (req, res) => {
  try {
    const progress = await prisma.progress.findMany({
      where: { memberId: req.params.memberId },
      orderBy: { date: 'desc' }
    });
    res.json(progress);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
