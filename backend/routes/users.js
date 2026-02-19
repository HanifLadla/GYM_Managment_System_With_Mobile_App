const express = require('express');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const Joi = require('joi');
const { auth, authorize } = require('../middleware/auth');
const crypto = require('crypto');

const router = express.Router();
const prisma = new PrismaClient();

const userSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  role: Joi.string().valid('ADMIN', 'TRAINER', 'MEMBER').required(),
  name: Joi.string().required(),
  phone: Joi.string().required()
});

const updateUserSchema = Joi.object({
  email: Joi.string().email().optional(),
  password: Joi.string().min(6).optional().allow(''),
  role: Joi.string().valid('ADMIN', 'TRAINER', 'MEMBER').optional(),
  name: Joi.string().optional(),
  phone: Joi.string().optional()
});

// Get all users
router.get('/', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '', role = 'all' } = req.query;
    const skip = (page - 1) * limit;

    let where = {};
    
    if (search) {
      where.email = { contains: search, mode: 'insensitive' };
    }
    
    if (role !== 'all') {
      where.role = role;
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip: parseInt(skip),
        take: parseInt(limit),
        select: {
          id: true,
          email: true,
          role: true,
          createdAt: true,
          member: {
            select: {
              name: true,
              phone: true,
              status: true
            }
          },
          trainer: {
            select: {
              name: true,
              phone: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      prisma.user.count({ where })
    ]);

    // Transform data to include name, phone, and status
    const transformedUsers = users.map(user => ({
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      name: user.member?.name || user.trainer?.name || 'N/A',
      phone: user.member?.phone || user.trainer?.phone || 'N/A',
      status: user.member?.status || 'active'
    }));

    res.json({ 
      users: transformedUsers, 
      total, 
      page: parseInt(page), 
      pages: Math.ceil(total / limit) 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get user by ID
router.get('/:id', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true
      }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create new user
router.post('/', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const { error } = userSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { email, password, role, name, phone } = req.body;
    
    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const userId = crypto.randomUUID();
    
    // Create user
    const user = await prisma.user.create({
      data: {
        id: userId,
        email,
        password: hashedPassword,
        role
      }
    });

    // Create member or trainer record based on role
    if (role === 'MEMBER') {
      await prisma.member.create({
        data: {
          id: crypto.randomUUID(),
          userId: userId,
          name,
          phone,
          monthlyFee: 0,
          expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
        }
      });
    } else if (role === 'TRAINER') {
      await prisma.trainer.create({
        data: {
          id: crypto.randomUUID(),
          userId: userId,
          name,
          phone,
          salary: 0
        }
      });
    }
    
    res.status(201).json({
      id: user.id,
      email: user.email,
      role: user.role,
      name,
      phone,
      createdAt: user.createdAt
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user
router.put('/:id', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const { error } = updateUserSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }

    const { email, password, role, name, phone } = req.body;
    
    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: { member: true, trainer: true }
    });
    
    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if email is being changed and if it's already taken
    if (email && email !== existingUser.email) {
      const emailTaken = await prisma.user.findUnique({
        where: { email }
      });
      
      if (emailTaken) {
        return res.status(400).json({ error: 'Email already taken' });
      }
    }

    // Update user
    const updateData = {};
    if (email) updateData.email = email;
    if (password && password.trim() !== '') updateData.password = await bcrypt.hash(password, 10);
    if (role) updateData.role = role;
    
    const user = await prisma.user.update({
      where: { id: req.params.id },
      data: updateData
    });

    // Update member or trainer info
    if (existingUser.member && (name || phone)) {
      const memberUpdateData = {};
      if (name) memberUpdateData.name = name;
      if (phone) memberUpdateData.phone = phone;
      
      await prisma.member.update({
        where: { userId: req.params.id },
        data: memberUpdateData
      });
    }

    if (existingUser.trainer && (name || phone)) {
      const trainerUpdateData = {};
      if (name) trainerUpdateData.name = name;
      if (phone) trainerUpdateData.phone = phone;
      
      await prisma.trainer.update({
        where: { userId: req.params.id },
        data: trainerUpdateData
      });
    }
    
    res.json({
      id: user.id,
      email: user.email,
      role: user.role,
      name: name || existingUser.member?.name || existingUser.trainer?.name,
      phone: phone || existingUser.member?.phone || existingUser.trainer?.phone,
      createdAt: user.createdAt
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update user status
router.put('/:id/status', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const { isActive } = req.body;
    
    if (typeof isActive !== 'boolean') {
      return res.status(400).json({ error: 'isActive must be a boolean' });
    }

    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      include: { member: true, trainer: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update status based on user role
    if (user.member) {
      await prisma.member.update({
        where: { userId: req.params.id },
        data: { status: isActive ? 'active' : 'inactive' }
      });
    }

    res.json({ message: `User ${isActive ? 'activated' : 'deactivated'} successfully` });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete user
router.delete('/:id', auth, authorize('ADMIN'), async (req, res) => {
  try {
    // Prevent admin from deleting themselves
    if (req.params.id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    await prisma.user.delete({
      where: { id: req.params.id }
    });
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    if (error.code === 'P2025') {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(500).json({ error: error.message });
  }
});

// Get user statistics
router.get('/stats/overview', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const [totalUsers, adminUsers, trainerUsers, memberUsers] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { role: 'ADMIN' } }),
      prisma.user.count({ where: { role: 'TRAINER' } }),
      prisma.user.count({ where: { role: 'MEMBER' } })
    ]);

    const recentUsers = await prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true
      }
    });

    res.json({
      totalUsers,
      roleDistribution: {
        admin: adminUsers,
        trainer: trainerUsers,
        member: memberUsers
      },
      recentUsers
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Bulk operations (removed - not supported without isActive field)
// router.post('/bulk/activate', ...)
// router.post('/bulk/deactivate', ...)

module.exports = router;