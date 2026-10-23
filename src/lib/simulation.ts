import type { Baseline } from "../types";
import type { NormalizedFace } from "./faceApi";

// Deterministic-ish pseudo random per player so behaviour feels organic but
// reproducible within a tick. Used whenever a camera slot has no real video
// device bound (e.g. ADB phone not connected in this environment, or no
// webcam permission) so the full pipeline (dashboard/events/scoring) still
// behaves like a live multi-camera rig for demo & development purposes.
export function simulateFace(
  playerId: number,
  baseline: Baseline | null,
  now: number
): NormalizedFace | null {
  const base = baseline ?? { cx: 0.5, cy: 0.5, size: 0.22, yaw: 0 };
  const t = now / 1000 + playerId * 37.1;

  // occasional short "dropout" to exercise lost-tracking recovery logic
  const dropoutPhase = Math.sin(t * 0.07 + playerId) > 0.985;
  if (dropoutPhase) return null;

  const jitterX = Math.sin(t * 1.3) * 0.004 + Math.sin(t * 5.1) * 0.0015;
  const jitterY = Math.cos(t * 1.1) * 0.004;

  // slow drift that occasionally crosses the movement threshold
  const driftPhase = Math.sin(t * 0.09 + playerId * 2.2);
  const drift = driftPhase > 0.9 ? (driftPhase - 0.9) * 0.6 : 0;

  // occasional look-away excursions
  const yawPhase = Math.sin(t * 0.05 + playerId * 1.7);
  const yawExcursion = yawPhase > 0.92 ? (yawPhase - 0.92) * 6 : 0;

  const score = 0.72 + Math.max(0, Math.sin(t * 0.3 + playerId)) * 0.25;

  return {
    cx: base.cx + jitterX + drift,
    cy: base.cy + jitterY,
    w: base.size,
    h: base.size * 1.25,
    score: Math.min(0.98, score),
    yaw: base.yaw + yawExcursion,
  };
}
