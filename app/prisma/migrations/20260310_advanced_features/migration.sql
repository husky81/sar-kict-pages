-- ============================================
-- Migration: Advanced Features
-- - 다중 인스턴스 지원
-- - 인스턴스 템플릿
-- - 비용 한도 설정
-- - 자동 종료 정책
-- ============================================

-- 1. Instance 테이블 수정 (다중 인스턴스 지원)
ALTER TABLE "Instance" DROP CONSTRAINT IF EXISTS "Instance_userId_key";
ALTER TABLE "Instance" ADD COLUMN IF NOT EXISTS "name" TEXT;
ALTER TABLE "Instance" ADD COLUMN IF NOT EXISTS "templateId" TEXT;
ALTER TABLE "Instance" ADD COLUMN IF NOT EXISTS "lastActivityAt" TIMESTAMP(3);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS "Instance_userId_idx" ON "Instance"("userId");
CREATE INDEX IF NOT EXISTS "Instance_status_idx" ON "Instance"("status");

-- 2. InstanceTemplate 테이블 생성
CREATE TABLE IF NOT EXISTS "InstanceTemplate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "instanceType" TEXT NOT NULL,
    "volumeSize" INTEGER NOT NULL DEFAULT 200,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "minInstances" INTEGER NOT NULL DEFAULT 0,
    "maxInstances" INTEGER NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS "InstanceTemplate_isActive_idx" ON "InstanceTemplate"("isActive");

-- 3. CostLimit 테이블 생성
CREATE TABLE IF NOT EXISTS "CostLimit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "limitType" TEXT NOT NULL,
    "limitAmount" DOUBLE PRECISION NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "notifyAt" DOUBLE PRECISION,
    "lastNotifiedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CostLimit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "CostLimit_userId_idx" ON "CostLimit"("userId");
CREATE INDEX IF NOT EXISTS "CostLimit_isActive_idx" ON "CostLimit"("isActive");

-- 4. AutoStopPolicy 테이블 생성
CREATE TABLE IF NOT EXISTS "AutoStopPolicy" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "idleMinutes" INTEGER NOT NULL DEFAULT 720,
    "checkCpu" BOOLEAN NOT NULL DEFAULT true,
    "cpuThreshold" DOUBLE PRECISION NOT NULL DEFAULT 5.0,
    "stopOnWeekends" BOOLEAN NOT NULL DEFAULT false,
    "stopAtNight" BOOLEAN NOT NULL DEFAULT false,
    "nightStartHour" INTEGER DEFAULT 22,
    "nightEndHour" INTEGER DEFAULT 6,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AutoStopPolicy_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "AutoStopPolicy_userId_idx" ON "AutoStopPolicy"("userId");
CREATE INDEX IF NOT EXISTS "AutoStopPolicy_isActive_idx" ON "AutoStopPolicy"("isActive");

-- 5. Instance에 templateId 외래키 추가
ALTER TABLE "Instance"
ADD CONSTRAINT "Instance_templateId_fkey"
FOREIGN KEY ("templateId") REFERENCES "InstanceTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- 6. 기본 템플릿 데이터 삽입
INSERT INTO "InstanceTemplate" ("id", "name", "description", "instanceType", "volumeSize", "isActive", "isDefault", "maxInstances")
VALUES
    (gen_random_uuid()::text, '기본 서버', 'CPU 최적화 기본 서버', 't3.small', 200, true, true, 2),
    (gen_random_uuid()::text, '고성능 서버', '대용량 메모리 서버 (128GB)', 'r6i.4xlarge', 500, true, false, 1),
    (gen_random_uuid()::text, 'GPU 서버', 'NVIDIA A10G GPU 서버', 'g5.xlarge', 500, true, false, 1)
ON CONFLICT DO NOTHING;

-- 7. 기존 인스턴스에 기본 이름 설정
UPDATE "Instance"
SET "name" = 'Instance-' || substring("id", 1, 8)
WHERE "name" IS NULL;

-- 8. 주석 추가
COMMENT ON TABLE "InstanceTemplate" IS 'Pre-configured instance templates for users to choose from';
COMMENT ON TABLE "CostLimit" IS 'User cost limits with automatic notifications and shutdowns';
COMMENT ON TABLE "AutoStopPolicy" IS 'Automatic instance stop policies based on idle time and schedules';
COMMENT ON COLUMN "Instance"."lastActivityAt" IS 'Last activity timestamp for automatic stop detection';
