/*
  Warnings:

  - A unique constraint covering the columns `[cnic]` on the table `Member` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `member` ADD COLUMN `bmi` DECIMAL(65, 30) NULL,
    ADD COLUMN `bodyFat` DECIMAL(65, 30) NULL,
    ADD COLUMN `cnic` VARCHAR(191) NULL,
    ADD COLUMN `medicalHistory` JSON NULL,
    ADD COLUMN `photo` VARCHAR(191) NULL,
    ADD COLUMN `trainerId` VARCHAR(191) NULL,
    ADD COLUMN `weight` DECIMAL(65, 30) NULL;

-- AlterTable
ALTER TABLE `membership` ADD COLUMN `discount` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    ADD COLUMN `duration` INTEGER NOT NULL DEFAULT 1,
    ADD COLUMN `frozenUntil` DATETIME(3) NULL,
    ADD COLUMN `isFrozen` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `planId` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `payment` ADD COLUMN `notes` VARCHAR(191) NULL,
    MODIFY `method` ENUM('CASH', 'CARD', 'BANK_TRANSFER', 'ONLINE', 'UPI') NOT NULL;

-- CreateTable
CREATE TABLE `Plan` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `price` DECIMAL(65, 30) NOT NULL,
    `duration` INTEGER NOT NULL,
    `features` JSON NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Plan_name_key`(`name`),
    INDEX `Plan_name_idx`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Progress` (
    `id` VARCHAR(191) NOT NULL,
    `memberId` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `weight` DECIMAL(65, 30) NOT NULL,
    `bmi` DECIMAL(65, 30) NULL,
    `bodyFat` DECIMAL(65, 30) NULL,
    `notes` VARCHAR(191) NULL,

    INDEX `Progress_memberId_idx`(`memberId`),
    INDEX `Progress_date_idx`(`date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Staff` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `phone` VARCHAR(191) NOT NULL,
    `cnic` VARCHAR(191) NULL,
    `photo` VARCHAR(191) NULL,
    `address` VARCHAR(191) NULL,
    `dob` DATETIME(3) NULL,
    `gender` VARCHAR(191) NULL,
    `department` VARCHAR(191) NOT NULL,
    `designation` VARCHAR(191) NOT NULL,
    `joinDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `salary` DECIMAL(65, 30) NOT NULL,
    `commission` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    `bankAccount` VARCHAR(191) NULL,
    `emergencyContact` JSON NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Staff_email_key`(`email`),
    UNIQUE INDEX `Staff_cnic_key`(`cnic`),
    INDEX `Staff_email_idx`(`email`),
    INDEX `Staff_cnic_idx`(`cnic`),
    INDEX `Staff_department_idx`(`department`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StaffAttendance` (
    `id` VARCHAR(191) NOT NULL,
    `staffId` VARCHAR(191) NOT NULL,
    `date` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `checkIn` DATETIME(3) NULL,
    `checkOut` DATETIME(3) NULL,
    `status` ENUM('PRESENT', 'ABSENT', 'HALF_DAY', 'LATE') NOT NULL DEFAULT 'PRESENT',
    `notes` VARCHAR(191) NULL,

    INDEX `StaffAttendance_staffId_idx`(`staffId`),
    INDEX `StaffAttendance_date_idx`(`date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Leave` (
    `id` VARCHAR(191) NOT NULL,
    `staffId` VARCHAR(191) NOT NULL,
    `type` ENUM('SICK', 'CASUAL', 'ANNUAL', 'UNPAID') NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `reason` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'PENDING',
    `approvedBy` VARCHAR(191) NULL,
    `approvedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Leave_staffId_idx`(`staffId`),
    INDEX `Leave_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Payroll` (
    `id` VARCHAR(191) NOT NULL,
    `staffId` VARCHAR(191) NOT NULL,
    `month` INTEGER NOT NULL,
    `year` INTEGER NOT NULL,
    `basicSalary` DECIMAL(65, 30) NOT NULL,
    `allowances` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    `deductions` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    `commission` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    `netSalary` DECIMAL(65, 30) NOT NULL,
    `paidDate` DATETIME(3) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT 'pending',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Payroll_staffId_idx`(`staffId`),
    INDEX `Payroll_month_year_idx`(`month`, `year`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE UNIQUE INDEX `Member_cnic_key` ON `Member`(`cnic`);

-- CreateIndex
CREATE INDEX `Member_cnic_idx` ON `Member`(`cnic`);

-- CreateIndex
CREATE INDEX `Membership_planId_idx` ON `Membership`(`planId`);

-- AddForeignKey
ALTER TABLE `Membership` ADD CONSTRAINT `Membership_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `Plan`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Progress` ADD CONSTRAINT `Progress_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `Member`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StaffAttendance` ADD CONSTRAINT `StaffAttendance_staffId_fkey` FOREIGN KEY (`staffId`) REFERENCES `Staff`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Leave` ADD CONSTRAINT `Leave_staffId_fkey` FOREIGN KEY (`staffId`) REFERENCES `Staff`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payroll` ADD CONSTRAINT `Payroll_staffId_fkey` FOREIGN KEY (`staffId`) REFERENCES `Staff`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
