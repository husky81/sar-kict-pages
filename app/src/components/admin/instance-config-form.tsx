"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { updateUserInstanceConfig } from "@/lib/actions/admin";
import { INSTANCE_TYPE_OPTIONS } from "@/lib/instance-types";

export default function InstanceConfigForm({
  userId,
  initialQuota,
  initialType,
  hasActiveInstance,
}: {
  userId: string;
  initialQuota: number;
  initialType: string;
  hasActiveInstance: boolean;
}) {
  const router = useRouter();
  const [quota, setQuota] = useState(initialQuota);
  const [instanceType, setInstanceType] = useState(initialType);
  const [savedQuota, setSavedQuota] = useState(initialQuota);
  const [savedType, setSavedType] = useState(initialType);
  const [isPending, startTransition] = useTransition();
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const hasChanges = quota !== savedQuota || instanceType !== savedType;

  function handleSave() {
    setMessage(null);
    startTransition(async () => {
      try {
        await updateUserInstanceConfig(userId, quota, instanceType);
        setSavedQuota(quota);
        setSavedType(instanceType);
        setMessage({ type: "success", text: "저장됨" });
        router.refresh();
        setTimeout(() => setMessage(null), 2000);
      } catch (e) {
        setMessage({ type: "error", text: e instanceof Error ? e.message : "저장 실패" });
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <select
        value={quota}
        onChange={(e) => setQuota(Number(e.target.value))}
        className="rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900"
      >
        <option value={0}>0 (불가)</option>
        <option value={1}>1 (허용)</option>
      </select>
      <select
        value={instanceType}
        onChange={(e) => setInstanceType(e.target.value)}
        disabled={hasActiveInstance}
        className="rounded border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {INSTANCE_TYPE_OPTIONS.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <button
        onClick={handleSave}
        disabled={isPending || !hasChanges}
        className="rounded-md bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? "..." : "저장"}
      </button>
      {message && (
        <span className={`text-xs ${message.type === "success" ? "text-green-600" : "text-red-600"}`}>
          {message.text}
        </span>
      )}
    </div>
  );
}
