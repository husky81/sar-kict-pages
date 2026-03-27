"use client";

import { useState } from "react";
import { setCostLimit, deactivateCostLimit } from "@/lib/actions/cost-limit";

type CostLimitData = {
  id: string;
  limitType: string;
  limitAmount: number;
  notifyAt: number | null;
  lastNotifiedAt: string | null;
  createdAt: string;
};

export default function CostLimitSection({
  initialLimits,
}: {
  initialLimits: CostLimitData[];
}) {
  const [limits, setLimits] = useState(initialLimits);
  const [showForm, setShowForm] = useState(false);
  const [limitType, setLimitType] = useState<"DAILY" | "MONTHLY">("MONTHLY");
  const [limitAmount, setLimitAmount] = useState("");
  const [notifyAt, setNotifyAt] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async () => {
    if (!limitAmount || Number(limitAmount) <= 0) {
      alert("금액을 입력하세요.");
      return;
    }
    setSaving(true);
    try {
      await setCostLimit({
        limitType,
        limitAmount: Number(limitAmount),
        notifyAt: notifyAt ? Number(notifyAt) : undefined,
      });
      window.location.reload();
    } catch (error) {
      alert(error instanceof Error ? error.message : "설정 실패");
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (id: string) => {
    try {
      await deactivateCostLimit(id);
      setLimits(limits.filter((l) => l.id !== id));
    } catch (error) {
      alert(error instanceof Error ? error.message : "비활성화 실패");
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">비용 한도</h2>
          <p className="mt-1 text-sm text-gray-500">
            매 30분마다 비용을 확인하여, 한도 초과 시 실행 중인 인스턴스를 자동 중지합니다.
          </p>
        </div>
        {!showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
          >
            한도 추가
          </button>
        )}
      </div>

      {/* 기존 한도 목록 */}
      {limits.length > 0 && (
        <div className="mt-4 space-y-3">
          {limits.map((limit) => (
            <div
              key={limit.id}
              className="flex items-center justify-between rounded-lg border border-gray-100 bg-gray-50 p-4"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                    {limit.limitType === "DAILY" ? "일별" : "월별"}
                  </span>
                  <span className="font-semibold text-gray-900">
                    ${limit.limitAmount.toFixed(2)}
                  </span>
                </div>
                {limit.notifyAt && (
                  <p className="mt-1 text-xs text-gray-500">
                    ${limit.notifyAt.toFixed(2)} 초과 시 대시보드에 경고 표시
                  </p>
                )}
              </div>
              <button
                onClick={() => handleDeactivate(limit.id)}
                className="rounded-md border border-gray-300 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 transition-colors"
              >
                삭제
              </button>
            </div>
          ))}
        </div>
      )}

      {limits.length === 0 && !showForm && (
        <p className="mt-4 text-sm text-gray-400">설정된 비용 한도가 없습니다.</p>
      )}

      {/* 새 한도 추가 폼 */}
      {showForm && (
        <div className="mt-4 rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              한도 유형
            </label>
            <div className="flex gap-3">
              <button
                onClick={() => setLimitType("MONTHLY")}
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                  limitType === "MONTHLY"
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
              >
                월별
              </button>
              <button
                onClick={() => setLimitType("DAILY")}
                className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                  limitType === "DAILY"
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
              >
                일별
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              한도 금액 (USD)
            </label>
            <p className="text-xs text-gray-500 mb-2">
              이 금액 초과 시 실행 중인 인스턴스를 자동 중지합니다.
            </p>
            <input
              type="number"
              step="0.01"
              min="0"
              value={limitAmount}
              onChange={(e) => setLimitAmount(e.target.value)}
              placeholder="예: 50.00"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              알림 기준 금액 (USD, 선택)
            </label>
            <p className="text-xs text-gray-500 mb-2">
              이 금액 초과 시 대시보드에 경고가 표시됩니다.
            </p>
            <input
              type="number"
              step="0.01"
              min="0"
              value={notifyAt}
              onChange={(e) => setNotifyAt(e.target.value)}
              placeholder="예: 40.00"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
            >
              {saving ? "저장 중..." : "저장"}
            </button>
            <button
              onClick={() => setShowForm(false)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              취소
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
