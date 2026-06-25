import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  MapPin, 
  Layers, 
  Clock, 
  HardHat, 
  Bomb, 
  Truck, 
  Cpu, 
  AlertTriangle, 
  CheckCircle,
  HelpCircle,
  Gauge,
  Workflow,
  Tractor,
  Train,
  Hammer,
  Wrench,
  TrendingUp,
  TrendingDown,
  Info,
  ChevronRight
} from 'lucide-react';
import { collection, query, onSnapshot, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { format, subDays, parseISO, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  AreaChart,
  Area
} from 'recharts';
import logoImg from '../assets/images/hydromines_logo_1781337889277.jpg';

// Helper to secure timezone shifts in dates
const getPreviousDateStr = (dateStr: string) => {
  try {
    const d = new Date(dateStr + 'T12:00:00');
    d.setDate(d.getDate() - 1);
    return format(d, 'yyyy-MM-dd');
  } catch (e) {
    return dateStr;
  }
};

export const AnalyseDashboard: React.FC = () => {
  const [reportType, setReportType] = useState<'day' | 'month'>('day');
  const [filterDate, setFilterDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [filterMonth, setFilterMonth] = useState(format(new Date(), 'yyyy-MM'));

  // Database States
  const [chantiers, setChantiers] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [engines, setEngines] = useState<any[]>([]);
  const [allPlanningSheets, setAllPlanningSheets] = useState<any[]>([]);
  const [allProductionDocs, setAllProductionDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Inject premium banner styling (shimmer and subtleGlow animations)
  useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.innerHTML = `
      @keyframes shimmer {
        0% { background-position: -200% center; }
        100% { background-position: 200% center; }
      }
      @keyframes subtleGlow {
        0%, 100% { opacity: 0.4; }
        50% { opacity: 0.9; }
      }
      .gold-title {
        font-size: 26px;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        background: linear-gradient(
          90deg,
          #475569 0%,
          #b8860b 20%,
          #ffd700 35%,
          #e5c158 50%,
          #ffd700 65%,
          #b8860b 80%,
          #475569 100%
        );
        background-size: 200% auto;
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
        animation: shimmer 4s linear infinite;
      }
      .subtle-glow-line {
        height: 1px;
        background: linear-gradient(90deg, transparent, #b8860b, #ffd700, #b8860b, transparent);
        animation: subtleGlow 3s ease-in-out infinite;
      }
    `;
    document.head.appendChild(styleEl);
    return () => {
      if (document.head.contains(styleEl)) {
        document.head.removeChild(styleEl);
      }
    };
  }, []);

  // Subscribe to all required collections
  useEffect(() => {
    setLoading(true);

    const unsubChantiers = onSnapshot(query(collection(db, 'chantiers')), (snap) => {
      setChantiers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubRH = onSnapshot(query(collection(db, 'personnel')), (snap) => {
      setEmployees(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubEngines = onSnapshot(query(collection(db, 'engines')), (snap) => {
      setEngines(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubPlannings = onSnapshot(query(collection(db, 'daily_planning_sheets')), (snap) => {
      setAllPlanningSheets(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubProd = onSnapshot(query(collection(db, 'production')), (snap) => {
      setAllProductionDocs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    }, () => {
      setLoading(false);
    });

    return () => {
      unsubChantiers();
      unsubRH();
      unsubEngines();
      unsubPlannings();
      unsubProd();
    };
  }, []);

  // Helper Name Resolution Functions
  const getChantierName = (id: string) => {
    if (!id) return 'N/A';
    if (id.startsWith('stock_')) {
      return id.replace('stock_', 'STOCK : ').toUpperCase();
    }
    const match = chantiers.find(c => c.id === id);
    return match ? match.name : id;
  };

  const getPersonnelName = (matricule: string) => {
    if (!matricule) return '';
    const match = employees.find(e => e.matricule?.toUpperCase() === matricule.toUpperCase());
    return match ? `${match.nom} ${match.prenom}` : matricule;
  };

  // Helper to filter target sectors
  const isTargetSector = (sector: string) => {
    const s = (sector || '').trim().toLowerCase();
    return s === 'imiter 2' || s === 'imiter 1' || s === 'imiter est';
  };

  const getRecordSectorGroup = (rec: any) => {
    const row = rec.reel || rec;
    const plan = rec.plan || {};
    const sector = row.sector || plan.sector || rec.sector || rec.sectorGroup || rec.reel?.sectorGroup || rec.plan?.sectorGroup || plan.sectorGroup || '';
    if (sector) return sector;
    
    // Fallback to chantier lookup
    const chantierId = row.chantierId || rec.chantierId || plan.chantierId;
    if (chantierId) {
      const matched = chantiers.find(c => c.id === chantierId);
      if (matched && matched.sector) return matched.sector;
    }
    return '';
  };

  // Safe time calculation
  const getDurationInHours = (start: string, end: string) => {
    try {
      if (!start || !end) return 8;
      const [h1, m1] = start.split(':').map(Number);
      const [h2, m2] = end.split(':').map(Number);
      let diffMin = (h2 * 60 + m2) - (h1 * 60 + m1);
      if (diffMin < 0) diffMin += 24 * 60; // handle midnight rollover
      return diffMin / 60;
    } catch (e) {
      return 8;
    }
  };

  // Aggregation Logic for Active Mode (Day or Month)
  const getAggregatedData = () => {
    let alignedDays: { prodDate: string; planDate: string; prodDoc: any; planDoc: any }[] = [];

    if (reportType === 'day') {
      const prevDate = getPreviousDateStr(filterDate);
      const pDoc = allProductionDocs.find(d => d.id === filterDate);
      const sDoc = allPlanningSheets.find(d => d.id === prevDate);
      alignedDays.push({
        prodDate: filterDate,
        planDate: prevDate,
        prodDoc: pDoc || null,
        planDoc: sDoc || null
      });
    } else {
      // Month mode: find all days in the filtered month
      try {
        const start = startOfMonth(parseISO(filterMonth + '-01'));
        const end = endOfMonth(start);
        const days = eachDayOfInterval({ start, end });
        
        days.forEach(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const prevDateStr = getPreviousDateStr(dateStr);
          const pDoc = allProductionDocs.find(d => d.id === dateStr);
          const sDoc = allPlanningSheets.find(d => d.id === prevDateStr);
          
          if (pDoc || sDoc) {
            alignedDays.push({
              prodDate: dateStr,
              planDate: prevDateStr,
              prodDoc: pDoc || null,
              planDoc: sDoc || null
            });
          }
        });
      } catch (e) {
        console.error("Error generating dates for month aggregation: ", e);
      }
    }

    // Accumulators
    let totalRealMeterage = 0;
    let totalPlanMeterage = 0;
    let totalRealRounds = 0;
    let totalPlanRounds = 0;
    let totalRealAnfo = 0;
    let totalPlanAnfo = 0;
    let totalRealTovex = 0;
    let totalPlanTovex = 0;

    let totalRealVolume = 0;
    let totalPlanVolume = 0;
    let totalDeblayageGasoil = 0;

    let totalRealWagons = 0;
    let totalPlanWagons = 0;
    let totalRealSterile = 0;
    let totalExtractionHours = 0;

    const uniqueRealAgents = new Set<string>();
    const uniquePlanAgents = new Set<string>();

    let totalRealMaintHours = 0;
    let totalPlanMaintHours = 0;

    // Substructures lists for tables and section analysis
    const consolidatedMinageRows: any[] = [];
    const consolidatedDeblayageRows: any[] = [];
    const consolidatedExtractionRows: any[] = [];
    const consolidatedMaintenanceRows: any[] = [];

    // Helper to add agents securely
    const addAgent = (set: Set<string>, matricule: any) => {
      if (typeof matricule === 'string' && matricule.trim() !== '') {
        set.add(matricule.trim().toUpperCase());
      }
    };

    alignedDays.forEach(({ prodDate, planDate, prodDoc, planDoc }) => {
      // 1. MINAGE
      if (prodDoc && prodDoc.postes) {
        ['poste1', 'poste2', 'poste3'].forEach(pKey => {
          const rows = prodDoc.postes[pKey]?.minage || [];
          rows.forEach((r: any) => {
            const sector = getRecordSectorGroup(r);
            if (!isTargetSector(sector)) return;

            const reel = r.reel || r || {};
            const plan = r.plan || {};
            totalRealMeterage += Number(reel.realMeterage || 0);
            totalRealRounds += Number(reel.realRounds || 0);
            totalRealAnfo += Number(reel.anfo || 0);
            totalRealTovex += Number(reel.tovex || 0);

            addAgent(uniqueRealAgents, reel.minerMatricule);
            addAgent(uniqueRealAgents, reel.assistantMatricule);

            consolidatedMinageRows.push({
              ...r,
              date: prodDate,
              poste: pKey === 'poste1' ? 'Poste 1' : pKey === 'poste2' ? 'Poste 2' : 'Poste 3',
              sectorGroup: sector,
              reel,
              plan
            });
          });
        });
      }

      if (planDoc && planDoc.postes) {
        ['poste1', 'poste2', 'poste3'].forEach(pKey => {
          const rows = planDoc.postes[pKey]?.minage || [];
          rows.forEach((r: any) => {
            const sector = getRecordSectorGroup(r);
            if (!isTargetSector(sector)) return;

            totalPlanMeterage += Number(r.meterage || r.plannedRounds * 1.7 || 0);
            totalPlanRounds += Number(r.plannedRounds || 0);
            totalPlanAnfo += Number(r.anfo || 0);
            totalPlanTovex += Number(r.tovex || 0);

            addAgent(uniquePlanAgents, r.minerMatricule);
            addAgent(uniquePlanAgents, r.assistantMatricule);
          });
        });
      } else if (prodDoc && prodDoc.postes) {
        // Fallback: extract plan sub-objects from prodDoc
        ['poste1', 'poste2', 'poste3'].forEach(pKey => {
          const rows = prodDoc.postes[pKey]?.minage || [];
          rows.forEach((r: any) => {
            const sector = getRecordSectorGroup(r);
            if (!isTargetSector(sector)) return;

            const plan = r.plan || {};
            totalPlanMeterage += Number(plan.meterage || plan.plannedRounds * 1.7 || 0);
            totalPlanRounds += Number(plan.plannedRounds || 0);
            totalPlanAnfo += Number(plan.anfo || 0);
            totalPlanTovex += Number(plan.tovex || 0);

            addAgent(uniquePlanAgents, plan.minerMatricule);
            addAgent(uniquePlanAgents, plan.assistantMatricule);
          });
        });
      }

      // 2. DÉBLAYAGE
      if (prodDoc && prodDoc.postes) {
        ['poste1', 'poste2', 'poste3'].forEach(pKey => {
          const rows = prodDoc.postes[pKey]?.deblayage || [];
          rows.forEach((r: any) => {
            const sector = getRecordSectorGroup(r);
            if (!isTargetSector(sector)) return;

            const reel = r.reel || r || {};
            const plan = r.plan || {};
            totalRealVolume += Number(reel.volumeEstimated || 0);
            totalDeblayageGasoil += Number(reel.gasoil || 0);

            addAgent(uniqueRealAgents, reel.driverMatricule);

            consolidatedDeblayageRows.push({
              ...r,
              date: prodDate,
              poste: pKey === 'poste1' ? 'Poste 1' : pKey === 'poste2' ? 'Poste 2' : 'Poste 3',
              sectorGroup: sector,
              reel,
              plan
            });
          });
        });
      }

      if (planDoc && planDoc.postes) {
        ['poste1', 'poste2', 'poste3'].forEach(pKey => {
          const rows = planDoc.postes[pKey]?.deblayage || [];
          rows.forEach((r: any) => {
            const sector = getRecordSectorGroup(r);
            if (!isTargetSector(sector)) return;

            totalPlanVolume += Number(r.volumeEstimated || 0);
            addAgent(uniquePlanAgents, r.driverMatricule);
          });
        });
      } else if (prodDoc && prodDoc.postes) {
        ['poste1', 'poste2', 'poste3'].forEach(pKey => {
          const rows = prodDoc.postes[pKey]?.deblayage || [];
          rows.forEach((r: any) => {
            const sector = getRecordSectorGroup(r);
            if (!isTargetSector(sector)) return;

            const plan = r.plan || {};
            totalPlanVolume += Number(plan.volumeEstimated || 0);
            addAgent(uniquePlanAgents, plan.driverMatricule);
          });
        });
      }

      // 3. EXTRACTION
      if (prodDoc && prodDoc.postes) {
        ['poste1', 'poste2', 'poste3'].forEach(pKey => {
          const rows = prodDoc.postes[pKey]?.extraction || [];
          rows.forEach((r: any) => {
            const reel = r.reel || r || {};
            const plan = r.plan || {};
            
            const actW = Number(reel.wagonsActual || r.wagonsActual || 0);
            totalRealWagons += actW;
            totalRealSterile += Number(reel.sterileBureImiterEst || r.sterileBureImiterEst || 0);

            const duration = getDurationInHours(reel.startTime || r.startTime || '06:00', reel.endTime || r.endTime || '14:00');
            totalExtractionHours += duration;

            addAgent(uniqueRealAgents, reel.treuilliste);
            addAgent(uniqueRealAgents, reel.equipier1);
            addAgent(uniqueRealAgents, reel.equipier2);
            addAgent(uniqueRealAgents, reel.equipier3);
            addAgent(uniqueRealAgents, reel.equipier4);

            const tReel = reel.wagonsTarget !== undefined ? Number(reel.wagonsTarget) : undefined;
            const tPlan = plan.wagonsTarget !== undefined ? Number(plan.wagonsTarget) : undefined;
            const rTarget = r.wagonsTarget !== undefined ? Number(r.wagonsTarget) : undefined;
            totalPlanWagons += tReel ?? tPlan ?? rTarget ?? 48;

            consolidatedExtractionRows.push({
              ...r,
              date: prodDate,
              poste: pKey === 'poste1' ? 'Poste 1' : pKey === 'poste2' ? 'Poste 2' : 'Poste 3',
              reel,
              plan
            });
          });
        });
      }

      if (planDoc && planDoc.postes) {
        ['poste1', 'poste2', 'poste3'].forEach(pKey => {
          const rows = planDoc.postes[pKey]?.extraction || [];
          rows.forEach((r: any) => {
            addAgent(uniquePlanAgents, r.treuilliste);
            addAgent(uniquePlanAgents, r.equipier1);
            addAgent(uniquePlanAgents, r.equipier2);
            addAgent(uniquePlanAgents, r.equipier3);
            addAgent(uniquePlanAgents, r.equipier4);
          });
        });
      } else if (prodDoc && prodDoc.postes) {
        ['poste1', 'poste2', 'poste3'].forEach(pKey => {
          const rows = prodDoc.postes[pKey]?.extraction || [];
          rows.forEach((r: any) => {
            const plan = r.plan || {};
            addAgent(uniquePlanAgents, plan.treuilliste);
            addAgent(uniquePlanAgents, plan.equipier1);
            addAgent(uniquePlanAgents, plan.equipier2);
            addAgent(uniquePlanAgents, plan.equipier3);
            addAgent(uniquePlanAgents, plan.equipier4);
          });
        });
      }

      // 4. MAINTENANCE
      if (prodDoc && prodDoc.postes) {
        ['poste1', 'poste2', 'poste3'].forEach(pKey => {
          const rows = prodDoc.postes[pKey]?.maintenance || [];
          rows.forEach((r: any) => {
            const reel = r.reel || r || {};
            const plan = r.plan || {};
            totalRealMaintHours += Number(reel.hoursSpent || 0);

            addAgent(uniqueRealAgents, reel.agentMatricule || reel.mechanicMatricule);

            consolidatedMaintenanceRows.push({
              ...r,
              date: prodDate,
              poste: pKey === 'poste1' ? 'Poste 1' : pKey === 'poste2' ? 'Poste 2' : 'Poste 3',
              reel,
              plan
            });
          });
        });
      }

      if (planDoc && planDoc.postes) {
        ['poste1', 'poste2', 'poste3'].forEach(pKey => {
          const rows = planDoc.postes[pKey]?.maintenance || [];
          rows.forEach((r: any) => {
            totalPlanMaintHours += Number(r.hoursSpent || 0);
            addAgent(uniquePlanAgents, r.agentMatricule || r.mechanicMatricule);
          });
        });
      } else if (prodDoc && prodDoc.postes) {
        ['poste1', 'poste2', 'poste3'].forEach(pKey => {
          const rows = prodDoc.postes[pKey]?.maintenance || [];
          rows.forEach((r: any) => {
            const plan = r.plan || {};
            totalPlanMaintHours += Number(plan.hoursSpent || 0);
            addAgent(uniquePlanAgents, plan.agentMatricule || plan.mechanicMatricule);
          });
        });
      }
    });

    // Sector breakdown metrics helper
    const getSectorTotals = (sector: string) => {
      const name = sector.toLowerCase().trim();
      const minageRows = consolidatedMinageRows.filter(r => r.sectorGroup?.toLowerCase().trim() === name);
      const deblayageRows = consolidatedDeblayageRows.filter(r => r.sectorGroup?.toLowerCase().trim() === name);

      const realMet = minageRows.reduce((acc, r) => acc + Number(r.reel?.realMeterage || 0), 0);
      const planMet = minageRows.reduce((acc, r) => acc + Number(r.plan?.meterage || r.plan?.plannedRounds * 1.7 || 0), 0);

      const realVol = deblayageRows.reduce((acc, r) => acc + Number(r.reel?.volumeEstimated || 0), 0);
      const planVol = deblayageRows.reduce((acc, r) => acc + Number(r.plan?.volumeEstimated || 0), 0);

      return { realMet, planMet, realVol, planVol, minageRows, deblayageRows };
    };

    const sectorBreakdown = {
      imiter2: getSectorTotals('Imiter 2'),
      imiter1: getSectorTotals('Imiter 1'),
      imiterEst: getSectorTotals('Imiter Est')
    };

    return {
      alignedDays,
      totalRealMeterage,
      totalPlanMeterage,
      totalRealRounds,
      totalPlanRounds,
      totalRealAnfo,
      totalPlanAnfo,
      totalRealTovex,
      totalPlanTovex,
      totalRealVolume,
      totalPlanVolume,
      totalDeblayageGasoil,
      totalRealWagons,
      totalPlanWagons,
      totalRealSterile,
      totalExtractionHours,
      realPresence: uniqueRealAgents.size,
      planPresence: uniquePlanAgents.size,
      totalRealMaintHours,
      totalPlanMaintHours,
      sectorBreakdown,
      consolidatedMinageRows,
      consolidatedDeblayageRows,
      consolidatedExtractionRows,
      consolidatedMaintenanceRows
    };
  };

  const metrics = getAggregatedData();

  // Score Calculations
  const minageRate = metrics.totalPlanMeterage > 0 ? (metrics.totalRealMeterage / metrics.totalPlanMeterage) * 100 : 100;
  const deblayageRate = metrics.totalPlanVolume > 0 ? (metrics.totalRealVolume / metrics.totalPlanVolume) * 100 : 100;
  const extractionRate = metrics.totalPlanWagons > 0 ? (metrics.totalRealWagons / metrics.totalPlanWagons) * 100 : 100;
  const maintenanceRate = metrics.totalPlanMaintHours > 0 ? (metrics.totalRealMaintHours / metrics.totalPlanMaintHours) * 100 : 100;
  const presenceRate = metrics.planPresence > 0 ? (metrics.realPresence / metrics.planPresence) * 100 : 100;

  // Global Weighted Score
  const globalWeightedScore = (
    Math.min(100, minageRate) * 0.40 +
    Math.min(100, deblayageRate) * 0.20 +
    Math.min(100, extractionRate) * 0.30 +
    Math.min(100, maintenanceRate) * 0.10
  );

  // Efficency level determination
  let efficiencyBadge = 'ZONE CRITIQUE';
  let efficiencyColor = 'text-red-700 bg-red-50 border-red-200';
  let efficiencyRingColor = '#dc2626';

  if (globalWeightedScore >= 100) {
    efficiencyBadge = 'SUR-PERFORMANCE';
    efficiencyColor = 'text-emerald-800 bg-emerald-50 border-emerald-200';
    efficiencyRingColor = '#16a34a';
  } else if (globalWeightedScore >= 95) {
    efficiencyBadge = 'OBJECTIFS ATTEINTS';
    efficiencyColor = 'text-amber-800 bg-amber-50 border-amber-200';
    efficiencyRingColor = '#b8860b';
  }

  // Explosive Specific Consumptions
  const realExpTotal = metrics.totalRealAnfo + metrics.totalRealTovex;
  const planExpTotal = metrics.totalPlanAnfo + metrics.totalPlanTovex;
  const realSpecificExp = metrics.totalRealMeterage > 0 ? realExpTotal / metrics.totalRealMeterage : 0;
  const planSpecificExp = metrics.totalPlanMeterage > 0 ? planExpTotal / metrics.totalPlanMeterage : 0;
  const expVariancePct = planSpecificExp > 0 ? ((realSpecificExp - planSpecificExp) / planSpecificExp) * 100 : 0;

  // Dynamic colors helper
  const getPerformanceColor = (pct: number) => {
    if (pct >= 100) return 'text-emerald-600 bg-emerald-50 border-emerald-100 bar-emerald';
    if (pct >= 80) return 'text-amber-600 bg-amber-50 border-amber-100 bar-amber';
    return 'text-red-600 bg-red-50 border-red-100 bar-red';
  };

  const getPerformanceBarColor = (pct: number) => {
    if (pct >= 100) return 'bg-emerald-500';
    if (pct >= 80) return 'bg-amber-500';
    return 'bg-red-500';
  };

  // AUTOMATIC ALERTS DETECTION
  const getAutomaticAlerts = () => {
    const list: { type: 'red' | 'amber' | 'blue'; message: string; sub: string }[] = [];

    // RED ALERTS: Minage Yield < 1.3 m/volée OR Specific Explosive > +20%
    metrics.consolidatedMinageRows.forEach(row => {
      const r = row.reel || row;
      const chantier = getChantierName(r.chantierId);
      const yields = r.realRounds > 0 ? r.realMeterage / r.realRounds : 0;
      if (r.realRounds > 0 && yields < 1.3) {
        list.push({
          type: 'red',
          message: `Rendement Forage critique : ${yields.toFixed(2)} m/v sur ${chantier}`,
          sub: `${row.poste} • Mineur : ${getPersonnelName(r.minerMatricule) || r.minerMatricule}`
        });
      }

      // Explosives overconsumption check
      const rowExpReal = Number(r.anfo || 0) + Number(r.tovex || 0);
      const plan = row.plan || {};
      const rowExpPlan = Number(plan.anfo || 0) + Number(plan.tovex || 0);
      
      const realSpecific = Number(r.realMeterage || 0) > 0 ? rowExpReal / r.realMeterage : 0;
      const planSpecific = Number(plan.meterage || 0) > 0 ? rowExpPlan / plan.meterage : 0;

      if (planSpecific > 0 && realSpecific > planSpecific * 1.20) {
        const excess = ((realSpecific - planSpecific) / planSpecific) * 100;
        list.push({
          type: 'red',
          message: `Surconsommation Explosifs : +${excess.toFixed(0)}% sur ${chantier}`,
          sub: `Spécifique Réel : ${realSpecific.toFixed(1)} kg/m vs Plan : ${planSpecific.toFixed(1)} kg/m`
        });
      }
    });

    // AMBER ALERTS: Presence < 90% OR Deblayage Engine volume < 80% planified
    const presenceRate = metrics.planPresence > 0 ? (metrics.realPresence / metrics.planPresence) * 100 : 100;
    if (presenceRate < 90) {
      list.push({
        type: 'amber',
        message: `Taux de présence critique : ${presenceRate.toFixed(1)}%`,
        sub: `${metrics.realPresence} agents présents sur ${metrics.planPresence} planifiés`
      });
    }

    metrics.consolidatedDeblayageRows.forEach(row => {
      const r = row.reel || row;
      const plan = row.plan || {};
      const planVol = plan.volumeEstimated || 0;
      const realVol = r.volumeEstimated || 0;

      if (planVol > 0 && (realVol / planVol) < 0.8) {
        const rate = (realVol / planVol) * 100;
        list.push({
          type: 'amber',
          message: `Sous-performance déblayage : ${rate.toFixed(0)}% sur engin ${r.engineCode || r.engineId || 'LHD'}`,
          sub: `${row.poste} • Chantier : ${getChantierName(r.chantierId)} • Réalisé : ${realVol} m³ vs Plan : ${planVol} m³`
        });
      }
    });

    // BLUE ALERTS: Maintenance intervention > 4 hours
    metrics.consolidatedMaintenanceRows.forEach(row => {
      const r = row.reel || row;
      if (Number(r.hoursSpent || 0) > 4) {
        list.push({
          type: 'blue',
          message: `Intervention technique majeure : ${r.hoursSpent}h sur ${r.engineCode || r.engineId || 'LHD'}`,
          sub: `${row.poste} • Intervenant : ${getPersonnelName(r.agentMatricule || r.mechanicMatricule)} • Travaux : ${r.workDescription || 'N/A'}`
        });
      }
    });

    return list;
  };

  const currentAlerts = getAutomaticAlerts();

  // Recharts Chart Dataset mapping for Month Mode
  const getChartData = () => {
    if (reportType !== 'month') return [];

    try {
      const start = startOfMonth(parseISO(filterMonth + '-01'));
      const end = endOfMonth(start);
      const days = eachDayOfInterval({ start, end });
      
      return days.map(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const prevDateStr = getPreviousDateStr(dateStr);
        const pDoc = allProductionDocs.find(d => d.id === dateStr);
        const sDoc = allPlanningSheets.find(d => d.id === prevDateStr);

        let realMet = 0;
        let planMet = 0;
        let realWag = 0;
        let planWag = 0;

        if (pDoc && pDoc.postes) {
          ['poste1', 'poste2', 'poste3'].forEach(pKey => {
            (pDoc.postes[pKey]?.minage || []).forEach((r: any) => {
              const sector = getRecordSectorGroup(r);
              if (isTargetSector(sector)) {
                realMet += Number(r.reel?.realMeterage || r.realMeterage || 0);
              }
            });
            (pDoc.postes[pKey]?.extraction || []).forEach((r: any) => {
              realWag += Number(r.reel?.wagonsActual || r.wagonsActual || 0);
            });
          });
        }

        if (sDoc && sDoc.postes) {
          ['poste1', 'poste2', 'poste3'].forEach(pKey => {
            (sDoc.postes[pKey]?.minage || []).forEach((r: any) => {
              const sector = getRecordSectorGroup(r);
              if (isTargetSector(sector)) {
                planMet += Number(r.meterage || r.plannedRounds * 1.7 || 0);
              }
            });
            (sDoc.postes[pKey]?.extraction || []).forEach((r: any) => {
              planWag += Number(r.wagonsTarget || 48);
            });
          });
        }

        return {
          day: format(day, 'dd'),
          realMeterage: Number(realMet.toFixed(1)),
          planMeterage: Number(planMet.toFixed(1)),
          realWagons: realWag,
          planWagons: planWag
        };
      });
    } catch (e) {
      return [];
    }
  };

  const chartData = getChartData();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 bg-white">
        <Workflow className="w-12 h-12 text-[#b8860b] animate-spin mb-4" />
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Chargement de l'analyse...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 font-sans bg-white p-2 sm:p-4 rounded-3xl">
      
      {/* SECTION 1 — BANNER HEADER */}
      <div 
        id="analyse-dashboard-header" 
        className="bg-white p-6 md:p-8 border border-gray-150 rounded-[20px] w-full shadow-xs"
        style={{ boxShadow: '0 4px 24px -2px rgba(184, 134, 11, 0.05)' }}
      >
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          {/* Logo with clean hover scaling */}
          <div className="shrink-0 flex items-center justify-center self-center">
            <img 
              src={logoImg} 
              alt="HydroMines Logo" 
              className="h-28 w-28 md:h-32 md:w-32 object-contain hover:scale-105 transition-transform duration-300 select-none rounded-2xl" 
              referrerPolicy="no-referrer" 
            />
          </div>

          {/* Centered Premium Title Segment */}
          <div className="flex-1 flex flex-col items-center text-center space-y-3 w-full">
            <div className="subtle-glow-line w-3/4 opacity-60" />
            <h1 className="gold-title text-[16px] sm:text-xl md:text-[23px] tracking-[0.08em] font-black leading-none py-1">
              TABLEAU DE BORD JOURNALIER
            </h1>
            <div className="subtle-glow-line w-3/4 opacity-60" />
            <p className="uppercase tracking-[0.2em] text-[8.5px] sm:text-[9.5px] font-bold text-slate-500">
              SMI HydroMines • Unité de Pilotage Clinique & Analytique
            </p>
          </div>

          {/* Mode Selector and Date pickers */}
          <div className="shrink-0 flex flex-col items-center lg:items-end gap-3.5 w-full lg:w-auto">
            <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200/50 w-full max-w-xs sm:max-w-none">
              <button
                type="button"
                onClick={() => setReportType('day')}
                className={`flex-1 text-[9.5px] font-black uppercase py-2 px-4 rounded-lg transition-all cursor-pointer ${
                  reportType === 'day'
                    ? 'bg-[#b8860b] text-white shadow-xs'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                📅 Quotidien
              </button>
              <button
                type="button"
                onClick={() => setReportType('month')}
                className={`flex-1 text-[9.5px] font-black uppercase py-2 px-4 rounded-lg transition-all cursor-pointer ${
                  reportType === 'month'
                    ? 'bg-[#b8860b] text-white shadow-xs'
                    : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                📊 Mensuel
              </button>
            </div>

            <div className="inline-flex items-center gap-2 bg-amber-50/40 border border-amber-100/60 px-3 py-1.5 rounded-xl w-full max-w-xs sm:max-w-none justify-center">
              <Calendar className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-[10px] font-black uppercase text-[#b8860b]">
                {reportType === 'day' ? 'Journée :' : 'Mois :'}
              </span>
              {reportType === 'day' ? (
                <input 
                  type="date" 
                  value={filterDate}
                  onChange={e => setFilterDate(e.target.value)}
                  className="text-xs font-black uppercase text-slate-900 outline-none cursor-pointer bg-white border border-amber-200/60 rounded-lg px-2 py-0.5 outline-[#b8860b]/30"
                />
              ) : (
                <input 
                  type="month" 
                  value={filterMonth}
                  onChange={e => setFilterMonth(e.target.value)}
                  className="text-xs font-black uppercase text-slate-900 outline-none cursor-pointer bg-white border border-amber-200/60 rounded-lg px-2 py-0.5 outline-[#b8860b]/30"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2 — GRILLE DE KPI CARDS */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        
        {/* KPI 1 — Score de Réalisation Global */}
        <div className="bg-white border border-gray-150 rounded-2xl p-4 md:p-5 shadow-xs hover:shadow-md transition-all relative flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-2">
              <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">1. Efficacité Globale</span>
              <span className={`px-1.5 py-0.5 border text-[7.5px] font-black uppercase rounded ${efficiencyColor}`}>
                {efficiencyBadge}
              </span>
            </div>
            
            <div className="flex items-center gap-3.5 my-3">
              {/* Simple SVG Circular Progress Ring */}
              <div className="relative w-14 h-14 shrink-0">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="28" cy="28" r="24" className="stroke-slate-100" strokeWidth="4" fill="transparent" />
                  <circle 
                    cx="28" 
                    cy="28" 
                    r="24" 
                    stroke={efficiencyRingColor} 
                    strokeWidth="4" 
                    fill="transparent" 
                    strokeDasharray={150.7} 
                    strokeDashoffset={150.7 - (150.7 * Math.min(100, globalWeightedScore)) / 100}
                    className="transition-all duration-500 ease-out"
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-black text-slate-800">{globalWeightedScore.toFixed(0)}%</span>
                </div>
              </div>
              <div>
                <span className="text-2xl font-black text-slate-800 leading-none">{globalWeightedScore.toFixed(1)}%</span>
                <span className="text-[9px] text-slate-400 block mt-1 uppercase">Moyenne Pondérée</span>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-100 pt-2.5 mt-2">
            <span className="text-[8.5px] text-slate-500 font-bold block uppercase leading-none">Min: 40% | Deb: 20% | Ext: 30% | Tech: 10%</span>
          </div>
        </div>

        {/* KPI 2 — Métrage total réalisé */}
        <div className="bg-white border border-gray-150 rounded-2xl p-4 md:p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-2">
              <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">2. Métrage Minage</span>
              <span className="text-amber-600"><Hammer className="w-4 h-4" /></span>
            </div>
            <div className="my-2.5">
              <span className="text-2xl font-black text-slate-800 leading-none">{metrics.totalRealMeterage.toFixed(1)} m</span>
              <span className="text-[9px] text-slate-400 font-bold uppercase block mt-0.5">Cible : {metrics.totalPlanMeterage.toFixed(1)} m</span>
            </div>
            {/* Horizontal progress bar */}
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2.5 overflow-hidden">
              <div 
                className={`h-full ${getPerformanceBarColor(minageRate)} transition-all duration-500`}
                style={{ width: `${Math.min(100, minageRate)}%` }}
              />
            </div>
          </div>
          <div className="border-t border-gray-100 pt-2 mt-2.5 flex justify-between items-center text-[9px]">
            <span className="text-slate-500 font-bold uppercase leading-none">Rendement : {minageRate.toFixed(0)}%</span>
            <span className="font-mono text-slate-500 leading-none">
              {metrics.totalRealRounds}/{metrics.totalPlanRounds} Vol.
            </span>
          </div>
        </div>

        {/* KPI 3 — Consommation Spécifique Explosifs */}
        <div className="bg-white border border-gray-150 rounded-2xl p-4 md:p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-2">
              <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">3. Indice Explosifs</span>
              <span className="text-rose-600"><Bomb className="w-4 h-4" /></span>
            </div>
            <div className="my-2.5">
              <span className="text-2xl font-black text-slate-800 leading-none">{realSpecificExp.toFixed(2)} <span className="text-xs font-bold text-slate-400">kg/m</span></span>
              <span className="text-[9px] text-slate-400 font-bold uppercase block mt-0.5">Plan : {planSpecificExp.toFixed(2)} kg/m</span>
            </div>
            {/* Variance Badge */}
            <div className="mt-2 flex items-center gap-1.5">
              {expVariancePct > 0 ? (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[8.5px] font-black rounded bg-rose-50 text-rose-700 border border-rose-200 uppercase leading-none">
                  <TrendingUp className="w-2.5 h-2.5" /> +{expVariancePct.toFixed(0)}% Écart (Surconso)
                </span>
              ) : (
                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[8.5px] font-black rounded bg-emerald-50 text-emerald-800 border border-emerald-250 uppercase leading-none">
                  <TrendingDown className="w-2.5 h-2.5" /> {expVariancePct.toFixed(0)}% Écart (Optimum)
                </span>
              )}
            </div>
          </div>
          <div className="border-t border-gray-100 pt-2.5 mt-2 text-[9px] text-slate-500 font-bold uppercase leading-none">
            Total : {realExpTotal.toFixed(0)} kg réels
          </div>
        </div>

        {/* KPI 4 — Rendement Forage */}
        <div className="bg-white border border-gray-150 rounded-2xl p-4 md:p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-2">
              <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">4. Rendement Forage</span>
              <span className="text-cyan-600"><Gauge className="w-4 h-4" /></span>
            </div>
            <div className="my-2.5">
              <span className="text-2xl font-black text-slate-800 leading-none">
                {metrics.totalRealRounds > 0 ? (metrics.totalRealMeterage / metrics.totalRealRounds).toFixed(2) : '0.00'} 
                <span className="text-xs font-bold text-slate-400"> m/v</span>
              </span>
              <span className="text-[9px] text-slate-400 font-bold uppercase block mt-0.5">
                Plan : {metrics.totalPlanRounds > 0 ? (metrics.totalPlanMeterage / metrics.totalPlanRounds).toFixed(2) : '0.00'} m/v
              </span>
            </div>
            {/* Horizonal badge coloring */}
            <div className="mt-2.5">
              {(metrics.totalRealRounds > 0 && (metrics.totalRealMeterage / metrics.totalRealRounds) >= 1.5) ? (
                <span className="inline-flex px-1.5 py-0.5 text-[8px] font-black bg-emerald-50 text-emerald-800 border border-emerald-250 rounded uppercase">Rendement Performant</span>
              ) : (metrics.totalRealRounds > 0 && (metrics.totalRealMeterage / metrics.totalRealRounds) <= 1.3) ? (
                <span className="inline-flex px-1.5 py-0.5 text-[8px] font-black bg-rose-50 text-rose-800 border border-rose-200 rounded uppercase animate-pulse">Forage Sous-KPI</span>
              ) : (
                <span className="inline-flex px-1.5 py-0.5 text-[8px] font-black bg-slate-50 text-slate-500 border border-slate-200 rounded uppercase">Rendement Standard</span>
              )}
            </div>
          </div>
          <div className="border-t border-gray-100 pt-2.5 mt-2 text-[9px] text-slate-500 font-bold uppercase leading-none">
            Sur un total de {metrics.totalRealRounds} volées
          </div>
        </div>

        {/* KPI 5 — Volume déblayage total */}
        <div className="bg-white border border-gray-150 rounded-2xl p-4 md:p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-2">
              <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">5. Volume Déblayé</span>
              <span className="text-sky-600"><Tractor className="w-4 h-4" /></span>
            </div>
            <div className="my-2.5">
              <span className="text-2xl font-black text-slate-800 leading-none">{metrics.totalRealVolume.toFixed(1)} m³</span>
              <span className="text-[9px] text-slate-400 font-bold uppercase block mt-0.5">Plan : {metrics.totalPlanVolume.toFixed(1)} m³</span>
            </div>
            {/* Horizontal Progress */}
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2.5 overflow-hidden">
              <div 
                className={`h-full ${getPerformanceBarColor(deblayageRate)} transition-all duration-500`}
                style={{ width: `${Math.min(100, deblayageRate)}%` }}
              />
            </div>
          </div>
          <div className="border-t border-gray-100 pt-2 mt-2.5 flex justify-between items-center text-[9px] text-slate-500 font-bold uppercase leading-none">
            <span>Taux : {deblayageRate.toFixed(0)}%</span>
            <span className="font-mono">{metrics.totalDeblayageGasoil} L Gasoil</span>
          </div>
        </div>

        {/* KPI 6 — Wagons extraits */}
        <div className="bg-white border border-gray-150 rounded-2xl p-4 md:p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-2">
              <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">6. Extraction Bure N340</span>
              <span className="text-emerald-600"><Train className="w-4 h-4" /></span>
            </div>
            <div className="my-2.5">
              <span className="text-2xl font-black text-slate-800 leading-none">{metrics.totalRealWagons} <span className="text-xs font-bold text-slate-400">wagons</span></span>
              <span className="text-[9px] text-slate-400 font-bold uppercase block mt-0.5">Objectif : {metrics.totalPlanWagons} wagons</span>
            </div>
            {/* Progress Bar */}
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2.5 overflow-hidden">
              <div 
                className={`h-full ${getPerformanceBarColor(extractionRate)} transition-all duration-500`}
                style={{ width: `${Math.min(100, extractionRate)}%` }}
              />
            </div>
          </div>
          <div className="border-t border-gray-100 pt-2 mt-2.5 flex justify-between items-center text-[9px] text-slate-500 font-bold uppercase leading-none">
            <span>Taux : {extractionRate.toFixed(0)}%</span>
            <span>Stérile : {metrics.totalRealSterile} Wg</span>
          </div>
        </div>

        {/* KPI 7 — Taux de présence équipes */}
        <div className="bg-white border border-gray-150 rounded-2xl p-4 md:p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-2">
              <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">7. Présence Équipe</span>
              <span className="text-purple-600"><HardHat className="w-4 h-4" /></span>
            </div>
            <div className="my-2.5">
              <span className="text-2xl font-black text-slate-800 leading-none">
                {presenceRate.toFixed(0)}%
              </span>
              <span className="text-[9px] text-slate-400 font-bold uppercase block mt-0.5">
                {metrics.realPresence} Réels vs {metrics.planPresence} Planifiés
              </span>
            </div>
            {/* Horizonal progress bar */}
            <div className="w-full bg-slate-100 h-1.5 rounded-full mt-2.5 overflow-hidden">
              <div 
                className={`h-full ${getPerformanceBarColor(presenceRate)} transition-all duration-500`}
                style={{ width: `${Math.min(100, presenceRate)}%` }}
              />
            </div>
          </div>
          <div className="border-t border-gray-100 pt-2 mt-2.5 text-[9px] text-slate-500 font-bold uppercase leading-none">
            {metrics.realPresence} agents opérationnels détectés
          </div>
        </div>

        {/* KPI 8 — Rendement wagons/heure */}
        <div className="bg-white border border-gray-150 rounded-2xl p-4 md:p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-start mb-2">
              <span className="text-[9.5px] font-bold text-slate-400 uppercase tracking-wider block">8. Cadence Extraction</span>
              <span className="text-indigo-600"><Clock className="w-4 h-4" /></span>
            </div>
            <div className="my-2.5">
              <span className="text-2xl font-black text-slate-800 leading-none">
                {metrics.totalExtractionHours > 0 ? (metrics.totalRealWagons / metrics.totalExtractionHours).toFixed(1) : '0.0'} 
                <span className="text-xs font-bold text-slate-400"> wg/h</span>
              </span>
              <span className="text-[9px] text-slate-400 font-bold uppercase block mt-0.5">
                Total heures réelles : {metrics.totalExtractionHours.toFixed(1)} h
              </span>
            </div>
            <div className="mt-2.5">
              <span className="inline-flex items-center gap-1 bg-slate-50 text-slate-500 border border-slate-200 text-[8.5px] font-black uppercase px-2 py-0.5 rounded">
                Tonnage estimé : {(metrics.totalRealWagons * 1.4).toFixed(1)} T
              </span>
            </div>
          </div>
          <div className="border-t border-gray-100 pt-2.5 mt-2 text-[9px] text-slate-500 font-bold uppercase leading-none">
            Densité : 1.4 t par wagon
          </div>
        </div>

      </div>

      {/* RECHARTS VISUALIZATION IN MONTHLY MODE */}
      {reportType === 'month' && chartData.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-gray-150 rounded-3xl p-6 shadow-xs"
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
            <div>
              <span className="text-[#b8860b] text-[10px] font-black tracking-widest uppercase block mb-1">Graphiques Temporels</span>
              <h3 className="text-sm font-black uppercase text-slate-800 tracking-tight">Courbe de Performance de Minage (Avancement en Mètres)</h3>
            </div>
            <div className="flex gap-4 text-[10px] font-black uppercase">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-amber-500 rounded-sm" /> Réel</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 bg-slate-300 rounded-sm" /> Plan</span>
            </div>
          </div>
          
          <div className="h-72 w-full font-mono text-[9px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorReal" cx="0" cy="0" r="1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#b8860b" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#b8860b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="day" tickLine={false} stroke="#94a3b8" />
                <YAxis tickLine={false} stroke="#94a3b8" unit="m" />
                <Tooltip 
                  contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '12px', color: '#f8fafc', fontSize: '10px' }}
                  labelFormatter={(val) => `Jour ${val}`}
                />
                <Area type="monotone" dataKey="realMeterage" name="Métrage Réel" stroke="#b8860b" strokeWidth={2.5} fillOpacity={1} fill="url(#colorReal)" />
                <Area type="monotone" dataKey="planMeterage" name="Métrage Plan" stroke="#cbd5e1" strokeWidth={1.5} strokeDasharray="4 4" fill="none" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {/* SECTION 3 — DÉTAIL MINAGE PAR SECTEUR ET PAR POSTE */}
      <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-gray-150 pb-4 gap-4">
          <div>
            <span className="text-[#b8860b] text-[10.5px] font-black tracking-widest uppercase block mb-1">FORAGE & MINAGE</span>
            <h2 className="text-base font-black uppercase text-slate-800 tracking-tight">Détail des Tirées par Secteur et par Poste</h2>
          </div>
          <span className="text-[10px] text-slate-400 font-bold uppercase">Secteurs Cibles : Imiter 2 • Imiter 1 • Imiter Est</span>
        </div>

        {/* Sectors Performance Mini-cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card Imiter 2 */}
          <div className="border border-red-150 bg-red-50/20 p-4 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-red-800 text-[10.5px] font-black uppercase tracking-wider block">Secteur Imiter 2</span>
                <span className="w-2.5 h-2.5 bg-red-600 rounded-full animate-pulse" />
              </div>
              <div className="my-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-800">{metrics.sectorBreakdown.imiter2.realMet.toFixed(1)} m</span>
                <span className="text-xs text-slate-500 font-bold uppercase">/ {metrics.sectorBreakdown.imiter2.planMet.toFixed(1)} m</span>
              </div>
            </div>
            <div className="border-t border-red-100/50 pt-2.5 mt-2 flex justify-between items-center text-[10px]">
              <span className="text-red-750 font-bold uppercase">Taux : {metrics.sectorBreakdown.imiter2.planMet > 0 ? ((metrics.sectorBreakdown.imiter2.realMet / metrics.sectorBreakdown.imiter2.planMet) * 100).toFixed(0) : '100'}%</span>
              <span className="text-slate-500 font-medium">Chef : {reportType === 'day' ? (metrics.consolidatedMinageRows.find(r => r.sectorGroup?.toLowerCase() === 'imiter 2')?.chiefName || 'Non défini') : 'Multiples'}</span>
            </div>
          </div>

          {/* Card Imiter 1 */}
          <div className="border border-sky-150 bg-sky-50/20 p-4 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-sky-800 text-[10.5px] font-black uppercase tracking-wider block">Secteur Imiter 1</span>
                <span className="w-2.5 h-2.5 bg-sky-500 rounded-full" />
              </div>
              <div className="my-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-800">{metrics.sectorBreakdown.imiter1.realMet.toFixed(1)} m</span>
                <span className="text-xs text-slate-500 font-bold uppercase">/ {metrics.sectorBreakdown.imiter1.planMet.toFixed(1)} m</span>
              </div>
            </div>
            <div className="border-t border-sky-100/50 pt-2.5 mt-2 flex justify-between items-center text-[10px]">
              <span className="text-sky-750 font-bold uppercase">Taux : {metrics.sectorBreakdown.imiter1.planMet > 0 ? ((metrics.sectorBreakdown.imiter1.realMet / metrics.sectorBreakdown.imiter1.planMet) * 100).toFixed(0) : '100'}%</span>
              <span className="text-slate-500 font-medium">Chef : {reportType === 'day' ? (metrics.consolidatedMinageRows.find(r => r.sectorGroup?.toLowerCase() === 'imiter 1')?.chiefName || 'Non défini') : 'Multiples'}</span>
            </div>
          </div>

          {/* Card Imiter Est */}
          <div className="border border-teal-150 bg-teal-50/20 p-4 rounded-2xl flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-teal-800 text-[10.5px] font-black uppercase tracking-wider block">Secteur Imiter Est</span>
                <span className="w-2.5 h-2.5 bg-teal-500 rounded-full" />
              </div>
              <div className="my-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-slate-800">{metrics.sectorBreakdown.imiterEst.realMet.toFixed(1)} m</span>
                <span className="text-xs text-slate-500 font-bold uppercase">/ {metrics.sectorBreakdown.imiterEst.planMet.toFixed(1)} m</span>
              </div>
            </div>
            <div className="border-t border-teal-100/50 pt-2.5 mt-2 flex justify-between items-center text-[10px]">
              <span className="text-teal-750 font-bold uppercase">Taux : {metrics.sectorBreakdown.imiterEst.planMet > 0 ? ((metrics.sectorBreakdown.imiterEst.realMet / metrics.sectorBreakdown.imiterEst.planMet) * 100).toFixed(0) : '100'}%</span>
              <span className="text-slate-500 font-medium">Chef : {reportType === 'day' ? (metrics.consolidatedMinageRows.find(r => r.sectorGroup?.toLowerCase() === 'imiter est')?.chiefName || 'Non défini') : 'Multiples'}</span>
            </div>
          </div>

        </div>

        {/* Master Table - Separated strictly by sector */}
        <div className="overflow-x-auto border border-gray-150 rounded-2xl shadow-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white border-b-2 border-[#b8860b] text-[9.5px] font-black tracking-wider uppercase">
                <th className="p-3 text-center w-12 text-[#ffd700]">Poste</th>
                <th className="p-3">Galerie / Chantier</th>
                <th className="p-3">Mineur & Aide</th>
                <th className="p-3 text-center">Trous Forés</th>
                <th className="p-3 text-center">Cible (m)</th>
                <th className="p-3 text-center">Réalisé (m)</th>
                <th className="p-3 text-center">KPI Efficacité (m/v)</th>
                <th className="p-3 text-center">Consommation Explosifs</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-[10.5px] font-bold text-slate-700 bg-white">
              
              {/* Order 1: Imiter 2 */}
              {['imiter 2', 'imiter 1', 'imiter est'].map((secName) => {
                const rows = metrics.consolidatedMinageRows.filter(r => r.sectorGroup?.toLowerCase() === secName);
                if (rows.length === 0) return null;

                // Sector chief detection for day mode
                const sectorChief = reportType === 'day' ? (rows[0]?.chiefName || 'Chef non renseigné') : 'Multiples';

                return (
                  <React.Fragment key={secName}>
                    {/* Header line for sector with darker background */}
                    <tr className="bg-slate-100 border-y border-gray-250">
                      <td colSpan={8} className="px-4 py-2 text-slate-800 font-black text-[11px] uppercase tracking-wider">
                        📂 Secteur : <span className="text-[#b8860b]">{secName}</span> 
                        <span className="ml-6 text-slate-500 font-bold uppercase normal-case text-[9.5px]">
                          👤 Chef de Secteur : {sectorChief}
                        </span>
                      </td>
                    </tr>
                    
                    {rows.map((row, idx) => {
                      const reel = row.reel || {};
                      const plan = row.plan || {};
                      const rYield = reel.realRounds > 0 ? (reel.realMeterage / reel.realRounds) : 0;
                      
                      let statusBadge = 'bg-slate-50 text-slate-500 border-slate-200';
                      let statusText = 'NORMAL';
                      if (reel.realRounds > 0) {
                        if (rYield >= 1.5) {
                          statusBadge = 'bg-emerald-50 text-emerald-800 border-emerald-200';
                          statusText = 'PERFORMANT';
                        } else if (rYield <= 1.3) {
                          statusBadge = 'bg-rose-50 text-rose-800 border-rose-200 animate-pulse';
                          statusText = 'SOUS-KPI';
                        }
                      }

                      return (
                        <tr key={idx} className="hover:bg-amber-50/10 transition-colors">
                          <td className="p-3 text-center text-[#b8860b] font-black text-[10px] whitespace-nowrap bg-slate-50/20">{row.poste}</td>
                          <td className="p-3">
                            <span className="text-[11px] font-extrabold text-[#b8860b] uppercase block">
                              {getChantierName(reel.chantierId)}
                            </span>
                            <span className="text-[8.5px] text-slate-400 font-normal block">
                              Section : {reel.gallerySize || 12}m² • {reel.barType || '1.8m'}
                            </span>
                          </td>
                          <td className="p-3">
                            <span className="text-slate-800 font-extrabold block uppercase leading-none mb-1">
                              {getPersonnelName(reel.minerMatricule) || reel.minerMatricule || 'Non affecté'}
                            </span>
                            <span className="text-slate-400 text-[8.5px] font-bold block uppercase">
                              Aide : {getPersonnelName(reel.assistantMatricule) || reel.assistantMatricule || 'Aucun'}
                            </span>
                          </td>
                          <td className="p-3 text-center font-mono text-slate-700">{reel.realHoles || 0} trs / {plan.plannedHoles || 0}</td>
                          <td className="p-3 text-center font-mono text-slate-500 bg-slate-50/20">{(plan.meterage || plan.plannedRounds * 1.7 || 0).toFixed(1)} m</td>
                          <td className="p-3 text-center font-mono text-slate-800 bg-amber-50/10 text-[11px]">{(reel.realMeterage || 0).toFixed(1)} m</td>
                          <td className="p-3 text-center">
                            <span className={`inline-flex px-1.5 py-0.5 border text-[8px] font-black uppercase rounded ${statusBadge}`}>
                              {rYield > 0 ? `${rYield.toFixed(2)} m/v` : '0.00'} — {statusText}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="inline-grid grid-cols-2 gap-x-2 gap-y-0.5 font-mono text-[8.5px] uppercase border border-gray-100 p-1 bg-gray-50/50 rounded">
                              <span className="text-rose-700 font-bold" title="ANFO kg">ANF: {reel.anfo || 0}</span>
                              <span className="text-cyan-700 font-bold" title="TOVEX kg">TOV: {reel.tovex || 0}</span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}

            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 4 — DÉBLAYAGE PAR ENGIN */}
      <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-xs space-y-6">
        <div>
          <span className="text-[#b8860b] text-[10.5px] font-black tracking-widest uppercase block mb-1">DÉBLAYAGE ET CHARGE</span>
          <h2 className="text-base font-black uppercase text-slate-800 tracking-tight">Efficacité des Chargeuses LHD</h2>
        </div>

        <div className="overflow-x-auto border border-gray-150 rounded-2xl shadow-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white border-b-2 border-sky-500 text-[9.5px] font-black tracking-wider uppercase">
                <th className="p-3 text-center w-12">Poste</th>
                <th className="p-3">Code Engin LHD</th>
                <th className="p-3">Chantier / Galerie</th>
                <th className="p-3">Conducteur de l'Engin</th>
                <th className="p-3 text-center">Godets</th>
                <th className="p-3 text-center">Volume Estimé</th>
                <th className="p-3 text-center">Volume Réel</th>
                <th className="p-3 text-center">Cadence Réelle</th>
                <th className="p-3 text-center">Gasoil</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-[10.5px] font-bold text-slate-700 bg-white">
              {metrics.consolidatedDeblayageRows.map((row, idx) => {
                const reel = row.reel || {};
                const plan = row.plan || {};
                
                const duration = getDurationInHours(reel.startTime || '06:00', reel.endTime || '14:00');
                const realVol = Number(reel.volumeEstimated || 0);
                const planVol = Number(plan.volumeEstimated || 0);
                const yieldVolH = duration > 0 ? (realVol / duration) : 0;

                // Border coloring based on yield rate
                let yieldBorder = 'border-l-4 border-l-amber-500 bg-amber-50/10';
                let badgeStyle = 'bg-amber-50 text-amber-800 border-amber-200';
                if (yieldVolH > 15) {
                  yieldBorder = 'border-l-4 border-l-emerald-500 bg-emerald-50/10';
                  badgeStyle = 'bg-emerald-50 text-emerald-800 border-emerald-250';
                } else if (yieldVolH < 10) {
                  yieldBorder = 'border-l-4 border-l-rose-500 bg-rose-50/10';
                  badgeStyle = 'bg-rose-50 text-rose-800 border-rose-200 animate-pulse';
                }

                return (
                  <tr key={idx} className={`hover:bg-sky-50/10 transition-colors ${yieldBorder}`}>
                    <td className="p-3 text-center text-sky-700 font-black text-[10px] whitespace-nowrap bg-slate-50/10">{row.poste}</td>
                    <td className="p-3">
                      <span className="font-mono font-extrabold bg-slate-100 text-slate-800 border border-slate-200 px-2 py-0.5 rounded text-[10px]">
                        {reel.engineCode || reel.engineId || 'LHD'}
                      </span>
                    </td>
                    <td className="p-3 font-extrabold text-[#b8860b] uppercase">
                      {getChantierName(reel.chantierId)}
                    </td>
                    <td className="p-3 text-slate-800 uppercase font-bold">
                      {getPersonnelName(reel.driverMatricule) || reel.driverMatricule || 'Non assigné'}
                    </td>
                    <td className="p-3 text-center font-mono">{reel.godets || 0}</td>
                    <td className="p-3 text-center font-mono text-slate-400">{planVol.toFixed(1)} m³</td>
                    <td className="p-3 text-center font-mono text-slate-900 bg-emerald-50/20">{realVol.toFixed(1)} m³</td>
                    <td className="p-3 text-center whitespace-nowrap">
                      <span className={`inline-flex px-1.5 py-0.5 border text-[8.5px] font-black rounded uppercase ${badgeStyle}`}>
                        {yieldVolH.toFixed(1)} m³/h
                      </span>
                    </td>
                    <td className="p-3 text-center font-mono text-amber-600">{reel.gasoil || 0} L</td>
                  </tr>
                );
              })}
              {metrics.consolidatedDeblayageRows.length === 0 && (
                <tr>
                  <td colSpan={9} className="p-6 text-center text-slate-400 font-bold uppercase text-[9.5px]">Aucune intervention de déblayage détectée</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 5 — EXTRACTION BURE N340 IMITER EST */}
      <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-xs space-y-6">
        <div>
          <span className="text-[#b8860b] text-[10.5px] font-black tracking-widest uppercase block mb-1">EXTRACTION & TREUIL</span>
          <h2 className="text-base font-black uppercase text-slate-800 tracking-tight">Performance au Bure N340 Imiter Est</h2>
        </div>

        {/* 3 mini cards for P1, P2, P3 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {['Poste 1', 'Poste 2', 'Poste 3'].map((pKey) => {
            const row = metrics.consolidatedExtractionRows.find(r => r.poste === pKey);
            const reel = row?.reel || {};
            const plan = row?.plan || {};

            const actW = Number(reel.wagonsActual || row?.wagonsActual || 0);
            const targetW = Number(reel.wagonsTarget || plan.wagonsTarget || 48);
            const rate = targetW > 0 ? (actW / targetW) * 100 : 0;
            const sterile = Number(reel.sterileBureImiterEst || row?.sterileBureImiterEst || 0);

            // Operators listing
            const operators = [
              reel.treuilliste,
              reel.equipier1,
              reel.equipier2,
              reel.equipier3,
              reel.equipier4
            ].filter(Boolean);

            return (
              <div key={pKey} className="border border-gray-150 rounded-2xl p-4 md:p-5 flex flex-col justify-between hover:shadow-sm transition-all bg-white relative">
                <div>
                  <div className="flex justify-between items-center border-b border-gray-100 pb-2 mb-3">
                    <span className="text-[11px] font-black uppercase text-slate-800 tracking-wider">{pKey}</span>
                    <span className={`inline-flex px-1.5 py-0.5 text-[8px] font-black rounded uppercase ${getPerformanceColor(rate)}`}>
                      {rate.toFixed(0)}% Accomplis
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-baseline mb-3.5">
                    <div>
                      <span className="text-2xl font-black text-slate-900 leading-none">{actW} <span className="text-[11px] font-bold text-slate-400">wagons</span></span>
                      <span className="text-[9px] text-slate-400 block font-bold uppercase mt-1">Objectif de rotation : {targetW} wg</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-black text-[#b8860b] block">{sterile} Wg</span>
                      <span className="text-[8.5px] text-slate-400 uppercase font-bold">Stérile tiré</span>
                    </div>
                  </div>

                  {/* Operational Crew listing */}
                  <div className="space-y-1 bg-slate-50/50 p-2 rounded-xl border border-gray-100/50">
                    <span className="text-[8.5px] text-slate-400 font-extrabold uppercase block mb-1">Brigade d'extraction :</span>
                    {operators.length > 0 ? (
                      operators.map((op, oIdx) => (
                        <span key={oIdx} className="text-[9px] font-bold text-slate-700 uppercase block truncate">
                          {oIdx === 0 ? '⚓ ' : '👥 '} {getPersonnelName(op)}
                        </span>
                      ))
                    ) : (
                      <span className="text-[8.5px] text-slate-400 font-bold block">Aucun agent affecté</span>
                    )}
                  </div>
                </div>

                <div className="w-full bg-slate-100 h-1 rounded-full mt-4 overflow-hidden">
                  <div className={`h-full ${getPerformanceBarColor(rate)}`} style={{ width: `${Math.min(100, rate)}%` }} />
                </div>
              </div>
            );
          })}
        </div>

        {/* Grand Bandeau Récapitulatif */}
        <div 
          className="bg-[#0f172a] text-white p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden shadow-xs border border-gray-800"
        >
          {/* Subtle decoration */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#b8860b]/5 rounded-full blur-3xl" />
          
          <div className="space-y-2">
            <span className="text-[9.5px] font-black uppercase text-[#ffd700] tracking-widest block">Bilan Extraction Consolide</span>
            <h3 className="text-lg font-black uppercase tracking-tight">Total Tonnage & Wagons de la Période</h3>
            <p className="text-[10px] text-slate-400 font-bold">Consolidation du tonnage estimé chargé au Bure N340 d'Imiter Est.</p>
          </div>

          <div className="flex flex-wrap gap-6 shrink-0 justify-center text-center">
            
            <div className="px-4 py-2 bg-slate-800/60 rounded-xl border border-slate-700/50 min-w-[90px]">
              <span className="text-xl font-black text-white block">{metrics.totalRealWagons}</span>
              <span className="text-[8px] text-slate-400 font-extrabold uppercase">Wagons Réels</span>
            </div>

            <div className="px-4 py-2 bg-slate-800/60 rounded-xl border border-slate-700/50 min-w-[90px]">
              <span className="text-xl font-black text-[#ffd700] block">{(metrics.totalRealWagons * 1.4).toFixed(1)} t</span>
              <span className="text-[8px] text-[#ffd700] font-extrabold uppercase">Tonnage Estimé</span>
            </div>

            <div className="px-4 py-2 bg-slate-800/60 rounded-xl border border-slate-700/50 min-w-[90px]">
              <span className="text-xl font-black text-teal-400 block">{metrics.totalRealSterile} Wg</span>
              <span className="text-[8px] text-slate-400 font-extrabold uppercase">Stérile Total</span>
            </div>

          </div>
        </div>
      </div>

      {/* SECTION 6 — ALERTES AUTOMATIQUES INTELLIGENTES */}
      <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-xs space-y-6">
        <div>
          <span className="text-[#b8860b] text-[10.5px] font-black tracking-widest uppercase block mb-1">DIAGNOSTIC TECHNIQUE</span>
          <h2 className="text-base font-black uppercase text-slate-800 tracking-tight">Anomalies & Alertes Automatiques Détectées</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Alerte Rouge Segment */}
          <div className="border border-red-150 rounded-2xl p-4 bg-red-50/15 flex flex-col space-y-3.5">
            <div className="flex items-center gap-2 border-b border-red-100 pb-2">
              <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse" />
              <span className="text-red-950 text-[10.5px] font-black uppercase tracking-wider">Alertes Rouges (Sévères)</span>
            </div>
            <div className="space-y-3 flex-1 overflow-y-auto max-h-[300px] custom-scrollbar">
              {currentAlerts.filter(a => a.type === 'red').map((alert, idx) => (
                <div key={idx} className="bg-white border border-red-100 rounded-xl p-3 flex gap-2.5 shadow-2xs">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-slate-800 font-extrabold block leading-normal">{alert.message}</span>
                    <span className="text-[8.5px] text-slate-400 font-bold block mt-1 uppercase leading-none">{alert.sub}</span>
                  </div>
                </div>
              ))}
              {currentAlerts.filter(a => a.type === 'red').length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CheckCircle className="w-8 h-8 text-emerald-500 mb-2 opacity-80" />
                  <span className="text-[9px] text-slate-400 font-bold uppercase">Aucune alerte sévère détectée</span>
                </div>
              )}
            </div>
          </div>

          {/* Alerte Ambre Segment */}
          <div className="border border-amber-150 rounded-2xl p-4 bg-amber-50/15 flex flex-col space-y-3.5">
            <div className="flex items-center gap-2 border-b border-amber-100 pb-2">
              <span className="w-2 h-2 rounded-full bg-amber-600" />
              <span className="text-amber-950 text-[10.5px] font-black uppercase tracking-wider">Alertes Ambres (Attention)</span>
            </div>
            <div className="space-y-3 flex-1 overflow-y-auto max-h-[300px] custom-scrollbar">
              {currentAlerts.filter(a => a.type === 'amber').map((alert, idx) => (
                <div key={idx} className="bg-white border border-amber-100 rounded-xl p-3 flex gap-2.5 shadow-2xs">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-slate-800 font-extrabold block leading-normal">{alert.message}</span>
                    <span className="text-[8.5px] text-slate-400 font-bold block mt-1 uppercase leading-none">{alert.sub}</span>
                  </div>
                </div>
              ))}
              {currentAlerts.filter(a => a.type === 'amber').length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CheckCircle className="w-8 h-8 text-emerald-500 mb-2 opacity-80" />
                  <span className="text-[9px] text-slate-400 font-bold uppercase">Aucune alerte de vigilance</span>
                </div>
              )}
            </div>
          </div>

          {/* Alerte Bleue Segment */}
          <div className="border border-blue-150 rounded-2xl p-4 bg-blue-50/15 flex flex-col space-y-3.5">
            <div className="flex items-center gap-2 border-b border-blue-100 pb-2">
              <span className="w-2 h-2 rounded-full bg-blue-600" />
              <span className="text-blue-950 text-[10.5px] font-black uppercase tracking-wider">Informations Techniques</span>
            </div>
            <div className="space-y-3 flex-1 overflow-y-auto max-h-[300px] custom-scrollbar">
              {currentAlerts.filter(a => a.type === 'blue').map((alert, idx) => (
                <div key={idx} className="bg-white border border-blue-100 rounded-xl p-3 flex gap-2.5 shadow-2xs">
                  <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="text-[10px] text-slate-800 font-extrabold block leading-normal">{alert.message}</span>
                    <span className="text-[8.5px] text-slate-400 font-bold block mt-1 uppercase leading-none">{alert.sub}</span>
                  </div>
                </div>
              ))}
              {currentAlerts.filter(a => a.type === 'blue').length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <CheckCircle className="w-8 h-8 text-emerald-500 mb-2 opacity-80" />
                  <span className="text-[9px] text-slate-400 font-bold uppercase">Aucune anomalie technique</span>
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* SECTION 7 — MAINTENANCE (résumé compact) */}
      <div className="bg-white border border-gray-150 rounded-3xl p-6 shadow-xs space-y-6">
        <div>
          <span className="text-[#b8860b] text-[10.5px] font-black tracking-widest uppercase block mb-1">BRIGADE TECHNIQUE</span>
          <h2 className="text-base font-black uppercase text-slate-800 tracking-tight">Résumé des Interventions de Maintenance</h2>
        </div>

        <div className="overflow-x-auto border border-gray-150 rounded-2xl shadow-xs">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-900 text-white border-b-2 border-purple-500 text-[9.5px] font-black tracking-wider uppercase">
                <th className="p-3 text-center w-12">Poste</th>
                <th className="p-3">Intervenant Technique</th>
                <th className="p-3">Équipement / Engin</th>
                <th className="p-3 text-center">Heures</th>
                <th className="p-3">Descriptif Succinct des Travaux Réalisés</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-150 text-[10.5px] font-bold text-slate-700 bg-white">
              {metrics.consolidatedMaintenanceRows.map((row, idx) => {
                const reel = row.reel || {};
                return (
                  <tr key={idx} className="hover:bg-purple-50/10 transition-colors">
                    <td className="p-3 text-center text-purple-700 font-black text-[10px] whitespace-nowrap bg-slate-50/15">{row.poste}</td>
                    <td className="p-3 text-slate-800 uppercase font-extrabold">
                      {getPersonnelName(reel.agentMatricule || reel.mechanicMatricule) || reel.agentMatricule || reel.mechanicMatricule || 'Non affecté'}
                    </td>
                    <td className="p-3">
                      <span className="font-mono bg-purple-50 text-purple-800 border border-purple-200/50 px-2.5 py-0.5 rounded text-[9.5px]">
                        {reel.engineCode || reel.engineId || '-'}
                      </span>
                    </td>
                    <td className="p-3 text-center font-mono text-purple-900 font-extrabold bg-purple-50/10 whitespace-nowrap">
                      {reel.hoursSpent || 0} h
                    </td>
                    <td className="p-3 text-slate-600 font-normal leading-relaxed text-[11px]">{reel.workDescription || '-'}</td>
                  </tr>
                );
              })}
              {metrics.consolidatedMaintenanceRows.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-slate-400 font-bold uppercase text-[9.5px]">Aucune intervention de maintenance déclarée</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
