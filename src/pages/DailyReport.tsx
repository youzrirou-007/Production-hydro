import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Calendar, 
  MapPin, 
  Layers, 
  Clock, 
  Download, 
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
  Wrench
} from 'lucide-react';
import { collection, query, onSnapshot, doc, getDoc, where } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { format, subDays } from 'date-fns';
import { ExcelExportButton } from '../components/ExcelExportButton';
import logoImg from '../assets/images/hydromines_logo_1781337889277.jpg';

export const DailyReport: React.FC = () => {
  const { user } = useAuth();
  const [reportType, setReportType] = useState<'day' | 'month'>('day');
  const [filterDate, setFilterDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [filterMonth, setFilterMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [activeTab, setActiveTab] = useState<'minage' | 'deblayage' | 'extraction' | 'maintenance'>('minage');
  const [dayProduction, setDayProduction] = useState<any | null>(null);
  const [unexplainedGapsForDate, setUnexplainedGapsForDate] = useState(0);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);

  useEffect(() => {
    if (reportType !== 'month' || !filterMonth) return;
    const q = query(
      collection(db, 'production_history'),
      where('date', '>=', filterMonth + '-01'),
      where('date', '<=', filterMonth + '-31')
    );
    const unsub = onSnapshot(q, (snap) => {
      const docs = snap.docs.map(d => ({ id: d.id, ...d.data() }) as any);
      docs.sort((a: any, b: any) => (a.date || '').localeCompare(b.date || ''));
      setMonthlyData(docs);
    });
    return () => unsub();
  }, [reportType, filterMonth]);

  useEffect(() => {
    if (!user || !filterDate) return;
    
    const q = query(
      collection(db, 'non_realisation_explanations'),
      where('date', '==', filterDate),
      where('status', '==', 'pending')
    );
    
    const unsub = onSnapshot(q, (snap) => {
      setUnexplainedGapsForDate(snap.size);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'non_realisation_explanations');
    });
    
    return () => unsub();
  }, [user, filterDate]);

  // Helper to determine sector group of a record robustly
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

  const isTargetSector = (sector: string) => {
    const s = (sector || '').trim().toLowerCase();
    return s === 'imiter 2' || s === 'imiter 1' || s === 'imiter est';
  };

  const filterTargetSectorRows = (rows: any[]) => {
    return rows.filter(r => isTargetSector(getRecordSectorGroup(r)));
  };

  const getSectorChefInfo = (sectorName: string, sectorChefs: any) => {
    if (!sectorChefs) return null;
    const key = Object.keys(sectorChefs).find(k => k.toLowerCase().trim() === sectorName.toLowerCase().trim());
    return key ? sectorChefs[key] : null;
  };
  const [chantiers, setChantiers] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [allPlanningSheets, setAllPlanningSheets] = useState<any[]>([]);
  const [allProductionDocs, setAllProductionDocs] = useState<any[]>([]);

  const [operationalSettings, setOperationalSettings] = useState<{
    advance_18m: number;
    advance_24m: number;
    kpi_18m_good: number;
    kpi_18m_low: number;
    kpi_24m_good: number;
    kpi_24m_low: number;
  }>({
    advance_18m: 1.7,
    advance_24m: 2.3,
    kpi_18m_good: 1.6,
    kpi_18m_low: 1.5,
    kpi_24m_good: 2.1,
    kpi_24m_low: 2.0,
  });

  useEffect(() => {
    const unsubOpSettings = onSnapshot(doc(db, 'platform_settings', 'config'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setOperationalSettings({
          advance_18m: data.advance_18m ?? 1.7,
          advance_24m: data.advance_24m ?? 2.3,
          kpi_18m_good: data.kpi_18m_good ?? 1.6,
          kpi_18m_low: data.kpi_18m_low ?? 1.5,
          kpi_24m_good: data.kpi_24m_good ?? 2.1,
          kpi_24m_low: data.kpi_24m_low ?? 2.0,
        });
      }
    }, (err) => {
      console.warn("Error loading operational settings in DailyReport.tsx:", err);
    });
    return () => unsubOpSettings();
  }, []);

  // Subscribe to all planning sheets and production documents for unfilled check
  useEffect(() => {
    const qDailyPlannings = query(collection(db, 'daily_planning_sheets'));
    const unsubDailyPlannings = onSnapshot(qDailyPlannings, (snapshot) => {
      setAllPlanningSheets(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => {
      console.warn("Permission logs on Snapshot daily_planning_sheets:", err.message);
    });

    const qProduction = query(collection(db, 'production'));
    const unsubProduction = onSnapshot(qProduction, (snapshot) => {
      setAllProductionDocs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => {
      console.warn("Permission logs on Snapshot production:", err.message);
    });

    return () => {
      unsubDailyPlannings();
      unsubProduction();
    };
  }, []);

  // Subscribe to chantiers, personnel, and daily production
  useEffect(() => {
    // 1. Chantiers
    const qChan = query(collection(db, 'chantiers'));
    const unsubChan = onSnapshot(qChan, (snap) => {
      setChantiers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    // 2. Personnel
    const qRH = query(collection(db, 'personnel'));
    const unsubRH = onSnapshot(qRH, (snap) => {
      setEmployees(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => {
      unsubChan();
      unsubRH();
    };
  }, []);

  useEffect(() => {
    if (!filterDate) return;
    setLoading(true);
    const docRef = doc(db, 'production', filterDate);
    const unsub = onSnapshot(docRef, (snap) => {
      if (snap.exists()) {
        setDayProduction(snap.data());
      } else {
        setDayProduction(null);
      }
      setLoading(false);
    }, (err) => {
      console.error("Error loading daily report production: ", err);
      setLoading(false);
    });

    return unsub;
  }, [filterDate]);

  // Helper name resolutions
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

  // Safe rows extractions for all 4 sheets
  const getRowsForSheet = (sheetName: 'minage' | 'deblayage' | 'extraction' | 'maintenance') => {
    if (!dayProduction || !dayProduction.postes) return { poste1: [], poste2: [], poste3: [] };
    const p1 = dayProduction.postes.poste1?.[sheetName] || [];
    const p2 = dayProduction.postes.poste2?.[sheetName] || [];
    const p3 = dayProduction.postes.poste3?.[sheetName] || [];
    return { poste1: p1, poste2: p2, poste3: p3 };
  };

  const minageData = getRowsForSheet('minage');
  const deblayageData = getRowsForSheet('deblayage');
  const extractionData = getRowsForSheet('extraction');
  const maintenanceData = getRowsForSheet('maintenance');

  // Filter ONLY 'Imiter 2', 'Imiter 1', and 'Imiter Est' sectors
  const targetMinageP1 = filterTargetSectorRows(minageData.poste1);
  const targetMinageP2 = filterTargetSectorRows(minageData.poste2);
  const targetMinageP3 = filterTargetSectorRows(minageData.poste3);

  const targetDeblayageP1 = filterTargetSectorRows(deblayageData.poste1);
  const targetDeblayageP2 = filterTargetSectorRows(deblayageData.poste2);
  const targetDeblayageP3 = filterTargetSectorRows(deblayageData.poste3);

  const targetExtractionP1 = filterTargetSectorRows(extractionData.poste1);
  const targetExtractionP2 = filterTargetSectorRows(extractionData.poste2);
  const targetExtractionP3 = filterTargetSectorRows(extractionData.poste3);

  // Mapped datasets for the Excel Export Button (restricted to target sectors)
  const minageRowsByPost: Record<'Poste 1' | 'Poste 2' | 'Poste 3', any[]> = {
    'Poste 1': targetMinageP1,
    'Poste 2': targetMinageP2,
    'Poste 3': targetMinageP3,
  };

  const deblayageRowsByPost: Record<'Poste 1' | 'Poste 2' | 'Poste 3', any[]> = {
    'Poste 1': targetDeblayageP1,
    'Poste 2': targetDeblayageP2,
    'Poste 3': targetDeblayageP3,
  };

  const extractionRowsByPost: Record<'Poste 1' | 'Poste 2' | 'Poste 3', any[]> = {
    'Poste 1': targetExtractionP1,
    'Poste 2': targetExtractionP2,
    'Poste 3': targetExtractionP3,
  };

  const maintenanceRowsByPost: Record<'Poste 1' | 'Poste 2' | 'Poste 3', any[]> = {
    'Poste 1': maintenanceData.poste1,
    'Poste 2': maintenanceData.poste2,
    'Poste 3': maintenanceData.poste3,
  };

  const sectorChiefs: Record<'Poste 1' | 'Poste 2' | 'Poste 3', any> = {
    'Poste 1': dayProduction?.postes?.poste1?.sectorChefs || {},
    'Poste 2': dayProduction?.postes?.poste2?.sectorChefs || {},
    'Poste 3': dayProduction?.postes?.poste3?.sectorChefs || {},
  };

  const sectorBoutefeuTasks: Record<string, any> = {
    'Poste 1': dayProduction?.postes?.poste1?.sectorBoutefeuTasks || {},
    'Poste 2': dayProduction?.postes?.poste2?.sectorBoutefeuTasks || {},
    'Poste 3': dayProduction?.postes?.poste3?.sectorBoutefeuTasks || {},
  };

  // Calculations for KPI Cards using filtered/target sectors
  // Sheet 1 - Minage Totals
  const sumMinageMeterage = [...targetMinageP1, ...targetMinageP2, ...targetMinageP3].reduce((acc, r) => acc + (Number(r.reel?.realMeterage || r.realMeterage) || 0), 0);
  const sumMinageAnfo = [...targetMinageP1, ...targetMinageP2, ...targetMinageP3].reduce((acc, r) => acc + (Number(r.reel?.anfo || r.anfo) || 0), 0);
  const sumMinageTovex = [...targetMinageP1, ...targetMinageP2, ...targetMinageP3].reduce((acc, r) => acc + (Number(r.reel?.tovex || r.tovex) || 0), 0);
  const sumMinageAmorces = [...targetMinageP1, ...targetMinageP2, ...targetMinageP3].reduce((acc, r) => acc + (Number(r.reel?.ammorces || r.ammorces) || 0), 0);
  const sumMinageRounds = [...targetMinageP1, ...targetMinageP2, ...targetMinageP3].reduce((acc, r) => acc + (Number(r.reel?.realRounds || r.realRounds) || 0), 0);
  const globalMinageYield = sumMinageRounds > 0 ? (sumMinageMeterage / sumMinageRounds) : 0;

  // Sheet 2 - Deblayage Totals
  const sumDeblayageGodets = [...targetDeblayageP1, ...targetDeblayageP2, ...targetDeblayageP3].reduce((acc, r) => acc + (Number(r.reel?.godets || r.godets) || 0), 0);
  const sumDeblayageVolume = [...targetDeblayageP1, ...targetDeblayageP2, ...targetDeblayageP3].reduce((acc, r) => acc + (Number(r.reel?.volumeEstimated || r.volumeEstimated) || 0), 0);
  const sumDeblayageGasoil = [...targetDeblayageP1, ...targetDeblayageP2, ...targetDeblayageP3].reduce((acc, r) => acc + (Number(r.reel?.gasoil || r.gasoil) || 0), 0);

  // Sheet 3 - Extraction Totals
  const sumExtractionWagonsActual = [...targetExtractionP1, ...targetExtractionP2, ...targetExtractionP3].reduce((acc, r) => acc + (Number(r.reel?.wagonsActual) || Number(r.wagonsActual) || 0), 0);
  const sumExtractionWagonsTarget = [...targetExtractionP1, ...targetExtractionP2, ...targetExtractionP3].reduce((acc, r) => {
    const tReel = r.reel?.wagonsTarget !== undefined && r.reel?.wagonsTarget !== null ? Number(r.reel.wagonsTarget) : undefined;
    const tPlan = r.wagonsTarget !== undefined && r.wagonsTarget !== null ? Number(r.wagonsTarget) : undefined;
    const target = tReel !== undefined ? tReel : (tPlan !== undefined ? tPlan : 48);
    return acc + target;
  }, 0);
  const sumExtractionSterile = [...extractionData.poste1, ...extractionData.poste2, ...extractionData.poste3].reduce((acc, r) => acc + (Number(r.reel?.sterileBureImiterEst) || Number(r.sterileBureImiterEst) || 0), 0);
  const globalExtractionPct = sumExtractionWagonsTarget > 0 ? (sumExtractionWagonsActual / sumExtractionWagonsTarget) * 100 : 0;
  const globalExtractionDiffPct = sumExtractionWagonsTarget > 0 ? ((sumExtractionWagonsActual - sumExtractionWagonsTarget) / sumExtractionWagonsTarget) * 100 : 0;

  // Sheet 4 - Maintenance Totals
  const sumMaintenanceHours = [...maintenanceData.poste1, ...maintenanceData.poste2, ...maintenanceData.poste3].reduce((acc, r) => acc + (Number(r.reel?.hoursSpent || r.hoursSpent) || 0), 0);
  const countMaintenanceTasks = [...maintenanceData.poste1, ...maintenanceData.poste2, ...maintenanceData.poste3].length;

  const getSectorStyle = (sectorName: string) => {
    const name = sectorName.trim().toLowerCase();
    if (name === 'imiter 2') {
      return {
        borderColor: 'border-red-700',
        bgColor: 'bg-red-50/40',
        textColor: 'text-red-950',
        dotColor: 'bg-red-700',
        labelColor: 'text-red-800 bg-red-50 border-red-200'
      };
    } else if (name === 'imiter 1') {
      return {
        borderColor: 'border-sky-500',
        bgColor: 'bg-sky-50/40',
        textColor: 'text-sky-950',
        dotColor: 'bg-sky-500',
        labelColor: 'text-sky-800 bg-sky-50 border-sky-200'
      };
    } else {
      // Imiter Est
      return {
        borderColor: 'border-teal-500',
        bgColor: 'bg-teal-50/40',
        textColor: 'text-teal-950',
        dotColor: 'bg-teal-500',
        labelColor: 'text-teal-800 bg-teal-50 border-teal-200'
      };
    }
  };

  // Table Renderer for Minage
  const renderMinageTable = (rows: any[]) => (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse border border-gray-200">
        <thead>
          <tr className="bg-[#0f172a] text-white border-b-2 border-[#b8860b] text-[9.5px] font-extrabold tracking-wider uppercase sticky top-0 z-10 select-none">
            <th className="p-2.5 border-r border-slate-700/50 text-center w-12 bg-slate-900 text-[#ffd700] font-black">#</th>
            <th className="p-2.5 border-r border-slate-700/50 bg-gradient-to-b from-[#00BFFF]/20 to-[#00BFFF]/10 text-sky-200">Chantier / Galerie</th>
            <th className="p-2.5 border-r border-slate-700/50 bg-gradient-to-b from-amber-950/45 to-amber-950/25 text-[#ffd700]">Mineur & Aide</th>
            <th className="p-2.5 border-r border-slate-700/50 bg-gradient-to-b from-[#00BFFF]/15 to-[#00BFFF]/5 text-sky-200 text-center">Trous Forés</th>
            <th className="p-2.5 border-r border-slate-700/50 w-20 text-center bg-gradient-to-b from-red-950/40 to-red-950/20 text-rose-250">Volées (u.)</th>
            <th className="p-2.5 border-r border-slate-700/50 text-center bg-gradient-to-b from-amber-950/15 to-transparent text-amber-200">Métrage (m)</th>
            <th className="p-2.5 border-r border-slate-700/50 text-center bg-gradient-to-b from-slate-900/60 to-transparent text-slate-300">Objectif (m)</th>
            <th className="p-2.5 border-r border-slate-700/50 text-center bg-slate-900/60 text-slate-300">KPI Rendement (m/v)</th>
            <th className="p-2.5 text-center bg-gradient-to-b from-red-950/15 to-transparent text-rose-220">Consommation Explosifs</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-150 text-[10.5px] font-bold text-slate-700 bg-white">
          {(() => {
            let displayIndex = 0;
            return rows.map((r: any, idx: number) => {
              const row = r.reel || r;
              const isChildVolee = !!(row.remarks && typeof row.remarks === 'string' && row.remarks.includes('(Volée'));
              if (isChildVolee) return null;
              displayIndex++;

              const rYield = row.realRounds > 0 ? (row.realMeterage / row.realRounds) : 0;
              const is24 = row.barType === '2.4m';
              const kpiGoodThreshold = is24 ? (operationalSettings?.kpi_24m_good ?? 2.1) : (operationalSettings?.kpi_18m_good ?? 1.6);
              const kpiLowThreshold = is24 ? (operationalSettings?.kpi_24m_low ?? 2.0) : (operationalSettings?.kpi_18m_low ?? 1.5);
              const planMeterage = Number(r.plan?.meterage || 0);
              let statusLabel = 'NORMAL';
              let statusColor = 'bg-blue-50 text-blue-700 border-blue-200';
              if (row.realRounds > 0) {
                if (rYield >= kpiGoodThreshold) {
                  statusLabel = 'PERFORMANT';
                  statusColor = 'bg-emerald-50 text-emerald-800 border-emerald-250';
                } else if (rYield >= kpiLowThreshold) {
                  statusLabel = 'MOYEN';
                  statusColor = 'bg-amber-50 text-amber-800 border-amber-200';
                } else {
                  statusLabel = 'SOUS-KPI';
                  statusColor = 'bg-red-50 text-red-800 border-red-200 animate-pulse';
                }
              }

              return (
                <tr key={idx} className="hover:bg-slate-50/50 transition-colors border-b border-gray-200">
                  <td className="p-3 text-center text-gray-500 font-mono text-[10.5px] bg-slate-50/50 border-r border-gray-200 w-12">{displayIndex}</td>
                <td className="p-3 border-r border-gray-200">
                  <div className="text-[11px] font-extrabold text-[#b8860b] uppercase">{getChantierName(row.chantierId)}</div>
                  <div className="text-[8.5px] text-gray-455 font-normal">Section : {row.gallerySize || 12}m² • {row.barType || '1.8m'}</div>
                </td>
                <td className="p-3 border-r border-gray-200">
                  <div className="text-gray-900 block truncate max-w-[140px] uppercase font-bold">{getPersonnelName(row.minerMatricule)}</div>
                  <div className="text-gray-405 text-[8.5px] font-semibold uppercase truncate max-w-[140px]">Aid : {getPersonnelName(row.assistantMatricule) || 'N/A'}</div>
                </td>
                <td className="p-3 text-center border-r border-gray-200 font-mono text-[11px] text-gray-800 bg-slate-50/5">{row.realHoles || 0} trs</td>
                <td className="p-3 text-center border-r border-gray-200 font-mono text-[11px] text-gray-800">{row.realRounds || 0} vol</td>
                <td className="p-3 text-center border-r border-gray-200 font-mono text-[11px] font-extrabold text-slate-900 bg-amber-50/20">{row.realMeterage || 0} m</td>
                <td className="p-3 text-center border-r border-gray-200 font-mono text-[11px] text-slate-400 bg-slate-50/10">
                  {planMeterage > 0 ? `${planMeterage.toFixed(1)} m` : '—'}
                </td>
                <td className="p-3 text-center border-r border-gray-200 bg-slate-50/5">
                  <span className={`inline-flex px-2 py-0.5 border text-[8.5px] font-black uppercase rounded ${statusColor}`}>
                    {rYield > 0 ? `${rYield.toFixed(2)} m/v` : '0.00'} — {statusLabel}
                  </span>
                </td>
                <td className="p-3 text-center">
                  <div className="inline-grid grid-cols-3 gap-1 font-mono text-[9px] uppercase border border-gray-200/60 p-1 bg-gray-50/40 rounded">
                    <span className="text-red-750 px-1 font-extrabold" title="ANFO kg">ANF: {row.anfo || 0}</span>
                    <span className="text-amber-850 px-1 font-extrabold" title="Tovex kg">TOV: {(row.tovex || 0).toFixed(2)} kg</span>
                    <span className="text-blue-850 px-1 font-extrabold" title="Amorces u.">AMO: {row.ammorces || 0}</span>
                  </div>
                </td>
              </tr>
            );
          })}
          )()}
        </tbody>
      </table>
    </div>
  );

  // Table Renderer for Deblayage
  const renderDeblayageTable = (rows: any[]) => (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse border border-gray-200">
        <thead>
          <tr className="bg-[#0f172a] text-white border-b-2 border-[#b8860b] text-[9.5px] font-extrabold tracking-wider uppercase sticky top-0 z-10 select-none">
            <th className="p-2.5 border-r border-slate-700/50 text-center w-12 bg-slate-900 text-[#ffd700] font-black">#</th>
            <th className="p-2.5 border-r border-slate-700/50 bg-gradient-to-b from-[#00BFFF]/20 to-[#00BFFF]/10 text-sky-200">Chantier de Charge</th>
            <th className="p-2.5 border-r border-slate-700/50 bg-gradient-to-b from-amber-950/45 to-amber-950/25 text-[#ffd700]">Conducteur Engin</th>
            <th className="p-2.5 border-r border-slate-700/50 bg-gradient-to-b from-[#00BFFF]/15 to-[#00BFFF]/5 text-sky-200 text-center">Engin LHD</th>
            <th className="p-2.5 border-r border-slate-700/50 text-center bg-slate-900/60 text-slate-300">Nombre Godets</th>
            <th className="p-2.5 border-r border-slate-700/50 text-center bg-gradient-to-b from-amber-950/15 to-transparent text-amber-200">Métrage Estimé (m³)</th>
            <th className="p-2.5 border-r border-slate-700/50 text-center bg-gradient-to-b from-emerald-950/20 to-transparent text-emerald-200">Métrage Réel (m³)</th>
            <th className="p-2.5 border-r border-slate-700/50 text-center bg-slate-900/60 text-slate-300">Écart vs Estimé (%)</th>
            <th className="p-2.5 border-r border-slate-700/50 text-center bg-[#b8860b]/15 text-amber-300">Gasoil (L)</th>
            <th className="p-2.5 text-center bg-gradient-to-b from-red-950/15 to-transparent text-rose-220">Lubrifiants Qty</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-150 text-[10.5px] font-bold text-slate-700 bg-white">
          {rows.map((r: any, idx: number) => {
            const row = r.reel || r;
            const plan = r.plan || {};
            const targetVol = plan.volumeEstimated || 0;
            const realVol = row.volumeEstimated || 0;
            const diffVolAbs = realVol - targetVol;
            const diffVolPct = targetVol > 0 ? (diffVolAbs / targetVol) * 100 : 0;

            let diffVolColor = "bg-slate-50 text-slate-700 border-slate-200";
            if (targetVol > 0) {
              if (diffVolPct >= 0) {
                diffVolColor = "bg-emerald-50 text-emerald-800 border-emerald-200";
              } else {
                diffVolColor = "bg-rose-50 text-rose-800 border-rose-200 animate-pulse";
              }
            } else if (realVol > 0) {
              diffVolColor = "bg-emerald-50 text-emerald-800 border-emerald-200";
            }

            return (
              <tr key={idx} className="hover:bg-slate-50/50 transition-colors border-b border-gray-200">
                <td className="p-3 text-center text-gray-500 font-mono text-[10.5px] bg-slate-50/50 border-r border-gray-200 w-12">{idx + 1}</td>
                <td className="p-3 border-r border-gray-200 font-extrabold text-[#b8860b] uppercase">{getChantierName(row.chantierId)}</td>
                <td className="p-3 border-r border-gray-200 text-gray-900 uppercase font-bold">{getPersonnelName(row.driverMatricule)} ({row.driverMatricule})</td>
                <td className="p-3 text-center border-r border-gray-200">
                  <span className="font-mono font-extrabold bg-amber-50 text-amber-800 border border-amber-200/50 px-2 py-0.5 rounded text-[9.5px]">
                    {row.engineCode || row.engineId || '-'}
                  </span>
                </td>
                <td className="p-3 text-center border-r border-gray-200 font-mono text-[11px] text-gray-800">{row.godets || 0}</td>
                <td className="p-3 text-center border-r border-gray-200 font-mono text-[11px] text-slate-500 bg-slate-50/20">{targetVol.toFixed(1)} m³</td>
                <td className="p-3 text-center border-r border-gray-200 font-mono text-[11px] font-extrabold text-slate-900 bg-emerald-50/20">{realVol.toFixed(1)} m³</td>
                <td className="p-3 text-center border-r border-gray-200 bg-slate-50/5">
                  <span className={`inline-flex px-2 py-0.5 border text-[8.5px] font-black uppercase rounded ${diffVolColor}`}>
                    {targetVol === 0 ? (realVol === 0 ? "CONFORME" : `+${realVol.toFixed(1)} m³ (HORS-PLAN)`) : `${diffVolAbs >= 0 ? '+' : ''}${diffVolAbs.toFixed(1)} m³ (${diffVolPct >= 0 ? '+' : ''}${diffVolPct.toFixed(1)}%)`}
                  </span>
                </td>
                <td className="p-3 text-center border-r border-gray-200 font-mono text-[#b8860b] font-bold">{row.gasoil || 0} L</td>
                <td className="p-3 text-center">
                  <div className="flex flex-col gap-0.5 font-mono text-[8.5px] text-gray-500">
                    {row.lubrifiant1Qty > 0 && (
                      <span>{row.lubrifiant1} : <strong>{row.lubrifiant1Qty}L</strong></span>
                    )}
                    {row.lubrifiant2Qty > 0 && (
                      <span>{row.lubrifiant2} : <strong>{row.lubrifiant2Qty}L</strong></span>
                    )}
                    {!row.lubrifiant1Qty && !row.lubrifiant2Qty && <span className="text-gray-300">-</span>}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  // Table Renderer for Extraction
  const renderExtractionTable = (rows: any[]) => (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse border border-gray-200">
        <thead>
          <tr className="bg-[#0f172a] text-white border-b-2 border-[#b8860b] text-[9.5px] font-extrabold tracking-wider uppercase sticky top-0 z-10 select-none">
            <th className="p-2.5 border-r border-slate-700/50 text-center w-12 bg-slate-900 text-[#ffd700] font-black">#</th>
            <th className="p-2.5 border-r border-slate-700/50 bg-gradient-to-b from-[#00BFFF]/20 to-[#00BFFF]/10 text-sky-200">Installation Treuil</th>
            <th className="p-2.5 border-r border-slate-700/55 bg-gradient-to-b from-amber-950/45 to-amber-950/25 text-[#ffd700]">Opérateurs Terrain (Treuilliste / Équipiers)</th>
            <th className="p-2.5 border-r border-slate-700/50 text-center bg-slate-900/60 text-slate-300">Cible (Wagons)</th>
            <th className="p-2.5 border-r border-slate-700/50 text-center bg-gradient-to-b from-emerald-950/20 to-transparent text-emerald-200">Réalisé (Wag)</th>
            <th className="p-2.5 border-r border-slate-700/50 text-center bg-gradient-to-b from-amber-950/15 to-transparent text-amber-200">Stérile Bure (Wg)</th>
            <th className="p-2.5 border-r border-slate-700/50 text-center bg-slate-900/60 text-slate-300">Total Tirés (Wg)</th>
            <th className="p-2.5 text-center bg-gradient-to-b from-red-950/15 to-transparent text-rose-220">Écart vs Objectif (%)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-150 text-[10.5px] font-bold text-slate-700 bg-white">
          {rows.map((r: any, idx: number) => {
            const tReel = r.reel?.wagonsTarget !== undefined && r.reel?.wagonsTarget !== null ? Number(r.reel.wagonsTarget) : undefined;
            const tPlan = r.wagonsTarget !== undefined && r.wagonsTarget !== null ? Number(r.wagonsTarget) : undefined;
            const target = tReel !== undefined ? tReel : (tPlan !== undefined ? tPlan : 48);
            const actual = Number(r.reel?.wagonsActual || r.wagonsActual || 0);
            const sterile = Number(r.reel?.sterileBureImiterEst || r.sterileBureImiterEst || 0);
            const total = actual + sterile;
            const diffWagonsPct = target > 0 ? ((actual - target) / target) * 100 : 0;

            let speedLabel = 'SOUS-KPI';
            let speedColor = 'bg-red-50 text-red-800 border-red-200 animate-pulse';
            if (target === 0) {
              if (actual === 0) {
                speedLabel = "PAS D'EXTRACTION PRÉVUE";
                speedColor = 'bg-slate-50 text-slate-500 border-slate-200';
              } else {
                speedLabel = 'EXTRACTION NON PLANIFIÉE';
                speedColor = 'bg-emerald-50 text-emerald-800 border-emerald-200';
              }
            } else if (diffWagonsPct >= 0) {
              speedLabel = 'CIBLE ATTEINTE';
              speedColor = 'bg-emerald-50 text-emerald-800 border-emerald-200';
            } else if (diffWagonsPct >= -15) {
              speedLabel = 'CORRECT';
              speedColor = 'bg-blue-50 text-blue-700 border-blue-250';
            }

            return (
              <tr key={idx} className="hover:bg-slate-50/50 transition-colors border-b border-gray-200">
                <td className="p-3 text-center text-gray-400 font-mono text-[9px] bg-slate-50/20 border-r border-gray-205">{idx + 1}</td>
                <td className="p-3 font-extrabold text-[#b8860b] uppercase border-r border-gray-205">{r.installationName || r.chantierName || 'Bure'}</td>
                <td className="p-3 border-r border-gray-205">
                  <div className="text-gray-900 uppercase font-bold">Treuilliste : {getPersonnelName(r.treuilliste)}</div>
                  <div className="text-[8.5px] text-gray-455 uppercase mt-0.5 leading-tight font-semibold">
                    Équipiers : {[r.equipier1, r.equipier2, r.equipier3, r.equipier4].filter(Boolean).map(getPersonnelName).join(' / ') || 'N/A'}
                  </div>
                </td>
                <td className="p-3 text-center font-mono text-[11px] text-gray-400 border-r border-gray-205 bg-slate-50/5">{target}</td>
                <td className="p-3 text-center font-mono text-[11px] font-extrabold text-emerald-950 bg-emerald-50/30 border-r border-gray-205">{actual}</td>
                <td className="p-3 text-center font-mono text-[11px] text-amber-700 bg-amber-50/10 border-r border-gray-205">{sterile}</td>
                <td className="p-3 text-center font-mono text-[11px] text-slate-800 bg-gray-50/20 border-r border-gray-205">{total}</td>
                <td className="p-3 text-center">
                  <span className={`inline-flex px-2 py-0.5 border text-[8.5px] font-black uppercase rounded ${speedColor}`}>
                    {target === 0 ? (actual === 0 ? "PAS D'EXTRACTION PRÉVUE" : `+${actual} Wg — ${speedLabel}`) : `${diffWagonsPct > 0 ? '+' : ''}${diffWagonsPct.toFixed(1)}% — ${speedLabel}`}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  // Table Renderer for Maintenance
  const renderMaintenanceTable = (rows: any[]) => (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse border border-gray-200">
        <thead>
          <tr className="bg-[#0f172a] text-white border-b-2 border-[#b8860b] text-[9.5px] font-extrabold tracking-wider uppercase sticky top-0 z-10 select-none">
            <th className="p-2.5 border-r border-slate-700/50 text-center w-12 bg-slate-900 text-[#ffd700] font-black">#</th>
            <th className="p-2.5 border-r border-slate-700/50 bg-gradient-to-b from-[#00BFFF]/20 to-[#00BFFF]/10 text-sky-200">Rôle Fixe SMI</th>
            <th className="p-2.5 border-r border-slate-700/50 bg-gradient-to-b from-amber-950/45 to-amber-950/25 text-[#ffd700]">Matricule & Spécialiste</th>
            <th className="p-2.5 border-r border-slate-700/50 bg-gradient-to-b from-[#00BFFF]/15 to-[#00BFFF]/5 text-sky-200 text-center">Engin Affecté</th>
            <th className="p-2.5 border-r border-slate-700/50 bg-gradient-to-b from-amber-950/15 to-transparent text-[#b8860b] text-center font-bold">Heures Consacrées</th>
            <th className="p-2.5 text-slate-350 bg-slate-900/60 font-semibold">Description Diagnostic / Tâches Planifiées Real</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-150 text-[10.5px] font-bold text-slate-700 bg-white">
          {rows.map((r: any, idx: number) => {
            const row = r.reel || r;
            return (
              <tr key={idx} className="hover:bg-slate-50/50 transition-colors border-b border-gray-200">
                <td className="p-3 text-center text-gray-500 font-mono text-[10.5px] bg-slate-50/50 border-r border-gray-200 w-12">{idx + 1}</td>
                <td className="p-3 border-r border-gray-200 font-extrabold text-[#b8860b] uppercase">{row.roleLabel || '-'}</td>
                <td className="p-3 border-r border-gray-200 text-slate-900 uppercase font-bold">
                  {getPersonnelName(row.agentMatricule || row.mechanicMatricule)} ({row.agentMatricule || row.mechanicMatricule || '-'})
                </td>
                <td className="p-3 text-center border-r border-gray-200">
                  <span className="font-mono bg-amber-50 text-amber-800 border border-amber-200/50 px-2 py-0.5 rounded text-[9.5px]">
                    {row.engineCode || row.engineId || '-'}
                  </span>
                </td>
                <td className="p-3 text-center border-r border-gray-200 font-mono text-[11px] text-amber-900 font-extrabold bg-amber-50/20">
                  {row.hoursSpent || 0} h
                </td>
                <td className="p-3 text-[10.5px] text-gray-650 font-normal leading-relaxed">{row.workDescription || '-'}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const tabs = [
    { id: 'minage' as const, label: '1. Forage & Minage', icon: Hammer, color: 'border-b-amber-500' },
    { id: 'deblayage' as const, label: '2. LHD & Charge', icon: Tractor, color: 'border-b-blue-500' },
    { id: 'extraction' as const, label: '3. Extraction & Treuil', icon: Train, color: 'border-b-emerald-500' },
    { id: 'maintenance' as const, label: '4. Brigade Technique', icon: Wrench, color: 'border-b-purple-500' },
  ];

  const unfilledReports = allPlanningSheets
    .map(plan => {
      const planDate = plan.id; // e.g. '2026-06-18' (planned day)
      // Math: expected production day is planDate + 1 day
      const parts = planDate.split('-');
      if (parts.length !== 3) return null;
      const pDateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 12, 0, 0);
      const expectedProdDateObj = new Date(pDateObj);
      expectedProdDateObj.setDate(pDateObj.getDate() + 1);
      const expectedProdDate = format(expectedProdDateObj, 'yyyy-MM-dd');
      
      const prodExists = allProductionDocs.some(prod => prod.id === expectedProdDate);
      return {
        planDate,
        expectedProdDate,
        exists: prodExists
      };
    })
    .filter((item): item is { planDate: string; expectedProdDate: string; exists: boolean } => item !== null && !item.exists)
    .sort((a, b) => b.expectedProdDate.localeCompare(a.expectedProdDate));

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      
      {unfilledReports.length > 0 && (
        <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-3.5 flex flex-col md:flex-row gap-4 items-center justify-between shadow-xs animate-fade-in">
          <div className="flex gap-2.5 items-center">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <span className="text-[11px] text-amber-950 font-black uppercase block">
                ⚠️ En attente de réalisé ({unfilledReports.length}) :
              </span>
              <span className="text-[10px] text-amber-850 font-bold">
                Des journées programmées n'ont pas encore de rapport journalier de production associé.
              </span>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5 text-xs font-black shrink-0">
            {unfilledReports.slice(0, 5).map(item => (
              <button
                key={item.expectedProdDate}
                type="button"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('navigate-to-tab', { detail: { tab: 'production', date: item.expectedProdDate } }));
                }}
                className="px-2.5 py-1.5 bg-white hover:bg-amber-100 text-amber-900 border border-amber-250 hover:border-amber-300 rounded-lg font-extrabold uppercase text-[9px] tracking-wider transition-all cursor-pointer shadow-2xs"
                title={`Saisir le réalisé du ${format(new Date(item.expectedProdDate + "T12:00:00"), 'dd/MM/yyyy')} basé sur la planification du ${format(new Date(item.planDate + "T12:00:00"), 'dd/MM/yyyy')}`}
              >
                📅 Ajouter Réalisé {format(new Date(item.expectedProdDate + "T12:00:00"), 'dd/MM/yyyy')}
              </button>
            ))}
            {unfilledReports.length > 5 && (
              <span className="text-[9px] text-amber-500 font-extrabold uppercase self-center pl-1">
                +{unfilledReports.length - 5} de plus
              </span>
            )}
          </div>
        </div>
      )}
      
      {/* Title & Date Picker Action Ribbon */}
      <div 
        id="daily-report-header-banner" 
        className="bg-white p-6 md:p-8 border border-[#e2e8f0] rounded-[16px] w-full shadow-sm"
        style={{ boxShadow: '0 4px 20px -2px rgba(184, 134, 11, 0.04), 0 1px 3px rgba(0,0,0,0.05)' }}
      >
        <div className="flex flex-col lg:flex-row items-stretch justify-between gap-6">
          {/* Left Column: 30% larger, borderless & clean logo with responsive scaling */}
          <div className="flex-shrink-0 flex items-center justify-center animate-fade-in self-center lg:self-stretch">
            <img 
              src={logoImg} 
              alt="HydroMines Logo" 
              className="h-28 w-28 sm:h-32 sm:w-32 md:h-36 md:w-36 object-contain hover:scale-105 transition-transform duration-300 ease-out select-none" 
              referrerPolicy="no-referrer" 
            />
          </div>

          {/* Centered Column: Header Title on One Line, Subtitle, Info tags */}
          <div className="flex-1 flex flex-col justify-center items-center text-center space-y-3.5 max-w-2xl px-22">
            {/* Upper Decorative Gold Line */}
            <div className="subtle-glow-line w-full opacity-80" />
            
            {/* Premium Gold Shimmer Title - Sized precisely to cover one line */}
            <h1 className="gold-title my-1 select-none text-[15px] sm:text-lg md:text-[20px] lg:text-[22px] tracking-[0.06em] whitespace-normal sm:whitespace-nowrap leading-none">
              RAPPORT CONSOLIDÉ JOURNALIER
            </h1>
            
            {/* Lower Decorative Gold Line */}
            <div className="subtle-glow-line w-full opacity-80" />

            {/* Elegant Subtitle with precise spacing */}
            <p 
              className="uppercase tracking-[0.2em] my-1.5 block text-[9px] md:text-[10px] font-extrabold"
              style={{ color: '#64748b', letterSpacing: '0.2em' }}
            >
              SMI (Société Métallurgique d'Imiter) • Registre d'Exploitation Journalière
            </p>
          </div>
          
          {/* Right Column: Date picker & Excel Export alignment */}
          <div className="flex flex-col items-center lg:items-end justify-between gap-4 w-full lg:w-auto self-center lg:self-stretch min-h-[140px]">
             
            {/* Toggle Day vs Month */}
            <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200/60 w-full max-w-xs md:max-w-none justify-between shadow-2xs">
              <button
                type="button"
                onClick={() => setReportType('day')}
                className={`flex-1 text-[10px] font-black uppercase py-1.5 px-3 rounded-lg transition-all cursor-pointer ${
                  reportType === 'day'
                    ? 'bg-amber-600 text-white shadow-xs font-black'
                    : 'text-gray-500 hover:text-gray-800 font-bold'
                }`}
              >
                📅 Quotidien
              </button>
              <button
                type="button"
                onClick={() => setReportType('month')}
                className={`flex-1 text-[10px] font-black uppercase py-1.5 px-3 rounded-lg transition-all cursor-pointer ${
                  reportType === 'month'
                    ? 'bg-amber-600 text-white shadow-xs font-black'
                    : 'text-gray-500 hover:text-gray-800 font-bold'
                }`}
              >
                📊 Mensuel
              </button>
            </div>

            {/* Conditional input selector */}
            <div className="inline-flex items-center gap-2 bg-amber-50/60 border border-amber-100/80 px-3 py-1.5 rounded-xl shadow-xs w-full max-w-xs md:max-w-none justify-center">
              <Calendar className="w-3.5 h-3.5 text-amber-600" />
              <span className="text-[10px] font-black uppercase text-[#b8860b] tracking-wider">
                {reportType === 'day' ? 'Date :' : 'Mois :'}
              </span>
              {reportType === 'day' ? (
                <input 
                  type="date" 
                  value={filterDate}
                  onChange={e => setFilterDate(e.target.value)}
                  className="text-xs font-black uppercase text-slate-950 outline-none cursor-pointer bg-white hover:bg-amber-50/30 border border-amber-200 rounded-lg px-2.5 py-1 outline-[#b8860b]/30 focus:ring-1 focus:ring-[#b8860b]/30 transition-colors"
                />
              ) : (
                <input 
                  type="month" 
                  value={filterMonth}
                  onChange={e => setFilterMonth(e.target.value)}
                  className="text-xs font-black uppercase text-slate-950 outline-none cursor-pointer bg-white hover:bg-amber-50/30 border border-amber-200 rounded-lg px-2.5 py-1 outline-[#b8860b]/30 focus:ring-1 focus:ring-[#b8860b]/30 transition-colors"
                />
              )}
            </div>

            {/* Excel export or placeholder button matching styling */}
            <div className="w-full max-w-xs md:max-w-none flex justify-center lg:justify-end mt-auto">
              {reportType === 'day' && dayProduction ? (
                <ExcelExportButton
                  selectedDate={filterDate}
                  minageRowsByPost={minageRowsByPost}
                  deblayageRowsByPost={deblayageRowsByPost}
                  extractionRowsByPost={extractionRowsByPost}
                  maintenanceRowsByPost={maintenanceRowsByPost}
                  sectorChiefs={sectorChiefs}
                  chantiers={chantiers}
                  employees={employees}
                />
              ) : reportType === 'day' ? (
                <button 
                  disabled 
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-[9px] font-black uppercase text-slate-400 bg-slate-50 border border-slate-200 rounded-xl cursor-not-allowed h-10 shadow-xs"
                  title="Saisir d'abord une production pour activer l'export"
                >
                  <Download className="w-3.5 h-3.5 text-slate-300" /> Pas de données à exporter
                </button>
              ) : null}
            </div>
          </div>
        </div>
      </div>

      {reportType === 'day' && unexplainedGapsForDate > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 flex items-center gap-3 animate-fade-in">
          <AlertTriangle className="text-amber-600 w-5 h-5 flex-shrink-0" />
          <div className="flex-1">
            <span className="text-amber-800 text-sm">
              ⚠️ Cette journée comporte <strong>{unexplainedGapsForDate}</strong> écart(s) non expliqué(s).
            </span>
          </div>
          <button 
            type="button"
            onClick={() => {
              window.sessionStorage.setItem('goto-explications-date', filterDate);
              window.dispatchEvent(new CustomEvent('navigate-to-tab', { detail: { tab: 'explications' } }));
            }}
            className="text-amber-700 underline text-sm font-semibold hover:text-amber-900 whitespace-nowrap"
          >
            Aller aux explications →
          </button>
        </div>
      )}

      {reportType === 'day' && (
        loading ? (
          <div className="py-24 text-center flex flex-col items-center justify-center space-y-3">
          <Workflow className="w-10 h-10 text-gray-300 animate-spin" />
          <p className="text-xs uppercase font-black text-gray-400 tracking-wider">Chargement des registres...</p>
        </div>
      ) : !dayProduction ? (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 flex flex-col items-center text-center max-w-xl mx-auto shadow-xs">
          <AlertTriangle className="w-12 h-12 text-amber-500 mb-3 animate-pulse" />
          <h3 className="text-sm font-black uppercase tracking-wider text-amber-950">Aucun Registre de Production</h3>
          <p className="text-xs mt-2 text-amber-900 font-bold leading-relaxed">
            Aucune donnée de production n'a été scellée en base pour le <span className="underline">{format(new Date(filterDate + "T12:00:00"), 'dd/MM/yyyy')}</span>. 
            Veuillez d'abord déclarer et sceller les postages du jour via l'onglet <strong>Saisie de Poste</strong>.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          
          {/* Consolidated Summaries - KPI Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* KPI 1 : Minage */}
            <div className={`p-4 bg-white border border-gray-150 rounded-2xl hover:shadow-md transition-all cursor-pointer ${activeTab === 'minage' ? 'ring-2 ring-[#b8860b]' : ''}`} onClick={() => setActiveTab('minage')}>
              <div className="flex justify-between items-start">
                <p className="text-[9px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                  <Hammer className="w-3.5 h-3.5 text-[#b8860b]" /> Forage & Volée
                </p>
                <div className="bg-amber-50 p-1.5 rounded-lg border border-amber-100/50">
                  <Bomb className="w-4 h-4 text-[#b8860b]" />
                </div>
              </div>
              <div className="mt-3">
                <h4 className="text-2xl font-black text-gray-900">{sumMinageMeterage.toFixed(1)} m</h4>
                <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-bold mt-1">
                  <span>{sumMinageAnfo} kg ANFO</span>
                  <span className="text-gray-300">•</span>
                  <span className="text-amber-800 font-extrabold">{globalMinageYield.toFixed(2)} m/v</span>
                </div>
              </div>
            </div>

            {/* KPI 2 : Deblayage */}
            <div className={`p-4 bg-white border border-gray-150 rounded-2xl hover:shadow-md transition-all cursor-pointer ${activeTab === 'deblayage' ? 'ring-2 ring-[#b8860b]' : ''}`} onClick={() => setActiveTab('deblayage')}>
              <div className="flex justify-between items-start">
                <p className="text-[9px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                  <Tractor className="w-3.5 h-3.5 text-[#b8860b]" /> Charge & LHD
                </p>
                <div className="bg-amber-50 p-1.5 rounded-lg border border-amber-100/50">
                  <Truck className="w-4 h-4 text-[#b8860b]" />
                </div>
              </div>
              <div className="mt-3">
                <h4 className="text-2xl font-black text-gray-900">{sumDeblayageVolume.toFixed(1)} m³</h4>
                <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-bold mt-1">
                  <span>{sumDeblayageGodets} Godets</span>
                  <span className="text-gray-300">•</span>
                  <span>{sumDeblayageGasoil} L Gasoil</span>
                </div>
              </div>
            </div>

            {/* KPI 3 : Extraction */}
            <div className={`p-4 bg-white border border-gray-150 rounded-2xl hover:shadow-md transition-all cursor-pointer ${activeTab === 'extraction' ? 'ring-2 ring-[#b8860b]' : ''}`} onClick={() => setActiveTab('extraction')}>
              <div className="flex justify-between items-start">
                <p className="text-[9px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                  <Train className="w-3.5 h-3.5 text-[#b8860b]" /> Treuil & Wagons
                </p>
                <div className="bg-amber-50 p-1.5 rounded-lg border border-amber-100/50">
                  <Gauge className="w-4 h-4 text-[#b8860b]" />
                </div>
              </div>
              <div className="mt-3">
                <h4 className="text-2xl font-black text-gray-900">{sumExtractionWagonsActual} Wagons</h4>
                <div className="flex items-center gap-1.5 text-[10px] font-bold mt-1">
                  <span className={`${globalExtractionDiffPct >= 0 ? "text-amber-800" : (globalExtractionDiffPct >= -15 ? "text-amber-700" : "text-rose-700")} font-extrabold`}>
                    {globalExtractionDiffPct > 0 ? '+' : ''}{globalExtractionDiffPct.toFixed(1)}% vs. Obj
                  </span>
                  <span className="text-gray-300">•</span>
                  <span className="text-gray-500">{sumExtractionSterile} Stérile</span>
                </div>
              </div>
            </div>

            {/* KPI 4 : Maintenance */}
            <div className={`p-4 bg-white border border-gray-150 rounded-2xl hover:shadow-md transition-all cursor-pointer ${activeTab === 'maintenance' ? 'ring-2 ring-[#b8860b]' : ''}`} onClick={() => setActiveTab('maintenance')}>
              <div className="flex justify-between items-start">
                <p className="text-[9px] font-black uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
                  <Wrench className="w-3.5 h-3.5 text-[#b8860b]" /> Brigade Technique
                </p>
                <div className="bg-amber-50 p-1.5 rounded-lg border border-amber-100/50">
                  <Cpu className="w-4 h-4 text-[#b8860b]" />
                </div>
              </div>
              <div className="mt-3">
                <h4 className="text-2xl font-black text-gray-900">{sumMaintenanceHours.toFixed(1)} h</h4>
                <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-bold mt-1">
                  <span>{countMaintenanceTasks} Interventions</span>
                  <span className="text-gray-300">•</span>
                  <span className="text-amber-800 font-extrabold">Active</span>
                </div>
              </div>
            </div>

          </div>

          {/* Subheader and Consolidated Tabs Selector */}
          <div className="flex border-b border-gray-200 bg-white p-1 rounded-2xl shadow-xs gap-1.5 matches-icons">
            {tabs.map(tab => {
              const TabIcon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-3 text-[10px] md:text-[11px] font-extrabold uppercase tracking-wider transition-all duration-300 rounded-xl flex items-center justify-center gap-2 cursor-pointer ${
                    activeTab === tab.id 
                      ? 'bg-[#b8860b] text-white shadow-xs font-black' 
                      : 'text-gray-500 hover:text-[#b8860b] hover:bg-amber-50/40 font-semibold'
                  }`}
                >
                  {TabIcon && <TabIcon className={`w-3.5 h-3.5 ${activeTab === tab.id ? 'opacity-100' : 'opacity-60'}`} />}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Detailed Data Tables grouped by Post (Shift 1, 2, 3) */}
          <div className="space-y-6">
            
            {/* Iterate through shifts list */}
            {([
              { id: 'poste1', label: 'Poste 1 (Matin)', keySuffix: 'p1' },
              { id: 'poste2', label: 'Poste 2 (Après-midi)', keySuffix: 'p2' },
              { id: 'poste3', label: 'Poste 3 (Nuit)', keySuffix: 'p3' },
            ] as const).map(shift => {
              const currentPostData = dayProduction.postes?.[shift.id] || {};
              const rawRecords = currentPostData?.[activeTab] || [];

              // Intelligent Sorting by Sector (Imiter 2 -> Imiter 1 -> Imiter Est)
              const records = (() => {
                if (activeTab === 'minage' || activeTab === 'deblayage' || activeTab === 'extraction') {
                  const sectorOrder = ['Imiter 2', 'Imiter 1', 'Imiter Est'];
                  const getSectorSortingIndex = (sector: string) => {
                    const index = sectorOrder.findIndex(s => s.toLowerCase() === (sector || '').trim().toLowerCase());
                    return index === -1 ? 999 : index;
                  };

                  const getRecordSectorGroup = (rec: any) => {
                    const row = rec.reel || rec;
                    const plan = rec.plan || {};
                    const sector = rec.sectorGroup || rec.reel?.sectorGroup || rec.plan?.sectorGroup || plan.sectorGroup || '';
                    if (sector) return sector;
                    
                    // Fallback to chantier lookup
                    const chantierId = row.chantierId || rec.chantierId || plan.chantierId;
                    if (chantierId) {
                      const matched = chantiers.find(c => c.id === chantierId);
                      if (matched && matched.sector) return matched.sector;
                    }
                    return '';
                  };

                  return [...rawRecords].sort((a: any, b: any) => {
                    const sectorA = getRecordSectorGroup(a);
                    const sectorB = getRecordSectorGroup(b);
                    const idxA = getSectorSortingIndex(sectorA);
                    const idxB = getSectorSortingIndex(sectorB);
                    if (idxA !== idxB) {
                      return idxA - idxB;
                    }
                    // secondary sort by chantier name
                    const nameA = getChantierName((a.reel || a).chantierId || a.chantierId || (a.plan || {}).chantierId || '').toLowerCase();
                    const nameB = getChantierName((b.reel || b).chantierId || b.chantierId || (b.plan || {}).chantierId || '').toLowerCase();
                    return nameA.localeCompare(nameB);
                  });
                }
                return rawRecords;
              })();

              return (
                <div key={shift.id} className="bg-white border border-gray-150 rounded-2xl shadow-xs overflow-hidden">
                  
                  {/* Shift Subheader bar styled elegantly with center-aligned gold visual theme */}
                  <div className="bg-white p-5 flex flex-col items-center justify-center select-none border-b border-gray-100">
                    <h4 className="text-[12px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#b8860b]" />
                      <span className="bg-gradient-to-r from-[#8a660d] via-[#b8860b] to-[#8a660d] bg-clip-text text-transparent">
                        {shift.label}
                      </span>
                    </h4>
                    <div className="w-16 h-[1.5px] bg-gradient-to-r from-transparent via-[#b8860b]/35 to-transparent mt-1.5 mb-2.5" />
                    {currentPostData.chiefName && (
                      <div className="text-[9.5px] font-bold text-[#b8860b] uppercase bg-amber-50/50 px-3 py-1 border border-amber-200/40 rounded-lg flex items-center gap-1.5 select-none animate-fade-in">
                        <HardHat className="w-3 h-3 text-[#b8860b]" />
                        <span>Chef de Poste : <strong>{currentPostData.chiefName} ({currentPostData.chiefMatricule})</strong></span>
                      </div>
                    )}
                  </div>

                  {/* Operational Tab Renders */}
                  {(() => {
                    // Check if there are records for target sectors or maintenance
                    const targetSectors = ['Imiter 2', 'Imiter 1', 'Imiter Est'] as const;
                    const hasAnyRecords = activeTab === 'maintenance'
                      ? records.length > 0
                      : targetSectors.some(sec => records.some(r => getRecordSectorGroup(r).trim().toLowerCase() === sec.toLowerCase()));

                    if (!hasAnyRecords) {
                      return (
                        <div className="p-8 text-center bg-gray-50/15 border-dashed border-2 border-gray-105 m-4 rounded-xl">
                          <p className="text-[10px] font-black uppercase text-gray-400 tracking-wide">
                            Aucun enregistrement scellé pour ce shift
                          </p>
                        </div>
                      );
                    }

                    // For Maintenance: render a single table normally
                    if (activeTab === 'maintenance') {
                      return renderMaintenanceTable(records);
                    }

                    // For operational tabs (minage, deblayage, extraction):
                    // Group and render separate tables per sector
                    return (
                      <div className="space-y-6 pb-6">
                        {targetSectors.map(sector => {
                          const sectorRecords = records.filter(r => getRecordSectorGroup(r).trim().toLowerCase() === sector.toLowerCase());
                          if (sectorRecords.length === 0) return null;

                          const sectorStyle = getSectorStyle(sector);
                          const chefInfo = getSectorChefInfo(sector, currentPostData.sectorChefs);

                          return (
                            <div key={sector} className="space-y-3 px-4">
                              {/* Elegant Sector Banner with Chef info */}
                              <div className={`p-3 ${sectorStyle.bgColor} border-l-4 ${sectorStyle.borderColor} rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs`}>
                                <div className="flex items-center gap-2">
                                  <span className={`w-2.5 h-2.5 rounded-full ${sectorStyle.dotColor}`} />
                                  <span className={`text-[11px] font-black uppercase tracking-wider ${sectorStyle.textColor}`}>
                                    Secteur : <strong>{sector}</strong>
                                  </span>
                                </div>
                                {chefInfo && (chefInfo.chiefName || chefInfo.secondChiefName) && (
                                  <div className="text-[9px] font-bold text-gray-600 uppercase flex flex-wrap items-center gap-1.5 select-none">
                                    <HardHat className="w-3.5 h-3.5 text-gray-500" />
                                    <span>
                                      Chef de Secteur : <strong className="text-gray-900">{chefInfo.chiefName || 'N/A'} {chefInfo.chiefMatricule ? `(${chefInfo.chiefMatricule})` : ''}</strong>
                                      {chefInfo.secondChiefName && (
                                        <>
                                          <span className="mx-1 text-gray-300">|</span>
                                          Adjoint : <strong className="text-gray-900">{chefInfo.secondChiefName} {chefInfo.secondChiefMatricule ? `(${chefInfo.secondChiefMatricule})` : ''}</strong>
                                        </>
                                      )}
                                    </span>
                                  </div>
                                )}
                                {activeTab === 'minage' && (() => {
                                  const shiftKey = shift.id === 'poste1' ? 'Poste 1' : shift.id === 'poste2' ? 'Poste 2' : 'Poste 3';
                                  const task = sectorBoutefeuTasks[shiftKey]?.[sector];
                                  if (!task) return null;
                                  return (
                                    <div className="text-[9px] font-bold text-amber-800 uppercase flex items-center gap-1.5 mt-1">
                                      <span>💣 Boutefeu :</span>
                                      <span className="font-black">{task}</span>
                                    </div>
                                  );
                                })()}
                              </div>

                              {/* Appropriate Table based on active tab */}
                              <div className="border border-gray-200/80 rounded-xl overflow-hidden bg-white shadow-2xs">
                                {activeTab === 'minage' && renderMinageTable(sectorRecords)}
                                {activeTab === 'deblayage' && renderDeblayageTable(sectorRecords)}
                                {activeTab === 'extraction' && renderExtractionTable(sectorRecords)}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}

                </div>
              );
            })}

          </div>

        </div>
      ))}

      {reportType === 'month' && (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h3 className="text-[12px] font-black uppercase tracking-wider text-slate-700">
              Synthèse mensuelle — {filterMonth}
            </h3>
          </div>
          {monthlyData.length === 0 ? (
            <div className="p-12 text-center text-[10px] font-black uppercase text-gray-300">
              Aucune donnée de production pour ce mois.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="bg-[#0f172a] text-white text-[9.5px] font-extrabold uppercase tracking-wider">
                    <th className="p-3 border-r border-slate-700/50 text-[#ffd700]">Date</th>
                    <th className="p-3 border-r border-slate-700/50 text-amber-200">Métrage Prévu (m)</th>
                    <th className="p-3 border-r border-slate-700/50 text-emerald-200">Métrage Réalisé (m)</th>
                    <th className="p-3 border-r border-slate-700/50 text-sky-200">Vol. Déblayage Réel (m³)</th>
                    <th className="p-3 border-r border-slate-700/50 text-slate-300">Wagons Prévus</th>
                    <th className="p-3 border-r border-slate-700/50 text-emerald-200">Wagons Réalisés</th>
                    <th className="p-3 border-r border-slate-700/50 text-amber-200">ANFO (kg)</th>
                    <th className="p-3 border-r border-slate-700/50 text-amber-200">Tovex (kg)</th>
                    <th className="p-3 border-r border-slate-700/50 text-slate-300">Amorces (u.)</th>
                    <th className="p-3 text-slate-300">Secrétaire</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {monthlyData.map((day) => {
                    const meterPct = day.totalMeteragePlanned > 0
                      ? ((day.totalMeterageRealised / day.totalMeteragePlanned) * 100).toFixed(1)
                      : null;
                    const wagonPct = day.totalWagonsPlanned > 0
                      ? ((day.totalWagonsRealised / day.totalWagonsPlanned) * 100).toFixed(1)
                      : null;
                    return (
                      <tr key={day.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="p-3 font-mono font-bold text-slate-800 border-r border-gray-100">
                          {day.date ? format(new Date(day.date + 'T12:00:00'), 'dd/MM/yyyy') : day.id}
                        </td>
                        <td className="p-3 text-center font-mono text-slate-400 border-r border-gray-100">
                          {(day.totalMeteragePlanned || 0).toFixed(1)}
                        </td>
                        <td className="p-3 text-center border-r border-gray-100">
                          <span className={`font-mono font-extrabold ${meterPct && Number(meterPct) >= 90 ? 'text-emerald-700' : 'text-rose-600'}`}>
                            {(day.totalMeterageRealised || 0).toFixed(1)}
                            {meterPct && <span className="text-[9px] ml-1 font-bold">({meterPct}%)</span>}
                          </span>
                        </td>
                        <td className="p-3 text-center font-mono text-sky-700 font-bold border-r border-gray-100">
                          {(day.totalDeblayageRealised || 0).toFixed(1)}
                        </td>
                        <td className="p-3 text-center font-mono text-slate-400 border-r border-gray-100">
                          {day.totalWagonsPlanned || 0}
                        </td>
                        <td className="p-3 text-center border-r border-gray-100">
                          <span className={`font-mono font-extrabold ${wagonPct && Number(wagonPct) >= 90 ? 'text-emerald-700' : 'text-rose-600'}`}>
                            {day.totalWagonsRealised || 0}
                            {wagonPct && <span className="text-[9px] ml-1 font-bold">({wagonPct}%)</span>}
                          </span>
                        </td>
                        <td className="p-3 text-center font-mono text-amber-700 font-bold border-r border-gray-100">
                          {(day.totalAnfo || 0).toFixed(0)}
                        </td>
                        <td className="p-3 text-center font-mono text-amber-600 font-bold border-r border-gray-100">
                          {(day.totalTovex || 0).toFixed(2)}
                        </td>
                        <td className="p-3 text-center font-mono text-slate-600 font-bold border-r border-gray-100">
                          {day.totalAmorces || 0}
                        </td>
                        <td className="p-3 text-[10px] text-slate-500 font-bold uppercase">
                          {(day.secretary || '').split('@')[0] || '—'}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-slate-50 border-t-2 border-slate-200 font-black text-[10.5px]">
                    <td className="p-3 text-slate-600 uppercase tracking-wider border-r border-gray-200">TOTAL MOIS</td>
                    <td className="p-3 text-center font-mono text-slate-500 border-r border-gray-200">
                      {monthlyData.reduce((s, d) => s + (d.totalMeteragePlanned || 0), 0).toFixed(1)} m
                    </td>
                    <td className="p-3 text-center font-mono text-emerald-700 border-r border-gray-200">
                      {monthlyData.reduce((s, d) => s + (d.totalMeterageRealised || 0), 0).toFixed(1)} m
                    </td>
                    <td className="p-3 text-center font-mono text-sky-700 border-r border-gray-200">
                      {monthlyData.reduce((s, d) => s + (d.totalDeblayageRealised || 0), 0).toFixed(1)} m³
                    </td>
                    <td className="p-3 text-center font-mono text-slate-500 border-r border-gray-200">
                      {monthlyData.reduce((s, d) => s + (d.totalWagonsPlanned || 0), 0)}
                    </td>
                    <td className="p-3 text-center font-mono text-emerald-700 border-r border-gray-200">
                      {monthlyData.reduce((s, d) => s + (d.totalWagonsRealised || 0), 0)}
                    </td>
                    <td className="p-3 text-center font-mono text-amber-700 border-r border-gray-200">
                      {monthlyData.reduce((s, d) => s + (d.totalAnfo || 0), 0).toFixed(0)} kg
                    </td>
                    <td className="p-3 text-center font-mono text-amber-700 border-r border-gray-200">
                      {monthlyData.reduce((s: number, d: any) => s + (d.totalTovex || 0), 0).toFixed(2)} kg
                    </td>
                    <td className="p-3 text-center font-mono text-slate-600 border-r border-gray-200">
                      {monthlyData.reduce((s: number, d: any) => s + (d.totalAmorces || 0), 0)}
                    </td>
                    <td className="p-3 border-r border-gray-200"></td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

    </div>
  );
};
