# EC2 인스턴스 프로비저닝 기능

## 개요

승인된 사용자가 웹 대시보드에서 개인용 EC2 인스턴스를 생성하고, SSH 키를 발급받아 접속하는 기능.
CPU 사용량이 낮을 때 자동 중지하여 비용을 절감하고, 사용자가 웹에서 다시 시작할 수 있다.

## 아키텍처

```
사용자 브라우저
    │
    ▼
Next.js App (dev.sar-kict.kr)
    │
    ├─ Server Action ──→ AWS EC2 API (인스턴스 생성/시작/중지)
    ├─ Server Action ──→ AWS CloudWatch API (자동 중지 알람)
    ├─ API Route ──────→ AWS EC2 API (상태 폴링)
    └─ Prisma ORM ─────→ PostgreSQL (인스턴스/SSH키 메타데이터)
```

## 기술 결정

| 항목 | 선택 | 이유 |
|------|------|------|
| EC2 생성 방식 | AWS SDK v3 | 사용자 요청 시 동적 생성 (Terraform은 정적 인프라용) |
| SSH 키 관리 | `ec2.createKeyPair()` | SDK 한번의 호출로 생성, 개인키 DB 저장 |
| 자동 중지 | CloudWatch Alarm + EC2 Stop Action | Lambda 불필요, AWS 네이티브 지원 |
| 상태 폴링 | API Route + 클라이언트 폴링 (10초) | 전환 상태(시작중/중지중)에서만 폴링 |
| 인스턴스 타입 | t3.small On-Demand | Spot은 중단 위험, Reserved는 비유연적 |

## 사용자 흐름

```
관리자 승인 → 대시보드 접근 → "인스턴스 생성" 클릭
→ EC2 생성 중 (PENDING) → 생성 완료 (RUNNING)
→ SSH 키 다운로드 → ssh -i key.pem ubuntu@<IP> 접속
→ 사용 중 ... → CPU 유휴 30분 → 자동 중지 (STOPPED)
→ 대시보드에서 "시작" 클릭 → 재시작 (RUNNING)
```

## 자동 중지 동작 방식

인스턴스 생성 시 CloudWatch Alarm이 함께 생성된다.

```
인스턴스 실행 중
  → CloudWatch가 5분 간격으로 CPUUtilization 모니터링
  → CPU < 5%가 30분(6회 연속) 지속
  → ALARM 상태 전환
  → arn:aws:automate:ap-northeast-2:ec2:stop 액션 실행
  → 인스턴스 자동 중지
  → 사용자 대시보드에 "중지됨" 표시
  → 사용자가 "시작" 버튼 클릭 → 인스턴스 재시작 → 알람 자동 리셋
```

인스턴스가 중지되면 CloudWatch가 메트릭을 받지 못해 `INSUFFICIENT_DATA` 상태가 되며, 이 상태에서는 Stop 액션이 발동하지 않는다 (정상 동작).

## 데이터 모델

### InstanceStatus Enum

| 상태 | 설명 |
|------|------|
| `PENDING` | 생성 중 |
| `RUNNING` | 실행 중 |
| `STOPPED` | 중지됨 |
| `STOPPING` | 중지 중 |
| `STARTING` | 시작 중 |
| `TERMINATED` | 종료됨 |
| `FAILED` | 생성 실패 |

### Instance 모델

```prisma
model Instance {
  id              String         @id @default(cuid())
  userId          String         @unique   // 사용자당 1개
  instanceId      String?        @unique   // AWS EC2 인스턴스 ID (i-0abc...)
  instanceType    String         @default("t3.small")
  status          InstanceStatus @default(PENDING)
  publicIp        String?
  privateIp       String?
  securityGroupId String?        // 사용자별 Security Group
  keyPairName     String?        // AWS Key Pair 이름
  amiId           String?        // 사용된 AMI ID
  alarmName       String?        // CloudWatch 알람 이름
  launchedAt      DateTime?
  stoppedAt       DateTime?
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt
}
```

### SshKey 모델

```prisma
model SshKey {
  id          String   @id @default(cuid())
  instanceId  String   @unique
  keyPairName String
  privateKey  String   @db.Text  // PEM 인코딩된 개인키
  fingerprint String?
  createdAt   DateTime @default(now())
}
```

## 서버 액션

파일: `app/src/lib/actions/ec2.ts`

| 액션 | 설명 | 필요 권한 |
|------|------|-----------|
| `provisionInstance()` | SG → 키페어 → AMI 조회 → EC2 실행 → CloudWatch 알람 → DB 저장 | APPROVED 사용자 |
| `startInstance()` | 중지된 EC2 시작 | APPROVED (본인 인스턴스만) |
| `stopInstance()` | 실행 중인 EC2 중지 | APPROVED (본인 인스턴스만) |
| `terminateInstance(userId)` | EC2 종료 + SG/키페어/알람 삭제 + DB 삭제 | ADMIN |
| `getUserInstance()` | 내 인스턴스 정보 조회 | APPROVED (본인) |
| `getSshKey()` | SSH 개인키 반환 (다운로드) | APPROVED (본인) |

### provisionInstance 프로세스 상세

```
1. 기존 인스턴스 확인 (userId unique 제약으로 중복 방지)
2. Security Group 생성 (VPC: vpc-bd0d80d6, SSH 22번 포트만 허용)
3. Key Pair 생성 (RSA PEM 형식)
4. Ubuntu 24.04 최신 AMI 조회 (Canonical 공식)
5. EC2 RunInstances
   - 타입: t3.small
   - 서브넷: subnet-dfd1b9a4 (DB와 같은 VPC, 내부 통신 무료)
   - 스토리지: 30GB gp3, 암호화 활성
   - 태그: Name, Project, UserId, ManagedBy
6. CloudWatch Alarm 생성
   - 메트릭: CPUUtilization < 5%
   - 기간: 5분 × 6회 = 30분
   - 액션: EC2 자동 Stop
7. DB에 Instance + SshKey 저장
8. 대시보드에서 SSH 키 다운로드 제공
```

## API 라우트

### GET /api/instances/status

클라이언트 사이드 상태 폴링용. 전환 상태(PENDING, STARTING, STOPPING)에서 10초 간격으로 호출.

- AWS EC2 DescribeInstances로 실시간 상태 조회
- DB와 상태 불일치 시 자동 업데이트
- Public IP 변경 감지 및 반영

## 파일 구조

```
app/src/
  lib/
    aws.ts                                  # EC2Client, CloudWatchClient 싱글톤
    actions/
      ec2.ts                                # EC2 관리 서버 액션
  app/
    api/instances/status/route.ts           # 상태 폴링 API
    (protected)/dashboard/page.tsx          # [수정] 인스턴스 카드 추가
    (admin)/admin/users/page.tsx            # [수정] 인스턴스 컬럼 + 종료 버튼
  components/instance/
    instance-card.tsx                        # 대시보드 인스턴스 카드 (메인)
    instance-status-badge.tsx               # 상태 뱃지 컴포넌트
    provision-button.tsx                    # "인스턴스 생성" 버튼
    start-stop-button.tsx                   # 시작/중지 토글 버튼
    ssh-key-download.tsx                    # SSH 키 다운로드 버튼
    instance-polling.tsx                    # useInstanceStatus 폴링 훅
```

## 환경변수

`app/.env`에 추가 필요:

```bash
AWS_ACCESS_KEY_ID="..."
AWS_SECRET_ACCESS_KEY="..."
AWS_REGION="ap-northeast-2"
AWS_VPC_ID="vpc-bd0d80d6"
AWS_SUBNET_ID="subnet-dfd1b9a4"
```

IAM 정책 설정은 [aws-iam-setup.md](./aws-iam-setup.md) 참고.

## 보안

- **사용자 격리**: 사용자별 Security Group 생성, SSH(22) 포트만 허용
- **인스턴스 접근 제어**: 서버 액션에서 `session.user.id`로 본인 인스턴스만 조회/제어
- **SSH 키**: DB에 저장 (PostgreSQL 암호화 at-rest), 다운로드 시 서버 액션 경유
- **태그 기반 추적**: 모든 인스턴스에 `ManagedBy: sar-kict-app`, `UserId` 태그
- **중복 방지**: `userId @unique` 제약으로 사용자당 1개 인스턴스만 허용
- **미들웨어 보호**: `/api/instances` 라우트는 APPROVED 사용자만 접근 가능

## 비용 최적화

- **자동 중지**: CPU 유휴 30분 후 자동 중지로 방치 비용 방지
- **같은 VPC**: DB와 동일 VPC 내 서브넷 사용으로 내부 통신 비용 무료
- **On-Demand**: 사용한 만큼만 과금, 중지 시 EBS 스토리지 비용만 발생
- **t3.small**: 버스트 크레딧 기반으로 간헐적 사용에 적합
