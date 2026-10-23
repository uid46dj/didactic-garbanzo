import type { GameEvent, Player } from "../types";
import { EVENT_LABELS } from "../lib/scoring";
import { colorForPlayer } from "../lib/playerColors";

interface Props {
  events: GameEvent[];
  players: Player[];
}

export default function EventLog({ events, players }: Props) {
  const recent = [...events].slice(-40).reverse();
  const nameFor = (id: number) => players.find((p) => p.id === id)?.name ?? `P${id}`;

  return (
    <div className="flex h-full flex-col rounded-xl border border-slate-800 bg-slate-900/60 p-3">
      <p className="mb-2 text-xs font-bold uppercase tracking-wide text-slate-400">
        Live event feed
      </p>
      <div className="flex-1 space-y-1.5 overflow-y-auto pr-1">
        {recent.length === 0 && (
          <p className="text-xs text-slate-600">No events yet — stay still and watch the TV.</p>
        )}
        {recent.map((ev) => (
          <div
            key={ev.id}
            className="flex items-center justify-between gap-2 rounded-lg bg-slate-950/50 px-2.5 py-1.5 text-xs"
          >
            <div className="flex items-center gap-2 overflow-hidden">
              <span
                className="h-2 w-2 shrink-0 rounded-full"
                style={{ background: colorForPlayer(ev.playerId) }}
              />
              <span className="truncate font-medium text-slate-200">{nameFor(ev.playerId)}</span>
              <span className="truncate text-slate-500">{EVENT_LABELS[ev.type]}</span>
            </div>
            <span
              className={`shrink-0 font-bold ${ev.points < 0 ? "text-rose-400" : "text-emerald-400"}`}
            >
              {ev.points > 0 ? "+" : ""}
              {ev.points}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
