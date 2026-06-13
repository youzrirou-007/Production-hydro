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
  ClipboardList
} from 'lucide-react';
import { collection, query, onSnapshot, setDoc, doc, getDocs, deleteDoc, where, writeBatch, addDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { format, addDays } from 'date-fns';
import { MatriculeAutocomplete } from '../components/MatriculeAutocomplete';

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
  9:  { anfo: 35, tovex: 2.6, ammorces: 26, plannedHoles: 26 },
  12: { anfo: 40, tovex: 3.2, ammorces: 32, plannedHoles: 32 },
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
  const defaultCounts = DEFAULT_ROWS_PER_SECTOR[post] || { 'Imiter 2': 2, 'Imiter 1': 2, 'Imiter Est': 2 };
  const result: any[] = [];
  const unassignedLoaded = [...loadedRows];

  sectors.forEach(sec => {
    // Find already stored rows for this sector
    const matchingRows = unassignedLoaded.filter(row => {
      if (row.sectorGroup === sec) return true;
      const ch = chantiersList.find(c => c.id === row.chantierId);
      return ch?.sector === sec;
    });

    // Remove them from unassigned
    matchingRows.forEach(row => {
      const idx = unassignedLoaded.indexOf(row);
      if (idx !== -1) unassignedLoaded.splice(idx, 1);
    });

    const minCount = defaultCounts[sec] || 2;
    const finalSectorRows = [...matchingRows];
    while (finalSectorRows.length < minCount) {
      if (type === 'minage') {
        const explosives = computeExplosives(12, 1);
        finalSectorRows.push({
          chantierId: '', chiefMatricule: '', chiefName: '', minerMatricule: '', minerName: '',
          assistantMatricule: '', assistantName: '', gallerySize: 12, plannedHoles: explosives.plannedHoles, realHoles: explosives.plannedHoles,
          plannedRounds: 1, realRounds: 1, meterage: 1.7, anfo: explosives.anfo, tovex: explosives.tovex, ammorces: explosives.ammorces, remarks: '',
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

    finalSectorRows.forEach(r => {
      r.sectorGroup = sec;
    });

    result.push(...finalSectorRows);
  });

  return result;
};

export const Planning: React.FC = () => {
  const { user } = useAuth();

  // App views: 'sheet' (Excel Mode) or 'history' (Consolidated lists)
  const [viewMode, setViewMode] = useState<'sheet' | 'history'>('sheet');
  const [activeSheetTab, setActiveSheetTab] = useState<'minage' | 'deblayage' | 'extraction' | 'maintenance'>('minage');

  // Core planning filters: default date is tomorrow (addDays)
  const [selectedDate, setSelectedDate] = useState(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
  const [selectedPost, setSelectedPost] = useState<'Poste 1' | 'Poste 2' | 'Poste 3'>('Poste 1');

  // Reference tables from Firebase
  const [planningsHistory, setPlanningsHistory] = useState<any[]>([]);
  const [chantiers, setChantiers] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [engines, setEngines] = useState<any[]>([]);
  const [platformSettings, setPlatformSettings] = useState<{
    sectors: string[];
    engines: string[];
    oils: string[];
  }>({
    sectors: ['Imiter 1', 'Imiter 2', 'Imiter Est'],
    engines: ['ST2D', 'ST2G 1', 'ST2G 3', 'ST2G 4', 'ST2G 5', 'ST2G6'],
    oils: ['Huile Moteur 15W40', 'Huile Hydraulique HV46', 'Huile Hydraulique HV68', 'Huile Transmission SAE30', 'Huile Transmission SAE50', 'Graisse Extrême Pression']
  });
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

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
  const [extractionRows, setExtractionRows] = useState<ExcelExtraction[]>([]);
  const [maintenanceRows, setMaintenanceRows] = useState<ExcelMaintenance[]>([]);

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
        if (dData.postes) {
          Object.entries(dData.postes).forEach(([pKey, pVal]: [string, any]) => {
            const pName = pKey === 'poste1' ? 'Poste 1' : pKey === 'poste2' ? 'Poste 2' : 'Poste 3';
            historyList.push({
              id: `${dDoc.id}_${pKey}`,
              date,
              post: pName,
              status: pVal.status || mainStatus,
              minageRows: pVal.minage || [],
              deblayageRows: pVal.deblayage || [],
              extractionRows: pVal.extraction || [],
              maintenanceRows: pVal.maintenance || [],
              operator: dData.operator || pVal.operator || 'SMI USER',
              timestamp: dData.timestamp || pVal.timestamp || ''
            });
          });
        }
      });
      // Sort history list by date desc, then post asc
      historyList.sort((a, b) => {
        const dateCompare = b.date.localeCompare(a.date);
        if (dateCompare !== 0) return dateCompare;
        return a.post.localeCompare(b.post);
      });
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
          oils: data.oils || ['Huile Moteur 15W40', 'Huile Hydraulique HV46', 'Huile Hydraulique HV68', 'Huile Transmission SAE30', 'Huile Transmission SAE50', 'Graisse Extrême Pression']
        });
      }
    }, (err) => {
      console.warn("Permission logs on Snapshot setting platform:", err.message);
    });

    return () => { unsubHist(); unsubChan(); unsubRH(); unsubEngs(); unsubSettings(); };
  }, []);

  // Sync Excel grid content whenever selected date, shift, or catalogs change
  useEffect(() => {
    loadPlanningWorkbook();
  }, [selectedDate, selectedPost, employees, chantiers, engines, platformSettings]);

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

      const loadedMinageByPost: Record<'Poste 1' | 'Poste 2' | 'Poste 3', ExcelMinage[]> = { 'Poste 1': [], 'Poste 2': [], 'Poste 3': [] };
      const loadedDeblayageByPost: Record<'Poste 1' | 'Poste 2' | 'Poste 3', ExcelDeblayage[]> = { 'Poste 1': [], 'Poste 2': [], 'Poste 3': [] };

      const posts: ('Poste 1' | 'Poste 2' | 'Poste 3')[] = ['Poste 1', 'Poste 2', 'Poste 3'];

      if (docSnap.exists()) {
        const docData = docSnap.data();
        posts.forEach(p => {
          const pk = p === 'Poste 1' ? 'poste1' : p === 'Poste 2' ? 'poste2' : 'poste3';
          const pData = docData.postes?.[pk];
          loadedMinageByPost[p] = ensureMinimumRows(pData?.minage || [], 'minage', p, chantiers);
          loadedDeblayageByPost[p] = ensureMinimumRows(pData?.deblayage || [], 'deblayage', p, chantiers);
        });

        setMinageRowsByPost(loadedMinageByPost);
        setDeblayageRowsByPost(loadedDeblayageByPost);

        const currentPKey = selectedPost === 'Poste 1' ? 'poste1' : selectedPost === 'Poste 2' ? 'poste2' : 'poste3';
        const currentPostData = docData.postes?.[currentPKey];
        const currentDefaults = POST_HOURS[selectedPost];
        setExtractionRows(sanitizeExtractionRows(currentPostData?.extraction, currentDefaults));
        setMaintenanceRows(currentPostData?.maintenance || []);
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
      });

      setMinageRowsByPost(loadedMinageByPost);
      setDeblayageRowsByPost(loadedDeblayageByPost);

      const currentDefaults = POST_HOURS[selectedPost];
      const initialExtraction: ExcelExtraction[] = [
        {
          chantierName: 'Extraction Bure N340 Imiter Est',
          treuilliste: '',
          equipier1: '',
          equipier2: '',
          equipier3: '',
          equipier4: '',
          wagonsTarget: 48,
          wagonsActual: 0,
          sterileBureImiterEst: 0,
          startTime: currentDefaults.start,
          endTime: currentDefaults.end,
          remarks: ''
        }
      ];

      const initialMaintenance: ExcelMaintenance[] = [
        { roleLabel: 'MÉCANICIEN 1', agentMatricule: '', agentName: '', engineId: '', engineCode: '', hoursSpent: currentDefaults.duration, workDescription: '' },
        { roleLabel: 'MÉCANICIEN 2', agentMatricule: '', agentName: '', engineId: '', engineCode: '', hoursSpent: currentDefaults.duration, workDescription: '' },
        { roleLabel: 'MÉCANICIEN 3', agentMatricule: '', agentName: '', engineId: '', engineCode: '', hoursSpent: currentDefaults.duration, workDescription: '' },
        { roleLabel: 'MÉCANICIEN 4', agentMatricule: '', agentName: '', engineId: '', engineCode: '', hoursSpent: currentDefaults.duration, workDescription: '' },
        { roleLabel: 'CHAUDRONNIER', agentMatricule: '', agentName: '', engineId: '', engineCode: '', hoursSpent: currentDefaults.duration, workDescription: '' },
        { roleLabel: 'ÉLECTRICIEN', agentMatricule: '', agentName: '', engineId: '', engineCode: '', hoursSpent: currentDefaults.duration, workDescription: '' },
      ];

      setExtractionRows(initialExtraction);
      setMaintenanceRows(initialMaintenance);
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
    if (e.key === 'Enter' || e.key === 'Tab') {
      e.preventDefault();
      const current = e.target as HTMLElement;
      const container = current.closest('[data-card-container="true"]');
      if (!container) return;
      const inputs = Array.from(
        container.querySelectorAll('input:not([disabled]), select:not([disabled])')
      ) as HTMLElement[];
      const idx = inputs.indexOf(current);
      if (idx !== -1) {
        const nextIdx = e.shiftKey ? idx - 1 : idx + 1;
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
      const computed = computeExplosives(clone[flatIdx].gallerySize, clone[flatIdx].plannedRounds);
      clone[flatIdx].plannedHoles = computed.plannedHoles;
      clone[flatIdx].anfo = computed.anfo;
      clone[flatIdx].tovex = computed.tovex;
      clone[flatIdx].ammorces = computed.ammorces;
    }
    setMinageRowsByPost(prev => ({ ...prev, [post]: clone }));
  };

  const updateMinageCell = (post: 'Poste 1' | 'Poste 2' | 'Poste 3', index: number, field: keyof ExcelMinage, value: any) => {
    const clone = [...(minageRowsByPost[post] || [])];
    if (!clone[index]) return;
    clone[index] = { ...clone[index], [field]: value };
    
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
    if (field === 'plannedRounds') {
      clone[index].meterage = Number(value) * 1.7;
    }

    // Automatically compute explosives when gallerySize or plannedRounds change, unless override is active
    if (field === 'gallerySize' || field === 'plannedRounds') {
      if (!clone[index].explosivesManualOverride) {
        const computed = computeExplosives(clone[index].gallerySize, clone[index].plannedRounds);
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

  const updateExtractionCell = (index: number, field: keyof ExcelExtraction, value: any) => {
    const clone = [...extractionRows];
    clone[index] = { ...clone[index], [field]: value };
    setExtractionRows(clone);
  };

  const updateMaintenanceCell = (index: number, field: keyof ExcelMaintenance, value: any) => {
    const clone = [...maintenanceRows];
    clone[index] = { ...clone[index], [field]: value };

    if (field === 'agentMatricule') {
      const emp = employees.find(e => e.matricule?.toUpperCase() === String(value).trim().toUpperCase());
      clone[index].agentName = emp ? `${emp.nom} ${emp.prenom}` : 'Inconnu';
    }
    if (field === 'engineId') {
      clone[index].engineCode = String(value);
    }
    setMaintenanceRows(clone);
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
    let targetRow = rowIndex;
    let targetCol = colIndex;

    if (e.key === 'ArrowUp') {
      e.preventDefault();
      targetRow = rowIndex - 1;
    } else if (e.key === 'ArrowDown' || e.key === 'Enter') {
      e.preventDefault();
      targetRow = rowIndex + 1;
    } else if (e.key === 'ArrowLeft') {
      targetCol = colIndex - 1;
    } else if (e.key === 'ArrowRight') {
      targetCol = colIndex + 1;
    } else {
      return;
    }

    focusOnCell(targetRow, targetCol);
  };

  const getMobilisedMatricules = () => {
    const list: { matricule: string; name: string; role: string; sheet: string; location: string }[] = [];
    const posts: ('Poste 1' | 'Poste 2' | 'Poste 3')[] = ['Poste 1', 'Poste 2', 'Poste 3'];

    posts.forEach(p => {
      minageRowsByPost[p].forEach((r, i) => {
        const minageChantierName = chantiers.find(c => c.id === r.chantierId)?.name || `Ligne ${i + 1}`;
        if (r.chiefMatricule) {
          list.push({ matricule: r.chiefMatricule.trim().toUpperCase(), name: r.chiefName, role: 'Chef de Poste', sheet: `Minage (${p})`, location: minageChantierName });
        }
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
    });

    extractionRows.forEach((r) => {
      const loc = 'Bure N340';
      if (r.treuilliste) {
        list.push({ matricule: r.treuilliste.trim().toUpperCase(), name: getEmployeeName(r.treuilliste).split(' (')[0], role: 'Treuilliste', sheet: `Extraction (${selectedPost})`, location: loc });
      }
      if (r.equipier1) {
        list.push({ matricule: r.equipier1.trim().toUpperCase(), name: getEmployeeName(r.equipier1).split(' (')[0], role: 'Équipier 1', sheet: `Extraction (${selectedPost})`, location: loc });
      }
      if (r.equipier2) {
        list.push({ matricule: r.equipier2.trim().toUpperCase(), name: getEmployeeName(r.equipier2).split(' (')[0], role: 'Équipier 2', sheet: `Extraction (${selectedPost})`, location: loc });
      }
      if (r.equipier3) {
        list.push({ matricule: r.equipier3.trim().toUpperCase(), name: getEmployeeName(r.equipier3).split(' (')[0], role: 'Équipier 3', sheet: `Extraction (${selectedPost})`, location: loc });
      }
      if (r.equipier4) {
        list.push({ matricule: r.equipier4.trim().toUpperCase(), name: getEmployeeName(r.equipier4).split(' (')[0], role: 'Équipier 4', sheet: `Extraction (${selectedPost})`, location: loc });
      }
    });

    maintenanceRows.forEach((r) => {
      if (r.agentMatricule) {
        list.push({ matricule: r.agentMatricule.trim().toUpperCase(), name: r.agentName, role: r.roleLabel, sheet: `Maintenance (${selectedPost})`, location: r.engineCode || 'Fixe' });
      }
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
      plannedRounds: 1, realRounds: 1, meterage: 1.7, anfo: defaultExplosives.anfo, tovex: defaultExplosives.tovex, ammorces: defaultExplosives.ammorces, remarks: '',
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

  const duplicatePreviousWeek = async () => {
    setLoading(true);
    try {
      const parts = selectedDate.split('-');
      if (parts.length !== 3) {
        alert("Date non valide.");
        setLoading(false);
        return;
      }
      const sourceDateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      const targetDateObj = addDays(sourceDateObj, -7);
      const previousWeekDateStr = format(targetDateObj, 'yyyy-MM-dd');

      const docRef = doc(db, 'daily_planning_sheets', previousWeekDateStr);
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        alert(`Aucune planification trouvée pour la semaine précédente (J-7 : ${previousWeekDateStr}).`);
        setLoading(false);
        return;
      }

      const docData = docSnap.data();

      // Rotating mapping:
      // Target Poste 1 ← Source J-7 Poste 3 (poste3)
      // Target Poste 2 ← Source J-7 Poste 1 (poste1)
      // Target Poste 3 ← Source J-7 Poste 2 (poste2)
      const postMapping: Record<'Poste 1' | 'Poste 2' | 'Poste 3', string> = {
        'Poste 1': 'poste3',
        'Poste 2': 'poste1',
        'Poste 3': 'poste2'
      };

      const clonedMinage: Record<'Poste 1' | 'Poste 2' | 'Poste 3', ExcelMinage[]> = { 'Poste 1': [], 'Poste 2': [], 'Poste 3': [] };
      const clonedDeblayage: Record<'Poste 1' | 'Poste 2' | 'Poste 3', ExcelDeblayage[]> = { 'Poste 1': [], 'Poste 2': [], 'Poste 3': [] };
      const clonedSectorChiefs: Record<'Poste 1' | 'Poste 2' | 'Poste 3', Record<'Imiter 2' | 'Imiter 1' | 'Imiter Est', string>> = {
        'Poste 1': { 'Imiter 2': '', 'Imiter 1': '', 'Imiter Est': '' },
        'Poste 2': { 'Imiter 2': '', 'Imiter 1': '', 'Imiter Est': '' },
        'Poste 3': { 'Imiter 2': '', 'Imiter 1': '', 'Imiter Est': '' }
      };

      const posts: ('Poste 1' | 'Poste 2' | 'Poste 3')[] = ['Poste 1', 'Poste 2', 'Poste 3'];

      posts.forEach(p => {
        const srcKey = postMapping[p];
        const srcData = docData.postes?.[srcKey];
        if (srcData) {
          // Clone Minage
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

          // Clone Deblayage
          clonedDeblayage[p] = (srcData.deblayage || []).map((row: ExcelDeblayage) => {
            const finalRow = { ...row };
            if (row.driverMatricule) {
              const emp = employees.find(e => e.matricule?.toUpperCase() === row.driverMatricule.toUpperCase());
              finalRow.driverName = emp ? `${emp.nom} ${emp.prenom}` : 'Inconnu';
            }
            return finalRow;
          });
          clonedDeblayage[p] = ensureMinimumRows(clonedDeblayage[p], 'deblayage', p, chantiers);

          // Clone Sector Chiefs
          const srcSectorChiefs = (docData.sectorChiefs || {})[srcKey] || {};
          clonedSectorChiefs[p] = {
            'Imiter 2': srcSectorChiefs['Imiter 2'] || '',
            'Imiter 1': srcSectorChiefs['Imiter 1'] || '',
            'Imiter Est': srcSectorChiefs['Imiter Est'] || ''
          };
        } else {
          clonedMinage[p] = ensureMinimumRows([], 'minage', p, chantiers);
          clonedDeblayage[p] = ensureMinimumRows([], 'deblayage', p, chantiers);
        }
      });

      setMinageRowsByPost(clonedMinage);
      setDeblayageRowsByPost(clonedDeblayage);
      setSectorChiefs(clonedSectorChiefs);

      // Current active selectedPost specifics (Extraction & Maintenance)
      const currentSrcKey = postMapping[selectedPost];
      const currentSrcData = docData.postes?.[currentSrcKey];
      if (currentSrcData) {
        if (currentSrcData.extraction && currentSrcData.extraction.length > 0) {
          setExtractionRows(sanitizeExtractionRows(currentSrcData.extraction, POST_HOURS[selectedPost]));
        }
        if (currentSrcData.maintenance && currentSrcData.maintenance.length > 0) {
          const clonedMaint = currentSrcData.maintenance.map((row: ExcelMaintenance) => {
            const finalRow = { ...row };
            if (row.agentMatricule) {
              const emp = employees.find(e => e.matricule?.toUpperCase() === row.agentMatricule.toUpperCase());
              finalRow.agentName = emp ? `${emp.nom} ${emp.prenom}` : 'Inconnu';
            }
            return finalRow;
          });
          setMaintenanceRows(clonedMaint);
        }
      }

      alert(`Ordonnancement complet du ${previousWeekDateStr} dupliqué et adapté (rotation intelligente des 3 postes effectuée) !`);
    } catch (err) {
      console.error("Erreur de duplication : ", err);
      alert("Une erreur est survenue lors de la duplication.");
    } finally {
      setLoading(false);
    }
  };

  // Master Workbook Persistence and Sync to granular discrete planning collection
  const savePlanningWorkbook = async () => {
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
        
        // Synthesize and attach chiefs row-by-row for backward-compatibility with downstream pipelines
        const pMinageObj = minageRowsByPost[p].map(r => {
          const sec = r.sectorGroup || 'Imiter 2';
          const chiefM = chiefMat[sec] || '';
          const emp = employees.find(e => e.matricule?.toUpperCase() === chiefM.trim().toUpperCase());
          return {
            ...r,
            chiefMatricule: chiefM,
            chiefName: emp ? `${emp.nom} ${emp.prenom}` : ''
          };
        });

        const pMinage = pMinageObj.filter(r => r.chantierId !== '');
        const pDeblayage = deblayageRowsByPost[p].filter(r => r.driverMatricule !== '');
        
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
          deblayage: pDeblayage
        };

        if (p === selectedPost) {
          newPostesObj[pk].extraction = extractionRows;
          newPostesObj[pk].maintenance = maintenanceRows.filter(r => r.agentMatricule !== '');
        }
      });

      const updateData = {
        date: selectedDate,
        status: 'planifie',
        operator: user?.email || 'Planificateur de Direction SMI',
        timestamp: new Date().toISOString(),
        sectorChiefs: sectorChiefs,
        postes: newPostesObj
      };

      await setDoc(docRef, updateData, { merge: true });

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
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch (err) {
      console.error("Erreur de sauvegarde de planification :", err);
      setSaveStatus('error');
    }
  };

  return (
    <div className="space-y-4">
      {/* Dense industrial header bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b-2 border-[#141414] pb-2 gap-2">
        <div>
          <h3 className="text-xl font-black tracking-tight text-[#141414] uppercase flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-[#00BFFF]" /> Planification-Ordonnancement SMI
          </h3>
          <p className="text-[9px] font-bold uppercase tracking-wider text-gray-500">
            Cahier de Chargement Théorique • Alignement optimal des équipes et chantiers du fond
          </p>
        </div>

        {/* View Toggle tabs */}
        <div className="flex gap-1.5 p-1 bg-[#141414]/5">
          <button 
            onClick={() => setViewMode('sheet')}
            className={`px-3 py-1 font-black text-[9px] uppercase tracking-wider transition-all border ${
              viewMode === 'sheet' 
                ? 'bg-[#141414] text-white border-[#141414]' 
                : 'bg-white text-gray-700 border-[#141414]/10 hover:bg-gray-50'
            }`}
          >
            🟩 Planification interactive
          </button>
          <button 
            onClick={() => setViewMode('history')}
            className={`px-3 py-1 font-black text-[9px] uppercase tracking-wider transition-all border ${
              viewMode === 'history' 
                ? 'bg-[#141414] text-white border-[#141414]' 
                : 'bg-white text-gray-700 border-[#141414]/10 hover:bg-gray-50'
            }`}
          >
            📋 Cahiers planifiés ({planningsHistory.length})
          </button>
        </div>
      </div>

      {/* Date & Shift workbook controller */}
      <div className="bg-[#141414] text-white p-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-[#00BFFF]" />
            <span className="text-[9px] font-black uppercase text-white/50">Plan théorique du :</span>
            <input 
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="bg-white/10 text-white font-black text-[10px] uppercase border-0 outline-none px-2 py-1 focus:bg-white focus:text-[#141414]"
            />
          </div>

          {(activeSheetTab === 'minage' || activeSheetTab === 'deblayage') ? (
            <div className="flex items-center gap-2 border-l border-white/20 pl-4">
              <span className="text-[9px] font-black uppercase text-white/50">Poste :</span>
              <span className="bg-[#00BFFF]/20 text-[#00BFFF] border border-[#00BFFF]/30 font-black text-[9px] uppercase tracking-wider px-2 py-1 rounded-sm">
                📚 3 postes synchronisés en continu
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-2 border-l border-white/20 pl-4">
              <span className="text-[9px] font-black uppercase text-white/50">Poste :</span>
              <select 
                value={selectedPost}
                onChange={e => setSelectedPost(e.target.value as any)}
                className="bg-white/10 text-white font-black text-[10px] uppercase border-0 outline-none px-2 py-1 focus:bg-white focus:text-[#141414] appearance-none"
              >
                <option value="Poste 1" className="text-black">POSTE 1 (MATIN)</option>
                <option value="Poste 2" className="text-black">POSTE 2 (MIDI)</option>
                <option value="Poste 3" className="text-black">POSTE 3 (NUIT)</option>
              </select>
            </div>
          )}
        </div>

        {viewMode === 'sheet' && (
          <div className="flex items-center gap-2">
            <button
              onClick={duplicatePreviousWeek}
              className="bg-white/10 hover:bg-white/20 text-white px-3 py-1 text-[9px] font-bold uppercase transition-all flex items-center gap-1.5"
              title="Importer et adapter la planification de la semaine passée J-7"
            >
              <Copy className="w-3 h-3 text-[#00BFFF]" /> Dupliquer J-7 (Intelligent)
            </button>
            <button
              onClick={loadPlanningWorkbook}
              className="bg-white/10 hover:bg-white/20 text-white px-3 py-1 text-[9px] font-bold uppercase transition-all flex items-center gap-1.5"
              title="Réinitialiser ou recharger depuis le cloud"
            >
              <RotateCcw className="w-3 h-3 text-[#00BFFF]" /> Recharger
            </button>
            <button
              onClick={savePlanningWorkbook}
              disabled={saveStatus === 'saving'}
              className="bg-[#00BFFF] hover:bg-[#00BFFF]/90 text-white font-black px-4 py-1.5 text-[9px] uppercase tracking-wider flex items-center gap-2 transition-all shadow-md active:translate-y-px"
            >
              <Save className="w-3.5 h-3.5" /> 
              {saveStatus === 'saving' ? 'Enregistrement...' : saveStatus === 'saved' ? '✓ Enregistré !' : 'Graver l\'Ordonnancement'}
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="py-20 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest animate-pulse">
          Synchronisation du planning avec Firestore...
        </div>
      ) : viewMode === 'sheet' ? (
        <div className="space-y-4">
          
          {/* SPREADSHEET WORKSPACE */}
          <div className="w-full space-y-3 bg-white border border-[#141414] p-3 shadow-md">
            
            {/* Sheet Tabs */}
            <div className="flex items-center border-b border-gray-200 pb-1.5 gap-1">
              {[
                { id: 'minage', label: '🔨 Sheet 1 - Alignement Forage & Minage', activeColor: 'border-b-2 border-red-600 font-black text-red-700' },
                { id: 'deblayage', label: '🚜 Sheet 2 - Programme Déblayage & Vol', activeColor: 'border-b-2 border-[#00BFFF] font-black text-[#00BFFF]' },
                { id: 'extraction', label: '🚃 Sheet 3 - Objectifs Extraction', activeColor: 'border-b-2 border-green-600 font-black text-green-700' },
                { id: 'maintenance', label: '🔧 Sheet 4 - Brigade Maintenance Programmée', activeColor: 'border-b-2 border-purple-600 font-black text-purple-700' },
              ].map(sheet => (
                <button
                  key={sheet.id}
                  onClick={() => setActiveSheetTab(sheet.id as any)}
                  className={`px-3 py-1 text-[9px] uppercase tracking-wider transition-colors border-r border-gray-100 ${
                    activeSheetTab === sheet.id 
                      ? sheet.activeColor + ' bg-gray-50 font-black' 
                      : 'text-gray-400 hover:text-[#141414]'
                  }`}
                >
                  {sheet.label}
                </button>
              ))}
            </div>

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
                      <div key={p} className="border border-[#141414]/15 bg-white p-3 shadow-sm rounded-sm">
                        {/* Shifty/Post block banner */}
                        <div className="bg-[#8B0000]/10 border-l-4 border-[#8B0000] p-2.5 mb-3 flex items-center justify-between">
                          <div>
                            <h4 className="text-xs font-black uppercase text-[#8B0000] tracking-wider flex items-center gap-1.5">
                              🏭 {p} ({postHoursLabels[p]})
                            </h4>
                            <p className="text-[9px] font-bold text-gray-500 uppercase">
                              Cadence Forage, Chargement et Sautage théorique
                            </p>
                          </div>
                          <span className="text-[9.5px] font-black uppercase text-[#8B0000] bg-white border border-[#8B0000]/20 px-2 py-0.5 rounded-sm">
                            Saisie Active
                          </span>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse border border-[#141414]/25 text-[10.5px]">
                            <thead>
                              <tr className="bg-[#141414] text-white text-[8px] font-black uppercase tracking-wider sticky top-0 z-10">
                                <th className="p-1 border border-white/10 text-center w-8 select-none">#</th>
                                <th className="p-1 border border-white/10 min-w-[124px]">Chantier</th>
                                <th className="p-1 border border-white/10 min-w-[144px]">Mineur (Matricule / Nom)</th>
                                <th className="p-1 border border-white/10 min-w-[144px]">Aide-Mineur</th>
                                <th className="p-1 border border-white/10 w-20 text-center">Section</th>
                                <th className="p-1 border border-white/10 w-16 text-center">Volées prévues</th>
                                <th className="p-1 border border-white/10 w-20 text-center">Mètres prévus</th>
                                <th className="p-1 border border-white/10 w-16 text-center">Trous prévus</th>
                                <th className="p-1 border border-white/10 w-16 text-center">ANFO (kg)</th>
                                <th className="p-1 border border-white/10 w-16 text-center">Tovex (kg)</th>
                                <th className="p-1 border border-white/10 w-16 text-center">Amorces</th>

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
                                    <tr className="bg-neutral-100 border-y border-[#141414]/20 select-none">
                                      <td colSpan={11} className="py-2 px-2 bg-neutral-100">
                                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                          <div className="flex flex-wrap items-center gap-2">
                                            <span className="inline-block px-1.5 py-0.5 bg-[#8B0000] text-white text-[8px] font-black uppercase tracking-wider">
                                              {sec}
                                            </span>
                                            <span className="text-[10px] font-black text-[#141414] uppercase">
                                              {sec === 'Autres / Non classés' ? 'Autres chantiers non classés' : `Secteur ${sec}`} • {sectorRowsWithIdx.filter(it => it.row.chantierId).length} chantiers prévus
                                            </span>
                                          </div>
                                          
                                          {/* Sector Chief Selection */}
                                          {sec !== 'Autres / Non classés' && (
                                            <div className="flex items-center gap-2 bg-white border border-[#141414]/20 px-2 py-1 rounded-sm shadow-sm">
                                              <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">
                                                👨‍✈️ Chef de Secteur / Poste :
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
                                        </div>
                                      </td>
                                    </tr>

                                    {/* Group matching rows */}
                                    {sectorRowsWithIdx.map(({ row, idx: flatIdx }) => {
                                      const globalIdx = globalIdxCounter++;
                                      const options = chantiers.filter(c => c.sector === sec || sec === 'Autres / Non classés');
                                      const hasChantier = options.some(o => o.id === row.chantierId);
                                      const fallbackChantier = row.chantierId && !hasChantier ? chantiers.find(c => c.id === row.chantierId) : null;

                                      return (
                                        <tr 
                                          key={flatIdx}
                                          className="border-b border-[#141414]/10 hover:bg-[#00BFFF]/5 transition-colors"
                                        >
                                          {/* Line Index & Delete Action */}
                                          <td className="p-1 border border-[#141414]/10 text-center text-[10px] text-gray-500 font-mono w-8 select-none relative group">
                                            <span className="group-hover:opacity-0 transition-opacity">{flatIdx + 1}</span>
                                            {isMinageRowRemovable(p, flatIdx) && (
                                              <button
                                                type="button"
                                                onClick={() => deleteMinageRowAt(p, flatIdx)}
                                                className="absolute inset-x-0.5 top-0.5 bottom-0.5 bg-red-100 hover:bg-red-200 text-[#8B0000] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded cursor-pointer text-[10px] font-black border-none outline-none"
                                                title="Retirer cette ligne"
                                              >
                                                🗑️
                                              </button>
                                            )}
                                          </td>

                                          {/* Chantier dropdown selection */}
                                          <td data-row={globalIdx} data-col={0} className="p-1 border border-[#141414]/10 min-w-[124px] focus-within:ring-2 focus-within:ring-[#00BFFF] focus-within:ring-inset focus-within:bg-[#00BFFF]/5">
                                            <select
                                              value={row.chantierId}
                                              onChange={e => updateMinageCell(p, flatIdx, 'chantierId', e.target.value)}
                                              onKeyDown={makeExcelKeyHandler(globalIdx, 0)}
                                              className="w-full bg-transparent border-0 font-bold p-0 text-[10.5px] uppercase outline-none"
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
                                          <td data-row={globalIdx} data-col={1} className="p-0.5 border border-[#141414]/10 min-w-[180px] focus-within:ring-2 focus-within:ring-[#00BFFF] focus-within:ring-inset focus-within:bg-[#00BFFF]/5">
                                            <MatriculeAutocomplete
                                              value={row.minerMatricule}
                                              onChange={(matricule) => updateMinageCell(p, flatIdx, 'minerMatricule', matricule)}
                                              employees={employees}
                                              sector={sec !== 'Autres / Non classés' ? sec : undefined}
                                              fonctions={['MINEUR']}
                                              post={p}
                                              placeholder="M-..."
                                              onKeyDown={makeExcelKeyHandler(globalIdx, 1)}
                                            />
                                          </td>

                                          {/* Aide-Mineur */}
                                          <td data-row={globalIdx} data-col={2} className="p-0.5 border border-[#141414]/10 min-w-[180px] focus-within:ring-2 focus-within:ring-[#00BFFF] focus-within:ring-inset focus-within:bg-[#00BFFF]/5">
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

                                          {/* Section */}
                                          <td data-row={globalIdx} data-col={3} className="p-1 border border-[#141414]/10 w-20 text-center focus-within:ring-2 focus-within:ring-[#00BFFF] focus-within:ring-inset focus-within:bg-[#00BFFF]/5">
                                            <select
                                              value={row.gallerySize}
                                              onChange={e => updateMinageCell(p, flatIdx, 'gallerySize', Number(e.target.value))}
                                              onKeyDown={makeExcelKeyHandler(globalIdx, 3)}
                                              className="w-full bg-transparent border-none text-center outline-none font-bold"
                                            >
                                              <option value={9}>9 m²</option>
                                              <option value={12}>12 m²</option>
                                            </select>
                                          </td>

                                          {/* Volées prévues */}
                                          <td data-row={globalIdx} data-col={4} className="p-1 border border-[#141414]/10 w-16 text-center focus-within:ring-2 focus-within:ring-[#00BFFF] focus-within:ring-inset focus-within:bg-[#00BFFF]/5">
                                            <input
                                              type="number"
                                              value={row.plannedRounds}
                                              onChange={e => updateMinageCell(p, flatIdx, 'plannedRounds', Number(e.target.value))}
                                              onKeyDown={makeExcelKeyHandler(globalIdx, 4)}
                                              className="w-full bg-transparent text-center font-bold text-xs outline-none border-0"
                                            />
                                          </td>

                                          {/* Mètres prévus */}
                                          <td className="p-1 border border-[#141414]/10 w-20 text-center font-mono font-bold text-slate-500 bg-[#141414]/5 select-none font-black">
                                            {row.meterage.toFixed(1)} m
                                          </td>

                                          {/* Trous prévus */}
                                          <td data-row={globalIdx} data-col={5} className="p-1 border border-[#141414]/10 w-16 text-center focus-within:ring-2 focus-within:ring-[#00BFFF] focus-within:ring-inset focus-within:bg-[#00BFFF]/5">
                                            {row.explosivesManualOverride ? (
                                              <div className="flex items-center justify-center gap-1">
                                                <input
                                                  type="number"
                                                  value={row.plannedHoles}
                                                  onChange={e => updateMinageCell(p, flatIdx, 'plannedHoles', Number(e.target.value))}
                                                  onKeyDown={makeExcelKeyHandler(globalIdx, 5)}
                                                  className="w-full bg-transparent text-center font-mono font-bold text-xs outline-none border-none py-0.5"
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
                                                className="cursor-pointer font-bold text-xs text-center select-none py-1 hover:bg-[#00BFFF]/10 w-full text-slate-800"
                                                title="Double-clic pour modifier manuellement"
                                              >
                                                {row.plannedHoles}
                                              </div>
                                            )}
                                          </td>

                                          {/* ANFO */}
                                          <td data-row={globalIdx} data-col={6} className="p-1 border border-[#141414]/10 w-16 text-center focus-within:ring-2 focus-within:ring-[#00BFFF] focus-within:ring-inset focus-within:bg-[#00BFFF]/5">
                                            {row.explosivesManualOverride ? (
                                              <div className="flex items-center justify-center gap-1">
                                                <input
                                                  type="number"
                                                  value={row.anfo}
                                                  onChange={e => updateMinageCell(p, flatIdx, 'anfo', Number(e.target.value))}
                                                  onKeyDown={makeExcelKeyHandler(globalIdx, 6)}
                                                  className="w-full bg-transparent text-center font-mono font-bold text-xs outline-none border-none py-0.5"
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
                                                className="cursor-pointer font-bold text-xs text-center select-none py-1 hover:bg-[#00BFFF]/10 w-full text-slate-800"
                                                title="Double-clic pour modifier manuellement"
                                              >
                                                {row.anfo}
                                              </div>
                                            )}
                                          </td>

                                          {/* Tovex */}
                                          <td data-row={globalIdx} data-col={7} className="p-1 border border-[#141414]/10 w-16 text-center focus-within:ring-2 focus-within:ring-[#00BFFF] focus-within:ring-inset focus-within:bg-[#00BFFF]/5">
                                            {row.explosivesManualOverride ? (
                                              <div className="flex items-center justify-center gap-1">
                                                <input
                                                  type="number"
                                                  step="0.1"
                                                  value={row.tovex}
                                                  onChange={e => updateMinageCell(p, flatIdx, 'tovex', Number(e.target.value))}
                                                  onKeyDown={makeExcelKeyHandler(globalIdx, 7)}
                                                  className="w-full bg-transparent text-center font-mono font-bold text-xs outline-none border-none py-0.5"
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
                                                className="cursor-pointer font-bold text-xs text-center select-none py-1 hover:bg-[#00BFFF]/10 w-full text-slate-800"
                                                title="Double-clic pour modifier manuellement"
                                              >
                                                {row.tovex.toFixed(1)}
                                              </div>
                                            )}
                                          </td>

                                          {/* Amorces */}
                                          <td data-row={globalIdx} data-col={8} className="p-1 border border-[#141414]/10 w-16 text-center focus-within:ring-2 focus-within:ring-[#00BFFF] focus-within:ring-inset focus-within:bg-[#00BFFF]/5">
                                            {row.explosivesManualOverride ? (
                                              <div className="flex items-center justify-center gap-1">
                                                <input
                                                  type="number"
                                                  value={row.ammorces}
                                                  onChange={e => updateMinageCell(p, flatIdx, 'ammorces', Number(e.target.value))}
                                                  onKeyDown={makeExcelKeyHandler(globalIdx, 8)}
                                                  className="w-full bg-transparent text-center font-mono font-bold text-xs outline-none border-none py-0.5"
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
                                                className="cursor-pointer font-bold text-xs text-center select-none py-1 hover:bg-[#00BFFF]/10 w-full text-slate-800"
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

                                    {/* Row additions footer for sector */}
                                    <tr className="border-b border-[#141414]/10">
                                      <td colSpan={11} className="py-1 px-3 bg-neutral-50/50">
                                        <button
                                          type="button"
                                          onClick={() => addRowToMinageSector(p, sec)}
                                          className="text-[9px] font-black text-[#00BFFF] hover:underline bg-transparent border-none cursor-pointer flex items-center gap-1 uppercase tracking-wider"
                                        >
                                          + Ajouter une ligne de production ({sec})
                                        </button>
                                      </td>
                                    </tr>
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
                      <div key={p} className="border border-[#141414]/15 bg-white p-3 shadow-sm rounded-sm">
                        {/* Shifty/Post block banner */}
                        <div className="bg-[#00BFFF]/10 border-l-4 border-[#00BFFF] p-2.5 mb-3 flex items-center justify-between">
                          <div>
                            <h4 className="text-xs font-black uppercase text-[#00BFFF] tracking-wider flex items-center gap-1.5">
                              🚜 {p} ({postHoursLabels[p]})
                            </h4>
                            <p className="text-[9px] font-bold text-gray-500 uppercase">
                              Déblayage de Front, Nettoyage et Marinage théorique
                            </p>
                          </div>
                          <span className="text-[9.5px] font-black uppercase text-[#00BFFF] bg-white border border-[#00BFFF]/20 px-2 py-0.5 rounded-sm">
                            Saisie Active
                          </span>
                        </div>

                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse border border-[#141414]/25 text-[10.5px]">
                            <thead>
                              <tr className="bg-[#141414] text-white text-[8px] font-black uppercase tracking-wider sticky top-0 z-10">
                                <th className="p-1 border border-white/10 text-center w-8 select-none">#</th>
                                <th className="p-1 border border-white/10 min-w-[124px]">Chantier de nettoyage</th>
                                <th className="p-1 border border-white/10 min-w-[160px]">Conducteur engin (Matricule / Nom)</th>
                                <th className="p-1 border border-white/10 min-w-[140px]">Machine / Engin</th>
                                <th className="p-1 border border-white/10 w-20 text-center">Godets planifiés</th>
                                <th className="p-1 border border-white/10 w-24 text-center">Volume estimé (m³)</th>
                                <th className="p-1 border border-white/10 w-24 text-center">Heures travail</th>

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
                                    <tr className="bg-neutral-100 border-y border-[#141414]/20 select-none">
                                      <td colSpan={7} className="py-1.5 px-2 bg-neutral-100">
                                        <div className="flex items-center gap-2">
                                          <span className="inline-block px-1.5 py-0.5 bg-[#00BFFF] text-white text-[8px] font-black uppercase tracking-wider">
                                            {sec}
                                          </span>
                                          <span className="text-[9px] font-black text-[#141414] uppercase">
                                            {sec === 'Autres / Non classés' ? 'Autres chantiers non classés' : `Secteur ${sec}`} • {sectorRowsWithIdx.filter(it => it.row.chantierId).length} déblayages planifiés
                                          </span>
                                        </div>
                                      </td>
                                    </tr>

                                    {/* Sector matching rows */}
                                    {sectorRowsWithIdx.map(({ row, idx: flatIdx }) => {
                                      const globalIdx = globalIdxCounter++;
                                      const options = chantiers.filter(c => c.sector === sec || sec === 'Autres / Non classés');
                                      const hasChantier = options.some(o => o.id === row.chantierId);
                                      const fallbackChantier = row.chantierId && !hasChantier ? chantiers.find(c => c.id === row.chantierId) : null;

                                      return (
                                        <tr 
                                          key={flatIdx}
                                          className="border-b border-[#141414]/10 hover:bg-[#00BFFF]/5 transition-colors"
                                        >
                                          {/* Line Index & Trash */}
                                          <td className="p-1 border border-[#141414]/10 text-center text-[10px] text-gray-500 font-mono w-8 select-none relative group">
                                            <span className="group-hover:opacity-0 transition-opacity">{flatIdx + 1}</span>
                                            {isDeblayageRowRemovable(p, flatIdx) && (
                                              <button
                                                type="button"
                                                onClick={() => deleteDeblayageRowAt(p, flatIdx)}
                                                className="absolute inset-x-0.5 top-0.5 bottom-0.5 bg-red-100 hover:bg-red-200 text-[#8B0000] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded cursor-pointer text-[10px] font-black border-none outline-none"
                                                title="Retirer cette ligne"
                                              >
                                                🗑️
                                              </button>
                                            )}
                                          </td>

                                          {/* Chantier dropdown selection */}
                                          <td data-row={globalIdx} data-col={0} className="p-1 border border-[#141414]/10 min-w-[124px] focus-within:ring-2 focus-within:ring-[#00BFFF] focus-within:ring-inset focus-within:bg-[#00BFFF]/5">
                                            <select
                                              value={row.chantierId}
                                              onChange={e => updateDeblayageCell(p, flatIdx, 'chantierId', e.target.value)}
                                              onKeyDown={makeExcelKeyHandler(globalIdx, 0)}
                                              className="w-full bg-transparent border-0 font-bold p-0 text-[10.5px] uppercase outline-none"
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

                                          {/* Driver */}
                                          <td data-row={globalIdx} data-col={1} className="p-0.5 border border-[#141414]/10 min-w-[160px] focus-within:ring-2 focus-within:ring-[#00BFFF] focus-within:ring-inset focus-within:bg-[#00BFFF]/5">
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
                                          <td data-row={globalIdx} data-col={2} className="p-1 border border-[#141414]/10 min-w-[140px] focus-within:ring-2 focus-within:ring-[#00BFFF] focus-within:ring-inset focus-within:bg-[#00BFFF]/5">
                                            <select
                                              value={row.engineId}
                                              onChange={e => updateDeblayageCell(p, flatIdx, 'engineId', e.target.value)}
                                              onKeyDown={makeExcelKeyHandler(globalIdx, 2)}
                                              className="w-full bg-transparent border-0 font-bold p-0 text-[10.5px] uppercase outline-none"
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
                                          <td data-row={globalIdx} data-col={3} className="p-1 border border-[#141414]/10 w-20 text-center focus-within:ring-2 focus-within:ring-[#00BFFF] focus-within:ring-inset focus-within:bg-[#00BFFF]/5">
                                            <input
                                              type="number"
                                              value={row.godets === 0 ? '' : row.godets}
                                              placeholder="0"
                                              onChange={e => updateDeblayageCell(p, flatIdx, 'godets', Number(e.target.value))}
                                              onKeyDown={makeExcelKeyHandler(globalIdx, 3)}
                                              className="w-full bg-transparent text-center font-bold text-xs outline-none border-0"
                                            />
                                          </td>

                                          {/* Volume estimated */}
                                          <td className="p-1 border border-[#141414]/10 w-24 text-center font-mono font-bold text-slate-500 bg-[#141414]/5 select-none font-black">
                                            {row.volumeEstimated.toFixed(1)} m³
                                          </td>

                                          {/* Hours worked */}
                                          <td data-row={globalIdx} data-col={4} className="p-1 border border-[#141414]/10 w-24 text-center focus-within:ring-2 focus-within:ring-[#00BFFF] focus-within:ring-inset focus-within:bg-[#00BFFF]/5">
                                            <input
                                              type="number"
                                              step="0.5"
                                              value={row.hoursWorked}
                                              onChange={e => updateDeblayageCell(p, flatIdx, 'hoursWorked', Number(e.target.value))}
                                              onKeyDown={makeExcelKeyHandler(globalIdx, 4)}
                                              className="w-full bg-transparent text-center font-bold text-xs outline-none border-0"
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

                                    {/* Sector addition row */}
                                    <tr className="border-b border-[#141414]/10">
                                      <td colSpan={7} className="py-1 px-3 bg-neutral-50/50">
                                        <button
                                          type="button"
                                          onClick={() => addRowToDeblayageSector(p, sec)}
                                          className="text-[9px] font-black text-[#00BFFF] hover:underline bg-transparent border-none cursor-pointer flex items-center gap-1 uppercase tracking-wider"
                                        >
                                          + Ajouter une ligne de nettoyage ({sec})
                                        </button>
                                      </td>
                                    </tr>
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

            {/* SHEET 3: SINGLE FIXED CARD FOR EXTRACTION */}
            {activeSheetTab === 'extraction' && (() => {
              const row = extractionRows[0] || {
                chantierName: 'Extraction Bure N340 Imiter Est',
                treuilliste: '',
                equipier1: '',
                equipier2: '',
                equipier3: '',
                equipier4: '',
                wagonsTarget: 48,
                sterileBureImiterEst: 0,
                startTime: '08:00',
                endTime: '13:30',
                remarks: ''
              };
              const idx = 0;
              const tName = getEmployeeName(row.treuilliste);
              const eq1Name = getEmployeeName(row.equipier1);
              const eq2Name = getEmployeeName(row.equipier2);
              const eq3Name = getEmployeeName(row.equipier3);
              const eq4Name = getEmployeeName(row.equipier4);
              const avgMin = row.wagonsTarget > 0 ? (360 / row.wagonsTarget) : 0;

              return (
                <div className="max-w-4xl mx-auto">
                  <div 
                    data-card-container="true"
                    className="bg-[#F5F5F0] border-2 border-[#141414] p-6 shadow-[4px_4px_0px_0px_#141414] hover:shadow-[6px_6px_0px_0px_#141414] transition-all duration-150 space-y-6"
                  >
                    {/* Title Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-[#141414] pb-4">
                      <div>
                        <span className="text-[10px] font-black uppercase bg-[#8B0000] text-white px-2 py-1 font-mono tracking-wider">
                          Poste de Treuil Unique
                        </span>
                        <h3 className="text-lg font-black uppercase text-[#141414] mt-1">
                          Extraction Bure N340 Imiter Est
                        </h3>
                      </div>
                      <span className="inline-flex items-center gap-1 text-xs font-black uppercase bg-[#00BFFF] text-white px-3 py-1 border border-[#141414]">
                        📅 Planification du Poste
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Left Block: Personnel Assignations */}
                      <div className="space-y-4">
                        <div className="border-b border-[#141414]/20 pb-1">
                          <h4 className="text-[11px] font-black uppercase text-[#8B0000] tracking-wider select-none">
                            Assignations de l'équipe
                          </h4>
                        </div>

                        {/* Treuilliste */}
                        <div className="bg-white border border-[#141414] p-3 shadow-sm rounded-sm">
                          <label className="block text-[9px] font-black text-slate-500 uppercase leading-none mb-1.5">
                            Treuilliste Prévu
                          </label>
                          <MatriculeAutocomplete
                            value={row.treuilliste || ''}
                            onChange={(matricule) => updateExtractionCell(idx, 'treuilliste', matricule)}
                            employees={employees}
                            fonctions={['TREUILLISTE']}
                            post={selectedPost}
                            placeholder="Saisir matricule..."
                          />
                          <span className="text-[10px] text-sky-700 block truncate max-w-full font-bold mt-1">
                            {tName || '❌ Aucun treuilliste affecté (Libre)'}
                          </span>
                        </div>

                        {/* Crew grid */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-white border border-[#141414] p-3 shadow-sm rounded-sm">
                            <label className="block text-[9px] font-black text-slate-500 uppercase leading-none mb-1.5">
                              Équipier Prévu 1
                            </label>
                            <MatriculeAutocomplete
                              value={row.equipier1 || ''}
                              onChange={(matricule) => updateExtractionCell(idx, 'equipier1', matricule)}
                              employees={employees}
                              fonctions={['OUVRIER']}
                              post={selectedPost}
                              placeholder="Matricule..."
                            />
                            <span className="text-[9px] text-slate-600 block truncate max-w-full font-semibold mt-1">
                              {eq1Name || '(Vide)'}
                            </span>
                          </div>

                          <div className="bg-white border border-[#141414] p-3 shadow-sm rounded-sm">
                            <label className="block text-[9px] font-black text-slate-500 uppercase leading-none mb-1.5">
                              Équipier Prévu 2
                            </label>
                            <MatriculeAutocomplete
                              value={row.equipier2 || ''}
                              onChange={(matricule) => updateExtractionCell(idx, 'equipier2', matricule)}
                              employees={employees}
                              fonctions={['OUVRIER']}
                              post={selectedPost}
                              placeholder="Matricule..."
                            />
                            <span className="text-[9px] text-slate-600 block truncate max-w-full font-semibold mt-1">
                              {eq2Name || '(Vide)'}
                            </span>
                          </div>

                          <div className="bg-white border border-[#141414] p-3 shadow-sm rounded-sm">
                            <label className="block text-[9px] font-black text-slate-500 uppercase leading-none mb-1.5">
                              Équipier Prévu 3
                            </label>
                            <MatriculeAutocomplete
                              value={row.equipier3 || ''}
                              onChange={(matricule) => updateExtractionCell(idx, 'equipier3', matricule)}
                              employees={employees}
                              fonctions={['OUVRIER']}
                              post={selectedPost}
                              placeholder="Matricule..."
                            />
                            <span className="text-[9px] text-slate-600 block truncate max-w-full font-semibold mt-1">
                              {eq3Name || '(Vide)'}
                            </span>
                          </div>

                          <div className="bg-white border border-[#141414] p-3 shadow-sm rounded-sm">
                            <label className="block text-[9px] font-black text-slate-500 uppercase leading-none mb-1.5">
                              Équipier Prévu 4
                            </label>
                            <MatriculeAutocomplete
                              value={row.equipier4 || ''}
                              onChange={(matricule) => updateExtractionCell(idx, 'equipier4', matricule)}
                              employees={employees}
                              fonctions={['OUVRIER']}
                              post={selectedPost}
                              placeholder="Matricule..."
                            />
                            <span className="text-[9px] text-slate-600 block truncate max-w-full font-semibold mt-1">
                              {eq4Name || '(Vide)'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right Block: Metrics & Schedule */}
                      <div className="space-y-4">
                        <div className="border-b border-[#141414]/20 pb-1">
                          <h4 className="text-[11px] font-black uppercase text-[#8B0000] tracking-wider select-none">
                            Objectifs & Horaires
                          </h4>
                        </div>

                        {/* Hours */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-white border border-[#141414] p-3 shadow-sm rounded-sm">
                            <label className="block text-[9px] font-black text-slate-500 uppercase leading-none mb-1.5">
                              Heure Début Prévue
                            </label>
                            <input
                              type="time"
                              value={row.startTime || '08:00'}
                              onChange={e => updateExtractionCell(idx, 'startTime', e.target.value)}
                              className="w-full text-xs font-mono text-slate-850 font-bold outline-none bg-transparent"
                            />
                          </div>

                          <div className="bg-white border border-[#141414] p-3 shadow-sm rounded-sm">
                            <label className="block text-[9px] font-black text-slate-500 uppercase leading-none mb-1.5">
                              Heure Fin Prévue
                            </label>
                            <input
                              type="time"
                              value={row.endTime || '13:30'}
                              onChange={e => updateExtractionCell(idx, 'endTime', e.target.value)}
                              className="w-full text-xs font-mono text-slate-850 font-bold outline-none bg-transparent"
                            />
                          </div>
                        </div>

                        {/* Target numbers */}
                        <div className="grid grid-cols-2 gap-3">
                          <div className="bg-emerald-50 border border-[#141414] p-3 shadow-sm rounded-sm">
                            <label className="block text-[9px] font-black text-emerald-800 uppercase leading-none mb-1.5">
                              Cible Wagons (Target)
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={row.wagonsTarget}
                              onKeyDown={handleKeyDown}
                              onChange={e => updateExtractionCell(idx, 'wagonsTarget', Number(e.target.value))}
                              className="w-full text-sm font-black text-emerald-950 font-mono outline-none bg-transparent"
                            />
                          </div>

                          <div className="bg-slate-100 border border-[#141414] p-3 shadow-sm rounded-sm">
                            <label className="block text-[9px] font-black text-slate-500 uppercase leading-none mb-1.5">
                              Stérile Prévu (Wg)
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={row.sterileBureImiterEst}
                              onKeyDown={handleKeyDown}
                              onChange={e => updateExtractionCell(idx, 'sterileBureImiterEst', Number(e.target.value))}
                              className="w-full text-sm font-black text-slate-800 font-mono outline-none bg-transparent"
                            />
                          </div>
                        </div>

                        {/* Special instructions / Consignes */}
                        <div className="bg-white border border-[#141414] p-3 rounded-sm shadow-sm">
                          <label className="block text-[9px] font-black uppercase text-gray-500 leading-none mb-1.5">
                            Consignes spéciales
                          </label>
                          <input
                            type="text"
                            placeholder="Ex : Priorité évacuation Bure N340..."
                            value={row.remarks || ''}
                            onKeyDown={handleKeyDown}
                            onChange={e => updateExtractionCell(idx, 'remarks', e.target.value)}
                            className="w-full text-xs font-bold text-slate-800 bg-transparent outline-none border-b border-transparent hover:border-gray-200 focus:border-[#00BFFF]"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Footer analysis info */}
                    <div className="border-t border-[#141414]/15 pt-3 flex flex-wrap items-center justify-between gap-4 select-none text-[10px] font-mono font-black uppercase">
                      <div className="flex items-center gap-1.5 text-indigo-700">
                        <ClipboardList className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Intervalle ciblé :</span>
                        <strong className="text-xs text-indigo-900 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded shadow-sm">
                          {row.wagonsTarget > 0 ? `${avgMin.toFixed(1)} mins / wagon` : '-- mins'}
                        </strong>
                      </div>
                      <span className="text-slate-500 text-[9px]">
                        Bure N340 Imiter Est • SMI HydroMines
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* SHEET 4: BRIGADE MAINTENANCE SUPPORT */}
            {activeSheetTab === 'maintenance' && (
              <div className="overflow-x-auto text-[11px]">
                <table className="w-full text-left border-collapse border border-gray-200">
                  <thead>
                    <tr className="bg-gray-100 text-[#141414] border-b border-gray-300">
                      <th className="p-1 text-[9px] font-black uppercase text-center w-8">Row</th>
                      <th className="p-1 text-[9px] font-black uppercase w-32 border-r border-gray-300">Rôle Fixe SMI</th>
                      <th className="p-1 text-[9px] font-black uppercase w-24 border-r border-gray-300">Matr. Spécialiste</th>
                      <th className="p-1 text-[9px] font-black uppercase w-36 border-r border-gray-300">Nom Spécialiste</th>
                      <th className="p-1 text-[9px] font-black uppercase w-48 border-r border-gray-300">Machine d'Intervention</th>
                      <th className="p-1 text-[9px] font-black uppercase w-16 border-r border-gray-300 text-center">Heures</th>
                      <th className="p-1 text-[9px] font-black uppercase">Fiche d'Opérations techniques de maintenance planifiée</th>
                    </tr>
                  </thead>
                  <tbody>
                    {maintenanceRows.map((row, idx) => {
                      const expertValidName = getEmployeeName(row.agentMatricule);

                      return (
                        <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50/50">
                          <td className="p-1 text-[9px] font-mono text-gray-400 text-center bg-gray-50 border-r border-gray-200">{idx + 1}</td>
                          <td className="p-1 border-r border-gray-200 font-black uppercase text-purple-700 bg-[#A020F0]/5">{row.roleLabel}</td>
                          <td className="p-1 border-r border-gray-200">
                            <MatriculeAutocomplete
                              value={row.agentMatricule}
                              onChange={(matricule) => updateMaintenanceCell(idx, 'agentMatricule', matricule)}
                              employees={employees}
                              fonctions={['MECANICIEN', 'CHAUDRONNIER', 'ELECTRICIEN']}
                              placeholder="M-..."
                            />
                          </td>
                          <td className="p-1 border-r border-gray-200 text-[10px] font-semibold text-gray-500 bg-gray-50">
                            {expertValidName ? expertValidName.split(' ')[0] + ' ' + (expertValidName.split(' ')[1] || '') : 'Inconnu'}
                          </td>
                          <td className="p-1 border-r border-gray-200">
                            <select
                              value={row.engineId}
                              onChange={e => updateMaintenanceCell(idx, 'engineId', e.target.value)}
                              className="w-full text-[10px] border border-transparent hover:border-gray-300 focus:border-[#A020F0] outline-none bg-transparent p-0.5"
                            >
                              <option value="">(Aucun engin repéré)</option>
                              {platformSettings.engines.map(eng => (
                                <option key={eng} value={eng}>
                                  {eng}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="p-1 border-r border-gray-200 text-center">
                            <input
                              type="number"
                              value={row.hoursSpent}
                              onChange={e => updateMaintenanceCell(idx, 'hoursSpent', Number(e.target.value))}
                              className="w-full text-[10px] font-mono text-center outline-none bg-transparent p-0.5"
                            />
                          </td>
                          <td className="p-1">
                            <input
                              type="text"
                              placeholder="Visite périodique des 250h, graissage, vidange pont..."
                              value={row.workDescription}
                              onChange={e => updateMaintenanceCell(idx, 'workDescription', e.target.value)}
                              className="w-full text-[9px] border border-transparent hover:border-gray-300 focus:border-[#00BFFF] outline-none bg-transparent p-0.5 uppercase"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Auto Legend Info */}
            <div className="flex justify-between items-center text-[8px] text-gray-400 mt-2 italic bg-gray-50 p-2 border border-gray-100/50">
              <span>* Les prévisions de chargement s'injectent instantanément dans les fiches de Saisie Surface correspondantes.</span>
              <span>* Matrice automatisée : Le nom et la fonction de l'effectif se cherchent en temps réel en tapant le matricule.</span>
            </div>

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
                <div id="duplicate-warnings-banner" className="my-3 border-2 border-[#8B0000] bg-red-50 text-red-950 p-3 shadow-sm">
                  <div className="flex items-center gap-2 pb-1.5 border-b border-[#8B0000]/20 mb-2">
                    <span className="animate-pulse inline-block w-2.5 h-2.5 rounded-full bg-red-600"></span>
                    <span className="text-[10px] font-black uppercase tracking-wider text-red-800">
                      ⚠️ ALERTE DE DOUBLE AFFECTATION D'EFFECTIF (CONFLIT DE PLANNING)
                    </span>
                  </div>
                  <div className="divide-y divide-[#8B0000]/10 max-h-24 overflow-y-auto pr-1">
                    {duplicates.map(([mat, occurrences]) => (
                      <div key={mat} className="py-1 text-[9.5px] font-medium flex items-start gap-1 justify-between">
                        <div>
                          Le matricule <strong className="font-mono bg-red-150 px-1 text-red-900 border border-red-200">{mat}</strong> ({occurrences[0].name}) 
                          est affecté <strong className="text-red-900">{occurrences.length} fois</strong> en même temps :
                        </div>
                        <div className="flex flex-wrap gap-1 mt-0.5 justify-end">
                          {occurrences.map((occ, oIdx) => (
                            <span 
                              key={oIdx} 
                              className="inline-block px-1.5 py-0.25 bg-[#8B0000] text-white text-[7.5px] font-black uppercase rounded-sm"
                              title={`${occ.role} à ${occ.location}`}
                            >
                              {occ.sheet} ({occ.location})
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* INTEGRATED FULL-WIDTH BOTTOM SUMMARY BAR */}
          <div className="bg-[#141414] text-white p-4 flex flex-col md:flex-row items-center justify-between gap-4 border border-[#141414] shadow-md">
            <div className="flex items-center gap-6">
              <div className="border-r border-white/20 pr-6">
                <span className="text-white/40 uppercase text-[8px] font-bold block">Chantiers programmés</span>
                <span className="text-lg font-black text-white mt-0.5 block">
                  {([...minageRowsByPost['Poste 1'], ...minageRowsByPost['Poste 2'], ...minageRowsByPost['Poste 3']].filter(r => r.chantierId !== '').length + 
                    [...deblayageRowsByPost['Poste 1'], ...deblayageRowsByPost['Poste 2'], ...deblayageRowsByPost['Poste 3']].filter(r => r.chantierId !== '').length)} postes de fond
                </span>
              </div>
              <div className="border-r border-white/20 pr-6">
                <span className="text-white/40 uppercase text-[8px] font-bold block">Objectif Avancement</span>
                <span className="text-lg font-black text-[#00BFFF] mt-0.5 block">
                  {([...minageRowsByPost['Poste 1'], ...minageRowsByPost['Poste 2'], ...minageRowsByPost['Poste 3']].reduce((a, b) => a + (b.chantierId ? b.meterage : 0), 0)).toFixed(1)} mètres
                </span>
              </div>
              <div>
                <span className="text-white/40 uppercase text-[8px] font-bold block">Coordinateur</span>
                <span className="text-[10px] font-semibold text-[#00BFFF] mt-0.5 block uppercase">
                  {user?.email || 'Secrétaire de Planification SMI'}
                </span>
              </div>
            </div>

            <button 
              onClick={savePlanningWorkbook}
              disabled={saveStatus === 'saving'}
              className="w-full md:w-auto bg-[#00BFFF] hover:bg-sky-500 text-white py-2.5 px-6 font-black uppercase tracking-widest text-[9px] transition-all shadow-md active:translate-y-px"
            >
              {saveStatus === 'saving' ? 'Validation ...' : saveStatus === 'saved' ? '✓ Enregistré !' : 'Graver l\'Ordonnancement Complet'}
            </button>
          </div>
        </div>
      ) : (
        /* CONSOLIDATED HISTORY LIST VIEW */
        <div className="bg-white border-2 border-[#141414] shadow-[8px_8px_0px_rgba(20,20,20,0.05)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#141414] text-white">
                  {['Date programmée', 'Shift / Poste', 'Chantiers planifiés (Blasting)', 'Avancement ciblé', 'Sauvegardé par', 'Fiche'].map(h => (
                    <th key={h} className="px-5 py-3 text-[9px] font-black uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#141414]/10 text-[10px]">
                {planningsHistory.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 font-mono font-bold">{record.date}</td>
                    <td className="px-5 py-3">
                      <span className="bg-gray-100 px-2 py-0.5 font-bold uppercase border border-gray-200">{record.post}</span>
                    </td>
                    <td className="px-5 py-3 text-[#8B0000] font-black">
                      {record.minageRows ? record.minageRows.length : 0} chantiers tirs
                    </td>
                    <td className="px-5 py-3 font-black text-blue-700">
                      {record.minageRows ? record.minageRows.reduce((acc: number, r: any) => acc + (r.meterage || 0), 0).toFixed(1) : '0.0'} m
                    </td>
                    <td className="px-5 py-3 text-gray-400 font-bold uppercase text-[9px]">
                      {record.operator ? record.operator.split('@')[0] : 'SMI USER'}
                    </td>
                    <td className="px-5 py-3">
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-green-50 border border-green-500/20 text-green-700 font-bold uppercase text-[8px]">
                        <CheckCircle className="w-3 h-3 text-green-600" /> Planifié Souterrain
                      </div>
                    </td>
                  </tr>
                ))}
                {planningsHistory.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center p-16 italic text-gray-300 uppercase font-black text-[10px]">
                      Aucun grand livre de planification enregistré.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
