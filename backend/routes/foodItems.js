const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const prisma = new PrismaClient();

// Create Food Item
router.post('/', authenticate, async (req, res) => {
  try {
    const { name, category, servingSize, servingUnit, calories, protein, carbs, fats, fiber, sugar, sodium, isCustom } = req.body;

    const foodItem = await prisma.fooditem.create({
      data: {
        id: `F-${Date.now()}`,
        name,
        category,
        servingSize: parseFloat(servingSize),
        servingUnit,
        calories: parseInt(calories),
        protein: parseFloat(protein),
        carbs: parseFloat(carbs),
        fats: parseFloat(fats),
        fiber: fiber ? parseFloat(fiber) : null,
        sugar: sugar ? parseFloat(sugar) : null,
        sodium: sodium ? parseFloat(sodium) : null,
        isCustom: isCustom || false,
        createdBy: req.user.id
      }
    });

    res.json(foodItem);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get All Food Items
router.get('/', authenticate, async (req, res) => {
  try {
    const { category, search } = req.query;

    const where = {};
    if (category) where.category = category;
    if (search) {
      where.name = {
        contains: search
      };
    }

    const foodItems = await prisma.fooditem.findMany({
      where,
      orderBy: { name: 'asc' }
    });

    res.json(foodItems);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Food Item by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const foodItem = await prisma.fooditem.findUnique({
      where: { id: req.params.id }
    });

    if (!foodItem) {
      return res.status(404).json({ error: 'Food item not found' });
    }

    res.json(foodItem);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update Food Item
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { name, category, servingSize, servingUnit, calories, protein, carbs, fats, fiber, sugar, sodium } = req.body;

    const foodItem = await prisma.fooditem.update({
      where: { id: req.params.id },
      data: {
        name,
        category,
        servingSize: servingSize ? parseFloat(servingSize) : undefined,
        servingUnit,
        calories: calories ? parseInt(calories) : undefined,
        protein: protein ? parseFloat(protein) : undefined,
        carbs: carbs ? parseFloat(carbs) : undefined,
        fats: fats ? parseFloat(fats) : undefined,
        fiber: fiber ? parseFloat(fiber) : undefined,
        sugar: sugar ? parseFloat(sugar) : undefined,
        sodium: sodium ? parseFloat(sodium) : undefined
      }
    });

    res.json(foodItem);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete Food Item
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await prisma.fooditem.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Food item deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Food Categories
router.get('/categories/list', authenticate, async (req, res) => {
  try {
    const categories = await prisma.fooditem.findMany({
      select: { category: true },
      distinct: ['category']
    });

    res.json(categories.map(c => c.category));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
