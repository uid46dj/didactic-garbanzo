import type { EventType } from "../types";

// Predefined event -> point conversion table.
// Negative values are deductions (the "stay focused / stay still" challenge
// penalizes looking away or moving significantly while footage plays).
export const EVENT_POINTS: Record<EventType, number> = {
  look_away: -5,
  look_away_sustained: -15,
  significant_movement: -10,
  face_lost: -20,
  face_regained: 0,
  facing_resumed: 0,
};

export const EVENT_LABELS: Record<EventType, string> = {
  look_away: "Looked away",
  look_away_sustained: "Sustained look-away",
  significant_movement: "Significant movement",
  face_lost: "Tracking lost",
  face_regained: "Tracking regained",
  facing_resumed: "Facing TV again",
};

export const ROUND_BASE_SCORE = 100;

export function pointsFor(type: EventType, confidence: number): number {
  const base = EVENT_POINTS[type];
  // scale deductions slightly by confidence above threshold so marginal
  // detections cost less than highly confident ones
  const scale = 0.6 + Math.min(confidence, 1) * 0.4;
  return Math.round(base * scale);
}
