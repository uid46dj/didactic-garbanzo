import type { SessionConfig } from "../types";

interface Props {
  config: SessionConfig;
  onChange: (patch: Partial<SessionConfig>) => void;
  onClose: () => void;
}

export default function SettingsModal({ config, onChange, onClose }: Props) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-5">
        <p className="mb-1 text-sm font-bold text-white">Detection &amp; scoring reliability</p>
        <p className="mb-4 text-xs text-slate-500">
          Confidence filtering and debouncing keep tiny movements / detector noise from being
          scored as real events.
        </p>

        <Slider
          label="Minimum confidence"
          value={config.confidenceThreshold}
          min={0.3}
          max={0.95}
          step={0.05}
          format={(v) => `${Math.round(v * 100)}%`}
          onChange={(v) => onChange({ confidenceThreshold: v })}
        />
        <Slider
          label="Movement threshold"
          value={config.movementThreshold}
          min={0.02}
          max={0.12}
          step={0.005}
          format={(v) => v.toFixed(3)}
          onChange={(v) => onChange({ movementThreshold: v })}
        />
        <Slider
          label="Look-away debounce"
          value={config.lookAwayDebounceMs}
          min={150}
          max={1500}
          step={50}
          format={(v) => `${v}ms`}
          onChange={(v) => onChange({ lookAwayDebounceMs: v })}
        />
        <Slider
          label="Movement debounce"
          value={config.movementDebounceMs}
          min={100}
          max={1000}
          step={50}
          format={(v) => `${v}ms`}
          onChange={(v) => onChange({ movementDebounceMs: v })}
        />
        <Slider
          label="Lost-tracking grace period"
          value={config.lostGraceMs}
          min={500}
          max={4000}
          step={100}
          format={(v) => `${v}ms`}
          onChange={(v) => onChange({ lostGraceMs: v })}
        />

        <button
          onClick={onClose}
          className="mt-4 w-full rounded-lg bg-indigo-500 py-2 text-xs font-bold uppercase text-white hover:bg-indigo-400"
        >
          Done
        </button>
      </div>
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step,
  format,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format: (v: number) => string;
  onChange: (v: number) => void;
}) {
  return (
    <div className="mb-3">
      <div className="mb-1 flex items-center justify-between text-[11px] text-slate-400">
        <span>{label}</span>
        <span className="font-semibold text-slate-200">{format(value)}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-indigo-500"
      />
    </div>
  );
}
