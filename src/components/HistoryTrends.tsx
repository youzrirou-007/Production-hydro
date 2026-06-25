import React, { useState } from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  BarChart, 
  Bar,
  LineChart,
  Line
} from 'recharts';
import { 
  TrendingUp, 
  Calendar, 
  Activity, 
  Activity as ChartIcon, 
  Clock, 
  Award,
  Zap
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface HistoryTrendsProps {
  allProductionDocs: any[];
  allPlanningSheets: any[];
}

export const HistoryTrends: React.FC<HistoryTrendsProps> = ({
  allProductionDocs,
  allPlanningSheets
}) => {
  const [timeframe, setTimeframe] = useState<'30' | '90' | 'all'>('30');
  const [metricTab, setMetricTab] = useState<'forage' | 'deblayage' | 'extraction'>('forage');

  // Timezone safe shift for date calculation
  const getPreviousDateStr = (dateStr: string) => {
    try {
      const d = new Date(dateStr + 'T12:00:00');
      d.setDate(d.getDate() - 1);
      return d.toISOString().split('T')[0];
    } catch (e) {
      return dateStr;
    }
  };

  const getRecordSectorGroup = (rec: any) => {
    const row = rec.reel || rec;
    const plan = rec.plan || {};
    return row.sector || plan.sector || rec.sector || rec.sectorGroup || rec.reel?.sectorGroup || '';
  };

  const isTargetSector = (sector: string) => {
    const s = (sector || '').trim().toLowerCase();
    return s === 'imiter 2' || s === 'imiter 1' || s === 'imiter est' || s === 'bure imiter est' || s === 'imiter est bure';
  };

  // Compile full historical data
  const getCompiledHistory = () => {
    // Sort all production dates
    const sortedProdDocs = [...allProductionDocs].sort((a, b) => a.id.localeCompare(b.id));

    let cumulativeRealMeters = 0;
    let cumulativePlanMeters = 0;
    let cumulativeRealVolume = 0;
    let cumulativePlanVolume = 0;
    let cumulativeRealWagons = 0;
    let cumulativePlanWagons = 0;

    const historyPoints = sortedProdDocs.map((pDoc, index) => {
      const dateStr = pDoc.id;
      const prevDateStr = getPreviousDateStr(dateStr);
      const sDoc = allPlanningSheets.find(d => d.id === prevDateStr);

      let realMet = 0;
      let planMet = 0;
      let realVol = 0;
      let planVol = 0;
      let realWag = 0;
      let planWag = 0;

      // Extract real minage & deblayage & extraction
      if (pDoc.postes) {
        ['poste1', 'poste2', 'poste3'].forEach(pKey => {
          const post = pDoc.postes[pKey] || {};
          
          (post.minage || []).forEach((row: any) => {
            if (isTargetSector(getRecordSectorGroup(row))) {
              const r = row.reel || row || {};
              realMet += Number(r.realMeterage || 0);
            }
          });

          (post.deblayage || []).forEach((row: any) => {
            if (isTargetSector(getRecordSectorGroup(row))) {
              const r = row.reel || row || {};
              realVol += Number(r.volumeEstimated || 0);
            }
          });

          (post.extraction || []).forEach((row: any) => {
            const r = row.reel || row || {};
            realWag += Number(r.wagonsActual || 0);
          });
        });
      }

      // Extract planned targets
      if (sDoc && sDoc.postes) {
        ['poste1', 'poste2', 'poste3'].forEach(pKey => {
          const post = sDoc.postes[pKey] || {};
          
          (post.minage || []).forEach((row: any) => {
            if (isTargetSector(getRecordSectorGroup(row))) {
              planMet += Number(row.meterage || row.plannedRounds * 1.7 || 0);
            }
          });

          (post.deblayage || []).forEach((row: any) => {
            if (isTargetSector(getRecordSectorGroup(row))) {
              planVol += Number(row.volumeEstimated || 0);
            }
          });

          (post.extraction || []).forEach((row: any) => {
            planWag += Number(row.wagonsTarget || 48);
          });
        });
      } else if (pDoc.postes) {
        ['poste1', 'poste2', 'poste3'].forEach(pKey => {
          const post = pDoc.postes[pKey] || {};
          
          (post.minage || []).forEach((row: any) => {
            if (isTargetSector(getRecordSectorGroup(row))) {
              const plan = row.plan || {};
              planMet += Number(plan.meterage || plan.plannedRounds * 1.7 || 0);
            }
          });

          (post.deblayage || []).forEach((row: any) => {
            if (isTargetSector(getRecordSectorGroup(row))) {
              const plan = row.plan || {};
              planVol += Number(plan.volumeEstimated || 0);
            }
          });

          (post.extraction || []).forEach((row: any) => {
            const plan = row.plan || {};
            planWag += Number(plan.wagonsTarget || 48);
          });
        });
      }

      cumulativeRealMeters += realMet;
      cumulativePlanMeters += planMet;
      cumulativeRealVolume += realVol;
      cumulativePlanVolume += planVol;
      cumulativeRealWagons += realWag;
      cumulativePlanWagons += planWag;

      let formattedDate = dateStr;
      try {
        formattedDate = format(parseISO(dateStr), 'dd/MM');
      } catch(e){}

      return {
        date: dateStr,
        formattedDate,
        realMet: Number(realMet.toFixed(1)),
        planMet: Number(planMet.toFixed(1)),
        realVol: Number(realVol.toFixed(1)),
        planVol: Number(planVol.toFixed(1)),
        realWag,
        planWag,
        cumulativeRealMeters,
        cumulativePlanMeters,
        cumulativeRealVolume,
        cumulativePlanVolume,
        cumulativeRealWagons,
        cumulativePlanWagons
      };
    });

    // Compute moving averages (7-day window)
    const withMovingAverages = historyPoints.map((p, idx, arr) => {
      let sumMet = 0;
      let sumVol = 0;
      let sumWag = 0;
      let count = 0;

      for (let i = Math.max(0, idx - 6); i <= idx; i++) {
        sumMet += arr[i].realMet;
        sumVol += arr[i].realVol;
        sumWag += arr[i].realWag;
        count++;
      }

      return {
        ...p,
        movingAvgMeters: Number((sumMet / count).toFixed(1)),
        movingAvgVolume: Number((sumVol / count).toFixed(1)),
        movingAvgWagons: Number((sumWag / count).toFixed(1))
      };
    });

    // Apply Timeframe Filter
    if (timeframe === '30') {
      return withMovingAverages.slice(-30);
    } else if (timeframe === '90') {
      return withMovingAverages.slice(-90);
    }
    return withMovingAverages;
  };

  const historyData = getCompiledHistory();

  // Summary Metrics
  const totalMetersDrilled = historyData.reduce((acc, p) => acc + p.realMet, 0);
  const totalPlannedMeters = historyData.reduce((acc, p) => acc + p.planMet, 0);
  const averageMetersPerDay = historyData.length > 0 ? (totalMetersDrilled / historyData.length) : 0;
  
  const totalVolumeMoved = historyData.reduce((acc, p) => acc + p.realVol, 0);
  const totalPlannedVolume = historyData.reduce((acc, p) => acc + p.planVol, 0);
  
  const totalWagonsExtracted = historyData.reduce((acc, p) => acc + p.realWag, 0);
  const totalPlannedWagons = historyData.reduce((acc, p) => acc + p.planWag, 0);

  // Growth / Progress Rates
  const drillingDeficit = totalPlannedMeters - totalMetersDrilled;
  const drillingSuccessRate = totalPlannedMeters > 0 ? (totalMetersDrilled / totalPlannedMeters) * 100 : 100;

  const volumeDeficit = totalPlannedVolume - totalVolumeMoved;
  const volumeSuccessRate = totalPlannedVolume > 0 ? (totalVolumeMoved / totalPlannedVolume) * 100 : 100;

  const extractionDeficit = totalPlannedWagons - totalWagonsExtracted;
  const extractionSuccessRate = totalPlannedWagons > 0 ? (totalWagonsExtracted / totalPlannedWagons) * 100 : 100;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Filters and Actions */}
      <div className="bg-slate-50 border border-slate-150 p-4.5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2">
          <ChartIcon className="w-5 h-5 text-[#b8860b]" />
          <div>
            <h2 className="text-xs font-black uppercase text-slate-800">Tendances Historiques & Évolution Long Terme</h2>
            <p className="text-[9.5px] text-slate-400 uppercase font-black">Visualisation de l'avancement cumulé et des lissages de production</p>
          </div>
        </div>

        {/* Timeframe selector */}
        <div className="inline-flex p-1 bg-white border border-slate-200 rounded-xl shrink-0">
          {[
            { id: '30', label: '30 Derniers Jours' },
            { id: '90', label: '90 Derniers Jours' },
            { id: 'all', label: 'Tout l\'Historique' }
          ].map(tf => (
            <button
              key={tf.id}
              onClick={() => setTimeframe(tf.id as any)}
              className={`text-[9.5px] font-black uppercase py-1.5 px-3 rounded-lg cursor-pointer transition-all ${
                timeframe === tf.id ? 'bg-[#b8860b] text-white' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {/* Summary KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Drilling progress card */}
        <div className="bg-white border border-slate-150 p-4.5 rounded-xl shadow-2xs relative overflow-hidden flex flex-col justify-between h-32">
          <div>
            <span className="text-[8.5px] font-extrabold text-slate-400 uppercase tracking-wider block">Avancement Forage Cumulé</span>
            <span className="text-xl font-black text-slate-800 font-mono mt-1 block">
              {totalMetersDrilled.toFixed(1)} m 
              <span className="text-xs text-slate-400 font-normal ml-1.5">/ {totalPlannedMeters.toFixed(1)} m</span>
            </span>
          </div>
          <div className="flex items-end justify-between border-t border-slate-100 pt-2.5">
            <div>
              <span className="text-[8px] font-extrabold text-slate-400 uppercase block">Rendement Journalier Moyen</span>
              <span className="text-xs font-black text-slate-800 font-mono">{averageMetersPerDay.toFixed(1)} m/j</span>
            </div>
            <span className={`px-2 py-0.5 rounded-lg border text-[10px] font-black ${drillingSuccessRate >= 95 ? 'bg-emerald-50 text-emerald-800 border-emerald-100' : 'bg-amber-50 text-amber-800 border-amber-100'}`}>
              {drillingSuccessRate.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Loading progress card */}
        <div className="bg-white border border-slate-150 p-4.5 rounded-xl shadow-2xs relative overflow-hidden flex flex-col justify-between h-32">
          <div>
            <span className="text-[8.5px] font-extrabold text-slate-400 uppercase tracking-wider block">Volume Déblayé Cumulé</span>
            <span className="text-xl font-black text-slate-800 font-mono mt-1 block">
              {totalVolumeMoved.toFixed(1)} m³ 
              <span className="text-xs text-slate-400 font-normal ml-1.5">/ {totalPlannedVolume.toFixed(1)} m³</span>
            </span>
          </div>
          <div className="flex items-end justify-between border-t border-slate-100 pt-2.5">
            <div>
              <span className="text-[8px] font-extrabold text-slate-400 uppercase block">Écart Opérationnel</span>
              <span className={`text-xs font-mono font-black ${volumeDeficit <= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {volumeDeficit <= 0 ? `+${Math.abs(volumeDeficit).toFixed(0)}` : `-${volumeDeficit.toFixed(0)}`} m³
              </span>
            </div>
            <span className={`px-2 py-0.5 rounded-lg border text-[10px] font-black ${volumeSuccessRate >= 95 ? 'bg-emerald-50 text-emerald-800 border-emerald-100' : 'bg-amber-50 text-amber-800 border-amber-100'}`}>
              {volumeSuccessRate.toFixed(1)}%
            </span>
          </div>
        </div>

        {/* Extraction wagons card */}
        <div className="bg-white border border-slate-150 p-4.5 rounded-xl shadow-2xs relative overflow-hidden flex flex-col justify-between h-32">
          <div>
            <span className="text-[8.5px] font-extrabold text-slate-400 uppercase tracking-wider block">Wagons Extraits Cumulés</span>
            <span className="text-xl font-black text-slate-800 font-mono mt-1 block">
              {totalWagonsExtracted} wgs 
              <span className="text-xs text-slate-400 font-normal ml-1.5">/ {totalPlannedWagons} wgs</span>
            </span>
          </div>
          <div className="flex items-end justify-between border-t border-slate-100 pt-2.5">
            <div>
              <span className="text-[8px] font-extrabold text-slate-400 uppercase block">Rendement d'extraction</span>
              <span className="text-xs font-black text-slate-800 font-mono">{(totalWagonsExtracted * 1.5).toFixed(0)} tonnes</span>
            </div>
            <span className={`px-2 py-0.5 rounded-lg border text-[10px] font-black ${extractionSuccessRate >= 95 ? 'bg-emerald-50 text-emerald-800 border-emerald-100' : 'bg-amber-50 text-amber-800 border-amber-100'}`}>
              {extractionSuccessRate.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Main Charts Tabbing Row */}
      <div className="bg-white border border-slate-150 rounded-2xl p-5 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-100 pb-3">
          <div className="inline-flex p-1 bg-slate-50 border border-slate-200 rounded-xl">
            {[
              { id: 'forage', label: 'Avancement Forage' },
              { id: 'deblayage', label: 'Chargement LHD' },
              { id: 'extraction', label: 'Extraction Wagons' }
            ].map(mTab => (
              <button
                key={mTab.id}
                onClick={() => setMetricTab(mTab.id as any)}
                className={`text-[9px] font-black uppercase py-1.5 px-3 rounded-lg cursor-pointer transition-all ${
                  metricTab === mTab.id ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {mTab.label}
              </button>
            ))}
          </div>
          <span className="text-[8.5px] font-black uppercase text-slate-400">Le graphique affiche le lissage par moyenne mobile sur 7 jours (Ligne Noire)</span>
        </div>

        {/* Dynamic Charts Renderer */}
        <div className="h-80 w-full">
          {metricTab === 'forage' && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historyData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMet" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#b8860b" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#b8860b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="formattedDate" tick={{ fontSize: 9, fontWeight: 'bold' }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 9, fontFamily: 'monospace' }} stroke="#94a3b8" />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 9, fontWeight: 'bold', textTransform: 'uppercase' }} />
                <Area name="Réalisé Quotidien" type="monotone" dataKey="realMet" stroke="#b8860b" strokeWidth={2} fillOpacity={1} fill="url(#colorMet)" unit=" m" />
                <Line name="Moyenne Mobile (7 jours)" type="monotone" dataKey="movingAvgMeters" stroke="#0f172a" strokeWidth={2.5} dot={false} strokeDasharray="4 4" />
                <Area name="Cible Prévue" type="monotone" dataKey="planMet" stroke="#94a3b8" strokeWidth={1} fill="none" strokeDasharray="3 3" unit=" m" />
              </AreaChart>
            </ResponsiveContainer>
          )}

          {metricTab === 'deblayage' && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historyData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorVol" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="formattedDate" tick={{ fontSize: 9, fontWeight: 'bold' }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 9, fontFamily: 'monospace' }} stroke="#94a3b8" />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 9, fontWeight: 'bold', textTransform: 'uppercase' }} />
                <Area name="Volume Réel" type="monotone" dataKey="realVol" stroke="#14b8a6" strokeWidth={2} fillOpacity={1} fill="url(#colorVol)" unit=" m³" />
                <Line name="Moyenne Mobile (7 jours)" type="monotone" dataKey="movingAvgVolume" stroke="#0f172a" strokeWidth={2.5} dot={false} strokeDasharray="4 4" />
                <Area name="Volume Prévu" type="monotone" dataKey="planVol" stroke="#94a3b8" strokeWidth={1} fill="none" strokeDasharray="3 3" unit=" m³" />
              </AreaChart>
            </ResponsiveContainer>
          )}

          {metricTab === 'extraction' && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historyData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorWag" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="formattedDate" tick={{ fontSize: 9, fontWeight: 'bold' }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 9, fontFamily: 'monospace' }} stroke="#94a3b8" />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 9, fontWeight: 'bold', textTransform: 'uppercase' }} />
                <Area name="Wagons Réels" type="monotone" dataKey="realWag" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorWag)" unit=" wgs" />
                <Line name="Moyenne Mobile (7 jours)" type="monotone" dataKey="movingAvgWagons" stroke="#0f172a" strokeWidth={2.5} dot={false} strokeDasharray="4 4" />
                <Area name="Cible Wagons" type="monotone" dataKey="planWag" stroke="#94a3b8" strokeWidth={1} fill="none" strokeDasharray="3 3" unit=" wgs" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Cumulative Gap Analysis (Deficit Tracker over Time) */}
      <div className="bg-white border border-slate-150 rounded-2xl p-5 space-y-4">
        <h3 className="text-xs font-black uppercase text-slate-800">Suivi du Retard / Écart Cumulé de Production</h3>
        <p className="text-[10px] text-slate-500 uppercase leading-relaxed">
          Ce graphique représente l'écart cumulé entre la planification théorique de la SMI et la réalisation réelle. Un écart de 0 indique un respect parfait des objectifs ; une courbe descendante indique l'accumulation d'un déficit à rattraper.
        </p>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={historyData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="formattedDate" tick={{ fontSize: 9, fontWeight: 'bold' }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 9, fontFamily: 'monospace' }} stroke="#94a3b8" />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 9, fontWeight: 'bold', textTransform: 'uppercase' }} />
              <Line name="Avancement Cumulé Réel" type="monotone" dataKey="cumulativeRealMeters" stroke="#b8860b" strokeWidth={3} dot={false} unit=" m" />
              <Line name="Objectif Cumulé Prévu" type="monotone" dataKey="cumulativePlanMeters" stroke="#94a3b8" strokeWidth={2} dot={false} strokeDasharray="4 4" unit=" m" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
