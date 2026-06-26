import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  LineChart,
  Line
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Calendar, 
  Activity as ChartIcon, 
  Zap,
  Bomb,
  Activity,
  Tractor,
  Flame,
  Users
} from 'lucide-react';
import { format, parseISO, subDays } from 'date-fns';

interface HistoryTrendsProps {
  allProductionDocs: any[];
  allPlanningSheets: any[];
}

type TimeframeOption = '30' | '90' | '180' | '365' | 'all';
type MetricOption = 'forage' | 'deblayage' | 'extraction' | 'rendement' | 'explosifs' | 'gasoil' | 'presences';

export const HistoryTrends: React.FC<HistoryTrendsProps> = ({
  allProductionDocs,
  allPlanningSheets
}) => {
  const [timeframe, setTimeframe] = useState<TimeframeOption>('30');
  const [metricTab, setMetricTab] = useState<MetricOption>('forage');
  const [maWindow, setMaWindow] = useState<7 | 30>(7);

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

  // Compile full daily historical data
  const compiledHistory = useMemo(() => {
    // Sort all production dates chronologically
    const sortedProdDocs = [...allProductionDocs].sort((a, b) => a.id.localeCompare(b.id));

    let cumulativeRealMeters = 0;
    let cumulativePlanMeters = 0;
    let cumulativeRealVolume = 0;
    let cumulativePlanVolume = 0;
    let cumulativeRealWagons = 0;
    let cumulativePlanWagons = 0;

    const historyPoints = sortedProdDocs.map(pDoc => {
      const dateStr = pDoc.id;
      const prevDateStr = getPreviousDateStr(dateStr);
      const sDoc = allPlanningSheets.find(d => d.id === prevDateStr);

      let realMet = 0;
      let planMet = 0;
      let realVol = 0;
      let planVol = 0;
      let realWag = 0;
      let planWag = 0;

      let realRounds = 0;
      let realAnfo = 0;
      let realTovex = 0;
      let realGasoil = 0;
      let realPresence = 0;

      // Extract real minage & deblayage & extraction
      if (pDoc.postes) {
        ['poste1', 'poste2', 'poste3'].forEach(pKey => {
          const post = pDoc.postes[pKey] || {};
          
          (post.minage || []).forEach((row: any) => {
            if (isTargetSector(getRecordSectorGroup(row))) {
              const r = row.reel || row || {};
              realMet += Number(r.realMeterage || 0);
              realRounds += Number(r.realRounds || 0);
              realAnfo += Number(r.anfo || 0);
              realTovex += Number(r.tovex || 0);
              if (r.agentMatricule) realPresence++;
            }
          });

          (post.deblayage || []).forEach((row: any) => {
            if (isTargetSector(getRecordSectorGroup(row))) {
              const r = row.reel || row || {};
              realVol += Number(r.volumeEstimated || 0);
              realGasoil += Number(r.gasoil || 0);
              if (r.operatorMatricule) realPresence++;
            }
          });

          (post.extraction || []).forEach((row: any) => {
            const r = row.reel || row || {};
            realWag += Number(r.wagonsActual || 0);
            if (r.treuilliste) realPresence++;
            if (r.equipier1) realPresence++;
            if (r.equipier2) realPresence++;
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

      const totalExplosives = realAnfo + realTovex;
      const specificExplosive = realMet > 0 ? totalExplosives / realMet : 0;
      const specificGasoil = realVol > 0 ? realGasoil / realVol : 0;
      const yieldPerVol = realRounds > 0 ? realMet / realRounds : 0;

      return {
        date: dateStr,
        formattedDate,
        realMet: Number(realMet.toFixed(1)),
        planMet: Number(planMet.toFixed(1)),
        realVol: Number(realVol.toFixed(1)),
        planVol: Number(planVol.toFixed(1)),
        realWag,
        planWag,
        realPresence,
        realExplosives: totalExplosives,
        specificExplosive: Number(specificExplosive.toFixed(2)),
        specificGasoil: Number(specificGasoil.toFixed(2)),
        yieldPerVol: Number(yieldPerVol.toFixed(2)),
        cumulativeRealMeters,
        cumulativePlanMeters,
        cumulativeRealVolume,
        cumulativePlanVolume,
        cumulativeRealWagons,
        cumulativePlanWagons
      };
    });

    // Compute Moving Averages (7-day or 30-day window)
    return historyPoints.map((p, idx, arr) => {
      let sumMet = 0, sumVol = 0, sumWag = 0, sumYld = 0, sumExp = 0, sumGas = 0, sumPres = 0;
      let count = 0;

      const windowSize = maWindow;
      for (let i = Math.max(0, idx - (windowSize - 1)); i <= idx; i++) {
        sumMet += arr[i].realMet;
        sumVol += arr[i].realVol;
        sumWag += arr[i].realWag;
        sumYld += arr[i].yieldPerVol;
        sumExp += arr[i].specificExplosive;
        sumGas += arr[i].specificGasoil;
        sumPres += arr[i].realPresence;
        count++;
      }

      return {
        ...p,
        movingAvgMeters: Number((sumMet / count).toFixed(1)),
        movingAvgVolume: Number((sumVol / count).toFixed(1)),
        movingAvgWagons: Number((sumWag / count).toFixed(1)),
        movingAvgYield: Number((sumYld / count).toFixed(2)),
        movingAvgExplosive: Number((sumExp / count).toFixed(2)),
        movingAvgGasoil: Number((sumGas / count).toFixed(2)),
        movingAvgPresence: Number((sumPres / count).toFixed(1))
      };
    });
  }, [allProductionDocs, allPlanningSheets, maWindow]);

  // Filter history based on timeframe
  const filteredHistory = useMemo(() => {
    if (timeframe === '30') return compiledHistory.slice(-30);
    if (timeframe === '90') return compiledHistory.slice(-90);
    if (timeframe === '180') return compiledHistory.slice(-180);
    if (timeframe === '365') return compiledHistory.slice(-365);
    return compiledHistory;
  }, [compiledHistory, timeframe]);

  // PERIOD COMPARISON (e.g. Current Timeframe vs immediately preceding timeframe of same duration)
  const periodComparison = useMemo(() => {
    const len = filteredHistory.length;
    if (len === 0 || compiledHistory.length < len * 2) {
      return null; // Not enough history to compare
    }

    const currentPeriod = filteredHistory;
    const precedingPeriod = compiledHistory.slice(-(len * 2), -len);

    const calcAvg = (arr: any[], key: string) => {
      const sum = arr.reduce((acc, pt) => acc + (pt[key] || 0), 0);
      return sum / arr.length;
    };

    const keys = {
      forage: 'realMet',
      deblayage: 'realVol',
      extraction: 'realWag',
      rendement: 'yieldPerVol',
      explosifs: 'specificExplosive',
      gasoil: 'specificGasoil',
      presences: 'realPresence'
    };

    const targetKey = keys[metricTab];
    const avgCurrent = calcAvg(currentPeriod, targetKey);
    const avgPreceding = calcAvg(precedingPeriod, targetKey);

    const pctChange = avgPreceding > 0 ? ((avgCurrent - avgPreceding) / avgPreceding) * 100 : 0;

    return {
      current: avgCurrent,
      preceding: avgPreceding,
      change: pctChange
    };
  }, [compiledHistory, filteredHistory, metricTab]);

  // Overall metric totals for display
  const metricStats = useMemo(() => {
    const totalMet = filteredHistory.reduce((acc, p) => acc + p.realMet, 0);
    const planMet = filteredHistory.reduce((acc, p) => acc + p.planMet, 0);
    const totalVol = filteredHistory.reduce((acc, p) => acc + p.realVol, 0);
    const planVol = filteredHistory.reduce((acc, p) => acc + p.planVol, 0);
    const totalWag = filteredHistory.reduce((acc, p) => acc + p.realWag, 0);
    const planWag = filteredHistory.reduce((acc, p) => acc + p.planWag, 0);

    return {
      totalMet, planMet, rateMet: planMet > 0 ? (totalMet / planMet) * 100 : 100,
      totalVol, planVol, rateVol: planVol > 0 ? (totalVol / planVol) * 100 : 100,
      totalWag, planWag, rateWag: planWag > 0 ? (totalWag / planWag) * 100 : 100
    };
  }, [filteredHistory]);

  const activeMetricLabel = useMemo(() => {
    switch (metricTab) {
      case 'forage': return { name: 'Mètres Forés', unit: 'm', maKey: 'movingAvgMeters', rawKey: 'realMet', targetKey: 'planMet', color: '#b8860b' };
      case 'deblayage': return { name: 'Volume Déblayé', unit: 'm³', maKey: 'movingAvgVolume', rawKey: 'realVol', targetKey: 'planVol', color: '#14b8a6' };
      case 'extraction': return { name: 'Wagons Extraits', unit: 'wg', maKey: 'movingAvgWagons', rawKey: 'realWag', targetKey: 'planWag', color: '#6366f1' };
      case 'rendement': return { name: 'Rendement de Tir', unit: 'm/volée', maKey: 'movingAvgYield', rawKey: 'yieldPerVol', color: '#10b981' };
      case 'explosifs': return { name: 'Ratio Explosifs', unit: 'kg/m', maKey: 'movingAvgExplosive', rawKey: 'specificExplosive', color: '#f43f5e' };
      case 'gasoil': return { name: 'Ratio Énergie Gasoil', unit: 'L/m³', maKey: 'movingAvgGasoil', rawKey: 'specificGasoil', color: '#0ea5e9' };
      default: return { name: 'Présence Brigade', unit: 'agents', maKey: 'movingAvgPresence', rawKey: 'realPresence', color: '#8b5cf6' };
    }
  }, [metricTab]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top filter dashboard */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-slate-50 border border-[#d4af37]/35 p-4.5 rounded-2xl relative overflow-hidden shadow-2xs">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0ea5e9] to-[#ef4444]" />
        <div className="flex items-center gap-2 mt-1">
          <ChartIcon className="w-5 h-5 text-[#b8860b]" />
          <div>
            <h2 className="text-xs font-black uppercase text-slate-800">Cockpit Historique & Tendances Long Terme</h2>
            <p className="text-[9.5px] text-slate-400 uppercase font-black">Visualisation analytique avancée, moyennes mobiles lissées & comparaison de périodes</p>
          </div>
        </div>

        {/* Filters Controls */}
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
          {/* Timeframe selector */}
          <div className="inline-flex p-1 bg-white border border-slate-200 rounded-xl">
            {[
              { id: '30', label: '30J' },
              { id: '90', label: '90J' },
              { id: '180', label: '180J' },
              { id: '365', label: '365J' },
              { id: 'all', label: 'Tout' }
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

          {/* Moving Average Window */}
          <div className="inline-flex p-1 bg-white border border-slate-200 rounded-xl">
            <span className="text-[8px] font-black uppercase text-slate-400 px-2 flex items-center">Moy. Mobile :</span>
            <button
              onClick={() => setMaWindow(7)}
              className={`text-[9.5px] font-black uppercase py-1 px-2.5 rounded-lg cursor-pointer transition-all ${
                maWindow === 7 ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              7J
            </button>
            <button
              onClick={() => setMaWindow(30)}
              className={`text-[9.5px] font-black uppercase py-1 px-2.5 rounded-lg cursor-pointer transition-all ${
                maWindow === 30 ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              30J
            </button>
          </div>
        </div>
      </div>

      {/* METRIC SELECTION TABS */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {[
          { id: 'forage', label: 'Forage (m)', icon: <Activity className="w-3.5 h-3.5" />, val: `${metricStats.totalMet.toFixed(0)}m` },
          { id: 'deblayage', label: 'Déblayage (m³)', icon: <Tractor className="w-3.5 h-3.5" />, val: `${metricStats.totalVol.toFixed(0)}m³` },
          { id: 'extraction', label: 'Extraction (wg)', icon: <Zap className="w-3.5 h-3.5" />, val: `${metricStats.totalWag}wg` },
          { id: 'rendement', label: 'Rendement', icon: <TrendingUp className="w-3.5 h-3.5" />, val: 'm/volée' },
          { id: 'explosifs', label: 'Explosifs', icon: <Bomb className="w-3.5 h-3.5" />, val: 'kg/m' },
          { id: 'gasoil', label: 'Gasoil', icon: <Flame className="w-3.5 h-3.5" />, val: 'L/m³' },
          { id: 'presences', label: 'Présences', icon: <Users className="w-3.5 h-3.5" />, val: 'brigade' }
        ].map(m => (
          <button
            key={m.id}
            onClick={() => setMetricTab(m.id as any)}
            className={`p-3 border rounded-xl flex flex-col justify-between items-start text-left cursor-pointer transition-all shadow-3xs relative overflow-hidden ${
              metricTab === m.id 
                ? 'border-[#d4af37] bg-amber-50/10 text-[#b8860b]' 
                : 'border-[#d4af37]/35 bg-white text-slate-500 hover:border-[#d4af37]/75'
            }`}
          >
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#0ea5e9] to-[#ef4444]" />
            <div className="flex items-center gap-1.5 mt-1">
              {m.icon}
              <span className="text-[9.5px] font-black uppercase tracking-wide">{m.label}</span>
            </div>
            <span className="text-[10px] font-mono font-black text-slate-800 mt-2 block">{m.val}</span>
          </button>
        ))}
      </div>

      {/* COMPARISON AND CHART GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Period-over-period comparison card */}
        <div className="bg-white border border-[#d4af37]/35 rounded-2xl p-5 flex flex-col justify-between space-y-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#0ea5e9] to-[#ef4444]" />
          <div className="mt-1">
            <span className="text-[8.5px] font-extrabold text-slate-400 uppercase tracking-widest block">Comparaison de Périodes</span>
            <h3 className="text-xs font-black uppercase text-slate-800 mt-1">Évolution de la Performance</h3>
            <p className="text-[9.5px] text-slate-400 uppercase font-bold leading-normal mt-1.5">
              Compare la moyenne de la période de {timeframe} jours sélectionnée avec les {timeframe} jours immédiatement précédents.
            </p>
          </div>

          {periodComparison ? (
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Période Actuelle :</span>
                <span className="text-sm font-mono font-black text-slate-800">
                  {periodComparison.current.toFixed(2)} <span className="text-[10px] font-normal text-slate-400">{activeMetricLabel.unit}</span>
                </span>
              </div>
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Période Précédente :</span>
                <span className="text-sm font-mono font-black text-slate-500">
                  {periodComparison.preceding.toFixed(2)} <span className="text-[10px] font-normal text-slate-400">{activeMetricLabel.unit}</span>
                </span>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <span className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                  periodComparison.change >= 0 
                    ? (metricTab === 'explosifs' || metricTab === 'gasoil' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600')
                    : (metricTab === 'explosifs' || metricTab === 'gasoil' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600')
                }`}>
                  {periodComparison.change >= 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                </span>
                <div>
                  <span className={`text-base font-black ${
                    periodComparison.change >= 0 
                      ? (metricTab === 'explosifs' || metricTab === 'gasoil' ? 'text-rose-600' : 'text-emerald-600')
                      : (metricTab === 'explosifs' || metricTab === 'gasoil' ? 'text-emerald-600' : 'text-rose-600')
                  }`}>
                    {periodComparison.change >= 0 ? '+' : ''}{periodComparison.change.toFixed(1)}%
                  </span>
                  <span className="text-[8px] text-slate-400 uppercase font-bold block mt-0.5">Taux de variation du ratio</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-6 text-[9.5px] text-slate-400 uppercase font-black bg-slate-50 border border-slate-100 rounded-xl">
              Données historiques insuffisantes pour générer la comparaison de période ({timeframe}J x 2 requis).
            </div>
          )}

          {/* Dynamic helper alert */}
          <div className="bg-slate-50 border border-slate-150 p-3 rounded-xl text-[9px] font-medium text-slate-500 leading-normal">
            ⚙️ <strong className="font-extrabold text-slate-800 uppercase">Analyse :</strong> Le lissage par moyenne mobile lissé à {maWindow} jours filtre les micro-variations quotidiennes pour faire ressortir les grandes tendances structurelles de la SMI.
          </div>
        </div>

        {/* Main Chart Card */}
        <div className="bg-white border border-[#d4af37]/35 rounded-2xl p-5 col-span-1 lg:col-span-2 space-y-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#0ea5e9] to-[#ef4444]" />
          <div className="flex justify-between items-center border-b border-slate-100 pb-3 mt-1">
            <h3 className="text-xs font-black uppercase text-slate-800 tracking-wide flex items-center gap-1.5">
              <Activity className="w-4 h-4 text-[#b8860b]" /> Graphique Temporel : {activeMetricLabel.name} ({activeMetricLabel.unit})
            </h3>
            <span className="text-[8px] font-black uppercase bg-slate-100 px-2 py-0.5 rounded text-slate-500">Moyenne Mobile à {maWindow} jours</span>
          </div>

          <div className="h-72 w-full font-mono text-[9px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={filteredHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorMetricDynamic" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={activeMetricLabel.color} stopOpacity={0.2}/>
                    <stop offset="95%" stopColor={activeMetricLabel.color} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="formattedDate" tick={{ fontSize: 9, fontWeight: 'bold' }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 9, fontFamily: 'monospace' }} stroke="#94a3b8" />
                <Tooltip />
                <Legend wrapperStyle={{ fontSize: 9, fontWeight: 'bold', textTransform: 'uppercase' }} />
                
                {/* Daily actual area */}
                <Area 
                  name={`Réel quotidien (${activeMetricLabel.unit})`} 
                  type="monotone" 
                  dataKey={activeMetricLabel.rawKey} 
                  stroke={activeMetricLabel.color} 
                  strokeWidth={1.5} 
                  fillOpacity={1} 
                  fill="url(#colorMetricDynamic)" 
                />

                {/* Moving average line */}
                <Line 
                  name={`Moyenne Mobile lissée (${activeMetricLabel.unit})`} 
                  type="monotone" 
                  dataKey={activeMetricLabel.maKey} 
                  stroke="#0f172a" 
                  strokeWidth={2.5} 
                  dot={false} 
                  strokeDasharray="4 4" 
                />

                {/* Target if available */}
                {activeMetricLabel.targetKey && (
                  <Area 
                    name={`Cible Planifiée (${activeMetricLabel.unit})`} 
                    type="monotone" 
                    dataKey={activeMetricLabel.targetKey} 
                    stroke="#94a3b8" 
                    strokeWidth={1} 
                    fill="none" 
                    strokeDasharray="3 3" 
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* CUMULATIVE GAP ANALYSIS (DÉFICIT AVANCEMENT linéaire) */}
      <div className="bg-white border border-[#d4af37]/35 rounded-2xl p-5 space-y-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#0ea5e9] to-[#ef4444]" />
        <h3 className="text-xs font-black uppercase text-slate-800 mt-1">Visualisation de l'Écart Cumulé et des Cibles de Rattrapage</h3>
        <p className="text-[10px] text-slate-500 uppercase leading-relaxed">
          Permet de suivre l'évolution de la trajectoire cumulée de forage lineal (m) de la SMI par rapport aux objectifs planifiés. L'aire entre les deux courbes représente le déficit de production cumulé.
        </p>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={filteredHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="formattedDate" tick={{ fontSize: 9, fontWeight: 'bold' }} stroke="#94a3b8" />
              <YAxis tick={{ fontSize: 9, fontFamily: 'monospace' }} stroke="#94a3b8" />
              <Tooltip />
              <Legend wrapperStyle={{ fontSize: 9, fontWeight: 'bold', textTransform: 'uppercase' }} />
              <Line name="Avancement Cumulé Réel" type="monotone" dataKey="cumulativeRealMeters" stroke="#b8860b" strokeWidth={3} dot={false} unit=" m" />
              <Line name="Objectif Cumulé Prévu" type="monotone" dataKey="cumulativePlanMeters" stroke="#475569" strokeWidth={2} dot={false} strokeDasharray="4 4" unit=" m" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
