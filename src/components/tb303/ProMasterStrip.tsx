import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Shield } from 'lucide-react';
import { Knob } from './Knob';
import { LevelMeter } from './LevelMeter';
import type { MasterBusState, MasterFilterType } from '@/audio/pro-mixer-types';

const FILTER_TYPES: { id: MasterFilterType; label: string }[] = [
  { id: 'lowpass', label: 'LP' },
  { id: 'highpass', label: 'HP' },
  { id: 'bandpass', label: 'BP' },
  { id: 'notch', label: 'BSF' },
];

interface ProMasterStripProps {
  state: MasterBusState;
  levels: { left: number; right: number };
  onMasterParam: (path: string, value: number | boolean | string) => void;
}

export const ProMasterStrip = React.memo(function ProMasterStrip({
  state,
  levels,
  onMasterParam,
}: ProMasterStripProps) {
  const [expanded, setExpanded] = useState(false);
  const [filterExpanded, setFilterExpanded] = useState(false);
  const [reverbExpanded, setReverbExpanded] = useState(false);

  return (
    <div
      className="flex flex-col items-center w-[80px] flex-shrink-0 rounded-lg border border-zinc-600/40 overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #282828, #1c1c1c)' }}
    >
      {/* Label */}
      <div className="w-full text-center text-[10px] font-black uppercase tracking-widest py-1.5 bg-zinc-700/30 text-zinc-200">
        MASTER
      </div>

      {/* Limiter badge */}
      <div className="flex items-center gap-1 py-1">
        <Shield size={9} className={levels.left > 0.85 || levels.right > 0.85 ? 'text-amber-400' : 'text-green-500'} />
        <span className="text-[8px] text-zinc-500 font-mono">{state.limiter.threshold}dB</span>
      </div>

      {/* Expand for EQ/Comp */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-center gap-0.5 w-full py-0.5 text-[7px] text-zinc-600 hover:text-zinc-400 transition-colors border-t border-b border-zinc-700/30"
      >
        {expanded ? <ChevronDown size={8} /> : <ChevronRight size={8} />}
        {expanded ? 'LESS' : 'EQ/COMP'}
      </button>

      {expanded && (
        <div className="flex flex-col items-center gap-1.5 py-2 w-full px-1 border-b border-zinc-700/30">
          <div className="text-[7px] text-zinc-500 font-bold">EQ</div>
          <div className="flex gap-1 justify-center">
            <Knob value={state.eq.low.gain} onChange={(v) => onMasterParam('eq.low.gain', v)} label="Lo" min={-12} max={12} size={22} color="#fff" />
            <Knob value={state.eq.mid.gain} onChange={(v) => onMasterParam('eq.mid.gain', v)} label="Mid" min={-12} max={12} size={22} color="#fff" />
            <Knob value={state.eq.high.gain} onChange={(v) => onMasterParam('eq.high.gain', v)} label="Hi" min={-12} max={12} size={22} color="#fff" />
          </div>
          <div className="text-[7px] text-zinc-500 font-bold mt-1">COMP</div>
          <div className="flex gap-1 justify-center">
            <Knob value={state.compressor.threshold} onChange={(v) => onMasterParam('compressor.threshold', v)} label="Thr" min={-60} max={0} size={22} color="#fff" />
            <Knob value={state.compressor.ratio} onChange={(v) => onMasterParam('compressor.ratio', v)} label="Rat" min={1} max={20} size={22} color="#fff" />
          </div>
        </div>
      )}

      {/* Filter Section */}
      <button
        onClick={() => setFilterExpanded(!filterExpanded)}
        className="flex items-center justify-center gap-0.5 w-full py-0.5 text-[7px] text-zinc-600 hover:text-zinc-400 transition-colors border-b border-zinc-700/30"
      >
        {filterExpanded ? <ChevronDown size={8} /> : <ChevronRight size={8} />}
        <span className={state.filter.enabled ? 'text-cyan-400' : ''}>FILTER</span>
      </button>

      {filterExpanded && (
        <div className="flex flex-col items-center gap-1.5 py-2 w-full px-1 border-b border-zinc-700/30">
          {/* Enable toggle */}
          <button
            onClick={() => onMasterParam('filter.enabled', !state.filter.enabled)}
            className={`px-2 py-0.5 text-[7px] font-bold rounded-sm border transition-colors ${
              state.filter.enabled
                ? 'bg-cyan-600/40 border-cyan-500/60 text-cyan-300'
                : 'bg-zinc-800 border-zinc-700/50 text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {state.filter.enabled ? 'ON' : 'OFF'}
          </button>

          {/* Filter type selector */}
          <div className="flex gap-px w-full justify-center">
            {FILTER_TYPES.map(ft => (
              <button
                key={ft.id}
                onClick={() => onMasterParam('filter.type', ft.id)}
                className={`flex-1 py-0.5 text-[7px] font-bold transition-colors ${
                  state.filter.type === ft.id
                    ? 'bg-cyan-600/50 text-cyan-200'
                    : 'bg-zinc-800 text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {ft.label}
              </button>
            ))}
          </div>

          {/* Freq + Q knobs */}
          <div className="flex gap-1 justify-center">
            <Knob value={state.filter.frequency} onChange={(v) => onMasterParam('filter.frequency', v)} label="Freq" min={20} max={20000} size={22} color="#22d3ee" />
            <Knob value={state.filter.Q} onChange={(v) => onMasterParam('filter.Q', v)} label="Res" min={0.1} max={30} size={22} color="#22d3ee" />
          </div>
        </div>
      )}

      {/* Reverb Section */}
      <button
        onClick={() => setReverbExpanded(!reverbExpanded)}
        className="flex items-center justify-center gap-0.5 w-full py-0.5 text-[7px] text-zinc-600 hover:text-zinc-400 transition-colors border-b border-zinc-700/30"
      >
        {reverbExpanded ? <ChevronDown size={8} /> : <ChevronRight size={8} />}
        <span className={state.reverb.enabled ? 'text-purple-400' : ''}>REVERB</span>
      </button>

      {reverbExpanded && (
        <div className="flex flex-col items-center gap-1.5 py-2 w-full px-1 border-b border-zinc-700/30">
          {/* Enable toggle */}
          <button
            onClick={() => onMasterParam('reverb.enabled', !state.reverb.enabled)}
            className={`px-2 py-0.5 text-[7px] font-bold rounded-sm border transition-colors ${
              state.reverb.enabled
                ? 'bg-purple-600/40 border-purple-500/60 text-purple-300'
                : 'bg-zinc-800 border-zinc-700/50 text-zinc-500 hover:text-zinc-300'
            }`}
          >
            {state.reverb.enabled ? 'ON' : 'OFF'}
          </button>

          {/* Room Size + Damping knobs */}
          <div className="flex gap-1 justify-center">
            <Knob value={state.reverb.roomSize} onChange={(v) => onMasterParam('reverb.roomSize', v)} label="Size" min={0} max={1} size={22} color="#a855f7" />
            <Knob value={state.reverb.damping} onChange={(v) => onMasterParam('reverb.damping', v)} label="Damp" min={0} max={1} size={22} color="#a855f7" />
          </div>
          {/* Mix knob */}
          <div className="flex gap-1 justify-center">
            <Knob value={state.reverb.wetDry} onChange={(v) => onMasterParam('reverb.wetDry', v)} label="Mix" min={0} max={1} size={22} color="#a855f7" />
          </div>
        </div>
      )}

      {/* Fader + Stereo Meters */}
      <div className="flex items-end gap-1 px-1.5 pt-2 pb-1.5 flex-1">
        {/* Master fader */}
        <div className="relative flex flex-col items-center" style={{ height: 110 }}>
          <div className="relative w-3 flex-1 rounded-full overflow-hidden" style={{ backgroundColor: '#111' }}>
            <div
              className="absolute bottom-0 left-0 right-0 rounded-full transition-[height] duration-75"
              style={{ height: `${state.volume * 100}%`, background: 'linear-gradient(to top, #888, #fff)' }}
            />
          </div>
          <input
            type="range"
            min={0}
            max={1}
            step={0.005}
            value={state.volume}
            onChange={(e) => onMasterParam('volume', parseFloat(e.target.value))}
            className="absolute inset-0 w-full opacity-0 cursor-pointer"
            style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
          />
          {/* Thumb */}
          <div
            className="absolute left-1/2 -translate-x-1/2 w-7 h-3 rounded-sm pointer-events-none"
            style={{
              bottom: `calc(${state.volume * 100}% - 6px)`,
              background: 'linear-gradient(180deg, #666, #444)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.3), 0 1px 3px rgba(0,0,0,0.6)',
              border: '1px solid #333',
            }}
          >
            <div className="w-5 h-px bg-zinc-400 mx-auto mt-[5px]" />
          </div>
        </div>

        {/* Stereo meters */}
        <LevelMeter level={0} stereo leftLevel={levels.left} rightLevel={levels.right} height={110} />
      </div>

      {/* dB readout */}
      <div className="text-[9px] text-zinc-400 font-mono font-bold pb-1.5">
        {state.volume > 0 ? `${(20 * Math.log10(state.volume)).toFixed(1)}dB` : '-inf'}
      </div>
    </div>
  );
});
