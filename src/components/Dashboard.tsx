import { useEffect, useMemo, useRef, useState } from "react";
import { useGame } from "../context/GameContext";
import { useCameraStreams } from "../context/CameraStreamsContext";
import { useFaceModels } from "../hooks/useFaceModels";
import { videoById } from "../data/videos";
import type { NormalizedFace } from "../lib/faceApi";
import { simulateFace } from "../lib/simulation";
import { freshRuntime, tickPlayer, type TrackerRuntime } from "../lib/tracker";
import { colorForPlayer } from "../lib/playerColors";
import type { GameEvent, Player } from "../types";
import { saveSession, downloadSessionJSON } from "../lib/storage";

import CameraStatusCard from "./CameraStatusCard";
import PlayerCard from "./PlayerCard";
import EventLog from "./EventLog";
import Leaderboard from "./Leaderboard";
import ControlsBar from "./ControlsBar";
import ManualCorrectionModal from "./ManualCorrectionModal";
import SettingsModal from "./SettingsModal";

const TICK_MS = 400;

export default function Dashboard() {
  const { state, dispatch } = useGame();
  const streams = useCameraStreams();
  const { ready: modelsReady } = useFaceModels();

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const videoTimeRef = useRef(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [roundEnded, setRoundEnded] = useState(false);
  const [correctingPlayer, setCorrectingPlayer] = useState<number | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const rawFacesByCam = useRef<Record<string, NormalizedFace[]>>({});
  const simFacesByCam = useRef<Record<string, { playerId: number; face: NormalizedFace }[]>>({});
  const [, forceTick] = useState(0);
  const runtimes = useRef<Map<number, TrackerRuntime>>(new Map());
  const stateRef = useRef(state);
  stateRef.current = state;

  const video = videoById(state.videoOrder[state.currentRound - 1] ?? "");
  const playerNames = useMemo(
    () => Object.fromEntries(state.players.map((p) => [p.id, p.name])),
    [state.players]
  );

  useEffect(() => {
    state.players.forEach((p) => {
      if (!runtimes.current.has(p.id)) runtimes.current.set(p.id, freshRuntime());
    });
  }, [state.players]);

  // play/pause video according to round status
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (state.roundStatus === "playing") {
      v.play().catch(() => {});
    } else {
      v.pause();
    }
  }, [state.roundStatus, state.currentRound]);

  // reset per-round UI state
  useEffect(() => {
    setRoundEnded(false);
    videoTimeRef.current = 0;
  }, [state.currentRound]);

  // persist session locally on every change
  useEffect(() => {
    saveSession(state);
  }, [state]);

  // main tracking tick loop
  useEffect(() => {
    if (state.roundStatus !== "playing") return;
    const id = setInterval(() => {
      const now = Date.now();
      const live = stateRef.current;
      const updates: { playerId: number; patch: Partial<Player> }[] = [];
      const events: GameEvent[] = [];

      live.cameras.forEach((cam) => {
        const isLiveCam = !!streams[cam.id];
        const candidateFaces: { face: NormalizedFace; claimed: boolean }[] = isLiveCam
          ? (rawFacesByCam.current[cam.id] ?? []).map((face) => ({ face, claimed: false }))
          : [];
        const ghosts: { playerId: number; face: NormalizedFace }[] = [];

        cam.assignedPlayers.forEach((playerId) => {
          const player = live.players.find((p) => p.id === playerId);
          if (!player || player.manualOverride) return;
          const runtime = runtimes.current.get(playerId) ?? freshRuntime();
          runtimes.current.set(playerId, runtime);

          let face: NormalizedFace | null = null;
          if (isLiveCam) {
            let best: { face: NormalizedFace; claimed: boolean } | null = null;
            let bestDist = Infinity;
            const baseline = player.baseline;
            for (const c of candidateFaces) {
              if (c.claimed) continue;
              const bx = baseline?.cx ?? 0.5;
              const by = baseline?.cy ?? 0.5;
              const d = Math.hypot(c.face.cx - bx, c.face.cy - by);
              if (d < bestDist) {
                bestDist = d;
                best = c;
              }
            }
            if (best && bestDist < 0.4) {
              best.claimed = true;
              face = best.face;
            }
          } else {
            face = simulateFace(playerId, player.baseline, now);
            if (face) ghosts.push({ playerId, face });
          }

          const result = tickPlayer(
            player,
            player.baseline,
            face,
            runtime,
            live.config,
            now,
            live.currentRound,
            videoTimeRef.current
          );

          updates.push({
            playerId,
            patch: {
              status: result.status,
              facing: result.facing,
              confidence: result.confidence,
              box: result.box,
              lostSince: result.lostSince,
              lastSeenAt: face ? now : player.lastSeenAt,
            },
          });
          events.push(...result.events);
        });

        simFacesByCam.current[cam.id] = ghosts;
      });

      if (updates.length || events.length) {
        dispatch({ type: "APPLY_TICK", updates, events });
      }
      forceTick((n) => n + 1);
    }, TICK_MS);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.roundStatus, streams]);

  // countdown display based on video progress
  useEffect(() => {
    const id = setInterval(() => {
      const v = videoRef.current;
      if (!v || !isFinite(v.duration)) return;
      setTimeLeft(Math.max(0, v.duration - v.currentTime));
    }, 200);
    return () => clearInterval(id);
  }, []);

  function handleRoundEnd() {
    setRoundEnded(true);
    dispatch({ type: "SET_ROUND_STATUS", status: "paused" });
  }

  function handleNextRound() {
    dispatch({ type: "NEXT_ROUND" });
  }

  function handlePauseResume() {
    dispatch({
      type: "SET_ROUND_STATUS",
      status: state.roundStatus === "paused" ? "playing" : "paused",
    });
  }

  function handleManualApply(patch: Partial<Player>) {
    if (correctingPlayer == null) return;
    dispatch({ type: "MANUAL_CORRECTION", playerId: correctingPlayer, patch });
  }

  const correctingPlayerObj = state.players.find((p) => p.id === correctingPlayer) ?? null;

  return (
    <div className="mx-auto max-w-[1600px] px-6 py-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400">
            Host Dashboard
          </p>
          <h1 className="text-xl font-bold text-white">Local Reaction Arena — Live Session</h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setSettingsOpen(true)}
            className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
          >
            Detection settings
          </button>
          <button
            onClick={() => downloadSessionJSON(state, `session-${state.sessionId}.json`)}
            className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
          >
            Export session JSON
          </button>
        </div>
      </div>

      <div className="mb-4">
        <ControlsBar
          round={state.currentRound}
          roundStatus={state.roundStatus}
          timeLeft={timeLeft}
          onPauseResume={handlePauseResume}
          onSkip={() => dispatch({ type: "SKIP_ROUND" })}
          onFinish={() => dispatch({ type: "FINISH_GAME" })}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.6fr_1fr]">
        <div className="space-y-4">
          <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-black">
            <video
              key={video.id + state.currentRound}
              ref={videoRef}
              src={video.src}
              className="aspect-video w-full bg-black object-cover"
              onTimeUpdate={(e) => (videoTimeRef.current = e.currentTarget.currentTime)}
              onEnded={handleRoundEnd}
              playsInline
            />
            <div className="absolute left-3 top-3 rounded-lg bg-black/60 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur">
              {video.title} <span className="text-slate-400">· {video.mood}</span>
            </div>

            {roundEnded && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/80 p-6 text-center">
                <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400">
                  Round {state.currentRound} complete
                </p>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                  {state.players.map((p) => (
                    <div key={p.id} className="rounded-lg bg-slate-900 px-2 py-2">
                      <p className="text-[10px] text-slate-400">{p.name}</p>
                      <p
                        className={`text-sm font-black ${
                          p.roundScore >= 0 ? "text-emerald-400" : "text-rose-400"
                        }`}
                      >
                        {p.roundScore >= 0 ? "+" : ""}
                        {p.roundScore}
                      </p>
                    </div>
                  ))}
                </div>
                <button
                  onClick={handleNextRound}
                  className="rounded-xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-6 py-3 text-sm font-bold uppercase tracking-wide text-white"
                >
                  {state.currentRound >= 40 ? "View Final Results" : "Start Next Round"}
                </button>
              </div>
            )}
          </div>

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
              Players ({state.players.length}/6 tracked)
            </p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
              {state.players.map((p) => (
                <PlayerCard key={p.id} player={p} onManualCorrect={setCorrectingPlayer} />
              ))}
            </div>
          </div>

          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
              Cameras
            </p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {state.cameras.map((cam) => (
                <CameraStatusCard
                  key={cam.id}
                  camera={cam}
                  stream={streams[cam.id]}
                  modelsReady={modelsReady}
                  active={state.roundStatus === "playing"}
                  onRawFaces={(faces) => (rawFacesByCam.current[cam.id] = faces)}
                  ghostFaces={(simFacesByCam.current[cam.id] ?? []).map((g) => ({
                    ...g,
                    label: playerNames[g.playerId] ?? `P${g.playerId}`,
                    color: colorForPlayer(g.playerId),
                  }))}
                  playerNames={playerNames}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-rows-[auto_1fr] gap-4">
          <Leaderboard players={state.players} />
          <EventLog events={state.events} players={state.players} />
        </div>
      </div>

      {correctingPlayerObj && (
        <ManualCorrectionModal
          player={correctingPlayerObj}
          onApply={handleManualApply}
          onClose={() => setCorrectingPlayer(null)}
        />
      )}

      {settingsOpen && (
        <SettingsModal
          config={state.config}
          onChange={(patch) => dispatch({ type: "SET_CONFIG", patch })}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  );
}
