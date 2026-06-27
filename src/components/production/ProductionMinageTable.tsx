import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { ExcelRow } from '../../lib/productionUtils';
import { ExcelMinage } from '../../types/mining';
import { MinageSectorBlock } from './MinageSectorBlock';

interface ProductionMinageTableProps {
  postName: string;
  minageRows: ExcelRow<ExcelMinage>[];
  sectorChefs: Record<string, any>;
  chantiers: any[];
  activeEmployees: any[];
  structureEditMode: boolean;
  addMinageRowForSector: (post: string, sector: string) => void;
  deleteMinageRow: (post: string, idx: number) => void;
  copyMinagePlanToReel: (post: string, idx: number) => void;
  updateMinageCell: (post: string, idx: number, key: keyof ExcelMinage, value: any) => void;
  updateSectorChief: (post: string, sector: string, field: 'chief' | 'second', mat: string, resolvedName: string) => void;
}

export const ProductionMinageTable: React.FC<ProductionMinageTableProps> = ({
  postName,
  minageRows,
  sectorChefs,
  chantiers,
  activeEmployees,
  structureEditMode,
  addMinageRowForSector,
  deleteMinageRow,
  copyMinagePlanToReel,
  updateMinageCell,
  updateSectorChief
}) => {
  const SECTORS = ['Imiter 2', 'Imiter 1', 'Imiter Est', 'Autres / Non Classés'];

  if (minageRows.length === 0) {
    return (
      <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-6 text-center max-w-xl mx-auto my-4 shadow-xs" id={`empty_minage_plan_${postName.replace(/\s+/g, '_')}`}>
        <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
          <AlertTriangle className="w-6 h-6 text-amber-600" />
        </div>
        <h4 className="text-xs font-black uppercase text-amber-900 tracking-wider mb-2">
          Planification Non Saisie — {postName}
        </h4>
        <p className="text-[11px] text-amber-800 font-bold leading-relaxed">
          Aucune planification de forage ou de minage s'y rapportant n'a été enregistrée pour le <span className="underline">{postName}</span> à cette date.
          Veuillez d'abord saisir le chantier et l'équipe dans le <span className="underline">Planning Journalier</span> pour pouvoir ajouter le réalisé.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-250 bg-white shadow-xs">
      <table className="w-full text-left border-collapse text-[11px]">
        <thead>
          <tr className="bg-slate-900 text-white select-none text-[9.5px] font-black tracking-wider uppercase sticky top-0 z-10">
            <th className="p-2 border-r border-slate-700/50 text-center w-10">#</th>
            <th className="p-2 border-r border-slate-700/50 text-center w-24">Actions</th>
            <th className="p-2 border-r border-[#ffd700]/30 min-w-[130px] bg-slate-850/80 text-sky-200">Chantier</th>
            <th className="p-2 border-r border-slate-700/50 w-14 text-center">Type</th>
            <th className="p-2 border-r border-slate-700/50 min-w-[155px] text-[#ffd700]">Mineur (Matricule / Nom)</th>
            <th className="p-2 border-r border-slate-700/50 min-w-[155px] text-sky-200">Aide-Mineur / Assistant</th>
            <th className="p-2 border-r border-slate-700/50 w-16 text-center text-rose-250">Section</th>
            <th className="p-2 border-r border-slate-700/50 w-16 text-center">Trous (u)</th>
            <th className="p-2 border-r border-slate-700/50 w-20 text-center text-[#ffd700]">Trous chargés</th>
            <th className="p-2 border-r border-slate-700/50 w-24 text-center">Trous vides</th>
            <th className="p-2 border-r border-slate-700/50 w-16 text-center">Volées (u)</th>
            <th className="p-2 border-r border-slate-700/50 w-20 text-center text-amber-200">Métrage (m)</th>
            <th className="p-2 border-r border-slate-700/50 w-16 text-center">ANFO (kg)</th>
            <th className="p-2 border-r border-slate-700/50 w-16 text-center">Tovex (kg)</th>
            <th className="p-2 border-r border-slate-700/50 w-16 text-center text-rose-220">Amorces</th>
            <th className="p-2 text-center min-w-[130px] bg-slate-950 text-emerald-300">Rendement & Écart</th>
          </tr>
        </thead>
        <tbody>
          {SECTORS.map(secName => {
            const rows = minageRows
              .map((row, idx) => ({ row, idx }))
              .filter(item => {
                const rowSec = (item.row.reel.sector || item.row.plan.sector || '').trim().toLowerCase();
                const targetSec = secName.trim().toLowerCase();
                if (targetSec === 'autres / non classés') {
                  return !['imiter 2', 'imiter 1', 'imiter est'].includes(rowSec);
                }
                return rowSec === targetSec;
              });

            if (rows.length === 0) return null;

            return (
              <MinageSectorBlock
                key={secName}
                postName={postName}
                secName={secName}
                rows={rows}
                sectorChefs={sectorChefs}
                chantiers={chantiers}
                activeEmployees={activeEmployees}
                structureEditMode={structureEditMode}
                addMinageRowForSector={addMinageRowForSector}
                deleteMinageRow={deleteMinageRow}
                copyMinagePlanToReel={copyMinagePlanToReel}
                updateMinageCell={updateMinageCell}
                updateSectorChief={updateSectorChief}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
