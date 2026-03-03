import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
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

/** Vertical fader styled like a real console */
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
      {/* dB tick marks */}
      <div className="absolute left-0 top-0 bottom-0 w-2 flex flex-col justify-between py-1">
        {[0, -6, -12, -24, -48].map((db) => (
          <div key={db} className="flex items-center">
            <div className="w-1.5 h-px bg-zinc-600" />
          </div>
        ))}
      </div>
      {/* Track groove */}
      <div className="relative w-2 flex-1 mx-3 rounded-full overflow-hidden" style={{ backgroundColor: '#111' }}>
        <div
          className="absolute bottom-0 left-0 right-0 rounded-full transition-[height] duration-75"
          style={{
            height: `${value * 100}%`,
            background: disabled ? '#444' : `linear-gradient(to top, ${color}88, ${color})`,
          }}
        />
      </div>
      {/* Invisible range input */}
      <input
        type="range"
        min={0}
        max={1}
        step={0.005}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="absolute inset-0 w-full opacity-0 cursor-pointer"
        style={{ writingMode: 'vertical-lr', direction: 'rtl' }}
      />
      {/* Fader thumb */}
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

/** Horizontal pan slider — L/R matches visual direction */
function PanSlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const pct = ((value + 1) / 2) * 100; // -1..1 → 0..100
  return (
    <div className="w-full px-1">
      <div className="flex items-center gap-1">
        <span className="text-[7px] text-zinc-600 select-none">L</span>
        <div className="relative flex-1 h-3 flex items-center">
          {/* Track */}
          <div className="w-full h-[3px] rounded-full bg-zinc-700 relative">
            {/* Center notch */}
            <div className="absolute left-1/2 -translate-x-px top-[-1px] w-[2px] h-[5px] bg-zinc-500 rounded-full" />
            {/* Fill from center */}
            <div
              className="absolute top-0 h-full rounded-full bg-zinc-400"
              style={{
                left: value < 0 ? `${pct}%` : '50%',
                width: `${Math.abs(value) * 50}%`,
              }}
            />
          </div>
          {/* Input */}
          <input
            type="range"
            min={-1}
            max={1}
            step={0.05}
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value))}
            className="absolute inset-0 w-full opacity-0 cursor-pointer"
          />
        </div>
        <span className="text-[7px] text-zinc-600 select-none">R</span>
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
  const [showComp, setShowComp] = useState(false);

  return (
    <div
      className="flex flex-col items-center w-[76px] flex-shrink-0 rounded-lg border border-zinc-700/40 overflow-hidden"
      style={{ background: 'linear-gradient(180deg, #232323, #1a1a1a)' }}
    >
      {/* Channel label */}
      <div
        className="w-full text-center text-[9px] font-bold uppercase tracking-wide py-1 truncate px-1"
        style={{ color, backgroundColor: `${color}18` }}
      >
        {label}
      </div>

      {/* Mute / Solo */}
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

      {/* ── EQ (always visible) ── */}
      <div className="w-full px-1 py-1 border-t border-zinc-700/30">
        <div className="text-[7px] text-zinc-500 font-bold text-center mb-0.5">EQ</div>
        <div className="flex justify-center gap-[2px]">
          <MiniKnob value={state.eq.low.gain} onChange={(v) => onParamChange('eq.low.gain', v)} label="Lo" min={-12} max={12} color={color} />
          <MiniKnob value={state.eq.mid.gain} onChange={(v) => onParamChange('eq.mid.gain', v)} label="Mid" min={-12} max={12} color={color} />
          <MiniKnob value={state.eq.high.gain} onChange={(v) => onParamChange('eq.high.gain', v)} label="Hi" min={-12} max={12} color={color} />
        </div>
      </div>

      {/* ── AUX Sends (always visible) ── */}
      <div className="w-full px-1 py-1 border-t border-zinc-700/30">
        <div className="text-[7px] text-zinc-500 font-bold text-center mb-0.5">SEND</div>
        <div className="grid grid-cols-2 gap-x-[2px] gap-y-0.5 justify-items-center">
          <MiniKnob value={state.auxSends.delay} onChange={(v) => onParamChange('auxSends.delay', v)} label="Dly" color="#60a5fa" />
          <MiniKnob value={state.auxSends.chorus} onChange={(v) => onParamChange('auxSends.chorus', v)} label="Chr" color="#a78bfa" />
          <MiniKnob value={state.auxSends.reverb} onChange={(v) => onParamChange('auxSends.reverb', v)} label="Rev" color="#34d399" />
          <MiniKnob value={state.auxSends.flanger} onChange={(v) => onParamChange('auxSends.flanger', v)} label="Flg" color="#fb923c" />
        </div>
      </div>

      {/* ── Compressor (collapsible) ── */}
      <button
        onClick={() => setShowComp(!showComp)}
        className="flex items-center justify-center gap-0.5 w-full py-0.5 text-[7px] text-zinc-600 hover:text-zinc-400 transition-colors border-t border-zinc-700/30"
      >
        {showComp ? <ChevronDown size={8} /> : <ChevronRight size={8} />}
        COMP
      </button>
      {showComp && (
        <div className="flex justify-center gap-[2px] pb-1">
          <MiniKnob value={state.compressor.threshold} onChange={(v) => onParamChange('compressor.threshold', v)} label="Thr" min={-60} max={0} color={color} />
          <MiniKnob value={state.compressor.ratio} onChange={(v) => onParamChange('compressor.ratio', v)} label="Rat" min={1} max={20} color={color} />
          <MiniKnob value={state.compressor.makeup} onChange={(v) => onParamChange('compressor.makeup', v)} label="Mkp" min={0.25} max={4} color={color} />
        </div>
      )}

      {/* ── Pan slider ── */}
      <div className="w-full border-t border-zinc-700/30 py-1">
        <PanSlider value={state.pan} onChange={(v) => onParamChange('pan', v)} />
      </div>

      {/* ── Fader + Meter ── */}
      <div className="flex items-end gap-0.5 px-1 pt-1 pb-1 flex-1 border-t border-zinc-700/30">
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
        {state.volume > 0 ? `${(20 * Math.log10(state.volume)).toFixed(0)}dB` : '-inf'}
      </div>
    </div>
  );
});

/** Tiny knob for EQ/Send/Comp sections */
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
      <Knob value={value} onChange={onChange} label="" min={min} max={max} size={26} color={color} />
      <span className="text-[7px] text-zinc-500 leading-none mt-0.5">{label}</span>
    </div>
  );
}
