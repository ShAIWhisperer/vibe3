// DRUMCORE patterns - ported exactly from Claude's drum machine
import { type DrumStep } from '@/hooks/use-drum-engine';
import { GENRE_KITS, type GenreKit } from './drum-samples';

export interface DrumPattern {
  id: string;
  name: string;
  kitId: string;
  genre: string;
  pattern: DrumStep[];
}

// Convert genre kit tracks to DrumStep format
function convertKitToPattern(kit: GenreKit): DrumStep[] {
  const pattern: DrumStep[] = Array(16).fill(null).map(() => ({ sounds: {} }));
  
  kit.tracks.forEach((track, trackIndex) => {
    track.steps.forEach((active, stepIndex) => {
      if (active) {
        pattern[stepIndex].sounds[trackIndex] = { active: true, velocity: 0.8 };
      }
    });
  });
  
  return pattern;
}

// Generate patterns from all genre kits
export const DRUM_PATTERNS: DrumPattern[] = GENRE_KITS.map(kit => ({
  id: kit.id,
  name: kit.name,
  kitId: kit.id,
  genre: kit.name,
  pattern: convertKitToPattern(kit)
}));

// Get pattern for a specific kit
export function getPatternForKit(kitId: string): DrumStep[] {
  const kit = GENRE_KITS.find(k => k.id === kitId);
  if (kit) {
    return convertKitToPattern(kit);
  }
  return DRUM_PATTERNS[0].pattern;
}

// Random pattern generator that respects genre conventions
export function getRandomDrumPattern(kitId: string): DrumStep[] {
  const kit = GENRE_KITS.find(k => k.id === kitId) || GENRE_KITS[0];
  const pattern: DrumStep[] = Array(16).fill(null).map(() => ({ sounds: {} }));
  
  kit.tracks.forEach((track, trackIndex) => {
    for (let step = 0; step < 16; step++) {
      // Different probabilities based on track type
      let probability = 0.3;
      
      const name = track.name.toLowerCase();
      if (name.includes('kick')) {
        // Kick more likely on beats
        probability = step % 4 === 0 ? 0.9 : (step % 2 === 0 ? 0.2 : 0.05);
      } else if (name.includes('snare') || name.includes('clap')) {
        // Snare/clap on 2 and 4
        probability = step === 4 || step === 12 ? 0.95 : 0.1;
      } else if (name.includes('hh') || name.includes('hat')) {
        // Hi-hats denser
        probability = 0.5;
      } else if (name.includes('open')) {
        probability = 0.15;
      } else if (name.includes('perc') || name.includes('shaker')) {
        probability = 0.3;
      }
      
      if (Math.random() < probability) {
        pattern[step].sounds[trackIndex] = { active: true, velocity: 0.7 + Math.random() * 0.3 };
      }
    }
  });
  
  return pattern;
}

// Get suggested BPM for a kit
export function getSuggestedBpm(kitId: string): number {
  const kit = GENRE_KITS.find(k => k.id === kitId);
  return kit?.bpm || 128;
}

// Get suggested swing for a kit
export function getSuggestedSwing(kitId: string): number {
  const kit = GENRE_KITS.find(k => k.id === kitId);
  return kit?.swing || 0;
}
