import React, { useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  Sparkles,
  ShieldCheck,
  Zap,
  HelpCircle
} from 'lucide-react';

interface ExpressDirectionScorecardProps {
  allProductionDocs: any[];
  allPlanningSheets: any[];
}

export const ExpressDirectionScorecard: React.FC<ExpressDirectionScorecardProps> = ({
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

  const sectorScores = useMemo(() => {
    const sectors = [
      { id: 'imiter1', name: 'IMITER 1' },
      { id: 'imiter2', name: 'IMITER 2' },
      { id: 'imiter_est', name: 'IMITER EST' },
      { id: 'bure_imiter_est', name: 'BURE IMITER EST' }
    ];

    const matchSector = (rowSector: string, targetSectorId: string) => {
      const s = (rowSector || '').trim().toLowerCase();
      if (targetSectorId === 'imiter1') return s === 'imiter 1';
      if (targetSectorId === 'imiter2') return s === 'imiter 2';
      if (targetSectorId === 'imiter_est') return s === 'imiter est';
      if (targetSectorId === 'bure_imiter_est') return s === 'bure imiter est' || s === 'imiter est bure' || s === 'bure';
      return false;
    };

    const half = Math.floor(allProductionDocs.length / 2);

    return sectors.map(sec => {
      let realMet = 0;
      let planMet = 0;
      let realVol = 0;
      let planVol = 0;

      // H1 vs H2 for trend calculation
      let realMetH1 = 0, realMetH2 = 0;
      let realVolH1 = 0, realVolH2 = 0;

      allProductionDocs.forEach((pDoc, idx) => {
        const dateStr = pDoc.id;
        const prevDateStr = getPreviousDateStr(dateStr);
        const sDoc = allPlanningSheets.find(s => s.id === prevDateStr);

        ['poste1', 'poste2', 'poste3'].forEach(pKey => {
          // Reel Minage
          (pDoc.postes?.[pKey]?.minage || []).forEach((row: any) => {
            const r = row.reel || row;
            const rSec = r.sector || r.sectorGroup || row.sectorGroup || '';
            if (matchSector(rSec, sec.id)) {
              const meters = Number(r.realMeterage || 0);
              realMet += meters;
              if (idx < half) realMetH1 += meters;
              else realMetH2 += meters;
            }
          });

          // Reel Deblayage
          (pDoc.postes?.[pKey]?.deblayage || []).forEach((row: any) => {
            const r = row.reel || row;
            const rSec = r.sector || r.sectorGroup || row.sectorGroup || '';
            if (matchSector(rSec, sec.id)) {
              const vol = Number(r.volumeEstimated || 0);
              realVol += vol;
              if (idx < half) realVolH1 += vol;
              else realVolH2 += vol;
            }
          });

          // Planned Minage
          if (sDoc) {
            (sDoc.postes?.[pKey]?.minage || []).forEach((row: any) => {
              const rSec = row.sector || row.sectorGroup || '';
              if (matchSector(rSec, sec.id)) {
                planMet += Number(row.meterage || row.plannedRounds * 1.7 || 0);
              }
            });

            // Planned Deblayage
            (sDoc.postes?.[pKey]?.deblayage || []).forEach((row: any) => {
              const rSec = row.sector || row.sectorGroup || '';
              if (matchSector(rSec, sec.id)) {
                planVol += Number(row.volumeEstimated || 0);
              }
            });
          }
        });
      });

      // Rates
      const forageRate = planMet > 0 ? (realMet / planMet) * 100 : 100;
      const deblayageRate = planVol > 0 ? (realVol / planVol) * 100 : 100;

      // Score weighted: 60% Forage, 40% Deblayage
      const score = Math.round(
        Math.min(100, forageRate) * 0.60 + 
        Math.min(100, deblayageRate) * 0.40
      );

      // Trend H1 vs H2
      const H1Total = realMetH1 + realVolH1 * 0.1; // raw proxy
      const H2Total = realMetH2 + realVolH2 * 0.1;

      let trend: 'up' | 'stable' | 'down' = 'stable';
      if (H2Total > H1Total * 1.05) trend = 'up';
      else if (H2Total < H1Total * 0.95) trend = 'down';

      // Status
      let status: 'excellent' | 'surveillance' | 'attention' = 'excellent';
      if (score >= 90) status = 'excellent';
      else if (score >= 70) status = 'surveillance';
      else status = 'attention';

      return {
        ...sec,
        score,
        trend,
        status,
        realMet,
        planMet,
        realVol,
        planVol
      };
    });
  }, [allProductionDocs, allPlanningSheets]);

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4.5 text-white shadow-md">
      <div className="flex items-center gap-2 mb-3 border-b border-slate-800 pb-2">
        <ShieldCheck className="w-4 h-4 text-[#ffd700]" />
        <span className="text-[9px] font-black uppercase tracking-widest text-slate-300">Vue Direction Générale Express (Lecture Rapide)</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {sectorScores.map(sec => {
          const statusColors = 
            sec.status === 'excellent' ? { bg: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400', badge: 'EXCELLENT', dot: 'bg-emerald-500' } :
            sec.status === 'surveillance' ? { bg: 'bg-amber-500/10 border-amber-500/20 text-amber-400', badge: 'SURVEILLANCE', dot: 'bg-amber-500' } :
            { bg: 'bg-rose-500/10 border-rose-500/20 text-rose-400', badge: 'ATTENTION', dot: 'bg-rose-500' };

          return (
            <div 
              key={sec.id} 
              className={`border rounded-xl p-3 flex flex-col justify-between h-24 transition-all hover:scale-[1.01] ${statusColors.bg}`}
            >
              {/* Sector Name & status badge */}
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-black text-white tracking-wide uppercase">{sec.name}</span>
                <span className="text-[7.5px] font-black uppercase flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full ${statusColors.dot}`} />
                  {statusColors.badge}
                </span>
              </div>

              {/* Score and Trend Indicator */}
              <div className="flex justify-between items-end mt-2">
                <div>
                  <span className="text-2xl font-mono font-black text-white block leading-none">{sec.score}%</span>
                  <span className="text-[7.5px] text-slate-400 uppercase font-bold tracking-wider mt-1 block">Score de Performance</span>
                </div>

                {/* Trend icon container */}
                <div className="text-right">
                  {sec.trend === 'up' && (
                    <span className="text-[8px] font-black text-emerald-400 uppercase flex items-center gap-0.5">
                      <TrendingUp className="w-3.5 h-3.5" /> HAUSSE
                    </span>
                  )}
                  {sec.trend === 'down' && (
                    <span className="text-[8px] font-black text-rose-400 uppercase flex items-center gap-0.5">
                      <TrendingDown className="w-3.5 h-3.5" /> BAISSE
                    </span>
                  )}
                  {sec.trend === 'stable' && (
                    <span className="text-[8px] font-black text-slate-400 uppercase flex items-center gap-0.5">
                      <Minus className="w-3.5 h-3.5" /> STABLE
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
