"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getPreset } from "@/lib/instance-types";

async function requireApprovedUser() {
  const session = await auth();
  if (!session?.user || session.user.status !== "APPROVED") {
    throw new Error("승인된 사용자만 이용할 수 있습니다");
  }
  return session;
}

async function requireAdmin() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    throw new Error("관리자 권한이 필요합니다");
  }
  return session;
}

/** 월 경계 겹침을 고려한 가동 시간 계산 (분 단위) */
function calcOverlapMinutes(
  startedAt: Date,
  stoppedAt: Date | null,
  monthStart: Date,
  monthEnd: Date
): number {
  const effectiveStart = startedAt > monthStart ? startedAt : monthStart;
  const end = stoppedAt ?? new Date();
  const effectiveEnd = end < monthEnd ? end : monthEnd;
  if (effectiveEnd <= effectiveStart) return 0;
  return Math.round((effectiveEnd.getTime() - effectiveStart.getTime()) / 60000);
}

/** 이번 달 시작/끝 Date 객체 반환 */
function getMonthRange() {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { now, monthStart, monthEnd };
}

/** 사용자 자신의 인스턴스 비용 조회 */
export async function getMyInstanceCost() {
  const session = await requireApprovedUser();

  const instance = await prisma.instance.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      instanceType: true,
      status: true,
      createdAt: true,
      runningLogs: {
        orderBy: { startedAt: "asc" },
      },
    },
  });

  if (!instance) return null;

  const preset = getPreset(instance.instanceType);
  const { monthStart, monthEnd } = getMonthRange();

  // 이번 달 가동 시간 계산 (월 경계 겹침 고려)
  let totalMinutes = 0;
  const dailyMap = new Map<string, number>();

  for (const log of instance.runningLogs) {
    const minutes = calcOverlapMinutes(log.startedAt, log.stoppedAt, monthStart, monthEnd);
    if (minutes <= 0) continue;
    totalMinutes += minutes;

    // 일별 분배
    const effectiveStart = log.startedAt > monthStart ? log.startedAt : monthStart;
    const end = log.stoppedAt ?? new Date();
    const effectiveEnd = end < monthEnd ? end : monthEnd;
    const cursor = new Date(effectiveStart);
    while (cursor < effectiveEnd) {
      const dayKey = cursor.toISOString().slice(0, 10);
      const dayEnd = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() + 1);
      const segEnd = dayEnd < effectiveEnd ? dayEnd : effectiveEnd;
      const segMin = Math.round((segEnd.getTime() - cursor.getTime()) / 60000);
      dailyMap.set(dayKey, (dailyMap.get(dayKey) || 0) + segMin);
      cursor.setTime(dayEnd.getTime());
    }
  }

  const ec2Cost = (totalMinutes / 60) * preset.hourlyPrice;
  const ebsCost = preset.volumeSize * preset.ebsMonthlyPerGb;

  const daily = Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, minutes]) => ({ date, minutes }));

  return {
    totalMinutes,
    ec2Cost: Math.round(ec2Cost * 100) / 100,
    ebsCost: Math.round(ebsCost * 100) / 100,
    totalCost: Math.round((ec2Cost + ebsCost) * 100) / 100,
    instanceType: instance.instanceType,
    isRunning: instance.status === "RUNNING",
    daily,
  };
}

/** 관리자용: 전체 사용자 비용 조회 */
export async function getAllUsersCost() {
  await requireAdmin();

  const instances = await prisma.instance.findMany({
    include: {
      user: { select: { id: true, name: true, email: true } },
      runningLogs: { orderBy: { startedAt: "asc" } },
    },
  });

  const { monthStart, monthEnd } = getMonthRange();

  let projectTotalEc2 = 0;
  let projectTotalEbs = 0;

  const users = instances.map((instance) => {
    const preset = getPreset(instance.instanceType);

    let totalMinutes = 0;
    for (const log of instance.runningLogs) {
      totalMinutes += calcOverlapMinutes(log.startedAt, log.stoppedAt, monthStart, monthEnd);
    }

    const ec2Cost = (totalMinutes / 60) * preset.hourlyPrice;
    const ebsCost = preset.volumeSize * preset.ebsMonthlyPerGb;
    projectTotalEc2 += ec2Cost;
    projectTotalEbs += ebsCost;

    return {
      userId: instance.user.id,
      userName: instance.user.name,
      userEmail: instance.user.email,
      instanceId: instance.instanceId,
      instanceType: instance.instanceType,
      status: instance.status,
      totalMinutes,
      ec2Cost: Math.round(ec2Cost * 100) / 100,
      ebsCost: Math.round(ebsCost * 100) / 100,
      totalCost: Math.round((ec2Cost + ebsCost) * 100) / 100,
    };
  });

  users.sort((a, b) => b.totalCost - a.totalCost);

  return {
    users,
    projectTotal: {
      ec2: Math.round(projectTotalEc2 * 100) / 100,
      ebs: Math.round(projectTotalEbs * 100) / 100,
      total: Math.round((projectTotalEc2 + projectTotalEbs) * 100) / 100,
    },
    activeCount: instances.filter((i) => i.status === "RUNNING").length,
    totalCount: instances.length,
  };
}
