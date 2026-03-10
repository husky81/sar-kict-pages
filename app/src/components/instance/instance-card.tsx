"use client";

import { useState } from "react";
import InstanceStatusBadge from "./instance-status-badge";
import StartStopButton from "./start-stop-button";
import SshKeyDownload from "./ssh-key-download";
import SshIpManager from "./ssh-ip-manager";
import { useInstanceStatus, type InstanceData } from "./instance-polling";
import { INSTANCE_PRESETS } from "@/lib/instance-types";
import { createMyInstance, deleteMyInstance } from "@/lib/actions/ec2";

type AllowedIp = {
  id: string;
  ipAddress: string;
  createdAt: string;
};

export default function InstanceCard({
  initialInstance,
  quota,
  assignedType,
  allowedIps,
}: {
  initialInstance: InstanceData | null;
  quota: number;
  assignedType: string;
  allowedIps: AllowedIp[];
}) {
  const { instance, refresh } = useInstanceStatus(initialInstance);
  const preset = INSTANCE_PRESETS[assignedType];
  const [copied, setCopied] = useState(false);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleCopySSH = () => {
    if (!instance?.publicIp || !instance?.keyPairName) return;

    const sshCommand = `ssh -i ${instance.keyPairName}.pem ubuntu@${instance.publicIp}`;
    navigator.clipboard.writeText(sshCommand).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleCreateInstance = async () => {
    if (!confirm("인스턴스를 생성하시겠습니까?\n\n생성 후 서버가 시작되면 비용이 발생합니다.")) {
      return;
    }

    setCreating(true);
    try {
      await createMyInstance();
      refresh();
      alert("인스턴스 생성을 시작했습니다. 잠시 후 새로고침하세요.");
    } catch (error) {
      alert(error instanceof Error ? error.message : "인스턴스 생성 실패");
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteInstance = async () => {
    if (!confirm("⚠️ 경고: 인스턴스를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없으며, 저장된 모든 데이터가 삭제됩니다.")) {
      return;
    }

    if (!confirm("정말로 삭제하시겠습니까?\n\n마지막 확인입니다.")) {
      return;
    }

    setDeleting(true);
    try {
      await deleteMyInstance();
      refresh();
      alert("인스턴스가 삭제되었습니다.");
    } catch (error) {
      alert(error instanceof Error ? error.message : "인스턴스 삭제 실패");
    } finally {
      setDeleting(false);
    }
  };

  if (!instance) {
    if (quota < 1) {
      return (
        <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
          <h3 className="text-lg font-semibold text-gray-900">
            클라우드 인스턴스
          </h3>
          <p className="mt-4 text-sm text-gray-500">
            인스턴스 생성 권한이 없습니다. 관리자에게 문의하세요.
          </p>
        </div>
      );
    }

    return (
      <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
        <h3 className="text-lg font-semibold text-gray-900">
          클라우드 인스턴스
        </h3>
        <p className="mt-2 text-sm text-gray-500">
          아직 인스턴스가 없습니다. 아래 버튼을 클릭하여 인스턴스를 생성하세요.
        </p>
        {preset && (
          <div className="mt-4 rounded-lg bg-blue-50 border border-blue-200 p-3">
            <p className="text-xs font-semibold text-blue-900">할당된 서버 정보</p>
            <div className="mt-2 space-y-1 text-xs text-blue-800">
              <p>• 타입: {preset.label} ({assignedType})</p>
              <p>• 스토리지: {preset.volumeSize}GB</p>
              <p>• 시간당: ${preset.hourlyPrice.toFixed(4)}</p>
            </div>
          </div>
        )}
        <div className="mt-4">
          <button
            onClick={handleCreateInstance}
            disabled={creating}
            className="w-full rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {creating ? "생성 중..." : "🚀 인스턴스 생성"}
          </button>
          <p className="mt-2 text-xs text-gray-500 text-center">
            💡 생성 후 서버 시작 시 비용이 발생합니다
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          클라우드 인스턴스
        </h3>
        <InstanceStatusBadge status={instance.status} />
      </div>

      <div className="mt-4 space-y-3">
        <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2 sm:gap-4">
          <div>
            <span className="text-gray-500">인스턴스 ID</span>
            <p className="font-mono text-gray-900 text-xs sm:text-sm break-all">
              {instance.instanceId}
            </p>
          </div>
          <div>
            <span className="text-gray-500">타입</span>
            <p className="text-gray-900">{instance.instanceType}</p>
          </div>
          <div>
            <span className="text-gray-500">SSH User</span>
            <p className="font-mono text-gray-900">ubuntu</p>
          </div>
          {instance.publicIp && (
            <div>
              <span className="text-gray-500">Public IP</span>
              <p className="font-mono text-gray-900">{instance.publicIp}</p>
            </div>
          )}
          {instance.privateIp && (
            <div>
              <span className="text-gray-400">Private IP</span>
              <p className="font-mono text-gray-400">{instance.privateIp}</p>
            </div>
          )}
        </div>

        {instance.publicIp && instance.status === "RUNNING" && (
          <div className="rounded-lg bg-gray-50 p-3 border border-gray-200">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-gray-600">SSH 접속 명령</span>
              <button
                onClick={handleCopySSH}
                className="text-xs px-2 py-1 rounded bg-white border border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-colors flex items-center gap-1"
                title="클립보드에 복사"
              >
                {copied ? (
                  <>
                    <span className="text-green-600">✓</span>
                    <span className="text-green-600">복사됨</span>
                  </>
                ) : (
                  <>
                    <span>📋</span>
                    <span className="text-gray-700">복사</span>
                  </>
                )}
              </button>
            </div>
            <p className="font-mono text-xs text-gray-800 break-all bg-white px-2 py-1.5 rounded border border-gray-200">
              ssh -i {instance.keyPairName}.pem ubuntu@{instance.publicIp}
            </p>
            <p className="mt-2 text-[10px] text-gray-500">
              💡 JupyterLab: <span className="font-mono">http://{instance.publicIp}:8888</span>
            </p>
          </div>
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <StartStopButton status={instance.status} onAction={refresh} />
        <SshKeyDownload />
        <button
          onClick={handleDeleteInstance}
          disabled={deleting || instance.status === "RUNNING" || instance.status === "STARTING"}
          className="rounded-lg border-2 border-red-300 bg-red-50 px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-100 hover:border-red-400 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title={instance.status === "RUNNING" || instance.status === "STARTING" ? "서버를 먼저 중지해주세요" : "인스턴스 삭제"}
        >
          {deleting ? "삭제 중..." : "🗑️ 인스턴스 삭제"}
        </button>
      </div>

      {(instance.status === "RUNNING" || instance.status === "STARTING") && (
        <div className="mt-3 rounded-lg bg-yellow-50 border border-yellow-200 p-3">
          <p className="text-xs text-yellow-800">
            ⚠️ 인스턴스를 삭제하려면 먼저 서버를 중지해주세요.
          </p>
        </div>
      )}

      <SshIpManager initialIps={allowedIps} />
    </div>
  );
}
