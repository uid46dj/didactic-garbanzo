import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { useGame } from "./GameContext";
import type { CameraId } from "../types";

type StreamMap = Partial<Record<CameraId, MediaStream | null>>;

const CameraStreamsContext = createContext<StreamMap>({});

export function useCameraStreams() {
  return useContext(CameraStreamsContext);
}

export function CameraStreamsProvider({ children }: { children: React.ReactNode }) {
  const { state, dispatch } = useGame();
  const [streams, setStreams] = useState<StreamMap>({});
  const activeStreams = useRef<StreamMap>({});

  useEffect(() => {
    let cancelled = false;

    state.cameras.forEach(async (cam) => {
      const current = activeStreams.current[cam.id];

      if (!cam.deviceId) {
        if (current) {
          current.getTracks().forEach((t) => t.stop());
          activeStreams.current[cam.id] = null;
          setStreams((s) => ({ ...s, [cam.id]: null }));
        }
        return;
      }

      // already bound to this exact device
      if (current && current.getVideoTracks()[0]?.getSettings().deviceId === cam.deviceId) {
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { deviceId: { exact: cam.deviceId } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        if (current) current.getTracks().forEach((t) => t.stop());
        activeStreams.current[cam.id] = stream;
        setStreams((s) => ({ ...s, [cam.id]: stream }));
        dispatch({
          type: "SET_CAMERA_STATUS",
          cameraId: cam.id,
          patch: { connected: true, simulated: false, error: null },
        });
        stream.getVideoTracks()[0]?.addEventListener("ended", () => {
          dispatch({
            type: "SET_CAMERA_STATUS",
            cameraId: cam.id,
            patch: { connected: false, simulated: true, error: "Device disconnected" },
          });
        });
      } catch (err) {
        if (cancelled) return;
        dispatch({
          type: "SET_CAMERA_STATUS",
          cameraId: cam.id,
          patch: {
            connected: false,
            simulated: true,
            error: err instanceof Error ? err.message : "Unable to open camera",
          },
        });
      }
    });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.cameras.map((c) => c.deviceId).join(",")]);

  useEffect(() => {
    const snapshot = activeStreams.current;
    return () => {
      Object.values(snapshot).forEach((s) => s?.getTracks().forEach((t) => t.stop()));
    };
  }, []);

  return (
    <CameraStreamsContext.Provider value={streams}>{children}</CameraStreamsContext.Provider>
  );
}
