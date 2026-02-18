"use client";

import { useState, useTransition } from "react";
import { addSshIp, removeSshIp } from "@/lib/actions/ssh-ip";

type AllowedIp = {
  id: string;
  ipAddress: string;
  createdAt: string;
};

const MAX_IPS = 4;

export default function SshIpManager({
  initialIps,
}: {
  initialIps: AllowedIp[];
}) {
  const [ips, setIps] = useState<AllowedIp[]>(initialIps);
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [detectingIp, setDetectingIp] = useState(false);

  const isFull = ips.length >= MAX_IPS;

  async function handleAdd() {
    const ip = input.trim();
    if (!ip) return;

    setError(null);
    startTransition(async () => {
      try {
        await addSshIp(ip);
        setIps((prev) => [
          ...prev,
          { id: Date.now().toString(), ipAddress: ip, createdAt: new Date().toISOString() },
        ]);
        setInput("");
        // Refresh to get actual DB state
        window.location.reload();
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "IP 등록에 실패했습니다");
      }
    });
  }

  async function handleRemove(ipId: string) {
    setError(null);
    setRemovingId(ipId);
    startTransition(async () => {
      try {
        await removeSshIp(ipId);
        setIps((prev) => prev.filter((ip) => ip.id !== ipId));
        setRemovingId(null);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "IP 삭제에 실패했습니다");
        setRemovingId(null);
      }
    });
  }

  async function handleDetectMyIp() {
    setError(null);
    setDetectingIp(true);
    try {
      const res = await fetch("/api/my-ip");
      const data = await res.json();
      if (data.ip && data.ip !== "unknown") {
        setInput(data.ip);
      } else {
        setError("IP를 감지할 수 없습니다");
      }
    } catch {
      setError("IP 감지에 실패했습니다");
    } finally {
      setDetectingIp(false);
    }
  }

  return (
    <div className="mt-4 border-t border-gray-100 pt-4">
      <h4 className="text-sm font-medium text-gray-900">SSH 허용 IP</h4>
      <p className="mt-1 text-xs text-gray-500">
        등록된 IP에서만 SSH 접속이 가능합니다 (최대 {MAX_IPS}개)
      </p>

      {/* Registered IPs list */}
      {ips.length > 0 && (
        <ul className="mt-3 space-y-2">
          {ips.map((ip) => (
            <li
              key={ip.id}
              className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2"
            >
              <span className="font-mono text-sm text-gray-800">
                {ip.ipAddress}
              </span>
              <button
                type="button"
                onClick={() => handleRemove(ip.id)}
                disabled={isPending && removingId === ip.id}
                className="text-xs text-red-500 hover:text-red-700 disabled:opacity-50"
              >
                {isPending && removingId === ip.id ? "삭제 중..." : "삭제"}
              </button>
            </li>
          ))}
        </ul>
      )}

      {ips.length === 0 && (
        <p className="mt-3 text-xs text-amber-600">
          등록된 IP가 없습니다. IP를 등록해야 SSH 접속이 가능합니다.
        </p>
      )}

      {/* Add IP form */}
      {!isFull && (
        <div className="mt-3 space-y-2">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAdd();
                }
              }}
              placeholder="예: 203.0.113.1"
              disabled={isPending}
              className="flex-1 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-mono text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:bg-gray-100"
              style={{ color: "#111827" }}
            />
            <button
              type="button"
              onClick={handleAdd}
              disabled={isPending || !input.trim()}
              className="rounded-md bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {isPending && !removingId ? "등록 중..." : "등록"}
            </button>
          </div>
          <button
            type="button"
            onClick={handleDetectMyIp}
            disabled={detectingIp || isPending}
            className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
          >
            {detectingIp ? "IP 감지 중..." : "현재 내 IP 자동 입력"}
          </button>
        </div>
      )}

      {isFull && (
        <p className="mt-3 text-xs text-gray-500">
          최대 등록 수({MAX_IPS}개)에 도달했습니다. 새 IP를 등록하려면 기존 IP를 삭제하세요.
        </p>
      )}

      {error && (
        <p className="mt-2 text-xs text-red-600">{error}</p>
      )}
    </div>
  );
}
