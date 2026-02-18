"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ec2, cloudwatch } from "@/lib/aws";
import { revalidatePath } from "next/cache";
import {
  RunInstancesCommand,
  StartInstancesCommand,
  StopInstancesCommand,
  CreateKeyPairCommand,
  DeleteKeyPairCommand,
  CreateSecurityGroupCommand,
  AuthorizeSecurityGroupIngressCommand,
  DeleteSecurityGroupCommand,
  DescribeSecurityGroupsCommand,
  type _InstanceType,
} from "@aws-sdk/client-ec2";
import type { IpRange } from "@aws-sdk/client-ec2";
import {
  PutMetricAlarmCommand,
  DeleteAlarmsCommand,
} from "@aws-sdk/client-cloudwatch";
import { getPreset } from "@/lib/instance-types";

async function requireApprovedUser() {
  const session = await auth();
  if (!session?.user || session.user.status !== "APPROVED") {
    throw new Error("승인된 사용자만 이용할 수 있습니다");
  }
  return session;
}

export async function provisionInstance(targetUserId: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("관리자 권한이 필요합니다");
  }

  const userId = targetUserId;

  const userRows = await prisma.$queryRawUnsafe<
    { instanceQuota: number; instanceType: string; email: string }[]
  >(
    `SELECT COALESCE(c."instanceQuota", 0) as "instanceQuota",
            COALESCE(c."instanceType", 't3.small') as "instanceType",
            u.email
     FROM "User" u
     LEFT JOIN "UserInstanceConfig" c ON c."userId" = u.id
     WHERE u.id = $1`,
    userId
  ).catch(() => [] as { instanceQuota: number; instanceType: string; email: string }[]);

  const user = userRows[0];
  if (!user || Number(user.instanceQuota) < 1) {
    throw new Error("인스턴스 생성 권한이 없습니다. 쿼터를 먼저 설정하세요.");
  }

  const existing = await prisma.instance.findUnique({ where: { userId } });
  if (existing) {
    throw new Error("이미 인스턴스가 있습니다");
  }

  const preset = getPreset(user.instanceType);
  const projectName = "sar-kict";
  const userTag = `${projectName}-user-${userId.slice(0, 8)}`;

  try {
    // 1. Security Group 생성 (이미 존재하면 재사용)
    const sgName = `${userTag}-sg`;
    let sgId: string;

    try {
      const sgResult = await ec2.send(
        new CreateSecurityGroupCommand({
          GroupName: sgName,
          Description: `Security group for user ${user.email}`,
          VpcId: process.env.AWS_VPC_ID,
        })
      );
      sgId = sgResult.GroupId!;

      // 사용자의 등록된 SSH 허용 IP로 규칙 추가 (0.0.0.0/0 대신)
      const allowedIps = await prisma.$queryRawUnsafe<{ ipAddress: string }[]>(
        `SELECT "ipAddress" FROM "SshAllowedIp" WHERE "userId" = $1`,
        userId
      ).catch(() => [] as { ipAddress: string }[]);

      if (allowedIps.length > 0) {
        const ipRanges: IpRange[] = allowedIps.map((row) => ({
          CidrIp: `${row.ipAddress}/32`,
          Description: `SSH allow ${row.ipAddress}`,
        }));

        await ec2.send(
          new AuthorizeSecurityGroupIngressCommand({
            GroupId: sgId,
            IpPermissions: [
              {
                IpProtocol: "tcp",
                FromPort: 22,
                ToPort: 22,
                IpRanges: ipRanges,
              },
            ],
          })
        );
      }
      // 등록된 IP가 없으면 SSH 규칙 없이 생성 (IP 등록 후 접근 가능)
    } catch (sgError: unknown) {
      if (
        sgError instanceof Error &&
        "Code" in sgError &&
        (sgError as { Code: string }).Code === "InvalidGroup.Duplicate"
      ) {
        const existing = await ec2.send(
          new DescribeSecurityGroupsCommand({
            Filters: [
              { Name: "group-name", Values: [sgName] },
              { Name: "vpc-id", Values: [process.env.AWS_VPC_ID!] },
            ],
          })
        );
        sgId = existing.SecurityGroups![0].GroupId!;
      } else {
        throw sgError;
      }
    }

    // 2. Key Pair 생성 (이미 존재하면 삭제 후 재생성)
    const keyPairName = `${userTag}-key`;
    try {
      await ec2.send(new DeleteKeyPairCommand({ KeyName: keyPairName }));
    } catch {
      // 없으면 무시
    }
    const keyResult = await ec2.send(
      new CreateKeyPairCommand({
        KeyName: keyPairName,
        KeyType: "rsa",
        KeyFormat: "pem",
      })
    );

    // 3. AMI
    const amiId = "ami-0dad7a2e04d3b66b4";

    // 4. EC2 인스턴스 실행
    const runResult = await ec2.send(
      new RunInstancesCommand({
        ImageId: amiId,
        InstanceType: user.instanceType as _InstanceType,
        KeyName: keyPairName,
        SecurityGroupIds: [sgId],
        SubnetId: process.env.AWS_SUBNET_ID,
        MinCount: 1,
        MaxCount: 1,
        TagSpecifications: [
          {
            ResourceType: "instance",
            Tags: [
              {
                Key: "Name",
                Value: `${projectName}-user-${user.email}`,
              },
              { Key: "Project", Value: projectName },
              { Key: "UserId", Value: userId },
              { Key: "ManagedBy", Value: "sar-kict-app" },
            ],
          },
          {
            ResourceType: "volume",
            Tags: [
              {
                Key: "Name",
                Value: `${projectName}-vol-${user.email}`,
              },
              { Key: "Project", Value: projectName },
              { Key: "UserId", Value: userId },
              { Key: "ManagedBy", Value: "sar-kict-app" },
            ],
          },
        ],
        BlockDeviceMappings: [
          {
            DeviceName: "/dev/sda1",
            Ebs: { VolumeSize: preset.volumeSize, VolumeType: "gp3", Encrypted: true },
          },
        ],
      })
    );

    const awsInstanceId = runResult.Instances![0].InstanceId!;
    const privateIp = runResult.Instances![0].PrivateIpAddress;

    // 5. DB 저장 (CloudWatch보다 먼저 — 알람 실패해도 인스턴스 추적 가능)
    const region = process.env.AWS_REGION || "ap-northeast-2";
    const alarmName = `${userTag}-auto-stop`;

    const instance = await prisma.instance.create({
      data: {
        userId,
        instanceId: awsInstanceId,
        instanceType: user.instanceType,
        status: "PENDING",
        privateIp,
        securityGroupId: sgId,
        keyPairName,
        amiId: amiId,
        alarmName,
      },
    });

    await prisma.sshKey.create({
      data: {
        instanceId: instance.id,
        keyPairName,
        privateKey: keyResult.KeyMaterial!,
        fingerprint: keyResult.KeyFingerprint,
      },
    });

    // 6. CloudWatch 자동 중지 알람 생성 (비치명적 — 실패해도 인스턴스는 사용 가능)
    try {
      await cloudwatch.send(
        new PutMetricAlarmCommand({
          AlarmName: alarmName,
          AlarmDescription: `Auto-stop for user ${user.email} when CPU < 5% for 30min`,
          Namespace: "AWS/EC2",
          MetricName: "CPUUtilization",
          Dimensions: [{ Name: "InstanceId", Value: awsInstanceId }],
          Statistic: "Average",
          Period: 300,
          EvaluationPeriods: 6,
          Threshold: 5.0,
          ComparisonOperator: "LessThanThreshold",
          AlarmActions: [`arn:aws:automate:${region}:ec2:stop`],
        })
      );
    } catch (alarmError) {
      console.warn("CloudWatch alarm creation failed (non-critical):", alarmError);
      await prisma.instance.update({
        where: { id: instance.id },
        data: { alarmName: null },
      });
    }

    revalidatePath("/dashboard");
    revalidatePath("/admin/users");
    return { success: true, instanceId: instance.id };
  } catch (error) {
    console.error("Instance provisioning failed:", error);
    throw new Error("인스턴스 생성에 실패했습니다");
  }
}

export async function startInstance() {
  const session = await requireApprovedUser();

  const instance = await prisma.instance.findUnique({
    where: { userId: session.user.id },
  });
  if (!instance?.instanceId) throw new Error("인스턴스를 찾을 수 없습니다");

  // AWS 시작 명령 실행
  await ec2.send(
    new StartInstancesCommand({ InstanceIds: [instance.instanceId] })
  );

  // 인스턴스 상태 업데이트
  await prisma.instance.update({
    where: { id: instance.id },
    data: { status: "STARTING" },
  });

  // RunningLog 생성 (중복 방지: stoppedAt이 null인 로그가 없을 때만)
  const existingLog = await prisma.runningLog.findFirst({
    where: {
      instanceId: instance.id,
      stoppedAt: null,
    },
  });

  if (!existingLog) {
    await prisma.runningLog.create({
      data: {
        instanceId: instance.id,
        startedAt: new Date(),
      },
    });
  }

  revalidatePath("/dashboard");
}

export async function stopInstance() {
  const session = await requireApprovedUser();

  const instance = await prisma.instance.findUnique({
    where: { userId: session.user.id },
  });
  if (!instance?.instanceId) throw new Error("인스턴스를 찾을 수 없습니다");

  // AWS 중지 명령 실행
  await ec2.send(
    new StopInstancesCommand({ InstanceIds: [instance.instanceId] })
  );

  // 인스턴스 상태 업데이트
  await prisma.instance.update({
    where: { id: instance.id },
    data: { status: "STOPPING" },
  });

  // RunningLog 종료 처리 (가장 최근의 실행 중인 로그)
  const lastRunningLog = await prisma.runningLog.findFirst({
    where: {
      instanceId: instance.id,
      stoppedAt: null,
    },
    orderBy: { startedAt: "desc" },
  });

  if (lastRunningLog) {
    await prisma.runningLog.update({
      where: { id: lastRunningLog.id },
      data: { stoppedAt: new Date() },
    });
  }

  revalidatePath("/dashboard");
}

// 관리자 종료: EC2 stop만 수행, DB 인스턴스는 유지 (사용자 대시보드에서 계속 보임)
export async function adminStopInstance(targetUserId: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("관리자 권한이 필요합니다");
  }

  const instance = await prisma.instance.findUnique({
    where: { userId: targetUserId },
  });
  if (!instance?.instanceId) throw new Error("인스턴스를 찾을 수 없습니다");

  if (instance.status === "STOPPED" || instance.status === "STOPPING") {
    throw new Error("이미 중지된 인스턴스입니다");
  }

  // AWS 중지 명령 실행
  await ec2.send(
    new StopInstancesCommand({ InstanceIds: [instance.instanceId] })
  );

  // 인스턴스 상태 업데이트
  await prisma.instance.update({
    where: { id: instance.id },
    data: { status: "STOPPING" },
  });

  // RunningLog 종료 처리
  const lastRunningLog = await prisma.runningLog.findFirst({
    where: {
      instanceId: instance.id,
      stoppedAt: null,
    },
    orderBy: { startedAt: "desc" },
  });

  if (lastRunningLog) {
    await prisma.runningLog.update({
      where: { id: lastRunningLog.id },
      data: { stoppedAt: new Date() },
    });
  }

  revalidatePath("/admin/users");
  revalidatePath("/dashboard");
}

// 관리자 시작: EC2 start
export async function adminStartInstance(targetUserId: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("관리자 권한이 필요합니다");
  }

  const instance = await prisma.instance.findUnique({
    where: { userId: targetUserId },
  });
  if (!instance?.instanceId) throw new Error("인스턴스를 찾을 수 없습니다");

  if (instance.status !== "STOPPED" && instance.status !== "STOPPING") {
    throw new Error("중지된 인스턴스만 시작할 수 있습니다");
  }

  // STOPPING 상태면 중지 완료 후 시작해야 하므로 잠시 대기
  if (instance.status === "STOPPING") {
    const { DescribeInstancesCommand: Desc } = await import("@aws-sdk/client-ec2");
    for (let i = 0; i < 30; i++) {
      await new Promise((r) => setTimeout(r, 2000));
      const res = await ec2.send(new Desc({ InstanceIds: [instance.instanceId] }));
      const state = res.Reservations?.[0]?.Instances?.[0]?.State?.Name;
      if (state === "stopped") break;
      if (state !== "stopping") break;
    }
  }

  // AWS 시작 명령 실행
  await ec2.send(
    new StartInstancesCommand({ InstanceIds: [instance.instanceId] })
  );

  // 인스턴스 상태 업데이트
  await prisma.instance.update({
    where: { id: instance.id },
    data: { status: "STARTING" },
  });

  // RunningLog 생성 (중복 방지)
  const existingLog = await prisma.runningLog.findFirst({
    where: {
      instanceId: instance.id,
      stoppedAt: null,
    },
  });

  if (!existingLog) {
    await prisma.runningLog.create({
      data: {
        instanceId: instance.id,
        startedAt: new Date(),
      },
    });
  }

  revalidatePath("/admin/users");
  revalidatePath("/dashboard");
}

// 관리자 회수: 인스턴스 중지 + 부속 리소스 정리 + DB 삭제 (대시보드에서 사라짐)
export async function reclaimInstance(targetUserId: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("관리자 권한이 필요합니다");
  }

  const instance = await prisma.instance.findUnique({
    where: { userId: targetUserId },
    include: { sshKey: true },
  });
  if (!instance?.instanceId) throw new Error("인스턴스를 찾을 수 없습니다");

  // EC2 인스턴스 중지 (TerminateInstances는 IAM Deny — AWS Console에서 수동 삭제)
  if (instance.status !== "STOPPED" && instance.status !== "TERMINATED") {
    try {
      await ec2.send(
        new StopInstancesCommand({ InstanceIds: [instance.instanceId] })
      );
    } catch (e) {
      console.warn("Instance stop failed:", e);
    }
  }

  // 부속 리소스 정리
  if (instance.alarmName) {
    try {
      await cloudwatch.send(
        new DeleteAlarmsCommand({ AlarmNames: [instance.alarmName] })
      );
    } catch (e) {
      console.warn(`Alarm ${instance.alarmName} 삭제 실패:`, e);
    }
  }

  if (instance.keyPairName) {
    try {
      await ec2.send(
        new DeleteKeyPairCommand({ KeyName: instance.keyPairName })
      );
    } catch (e) {
      console.warn(`KeyPair ${instance.keyPairName} 삭제 실패:`, e);
    }
  }

  if (instance.securityGroupId) {
    try {
      await ec2.send(
        new DeleteSecurityGroupCommand({ GroupId: instance.securityGroupId })
      );
    } catch {
      console.warn(
        `SG ${instance.securityGroupId} 삭제 실패 - 수동 정리 필요`
      );
    }
  }

  // 사용자의 등록된 SSH 허용 IP도 삭제
  await prisma.$executeRawUnsafe(
    `DELETE FROM "SshAllowedIp" WHERE "userId" = $1`,
    targetUserId
  ).catch(() => {});

  // DB에서 삭제 (EC2 인스턴스 자체는 AWS Console에서 수동 종료 필요)
  await prisma.instance.delete({ where: { id: instance.id } });

  revalidatePath("/admin/users");
  revalidatePath("/dashboard");
}

/**
 * AWS와 DB 상태 동기화
 * - DB에는 RUNNING인데 AWS는 stopped → RunningLog 자동 종료
 * - CloudWatch Alarm으로 자동 중지된 경우도 감지
 */
async function syncInstanceState(instanceId: string, awsInstanceId: string) {
  try {
    const { DescribeInstancesCommand } = await import("@aws-sdk/client-ec2");
    const res = await ec2.send(
      new DescribeInstancesCommand({ InstanceIds: [awsInstanceId] })
    );
    const awsState = res.Reservations?.[0]?.Instances?.[0]?.State?.Name;

    if (!awsState) return;

    // AWS가 stopped/stopping인데 DB에 종료되지 않은 RunningLog가 있으면 자동 종료 처리
    if (awsState === "stopped" || awsState === "stopping") {
      const openLog = await prisma.runningLog.findFirst({
        where: {
          instanceId,
          stoppedAt: null,
        },
        orderBy: { startedAt: "desc" },
      });

      if (openLog) {
        await prisma.runningLog.update({
          where: { id: openLog.id },
          data: { stoppedAt: new Date() },
        });
      }
    }
  } catch (error) {
    console.warn("State sync failed (non-critical):", error);
  }
}

export async function getUserInstance() {
  const session = await requireApprovedUser();

  const instance = await prisma.instance.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      instanceId: true,
      instanceType: true,
      status: true,
      publicIp: true,
      privateIp: true,
      keyPairName: true,
      launchedAt: true,
      stoppedAt: true,
      createdAt: true,
    },
  });

  // 상태 동기화 (백그라운드로 실행)
  if (instance?.instanceId) {
    syncInstanceState(instance.id, instance.instanceId).catch(() => {});
  }

  return instance;
}

export async function getSshKey() {
  const session = await requireApprovedUser();

  const instance = await prisma.instance.findUnique({
    where: { userId: session.user.id },
    include: { sshKey: true },
  });

  if (!instance?.sshKey) throw new Error("SSH 키를 찾을 수 없습니다");

  return {
    keyPairName: instance.sshKey.keyPairName,
    privateKey: instance.sshKey.privateKey,
    fingerprint: instance.sshKey.fingerprint,
  };
}

export async function getUserInstanceConfig() {
  const session = await requireApprovedUser();

  const rows = await prisma.$queryRawUnsafe<
    { instanceQuota: number; instanceType: string }[]
  >(
    `SELECT COALESCE(c."instanceQuota", 0) as "instanceQuota",
            COALESCE(c."instanceType", 't3.small') as "instanceType"
     FROM "User" u
     LEFT JOIN "UserInstanceConfig" c ON c."userId" = u.id
     WHERE u.id = $1`,
    session.user.id
  ).catch(() => [] as { instanceQuota: number; instanceType: string }[]);

  return {
    quota: Number(rows[0]?.instanceQuota ?? 0),
    instanceType: rows[0]?.instanceType ?? "t3.small",
  };
}
