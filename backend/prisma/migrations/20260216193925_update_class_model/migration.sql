/*
  Warnings:

  - You are about to drop the column `enrolledMembers` on the `class` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `class` DROP COLUMN `enrolledMembers`,
    ADD COLUMN `description` TEXT NULL,
    ADD COLUMN `duration` INTEGER NOT NULL DEFAULT 60,
    ADD COLUMN `fee` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    ADD COLUMN `status` VARCHAR(191) NOT NULL DEFAULT 'active',
    MODIFY `schedule` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `Enrollment` (
    `id` VARCHAR(191) NOT NULL,
    `classId` VARCHAR(191) NOT NULL,
    `memberId` VARCHAR(191) NOT NULL,
    `enrolledAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Enrollment_classId_idx`(`classId`),
    INDEX `Enrollment_memberId_idx`(`memberId`),
    UNIQUE INDEX `Enrollment_classId_memberId_key`(`classId`, `memberId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Enrollment` ADD CONSTRAINT `Enrollment_classId_fkey` FOREIGN KEY (`classId`) REFERENCES `Class`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Enrollment` ADD CONSTRAINT `Enrollment_memberId_fkey` FOREIGN KEY (`memberId`) REFERENCES `Member`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
