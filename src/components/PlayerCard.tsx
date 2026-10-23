import type { Player } from "../types";
import { colorForPlayer } from "../lib/playerColors";

const STATUS_STYLES: Record<Player["status"], string> = {
  tracked: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  degraded: "bg-amber-500/20 text-amber-300 border-amber-500/30",
  lost: "bg-rose-500/20 text-rose-300 border-rose-500/30",
  "not-detected": "bg-slate-700/30 text-slate-400 border-slate-700/40",
};

const STATUS_LABEL: Record<Player["status"], string> = {
  tracked: "Tracked",
  degraded: "Low confidence",
  lost: "Lost",
  "not-detected": "Not detected",
};

interface Props {
  player: Player;
  onManualCorrect: (playerId: number) => void;
}

export default function PlayerCard({ player, onManualCorrect }: Props) {
  const color = colorForPlayer(player.id);
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
          <p className="text-sm font-bold text-white">{player.name}</p>
        </div>
        <span className="text-[10px] font-semibold text-slate-500">{player.cameraId}</span>
      </div>
      <p className="text-[11px] text-slate-500">{player.seat}</p>

      <div className="mt-2 flex items-center gap-2">
        <span
          className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase ${STATUS_STYLES[player.status]}`}
        >
          {STATUS_LABEL[player.status]}
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
            player.facing === "facing"
              ? "bg-indigo-500/20 text-indigo-300"
              : player.facing === "away"
              ? "bg-orange-500/20 text-orange-300"
              : "bg-slate-700/30 text-slate-400"
          }`}
        >
          {player.facing === "facing" ? "Facing TV" : player.facing === "away" ? "Looking away" : "Unknown"}
        </span>
        {player.manualOverride && (
          <span className="rounded-full bg-fuchsia-500/20 px-2 py-0.5 text-[10px] font-bold uppercase text-fuchsia-300">
            Manual
          </span>
        )}
      </div>

      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-800">
        <div
          className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-emerald-400"
          style={{ width: `${Math.round(player.confidence * 100)}%` }}
        />
      </div>
      <p className="mt-1 text-[10px] text-slate-500">
        Confidence {Math.round(player.confidence * 100)}%
      </p>

      <div className="mt-2 flex items-center justify-between">
        <div className="text-sm font-black text-white">
          {player.roundScore >= 0 ? "+" : ""}
          {player.roundScore}
          <span className="ml-1 text-[10px] font-medium text-slate-500">this round</span>
        </div>
        <button
          onClick={() => onManualCorrect(player.id)}
          className="rounded-md border border-slate-700 px-2 py-1 text-[10px] font-semibold text-slate-400 hover:bg-slate-800"
        >
          Correct
        </button>
      </div>
    </div>
  );
}
