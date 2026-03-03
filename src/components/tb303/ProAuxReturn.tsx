import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Knob } from './Knob';
import type { AuxEffectId, AuxReturnState } from '@/audio/pro-mixer-types';

interface ProAuxReturnProps {
  auxReturns: AuxReturnState;
  onAuxParam: (effectId: AuxEffectId, path: string, value: number | boolean | string) => void;
}

const AUX_COLORS: Record<AuxEffectId, string> = {
  delay: '#60a5fa',
  chorus: '#a78bfa',
  reverb: '#34d399',
  flanger: '#fb923c',
};

interface AuxConfig {
  id: AuxEffectId;
  label: string;
  knobs: { path: string; label: string; min?: number; max?: number }[];
}

const AUX_CONFIGS: AuxConfig[] = [
  {
    id: 'delay',
    label: 'DELAY',
    knobs: [
      { path: 'params.time', label: 'TIME', min: 0.01, max: 2 },
      { path: 'params.feedback', label: 'FDBK', max: 0.95 },
      { path: 'params.filterCutoff', label: 'TONE', min: 200, max: 8000 },
      { path: 'params.wetDry', label: 'MIX' },
    ],
  },
  {
    id: 'chorus',
    label: 'CHORUS',
    knobs: [
      { path: 'params.rate', label: 'RATE', min: 0.1, max: 10 },
      { path: 'params.depth', label: 'DEPTH' },
      { path: 'params.wetDry', label: 'MIX' },
    ],
  },
  {
    id: 'reverb',
    label: 'REVERB',
    knobs: [
      { path: 'params.roomSize', label: 'SIZE' },
      { path: 'params.damping', label: 'DAMP' },
      { path: 'params.preDelay', label: 'PRE', min: 0, max: 100 },
      { path: 'params.wetDry', label: 'MIX' },
    ],
  },
  {
    id: 'flanger',
    label: 'FLANGER',
    knobs: [
      { path: 'params.rate', label: 'RATE', min: 0.05, max: 5 },
      { path: 'params.depth', label: 'DEPTH' },
      { path: 'params.feedback', label: 'FDBK', min: -0.95, max: 0.95 },
      { path: 'params.wetDry', label: 'MIX' },
    ],
  },
];

function getNestedValue(obj: Record<string, unknown>, path: string): number {
  const parts = path.split('.');
  let v: unknown = obj;
  for (const p of parts) v = (v as Record<string, unknown>)[p];
  return v as number;
}

export const ProAuxReturn = React.memo(function ProAuxReturn({
  auxReturns,
  onAuxParam,
}: ProAuxReturnProps) {
  const [openId, setOpenId] = useState<AuxEffectId | null>(null);

  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1">
      {AUX_CONFIGS.map(({ id, label, knobs }) => {
        const color = AUX_COLORS[id];
        const isOpen = openId === id;
        const returnLevel = auxReturns[id].returnLevel;

        return (
          <div
            key={id}
            className="flex-shrink-0 rounded-lg border overflow-hidden"
            style={{
              borderColor: `${color}30`,
              background: 'linear-gradient(180deg, #222, #1a1a1a)',
              minWidth: isOpen ? undefined : 60,
            }}
          >
            {/* Header */}
            <button
              onClick={() => setOpenId(isOpen ? null : id)}
              className="w-full flex items-center justify-center gap-1 px-2 py-1.5 transition-colors"
              style={{ backgroundColor: `${color}15` }}
            >
              {isOpen ? <ChevronDown size={9} style={{ color }} /> : <ChevronRight size={9} style={{ color }} />}
              <span className="text-[9px] font-bold uppercase tracking-wider" style={{ color }}>
                {label}
              </span>
            </button>

            {/* Collapsed: just return level */}
            {!isOpen && (
              <div className="flex flex-col items-center py-2 px-1">
                <Knob
                  value={returnLevel}
                  onChange={(v) => onAuxParam(id, 'returnLevel', v)}
                  label="RTN"
                  size={30}
                  color={color}
                />
              </div>
            )}

            {/* Expanded: all knobs in a clean row */}
            {isOpen && (
              <div className="flex items-end gap-2 p-2.5">
                {knobs.map((k) => (
                  <Knob
                    key={k.path}
                    value={getNestedValue(auxReturns[id] as unknown as Record<string, unknown>, k.path)}
                    onChange={(v) => onAuxParam(id, k.path, v)}
                    label={k.label}
                    min={k.min ?? 0}
                    max={k.max ?? 1}
                    size={32}
                    color={color}
                  />
                ))}
                {/* Separator + Return */}
                <div className="w-px h-10 bg-zinc-700/50" />
                <Knob
                  value={returnLevel}
                  onChange={(v) => onAuxParam(id, 'returnLevel', v)}
                  label="RTN"
                  size={32}
                  color={color}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
});
