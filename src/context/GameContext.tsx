import React, { createContext, useContext, useMemo, useReducer } from "react";
import type {
  CameraId,
  CameraSource,
  GameEvent,
  GameStep,
  Player,
  RoundRecord,
  RoundStatus,
  SessionConfig,
} from "../types";
import { PLAYER_SEATS } from "../types";
import { shuffledVideoOrder, TOTAL_ROUNDS } from "../data/videos";

function initialCameras(): CameraSource[] {
  return [
    {
      id: "cam1",
      label: "Camera 1 — USB Webcam",
      kind: "usb",
      description: "External USB webcam covering the front row.",
      deviceId: null,
      connected: false,
      simulated: true,
      assignedPlayers: [1, 2],
      lastFrameAt: null,
      error: null,
    },
    {
      id: "cam2",
      label: "Camera 2 — Android (ADB)",
      kind: "adb",
      description: "Android device mirrored via ADB, covering the mid row.",
      deviceId: null,
      connected: false,
      simulated: true,
      assignedPlayers: [3, 4],
      lastFrameAt: null,
      error: null,
    },
    {
      id: "cam3",
      label: "Camera 3 — Android (ADB)",
      kind: "adb",
      description: "Second Android device mirrored via ADB, covering the back row.",
      deviceId: null,
      connected: false,
      simulated: true,
      assignedPlayers: [5, 6],
      lastFrameAt: null,
      error: null,
    },
  ];
}

function initialPlayers(): Player[] {
  const camForPlayer: Record<number, CameraId> = {
    1: "cam1",
    2: "cam1",
    3: "cam2",
    4: "cam2",
    5: "cam3",
    6: "cam3",
  };
  return Array.from({ length: 6 }, (_, i) => {
    const id = i + 1;
    return {
      id,
      name: `Player ${id}`,
      seat: PLAYER_SEATS[i],
      cameraId: camForPlayer[id],
      calibrated: false,
      baseline: null,
      status: "not-detected",
      facing: "unknown",
      confidence: 0,
      box: null,
      lastSeenAt: null,
      lostSince: null,
      totalScore: 0,
      roundScore: 0,
      manualOverride: false,
    };
  });
}

function initialConfig(): SessionConfig {
  return {
    consentGiven: false,
    consentAt: null,
    confidenceThreshold: 0.6,
    movementThreshold: 0.045,
    lookAwayDebounceMs: 500,
    movementDebounceMs: 350,
    lostGraceMs: 1500,
  };
}

export interface GameState {
  step: GameStep;
  config: SessionConfig;
  cameras: CameraSource[];
  players: Player[];
  videoOrder: string[];
  currentRound: number; // 1-based
  roundStatus: RoundStatus;
  roundStartedAt: number | null;
  rounds: RoundRecord[];
  events: GameEvent[];
  sessionId: string;
  sessionStartedAt: number | null;
}

function newSessionId() {
  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function initialState(): GameState {
  return {
    step: "consent",
    config: initialConfig(),
    cameras: initialCameras(),
    players: initialPlayers(),
    videoOrder: [],
    currentRound: 0,
    roundStatus: "idle",
    roundStartedAt: null,
    rounds: [],
    events: [],
    sessionId: newSessionId(),
    sessionStartedAt: null,
  };
}

type Action =
  | { type: "GIVE_CONSENT" }
  | { type: "GOTO_STEP"; step: GameStep }
  | { type: "SET_CAMERA_DEVICE"; cameraId: CameraId; deviceId: string | null }
  | {
      type: "SET_CAMERA_STATUS";
      cameraId: CameraId;
      patch: Partial<CameraSource>;
    }
  | { type: "REASSIGN_PLAYER"; playerId: number; cameraId: CameraId }
  | { type: "RENAME_PLAYER"; playerId: number; name: string }
  | { type: "SET_BASELINE"; playerId: number; baseline: Player["baseline"] }
  | { type: "UPDATE_PLAYER"; playerId: number; patch: Partial<Player> }
  | { type: "APPLY_TICK"; updates: { playerId: number; patch: Partial<Player> }[]; events: GameEvent[] }
  | { type: "START_GAME" }
  | { type: "SET_ROUND_STATUS"; status: RoundStatus }
  | { type: "NEXT_ROUND" }
  | { type: "SKIP_ROUND" }
  | { type: "MANUAL_CORRECTION"; playerId: number; patch: Partial<Player> }
  | { type: "SET_CONFIG"; patch: Partial<SessionConfig> }
  | { type: "RESET_SESSION" }
  | { type: "FINISH_GAME" }
  | { type: "LOAD_STATE"; state: GameState };

function finalizeRound(state: GameState): GameState {
  if (state.currentRound === 0) return state;
  const existing = state.rounds.find((r) => r.index === state.currentRound);
  const scoreDelta: Record<number, number> = {};
  state.players.forEach((p) => (scoreDelta[p.id] = p.roundScore));
  const record: RoundRecord = existing
    ? { ...existing, endedAt: Date.now(), scoreDelta }
    : {
        index: state.currentRound,
        videoId: state.videoOrder[state.currentRound - 1],
        startedAt: state.roundStartedAt,
        endedAt: Date.now(),
        events: state.events.filter((e) => e.round === state.currentRound),
        scoreDelta,
      };
  const rounds = existing
    ? state.rounds.map((r) => (r.index === state.currentRound ? record : r))
    : [...state.rounds, record];
  return { ...state, rounds };
}

function reducer(state: GameState, action: Action): GameState {
  switch (action.type) {
    case "GIVE_CONSENT":
      return {
        ...state,
        config: { ...state.config, consentGiven: true, consentAt: Date.now() },
        step: "camera-setup",
      };
    case "GOTO_STEP":
      return { ...state, step: action.step };
    case "SET_CAMERA_DEVICE":
      return {
        ...state,
        cameras: state.cameras.map((c) =>
          c.id === action.cameraId
            ? { ...c, deviceId: action.deviceId, simulated: action.deviceId === null }
            : c
        ),
      };
    case "SET_CAMERA_STATUS":
      return {
        ...state,
        cameras: state.cameras.map((c) =>
          c.id === action.cameraId ? { ...c, ...action.patch } : c
        ),
      };
    case "REASSIGN_PLAYER": {
      const cameras = state.cameras.map((c) => ({
        ...c,
        assignedPlayers: c.assignedPlayers.filter((id) => id !== action.playerId),
      }));
      const target = cameras.find((c) => c.id === action.cameraId);
      if (target) target.assignedPlayers = [...target.assignedPlayers, action.playerId].sort();
      const players = state.players.map((p) =>
        p.id === action.playerId
          ? { ...p, cameraId: action.cameraId, calibrated: false, baseline: null }
          : p
      );
      return { ...state, cameras, players };
    }
    case "RENAME_PLAYER":
      return {
        ...state,
        players: state.players.map((p) =>
          p.id === action.playerId ? { ...p, name: action.name } : p
        ),
      };
    case "SET_BASELINE":
      return {
        ...state,
        players: state.players.map((p) =>
          p.id === action.playerId
            ? { ...p, baseline: action.baseline, calibrated: true }
            : p
        ),
      };
    case "UPDATE_PLAYER":
      return {
        ...state,
        players: state.players.map((p) =>
          p.id === action.playerId ? { ...p, ...action.patch } : p
        ),
      };
    case "APPLY_TICK": {
      let players = state.players;
      for (const u of action.updates) {
        players = players.map((p) => (p.id === u.playerId ? { ...p, ...u.patch } : p));
      }
      if (action.events.length > 0) {
        for (const ev of action.events) {
          players = players.map((p) =>
            p.id === ev.playerId
              ? {
                  ...p,
                  roundScore: p.roundScore + ev.points,
                  totalScore: p.totalScore + ev.points,
                }
              : p
          );
        }
      }
      const events =
        action.events.length > 0 ? [...state.events, ...action.events].slice(-500) : state.events;
      return { ...state, players, events };
    }
    case "START_GAME": {
      const videoOrder = shuffledVideoOrder(Date.now());
      const players = state.players.map((p) => ({ ...p, roundScore: 0 }));
      return {
        ...state,
        videoOrder,
        players,
        currentRound: 1,
        roundStatus: "playing",
        roundStartedAt: Date.now(),
        rounds: [],
        events: [],
        step: "dashboard",
        sessionStartedAt: Date.now(),
      };
    }
    case "SET_ROUND_STATUS":
      return { ...state, roundStatus: action.status };
    case "NEXT_ROUND": {
      const finalized = finalizeRound(state);
      if (finalized.currentRound >= TOTAL_ROUNDS) {
        return { ...finalized, roundStatus: "complete", step: "final" };
      }
      const players = finalized.players.map((p) => ({ ...p, roundScore: 0 }));
      return {
        ...finalized,
        players,
        currentRound: finalized.currentRound + 1,
        roundStatus: "playing",
        roundStartedAt: Date.now(),
      };
    }
    case "SKIP_ROUND":
      return reducer(state, { type: "NEXT_ROUND" });
    case "MANUAL_CORRECTION":
      return {
        ...state,
        players: state.players.map((p) =>
          p.id === action.playerId ? { ...p, ...action.patch, manualOverride: true } : p
        ),
      };
    case "SET_CONFIG":
      return { ...state, config: { ...state.config, ...action.patch } };
    case "FINISH_GAME": {
      const finalized = finalizeRound(state);
      return { ...finalized, roundStatus: "complete", step: "final" };
    }
    case "RESET_SESSION":
      return initialState();
    case "LOAD_STATE":
      return action.state;
    default:
      return state;
  }
}

interface GameContextValue {
  state: GameState;
  dispatch: React.Dispatch<Action>;
}

const GameContext = createContext<GameContextValue | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initialState);
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}
