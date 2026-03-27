-- Add userId to RunningLog for cost tracking after instance deletion
ALTER TABLE "RunningLog" ADD COLUMN "userId" TEXT;

-- Populate userId from existing instance records
UPDATE "RunningLog" rl
SET "userId" = i."userId"
FROM "Instance" i
WHERE rl."instanceId" = i.id;

-- Make userId NOT NULL after populating
ALTER TABLE "RunningLog" ALTER COLUMN "userId" SET NOT NULL;

-- Add foreign key constraint
ALTER TABLE "RunningLog" 
ADD CONSTRAINT "RunningLog_userId_fkey" 
FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE ON UPDATE CASCADE;

-- Create index on userId
CREATE INDEX "RunningLog_userId_idx" ON "RunningLog"("userId");

-- Create InstanceLifecycle table for tracking instance creation/deletion
CREATE TABLE "InstanceLifecycle" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "instanceType" TEXT NOT NULL,
    "awsInstanceId" TEXT,
    "volumeSize" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    "deletionReason" TEXT,
    CONSTRAINT "InstanceLifecycle_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE ON UPDATE CASCADE
);

-- Create indexes on InstanceLifecycle
CREATE INDEX "InstanceLifecycle_userId_idx" ON "InstanceLifecycle"("userId");
CREATE INDEX "InstanceLifecycle_createdAt_idx" ON "InstanceLifecycle"("createdAt");

-- Populate InstanceLifecycle with existing instances
INSERT INTO "InstanceLifecycle" ("id", "userId", "instanceType", "awsInstanceId", "volumeSize", "createdAt", "deletedAt")
SELECT 
    gen_random_uuid()::text,
    "userId",
    "instanceType",
    "instanceId",
    200, -- default volume size
    "createdAt",
    CASE WHEN "status" = 'TERMINATED' THEN "updatedAt" ELSE NULL END
FROM "Instance";

COMMENT ON TABLE "InstanceLifecycle" IS 'Tracks instance creation and deletion history for accurate cost calculation';
COMMENT ON COLUMN "InstanceLifecycle"."deletedAt" IS 'NULL if instance still exists, otherwise deletion timestamp';
