"use client";

import InstanceStatusBadge from "./instance-status-badge";
import StartStopButton from "./start-stop-button";
import SshKeyDownload from "./ssh-key-download";
import ProvisionButton from "./provision-button";
import { useInstanceStatus, type InstanceData } from "./instance-polling";

export default function InstanceCard({
  initialInstance,
}: {
  initialInstance: InstanceData | null;
}) {
  const { instance, refresh } = useInstanceStatus(initialInstance);

  if (!instance) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-6">
        <h3 className="text-lg font-semibold text-gray-900">
          클라우드 인스턴스
        </h3>
        <p className="mt-2 text-sm text-gray-500">
          아직 인스턴스가 없습니다. 새 인스턴스를 생성하여 클라우드 환경을
          시작하세요.
        </p>
        <div className="mt-4">
          <ProvisionButton />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          클라우드 인스턴스
        </h3>
        <InstanceStatusBadge status={instance.status} />
      </div>

      <div className="mt-4 space-y-3">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500">인스턴스 ID</span>
            <p className="font-mono text-gray-900">
              {instance.instanceId}
            </p>
          </div>
          <div>
            <span className="text-gray-500">타입</span>
            <p className="text-gray-900">{instance.instanceType}</p>
          </div>
          {instance.publicIp && (
            <div>
              <span className="text-gray-500">Public IP</span>
              <p className="font-mono text-gray-900">{instance.publicIp}</p>
            </div>
          )}
          {instance.privateIp && (
            <div>
              <span className="text-gray-500">Private IP</span>
              <p className="font-mono text-gray-900">{instance.privateIp}</p>
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

      <div className="mt-5 flex items-center gap-3">
        <StartStopButton status={instance.status} onAction={refresh} />
        <SshKeyDownload />
      </div>
    </div>
  );
}
