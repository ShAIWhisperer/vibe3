import { useState, useEffect, useRef } from 'react';
import { useMultiSynthEngine, type ModuleId, MODULE_CONFIGS } from '@/hooks/use-multi-synth-engine';
import { type Step, type AutomationParam, AUTOMATION_PARAMS } from '@/hooks/use-tb303-engine';
import { useAudioExport } from '@/hooks/use-audio-export';
import { useDrumEngine } from '@/hooks/use-drum-engine';
import { Knob } from './Knob';
import { StepEditor, StepControls } from './StepEditor';
import { WaveformSwitch } from './WaveformSwitch';
import { Visualizer } from './Visualizer';
import { PatternLibrary } from './PatternLibrary';
import { ModulationPanel } from './ModulationPanel';
import { AutomationPanel } from './AutomationPanel';
import { SessionManager } from './SessionManager';
import { ExportDialog } from './ExportDialog';
import { EmotionToMusic } from './EmotionToMusic';
import { Mixer } from './Mixer';
import { ProMixer } from './ProMixer';
import { ModuleTabs } from './ModuleTabs';
import { useProMixer } from '@/hooks/use-pro-mixer';
import type { ProMixerChannelId } from '@/audio/pro-mixer-types';
import { SYNTH_CHANNEL_IDS } from '@/audio/pro-mixer-types';
import { DrumMachine } from './DrumMachine';
import { ArrangementGrid } from './ArrangementGrid';
import { PatternSelector } from './PatternSelector';
import { LearnMode, LearnModeButton } from './LearnMode';
import { CLASSIC_PATTERNS } from './patterns';
import { generateRandomMultiChannel } from '@/utils/emotion-to-music';
import { DEMO_SONG } from '@/utils/demo-song';
import { Play, Square, Volume2, FolderOpen, RotateCcw, Share2, Twitter, Facebook, Linkedin, Link2, X, Music, Waves, Save, Download, Sparkles, ChevronUp, ChevronDown, Shuffle, GraduationCap } from 'lucide-react';

import type { MultiModuleSessionData } from '@/hooks/use-multi-synth-engine';
import type { DrumState } from '@/hooks/use-drum-engine';

// TB-303 Style Synthesizer with Multi-Module Support

interface TB303Props {
  initialSession?: MultiModuleSessionData;
  initialDrumData?: DrumState | null;
}

const VIRAL_HOOKS = [
"🔥 I just made this INSANE acid line with Vibe3 - the browser synth that sounds like a real TB-303! Listen to this squelch 👇",
"🎹 No plugins. No DAW. Just pure browser acid. Made this banger in 2 minutes with Vibe3 ⚡",
"🤯 This FREE browser synth sounds better than my $2000 hardware. Vibe3 is absolutely unreal.",
"⚡ POV: You discover a synth that makes you feel like a 90s rave producer. Vibe3 hits different 🔊",
"🎛️ Spent 3 hours tweaking this acid line. No regrets. Vibe3 turned my browser into a TB-303 💀",
"🔊 WARNING: This synth is addictive. Made 47 acid patterns today. Send help. #Vibe3"];



const APP_URL = "https://vibe3-app-iota.vercel.app";

export function TB303({ initialSession, initialDrumData }: TB303Props = {}) {
  const {
    // Module selection
    activeModule,
    setActiveModule,
    moduleStates,

    // Current module shortcuts
    params,
    pattern,
    modulators,
    automation,

    // Current module setters
    setParams,
    setPattern,
    setModulator,
    setAutomation,
    clearAutomation,
    clearAllAutomation,

    // Multi-module setters
    setAllPatterns,
    setModuleParams,
    transposePattern,

    // Pattern bank
    activePatternIndex,
    patternBank,
    setActivePattern,
    copyPattern,
    clearPatternSlot,

    // Session management
    saveSession,
    loadSession,

    // Global
    tempo,
    setTempo,
    isPlaying,
    currentStep,
    start,
    stop,
    playNote,
    automationEnabled,
    toggleAutomationEnabled,
    playbackPosition,

    // Mixer
    mixer,
    setMixerChannel,
    setMasterVolume,

    // Arrangement / Song mode
    arrangement,
    currentBlockIndex,
    setPlaybackMode,
    setArrangementLoop,
    setArrangementCell,
    addArrangementBlock,
    removeArrangementBlock,
    copyArrangementBlock,
    setDrumArrangementCallback,

    // Drum integration
    setDrumScheduler,
    getAudioContext,
    getMasterGain,

    // Pro Mixer integration
    reconnectVoice,
    reconnectAllToMaster,

    // Constants
    NOTES,
    MODULE_CONFIGS: configs
  } = useMultiSynthEngine();

  const { exportAudio } = useAudioExport();

  // Drum machine
  const drumEngine = useDrumEngine();

  const [selectedStep, setSelectedStep] = useState<number | null>(0);
  const [showLibrary, setShowLibrary] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showSessionManager, setShowSessionManager] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [shareMessage, setShareMessage] = useState(VIRAL_HOOKS[0]);
  const [copySuccess, setCopySuccess] = useState(false);
  const [viewMode, setViewMode] = useState<'sequencer' | 'automation'>('sequencer');
  const [showEmotionToMusic, setShowEmotionToMusic] = useState(false);
  const [showMixer, setShowMixer] = useState(true);
  const [drumMute, setDrumMute] = useState(false);
  const [showLearnMode, setShowLearnMode] = useState(false);
  const [highlightedParam, setHighlightedParam] = useState<string | null>(null);
  const [mixerMode, setMixerMode] = useState<'basic' | 'pro'>('basic');
  const proMixer = useProMixer();
  const proMixerInitializedRef = useRef(false);

  // Connect drum engine to audio context when playing
  useEffect(() => {
    if (isPlaying) {
      const ctx = getAudioContext();
      const masterGain = getMasterGain();
      if (ctx && masterGain) {
        drumEngine.connectToContext(ctx, masterGain);
      }
    }
  }, [isPlaying, getAudioContext, getMasterGain, drumEngine.connectToContext]);

  // Connect drum scheduler to main synth engine
  useEffect(() => {
    if (!drumMute && drumEngine.drumState.enabled) {
      setDrumScheduler((stepIndex: number, time: number) => {
        drumEngine.scheduleStep(stepIndex, time);
      });
    } else {
      setDrumScheduler(() => {}); // No-op when muted
    }
  }, [drumMute, drumEngine.drumState.enabled, drumEngine.scheduleStep, setDrumScheduler]);

  // Wire drum arrangement callback so song mode can switch drum patterns
  useEffect(() => {
    setDrumArrangementCallback((patternIndex: number | null) => {
      if (patternIndex !== null) {
        drumEngine.setActiveDrumPattern(patternIndex);
      }
    });
  }, [setDrumArrangementCallback, drumEngine.setActiveDrumPattern]);

  // Pro Mixer: connect/disconnect when mode changes
  useEffect(() => {
    if (mixerMode === 'pro') {
      const ctx = getAudioContext();
      if (!ctx) return;

      // Initialize pro mixer engine
      proMixer.initMixer(ctx);
      proMixerInitializedRef.current = true;

      // Reconnect synth voices to ProMixer inputs
      const engine = proMixer.getEngine();
      if (engine) {
        for (const id of SYNTH_CHANNEL_IDS) {
          reconnectVoice(id as ModuleId, engine.getChannelInput(id));
        }
        // Reconnect drum channels
        drumEngine.connectToProMixer(engine);
      }
    } else if (proMixerInitializedRef.current) {
      // Reconnect back to legacy chain
      reconnectAllToMaster();
      drumEngine.reconnectToLegacy();
    }
  }, [mixerMode]);

  // Check if a parameter has automation
  const hasAutomation = (param: AutomationParam): boolean => {
    return automation[param].points.some((p) => p >= 0);
  };

  // Load initial session or demo song on startup
  useEffect(() => {
    if (initialSession) {
      // Load from shared session
      loadSession(initialSession);
      if (initialDrumData) {
        drumEngine.loadState(initialDrumData);
      }
      // Restore pro mixer state if present
      if (initialSession.proMixer) {
        proMixer.loadState(initialSession.proMixer);
        setMixerMode('pro');
      }
      return;
    }

    // Load demo song - complete multi-module composition
    setAllPatterns(DEMO_SONG.patterns);

    (Object.keys(DEMO_SONG.params) as ModuleId[]).forEach((id) => {
      setModuleParams(id, DEMO_SONG.params[id]);
    });

    (Object.keys(DEMO_SONG.mixer) as (ModuleId | 'master')[]).forEach((channel) => {
      if (channel === 'master') {
        setMasterVolume(DEMO_SONG.mixer.master.volume);
      } else {
        setMixerChannel(channel, {
          volume: DEMO_SONG.mixer[channel].volume,
          pan: DEMO_SONG.mixer[channel].pan,
          mute: DEMO_SONG.mixer[channel].mute,
          solo: false
        });
      }
    });

    setTempo(DEMO_SONG.tempo);

    drumEngine.setKit(DEMO_SONG.drumKitId);
    drumEngine.setPattern(DEMO_SONG.drumPattern);
    drumEngine.setSwing(DEMO_SONG.drumSwing);
  }, []);

  const handleStepUpdate = (index: number, data: Partial<Step>) => {
    const newPattern = [...pattern];
    newPattern[index] = { ...newPattern[index], ...data };
    setPattern(newPattern);
  };

  const handleLoadPattern = (steps: Step[], newTempo: number) => {
    setPattern(steps);
    setTempo(newTempo);
    setSelectedStep(0);
  };

  const randomizePattern = () => {
    const randomPattern = CLASSIC_PATTERNS[Math.floor(Math.random() * CLASSIC_PATTERNS.length)];
    setPattern(randomPattern.steps);
    setTempo(randomPattern.tempo);
  };

  // Randomize ALL channels with musically coherent patterns (same scale)
  const randomizeAllChannels = () => {
    const { patterns, params: newParams, tempo: newTempo } = generateRandomMultiChannel();

    // Apply to all modules
    setAllPatterns(patterns);
    (Object.keys(newParams) as ModuleId[]).forEach((id) => {
      setModuleParams(id, newParams[id]);
    });
    setTempo(newTempo);
    setSelectedStep(0);
  };

  // Handle emotion-to-music with support for multi-module patterns
  const handleEmotionApply = (steps: Step[], newParams: Partial<typeof params>) => {
    // Check if we received multi-module patterns (via custom property)
    const multiPatterns = (newParams as {_multiPatterns?: Record<ModuleId, Step[]>;})._multiPatterns;
    const multiParams = (newParams as {_multiParams?: Record<ModuleId, Partial<typeof params>>;})._multiParams;

    if (multiPatterns) {
      // Apply patterns to all modules
      setAllPatterns(multiPatterns);

      // Apply params to each module if provided
      if (multiParams) {
        (Object.keys(multiParams) as ModuleId[]).forEach((id) => {
          setModuleParams(id, multiParams[id]);
        });
      }
    } else {
      // Fallback: apply to current module only
      setPattern(steps);
      setParams(newParams);
    }

    // Apply tempo if provided
    if (newParams.tempo) {
      setTempo(newParams.tempo);
    }

    setSelectedStep(0);
  };

  const generateNewHook = () => {
    const currentIndex = VIRAL_HOOKS.indexOf(shareMessage);
    const nextIndex = (currentIndex + 1) % VIRAL_HOOKS.length;
    setShareMessage(VIRAL_HOOKS[nextIndex]);
  };

  const getShareUrl = (platform: string) => {
    const text = encodeURIComponent(`${shareMessage}\n\n🎹 Try it FREE:`);
    const url = encodeURIComponent(APP_URL);
    switch (platform) {
      case 'twitter':return `https://twitter.com/intent/tweet?text=${text}&url=${url}`;
      case 'facebook':return `https://www.facebook.com/sharer/sharer.php?u=${url}&quote=${text}`;
      case 'linkedin':return `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
      default:return APP_URL;
    }
  };

  const copyToClipboard = () => {
    const fullText = `${shareMessage}\n\n🎹 Try it FREE: ${APP_URL}`;
    const textarea = document.createElement('textarea');
    textarea.value = fullText;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  // Get active module color
  const activeColor = MODULE_CONFIGS[activeModule].color;

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-950 p-2 sm:p-4 pb-24 sm:pb-4">
      <div className="w-full max-w-5xl mx-auto">
        {/* Main Unit */}
        <div
        className="rounded-xl sm:rounded-2xl p-3 sm:p-6 relative overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #2a2a2a 0%, #1a1a1a 100%)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8), inset 0 1px 0 rgba(255,255,255,0.1)'
        }}>

          {/* Header - Mobile Responsive */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 sm:mb-6">
            <div className="flex items-center justify-between sm:justify-start gap-3">
              <div className="flex items-center gap-3">
                <div>
                  <h1
                  className="text-2xl sm:text-4xl font-black tracking-tight"
                  style={{
                    background: 'linear-gradient(135deg, #ff6b00 0%, #ffb800 50%, #ff6b00 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    filter: 'drop-shadow(0 0 20px rgba(255, 107, 0, 0.4))'
                  }}>

                    VIBE3
                  </h1>
                  <p className="text-[8px] sm:text-[10px] text-zinc-500 tracking-[0.15em] sm:tracking-[0.2em]">MULTI-LAYER ACID SYNTHESIZER</p>
                </div>
                
                {/* Share Button */}
                <button
                onClick={() => setShowShareModal(true)}
                className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center bg-gradient-to-r from-orange-500 to-amber-500 active:from-orange-600 active:to-amber-600 rounded-lg sm:rounded-xl text-black transition-all shadow-lg shadow-orange-500/25"
                title="Share">
                  <Share2 size={18} />
                </button>
                
                {/* Session button */}
                <button
                onClick={() => setShowSessionManager(true)}
                className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 border border-zinc-700 rounded-lg sm:rounded-xl text-zinc-300 transition-all"
                title="Save/Load Session">
                  <Save size={18} />
                </button>
                
                {/* Learn Mode button */}
                <button
                onClick={() => setShowLearnMode(true)}
                className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 active:from-cyan-700 active:to-blue-700 rounded-lg sm:rounded-xl text-white transition-all shadow-lg shadow-cyan-500/25"
                title="Learn Sound Design">

                  <GraduationCap size={18} />
                </button>
                
                {/* Emotion to Music button */}
                <button
                onClick={() => setShowEmotionToMusic(true)}
                className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 active:from-purple-700 active:to-pink-700 rounded-lg sm:rounded-xl text-white transition-all shadow-lg shadow-purple-500/25"
                title="Create from Feelings">
                  <Sparkles size={18} />
                </button>
                
                {/* Export button */}
                <button
                onClick={() => setShowExportDialog(true)}
                className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-600 border border-zinc-700 rounded-lg sm:rounded-xl text-zinc-300 transition-all"
                title="Export Audio">
                  <Download size={18} />
                </button>
              </div>
              
              {/* Status LEDs */}
              <div className="flex gap-2 sm:ml-4">
                <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${isPlaying ? 'bg-green-500 shadow-lg shadow-green-500/50 animate-pulse' : 'bg-zinc-700'}`} />
                <div className={`w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full ${params.overdrive > 0.5 ? 'bg-red-500 shadow-lg shadow-red-500/50' : 'bg-zinc-700'}`} />
              </div>
            </div>
            
            {/* Visualizer - Hidden on very small screens */}
            <div className="hidden md:block">
              <Visualizer isPlaying={isPlaying} cutoff={params.cutoff} resonance={params.resonance} />
            </div>
            
            {/* Pattern Library Button Only */}
            <button
            onClick={() => setShowLibrary(true)}
            className="hidden sm:flex items-center gap-1.5 px-3 sm:px-4 py-2 bg-zinc-800 active:bg-zinc-700 border border-zinc-600 rounded-lg sm:rounded-xl text-zinc-300 font-medium text-sm">
              <FolderOpen size={16} />
              <span>Patterns</span>
            </button>
          </div>
          
          {/* Transport Bar - Desktop/Tablet (hidden on mobile, which has sticky bottom bar) */}
          <div className="hidden sm:flex items-center justify-between mb-4 bg-zinc-800/60 rounded-xl px-4 py-2 border border-zinc-700/50">
            <button
            onClick={isPlaying ? stop : start}
            className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold transition-all ${
            isPlaying ?
            'bg-red-600 active:bg-red-500 shadow-lg shadow-red-600/50' :
            'bg-green-600 active:bg-green-500 shadow-lg shadow-green-600/50'}`
            }>
              {isPlaying ? <Square size={22} /> : <Play size={22} className="ml-1" />}
            </button>

            <div className="flex items-center gap-4">
              <span className="text-xs font-bold text-zinc-400">TEMPO</span>
              <input
              type="range"
              min={80}
              max={180}
              value={tempo}
              onChange={(e) => setTempo(Number(e.target.value))}
              className="w-32 accent-orange-500" />
              <span
              className="text-xl font-mono font-bold w-12 text-center"
              style={{ color: activeColor }}>
                {tempo}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <Volume2 size={16} className="text-zinc-400" />
              <Knob
                value={mixer.master}
                onChange={setMasterVolume}
                label=""
                size={40}
                color="#666" />
            </div>
          </div>

          {/* Module Tabs */}
          <div className="mb-4">
            <ModuleTabs
              activeModule={activeModule}
              onModuleChange={setActiveModule}
              moduleStates={moduleStates} />

          </div>
          
          {/* Knobs Section - Single row on all screens */}
          <div className="mb-4 sm:mb-6">
            {/* Waveform Switch - Centered */}
            <div className="flex justify-center mb-3 sm:mb-4">
              <WaveformSwitch
                value={params.waveform}
                onChange={(waveform) => setParams({ waveform })}
                isHighlighted={highlightedParam === 'waveform'} />

            </div>
            
            {/* Knobs - Single row on all screens */}
            <div className="flex justify-center gap-1 sm:gap-6">
              <Knob
                value={params.cutoff}
                onChange={(cutoff) => setParams({ cutoff })}
                label="Cutoff"
                size={46}
                color={activeColor}
                hasAutomation={hasAutomation('cutoff')}
                isHighlighted={highlightedParam === 'cutoff'} />


              <Knob
                value={params.resonance}
                onChange={(resonance) => setParams({ resonance })}
                label="Reso"
                size={46}
                color={activeColor}
                hasAutomation={hasAutomation('resonance')}
                isHighlighted={highlightedParam === 'resonance'} />


              <Knob
                value={params.envMod}
                onChange={(envMod) => setParams({ envMod })}
                label="Env"
                size={46}
                color={activeColor}
                hasAutomation={hasAutomation('envMod')}
                isHighlighted={highlightedParam === 'envMod'} />


              <Knob
                value={params.decay}
                onChange={(decay) => setParams({ decay })}
                label="Decay"
                size={46}
                color={activeColor}
                hasAutomation={hasAutomation('decay')}
                isHighlighted={highlightedParam === 'decay'} />


              <Knob
                value={params.accent}
                onChange={(accent) => setParams({ accent })}
                label="Accent"
                size={46}
                color={activeColor}
                hasAutomation={hasAutomation('accent')}
                isHighlighted={highlightedParam === 'accent'} />


              <Knob
                value={params.overdrive}
                onChange={(overdrive) => setParams({ overdrive })}
                label="Drive"
                size={46}
                color={activeColor}
                hasAutomation={hasAutomation('overdrive')}
                isHighlighted={highlightedParam === 'overdrive'} />


            </div>
          </div>
          
          {/* Divider */}
          <div className="h-px bg-gradient-to-r from-transparent via-zinc-600 to-transparent mb-4" />
          
          {/* View Toggle Tabs */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex gap-1 bg-zinc-800/50 rounded-lg p-1">
              <button
              onClick={() => setViewMode('sequencer')}
              className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all
                  ${viewMode === 'sequencer' ?
              'text-black' :
              'text-zinc-400 hover:text-zinc-200'}`
              }
              style={viewMode === 'sequencer' ? { backgroundColor: activeColor } : {}}>
                <Music size={14} />
                SEQUENCER
              </button>
              <button
              onClick={() => setViewMode('automation')}
              className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-bold transition-all
                  ${viewMode === 'automation' ?
              'text-black' :
              'text-zinc-400 hover:text-zinc-200'}`
              }
              style={viewMode === 'automation' ? { backgroundColor: activeColor } : {}}>
                <Waves size={14} />
                AUTOMATION
                {/* Show indicator if any automation exists */}
                {AUTOMATION_PARAMS.some((p) => hasAutomation(p.id)) && viewMode !== 'automation' &&
                <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
                }
              </button>
            </div>
            
            {viewMode === 'sequencer' &&
            <div className="flex items-center gap-2">
                {/* Mobile only: Patterns button */}
                <button
              onClick={() => setShowLibrary(true)}
              className="sm:hidden flex items-center gap-1 px-2 py-1 bg-zinc-800 active:bg-zinc-700 rounded-lg text-[10px] text-zinc-400">
                  <FolderOpen size={12} />
                  Patterns
                </button>
                
                {/* Transpose controls */}
                <div className="flex items-center gap-0.5 bg-zinc-800 rounded-lg">
                  <button
                onClick={() => transposePattern(-12)}
                className="px-1.5 py-1 hover:bg-zinc-700 rounded-l-lg transition-colors group"
                title="Octave Down">

                    <ChevronDown size={14} className="text-zinc-500 group-hover:text-zinc-300" />
                    <ChevronDown size={14} className="text-zinc-500 group-hover:text-zinc-300 -mt-2" />
                  </button>
                  <button
                onClick={() => transposePattern(-1)}
                className="px-1.5 py-1 hover:bg-zinc-700 transition-colors"
                title="Semitone Down">

                    <ChevronDown size={14} className="text-zinc-400 group-hover:text-zinc-200" />
                  </button>
                  <span className="px-1 text-[10px] text-zinc-500 font-medium">TRANS</span>
                  <button
                onClick={() => transposePattern(1)}
                className="px-1.5 py-1 hover:bg-zinc-700 transition-colors"
                title="Semitone Up">

                    <ChevronUp size={14} className="text-zinc-400 group-hover:text-zinc-200" />
                  </button>
                  <button
                onClick={() => transposePattern(12)}
                className="px-1.5 py-1 hover:bg-zinc-700 rounded-r-lg transition-colors group"
                title="Octave Up">

                    <ChevronUp size={14} className="text-zinc-500 group-hover:text-zinc-300" />
                    <ChevronUp size={14} className="text-zinc-500 group-hover:text-zinc-300 -mt-2" />
                  </button>
                </div>
                
                <button
              onClick={randomizePattern}
              className="flex items-center gap-1.5 px-2 py-1 bg-zinc-800 active:bg-zinc-700 rounded-lg text-[10px] sm:text-xs text-zinc-400"
              title="Random pattern for current channel">
                  <RotateCcw size={12} />
                  Random
                </button>
                
                <button
              onClick={randomizeAllChannels}
              className="flex items-center gap-1.5 px-2 py-1 bg-gradient-to-r from-purple-600 to-pink-600 active:from-purple-700 active:to-pink-700 rounded-lg text-[10px] sm:text-xs text-white font-bold"
              title="Generate random patterns for ALL channels (same scale)">
                  <Shuffle size={12} />
                  <span className="hidden sm:inline">Random All</span>
                  <span className="sm:hidden">All</span>
                </button>
              </div>
            }
          </div>
          
          {/* Sequencer View */}
          {viewMode === 'sequencer' &&
          <>
              {/* Pattern Bank Selector */}
              <div className="mb-3 flex justify-center">
                <PatternSelector
                  bankSize={8}
                  activeIndex={activePatternIndex}
                  onSelect={(i) => setActivePattern(i)}
                  onCopy={(from, to) => copyPattern(from, to)}
                  onClear={(i) => clearPatternSlot(i)}
                  color={activeColor}
                  hasContent={patternBank.map(slot =>
                    slot.pattern.some(s => s.active)
                  )}
                />
              </div>

              {/* Step Sequencer - 2 rows of 8 on mobile */}
              <div className="mb-3 sm:mb-4">
                {/* First row: steps 1-8 */}
                <div className="flex justify-center gap-[2px] sm:gap-1 mb-[2px] sm:mb-1">
                  {pattern.slice(0, 8).map((step, i) =>
                <StepEditor
                  key={i}
                  step={i}
                  data={step}
                  isCurrent={isPlaying && currentStep === i}
                  isSelected={selectedStep === i}
                  onUpdate={(data) => handleStepUpdate(i, data)}
                  onClick={() => setSelectedStep(i)}
                  notes={NOTES} />

                )}
                </div>
                {/* Second row: steps 9-16 */}
                <div className="flex justify-center gap-[2px] sm:gap-1">
                  {pattern.slice(8, 16).map((step, i) =>
                <StepEditor
                  key={i + 8}
                  step={i + 8}
                  data={step}
                  isCurrent={isPlaying && currentStep === i + 8}
                  isSelected={selectedStep === i + 8}
                  onUpdate={(data) => handleStepUpdate(i + 8, data)}
                  onClick={() => setSelectedStep(i + 8)}
                  notes={NOTES} />

                )}
                </div>
              </div>
              
              {/* Step Controls */}
              <div className="bg-zinc-800/50 rounded-lg sm:rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 border border-zinc-700">
                <div className="flex items-center gap-2 mb-2 sm:mb-3">
                  <span className="text-[10px] sm:text-xs font-bold text-zinc-400">STEP {selectedStep !== null ? selectedStep + 1 : '-'}</span>
                  <span className="text-[10px] text-zinc-600 hidden sm:inline">• Tap to edit</span>
                </div>
                <StepControls
                selectedStep={selectedStep}
                stepData={selectedStep !== null ? pattern[selectedStep] : null}
                onUpdate={(data) => selectedStep !== null && handleStepUpdate(selectedStep, data)}
                notes={NOTES}
                onPlayNote={playNote} />
              </div>
            </>
          }
          
          {/* Automation View */}
          {viewMode === 'automation' &&
          <div className="mb-4 sm:mb-6">
              <AutomationPanel
              automation={automation}
              playbackPosition={playbackPosition}
              isPlaying={isPlaying}
              isRecording={false}
              automationEnabled={automationEnabled}
              moduleId={activeModule}
              moduleColor={activeColor}
              moduleName={configs[activeModule].name}
              onToggleAutomationEnabled={toggleAutomationEnabled}
              onToggleRecording={() => {}}
              onSetAutomation={setAutomation}
              onClearAutomation={clearAutomation}
              onClearAll={clearAllAutomation} />

            </div>
          }
          
          {/* Mixer Section */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-zinc-400">MIXER</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    if (mixerMode === 'basic') {
                      // Need audio context to init pro mixer
                      const ctx = getAudioContext();
                      if (!ctx) {
                        // Audio not yet started - start first
                        start().then(() => setMixerMode('pro'));
                        return;
                      }
                      setMixerMode('pro');
                    }
                  }}
                  className={`text-[10px] font-bold px-2 py-0.5 rounded transition-all ${
                    mixerMode === 'pro'
                      ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  {mixerMode === 'basic' ? 'Pro Mixer' : 'PRO'}
                </button>
                <button
                  onClick={() => setShowMixer(!showMixer)}
                  className="text-[10px] text-zinc-500 hover:text-zinc-300"
                >
                  {showMixer ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
            {showMixer && mixerMode === 'basic' && (
              <Mixer
                mixer={mixer}
                onChannelChange={setMixerChannel}
                onMasterChange={setMasterVolume}
                isPlaying={isPlaying}
                drumVolume={drumEngine.drumState.masterVolume}
                drumMute={drumMute}
                onDrumVolumeChange={(vol) => drumEngine.setMasterVolume(vol)}
                onDrumMuteToggle={() => setDrumMute(!drumMute)}
              />
            )}
            {showMixer && mixerMode === 'pro' && (
              <ProMixer
                state={proMixer.proMixerState}
                levels={proMixer.levels}
                drumTrackNames={drumEngine.currentKit.tracks.map(t => t.name)}
                onChannelParam={(channelId, path, value) => proMixer.setChannelParam(channelId, path, value)}
                onAuxParam={(effectId, path, value) => proMixer.setAuxParam(effectId, path, value)}
                onMasterParam={(path, value) => proMixer.setMasterParam(path, value)}
                onReset={proMixer.resetToDefaults}
                onPreset={proMixer.applyPreset}
                onSwitchToBasic={() => setMixerMode('basic')}
              />
            )}
          </div>
          
          {/* Drum Machine */}
          <div className="mb-4">
            <DrumMachine
              currentStep={currentStep}
              isPlaying={isPlaying}
              drumState={drumEngine.drumState}
              currentKit={drumEngine.currentKit}
              pattern={drumEngine.pattern}
              playSound={drumEngine.playSound}
              setKit={drumEngine.setKit}
              toggleStep={drumEngine.toggleStep}
              setChannelMix={drumEngine.setChannelMix}
              setMasterVolume={drumEngine.setMasterVolume}
              setSwing={drumEngine.setSwing}
              setEnabled={drumEngine.setEnabled}
              setPattern={drumEngine.setPattern}
              clearPattern={drumEngine.clearPattern}
              onBpmChange={setTempo}
              setActiveDrumPattern={drumEngine.setActiveDrumPattern}
              copyDrumPattern={drumEngine.copyDrumPattern}
              clearDrumPatternSlot={drumEngine.clearDrumPatternSlot} />

          </div>

          {/* Arrangement Grid */}
          <div className="mb-4">
            <ArrangementGrid
              arrangement={arrangement}
              currentBlockIndex={currentBlockIndex}
              isPlaying={isPlaying}
              onSetPlaybackMode={setPlaybackMode}
              onSetLoop={setArrangementLoop}
              onSetCell={setArrangementCell}
              onAddBlock={addArrangementBlock}
              onRemoveBlock={removeArrangementBlock}
              onCopyBlock={copyArrangementBlock}
            />
          </div>

          {/* Modulation Panel */}
          <ModulationPanel
            modulators={modulators}
            onModulatorChange={setModulator} />

          
          {/* Pattern Buttons - Horizontal Scroll */}
          <div className="border-t border-zinc-800 pt-3">
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <span className="text-[10px] sm:text-xs font-bold text-zinc-500 whitespace-nowrap">PATTERNS</span>
              {CLASSIC_PATTERNS.map((p, i) =>
              <button
              key={p.id}
              onClick={() => handleLoadPattern(p.steps, p.tempo)}
              className="flex items-center gap-1 px-2 py-1.5 bg-zinc-800 active:bg-zinc-700 border border-zinc-700 rounded-lg text-[10px] sm:text-xs flex-shrink-0">

                  <span className="w-4 h-4 flex items-center justify-center bg-orange-500/20 text-orange-400 rounded font-bold text-[9px]">
                    {i + 1}
                  </span>
                  <span className="text-zinc-300 font-medium whitespace-nowrap">
                    {p.name}
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Signature Footer */}
        <div className="mt-4 sm:mt-6 flex flex-col items-center">
          <div
          className="px-4 sm:px-6 py-2 sm:py-3 rounded-lg relative overflow-hidden"
          style={{
            background: 'linear-gradient(145deg, #2a2a2a 0%, #1a1a1a 50%, #2a2a2a 100%)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.1), 0 4px 12px rgba(0,0,0,0.5)'
          }}>

            <div className="relative flex items-center gap-2 sm:gap-3">
              <span className="text-[10px] sm:text-xs text-zinc-500">Created by</span>
              <a
              href="https://www.linkedin.com/in/shaiwhisperer/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 sm:gap-2">

                <span
                className="text-sm sm:text-lg font-bold tracking-wide"
                style={{
                  background: 'linear-gradient(135deg, #d4a574 0%, #f5d9b8 25%, #c9a227 50%, #f5d9b8 75%, #d4a574 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent'
                }}>

                  ShAI Bernard Lelchuk
                </span>
                <Linkedin size={14} className="text-[#d4a574]" />
              </a>
            </div>
          </div>
          
          <p className="mt-2 text-[10px] sm:text-xs text-zinc-600 text-center px-4">
            3-Layer Acid Synthesis • Multi-Module • Mobile-Friendly
          </p>
        </div>
      </div>
      
      {/* Mobile Floating Play Bar */}
      <div className="fixed bottom-0 left-0 right-0 sm:hidden bg-zinc-900/95 backdrop-blur-sm border-t border-zinc-800 p-3 z-40">
        <div className="flex items-center justify-between gap-3 max-w-lg mx-auto">
          <button
          onClick={isPlaying ? stop : start}
          className={`w-14 h-14 rounded-xl flex items-center justify-center font-bold transition-all flex-shrink-0 ${
          isPlaying ?
          'bg-red-600 active:bg-red-500 shadow-lg shadow-red-600/50' :
          'bg-green-600 active:bg-green-500 shadow-lg shadow-green-600/50'}`
          }>

            {isPlaying ? <Square size={28} /> : <Play size={28} className="ml-1" />}
          </button>
          
          <div className="flex-1 flex items-center gap-2">
            <input
            type="range"
            min={80}
            max={180}
            value={tempo}
            onChange={(e) => setTempo(Number(e.target.value))}
            className="flex-1 accent-orange-500 h-2" />

            <span className="text-lg font-mono font-bold w-10 text-center" style={{ color: activeColor }}>
              {tempo}
            </span>
          </div>
          
          <div className="flex items-center gap-1 flex-shrink-0">
            <Volume2 size={16} className="text-zinc-500" />
            <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={mixer.master}
            onChange={(e) => setMasterVolume(Number(e.target.value))}
            className="w-16 accent-zinc-500 h-2" />

          </div>
        </div>
      </div>
      
      {/* Share Modal */}
      {showShareModal &&
      <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm">
          <div
        className="w-full max-w-lg rounded-xl sm:rounded-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
        style={{
          background: 'linear-gradient(180deg, #2a2a2a 0%, #1a1a1a 100%)'
        }}>

            <div className="flex items-center justify-between p-3 sm:p-4 border-b border-zinc-700">
              <div className="flex items-center gap-2 sm:gap-3">
                <Share2 className="text-orange-500" size={20} />
                <h2 className="text-lg sm:text-xl font-bold text-white">Share Your Acid</h2>
              </div>
              <button onClick={() => setShowShareModal(false)} className="p-2 active:bg-zinc-700 rounded-lg">
                <X size={20} className="text-zinc-400" />
              </button>
            </div>
            
            <div className="p-4 sm:p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-zinc-400 mb-2">Your viral message</label>
                <div className="relative">
                  <textarea
                value={shareMessage}
                onChange={(e) => setShareMessage(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-sm resize-none focus:outline-none focus:border-orange-500" />

                  <button
                onClick={generateNewHook}
                className="absolute bottom-2 right-2 px-2 py-1 bg-zinc-700 active:bg-zinc-600 rounded text-[10px] text-zinc-300">
                    🎲 New
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2 sm:gap-3">
                <a
              href={getShareUrl('twitter')}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-3 py-2.5 bg-black border border-zinc-700 rounded-xl text-white font-medium text-sm">
                  <Twitter size={18} />
                  Twitter
                </a>
                
                <a
              href={getShareUrl('facebook')}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-3 py-2.5 bg-[#1877f2] rounded-xl text-white font-medium text-sm">
                  <Facebook size={18} />
                  Facebook
                </a>
                
                <a
              href={getShareUrl('linkedin')}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-3 py-2.5 bg-[#0a66c2] rounded-xl text-white font-medium text-sm">
                  <Linkedin size={18} />
                  LinkedIn
                </a>
                
                <button
              onClick={copyToClipboard}
              className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl font-medium text-sm transition-all ${
              copySuccess ?
              'bg-green-500 text-black' :
              'bg-zinc-700 text-white active:bg-zinc-600'}`
              }>

                  <Link2 size={18} />
                  {copySuccess ? 'Copied!' : 'Copy'}
                </button>
              </div>
              
              <div className="mt-4 p-3 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                <p className="text-xs sm:text-sm text-orange-400">
                  <span className="font-bold">🚀 Tip:</span> Record your screen while playing for maximum engagement!
                </p>
              </div>
            </div>
          </div>
        </div>
      }
      
      {/* Pattern Library Modal */}
      <PatternLibrary
        currentPattern={pattern}
        currentTempo={tempo}
        onLoadPattern={handleLoadPattern}
        isOpen={showLibrary}
        onClose={() => setShowLibrary(false)} />

      {/* Session Manager Modal */}
      <SessionManager
        isOpen={showSessionManager}
        onClose={() => setShowSessionManager(false)}
        onSave={(name: string) => {
          const session = saveSession(name);
          // Include pro mixer state if active
          if (mixerMode === 'pro') {
            session.proMixer = proMixer.saveState();
          }
          return session;
        }}
        onLoad={(session) => {
          loadSession(session);
          // Restore pro mixer state if present
          if (session.proMixer) {
            proMixer.loadState(session.proMixer);
            setMixerMode('pro');
          }
        }}
        drumState={drumEngine.drumState}
        onLoadDrumState={(ds) => {
          drumEngine.loadState(ds);
        }} />


      {/* Export Dialog */}
      <ExportDialog
        isOpen={showExportDialog}
        onClose={() => setShowExportDialog(false)}
        onExport={(loops, format, onProgress) =>
          exportAudio(
            { loops, format, params, pattern, modulators, automation, automationEnabled },
            onProgress
          )
        }
        tempo={tempo} />

      {/* Emotion to Music Dialog */}
      <EmotionToMusic
        isOpen={showEmotionToMusic}
        onClose={() => setShowEmotionToMusic(false)}
        onApply={handleEmotionApply}
        isPlaying={isPlaying}
        onStop={stop}
        onPreview={(patterns, params, newTempo) => {
          // Apply patterns to all modules for preview
          setAllPatterns(patterns);
          (Object.keys(params) as ModuleId[]).forEach((id) => {
            setModuleParams(id, params[id]);
          });
          setTempo(newTempo);
          // Start playback
          if (!isPlaying) start();
        }} />

      {/* Learn Mode */}
      <LearnMode
        isOpen={showLearnMode}
        onClose={() => {
          setShowLearnMode(false);
          setHighlightedParam(null);
        }}
        onHighlightParam={setHighlightedParam} />




    </div>);

}