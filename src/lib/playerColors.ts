export const PLAYER_COLORS: Record<number, string> = {
  1: "#f472b6",
  2: "#60a5fa",
  3: "#34d399",
  4: "#fbbf24",
  5: "#a78bfa",
  6: "#fb7185",
};

export function colorForPlayer(id: number): string {
  return PLAYER_COLORS[id] ?? "#94a3b8";
}
