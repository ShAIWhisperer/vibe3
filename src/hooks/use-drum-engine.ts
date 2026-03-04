import { useRef, useCallback, useState } from 'react';
import { createDrumSynth, GENRE_KITS, type GenreKit } from '@/utils/drum-samples';
import { getPatternForKit } from '@/utils/drum-patterns';
import type { ProMixerEngine } from '@/audio/pro-mixer-engine';
import type { ProMixerChannelId } from '@/audio/pro-mixer-types';

// Drum step - which sounds are active at each step
export interface DrumStep {
  sounds: Record<number, { active: boolean; velocity: number }>; // channel index -> state
}

// Channel mixer settings
export interface DrumChannelMix {
  volume: number;  // 0-1
  pan: number;     // -1 to 1
  mute: boolean;
}

export const DRUM_PATTERN_BANK_SIZE = 8;

// Full drum state
export interface DrumState {
  kitId: string;
  patternBank: DrumStep[][];      // 8 patterns, each is DrumStep[16]
  activePatternIndex: number;     // 0-7
  channelMix: DrumChannelMix[];
  masterVolume: number;
  swing: number;  // 0-100 (percentage)
  enabled: boolean;
}

const DEFAULT_CHANNEL_MIX: DrumChannelMix = {
  volume: 1.0,
  pan: 0,
  mute: false
};

const createEmptyPattern = (): DrumStep[] => 
  Array(16).fill(null).map(() => ({
    sounds: {}
  }));

// Get default pattern for house kit
const getDefaultPattern = (): DrumStep[] => {
  return getPatternForKit('house');
};

const createDefaultChannelMix = (): DrumChannelMix[] =>
  Array(8).fill(null).map(() => ({ ...DEFAULT_CHANNEL_MIX }));

export function useDrumEngine() {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const drumSynthRef = useRef<ReturnType<typeof createDrumSynth> | null>(null);
  const channelGainsRef = useRef<GainNode[]>([]);
  const channelPansRef = useRef<StereoPannerNode[]>([]);
  const masterGainRef = useRef<GainNode | null>(null);
  const makeupGainRef = useRef<GainNode | null>(null);
  const outputNodeRef = useRef<GainNode | null>(null);
  
  const [drumState, setDrumState] = useState<DrumState>({
    kitId: 'house',
    patternBank: [
      getDefaultPattern(),
      ...Array(DRUM_PATTERN_BANK_SIZE - 1).fill(null).map(() => createEmptyPattern())
    ],
    activePatternIndex: 0,
    channelMix: createDefaultChannelMix(),
    masterVolume: 1.0,
    swing: 15,
    enabled: true
  });
  
  const compressorRef = useRef<DynamicsCompressorNode | null>(null);

  // Build the drum audio chain: masterGain → compressor → makeupGain → destination
  const buildDrumChain = useCallback((ctx: AudioContext, destination: AudioNode) => {
    // Compressor for punch
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -15;
    compressor.knee.value = 3;
    compressor.ratio.value = 6;
    compressor.attack.value = 0.001;
    compressor.release.value = 0.12;
    compressorRef.current = compressor;

    // Makeup gain to compensate for compression (reduced from 2.0 to 1.3 to prevent distortion)
    const makeupGain = ctx.createGain();
    makeupGain.gain.value = 1.3;
    makeupGainRef.current = makeupGain;

    // Master volume control
    const masterGain = ctx.createGain();
    masterGain.gain.value = drumState.masterVolume;
    masterGainRef.current = masterGain;

    // Chain: channels → masterGain → compressor → makeupGain → destination
    masterGain.connect(compressor);
    compressor.connect(makeupGain);
    makeupGain.connect(destination);

    // Create 8 channel gains + panners
    channelGainsRef.current = [];
    channelPansRef.current = [];
    for (let i = 0; i < 8; i++) {
      const gain = ctx.createGain();
      const pan = ctx.createStereoPanner();
      gain.gain.value = drumState.channelMix[i]?.volume ?? 1.0;
      pan.pan.value = drumState.channelMix[i]?.pan ?? 0;
      gain.connect(pan);
      pan.connect(masterGain);
      channelGainsRef.current.push(gain);
      channelPansRef.current.push(pan);
    }

    // Create drum synth
    drumSynthRef.current = createDrumSynth(ctx);
  }, [drumState.masterVolume, drumState.channelMix]);

  // Initialize audio
  const initAudio = useCallback(async (externalCtx?: AudioContext, externalOutput?: GainNode) => {
    if (audioCtxRef.current && drumSynthRef.current) return;

    const ctx = externalCtx || new AudioContext();
    audioCtxRef.current = ctx;

    buildDrumChain(ctx, externalOutput || ctx.destination);
    if (externalOutput) outputNodeRef.current = externalOutput;
  }, [buildDrumChain]);
  
  // Connect to external audio context and output
  const connectToMixer = useCallback((ctx: AudioContext, outputNode: GainNode) => {
    audioCtxRef.current = ctx;
    outputNodeRef.current = outputNode;

    // Disconnect old chain if exists
    if (masterGainRef.current) {
      try { masterGainRef.current.disconnect(); } catch {}
    }
    if (compressorRef.current) {
      try { compressorRef.current.disconnect(); } catch {}
    }
    if (makeupGainRef.current) {
      try { makeupGainRef.current.disconnect(); } catch {}
    }

    buildDrumChain(ctx, outputNode);
  }, [buildDrumChain]);
  
  // Play a sound immediately (for preview)
  const playSound = useCallback(async (channelIndex: number, velocity: number = 1) => {
    // Initialize audio if not already done
    if (!audioCtxRef.current || !drumSynthRef.current || channelGainsRef.current.length === 0) {
      await initAudio();
    }
    
    const ctx = audioCtxRef.current;
    const synth = drumSynthRef.current;
    if (!ctx || !synth) return;
    
    // Resume if suspended
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
    
    const kit = GENRE_KITS.find(k => k.id === drumState.kitId) || GENRE_KITS[0];
    const track = kit.tracks[channelIndex];
    if (!track) return;
    
    const channelGain = channelGainsRef.current[channelIndex];
    const mix = drumState.channelMix[channelIndex];
    
    if (mix?.mute) return;
    
    if (channelGain) {
      synth.playTrack(track, ctx.currentTime, channelGain, velocity * (mix?.volume ?? 1));
    }
  }, [drumState.kitId, drumState.channelMix, initAudio]);
  
  // Connect to an external audio context (from main synth)
  // Drums connect directly to ctx.destination (parallel to synth, not through synth master)
  const connectToContext = useCallback((ctx: AudioContext, _synthMasterGain: GainNode) => {
    // Skip if already connected to this context
    if (audioCtxRef.current === ctx && drumSynthRef.current) return;

    audioCtxRef.current = ctx;
    buildDrumChain(ctx, ctx.destination);
  }, [buildDrumChain]);
  
  // Schedule sounds for a step (called by main sequencer)
  const scheduleStep = useCallback((stepIndex: number, time: number) => {
    const ctx = audioCtxRef.current;
    const synth = drumSynthRef.current;
    if (!ctx || !synth || !drumState.enabled) return;

    const activePattern = drumState.patternBank[drumState.activePatternIndex];
    const step = activePattern[stepIndex];
    if (!step) return;
    
    const kit = GENRE_KITS.find(k => k.id === drumState.kitId) || GENRE_KITS[0];
    
    // Play each active sound
    Object.entries(step.sounds).forEach(([channelStr, data]) => {
      const channelIndex = parseInt(channelStr);
      if (!data.active) return;
      
      const mix = drumState.channelMix[channelIndex];
      if (mix?.mute) return;
      
      const track = kit.tracks[channelIndex];
      const channelGain = channelGainsRef.current[channelIndex];
      
      if (track && channelGain) {
        synth.playTrack(track, time, channelGain, data.velocity * (mix?.volume ?? 1));
      }
    });
  }, [drumState]);
  
  // Set kit
  const setKit = useCallback((kitId: string) => {
    setDrumState(prev => ({ ...prev, kitId }));
  }, []);
  
  // Toggle step — targets active pattern in bank
  const toggleStep = useCallback((stepIndex: number, channelIndex: number, velocity: number = 0.8) => {
    setDrumState(prev => {
      const bank = [...prev.patternBank];
      const newPattern = [...bank[prev.activePatternIndex]];
      const step = { ...newPattern[stepIndex] };
      const sounds = { ...step.sounds };

      if (sounds[channelIndex]?.active) {
        sounds[channelIndex] = { active: false, velocity: 0 };
      } else {
        sounds[channelIndex] = { active: true, velocity };
      }

      step.sounds = sounds;
      newPattern[stepIndex] = step;
      bank[prev.activePatternIndex] = newPattern;

      return { ...prev, patternBank: bank };
    });
  }, []);
  
  // Set step velocity — targets active pattern in bank
  const setStepVelocity = useCallback((stepIndex: number, channelIndex: number, velocity: number) => {
    setDrumState(prev => {
      const bank = [...prev.patternBank];
      const newPattern = [...bank[prev.activePatternIndex]];
      const step = { ...newPattern[stepIndex] };
      const sounds = { ...step.sounds };

      if (sounds[channelIndex]) {
        sounds[channelIndex] = { ...sounds[channelIndex], velocity };
      }

      step.sounds = sounds;
      newPattern[stepIndex] = step;
      bank[prev.activePatternIndex] = newPattern;

      return { ...prev, patternBank: bank };
    });
  }, []);
  
  // Set channel mix
  const setChannelMix = useCallback((channelIndex: number, updates: Partial<DrumChannelMix>) => {
    setDrumState(prev => {
      const newChannelMix = [...prev.channelMix];
      newChannelMix[channelIndex] = { ...newChannelMix[channelIndex], ...updates };
      
      // Apply to audio nodes
      if (updates.volume !== undefined && channelGainsRef.current[channelIndex]) {
        channelGainsRef.current[channelIndex].gain.setTargetAtTime(
          updates.volume,
          audioCtxRef.current?.currentTime || 0,
          0.01
        );
      }
      if (updates.pan !== undefined && channelPansRef.current[channelIndex]) {
        channelPansRef.current[channelIndex].pan.setTargetAtTime(
          updates.pan,
          audioCtxRef.current?.currentTime || 0,
          0.01
        );
      }
      
      return { ...prev, channelMix: newChannelMix };
    });
  }, []);
  
  // Set master volume
  const setMasterVolume = useCallback((volume: number) => {
    setDrumState(prev => ({ ...prev, masterVolume: volume }));
    if (masterGainRef.current && audioCtxRef.current) {
      masterGainRef.current.gain.setTargetAtTime(volume, audioCtxRef.current.currentTime, 0.01);
    }
  }, []);
  
  // Set swing
  const setSwing = useCallback((swing: number) => {
    setDrumState(prev => ({ ...prev, swing }));
  }, []);
  
  // Toggle enabled
  const setEnabled = useCallback((enabled: boolean) => {
    setDrumState(prev => ({ ...prev, enabled }));
  }, []);
  
  // Set full pattern — writes to active slot in patternBank
  const setPattern = useCallback((pattern: DrumStep[]) => {
    setDrumState(prev => {
      const bank = [...prev.patternBank];
      bank[prev.activePatternIndex] = pattern;
      return { ...prev, patternBank: bank };
    });
  }, []);

  // Clear pattern — clears active slot
  const clearPattern = useCallback(() => {
    setDrumState(prev => {
      const bank = [...prev.patternBank];
      bank[prev.activePatternIndex] = createEmptyPattern();
      return { ...prev, patternBank: bank };
    });
  }, []);
  
  // Pattern bank actions
  const setActiveDrumPattern = useCallback((index: number) => {
    setDrumState(prev => ({ ...prev, activePatternIndex: index }));
  }, []);

  const copyDrumPattern = useCallback((from: number, to: number) => {
    setDrumState(prev => {
      const bank = [...prev.patternBank];
      bank[to] = JSON.parse(JSON.stringify(bank[from]));
      return { ...prev, patternBank: bank };
    });
  }, []);

  const clearDrumPatternSlot = useCallback((index: number) => {
    setDrumState(prev => {
      const bank = [...prev.patternBank];
      bank[index] = createEmptyPattern();
      return { ...prev, patternBank: bank };
    });
  }, []);

  // Load full state (for session restore), with v3→v4 migration
  const loadState = useCallback((state: DrumState) => {
    // v3→v4 migration: single pattern → patternBank
    const migrated = { ...state } as any;
    if (migrated.pattern && !migrated.patternBank) {
      migrated.patternBank = [
        migrated.pattern,
        ...Array(DRUM_PATTERN_BANK_SIZE - 1).fill(null).map(() => createEmptyPattern())
      ];
      migrated.activePatternIndex = 0;
      delete migrated.pattern;
    }
    // Ensure activePatternIndex exists
    if (migrated.activePatternIndex === undefined) {
      migrated.activePatternIndex = 0;
    }
    setDrumState(migrated as DrumState);
    
    // Apply mixer settings
    if (masterGainRef.current && audioCtxRef.current) {
      masterGainRef.current.gain.setTargetAtTime(state.masterVolume, audioCtxRef.current.currentTime, 0.01);
    }
    
    state.channelMix.forEach((mix, i) => {
      if (channelGainsRef.current[i]) {
        channelGainsRef.current[i].gain.setTargetAtTime(mix.volume, audioCtxRef.current?.currentTime || 0, 0.01);
      }
      if (channelPansRef.current[i]) {
        channelPansRef.current[i].pan.setTargetAtTime(mix.pan, audioCtxRef.current?.currentTime || 0, 0.01);
      }
    });
  }, []);
  
  // Connect drum channels to ProMixer (bypasses internal compressor/makeup chain)
  const connectToProMixer = useCallback((engine: ProMixerEngine) => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;

    // Ensure we have channel gains/pans
    if (channelGainsRef.current.length === 0) {
      // Need to create channel gains first if they don't exist
      channelGainsRef.current = [];
      channelPansRef.current = [];
      for (let i = 0; i < 8; i++) {
        const gain = ctx.createGain();
        const pan = ctx.createStereoPanner();
        gain.gain.value = drumState.channelMix[i]?.volume ?? 1.0;
        pan.pan.value = drumState.channelMix[i]?.pan ?? 0;
        gain.connect(pan);
        channelGainsRef.current.push(gain);
        channelPansRef.current.push(pan);
      }
      drumSynthRef.current = createDrumSynth(ctx);
    }

    // Disconnect panners from old destinations and connect to ProMixer channel inputs
    for (let i = 0; i < 8; i++) {
      const panner = channelPansRef.current[i];
      if (!panner) continue;
      try { panner.disconnect(); } catch { /* ignore */ }
      const channelId = `drum${i}` as ProMixerChannelId;
      panner.connect(engine.getChannelInput(channelId));
    }
  }, [drumState.channelMix]);

  // Reconnect drum channels back to internal legacy chain
  const reconnectToLegacy = useCallback(() => {
    if (!masterGainRef.current) return;
    for (let i = 0; i < 8; i++) {
      const panner = channelPansRef.current[i];
      if (!panner) continue;
      try { panner.disconnect(); } catch { /* ignore */ }
      panner.connect(masterGainRef.current);
    }
  }, []);

  // Get current kit info
  const currentKit = GENRE_KITS.find(k => k.id === drumState.kitId) || GENRE_KITS[0];

  // Convenience: active pattern from bank
  const activePattern = drumState.patternBank[drumState.activePatternIndex];

  return {
    // State
    drumState,
    currentKit,
    pattern: activePattern, // convenience getter for active pattern

    // Audio
    initAudio,
    connectToMixer,
    connectToContext,
    playSound,
    scheduleStep,

    // Setters
    setKit,
    toggleStep,
    setStepVelocity,
    setChannelMix,
    setMasterVolume,
    setSwing,
    setEnabled,
    setPattern,
    clearPattern,
    loadState,

    // Pattern bank
    setActiveDrumPattern,
    copyDrumPattern,
    clearDrumPatternSlot,

    // Pro Mixer integration
    connectToProMixer,
    reconnectToLegacy,

    // Constants
    GENRE_KITS
  };
}
