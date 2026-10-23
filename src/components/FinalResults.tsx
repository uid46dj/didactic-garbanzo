import { useGame } from "../context/GameContext";
import Leaderboard from "./Leaderboard";
import { downloadSessionJSON } from "../lib/storage";
import { colorForPlayer } from "../lib/playerColors";

export default function FinalResults() {
  const { state, dispatch } = useGame();
  const ranked = [...state.players].sort((a, b) => b.totalScore - a.totalScore);
  const winner = ranked[0];

  return (
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col justify-center px-6 py-16">
      <p className="text-center text-xs font-semibold uppercase tracking-widest text-indigo-400">
        Session Complete · {state.rounds.length} rounds played
      </p>
      <h1 className="mt-2 text-center text-3xl font-black text-white">Final Rankings</h1>

      <div className="mt-8 flex items-center justify-center gap-3 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6">
        <span
          className="flex h-12 w-12 items-center justify-center rounded-full text-xl"
          style={{ background: colorForPlayer(winner.id) }}
        >
          🏆
        </span>
        <div>
          <p className="text-xs uppercase tracking-wide text-amber-300">Champion</p>
          <p className="text-xl font-black text-white">{winner.name}</p>
          <p className="text-sm text-amber-200">{winner.totalScore} points</p>
        </div>
      </div>

      <div className="mt-6">
        <Leaderboard players={state.players} />
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
        <Stat label="Rounds played" value={state.rounds.length} />
        <Stat label="Total events" value={state.events.length} />
        <Stat
          label="Penalties"
          value={state.events.filter((e) => e.points < 0).length}
        />
        <Stat label="Session ID" value={state.sessionId.split("-")[1]} small />
      </div>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          onClick={() => downloadSessionJSON(state, `session-${state.sessionId}.json`)}
          className="flex-1 rounded-xl border border-slate-700 py-3 text-sm font-bold uppercase tracking-wide text-slate-300 hover:bg-slate-800"
        >
          Export full session data
        </button>
        <button
          onClick={() => dispatch({ type: "RESET_SESSION" })}
          className="flex-1 rounded-xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 py-3 text-sm font-bold uppercase tracking-wide text-white"
        >
          New Session
        </button>
      </div>
    </div>
  );
}

function Stat({ label, value, small }: { label: string; value: string | number; small?: boolean }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/60 p-4">
      <p className={`font-black text-white ${small ? "text-sm" : "text-xl"}`}>{value}</p>
      <p className="text-[10px] uppercase tracking-wide text-slate-500">{label}</p>
    </div>
  );
}
