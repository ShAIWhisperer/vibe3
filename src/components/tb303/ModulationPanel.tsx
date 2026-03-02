import { type Modulator, type ModShape } from '@/hooks/use-tb303-engine';
import { Waves, Triangle, Square, Shuffle } from 'lucide-react';

interface ModulatorControlProps {
  label: string;
  color: string;
  modulator: Modulator;
  onChange: (updates: Partial<Modulator>) => void;
}

const SHAPES: {id: ModShape;icon: React.ReactNode;label: string;}[] = [
{ id: 'sine', icon: <Waves size={12} />, label: 'Sine' },
{ id: 'triangle', icon: <Triangle size={12} />, label: 'Tri' },
{ id: 'square', icon: <Square size={12} />, label: 'Sqr' },
{ id: 'random', icon: <Shuffle size={12} />, label: 'S&H' }];


export function ModulatorControl({ label, color, modulator, onChange }: ModulatorControlProps) {
  const isActive = modulator.depth > 0;

  return (
    <div className={`
      flex flex-col gap-2 p-2 sm:p-3 rounded-lg border transition-all
      ${isActive ?
    'bg-zinc-800/80 border-zinc-600' :
    'bg-zinc-900/50 border-zinc-800'}
    `
    }>
      {/* Header */}
      <div className="flex items-center justify-between">
        <span
        className="text-[10px] sm:text-xs font-bold uppercase tracking-wider"
        style={{ color: isActive ? color : '#71717a' }}>

          {label}
        </span>
        
        {/* Sync toggle */}
        <button
        onClick={() => onChange({ sync: !modulator.sync })}
        className={`
            px-1.5 py-0.5 rounded text-[9px] sm:text-[10px] font-bold transition-all
            ${modulator.sync ?
        'bg-orange-500 text-black' :
        'bg-zinc-700 text-zinc-400 hover:bg-zinc-600'}
          `
        }>

          SYNC
        </button>
      </div>
      
      {/* Shape selector */}
      <div className="flex gap-0.5">
        {SHAPES.map((shape) =>
        <button
        key={shape.id}
        onClick={() => onChange({ shape: shape.id })}
        className={`
              flex-1 flex items-center justify-center py-1.5 rounded transition-all
              ${modulator.shape === shape.id ?
        'bg-zinc-700 text-white' :
        'bg-zinc-800 text-zinc-500 hover:text-zinc-300'}
            `
        }
        title={shape.label}>

            {shape.icon}
          </button>
        )}
      </div>
      
      {/* Rate slider */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-zinc-500">RATE</span>
          <span className="text-[9px] text-zinc-400 font-mono">
            {modulator.sync ?
            ['4bar', '2bar', '1bar', '1/2', '1/4', '1/8', '1/16', '1/32'][Math.floor(modulator.rate * 7)] :
            `${(0.1 * Math.pow(200, modulator.rate)).toFixed(1)}Hz`
            }
          </span>
        </div>
        <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={modulator.rate}
        onChange={(e) => onChange({ rate: parseFloat(e.target.value) })}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, ${color} ${modulator.rate * 100}%, #3f3f46 ${modulator.rate * 100}%)`
        }} />

      </div>
      
      {/* Depth slider */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-[9px] text-zinc-500">DEPTH</span>
          <span className="text-[9px] text-zinc-400 font-mono">
            {Math.round(modulator.depth * 100)}%
          </span>
        </div>
        <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={modulator.depth}
        onChange={(e) => onChange({ depth: parseFloat(e.target.value) })}
        className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
        style={{
          background: `linear-gradient(to right, ${color} ${modulator.depth * 100}%, #3f3f46 ${modulator.depth * 100}%)`
        }} />

      </div>
      
      {/* Activity indicator */}
      {isActive &&
      <div className="flex justify-center">
          <div
        className="w-2 h-2 rounded-full animate-pulse"
        style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }} />

        </div>
      }
    </div>);

}

// Main modulation panel component
import { type ModulatorState } from '@/hooks/use-tb303-engine';
import { ChevronDown, ChevronUp, Wand2 } from 'lucide-react';
import { useState } from 'react';

interface ModulationPanelProps {
  modulators: ModulatorState;
  onModulatorChange: (param: keyof ModulatorState, updates: Partial<Modulator>) => void;
}

export function ModulationPanel({ modulators, onModulatorChange }: ModulationPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const hasActiveModulation =
  modulators.cutoff.depth > 0 ||
  modulators.resonance.depth > 0 ||
  modulators.envMod.depth > 0;

  return (
    <div className="border-t border-zinc-800 mt-4 pt-3">
      {/* Toggle button */}
      <button
      onClick={() => setIsExpanded(!isExpanded)}
      className={`
          w-full flex items-center justify-between px-3 py-2 rounded-lg transition-all
          ${hasActiveModulation ?
      'bg-orange-500/10 border border-orange-500/30' :
      'bg-zinc-800/50 border border-zinc-700 hover:bg-zinc-800'}
        `
      }>

        <div className="flex items-center gap-2">
          <Wand2
            size={16}
            className={hasActiveModulation ? 'text-orange-400' : 'text-zinc-500'} />

          <span className={`
            text-xs sm:text-sm font-bold tracking-wider
            ${hasActiveModulation ? 'text-orange-400' : 'text-zinc-400'}
          `}>
            MODULATION
          </span>
          {hasActiveModulation &&
          <div className="flex gap-1">
              {modulators.cutoff.depth > 0 &&
            <span className="w-2 h-2 rounded-full bg-[#ff6b00] animate-pulse" />
            }
              {modulators.resonance.depth > 0 &&
            <span className="w-2 h-2 rounded-full bg-[#ff9500] animate-pulse" />
            }
              {modulators.envMod.depth > 0 &&
            <span className="w-2 h-2 rounded-full bg-[#ffb800] animate-pulse" />
            }
            </div>
          }
        </div>
        {isExpanded ? <ChevronUp size={16} className="text-zinc-500" /> : <ChevronDown size={16} className="text-zinc-500" />}
      </button>
      
      {/* Expanded panel */}
      {isExpanded &&
      <div className="grid grid-cols-3 gap-2 mt-3">
          <ModulatorControl
          label="Cutoff"
          color="#ff6b00"
          modulator={modulators.cutoff}
          onChange={(updates) => onModulatorChange('cutoff', updates)} />

          <ModulatorControl
          label="Reso"
          color="#ff9500"
          modulator={modulators.resonance}
          onChange={(updates) => onModulatorChange('resonance', updates)} />

          <ModulatorControl
          label="Env"
          color="#ffb800"
          modulator={modulators.envMod}
          onChange={(updates) => onModulatorChange('envMod', updates)} />

        </div>
      }
    </div>);

}