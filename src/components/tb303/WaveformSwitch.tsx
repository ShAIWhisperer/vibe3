interface WaveformSwitchProps {
  value: 'saw' | 'pulse';
  onChange: (value: 'saw' | 'pulse') => void;
  isHighlighted?: boolean;
}

export function WaveformSwitch({ value, onChange, isHighlighted = false }: WaveformSwitchProps) {
  return (
    <div className="flex flex-col items-center gap-1.5 relative">
      {/* Learn mode highlight */}
      {isHighlighted &&
      <div
      className="absolute -inset-2 rounded-xl border-2 animate-pulse pointer-events-none"
      style={{
        borderColor: '#22d3ee',
        boxShadow: '0 0 20px #22d3ee, 0 0 40px #22d3ee',
        opacity: 0.8
      }} />

      }
      
      <div className="flex bg-zinc-900 rounded-lg p-1 border border-zinc-700">
        <button
        onClick={() => onChange('saw')}
        className={`
            px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-bold transition-all
            flex items-center gap-1.5 sm:gap-2
            ${value === 'saw' ?
        'bg-orange-500 text-black shadow-lg shadow-orange-500/30' :
        'text-zinc-400 active:text-white'}
          `
        }>

          {/* Sawtooth wave icon */}
          <svg width="20" height="14" viewBox="0 0 24 16" fill="none" className="w-4 h-3 sm:w-5 sm:h-4">
            <path
            d="M2 14 L8 2 L8 14 L14 2 L14 14 L20 2 L20 14"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round" />

          </svg>
          SAW
        </button>
        
        <button
        onClick={() => onChange('pulse')}
        className={`
            px-3 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-bold transition-all
            flex items-center gap-1.5 sm:gap-2
            ${value === 'pulse' ?
        'bg-orange-500 text-black shadow-lg shadow-orange-500/30' :
        'text-zinc-400 active:text-white'}
          `
        }>

          {/* Square wave icon */}
          <svg width="20" height="14" viewBox="0 0 24 16" fill="none" className="w-4 h-3 sm:w-5 sm:h-4">
            <path
            d="M2 14 L2 2 L8 2 L8 14 L14 14 L14 2 L20 2 L20 14"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round" />

          </svg>
          SQR
        </button>
      </div>
      <span className={`text-[10px] sm:text-xs font-bold tracking-wider uppercase ${isHighlighted ? 'text-cyan-400' : 'text-gray-300'}`}>
        Wave
      </span>
    </div>);

}