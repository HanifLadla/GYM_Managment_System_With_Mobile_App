# Diet Plan Module - GMS

## Overview
Comprehensive nutrition and diet management system integrated with member and trainer modules.

## Features

### 1. Diet Plan Management
- Create personalized diet plans for members
- Set nutrition goals (Weight Loss, Weight Gain, Muscle Gain, Maintenance, Athletic)
- Define target macros (Calories, Protein, Carbs, Fats)
- Assign trainers to diet plans
- Track plan status and duration

### 2. Meal Planning
- Create detailed meal plans with 6 meal types:
  - Breakfast
  - Lunch
  - Dinner
  - Snack
  - Pre-Workout
  - Post-Workout
- Schedule meals by day of week
- Add cooking instructions
- Calculate automatic macro totals

### 3. Food Database
- 25+ pre-loaded food items across categories:
  - Proteins (Chicken, Eggs, Salmon, Tuna, Greek Yogurt)
  - Carbs (Rice, Oatmeal, Sweet Potato, Quinoa, Bread)
  - Vegetables (Broccoli, Spinach, Carrots, Bell Pepper)
  - Fruits (Banana, Apple, Blueberries)
  - Fats (Almonds, Avocado, Olive Oil, Peanut Butter)
  - Dairy (Milk, Cheese)
  - Supplements (Whey Protein, Creatine)
- Add custom food items
- Complete nutrition info (Calories, Protein, Carbs, Fats, Fiber, Sugar, Sodium)
- Search and filter by category

### 4. Nutrition Logging
- Daily food intake tracking
- Log meals with multiple food items
- Water intake tracking
- Automatic macro calculation
- Daily and weekly summaries
- Progress tracking against diet plan targets

### 5. Progress Analytics
- Compare actual vs target nutrition
- Daily/weekly/monthly reports
- Visual charts for macro tracking
- Adherence percentage
- Weight correlation with nutrition

## API Endpoints

### Diet Plans
```
POST   /api/diet-plans              - Create diet plan
GET    /api/diet-plans              - Get all diet plans (filter by member/trainer/status)
GET    /api/diet-plans/:id          - Get diet plan details
PUT    /api/diet-plans/:id          - Update diet plan
DELETE /api/diet-plans/:id          - Delete diet plan
POST   /api/diet-plans/:id/meals    - Add meal to diet plan
GET    /api/diet-plans/member/:memberId/active - Get member's active plan
GET    /api/diet-plans/:id/progress - Get diet plan progress
```

### Food Items
```
POST   /api/food-items              - Create food item
GET    /api/food-items              - Get all food items (search/filter)
GET    /api/food-items/:id          - Get food item details
PUT    /api/food-items/:id          - Update food item
DELETE /api/food-items/:id          - Delete food item
GET    /api/food-items/categories/list - Get all categories
```

### Nutrition Logs
```
POST   /api/nutrition-logs          - Log nutrition entry
GET    /api/nutrition-logs          - Get nutrition logs (filter by member/date)
GET    /api/nutrition-logs/daily/:memberId/:date - Get daily summary
GET    /api/nutrition-logs/weekly/:memberId - Get weekly summary
DELETE /api/nutrition-logs/:id      - Delete nutrition log
```

## Database Schema

### dietplan
- id, memberId, trainerId, name, goal
- targetCalories, targetProtein, targetCarbs, targetFats
- startDate, endDate, status, notes

### meal
- id, dietPlanId, name, type, time
- calories, protein, carbs, fats
- instructions, dayOfWeek, isActive

### mealitem
- id, mealId, foodItemId
- quantity, unit

### fooditem
- id, name, category
- servingSize, servingUnit
- calories, protein, carbs, fats
- fiber, sugar, sodium
- isCustom, createdBy

### nutritionlog
- id, memberId, date, mealType
- totalCalories, totalProtein, totalCarbs, totalFats
- waterIntake, notes

### nutritionlogitem
- id, nutritionLogId, foodItemId
- quantity, unit

## Usage Examples

### 1. Create Diet Plan
```javascript
POST /api/diet-plans
{
  "memberId": "M-123",
  "trainerId": "T-456",
  "name": "Weight Loss Plan",
  "goal": "WEIGHT_LOSS",
  "targetCalories": 2000,
  "targetProtein": 150,
  "targetCarbs": 200,
  "targetFats": 60,
  "endDate": "2024-12-31",
  "notes": "Focus on high protein, moderate carbs",
  "meals": [
    {
      "name": "Breakfast",
      "type": "BREAKFAST",
      "time": "08:00",
      "calories": 400,
      "protein": 30,
      "carbs": 40,
      "fats": 15,
      "instructions": "Cook eggs with vegetables"
    }
  ]
}
```

### 2. Log Nutrition
```javascript
POST /api/nutrition-logs
{
  "memberId": "M-123",
  "mealType": "BREAKFAST",
  "items": [
    {
      "foodItemId": "F-1",
      "quantity": 100,
      "unit": "g"
    },
    {
      "foodItemId": "F-2",
      "quantity": 50,
      "unit": "g"
    }
  ],
  "waterIntake": 500,
  "notes": "Felt energized"
}
```

### 3. Get Daily Summary
```javascript
GET /api/nutrition-logs/daily/M-123/2024-01-15

Response:
{
  "date": "2024-01-15",
  "totalCalories": 1950,
  "totalProtein": 145,
  "totalCarbs": 195,
  "totalFats": 58,
  "totalWater": 2500,
  "meals": [...]
}
```

## Integration with Existing Modules

### Member Module
- Diet plans linked to member profiles
- View member's active diet plan
- Track nutrition alongside progress metrics
- Correlate weight changes with nutrition adherence

### Trainer Module
- Trainers can create/manage diet plans
- View all assigned diet plans
- Monitor member nutrition compliance
- Adjust plans based on progress

### Progress Module
- Nutrition data integrated with weight tracking
- Macro adherence charts
- Calorie deficit/surplus tracking
- Body composition correlation

## Best Practices

1. **Goal Setting**
   - Calculate TDEE (Total Daily Energy Expenditure)
   - Set realistic macro targets
   - Adjust based on progress

2. **Meal Planning**
   - Balance macros across meals
   - Include variety of food sources
   - Consider meal timing for workouts

3. **Tracking**
   - Log meals consistently
   - Weigh food for accuracy
   - Track water intake
   - Add notes for patterns

4. **Progress Review**
   - Weekly check-ins
   - Adjust macros every 2-4 weeks
   - Monitor energy levels and performance

## Future Enhancements
- Recipe builder
- Meal prep scheduler
- Barcode scanner for food items
- AI-powered meal suggestions
- Grocery list generator
- Macro-based meal swaps
- Integration with fitness trackers
- Supplement tracking
- Allergy/dietary restriction filters
- Meal photo upload
