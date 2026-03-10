# 고급 기능 마이그레이션 가이드

## 개요
다음 고급 기능들이 추가되었습니다:
- ✅ 다중 인스턴스 지원
- ✅ 인스턴스 템플릿
- ✅ 비용 한도 설정
- ✅ 자동 종료 정책

## 수동 마이그레이션 필요

DB 권한 문제로 자동 마이그레이션이 불가능합니다.
**관리자가 아래 SQL을 직접 실행해야 합니다.**

### 실행 방법

```bash
# PostgreSQL에 직접 접속
psql -h 172.31.28.119 -U [DB_USER] -d sar-kict

# 또는 pgAdmin 등 GUI 도구 사용
```

### SQL 스크립트

```sql
-- ============================================
-- 1. Instance 테이블 수정
-- ============================================

-- UNIQUE 제약조건 제거 (다중 인스턴스 지원)
ALTER TABLE "Instance" DROP CONSTRAINT IF EXISTS "Instance_userId_key";

-- 새 컬럼 추가
ALTER TABLE "Instance" ADD COLUMN IF NOT EXISTS "name" TEXT;
ALTER TABLE "Instance" ADD COLUMN IF NOT EXISTS "templateId" TEXT;
ALTER TABLE "Instance" ADD COLUMN IF NOT EXISTS "lastActivityAt" TIMESTAMP(3);

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS "Instance_userId_idx" ON "Instance"("userId");
CREATE INDEX IF NOT EXISTS "Instance_status_idx" ON "Instance"("status");

-- ============================================
-- 2. InstanceTemplate 테이블 생성
-- ============================================

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

-- 기본 템플릿 데이터
INSERT INTO "InstanceTemplate" ("id", "name", "description", "instanceType", "volumeSize", "isActive", "isDefault", "maxInstances")
VALUES
    (gen_random_uuid()::text, '기본 서버', 'CPU 최적화 기본 서버', 't3.small', 200, true, true, 3),
    (gen_random_uuid()::text, '고성능 서버', '대용량 메모리 서버 (128GB)', 'r6i.4xlarge', 500, true, false, 2),
    (gen_random_uuid()::text, 'GPU 서버', 'NVIDIA A10G GPU 서버', 'g5.xlarge', 500, true, false, 1)
ON CONFLICT DO NOTHING;

-- ============================================
-- 3. CostLimit 테이블 생성
-- ============================================

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
    CONSTRAINT "CostLimit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "CostLimit_userId_idx" ON "CostLimit"("userId");
CREATE INDEX IF NOT EXISTS "CostLimit_isActive_idx" ON "CostLimit"("isActive");

-- ============================================
-- 4. AutoStopPolicy 테이블 생성
-- ============================================

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
    CONSTRAINT "AutoStopPolicy_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS "AutoStopPolicy_userId_idx" ON "AutoStopPolicy"("userId");
CREATE INDEX IF NOT EXISTS "AutoStopPolicy_isActive_idx" ON "AutoStopPolicy"("isActive");

-- ============================================
-- 5. 외래키 제약조건 추가
-- ============================================

ALTER TABLE "Instance"
ADD CONSTRAINT "Instance_templateId_fkey"
FOREIGN KEY ("templateId") REFERENCES "InstanceTemplate"("id") ON DELETE SET NULL;

-- ============================================
-- 6. 기존 데이터 업데이트
-- ============================================

-- 기존 인스턴스에 기본 이름 설정
UPDATE "Instance"
SET "name" = 'Instance-' || substring("id", 1, 8)
WHERE "name" IS NULL;
```

## 마이그레이션 완료 확인

```sql
-- 테이블 확인
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('InstanceTemplate', 'CostLimit', 'AutoStopPolicy');

-- 템플릿 확인
SELECT * FROM "InstanceTemplate";

-- Instance 컬럼 확인
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'Instance'
AND column_name IN ('name', 'templateId', 'lastActivityAt');
```

## 문제 해결

### 권한 오류 발생 시
```sql
-- DB 소유자 권한으로 실행
-- 또는 SUPERUSER 권한이 있는 계정으로 실행
```

### 제약조건 충돌 시
```sql
-- 기존 userId UNIQUE 제약조건 확인
SELECT conname FROM pg_constraint
WHERE conrelid = 'Instance'::regclass
AND contype = 'u';

-- 제약조건 이름으로 삭제
ALTER TABLE "Instance" DROP CONSTRAINT "제약조건이름";
```

## 마이그레이션 후 작업

1. Prisma Client 재생성
```bash
npx prisma generate
```

2. 개발 서버 재시작
```bash
# PM2 사용 시
pm2 restart next-app

# 또는 수동 재시작
pkill -f "next dev"
npm run dev
```

3. 템플릿 데이터 확인
- http://localhost:3000/admin/templates 접속
- 기본 템플릿 3개가 표시되는지 확인

## 새로운 API 엔드포인트

### 템플릿
- `getActiveTemplates()` - 활성 템플릿 목록
- `createInstanceFromTemplate(templateId, name)` - 템플릿으로 인스턴스 생성

### 다중 인스턴스
- `getUserInstances()` - 사용자의 모든 인스턴스
- `startInstanceById(id)` - 특정 인스턴스 시작
- `stopInstanceById(id)` - 특정 인스턴스 중지
- `deleteInstanceById(id)` - 특정 인스턴스 삭제

### 비용 한도
- `setCostLimit({ limitType, limitAmount, notifyAt })` - 비용 한도 설정
- `getMyCostLimits()` - 내 비용 한도 조회

### 자동 종료 정책
- `setAutoStopPolicy({ isActive, idleMinutes, ... })` - 정책 설정
- `getMyAutoStopPolicy()` - 내 정책 조회

## 주의사항

⚠️ **백업 필수**: 마이그레이션 전 DB 백업 권장
⚠️ **다운타임**: Instance 테이블 수정 시 잠시 서비스 중단 가능
⚠️ **기존 인스턴스**: 기존 인스턴스는 그대로 유지되며 자동으로 name 컬럼 추가됨
