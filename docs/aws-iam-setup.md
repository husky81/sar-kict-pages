# AWS IAM 설정 가이드

SAR KICT Cloud Platform의 EC2 인스턴스 프로비저닝 기능을 위한 IAM 설정 문서.

## 개요

웹 앱에서 사용자별 EC2 인스턴스를 생성/시작/중지하고, SSH 키를 발급하며, CloudWatch로 CPU 모니터링 및 자동 중지를 수행하기 위한 최소 권한 IAM 정책.

> **TerminateInstances(EC2 삭제)는 명시적으로 Deny** 처리되어 있음. 인스턴스 삭제는 AWS Console에서 직접 수행.

## 허용 권한 요약

| 기능 | AWS 액션 | 허용 |
|------|----------|------|
| EC2 인스턴스 생성 | `ec2:RunInstances` | O |
| EC2 인스턴스 시작 | `ec2:StartInstances` | O |
| EC2 인스턴스 중지 | `ec2:StopInstances` | O |
| EC2 인스턴스 조회 | `ec2:DescribeInstances`, `ec2:DescribeInstanceStatus` | O |
| EC2 태그 생성 | `ec2:CreateTags` | O |
| AMI 조회 | `ec2:DescribeImages` | O |
| Security Group 관리 | `ec2:CreateSecurityGroup`, `ec2:DeleteSecurityGroup`, `ec2:AuthorizeSecurityGroupIngress`, `ec2:RevokeSecurityGroupIngress`, `ec2:DescribeSecurityGroups` | O |
| SSH Key Pair 관리 | `ec2:CreateKeyPair`, `ec2:DeleteKeyPair`, `ec2:DescribeKeyPairs` | O |
| CloudWatch 알람 관리 | `cloudwatch:PutMetricAlarm`, `cloudwatch:DeleteAlarms`, `cloudwatch:DescribeAlarms` | O |
| CloudWatch 메트릭 조회 | `cloudwatch:GetMetricData`, `cloudwatch:GetMetricStatistics` | O |
| **EC2 인스턴스 삭제** | **`ec2:TerminateInstances`** | **X (Deny)** |

## IAM 정책 JSON

정책 이름: `sar-kict-ec2-management`

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "EC2InstanceLifecycle",
      "Effect": "Allow",
      "Action": [
        "ec2:RunInstances",
        "ec2:StartInstances",
        "ec2:StopInstances",
        "ec2:DescribeInstances",
        "ec2:DescribeInstanceStatus",
        "ec2:DescribeImages",
        "ec2:CreateTags"
      ],
      "Resource": "*",
      "Condition": {
        "StringEquals": {
          "aws:RequestedRegion": "ap-northeast-2"
        }
      }
    },
    {
      "Sid": "EC2SecurityGroups",
      "Effect": "Allow",
      "Action": [
        "ec2:CreateSecurityGroup",
        "ec2:DeleteSecurityGroup",
        "ec2:AuthorizeSecurityGroupIngress",
        "ec2:RevokeSecurityGroupIngress",
        "ec2:DescribeSecurityGroups"
      ],
      "Resource": "*"
    },
    {
      "Sid": "EC2KeyPairs",
      "Effect": "Allow",
      "Action": [
        "ec2:CreateKeyPair",
        "ec2:DeleteKeyPair",
        "ec2:DescribeKeyPairs"
      ],
      "Resource": "*"
    },
    {
      "Sid": "CloudWatchMonitoring",
      "Effect": "Allow",
      "Action": [
        "cloudwatch:PutMetricAlarm",
        "cloudwatch:DeleteAlarms",
        "cloudwatch:DescribeAlarms",
        "cloudwatch:GetMetricData",
        "cloudwatch:GetMetricStatistics"
      ],
      "Resource": "*"
    },
    {
      "Sid": "DenyTerminate",
      "Effect": "Deny",
      "Action": [
        "ec2:TerminateInstances"
      ],
      "Resource": "*"
    }
  ]
}
```

## 설정 절차

### 1. IAM 정책 생성

1. AWS Console → IAM → 정책 → **정책 생성**
2. JSON 탭 선택 → 위 정책 JSON 붙여넣기
3. 정책 이름: `sar-kict-ec2-management`
4. 정책 생성

### 2. IAM 사용자 생성

1. IAM → 사용자 → **사용자 생성**
2. 사용자 이름: `sar-kict-app`
3. AWS Management Console 액세스: **체크 해제** (프로그래밍 접근만)
4. 권한 설정 → **직접 정책 연결** → `sar-kict-ec2-management` 선택
5. 사용자 생성

### 3. Access Key 발급

1. 생성된 사용자 클릭 → **보안 자격 증명** 탭
2. 액세스 키 → **액세스 키 만들기**
3. 사용 사례: "서버에서 실행되는 애플리케이션" 선택
4. Access Key ID / Secret Access Key 복사

### 4. 환경변수 설정

`app/.env` 파일에 입력:

```bash
AWS_ACCESS_KEY_ID="발급받은_ACCESS_KEY_ID"
AWS_SECRET_ACCESS_KEY="발급받은_SECRET_ACCESS_KEY"
AWS_REGION="ap-northeast-2"
AWS_VPC_ID="vpc-bd0d80d6"
AWS_SUBNET_ID="subnet-dfd1b9a4"
```

## 보안 참고사항

- **DenyTerminate**: Deny 규칙은 다른 어떤 Allow보다 우선합니다. 이 사용자로는 절대 EC2를 삭제할 수 없습니다.
- **리전 제한**: EC2 인스턴스 관련 액션은 `ap-northeast-2`(서울) 리전에서만 허용됩니다.
- **키 관리**: Access Key는 `.env` 파일에만 저장하며, `.gitignore`에 `.env`가 포함되어 있어 Git에 커밋되지 않습니다.
- **운영 환경**: 운영 서버(EC2)에서는 IAM Instance Profile(역할)을 사용하면 Access Key 없이 권한을 부여할 수 있습니다.
