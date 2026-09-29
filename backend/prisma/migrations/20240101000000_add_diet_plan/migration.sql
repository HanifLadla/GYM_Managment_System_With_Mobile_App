-- CreateTable
CREATE TABLE `dietplan` (
    `id` VARCHAR(191) NOT NULL,
    `memberId` VARCHAR(191) NOT NULL,
    `trainerId` VARCHAR(191) NULL,
    `name` VARCHAR(191) NOT NULL,
    `goal` ENUM('WEIGHT_LOSS', 'WEIGHT_GAIN', 'MUSCLE_GAIN', 'MAINTENANCE', 'ATHLETIC') NOT NULL,
    `startDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `endDate` DATETIME(3) NULL,
    `targetCalories` INTEGER NOT NULL,
    `targetProtein` DECIMAL(10, 2) NOT NULL,
    `targetCarbs` DECIMAL(10, 2) NOT NULL,
    `targetFats` DECIMAL(10, 2) NOT NULL,
    `notes` TEXT NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `DietPlan_memberId_idx`(`memberId`),
    INDEX `DietPlan_trainerId_idx`(`trainerId`),
    INDEX `DietPlan_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `meal` (
    `id` VARCHAR(191) NOT NULL,
    `dietPlanId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `type` ENUM('BREAKFAST', 'LUNCH', 'DINNER', 'SNACK', 'PRE_WORKOUT', 'POST_WORKOUT') NOT NULL,
    `time` VARCHAR(191) NOT NULL,
    `calories` INTEGER NOT NULL,
    `protein` DECIMAL(10, 2) NOT NULL,
    `carbs` DECIMAL(10, 2) NOT NULL,
    `fats` DECIMAL(10, 2) NOT NULL,
    `instructions` TEXT NULL,
    `dayOfWeek` INTEGER NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,

    INDEX `Meal_dietPlanId_idx`(`dietPlanId`),
    INDEX `Meal_type_idx`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mealitem` (
    `id` VARCHAR(191) NOT NULL,
    `mealId` VARCHAR(191) NOT NULL,
    `foodItemId` VARCHAR(191) NOT NULL,
    `quantity` DECIMAL(10, 2) NOT NULL,
    `unit` VARCHAR(191) NOT NULL,

    INDEX `MealItem_mealId_idx`(`mealId`),
    INDEX `MealItem_foodItemId_idx`(`foodItemId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fooditem` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NOT NULL,
    `servingSize` DECIMAL(10, 2) NOT NULL,
    `servingUnit` VARCHAR(191) NOT NULL,
    `calories` INTEGER NOT NULL,
    `protein` DECIMAL(10, 2) NOT NULL,
    `carbs` DECIMAL(10, 2) NOT NULL,
    `fats` DECIMAL(10, 2) NOT NULL,
    `fiber` DECIMAL(10, 2) NULL,
    `sugar` DECIMAL(10, 2) NULL,
    `sodium` DECIMAL(10, 2) NULL,
    `isCustom` BOOLEAN NOT NULL DEFAULT false,
    `createdBy` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `FoodItem_category_idx`(`category`),
    INDEX `FoodItem_name_idx`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `nutritionlog` (
    `id` VARCHAR(191) NOT NULL,
    `memberId` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `mealType` ENUM('BREAKFAST', 'LUNCH', 'DINNER', 'SNACK', 'PRE_WORKOUT', 'POST_WORKOUT') NOT NULL,
    `totalCalories` INTEGER NOT NULL,
    `totalProtein` DECIMAL(10, 2) NOT NULL,
    `totalCarbs` DECIMAL(10, 2) NOT NULL,
    `totalFats` DECIMAL(10, 2) NOT NULL,
    `waterIntake` DECIMAL(10, 2) NULL,
    `notes` TEXT NULL,

    INDEX `NutritionLog_memberId_idx`(`memberId`),
    INDEX `NutritionLog_date_idx`(`date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `nutritionlogitem` (
    `id` VARCHAR(191) NOT NULL,
    `nutritionLogId` VARCHAR(191) NOT NULL,
    `foodItemId` VARCHAR(191) NOT NULL,
    `quantity` DECIMAL(10, 2) NOT NULL,
    `unit` VARCHAR(191) NOT NULL,

    INDEX `NutritionLogItem_nutritionLogId_idx`(`nutritionLogId`),
    INDEX `NutritionLogItem_foodItemId_idx`(`foodItemId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `dietplan` ADD CONSTRAINT `dietplan_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `member`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `dietplan` ADD CONSTRAINT `dietplan_trainerId_fkey` FOREIGN KEY (`trainerId`) REFERENCES `trainer`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `meal` ADD CONSTRAINT `meal_dietPlanId_fkey` FOREIGN KEY (`dietPlanId`) REFERENCES `dietplan`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mealitem` ADD CONSTRAINT `mealitem_mealId_fkey` FOREIGN KEY (`mealId`) REFERENCES `meal`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `mealitem` ADD CONSTRAINT `mealitem_foodItemId_fkey` FOREIGN KEY (`foodItemId`) REFERENCES `fooditem`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `nutritionlog` ADD CONSTRAINT `nutritionlog_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `member`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `nutritionlogitem` ADD CONSTRAINT `nutritionlogitem_nutritionLogId_fkey` FOREIGN KEY (`nutritionLogId`) REFERENCES `nutritionlog`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `nutritionlogitem` ADD CONSTRAINT `nutritionlogitem_foodItemId_fkey` FOREIGN KEY (`foodItemId`) REFERENCES `fooditem`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
