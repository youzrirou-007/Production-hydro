import React from 'react';
import { Tractor } from 'lucide-react';
import { ExcelDeblayage } from '../../types/mining';
import { MatriculeAutocomplete } from '../MatriculeAutocomplete';

interface PlanningDeblayageTableProps {
  deblayageRowsByPost: Record<'Poste 1' | 'Poste 2' | 'Poste 3', ExcelDeblayage[]>;
  updateDeblayageCell: (post: 'Poste 1' | 'Poste 2' | 'Poste 3', index: number, field: keyof ExcelDeblayage, value: any) => void;
  addRowToDeblayageSector: (post: 'Poste 1' | 'Poste 2' | 'Poste 3', sec: string) => void;
  addStockRowToDeblayageSector: (post: 'Poste 1' | 'Poste 2' | 'Poste 3', sec: string) => void;
  deleteDeblayageRowAt: (post: 'Poste 1' | 'Poste 2' | 'Poste 3', idx: number) => void;
  isDeblayageRowRemovable: (post: 'Poste 1' | 'Poste 2' | 'Poste 3', idx: number) => boolean;
  employees: any[];
  chantiers: any[];
  getSectorBadgeStyles: (sec: string) => { bg: string; dot: string };
  makeExcelKeyHandler: (rowIndex: number, colIndex: number) => (e: React.KeyboardEvent<any>) => void;
  platformSettings: {
    engines: string[];
    lhdBucketCapacities?: Record<string, number>;
  };
  getBucketCapacity: (engineCode: string, customCapacities?: Record<string, number>) => number;
}

const isEstSector = (s: string) => {
  const lower = (s || '').toLowerCase();
  return lower.includes('est') || lower.includes('bure');
};

const isSectorMatching = (s1: string, s2: string) => {
  const norm1 = (s1 || '').toLowerCase().trim();
  const norm2 = (s2 || '').toLowerCase().trim();
  if (norm1 === norm2) return true;
  if (isEstSector(norm1) && isEstSector(norm2)) return true;
  return false;
};

export const PlanningDeblayageTable: React.FC<PlanningDeblayageTableProps> = ({
  deblayageRowsByPost,
  updateDeblayageCell,
  addRowToDeblayageSector,
  addStockRowToDeblayageSector,
  deleteDeblayageRowAt,
  isDeblayageRowRemovable,
  employees,
  chantiers,
  getSectorBadgeStyles,
  makeExcelKeyHandler,
  platformSettings,
  getBucketCapacity,
}) => {
  const posts: ('Poste 1' | 'Poste 2' | 'Poste 3')[] = ['Poste 1', 'Poste 2', 'Poste 3'];
  const postHoursLabels: Record<string, string> = {
    'Poste 1': '07h - 14h',
    'Poste 2': '15h - 22h',
    'Poste 3': '23h - 06h'
  };

  const SECTOR_ORDER = ['Imiter 1', 'Imiter 2', 'Imiter Est', 'Imiter Est Bure', 'Autres / Non classés'];

  return (
    <div className="space-y-8">
      {posts.map(p => {
        const rowsForPost = deblayageRowsByPost[p] || [];
        let globalIdxCounter = 0;

        return (
          <div key={p} className="border border-gray-200 bg-white p-4 shadow-sm rounded-xl">
            {/* Shifty/Post block banner */}
            <div className="flex flex-col items-center justify-center mb-5 mt-1 select-none">
              <h4 className="text-[13px] font-black uppercase tracking-[0.25em] flex items-center gap-2">
                <Tractor className="w-4 h-4 text-[#b8860b]" />
                <span className="bg-gradient-to-r from-[#8a660d] via-[#b8860b] to-[#8a660d] bg-clip-text text-transparent">
                  {p}
                </span>
                <span className="font-extrabold tracking-normal text-[11px] bg-gradient-to-r from-[#8a660d] via-[#b8860b] to-[#8a660d] bg-clip-text text-transparent">
                  ({postHoursLabels[p]})
                </span>
              </h4>
              <div className="w-16 h-[1.5px] bg-gradient-to-r from-transparent via-[#b8860b]/35 to-transparent mt-1.5" />
            </div>

            <div className="overflow-x-auto rounded-lg border border-gray-200">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="bg-[#0f172a] text-white border-b-2 border-[#b8860b] select-none text-[9.5px] font-extrabold tracking-wider uppercase sticky top-0 z-10">
                    <th className="p-2.5 border-r border-slate-700/50 text-center w-8 select-none bg-slate-900 text-[#ffd700] font-black">#</th>
                    <th className="p-2.5 min-w-[124px] border-r border-slate-700/50 bg-gradient-to-b from-[#00BFFF]/20 to-[#00BFFF]/10 text-sky-200 font-bold tracking-wider">Chantier de nettoyage</th>
                    <th className="p-2.5 min-w-[160px] border-r border-slate-700/50 bg-gradient-to-b from-amber-950/45 to-amber-950/25 text-[#ffd700] font-bold tracking-wider">Conducteur engin (Matricule / Nom)</th>
                    <th className="p-2.5 border-r border-slate-700/50 min-w-[140px] bg-gradient-to-b from-[#00BFFF]/15 to-[#00BFFF]/5 text-sky-200 font-bold tracking-wider">Machine / Engin</th>
                    <th className="p-2.5 border-r border-slate-700/50 w-20 text-center bg-slate-900/60 text-slate-300 font-bold">Godets planifiés</th>
                    <th className="p-2.5 border-r border-slate-700/50 w-24 text-center bg-gradient-to-b from-amber-950/15 to-transparent text-amber-200 font-bold">Volume estimé (m³)</th>
                    <th className="p-2.5 text-center w-24 bg-slate-900/60 text-slate-300 font-bold">Heures travail</th>
                  </tr>
                </thead>
                <tbody>
                  {SECTOR_ORDER.map(sec => {
                    const sectorRowsWithIdx = rowsForPost
                      .map((row, idx) => ({ row, idx }))
                      .filter(item => (item.row.sectorGroup || 'Autres / Non classés') === sec);

                    if (sectorRowsWithIdx.length === 0) return null;

                    return (
                      <React.Fragment key={sec}>
                        {/* Group Sector Header */}
                        <tr className="bg-gray-50/80 border-y border-gray-200 select-none">
                          <td colSpan={7} className="py-2 px-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                              <div className="flex flex-wrap items-center gap-2">
                                {(() => {
                                  const style = getSectorBadgeStyles(sec);
                                  return (
                                    <span className={`inline-flex items-center gap-2 px-3 py-1 text-[10px] font-extrabold uppercase rounded-lg ${style.bg}`}>
                                      <span className={`w-2 h-2 rounded-full ${style.dot} animate-pulse`} />
                                      {sec === 'Autres / Non classés' ? 'Autres chantiers non classés' : sec}
                                    </span>
                                  );
                                })()}
                              </div>
                              
                              <div className="flex items-center gap-2 shadow-sm rounded-md bg-white p-0.5">
                                <button
                                  type="button"
                                  onClick={() => addRowToDeblayageSector(p, sec)}
                                  className="text-[9px] font-black text-white hover:bg-sky-600 bg-[#00BFFF] border border-transparent px-2.5 py-1.5 rounded transition-all cursor-pointer flex items-center gap-1 uppercase tracking-wider"
                                  title={`Ajouter un chantier de nettoyage à ${sec}`}
                                >
                                  + Ajouter Ligne
                                </button>

                                <button
                                  type="button"
                                  onClick={() => addStockRowToDeblayageSector(p, sec)}
                                  className="text-[9px] font-black text-amber-950 hover:bg-amber-200 bg-amber-100 border border-amber-250 px-2.5 py-1.5 rounded transition-all cursor-pointer flex items-center gap-1 uppercase tracking-wider"
                                  title={`Ajouter un déblayage de stock à ${sec}`}
                                >
                                  📦 + Stock Manuel
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>

                        {sectorRowsWithIdx.map(({ row, idx: flatIdx }) => {
                          const globalIdx = globalIdxCounter++;
                          const options = chantiers.filter(c => sec === 'Autres / Non classés' || isSectorMatching(c.sector, sec));
                          const hasChantier = options.some(o => o.id === row.chantierId);
                          const fallbackChantier = row.chantierId && !hasChantier ? chantiers.find(c => c.id === row.chantierId) : null;

                          return (
                            <tr key={flatIdx} className="border-b border-gray-200 hover:bg-sky-50/20 transition-colors">
                              {/* Line Index & Trash */}
                              <td className="p-1 px-1.5 border-r border-gray-200 text-center text-[10.5px] text-gray-500 font-mono w-8 select-none relative group bg-gray-50/50">
                                <span className="group-hover:opacity-0 transition-opacity">{flatIdx + 1}</span>
                                {isDeblayageRowRemovable(p, flatIdx) && (
                                  <button
                                    type="button"
                                    onClick={() => deleteDeblayageRowAt(p, flatIdx)}
                                    className="absolute inset-x-0.5 top-0.5 bottom-0.5 bg-red-100 hover:bg-red-200 text-red-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded cursor-pointer text-[10.5px] font-black border-none outline-none"
                                    title="Retirer cette ligne"
                                  >
                                    🗑️
                                  </button>
                                )}
                              </td>

                              {/* Chantier dropdown selection */}
                              <td data-row={globalIdx} data-col={0} className="p-1 border-r border-gray-200 min-w-[124px] focus-within:ring-2 focus-within:ring-[#00BFFF]/50 focus-within:ring-inset focus-within:bg-sky-50/40">
                                {row.chantierId?.startsWith('stock_') ? (
                                  <div className="flex items-center gap-1.5 w-full">
                                    <button
                                      type="button"
                                      onClick={() => updateDeblayageCell(p, flatIdx, 'chantierId', '')}
                                      className="text-[8.5px] bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-900 font-extrabold px-1.5 py-0.5 rounded uppercase shrink-0 transition-all cursor-pointer select-none"
                                      title="Revenir à un chantier standard"
                                    >
                                      STOCK ✕
                                    </button>
                                    <input
                                      type="text"
                                      value={row.chantierId.replace('stock_', '')}
                                      onChange={e => updateDeblayageCell(p, flatIdx, 'chantierId', 'stock_' + e.target.value)}
                                      className="w-full bg-transparent font-extrabold p-0.5 text-[11px] uppercase outline-none text-amber-900 border-none"
                                      placeholder="Nom du stock..."
                                    />
                                  </div>
                                ) : (
                                  <select
                                    value={row.chantierId}
                                    onChange={e => updateDeblayageCell(p, flatIdx, 'chantierId', e.target.value)}
                                    onKeyDown={makeExcelKeyHandler(globalIdx, 0)}
                                    className="w-full bg-transparent border-0 font-extrabold p-0.5 text-[11px] uppercase outline-none text-gray-800"
                                  >
                                    <option value="">(Vide)</option>
                                    <option value="stock_NOUVEAU STOCK" className="text-amber-800 font-bold bg-amber-50">📦 + NOUVEAU STOCK</option>
                                    {fallbackChantier && (
                                      <option value={fallbackChantier.id}>
                                        {fallbackChantier.name || fallbackChantier.id} (Hors-sec)
                                      </option>
                                    )}
                                    {options.map(c => (
                                      <option key={c.id} value={c.id}>{c.name || c.id}</option>
                                    ))}
                                  </select>
                                )}
                              </td>

                              {/* Driver */}
                              <td data-row={globalIdx} data-col={1} className="p-0.5 border-r border-gray-200 min-w-[160px] focus-within:ring-2 focus-within:ring-[#00BFFF]/50 focus-within:ring-inset focus-within:bg-sky-50/40">
                                <MatriculeAutocomplete
                                  value={row.driverMatricule}
                                  onChange={(matricule) => updateDeblayageCell(p, flatIdx, 'driverMatricule', matricule)}
                                  employees={employees}
                                  sector={sec !== 'Autres / Non classés' ? sec : undefined}
                                  fonctions={['CONDUCTEUR_ENGIN']}
                                  post={p}
                                  placeholder="M-..."
                                  onKeyDown={makeExcelKeyHandler(globalIdx, 1)}
                                />
                              </td>

                              {/* Engine */}
                              <td data-row={globalIdx} data-col={2} className="p-1 border-r border-gray-200 min-w-[140px] focus-within:ring-2 focus-within:ring-[#00BFFF]/50 focus-within:ring-inset focus-within:bg-sky-50/40">
                                <select
                                  value={row.engineId}
                                  onChange={e => updateDeblayageCell(p, flatIdx, 'engineId', e.target.value)}
                                  onKeyDown={makeExcelKeyHandler(globalIdx, 2)}
                                  className="w-full bg-transparent border-0 font-bold text-[11px] uppercase outline-none text-gray-800"
                                >
                                  <option value="">(Machine LHD)</option>
                                  {(platformSettings?.engines || []).map(eng => (
                                    <option key={eng} value={eng}>
                                      {eng}
                                    </option>
                                  ))}
                                </select>
                              </td>

                              {/* Godets */}
                              <td data-row={globalIdx} data-col={3} className="p-1 border-r border-gray-200 w-20 text-center focus-within:ring-2 focus-within:ring-[#00BFFF]/50 focus-within:ring-inset focus-within:bg-sky-50/40">
                                <input
                                  type="number"
                                  value={row.godets === 0 ? '' : row.godets}
                                  placeholder="0"
                                  onChange={e => updateDeblayageCell(p, flatIdx, 'godets', Number(e.target.value))}
                                  onKeyDown={makeExcelKeyHandler(globalIdx, 3)}
                                  className="w-full bg-transparent text-center font-bold text-[11px] outline-none border-0 text-gray-800"
                                />
                                <div className="text-[8px] text-slate-400 mt-0.5 text-center select-none font-bold">
                                  {getBucketCapacity(row.engineCode || '', platformSettings?.lhdBucketCapacities).toFixed(1)} m³/godet
                                </div>
                              </td>

                              {/* Volume estimated */}
                              <td className="p-1 border-r border-gray-200 w-24 text-center font-mono font-extrabold text-blue-600 bg-gray-50/80 select-none">
                                {(row.volumeEstimated || 0).toFixed(1)} m³
                              </td>

                              {/* Hours worked */}
                              <td data-row={globalIdx} data-col={4} className="p-1 border-r border-gray-200 w-24 text-center focus-within:ring-2 focus-within:ring-[#00BFFF]/50 focus-within:ring-inset focus-within:bg-sky-50/40">
                                <input
                                  type="number"
                                  step="0.5"
                                  value={row.hoursWorked}
                                  onChange={e => updateDeblayageCell(p, flatIdx, 'hoursWorked', Number(e.target.value))}
                                  onKeyDown={makeExcelKeyHandler(globalIdx, 4)}
                                  className="w-full bg-transparent text-center font-bold text-[11px] outline-none border-0 text-gray-800"
                                />
                              </td>

                              {/* Remarks */}
                              <td className="hidden">
                                <input
                                  type="text"
                                  value={row.remarks || ''}
                                  onChange={e => updateDeblayageCell(p, flatIdx, 'remarks', e.target.value)}
                                  onKeyDown={makeExcelKeyHandler(globalIdx, 5)}
                                  className="w-full bg-transparent border-0 font-semibold p-0 text-[10.5px] outline-none uppercase"
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        );
      })}
    </div>
  );
};
