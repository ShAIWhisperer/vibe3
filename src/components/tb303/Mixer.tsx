import React from 'react';
import { Volume2, VolumeX, Headphones, Drum } from 'lucide-react';
import { type ModuleId, type MixerState, MODULE_CONFIGS } from '@/hooks/use-multi-synth-engine';
import { Knob } from './Knob';

interface MixerProps {
  mixer: MixerState;
  onChannelChange: (id: ModuleId, updates: {volume?: number;pan?: number;mute?: boolean;solo?: boolean;}) => void;
  onMasterChange: (volume: number) => void;
  isPlaying: boolean;
  // Drum channel props
  drumVolume?: number;
  drumMute?: boolean;
  onDrumVolumeChange?: (volume: number) => void;
  onDrumMuteToggle?: () => void;
}

function ChannelStrip({
  id,
  name,
  color,
  volume,
  pan,
  mute,
  solo,
  onVolumeChange,
  onPanChange,
  onMuteToggle,
  onSoloToggle,
  isPlaying,
  icon














}: {id: string;name: string;color: string;volume: number;pan: number;mute: boolean;solo: boolean;onVolumeChange: (v: number) => void;onPanChange: (v: number) => void;onMuteToggle: () => void;onSoloToggle: () => void;isPlaying: boolean;icon?: React.ReactNode;}) {
  return (
    <div className="flex flex-col items-center gap-2 p-3 bg-zinc-800/50 rounded-xl border border-zinc-700/50">
      {/* Channel label */}
      <div
      className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider px-2 py-1 rounded"
      style={{ color, backgroundColor: `${color}20` }}>

        {icon}
        {name}
      </div>
      
      {/* Volume knob */}
      <div className="relative">
        <Knob
          value={volume}
          onChange={onVolumeChange}
          size={48}
          color={mute ? '#666' : color}
          label="" />

        {/* Simple level indicator */}
        {isPlaying && !mute &&
        <div
        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 rounded-full transition-all"
        style={{
          height: `${8 + Math.random() * 12}px`,
          backgroundColor: color,
          opacity: 0.8
        }} />

        }
      </div>
      <span className="text-[10px] text-zinc-500">VOL</span>
      
      {/* Pan control */}
      <div className="flex items-center gap-1 text-[10px] text-zinc-500">
        <span>L</span>
        <input
        type="range"
        min="-1"
        max="1"
        step="0.1"
        value={pan}
        onChange={(e) => onPanChange(parseFloat(e.target.value))}
        className="w-12 h-1 appearance-none bg-zinc-700 rounded-full cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none
            [&::-webkit-slider-thumb]:w-2
            [&::-webkit-slider-thumb]:h-2
            [&::-webkit-slider-thumb]:rounded-full
            [&::-webkit-slider-thumb]:bg-white
            [&::-webkit-slider-thumb]:cursor-pointer" />







        <span>R</span>
      </div>
      
      {/* Mute/Solo buttons */}
      <div className="flex gap-1">
        <button
        onClick={onMuteToggle}
        className={`p-1.5 rounded transition-all ${
        mute ?
        'bg-red-500/20 text-red-400 border border-red-500/50' :
        'bg-zinc-700/50 text-zinc-500 border border-transparent hover:bg-zinc-700'}`
        }
        title="Mute">

          {mute ? <VolumeX size={12} /> : <Volume2 size={12} />}
        </button>
        <button
        onClick={onSoloToggle}
        className={`p-1.5 rounded transition-all ${
        solo ?
        'bg-amber-500/20 text-amber-400 border border-amber-500/50' :
        'bg-zinc-700/50 text-zinc-500 border border-transparent hover:bg-zinc-700'}`
        }
        title="Solo">

          <Headphones size={12} />
        </button>
      </div>
    </div>);

}

// Simplified drum channel strip (no pan/solo for the main drums bus)
function DrumChannelStrip({
  volume,
  mute,
  onVolumeChange,
  onMuteToggle,
  isPlaying






}: {volume: number;mute: boolean;onVolumeChange: (v: number) => void;onMuteToggle: () => void;isPlaying: boolean;}) {
  const color = '#f59e0b'; // Amber for drums

  return (
    <div className="flex flex-col items-center gap-2 p-3 bg-zinc-800/50 rounded-xl border border-amber-700/30">
      {/* Channel label */}
      <div
      className="flex items-center gap-1 text-xs font-bold uppercase tracking-wider px-2 py-1 rounded"
      style={{ color, backgroundColor: `${color}20` }}>

        <Drum size={12} />
        Drums
      </div>
      
      {/* Volume knob */}
      <div className="relative">
        <Knob
          value={volume}
          onChange={onVolumeChange}
          size={48}
          color={mute ? '#666' : color}
          label="" />

        {/* Simple level indicator */}
        {isPlaying && !mute &&
        <div
        className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 rounded-full transition-all"
        style={{
          height: `${8 + Math.random() * 12}px`,
          backgroundColor: color,
          opacity: 0.8
        }} />

        }
      </div>
      <span className="text-[10px] text-zinc-500">VOL</span>
      
      {/* Mute button only */}
      <div className="flex gap-1 mt-1">
        <button
        onClick={onMuteToggle}
        className={`p-1.5 rounded transition-all ${
        mute ?
        'bg-red-500/20 text-red-400 border border-red-500/50' :
        'bg-zinc-700/50 text-zinc-500 border border-transparent hover:bg-zinc-700'}`
        }
        title="Mute Drums">

          {mute ? <VolumeX size={12} /> : <Volume2 size={12} />}
        </button>
      </div>
    </div>);

}

export function Mixer({
  mixer,
  onChannelChange,
  onMasterChange,
  isPlaying,
  drumVolume = 0.8,
  drumMute = false,
  onDrumVolumeChange,
  onDrumMuteToggle
}: MixerProps) {
  const modules: ModuleId[] = ['bass', 'lead', 'arp'];

  return (
    <div className="flex items-end gap-3 p-4 bg-zinc-900/50 rounded-xl border border-zinc-800">
      {/* Module channels */}
      {modules.map((id) => {
        const config = MODULE_CONFIGS[id];
        const channel = mixer[id];

        return (
          <ChannelStrip
            key={id}
            id={id}
            name={config.name}
            color={config.color}
            volume={channel.volume}
            pan={channel.pan}
            mute={channel.mute}
            solo={channel.solo}
            onVolumeChange={(v) => onChannelChange(id, { volume: v })}
            onPanChange={(v) => onChannelChange(id, { pan: v })}
            onMuteToggle={() => onChannelChange(id, { mute: !channel.mute })}
            onSoloToggle={() => onChannelChange(id, { solo: !channel.solo })}
            isPlaying={isPlaying} />);


      })}
      
      {/* Drum channel */}
      {onDrumVolumeChange && onDrumMuteToggle &&
      <>
          <div className="w-px h-32 bg-zinc-700/50 mx-1" />
          <DrumChannelStrip
          volume={drumVolume}
          mute={drumMute}
          onVolumeChange={onDrumVolumeChange}
          onMuteToggle={onDrumMuteToggle}
          isPlaying={isPlaying} />

        </>
      }
      
      {/* Divider */}
      <div className="w-px h-32 bg-zinc-700/50 mx-1" />
      
      {/* Master channel */}
      <div className="flex flex-col items-center gap-2 p-3 bg-zinc-800/30 rounded-xl border border-zinc-600/30">
        <div className="text-xs font-bold uppercase tracking-wider text-zinc-300 px-2 py-1">
          Master
        </div>
        
        <Knob
          value={mixer.master}
          onChange={onMasterChange}
          size={56}
          color="#fff"
          label="" />

        <span className="text-[10px] text-zinc-500">VOL</span>
        
        {/* Master level indicator */}
        {isPlaying &&
        <div className="flex gap-0.5 h-3">
            {[...Array(8)].map((_, i) =>
          <div
          key={i}
          className="w-1 rounded-full transition-all"
          style={{
            height: `${4 + Math.random() * 8}px`,
            backgroundColor: i < 6 ? '#22c55e' : i < 7 ? '#eab308' : '#ef4444',
            opacity: Math.random() > 0.3 ? 0.9 : 0.3
          }} />

          )}
          </div>
        }
      </div>
    </div>);

}