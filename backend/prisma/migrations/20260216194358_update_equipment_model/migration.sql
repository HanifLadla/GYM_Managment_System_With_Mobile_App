-- AlterTable
ALTER TABLE `equipment` ADD COLUMN `condition` VARCHAR(191) NOT NULL DEFAULT 'good',
    ADD COLUMN `location` VARCHAR(191) NULL,
    ADD COLUMN `purchaseDate` DATETIME(3) NULL,
    ADD COLUMN `purchasePrice` DECIMAL(65, 30) NOT NULL DEFAULT 0,
    ADD COLUMN `serialNumber` VARCHAR(191) NULL;
