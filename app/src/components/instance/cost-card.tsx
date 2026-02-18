"use client";

import { useEffect, useState } from "react";
import { INSTANCE_PRESETS } from "@/lib/instance-types";

type CostData = {
  totalMinutes: number;
  ec2Cost: number;
  ebsCost: number;
  totalCost: number;
  instanceType: string;
  isRunning: boolean;
  daily: { date: string; minutes: number }[];
};

function formatDuration(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  if (hours === 0) return `${mins}분`;
  return `${hours}시간 ${mins}분`;
}

export default function CostCard({ cost }: { cost: CostData | null }) {
  const [elapsedExtra, setElapsedExtra] = useState(0);

  // 실행 중이면 60초마다 경과 시간 갱신
  useEffect(() => {
    if (!cost?.isRunning) {
      setElapsedExtra(0);
      return;
    }
    const interval = setInterval(() => {
      setElapsedExtra((prev) => prev + 1);
    }, 60000);
    return () => clearInterval(interval);
  }, [cost?.isRunning]);

  if (!cost) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="font-semibold text-gray-900">이번 달 비용</h3>
        <p className="mt-4 text-sm text-gray-500">
          인스턴스가 없어 비용 정보를 표시할 수 없습니다.
        </p>
      </div>
    );
  }

  const displayMinutes = cost.totalMinutes + elapsedExtra;
  const preset = INSTANCE_PRESETS[cost.instanceType];
  const extraEc2 = preset ? (elapsedExtra / 60) * preset.hourlyPrice : 0;
  const displayEc2 = Math.round((cost.ec2Cost + extraEc2) * 100) / 100;
  const displayTotal = Math.round((cost.totalCost + extraEc2) * 100) / 100;

  const recentDays = cost.daily.slice(-7);
  const maxMinutes = Math.max(...recentDays.map((d) => d.minutes), 1);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h3 className="font-semibold text-gray-900">이번 달 비용</h3>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        {/* 총 비용 */}
        <div>
          <p className="text-xs text-gray-500">추정 총비용</p>
          <p className="text-2xl font-bold text-gray-900">
            ${displayTotal.toFixed(2)}
          </p>
        </div>

        {/* EC2 비용 */}
        <div>
          <p className="text-xs text-gray-500">EC2 (가동 시간)</p>
          <p className="text-lg font-semibold text-gray-700">
            ${displayEc2.toFixed(2)}
          </p>
        </div>

        {/* EBS 비용 */}
        <div>
          <p className="text-xs text-gray-500">EBS (스토리지)</p>
          <p className="text-lg font-semibold text-gray-700">
            ${cost.ebsCost.toFixed(2)}
          </p>
        </div>
      </div>

      {/* 가동 시간 */}
      <div className="mt-4 rounded-lg bg-blue-50 p-3">
        <p className="text-xs text-blue-600 font-medium">이번 달 가동 시간</p>
        <p className="text-lg font-semibold text-blue-900">
          {formatDuration(displayMinutes)}
        </p>
        {cost.isRunning && (
          <p className="text-xs text-blue-500 flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />
            현재 실행 중
          </p>
        )}
      </div>

      {/* 일별 가동 시간 바 차트 */}
      {recentDays.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium text-gray-500 mb-2">
            최근 일별 가동 시간
          </p>
          <div className="space-y-1">
            {recentDays.map((day) => {
              const widthPercent = (day.minutes / maxMinutes) * 100;
              return (
                <div
                  key={day.date}
                  className="flex items-center gap-2 text-xs"
                >
                  <span className="w-12 text-gray-500 shrink-0">
                    {day.date.slice(5)}
                  </span>
                  <div className="flex-1 h-4 bg-gray-100 rounded overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded"
                      style={{ width: `${widthPercent}%` }}
                    />
                  </div>
                  <span className="w-16 text-right text-gray-700">
                    {formatDuration(day.minutes)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
