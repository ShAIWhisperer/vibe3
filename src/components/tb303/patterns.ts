import type { Step } from '@/hooks/use-tb303-engine';

export interface SavedPattern {
  id: string;
  name: string;
  type: 'classic' | 'user';
  style: string;
  tags: string[];
  tempo: number;
  steps: Step[];
}

// Classic TB-303 Acid Patterns - Authentic acid house lines
export const CLASSIC_PATTERNS: SavedPattern[] = [
  {
    id: 'acid-anthem',
    name: 'Acid Anthem',
    type: 'classic',
    style: 'Acid House',
    tags: ['uplifting', 'classic', 'chicago'],
    tempo: 138,
    steps: [
      { note: 36, active: true, accent: true, slide: false },  // C2
      { note: 36, active: true, accent: false, slide: false }, // C2
      { note: 48, active: true, accent: false, slide: true },  // C3
      { note: 43, active: true, accent: true, slide: false },  // G2
      { note: 36, active: true, accent: false, slide: false }, // C2
      { note: 39, active: true, accent: false, slide: true },  // D#2
      { note: 36, active: true, accent: true, slide: false },  // C2
      { note: 48, active: true, accent: false, slide: false }, // C3
      { note: 43, active: true, accent: true, slide: true },   // G2
      { note: 36, active: true, accent: false, slide: false }, // C2
      { note: 39, active: true, accent: false, slide: false }, // D#2
      { note: 41, active: true, accent: true, slide: true },   // F2
      { note: 36, active: true, accent: false, slide: false }, // C2
      { note: 48, active: true, accent: true, slide: false },  // C3
      { note: 43, active: true, accent: false, slide: true },  // G2
      { note: 41, active: true, accent: false, slide: false }, // F2
    ]
  },
  {
    id: 'phuture-style',
    name: 'Phuture Style',
    type: 'classic',
    style: 'Chicago Acid',
    tags: ['hypnotic', 'deep', 'phuture'],
    tempo: 126,
    steps: [
      { note: 36, active: true, accent: true, slide: false },  // C2
      { note: 36, active: false, accent: false, slide: false },
      { note: 36, active: true, accent: false, slide: false }, // C2
      { note: 39, active: true, accent: false, slide: true },  // D#2
      { note: 36, active: true, accent: true, slide: false },  // C2
      { note: 41, active: true, accent: false, slide: true },  // F2
      { note: 43, active: true, accent: false, slide: false }, // G2
      { note: 36, active: true, accent: true, slide: false },  // C2
      { note: 36, active: true, accent: false, slide: false }, // C2
      { note: 48, active: true, accent: true, slide: true },   // C3
      { note: 43, active: true, accent: false, slide: false }, // G2
      { note: 41, active: true, accent: false, slide: true },  // F2
      { note: 36, active: true, accent: true, slide: false },  // C2
      { note: 36, active: false, accent: false, slide: false },
      { note: 39, active: true, accent: false, slide: true },  // D#2
      { note: 36, active: true, accent: false, slide: false }, // C2
    ]
  },
  {
    id: 'hardfloor-acid',
    name: 'Hardfloor Acid',
    type: 'classic',
    style: 'German Acid',
    tags: ['energetic', 'rave', 'hardfloor'],
    tempo: 145,
    steps: [
      { note: 36, active: true, accent: true, slide: false },  // C2
      { note: 48, active: true, accent: false, slide: true },  // C3
      { note: 36, active: true, accent: false, slide: false }, // C2
      { note: 43, active: true, accent: true, slide: false },  // G2
      { note: 48, active: true, accent: false, slide: true },  // C3
      { note: 36, active: true, accent: true, slide: false },  // C2
      { note: 41, active: true, accent: false, slide: true },  // F2
      { note: 43, active: true, accent: false, slide: false }, // G2
      { note: 36, active: true, accent: true, slide: false },  // C2
      { note: 48, active: true, accent: true, slide: true },   // C3
      { note: 51, active: true, accent: false, slide: true },  // D#3
      { note: 48, active: true, accent: false, slide: false }, // C3
      { note: 43, active: true, accent: true, slide: false },  // G2
      { note: 36, active: true, accent: false, slide: true },  // C2
      { note: 41, active: true, accent: false, slide: false }, // F2
      { note: 36, active: true, accent: true, slide: false },  // C2
    ]
  },
  {
    id: 'uk-bleep',
    name: 'UK Bleep',
    type: 'classic',
    style: 'UK Acid',
    tags: ['bleepy', 'uk', 'warehouse'],
    tempo: 133,
    steps: [
      { note: 48, active: true, accent: true, slide: false },  // C3
      { note: 36, active: true, accent: false, slide: true },  // C2
      { note: 51, active: true, accent: false, slide: false }, // D#3
      { note: 48, active: true, accent: true, slide: true },   // C3
      { note: 36, active: true, accent: false, slide: false }, // C2
      { note: 43, active: true, accent: true, slide: false },  // G2
      { note: 48, active: true, accent: false, slide: true },  // C3
      { note: 36, active: false, accent: false, slide: false },
      { note: 48, active: true, accent: true, slide: false },  // C3
      { note: 51, active: true, accent: false, slide: true },  // D#3
      { note: 48, active: true, accent: false, slide: false }, // C3
      { note: 43, active: true, accent: true, slide: true },   // G2
      { note: 36, active: true, accent: false, slide: false }, // C2
      { note: 41, active: true, accent: true, slide: false },  // F2
      { note: 43, active: true, accent: false, slide: true },  // G2
      { note: 36, active: true, accent: false, slide: false }, // C2
    ]
  },
  {
    id: 'squelch-master',
    name: 'Squelch Master',
    type: 'classic',
    style: 'Acid Techno',
    tags: ['squelchy', 'techno', 'driving'],
    tempo: 140,
    steps: [
      { note: 36, active: true, accent: true, slide: false },  // C2
      { note: 36, active: true, accent: false, slide: false }, // C2
      { note: 43, active: true, accent: true, slide: true },   // G2
      { note: 48, active: true, accent: false, slide: true },  // C3
      { note: 36, active: true, accent: true, slide: false },  // C2
      { note: 36, active: true, accent: false, slide: false }, // C2
      { note: 41, active: true, accent: false, slide: true },  // F2
      { note: 43, active: true, accent: true, slide: false },  // G2
      { note: 36, active: true, accent: false, slide: false }, // C2
      { note: 48, active: true, accent: true, slide: true },   // C3
      { note: 51, active: true, accent: false, slide: true },  // D#3
      { note: 48, active: true, accent: true, slide: false },  // C3
      { note: 43, active: true, accent: false, slide: true },  // G2
      { note: 36, active: true, accent: true, slide: false },  // C2
      { note: 41, active: true, accent: false, slide: false }, // F2
      { note: 39, active: true, accent: false, slide: true },  // D#2
    ]
  },
  {
    id: 'peak-time',
    name: 'Peak Time',
    type: 'classic',
    style: 'Rave',
    tags: ['euphoric', 'peak', 'uplifting'],
    tempo: 142,
    steps: [
      { note: 36, active: true, accent: true, slide: false },  // C2
      { note: 43, active: true, accent: false, slide: true },  // G2
      { note: 48, active: true, accent: true, slide: false },  // C3
      { note: 51, active: true, accent: false, slide: true },  // D#3
      { note: 48, active: true, accent: false, slide: false }, // C3
      { note: 43, active: true, accent: true, slide: true },   // G2
      { note: 36, active: true, accent: false, slide: false }, // C2
      { note: 41, active: true, accent: true, slide: false },  // F2
      { note: 43, active: true, accent: false, slide: true },  // G2
      { note: 48, active: true, accent: true, slide: false },  // C3
      { note: 53, active: true, accent: false, slide: true },  // F3
      { note: 51, active: true, accent: true, slide: true },   // D#3
      { note: 48, active: true, accent: false, slide: false }, // C3
      { note: 43, active: true, accent: true, slide: true },   // G2
      { note: 41, active: true, accent: false, slide: false }, // F2
      { note: 36, active: true, accent: false, slide: true },  // C2
    ]
  }
];

export function generatePatternId(): string {
  return `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function createEmptyPattern(): Step[] {
  return Array(16).fill(null).map(() => ({
    note: 36,
    active: false,
    accent: false,
    slide: false
  }));
}