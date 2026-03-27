-- SshAllowedIp: 사용자별 SSH 허용 IP 관리 테이블
-- User 테이블은 sarkict_dev 소유이므로 FK 미사용, 애플리케이션 레벨에서 관리

CREATE TABLE IF NOT EXISTS "SshAllowedIp" (
  id TEXT PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "ipAddress" TEXT NOT NULL,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  UNIQUE("userId", "ipAddress")
);

CREATE INDEX IF NOT EXISTS "SshAllowedIp_userId_idx" ON "SshAllowedIp"("userId");
