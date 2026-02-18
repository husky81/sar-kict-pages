-- Migration: Add instanceQuota and instanceType to User table
-- Run this as the table owner (sarkict_dev) or a superuser (bckim/postgres)

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "instanceQuota" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "instanceType" TEXT NOT NULL DEFAULT 't3.small';
