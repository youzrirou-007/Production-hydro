import React from 'react';
import { Copy, Plus, AlertTriangle, Lock, Pencil, Layers, Gauge } from 'lucide-react';
import { ExcelRow } from '../../lib/productionUtils';
import { ExcelExtraction } from '../../types/mining';
import { EmployeeCell, renderTimeSelect, handleKeyDown } from './EmployeeCell';

interface ExtractionShiftPanelProps {
  shiftName: string;
  extractionRows: ExcelRow<ExcelExtraction>[];
  activeEmployees: any[];
  structureEditMode: boolean;
  getEmployeeName: (matricule: string) => string;
  getPostChiefName: (post: string) => string;
  addExtractionRow: (post: string) => void;
  copyExtractionPlanToReel: (post: string, idx: number) => void;
  copyAllExtractionPlanToReel: (post: string) => void;
  updateExtractionCell: (post: string, idx: number, key: keyof ExcelExtraction, value: any) => void;
}

export const ExtractionShiftPanel: React.FC<ExtractionShiftPanelProps> = ({
  shiftName,
  extractionRows,
  activeEmployees,
  structureEditMode,
  getEmployeeName,
  getPostChiefName,
  addExtractionRow,
  copyExtractionPlanToReel,
  copyAllExtractionPlanToReel,
  updateExtractionCell
}) => {
  const rowWrapper = extractionRows[0];
  const chiefName = getPostChiefName(shiftName);

  return (
    <div className="border border-slate-200 bg-white p-5 rounded-lg shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-3 gap-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">
            {shiftName === 'Poste 1' ? '☀️' : shiftName === 'Poste 2' ? '⛅' : '🌙'}
          </span>
          <h4 className="text-sm font-black uppercase text-slate-800 tracking-wider">
            {shiftName === 'Poste 1' ? 'POSTE 1 : MATIN' : shiftName === 'Poste 2' ? 'POSTE 2 : APRÈS-MIDI' : 'POSTE 3 : NUIT'}
          </h4>
          <span className="font-mono text-xs font-bold text-slate-400 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
            {shiftName === 'Poste 1' ? '07:00 - 14:00 GMT' : shiftName === 'Poste 2' ? '15:00 - 22:00 GMT' : '23:00 - 06:00 GMT'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => copyAllExtractionPlanToReel(shiftName)}
            className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-[10px] font-black uppercase tracking-wider rounded flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
          >
            <Copy className="w-3.5 h-3.5 text-amber-600" /> Copier Tout le Plan
          </button>
          {structureEditMode && (
            <button
              type="button"
              onClick={() => addExtractionRow(shiftName)}
              className="bg-[#00BFFF] hover:bg-[#00BFFF]/95 text-white font-black text-[10px] uppercase px-3 py-1.5 flex items-center gap-1.5 transition-all shadow-sm rounded cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Ajouter une ligne ({shiftName})
            </button>
          )}
        </div>
      </div>

      <div className="bg-slate-50 px-4 py-2 border border-slate-200 rounded flex items-center gap-3">
        <span className="text-[10px] bg-[#8B0000] text-white px-2 py-1 font-black uppercase rounded-xs">
          Chef de Sec (Imiter Est) / Poste
        </span>
        <span className="text-xs font-bold text-slate-800">
          {chiefName || "(Aucun affecté)"}
        </span>
      </div>

      <div className="max-w-4xl mx-auto">
        {!rowWrapper ? (
          <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-6 text-center max-w-xl mx-auto my-4 shadow-xs" id={`empty_extraction_plan_${shiftName.replace(/\s+/g, '_')}`}>
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
              <AlertTriangle className="w-6 h-6 text-amber-600" />
            </div>
            <h4 className="text-xs font-black uppercase text-amber-900 tracking-wider mb-2">
              Planification Non Saisie — {shiftName}
            </h4>
            <p className="text-[11px] text-amber-800 font-bold leading-relaxed">
              Aucune planification d'extraction (treuil, wagonnage) n'a été enregistrée pour le <span className="underline">{shiftName}</span> à cette date.
              Veuillez d'abord planifier l'extraction dans le <span className="underline">Planning Journalier</span> pour pouvoir ajouter le réalisé.
            </p>
          </div>
        ) : (() => {
          const row = rowWrapper.reel;
          const plan = rowWrapper.plan;
          const idx = 0;

          const freqMin = row.wagonsActual > 0 ? (360 / row.wagonsActual).toFixed(1) + ' min' : '0 min';
          const targetVal = row.wagonsTarget !== undefined && row.wagonsTarget !== null ? Number(row.wagonsTarget) : 48;

          const pTreuillisteName = getEmployeeName(plan.treuilliste);
          const rTreuillisteName = getEmployeeName(row.treuilliste);

          const pEq1Name = getEmployeeName(plan.equipier1);
          const rEq1Name = getEmployeeName(row.equipier1);

          const pEq2Name = getEmployeeName(plan.equipier2);
          const rEq2Name = getEmployeeName(row.equipier2);

          const pEq3Name = getEmployeeName(plan.equipier3);
          const rEq3Name = getEmployeeName(row.equipier3);

          const pEq4Name = getEmployeeName(plan.equipier4);
          const rEq4Name = getEmployeeName(row.equipier4);

          const treuillisteMismatch = !!(row.treuilliste && plan.treuilliste && row.treuilliste.trim().toUpperCase() !== plan.treuilliste.trim().toUpperCase());
          const eq1Mismatch = !!(row.equipier1 && plan.equipier1 && row.equipier1.trim().toUpperCase() !== plan.equipier1.trim().toUpperCase());
          const eq2Mismatch = !!(row.equipier2 && plan.equipier2 && row.equipier2.trim().toUpperCase() !== plan.equipier2.trim().toUpperCase());
          const eq3Mismatch = !!(row.equipier3 && plan.equipier3 && row.equipier3.trim().toUpperCase() !== plan.equipier3.trim().toUpperCase());
          const eq4Mismatch = !!(row.equipier4 && plan.equipier4 && row.equipier4.trim().toUpperCase() !== plan.equipier4.trim().toUpperCase());
          const hasMismatch = treuillisteMismatch || eq1Mismatch || eq2Mismatch || eq3Mismatch || eq4Mismatch;

          const wagonsTarget = (row.wagonsTarget !== undefined && row.wagonsTarget !== null) ? Number(row.wagonsTarget) : 48;
          const realWagons = row.wagonsActual || 0;
          const realPct = wagonsTarget > 0 ? (realWagons / wagonsTarget) * 100 : 0;
          const diffWagonsPct = wagonsTarget > 0 ? ((realWagons - wagonsTarget) / wagonsTarget) * 100 : 0;

          let speedLabel = 'SOUS-KPI';
          let speedColor = 'bg-rose-950/50 text-rose-300 border-rose-800 animate-pulse';
          if (wagonsTarget === 0) {
            if (realWagons === 0) {
              speedLabel = "PAS D'EXTRACTION PRÉVUE";
              speedColor = 'bg-slate-800/80 text-slate-400 border-slate-700';
            } else {
              speedLabel = 'EXTRACTION NON PLANIFIÉE';
              speedColor = 'bg-emerald-950/50 text-emerald-300 border-emerald-800';
            }
          } else if (diffWagonsPct >= 0) {
            speedLabel = 'CIBLE ATTEINTE';
            speedColor = 'bg-emerald-950/50 text-emerald-300 border-emerald-800';
          } else if (diffWagonsPct >= -15) {
            speedLabel = 'CORRECT';
            speedColor = 'bg-blue-950/50 text-blue-300 border-blue-800';
          }

          const getHoursBetween = (start: string, end: string) => {
            if (!start || !end) return 6.5;
            const [h1, m1] = start.split(':').map(Number);
            const [h2, m2] = end.split(':').map(Number);
            const mDifference = (h2 * 60 + m2) - (h1 * 60 + m1);
            const hours = mDifference / 60;
            return hours > 0 ? hours : 6.5;
          };
          const durationHours = getHoursBetween(row.startTime || '07:00', row.endTime || '14:00');
          const cadence = durationHours > 0 ? (realWagons / durationHours) : 0;

          return (
            <div 
              data-card-container="true"
              className="bg-[#F5F5F0] border-2 border-[#141414] p-6 shadow-[4px_4px_0px_0px_#141414] hover:shadow-[6px_6px_0px_0px_#141414] transition-all duration-150 flex flex-col space-y-6 rounded-lg"
            >
              <div className="border-b-2 border-[#141414] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-[10px] font-black uppercase bg-[#8B0000] text-white px-2 py-1 font-mono tracking-wider rounded-xs">
                    Poste Unique Consolidé
                  </span>
                  <h3 className="text-lg font-black uppercase text-slate-900 mt-1">
                    Extraction Bure N340 Imiter Est
                  </h3>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {hasMismatch && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-black uppercase bg-amber-100 text-amber-900 border border-amber-300 rounded leading-none select-none animate-pulse" title="La composition réelle diffère de la planification">
                      ⚠️ Équipe ≠ Plan
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 text-[10px] font-black bg-emerald-600 text-white px-3 py-1 uppercase border border-[#141414]">
                    <Layers className="w-3.5 h-3.5 text-white" /> Treuils
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="space-y-4 bg-slate-200/50 p-4 border border-[#141414]/30 rounded">
                  <div className="flex items-center gap-1.5 border-b border-[#141414]/25 pb-1">
                    <Lock className="w-4 h-4 text-slate-500" />
                    <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider">
                      1. Planification
                    </h4>
                  </div>

                  <div className="space-y-3 text-[11px] font-bold text-slate-600">
                    <div>
                      <span className="block text-[8px] font-black text-slate-500 uppercase leading-none">Treuilliste Prévu</span>
                      <span className="font-mono text-slate-800 text-xs block truncate mt-0.5" title={pTreuillisteName}>
                        {plan.treuilliste ? `${plan.treuilliste} - ${pTreuillisteName.split(' (')[0]}` : '(Aucun)'}
                      </span>
                    </div>

                    <div>
                      <span className="block text-[8px] font-black text-slate-500 uppercase leading-none">Équipe Prévue</span>
                      <ul className="space-y-1 mt-1 font-mono text-slate-800">
                        <li className="truncate" title={pEq1Name}>{plan.equipier1 ? `• ${plan.equipier1} - ${pEq1Name.split(' (')[0]}` : '• Éq 1: (Vide)'}</li>
                        <li className="truncate" title={pEq2Name}>{plan.equipier2 ? `• ${plan.equipier2} - ${pEq2Name.split(' (')[0]}` : '• Éq 2: (Vide)'}</li>
                        <li className="truncate" title={pEq3Name}>{plan.equipier3 ? `• ${plan.equipier3} - ${pEq3Name.split(' (')[0]}` : '• Éq 3: (Vide)'}</li>
                        <li className="truncate" title={pEq4Name}>{plan.equipier4 ? `• ${plan.equipier4} - ${pEq4Name.split(' (')[0]}` : '• Éq 4: (Vide)'}</li>
                      </ul>
                    </div>

                    <div className="pt-2 border-t border-[#141414]/10 grid grid-cols-2 gap-2">
                      <div>
                        <span className="block text-[8px] font-black text-slate-500 uppercase leading-none">Cible Wagons</span>
                        <span className="font-mono text-slate-900 text-xs font-black">{plan.wagonsTarget || 48} Wg</span>
                      </div>
                      <div>
                        <span className="block text-[8px] font-black text-slate-500 uppercase leading-none">Shift Prévu</span>
                        <span className="font-mono text-slate-900 text-xs font-black">{plan.startTime || '08:00'} - {plan.endTime || '13:30'}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 bg-white p-4 border-2 border-[#141414] rounded shadow-sm">
                  <div className="flex items-center gap-1.5 border-b border-[#141414]/25 pb-1">
                    <Pencil className="w-4 h-4 text-[#00BFFF]" />
                    <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">
                      2. Réalisé (Saisie)
                    </h4>
                  </div>

                  <div className="space-y-3 text-[11px]">
                    <div>
                      <label className="block text-[8px] font-black text-slate-500 uppercase leading-none mb-1">
                        Treuilliste Réel
                      </label>
                      <EmployeeCell
                        matricule={row.treuilliste || ''}
                        name={rTreuillisteName}
                        onChange={(mat) => updateExtractionCell(shiftName, idx, 'treuilliste', mat)}
                        employees={activeEmployees}
                        onKeyDown={handleKeyDown}
                        placeholder="T..."
                      />
                      {treuillisteMismatch && (
                        <span className="text-[8px] font-black text-amber-600 block mt-0.5 animate-pulse">
                          ⚠️ Diffère du plan (Plan : {plan.treuilliste || '(Vide)'})
                        </span>
                      )}
                    </div>

                    <div>
                      <label className="block text-[8px] font-black text-slate-500 uppercase leading-none mb-1">
                        Équipiers Réels (4 Personnes)
                      </label>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <EmployeeCell
                            matricule={row.equipier1 || ''}
                            name={rEq1Name}
                            onChange={(mat) => updateExtractionCell(shiftName, idx, 'equipier1', mat)}
                            onKeyDown={handleKeyDown}
                            employees={activeEmployees}
                            placeholder="Eq1..."
                          />
                          {eq1Mismatch && (
                            <span className="text-[7px] font-black text-amber-600 block truncate" title={`Plan : ${plan.equipier1 || '(Vide)'}`}>
                              ⚠️ Plan : {plan.equipier1 || 'Vide'}
                            </span>
                          )}
                        </div>

                        <div>
                          <EmployeeCell
                            matricule={row.equipier2 || ''}
                            name={rEq2Name}
                            onChange={(mat) => updateExtractionCell(shiftName, idx, 'equipier2', mat)}
                            onKeyDown={handleKeyDown}
                            employees={activeEmployees}
                            placeholder="Eq2..."
                          />
                          {eq2Mismatch && (
                            <span className="text-[7px] font-black text-amber-600 block truncate" title={`Plan : ${plan.equipier2 || '(Vide)'}`}>
                              ⚠️ Plan : {plan.equipier2 || 'Vide'}
                            </span>
                          )}
                        </div>

                        <div>
                          <EmployeeCell
                            matricule={row.equipier3 || ''}
                            name={rEq3Name}
                            onChange={(mat) => updateExtractionCell(shiftName, idx, 'equipier3', mat)}
                            onKeyDown={handleKeyDown}
                            employees={activeEmployees}
                            placeholder="Eq3..."
                          />
                          {eq3Mismatch && (
                            <span className="text-[7px] font-black text-amber-600 block truncate" title={`Plan : ${plan.equipier3 || '(Vide)'}`}>
                              ⚠️ Plan : {plan.equipier3 || 'Vide'}
                            </span>
                          )}
                        </div>

                        <div>
                          <EmployeeCell
                            matricule={row.equipier4 || ''}
                            name={rEq4Name}
                            onChange={(mat) => updateExtractionCell(shiftName, idx, 'equipier4', mat)}
                            onKeyDown={handleKeyDown}
                            employees={activeEmployees}
                            placeholder="Eq4..."
                          />
                          {eq4Mismatch && (
                            <span className="text-[7px] font-black text-amber-600 block truncate" title={`Plan : ${plan.equipier4 || '(Vide)'}`}>
                              ⚠️ Plan : {plan.equipier4 || 'Vide'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#141414]/10">
                      <div className="bg-slate-50 border border-slate-200 p-1.5 rounded">
                        <span className="block text-[8px] font-black text-slate-500 uppercase leading-none">Wagons Réels</span>
                        <input
                          type="number"
                          min="0"
                          value={row.wagonsActual === 0 ? '' : row.wagonsActual}
                          placeholder="0"
                          onKeyDown={handleKeyDown}
                          onChange={e => updateExtractionCell(shiftName, idx, 'wagonsActual', Number(e.target.value))}
                          className="w-full text-xs font-black text-center text-emerald-950 font-mono outline-none bg-transparent"
                        />
                      </div>
                      <div className="bg-slate-50 border border-slate-200 p-1.5 rounded">
                        <span className="block text-[8px] font-black text-slate-500 uppercase leading-none">Stérile (Wg)</span>
                        <input
                          type="number"
                          min="0"
                          value={row.sterileBureImiterEst === 0 ? '' : row.sterileBureImiterEst}
                          placeholder="0"
                          onKeyDown={handleKeyDown}
                          onChange={e => updateExtractionCell(shiftName, idx, 'sterileBureImiterEst', Number(e.target.value))}
                          className="w-full text-xs font-black text-center text-slate-800 font-mono outline-none bg-transparent"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-slate-50 border border-slate-200 p-1.5 rounded">
                        <span className="block text-[8px] font-black text-slate-500 uppercase leading-none">Début Réel</span>
                        {renderTimeSelect(row.startTime || '', (val) => updateExtractionCell(shiftName, idx, 'startTime', val))}
                      </div>
                      <div className="bg-slate-50 border border-slate-200 p-1.5 rounded">
                        <span className="block text-[8px] font-black text-slate-500 uppercase leading-none">Fin Réelle</span>
                        {renderTimeSelect(row.endTime || '', (val) => updateExtractionCell(shiftName, idx, 'endTime', val))}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4 bg-[#141414] text-white p-4 border border-[#141414] rounded shadow-md flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 border-b border-white/20 pb-1 mb-3">
                      <Gauge className="w-4 h-4 text-[#00BFFF]" />
                      <h4 className="text-xs font-black uppercase text-sky-400 tracking-wider">
                        3. Écarts & Cadence
                      </h4>
                    </div>

                    <div className="space-y-4 text-[11px] font-mono select-none">
                      <div className="space-y-1.5 font-bold">
                        <div className="flex justify-between text-slate-300">
                          <span className="text-[8px] font-black uppercase">Réalisation Objectif</span>
                          <span className="font-mono text-white font-extrabold">{realWagons} / {wagonsTarget} Wg</span>
                        </div>
                        <div className="flex items-center justify-between gap-1 mt-1">
                          <span className="text-[8px] text-slate-400 font-bold uppercase">Écart vs Objectif</span>
                          <span className={`inline-flex px-2 py-0.5 border text-[9px] font-black uppercase rounded ${speedColor}`}>
                            {wagonsTarget === 0 ? (realWagons === 0 ? "PAS D'EXTRACTION PRÉVUE" : `+${realWagons} Wg — ${speedLabel}`) : `${diffWagonsPct > 0 ? '+' : ''}${diffWagonsPct.toFixed(1)}% — ${speedLabel}`}
                          </span>
                        </div>
                        <div className="w-full bg-slate-800 h-2 border border-white/10 rounded overflow-hidden mt-1">
                          <div 
                            className={`h-full transition-all duration-300 ${wagonsTarget === 0 ? (realWagons === 0 ? 'bg-slate-600' : 'bg-emerald-500') : (diffWagonsPct >= 0 ? 'bg-emerald-500' : diffWagonsPct >= -15 ? 'bg-[#00BFFF]' : 'bg-[#8B0000]')}`} 
                            style={{ width: `${wagonsTarget === 0 ? (realWagons === 0 ? 0 : 100) : Math.min(100, Math.max(0, realPct))}%` }}
                          ></div>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2 text-slate-200 font-bold">
                        <div className="bg-white/5 p-2 rounded border border-white/10">
                          <span className="block text-[8.5px] font-black text-slate-500 uppercase">Cadence</span>
                          <strong className="text-white text-xs font-black font-mono block mt-0.5">{cadence.toFixed(2)} Wg/h</strong>
                        </div>
                        <div className="bg-white/5 p-2 rounded border border-white/10">
                          <span className="block text-[8.5px] font-black text-slate-500 uppercase">Fréquence</span>
                          <strong className="text-white text-xs font-black font-mono block mt-0.5">{freqMin}</strong>
                        </div>
                      </div>

                      {hasMismatch && (
                        <div className="bg-amber-950/40 border border-amber-500/30 text-amber-200 p-2 rounded text-[9.5px] leading-relaxed">
                          <strong>Notice :</strong> Des changements d'affectation ont été détectés par rapport à la planification théorique de cette équipe.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/10 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => copyExtractionPlanToReel(shiftName, idx)}
                      className="px-3 py-1.5 text-[10px] font-black uppercase bg-[#00BFFF] hover:bg-[#00BFFF]/90 text-[#141414] border border-black rounded flex items-center gap-1.5 shadow-sm transition-all cursor-pointer font-sans"
                      title="Copier les structures d'affection de planification vers le réel"
                    >
                      <Copy className="w-3 h-3 text-[#141414]" /> Copier Plan ➔ Réel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
      </div>
    </div>
  );
};
