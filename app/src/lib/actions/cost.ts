"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { getPreset } from "@/lib/instance-types";

const TIMEZONE = "Asia/Seoul";

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

/** UTC Date를 KST 기준 날짜 문자열로 변환 (yyyy-mm-dd) */
function getKSTDayKey(date: Date): string {
  return date.toLocaleDateString("sv-SE", { timeZone: TIMEZONE });
}

/** KST 기준으로 다음 날 자정(00:00)을 UTC Date로 반환 */
function getNextKSTMidnight(date: Date): Date {
  const kstDateStr = date.toLocaleString("en-US", { timeZone: TIMEZONE });
  const kstDate = new Date(kstDateStr);

  // 다음 날 자정
  const nextDay = new Date(kstDate);
  nextDay.setDate(nextDay.getDate() + 1);
  nextDay.setHours(0, 0, 0, 0);

  // KST 자정을 UTC로 변환
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });

  const parts = formatter.formatToParts(nextDay);
  const year = parts.find((p) => p.type === "year")!.value;
  const month = parts.find((p) => p.type === "month")!.value;
  const day = parts.find((p) => p.type === "day")!.value;

  // KST 자정을 ISO 문자열로 만들어서 UTC Date로 변환
  const kstMidnight = new Date(`${year}-${month}-${day}T00:00:00+09:00`);
  return kstMidnight;
}

/** KST 기준 이번 달 시작/끝 Date 객체 반환 (UTC) */
function getKSTMonthRange() {
  const now = new Date();
  const kstNowStr = now.toLocaleString("en-US", { timeZone: TIMEZONE });
  const kstNow = new Date(kstNowStr);

  const year = kstNow.getFullYear();
  const month = kstNow.getMonth();

  // KST 기준 이번 달 1일 00:00 -> UTC
  const monthStart = new Date(`${year}-${String(month + 1).padStart(2, "0")}-01T00:00:00+09:00`);

  // KST 기준 다음 달 1일 00:00 -> UTC
  const nextMonth = month === 11 ? 0 : month + 1;
  const nextYear = month === 11 ? year + 1 : year;
  const monthEnd = new Date(`${nextYear}-${String(nextMonth + 1).padStart(2, "0")}-01T00:00:00+09:00`);

  return { now, monthStart, monthEnd };
}

/** 월 경계 겹침을 고려한 가동 시간 계산 (분 단위) - KST 기준 */
function calcOverlapMinutes(
  startedAt: Date,
  stoppedAt: Date | null,
  monthStart: Date,
  monthEnd: Date,
  instanceStatus: string
): number {
  const effectiveStart = startedAt > monthStart ? startedAt : monthStart;

  // stoppedAt이 null이지만 인스턴스가 STOPPED 상태면 현재 시간 사용하지 않음
  let end: Date;
  if (stoppedAt) {
    end = stoppedAt;
  } else if (instanceStatus === "RUNNING") {
    // 실제로 실행 중일 때만 현재 시간 사용
    end = new Date();
  } else {
    // STOPPED인데 stoppedAt이 null이면 계산하지 않음
    return 0;
  }

  const effectiveEnd = end < monthEnd ? end : monthEnd;
  if (effectiveEnd <= effectiveStart) return 0;
  return Math.round((effectiveEnd.getTime() - effectiveStart.getTime()) / 60000);
}

/** 사용자 자신의 인스턴스 비용 조회 (개선됨: 인스턴스 삭제 후에도 비용 추적 가능) */
export async function getMyInstanceCost() {
  const session = await requireApprovedUser();
  const { monthStart, monthEnd } = getKSTMonthRange();

  // RunningLog를 사용자 기준으로 조회 (인스턴스 삭제 후에도 조회 가능)
  const runningLogs = await prisma.runningLog.findMany({
    where: {
      userId: session.user.id,
      startedAt: { gte: monthStart },
    },
    orderBy: { startedAt: "asc" },
  });

  // 현재 인스턴스 정보 (있으면)
  const instance = await prisma.instance.findUnique({
    where: { userId: session.user.id },
    select: {
      instanceType: true,
      status: true,
    },
  });

  // InstanceLifecycle에서 이번 달 인스턴스 정보 조회
  const lifecycles = await prisma.instanceLifecycle.findMany({
    where: {
      userId: session.user.id,
      createdAt: { lte: monthEnd },
      OR: [
        { deletedAt: null }, // 아직 삭제 안됨
        { deletedAt: { gte: monthStart } }, // 이번 달에 삭제됨
      ],
    },
    orderBy: { createdAt: "asc" },
  });

  if (lifecycles.length === 0 && !instance) return null;

  // 인스턴스 타입 결정 (현재 인스턴스 or 가장 최근 lifecycle)
  const instanceType = instance?.instanceType || lifecycles[lifecycles.length - 1]?.instanceType || "t3.small";
  const preset = getPreset(instanceType);

  // EC2 가동 시간 계산
  let totalMinutes = 0;
  const dailyMap = new Map<string, number>();

  for (const log of runningLogs) {
    const minutes = calcOverlapMinutes(
      log.startedAt,
      log.stoppedAt,
      monthStart,
      monthEnd,
      instance?.status || "STOPPED"
    );
    if (minutes <= 0) continue;
    totalMinutes += minutes;

    // 일별 분배 (KST 기준)
    const effectiveStart = log.startedAt > monthStart ? log.startedAt : monthStart;

    let end: Date;
    if (log.stoppedAt) {
      end = log.stoppedAt;
    } else if (instance?.status === "RUNNING") {
      end = new Date();
    } else {
      continue;
    }

    const effectiveEnd = end < monthEnd ? end : monthEnd;
    const cursor = new Date(effectiveStart);

    while (cursor < effectiveEnd) {
      const dayKey = getKSTDayKey(cursor);
      const nextMidnight = getNextKSTMidnight(cursor);

      const segEnd = nextMidnight < effectiveEnd ? nextMidnight : effectiveEnd;
      const segMin = Math.round((segEnd.getTime() - cursor.getTime()) / 60000);

      dailyMap.set(dayKey, (dailyMap.get(dayKey) || 0) + segMin);

      cursor.setTime(nextMidnight.getTime());
    }
  }

  // EBS 비용 일할 계산 (인스턴스가 존재한 일수만큼만 청구)
  let ebsCost = 0;
  for (const lifecycle of lifecycles) {
    const instanceStart = lifecycle.createdAt > monthStart ? lifecycle.createdAt : monthStart;
    const instanceEnd = lifecycle.deletedAt
      ? (lifecycle.deletedAt < monthEnd ? lifecycle.deletedAt : monthEnd)
      : monthEnd;

    if (instanceEnd <= instanceStart) continue;

    const daysInMonth = Math.ceil((monthEnd.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24));
    const daysActive = Math.ceil((instanceEnd.getTime() - instanceStart.getTime()) / (1000 * 60 * 60 * 24));
    const dailyEbsCost = (lifecycle.volumeSize * preset.ebsMonthlyPerGb) / daysInMonth;

    ebsCost += dailyEbsCost * daysActive;
  }

  const ec2Cost = (totalMinutes / 60) * preset.hourlyPrice;

  const daily = Array.from(dailyMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, minutes]) => ({ date, minutes }));

  return {
    totalMinutes,
    ec2Cost: Math.round(ec2Cost * 100) / 100,
    ebsCost: Math.round(ebsCost * 100) / 100,
    totalCost: Math.round((ec2Cost + ebsCost) * 100) / 100,
    instanceType,
    isRunning: instance?.status === "RUNNING",
    daily,
  };
}

/** 관리자용: 전체 사용자 비용 조회 (개선됨: 삭제된 인스턴스 포함) */
export async function getAllUsersCost() {
  await requireAdmin();

  const { monthStart, monthEnd } = getKSTMonthRange();

  // 이번 달 RunningLog가 있는 모든 사용자 조회
  const runningLogs = await prisma.runningLog.findMany({
    where: {
      startedAt: { gte: monthStart },
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
    orderBy: { startedAt: "asc" },
  });

  // 모든 인스턴스 조회 (현재 존재하는 것만)
  const instances = await prisma.instance.findMany({
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  // 이번 달 InstanceLifecycle 조회
  const lifecycles = await prisma.instanceLifecycle.findMany({
    where: {
      createdAt: { lte: monthEnd },
      OR: [
        { deletedAt: null },
        { deletedAt: { gte: monthStart } },
      ],
    },
    include: {
      user: { select: { id: true, name: true, email: true } },
    },
  });

  // 사용자별로 그룹화
  const userMap = new Map<string, {
    userId: string;
    userName: string | null;
    userEmail: string | null;
    instanceId: string | null;
    instanceType: string;
    status: string;
    totalMinutes: number;
    ec2Cost: number;
    ebsCost: number;
  }>();

  // RunningLog 기반 EC2 비용 계산
  for (const log of runningLogs) {
    const userId = log.userId;
    const instance = instances.find((i) => i.userId === userId);

    if (!userMap.has(userId)) {
      const lifecycle = lifecycles.find((l) => l.userId === userId);
      const instanceType = instance?.instanceType || lifecycle?.instanceType || "t3.small";

      userMap.set(userId, {
        userId,
        userName: log.user.name,
        userEmail: log.user.email,
        instanceId: instance?.instanceId || null,
        instanceType,
        status: instance?.status || "DELETED",
        totalMinutes: 0,
        ec2Cost: 0,
        ebsCost: 0,
      });
    }

    const userData = userMap.get(userId)!;
    const minutes = calcOverlapMinutes(
      log.startedAt,
      log.stoppedAt,
      monthStart,
      monthEnd,
      userData.status
    );

    userData.totalMinutes += minutes;
  }

  // EBS 비용 계산 (일할)
  for (const lifecycle of lifecycles) {
    const userId = lifecycle.userId;

    if (!userMap.has(userId)) {
      const instance = instances.find((i) => i.userId === userId);

      userMap.set(userId, {
        userId,
        userName: lifecycle.user.name,
        userEmail: lifecycle.user.email,
        instanceId: instance?.instanceId || lifecycle.awsInstanceId,
        instanceType: lifecycle.instanceType,
        status: instance?.status || "DELETED",
        totalMinutes: 0,
        ec2Cost: 0,
        ebsCost: 0,
      });
    }

    const userData = userMap.get(userId)!;
    const preset = getPreset(lifecycle.instanceType);

    const instanceStart = lifecycle.createdAt > monthStart ? lifecycle.createdAt : monthStart;
    const instanceEnd = lifecycle.deletedAt
      ? (lifecycle.deletedAt < monthEnd ? lifecycle.deletedAt : monthEnd)
      : monthEnd;

    if (instanceEnd > instanceStart) {
      const daysInMonth = Math.ceil((monthEnd.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24));
      const daysActive = Math.ceil((instanceEnd.getTime() - instanceStart.getTime()) / (1000 * 60 * 60 * 24));
      const dailyEbsCost = (lifecycle.volumeSize * preset.ebsMonthlyPerGb) / daysInMonth;

      userData.ebsCost += dailyEbsCost * daysActive;
    }
  }

  // EC2 비용 계산
  let projectTotalEc2 = 0;
  let projectTotalEbs = 0;

  const users = Array.from(userMap.values()).map((userData) => {
    const preset = getPreset(userData.instanceType);
    userData.ec2Cost = (userData.totalMinutes / 60) * preset.hourlyPrice;

    projectTotalEc2 += userData.ec2Cost;
    projectTotalEbs += userData.ebsCost;

    return {
      ...userData,
      ec2Cost: Math.round(userData.ec2Cost * 100) / 100,
      ebsCost: Math.round(userData.ebsCost * 100) / 100,
      totalCost: Math.round((userData.ec2Cost + userData.ebsCost) * 100) / 100,
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
