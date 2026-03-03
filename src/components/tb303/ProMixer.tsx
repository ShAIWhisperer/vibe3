import React from 'react';
import { RotateCcw, ChevronLeft } from 'lucide-react';
import { ProChannelStrip } from './ProChannelStrip';
import { ProAuxReturn } from './ProAuxReturn';
import { ProMasterStrip } from './ProMasterStrip';
import { MODULE_CONFIGS } from '@/hooks/use-multi-synth-engine';
import type { ProMixerState, ProMixerChannelId, AuxEffectId } from '@/audio/pro-mixer-types';
import { SYNTH_CHANNEL_IDS, DRUM_CHANNEL_IDS, MIXER_PRESETS } from '@/audio/pro-mixer-types';

interface ProMixerProps {
  state: ProMixerState;
  levels: {
    channels: Record<ProMixerChannelId, number>;
    master: { left: number; right: number };
  };
  drumTrackNames: string[];
  onChannelParam: (channelId: ProMixerChannelId, path: string, value: number | boolean) => void;
  onAuxParam: (effectId: AuxEffectId, path: string, value: number | boolean | string) => void;
  onMasterParam: (path: string, value: number | boolean | string) => void;
  onReset: () => void;
  onPreset: (presetId: string) => void;
  onSwitchToBasic: () => void;
}

const SYNTH_COLORS: Record<string, string> = {
  bass: MODULE_CONFIGS.bass.color,
  lead: MODULE_CONFIGS.lead.color,
  arp: MODULE_CONFIGS.arp.color,
};

export const ProMixer = React.memo(function ProMixer({
  state,
  levels,
  drumTrackNames,
  onChannelParam,
  onAuxParam,
  onMasterParam,
  onReset,
  onPreset,
  onSwitchToBasic,
}: ProMixerProps) {
  return (
    <div
      className="rounded-xl border border-zinc-700/60 overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #1e1e1e, #171717)' }}
    >
      {/* Header bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-zinc-700/40" style={{ background: '#222' }}>
        <div className="flex items-center gap-3">
          <span className="text-[11px] font-black text-zinc-200 uppercase tracking-widest">PRO MIXER</span>
          <div className="flex gap-1">
            {MIXER_PRESETS.map(p => (
              <button
                key={p.id}
                onClick={() => p.id === 'init' ? onReset() : onPreset(p.id)}
                className="px-2 py-0.5 text-[9px] font-bold rounded-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-500 hover:text-zinc-200 transition-colors border border-zinc-700/50"
                title={p.description}
              >
                {p.name}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={onReset}
            className="p-1 rounded hover:bg-zinc-700 text-zinc-500 hover:text-zinc-300 transition-colors"
            title="Reset all"
          >
            <RotateCcw size={13} />
          </button>
          <button
            onClick={onSwitchToBasic}
            className="flex items-center gap-0.5 px-2 py-1 text-[9px] font-bold rounded-sm bg-zinc-800 hover:bg-zinc-700 text-zinc-500 hover:text-zinc-200 border border-zinc-700/50 transition-colors"
          >
            <ChevronLeft size={11} />
            Basic
          </button>
        </div>
      </div>

      {/* Channel strips + Master */}
      <div className="flex p-2 gap-0">
        {/* Synth channels */}
        <div className="flex gap-0.5 flex-shrink-0">
          {SYNTH_CHANNEL_IDS.map(id => (
            <ProChannelStrip
              key={id}
              channelId={id}
              label={MODULE_CONFIGS[id as keyof typeof MODULE_CONFIGS]?.name ?? id}
              color={SYNTH_COLORS[id] ?? '#888'}
              state={state.channels[id]}
              level={levels.channels[id]}
              onParamChange={(path, value) => onChannelParam(id, path, value)}
            />
          ))}
        </div>

        {/* Separator line */}
        <div className="w-px bg-zinc-700/40 mx-1.5 self-stretch flex-shrink-0" />

        {/* Drum channels — scrollable */}
        <div className="flex-1 overflow-x-auto scrollbar-hide">
          <div className="flex gap-0.5 min-w-min">
            {DRUM_CHANNEL_IDS.map((id, i) => (
              <ProChannelStrip
                key={id}
                channelId={id}
                label={drumTrackNames[i] ?? `D${i + 1}`}
                color="#f59e0b"
                state={state.channels[id]}
                level={levels.channels[id]}
                onParamChange={(path, value) => onChannelParam(id, path, value)}
              />
            ))}
          </div>
        </div>

        {/* Separator line */}
        <div className="w-px bg-zinc-600/50 mx-1.5 self-stretch flex-shrink-0" />

        {/* Master */}
        <ProMasterStrip
          state={state.master}
          levels={levels.master}
          onMasterParam={onMasterParam}
        />
      </div>

      {/* AUX Returns */}
      <div className="px-3 pb-2.5 pt-1 border-t border-zinc-700/30">
        <div className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest mb-1.5">AUX RETURNS</div>
        <ProAuxReturn auxReturns={state.auxReturns} onAuxParam={onAuxParam} />
      </div>
    </div>
  );
});
