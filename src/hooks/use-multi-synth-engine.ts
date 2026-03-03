import { useRef, useCallback, useEffect, useState } from 'react';
import {
  type TB303Params,
  type Step,
  type ModulatorState,
  type AutomationState,
  type AutomationParam,
  type Modulator,
  type ModShape,
  AUTOMATION_RESOLUTION,
  getAutomationValue,
  noteToFreq,
  SESSION_VERSION
} from './use-tb303-engine';
import type { ProMixerState } from '@/audio/pro-mixer-types';

// Module types
export type ModuleId = 'bass' | 'lead' | 'arp';

export interface ModuleConfig {
  id: ModuleId;
  name: string;
  color: string;
  defaultOctaveOffset: number; // Relative to base note
  defaultParams: Partial<TB303Params>;
}

export const MODULE_CONFIGS: Record<ModuleId, ModuleConfig> = {
  bass: {
    id: 'bass',
    name: 'Bass',
    color: '#f97316', // Orange
    defaultOctaveOffset: -12,
    defaultParams: {
      cutoff: 0.3,
      resonance: 0.5,
      envMod: 0.4,
      decay: 0.5,
      waveform: 'saw'
    }
  },
  lead: {
    id: 'lead',
    name: 'Lead',
    color: '#8b5cf6', // Purple
    defaultOctaveOffset: 0,
    defaultParams: {
      cutoff: 0.6,
      resonance: 0.6,
      envMod: 0.6,
      decay: 0.4,
      waveform: 'saw'
    }
  },
  arp: {
    id: 'arp',
    name: 'Arp',
    color: '#06b6d4', // Cyan
    defaultOctaveOffset: 12,
    defaultParams: {
      cutoff: 0.7,
      resonance: 0.4,
      envMod: 0.5,
      decay: 0.3,
      waveform: 'pulse'
    }
  }
};

// Mixer channel state
export interface MixerChannel {
  volume: number;   // 0-1
  pan: number;      // -1 (left) to 1 (right)
  mute: boolean;
  solo: boolean;
}

export interface MixerState {
  bass: MixerChannel;
  lead: MixerChannel;
  arp: MixerChannel;
  master: number;   // 0-1
}

const DEFAULT_MIXER_CHANNEL: MixerChannel = {
  volume: 0.8,
  pan: 0,
  mute: false,
  solo: false
};

const DEFAULT_MIXER: MixerState = {
  bass: { ...DEFAULT_MIXER_CHANNEL },
  lead: { ...DEFAULT_MIXER_CHANNEL },
  arp: { ...DEFAULT_MIXER_CHANNEL },
  master: 0.8
};

// Module state
export interface ModuleState {
  params: TB303Params;
  pattern: Step[];
  modulators: ModulatorState;
  automation: AutomationState;
}

// Multi-module session data for save/load
export interface MultiModuleSessionData {
  version: number;
  name: string;
  createdAt: string;
  tempo: number;
  activeModule: ModuleId;
  automationEnabled: boolean;
  modules: Record<ModuleId, ModuleState>;
  mixer: MixerState;
  proMixer?: ProMixerState;
}

export const MULTI_SESSION_VERSION = 3;

// Default params
const DEFAULT_PARAMS: TB303Params = {
  cutoff: 0.5,
  resonance: 0.5,
  envMod: 0.5,
  decay: 0.5,
  accent: 0.5,
  overdrive: 0.2,
  waveform: 'saw',
  tempo: 130,
  volume: 0.8
};

const DEFAULT_MODULATOR: Modulator = {
  enabled: false,
  rate: 0.5,
  depth: 0,
  shape: 'sine' as ModShape,
  sync: true
};

const DEFAULT_MODULATORS: ModulatorState = {
  cutoff: { ...DEFAULT_MODULATOR },
  resonance: { ...DEFAULT_MODULATOR },
  envMod: { ...DEFAULT_MODULATOR }
};

// LFO calculation function
function calculateLFO(
  shape: ModShape,
  rate: number,
  depth: number,
  sync: boolean,
  time: number,
  tempo: number,
  patternPosition: number
): number {
  if (depth <= 0) return 0;
  
  let phase: number;
  
  if (sync) {
    // Tempo-synced: rate maps to note divisions
    // 0=4bar, 0.14=2bar, 0.28=1bar, 0.43=1/2, 0.57=1/4, 0.71=1/8, 0.86=1/16, 1=1/32
    const divisions = [16, 8, 4, 2, 1, 0.5, 0.25, 0.125];
    const divIndex = Math.floor(rate * 7);
    const barsPerCycle = divisions[Math.min(divIndex, 7)];
    const beatsPerCycle = barsPerCycle * 4;
    const secondsPerBeat = 60 / tempo;
    const cycleLength = beatsPerCycle * secondsPerBeat;
    phase = (time % cycleLength) / cycleLength;
  } else {
    // Free-running: rate 0-1 maps to 0.1Hz - 20Hz (exponential)
    const freqHz = 0.1 * Math.pow(200, rate);
    phase = (time * freqHz) % 1;
  }
  
  let value: number;
  switch (shape) {
    case 'sine':
      value = Math.sin(phase * Math.PI * 2);
      break;
    case 'triangle':
      value = phase < 0.5 ? (phase * 4 - 1) : (3 - phase * 4);
      break;
    case 'square':
      value = phase < 0.5 ? 1 : -1;
      break;
    case 'random':
      // Sample & hold - changes at start of each cycle
      // Use a deterministic pseudo-random based on floor(time * freq)
      const seed = Math.floor(sync ? patternPosition * 8 : time * (0.1 * Math.pow(200, rate)));
      value = ((Math.sin(seed * 12.9898) * 43758.5453) % 1) * 2 - 1;
      break;
    default:
      value = 0;
  }
  
  return value * depth;
}

const createEmptyLane = () => ({
  enabled: false,
  points: Array(AUTOMATION_RESOLUTION).fill(-1)
});

const DEFAULT_AUTOMATION: AutomationState = {
  cutoff: createEmptyLane(),
  resonance: createEmptyLane(),
  envMod: createEmptyLane(),
  decay: createEmptyLane(),
  accent: createEmptyLane(),
  overdrive: createEmptyLane()
};

const createDefaultPattern = (): Step[] => 
  Array(16).fill(null).map((_, i) => ({
    note: 36 + (i % 12),
    active: i % 4 === 0,
    accent: i % 8 === 0,
    slide: false
  }));

// SVF Filter processor code - unique name for multi-synth engine
const SVF_PROCESSOR_CODE = `
class SVFProcessorMulti extends AudioWorkletProcessor {
  constructor() {
    super();
    this.ic1eq = 0;
    this.ic2eq = 0;
  }
  
  static get parameterDescriptors() {
    return [
      { name: 'frequency', defaultValue: 1000, minValue: 20, maxValue: 20000 },
      { name: 'resonance', defaultValue: 0.5, minValue: 0, maxValue: 1 }
    ];
  }
  
  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];
    
    if (!input || !input[0]) return true;
    
    const freq = parameters.frequency[0] || 1000;
    const reso = parameters.resonance[0] || 0.5;
    
    const g = Math.tan(Math.PI * Math.min(freq, sampleRate * 0.45) / sampleRate);
    const k = 2 - 2 * Math.pow(reso, 0.8);
    const a1 = 1 / (1 + g * (g + k));
    const a2 = g * a1;
    const a3 = g * a2;
    
    for (let channel = 0; channel < output.length; channel++) {
      const inputChannel = input[channel] || input[0];
      const outputChannel = output[channel];
      
      for (let i = 0; i < outputChannel.length; i++) {
        const v0 = inputChannel[i];
        const v3 = v0 - this.ic2eq;
        const v1 = a1 * this.ic1eq + a2 * v3;
        const v2 = this.ic2eq + a2 * this.ic1eq + a3 * v3;
        this.ic1eq = 2 * v1 - this.ic1eq;
        this.ic2eq = 2 * v2 - this.ic2eq;
        outputChannel[i] = v2;
      }
    }
    return true;
  }
}

try {
  registerProcessor('svf-processor-multi', SVFProcessorMulti);
} catch (e) {
  // Already registered, ignore
}
`;

// Voice class for a single synth module
class SynthVoice {
  private ctx: AudioContext;
  private osc: OscillatorNode | null = null;
  private filterNode: AudioWorkletNode | null = null;
  private fallbackFilter1: BiquadFilterNode | null = null;
  private fallbackFilter2: BiquadFilterNode | null = null;
  private vca: GainNode;
  private accentGain: GainNode;
  private overdrive: WaveShaperNode;
  private panNode: StereoPannerNode;
  private channelGain: GainNode;
  private useFallback = false;
  
  // Envelope state
  public filterEnv = 0;
  public accentEnv = 0;
  public vcaEnv = 0;
  
  // Refs for filter params
  private filterFreqParam: AudioParam | null = null;
  private filterResParam: AudioParam | null = null;
  
  constructor(ctx: AudioContext, destination: AudioNode) {
    this.ctx = ctx;
    
    // Create nodes
    this.vca = ctx.createGain();
    this.vca.gain.value = 0;
    
    this.accentGain = ctx.createGain();
    this.accentGain.gain.value = 1;
    
    this.overdrive = ctx.createWaveShaper();
    this.overdrive.curve = this.makeDistortionCurve(0.2);
    this.overdrive.oversample = '2x';
    
    this.panNode = ctx.createStereoPanner();
    this.panNode.pan.value = 0;
    
    this.channelGain = ctx.createGain();
    this.channelGain.gain.value = 0.8;
    
    // Connect chain: vca -> accentGain -> overdrive -> pan -> channelGain -> destination
    this.vca.connect(this.accentGain);
    this.accentGain.connect(this.overdrive);
    this.overdrive.connect(this.panNode);
    this.panNode.connect(this.channelGain);
    this.channelGain.connect(destination);
  }
  
  async init(waveform: 'saw' | 'pulse' = 'saw'): Promise<void> {
    // Create oscillator
    this.osc = this.ctx.createOscillator();
    this.osc.type = waveform === 'saw' ? 'sawtooth' : 'square';
    this.osc.frequency.value = 110;
    
    // Try to create AudioWorklet filter
    try {
      const blob = new Blob([SVF_PROCESSOR_CODE], { type: 'application/javascript' });
      const url = URL.createObjectURL(blob);
      await this.ctx.audioWorklet.addModule(url);
      URL.revokeObjectURL(url);
      
      this.filterNode = new AudioWorkletNode(this.ctx, 'svf-processor-multi');
      this.filterFreqParam = this.filterNode.parameters.get('frequency') || null;
      this.filterResParam = this.filterNode.parameters.get('resonance') || null;
      
      this.osc.connect(this.filterNode);
      this.filterNode.connect(this.vca);
      this.useFallback = false;
    } catch {
      // Fallback to biquad filters
      this.useFallback = true;
      
      this.fallbackFilter1 = this.ctx.createBiquadFilter();
      this.fallbackFilter1.type = 'lowpass';
      this.fallbackFilter1.frequency.value = 500;
      this.fallbackFilter1.Q.value = 8;
      
      this.fallbackFilter2 = this.ctx.createBiquadFilter();
      this.fallbackFilter2.type = 'lowpass';
      this.fallbackFilter2.frequency.value = 500;
      this.fallbackFilter2.Q.value = 4;
      
      this.osc.connect(this.fallbackFilter1);
      this.fallbackFilter1.connect(this.fallbackFilter2);
      this.fallbackFilter2.connect(this.vca);
    }
    
    this.osc.start();
  }
  
  private makeDistortionCurve(amount: number): Float32Array {
    const samples = 8192;
    const curve = new Float32Array(samples);
    const drive = 1 + amount * 8;
    
    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      curve[i] = Math.tanh(x * drive);
    }
    return curve;
  }
  
  setWaveform(waveform: 'saw' | 'pulse'): void {
    if (this.osc) {
      this.osc.type = waveform === 'saw' ? 'sawtooth' : 'square';
    }
  }
  
  setOverdrive(amount: number): void {
    this.overdrive.curve = this.makeDistortionCurve(amount);
  }
  
  setVolume(volume: number): void {
    this.channelGain.gain.setTargetAtTime(volume, this.ctx.currentTime, 0.01);
  }
  
  setPan(pan: number): void {
    this.panNode.pan.setTargetAtTime(pan, this.ctx.currentTime, 0.01);
  }
  
  setMute(mute: boolean): void {
    this.channelGain.gain.setTargetAtTime(mute ? 0 : 0.8, this.ctx.currentTime, 0.01);
  }
  
  updateFilter(frequency: number, resonance: number): void {
    const now = this.ctx.currentTime;
    if (!this.useFallback && this.filterFreqParam && this.filterResParam) {
      this.filterFreqParam.setValueAtTime(frequency, now);
      this.filterResParam.setValueAtTime(resonance, now);
    } else if (this.fallbackFilter1 && this.fallbackFilter2) {
      const q = 0.5 + Math.pow(resonance, 2) * 15;
      this.fallbackFilter1.frequency.setValueAtTime(frequency, now);
      this.fallbackFilter1.Q.setValueAtTime(q, now);
      this.fallbackFilter2.frequency.setValueAtTime(frequency, now);
      this.fallbackFilter2.Q.setValueAtTime(q * 0.5, now);
    }
  }
  
  triggerNote(frequency: number, accent: boolean, slide: boolean, prevFreq?: number, accentAmount = 0.5, decayAmount = 0.5): void {
    const now = this.ctx.currentTime;
    
    if (slide && prevFreq && this.osc) {
      this.osc.frequency.cancelScheduledValues(now);
      this.osc.frequency.setValueAtTime(prevFreq, now);
      this.osc.frequency.exponentialRampToValueAtTime(frequency, now + 0.05);
    } else if (this.osc) {
      this.osc.frequency.setValueAtTime(frequency, now);
    }
    
    if (!slide) {
      this.filterEnv = 1;
      if (accent) {
        this.accentEnv = accentAmount;
      }
      this.vcaEnv = 1;
      
      // Attack time: 3ms minimum to avoid clicks (musician tip!)
      const attackTime = 0.003;
      const level = accent ? 1.0 : 0.7;
      
      this.vca.gain.cancelScheduledValues(now);
      this.vca.gain.setValueAtTime(0, now);
      this.vca.gain.linearRampToValueAtTime(level, now + attackTime);
      this.vca.gain.setTargetAtTime(level * 0.8, now + attackTime, 0.1 + decayAmount * 0.3);
    }
    
    const accentLevel = accent ? 1 + accentAmount * 0.5 : 1;
    this.accentGain.gain.setTargetAtTime(accentLevel, now, 0.01);
  }
  
  stopNote(): void {
    const now = this.ctx.currentTime;
    this.vca.gain.cancelScheduledValues(now);
    this.vca.gain.setTargetAtTime(0, now, 0.02);
    this.filterEnv = 0;
    this.accentEnv = 0;
    this.vcaEnv = 0;
  }
  
  processEnvelopes(decay: number): void {
    const filterDecayRate = Math.exp(-(1 - decay) * 0.15);
    this.filterEnv *= filterDecayRate;
    this.accentEnv *= 0.995;
    this.vcaEnv *= 0.992;
  }
  
  /** Reconnect channelGain to a new destination (for ProMixer integration) */
  reconnect(destination: AudioNode): void {
    this.channelGain.disconnect();
    this.channelGain.connect(destination);
  }

  disconnect(): void {
    this.osc?.stop();
    this.osc?.disconnect();
    this.filterNode?.disconnect();
    this.fallbackFilter1?.disconnect();
    this.fallbackFilter2?.disconnect();
    this.vca.disconnect();
    this.accentGain.disconnect();
    this.overdrive.disconnect();
    this.panNode.disconnect();
    this.channelGain.disconnect();
  }
}

// MIDI notes
const NOTES = [
  'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'
];

export function useMultiSynthEngine() {
  // Audio context
  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const voicesRef = useRef<Record<ModuleId, SynthVoice | null>>({
    bass: null,
    lead: null,
    arp: null
  });
  const isInitializedRef = useRef(false);
  
  // Module states
  const [moduleStates, setModuleStates] = useState<Record<ModuleId, ModuleState>>(() => {
    const createModuleState = (id: ModuleId): ModuleState => ({
      params: { ...DEFAULT_PARAMS, ...MODULE_CONFIGS[id].defaultParams },
      pattern: createDefaultPattern(),
      modulators: { ...DEFAULT_MODULATORS },
      automation: { ...DEFAULT_AUTOMATION }
    });
    
    return {
      bass: createModuleState('bass'),
      lead: createModuleState('lead'),
      arp: createModuleState('arp')
    };
  });
  
  const moduleStatesRef = useRef(moduleStates);
  useEffect(() => { moduleStatesRef.current = moduleStates; }, [moduleStates]);
  
  // Mixer state
  const [mixer, setMixer] = useState<MixerState>(DEFAULT_MIXER);
  const mixerRef = useRef(mixer);
  useEffect(() => { mixerRef.current = mixer; }, [mixer]);
  
  // Active module for editing
  const [activeModule, setActiveModule] = useState<ModuleId>('lead');
  
  // Global state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [tempo, setTempoState] = useState(130);
  const tempoRef = useRef(130);
  const [automationEnabled, setAutomationEnabled] = useState(true);
  const automationEnabledRef = useRef(true);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const playbackPositionRef = useRef(0);
  
  // Sequencer refs
  const timerRef = useRef<number | null>(null);
  const nextNoteTimeRef = useRef(0);
  const currentStepRef = useRef(0);
  const patternStartTimeRef = useRef(0);
  const envIntervalRef = useRef<number | null>(null);
  const lastStepUpdateRef = useRef(0);
  
  // Initialize audio
  const initAudio = useCallback(async () => {
    if (audioCtxRef.current && isInitializedRef.current) return;
    
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) {
      console.error('Web Audio API not supported');
      return;
    }
    
    const ctx = new AudioContextClass({ latencyHint: 'interactive', sampleRate: 44100 });
    audioCtxRef.current = ctx;
    
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
    
    // Create master gain
    const masterGain = ctx.createGain();
    masterGain.gain.value = mixerRef.current.master;
    masterGain.connect(ctx.destination);
    masterGainRef.current = masterGain;
    
    // Create voices for each module
    const modules: ModuleId[] = ['bass', 'lead', 'arp'];
    for (const id of modules) {
      const voice = new SynthVoice(ctx, masterGain);
      const waveform = moduleStatesRef.current[id].params.waveform;
      await voice.init(waveform);
      voicesRef.current[id] = voice;
      
      // Apply initial settings
      const channel = mixerRef.current[id];
      voice.setVolume(channel.volume);
      voice.setPan(channel.pan);
    }
    
    isInitializedRef.current = true;
    startEnvelopeProcessor();
  }, []);
  
  // Envelope processor
  const startEnvelopeProcessor = useCallback(() => {
    if (envIntervalRef.current) return;
    
    let lastTime = performance.now();
    let lastPositionUpdate = 0;
    let startTime = 0;
    
    const processEnvelopes = () => {
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      
      const currentTime = performance.now();
      const now = ctx.currentTime;
      const pos = playbackPositionRef.current;
      
      // Track elapsed time for LFO
      if (startTime === 0) startTime = now;
      const elapsedTime = now - startTime;
      const currentTempo = tempoRef.current;
      
      // Update playback position state (throttled)
      if (currentTime - lastPositionUpdate > 33) {
        lastPositionUpdate = currentTime;
        setPlaybackPosition(pos);
      }
      
      // Process each voice
      const modules: ModuleId[] = ['bass', 'lead', 'arp'];
      for (const id of modules) {
        const voice = voicesRef.current[id];
        const state = moduleStatesRef.current[id];
        const channel = mixerRef.current[id];
        
        if (!voice) continue;
        
        // Check solo status
        const anySolo = Object.values(mixerRef.current).some(ch => typeof ch === 'object' && ch.solo);
        const shouldPlay = !channel.mute && (!anySolo || channel.solo);
        
        if (!shouldPlay) {
          voice.setVolume(0);
          continue;
        }
        
        voice.setVolume(channel.volume);
        voice.setPan(channel.pan);
        
        // Process envelopes
        voice.processEnvelopes(state.params.decay);
        
        // Calculate filter values
        const p = state.params;
        const auto = state.automation;
        const mods = state.modulators;
        
        // Get base values (from automation or params)
        let cutoff = automationEnabledRef.current 
          ? (getAutomationValue(auto.cutoff, pos) ?? p.cutoff)
          : p.cutoff;
        let resonance = automationEnabledRef.current
          ? (getAutomationValue(auto.resonance, pos) ?? p.resonance)
          : p.resonance;
        let envMod = automationEnabledRef.current
          ? (getAutomationValue(auto.envMod, pos) ?? p.envMod)
          : p.envMod;
        
        // Apply LFO modulation to cutoff
        if (mods.cutoff.depth > 0) {
          const lfoValue = calculateLFO(
            mods.cutoff.shape,
            mods.cutoff.rate,
            mods.cutoff.depth,
            mods.cutoff.sync,
            elapsedTime,
            currentTempo,
            pos
          );
          // LFO modulates cutoff bipolar around current value
          cutoff = Math.max(0, Math.min(1, cutoff + lfoValue * 0.5));
        }
        
        // Apply LFO modulation to resonance
        if (mods.resonance.depth > 0) {
          const lfoValue = calculateLFO(
            mods.resonance.shape,
            mods.resonance.rate,
            mods.resonance.depth,
            mods.resonance.sync,
            elapsedTime,
            currentTempo,
            pos
          );
          resonance = Math.max(0, Math.min(1, resonance + lfoValue * 0.3));
        }
        
        // Apply LFO modulation to envMod
        if (mods.envMod.depth > 0) {
          const lfoValue = calculateLFO(
            mods.envMod.shape,
            mods.envMod.rate,
            mods.envMod.depth,
            mods.envMod.sync,
            elapsedTime,
            currentTempo,
            pos
          );
          envMod = Math.max(0, Math.min(1, envMod + lfoValue * 0.5));
        }
        
        const baseCutoff = Math.pow(2, cutoff * 7 - 5) * 1000;
        const envModAmount = voice.filterEnv * envMod * 5;
        const accentMod = voice.accentEnv * 0.4;
        const filterFreq = Math.min(18000, baseCutoff * Math.pow(2, envModAmount + accentMod));
        
        voice.updateFilter(filterFreq, resonance);
        
        // Update overdrive if automated
        if (automationEnabledRef.current) {
          const overdriveVal = getAutomationValue(auto.overdrive, pos);
          if (overdriveVal !== null) {
            voice.setOverdrive(overdriveVal);
          }
        }
      }
      
      lastTime = currentTime;
      envIntervalRef.current = requestAnimationFrame(processEnvelopes);
    };
    
    envIntervalRef.current = requestAnimationFrame(processEnvelopes);
  }, []);
  
  const stopEnvelopeProcessor = useCallback(() => {
    if (envIntervalRef.current) {
      cancelAnimationFrame(envIntervalRef.current);
      envIntervalRef.current = null;
    }
  }, []);
  
  // External drum scheduler callback
  const drumSchedulerRef = useRef<((stepIndex: number, time: number) => void) | null>(null);
  
  const setDrumScheduler = useCallback((scheduler: (stepIndex: number, time: number) => void) => {
    drumSchedulerRef.current = scheduler;
  }, []);
  
  // Schedule notes for all modules
  const scheduleNotes = useCallback((time: number, stepIndex: number, prevStepIndex: number) => {
    const modules: ModuleId[] = ['bass', 'lead', 'arp'];
    
    for (const id of modules) {
      const voice = voicesRef.current[id];
      const state = moduleStatesRef.current[id];
      const channel = mixerRef.current[id];
      
      if (!voice) continue;
      
      // Check if should play
      const anySolo = Object.values(mixerRef.current).some(ch => typeof ch === 'object' && ch.solo);
      const shouldPlay = !channel.mute && (!anySolo || channel.solo);
      if (!shouldPlay) continue;
      
      const step = state.pattern[stepIndex];
      const prevStep = state.pattern[prevStepIndex];
      
      if (!step.active) continue;
      
      const freq = noteToFreq(step.note);
      const prevFreq = prevStep?.active ? noteToFreq(prevStep.note) : undefined;
      
      const ctx = audioCtxRef.current;
      if (!ctx) continue;
      
      const triggerTime = time - ctx.currentTime;
      const accentVal = state.params.accent;
      const decayVal = state.params.decay;
      
      if (triggerTime > 0) {
        setTimeout(() => {
          voice.triggerNote(freq, step.accent, step.slide, prevFreq, accentVal, decayVal);
        }, triggerTime * 1000);
      } else {
        voice.triggerNote(freq, step.accent, step.slide, prevFreq, accentVal, decayVal);
      }
    }
    
    // Schedule drums via external callback
    if (drumSchedulerRef.current) {
      drumSchedulerRef.current(stepIndex, time);
    }
  }, []);
  
  // Scheduler
  const scheduler = useCallback(() => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    
    const secondsPerBeat = 60.0 / tempoRef.current / 4;
    const patternDuration = secondsPerBeat * 16;
    
    // Update playback position
    const elapsed = ctx.currentTime - patternStartTimeRef.current;
    playbackPositionRef.current = (elapsed % patternDuration) / patternDuration;
    
    while (nextNoteTimeRef.current < ctx.currentTime + 0.1) {
      const currentIndex = currentStepRef.current;
      const prevIndex = (currentIndex - 1 + 16) % 16;
      
      scheduleNotes(nextNoteTimeRef.current, currentIndex, prevIndex);
      
      const now = performance.now();
      if (now - lastStepUpdateRef.current > 50) {
        lastStepUpdateRef.current = now;
        setCurrentStep(currentIndex);
      }
      
      nextNoteTimeRef.current += secondsPerBeat;
      currentStepRef.current = (currentStepRef.current + 1) % 16;
    }
  }, [scheduleNotes]);
  
  // Start playback
  const start = useCallback(async () => {
    await initAudio();
    
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
    
    currentStepRef.current = 0;
    nextNoteTimeRef.current = ctx.currentTime + 0.05;
    patternStartTimeRef.current = ctx.currentTime;
    playbackPositionRef.current = 0;
    setCurrentStep(0);
    setIsPlaying(true);
    
    const tick = () => {
      if (!audioCtxRef.current) return;
      scheduler();
      timerRef.current = requestAnimationFrame(tick);
    };
    tick();
  }, [initAudio, scheduler]);
  
  // Stop playback
  const stop = useCallback(() => {
    if (timerRef.current) {
      cancelAnimationFrame(timerRef.current);
      timerRef.current = null;
    }
    setIsPlaying(false);
    setCurrentStep(0);
    playbackPositionRef.current = 0;
    setPlaybackPosition(0);
    
    // Stop all voices
    const modules: ModuleId[] = ['bass', 'lead', 'arp'];
    for (const id of modules) {
      voicesRef.current[id]?.stopNote();
    }
  }, []);
  
  // Play single note
  const playNote = useCallback(async (note: number, accent = false) => {
    await initAudio();
    const voice = voicesRef.current[activeModule];
    if (voice) {
      const state = moduleStatesRef.current[activeModule];
      voice.triggerNote(noteToFreq(note), accent, false, undefined, state.params.accent, state.params.decay);
    }
  }, [initAudio, activeModule]);
  
  // Set params for active module
  const setParams = useCallback((newParams: Partial<TB303Params>) => {
    setModuleStates(prev => {
      const updated = { ...prev };
      updated[activeModule] = {
        ...updated[activeModule],
        params: { ...updated[activeModule].params, ...newParams }
      };
      return updated;
    });
    
    // Apply waveform change immediately
    if (newParams.waveform !== undefined) {
      voicesRef.current[activeModule]?.setWaveform(newParams.waveform);
    }
    
    // Apply overdrive change immediately
    if (newParams.overdrive !== undefined) {
      voicesRef.current[activeModule]?.setOverdrive(newParams.overdrive);
    }
  }, [activeModule]);
  
  // Set pattern for active module
  const setPattern = useCallback((pattern: Step[]) => {
    setModuleStates(prev => {
      const updated = { ...prev };
      updated[activeModule] = { ...updated[activeModule], pattern };
      return updated;
    });
  }, [activeModule]);
  
  // Set tempo (global)
  const setTempo = useCallback((newTempo: number) => {
    tempoRef.current = newTempo;
    setTempoState(newTempo);
  }, []);
  
  // Mixer controls
  const setMixerChannel = useCallback((id: ModuleId, updates: Partial<MixerChannel>) => {
    setMixer(prev => ({
      ...prev,
      [id]: { ...prev[id], ...updates }
    }));
  }, []);
  
  const setMasterVolume = useCallback((volume: number) => {
    setMixer(prev => ({ ...prev, master: volume }));
    if (masterGainRef.current && audioCtxRef.current) {
      masterGainRef.current.gain.setTargetAtTime(volume, audioCtxRef.current.currentTime, 0.01);
    }
  }, []);
  
  // Set patterns for all modules (for emotion-to-music)
  const setAllPatterns = useCallback((patterns: Record<ModuleId, Step[]>) => {
    setModuleStates(prev => ({
      bass: { ...prev.bass, pattern: patterns.bass },
      lead: { ...prev.lead, pattern: patterns.lead },
      arp: { ...prev.arp, pattern: patterns.arp }
    }));
  }, []);
  
  // Set params for specific module
  const setModuleParams = useCallback((id: ModuleId, newParams: Partial<TB303Params>) => {
    setModuleStates(prev => {
      const updated = { ...prev };
      updated[id] = {
        ...updated[id],
        params: { ...updated[id].params, ...newParams }
      };
      return updated;
    });
    
    if (newParams.waveform !== undefined) {
      voicesRef.current[id]?.setWaveform(newParams.waveform);
    }
    if (newParams.overdrive !== undefined) {
      voicesRef.current[id]?.setOverdrive(newParams.overdrive);
    }
  }, []);
  
  // Transpose pattern by semitones (positive = up, negative = down)
  const transposePattern = useCallback((semitones: number, moduleId?: ModuleId) => {
    const targetModule = moduleId ?? activeModule;
    setModuleStates(prev => {
      const updated = { ...prev };
      const currentPattern = updated[targetModule].pattern;
      
      // Transpose all notes, clamping to valid MIDI range (24-96)
      const transposedPattern = currentPattern.map(step => ({
        ...step,
        note: Math.max(24, Math.min(96, step.note + semitones))
      }));
      
      updated[targetModule] = {
        ...updated[targetModule],
        pattern: transposedPattern
      };
      return updated;
    });
  }, [activeModule]);
  
  // Automation
  const setAutomation = useCallback((param: AutomationParam, points: number[]) => {
    setModuleStates(prev => {
      const updated = { ...prev };
      updated[activeModule] = {
        ...updated[activeModule],
        automation: {
          ...updated[activeModule].automation,
          [param]: { enabled: true, points }
        }
      };
      return updated;
    });
  }, [activeModule]);
  
  const clearAutomation = useCallback((param: AutomationParam) => {
    setModuleStates(prev => {
      const updated = { ...prev };
      updated[activeModule] = {
        ...updated[activeModule],
        automation: {
          ...updated[activeModule].automation,
          [param]: createEmptyLane()
        }
      };
      return updated;
    });
  }, [activeModule]);
  
  const clearAllAutomation = useCallback(() => {
    setModuleStates(prev => {
      const updated = { ...prev };
      updated[activeModule] = {
        ...updated[activeModule],
        automation: { ...DEFAULT_AUTOMATION }
      };
      return updated;
    });
  }, [activeModule]);
  
  const toggleAutomationEnabled = useCallback(() => {
    automationEnabledRef.current = !automationEnabledRef.current;
    setAutomationEnabled(automationEnabledRef.current);
  }, []);
  
  // Modulators
  const setModulator = useCallback((param: keyof ModulatorState, updates: Partial<Modulator>) => {
    setModuleStates(prev => {
      const updated = { ...prev };
      const current = updated[activeModule].modulators[param];
      updated[activeModule] = {
        ...updated[activeModule],
        modulators: {
          ...updated[activeModule].modulators,
          [param]: { ...current, ...updates }
        }
      };
      return updated;
    });
  }, [activeModule]);
  
  // Cleanup
  useEffect(() => {
    return () => {
      if (timerRef.current) cancelAnimationFrame(timerRef.current);
      stopEnvelopeProcessor();
      
      const modules: ModuleId[] = ['bass', 'lead', 'arp'];
      for (const id of modules) {
        voicesRef.current[id]?.disconnect();
      }
      
      // Only close if not already closed
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close();
      }
    };
  }, [stopEnvelopeProcessor]);
  
  // Get current module state
  const currentModuleState = moduleStates[activeModule];
  
  // Save session - creates a complete snapshot of all modules
  const saveSession = useCallback((name: string): MultiModuleSessionData => {
    return {
      version: MULTI_SESSION_VERSION,
      name,
      createdAt: new Date().toISOString(),
      tempo: tempoRef.current,
      activeModule,
      automationEnabled: automationEnabledRef.current,
      modules: JSON.parse(JSON.stringify(moduleStates)), // Deep clone
      mixer: JSON.parse(JSON.stringify(mixer))
    };
  }, [activeModule, moduleStates, mixer]);
  
  // Load session - restores all modules from saved data
  const loadSession = useCallback((session: MultiModuleSessionData) => {
    // Set tempo
    tempoRef.current = session.tempo;
    setTempoState(session.tempo);
    
    // Set active module
    setActiveModule(session.activeModule);
    
    // Set automation enabled
    automationEnabledRef.current = session.automationEnabled;
    setAutomationEnabled(session.automationEnabled);
    
    // Restore all module states
    setModuleStates(session.modules);
    
    // Restore mixer
    setMixer(session.mixer);
    
    // Apply waveforms and overdrive to voices
    const modules: ModuleId[] = ['bass', 'lead', 'arp'];
    for (const id of modules) {
      const mod = session.modules[id];
      voicesRef.current[id]?.setWaveform(mod.params.waveform);
      voicesRef.current[id]?.setOverdrive(mod.params.overdrive);
    }
  }, []);
  
  return {
    // Module selection
    activeModule,
    setActiveModule,
    moduleStates,
    
    // Current module shortcuts
    params: currentModuleState.params,
    pattern: currentModuleState.pattern,
    modulators: currentModuleState.modulators,
    automation: currentModuleState.automation,
    
    // Current module setters
    setParams,
    setPattern,
    setModulator,
    setAutomation,
    clearAutomation,
    clearAllAutomation,
    
    // Multi-module setters
    setAllPatterns,
    setModuleParams,
    transposePattern,
    
    // Session management
    saveSession,
    loadSession,
    
    // Global
    tempo,
    setTempo,
    isPlaying,
    currentStep,
    start,
    stop,
    playNote,
    automationEnabled,
    toggleAutomationEnabled,
    playbackPosition,
    
    // Mixer
    mixer,
    setMixerChannel,
    setMasterVolume,
    
    // Drum integration
    setDrumScheduler,
    getAudioContext: () => audioCtxRef.current,
    getMasterGain: () => masterGainRef.current,

    // Pro Mixer integration
    reconnectVoice: (id: ModuleId, destination: AudioNode) => {
      voicesRef.current[id]?.reconnect(destination);
    },
    reconnectAllToMaster: () => {
      const masterGain = masterGainRef.current;
      if (!masterGain) return;
      const modules: ModuleId[] = ['bass', 'lead', 'arp'];
      for (const id of modules) {
        voicesRef.current[id]?.reconnect(masterGain);
      }
    },

    // Constants
    NOTES,
    MODULE_CONFIGS
  };
}
