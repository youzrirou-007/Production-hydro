import React from 'react';
import { Wrench, Trash2 } from 'lucide-react';
import { ExcelMaintenance } from '../../types/mining';
import { MatriculeAutocomplete } from '../MatriculeAutocomplete';

interface PlanningMaintenanceTableProps {
  maintenanceRowsByPost: Record<'Poste 1' | 'Poste 2' | 'Poste 3', ExcelMaintenance[]>;
  updateMaintenanceCell: (post: 'Poste 1' | 'Poste 2' | 'Poste 3', index: number, field: keyof ExcelMaintenance, value: any) => void;
  deleteMaintenanceRowAt: (post: 'Poste 1' | 'Poste 2' | 'Poste 3', idx: number) => void;
  addRowToMaintenance: (post: 'Poste 1' | 'Poste 2' | 'Poste 3') => void;
  employees: any[];
  getEmployeeName: (matricule: string) => string;
  platformSettings: {
    engines: string[];
  };
}

export const PlanningMaintenanceTable: React.FC<PlanningMaintenanceTableProps> = ({
  maintenanceRowsByPost,
  updateMaintenanceCell,
  deleteMaintenanceRowAt,
  addRowToMaintenance,
  employees,
  getEmployeeName,
  platformSettings,
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
        const rowsForPost = maintenanceRowsByPost[p] || [];

        return (
          <div key={p} className="border border-gray-200 bg-white p-4 shadow-sm rounded-xl">
            {/* Shifty/Post block banner */}
            <div className="flex flex-col items-center justify-center mb-5 mt-1 select-none">
              <h4 className="text-[13px] font-black uppercase tracking-[0.25em] flex items-center gap-2">
                <Wrench className="w-3.5 h-3.5 text-[#b8860b]" />
                <span className="bg-gradient-to-r from-[#8a660d] via-[#b8860b] to-[#8a660d] bg-clip-text text-transparent">
                  {p}
                </span>
                <span className="font-extrabold tracking-normal text-[11px] bg-gradient-to-r from-[#8a660d] via-[#b8860b] to-[#8a660d] bg-clip-text text-transparent">
                  ({postHoursLabels[p]})
                </span>
              </h4>
              <div className="w-16 h-[1.5px] bg-gradient-to-r from-transparent via-[#b8860b]/35 to-transparent mt-1.5" />
            </div>

            <div className="overflow-x-auto text-[11px] border border-gray-250 rounded-xl bg-white shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#0f172a] text-white border-b-2 border-[#b8860b] select-none text-[9.5px] font-extrabold tracking-wider uppercase">
                    <th className="p-2.5 text-center w-8 bg-slate-900 border-r border-slate-700/50 text-[#ffd700] font-black">Row</th>
                    <th className="p-2.5 w-40 border-r border-slate-700/50 bg-gradient-to-b from-[#00BFFF]/20 to-[#00BFFF]/10 text-sky-200 font-bold tracking-wider">Rôle Fixe SMI</th>
                    <th className="p-2.5 w-28 border-r border-slate-700/50 bg-gradient-to-b from-amber-950/45 to-amber-950/25 text-[#ffd700] font-bold tracking-wider">Matr. Spécialiste</th>
                    <th className="p-2.5 w-44 border-r border-slate-700/50 bg-gradient-to-b from-amber-950/35 to-amber-950/15 text-[#ffd700] font-bold tracking-wider">Nom Spécialiste</th>
                    <th className="p-2.5 w-52 border-r border-slate-700/50 bg-gradient-to-b from-[#00BFFF]/15 to-[#00BFFF]/5 text-sky-200 font-bold tracking-wider">Machine d'Intervention</th>
                    <th className="p-2.5 w-20 border-r border-slate-700/50 text-center bg-slate-900/60 text-slate-300 font-bold">Heures</th>
                    <th className="p-2.5 border-r border-slate-700/50 bg-slate-900/60 text-slate-300 font-bold">Fiche d'Opérations techniques de maintenance planifiée</th>
                    <th className="p-2.5 text-center w-12 bg-slate-100/5 border-l border-slate-700/50 text-amber-200 font-black">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {rowsForPost.map((row, idx) => {
                    const expertValidName = getEmployeeName(row.agentMatricule || '');

                    return (
                      <tr key={idx} className="border-b border-gray-200 hover:bg-purple-50/10 transition-colors">
                        <td className="p-2 px-3 text-[10px] font-mono text-gray-400 text-center bg-gray-50/40 border-r border-gray-200">{idx + 1}</td>
                        <td className="p-2 px-3 border-r border-gray-200 font-extrabold uppercase text-purple-700 bg-purple-50/30 text-[10.5px]">
                          {row.roleLabel}
                        </td>
                        <td className="p-2 px-2.5 border-r border-gray-200 min-w-[110px] focus-within:ring-2 focus-within:ring-purple-200 focus-within:bg-purple-50/10">
                          <MatriculeAutocomplete
                            value={row.agentMatricule}
                            onChange={(matricule) => updateMaintenanceCell(p, idx, 'agentMatricule', matricule)}
                            employees={employees}
                            fonctions={(() => {
                              const norm = (row.roleLabel || '').toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                              if (norm.includes('MECANICIEN')) return ['MECANICIEN'];
                              if (norm.includes('ELECTRICIEN')) return ['ELECTRICIEN'];
                              if (norm.includes('CHAUDRONNIER')) return ['CHAUDRONNIER'];
                              return ['MECANICIEN', 'CHAUDRONNIER', 'ELECTRICIEN'];
                            })()}
                            placeholder="M-..."
                            post={p}
                          />
                        </td>
                        <td className="p-2 px-3 border-r border-gray-200 text-[11px] font-extrabold text-slate-700 bg-gray-50/50 font-sans">
                          {expertValidName ? expertValidName.split(' ')[0] + ' ' + (expertValidName.split(' ')[1] || '') : 'Inconnu'}
                        </td>
                        <td className="p-2 px-2.5 border-r border-gray-200 focus-within:ring-2 focus-within:ring-purple-200">
                          <select
                            value={row.engineId}
                            onChange={e => updateMaintenanceCell(p, idx, 'engineId', e.target.value)}
                            className="w-full text-[11px] font-semibold border-0 outline-none bg-transparent p-0 text-slate-800"
                          >
                            <option value="">(Aucun engin repéré)</option>
                            {(platformSettings?.engines || []).map(eng => (
                              <option key={eng} value={eng}>
                                {eng}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="p-2 px-2 text-center border-r border-gray-200 focus-within:ring-2 focus-within:ring-purple-200">
                          <input
                            type="number"
                            value={row.hoursSpent}
                            onChange={e => updateMaintenanceCell(p, idx, 'hoursSpent', Number(e.target.value))}
                            className="w-full text-[11px] font-mono text-center outline-none bg-transparent p-0 text-slate-800 font-bold"
                          />
                        </td>
                        <td className="p-2 px-3 border-r border-gray-200 focus-within:ring-2 focus-within:ring-purple-200">
                          <input
                            type="text"
                            placeholder="Visite périodique des 250h, graissage, vidange pont..."
                            value={row.workDescription}
                            onChange={e => updateMaintenanceCell(p, idx, 'workDescription', e.target.value)}
                            className="w-full text-[11px] border-0 outline-none bg-transparent p-0 uppercase text-slate-750 font-medium"
                          />
                        </td>
                        <td className="p-2 text-center">
                          <button
                            type="button"
                            onClick={() => deleteMaintenanceRowAt(p, idx)}
                            className="text-red-400 hover:text-red-700 p-1.5 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Button for dynamic row addition */}
            <div className="flex justify-end mt-3">
              <button
                type="button"
                onClick={() => addRowToMaintenance(p)}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[9px] font-black uppercase text-purple-600 bg-purple-50 hover:bg-purple-100/70 border border-purple-200/50 rounded-lg transition-all cursor-pointer shadow-xs"
              >
                <span>+ Ajouter Ligne</span>
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};
