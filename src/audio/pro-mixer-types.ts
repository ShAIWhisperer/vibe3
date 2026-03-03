// ============================================================
// Pro Mixer Types & Defaults
// ============================================================

// --- Per-band EQ ---
export interface EQBandState {
  frequency: number;
  gain: number; // dB (-12 to +12)
  Q: number;
}

export interface EQState {
  low: EQBandState;
  mid: EQBandState;
  high: EQBandState;
}

// --- Channel Compressor ---
export interface CompressorState {
  threshold: number; // dB (-60 to 0)
  ratio: number; // 1:1 to 20:1
  attack: number; // seconds (0.001 - 1)
  release: number; // seconds (0.01 - 1)
  knee: number; // dB (0 - 40)
  makeup: number; // linear gain (0.25 - 4)
}

// --- AUX Send Levels ---
export interface AuxSendState {
  delay: number; // 0-1
  chorus: number;
  reverb: number;
  flanger: number;
}

export type AuxEffectId = 'delay' | 'chorus' | 'reverb' | 'flanger';
export const AUX_EFFECT_IDS: AuxEffectId[] = ['delay', 'chorus', 'reverb', 'flanger'];

// --- Full Channel Strip ---
export interface ChannelStripState {
  volume: number; // 0-1
  pan: number; // -1 to 1
  mute: boolean;
  solo: boolean;
  eq: EQState;
  compressor: CompressorState;
  auxSends: AuxSendState;
}

// --- Effect Parameters ---
export interface DelayEffectState {
  time: number; // 0-2 seconds
  feedback: number; // 0-0.95
  filterCutoff: number; // 200-8000 Hz
  wetDry: number; // 0-1
  tempoSync: boolean;
  syncDivision: string; // '1/4', '1/8', '1/16', etc.
}

export interface ChorusEffectState {
  rate: number; // 0.1-10 Hz
  depth: number; // 0-1
  wetDry: number; // 0-1
}

export interface ReverbEffectState {
  roomSize: number; // 0-1
  damping: number; // 0-1
  wetDry: number; // 0-1
  preDelay: number; // 0-100 ms
}

export interface FlangerEffectState {
  rate: number; // 0.05-5 Hz
  depth: number; // 0-1
  feedback: number; // -0.95 to 0.95
  wetDry: number; // 0-1
}

// --- AUX Return ---
export interface AuxReturnState {
  delay: { params: DelayEffectState; returnLevel: number };
  chorus: { params: ChorusEffectState; returnLevel: number };
  reverb: { params: ReverbEffectState; returnLevel: number };
  flanger: { params: FlangerEffectState; returnLevel: number };
}

// --- Master Bus ---
export interface LimiterState {
  threshold: number; // dB (-6 to 0)
  release: number; // seconds
}

export interface MasterBusState {
  eq: EQState;
  compressor: CompressorState;
  limiter: LimiterState;
  volume: number; // 0-1
}

// --- Channel IDs ---
export type ProMixerChannelId =
  | 'bass'
  | 'lead'
  | 'arp'
  | 'drum0'
  | 'drum1'
  | 'drum2'
  | 'drum3'
  | 'drum4'
  | 'drum5'
  | 'drum6'
  | 'drum7';

export const SYNTH_CHANNEL_IDS: ProMixerChannelId[] = ['bass', 'lead', 'arp'];
export const DRUM_CHANNEL_IDS: ProMixerChannelId[] = [
  'drum0', 'drum1', 'drum2', 'drum3',
  'drum4', 'drum5', 'drum6', 'drum7',
];
export const ALL_CHANNEL_IDS: ProMixerChannelId[] = [...SYNTH_CHANNEL_IDS, ...DRUM_CHANNEL_IDS];

// --- Full Pro Mixer State (serializable) ---
export interface ProMixerState {
  channels: Record<ProMixerChannelId, ChannelStripState>;
  auxReturns: AuxReturnState;
  master: MasterBusState;
}

// ============================================================
// Defaults
// ============================================================

export const DEFAULT_EQ_STATE: EQState = {
  low: { frequency: 100, gain: 0, Q: 0.7 },
  mid: { frequency: 1000, gain: 0, Q: 1 },
  high: { frequency: 8000, gain: 0, Q: 0.7 },
};

export const DEFAULT_COMPRESSOR_STATE: CompressorState = {
  threshold: -24,
  ratio: 4,
  attack: 0.003,
  release: 0.25,
  knee: 6,
  makeup: 1,
};

export const DEFAULT_AUX_SENDS: AuxSendState = {
  delay: 0,
  chorus: 0,
  reverb: 0,
  flanger: 0,
};

export const DEFAULT_CHANNEL_STRIP: ChannelStripState = {
  volume: 0.8,
  pan: 0,
  mute: false,
  solo: false,
  eq: { ...DEFAULT_EQ_STATE },
  compressor: { ...DEFAULT_COMPRESSOR_STATE },
  auxSends: { ...DEFAULT_AUX_SENDS },
};

export const DEFAULT_DELAY_EFFECT: DelayEffectState = {
  time: 0.375,
  feedback: 0.4,
  filterCutoff: 3000,
  wetDry: 0.5,
  tempoSync: false,
  syncDivision: '1/8',
};

export const DEFAULT_CHORUS_EFFECT: ChorusEffectState = {
  rate: 1.5,
  depth: 0.5,
  wetDry: 0.5,
};

export const DEFAULT_REVERB_EFFECT: ReverbEffectState = {
  roomSize: 0.5,
  damping: 0.5,
  wetDry: 0.3,
  preDelay: 20,
};

export const DEFAULT_FLANGER_EFFECT: FlangerEffectState = {
  rate: 0.5,
  depth: 0.5,
  feedback: 0.5,
  wetDry: 0.5,
};

export const DEFAULT_AUX_RETURNS: AuxReturnState = {
  delay: { params: { ...DEFAULT_DELAY_EFFECT }, returnLevel: 0.7 },
  chorus: { params: { ...DEFAULT_CHORUS_EFFECT }, returnLevel: 0.7 },
  reverb: { params: { ...DEFAULT_REVERB_EFFECT }, returnLevel: 0.7 },
  flanger: { params: { ...DEFAULT_FLANGER_EFFECT }, returnLevel: 0.7 },
};

export const DEFAULT_LIMITER: LimiterState = {
  threshold: -1,
  release: 0.1,
};

export const DEFAULT_MASTER_BUS: MasterBusState = {
  eq: { ...DEFAULT_EQ_STATE },
  compressor: {
    threshold: -12,
    ratio: 2,
    attack: 0.01,
    release: 0.15,
    knee: 10,
    makeup: 1,
  },
  limiter: { ...DEFAULT_LIMITER },
  volume: 0.85,
};

export function createDefaultProMixerState(): ProMixerState {
  const channels = {} as Record<ProMixerChannelId, ChannelStripState>;
  for (const id of ALL_CHANNEL_IDS) {
    channels[id] = JSON.parse(JSON.stringify(DEFAULT_CHANNEL_STRIP));
  }
  return {
    channels,
    auxReturns: JSON.parse(JSON.stringify(DEFAULT_AUX_RETURNS)),
    master: JSON.parse(JSON.stringify(DEFAULT_MASTER_BUS)),
  };
}

// --- Mixer Presets ---
export interface MixerPreset {
  id: string;
  name: string;
  description: string;
  state: Partial<ProMixerState>;
}

export const MIXER_PRESETS: MixerPreset[] = [
  {
    id: 'init',
    name: 'Init',
    description: 'Reset all to defaults',
    state: {},
  },
  {
    id: 'warm',
    name: 'Warm',
    description: 'Warm, smooth mix with low-end boost',
    state: {
      master: {
        ...DEFAULT_MASTER_BUS,
        eq: {
          low: { frequency: 100, gain: 3, Q: 0.7 },
          mid: { frequency: 800, gain: -1, Q: 1 },
          high: { frequency: 8000, gain: -2, Q: 0.7 },
        },
      },
    },
  },
  {
    id: 'crispy',
    name: 'Crispy',
    description: 'Bright, punchy mix with presence',
    state: {
      master: {
        ...DEFAULT_MASTER_BUS,
        eq: {
          low: { frequency: 100, gain: 1, Q: 0.7 },
          mid: { frequency: 2500, gain: 2, Q: 1 },
          high: { frequency: 10000, gain: 3, Q: 0.7 },
        },
        compressor: {
          threshold: -18,
          ratio: 3,
          attack: 0.005,
          release: 0.1,
          knee: 4,
          makeup: 1.2,
        },
      },
    },
  },
  {
    id: 'dub',
    name: 'Dub',
    description: 'Heavy delay + reverb sends',
    state: {
      auxReturns: {
        ...DEFAULT_AUX_RETURNS,
        delay: {
          params: { time: 0.5, feedback: 0.6, filterCutoff: 2000, wetDry: 0.6, tempoSync: false, syncDivision: '1/4' },
          returnLevel: 0.8,
        },
        reverb: {
          params: { roomSize: 0.8, damping: 0.6, wetDry: 0.5, preDelay: 30 },
          returnLevel: 0.8,
        },
      },
    },
  },
];
