import { useMemo, useState } from "react";
import { useGame } from "../context/GameContext";
import { useCameraStreams } from "../context/CameraStreamsContext";
import { useFaceModels } from "../hooks/useFaceModels";
import CameraPanel from "./CameraPanel";
import StepHeader from "./StepHeader";
import { colorForPlayer } from "../lib/playerColors";
import type { NormalizedFace } from "../lib/faceApi";

export default function Calibration() {
  const { state, dispatch } = useGame();
  const streams = useCameraStreams();
  const { ready: modelsReady, loading: modelsLoading } = useFaceModels();
  const [activePlayerId, setActivePlayerId] = useState<number>(
    state.players.find((p) => !p.calibrated)?.id ?? state.players[0].id
  );
  const [rawFacesByCam, setRawFacesByCam] = useState<Record<string, NormalizedFace[]>>({});

  const activePlayer = state.players.find((p) => p.id === activePlayerId)!;
  const activeCamera = state.cameras.find((c) => c.id === activePlayer.cameraId)!;
  const activeStream = streams[activeCamera.id];
  const isSimulated = !activeStream;

  const bestFace = useMemo(() => {
    const faces = rawFacesByCam[activeCamera.id] ?? [];
    if (faces.length === 0) return null;
    return faces.reduce((a, b) => (b.score > a.score ? b : a));
  }, [rawFacesByCam, activeCamera.id]);

  const allCalibrated = state.players.every((p) => p.calibrated);
  const calibratedCount = state.players.filter((p) => p.calibrated).length;

  function capture() {
    if (isSimulated) {
      // seat-based synthetic baseline spread across the frame so
      // simulation mode still produces distinct, plausible positions
      const seatIndex = activeCamera.assignedPlayers.indexOf(activePlayer.id);
      const spread = activeCamera.assignedPlayers.length;
      const cx = 0.5 + (seatIndex - (spread - 1) / 2) * 0.22;
      dispatch({
        type: "SET_BASELINE",
        playerId: activePlayer.id,
        baseline: { cx, cy: 0.5, size: 0.22, yaw: 0 },
      });
    } else if (bestFace) {
      dispatch({
        type: "SET_BASELINE",
        playerId: activePlayer.id,
        baseline: { cx: bestFace.cx, cy: bestFace.cy, size: bestFace.w, yaw: bestFace.yaw },
      });
    }
    const next = state.players.find((p) => !p.calibrated && p.id !== activePlayer.id);
    if (next) setActivePlayerId(next.id);
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <StepHeader
        step={3}
        total={4}
        title="Calibration"
        subtitle="Detect all 6 players, capture their normal position, and verify reliable tracking."
      />

      {modelsLoading && (
        <div className="mb-6 rounded-xl border border-slate-800 bg-slate-900/60 px-5 py-3 text-sm text-slate-400">
          Loading on-device face detection model…
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
        <div>
          <div className="mb-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-bold text-white">
                {activeCamera.label} — calibrating {activePlayer.name}
              </p>
              <span className="text-xs text-slate-500">{activePlayer.seat}</span>
            </div>
            <CameraPanel
              camera={activeCamera}
              stream={activeStream}
              modelsReady={modelsReady}
              active
              className="aspect-video w-full"
              onRawFaces={(faces) =>
                setRawFacesByCam((s) => ({ ...s, [activeCamera.id]: faces }))
              }
              labelForRaw={(f) => (f === bestFace ? "Capture target" : null)}
            />
            <p className="mt-3 text-xs text-slate-500">
              {isSimulated
                ? "This camera has no bound device, so a seat-based baseline will be synthesized in simulation mode."
                : "Ask the player to look at the TV, sit normally, then capture their position."}
            </p>
            <button
              onClick={capture}
              disabled={!isSimulated && !bestFace}
              className="mt-4 w-full rounded-xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 py-3 text-sm font-bold uppercase tracking-wide text-white disabled:cursor-not-allowed disabled:opacity-30"
            >
              Capture Baseline for {activePlayer.name}
            </button>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
            <p className="mb-3 text-sm font-bold text-white">Select player to calibrate</p>
            <div className="flex flex-wrap gap-2">
              {state.players.map((p) => (
                <button
                  key={p.id}
                  onClick={() => setActivePlayerId(p.id)}
                  className={`flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    p.id === activePlayerId
                      ? "bg-indigo-500 text-white"
                      : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ background: colorForPlayer(p.id) }}
                  />
                  {p.name}
                  {p.calibrated && <span className="text-emerald-400">✓</span>}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
          <p className="mb-3 text-sm font-bold text-white">
            Tracking verification ({calibratedCount}/6)
          </p>
          <div className="space-y-2">
            {state.players.map((p) => (
              <div
                key={p.id}
                className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: colorForPlayer(p.id) }}
                  />
                  <span className="text-xs font-medium text-slate-200">{p.name}</span>
                </div>
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                    p.calibrated
                      ? "bg-emerald-500/20 text-emerald-300"
                      : "bg-slate-700/50 text-slate-400"
                  }`}
                >
                  {p.calibrated ? "Calibrated" : "Pending"}
                </span>
              </div>
            ))}
          </div>

          <button
            disabled={!allCalibrated}
            onClick={() => dispatch({ type: "START_GAME" })}
            className="mt-6 w-full rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 py-3 text-sm font-bold uppercase tracking-wide text-white disabled:cursor-not-allowed disabled:opacity-30"
          >
            Start 40-Round Game
          </button>
          <button
            onClick={() => dispatch({ type: "GOTO_STEP", step: "camera-setup" })}
            className="mt-2 w-full rounded-xl border border-slate-700 py-2 text-xs font-semibold uppercase tracking-wide text-slate-400 hover:bg-slate-800"
          >
            Back to Camera Setup
          </button>
        </div>
      </div>
    </div>
  );
}
