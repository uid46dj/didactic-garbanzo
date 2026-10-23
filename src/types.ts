// Core domain types for the 6-Player Local Reaction Game system

export type CameraKind = "usb" | "adb";

export type CameraId = "cam1" | "cam2" | "cam3";

export interface CameraSource {
  id: CameraId;
  label: string;
  kind: CameraKind;
  description: string;
  deviceId: string | null; // enumerateDevices deviceId, null = not bound / simulated
  connected: boolean;
  simulated: boolean; // true when there's no real device feeding this camera
  assignedPlayers: number[]; // player ids 1-6
  lastFrameAt: number | null;
  error: string | null;
}

export type FacingState = "facing" | "away" | "unknown";
export type TrackStatus = "tracked" | "degraded" | "lost" | "not-detected";

export interface Baseline {
  cx: number; // normalized 0-1 center x within camera frame
  cy: number; // normalized 0-1 center y within camera frame
  size: number; // normalized face box size (width) at calibration time
  yaw: number; // signed yaw ratio at calibration (0 = straight at camera)
}

export interface Player {
  id: number; // 1-6
  name: string;
  seat: string;
  cameraId: CameraId | null;
  calibrated: boolean;
  baseline: Baseline | null;
  status: TrackStatus;
  facing: FacingState;
  confidence: number; // 0-1 current detection confidence
  box: { x: number; y: number; w: number; h: number } | null; // normalized, last known
  lastSeenAt: number | null;
  lostSince: number | null;
  totalScore: number;
  roundScore: number;
  manualOverride: boolean;
}

export type EventType =
  | "look_away"
  | "look_away_sustained"
  | "significant_movement"
  | "face_lost"
  | "face_regained"
  | "facing_resumed";

export interface GameEvent {
  id: string;
  round: number;
  playerId: number;
  type: EventType;
  timestamp: number; // ms epoch
  videoTime: number; // seconds into the round video
  confidence: number;
  durationMs?: number;
  points: number;
  note?: string;
}

export interface RoundVideo {
  id: string;
  title: string;
  src: string;
  duration: number; // seconds, informational
  mood: string;
}

export interface RoundRecord {
  index: number; // 1-40
  videoId: string;
  startedAt: number | null;
  endedAt: number | null;
  events: GameEvent[];
  scoreDelta: Record<number, number>;
}

export type GameStep =
  | "consent"
  | "camera-setup"
  | "calibration"
  | "dashboard"
  | "final";

export type RoundStatus = "idle" | "playing" | "paused" | "complete";

export interface SessionConfig {
  consentGiven: boolean;
  consentAt: number | null;
  confidenceThreshold: number; // minimum detection confidence to count events
  movementThreshold: number; // normalized displacement threshold
  lookAwayDebounceMs: number;
  movementDebounceMs: number;
  lostGraceMs: number;
}

export const PLAYER_SEATS = [
  "Front Left",
  "Front Right",
  "Mid Left",
  "Mid Right",
  "Back Left",
  "Back Right",
];
