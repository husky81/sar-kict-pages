"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { cloudwatch } from "@/lib/aws";
import { PutMetricAlarmCommand } from "@aws-sdk/client-cloudwatch";
import { revalidatePath } from "next/cache";

async function requireApprovedUser() {
  const session = await auth();
  if (!session?.user || session.user.status !== "APPROVED") {
    throw new Error("승인된 사용자만 이용할 수 있습니다");
  }
  return session;
}

export async function getMyAutoStopPolicy() {
  const session = await requireApprovedUser();

  const policy = await prisma.autoStopPolicy.findUnique({
    where: { userId: session.user.id },
  });

  if (!policy) return null;

  return {
    id: policy.id,
    isActive: policy.isActive,
    idleMinutes: policy.idleMinutes,
    checkCpu: policy.checkCpu,
    cpuThreshold: policy.cpuThreshold,
    stopOnWeekends: policy.stopOnWeekends,
    stopAtNight: policy.stopAtNight,
    nightStartHour: policy.nightStartHour,
    nightEndHour: policy.nightEndHour,
  };
}

export async function setAutoStopPolicy(data: {
  isActive: boolean;
  idleMinutes?: number;
  checkCpu?: boolean;
  cpuThreshold?: number;
  stopOnWeekends?: boolean;
  stopAtNight?: boolean;
  nightStartHour?: number;
  nightEndHour?: number;
}) {
  const session = await requireApprovedUser();

  await prisma.autoStopPolicy.upsert({
    where: { userId: session.user.id },
    create: {
      userId: session.user.id,
      isActive: data.isActive,
      idleMinutes: data.idleMinutes ?? 720,
      checkCpu: data.checkCpu ?? true,
      cpuThreshold: data.cpuThreshold ?? 5.0,
      stopOnWeekends: data.stopOnWeekends ?? false,
      stopAtNight: data.stopAtNight ?? false,
      nightStartHour: data.nightStartHour ?? 22,
      nightEndHour: data.nightEndHour ?? 6,
    },
    update: {
      isActive: data.isActive,
      ...(data.idleMinutes !== undefined && { idleMinutes: data.idleMinutes }),
      ...(data.checkCpu !== undefined && { checkCpu: data.checkCpu }),
      ...(data.cpuThreshold !== undefined && { cpuThreshold: data.cpuThreshold }),
      ...(data.stopOnWeekends !== undefined && { stopOnWeekends: data.stopOnWeekends }),
      ...(data.stopAtNight !== undefined && { stopAtNight: data.stopAtNight }),
      ...(data.nightStartHour !== undefined && { nightStartHour: data.nightStartHour }),
      ...(data.nightEndHour !== undefined && { nightEndHour: data.nightEndHour }),
    },
  });

  // CloudWatch 알람을 사용자 설정과 동기화
  await syncCloudWatchAlarm(session.user.id);

  revalidatePath("/settings");
}

/** CloudWatch 알람을 사용자의 AutoStopPolicy와 동기화 */
export async function syncCloudWatchAlarm(userId: string) {
  const policy = await prisma.autoStopPolicy.findUnique({
    where: { userId },
  });

  const instances = await prisma.instance.findMany({
    where: { userId, instanceId: { not: null } },
  });

  if (!instances.length) return;

  const region = process.env.AWS_REGION || "ap-northeast-2";

  for (const instance of instances) {
    if (!instance.alarmName || !instance.instanceId) continue;

    const actionsEnabled = !!policy?.isActive && !!policy?.checkCpu;
    const threshold = policy?.cpuThreshold ?? 5.0;
    const idleMinutes = policy?.idleMinutes ?? 30;
    const evaluationPeriods = Math.max(1, Math.round(idleMinutes / 5));

    try {
      await cloudwatch.send(
        new PutMetricAlarmCommand({
          AlarmName: instance.alarmName,
          AlarmDescription: `Auto-stop when CPU < ${threshold}% for ${idleMinutes}min`,
          Namespace: "AWS/EC2",
          MetricName: "CPUUtilization",
          Dimensions: [{ Name: "InstanceId", Value: instance.instanceId }],
          Statistic: "Average",
          Period: 300,
          EvaluationPeriods: evaluationPeriods,
          Threshold: threshold,
          ComparisonOperator: "LessThanThreshold",
          ActionsEnabled: actionsEnabled,
          AlarmActions: [`arn:aws:automate:${region}:ec2:stop`],
        })
      );
      console.log(`[syncCloudWatchAlarm] Updated alarm ${instance.alarmName}: threshold=${threshold}%, periods=${evaluationPeriods}, enabled=${actionsEnabled}`);
    } catch (err) {
      console.error(`[syncCloudWatchAlarm] Failed to update alarm ${instance.alarmName}:`, err);
    }
  }
}

export async function deactivateAutoStopPolicy() {
  const session = await requireApprovedUser();

  await prisma.autoStopPolicy.updateMany({
    where: { userId: session.user.id },
    data: { isActive: false },
  });

  await syncCloudWatchAlarm(session.user.id);
  revalidatePath("/settings");
}

export async function deleteAutoStopPolicy() {
  const session = await requireApprovedUser();

  await prisma.autoStopPolicy.deleteMany({
    where: { userId: session.user.id },
  });

  revalidatePath("/settings");
}
