import React from 'react';
import { Train, ClipboardList } from 'lucide-react';
import { ExcelExtraction } from '../../types/mining';
import { MatriculeAutocomplete } from '../MatriculeAutocomplete';

interface PlanningExtractionTableProps {
  extractionRowsByPost: Record<'Poste 1' | 'Poste 2' | 'Poste 3', ExcelExtraction[]>;
  updateExtractionCell: (post: 'Poste 1' | 'Poste 2' | 'Poste 3', index: number, field: keyof ExcelExtraction, value: any) => void;
  employees: any[];
  getEmployeeName: (matricule: string) => string;
  handleKeyDown: (e: React.KeyboardEvent<any>) => void;
}

const POST_HOURS: Record<'Poste 1' | 'Poste 2' | 'Poste 3', { start: string; end: string; duration: number }> = {
  'Poste 1': { start: '07:00', end: '14:00', duration: 7 },
  'Poste 2': { start: '15:00', end: '22:00', duration: 7 },
  'Poste 3': { start: '23:00', end: '06:00', duration: 7 },
};

export const PlanningExtractionTable: React.FC<PlanningExtractionTableProps> = ({
  extractionRowsByPost,
  updateExtractionCell,
  employees,
  getEmployeeName,
  handleKeyDown,
}) => {
  const posts: ('Poste 1' | 'Poste 2' | 'Poste 3')[] = ['Poste 1', 'Poste 2', 'Poste 3'];
  const postHoursLabels: Record<string, string> = {
    'Poste 1': '07h - 14h',
    'Poste 2': '15h - 22h',
    'Poste 3': '23h - 06h'
  };

  return (
    <div className="space-y-8">
      {posts.map(p => {
        const rowsForPost = extractionRowsByPost[p] || [];
        const row = rowsForPost[0] || {
          chantierName: 'Extraction Bure N340 Imiter Est',
          treuilliste: '',
          equipier1: '',
          equipier2: '',
          equipier3: '',
          equipier4: '',
          wagonsTarget: 48,
          sterileBureImiterEst: 0,
          startTime: POST_HOURS[p].start,
          endTime: POST_HOURS[p].end,
          remarks: ''
        };
        const idx = 0;
        const tName = getEmployeeName(row.treuilliste || '');
        const eq1Name = getEmployeeName(row.equipier1 || '');
        const eq2Name = getEmployeeName(row.equipier2 || '');
        const eq3Name = getEmployeeName(row.equipier3 || '');
        const eq4Name = getEmployeeName(row.equipier4 || '');

        return (
          <div key={p} className="border border-gray-200 bg-white p-4 shadow-sm rounded-xl">
            {/* Shifty/Post block banner */}
            <div className="flex flex-col items-center justify-center mb-5 mt-1 select-none">
              <h4 className="text-[13px] font-black uppercase tracking-[0.25em] flex items-center gap-2">
                <Train className="w-4 h-4 text-[#b8860b]" />
                <span className="bg-gradient-to-r from-[#8a660d] via-[#b8860b] to-[#8a660d] bg-clip-text text-transparent">
                  {p}
                </span>
                <span className="font-extrabold tracking-normal text-[11px] bg-gradient-to-r from-[#8a660d] via-[#b8860b] to-[#8a660d] bg-clip-text text-transparent">
                  ({postHoursLabels[p]})
                </span>
              </h4>
              <div className="w-16 h-[1.5px] bg-gradient-to-r from-transparent via-[#b8860b]/35 to-transparent mt-1.5" />
            </div>

            <div className="max-w-4xl mx-auto">
              <div 
                data-card-container="true"
                className="bg-white border border-gray-200 p-6 shadow-md rounded-2xl space-y-6"
              >
                {/* Title Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 pb-4">
                  <div>
                    <h3 className="text-lg font-black uppercase text-gray-850 mt-1 tracking-wide">
                      Extraction Bure N340 Imiter Est
                    </h3>
                  </div>
                  <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase bg-emerald-50/70 text-emerald-600 px-3 py-1 rounded-lg border border-emerald-200/50 shadow-sm">
                    📅 Planification du Poste
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Block: Personnel Assignations */}
                  <div className="space-y-4">
                    <div className="border-b border-gray-150 pb-1.5">
                      <h4 className="text-[11px] font-extrabold uppercase text-gray-600 tracking-wider select-none">
                        Assignations de l'équipe
                      </h4>
                    </div>

                    {/* Treuilliste */}
                    <div className="bg-gray-50/60 border border-gray-200 p-3 shadow-none rounded-xl">
                      <label className="block text-[9.5px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                        Treuilliste Prévu
                      </label>
                      <MatriculeAutocomplete
                        value={row.treuilliste || ''}
                        onChange={(matricule) => updateExtractionCell(p, idx, 'treuilliste', matricule)}
                        employees={employees}
                        fonctions={['TREUILLISTE']}
                        post={p}
                        placeholder="Saisir matricule..."
                      />
                      <span className="text-[11px] text-sky-750 block truncate max-w-full font-extrabold mt-1.5">
                        {tName || '❌ Aucun treuilliste affecté (Libre)'}
                      </span>
                    </div>

                    {/* Crew grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50/60 border border-gray-200 p-3 shadow-none rounded-xl">
                        <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                          Équipier Prévu 1
                        </label>
                        <MatriculeAutocomplete
                          value={row.equipier1 || ''}
                          onChange={(matricule) => updateExtractionCell(p, idx, 'equipier1', matricule)}
                          employees={employees}
                          fonctions={['OUVRIER']}
                          post={p}
                          placeholder="Matricule..."
                        />
                        <span className="text-[10px] text-slate-650 block truncate max-w-full font-bold mt-1">
                          {eq1Name || '(Vide)'}
                        </span>
                      </div>

                      <div className="bg-gray-50/60 border border-gray-200 p-3 shadow-none rounded-xl">
                        <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                          Équipier Prévu 2
                        </label>
                        <MatriculeAutocomplete
                          value={row.equipier2 || ''}
                          onChange={(matricule) => updateExtractionCell(p, idx, 'equipier2', matricule)}
                          employees={employees}
                          fonctions={['OUVRIER']}
                          post={p}
                          placeholder="Matricule..."
                        />
                        <span className="text-[10px] text-slate-650 block truncate max-w-full font-bold mt-1">
                          {eq2Name || '(Vide)'}
                        </span>
                      </div>

                      <div className="bg-gray-50/60 border border-gray-200 p-3 shadow-none rounded-xl">
                        <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                          Équipier Prévu 3
                        </label>
                        <MatriculeAutocomplete
                          value={row.equipier3 || ''}
                          onChange={(matricule) => updateExtractionCell(p, idx, 'equipier3', matricule)}
                          employees={employees}
                          fonctions={['OUVRIER']}
                          post={p}
                          placeholder="Matricule..."
                        />
                        <span className="text-[10px] text-slate-650 block truncate max-w-full font-bold mt-1">
                          {eq3Name || '(Vide)'}
                        </span>
                      </div>

                      <div className="bg-gray-50/60 border border-gray-200 p-3 shadow-none rounded-xl">
                        <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                          Équipier Prévu 4
                        </label>
                        <MatriculeAutocomplete
                          value={row.equipier4 || ''}
                          onChange={(matricule) => updateExtractionCell(p, idx, 'equipier4', matricule)}
                          employees={employees}
                          fonctions={['OUVRIER']}
                          post={p}
                          placeholder="Matricule..."
                        />
                        <span className="text-[10px] text-slate-650 block truncate max-w-full font-bold mt-1">
                          {eq4Name || '(Vide)'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Block: Metrics & Schedule */}
                  <div className="space-y-4">
                    <div className="border-b border-gray-150 pb-1.5">
                      <h4 className="text-[11px] font-extrabold uppercase text-gray-600 tracking-wider select-none">
                        Objectifs & Horaires
                      </h4>
                    </div>

                    {/* Hours */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-gray-50/60 border border-gray-200 p-3 shadow-none rounded-xl">
                        <label className="block text-[9.5px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                          Heure Début Prévue
                        </label>
                        <input
                          type="time"
                          value={row.startTime || POST_HOURS[p].start}
                          onChange={e => updateExtractionCell(p, idx, 'startTime', e.target.value)}
                          className="w-full text-xs font-mono text-slate-800 font-bold outline-none bg-transparent"
                        />
                      </div>

                      <div className="bg-gray-50/60 border border-gray-200 p-3 shadow-none rounded-xl">
                        <label className="block text-[9.5px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                          Heure Fin Prévue
                        </label>
                        <input
                          type="time"
                          value={row.endTime || POST_HOURS[p].end}
                          onChange={e => updateExtractionCell(p, idx, 'endTime', e.target.value)}
                          className="w-full text-xs font-mono text-slate-800 font-bold outline-none bg-transparent"
                        />
                      </div>
                    </div>

                    {/* Target numbers */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-emerald-50/70 border border-emerald-100 p-3 shadow-none rounded-xl">
                        <label className="block text-[9.5px] font-black text-emerald-800 uppercase tracking-wider mb-1.5">
                          Cible Wagons (Target)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={row.wagonsTarget}
                          onKeyDown={handleKeyDown}
                          onChange={e => updateExtractionCell(p, idx, 'wagonsTarget', Number(e.target.value))}
                          className="w-full text-sm font-extrabold text-emerald-950 font-mono outline-none bg-transparent"
                        />
                      </div>

                      <div className="bg-slate-50 border border-gray-200 p-3 shadow-none rounded-xl">
                        <label className="block text-[9.5px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                          Stérile Prévu (Wg)
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={row.sterileBureImiterEst}
                          onKeyDown={handleKeyDown}
                          onChange={e => updateExtractionCell(p, idx, 'sterileBureImiterEst', Number(e.target.value))}
                          className="w-full text-sm font-extrabold text-slate-800 font-mono outline-none bg-transparent"
                        />
                      </div>
                    </div>

                    {/* Special instructions / Consignes */}
                    <div className="bg-white border border-gray-200 p-3 rounded-xl shadow-none">
                      <label className="block text-[9.5px] font-black uppercase text-gray-500 tracking-wider mb-1.5">
                        Consignes spéciales
                      </label>
                      <input
                        type="text"
                        placeholder="Ex : Priorité évacuation Bure N340..."
                        value={row.remarks || ''}
                        onKeyDown={handleKeyDown}
                        onChange={e => updateExtractionCell(p, idx, 'remarks', e.target.value)}
                        className="w-full text-xs font-bold text-slate-805 bg-transparent outline-none border-b border-transparent hover:border-gray-200 focus:border-[#00BFFF]"
                      />
                    </div>
                  </div>
                </div>

                {/* Footer analysis info */}
                <div className="border-t border-gray-250 pt-4 flex flex-wrap items-center justify-between gap-4 select-none text-[10px] font-mono font-black uppercase">
                  <div className="flex items-center gap-1.5 text-emerald-700">
                    <ClipboardList className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Intervalle ciblé :</span>
                    <strong className="text-xs text-emerald-900 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-md shadow-sm font-sans font-extrabold">
                      9 mins / wagon
                    </strong>
                  </div>
                  <span className="text-slate-400 text-[9px]">
                    Bure N340 Imiter Est • SMI HydroMines
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
