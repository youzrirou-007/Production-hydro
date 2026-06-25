import React, { useState, useEffect, useMemo } from 'react';
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
import { ExpressDirectionScorecard } from '../components/ExpressDirectionScorecard';
import { ChantierAnalysisPremium } from '../components/ChantierAnalysisPremium';
import { BureImiterEstPremium } from '../components/BureImiterEstPremium';
import { SmartAlertsCenter } from '../components/SmartAlertsCenter';
import { 
  calculateMinerStats, 
  calculateDriverStats, 
  calculateChiefStats, 
  calculateAssistantMinerStats 
} from '../lib/rhCalculations';

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
  const [activeTab, setActiveTab] = useState<'cockpit' | 'alerts' | 'chantiers_premium' | 'sectors_compare' | 'rankings' | 'trends' | 'bure' | 'secteurs' | 'rh' | 'materiel'>('cockpit');
  const [hrSearchMatricule, setHrSearchMatricule] = useState('');
  
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

  // MEMORY INDEX MAPS FOR INSTANT O(1) LOOKUPS
  const chantiersMap = useMemo(() => new Map(chantiers.map(c => [c.id, c])), [chantiers]);
  const employeesMap = useMemo(() => new Map(employees.map(e => [e.matricule?.toUpperCase() || '', e])), [employees]);
  const productionMap = useMemo(() => new Map(allProductionDocs.map(d => [d.id, d])), [allProductionDocs]);
  const planningMap = useMemo(() => new Map(allPlanningSheets.map(d => [d.id, d])), [allPlanningSheets]);

  // Resolvers using memory indexes
  const getChantierName = (id: string) => {
    if (!id) return 'N/A';
    if (id.startsWith('stock_')) return id.replace('stock_', 'STOCK : ').toUpperCase();
    const match = chantiersMap.get(id);
    return match ? match.name : id;
  };

  const getPersonnelName = (matricule: string) => {
    if (!matricule) return '';
    const match = employeesMap.get(matricule.toUpperCase().trim());
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
      const matched = chantiersMap.get(chantierId);
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

  // MEMOIZED Main Aggregator Engine
  const metrics = useMemo(() => {
    let alignedDays: { prodDate: string; planDate: string; prodDoc: any; planDoc: any }[] = [];

    if (reportType === 'day') {
      const prevDate = getPreviousDateStr(filterDate);
      const pDoc = productionMap.get(filterDate);
      const sDoc = planningMap.get(prevDate);
      alignedDays.push({ prodDate: filterDate, planDate: prevDate, prodDoc: pDoc || null, planDoc: sDoc || null });
    } else {
      try {
        const start = startOfMonth(parseISO(filterMonth + '-01'));
        const end = endOfMonth(start);
        const days = eachDayOfInterval({ start, end });
        days.forEach(day => {
          const dateStr = format(day, 'yyyy-MM-dd');
          const prevDateStr = getPreviousDateStr(dateStr);
          const pDoc = productionMap.get(dateStr);
          const sDoc = planningMap.get(prevDateStr);
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
  }, [reportType, filterDate, filterMonth, productionMap, planningMap, chantiersMap]);

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

  // PREMIUM EXECUTIVE BUSINESS ALERTS ENGINE (MISSION 3)
  const smartExecutiveAlerts = useMemo(() => {
    const list: {
      id: string;
      type: 'red' | 'amber' | 'blue';
      title: string;
      message: string;
      category: 'FORAGE' | 'DÉBLAYAGE' | 'EXTRACTION' | 'MAINTENANCE' | 'ÉNERGIE' | 'RH' | 'GLOBAL';
      metric: string;
      deviation?: string;
    }[] = [];

    if (allProductionDocs.length === 0) return list;

    // A. Reference latest database date
    const sortedDocs = [...allProductionDocs].sort((a, b) => a.id.localeCompare(b.id));
    const latestDocId = sortedDocs[sortedDocs.length - 1]?.id || format(new Date(), 'yyyy-MM-dd');

    // Indices and sums
    const chantierMeters: { [cId: string]: number } = {};
    const chantierPlannedMeters: { [cId: string]: number } = {};
    const chantierLastActiveDate: { [cId: string]: string } = {};

    const chiefMeters: { [matricule: string]: number } = {};
    const chiefPlannedMeters: { [matricule: string]: number } = {};

    const driverLastActiveDate: { [matricule: string]: string } = {};

    const sectorScores: { [sec: string]: { realMet: number; planMet: number; realVol: number; planVol: number } } = {
      'imiter 1': { realMet: 0, planMet: 0, realVol: 0, planVol: 0 },
      'imiter 2': { realMet: 0, planMet: 0, realVol: 0, planVol: 0 },
      'imiter est': { realMet: 0, planMet: 0, realVol: 0, planVol: 0 },
      'bure imiter est': { realMet: 0, planMet: 0, realVol: 0, planVol: 0 }
    };

    allProductionDocs.forEach(pDoc => {
      const dateStr = pDoc.id;
      const prevDateStr = getPreviousDateStr(dateStr);
      const sDoc = planningMap.get(prevDateStr);

      ['poste1', 'poste2', 'poste3'].forEach(pKey => {
        const postObj = pDoc.postes?.[pKey] || {};
        const planPostObj = sDoc?.postes?.[pKey] || {};

        // Minage
        (postObj.minage || []).forEach((row: any) => {
          const r = row.reel || row || {};
          const cId = r.chantierId;
          const sec = (getRecordSectorGroup(r) || '').toLowerCase().trim();
          const meters = Number(r.realMeterage || 0);

          if (cId) {
            chantierMeters[cId] = (chantierMeters[cId] || 0) + meters;
            if (meters > 0) {
              if (!chantierLastActiveDate[cId] || dateStr > chantierLastActiveDate[cId]) {
                chantierLastActiveDate[cId] = dateStr;
              }
            }
          }

          if (sec && sectorScores[sec]) {
            sectorScores[sec].realMet += meters;
          }

          const chiefMat = r.chiefMatricule || r.chefEquipe || postObj.chiefMatricule;
          if (chiefMat) {
            const uChief = chiefMat.toUpperCase().trim();
            chiefMeters[uChief] = (chiefMeters[uChief] || 0) + meters;
          }
        });

        if (sDoc) {
          (planPostObj.minage || []).forEach((row: any) => {
            const cId = row.chantierId;
            const sec = (getRecordSectorGroup(row) || '').toLowerCase().trim();
            const meters = Number(row.meterage || row.plannedRounds * 1.7 || 0);
            if (cId) {
              chantierPlannedMeters[cId] = (chantierPlannedMeters[cId] || 0) + meters;
            }
            if (sec && sectorScores[sec]) {
              sectorScores[sec].planMet += meters;
            }
            const chiefMat = row.chiefMatricule || row.chefEquipe || planPostObj.chiefMatricule;
            if (chiefMat) {
              const uChief = chiefMat.toUpperCase().trim();
              chiefPlannedMeters[uChief] = (chiefPlannedMeters[uChief] || 0) + meters;
            }
          });
        }

        // Deblayage
        (postObj.deblayage || []).forEach((row: any) => {
          const r = row.reel || row || {};
          const cId = r.chantierId;
          const sec = (getRecordSectorGroup(r) || '').toLowerCase().trim();
          const vol = Number(r.volumeEstimated || 0);
          const driver = r.driverMatricule || r.operatorMatricule;

          if (cId) {
            if (vol > 0) {
              if (!chantierLastActiveDate[cId] || dateStr > chantierLastActiveDate[cId]) {
                chantierLastActiveDate[cId] = dateStr;
              }
            }
          }

          if (sec && sectorScores[sec]) {
            sectorScores[sec].realVol += vol;
          }

          if (driver) {
            const uDriver = driver.toUpperCase().trim();
            if (vol > 0) {
              if (!driverLastActiveDate[uDriver] || dateStr > driverLastActiveDate[uDriver]) {
                driverLastActiveDate[uDriver] = dateStr;
              }
            }
          }
        });

        if (sDoc) {
          (planPostObj.deblayage || []).forEach((row: any) => {
            const sec = (getRecordSectorGroup(row) || '').toLowerCase().trim();
            const vol = Number(row.volumeEstimated || 0);
            if (sec && sectorScores[sec]) {
              sectorScores[sec].planVol += vol;
            }
          });
        }
      });
    });

    // -------------------------------------------------------------
    // ALERTS COMPILED BY REAL COOPERATIVE ALGORITHMS
    // -------------------------------------------------------------

    // 1. Chantier sans activité depuis plusieurs jours (🔴)
    chantiers.forEach(c => {
      const cId = c.id;
      if (cId.startsWith('stock_')) return;
      const lastActive = chantierLastActiveDate[cId];
      if (!lastActive) {
        list.push({
          id: `no-act-never-${cId}`,
          type: 'red',
          title: "CHANTIER SANS ACTIVITÉ DEPUIS SA CRÉATION 🔴",
          message: `Le chantier de forage ou de déblayage "${c.name}" ne présente aucune fiche d'activité dans l'historique disponible.`,
          category: 'GLOBAL',
          metric: 'Aucun enregistrement'
        });
      } else {
        try {
          const d1 = new Date(lastActive + 'T12:00:00');
          const d2 = new Date(latestDocId + 'T12:00:00');
          const diffDays = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays >= 4) {
            list.push({
              id: `no-act-recent-${cId}`,
              type: 'red',
              title: "ARRÊT CRITIQUE D'ACTIVITÉ SUR FRONT 🔴",
              message: `Le chantier "${c.name}" n'a enregistré aucune activité depuis ${diffDays} jours d'exploitation. Dernier poste actif le ${lastActive}.`,
              category: 'GLOBAL',
              metric: `Inactif depuis ${diffDays} j`,
              deviation: `Interruption prolongée`
            });
          }
        } catch (e) {}
      }
    });

    // 2. Chantier en retard significatif (🔴)
    chantiers.forEach(c => {
      const cId = c.id;
      const real = chantierMeters[cId] || 0;
      const plan = chantierPlannedMeters[cId] || 0;
      if (plan > 8) {
        const rate = (real / plan) * 100;
        if (rate < 75) {
          list.push({
            id: `retard-significatif-${cId}`,
            type: 'red',
            title: "RETARD AVANCEMENT DE FRONT DE TAILLE 🔴",
            message: `Le chantier "${c.name}" affiche un retard d'avancement majeur : seulement ${real.toFixed(1)}m forés sur un objectif planifié de ${plan.toFixed(1)}m.`,
            category: 'FORAGE',
            metric: `${rate.toFixed(0)}% d'avancement`,
            deviation: `Déficit de ${(plan - real).toFixed(1)}m`
          });
        }
      }
    });

    // 3. Secteur sous la moyenne globale (🔴)
    let totalRealMetSectors = 0, totalPlanMetSectors = 0;
    let totalRealVolSectors = 0, totalPlanVolSectors = 0;

    Object.values(sectorScores).forEach(s => {
      totalRealMetSectors += s.realMet;
      totalPlanMetSectors += s.planMet;
      totalRealVolSectors += s.realVol;
      totalPlanVolSectors += s.planVol;
    });

    const globalForageRate = totalPlanMetSectors > 0 ? (totalRealMetSectors / totalPlanMetSectors) * 100 : 100;
    const globalDeblayageRate = totalPlanVolSectors > 0 ? (totalRealVolSectors / totalPlanVolSectors) * 100 : 100;
    const globalMoy = (Math.min(100, globalForageRate) * 0.60 + Math.min(100, globalDeblayageRate) * 0.40);

    Object.entries(sectorScores).forEach(([sec, stats]) => {
      const sForageRate = stats.planMet > 0 ? (stats.realMet / stats.planMet) * 100 : 100;
      const sDeblayageRate = stats.planVol > 0 ? (stats.realVol / stats.planVol) * 100 : 100;
      const sScore = (Math.min(100, sForageRate) * 0.60 + Math.min(100, sDeblayageRate) * 0.40);

      if (sScore < globalMoy * 0.85 && sScore < 80) {
        list.push({
          id: `sector-underperforming-${sec}`,
          type: 'red',
          title: "SÉGREGATION DE RENDEMENT SÉVÈRE PAR SECTEUR 🔴",
          message: `Le secteur d'extraction "${sec.toUpperCase()}" a un score global de ${sScore.toFixed(0)}%, significativement sous la moyenne générale d'exploitation (${globalMoy.toFixed(0)}%).`,
          category: 'GLOBAL',
          metric: `${sScore.toFixed(0)}% vs ${globalMoy.toFixed(0)}% avg`,
          deviation: `Sous-performance secteur`
        });
      }
    });

    // 4. Chef dont le rendement global est inférieur à la moyenne (🔴)
    const chiefRates: { matricule: string; rate: number }[] = [];
    Object.keys(chiefMeters).forEach(mat => {
      const real = chiefMeters[mat] || 0;
      const plan = chiefPlannedMeters[mat] || 0;
      if (plan > 5) {
        chiefRates.push({ matricule: mat, rate: (real / plan) * 100 });
      }
    });

    if (chiefRates.length > 1) {
      const avgChiefRate = chiefRates.reduce((acc, c) => acc + c.rate, 0) / chiefRates.length;
      chiefRates.forEach(c => {
        if (c.rate < avgChiefRate * 0.80 && c.rate < 75) {
          list.push({
            id: `chief-underperforming-${c.matricule}`,
            type: 'red',
            title: "SOUS-PERFORMANCE DE COMPÉTENCE (CHEF D'ÉQUIPE) 🔴",
            message: `La brigade dirigée par le chef d'équipe "${getPersonnelName(c.matricule)}" affiche un rendement linéaire de ${c.rate.toFixed(0)}%, en retrait de la moyenne des brigades (${avgChiefRate.toFixed(0)}%).`,
            category: 'RH',
            metric: `${c.rate.toFixed(0)}% de rendement`,
            deviation: `Écart de ${(avgChiefRate - c.rate).toFixed(0)}%`
          });
        }
      });
    }

    // 5. Conducteur sans activité récente (🔴)
    const drivers = employees.filter(e => {
      const role = (e.role || e.fonction || '').toLowerCase();
      return role.includes('lhd') || role.includes('conducteur') || role.includes('operateur') || role.includes('operator');
    });

    drivers.forEach(dr => {
      const mat = dr.matricule;
      if (!mat) return;
      const uMat = mat.toUpperCase().trim();
      const lastActive = driverLastActiveDate[uMat];
      if (!lastActive) {
        list.push({
          id: `driver-never-active-${uMat}`,
          type: 'amber',
          title: "CONDUCTEUR LHD INACTIF SUR LA PÉRIODE ⚠️",
          message: `Le conducteur d'engin LHD "${dr.nom} ${dr.prenom}" n'a enregistré aucune production déblayée sur la période.`,
          category: 'RH',
          metric: 'Inactif'
        });
      } else {
        try {
          const d1 = new Date(lastActive + 'T12:00:00');
          const d2 = new Date(latestDocId + 'T12:00:00');
          const diffDays = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
          if (diffDays >= 4) {
            list.push({
              id: `driver-inactive-recent-${uMat}`,
              type: 'red',
              title: "INACTIVITÉ CONSTATÉE (CONDUCTEUR LHD) 🔴",
              message: `Le conducteur d'engin "${dr.nom} ${dr.prenom}" n'a pas enregistré de volume sur chargeuse depuis ${diffDays} jours d'exploitation.`,
              category: 'RH',
              metric: `Inactif depuis ${diffDays} j`,
              deviation: `Inactivité prolongée`
            });
          }
        } catch (e) {}
      }
    });

    // 6. Poste en baisse continue & Dégradation d'un indicateur
    if (sortedDocs.length >= 3) {
      const dailyScores = sortedDocs.slice(-3).map(doc => {
        let realM = 0, planM = 0, realV = 0, planV = 0, realW = 0, planW = 0;
        const sDoc = planningMap.get(getPreviousDateStr(doc.id));
        ['poste1', 'poste2', 'poste3'].forEach(pKey => {
          const pObj = doc.postes?.[pKey] || {};
          const planObj = sDoc?.postes?.[pKey] || {};

          (pObj.minage || []).forEach((r: any) => realM += Number(r.reel?.realMeterage || r.realMeterage || 0));
          (pObj.deblayage || []).forEach((r: any) => realV += Number(r.reel?.volumeEstimated || r.volumeEstimated || 0));
          (pObj.extraction || []).forEach((r: any) => realW += Number(r.reel?.wagonsActual || r.wagonsActual || 0));

          if (sDoc) {
            (planObj.minage || []).forEach((r: any) => planM += Number(r.meterage || r.plannedRounds * 1.7 || 0));
            (planObj.deblayage || []).forEach((r: any) => planV += Number(r.volumeEstimated || 0));
            (planObj.extraction || []).forEach((r: any) => planW += Number(r.wagonsTarget || 48));
          }
        });

        const fRate = planM > 0 ? (realM / planM) * 100 : 100;
        const dRate = planV > 0 ? (realV / planV) * 100 : 100;
        const eRate = planW > 0 ? (realW / planW) * 100 : 100;
        return (Math.min(100, fRate) * 0.40 + Math.min(100, dRate) * 0.30 + Math.min(100, eRate) * 0.30);
      });

      if (dailyScores[2] < dailyScores[1] && dailyScores[1] < dailyScores[0]) {
        const pctDrop = dailyScores[0] - dailyScores[2];
        list.push({
          id: `trend-baisse-continue`,
          type: 'red',
          title: "BAISSE CONTINUE DU RENDEMENT MINIÈRE 🔴",
          message: `Les rendements pondérés de la mine affichent une régression continue sur les 3 derniers jours d'exploitation, chutant de ${dailyScores[0].toFixed(0)}% à ${dailyScores[2].toFixed(0)}%.`,
          category: 'GLOBAL',
          metric: `-${pctDrop.toFixed(0)}% sur 3j`,
          deviation: `Régression continue`
        });
      }
    }

    // 7. Écart anormal plan vs réel (🔴)
    if (totalPlanMetSectors > 10) {
      const pct = (totalRealMetSectors / totalPlanMetSectors) * 100;
      if (pct < 65) {
        list.push({
          id: `global-planning-gap`,
          type: 'red',
          title: "ÉCART CRITIQUE PLANIFICATION VS RÉALISATION 🔴",
          message: `L'écart de production linéaire globale est anormal : la mine réalise seulement ${totalRealMetSectors.toFixed(1)}m sur les ${totalPlanMetSectors.toFixed(1)}m prévus, soit un déficit de -${(100 - pct).toFixed(0)}%.`,
          category: 'GLOBAL',
          metric: `${pct.toFixed(0)}% de réalisation`,
          deviation: `Déficit de ${(totalPlanMetSectors - totalRealMetSectors).toFixed(1)}m`
        });
      }
    }

    // 8. Bure en situation de saturation (⚠️)
    const bureStats = sectorScores['bure imiter est'] || { realMet: 0, planMet: 0, realVol: 0, planVol: 0 };
    let totalBureWagons = 0;
    allProductionDocs.forEach(pDoc => {
      ['poste1', 'poste2', 'poste3'].forEach(pKey => {
        (pDoc.postes?.[pKey]?.extraction || []).forEach((row: any) => {
          totalBureWagons += Number(row.reel?.wagonsActual || row.wagonsActual || 0);
        });
      });
    });

    const extractionTonnage = totalBureWagons * 1.4;
    const deblayageTonnage = bureStats.realVol * 1.6;

    if (deblayageTonnage > 0 && extractionTonnage > 0 && deblayageTonnage > extractionTonnage * 1.25) {
      list.push({
        id: `bure-saturation`,
        type: 'amber',
        title: "BURE EN SITUATION DE SATURATION ⚠️",
        message: `Les stocks de minerais déblayés au Bure dépassent largement les cadences d'extraction par wagons (${deblayageTonnage.toFixed(0)} T déblayées vs ${extractionTonnage.toFixed(0)} T treuillées).`,
        category: 'EXTRACTION',
        metric: `Ratio tonnage : ${(deblayageTonnage / extractionTonnage).toFixed(1)}x`,
        deviation: `Engorgement d'extraction`
      });
    }

    // 9. Déblayage insuffisant par rapport au forage (⚠️)
    if (globalForageRate > 85 && globalDeblayageRate < 65) {
      list.push({
        id: `undermucking-forage-high`,
        type: 'amber',
        title: "DÉBLAYAGE INSUFFISANT PAR RAPPORT AU FORAGE ⚠️",
        message: `Sous-déblayage constaté : Le forage avance à un rythme de ${globalForageRate.toFixed(0)}%, mais le déblaiement LHD stagne à seulement ${globalDeblayageRate.toFixed(0)}%. Risque de blocage des fronts de tir.`,
        category: 'DÉBLAYAGE',
        metric: `${globalDeblayageRate.toFixed(0)}% déblayage vs ${globalForageRate.toFixed(0)}% forage`,
        deviation: `Engorgement des fronts`
      });
    }

    // 10. Extraction insuffisante par rapport au déblayage (⚠️)
    let totalWagonsReal = 0, totalWagonsPlan = 0;
    allProductionDocs.forEach(pDoc => {
      const sDoc = planningMap.get(getPreviousDateStr(pDoc.id));
      ['poste1', 'poste2', 'poste3'].forEach(pKey => {
        (pDoc.postes?.[pKey]?.extraction || []).forEach((row: any) => {
          totalWagonsReal += Number(row.reel?.wagonsActual || row.wagonsActual || 0);
          totalWagonsPlan += Number(row.reel?.wagonsTarget || row.plan?.wagonsTarget || row.wagonsTarget || 48);
        });
      });
    });

    const wagonsRateGlobal = totalWagonsPlan > 0 ? (totalWagonsReal / totalWagonsPlan) * 100 : 100;
    if (globalDeblayageRate > 85 && wagonsRateGlobal < 65) {
      list.push({
        id: `underextraction-mucking-high`,
        type: 'amber',
        title: "EXTRACTION INSUFFISANTE PAR RAPPORT AU DÉBLAYAGE ⚠️",
        message: `Goulot d'évacuation : Le déblayage LHD des galeries est optimal (${globalDeblayageRate.toFixed(0)}%), mais le treuillage de wagons est à la traîne à ${wagonsRateGlobal.toFixed(0)}%.`,
        category: 'EXTRACTION',
        metric: `${wagonsRateGlobal.toFixed(0)}% wagons vs ${globalDeblayageRate.toFixed(0)}% déblayage`,
        deviation: `Treuillage insuffisant`
      });
    }

    // Sort: Red severity first, then Amber, then Blue
    const severityOrder = { red: 0, amber: 1, blue: 2 };
    return list.sort((a, b) => severityOrder[a.type] - severityOrder[b.type]);
  }, [allProductionDocs, allPlanningSheets, chantiers, employees, planningMap]);

  // Fallback statistical anomalies compiler (maintains backwards compatibility)
  const getAutomaticAlerts = () => {
    return smartExecutiveAlerts.map(a => ({
      type: a.type,
      message: a.title.replace(/[🔴⚠️]/g, '').trim(),
      sub: a.message
    }));
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
          { id: 'alerts', label: "Centre d'Alertes", icon: <ShieldAlert className="w-4 h-4 text-rose-500 animate-pulse" /> },
          { id: 'chantiers_premium', label: 'Analyse Chantiers', icon: <Gauge className="w-4 h-4" /> },
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
              {/* TAB: ALERTS CENTER */}
              {activeTab === 'alerts' && (
                <SmartAlertsCenter 
                  allProductionDocs={allProductionDocs}
                  allPlanningSheets={allPlanningSheets}
                  chantiers={chantiers}
                  employees={employees}
                  engines={engines}
                  smartExecutiveAlerts={smartExecutiveAlerts}
                />
              )}

              {/* TAB: CHANTIERS PREMIUM */}
              {activeTab === 'chantiers_premium' && (
                <ChantierAnalysisPremium 
                  allProductionDocs={allProductionDocs}
                  allPlanningSheets={allPlanningSheets}
                  chantiers={chantiers}
                />
              )}

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
                  {/* ACTIONS PRIORITAIRES DU JOUR BLOCK */}
                  {(() => {
                    const priorities = smartExecutiveAlerts.filter(a => a.type === 'red' || a.type === 'amber').slice(0, 4);
                    
                    return (
                      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
                        {/* Background subtle mesh or gradient */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-slate-950 via-slate-900 to-slate-900/40 opacity-90 z-0" />
                        <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#b8860b]/10 rounded-full blur-3xl" />
                        
                        <div className="relative z-10 space-y-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
                            <div className="flex items-center gap-2.5">
                              <span className="p-2 bg-[#b8860b]/20 text-[#ffd700] rounded-xl border border-[#b8860b]/30">
                                <Activity className="w-5 h-5" />
                              </span>
                              <div>
                                <h3 className="text-sm font-black uppercase tracking-wider text-slate-100 flex items-center gap-2">
                                  🎯 ACTIONS PRIORITAIRES DU JOUR
                                </h3>
                                <p className="text-[10px] text-slate-400 font-medium">Diagnostic quotidien automatisé à destination de la Direction Générale</p>
                              </div>
                            </div>
                            <span className="text-[8.5px] font-black uppercase bg-[#b8860b]/20 text-[#ffd700] border border-[#b8860b]/40 px-3 py-1 rounded-full tracking-wider">
                              Arbitrage Décisionnel
                            </span>
                          </div>

                          {priorities.length === 0 ? (
                            <div className="flex items-center gap-3 bg-slate-950/40 border border-emerald-500/30 p-4 rounded-xl text-emerald-400">
                              <CheckCircle className="w-5 h-5 flex-shrink-0" />
                              <div>
                                <span className="text-[11px] font-black uppercase block">Toutes les opérations sont fluides</span>
                                <span className="text-[10px] text-slate-400 font-medium">Aucun goulot d'étranglement ou anomalie majeure détectée sur les chantiers actifs aujourd'hui.</span>
                              </div>
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              {priorities.map((p, idx) => {
                                // Get matching icon
                                let IconComp = AlertTriangle;
                                if (p.category === 'FORAGE') IconComp = Bomb;
                                else if (p.category === 'DÉBLAYAGE') IconComp = Truck;
                                else if (p.category === 'EXTRACTION') IconComp = Train;
                                else if (p.category === 'RH') IconComp = HardHat;
                                else if (p.category === 'MAINTENANCE') IconComp = Wrench;

                                const isRed = p.type === 'red';
                                const badgeColor = isRed ? 'bg-rose-500/15 text-rose-400 border-rose-500/30' : 'bg-amber-500/15 text-amber-400 border-amber-500/30';
                                const actionText = isRed ? 'Action Immédiate' : 'Surveillance';

                                return (
                                  <div key={p.id || idx} className="bg-slate-950/50 border border-slate-800 hover:border-slate-700 transition p-4 rounded-xl flex items-start gap-3">
                                    <span className={`p-2 rounded-lg border ${isRed ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'} flex-shrink-0`}>
                                      <IconComp className="w-4 h-4" />
                                    </span>
                                    <div className="space-y-1 min-w-0 flex-1">
                                      <div className="flex items-center justify-between gap-2">
                                        <span className="text-[10px] font-black uppercase text-slate-200 tracking-wide truncate block">{p.title.replace(/[🔴⚠️]/g, '').trim()}</span>
                                        <span className={`text-[8px] font-black uppercase px-2 py-0.5 border rounded-full shrink-0 ${badgeColor}`}>
                                          {actionText}
                                        </span>
                                      </div>
                                      <p className="text-[10px] text-slate-400 font-medium leading-relaxed">{p.message}</p>
                                      
                                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pt-1.5 text-[9px] text-slate-500 font-bold border-t border-slate-900">
                                        {p.metric && <span>Métrique: <span className="text-slate-300 font-mono">{p.metric}</span></span>}
                                        {p.deviation && <span>Déviation: <span className="text-rose-400 font-mono">{p.deviation}</span></span>}
                                      </div>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Vue Direction Générale Express */}
                  <ExpressDirectionScorecard 
                    allProductionDocs={allProductionDocs}
                    allPlanningSheets={allPlanningSheets}
                  />

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
                  <SmartAlertsCenter 
                    allProductionDocs={allProductionDocs}
                    allPlanningSheets={allPlanningSheets}
                    chantiers={chantiers}
                    employees={employees}
                    engines={engines}
                    smartExecutiveAlerts={smartExecutiveAlerts}
                  />
                </div>
              )}

              {/* TAB 2: FOCUS BURE IMITER EST (Extraction stratégique) */}
              {activeTab === 'bure' && (
                <BureImiterEstPremium 
                  allProductionDocs={allProductionDocs}
                  allPlanningSheets={allPlanningSheets}
                />
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

                  {/* PREMIUM DYNAMIC HR INDIVIDUAL PROFILE ENGINE (MODULE 6) */}
                  <div className="bg-slate-900 border border-slate-800 text-white rounded-3xl p-6 space-y-4 shadow-lg">
                    <div className="border-b border-slate-800 pb-3">
                      <span className="text-[#ffd700] text-[8.5px] font-black uppercase tracking-widest block">Module Préparatoire aux Dossiers RH</span>
                      <h3 className="text-xs font-black uppercase tracking-wide text-white mt-1">Calculateur de Rendement Individuel Premium</h3>
                      <p className="text-[9.5px] text-slate-400 font-medium leading-normal mt-1">
                        Recherche et calcule instantanément l'empreinte de rendement d'un agent de la SMI à partir des tables Firestore de Forage, Déblayage et Extraction.
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 items-end">
                      <div className="w-full sm:w-80">
                        <label className="text-[8.5px] text-slate-400 uppercase font-black block mb-1.5">Sélectionner ou Saisir le Matricule de l'Agent</label>
                        <select 
                          value={hrSearchMatricule}
                          onChange={(e) => setHrSearchMatricule(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 text-xs font-black uppercase text-white rounded-xl px-3 py-2.5 outline-none cursor-pointer"
                        >
                          <option value="">-- Choisir un agent actif --</option>
                          {employees.map(emp => (
                            <option key={emp.id} value={emp.matricule || emp.id}>
                              {emp.name || emp.id} ({emp.matricule || 'Sans matricule'})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="w-full sm:w-auto">
                        <input 
                          type="text" 
                          placeholder="Saisir matricule direct (ex: M001)"
                          value={hrSearchMatricule}
                          onChange={(e) => setHrSearchMatricule(e.target.value)}
                          className="w-full bg-slate-800 border border-slate-700 text-xs font-black uppercase text-white rounded-xl px-3 py-2.5 outline-none placeholder:text-slate-500"
                        />
                      </div>
                    </div>

                    {hrSearchMatricule ? (() => {
                      const mat = hrSearchMatricule.toUpperCase();
                      const miner = calculateMinerStats(mat, allProductionDocs);
                      const driver = calculateDriverStats(mat, allProductionDocs);
                      const chief = calculateChiefStats(mat, allProductionDocs, allPlanningSheets);
                      const assistant = calculateAssistantMinerStats(mat, allProductionDocs);

                      const hasMinerData = miner.totalRounds > 0;
                      const hasDriverData = driver.totalVolume > 0;
                      const hasChiefData = chief.shiftsLed > 0;
                      const hasAssistantData = assistant.roundsAssisted > 0;

                      if (!hasMinerData && !hasDriverData && !hasChiefData && !hasAssistantData) {
                        return (
                          <div className="bg-slate-800/40 border border-slate-750 p-4 rounded-xl text-center text-slate-400 text-[10px] uppercase font-black">
                            Aucune activité de production brute détectée pour le matricule {mat} sur la période sélectionnée.
                          </div>
                        );
                      }

                      return (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                          {/* Miner Card */}
                          {hasMinerData && (
                            <div className="bg-slate-800 border border-slate-750 rounded-xl p-4.5 space-y-3.5">
                              <span className="text-[9px] font-black text-[#ffd700] uppercase tracking-wide block border-b border-slate-750 pb-1.5">Profil : Mineur de Tir</span>
                              <div className="grid grid-cols-2 gap-3.5">
                                <div>
                                  <span className="text-[8px] text-slate-400 uppercase font-bold">Mètres Forés</span>
                                  <div className="text-sm font-mono font-black text-white">{miner.totalMeters.toFixed(1)} m</div>
                                </div>
                                <div>
                                  <span className="text-[8px] text-slate-400 uppercase font-bold">Rendement de Tir</span>
                                  <div className="text-sm font-mono font-black text-emerald-400">{miner.avgYield.toFixed(2)} m/v</div>
                                </div>
                                <div>
                                  <span className="text-[8px] text-slate-400 uppercase font-bold">Explosifs Totaux</span>
                                  <div className="text-sm font-mono font-black text-white">{miner.totalExplosives} kg</div>
                                </div>
                                <div>
                                  <span className="text-[8px] text-slate-400 uppercase font-bold">Consommation Spécifique</span>
                                  <div className="text-sm font-mono font-black text-rose-400">{miner.specificExplosiveConsumption.toFixed(2)} kg/m</div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Driver Card */}
                          {hasDriverData && (
                            <div className="bg-slate-800 border border-slate-750 rounded-xl p-4.5 space-y-3.5">
                              <span className="text-[9px] font-black text-sky-400 uppercase tracking-wide block border-b border-slate-750 pb-1.5">Profil : Conducteur LHD</span>
                              <div className="grid grid-cols-2 gap-3.5">
                                <div>
                                  <span className="text-[8px] text-slate-400 uppercase font-bold">Volume Déblayé</span>
                                  <div className="text-sm font-mono font-black text-white">{driver.totalVolume.toFixed(1)} m³</div>
                                </div>
                                <div>
                                  <span className="text-[8px] text-slate-400 uppercase font-bold">Vol. Moyen / Godet</span>
                                  <div className="text-sm font-mono font-black text-sky-400">{driver.avgVolumePerGodet.toFixed(2)} m³/gd</div>
                                </div>
                                <div>
                                  <span className="text-[8px] text-slate-400 uppercase font-bold">Gasoil Consommé</span>
                                  <div className="text-sm font-mono font-black text-white">{driver.totalGasoil} L</div>
                                </div>
                                <div>
                                  <span className="text-[8px] text-slate-400 uppercase font-bold">Ratio Énergétique</span>
                                  <div className="text-sm font-mono font-black text-amber-400">{driver.specificGasoilRatio.toFixed(2)} L/m³</div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Chief Card */}
                          {hasChiefData && (
                            <div className="bg-slate-800 border border-slate-750 rounded-xl p-4.5 space-y-3.5">
                              <span className="text-[9px] font-black text-purple-400 uppercase tracking-wide block border-b border-slate-750 pb-1.5">Profil : Chef d'Équipe</span>
                              <div className="grid grid-cols-2 gap-3.5">
                                <div>
                                  <span className="text-[8px] text-slate-400 uppercase font-bold">Shifts Dirigés</span>
                                  <div className="text-sm font-mono font-black text-white">{chief.shiftsLed} postes</div>
                                </div>
                                <div>
                                  <span className="text-[8px] text-slate-400 uppercase font-bold">Score de Management</span>
                                  <div className="text-sm font-mono font-black text-purple-400">{chief.averageGlobalScoreUnderManagement.toFixed(1)}%</div>
                                </div>
                                <div className="col-span-2">
                                  <span className="text-[8px] text-slate-400 uppercase font-bold block mb-1">Métrage managé total</span>
                                  <div className="text-xs font-mono font-black text-slate-200">{chief.totalMetersUnderManagement.toFixed(1)} mètres forés sous direction</div>
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Assistant Miner Card */}
                          {hasAssistantData && (
                            <div className="bg-slate-800 border border-slate-750 rounded-xl p-4.5 space-y-3.5">
                              <span className="text-[9px] font-black text-teal-400 uppercase tracking-wide block border-b border-slate-750 pb-1.5">Profil : Aide-Mineur</span>
                              <div className="grid grid-cols-2 gap-3.5">
                                <div>
                                  <span className="text-[8px] text-slate-400 uppercase font-bold">Rondes Assistées</span>
                                  <div className="text-sm font-mono font-black text-white">{assistant.roundsAssisted} volées</div>
                                </div>
                                <div>
                                  <span className="text-[8px] text-slate-400 uppercase font-bold">Métrage assisté</span>
                                  <div className="text-sm font-mono font-black text-teal-400">{assistant.totalMetersAssisted.toFixed(1)} m</div>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })() : (
                      <div className="bg-slate-800/40 border border-slate-750 p-4 rounded-xl text-center text-slate-400 text-[10px] uppercase font-black">
                        Veuillez sélectionner un collaborateur pour compiler son dossier d'activité consolidé.
                      </div>
                    )}
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
