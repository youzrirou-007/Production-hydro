import React, { useState, useMemo } from 'react';
import { 
  ShieldAlert, 
  AlertOctagon, 
  AlertTriangle, 
  Info, 
  Filter, 
  Bomb, 
  Tractor, 
  Activity, 
  Calendar,
  CheckCircle2,
  TrendingDown
} from 'lucide-react';

interface SmartAlertsCenterProps {
  allProductionDocs: any[];
  allPlanningSheets: any[];
  chantiers?: any[];
  employees?: any[];
  engines?: any[];
  smartExecutiveAlerts?: any[];
}

export const SmartAlertsCenter: React.FC<SmartAlertsCenterProps> = ({
  allProductionDocs,
  allPlanningSheets,
  chantiers = [],
  employees = [],
  engines = [],
  smartExecutiveAlerts
}) => {
  const [severityFilter, setSeverityFilter] = useState<'all' | 'red' | 'amber' | 'blue'>('all');

  const getChantierName = (id: string) => {
    if (!id) return 'N/A';
    const match = chantiers.find(c => c.id === id);
    return match ? match.name : id;
  };

  const getPersonnelName = (matricule: string) => {
    if (!matricule) return '';
    const match = employees.find(e => e.matricule?.toUpperCase() === matricule.toUpperCase());
    return match ? `${match.nom} ${match.prenom}` : matricule;
  };

  // Compile statistical anomalies across the entire dataset
  const generatedAlerts = useMemo(() => {
    if (smartExecutiveAlerts) return smartExecutiveAlerts;
    const list: {
      id: string;
      type: 'red' | 'amber' | 'blue';
      title: string;
      message: string;
      category: 'FORAGE' | 'DÉBLAYAGE' | 'EXTRACTION' | 'MAINTENANCE' | 'ÉNERGIE' | 'RH';
      metric: string;
      deviation?: string;
    }[] = [];

    if (allProductionDocs.length === 0) return list;

    // A. CALCULATE GENERAL STATISTICAL AVERAGES OF THE PERIOD FOR DEVIATION ANALYSIS
    let totalMeters = 0;
    let totalRounds = 0;
    let totalAnfo = 0;
    let totalTovex = 0;
    let totalVolume = 0;
    let totalGasoil = 0;

    // Track per-chantier metrics to calculate average specific consumption
    const chantierSpecifics: { [id: string]: { meters: number; explosives: number; volume: number; gasoil: number; rounds: number } } = {};

    allProductionDocs.forEach(pDoc => {
      ['poste1', 'poste2', 'poste3'].forEach(pKey => {
        const pObj = pDoc.postes?.[pKey] || {};
        
        (pObj.minage || []).forEach((row: any) => {
          const r = row.reel || row;
          const cId = r.chantierId;
          if (cId) {
            if (!chantierSpecifics[cId]) {
              chantierSpecifics[cId] = { meters: 0, explosives: 0, volume: 0, gasoil: 0, rounds: 0 };
            }
            const meters = Number(r.realMeterage || 0);
            const explosives = Number(r.anfo || 0) + Number(r.tovex || 0);
            const rounds = Number(r.realRounds || 0);

            chantierSpecifics[cId].meters += meters;
            chantierSpecifics[cId].explosives += explosives;
            chantierSpecifics[cId].rounds += rounds;

            totalMeters += meters;
            totalRounds += rounds;
            totalAnfo += Number(r.anfo || 0);
            totalTovex += Number(r.tovex || 0);
          }
        });

        (pObj.deblayage || []).forEach((row: any) => {
          const r = row.reel || row;
          const cId = r.chantierId;
          if (cId) {
            if (!chantierSpecifics[cId]) {
              chantierSpecifics[cId] = { meters: 0, explosives: 0, volume: 0, gasoil: 0, rounds: 0 };
            }
            const vol = Number(r.volumeEstimated || 0);
            const gas = Number(r.gasoil || 0);

            chantierSpecifics[cId].volume += vol;
            chantierSpecifics[cId].gasoil += gas;

            totalVolume += vol;
            totalGasoil += gas;
          }
        });
      });
    });

    // Sector averages
    const overallAvgSpecificExplosive = totalMeters > 0 ? (totalAnfo + totalTovex) / totalMeters : 0;
    const overallAvgSpecificGasoil = totalVolume > 0 ? totalGasoil / totalVolume : 0;
    const overallAvgDrillingYield = totalRounds > 0 ? totalMeters / totalRounds : 0;

    // B. DETECT ANOMALIES
    
    // 1. ANOMALY: Surconsommation d'explosifs (> 20% de la moyenne)
    Object.keys(chantierSpecifics).forEach(cId => {
      const stats = chantierSpecifics[cId];
      if (stats.meters > 5) {
        const specExp = stats.explosives / stats.meters;
        if (overallAvgSpecificExplosive > 0 && specExp > overallAvgSpecificExplosive * 1.25) {
          const pct = ((specExp - overallAvgSpecificExplosive) / overallAvgSpecificExplosive) * 100;
          list.push({
            id: `exp-${cId}`,
            type: 'red',
            title: 'SURCONSOMMATION EXPLOSIFS CRITIQUE',
            message: `Le chantier "${getChantierName(cId)}" a un ratio d'explosifs spécifique anormal de ${specExp.toFixed(1)} kg/m contre une moyenne globale de ${overallAvgSpecificExplosive.toFixed(1)} kg/m.`,
            category: 'ÉNERGIE',
            metric: `${specExp.toFixed(1)} kg/m`,
            deviation: `+${pct.toFixed(0)}%`
          });
        }
      }
    });

    // 2. ANOMALY: Sous-performance de forage (< 20% de la cible planifiée)
    // Compare historical target meters with real meters for open chantiers
    Object.keys(chantierSpecifics).forEach(cId => {
      const stats = chantierSpecifics[cId];
      let plannedMeters = 0;
      allPlanningSheets.forEach(pSheet => {
        ['poste1', 'poste2', 'poste3'].forEach(pKey => {
          (pSheet.postes?.[pKey]?.minage || []).forEach((row: any) => {
            if (row.chantierId === cId) {
              plannedMeters += Number(row.meterage || row.plannedRounds * 1.7 || 0);
            }
          });
        });
      });

      if (plannedMeters > 10) {
        const gap = plannedMeters - stats.meters;
        const pctReal = (stats.meters / plannedMeters) * 100;
        if (pctReal < 75) {
          list.push({
            id: `forage-gap-${cId}`,
            type: 'red',
            title: "RETARD D'AVANCEMENT SUR FRONT",
            message: `Le front "${getChantierName(cId)}" affiche un retard sévère de production linéaire. Seulement ${stats.meters.toFixed(1)}m forés sur un objectif planifié de ${plannedMeters.toFixed(1)}m.`,
            category: 'FORAGE',
            metric: `${pctReal.toFixed(0)}% d'objectif`,
            deviation: `Déficit de ${gap.toFixed(1)}m`
          });
        }
      }
    });

    // 3. ANOMALY: Énergie & Éco-conduite (> 20% de surconsommation gasoil)
    Object.keys(chantierSpecifics).forEach(cId => {
      const stats = chantierSpecifics[cId];
      if (stats.volume > 15) {
        const specGas = stats.gasoil / stats.volume;
        if (overallAvgSpecificGasoil > 0 && specGas > overallAvgSpecificGasoil * 1.25) {
          const pct = ((specGas - overallAvgSpecificGasoil) / overallAvgSpecificGasoil) * 100;
          list.push({
            id: `gasoil-${cId}`,
            type: 'amber',
            title: "SURCONSOMMATION CARBURANT (ÉCO-CONDUITE)",
            message: `Le roulage/chargement sur "${getChantierName(cId)}" consomme un ratio de gasoil de ${specGas.toFixed(2)} L/m³ contre une moyenne de ${overallAvgSpecificGasoil.toFixed(2)} L/m³.`,
            category: 'ÉNERGIE',
            metric: `${specGas.toFixed(2)} L/m³`,
            deviation: `+${pct.toFixed(0)}%`
          });
        }
      }
    });

    // 4. ANOMALY: Rendement de forage faible (par rapport à la moyenne globale)
    Object.keys(chantierSpecifics).forEach(cId => {
      const stats = chantierSpecifics[cId];
      if (stats.rounds > 2) {
        const yld = stats.meters / stats.rounds;
        if (overallAvgDrillingYield > 0 && yld < overallAvgDrillingYield * 0.8) {
          const pct = ((overallAvgDrillingYield - yld) / overallAvgDrillingYield) * 100;
          list.push({
            id: `yield-${cId}`,
            type: 'amber',
            title: "FAIBLE RENDEMENT PAR VOLÉE",
            message: `Le rendement moyen de tir du chantier "${getChantierName(cId)}" est de ${yld.toFixed(2)} m/volée contre une moyenne de ${overallAvgDrillingYield.toFixed(2)} m/volée.`,
            category: 'FORAGE',
            metric: `${yld.toFixed(2)} m/v`,
            deviation: `-${pct.toFixed(0)}% de rendement`
          });
        }
      }
    });

    // 5. ANOMALY: Heures de maintenance lourde (> 4h sur une seule intervention)
    allProductionDocs.forEach(pDoc => {
      const dateStr = pDoc.id;
      ['poste1', 'poste2', 'poste3'].forEach(pKey => {
        (pDoc.postes?.[pKey]?.maintenance || []).forEach((row: any) => {
          const r = row.reel || row;
          const hrs = Number(r.hoursSpent || 0);
          if (hrs > 4) {
            list.push({
              id: `maint-${dateStr}-${pKey}-${r.engineCode}`,
              type: 'blue',
              title: "MAINTENANCE TECHNIQUE LOURDE",
              message: `L'engin "${r.engineCode || 'LHD'}" a subi un arrêt technique prolongé de ${hrs} heures le ${dateStr} au ${pKey}.`,
              category: 'MAINTENANCE',
              metric: `${hrs} heures`,
              deviation: `Durée élevée`
            });
          }
        });
      });
    });

    // 6. ANOMALY: Absentéisme / Brigade incomplète (< 85% de présence planifiée)
    allProductionDocs.forEach(pDoc => {
      const dateStr = pDoc.id;
      const prevDateStr = pDoc.id; // Or shift
      const sDoc = allPlanningSheets.find(s => s.id === prevDateStr);
      if (sDoc) {
        let dailyRealPres = 0;
        let dailyPlanPres = 0;

        ['poste1', 'poste2', 'poste3'].forEach(pKey => {
          const realPost = pDoc.postes?.[pKey] || {};
          const planPost = sDoc.postes?.[pKey] || {};

          // Count unique names/matricules in real minage, deblayage, extraction, maintenance
          const realSet = new Set();
          (realPost.minage || []).forEach((r: any) => realSet.add(r.reel?.agentMatricule || r.agentMatricule));
          (realPost.deblayage || []).forEach((r: any) => realSet.add(r.reel?.operatorMatricule || r.operatorMatricule));
          (realPost.extraction || []).forEach((r: any) => {
            const re = r.reel || r;
            [re.treuilliste, re.equipier1, re.equipier2, re.equipier3, re.equipier4].forEach(m => m && realSet.add(m));
          });
          realSet.delete(undefined);
          realSet.delete(null);
          realSet.delete('');

          const planSet = new Set();
          (planPost.minage || []).forEach((r: any) => planSet.add(r.agentMatricule));
          (planPost.deblayage || []).forEach((r: any) => planSet.add(r.operatorMatricule));
          (planPost.extraction || []).forEach((r: any) => {
            [r.treuilliste, r.equipier1, r.equipier2, r.equipier3, r.equipier4].forEach(m => m && planSet.add(m));
          });
          planSet.delete(undefined);
          planSet.delete(null);
          planSet.delete('');

          dailyRealPres += realSet.size;
          dailyPlanPres += planSet.size;
        });

        if (dailyPlanPres > 0) {
          const rate = (dailyRealPres / dailyPlanPres) * 100;
          if (rate < 85) {
            list.push({
              id: `presence-gap-${dateStr}`,
              type: 'amber',
              title: "BRIGADE INCOMPLÈTE SUR SHIFT",
              message: `Le taux de présence global pour le jour ${dateStr} était de ${rate.toFixed(0)}% (${dailyRealPres} présents vs ${dailyPlanPres} planifiés).`,
              category: 'RH',
              metric: `${rate.toFixed(0)}% présence`,
              deviation: `Absentéisme`
            });
          }
        }
      }
    });

    // Sort: Red first, then Amber, then Blue
    const severityOrder = { red: 0, amber: 1, blue: 2 };
    return list.sort((a, b) => severityOrder[a.type] - severityOrder[b.type]);
  }, [allProductionDocs, allPlanningSheets, chantiers, employees, engines]);

  const filteredAlerts = useMemo(() => {
    if (severityFilter === 'all') return generatedAlerts;
    return generatedAlerts.filter(a => a.type === severityFilter);
  }, [generatedAlerts, severityFilter]);

  const statsCount = useMemo(() => {
    return {
      total: generatedAlerts.length,
      red: generatedAlerts.filter(a => a.type === 'red').length,
      amber: generatedAlerts.filter(a => a.type === 'amber').length,
      blue: generatedAlerts.filter(a => a.type === 'blue').length
    };
  }, [generatedAlerts]);

  return (
    <div className="space-y-6 animate-fade-in text-slate-800">
      {/* Filters bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900 text-white p-5 rounded-2xl border border-[#d4af37]/35 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0ea5e9] to-[#ef4444]" />
        <div className="flex items-center gap-3 mt-1">
          <ShieldAlert className="w-8 h-8 text-rose-500 animate-pulse shrink-0" />
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-300">Centre d'Alertes Cliniques Opérationnelles</h3>
            <span className="text-sm font-black text-white block mt-0.5">Scannage de {statsCount.total} anomalies cliniques</span>
          </div>
        </div>

        {/* Severity toggles */}
        <div className="flex gap-1.5 flex-wrap mt-1">
          <button
            onClick={() => setSeverityFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-[9.5px] font-black uppercase transition-all cursor-pointer ${
              severityFilter === 'all' ? 'bg-white text-slate-900 font-extrabold' : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            Tous ({statsCount.total})
          </button>
          <button
            onClick={() => setSeverityFilter('red')}
            className={`px-3 py-1.5 rounded-lg text-[9.5px] font-black uppercase transition-all cursor-pointer flex items-center gap-1.5 ${
              severityFilter === 'red' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-rose-400 hover:bg-slate-700/60'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-ping" />
            🔴 Critique ({statsCount.red})
          </button>
          <button
            onClick={() => setSeverityFilter('amber')}
            className={`px-3 py-1.5 rounded-lg text-[9.5px] font-black uppercase transition-all cursor-pointer flex items-center gap-1.5 ${
              severityFilter === 'amber' ? 'bg-amber-500 text-slate-900' : 'bg-slate-800 text-amber-400 hover:bg-slate-700/60'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
            🟠 Attention ({statsCount.amber})
          </button>
          <button
            onClick={() => setSeverityFilter('blue')}
            className={`px-3 py-1.5 rounded-lg text-[9.5px] font-black uppercase transition-all cursor-pointer flex items-center gap-1.5 ${
              severityFilter === 'blue' ? 'bg-sky-600 text-white' : 'bg-slate-800 text-sky-400 hover:bg-slate-700/60'
            }`}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
            🔵 Info ({statsCount.blue})
          </button>
        </div>
      </div>

      {/* Grid of active alerts */}
      <div className="grid grid-cols-1 gap-4">
        {filteredAlerts.map(alert => {
          const typeStyle = 
            alert.type === 'red' ? { bg: 'bg-rose-50/50 border-rose-200/60', text: 'text-rose-900', icon: <AlertOctagon className="w-5 h-5 text-rose-600" /> } :
            alert.type === 'amber' ? { bg: 'bg-amber-50/50 border-amber-200/60', text: 'text-amber-950', icon: <AlertTriangle className="w-5 h-5 text-amber-600" /> } :
            { bg: 'bg-sky-50/50 border-sky-200/60', text: 'text-sky-950', icon: <Info className="w-5 h-5 text-sky-600" /> };

          return (
            <div 
              key={alert.id} 
              className={`flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border border-[#d4af37]/35 p-4.5 rounded-xl transition-all hover:translate-x-1 relative overflow-hidden ${typeStyle.bg} ${typeStyle.text}`}
            >
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#0ea5e9] to-[#ef4444]" />
              <div className="flex items-start gap-3 mt-1">
                <div className="mt-0.5 shrink-0">{typeStyle.icon}</div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10.5px] font-black uppercase tracking-wider">{alert.title}</span>
                    <span className="text-[7.5px] font-bold uppercase bg-white/75 px-1.5 py-0.2 border rounded-md">{alert.category}</span>
                  </div>
                  <p className="text-[10px] text-slate-600 font-medium leading-relaxed max-w-3xl mt-1.5">{alert.message}</p>
                </div>
              </div>

              {/* Statistics deviations block */}
              <div className="flex sm:flex-col gap-4 sm:gap-1 text-right items-end justify-between w-full sm:w-auto border-t sm:border-t-0 border-slate-200/60 pt-2 sm:pt-0 shrink-0 font-mono mt-1">
                <div>
                  <span className="text-[8px] text-slate-400 font-bold uppercase block">Mesure de l'écart</span>
                  <span className="text-xs font-black text-slate-800">{alert.metric}</span>
                </div>
                {alert.deviation && (
                  <div>
                    <span className="text-[8.5px] font-black uppercase bg-slate-900 text-white px-2 py-0.5 rounded-md">
                      {alert.deviation}
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {filteredAlerts.length === 0 && (
          <div className="text-center py-12 border border-slate-100 bg-slate-50/50 rounded-2xl">
            <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto animate-bounce mb-3" />
            <h4 className="text-xs font-black uppercase text-slate-700">Aucune anomalie identifiée</h4>
            <p className="text-[10px] text-slate-400 uppercase font-bold mt-1">L'ensemble de vos indicateurs de production respectent les seuils de tolérance et les moyennes.</p>
          </div>
        )}
      </div>
    </div>
  );
};
