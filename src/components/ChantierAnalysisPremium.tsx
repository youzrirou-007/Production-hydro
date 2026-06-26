import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  MapPin, 
  Layers, 
  Target, 
  Bomb, 
  Truck, 
  PlayCircle, 
  AlertTriangle, 
  Compass, 
  Calendar,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip,
  BarChart,
  Bar,
  LineChart,
  Line
} from 'recharts';
import { format, parseISO } from 'date-fns';

interface Chantier {
  id: string;
  name: string;
  sector: string;
  galleryType: '9m2' | '12m2';
  plannedTotalMeterage: number;
  currentMeterage: number;
  status: 'ouvert' | 'fermé';
  createdAt?: string;
}

interface ChantierAnalysisPremiumProps {
  chantiers: Chantier[];
  allProductionDocs: any[];
  allPlanningSheets: any[];
  reportType: 'day' | 'month';
  filterDate: string;
  filterMonth: string;
}

export const ChantierAnalysisPremium: React.FC<ChantierAnalysisPremiumProps> = ({
  chantiers,
  allProductionDocs,
  allPlanningSheets,
  reportType,
  filterDate,
  filterMonth
}) => {
  const [activeSubView, setActiveSubView] = useState<'top' | 'retard' | 'cloture' | 'inactifs' | 'evolution'>('top');
  const [selectedChantierId, setSelectedChantierId] = useState<string>(chantiers[0]?.id || '');

  // Timezone safe date converter helper
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

  // Compile stats for all chantiers over the available history
  const chantierStats = useMemo(() => {
    const stats: { [id: string]: {
      id: string;
      meters: number;
      rounds: number;
      anfo: number;
      tovex: number;
      volume: number;
      godets: number;
      lastActiveDate: string;
      activityHistory: { date: string; meters: number; volume: number }[];
    } } = {};

    // Initialize list
    chantiers.forEach(c => {
      stats[c.id] = {
        id: c.id,
        meters: 0,
        rounds: 0,
        anfo: 0,
        tovex: 0,
        volume: 0,
        godets: 0,
        lastActiveDate: '',
        activityHistory: []
      };
    });

    // Sort production docs chronologically
    const sortedDocs = [...allProductionDocs].sort((a, b) => a.id.localeCompare(b.id));

    sortedDocs.forEach(pDoc => {
      const dateStr = pDoc.id;
      const postes = pDoc.postes || {};

      const dailyMeters: { [id: string]: number } = {};
      const dailyVolume: { [id: string]: number } = {};

      ['poste1', 'poste2', 'poste3'].forEach(pKey => {
        const postObj = postes[pKey] || {};
        
        // Minage
        (postObj.minage || []).forEach((row: any) => {
          const r = row.reel || row || {};
          const cId = r.chantierId;
          if (cId && stats[cId]) {
            const meters = Number(r.realMeterage || 0);
            stats[cId].meters += meters;
            stats[cId].rounds += Number(r.realRounds || 0);
            stats[cId].anfo += Number(r.anfo || 0);
            stats[cId].tovex += Number(r.tovex || 0);
            stats[cId].lastActiveDate = dateStr;
            dailyMeters[cId] = (dailyMeters[cId] || 0) + meters;
          }
        });

        // Deblayage
        (postObj.deblayage || []).forEach((row: any) => {
          const r = row.reel || row || {};
          const cId = r.chantierId;
          if (cId && stats[cId]) {
            const volume = Number(r.volumeEstimated || 0);
            stats[cId].volume += volume;
            stats[cId].godets += Number(r.godets || 0);
            stats[cId].lastActiveDate = dateStr;
            dailyVolume[cId] = (dailyVolume[cId] || 0) + volume;
          }
        });
      });

      // Append daily history points
      chantiers.forEach(c => {
        if (dailyMeters[c.id] || dailyVolume[c.id]) {
          stats[c.id].activityHistory.push({
            date: dateStr,
            meters: dailyMeters[c.id] || 0,
            volume: dailyVolume[c.id] || 0
          });
        }
      });
    });

    return stats;
  }, [chantiers, allProductionDocs]);

  // Combine Firestore Chantiers with computed production stats
  const compiledChantiers = useMemo(() => {
    return chantiers.map(c => {
      const s = chantierStats[c.id] || {
        meters: 0,
        rounds: 0,
        anfo: 0,
        tovex: 0,
        volume: 0,
        godets: 0,
        lastActiveDate: '',
        activityHistory: []
      };

      const planned = Number(c.plannedTotalMeterage || 0);
      const realized = Number(c.currentMeterage || s.meters || 0);
      const pctRealized = planned > 0 ? (realized / planned) * 100 : 0;
      const avgYield = s.rounds > 0 ? s.meters / s.rounds : 0;
      const totalExplosives = s.anfo + s.tovex;

      // Find if chantier has planned targets in active days
      let plannedPeriodMeters = 0;
      allPlanningSheets.forEach(pSheet => {
        const postes = pSheet.postes || {};
        ['poste1', 'poste2', 'poste3'].forEach(pKey => {
          const pMinage = postes[pKey]?.minage || [];
          pMinage.forEach((row: any) => {
            if (row.chantierId === c.id) {
              plannedPeriodMeters += Number(row.meterage || row.plannedRounds * 1.7 || 0);
            }
          });
        });
      });

      // Delay metrics
      const isLagging = plannedPeriodMeters > 0 && s.meters < plannedPeriodMeters;
      const periodDeficit = Math.max(0, plannedPeriodMeters - s.meters);

      return {
        ...c,
        realizedMeterage: realized,
        percentageCompleted: pctRealized,
        roundsCount: s.rounds,
        avgYield,
        totalExplosives,
        deblayageVolume: s.volume,
        lastActiveDate: s.lastActiveDate,
        isLagging,
        periodDeficit,
        activityHistory: s.activityHistory
      };
    });
  }, [chantiers, chantierStats, allPlanningSheets]);

  // Categorize for sub-views
  const topChantiers = useMemo(() => {
    return [...compiledChantiers]
      .filter(c => c.status === 'ouvert')
      .sort((a, b) => b.percentageCompleted - a.percentageCompleted);
  }, [compiledChantiers]);

  const chantiersEnRetard = useMemo(() => {
    return compiledChantiers
      .filter(c => c.status === 'ouvert' && (c.isLagging || c.periodDeficit > 0))
      .sort((a, b) => b.periodDeficit - a.periodDeficit);
  }, [compiledChantiers]);

  const chantiersProchesCloture = useMemo(() => {
    return compiledChantiers
      .filter(c => c.status === 'ouvert' && c.percentageCompleted >= 80 && c.percentageCompleted < 100)
      .sort((a, b) => b.percentageCompleted - a.percentageCompleted);
  }, [compiledChantiers]);

  const chantiersInactifs = useMemo(() => {
    // No activity recorded in the database overall, or last date is empty
    return compiledChantiers
      .filter(c => c.status === 'ouvert' && (!c.lastActiveDate || c.activityHistory.length === 0))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [compiledChantiers]);

  // Active evolution chantier details
  const activeEvoChantier = useMemo(() => {
    const match = compiledChantiers.find(c => c.id === selectedChantierId);
    if (!match) return compiledChantiers[0];

    // Build cumulative array for Recharts
    let cumulative = 0;
    const chartData = match.activityHistory.map(pt => {
      cumulative += pt.meters;
      let formattedDate = pt.date;
      try {
        formattedDate = format(parseISO(pt.date), 'dd/MM');
      } catch (e) {}

      return {
        date: formattedDate,
        meters: Number(pt.meters.toFixed(1)),
        cumulativeMeters: Number(cumulative.toFixed(1)),
        volume: Number(pt.volume.toFixed(1))
      };
    });

    return {
      ...match,
      chartData
    };
  }, [compiledChantiers, selectedChantierId]);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header section with summary */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50 border border-[#d4af37]/35 p-4.5 rounded-2xl relative overflow-hidden shadow-2xs">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0ea5e9] to-[#ef4444]" />
        <div className="flex items-center gap-2 mt-1">
          <Compass className="w-5 h-5 text-[#b8860b]" />
          <div>
            <h2 className="text-xs font-black uppercase text-slate-800">Analyse Premium d'Avancement Chantiers</h2>
            <p className="text-[9px] text-slate-400 font-extrabold uppercase">Unité opérationnelle centrale • Forage, explosifs & chargement consolidé</p>
          </div>
        </div>

        {/* Mini stats count pill */}
        <div className="flex gap-2">
          <span className="text-[9px] font-black uppercase bg-slate-200 text-slate-700 px-2.5 py-1 rounded-lg">
            Ouverts : {compiledChantiers.filter(c => c.status === 'ouvert').length}
          </span>
          <span className="text-[9px] font-black uppercase bg-slate-900 text-slate-200 px-2.5 py-1 rounded-lg">
            Fermés : {compiledChantiers.filter(c => c.status === 'fermé').length}
          </span>
        </div>
      </div>

      {/* Sub tabs selectors */}
      <div className="flex flex-wrap gap-1.5 border-b border-gray-150 pb-px">
        {[
          { id: 'top', label: 'Top Chantiers', icon: <Sparkles className="w-4 h-4" /> },
          { id: 'retard', label: 'Chantiers en Retard', icon: <AlertTriangle className="w-4 h-4" /> },
          { id: 'cloture', label: 'Proches Clôture', icon: <Target className="w-4 h-4" /> },
          { id: 'inactifs', label: 'Inactifs', icon: <PlayCircle className="w-4 h-4" /> },
          { id: 'evolution', label: 'Évolution Chantier', icon: <TrendingUp className="w-4 h-4" /> }
        ].map(tb => (
          <button
            key={tb.id}
            onClick={() => setActiveSubView(tb.id as any)}
            className={`flex items-center gap-1.5 px-3.5 py-2.5 border-b-2 font-black text-[10px] uppercase tracking-wider transition-all cursor-pointer ${
              activeSubView === tb.id 
                ? 'border-[#b8860b] text-[#b8860b] bg-amber-50/10' 
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            {tb.icon}
            {tb.label}
          </button>
        ))}
      </div>

      {/* Content pane */}
      <div className="bg-white border border-[#d4af37]/35 rounded-2xl p-5 relative overflow-hidden shadow-2xs">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#0ea5e9] to-[#ef4444]" />
        
        {/* VIEW: TOP CHANTIERS & RETARD & CLOTURE & INACTIFS (LIST LAYOUT) */}
        {activeSubView !== 'evolution' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black uppercase text-slate-800">
                {activeSubView === 'top' && 'Classement d\'Avancement des Galeries Actives'}
                {activeSubView === 'retard' && 'Salles & Fronts en Écart par Rapport aux Objectifs'}
                {activeSubView === 'cloture' && 'Chantiers proches de 100% de réalisation (Vigilance Clôture)'}
                {activeSubView === 'inactifs' && 'Fronts de taille sans activité opérationnelle récente'}
              </h3>
              <span className="text-[8.5px] font-black uppercase bg-slate-100 px-2 py-0.5 rounded text-slate-500">
                {activeSubView === 'top' && 'Ordre décroissant de taux d\'avancement'}
                {activeSubView === 'retard' && 'Classés par déficit de mètres de forage'}
                {activeSubView === 'cloture' && 'Seuil : >= 80% réalisé'}
                {activeSubView === 'inactifs' && 'Aucun relevé d\'activité de minage/déblayage sur la période'}
              </span>
            </div>

            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <table className="w-full text-left border-collapse text-[10.5px]">
                <thead>
                  <tr className="bg-slate-900 text-white uppercase text-[8.5px] font-bold">
                    <th className="p-3">Chantier / Galerie</th>
                    <th className="p-3">Secteur</th>
                    <th className="p-3 text-center">Type Galerie</th>
                    <th className="p-3 text-center">Objectif Total</th>
                    <th className="p-3 text-center">Avancement Cumulé</th>
                    <th className="p-3 text-center">Progression</th>
                    <th className="p-3 text-center">Rendement Moyen</th>
                    <th className="p-3 text-center">Explosifs Consommé</th>
                    <th className="p-3 text-center">Volume Déblayé</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {/* Map active list based on selection */}
                  {(activeSubView === 'top' ? topChantiers : 
                    activeSubView === 'retard' ? chantiersEnRetard : 
                    activeSubView === 'cloture' ? chantiersProchesCloture : 
                    chantiersInactifs).map((c, idx) => {
                    const progressColor = c.percentageCompleted >= 90 ? 'bg-emerald-500' : c.percentageCompleted >= 50 ? 'bg-amber-500' : 'bg-slate-400';
                    return (
                      <tr key={c.id} className="hover:bg-slate-50/50">
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-slate-800 uppercase block">{c.name}</span>
                            {c.isLagging && (
                              <span className="text-[7.5px] font-black bg-rose-50 text-rose-700 px-1 py-0.2 rounded border border-rose-100 uppercase">En retard (-{c.periodDeficit.toFixed(1)}m)</span>
                            )}
                          </div>
                          <span className="text-[8.5px] font-bold text-slate-400 uppercase font-mono">{c.id}</span>
                        </td>
                        <td className="p-3 uppercase font-bold text-slate-500 text-[9px]">
                          {c.sector}
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-slate-600">
                          {c.galleryType}
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-slate-700">
                          {c.plannedTotalMeterage.toFixed(1)} m
                        </td>
                        <td className="p-3 text-center font-mono font-black text-slate-900">
                          {c.realizedMeterage.toFixed(1)} m
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2 justify-center">
                            <div className="w-14 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                              <div className={`h-full ${progressColor}`} style={{ width: `${Math.min(100, c.percentageCompleted)}%` }} />
                            </div>
                            <span className="font-mono font-bold text-slate-700 w-8 text-right text-[10px]">
                              {c.percentageCompleted.toFixed(0)}%
                            </span>
                          </div>
                        </td>
                        <td className="p-3 text-center">
                          {c.avgYield > 0 ? (
                            <span className="px-1.5 py-0.5 rounded text-[8.5px] font-black bg-emerald-50 text-emerald-800">
                              {c.avgYield.toFixed(2)} m/v
                            </span>
                          ) : (
                            <span className="text-slate-300 font-bold">-</span>
                          )}
                        </td>
                        <td className="p-3 text-center font-mono text-slate-500">
                          {c.totalExplosives > 0 ? `${c.totalExplosives.toFixed(0)} kg` : '-'}
                        </td>
                        <td className="p-3 text-center font-mono font-bold text-sky-600">
                          {c.deblayageVolume > 0 ? `${c.deblayageVolume.toFixed(1)} m³` : '-'}
                        </td>
                      </tr>
                    );
                  })}
                  {/* Empty fallback states */}
                  {((activeSubView === 'top' && topChantiers.length === 0) ||
                    (activeSubView === 'retard' && chantiersEnRetard.length === 0) ||
                    (activeSubView === 'cloture' && chantiersProchesCloture.length === 0) ||
                    (activeSubView === 'inactifs' && chantiersInactifs.length === 0)) && (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-400 uppercase font-black text-[9.5px]">
                        Aucune galerie ne correspond aux critères de cette vue.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* VIEW: EVOLUTION CHRONOLOGIQUE D'UN CHANTIER */}
        {activeSubView === 'evolution' && (
          <div className="space-y-6">
            {/* Top selector row */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="flex flex-col gap-1">
                <span className="text-[8px] font-black text-slate-400 uppercase">SÉLECTIONNEZ LE CHANTIER À ANALYSER :</span>
                <select
                  value={selectedChantierId}
                  onChange={e => setSelectedChantierId(e.target.value)}
                  className="bg-white border border-slate-200 text-xs font-black uppercase px-3 py-1.5 rounded-lg focus:border-[#b8860b] focus:outline-none"
                >
                  {compiledChantiers.map(c => (
                    <option key={c.id} value={c.id}>{c.name} ({c.sector})</option>
                  ))}
                </select>
              </div>

              {/* Status info block */}
              {activeEvoChantier && (
                <div className="flex gap-4 text-xs font-mono">
                  <div className="text-left">
                    <span className="text-[8px] text-slate-400 uppercase font-bold block">Statut</span>
                    <span className={`text-[10px] uppercase font-black px-2 py-0.5 rounded border ${
                      activeEvoChantier.status === 'ouvert' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' : 'bg-red-50 text-red-800 border-red-100'
                    }`}>
                      {activeEvoChantier.status}
                    </span>
                  </div>
                  <div>
                    <span className="text-[8px] text-slate-400 uppercase font-bold block">Réalisé</span>
                    <span className="text-[10px] font-black text-slate-800">{activeEvoChantier.realizedMeterage.toFixed(1)} m / {activeEvoChantier.plannedTotalMeterage.toFixed(1)} m</span>
                  </div>
                </div>
              )}
            </div>

            {/* Active details graphs */}
            {activeEvoChantier && activeEvoChantier.chartData.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Metres forés cumulative progress */}
                <div className="border border-[#d4af37]/35 rounded-xl p-4.5 bg-white space-y-3 relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0ea5e9] to-[#ef4444]" />
                  <div className="flex justify-between items-center mt-1">
                    <h4 className="text-[11px] font-black uppercase text-slate-800">Avancement cumulé linéaire (m)</h4>
                    <span className="text-[9px] font-black text-[#b8860b]">{activeEvoChantier.percentageCompleted.toFixed(1)}% Réalisé</span>
                  </div>
                  <div className="h-64 font-mono text-[9px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={activeEvoChantier.chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorEvoMet" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#b8860b" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#b8860b" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="date" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" unit="m" />
                        <Tooltip />
                        <Area name="Cumul Avancement" type="monotone" dataKey="cumulativeMeters" stroke="#b8860b" strokeWidth={2.5} fill="url(#colorEvoMet)" />
                        <Area name="Avancement Jour" type="monotone" dataKey="meters" stroke="#cbd5e1" strokeWidth={1} fill="none" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Volumes déblayés par jour */}
                <div className="border border-[#d4af37]/35 rounded-xl p-4.5 bg-white space-y-3 relative overflow-hidden">
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0ea5e9] to-[#ef4444]" />
                  <div className="flex justify-between items-center mt-1">
                    <h4 className="text-[11px] font-black uppercase text-slate-800">Évacuation et Chargement LHD par jour (m³)</h4>
                    <span className="text-[9px] font-black text-sky-600">{activeEvoChantier.deblayageVolume.toFixed(1)} m³ cumulés</span>
                  </div>
                  <div className="h-64 font-mono text-[9px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={activeEvoChantier.chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="date" stroke="#94a3b8" />
                        <YAxis stroke="#94a3b8" unit="m³" />
                        <Tooltip />
                        <Bar name="Volume Déblayé" dataKey="volume" fill="#0ea5e9" radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>
            ) : (
              <div className="text-center py-12 text-slate-400 bg-slate-50 border border-slate-100 rounded-xl uppercase font-black text-[9.5px]">
                Aucun historique de production disponible pour cette galerie sur la période.
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
