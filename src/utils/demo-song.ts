// Demo Song - A complete multi-module composition for startup
import type { Step } from '@/hooks/use-tb303-engine';
import type { ModuleId } from '@/hooks/use-multi-synth-engine';
import type { DrumStep } from '@/hooks/use-drum-engine';

export interface DemoSong {
  name: string;
  tempo: number;
  patterns: Record<ModuleId, Step[]>;
  params: Record<ModuleId, {
    cutoff: number;
    resonance: number;
    envMod: number;
    decay: number;
    accent: number;
    waveform: 'saw' | 'pulse';
  }>;
  mixer: Record<ModuleId | 'master', { volume: number; pan: number; mute: boolean }>;
  drumPattern: DrumStep[];
  drumKitId: string;
  drumSwing: number;
}

// Create an empty step
const off = (): Step => ({ note: 36, active: false, accent: false, slide: false });

// Create an active step
const n = (note: number, accent = false, slide = false): Step => ({
  note,
  active: true,
  accent,
  slide
});

// Demo song: "Acid Dreams" - A complete house track
export const DEMO_SONG: DemoSong = {
  name: 'Acid Dreams',
  tempo: 128,
  
  patterns: {
    // Bass - Deep rolling bassline (C minor)
    bass: [
      n(36, true),   // C2 accent
      off(),
      n(36),         // C2
      off(),
      n(36),         // C2
      n(39, false, true), // Eb2 slide
      n(36),         // C2
      off(),
      n(36, true),   // C2 accent
      off(),
      n(43),         // G2
      n(41, false, true), // F2 slide
      n(36),         // C2
      off(),
      n(39),         // Eb2
      n(36, false, true), // C2 slide
    ],
    
    // Lead - Melodic acid line (higher register)
    lead: [
      n(60, true),   // C4 accent
      n(63, false, true), // Eb4 slide
      n(60),         // C4
      off(),
      n(67, true),   // G4 accent
      n(65, false, true), // F4 slide
      n(63),         // Eb4
      n(60),         // C4
      n(58, true),   // Bb3 accent
      off(),
      n(60),         // C4
      n(63, false, true), // Eb4 slide
      n(67, true),   // G4 accent
      n(72, false, true), // C5 slide
      n(67),         // G4
      n(63),         // Eb4
    ],
    
    // Arp - Rhythmic arpeggiated pattern
    arp: [
      n(72, true),   // C5 accent
      n(75),         // Eb5
      n(79),         // G5
      n(75),         // Eb5
      n(72, true),   // C5 accent
      n(75),         // Eb5
      n(79),         // G5
      n(84, false, true), // C6 slide
      n(79, true),   // G5 accent
      n(75),         // Eb5
      n(72),         // C5
      n(75),         // Eb5
      n(72, true),   // C5 accent
      off(),
      n(79),         // G5
      n(75, false, true), // Eb5 slide
    ],
  },
  
  params: {
    bass: {
      cutoff: 0.35,
      resonance: 0.6,
      envMod: 0.5,
      decay: 0.6,
      accent: 0.7,
      waveform: 'saw'
    },
    lead: {
      cutoff: 0.5,
      resonance: 0.7,
      envMod: 0.65,
      decay: 0.45,
      accent: 0.6,
      waveform: 'saw'
    },
    arp: {
      cutoff: 0.65,
      resonance: 0.5,
      envMod: 0.4,
      decay: 0.3,
      accent: 0.5,
      waveform: 'pulse'
    }
  },
  
  mixer: {
    bass: { volume: 0.8, pan: 0, mute: false },
    lead: { volume: 0.6, pan: -0.2, mute: false },
    arp: { volume: 0.45, pan: 0.3, mute: false },
    master: { volume: 0.75, pan: 0, mute: false }
  },
  
  // House drum pattern - 4-on-floor with off-beat hats
  // Track indices: 0=KICK, 1=KICK2, 2=SNARE, 3=CLAP, 4=HH_CLOSED, 5=HH_OPEN, 6=SHAKER, 7=PERC
  drumPattern: [
    // Step 0: Kick (downbeat)
    { sounds: { 0: { active: true, velocity: 1 }, 4: { active: true, velocity: 0.7 } } },
    // Step 1: Shaker
    { sounds: { 6: { active: true, velocity: 0.5 } } },
    // Step 2: Closed hat
    { sounds: { 4: { active: true, velocity: 0.6 } } },
    // Step 3: Shaker
    { sounds: { 6: { active: true, velocity: 0.5 } } },
    // Step 4: Kick2 + Snare + Clap (backbeat)
    { sounds: { 1: { active: true, velocity: 0.85 }, 2: { active: true, velocity: 0.9 }, 3: { active: true, velocity: 0.85 }, 4: { active: true, velocity: 0.7 } } },
    // Step 5: Shaker
    { sounds: { 6: { active: true, velocity: 0.5 } } },
    // Step 6: Closed hat + Open hat
    { sounds: { 4: { active: true, velocity: 0.5 }, 5: { active: true, velocity: 0.65 } } },
    // Step 7: Shaker + Perc
    { sounds: { 6: { active: true, velocity: 0.5 }, 7: { active: true, velocity: 0.45 } } },
    // Step 8: Kick (downbeat)
    { sounds: { 0: { active: true, velocity: 1 }, 4: { active: true, velocity: 0.7 } } },
    // Step 9: Shaker
    { sounds: { 6: { active: true, velocity: 0.5 } } },
    // Step 10: Closed hat
    { sounds: { 4: { active: true, velocity: 0.6 } } },
    // Step 11: Shaker
    { sounds: { 6: { active: true, velocity: 0.5 } } },
    // Step 12: Kick2 + Snare + Clap (backbeat)
    { sounds: { 1: { active: true, velocity: 0.85 }, 2: { active: true, velocity: 0.9 }, 3: { active: true, velocity: 0.85 }, 4: { active: true, velocity: 0.7 } } },
    // Step 13: Shaker + Perc
    { sounds: { 6: { active: true, velocity: 0.5 }, 7: { active: true, velocity: 0.55 } } },
    // Step 14: Closed hat + Open hat
    { sounds: { 4: { active: true, velocity: 0.5 }, 5: { active: true, velocity: 0.7 } } },
    // Step 15: Shaker
    { sounds: { 6: { active: true, velocity: 0.5 } } },
  ],
  
  drumKitId: 'house',
  drumSwing: 15
};

// Alternative demo: Minimal Techno
export const TECHNO_DEMO: DemoSong = {
  name: 'Dark Machine',
  tempo: 138,
  
  patterns: {
    bass: [
      n(36, true),   // C2 accent
      off(),
      off(),
      n(36),         // C2
      n(36, true),   // C2 accent
      off(),
      n(36),         // C2
      n(39, false, true), // Eb2 slide
      n(36, true),   // C2 accent
      off(),
      off(),
      n(41),         // F2
      n(36, true),   // C2 accent
      n(36),         // C2
      n(34, false, true), // Bb1 slide
      n(36),         // C2
    ],
    
    lead: [
      n(48, true),   // C3
      off(),
      n(51, false, true), // Eb3 slide
      off(),
      n(48),         // C3
      off(),
      n(55, true),   // G3 accent
      n(53, false, true), // F3 slide
      n(48, true),   // C3
      off(),
      n(51),         // Eb3
      off(),
      n(55, true),   // G3 accent
      n(60, false, true), // C4 slide
      n(55),         // G3
      off(),
    ],
    
    arp: [
      n(72),         // C5
      off(),
      n(72),         // C5
      n(75),         // Eb5
      n(72),         // C5
      off(),
      n(79, true),   // G5 accent
      off(),
      n(72),         // C5
      n(75),         // Eb5
      n(72),         // C5
      off(),
      n(84, true, true), // C6 accent slide
      n(79),         // G5
      n(75),         // Eb5
      off(),
    ],
  },
  
  params: {
    bass: {
      cutoff: 0.25,
      resonance: 0.7,
      envMod: 0.6,
      decay: 0.7,
      accent: 0.8,
      waveform: 'saw'
    },
    lead: {
      cutoff: 0.4,
      resonance: 0.75,
      envMod: 0.7,
      decay: 0.5,
      accent: 0.7,
      waveform: 'pulse'
    },
    arp: {
      cutoff: 0.55,
      resonance: 0.6,
      envMod: 0.5,
      decay: 0.25,
      accent: 0.5,
      waveform: 'pulse'
    }
  },
  
  mixer: {
    bass: { volume: 0.85, pan: 0, mute: false },
    lead: { volume: 0.55, pan: 0.15, mute: false },
    arp: { volume: 0.4, pan: -0.2, mute: false },
    master: { volume: 0.75, pan: 0, mute: false }
  },
  
  // Techno drum pattern - 4-on-floor with syncopation
  // Techno track indices: 0=KICK, 1=KICK2, 2=CLAP, 3=HH_CLOSED, 4=HH_OPEN, 5=CRASH, 6=TOM, 7=RIMSHOT
  drumPattern: [
    // Step 0: Kick + closed hat
    { sounds: { 0: { active: true, velocity: 1 }, 3: { active: true, velocity: 0.6 } } },
    // Step 1: Closed hat
    { sounds: { 3: { active: true, velocity: 0.5 } } },
    // Step 2: Closed hat + open hat
    { sounds: { 3: { active: true, velocity: 0.4 }, 4: { active: true, velocity: 0.5 } } },
    // Step 3: Closed hat + kick2
    { sounds: { 3: { active: true, velocity: 0.6 }, 1: { active: true, velocity: 0.5 } } },
    // Step 4: Kick + Clap + closed hat
    { sounds: { 0: { active: true, velocity: 1 }, 2: { active: true, velocity: 0.9 }, 3: { active: true, velocity: 0.7 } } },
    // Step 5: Closed hat
    { sounds: { 3: { active: true, velocity: 0.5 } } },
    // Step 6: Closed hat + open hat
    { sounds: { 3: { active: true, velocity: 0.4 }, 4: { active: true, velocity: 0.6 } } },
    // Step 7: Closed hat + rimshot
    { sounds: { 3: { active: true, velocity: 0.6 }, 7: { active: true, velocity: 0.5 } } },
    // Step 8: Kick + closed hat
    { sounds: { 0: { active: true, velocity: 1 }, 3: { active: true, velocity: 0.6 } } },
    // Step 9: Closed hat
    { sounds: { 3: { active: true, velocity: 0.5 } } },
    // Step 10: Closed hat + open hat
    { sounds: { 3: { active: true, velocity: 0.4 }, 4: { active: true, velocity: 0.5 } } },
    // Step 11: Closed hat
    { sounds: { 3: { active: true, velocity: 0.6 } } },
    // Step 12: Kick + Clap + closed hat
    { sounds: { 0: { active: true, velocity: 1 }, 2: { active: true, velocity: 0.9 }, 3: { active: true, velocity: 0.7 } } },
    // Step 13: Closed hat + tom
    { sounds: { 3: { active: true, velocity: 0.5 }, 6: { active: true, velocity: 0.6 } } },
    // Step 14: Closed hat + open hat
    { sounds: { 3: { active: true, velocity: 0.4 }, 4: { active: true, velocity: 0.7 } } },
    // Step 15: Closed hat + rimshot
    { sounds: { 3: { active: true, velocity: 0.6 }, 7: { active: true, velocity: 0.4 } } },
  ],
  
  drumKitId: 'techno',
  drumSwing: 0
};

// All available demo songs
export const DEMO_SONGS = [DEMO_SONG, TECHNO_DEMO];
