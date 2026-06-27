import React from 'react';
import { Copy, Trash2, Lock, Pencil, TrendingUp, CheckCircle } from 'lucide-react';
import { ExcelRow } from '../../lib/productionUtils';
import { ExcelMinage } from '../../types/mining';
import { EmployeeCell, handleKeyDown } from './EmployeeCell';

interface MinageRowPairProps {
  postName: string;
  idx: number;
  rowWrapper: ExcelRow<ExcelMinage>;
  chantiers: any[];
  activeEmployees: any[];
  structureEditMode: boolean;
  copyMinagePlanToReel: (post: string, idx: number) => void;
  deleteMinageRow: (post: string, idx: number) => void;
  updateMinageCell: (post: string, idx: number, key: keyof ExcelMinage, value: any) => void;
}

export const MinageRowPair: React.FC<MinageRowPairProps> = ({
  postName,
  idx,
  rowWrapper,
  chantiers,
  activeEmployees,
  structureEditMode,
  copyMinagePlanToReel,
  deleteMinageRow,
  updateMinageCell
}) => {
  const row = rowWrapper.reel;
  const plan = rowWrapper.plan;

  const minerMismatch = !!(row.minerMatricule && plan.minerMatricule && row.minerMatricule.trim().toUpperCase() !== plan.minerMatricule.trim().toUpperCase());
  const assistantMismatch = !!(row.assistantMatricule && plan.assistantMatricule && row.assistantMatricule.trim().toUpperCase() !== plan.assistantMatricule.trim().toUpperCase());

  const realMeterageVal = row.realMeterage === undefined ? row.meterage : row.realMeterage;
  const rendement = row.realRounds > 0 ? (realMeterageVal / row.realRounds) : 0;
  const plannedMeterageVal = plan.meterage || 0;
  const diffMeteragePct = plannedMeterageVal > 0 ? ((realMeterageVal - plannedMeterageVal) / plannedMeterageVal) * 100 : 0;

  const chantierObj = chantiers.find(c => c.id === row.chantierId);
  const plannedTotalMeterage = chantierObj?.plannedTotalMeterage || 100;
  const currentMeterage = chantierObj?.currentMeterage || 0;
  const progressPct = plannedTotalMeterage > 0 ? Math.min(100, (currentMeterage / plannedTotalMeterage) * 100) : 0;

  let valBg = "bg-teal-50/20";
  let valText = "text-teal-950";
  if (realMeterageVal !== undefined && realMeterageVal !== null && realMeterageVal !== 0) {
    if (realMeterageVal >= 1.5) {
      valBg = "bg-emerald-100/50";
      valText = "text-emerald-920";
    } else if (realMeterageVal >= 1.4 && realMeterageVal < 1.5) {
      valBg = "bg-amber-100/50";
      valText = "text-amber-920";
    } else if (realMeterageVal < 1.4) {
      valBg = "bg-rose-100/50";
      valText = "text-rose-920";
    }
  }

  return (
    <>
      <tr className="bg-slate-50/55 text-slate-500 font-bold border-t border-slate-200">
        <td rowSpan={2} className="p-2 border-r border-slate-200 text-center font-black uppercase select-none align-middle bg-slate-50 text-slate-707">
          #{idx + 1}
        </td>

        <td rowSpan={2} className="p-2 border-r border-slate-200 text-center align-middle bg-slate-50">
          <div className="flex flex-col gap-1 items-center justify-center">
            <button
              type="button"
              onClick={() => copyMinagePlanToReel(postName, idx)}
              className="px-1.5 py-1 text-[8.5px] font-black uppercase bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-200 rounded tracking-wider cursor-pointer transition-all flex items-center gap-1 shadow-sm select-none"
              title="Copier les valeurs de planification de ce chantier vers le réel"
            >
              <Copy className="w-2.5 h-2.5 text-amber-600" /> Copier
            </button>
            {structureEditMode && (
              <button
                type="button"
                onClick={() => deleteMinageRow(postName, idx)}
                className="p-1 text-slate-450 hover:text-red-600 transition-colors cursor-pointer select-none"
                title="Supprimer ce chantier"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </td>

        <td rowSpan={2} className="p-2 border-r border-slate-300 min-w-[130px] align-middle font-bold bg-white">
          <div className="space-y-1.5">
            <select
              value={row.chantierId}
              onChange={e => updateMinageCell(postName, idx, 'chantierId', e.target.value)}
              className="w-full text-xs font-black uppercase text-slate-850 border border-slate-200 rounded p-1 bg-transparent cursor-pointer focus:border-[#8B0000] focus:ring-0 outline-none"
            >
              <option value="">(Choisir Chantier)</option>
              {(() => {
                const rowSec = (row.sector || 'Imiter 1').trim().toLowerCase();
                const filteredChan = chantiers.filter(c => {
                  const cSec = (c.sector || '').trim().toLowerCase();
                  return cSec === rowSec || cSec.includes(rowSec) || rowSec.includes(cSec);
                });
                const displayedList = filteredChan.length > 0 ? filteredChan : chantiers;
                return displayedList.map(c => (
                  <option key={c.id} value={c.id}>{c.name || c.id}</option>
                ));
              })()}
            </select>
            
            {row.chantierId && (
              <div className="space-y-0.5 select-none">
                <div className="flex justify-between text-[7px] font-black uppercase text-slate-500">
                  <span>Progression</span>
                  <span className="font-mono">{currentMeterage.toFixed(1)}/{plannedTotalMeterage.toFixed(1)}m</span>
                </div>
                <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                  <div className="bg-[#00BFFF] h-full transition-all duration-305" style={{ width: `${progressPct}%` }}></div>
                </div>
              </div>
            )}
          </div>
        </td>

        <td className="p-1 px-1.5 border-r border-slate-205 text-[8px] font-black uppercase text-center bg-slate-105 flex items-center justify-center gap-0.5 select-none min-h-[28px] border-b border-slate-100">
          <Lock className="w-2.5 h-2.5 text-slate-400" /> Plan
        </td>

        <td className="p-1 px-2 border-r border-slate-200 font-mono text-[9.5px] text-slate-500 italic">
          {plan.minerMatricule ? `${plan.minerMatricule} - ${plan.minerName || ''}` : '(Aucun)'}
        </td>

        <td className="p-1 px-2 border-r border-slate-200 font-mono text-[9.5px] text-slate-500 italic">
          {plan.assistantMatricule ? `${plan.assistantMatricule} - ${plan.assistantName || ''}` : '(Aucun)'}
        </td>

        <td className="p-1 text-center border-r border-slate-200 font-mono text-slate-500 select-none">
          {plan.gallerySize || 12}m²
        </td>

        <td className="p-1 text-center border-r border-slate-200 font-mono text-slate-500 select-none">
          {plan.plannedHoles || 32}
        </td>

        <td className="p-1 text-center border-r border-slate-200 font-mono text-slate-400 select-none bg-slate-100/30">-</td>
        <td className="p-1 text-center border-r border-slate-200 font-mono text-slate-400 select-none bg-slate-100/30">-</td>

        <td className="p-1 text-center border-r border-slate-200 font-mono text-slate-500 select-none">
          {plan.plannedRounds || 1}
        </td>

        <td className="p-1 text-center border-r border-slate-200 font-mono text-slate-500 font-bold select-none text-[10px]">
          {plan.meterage?.toFixed(1) || '0.0'}m
        </td>

        <td className="p-1 text-center border-r border-slate-200 font-mono text-slate-450 select-none bg-slate-50/30">
          {plan.anfo || 0}
        </td>

        <td className="p-1 text-center border-r border-slate-200 font-mono text-slate-450 select-none bg-slate-50/30">
          {plan.tovex || 0}
        </td>

        <td className="p-1 text-center border-r border-slate-300 font-mono text-slate-450 select-none bg-slate-50/30">
          {plan.ammorces || 0}
        </td>

        <td rowSpan={2} className="p-2 text-center align-middle bg-slate-50/40 text-[10px] min-w-[130px] border-l border-slate-105">
          <div className="flex flex-col gap-1.5 justify-center items-center font-bold">
            <div className="flex items-center gap-1 text-[9.5px]" title="Rendement de volée en mètres">
              <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
              <span>Rend. : <strong className="text-slate-800 font-black">{rendement.toFixed(2)} m/v</strong></span>
            </div>
            <div className="flex items-center gap-1 text-[9.5px]" title="Écart métrage réel vs planifié">
              <CheckCircle className="w-3.5 h-3.5 text-teal-655" />
              <span className={diffMeteragePct === 0 ? "text-slate-600" : diffMeteragePct > 0 ? "text-emerald-700 bg-emerald-50 px-1 rounded font-black" : "text-rose-700 bg-rose-50 px-1 rounded font-black"}>
                Écart: {diffMeteragePct > 0 ? '+' : ''}{diffMeteragePct.toFixed(1)}%
              </span>
            </div>
          </div>
        </td>
      </tr>

      <tr className="bg-white border-b border-slate-205">
        <td className="p-1 px-1.5 border-r border-slate-205 text-[8px] font-black uppercase text-center bg-slate-50 flex items-center justify-center gap-0.5 select-none min-h-[36px]">
          <Pencil className="w-2.5 h-2.5 text-red-700" /> Réel
        </td>

        <td className="p-1 border-r border-slate-200">
          <EmployeeCell
            matricule={row.minerMatricule}
            name={row.minerName}
            onChange={(mat) => updateMinageCell(postName, idx, 'minerMatricule', mat)}
            employees={activeEmployees}
            placeholder="Mineur..."
            hideNameLabel={true}
            onKeyDown={handleKeyDown}
          />
          {minerMismatch && (
            <div className="text-[7px] font-black uppercase text-amber-700 leading-none mt-0.5 select-none" title={`Planifié : ${plan.minerMatricule}`}>
              ⚠️ ≠ Plan ({plan.minerMatricule})
            </div>
          )}
        </td>

        <td className="p-1 border-r border-slate-200">
          <EmployeeCell
            matricule={row.assistantMatricule}
            name={row.assistantName}
            onChange={(mat) => updateMinageCell(postName, idx, 'assistantMatricule', mat)}
            employees={activeEmployees}
            placeholder="Assistant..."
            hideNameLabel={true}
            onKeyDown={handleKeyDown}
          />
          {assistantMismatch && (
            <div className="text-[7px] font-black uppercase text-amber-700 leading-none mt-0.5 select-none" title={`Planifié : ${plan.assistantMatricule}`}>
              ⚠️ ≠ Plan ({plan.assistantMatricule})
            </div>
          )}
        </td>

        <td className="p-1 border-r border-slate-200 text-center">
          <select
            value={row.gallerySize}
            onChange={e => updateMinageCell(postName, idx, 'gallerySize', Number(e.target.value))}
            onKeyDown={handleKeyDown}
            className="border border-slate-200 p-1 text-center font-bold font-mono bg-transparent rounded focus:ring-1 focus:ring-[#8B0000] focus:border-[#8B0000] text-[10px]"
          >
            <option value={9}>9</option>
            <option value={12}>12</option>
          </select>
        </td>

        <td className="p-1 border-r border-slate-200 text-center w-14">
          <input
            type="number"
            value={row.realHoles}
            onChange={e => updateMinageCell(postName, idx, 'realHoles', Number(e.target.value))}
            onKeyDown={handleKeyDown}
            className="w-full font-mono text-center border border-slate-200 p-1 text-[10px] rounded focus:ring-1 focus:ring-[#8B0000] focus:border-[#8B0000]"
          />
        </td>

        <td className="p-1 border-r border-slate-200 text-center w-20">
          <input
            type="number"
            value={row.chargedHoles === undefined ? '' : row.chargedHoles}
            onChange={e => updateMinageCell(postName, idx, 'chargedHoles', Number(e.target.value))}
            onKeyDown={handleKeyDown}
            placeholder="0"
            className="w-full font-mono text-center border border-slate-200 p-1 text-[10px] rounded focus:ring-1 focus:ring-[#8B0000] focus:border-[#8B0000] font-bold"
          />
        </td>

        <td className="p-1 border-r border-slate-200 text-center w-24 bg-slate-50/10 text-[10px] font-bold">
          {(() => {
            const realH = Number(row.realHoles) || 0;
            const chargedH = Number(row.chargedHoles) || 0;
            const emptyH = Math.max(0, realH - chargedH);
            if (realH === 0) {
              return <span className="text-slate-400 font-medium">-</span>;
            }
            if (emptyH > 0) {
              return (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-50 text-amber-800 border border-amber-200">
                  ⚠️ {emptyH} vides
                </span>
              );
            }
            return (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
                ✓ Tous chargés
              </span>
            );
          })()}
        </td>

        <td className="p-1 border-r border-slate-200 text-center w-14">
          <input
            type="number"
            value={row.realRounds}
            onChange={e => updateMinageCell(postName, idx, 'realRounds', Number(e.target.value))}
            onKeyDown={handleKeyDown}
            className="w-full font-mono text-center border border-slate-200 p-1 font-bold text-[10px] rounded focus:ring-1 focus:ring-[#8B0000] focus:border-[#8B0000]"
          />
        </td>

        <td className={`p-1 border-r border-slate-200 text-center w-18 transition-colors duration-200 ${valBg}`}>
          <input
            type="number"
            step="0.1"
            value={realMeterageVal}
            onChange={e => updateMinageCell(postName, idx, 'realMeterage', Number(e.target.value))}
            onKeyDown={handleKeyDown}
            className={`w-full font-mono text-center font-black select-all bg-transparent focus:outline-none focus:ring-0 ${valText} text-[10px]`}
          />
        </td>

        <td className="p-1 border-r border-slate-200 text-center w-14 bg-slate-50/10">
          <input
            type="number"
            value={row.anfo === 0 || row.anfo === undefined ? '' : row.anfo}
            placeholder="AN"
            onChange={e => updateMinageCell(postName, idx, 'anfo', Number(e.target.value))}
            onKeyDown={handleKeyDown}
            className="w-full text-center font-mono border border-slate-200 p-1 text-[10px] rounded select-all font-bold focus:ring-1 focus:ring-[#8B0000]"
          />
        </td>

        <td className="p-1 border-r border-slate-200 text-center w-14 bg-slate-50/10">
          <input
            type="number"
            value={row.tovex === 0 || row.tovex === undefined ? '' : row.tovex}
            placeholder="TV"
            onChange={e => updateMinageCell(postName, idx, 'tovex', Number(e.target.value))}
            onKeyDown={handleKeyDown}
            className="w-full text-center font-mono border border-slate-200 p-1 text-[10px] rounded select-all font-bold focus:ring-1 focus:ring-[#8B0000]"
          />
        </td>

        <td className="p-1 border-r border-slate-350 text-center w-14 bg-slate-50/10">
          <input
            type="number"
            value={row.ammorces === 0 || row.ammorces === undefined ? '' : row.ammorces}
            placeholder="AM"
            onChange={e => updateMinageCell(postName, idx, 'ammorces', Number(e.target.value))}
            onKeyDown={handleKeyDown}
            className="w-full text-center font-mono border border-slate-200 p-1 text-[10px] rounded select-all font-bold focus:ring-1 focus:ring-[#8B0000]"
          />
        </td>
      </tr>
    </>
  );
};
