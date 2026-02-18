"use client";

import { useState } from "react";
import { startInstance, stopInstance } from "@/lib/actions/ec2";

export default function StartStopButton({
  status,
  onAction,
}: {
  status: string;
  onAction: () => void;
}) {
  const [loading, setLoading] = useState(false);

  const canStart = status === "STOPPED";
  const canStop = status === "RUNNING";

  async function handleAction() {
    setLoading(true);
    try {
      if (canStart) {
        await startInstance();
      } else if (canStop) {
        await stopInstance();
      }
      onAction();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  if (!canStart && !canStop) return null;

  return (
    <button
      onClick={handleAction}
      disabled={loading}
      className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
        canStart
          ? "bg-green-600 text-white hover:bg-green-700"
          : "bg-red-600 text-white hover:bg-red-700"
      }`}
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <svg
            className="h-4 w-4 animate-spin"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
            />
          </svg>
          {canStart ? "켜는 중..." : "끄는 중..."}
        </span>
      ) : canStart ? (
        "시작"
      ) : (
        "중지"
      )}
    </button>
  );
}
