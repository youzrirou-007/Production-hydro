import React from 'react';
import { Plus, Trash2, AlertTriangle } from 'lucide-react';
import { ExcelRow } from '../../lib/productionUtils';
import { ExcelMaintenance } from '../../types/mining';
import { EmployeeCell } from './EmployeeCell';

interface MaintenanceShiftPanelProps {
  shiftName: string;
  maintenanceRows: ExcelRow<ExcelMaintenance>[];
  activeEmployees: any[];
  platformSettings: any;
  structureEditMode: boolean;
  getEmployeeName: (matricule: string) => string;
  addMaintenanceRow: (post: string) => void;
  deleteMaintenanceRow: (post: string, idx: number) => void;
  updateMaintenanceCell: (post: string, idx: number, key: keyof ExcelMaintenance, value: any) => void;
}

export const MaintenanceShiftPanel: React.FC<MaintenanceShiftPanelProps> = ({
  shiftName,
  maintenanceRows,
  activeEmployees,
  platformSettings,
  structureEditMode,
  getEmployeeName,
  addMaintenanceRow,
  deleteMaintenanceRow,
  updateMaintenanceCell
}) => {
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

        {structureEditMode && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => addMaintenanceRow(shiftName)}
              className="bg-[#00BFFF] hover:bg-[#00BFFF]/95 text-white font-black text-[10px] uppercase px-3 py-1.5 flex items-center gap-1.5 transition-all shadow-sm rounded cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Ajouter une ligne ({shiftName})
            </button>
          </div>
        )}
      </div>

      <div className="overflow-x-auto rounded border border-slate-200 bg-white">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-100 border-b border-slate-300 text-slate-707 font-extrabold uppercase text-[10px] tracking-wider">
              <th className="p-2 text-[10px] font-black uppercase text-center w-12 border-r border-slate-200 text-slate-500 bg-slate-50">#</th>
              <th className="p-2 text-[10px] font-black uppercase w-48 border-r border-slate-200">Rôle Prévu Souterrain</th>
              <th className="p-2 text-[10px] font-black uppercase w-32 border-r border-slate-200">Matricule Spécialiste</th>
              <th className="p-2 text-[10px] font-black uppercase w-44 border-r border-slate-200">Nom Spécialiste</th>
              <th className="p-2 text-[10px] font-black uppercase w-48 border-r border-slate-200">Machine Clé</th>
              <th className="p-2 text-[10px] font-black uppercase w-20 border-r border-slate-200 text-center">Durée (h)</th>
              <th className="p-2 text-[10px] font-black uppercase border-r border-slate-200">Description diagnostic / Remise en route</th>
              {structureEditMode && <th className="p-2 text-[10px] font-black uppercase text-center w-14">Action</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-150 text-[11px]">
            {maintenanceRows.map((rowWrapper, idx) => {
              const row = rowWrapper.reel;
              const agentValName = getEmployeeName(row.agentMatricule);

              return (
                <tr key={rowWrapper.rowId || idx} className="hover:bg-slate-50 transition-colors">
                  <td className="p-2 font-mono text-slate-400 bg-slate-50/50 text-center font-bold border-r border-slate-200">{idx + 1}</td>
                  <td className="p-2 border-r border-slate-200 bg-purple-50/20">
                    <select
                      value={row.roleLabel || ''}
                      onChange={e => updateMaintenanceCell(shiftName, idx, 'roleLabel', e.target.value)}
                      className="w-full font-black text-purple-900 border border-slate-200 bg-white p-1 rounded-none text-xs"
                    >
                      <option value="">-- Choisir Rôle --</option>
                      <option value="MÉCANICIENS">MÉCANICIENS</option>
                      <option value="CHAUDRONNIER">CHAUDRONNIER</option>
                      <option value="ÉLECTRICIEN">ÉLECTRICIEN</option>
                    </select>
                  </td>
                  <td className="p-2 border-r border-slate-200">
                    <EmployeeCell
                      matricule={row.agentMatricule}
                      name={row.agentName}
                      onChange={(mat) => updateMaintenanceCell(shiftName, idx, 'agentMatricule', mat)}
                      employees={activeEmployees}
                      placeholder="Matr. Spécialiste..."
                      hideNameLabel={true}
                    />
                  </td>
                  <td className="p-2 border-r border-slate-200 text-xs text-slate-500 font-bold bg-slate-50/30">
                    {agentValName || 'Inconnu'}
                  </td>
                  <td className="p-2 border-r border-slate-200">
                    <select
                      value={row.engineId || row.engineCode || ''}
                      onChange={e => updateMaintenanceCell(shiftName, idx, 'engineId', e.target.value)}
                      className="w-full border border-slate-200 p-1 font-mono text-xs"
                    >
                      <option value="">(Aucun engin repéré)</option>
                      {platformSettings.engines.map((eng: string) => <option key={eng} value={eng}>{eng}</option>)}
                    </select>
                  </td>
                  <td className="p-2 border-r border-slate-200 text-center font-mono">
                    <input
                      type="number"
                      value={row.hoursSpent === 0 ? '' : row.hoursSpent}
                      placeholder="0"
                      onChange={e => updateMaintenanceCell(shiftName, idx, 'hoursSpent', Number(e.target.value))}
                      className="w-14 text-center p-1 border border-slate-200 select-all"
                    />
                  </td>
                  <td className="p-2 border-r border-slate-200">
                    <input
                      type="text"
                      placeholder="Vidange de carter moteur, changement tuyauterie hydraulique..."
                      value={row.workDescription}
                      onChange={e => updateMaintenanceCell(shiftName, idx, 'workDescription', e.target.value)}
                      className="w-full border-0 outline-none uppercase bg-transparent text-slate-700"
                    />
                  </td>
                  {structureEditMode && (
                    <td className="p-1 text-center">
                      <button
                        type="button"
                        onClick={() => deleteMaintenanceRow(shiftName, idx)}
                        className="p-1 text-slate-400 hover:text-red-600 transition-colors cursor-pointer select-none"
                        title="Supprimer la ligne"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  )}
                </tr>
              );
            })}
            {maintenanceRows.length === 0 ? (
              <tr>
                <td colSpan={structureEditMode ? 8 : 7} className="text-center p-8 bg-amber-50/20 text-amber-900 border border-amber-200">
                  <div className="flex flex-col items-center justify-center py-4 space-y-2 max-w-md mx-auto">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                    <p className="font-bold text-xs uppercase tracking-wider text-amber-950">Planification Non Saisie — {shiftName}</p>
                    <p className="text-[10px] text-amber-800 font-bold leading-relaxed">
                      Aucune planification de brigade de maintenance souterraine n'a été enregistrée pour le <span className="underline">{shiftName}</span> à cette date.
                      Veuillez d'abord planifier l'équipe de maintenance dans le <span className="underline">Planning Journalier</span> pour pouvoir enregistrer son réalisé.
                    </p>
                  </div>
                </td>
              </tr>
            ) : (() => {
              const totalHours = maintenanceRows.reduce((sum, r) => sum + (Number(r.reel.hoursSpent) || 0), 0);
              const interventionsCount = maintenanceRows.filter(r => r.reel.workDescription || r.reel.agentMatricule).length;

              return (
                <>
                  <tr className="bg-slate-50 text-slate-800 font-extrabold text-[11px] border-t-2 border-slate-300">
                    <td colSpan={5} className="p-3 uppercase text-right tracking-wider text-slate-600 font-black">Totaux de Poste (Maintenance - {shiftName})</td>
                    <td className="p-3 text-center bg-purple-50 text-purple-900 font-mono font-black border-r border-slate-200">
                      {totalHours} h
                    </td>
                    <td colSpan={structureEditMode ? 2 : 1} className="p-3"></td>
                  </tr>

                  <tr className="bg-slate-100 text-slate-800 font-black text-[11px] border-t border-slate-300">
                    <td colSpan={5} className="p-3 text-right text-slate-500 uppercase font-black">Analyse S.M.I:</td>
                    <td colSpan={structureEditMode ? 3 : 2} className="p-3 text-center bg-purple-500/10 text-purple-900 tracking-wide uppercase font-black">
                      🛠️ Charge d'Indisponibilité Machine : <span className="text-xs font-black font-mono ml-1.5">{totalHours} h d'arrêt / {interventionsCount} interventions</span>
                    </td>
                  </tr>
                </>
              );
            })()}
          </tbody>
        </table>
      </div>
    </div>
  );
};
