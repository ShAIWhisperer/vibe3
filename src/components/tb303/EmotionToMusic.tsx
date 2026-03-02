import { useState } from 'react';
import { X, Sparkles, Loader2, Heart, Moon, Smile, CloudSun, Palette, Star, RefreshCw, Play, Check, Music, Waves, Zap, Square } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { Step, TB303Params } from '@/hooks/use-tb303-engine';
import type { ModuleId } from '@/hooks/use-multi-synth-engine';
import {
  type MultiModuleAnalysis,
  generateMultiModulePatterns,
  generateMultiModuleParams,
  GUIDED_PROMPTS
} from '@/utils/emotion-to-music';

interface EmotionToMusicProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (steps: Step[], params: Partial<TB303Params> & {
    _multiPatterns?: Record<ModuleId, Step[]>;
    _multiParams?: Record<ModuleId, Partial<TB303Params>>;
  }) => void;
  onPreview: (patterns: Record<ModuleId, Step[]>, params: Record<ModuleId, Partial<TB303Params>>, tempo: number) => void;
  isPlaying?: boolean;
  onStop?: () => void;
}

const PROMPT_ICONS: Record<string, typeof Heart> = {
  feeling: Heart,
  dream: Moon,
  memory: Smile,
  weather: CloudSun,
  color: Palette,
  wish: Star
};

const MODULE_ICONS: Record<ModuleId, typeof Music> = {
  bass: Waves,
  lead: Music,
  arp: Zap
};

const MODULE_COLORS: Record<ModuleId, string> = {
  bass: '#f97316',
  lead: '#8b5cf6',
  arp: '#06b6d4'
};

// Helper to convert MIDI note to label
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
function getNoteLabel(midiNote: number): string {
  const octave = Math.floor(midiNote / 12) - 1;
  const noteName = NOTE_NAMES[midiNote % 12];
  return `${noteName}${octave}`;
}

// Parameter bar component
function ParamBar({ label, value, color }: {label: string;value: number;color: string;}) {
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span className="text-zinc-500">{label}</span>
        <span className="text-zinc-400">{Math.round(value * 100)}%</span>
      </div>
      <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
        <div
        className="h-full rounded-full transition-all"
        style={{ width: `${value * 100}%`, backgroundColor: color }} />

      </div>
    </div>);

}

// Security constants
const MAX_TEXT_LENGTH = 280;
const MIN_TEXT_LENGTH = 3;

// Session token for GDPR-compliant rate limiting
const SESSION_TOKEN_KEY = 'tb303_emotion_session';

function getSessionToken(): string {
  let token = localStorage.getItem(SESSION_TOKEN_KEY);
  if (!token) {
    token = crypto.randomUUID();
    localStorage.setItem(SESSION_TOKEN_KEY, token);
  }
  return token;
}

type InputMode = 'free' | 'guided';
type ProcessingState = 'idle' | 'analyzing' | 'generating' | 'ready' | 'error';

export function EmotionToMusic({ isOpen, onClose, onApply, onPreview, isPlaying, onStop }: EmotionToMusicProps) {
  const [inputMode, setInputMode] = useState<InputMode>('free');
  const [text, setText] = useState('');
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const [state, setState] = useState<ProcessingState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<MultiModuleAnalysis | null>(null);
  const [generatedPatterns, setGeneratedPatterns] = useState<Record<ModuleId, Step[]> | null>(null);
  const [generatedParams, setGeneratedParams] = useState<Record<ModuleId, Partial<TB303Params>> | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);

  const resetState = () => {
    setState('idle');
    setError(null);
    setAnalysis(null);
    setGeneratedPatterns(null);
    setGeneratedParams(null);
  };

  const handlePromptSelect = (promptId: string) => {
    setSelectedPrompt(promptId);
    setText('');
    resetState();
  };

  const getCurrentPrompt = () => {
    if (inputMode === 'free') return null;
    return GUIDED_PROMPTS.find((p) => p.id === selectedPrompt);
  };

  const analyzeAndGenerate = async () => {
    const trimmedText = text.trim();

    if (!trimmedText) {
      setError('Please share your thoughts first');
      return;
    }

    if (trimmedText.length < MIN_TEXT_LENGTH) {
      setError(`Please write at least ${MIN_TEXT_LENGTH} characters`);
      return;
    }

    if (trimmedText.length > MAX_TEXT_LENGTH) {
      setError(`Please keep it under ${MAX_TEXT_LENGTH} characters`);
      return;
    }

    if (!supabase) {
      setError('Cloud Backend not available. Using local generation instead.');
      // Fall back to random generation
      setState('generating');
      try {
        const { generateRandomMultiChannel } = await import('@/utils/emotion-to-music');
        const result = generateRandomMultiChannel();
        setGeneratedPatterns(result.patterns);
        setGeneratedParams(result.params);
        setAnalysis({
          emotions: { primary: 'joy', secondary: 'surprise', intensity: 0.5 },
          description: 'Randomly generated patterns',
          global: { tempo: 128, scale: 'minor', rootNote: 36 },
          bass: { octave: 1, rhythmDensity: 0.35, accentAmount: 0.4, slideAmount: 0.15, movement: 'steady', synth: { cutoff: 0.3, resonance: 0.5, envMod: 0.4, decay: 0.6, accent: 0.5, overdrive: 0.4 } },
          lead: { octave: 2, rhythmDensity: 0.55, accentAmount: 0.4, slideAmount: 0.3, movement: 'stepwise', synth: { cutoff: 0.6, resonance: 0.6, envMod: 0.6, decay: 0.4, accent: 0.4, overdrive: 0.15 } },
          arp: { octave: 3, rhythmDensity: 0.75, accentAmount: 0.2, slideAmount: 0.08, movement: 'arpeggio-up', synth: { cutoff: 0.7, resonance: 0.4, envMod: 0.4, decay: 0.3, accent: 0.3, overdrive: 0.1 } }
        });
        setState('ready');
      } catch {
        setError('Generation failed. Please try again.');
        setState('error');
      }
      return;
    }

    setError(null);
    setState('analyzing');

    try {
      const sessionToken = getSessionToken();

      const { data, error: fnError } = await supabase.functions.invoke('emotion-to-music', {
        body: { text: trimmedText, sessionToken }
      });

      if (fnError) {
        console.error('Edge function error:', fnError);
        throw new Error('Unable to analyze right now. Try the random generator instead!');
      }

      if (data?.error) {
        throw new Error(data.error);
      }

      // Validate multi-module response
      if (!data?.emotions || !data?.global || !data?.bass || !data?.lead || !data?.arp) {
        console.error('Invalid response structure:', data);
        throw new Error('Unexpected response. Try again or use random generation.');
      }

      const multiAnalysis = data as MultiModuleAnalysis;
      setAnalysis(multiAnalysis);

      setState('generating');
      await new Promise((resolve) => setTimeout(resolve, 500));

      const patterns = generateMultiModulePatterns(multiAnalysis);
      const params = generateMultiModuleParams(multiAnalysis);

      setGeneratedPatterns(patterns);
      setGeneratedParams(params);
      setState('ready');

    } catch (err) {
      console.error('Emotion analysis error:', err);
      const message = err instanceof Error ? err.message : 'Something went wrong';
      
      // Provide friendly error messages
      let userMessage = message;
      if (message.includes('non-2xx') || message.includes('fetch') || message.includes('network') || message.includes('Failed to fetch')) {
        userMessage = 'Connection issue. Check your internet and try again.';
      } else if (message.includes('rate limit') || message.includes('too many')) {
        userMessage = 'Too many requests. Please wait a moment and try again.';
      } else if (message.includes('timeout')) {
        userMessage = 'Request timed out. Please try again.';
      }
      
      setError(userMessage);
      setState('error');
    }
  };

  const handleRegenerate = () => {
    if (analysis) {
      setState('generating');
      setTimeout(() => {
        const patterns = generateMultiModulePatterns(analysis);
        const params = generateMultiModuleParams(analysis);
        setGeneratedPatterns(patterns);
        setGeneratedParams(params);
        setState('ready');
      }, 300);
    }
  };

  const handlePreview = () => {
    if (generatedPatterns && generatedParams && analysis) {
      if (isPreviewing && onStop) {
        // Stop preview
        onStop();
        setIsPreviewing(false);
      } else {
        // Start preview - apply patterns first then play
        onPreview(generatedPatterns, generatedParams, analysis.global.tempo);
        setIsPreviewing(true);
      }
    }
  };

  const handleApply = () => {
    if (generatedPatterns && generatedParams && analysis) {
      // Stop preview if playing
      if (isPreviewing && onStop) {
        onStop();
        setIsPreviewing(false);
      }
      // Pass multi-module data through special properties
      onApply(generatedPatterns.lead, {
        tempo: analysis.global.tempo,
        _multiPatterns: generatedPatterns,
        _multiParams: generatedParams
      });
      onClose();
    }
  };

  const handleClose = () => {
    // Stop preview if playing
    if (isPreviewing && onStop) {
      onStop();
      setIsPreviewing(false);
    }
    resetState();
    setText('');
    setSelectedPrompt(null);
    onClose();
  };

  if (!isOpen) return null;

  const currentPrompt = getCurrentPrompt();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-700 rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800 sticky top-0 bg-zinc-900 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Sparkles size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Emotions → Music</h2>
              <p className="text-xs text-zinc-500">3-layer acid from your feelings</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 hover:bg-zinc-800 rounded-lg transition-colors">
            <X size={20} className="text-zinc-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Mode Toggle */}
          <div className="flex gap-2 mb-4">
            <button
            onClick={() => {setInputMode('free');resetState();}}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
            inputMode === 'free' ?
            'bg-purple-500/20 text-purple-300 border border-purple-500/50' :
            'bg-zinc-800 text-zinc-400 border border-transparent hover:bg-zinc-700'}`
            }>

              ✍️ Free Write
            </button>
            <button
            onClick={() => {setInputMode('guided');resetState();}}
            className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
            inputMode === 'guided' ?
            'bg-purple-500/20 text-purple-300 border border-purple-500/50' :
            'bg-zinc-800 text-zinc-400 border border-transparent hover:bg-zinc-700'}`
            }>

              💡 Guided Prompts
            </button>
          </div>

          {/* Guided Prompts */}
          {inputMode === 'guided' && state === 'idle' &&
          <div className="grid grid-cols-2 gap-2 mb-4">
              {GUIDED_PROMPTS.map((prompt) => {
              const Icon = PROMPT_ICONS[prompt.id] || Sparkles;
              return (
                <button
                key={prompt.id}
                onClick={() => handlePromptSelect(prompt.id)}
                className={`p-3 rounded-xl text-left transition-all ${
                selectedPrompt === prompt.id ?
                'bg-purple-500/20 border-purple-500/50 border' :
                'bg-zinc-800/50 border border-zinc-700 hover:bg-zinc-800 hover:border-zinc-600'}`
                }>

                    <div className="flex items-center gap-2 mb-1">
                      <Icon size={16} className={selectedPrompt === prompt.id ? 'text-purple-400' : 'text-zinc-500'} />
                      <span className="text-xs font-medium text-zinc-300">{prompt.icon}</span>
                    </div>
                    <p className="text-xs text-zinc-400 line-clamp-2">{prompt.question}</p>
                  </button>);

            })}
            </div>
          }

          {/* Text Input */}
          {(inputMode === 'free' || selectedPrompt) && state !== 'ready' &&
          <div className="mb-4">
              {currentPrompt &&
            <p className="text-sm text-purple-300 mb-2 font-medium">{currentPrompt.question}</p>
            }
              <textarea
            value={text}
            onChange={(e) => {
              const newText = e.target.value.slice(0, MAX_TEXT_LENGTH);
              setText(newText);
              if (error) setError(null);
            }}
            placeholder={currentPrompt?.placeholder || "Share a short thought, feeling, or dream... (keep it brief!)"}
            className="w-full h-28 p-4 bg-zinc-800/50 border border-zinc-700 rounded-xl text-white placeholder:text-zinc-600 resize-none focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/25 transition-all"
            disabled={state === 'analyzing' || state === 'generating'}
            maxLength={MAX_TEXT_LENGTH} />

              <div className="flex justify-between items-center mt-1">
                <p className="text-xs text-zinc-600">
                  {text.length < MIN_TEXT_LENGTH && text.length > 0 &&
                <span className="text-amber-500">Write a bit more...</span>
                }
                </p>
                <p className={`text-xs ${text.length > MAX_TEXT_LENGTH * 0.9 ? 'text-amber-500' : 'text-zinc-600'}`}>
                  {text.length}/{MAX_TEXT_LENGTH}
                </p>
              </div>
            </div>
          }

          {/* Error Message */}
          {error &&
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
              <p className="text-sm text-red-400">{error}</p>
            </div>
          }

          {/* Processing State */}
          {(state === 'analyzing' || state === 'generating') &&
          <div className="mb-4 p-6 bg-zinc-800/30 rounded-xl flex flex-col items-center justify-center">
              <div className="relative mb-4">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 animate-pulse" />
                <Loader2 className="absolute inset-0 m-auto w-8 h-8 text-white animate-spin" />
              </div>
              <p className="text-sm text-zinc-300 font-medium">
                {state === 'analyzing' ? 'Understanding your emotions...' : 'Creating 3-layer acid track...'}
              </p>
              <p className="text-xs text-zinc-500 mt-1">
                {state === 'analyzing' ? 'AI is choosing the perfect scale, tempo & sounds' : 'Generating Bass, Lead & Arp patterns'}
              </p>
            </div>
          }

          {/* Results */}
          {state === 'ready' && analysis && generatedPatterns &&
          <div className="mb-4">
              {/* Emotion & Global Settings */}
              <div className="p-4 bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-xl mb-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs text-purple-400 font-medium uppercase tracking-wider mb-1">Detected Mood</p>
                    <p className="text-lg font-bold text-white capitalize">
                      {analysis.emotions.primary}
                      {analysis.emotions.secondary &&
                    <span className="text-zinc-400 font-normal"> + {analysis.emotions.secondary}</span>
                    }
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-zinc-500">Tempo</p>
                    <p className="text-xl font-bold text-orange-400">{analysis.global.tempo} BPM</p>
                  </div>
                </div>
                <p className="text-sm text-zinc-300 italic mb-3">"{analysis.description}"</p>

                {/* Global Settings */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-zinc-800/50 rounded-lg p-2 text-center">
                    <p className="text-[10px] text-zinc-500 uppercase">Scale</p>
                    <p className="text-sm font-bold text-white capitalize">{analysis.global.scale}</p>
                  </div>
                  <div className="bg-zinc-800/50 rounded-lg p-2 text-center">
                    <p className="text-[10px] text-zinc-500 uppercase">Root Note</p>
                    <p className="text-sm font-bold text-white">{getNoteLabel(analysis.global.rootNote)}</p>
                  </div>
                </div>
              </div>

              {/* Module Previews */}
              <div className="space-y-3">
                {(['bass', 'lead', 'arp'] as ModuleId[]).map((id) => {
                const Icon = MODULE_ICONS[id];
                const color = MODULE_COLORS[id];
                const pattern = generatedPatterns[id];
                const activeSteps = pattern.filter((s) => s.active).length;
                const mod = analysis[id];

                return (
                  <div key={id} className="bg-zinc-800/30 rounded-xl p-3 border border-zinc-700/50">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${color}20` }}>
                            <Icon size={14} style={{ color }} />
                          </div>
                          <span className="text-sm font-bold text-white capitalize">{id}</span>
                          <span className="text-xs text-zinc-500">Octave {mod.octave}</span>
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-700 text-zinc-300">
                          {activeSteps} steps
                        </span>
                      </div>

                      {/* Mini pattern preview */}
                      <div className="flex gap-0.5 mb-2">
                        {pattern.map((step, i) =>
                      <div
                      key={i}
                      className="flex-1 h-3 rounded-sm transition-all"
                      style={{
                        backgroundColor: step.active ? color : '#27272a',
                        opacity: step.active ? step.accent ? 1 : 0.7 : 0.3
                      }} />

                      )}
                      </div>

                      {/* Synth params */}
                      <div className="grid grid-cols-3 gap-2">
                        <ParamBar label="Cutoff" value={mod.synth.cutoff} color={color} />
                        <ParamBar label="Reso" value={mod.synth.resonance} color={color} />
                        <ParamBar label="Env" value={mod.synth.envMod} color={color} />
                      </div>
                    </div>);

              })}
              </div>
            </div>
          }

          {/* Actions */}
          <div className="flex gap-2">
            {state === 'idle' &&
            <button
            onClick={analyzeAndGenerate}
            disabled={!text.trim() || text.length < MIN_TEXT_LENGTH}
            className="flex-1 py-3 px-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-zinc-700 disabled:to-zinc-700 disabled:text-zinc-500 rounded-xl text-white font-bold transition-all flex items-center justify-center gap-2">

                <Sparkles size={18} />
                Create 3-Layer Music
              </button>
            }

            {state === 'ready' &&
            <>
                <button
              onClick={handleRegenerate}
              className="py-3 px-4 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-white font-medium transition-all flex items-center justify-center gap-2">

                  <RefreshCw size={16} />
                  Regenerate
                </button>
                <button
              onClick={handlePreview}
              className={`py-3 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                isPreviewing 
                  ? 'bg-orange-500 hover:bg-orange-400 text-black' 
                  : 'bg-zinc-800 hover:bg-zinc-700 text-white'
              }`}>

                  {isPreviewing ? <Square size={16} /> : <Play size={16} />}
                  {isPreviewing ? 'Stop' : 'Preview'}
                </button>
                <button
              onClick={handleApply}
              className="flex-1 py-3 px-4 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 rounded-xl text-white font-bold transition-all flex items-center justify-center gap-2">

                  <Check size={18} />
                  Apply All
                </button>
              </>
            }

            {state === 'error' &&
            <button
            onClick={() => {resetState();}}
            className="flex-1 py-3 px-4 bg-zinc-800 hover:bg-zinc-700 rounded-xl text-white font-medium transition-all">

                Try Again
              </button>
            }
          </div>
        </div>
      </div>
    </div>);

}