import React, { useMemo } from 'react';
import { 
  ArrowRight, 
  Layers, 
  Flame, 
  Truck, 
  HelpCircle, 
  TrendingUp, 
  TrendingDown, 
  Minus,
  CheckCircle,
  AlertTriangle,
  Zap,
  Bomb,
  Train
} from 'lucide-react';

interface BureImiterEstPremiumProps {
  allProductionDocs: any[];
  allPlanningSheets: any[];
}

export const BureImiterEstPremium: React.FC<BureImiterEstPremiumProps> = ({
  allProductionDocs,
  allPlanningSheets
}) => {

  const getPreviousDateStr = (dateStr: string) => {
    try {
      const d = new Date(dateStr + 'T12:00:00');
      d.setDate(d.getDate() - 1);
      return d.toISOString().split('T')[0];
    } catch (e) {
      return dateStr;
    }
  };

  const isBureSector = (sector: string) => {
    const s = (sector || '').trim().toLowerCase();
    return s === 'bure imiter est' || s === 'imiter est bure' || s === 'bure';
  };

  const stats = useMemo(() => {
    let forageReal = 0;
    let foragePlan = 0;
    let deblayageReal = 0;
    let deblayagePlan = 0;
    let extractionReal = 0;
    let extractionPlan = 0;

    let totalRoundsReal = 0;
    let totalGodetsReal = 0;

    // Shift by shift details
    const shiftDetails = {
      p1: { forageReal: 0, foragePlan: 0, deblayageReal: 0, deblayagePlan: 0, extractionReal: 0, extractionPlan: 0, rounds: 0, godets: 0 },
      p2: { forageReal: 0, foragePlan: 0, deblayageReal: 0, deblayagePlan: 0, extractionReal: 0, extractionPlan: 0, rounds: 0, godets: 0 },
      p3: { forageReal: 0, foragePlan: 0, deblayageReal: 0, deblayagePlan: 0, extractionReal: 0, extractionPlan: 0, rounds: 0, godets: 0 }
    };

    // PERFORMANCE OPTIMIZATION: Index planning sheets using Map
    const planningMap = new Map<string, any>(allPlanningSheets.map(s => [s.id, s]));

    allProductionDocs.forEach(pDoc => {
      const dateStr = pDoc.id;
      const prevDateStr = getPreviousDateStr(dateStr);
      const sDoc = planningMap.get(prevDateStr);

      ['poste1', 'poste2', 'poste3'].forEach(pKey => {
        const pNum = pKey === 'poste1' ? 'p1' : pKey === 'poste2' ? 'p2' : 'p3';
        const postObj = pDoc.postes?.[pKey] || {};

        // Real Minage
        (postObj.minage || []).forEach((row: any) => {
          const r = row.reel || row || {};
          const sec = r.sector || r.sectorGroup || row.sectorGroup || '';
          if (isBureSector(sec)) {
            const meters = Number(r.realMeterage || 0);
            const rnds = Number(r.realRounds || 0);
            forageReal += meters;
            shiftDetails[pNum].forageReal += meters;
            shiftDetails[pNum].rounds += rnds;
            totalRoundsReal += rnds;
          }
        });

        // Real Deblayage
        (postObj.deblayage || []).forEach((row: any) => {
          const r = row.reel || row || {};
          const sec = r.sector || r.sectorGroup || row.sectorGroup || '';
          if (isBureSector(sec)) {
            const vol = Number(r.volumeEstimated || 0);
            const gd = Number(r.godets || 0);
            deblayageReal += vol;
            shiftDetails[pNum].deblayageReal += vol;
            shiftDetails[pNum].godets += gd;
            totalGodetsReal += gd;
          }
        });

        // Real Extraction
        (postObj.extraction || []).forEach((row: any) => {
          const r = row.reel || row || {};
          const wags = Number(r.wagonsActual || 0);
          extractionReal += wags;
          shiftDetails[pNum].extractionReal += wags;
        });

        // Planned Metrics from Planning Sheets
        if (sDoc) {
          const planPostObj = sDoc.postes?.[pKey] || {};

          (planPostObj.minage || []).forEach((row: any) => {
            const sec = row.sector || row.sectorGroup || '';
            if (isBureSector(sec)) {
              const meters = Number(row.meterage || row.plannedRounds * 1.7 || 0);
              foragePlan += meters;
              shiftDetails[pNum].foragePlan += meters;
            }
          });

          (planPostObj.deblayage || []).forEach((row: any) => {
            const sec = row.sector || row.sectorGroup || '';
            if (isBureSector(sec)) {
              const vol = Number(row.volumeEstimated || 0);
              deblayagePlan += vol;
              shiftDetails[pNum].deblayagePlan += vol;
            }
          });

          (planPostObj.extraction || []).forEach((row: any) => {
            const wags = Number(row.wagonsTarget || 48);
            extractionPlan += wags;
            shiftDetails[pNum].extractionPlan += wags;
          });
        }
      });
    });

    // Compute Rates
    const forageRate = foragePlan > 0 ? (forageReal / foragePlan) * 100 : 100;
    const deblayageRate = deblayagePlan > 0 ? (deblayageReal / deblayagePlan) * 100 : 100;
    const extractionRate = extractionPlan > 0 ? (extractionReal / extractionPlan) * 100 : 100;

    // Yields
    const forageYield = totalRoundsReal > 0 ? forageReal / totalRoundsReal : 0;
    const deblayageYield = totalGodetsReal > 0 ? deblayageReal / totalGodetsReal : 0;
    const tonnageReal = extractionReal * 1.4;

    // Trends logic comparing first half of docs to second half of docs
    const halfLen = Math.floor(allProductionDocs.length / 2);
    let forageRealH1 = 0, forageRealH2 = 0;
    let deblayageRealH1 = 0, deblayageRealH2 = 0;
    let extractionRealH1 = 0, extractionRealH2 = 0;

    // Performance H1 vs H2 per shift for dedicated per-post trends
    const shiftH1 = { p1: 0, p2: 0, p3: 0 };
    const shiftH2 = { p1: 0, p2: 0, p3: 0 };

    allProductionDocs.forEach((doc, idx) => {
      const isH1 = idx < halfLen;
      const targetTrend = isH1 ? shiftH1 : shiftH2;

      ['poste1', 'poste2', 'poste3'].forEach(pKey => {
        const pNum = pKey === 'poste1' ? 'p1' : pKey === 'poste2' ? 'p2' : 'p3';
        const pObj = doc.postes?.[pKey] || {};

        (pObj.minage || []).forEach((row: any) => {
          const r = row.reel || row;
          if (isBureSector(r.sectorGroup || row.sectorGroup || r.sector)) {
            const meters = Number(r.realMeterage || 0);
            if (isH1) forageRealH1 += meters;
            else forageRealH2 += meters;
            targetTrend[pNum] += meters * 10;
          }
        });
        (pObj.deblayage || []).forEach((row: any) => {
          const r = row.reel || row;
          if (isBureSector(r.sectorGroup || row.sectorGroup || r.sector)) {
            const vol = Number(r.volumeEstimated || 0);
            if (isH1) deblayageRealH1 += vol;
            else deblayageRealH2 += vol;
            targetTrend[pNum] += vol;
          }
        });
        (pObj.extraction || []).forEach((row: any) => {
          const r = row.reel || row;
          const wags = Number(r.wagonsActual || 0);
          if (isH1) extractionRealH1 += wags;
          else extractionRealH2 += wags;
          targetTrend[pNum] += wags * 5;
        });
      });
    });

    const getTrendIcon = (h1: number, h2: number) => {
      if (h2 > h1 * 1.05) return <TrendingUp className="w-3.5 h-3.5 text-emerald-500 inline ml-1" />;
      if (h2 < h1 * 0.95) return <TrendingDown className="w-3.5 h-3.5 text-rose-500 inline ml-1" />;
      return <Minus className="w-3.5 h-3.5 text-slate-400 inline ml-1" />;
    };

    const getTrendText = (h1: number, h2: number) => {
      if (h2 > h1 * 1.05) return 'HAUSSE';
      if (h2 < h1 * 0.95) return 'BAISSE';
      return 'STABLE';
    };

    // Shift detailed calculations for the comparison view
    const shiftCalculations = {
      p1: { forageRate: 100, deblayageRate: 100, extractionRate: 100, forageYield: 0, deblayageYield: 0, extractionTonnage: 0, score: 0, trend: 'STABLE' },
      p2: { forageRate: 100, deblayageRate: 100, extractionRate: 100, forageYield: 0, deblayageYield: 0, extractionTonnage: 0, score: 0, trend: 'STABLE' },
      p3: { forageRate: 100, deblayageRate: 100, extractionRate: 100, forageYield: 0, deblayageYield: 0, extractionTonnage: 0, score: 0, trend: 'STABLE' }
    };

    ['p1', 'p2', 'p3'].forEach(pKey => {
      const key = pKey as 'p1' | 'p2' | 'p3';
      const d = shiftDetails[key];
      const fRate = d.foragePlan > 0 ? (d.forageReal / d.foragePlan) * 100 : 100;
      const dRate = d.deblayagePlan > 0 ? (d.deblayageReal / d.deblayagePlan) * 100 : 100;
      const eRate = d.extractionPlan > 0 ? (d.extractionReal / d.extractionPlan) * 100 : 100;

      const fYield = d.rounds > 0 ? d.forageReal / d.rounds : 0;
      const dYield = d.godets > 0 ? d.deblayageReal / d.godets : 0;
      const tonnage = d.extractionReal * 1.4;

      const overallScore = (Math.min(100, fRate) * 0.40) + (Math.min(100, dRate) * 0.30) + (Math.min(100, eRate) * 0.30);
      const h1Score = shiftH1[key];
      const h2Score = shiftH2[key];
      const trendStr = h2Score > h1Score * 1.05 ? 'HAUSSE' : h2Score < h1Score * 0.95 ? 'BAISSE' : 'STABLE';

      shiftCalculations[key] = {
        forageRate: fRate,
        deblayageRate: dRate,
        extractionRate: eRate,
        forageYield: fYield,
        deblayageYield: dYield,
        extractionTonnage: tonnage,
        score: overallScore,
        trend: trendStr
      };
    });

    // Rank the shifts to find the Best, Surveillance, and Danger ones
    const rankedShifts = Object.entries(shiftCalculations)
      .map(([key, stats]) => ({ key, ...stats }))
      .sort((a, b) => b.score - a.score);

    const bestShift = rankedShifts[0]?.key || 'p1';
    const dangerShift = rankedShifts[rankedShifts.length - 1]?.key || 'p3';
    const watchShift = ['p1', 'p2', 'p3'].find(k => k !== bestShift && k !== dangerShift) || 'p2';

    // Bottleneck and Fluidity Score
    const rates = [
      { step: 'FORAGE', rate: forageRate, desc: 'Forage des fronts' },
      { step: 'DÉBLAYAGE', rate: deblayageRate, desc: 'Chargement & Roulage LHD' },
      { step: 'EXTRACTION', rate: extractionRate, desc: 'Extraction & Treuillage Wagons' }
    ];

    let bottleneckMsg = '';
    let bottleneckAlertLevel: 'success' | 'warning' | 'danger' = 'success';
    let bottleneckDesc = '';

    if (forageRate < 80) {
      bottleneckMsg = "Goulot d'étranglement détecté au FORAGE 🔴";
      bottleneckAlertLevel = 'danger';
      bottleneckDesc = "L'avancement linéaire au front de taille est insuffisant pour alimenter correctement les engins de déblayage. Priorisez le forage.";
    } else if (forageRate >= 80 && deblayageRate < 80) {
      bottleneckMsg = "Goulot d'étranglement détecté au DÉBLAYAGE 🟠";
      bottleneckAlertLevel = 'warning';
      bottleneckDesc = "Le forage avance correctement, mais le déblaiement LHD n'arrive pas à suivre. Vérifiez la disponibilité mécanique des engins LHD.";
    } else if (deblayageRate >= 80 && extractionRate < 80) {
      bottleneckMsg = "Goulot d'étranglement détecté à l'EXTRACTION 🔴";
      bottleneckAlertLevel = 'danger';
      bottleneckDesc = "Les minerais sont déblayés mais le treuillage de wagons est bloqué ou ralenti. Goulot d'étranglement au niveau du puits / de l'extraction.";
    } else {
      bottleneckMsg = "Fluidité Opérationnelle Optimale ! 🟢";
      bottleneckAlertLevel = 'success';
      bottleneckDesc = "Toute la chaîne (Forage -> Déblayage -> Extraction) présente des taux de réalisation équilibrés et supérieurs à 80%.";
    }

    const fluidityScore = Math.round((forageRate + deblayageRate + extractionRate) / 3);

    return {
      forageReal, foragePlan, forageRate, forageYield, forageTrendIcon: getTrendIcon(forageRealH1, forageRealH2), forageTrendText: getTrendText(forageRealH1, forageRealH2),
      deblayageReal, deblayagePlan, deblayageRate, deblayageYield, deblayageTrendIcon: getTrendIcon(deblayageRealH1, deblayageRealH2), deblayageTrendText: getTrendText(deblayageRealH1, deblayageRealH2),
      extractionReal, extractionPlan, extractionRate, tonnageReal, extractionTrendIcon: getTrendIcon(extractionRealH1, extractionRealH2), extractionTrendText: getTrendText(extractionRealH1, extractionRealH2),
      bottleneckMsg, bottleneckAlertLevel, bottleneckDesc, fluidityScore, shiftDetails, shiftCalculations, bestShift, watchShift, dangerShift
    };
  }, [allProductionDocs, allPlanningSheets]);

  const getAlertBg = (level: 'success' | 'warning' | 'danger') => {
    if (level === 'danger') return 'bg-rose-50 border-rose-200 text-rose-900';
    if (level === 'warning') return 'bg-amber-50 border-amber-200 text-amber-950';
    return 'bg-emerald-50 border-emerald-200 text-emerald-950';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Banner / Indicator of fluidity */}
      <div className={`border border-[#d4af37]/35 p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-5 transition-all relative overflow-hidden shadow-2xs ${getAlertBg(stats.bottleneckAlertLevel)}`}>
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0ea5e9] to-[#ef4444]" />
        <div className="flex items-center gap-4 mt-1">
          <div className="p-3 bg-white/60 backdrop-blur-xs rounded-xl">
            <Zap className={`w-8 h-8 ${
              stats.bottleneckAlertLevel === 'danger' ? 'text-rose-600 animate-pulse' : stats.bottleneckAlertLevel === 'warning' ? 'text-amber-600' : 'text-emerald-600'
            }`} />
          </div>
          <div>
            <h4 className="text-xs font-black uppercase tracking-wider block">Fluidité & Diagnostic de la Chaîne Opérationnelle</h4>
            <span className="text-sm font-black uppercase block mt-1">{stats.bottleneckMsg}</span>
            <p className="text-[10px] text-slate-500 font-medium leading-relaxed max-w-xl mt-1.5">{stats.bottleneckDesc}</p>
          </div>
        </div>

        {/* Fluidity Index */}
        <div className="bg-white/80 border border-slate-200/50 p-4 rounded-xl text-center shrink-0 min-w-[120px]">
          <span className="text-[8px] font-black uppercase text-slate-400 block mb-1">Indice de Fluidité</span>
          <span className="text-2xl font-mono font-black text-slate-800">{stats.fluidityScore}%</span>
        </div>
      </div>

      {/* THREE INTERCONNECTED CARDS LAYOUT */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
        
        {/* CARD 1: FORAGE */}
        <div className="bg-white border border-[#d4af37]/35 p-5 rounded-2xl flex flex-col justify-between relative overflow-hidden shadow-2xs">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0ea5e9] to-[#ef4444]" />
          <div className="absolute -right-3 top-1/2 transform -translate-y-1/2 hidden md:block z-10">
            <ArrowRight className="w-5 h-5 text-slate-300 bg-white border border-[#d4af37]/35 rounded-full p-0.5" />
          </div>
          <div className="mt-1">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5 mb-4">
              <span className="text-xs font-black uppercase text-slate-800 flex items-center gap-1.5">
                <Bomb className="w-4 h-4 text-[#b8860b]" /> 1. FORAGE
              </span>
              <span className="text-[8.5px] font-black uppercase bg-slate-100 px-2 py-0.5 rounded text-slate-600">POSTE</span>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-baseline">
                <div>
                  <span className="text-xl font-mono font-black text-slate-800">{stats.forageReal.toFixed(1)} m</span>
                  <span className="text-[8.5px] text-slate-400 font-bold uppercase block mt-0.5">Forage Réalisé</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-mono font-bold text-slate-500 block">{stats.foragePlan.toFixed(1)} m</span>
                  <span className="text-[8.5px] text-slate-400 font-bold uppercase">Cible Planifiée</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase">
                  <span>Taux de réalisation</span>
                  <span>{stats.forageRate.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="h-full bg-[#b8860b]" style={{ width: `${Math.min(100, stats.forageRate)}%` }} />
                </div>
              </div>

              {/* Yield and trend */}
              <div className="grid grid-cols-2 gap-2 text-[10px] pt-3 border-t border-slate-100 font-bold">
                <div>
                  <span className="text-slate-400 text-[8px] uppercase block font-black mb-0.5">Rendement</span>
                  <span className="text-slate-800">{stats.forageYield > 0 ? `${stats.forageYield.toFixed(2)} m/v` : 'N/A'}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 text-[8px] uppercase block font-black mb-0.5">Tendance</span>
                  <span className="text-slate-800 text-[8.5px] font-black">
                    {stats.forageTrendText} {stats.forageTrendIcon}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 2: DÉBLAYAGE */}
        <div className="bg-white border border-[#d4af37]/35 p-5 rounded-2xl flex flex-col justify-between relative overflow-hidden shadow-2xs">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0ea5e9] to-[#ef4444]" />
          <div className="absolute -right-3 top-1/2 transform -translate-y-1/2 hidden md:block z-10">
            <ArrowRight className="w-5 h-5 text-slate-300 bg-white border border-[#d4af37]/35 rounded-full p-0.5" />
          </div>
          <div className="mt-1">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5 mb-4">
              <span className="text-xs font-black uppercase text-slate-800 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-sky-600" /> 2. DÉBLAYAGE
              </span>
              <span className="text-[8.5px] font-black uppercase bg-slate-100 px-2 py-0.5 rounded text-slate-600">CHARGE LHD</span>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-baseline">
                <div>
                  <span className="text-xl font-mono font-black text-slate-800">{stats.deblayageReal.toFixed(1)} m³</span>
                  <span className="text-[8.5px] text-slate-400 font-bold uppercase block mt-0.5">Déblayé Estimé</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-mono font-bold text-slate-500 block">{stats.deblayagePlan.toFixed(1)} m³</span>
                  <span className="text-[8.5px] text-slate-400 font-bold uppercase">Cible Volume</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase">
                  <span>Taux de réalisation</span>
                  <span>{stats.deblayageRate.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="h-full bg-sky-500" style={{ width: `${Math.min(100, stats.deblayageRate)}%` }} />
                </div>
              </div>

              {/* Yield and trend */}
              <div className="grid grid-cols-2 gap-2 text-[10px] pt-3 border-t border-slate-100 font-bold">
                <div>
                  <span className="text-slate-400 text-[8px] uppercase block font-black mb-0.5">Efficacité</span>
                  <span className="text-slate-800">{stats.deblayageYield > 0 ? `${stats.deblayageYield.toFixed(2)} m³/gt` : 'N/A'}</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 text-[8px] uppercase block font-black mb-0.5">Tendance</span>
                  <span className="text-slate-800 text-[8.5px] font-black">
                    {stats.deblayageTrendText} {stats.deblayageTrendIcon}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 3: EXTRACTION */}
        <div className="bg-white border border-[#d4af37]/35 p-5 rounded-2xl flex flex-col justify-between relative overflow-hidden shadow-2xs">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0ea5e9] to-[#ef4444]" />
          <div className="mt-1">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5 mb-4">
              <span className="text-xs font-black uppercase text-slate-800 flex items-center gap-1.5">
                <Train className="w-4 h-4 text-indigo-600" /> 3. EXTRACTION
              </span>
              <span className="text-[8.5px] font-black uppercase bg-slate-100 px-2 py-0.5 rounded text-slate-600">TREUILLAGE</span>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-baseline">
                <div>
                  <span className="text-xl font-mono font-black text-slate-800">{stats.extractionReal} Wg</span>
                  <span className="text-[8.5px] text-slate-400 font-bold uppercase block mt-0.5">Wagons Extraits</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-mono font-bold text-slate-500 block">{stats.extractionPlan} Wg</span>
                  <span className="text-[8.5px] text-slate-400 font-bold uppercase">Cible Wagons</span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="space-y-1">
                <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase">
                  <span>Taux de réalisation</span>
                  <span>{stats.extractionRate.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500" style={{ width: `${Math.min(100, stats.extractionRate)}%` }} />
                </div>
              </div>

              {/* Yield and trend */}
              <div className="grid grid-cols-2 gap-2 text-[10px] pt-3 border-t border-slate-100 font-bold">
                <div>
                  <span className="text-slate-400 text-[8px] uppercase block font-black mb-0.5">Tonnage Réel</span>
                  <span className="text-slate-800">{stats.tonnageReal.toFixed(1)} T</span>
                </div>
                <div className="text-right">
                  <span className="text-slate-400 text-[8px] uppercase block font-black mb-0.5">Tendance</span>
                  <span className="text-slate-800 text-[8.5px] font-black">
                    {stats.extractionTrendText} {stats.extractionTrendIcon}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* SHIFTS DETAILS BREAKDOWN */}
      <div className="bg-slate-50 border border-[#d4af37]/35 p-5 rounded-2xl space-y-6 relative overflow-hidden shadow-2xs">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0ea5e9] to-[#ef4444]" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3 mt-1">
          <div>
            <h4 className="text-[11.5px] font-black uppercase text-slate-800">Détails & Diagnostic Opérationnel Multi-Postes</h4>
            <p className="text-[10px] text-slate-500 font-medium">Analyse comparative des performances et rendements du Bure Imiter Est par quart de travail (Matin, Après-midi, Nuit)</p>
          </div>
          <span className="text-[9px] font-black uppercase tracking-wider bg-slate-200 px-2.5 py-1 rounded text-slate-700">Multi-Postes Premium</span>
        </div>

        {/* Executive summary of roles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* Best Shift Callout */}
          <div className="bg-emerald-50 border border-emerald-150 p-3.5 rounded-xl flex items-center justify-between gap-3">
            <div>
              <span className="text-[8px] font-black uppercase text-emerald-600 block">Meilleur Poste du Bure 👑</span>
              <span className="text-xs font-black text-slate-800 block mt-0.5">
                {stats.bestShift === 'p1' ? 'Poste 1 (Matin)' : stats.bestShift === 'p2' ? 'Poste 2 (Après-midi)' : 'Poste 3 (Nuit)'}
              </span>
            </div>
            <span className="text-xs font-mono font-black text-emerald-700 bg-white border border-emerald-200 px-2 py-0.5 rounded">
              {stats.shiftCalculations[stats.bestShift as 'p1'|'p2'|'p3'].score.toFixed(0)}%
            </span>
          </div>

          {/* Watch Shift Callout */}
          <div className="bg-amber-50 border border-amber-150 p-3.5 rounded-xl flex items-center justify-between gap-3">
            <div>
              <span className="text-[8px] font-black uppercase text-amber-600 block">Poste du Bure à surveiller ⚠️</span>
              <span className="text-xs font-black text-slate-800 block mt-0.5">
                {stats.watchShift === 'p1' ? 'Poste 1 (Matin)' : stats.watchShift === 'p2' ? 'Poste 2 (Après-midi)' : 'Poste 3 (Nuit)'}
              </span>
            </div>
            <span className="text-xs font-mono font-black text-amber-700 bg-white border border-amber-200 px-2 py-0.5 rounded">
              {stats.shiftCalculations[stats.watchShift as 'p1'|'p2'|'p3'].score.toFixed(0)}%
            </span>
          </div>

          {/* Danger Shift Callout */}
          <div className="bg-rose-50 border border-rose-150 p-3.5 rounded-xl flex items-center justify-between gap-3">
            <div>
              <span className="text-[8px] font-black uppercase text-rose-600 block">Poste du Bure en difficulté 🚨</span>
              <span className="text-xs font-black text-slate-800 block mt-0.5">
                {stats.dangerShift === 'p1' ? 'Poste 1 (Matin)' : stats.dangerShift === 'p2' ? 'Poste 2 (Après-midi)' : 'Poste 3 (Nuit)'}
              </span>
            </div>
            <span className="text-xs font-mono font-black text-rose-700 bg-white border border-rose-200 px-2 py-0.5 rounded">
              {stats.shiftCalculations[stats.dangerShift as 'p1'|'p2'|'p3'].score.toFixed(0)}%
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {['p1', 'p2', 'p3'].map((shiftKey) => {
            const shiftName = shiftKey === 'p1' ? 'Poste 1 (Matin)' : shiftKey === 'p2' ? 'Poste 2 (Après-midi)' : 'Poste 3 (Nuit)';
            const rawData = stats.shiftDetails[shiftKey as 'p1' | 'p2' | 'p3'];
            const calcData = stats.shiftCalculations[shiftKey as 'p1' | 'p2' | 'p3'];

            // Role tag color coding
            const isBest = stats.bestShift === shiftKey;
            const isDanger = stats.dangerShift === shiftKey;
            const roleBadge = isBest ? 'bg-emerald-100 text-emerald-800 border-emerald-200 👑 MEILLEUR' : isDanger ? 'bg-rose-100 text-rose-800 border-rose-200 🚨 EN DIFFICULTÉ' : 'bg-amber-100 text-amber-800 border-amber-200 ⚠️ À SURVEILLER';

            return (
              <div key={shiftKey} className="bg-white border border-[#d4af37]/35 p-5 rounded-xl space-y-4 shadow-3xs flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0ea5e9] to-[#ef4444]" />
                <div className="mt-1">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-3">
                    <span className="text-[10px] font-black uppercase text-slate-800 block">{shiftName}</span>
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 border rounded-full ${roleBadge}`} />
                  </div>
                  
                  {/* Overall score for the shift */}
                  <div className="flex justify-between items-baseline mb-4 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-[8.5px] font-black uppercase text-slate-400">Efficacité Globale :</span>
                    <span className="font-mono text-sm font-black text-slate-800">{calcData.score.toFixed(1)}%</span>
                  </div>

                  {/* Operational indicators bars */}
                  <div className="space-y-3.5 border-b border-slate-100 pb-3.5 mb-3.5">
                    {/* Forage */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase">
                        <span>FORAGE : {rawData.forageReal.toFixed(1)}m</span>
                        <span>{calcData.forageRate.toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                        <div className="h-full bg-[#b8860b]" style={{ width: `${Math.min(100, calcData.forageRate)}%` }} />
                      </div>
                    </div>

                    {/* Deblayage */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase">
                        <span>DÉBLAYAGE : {rawData.deblayageReal.toFixed(0)}m³</span>
                        <span>{calcData.deblayageRate.toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                        <div className="h-full bg-sky-500" style={{ width: `${Math.min(100, calcData.deblayageRate)}%` }} />
                      </div>
                    </div>

                    {/* Extraction */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase">
                        <span>EXTRACTION : {rawData.extractionReal}wg</span>
                        <span>{calcData.extractionRate.toFixed(0)}%</span>
                      </div>
                      <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500" style={{ width: `${Math.min(100, calcData.extractionRate)}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* Yield and trend detailed breakdown */}
                  <div className="space-y-2 text-[10px] font-semibold text-slate-700">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-bold text-[8.5px] uppercase">Rendement Forage :</span>
                      <span className="font-mono text-slate-800 font-black">
                        {calcData.forageYield > 0 ? `${calcData.forageYield.toFixed(2)} m/v` : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-bold text-[8.5px] uppercase">Efficacité Déblayage :</span>
                      <span className="font-mono text-slate-800 font-black">
                        {calcData.deblayageYield > 0 ? `${calcData.deblayageYield.toFixed(2)} m³/gt` : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400 font-bold text-[8.5px] uppercase">Tonnage Extrait :</span>
                      <span className="font-mono text-slate-800 font-black">
                        {calcData.extractionTonnage.toFixed(1)} T
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3.5 border-t border-slate-100">
                  <span className="text-[8.5px] font-black uppercase text-slate-400">Tendance Poste :</span>
                  <span className={`text-[8.5px] font-black uppercase flex items-center gap-1 ${
                    calcData.trend === 'HAUSSE' ? 'text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100' :
                    calcData.trend === 'BAISSE' ? 'text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-100 animate-pulse' :
                    'text-slate-500 bg-slate-50 px-2 py-0.5 rounded border border-slate-100'
                  }`}>
                    {calcData.trend === 'HAUSSE' && <TrendingUp className="w-3 h-3 text-emerald-500 inline" />}
                    {calcData.trend === 'BAISSE' && <TrendingDown className="w-3 h-3 text-rose-500 inline" />}
                    {calcData.trend === 'STABLE' && <Minus className="w-3 h-3 text-slate-400 inline" />}
                    {calcData.trend}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
