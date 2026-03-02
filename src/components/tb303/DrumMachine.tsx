import { useState } from 'react';
import { type DrumState } from '@/hooks/use-drum-engine';
import { DrumSequencer } from './DrumSequencer';
import { GENRE_KITS, type GenreKit } from '@/utils/drum-samples';
import { getRandomDrumPattern, getPatternForKit, getSuggestedBpm, getSuggestedSwing } from '@/utils/drum-patterns';
import { Drum, ChevronDown, ChevronUp, Trash2, Shuffle, Power, Volume2 } from 'lucide-react';

interface DrumMachineProps {
  currentStep: number;
  isPlaying: boolean;
  // Drum engine from parent
  drumState: DrumState;
  currentKit: GenreKit;
  playSound: (channel: number, velocity?: number) => void;
  setKit: (kitId: string) => void;
  toggleStep: (step: number, channel: number, velocity?: number) => void;
  setChannelMix: (channel: number, updates: {volume?: number;pan?: number;mute?: boolean;}) => void;
  setMasterVolume: (vol: number) => void;
  setSwing: (swing: number) => void;
  setEnabled: (enabled: boolean) => void;
  setPattern: (pattern: DrumState['pattern']) => void;
  clearPattern: () => void;
  onBpmChange?: (bpm: number) => void;
}

export function DrumMachine({
  currentStep,
  isPlaying,
  drumState,
  currentKit: propKit,
  playSound,
  setKit,
  toggleStep,
  setChannelMix,
  setMasterVolume,
  setSwing,
  setEnabled,
  setPattern,
  clearPattern,
  onBpmChange
}: DrumMachineProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [showKitMenu, setShowKitMenu] = useState(false);

  // Defensive: fallback to first kit if currentKit is undefined
  const currentKit = propKit?.tracks ? propKit : GENRE_KITS.find((k) => k.id === drumState?.kitId) || GENRE_KITS[0];

  // Guard against undefined drumState or kit without tracks
  if (!drumState || !currentKit?.tracks) {
    return (
      <div className="bg-zinc-800/50 rounded-xl border border-zinc-700 p-4 text-zinc-500 text-sm">
        Loading drum machine...
      </div>);

  }

  const handleKitChange = (kitId: string) => {
    setKit(kitId);
    // Load the pattern for this kit
    const pattern = getPatternForKit(kitId);
    setPattern(pattern);
    // Update swing to kit's suggested value
    setSwing(getSuggestedSwing(kitId));
    // Update BPM if callback provided
    if (onBpmChange) {
      onBpmChange(getSuggestedBpm(kitId));
    }
    setShowKitMenu(false);
  };

  const handleRandomPattern = () => {
    const pattern = getRandomDrumPattern(drumState.kitId);
    setPattern(pattern);
  };

  const handleClear = () => {
    clearPattern();
  };

  return (
    <div className="bg-zinc-800/50 rounded-xl border border-zinc-700 overflow-hidden">
      {/* Header */}
      <div
      className="flex items-center justify-between p-3 cursor-pointer hover:bg-zinc-800/80 transition-colors"
      onClick={() => setIsExpanded(!isExpanded)}>

        <div className="flex items-center gap-3">
          <div
          className="w-8 h-8 rounded-lg flex items-center justify-center"
          style={{ background: `linear-gradient(135deg, ${currentKit.color}, ${currentKit.color}88)` }}>

            <Drum size={18} className="text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white">DRUMCORE</h3>
            <p className="text-[10px] text-zinc-500">
              {currentKit.name} • {currentKit.bpm} BPM
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Enable/Disable */}
          <button
          onClick={(e) => {
            e.stopPropagation();
            setEnabled(!drumState.enabled);
          }}
          className={`p-1.5 rounded-lg transition-colors ${
          drumState.enabled ?
          'text-white' :
          'bg-zinc-700 text-zinc-500'}`
          }
          style={{
            background: drumState.enabled ? `${currentKit.color}33` : undefined,
            color: drumState.enabled ? currentKit.color : undefined
          }}>

            <Power size={14} />
          </button>
          
          {/* Master Volume */}
          <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
            <Volume2 size={14} className="text-zinc-400" />
            <input
            type="range"
            min="0"
            max="100"
            value={drumState.masterVolume * 100}
            onChange={(e) => {
              const vol = parseInt(e.target.value) / 100;
              setMasterVolume(vol);
            }}
            className="w-16 h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer"
            style={{
              accentColor: currentKit.color
            }} />

          </div>
          
          {/* Expand/Collapse */}
          {isExpanded ?
          <ChevronUp size={18} className="text-zinc-400" /> :

          <ChevronDown size={18} className="text-zinc-400" />
          }
        </div>
      </div>
      
      {/* Content */}
      {isExpanded &&
      <div className="p-3 pt-0 border-t border-zinc-700/50">
          {/* Kit selector row */}
          <div className="flex flex-wrap gap-1.5 mb-3 mt-3">
            {GENRE_KITS.map((kit) =>
          <button
          key={kit.id}
          onClick={() => handleKitChange(kit.id)}
          className={`px-3 py-1.5 rounded-lg text-[11px] font-bold tracking-wider transition-all ${
          kit.id === drumState.kitId ?
          'text-white' :
          'bg-zinc-800 text-zinc-500 hover:text-zinc-300 border border-zinc-700'}`
          }
          style={{
            background: kit.id === drumState.kitId ? kit.color : undefined,
            borderColor: kit.id === drumState.kitId ? kit.color : undefined
          }}>

                {kit.name}
              </button>
          )}
          </div>
          
          {/* Controls row */}
          <div className="flex flex-wrap items-center gap-2 mb-3">
            {/* Swing */}
            <div className="flex items-center gap-2 px-2 py-1 bg-zinc-700/50 rounded-lg">
              <span className="text-[10px] text-zinc-400 tracking-wider">SWING</span>
              <input
            type="range"
            min="0"
            max="80"
            value={drumState.swing}
            onChange={(e) => {
              const swing = parseInt(e.target.value);
              setSwing(swing);
            }}
            className="w-16 h-1 bg-zinc-600 rounded-lg appearance-none cursor-pointer"
            style={{ accentColor: currentKit.color }} />

              <span className="text-[10px] text-zinc-300 w-8">{drumState.swing}%</span>
            </div>
            
            <div className="flex-1" />
            
            {/* Action buttons */}
            <button
          onClick={handleRandomPattern}
          className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[10px] sm:text-xs text-white font-bold transition-colors hover:brightness-110"
          style={{ background: currentKit.color }}>

              <Shuffle size={12} />
              RND
            </button>
            
            <button
          onClick={handleClear}
          className="flex items-center gap-1 px-2 py-1.5 bg-zinc-700 hover:bg-zinc-600 rounded-lg text-[10px] sm:text-xs text-zinc-300 transition-colors">

              <Trash2 size={12} />
              CLR
            </button>
          </div>
          
          {/* Kit info bar */}
          <div className="flex gap-4 mb-2 text-[10px] text-zinc-500 tracking-wider">
            <span>BPM: {currentKit.bpm} suggested</span>
            <span>SWING: {currentKit.swing}% suggested</span>
            <span>TRACKS: {currentKit.tracks.length}</span>
          </div>
          
          {/* Sequencer grid */}
          <DrumSequencer
          kit={currentKit}
          pattern={drumState.pattern}
          channelMix={drumState.channelMix}
          currentStep={currentStep}
          isPlaying={isPlaying}
          onToggleStep={(step, channel, vel) => {
            toggleStep(step, channel, vel);
          }}
          onPlaySound={playSound}
          onChannelMixChange={(channel, updates) => {
            setChannelMix(channel, updates);
          }} />

        </div>
      }
    </div>);

}