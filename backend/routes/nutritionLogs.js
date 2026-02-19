const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const { authenticate } = require('../middleware/auth');

const prisma = new PrismaClient();

// Log Nutrition Entry
router.post('/', authenticate, async (req, res) => {
  try {
    const { memberId, mealType, items, waterIntake, notes } = req.body;

    let totalCalories = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFats = 0;

    // Calculate totals from items
    for (const item of items) {
      const foodItem = await prisma.fooditem.findUnique({
        where: { id: item.foodItemId }
      });

      if (foodItem) {
        const multiplier = parseFloat(item.quantity) / parseFloat(foodItem.servingSize);
        totalCalories += foodItem.calories * multiplier;
        totalProtein += parseFloat(foodItem.protein) * multiplier;
        totalCarbs += parseFloat(foodItem.carbs) * multiplier;
        totalFats += parseFloat(foodItem.fats) * multiplier;
      }
    }

    const nutritionLog = await prisma.nutritionlog.create({
      data: {
        id: `NL-${Date.now()}`,
        memberId,
        mealType,
        totalCalories: Math.round(totalCalories),
        totalProtein: parseFloat(totalProtein.toFixed(2)),
        totalCarbs: parseFloat(totalCarbs.toFixed(2)),
        totalFats: parseFloat(totalFats.toFixed(2)),
        waterIntake: waterIntake ? parseFloat(waterIntake) : null,
        notes,
        nutritionlogitem: {
          create: items.map(item => ({
            id: `NLI-${Date.now()}-${Math.random()}`,
            foodItemId: item.foodItemId,
            quantity: parseFloat(item.quantity),
            unit: item.unit
          }))
        }
      },
      include: {
        nutritionlogitem: {
          include: {
            fooditem: true
          }
        }
      }
    });

    res.json(nutritionLog);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Nutrition Logs
router.get('/', authenticate, async (req, res) => {
  try {
    const { memberId, startDate, endDate } = req.query;

    const where = {};
    if (memberId) where.memberId = memberId;
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate);
      if (endDate) where.date.lte = new Date(endDate);
    }

    const logs = await prisma.nutritionlog.findMany({
      where,
      include: {
        member: { select: { name: true } },
        nutritionlogitem: {
          include: {
            fooditem: true
          }
        }
      },
      orderBy: { date: 'desc' }
    });

    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Daily Summary
router.get('/daily/:memberId/:date', authenticate, async (req, res) => {
  try {
    const { memberId, date } = req.params;
    const targetDate = new Date(date);
    const nextDay = new Date(targetDate);
    nextDay.setDate(nextDay.getDate() + 1);

    const logs = await prisma.nutritionlog.findMany({
      where: {
        memberId,
        date: {
          gte: targetDate,
          lt: nextDay
        }
      },
      include: {
        nutritionlogitem: {
          include: {
            fooditem: true
          }
        }
      }
    });

    const summary = {
      date: targetDate,
      totalCalories: 0,
      totalProtein: 0,
      totalCarbs: 0,
      totalFats: 0,
      totalWater: 0,
      meals: logs
    };

    logs.forEach(log => {
      summary.totalCalories += log.totalCalories;
      summary.totalProtein += parseFloat(log.totalProtein);
      summary.totalCarbs += parseFloat(log.totalCarbs);
      summary.totalFats += parseFloat(log.totalFats);
      if (log.waterIntake) summary.totalWater += parseFloat(log.waterIntake);
    });

    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Weekly Summary
router.get('/weekly/:memberId', authenticate, async (req, res) => {
  try {
    const { memberId } = req.params;
    const today = new Date();
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const logs = await prisma.nutritionlog.findMany({
      where: {
        memberId,
        date: {
          gte: weekAgo,
          lte: today
        }
      }
    });

    const dailySummary = {};
    logs.forEach(log => {
      const dateKey = log.date.toISOString().split('T')[0];
      if (!dailySummary[dateKey]) {
        dailySummary[dateKey] = {
          date: dateKey,
          calories: 0,
          protein: 0,
          carbs: 0,
          fats: 0
        };
      }
      dailySummary[dateKey].calories += log.totalCalories;
      dailySummary[dateKey].protein += parseFloat(log.totalProtein);
      dailySummary[dateKey].carbs += parseFloat(log.totalCarbs);
      dailySummary[dateKey].fats += parseFloat(log.totalFats);
    });

    res.json(Object.values(dailySummary));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete Nutrition Log
router.delete('/:id', authenticate, async (req, res) => {
  try {
    await prisma.nutritionlog.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Nutrition log deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
