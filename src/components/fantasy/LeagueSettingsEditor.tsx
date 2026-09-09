import { Save, Settings2 } from 'lucide-react';
import { useState } from 'react';
import type { LeagueScoringSettings, ScoringFormat } from '@/types';
import { getScoringPresets, getDefaultScoring } from '@/services/team/manualTeamService';

interface LeagueSettingsEditorProps {
  initial: LeagueScoringSettings;
  initialName: string;
  onSave: (scoring: LeagueScoringSettings, name: string) => void;
}

const FORMATS: ScoringFormat[] = ['Standard', 'Half-PPR', 'Full-PPR', 'PPR'];

export function LeagueSettingsEditor({ initial, initialName, onSave }: LeagueSettingsEditorProps) {
  const [scoring, setScoring] = useState<LeagueScoringSettings>(initial);
  const [name, setName] = useState(initialName);
  const presets = getScoringPresets();

  const applyPreset = (format: ScoringFormat) => {
    setScoring((prev) => ({ ...prev, ...presets[format] }));
  };

  const update = <K extends keyof LeagueScoringSettings>(
    key: K,
    value: LeagueScoringSettings[K],
  ) => {
    setScoring((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="rounded-xl border border-ink-600 bg-ink-850 p-4">
      <div className="mb-4 flex items-center gap-2">
        <Settings2 className="h-4 w-4 text-neon-500" />
        <h3 className="text-sm font-semibold text-white">League Configuration</h3>
      </div>

      {/* League name */}
      <div className="mb-4">
        <label className="mb-1 block text-xs font-medium text-gray-400">League Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="My Fantasy League"
          className="w-full rounded-lg border border-ink-600 bg-ink-800 px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:border-neon-500/40 focus:outline-none"
        />
      </div>

      {/* Format presets */}
      <div className="mb-4">
        <label className="mb-1.5 block text-xs font-medium text-gray-400">Scoring Format</label>
        <div className="grid grid-cols-4 gap-2">
          {FORMATS.map((f) => (
            <button
              key={f}
              onClick={() => applyPreset(f)}
              className={`rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors ${
                scoring.format === f
                  ? 'border-neon-500/50 bg-neon-500/10 text-neon-200'
                  : 'border-ink-600 bg-ink-800 text-gray-400 hover:text-white'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Scoring details */}
      <div className="mb-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500">Scoring</p>
        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          <NumberField label="Pass TD" value={scoring.passingTdPoints} step={1} onChange={(v) => update('passingTdPoints', v)} />
          <NumberField label="Pass Yds/PT" value={scoring.passingYardsPerPoint} step={1} onChange={(v) => update('passingYardsPerPoint', v)} />
          <NumberField label="INT Penalty" value={scoring.interceptionPoints} step={1} onChange={(v) => update('interceptionPoints', v)} />
          <NumberField label="Rush TD" value={scoring.rushingTdPoints} step={1} onChange={(v) => update('rushingTdPoints', v)} />
          <NumberField label="Rush Yds/PT" value={scoring.rushingYardsPerPoint} step={1} onChange={(v) => update('rushingYardsPerPoint', v)} />
          <NumberField label="Rec Yds/PT" value={scoring.receivingYardsPerPoint} step={1} onChange={(v) => update('receivingYardsPerPoint', v)} />
          <NumberField label="Rec TD" value={scoring.receivingTdPoints} step={1} onChange={(v) => update('receivingTdPoints', v)} />
          <NumberField label="Receptions" value={scoring.receptionPoints} step={0.5} onChange={(v) => update('receptionPoints', v)} />
          <NumberField label="Fumble" value={scoring.fumblePoints} step={1} onChange={(v) => update('fumblePoints', v)} />
        </div>
      </div>

      {/* Roster slots */}
      <div className="mb-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500">Roster Slots</p>
        <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-4">
          <NumberField label="Teams" value={scoring.teams} step={1} min={2} onChange={(v) => update('teams', v)} />
          <NumberField label="QB" value={scoring.qbSlots} step={1} min={0} onChange={(v) => update('qbSlots', v)} />
          <NumberField label="RB" value={scoring.rbSlots} step={1} min={0} onChange={(v) => update('rbSlots', v)} />
          <NumberField label="WR" value={scoring.wrSlots} step={1} min={0} onChange={(v) => update('wrSlots', v)} />
          <NumberField label="TE" value={scoring.teSlots} step={1} min={0} onChange={(v) => update('teSlots', v)} />
          <NumberField label="FLEX" value={scoring.flexSlots} step={1} min={0} onChange={(v) => update('flexSlots', v)} />
          <NumberField label="Bench" value={scoring.benchSlots} step={1} min={0} onChange={(v) => update('benchSlots', v)} />
        </div>
      </div>

      {/* Toggles */}
      <div className="mb-4 flex gap-3">
        <ToggleField
          label="Kicker"
          enabled={scoring.kickerEnabled}
          onToggle={(v) => update('kickerEnabled', v)}
        />
        <ToggleField
          label="Defense"
          enabled={scoring.defenseEnabled}
          onToggle={(v) => update('defenseEnabled', v)}
        />
      </div>

      {/* Save */}
      <button
        onClick={() => onSave(scoring, name)}
        className="inline-flex items-center gap-1.5 rounded-lg border border-neon-500/40 bg-neon-500/10 px-4 py-2 text-sm font-medium text-neon-200 transition-colors hover:bg-neon-500/20"
      >
        <Save className="h-4 w-4" />
        Save League Settings
      </button>
    </div>
  );
}

function NumberField({
  label,
  value,
  step,
  min,
  onChange,
}: {
  label: string;
  value: number;
  step: number;
  min?: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-medium text-gray-500">{label}</label>
      <input
        type="number"
        value={value}
        step={step}
        min={min}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full rounded-lg border border-ink-600 bg-ink-800 px-2 py-1.5 text-sm text-white focus:border-neon-500/40 focus:outline-none"
      />
    </div>
  );
}

function ToggleField({
  label,
  enabled,
  onToggle,
}: {
  label: string;
  enabled: boolean;
  onToggle: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 rounded-lg border border-ink-700 bg-ink-800 px-3 py-2">
      <span className="text-sm text-gray-300">{label}</span>
      <button
        onClick={() => onToggle(!enabled)}
        className={`relative h-5 w-9 rounded-full transition-colors ${enabled ? 'bg-neon-500' : 'bg-ink-600'}`}
        role="switch"
        aria-checked={enabled}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${enabled ? 'translate-x-4' : 'translate-x-0.5'}`}
        />
      </button>
    </label>
  );
}

export { getDefaultScoring };
