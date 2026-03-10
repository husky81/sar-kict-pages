"use client";

import { useState } from "react";
import InstanceStatusBadge from "./instance-status-badge";
import { startInstanceById, stopInstanceById, deleteInstanceById } from "@/lib/actions/ec2";

type Instance = {
  id: string;
  name: string;
  instanceId: string;
  status: string;
  publicIp: string | null;
  privateIp: string | null;
  instanceType: string;
  keyPairName: string | null;
  templateName?: string | null;
  launchedAt: string | null;
  stoppedAt: string | null;
  createdAt: string;
};

export default function InstanceGrid({ instances }: { instances: Instance[] }) {
  const [loading, setLoading] = useState<Record<string, boolean>>({});

  const handleAction = async (
    instanceId: string,
    action: "start" | "stop" | "delete"
  ) => {
    if (loading[instanceId]) return;

    if (action === "delete") {
      if (!confirm("⚠️ 인스턴스를 삭제하시겠습니까?\n\n모든 데이터가 삭제됩니다.")) {
        return;
      }
      if (!confirm("정말로 삭제하시겠습니까? (마지막 확인)")) {
        return;
      }
    }

    setLoading({ ...loading, [instanceId]: true });
    try {
      if (action === "start") {
        await startInstanceById(instanceId);
      } else if (action === "stop") {
        await stopInstanceById(instanceId);
      } else if (action === "delete") {
        await deleteInstanceById(instanceId);
      }
      window.location.reload();
    } catch (error) {
      alert(error instanceof Error ? error.message : "작업 실패");
    } finally {
      setLoading({ ...loading, [instanceId]: false });
    }
  };

  if (instances.length === 0) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-8 text-center">
        <p className="text-gray-500">아직 생성된 인스턴스가 없습니다.</p>
        <p className="text-sm text-gray-400 mt-2">
          위에서 템플릿을 선택하여 인스턴스를 생성하세요.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {instances.map((instance) => {
        const isRunning = instance.status === "RUNNING" || instance.status === "STARTING";
        const isStopped = instance.status === "STOPPED" || instance.status === "STOPPING";

        return (
          <div
            key={instance.id}
            className="rounded-xl border border-gray-200 bg-white p-5"
          >
            {/* Header */}
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-900">{instance.name}</h3>
                {instance.templateName && (
                  <p className="text-xs text-gray-500 mt-0.5">
                    {instance.templateName}
                  </p>
                )}
              </div>
              <InstanceStatusBadge status={instance.status} />
            </div>

            {/* Info */}
            <div className="space-y-2 text-sm">
              <div>
                <span className="text-gray-500">타입:</span>
                <span className="ml-2 font-mono text-gray-900">
                  {instance.instanceType}
                </span>
              </div>
              {instance.publicIp && (
                <div>
                  <span className="text-gray-500">Public IP:</span>
                  <span className="ml-2 font-mono text-gray-900 text-xs">
                    {instance.publicIp}
                  </span>
                </div>
              )}
              <div>
                <span className="text-gray-500">Instance ID:</span>
                <span className="ml-2 font-mono text-gray-400 text-xs">
                  {instance.instanceId.slice(0, 12)}...
                </span>
              </div>
            </div>

            {/* SSH Command */}
            {instance.publicIp && isRunning && (
              <div className="mt-3 rounded bg-gray-50 p-2 border border-gray-200">
                <p className="text-xs text-gray-600 mb-1">SSH 접속:</p>
                <p className="font-mono text-xs text-gray-800 break-all">
                  ssh -i {instance.keyPairName}.pem ubuntu@{instance.publicIp}
                </p>
              </div>
            )}

            {/* Actions */}
            <div className="mt-4 flex gap-2">
              {isStopped && (
                <button
                  onClick={() => handleAction(instance.id, "start")}
                  disabled={loading[instance.id]}
                  className="flex-1 rounded-lg bg-green-600 px-3 py-2 text-xs font-medium text-white hover:bg-green-700 disabled:bg-gray-400 transition-colors"
                >
                  {loading[instance.id] ? "..." : "시작"}
                </button>
              )}
              {isRunning && (
                <button
                  onClick={() => handleAction(instance.id, "stop")}
                  disabled={loading[instance.id]}
                  className="flex-1 rounded-lg border border-yellow-400 px-3 py-2 text-xs font-medium text-yellow-700 hover:bg-yellow-50 disabled:opacity-50 transition-colors"
                >
                  {loading[instance.id] ? "..." : "중지"}
                </button>
              )}
              {!isRunning && (
                <button
                  onClick={() => handleAction(instance.id, "delete")}
                  disabled={loading[instance.id]}
                  className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-50 transition-colors"
                >
                  {loading[instance.id] ? "..." : "삭제"}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
