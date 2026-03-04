import { type ModuleId, type ModuleState, MODULE_CONFIGS } from '@/hooks/use-multi-synth-engine';
import { Music, Zap, Waves } from 'lucide-react';

const MODULE_ICONS: Record<ModuleId, typeof Music> = {
  bass: Waves,
  lead: Music,
  arp: Zap
};

interface ModuleTabsProps {
  activeModule: ModuleId;
  onModuleChange: (id: ModuleId) => void;
  moduleStates: Record<ModuleId, ModuleState>;
}

export function ModuleTabs({ activeModule, onModuleChange, moduleStates }: ModuleTabsProps) {
  const modules: ModuleId[] = ['bass', 'lead', 'arp'];

  return (
    <div className="flex gap-2">
      {modules.map((id) => {
        const config = MODULE_CONFIGS[id];
        const Icon = MODULE_ICONS[id];
        const isActive = activeModule === id;
        const activeSlot = moduleStates[id].patternBank[moduleStates[id].activePatternIndex];
        const activeSteps = activeSlot.pattern.filter((s) => s.active).length;

        return (
          <button
          key={id}
          onClick={() => onModuleChange(id)}
          className={`
              relative flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm
              transition-all duration-200
              ${isActive ?
          'text-white shadow-lg' :
          'text-zinc-400 hover:text-zinc-200 bg-zinc-800/50 hover:bg-zinc-800'}
            `
          }
          style={isActive ? {
            backgroundColor: `${config.color}20`,
            borderColor: `${config.color}50`,
            border: `1px solid ${config.color}50`,
            boxShadow: `0 4px 20px ${config.color}20`
          } : {}}>

            <Icon
              size={16}
              style={{ color: isActive ? config.color : undefined }} />

            <span>{config.name}</span>
            
            {/* Step count indicator */}
            <span
            className={`
                text-[10px] px-1.5 py-0.5 rounded-full
                ${isActive ? 'bg-white/20' : 'bg-zinc-700'}
              `}
            style={isActive ? { color: config.color } : {}}>

              {activeSteps}
            </span>
            
            {/* Active indicator line */}
            {isActive &&
            <div
            className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full"
            style={{ backgroundColor: config.color }} />

            }
          </button>);

      })}  
    </div>);

}