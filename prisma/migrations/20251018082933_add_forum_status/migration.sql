-- AlterTable
ALTER TABLE `Forum` ADD COLUMN `status` ENUM('ACTIVE', 'REMOVED') NOT NULL DEFAULT 'ACTIVE';

-- CreateIndex
CREATE INDEX `Forum_status_idx` ON `Forum`(`status`);
