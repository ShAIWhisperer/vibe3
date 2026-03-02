import type { Step, TB303Params } from '@/hooks/use-tb303-engine';
import type { ModuleId } from '@/hooks/use-multi-synth-engine';

// New multi-module analysis structure from Edge Function
export interface MultiModuleAnalysis {
  emotions: {
    primary: string;
    secondary: string;
    intensity: number;
  };
  description: string;
  global: {
    tempo: number;
    scale: string;
    rootNote: number;
  };
  bass: ModuleParams;
  lead: ModuleParams;
  arp: ModuleParams;
}

export interface ModuleParams {
  octave: number;
  rhythmDensity: number;
  accentAmount: number;
  slideAmount: number;
  movement: string;
  synth: {
    cutoff: number;
    resonance: number;
    envMod: number;
    decay: number;
    accent: number;
    overdrive: number;
  };
}

// Legacy single-module interface (for backwards compat)
export interface EmotionAnalysis {
  emotions: {
    primary: string;
    secondary: string;
    intensity: number;
  };
  description: string;
  music: {
    tempo: number;
    scale: string;
    baseNote: number;
    octaveRange: 1 | 2;
    rhythmDensity: number;
    accentAmount: number;
    slideAmount: number;
    synth: {
      cutoff: number;
      resonance: number;
      envMod: number;
      decay: number;
      accent: number;
      overdrive: number;
    };
  };
}

// Musical scales - intervals from root
const SCALES: Record<string, number[]> = {
  major: [0, 2, 4, 5, 7, 9, 11],
  minor: [0, 2, 3, 5, 7, 8, 10],
  dorian: [0, 2, 3, 5, 7, 9, 10],
  phrygian: [0, 1, 3, 5, 7, 8, 10],
  mixolydian: [0, 2, 4, 5, 7, 9, 10],
  blues: [0, 3, 5, 6, 7, 10],
  pentatonic: [0, 3, 5, 7, 10],
};

// Bass pattern: Root and fifth, sparse, steady
function generateBassPattern(
  scale: number[],
  rootNote: number,
  octave: number,
  density: number,
  accentAmount: number,
  slideAmount: number
): Step[] {
  const steps: Step[] = [];
  const baseNote = rootNote + (octave - 1) * 12;
  
  // Bass focuses on root (0) and fifth (usually index 4)
  const fifthIndex = scale.length > 4 ? 4 : Math.floor(scale.length / 2);
  const bassNotes = [0, fifthIndex]; // Root and fifth indices
  
  let currentNoteIdx = 0;
  
  for (let i = 0; i < 16; i++) {
    // Bass typically hits on downbeats (every 4 steps) and occasionally in between
    const isDownbeat = i % 4 === 0;
    const probability = isDownbeat ? 0.95 : density * 0.6;
    const active = Math.random() < probability;
    
    // Alternate between root and fifth
    if (active && i % 4 === 0) {
      currentNoteIdx = (currentNoteIdx + 1) % bassNotes.length;
    }
    
    const scaleIdx = bassNotes[currentNoteIdx];
    const note = baseNote + scale[scaleIdx];
    
    steps.push({
      note,
      active,
      accent: active && isDownbeat && Math.random() < accentAmount,
      slide: active && Math.random() < slideAmount,
    });
  }
  
  return steps;
}

// Lead pattern: Melodic movement with steps and occasional leaps
function generateLeadPattern(
  scale: number[],
  rootNote: number,
  octave: number,
  density: number,
  accentAmount: number,
  slideAmount: number
): Step[] {
  const steps: Step[] = [];
  const baseNote = rootNote + (octave - 1) * 12;
  
  let currentScaleIdx = 0;
  let lastWasActive = false;
  
  for (let i = 0; i < 16; i++) {
    const isDownbeat = i % 4 === 0;
    const isOffbeat = i % 2 === 1;
    
    // Melodic density varies
    let probability = density;
    if (isDownbeat) probability *= 1.3;
    if (isOffbeat && lastWasActive) probability *= 0.7;
    
    const active = Math.random() < Math.min(probability, 0.95);
    
    if (active) {
      // Melodic movement: steps (70%), leaps (20%), repeat (10%)
      const movement = Math.random();
      if (movement < 0.35) {
        // Step up
        currentScaleIdx = Math.min(currentScaleIdx + 1, scale.length - 1);
      } else if (movement < 0.65) {
        // Step down
        currentScaleIdx = Math.max(currentScaleIdx - 1, 0);
      } else if (movement < 0.85) {
        // Leap (skip a note)
        const leap = Math.random() < 0.5 ? 2 : -2;
        currentScaleIdx = Math.max(0, Math.min(scale.length - 1, currentScaleIdx + leap));
      }
      // else repeat same note
    }
    
    const note = baseNote + scale[currentScaleIdx];
    const accent = active && Math.random() < accentAmount;
    const slide = active && lastWasActive && Math.random() < slideAmount;
    
    steps.push({ note, active, accent, slide });
    lastWasActive = active;
  }
  
  return steps;
}

// Arp pattern: True arpeggiated movement cycling through chord tones
function generateArpPattern(
  scale: number[],
  rootNote: number,
  octave: number,
  density: number,
  accentAmount: number,
  slideAmount: number,
  movement: string
): Step[] {
  const steps: Step[] = [];
  const baseNote = rootNote + (octave - 1) * 12;
  
  // Arp uses chord tones: root, 3rd, 5th, 7th (or available scale degrees)
  const chordTones = scale.length >= 7 
    ? [0, 2, 4, 6] // 1, 3, 5, 7 scale degrees
    : scale.length >= 5
    ? [0, 2, 4]    // 1, 3, 5
    : [0, Math.floor(scale.length / 2)]; // Root and middle
  
  let arpIndex = 0;
  let direction = 1; // 1 = up, -1 = down
  
  // Determine initial direction based on movement type
  if (movement === 'arpeggio-down') {
    arpIndex = chordTones.length - 1;
    direction = -1;
  }
  
  for (let i = 0; i < 16; i++) {
    // Arp is dense - most steps are active
    const active = Math.random() < density;
    
    if (active) {
      // Move through arpeggio
      if (movement === 'arpeggio-updown') {
        arpIndex += direction;
        if (arpIndex >= chordTones.length - 1) {
          arpIndex = chordTones.length - 1;
          direction = -1;
        } else if (arpIndex <= 0) {
          arpIndex = 0;
          direction = 1;
        }
      } else if (movement === 'arpeggio-down') {
        arpIndex = (arpIndex - 1 + chordTones.length) % chordTones.length;
      } else {
        // arpeggio-up (default)
        arpIndex = (arpIndex + 1) % chordTones.length;
      }
    }
    
    const scaleIdx = chordTones[arpIndex];
    const note = baseNote + scale[scaleIdx];
    
    // Light accents on beat 1 of each bar
    const accent = active && (i % 4 === 0) && Math.random() < accentAmount;
    // Minimal slides for arp - keeps it crisp
    const slide = active && Math.random() < slideAmount * 0.5;
    
    steps.push({ note, active, accent, slide });
  }
  
  return steps;
}

// Generate all three patterns from multi-module analysis
export function generateMultiModulePatterns(
  analysis: MultiModuleAnalysis
): Record<ModuleId, Step[]> {
  const scale = SCALES[analysis.global.scale] || SCALES.minor;
  const rootNote = analysis.global.rootNote;
  
  return {
    bass: generateBassPattern(
      scale,
      rootNote,
      analysis.bass.octave,
      analysis.bass.rhythmDensity,
      analysis.bass.accentAmount,
      analysis.bass.slideAmount
    ),
    lead: generateLeadPattern(
      scale,
      rootNote,
      analysis.lead.octave,
      analysis.lead.rhythmDensity,
      analysis.lead.accentAmount,
      analysis.lead.slideAmount
    ),
    arp: generateArpPattern(
      scale,
      rootNote,
      analysis.arp.octave,
      analysis.arp.rhythmDensity,
      analysis.arp.accentAmount,
      analysis.arp.slideAmount,
      analysis.arp.movement
    ),
  };
}

// Generate synth params for each module
export function generateMultiModuleParams(
  analysis: MultiModuleAnalysis
): Record<ModuleId, Partial<TB303Params>> {
  const makeParams = (mod: ModuleParams): Partial<TB303Params> => ({
    cutoff: mod.synth.cutoff,
    resonance: mod.synth.resonance,
    envMod: mod.synth.envMod,
    decay: mod.synth.decay,
    accent: mod.synth.accent,
    overdrive: mod.synth.overdrive,
  });
  
  return {
    bass: makeParams(analysis.bass),
    lead: makeParams(analysis.lead),
    arp: makeParams(analysis.arp),
  };
}

// Transpose a pattern by semitones
export function transposePattern(pattern: Step[], semitones: number): Step[] {
  return pattern.map(step => ({
    ...step,
    note: step.note + semitones,
  }));
}

// Available scales for random generation
export const SCALE_NAMES = Object.keys(SCALES) as Array<keyof typeof SCALES>;

// Generate random multi-channel patterns (all in same scale)
export function generateRandomMultiChannel(): {
  patterns: Record<ModuleId, Step[]>;
  params: Record<ModuleId, Partial<TB303Params>>;
  tempo: number;
  scale: string;
  rootNote: number;
} {
  // Pick random scale and root note
  const scale = SCALE_NAMES[Math.floor(Math.random() * SCALE_NAMES.length)];
  const scaleIntervals = SCALES[scale];
  const rootNote = 36 + Math.floor(Math.random() * 12); // C2 to B2
  
  // Pick random tempo (100-150 for acid)
  const tempo = 100 + Math.floor(Math.random() * 50);
  
  // Generate patterns with musical characteristics
  const patterns: Record<ModuleId, Step[]> = {
    bass: generateBassPattern(
      scaleIntervals,
      rootNote,
      1, // Octave 1
      0.25 + Math.random() * 0.2, // density 0.25-0.45
      0.3 + Math.random() * 0.3,  // accent
      0.1 + Math.random() * 0.2   // slide
    ),
    lead: generateLeadPattern(
      scaleIntervals,
      rootNote,
      2, // Octave 2
      0.4 + Math.random() * 0.3, // density 0.4-0.7
      0.3 + Math.random() * 0.3,
      0.2 + Math.random() * 0.4  // more slides for lead
    ),
    arp: generateArpPattern(
      scaleIntervals,
      rootNote,
      3, // Octave 3
      0.6 + Math.random() * 0.35, // density 0.6-0.95
      0.1 + Math.random() * 0.2,
      0.05 + Math.random() * 0.1,
      ['arpeggio-up', 'arpeggio-down', 'arpeggio-updown'][Math.floor(Math.random() * 3)]
    ),
  };
  
  // Generate complementary synth params
  const params: Record<ModuleId, Partial<TB303Params>> = {
    bass: {
      cutoff: 0.2 + Math.random() * 0.2,
      resonance: 0.4 + Math.random() * 0.3,
      envMod: 0.3 + Math.random() * 0.3,
      decay: 0.5 + Math.random() * 0.3,
      accent: 0.4 + Math.random() * 0.3,
      overdrive: 0.3 + Math.random() * 0.3,
    },
    lead: {
      cutoff: 0.5 + Math.random() * 0.3,
      resonance: 0.5 + Math.random() * 0.3,
      envMod: 0.5 + Math.random() * 0.3,
      decay: 0.3 + Math.random() * 0.3,
      accent: 0.3 + Math.random() * 0.3,
      overdrive: 0.1 + Math.random() * 0.2,
    },
    arp: {
      cutoff: 0.6 + Math.random() * 0.3,
      resonance: 0.3 + Math.random() * 0.3,
      envMod: 0.3 + Math.random() * 0.3,
      decay: 0.2 + Math.random() * 0.2,
      accent: 0.2 + Math.random() * 0.2,
      overdrive: 0.0 + Math.random() * 0.15,
    },
  };
  
  return { patterns, params, tempo, scale, rootNote };
}

// Legacy single-pattern generation (for backwards compatibility)
export function generatePatternFromEmotion(analysis: EmotionAnalysis): Step[] {
  const { music } = analysis;
  const scale = SCALES[music.scale] || SCALES.minor;
  
  return generateLeadPattern(
    scale,
    music.baseNote,
    2,
    music.rhythmDensity,
    music.accentAmount,
    music.slideAmount
  );
}

export function generateParamsFromEmotion(analysis: EmotionAnalysis): Partial<TB303Params> {
  const { music } = analysis;
  
  return {
    tempo: music.tempo,
    cutoff: music.synth.cutoff,
    resonance: music.synth.resonance,
    envMod: music.synth.envMod,
    decay: music.synth.decay,
    accent: music.synth.accent,
    overdrive: music.synth.overdrive,
  };
}

// Guided prompts for users
export const GUIDED_PROMPTS = [
  {
    id: 'feeling',
    question: "How are you feeling right now?",
    placeholder: "I'm feeling...",
    icon: '💭',
  },
  {
    id: 'dream',
    question: "Describe a dream you had",
    placeholder: "In my dream...",
    icon: '🌙',
  },
  {
    id: 'memory',
    question: "What's a memory that makes you smile?",
    placeholder: "I remember when...",
    icon: '✨',
  },
  {
    id: 'weather',
    question: "If your mood was weather, what would it be?",
    placeholder: "My mood is like...",
    icon: '🌤️',
  },
  {
    id: 'color',
    question: "What color represents how you feel?",
    placeholder: "I feel like the color...",
    icon: '🎨',
  },
  {
    id: 'wish',
    question: "What's something you're hoping for?",
    placeholder: "I hope that...",
    icon: '🌟',
  },
];
