import React from 'react';
import { Copy, Trash2, Lock, Pencil, TrendingUp, Gauge } from 'lucide-react';
import { ExcelRow, calculateDuration } from '../../lib/productionUtils';
import { ExcelDeblayage } from '../../types/mining';
import { EmployeeCell, renderTimeSelect, handleKeyDown } from './EmployeeCell';

interface DeblayageSectorCardProps {
  postName: string;
  idx: number;
  rowWrapper: ExcelRow<ExcelDeblayage>;
  sectorName: string;
  chantiers: any[];
  activeEmployees: any[];
  platformSettings: any;
  structureEditMode: boolean;
  copyDeblayagePlanToReel: (post: string, idx: number) => void;
  deleteDeblayageRow: (post: string, idx: number) => void;
  updateDeblayageCell: (post: string, idx: number, key: keyof ExcelDeblayage, value: any) => void;
  getEmployeeName: (matricule: string) => string;
}

export const DeblayageSectorCard: React.FC<DeblayageSectorCardProps> = ({
  postName,
  idx,
  rowWrapper,
  sectorName,
  chantiers,
  activeEmployees,
  platformSettings,
  structureEditMode,
  copyDeblayagePlanToReel,
  deleteDeblayageRow,
  updateDeblayageCell,
  getEmployeeName
}) => {
  const row = rowWrapper.reel;
  const plan = rowWrapper.plan;

  const driverMismatch = !!(row.driverMatricule && plan.driverMatricule && row.driverMatricule.trim().toUpperCase() !== plan.driverMatricule.trim().toUpperCase());
  const realEngine = (row.engineId || row.engineCode || '').trim().toUpperCase();
  const planEngine = (plan.engineId || plan.engineCode || '').trim().toUpperCase();
  const engineMismatch = !!(realEngine && planEngine && realEngine !== planEngine);
  const hasMismatch = driverMismatch || engineMismatch;

  const targetVol = plan.volumeEstimated || 0;
  const realVol = row.volumeEstimated || 0;
  const diffVolAbs = realVol - targetVol;
  const diffVolPct = targetVol > 0 ? (diffVolAbs / targetVol) * 100 : 0;

  const gasoil = row.gasoil || 0;
  const godets = row.godets || 0;
  const ratioGasoilGodet = godets > 0 ? (gasoil / godets) : 0;

  const chantierObj = chantiers.find(c => c.id === row.chantierId);
  const plannedTotalMeterage = chantierObj?.plannedTotalMeterage || 100;
  const currentMeterage = chantierObj?.currentMeterage || 0;
  const progressPct = plannedTotalMeterage > 0 ? Math.min(100, (currentMeterage / plannedTotalMeterage) * 100) : 0;

  return (
    <div 
      data-card-container="true"
      className="bg-white border border-slate-300 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow relative space-y-3 flex flex-col justify-between"
    >
      <div>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 border-b border-slate-100 pb-2">
          <div className="space-y-1 select-none">
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-black px-1.5 py-0.5 bg-slate-100 text-slate-707 border border-slate-200 rounded">
                #{idx + 1}
              </span>
              <select
                value={row.chantierId}
                onChange={e => updateDeblayageCell(postName, idx, 'chantierId', e.target.value)}
                className="text-xs font-black uppercase text-slate-850 border-b border-dashed border-slate-300 focus:border-[#8B0000] focus:ring-0 outline-none pr-6 bg-transparent cursor-pointer"
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
            </div>
            <div className="flex flex-wrap gap-1.5 pt-1">
              <span className="inline-block text-[8px] font-black uppercase tracking-wider text-[#00BFFF] bg-sky-50 border border-sky-250 px-1.5 py-0.5 rounded">
                {sectorName}
              </span>
              {chantierObj?.galleryType && (
                <span className="inline-block text-[8px] font-black uppercase tracking-wider text-teal-850 bg-teal-50 border border-teal-200/50 px-1.5 py-0.5 rounded">
                  Section: {chantierObj.galleryType === '9m2' ? '9m²' : '12m²'}
                </span>
              )}
              {hasMismatch && (
                <span className="inline-block text-[8px] font-black uppercase tracking-wider text-amber-900 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded animate-pulse" title="Conducteur ou engin différent du plan">
                  ⚠️ Équipe/Engin ≠ Plan
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => copyDeblayagePlanToReel(postName, idx)}
              className="px-2 py-1 text-[9px] font-black uppercase bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-200 rounded tracking-wider cursor-pointer transition-all inline-flex items-center gap-1 shadow-sm select-none"
              title="Copier les valeurs de planification de ce chantier vers le réel"
            >
              <Copy className="w-2.5 h-2.5 text-amber-600" /> Copier
            </button>
            {structureEditMode && (
              <button
                type="button"
                onClick={() => deleteDeblayageRow(postName, idx)}
                className="p-1 text-slate-450 hover:text-red-600 transition-colors cursor-pointer select-none"
                title="Supprimer ce chantier"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        <div className="w-full space-y-1 py-1 border-b border-slate-100">
          <div className="flex justify-between items-center text-[9px] font-black uppercase text-slate-500">
            <span>Progression Chantier</span>
            <span className="font-mono">{currentMeterage.toFixed(1)} / {plannedTotalMeterage.toFixed(1)} m ({progressPct.toFixed(0)}%)</span>
          </div>
          <div className="w-full bg-slate-150 h-1.5 rounded-full overflow-hidden">
            <div className="bg-[#00BFFF] h-full transition-all duration-300" style={{ width: `${progressPct}%` }}></div>
          </div>
        </div>

        <div className="overflow-x-auto mt-2">
          <table className="w-full text-left border-collapse border border-slate-200 text-[10px]">
            <thead>
              <tr className="bg-slate-50 text-[8px] font-black uppercase tracking-wider text-slate-500 border-b border-slate-200">
                <th className="p-1 px-1.5 border-r border-slate-200 w-14 text-center">Type</th>
                <th className="p-1 px-1.5 border-r border-slate-200">Conducteur</th>
                <th className="p-1 px-1.5 border-r border-slate-200">Engin Assigné</th>
                <th className="p-1 px-1.5 border-r border-slate-200 text-center w-12 font-black">Godets</th>
                <th className="p-1 px-1.5 border-r border-slate-200 text-center w-14">Vol (m³)</th>
                <th className="p-1 px-1.5 border-r border-slate-200 text-center w-24">Heures / Horaires</th>
                <th className="p-1 px-1.5 border-r border-slate-200 text-center w-14">Durée</th>
                <th className="p-1 px-1.5 border-r border-slate-200 text-center w-12">Norme</th>
                <th className="p-1 px-1.5 border-r border-slate-200 text-center w-24">Écart</th>
                <th className="p-1 px-1.5 border-r border-slate-200 text-center w-12 text-blue-900 bg-blue-50/20 font-bold">Gasoil</th>
                <th className="p-1 px-1.5 border-r border-slate-200 text-center">Lub1</th>
                <th className="p-1 px-1.5 text-center">Lub2</th>
              </tr>
            </thead>
            <tbody>
              <tr className="bg-slate-105 text-slate-500 font-bold border-b border-slate-200">
                <td className="p-1.5 border-r border-slate-200 text-[8px] font-black uppercase text-center bg-slate-150 flex items-center justify-center gap-1 select-none">
                  <Lock className="w-2.5 h-2.5 text-slate-400" /> Plan
                </td>
                <td className="p-1 px-1.5 border-r border-slate-200 font-mono text-[9px]" colSpan={2}>
                  {plan.driverMatricule ? `${plan.driverMatricule} - ${plan.driverName || ''}` : '(Aucun)'} 
                  {plan.engineId || plan.engineCode ? ` [${plan.engineId || plan.engineCode}]` : ''}
                </td>
                <td className="p-1 border-r border-slate-200 text-center font-mono">{plan.godets || 0}</td>
                <td className="p-1 border-r border-slate-200 text-center font-mono font-bold">{(plan.volumeEstimated || 0).toFixed(1)} m³</td>
                <td className="p-1 border-r border-slate-200 text-center font-mono">{(plan.hoursWorked || 6).toFixed(1)}h prév.</td>
                <td className="p-1 border-r border-slate-200 text-center font-mono text-slate-400 select-none bg-slate-100/30">-</td>
                <td className="p-1 border-r border-slate-200 text-center font-mono text-slate-400 select-none bg-slate-100/30">-</td>
                <td className="p-1 border-r border-slate-200 text-center font-mono text-slate-400 select-none bg-slate-100/30">-</td>
                <td className="p-1 border-r border-slate-200 text-center font-mono">-</td>
                <td className="p-1 border-r border-slate-200 text-center font-mono">-</td>
                <td className="p-1 text-center font-mono">-</td>
              </tr>
              <tr className="bg-white text-slate-900 font-bold">
                <td className="p-1 border-r border-slate-200 text-[8px] font-black uppercase text-center bg-slate-50/50 flex items-center justify-center gap-1 select-none">
                  <Pencil className="w-2.5 h-2.5 text-red-700" /> Réel
                </td>
                <td className="p-1 border-r border-slate-200">
                  <EmployeeCell
                    matricule={row.driverMatricule}
                    name={row.driverName}
                    onChange={(mat) => updateDeblayageCell(postName, idx, 'driverMatricule', mat)}
                    employees={activeEmployees}
                    placeholder="Cond..."
                    hideNameLabel={true}
                    onKeyDown={handleKeyDown}
                  />
                  {driverMismatch && (
                    <div className="text-[7.5px] font-black uppercase text-amber-700 leading-none mt-0.5 select-none" title={`Planifié : ${plan.driverMatricule}`}>
                      ⚠️ ≠ Plan ({plan.driverMatricule})
                    </div>
                  )}
                </td>
                <td className="p-1 border-r border-slate-200">
                  <select
                    value={row.engineId || row.engineCode || ''}
                    onChange={e => updateDeblayageCell(postName, idx, 'engineId', e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full border border-slate-200 p-0.5 font-mono text-[10px] font-bold"
                  >
                    <option value="">-- LHD --</option>
                    {platformSettings.engines.map((eng: string) => <option key={eng} value={eng}>{eng}</option>)}
                  </select>
                  {engineMismatch && (
                    <div className="text-[7.5px] font-black uppercase text-amber-700 leading-none mt-0.5 select-none">
                      ⚠️ ≠ Plan ({plan.engineId || plan.engineCode || ''})
                    </div>
                  )}
                </td>
                <td className="p-1 border-r border-slate-200 text-center">
                  <input
                    type="number"
                    value={row.godets === 0 || row.godets === undefined ? '' : row.godets}
                    placeholder="0"
                    onChange={e => updateDeblayageCell(postName, idx, 'godets', Number(e.target.value))}
                    onKeyDown={handleKeyDown}
                    className="w-full text-center bg-transparent border border-dashed border-slate-300 outline-none select-all font-black text-[11px]"
                  />
                </td>
                <td className="p-1 border-r border-slate-200 text-center font-bold font-mono text-emerald-800 bg-slate-50/10">
                  {row.volumeEstimated.toFixed(1)}
                </td>
                <td className="p-1 border-r border-slate-200 text-center">
                  <div className="flex items-center gap-0.5 justify-center">
                    {renderTimeSelect(row.startTime || '', (val) => updateDeblayageCell(postName, idx, 'startTime', val))}
                    <span className="text-[9px] text-slate-455 font-bold select-none">→</span>
                    {renderTimeSelect(row.endTime || '', (val) => updateDeblayageCell(postName, idx, 'endTime', val))}
                  </div>
                </td>
                <td className="p-1 border-r border-slate-200 text-center font-mono text-[10px] bg-slate-50/50">
                  {(() => {
                    const dur = calculateDuration(row.startTime || '', row.endTime || '');
                    return dur > 0 ? `${dur.toFixed(1)}h` : '-';
                  })()}
                </td>
                <td className="p-1 border-r border-slate-200 text-center font-mono text-[10px] text-slate-400 bg-slate-50/50">
                  6.0h
                </td>
                <td className="p-1 border-r border-slate-200 text-center font-mono text-[10px] bg-slate-50/50 min-w-[120px]">
                  {(() => {
                    const dur = calculateDuration(row.startTime || '', row.endTime || '');
                    if (dur <= 0) return <span className="text-slate-400 font-medium">-</span>;
                    const gap = dur - 6.0;
                    if (gap > 0) {
                      return (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-rose-50 text-rose-850 border border-rose-200">
                          ⚠️ +{gap.toFixed(1)}h
                        </span>
                      );
                    } else if (gap === 0) {
                      return (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-50 text-emerald-850 border border-emerald-200">
                          ✓ OK
                        </span>
                      );
                    } else {
                      return (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-sky-50 text-sky-850 border border-sky-200">
                          ✓ {gap.toFixed(1)}h
                        </span>
                      );
                    }
                  })()}
                </td>
                <td className="p-1 border-r border-slate-200 text-center bg-blue-50/20">
                  <input
                    type="number"
                    placeholder="0"
                    value={row.gasoil === 0 || row.gasoil === undefined ? '' : row.gasoil}
                    onChange={e => updateDeblayageCell(postName, idx, 'gasoil', Number(e.target.value))}
                    onKeyDown={handleKeyDown}
                    className="w-12 font-mono font-black text-center text-blue-950 border border-slate-200 p-0.5 rounded-sm select-all"
                  />
                </td>
                <td className="p-1 border-r border-slate-200">
                  <div className="flex flex-col gap-0.5 min-w-[70px]">
                    <select
                      value={row.lubrifiant1 || ''}
                      onChange={e => updateDeblayageCell(postName, idx, 'lubrifiant1', e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="w-full border border-slate-200 p-0.5 text-[9px]"
                    >
                      <option value="">-- Aucun --</option>
                      {platformSettings.oils.map((o: string) => <option key={o} value={o}>{o}</option>)}
                    </select>
                    <input
                      type="number"
                      placeholder="0 L"
                      value={row.lubrifiant1Qty === 0 || row.lubrifiant1Qty === undefined ? '' : row.lubrifiant1Qty}
                      onChange={e => updateDeblayageCell(postName, idx, 'lubrifiant1Qty', Number(e.target.value))}
                      onKeyDown={handleKeyDown}
                      className="w-full text-center font-mono text-[9px] border border-slate-200 p-0.5"
                    />
                  </div>
                </td>
                <td className="p-1">
                  <div className="flex flex-col gap-0.5 min-w-[70px]">
                    <select
                      value={row.lubrifiant2 || ''}
                      onChange={e => updateDeblayageCell(postName, idx, 'lubrifiant2', e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="w-full border border-slate-200 p-0.5 text-[9px]"
                    >
                      <option value="">-- Aucun --</option>
                      {platformSettings.oils.map((o: string) => <option key={o} value={o}>{o}</option>)}
                    </select>
                    <input
                      type="number"
                      placeholder="0 L"
                      value={row.lubrifiant2Qty === 0 || row.lubrifiant2Qty === undefined ? '' : row.lubrifiant2Qty}
                      onChange={e => updateDeblayageCell(postName, idx, 'lubrifiant2Qty', Number(e.target.value))}
                      onKeyDown={handleKeyDown}
                      className="w-full text-center font-mono text-[9px] border border-slate-200 p-0.5"
                    />
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="mt-2 bg-slate-50/50 p-1.5 rounded border border-slate-150 flex items-center gap-1">
          <span className="text-[8px] font-black uppercase text-slate-500 select-none">Remarques :</span>
          <input
            type="text"
            value={row.remarks || ''}
            placeholder="Fait de rotation..."
            onChange={e => updateDeblayageCell(postName, idx, 'remarks', e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent border-none outline-none text-[10px] p-0 font-medium text-slate-800"
          />
        </div>
      </div>

      <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-[10px] text-slate-600">
        <div className="flex items-center gap-1.5">
          <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
          <span>Écart Vol : <strong className={diffVolAbs === 0 ? "text-slate-600" : diffVolAbs > 0 ? "text-emerald-700 bg-emerald-50 px-1 rounded font-bold" : "text-rose-700 bg-rose-50 px-1 rounded font-bold"}>
            {diffVolAbs > 0 ? '+' : ''}{diffVolAbs.toFixed(1)} m³ ({diffVolPct > 0 ? '+' : ''}{diffVolPct.toFixed(1)}%)
          </strong></span>
        </div>

        <div className="flex items-center gap-1.5 font-mono">
          <Gauge className="w-3.5 h-3.5 text-amber-600" />
          <span>Ratio G/G : <strong className="text-slate-800 font-bold">{ratioGasoilGodet.toFixed(2)} L/g</strong></span>
        </div>
      </div>
    </div>
  );
};
