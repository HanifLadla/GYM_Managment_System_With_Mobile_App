const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const prisma = new PrismaClient();

// Create Diet Plan
router.post('/', authenticate, async (req, res) => {
  try {
    const { memberId, trainerId, name, goal, targetCalories, targetProtein, targetCarbs, targetFats, endDate, notes, meals } = req.body;

    const dietPlan = await prisma.dietplan.create({
      data: {
        id: `DP-${Date.now()}`,
        memberId,
        trainerId: trainerId || null,
        name,
        goal,
        targetCalories: parseInt(targetCalories),
        targetProtein: parseFloat(targetProtein),
        targetCarbs: parseFloat(targetCarbs),
        targetFats: parseFloat(targetFats),
        endDate: endDate ? new Date(endDate) : null,
        notes,
        updatedAt: new Date(),
        meal: meals ? {
          create: meals.map(meal => ({
            id: `M-${Date.now()}-${Math.random()}`,
            name: meal.name,
            type: meal.type,
            time: meal.time,
            calories: parseInt(meal.calories),
            protein: parseFloat(meal.protein),
            carbs: parseFloat(meal.carbs),
            fats: parseFloat(meal.fats),
            instructions: meal.instructions,
            dayOfWeek: meal.dayOfWeek,
          }))
        } : undefined
      },
      include: {
        member: { select: { name: true, phone: true } },
        trainer: { select: { name: true } },
        meal: true
      }
    });

    res.json(dietPlan);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get All Diet Plans
router.get('/', authenticate, async (req, res) => {
  try {
    const { memberId, trainerId, status } = req.query;
    
    const where = {};
    if (memberId) where.memberId = memberId;
    if (trainerId) where.trainerId = trainerId;
    if (status) where.status = status;

    const dietPlans = await prisma.dietplan.findMany({
      where,
      include: {
        member: { select: { name: true, phone: true } },
        trainer: { select: { name: true } },
        meal: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(dietPlans);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Diet Plan by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const dietPlan = await prisma.dietplan.findUnique({
      where: { id: req.params.id },
      include: {
        member: { select: { name: true, phone: true, weight: true, bmi: true } },
        trainer: { select: { name: true, specialization: true } },
        meal: {
          include: {
            mealitem: {
              include: {
                fooditem: true
              }
            }
          }
        }
      }
    });

    if (!dietPlan) {
      return res.status(404).json({ error: 'Diet plan not found' });
    }

    res.json(dietPlan);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update Diet Plan
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { name, goal, targetCalories, targetProtein, targetCarbs, targetFats, endDate, notes, status } = req.body;

    const dietPlan = await prisma.dietplan.update({
      where: { id: req.params.id },
      data: {
        name,
        goal,
        targetCalories: targetCalories ? parseInt(targetCalories) : undefined,
        targetProtein: targetProtein ? parseFloat(targetProtein) : undefined,
        targetCarbs: targetCarbs ? parseFloat(targetCarbs) : undefined,
        targetFats: targetFats ? parseFloat(targetFats) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        notes,
        status,
        updatedAt: new Date()
      },
      include: {
        member: { select: { name: true } },
        trainer: { select: { name: true } },
        meal: true
      }
    });

    res.json(dietPlan);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete Diet Plan
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await prisma.dietplan.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Diet plan deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add Meal to Diet Plan
router.post('/:id/meals', authenticate, async (req, res) => {
  try {
    const { name, type, time, calories, protein, carbs, fats, instructions, dayOfWeek, items } = req.body;

    const meal = await prisma.meal.create({
      data: {
        id: `M-${Date.now()}`,
        dietPlanId: req.params.id,
        name,
        type,
        time,
        calories: parseInt(calories),
        protein: parseFloat(protein),
        carbs: parseFloat(carbs),
        fats: parseFloat(fats),
        instructions,
        dayOfWeek,
        mealitem: items ? {
          create: items.map(item => ({
            id: `MI-${Date.now()}-${Math.random()}`,
            foodItemId: item.foodItemId,
            quantity: parseFloat(item.quantity),
            unit: item.unit
          }))
        } : undefined
      },
      include: {
        mealitem: {
          include: {
            fooditem: true
          }
        }
      }
    });

    res.json(meal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Member's Active Diet Plan
router.get('/member/:memberId/active', authenticate, async (req, res) => {
  try {
    const dietPlan = await prisma.dietplan.findFirst({
      where: {
        memberId: req.params.memberId,
        status: 'active'
      },
      include: {
        trainer: { select: { name: true } },
        meal: {
          include: {
            mealitem: {
              include: {
                fooditem: true
              }
            }
          },
          orderBy: { time: 'asc' }
        }
      }
    });

    res.json(dietPlan);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Diet Plan Progress
router.get('/:id/progress', authenticate, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const dietPlan = await prisma.dietplan.findUnique({
      where: { id: req.params.id },
      select: { memberId: true, targetCalories: true, targetProtein: true, targetCarbs: true, targetFats: true }
    });

    if (!dietPlan) {
      return res.status(404).json({ error: 'Diet plan not found' });
    }

    const logs = await prisma.nutritionlog.findMany({
      where: {
        memberId: dietPlan.memberId,
        date: {
          gte: startDate ? new Date(startDate) : undefined,
          lte: endDate ? new Date(endDate) : undefined
        }
      },
      orderBy: { date: 'desc' }
    });

    const progress = logs.map(log => ({
      date: log.date,
      calories: log.totalCalories,
      protein: log.totalProtein,
      carbs: log.totalCarbs,
      fats: log.totalFats,
      caloriesTarget: dietPlan.targetCalories,
      proteinTarget: dietPlan.targetProtein,
      carbsTarget: dietPlan.targetCarbs,
      fatsTarget: dietPlan.targetFats
    }));

    res.json(progress);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
