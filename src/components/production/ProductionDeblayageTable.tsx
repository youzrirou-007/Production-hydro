import React from 'react';
import { AlertTriangle, Plus } from 'lucide-react';
import { ExcelRow } from '../../lib/productionUtils';
import { ExcelDeblayage } from '../../types/mining';
import { DeblayageSectorCard } from './DeblayageSectorCard';

interface ProductionDeblayageTableProps {
  postName: string;
  deblayageRows: ExcelRow<ExcelDeblayage>[];
  chantiers: any[];
  activeEmployees: any[];
  platformSettings: any;
  structureEditMode: boolean;
  addDeblayageRowForSector: (post: string, sector: string) => void;
  deleteDeblayageRow: (post: string, idx: number) => void;
  copyDeblayagePlanToReel: (post: string, idx: number) => void;
  updateDeblayageCell: (post: string, idx: number, key: keyof ExcelDeblayage, value: any) => void;
  getEmployeeName: (matricule: string) => string;
}

export const ProductionDeblayageTable: React.FC<ProductionDeblayageTableProps> = ({
  postName,
  deblayageRows,
  chantiers,
  activeEmployees,
  platformSettings,
  structureEditMode,
  addDeblayageRowForSector,
  deleteDeblayageRow,
  copyDeblayagePlanToReel,
  updateDeblayageCell,
  getEmployeeName
}) => {
  const SECTORS = [
    { name: 'Imiter 2', border: 'border-neutral-300', text: 'text-neutral-900', strip: 'bg-[#8B0000]' },
    { name: 'Imiter 1', border: 'border-sky-300', text: 'text-sky-950', strip: 'bg-[#00BFFF]' },
    { name: 'Imiter Est', border: 'border-teal-300', text: 'text-teal-950', strip: 'bg-teal-600' }
  ];

  if (deblayageRows.length === 0) {
    return (
      <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-6 text-center max-w-xl mx-auto my-4 shadow-xs" id={`empty_deblayage_plan_${postName.replace(/\s+/g, '_')}`}>
        <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
          <AlertTriangle className="w-6 h-6 text-amber-600" />
        </div>
        <h4 className="text-xs font-black uppercase text-amber-900 tracking-wider mb-2">
          Planification Non Saisie — {postName}
        </h4>
        <p className="text-[11px] text-amber-800 font-bold leading-relaxed">
          Aucune planification de déblayage ou de conduite d'engins n'a été enregistrée pour le <span className="underline">{postName}</span> à cette date.
          Veuillez d'abord saisir le chantier, l'engin et le conducteur dans le <span className="underline">Planning Journalier</span> pour pouvoir ajouter le réalisé.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {SECTORS.map(sec => {
        const rows = deblayageRows
          .map((row, idx) => ({ row, idx }))
          .filter(item => {
            const rowSec = (item.row.reel.sector || item.row.plan.sector || '').trim().toLowerCase();
            return rowSec === sec.name.trim().toLowerCase();
          });

        return (
          <div key={sec.name} className="space-y-3">
            <div className={`p-3 bg-slate-105 rounded-lg border-l-4 ${sec.border} flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs`}>
              <div className="flex items-center gap-3">
                <span className={`w-3 h-3 ${sec.strip} rounded-sm shrink-0`}></span>
                <span className={`${sec.text} text-sm font-black uppercase tracking-wider`}>
                  Secteur : <strong>{sec.name}</strong>
                </span>
                {structureEditMode && (
                  <button
                    type="button"
                    onClick={() => addDeblayageRowForSector(postName, sec.name)}
                    className="bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-[9px] uppercase px-3 py-1 flex items-center gap-1 transition-all rounded shadow-sm cursor-pointer shrink-0"
                  >
                    <Plus className="w-3 h-3 text-[#00BFFF]" /> Ajouter Ligne
                  </button>
                )}
              </div>
            </div>

            {rows.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {rows.map(({ row, idx }) => (
                  <DeblayageSectorCard
                    key={row.rowId || idx}
                    postName={postName}
                    idx={idx}
                    rowWrapper={row}
                    sectorName={sec.name}
                    chantiers={chantiers}
                    activeEmployees={activeEmployees}
                    platformSettings={platformSettings}
                    structureEditMode={structureEditMode}
                    copyDeblayagePlanToReel={copyDeblayagePlanToReel}
                    deleteDeblayageRow={deleteDeblayageRow}
                    updateDeblayageCell={updateDeblayageCell}
                    getEmployeeName={getEmployeeName}
                  />
                ))}
              </div>
            ) : (
              <div className="text-[10px] text-slate-400 font-bold italic p-3 bg-slate-50 rounded border border-dashed border-slate-200/60 font-black uppercase tracking-wider text-center">
                Aucun engin de déblayage pour ce secteur.
              </div>
            )}
          </div>
        );
      })}

      {(() => {
        const otherRows = deblayageRows
          .map((row, idx) => ({ row, idx }))
          .filter(item => {
            const rowSec = (item.row.reel.sector || item.row.plan.sector || '').trim().toLowerCase();
            return !['imiter 2', 'imiter 1', 'imiter est'].includes(rowSec);
          });

        if (otherRows.length === 0) return null;

        return (
          <div className="space-y-3">
            <div className="p-3 bg-slate-105 rounded-lg border-l-4 border-slate-300 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <span className="w-3 h-3 bg-slate-400 rounded-sm shrink-0"></span>
                <span className="text-slate-900 text-sm font-black uppercase tracking-wider">
                  Secteur : <strong>Autres / Non Classés</strong>
                </span>
                {structureEditMode && (
                  <button
                    type="button"
                    onClick={() => addDeblayageRowForSector(postName, '')}
                    className="bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-[9px] uppercase px-3 py-1 flex items-center gap-1 transition-all rounded shadow-sm cursor-pointer shrink-0"
                  >
                    <Plus className="w-3 h-3 text-[#00BFFF]" /> Ajouter Ligne
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {otherRows.map(({ row, idx }) => (
                <DeblayageSectorCard
                  key={row.rowId || idx}
                  postName={postName}
                  idx={idx}
                  rowWrapper={row}
                  sectorName="Autres / Non Classés"
                  chantiers={chantiers}
                  activeEmployees={activeEmployees}
                  platformSettings={platformSettings}
                  structureEditMode={structureEditMode}
                  copyDeblayagePlanToReel={copyDeblayagePlanToReel}
                  deleteDeblayageRow={deleteDeblayageRow}
                  updateDeblayageCell={updateDeblayageCell}
                  getEmployeeName={getEmployeeName}
                />
              ))}
            </div>
          </div>
        );
      })()}
    </div>
  );
};
