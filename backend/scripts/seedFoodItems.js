const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const foodItems = [
  // Proteins
  { name: 'Chicken Breast', category: 'Protein', servingSize: 100, servingUnit: 'g', calories: 165, protein: 31, carbs: 0, fats: 3.6, fiber: 0, sugar: 0, sodium: 74 },
  { name: 'Eggs', category: 'Protein', servingSize: 50, servingUnit: 'g', calories: 78, protein: 6.3, carbs: 0.6, fats: 5.3, fiber: 0, sugar: 0.6, sodium: 62 },
  { name: 'Salmon', category: 'Protein', servingSize: 100, servingUnit: 'g', calories: 208, protein: 20, carbs: 0, fats: 13, fiber: 0, sugar: 0, sodium: 59 },
  { name: 'Tuna', category: 'Protein', servingSize: 100, servingUnit: 'g', calories: 132, protein: 28, carbs: 0, fats: 1.3, fiber: 0, sugar: 0, sodium: 47 },
  { name: 'Greek Yogurt', category: 'Protein', servingSize: 170, servingUnit: 'g', calories: 100, protein: 17, carbs: 6, fats: 0.7, fiber: 0, sugar: 6, sodium: 60 },
  
  // Carbs
  { name: 'Brown Rice', category: 'Carbs', servingSize: 100, servingUnit: 'g', calories: 111, protein: 2.6, carbs: 23, fats: 0.9, fiber: 1.8, sugar: 0.4, sodium: 5 },
  { name: 'Oatmeal', category: 'Carbs', servingSize: 40, servingUnit: 'g', calories: 150, protein: 5, carbs: 27, fats: 3, fiber: 4, sugar: 1, sodium: 0 },
  { name: 'Sweet Potato', category: 'Carbs', servingSize: 100, servingUnit: 'g', calories: 86, protein: 1.6, carbs: 20, fats: 0.1, fiber: 3, sugar: 4.2, sodium: 55 },
  { name: 'Quinoa', category: 'Carbs', servingSize: 100, servingUnit: 'g', calories: 120, protein: 4.4, carbs: 21, fats: 1.9, fiber: 2.8, sugar: 0.9, sodium: 7 },
  { name: 'Whole Wheat Bread', category: 'Carbs', servingSize: 30, servingUnit: 'g', calories: 80, protein: 4, carbs: 14, fats: 1, fiber: 2, sugar: 2, sodium: 150 },
  
  // Vegetables
  { name: 'Broccoli', category: 'Vegetables', servingSize: 100, servingUnit: 'g', calories: 34, protein: 2.8, carbs: 7, fats: 0.4, fiber: 2.6, sugar: 1.7, sodium: 33 },
  { name: 'Spinach', category: 'Vegetables', servingSize: 100, servingUnit: 'g', calories: 23, protein: 2.9, carbs: 3.6, fats: 0.4, fiber: 2.2, sugar: 0.4, sodium: 79 },
  { name: 'Carrots', category: 'Vegetables', servingSize: 100, servingUnit: 'g', calories: 41, protein: 0.9, carbs: 10, fats: 0.2, fiber: 2.8, sugar: 4.7, sodium: 69 },
  { name: 'Bell Pepper', category: 'Vegetables', servingSize: 100, servingUnit: 'g', calories: 31, protein: 1, carbs: 6, fats: 0.3, fiber: 2.1, sugar: 4.2, sodium: 4 },
  
  // Fruits
  { name: 'Banana', category: 'Fruits', servingSize: 100, servingUnit: 'g', calories: 89, protein: 1.1, carbs: 23, fats: 0.3, fiber: 2.6, sugar: 12, sodium: 1 },
  { name: 'Apple', category: 'Fruits', servingSize: 100, servingUnit: 'g', calories: 52, protein: 0.3, carbs: 14, fats: 0.2, fiber: 2.4, sugar: 10, sodium: 1 },
  { name: 'Blueberries', category: 'Fruits', servingSize: 100, servingUnit: 'g', calories: 57, protein: 0.7, carbs: 14, fats: 0.3, fiber: 2.4, sugar: 10, sodium: 1 },
  
  // Fats
  { name: 'Almonds', category: 'Fats', servingSize: 28, servingUnit: 'g', calories: 164, protein: 6, carbs: 6, fats: 14, fiber: 3.5, sugar: 1.2, sodium: 0 },
  { name: 'Avocado', category: 'Fats', servingSize: 100, servingUnit: 'g', calories: 160, protein: 2, carbs: 9, fats: 15, fiber: 7, sugar: 0.7, sodium: 7 },
  { name: 'Olive Oil', category: 'Fats', servingSize: 14, servingUnit: 'ml', calories: 119, protein: 0, carbs: 0, fats: 14, fiber: 0, sugar: 0, sodium: 0 },
  { name: 'Peanut Butter', category: 'Fats', servingSize: 32, servingUnit: 'g', calories: 188, protein: 8, carbs: 7, fats: 16, fiber: 2, sugar: 3, sodium: 152 },
  
  // Dairy
  { name: 'Milk', category: 'Dairy', servingSize: 240, servingUnit: 'ml', calories: 122, protein: 8, carbs: 12, fats: 5, fiber: 0, sugar: 12, sodium: 107 },
  { name: 'Cheese', category: 'Dairy', servingSize: 28, servingUnit: 'g', calories: 113, protein: 7, carbs: 1, fats: 9, fiber: 0, sugar: 0.5, sodium: 180 },
  
  // Supplements
  { name: 'Whey Protein', category: 'Supplements', servingSize: 30, servingUnit: 'g', calories: 120, protein: 24, carbs: 3, fats: 1.5, fiber: 0, sugar: 2, sodium: 50 },
  { name: 'Creatine', category: 'Supplements', servingSize: 5, servingUnit: 'g', calories: 0, protein: 0, carbs: 0, fats: 0, fiber: 0, sugar: 0, sodium: 0 }
];

async function seedFoodItems() {
  console.log('Seeding food items...');
  
  for (const item of foodItems) {
    await prisma.fooditem.create({
      data: {
        id: `F-${Date.now()}-${Math.random()}`,
        ...item,
        isCustom: false
      }
    });
  }
  
  console.log(`Seeded ${foodItems.length} food items`);
}

seedFoodItems()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
