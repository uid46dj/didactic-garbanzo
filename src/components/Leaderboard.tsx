import type { Player } from "../types";
import { colorForPlayer } from "../lib/playerColors";
import { cn } from "../utils/cn";

interface Props {
  players: Player[];
  compact?: boolean;
}

export default function Leaderboard({ players, compact }: Props) {
  const ranked = [...players].sort((a, b) => b.totalScore - a.totalScore);

  return (
    <div
      className={cn(
        "rounded-xl border border-slate-800 bg-slate-900/60 p-3",
        compact ? "" : "p-6"
      )}
    >
      {!compact && (
        <p className="mb-4 text-sm font-bold uppercase tracking-wide text-slate-300">
          Leaderboard
        </p>
      )}
      <div className="space-y-1.5">
        {ranked.map((p, i) => (
          <div
            key={p.id}
            className={cn(
              "flex items-center justify-between rounded-lg px-2.5 py-1.5",
              i === 0 ? "bg-gradient-to-r from-amber-500/20 to-transparent" : "bg-slate-950/40"
            )}
          >
            <div className="flex items-center gap-2">
              <span
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-black",
                  i === 0
                    ? "bg-amber-400 text-amber-950"
                    : i === 1
                    ? "bg-slate-300 text-slate-900"
                    : i === 2
                    ? "bg-amber-700 text-amber-100"
                    : "bg-slate-800 text-slate-400"
                )}
              >
                {i + 1}
              </span>
              <span className="h-2 w-2 rounded-full" style={{ background: colorForPlayer(p.id) }} />
              <span className="text-xs font-semibold text-slate-200">{p.name}</span>
            </div>
            <span className="text-sm font-black text-white">{p.totalScore}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
