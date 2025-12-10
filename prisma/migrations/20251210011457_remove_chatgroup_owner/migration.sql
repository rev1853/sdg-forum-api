/*
  Warnings:

  - You are about to drop the column `owner_id` on the `ChatGroup` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `ChatGroup` DROP FOREIGN KEY `ChatGroup_owner_id_fkey`;

-- AlterTable
ALTER TABLE `ChatGroup` DROP COLUMN `owner_id`;
