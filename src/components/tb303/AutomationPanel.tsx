import { useState } from 'react';
import {
  type AutomationState,
  type AutomationParam,
  AUTOMATION_PARAMS,
  AUTOMATION_RESOLUTION } from
'@/hooks/use-tb303-engine';
import { AutomationCanvas } from './AutomationCanvas';
import { Circle, Pencil, Trash2, Waves, Power, Music, Zap } from 'lucide-react';
import type { ModuleId } from '@/hooks/use-multi-synth-engine';

interface AutomationPanelProps {
  automation: AutomationState;
  playbackPosition: number;
  isPlaying: boolean;
  isRecording: boolean;
  automationEnabled: boolean;
  moduleId: ModuleId;
  moduleColor: string;
  moduleName: string;
  onToggleAutomationEnabled: () => void;
  onToggleRecording: () => void;
  onSetAutomation: (param: AutomationParam, points: number[]) => void;
  onClearAutomation: (param: AutomationParam) => void;
  onClearAll: () => void;
}

const MODULE_ICONS: Record<ModuleId, typeof Music> = {
  bass: Waves,
  lead: Music,
  arp: Zap
};

export function AutomationPanel({
  automation,
  playbackPosition,
  isPlaying,
  isRecording,
  automationEnabled,
  moduleId,
  moduleColor,
  moduleName,
  onToggleAutomationEnabled,
  onToggleRecording,
  onSetAutomation,
  onClearAutomation,
  onClearAll
}: AutomationPanelProps) {
  const [selectedParam, setSelectedParam] = useState<AutomationParam>('cutoff');

  const currentLane = automation[selectedParam];
  const currentParamInfo = AUTOMATION_PARAMS.find((p) => p.id === selectedParam)!;

  const ModuleIcon = MODULE_ICONS[moduleId];

  // Check which params have automation
  const hasAutomation = (param: AutomationParam): boolean => {
    return automation[param].points.some((p) => p >= 0);
  };

  const anyHasAutomation = AUTOMATION_PARAMS.some((p) => hasAutomation(p.id));

  return (
    <div className="flex flex-col gap-3">
      {/* Header with module indicator and mode buttons */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Module indicator */}
          <div
          className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-bold"
          style={{ backgroundColor: `${moduleColor}20`, color: moduleColor }}>

            <ModuleIcon size={14} />
            {moduleName}
          </div>
          
          <span className="text-xs text-zinc-500">AUTOMATION</span>
          
          {/* Global automation toggle */}
          <button
          onClick={onToggleAutomationEnabled}
          className={`
              flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs font-bold transition-all
              ${automationEnabled ?
          'bg-green-600/20 text-green-400 border border-green-600/50' :
          'bg-zinc-800 text-zinc-500 border border-zinc-700'}
            `}
          title={automationEnabled ? 'Automation active - click to bypass' : 'Automation bypassed - click to enable'}>

            <Power size={12} />
            {automationEnabled ? 'ON' : 'OFF'}
          </button>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Record button */}
          <button
          onClick={onToggleRecording}
          className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all
              ${isRecording ?
          'bg-red-600 text-white animate-pulse shadow-lg shadow-red-600/50' :
          'bg-zinc-700 text-zinc-300 hover:bg-zinc-600'}
            `}>

            <Circle size={12} className={isRecording ? 'fill-current' : ''} />
            {isRecording ? 'RECORDING' : 'RECORD'}
          </button>
          
          {/* Clear current */}
          <button
          onClick={() => onClearAutomation(selectedParam)}
          disabled={!hasAutomation(selectedParam)}
          className="
              flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-bold transition-all
              bg-zinc-700 text-zinc-300 hover:bg-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed
            "



          title="Clear selected parameter">

            <Trash2 size={12} />
          </button>
          
          {/* Clear all */}
          {anyHasAutomation &&
          <button
          onClick={onClearAll}
          className="
                px-2 py-1.5 rounded-lg text-xs font-bold transition-all
                bg-zinc-800 text-zinc-400 hover:bg-red-900/50 hover:text-red-400
              "



          title="Clear all automation">

              CLEAR ALL
            </button>
          }
        </div>
      </div>
      
      {/* Tip about per-module automation */}
      <div
      className="text-[10px] px-2 py-1 rounded-lg border"
      style={{
        backgroundColor: `${moduleColor}10`,
        borderColor: `${moduleColor}30`,
        color: moduleColor
      }}>

        💡 Automation is per-module. Switch tabs (Bass/Lead/Arp) to set different automation for each channel.
      </div>
      
      {/* Parameter tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-hide">
        {AUTOMATION_PARAMS.map((param) => {
          const isSelected = selectedParam === param.id;
          const hasData = hasAutomation(param.id);

          return (
            <button
            key={param.id}
            onClick={() => setSelectedParam(param.id)}
            className={`
                flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-all whitespace-nowrap
                ${isSelected ?
            'text-white' :
            'bg-zinc-800 text-zinc-400 hover:text-zinc-200'}
              `}
            style={isSelected ? { backgroundColor: param.color + '40', color: param.color } : {}}>

              {param.label}
              {hasData &&
              <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: param.color }} />

              }
            </button>);

        })}
      </div>
      
      {/* Canvas */}
      <AutomationCanvas
        points={currentLane.points}
        playbackPosition={playbackPosition}
        isPlaying={isPlaying}
        color={currentParamInfo.color}
        paramId={selectedParam}
        onDraw={(points) => onSetAutomation(selectedParam, points)} />

      
      {/* Instructions */}
      <div className="flex items-center justify-center gap-4 text-[10px] sm:text-xs text-zinc-500">
        <span className="flex items-center gap-1">
          <Pencil size={10} />
          Draw to create automation
        </span>
        <span>•</span>
        <span className="flex items-center gap-1">
          <Circle size={10} className="text-red-500" />
          Record while tweaking knobs
        </span>
      </div>
    </div>);

}