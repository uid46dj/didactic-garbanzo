import type { Baseline, FacingState, GameEvent, Player, SessionConfig, TrackStatus } from "../types";
import { pointsFor } from "./scoring";
import type { NormalizedFace } from "./faceApi";

export interface TrackerRuntime {
  awaySince: number | null;
  awayNotifiedSustained: boolean;
  movementSince: number | null;
  smoothedCx: number | null;
  smoothedCy: number | null;
  lastEmaConfidence: number;
}

export function freshRuntime(): TrackerRuntime {
  return {
    awaySince: null,
    awayNotifiedSustained: false,
    movementSince: null,
    smoothedCx: null,
    smoothedCy: null,
    lastEmaConfidence: 0,
  };
}

const FACE_LOST_EVENT_COOLDOWN_MS = 4000;

export interface TickResult {
  status: TrackStatus;
  facing: FacingState;
  confidence: number;
  box: { x: number; y: number; w: number; h: number } | null;
  lostSince: number | null;
  events: GameEvent[];
}

export function tickPlayer(
  player: Player,
  baseline: Baseline | null,
  face: NormalizedFace | null,
  runtime: TrackerRuntime,
  config: SessionConfig,
  now: number,
  round: number,
  videoTime: number
): TickResult {
  const events: GameEvent[] = [];

  if (!face) {
    const lostSince = player.lostSince ?? now;
    const lostFor = now - lostSince;
    let status: TrackStatus = "degraded";
    if (lostFor > config.lostGraceMs) {
      status = "lost";
      if (
        player.status !== "lost" &&
        (player.lastSeenAt === null || now - player.lastSeenAt > FACE_LOST_EVENT_COOLDOWN_MS)
      ) {
        events.push(
          makeEvent(round, player.id, "face_lost", now, videoTime, 0.9, lostFor)
        );
      }
    }
    runtime.movementSince = null;
    runtime.awaySince = null;
    return {
      status,
      facing: "unknown",
      confidence: 0,
      box: player.box,
      lostSince,
      events,
    };
  }

  // exponential smoothing for position + confidence to damp jitter/noise
  runtime.smoothedCx = ema(runtime.smoothedCx, face.cx, 0.5);
  runtime.smoothedCy = ema(runtime.smoothedCy, face.cy, 0.5);
  runtime.lastEmaConfidence = ema(runtime.lastEmaConfidence, face.score, 0.4);

  const confidence = runtime.lastEmaConfidence;
  const box = {
    x: runtime.smoothedCx ?? face.cx,
    y: runtime.smoothedCy ?? face.cy,
    w: face.w,
    h: face.h,
  };

  const wasLost = player.status === "lost" || player.status === "not-detected";
  if (wasLost && confidence >= config.confidenceThreshold) {
    events.push(makeEvent(round, player.id, "face_regained", now, videoTime, confidence));
  }

  // --- facing detection ---
  const baselineYaw = baseline?.yaw ?? 0;
  const yawDelta = Math.abs(face.yaw - baselineYaw);
  const isAway = yawDelta > 0.32;
  let facing: FacingState = isAway ? "away" : "facing";

  if (confidence < config.confidenceThreshold) {
    facing = player.facing; // don't flip state on low-confidence noise
  } else if (isAway) {
    if (runtime.awaySince === null) runtime.awaySince = now;
    const awayFor = now - runtime.awaySince;
    if (awayFor > config.lookAwayDebounceMs && !runtime.awayNotifiedSustained) {
      events.push(
        makeEvent(round, player.id, "look_away", now, videoTime, confidence, awayFor)
      );
      runtime.awayNotifiedSustained = true;
    }
    if (awayFor > config.lookAwayDebounceMs * 3) {
      events.push(
        makeEvent(
          round,
          player.id,
          "look_away_sustained",
          now,
          videoTime,
          confidence,
          awayFor
        )
      );
      runtime.awaySince = now; // reset window so sustained can re-trigger
    }
  } else {
    if (runtime.awaySince !== null && runtime.awayNotifiedSustained) {
      events.push(makeEvent(round, player.id, "facing_resumed", now, videoTime, confidence));
    }
    runtime.awaySince = null;
    runtime.awayNotifiedSustained = false;
  }

  // --- movement detection relative to calibrated baseline position ---
  if (baseline && confidence >= config.confidenceThreshold) {
    const dx = box.x - baseline.cx;
    const dy = box.y - baseline.cy;
    const displacement = Math.sqrt(dx * dx + dy * dy);
    if (displacement > config.movementThreshold) {
      if (runtime.movementSince === null) runtime.movementSince = now;
      const movingFor = now - runtime.movementSince;
      if (movingFor > config.movementDebounceMs) {
        events.push(
          makeEvent(
            round,
            player.id,
            "significant_movement",
            now,
            videoTime,
            confidence,
            movingFor
          )
        );
        runtime.movementSince = now + 1; // small offset avoids div weirdness, re-arm window
      }
    } else {
      runtime.movementSince = null;
    }
  }

  return {
    status: confidence >= config.confidenceThreshold ? "tracked" : "degraded",
    facing,
    confidence,
    box,
    lostSince: null,
    events,
  };
}

function ema(prev: number | null, next: number, alpha: number): number {
  if (prev === null) return next;
  return prev * (1 - alpha) + next * alpha;
}

let eventCounter = 0;
function makeEvent(
  round: number,
  playerId: number,
  type: GameEvent["type"],
  timestamp: number,
  videoTime: number,
  confidence: number,
  durationMs?: number
): GameEvent {
  eventCounter += 1;
  return {
    id: `evt-${timestamp}-${eventCounter}`,
    round,
    playerId,
    type,
    timestamp,
    videoTime,
    confidence,
    durationMs,
    points: pointsFor(type, confidence),
  };
}
