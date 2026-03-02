import { useState } from 'react';
import { X, Download, Loader2, Music, Check, FileAudio, FileMusic } from 'lucide-react';
import type { ExportFormat } from '@/hooks/use-audio-export';

interface ExportProgress {
  phase: 'rendering' | 'encoding';
  progress: number;
}

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (loops: number, format: ExportFormat, onProgress?: (progress: ExportProgress) => void) => Promise<Blob>;
  tempo: number;
}

export function ExportDialog({ isOpen, onClose, onExport, tempo }: ExportDialogProps) {
  const [loops, setLoops] = useState(2);
  const [format, setFormat] = useState<ExportFormat>('wav');
  const [isExporting, setIsExporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressPhase, setProgressPhase] = useState<'rendering' | 'encoding'>('rendering');
  const [exportComplete, setExportComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const secondsPerPattern = 60 / tempo * 4; // 16 steps at tempo
  const totalDuration = secondsPerPattern * loops;

  // Estimated file sizes (rough estimates)
  const estimatedWavSize = Math.round(totalDuration * 44100 * 2 / 1024); // KB
  const estimatedWebmSize = Math.round(estimatedWavSize * 0.15); // WebM is ~15% of WAV

  const handleProgress = (prog: ExportProgress) => {
    setProgress(prog.progress);
    setProgressPhase(prog.phase);
  };

  const triggerDownload = (blob: Blob, filename: string) => {
    // Create object URL
    const url = URL.createObjectURL(blob);

    // Create anchor element
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';

    // Append to body (required for some browsers in sandbox environments)
    document.body.appendChild(a);

    // Trigger click
    a.click();

    // Cleanup after a short delay
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  };

  const handleExport = async () => {
    setIsExporting(true);
    setProgress(0);
    setProgressPhase('rendering');
    setExportComplete(false);
    setError(null);

    try {
      console.log('[Export] Starting export...', { loops, format, tempo });

      const blob = await onExport(loops, format, handleProgress);

      console.log('[Export] Got blob:', { size: blob.size, type: blob.type });

      if (!blob || blob.size === 0) {
        throw new Error('Export produced an empty file');
      }

      setProgress(100);
      setExportComplete(true);

      // Trigger download with robust method
      const ext = format === 'webm' ? 'webm' : 'wav';
      const filename = `vibe3-export-${loops}loops-${tempo}bpm.${ext}`;

      console.log('[Export] Triggering download:', filename);
      triggerDownload(blob, filename);

      setTimeout(() => {
        setIsExporting(false);
        setExportComplete(false);
        setProgress(0);
      }, 2000);
    } catch (err) {
      console.error('[Export] Failed:', err);
      setIsExporting(false);
      setProgress(0);
      setError(err instanceof Error ? err.message : 'Export failed. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-zinc-900 rounded-2xl border border-zinc-700 w-full max-w-sm overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <div className="flex items-center gap-2">
            <Music size={20} className="text-orange-500" />
            <h2 className="text-lg font-bold text-white">Export Audio</h2>
          </div>
          <button
          onClick={onClose}
          disabled={isExporting}
          className="p-2 hover:bg-zinc-800 rounded-lg transition-colors disabled:opacity-50">

            <X size={20} className="text-zinc-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col gap-4">
          {/* Error message */}
          {error &&
          <div className="bg-red-500/20 border border-red-500/50 rounded-lg p-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          }

          {/* Format selector */}
          <div>
            <label className="block text-xs font-bold text-zinc-400 mb-2">FORMAT</label>
            <div className="flex gap-2">
              <button
              onClick={() => setFormat('wav')}
              disabled={isExporting}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 rounded-lg font-bold transition-all ${
              format === 'wav' ?
              'bg-orange-500 text-black' :
              'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'} disabled:opacity-50`
              }>

                <FileAudio size={18} />
                <span>WAV</span>
                <span className="text-[10px] font-normal opacity-75">Lossless</span>
              </button>
              <button
              onClick={() => setFormat('webm')}
              disabled={isExporting}
              className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 rounded-lg font-bold transition-all ${
              format === 'webm' ?
              'bg-orange-500 text-black' :
              'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'} disabled:opacity-50`
              }>

                <FileMusic size={18} />
                <span>WebM</span>
                <span className="text-[10px] font-normal opacity-75">Smaller</span>
              </button>
            </div>
          </div>

          {/* Loop selector */}
          <div>
            <label className="block text-xs font-bold text-zinc-400 mb-2">PATTERN LOOPS</label>
            <div className="flex gap-2">
              {[1, 2, 4, 8].map((n) =>
              <button
              key={n}
              onClick={() => setLoops(n)}
              disabled={isExporting}
              className={`flex-1 py-3 rounded-lg font-bold text-lg transition-all ${
              loops === n ?
              'bg-orange-500 text-black' :
              'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'} disabled:opacity-50`
              }>

                  {n}x
                </button>
              )}
            </div>
          </div>

          {/* Duration info */}
          <div className="bg-zinc-800 rounded-lg p-3">
            <div className="flex justify-between text-sm">
              <span className="text-zinc-400">Duration</span>
              <span className="text-white font-mono">{totalDuration.toFixed(1)}s</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-zinc-400">Format</span>
              <span className="text-white">
                {format === 'wav' ? 'WAV (44.1kHz, 16-bit)' : 'WebM (Opus)'}
              </span>
            </div>
            <div className="flex justify-between text-sm mt-1">
              <span className="text-zinc-400">Est. Size</span>
              <span className="text-white font-mono">
                ~{format === 'wav' ? estimatedWavSize : estimatedWebmSize} KB
              </span>
            </div>
          </div>

          {/* Progress bar */}
          {isExporting &&
          <div className="flex flex-col gap-2">
              <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
                <div
              className="h-full bg-orange-500 transition-all duration-200"
              style={{ width: `${progress}%` }} />

              </div>
              <p className="text-xs text-zinc-400 text-center">
                {exportComplete ?
              'Download starting...' :
              progressPhase === 'encoding' ?
              `Encoding ${format.toUpperCase()}...` :
              `Rendering audio... ${Math.round(progress)}%`}
              </p>
            </div>
          }

          {/* Export button */}
          <button
          onClick={handleExport}
          disabled={isExporting}
          className="flex items-center justify-center gap-2 px-4 py-4 bg-orange-500 hover:bg-orange-400 disabled:bg-orange-500/50 rounded-xl text-black font-bold text-lg transition-all">

            {isExporting ?
            exportComplete ?
            <>
                  <Check size={22} />
                  Complete!
                </> :

            <>
                  <Loader2 size={22} className="animate-spin" />
                  {progressPhase === 'encoding' ? 'Encoding...' : 'Rendering...'}
                </> :


            <>
                <Download size={22} />
                Export {format.toUpperCase()}
              </>
            }
          </button>

          <p className="text-xs text-zinc-500 text-center">
            {format === 'webm' ?
            'WebM (Opus) is smaller for sharing online.' :
            'WAV is lossless quality for production use.'}
          </p>
        </div>
      </div>
    </div>);

}