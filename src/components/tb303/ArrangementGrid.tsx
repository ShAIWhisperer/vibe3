import { useState, useRef, useEffect } from 'react';
import { MODULE_CONFIGS, type ArrangementState, type ArrangementChannelId, type PlaybackMode } from '@/hooks/use-multi-synth-engine';
import { Copy, X } from 'lucide-react';

const CHANNEL_IDS: ArrangementChannelId[] = ['bass', 'lead', 'arp', 'drums'];

const CHANNEL_COLORS: Record<ArrangementChannelId, string> = {
  bass: MODULE_CONFIGS.bass.color,
  lead: MODULE_CONFIGS.lead.color,
  arp: MODULE_CONFIGS.arp.color,
  drums: '#22c55e',
};

const CHANNEL_LABELS: Record<ArrangementChannelId, string> = {
  bass: 'BASS',
  lead: 'LEAD',
  arp: 'ARP',
  drums: 'DRUM',
};

interface ArrangementGridProps {
  arrangement: ArrangementState;
  currentBlockIndex: number;
  isPlaying: boolean;
  onSetPlaybackMode: (mode: PlaybackMode) => void;
  onSetLoop: (loop: boolean) => void;
  onSetCell: (blockIdx: number, channel: ArrangementChannelId, patternIdx: number | null) => void;
  onAddBlock: () => void;
  onRemoveBlock: () => void;
  onCopyBlock: (fromIdx: number, toIdx: number) => void;
}

export function ArrangementGrid({
  arrangement,
  currentBlockIndex,
  isPlaying,
  onSetPlaybackMode,
  onSetLoop,
  onSetCell,
  onAddBlock,
  onRemoveBlock,
  onCopyBlock,
}: ArrangementGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [copySource, setCopySource] = useState<number | null>(null);

  // Auto-scroll to keep playhead visible during song playback
  useEffect(() => {
    if (!isPlaying || arrangement.playbackMode !== 'song' || !scrollRef.current) return;
    const container = scrollRef.current;
    const cellWidth = 52;
    const scrollTarget = currentBlockIndex * cellWidth - container.clientWidth / 2 + cellWidth / 2;
    container.scrollTo({ left: Math.max(0, scrollTarget), behavior: 'smooth' });
  }, [currentBlockIndex, isPlaying, arrangement.playbackMode]);

  const handleCellClick = (blockIdx: number, channel: ArrangementChannelId) => {
    const current = arrangement.blocks[blockIdx][channel];
    if (current === null) {
      onSetCell(blockIdx, channel, 0);
    } else if (current >= 7) {
      onSetCell(blockIdx, channel, null);
    } else {
      onSetCell(blockIdx, channel, current + 1);
    }
  };

  const handleBlockHeaderClick = (idx: number) => {
    if (copySource === null) {
      setCopySource(idx);
    } else if (copySource === idx) {
      setCopySource(null);
    } else {
      onCopyBlock(copySource, idx);
      setCopySource(null);
    }
  };

  const isSongMode = arrangement.playbackMode === 'song';

  return (
    <div className="bg-zinc-800/50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-zinc-700">
      {/* Header */}
      <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-zinc-400">ARRANGEMENT</span>
          <div className="flex bg-zinc-900 rounded-md p-0.5">
            <button
              onClick={() => onSetPlaybackMode('pattern')}
              className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all select-none ${
                !isSongMode
                  ? 'bg-orange-500 text-black'
                  : 'text-zinc-500 hover:text-zinc-300 active:text-zinc-100'
              }`}
            >
              PATTERN
            </button>
            <button
              onClick={() => onSetPlaybackMode('song')}
              className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all select-none ${
                isSongMode
                  ? 'bg-orange-500 text-black'
                  : 'text-zinc-500 hover:text-zinc-300 active:text-zinc-100'
              }`}
            >
              SONG
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Copy mode banner */}
          {copySource !== null && (
            <button
              onClick={() => setCopySource(null)}
              className="flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 border border-amber-500/40 rounded text-[10px] text-amber-300 font-bold animate-pulse select-none"
            >
              <X size={10} />
              Cancel copy
            </button>
          )}
          <button
            onClick={() => onSetLoop(!arrangement.loop)}
            className={`px-2.5 py-1 rounded text-[10px] font-bold transition-all border select-none ${
              arrangement.loop
                ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50'
                : 'text-zinc-500 border-zinc-700 hover:text-zinc-300 active:text-zinc-100'
            }`}
          >
            LOOP
          </button>
          <button
            onClick={onAddBlock}
            className="w-7 h-7 flex items-center justify-center bg-zinc-700 hover:bg-zinc-600 active:bg-zinc-500 rounded text-zinc-300 text-sm font-bold select-none"
            title="Add block"
          >
            +
          </button>
          <button
            onClick={onRemoveBlock}
            className="w-7 h-7 flex items-center justify-center bg-zinc-700 hover:bg-zinc-600 active:bg-zinc-500 rounded text-zinc-300 text-sm font-bold select-none"
            title="Remove last block"
          >
            -
          </button>
        </div>
      </div>

      {/* Grid */}
      <div className="flex gap-0">
        {/* Row labels */}
        <div className="flex flex-col gap-[3px] mr-1.5 pt-[34px]">
          {CHANNEL_IDS.map(ch => (
            <div
              key={ch}
              className="h-9 flex items-center justify-end pr-1"
            >
              <span
                className="text-[10px] font-bold tracking-wider"
                style={{ color: CHANNEL_COLORS[ch] }}
              >
                {CHANNEL_LABELS[ch]}
              </span>
            </div>
          ))}
        </div>

        {/* Scrollable grid */}
        <div ref={scrollRef} className="overflow-x-auto flex-1 scrollbar-hide">
          <div className="inline-flex flex-col min-w-0">
            {/* Block headers — click to copy */}
            <div className="flex gap-[3px] mb-[3px]">
              {arrangement.blocks.map((_, idx) => {
                const isPlayhead = isSongMode && isPlaying && currentBlockIndex === idx;
                const isCopySource = copySource === idx;
                const isCopyTarget = copySource !== null && copySource !== idx;

                return (
                  <button
                    key={idx}
                    onClick={() => handleBlockHeaderClick(idx)}
                    className={`w-11 h-7 flex items-center justify-center text-[10px] font-bold rounded-t transition-all select-none cursor-pointer ${
                      isCopySource
                        ? 'bg-amber-500/40 text-amber-300 ring-1 ring-amber-400/60'
                        : isCopyTarget
                        ? 'bg-zinc-700/80 text-zinc-300 hover:bg-amber-500/30 hover:text-amber-300 active:bg-amber-500/50'
                        : isPlayhead
                        ? 'bg-orange-500/30 text-orange-300'
                        : 'text-zinc-500 hover:bg-zinc-700/50 hover:text-zinc-300 active:bg-zinc-600/50'
                    }`}
                    title={
                      isCopySource
                        ? 'Click another block to paste, or click to cancel'
                        : isCopyTarget
                        ? `Paste block ${copySource! + 1} → ${idx + 1}`
                        : `Copy block ${idx + 1}`
                    }
                  >
                    {isCopySource ? (
                      <Copy size={12} />
                    ) : (
                      idx + 1
                    )}
                  </button>
                );
              })}
            </div>

            {/* Channel rows */}
            {CHANNEL_IDS.map(ch => (
              <div key={ch} className="flex gap-[3px] mb-[3px]">
                {arrangement.blocks.map((block, blockIdx) => {
                  const val = block[ch];
                  const isActive = isSongMode && isPlaying && currentBlockIndex === blockIdx;
                  const color = CHANNEL_COLORS[ch];

                  return (
                    <button
                      key={blockIdx}
                      onClick={() => handleCellClick(blockIdx, ch)}
                      className={`w-11 h-9 flex items-center justify-center rounded text-sm font-bold transition-all select-none cursor-pointer border active:scale-95 ${
                        isActive
                          ? 'border-orange-400/60'
                          : copySource === blockIdx
                          ? 'border-amber-400/40'
                          : 'border-transparent'
                      }`}
                      style={{
                        background: val !== null
                          ? `${color}20`
                          : 'rgba(39,39,42,0.5)',
                        color: val !== null ? color : '#52525b',
                        boxShadow: isActive ? `0 0 8px ${color}40` : 'none',
                      }}
                    >
                      {val !== null ? val + 1 : '-'}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-2 flex items-center justify-between">
        {isSongMode && isPlaying ? (
          <div className="flex items-center gap-1">
            <span className="text-[9px] text-zinc-500">Block</span>
            <span className="text-[10px] font-bold text-orange-400">
              {currentBlockIndex + 1} / {arrangement.blocks.length}
            </span>
          </div>
        ) : (
          <div />
        )}
        <span className="text-[9px] text-zinc-600">
          Click header # to copy block
        </span>
      </div>
    </div>
  );
}
