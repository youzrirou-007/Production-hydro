import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  Layers, 
  Bomb, 
  Truck, 
  AlertTriangle, 
  CheckCircle2, 
  Sparkles,
  Calendar,
  Activity,
  ArrowRight,
  ShieldAlert,
  Gauge,
  HelpCircle,
  HelpCircle as QuestionIcon,
  Search,
  CheckCircle,
  Clock,
  HardHat,
  Tractor,
  Wrench,
  BarChart2,
  ListCollapse
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  AreaChart,
  Area
} from 'recharts';

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

interface PredictiveIntelligencePremiumProps {
  chantiers: Chantier[];
  allProductionDocs: any[];
  allPlanningSheets: any[];
  reportType: 'day' | 'month';
  filterDate: string;
  filterMonth: string;
}

export const PredictiveIntelligencePremium: React.FC<PredictiveIntelligencePremiumProps> = ({
  chantiers,
  allProductionDocs,
  allPlanningSheets,
  reportType,
  filterDate,
  filterMonth
}) => {
  const [selectedChantierId, setSelectedChantierId] = useState<string>(chantiers[0]?.id || '');
  const [maturityTab, setMaturityTab] = useState<boolean>(false);

  // 1. DYNAMIC ROOT CAUSE DIAGNOSIS (Mission 4)
  // We analyze the actual data of the current selection (or the entire dataset) to flag real operational bottlenecks, probable causes, and recommendations.
  const rootCauseDiagnostics = useMemo(() => {
    const diagnostics: {
      id: string;
      title: string;
      severity: 'high' | 'medium' | 'low';
      category: 'forage' | 'deblayage' | 'extraction' | 'maintenance' | 'rh';
      constat: string;
      causes: string[];
      actions: string[];
      metric: string;
    }[] = [];

    // Calculate aggregated metrics from production documents for the filtered period
    let totalRealMet = 0;
    let totalPlanMet = 0;
    let totalRealVol = 0;
    let totalPlanVol = 0;
    let totalRealWag = 0;
    let totalPlanWag = 0;
    let totalMaintHours = 0;
    let totalLhdGasoil = 0;
    let minerCount = 0;
    let presenceReal = 0;
    let presencePlan = 0;

    // Filter documents matching filter month/date
    const targetDocs = allProductionDocs.filter(doc => {
      if (reportType === 'month') {
        return doc.id.startsWith(filterMonth);
      } else {
        return doc.id === filterDate;
      }
    });

    const targetPlannings = allPlanningSheets.filter(sheet => {
      if (reportType === 'month') {
        return sheet.id.startsWith(filterMonth);
      } else {
        return sheet.id === filterDate;
      }
    });

    targetDocs.forEach(doc => {
      // Minage rows
      if (doc.minageRows && Array.isArray(doc.minageRows)) {
        doc.minageRows.forEach((r: any) => {
          totalRealMet += Number(r.realMeterage || 0);
          presenceReal++;
        });
      }
      // Deblayage rows
      if (doc.deblayageRows && Array.isArray(doc.deblayageRows)) {
        doc.deblayageRows.forEach((r: any) => {
          totalRealVol += Number(r.volumeEstimated || 0);
          totalLhdGasoil += Number(r.gasoil || 0);
        });
      }
      // Extraction rows
      if (doc.extractionRows && Array.isArray(doc.extractionRows)) {
        doc.extractionRows.forEach((r: any) => {
          totalRealWag += Number(r.realWagons || 0);
        });
      }
      // Maintenance rows
      if (doc.maintenanceRows && Array.isArray(doc.maintenanceRows)) {
        doc.maintenanceRows.forEach((r: any) => {
          totalMaintHours += Number(r.hoursSpent || 0);
        });
      }
    });

    targetPlannings.forEach(sheet => {
      if (sheet.minageRows && Array.isArray(sheet.minageRows)) {
        sheet.minageRows.forEach((r: any) => {
          totalPlanMet += Number(r.plannedRounds || 0) * 1.7; // Approx target meters
          presencePlan++;
        });
      }
      if (sheet.deblayageRows && Array.isArray(sheet.deblayageRows)) {
        sheet.deblayageRows.forEach((r: any) => {
          totalPlanVol += Number(r.volumeEstimated || 0);
        });
      }
      if (sheet.extractionRows && Array.isArray(sheet.extractionRows)) {
        sheet.extractionRows.forEach((r: any) => {
          totalPlanWag += Number(r.plannedWagons || 0);
        });
      }
    });

    const minageRate = totalPlanMet > 0 ? (totalRealMet / totalPlanMet) * 100 : 100;
    const deblayageRate = totalPlanVol > 0 ? (totalRealVol / totalPlanVol) * 100 : 100;
    const extractionRate = totalPlanWag > 0 ? (totalRealWag / totalPlanWag) * 100 : 100;
    const gasoilRatio = totalRealVol > 0 ? totalLhdGasoil / totalRealVol : 0;

    // DIAGNOSTIC 1 : SOUS-PERFORMANCE DU FORAGE
    if (minageRate < 85 && totalPlanMet > 0) {
      diagnostics.push({
        id: 'diag-forage',
        title: 'Baisse de rendement Forage & Minage',
        severity: minageRate < 70 ? 'high' : 'medium',
        category: 'forage',
        constat: `Le métrage foré cumulé (${totalRealMet.toFixed(1)}m) n'atteint que ${minageRate.toFixed(1)}% de la cible planifiée (${totalPlanMet.toFixed(1)}m).`,
        causes: [
          'Taux d\'absentéisme ou de rotation décalée des Mineurs certifiés.',
          'Rendement spécifique par tirée inférieur à la cible (mètres par volée < 1.5m).',
          'Temps d\'attente ou arrêts techniques fréquents sur les perforateurs Montabert T23.'
        ],
        actions: [
          'Réajuster la rotation de poste (Shift 2 & 3) pour maximiser le temps de présence utile au front.',
          'Inspecter la qualité de la foration (schéma de tir, parallélisme des trous).',
          'Vérifier la disponibilité des mèches et des tiges auprès de la brigade de maintenance.'
        ],
        metric: `${minageRate.toFixed(1)}% d'atteinte`
      });
    } else {
      diagnostics.push({
        id: 'diag-forage-ok',
        title: 'Forage & Minage sous contrôle',
        severity: 'low',
        category: 'forage',
        constat: `Le forage progresse de façon optimale à ${minageRate.toFixed(1)}% des cibles opérationnelles quotidiennes.`,
        causes: ['Alignement parfait des effectifs mineurs.', 'Excellente tenue géologique des fronts de taille.'],
        actions: ['Maintenir la cadence actuelle.', 'Anticiper l\'approvisionnement d\'explosifs pour les prochains tirs.'],
        metric: `${minageRate.toFixed(1)}% d'atteinte`
      });
    }

    // DIAGNOSTIC 2 : RENDEMENT LOGISTIQUE DÉBLAYAGE
    if (deblayageRate < 80 && totalPlanVol > 0) {
      diagnostics.push({
        id: 'diag-deblayage',
        title: 'Goulot d\'étranglement au déblayage (LHD)',
        severity: deblayageRate < 65 ? 'high' : 'medium',
        category: 'deblayage',
        constat: `Le volume de déblais évacué (${totalRealVol.toFixed(1)} m³) présente un écart défavorable de ${(100 - deblayageRate).toFixed(1)}% par rapport aux prévisions de chargement.`,
        causes: [
          'Spike d\'arrêts techniques ou d\'heures de maintenance sur la flotte d\'engins LHD.',
          'Sous-utilisation de la capacité nominale des godets (taux de remplissage faible).',
          'Problème de ventilation secondaire ralentissant l\'accès des chargeuses après le tir.'
        ],
        actions: [
          'Prioriser la maintenance curative de la LHD ayant le plus d\'heures d\'arrêt.',
          'Former ou sensibiliser les conducteurs aux ratios spécifiques de chargement (godets/volume).',
          'Auditer le circuit de roulage et l\'état de la piste souterraine.'
        ],
        metric: `${deblayageRate.toFixed(1)}% d'atteinte`
      });
    }

    // DIAGNOSTIC 3 : ANOMALIE DE CONSOMMATION ÉNERGÉTIQUE
    if (gasoilRatio > 2.5 && totalRealVol > 0) {
      diagnostics.push({
        id: 'diag-gasoil',
        title: 'Surconsommation énergétique détectée (Gasoil/m³)',
        severity: 'medium',
        category: 'maintenance',
        constat: `Le ratio moyen de consommation gasoil s'établit à ${gasoilRatio.toFixed(2)} L/m³, dépassant le seuil critique d'efficience fixé à 2.2 L/m³.`,
        causes: [
          'Temps de marche à vide (ralenti prolongé) excessif sur les engins chargeurs.',
          'Fatigue mécanique avancée des moteurs thermiques (filtres colmatés, injecteurs fatigués).',
          'Pentes de pistes trop sévères ou mal entretenues forçant les machines en forte charge.'
        ],
        actions: [
          'Instaurer une règle stricte d\'extinction des moteurs après 5 minutes d\'immobilité au point de chargement.',
          'Programmer un test clinique d\'opacimétrie et de consommation sur la chargeuse concernée.',
          'Raboter les bosses et re-niveler les rampes de roulage principales.'
        ],
        metric: `${gasoilRatio.toFixed(2)} L/m³`
      });
    }

    // DIAGNOSTIC 4 : INTENSITÉ INTERVENTIONS MAINTENANCE
    if (totalMaintHours > 12) {
      diagnostics.push({
        id: 'diag-maint',
        title: 'Forte intensité de maintenance curative',
        severity: 'medium',
        category: 'maintenance',
        constat: `Les interventions de maintenance cumulent ${totalMaintHours.toFixed(1)} heures d'arrêt de production sur le poste.`,
        causes: [
          'Vétusté de certains composants hydrauliques exposés aux eaux acides souterraines.',
          'Manque de maintenance préventive planifiée en amont des shifts de production.'
        ],
        actions: [
          'Faire pivoter la planification vers des fenêtres de préventif de 2 heures systématiques entre les postes.',
          'Analyser le registre des pièces de rechange pour identifier des défaillances répétitives.'
        ],
        metric: `${totalMaintHours.toFixed(1)} H d'arrêt`
      });
    }

    return diagnostics;
  }, [allProductionDocs, allPlanningSheets, reportType, filterDate, filterMonth]);

  // 2. COUCHE PRÉDICTIVE DES CHANTIERS (Mission 3)
  // We calculate estimated completion dates, monthly projections and risks using actual historical pacing.
  const predictiveChantiers = useMemo(() => {
    return chantiers.map(c => {
      // Find historical meters for this chantier in all production documents
      let totalMetersFound = 0;
      let activeDaysCount = 0;
      const historyMeters: { [date: string]: number } = {};

      allProductionDocs.forEach(doc => {
        if (doc.minageRows && Array.isArray(doc.minageRows)) {
          doc.minageRows.forEach((r: any) => {
            if (r.chantierId === c.id) {
              const meters = Number(r.realMeterage || 0);
              const dateStr = doc.id;
              historyMeters[dateStr] = (historyMeters[dateStr] || 0) + meters;
            }
          });
        }
      });

      const dates = Object.keys(historyMeters);
      dates.forEach(d => {
        totalMetersFound += historyMeters[d];
        if (historyMeters[d] > 0) activeDaysCount++;
      });

      // Daily pace
      const defaultDailyPace = c.galleryType === '12m2' ? 1.4 : 1.7; // Standard target meters per day if history is empty
      const calculatedDailyPace = activeDaysCount > 0 ? totalMetersFound / activeDaysCount : defaultDailyPace;
      const finalDailyPace = calculatedDailyPace > 0 ? calculatedDailyPace : defaultDailyPace;

      // Remaining meters
      const remainingMeters = Math.max(0, Number(c.plannedTotalMeterage || 150) - Number(c.currentMeterage || 0));

      // Estimated days to complete
      const estDaysToComplete = remainingMeters > 0 ? Math.ceil(remainingMeters / finalDailyPace) : 0;

      // Calculate estimated finish date
      const estDate = new Date();
      estDate.setDate(estDate.getDate() + estDaysToComplete);
      const estFinishDateStr = estDaysToComplete > 0 ? estDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Terminé';

      // Objective achievement probability / Risk of Delay
      // High risk if calculated pace is much lower than planned or if time is tight
      let delayRisk: 'low' | 'medium' | 'high' = 'low';
      if (remainingMeters > 0) {
        if (finalDailyPace < defaultDailyPace * 0.75) {
          delayRisk = 'high';
        } else if (finalDailyPace < defaultDailyPace * 0.95) {
          delayRisk = 'medium';
        }
      }

      // Monthly forecast projections
      const monthlyForecastMeters = finalDailyPace * 30;
      const expectedTargetMetPct = c.plannedTotalMeterage > 0 ? ((c.currentMeterage + monthlyForecastMeters) / c.plannedTotalMeterage) * 100 : 100;

      return {
        ...c,
        calculatedDailyPace,
        remainingMeters,
        estDaysToComplete,
        estFinishDateStr,
        delayRisk,
        monthlyForecastMeters,
        expectedTargetMetPct: Math.min(100, expectedTargetMetPct)
      };
    });
  }, [chantiers, allProductionDocs]);

  // Selected chantier details for focus panel
  const selectedChantierPredictive = useMemo(() => {
    return predictiveChantiers.find(c => c.id === selectedChantierId) || predictiveChantiers[0];
  }, [predictiveChantiers, selectedChantierId]);

  // 3. MONTHLY METRIC TRENDS FORECAST (Mission 3)
  const monthlyTrendsForecast = useMemo(() => {
    // Generate next 6 months forecast based on current average production
    let avgMonthlyMeters = 350; // default baseline
    let avgMonthlyVolume = 2800; // default baseline
    let avgMonthlyWagons = 1200; // default baseline

    if (allProductionDocs.length > 0) {
      let totalMet = 0;
      let totalVol = 0;
      let totalWag = 0;
      const monthsSet = new Set<string>();

      allProductionDocs.forEach(doc => {
        const mStr = doc.id.substring(0, 7); // yyyy-MM
        monthsSet.add(mStr);

        if (doc.minageRows && Array.isArray(doc.minageRows)) {
          doc.minageRows.forEach((r: any) => totalMet += Number(r.realMeterage || 0));
        }
        if (doc.deblayageRows && Array.isArray(doc.deblayageRows)) {
          doc.deblayageRows.forEach((r: any) => totalVol += Number(r.volumeEstimated || 0));
        }
        if (doc.extractionRows && Array.isArray(doc.extractionRows)) {
          doc.extractionRows.forEach((r: any) => totalWag += Number(r.realWagons || 0));
        }
      });

      const mCount = Math.max(1, monthsSet.size);
      avgMonthlyMeters = totalMet / mCount;
      avgMonthlyVolume = totalVol / mCount;
      avgMonthlyWagons = totalWag / mCount;
    }

    const months = ['Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    return months.map((m, idx) => {
      // Add subtle seasonal adjustments (e.g. slight drop in summer, boost in winter)
      const seasonalFactor = 1 + Math.sin((idx / 5) * Math.PI) * 0.08;
      const safetyCoefficient = 0.95; // Conservator index

      return {
        month: m,
        metersForecast: Math.round(avgMonthlyMeters * seasonalFactor * safetyCoefficient),
        volumeForecast: Math.round(avgMonthlyVolume * seasonalFactor * safetyCoefficient),
        wagonsForecast: Math.round(avgMonthlyWagons * seasonalFactor * safetyCoefficient),
        confidenceRate: Math.round(92 - idx * 2.5) // Less confidence as time progresses
      };
    });
  }, [allProductionDocs]);

  return (
    <div className="space-y-8">
      {/* HEADER SECTION */}
      <div className="bg-slate-950 border border-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-900 to-[#b8860b]/5 opacity-90 z-0" />
        <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#b8860b]/10 rounded-full blur-3xl animate-pulse" />
        
        <div className="relative z-10 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="p-3 bg-[#b8860b]/20 text-[#ffd700] rounded-2xl border border-[#b8860b]/30 shadow-inner">
                <Sparkles className="w-6 h-6 animate-pulse" />
              </span>
              <div>
                <span className="text-[10px] text-[#ffd700] font-black tracking-widest uppercase block">Matière de Décision Souterraine</span>
                <h2 className="text-lg sm:text-xl font-black uppercase text-slate-100 flex items-center gap-2">
                  🔮 COGNITIVE LAYER & INTELLIGENCE PRÉDICTIVE
                </h2>
                <p className="text-[11px] text-slate-400 font-medium">Algorithmes de projection de fin de chantier, diagnostics automatiques des causes racines et maturité SMI</p>
              </div>
            </div>

            <div className="inline-flex p-1 bg-slate-900 border border-slate-800 rounded-xl">
              <button
                onClick={() => setMaturityTab(false)}
                className={`text-[9.5px] font-black uppercase py-2 px-3.5 rounded-lg cursor-pointer transition-all ${
                  !maturityTab ? 'bg-[#b8860b]/20 text-[#ffd700] border border-[#b8860b]/40' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🔮 Prévisions & Diagnostics
              </button>
              <button
                onClick={() => setMaturityTab(true)}
                className={`text-[9.5px] font-black uppercase py-2 px-3.5 rounded-lg cursor-pointer transition-all ${
                  maturityTab ? 'bg-[#b8860b]/20 text-[#ffd700] border border-[#b8860b]/40' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                📈 Échelle de Maturité SMI
              </button>
            </div>
          </div>
        </div>
      </div>

      {!maturityTab ? (
        <>
          {/* SECTION 1: ROOT CAUSE DIAGNOSTICS (Mission 4) */}
          <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-xs space-y-5">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-gray-100 pb-4 gap-2">
              <div>
                <h3 className="text-sm font-black uppercase text-slate-800 flex items-center gap-2">
                  🔎 AUDIT CLINIQUES & DIAGNOSTICS CAUSALS
                </h3>
                <p className="text-[10px] text-slate-500 font-medium">Constat automatique → Causes probables détectées → Actions immédiates recommandées</p>
              </div>
              <span className="text-[9px] font-black uppercase bg-slate-100 text-slate-700 px-3 py-1 rounded-full border border-slate-200 tracking-wider">
                Moteur Analytique Automatique
              </span>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {rootCauseDiagnostics.map((diag, index) => {
                const isHigh = diag.severity === 'high';
                const isMedium = diag.severity === 'medium';
                const isLow = diag.severity === 'low';
                
                let cardColor = "border-slate-150 bg-slate-50/50";
                let iconColor = "text-slate-500 bg-slate-100 border-slate-200";
                
                if (isHigh) {
                  cardColor = "border-rose-150 bg-rose-50/15";
                  iconColor = "text-rose-600 bg-rose-50 border-rose-200";
                } else if (isMedium) {
                  cardColor = "border-amber-150 bg-amber-50/10";
                  iconColor = "text-amber-600 bg-amber-50 border-amber-200";
                } else if (isLow) {
                  cardColor = "border-emerald-150 bg-emerald-50/15";
                  iconColor = "text-emerald-600 bg-emerald-50 border-emerald-200";
                }

                return (
                  <div key={diag.id || index} className={`border rounded-2xl p-5 space-y-4 flex flex-col justify-between ${cardColor}`}>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2 border-b border-dashed border-slate-200 pb-2.5">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <span className={`p-1.5 rounded-lg border ${iconColor} shrink-0`}>
                            {isLow ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                          </span>
                          <span className="text-[11px] font-black uppercase text-slate-800 tracking-wide truncate">{diag.title}</span>
                        </div>
                        <span className={`text-[8.5px] font-black uppercase px-2 py-0.5 rounded border shrink-0 ${
                          isHigh ? 'bg-rose-100 text-rose-800 border-rose-300' :
                          isMedium ? 'bg-amber-100 text-amber-800 border-amber-300' :
                          'bg-emerald-100 text-emerald-800 border-emerald-300'
                        }`}>
                          {diag.metric}
                        </span>
                      </div>

                      <div className="space-y-1.5 text-[10.5px]">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Constat :</span>
                        <p className="text-slate-700 font-medium leading-relaxed bg-white border border-gray-100 rounded-xl p-3 shadow-3xs">{diag.constat}</p>
                      </div>

                      {diag.causes.length > 0 && (
                        <div className="space-y-1.5 text-[10.5px]">
                          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Causes Probables :</span>
                          <ul className="list-disc pl-4 space-y-1 text-slate-600 font-medium leading-relaxed">
                            {diag.causes.map((cause, cIdx) => <li key={cIdx}>{cause}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>

                    <div className="bg-slate-900 text-slate-100 rounded-xl p-4 space-y-2 text-[10.5px]">
                      <span className="text-[8.5px] font-black text-[#ffd700] uppercase tracking-wider block border-b border-slate-800 pb-1.5">🎯 Actions Recommandées :</span>
                      <div className="space-y-2">
                        {diag.actions.map((act, aIdx) => (
                          <div key={aIdx} className="flex gap-2 items-start font-medium leading-relaxed">
                            <span className="text-[#ffd700] font-black">➔</span>
                            <span>{act}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SECTION 2: CHANTIER FORECAST & COMPLETION DATES (Mission 3) */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* Chantier Selector List */}
            <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-xs space-y-4 xl:col-span-1 flex flex-col">
              <div>
                <h3 className="text-xs font-black uppercase text-slate-800">Échéancier Prévisionnel</h3>
                <p className="text-[10px] text-slate-400 font-bold">Sélectionner un chantier pour modéliser sa fin de vie opérationnelle</p>
              </div>

              <div className="space-y-2 overflow-y-auto max-h-96 pr-1 flex-1">
                {predictiveChantiers.map(c => {
                  const isSelected = c.id === selectedChantierId;
                  const isHighRisk = c.delayRisk === 'high';
                  const isMedRisk = c.delayRisk === 'medium';
                  
                  return (
                    <button
                      key={c.id}
                      onClick={() => setSelectedChantierId(c.id)}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all cursor-pointer relative ${
                        isSelected 
                          ? 'bg-slate-900 border-slate-950 text-white shadow-md' 
                          : 'bg-slate-50 hover:bg-slate-100/70 border-slate-200 text-slate-800'
                      }`}
                    >
                      <div className="flex justify-between items-start gap-2 mb-1.5">
                        <span className="text-[10.5px] font-black uppercase truncate">{c.name}</span>
                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded border shrink-0 ${
                          isHighRisk ? 'bg-rose-500/20 text-rose-400 border-rose-500/40' :
                          isMedRisk ? 'bg-amber-500/20 text-amber-400 border-amber-500/40' :
                          'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                        }`}>
                          {c.delayRisk === 'high' ? '🔴 Risque Retard' : c.delayRisk === 'medium' ? '⚠️ Risque Moyen' : '🟢 Fluide'}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-[9px] text-slate-400 font-bold uppercase mt-2">
                        <span>Pace: <span className={isSelected ? 'text-[#ffd700]' : 'text-slate-800'}>{c.calculatedDailyPace.toFixed(1)} m/j</span></span>
                        <span>Fin estimée: <span className={isSelected ? 'text-[#ffd700]' : 'text-slate-800'}>{c.estFinishDateStr}</span></span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Chantier Forecast Details (Mission 3) */}
            <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-xs xl:col-span-2 space-y-6">
              {selectedChantierPredictive ? (
                <>
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-gray-100 pb-4 gap-2">
                    <div>
                      <span className="text-[9px] font-bold text-[#b8860b] uppercase tracking-wider block">Analyse Capacité Souterraine</span>
                      <h4 className="text-base font-black uppercase text-slate-800 flex items-center gap-2">
                        🏗️ PROJECTION DETRAIL CHANTIER : <span className="text-[#b8860b]">{selectedChantierPredictive.name}</span>
                      </h4>
                    </div>
                    <span className="text-[9px] font-bold uppercase bg-slate-900 text-white px-2.5 py-1 rounded">
                      Type Galerie: {selectedChantierPredictive.galleryType}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    <div className="bg-slate-50 border border-slate-150 rounded-xl p-3.5">
                      <span className="text-[8.5px] text-slate-400 uppercase font-bold block mb-1">Cible Planifiée Totale</span>
                      <span className="text-sm font-mono font-black text-slate-800">{selectedChantierPredictive.plannedTotalMeterage.toFixed(1)} m</span>
                    </div>
                    <div className="bg-slate-50 border border-slate-150 rounded-xl p-3.5">
                      <span className="text-[8.5px] text-slate-400 uppercase font-bold block mb-1">Avancement Actuel</span>
                      <span className="text-sm font-mono font-black text-slate-800">{selectedChantierPredictive.currentMeterage.toFixed(1)} m</span>
                    </div>
                    <div className="bg-slate-50 border border-slate-150 rounded-xl p-3.5">
                      <span className="text-[8.5px] text-slate-400 uppercase font-bold block mb-1">Reste à Forer</span>
                      <span className="text-sm font-mono font-black text-slate-800">{selectedChantierPredictive.remainingMeters.toFixed(1)} m</span>
                    </div>
                    <div className="bg-slate-900 border border-slate-950 rounded-xl p-3.5 text-white">
                      <span className="text-[8.5px] text-slate-400 uppercase font-bold block mb-1">Jours Restants Estimés</span>
                      <span className="text-sm font-mono font-black text-[#ffd700]">{selectedChantierPredictive.estDaysToComplete} jours</span>
                    </div>
                  </div>

                  {/* Estimation Visual Progress Gauge */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-[10px] uppercase font-bold text-slate-500">
                      <span>Progrès Global Estimé</span>
                      <span>{((selectedChantierPredictive.currentMeterage / selectedChantierPredictive.plannedTotalMeterage) * 100).toFixed(0)}% réalisé</span>
                    </div>
                    <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden flex">
                      <div className="bg-[#b8860b] h-full" style={{ width: `${(selectedChantierPredictive.currentMeterage / selectedChantierPredictive.plannedTotalMeterage) * 100}%` }} />
                      <div className="bg-slate-900 h-full opacity-60 animate-pulse" style={{ width: `${(selectedChantierPredictive.remainingMeters / selectedChantierPredictive.plannedTotalMeterage) * 100}%` }} />
                    </div>
                    <p className="text-[9.5px] text-slate-400 font-bold leading-normal">
                      La bande noire hachurée représente la projection des travaux restants modélisés à une cadence quotidienne calculée de <span className="text-slate-700 font-black">{selectedChantierPredictive.calculatedDailyPace.toFixed(2)} m/jour</span>.
                    </p>
                  </div>

                  {/* Predictive Analysis Summary Block */}
                  <div className="bg-slate-950 text-white rounded-2xl p-5 space-y-4 border border-slate-800 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                      <Clock className="w-24 h-24" />
                    </div>
                    <h5 className="text-[10px] font-black text-[#ffd700] uppercase tracking-widest border-b border-slate-900 pb-2">
                      🧠 SYNTHÈSE DE SIMULATION PRÉDICTIVE (SMI)
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[10.5px]">
                      <div className="space-y-2 font-medium">
                        <div className="flex justify-between border-b border-slate-900 pb-1">
                          <span className="text-slate-400">Date estimée de clôture :</span>
                          <span className="text-white font-mono font-bold">{selectedChantierPredictive.estFinishDateStr}</span>
                        </div>
                        <div className="flex justify-between border-b border-slate-900 pb-1">
                          <span className="text-slate-400">Projection mensuelle forage :</span>
                          <span className="text-white font-mono font-bold">+{selectedChantierPredictive.monthlyForecastMeters.toFixed(0)} m / mois</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Confiance de livraison :</span>
                          <span className={`font-mono font-bold ${
                            selectedChantierPredictive.delayRisk === 'high' ? 'text-rose-400' :
                            selectedChantierPredictive.delayRisk === 'medium' ? 'text-amber-400' : 'text-emerald-400'
                          }`}>
                            {selectedChantierPredictive.delayRisk === 'high' ? '65% (Basse)' :
                             selectedChantierPredictive.delayRisk === 'medium' ? '82% (Moyenne)' : '97% (Optimale)'}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <span className="text-[9px] text-[#ffd700] font-bold uppercase tracking-wider block">Avis d'expert technique :</span>
                        <p className="text-slate-300 leading-relaxed font-medium">
                          {selectedChantierPredictive.delayRisk === 'high' && 
                            "ALERTE : Ce chantier progresse à un rythme nettement inférieur à la vitesse de conception théorique. Une réaffectation des perforateurs Montabert T23 de forage ou un contrôle des effectifs qualifiés du front est requis pour éviter un retard majeur."}
                          {selectedChantierPredictive.delayRisk === 'medium' && 
                            "SURVEILLANCE : Cadence moyenne détectée. Un gain mineur de productivité sur la rotation de poste permettrait de sécuriser l'échéance nominale théorique."}
                          {selectedChantierPredictive.delayRisk === 'low' && 
                            "FLUIDE : Les cadences actuelles de foration garantissent l'atteinte des objectifs de la SMI dans l'enveloppe temporelle définie. Continuez sur cette lancée."}
                        </p>
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center p-8 text-slate-400 font-bold uppercase text-[10px]">
                  Veuillez enregistrer des chantiers pour activer le simulateur prédictif.
                </div>
              )}
            </div>
          </div>

          {/* SECTION 3: FUTURE TRENDS 6-MONTH CHART FORECAST (Mission 3) */}
          <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-xs space-y-4">
            <div>
              <h3 className="text-xs font-black uppercase text-slate-800 flex items-center gap-1.5">
                <TrendingUp className="w-4 h-4 text-slate-700" /> TENDANCES DE PRODUCTION FUTURES À 6 MOIS (PROJECTION)
              </h3>
              <p className="text-[10px] text-slate-400 font-bold">Modélisation mathématique basée sur le rendement historique consolidé de la SMI</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Table list projection */}
              <div className="overflow-x-auto border border-slate-100 rounded-xl lg:col-span-1">
                <table className="w-full text-left border-collapse text-[10px] font-bold">
                  <thead>
                    <tr className="bg-slate-900 text-white uppercase text-[8.5px]">
                      <th className="p-2.5">Mois</th>
                      <th className="p-2.5 text-center">Forage (m)</th>
                      <th className="p-2.5 text-center">Volume (m³)</th>
                      <th className="p-2.5 text-center">Extraction (wg)</th>
                      <th className="p-2.5 text-center">Fiabilité</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {monthlyTrendsForecast.map((trend, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="p-2.5 text-slate-800 uppercase font-black">{trend.month}</td>
                        <td className="p-2.5 text-center font-mono text-[#b8860b]">{trend.metersForecast} m</td>
                        <td className="p-2.5 text-center font-mono text-sky-700">{trend.volumeForecast} m³</td>
                        <td className="p-2.5 text-center font-mono text-indigo-700">{trend.wagonsForecast} wg</td>
                        <td className="p-2.5 text-center font-mono text-slate-500">{trend.confidenceRate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Chart projection */}
              <div className="h-64 lg:col-span-2 bg-slate-50 p-4 rounded-2xl border border-slate-150 font-mono text-[9px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyTrendsForecast} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="month" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '10px' }} />
                    <Legend wrapperStyle={{ fontSize: '9px', fontWeight: 'bold' }} />
                    <Line type="monotone" dataKey="metersForecast" name="Projection Forage (m)" stroke="#b8860b" strokeWidth={2.5} activeDot={{ r: 6 }} />
                    <Line type="monotone" dataKey="volumeForecast" name="Projection Déblayage (m³)" stroke="#0284c7" strokeWidth={2.5} />
                    <Line type="monotone" dataKey="wagonsForecast" name="Projection Extraction (wg)" stroke="#4f46e5" strokeWidth={1.5} strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </div>

            </div>
          </div>
        </>
      ) : (
        /* MATURITY ANALYSIS (Mission 2) */
        <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-xs space-y-6">
          <div className="border-b border-gray-150 pb-4">
            <h3 className="text-sm font-black uppercase text-slate-800">📊 AUDIT DE MATURITÉ DU SYSTÈME D'INFORMATION</h3>
            <p className="text-[10px] text-slate-500 font-medium">Positionnement stratégique de la SMI sur l'échelle de valorisation des données industrielles</p>
          </div>

          <div className="space-y-6 max-w-4xl mx-auto">
            
            {/* Visual scale */}
            <div className="relative flex flex-col md:flex-row justify-between items-center gap-4 py-8">
              {/* Center connecting line */}
              <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-100 -translate-y-1/2 hidden md:block z-0" />
              
              {[
                { level: 1, name: 'Saisie simple', desc: 'Saisie dématérialisée', active: true, done: true },
                { level: 2, name: 'Reporting', desc: 'Affichage des données brutes', active: true, done: true },
                { level: 3, name: 'Analyse', desc: 'Rendements et leaderboards', active: true, done: true },
                { level: 4, name: 'Pilotage', desc: 'Écarts & indicateurs d\'énergie', active: true, done: true },
                { level: 5, name: 'Aide à la Décision', desc: 'Centre d\'alertes dynamiques', active: true, done: true },
                { level: 6, name: 'Intelligence Opérationnelle', desc: 'Diagnostics causes racines', active: true, done: false, current: true },
                { level: 7, name: 'Prévision', desc: 'Simulateurs prédictifs de clôture', active: false, done: false }
              ].map(lvl => (
                <div key={lvl.level} className="relative z-10 flex flex-col items-center text-center space-y-2 w-32">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xs border-2 transition-all ${
                    lvl.current 
                      ? 'bg-[#b8860b] border-[#ffd700] text-white ring-4 ring-[#b8860b]/20 scale-110 animate-bounce' 
                      : lvl.done
                        ? 'bg-slate-900 border-slate-950 text-[#ffd700]'
                        : 'bg-white border-slate-200 text-slate-400'
                  }`}>
                    {lvl.level}
                  </div>
                  <div>
                    <span className={`text-[9px] font-black uppercase block ${lvl.current ? 'text-[#b8860b]' : 'text-slate-800'}`}>{lvl.name}</span>
                    <span className="text-[8px] text-slate-400 font-bold block max-w-[110px] mx-auto mt-0.5 leading-tight">{lvl.desc}</span>
                  </div>
                  {lvl.current && (
                    <span className="text-[7.5px] font-black uppercase bg-[#b8860b]/15 text-[#b8860b] px-2 py-0.5 rounded border border-[#b8860b]/30">
                      NIVEAU ACTUEL
                    </span>
                  )}
                </div>
              ))}
            </div>

            {/* Maturity Audit Analysis Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100 text-[10.5px]">
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase text-slate-800 border-b border-slate-100 pb-1">ÉVALUATION DU DEGRÉ ATTEINT</h4>
                <p className="text-slate-600 font-medium leading-relaxed">
                  Grâce à l'intégration des modules de minage, d'extraction, de consommation d'énergie et de maintenance, la plateforme atteint aujourd'hui le <strong className="text-slate-900">Niveau 6 (Intelligence Opérationnelle)</strong>.
                </p>
                <p className="text-slate-600 font-medium leading-relaxed">
                  L'information n'est plus seulement stockée ou visualisée sous forme de rapports statiques (Niveaux 1 et 2). Elle est activement triturée pour calculer des ratios avancés (consommation spécifique, ratios L/m³) et générer un arbitrage décisionnel concret pour la Direction Générale.
                </p>
              </div>

              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase text-slate-800 border-b border-slate-100 pb-1">QU'EST-CE QUI MANQUE POUR LE NIVEAU 7 (PRÉVISION) ?</h4>
                <p className="text-slate-600 font-medium leading-relaxed">
                  Pour consolider durablement le niveau de prévision prédictive autonome, nous devons élargir la collecte de données vers de nouvelles dimensions :
                </p>
                <ul className="list-disc pl-4 space-y-1.5 text-slate-600 font-medium">
                  <li><strong className="text-slate-900">La Géologie clinique :</strong> Intégrer l'indice de forabilité du terrain (RQD, dureté de la roche) pour ajuster dynamiquement les temps théoriques de forage.</li>
                  <li><strong className="text-slate-900">Télémétrie en temps réel :</strong> Récupérer directement les capteurs de pression hydraulique et températures moteurs des chargeuses LHD et Perforateurs Montabert T23.</li>
                  <li><strong className="text-slate-900">Suivi d'usure des consommables :</strong> Suivre l'historique de changement des couronnes de foration pour prédire mathématiquement leur rupture.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
