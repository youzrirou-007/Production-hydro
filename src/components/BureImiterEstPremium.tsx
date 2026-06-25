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
      p1: { forageReal: 0, foragePlan: 0, deblayageReal: 0, deblayagePlan: 0, extractionReal: 0, extractionPlan: 0 },
      p2: { forageReal: 0, foragePlan: 0, deblayageReal: 0, deblayagePlan: 0, extractionReal: 0, extractionPlan: 0 },
      p3: { forageReal: 0, foragePlan: 0, deblayageReal: 0, deblayagePlan: 0, extractionReal: 0, extractionPlan: 0 }
    };

    allProductionDocs.forEach(pDoc => {
      const dateStr = pDoc.id;
      const prevDateStr = getPreviousDateStr(dateStr);
      const sDoc = allPlanningSheets.find(s => s.id === prevDateStr);

      ['poste1', 'poste2', 'poste3'].forEach(pKey => {
        const pNum = pKey === 'poste1' ? 'p1' : pKey === 'poste2' ? 'p2' : 'p3';
        const postObj = pDoc.postes?.[pKey] || {};

        // Real Minage
        (postObj.minage || []).forEach((row: any) => {
          const r = row.reel || row || {};
          const sec = r.sector || r.sectorGroup || row.sectorGroup || '';
          if (isBureSector(sec)) {
            const meters = Number(r.realMeterage || 0);
            forageReal += meters;
            shiftDetails[pNum].forageReal += meters;
            totalRoundsReal += Number(r.realRounds || 0);
          }
        });

        // Real Deblayage
        (postObj.deblayage || []).forEach((row: any) => {
          const r = row.reel || row || {};
          const sec = r.sector || r.sectorGroup || row.sectorGroup || '';
          if (isBureSector(sec)) {
            const vol = Number(r.volumeEstimated || 0);
            deblayageReal += vol;
            shiftDetails[pNum].deblayageReal += vol;
            totalGodetsReal += Number(r.godets || 0);
          }
        });

        // Real Extraction (usually global or specific to Bure)
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
    // Tonnage (using standard 1.4 Tons/wagon)
    const tonnageReal = extractionReal * 1.4;

    // Trends logic (simulated by comparing first half of docs to second half of docs)
    const halfLen = Math.floor(allProductionDocs.length / 2);
    let forageRealH1 = 0, forageRealH2 = 0;
    let deblayageRealH1 = 0, deblayageRealH2 = 0;
    let extractionRealH1 = 0, extractionRealH2 = 0;

    allProductionDocs.forEach((doc, idx) => {
      ['poste1', 'poste2', 'poste3'].forEach(pKey => {
        const pObj = doc.postes?.[pKey] || {};
        (pObj.minage || []).forEach((row: any) => {
          const r = row.reel || row;
          if (isBureSector(r.sectorGroup || row.sectorGroup)) {
            if (idx < halfLen) forageRealH1 += Number(r.realMeterage || 0);
            else forageRealH2 += Number(r.realMeterage || 0);
          }
        });
        (pObj.deblayage || []).forEach((row: any) => {
          const r = row.reel || row;
          if (isBureSector(r.sectorGroup || row.sectorGroup)) {
            if (idx < halfLen) deblayageRealH1 += Number(r.volumeEstimated || 0);
            else deblayageRealH2 += Number(r.volumeEstimated || 0);
          }
        });
        (pObj.extraction || []).forEach((row: any) => {
          const r = row.reel || row;
          if (idx < halfLen) extractionRealH1 += Number(r.wagonsActual || 0);
          else extractionRealH2 += Number(r.wagonsActual || 0);
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

    // Bottleneck and Fluidity Score
    // Calculate lowest rate among the three
    const rates = [
      { step: 'FORAGE', rate: forageRate, desc: 'Forage des fronts' },
      { step: 'DÉBLAYAGE', rate: deblayageRate, desc: 'Chargement & Roulage LHD' },
      { step: 'EXTRACTION', rate: extractionRate, desc: 'Extraction & Treuillage Wagons' }
    ];
    const lowest = rates.reduce((min, cur) => cur.rate < min.rate ? cur : min, rates[0]);

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
      bottleneckMsg, bottleneckAlertLevel, bottleneckDesc, fluidityScore, shiftDetails
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
      <div className={`border p-5 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-5 transition-all ${getAlertBg(stats.bottleneckAlertLevel)}`}>
        <div className="flex items-center gap-4">
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
        <div className="bg-white border border-slate-150 p-5 rounded-2xl flex flex-col justify-between relative shadow-2xs">
          <div className="absolute -right-3 top-1/2 transform -translate-y-1/2 hidden md:block z-10">
            <ArrowRight className="w-5 h-5 text-slate-300 bg-white border border-slate-200 rounded-full p-0.5" />
          </div>
          <div>
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
        <div className="bg-white border border-slate-150 p-5 rounded-2xl flex flex-col justify-between relative shadow-2xs">
          <div className="absolute -right-3 top-1/2 transform -translate-y-1/2 hidden md:block z-10">
            <ArrowRight className="w-5 h-5 text-slate-300 bg-white border border-slate-200 rounded-full p-0.5" />
          </div>
          <div>
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
        <div className="bg-white border border-slate-150 p-5 rounded-2xl flex flex-col justify-between shadow-2xs">
          <div>
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
      <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl space-y-4">
        <h4 className="text-[11.5px] font-black uppercase text-slate-800">Détails d'Équilibre Opérationnel par Poste</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {['p1', 'p2', 'p3'].map((shiftKey, sIdx) => {
            const shiftName = shiftKey === 'p1' ? 'Poste 1 (Matin)' : shiftKey === 'p2' ? 'Poste 2 (Après-midi)' : 'Poste 3 (Nuit)';
            const data = stats.shiftDetails[shiftKey as 'p1' | 'p2' | 'p3'];

            return (
              <div key={shiftKey} className="bg-white border border-slate-150 p-4 rounded-xl space-y-3">
                <span className="text-[9.5px] font-black uppercase text-slate-800 block border-b border-slate-100 pb-1.5">{shiftName}</span>
                
                <div className="space-y-2.5 text-[10px]">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-bold">FORAGE :</span>
                    <span className="font-mono text-slate-800 font-black">{data.forageReal.toFixed(1)}m <span className="text-[9px] font-normal text-slate-400">/ {data.foragePlan.toFixed(1)}m</span></span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-bold">DÉBLAYAGE :</span>
                    <span className="font-mono text-slate-800 font-black">{data.deblayageReal.toFixed(1)}m³ <span className="text-[9px] font-normal text-slate-400">/ {data.deblayagePlan.toFixed(1)}m³</span></span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-400 font-bold">EXTRACTION :</span>
                    <span className="font-mono text-slate-800 font-black">{data.extractionReal}wg <span className="text-[9px] font-normal text-slate-400">/ {data.extractionPlan}wg</span></span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
