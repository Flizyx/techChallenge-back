/*
  Warnings:

  - Added the required column `sibling_id` to the `siblings` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `siblings` ADD COLUMN `sibling_id` INTEGER NOT NULL;
