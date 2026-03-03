// ============================================================
// Pro Mixer Engine — Full Web Audio Graph
// ============================================================

import {
  type ProMixerChannelId,
  type ChannelStripState,
  type AuxReturnState,
  type MasterBusState,
  type AuxEffectId,
  AUX_EFFECT_IDS,
  ALL_CHANNEL_IDS,
} from './pro-mixer-types';
import { generateReverbIR, generateReverbIRDebounced } from './reverb-ir-generator';

// --- Per-channel audio node bundle ---
interface ChannelNodes {
  input: GainNode;
  eqLow: BiquadFilterNode;
  eqMid: BiquadFilterNode;
  eqHigh: BiquadFilterNode;
  compressor: DynamicsCompressorNode;
  compMakeup: GainNode;
  auxSendTap: GainNode; // post-compressor tap point
  auxSends: Record<AuxEffectId, GainNode>;
  volume: GainNode;
  pan: StereoPannerNode;
  analyser: AnalyserNode;
}

// --- AUX bus nodes ---
interface DelayBusNodes {
  inputSum: GainNode;
  delay: DelayNode;
  feedback: GainNode;
  filter: BiquadFilterNode;
  wet: GainNode;
  dry: GainNode;
  output: GainNode;
  returnGain: GainNode;
}

interface ChorusBusNodes {
  inputSum: GainNode;
  delayL: DelayNode;
  delayR: DelayNode;
  lfo: OscillatorNode;
  lfoGainL: GainNode;
  lfoGainR: GainNode;
  wet: GainNode;
  dry: GainNode;
  output: GainNode;
  returnGain: GainNode;
  merger: ChannelMergerNode;
  splitter: ChannelSplitterNode;
}

interface ReverbBusNodes {
  inputSum: GainNode;
  preDelay: DelayNode;
  convolver: ConvolverNode;
  wet: GainNode;
  dry: GainNode;
  output: GainNode;
  returnGain: GainNode;
}

interface FlangerBusNodes {
  inputSum: GainNode;
  delay: DelayNode;
  lfo: OscillatorNode;
  lfoGain: GainNode;
  feedback: GainNode;
  wet: GainNode;
  dry: GainNode;
  output: GainNode;
  returnGain: GainNode;
}

// --- Master bus nodes ---
interface MasterNodes {
  inputSum: GainNode;
  eqLow: BiquadFilterNode;
  eqMid: BiquadFilterNode;
  eqHigh: BiquadFilterNode;
  compressor: DynamicsCompressorNode;
  compMakeup: GainNode;
  limiter: DynamicsCompressorNode;
  volume: GainNode;
  analyserL: AnalyserNode;
  analyserR: AnalyserNode;
  splitter: ChannelSplitterNode;
  merger: ChannelMergerNode;
}

export class ProMixerEngine {
  private ctx: AudioContext;
  private channels: Map<ProMixerChannelId, ChannelNodes> = new Map();
  private delayBus!: DelayBusNodes;
  private chorusBus!: ChorusBusNodes;
  private reverbBus!: ReverbBusNodes;
  private flangerBus!: FlangerBusNodes;
  private master!: MasterNodes;
  private disposed = false;

  constructor(ctx: AudioContext) {
    this.ctx = ctx;
    this.buildMasterBus();
    this.buildAuxBuses();
    this.buildChannels();
  }

  // ============================================================
  // Build audio graph
  // ============================================================

  private buildChannels(): void {
    for (const id of ALL_CHANNEL_IDS) {
      const ch = this.createChannel(id);
      this.channels.set(id, ch);
    }
  }

  private createChannel(id: ProMixerChannelId): ChannelNodes {
    const ctx = this.ctx;

    const input = ctx.createGain();
    input.gain.value = 1;

    // 3-band EQ
    const eqLow = ctx.createBiquadFilter();
    eqLow.type = 'lowshelf';
    eqLow.frequency.value = 100;
    eqLow.gain.value = 0;

    const eqMid = ctx.createBiquadFilter();
    eqMid.type = 'peaking';
    eqMid.frequency.value = 1000;
    eqMid.Q.value = 1;
    eqMid.gain.value = 0;

    const eqHigh = ctx.createBiquadFilter();
    eqHigh.type = 'highshelf';
    eqHigh.frequency.value = 8000;
    eqHigh.gain.value = 0;

    // Compressor
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -24;
    compressor.ratio.value = 4;
    compressor.attack.value = 0.003;
    compressor.release.value = 0.25;
    compressor.knee.value = 6;

    const compMakeup = ctx.createGain();
    compMakeup.gain.value = 1;

    // AUX send tap (post-compressor)
    const auxSendTap = ctx.createGain();
    auxSendTap.gain.value = 1;

    // AUX sends
    const auxSends: Record<AuxEffectId, GainNode> = {} as Record<AuxEffectId, GainNode>;
    for (const effectId of AUX_EFFECT_IDS) {
      const sendGain = ctx.createGain();
      sendGain.gain.value = 0;
      auxSends[effectId] = sendGain;
    }

    // Volume (fader)
    const volume = ctx.createGain();
    volume.gain.value = 0.8;

    // Pan
    const pan = ctx.createStereoPanner();
    pan.pan.value = 0;

    // Analyser for metering
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.8;

    // --- Wire the chain ---
    // input → eqLow → eqMid → eqHigh → compressor → compMakeup → auxSendTap
    input.connect(eqLow);
    eqLow.connect(eqMid);
    eqMid.connect(eqHigh);
    eqHigh.connect(compressor);
    compressor.connect(compMakeup);
    compMakeup.connect(auxSendTap);

    // auxSendTap → volume → pan → analyser → master inputSum
    auxSendTap.connect(volume);
    volume.connect(pan);
    pan.connect(analyser);
    analyser.connect(this.master.inputSum);

    // auxSendTap → aux send gains → aux bus inputs
    for (const effectId of AUX_EFFECT_IDS) {
      auxSendTap.connect(auxSends[effectId]);
      const bus = this.getAuxBusInput(effectId);
      auxSends[effectId].connect(bus);
    }

    return { input, eqLow, eqMid, eqHigh, compressor, compMakeup, auxSendTap, auxSends, volume, pan, analyser };
  }

  private getAuxBusInput(effectId: AuxEffectId): GainNode {
    switch (effectId) {
      case 'delay': return this.delayBus.inputSum;
      case 'chorus': return this.chorusBus.inputSum;
      case 'reverb': return this.reverbBus.inputSum;
      case 'flanger': return this.flangerBus.inputSum;
    }
  }

  // --- Delay Bus ---
  private buildDelayBus(): DelayBusNodes {
    const ctx = this.ctx;

    const inputSum = ctx.createGain();
    const delay = ctx.createDelay(2);
    delay.delayTime.value = 0.375;

    const feedback = ctx.createGain();
    feedback.gain.value = 0.4;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 3000;

    const wet = ctx.createGain();
    wet.gain.value = 0.5;
    const dry = ctx.createGain();
    dry.gain.value = 0.5;

    const output = ctx.createGain();
    output.gain.value = 1;

    const returnGain = ctx.createGain();
    returnGain.gain.value = 0.7;

    // Wire: inputSum → dry → output
    inputSum.connect(dry);
    dry.connect(output);

    // inputSum → delay → filter → wet → output
    inputSum.connect(delay);
    delay.connect(filter);
    filter.connect(wet);
    wet.connect(output);

    // feedback loop: filter → feedback → delay
    filter.connect(feedback);
    feedback.connect(delay);

    // output → returnGain → master
    output.connect(returnGain);
    returnGain.connect(this.master.inputSum);

    return { inputSum, delay, feedback, filter, wet, dry, output, returnGain };
  }

  // --- Chorus Bus ---
  private buildChorusBus(): ChorusBusNodes {
    const ctx = this.ctx;

    const inputSum = ctx.createGain();

    // Stereo chorus with two delay lines
    const splitter = ctx.createChannelSplitter(2);
    const merger = ctx.createChannelMerger(2);

    const delayL = ctx.createDelay(0.05);
    delayL.delayTime.value = 0.007; // 7ms base
    const delayR = ctx.createDelay(0.05);
    delayR.delayTime.value = 0.009; // 9ms base

    // LFO
    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 1.5;

    const lfoGainL = ctx.createGain();
    lfoGainL.gain.value = 0.0015; // ~1.5ms sweep at depth=0.5
    const lfoGainR = ctx.createGain();
    lfoGainR.gain.value = -0.0015; // inverted for stereo spread

    const wet = ctx.createGain();
    wet.gain.value = 0.5;
    const dry = ctx.createGain();
    dry.gain.value = 0.5;

    const output = ctx.createGain();
    output.gain.value = 1;

    const returnGain = ctx.createGain();
    returnGain.gain.value = 0.7;

    // Wire dry path
    inputSum.connect(dry);
    dry.connect(output);

    // Wire wet path: mono input → splitter not needed, just feed both delays
    inputSum.connect(delayL);
    inputSum.connect(delayR);

    // LFO modulates delay times
    lfo.connect(lfoGainL);
    lfo.connect(lfoGainR);
    lfoGainL.connect(delayL.delayTime);
    lfoGainR.connect(delayR.delayTime);

    // Merge stereo
    delayL.connect(merger, 0, 0);
    delayR.connect(merger, 0, 1);
    merger.connect(wet);
    wet.connect(output);

    // Output → returnGain → master
    output.connect(returnGain);
    returnGain.connect(this.master.inputSum);

    lfo.start();

    return { inputSum, delayL, delayR, lfo, lfoGainL, lfoGainR, wet, dry, output, returnGain, merger, splitter };
  }

  // --- Reverb Bus ---
  private buildReverbBus(): ReverbBusNodes {
    const ctx = this.ctx;

    const inputSum = ctx.createGain();

    const preDelay = ctx.createDelay(0.2);
    preDelay.delayTime.value = 0.02; // 20ms

    const convolver = ctx.createConvolver();
    // Generate initial IR
    convolver.buffer = generateReverbIR(ctx, 0.5, 0.5);

    const wet = ctx.createGain();
    wet.gain.value = 0.3;
    const dry = ctx.createGain();
    dry.gain.value = 0.7;

    const output = ctx.createGain();
    output.gain.value = 1;

    const returnGain = ctx.createGain();
    returnGain.gain.value = 0.7;

    // Wire dry path
    inputSum.connect(dry);
    dry.connect(output);

    // Wire wet path
    inputSum.connect(preDelay);
    preDelay.connect(convolver);
    convolver.connect(wet);
    wet.connect(output);

    // Output → returnGain → master
    output.connect(returnGain);
    returnGain.connect(this.master.inputSum);

    return { inputSum, preDelay, convolver, wet, dry, output, returnGain };
  }

  // --- Flanger Bus ---
  private buildFlangerBus(): FlangerBusNodes {
    const ctx = this.ctx;

    const inputSum = ctx.createGain();

    const delay = ctx.createDelay(0.02); // max 20ms
    delay.delayTime.value = 0.005; // 5ms center

    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.value = 0.5;

    const lfoGain = ctx.createGain();
    lfoGain.gain.value = 0.002; // depth in seconds

    const feedback = ctx.createGain();
    feedback.gain.value = 0.5;

    const wet = ctx.createGain();
    wet.gain.value = 0.5;
    const dry = ctx.createGain();
    dry.gain.value = 0.5;

    const output = ctx.createGain();
    output.gain.value = 1;

    const returnGain = ctx.createGain();
    returnGain.gain.value = 0.7;

    // Wire dry path
    inputSum.connect(dry);
    dry.connect(output);

    // Wire wet path
    inputSum.connect(delay);
    delay.connect(wet);
    wet.connect(output);

    // Feedback loop
    delay.connect(feedback);
    feedback.connect(delay);

    // LFO → delay time
    lfo.connect(lfoGain);
    lfoGain.connect(delay.delayTime);

    // Output → returnGain → master
    output.connect(returnGain);
    returnGain.connect(this.master.inputSum);

    lfo.start();

    return { inputSum, delay, lfo, lfoGain, feedback, wet, dry, output, returnGain };
  }

  private buildAuxBuses(): void {
    this.delayBus = this.buildDelayBus();
    this.chorusBus = this.buildChorusBus();
    this.reverbBus = this.buildReverbBus();
    this.flangerBus = this.buildFlangerBus();
  }

  // --- Master Bus ---
  private buildMasterBus(): void {
    const ctx = this.ctx;

    const inputSum = ctx.createGain();
    inputSum.gain.value = 1;

    // Master EQ
    const eqLow = ctx.createBiquadFilter();
    eqLow.type = 'lowshelf';
    eqLow.frequency.value = 100;
    eqLow.gain.value = 0;

    const eqMid = ctx.createBiquadFilter();
    eqMid.type = 'peaking';
    eqMid.frequency.value = 1000;
    eqMid.Q.value = 1;
    eqMid.gain.value = 0;

    const eqHigh = ctx.createBiquadFilter();
    eqHigh.type = 'highshelf';
    eqHigh.frequency.value = 8000;
    eqHigh.gain.value = 0;

    // Master compressor (gentler defaults)
    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -12;
    compressor.ratio.value = 2;
    compressor.attack.value = 0.01;
    compressor.release.value = 0.15;
    compressor.knee.value = 10;

    const compMakeup = ctx.createGain();
    compMakeup.gain.value = 1;

    // Limiter (brick-wall)
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -1;
    limiter.ratio.value = 20;
    limiter.attack.value = 0.001;
    limiter.release.value = 0.1;
    limiter.knee.value = 0;

    // Master volume
    const volume = ctx.createGain();
    volume.gain.value = 0.85;

    // Stereo metering
    const splitter = ctx.createChannelSplitter(2);
    const merger = ctx.createChannelMerger(2);
    const analyserL = ctx.createAnalyser();
    analyserL.fftSize = 256;
    analyserL.smoothingTimeConstant = 0.8;
    const analyserR = ctx.createAnalyser();
    analyserR.fftSize = 256;
    analyserR.smoothingTimeConstant = 0.8;

    // Wire: inputSum → EQ → compressor → makeup → limiter → volume → splitter
    inputSum.connect(eqLow);
    eqLow.connect(eqMid);
    eqMid.connect(eqHigh);
    eqHigh.connect(compressor);
    compressor.connect(compMakeup);
    compMakeup.connect(limiter);
    limiter.connect(volume);
    volume.connect(splitter);

    // Splitter → analysers → merger (for monitoring)
    splitter.connect(analyserL, 0);
    splitter.connect(analyserR, 1);
    analyserL.connect(merger, 0, 0);
    analyserR.connect(merger, 0, 1);

    this.master = { inputSum, eqLow, eqMid, eqHigh, compressor, compMakeup, limiter, volume, analyserL, analyserR, splitter, merger };
  }

  // ============================================================
  // Public API
  // ============================================================

  /** Get channel input GainNode — connect your synth/drum voice here */
  getChannelInput(id: ProMixerChannelId): GainNode {
    const ch = this.channels.get(id);
    if (!ch) throw new Error(`Channel ${id} not found`);
    return ch.input;
  }

  /** Get the final output node — connect to ctx.destination */
  getOutput(): ChannelMergerNode {
    return this.master.merger;
  }

  /** Apply full channel state to audio nodes */
  applyChannelState(id: ProMixerChannelId, state: ChannelStripState): void {
    const ch = this.channels.get(id);
    if (!ch || this.disposed) return;

    const now = this.ctx.currentTime;

    // EQ
    ch.eqLow.frequency.setTargetAtTime(state.eq.low.frequency, now, 0.02);
    ch.eqLow.gain.setTargetAtTime(state.eq.low.gain, now, 0.02);
    ch.eqMid.frequency.setTargetAtTime(state.eq.mid.frequency, now, 0.02);
    ch.eqMid.gain.setTargetAtTime(state.eq.mid.gain, now, 0.02);
    ch.eqMid.Q.setTargetAtTime(state.eq.mid.Q, now, 0.02);
    ch.eqHigh.frequency.setTargetAtTime(state.eq.high.frequency, now, 0.02);
    ch.eqHigh.gain.setTargetAtTime(state.eq.high.gain, now, 0.02);

    // Compressor
    ch.compressor.threshold.setTargetAtTime(state.compressor.threshold, now, 0.02);
    ch.compressor.ratio.setTargetAtTime(state.compressor.ratio, now, 0.02);
    ch.compressor.attack.setTargetAtTime(state.compressor.attack, now, 0.02);
    ch.compressor.release.setTargetAtTime(state.compressor.release, now, 0.02);
    ch.compressor.knee.setTargetAtTime(state.compressor.knee, now, 0.02);
    ch.compMakeup.gain.setTargetAtTime(state.compressor.makeup, now, 0.02);

    // AUX sends
    for (const effectId of AUX_EFFECT_IDS) {
      ch.auxSends[effectId].gain.setTargetAtTime(state.auxSends[effectId], now, 0.02);
    }

    // Volume, pan, mute
    const effectiveVolume = state.mute ? 0 : state.volume;
    ch.volume.gain.setTargetAtTime(effectiveVolume, now, 0.02);
    ch.pan.pan.setTargetAtTime(state.pan, now, 0.02);
  }

  /** Apply AUX return state */
  applyAuxReturnState(state: AuxReturnState): void {
    if (this.disposed) return;
    const now = this.ctx.currentTime;

    // Delay
    const dp = state.delay.params;
    this.delayBus.delay.delayTime.setTargetAtTime(dp.time, now, 0.02);
    this.delayBus.feedback.gain.setTargetAtTime(dp.feedback, now, 0.02);
    this.delayBus.filter.frequency.setTargetAtTime(dp.filterCutoff, now, 0.02);
    this.delayBus.wet.gain.setTargetAtTime(dp.wetDry, now, 0.02);
    this.delayBus.dry.gain.setTargetAtTime(1 - dp.wetDry, now, 0.02);
    this.delayBus.returnGain.gain.setTargetAtTime(state.delay.returnLevel, now, 0.02);

    // Chorus
    const cp = state.chorus.params;
    this.chorusBus.lfo.frequency.setTargetAtTime(cp.rate, now, 0.02);
    const chorusDepth = cp.depth * 0.003; // 0-3ms sweep
    this.chorusBus.lfoGainL.gain.setTargetAtTime(chorusDepth, now, 0.02);
    this.chorusBus.lfoGainR.gain.setTargetAtTime(-chorusDepth, now, 0.02);
    this.chorusBus.wet.gain.setTargetAtTime(cp.wetDry, now, 0.02);
    this.chorusBus.dry.gain.setTargetAtTime(1 - cp.wetDry, now, 0.02);
    this.chorusBus.returnGain.gain.setTargetAtTime(state.chorus.returnLevel, now, 0.02);

    // Reverb
    const rp = state.reverb.params;
    this.reverbBus.preDelay.delayTime.setTargetAtTime(rp.preDelay / 1000, now, 0.02);
    this.reverbBus.wet.gain.setTargetAtTime(rp.wetDry, now, 0.02);
    this.reverbBus.dry.gain.setTargetAtTime(1 - rp.wetDry, now, 0.02);
    this.reverbBus.returnGain.gain.setTargetAtTime(state.reverb.returnLevel, now, 0.02);
    // Regenerate IR when roomSize/damping change
    generateReverbIRDebounced(this.ctx, rp.roomSize, rp.damping, (buffer) => {
      if (!this.disposed) {
        try { this.reverbBus.convolver.buffer = buffer; } catch { /* ignore */ }
      }
    });

    // Flanger
    const fp = state.flanger.params;
    this.flangerBus.lfo.frequency.setTargetAtTime(fp.rate, now, 0.02);
    const flangerDepth = fp.depth * 0.004; // 0-4ms sweep
    this.flangerBus.lfoGain.gain.setTargetAtTime(flangerDepth, now, 0.02);
    this.flangerBus.feedback.gain.setTargetAtTime(fp.feedback, now, 0.02);
    this.flangerBus.wet.gain.setTargetAtTime(fp.wetDry, now, 0.02);
    this.flangerBus.dry.gain.setTargetAtTime(1 - fp.wetDry, now, 0.02);
    this.flangerBus.returnGain.gain.setTargetAtTime(state.flanger.returnLevel, now, 0.02);
  }

  /** Apply master bus state */
  applyMasterState(state: MasterBusState): void {
    if (this.disposed) return;
    const now = this.ctx.currentTime;

    // Master EQ
    this.master.eqLow.frequency.setTargetAtTime(state.eq.low.frequency, now, 0.02);
    this.master.eqLow.gain.setTargetAtTime(state.eq.low.gain, now, 0.02);
    this.master.eqMid.frequency.setTargetAtTime(state.eq.mid.frequency, now, 0.02);
    this.master.eqMid.gain.setTargetAtTime(state.eq.mid.gain, now, 0.02);
    this.master.eqMid.Q.setTargetAtTime(state.eq.mid.Q, now, 0.02);
    this.master.eqHigh.frequency.setTargetAtTime(state.eq.high.frequency, now, 0.02);
    this.master.eqHigh.gain.setTargetAtTime(state.eq.high.gain, now, 0.02);

    // Master compressor
    this.master.compressor.threshold.setTargetAtTime(state.compressor.threshold, now, 0.02);
    this.master.compressor.ratio.setTargetAtTime(state.compressor.ratio, now, 0.02);
    this.master.compressor.attack.setTargetAtTime(state.compressor.attack, now, 0.02);
    this.master.compressor.release.setTargetAtTime(state.compressor.release, now, 0.02);
    this.master.compressor.knee.setTargetAtTime(state.compressor.knee, now, 0.02);
    this.master.compMakeup.gain.setTargetAtTime(state.compressor.makeup, now, 0.02);

    // Limiter
    this.master.limiter.threshold.setTargetAtTime(state.limiter.threshold, now, 0.02);
    this.master.limiter.release.setTargetAtTime(state.limiter.release, now, 0.02);

    // Master volume
    this.master.volume.gain.setTargetAtTime(state.volume, now, 0.02);
  }

  /** Read RMS level from a channel analyser (0-1) */
  getChannelLevel(id: ProMixerChannelId): number {
    const ch = this.channels.get(id);
    if (!ch) return 0;
    return this.readRMS(ch.analyser);
  }

  /** Read stereo master levels */
  getMasterLevels(): { left: number; right: number } {
    return {
      left: this.readRMS(this.master.analyserL),
      right: this.readRMS(this.master.analyserR),
    };
  }

  private readRMS(analyser: AnalyserNode): number {
    const data = new Float32Array(analyser.fftSize);
    analyser.getFloatTimeDomainData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data[i] * data[i];
    }
    const rms = Math.sqrt(sum / data.length);
    // Convert to 0-1 range (with headroom for clipping indication)
    return Math.min(1, rms * 3);
  }

  /** Apply solo logic across all channels */
  applySoloState(channelStates: Record<ProMixerChannelId, ChannelStripState>): void {
    const anySolo = ALL_CHANNEL_IDS.some(id => channelStates[id].solo);

    for (const id of ALL_CHANNEL_IDS) {
      const ch = this.channels.get(id);
      const state = channelStates[id];
      if (!ch) continue;

      const shouldPlay = !state.mute && (!anySolo || state.solo);
      const effectiveVolume = shouldPlay ? state.volume : 0;
      ch.volume.gain.setTargetAtTime(effectiveVolume, this.ctx.currentTime, 0.02);
    }
  }

  /** Clean up all nodes */
  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;

    // Stop oscillators
    try { this.chorusBus.lfo.stop(); } catch { /* ignore */ }
    try { this.flangerBus.lfo.stop(); } catch { /* ignore */ }

    // Disconnect everything
    this.channels.forEach(ch => {
      ch.input.disconnect();
      ch.eqLow.disconnect();
      ch.eqMid.disconnect();
      ch.eqHigh.disconnect();
      ch.compressor.disconnect();
      ch.compMakeup.disconnect();
      ch.auxSendTap.disconnect();
      for (const effectId of AUX_EFFECT_IDS) {
        ch.auxSends[effectId].disconnect();
      }
      ch.volume.disconnect();
      ch.pan.disconnect();
      ch.analyser.disconnect();
    });

    // Disconnect AUX buses
    const disconnectAll = (...nodes: AudioNode[]) => {
      nodes.forEach(n => { try { n.disconnect(); } catch { /* ignore */ } });
    };

    disconnectAll(
      this.delayBus.inputSum, this.delayBus.delay, this.delayBus.feedback,
      this.delayBus.filter, this.delayBus.wet, this.delayBus.dry,
      this.delayBus.output, this.delayBus.returnGain,
    );
    disconnectAll(
      this.chorusBus.inputSum, this.chorusBus.delayL, this.chorusBus.delayR,
      this.chorusBus.lfo, this.chorusBus.lfoGainL, this.chorusBus.lfoGainR,
      this.chorusBus.wet, this.chorusBus.dry, this.chorusBus.output,
      this.chorusBus.returnGain, this.chorusBus.merger,
    );
    disconnectAll(
      this.reverbBus.inputSum, this.reverbBus.preDelay, this.reverbBus.convolver,
      this.reverbBus.wet, this.reverbBus.dry, this.reverbBus.output,
      this.reverbBus.returnGain,
    );
    disconnectAll(
      this.flangerBus.inputSum, this.flangerBus.delay, this.flangerBus.lfo,
      this.flangerBus.lfoGain, this.flangerBus.feedback,
      this.flangerBus.wet, this.flangerBus.dry, this.flangerBus.output,
      this.flangerBus.returnGain,
    );

    // Disconnect master
    disconnectAll(
      this.master.inputSum, this.master.eqLow, this.master.eqMid, this.master.eqHigh,
      this.master.compressor, this.master.compMakeup, this.master.limiter,
      this.master.volume, this.master.analyserL, this.master.analyserR,
      this.master.splitter, this.master.merger,
    );

    this.channels.clear();
  }
}
