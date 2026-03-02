import type { Step } from '@/hooks/use-tb303-engine';

interface StepEditorProps {
  step: number;
  data: Step;
  isCurrent: boolean;
  isSelected: boolean;
  onUpdate: (data: Partial<Step>) => void;
  onClick: () => void;
  notes: string[];
}

export function StepEditor({ step, data, isCurrent, isSelected, onUpdate, onClick, notes }: StepEditorProps) {
  const noteName = notes[data.note % 12];
  const octave = Math.floor(data.note / 12) - 1;

  return (
    <button
    onClick={onClick}
    className={`
        relative flex flex-col rounded-md sm:rounded-lg border-2 transition-all duration-75
        w-[calc(12.5%-2px)] sm:w-10 md:w-12 min-w-[38px] aspect-[3/4]
        ${isSelected ? 'ring-2 ring-orange-400 ring-offset-1 ring-offset-zinc-900' : ''}
        ${data.active ?
    data.accent ?
    'bg-gradient-to-b from-orange-500 to-orange-600 border-orange-400 shadow-lg shadow-orange-500/50' :
    'bg-gradient-to-b from-amber-500 to-amber-600 border-amber-400 shadow-md shadow-amber-500/30' :
    'bg-zinc-800 border-zinc-700 active:bg-zinc-700'}
        ${
    isCurrent ? 'scale-105 sm:scale-110 z-10' : ''}
      `}>

      {/* Step number */}
      <div className={`text-center py-0.5 sm:py-1 text-[10px] sm:text-xs font-bold border-b ${
      data.active ? 'border-black/20 text-black/70' : 'border-zinc-700 text-zinc-500'}`
      }>
        {step + 1}
      </div>
      
      {/* Note display */}
      <div className={`flex-1 flex items-center justify-center font-bold text-[10px] sm:text-sm ${
      data.active ? 'text-black' : 'text-zinc-400'}`
      }>
        {data.active ? `${noteName}${octave}` : '-'}
      </div>
      
      {/* Status indicators */}
      <div className="flex justify-center gap-0.5 pb-1 sm:pb-2">
        <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-colors ${
        data.accent ? 'bg-red-600 shadow shadow-red-500' : 'bg-zinc-700'}`
        } />
        <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-colors ${
        data.slide ? 'bg-blue-500 shadow shadow-blue-400' : 'bg-zinc-700'}`
        } />
      </div>
      
      {/* Current step indicator */}
      {isCurrent &&
      <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-0 h-0 
          border-l-[3px] border-r-[3px] border-t-[3px] sm:border-l-4 sm:border-r-4 sm:border-t-4
          border-l-transparent border-r-transparent border-t-white" />



      }
    </button>);

}

// Compact mobile step controls
interface StepControlsProps {
  selectedStep: number | null;
  stepData: Step | null;
  onUpdate: (data: Partial<Step>) => void;
  notes: string[];
  onPlayNote: (note: number, accent: boolean) => void;
}

export function StepControls({ selectedStep, stepData, onUpdate, notes, onPlayNote }: StepControlsProps) {
  if (selectedStep === null || !stepData) {
    return (
      <div className="flex items-center justify-center h-20 sm:h-24 text-zinc-500 text-sm">
        Tap a step to edit
      </div>);

  }

  const currentNoteName = notes[stepData.note % 12];
  const currentOctave = Math.floor(stepData.note / 12) - 1;

  return (
    <div className="flex flex-col gap-3">
      {/* Toggle buttons row */}
      <div className="flex items-center justify-center gap-2 sm:gap-4">
        <button
        onClick={() => onUpdate({ active: !stepData.active })}
        className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-bold text-sm transition-all ${
        stepData.active ?
        'bg-orange-500 text-black shadow-lg shadow-orange-500/30' :
        'bg-zinc-700 text-zinc-300 active:bg-zinc-600'}`
        }>

          {stepData.active ? 'ON' : 'OFF'}
        </button>
        
        <button
        onClick={() => onUpdate({ accent: !stepData.accent })}
        className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-bold text-sm transition-all ${
        stepData.accent ?
        'bg-red-500 text-white shadow-lg shadow-red-500/30' :
        'bg-zinc-700 text-zinc-300 active:bg-zinc-600'}`
        }>

          ACC
        </button>
        
        <button
        onClick={() => onUpdate({ slide: !stepData.slide })}
        className={`px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg font-bold text-sm transition-all ${
        stepData.slide ?
        'bg-blue-500 text-white shadow-lg shadow-blue-500/30' :
        'bg-zinc-700 text-zinc-300 active:bg-zinc-600'}`
        }>

          SLD
        </button>
        
        {/* Note display and octave controls */}
        <div className="flex items-center gap-1 ml-2">
          <button
          onClick={() => {
            const newNote = Math.max(24, stepData.note - 1);
            onUpdate({ note: newNote });
            onPlayNote(newNote, stepData.accent);
          }}
          className="w-8 h-10 sm:w-9 sm:h-11 bg-zinc-700 active:bg-zinc-600 rounded-lg text-zinc-300 font-bold">

            ◀
          </button>
          <div
          className="w-12 sm:w-14 h-10 sm:h-11 flex items-center justify-center bg-zinc-800 rounded-lg border border-zinc-600 font-bold text-orange-400 text-sm sm:text-base">

            {currentNoteName}{currentOctave}
          </div>
          <button
          onClick={() => {
            const newNote = Math.min(60, stepData.note + 1);
            onUpdate({ note: newNote });
            onPlayNote(newNote, stepData.accent);
          }}
          className="w-8 h-10 sm:w-9 sm:h-11 bg-zinc-700 active:bg-zinc-600 rounded-lg text-zinc-300 font-bold">

            ▶
          </button>
        </div>
      </div>
      
      {/* Quick note buttons - mobile optimized */}
      <div className="flex items-center justify-center gap-1">
        <span className="text-[10px] text-zinc-500 mr-1 hidden sm:inline">OCT:</span>
        {[1, 2, 3, 4].map((oct) => {
          const octaveBase = (oct + 1) * 12;
          const noteInOctave = stepData.note % 12;
          const targetNote = octaveBase + noteInOctave;
          const isCurrentOctave = currentOctave === oct;

          return (
            <button
            key={oct}
            onClick={() => {
              onUpdate({ note: targetNote });
              onPlayNote(targetNote, stepData.accent);
            }}
            className={`w-8 h-7 sm:w-9 sm:h-8 rounded font-bold text-xs sm:text-sm transition-all ${
            isCurrentOctave ?
            'bg-orange-500 text-black' :
            'bg-zinc-700 text-zinc-400 active:bg-zinc-600'}`
            }>

              {oct}
            </button>);

        })}
        
        <div className="w-px h-6 bg-zinc-700 mx-1" />
        
        {['C', 'D', 'F', 'G', 'A#'].map((note) => {
          const noteIndex = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'].indexOf(note);
          const targetNote = (currentOctave + 1) * 12 + noteIndex;
          const isCurrentNote = stepData.note % 12 === noteIndex;

          return (
            <button
            key={note}
            onClick={() => {
              onUpdate({ note: targetNote });
              onPlayNote(targetNote, stepData.accent);
            }}
            className={`w-7 h-7 sm:w-8 sm:h-8 rounded text-[10px] sm:text-xs font-bold transition-all ${
            isCurrentNote ?
            'bg-orange-500 text-black' :
            'bg-zinc-700 text-zinc-400 active:bg-zinc-600'}`
            }>

              {note}
            </button>);

        })}
      </div>
    </div>);

}