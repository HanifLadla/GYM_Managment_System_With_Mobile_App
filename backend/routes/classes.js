const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { auth, authorize } = require('../middleware/auth');
const crypto = require('crypto');

const router = express.Router();
const prisma = new PrismaClient();

router.post('/', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const { name, trainerId, schedule, maxCapacity, duration, description, status, fee } = req.body;
    const classItem = await prisma.renamedclass.create({
      data: { 
        id: crypto.randomUUID(),
        name, 
        trainerId, 
        schedule, 
        maxCapacity,
        duration: duration || 60,
        description: description || null,
        status: status || 'active',
        fee: fee || 0
      }
    });
    res.status(201).json(classItem);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const classes = await prisma.renamedclass.findMany({
      include: { 
        trainer: true,
        enrollment: {
          include: {
            member: { select: { id: true, name: true } }
          }
        }
      }
    });
    res.json(classes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const classItem = await prisma.renamedclass.findUnique({
      where: { id: req.params.id },
      include: { 
        trainer: true,
        enrollment: {
          include: {
            member: { select: { id: true, name: true, phone: true } }
          }
        }
      }
    });
    if (!classItem) return res.status(404).json({ error: 'Class not found' });
    res.json(classItem);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const { name, trainerId, schedule, maxCapacity, duration, description, status, fee } = req.body;
    const classItem = await prisma.renamedclass.update({
      where: { id: req.params.id },
      data: { name, trainerId, schedule, maxCapacity, duration, description, status, fee }
    });
    res.json(classItem);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', auth, authorize('ADMIN'), async (req, res) => {
  try {
    await prisma.renamedclass.delete({ where: { id: req.params.id } });
    res.json({ message: 'Class deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/enroll', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const { memberId } = req.body;
    const classItem = await prisma.renamedclass.findUnique({
      where: { id: req.params.id },
      include: { enrollment: true }
    });
    
    if (!classItem) return res.status(404).json({ error: 'Class not found' });
    if (classItem.enrollment.length >= classItem.maxCapacity) {
      return res.status(400).json({ error: 'Class is full' });
    }
    
    const existing = await prisma.enrollment.findFirst({
      where: { classId: req.params.id, memberId }
    });
    if (existing) return res.status(400).json({ error: 'Member already enrolled' });
    
    const enrollment = await prisma.enrollment.create({
      data: { 
        id: crypto.randomUUID(),
        classId: req.params.id, 
        memberId 
      }
    });
    res.status(201).json(enrollment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/unenroll', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const { memberId } = req.body;
    await prisma.enrollment.deleteMany({
      where: { classId: req.params.id, memberId }
    });
    res.json({ message: 'Member unenrolled' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
