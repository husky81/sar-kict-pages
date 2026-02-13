"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { ec2, cloudwatch } from "@/lib/aws";
import { revalidatePath } from "next/cache";
import {
  RunInstancesCommand,
  StartInstancesCommand,
  StopInstancesCommand,
  TerminateInstancesCommand,
  CreateKeyPairCommand,
  DeleteKeyPairCommand,
  CreateSecurityGroupCommand,
  AuthorizeSecurityGroupIngressCommand,
  DeleteSecurityGroupCommand,
  DescribeImagesCommand,
} from "@aws-sdk/client-ec2";
import {
  PutMetricAlarmCommand,
  DeleteAlarmsCommand,
} from "@aws-sdk/client-cloudwatch";

async function requireApprovedUser() {
  const session = await auth();
  if (!session?.user || session.user.status !== "APPROVED") {
    throw new Error("승인된 사용자만 이용할 수 있습니다");
  }
  return session;
}

export async function provisionInstance() {
  const session = await requireApprovedUser();
  const userId = session.user.id;

  const existing = await prisma.instance.findUnique({ where: { userId } });
  if (existing) {
    throw new Error("이미 인스턴스가 있습니다");
  }

  const projectName = "sar-kict";
  const userTag = `${projectName}-user-${userId.slice(0, 8)}`;

  try {
    // 1. Security Group 생성
    const sgResult = await ec2.send(
      new CreateSecurityGroupCommand({
        GroupName: `${userTag}-sg`,
        Description: `Security group for user ${session.user.email}`,
        VpcId: process.env.AWS_VPC_ID,
      })
    );
    const sgId = sgResult.GroupId!;

    await ec2.send(
      new AuthorizeSecurityGroupIngressCommand({
        GroupId: sgId,
        IpPermissions: [
          {
            IpProtocol: "tcp",
            FromPort: 22,
            ToPort: 22,
            IpRanges: [{ CidrIp: "0.0.0.0/0", Description: "SSH" }],
          },
        ],
      })
    );

    // 2. Key Pair 생성
    const keyPairName = `${userTag}-key`;
    const keyResult = await ec2.send(
      new CreateKeyPairCommand({
        KeyName: keyPairName,
        KeyType: "rsa",
        KeyFormat: "pem",
      })
    );

    // 3. Ubuntu 24.04 최신 AMI 조회
    const amiResult = await ec2.send(
      new DescribeImagesCommand({
        Owners: ["099720109477"],
        Filters: [
          {
            Name: "name",
            Values: [
              "ubuntu/images/hvm-ssd-gp3/ubuntu-noble-24.04-amd64-server-*",
            ],
          },
          { Name: "virtualization-type", Values: ["hvm"] },
          { Name: "state", Values: ["available"] },
        ],
      })
    );
    const latestAmi = amiResult.Images!.sort((a, b) =>
      (b.CreationDate || "").localeCompare(a.CreationDate || "")
    )[0];

    // 4. EC2 인스턴스 실행
    const runResult = await ec2.send(
      new RunInstancesCommand({
        ImageId: latestAmi.ImageId,
        InstanceType: "t3.small",
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
                Value: `${projectName}-user-${session.user.email}`,
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
            Ebs: { VolumeSize: 30, VolumeType: "gp3", Encrypted: true },
          },
        ],
      })
    );

    const awsInstanceId = runResult.Instances![0].InstanceId!;
    const privateIp = runResult.Instances![0].PrivateIpAddress;

    // 5. CloudWatch 자동 중지 알람 생성
    const region = process.env.AWS_REGION || "ap-northeast-2";
    const alarmName = `${userTag}-auto-stop`;
    await cloudwatch.send(
      new PutMetricAlarmCommand({
        AlarmName: alarmName,
        AlarmDescription: `Auto-stop for user ${session.user.email} when CPU < 5% for 30min`,
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

    // 6. DB 저장
    const instance = await prisma.instance.create({
      data: {
        userId,
        instanceId: awsInstanceId,
        instanceType: "t3.small",
        status: "PENDING",
        privateIp,
        securityGroupId: sgId,
        keyPairName,
        amiId: latestAmi.ImageId,
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

    revalidatePath("/dashboard");
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

  await ec2.send(
    new StartInstancesCommand({ InstanceIds: [instance.instanceId] })
  );

  await prisma.instance.update({
    where: { id: instance.id },
    data: { status: "STARTING" },
  });

  revalidatePath("/dashboard");
}

export async function stopInstance() {
  const session = await requireApprovedUser();

  const instance = await prisma.instance.findUnique({
    where: { userId: session.user.id },
  });
  if (!instance?.instanceId) throw new Error("인스턴스를 찾을 수 없습니다");

  await ec2.send(
    new StopInstancesCommand({ InstanceIds: [instance.instanceId] })
  );

  await prisma.instance.update({
    where: { id: instance.id },
    data: { status: "STOPPING" },
  });

  revalidatePath("/dashboard");
}

export async function terminateInstance(targetUserId: string) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("관리자 권한이 필요합니다");
  }

  const instance = await prisma.instance.findUnique({
    where: { userId: targetUserId },
    include: { sshKey: true },
  });
  if (!instance?.instanceId) throw new Error("인스턴스를 찾을 수 없습니다");

  await ec2.send(
    new TerminateInstancesCommand({ InstanceIds: [instance.instanceId] })
  );

  if (instance.alarmName) {
    await cloudwatch.send(
      new DeleteAlarmsCommand({ AlarmNames: [instance.alarmName] })
    );
  }

  if (instance.keyPairName) {
    await ec2.send(
      new DeleteKeyPairCommand({ KeyName: instance.keyPairName })
    );
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

  await prisma.instance.delete({ where: { id: instance.id } });

  revalidatePath("/admin/users");
  revalidatePath("/dashboard");
}

export async function getUserInstance() {
  const session = await requireApprovedUser();

  return prisma.instance.findUnique({
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
