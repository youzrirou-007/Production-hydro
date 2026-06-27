import React from 'react';
import { UserCheck, Clock3, Copy, Sparkles } from 'lucide-react';

interface ProductionPosteTabsProps {
  selectedPost: 'Poste 1' | 'Poste 2' | 'Poste 3';
  setSelectedPost: (post: 'Poste 1' | 'Poste 2' | 'Poste 3') => void;
  activeSheetTab: 'minage' | 'deblayage' | 'extraction' | 'maintenance';
  copyYesterdayShiftTeam: (post: string) => void;
  standardizeHours: (post: string) => void;
  copyAllMinagePlanToReel?: (post: string) => void;
  copyAllDeblayagePlanToReel?: (post: string) => void;
  copyAllExtractionPlanToReel?: (post: string) => void;
  copyStatus: 'idle' | 'copying' | 'copied' | 'no_data' | 'error';
  yesterdayDateLabel?: string;
}

export const ProductionPosteTabs: React.FC<ProductionPosteTabsProps> = ({
  selectedPost,
  setSelectedPost,
  activeSheetTab,
  copyYesterdayShiftTeam,
  standardizeHours,
  copyAllMinagePlanToReel,
  copyAllDeblayagePlanToReel,
  copyAllExtractionPlanToReel,
  copyStatus,
  yesterdayDateLabel
}) => {
  const posts: ('Poste 1' | 'Poste 2' | 'Poste 3')[] = ['Poste 1', 'Poste 2', 'Poste 3'];

  return (
    <div className="space-y-4">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-100 pb-2">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          {posts.map(p => (
            <button
              key={p}
              onClick={() => setSelectedPost(p)}
              className={`px-4 py-1.5 rounded-lg font-black text-[10px] uppercase tracking-wider transition-all cursor-pointer ${
                selectedPost === p 
                  ? 'bg-white text-gray-950 shadow-xs border border-gray-200/50' 
                  : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50/50'
              }`}
            >
              {p === 'Poste 1' ? '☀️ Poste 1' : p === 'Poste 2' ? '⛅ Poste 2' : '🌙 Poste 3'}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => copyYesterdayShiftTeam(selectedPost)}
            disabled={copyStatus === 'copying'}
            className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-250 text-[10px] font-black uppercase tracking-wider rounded-lg flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
          >
            <UserCheck className="w-3.5 h-3.5 text-rose-800" />
            {copyStatus === 'copying' ? 'Recherche...' : "Copier l'équipe de la veille"}
          </button>
          <button
            onClick={() => standardizeHours(selectedPost)}
            className="px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-250 text-[10px] font-black uppercase tracking-wider rounded-lg flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
          >
            <Clock3 className="w-3.5 h-3.5 text-sky-500" /> Remplir Horaires standard
          </button>

          {activeSheetTab === 'minage' && copyAllMinagePlanToReel && (
            <button
              onClick={() => copyAllMinagePlanToReel(selectedPost)}
              className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-[10px] font-black uppercase tracking-wider rounded-lg flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5 text-amber-600" /> Copier le Plan Forage
            </button>
          )}

          {activeSheetTab === 'deblayage' && copyAllDeblayagePlanToReel && (
            <button
              onClick={() => copyAllDeblayagePlanToReel(selectedPost)}
              className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-[10px] font-black uppercase tracking-wider rounded-lg flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5 text-amber-600" /> Copier le Plan LHD
            </button>
          )}

          {activeSheetTab === 'extraction' && copyAllExtractionPlanToReel && (
            <button
              onClick={() => copyAllExtractionPlanToReel(selectedPost)}
              className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-[10px] font-black uppercase tracking-wider rounded-lg flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5 text-amber-600" /> Copier le Plan Wagons
            </button>
          )}
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3 flex items-center gap-2">
        <Sparkles className="w-4 h-4 text-amber-600 animate-pulse shrink-0" />
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">
          Vous éditez le réalisé pour {selectedPost} ({selectedPost === 'Poste 1' ? '07:00 - 14:00' : selectedPost === 'Poste 2' ? '15:00 - 22:00' : '23:00 - 06:00'}) • Remplissez la colonne RÉEL.
        </p>
      </div>
    </div>
  );
};
