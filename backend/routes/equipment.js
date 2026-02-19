const express = require('express');
const { PrismaClient } = require('@prisma/client');
const { auth, authorize } = require('../middleware/auth');

const router = express.Router();
const prisma = new PrismaClient();

router.post('/', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const { name, type, quantityAvailable, purchaseDate, purchasePrice, condition, location, serialNumber } = req.body;
    
    // Validate required fields
    if (!name || !type) {
      return res.status(400).json({ error: 'Name and type are required' });
    }
    
    const equipment = await prisma.equipment.create({
      data: { 
        name: String(name).trim(), 
        type: String(type).trim(), 
        quantityAvailable: Number(quantityAvailable) || 0,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        purchasePrice: Number(purchasePrice) || 0,
        condition: condition || 'good',
        location: location ? String(location).trim() : null,
        serialNumber: serialNumber ? String(serialNumber).trim() : null
      }
    });
    
    // Create accounting transaction for equipment purchase
    if (purchasePrice && Number(purchasePrice) > 0) {
      let expenseAccount = await prisma.account.findFirst({
        where: { 
          type: 'EXPENSE', 
          accountName: 'Equipment Expense'
        }
      });
      
      if (!expenseAccount) {
        expenseAccount = await prisma.account.create({
          data: {
            accountName: 'Equipment Expense',
            type: 'EXPENSE',
            balance: 0,
            description: 'Equipment purchases and maintenance'
          }
        });
      }
      
      await prisma.transaction.create({
        data: {
          accountId: expenseAccount.id,
          amount: Number(purchasePrice),
          type: 'DEBIT',
          category: 'EQUIPMENT',
          description: `Equipment purchase: ${name} (${type})`,
          referenceId: null
        }
      });
      
      await prisma.account.update({
        where: { id: expenseAccount.id },
        data: { balance: { increment: Number(purchasePrice) } }
      });
    }
    
    res.status(201).json(equipment);
  } catch (error) {
    console.error('Equipment creation error:', error);
    res.status(500).json({ error: error.message });
  }
});

router.get('/', auth, async (req, res) => {
  try {
    const equipment = await prisma.equipment.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(equipment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/low-stock', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const threshold = parseInt(req.query.threshold) || 5;
    const equipment = await prisma.equipment.findMany({
      where: { quantityAvailable: { lt: threshold } }
    });
    res.json(equipment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', auth, async (req, res) => {
  try {
    const equipment = await prisma.equipment.findUnique({
      where: { id: req.params.id }
    });
    if (!equipment) return res.status(404).json({ error: 'Equipment not found' });
    res.json(equipment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const { name, type, quantityAvailable, purchaseDate, purchasePrice, condition, location, serialNumber } = req.body;
    const equipment = await prisma.equipment.update({
      where: { id: req.params.id },
      data: { 
        name, 
        type, 
        quantityAvailable,
        purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
        purchasePrice,
        condition,
        location,
        serialNumber
      }
    });
    res.json(equipment);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const equipment = await prisma.equipment.findUnique({
      where: { id: req.params.id }
    });
    
    if (!equipment) {
      return res.status(404).json({ error: 'Equipment not found' });
    }
    
    // Reverse accounting transaction for equipment purchase
    const purchaseTransactions = await prisma.transaction.findMany({
      where: { 
        category: 'EQUIPMENT',
        description: { contains: `Equipment purchase: ${equipment.name}` }
      }
    });
    
    for (const txn of purchaseTransactions) {
      await prisma.account.update({
        where: { id: txn.accountId },
        data: { balance: { decrement: parseFloat(txn.amount) } }
      });
      
      await prisma.transaction.delete({ where: { id: txn.id } });
    }
    
    // Reverse maintenance transactions
    if (equipment.maintenanceLog && Array.isArray(equipment.maintenanceLog)) {
      for (const log of equipment.maintenanceLog) {
        const maintTransactions = await prisma.transaction.findMany({
          where: { 
            category: 'EQUIPMENT',
            description: { contains: `Equipment maintenance: ${equipment.name}` }
          }
        });
        
        for (const txn of maintTransactions) {
          await prisma.account.update({
            where: { id: txn.accountId },
            data: { balance: { decrement: parseFloat(txn.amount) } }
          });
          
          await prisma.transaction.delete({ where: { id: txn.id } });
        }
      }
    }
    
    await prisma.equipment.delete({ where: { id: req.params.id } });
    res.json({ message: 'Equipment deleted and accounting reversed' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/maintenance', auth, authorize('ADMIN'), async (req, res) => {
  try {
    const { date, description, cost } = req.body;
    const equipment = await prisma.equipment.findUnique({
      where: { id: req.params.id }
    });
    
    if (!equipment) return res.status(404).json({ error: 'Equipment not found' });
    
    const maintenanceLog = equipment.maintenanceLog || [];
    const maintenanceId = `maint_${Date.now()}`;
    maintenanceLog.push({ id: maintenanceId, date, description, cost, addedAt: new Date() });
    
    const updated = await prisma.equipment.update({
      where: { id: req.params.id },
      data: { maintenanceLog }
    });
    
    // Create accounting transaction for maintenance cost
    if (cost && cost > 0) {
      let expenseAccount = await prisma.account.findFirst({
        where: { 
          type: 'EXPENSE', 
          accountName: 'Equipment Expense'
        }
      });
      
      // Create expense account if it doesn't exist
      if (!expenseAccount) {
        expenseAccount = await prisma.account.create({
          data: {
            accountName: 'Equipment Expense',
            type: 'EXPENSE',
            balance: 0,
            description: 'Equipment purchases and maintenance'
          }
        });
      }
      
      if (expenseAccount) {
        await prisma.transaction.create({
          data: {
            accountId: expenseAccount.id,
            amount: parseFloat(cost),
            type: 'DEBIT',
            category: 'EQUIPMENT',
            description: `Equipment maintenance: ${equipment.name} - ${description}`,
            referenceId: maintenanceId
          }
        });
        
        await prisma.account.update({
          where: { id: expenseAccount.id },
          data: { balance: { increment: parseFloat(cost) } }
        });
      }
    }
    
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
