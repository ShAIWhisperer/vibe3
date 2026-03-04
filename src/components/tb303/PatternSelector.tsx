import { useState, useCallback, useEffect } from 'react';
import { Copy, Trash2 } from 'lucide-react';

interface PatternSelectorProps {
  bankSize: number;
  activeIndex: number;
  onSelect: (index: number) => void;
  onCopy: (from: number, to: number) => void;
  onClear: (index: number) => void;
  color?: string;
  hasContent?: boolean[];
}

export function PatternSelector({
  bankSize,
  activeIndex,
  onSelect,
  onCopy,
  onClear,
  color = '#f97316',
  hasContent
}: PatternSelectorProps) {
  const [copyMode, setCopyMode] = useState(false);
  const [copySource, setCopySource] = useState<number | null>(null);

  // Exit copy mode on Escape
  useEffect(() => {
    if (!copyMode) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setCopyMode(false);
        setCopySource(null);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [copyMode]);

  const handleSlotClick = useCallback((index: number) => {
    if (copyMode && copySource !== null) {
      if (index !== copySource) {
        onCopy(copySource, index);
      }
      setCopyMode(false);
      setCopySource(null);
    } else {
      onSelect(index);
    }
  }, [copyMode, copySource, onCopy, onSelect]);

  const handleCopyClick = useCallback(() => {
    if (copyMode) {
      setCopyMode(false);
      setCopySource(null);
    } else {
      setCopyMode(true);
      setCopySource(activeIndex);
    }
  }, [copyMode, activeIndex]);

  const handleClearClick = useCallback(() => {
    onClear(activeIndex);
  }, [onClear, activeIndex]);

  return (
    <div className="flex items-center gap-1.5 px-2 py-1.5 bg-zinc-800/50 rounded-lg border border-zinc-700/50">
      <span className="text-[10px] font-bold text-zinc-500 tracking-wider mr-0.5">PTN</span>

      {Array.from({ length: bankSize }, (_, i) => {
        const isActive = i === activeIndex;
        const hasNotes = hasContent?.[i] ?? false;
        const isCopyTarget = copyMode && copySource !== null && i !== copySource;

        return (
          <button
            key={i}
            onClick={() => handleSlotClick(i)}
            className={`
              relative w-7 h-7 rounded text-[11px] font-bold transition-all
              ${isActive
                ? 'text-black shadow-sm'
                : copyMode && i === copySource
                  ? 'text-white'
                  : isCopyTarget
                    ? 'bg-zinc-700 text-white hover:brightness-125 animate-pulse'
                    : 'bg-zinc-700/60 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
              }
            `}
            style={{
              backgroundColor: isActive ? color : copyMode && i === copySource ? `${color}66` : undefined,
              outlineColor: copyMode && i === copySource ? color : undefined,
              outline: copyMode && i === copySource ? `2px solid ${color}` : undefined,
              outlineOffset: '1px',
            }}
            title={
              copyMode && i === copySource
                ? `Source: Pattern ${i + 1}`
                : copyMode
                  ? `Copy to Pattern ${i + 1}`
                  : `Pattern ${i + 1}`
            }
          >
            {i + 1}
            {/* Content indicator dot */}
            {hasNotes && !isActive && (
              <span
                className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: color }}
              />
            )}
          </button>
        );
      })}

      {/* Copy button */}
      <button
        onClick={handleCopyClick}
        className={`
          ml-1 px-1.5 py-1 rounded text-[10px] font-bold tracking-wider transition-all
          ${copyMode
            ? 'text-black'
            : 'bg-zinc-700/60 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200'
          }
        `}
        style={{
          backgroundColor: copyMode ? color : undefined,
        }}
        title={copyMode ? 'Cancel copy' : 'Copy active pattern to another slot'}
      >
        <Copy size={12} />
      </button>

      {/* Clear button */}
      <button
        onClick={handleClearClick}
        className="px-1.5 py-1 bg-zinc-700/60 text-zinc-400 hover:bg-red-500/20 hover:text-red-400 rounded text-[10px] font-bold tracking-wider transition-all"
        title="Clear active pattern"
      >
        <Trash2 size={12} />
      </button>
    </div>
  );
}
