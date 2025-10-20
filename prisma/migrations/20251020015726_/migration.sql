/*
  Warnings:

  - A unique constraint covering the columns `[google_id]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[google_email]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `User` ADD COLUMN `google_email` VARCHAR(191) NULL,
    ADD COLUMN `google_id` VARCHAR(191) NULL,
    ADD COLUMN `google_picture` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `User_google_id_key` ON `User`(`google_id`);

-- CreateIndex
CREATE UNIQUE INDEX `User_google_email_key` ON `User`(`google_email`);
