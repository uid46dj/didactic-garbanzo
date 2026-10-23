import { useCallback, useEffect, useState } from "react";

export interface VideoInput {
  deviceId: string;
  label: string;
}

export function useMediaDevices() {
  const [devices, setDevices] = useState<VideoInput[]>([]);
  const [permission, setPermission] = useState<"idle" | "granted" | "denied">("idle");

  const refresh = useCallback(async () => {
    try {
      const list = await navigator.mediaDevices.enumerateDevices();
      const vids = list
        .filter((d) => d.kind === "videoinput")
        .map((d, i) => ({ deviceId: d.deviceId, label: d.label || `Video input ${i + 1}` }));
      setDevices(vids);
    } catch {
      setDevices([]);
    }
  }, []);

  const requestPermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((t) => t.stop());
      setPermission("granted");
      await refresh();
      return true;
    } catch {
      setPermission("denied");
      return false;
    }
  }, [refresh]);

  useEffect(() => {
    refresh();
    const handler = () => refresh();
    navigator.mediaDevices?.addEventListener?.("devicechange", handler);
    return () => navigator.mediaDevices?.removeEventListener?.("devicechange", handler);
  }, [refresh]);

  return { devices, permission, requestPermission, refresh };
}
