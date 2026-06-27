import React from 'react';
import { TrendingUp } from 'lucide-react';
import { ExcelRow } from '../../lib/productionUtils';
import { ExcelExtraction } from '../../types/mining';
import { ExtractionShiftPanel } from './ExtractionShiftPanel';

interface ProductionExtractionTableProps {
  p1ExtractionRows: ExcelRow<ExcelExtraction>[];
  p2ExtractionRows: ExcelRow<ExcelExtraction>[];
  p3ExtractionRows: ExcelRow<ExcelExtraction>[];
  activeEmployees: any[];
  structureEditMode: boolean;
  getEmployeeName: (matricule: string) => string;
  getPostChiefName: (post: string) => string;
  addExtractionRow: (post: string) => void;
  copyExtractionPlanToReel: (post: string, idx: number) => void;
  copyAllExtractionPlanToReel: (post: string) => void;
  updateExtractionCell: (post: string, idx: number, key: keyof ExcelExtraction, value: any) => void;
}

export const ProductionExtractionTable: React.FC<ProductionExtractionTableProps> = ({
  p1ExtractionRows,
  p2ExtractionRows,
  p3ExtractionRows,
  activeEmployees,
  structureEditMode,
  getEmployeeName,
  getPostChiefName,
  addExtractionRow,
  copyExtractionPlanToReel,
  copyAllExtractionPlanToReel,
  updateExtractionCell
}) => {
  const shiftsList = [
    { id: 'Poste 1', name: 'Poste 1 (Matin)', rows: p1ExtractionRows },
    { id: 'Poste 2', name: 'Poste 2 (Après-midi)', rows: p2ExtractionRows },
    { id: 'Poste 3', name: 'Poste 3 (Nuit)', rows: p3ExtractionRows },
  ];

  const stats = shiftsList.map(s => {
    const wagons = s.rows.reduce((sum, r) => sum + (Number(r.reel.wagonsActual) || 0), 0);
    const target = s.rows.reduce((sum, r) => sum + (r.reel.wagonsTarget !== undefined && r.reel.wagonsTarget !== null ? Number(r.reel.wagonsTarget) : 48), 0);
    const sterile = s.rows.reduce((sum, r) => sum + (Number(r.reel.sterileBureImiterEst) || 0), 0);
    const totalWag = wagons + sterile;
    const diffWagonsPct = target > 0 ? ((wagons - target) / target) * 100 : 0;
    const sterilePct = totalWag > 0 ? ((sterile / totalWag) * 100).toFixed(1) : '0';
    return { name: s.name, wagons, target, sterile, totalWag, diffWagonsPct, sterilePct };
  });

  const totalWagons = stats.reduce((sum, e) => sum + e.wagons, 0);
  const totalTarget = stats.reduce((sum, e) => sum + e.target, 0);
  const totalSterile = stats.reduce((sum, e) => sum + e.sterile, 0);
  const totalTransferred = totalWagons + totalSterile;
  const totalDiffWagonsPct = totalTarget > 0 ? ((totalWagons - totalTarget) / totalTarget) * 100 : 0;
  const totalSterilePct = totalTransferred > 0 ? ((totalSterile / totalTransferred) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-8 pb-12">
      {shiftsList.map(s => (
        <ExtractionShiftPanel
          key={s.id}
          shiftName={s.id}
          extractionRows={s.rows}
          activeEmployees={activeEmployees}
          structureEditMode={structureEditMode}
          getEmployeeName={getEmployeeName}
          getPostChiefName={getPostChiefName}
          addExtractionRow={addExtractionRow}
          copyExtractionPlanToReel={copyExtractionPlanToReel}
          copyAllExtractionPlanToReel={copyAllExtractionPlanToReel}
          updateExtractionCell={updateExtractionCell}
        />
      ))}

      {/* DAILY CONSOLIDATED SUMMARY TABLE FOR EXTRACTION */}
      <div className="border border-slate-300 rounded overflow-hidden shadow-sm bg-white p-6 space-y-4">
        <div className="flex items-center gap-2 border-b pb-3">
          <TrendingUp className="w-5 h-5 text-[#8B0000]" />
          <h3 className="text-sm font-black uppercase text-slate-800 tracking-wider">
            Tableau Récapitulatif Global d'Extraction (Tout Postes Confondus - Jour J)
          </h3>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse border border-slate-250 text-xs">
            <thead>
              <tr className="bg-slate-800 text-white text-[10px] font-black uppercase tracking-wider">
                <th className="p-3 border border-slate-350 bg-slate-900">Poste / Shift</th>
                <th className="p-3 text-center border border-slate-350 text-emerald-100 bg-emerald-950/30">Wagons Chargés (u)</th>
                <th className="p-3 text-center border border-slate-350 bg-slate-700 font-bold">Objectif du Poste (u)</th>
                <th className="p-3 text-center border border-slate-350 text-amber-100 bg-amber-950/30 font-bold">Stérile Extrait (Wagons)</th>
                <th className="p-3 text-center border border-slate-350 bg-slate-700">Total Wagons Transférés (u)</th>
                <th className="p-3 text-center border border-slate-350 bg-blue-950/30 text-blue-100">Écart vs Objectif (%)</th>
                <th className="p-3 text-center border border-slate-350 bg-red-950/25 text-[#8B0000]">Ratio Stérile (%)</th>
              </tr>
            </thead>
            <tbody className="text-xs font-bold text-slate-700 divide-y divide-slate-200">
              {stats.map(s => (
                <tr key={s.name} className="hover:bg-slate-50 transition-colors">
                  <td className="p-3 font-black text-slate-800 border border-slate-200">{s.name}</td>
                  <td className="p-3 text-center border border-slate-200 font-mono text-emerald-800 bg-emerald-50">{s.wagons} Wagons</td>
                  <td className="p-3 text-center border border-slate-200 font-mono">{s.target}</td>
                  <td className="p-3 text-center border border-slate-200 font-mono text-amber-800 bg-amber-50/30">{s.sterile} Wg.</td>
                  <td className="p-3 text-center border border-slate-200 font-mono text-slate-600">{s.totalWag}</td>
                  <td className="p-3 text-center border border-slate-200 font-mono">
                    {s.target === 0 ? (
                      s.wagons === 0 ? (
                        <span className="inline-flex px-1.5 py-0.5 border text-[10px] font-bold rounded bg-slate-50 text-slate-500 border-slate-200">
                          PAS D'EXTRACTION PRÉVUE
                        </span>
                      ) : (
                        <span className="inline-flex px-1.5 py-0.5 border text-[10px] font-bold rounded bg-emerald-50 text-emerald-800 border-emerald-250">
                          +{s.wagons} Wg (EXTRACTION NON PLANIFIÉE)
                        </span>
                      )
                    ) : (
                      <span className={`inline-flex px-1.5 py-0.5 border text-[10px] font-bold rounded ${
                        s.diffWagonsPct >= 0 
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-250' 
                          : (s.diffWagonsPct >= -15 ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-rose-50 text-rose-700 border-rose-200')
                      }`}>
                        {s.diffWagonsPct > 0 ? '+' : ''}{s.diffWagonsPct.toFixed(1)}%
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-center border border-slate-200 font-mono text-red-750 bg-red-50/25">{s.sterilePct}%</td>
                </tr>
              ))}
              
              <tr className="bg-slate-100 text-[#8B0000] font-black border-t-2 border-slate-350">
                <td className="p-3 border border-slate-200 uppercase tracking-widest text-[#8B0000] text-xs font-black">Total de la Journée</td>
                <td className="p-3 text-center border border-slate-200 font-mono text-emerald-950 bg-emerald-100/30 text-xs">{totalWagons} Wagons</td>
                <td className="p-3 text-center border border-slate-200 font-mono text-black text-xs">{totalTarget}</td>
                <td className="p-3 text-center border border-slate-200 font-mono text-amber-950 bg-amber-100/30 text-xs">{totalSterile} Wg.</td>
                <td className="p-3 text-center border border-slate-200 font-mono text-black text-xs">{totalTransferred}</td>
                <td className="p-3 text-center border border-slate-200 font-mono text-xs font-black">
                  {totalTarget === 0 ? (
                    totalWagons === 0 ? (
                      <span className="inline-flex px-1.5 py-0.5 border text-[10px] font-black rounded bg-slate-50 text-slate-500 border-slate-200">
                        PAS D'EXTRACTION PRÉVUE
                      </span>
                    ) : (
                      <span className="inline-flex px-1.5 py-0.5 border text-[10px] font-black rounded bg-emerald-50 text-emerald-800 border-emerald-250">
                        +{totalWagons} Wg (EXTRACTION NON PLANIFIÉE)
                      </span>
                    )
                  ) : (
                    <span className={`inline-flex px-1.5 py-0.5 border text-[10px] font-black rounded ${
                      totalDiffWagonsPct >= 0 
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-250' 
                        : (totalDiffWagonsPct >= -15 ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-rose-50 text-rose-700 border-rose-200')
                    }`}>
                      {totalDiffWagonsPct > 0 ? '+' : ''}{totalDiffWagonsPct.toFixed(1)}%
                    </span>
                  )}
                </td>
                <td className="p-3 text-center border border-slate-200 font-mono text-red-950 bg-red-100/30 text-xs font-black">{totalSterilePct}%</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
