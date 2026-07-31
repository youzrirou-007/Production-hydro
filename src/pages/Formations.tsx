import React, { useState } from 'react';
import { FormationSchemaViewer } from './TechniqueMiniere/FormationSchemaViewer';
import { FormationSlideDeck } from './TechniqueMiniere/FormationSlideDeck';
import type { GabaritType } from './TechniqueMiniere/types';
import { GraduationCap, ChevronRight } from 'lucide-react';

const GABARITS: { id: GabaritType; title: string; subtitle: string; holes: string }[] = [
  { id: '12m2', title: 'Galerie 12m² SMI', subtitle: 'Gabarit standard SMI Imiter', holes: '38 trous' },
  { id: '12m2_intl', title: 'Galerie 12m² International', subtitle: 'Langefors-Kihlström', holes: '38 trous' },
  { id: '9m2', title: 'Traçage 9m²', subtitle: 'Bouchon cylindrique simple', holes: '28 trous' },
  { id: '9m2_intl', title: 'Traçage 9m² International', subtitle: 'Variante internationale', holes: '30 trous' },
];

export const Formations: React.FC = () => {
  const [activeGabarit, setActiveGabarit] = useState<GabaritType | null>(null);

  if (activeGabarit) {
    return <FormationSlideDeck gabarit={activeGabarit} onClose={() => setActiveGabarit(null)} />;
  }

  return (
    <div className="min-h-screen bg-[#0f172a] px-6 py-10 lg:px-12">
      <div className="max-w-6xl mx-auto">
        <div className="mb-10 text-center">
          <div className="inline-flex items-center gap-2 text-[#ffd700] mb-3">
            <GraduationCap className="w-6 h-6" />
            <span className="text-[11px] font-black uppercase tracking-[0.25em]">Formations HydroMines</span>
          </div>
          <h1 className="text-3xl lg:text-4xl font-black text-white tracking-tight">
            Maîtriser le forage, schéma par schéma
          </h1>
          <p className="text-slate-400 mt-2 text-sm max-w-xl mx-auto">
            Du premier trou foré au bourrage parfait — une formation complète pour chaque gabarit de galerie.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {GABARITS.map(g => (
            <button
              key={g.id}
              onClick={() => setActiveGabarit(g.id)}
              className="group text-left bg-slate-900/60 border border-[#b8860b]/25 rounded-2xl p-5 hover:border-[#ffd700]/60 transition-all duration-300 overflow-hidden cursor-pointer"
            >
              <div className="w-full h-40 rounded-xl bg-slate-950/50 mb-4 overflow-hidden">
                <FormationSchemaViewer gabarit={g.id} highlightStep="tous" className="w-full h-full opacity-80 group-hover:opacity-100 transition-opacity" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-white font-black text-[15px]">{g.title}</h3>
                  <p className="text-slate-400 text-[12px] mt-0.5">{g.subtitle} · {g.holes}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-[#ffd700] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Formations;
