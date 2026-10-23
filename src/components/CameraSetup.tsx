import { useGame } from "../context/GameContext";
import { useCameraStreams } from "../context/CameraStreamsContext";
import { useMediaDevices } from "../hooks/useMediaDevices";
import CameraPanel from "./CameraPanel";
import type { CameraId } from "../types";
import StepHeader from "./StepHeader";

const CAMERA_HINTS: Record<CameraId, string> = {
  cam1: "Plug in your USB webcam. It should appear in the dropdown once permission is granted.",
  cam2: "Connect the first Android phone via ADB / scrcpy virtual webcam, then select it below.",
  cam3: "Connect the second Android phone via ADB / scrcpy virtual webcam, then select it below.",
};

export default function CameraSetup() {
  const { state, dispatch } = useGame();
  const streams = useCameraStreams();
  const { devices, permission, requestPermission } = useMediaDevices();

  const assignedCount = state.cameras.reduce((n, c) => n + c.assignedPlayers.length, 0);
  const everyCameraHasPlayer = state.cameras.every((c) => c.assignedPlayers.length > 0);
  const canContinue = assignedCount === 6 && everyCameraHasPlayer;

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <StepHeader
        step={2}
        total={4}
        title="Camera Setup"
        subtitle="Bind exactly 3 camera sources and assign players/seats to each."
      />

      {permission !== "granted" && (
        <div className="mb-6 flex items-center justify-between rounded-xl border border-amber-500/30 bg-amber-500/10 px-5 py-4">
          <p className="text-sm text-amber-200">
            Grant camera access to list real devices (USB webcam + any ADB-exposed Android
            cameras). Without access, all 3 slots run in simulation mode so you can still rehearse
            the full game.
          </p>
          <button
            onClick={requestPermission}
            className="ml-4 shrink-0 rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold uppercase text-amber-950"
          >
            Grant Access
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {state.cameras.map((cam) => (
          <div key={cam.id} className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-white">{cam.label}</p>
                <p className="text-[11px] text-slate-500">{CAMERA_HINTS[cam.id]}</p>
              </div>
              <span
                className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                  cam.connected ? "bg-emerald-400" : "bg-slate-600"
                }`}
              />
            </div>

            <CameraPanel
              camera={cam}
              stream={streams[cam.id]}
              modelsReady={false}
              active={false}
              className="mb-3 aspect-video w-full"
            />

            <select
              value={cam.deviceId ?? ""}
              onChange={(e) =>
                dispatch({
                  type: "SET_CAMERA_DEVICE",
                  cameraId: cam.id,
                  deviceId: e.target.value || null,
                })
              }
              className="mb-3 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-xs text-slate-200"
            >
              <option value="">Simulated (no device)</option>
              {devices.map((d) => (
                <option key={d.deviceId} value={d.deviceId}>
                  {d.label}
                </option>
              ))}
            </select>

            {cam.error && <p className="mb-2 text-[11px] text-rose-400">{cam.error}</p>}

            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
              Assigned players
            </p>
            <div className="flex flex-wrap gap-2">
              {state.players.map((p) => (
                <button
                  key={p.id}
                  onClick={() => dispatch({ type: "REASSIGN_PLAYER", playerId: p.id, cameraId: cam.id })}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                    p.cameraId === cam.id
                      ? "bg-indigo-500 text-white"
                      : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                  }`}
                >
                  P{p.id}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
        <p className="mb-3 text-sm font-semibold text-white">Player names &amp; seats</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {state.players.map((p) => (
            <div key={p.id} className="rounded-lg border border-slate-800 bg-slate-950/50 p-3">
              <p className="text-[11px] text-slate-500">
                {p.seat} · Cam {p.cameraId?.replace("cam", "")}
              </p>
              <input
                value={p.name}
                onChange={(e) =>
                  dispatch({ type: "RENAME_PLAYER", playerId: p.id, name: e.target.value })
                }
                className="mt-1 w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-white"
              />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 flex items-center justify-between">
        <p className="text-xs text-slate-500">
          {assignedCount}/6 players assigned · every camera needs at least one player
        </p>
        <button
          disabled={!canContinue}
          onClick={() => dispatch({ type: "GOTO_STEP", step: "calibration" })}
          className="rounded-xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-6 py-3 text-sm font-bold uppercase tracking-wide text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-30"
        >
          Continue to Calibration
        </button>
      </div>
    </div>
  );
}
