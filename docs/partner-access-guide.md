# 협력업체(Broadwave) 접근 권한 설정 가이드

## 개요

협력업체(Broadwave)에 SAR-KICT 관련 리소스를 공유하기 위한 설정 내역.
`Project: sar-kict` 태그 기반으로 접근을 제한하여, 다른 AWS 리소스에는 접근할 수 없도록 구성.

## 공유 범위

| 대상 | 권한 | 방법 |
|------|------|------|
| SAR-KICT 앱 서버 | SSH (sudo) | `broadwave` Linux 계정 + 전용 SSH 키 |
| AWS Console | EC2 시작/중지/삭제 + CloudWatch 모니터링 (태그 제한) | `sar-kict-partner` IAM 사용자 |
| Gamma 파생 서버 | SSH | 웹앱에서 생성 + 키 다운로드 |
| SAR-KICT 웹앱 | 관리자 | 기존 계정 사용 (추가 공유 불필요) |
| GitHub 레포 | 불필요 | 앱 서버에서 git pull/push 가능 |

---

## 1. 앱 서버 SSH 접근

### 설정 내역

앱 서버에 `broadwave` 계정을 생성하고 sudo 권한을 부여.

```bash
# 계정 생성 (sudo 포함)
sudo adduser broadwave --disabled-password --gecos "Broadwave Partner"
sudo usermod -aG sudo broadwave
echo "broadwave ALL=(ALL) NOPASSWD:ALL" | sudo tee /etc/sudoers.d/broadwave

# SSH 키페어 생성
sudo mkdir -p /home/broadwave/.ssh
sudo ssh-keygen -t rsa -b 4096 -f /home/broadwave/.ssh/id_rsa -N "" -C "broadwave"
sudo cp /home/broadwave/.ssh/id_rsa.pub /home/broadwave/.ssh/authorized_keys
sudo chown -R broadwave:broadwave /home/broadwave/.ssh
sudo chmod 700 /home/broadwave/.ssh
sudo chmod 600 /home/broadwave/.ssh/authorized_keys
```

### 접속 정보

```
ssh -i broadwave-sar-kict.pem broadwave@[앱서버IP]
```

### 권한 범위

- sudo (관리자 권한)
- 앱 소스 읽기/수정, git pull/push
- 서비스 관리 (PM2, Nginx 등)
- 로그 확인, 패키지 설치

> **주의**: admin 권한이므로 서버 전체 접근 가능. `.env` 파일의 AWS 키는 제한된 정책(`sar-kict-ec2-management`)만 적용되어 있어 다른 AWS 서비스 접근 불가.

### 차단 방법

```bash
sudo usermod -L broadwave          # 즉시 차단
sudo usermod -U broadwave          # 차단 해제
sudo deluser --remove-home broadwave && sudo rm /etc/sudoers.d/broadwave  # 완전 삭제
```

---

## 2. AWS IAM 계정 (Console)

### 설정 내역

IAM 사용자 `sar-kict-partner`를 생성하고 `sar-kict-partner-policy` 정책을 연결.

### IAM 정책: `sar-kict-partner-policy` (v3)

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "EC2DescribeAll",
      "Effect": "Allow",
      "Action": [
        "ec2:DescribeInstances",
        "ec2:DescribeInstanceStatus",
        "ec2:DescribeImages",
        "ec2:DescribeSecurityGroups",
        "ec2:DescribeKeyPairs",
        "ec2:DescribeTags"
      ],
      "Resource": "*",
      "Condition": {
        "StringEquals": {
          "aws:RequestedRegion": "ap-northeast-2"
        }
      }
    },
    {
      "Sid": "EC2ManageTaggedOnly",
      "Effect": "Allow",
      "Action": [
        "ec2:StartInstances",
        "ec2:StopInstances",
        "ec2:RebootInstances",
        "ec2:TerminateInstances"
      ],
      "Resource": "arn:aws:ec2:ap-northeast-2:*:instance/*",
      "Condition": {
        "StringEquals": {
          "ec2:ResourceTag/Project": "sar-kict"
        }
      }
    },
    {
      "Sid": "BroadwaveSGManage",
      "Effect": "Allow",
      "Action": [
        "ec2:AuthorizeSecurityGroupIngress",
        "ec2:RevokeSecurityGroupIngress"
      ],
      "Resource": "arn:aws:ec2:ap-northeast-2:[ACCOUNT_ID]:security-group/[BROADWAVE_SG_ID]"
    },
    {
      "Sid": "CloudWatchRead",
      "Effect": "Allow",
      "Action": [
        "cloudwatch:GetMetricData",
        "cloudwatch:GetMetricStatistics",
        "cloudwatch:ListMetrics",
        "cloudwatch:DescribeAlarms"
      ],
      "Resource": "*"
    },
    {
      "Sid": "DenyCreateAndModify",
      "Effect": "Deny",
      "Action": [
        "ec2:RunInstances",
        "ec2:CreateSecurityGroup",
        "ec2:DeleteSecurityGroup",
        "ec2:CreateKeyPair",
        "ec2:DeleteKeyPair",
        "ec2:CreateTags",
        "ec2:DeleteTags"
      ],
      "Resource": "*"
    }
  ]
}
```

### 정책 설명

| Statement | 설명 |
|-----------|------|
| `EC2DescribeAll` | 서울 리전 EC2/SG/키페어 목록 조회 |
| `EC2ManageTaggedOnly` | `Project: sar-kict` 태그 인스턴스만 시작/중지/재부팅/삭제 |
| `BroadwaveSGManage` | `broadwave-access` SG의 인바운드 규칙만 추가/삭제 (SSH IP 등록용) |
| `CloudWatchRead` | CPU 등 메트릭 조회 (모니터링) |
| `DenyCreateAndModify` | EC2 생성, SG 생성/삭제, 키페어 관리, 태그 변경 차단 |

### 협력업체가 할 수 있는 것

| 가능 | 불가 |
|------|------|
| `sar-kict` 태그 EC2 시작/중지/재부팅/삭제 | 태그 없는 EC2 조작 |
| CloudWatch CPU 모니터링 | EC2 생성 |
| `broadwave-access` SG에 SSH IP 추가/삭제 | 다른 SG 수정 |
| 인스턴스 상태 조회 | 태그 변경 |

---

## 3. Security Group 구성

### 앱 서버에 연결된 SG (3개)

| SG 이름 | 용도 | SSH 규칙 | 관리자 |
|---------|------|----------|--------|
| `BckComputers` | 관리자 개인 IP 화이트리스트 | 특정 IP만 | bckim |
| `sar-kict-app` | 웹 서비스 (HTTP/HTTPS) | 없음 (SSH 제거됨) | bckim |
| `broadwave-access` | 협력업체 SSH 접근용 | 협력업체가 직접 추가 | broadwave |

### SSH 0.0.0.0/0 제거

`sar-kict-app` SG에서 SSH 전체 개방(0.0.0.0/0) 규칙을 제거하여 보안 강화.
협력업체는 `broadwave-access` SG에 본인 IP를 직접 등록해야 SSH 접속 가능.

### 협력업체 IP 등록 방법

AWS Console:
> EC2 → 보안 그룹 → `broadwave-access` → 인바운드 규칙 편집 → 규칙 추가 → 유형: SSH, 소스: 내 IP → 저장

또는 AWS CLI:
```bash
aws ec2 authorize-security-group-ingress \
  --group-id [BROADWAVE_SG_ID] \
  --protocol tcp --port 22 --cidr [본인IP]/32 \
  --region ap-northeast-2
```

---

## 4. 태그 설정

### `Project: sar-kict` 태그 적용 대상

| 리소스 | 태그 설정 방법 |
|--------|---------------|
| 앱 서버 EC2 | AWS CLI로 수동 추가 (완료) |
| 웹앱에서 생성하는 Gamma 서버 | 코드에서 자동 태그 (`app/src/lib/actions/ec2.ts`) |
| `broadwave-access` SG | 생성 시 태그 추가 (완료) |

---

## 5. 보안 점검 결과

### 앱 서버 `.env` 민감 정보

| 정보 | 위험도 | 이유 |
|------|--------|------|
| AWS Access Key | **낮음** | `sar-kict-ec2-management` 정책만 적용 (EC2 관리 + Terminate Deny) |
| DB 비밀번호 | 중간 | 같은 VPC 내부에서만 접속 가능 |
| Google OAuth Secret | 낮음 | Google Console 접근 없이 악용 불가 |
| AUTH_SECRET | 낮음 | 서버 내부 JWT 서명용 |

### `.env` AWS 키 권한 (`sar-kict-app` 사용자)

- 정책: `sar-kict-ec2-management`
- EC2 생성/시작/중지: 허용
- EC2 삭제: Deny
- 다른 AWS 서비스 (S3, RDS, IAM 등): 접근 불가

---

## 설정 체크리스트

- [x] 앱 서버: `broadwave` Linux 계정 생성 (sudo) + SSH 키 생성
- [x] AWS: 앱 서버에 `Project: sar-kict` 태그 추가
- [x] AWS: `broadwave-access` SG 생성 + 앱 서버에 연결
- [x] AWS: `sar-kict-app` SG에서 SSH 0.0.0.0/0 제거
- [x] AWS: `sar-kict-partner-policy` IAM 정책 생성 (v3)
- [x] AWS: `sar-kict-partner` IAM 사용자 생성 + Console 접근 활성화
- [x] 보안 점검: `.env` 민감 정보 확인 완료
- [ ] 협력업체에 전달: SSH 키, AWS Console 로그인 정보

---

## 권한 회수

| 대상 | 방법 |
|------|------|
| 앱 서버 SSH | `sudo usermod -L broadwave` |
| AWS Console | IAM 사용자 비활성화: `aws iam delete-login-profile --user-name sar-kict-partner` |
| Gamma 서버 | 웹앱 관리자 페이지에서 인스턴스 종료 |
| 웹앱 | 관리자 페이지에서 REJECTED 처리 |
| SG IP 규칙 | `broadwave-access` SG의 인바운드 규칙 전체 삭제 |
