import React from 'react';
import { Plus } from 'lucide-react';
import { ExcelRow } from '../../lib/productionUtils';
import { ExcelMinage } from '../../types/mining';
import { EmployeeCell } from './EmployeeCell';
import { MinageRowPair } from './MinageRowPair';

interface MinageSectorBlockProps {
  postName: string;
  secName: string;
  rows: { row: ExcelRow<ExcelMinage>; idx: number }[];
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

export const MinageSectorBlock: React.FC<MinageSectorBlockProps> = ({
  postName,
  secName,
  rows,
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
  let headerStyle = {
    bg: 'bg-neutral-105 border-l-4 border-neutral-400',
    text: 'text-neutral-900',
    bullet: 'bg-neutral-500'
  };
  if (secName.toLowerCase() === 'imiter 2') {
    headerStyle = {
      bg: 'bg-red-50/70 border-l-4 border-[#8B0000]',
      text: 'text-[#8B0000]',
      bullet: 'bg-[#8B0000]'
    };
  } else if (secName.toLowerCase() === 'imiter 1') {
    headerStyle = {
      bg: 'bg-sky-50/70 border-l-4 border-[#00BFFF]',
      text: 'text-sky-950',
      bullet: 'bg-[#00BFFF]'
    };
  } else if (secName.toLowerCase() === 'imiter est') {
    headerStyle = {
      bg: 'bg-teal-50/70 border-l-4 border-teal-600',
      text: 'text-teal-950',
      bullet: 'bg-teal-600'
    };
  }

  return (
    <React.Fragment key={secName}>
      <tr className="bg-slate-100/90 border-y border-slate-205 select-none font-bold">
        <td colSpan={16} className="py-2.5 px-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className={`w-3 h-3 ${headerStyle.bullet} rounded-sm shrink-0`}></span>
              <span className={`${headerStyle.text} text-xs font-black uppercase tracking-wider`}>
                Secteur : <strong>{secName}</strong>
              </span>
              {structureEditMode && (
                <button
                  type="button"
                  onClick={() => addMinageRowForSector(postName, secName === 'Autres / Non Classés' ? '' : secName)}
                  className="bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-[9px] uppercase px-2.5 py-1.5 flex items-center gap-1 transition-all rounded shadow-sm cursor-pointer shrink-0"
                >
                  <Plus className="w-3 h-3 text-[#00BFFF]" /> Ajouter Ligne
                </button>
              )}
            </div>

            {secName !== 'Autres / Non Classés' && (
              <div className="flex flex-wrap items-center gap-3 bg-white/95 p-1 rounded border border-slate-200">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-800 font-extrabold uppercase shrink-0">Chef de Secteur :</span>
                  <div className="w-36 shrink-0">
                    <EmployeeCell
                      matricule={sectorChefs[secName]?.chiefMatricule || ''}
                      name={sectorChefs[secName]?.chiefName || ''}
                      onChange={(mat, resName) => updateSectorChief(postName, secName, 'chief', mat, resName)}
                      employees={activeEmployees}
                      placeholder="Chef..."
                    />
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-slate-500 font-bold uppercase shrink-0">Adjoint :</span>
                  <div className="w-36 shrink-0">
                    <EmployeeCell
                      matricule={sectorChefs[secName]?.secondChiefMatricule || ''}
                      name={sectorChefs[secName]?.secondChiefName || ''}
                      onChange={(mat, resName) => updateSectorChief(postName, secName, 'second', mat, resName)}
                      employees={activeEmployees}
                      placeholder="Adjoint..."
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </td>
      </tr>

      {rows.map(({ row, idx }) => (
        <MinageRowPair
          key={row.rowId || idx}
          postName={postName}
          idx={idx}
          rowWrapper={row}
          chantiers={chantiers}
          activeEmployees={activeEmployees}
          structureEditMode={structureEditMode}
          copyMinagePlanToReel={copyMinagePlanToReel}
          deleteMinageRow={deleteMinageRow}
          updateMinageCell={updateMinageCell}
        />
      ))}
    </React.Fragment>
  );
};
