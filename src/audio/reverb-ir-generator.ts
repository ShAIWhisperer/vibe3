// ============================================================
// Synthetic Impulse Response Generator for ConvolverNode Reverb
// ============================================================

let cachedIR: AudioBuffer | null = null;
let cachedParams = { roomSize: -1, damping: -1 };
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Generates a synthetic impulse response buffer.
 * roomSize: 0-1 → controls IR duration (0.5s - 5s)
 * damping: 0-1 → lowpass filter on IR (1 = very dark, 0 = bright)
 */
export function generateReverbIR(
  ctx: AudioContext,
  roomSize: number,
  damping: number
): AudioBuffer {
  // Return cached if params haven't changed
  if (
    cachedIR &&
    cachedParams.roomSize === roomSize &&
    cachedParams.damping === damping &&
    cachedIR.sampleRate === ctx.sampleRate
  ) {
    return cachedIR;
  }

  const sampleRate = ctx.sampleRate;
  const duration = 0.5 + roomSize * 4.5; // 0.5s to 5s
  const length = Math.floor(sampleRate * duration);
  const buffer = ctx.createBuffer(2, length, sampleRate);

  for (let ch = 0; ch < 2; ch++) {
    const data = buffer.getChannelData(ch);

    // Generate exponentially decaying white noise
    const decayRate = -6.9 / duration; // ln(0.001) / duration for ~60dB decay
    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(decayRate * t);
      data[i] = (Math.random() * 2 - 1) * envelope;
    }

    // Apply simple 1-pole lowpass filter for damping
    if (damping > 0) {
      const coefficient = 0.05 + (1 - damping) * 0.95; // Higher damping = more filtering
      let prev = 0;
      for (let i = 0; i < length; i++) {
        data[i] = prev + coefficient * (data[i] - prev);
        prev = data[i];
      }
    }
  }

  cachedIR = buffer;
  cachedParams = { roomSize, damping };
  return buffer;
}

/**
 * Debounced version — regenerates after 200ms of inactivity.
 * Returns current cached IR immediately, schedules regeneration.
 */
export function generateReverbIRDebounced(
  ctx: AudioContext,
  roomSize: number,
  damping: number,
  onGenerated: (buffer: AudioBuffer) => void
): AudioBuffer | null {
  if (debounceTimer) clearTimeout(debounceTimer);

  debounceTimer = setTimeout(() => {
    const buffer = generateReverbIR(ctx, roomSize, damping);
    onGenerated(buffer);
  }, 200);

  return cachedIR;
}
