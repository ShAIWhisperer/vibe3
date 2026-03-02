// Interactive Learning Center - Floating Widget Design
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  GraduationCap, X, ChevronRight, ChevronLeft,
  Waves, SlidersHorizontal, Clock, Wand2, LineChart,
  Lightbulb, Sparkles, Music, Zap, Heart, Globe, Check,
  GripHorizontal } from
'lucide-react';
import {
  type Language,
  LANGUAGE_NAMES,
  LANGUAGE_FLAGS,
  isRTL,
  getTranslation } from
'@/utils/learn-translations';

export type LessonId =
'oscillators' |
'filters' |
'envelopes' |
'resonance' |
'modulation' |
'automation' |
'accents' |
'slides';

export interface LessonMeta {
  id: LessonId;
  icon: React.ReactNode;
  color: string;
  highlightParams: (string | null)[];
}

// Lesson metadata (icons, colors, highlight params)
export const LESSON_META: LessonMeta[] = [
{
  id: 'oscillators',
  icon: <Waves size={20} />,
  color: '#f97316',
  highlightParams: [null, 'waveform', 'waveform', null]
},
{
  id: 'filters',
  icon: <SlidersHorizontal size={20} />,
  color: '#eab308',
  highlightParams: [null, 'cutoff', 'cutoff', 'cutoff']
},
{
  id: 'resonance',
  icon: <Zap size={20} />,
  color: '#22c55e',
  highlightParams: [null, 'resonance', 'resonance', 'resonance']
},
{
  id: 'envelopes',
  icon: <Clock size={20} />,
  color: '#3b82f6',
  highlightParams: [null, 'envMod', 'decay', null]
},
{
  id: 'accents',
  icon: <Sparkles size={20} />,
  color: '#ec4899',
  highlightParams: [null, 'accent', null, null]
},
{
  id: 'slides',
  icon: <Music size={20} />,
  color: '#8b5cf6',
  highlightParams: [null, null, null, null]
},
{
  id: 'modulation',
  icon: <Wand2 size={20} />,
  color: '#f59e0b',
  highlightParams: [null, null, null, null]
},
{
  id: 'automation',
  icon: <LineChart size={20} />,
  color: '#06b6d4',
  highlightParams: [null, null, null, null]
}];


interface LearnModeProps {
  isOpen: boolean;
  onClose: () => void;
  onHighlightParam?: (param: string | null) => void;
  currentLesson?: LessonId;
  onSelectLesson?: (lesson: LessonId) => void;
}

export function LearnMode({
  isOpen,
  onClose,
  onHighlightParam,
  currentLesson: externalLesson,
  onSelectLesson
}: LearnModeProps) {
  const [language, setLanguage] = useState<Language>('en');
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState<LessonId | null>(externalLesson || null);
  const [currentStep, setCurrentStep] = useState(0);
  const [completedLessons, setCompletedLessons] = useState<Set<LessonId>>(new Set());
  const [isMinimized, setIsMinimized] = useState(false);

  // Dragging state
  const [position, setPosition] = useState({ x: window.innerWidth - 400, y: window.innerHeight - 520 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const widgetRef = useRef<HTMLDivElement>(null);
  const langMenuRef = useRef<HTMLDivElement>(null);

  const t = getTranslation(language);
  const rtl = isRTL(language);

  const lessonMeta = selectedLesson ? LESSON_META.find((l) => l.id === selectedLesson) : null;
  const lessonTranslation = selectedLesson ? t.lessons[selectedLesson] : null;
  const step = lessonTranslation?.steps[currentStep];

  // Handle dragging
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (widgetRef.current) {
      const rect = widgetRef.current.getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
      setIsDragging(true);
    }
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging) return;

      const widgetWidth = isMinimized ? 200 : 380;
      const widgetHeight = isMinimized ? 48 : 500;

      // Calculate new position, keeping widget within viewport
      let newX = e.clientX - dragOffset.x;
      let newY = e.clientY - dragOffset.y;

      // Constrain to viewport
      newX = Math.max(0, Math.min(newX, window.innerWidth - widgetWidth));
      newY = Math.max(0, Math.min(newY, window.innerHeight - widgetHeight));

      setPosition({ x: newX, y: newY });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
    };
  }, [isDragging, dragOffset, isMinimized]);

  // Close language menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (langMenuRef.current && !langMenuRef.current.contains(e.target as Node)) {
        setShowLanguageMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Reset position on window resize
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => ({
        x: Math.min(prev.x, window.innerWidth - (isMinimized ? 200 : 380)),
        y: Math.min(prev.y, window.innerHeight - (isMinimized ? 48 : 500))
      }));
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isMinimized]);

  const handleSelectLesson = useCallback((lessonId: LessonId) => {
    setSelectedLesson(lessonId);
    setCurrentStep(0);
    onSelectLesson?.(lessonId);

    const meta = LESSON_META.find((l) => l.id === lessonId);
    if (meta?.highlightParams[0]) {
      onHighlightParam?.(meta.highlightParams[0]);
    }
  }, [onSelectLesson, onHighlightParam]);

  const handleNextStep = useCallback(() => {
    if (!lessonMeta || !lessonTranslation) return;

    if (currentStep < lessonTranslation.steps.length - 1) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);

      const highlightParam = lessonMeta.highlightParams[nextStep];
      onHighlightParam?.(highlightParam || null);
    } else {
      // Complete lesson
      setCompletedLessons((prev) => new Set([...prev, lessonMeta.id]));
      setSelectedLesson(null);
      setCurrentStep(0);
      onHighlightParam?.(null);
    }
  }, [currentStep, lessonMeta, lessonTranslation, onHighlightParam]);

  const handlePrevStep = useCallback(() => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);

      const highlightParam = lessonMeta?.highlightParams[prevStep];
      onHighlightParam?.(highlightParam || null);
    }
  }, [currentStep, lessonMeta, onHighlightParam]);

  const handleBack = useCallback(() => {
    setSelectedLesson(null);
    setCurrentStep(0);
    onHighlightParam?.(null);
  }, [onHighlightParam]);

  if (!isOpen) return null;

  // Minimized view
  if (isMinimized) {
    return (
      <div
      ref={widgetRef}
      className="fixed z-50"
      style={{ left: position.x, top: position.y }}
      dir={rtl ? 'rtl' : 'ltr'}>

        <div className="flex items-center gap-1 rounded-2xl bg-gradient-to-r from-purple-600 to-pink-600 shadow-2xl shadow-purple-500/30 overflow-hidden">
          {/* Drag handle */}
          <div
          onMouseDown={handleMouseDown}
          className="px-2 py-3 cursor-grab active:cursor-grabbing hover:bg-white/10 transition-colors">

            <GripHorizontal size={16} className="text-white/70" />
          </div>
          <button
          onClick={() => setIsMinimized(false)}
          className="flex items-center gap-2 pr-4 py-3 hover:bg-white/10 transition-colors">

            <GraduationCap size={18} className="text-white" />
            <span className="text-white font-bold text-sm">{t.ui.title}</span>
          </button>
        </div>
      </div>);

  }

  return (
    <div
    ref={widgetRef}
    className="fixed z-50 w-[380px] max-h-[500px] overflow-hidden"
    style={{ left: position.x, top: position.y }}
    dir={rtl ? 'rtl' : 'ltr'}>

      <div className="rounded-2xl bg-zinc-900/95 backdrop-blur-xl border border-zinc-700/50 shadow-2xl shadow-black/50 overflow-hidden">
        {/* Header with drag handle */}
        <div className="flex items-center justify-between p-3 border-b border-zinc-800 bg-gradient-to-r from-purple-500/10 to-pink-500/10">
          <div className="flex items-center gap-2">
            {/* Drag handle */}
            <div
            onMouseDown={handleMouseDown}
            className="p-1 rounded cursor-grab active:cursor-grabbing hover:bg-zinc-700/50 transition-colors"
            title="Drag to move">

              <GripHorizontal size={16} className="text-zinc-500" />
            </div>
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <GraduationCap size={16} className="text-white" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">{t.ui.title}</h2>
              <p className="text-[10px] text-zinc-400">{t.ui.subtitle}</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            {/* Language selector */}
            <div ref={langMenuRef} className="relative">
              <button
              onClick={() => setShowLanguageMenu(!showLanguageMenu)}
              className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors flex items-center gap-1">

                <Globe size={14} />
                <span className="text-xs">{LANGUAGE_FLAGS[language]}</span>
              </button>
              {showLanguageMenu &&
              <div className="absolute top-full mt-1 right-0 bg-zinc-800 rounded-lg border border-zinc-700 shadow-xl overflow-hidden z-50">
                  {(Object.keys(LANGUAGE_NAMES) as Language[]).map((lang) =>
                <button
                key={lang}
                onClick={() => {
                  setLanguage(lang);
                  setShowLanguageMenu(false);
                }}
                className={`flex items-center gap-2 w-full px-3 py-2 text-xs hover:bg-zinc-700 transition-colors ${
                language === lang ? 'text-white bg-zinc-700' : 'text-zinc-300'}`
                }>

                      <span>{LANGUAGE_FLAGS[lang]}</span>
                      <span>{LANGUAGE_NAMES[lang]}</span>
                      {language === lang && <Check size={12} className="ml-auto text-green-400" />}
                    </button>
                )}
                </div>
              }
            </div>
            {/* Minimize */}
            <button
            onClick={() => setIsMinimized(true)}
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors"
            title="Minimize">

              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M4 12h16" />
              </svg>
            </button>
            {/* Close */}
            <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-zinc-800 text-zinc-400 hover:text-white transition-colors">

              <X size={14} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[400px] scrollbar-thin scrollbar-thumb-zinc-700">
          {!selectedLesson ?
          // Lesson Selection
          <div className="p-3">
              {/* Welcome */}
              <div className="mb-4 p-3 rounded-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <Heart size={14} className="text-pink-400" />
                  <span className="font-bold text-white text-sm">{t.ui.welcome}</span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  {t.ui.welcomeMessage}
                </p>
              </div>

              {/* Progress */}
              <div className="mb-3 flex items-center gap-2">
                <span className="text-[10px] text-zinc-500">{t.ui.progress}:</span>
                <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all"
                style={{ width: `${completedLessons.size / LESSON_META.length * 100}%` }} />

                </div>
                <span className="text-[10px] text-zinc-400">
                  {completedLessons.size}/{LESSON_META.length}
                </span>
              </div>

              {/* Lesson Grid */}
              <div className="grid grid-cols-2 gap-2">
                {LESSON_META.map((meta, index) => {
                const lessonT = t.lessons[meta.id];
                const isCompleted = completedLessons.has(meta.id);
                const isLocked = index > 0 && !completedLessons.has(LESSON_META[index - 1].id) && !isCompleted;

                return (
                  <button
                  key={meta.id}
                  onClick={() => !isLocked && handleSelectLesson(meta.id)}
                  disabled={isLocked}
                  className={`
                        p-3 rounded-xl text-left transition-all group relative overflow-hidden
                        ${isLocked ?
                  'bg-zinc-900 opacity-40 cursor-not-allowed' :
                  isCompleted ?
                  'bg-zinc-800/50 border border-green-500/30 hover:border-green-500/50' :
                  'bg-zinc-800/50 border border-zinc-700/50 hover:border-zinc-500 hover:bg-zinc-800'}
                      `
                  }>

                      {isCompleted &&
                    <div className="absolute top-2 right-2">
                          <Check size={12} className="text-green-400" />
                        </div>
                    }

                      <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center mb-2"
                    style={{ background: `${meta.color}20`, color: meta.color }}>

                        {meta.icon}
                      </div>
                      <h3 className="font-bold text-white text-sm mb-0.5">{lessonT?.title}</h3>
                      <p className="text-[10px] text-zinc-400 line-clamp-1">{lessonT?.description}</p>

                      <div className="mt-1.5 flex items-center gap-1 text-[10px] text-zinc-500">
                        <span>{lessonT?.steps.length} {t.ui.steps}</span>
                      </div>
                    </button>);

              })}
              </div>

              {/* Pro tip */}
              <div className="mt-3 p-2 rounded-lg bg-zinc-800/50 border border-zinc-700/50">
                <div className="flex items-center gap-1.5 text-yellow-400 mb-0.5">
                  <Lightbulb size={12} />
                  <span className="text-[10px] font-bold">{t.ui.proTip}</span>
                </div>
                <p className="text-[10px] text-zinc-400">
                  {t.ui.tryIt}
                </p>
              </div>
            </div> :

          // Lesson Content
          <div className="p-3">
              {/* Back button */}
              <button
            onClick={handleBack}
            className="flex items-center gap-1 text-xs text-zinc-400 hover:text-white mb-3 transition-colors">

                <ChevronLeft size={14} />
                {t.ui.backToLessons}
              </button>

              {lessonMeta && lessonTranslation && step &&
            <>
                  {/* Lesson Title */}
                  <div className="flex items-center gap-2 mb-3">
                    <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: `${lessonMeta.color}20`, color: lessonMeta.color }}>

                      {lessonMeta.icon}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-white">{lessonTranslation.title}</h3>
                      <p className="text-xs text-zinc-400">
                        {t.ui.stepOf.
                    replace('{current}', String(currentStep + 1)).
                    replace('{total}', String(lessonTranslation.steps.length))}
                      </p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mb-4 h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                className="h-full transition-all duration-300"
                style={{
                  width: `${(currentStep + 1) / lessonTranslation.steps.length * 100}%`,
                  background: lessonMeta.color
                }} />

                  </div>

                  {/* Step Content */}
                  <div
              className="p-4 rounded-xl border mb-3"
              style={{
                background: `${lessonMeta.color}08`,
                borderColor: `${lessonMeta.color}30`
              }}>

                    <h4 className="text-sm font-bold text-white mb-2">{step.title}</h4>
                    <p className="text-xs text-zinc-300 leading-relaxed mb-3">{step.content}</p>

                    {/* Tip */}
                    {step.tip &&
                <div className="p-2 rounded-lg bg-black/30 border border-zinc-700/50">
                        <p className="text-xs text-yellow-300/90">{step.tip}</p>
                      </div>
                }

                    {/* Highlighted param indicator */}
                    {lessonMeta.highlightParams[currentStep] &&
                <div className="mt-3 flex items-center gap-2 text-xs">
                        <div
                  className="w-2.5 h-2.5 rounded-full animate-ping"
                  style={{ background: lessonMeta.color }} />

                        <span className="text-zinc-400">
                          👆{' '}
                          <span className="font-bold text-white">
                            {lessonMeta.highlightParams[currentStep]?.toUpperCase()}
                          </span>
                        </span>
                      </div>
                }
                  </div>

                  {/* Challenge (on last step) */}
                  {currentStep === lessonTranslation.steps.length - 1 && lessonTranslation.challenge &&
              <div className="p-3 rounded-xl bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 mb-3">
                      <div className="flex items-center gap-1.5 text-yellow-400 mb-1.5">
                        <Sparkles size={14} />
                        <span className="font-bold text-xs">{t.ui.challenge}</span>
                      </div>
                      <p className="text-xs text-white mb-0.5">{lessonTranslation.challenge.description}</p>
                      <p className="text-[10px] text-zinc-400">{t.ui.goal}: {lessonTranslation.challenge.goal}</p>
                    </div>
              }

                  {/* Navigation */}
                  <div className="flex items-center justify-between">
                    <button
                onClick={handlePrevStep}
                disabled={currentStep === 0}
                className={`
                        flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs transition-colors
                        ${currentStep === 0 ?
                'text-zinc-600 cursor-not-allowed' :
                'text-zinc-300 hover:text-white hover:bg-zinc-800'}
                      `
                }>

                      <ChevronLeft size={14} />
                      {t.ui.previous}
                    </button>

                    <button
                onClick={handleNextStep}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg font-bold text-xs transition-all hover:scale-105 text-white"
                style={{ background: lessonMeta.color }}>

                      {currentStep === lessonTranslation.steps.length - 1 ?
                  <>
                          {t.ui.complete}
                          <Sparkles size={14} />
                        </> :

                  <>
                          {t.ui.next}
                          <ChevronRight size={14} />
                        </>
                  }
                    </button>
                  </div>
                </>
            }
            </div>
          }
        </div>
      </div>
    </div>);

}

// Mini learn button component
export function LearnModeButton({ onClick }: {onClick: () => void;}) {
  return (
    <button
    onClick={onClick}
    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 hover:border-purple-500/50 text-purple-300 hover:text-white transition-all group">

      <GraduationCap size={16} className="group-hover:animate-bounce" />
      <span className="text-xs font-bold">Learn</span>
    </button>);

}