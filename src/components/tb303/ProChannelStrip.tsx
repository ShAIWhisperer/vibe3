import React, { useState } from 'react';
import { VolumeX, Headphones, ChevronDown, ChevronRight } from 'lucide-react';
import { Knob } from './Knob';
import { LevelMeter } from './LevelMeter';
import type { ProMixerChannelId, ChannelStripState } from '@/audio/pro-mixer-types';

interface ProChannelStripProps {
  channelId: ProMixerChannelId;
  label: string;
  color: string;
  state: ChannelStripState;
  level: number;
  onParamChange: (path: string, value: number | boolean) => void;
}

/** Vertical fader component styled like a real console */
function Fader({
  value,
  onChange,
  color,
  disabled,
}: {
  value: number;
  onChange: (v: number) => void;
  color: string;
  disabled?: boolean;
}) {
  return (
    <div className="relative flex flex-col items-center" style={{ height: 100 }}>
      {/* dB markings */}
      <div className="absolute left-0 top-0 bottom-0 w-2 flex flex-col justify-between py-1">
        {[0, -6, -12, -24, -48].map((db, i) => (
          <div key={db} className="flex items-center">
            <div className="w-1.5 h-px bg-zinc-600" />
          </div>
        ))}
      </div>
      {/* Track groove */}
      <div className="relative w-2 flex-1 mx-3 rounded-full overflow-hidden" style={{ backgroundColor: '#111' }}>
        {/* Fill */}
        <div
          className="absolute bottom-0 left-0 right-0 rounded-full transition-[height] duration-75"
          style={{
            height: `${value * 100}%`,
            background: disabled
              ? '#444'
              : `linear-gradient(to top, ${color}88, ${color})`,
          }}
        />
      </div>
      {/* Slider input (invisible, overlaid) */}
      <input
        type="range"
        min={0}
        max={1}
        step={0.005}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="absolute inset-0 w-full opacity-0 cursor-pointer"
        style={{
          writingMode: 'vertical-lr',
          direction: 'rtl',
        }}
      />
      {/* Thumb indicator */}
      <div
        className="absolute left-1/2 -translate-x-1/2 w-6 h-2.5 rounded-sm pointer-events-none"
        style={{
          bottom: `calc(${value * 100}% - 5px)`,
          background: 'linear-gradient(180deg, #555, #333)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2), 0 1px 3px rgba(0,0,0,0.5)',
          border: '1px solid #222',
        }}
      >
        <div className="w-4 h-px bg-zinc-500 mx-auto mt-[4px]" />
      </div>
    </div>
  );
}

export const ProChannelStrip = React.memo(function ProChannelStrip({
  channelId,
  label,
  color,
  state,
  level,
  onParamChange,
}: ProChannelStripProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="flex flex-col items-center w-[62px] flex-shrink-0 bg-zinc-850 rounded-lg border border-zinc-700/40 overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #232323, #1a1a1a)' }}
    >
      {/* Channel label */}
      <div
        className="w-full text-center text-[9px] font-bold uppercase tracking-wide py-1 truncate px-1"
        style={{ color, backgroundColor: `${color}18` }}
      >
        {label}
      </div>

      {/* Mute / Solo buttons */}
      <div className="flex gap-1 py-1.5">
        <button
          onClick={() => onParamChange('mute', !state.mute)}
          className={`w-6 h-5 rounded text-[8px] font-black transition-all ${
            state.mute
              ? 'bg-red-500 text-white shadow-sm shadow-red-500/40'
              : 'bg-zinc-700/60 text-zinc-500 hover:bg-zinc-600'
          }`}
        >
          M
        </button>
        <button
          onClick={() => onParamChange('solo', !state.solo)}
          className={`w-6 h-5 rounded text-[8px] font-black transition-all ${
            state.solo
              ? 'bg-amber-400 text-black shadow-sm shadow-amber-400/40'
              : 'bg-zinc-700/60 text-zinc-500 hover:bg-zinc-600'
          }`}
        >
          S
        </button>
      </div>

      {/* Pan knob (small) */}
      <div className="py-1">
        <Knob
          value={state.pan}
          onChange={(v) => onParamChange('pan', v)}
          label="PAN"
          min={-1}
          max={1}
          size={26}
          color="#888"
        />
      </div>

      {/* Expand toggle for EQ/Comp/Sends */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center justify-center gap-0.5 w-full py-0.5 text-[7px] text-zinc-600 hover:text-zinc-400 transition-colors border-t border-b border-zinc-700/30"
      >
        {expanded ? <ChevronDown size={8} /> : <ChevronRight size={8} />}
        {expanded ? 'LESS' : 'MORE'}
      </button>

      {/* Expandable: EQ, Comp, AUX sends */}
      {expanded && (
        <div className="flex flex-col items-center gap-1 py-1.5 border-b border-zinc-700/30 w-full px-1">
          {/* EQ */}
          <div className="text-[7px] text-zinc-500 font-bold">EQ</div>
          <div className="flex gap-px justify-center">
            <MiniKnob value={state.eq.low.gain} onChange={(v) => onParamChange('eq.low.gain', v)} label="L" min={-12} max={12} color={color} />
            <MiniKnob value={state.eq.mid.gain} onChange={(v) => onParamChange('eq.mid.gain', v)} label="M" min={-12} max={12} color={color} />
            <MiniKnob value={state.eq.high.gain} onChange={(v) => onParamChange('eq.high.gain', v)} label="H" min={-12} max={12} color={color} />
          </div>
          {/* Compressor */}
          <div className="text-[7px] text-zinc-500 font-bold mt-0.5">COMP</div>
          <div className="flex gap-px justify-center">
            <MiniKnob value={state.compressor.threshold} onChange={(v) => onParamChange('compressor.threshold', v)} label="T" min={-60} max={0} color={color} />
            <MiniKnob value={state.compressor.ratio} onChange={(v) => onParamChange('compressor.ratio', v)} label="R" min={1} max={20} color={color} />
          </div>
          {/* AUX sends */}
          <div className="text-[7px] text-zinc-500 font-bold mt-0.5">SEND</div>
          <div className="grid grid-cols-2 gap-px">
            <MiniKnob value={state.auxSends.delay} onChange={(v) => onParamChange('auxSends.delay', v)} label="D" color="#60a5fa" />
            <MiniKnob value={state.auxSends.chorus} onChange={(v) => onParamChange('auxSends.chorus', v)} label="C" color="#a78bfa" />
            <MiniKnob value={state.auxSends.reverb} onChange={(v) => onParamChange('auxSends.reverb', v)} label="R" color="#34d399" />
            <MiniKnob value={state.auxSends.flanger} onChange={(v) => onParamChange('auxSends.flanger', v)} label="F" color="#fb923c" />
          </div>
        </div>
      )}

      {/* Fader + Meter area */}
      <div className="flex items-end gap-0.5 px-1 pt-1 pb-1.5 flex-1">
        <Fader
          value={state.volume}
          onChange={(v) => onParamChange('volume', v)}
          color={color}
          disabled={state.mute}
        />
        <LevelMeter level={state.mute ? 0 : level} height={100} />
      </div>

      {/* dB readout */}
      <div className="text-[8px] text-zinc-500 font-mono pb-1">
        {state.volume > 0 ? `${(20 * Math.log10(state.volume)).toFixed(0)}` : '-inf'}
      </div>
    </div>
  );
});

/** Tiny knob for expandable sections */
function MiniKnob({
  value,
  onChange,
  label,
  min = 0,
  max = 1,
  color,
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
  min?: number;
  max?: number;
  color: string;
}) {
  return (
    <div className="flex flex-col items-center">
      <Knob value={value} onChange={onChange} label="" min={min} max={max} size={18} color={color} />
      <span className="text-[6px] text-zinc-500 leading-none mt-0.5">{label}</span>
    </div>
  );
}
