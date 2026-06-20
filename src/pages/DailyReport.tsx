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
  Workflow
} from 'lucide-react';
import { collection, query, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { format, subDays } from 'date-fns';
import { ExcelExportButton } from '../components/ExcelExportButton';
import logoImg from '../assets/images/hydromines_logo_1781337889277.jpg';

export const DailyReport: React.FC = () => {
  const [filterDate, setFilterDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [activeTab, setActiveTab] = useState<'minage' | 'deblayage' | 'extraction' | 'maintenance'>('minage');
  const [dayProduction, setDayProduction] = useState<any | null>(null);
  const [chantiers, setChantiers] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [allPlanningSheets, setAllPlanningSheets] = useState<any[]>([]);
  const [allProductionDocs, setAllProductionDocs] = useState<any[]>([]);

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

  // Mapped datasets for the Excel Export Button
  const minageRowsByPost: Record<'Poste 1' | 'Poste 2' | 'Poste 3', any[]> = {
    'Poste 1': minageData.poste1,
    'Poste 2': minageData.poste2,
    'Poste 3': minageData.poste3,
  };

  const deblayageRowsByPost: Record<'Poste 1' | 'Poste 2' | 'Poste 3', any[]> = {
    'Poste 1': deblayageData.poste1,
    'Poste 2': deblayageData.poste2,
    'Poste 3': deblayageData.poste3,
  };

  const extractionRowsByPost: Record<'Poste 1' | 'Poste 2' | 'Poste 3', any[]> = {
    'Poste 1': extractionData.poste1,
    'Poste 2': extractionData.poste2,
    'Poste 3': extractionData.poste3,
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

  // Calculations for KPI Cards
  // Sheet 1 - Minage Totals
  const sumMinageMeterage = [...minageData.poste1, ...minageData.poste2, ...minageData.poste3].reduce((acc, r) => acc + (Number(r.reel?.realMeterage || r.realMeterage) || 0), 0);
  const sumMinageAnfo = [...minageData.poste1, ...minageData.poste2, ...minageData.poste3].reduce((acc, r) => acc + (Number(r.reel?.anfo || r.anfo) || 0), 0);
  const sumMinageTovex = [...minageData.poste1, ...minageData.poste2, ...minageData.poste3].reduce((acc, r) => acc + (Number(r.reel?.tovex || r.tovex) || 0), 0);
  const sumMinageAmorces = [...minageData.poste1, ...minageData.poste2, ...minageData.poste3].reduce((acc, r) => acc + (Number(r.reel?.ammorces || r.ammorces) || 0), 0);
  const sumMinageRounds = [...minageData.poste1, ...minageData.poste2, ...minageData.poste3].reduce((acc, r) => acc + (Number(r.reel?.realRounds || r.realRounds) || 0), 0);
  const globalMinageYield = sumMinageRounds > 0 ? (sumMinageMeterage / sumMinageRounds) : 0;

  // Sheet 2 - Deblayage Totals
  const sumDeblayageGodets = [...deblayageData.poste1, ...deblayageData.poste2, ...deblayageData.poste3].reduce((acc, r) => acc + (Number(r.reel?.godets || r.godets) || 0), 0);
  const sumDeblayageVolume = [...deblayageData.poste1, ...deblayageData.poste2, ...deblayageData.poste3].reduce((acc, r) => acc + (Number(r.reel?.volumeEstimated || r.volumeEstimated) || 0), 0);
  const sumDeblayageGasoil = [...deblayageData.poste1, ...deblayageData.poste2, ...deblayageData.poste3].reduce((acc, r) => acc + (Number(r.reel?.gasoil || r.gasoil) || 0), 0);

  // Sheet 3 - Extraction Totals
  const sumExtractionWagonsActual = [...extractionData.poste1, ...extractionData.poste2, ...extractionData.poste3].reduce((acc, r) => acc + (Number(r.reel?.wagonsActual) || Number(r.wagonsActual) || 0), 0);
  const sumExtractionWagonsTarget = [...extractionData.poste1, ...extractionData.poste2, ...extractionData.poste3].reduce((acc, r) => {
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

  const tabs = [
    { id: 'minage' as const, label: '🔨 1. Forage & Minage', color: 'border-b-amber-500' },
    { id: 'deblayage' as const, label: '🚜 2. LHD & Charge', color: 'border-b-blue-500' },
    { id: 'extraction' as const, label: '🚃 3. Extraction & Treuil', color: 'border-b-emerald-500' },
    { id: 'maintenance' as const, label: '🔧 4. Brigade Technique', color: 'border-b-purple-500' },
  ];

  const unfilledReports = allPlanningSheets
    .map(plan => {
      const planDate = plan.id; // e.g. '2026-06-18' (planned day)
      // Math: expected production day is planDate + 1 day
      const parts = planDate.split('-');
      if (parts.length !== 3) return null;
      const pDateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      const expectedProdDate = format(subDays(pDateObj, -1), 'yyyy-MM-dd'); // using math to add 1 day correctly
      
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
      <div className="bg-white border border-gray-200 rounded-2xl p-5 md:p-6 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex flex-col md:flex-row items-center gap-5">
          <div className="flex-shrink-0 animate-fade-in">
            <img 
              src={logoImg} 
              alt="HydroMines Logo" 
              className="h-24 w-24 md:h-28 md:w-28 object-contain rounded-xl border border-gray-150 p-1.5 bg-white shadow-sm" 
              referrerPolicy="no-referrer" 
            />
          </div>
          <div className="text-center md:text-left">
            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight flex items-center justify-center md:justify-start gap-2 leading-none text-slate-900">
              <span className="text-[#00BFFF]">Hydro</span>
              <span className="text-[#8B0000]">Mines</span>
              <span className="text-slate-300 font-light mx-0.5">|</span>
              <span className="text-slate-850 font-extrabold text-xl md:text-2xl">Rapport Consolidé</span>
            </h1>
            <p className="text-[10px] md:text-xs font-bold text-slate-500 uppercase tracking-widest mt-2 flex items-center justify-center md:justify-start gap-1.5 leading-none">
              <span>SMI (Société Métallurgique d'Imiter)</span>
              <span className="text-slate-300">•</span>
              <span>Registre d'Exploitation Journalière</span>
            </p>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 self-center lg:self-auto w-full lg:w-auto justify-center lg:justify-end">
          {/* Custom Modern Date Selector */}
          <div className="bg-slate-50 border border-gray-250 hover:border-gray-300 rounded-xl px-4 py-2 flex items-center gap-2.5 shadow-xs transition-all w-full sm:w-auto justify-center">
            <Calendar className="w-4 h-4 text-[#00BFFF]" />
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
              Date :
            </span>
            <input 
              type="date" 
              value={filterDate}
              onChange={e => setFilterDate(e.target.value)}
              className="text-xs font-black uppercase text-slate-950 outline-none cursor-pointer bg-transparent"
            />
          </div>

          {/* Premium Excel Export Button integrated */}
          <div className="w-full sm:w-auto">
            {dayProduction ? (
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
            ) : (
              <button 
                disabled 
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 text-[9px] font-black uppercase text-slate-400 bg-slate-50 border border-gray-200 rounded-xl cursor-not-allowed h-10"
                title="Saisir d'abord une production pour activer l'export"
              >
                <Download className="w-3.5 h-3.5" /> Pas de données à exporter
              </button>
            )}
          </div>
        </div>
      </div>

      {loading ? (
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
            <div className={`p-4 bg-white border border-gray-150 rounded-2xl hover:shadow-md transition-all cursor-pointer ${activeTab === 'minage' ? 'ring-2 ring-amber-500' : ''}`} onClick={() => setActiveTab('minage')}>
              <div className="flex justify-between items-start">
                <p className="text-[9px] font-black uppercase tracking-wider text-gray-400">🔨 Forage & Volée</p>
                <div className="bg-amber-50 p-1.5 rounded-lg border border-amber-100">
                  <Bomb className="w-4 h-4 text-amber-600" />
                </div>
              </div>
              <div className="mt-3">
                <h4 className="text-2xl font-black text-gray-900">{sumMinageMeterage.toFixed(1)} m</h4>
                <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-bold mt-1">
                  <span>{sumMinageAnfo} kg ANFO</span>
                  <span className="text-gray-300">•</span>
                  <span className="text-emerald-700 font-extrabold">{globalMinageYield.toFixed(2)} m/v</span>
                </div>
              </div>
            </div>

            {/* KPI 2 : Deblayage */}
            <div className={`p-4 bg-white border border-gray-150 rounded-2xl hover:shadow-md transition-all cursor-pointer ${activeTab === 'deblayage' ? 'ring-2 ring-blue-500' : ''}`} onClick={() => setActiveTab('deblayage')}>
              <div className="flex justify-between items-start">
                <p className="text-[9px] font-black uppercase tracking-wider text-gray-400">🚜 Charge & LHD</p>
                <div className="bg-blue-50 p-1.5 rounded-lg border border-blue-100">
                  <Truck className="w-4 h-4 text-blue-600" />
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
            <div className={`p-4 bg-white border border-gray-150 rounded-2xl hover:shadow-md transition-all cursor-pointer ${activeTab === 'extraction' ? 'ring-2 ring-emerald-500' : ''}`} onClick={() => setActiveTab('extraction')}>
              <div className="flex justify-between items-start">
                <p className="text-[9px] font-black uppercase tracking-wider text-gray-400">🚃 Treuil & Wagons</p>
                <div className="bg-emerald-50 p-1.5 rounded-lg border border-emerald-100">
                  <Gauge className="w-4 h-4 text-emerald-600" />
                </div>
              </div>
              <div className="mt-3">
                <h4 className="text-2xl font-black text-gray-900">{sumExtractionWagonsActual} Wagons</h4>
                <div className="flex items-center gap-1.5 text-[10px] font-bold mt-1">
                  <span className={`${globalExtractionDiffPct >= 0 ? "text-emerald-700" : (globalExtractionDiffPct >= -15 ? "text-blue-700" : "text-rose-700")} font-extrabold`}>
                    {globalExtractionDiffPct > 0 ? '+' : ''}{globalExtractionDiffPct.toFixed(1)}% vs. Obj
                  </span>
                  <span className="text-gray-300">•</span>
                  <span className="text-gray-500">{sumExtractionSterile} Stérile</span>
                </div>
              </div>
            </div>

            {/* KPI 4 : Maintenance */}
            <div className={`p-4 bg-white border border-gray-150 rounded-2xl hover:shadow-md transition-all cursor-pointer ${activeTab === 'maintenance' ? 'ring-2 ring-purple-500' : ''}`} onClick={() => setActiveTab('maintenance')}>
              <div className="flex justify-between items-start">
                <p className="text-[9px] font-black uppercase tracking-wider text-gray-400">🔧 Brigade Technique</p>
                <div className="bg-purple-50 p-1.5 rounded-lg border border-purple-100">
                  <Cpu className="w-4 h-4 text-purple-600" />
                </div>
              </div>
              <div className="mt-3">
                <h4 className="text-2xl font-black text-gray-900">{sumMaintenanceHours.toFixed(1)} h</h4>
                <div className="flex items-center gap-1.5 text-[10px] text-gray-500 font-bold mt-1">
                  <span>{countMaintenanceTasks} Interventions</span>
                  <span className="text-gray-300">•</span>
                  <span className="text-emerald-700 font-extrabold">Active</span>
                </div>
              </div>
            </div>

          </div>

          {/* Subheader and Consolidated Tabs Selector */}
          <div className="flex border-b border-gray-200 bg-white p-1 rounded-2xl shadow-xs gap-1.5">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-3 text-[10px] md:text-[11px] font-extrabold uppercase tracking-wider transition-all duration-300 rounded-xl text-center cursor-pointer ${
                  activeTab === tab.id 
                    ? 'bg-slate-900 text-white shadow-xs' 
                    : 'text-gray-500 hover:text-gray-900 hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
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
              const records = React.useMemo(() => {
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
              }, [rawRecords, activeTab, chantiers, dayProduction]);

              return (
                <div key={shift.id} className="bg-white border border-gray-150 rounded-2xl shadow-xs overflow-hidden">
                  
                  {/* Shift Subheader bar */}
                  <div className="bg-gray-50 border-b border-gray-150 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-[#00BFFF]" />
                      <span className="text-xs font-black uppercase tracking-wider text-gray-900">{shift.label}</span>
                    </div>
                    {currentPostData.chiefName && (
                      <div className="text-[10px] font-bold text-gray-509 uppercase flex items-center gap-1.5 bg-white px-3 py-1 border border-gray-150 rounded-lg">
                        <HardHat className="w-3.5 h-3.5 text-slate-500" />
                        <span>Chef de Poste : <strong>{currentPostData.chiefName} ({currentPostData.chiefMatricule})</strong></span>
                      </div>
                    )}
                  </div>

                  {/* Operational Tab Renders */}
                  {records.length === 0 ? (
                    <div className="p-8 text-center bg-gray-50/15 border-dashed border-2 border-gray-100 m-4 rounded-xl">
                      <p className="text-[10px] font-black uppercase text-gray-400 tracking-wide">
                        Aucun enregistrement scellé pour ce shift
                      </p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      
                      {/* Forage & Minage Tab Render */}
                      {activeTab === 'minage' && (
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-gray-100/50 text-[9px] uppercase font-black tracking-wider text-gray-505 border-b border-gray-200">
                              <th className="p-3 w-12 text-center text-gray-400">#</th>
                              <th className="p-3">Chantier / Galerie</th>
                              <th className="p-3">Mineur & Aide</th>
                              <th className="p-3 text-center">Trous Forés</th>
                              <th className="p-3 text-center">Volées (u.)</th>
                              <th className="p-3 text-center">Métrage (m)</th>
                              <th className="p-3 text-center">KPI Rendement (m/v)</th>
                              <th className="p-3 text-center">Consommation Explosifs</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 text-[10.5px] font-bold text-slate-700">
                            {records.map((r: any, idx: number) => {
                              const row = r.reel || r;
                              const plan = r.plan || {};
                              const rYield = row.realRounds > 0 ? (row.realMeterage / row.realRounds) : 0;
                              let statusLabel = 'NORMAL';
                              let statusColor = 'bg-blue-50 text-blue-700 border-blue-200';
                              if (row.realRounds > 0) {
                                if (rYield >= 1.5) {
                                  statusLabel = 'PERFORMANT';
                                  statusColor = 'bg-emerald-50 text-emerald-800 border-emerald-250';
                                } else if (rYield <= 1.3) {
                                  statusLabel = 'SOUS-KPI';
                                  statusColor = 'bg-red-50 text-red-800 border-red-200 animate-pulse';
                                }
                              }

                              return (
                                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                  <td className="p-3 text-center text-gray-400 font-mono text-[9px] bg-gray-50/20">{idx + 1}</td>
                                  <td className="p-3">
                                    <div className="text-[11px] font-extrabold text-[#00BFFF]">{getChantierName(row.chantierId)}</div>
                                    <div className="text-[8.5px] text-gray-450 font-normal">Section : {row.gallerySize || 12}m² • {row.barType || '1.8m'}</div>
                                  </td>
                                  <td className="p-3">
                                    <div className="text-gray-900 block truncate max-w-[140px] uppercase">{getPersonnelName(row.minerMatricule)}</div>
                                    <div className="text-gray-400 text-[8.5px] font-semibold uppercase truncate max-w-[140px]">Aid : {getPersonnelName(row.assistantMatricule) || 'N/A'}</div>
                                  </td>
                                  <td className="p-3 text-center font-mono text-[11px] text-gray-800">{row.realHoles || 0} trs</td>
                                  <td className="p-3 text-center font-mono text-[11px] text-gray-800">{row.realRounds || 0} vol</td>
                                  <td className="p-3 text-center font-mono text-[11px] font-extrabold text-slate-900 bg-amber-50/20">{row.realMeterage || 0} m</td>
                                  <td className="p-3 text-center">
                                    <span className={`inline-flex px-2 py-0.5 border text-[8.5px] font-black uppercase rounded ${statusColor}`}>
                                      {rYield > 0 ? `${rYield.toFixed(2)} m/v` : '0.00'} — {statusLabel}
                                    </span>
                                  </td>
                                  <td className="p-3 text-center">
                                    <div className="inline-grid grid-cols-3 gap-1 font-mono text-[9px] uppercase border border-gray-200/60 p-1 bg-gray-50/40 rounded">
                                      <span className="text-red-750 px-1 font-extrabold" title="ANFO kg">ANF: {row.anfo || 0}</span>
                                      <span className="text-amber-805 px-1 font-extrabold" title="Tovex u.">TOV: {row.tovex || 0}</span>
                                      <span className="text-blue-805 px-1 font-extrabold" title="Amorces u.">AMO: {row.ammorces || 0}</span>
                                    </div>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}

                      {/* LHD & Charge Tab Render */}
                      {activeTab === 'deblayage' && (
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-gray-100/50 text-[9px] uppercase font-black tracking-wider text-gray-550 border-b border-gray-200">
                              <th className="p-3 w-12 text-center text-gray-400">#</th>
                              <th className="p-3">Chantier de Charge</th>
                              <th className="p-3">Conducteur Engin</th>
                              <th className="p-3 text-center">Engin LHD</th>
                              <th className="p-3 text-center">Nombre Godets</th>
                              <th className="p-3 text-center">Métrage Estimé (m³)</th>
                              <th className="p-3 text-center">Métrage Réel (m³)</th>
                              <th className="p-3 text-center">Écart vs Estimé (%)</th>
                              <th className="p-3 text-center">Gasoil (L)</th>
                              <th className="p-3 text-center border-r border-gray-100">Lubrifiants Qty</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 text-[10.5px] font-bold text-slate-700">
                            {records.map((r: any, idx: number) => {
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
                                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                  <td className="p-3 text-center text-gray-400 font-mono text-[9px] bg-gray-50/20">{idx + 1}</td>
                                  <td className="p-3 font-extrabold text-blue-750">{getChantierName(row.chantierId)}</td>
                                  <td className="p-3 text-gray-900 uppercase">{getPersonnelName(row.driverMatricule)} ({row.driverMatricule})</td>
                                  <td className="p-3 text-center">
                                    <span className="font-mono font-extrabold bg-blue-50 text-blue-700 border border-blue-150 px-2 py-0.5 rounded text-[9.5px]">
                                      {row.engineCode || row.engineId || '-'}
                                    </span>
                                  </td>
                                  <td className="p-3 text-center font-mono text-[11px] text-gray-800">{row.godets || 0}</td>
                                  <td className="p-3 text-center font-mono text-[11px] text-slate-500 bg-slate-50/20">{targetVol.toFixed(1)} m³</td>
                                  <td className="p-3 text-center font-mono text-[11px] font-extrabold text-slate-900 bg-emerald-50/20">{realVol.toFixed(1)} m³</td>
                                  <td className="p-3 text-center">
                                    <span className={`inline-flex px-2 py-0.5 border text-[8.5px] font-black uppercase rounded ${diffVolColor}`}>
                                      {targetVol === 0 ? (realVol === 0 ? "CONFORME" : `+${realVol.toFixed(1)} m³ (HORS-PLAN)`) : `${diffVolAbs >= 0 ? '+' : ''}${diffVolAbs.toFixed(1)} m³ (${diffVolPct >= 0 ? '+' : ''}${diffVolPct.toFixed(1)}%)`}
                                    </span>
                                  </td>
                                  <td className="p-3 text-center font-mono text-[#00BFFF]">{row.gasoil || 0} L</td>
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
                      )}

                      {/* Extraction & Treuils Tab Render */}
                      {activeTab === 'extraction' && (
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-gray-100/50 text-[9px] uppercase font-black tracking-wider text-gray-550 border-b border-gray-200">
                              <th className="p-3 w-12 text-center text-gray-400">#</th>
                              <th className="p-3">Installation Treuil</th>
                              <th className="p-3">Opérateurs Terrain (Treuilliste / Équipiers)</th>
                              <th className="p-3 text-center">Cible (Wagons)</th>
                              <th className="p-3 text-center">Réalisé (Wag)</th>
                              <th className="p-3 text-center">Stérile Bure (Wg)</th>
                              <th className="p-3 text-center">Total Tirés (Wg)</th>
                              <th className="p-3 text-center">Écart vs Objectif (%)</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 text-[10.5px] font-bold text-slate-700">
                            {records.map((r: any, idx: number) => {
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
                                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                  <td className="p-3 text-center text-gray-400 font-mono text-[9px] bg-gray-50/20">{idx + 1}</td>
                                  <td className="p-3 font-extrabold text-emerald-800 uppercase">{r.installationName || r.chantierName || 'Bure'}</td>
                                  <td className="p-3">
                                    <div className="text-gray-900 uppercase">Treuilliste : {getPersonnelName(r.treuilliste)}</div>
                                    <div className="text-[8.5px] text-gray-450 uppercase mt-0.5 leading-tight">
                                      Équipiers : {[r.equipier1, r.equipier2, r.equipier3, r.equipier4].filter(Boolean).map(getPersonnelName).join(' / ') || 'N/A'}
                                    </div>
                                  </td>
                                  <td className="p-3 text-center font-mono text-[11px] text-gray-400">{target}</td>
                                  <td className="p-3 text-center font-mono text-[11px] font-extrabold text-emerald-950 bg-emerald-50/30">{actual}</td>
                                  <td className="p-3 text-center font-mono text-[11px] text-amber-705 bg-amber-50/10">{sterile}</td>
                                  <td className="p-3 text-center font-mono text-[11px] text-slate-800 bg-gray-50/20">{total}</td>
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
                      )}

                      {/* Maintenance Brigade Tech Tab Render */}
                      {activeTab === 'maintenance' && (
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-gray-100/50 text-[9px] uppercase font-black tracking-wider text-gray-550 border-b border-gray-200">
                              <th className="p-3 w-12 text-center text-gray-400">#</th>
                              <th className="p-3">Rôle Fixe SMI</th>
                              <th className="p-3">Matricule & Spécialiste</th>
                              <th className="p-3 text-center">Engin Affecté</th>
                              <th className="p-3 text-center">Heures Consacrées</th>
                              <th className="p-3">Description Diagnostic / Tâches Planifiées Real</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 text-[10.5px] font-bold text-slate-700">
                            {records.map((r: any, idx: number) => {
                              const row = r.reel || r;
                              const plan = r.plan || {};
                              return (
                                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                  <td className="p-3 text-center text-gray-400 font-mono text-[9px] bg-gray-50/20">{idx + 1}</td>
                                  <td className="p-3 font-extrabold text-purple-750 uppercase">{row.roleLabel || '-'}</td>
                                  <td className="p-3 text-slate-900 uppercase">
                                    {getPersonnelName(row.agentMatricule || row.mechanicMatricule)} ({row.agentMatricule || row.mechanicMatricule || '-'})
                                  </td>
                                  <td className="p-3 text-center">
                                    <span className="font-mono bg-purple-50 text-purple-750 border border-purple-150 px-2 py-0.5 rounded text-[9.5px]">
                                      {row.engineCode || row.engineId || '-'}
                                    </span>
                                  </td>
                                  <td className="p-3 text-center font-mono text-[11px] text-purple-900 font-extrabold bg-purple-50/20">
                                    {row.hoursSpent || 0} h
                                  </td>
                                  <td className="p-3 text-[10.5px] text-gray-600 font-normal leading-relaxed">{row.workDescription || '-'}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      )}

                    </div>
                  )}

                </div>
              );
            })}

          </div>

        </div>
      )}

    </div>
  );
};
