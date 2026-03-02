import { type DrumStep, type DrumChannelMix } from '@/hooks/use-drum-engine';
import { type GenreKit, GENRE_KITS } from '@/utils/drum-samples';
import { Volume2, VolumeX } from 'lucide-react';

// DRUMCORE Sequencer - exact port from Claude's genre-authentic drum machine

interface DrumSequencerProps {
  kit: GenreKit;
  pattern: DrumStep[];
  channelMix: DrumChannelMix[];
  currentStep: number;
  isPlaying: boolean;
  onToggleStep: (stepIndex: number, channelIndex: number, velocity?: number) => void;
  onPlaySound: (channelIndex: number) => void;
  onChannelMixChange: (channelIndex: number, updates: Partial<DrumChannelMix>) => void;
}

export function DrumSequencer({
  kit: propKit,
  pattern,
  channelMix,
  currentStep,
  isPlaying,
  onToggleStep,
  onPlaySound,
  onChannelMixChange
}: DrumSequencerProps) {
  // Defensive: ensure kit has tracks
  const kit = propKit?.tracks ? propKit : GENRE_KITS[0];

  const getStepState = (stepIndex: number, channelIndex: number) => {
    const step = pattern[stepIndex];
    return step?.sounds[channelIndex] || { active: false, velocity: 0.8 };
  };

  if (!kit?.tracks) {
    return <div className="text-zinc-500 text-sm p-4">Loading drum kit...</div>;
  }

  return (
    <div className="flex flex-col gap-1">
      {/* Header row - step indicators */}
      <div className="flex items-center gap-1 mb-1">
        <div className="w-16 sm:w-20" /> {/* Spacer for labels */}
        <div className="flex-1 flex gap-[2px]">
          {Array(16).fill(null).map((_, i) =>
          <div
          key={i}
          className={`flex-1 h-1.5 rounded-full transition-colors ${
          isPlaying && currentStep === i ?
          'bg-white' :
          i % 4 === 0 ?
          'bg-zinc-600' :
          'bg-zinc-800'}`
          }
          style={{
            background: isPlaying && currentStep === i ? kit.color : undefined
          }} />

          )}
        </div>
        <div className="w-20 sm:w-24" /> {/* Spacer for mixer */}
      </div>
      
      {/* Channel rows */}
      {kit.tracks.map((track, channelIndex) => {
        const mix = channelMix[channelIndex] || { volume: 1.0, pan: 0, mute: false };

        return (
          <div key={channelIndex} className="flex items-center gap-1">
            {/* Channel label - clickable to preview */}
            <button
            onClick={() => onPlaySound(channelIndex)}
            className={`w-16 sm:w-20 px-1 py-1.5 text-[9px] sm:text-[10px] font-mono tracking-wide rounded text-left truncate transition-colors ${
            mix.mute ?
            'bg-zinc-900 text-zinc-600' :
            'bg-zinc-800 text-zinc-300 hover:text-white'}`
            }
            style={{
              borderLeft: `2px solid ${mix.mute ? '#333' : kit.color}`
            }}>

              {track.name}
            </button>
            
            {/* Steps */}
            <div className="flex-1 flex gap-[2px]">
              {Array(16).fill(null).map((_, stepIndex) => {
                const state = getStepState(stepIndex, channelIndex);
                const isCurrent = isPlaying && currentStep === stepIndex;
                const isGroupStart = stepIndex % 4 === 0 && stepIndex > 0;

                return (
                  <button
                  key={stepIndex}
                  onClick={() => onToggleStep(stepIndex, channelIndex, 0.8)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    // Right-click for accent (velocity 1.0)
                    if (state.active) {
                      onToggleStep(stepIndex, channelIndex, state.velocity === 1 ? 0.8 : 1);
                    } else {
                      onToggleStep(stepIndex, channelIndex, 1);
                    }
                  }}
                  className={`
                      flex-1 h-7 sm:h-8 rounded-sm transition-all relative border
                      ${isGroupStart ? 'ml-1' : ''}
                      ${state.active ?
                  'border-transparent' :
                  isCurrent ?
                  'border-white/50 bg-zinc-700' :
                  'border-zinc-800 bg-zinc-900 hover:bg-zinc-800'}
                    `
                  }
                  style={{
                    background: state.active ? kit.color : undefined,
                    opacity: state.active ? state.velocity >= 1 ? 1 : 0.7 : undefined,
                    boxShadow: isCurrent && state.active ? `0 0 8px ${kit.color}` : undefined
                  }} />);


              })}
            </div>
            
            {/* Channel mixer controls */}
            <div className="w-20 sm:w-24 flex items-center gap-1">
              {/* Volume slider */}
              <input
              type="range"
              min="0"
              max="100"
              value={mix.volume * 100}
              onChange={(e) => onChannelMixChange(channelIndex, { volume: parseInt(e.target.value) / 100 })}
              className="w-12 sm:w-16 h-[3px] bg-zinc-700 rounded-lg appearance-none cursor-pointer"
              style={{
                accentColor: kit.color
              }}
              disabled={mix.mute} />

              
              {/* Mute button */}
              <button
              onClick={() => onChannelMixChange(channelIndex, { mute: !mix.mute })}
              className={`p-1 rounded transition-colors ${
              mix.mute ?
              'bg-red-500/30 text-red-400' :
              'text-zinc-500 hover:text-zinc-200'}`
              }>

                {mix.mute ? <VolumeX size={12} /> : <Volume2 size={12} />}
              </button>
            </div>
          </div>);

      })}
      
      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mt-2 text-[10px] text-zinc-500">
        <span>Click label to preview</span>
        <span>•</span>
        <span>Click step = toggle</span>
        <span>•</span>
        <span>Right-click = accent</span>
      </div>
    </div>);

}