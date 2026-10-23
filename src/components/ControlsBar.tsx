import { TOTAL_ROUNDS } from "../data/videos";
import type { RoundStatus } from "../types";

interface Props {
  round: number;
  roundStatus: RoundStatus;
  timeLeft: number;
  onPauseResume: () => void;
  onSkip: () => void;
  onFinish: () => void;
}

export default function ControlsBar({
  round,
  roundStatus,
  timeLeft,
  onPauseResume,
  onSkip,
  onFinish,
}: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-800 bg-slate-900/60 px-5 py-3">
      <div className="flex items-center gap-4">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">Round</p>
          <p className="text-lg font-black text-white">
            {round} <span className="text-sm font-medium text-slate-500">/ {TOTAL_ROUNDS}</span>
          </p>
        </div>
        <div className="h-8 w-px bg-slate-800" />
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            Time left
          </p>
          <p className="text-lg font-black tabular-nums text-white">{timeLeft.toFixed(1)}s</p>
        </div>
        <div className="h-8 w-px bg-slate-800" />
        <span
          className={`rounded-full px-3 py-1 text-[10px] font-bold uppercase ${
            roundStatus === "playing"
              ? "bg-emerald-500/20 text-emerald-300"
              : roundStatus === "paused"
              ? "bg-amber-500/20 text-amber-300"
              : "bg-slate-700/40 text-slate-400"
          }`}
        >
          {roundStatus}
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onPauseResume}
          className="rounded-lg bg-indigo-500 px-4 py-2 text-xs font-bold uppercase tracking-wide text-white hover:bg-indigo-400"
        >
          {roundStatus === "paused" ? "Resume" : "Pause"}
        </button>
        <button
          onClick={onSkip}
          className="rounded-lg border border-slate-700 px-4 py-2 text-xs font-bold uppercase tracking-wide text-slate-300 hover:bg-slate-800"
        >
          Skip Round
        </button>
        <button
          onClick={onFinish}
          className="rounded-lg border border-rose-800 px-4 py-2 text-xs font-bold uppercase tracking-wide text-rose-300 hover:bg-rose-900/40"
        >
          End Session
        </button>
      </div>
    </div>
  );
}
