import { useState } from "react";
import { useGame } from "../context/GameContext";

export default function ConsentScreen() {
  const { dispatch } = useGame();
  const [checks, setChecks] = useState({
    cameras: false,
    local: false,
    players: false,
  });

  const allChecked = Object.values(checks).every(Boolean);

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-16">
      <div className="mb-8 flex items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500 to-indigo-600 text-xl font-black text-white shadow-lg shadow-indigo-900/40">
          🎮
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-indigo-400">
            Local Reaction Arena
          </p>
          <h1 className="text-2xl font-bold text-white">6-Player Tracking Consent</h1>
        </div>
      </div>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 shadow-xl backdrop-blur">
        <h2 className="text-lg font-semibold text-white">Before we start tracking</h2>
        <p className="mt-2 text-sm leading-relaxed text-slate-400">
          This game uses up to 3 camera sources (1 USB webcam + 2 Android devices connected via
          ADB) to visually track all 6 players during each round. All video analysis, scoring and
          session data stay <span className="font-semibold text-slate-200">on this device</span> —
          nothing is uploaded anywhere. Every player must consent before tracking begins.
        </p>

        <ul className="mt-6 space-y-3">
          {[
            {
              key: "cameras" as const,
              text: "All 6 players agree to be visually tracked (face position & movement only, no recognition/identity data) by the 3 connected cameras during gameplay.",
            },
            {
              key: "local" as const,
              text: "I understand processing happens locally in-browser and session data (events, scores, video order) is stored only on this machine.",
            },
            {
              key: "players" as const,
              text: "Players may withdraw consent at any time, which stops tracking and excludes them from scoring.",
            },
          ].map((c) => (
            <li key={c.key}>
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-800 bg-slate-950/40 p-4 transition hover:border-indigo-500/50">
                <input
                  type="checkbox"
                  className="mt-0.5 h-4 w-4 accent-indigo-500"
                  checked={checks[c.key]}
                  onChange={(e) => setChecks((s) => ({ ...s, [c.key]: e.target.checked }))}
                />
                <span className="text-sm text-slate-300">{c.text}</span>
              </label>
            </li>
          ))}
        </ul>

        <button
          disabled={!allChecked}
          onClick={() => dispatch({ type: "GIVE_CONSENT" })}
          className="mt-8 w-full rounded-xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 py-3 text-sm font-bold uppercase tracking-wide text-white shadow-lg shadow-indigo-900/40 transition disabled:cursor-not-allowed disabled:opacity-30"
        >
          I Consent — Continue to Camera Setup
        </button>
      </div>
    </div>
  );
}
