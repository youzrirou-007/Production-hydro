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
  Gauge,
  Workflow,
  Tractor,
  Train,
  Wrench,
  TrendingUp,
  Info,
  ChevronRight,
  Filter,
  Award,
  Activity,
  ArrowUpRight,
  ShieldAlert,
  Fuel
} from 'lucide-react';
import { collection, query, onSnapshot } from 'firebase/firestore';
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

// Import newly added analytics modules
import { SectorsCompare } from '../components/SectorsCompare';
import { GlobalRankings } from '../components/GlobalRankings';
import { HistoryTrends } from '../components/HistoryTrends';

// Timezone safe shift for date calculation
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
  
  // Tabs State
  const [activeTab, setActiveTab] = useState<'cockpit' | 'sectors_compare' | 'rankings' | 'trends' | 'bure' | 'secteurs' | 'rh' | 'materiel'>('cockpit');
  
  // Drilldown sub-filters inside Secteurs tab
  const [selectedPosteFilter, setSelectedPosteFilter] = useState<'Tous' | 'Poste 1' | 'Poste 2' | 'Poste 3'>('Tous');

  // Database States
  const [chantiers, setChantiers] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [engines, setEngines] = useState<any[]>([]);
  const [allPlanningSheets, setAllPlanningSheets] = useState<any[]>([]);
  const [allProductionDocs, setAllProductionDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Inject animations
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
        font-size: 24px;
        font-weight: 900;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        background: linear-gradient(90deg, #475569 0%, #b8860b 20%, #ffd700 35%, #e5c158 50%, #ffd700 65%, #b8860b 80%, #475569 100%);
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

  // Firestore Subscriptions
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
    }, () => setLoading(false));

    return () => {
      unsubChantiers();
      unsubRH();
      unsubEngines();
      unsubPlannings();
      unsubProd();
    };
  }, []);

  // Resolvers
  const getChantierName = (id: string) => {
    if (!id) return 'N/A';
    if (id.startsWith('stock_')) return id.replace('stock_', 'STOCK : ').toUpperCase();
    const match = chantiers.find(c => c.id === id);
    return match ? match.name : id;
  };

  const getPersonnelName = (matricule: string) => {
    if (!matricule) return '';
    const match = employees.find(e => e.matricule?.toUpperCase() === matricule.toUpperCase());
    return match ? `${match.nom} ${match.prenom}` : matricule;
  };

  const isTargetSector = (sector: string) => {
    const s = (sector || '').trim().toLowerCase();
    return s === 'imiter 2' || s === 'imiter 1' || s === 'imiter est' || s === 'bure imiter est' || s === 'imiter est bure';
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

  const getDurationInHours = (start: string, end: string) => {
    try {
      if (!start || !end) return 8;
      const [h1, m1] = start.split(':').map(Number);
      const [h2, m2] = end.split(':').map(Number);
      let diffMin = (h2 * 60 + m2) - (h1 * 60 + m1);
      if (diffMin < 0) diffMin += 24 * 60;
      return diffMin / 60;
    } catch (e) {
      return 8;
    }
  };

  // Main Aggregator Engine
  const getAggregatedData = () => {
    let alignedDays: { prodDate: string; planDate: string; prodDoc: any; planDoc: any }[] = [];

    if (reportType === 'day') {
      const prevDate = getPreviousDateStr(filterDate);
      const pDoc = allProductionDocs.find(d => d.id === filterDate);
      const sDoc = allPlanningSheets.find(d => d.id === prevDate);
      alignedDays.push({ prodDate: filterDate, planDate: prevDate, prodDoc: pDoc || null, planDoc: sDoc || null });
    } else {
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
            alignedDays.push({ prodDate: dateStr, planDate: prevDateStr, prodDoc: pDoc || null, planDoc: sDoc || null });
          }
        });
      } catch (e) {
        console.error("Error formatting month interval", e);
      }
    }

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

    const consolidatedMinageRows: any[] = [];
    const consolidatedDeblayageRows: any[] = [];
    const consolidatedExtractionRows: any[] = [];
    const consolidatedMaintenanceRows: any[] = [];

    const addAgent = (set: Set<string>, matricule: any) => {
      if (typeof matricule === 'string' && matricule.trim() !== '') {
        set.add(matricule.trim().toUpperCase());
      }
    };

    alignedDays.forEach(({ prodDate, planDate, prodDoc, planDoc }) => {
      // Minage
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

      // Deblayage
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

      // Extraction (Wagons)
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

      // Maintenance
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

    const getSectorTotals = (sector: string) => {
      const name = sector.toLowerCase().trim();
      
      const minageRows = consolidatedMinageRows.filter(r => {
        const s = (r.sectorGroup || '').toLowerCase().trim();
        if (name === 'bure imiter est' || name === 'imiter est bure') {
          return s === 'bure imiter est' || s === 'imiter est bure';
        }
        return s === name;
      });

      const deblayageRows = consolidatedDeblayageRows.filter(r => {
        const s = (r.sectorGroup || '').toLowerCase().trim();
        if (name === 'bure imiter est' || name === 'imiter est bure') {
          return s === 'bure imiter est' || s === 'imiter est bure';
        }
        return s === name;
      });

      const realMet = minageRows.reduce((acc, r) => acc + Number(r.reel?.realMeterage || 0), 0);
      const planMet = minageRows.reduce((acc, r) => acc + Number(r.plan?.meterage || r.plan?.plannedRounds * 1.7 || 0), 0);

      const realVol = deblayageRows.reduce((acc, r) => acc + Number(r.reel?.volumeEstimated || 0), 0);
      const planVol = deblayageRows.reduce((acc, r) => acc + Number(r.plan?.volumeEstimated || 0), 0);

      return { realMet, planMet, realVol, planVol, minageRows, deblayageRows };
    };

    const sectorBreakdown = {
      imiter2: getSectorTotals('Imiter 2'),
      imiter1: getSectorTotals('Imiter 1'),
      imiterEst: getSectorTotals('Imiter Est'),
      bureImiterEst: getSectorTotals('Bure Imiter Est')
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

  // Global Weighted Performance
  const globalWeightedScore = (
    Math.min(100, minageRate) * 0.40 +
    Math.min(100, deblayageRate) * 0.20 +
    Math.min(100, extractionRate) * 0.30 +
    Math.min(100, maintenanceRate) * 0.10
  );

  let efficiencyBadge = 'ZONE CRITIQUE';
  let efficiencyColor = 'text-red-700 bg-red-50 border-red-200';
  let efficiencyRingColor = '#dc2626';

  if (globalWeightedScore >= 100) {
    efficiencyBadge = 'SUR-PERFORMANCE';
    efficiencyColor = 'text-emerald-800 bg-emerald-50 border-emerald-200';
    efficiencyRingColor = '#16a34a';
  } else if (globalWeightedScore >= 90) {
    efficiencyBadge = 'OBJECTIFS ATTEINTS';
    efficiencyColor = 'text-amber-800 bg-amber-50 border-amber-200';
    efficiencyRingColor = '#b8860b';
  }

  // Specific explosive calculations
  const realExpTotal = metrics.totalRealAnfo + metrics.totalRealTovex;
  const planExpTotal = metrics.totalPlanAnfo + metrics.totalPlanTovex;
  const realSpecificExp = metrics.totalRealMeterage > 0 ? realExpTotal / metrics.totalRealMeterage : 0;
  const planSpecificExp = metrics.totalPlanMeterage > 0 ? planExpTotal / metrics.totalPlanMeterage : 0;
  const expVariancePct = planSpecificExp > 0 ? ((realSpecificExp - planSpecificExp) / planSpecificExp) * 100 : 0;

  // Dynamic colors helper
  const getPerformanceColor = (pct: number) => {
    if (pct >= 100) return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    if (pct >= 80) return 'text-amber-600 bg-amber-50 border-amber-100';
    return 'text-red-600 bg-red-50 border-red-100';
  };

  const getPerformanceBarColor = (pct: number) => {
    if (pct >= 100) return 'bg-emerald-500';
    if (pct >= 80) return 'bg-amber-500';
    return 'bg-red-500';
  };

  // Automated smart alert compiler
  const getAutomaticAlerts = () => {
    const list: { type: 'red' | 'amber' | 'blue'; message: string; sub: string }[] = [];

    // Red: yields under 1.3m or explosive overconsumption > 20%
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

      const rowExpReal = Number(r.anfo || 0) + Number(r.tovex || 0);
      const plan = row.plan || {};
      const rowExpPlan = Number(plan.anfo || 0) + Number(plan.tovex || 0);
      const realSpecific = Number(r.realMeterage || 0) > 0 ? rowExpReal / r.realMeterage : 0;
      const planSpecific = Number(plan.meterage || 0) > 0 ? rowExpPlan / plan.meterage : 0;

      if (planSpecific > 0 && realSpecific > planSpecific * 1.20) {
        const excess = ((realSpecific - planSpecific) / planSpecific) * 100;
        list.push({
          type: 'red',
          message: `Surconsommation d'explosifs (+${excess.toFixed(0)}%) sur ${chantier}`,
          sub: `Spécifique : ${realSpecific.toFixed(1)} kg/m vs Cible : ${planSpecific.toFixed(1)} kg/m`
        });
      }
    });

    // Amber: attendance < 90% or Loader Vol < 80%
    const presenceRate = metrics.planPresence > 0 ? (metrics.realPresence / metrics.planPresence) * 100 : 100;
    if (presenceRate < 90) {
      list.push({
        type: 'amber',
        message: `Taux de présence critique de la brigade : ${presenceRate.toFixed(1)}%`,
        sub: `${metrics.realPresence} agents présents / ${metrics.planPresence} planifiés`
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
          message: `Sous-performance Déblayage (${rate.toFixed(0)}%) sur ${r.engineCode || 'LHD'}`,
          sub: `${row.poste} • Chantier : ${getChantierName(r.chantierId)} • ${realVol}m³ vs ${planVol}m³`
        });
      }
    });

    // Blue: Maintenance work > 4h
    metrics.consolidatedMaintenanceRows.forEach(row => {
      const r = row.reel || row;
      if (Number(r.hoursSpent || 0) > 4) {
        list.push({
          type: 'blue',
          message: `Intervention technique lourde : ${r.hoursSpent}h sur ${r.engineCode || 'LHD'}`,
          sub: `Mécanicien : ${getPersonnelName(r.agentMatricule || r.mechanicMatricule)} • Travail : ${r.workDescription || 'N/A'}`
        });
      }
    });

    return list;
  };

  const currentAlerts = getAutomaticAlerts();

  // Month Chart mapping
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
              if (isTargetSector(getRecordSectorGroup(r))) {
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
              if (isTargetSector(getRecordSectorGroup(r))) {
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

  // RH Individual Rankings logic
  const getRHLeaderboards = () => {
    const minerStats: { [matricule: string]: { name: string; meters: number; holes: number; rounds: number } } = {};
    const driverStats: { [matricule: string]: { name: string; volume: number; godets: number; count: number } } = {};

    metrics.consolidatedMinageRows.forEach(row => {
      const r = row.reel || {};
      const mat = r.minerMatricule;
      if (mat) {
        const uMat = mat.toUpperCase().trim();
        if (!minerStats[uMat]) {
          minerStats[uMat] = { name: getPersonnelName(mat), meters: 0, holes: 0, rounds: 0 };
        }
        minerStats[uMat].meters += Number(r.realMeterage || 0);
        minerStats[uMat].holes += Number(r.realHoles || 0);
        minerStats[uMat].rounds += Number(r.realRounds || 0);
      }
    });

    metrics.consolidatedDeblayageRows.forEach(row => {
      const r = row.reel || {};
      const mat = r.driverMatricule;
      if (mat) {
        const uMat = mat.toUpperCase().trim();
        if (!driverStats[uMat]) {
          driverStats[uMat] = { name: getPersonnelName(mat), volume: 0, godets: 0, count: 0 };
        }
        driverStats[uMat].volume += Number(r.volumeEstimated || 0);
        driverStats[uMat].godets += Number(r.godets || 0);
        driverStats[uMat].count += 1;
      }
    });

    const rankedMiners = Object.entries(minerStats)
      .map(([matricule, data]) => ({ matricule, ...data }))
      .sort((a, b) => b.meters - a.meters);

    const rankedDrivers = Object.entries(driverStats)
      .map(([matricule, data]) => ({ matricule, ...data }))
      .sort((a, b) => b.volume - a.volume);

    return { rankedMiners, rankedDrivers };
  };

  const leaderboards = getRHLeaderboards();

  // LHD fleet stats aggregator
  const getLHDStats = () => {
    const stats: { [code: string]: { code: string; volume: number; hoursMaint: number; countDeblayage: number; countMaint: number; gasoil: number } } = {};

    metrics.consolidatedDeblayageRows.forEach(row => {
      const r = row.reel || {};
      const code = (r.engineCode || r.engineId || 'LHD-INCONNU').toUpperCase().trim();
      if (!stats[code]) {
        stats[code] = { code, volume: 0, hoursMaint: 0, countDeblayage: 0, countMaint: 0, gasoil: 0 };
      }
      stats[code].volume += Number(r.volumeEstimated || 0);
      stats[code].gasoil += Number(r.gasoil || 0);
      stats[code].countDeblayage += 1;
    });

    metrics.consolidatedMaintenanceRows.forEach(row => {
      const r = row.reel || {};
      const code = (r.engineCode || r.engineId || 'LHD-INCONNU').toUpperCase().trim();
      if (!stats[code]) {
        stats[code] = { code, volume: 0, hoursMaint: 0, countDeblayage: 0, countMaint: 0, gasoil: 0 };
      }
      stats[code].hoursMaint += Number(r.hoursSpent || 0);
      stats[code].countMaint += 1;
    });

    return Object.values(stats).sort((a, b) => b.volume - a.volume);
  };

  const lhdStats = getLHDStats();

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-40 bg-white">
        <Workflow className="w-12 h-12 text-[#b8860b] animate-spin mb-4" />
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Chargement de l'analyse...</p>
      </div>
    );
  }

  // Common Header component for Date/Month selector
  const renderPeriodLabel = () => {
    if (reportType === 'day') {
      return format(parseISO(filterDate), 'dd MMMM yyyy');
    }
    const [y, m] = filterMonth.split('-');
    const d = new Date(Number(y), Number(m) - 1, 1);
    return format(d, 'MMMM yyyy');
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16 font-sans bg-white p-2 sm:p-4 rounded-3xl">
      
      {/* BANNER HEADER */}
      <div 
        id="analyse-dashboard-header" 
        className="bg-white p-6 md:p-8 border border-gray-150 rounded-[20px] w-full shadow-xs"
        style={{ boxShadow: '0 4px 24px -2px rgba(184, 134, 11, 0.05)' }}
      >
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          <div className="shrink-0 flex items-center justify-center">
            <img 
              src={logoImg} 
              alt="HydroMines Logo" 
              className="h-24 w-24 md:h-28 md:w-28 object-contain hover:scale-105 transition-transform duration-300 select-none rounded-2xl" 
              referrerPolicy="no-referrer" 
            />
          </div>

          <div className="flex-1 flex flex-col items-center text-center space-y-2 w-full">
            <div className="subtle-glow-line w-2/3 opacity-60" />
            <h1 className="gold-title text-base sm:text-lg md:text-xl tracking-[0.08em] font-black leading-none py-1">
              CENTRE DE PILOTAGE DIRECTION GÉNÉRALE
            </h1>
            <div className="subtle-glow-line w-2/3 opacity-60" />
            <p className="uppercase tracking-[0.15em] text-[8.5px] font-extrabold text-[#b8860b]">
              SMI HydroMines • Analyse des données d'exploitation : {renderPeriodLabel()}
            </p>
          </div>

          <div className="shrink-0 flex flex-col items-center lg:items-end gap-3 w-full lg:w-auto">
            <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200/50">
              <button
                type="button"
                onClick={() => setReportType('day')}
                className={`text-[9.5px] font-black uppercase py-2 px-4 rounded-lg cursor-pointer ${
                  reportType === 'day' ? 'bg-[#b8860b] text-white' : 'text-gray-500'
                }`}
              >
                📅 Quotidien
              </button>
              <button
                type="button"
                onClick={() => setReportType('month')}
                className={`text-[9.5px] font-black uppercase py-2 px-4 rounded-lg cursor-pointer ${
                  reportType === 'month' ? 'bg-[#b8860b] text-white' : 'text-gray-500'
                }`}
              >
                📊 Mensuel
              </button>
            </div>

            <div className="inline-flex items-center gap-2 bg-amber-50/40 border border-amber-100 px-3 py-1.5 rounded-xl">
              <Calendar className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-[10px] font-black uppercase text-[#b8860b]">
                Période :
              </span>
              {reportType === 'day' ? (
                <input 
                  type="date" 
                  value={filterDate}
                  onChange={e => setFilterDate(e.target.value)}
                  className="text-xs font-black uppercase text-slate-900 outline-none cursor-pointer bg-white border border-amber-200 rounded-lg px-2 py-0.5"
                />
              ) : (
                <input 
                  type="month" 
                  value={filterMonth}
                  onChange={e => setFilterMonth(e.target.value)}
                  className="text-xs font-black uppercase text-slate-900 outline-none cursor-pointer bg-white border border-amber-200 rounded-lg px-2 py-0.5"
                />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* METRIC CORE COCKPIT TABS */}
      <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-px">
        {[
          { id: 'cockpit', label: 'Cockpit Direction', icon: <Activity className="w-4 h-4" /> },
          { id: 'sectors_compare', label: 'Comparatif Secteurs', icon: <Layers className="w-4 h-4" /> },
          { id: 'rankings', label: 'Classements & Palmarès', icon: <Award className="w-4 h-4" /> },
          { id: 'trends', label: 'Historique & Tendances', icon: <TrendingUp className="w-4 h-4" /> },
          { id: 'bure', label: 'Focus Bure Est (N340)', icon: <Train className="w-4 h-4" /> },
          { id: 'secteurs', label: 'Détail Secteurs', icon: <Layers className="w-4 h-4" /> },
          { id: 'rh', label: 'Ressources Humaines', icon: <HardHat className="w-4 h-4" /> },
          { id: 'materiel', label: 'Matériels & Maintenance', icon: <Wrench className="w-4 h-4" /> },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id as any)}
            className={`flex items-center gap-2 px-3 sm:px-4 py-3 border-b-2 font-black text-[10px] sm:text-xs uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === t.id 
                ? 'border-[#b8860b] text-[#b8860b] bg-amber-50/10' 
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            {t.icon}
            {t.label}
          </button>
        ))}
      </div>

      {/* RENDER ACTIVE TAB */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -15 }}
          transition={{ duration: 0.15 }}
          className="space-y-8"
        >
          {/* EMPTY DATA WARNING STATE */}
          {metrics.alignedDays.length === 0 || (metrics.consolidatedMinageRows.length === 0 && metrics.consolidatedExtractionRows.length === 0) ? (
            <div className="bg-amber-50/40 border border-amber-100 p-8 rounded-3xl text-center space-y-3">
              <ShieldAlert className="w-10 h-10 text-amber-500 mx-auto" />
              <h3 className="text-sm font-black uppercase text-slate-800">Aucune donnée disponible pour cette période</h3>
              <p className="text-[10px] text-slate-500 max-w-md mx-auto">
                Les rapports de production journaliers ou les fiches de planification n'ont pas encore été enregistrés dans Firestore pour le {renderPeriodLabel()}. Veuillez sélectionner un autre jour ou mois de production.
              </p>
            </div>
          ) : (
            <>
              {/* TAB: COMPARATIF SECTEURS */}
              {activeTab === 'sectors_compare' && (
                <SectorsCompare 
                  allProductionDocs={allProductionDocs}
                  allPlanningSheets={allPlanningSheets}
                  chantiers={chantiers}
                  employees={employees}
                  reportType={reportType}
                  filterDate={filterDate}
                  filterMonth={filterMonth}
                />
              )}

              {/* TAB: CLASSEMENTS GLOBALS */}
              {activeTab === 'rankings' && (
                <GlobalRankings 
                  allProductionDocs={allProductionDocs}
                  allPlanningSheets={allPlanningSheets}
                  chantiers={chantiers}
                  employees={employees}
                  engines={engines}
                  reportType={reportType}
                  filterDate={filterDate}
                  filterMonth={filterMonth}
                />
              )}

              {/* TAB: TENDANCES HISTORIQUES */}
              {activeTab === 'trends' && (
                <HistoryTrends 
                  allProductionDocs={allProductionDocs}
                  allPlanningSheets={allPlanningSheets}
                />
              )}

              {/* TAB 1: COCKPIT DIRECTION GÉNÉRALE */}
              {activeTab === 'cockpit' && (
                <div className="space-y-8">
                  {/* KPI Row */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                    {/* Efficacite Globale */}
                    <div className="bg-white border border-gray-150 rounded-2xl p-4 shadow-2xs relative flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <span className="text-[9.5px] font-bold text-slate-400 uppercase">1. Efficacité Globale</span>
                        <span className={`px-1.5 py-0.5 border text-[7px] font-black uppercase rounded ${efficiencyColor}`}>
                          {efficiencyBadge}
                        </span>
                      </div>
                      <div className="flex items-center gap-3.5 my-3">
                        <div className="relative w-12 h-12 shrink-0">
                          <svg className="w-full h-full transform -rotate-90">
                            <circle cx="24" cy="24" r="20" className="stroke-slate-100" strokeWidth="4" fill="transparent" />
                            <circle 
                              cx="24" cy="24" r="20" 
                              className="transition-all" 
                              strokeWidth="4" 
                              fill="transparent" 
                              stroke={efficiencyRingColor}
                              strokeDasharray={`${2 * Math.PI * 20}`}
                              strokeDashoffset={`${2 * Math.PI * 20 * (1 - Math.min(100, globalWeightedScore) / 100)}`}
                            />
                          </svg>
                          <span className="absolute inset-0 flex items-center justify-center font-mono text-xs font-black text-slate-800">
                            {globalWeightedScore.toFixed(0)}%
                          </span>
                        </div>
                        <div>
                          <span className="text-xl font-black text-slate-800">{globalWeightedScore.toFixed(1)}%</span>
                          <span className="text-[8px] text-slate-400 block uppercase font-bold">Rendement Pondéré</span>
                        </div>
                      </div>
                      <div className="border-t border-gray-100 pt-2 text-[9px] text-slate-400 font-bold uppercase">
                        Forage (40%) • Extr (30%) • Débl (20%)
                      </div>
                    </div>

                    {/* Forage */}
                    <div className="bg-white border border-gray-150 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <span className="text-[9.5px] font-bold text-slate-400 uppercase">2. Forage & Minage</span>
                        <span className="text-[#b8860b]"><Bomb className="w-4 h-4" /></span>
                      </div>
                      <div className="my-2.5">
                        <span className="text-xl font-black text-slate-800">{metrics.totalRealMeterage.toFixed(1)} m</span>
                        <span className="text-[9px] text-slate-500 block uppercase font-bold mt-0.5">
                          Prévu : {metrics.totalPlanMeterage.toFixed(1)} m ({minageRate.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden mt-1.5">
                        <div className={`h-full ${getPerformanceBarColor(minageRate)}`} style={{ width: `${Math.min(100, minageRate)}%` }} />
                      </div>
                    </div>

                    {/* Déblayage */}
                    <div className="bg-white border border-gray-150 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <span className="text-[9.5px] font-bold text-slate-400 uppercase">3. Déblayage & Charge</span>
                        <span className="text-sky-600"><Tractor className="w-4 h-4" /></span>
                      </div>
                      <div className="my-2.5">
                        <span className="text-xl font-black text-slate-800">{metrics.totalRealVolume.toFixed(1)} m³</span>
                        <span className="text-[9px] text-slate-500 block uppercase font-bold mt-0.5">
                          Prévu : {metrics.totalPlanVolume.toFixed(1)} m³ ({deblayageRate.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden mt-1.5">
                        <div className={`h-full ${getPerformanceBarColor(deblayageRate)}`} style={{ width: `${Math.min(100, deblayageRate)}%` }} />
                      </div>
                    </div>

                    {/* Extraction */}
                    <div className="bg-white border border-gray-150 rounded-2xl p-4 shadow-2xs flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <span className="text-[9.5px] font-bold text-slate-400 uppercase">4. Extraction Wagons</span>
                        <span className="text-indigo-600"><Train className="w-4 h-4" /></span>
                      </div>
                      <div className="my-2.5">
                        <span className="text-xl font-black text-slate-800">{metrics.totalRealWagons} Wg</span>
                        <span className="text-[9px] text-slate-500 block uppercase font-bold mt-0.5">
                          Cible : {metrics.totalPlanWagons} Wg ({extractionRate.toFixed(0)}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden mt-1.5">
                        <div className={`h-full ${getPerformanceBarColor(extractionRate)}`} style={{ width: `${Math.min(100, extractionRate)}%` }} />
                      </div>
                    </div>
                  </div>

                  {/* Explosives & Fuel Consumptions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white border border-gray-150 p-6 rounded-2xl space-y-4">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                        <span className="text-slate-800 font-black text-xs uppercase tracking-wide">Ratio Spécifique Explosifs</span>
                        <span className="text-[9.5px] font-bold bg-rose-50 text-rose-700 px-2 py-0.5 rounded uppercase">
                          {expVariancePct > 0 ? `+${expVariancePct.toFixed(1)}%` : `${expVariancePct.toFixed(1)}%`} Variance
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-2xl font-black text-slate-800">{realSpecificExp.toFixed(2)} <span className="text-xs text-slate-400">kg/m</span></span>
                          <span className="text-[9px] text-slate-400 block uppercase font-bold mt-1">Spécifique Réel</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-black text-slate-500 block">{planSpecificExp.toFixed(2)} kg/m</span>
                          <span className="text-[9.5px] text-slate-400 uppercase font-bold">Cible Prévue</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl">
                        <div>
                          <span className="text-slate-400 text-[9px] block uppercase font-black">Total ANFO</span>
                          <span className="text-sm font-black text-rose-700">{metrics.totalRealAnfo} kg</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[9px] block uppercase font-black">Total TOVEX</span>
                          <span className="text-sm font-black text-cyan-700">{metrics.totalRealTovex} kg</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white border border-gray-150 p-6 rounded-2xl space-y-4">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                        <span className="text-slate-800 font-black text-xs uppercase tracking-wide">Indicateurs Énergie & LHD</span>
                        <span className="text-[9.5px] font-bold bg-sky-50 text-sky-700 px-2 py-0.5 rounded uppercase"><Fuel className="w-3.5 h-3.5 inline mr-1" />Gasoil</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-2xl font-black text-slate-800">{metrics.totalDeblayageGasoil} <span className="text-xs text-slate-400">L</span></span>
                          <span className="text-[9px] text-slate-400 block uppercase font-bold mt-1">Carburant consommé</span>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-black text-slate-500 block">
                            {metrics.totalRealVolume > 0 ? (metrics.totalDeblayageGasoil / metrics.totalRealVolume).toFixed(2) : '0.00'} L/m³
                          </span>
                          <span className="text-[9.5px] text-slate-400 uppercase font-bold">Ratio énergétique</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 p-3 rounded-xl">
                        <div>
                          <span className="text-slate-400 text-[9px] block uppercase font-black">Savoir-faire RH</span>
                          <span className="text-sm font-black text-slate-800">{metrics.realPresence} Présences</span>
                        </div>
                        <div>
                          <span className="text-slate-400 text-[9px] block uppercase font-black">Maintenance</span>
                          <span className="text-sm font-black text-purple-700">{metrics.totalRealMaintHours.toFixed(1)} H</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Monthly Charts */}
                  {reportType === 'month' && chartData.length > 0 && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-white border border-gray-150 rounded-2xl p-6">
                      <div className="space-y-2">
                        <h4 className="text-xs font-black uppercase text-slate-800">Évolution Quotidienne Minage (m)</h4>
                        <div className="h-64 font-mono text-[9px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                              <defs>
                                <linearGradient id="colorMet" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#b8860b" stopOpacity={0.2}/>
                                  <stop offset="95%" stopColor="#b8860b" stopOpacity={0}/>
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis dataKey="day" stroke="#94a3b8" />
                              <YAxis stroke="#94a3b8" unit="m" />
                              <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '10px' }} />
                              <Area type="monotone" dataKey="realMeterage" name="Réel (m)" stroke="#b8860b" strokeWidth={2} fill="url(#colorMet)" />
                              <Area type="monotone" dataKey="planMeterage" name="Prévu (m)" stroke="#94a3b8" strokeWidth={1} strokeDasharray="3 3" fill="none" />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-xs font-black uppercase text-slate-800">Évolution Quotidienne Extraction (wg)</h4>
                        <div className="h-64 font-mono text-[9px]">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                              <XAxis dataKey="day" stroke="#94a3b8" />
                              <YAxis stroke="#94a3b8" unit="wg" />
                              <Tooltip contentStyle={{ background: '#1e293b', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '10px' }} />
                              <Bar dataKey="realWagons" name="Réel (wg)" fill="#b8860b" radius={[2, 2, 0, 0]} />
                              <Bar dataKey="planWagons" name="Planifié (wg)" fill="#cbd5e1" radius={[2, 2, 0, 0]} />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* AUTOMATIC ALERTS SYSTEM */}
                  <div className="bg-white border border-gray-150 rounded-2xl p-6 space-y-4">
                    <h3 className="text-xs font-black uppercase text-slate-800 tracking-wide flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-amber-600 animate-pulse" />
                      Anomalies & Alertes Cliniques Automatisées ({currentAlerts.length})
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {/* Red */}
                      <div className="border border-red-100 rounded-xl p-4 bg-red-50/10 space-y-3">
                        <div className="border-b border-red-100 pb-1.5 flex items-center justify-between">
                          <span className="text-red-950 text-[10px] font-black uppercase">Rouges (Sévères)</span>
                          <span className="w-2 h-2 rounded-full bg-red-600 animate-ping" />
                        </div>
                        <div className="space-y-2 overflow-y-auto max-h-48 custom-scrollbar">
                          {currentAlerts.filter(a => a.type === 'red').map((alert, idx) => (
                            <div key={idx} className="bg-white border border-red-100 rounded-lg p-2.5 text-[9.5px] font-bold">
                              <span className="text-slate-800 block leading-tight">{alert.message}</span>
                              <span className="text-slate-400 text-[8.5px] block mt-1 uppercase">{alert.sub}</span>
                            </div>
                          ))}
                          {currentAlerts.filter(a => a.type === 'red').length === 0 && (
                            <div className="text-center py-4 text-slate-400 text-[9px] uppercase font-bold">Aucune alerte sévère</div>
                          )}
                        </div>
                      </div>

                      {/* Amber */}
                      <div className="border border-amber-100 rounded-xl p-4 bg-amber-50/10 space-y-3">
                        <div className="border-b border-amber-100 pb-1.5 flex items-center justify-between">
                          <span className="text-amber-950 text-[10px] font-black uppercase">Ambre (Attention)</span>
                          <span className="w-2 h-2 rounded-full bg-amber-600" />
                        </div>
                        <div className="space-y-2 overflow-y-auto max-h-48 custom-scrollbar">
                          {currentAlerts.filter(a => a.type === 'amber').map((alert, idx) => (
                            <div key={idx} className="bg-white border border-amber-100 rounded-lg p-2.5 text-[9.5px] font-bold">
                              <span className="text-slate-800 block leading-tight">{alert.message}</span>
                              <span className="text-slate-400 text-[8.5px] block mt-1 uppercase">{alert.sub}</span>
                            </div>
                          ))}
                          {currentAlerts.filter(a => a.type === 'amber').length === 0 && (
                            <div className="text-center py-4 text-slate-400 text-[9px] uppercase font-bold">Aucune alerte vigilance</div>
                          )}
                        </div>
                      </div>

                      {/* Blue */}
                      <div className="border border-blue-100 rounded-xl p-4 bg-blue-50/10 space-y-3">
                        <div className="border-b border-blue-100 pb-1.5 flex items-center justify-between">
                          <span className="text-blue-950 text-[10px] font-black uppercase">Bleu (Info Technique)</span>
                          <span className="w-2 h-2 rounded-full bg-blue-600" />
                        </div>
                        <div className="space-y-2 overflow-y-auto max-h-48 custom-scrollbar">
                          {currentAlerts.filter(a => a.type === 'blue').map((alert, idx) => (
                            <div key={idx} className="bg-white border border-blue-100 rounded-lg p-2.5 text-[9.5px] font-bold">
                              <span className="text-slate-800 block leading-tight">{alert.message}</span>
                              <span className="text-slate-400 text-[8.5px] block mt-1 uppercase">{alert.sub}</span>
                            </div>
                          ))}
                          {currentAlerts.filter(a => a.type === 'blue').length === 0 && (
                            <div className="text-center py-4 text-slate-400 text-[9px] uppercase font-bold">Aucune alerte technique</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: FOCUS BURE IMITER EST (Extraction stratégique) */}
              {activeTab === 'bure' && (
                <div className="space-y-8">
                  <div className="border border-indigo-100 bg-indigo-50/10 p-5 rounded-2xl flex items-center gap-4">
                    <ShieldAlert className="w-10 h-10 text-indigo-600 shrink-0" />
                    <div>
                      <h4 className="text-xs font-black uppercase text-indigo-950 tracking-wider">Couloir d'extraction stratégique Bure N340</h4>
                      <p className="text-[10px] text-slate-500 leading-normal max-w-2xl">
                        Le bure d'Imiter Est est le cœur d'évacuation de la production d'abattage de SMI. L'analyse ci-dessous centralise l'avancement des brigades de treuillage, les volumes cumulés et le taux d'évacuation du stérile (wagons wagons wagons).
                      </p>
                    </div>
                  </div>

                  {/* 3 Shifts Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {['Poste 1', 'Poste 2', 'Poste 3'].map((pKey) => {
                      const row = metrics.consolidatedExtractionRows.find(r => r.poste === pKey);
                      const reel = row?.reel || {};
                      const plan = row?.plan || {};
                      const actW = Number(reel.wagonsActual || row?.wagonsActual || 0);
                      const targetW = Number(reel.wagonsTarget || plan.wagonsTarget || 48);
                      const rate = targetW > 0 ? (actW / targetW) * 100 : 0;
                      const sterile = Number(reel.sterileBureImiterEst || row?.sterileBureImiterEst || 0);

                      const crew = [reel.treuilliste, reel.equipier1, reel.equipier2, reel.equipier3, reel.equipier4].filter(Boolean);

                      return (
                        <div key={pKey} className="bg-white border border-gray-150 rounded-2xl p-5 shadow-2xs flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-center border-b border-gray-100 pb-2 mb-3">
                              <span className="text-xs font-black uppercase text-slate-800">{pKey}</span>
                              <span className={`px-2 py-0.5 text-[8px] font-black rounded uppercase ${getPerformanceColor(rate)}`}>
                                {rate.toFixed(0)}% Évacués
                              </span>
                            </div>

                            <div className="flex justify-between items-baseline mb-4">
                              <div>
                                <span className="text-2xl font-black text-slate-800">{actW} <span className="text-xs font-bold text-slate-400">wg</span></span>
                                <span className="text-[8.5px] text-slate-400 block font-bold uppercase mt-0.5">Cible : {targetW} wg</span>
                              </div>
                              <div className="text-right">
                                <span className="text-xs font-black text-[#b8860b] block">{sterile} Wg</span>
                                <span className="text-[8.5px] text-slate-400 font-bold uppercase">Stérile</span>
                              </div>
                            </div>

                            <div className="space-y-1 bg-slate-50 p-2.5 rounded-xl border border-gray-100">
                              <span className="text-[8.5px] text-slate-400 font-extrabold uppercase block mb-1">Équipe de poste :</span>
                              {crew.length > 0 ? crew.map((member, mIdx) => (
                                <span key={mIdx} className="text-[9px] font-black text-slate-700 uppercase block truncate">
                                  {mIdx === 0 ? '⚓ ' : '👥 '} {getPersonnelName(member)}
                                </span>
                              )) : (
                                <span className="text-[9px] text-slate-400 font-bold block">Aucun treuilliste affecté</span>
                              )}
                            </div>
                          </div>

                          <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden mt-4">
                            <div className={`h-full ${getPerformanceBarColor(rate)}`} style={{ width: `${Math.min(100, rate)}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Extraction Big Banner */}
                  <div className="bg-[#0f172a] text-white p-6 rounded-2xl flex flex-col md:flex-row justify-between items-center gap-6 border border-gray-800">
                    <div className="space-y-1">
                      <span className="text-[#ffd700] text-[9px] font-black uppercase tracking-widest block">Bilan Consolidé Bure</span>
                      <h4 className="text-sm font-black uppercase text-white">Production totale & tonnage de la période</h4>
                      <p className="text-[10px] text-slate-400 font-medium">Cadence estimée de chargement avec densité moyenne de 1.4 tonnes par wagon.</p>
                    </div>

                    <div className="flex gap-6 shrink-0 text-center">
                      <div className="px-3.5 py-1.5 bg-slate-800 rounded-xl min-w-[85px] border border-slate-700">
                        <span className="text-base font-black text-white block">{metrics.totalRealWagons}</span>
                        <span className="text-[8px] text-slate-400 font-bold uppercase">Wagons Réels</span>
                      </div>
                      <div className="px-3.5 py-1.5 bg-slate-800 rounded-xl min-w-[85px] border border-slate-700">
                        <span className="text-base font-black text-[#ffd700] block">{(metrics.totalRealWagons * 1.4).toFixed(1)} T</span>
                        <span className="text-[8px] text-[#ffd700] font-bold uppercase">Tonnage</span>
                      </div>
                      <div className="px-3.5 py-1.5 bg-slate-800 rounded-xl min-w-[85px] border border-slate-700">
                        <span className="text-base font-black text-teal-400 block">{metrics.totalRealSterile} Wg</span>
                        <span className="text-[8px] text-slate-400 font-bold uppercase">Stérile</span>
                      </div>
                    </div>
                  </div>

                  {/* Bure Minage and Deblayage Specific Rows */}
                  <div className="bg-white border border-gray-150 rounded-2xl p-6 space-y-4">
                    <h3 className="text-xs font-black uppercase text-slate-800">Activités Directes de Chantier Forées & Déblayées au Bure</h3>
                    {metrics.sectorBreakdown.bureImiterEst.minageRows.length === 0 && metrics.sectorBreakdown.bureImiterEst.deblayageRows.length === 0 ? (
                      <p className="text-[10px] text-slate-400 font-bold uppercase text-center py-4 bg-slate-50 rounded-xl">
                        Aucun Forage/Déblayage direct enregistré sur le Bure (Ressources concentrées sur le treuillage).
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {metrics.sectorBreakdown.bureImiterEst.minageRows.length > 0 && (
                          <div className="overflow-x-auto border border-gray-100 rounded-xl">
                            <table className="w-full text-left border-collapse text-[10px]">
                              <thead>
                                <tr className="bg-slate-100 text-slate-700 font-black uppercase">
                                  <th className="p-2">Poste</th>
                                  <th className="p-2">Chantier / Galerie</th>
                                  <th className="p-2">Mineur</th>
                                  <th className="p-2 text-center">Trous Forés</th>
                                  <th className="p-2 text-center">Réalisé (m)</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-100">
                                {metrics.sectorBreakdown.bureImiterEst.minageRows.map((r, i) => (
                                  <tr key={i} className="hover:bg-slate-50">
                                    <td className="p-2 text-[#b8860b] font-black">{r.poste}</td>
                                    <td className="p-2 uppercase font-black">{getChantierName(r.reel?.chantierId)}</td>
                                    <td className="p-2 uppercase">{getPersonnelName(r.reel?.minerMatricule)}</td>
                                    <td className="p-2 text-center font-mono">{r.reel?.realHoles || 0}</td>
                                    <td className="p-2 text-center font-mono font-black">{r.reel?.realMeterage || 0} m</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 3: SECTEURS & POSTES (Drilldown and Comparison) */}
              {activeTab === 'secteurs' && (
                <div className="space-y-8">
                  {/* Sectors Quick Cards Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { id: 'imiter1', label: 'Secteur Imiter 1', totals: metrics.sectorBreakdown.imiter1, color: 'sky' },
                      { id: 'imiter2', label: 'Secteur Imiter 2', totals: metrics.sectorBreakdown.imiter2, color: 'red' },
                      { id: 'imiterEst', label: 'Secteur Imiter Est', totals: metrics.sectorBreakdown.imiterEst, color: 'teal' },
                      { id: 'bureImiterEst', label: 'Bure Imiter Est', totals: metrics.sectorBreakdown.bureImiterEst, color: 'indigo' }
                    ].map(s => {
                      const real = s.totals.realMet;
                      const plan = s.totals.planMet;
                      const pct = plan > 0 ? (real / plan) * 100 : 100;
                      return (
                        <div key={s.id} className="border border-gray-150 p-4 rounded-xl flex flex-col justify-between hover:shadow-2xs transition-all bg-white">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] font-black uppercase text-slate-500">{s.label}</span>
                            <span className={`w-2 h-2 rounded-full bg-${s.color}-500`} />
                          </div>
                          <div className="my-1.5">
                            <span className="text-xl font-black text-slate-800">{real.toFixed(1)} m</span>
                            <span className="text-[9.5px] text-slate-400 font-bold block mt-0.5">Objectif : {plan.toFixed(1)} m ({pct.toFixed(0)}%)</span>
                          </div>
                          <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden mt-2">
                            <div className={`h-full ${getPerformanceBarColor(pct)}`} style={{ width: `${Math.min(100, pct)}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Poste drilldown selector */}
                  <div className="bg-slate-50 border border-slate-150 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Filter className="w-4 h-4 text-slate-500" />
                      <span className="text-xs font-black uppercase text-slate-800">Filtrer par poste de travail :</span>
                    </div>

                    <div className="inline-flex p-1 bg-white border border-slate-200 rounded-xl">
                      {['Tous', 'Poste 1', 'Poste 2', 'Poste 3'].map(p => (
                        <button
                          key={p}
                          onClick={() => setSelectedPosteFilter(p as any)}
                          className={`text-[9.5px] font-black uppercase py-1.5 px-3 rounded-lg cursor-pointer transition-all ${
                            selectedPosteFilter === p ? 'bg-slate-900 text-white' : 'text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Drilling & Minage Master Table */}
                  <div className="bg-white border border-gray-150 rounded-2xl p-5 space-y-4 shadow-2xs">
                    <h3 className="text-xs font-black uppercase text-slate-800">Détail des Tirées (Forage & Minage)</h3>
                    <div className="overflow-x-auto border border-gray-100 rounded-xl">
                      <table className="w-full text-left border-collapse text-[10.5px]">
                        <thead>
                          <tr className="bg-slate-900 text-white uppercase text-[9px] font-bold">
                            <th className="p-2.5">Poste</th>
                            <th className="p-2.5">Secteur</th>
                            <th className="p-2.5">Chantier / Galerie</th>
                            <th className="p-2.5">Forateur / Aide</th>
                            <th className="p-2.5 text-center">Trous Réels</th>
                            <th className="p-2.5 text-center">Réalisé (m)</th>
                            <th className="p-2.5 text-center">Cible (m)</th>
                            <th className="p-2.5 text-center">Rendement m/v</th>
                            <th className="p-2.5">Explosifs</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {metrics.consolidatedMinageRows
                            .filter(row => selectedPosteFilter === 'Tous' || row.poste === selectedPosteFilter)
                            .map((row, idx) => {
                              const r = row.reel || {};
                              const plan = row.plan || {};
                              const yields = r.realRounds > 0 ? (r.realMeterage / r.realRounds) : 0;
                              let statusBadge = 'bg-slate-50 text-slate-500 border-slate-200';
                              if (yields >= 1.5) statusBadge = 'bg-emerald-50 text-emerald-800 border-emerald-200';
                              else if (yields > 0 && yields <= 1.3) statusBadge = 'bg-rose-50 text-rose-800 border-rose-200 animate-pulse';

                              return (
                                <tr key={idx} className="hover:bg-slate-50/50">
                                  <td className="p-2.5 text-[#b8860b] font-black">{row.poste}</td>
                                  <td className="p-2.5 uppercase font-bold text-slate-400">{row.sectorGroup}</td>
                                  <td className="p-2.5 font-black uppercase text-[#b8860b]">{getChantierName(r.chantierId)}</td>
                                  <td className="p-2.5 leading-tight">
                                    <div className="font-bold uppercase">{getPersonnelName(r.minerMatricule)}</div>
                                    <div className="text-[8.5px] text-slate-400 uppercase">Aide: {getPersonnelName(r.assistantMatricule) || 'Aucun'}</div>
                                  </td>
                                  <td className="p-2.5 text-center font-mono">{r.realHoles || 0} trs / {plan.plannedHoles || 0}</td>
                                  <td className="p-2.5 text-center font-mono font-black">{r.realMeterage || 0} m</td>
                                  <td className="p-2.5 text-center font-mono text-slate-400">{(plan.meterage || plan.plannedRounds * 1.7 || 0).toFixed(1)} m</td>
                                  <td className="p-2.5 text-center">
                                    <span className={`px-1.5 py-0.5 border text-[8px] font-black rounded uppercase ${statusBadge}`}>
                                      {yields > 0 ? `${yields.toFixed(2)} m/v` : '0.00'}
                                    </span>
                                  </td>
                                  <td className="p-2.5 font-mono text-[8.5px]">
                                    ANF:{r.anfo || 0} | TOV:{r.tovex || 0}
                                  </td>
                                </tr>
                              );
                            })}
                          {metrics.consolidatedMinageRows.filter(row => selectedPosteFilter === 'Tous' || row.poste === selectedPosteFilter).length === 0 && (
                            <tr>
                              <td colSpan={9} className="p-6 text-center text-slate-400 uppercase font-black">Aucune tirée enregistrée pour ce poste</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Deblayage LHD table */}
                  <div className="bg-white border border-gray-150 rounded-2xl p-5 space-y-4 shadow-2xs">
                    <h3 className="text-xs font-black uppercase text-slate-800">Efficacité des Chargeuses LHD</h3>
                    <div className="overflow-x-auto border border-gray-100 rounded-xl">
                      <table className="w-full text-left border-collapse text-[10.5px]">
                        <thead>
                          <tr className="bg-slate-900 text-white uppercase text-[9px] font-bold">
                            <th className="p-2.5">Poste</th>
                            <th className="p-2.5">Code Engin</th>
                            <th className="p-2.5">Chantier / Galerie</th>
                            <th className="p-2.5">Conducteur de l'Engin</th>
                            <th className="p-2.5 text-center">Godets</th>
                            <th className="p-2.5 text-center">Volume Prévu</th>
                            <th className="p-2.5 text-center">Volume Réel</th>
                            <th className="p-2.5 text-center font-mono">Carburant</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {metrics.consolidatedDeblayageRows
                            .filter(row => selectedPosteFilter === 'Tous' || row.poste === selectedPosteFilter)
                            .map((row, idx) => {
                              const r = row.reel || {};
                              const plan = row.plan || {};
                              return (
                                <tr key={idx} className="hover:bg-slate-50/50">
                                  <td className="p-2.5 text-sky-700 font-black">{row.poste}</td>
                                  <td className="p-2.5"><span className="font-mono bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-[9.5px] font-bold">{r.engineCode || 'LHD'}</span></td>
                                  <td className="p-2.5 font-black uppercase text-[#b8860b]">{getChantierName(r.chantierId)}</td>
                                  <td className="p-2.5 uppercase font-bold">{getPersonnelName(r.driverMatricule)}</td>
                                  <td className="p-2.5 text-center font-mono">{r.godets || 0}</td>
                                  <td className="p-2.5 text-center font-mono text-slate-400">{(plan.volumeEstimated || 0).toFixed(1)} m³</td>
                                  <td className="p-2.5 text-center font-mono font-black text-slate-800 bg-sky-50/20">{(r.volumeEstimated || 0).toFixed(1)} m³</td>
                                  <td className="p-2.5 text-center font-mono text-amber-600 font-bold">{r.gasoil || 0} L</td>
                                </tr>
                              );
                            })}
                          {metrics.consolidatedDeblayageRows.filter(row => selectedPosteFilter === 'Tous' || row.poste === selectedPosteFilter).length === 0 && (
                            <tr>
                              <td colSpan={8} className="p-6 text-center text-slate-400 uppercase font-black">Aucun déblayage enregistré pour ce poste</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: PERFORMANCE RESSOURCES HUMAINES */}
              {activeTab === 'rh' && (
                <div className="space-y-8">
                  {/* Attendance info block */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white border border-gray-150 p-5 rounded-2xl flex items-center justify-between shadow-2xs">
                      <div>
                        <span className="text-[10px] text-slate-400 font-black uppercase">Présence Réelle Effectif</span>
                        <h4 className="text-2xl font-black text-slate-800 my-1">{metrics.realPresence} Agents</h4>
                        <span className="text-[9px] text-slate-500 font-bold uppercase">Mobilisés en fond de mine</span>
                      </div>
                      <HardHat className="w-8 h-8 text-[#b8860b]" />
                    </div>

                    <div className="bg-white border border-gray-150 p-5 rounded-2xl flex items-center justify-between shadow-2xs">
                      <div>
                        <span className="text-[10px] text-slate-400 font-black uppercase">Taux d'Engagement Planifié</span>
                        <h4 className="text-2xl font-black text-slate-800 my-1">
                          {metrics.planPresence > 0 ? ((metrics.realPresence / metrics.planPresence) * 100).toFixed(1) : '100'}%
                        </h4>
                        <span className="text-[9px] text-slate-500 font-bold uppercase">Cible planifiée : {metrics.planPresence}</span>
                      </div>
                      <Activity className="w-8 h-8 text-sky-600" />
                    </div>

                    <div className="bg-white border border-gray-150 p-5 rounded-2xl flex items-center justify-between shadow-2xs">
                      <div>
                        <span className="text-[10px] text-slate-400 font-black uppercase">Productivité Forage Moyenne</span>
                        <h4 className="text-2xl font-black text-slate-800 my-1">
                          {metrics.totalRealRounds > 0 ? (metrics.totalRealMeterage / metrics.totalRealRounds).toFixed(2) : '0.00'} <span className="text-xs font-bold text-slate-400">m/v</span>
                        </h4>
                        <span className="text-[9px] text-slate-500 font-bold uppercase">Sur {metrics.totalRealRounds} volées tirées</span>
                      </div>
                      <Award className="w-8 h-8 text-emerald-600" />
                    </div>
                  </div>

                  {/* Miner Productivity Leaderboard */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white border border-gray-150 p-6 rounded-2xl space-y-4 shadow-2xs">
                      <h3 className="text-xs font-black uppercase text-slate-800 tracking-wide flex items-center gap-1.5">
                        <Award className="w-4 h-4 text-amber-500" /> Leaderboard Mineurs (Performance Forage)
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-[10px]">
                          <thead>
                            <tr className="bg-slate-100 text-slate-700 font-black uppercase">
                              <th className="p-2 text-center w-10">Rang</th>
                              <th className="p-2">Mineur / Matricule</th>
                              <th className="p-2 text-center">Volées</th>
                              <th className="p-2 text-center">Trous</th>
                              <th className="p-2 text-right">Métrage (m)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 font-bold">
                            {leaderboards.rankedMiners.slice(0, 5).map((m, idx) => (
                              <tr key={idx} className="hover:bg-slate-50">
                                <td className="p-2 text-center">
                                  {idx === 0 && '🥇'}
                                  {idx === 1 && '🥈'}
                                  {idx === 2 && '🥉'}
                                  {idx > 2 && `${idx + 1}`}
                                </td>
                                <td className="p-2">
                                  <div className="uppercase font-black text-slate-800">{m.name || m.matricule}</div>
                                  <div className="text-[8.5px] text-slate-400 font-bold">{m.matricule}</div>
                                </td>
                                <td className="p-2 text-center font-mono">{m.rounds}</td>
                                <td className="p-2 text-center font-mono text-slate-500">{m.holes}</td>
                                <td className="p-2 text-right font-mono font-black text-[#b8860b]">{m.meters.toFixed(1)} m</td>
                              </tr>
                            ))}
                            {leaderboards.rankedMiners.length === 0 && (
                              <tr>
                                <td colSpan={5} className="p-4 text-center text-slate-400 uppercase font-black">Aucune performance individuelle détectée</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    <div className="bg-white border border-gray-150 p-6 rounded-2xl space-y-4 shadow-2xs">
                      <h3 className="text-xs font-black uppercase text-slate-800 tracking-wide flex items-center gap-1.5">
                        <Truck className="w-4 h-4 text-sky-500" /> Leaderboard LHD (Volumes Déblayés)
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse text-[10px]">
                          <thead>
                            <tr className="bg-slate-100 text-slate-700 font-black uppercase">
                              <th className="p-2 text-center w-10">Rang</th>
                              <th className="p-2">Conducteur / Matricule</th>
                              <th className="p-2 text-center">Postes</th>
                              <th className="p-2 text-center">Godets</th>
                              <th className="p-2 text-right">Volume (m³)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 font-bold">
                            {leaderboards.rankedDrivers.slice(0, 5).map((d, idx) => (
                              <tr key={idx} className="hover:bg-slate-50">
                                <td className="p-2 text-center">
                                  {idx === 0 && '🥇'}
                                  {idx === 1 && '🥈'}
                                  {idx === 2 && '🥉'}
                                  {idx > 2 && `${idx + 1}`}
                                </td>
                                <td className="p-2">
                                  <div className="uppercase font-black text-slate-800">{d.name || d.matricule}</div>
                                  <div className="text-[8.5px] text-slate-400 font-bold">{d.matricule}</div>
                                </td>
                                <td className="p-2 text-center font-mono">{d.count}</td>
                                <td className="p-2 text-center font-mono text-slate-500">{d.godets}</td>
                                <td className="p-2 text-right font-mono font-black text-sky-700">{d.volume.toFixed(1)} m³</td>
                              </tr>
                            ))}
                            {leaderboards.rankedDrivers.length === 0 && (
                              <tr>
                                <td colSpan={5} className="p-4 text-center text-slate-400 uppercase font-black">Aucune performance individuelle détectée</td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: MATÉRIEL & MAINTENANCE */}
              {activeTab === 'materiel' && (
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white border border-gray-150 p-5 rounded-2xl flex items-center justify-between shadow-2xs">
                      <div>
                        <span className="text-[10px] text-slate-400 font-black uppercase">Engins Actifs Détectés</span>
                        <h4 className="text-2xl font-black text-slate-800 my-1">{lhdStats.length} Machines</h4>
                        <span className="text-[9px] text-slate-500 font-bold uppercase">LHD mobilisées sur la période</span>
                      </div>
                      <Cpu className="w-8 h-8 text-purple-600" />
                    </div>

                    <div className="bg-white border border-gray-150 p-5 rounded-2xl flex items-center justify-between shadow-2xs">
                      <div>
                        <span className="text-[10px] text-slate-400 font-black uppercase">Volume Moyen par Engin</span>
                        <h4 className="text-2xl font-black text-slate-800 my-1">
                          {lhdStats.length > 0 ? (metrics.totalRealVolume / lhdStats.length).toFixed(1) : '0.0'} m³
                        </h4>
                        <span className="text-[9px] text-slate-500 font-bold uppercase">Sur la période consolidée</span>
                      </div>
                      <Layers className="w-8 h-8 text-emerald-600" />
                    </div>

                    <div className="bg-white border border-gray-150 p-5 rounded-2xl flex items-center justify-between shadow-2xs">
                      <div>
                        <span className="text-[10px] text-slate-400 font-black uppercase">Cumul Heures Maintenance</span>
                        <h4 className="text-2xl font-black text-purple-700 my-1">{metrics.totalRealMaintHours.toFixed(1)} Heures</h4>
                        <span className="text-[9px] text-slate-500 font-bold uppercase">Interventions brigades techniques</span>
                      </div>
                      <Wrench className="w-8 h-8 text-purple-500" />
                    </div>
                  </div>

                  {/* Loader Specific Fleet Performance */}
                  <div className="bg-white border border-gray-150 rounded-2xl p-5 space-y-4 shadow-2xs">
                    <h3 className="text-xs font-black uppercase text-slate-800">Efficacité Énergétique & Volumes LHD</h3>
                    <div className="overflow-x-auto border border-gray-100 rounded-xl">
                      <table className="w-full text-left border-collapse text-[10.5px]">
                        <thead>
                          <tr className="bg-slate-900 text-white uppercase text-[9px] font-bold">
                            <th className="p-2.5">Code Engin LHD</th>
                            <th className="p-2.5 text-center">Postes Actifs</th>
                            <th className="p-2.5 text-center">Volume Cumulé</th>
                            <th className="p-2.5 text-center">Gasoil Cumulé (L)</th>
                            <th className="p-2.5 text-center">Heures Maintenance</th>
                            <th className="p-2.5 text-center">Ratio L / m³</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {lhdStats.map((engine, idx) => {
                            const ratio = engine.volume > 0 ? engine.gasoil / engine.volume : 0;
                            return (
                              <tr key={idx} className="hover:bg-slate-50/50">
                                <td className="p-2.5 font-mono font-extrabold text-slate-800 text-base">{engine.code}</td>
                                <td className="p-2.5 text-center font-bold text-slate-600">{engine.countDeblayage} shifts</td>
                                <td className="p-2.5 text-center font-mono font-extrabold text-slate-900 bg-sky-50/15">{engine.volume.toFixed(1)} m³</td>
                                <td className="p-2.5 text-center font-mono text-amber-600 font-bold">{engine.gasoil} L</td>
                                <td className="p-2.5 text-center font-mono text-purple-700 font-bold">{engine.hoursMaint.toFixed(1)} h ({engine.countMaint} int)</td>
                                <td className="p-2.5 text-center font-mono font-black text-slate-800">{ratio > 0 ? `${ratio.toFixed(2)} L/m³` : '-'}</td>
                              </tr>
                            );
                          })}
                          {lhdStats.length === 0 && (
                            <tr>
                              <td colSpan={6} className="p-4 text-center text-slate-400 uppercase font-black">Aucun engin LHD actif sur cette période</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Technical Maintenance Registry */}
                  <div className="bg-white border border-gray-150 rounded-2xl p-5 space-y-4 shadow-2xs">
                    <h3 className="text-xs font-black uppercase text-slate-800">Registre Clinique des Interventions de Maintenance</h3>
                    <div className="overflow-x-auto border border-gray-100 rounded-xl">
                      <table className="w-full text-left border-collapse text-[10.5px]">
                        <thead>
                          <tr className="bg-slate-900 text-white uppercase text-[9px] font-bold">
                            <th className="p-2.5">Poste</th>
                            <th className="p-2.5">Technicien / Brigade</th>
                            <th className="p-2.5">Machine / Code</th>
                            <th className="p-2.5 text-center">Durée Intervention</th>
                            <th className="p-2.5">Descriptif des Travaux Clés</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {metrics.consolidatedMaintenanceRows.map((row, idx) => {
                            const r = row.reel || {};
                            const duration = Number(r.hoursSpent || 0);
                            return (
                              <tr key={idx} className="hover:bg-purple-50/5">
                                <td className="p-2.5 text-purple-700 font-black">{row.poste}</td>
                                <td className="p-2.5 uppercase font-black text-slate-800">{getPersonnelName(r.agentMatricule || r.mechanicMatricule)}</td>
                                <td className="p-2.5"><span className="font-mono bg-purple-50 text-purple-800 px-2 py-0.5 border border-purple-100 rounded text-[9.5px] font-bold">{r.engineCode || r.engineId || '-'}</span></td>
                                <td className="p-2.5 text-center font-mono font-extrabold text-purple-900">{duration.toFixed(1)} h</td>
                                <td className="p-2.5 text-slate-600 font-medium leading-relaxed">{r.workDescription || 'Maintenance curative programmée'}</td>
                              </tr>
                            );
                          })}
                          {metrics.consolidatedMaintenanceRows.length === 0 && (
                            <tr>
                              <td colSpan={5} className="p-4 text-center text-slate-400 uppercase font-black">Aucune intervention de maintenance déclarée</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
