import React from 'react';
import { ActivityName } from '../../types/mining';

interface ProductionActivityTabsProps {
  active: ActivityName;
  onChange: (activity: ActivityName) => void;
  structureEditMode: boolean;
  onStructureEditModeChange: (val: boolean) => void;
}

export const ProductionActivityTabs: React.FC<ProductionActivityTabsProps> = ({
  active,
  onChange,
  structureEditMode,
  onStructureEditModeChange,
}) => {
  const tabs = [
    { id: 'minage' as const, label: '🔨 Sheet 1 - Forage & Minage' },
    { id: 'deblayage' as const, label: 'LHD - Déblayage & Charge' },
    { id: 'extraction' as const, label: '🚃 Sheet 3 - Extraction' },
    { id: 'maintenance' as const, label: '🔧 Sheet 4 - Brigade Tech' },
  ];

  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-gray-100 pb-3 gap-4">
      <div className="flex flex-wrap gap-1.5 p-1 bg-gray-100 rounded-xl">
        {tabs.map(sheet => (
          <button
            key={sheet.id}
            onClick={() => onChange(sheet.id)}
            className={`px-3.5 py-1.5 rounded-lg font-extrabold text-[10px] uppercase tracking-wider transition-all text-center cursor-pointer ${
              active === sheet.id 
                ? 'bg-white text-gray-950 shadow-xs border border-gray-200/60' 
                : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50/50'
            }`}
          >
            {sheet.label}
          </button>
        ))}
      </div>

      {/* Mode d'Ajustement Structurel Optionnel */}
      <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-1.5 border border-slate-150 rounded-xl shadow-xs self-start lg:self-auto">
        <span className="text-[10px] font-black uppercase text-slate-600 tracking-wider">Ajustements Exceptionnels :</span>
        <label className="relative inline-flex items-center cursor-pointer select-none">
          <input 
            type="checkbox" 
            checked={structureEditMode} 
            onChange={e => onStructureEditModeChange(e.target.checked)}
            className="sr-only peer" 
          />
          <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#00BFFF]"></div>
          <span className="ml-2 text-[10px] font-black text-slate-700 uppercase tracking-wide">
            {structureEditMode ? 'Actif' : 'Inactif'}
          </span>
        </label>
      </div>
    </div>
  );
};
