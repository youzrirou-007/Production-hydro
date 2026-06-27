import React from 'react';
import { Hammer, Tractor, Train, Wrench } from 'lucide-react';
import { ActivityName } from '../../types/mining';

interface PlanningActivityTabsProps {
  active: ActivityName;
  onChange: (activity: ActivityName) => void;
}

export const PlanningActivityTabs: React.FC<PlanningActivityTabsProps> = ({
  active,
  onChange,
}) => {
  const tabs = [
    { 
      id: 'minage' as const, 
      label: 'Sheet 1 - Alignement Forage & Minage', 
      icon: Hammer,
      activeClass: 'border-red-500 text-red-600 bg-gradient-to-b from-red-50/70 via-white to-white shadow-[0_-4px_16px_rgba(239,68,68,0.18)] border-t-2', 
      inactiveClass: 'text-gray-400 hover:text-red-500 hover:bg-red-50/5 border-t-2 border-transparent',
      glowDot: 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.85)]'
    },
    { 
      id: 'deblayage' as const, 
      label: 'Sheet 2 - Programme Déblayage & Vol', 
      icon: Tractor,
      activeClass: 'border-[#00BFFF] text-sky-600 bg-gradient-to-b from-sky-50/70 via-white to-white shadow-[0_-4px_16px_rgba(0,191,255,0.22)] border-t-2', 
      inactiveClass: 'text-gray-400 hover:text-sky-400 hover:bg-sky-50/5 border-t-2 border-transparent',
      glowDot: 'bg-[#00BFFF] shadow-[0_0_10px_rgba(0,191,255,0.85)]'
    },
    { 
      id: 'extraction' as const, 
      label: 'Sheet 3 - Objectifs Extraction', 
      icon: Train,
      activeClass: 'border-emerald-500 text-emerald-600 bg-gradient-to-b from-emerald-50/70 via-white to-white shadow-[0_-4px_16px_rgba(16,185,129,0.18)] border-t-2', 
      inactiveClass: 'text-gray-400 hover:text-emerald-500 hover:bg-emerald-50/5 border-t-2 border-transparent',
      glowDot: 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.85)]'
    },
    { 
      id: 'maintenance' as const, 
      label: 'Sheet 4 - Brigade Maintenance Programmée', 
      icon: Wrench,
      activeClass: 'border-purple-500 text-purple-600 bg-gradient-to-b from-purple-50/70 via-white to-white shadow-[0_-4px_16px_rgba(168,85,247,0.18)] border-t-2', 
      inactiveClass: 'text-gray-400 hover:text-purple-500 hover:bg-purple-50/5 border-t-2 border-transparent',
      glowDot: 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.85)]'
    },
  ];

  return (
    <div className="flex flex-wrap items-center justify-center border-b border-gray-250 pb-2.5 gap-2">
      {tabs.map(sheet => {
        const isActive = active === sheet.id;
        const IconComponent = sheet.icon;
        return (
          <button
            key={sheet.id}
            onClick={() => onChange(sheet.id)}
            className={`px-4.5 py-2.5 text-[10px] rounded-t-xl uppercase tracking-wider transition-all duration-300 border-r border-gray-100 flex items-center gap-2.5 select-none cursor-pointer ${
              isActive 
                ? `${sheet.activeClass} font-black` 
                : `${sheet.inactiveClass} font-semibold`
            }`}
          >
            {IconComponent && (
              <IconComponent className={`w-3.5 h-3.5 ${isActive ? 'opacity-100 scale-105' : 'opacity-60'} transition-all duration-300`} />
            )}
            <span>{sheet.label}</span>
            <span className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
              isActive ? `${sheet.glowDot} animate-pulse scale-110` : 'bg-gray-300/40'
            }`} />
          </button>
        );
      })}
    </div>
  );
};
