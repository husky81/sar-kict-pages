"use client";

import { useState, useEffect, useCallback } from "react";

export type InstanceData = {
  id: string;
  instanceId: string;
  status: string;
  publicIp: string | null;
  privateIp: string | null;
  instanceType: string;
  keyPairName: string | null;
  launchedAt: string | null;
  stoppedAt: string | null;
};

export function useInstanceStatus(initialData: InstanceData | null) {
  const [instance, setInstance] = useState<InstanceData | null>(initialData);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/instances/status");
      const data = await res.json();
      if (data.instance) {
        setInstance(data.instance);
      }
    } catch (error) {
      console.error("Status poll failed:", error);
    }
  }, []);

  useEffect(() => {
    if (!instance) return;

    const transitionalStates = ["PENDING", "STARTING", "STOPPING"];
    if (!transitionalStates.includes(instance.status)) return;

    const interval = setInterval(refresh, 10000);
    return () => clearInterval(interval);
  }, [instance?.status, refresh]);

  return { instance, setInstance, refresh };
}
