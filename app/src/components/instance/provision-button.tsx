"use client";

import { useState } from "react";
import { provisionInstance } from "@/lib/actions/ec2";
import { useRouter } from "next/navigation";

export default function ProvisionButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  async function handleProvision() {
    if (!confirm("새 EC2 인스턴스를 생성하시겠습니까?")) return;

    setLoading(true);
    setError(null);

    try {
      await provisionInstance();
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "인스턴스 생성에 실패했습니다"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={handleProvision}
        disabled={loading}
        className="rounded-lg bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
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
            생성 중...
          </span>
        ) : (
          "인스턴스 생성"
        )}
      </button>
      {error && (
        <p className="mt-2 text-sm text-red-600">{error}</p>
      )}
    </div>
  );
}
