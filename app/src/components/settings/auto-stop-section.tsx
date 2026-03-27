"use client";

import { useState } from "react";
import { setAutoStopPolicy } from "@/lib/actions/auto-stop";

type AutoStopData = {
  id: string;
  isActive: boolean;
  idleMinutes: number;
  checkCpu: boolean;
  cpuThreshold: number;
  stopOnWeekends: boolean;
  stopAtNight: boolean;
  nightStartHour: number | null;
  nightEndHour: number | null;
} | null;

export default function AutoStopSection({
  initialPolicy,
}: {
  initialPolicy: AutoStopData;
}) {
  const [isActive, setIsActive] = useState(initialPolicy?.isActive ?? false);
  const [idleMinutes, setIdleMinutes] = useState(
    String(initialPolicy?.idleMinutes ?? 720)
  );
  const [checkCpu, setCheckCpu] = useState(initialPolicy?.checkCpu ?? true);
  const [cpuThreshold, setCpuThreshold] = useState(
    String(initialPolicy?.cpuThreshold ?? 5)
  );
  const [stopOnWeekends, setStopOnWeekends] = useState(
    initialPolicy?.stopOnWeekends ?? false
  );
  const [stopAtNight, setStopAtNight] = useState(
    initialPolicy?.stopAtNight ?? false
  );
  const [nightStartHour, setNightStartHour] = useState(
    String(initialPolicy?.nightStartHour ?? 22)
  );
  const [nightEndHour, setNightEndHour] = useState(
    String(initialPolicy?.nightEndHour ?? 6)
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      await setAutoStopPolicy({
        isActive,
        idleMinutes: Number(idleMinutes),
        checkCpu,
        cpuThreshold: Number(cpuThreshold),
        stopOnWeekends,
        stopAtNight,
        nightStartHour: Number(nightStartHour),
        nightEndHour: Number(nightEndHour),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      alert(error instanceof Error ? error.message : "설정 실패");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">자동 종료 정책</h2>
          <p className="mt-1 text-sm text-gray-500">
            인스턴스를 자동으로 중지하여 불필요한 비용을 방지합니다.
          </p>
        </div>
        <button
          onClick={() => setIsActive(!isActive)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            isActive ? "bg-blue-600" : "bg-gray-300"
          }`}
        >
          <span
            className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
              isActive ? "translate-x-6" : "translate-x-1"
            }`}
          />
        </button>
      </div>

      {/* 정책 꺼져있을 때 안내 */}
      {!isActive && (
        <div className="mt-4 rounded-lg bg-amber-50 border border-amber-200 p-4">
          <p className="text-sm text-amber-800">
            자동 종료 정책이 <span className="font-semibold">비활성화</span> 상태입니다. 인스턴스가 실행 중이면 수동으로 종료하지 않는 한 계속 과금됩니다.
          </p>
          <p className="mt-1 text-xs text-amber-600">
            토글을 켜고 저장하면 아래 조건에 따라 인스턴스가 자동으로 중지됩니다.
          </p>
        </div>
      )}

      {isActive && (
        <div className="mt-4 space-y-5">
          {/* 동작 방식 안내 */}
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
            <h3 className="text-sm font-medium text-blue-900">동작 방식</h3>
            <ul className="mt-2 space-y-1 text-xs text-blue-800">
              <li>
                <span className="font-medium">CPU 유휴 감지</span> — AWS CloudWatch 알람이 CPU 사용률을 모니터링합니다. 저장 즉시 알람 설정이 AWS에 반영됩니다.
              </li>
              <li>
                <span className="font-medium">주말/야간 종료</span> — 서버가 매 5분마다 현재 KST 시간을 확인하여, 해당 시간대에 실행 중인 인스턴스를 자동 중지합니다.
              </li>
              <li>
                <span className="font-medium">중지된 인스턴스</span>는 데이터가 보존되며, 대시보드에서 언제든 다시 시작할 수 있습니다. EC2 요금만 멈추고 EBS(디스크) 요금은 유지됩니다.
              </li>
            </ul>
          </div>

          {/* CPU 모니터링 */}
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={checkCpu}
                onChange={(e) => setCheckCpu(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div className="flex-1">
                <label className="text-sm font-medium text-gray-900">
                  CPU 사용률 기반 유휴 감지
                </label>
                <p className="mt-1 text-xs text-gray-500">
                  CPU 사용률이 임계값 이하로 지정 시간 동안 지속되면 인스턴스를 자동 중지합니다. AWS CloudWatch 알람을 사용하며, 저장 시 즉시 반영됩니다.
                </p>

                {!checkCpu && (
                  <p className="mt-2 text-xs text-amber-600">
                    CPU 감지를 끄면 CloudWatch 알람이 비활성화됩니다. 주말/야간 종료만 동작합니다.
                  </p>
                )}

                {checkCpu && (
                  <div className="mt-3 grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        CPU 임계값
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="1"
                          max="100"
                          step="1"
                          value={cpuThreshold}
                          onChange={(e) => setCpuThreshold(e.target.value)}
                          className="w-20 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-500">%</span>
                      </div>
                      <p className="mt-1 text-xs text-gray-400">기본값: 5%</p>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-600 mb-1">
                        유휴 판단 시간
                      </label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min="5"
                          step="5"
                          value={idleMinutes}
                          onChange={(e) => setIdleMinutes(e.target.value)}
                          className="w-20 rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-500">분</span>
                      </div>
                      <p className="mt-1 text-xs text-gray-400">기본값: 720분 (12시간)</p>
                    </div>
                  </div>
                )}

                {checkCpu && (
                  <div className="mt-3 rounded bg-gray-100 px-3 py-2">
                    <p className="text-xs text-gray-700">
                      <span className="font-medium">현재 설정:</span>{" "}
                      CPU 사용률이{" "}
                      <span className="font-semibold text-blue-700">{cpuThreshold}%</span> 미만인 상태가{" "}
                      <span className="font-semibold text-blue-700">
                        {Number(idleMinutes) >= 60
                          ? `${Math.floor(Number(idleMinutes) / 60)}시간${Number(idleMinutes) % 60 > 0 ? ` ${Number(idleMinutes) % 60}분` : ""}`
                          : `${idleMinutes}분`}
                      </span>{" "}
                      동안 지속되면 인스턴스를 자동 중지합니다.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 주말 자동 종료 */}
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={stopOnWeekends}
                onChange={(e) => setStopOnWeekends(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <label className="text-sm font-medium text-gray-900">
                  주말 자동 종료
                </label>
                <p className="mt-1 text-xs text-gray-500">
                  매 5분마다 현재 시간을 확인하여, <span className="font-medium">토요일과 일요일(KST)</span>에 실행 중인 인스턴스를 자동 중지합니다.
                  주말에 인스턴스를 수동으로 시작하더라도 5분 이내에 다시 중지됩니다.
                </p>
              </div>
            </div>
          </div>

          {/* 야간 자동 종료 */}
          <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={stopAtNight}
                onChange={(e) => setStopAtNight(e.target.checked)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <div>
                <label className="text-sm font-medium text-gray-900">
                  야간 자동 종료
                </label>
                <p className="mt-1 text-xs text-gray-500">
                  매 5분마다 현재 시간을 확인하여, 지정한 시간대(KST)에 실행 중인 인스턴스를 자동 중지합니다.
                  자정을 넘기는 시간대도 설정 가능합니다 (예: 22시~06시).
                </p>
                {stopAtNight && (
                  <div className="mt-3">
                    <label className="block text-xs font-medium text-gray-600 mb-2">
                      종료 시간대 (KST)
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        max="23"
                        value={nightStartHour}
                        onChange={(e) => setNightStartHour(e.target.value)}
                        className="w-16 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-center focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-500">시 ~</span>
                      <input
                        type="number"
                        min="0"
                        max="23"
                        value={nightEndHour}
                        onChange={(e) => setNightEndHour(e.target.value)}
                        className="w-16 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-center focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-500">시</span>
                    </div>
                    <p className="mt-2 text-xs text-gray-400">
                      기본값: 22시~06시. 이 시간대에 인스턴스를 수동으로 시작하더라도 5분 이내에 다시 중지됩니다.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 저장 버튼 */}
      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
        >
          {saving ? "저장 중..." : "저장"}
        </button>
        {saved && (
          <span className="text-sm text-green-600 font-medium">
            저장되었습니다
          </span>
        )}
        <p className="text-xs text-gray-400">
          저장해야 변경사항이 적용됩니다
        </p>
      </div>
    </div>
  );
}
