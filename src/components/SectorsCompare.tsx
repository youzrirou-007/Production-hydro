import React from 'react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { 
  TrendingUp, 
  Layers, 
  Flame, 
  Fuel, 
  Award, 
  Zap, 
  Info,
  ChevronRight,
  ArrowUpRight
} from 'lucide-react';

interface SectorsCompareProps {
  allProductionDocs: any[];
  allPlanningSheets: any[];
  chantiers: any[];
  employees: any[];
  reportType: 'day' | 'month';
  filterDate: string;
  filterMonth: string;
}

export const SectorsCompare: React.FC<SectorsCompareProps> = ({
  allProductionDocs,
  allPlanningSheets,
  chantiers,
  employees,
  reportType,
  filterDate,
  filterMonth
}) => {

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
    const sector = row.sector || plan.sector || rec.sector || rec.sectorGroup || rec.reel?.sectorGroup || rec.plan?.sectorGroup || plan.sectorGroup || '';
    if (sector) return sector;
    const chantierId = row.chantierId || rec.chantierId || plan.chantierId;
    if (chantierId) {
      const matched = chantiers.find(c => c.id === chantierId);
      if (matched && matched.sector) return matched.sector;
    }
    return '';
  };

  const isTargetSector = (sector: string) => {
    const s = (sector || '').trim().toLowerCase();
    return s === 'imiter 2' || s === 'imiter 1' || s === 'imiter est' || s === 'bure imiter est' || s === 'imiter est bure';
  };

  const normalizeSectorName = (name: string): 'Imiter 1' | 'Imiter 2' | 'Imiter Est' | 'Bure Imiter Est' | null => {
    const s = (name || '').trim().toLowerCase();
    if (s === 'imiter 1') return 'Imiter 1';
    if (s === 'imiter 2') return 'Imiter 2';
    if (s === 'imiter est') return 'Imiter Est';
    if (s === 'bure imiter est' || s === 'imiter est bure') return 'Bure Imiter Est';
    return null;
  };

  // Get active aligned days for current selection (day or month)
  const getAlignedDays = () => {
    let aligned: { prodDate: string; planDate: string; prodDoc: any; planDoc: any }[] = [];
    if (reportType === 'day') {
      const prevDate = getPreviousDateStr(filterDate);
      const pDoc = allProductionDocs.find(d => d.id === filterDate);
      const sDoc = allPlanningSheets.find(d => d.id === prevDate);
      aligned.push({ prodDate: filterDate, planDate: prevDate, prodDoc: pDoc || null, planDoc: sDoc || null });
    } else {
      // Month
      const prefix = filterMonth; // e.g. "2026-06"
      const daysInMonth = allProductionDocs.filter(d => d.id.startsWith(prefix));
      daysInMonth.forEach(pDoc => {
        const dateStr = pDoc.id;
        const prevDateStr = getPreviousDateStr(dateStr);
        const sDoc = allPlanningSheets.find(d => d.id === prevDateStr);
        aligned.push({ prodDate: dateStr, planDate: prevDateStr, prodDoc: pDoc, planDoc: sDoc || null });
      });
      // Also add planned-only days in month if no prod exists yet
      allPlanningSheets.forEach(sDoc => {
        if (sDoc.id.startsWith(prefix)) {
          // If the day following this planning is in this month and not already added
          const prodDayStr = sDoc.id; // wait, planning ID is the day BEFORE production usually.
          // Let's deduce target production date
          try {
            const d = new Date(sDoc.id + 'T12:00:00');
            d.setDate(d.getDate() + 1);
            const targetProdDate = d.toISOString().split('T')[0];
            if (targetProdDate.startsWith(prefix) && !aligned.some(a => a.prodDate === targetProdDate)) {
              const pDoc = allProductionDocs.find(d => d.id === targetProdDate);
              aligned.push({ prodDate: targetProdDate, planDate: sDoc.id, prodDoc: pDoc || null, planDoc: sDoc });
            }
          } catch(e){}
        }
      });
    }
    return aligned;
  };

  const alignedDays = getAlignedDays();

  // Aggregate stats per sector
  const getSectorAggregates = () => {
    const sectorsData = {
      'Imiter 1': { name: 'Imiter 1', realMet: 0, planMet: 0, realRounds: 0, planRounds: 0, realVol: 0, planVol: 0, anfo: 0, tovex: 0, gasoil: 0, godets: 0 },
      'Imiter 2': { name: 'Imiter 2', realMet: 0, planMet: 0, realRounds: 0, planRounds: 0, realVol: 0, planVol: 0, anfo: 0, tovex: 0, gasoil: 0, godets: 0 },
      'Imiter Est': { name: 'Imiter Est', realMet: 0, planMet: 0, realRounds: 0, planRounds: 0, realVol: 0, planVol: 0, anfo: 0, tovex: 0, gasoil: 0, godets: 0 },
      'Bure Imiter Est': { name: 'Bure Imiter Est', realMet: 0, planMet: 0, realRounds: 0, planRounds: 0, realVol: 0, planVol: 0, anfo: 0, tovex: 0, gasoil: 0, godets: 0 }
    };

    alignedDays.forEach(({ prodDoc, planDoc }) => {
      // Minage Real
      if (prodDoc && prodDoc.postes) {
        ['poste1', 'poste2', 'poste3'].forEach(pKey => {
          const minage = prodDoc.postes[pKey]?.minage || [];
          minage.forEach((row: any) => {
            const secGroup = getRecordSectorGroup(row);
            const norm = normalizeSectorName(secGroup);
            if (norm) {
              const reel = row.reel || row || {};
              sectorsData[norm].realMet += Number(reel.realMeterage || 0);
              sectorsData[norm].realRounds += Number(reel.realRounds || 0);
              sectorsData[norm].anfo += Number(reel.anfo || 0);
              sectorsData[norm].tovex += Number(reel.tovex || 0);
            }
          });
        });
      }

      // Minage Plan (either from planDoc or from prodDoc embedded plans)
      if (planDoc && planDoc.postes) {
        ['poste1', 'poste2', 'poste3'].forEach(pKey => {
          const minage = planDoc.postes[pKey]?.minage || [];
          minage.forEach((row: any) => {
            const secGroup = getRecordSectorGroup(row);
            const norm = normalizeSectorName(secGroup);
            if (norm) {
              sectorsData[norm].planMet += Number(row.meterage || row.plannedRounds * 1.7 || 0);
              sectorsData[norm].planRounds += Number(row.plannedRounds || 0);
            }
          });
        });
      } else if (prodDoc && prodDoc.postes) {
        ['poste1', 'poste2', 'poste3'].forEach(pKey => {
          const minage = prodDoc.postes[pKey]?.minage || [];
          minage.forEach((row: any) => {
            const secGroup = getRecordSectorGroup(row);
            const norm = normalizeSectorName(secGroup);
            if (norm) {
              const plan = row.plan || {};
              sectorsData[norm].planMet += Number(plan.meterage || plan.plannedRounds * 1.7 || 0);
              sectorsData[norm].planRounds += Number(plan.plannedRounds || 0);
            }
          });
        });
      }

      // Deblayage Real
      if (prodDoc && prodDoc.postes) {
        ['poste1', 'poste2', 'poste3'].forEach(pKey => {
          const deblayage = prodDoc.postes[pKey]?.deblayage || [];
          deblayage.forEach((row: any) => {
            const secGroup = getRecordSectorGroup(row);
            const norm = normalizeSectorName(secGroup);
            if (norm) {
              const reel = row.reel || row || {};
              sectorsData[norm].realVol += Number(reel.volumeEstimated || 0);
              sectorsData[norm].gasoil += Number(reel.gasoil || 0);
              sectorsData[norm].godets += Number(reel.godets || 0);
            }
          });
        });
      }

      // Deblayage Plan
      if (planDoc && planDoc.postes) {
        ['poste1', 'poste2', 'poste3'].forEach(pKey => {
          const deblayage = planDoc.postes[pKey]?.deblayage || [];
          deblayage.forEach((row: any) => {
            const secGroup = getRecordSectorGroup(row);
            const norm = normalizeSectorName(secGroup);
            if (norm) {
              sectorsData[norm].planVol += Number(row.volumeEstimated || 0);
            }
          });
        });
      } else if (prodDoc && prodDoc.postes) {
        ['poste1', 'poste2', 'poste3'].forEach(pKey => {
          const deblayage = prodDoc.postes[pKey]?.deblayage || [];
          deblayage.forEach((row: any) => {
            const secGroup = getRecordSectorGroup(row);
            const norm = normalizeSectorName(secGroup);
            if (norm) {
              const plan = row.plan || {};
              sectorsData[norm].planVol += Number(plan.volumeEstimated || 0);
            }
          });
        });
      }
    });

    return Object.values(sectorsData).map(s => {
      const metSuccessRate = s.planMet > 0 ? (s.realMet / s.planMet) * 100 : 100;
      const volSuccessRate = s.planVol > 0 ? (s.realVol / s.planVol) * 100 : 100;
      const avgMetPerRound = s.realRounds > 0 ? (s.realMet / s.realRounds) : 0;
      
      const explosivesTotal = s.anfo + s.tovex;
      const specificExplosive = s.realMet > 0 ? (explosivesTotal / s.realMet) : 0; // kg/m
      const fuelIntensity = s.realVol > 0 ? (s.gasoil / s.realVol) : 0; // L/m³

      return {
        ...s,
        metSuccessRate,
        volSuccessRate,
        avgMetPerRound,
        explosivesTotal,
        specificExplosive,
        fuelIntensity
      };
    });
  };

  const compareData = getSectorAggregates();

  // Highlight colors per sector
  const getSectorStyle = (name: string) => {
    switch(name) {
      case 'Imiter 1': return { color: '#0ea5e9', bg: 'bg-sky-50 text-sky-800 border-sky-100', accent: 'border-sky-500' };
      case 'Imiter 2': return { color: '#ef4444', bg: 'bg-rose-50 text-rose-800 border-rose-100', accent: 'border-rose-500' };
      case 'Imiter Est': return { color: '#14b8a6', bg: 'bg-teal-50 text-teal-800 border-teal-100', accent: 'border-teal-500' };
      default: return { color: '#6366f1', bg: 'bg-indigo-50 text-indigo-800 border-indigo-100', accent: 'border-indigo-500' };
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white border border-slate-200 p-3 rounded-xl shadow-lg text-[10.5px]">
          <p className="font-black uppercase text-slate-800 border-b border-slate-100 pb-1 mb-1.5">{label}</p>
          {payload.map((item: any, i: number) => (
            <div key={i} className="flex items-center justify-between gap-4 py-0.5">
              <span className="text-slate-500 font-bold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                {item.name}:
              </span>
              <span className="font-black font-mono text-slate-900">{Number(item.value).toFixed(1)} {item.unit || ''}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  // Find the top performing sector in drilling
  const topDriller = [...compareData].sort((a, b) => b.realMet - a.realMet)[0];
  // Find top in volumetric rock moving
  const topMover = [...compareData].sort((a, b) => b.realVol - a.realVol)[0];
  // Best blasting efficiency (highest meters per volée)
  const topYield = [...compareData].filter(s => s.realRounds > 0).sort((a, b) => b.avgMetPerRound - a.avgMetPerRound)[0];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Banner / Explanation */}
      <div className="bg-slate-50 border border-[#d4af37]/35 p-6 rounded-2xl flex flex-col md:flex-row gap-5 items-center justify-between relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#0ea5e9] to-[#ef4444]" />
        <div className="space-y-1.5 max-w-2xl mt-1">
          <h2 className="text-xs font-black uppercase text-slate-800 flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#b8860b]" />
            Analyse Comparative Consolidée des Secteurs
          </h2>
          <p className="text-[10px] text-slate-500 uppercase leading-relaxed">
            Ce module compare la performance opérationnelle, l'efficacité des tirs de minage, l'éco-conduite et les intensités énergétiques des quatre grands secteurs d'exploitation : <strong className="text-slate-800">Imiter 1, Imiter 2, Imiter Est et Bure Imiter Est</strong>.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 justify-center">
          <span className="px-2.5 py-1 text-[8.5px] font-black uppercase rounded-lg border border-sky-200 bg-sky-50 text-sky-700">Imiter 1</span>
          <span className="px-2.5 py-1 text-[8.5px] font-black uppercase rounded-lg border border-rose-200 bg-rose-50 text-rose-700">Imiter 2</span>
          <span className="px-2.5 py-1 text-[8.5px] font-black uppercase rounded-lg border border-teal-200 bg-teal-50 text-teal-700">Imiter Est</span>
          <span className="px-2.5 py-1 text-[8.5px] font-black uppercase rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700">Bure Imiter Est</span>
        </div>
      </div>

      {/* Highlights / Podiums */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Top Forage */}
        <div className="bg-white border border-[#d4af37]/35 p-4.5 rounded-xl shadow-2xs relative overflow-hidden flex items-center gap-4">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0ea5e9] to-[#ef4444]" />
          <div className="w-10 h-10 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center shrink-0 mt-1">
            <TrendingUp className="w-5 h-5 text-sky-600" />
          </div>
          <div>
            <span className="text-[8.5px] font-extrabold text-slate-400 uppercase tracking-wider block">Leader Forage & Avancement</span>
            <span className="text-xs font-black text-slate-800 uppercase block">{topDriller?.realMet > 0 ? topDriller.name : 'N/A'}</span>
            <span className="text-[10.5px] font-mono font-black text-sky-600">{topDriller?.realMet.toFixed(1)} m <span className="text-[8px] text-slate-400 font-bold">({topDriller?.metSuccessRate.toFixed(0)}% de l'objectif)</span></span>
          </div>
          <div className="absolute top-2 right-2 text-[7px] font-black uppercase bg-sky-100 text-sky-800 px-1.5 py-0.5 rounded">FORAGE</div>
        </div>

        {/* Top Volumétrie */}
        <div className="bg-white border border-[#d4af37]/35 p-4.5 rounded-xl shadow-2xs relative overflow-hidden flex items-center gap-4">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0ea5e9] to-[#ef4444]" />
          <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center shrink-0 mt-1">
            <Layers className="w-5 h-5 text-teal-600" />
          </div>
          <div>
            <span className="text-[8.5px] font-extrabold text-slate-400 uppercase tracking-wider block">Leader Chargement & Déblayage</span>
            <span className="text-xs font-black text-slate-800 uppercase block">{topMover?.realVol > 0 ? topMover.name : 'N/A'}</span>
            <span className="text-[10.5px] font-mono font-black text-teal-600">{topMover?.realVol.toFixed(1)} m³ <span className="text-[8px] text-slate-400 font-bold">({topMover?.volSuccessRate.toFixed(0)}% de l'objectif)</span></span>
          </div>
          <div className="absolute top-2 right-2 text-[7px] font-black uppercase bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded">LHD LOADING</div>
        </div>

        {/* Top Blasting Yield */}
        <div className="bg-white border border-[#d4af37]/35 p-4.5 rounded-xl shadow-2xs relative overflow-hidden flex items-center gap-4">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0ea5e9] to-[#ef4444]" />
          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center shrink-0 mt-1">
            <Zap className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <span className="text-[8.5px] font-extrabold text-slate-400 uppercase tracking-wider block">Efficacité de tir (m / Volée)</span>
            <span className="text-xs font-black text-slate-800 uppercase block">{topYield?.avgMetPerRound > 0 ? topYield.name : 'N/A'}</span>
            <span className="text-[10.5px] font-mono font-black text-amber-600">{topYield?.avgMetPerRound.toFixed(2)} m/v <span className="text-[8px] text-slate-400 font-bold">de rendement moyen</span></span>
          </div>
          <div className="absolute top-2 right-2 text-[7px] font-black uppercase bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded">BLASTING</div>
        </div>
      </div>

      {/* Main Comparative Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Drilling Progress Real vs Target */}
        <div className="bg-white border border-[#d4af37]/35 rounded-2xl p-5 space-y-3 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#0ea5e9] to-[#ef4444]" />
          <h3 className="text-xs font-black uppercase text-slate-800 mt-1">Forage Réalisé vs Objectif de Planification (m)</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={compareData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 900 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 9, fontFamily: 'monospace' }} stroke="#94a3b8" />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 9, fontWeight: 'bold', textTransform: 'uppercase' }} />
                <Bar name="Mètres Réalisés" dataKey="realMet" fill="#b8860b" radius={[4, 4, 0, 0]} unit=" m" />
                <Bar name="Mètres Prévus" dataKey="planMet" fill="#cbd5e1" radius={[4, 4, 0, 0]} unit=" m" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Volumetric Rock Moving */}
        <div className="bg-white border border-[#d4af37]/35 rounded-2xl p-5 space-y-3 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#0ea5e9] to-[#ef4444]" />
          <h3 className="text-xs font-black uppercase text-slate-800 mt-1">Chargement LHD Réalisé vs Objectif de Volume (m³)</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={compareData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 900 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 9, fontFamily: 'monospace' }} stroke="#94a3b8" />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: 9, fontWeight: 'bold', textTransform: 'uppercase' }} />
                <Bar name="Volume Réel" dataKey="realVol" fill="#14b8a6" radius={[4, 4, 0, 0]} unit=" m³" />
                <Bar name="Volume Cible" dataKey="planVol" fill="#e2e8f0" radius={[4, 4, 0, 0]} unit=" m³" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Chart 3 & 4: Specific Explosives Intensity and Fuel Intensity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Specific Explosive consumption per meter */}
        <div className="bg-white border border-[#d4af37]/35 rounded-2xl p-5 space-y-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#0ea5e9] to-[#ef4444]" />
          <div className="flex justify-between items-center mt-1">
            <h3 className="text-xs font-black uppercase text-slate-800 flex items-center gap-1.5">
              <Flame className="w-4 h-4 text-orange-500" />
              Intensité d'Explosifs (kg/m)
            </h3>
            <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-100">Optimum : &lt; 25 kg/m</span>
          </div>
          <p className="text-[9.5px] text-slate-400 uppercase font-bold leading-none">
            Rapport de consommation spécifique d'explosifs (ANFO + Tovex) par mètre linéaire foré.
          </p>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={compareData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 900 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 9, fontFamily: 'monospace' }} stroke="#94a3b8" />
                <Tooltip content={<CustomTooltip />} />
                <Bar name="Intensité Explosifs" dataKey="specificExplosive" fill="#f97316" radius={[4, 4, 0, 0]} unit=" kg/m" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Fuel consumption per m³ of rock moved */}
        <div className="bg-white border border-[#d4af37]/35 rounded-2xl p-5 space-y-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#0ea5e9] to-[#ef4444]" />
          <div className="flex justify-between items-center mt-1">
            <h3 className="text-xs font-black uppercase text-slate-800 flex items-center gap-1.5">
              <Fuel className="w-4 h-4 text-emerald-600" />
              Consommation Spécifique de Carburant (L/m³)
            </h3>
            <span className="text-[8px] font-black uppercase px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100">Optimum : &lt; 1.5 L/m³</span>
          </div>
          <p className="text-[9.5px] text-slate-400 uppercase font-bold leading-none">
            Volume de Gasoil consommé par les chargeuses LHD pour déplacer un mètre cube de roche.
          </p>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={compareData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 9, fontWeight: 900 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 9, fontFamily: 'monospace' }} stroke="#94a3b8" />
                <Tooltip content={<CustomTooltip />} />
                <Bar name="Intensité Carburant" dataKey="fuelIntensity" fill="#10b981" radius={[4, 4, 0, 0]} unit=" L/m³" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Main Comparison Master Matrix Grid */}
      <div className="bg-white border border-[#d4af37]/35 rounded-2xl p-5 space-y-4 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#0ea5e9] to-[#ef4444]" />
        <h3 className="text-xs font-black uppercase text-slate-800 mt-1">Matrice de Comparaison Analytique des Secteurs</h3>
        <div className="overflow-x-auto border border-slate-100 rounded-xl">
          <table className="w-full text-left border-collapse text-[10.5px]">
            <thead>
              <tr className="bg-slate-900 text-white uppercase text-[8.5px] font-bold">
                <th className="p-3">Secteur</th>
                <th className="p-3 text-center">Avancement Réel (m)</th>
                <th className="p-3 text-center">Objectif Forage (m)</th>
                <th className="p-3 text-center">Taux Atteinte Forage</th>
                <th className="p-3 text-center">Volées Tirées</th>
                <th className="p-3 text-center">Rendement (m / Volée)</th>
                <th className="p-3 text-center">Déblayage Réel (m³)</th>
                <th className="p-3 text-center">Objectif Volumétrie (m³)</th>
                <th className="p-3 text-center">Taux Atteinte Déblayage</th>
                <th className="p-3 text-center">Explosifs (kg)</th>
                <th className="p-3 text-center">Intensité Explosifs (kg/m)</th>
                <th className="p-3 text-center">Ratio Carburant LHD (L/m³)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {compareData.map((s, idx) => {
                const style = getSectorStyle(s.name);
                return (
                  <tr key={idx} className="hover:bg-slate-50/50">
                    <td className="p-3 font-black uppercase text-slate-700 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: style.color }} />
                      {s.name}
                    </td>
                    <td className="p-3 text-center font-mono font-black text-slate-800">{s.realMet.toFixed(1)} m</td>
                    <td className="p-3 text-center font-mono text-slate-400">{s.planMet.toFixed(1)} m</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 text-[8.5px] font-black rounded-lg border ${s.metSuccessRate >= 100 ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : s.metSuccessRate >= 80 ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-rose-50 text-rose-800 border-rose-200'}`}>
                        {s.metSuccessRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="p-3 text-center font-mono text-slate-600">{s.realRounds}</td>
                    <td className="p-3 text-center">
                      <span className={`px-1.5 py-0.5 text-[8.5px] font-mono font-black rounded-lg ${s.avgMetPerRound >= 1.5 ? 'bg-emerald-50 text-emerald-800' : s.avgMetPerRound > 0 ? 'bg-amber-50 text-amber-800' : 'bg-slate-100 text-slate-400'}`}>
                        {s.avgMetPerRound > 0 ? `${s.avgMetPerRound.toFixed(2)} m/v` : '0.00'}
                      </span>
                    </td>
                    <td className="p-3 text-center font-mono font-black text-slate-800">{s.realVol.toFixed(1)} m³</td>
                    <td className="p-3 text-center font-mono text-slate-400">{s.planVol.toFixed(1)} m³</td>
                    <td className="p-3 text-center">
                      <span className={`px-2 py-0.5 text-[8.5px] font-black rounded-lg border ${s.volSuccessRate >= 100 ? 'bg-emerald-50 text-emerald-800 border-emerald-200' : s.volSuccessRate >= 80 ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-rose-50 text-rose-800 border-rose-200'}`}>
                        {s.volSuccessRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="p-3 text-center font-mono text-slate-500">{s.explosivesTotal.toFixed(0)} kg</td>
                    <td className="p-3 text-center font-mono font-bold text-orange-600">{s.specificExplosive > 0 ? `${s.specificExplosive.toFixed(1)} kg/m` : '0.0'}</td>
                    <td className="p-3 text-center font-mono font-bold text-emerald-600">{s.fuelIntensity > 0 ? `${s.fuelIntensity.toFixed(2)} L/m³` : '0.00'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
