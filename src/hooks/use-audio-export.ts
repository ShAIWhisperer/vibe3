import { useCallback } from 'react';
import type { Step, TB303Params, ModulatorState, AutomationState, AutomationParam } from './use-tb303-engine';
import { noteToFreq, getAutomationValue } from './use-tb303-engine';

export type ExportFormat = 'wav' | 'webm';

interface ExportOptions {
  loops: number;
  params: TB303Params;
  pattern: Step[];
  modulators: ModulatorState;
  automation: AutomationState;
  automationEnabled: boolean;
  format?: ExportFormat;
}

interface ExportProgress {
  phase: 'rendering' | 'encoding';
  progress: number;
}

const SVF_PROCESSOR_CODE = `
class SVFProcessorExport extends AudioWorkletProcessor {
  constructor() {
    super();
    this.lp1 = 0;
    this.bp1 = 0;
    this.lp2 = 0;
    this.bp2 = 0;
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
      
      const kf = Math.min(0.99, 2 * Math.sin(Math.PI * freq / sampleRate));
      const kq = Math.max(0.01, 1 - res * 0.95);
      
      const inp = inputChannel[i];
      
      const hp1 = inp - this.lp1 - kq * this.bp1;
      this.bp1 += kf * hp1;
      this.lp1 += kf * this.bp1;
      
      const hp2 = this.lp1 - this.lp2 - kq * this.bp2;
      this.bp2 += kf * hp2;
      this.lp2 += kf * this.bp2;
      
      outputChannel[i] = this.lp2;
    }
    
    return true;
  }
}

try {
  registerProcessor('svf-processor-export', SVFProcessorExport);
} catch (e) {
  // Already registered, ignore
}
`;

function makeDistortionCurve(amount: number): Float32Array {
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
}

function encodeWAV(samples: Float32Array, sampleRate: number): Blob {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);
  
  // WAV header
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };
  
  writeString(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // subchunk size
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeString(36, 'data');
  view.setUint32(40, samples.length * 2, true);
  
  // Convert float samples to 16-bit PCM
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    offset += 2;
  }
  
  return new Blob([buffer], { type: 'audio/wav' });
}

async function encodeWebM(samples: Float32Array, sampleRate: number): Promise<Blob> {
  // Create an AudioContext to play back the samples for MediaRecorder
  const audioCtx = new AudioContext({ sampleRate });
  
  // Ensure the AudioContext is running (may be suspended in some browsers)
  if (audioCtx.state === 'suspended') {
    await audioCtx.resume();
  }
  
  // Create an audio buffer from our samples
  const audioBuffer = audioCtx.createBuffer(1, samples.length, sampleRate);
  audioBuffer.copyToChannel(samples, 0);
  
  // Create a MediaStreamDestination to capture audio
  const dest = audioCtx.createMediaStreamDestination();
  
  // Set up MediaRecorder with fallback mime types
  let mimeType = 'audio/webm';
  if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
    mimeType = 'audio/webm;codecs=opus';
  } else if (MediaRecorder.isTypeSupported('audio/webm')) {
    mimeType = 'audio/webm';
  }
  
  console.log('[WebM Encoder] Using mime type:', mimeType);
  
  const mediaRecorder = new MediaRecorder(dest.stream, { mimeType });
  const chunks: Blob[] = [];
  
  mediaRecorder.ondataavailable = (e) => {
    if (e.data.size > 0) {
      chunks.push(e.data);
      console.log('[WebM Encoder] Chunk received:', e.data.size, 'bytes');
    }
  };
  
  // Calculate expected duration in ms
  const durationMs = (samples.length / sampleRate) * 1000;
  
  return new Promise((resolve, reject) => {
    // Timeout protection - if encoding takes too long, reject
    const timeoutId = setTimeout(() => {
      console.error('[WebM Encoder] Timeout reached');
      mediaRecorder.stop();
      audioCtx.close();
      reject(new Error('WebM encoding timed out. Try exporting as WAV instead.'));
    }, durationMs + 10000); // Allow duration + 10 seconds buffer
    
    mediaRecorder.onstop = () => {
      clearTimeout(timeoutId);
      audioCtx.close();
      console.log('[WebM Encoder] Recording stopped, total chunks:', chunks.length);
      if (chunks.length === 0) {
        reject(new Error('WebM encoding produced no data. Try exporting as WAV instead.'));
        return;
      }
      resolve(new Blob(chunks, { type: 'audio/webm' }));
    };
    
    mediaRecorder.onerror = (e) => {
      clearTimeout(timeoutId);
      audioCtx.close();
      console.error('[WebM Encoder] MediaRecorder error:', e);
      reject(new Error('WebM encoding failed. Try exporting as WAV instead.'));
    };
    
    // Play the buffer through the MediaStreamDestination
    const source = audioCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(dest);
    
    console.log('[WebM Encoder] Starting recording, duration:', durationMs, 'ms');
    mediaRecorder.start(100); // Collect data every 100ms for more reliable capture
    source.start(0);
    
    source.onended = () => {
      console.log('[WebM Encoder] Playback ended');
      // Give a small delay before stopping to ensure all data is captured
      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          mediaRecorder.stop();
        }
      }, 200);
    };
  });
}

export function useAudioExport() {
  const exportAudio = useCallback(async (
    options: ExportOptions,
    onProgress?: (progress: ExportProgress) => void
  ): Promise<Blob> => {
    const { 
      loops, 
      params, 
      pattern, 
      automation, 
      automationEnabled,
      format = 'wav'
    } = options;
    
    const sampleRate = 44100;
    const secondsPerStep = 60 / params.tempo / 4;
    const totalSteps = 16 * loops;
    const totalDuration = totalSteps * secondsPerStep;
    const totalSamples = Math.ceil(totalDuration * sampleRate);
    
    onProgress?.({ phase: 'rendering', progress: 0 });
    
    // Create offline context
    const offlineCtx = new OfflineAudioContext(1, totalSamples, sampleRate);
    
    // Try to use AudioWorklet for better quality, fall back to BiquadFilter
    let useWorklet = false;
    let filterNode: AudioWorkletNode | null = null;
    let fallbackFilter1: BiquadFilterNode | null = null;
    let fallbackFilter2: BiquadFilterNode | null = null;
    
    try {
      const blob = new Blob([SVF_PROCESSOR_CODE], { type: 'application/javascript' });
      const url = URL.createObjectURL(blob);
      await offlineCtx.audioWorklet.addModule(url);
      URL.revokeObjectURL(url);
      useWorklet = true;
    } catch {
      useWorklet = false;
    }
    
    onProgress?.({ phase: 'rendering', progress: 10 });
    
    // Create oscillator
    const osc = offlineCtx.createOscillator();
    osc.type = params.waveform === 'saw' ? 'sawtooth' : 'square';
    
    // Create filter chain
    if (useWorklet) {
      filterNode = new AudioWorkletNode(offlineCtx, 'svf-processor-export');
    } else {
      fallbackFilter1 = offlineCtx.createBiquadFilter();
      fallbackFilter1.type = 'lowpass';
      fallbackFilter2 = offlineCtx.createBiquadFilter();
      fallbackFilter2.type = 'lowpass';
    }
    
    // VCA
    const vca = offlineCtx.createGain();
    vca.gain.setValueAtTime(0, 0);
    
    // Overdrive
    const overdrive = offlineCtx.createWaveShaper();
    overdrive.curve = makeDistortionCurve(params.overdrive);
    
    // Master gain
    const masterGain = offlineCtx.createGain();
    masterGain.gain.setValueAtTime(params.volume, 0);
    
    // Connect chain
    if (useWorklet && filterNode) {
      osc.connect(filterNode);
      filterNode.connect(vca);
    } else if (fallbackFilter1 && fallbackFilter2) {
      osc.connect(fallbackFilter1);
      fallbackFilter1.connect(fallbackFilter2);
      fallbackFilter2.connect(vca);
    }
    vca.connect(overdrive);
    overdrive.connect(masterGain);
    masterGain.connect(offlineCtx.destination);
    
    onProgress?.({ phase: 'rendering', progress: 20 });
    
    // Schedule all notes and parameter changes
    let filterEnv = 0;
    let accentEnv = 0;
    
    for (let loop = 0; loop < loops; loop++) {
      for (let stepIdx = 0; stepIdx < 16; stepIdx++) {
        const step = pattern[stepIdx];
        const prevStep = pattern[(stepIdx - 1 + 16) % 16];
        const stepTime = (loop * 16 + stepIdx) * secondsPerStep;
        const patternPosition = stepIdx / 16;
        
        // Get automation values
        const getParamValue = (param: AutomationParam, baseValue: number): number => {
          if (!automationEnabled) return baseValue;
          const autoValue = getAutomationValue(automation[param], patternPosition);
          return autoValue !== null ? autoValue : baseValue;
        };
        
        const cutoff = getParamValue('cutoff', params.cutoff);
        const resonance = getParamValue('resonance', params.resonance);
        const envMod = getParamValue('envMod', params.envMod);
        const decay = getParamValue('decay', params.decay);
        const accent = getParamValue('accent', params.accent);
        const drive = getParamValue('overdrive', params.overdrive);
        
        // Update overdrive
        overdrive.curve = makeDistortionCurve(drive);
        
        if (step.active) {
          const freq = noteToFreq(step.note);
          const prevFreq = prevStep?.active ? noteToFreq(prevStep.note) : freq;
          
          // Pitch
          if (step.slide && prevStep?.active) {
            osc.frequency.setValueAtTime(prevFreq, stepTime);
            osc.frequency.exponentialRampToValueAtTime(freq, stepTime + 0.05);
          } else {
            osc.frequency.setValueAtTime(freq, stepTime);
          }
          
          // Envelope trigger
          if (!step.slide) {
            filterEnv = 1;
            if (step.accent) {
              accentEnv = accent;
            }
            
            const attackTime = step.accent ? 0.001 : 0.003;
            const level = step.accent ? 1.0 : 0.7;
            
            vca.gain.setValueAtTime(0, stepTime);
            vca.gain.linearRampToValueAtTime(level, stepTime + attackTime);
            vca.gain.setTargetAtTime(level * 0.8, stepTime + attackTime, 0.1 + decay * 0.3);
          }
          
          // Filter modulation
          const baseCutoff = Math.pow(2, cutoff * 7 - 5) * 1000;
          const envAmount = filterEnv * envMod * 5;
          const accentMod = accentEnv * 0.4;
          const filterFreq = Math.min(18000, baseCutoff * Math.pow(2, envAmount + accentMod));
          
          if (useWorklet && filterNode) {
            const freqParam = filterNode.parameters.get('frequency');
            const resParam = filterNode.parameters.get('resonance');
            if (freqParam) freqParam.setValueAtTime(filterFreq, stepTime);
            if (resParam) resParam.setValueAtTime(resonance, stepTime);
          } else if (fallbackFilter1 && fallbackFilter2) {
            const q = 0.5 + Math.pow(resonance, 2) * 15;
            fallbackFilter1.frequency.setValueAtTime(filterFreq, stepTime);
            fallbackFilter1.Q.setValueAtTime(q, stepTime);
            fallbackFilter2.frequency.setValueAtTime(filterFreq, stepTime);
            fallbackFilter2.Q.setValueAtTime(q * 0.5, stepTime);
          }
          
          // Decay envelopes over time
          filterEnv *= 0.85;
          accentEnv *= 0.9;
        }
      }
      
      // Progress update per loop
      const loopProgress = 20 + (loop / loops) * 40;
      onProgress?.({ phase: 'rendering', progress: loopProgress });
    }
    
    // Start and render
    osc.start(0);
    osc.stop(totalDuration);
    
    onProgress?.({ phase: 'rendering', progress: 60 });
    
    const renderedBuffer = await offlineCtx.startRendering();
    const samples = renderedBuffer.getChannelData(0);
    
    onProgress?.({ phase: 'rendering', progress: 80 });
    
    // Encode to selected format
    if (format === 'webm') {
      onProgress?.({ phase: 'encoding', progress: 85 });
      const blob = await encodeWebM(samples, sampleRate);
      onProgress?.({ phase: 'encoding', progress: 100 });
      return blob;
    } else {
      onProgress?.({ phase: 'encoding', progress: 90 });
      const blob = encodeWAV(samples, sampleRate);
      onProgress?.({ phase: 'encoding', progress: 100 });
      return blob;
    }
  }, []);
  
  return { exportAudio };
}
