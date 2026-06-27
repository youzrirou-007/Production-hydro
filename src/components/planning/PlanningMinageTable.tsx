import React from 'react';
import { Hammer } from 'lucide-react';
import { ExcelMinage } from '../../types/mining';
import { MatriculeAutocomplete } from '../MatriculeAutocomplete';

interface PlanningMinageTableProps {
  minageRowsByPost: Record<'Poste 1' | 'Poste 2' | 'Poste 3', ExcelMinage[]>;
  updateMinageCell: (post: 'Poste 1' | 'Poste 2' | 'Poste 3', index: number, field: keyof ExcelMinage, value: any) => void;
  addRowToMinageSector: (post: 'Poste 1' | 'Poste 2' | 'Poste 3', sec: string) => void;
  deleteMinageRowAt: (post: 'Poste 1' | 'Poste 2' | 'Poste 3', idx: number) => void;
  isMinageRowRemovable: (post: 'Poste 1' | 'Poste 2' | 'Poste 3', idx: number) => boolean;
  sectorChiefs: any;
  setSectorChiefs: React.Dispatch<React.SetStateAction<any>>;
  sectorBoutefeus: any;
  setSectorBoutefeus: React.Dispatch<React.SetStateAction<any>>;
  employees: any[];
  chantiers: any[];
  getSectorBadgeStyles: (sec: string) => { bg: string; dot: string };
  isLockedByNiveau2: boolean;
  isMonthClosedForPlanning: boolean;
  makeExcelKeyHandler: (rowIndex: number, colIndex: number) => (e: React.KeyboardEvent<any>) => void;
  handleToggleManualOverride: (post: 'Poste 1' | 'Poste 2' | 'Poste 3', index: number) => void;
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

export const PlanningMinageTable: React.FC<PlanningMinageTableProps> = ({
  minageRowsByPost,
  updateMinageCell,
  addRowToMinageSector,
  deleteMinageRowAt,
  isMinageRowRemovable,
  sectorChiefs,
  setSectorChiefs,
  sectorBoutefeus,
  setSectorBoutefeus,
  employees,
  chantiers,
  getSectorBadgeStyles,
  isLockedByNiveau2,
  isMonthClosedForPlanning,
  makeExcelKeyHandler,
  handleToggleManualOverride,
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
        const rowsForPost = minageRowsByPost[p] || [];
        let globalIdxCounter = 0;

        return (
          <div key={p} className="border border-gray-200 bg-white p-4 shadow-sm rounded-xl">
            {/* Shifty/Post block banner */}
            <div className="flex flex-col items-center justify-center mb-5 mt-1 select-none">
              <h4 className="text-[13px] font-black uppercase tracking-[0.25em] flex items-center gap-2">
                <Hammer className="w-4 h-4 text-[#b8860b]" />
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
                    <th className="p-2.5 min-w-[124px] border-r border-slate-700/50 bg-gradient-to-b from-[#00BFFF]/20 to-[#00BFFF]/10 text-sky-200 font-bold tracking-wider">Chantier</th>
                    <th className="p-2.5 min-w-[144px] border-r border-slate-700/50 bg-gradient-to-b from-amber-950/45 to-amber-950/25 text-[#ffd700] font-bold tracking-wider">Mineur (Matricule / Nom)</th>
                    <th className="p-2.5 min-w-[144px] border-r border-slate-700/50 bg-gradient-to-b from-[#00BFFF]/15 to-[#00BFFF]/5 text-sky-200 font-bold tracking-wider">Aide-Mineur</th>
                    <th className="p-2.5 border-r border-slate-700/50 w-20 text-center bg-gradient-to-b from-red-950/40 to-red-950/20 text-rose-250 font-bold">Section</th>
                    <th className="p-2.5 border-r border-slate-700/50 w-24 text-center bg-slate-900/60 text-slate-300 font-bold">Type Barre</th>
                    <th className="p-2.5 border-r border-slate-700/50 w-20 text-center bg-gradient-to-b from-amber-950/15 to-transparent text-amber-200 font-bold">Métrage planifié</th>
                    <th className="p-2.5 border-r border-slate-700/50 w-16 text-center bg-slate-900/60 text-slate-300 font-bold">Trous prévus</th>
                    <th className="p-2.5 border-r border-slate-700/50 w-16 text-center bg-gradient-to-b from-amber-950/15 to-transparent text-amber-200 font-bold">ANFO (kg)</th>
                    <th className="p-2.5 border-r border-slate-700/50 w-16 text-center bg-slate-900/60 text-slate-300 font-bold">Tovex (kg)</th>
                    <th className="p-2.5 text-center w-16 bg-gradient-to-b from-red-950/15 to-transparent text-rose-220 font-bold">Amorces</th>
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
                        {/* Sector Header Badge Row */}
                        <tr className="bg-gray-50/80 border-y border-gray-200 select-none">
                          <td colSpan={11} className="py-2.5 px-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
                              
                              <div className="flex flex-wrap items-center gap-2 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => addRowToMinageSector(p, sec)}
                                  className="text-[9.5px] font-black text-white hover:bg-sky-600 bg-[#00BFFF] border border-transparent px-2.5 py-1.5 rounded transition-all cursor-pointer flex items-center gap-1 uppercase tracking-wider shadow-xs"
                                  title={`Ajouter un chantier de production à ${sec}`}
                                >
                                  + Ajouter Ligne
                                </button>

                                {/* Sector Chief Selection */}
                                {sec !== 'Autres / Non classés' && (
                                  <div className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-1 rounded-lg shadow-sm">
                                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">
                                      👨‍✈️ {p === 'Poste 1' ? 'Responsable de secteur' : 'Chef de poste'} :
                                    </span>
                                    <div className="w-56 text-black font-semibold text-[10.5px]">
                                      <MatriculeAutocomplete
                                        value={sectorChiefs[p]?.[sec] || ''}
                                        onChange={(matricule) => {
                                          setSectorChiefs((prev: any) => ({
                                            ...prev,
                                            [p]: {
                                              ...(prev[p] || {}),
                                              [sec]: matricule
                                            }
                                          }));
                                        }}
                                        employees={employees}
                                        sector={sec !== 'Autres / Non classés' ? sec : undefined}
                                        fonctions={['CHEF']}
                                        post={p}
                                        placeholder="Saisir Matricule Chef..."
                                      />
                                    </div>
                                  </div>
                                )}

                                {/* Sector Boutefeu Selection */}
                                {sec !== 'Autres / Non classés' && (
                                  p !== 'Poste 3' ? (
                                    <div className="flex items-center gap-2 bg-amber-50/75 border border-amber-200 px-3 py-1 rounded-lg shadow-sm">
                                      <span className="text-[9px] font-black text-amber-850 uppercase tracking-widest flex items-center gap-1 select-none">
                                        💣 Boutefeu :
                                      </span>
                                      <div className="w-56 text-black font-semibold text-[10.5px]">
                                        <MatriculeAutocomplete
                                          value={sectorBoutefeus[p]?.[sec] || ''}
                                          onChange={(matricule) => {
                                            setSectorBoutefeus((prev: any) => ({
                                              ...prev,
                                              [p]: {
                                                ...(prev[p] || {}),
                                                [sec]: matricule
                                              }
                                            }));
                                          }}
                                          employees={employees}
                                          fonctions={['BOUTEFEU']}
                                          post={p}
                                          placeholder="Saisir Boutefeu..."
                                        />
                                      </div>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 px-3 py-1 rounded-lg text-slate-500 text-[9px] font-black uppercase tracking-widest select-none">
                                      💤 Hors poste Boutefeu
                                    </div>
                                  )
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>

                        {sectorRowsWithIdx.map(({ row, idx: flatIdx }, sIdx) => {
                          const globalIdx = globalIdxCounter++;
                          const options = chantiers.filter(c => sec === 'Autres / Non classés' || isSectorMatching(c.sector, sec));
                          const hasChantier = options.some(o => o.id === row.chantierId);
                          const fallbackChantier = row.chantierId && !hasChantier ? chantiers.find(c => c.id === row.chantierId) : null;

                          // Evaluate row span dynamically
                          const isChild = !!(row.remarks && row.remarks.includes('(Volée'));
                          let rowSpan = 1;
                          if (!isChild) {
                            let nextIdx = sIdx + 1;
                            while (
                              nextIdx < sectorRowsWithIdx.length &&
                              sectorRowsWithIdx[nextIdx].row.remarks &&
                              sectorRowsWithIdx[nextIdx].row.remarks.includes('(Volée')
                            ) {
                              rowSpan++;
                              nextIdx++;
                            }
                          }

                          return (
                            <tr key={flatIdx} className="border-b border-gray-200 hover:bg-sky-50/20 transition-colors">
                              {/* Line Index & Delete Action */}
                              <td className="p-1 px-1.5 border-r border-gray-200 text-center text-[10.5px] text-gray-500 font-mono w-8 select-none relative group bg-gray-50/50">
                                <span className="group-hover:opacity-0 transition-opacity">{flatIdx + 1}</span>
                                {isMinageRowRemovable(p, flatIdx) && (
                                  <button
                                    type="button"
                                    onClick={() => deleteMinageRowAt(p, flatIdx)}
                                    className="absolute inset-x-0.5 top-0.5 bottom-0.5 bg-red-55 hover:bg-red-100 text-red-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded cursor-pointer text-[10.5px] font-black border-none outline-none"
                                    title="Retirer cette ligne"
                                  >
                                    🗑️
                                  </button>
                                )}
                              </td>

                              {/* Chantier */}
                              <td data-row={globalIdx} data-col={0} className="p-1 border-r border-gray-200 min-w-[124px] focus-within:ring-2 focus-within:ring-[#00BFFF]/50 focus-within:ring-inset focus-within:bg-sky-50/40">
                                <select
                                  value={row.chantierId}
                                  onChange={e => updateMinageCell(p, flatIdx, 'chantierId', e.target.value)}
                                  onKeyDown={makeExcelKeyHandler(globalIdx, 0)}
                                  className="w-full bg-transparent border-0 font-extrabold p-0.5 text-[11px] uppercase outline-none text-gray-800"
                                >
                                  <option value="">(Vide)</option>
                                  {fallbackChantier && (
                                    <option value={fallbackChantier.id}>
                                      {fallbackChantier.name || fallbackChantier.id} (Hors-sec)
                                    </option>
                                  )}
                                  {options.map(c => (
                                    <option key={c.id} value={c.id}>{c.name || c.id}</option>
                                  ))}
                                </select>
                              </td>

                              {/* Mineur */}
                              {!isChild && (
                                <td rowSpan={rowSpan} data-row={globalIdx} data-col={1} className="p-0.5 border-r border-gray-200 min-w-[180px] focus-within:ring-2 focus-within:ring-[#00BFFF]/50 focus-within:ring-inset focus-within:bg-sky-50/40 align-middle">
                                  <MatriculeAutocomplete
                                    value={row.minerMatricule}
                                    onChange={(matricule) => updateMinageCell(p, flatIdx, 'minerMatricule', matricule)}
                                    employees={employees}
                                    sector={sec !== 'Autres / Non classés' ? sec : undefined}
                                    fonctions={['MINEUR']}
                                    alternativeFonctions={['AIDE_MINEUR']}
                                    post={p}
                                    placeholder="M-..."
                                    onKeyDown={makeExcelKeyHandler(globalIdx, 1)}
                                  />
                                </td>
                              )}

                              {/* Aide-Mineur */}
                              {!isChild && (
                                <td rowSpan={rowSpan} data-row={globalIdx} data-col={2} className="p-0.5 border-r border-gray-200 min-w-[180px] focus-within:ring-2 focus-within:ring-[#00BFFF]/50 focus-within:ring-inset focus-within:bg-sky-50/40 align-middle">
                                  <MatriculeAutocomplete
                                    value={row.assistantMatricule}
                                    onChange={(matricule) => updateMinageCell(p, flatIdx, 'assistantMatricule', matricule)}
                                    employees={employees}
                                    sector={sec !== 'Autres / Non classés' ? sec : undefined}
                                    fonctions={['AIDE_MINEUR']}
                                    post={p}
                                    placeholder="M-..."
                                    onKeyDown={makeExcelKeyHandler(globalIdx, 2)}
                                  />
                                </td>
                              )}

                              {/* Section */}
                              <td data-row={globalIdx} data-col={3} className="p-1 border-r border-gray-200 w-20 text-center focus-within:ring-2 focus-within:ring-[#00BFFF]/50 focus-within:ring-inset focus-within:bg-sky-50/40">
                                <select
                                  value={row.gallerySize}
                                  onChange={e => updateMinageCell(p, flatIdx, 'gallerySize', Number(e.target.value))}
                                  onKeyDown={makeExcelKeyHandler(globalIdx, 3)}
                                  className="w-full bg-transparent border-none text-center outline-none font-bold text-gray-800 text-[11px]"
                                >
                                  <option value={9}>9 m²</option>
                                  <option value={12}>12 m²</option>
                                </select>
                              </td>

                              {/* Type Barre */}
                              {!isChild && (
                                <td rowSpan={rowSpan} className="p-1 border-r border-gray-200 w-24 text-center focus-within:ring-2 focus-within:ring-[#00BFFF]/50 focus-within:ring-inset focus-within:bg-sky-50/40 align-middle">
                                  <select
                                    value={row.barType || '1.8m'}
                                    onChange={e => updateMinageCell(p, flatIdx, 'barType', e.target.value)}
                                    className="w-full bg-transparent border-none text-center outline-none font-bold text-gray-800 text-[11px]"
                                  >
                                    <option value="1.8m">1.8m</option>
                                    <option value="2.4m">2.4m</option>
                                  </select>
                                </td>
                              )}

                              {/* Mètres prévus */}
                              {!isChild && (
                                <td rowSpan={rowSpan} className="p-1 border-r border-gray-200 w-20 text-center font-mono font-extrabold text-blue-600 bg-gray-50/80 select-none align-middle animate-fade-in">
                                  {(row.meterage || 0).toFixed(1)} m
                                </td>
                              )}

                              {/* Trous prévus */}
                              <td data-row={globalIdx} data-col={5} className="p-1 border-r border-gray-200 w-16 text-center relative group/trous focus-within:ring-2 focus-within:ring-[#00BFFF]/50 focus-within:ring-inset focus-within:bg-sky-50/40">
                                {row.explosivesManualOverride ? (
                                  <div className="flex items-center justify-center gap-1">
                                    <input
                                      type="number"
                                      value={row.plannedHoles}
                                      onChange={e => updateMinageCell(p, flatIdx, 'plannedHoles', Number(e.target.value))}
                                      onKeyDown={makeExcelKeyHandler(globalIdx, 5)}
                                      className="w-full bg-transparent text-center font-mono font-bold text-[11px] outline-none border-none py-0.5 text-red-650"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleToggleManualOverride(p, flatIdx)}
                                      className="text-red-500 font-extrabold cursor-pointer hover:scale-125 transition-transform"
                                      title="Clic pour repasser au calcul automatique"
                                    >
                                      *
                                    </button>
                                  </div>
                                ) : (
                                  <div
                                    onDoubleClick={() => handleToggleManualOverride(p, flatIdx)}
                                    className="cursor-pointer font-bold text-[11px] text-center select-none py-1 hover:bg-sky-50 w-full text-slate-800"
                                    title="Double-clic pour modifier manuellement"
                                  >
                                    {row.plannedHoles}
                                  </div>
                                )}

                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/trous:block w-72 bg-slate-950 text-slate-100 text-[10.5px] p-3 rounded-xl shadow-2xl z-50 border border-slate-800 pointer-events-none transition-all duration-200 text-left">
                                  <div className="font-extrabold text-[#00BFFF] uppercase tracking-wider text-[9px] mb-1">
                                    ℹ️ Spécifications de Tir & Forage
                                  </div>
                                  <p className="font-semibold leading-relaxed text-slate-250">
                                    {row.gallerySize === 12 ? (
                                      <>Le gabarit de foration théorique pour <strong className="text-white">12m²</strong> est de <strong className="text-white font-black">38 trous</strong>, mais seuls <strong className="text-[#00BFFF] font-black">32 trous sont chargés</strong> (ce qui explique pourquoi <strong className="text-white font-black">32</strong> s'affiche pour le chargement et les amorces).</>
                                    ) : (
                                      <>Le gabarit de foration théorique pour <strong className="text-white">9m²</strong> est de <strong className="text-white font-black">28 trous</strong>, mais seuls <strong className="text-[#00BFFF] font-black">26 trous sont chargés</strong> (ce qui explique pourquoi <strong className="text-white font-black">26</strong> s'affiche pour le chargement et les amorces).</>
                                    )}
                                  </p>
                                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-950"></div>
                                </div>
                              </td>

                              {/* ANFO */}
                              <td data-row={globalIdx} data-col={6} className="p-1 border-r border-gray-200 w-16 text-center focus-within:ring-2 focus-within:ring-[#00BFFF]/50 focus-within:ring-inset focus-within:bg-sky-50/40">
                                {row.explosivesManualOverride ? (
                                  <div className="flex items-center justify-center gap-1">
                                    <input
                                      type="number"
                                      value={row.anfo}
                                      onChange={e => updateMinageCell(p, flatIdx, 'anfo', Number(e.target.value))}
                                      onKeyDown={makeExcelKeyHandler(globalIdx, 6)}
                                      className="w-full bg-transparent text-center font-mono font-bold text-[11px] outline-none border-none py-0.5 text-red-650"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleToggleManualOverride(p, flatIdx)}
                                      className="text-red-500 font-extrabold cursor-pointer hover:scale-125 transition-transform"
                                      title="Clic pour repasser au calcul automatique"
                                    >
                                      *
                                    </button>
                                  </div>
                                ) : (
                                  <div
                                    onDoubleClick={() => handleToggleManualOverride(p, flatIdx)}
                                    className="cursor-pointer font-bold text-[11px] text-center select-none py-1 hover:bg-sky-50 w-full text-slate-800"
                                    title="Double-clic pour modifier manuellement"
                                  >
                                    {row.anfo}
                                  </div>
                                )}
                              </td>

                              {/* Tovex */}
                              <td data-row={globalIdx} data-col={7} className="p-1 border-r border-gray-200 w-16 text-center focus-within:ring-2 focus-within:ring-[#00BFFF]/50 focus-within:ring-inset focus-within:bg-sky-50/40">
                                {row.explosivesManualOverride ? (
                                  <div className="flex items-center justify-center gap-1">
                                    <input
                                      type="number"
                                      step="0.5"
                                      value={row.tovex}
                                      onChange={e => updateMinageCell(p, flatIdx, 'tovex', Number(e.target.value))}
                                      onKeyDown={makeExcelKeyHandler(globalIdx, 7)}
                                      className="w-full bg-transparent text-center font-mono font-bold text-[11px] outline-none border-none py-0.5 text-red-650"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleToggleManualOverride(p, flatIdx)}
                                      className="text-red-500 font-extrabold cursor-pointer hover:scale-125 transition-transform"
                                      title="Clic pour repasser au calcul automatique"
                                    >
                                      *
                                    </button>
                                  </div>
                                ) : (
                                  <div
                                    onDoubleClick={() => handleToggleManualOverride(p, flatIdx)}
                                    className="cursor-pointer font-bold text-[11px] text-center select-none py-1 hover:bg-sky-50 w-full text-slate-800"
                                    title="Double-clic pour modifier manuellement"
                                  >
                                    {(row.tovex || 0).toFixed(1)}
                                  </div>
                                )}
                              </td>

                              {/* Amorces */}
                              <td data-row={globalIdx} data-col={8} className="p-1 border-r border-gray-200 w-16 text-center focus-within:ring-2 focus-within:ring-[#00BFFF]/50 focus-within:ring-inset focus-within:bg-sky-50/40">
                                {row.explosivesManualOverride ? (
                                  <div className="flex items-center justify-center gap-1">
                                    <input
                                      type="number"
                                      value={row.ammorces}
                                      onChange={e => updateMinageCell(p, flatIdx, 'ammorces', Number(e.target.value))}
                                      onKeyDown={makeExcelKeyHandler(globalIdx, 8)}
                                      className="w-full bg-transparent text-center font-mono font-bold text-[11px] outline-none border-none py-0.5 text-red-655"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleToggleManualOverride(p, flatIdx)}
                                      className="text-red-500 font-extrabold cursor-pointer hover:scale-125 transition-transform"
                                      title="Clic pour repasser au calcul automatique"
                                    >
                                      *
                                    </button>
                                  </div>
                                ) : (
                                  <div
                                    onDoubleClick={() => handleToggleManualOverride(p, flatIdx)}
                                    className="cursor-pointer font-bold text-[11px] text-center select-none py-1 hover:bg-sky-50 w-full text-slate-800"
                                    title="Double-clic pour modifier manuellement"
                                  >
                                    {row.ammorces}
                                  </div>
                                )}
                              </td>

                              {/* Hidden Remarks */}
                              <td className="hidden">
                                <input
                                  type="text"
                                  value={row.remarks || ''}
                                  onChange={e => updateMinageCell(p, flatIdx, 'remarks', e.target.value)}
                                  onKeyDown={makeExcelKeyHandler(globalIdx, 9)}
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

            {/* Dynamic Explosives Summary Bento Cards Per Post */}
            <div className="mt-4 border-t border-dashed border-gray-200 pt-3 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 p-3.5 rounded-lg select-none">
              <span className="text-[10.5px] font-black uppercase text-slate-600 tracking-wider flex items-center gap-1.5">
                🧨 Bilan Estimé des Explosifs ({p}) :
              </span>
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-1.5 bg-white border border-gray-200 py-1 px-2.5 rounded shadow-xs">
                  <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider">ANFO</span>
                  <strong className="text-xs font-black text-slate-800">
                    {rowsForPost.reduce((sum, r) => sum + (Number(r.anfo) || 0), 0)} kg
                  </strong>
                </div>
                <div className="flex items-center gap-1.5 bg-white border border-gray-200 py-1 px-2.5 rounded shadow-xs">
                  <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider">Tovex</span>
                  <strong className="text-xs font-black text-[#8B0000]">
                    {rowsForPost.reduce((sum, r) => sum + (Number(r.tovex) || 0), 0).toFixed(2)} kg
                  </strong>
                </div>
                <div className="flex items-center gap-1.5 bg-white border border-gray-200 py-1 px-2.5 rounded shadow-xs">
                  <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider">Amorces / Déto</span>
                  <strong className="text-xs font-black text-[#00BFFF]">
                    {rowsForPost.reduce((sum, r) => sum + (Number(r.ammorces) || 0), 0)} u.
                  </strong>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
