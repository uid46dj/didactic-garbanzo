import React, { useEffect, useRef, useState } from "react";
import type { CameraSource } from "../types";
import { detectFacesNormalized, type NormalizedFace } from "../lib/faceApi";
import { cn } from "../utils/cn";

interface GhostFace {
  playerId: number;
  label: string;
  face: NormalizedFace;
  color: string;
}

interface Props {
  camera: CameraSource;
  stream: MediaStream | null | undefined;
  modelsReady: boolean;
  active: boolean;
  intervalMs?: number;
  onRawFaces?: (faces: NormalizedFace[]) => void;
  ghostFaces?: GhostFace[];
  labelForRaw?: (face: NormalizedFace, idx: number) => string | null;
  className?: string;
  children?: React.ReactNode;
}

export default function CameraPanel({
  camera,
  stream,
  modelsReady,
  active,
  intervalMs = 450,
  onRawFaces,
  ghostFaces,
  labelForRaw,
  className,
  children,
}: Props) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [rawFaces, setRawFaces] = useState<NormalizedFace[]>([]);
  const busyRef = useRef(false);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = stream ?? null;
    }
  }, [stream]);

  useEffect(() => {
    if (!active || !stream || !modelsReady) {
      setRawFaces([]);
      return;
    }
    const id = setInterval(async () => {
      if (busyRef.current || !videoRef.current) return;
      busyRef.current = true;
      const faces = await detectFacesNormalized(videoRef.current);
      setRawFaces(faces);
      onRawFaces?.(faces);
      busyRef.current = false;
    }, intervalMs);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, stream, modelsReady, intervalMs]);

  const isLive = !!stream;

  return (
    <div className={cn("relative overflow-hidden rounded-xl bg-slate-950", className)}>
      {isLive ? (
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className="h-full w-full object-cover -scale-x-100"
        />
      ) : (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[radial-gradient(circle_at_center,#1e293b,#0f172a)] text-slate-500">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
            <path d="M15 10l4.55-2.68A1 1 0 0121 8.14v7.72a1 1 0 01-1.45.82L15 14" />
            <rect x="3" y="6" width="12" height="12" rx="2" />
          </svg>
          <span className="text-xs font-medium uppercase tracking-wide">Simulated feed</span>
        </div>
      )}

      {/* raw detection boxes (real camera only) */}
      {isLive &&
        rawFaces.map((f, idx) => {
          const label = labelForRaw?.(f, idx);
          return (
            <div
              key={idx}
              className="pointer-events-none absolute rounded border-2 border-emerald-400/90 shadow-[0_0_0_1px_rgba(0,0,0,0.3)]"
              style={{
                left: `${(1 - f.cx - f.w / 2) * 100}%`,
                top: `${(f.cy - f.h / 2) * 100}%`,
                width: `${f.w * 100}%`,
                height: `${f.h * 100}%`,
              }}
            >
              {label && (
                <span className="absolute -top-5 left-0 whitespace-nowrap rounded bg-emerald-500 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-950">
                  {label}
                </span>
              )}
            </div>
          );
        })}

      {/* simulated ghost boxes */}
      {!isLive &&
        ghostFaces?.map((g) => (
          <div
            key={g.playerId}
            className="pointer-events-none absolute rounded border-2 border-dashed"
            style={{
              borderColor: g.color,
              left: `${(1 - g.face.cx - g.face.w / 2) * 100}%`,
              top: `${(g.face.cy - g.face.h / 2) * 100}%`,
              width: `${g.face.w * 100}%`,
              height: `${g.face.h * 100}%`,
            }}
          >
            <span
              className="absolute -top-5 left-0 whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-semibold text-slate-950"
              style={{ background: g.color }}
            >
              {g.label}
            </span>
          </div>
        ))}

      {!camera.connected && (
        <div className="absolute left-2 top-2 rounded-full bg-amber-500/90 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-950">
          {camera.simulated ? "Simulation" : "Offline"}
        </div>
      )}
      {children}
    </div>
  );
}
