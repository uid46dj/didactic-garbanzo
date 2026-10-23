import type { CameraSource } from "../types";
import CameraPanel from "./CameraPanel";
import type { NormalizedFace } from "../lib/faceApi";

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
  onRawFaces: (faces: NormalizedFace[]) => void;
  ghostFaces: GhostFace[];
  playerNames: Record<number, string>;
}

export default function CameraStatusCard({
  camera,
  stream,
  modelsReady,
  active,
  onRawFaces,
  ghostFaces,
  playerNames,
}: Props) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-bold text-white">{camera.label}</p>
        <span
          className={`h-2.5 w-2.5 rounded-full ${camera.connected ? "bg-emerald-400" : "bg-amber-400"}`}
        />
      </div>
      <CameraPanel
        camera={camera}
        stream={stream}
        modelsReady={modelsReady}
        active={active}
        className="aspect-video w-full"
        onRawFaces={onRawFaces}
        ghostFaces={ghostFaces}
      />
      <p className="mt-2 text-[10px] text-slate-500">
        Covers: {camera.assignedPlayers.map((id) => playerNames[id] ?? `P${id}`).join(", ")}
      </p>
      {camera.error && <p className="text-[10px] text-rose-400">{camera.error}</p>}
    </div>
  );
}
