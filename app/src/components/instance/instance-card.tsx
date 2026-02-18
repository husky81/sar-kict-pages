"use client";

import InstanceStatusBadge from "./instance-status-badge";
import StartStopButton from "./start-stop-button";
import SshKeyDownload from "./ssh-key-download";
import SshIpManager from "./ssh-ip-manager";
import { useInstanceStatus, type InstanceData } from "./instance-polling";
import { INSTANCE_PRESETS } from "@/lib/instance-types";

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
          아직 인스턴스가 없습니다. 관리자에게 인스턴스 생성을 요청하세요.
        </p>
        {preset && (
          <p className="mt-2 text-xs text-gray-400">
            할당된 타입: {preset.label} ({assignedType}) / {preset.volumeSize}GB
          </p>
        )}
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
          <div className="rounded-lg bg-gray-50 p-3">
            <span className="text-xs text-gray-500">SSH 접속 명령</span>
            <p className="mt-1 font-mono text-xs text-gray-800 break-all">
              ssh -i {instance.keyPairName}.pem ubuntu@{instance.publicIp}
            </p>
          </div>
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <StartStopButton status={instance.status} onAction={refresh} />
        <SshKeyDownload />
      </div>

      <SshIpManager initialIps={allowedIps} />
    </div>
  );
}
