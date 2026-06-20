import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Plus, 
  Check, 
  Search, 
  Filter, 
  Calendar, 
  Hammer, 
  MapPin, 
  Clock, 
  X, 
  FileSpreadsheet,
  Save,
  RotateCcw,
  CheckCircle,
  Info,
  Wrench,
  Truck,
  Lock,
  Pencil,
  Gauge,
  TrendingUp,
  Copy,
  Trash2,
  ClipboardList,
  AlertCircle
} from 'lucide-react';
import { collection, query, onSnapshot, setDoc, doc, getDocs, deleteDoc, where, writeBatch, addDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { format, addDays } from 'date-fns';
import { MatriculeAutocomplete } from '../components/MatriculeAutocomplete';
import logoImg from '../assets/images/hydromines_logo_1781337889277.jpg';
import { ExcelExportButton } from '../components/ExcelExportButton';
import { GapReportModal } from '../components/GapReportModal';
import { AuditLogsDrawer, logPlanningAction } from '../components/AuditLogsDrawer';

// Excel interface structures matching Production schema for full planning alignment
interface ExcelMinage {
  chantierId: string;
  chiefMatricule: string;
  chiefName: string;
  minerMatricule: string;
  minerName: string;
  assistantMatricule: string;
  assistantName: string;
  gallerySize: 9 | 12; // m²
  plannedHoles: number;
  realHoles: number;
  plannedRounds: number;
  realRounds: number;
  barType?: '1.8m' | '2.4m';
  meterage: number; // calculated target avancement
  anfo: number;
  tovex: number;
  ammorces: number;
  remarks: string;

  // Custom UI groupings/overrides
  sectorGroup?: string;
  explosivesManualOverride?: boolean;
}

interface ExcelDeblayage {
  chantierId: string;
  driverMatricule: string;
  driverName: string;
  engineId: string;
  engineCode: string;
  godets: number;
  volumeEstimated: number; // godets * 1.5
  hoursWorked: number;
  remarks: string;

  // Custom UI grouping
  sectorGroup?: string;
}

interface ExcelExtraction {
  chantierName: string; // "Extraction Bure N340 Imiter Est"
  treuilliste: string;
  equipier1: string;
  equipier2: string;
  equipier3: string;
  equipier4: string;
  wagonsTarget: number;
  wagonsActual: number; // Not useful in planning but kept for structural synchronization
  sterileBureImiterEst: number;
  startTime: string; // Heure début
  endTime: string; // Heure finit
  remarks: string;
  treuilliste1?: string;
  treuilliste2?: string;
  treuilliste3?: string;
  ouvriersCount?: number;
}

const DEFAULT_ROWS_PER_SECTOR: Record<'Poste 1' | 'Poste 2' | 'Poste 3', Record<'Imiter 2' | 'Imiter 1' | 'Imiter Est', number>> = {
  'Poste 1': {
    'Imiter 2': 3,
    'Imiter 1': 2,
    'Imiter Est': 3,
  },
  'Poste 2': {
    'Imiter 2': 2,
    'Imiter 1': 2,
    'Imiter Est': 2,
  },
  'Poste 3': {
    'Imiter 2': 2,
    'Imiter 1': 2,
    'Imiter Est': 2,
  },
};

const POST_HOURS: Record<'Poste 1' | 'Poste 2' | 'Poste 3', { start: string; end: string; duration: number }> = {
  'Poste 1': { start: '07:00', end: '14:00', duration: 7 },
  'Poste 2': { start: '15:00', end: '22:00', duration: 7 },
  'Poste 3': { start: '23:00', end: '06:00', duration: 7 },
};

const EXPLOSIVES_PER_ROUND: Record<9 | 12, { anfo: number; tovex: number; ammorces: number; plannedHoles: number }> = {
  9:  { anfo: 35, tovex: 2.6, ammorces: 26, plannedHoles: 28 }, // 28 trous prévus, 26 chargés (ammorces)
  12: { anfo: 40, tovex: 3.2, ammorces: 32, plannedHoles: 38 }, // 38 trous prévus, 32 chargés (ammorces)
};

const computeExplosives = (gallerySize: 9 | 12, plannedRounds: number) => {
  const base = EXPLOSIVES_PER_ROUND[gallerySize] || EXPLOSIVES_PER_ROUND[9];
  const rounds = plannedRounds || 0;
  return {
    anfo: Math.round(base.anfo * rounds * 100) / 100,
    tovex: Math.round(base.tovex * rounds * 100) / 100,
    ammorces: Math.round(base.ammorces * rounds),
    plannedHoles: base.plannedHoles * rounds,
  };
};

const isEstSector = (s: string) => {
  const lower = (s || '').toLowerCase();
  return lower.includes('est') || lower.includes('bure');
};

const isSectorMatching = (s1: string, s2: string) => {
  const norm1 = (s1 || '').toLowerCase().trim();
  const norm2 = (s2 || '').toLowerCase().trim();
  if (norm1 === norm2) return true;
  if (isEstSector(norm1) && isEstSector(norm2)) return true;
  return false;
};

const getSectorBadgeStyles = (sec: string) => {
  const norm = (sec || '').toLowerCase().trim();
  if (norm.includes('imiter 1')) {
    return {
      bg: 'bg-sky-50 border border-sky-250 text-sky-800 shadow-xs ring-1 ring-sky-300/30',
      dot: 'bg-sky-500'
    };
  }
  if (norm.includes('imiter 2')) {
    return {
      bg: 'bg-rose-50 border border-rose-250 text-rose-800 shadow-xs ring-1 ring-rose-300/30',
      dot: 'bg-rose-500'
    };
  }
  if (norm.includes('est') && norm.includes('bure')) {
    return {
      bg: 'bg-indigo-50 border border-indigo-250 text-indigo-800 shadow-xs ring-1 ring-indigo-300/30',
      dot: 'bg-indigo-500'
    };
  }
  if (norm.includes('est')) {
    return {
      bg: 'bg-emerald-50 border border-emerald-250 text-emerald-800 shadow-xs ring-1 ring-emerald-300/30',
      dot: 'bg-emerald-500'
    };
  }
  return {
    bg: 'bg-slate-50 border border-slate-250 text-slate-700 shadow-xs ring-1 ring-slate-300/30',
    dot: 'bg-slate-500'
  };
};

const sanitizeExtractionRows = (rows: any[] | undefined, defaults?: { start: string; end: string }): ExcelExtraction[] => {
  const dStart = defaults?.start || '08:00';
  const dEnd = defaults?.end || '13:30';
  if (!rows || rows.length === 0) {
    return [{
      chantierName: 'Extraction Bure N340 Imiter Est',
      treuilliste: '',
      equipier1: '',
      equipier2: '',
      equipier3: '',
      equipier4: '',
      wagonsTarget: 48,
      wagonsActual: 0,
      sterileBureImiterEst: 0,
      startTime: dStart,
      endTime: dEnd,
      remarks: ''
    }];
  }
  const first = rows[0] || {};
  return [{
    chantierName: 'Extraction Bure N340 Imiter Est',
    treuilliste: first.treuilliste || first.treuilliste1 || '',
    equipier1: first.equipier1 || '',
    equipier2: first.equipier2 || '',
    equipier3: first.equipier3 || '',
    equipier4: first.equipier4 || '',
    wagonsTarget: first.wagonsTarget !== undefined ? first.wagonsTarget : 48,
    wagonsActual: first.wagonsActual || 0,
    sterileBureImiterEst: first.sterileBureImiterEst || 0,
    startTime: first.startTime || dStart,
    endTime: first.endTime || dEnd,
    remarks: first.remarks || ''
  }];
};

interface ExcelMaintenance {
  roleLabel: string; // MÉCANICIEN 1, etc.
  agentMatricule: string;
  agentName: string;
  engineId: string;
  engineCode: string;
  hoursSpent: number;
  workDescription: string;
}

const ensureMinimumRows = (
  loadedRows: any[],
  type: 'minage' | 'deblayage',
  post: 'Poste 1' | 'Poste 2' | 'Poste 3',
  chantiersList: any[]
) => {
  const sectors: ('Imiter 2' | 'Imiter 1' | 'Imiter Est')[] = ['Imiter 2', 'Imiter 1', 'Imiter Est'];
  const result: any[] = [];
  const unassignedLoaded = [...loadedRows];

  sectors.forEach(sec => {
    // 1. Get open chantiers matching this sector
    const openChantiersInSec = chantiersList.filter(c => c.status === 'ouvert' && isSectorMatching(c.sector, sec));
    const finalSectorRows: any[] = [];

    // 2. Map each open chantier to existing rows, or generate empty ones prefilled with chantierId
    openChantiersInSec.forEach(chan => {
      const existingIdx = unassignedLoaded.findIndex(row => row.chantierId === chan.id);
      if (existingIdx !== -1) {
        const [matched] = unassignedLoaded.splice(existingIdx, 1);
        finalSectorRows.push({ ...matched, sectorGroup: sec });
      } else {
        if (type === 'minage') {
          const sizeVal: 9 | 12 = chan.galleryType === '9m2' ? 9 : 12;
          const explosives = computeExplosives(sizeVal, 1);
          finalSectorRows.push({
            chantierId: chan.id, chiefMatricule: '', chiefName: '', minerMatricule: '', minerName: '',
            assistantMatricule: '', assistantName: '', gallerySize: sizeVal, plannedHoles: explosives.plannedHoles, realHoles: explosives.plannedHoles,
            plannedRounds: 1, realRounds: 1, barType: '1.8m', meterage: 1.7, anfo: explosives.anfo, tovex: explosives.tovex, ammorces: explosives.ammorces, remarks: '',
            sectorGroup: sec, explosivesManualOverride: false
          });
        } else {
          finalSectorRows.push({
            chantierId: chan.id, driverMatricule: '', driverName: '', engineId: '', engineCode: '',
            godets: 0, volumeEstimated: 0, hoursWorked: POST_HOURS[post].duration, remarks: '',
            sectorGroup: sec
          });
        }
      }
    });

    // 3. Find any remaining loaded rows belonging to this sector
    const matchingRemainders = unassignedLoaded.filter(row => {
      if (row.sectorGroup === sec) return true;
      const ch = chantiersList.find(c => c.id === row.chantierId);
      return ch ? isSectorMatching(ch.sector, sec) : false;
    });

    matchingRemainders.forEach(row => {
      finalSectorRows.push({ ...row, sectorGroup: sec });
      const idx = unassignedLoaded.indexOf(row);
      if (idx !== -1) unassignedLoaded.splice(idx, 1);
    });

    // 4. Fallback default empty row if absolutely no chantiers exist
    if (finalSectorRows.length === 0) {
      if (type === 'minage') {
        const explosives = computeExplosives(12, 1);
        finalSectorRows.push({
          chantierId: '', chiefMatricule: '', chiefName: '', minerMatricule: '', minerName: '',
          assistantMatricule: '', assistantName: '', gallerySize: 12, plannedHoles: explosives.plannedHoles, realHoles: explosives.plannedHoles,
          plannedRounds: 1, realRounds: 1, barType: '1.8m', meterage: 1.7, anfo: explosives.anfo, tovex: explosives.tovex, ammorces: explosives.ammorces, remarks: '',
          sectorGroup: sec, explosivesManualOverride: false
        });
      } else {
        finalSectorRows.push({
          chantierId: '', driverMatricule: '', driverName: '', engineId: '', engineCode: '',
          godets: 0, volumeEstimated: 0, hoursWorked: POST_HOURS[post].duration, remarks: '',
          sectorGroup: sec
        });
      }
    }

    result.push(...finalSectorRows);
  });

  return result;
};

export const Planning: React.FC = () => {
  const { user, profile } = useAuth();

  // App views: 'sheet' (Excel Mode) or 'history' (Consolidated lists)
  const [viewMode, setViewMode] = useState<'sheet' | 'history'>('sheet');
  const [activeSheetTab, setActiveSheetTab] = useState<'minage' | 'deblayage' | 'extraction' | 'maintenance'>('minage');

  // Core planning filters: default date is today
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedPost, setSelectedPost] = useState<'Poste 1' | 'Poste 2' | 'Poste 3'>('Poste 1');

  // Realtime month closure states
  const [isMonthClosedForPlanning, setIsMonthClosedForPlanning] = useState(false);
  const [monthClosureInfo, setMonthClosureInfo] = useState<{ closedBy: string; closedAt: string } | null>(null);

  // Reference tables from Firebase
  const [planningsHistory, setPlanningsHistory] = useState<any[]>([]);
  const [deletedLogs, setDeletedLogs] = useState<any[]>([]);
  const [activeHistoryTab, setActiveHistoryTab] = useState<'books' | 'deletions'>('books');
  const [recordToDelete, setRecordToDelete] = useState<any | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletionNotification, setDeletionNotification] = useState<{ date: string; deletedBy: string } | null>(null);
  const [chantiers, setChantiers] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [engines, setEngines] = useState<any[]>([]);
  const [platformSettings, setPlatformSettings] = useState<{
    sectors: string[];
    engines: string[];
    oils: string[];
    defaultWagonsTarget?: number;
  }>({
    sectors: ['Imiter 1', 'Imiter 2', 'Imiter Est'],
    engines: ['ST2D', 'ST2G 1', 'ST2G 3', 'ST2G 4', 'ST2G 5', 'ST2G6'],
    oils: ['Huile Moteur 15W40', 'Huile Hydraulique HV46', 'Huile Hydraulique HV68', 'Huile Transmission SAE30', 'Huile Transmission SAE50', 'Graisse Extrême Pression'],
    defaultWagonsTarget: 48
  });
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Traceability & signature states
  const [signatureInfo, setSignatureInfo] = useState<{
    savedBy?: string;
    savedAt?: string;
    lastModifiedBy?: string;
    lastModifiedAt?: string;
  } | null>(null);
  const [isPlanningSavedInDb, setIsPlanningSavedInDb] = useState(false);
  const [validationInfo, setValidationInfo] = useState<{
    validatedBy?: string;
    validatedByUid?: string;
    validatedAt?: string;
    status?: string;
  } | null>(null);
  const [modRequests, setModRequests] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 10000); // updates every 10 seconds to keep minutes countdown accurate
    return () => clearInterval(timer);
  }, []);

  // Realtime month closure detector for Planning
  useEffect(() => {
    if (!selectedDate) return;
    const monthStr = selectedDate.substring(0, 7); // 'YYYY-MM'
    const unsubClosure = onSnapshot(doc(db, 'settings', 'closures'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        const monthData = data[monthStr];
        if (monthData) {
          setIsMonthClosedForPlanning(true);
          setMonthClosureInfo({
            closedBy: monthData.closedBy || 'Administrateur',
            closedAt: monthData.closedAt || ''
          });
        } else {
          setIsMonthClosedForPlanning(false);
          setMonthClosureInfo(null);
        }
      } else {
        setIsMonthClosedForPlanning(false);
        setMonthClosureInfo(null);
      }
    }, (err) => {
      console.warn("Error reading closures settings for planning:", err);
    });
    return () => unsubClosure();
  }, [selectedDate]);

  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [requestReason, setRequestReason] = useState('');
  const [productionDates, setProductionDates] = useState<Set<string>>(new Set());

  // Gap Report control states
  const [isGapModalOpen, setIsGapModalOpen] = useState(false);
  const [gapChanges, setGapChanges] = useState<any[]>([]);
  const [gapInactive, setGapInactive] = useState<any[]>([]);
  const [gapUnassigned, setGapUnassigned] = useState<any[]>([]);
  const [pendingProposition, setPendingProposition] = useState<any>(null);

  // Audit Log control states
  const [isAuditDrawerOpen, setIsAuditDrawerOpen] = useState(false);

  // Duplication with previous day states (J-1)
  const [isDuplicationWarningModalOpen, setIsDuplicationWarningModalOpen] = useState(false);
  const [duplicatedFromDayData, setDuplicatedFromDayData] = useState<any | null>(null);
  const [isEcartAccepted, setIsEcartAccepted] = useState(false);
  const [yesterdayDateStr, setYesterdayDateStr] = useState('');

  // Planning Excel grids template state
  const [minageRowsByPost, setMinageRowsByPost] = useState<Record<'Poste 1' | 'Poste 2' | 'Poste 3', ExcelMinage[]>>({
    'Poste 1': [],
    'Poste 2': [],
    'Poste 3': []
  });
  const [deblayageRowsByPost, setDeblayageRowsByPost] = useState<Record<'Poste 1' | 'Poste 2' | 'Poste 3', ExcelDeblayage[]>>({
    'Poste 1': [],
    'Poste 2': [],
    'Poste 3': []
  });
  const [sectorChiefs, setSectorChiefs] = useState<Record<'Poste 1' | 'Poste 2' | 'Poste 3', Record<'Imiter 2' | 'Imiter 1' | 'Imiter Est', string>>>({
    'Poste 1': { 'Imiter 2': '', 'Imiter 1': '', 'Imiter Est': '' },
    'Poste 2': { 'Imiter 2': '', 'Imiter 1': '', 'Imiter Est': '' },
    'Poste 3': { 'Imiter 2': '', 'Imiter 1': '', 'Imiter Est': '' }
  });
  const [sectorBoutefeus, setSectorBoutefeus] = useState<Record<'Poste 1' | 'Poste 2' | 'Poste 3', Record<'Imiter 2' | 'Imiter 1' | 'Imiter Est', string>>>({
    'Poste 1': { 'Imiter 2': '', 'Imiter 1': '', 'Imiter Est': '' },
    'Poste 2': { 'Imiter 2': '', 'Imiter 1': '', 'Imiter Est': '' },
    'Poste 3': { 'Imiter 2': '', 'Imiter 1': '', 'Imiter Est': '' }
  });
  const [sectorBoutefeuTasks, setSectorBoutefeuTasks] = useState<Record<'Poste 1' | 'Poste 2' | 'Poste 3', Record<'Imiter 2' | 'Imiter 1' | 'Imiter Est', string>>>({
    'Poste 1': { 'Imiter 2': '', 'Imiter 1': '', 'Imiter Est': '' },
    'Poste 2': { 'Imiter 2': '', 'Imiter 1': '', 'Imiter Est': '' },
    'Poste 3': { 'Imiter 2': '', 'Imiter 1': '', 'Imiter Est': '' }
  });
  const [extractionRowsByPost, setExtractionRowsByPost] = useState<Record<'Poste 1' | 'Poste 2' | 'Poste 3', ExcelExtraction[]>>({
    'Poste 1': [],
    'Poste 2': [],
    'Poste 3': []
  });
  const [maintenanceRowsByPost, setMaintenanceRowsByPost] = useState<Record<'Poste 1' | 'Poste 2' | 'Poste 3', ExcelMaintenance[]>>({
    'Poste 1': [],
    'Poste 2': [],
    'Poste 3': []
  });

  // Pre-filled rows helpers for Maintenance & Extraction
  const getDefaultMaintenanceRows = (post: 'Poste 1' | 'Poste 2' | 'Poste 3'): ExcelMaintenance[] => {
    const defaults = POST_HOURS[post];
    if (post === 'Poste 1') {
      return [
        { roleLabel: 'MÉCANICIEN 1', agentMatricule: '', agentName: '', engineId: '', engineCode: '', hoursSpent: defaults.duration, workDescription: '' },
        { roleLabel: 'MÉCANICIEN 2', agentMatricule: '', agentName: '', engineId: '', engineCode: '', hoursSpent: defaults.duration, workDescription: '' },
        { roleLabel: 'MÉCANICIEN 3', agentMatricule: '', agentName: '', engineId: '', engineCode: '', hoursSpent: defaults.duration, workDescription: '' },
        { roleLabel: 'ÉLECTRICIEN', agentMatricule: '', agentName: '', engineId: '', engineCode: '', hoursSpent: defaults.duration, workDescription: '' },
        { roleLabel: 'CHAUDRONNIER', agentMatricule: '', agentName: '', engineId: '', engineCode: '', hoursSpent: defaults.duration, workDescription: '' }
      ];
    } else {
      return [
        { roleLabel: 'MÉCANICIEN 1', agentMatricule: '', agentName: '', engineId: '', engineCode: '', hoursSpent: defaults.duration, workDescription: '' }
      ];
    }
  };

  const getDefaultExtractionRows = (post: 'Poste 1' | 'Poste 2' | 'Poste 3'): ExcelExtraction[] => {
    const defaults = POST_HOURS[post];
    return [
      {
        chantierName: 'Extraction Bure N340 Imiter Est',
        treuilliste: '',
        equipier1: '',
        equipier2: '',
        equipier3: '',
        equipier4: '',
        wagonsTarget: platformSettings.defaultWagonsTarget ?? 48,
        wagonsActual: 0,
        sterileBureImiterEst: 0,
        startTime: defaults.start,
        endTime: defaults.end,
        remarks: ''
      }
    ];
  };

  // Load baseline master configuration lists & historical saved sheets from Firestore
  useEffect(() => {
    // 1. Load consolidated planning record history
    const qHist = query(collection(db, 'daily_planning_sheets'));
    const unsubHist = onSnapshot(qHist, (snapshot) => {
      const historyList: any[] = [];
      snapshot.docs.forEach(dDoc => {
        const dData = dDoc.data();
        const date = dData.date || dDoc.id;
        const mainStatus = dData.status || 'brouillon';
        
        let consolidatedMinage: any[] = [];
        let consolidatedDeblayage: any[] = [];
        let consolidatedExtraction: any[] = [];
        let consolidatedMaintenance: any[] = [];
        
        if (dData.postes) {
          Object.values(dData.postes).forEach((pVal: any) => {
            if (pVal.minage) {
              const activeMinage = pVal.minage.filter((r: any) => r.chantierId && r.chantierId.trim() !== '');
              consolidatedMinage.push(...activeMinage);
            }
            if (pVal.deblayage) {
              const activeDeblayage = pVal.deblayage.filter((r: any) => r.chantierId && r.chantierId.trim() !== '');
              consolidatedDeblayage.push(...activeDeblayage);
            }
            if (pVal.extraction) {
              const activeExtraction = pVal.extraction.filter((r: any) => r.chantierName && r.chantierName.trim() !== '');
              consolidatedExtraction.push(...activeExtraction);
            }
            if (pVal.maintenance) {
              const activeMaintenance = pVal.maintenance.filter((r: any) => r.agentMatricule && r.agentMatricule.trim() !== '');
              consolidatedMaintenance.push(...activeMaintenance);
            }
          });
        }
        
        historyList.push({
          id: dDoc.id,
          date,
          status: mainStatus,
          minageRows: consolidatedMinage,
          deblayageRows: consolidatedDeblayage,
          extractionRows: consolidatedExtraction,
          maintenanceRows: consolidatedMaintenance,
          operator: dData.operator || 'SMI USER',
          timestamp: dData.timestamp || ''
        });
      });
      // Sort history list by date desc
      historyList.sort((a, b) => b.date.localeCompare(a.date));
      setPlanningsHistory(historyList);
    });

    // 2. Open mining work sites
    const qChan = query(collection(db, 'chantiers'), where('status', '==', 'ouvert'));
    const unsubChan = onSnapshot(qChan, (snapshot) => {
      setChantiers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // 3. Personnel records
    const qRH = query(collection(db, 'personnel'));
    const unsubRH = onSnapshot(qRH, (snapshot) => {
      setEmployees(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // 4. Heavy LHD machinery
    const qEngs = query(collection(db, 'engines'));
    const unsubEngs = onSnapshot(qEngs, (snapshot) => {
      setEngines(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // 5. Platform settings (Restrictive lists)
    const unsubSettings = onSnapshot(doc(db, 'settings', 'platform'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setPlatformSettings({
          sectors: data.sectors || ['Imiter 1', 'Imiter 2', 'Imiter Est'],
          engines: data.engines || ['ST2D', 'ST2G 1', 'ST2G 3', 'ST2G 4', 'ST2G 5', 'ST2G6'],
          oils: data.oils || ['Huile Moteur 15W40', 'Huile Hydraulique HV46', 'Huile Hydraulique HV68', 'Huile Transmission SAE30', 'Huile Transmission SAE50', 'Graisse Extrême Pression'],
          defaultWagonsTarget: data.defaultWagonsTarget !== undefined ? data.defaultWagonsTarget : 48
        });
      }
    }, (err) => {
      console.warn("Permission logs on Snapshot setting platform:", err.message);
    });

    // 6. Real-time tracking of filled production/registry dates
    const unsubProd = onSnapshot(collection(db, 'production'), (snapshot) => {
      const dates = new Set<string>();
      snapshot.docs.forEach(docSnap => {
        const dData = docSnap.data();
        if (dData.date) {
          dates.add(dData.date);
        } else {
          dates.add(docSnap.id);
        }
      });
      setProductionDates(dates);
    }, (err) => {
      console.warn("Permission warning or error reading production sub:", err.message);
    });

    return () => { unsubHist(); unsubChan(); unsubRH(); unsubEngs(); unsubSettings(); unsubProd(); };
  }, []);

  // Synchronize Deletion Logs Tracker ONLY when user profile is loaded
  useEffect(() => {
    if (!profile) return;

    const allowedRoles = ['admin', 'direction', 'chief', 'responsible', 'secretary'];
    if (!allowedRoles.includes(profile.role)) return;

    const qDelLogs = query(collection(db, 'deleted_plannings_log'));
    const unsubDelLogs = onSnapshot(qDelLogs, (snapshot) => {
      const logsList: any[] = [];
      snapshot.docs.forEach(dDoc => {
        const dData = dDoc.data();
        logsList.push({
          id: dDoc.id,
          date: dData.date || 'Inconnu',
          deletedBy: dData.deletedBy || 'Inconnu',
          deletedAt: dData.deletedAt || '',
          details: dData.details || ''
        });
      });
      // Sort logs by deletedAt descending
      logsList.sort((a, b) => b.deletedAt.localeCompare(a.deletedAt));
      setDeletedLogs(logsList);
    }, (err) => {
      console.warn("Permission logs on deleted_plannings_log:", err.message);
    });

    return () => unsubDelLogs();
  }, [profile]);

  // Sync Excel grid content whenever selected date, shift, or catalogs change
  useEffect(() => {
    setDuplicatedFromDayData(null);
    setIsEcartAccepted(false);
    loadPlanningWorkbook();
  }, [selectedDate, selectedPost, employees, chantiers, engines, platformSettings]);

  // Realtime subscription to modification requests subcollection for the selected day
  useEffect(() => {
    if (!selectedDate) {
      setModRequests([]);
      return;
    }
    const q = collection(db, 'daily_planning_sheets', selectedDate, 'modification_requests');
    const unsub = onSnapshot(q, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach(docSnap => {
        list.push({ id: docSnap.id, ...docSnap.data() });
      });
      setModRequests(list);
    }, (err) => {
      console.error("Error listening modification_requests subcollection :", err);
    });
    return () => unsub();
  }, [selectedDate]);

  const loadPlanningWorkbook = async () => {
    setLoading(true);
    try {
      const docRef = doc(db, 'daily_planning_sheets', selectedDate);
      const docSnap = await getDoc(docRef);

      const loadedSectorChiefs = docSnap.exists() ? (docSnap.data().sectorChiefs || {}) : {};
      const finalSectorChiefs = {
        'Poste 1': { 'Imiter 2': '', 'Imiter 1': '', 'Imiter Est': '', ...loadedSectorChiefs['Poste 1'] },
        'Poste 2': { 'Imiter 2': '', 'Imiter 1': '', 'Imiter Est': '', ...loadedSectorChiefs['Poste 2'] },
        'Poste 3': { 'Imiter 2': '', 'Imiter 1': '', 'Imiter Est': '', ...loadedSectorChiefs['Poste 3'] }
      };
      setSectorChiefs(finalSectorChiefs);

      const loadedSectorBoutefeus = docSnap.exists() ? (docSnap.data().sectorBoutefeus || {}) : {};
      const finalSectorBoutefeus = {
        'Poste 1': { 'Imiter 2': '', 'Imiter 1': '', 'Imiter Est': '', ...loadedSectorBoutefeus['Poste 1'] },
        'Poste 2': { 'Imiter 2': '', 'Imiter 1': '', 'Imiter Est': '', ...loadedSectorBoutefeus['Poste 2'] },
        'Poste 3': { 'Imiter 2': '', 'Imiter 1': '', 'Imiter Est': '', ...loadedSectorBoutefeus['Poste 3'] }
      };
      setSectorBoutefeus(finalSectorBoutefeus);

      const loadedSectorBoutefeuTasks = docSnap.exists() ? (docSnap.data().sectorBoutefeuTasks || {}) : {};
      const finalSectorBoutefeuTasks = {
        'Poste 1': { 'Imiter 2': '', 'Imiter 1': '', 'Imiter Est': '', ...loadedSectorBoutefeuTasks['Poste 1'] },
        'Poste 2': { 'Imiter 2': '', 'Imiter 1': '', 'Imiter Est': '', ...loadedSectorBoutefeuTasks['Poste 2'] },
        'Poste 3': { 'Imiter 2': '', 'Imiter 1': '', 'Imiter Est': '', ...loadedSectorBoutefeuTasks['Poste 3'] }
      };
      setSectorBoutefeuTasks(finalSectorBoutefeuTasks);

      const loadedMinageByPost: Record<'Poste 1' | 'Poste 2' | 'Poste 3', ExcelMinage[]> = { 'Poste 1': [], 'Poste 2': [], 'Poste 3': [] };
      const loadedDeblayageByPost: Record<'Poste 1' | 'Poste 2' | 'Poste 3', ExcelDeblayage[]> = { 'Poste 1': [], 'Poste 2': [], 'Poste 3': [] };
      const loadedExtractionByPost: Record<'Poste 1' | 'Poste 2' | 'Poste 3', ExcelExtraction[]> = { 'Poste 1': [], 'Poste 2': [], 'Poste 3': [] };
      const loadedMaintenanceByPost: Record<'Poste 1' | 'Poste 2' | 'Poste 3', ExcelMaintenance[]> = { 'Poste 1': [], 'Poste 2': [], 'Poste 3': [] };

      const posts: ('Poste 1' | 'Poste 2' | 'Poste 3')[] = ['Poste 1', 'Poste 2', 'Poste 3'];

      if (docSnap.exists()) {
        const docData = docSnap.data();
        setIsPlanningSavedInDb(true);
        setSignatureInfo({
          savedBy: docData.savedBy || docData.operator,
          savedAt: docData.savedAt || docData.timestamp,
          lastModifiedBy: docData.lastModifiedBy || docData.operator,
          lastModifiedAt: docData.lastModifiedAt || docData.timestamp
        });
        if (docData.status === 'valide' || docData.validatedAt) {
          setValidationInfo({
            validatedBy: docData.validatedBy,
            validatedByUid: docData.validatedByUid,
            validatedAt: docData.validatedAt,
            status: docData.status
          });
        } else {
          setValidationInfo(null);
        }
        posts.forEach(p => {
          const pk = p === 'Poste 1' ? 'poste1' : p === 'Poste 2' ? 'poste2' : 'poste3';
          const pData = docData.postes?.[pk];
          const currentDefaults = POST_HOURS[p];
          loadedMinageByPost[p] = ensureMinimumRows(pData?.minage || [], 'minage', p, chantiers);
          loadedDeblayageByPost[p] = ensureMinimumRows(pData?.deblayage || [], 'deblayage', p, chantiers);
          loadedExtractionByPost[p] = sanitizeExtractionRows(pData?.extraction, currentDefaults);
          loadedMaintenanceByPost[p] = pData?.maintenance || [];
          if (loadedMaintenanceByPost[p].length === 0) {
            loadedMaintenanceByPost[p] = getDefaultMaintenanceRows(p);
          }
        });

        setMinageRowsByPost(loadedMinageByPost);
        setDeblayageRowsByPost(loadedDeblayageByPost);
        setExtractionRowsByPost(loadedExtractionByPost);
        setMaintenanceRowsByPost(loadedMaintenanceByPost);
        setLoading(false);
        return;
      }

      // If doc Snap does not exist, build templates
      posts.forEach(p => {
        loadedMinageByPost[p] = ensureMinimumRows([], 'minage', p, chantiers);
        loadedDeblayageByPost[p] = ensureMinimumRows([], 'deblayage', p, chantiers).map(row => ({
          ...row,
          hoursWorked: POST_HOURS[p].duration
        }));
        loadedExtractionByPost[p] = getDefaultExtractionRows(p);
        loadedMaintenanceByPost[p] = getDefaultMaintenanceRows(p);
      });

      setMinageRowsByPost(loadedMinageByPost);
      setDeblayageRowsByPost(loadedDeblayageByPost);
      setExtractionRowsByPost(loadedExtractionByPost);
      setMaintenanceRowsByPost(loadedMaintenanceByPost);
      setSignatureInfo(null);
      setValidationInfo(null);
      setIsPlanningSavedInDb(false);
    } catch (err) {
      console.error("Erreur de chargement du classeur : ", err);
    } finally {
      setLoading(false);
    }
  };

  // Personnel lookup helper
  const getEmployeeName = (matricule: string) => {
    const emp = employees.find(e => e.matricule?.toUpperCase() === matricule?.trim().toUpperCase() && e.status === 'actif');
    return emp ? `${emp.nom} ${emp.prenom} (${emp.fonction})` : '';
  };

  const handleKeyDown = (e: React.KeyboardEvent<any>) => {
    const isEnter = e.key === 'Enter';
    const isTab = e.key === 'Tab';
    const isArrowUp = e.key === 'ArrowUp';
    const isArrowDown = e.key === 'ArrowDown';
    const isArrowLeft = e.key === 'ArrowLeft';
    const isArrowRight = e.key === 'ArrowRight';

    if (!isEnter && !isTab && !isArrowUp && !isArrowDown && !isArrowLeft && !isArrowRight) {
      return; 
    }

    const currentInput = e.target as HTMLInputElement | HTMLSelectElement;
    if (!currentInput) return;

    // Support number increments with arrow keys ONLY if it's a number type, unless we explicitly want Row navigation
    const isNumberInput = currentInput instanceof HTMLInputElement && currentInput.type === 'number';
    if (isNumberInput && (isArrowUp || isArrowDown)) {
      if (!e.shiftKey) {
        return;
      }
    }

    // Fast coordinate table grid resolution
    const currentTd = currentInput.closest('td');
    const currentTr = currentInput.closest('tr');
    const table = currentTr?.closest('table');

    if (currentTd && currentTr && table) {
      // Arrow keys/Enter/Tab grid cell navigation
      const trList = Array.from(table.querySelectorAll('tbody tr')) as HTMLTableRowElement[];
      const rowIndex = trList.indexOf(currentTr);
      const colCells = Array.from(currentTr.querySelectorAll('td')) as HTMLTableCellElement[];
      const colIndex = colCells.indexOf(currentTd);

      if (isArrowDown || isEnter) {
        e.preventDefault();
        let nextRowIndex = rowIndex + 1;
        let focused = false;
        while (nextRowIndex < trList.length) {
          const nextTr = trList[nextRowIndex];
          const nextTdList = Array.from(nextTr.querySelectorAll('td')) as HTMLTableCellElement[];
          const nextTd = nextTdList[colIndex];
          if (nextTd) {
            const tgt = nextTd.querySelector('input:not([disabled]), select:not([disabled])') as HTMLInputElement | HTMLSelectElement;
            if (tgt) {
              tgt.focus();
              if (tgt instanceof HTMLInputElement) tgt.select();
              focused = true;
              break;
            }
          }
          nextRowIndex++;
        }
        return;
      } else if (isArrowUp) {
        e.preventDefault();
        let prevRowIndex = rowIndex - 1;
        while (prevRowIndex >= 0) {
          const prevTr = trList[prevRowIndex];
          const prevTdList = Array.from(prevTr.querySelectorAll('td')) as HTMLTableCellElement[];
          const prevTd = prevTdList[colIndex];
          if (prevTd) {
            const tgt = prevTd.querySelector('input:not([disabled]), select:not([disabled])') as HTMLInputElement | HTMLSelectElement;
            if (tgt) {
              tgt.focus();
              if (tgt instanceof HTMLInputElement) tgt.select();
              break;
            }
          }
          prevRowIndex--;
        }
        return;
      } else if (isArrowRight) {
        const shouldMove = currentInput instanceof HTMLSelectElement || 
                           (currentInput instanceof HTMLInputElement && 
                            (!currentInput.value || currentInput.selectionStart === currentInput.value.length));
        if (shouldMove) {
          e.preventDefault();
          let nextColIndex = colIndex + 1;
          while (nextColIndex < colCells.length) {
            const nextTd = colCells[nextColIndex];
            const tgt = nextTd?.querySelector('input:not([disabled]), select:not([disabled])') as HTMLInputElement | HTMLSelectElement;
            if (tgt) {
              tgt.focus();
              if (tgt instanceof HTMLInputElement) tgt.select();
              break;
            }
            nextColIndex++;
          }
        }
        return;
      } else if (isArrowLeft) {
        const shouldMove = currentInput instanceof HTMLSelectElement || 
                           (currentInput instanceof HTMLInputElement && 
                            (!currentInput.value || currentInput.selectionStart === 0));
        if (shouldMove) {
          e.preventDefault();
          let prevColIndex = colIndex - 1;
          while (prevColIndex >= 0) {
            const prevTd = colCells[prevColIndex];
            const tgt = prevTd?.querySelector('input:not([disabled]), select:not([disabled])') as HTMLInputElement | HTMLSelectElement;
            if (tgt) {
              tgt.focus();
              if (tgt instanceof HTMLInputElement) tgt.select();
              break;
            }
            prevColIndex--;
          }
        }
        return;
      }
    }

    // Standard linear sequential input transition if not in structure or for Tab / Shift+Tab keys
    if (isTab || isEnter || isArrowDown || isArrowUp) {
      e.preventDefault();
      const container = currentInput.closest('[data-card-container="true"]') || currentInput.closest('tbody') || currentInput.closest('table') || document.body;
      const inputs = Array.from(
        container.querySelectorAll('input:not([disabled]), select:not([disabled])')
      ) as HTMLElement[];
      const idx = inputs.indexOf(currentInput);
      if (idx !== -1) {
        const isReverse = e.shiftKey || isArrowUp;
        const nextIdx = isReverse ? idx - 1 : idx + 1;
        if (nextIdx >= 0 && nextIdx < inputs.length) {
          inputs[nextIdx].focus();
          if (inputs[nextIdx] instanceof HTMLInputElement) {
            (inputs[nextIdx] as HTMLInputElement).select();
          }
        }
      }
    }
  };

  // Cell state modifier handlers
  const handleToggleManualOverride = (post: 'Poste 1' | 'Poste 2' | 'Poste 3', flatIdx: number) => {
    const clone = [...(minageRowsByPost[post] || [])];
    if (!clone[flatIdx]) return;
    const oldVal = clone[flatIdx].explosivesManualOverride;
    clone[flatIdx].explosivesManualOverride = !oldVal;
    
    if (oldVal) {
      // Repasser en automatique, relancer compute
      const computed = computeExplosives(clone[flatIdx].gallerySize, 1);
      clone[flatIdx].plannedHoles = computed.plannedHoles;
      clone[flatIdx].anfo = computed.anfo;
      clone[flatIdx].tovex = computed.tovex;
      clone[flatIdx].ammorces = computed.ammorces;
    }
    setMinageRowsByPost(prev => ({ ...prev, [post]: clone }));
  };

  const updateMinageCell = (post: 'Poste 1' | 'Poste 2' | 'Poste 3', index: number, field: keyof ExcelMinage, value: any) => {
    const originalRows = minageRowsByPost[post] || [];
    const oldRounds = originalRows[index] ? (originalRows[index].plannedRounds || 1) : 1;

    const clone = [...originalRows];
    if (!clone[index]) return;
    clone[index] = { ...clone[index], [field]: value };
    
    if (field === 'chantierId') {
      const selectedChantier = chantiers.find(c => c.id === value);
      if (selectedChantier) {
        const sizeVal: 9 | 12 = selectedChantier.galleryType === '9m2' ? 9 : 12;
        clone[index].gallerySize = sizeVal;
        if (!clone[index].explosivesManualOverride) {
          const computed = computeExplosives(sizeVal, 1);
          clone[index].plannedHoles = computed.plannedHoles;
          clone[index].anfo = computed.anfo;
          clone[index].tovex = computed.tovex;
          clone[index].ammorces = computed.ammorces;
        }
      }
    }
    if (field === 'chiefMatricule') {
      const emp = employees.find(e => e.matricule?.toUpperCase() === String(value).trim().toUpperCase());
      clone[index].chiefName = emp ? `${emp.nom} ${emp.prenom}` : '';
    }
    if (field === 'minerMatricule') {
      const emp = employees.find(e => e.matricule?.toUpperCase() === String(value).trim().toUpperCase());
      clone[index].minerName = emp ? `${emp.nom} ${emp.prenom}` : '';
    }
    if (field === 'assistantMatricule') {
      const emp = employees.find(e => e.matricule?.toUpperCase() === String(value).trim().toUpperCase());
      clone[index].assistantName = emp ? `${emp.nom} ${emp.prenom}` : '';
    }

    // Automatically propagate shift-wide worker IDs/names to any subsequent (Volée 2) / (Volée 3) rows
    if (['chiefMatricule', 'minerMatricule', 'assistantMatricule'].includes(field)) {
      const parentRounds = clone[index].plannedRounds || 1;
      if (parentRounds > 1) {
        for (let i = index + 1; i < index + parentRounds; i++) {
          if (clone[i] && clone[i].remarks && (clone[i].remarks.includes('(Volée 2)') || clone[i].remarks.includes('(Volée 3)'))) {
            clone[i] = {
              ...clone[i],
              chiefMatricule: clone[index].chiefMatricule,
              chiefName: clone[index].chiefName,
              minerMatricule: clone[index].minerMatricule,
              minerName: clone[index].minerName,
              assistantMatricule: clone[index].assistantMatricule,
              assistantName: clone[index].assistantName,
            };
          }
        }
      }
    }

    if (field === 'barType') {
      const newBarType = value as '1.8m' | '2.4m';
      clone[index].barType = newBarType;
      const rounds = clone[index].plannedRounds || 1;
      const advanceFactor = newBarType === '2.4m' ? 2.3 : 1.7;
      clone[index].meterage = rounds * advanceFactor;
      
      // Update any child rows to also have the same barType and meterage
      if (rounds > 1) {
        for (let i = index + 1; i < index + rounds; i++) {
          if (clone[i] && clone[i].remarks && (clone[i].remarks.includes('(Volée 2)') || clone[i].remarks.includes('(Volée 3)'))) {
            clone[i] = {
              ...clone[i],
              barType: newBarType,
              meterage: advanceFactor
            };
          }
        }
      }
    }

    if (field === 'plannedRounds') {
      const newRounds = Number(value);
      clone[index].plannedRounds = newRounds;
      const advanceFactor = clone[index].barType === '2.4m' ? 2.3 : 1.7;
      clone[index].meterage = newRounds * advanceFactor;

      // 1. Remove existing associated child rows (Volée 2/3) right below the parent row
      if (oldRounds > 1) {
        let checkIdx = index + 1;
        while (clone[checkIdx] && clone[checkIdx].remarks && (clone[checkIdx].remarks.includes('(Volée 2)') || clone[checkIdx].remarks.includes('(Volée 3)'))) {
          clone.splice(checkIdx, 1);
        }
      }

      // 2. Insert new child rows if newRounds > 1 (handles copying worker info even if blank, which then propagates)
      if (newRounds > 1) {
        const currentMiner = clone[index].minerMatricule;
        const currentHelper = clone[index].assistantMatricule;
        for (let rNum = 2; rNum <= newRounds; rNum++) {
          const defaultExplosives = computeExplosives(12, 1);
          const newRow: ExcelMinage = {
            chantierId: '', 
            chiefMatricule: clone[index].chiefMatricule,
            chiefName: clone[index].chiefName,
            minerMatricule: currentMiner,
            minerName: clone[index].minerName,
            assistantMatricule: currentHelper,
            assistantName: clone[index].assistantName,
            gallerySize: 12,
            plannedHoles: defaultExplosives.plannedHoles,
            realHoles: defaultExplosives.plannedHoles,
            plannedRounds: 1, 
            realRounds: 1,
            barType: clone[index].barType || '1.8m',
            meterage: advanceFactor,
            anfo: defaultExplosives.anfo,
            tovex: defaultExplosives.tovex,
            ammorces: defaultExplosives.ammorces,
            remarks: `(Volée ${rNum})`,
            sectorGroup: clone[index].sectorGroup,
            explosivesManualOverride: false
          };
          clone.splice(index + rNum - 1, 0, newRow);
        }
      }
    }

    // Automatically compute explosives when gallerySize or plannedRounds change, unless override is active
    if (field === 'gallerySize' || field === 'plannedRounds') {
      if (!clone[index].explosivesManualOverride) {
        const computed = computeExplosives(clone[index].gallerySize, 1);
        clone[index].plannedHoles = computed.plannedHoles;
        clone[index].anfo = computed.anfo;
        clone[index].tovex = computed.tovex;
        clone[index].ammorces = computed.ammorces;
      }
    }

    setMinageRowsByPost(prev => ({ ...prev, [post]: clone }));
  };

  const updateDeblayageCell = (post: 'Poste 1' | 'Poste 2' | 'Poste 3', index: number, field: keyof ExcelDeblayage, value: any) => {
    const clone = [...(deblayageRowsByPost[post] || [])];
    if (!clone[index]) return;
    clone[index] = { ...clone[index], [field]: value };

    if (field === 'driverMatricule') {
      const emp = employees.find(e => e.matricule?.toUpperCase() === String(value).trim().toUpperCase());
      clone[index].driverName = emp ? `${emp.nom} ${emp.prenom}` : '';
    }
    if (field === 'engineId') {
      clone[index].engineCode = String(value);
    }
    if (field === 'godets') {
      clone[index].volumeEstimated = Number(value) * 1.5;
    }
    setDeblayageRowsByPost(prev => ({ ...prev, [post]: clone }));
  };

  const updateExtractionCell = (post: 'Poste 1' | 'Poste 2' | 'Poste 3', index: number, field: keyof ExcelExtraction, value: any) => {
    const clone = [...(extractionRowsByPost[post] || [])];
    if (!clone[index]) return;
    clone[index] = { ...clone[index], [field]: value };
    setExtractionRowsByPost(prev => ({ ...prev, [post]: clone }));
  };

  const updateMaintenanceCell = (post: 'Poste 1' | 'Poste 2' | 'Poste 3', index: number, field: keyof ExcelMaintenance, value: any) => {
    const clone = [...(maintenanceRowsByPost[post] || [])];
    if (!clone[index]) return;
    clone[index] = { ...clone[index], [field]: value };

    if (field === 'agentMatricule') {
      const emp = employees.find(e => e.matricule?.toUpperCase() === String(value).trim().toUpperCase());
      clone[index].agentName = emp ? `${emp.nom} ${emp.prenom}` : 'Inconnu';
    }
    if (field === 'engineId') {
      clone[index].engineCode = String(value);
    }
    setMaintenanceRowsByPost(prev => ({ ...prev, [post]: clone }));
  };

  const addRowToMaintenance = (post: 'Poste 1' | 'Poste 2' | 'Poste 3') => {
    const currentRows = maintenanceRowsByPost[post] || [];
    const defaults = POST_HOURS[post];
    const newIdx = currentRows.filter(r => r.roleLabel.startsWith('MÉCANICIEN')).length + 1;
    const newRow: ExcelMaintenance = {
      roleLabel: `MÉCANICIEN ${newIdx}`,
      agentMatricule: '',
      agentName: '',
      engineId: '',
      engineCode: '',
      hoursSpent: defaults.duration,
      workDescription: ''
    };
    setMaintenanceRowsByPost(prev => ({
      ...prev,
      [post]: [...currentRows, newRow]
    }));
  };

  const deleteMaintenanceRowAt = (post: 'Poste 1' | 'Poste 2' | 'Poste 3', index: number) => {
    setMaintenanceRowsByPost(prev => ({
      ...prev,
      [post]: prev[post].filter((_, idx) => idx !== index)
    }));
  };

  const focusOnCell = (rIdx: number, cIdx: number) => {
    const cell = document.querySelector(`td[data-row="${rIdx}"][data-col="${cIdx}"]`);
    if (cell) {
      const input = cell.querySelector('input, select') as HTMLElement;
      if (input) {
        input.focus();
        if (input instanceof HTMLInputElement) {
          input.select();
        }
      }
    }
  };

  const makeExcelKeyHandler = (rowIndex: number, colIndex: number) => (e: React.KeyboardEvent<any>) => {
    handleKeyDown(e);
  };

  const getMobilisedMatricules = () => {
    const list: { matricule: string; name: string; role: string; sheet: string; location: string }[] = [];
    const posts: ('Poste 1' | 'Poste 2' | 'Poste 3')[] = ['Poste 1', 'Poste 2', 'Poste 3'];

    posts.forEach(p => {
      minageRowsByPost[p].forEach((r, i) => {
        const minageChantierName = chantiers.find(c => c.id === r.chantierId)?.name || `Ligne ${i + 1}`;
        // Sector/Post Chiefs are excluded from mobilization checks to ignore duplicate warnings
        if (r.minerMatricule) {
          list.push({ matricule: r.minerMatricule.trim().toUpperCase(), name: r.minerName, role: 'Mineur', sheet: `Minage (${p})`, location: minageChantierName });
        }
        if (r.assistantMatricule) {
          list.push({ matricule: r.assistantMatricule.trim().toUpperCase(), name: r.assistantName, role: 'Aide Mineur', sheet: `Minage (${p})`, location: minageChantierName });
        }
      });

      deblayageRowsByPost[p].forEach((r, i) => {
        const deblayageChantierName = chantiers.find(c => c.id === r.chantierId)?.name || `Ligne ${i + 1}`;
        if (r.driverMatricule) {
          list.push({ matricule: r.driverMatricule.trim().toUpperCase(), name: r.driverName, role: 'Conducteur', sheet: `Déblayage (${p})`, location: deblayageChantierName });
        }
      });

      const extRows = extractionRowsByPost[p] || [];
      extRows.forEach((r) => {
        const loc = 'Bure N340';
        if (r.treuilliste) {
          list.push({ matricule: r.treuilliste.trim().toUpperCase(), name: getEmployeeName(r.treuilliste).split(' (')[0], role: 'Treuilliste', sheet: `Extraction (${p})`, location: loc });
        }
        if (r.equipier1) {
          list.push({ matricule: r.equipier1.trim().toUpperCase(), name: getEmployeeName(r.equipier1).split(' (')[0], role: 'Équipier 1', sheet: `Extraction (${p})`, location: loc });
        }
        if (r.equipier2) {
          list.push({ matricule: r.equipier2.trim().toUpperCase(), name: getEmployeeName(r.equipier2).split(' (')[0], role: 'Équipier 2', sheet: `Extraction (${p})`, location: loc });
        }
        if (r.equipier3) {
          list.push({ matricule: r.equipier3.trim().toUpperCase(), name: getEmployeeName(r.equipier3).split(' (')[0], role: 'Équipier 3', sheet: `Extraction (${p})`, location: loc });
        }
        if (r.equipier4) {
          list.push({ matricule: r.equipier4.trim().toUpperCase(), name: getEmployeeName(r.equipier4).split(' (')[0], role: 'Équipier 4', sheet: `Extraction (${p})`, location: loc });
        }
      });

      const maintRows = maintenanceRowsByPost[p] || [];
      maintRows.forEach((r) => {
        if (r.agentMatricule) {
          list.push({ matricule: r.agentMatricule.trim().toUpperCase(), name: r.agentName, role: r.roleLabel, sheet: `Maintenance (${p})`, location: r.engineCode || 'Fixe' });
        }
      });
    });

    return list;
  };

  const addRowToMinageSector = (post: 'Poste 1' | 'Poste 2' | 'Poste 3', sec: string) => {
    const currentRows = minageRowsByPost[post] || [];
    let lastIndex = -1;
    for (let i = 0; i < currentRows.length; i++) {
      if (currentRows[i].sectorGroup === sec) {
        lastIndex = i;
      }
    }

    const defaultExplosives = computeExplosives(12, 1);
    const newRow: ExcelMinage = {
      chantierId: '', chiefMatricule: '', chiefName: '', minerMatricule: '', minerName: '',
      assistantMatricule: '', assistantName: '', gallerySize: 12, plannedHoles: defaultExplosives.plannedHoles, realHoles: defaultExplosives.plannedHoles,
      plannedRounds: 1, realRounds: 1, barType: '1.8m', meterage: 1.7, anfo: defaultExplosives.anfo, tovex: defaultExplosives.tovex, ammorces: defaultExplosives.ammorces, remarks: '',
      sectorGroup: sec, explosivesManualOverride: false
    };

    const clone = [...currentRows];
    if (lastIndex !== -1) {
      clone.splice(lastIndex + 1, 0, newRow);
    } else {
      clone.push(newRow);
    }
    setMinageRowsByPost(prev => ({ ...prev, [post]: clone }));
  };

  const isMinageRowRemovable = (post: 'Poste 1' | 'Poste 2' | 'Poste 3', flatIdx: number) => {
    const currentRows = minageRowsByPost[post] || [];
    const row = currentRows[flatIdx];
    if (!row) return false;
    const sec = row.sectorGroup || 'Autres / Non classés';
    const minCount = DEFAULT_ROWS_PER_SECTOR[post]?.[sec] || 2;
    
    const sectorIndices = currentRows
      .map((r, i) => r.sectorGroup === sec ? i : -1)
      .filter(i => i !== -1);
      
    const localIdx = sectorIndices.indexOf(flatIdx);
    return localIdx >= minCount;
  };

  const deleteMinageRowAt = (post: 'Poste 1' | 'Poste 2' | 'Poste 3', flatIdx: number) => {
    setMinageRowsByPost(prev => ({
      ...prev,
      [post]: prev[post].filter((_, idx) => idx !== flatIdx)
    }));
  };

  const addRowToDeblayageSector = (post: 'Poste 1' | 'Poste 2' | 'Poste 3', sec: string) => {
    const currentRows = deblayageRowsByPost[post] || [];
    let lastIndex = -1;
    for (let i = 0; i < currentRows.length; i++) {
      if (currentRows[i].sectorGroup === sec) {
        lastIndex = i;
      }
    }

    const newRow: ExcelDeblayage = {
      chantierId: '', driverMatricule: '', driverName: '', engineId: '', engineCode: '',
      godets: 0, volumeEstimated: 0, hoursWorked: POST_HOURS[post].duration, remarks: '',
      sectorGroup: sec
    };

    const clone = [...currentRows];
    if (lastIndex !== -1) {
      clone.splice(lastIndex + 1, 0, newRow);
    } else {
      clone.push(newRow);
    }
    setDeblayageRowsByPost(prev => ({ ...prev, [post]: clone }));
  };

  const addStockRowToDeblayageSector = (post: 'Poste 1' | 'Poste 2' | 'Poste 3', sec: string) => {
    const currentRows = deblayageRowsByPost[post] || [];
    let lastIndex = -1;
    for (let i = 0; i < currentRows.length; i++) {
      if (currentRows[i].sectorGroup === sec) {
        lastIndex = i;
      }
    }

    const newRow: ExcelDeblayage = {
      chantierId: 'stock_TAILLE_STK',
      driverMatricule: '', driverName: '', engineId: '', engineCode: '',
      godets: 0, volumeEstimated: 0, hoursWorked: POST_HOURS[post].duration, remarks: 'Déblayage et nettoyage du stockage',
      sectorGroup: sec
    };

    const clone = [...currentRows];
    if (lastIndex !== -1) {
      clone.splice(lastIndex + 1, 0, newRow);
    } else {
      clone.push(newRow);
    }
    setDeblayageRowsByPost(prev => ({ ...prev, [post]: clone }));
  };

  const isDeblayageRowRemovable = (post: 'Poste 1' | 'Poste 2' | 'Poste 3', flatIdx: number) => {
    const currentRows = deblayageRowsByPost[post] || [];
    const row = currentRows[flatIdx];
    if (!row) return false;
    const sec = row.sectorGroup || 'Autres / Non classés';
    const minCount = DEFAULT_ROWS_PER_SECTOR[post]?.[sec] || 2;
    
    const sectorIndices = currentRows
      .map((r, i) => r.sectorGroup === sec ? i : -1)
      .filter(i => i !== -1);
      
    const localIdx = sectorIndices.indexOf(flatIdx);
    return localIdx >= minCount;
  };

  const deleteDeblayageRowAt = (post: 'Poste 1' | 'Poste 2' | 'Poste 3', flatIdx: number) => {
    setDeblayageRowsByPost(prev => ({
      ...prev,
      [post]: prev[post].filter((_, idx) => idx !== flatIdx)
    }));
  };

  const triggerDuplicatePreviousDay = () => {
    const parts = selectedDate.split('-');
    if (parts.length !== 3) {
      alert("Date non valide.");
      return;
    }
    const sourceDateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    
    // Check if the selected target date is a Monday (1)
    if (sourceDateObj.getDay() === 1) {
      alert("⚠️ Les lundis, la composition des équipes et la rotation des postes changent de manière réglementaire à SMI Imiter. La planification du lundi doit impérativement être configurée manuellement. La duplication du dimanche vers le lundi est désactivée.");
      return;
    }

    const targetDateObj = addDays(sourceDateObj, -1);
    const yDateStr = format(targetDateObj, 'yyyy-MM-dd');
    setYesterdayDateStr(yDateStr);
    setIsDuplicationWarningModalOpen(true);
  };

  const confirmDuplicateYesterday = async () => {
    setIsDuplicationWarningModalOpen(false);
    setLoading(true);
    try {
      const docRef = doc(db, 'daily_planning_sheets', yesterdayDateStr);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        alert(`Aucune planification trouvée pour le jour précédent (J-1 : ${yesterdayDateStr}).`);
        setLoading(false);
        return;
      }

      const docData = docSnap.data();

      // Store fetched raw data for real-time difference engine
      setDuplicatedFromDayData(docData);
      setIsEcartAccepted(false);

      const clonedMinage: Record<'Poste 1' | 'Poste 2' | 'Poste 3', ExcelMinage[]> = { 'Poste 1': [], 'Poste 2': [], 'Poste 3': [] };
      const clonedDeblayage: Record<'Poste 1' | 'Poste 2' | 'Poste 3', ExcelDeblayage[]> = { 'Poste 1': [], 'Poste 2': [], 'Poste 3': [] };
      const clonedExtraction: Record<'Poste 1' | 'Poste 2' | 'Poste 3', ExcelExtraction[]> = { 'Poste 1': [], 'Poste 2': [], 'Poste 3': [] };
      const clonedMaintenance: Record<'Poste 1' | 'Poste 2' | 'Poste 3', ExcelMaintenance[]> = { 'Poste 1': [], 'Poste 2': [], 'Poste 3': [] };
      const clonedSectorChiefs: Record<'Poste 1' | 'Poste 2' | 'Poste 3', Record<'Imiter 2' | 'Imiter 1' | 'Imiter Est', string>> = {
        'Poste 1': { 'Imiter 2': '', 'Imiter 1': '', 'Imiter Est': '' },
        'Poste 2': { 'Imiter 2': '', 'Imiter 1': '', 'Imiter Est': '' },
        'Poste 3': { 'Imiter 2': '', 'Imiter 1': '', 'Imiter Est': '' }
      };
      const clonedSectorBoutefeus: Record<'Poste 1' | 'Poste 2' | 'Poste 3', Record<'Imiter 2' | 'Imiter 1' | 'Imiter Est', string>> = {
        'Poste 1': { 'Imiter 2': '', 'Imiter 1': '', 'Imiter Est': '' },
        'Poste 2': { 'Imiter 2': '', 'Imiter 1': '', 'Imiter Est': '' },
        'Poste 3': { 'Imiter 2': '', 'Imiter 1': '', 'Imiter Est': '' }
      };
      const clonedSectorBoutefeuTasks: Record<'Poste 1' | 'Poste 2' | 'Poste 3', Record<'Imiter 2' | 'Imiter 1' | 'Imiter Est', string>> = {
        'Poste 1': { 'Imiter 2': '', 'Imiter 1': '', 'Imiter Est': '' },
        'Poste 2': { 'Imiter 2': '', 'Imiter 1': '', 'Imiter Est': '' },
        'Poste 3': { 'Imiter 2': '', 'Imiter 1': '', 'Imiter Est': '' }
      };

      const posts: ('Poste 1' | 'Poste 2' | 'Poste 3')[] = ['Poste 1', 'Poste 2', 'Poste 3'];
      const dbPostMapping = {
        'Poste 1': 'poste1',
        'Poste 2': 'poste2',
        'Poste 3': 'poste3'
      };

      posts.forEach(p => {
        const srcKey = dbPostMapping[p];
        const srcData = docData.postes?.[srcKey];
        if (srcData) {
          // Clone Minage direct
          clonedMinage[p] = (srcData.minage || []).map((row: ExcelMinage) => {
            const finalRow = { ...row };
            if (row.chiefMatricule) {
              const emp = employees.find(e => e.matricule?.toUpperCase() === row.chiefMatricule.toUpperCase());
              finalRow.chiefName = emp ? `${emp.nom} ${emp.prenom}` : 'Inconnu';
            }
            if (row.minerMatricule) {
              const emp = employees.find(e => e.matricule?.toUpperCase() === row.minerMatricule.toUpperCase());
              finalRow.minerName = emp ? `${emp.nom} ${emp.prenom}` : 'Inconnu';
            }
            if (row.assistantMatricule) {
              const emp = employees.find(e => e.matricule?.toUpperCase() === row.assistantMatricule.toUpperCase());
              finalRow.assistantName = emp ? `${emp.nom} ${emp.prenom}` : 'Inconnu';
            }
            return finalRow;
          });
          clonedMinage[p] = ensureMinimumRows(clonedMinage[p], 'minage', p, chantiers);

          // Clone Deblayage direct
          clonedDeblayage[p] = (srcData.deblayage || []).map((row: ExcelDeblayage) => {
            const finalRow = { ...row };
            if (row.driverMatricule) {
              const emp = employees.find(e => e.matricule?.toUpperCase() === row.driverMatricule.toUpperCase());
              finalRow.driverName = emp ? `${emp.nom} ${emp.prenom}` : 'Inconnu';
            }
            return finalRow;
          });
          clonedDeblayage[p] = ensureMinimumRows(clonedDeblayage[p], 'deblayage', p, chantiers);

          // Clone Extraction direct
          clonedExtraction[p] = sanitizeExtractionRows(srcData.extraction, POST_HOURS[p]);

          // Clone Maintenance direct
          clonedMaintenance[p] = (srcData.maintenance || []).map((row: ExcelMaintenance) => {
            const finalRow = { ...row };
            if (row.agentMatricule) {
              const emp = employees.find(e => e.matricule?.toUpperCase() === row.agentMatricule.toUpperCase());
              finalRow.agentName = emp ? `${emp.nom} ${emp.prenom}` : 'Inconnu';
            }
            return finalRow;
          });
          if (clonedMaintenance[p].length === 0) {
            clonedMaintenance[p] = getDefaultMaintenanceRows(p);
          }

          // Clone Sector Chiefs direct
          const srcSectorChiefs = (docData.sectorChiefs || {})[srcKey] || {};
          clonedSectorChiefs[p] = {
            'Imiter 2': srcSectorChiefs['Imiter 2'] || '',
            'Imiter 1': srcSectorChiefs['Imiter 1'] || '',
            'Imiter Est': srcSectorChiefs['Imiter Est'] || ''
          };

          // Clone Sector Boutefeus direct
          const srcSectorBoutefeus = (docData.sectorBoutefeus || {})[srcKey] || {};
          clonedSectorBoutefeus[p] = {
            'Imiter 2': srcSectorBoutefeus['Imiter 2'] || '',
            'Imiter 1': srcSectorBoutefeus['Imiter 1'] || '',
            'Imiter Est': srcSectorBoutefeus['Imiter Est'] || ''
          };

          // Clone Sector Boutefeu Tasks direct
          const srcSectorBoutefeuTasks = (docData.sectorBoutefeuTasks || {})[srcKey] || {};
          clonedSectorBoutefeuTasks[p] = {
            'Imiter 2': srcSectorBoutefeuTasks['Imiter 2'] || '',
            'Imiter 1': srcSectorBoutefeuTasks['Imiter 1'] || '',
            'Imiter Est': srcSectorBoutefeuTasks['Imiter Est'] || ''
          };
        } else {
          clonedMinage[p] = ensureMinimumRows([], 'minage', p, chantiers);
          clonedDeblayage[p] = ensureMinimumRows([], 'deblayage', p, chantiers);
          clonedExtraction[p] = getDefaultExtractionRows(p);
          clonedMaintenance[p] = getDefaultMaintenanceRows(p);
        }
      });

      setMinageRowsByPost(clonedMinage);
      setDeblayageRowsByPost(clonedDeblayage);
      setSectorChiefs(clonedSectorChiefs);
      setSectorBoutefeus(clonedSectorBoutefeus);
      setSectorBoutefeuTasks(clonedSectorBoutefeuTasks);
      setExtractionRowsByPost(clonedExtraction);
      setMaintenanceRowsByPost(clonedMaintenance);

      alert(`Données du J-1 (${yesterdayDateStr}) importées avec succès ! Le secrétaire de permanence doit maintenant ajuster les planifications de la journée si nécessaire.`);
    } catch (err) {
      console.error("Erreur de duplication J-1: ", err);
      alert("Une erreur est survenue lors de la duplication de la journée d'hier.");
    } finally {
      setLoading(false);
    }
  };

  const getPlanningDifferences = (): { type: string; post: string; desc: string }[] => {
    if (!duplicatedFromDayData) return [];

    const diffs: { type: string; post: string; desc: string }[] = [];
    const posts: ('Poste 1' | 'Poste 2' | 'Poste 3')[] = ['Poste 1', 'Poste 2', 'Poste 3'];
    const dbPostMapping = {
      'Poste 1': 'poste1',
      'Poste 2': 'poste2',
      'Poste 3': 'poste3'
    };

    posts.forEach(p => {
      const srcKey = dbPostMapping[p];
      const srcPost = duplicatedFromDayData.postes?.[srcKey] || {};

      // 1. Sector Chiefs
      const srcSectorChiefs = (duplicatedFromDayData.sectorChiefs || {})[srcKey] || {};
      const currentSectorChiefs = sectorChiefs[p] || {};
      ['Imiter 1', 'Imiter 2', 'Imiter Est'].forEach(sec => {
        const oldC = srcSectorChiefs[sec] || '';
        const newC = currentSectorChiefs[sec] || '';
        if (oldC.trim().toUpperCase() !== newC.trim().toUpperCase()) {
          const oldName = getEmployeeName(oldC) || 'Aucun';
          const newName = getEmployeeName(newC) || 'Aucun';
          diffs.push({
            type: 'Chef de Secteur',
            post: p,
            desc: `Secteur ${sec} : ${oldName} ➔ ${newName}`
          });
        }
      });

      // 2. Minage
      const oldMinage = srcPost.minage || [];
      const currentMinage = minageRowsByPost[p] || [];
      const filterMin = (list: any[]) => list.filter((r: any) => r.chantierId !== '' && (r.minerMatricule?.trim() || r.assistantMatricule?.trim()));
      const fOldMin = filterMin(oldMinage);
      const fCurMin = filterMin(currentMinage);

      const maxMinLen = Math.max(fOldMin.length, fCurMin.length);
      for (let i = 0; i < maxMinLen; i++) {
        const oldRow = fOldMin[i];
        const newRow = fCurMin[i];

        if (oldRow && !newRow) {
          const chName = chantiers.find(c => c.id === oldRow.chantierId)?.name || 'Chantier';
          diffs.push({
            type: 'Minage',
            post: p,
            desc: `Supprimé : Chantier ${chName} (${getEmployeeName(oldRow.minerMatricule)})`
          });
        } else if (!oldRow && newRow) {
          const chName = chantiers.find(c => c.id === newRow.chantierId)?.name || 'Chantier';
          diffs.push({
            type: 'Minage',
            post: p,
            desc: `Nouveau : Chantier ${chName} attribué à ${getEmployeeName(newRow.minerMatricule)}`
          });
        } else if (oldRow && newRow) {
          const chOldName = chantiers.find(c => c.id === oldRow.chantierId)?.name || 'Chantier';
          const chNewName = chantiers.find(c => c.id === newRow.chantierId)?.name || 'Chantier';
          
          if (oldRow.chantierId !== newRow.chantierId) {
            diffs.push({
              type: 'Minage',
              post: p,
              desc: `Ligne ${i + 1} : Chantier modifié ${chOldName} ➔ ${chNewName}`
            });
          }
          if (oldRow.minerMatricule?.trim().toUpperCase() !== newRow.minerMatricule?.trim().toUpperCase()) {
            diffs.push({
              type: 'Minage',
              post: p,
              desc: `Chantier ${chNewName} : Mineur changé | ${getEmployeeName(oldRow.minerMatricule) || 'Aucun'} ➔ ${getEmployeeName(newRow.minerMatricule)}`
            });
          }
          if (oldRow.assistantMatricule?.trim().toUpperCase() !== newRow.assistantMatricule?.trim().toUpperCase()) {
            diffs.push({
              type: 'Minage',
              post: p,
              desc: `Chantier ${chNewName} : Aide-Mineur changé | ${getEmployeeName(oldRow.assistantMatricule) || 'Aucun'} ➔ ${getEmployeeName(newRow.assistantMatricule)}`
            });
          }
          if (Number(oldRow.plannedRounds) !== Number(newRow.plannedRounds)) {
            diffs.push({
              type: 'Minage',
              post: p,
              desc: `Chantier ${chNewName} : Volées prévues | ${oldRow.plannedRounds} ➔ ${newRow.plannedRounds}`
            });
          }
          if (Number(oldRow.plannedHoles) !== Number(newRow.plannedHoles)) {
            diffs.push({
              type: 'Minage',
              post: p,
              desc: `Chantier ${chNewName} : Trous perforés | ${oldRow.plannedHoles} ➔ ${newRow.plannedHoles}`
            });
          }
          if (Number(oldRow.realHoles) !== Number(newRow.realHoles)) {
            diffs.push({
              type: 'Minage',
              post: p,
              desc: `Chantier ${chNewName} : Trous chargés | ${oldRow.realHoles} ➔ ${newRow.realHoles}`
            });
          }
        }
      }

      // 3. Deblayage
      const oldDeb = srcPost.deblayage || [];
      const currentDeb = deblayageRowsByPost[p] || [];
      const filterDeb = (list: any[]) => list.filter((r: any) => r.driverMatricule !== '');
      const fOldDeb = filterDeb(oldDeb);
      const fCurDeb = filterDeb(currentDeb);

      const maxDebLen = Math.max(fOldDeb.length, fCurDeb.length);
      for (let i = 0; i < maxDebLen; i++) {
        const oldRow = fOldDeb[i];
        const newRow = fCurDeb[i];

        if (oldRow && !newRow) {
          diffs.push({
            type: 'Déblayage',
            post: p,
            desc: `Supprimé : Agent ${getEmployeeName(oldRow.driverMatricule)}`
          });
        } else if (!oldRow && newRow) {
          diffs.push({
            type: 'Déblayage',
            post: p,
            desc: `Nouveau : Agent ${getEmployeeName(newRow.driverMatricule)} affecté (${newRow.engineCode || 'Sans Engin'})`
          });
        } else if (oldRow && newRow) {
          if (oldRow.driverMatricule?.trim().toUpperCase() !== newRow.driverMatricule?.trim().toUpperCase()) {
            diffs.push({
              type: 'Déblayage',
              post: p,
              desc: `Ligne ${i + 1} : Conducteur changé | ${getEmployeeName(oldRow.driverMatricule)} ➔ ${getEmployeeName(newRow.driverMatricule)}`
            });
          }
          if (oldRow.engineId !== newRow.engineId || oldRow.engineCode !== newRow.engineCode) {
            diffs.push({
              type: 'Déblayage',
              post: p,
              desc: `Chauffeur ${getEmployeeName(newRow.driverMatricule)} : Engin | ${oldRow.engineCode || 'Aucun'} ➔ ${newRow.engineCode || 'Aucun'}`
            });
          }
          if (oldRow.chantierId !== newRow.chantierId) {
            const chOld = chantiers.find(c => c.id === oldRow.chantierId)?.name || 'Chantier';
            const chNew = chantiers.find(c => c.id === newRow.chantierId)?.name || 'Chantier';
            diffs.push({
              type: 'Déblayage',
              post: p,
              desc: `Chauffeur ${getEmployeeName(newRow.driverMatricule)} : Destination | ${chOld} ➔ ${chNew}`
            });
          }
          if (Number(oldRow.godets) !== Number(newRow.godets)) {
            diffs.push({
              type: 'Déblayage',
              post: p,
              desc: `Chauffeur ${getEmployeeName(newRow.driverMatricule)} : Godets | ${oldRow.godets} ➔ ${newRow.godets}`
            });
          }
          if (Number(oldRow.hoursWorked) !== Number(newRow.hoursWorked)) {
            diffs.push({
              type: 'Déblayage',
              post: p,
              desc: `Chauffeur ${getEmployeeName(newRow.driverMatricule)} : Heures | ${oldRow.hoursWorked}h ➔ ${newRow.hoursWorked}h`
            });
          }
        }
      }

      // 4. Extraction
      const oldExt = srcPost.extraction || [];
      const currentExt = extractionRowsByPost[p] || [];
      const fOldExt = oldExt[0] || {};
      const fCurExt = currentExt[0] || {};

      if (fOldExt && fCurExt) {
        if (fOldExt.treuilliste !== fCurExt.treuilliste) {
          diffs.push({
            type: 'Extraction',
            post: p,
            desc: `Treuilliste : ${getEmployeeName(fOldExt.treuilliste) || 'Aucun'} ➔ ${getEmployeeName(fCurExt.treuilliste)}`
          });
        }
        if (fOldExt.wagonsTarget !== fCurExt.wagonsTarget) {
          diffs.push({
            type: 'Extraction',
            post: p,
            desc: `Cible wagons : ${fOldExt.wagonsTarget} ➔ ${fCurExt.wagonsTarget}`
          });
        }
        if (fOldExt.sterileBureImiterEst !== fCurExt.sterileBureImiterEst) {
          diffs.push({
            type: 'Extraction',
            post: p,
            desc: `Stérile prévu (Wg) : ${fOldExt.sterileBureImiterEst} ➔ ${fCurExt.sterileBureImiterEst}`
          });
        }
        ['equipier1', 'equipier2', 'equipier3', 'equipier4'].forEach((eq, idx) => {
          if (fOldExt[eq] !== fCurExt[eq]) {
            diffs.push({
              type: 'Extraction',
              post: p,
              desc: `Équipier ${idx + 1} : ${getEmployeeName(fOldExt[eq]) || 'Aucun'} ➔ ${getEmployeeName(fCurExt[eq])}`
            });
          }
        });
      }

      // 5. Maintenance
      const oldMaint = srcPost.maintenance || [];
      const currentMaint = maintenanceRowsByPost[p] || [];
      const filterMaint = (list: any[]) => list.filter((r: any) => r.agentMatricule !== '');
      const fOldMaint = filterMaint(oldMaint);
      const fCurMaint = filterMaint(currentMaint);

      const maxMaintLen = Math.max(fOldMaint.length, fCurMaint.length);
      for (let i = 0; i < maxMaintLen; i++) {
        const oldRow = fOldMaint[i];
        const newRow = fCurMaint[i];

        if (oldRow && !newRow) {
          diffs.push({
            type: 'Maintenance',
            post: p,
            desc: `Supprimé : Agent ${getEmployeeName(oldRow.agentMatricule)}`
          });
        } else if (!oldRow && newRow) {
          diffs.push({
            type: 'Maintenance',
            post: p,
            desc: `Nouveau : Agent ${getEmployeeName(newRow.agentMatricule)} (${newRow.roleLabel})`
          });
        } else if (oldRow && newRow) {
          if (oldRow.agentMatricule?.trim().toUpperCase() !== newRow.agentMatricule?.trim().toUpperCase()) {
            diffs.push({
              type: 'Maintenance',
              post: p,
              desc: `Ligne ${i + 1} : Agent changé | ${getEmployeeName(oldRow.agentMatricule)} ➔ ${getEmployeeName(newRow.agentMatricule)}`
            });
          }
          if (oldRow.engineCode !== newRow.engineCode) {
            diffs.push({
              type: 'Maintenance',
              post: p,
              desc: `Agent ${getEmployeeName(newRow.agentMatricule)} : Engin | ${oldRow.engineCode || 'Aucun'} ➔ ${newRow.engineCode || 'Aucun'}`
            });
          }
          if (oldRow.workDescription !== newRow.workDescription) {
            diffs.push({
              type: 'Maintenance',
              post: p,
              desc: `Agent ${getEmployeeName(newRow.agentMatricule)} : Description | "${oldRow.workDescription}" ➔ "${newRow.workDescription}"`
            });
          }
        }
      }
    });

    return diffs;
  };

  const generateDayProposition = async () => {
    setLoading(true);
    try {
      const parts = selectedDate.split('-');
      if (parts.length !== 3) {
        alert("Date non valide.");
        setLoading(false);
        return;
      }
      const currentDate = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      const dayOfWeek = currentDate.getDay(); // 1 is Monday, etc.
      const isMonday = dayOfWeek === 1;

      let proposedMinage: ExcelMinage[] = [];
      let proposedDeblayage: ExcelDeblayage[] = [];
      let proposedExtraction: ExcelExtraction[] = [];
      let proposedMaintenance: ExcelMaintenance[] = [];
      
      const newSectorChiefs = { ...sectorChiefs[selectedPost] };

      const getEmpName = (mat: string) => {
        if (!mat) return '';
        const emp = employees.find(e => e.matricule?.toUpperCase() === mat.toUpperCase());
        return emp ? `${emp.nom} ${emp.prenom}` : '';
      };

      if (isMonday) {
        // Monday uses information directly from the weekly rotation plans configured on Saturday
        const activeStaff = employees.filter(e => e.status === 'actif' && e.currentPost === selectedPost);
        const sectors: ('Imiter 2' | 'Imiter 1' | 'Imiter Est')[] = ['Imiter 2', 'Imiter 1', 'Imiter Est'];

        const findSectorChiefByPost1Rules = (sName: string, staff: any[]) => {
          return staff.find(e => {
            if (e.fonction !== 'CHEF') return false;
            const fullName = `${e.nom || ''} ${e.prenom || ''}`.toLowerCase();
            if (sName === 'Imiter 2') {
              return fullName.includes('ben amar') || (fullName.includes('amar') && fullName.includes('mohamed'));
            }
            if (sName === 'Imiter 1') {
              return fullName.includes('ouissadine') || fullName.includes('abdessalam');
            }
            if (sName === 'Imiter Est') {
              return fullName.includes('sadik') || fullName.includes('said');
            }
            return false;
          });
        };

        // Group chefs
        sectors.forEach(sec => {
          let matchingChef;
          if (selectedPost === 'Poste 1') {
            matchingChef = findSectorChiefByPost1Rules(sec, activeStaff);
          }
          if (!matchingChef) {
            matchingChef = activeStaff.find(e => e.fonction === 'CHEF' && isSectorMatching(e.sector || '', sec));
          }
          if (matchingChef) {
            newSectorChiefs[sec] = matchingChef.matricule;
          }
        });

        // Seed Minage rows prefilled with active miners/assistants
        proposedMinage = ensureMinimumRows([], 'minage', selectedPost, chantiers).map(row => {
          const finalRow = { ...row };
          const chan = chantiers.find(c => c.id === row.chantierId);
          if (chan) {
            const sec = row.sectorGroup || 'Imiter 2';
            
            // Find miners
            const assignedMinersMatricules = proposedMinage.map(pm => pm.minerMatricule).filter(Boolean);
            const minerCandidates = activeStaff.filter(e => e.fonction === 'MINEUR' && isSectorMatching(e.sector || '', sec) && !assignedMinersMatricules.includes(e.matricule));
            if (minerCandidates.length > 0) {
              finalRow.minerMatricule = minerCandidates[0].matricule;
              finalRow.minerName = `${minerCandidates[0].nom} ${minerCandidates[0].prenom}`;
            }

            // Find assistants
            const assignedAidesMatricules = proposedMinage.map(pm => pm.assistantMatricule).filter(Boolean);
            const aideCandidates = activeStaff.filter(e => e.fonction === 'AIDE_MINEUR' && isSectorMatching(e.sector || '', sec) && !assignedAidesMatricules.includes(e.matricule));
            if (aideCandidates.length > 0) {
              finalRow.assistantMatricule = aideCandidates[0].matricule;
              finalRow.assistantName = `${aideCandidates[0].nom} ${aideCandidates[0].prenom}`;
            }
          }
          return finalRow;
        });

        // Seed Deblayage drivers & engines
        proposedDeblayage = ensureMinimumRows([], 'deblayage', selectedPost, chantiers).map((row, idx) => {
          const finalRow = { ...row };
          const chan = chantiers.find(c => c.id === row.chantierId);
          if (chan) {
            const sec = row.sectorGroup || 'Imiter 2';
            
            // Find driver
            const assignedDrivers = proposedDeblayage.map(pd => pd.driverMatricule).filter(Boolean);
            const driverCandidates = activeStaff.filter(e => e.fonction === 'CONDUCTEUR_ENGIN' && isSectorMatching(e.sector || '', sec) && !assignedDrivers.includes(e.matricule));
            if (driverCandidates.length > 0) {
              finalRow.driverMatricule = driverCandidates[0].matricule;
              finalRow.driverName = `${driverCandidates[0].nom} ${driverCandidates[0].prenom}`;
            }

            const availableEngines = engines.map(e => e.code || e.id || '');
            if (availableEngines.length > 0) {
              finalRow.engineCode = availableEngines[idx % availableEngines.length];
              finalRow.engineId = finalRow.engineCode;
            }
          }
          return finalRow;
        });

        // Seed Extraction
        const treuillistes = activeStaff.filter(e => e.fonction === 'TREUILLISTE');
        const defaultExt = getDefaultExtractionRows(selectedPost)[0];
        if (treuillistes.length > 0) {
          defaultExt.treuilliste = treuillistes[0].matricule;
        }
        const ouvs = activeStaff.filter(e => e.fonction === 'OUVRIER' || e.fonction === 'AIDE_MINEUR');
        if (ouvs.length > 1) {
          defaultExt.equipier1 = ouvs[0].matricule;
          defaultExt.equipier2 = ouvs[1].matricule;
        }
        proposedExtraction = [defaultExt];

        // Seed Maintenance
        const techStaff = activeStaff.filter(e => ['MECANICIEN', 'ELECTRICIEN', 'CHAUDRONNIER'].includes(e.fonction));
        proposedMaintenance = getDefaultMaintenanceRows(selectedPost).map(row => {
          const finalRow = { ...row };
          const matchingTech = techStaff.find(e => {
            if (row.roleLabel.includes('MÉCANICIEN') && e.fonction === 'MECANICIEN') return true;
            if (row.roleLabel.includes('ÉLECTRICIEN') && e.fonction === 'ELECTRICIEN') return true;
            if (row.roleLabel.includes('CHAUDRONNIER') && e.fonction === 'CHAUDRONNIER') return true;
            return false;
          });
          if (matchingTech) {
            finalRow.agentMatricule = matchingTech.matricule;
            finalRow.agentName = `${matchingTech.nom} ${matchingTech.prenom}`;
          }
          return finalRow;
        });

      } else {
        // Tuesday to Sunday suggestions are formulated from J-1 yesterday
        const prevDateObj = addDays(currentDate, -1);
        const prevDateStr = format(prevDateObj, 'yyyy-MM-dd');

        const docRef = doc(db, 'daily_planning_sheets', prevDateStr);
        const docSnap = await getDoc(docRef);

        let copiedMinage: ExcelMinage[] = [];
        let copiedDeblayage: ExcelDeblayage[] = [];
        let copiedExtraction: ExcelExtraction[] = [];
        let copiedMaintenance: ExcelMaintenance[] = [];

        if (docSnap.exists()) {
          const docData = docSnap.data();
          const pk = selectedPost === 'Poste 1' ? 'poste1' : selectedPost === 'Poste 2' ? 'poste2' : 'poste3';
          const pData = docData.postes?.[pk] || {};
          
          copiedMinage = pData.minage || [];
          copiedDeblayage = pData.deblayage || [];
          copiedExtraction = pData.extraction || [];
          copiedMaintenance = pData.maintenance || [];

          const prevSectorChiefs = (docData.sectorChiefs || {})[selectedPost] || {};
          Object.assign(newSectorChiefs, prevSectorChiefs);
        }

        const activeStaff = employees.filter(e => e.status === 'actif' && e.currentPost === selectedPost);
        const findActiveMatricule = (mat: string) => {
          if (!mat) return '';
          const found = activeStaff.find(e => e.matricule?.toUpperCase() === mat.toUpperCase());
          return found ? found.matricule : '';
        };

        proposedMinage = ensureMinimumRows(copiedMinage, 'minage', selectedPost, chantiers).map(row => {
          const finalRow = { ...row };
          finalRow.chiefMatricule = findActiveMatricule(row.chiefMatricule);
          finalRow.chiefName = getEmpName(finalRow.chiefMatricule);
          finalRow.minerMatricule = findActiveMatricule(row.minerMatricule);
          finalRow.minerName = getEmpName(finalRow.minerMatricule);
          finalRow.assistantMatricule = findActiveMatricule(row.assistantMatricule);
          finalRow.assistantName = getEmpName(finalRow.assistantMatricule);
          return finalRow;
        });

        proposedDeblayage = ensureMinimumRows(copiedDeblayage, 'deblayage', selectedPost, chantiers).map(row => {
          const finalRow = { ...row };
          finalRow.driverMatricule = findActiveMatricule(row.driverMatricule);
          finalRow.driverName = getEmpName(finalRow.driverMatricule);
          return finalRow;
        });

        proposedExtraction = sanitizeExtractionRows(copiedExtraction, POST_HOURS[selectedPost]).map(row => {
          const finalRow = { ...row };
          finalRow.treuilliste = findActiveMatricule(row.treuilliste);
          finalRow.equipier1 = findActiveMatricule(row.equipier1);
          finalRow.equipier2 = findActiveMatricule(row.equipier2);
          finalRow.equipier3 = findActiveMatricule(row.equipier3);
          finalRow.equipier4 = findActiveMatricule(row.equipier4);
          return finalRow;
        });

        const srcMaint = copiedMaintenance.length > 0 ? copiedMaintenance : getDefaultMaintenanceRows(selectedPost);
        proposedMaintenance = srcMaint.map(row => {
          const finalRow = { ...row };
          finalRow.agentMatricule = findActiveMatricule(row.agentMatricule);
          finalRow.agentName = getEmpName(finalRow.agentMatricule);
          return finalRow;
        });
      }

      // Compute visual changes comparing current UI state to the fresh suggested values
      const teamChanges: any[] = [];
      const currentMinage = minageRowsByPost[selectedPost] || [];
      const currentDeblayage = deblayageRowsByPost[selectedPost] || [];
      const currentExtraction = extractionRowsByPost[selectedPost] || [];

      const getChantierNameLocal = (id: string) => {
        if (id && id.startsWith('stock_')) {
          return id.replace('stock_', 'STOCK : ');
        }
        const ch = chantiers.find(c => c.id === id);
        return ch ? ch.name : id || 'Autres / Non classés';
      };

      const addChange = (type: string, role: string, chantier: string, oldMat: string, newMat: string) => {
        if (oldMat !== newMat) {
          teamChanges.push({
            type,
            role,
            chantierName: chantier,
            oldName: oldMat ? getEmployeeName(oldMat) : '',
            newName: newMat ? getEmployeeName(newMat) : ''
          });
        }
      };

      proposedMinage.forEach(row => {
        const oldRow = currentMinage.find(cm => cm.chantierId === row.chantierId);
        const nameChan = getChantierNameLocal(row.chantierId);
        addChange('Minage', 'Mineur', nameChan, oldRow?.minerMatricule || '', row.minerMatricule);
        addChange('Minage', 'Aide-Mineur', nameChan, oldRow?.assistantMatricule || '', row.assistantMatricule);
      });

      proposedDeblayage.forEach(row => {
        const oldRow = currentDeblayage.find(cd => cd.chantierId === row.chantierId);
        const nameChan = getChantierNameLocal(row.chantierId);
        addChange('Déblayage', 'Conducteur', nameChan, oldRow?.driverMatricule || '', row.driverMatricule);
      });

      proposedExtraction.forEach(row => {
        const oldRow = currentExtraction[0] || {};
        addChange('Extraction', 'Treuilliste', 'Extraction Bure', oldRow.treuilliste || '', row.treuilliste);
        addChange('Extraction', 'Équipier 1', 'Extraction Bure', oldRow.equipier1 || '', row.equipier1);
        addChange('Extraction', 'Équipier 2', 'Extraction Bure', oldRow.equipier2 || '', row.equipier2);
      });

      const inactiveAssigned: any[] = [];
      const verifyActiveStaff = (mat: string, role: string) => {
        if (!mat) return;
        const emp = employees.find(e => e.matricule?.toUpperCase() === mat.toUpperCase());
        if (emp && emp.status !== 'actif') {
          inactiveAssigned.push({ name: `${emp.nom} ${emp.prenom}`, matricule: emp.matricule, role });
        }
      };

      proposedMinage.forEach(r => { verifyActiveStaff(r.minerMatricule, 'Mineur Minage'); verifyActiveStaff(r.assistantMatricule, 'Aide Minage'); });
      proposedDeblayage.forEach(r => verifyActiveStaff(r.driverMatricule, 'Conducteur LHD'));
      proposedExtraction.forEach(r => { verifyActiveStaff(r.treuilliste, 'Treuilliste'); verifyActiveStaff(r.equipier1, 'Extraction'); });
      proposedMaintenance.forEach(r => verifyActiveStaff(r.agentMatricule, r.roleLabel));

      const assignedMatricules: string[] = [];
      const addAssigned = (m: string) => { if (m) assignedMatricules.push(m.toUpperCase()); };

      proposedMinage.forEach(r => { addAssigned(r.minerMatricule); addAssigned(r.assistantMatricule); });
      proposedDeblayage.forEach(r => addAssigned(r.driverMatricule));
      proposedExtraction.forEach(r => { addAssigned(r.treuilliste); addAssigned(r.equipier1); addAssigned(r.equipier2); addAssigned(r.equipier3); addAssigned(r.equipier4); });
      proposedMaintenance.forEach(r => addAssigned(r.agentMatricule));

      const unassignedPanel = employees.filter(e => {
        return e.status === 'actif' && e.currentPost === selectedPost && !assignedMatricules.includes(e.matricule?.toUpperCase());
      }).map(e => ({
        name: `${e.nom} ${e.prenom}`,
        matricule: e.matricule || '',
        sector: e.sector || 'Non assigné',
        fonction: e.fonction || 'MINEUR'
      }));

      setGapChanges(teamChanges);
      setGapInactive(inactiveAssigned);
      setGapUnassigned(unassignedPanel);
      
      setPendingProposition({
        minage: proposedMinage,
        deblayage: proposedDeblayage,
        extraction: proposedExtraction,
        maintenance: proposedMaintenance,
        sectorChiefs: newSectorChiefs
      });

      setIsGapModalOpen(true);

    } catch (err) {
      console.error("Erreur de génération automatique :", err);
      alert("Une erreur s'est produite lors de la génération de la proposition.");
    } finally {
      setLoading(false);
    }
  };

  const applyPendingProposition = async () => {
    if (!pendingProposition) return;
    try {
      setMinageRowsByPost(prev => ({ ...prev, [selectedPost]: pendingProposition.minage }));
      setDeblayageRowsByPost(prev => ({ ...prev, [selectedPost]: pendingProposition.deblayage }));
      setExtractionRowsByPost(prev => ({ ...prev, [selectedPost]: pendingProposition.extraction }));
      setMaintenanceRowsByPost(prev => ({ ...prev, [selectedPost]: pendingProposition.maintenance }));
      
      setSectorChiefs(prev => ({
        ...prev,
        [selectedPost]: pendingProposition.sectorChiefs
      }));

      setIsGapModalOpen(false);
      setPendingProposition(null);

      await logPlanningAction(
        user?.email || 'Planificateur SMI',
        'PROPOSITION DISPATCH',
        selectedPost,
        selectedDate,
        `Application de l'assistance et ordonnancement de la journée (${gapChanges.length} permutations et ${gapUnassigned.length} membres gardés disponibles).`
      );

    } catch (err) {
      console.error("Erreur d'application :", err);
      alert("Impossible d'appliquer la proposition.");
    }
  };

  // Master Workbook Persistence and Sync to granular discrete planning collection
  const savePlanningWorkbook = async () => {
    if (isMonthClosedForPlanning) {
      alert("⚠️ Ce mois est clôturé. Aucune modification n'est permise sur cette planification.");
      return;
    }
    if (duplicatedFromDayData && !isEcartAccepted) {
      alert(`⚠️ ÉCARTS NON VALIDÉS : Vous avez dupliqué la planification d'hier (${yesterdayDateStr}) mais vous n'avez pas encore validé les écarts ou changements.\n\nVeuillez vérifier la liste d'analyse des écarts en bas de page et cliquer sur le bouton "Valider les écarts de planification J-1" pour autoriser l'enregistrement.`);
      setSaveStatus('idle');
      return;
    }
    setSaveStatus('saving');
    try {
      const docRef = doc(db, 'daily_planning_sheets', selectedDate);
      
      const docSnap = await getDoc(docRef);
      const docData = docSnap.exists() ? docSnap.data() : {};
      const existingPostes = docData.postes || {};

      const posts: ('Poste 1' | 'Poste 2' | 'Poste 3')[] = ['Poste 1', 'Poste 2', 'Poste 3'];
      const newPostesObj = { ...existingPostes };

      posts.forEach(p => {
        const pk = p === 'Poste 1' ? 'poste1' : p === 'Poste 2' ? 'poste2' : 'poste3';
        const chiefMat = sectorChiefs[p] || { 'Imiter 2': '', 'Imiter 1': '', 'Imiter Est': '' };
        const bfMat = sectorBoutefeus[p] || { 'Imiter 2': '', 'Imiter 1': '', 'Imiter Est': '' };
        
        // Synthesize and attach chiefs & boutefeus row-by-row for backward-compatibility with downstream pipelines
        const pMinageObj = minageRowsByPost[p].map(r => {
          const sec = r.sectorGroup || 'Imiter 2';
          const chiefM = chiefMat[sec] || '';
          const emp = employees.find(e => e.matricule?.toUpperCase() === chiefM.trim().toUpperCase());
          const bfM = bfMat[sec] || '';
          const bfEmp = employees.find(e => e.matricule?.toUpperCase() === bfM.trim().toUpperCase());
          return {
            ...r,
            chiefMatricule: chiefM,
            chiefName: emp ? `${emp.nom} ${emp.prenom}` : '',
            boutefeuMatricule: bfM,
            boutefeuName: bfEmp ? `${bfEmp.nom} ${bfEmp.prenom}` : ''
          };
        });

        const pMinage = pMinageObj.filter(r => r.chantierId !== '');
        const pDeblayage = deblayageRowsByPost[p].filter(r => r.chantierId !== '');
        
        if (!newPostesObj[pk]) {
          newPostesObj[pk] = {
            chiefMatricule: '',
            chiefName: '',
            secondChiefMatricule: '',
            secondChiefName: '',
            status: 'planifie',
            minage: [],
            deblayage: [],
            extraction: [],
            maintenance: []
          };
        }

        newPostesObj[pk] = {
          ...newPostesObj[pk],
          status: 'planifie',
          minage: pMinage,
          deblayage: pDeblayage,
          extraction: extractionRowsByPost[p] || [],
          maintenance: (maintenanceRowsByPost[p] || []).filter(r => r.agentMatricule !== ''),
          sectorChiefs: sectorChiefs[p] || {},
          sectorBoutefeus: sectorBoutefeus[p] || {},
          sectorBoutefeuTasks: sectorBoutefeuTasks[p] || {}
        };
      });

      const operatorName = profile?.name || user?.email || 'Planificateur de Direction SMI';
      const nowStr = new Date().toISOString();

      const savedByVal = docData.savedBy || operatorName;
      const savedAtVal = docData.savedAt || nowStr;
      
      const savedStatus = docData.status === 'valide' ? 'valide' : 'planifie';
      const validatedByVal = docData.validatedBy || null;
      const validatedByUidVal = docData.validatedByUid || null;
      const validatedAtVal = docData.validatedAt || null;

      const updateData = {
        date: selectedDate,
        status: savedStatus,
        operator: operatorName,
        timestamp: nowStr,
        sectorChiefs: sectorChiefs,
        sectorBoutefeus: sectorBoutefeus,
        sectorBoutefeuTasks: sectorBoutefeuTasks,
        postes: newPostesObj,
        savedBy: savedByVal,
        savedAt: savedAtVal,
        lastModifiedBy: operatorName,
        lastModifiedAt: nowStr,
        validatedBy: validatedByVal,
        validatedByUid: validatedByUidVal,
        validatedAt: validatedAtVal
      };

      await setDoc(docRef, updateData, { merge: true });

      setSignatureInfo({
        savedBy: savedByVal,
        savedAt: savedAtVal,
        lastModifiedBy: operatorName,
        lastModifiedAt: nowStr
      });
      setIsPlanningSavedInDb(true);

      // Clean J-1 discrete logs to prevent duplicates
      const planColl = collection(db, 'planning');
      const qExist = query(planColl, where('date', '==', selectedDate));
      const existSnap = await getDocs(qExist);
      
      for (const d of existSnap.docs) {
        await deleteDoc(doc(db, 'planning', d.id));
      }

      // Populate discrete collection records
      for (const p of posts) {
        const pk = p === 'Poste 1' ? 'poste1' : p === 'Poste 2' ? 'poste2' : 'poste3';
        const pDataObj = newPostesObj[pk];

        if (pDataObj?.minage) {
          for (const row of pDataObj.minage) {
            const chantierObj = chantiers.find(c => c.id === row.chantierId);
            await addDoc(planColl, {
              date: selectedDate,
              post: p,
              type: 'minage',
              chantierId: row.chantierId,
              chantierName: chantierObj?.name || 'Slick',
              chiefMatricule: row.chiefMatricule,
              chiefName: row.chiefName,
              minerMatricule: row.minerMatricule,
              minerName: row.minerName,
              assistantMatricule: row.assistantMatricule,
              assistantName: row.assistantName,
              galleryType: row.gallerySize === 9 ? '9m2' : '12m2',
              plannedHoles: row.plannedHoles,
              plannedRounds: row.plannedRounds,
              explosives: {
                anfo: row.anfo,
                tovex: row.tovex,
                ammorces: row.ammorces
              }
            });
          }
        }

        if (pDataObj?.deblayage) {
          for (const row of pDataObj.deblayage) {
            const chantierObj = chantiers.find(c => c.id === row.chantierId);
            await addDoc(planColl, {
              date: selectedDate,
              post: p,
              type: 'deblayage',
              chantierId: row.chantierId,
              chantierName: chantierObj?.name || 'Slick',
              driverMatricule: row.driverMatricule,
              driverName: row.driverName,
              engineId: row.engineId,
              engineCode: row.engineCode,
              engineName: row.engineCode || row.engineId || ''
            });
          }
        }

        if (pDataObj?.extraction) {
          for (const row of pDataObj.extraction) {
            if (row.treuilliste || row.equipier1) {
              await addDoc(planColl, {
                date: selectedDate,
                post: p,
                type: 'extraction',
                chantierName: row.chantierName,
                treuilliste: row.treuilliste,
                equipier1: row.equipier1,
                equipier2: row.equipier2,
                equipier3: row.equipier3,
                equipier4: row.equipier4,
                wagonsTarget: row.wagonsTarget,
                sterileBureImiterEst: row.sterileBureImiterEst,
                startTime: row.startTime,
                endTime: row.endTime,
                remarks: row.remarks
              });
            }
          }
        }

        if (pDataObj?.maintenance) {
          for (const row of pDataObj.maintenance) {
            await addDoc(planColl, {
              date: selectedDate,
              post: p,
              type: 'maintenance',
              agentMatricule: row.agentMatricule,
              agentName: row.agentName,
              agentFonction: row.roleLabel,
              engineId: row.engineId,
              engineCode: row.engineCode,
              engineName: row.engineCode || row.engineId || '',
              visitType: 'preventive',
              description: row.workDescription
            });
          }
        }
      }

      setSaveStatus('saved');
      try {
        await logPlanningAction(
          user?.email || 'Planificateur SMI',
          'SAUVEGARDE PLAN',
          'TOUS LES POSTES',
          selectedDate,
          "Gravure et enregistrement définitif de la planification journalière dans la base de données SMI."
        );
      } catch (logErr) {
        console.warn("Audit logs error writing: ", logErr);
      }
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch (err) {
      console.error("Erreur de sauvegarde de planification :", err);
      setSaveStatus('error');
    }
  };

  const validatePlanningWorkbook = async () => {
    if (isMonthClosedForPlanning) {
      alert("⚠️ Ce mois est clôturé. Aucune validation n'est permise.");
      return;
    }
    if (!isPlanningSavedInDb) {
      alert("⚠️ Veuillez d'abord enregistrer la planification avant de la valider.");
      return;
    }
    const confirmVal = window.confirm("✓ Voulez-vous vraiment valider cette planification ?\n\nAprès validation, une fenêtre d'édition libre de 24 heures sera ouverte. Au-delà, toute modification demandera une approbation.");
    if (!confirmVal) return;

    try {
      setSaveStatus('saving');
      const docRef = doc(db, 'daily_planning_sheets', selectedDate);
      const validatorName = profile?.name || user?.displayName || user?.email || 'Planificateur de Direction SMI';
      const validatorUid = user?.uid || '';
      const nowStr = new Date().toISOString();

      const updateValData = {
        status: 'valide',
        validatedBy: validatorName,
        validatedByUid: validatorUid,
        validatedAt: nowStr
      };

      await setDoc(docRef, updateValData, { merge: true });

      setValidationInfo({
        validatedBy: validatorName,
        validatedByUid: validatorUid,
        validatedAt: nowStr,
        status: 'valide'
      });
      setSaveStatus('saved');
      
      try {
        await logPlanningAction(
          user?.email || 'Planificateur SMI',
          'VALIDATION PLAN',
          'TOUS LES POSTES',
          selectedDate,
          `Validation officielle de la planification journalière par ${validatorName}.`
        );
      } catch (logErr) {
        console.warn("Audit logs error writing: ", logErr);
      }

      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch (err: any) {
      console.error("Erreur de validation : ", err);
      alert(`Erreur de validation : ${err.message}`);
      setSaveStatus('error');
    }
  };

  const handleDeleteHistoryRecord = async (record: any) => {
    const allowedRoles = ['admin', 'direction', 'chief', 'responsible', 'secretary'];
    if (!profile || !allowedRoles.includes(profile.role)) {
      alert("Seuls les administrateurs et planificateurs de la plateforme peuvent supprimer des cahiers.");
      return;
    }

    setRecordToDelete(record);
    setIsDeleteModalOpen(true);
  };

  const confirmDeleteRecord = async () => {
    if (!recordToDelete) return;

    // Save record properties locally before state resets
    const recordDate = recordToDelete.date;
    const operatorEmail = user?.email || 'Admin/Planificateur';
    
    // Safely compute details
    let minageCount = 0;
    let totalMeterage = 0;
    if (recordToDelete.minageRows && Array.isArray(recordToDelete.minageRows)) {
      minageCount = recordToDelete.minageRows.length;
      recordToDelete.minageRows.forEach((r: any) => {
        if (r) {
          const isVolee = r.remarks && typeof r.remarks === 'string' && r.remarks.includes('(Volée');
          if (!isVolee) {
            totalMeterage += (Number(r.meterage) || 0);
          }
        }
      });
    }
    const logDetails = `${minageCount} chantiers tirs, ${totalMeterage.toFixed(1)}m avancement`;

    try {
      // 1. Delete main daily planning sheet document
      const docRef = doc(db, 'daily_planning_sheets', recordDate);
      await deleteDoc(docRef);

      // Successfully deleted on server! We can immediately dismiss the modal so the user doesn't wait
      setIsDeleteModalOpen(false);
      setRecordToDelete(null);

      // Trigger custom UI validation notification in Hydromines sky blue
      setDeletionNotification({
        date: recordDate,
        deletedBy: operatorEmail.split('@')[0]
      });
      setTimeout(() => {
        setDeletionNotification(null);
      }, 5000);

      // 2. Clear out sub-planning collection records in a safe background task
      try {
        const planColl = collection(db, 'planning');
        const qExist = query(planColl, where('date', '==', recordDate));
        const existSnap = await getDocs(qExist);
        if (!existSnap.empty) {
          const batch = writeBatch(db);
          existSnap.docs.forEach(docD => {
            batch.delete(docD.ref);
          });
          await batch.commit();
        }
      } catch (cleanErr) {
        console.warn("Error cleaning up planning assignments:", cleanErr);
      }

      // 3. Write deletion trace to journal collection
      try {
        await addDoc(collection(db, 'deleted_plannings_log'), {
          date: recordDate,
          deletedBy: operatorEmail,
          deletedAt: new Date().toISOString(),
          details: `Suppression définitive du cahier : ${logDetails}`
        });
      } catch (logCollErr) {
        console.error("Error writing to deleted_plannings_log:", logCollErr);
      }

      // 4. Log to regular planning action audit trail
      try {
        await logPlanningAction(
          operatorEmail,
          'SUPPRESSION PLAN',
          'TOUS LES POSTES',
          recordDate,
          `Suppression définitive de toute la planification journalière pour le ${recordDate}.`
        );
      } catch (logErr) {
        console.warn("Audit logs error writing on delete: ", logErr);
      }

    } catch (err) {
      console.error("Erreur lors de la suppression de la planification :", err);
      alert("Une erreur est survenue lors de la suppression.");
      // Just in case, close modal
      setIsDeleteModalOpen(false);
      setRecordToDelete(null);
    }
  };

  const submitModificationRequest = async () => {
    if (!requestReason.trim()) {
      alert("La raison de la modification est obligatoire.");
      return;
    }

    try {
      const parentDocRef = doc(db, 'daily_planning_sheets', selectedDate);
      const subCollRef = collection(parentDocRef, 'modification_requests');
      
      const email = user?.email || 'Secrétaire';
      const uid = user?.uid || 'unknown-uid';
      
      await addDoc(subCollRef, {
        requestedBy: email,
        requestedByUid: uid,
        requestedAt: new Date().toISOString(),
        reason: requestReason,
        status: 'pending'
      });

      // Write trace in audit log
      await logPlanningAction(
        email,
        'DEMANDE MODIFICATION',
        'TOUS LES POSTES',
        selectedDate,
        `Demande de modification soumise pour le ${selectedDate}. Raison : ${requestReason}`
      );

      setIsRequestModalOpen(false);
      setRequestReason('');
    } catch (err) {
      console.error("Error submitting modification request :", err);
      alert("Une erreur est survenue lors de la soumission de la demande.");
    }
  };

  const nonEmptyChantiersCount = [
    ...(minageRowsByPost['Poste 1'] || []),
    ...(minageRowsByPost['Poste 2'] || []),
    ...(minageRowsByPost['Poste 3'] || [])
  ].filter(r => r.chantierId && (r.minerMatricule || r.assistantMatricule)).length;

  // Evaluate Niveau 2 lock status
  const isLockedByNiveau2 = (() => {
    if (!validationInfo || validationInfo.status !== 'valide' || !validationInfo.validatedAt) {
      return false;
    }
    const elapsedMs = currentTime - new Date(validationInfo.validatedAt).getTime();
    const exceeds24h = elapsedMs > 24 * 60 * 60 * 1000;
    
    // Check if there is an active approved reopening request
    const hasActiveReopen = modRequests.some(r => {
      if (r.status !== 'approved') return false;
      const reopenTime = r.reopenUntil ? new Date(r.reopenUntil).getTime() : 0;
      return currentTime < reopenTime;
    });

    return exceeds24h && !hasActiveReopen;
  })();

  const renderPlanningStatusBanner = () => {
    if (isMonthClosedForPlanning) {
      const closedDateFormatted = monthClosureInfo?.closedAt 
        ? format(new Date(monthClosureInfo.closedAt), 'dd/MM/yyyy à HH:mm')
        : '';
      return (
        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-4 flex items-center gap-3 text-red-900 text-[11px] font-medium mb-1 select-none w-full shadow-sm animate-fade-in">
          <span className="text-xl shrink-0">🔒</span>
          <div>
            <span className="font-black text-red-800 uppercase text-[9px] tracking-widest block mb-0.5">
              Mois clôturé — Aucune modification possible
            </span>
            Le mois {selectedDate.substring(0, 7)} a été clôturé le {closedDateFormatted} par <strong>{monthClosureInfo?.closedBy || 'Administrateur'}</strong>. Toute intervention est définitivement interdite.
          </div>
        </div>
      );
    }

    if (!isPlanningSavedInDb) return null;
    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const formattedDate = selectedDate.split('-').reverse().join('/');

    // 1. Check if we are locked by Niveau 2 (validated and > 24 hours past validation, without active approved request)
    if (isLockedByNiveau2) {
      const valDateFormatted = validationInfo?.validatedAt 
        ? format(new Date(validationInfo.validatedAt), 'dd/MM/yyyy à HH:mm') 
        : '';
        
      const pendingReq = modRequests.find(r => r.status === 'pending');
      const rejectedReq = modRequests.find(r => r.status === 'rejected');

      return (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-red-955 text-[11px] font-medium leading-normal mb-1 select-none">
          <div className="flex items-center gap-3">
            <span className="text-xl shrink-0">🔒</span>
            <div>
              <span className="font-black text-red-800 uppercase text-[9px] tracking-widest block mb-0.5">Planification verrouillée — Niveau 2</span>
              Planification verrouillée — validée le <strong>{valDateFormatted}</strong> par <strong>{validationInfo?.validatedBy || 'Administrateur'}</strong>. Toute modification requiert une approbation direction ou admin.
            </div>
          </div>
          
          <div className="flex flex-col items-stretch md:items-end gap-1.5 shrink-0">
            {pendingReq ? (
              <span className="bg-amber-105 text-amber-800 font-extrabold px-3 py-1.5 rounded-lg text-[9px] uppercase tracking-wide border border-amber-200 bg-amber-50 flex items-center gap-1.5">
                ⏳ Demande de modification en attente d'approbation
              </span>
            ) : rejectedReq ? (
              <div className="flex flex-col items-stretch md:items-end gap-1">
                <span className="bg-red-100 text-red-800 font-extrabold px-3 py-1 bg-red-100 border border-red-200 rounded-lg text-[9px] uppercase tracking-wide">
                  ❌ Demande rejetée par l'admin
                </span>
                <span className="text-[9px] text-gray-500 italic max-w-xs truncate" title={rejectedReq.rejectReason}>
                  Motif : {rejectedReq.rejectReason || 'Non spécifié'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setRequestReason('');
                    setIsRequestModalOpen(true);
                  }}
                  className="bg-sky-600 hover:bg-sky-700 text-white font-bold px-2.5 py-1 rounded text-[9.5px] uppercase tracking-wider shadow-xs shrink-0 cursor-pointer mt-1"
                >
                  Faire une nouvelle demande
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setRequestReason('');
                  setIsRequestModalOpen(true);
                }}
                className="bg-red-650 hover:bg-red-700 text-white font-black px-4 py-2 rounded-xl text-[10px] uppercase tracking-wider shadow-sm hover:shadow active:translate-y-px transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                📝 Demander une modification
              </button>
            )}
          </div>
        </div>
      );
    }

    // 2. Check if we have an active approved reopening request window
    const activeReopenRequest = modRequests.find(r => {
      if (r.status !== 'approved') return false;
      const reopenUntilTime = r.reopenUntil ? new Date(r.reopenUntil).getTime() : 0;
      return reopenUntilTime > currentTime;
    });

    if (activeReopenRequest) {
      const diffMs = new Date(activeReopenRequest.reopenUntil).getTime() - currentTime;
      const diffMinutes = Math.max(0, Math.ceil(diffMs / 1000 / 60));
      return (
        <div className="bg-sky-50 border-2 border-sky-200 rounded-xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-sky-955 text-[11px] font-medium leading-normal mb-1">
          <div className="flex items-center gap-3">
            <span className="text-xl shrink-0">🔓</span>
            <div>
              <span className="font-black text-sky-700 uppercase text-[9px] tracking-widest block mb-0.5">Fenêtre temporaire de modification active</span>
              Planification réouverte temporairement par <strong>{activeReopenRequest.approvedBy || 'Admin'}</strong>.<br />
              Toutes les modifications sont autorisées et seront tracées. Temps d'uniquement 2 heures accordé. Reste : <strong>{diffMinutes} minute{diffMinutes > 1 ? 's' : ''}</strong>.
            </div>
          </div>
          <span className="bg-[#00BFFF]/10 text-sky-800 font-black px-3 py-1.5 rounded-lg text-[9.5px] uppercase border border-[#00BFFF]/20 animate-pulse self-center">
            ⚡ EDITION RE-AUTORISÉE ({diffMinutes} min)
          </span>
        </div>
      );
    }

    // 3. Fallback to normal status banners if not locked
    let message = "";
    let icon = "📋";
    if (selectedDate < todayStr) {
      message = `⚠️ La planification du ${formattedDate} est déjà enregistrée. Toute modification sera tracée.`;
      icon = "🗄️";
    } else if (selectedDate === todayStr) {
      message = "Planning en cours d'exécution pour aujourd'hui.";
      icon = "⚡";
    } else {
      message = "Un planning futur est déjà programmé pour cette date.";
      icon = "📅";
    }

    const isPast = selectedDate < todayStr;
    const bannerClass = isPast 
      ? "bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-center gap-3 text-amber-900 text-[11px] font-medium leading-normal select-none mb-1"
      : "bg-[#00BFFF]/5 border border-[#00BFFF]/20 rounded-xl p-3.5 flex items-center gap-3 text-sky-955 text-[11px] font-medium leading-normal select-none mb-1";
      
    const headerClass = isPast 
      ? "font-black text-amber-800 uppercase text-[8.5px] tracking-widest block mb-0.5"
      : "font-black text-sky-900 uppercase text-[8.5px] tracking-widest block mb-0.5";

    return (
      <div className={bannerClass}>
        <span className="text-base">{icon}</span>
        <div>
          <span className={headerClass}>Statut de la planification</span>
          {message}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Unified Elegant Header Banner with Enlarged Logo and Centered Title */}
      <div id="unified-planning-banner" className="bg-white border border-gray-200 rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
          {/* Logo Column */}
          <div className="flex-shrink-0 animate-fade-in">
            <img 
              src={logoImg} 
              alt="HydroMines Logo" 
              className="h-24 w-24 md:h-28 md:w-28 object-contain rounded-xl border border-gray-150 p-1.5 bg-white shadow-sm" 
              referrerPolicy="no-referrer" 
            />
          </div>

          {/* Centered Column: Title, Subtitle, Date & Shift controls */}
          <div className="flex-1 text-center space-y-2 max-w-2xl">
            <h3 className="text-2xl md:text-3xl font-black tracking-tight text-gray-955 uppercase">
              Planification-Ordonnancement SMI
            </h3>
            <p className="text-[10px] md:text-[11px] font-bold uppercase tracking-wider text-gray-500">
              Cahier de Chargement Théorique • Alignement optimal des équipes et chantiers du fond
            </p>

            {/* Shift and date options combined inside the main banner text */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <div className="inline-flex items-center gap-2 bg-sky-50/60 border border-sky-100 px-3 py-1.5 rounded-xl shadow-xs">
                <span className="text-[10px] font-black uppercase text-[#00BFFF] tracking-wider">
                  📅 Plan théorique du :
                </span>
                <input 
                  type="date"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="bg-white hover:bg-gray-50 text-gray-950 font-extrabold text-[12px] uppercase border border-gray-200 rounded-lg px-2.5 py-1 outline-none focus:ring-1 focus:ring-[#00BFFF]/30 cursor-pointer"
                />
              </div>

              {(activeSheetTab === 'minage' || activeSheetTab === 'deblayage') ? (
                <div className="inline-flex items-center gap-2 bg-emerald-50/50 border border-emerald-100 px-3 py-1.5 rounded-xl">
                  <span className="text-[10px] font-extrabold uppercase text-emerald-700 tracking-wider">
                    📚 3 postes synchronisés en continu
                  </span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 bg-purple-50/50 border border-purple-150 px-3 py-1 rounded-xl shadow-xs">
                  <span className="text-[10px] font-extrabold uppercase text-purple-700 tracking-wider">
                    Poste actif :
                  </span>
                  <select 
                    value={selectedPost}
                    onChange={e => setSelectedPost(e.target.value as any)}
                    className="bg-white text-gray-950 font-extrabold text-[11px] uppercase border border-gray-200 rounded-lg px-2 py-0.5 outline-none cursor-pointer"
                  >
                    <option value="Poste 1">POSTE 1 (MATIN)</option>
                    <option value="Poste 2">POSTE 2 (MIDI)</option>
                    <option value="Poste 3">POSTE 3 (NUIT)</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: View toggles & Quick action items */}
          <div className="flex flex-col items-center lg:items-end gap-3 w-full lg:w-auto">
            <div className="flex gap-1 p-1 bg-gray-100 rounded-xl w-full max-w-xs md:max-w-none">
              <button 
                onClick={() => setViewMode('sheet')}
                className={`flex-1 px-3.5 py-1.5 rounded-lg font-extrabold text-[10px] uppercase tracking-wider transition-all text-center ${
                  viewMode === 'sheet' 
                    ? 'bg-white text-gray-950 shadow-sm border border-gray-200' 
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                🟩 Planification
              </button>
              <button 
                onClick={() => setViewMode('history')}
                className={`flex-1 px-3.5 py-1.5 rounded-lg font-extrabold text-[10px] uppercase tracking-wider transition-all text-center ${
                  viewMode === 'history' 
                    ? 'bg-white text-gray-950 shadow-sm border border-gray-200' 
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                📋 Cahiers ({planningsHistory.length})
              </button>
            </div>

            {viewMode === 'sheet' && (
              <div className="flex flex-wrap justify-center lg:justify-end gap-1.5 w-full">
                <button
                  onClick={() => setIsAuditDrawerOpen(true)}
                  className="bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-200 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
                  title="Consulter le registre d'audit et historique des événements"
                >
                  🪵 Traces Audit
                </button>
                <ExcelExportButton
                  selectedDate={selectedDate}
                  minageRowsByPost={minageRowsByPost}
                  deblayageRowsByPost={deblayageRowsByPost}
                  extractionRowsByPost={extractionRowsByPost}
                  maintenanceRowsByPost={maintenanceRowsByPost}
                  sectorChiefs={sectorChiefs}
                  chantiers={chantiers}
                  employees={employees}
                />
                <button
                  onClick={triggerDuplicatePreviousDay}
                  disabled={isLockedByNiveau2 || isMonthClosedForPlanning}
                  className={`border px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all flex items-center gap-1 shadow-xs font-sans ${isLockedByNiveau2 || isMonthClosedForPlanning ? 'bg-gray-100 text-gray-450 border-gray-200 cursor-not-allowed opacity-60' : 'bg-sky-50 hover:bg-sky-100 text-[#00BFFF] border-sky-200 cursor-pointer'}`}
                  title="Dupliquer la planification complète du jour précédent J-1"
                >
                  <Copy className="w-3 h-3 text-[#00BFFF]" /> Dupliquer J-1
                </button>

                <button
                  onClick={loadPlanningWorkbook}
                  className="bg-gray-50 hover:bg-gray-150 text-gray-855 border border-gray-200 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all flex items-center gap-1 cursor-pointer"
                  title="Réinitialiser ou recharger depuis le cloud"
                >
                  <RotateCcw className="w-3 h-3 text-[#00BFFF]" /> Recharger
                </button>
                <button
                  onClick={savePlanningWorkbook}
                  disabled={saveStatus === 'saving' || isLockedByNiveau2 || isMonthClosedForPlanning}
                  className={`font-extrabold px-3.5 py-1.5 rounded-lg text-[9px] uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm active:translate-y-px ${
                    isLockedByNiveau2 || isMonthClosedForPlanning
                      ? 'bg-gray-200 text-gray-400 border border-gray-250 cursor-not-allowed opacity-60' 
                      : 'bg-[#00BFFF] hover:bg-sky-500 text-white cursor-pointer'
                  }`}
                >
                  <Save className="w-3.5 h-3.5" /> 
                  {saveStatus === 'saving' ? '...' : saveStatus === 'saved' ? 'Enregistré !' : 'Graver'}
                </button>
                {isPlanningSavedInDb && (!validationInfo || validationInfo.status !== 'valide') && !isMonthClosedForPlanning && (
                  <button
                    onClick={validatePlanningWorkbook}
                    disabled={saveStatus === 'saving'}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-3.5 py-1.5 rounded-lg text-[9px] uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-sm active:translate-y-px cursor-pointer"
                    title="Valider officiellement cette planification"
                  >
                    <Check className="w-3.5 h-3.5" /> Valider
                  </button>
                )}
                {validationInfo?.status === 'valide' && (
                  <div className="bg-emerald-50 text-emerald-850 border border-emerald-250 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase flex items-center gap-1.5 shadow-sm select-none">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>
                      ✓ Validée {validationInfo.validatedAt ? (() => {
                        try {
                          return `le ${format(new Date(validationInfo.validatedAt), 'dd/MM/yyyy à HH:mm')}`;
                        } catch {
                          return '';
                        }
                      })() : ''} par {validationInfo.validatedBy}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest animate-pulse">
          Synchronisation du planning avec Firestore...
        </div>
      ) : viewMode === 'sheet' ? (
        <div className="space-y-4">
          
          {/* Signature & Audit Info Badge Bar */}
          {signatureInfo && (
            <div className="mx-1 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[10px] text-gray-500/80 bg-slate-50 border border-slate-200 rounded-lg py-2 px-3 shadow-xs">
              <div className="flex items-center gap-1.5 select-none">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                <span>
                  Fiche initialisée par : <strong className="text-slate-800 font-extrabold">{signatureInfo.savedBy}</strong> {signatureInfo.savedAt ? (() => {
                    try { return `le ${format(new Date(signatureInfo.savedAt), 'dd/MM/yyyy à HH:mm')}`; } catch { return ''; }
                  })() : ''}
                </span>
              </div>
              {signatureInfo.lastModifiedBy && (
                <div className="flex items-center gap-1.5 select-none sm:border-l sm:border-slate-200 sm:pl-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-500" />
                  <span>
                    Dernière modification par : <strong className="text-slate-800 font-extrabold">{signatureInfo.lastModifiedBy}</strong> {signatureInfo.lastModifiedAt ? (() => {
                      try { return `le ${format(new Date(signatureInfo.lastModifiedAt), 'dd/MM/yyyy à HH:mm')}`; } catch { return ''; }
                    })() : ''}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* SPREADSHEET WORKSPACE */}
          <div className="w-full space-y-4 bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
            
            {renderPlanningStatusBanner()}

            {/* Sheet Tabs */}
            <div className="flex flex-wrap items-center justify-center border-b border-gray-250 pb-2.5 gap-2">
              {[
                { 
                  id: 'minage', 
                  label: '🔨 Sheet 1 - Alignement Forage & Minage', 
                  activeClass: 'border-red-500 text-red-600 bg-gradient-to-b from-red-50/70 via-white to-white shadow-[0_-4px_16px_rgba(239,68,68,0.18)] border-t-2', 
                  inactiveClass: 'text-gray-400 hover:text-red-500 hover:bg-red-50/5 border-t-2 border-transparent',
                  glowDot: 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.85)]'
                },
                { 
                  id: 'deblayage', 
                  label: '🚜 Sheet 2 - Programme Déblayage & Vol', 
                  activeClass: 'border-[#00BFFF] text-sky-600 bg-gradient-to-b from-sky-50/70 via-white to-white shadow-[0_-4px_16px_rgba(0,191,255,0.22)] border-t-2', 
                  inactiveClass: 'text-gray-400 hover:text-sky-400 hover:bg-sky-50/5 border-t-2 border-transparent',
                  glowDot: 'bg-[#00BFFF] shadow-[0_0_10px_rgba(0,191,255,0.85)]'
                },
                { 
                  id: 'extraction', 
                  label: '🚃 Sheet 3 - Objectifs Extraction', 
                  activeClass: 'border-emerald-500 text-emerald-600 bg-gradient-to-b from-emerald-50/70 via-white to-white shadow-[0_-4px_16px_rgba(16,185,129,0.18)] border-t-2', 
                  inactiveClass: 'text-gray-400 hover:text-emerald-500 hover:bg-emerald-50/5 border-t-2 border-transparent',
                  glowDot: 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.85)]'
                },
                { 
                  id: 'maintenance', 
                  label: '🔧 Sheet 4 - Brigade Maintenance Programmée', 
                  activeClass: 'border-purple-500 text-purple-600 bg-gradient-to-b from-purple-50/70 via-white to-white shadow-[0_-4px_16px_rgba(168,85,247,0.18)] border-t-2', 
                  inactiveClass: 'text-gray-400 hover:text-purple-500 hover:bg-purple-50/5 border-t-2 border-transparent',
                  glowDot: 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.85)]'
                },
              ].map(sheet => {
                const isActive = activeSheetTab === sheet.id;
                return (
                  <button
                    key={sheet.id}
                    onClick={() => setActiveSheetTab(sheet.id as any)}
                    className={`px-4.5 py-2.5 text-[10px] rounded-t-xl uppercase tracking-wider transition-all duration-300 border-r border-gray-100 flex items-center gap-2.5 select-none cursor-pointer ${
                      isActive 
                        ? `${sheet.activeClass} font-black` 
                        : `${sheet.inactiveClass} font-semibold`
                    }`}
                  >
                    <span>{sheet.label}</span>
                    <span className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                      isActive ? `${sheet.glowDot} animate-pulse scale-110` : 'bg-gray-300/40'
                    }`} />
                  </button>
                );
              })}
            </div>

            <fieldset key={`${selectedDate}-${isLockedByNiveau2}-${isMonthClosedForPlanning}`} disabled={isLockedByNiveau2 || isMonthClosedForPlanning} className={(isLockedByNiveau2 || isMonthClosedForPlanning) ? "pointer-events-none opacity-90 select-none cursor-not-allowed" : ""}>
            {/* SHEET 1: BLASTING & MINAGE INTERACTIVE EXCEL GRID (3 SHIFTS VERTICALLY STACKED) */}
            {activeSheetTab === 'minage' && (
              <div className="space-y-8">
                {(() => {
                  let globalIdxCounter = 0;
                  const posts: ('Poste 1' | 'Poste 2' | 'Poste 3')[] = ['Poste 1', 'Poste 2', 'Poste 3'];
                  const postHoursLabels: Record<string, string> = {
                    'Poste 1': '07h - 14h',
                    'Poste 2': '15h - 22h',
                    'Poste 3': '23h - 06h'
                  };

                  return posts.map(p => {
                    const rowsForPost = minageRowsByPost[p] || [];
                    const SECTOR_ORDER = ['Imiter 1', 'Imiter 2', 'Imiter Est', 'Imiter Est Bure', 'Autres / Non classés'];

                    return (
                      <div key={p} className="border border-gray-200 bg-white p-4 shadow-sm rounded-xl">
                        {/* Shifty/Post block banner */}
                        <div className="bg-gradient-to-r from-transparent via-slate-950 to-transparent p-3.5 mb-4 flex items-center justify-center select-none rounded-lg">
                          <h4 className="text-[13px] font-black uppercase text-white tracking-[0.25em] flex items-center gap-2.5 drop-shadow-[0_0_8px_rgba(255,255,255,0.9)]">
                            🏭 {p} <span className="text-slate-350 font-semibold tracking-normal text-[11px]">({postHoursLabels[p]})</span>
                          </h4>
                        </div>

                        <div className="overflow-x-auto rounded-lg border border-gray-200">
                          <table className="w-full text-left border-collapse text-[11px]">
                            <thead>
                              <tr className="bg-slate-50 text-gray-700 text-[9px] font-black uppercase tracking-wider border-b border-gray-200 sticky top-0 z-10 select-none">
                                <th className="p-2 border-r border-gray-200 text-center w-8 select-none bg-slate-100/50">#</th>
                                <th className="p-2 min-w-[124px] bg-gradient-to-r from-sky-400/25 to-rose-500/20 text-sky-950 font-black">Chantier</th>
                                <th className="p-2 min-w-[144px] bg-gradient-to-r from-rose-500/20 to-sky-400/20 text-red-950 font-black">Mineur (Matricule / Nom)</th>
                                <th className="p-2 min-w-[144px] bg-gradient-to-r from-sky-400/20 to-red-600/15 text-sky-950 font-black">Aide-Mineur</th>
                                <th className="p-2 border-r border-gray-200 w-20 text-center bg-gradient-to-r from-red-600/15 to-transparent text-red-950 font-black">Section</th>
                                <th className="p-2 border-r border-gray-200 w-24 text-center bg-sky-50/35">Type Barre</th>
                                <th className="p-2 border-r border-gray-200 w-16 text-center bg-sky-50/35">Volées prévues</th>
                                <th className="p-2 border-r border-gray-200 w-20 text-center bg-red-50/35">Mètres prévus</th>
                                <th className="p-2 border-r border-gray-200 w-16 text-center bg-sky-50/35">Trous prévus</th>
                                <th className="p-2 border-r border-gray-200 w-16 text-center bg-red-50/35">ANFO (kg)</th>
                                <th className="p-2 border-r border-gray-200 w-16 text-center bg-sky-50/35">Tovex (kg)</th>
                                <th className="p-2 text-center w-16 bg-red-50/35">Amorces</th>

                              </tr>
                            </thead>
                            <tbody>
                              {SECTOR_ORDER.map(sec => {
                                const sectorRowsWithIdx = rowsForPost
                                  .map((row, idx) => ({ row, idx }))
                                  .filter(item => (item.row.sectorGroup || 'Autres / Non classés') === sec);

                                if (sectorRowsWithIdx.length === 0) return null;

                                return (
                                  <React.Fragment key={sec}>
                                    {/* Sector Header Badge Row */}
                                    <tr className="bg-gray-50/80 border-y border-gray-200 select-none">
                                      <td colSpan={12} className="py-2.5 px-3">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                          <div className="flex flex-wrap items-center gap-2">
                                            {(() => {
                                              const style = getSectorBadgeStyles(sec);
                                              return (
                                                <span className={`inline-flex items-center gap-2 px-3 py-1 text-[10px] font-extrabold uppercase rounded-lg ${style.bg}`}>
                                                  <span className={`w-2 h-2 rounded-full ${style.dot} animate-pulse`} />
                                                  {sec === 'Autres / Non classés' ? 'Autres chantiers non classés' : sec}
                                                </span>
                                              );
                                            })()}
                                          </div>
                                          
                                          <div className="flex flex-wrap items-center gap-2 shrink-0">
                                            {/* Button inline in header for high compactness */}
                                            <button
                                              type="button"
                                              onClick={() => addRowToMinageSector(p, sec)}
                                              className="text-[9.5px] font-black text-white hover:bg-sky-600 bg-[#00BFFF] border border-transparent px-2.5 py-1.5 rounded transition-all cursor-pointer flex items-center gap-1 uppercase tracking-wider shadow-xs"
                                              title={`Ajouter un chantier de production à ${sec}`}
                                            >
                                              + Ajouter Ligne
                                            </button>

                                            {/* Sector Chief Selection */}
                                            {sec !== 'Autres / Non classés' && (
                                              <div className="flex items-center gap-2 bg-white border border-gray-200 px-3 py-1 rounded-lg shadow-sm">
                                                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">
                                                  👨‍✈️ {p === 'Poste 1' ? 'Responsable de secteur' : 'Chef de poste'} :
                                                </span>
                                                <div className="w-56 text-black font-semibold text-[10.5px]">
                                                  <MatriculeAutocomplete
                                                    value={sectorChiefs[p]?.[sec as 'Imiter 2' | 'Imiter 1' | 'Imiter Est'] || ''}
                                                    onChange={(matricule) => {
                                                      setSectorChiefs(prev => ({
                                                        ...prev,
                                                        [p]: {
                                                          ...(prev[p] || {}),
                                                          [sec]: matricule
                                                        }
                                                      }));
                                                    }}
                                                    employees={employees}
                                                    sector={sec !== 'Autres / Non classés' ? sec : undefined}
                                                    fonctions={['CHEF']}
                                                    post={p}
                                                    placeholder="Saisir Matricule Chef..."
                                                  />
                                                </div>
                                              </div>
                                            )}

                                            {/* Sector Boutefeu Selection */}
                                            {sec !== 'Autres / Non classés' && (
                                              p !== 'Poste 3' ? (
                                                <div className="flex items-center gap-2 bg-amber-50/75 border border-amber-200 px-3 py-1 rounded-lg shadow-sm">
                                                  <span className="text-[9px] font-black text-amber-850 uppercase tracking-widest flex items-center gap-1 select-none">
                                                    💣 Boutefeu :
                                                  </span>
                                                  <div className="w-56 text-black font-semibold text-[10.5px]">
                                                    <MatriculeAutocomplete
                                                      value={sectorBoutefeus[p]?.[sec as 'Imiter 2' | 'Imiter 1' | 'Imiter Est'] || ''}
                                                      onChange={(matricule) => {
                                                        setSectorBoutefeus(prev => ({
                                                          ...prev,
                                                          [p]: {
                                                            ...(prev[p] || {}),
                                                            [sec]: matricule
                                                          }
                                                        }));
                                                      }}
                                                      employees={employees}
                                                      fonctions={['BOUTEFEU']}
                                                      post={p}
                                                      placeholder="Saisir Boutefeu..."
                                                    />
                                                  </div>
                                                </div>
                                              ) : (
                                                <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 px-3 py-1 rounded-lg text-slate-500 text-[9px] font-black uppercase tracking-widest select-none">
                                                  💤 Hors poste Boutefeu
                                                </div>
                                              )
                                            )}
                                          </div>
                                        </div>
                                      </td>
                                    </tr>

                                    {/* Group matching rows */}
                                    {sectorRowsWithIdx.map(({ row, idx: flatIdx }, sIdx) => {
                                      const globalIdx = globalIdxCounter++;
                                      const options = chantiers.filter(c => sec === 'Autres / Non classés' || isSectorMatching(c.sector, sec));
                                      const hasChantier = options.some(o => o.id === row.chantierId);
                                      const fallbackChantier = row.chantierId && !hasChantier ? chantiers.find(c => c.id === row.chantierId) : null;

                                      // Evaluate row span dynamically for miner, assistant, rounds, and meters columns
                                      const isChild = !!(row.remarks && row.remarks.includes('(Volée'));
                                      let rowSpan = 1;
                                      if (!isChild) {
                                        let nextIdx = sIdx + 1;
                                        while (
                                          nextIdx < sectorRowsWithIdx.length &&
                                          sectorRowsWithIdx[nextIdx].row.remarks &&
                                          sectorRowsWithIdx[nextIdx].row.remarks.includes('(Volée')
                                        ) {
                                          rowSpan++;
                                          nextIdx++;
                                        }
                                      }

                                      return (
                                        <tr 
                                          key={flatIdx}
                                          className="border-b border-gray-200 hover:bg-sky-50/20 transition-colors"
                                        >
                                          {/* Line Index & Delete Action */}
                                          <td className="p-1 px-1.5 border-r border-gray-200 text-center text-[10.5px] text-gray-500 font-mono w-8 select-none relative group bg-gray-50/50">
                                            <span className="group-hover:opacity-0 transition-opacity">{flatIdx + 1}</span>
                                            {isMinageRowRemovable(p, flatIdx) && (
                                              <button
                                                type="button"
                                                onClick={() => deleteMinageRowAt(p, flatIdx)}
                                                className="absolute inset-x-0.5 top-0.5 bottom-0.5 bg-red-55 hover:bg-red-100 text-red-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded cursor-pointer text-[10.5px] font-black border-none outline-none"
                                                title="Retirer cette ligne"
                                              >
                                                🗑️
                                              </button>
                                            )}
                                          </td>

                                          {/* Chantier dropdown selection */}
                                          <td data-row={globalIdx} data-col={0} className="p-1 border-r border-gray-200 min-w-[124px] focus-within:ring-2 focus-within:ring-[#00BFFF]/50 focus-within:ring-inset focus-within:bg-sky-50/40">
                                            <select
                                              value={row.chantierId}
                                              onChange={e => updateMinageCell(p, flatIdx, 'chantierId', e.target.value)}
                                              onKeyDown={makeExcelKeyHandler(globalIdx, 0)}
                                              className="w-full bg-transparent border-0 font-extrabold p-0.5 text-[11px] uppercase outline-none text-gray-800"
                                            >
                                              <option value="">(Vide)</option>
                                              {fallbackChantier && (
                                                <option value={fallbackChantier.id}>
                                                  {fallbackChantier.name || fallbackChantier.id} (Hors-sec)
                                                </option>
                                              )}
                                              {options.map(c => (
                                                <option key={c.id} value={c.id}>{c.name || c.id}</option>
                                              ))}
                                            </select>
                                          </td>

                                          {/* Mineur */}
                                          {!isChild && (
                                            <td rowSpan={rowSpan} data-row={globalIdx} data-col={1} className="p-0.5 border-r border-gray-200 min-w-[180px] focus-within:ring-2 focus-within:ring-[#00BFFF]/50 focus-within:ring-inset focus-within:bg-sky-50/40 align-middle">
                                              <MatriculeAutocomplete
                                                value={row.minerMatricule}
                                                onChange={(matricule) => updateMinageCell(p, flatIdx, 'minerMatricule', matricule)}
                                                employees={employees}
                                                sector={sec !== 'Autres / Non classés' ? sec : undefined}
                                                fonctions={['MINEUR']}
                                                alternativeFonctions={['AIDE_MINEUR']}
                                                post={p}
                                                placeholder="M-..."
                                                onKeyDown={makeExcelKeyHandler(globalIdx, 1)}
                                              />
                                            </td>
                                          )}

                                          {/* Aide-Mineur */}
                                          {!isChild && (
                                            <td rowSpan={rowSpan} data-row={globalIdx} data-col={2} className="p-0.5 border-r border-gray-200 min-w-[180px] focus-within:ring-2 focus-within:ring-[#00BFFF]/50 focus-within:ring-inset focus-within:bg-sky-50/40 align-middle">
                                              <MatriculeAutocomplete
                                                value={row.assistantMatricule}
                                                onChange={(matricule) => updateMinageCell(p, flatIdx, 'assistantMatricule', matricule)}
                                                employees={employees}
                                                sector={sec !== 'Autres / Non classés' ? sec : undefined}
                                                fonctions={['AIDE_MINEUR']}
                                                post={p}
                                                placeholder="M-..."
                                                onKeyDown={makeExcelKeyHandler(globalIdx, 2)}
                                              />
                                            </td>
                                          )}

                                          {/* Section */}
                                          <td data-row={globalIdx} data-col={3} className="p-1 border-r border-gray-200 w-20 text-center focus-within:ring-2 focus-within:ring-[#00BFFF]/50 focus-within:ring-inset focus-within:bg-sky-50/40">
                                            <select
                                              value={row.gallerySize}
                                              onChange={e => updateMinageCell(p, flatIdx, 'gallerySize', Number(e.target.value))}
                                              onKeyDown={makeExcelKeyHandler(globalIdx, 3)}
                                              className="w-full bg-transparent border-none text-center outline-none font-bold text-gray-800 text-[11px]"
                                            >
                                              <option value={9}>9 m²</option>
                                              <option value={12}>12 m²</option>
                                            </select>
                                          </td>

                                          {/* Type Barre */}
                                          {!isChild && (
                                            <td rowSpan={rowSpan} className="p-1 border-r border-gray-200 w-24 text-center focus-within:ring-2 focus-within:ring-[#00BFFF]/50 focus-within:ring-inset focus-within:bg-sky-50/40 align-middle">
                                              <select
                                                value={row.barType || '1.8m'}
                                                onChange={e => updateMinageCell(p, flatIdx, 'barType', e.target.value)}
                                                className="w-full bg-transparent border-none text-center outline-none font-bold text-gray-800 text-[11px]"
                                              >
                                                <option value="1.8m">1.8m (1.7)</option>
                                                <option value="2.4m">2.4m (2.3)</option>
                                              </select>
                                            </td>
                                          )}

                                          {/* Volées prévues (Now editable!) */}
                                          {!isChild && (
                                            <td rowSpan={rowSpan} data-row={globalIdx} data-col={4} className="p-1 border-r border-gray-200 w-16 text-center focus-within:ring-2 focus-within:ring-[#00BFFF]/50 focus-within:ring-inset focus-within:bg-sky-50/40 align-middle">
                                              <input
                                                type="number"
                                                min={1}
                                                max={3}
                                                value={row.plannedRounds || 1}
                                                onChange={e => updateMinageCell(p, flatIdx, 'plannedRounds', Number(e.target.value))}
                                                onKeyDown={makeExcelKeyHandler(globalIdx, 4)}
                                                className="w-full bg-transparent text-center font-black text-[11px] outline-none border-0 text-gray-850"
                                              />
                                            </td>
                                          )}

                                          {/* Mètres prévus */}
                                          {!isChild && (
                                            <td rowSpan={rowSpan} className="p-1 border-r border-gray-200 w-20 text-center font-mono font-extrabold text-blue-600 bg-gray-50/80 select-none align-middle animate-fade-in">
                                              {row.meterage.toFixed(1)} m
                                            </td>
                                          )}

                                          {/* Trous prévus */}
                                          <td data-row={globalIdx} data-col={5} className="p-1 border-r border-gray-200 w-16 text-center relative group/trous focus-within:ring-2 focus-within:ring-[#00BFFF]/50 focus-within:ring-inset focus-within:bg-sky-50/40">
                                            {row.explosivesManualOverride ? (
                                              <div className="flex items-center justify-center gap-1">
                                                <input
                                                  type="number"
                                                  value={row.plannedHoles}
                                                  onChange={e => updateMinageCell(p, flatIdx, 'plannedHoles', Number(e.target.value))}
                                                  onKeyDown={makeExcelKeyHandler(globalIdx, 5)}
                                                  className="w-full bg-transparent text-center font-mono font-bold text-[11px] outline-none border-none py-0.5 text-red-650"
                                                />
                                                <button
                                                  type="button"
                                                  onClick={() => handleToggleManualOverride(p, flatIdx)}
                                                  className="text-red-500 font-extrabold cursor-pointer hover:scale-125 transition-transform"
                                                  title="Clic pour repasser au calcul automatique"
                                                >
                                                  *
                                                </button>
                                              </div>
                                            ) : (
                                              <div
                                                onDoubleClick={() => handleToggleManualOverride(p, flatIdx)}
                                                className="cursor-pointer font-bold text-[11px] text-center select-none py-1 hover:bg-sky-50 w-full text-slate-800"
                                                title="Double-clic pour modifier manuellement"
                                              >
                                                {row.plannedHoles}
                                              </div>
                                            )}

                                            {/* High-fidelity professional tooltip popover */}
                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover/trous:block w-72 bg-slate-950 text-slate-100 text-[10.5px] p-3 rounded-xl shadow-2xl z-50 border border-slate-800 pointer-events-none transition-all duration-200 text-left">
                                              <div className="font-extrabold text-[#00BFFF] uppercase tracking-wider text-[9px] mb-1">
                                                ℹ️ Spécifications de Tir & Forage
                                              </div>
                                              <p className="font-semibold leading-relaxed text-slate-250">
                                                {row.gallerySize === 12 ? (
                                                  <>Le gabarit de foration théorique pour <strong className="text-white">12m²</strong> est de <strong className="text-white font-black">38 trous</strong>, mais seuls <strong className="text-[#00BFFF] font-black">32 trous sont chargés</strong> (ce qui explique pourquoi <strong className="text-white font-black">32</strong> s\'affiche pour le chargement et les amorces).</>
                                                ) : (
                                                  <>Le gabarit de foration théorique pour <strong className="text-white">9m²</strong> est de <strong className="text-white font-black">28 trous</strong>, mais seuls <strong className="text-[#00BFFF] font-black">26 trous sont chargés</strong> (ce qui explique pourquoi <strong className="text-white font-black">26</strong> s\'affiche pour le chargement et les amorces).</>
                                                )}
                                              </p>
                                              <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-slate-950"></div>
                                            </div>
                                          </td>

                                          {/* ANFO */}
                                          <td data-row={globalIdx} data-col={6} className="p-1 border-r border-gray-200 w-16 text-center focus-within:ring-2 focus-within:ring-[#00BFFF]/50 focus-within:ring-inset focus-within:bg-sky-50/40">
                                            {row.explosivesManualOverride ? (
                                              <div className="flex items-center justify-center gap-1">
                                                <input
                                                  type="number"
                                                  value={row.anfo}
                                                  onChange={e => updateMinageCell(p, flatIdx, 'anfo', Number(e.target.value))}
                                                  onKeyDown={makeExcelKeyHandler(globalIdx, 6)}
                                                  className="w-full bg-transparent text-center font-mono font-bold text-[11px] outline-none border-none py-0.5 text-red-650"
                                                />
                                                <button
                                                  type="button"
                                                  onClick={() => handleToggleManualOverride(p, flatIdx)}
                                                  className="text-red-500 font-extrabold cursor-pointer hover:scale-125 transition-transform"
                                                  title="Clic pour repasser au calcul automatique"
                                                >
                                                  *
                                                </button>
                                              </div>
                                            ) : (
                                              <div
                                                onDoubleClick={() => handleToggleManualOverride(p, flatIdx)}
                                                className="cursor-pointer font-bold text-[11px] text-center select-none py-1 hover:bg-sky-50 w-full text-slate-800"
                                                title="Double-clic pour modifier manuellement"
                                              >
                                                {row.anfo}
                                              </div>
                                            )}
                                          </td>

                                          {/* Tovex */}
                                          <td data-row={globalIdx} data-col={7} className="p-1 border-r border-gray-200 w-16 text-center focus-within:ring-2 focus-within:ring-[#00BFFF]/50 focus-within:ring-inset focus-within:bg-sky-50/40">
                                            {row.explosivesManualOverride ? (
                                              <div className="flex items-center justify-center gap-1">
                                                <input
                                                  type="number"
                                                  step="0.5"
                                                  value={row.tovex}
                                                  onChange={e => updateMinageCell(p, flatIdx, 'tovex', Number(e.target.value))}
                                                  onKeyDown={makeExcelKeyHandler(globalIdx, 7)}
                                                  className="w-full bg-transparent text-center font-mono font-bold text-[11px] outline-none border-none py-0.5 text-red-650"
                                                />
                                                <button
                                                  type="button"
                                                  onClick={() => handleToggleManualOverride(p, flatIdx)}
                                                  className="text-red-500 font-extrabold cursor-pointer hover:scale-125 transition-transform"
                                                  title="Clic pour repasser au calcul automatique"
                                                >
                                                  *
                                                </button>
                                              </div>
                                            ) : (
                                              <div
                                                onDoubleClick={() => handleToggleManualOverride(p, flatIdx)}
                                                className="cursor-pointer font-bold text-[11px] text-center select-none py-1 hover:bg-sky-50 w-full text-slate-800"
                                                title="Double-clic pour modifier manuellement"
                                              >
                                                {row.tovex.toFixed(1)}
                                              </div>
                                            )}
                                          </td>

                                          {/* Amorces */}
                                          <td data-row={globalIdx} data-col={8} className="p-1 border-r border-gray-200 w-16 text-center focus-within:ring-2 focus-within:ring-[#00BFFF]/50 focus-within:ring-inset focus-within:bg-sky-50/40">
                                            {row.explosivesManualOverride ? (
                                              <div className="flex items-center justify-center gap-1">
                                                <input
                                                  type="number"
                                                  value={row.ammorces}
                                                  onChange={e => updateMinageCell(p, flatIdx, 'ammorces', Number(e.target.value))}
                                                  onKeyDown={makeExcelKeyHandler(globalIdx, 8)}
                                                  className="w-full bg-transparent text-center font-mono font-bold text-[11px] outline-none border-none py-0.5 text-red-655"
                                                />
                                                <button
                                                  type="button"
                                                  onClick={() => handleToggleManualOverride(p, flatIdx)}
                                                  className="text-red-500 font-extrabold cursor-pointer hover:scale-125 transition-transform"
                                                  title="Clic pour repasser au calcul automatique"
                                                >
                                                  *
                                                </button>
                                              </div>
                                            ) : (
                                              <div
                                                onDoubleClick={() => handleToggleManualOverride(p, flatIdx)}
                                                className="cursor-pointer font-bold text-[11px] text-center select-none py-1 hover:bg-sky-50 w-full text-slate-800"
                                                title="Double-clic pour modifier manuellement"
                                              >
                                                {row.ammorces}
                                              </div>
                                            )}
                                          </td>

                                          {/* Remarks */}
                                          <td className="hidden">
                                            <input
                                              type="text"

                                              value={row.remarks || ''}
                                              onChange={e => updateMinageCell(p, flatIdx, 'remarks', e.target.value)}
                                              onKeyDown={makeExcelKeyHandler(globalIdx, 9)}
                                              className="w-full bg-transparent border-0 font-semibold p-0 text-[10.5px] outline-none uppercase"
                                            />
                                          </td>
                                        </tr>
                                      );
                                    })}

                                    {/* Row additions footer removed - moved inline in header */}
                                  </React.Fragment>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        {/* Dynamic Explosives Summary Bento Cards Per Post */}
                        <div className="mt-4 border-t border-dashed border-gray-200 pt-3 flex flex-wrap items-center justify-between gap-3 bg-slate-50/50 p-3.5 rounded-lg select-none">
                          <span className="text-[10.5px] font-black uppercase text-slate-600 tracking-wider flex items-center gap-1.5">
                            🧨 Bilan Estimé des Explosifs ({p}) :
                          </span>
                          <div className="flex flex-wrap items-center gap-4">
                            <div className="flex items-center gap-1.5 bg-white border border-gray-200 py-1 px-2.5 rounded shadow-xs">
                              <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider">ANFO</span>
                              <strong className="text-xs font-black text-slate-800">{rowsForPost.reduce((sum, r) => sum + (Number(r.anfo) || 0), 0)} kg</strong>
                            </div>
                            <div className="flex items-center gap-1.5 bg-white border border-gray-200 py-1 px-2.5 rounded shadow-xs">
                              <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider">Tovex</span>
                              <strong className="text-xs font-black text-[#8B0000]">{rowsForPost.reduce((sum, r) => sum + (Number(r.tovex) || 0), 0).toFixed(1)} sauc.</strong>
                            </div>
                            <div className="flex items-center gap-1.5 bg-white border border-gray-200 py-1 px-2.5 rounded shadow-xs">
                              <span className="text-[8.5px] font-bold text-slate-400 uppercase tracking-wider">Amorces / Déto</span>
                              <strong className="text-xs font-black text-[#00BFFF]">{rowsForPost.reduce((sum, r) => sum + (Number(r.ammorces) || 0), 0)} u.</strong>
                            </div>
                          </div>
                        </div>

                      </div>
                    );
                  });
                })()}
              </div>
            )}

            {/* SHEET 2: LOADER DEBLAYAGE INTERACTIVE EXCEL GRID (3 SHIFTS VERTICALLY STACKED) */}
            {activeSheetTab === 'deblayage' && (
              <div className="space-y-8">
                {(() => {
                  let globalIdxCounter = 0;
                  const posts: ('Poste 1' | 'Poste 2' | 'Poste 3')[] = ['Poste 1', 'Poste 2', 'Poste 3'];
                  const postHoursLabels: Record<string, string> = {
                    'Poste 1': '07h - 14h',
                    'Poste 2': '15h - 22h',
                    'Poste 3': '23h - 06h'
                  };

                  return posts.map(p => {
                    const rowsForPost = deblayageRowsByPost[p] || [];
                    const SECTOR_ORDER = ['Imiter 1', 'Imiter 2', 'Imiter Est', 'Imiter Est Bure', 'Autres / Non classés'];

                    return (
                      <div key={p} className="border border-gray-200 bg-white p-4 shadow-sm rounded-xl">
                        {/* Shifty/Post block banner */}
                        <div className="bg-gradient-to-r from-transparent via-slate-950 to-transparent p-3.5 mb-4 flex items-center justify-center select-none rounded-lg">
                          <h4 className="text-[13px] font-black uppercase text-white tracking-[0.25em] flex items-center gap-2.5 drop-shadow-[0_0_8px_rgba(255,255,255,0.9)]">
                            🚜 {p} <span className="text-slate-350 font-semibold tracking-normal text-[11px]">({postHoursLabels[p]})</span>
                          </h4>
                        </div>

                        <div className="overflow-x-auto rounded-lg border border-gray-200">
                          <table className="w-full text-left border-collapse text-[11px]">
                            <thead>
                              <tr className="bg-slate-50 text-gray-700 text-[9px] font-black uppercase tracking-wider border-b border-gray-200 sticky top-0 z-10 select-none">
                                <th className="p-2 border-r border-gray-200 text-center w-8 select-none bg-slate-100/50">#</th>
                                <th className="p-2 min-w-[124px] bg-gradient-to-r from-sky-400/25 to-rose-500/20 text-sky-950 font-black">Chantier de nettoyage</th>
                                <th className="p-2 min-w-[160px] bg-gradient-to-r from-rose-500/20 to-sky-400/20 text-red-950 font-black">Conducteur engin (Matricule / Nom)</th>
                                <th className="p-2 border-r border-gray-200 min-w-[140px] bg-gradient-to-r from-sky-400/20 to-transparent text-sky-950 font-black">Machine / Engin</th>
                                <th className="p-2 border-r border-gray-200 w-20 text-center bg-sky-50/35">Godets planifiés</th>
                                <th className="p-2 border-r border-gray-200 w-24 text-center bg-red-50/35">Volume estimé (m³)</th>
                                <th className="p-2 text-center w-24 bg-sky-50/35">Heures travail</th>

                              </tr>
                            </thead>
                            <tbody>
                              {SECTOR_ORDER.map(sec => {
                                const sectorRowsWithIdx = rowsForPost
                                  .map((row, idx) => ({ row, idx }))
                                  .filter(item => (item.row.sectorGroup || 'Autres / Non classés') === sec);

                                if (sectorRowsWithIdx.length === 0) return null;

                                return (
                                  <React.Fragment key={sec}>
                                    {/* Group Sector Header */}
                                    <tr className="bg-gray-50/80 border-y border-gray-200 select-none">
                                      <td colSpan={7} className="py-2 px-3">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                                          <div className="flex flex-wrap items-center gap-2">
                                            {(() => {
                                              const style = getSectorBadgeStyles(sec);
                                              return (
                                                <span className={`inline-flex items-center gap-2 px-3 py-1 text-[10px] font-extrabold uppercase rounded-lg ${style.bg}`}>
                                                  <span className={`w-2 h-2 rounded-full ${style.dot} animate-pulse`} />
                                                  {sec === 'Autres / Non classés' ? 'Autres chantiers non classés' : sec}
                                                </span>
                                              );
                                            })()}
                                          </div>
                                          
                                          <div className="flex items-center gap-2 shadow-sm rounded-md bg-white p-0.5">
                                            {/* Button inline in header for high compactness */}
                                            <button
                                              type="button"
                                              onClick={() => addRowToDeblayageSector(p, sec)}
                                              className="text-[9px] font-black text-white hover:bg-sky-600 bg-[#00BFFF] border border-transparent px-2.5 py-1.5 rounded transition-all cursor-pointer flex items-center gap-1 uppercase tracking-wider"
                                              title={`Ajouter un chantier de nettoyage à ${sec}`}
                                            >
                                              + Ajouter Ligne
                                            </button>

                                            <button
                                              type="button"
                                              onClick={() => addStockRowToDeblayageSector(p, sec)}
                                              className="text-[9px] font-black text-amber-950 hover:bg-amber-200 bg-amber-100 border border-amber-250 px-2.5 py-1.5 rounded transition-all cursor-pointer flex items-center gap-1 uppercase tracking-wider"
                                              title={`Ajouter un déblayage de stock à ${sec}`}
                                            >
                                              📦 + Stock Manuel
                                            </button>
                                          </div>
                                        </div>
                                      </td>
                                    </tr>

                                    {/* Sector matching rows */}
                                    {sectorRowsWithIdx.map(({ row, idx: flatIdx }) => {
                                      const globalIdx = globalIdxCounter++;
                                      const options = chantiers.filter(c => sec === 'Autres / Non classés' || isSectorMatching(c.sector, sec));
                                      const hasChantier = options.some(o => o.id === row.chantierId);
                                      const fallbackChantier = row.chantierId && !hasChantier ? chantiers.find(c => c.id === row.chantierId) : null;

                                      return (
                                        <tr 
                                          key={flatIdx}
                                          className="border-b border-gray-200 hover:bg-sky-50/20 transition-colors"
                                        >
                                          {/* Line Index & Trash */}
                                          <td className="p-1 px-1.5 border-r border-gray-200 text-center text-[10.5px] text-gray-500 font-mono w-8 select-none relative group bg-gray-50/50">
                                            <span className="group-hover:opacity-0 transition-opacity">{flatIdx + 1}</span>
                                            {isDeblayageRowRemovable(p, flatIdx) && (
                                              <button
                                                type="button"
                                                onClick={() => deleteDeblayageRowAt(p, flatIdx)}
                                                className="absolute inset-x-0.5 top-0.5 bottom-0.5 bg-red-100 hover:bg-red-200 text-red-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded cursor-pointer text-[10.5px] font-black border-none outline-none"
                                                title="Retirer cette ligne"
                                              >
                                                🗑️
                                              </button>
                                            )}
                                          </td>

                                          {/* Chantier dropdown selection */}
                                          <td data-row={globalIdx} data-col={0} className="p-1 border-r border-gray-200 min-w-[124px] focus-within:ring-2 focus-within:ring-[#00BFFF]/50 focus-within:ring-inset focus-within:bg-sky-50/40">
                                            {row.chantierId?.startsWith('stock_') ? (
                                              <div className="flex items-center gap-1.5 w-full">
                                                <button
                                                  type="button"
                                                  onClick={() => updateDeblayageCell(p, flatIdx, 'chantierId', '')}
                                                  className="text-[8.5px] bg-amber-100 hover:bg-amber-200 border border-amber-300 text-amber-900 font-extrabold px-1.5 py-0.5 rounded uppercase shrink-0 transition-all cursor-pointer select-none"
                                                  title="Revenir à un chantier standard"
                                                >
                                                  STOCK ✕
                                                </button>
                                                <input
                                                  type="text"
                                                  value={row.chantierId.replace('stock_', '')}
                                                  onChange={e => updateDeblayageCell(p, flatIdx, 'chantierId', 'stock_' + e.target.value)}
                                                  className="w-full bg-transparent font-extrabold p-0.5 text-[11px] uppercase outline-none text-amber-900 border-none"
                                                  placeholder="Nom du stock..."
                                                />
                                              </div>
                                            ) : (
                                              <select
                                                value={row.chantierId}
                                                onChange={e => updateDeblayageCell(p, flatIdx, 'chantierId', e.target.value)}
                                                onKeyDown={makeExcelKeyHandler(globalIdx, 0)}
                                                className="w-full bg-transparent border-0 font-extrabold p-0.5 text-[11px] uppercase outline-none text-gray-800"
                                              >
                                                <option value="">(Vide)</option>
                                                <option value="stock_NOUVEAU STOCK" className="text-amber-800 font-bold bg-amber-50">📦 + NOUVEAU STOCK</option>
                                                {fallbackChantier && (
                                                  <option value={fallbackChantier.id}>
                                                    {fallbackChantier.name || fallbackChantier.id} (Hors-sec)
                                                  </option>
                                                )}
                                                {options.map(c => (
                                                  <option key={c.id} value={c.id}>{c.name || c.id}</option>
                                                ))}
                                              </select>
                                            )}
                                          </td>

                                          {/* Driver */}
                                          <td data-row={globalIdx} data-col={1} className="p-0.5 border-r border-gray-200 min-w-[160px] focus-within:ring-2 focus-within:ring-[#00BFFF]/50 focus-within:ring-inset focus-within:bg-sky-50/40">
                                            <MatriculeAutocomplete
                                              value={row.driverMatricule}
                                              onChange={(matricule) => updateDeblayageCell(p, flatIdx, 'driverMatricule', matricule)}
                                              employees={employees}
                                              sector={sec !== 'Autres / Non classés' ? sec : undefined}
                                              fonctions={['CONDUCTEUR_ENGIN']}
                                              post={p}
                                              placeholder="M-..."
                                              onKeyDown={makeExcelKeyHandler(globalIdx, 1)}
                                            />
                                          </td>

                                          {/* Engine */}
                                          <td data-row={globalIdx} data-col={2} className="p-1 border-r border-gray-200 min-w-[140px] focus-within:ring-2 focus-within:ring-[#00BFFF]/50 focus-within:ring-inset focus-within:bg-sky-50/40">
                                            <select
                                              value={row.engineId}
                                              onChange={e => updateDeblayageCell(p, flatIdx, 'engineId', e.target.value)}
                                              onKeyDown={makeExcelKeyHandler(globalIdx, 2)}
                                              className="w-full bg-transparent border-0 font-bold text-[11px] uppercase outline-none text-gray-800"
                                            >
                                              <option value="">(Machine LHD)</option>
                                              {platformSettings.engines.map(eng => (
                                                <option key={eng} value={eng}>
                                                  {eng}
                                                </option>
                                              ))}
                                            </select>
                                          </td>

                                          {/* Godets */}
                                          <td data-row={globalIdx} data-col={3} className="p-1 border-r border-gray-200 w-20 text-center focus-within:ring-2 focus-within:ring-[#00BFFF]/50 focus-within:ring-inset focus-within:bg-sky-50/40">
                                            <input
                                              type="number"
                                              value={row.godets === 0 ? '' : row.godets}
                                              placeholder="0"
                                              onChange={e => updateDeblayageCell(p, flatIdx, 'godets', Number(e.target.value))}
                                              onKeyDown={makeExcelKeyHandler(globalIdx, 3)}
                                              className="w-full bg-transparent text-center font-bold text-[11px] outline-none border-0 text-gray-800"
                                            />
                                          </td>

                                          {/* Volume estimated */}
                                          <td className="p-1 border-r border-gray-200 w-24 text-center font-mono font-extrabold text-blue-600 bg-gray-50/80 select-none">
                                            {row.volumeEstimated.toFixed(1)} m³
                                          </td>

                                          {/* Hours worked */}
                                          <td data-row={globalIdx} data-col={4} className="p-1 border-r border-gray-200 w-24 text-center focus-within:ring-2 focus-within:ring-[#00BFFF]/50 focus-within:ring-inset focus-within:bg-sky-50/40">
                                            <input
                                              type="number"
                                              step="0.5"
                                              value={row.hoursWorked}
                                              onChange={e => updateDeblayageCell(p, flatIdx, 'hoursWorked', Number(e.target.value))}
                                              onKeyDown={makeExcelKeyHandler(globalIdx, 4)}
                                              className="w-full bg-transparent text-center font-bold text-[11px] outline-none border-0 text-gray-800"
                                            />
                                          </td>

                                          {/* Remarks */}
                                          <td className="hidden">
                                            <input
                                              type="text"
 
                                              value={row.remarks || ''}
                                              onChange={e => updateDeblayageCell(p, flatIdx, 'remarks', e.target.value)}
                                              onKeyDown={makeExcelKeyHandler(globalIdx, 5)}
                                              className="w-full bg-transparent border-0 font-semibold p-0 text-[10.5px] outline-none uppercase"
                                            />
                                          </td>
                                        </tr>
                                      );
                                    })}

                                    {/* Sector addition row removed - moved inline in header */}
                                  </React.Fragment>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            )}

            {/* SHEET 3: 3 SHIFTS VERTICALLY STACKED FOR EXTRACTION */}
            {activeSheetTab === 'extraction' && (() => {
              const posts: ('Poste 1' | 'Poste 2' | 'Poste 3')[] = ['Poste 1', 'Poste 2', 'Poste 3'];
              const postHoursLabels: Record<string, string> = {
                'Poste 1': '07h - 14h',
                'Poste 2': '15h - 22h',
                'Poste 3': '23h - 06h'
              };

              return (
                <div className="space-y-8">
                  {posts.map(p => {
                    const rowsForPost = extractionRowsByPost[p] || [];
                    const row = rowsForPost[0] || {
                      chantierName: 'Extraction Bure N340 Imiter Est',
                      treuilliste: '',
                      equipier1: '',
                      equipier2: '',
                      equipier3: '',
                      equipier4: '',
                      wagonsTarget: 48,
                      sterileBureImiterEst: 0,
                      startTime: POST_HOURS[p].start,
                      endTime: POST_HOURS[p].end,
                      remarks: ''
                    };
                    const idx = 0;
                    const tName = getEmployeeName(row.treuilliste);
                    const eq1Name = getEmployeeName(row.equipier1);
                    const eq2Name = getEmployeeName(row.equipier2);
                    const eq3Name = getEmployeeName(row.equipier3);
                    const eq4Name = getEmployeeName(row.equipier4);

                    return (
                      <div key={p} className="border border-gray-200 bg-white p-4 shadow-sm rounded-xl">
                        {/* Shifty/Post block banner */}
                        <div className="bg-gradient-to-r from-transparent via-slate-950 to-transparent p-3.5 mb-4 flex items-center justify-center select-none rounded-lg">
                          <h4 className="text-[13px] font-black uppercase text-white tracking-[0.25em] flex items-center gap-2.5 drop-shadow-[0_0_8px_rgba(255,255,255,0.9)]">
                            🚃 {p} <span className="text-slate-350 font-semibold tracking-normal text-[11px]">({postHoursLabels[p]})</span>
                          </h4>
                        </div>

                        <div className="max-w-4xl mx-auto">
                          <div 
                            data-card-container="true"
                            className="bg-white border border-gray-200 p-6 shadow-md rounded-2xl space-y-6"
                          >
                            {/* Title Header */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-gray-200 pb-4">
                              <div>
                                <h3 className="text-lg font-black uppercase text-gray-805 mt-1 tracking-wide">
                                  Extraction Bure N340 Imiter Est
                                </h3>
                              </div>
                              <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase bg-emerald-50/70 text-emerald-600 px-3 py-1 rounded-lg border border-emerald-200/50 shadow-sm">
                                📅 Planification du Poste
                              </span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                              {/* Left Block: Personnel Assignations */}
                              <div className="space-y-4">
                                <div className="border-b border-gray-150 pb-1.5">
                                  <h4 className="text-[11px] font-extrabold uppercase text-gray-600 tracking-wider select-none">
                                    Assignations de l'équipe
                                  </h4>
                                </div>

                                {/* Treuilliste */}
                                <div className="bg-gray-50/60 border border-gray-200 p-3 shadow-none rounded-xl">
                                  <label className="block text-[9.5px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                                    Treuilliste Prévu
                                  </label>
                                  <MatriculeAutocomplete
                                    value={row.treuilliste || ''}
                                    onChange={(matricule) => updateExtractionCell(p, idx, 'treuilliste', matricule)}
                                    employees={employees}
                                    fonctions={['TREUILLISTE']}
                                    post={p}
                                    placeholder="Saisir matricule..."
                                  />
                                  <span className="text-[11px] text-sky-750 block truncate max-w-full font-extrabold mt-1.5">
                                    {tName || '❌ Aucun treuilliste affecté (Libre)'}
                                  </span>
                                </div>

                                {/* Crew grid */}
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="bg-gray-50/60 border border-gray-200 p-3 shadow-none rounded-xl">
                                    <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                                      Équipier Prévu 1
                                    </label>
                                    <MatriculeAutocomplete
                                      value={row.equipier1 || ''}
                                      onChange={(matricule) => updateExtractionCell(p, idx, 'equipier1', matricule)}
                                      employees={employees}
                                      fonctions={['OUVRIER']}
                                      post={p}
                                      placeholder="Matricule..."
                                    />
                                    <span className="text-[10px] text-slate-650 block truncate max-w-full font-bold mt-1">
                                      {eq1Name || '(Vide)'}
                                    </span>
                                  </div>

                                  <div className="bg-gray-50/60 border border-gray-200 p-3 shadow-none rounded-xl">
                                    <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                                      Équipier Prévu 2
                                    </label>
                                    <MatriculeAutocomplete
                                      value={row.equipier2 || ''}
                                      onChange={(matricule) => updateExtractionCell(p, idx, 'equipier2', matricule)}
                                      employees={employees}
                                      fonctions={['OUVRIER']}
                                      post={p}
                                      placeholder="Matricule..."
                                    />
                                    <span className="text-[10px] text-slate-650 block truncate max-w-full font-bold mt-1">
                                      {eq2Name || '(Vide)'}
                                    </span>
                                  </div>

                                  <div className="bg-gray-50/60 border border-gray-200 p-3 shadow-none rounded-xl">
                                    <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                                      Équipier Prévu 3
                                    </label>
                                    <MatriculeAutocomplete
                                      value={row.equipier3 || ''}
                                      onChange={(matricule) => updateExtractionCell(p, idx, 'equipier3', matricule)}
                                      employees={employees}
                                      fonctions={['OUVRIER']}
                                      post={p}
                                      placeholder="Matricule..."
                                    />
                                    <span className="text-[10px] text-slate-650 block truncate max-w-full font-bold mt-1">
                                      {eq3Name || '(Vide)'}
                                    </span>
                                  </div>

                                  <div className="bg-gray-50/60 border border-gray-200 p-3 shadow-none rounded-xl">
                                    <label className="block text-[9px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                                      Équipier Prévu 4
                                    </label>
                                    <MatriculeAutocomplete
                                      value={row.equipier4 || ''}
                                      onChange={(matricule) => updateExtractionCell(p, idx, 'equipier4', matricule)}
                                      employees={employees}
                                      fonctions={['OUVRIER']}
                                      post={p}
                                      placeholder="Matricule..."
                                    />
                                    <span className="text-[10px] text-slate-650 block truncate max-w-full font-bold mt-1">
                                      {eq4Name || '(Vide)'}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Right Block: Metrics & Schedule */}
                              <div className="space-y-4">
                                <div className="border-b border-gray-150 pb-1.5">
                                  <h4 className="text-[11px] font-extrabold uppercase text-gray-600 tracking-wider select-none">
                                    Objectifs & Horaires
                                  </h4>
                                </div>

                                {/* Hours */}
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="bg-gray-50/60 border border-gray-200 p-3 shadow-none rounded-xl">
                                    <label className="block text-[9.5px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                                      Heure Début Prévue
                                    </label>
                                    <input
                                      type="time"
                                      value={row.startTime || POST_HOURS[p].start}
                                      onChange={e => updateExtractionCell(p, idx, 'startTime', e.target.value)}
                                      className="w-full text-xs font-mono text-slate-800 font-bold outline-none bg-transparent"
                                    />
                                  </div>

                                  <div className="bg-gray-50/60 border border-gray-200 p-3 shadow-none rounded-xl">
                                    <label className="block text-[9.5px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                                      Heure Fin Prévue
                                    </label>
                                    <input
                                      type="time"
                                      value={row.endTime || POST_HOURS[p].end}
                                      onChange={e => updateExtractionCell(p, idx, 'endTime', e.target.value)}
                                      className="w-full text-xs font-mono text-slate-800 font-bold outline-none bg-transparent"
                                    />
                                  </div>
                                </div>

                                {/* Target numbers */}
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="bg-emerald-50/70 border border-emerald-100 p-3 shadow-none rounded-xl">
                                    <label className="block text-[9.5px] font-black text-emerald-800 uppercase tracking-wider mb-1.5">
                                      Cible Wagons (Target)
                                    </label>
                                    <input
                                      type="number"
                                      min="0"
                                      value={row.wagonsTarget}
                                      onKeyDown={handleKeyDown}
                                      onChange={e => updateExtractionCell(p, idx, 'wagonsTarget', Number(e.target.value))}
                                      className="w-full text-sm font-extrabold text-emerald-950 font-mono outline-none bg-transparent"
                                    />
                                  </div>

                                  <div className="bg-slate-50 border border-gray-200 p-3 shadow-none rounded-xl">
                                    <label className="block text-[9.5px] font-black text-slate-500 uppercase tracking-wider mb-1.5">
                                      Stérile Prévu (Wg)
                                    </label>
                                    <input
                                      type="number"
                                      min="0"
                                      value={row.sterileBureImiterEst}
                                      onKeyDown={handleKeyDown}
                                      onChange={e => updateExtractionCell(p, idx, 'sterileBureImiterEst', Number(e.target.value))}
                                      className="w-full text-sm font-extrabold text-slate-800 font-mono outline-none bg-transparent"
                                    />
                                  </div>
                                </div>

                                {/* Special instructions / Consignes */}
                                <div className="bg-white border border-gray-200 p-3 rounded-xl shadow-none">
                                  <label className="block text-[9.5px] font-black uppercase text-gray-500 tracking-wider mb-1.5">
                                    Consignes spéciales
                                  </label>
                                  <input
                                    type="text"
                                    placeholder="Ex : Priorité évacuation Bure N340..."
                                    value={row.remarks || ''}
                                    onKeyDown={handleKeyDown}
                                    onChange={e => updateExtractionCell(p, idx, 'remarks', e.target.value)}
                                    className="w-full text-xs font-bold text-slate-805 bg-transparent outline-none border-b border-transparent hover:border-gray-200 focus:border-[#00BFFF]"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Footer analysis info */}
                            <div className="border-t border-gray-250 pt-4 flex flex-wrap items-center justify-between gap-4 select-none text-[10px] font-mono font-black uppercase">
                              <div className="flex items-center gap-1.5 text-emerald-700">
                                <ClipboardList className="w-3.5 h-3.5 text-emerald-600" />
                                <span>Intervalle ciblé :</span>
                                <strong className="text-xs text-emerald-900 bg-emerald-50 border border-emerald-100 px-2.5 py-0.5 rounded-md shadow-sm font-sans font-extrabold">
                                  9 mins / wagon
                                </strong>
                              </div>
                              <span className="text-slate-400 text-[9px]">
                                Bure N340 Imiter Est • SMI HydroMines
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* SHEET 4: BRIGADE MAINTENANCE SUPPORT (3 SHIFTS VERTICALLY STACKED) */}
            {activeSheetTab === 'maintenance' && (
              <div className="space-y-8">
                {(() => {
                  const posts: ('Poste 1' | 'Poste 2' | 'Poste 3')[] = ['Poste 1', 'Poste 2', 'Poste 3'];
                  const postHoursLabels: Record<string, string> = {
                    'Poste 1': '07h - 14h',
                    'Poste 2': '15h - 22h',
                    'Poste 3': '23h - 06h'
                  };

                  return posts.map(p => {
                    const rowsForPost = maintenanceRowsByPost[p] || [];

                    return (
                      <div key={p} className="border border-gray-200 bg-white p-4 shadow-sm rounded-xl">
                        {/* Shifty/Post block banner */}
                        <div className="bg-gradient-to-r from-transparent via-slate-950 to-transparent p-3.5 mb-4 flex items-center justify-center select-none rounded-lg">
                          <h4 className="text-[13px] font-black uppercase text-white tracking-[0.25em] flex items-center gap-2.5 drop-shadow-[0_0_8px_rgba(255,255,255,0.9)]">
                            🔧 {p} <span className="text-slate-350 font-semibold tracking-normal text-[11px]">({postHoursLabels[p]})</span>
                          </h4>
                        </div>

                        <div className="overflow-x-auto text-[11px] border border-gray-250 rounded-xl bg-white shadow-sm">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-gray-50/75 text-slate-705 border-b border-gray-200 font-bold">
                                <th className="p-2 px-3 text-[9.5px] font-black uppercase text-center w-8 text-gray-400">Row</th>
                                <th className="p-2 px-3 text-[9.5px] font-black uppercase w-40 border-r border-gray-200">Rôle Fixe SMI</th>
                                <th className="p-2 px-3 text-[9.5px] font-black uppercase w-28 border-r border-gray-200">Matr. Spécialiste</th>
                                <th className="p-2 px-3 text-[9.5px] font-black uppercase w-44 border-r border-gray-200">Nom Spécialiste</th>
                                <th className="p-2 px-3 text-[9.5px] font-black uppercase w-52 border-r border-gray-200">Machine d'Intervention</th>
                                <th className="p-2 px-3 text-[9.5px] font-black uppercase w-20 border-r border-gray-200 text-center">Heures</th>
                                <th className="p-2 px-3 text-[9.5px] font-black uppercase border-r border-gray-200">Fiche d'Opérations techniques de maintenance planifiée</th>
                                <th className="p-2 px-3 text-[9.5px] font-black uppercase text-center w-12">Actions</th>
                              </tr>
                            </thead>
                            <tbody>
                              {rowsForPost.map((row, idx) => {
                                const expertValidName = getEmployeeName(row.agentMatricule);

                                return (
                                  <tr key={idx} className="border-b border-gray-200 hover:bg-purple-50/10 transition-colors">
                                    <td className="p-2 px-3 text-[10px] font-mono text-gray-400 text-center bg-gray-50/40 border-r border-gray-200">{idx + 1}</td>
                                    <td className="p-2 px-3 border-r border-gray-200 font-extrabold uppercase text-purple-700 bg-purple-50/30 text-[10.5px]">
                                      {row.roleLabel}
                                    </td>
                                    <td className="p-2 px-2.5 border-r border-gray-200 min-w-[110px] focus-within:ring-2 focus-within:ring-purple-200 focus-within:bg-purple-50/10">
                                      <MatriculeAutocomplete
                                        value={row.agentMatricule}
                                        onChange={(matricule) => updateMaintenanceCell(p, idx, 'agentMatricule', matricule)}
                                        employees={employees}
                                        fonctions={(() => {
                                          const norm = (row.roleLabel || '').toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                                          if (norm.includes('MECANICIEN')) return ['MECANICIEN'];
                                          if (norm.includes('ELECTRICIEN')) return ['ELECTRICIEN'];
                                          if (norm.includes('CHAUDRONNIER')) return ['CHAUDRONNIER'];
                                          return ['MECANICIEN', 'CHAUDRONNIER', 'ELECTRICIEN'];
                                        })()}
                                        placeholder="M-..."
                                        post={p}
                                      />
                                    </td>
                                    <td className="p-2 px-3 border-r border-gray-200 text-[11px] font-extrabold text-slate-700 bg-gray-50/50">
                                      {expertValidName ? expertValidName.split(' ')[0] + ' ' + (expertValidName.split(' ')[1] || '') : 'Inconnu'}
                                    </td>
                                    <td className="p-2 px-2.5 border-r border-gray-200 focus-within:ring-2 focus-within:ring-purple-200">
                                      <select
                                        value={row.engineId}
                                        onChange={e => updateMaintenanceCell(p, idx, 'engineId', e.target.value)}
                                        className="w-full text-[11px] font-semibold border-0 outline-none bg-transparent p-0 text-slate-800"
                                      >
                                        <option value="">(Aucun engin repéré)</option>
                                        {platformSettings.engines.map(eng => (
                                          <option key={eng} value={eng}>
                                            {eng}
                                          </option>
                                        ))}
                                      </select>
                                    </td>
                                    <td className="p-2 px-2 text-center border-r border-gray-200 focus-within:ring-2 focus-within:ring-purple-200">
                                      <input
                                        type="number"
                                        value={row.hoursSpent}
                                        onChange={e => updateMaintenanceCell(p, idx, 'hoursSpent', Number(e.target.value))}
                                        className="w-full text-[11px] font-mono text-center outline-none bg-transparent p-0 text-slate-800 font-bold"
                                      />
                                    </td>
                                    <td className="p-2 px-3 border-r border-gray-200 focus-within:ring-2 focus-within:ring-purple-200">
                                      <input
                                        type="text"
                                        placeholder="Visite périodique des 250h, graissage, vidange pont..."
                                        value={row.workDescription}
                                        onChange={e => updateMaintenanceCell(p, idx, 'workDescription', e.target.value)}
                                        className="w-full text-[11px] border-0 outline-none bg-transparent p-0 uppercase text-slate-750 font-medium"
                                      />
                                    </td>
                                    <td className="p-2 text-center">
                                      <button
                                        type="button"
                                        onClick={() => deleteMaintenanceRowAt(p, idx)}
                                        className="text-red-400 hover:text-red-700 p-1.5 rounded transition-colors"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        {/* Button for dynamic row addition */}
                        <div className="flex justify-end mt-3">
                          <button
                            type="button"
                            onClick={() => addRowToMaintenance(p)}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[9px] font-black uppercase text-purple-600 bg-purple-50 hover:bg-purple-100/70 border border-purple-200/50 rounded-lg transition-all cursor-pointer shadow-xs"
                          >
                            <span>+ Ajouter Ligne</span>
                          </button>
                        </div>
                      </div>
                    );
                  });
                })()}
              </div>
            )}
            </fieldset>

            {/* REAL-TIME WORKER DUPLICATE WARNING SYSTEM */}
            {(() => {
              const mobilised = getMobilisedMatricules();
              const counts: Record<string, typeof mobilised> = {};
              mobilised.forEach(m => {
                const key = m.matricule.trim().toUpperCase();
                if (!key || key === 'M-' || key === 'INCONNU') return;
                if (!counts[key]) counts[key] = [];
                counts[key].push(m);
              });
              const duplicates = Object.entries(counts).filter(([_, list]) => list.length > 1);

              if (duplicates.length === 0) return null;

              return (
                <div id="duplicate-warnings-banner" className="my-3 border border-amber-200 bg-amber-50/60 text-amber-955 p-4 rounded-xl shadow-none">
                  <div className="flex items-center gap-2 pb-1.5 border-b border-amber-250 mb-2">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 animate-none"></span>
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-800">
                      ℹ️ Agent affecté sur plusieurs postes
                    </span>
                  </div>
                  <div className="max-h-32 overflow-y-auto pr-1 divide-y divide-amber-200/40">
                    {duplicates.map(([mat, occurrences]) => {
                      const firstOcc = occurrences[0];
                      return (
                        <div key={mat} className="py-1.5 text-[9.5px] font-medium text-amber-905 leading-relaxed">
                          Le matricule <strong className="font-mono bg-amber-100 px-1 text-amber-950 border border-amber-200 rounded font-black">{mat}</strong> ({firstOcc.name}) est affecté sur plusieurs postes : {occurrences.map((occ, oIdx) => (
                            <strong key={oIdx} className="text-amber-950">
                              {oIdx > 0 ? ' et ' : ''}
                              {occ.sheet} ({occ.location})
                            </strong>
                          ))}. Vérifiez si c'est intentionnel.
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* BOUTEFEU COMPLIANCE WARNINGS */}
            {(() => {
              const alerts: { level: 'info' | 'warning' | 'danger'; msg: string }[] = [];

              // Helper to check if a sector has active minage rows in a post
              const isSectorActiveForMinage = (post: 'Poste 1' | 'Poste 2' | 'Poste 3', sector: string) => {
                const rows = minageRowsByPost[post] || [];
                return rows.some(r => r.chantierId && (r.sectorGroup === sector));
              };

              const sectorsList = ['Imiter 2', 'Imiter 1', 'Imiter Est'] as const;

              // --- Poste 1 ---
              const p1Bfts = sectorsList
                .map(sec => sectorBoutefeus['Poste 1']?.[sec as 'Imiter 2' | 'Imiter 1' | 'Imiter Est'] || '')
                .filter(Boolean);
              const uniqueP1Bfts = Array.from(new Set(p1Bfts));

              // Check active sectors missing blasters
              sectorsList.forEach(sec => {
                if (isSectorActiveForMinage('Poste 1', sec) && !sectorBoutefeus['Poste 1']?.[sec as 'Imiter 2' | 'Imiter 1' | 'Imiter Est']) {
                  alerts.push({
                    level: 'danger',
                    msg: `⚠️ Sécurité explosive (P1) : Le secteur actif "${sec}" n'a pas de Boutefeu affecté pour le transport des explosifs.`
                  });
                }
              });

              // Norm warning
              const hasActiveP1Minage = sectorsList.some(sec => isSectorActiveForMinage('Poste 1', sec));
              if (hasActiveP1Minage) {
                if (uniqueP1Bfts.length < 2) {
                  alerts.push({
                    level: 'warning',
                    msg: `💡 Effectif Boutefeu (P1) : Moins de 2 Boutefeus distincts sont planifiés au Poste 1 (${uniqueP1Bfts.length} trouvé(s)). La norme est de 2.`
                  });
                } else if (uniqueP1Bfts.length > 2) {
                  alerts.push({
                    level: 'info',
                    msg: `ℹ️ Répartition Boutefeu (P1) : ${uniqueP1Bfts.length} Boutefeus différents sont programmés au Poste 1 (La norme habituelle est de 2).`
                  });
                }
              }

              // --- Poste 2 ---
              const p2Bfts = sectorsList
                .map(sec => sectorBoutefeus['Poste 2']?.[sec as 'Imiter 2' | 'Imiter 1' | 'Imiter Est'] || '')
                .filter(Boolean);
              const uniqueP2Bfts = Array.from(new Set(p2Bfts));

              sectorsList.forEach(sec => {
                if (isSectorActiveForMinage('Poste 2', sec) && !sectorBoutefeus['Poste 2']?.[sec as 'Imiter 2' | 'Imiter 1' | 'Imiter Est']) {
                  alerts.push({
                    level: 'danger',
                    msg: `⚠️ Sécurité explosive (P2) : Le secteur actif "${sec}" n'a pas de Boutefeu affecté pour le transport des explosifs.`
                  });
                }
              });

              const hasActiveP2Minage = sectorsList.some(sec => isSectorActiveForMinage('Poste 2', sec));
              if (hasActiveP2Minage) {
                if (uniqueP2Bfts.length < 1) {
                  alerts.push({
                    level: 'danger',
                    msg: `⚠️ Effectif Boutefeu (P2) : Aucun Boutefeu n'est planifié au Poste 2 alors que des tirs de mines sont actifs.`
                  });
                } else if (uniqueP2Bfts.length > 1) {
                  alerts.push({
                    level: 'warning',
                    msg: `💡 Effectif Boutefeu (P2) : Plus de 1 Boutefeu distinct est planifié pour le Poste 2 (La norme habituelle est de 1 seul).`
                  });
                }
              }

              // --- Poste 3 ---
              const p3Bfts = sectorsList
                .map(sec => sectorBoutefeus['Poste 3']?.[sec as 'Imiter 2' | 'Imiter 1' | 'Imiter Est'] || '')
                .filter(Boolean);
              if (p3Bfts.length > 0) {
                alerts.push({
                  level: 'warning',
                  msg: `💤 Alerte logistique (P3) : Des Boutefeus sont planifiés au Poste 3. Notez qu'ils ne travaillent pas sur ce poste normalement chez nous.`
                });
              }

              if (alerts.length === 0) return null;

              return (
                <div id="boutefeu-warnings-banner" className="my-3 border border-amber-200 bg-amber-50/50 p-4 rounded-xl">
                  <div className="flex items-center gap-2 pb-1.5 border-b border-amber-200 mb-2">
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse"></span>
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-850 flex items-center gap-1">
                      💣 CONFORMITÉ LOGISTIQUE BOUTEFEUS
                    </span>
                  </div>
                  <div className="max-h-36 overflow-y-auto pr-1 space-y-1">
                    {alerts.map((al, idx) => {
                      const colorClass = al.level === 'danger' ? 'text-red-700 bg-red-50 border border-red-200 font-bold' : al.level === 'warning' ? 'text-amber-800 bg-amber-100/40 border border-amber-200 font-bold' : 'text-slate-800 bg-sky-50 border border-sky-100';
                      return (
                        <div key={idx} className={`p-2 rounded text-[9.5px] uppercase tracking-wide leading-relaxed ${colorClass}`}>
                          {al.msg}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })()}

            {/* ANALYSIS OF J-1 DUPLICATION DEVIATIONS (ÉCARTS) */}
            {duplicatedFromDayData && (
              <div className="my-5 border border-sky-200 bg-sky-50/20 text-slate-900 p-5 rounded-2xl shadow-xs font-sans animate-fade-in">
                <div className="flex items-center justify-between flex-wrap gap-3 pb-3 border-b border-sky-100 mb-4">
                  <div className="flex items-center gap-2">
                    <span className="flex h-2 w-2 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
                    </span>
                    <span className="text-[11px] font-black uppercase tracking-wider text-sky-950 flex items-center gap-1.5">
                      📊 ANALYSE COMPARATIVE DES ÉCARTS DE PLANIFICATION VS LA VEILLE (J-1 : {yesterdayDateStr})
                    </span>
                  </div>
                  <span className="text-[9.5px] px-2.5 py-1 bg-sky-100 text-sky-900 font-extrabold uppercase rounded-full">
                    Origine : Importation {yesterdayDateStr}
                  </span>
                </div>

                {(() => {
                  const differencesList = getPlanningDifferences();
                  if (differencesList.length === 0) {
                    return (
                      <div className="bg-emerald-50/50 border border-emerald-100 p-4 rounded-xl text-center text-emerald-950 text-[10.5px]">
                        <p className="font-extrabold text-[11px] mb-1">✅ PLANIFICATION IDENTIQUE À LA VEILLE</p>
                        <p className="font-medium text-emerald-800">
                          Tous les effectifs, postes, et affectations de chantiers sont strictement identiques à J-1.
                          Ajustez au besoin ou validez les écarts (identiques) pour autoriser l'enregistrement.
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-3">
                      <div className="text-[10px] text-slate-500 font-bold mb-1">
                        Le secrétaire a adapté la planification de J-1. Voici le résumé des {differencesList.length} écart(s) détecté(s) avant validation finale :
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-48 overflow-y-auto pr-1">
                        {differencesList.map((diff, index) => (
                          <div key={index} className="bg-white border border-gray-200 p-2.5 rounded-lg flex gap-2 items-start text-[9.5px]">
                            <span className="px-1.5 py-0.5 bg-slate-100 text-slate-700 font-black uppercase text-[7.5px] rounded select-none border border-slate-200 mt-0.5 shrink-0">
                              {diff.post}
                            </span>
                            <div className="flex-1 min-w-0">
                              <span className="font-black text-sky-800 block text-[8px] uppercase tracking-wider mb-0.5">
                                {diff.type}
                              </span>
                              <p className="text-slate-700 font-medium leading-relaxed" title={diff.desc}>
                                {diff.desc}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}

                {/* Validation status bar for J-1 Duplication deviations */}
                <div className="mt-4 pt-3 border-t border-sky-100 flex flex-col sm:flex-row items-center justify-between gap-3.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-[#00BFFF] font-black uppercase">Statut réglementaire SMI :</span>
                    <span className={`px-2 py-0.5 text-[8.5px] font-black uppercase rounded-full border ${
                      isEcartAccepted 
                        ? 'bg-emerald-100 border-emerald-200 text-emerald-950' 
                        : 'bg-amber-100 border-amber-200 text-amber-950 animate-pulse'
                    }`}>
                      {isEcartAccepted ? '✓ Écarts validés par secrétaire de permanence' : '⚠ Validation des écarts requise'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsEcartAccepted(prev => !prev)}
                    className={`w-full sm:w-auto px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-wider shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                      isEcartAccepted 
                        ? 'bg-emerald-600 hover:bg-emerald-700 border-emerald-500 text-white' 
                        : 'bg-amber-600 hover:bg-amber-700 border-amber-500 text-white animate-bounce'
                    }`}
                  >
                    {isEcartAccepted ? '✓ Écarts Validés (Annuler)' : 'Valider les écarts de planification J-1'}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* INTEGRATED FULL-WIDTH BOTTOM SUMMARY BAR */}
          <div className="bg-white p-4 flex flex-col md:flex-row items-center justify-between gap-4 border border-gray-200 rounded-2xl shadow-lg mt-6">
            <div className="flex flex-wrap items-center gap-6">
              <div className="border-r border-gray-200 pr-6">
                <span className="text-slate-400 uppercase text-[8px] font-black tracking-wider block">Chantiers programmés</span>
                <span className="text-base font-black text-slate-800 mt-0.5 block">
                  {nonEmptyChantiersCount} {nonEmptyChantiersCount > 1 ? 'chantiers' : 'chantier'}
                </span>
              </div>
              <div className="border-r border-gray-200 pr-6">
                <span className="text-slate-400 uppercase text-[8px] font-black tracking-wider block">Objectif Avancement</span>
                <span className="text-base font-black text-[#00BFFF] mt-0.5 block">
                  {(nonEmptyChantiersCount * 1.7).toFixed(1)} mètres
                </span>
              </div>
              <div>
                <span className="text-slate-400 uppercase text-[8px] font-black tracking-wider block">Coordinateur</span>
                <span className="text-[10px] font-extrabold text-slate-600 mt-0.5 block uppercase">
                  {user?.email || 'Secrétaire de Planification SMI'}
                </span>
              </div>
            </div>

             <div className="flex flex-col md:flex-row gap-2 w-full md:w-auto">
              <button 
                onClick={savePlanningWorkbook}
                disabled={saveStatus === 'saving' || isLockedByNiveau2 || isMonthClosedForPlanning}
                className={`w-full md:w-auto py-2.5 px-6 font-extrabold uppercase tracking-widest text-[10px] rounded-xl transition-all shadow-md active:translate-y-px flex items-center justify-center gap-1.5 ${
                  isLockedByNiveau2 || isMonthClosedForPlanning
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed opacity-60 border border-gray-250 shadow-none' 
                    : 'bg-[#00BFFF] hover:bg-sky-500 text-white cursor-pointer hover:shadow-lg'
                }`}
              >
                <Save className="w-4 h-4" />
                {saveStatus === 'saving' ? 'Validation ...' : saveStatus === 'saved' ? '✓ Enregistré !' : 'Graver l\'Ordonnancement Complet'}
              </button>
              {isPlanningSavedInDb && (!validationInfo || validationInfo.status !== 'valide') && !isMonthClosedForPlanning && (
                <button
                  onClick={validatePlanningWorkbook}
                  disabled={saveStatus === 'saving'}
                  className="w-full md:w-auto bg-emerald-600 hover:bg-emerald-700 text-white py-2.5 px-6 font-extrabold uppercase tracking-widest text-[10px] rounded-xl transition-all shadow-md hover:shadow-lg active:translate-y-px cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  ✓ Valider la planification
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* CONSOLIDATED HISTORY LIST VIEW & DELETIONS JOURNAL SUB-TABS */
        <div className="space-y-4">
          {/* Sub-tabs switcher with a distinct HydroMines look */}
          <div className="flex border border-gray-200 bg-gray-50/50 p-1.5 rounded-xl gap-1.5 w-fit">
            <button
              onClick={() => setActiveHistoryTab('books')}
              className={`px-4 py-2 rounded-lg font-extrabold text-[10px] uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                activeHistoryTab === 'books'
                  ? 'bg-white text-gray-950 shadow-sm border border-gray-200'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              📚 Registre des Cahiers ({planningsHistory.length})
            </button>
            <button
              onClick={() => setActiveHistoryTab('deletions')}
              className={`px-4 py-2 rounded-lg font-extrabold text-[10px] uppercase tracking-wider transition-all cursor-pointer flex items-center gap-2 ${
                activeHistoryTab === 'deletions'
                  ? 'bg-red-50 text-red-650 shadow-sm border border-red-200'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              🗑️ Journal de suppressions ({deletedLogs.length})
            </button>
          </div>

          {activeHistoryTab === 'books' ? (
            <div className="bg-white border border-gray-200 rounded-2xl shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-55 text-slate-700 border-b border-gray-200">
                      {[
                        'Date programmée', 
                        'Couverture', 
                        'Chantiers planifiés', 
                        'Avancement ciblé', 
                        'Sauvegardé par', 
                        'Fiche',
                        'Consulter',
                        ...(profile && ['admin', 'direction', 'chief', 'responsible', 'secretary'].includes(profile.role) ? ['Actions'] : [])
                      ].map(h => (
                        <th key={h} className="px-5 py-3 text-[9px] font-extrabold uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-150 text-[11px]">
                    {planningsHistory.map((record) => (
                      <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-5 py-3 font-mono font-bold text-slate-800">{record.date}</td>
                        <td className="px-5 py-3">
                          <span className="bg-sky-50 text-sky-700 px-2.5 py-1 font-extrabold uppercase border border-sky-200 rounded text-[9px]">Journée entière (Consolidée)</span>
                        </td>
                        <td className="px-5 py-3 text-red-605 font-extrabold">
                          {record.minageRows ? record.minageRows.length : 0} chantiers tirs
                        </td>
                        <td className="px-5 py-3 font-extrabold text-blue-650">
                          {record.minageRows ? record.minageRows
                            .filter((r: any) => !(r.remarks && r.remarks.includes('(Volée')))
                            .reduce((acc: number, r: any) => acc + (r.meterage || 0), 0).toFixed(1) : '0.0'} m
                        </td>
                        <td className="px-5 py-3 text-slate-500 font-bold uppercase text-[10px]">
                          {record.operator ? record.operator.split('@')[0] : 'SMI USER'}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex flex-col gap-1">
                            <div className="inline-flex items-center gap-1 w-max px-2 py-0.5 bg-green-50 border border-green-200 text-green-700 font-extrabold uppercase text-[8px] rounded">
                              <CheckCircle className="w-3 h-3 text-green-600" /> Planifié
                            </div>
                            {productionDates.has(record.date) ? (
                              <div className="inline-flex items-center gap-1 w-max px-2 py-0.5 bg-emerald-50 border border-emerald-250 text-emerald-800 font-extrabold uppercase text-[8px] rounded">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                Réalisé saisi
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1 w-max px-2 py-0.5 bg-amber-50 border border-amber-250 text-amber-800 font-extrabold uppercase text-[8px] rounded">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                En attente de saisie
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <button
                            onClick={() => {
                              setSelectedDate(record.date);
                              setViewMode('sheet');
                            }}
                            className="bg-sky-50 hover:bg-[#00BFFF]/20 text-[#00BFFF] border border-[#00BFFF]/30 px-2.5 py-1 rounded-lg text-[9px] font-extrabold uppercase transition-all flex items-center gap-1 cursor-pointer"
                            title="Ouvrir cette fiche sur la grille"
                          >
                            👁️ Ouvrir Grille
                          </button>
                        </td>
                        {profile && ['admin', 'direction', 'chief', 'responsible', 'secretary'].includes(profile.role) && (
                          <td className="px-5 py-3">
                            <button
                              onClick={() => handleDeleteHistoryRecord(record)}
                              className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-2.5 py-1 rounded-lg text-[9px] font-extrabold uppercase transition-all flex items-center gap-1 cursor-pointer"
                              title="Supprimer définitivement ce cahier"
                            >
                              <Trash2 className="w-3 h-3 text-red-500" /> Supprimer
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                    {planningsHistory.length === 0 && (
                      <tr>
                        <td colSpan={profile && ['admin', 'direction', 'chief', 'responsible', 'secretary'].includes(profile.role) ? 8 : 7} className="text-center p-16 italic text-gray-300 uppercase font-black text-[10px]">
                          Aucun grand livre de planification enregistré.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* COMPREHENSIVE DELETIONS JOURNAL TABLE */
            <div className="bg-white border border-gray-200 rounded-2xl shadow-md overflow-hidden animate-fade-in">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-red-50/30 text-rose-950 border-b border-rose-100">
                      {[
                        'Date de Planification',
                        'Moment de suppression d\'Ordonnance',
                        'Agent qui a supprimé',
                        'Détails / Contenu supprimé'
                      ].map(h => (
                        <th key={h} className="px-5 py-3 text-[9px] font-extrabold uppercase tracking-wider">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-150 text-[11px]">
                    {deletedLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-red-50/10 transition-colors">
                        <td className="px-5 py-3 font-mono font-bold text-red-600">{log.date}</td>
                        <td className="px-5 py-3 text-slate-500 font-medium">
                          {log.deletedAt ? new Date(log.deletedAt).toLocaleString('fr-FR') : 'Inconnu'}
                        </td>
                        <td className="px-5 py-3">
                          <span className="bg-amber-50 text-amber-800 border border-amber-250 px-2.5 py-0.5 font-extrabold uppercase rounded text-[9px]">
                            {log.deletedBy.split('@')[0]}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-gray-600 font-semibold italic">
                          {log.details || 'Planification globale supprimée.'}
                        </td>
                      </tr>
                    ))}
                    {deletedLogs.length === 0 && (
                      <tr>
                        <td colSpan={4} className="text-center p-16 italic text-gray-300 uppercase font-black text-[10px]">
                          Aucune trace de suppression dans le journal.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* GORGEOUS CUSTOM DELETE WARNING MODAL IN HYDROMINES BLUE */}
      {isDeleteModalOpen && recordToDelete && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white rounded-2xl border border-red-200 shadow-2xl max-w-md w-full overflow-hidden transform transition-all">
            {/* Warning Header featuring Hydromines Accent */}
            <div className="bg-gradient-to-r from-red-600 to-[#00BFFF] p-5 text-white flex items-center gap-4">
              <div className="bg-white/20 p-2.5 rounded-xl border border-white/20">
                <Trash2 className="w-8 h-8 text-white animate-pulse" />
              </div>
              <div>
                <h3 className="font-extrabold uppercase tracking-wider text-[12px] text-white">RELIQUAT D'ORDONNANCEMENT</h3>
                <p className="text-[9px] text-[#00BFFF] font-black uppercase tracking-widest">SMI - HydroMines Planificateur</p>
              </div>
            </div>

            {/* Modal Contents */}
            <div className="p-6 space-y-4">
              <p className="text-[11.5px] text-gray-700 leading-relaxed font-semibold">
                Êtes-vous absolument sûr de vouloir détruire définitivement la planification journalière complète du <strong className="text-red-600 font-black underline">{recordToDelete.date}</strong> ?
              </p>

              <div className="bg-slate-50 border border-slate-150 p-3.5 rounded-xl space-y-2 text-[10.5px]">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-bold uppercase text-[9px]">Scope de Blasting :</span>
                  <span className="text-slate-900 font-black uppercase">
                    {recordToDelete.minageRows ? recordToDelete.minageRows.length : 0} Chantiers tirs
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-bold uppercase text-[9px]">Avancement Foré :</span>
                  <span className="text-[#00BFFF] font-black">
                    {recordToDelete.minageRows ? recordToDelete.minageRows
                      .filter((r: any) => !(r.remarks && r.remarks.includes('(Volée')))
                      .reduce((acc: number, r: any) => acc + (r.meterage || 0), 0).toFixed(1) : '0.0'} m
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400 font-bold uppercase text-[9px]">Opérateur initial :</span>
                  <span className="text-slate-700 font-black uppercase text-[9px]">
                    {recordToDelete.operator ? recordToDelete.operator.split('@')[0] : 'SMI USER'}
                  </span>
                </div>
              </div>

              <div className="bg-red-50 border border-red-100 p-3.5 rounded-xl text-[10px] text-red-700 flex gap-2.5 items-start">
                <span className="text-base leading-none">⚠️</span>
                <p className="font-extrabold uppercase tracking-wide leading-relaxed">
                  Cette action est définitive et supprimera tous les postes associés. Elle sera également consignée dans le Journal de suppressions.
                </p>
              </div>
            </div>

            {/* Modal Controls */}
            <div className="bg-gray-50 border-t border-gray-150 px-6 py-4 flex flex-col sm:flex-row gap-2 justify-end">
              <button
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setRecordToDelete(null);
                }}
                className="order-2 sm:order-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-extrabold uppercase rounded-lg text-[9px] tracking-wider transition-all cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={confirmDeleteRecord}
                className="order-1 sm:order-2 px-5 py-2 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-650 text-white font-extrabold uppercase rounded-lg text-[9px] tracking-wider transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" /> Oui, Supprimer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SYSTEM CONFIRMATION TRANSIENT NOTIFICATION IN HYDROMINES SLATE/CYAN BRANDING */}
      {deletionNotification && (
        <div className="fixed top-6 right-6 z-50 max-w-sm w-full bg-slate-900 text-white border border-[#00BFFF] p-4 rounded-2xl shadow-[0_4px_30px_rgba(0,191,255,0.4)] animate-slide-in flex gap-3.5 items-center">
          <div className="bg-[#00BFFF]/20 p-2 rounded-lg border border-[#00BFFF]/30 text-[#00BFFF]">
            <CheckCircle className="w-5 h-5 text-[#00BFFF]" />
          </div>
          <div className="flex-1">
            <h4 className="text-[10px] font-black text-[#00BFFF] uppercase tracking-wider">HydroMines - Validation</h4>
            <p className="text-[9.5px] text-gray-200 font-bold mt-0.5 leading-relaxed">
              La planification du <span className="underline font-extrabold text-[#00BFFF]">{deletionNotification.date}</span> a été supprimée définitivement par <span className="font-extrabold text-[#00BFFF]">{deletionNotification.deletedBy}</span>.
            </p>
          </div>
          <button
            onClick={() => setDeletionNotification(null)}
            className="text-gray-400 hover:text-white text-xs font-bold px-1.5 py-0.5 hover:bg-white/10 rounded cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* WARNING MODAL FOR J-1 PLANNING DUPLICATION */}
      {isDuplicationWarningModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in font-sans">
          <div className="bg-white rounded-3xl border border-sky-300 shadow-2xl max-w-lg w-full overflow-hidden transform transition-all">
            {/* Elegant Sky Blue / Water Head */}
            <div className="bg-gradient-to-r from-sky-600 to-[#00BFFF] p-6 text-white flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-2xl border border-white/25">
                <Copy className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="font-extrabold uppercase tracking-wider text-[12px] text-white">DUPLICATION DE SÉCURITÉ J-1</h3>
                <p className="text-[9px] text-[#00BFFF] font-black uppercase tracking-widest">Ajustements Réels Exigés</p>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4">
              <div className="bg-[#00BFFF]/5 p-4 rounded-2xl border border-sky-100 flex gap-3 text-[11px] text-sky-950 font-semibold leading-relaxed">
                <span className="text-xl">📋</span>
                <p>
                  Vous clônez la planification complète de la veille (<strong className="text-sky-800 underline font-black">{yesterdayDateStr}</strong>) vers la date d'aujourd'hui (<strong className="text-[#00BFFF] font-black">{selectedDate}</strong>).
                </p>
              </div>

              <div className="space-y-2.5 text-[10px] text-gray-700 leading-relaxed font-medium">
                <p className="uppercase text-[9px] font-black tracking-wider text-slate-400">Règles réglementaires SMI :</p>
                <div className="flex items-start gap-2">
                  <span className="text-sky-500 font-bold">1.</span>
                  <p>
                    Le secrétaire de permanence <strong>doit s'assurer</strong> que la planification d'aujourd'hui est réellement identique à celle d'hier.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-sky-500 font-bold">2.</span>
                  <p>
                    Si non, le secrétaire <strong>doit impérativement ajuster la planification</strong> en écrivant les affectations réelles sur la grille.
                  </p>
                </div>
                <div className="flex items-start gap-2">
                  <span className="text-sky-500 font-bold">3.</span>
                  <p>
                    Le panneau d'analyse en bas de page résumera <strong>tous les écarts</strong> par rapport à hier pour validation avant enregistrement.
                  </p>
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl text-amber-900 text-[9.5px] font-bold flex gap-2.5 items-start animate-pulse">
                <span className="text-base leading-none">⚠️</span>
                <p className="leading-relaxed font-extrabold uppercase">
                  Le système requiert de valider ces écarts après duplication avant que l'enregistrement final ne soit autorisé.
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="bg-gray-50 border-t border-gray-100 px-6 py-4 flex flex-col sm:flex-row gap-2 justify-end">
              <button
                onClick={() => {
                  setIsDuplicationWarningModalOpen(false);
                }}
                className="order-2 sm:order-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-extrabold uppercase rounded-lg text-[9px] tracking-wider transition-all cursor-pointer"
              >
                Annuler
              </button>
              <button
                onClick={confirmDuplicateYesterday}
                className="order-1 sm:order-2 px-5 py-2 bg-gradient-to-r from-sky-600 to-[#00BFFF] text-white font-extrabold uppercase rounded-lg text-[9px] tracking-wider transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" /> Oui, Je Valide & Duplique
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL FOR MODIFICATION REQUEST UNDER VERROUILLAGE NIVEAU 2 */}
      {isRequestModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in font-sans">
          <div className="bg-white rounded-3xl border border-red-200 shadow-2xl max-w-lg w-full overflow-hidden transform transition-all">
            {/* Header branding */}
            <div className="bg-gradient-to-r from-red-600 to-[#8B0000] p-6 text-white flex items-center gap-4">
              <div className="bg-white/20 p-3 rounded-2xl border border-white/25">
                <AlertCircle className="w-8 h-8 text-white animate-pulse" />
              </div>
              <div>
                <h3 className="font-extrabold uppercase tracking-wider text-[12px] text-white">Demande de Déverrouillage Exceptionnel</h3>
                <p className="text-[9px] text-red-200 font-bold uppercase tracking-widest">Planification {selectedDate.split('-').reverse().join('/')}</p>
              </div>
            </div>

            {/* Modal Body */}
            <form onSubmit={(e) => { e.preventDefault(); submitModificationRequest(); }}>
              <div className="p-6 space-y-4">
                <div className="bg-red-50/50 p-4 rounded-2xl border border-red-100 flex gap-3 text-[11px] text-red-950 font-semibold leading-relaxed">
                  <span className="text-xl">⚠️</span>
                  <p>
                    Cette planification a été verrouillée car <strong>plus de 24 heures</strong> se sont écoulées depuis sa validation officielle. Toute modification ultérieure doit faire l'objet d'un motif motivé et être approuvée par un administrateur.
                  </p>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[9.5px] font-black text-slate-400 uppercase tracking-wider">
                    Raison obligatoire de la modification <span className="text-red-600 font-extrabold">*</span>
                  </label>
                  <textarea
                    required
                    value={requestReason}
                    onChange={(e) => setRequestReason(e.target.value)}
                    placeholder="Ex: Rectification de l'affectation du boutefeu pour le Poste 2 suite à un congé de dernière minute..."
                    className="w-full text-[11px] p-3 border-2 border-slate-200 rounded-xl focus:border-[#8B0000] focus:ring-1 focus:ring-[#8B0000]/10 h-28 resize-none font-medium outline-none text-slate-800 placeholder-slate-400 bg-white"
                  />
                  <p className="text-[8.5px] text-slate-400 italic">
                    Une notification instantanée sera transmise dans l'espace d'administration. Une fois approuvée, une fenêtre d'édition libre de 2 heures vous sera accordée.
                  </p>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="bg-gray-50 border-t border-gray-100 px-6 py-4 flex flex-col sm:flex-row gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => {
                    setIsRequestModalOpen(false);
                    setRequestReason('');
                  }}
                  className="order-2 sm:order-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 font-extrabold uppercase rounded-lg text-[9px] tracking-wider transition-all cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="order-1 sm:order-2 px-5 py-2 bg-gradient-to-r from-red-600 to-[#8B0000] text-white font-extrabold uppercase rounded-lg text-[9px] tracking-wider transition-all cursor-pointer shadow-md flex items-center justify-center gap-1.5 hover:shadow-lg active:translate-y-px"
                >
                  <Check className="w-3.5 h-3.5" /> Transmettre la Demande
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Gap Report Dialog Modal */}
      <GapReportModal
        isOpen={isGapModalOpen}
        onClose={() => setIsGapModalOpen(false)}
        onConfirm={applyPendingProposition}
        selectedDate={selectedDate}
        selectedPost={selectedPost}
        teamChanges={gapChanges}
        inactiveAssigned={gapInactive}
        unassignedPersonnel={gapUnassigned}
      />

      {/* Real-time Trace Audit Logs Drawer */}
      <AuditLogsDrawer
        isOpen={isAuditDrawerOpen}
        onClose={() => setIsAuditDrawerOpen(false)}
        selectedDate={selectedDate}
      />
    </div>
  );
};
