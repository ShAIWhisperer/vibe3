// DRUMCORE - Exact port from Claude's genre-authentic drum machine

export type DrumSoundType = 
  | 'kick' | 'snare' | 'clap' | 'hihatClosed' | 'hihatOpen' 
  | 'cymbal' | 'tom' | 'rimshot' | 'bass808' | 'shaker' | 'perc';

export interface DrumTrack {
  name: string;
  sound: DrumSoundType;
  params: Record<string, number | boolean | string>;
  steps: number[];
}

export interface GenreKit {
  id: string;
  name: string;
  color: string;
  bpm: number;
  swing: number;
  tracks: DrumTrack[];
}

// All 6 genre kits with exact patterns from DRUMCORE
export const GENRE_KITS: GenreKit[] = [
  {
    id: 'house',
    name: 'HOUSE',
    color: '#ff6a00',
    bpm: 128,
    swing: 15,
    tracks: [
      { name: 'KICK', sound: 'kick', params: { pitch: 55, decay: 0.55, click: 0.7 }, steps: [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0] },
      { name: 'KICK 2', sound: 'kick', params: { pitch: 55, decay: 0.4, click: 0.5, vol: 0.7 }, steps: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0] },
      { name: 'SNARE', sound: 'snare', params: { tone: 200, decay: 0.22, noiseDecay: 0.18, noiseAmt: 0.8 }, steps: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0] },
      { name: 'CLAP', sound: 'clap', params: { spread: 3, decay: 0.2 }, steps: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0] },
      { name: 'HH CLSD', sound: 'hihatClosed', params: { decay: 0.045, brightness: 8000 }, steps: [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0] },
      { name: 'HH OPEN', sound: 'hihatOpen', params: { decay: 0.25, brightness: 9000 }, steps: [0,0,0,0, 0,0,1,0, 0,0,0,0, 0,0,1,0] },
      { name: 'SHAKER', sound: 'shaker', params: { vol: 0.6 }, steps: [0,1,0,1, 0,1,0,1, 0,1,0,1, 0,1,0,1] },
      { name: 'PERC', sound: 'perc', params: { pitch: 700, decay: 0.12 }, steps: [0,0,0,0, 0,0,0,1, 0,0,0,0, 0,1,0,0] },
    ]
  },
  {
    id: 'trap',
    name: 'TRAP',
    color: '#a855f7',
    bpm: 140,
    swing: 0,
    tracks: [
      { name: '808 KICK', sound: 'kick', params: { pitch: 50, decay: 0.7, click: 0.9, dist: true }, steps: [1,0,0,0, 0,0,1,0, 0,1,0,0, 0,0,0,0] },
      { name: '808 BASS', sound: 'bass808', params: { pitch: 45, decay: 1.2 }, steps: [1,0,0,0, 0,0,1,0, 0,0,0,0, 0,0,1,0] },
      { name: 'SNARE', sound: 'snare', params: { tone: 180, decay: 0.3, noiseDecay: 0.25, noiseAmt: 0.9 }, steps: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0] },
      { name: 'CLAP', sound: 'clap', params: { spread: 4, decay: 0.3 }, steps: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0] },
      { name: 'HH 1/8', sound: 'hihatClosed', params: { decay: 0.025, brightness: 9000 }, steps: [1,1,1,1, 1,1,1,1, 1,1,1,1, 1,1,1,1] },
      { name: 'HH ROLL', sound: 'hihatClosed', params: { decay: 0.01, brightness: 10000, vol: 0.4 }, steps: [0,0,0,0, 0,0,0,0, 1,1,1,1, 1,1,1,0] },
      { name: 'HH OPEN', sound: 'hihatOpen', params: { decay: 0.18, brightness: 9500 }, steps: [0,0,0,0, 0,1,0,0, 0,0,0,0, 0,0,0,0] },
      { name: 'RIMSHOT', sound: 'rimshot', params: {}, steps: [0,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0] },
    ]
  },
  {
    id: 'dnb',
    name: 'D&B',
    color: '#00ff88',
    bpm: 174,
    swing: 0,
    tracks: [
      { name: 'KICK A', sound: 'kick', params: { pitch: 55, decay: 0.35, click: 0.8 }, steps: [1,0,0,0, 0,0,0,1, 0,0,1,0, 0,0,0,0] },
      { name: 'KICK B', sound: 'kick', params: { pitch: 50, decay: 0.3, click: 0.7, vol: 0.85 }, steps: [0,0,0,0, 1,0,0,0, 0,1,0,0, 0,0,1,0] },
      { name: 'SNARE', sound: 'snare', params: { tone: 250, decay: 0.15, noiseDecay: 0.12, noiseAmt: 0.7 }, steps: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0] },
      { name: 'SNARE 2', sound: 'snare', params: { tone: 300, decay: 0.1, noiseDecay: 0.08, noiseAmt: 0.6, vol: 0.6 }, steps: [0,0,0,0, 0,0,0,0, 0,0,0,1, 0,0,1,0] },
      { name: 'HH CLSD', sound: 'hihatClosed', params: { decay: 0.03, brightness: 9000 }, steps: [1,0,1,1, 0,1,0,0, 1,0,1,1, 0,1,0,0] },
      { name: 'HH OPEN', sound: 'hihatOpen', params: { decay: 0.12, brightness: 9500 }, steps: [0,0,0,0, 0,1,0,0, 0,0,0,0, 0,1,0,0] },
      { name: 'CRASH', sound: 'cymbal', params: { decay: 0.8, type: 'crash', vol: 0.4 }, steps: [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0] },
      { name: 'RIMSHOT', sound: 'rimshot', params: { vol: 0.8 }, steps: [0,0,1,0, 0,0,1,0, 0,0,0,0, 0,1,0,0] },
    ]
  },
  {
    id: 'dance',
    name: 'DANCE',
    color: '#00d4ff',
    bpm: 130,
    swing: 5,
    tracks: [
      { name: 'KICK', sound: 'kick', params: { pitch: 58, decay: 0.5, click: 0.6 }, steps: [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0] },
      { name: 'SNARE', sound: 'snare', params: { tone: 220, decay: 0.2, noiseDecay: 0.16, noiseAmt: 0.75 }, steps: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0] },
      { name: 'CLAP', sound: 'clap', params: { spread: 3, decay: 0.22 }, steps: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0] },
      { name: 'HH CLO', sound: 'hihatClosed', params: { decay: 0.04, brightness: 8500 }, steps: [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0] },
      { name: 'HH OPEN', sound: 'hihatOpen', params: { decay: 0.3, brightness: 9000 }, steps: [0,0,0,0, 0,0,0,1, 0,0,0,0, 0,0,0,1] },
      { name: 'CRASH', sound: 'cymbal', params: { decay: 1.0, type: 'crash', vol: 0.35 }, steps: [1,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0] },
      { name: 'RIDE', sound: 'cymbal', params: { decay: 0.5, type: 'ride', vol: 0.25 }, steps: [0,1,0,1, 0,1,0,1, 0,1,0,1, 0,1,0,1] },
      { name: 'PERC', sound: 'perc', params: { pitch: 600, decay: 0.1, vol: 0.7 }, steps: [0,0,1,0, 0,0,0,0, 0,0,1,0, 0,0,0,1] },
    ]
  },
  {
    id: 'trance',
    name: 'TRANCE',
    color: '#ff00cc',
    bpm: 138,
    swing: 0,
    tracks: [
      { name: 'KICK', sound: 'kick', params: { pitch: 55, decay: 0.45, click: 0.5 }, steps: [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0] },
      { name: 'KICK SB', sound: 'kick', params: { pitch: 52, decay: 0.35, click: 0.4, vol: 0.6 }, steps: [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0] },
      { name: 'CLAP', sound: 'clap', params: { spread: 4, decay: 0.28 }, steps: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0] },
      { name: 'HH CLO', sound: 'hihatClosed', params: { decay: 0.035, brightness: 9500 }, steps: [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0] },
      { name: 'HH OPEN', sound: 'hihatOpen', params: { decay: 0.2, brightness: 10000, vol: 0.6 }, steps: [0,0,0,1, 0,0,0,1, 0,0,0,1, 0,0,0,1] },
      { name: 'CRASH', sound: 'cymbal', params: { decay: 1.8, type: 'crash', vol: 0.3 }, steps: [1,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0] },
      { name: 'RIDE', sound: 'cymbal', params: { decay: 0.6, type: 'ride', vol: 0.2 }, steps: [1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0] },
      { name: 'PERC', sound: 'perc', params: { pitch: 900, decay: 0.08, vol: 0.5 }, steps: [0,0,0,1, 0,0,1,0, 0,0,0,1, 0,1,0,0] },
    ]
  },
  {
    id: 'techno',
    name: 'TECHNO',
    color: '#ff2200',
    bpm: 145,
    swing: 0,
    tracks: [
      { name: 'KICK', sound: 'kick', params: { pitch: 48, decay: 0.6, click: 0.9, dist: true }, steps: [1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0] },
      { name: 'KICK 2', sound: 'kick', params: { pitch: 45, decay: 0.4, click: 0.6, dist: true, vol: 0.5 }, steps: [0,0,0,1, 0,0,1,0, 0,0,0,1, 0,0,1,0] },
      { name: 'CLAP', sound: 'clap', params: { spread: 5, decay: 0.35 }, steps: [0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0] },
      { name: 'HH CLO', sound: 'hihatClosed', params: { decay: 0.025, brightness: 10000 }, steps: [1,1,0,1, 1,1,0,1, 1,1,0,1, 1,1,0,1] },
      { name: 'HH OPEN', sound: 'hihatOpen', params: { decay: 0.15, brightness: 10500, vol: 0.5 }, steps: [0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0] },
      { name: 'CRASH', sound: 'cymbal', params: { decay: 1.0, type: 'crash', vol: 0.25 }, steps: [1,0,0,0, 0,0,0,0, 1,0,0,0, 0,0,0,0] },
      { name: 'TOM', sound: 'tom', params: { pitch: 180, decay: 0.25 }, steps: [0,0,0,0, 0,1,0,0, 0,0,0,0, 0,1,0,1] },
      { name: 'RIMSHOT', sound: 'rimshot', params: { vol: 0.9 }, steps: [0,0,0,0, 0,0,0,1, 0,0,0,0, 0,0,1,0] },
    ]
  }
];

// Legacy exports for backward compatibility
export type DrumSound = 'kick' | 'snare' | 'closedHat' | 'openHat' | 'clap' | 'tom' | 'rim' | 'cowbell' | 'crash' | 'ride' | 'perc1' | 'perc2';

export interface DrumKit {
  id: string;
  name: string;
  genre: string;
  sounds: DrumSound[];
  labels: string[];
}

export const DRUM_KITS: DrumKit[] = GENRE_KITS.map(kit => ({
  id: kit.id,
  name: kit.name,
  genre: kit.name,
  sounds: kit.tracks.map(() => 'kick' as DrumSound), // Placeholder
  labels: kit.tracks.map(t => t.name)
}));

// ==========================================
// EXACT DRUMCORE SYNTHESIS ENGINE
// ==========================================

export function createDrumSynth(ctx: AudioContext) {
  // Master output (will be connected externally)
  
  // --- KICK ---
  function kick(t: number, output: AudioNode, vol = 1, pitch = 55, decay = 0.5, click = 0.5, dist = false) {
    const g = ctx.createGain();
    const osc = ctx.createOscillator();
    const clickG = ctx.createGain();
    
    osc.type = 'sine';
    osc.frequency.setValueAtTime(pitch * 3, t);
    osc.frequency.exponentialRampToValueAtTime(pitch, t + 0.03);
    osc.frequency.exponentialRampToValueAtTime(30, t + decay);
    
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + decay + 0.05);
    
    // Click transient
    const clickOsc = ctx.createOscillator();
    clickOsc.type = 'square';
    clickOsc.frequency.setValueAtTime(200, t);
    clickG.gain.setValueAtTime(click * vol * 0.4, t);
    clickG.gain.exponentialRampToValueAtTime(0.001, t + 0.025);
    
    if (dist) {
      const wv = ctx.createWaveShaper();
      const curve = new Float32Array(256);
      for (let i = 0; i < 256; i++) {
        const x = (i * 2 / 256 - 1);
        curve[i] = (3 + 20) * x * 20 * Math.PI / 180 / (Math.PI + 20 * Math.abs(x));
      }
      wv.curve = curve;
      osc.connect(g);
      g.connect(wv);
      wv.connect(output);
    } else {
      osc.connect(g);
      g.connect(output);
    }
    
    clickOsc.connect(clickG);
    clickG.connect(output);
    osc.start(t);
    osc.stop(t + decay + 0.1);
    clickOsc.start(t);
    clickOsc.stop(t + 0.03);
  }

  // --- SNARE ---
  function snare(t: number, output: AudioNode, vol = 1, tone = 200, decay = 0.2, noiseDecay = 0.15, noiseAmt = 0.7, doPitch = true) {
    // Tone part
    const osc = ctx.createOscillator();
    const toneG = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(tone, t);
    if (doPitch) osc.frequency.exponentialRampToValueAtTime(tone * 0.5, t + decay);
    toneG.gain.setValueAtTime(vol * 0.6, t);
    toneG.gain.exponentialRampToValueAtTime(0.001, t + decay);
    osc.connect(toneG);
    toneG.connect(output);
    osc.start(t);
    osc.stop(t + decay + 0.05);

    // Noise part
    const bufLen = Math.floor(ctx.sampleRate * (noiseDecay + 0.1));
    const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) d[i] = Math.random() * 2 - 1;
    const ns = ctx.createBufferSource();
    ns.buffer = buf;
    const nsG = ctx.createGain();
    const bpf = ctx.createBiquadFilter();
    bpf.type = 'bandpass';
    bpf.frequency.value = 3500;
    bpf.Q.value = 0.8;
    nsG.gain.setValueAtTime(vol * noiseAmt, t);
    nsG.gain.exponentialRampToValueAtTime(0.001, t + noiseDecay);
    ns.connect(bpf);
    bpf.connect(nsG);
    nsG.connect(output);
    ns.start(t);
    ns.stop(t + noiseDecay + 0.05);
  }

  // --- CLAP ---
  function clap(t: number, output: AudioNode, vol = 1, spread = 3, decay = 0.25) {
    for (let i = 0; i < spread; i++) {
      const offset = i * 0.011;
      const bufLen = Math.floor(ctx.sampleRate * (decay + 0.1));
      const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let j = 0; j < bufLen; j++) d[j] = Math.random() * 2 - 1;
      const ns = ctx.createBufferSource();
      ns.buffer = buf;
      const nsG = ctx.createGain();
      const hpf = ctx.createBiquadFilter();
      hpf.type = 'highpass';
      hpf.frequency.value = 1200;
      nsG.gain.setValueAtTime(vol * 0.5 / spread, t + offset);
      nsG.gain.exponentialRampToValueAtTime(0.001, t + offset + decay);
      ns.connect(hpf);
      hpf.connect(nsG);
      nsG.connect(output);
      ns.start(t + offset);
      ns.stop(t + offset + decay + 0.05);
    }
  }

  // --- HI-HAT CLOSED ---
  function hihatClosed(t: number, output: AudioNode, vol = 1, decay = 0.04, brightness = 8000) {
    const bufLen = Math.floor(ctx.sampleRate * (decay + 0.05));
    const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) d[i] = Math.random() * 2 - 1;
    const ns = ctx.createBufferSource();
    ns.buffer = buf;
    const hpf = ctx.createBiquadFilter();
    hpf.type = 'highpass';
    hpf.frequency.value = brightness;
    const bpf = ctx.createBiquadFilter();
    bpf.type = 'bandpass';
    bpf.frequency.value = 10000;
    bpf.Q.value = 0.5;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol * 0.5, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + decay);
    ns.connect(hpf);
    hpf.connect(bpf);
    bpf.connect(g);
    g.connect(output);
    ns.start(t);
    ns.stop(t + decay + 0.05);
  }

  // --- HI-HAT OPEN ---
  function hihatOpen(t: number, output: AudioNode, vol = 1, decay = 0.4, brightness = 8000) {
    const bufLen = Math.floor(ctx.sampleRate * (decay + 0.1));
    const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) d[i] = Math.random() * 2 - 1;
    const ns = ctx.createBufferSource();
    ns.buffer = buf;
    const hpf = ctx.createBiquadFilter();
    hpf.type = 'highpass';
    hpf.frequency.value = brightness;
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol * 0.4, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + decay);
    ns.connect(hpf);
    hpf.connect(g);
    g.connect(output);
    ns.start(t);
    ns.stop(t + decay + 0.1);
  }

  // --- CYMBAL (crash/ride) ---
  function cymbal(t: number, output: AudioNode, vol = 1, decay = 1.5, type: 'crash' | 'ride' = 'crash') {
    const freqs = [205, 287, 355, 460, 580, 850];
    freqs.forEach((f, i) => {
      const osc = ctx.createOscillator();
      osc.type = 'square';
      osc.frequency.value = f * (type === 'ride' ? 1 : 1.2);
      const g = ctx.createGain();
      const hpf = ctx.createBiquadFilter();
      hpf.type = 'highpass';
      hpf.frequency.value = 6000;
      g.gain.setValueAtTime(vol * 0.06 / (i + 1), t);
      g.gain.exponentialRampToValueAtTime(0.001, t + decay * (0.5 + i * 0.1));
      osc.connect(hpf);
      hpf.connect(g);
      g.connect(output);
      osc.start(t);
      osc.stop(t + decay + 0.1);
    });
  }

  // --- TOM ---
  function tom(t: number, output: AudioNode, vol = 1, pitch = 120, decay = 0.3) {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(pitch * 2, t);
    osc.frequency.exponentialRampToValueAtTime(pitch, t + 0.05);
    osc.frequency.exponentialRampToValueAtTime(pitch * 0.5, t + decay);
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol * 0.8, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + decay + 0.05);
    osc.connect(g);
    g.connect(output);
    osc.start(t);
    osc.stop(t + decay + 0.1);
  }

  // --- RIMSHOT ---
  function rimshot(t: number, output: AudioNode, vol = 1) {
    const osc = ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1200, t);
    osc.frequency.exponentialRampToValueAtTime(400, t + 0.02);
    const g = ctx.createGain();
    g.gain.setValueAtTime(vol * 0.7, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + 0.06);
    osc.connect(g);
    g.connect(output);
    osc.start(t);
    osc.stop(t + 0.08);

    // Noise click
    const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.01), ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    const ns = ctx.createBufferSource();
    ns.buffer = buf;
    const g2 = ctx.createGain();
    g2.gain.value = vol * 0.5;
    ns.connect(g2);
    g2.connect(output);
    ns.start(t);
  }

  // --- 808 BASS ---
  function bass808(t: number, output: AudioNode, vol = 1, pitch = 50, decay = 0.8) {
    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(pitch * 4, t);
    osc.frequency.exponentialRampToValueAtTime(pitch, t + 0.06);
    const osc2 = ctx.createOscillator();
    osc2.type = 'square';
    osc2.frequency.value = pitch;
    const g = ctx.createGain();
    const g2 = ctx.createGain();
    g2.gain.value = 0.05;
    const lpf = ctx.createBiquadFilter();
    lpf.type = 'lowpass';
    lpf.frequency.value = 200;
    g.gain.setValueAtTime(vol, t);
    g.gain.setValueAtTime(vol, t + 0.05);
    g.gain.exponentialRampToValueAtTime(0.001, t + decay);
    osc.connect(g);
    osc2.connect(lpf);
    lpf.connect(g2);
    g2.connect(output);
    g.connect(output);
    osc.start(t);
    osc.stop(t + decay + 0.1);
    osc2.start(t);
    osc2.stop(t + decay + 0.1);
  }

  // --- SHAKER ---
  function shaker(t: number, output: AudioNode, vol = 1, decay = 0.06) {
    const bufLen = Math.floor(ctx.sampleRate * decay);
    const buf = ctx.createBuffer(1, bufLen, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < bufLen; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufLen, 3);
    const ns = ctx.createBufferSource();
    ns.buffer = buf;
    const hpf = ctx.createBiquadFilter();
    hpf.type = 'highpass';
    hpf.frequency.value = 5000;
    const bpf = ctx.createBiquadFilter();
    bpf.type = 'bandpass';
    bpf.frequency.value = 8000;
    bpf.Q.value = 1;
    const g = ctx.createGain();
    g.gain.value = vol * 0.4;
    ns.connect(hpf);
    hpf.connect(bpf);
    bpf.connect(g);
    g.connect(output);
    ns.start(t);
  }

  // --- PERC (cowbell-ish) ---
  function perc(t: number, output: AudioNode, vol = 1, pitch = 800, decay = 0.15) {
    const osc1 = ctx.createOscillator();
    osc1.type = 'square';
    osc1.frequency.value = pitch;
    const osc2 = ctx.createOscillator();
    osc2.type = 'square';
    osc2.frequency.value = pitch * 1.47;
    const g = ctx.createGain();
    const hpf = ctx.createBiquadFilter();
    hpf.type = 'highpass';
    hpf.frequency.value = 500;
    g.gain.setValueAtTime(vol * 0.3, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + decay);
    osc1.connect(g);
    osc2.connect(g);
    g.connect(hpf);
    hpf.connect(output);
    osc1.start(t);
    osc1.stop(t + decay + 0.05);
    osc2.start(t);
    osc2.stop(t + decay + 0.05);
  }

  // Play a track sound with its params
  function playTrack(track: DrumTrack, t: number, output: AudioNode, velocity = 1) {
    const p = track.params;
    const vol = velocity * (p.vol as number || 1);
    
    switch (track.sound) {
      case 'kick':
        kick(t, output, vol, p.pitch as number || 55, p.decay as number || 0.5, p.click as number || 0.5, p.dist as boolean || false);
        break;
      case 'snare':
        snare(t, output, vol, p.tone as number || 200, p.decay as number || 0.2, p.noiseDecay as number || 0.15, p.noiseAmt as number || 0.7);
        break;
      case 'clap':
        clap(t, output, vol, p.spread as number || 3, p.decay as number || 0.25);
        break;
      case 'hihatClosed':
        hihatClosed(t, output, vol, p.decay as number || 0.04, p.brightness as number || 8000);
        break;
      case 'hihatOpen':
        hihatOpen(t, output, vol, p.decay as number || 0.4, p.brightness as number || 8000);
        break;
      case 'cymbal':
        cymbal(t, output, vol, p.decay as number || 1.5, (p.type as 'crash' | 'ride') || 'crash');
        break;
      case 'tom':
        tom(t, output, vol, p.pitch as number || 120, p.decay as number || 0.3);
        break;
      case 'rimshot':
        rimshot(t, output, vol);
        break;
      case 'bass808':
        bass808(t, output, vol, p.pitch as number || 50, p.decay as number || 0.8);
        break;
      case 'shaker':
        shaker(t, output, vol, p.decay as number || 0.06);
        break;
      case 'perc':
        perc(t, output, vol, p.pitch as number || 800, p.decay as number || 0.15);
        break;
    }
  }

  // Legacy play function for backward compat
  function play(sound: DrumSound, time: number, output: AudioNode, velocity = 1, kitId = 'house') {
    switch (sound) {
      case 'kick': kick(time, output, velocity); break;
      case 'snare': snare(time, output, velocity); break;
      case 'closedHat': hihatClosed(time, output, velocity); break;
      case 'openHat': hihatOpen(time, output, velocity); break;
      case 'clap': clap(time, output, velocity); break;
      case 'tom': tom(time, output, velocity); break;
      case 'rim': rimshot(time, output, velocity); break;
      case 'cowbell': perc(time, output, velocity, 560, 0.2); break;
      case 'crash': cymbal(time, output, velocity, 1.5, 'crash'); break;
      case 'ride': cymbal(time, output, velocity, 0.6, 'ride'); break;
      case 'perc1': perc(time, output, velocity); break;
      case 'perc2': shaker(time, output, velocity); break;
    }
  }

  return { play, playTrack, kick, snare, clap, hihatClosed, hihatOpen, cymbal, tom, rimshot, bass808, shaker, perc };
}
