import { useRef, useCallback, useEffect, useState } from 'react';

export interface TB303Params {
  cutoff: number;      // 0-1
  resonance: number;   // 0-1
  envMod: number;      // 0-1
  decay: number;       // 0-1
  accent: number;      // 0-1
  overdrive: number;   // 0-1
  waveform: 'saw' | 'pulse';
  tempo: number;
  volume: number;
}

export interface Step {
  note: number;
  active: boolean;
  accent: boolean;
  slide: boolean;
}

// Modulator types
export type ModShape = 'sine' | 'triangle' | 'square' | 'random';

export interface Modulator {
  enabled: boolean;
  rate: number;
  depth: number;
  shape: ModShape;
  sync: boolean;
}

export interface ModulatorState {
  cutoff: Modulator;
  resonance: Modulator;
  envMod: Modulator;
}

// Automation types
export type AutomationParam = 'cutoff' | 'resonance' | 'envMod' | 'decay' | 'accent' | 'overdrive';

export const AUTOMATION_PARAMS: { id: AutomationParam; label: string; color: string }[] = [
  { id: 'cutoff', label: 'Cutoff', color: '#ff6b00' },
  { id: 'resonance', label: 'Reso', color: '#ff9500' },
  { id: 'envMod', label: 'Env', color: '#ffb800' },
  { id: 'decay', label: 'Decay', color: '#10b981' },
  { id: 'accent', label: 'Accent', color: '#ef4444' },
  { id: 'overdrive', label: 'Drive', color: '#8b5cf6' },
];

export const AUTOMATION_RESOLUTION = 64; // Points per pattern

export interface AutomationLane {
  enabled: boolean;
  points: number[]; // 64 values, each 0-1
}

export interface AutomationState {
  cutoff: AutomationLane;
  resonance: AutomationLane;
  envMod: AutomationLane;
  decay: AutomationLane;
  accent: AutomationLane;
  overdrive: AutomationLane;
}

// Session data structure for save/load
export interface SessionData {
  version: number;
  name: string;
  createdAt: string;
  params: TB303Params;
  pattern: Step[];
  modulators: ModulatorState;
  automation: AutomationState;
  automationEnabled: boolean;
}

export const SESSION_VERSION = 1;

const createEmptyLane = (): AutomationLane => ({
  enabled: false,
  points: Array(AUTOMATION_RESOLUTION).fill(-1), // -1 means no automation
});

const DEFAULT_AUTOMATION: AutomationState = {
  cutoff: createEmptyLane(),
  resonance: createEmptyLane(),
  envMod: createEmptyLane(),
  decay: createEmptyLane(),
  accent: createEmptyLane(),
  overdrive: createEmptyLane(),
};

const DEFAULT_MODULATOR: Modulator = {
  enabled: false,
  rate: 0.3,
  depth: 0,
  shape: 'sine',
  sync: false
};

const DEFAULT_MODULATORS: ModulatorState = {
  cutoff: { ...DEFAULT_MODULATOR },
  resonance: { ...DEFAULT_MODULATOR },
  envMod: { ...DEFAULT_MODULATOR }
};

const DEFAULT_PARAMS: TB303Params = {
  cutoff: 0.26,
  resonance: 0.64,
  envMod: 0.13,
  decay: 0.78,
  accent: 0.7,
  overdrive: 0.73,
  waveform: 'saw',
  tempo: 138,
  volume: 0.7
};

const NOTES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export function noteToFreq(note: number): number {
  return 440 * Math.pow(2, (note - 69) / 12);
}

// Catmull-Rom spline interpolation for smooth curves
function catmullRomInterpolate(p0: number, p1: number, p2: number, p3: number, t: number): number {
  const t2 = t * t;
  const t3 = t2 * t;
  return 0.5 * (
    (2 * p1) +
    (-p0 + p2) * t +
    (2 * p0 - 5 * p1 + 4 * p2 - p3) * t2 +
    (-p0 + 3 * p1 - 3 * p2 + p3) * t3
  );
}

// Get interpolated automation value at a position (0-1)
export function getAutomationValue(lane: AutomationLane, position: number): number | null {
  if (!lane.enabled) return null;
  
  const points = lane.points;
  const len = points.length;
  
  // Find surrounding points with values
  const exactIndex = position * (len - 1);
  const index = Math.floor(exactIndex);
  const t = exactIndex - index;
  
  // Get 4 points for catmull-rom (handle edges)
  const getPoint = (i: number): number => {
    const idx = Math.max(0, Math.min(len - 1, i));
    const val = points[idx];
    // If no value at this point, try to find nearest
    if (val < 0) {
      // Search for nearest valid point
      for (let d = 1; d < len; d++) {
        if (idx - d >= 0 && points[idx - d] >= 0) return points[idx - d];
        if (idx + d < len && points[idx + d] >= 0) return points[idx + d];
      }
      return -1;
    }
    return val;
  };
  
  const p0 = getPoint(index - 1);
  const p1 = getPoint(index);
  const p2 = getPoint(index + 1);
  const p3 = getPoint(index + 2);
  
  // If no valid points found, return null
  if (p1 < 0) return null;
  
  // Use catmull-rom for smooth interpolation
  const result = catmullRomInterpolate(
    p0 >= 0 ? p0 : p1,
    p1,
    p2 >= 0 ? p2 : p1,
    p3 >= 0 ? p3 : (p2 >= 0 ? p2 : p1),
    t
  );
  
  return Math.max(0, Math.min(1, result));
}

// SVF Processor code - unique name for TB303 engine
const SVF_PROCESSOR_CODE = `
class SVFProcessorTB303 extends AudioWorkletProcessor {
  constructor() {
    super();
    this.lp1 = 0;
    this.bp1 = 0;
    this.lp2 = 0;
    this.bp2 = 0;
    this.kf = 0.1;
    this.kq = 0.3;
  }
  
  static get parameterDescriptors() {
    return [
      { name: 'frequency', defaultValue: 1000, minValue: 20, maxValue: 20000, automationRate: 'a-rate' },
      { name: 'resonance', defaultValue: 0.5, minValue: 0, maxValue: 1, automationRate: 'a-rate' }
    ];
  }
  
  process(inputs, outputs, parameters) {
    const input = inputs[0];
    const output = outputs[0];
    
    if (!input || !input[0] || !output || !output[0]) return true;
    
    const inputChannel = input[0];
    const outputChannel = output[0];
    
    for (let i = 0; i < inputChannel.length; i++) {
      const freq = parameters.frequency.length > 1 ? parameters.frequency[i] : parameters.frequency[0];
      const res = parameters.resonance.length > 1 ? parameters.resonance[i] : parameters.resonance[0];
      
      this.kf = Math.min(0.99, 2 * Math.sin(Math.PI * freq / sampleRate));
      this.kq = Math.max(0.01, 1 - res * 0.95);
      
      const inp = inputChannel[i];
      
      const hp1 = inp - this.lp1 - this.kq * this.bp1;
      this.bp1 += this.kf * hp1;
      this.lp1 += this.kf * this.bp1;
      
      const hp2 = this.lp1 - this.lp2 - this.kq * this.bp2;
      this.bp2 += this.kf * hp2;
      this.lp2 += this.kf * this.bp2;
      
      outputChannel[i] = this.lp2;
    }
    
    return true;
  }
}

try {
  registerProcessor('svf-processor-tb303', SVFProcessorTB303);
} catch (e) {
  // Already registered, ignore
}
`;

function generateLFOValue(phase: number, shape: ModShape, randomValue: number): number {
  const p = phase % 1;
  switch (shape) {
    case 'sine':
      return Math.sin(p * Math.PI * 2);
    case 'triangle':
      return p < 0.5 ? (p * 4 - 1) : (3 - p * 4);
    case 'square':
      return p < 0.5 ? 1 : -1;
    case 'random':
      return randomValue;
    default:
      return 0;
  }
}

export function useTB303Engine() {
  const audioCtxRef = useRef<AudioContext | null>(null);
  const oscRef = useRef<OscillatorNode | null>(null);
  const filterNodeRef = useRef<AudioWorkletNode | null>(null);
  const filterFreqParamRef = useRef<AudioParam | null>(null);
  const filterResParamRef = useRef<AudioParam | null>(null);
  const vcaRef = useRef<GainNode | null>(null);
  const accentGainRef = useRef<GainNode | null>(null);
  const overdriveRef = useRef<WaveShaperNode | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  
  // Envelope state
  const filterEnvRef = useRef(0);
  const accentEnvRef = useRef(0);
  const vcaEnvRef = useRef(0);
  const envIntervalRef = useRef<number | null>(null);
  
  // LFO state
  const lfoPhaseRef = useRef({ cutoff: 0, resonance: 0, envMod: 0 });
  const lfoRandomRef = useRef({ cutoff: 0, resonance: 0, envMod: 0 });
  const lastLfoStepRef = useRef({ cutoff: 0, resonance: 0, envMod: 0 });
  
  // Fallback filter refs
  const fallbackFilter1Ref = useRef<BiquadFilterNode | null>(null);
  const fallbackFilter2Ref = useRef<BiquadFilterNode | null>(null);
  const useFallbackRef = useRef(false);
  
  // Parameters
  const paramsRef = useRef<TB303Params>(DEFAULT_PARAMS);
  const [params, setParamsState] = useState<TB303Params>(DEFAULT_PARAMS);
  
  // Base params (before automation) - used for automation to know the "base" value
  const baseParamsRef = useRef<TB303Params>(DEFAULT_PARAMS);
  
  // Modulators
  const modulatorsRef = useRef<ModulatorState>(DEFAULT_MODULATORS);
  const [modulators, setModulatorsState] = useState<ModulatorState>(DEFAULT_MODULATORS);
  
  // Automation
  const automationRef = useRef<AutomationState>(DEFAULT_AUTOMATION);
  const [automation, setAutomationState] = useState<AutomationState>(DEFAULT_AUTOMATION);
  const [isRecording, setIsRecording] = useState(false);
  const isRecordingRef = useRef(false);
  
  // Global automation enabled state
  const automationEnabledRef = useRef(true);
  const [automationEnabled, setAutomationEnabled] = useState(true);
  
  // Playback position (0-1, continuous through the pattern)
  const playbackPositionRef = useRef(0);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  
  // Sequencer state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [pattern, setPattern] = useState<Step[]>(() => 
    Array(16).fill(null).map((_, i) => ({
      note: 36 + (i % 12),
      active: i % 4 === 0,
      accent: i % 8 === 0,
      slide: false
    }))
  );
  
  const timerRef = useRef<number | null>(null);
  const nextNoteTimeRef = useRef(0);
  const currentStepRef = useRef(0);
  const isInitializedRef = useRef(false);
  const lastNoteTimeRef = useRef(0);
  const patternRef = useRef<Step[]>(pattern);
  const lastStepUpdateRef = useRef(0);
  const patternStartTimeRef = useRef(0);
  
  useEffect(() => {
    patternRef.current = pattern;
  }, [pattern]);
  
  // Overdrive curve
  const makeDistortionCurve = useCallback((amount: number): Float32Array => {
    const samples = 8192;
    const curve = new Float32Array(samples);
    const drive = 1 + amount * 8;
    
    for (let i = 0; i < samples; i++) {
      const x = (i * 2) / samples - 1;
      let y = x * drive;
      y = Math.tanh(y);
      curve[i] = y;
    }
    return curve;
  }, []);
  
  const initAudio = useCallback(async () => {
    if (audioCtxRef.current && isInitializedRef.current) return;
    
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    
    if (!AudioContextClass) {
      console.error('Web Audio API not supported');
      return;
    }
    
    const ctx = new AudioContextClass({
      latencyHint: 'interactive',
      sampleRate: 44100
    });
    
    audioCtxRef.current = ctx;
    
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
    
    const osc = ctx.createOscillator();
    osc.type = paramsRef.current.waveform === 'saw' ? 'sawtooth' : 'square';
    osc.frequency.value = 110;
    oscRef.current = osc;
    
    const vca = ctx.createGain();
    vca.gain.value = 0;
    vcaRef.current = vca;
    
    const accentGain = ctx.createGain();
    accentGain.gain.value = 1;
    accentGainRef.current = accentGain;
    
    const overdrive = ctx.createWaveShaper();
    overdrive.curve = makeDistortionCurve(paramsRef.current.overdrive);
    overdrive.oversample = '2x';
    overdriveRef.current = overdrive;
    
    const masterGain = ctx.createGain();
    masterGain.gain.value = paramsRef.current.volume;
    masterGainRef.current = masterGain;
    
    let filterNode: AudioWorkletNode | BiquadFilterNode;
    
    try {
      const blob = new Blob([SVF_PROCESSOR_CODE], { type: 'application/javascript' });
      const url = URL.createObjectURL(blob);
      
      await ctx.audioWorklet.addModule(url);
      URL.revokeObjectURL(url);
      
      filterNode = new AudioWorkletNode(ctx, 'svf-processor-tb303');
      filterNodeRef.current = filterNode;
      filterFreqParamRef.current = filterNode.parameters.get('frequency') || null;
      filterResParamRef.current = filterNode.parameters.get('resonance') || null;
      
      osc.connect(filterNode);
      filterNode.connect(vca);
      
      useFallbackRef.current = false;
    } catch (e) {
      console.warn('AudioWorklet not supported, using fallback biquad filters', e);
      useFallbackRef.current = true;
      
      const filter1 = ctx.createBiquadFilter();
      filter1.type = 'lowpass';
      filter1.frequency.value = 500;
      filter1.Q.value = 8;
      fallbackFilter1Ref.current = filter1;
      
      const filter2 = ctx.createBiquadFilter();
      filter2.type = 'lowpass';
      filter2.frequency.value = 500;
      filter2.Q.value = 4;
      fallbackFilter2Ref.current = filter2;
      
      osc.connect(filter1);
      filter1.connect(filter2);
      filter2.connect(vca);
    }
    
    vca.connect(accentGain);
    accentGain.connect(overdrive);
    overdrive.connect(masterGain);
    masterGain.connect(ctx.destination);
    
    osc.start();
    isInitializedRef.current = true;
    
    startEnvelopeProcessor();
  }, [makeDistortionCurve]);
  
  // Calculate LFO rate in Hz
  const getLfoRateHz = useCallback((mod: Modulator, tempo: number): number => {
    if (mod.sync) {
      const divisions = [16, 8, 4, 2, 1, 0.5, 0.25, 0.125];
      const idx = Math.floor(mod.rate * (divisions.length - 1));
      const beats = divisions[idx];
      return tempo / 60 / beats;
    } else {
      return 0.1 * Math.pow(200, mod.rate);
    }
  }, []);
  
  // Envelope processor with LFO and automation
  const startEnvelopeProcessor = useCallback(() => {
    if (envIntervalRef.current) return;
    
    let lastTime = performance.now();
    let lastPositionUpdate = 0;
    
    const processEnvelopes = () => {
      const ctx = audioCtxRef.current;
      if (!ctx) return;
      
      const currentTime = performance.now();
      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;
      
      const p = paramsRef.current;
      const basep = baseParamsRef.current;
      const mods = modulatorsRef.current;
      const auto = automationRef.current;
      const now = ctx.currentTime;
      const pos = playbackPositionRef.current;
      
      // Update playback position state (throttled)
      if (currentTime - lastPositionUpdate > 33) { // ~30fps
        lastPositionUpdate = currentTime;
        setPlaybackPosition(pos);
      }
      
      // Exponential decay for filter envelope
      const filterDecayRate = Math.exp(-(1 - p.decay) * 0.15);
      filterEnvRef.current *= filterDecayRate;
      accentEnvRef.current *= 0.995;
      vcaEnvRef.current *= 0.992;
      
      // === LFO Processing ===
      const lfoValues = { cutoff: 0, resonance: 0, envMod: 0 };
      
      (['cutoff', 'resonance', 'envMod'] as const).forEach(param => {
        const mod = mods[param];
        if (mod.depth > 0) {
          const rateHz = getLfoRateHz(mod, p.tempo);
          const phaseIncrement = rateHz * deltaTime;
          
          lfoPhaseRef.current[param] += phaseIncrement;
          
          if (mod.shape === 'random') {
            const currentStep = Math.floor(lfoPhaseRef.current[param]);
            if (currentStep !== lastLfoStepRef.current[param]) {
              lfoRandomRef.current[param] = Math.random() * 2 - 1;
              lastLfoStepRef.current[param] = currentStep;
            }
          }
          
          lfoValues[param] = generateLFOValue(
            lfoPhaseRef.current[param],
            mod.shape,
            lfoRandomRef.current[param]
          ) * mod.depth;
        }
      });
      
      // === Get automation values ===
      const autoValues: Partial<Record<AutomationParam, number | null>> = {};
      (['cutoff', 'resonance', 'envMod', 'decay', 'accent', 'overdrive'] as const).forEach(param => {
        // Only get automation values if automation is globally enabled
        autoValues[param] = automationEnabledRef.current ? getAutomationValue(auto[param], pos) : null;
      });
      
      // === Calculate final parameter values ===
      // Start with base value, apply automation if exists, then apply LFO
      const getCutoff = () => {
        let val = autoValues.cutoff !== null ? autoValues.cutoff! : basep.cutoff;
        val = Math.max(0, Math.min(1, val + lfoValues.cutoff * 0.5));
        return val;
      };
      
      const getResonance = () => {
        let val = autoValues.resonance !== null ? autoValues.resonance! : basep.resonance;
        val = Math.max(0, Math.min(1, val + lfoValues.resonance * 0.5));
        return val;
      };
      
      const getEnvMod = () => {
        let val = autoValues.envMod !== null ? autoValues.envMod! : basep.envMod;
        val = Math.max(0, Math.min(1, val + lfoValues.envMod * 0.5));
        return val;
      };
      
      const modulatedCutoff = getCutoff();
      const baseCutoff = Math.pow(2, modulatedCutoff * 7 - 5) * 1000;
      
      const modulatedResonance = getResonance();
      const modulatedEnvMod = getEnvMod();
      
      // Apply automation to overdrive if exists
      if (autoValues.overdrive !== null && overdriveRef.current) {
        overdriveRef.current.curve = makeDistortionCurve(autoValues.overdrive!);
      }
      
      // Envelope modulation amount
      const envMod = filterEnvRef.current * modulatedEnvMod * 5;
      const accentMod = accentEnvRef.current * 0.4;
      
      // Final filter frequency
      const filterFreq = Math.min(18000, baseCutoff * Math.pow(2, envMod + accentMod));
      
      // Update filter
      if (!useFallbackRef.current && filterFreqParamRef.current && filterResParamRef.current) {
        filterFreqParamRef.current.setValueAtTime(filterFreq, now);
        filterResParamRef.current.setValueAtTime(modulatedResonance, now);
      } else if (fallbackFilter1Ref.current && fallbackFilter2Ref.current) {
        const q = 0.5 + Math.pow(modulatedResonance, 2) * 15;
        fallbackFilter1Ref.current.frequency.setValueAtTime(filterFreq, now);
        fallbackFilter1Ref.current.Q.setValueAtTime(q, now);
        fallbackFilter2Ref.current.frequency.setValueAtTime(filterFreq, now);
        fallbackFilter2Ref.current.Q.setValueAtTime(q * 0.5, now);
      }
      
      envIntervalRef.current = requestAnimationFrame(processEnvelopes);
    };
    
    envIntervalRef.current = requestAnimationFrame(processEnvelopes);
  }, [getLfoRateHz, makeDistortionCurve]);
  
  const stopEnvelopeProcessor = useCallback(() => {
    if (envIntervalRef.current) {
      cancelAnimationFrame(envIntervalRef.current);
      envIntervalRef.current = null;
    }
  }, []);
  
  const setParams = useCallback((newParams: Partial<TB303Params>) => {
    paramsRef.current = { ...paramsRef.current, ...newParams };
    baseParamsRef.current = { ...baseParamsRef.current, ...newParams };
    setParamsState(paramsRef.current);
    
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    
    // Record automation if recording
    if (isRecordingRef.current && playbackPositionRef.current >= 0) {
      const pointIndex = Math.floor(playbackPositionRef.current * AUTOMATION_RESOLUTION);
      const clampedIndex = Math.max(0, Math.min(AUTOMATION_RESOLUTION - 1, pointIndex));
      
      (['cutoff', 'resonance', 'envMod', 'decay', 'accent', 'overdrive'] as const).forEach(param => {
        if (newParams[param] !== undefined) {
          const lane = automationRef.current[param];
          const newPoints = [...lane.points];
          newPoints[clampedIndex] = newParams[param]!;
          automationRef.current = {
            ...automationRef.current,
            [param]: { enabled: true, points: newPoints }
          };
        }
      });
      
      setAutomationState({ ...automationRef.current });
    }
    
    if (newParams.overdrive !== undefined && overdriveRef.current) {
      overdriveRef.current.curve = makeDistortionCurve(newParams.overdrive);
    }
    
    if (newParams.waveform !== undefined && oscRef.current) {
      oscRef.current.type = newParams.waveform === 'saw' ? 'sawtooth' : 'square';
    }
    
    if (newParams.volume !== undefined && masterGainRef.current) {
      masterGainRef.current.gain.setTargetAtTime(newParams.volume, ctx.currentTime, 0.01);
    }
  }, [makeDistortionCurve]);
  
  // Update modulators
  const setModulators = useCallback((newMods: Partial<ModulatorState>) => {
    modulatorsRef.current = { ...modulatorsRef.current, ...newMods };
    setModulatorsState(modulatorsRef.current);
  }, []);
  
  const setModulator = useCallback((param: keyof ModulatorState, updates: Partial<Modulator>) => {
    const current = modulatorsRef.current[param];
    modulatorsRef.current = {
      ...modulatorsRef.current,
      [param]: { ...current, ...updates }
    };
    setModulatorsState(modulatorsRef.current);
  }, []);
  
  // Set automation data directly (for drawing)
  const setAutomation = useCallback((param: AutomationParam, points: number[]) => {
    automationRef.current = {
      ...automationRef.current,
      [param]: { enabled: true, points }
    };
    setAutomationState({ ...automationRef.current });
  }, []);
  
  // Clear automation for a parameter
  const clearAutomation = useCallback((param: AutomationParam) => {
    automationRef.current = {
      ...automationRef.current,
      [param]: createEmptyLane()
    };
    setAutomationState({ ...automationRef.current });
  }, []);
  
  // Clear all automation
  const clearAllAutomation = useCallback(() => {
    automationRef.current = DEFAULT_AUTOMATION;
    setAutomationState({ ...DEFAULT_AUTOMATION });
  }, []);
  
  // Toggle recording
  const toggleRecording = useCallback(() => {
    isRecordingRef.current = !isRecordingRef.current;
    setIsRecording(isRecordingRef.current);
  }, []);
  
  const triggerNote = useCallback((frequency: number, accent: boolean, slide: boolean, prevFreq?: number) => {
    const ctx = audioCtxRef.current;
    const osc = oscRef.current;
    const vca = vcaRef.current;
    const accentGain = accentGainRef.current;
    
    if (!ctx || !osc || !vca) return;
    
    const now = ctx.currentTime;
    const p = paramsRef.current;
    const auto = automationRef.current;
    const pos = playbackPositionRef.current;
    
    // Get accent from automation or params (only if automation enabled)
    const accentValue = automationEnabledRef.current ? (getAutomationValue(auto.accent, pos) ?? p.accent) : p.accent;
    const decayValue = automationEnabledRef.current ? (getAutomationValue(auto.decay, pos) ?? p.decay) : p.decay;
    
    if (slide && prevFreq) {
      osc.frequency.cancelScheduledValues(now);
      osc.frequency.setValueAtTime(prevFreq, now);
      osc.frequency.exponentialRampToValueAtTime(frequency, now + 0.05);
    } else {
      osc.frequency.setValueAtTime(frequency, now);
    }
    
    if (!slide) {
      filterEnvRef.current = 1;
      
      if (accent) {
        accentEnvRef.current = accentValue;
      }
      
      vcaEnvRef.current = 1;
      
      // Attack time: 3ms minimum to avoid clicks (musician tip!)
      const attackTime = 0.003;
      const level = accent ? 1.0 : 0.7;
      
      vca.gain.cancelScheduledValues(now);
      vca.gain.setValueAtTime(0, now);
      vca.gain.linearRampToValueAtTime(level, now + attackTime);
      vca.gain.setTargetAtTime(level * 0.8, now + attackTime, 0.1 + decayValue * 0.3);
    }
    
    if (accentGain) {
      const accentLevel = accent ? 1 + accentValue * 0.5 : 1;
      accentGain.gain.setTargetAtTime(accentLevel, now, 0.01);
    }
    
    lastNoteTimeRef.current = now;
  }, []);
  
  const scheduleNote = useCallback((time: number, step: Step, prevStep?: Step) => {
    if (!step.active) return;
    
    const freq = noteToFreq(step.note);
    const prevFreq = prevStep?.active ? noteToFreq(prevStep.note) : undefined;
    
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    
    const triggerTime = time - ctx.currentTime;
    if (triggerTime > 0) {
      setTimeout(() => {
        triggerNote(freq, step.accent, step.slide, prevFreq);
      }, triggerTime * 1000);
    } else {
      triggerNote(freq, step.accent, step.slide, prevFreq);
    }
  }, [triggerNote]);
  
  const scheduler = useCallback(() => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    
    const secondsPerBeat = 60.0 / paramsRef.current.tempo / 4;
    const patternDuration = secondsPerBeat * 16;
    
    // Update playback position continuously
    const elapsed = ctx.currentTime - patternStartTimeRef.current;
    playbackPositionRef.current = (elapsed % patternDuration) / patternDuration;
    
    while (nextNoteTimeRef.current < ctx.currentTime + 0.1) {
      const currentPattern = patternRef.current;
      const step = currentPattern[currentStepRef.current];
      const prevStep = currentPattern[(currentStepRef.current - 1 + 16) % 16];
      
      scheduleNote(nextNoteTimeRef.current, step, prevStep);
      
      const now = performance.now();
      if (now - lastStepUpdateRef.current > 50) {
        lastStepUpdateRef.current = now;
        const stepToUpdate = currentStepRef.current;
        setCurrentStep(stepToUpdate);
      }
      
      nextNoteTimeRef.current += secondsPerBeat;
      currentStepRef.current = (currentStepRef.current + 1) % 16;
    }
  }, [scheduleNote]);
  
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
  
  const stop = useCallback(() => {
    if (timerRef.current) {
      cancelAnimationFrame(timerRef.current);
      timerRef.current = null;
    }
    setIsPlaying(false);
    setCurrentStep(0);
    playbackPositionRef.current = 0;
    setPlaybackPosition(0);
    
    // Stop recording if active
    if (isRecordingRef.current) {
      isRecordingRef.current = false;
      setIsRecording(false);
    }
    
    const ctx = audioCtxRef.current;
    const vca = vcaRef.current;
    if (ctx && vca) {
      vca.gain.cancelScheduledValues(ctx.currentTime);
      vca.gain.setTargetAtTime(0, ctx.currentTime, 0.02);
    }
    
    filterEnvRef.current = 0;
    accentEnvRef.current = 0;
    vcaEnvRef.current = 0;
  }, []);
  
  const playNote = useCallback(async (note: number, accent = false) => {
    await initAudio();
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
    
    triggerNote(noteToFreq(note), accent, false);
  }, [initAudio, triggerNote]);
  
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        cancelAnimationFrame(timerRef.current);
      }
      stopEnvelopeProcessor();
      // Only close if not already closed
      if (audioCtxRef.current && audioCtxRef.current.state !== 'closed') {
        audioCtxRef.current.close();
      }
    };
  }, [stopEnvelopeProcessor]);
  
  // Toggle automation enabled
  const toggleAutomationEnabled = useCallback(() => {
    automationEnabledRef.current = !automationEnabledRef.current;
    setAutomationEnabled(automationEnabledRef.current);
  }, []);
  
  // Get session data for save
  const getSessionData = useCallback((name: string): SessionData => {
    return {
      version: SESSION_VERSION,
      name,
      createdAt: new Date().toISOString(),
      params: paramsRef.current,
      pattern: patternRef.current,
      modulators: modulatorsRef.current,
      automation: automationRef.current,
      automationEnabled: automationEnabledRef.current
    };
  }, []);
  
  // Load session data
  const loadSessionData = useCallback((session: SessionData) => {
    // Load params
    paramsRef.current = { ...DEFAULT_PARAMS, ...session.params };
    baseParamsRef.current = { ...paramsRef.current };
    setParamsState(paramsRef.current);
    
    // Load pattern
    patternRef.current = session.pattern;
    setPattern(session.pattern);
    
    // Load modulators
    if (session.modulators) {
      modulatorsRef.current = session.modulators;
      setModulatorsState(session.modulators);
    }
    
    // Load automation
    if (session.automation) {
      automationRef.current = session.automation;
      setAutomationState(session.automation);
    }
    
    // Load automation enabled state
    if (session.automationEnabled !== undefined) {
      automationEnabledRef.current = session.automationEnabled;
      setAutomationEnabled(session.automationEnabled);
    }
    
    // Apply audio settings
    const ctx = audioCtxRef.current;
    if (ctx && overdriveRef.current) {
      overdriveRef.current.curve = makeDistortionCurve(paramsRef.current.overdrive);
    }
    if (ctx && oscRef.current) {
      oscRef.current.type = paramsRef.current.waveform === 'saw' ? 'sawtooth' : 'square';
    }
    if (ctx && masterGainRef.current) {
      masterGainRef.current.gain.setTargetAtTime(paramsRef.current.volume, ctx.currentTime, 0.01);
    }
  }, [makeDistortionCurve]);
  
  return {
    params,
    setParams,
    modulators,
    setModulators,
    setModulator,
    automation,
    setAutomation,
    clearAutomation,
    clearAllAutomation,
    automationEnabled,
    toggleAutomationEnabled,
    isRecording,
    toggleRecording,
    playbackPosition,
    pattern,
    setPattern,
    isPlaying,
    currentStep,
    start,
    stop,
    playNote,
    getSessionData,
    loadSessionData,
    NOTES
  };
}