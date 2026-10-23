import type { Player } from "../types";

interface Props {
  player: Player;
  onClose: () => void;
  onApply: (patch: Partial<Player>) => void;
}

export default function ManualCorrectionModal({ player, onClose, onApply }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <p className="mb-1 text-sm font-bold text-white">Manual correction — {player.name}</p>
        <p className="mb-4 text-xs text-slate-500">
          Override automatic tracking when the host can visually confirm the real state.
        </p>

        <p className="mb-1 text-[10px] font-semibold uppercase text-slate-500">Status</p>
        <div className="mb-3 flex flex-wrap gap-2">
          {(["tracked", "degraded", "lost", "not-detected"] as const).map((s) => (
            <button
              key={s}
              onClick={() => onApply({ status: s })}
              className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                player.status === s ? "bg-indigo-500 text-white" : "bg-slate-800 text-slate-300"
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        <p className="mb-1 text-[10px] font-semibold uppercase text-slate-500">Facing</p>
        <div className="mb-5 flex flex-wrap gap-2">
          {(["facing", "away", "unknown"] as const).map((f) => (
            <button
              key={f}
              onClick={() => onApply({ facing: f })}
              className={`rounded-full px-3 py-1 text-[11px] font-semibold ${
                player.facing === f ? "bg-indigo-500 text-white" : "bg-slate-800 text-slate-300"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onApply({ manualOverride: false })}
            className="flex-1 rounded-lg border border-slate-700 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800"
          >
            Clear override
          </button>
          <button
            onClick={onClose}
            className="flex-1 rounded-lg bg-indigo-500 py-2 text-xs font-bold text-white hover:bg-indigo-400"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
