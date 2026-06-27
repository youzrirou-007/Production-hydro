import React from 'react';
import { User, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

interface ProductionHistoryTableProps {
  dataHistory: any[];
}

export const ProductionHistoryTable: React.FC<ProductionHistoryTableProps> = ({ dataHistory }) => {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="p-5 border-b border-gray-100 bg-slate-50/50">
        <h3 className="text-sm font-black uppercase text-slate-900 tracking-wider">
          📋 Livre d'Or des Fiches Journalières Consolidées
        </h3>
        <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">
          Historique des cahiers scellés dans la base de données de fond
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse bg-white">
          <thead>
            <tr className="bg-slate-50 border-b border-gray-150 text-slate-700 text-[10px] uppercase font-black">
              <th rowSpan={2} className="px-4 py-3 border-r border-slate-200 text-left align-middle font-black">Date du cahier</th>
              <th rowSpan={2} className="px-4 py-3 border-r border-slate-200 text-center align-middle font-black">Métrage Planifié</th>
              <th rowSpan={2} className="px-4 py-3 border-r border-slate-200 text-center align-middle font-black">Métrage Arraché</th>
              <th rowSpan={2} className="px-4 py-3 border-r border-slate-200 text-center align-middle font-black">Déblayage Planifié</th>
              <th rowSpan={2} className="px-4 py-3 border-r border-slate-200 text-center align-middle font-black">Déblayage Réalisé</th>
              <th rowSpan={2} className="px-4 py-3 border-r border-slate-200 text-center align-middle font-black">Wagons Planifié</th>
              <th rowSpan={2} className="px-4 py-3 border-r border-slate-200 text-center align-middle font-black">Wagons Extraits</th>
              <th colSpan={3} className="px-4 py-2 border-r border-slate-200 text-center bg-amber-50/50 text-amber-900 border-b border-slate-200 font-black">Consommation Explosifs</th>
              <th rowSpan={2} className="px-4 py-3 border-r border-slate-200 text-left align-middle font-black">Secrétaire</th>
              <th rowSpan={2} className="px-4 py-3 border-r border-slate-200 text-left align-middle font-black">Dernier Enregistrement</th>
              <th rowSpan={2} className="px-4 py-3 text-center align-middle font-black">Statut</th>
            </tr>
            <tr className="bg-slate-50 border-b border-gray-150 text-slate-700 text-[9px] uppercase font-black">
              <th className="px-2 py-1.5 border-r border-slate-200 text-center bg-amber-50/25 text-amber-800 font-black">ANFO</th>
              <th className="px-2 py-1.5 border-r border-slate-200 text-center bg-amber-50/25 text-amber-800 font-black">TOVEX</th>
              <th className="px-2 py-1.5 border-r border-slate-200 text-center bg-amber-50/25 text-amber-800 font-black">AMORCES</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 text-xs font-semibold text-slate-700">
            {dataHistory.map((rec) => {
              const formattedDate = rec.date ? rec.date.split('-').reverse().join('/') : rec.id;
              return (
                <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-4 py-3 font-mono font-black text-slate-900 border-r border-slate-150">{formattedDate}</td>
                  <td className="px-4 py-3 text-center font-mono text-slate-600 border-r border-slate-150">
                    {rec.totalMeteragePlanned !== undefined ? `${rec.totalMeteragePlanned.toFixed(1)} m` : '--'}
                  </td>
                  <td className="px-4 py-3 text-center font-mono font-black text-emerald-800 bg-emerald-50/15 border-r border-slate-150">
                    {rec.totalMeterageRealised !== undefined ? `${rec.totalMeterageRealised.toFixed(1)} m` : (rec.totalMeterage !== undefined ? `${rec.totalMeterage.toFixed(1)} m` : '--')}
                  </td>
                  <td className="px-4 py-3 text-center font-mono text-slate-600 border-r border-slate-150">
                    {rec.totalDeblayagePlanned !== undefined ? `${rec.totalDeblayagePlanned.toFixed(1)} m³` : '--'}
                  </td>
                  <td className="px-4 py-3 text-center font-mono font-black text-blue-800 bg-blue-50/15 border-r border-slate-150">
                    {rec.totalDeblayageRealised !== undefined ? `${rec.totalDeblayageRealised.toFixed(1)} m³` : '--'}
                  </td>
                  <td className="px-4 py-3 text-center font-mono text-slate-600 border-r border-slate-150">
                    {rec.totalWagonsPlanned !== undefined ? `${rec.totalWagonsPlanned} u` : '--'}
                  </td>
                  <td className="px-4 py-3 text-center font-mono font-black text-sky-850 bg-sky-50/15 border-r border-slate-150">
                    {rec.totalWagonsRealised !== undefined ? `${rec.totalWagonsRealised} u` : (rec.totalWagons !== undefined ? `${rec.totalWagons} u` : '--')}
                  </td>
                  <td className="px-3 py-3 text-center font-mono text-amber-800 bg-amber-50/5 border-r border-slate-150">
                    {rec.totalAnfo !== undefined ? `${rec.totalAnfo.toFixed(0)} kg` : '--'}
                  </td>
                  <td className="px-3 py-3 text-center font-mono text-amber-800 bg-amber-50/5 border-r border-slate-150">
                    {rec.totalTovex !== undefined ? `${rec.totalTovex.toFixed(1)} kg` : '--'}
                  </td>
                  <td className="px-3 py-3 text-center font-mono text-amber-800 bg-amber-50/5 border-r border-slate-150">
                    {rec.totalAmorces !== undefined ? `${rec.totalAmorces} u` : '--'}
                  </td>
                  <td className="px-4 py-3 text-slate-800 font-bold border-r border-slate-150">
                    <span className="inline-flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      {rec.secretary || 'Secrétaire'}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-500 border-r border-slate-150">
                    {rec.lastUpdated ? format(new Date(rec.lastUpdated), 'dd/MM/yyyy HH:mm') : '--'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-500/20 text-emerald-800 rounded-lg font-extrabold text-[9px] uppercase tracking-wider">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-650" /> Scellé
                    </span>
                  </td>
                </tr>
              );
            })}
            {dataHistory.length === 0 && (
              <tr>
                <td colSpan={13} className="text-center py-20 italic text-slate-400 font-bold uppercase tracking-widest font-mono text-[10px]">
                  Aucune fiche scellée trouvée dans les registres.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
