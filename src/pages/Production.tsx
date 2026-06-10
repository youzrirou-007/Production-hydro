import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Check, 
  Search, 
  Filter, 
  Calendar, 
  Hammer, 
  MapPin, 
  Clock, 
  ShieldCheck, 
  X, 
  HardHat, 
  TrendingUp, 
  Sparkles,
  AlertTriangle,
  FileSpreadsheet,
  Save,
  RotateCcw,
  CheckCircle,
  TrendingDown,
  Info,
  Layers,
  Wrench,
  Gauge,
  Trash2,
  Map,
  Clock3,
  UserCheck
} from 'lucide-react';
import { collection, query, onSnapshot, setDoc, doc, arrayUnion, orderBy, where, getDocs, deleteDoc, getDoc, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { format, subDays } from 'date-fns';

// ----------------------------------------------------
// DEFAULT SECTORS & FALLBACK DATA FOR INDUSTRIAL EDGE
// ----------------------------------------------------
const DEFAULT_SECTORS = [
  { id: 'imiter_1', name: 'Imiter 1' },
  { id: 'imiter_2', name: 'Imiter 2' },
  { id: 'imiter_est', name: 'Imiter Est' },
  { id: 'imiter_est_bure', name: 'Imiter Est Bure' },
];

const DEFAULT_EMPLOYEES = [
  { id: 'e1', matricule: 'M001', nom: 'El Idrissi', prenom: 'Ahmed', fonction: 'CHEF', status: 'actif' },
  { id: 'e2', matricule: 'M002', nom: 'Ait Oufkir', prenom: 'Mustapha', fonction: 'MINEUR', status: 'actif' },
  { id: 'e3', matricule: 'M003', nom: 'Haddad', prenom: 'Youssef', fonction: 'MINEUR', status: 'actif' },
  { id: 'e4', matricule: 'M004', nom: 'Amrani', prenom: 'Rachid', fonction: 'CONDUCTEUR', status: 'actif' },
  { id: 'e5', matricule: 'M005', nom: 'Kassimi', prenom: 'Hassan', fonction: 'ÉLECTRICIEN', status: 'actif' },
  { id: 'e6', matricule: 'M006', nom: 'Naji', prenom: 'Khalid', fonction: 'CHAUDRONNIER', status: 'actif' },
];

const DEFAULT_ENGINES = [
  { id: 'lhd_01', code: 'LHD-01', name: 'Loader Atlas Copco ST14' },
  { id: 'lhd_02', code: 'LHD-02', name: 'Loader Sandvik LH410' },
  { id: 'lhd_03', code: 'LHD-03', name: 'LHD Toro 400 Souterrain' },
];

// Dynamic interfaces for Excel Sheets
interface ExcelMinage {
  sector: string; // Imiter 1, Imiter 2, Imiter Est
  chantierId: string; // selected from master chantiers list
  chiefMatricule: string;
  chiefName: string;
  minerMatricule: string;
  minerName: string;
  assistantMatricule: string;
  assistantName: string;
  gallerySize: number; // m² (e.g., 9 | 12, renamed to Section galerie)
  plannedHoles: number;
  realHoles: number; // trous forés
  plannedRounds: number;
  realRounds: number; // Nombre de volées
  meterage: number; // realRounds * 1.7
  realMeterage: number; // métrage arraché (new field)
  anfo: number; // ANFO kg
  tovex: number; // tovex kg
  ammorces: number;
}

interface ExcelDeblayage {
  chantierId: string; // Selected sector (Imiter 1, 2, Est)
  driverMatricule: string;
  driverName: string;
  engineId: string; // Selected engine LHD
  engineCode: string;
  godets: number;
  volumeEstimated: number; // godets * 1.5
  gasoil: number; // quantité gasoil prise
  lubrifiant1: string; // selected oil type 1
  lubrifiant1Qty: number; // Qty taken
  lubrifiant2: string; // selected oil type 2
  lubrifiant2Qty: number; // Qty taken
  startTime: string; // heure de début
  endTime: string; // heure de finition
  remarks: string; // fait de rotation
  sector?: string; // sector group name
}

interface ExcelExtraction {
  treuilliste: string;
  equipier1: string;
  equipier2: string;
  equipier3: string;
  equipier4: string;
  wagonsActual: number; // wagons chargés
  wagonsTarget: number; // 48
  sterileBureImiterEst: number; // stérile wagons
  startTime: string; // Heure début
  endTime: string; // Heure finit
}

interface ExcelMaintenance {
  roleLabel: string; // Dropdown role prévu (eg, MECANICIEN, CHAUDRONNIER, etc.)
  agentMatricule: string;
  agentName: string;
  engineId: string;
  engineCode: string;
  hoursSpent: number;
  workDescription: string;
}

// ----------------------------------------------------
// SMART REUSABLE COMPONENT FOR EMPLOYEE SELECTION & ALERTS
// ----------------------------------------------------
interface EmployeeCellProps {
  matricule: string;
  name?: string;
  onChange: (mat: string, resolvedName: string) => void;
  employees: any[];
  placeholder?: string;
  hideNameLabel?: boolean;
}

const EmployeeCell: React.FC<EmployeeCellProps> = ({ matricule, name, onChange, employees, placeholder = "Matricule...", hideNameLabel = false }) => {
  const [typed, setTyped] = React.useState(matricule || '');
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    setTyped(matricule || '');
  }, [matricule]);

  // Try to find exact match
  const exactEmp = employees.find(
    e => (e.matricule || '').toUpperCase().trim() === typed.toUpperCase().trim()
  );

  const query = typed.trim().toLowerCase();

  // Filter employees matching query
  const suggestions = query && !exactEmp ? employees.filter(emp => {
    const m = (emp.matricule || '').toLowerCase();
    const fullName = `${emp.nom || ''} ${emp.prenom || ''}`.toLowerCase();
    const reverseFullName = `${emp.prenom || ''} ${emp.nom || ''}`.toLowerCase();
    return m.includes(query) || fullName.includes(query) || reverseFullName.includes(query);
  }) : [];

  const isInvalid = typed.trim().length > 0 && !exactEmp && suggestions.length === 0;

  return (
    <div className="relative w-full min-w-[130px]">
      <div className={`flex items-center transition-all bg-white px-1 py-0.5 border rounded ${isInvalid ? 'border-red-500 bg-red-50/70 border-2' : 'border-slate-200 focus-within:border-sky-400 focus-within:ring-1 focus-within:ring-sky-400'}`}>
        <input
          type="text"
          placeholder={placeholder}
          value={typed}
          onChange={(e) => {
            const val = e.target.value;
            setTyped(val);
            setIsOpen(true);
            
            const matched = employees.find(emp => (emp.matricule || '').toUpperCase().trim() === val.toUpperCase().trim());
            if (matched) {
              onChange(matched.matricule, `${matched.nom} ${matched.prenom}`);
            } else {
              onChange(val, 'Inconnu');
            }
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => {
            setTimeout(() => {
              setIsOpen(false);
            }, 250);
          }}
          className="w-full font-mono text-[10px] font-bold text-slate-800 bg-transparent py-0.5 px-1 outline-none uppercase placeholder-slate-400"
        />
        {exactEmp && !hideNameLabel && (
          <span className="text-[8px] font-black bg-slate-100 text-slate-500 px-1 py-0.2 rounded shrink-0 uppercase tracking-tight">
            {exactEmp.fonction}
          </span>
        )}
      </div>

      {isInvalid && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-red-600 text-white font-black text-[8px] uppercase px-1.5 py-1 rounded shadow-lg z-50 animate-bounce border border-red-700 leading-tight select-none">
          ⚠️ ABSENT DE L'EFFECTIF HYDROMINES SMI
        </div>
      )}

      {isOpen && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 mt-1 max-h-36 overflow-y-auto bg-white border border-slate-200 shadow-xl rounded z-50 divide-y divide-slate-100">
          {suggestions.slice(0, 10).map((emp) => {
            const empName = `${emp.nom} ${emp.prenom}`;
            return (
              <button
                key={emp.id || emp.matricule}
                type="button"
                onMouseDown={() => {
                  setTyped(emp.matricule);
                  onChange(emp.matricule, empName);
                  setIsOpen(false);
                }}
                className="w-full text-left px-2 py-1 hover:bg-sky-50 transition-colors flex items-center justify-between text-[10px]"
              >
                <div className="font-bold flex flex-col truncate pr-1">
                  <span className="text-slate-800 uppercase truncate">{empName}</span>
                  <span className="text-[8px] text-slate-400 uppercase tracking-wider">{emp.fonction}</span>
                </div>
                <span className="font-mono text-[9px] font-black bg-slate-100 px-1 rounded text-slate-500 shrink-0">
                  {emp.matricule}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {exactEmp && !hideNameLabel && (
        <div className="text-[8px] text-emerald-800 bg-emerald-50 border border-emerald-100 font-extrabold mt-0.5 truncate px-1 py-0.2 rounded flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 inline-block"></span>
          <span className="truncate">{exactEmp.nom} {exactEmp.prenom}</span>
        </div>
      )}
    </div>
  );
};

// 30-minute interval helper for easy select inputs
const timeOptions = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2);
  const m = (i % 2) * 30;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
});

const renderTimeSelect = (value: string, onChange: (val: string) => void) => {
  const options = [...timeOptions];
  if (value && !options.includes(value)) {
    options.push(value);
    options.sort();
  }
  return (
    <select
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      className="w-full font-mono text-center border border-slate-200 p-1 text-[11px] rounded-none outline-none font-bold text-slate-700 bg-white cursor-pointer hover:border-slate-300 focus:border-[#8B0000]"
    >
      <option value="">--:--</option>
      {options.map(t => (
        <option key={t} value={t}>{t}</option>
      ))}
    </select>
  );
};

export const Production: React.FC = () => {
  const { user } = useAuth();
  
  // App views: 'sheet' (Excel Mode) or 'history' (Consolidated list)
  const [viewMode, setViewMode] = useState<'sheet' | 'history'>('sheet');
  const [activeSheetTab, setActiveSheetTab] = useState<'minage' | 'deblayage' | 'extraction' | 'maintenance'>('minage');
  
  // Core filters
  const [selectedDate, setSelectedDate] = useState(format(subDays(new Date(), 1), 'yyyy-MM-dd'));
  const [selectedPost, setSelectedPost] = useState<'Poste 1' | 'Poste 2' | 'Poste 3'>('Poste 1');

  // Platform Settings State
  const [platformSettings, setPlatformSettings] = useState<{
    sectors: string[];
    engines: string[];
    oils: string[];
  }>({
    sectors: ['Imiter 1', 'Imiter 2', 'Imiter Est'],
    engines: ['ST2D', 'ST2G 1', 'ST2G 3', 'ST2G 4', 'ST2G 5', 'ST2G6'],
    oils: ['Huile Moteur 15W40', 'Huile Hydraulique HV46', 'Huile Hydraulique HV68', 'Huile Transmission SAE30', 'Huile Transmission SAE50', 'Graisse Extrême Pression']
  });

  // Master lists from Firebase
  const [dataHistory, setDataHistory] = useState<any[]>([]);
  const [chantiers, setChantiers] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [engines, setEngines] = useState<any[]>([]);
  const [plannings, setPlannings] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copying' | 'copied' | 'no_data' | 'error'>('idle');
  const [isTemplateLoaded, setIsTemplateLoaded] = useState(false);
  const [templateDateHint, setTemplateDateHint] = useState('');

  // Excel grids state for Poste 1
  const [p1MinageRows, setP1MinageRows] = useState<ExcelMinage[]>([]);
  const [p1DeblayageRows, setP1DeblayageRows] = useState<ExcelDeblayage[]>([]);
  const [p1ExtractionRows, setP1ExtractionRows] = useState<ExcelExtraction[]>([]);
  const [p1MaintenanceRows, setP1MaintenanceRows] = useState<ExcelMaintenance[]>([]);
  const [p1ChiefMatricule, setP1ChiefMatricule] = useState<string>('');
  const [p1ChiefName, setP1ChiefName] = useState<string>('');
  const [p1SecondChiefMatricule, setP1SecondChiefMatricule] = useState<string>('');
  const [p1SecondChiefName, setP1SecondChiefName] = useState<string>('');

  // Excel grids state for Poste 2
  const [p2MinageRows, setP2MinageRows] = useState<ExcelMinage[]>([]);
  const [p2DeblayageRows, setP2DeblayageRows] = useState<ExcelDeblayage[]>([]);
  const [p2ExtractionRows, setP2ExtractionRows] = useState<ExcelExtraction[]>([]);
  const [p2MaintenanceRows, setP2MaintenanceRows] = useState<ExcelMaintenance[]>([]);
  const [p2ChiefMatricule, setP2ChiefMatricule] = useState<string>('');
  const [p2ChiefName, setP2ChiefName] = useState<string>('');
  const [p2SecondChiefMatricule, setP2SecondChiefMatricule] = useState<string>('');
  const [p2SecondChiefName, setP2SecondChiefName] = useState<string>('');

  // Excel grids state for Poste 3
  const [p3MinageRows, setP3MinageRows] = useState<ExcelMinage[]>([]);
  const [p3DeblayageRows, setP3DeblayageRows] = useState<ExcelDeblayage[]>([]);
  const [p3ExtractionRows, setP3ExtractionRows] = useState<ExcelExtraction[]>([]);
  const [p3MaintenanceRows, setP3MaintenanceRows] = useState<ExcelMaintenance[]>([]);
  const [p3ChiefMatricule, setP3ChiefMatricule] = useState<string>('');
  const [p3ChiefName, setP3ChiefName] = useState<string>('');
  const [p3SecondChiefMatricule, setP3SecondChiefMatricule] = useState<string>('');
  const [p3SecondChiefName, setP3SecondChiefName] = useState<string>('');

  // Local draft state to prevent losing inputted data
  const [draftAvailable, setDraftAvailable] = useState<boolean>(false);

  // Dynamically merged vectors with fallbacks for high uptime
  const activeSectors = chantiers.length > 0 ? chantiers : DEFAULT_SECTORS;
  const activeEmployees = employees.length > 0 ? employees : DEFAULT_EMPLOYEES;
  const activeEngines = engines.length > 0 ? engines : DEFAULT_ENGINES;

  // Real-time listeners
  useEffect(() => {
    // 1. History
    const qHistory = query(collection(db, 'production_history'), orderBy('lastUpdated', 'desc'));
    const unsubHist = onSnapshot(qHistory, (snapshot) => {
      setDataHistory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => {
      console.warn("Permission logs on Snapshot production_history:", err.message);
    });

    // 2. Chantiers
    const qChan = query(collection(db, 'chantiers'));
    const unsubChan = onSnapshot(qChan, (snapshot) => {
      setChantiers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => {
      console.warn("Permission logs on Snapshot chantiers:", err.message);
    });

    // 3. Personnel
    const qRH = query(collection(db, 'personnel'));
    const unsubRH = onSnapshot(qRH, (snapshot) => {
      setEmployees(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => {
      console.warn("Permission logs on Snapshot personnel:", err.message);
    });

    // 4. Engines
    const qEngs = query(collection(db, 'engines'));
    const unsubEngs = onSnapshot(qEngs, (snap) => {
      setEngines(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => {
      console.warn("Permission logs on Snapshot engines:", err.message);
    });

    // 5. Plans
    const qPlan = query(collection(db, 'planning'));
    const unsubPlan = onSnapshot(qPlan, (snapshot) => {
      setPlannings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => {
      console.warn("Permission logs on Snapshot planning:", err.message);
    });

    // 6. Platform Settings Restrictive lists
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

    return () => { unsubHist(); unsubChan(); unsubRH(); unsubEngs(); unsubPlan(); unsubSettings(); };
  }, []);

  // Check if draft exists when date changes
  useEffect(() => {
    if (!selectedDate) return;
    const draft = localStorage.getItem(`draft_production_${selectedDate}`);
    setDraftAvailable(!!draft);
  }, [selectedDate]);

  // Save drafts to localStorage to prevent data loss on accidental reload
  useEffect(() => {
    if (!selectedDate || loading) return;
    
    const draftPayload = {
      p1MinageRows, p1DeblayageRows, p1ExtractionRows, p1MaintenanceRows,
      p1ChiefMatricule, p1ChiefName, p1SecondChiefMatricule, p1SecondChiefName,
      p2MinageRows, p2DeblayageRows, p2ExtractionRows, p2MaintenanceRows,
      p2ChiefMatricule, p2ChiefName, p2SecondChiefMatricule, p2SecondChiefName,
      p3MinageRows, p3DeblayageRows, p3ExtractionRows, p3MaintenanceRows,
      p3ChiefMatricule, p3ChiefName, p3SecondChiefMatricule, p3SecondChiefName,
    };
    
    // Check if there is some modified rows to justify saving a draft
    const hasData = [
      p1MinageRows, p1DeblayageRows, p1ExtractionRows, p1MaintenanceRows,
      p2MinageRows, p2DeblayageRows, p2ExtractionRows, p2MaintenanceRows,
      p3MinageRows, p3DeblayageRows, p3ExtractionRows, p3MaintenanceRows
    ].some(arr => arr && arr.length > 0);
    
    if (hasData) {
      localStorage.setItem(`draft_production_${selectedDate}`, JSON.stringify(draftPayload));
    }
  }, [
    selectedDate, loading,
    p1MinageRows, p1DeblayageRows, p1ExtractionRows, p1MaintenanceRows,
    p1ChiefMatricule, p1ChiefName, p1SecondChiefMatricule, p1SecondChiefName,
    p2MinageRows, p2DeblayageRows, p2ExtractionRows, p2MaintenanceRows,
    p2ChiefMatricule, p2ChiefName, p2SecondChiefMatricule, p2SecondChiefName,
    p3MinageRows, p3DeblayageRows, p3ExtractionRows, p3MaintenanceRows,
    p3ChiefMatricule, p3ChiefName, p3SecondChiefMatricule, p3SecondChiefName,
  ]);

  // Prevent closing the tab with unsaved modifications
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const draft = localStorage.getItem(`draft_production_${selectedDate}`);
      if (draft) {
        e.preventDefault();
        e.returnValue = "Vous avez des modifications non enregistrées sur ce Registre de Poste. Souhaitez-vous vraiment quitter ?";
        return e.returnValue;
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [selectedDate]);

  const restoreDraft = () => {
    const savedDraft = localStorage.getItem(`draft_production_${selectedDate}`);
    if (savedDraft) {
      try {
        const d = JSON.parse(savedDraft);
        if (d.p1MinageRows) setP1MinageRows(d.p1MinageRows);
        if (d.p1DeblayageRows) setP1DeblayageRows(d.p1DeblayageRows);
        if (d.p1ExtractionRows) setP1ExtractionRows(d.p1ExtractionRows);
        if (d.p1MaintenanceRows) setP1MaintenanceRows(d.p1MaintenanceRows);
        if (d.p1ChiefMatricule !== undefined) setP1ChiefMatricule(d.p1ChiefMatricule);
        if (d.p1ChiefName !== undefined) setP1ChiefName(d.p1ChiefName);
        if (d.p1SecondChiefMatricule !== undefined) setP1SecondChiefMatricule(d.p1SecondChiefMatricule);
        if (d.p1SecondChiefName !== undefined) setP1SecondChiefName(d.p1SecondChiefName);

        if (d.p2MinageRows) setP2MinageRows(d.p2MinageRows);
        if (d.p2DeblayageRows) setP2DeblayageRows(d.p2DeblayageRows);
        if (d.p2ExtractionRows) setP2ExtractionRows(d.p2ExtractionRows);
        if (d.p2MaintenanceRows) setP2MaintenanceRows(d.p2MaintenanceRows);
        if (d.p2ChiefMatricule !== undefined) setP2ChiefMatricule(d.p2ChiefMatricule);
        if (d.p2ChiefName !== undefined) setP2ChiefName(d.p2ChiefName);
        if (d.p2SecondChiefMatricule !== undefined) setP2SecondChiefMatricule(d.p2SecondChiefMatricule);
        if (d.p2SecondChiefName !== undefined) setP2SecondChiefName(d.p2SecondChiefName);

        if (d.p3MinageRows) setP3MinageRows(d.p3MinageRows);
        if (d.p3DeblayageRows) setP3DeblayageRows(d.p3DeblayageRows);
        if (d.p3ExtractionRows) setP3ExtractionRows(d.p3ExtractionRows);
        if (d.p3MaintenanceRows) setP3MaintenanceRows(d.p3MaintenanceRows);
        if (d.p3ChiefMatricule !== undefined) setP3ChiefMatricule(d.p3ChiefMatricule);
        if (d.p3ChiefName !== undefined) setP3ChiefName(d.p3ChiefName);
        if (d.p3SecondChiefMatricule !== undefined) setP3SecondChiefMatricule(d.p3SecondChiefMatricule);
        if (d.p3SecondChiefName !== undefined) setP3SecondChiefName(d.p3SecondChiefName);

        setDraftAvailable(false);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (e) {
        console.error("Error parsing draft", e);
      }
    }
  };

  const discardDraft = () => {
    if (window.confirm("⚠️ Voulez-vous vraiment écraser votre travail en cours et supprimer définitivement ce brouillon local ?")) {
      localStorage.removeItem(`draft_production_${selectedDate}`);
      setDraftAvailable(false);
    }
  };

  // Initialize/Load workbook from firestore whenever Date changes
  useEffect(() => {
    loadGlobalWorkbook();
  }, [selectedDate, employees, chantiers, engines]);

  const buildTemplateForPost = (postName: string, yesterdayDateStr: string) => {
    const shiftPlans = plannings.filter(p => p.date === yesterdayDateStr && p.post === postName);

    // Forage & Minage template
    const activeChefs = employees.filter(e => e.fonction === 'CHEF' && e.status === 'actif');
    const getSectorChefDefault = (sec: string) => {
      const chf = activeChefs.find(e => (e.sector || '').toLowerCase() === sec.toLowerCase());
      return chf ? { matricule: chf.matricule || '', name: `${chf.nom || ''} ${chf.prenom || ''}`.trim() } : { matricule: '', name: '' };
    };

    const matchingMinagePlan = shiftPlans.find(p => p.type === 'minage' && p.chiefMatricule);
    const defaultChef = activeChefs.length > 0 ? activeChefs[0] : null;

    const chiefMatricule = matchingMinagePlan?.chiefMatricule || defaultChef?.matricule || '';
    const chiefName = matchingMinagePlan?.chiefName || (defaultChef ? `${defaultChef.nom || ''} ${defaultChef.prenom || ''}`.trim() : '');
    const secondChiefMatricule = '';
    const secondChiefName = '';

    const lengthImiter2 = postName === 'Poste 1' ? 1 : 2;
    const lengthImiter1 = postName === 'Poste 1' ? 1 : 2;
    const lengthImiterEst = postName === 'Poste 1' ? 2 : 2;

    const plansImiter2 = shiftPlans.filter(p => p.type === 'minage' && (p.sector || '').toLowerCase() === 'imiter 2');
    const minageImiter2: ExcelMinage[] = Array.from({ length: lengthImiter2 }, (_, i) => {
      const matchingPlan = plansImiter2[i];
      if (matchingPlan) {
        const m = (matchingPlan.plannedRounds || 1) * 1.7;
        return {
          sector: 'Imiter 2',
          chantierId: matchingPlan.chantierId || '',
          chiefMatricule: '',
          chiefName: '',
          minerMatricule: matchingPlan.minerMatricule || '',
          minerName: matchingPlan.minerName || '',
          assistantMatricule: matchingPlan.assistantMatricule || '',
          assistantName: matchingPlan.assistantName || '',
          gallerySize: matchingPlan.galleryType === '9m2' ? 9 : 12,
          plannedHoles: matchingPlan.plannedHoles || 32,
          realHoles: matchingPlan.plannedHoles || 32,
          plannedRounds: matchingPlan.plannedRounds || 1,
          realRounds: matchingPlan.plannedRounds || 1,
          meterage: m,
          realMeterage: m,
          anfo: matchingPlan.explosives?.anfo || 50,
          tovex: matchingPlan.explosives?.tovex || 10,
          ammorces: matchingPlan.explosives?.ammorces || 12,
        };
      }
      return {
        sector: 'Imiter 2',
        chantierId: '',
        chiefMatricule: '',
        chiefName: '',
        minerMatricule: '', minerName: '',
        assistantMatricule: '', assistantName: '', gallerySize: 12, plannedHoles: 32, realHoles: 32,
        plannedRounds: 1, realRounds: 1, meterage: 1.7, realMeterage: 1.7, anfo: 0, tovex: 0, ammorces: 0
      };
    });

    const plansImiter1 = shiftPlans.filter(p => p.type === 'minage' && (p.sector || '').toLowerCase() === 'imiter 1');
    const minageImiter1: ExcelMinage[] = Array.from({ length: lengthImiter1 }, (_, i) => {
      const matchingPlan = plansImiter1[i];
      if (matchingPlan) {
        const m = (matchingPlan.plannedRounds || 1) * 1.7;
        return {
          sector: 'Imiter 1',
          chantierId: matchingPlan.chantierId || '',
          chiefMatricule: '',
          chiefName: '',
          minerMatricule: matchingPlan.minerMatricule || '',
          minerName: matchingPlan.minerName || '',
          assistantMatricule: matchingPlan.assistantMatricule || '',
          assistantName: matchingPlan.assistantName || '',
          gallerySize: matchingPlan.galleryType === '9m2' ? 9 : 12,
          plannedHoles: matchingPlan.plannedHoles || 32,
          realHoles: matchingPlan.plannedHoles || 32,
          plannedRounds: matchingPlan.plannedRounds || 1,
          realRounds: matchingPlan.plannedRounds || 1,
          meterage: m,
          realMeterage: m,
          anfo: matchingPlan.explosives?.anfo || 50,
          tovex: matchingPlan.explosives?.tovex || 10,
          ammorces: matchingPlan.explosives?.ammorces || 12,
        };
      }
      return {
        sector: 'Imiter 1',
        chantierId: '',
        chiefMatricule: '',
        chiefName: '',
        minerMatricule: '', minerName: '',
        assistantMatricule: '', assistantName: '', gallerySize: 12, plannedHoles: 32, realHoles: 32,
        plannedRounds: 1, realRounds: 1, meterage: 1.7, realMeterage: 1.7, anfo: 0, tovex: 0, ammorces: 0
      };
    });

    const plansImiterEst = shiftPlans.filter(p => p.type === 'minage' && (p.sector || '').toLowerCase() === 'imiter est');
    const minageImiterEst: ExcelMinage[] = Array.from({ length: lengthImiterEst }, (_, i) => {
      const matchingPlan = plansImiterEst[i];
      if (matchingPlan) {
        const m = (matchingPlan.plannedRounds || 1) * 1.7;
        return {
          sector: 'Imiter Est',
          chantierId: matchingPlan.chantierId || '',
          chiefMatricule: '',
          chiefName: '',
          minerMatricule: matchingPlan.minerMatricule || '',
          minerName: matchingPlan.minerName || '',
          assistantMatricule: matchingPlan.assistantMatricule || '',
          assistantName: matchingPlan.assistantName || '',
          gallerySize: matchingPlan.galleryType === '9m2' ? 9 : 12,
          plannedHoles: matchingPlan.plannedHoles || 32,
          realHoles: matchingPlan.plannedHoles || 32,
          plannedRounds: matchingPlan.plannedRounds || 1,
          realRounds: matchingPlan.plannedRounds || 1,
          meterage: m,
          realMeterage: m,
          anfo: matchingPlan.explosives?.anfo || 50,
          tovex: matchingPlan.explosives?.tovex || 10,
          ammorces: matchingPlan.explosives?.ammorces || 12,
        };
      }
      return {
        sector: 'Imiter Est',
        chantierId: '',
        chiefMatricule: '',
        chiefName: '',
        minerMatricule: '', minerName: '',
        assistantMatricule: '', assistantName: '', gallerySize: 12, plannedHoles: 32, realHoles: 32,
        plannedRounds: 1, realRounds: 1, meterage: 1.7, realMeterage: 1.7, anfo: 0, tovex: 0, ammorces: 0
      };
    });

    const minageRows: ExcelMinage[] = [...minageImiter2, ...minageImiter1, ...minageImiterEst];

    let defaultStart = '07:00';
    let defaultEnd = '14:00';
    if (postName === 'Poste 1') {
      defaultStart = '07:00';
      defaultEnd = '14:00';
    } else if (postName === 'Poste 2') {
      defaultStart = '15:00';
      defaultEnd = '22:00';
    } else if (postName === 'Poste 3') {
      defaultStart = '23:00';
      defaultEnd = '06:00';
    }

    const plansDebIm2 = shiftPlans.filter(p => p.type === 'deblayage' && (p.sector || '').toLowerCase() === 'imiter 2');
    const plansDebIm1 = shiftPlans.filter(p => p.type === 'deblayage' && (p.sector || '').toLowerCase() === 'imiter 1');
    const plansDebImEst = shiftPlans.filter(p => p.type === 'deblayage' && (p.sector || '').toLowerCase() === 'imiter est');

    const debIm2Rows: ExcelDeblayage[] = Array.from({ length: 2 }, (_, i) => {
      const p = plansDebIm2[i];
      if (p) {
        return {
          sector: 'Imiter 2', chantierId: p.chantierId || '', driverMatricule: p.driverMatricule || '', driverName: p.driverName || '',
          engineId: p.engineId || '', engineCode: p.engineCode || '', godets: 25, volumeEstimated: 37.5, gasoil: 0,
          lubrifiant1: '', lubrifiant1Qty: 0, lubrifiant2: '', lubrifiant2Qty: 0, startTime: defaultStart, endTime: defaultEnd, remarks: ''
        };
      }
      return {
        sector: 'Imiter 2', chantierId: '', driverMatricule: '', driverName: '', engineId: '', engineCode: '', godets: 0, volumeEstimated: 0, gasoil: 0,
        lubrifiant1: '', lubrifiant1Qty: 0, lubrifiant2: '', lubrifiant2Qty: 0, startTime: defaultStart, endTime: defaultEnd, remarks: ''
      };
    });

    const debIm1Rows: ExcelDeblayage[] = Array.from({ length: 1 }, (_, i) => {
      const p = plansDebIm1[i];
      if (p) {
        return {
          sector: 'Imiter 1', chantierId: p.chantierId || '', driverMatricule: p.driverMatricule || '', driverName: p.driverName || '',
          engineId: p.engineId || '', engineCode: p.engineCode || '', godets: 25, volumeEstimated: 37.5, gasoil: 0,
          lubrifiant1: '', lubrifiant1Qty: 0, lubrifiant2: '', lubrifiant2Qty: 0, startTime: defaultStart, endTime: defaultEnd, remarks: ''
        };
      }
      return {
        sector: 'Imiter 1', chantierId: '', driverMatricule: '', driverName: '', engineId: '', engineCode: '', godets: 0, volumeEstimated: 0, gasoil: 0,
        lubrifiant1: '', lubrifiant1Qty: 0, lubrifiant2: '', lubrifiant2Qty: 0, startTime: defaultStart, endTime: defaultEnd, remarks: ''
      };
    });

    const debImEstRows: ExcelDeblayage[] = Array.from({ length: 3 }, (_, i) => {
      const p = plansDebImEst[i];
      if (p) {
        return {
          sector: 'Imiter Est', chantierId: p.chantierId || '', driverMatricule: p.driverMatricule || '', driverName: p.driverName || '',
          engineId: p.engineId || '', engineCode: p.engineCode || '', godets: 25, volumeEstimated: 37.5, gasoil: 0,
          lubrifiant1: '', lubrifiant1Qty: 0, lubrifiant2: '', lubrifiant2Qty: 0, startTime: defaultStart, endTime: defaultEnd, remarks: ''
        };
      }
      return {
        sector: 'Imiter Est', chantierId: '', driverMatricule: '', driverName: '', engineId: '', engineCode: '', godets: 0, volumeEstimated: 0, gasoil: 0,
        lubrifiant1: '', lubrifiant1Qty: 0, lubrifiant2: '', lubrifiant2Qty: 0, startTime: defaultStart, endTime: defaultEnd, remarks: ''
      };
    });

    const deblayageRows: ExcelDeblayage[] = [...debIm2Rows, ...debIm1Rows, ...debImEstRows];

    const extractionRows: ExcelExtraction[] = [
      {
        treuilliste: '',
        equipier1: '',
        equipier2: '',
        equipier3: '',
        equipier4: '',
        wagonsActual: 40,
        wagonsTarget: 48,
        sterileBureImiterEst: 4,
        startTime: defaultStart === '23:00' ? '00:00' : postName === 'Poste 2' ? '16:00' : '08:00',
        endTime: defaultStart === '23:00' ? '05:30' : postName === 'Poste 2' ? '21:30' : '13:30'
      }
    ];

    const maintenanceRows: ExcelMaintenance[] = Array.from(
      { length: postName === 'Poste 1' ? 4 : 1 },
      () => ({ roleLabel: '', agentMatricule: '', agentName: '', engineId: '', engineCode: '', hoursSpent: 6, workDescription: '' })
    );

    return {
      minageRows,
      deblayageRows,
      extractionRows,
      maintenanceRows,
      chiefMatricule,
      chiefName,
      secondChiefMatricule,
      secondChiefName
    };
  };

  const loadGlobalWorkbook = async (force: boolean = false) => {
    const savedDraft = localStorage.getItem(`draft_production_${selectedDate}`);
    if (!force && savedDraft) {
      const confirmReload = window.confirm("⚠️ Attention : Vous avez des saisies de brouillon locales non enregistrées. Recharger les données depuis le serveur principal écrasera vos modifications actuelles si vous ne les restaurez pas via la barre d'alerte. Voulez-vous vraiment continuer ?");
      if (!confirmReload) {
        return;
      }
    }
    setLoading(true);
    try {
      const yesterdayDateObj = subDays(new Date(selectedDate + "T12:00:00"), 1);
      const yesterdayDateStr = format(yesterdayDateObj, 'yyyy-MM-dd');

      // Fetch references for all 3 posts in parallel
      const doc1Ref = doc(db, 'daily_excel_sheets', `${selectedDate}_Poste_1`);
      const doc2Ref = doc(db, 'daily_excel_sheets', `${selectedDate}_Poste_2`);
      const doc3Ref = doc(db, 'daily_excel_sheets', `${selectedDate}_Poste_3`);

      const [snap1, snap2, snap3] = await Promise.all([
        getDoc(doc1Ref),
        getDoc(doc2Ref),
        getDoc(doc3Ref)
      ]);

      // Post 1
      if (snap1.exists()) {
        const d = snap1.data();
        setP1MinageRows(d.minageRows || []);
        setP1DeblayageRows(d.deblayageRows || []);
        setP1ExtractionRows(d.extractionRows || []);
        setP1MaintenanceRows(d.maintenanceRows || []);
        setP1ChiefMatricule(d.chiefMatricule || '');
        setP1ChiefName(d.chiefName || '');
        setP1SecondChiefMatricule(d.secondChiefMatricule || '');
        setP1SecondChiefName(d.secondChiefName || '');
      } else {
        const t = buildTemplateForPost('Poste 1', yesterdayDateStr);
        setP1MinageRows(t.minageRows);
        setP1DeblayageRows(t.deblayageRows);
        setP1ExtractionRows(t.extractionRows);
        setP1MaintenanceRows(t.maintenanceRows);
        setP1ChiefMatricule(t.chiefMatricule);
        setP1ChiefName(t.chiefName);
        setP1SecondChiefMatricule(t.secondChiefMatricule);
        setP1SecondChiefName(t.secondChiefName);
      }

      // Post 2
      if (snap2.exists()) {
        const d = snap2.data();
        setP2MinageRows(d.minageRows || []);
        setP2DeblayageRows(d.deblayageRows || []);
        setP2ExtractionRows(d.extractionRows || []);
        setP2MaintenanceRows(d.maintenanceRows || []);
        setP2ChiefMatricule(d.chiefMatricule || '');
        setP2ChiefName(d.chiefName || '');
        setP2SecondChiefMatricule(d.secondChiefMatricule || '');
        setP2SecondChiefName(d.secondChiefName || '');
      } else {
        const t = buildTemplateForPost('Poste 2', yesterdayDateStr);
        setP2MinageRows(t.minageRows);
        setP2DeblayageRows(t.deblayageRows);
        setP2ExtractionRows(t.extractionRows);
        setP2MaintenanceRows(t.maintenanceRows);
        setP2ChiefMatricule(t.chiefMatricule);
        setP2ChiefName(t.chiefName);
        setP2SecondChiefMatricule(t.secondChiefMatricule);
        setP2SecondChiefName(t.secondChiefName);
      }

      // Post 3
      if (snap3.exists()) {
        const d = snap3.data();
        setP3MinageRows(d.minageRows || []);
        setP3DeblayageRows(d.deblayageRows || []);
        setP3ExtractionRows(d.extractionRows || []);
        setP3MaintenanceRows(d.maintenanceRows || []);
        setP3ChiefMatricule(d.chiefMatricule || '');
        setP3ChiefName(d.chiefName || '');
        setP3SecondChiefMatricule(d.secondChiefMatricule || '');
        setP3SecondChiefName(d.secondChiefName || '');
      } else {
        const t = buildTemplateForPost('Poste 3', yesterdayDateStr);
        setP3MinageRows(t.minageRows);
        setP3DeblayageRows(t.deblayageRows);
        setP3ExtractionRows(t.extractionRows);
        setP3MaintenanceRows(t.maintenanceRows);
        setP3ChiefMatricule(t.chiefMatricule);
        setP3ChiefName(t.chiefName);
        setP3SecondChiefMatricule(t.secondChiefMatricule);
        setP3SecondChiefName(t.secondChiefName);
      }

      const isNew = !snap1.exists() || !snap2.exists() || !snap3.exists();
      setIsTemplateLoaded(isNew);
      setTemplateDateHint(format(yesterdayDateObj, 'dd/MM/yyyy'));
    } catch (err) {
      console.error("Erreur de chargement du classeur : ", err);
    } finally {
      setLoading(false);
    }
  };

  // Live lookup helpers
  const getEmployeeName = (matricule: string) => {
    const emp = activeEmployees.find(e => e.matricule?.toUpperCase() === matricule?.trim().toUpperCase());
    return emp ? `${emp.nom} ${emp.prenom} (${emp.fonction})` : '';
  };

  const getPostState = (post: string) => {
    if (post === 'Poste 1') {
      return {
        minageRows: p1MinageRows, setMinageRows: setP1MinageRows,
        deblayageRows: p1DeblayageRows, setDeblayageRows: setP1DeblayageRows,
        extractionRows: p1ExtractionRows, setExtractionRows: setP1ExtractionRows,
        maintenanceRows: p1MaintenanceRows, setMaintenanceRows: setP1MaintenanceRows,
        chiefMatricule: p1ChiefMatricule, setChiefMatricule: setP1ChiefMatricule,
        chiefName: p1ChiefName, setChiefName: setP1ChiefName,
        secondChiefMatricule: p1SecondChiefMatricule, setSecondChiefMatricule: setP1SecondChiefMatricule,
        secondChiefName: p1SecondChiefName, setSecondChiefName: setP1SecondChiefName
      };
    } else if (post === 'Poste 2') {
      return {
        minageRows: p2MinageRows, setMinageRows: setP2MinageRows,
        deblayageRows: p2DeblayageRows, setDeblayageRows: setP2DeblayageRows,
        extractionRows: p2ExtractionRows, setExtractionRows: setP2ExtractionRows,
        maintenanceRows: p2MaintenanceRows, setMaintenanceRows: setP2MaintenanceRows,
        chiefMatricule: p2ChiefMatricule, setChiefMatricule: setP2ChiefMatricule,
        chiefName: p2ChiefName, setChiefName: setP2ChiefName,
        secondChiefMatricule: p2SecondChiefMatricule, setSecondChiefMatricule: setP2SecondChiefMatricule,
        secondChiefName: p2SecondChiefName, setSecondChiefName: setP2SecondChiefName
      };
    } else {
      return {
        minageRows: p3MinageRows, setMinageRows: setP3MinageRows,
        deblayageRows: p3DeblayageRows, setDeblayageRows: setP3DeblayageRows,
        extractionRows: p3ExtractionRows, setExtractionRows: setP3ExtractionRows,
        maintenanceRows: p3MaintenanceRows, setMaintenanceRows: setP3MaintenanceRows,
        chiefMatricule: p3ChiefMatricule, setChiefMatricule: setP3ChiefMatricule,
        chiefName: p3ChiefName, setChiefName: setP3ChiefName,
        secondChiefMatricule: p3SecondChiefMatricule, setSecondChiefMatricule: setP3SecondChiefMatricule,
        secondChiefName: p3SecondChiefName, setSecondChiefName: setP3SecondChiefName
      };
    }
  };

  // Row Manipulation Tools (Add/Delete/Modify)
  const addMinageRowForSector = (postName: string, sector: string) => {
    const { setMinageRows, minageRows } = getPostState(postName);
    setMinageRows([
      ...minageRows,
      {
        sector: sector,
        chantierId: '',
        chiefMatricule: '',
        chiefName: '',
        minerMatricule: '', minerName: '',
        assistantMatricule: '', assistantName: '',
        gallerySize: 12, plannedHoles: 32, realHoles: 32,
        plannedRounds: 1, realRounds: 1, meterage: 1.7, realMeterage: 1.7, anfo: 50, tovex: 12, ammorces: 12
      }
    ]);
  };

  const deleteMinageRow = (postName: string, index: number) => {
    const { setMinageRows } = getPostState(postName);
    setMinageRows(prev => prev.filter((_, i) => i !== index));
  };

  const updateMinageCell = (postName: string, index: number, field: keyof ExcelMinage, value: any) => {
    const { setMinageRows, minageRows } = getPostState(postName);
    const clone = [...minageRows];
    clone[index] = { ...clone[index], [field]: value };
    
    if (field === 'minerMatricule') {
      const emp = activeEmployees.find(e => e.matricule?.toUpperCase() === String(value).trim().toUpperCase());
      clone[index].minerName = emp ? `${emp.nom} ${emp.prenom}` : 'Inconnu';
    }
    if (field === 'assistantMatricule') {
      const emp = activeEmployees.find(e => e.matricule?.toUpperCase() === String(value).trim().toUpperCase());
      clone[index].assistantName = emp ? `${emp.nom} ${emp.prenom}` : 'Inconnu';
    }
    if (field === 'realRounds') {
      const computed = Number(value) * 1.7;
      clone[index].meterage = computed;
      clone[index].realMeterage = computed;
    }
    if (field === 'chantierId') {
      const foundChan = chantiers.find(c => c.id === value);
      if (foundChan && foundChan.sector) {
        clone[index].sector = foundChan.sector;
        
        // Auto-propose sector chef if not set
        const state = getPostState(postName);
        if (!state.chiefMatricule) {
          const activeChefs = activeEmployees.filter(e => e.fonction === 'CHEF' && e.status === 'actif');
          const sectorChef = activeChefs.find(e => (e.sector || '').toLowerCase() === foundChan.sector.toLowerCase());
          if (sectorChef) {
            state.setChiefMatricule(sectorChef.matricule || '');
            state.setChiefName(`${sectorChef.nom || ''} ${sectorChef.prenom || ''}`.trim());
          }
        }
      }
    }
    setMinageRows(clone);
  };

  const addDeblayageRow = (postName: string) => {
    const { setDeblayageRows, deblayageRows } = getPostState(postName);
    let start = '07:00';
    let end = '14:00';
    if (postName === 'Poste 1') { start = '07:00'; end = '14:00'; }
    else if (postName === 'Poste 2') { start = '15:00'; end = '22:00'; }
    else if (postName === 'Poste 3') { start = '23:00'; end = '06:00'; }

    setDeblayageRows([
      ...deblayageRows,
      {
        chantierId: 'Imiter 1', driverMatricule: '', driverName: '', engineId: '', engineCode: '',
        godets: 0, volumeEstimated: 0, gasoil: 0, lubrifiant1: '', lubrifiant1Qty: 0, lubrifiant2: '', lubrifiant2Qty: 0,
        startTime: start, endTime: end, remarks: ''
      }
    ]);
  };

  const deleteDeblayageRow = (postName: string, index: number) => {
    const { setDeblayageRows } = getPostState(postName);
    setDeblayageRows(prev => prev.filter((_, i) => i !== index));
  };

  const updateDeblayageCell = (postName: string, index: number, field: keyof ExcelDeblayage, value: any) => {
    const { setDeblayageRows, deblayageRows } = getPostState(postName);
    const clone = [...deblayageRows];
    clone[index] = { ...clone[index], [field]: value };

    if (field === 'driverMatricule') {
      const emp = activeEmployees.find(e => e.matricule?.toUpperCase() === String(value).trim().toUpperCase());
      clone[index].driverName = emp ? `${emp.nom} ${emp.prenom}` : 'Inconnu';
    }
    if (field === 'engineId') {
      clone[index].engineCode = String(value);
    }
    if (field === 'godets') {
      clone[index].volumeEstimated = Number(value) * 1.5;
    }
    setDeblayageRows(clone);
  };

  const addExtractionRow = (postName: string) => {
    const { setExtractionRows, extractionRows } = getPostState(postName);
    setExtractionRows([
      ...extractionRows,
      {
        treuilliste: '', equipier1: '', equipier2: '', equipier3: '', equipier4: '',
        wagonsActual: 0, wagonsTarget: 48, sterileBureImiterEst: 0, startTime: '', endTime: ''
      }
    ]);
  };

  const deleteExtractionRow = (postName: string, index: number) => {
    const { setExtractionRows } = getPostState(postName);
    setExtractionRows(prev => prev.filter((_, i) => i !== index));
  };

  const updateExtractionCell = (postName: string, index: number, field: keyof ExcelExtraction, value: any) => {
    const { setExtractionRows, extractionRows } = getPostState(postName);
    const clone = [...extractionRows];
    clone[index] = { ...clone[index], [field]: value };
    setExtractionRows(clone);
  };

  const addMaintenanceRow = (postName: string) => {
    const { setMaintenanceRows, maintenanceRows } = getPostState(postName);
    setMaintenanceRows([
      ...maintenanceRows,
      { roleLabel: '', agentMatricule: '', agentName: '', engineId: '', engineCode: '', hoursSpent: 6, workDescription: '' }
    ]);
  };

  const deleteMaintenanceRow = (postName: string, index: number) => {
    const { setMaintenanceRows } = getPostState(postName);
    setMaintenanceRows(prev => prev.filter((_, i) => i !== index));
  };

  const updateMaintenanceCell = (postName: string, index: number, field: keyof ExcelMaintenance, value: any) => {
    const { setMaintenanceRows, maintenanceRows } = getPostState(postName);
    const clone = [...maintenanceRows];
    clone[index] = { ...clone[index], [field]: value };

    if (field === 'agentMatricule') {
      const emp = activeEmployees.find(e => e.matricule?.toUpperCase() === String(value).trim().toUpperCase());
      clone[index].agentName = emp ? `${emp.nom} ${emp.prenom}` : 'Inconnu';
    }
    if (field === 'engineId') {
      clone[index].engineCode = String(value);
    }
    setMaintenanceRows(clone);
  };

  // Save Workbook
  const saveWorkbook = async () => {
    setSaveStatus('saving');
    try {
      const postsList = ['Poste 1', 'Poste 2', 'Poste 3'];

      for (const pName of postsList) {
        const {
          minageRows, deblayageRows, extractionRows, maintenanceRows,
          chiefMatricule, chiefName, secondChiefMatricule, secondChiefName
        } = getPostState(pName);

        // Inject the global shift chef(s) into each individual minage row for compatibility
        const finalMinageRows = minageRows.map(row => {
          const finalChiefMatricule = chiefMatricule;
          const finalChiefName = secondChiefName ? `${chiefName} / ${secondChiefName}` : chiefName;
          return {
            ...row,
            chiefMatricule: finalChiefMatricule,
            chiefName: finalChiefName
          };
        });

        const docId = `${selectedDate}_${pName.replace(/\s+/g, '_')}`;

        const payload = {
          date: selectedDate,
          post: pName,
          operator: user?.email || 'Secrétaire de Direction SMI',
          timestamp: new Date().toISOString(),
          minageRows: finalMinageRows,
          deblayageRows: deblayageRows,
          extractionRows: extractionRows,
          maintenanceRows: maintenanceRows,
          chiefMatricule,
          chiefName,
          secondChiefMatricule,
          secondChiefName
        };

        // 1. Save Excel Workbook Document
        await setDoc(doc(db, 'daily_excel_sheets', docId), payload);

        // 2. Save Production History Summary
        await setDoc(doc(db, 'production_history', docId), {
          date: selectedDate,
          post: pName,
          lastUpdated: new Date().toISOString(),
          timestamp: new Date().toISOString(),
          totalBlasts: minageRows.filter(r => r.chantierId !== '').length,
          totalMeterage: minageRows.reduce((acc, r) => acc + (r.chantierId ? r.meterage : 0), 0),
          totalWagons: extractionRows.reduce((acc, r) => acc + (r.wagonsActual || 0), 0),
          status: 'validated'
        });

        // 3. Sync to Consolidated Production collection for DailyReport
        const prodColl = collection(db, 'production');
        const qExist = query(prodColl, where('date', '==', selectedDate), where('post', '==', pName));
        const existSnap = await getDocs(qExist);
        for (const md of existSnap.docs) {
          await deleteDoc(doc(db, 'production', md.id));
        }

        // Add active minage rows to consolidated production
        for (const row of finalMinageRows.filter(r => r.chantierId !== '')) {
          const chantierObj = chantiers.find(c => c.id === row.chantierId);
          await addDoc(prodColl, {
            date: selectedDate,
            post: pName,
            chantierId: row.chantierId,
            chantierName: chantierObj?.name || 'Slick',
            chiefName: secondChiefName ? `${chiefName} / ${secondChiefName}` : chiefName,
            minerName: row.minerName,
            assistantName: row.assistantName,
            gallerySize: row.gallerySize === 9 ? '9m2' : '12m2',
            holeCount: row.realHoles,
            rounds: row.realRounds,
            meterage: row.realMeterage,
            meteragePlanned: row.meterage,
            explosives: {
              anfo: row.anfo,
              tovex: row.tovex,
              ammorces: row.ammorces
            },
            timestamp: new Date().toISOString()
          });
        }
      }

      // Clear draft on successful save
      localStorage.removeItem(`draft_production_${selectedDate}`);
      setDraftAvailable(false);

      setIsTemplateLoaded(false);
      setTemplateDateHint('');
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch (err) {
      console.error("Error saving workbook: ", err);
      setSaveStatus('error');
    }
  };

  const standardizeHours = (postName: string) => {
    let start = '07:00';
    let end = '14:00';
    if (postName === 'Poste 1') { start = '07:00'; end = '14:00'; }
    else if (postName === 'Poste 2') { start = '15:00'; end = '22:00'; }
    else if (postName === 'Poste 3') { start = '23:00'; end = '06:00'; }

    const { setDeblayageRows, setExtractionRows } = getPostState(postName);

    setDeblayageRows(prev => prev.map(row => ({ ...row, startTime: start, endTime: end })));
    setExtractionRows(prev => prev.map(row => ({ ...row, startTime: start, endTime: end })));
  };

  const copyYesterdayShiftTeam = async (postName: string) => {
    setCopyStatus('copying');
    try {
      const parsedDate = new Date(selectedDate + "T12:00:00");
      const yesterday = subDays(parsedDate, 1);
      const yesterdayStr = format(yesterday, 'yyyy-MM-dd');
      const yesterdayDocId = `${yesterdayStr}_${postName.replace(/\s+/g, '_')}`;

      // Use target getDoc for high performance and reliability
      const yesterdayDocSnap = await getDoc(doc(db, 'daily_excel_sheets', yesterdayDocId));

      if (yesterdayDocSnap.exists()) {
        const data = yesterdayDocSnap.data();
        const {
          setMinageRows, setDeblayageRows, setExtractionRows, setMaintenanceRows,
          setChiefMatricule, setChiefName, setSecondChiefMatricule, setSecondChiefName
        } = getPostState(postName);

        // Copy high-level chief info
        if (data.chiefMatricule) {
          setChiefMatricule(data.chiefMatricule);
          setChiefName(data.chiefName || '');
        }
        if (data.secondChiefMatricule) {
          setSecondChiefMatricule(data.secondChiefMatricule);
          setSecondChiefName(data.secondChiefName || '');
        }

        // 1. Minage rows copy miners & assistant
        if (data.minageRows && data.minageRows.length > 0) {
          setMinageRows(prev => prev.map((row, idx) => {
            const yRow = data.minageRows[idx];
            if (yRow) {
              return {
                ...row,
                minerMatricule: yRow.minerMatricule || '',
                minerName: yRow.minerName || '',
                assistantMatricule: yRow.assistantMatricule || '',
                assistantName: yRow.assistantName || '',
              };
            }
            return row;
          }));
        }

        // 2. Deblayage rows
        if (data.deblayageRows && data.deblayageRows.length > 0) {
          setDeblayageRows(prev => prev.map((row, idx) => {
            const yRow = data.deblayageRows[idx];
            if (yRow) {
              return {
                ...row,
                driverMatricule: yRow.driverMatricule || '',
                driverName: yRow.driverName || '',
              };
            }
            return row;
          }));
        }

        // 3. Extraction rows
        if (data.extractionRows && data.extractionRows.length > 0) {
          setExtractionRows(prev => prev.map((row, idx) => {
            const yRow = data.extractionRows[idx];
            if (yRow) {
              return {
                ...row,
                treuilliste: yRow.treuilliste || '',
                equipier1: yRow.equipier1 || '',
                equipier2: yRow.equipier2 || '',
                equipier3: yRow.equipier3 || '',
                equipier4: yRow.equipier4 || '',
              };
            }
            return row;
          }));
        }

        // 4. Maintenance rows
        if (data.maintenanceRows && data.maintenanceRows.length > 0) {
          setMaintenanceRows(prev => prev.map((row, idx) => {
            const yRow = data.maintenanceRows[idx];
            if (yRow) {
              return {
                ...row,
                agentMatricule: yRow.agentMatricule || '',
                agentName: yRow.agentName || '',
              };
            }
            return row;
          }));
        }

        setCopyStatus('copied');
        setTimeout(() => setCopyStatus('idle'), 2500);
      } else {
        setCopyStatus('no_data');
        setTimeout(() => setCopyStatus('idle'), 2500);
      }
    } catch (err) {
      console.error(err);
      setCopyStatus('error');
      setTimeout(() => setCopyStatus('idle'), 2500);
    }
  };

  // Coherence / Operational Anomalies calculations for decision makers
  const calculateAnomalies = () => {
    const logs: { level: 'warning' | 'info' | 'danger'; msg: string }[] = [];
    const shifts = ['Poste 1', 'Poste 2', 'Poste 3'];
    
    // Track chef assignments to find repetitions across posts
    const chefShifts: { [matricule: string]: { name: string; shifts: string[] } } = {};

    shifts.forEach(shiftName => {
      const state = getPostState(shiftName);
      const { minageRows, deblayageRows, extractionRows, chiefMatricule, chiefName, secondChiefMatricule, secondChiefName } = state;

      // 1. Missing chief when activity present
      const hasActivity = minageRows.some(r => r.chantierId) || deblayageRows.length > 0 || extractionRows.length > 0;
      if (hasActivity && !chiefMatricule) {
        logs.push({
          level: 'danger',
          msg: `⚠️ Encadrement requis sur le ${shiftName} : Des activités de production ont été saisies mais aucun Chef de Poste Principal n'est spécifié.`
        });
      }

      // 2. Double chief within same post
      if (chiefMatricule && secondChiefMatricule && chiefMatricule.trim().toUpperCase() === secondChiefMatricule.trim().toUpperCase()) {
        logs.push({
          level: 'danger',
          msg: `⚠️ Doublon d'encadrement sur le ${shiftName} : Le chef principal et le deuxième chef possèdent le même matricule (${chiefMatricule}).`
        });
      }

      // Track chef assignments
      if (chiefMatricule) {
        const key = chiefMatricule.trim().toUpperCase();
        if (!chefShifts[key]) {
          chefShifts[key] = { name: chiefName || chiefMatricule, shifts: [] };
        }
        chefShifts[key].shifts.push(shiftName);
      }
      if (secondChiefMatricule) {
        const key = secondChiefMatricule.trim().toUpperCase();
        if (!chefShifts[key]) {
          chefShifts[key] = { name: secondChiefName || secondChiefMatricule, shifts: [] };
        }
        chefShifts[key].shifts.push(shiftName);
      }

      // 3. Extraction productivity cadence warning
      extractionRows.forEach(row => {
        if (row.wagonsActual > 0) {
          const avgMin = 360 / row.wagonsActual;
          if (avgMin > 10) {
            logs.push({
              level: 'warning',
              msg: `🛠️ Extraction (${shiftName}) : Cadence de ${avgMin.toFixed(1)} mins/wagon (Standard requis: 8 mins). Rendement d'extraction actuel : ${((row.wagonsActual / (row.wagonsTarget || 48)) * 100).toFixed(0)}%.`
            });
          }
        }
      });

      // 4. Mismatch in scoop vs blast volume
      deblayageRows.forEach(row => {
        if (row.chantierId && row.godets > 0) {
          const blast = minageRows.find(b => b.chantierId === row.chantierId);
          const chantierObj = chantiers.find(c => c.id === row.chantierId);
          const cName = chantierObj ? chantierObj.name : 'Chantier';
          
          if (blast) {
            const inSituVol = blast.realRounds * 1.7 * (blast.gallerySize || 12);
            const looseVol = inSituVol * 1.5;
            const expectedBuckets = Math.ceil(looseVol / 1.5);

            if (row.godets > expectedBuckets * 1.4) {
              logs.push({
                level: 'danger',
                msg: `⚠️ Décalage de Déblayage (${shiftName}) sur ${cName} : Le conducteur déclare ${row.godets} godets. Maximum théorique attendu : ~${expectedBuckets} godets.`
              });
            }
          }
        }
      });
    });

    // 5. Chef repetitions across different shifts
    Object.keys(chefShifts).forEach(mat => {
      const assignment = chefShifts[mat];
      if (assignment.shifts.length > 1) {
        logs.push({
          level: 'warning',
          msg: `⚠️ Rotation de personnel suspecte : Le chef de poste de fond ${assignment.name} (${mat}) est affecté simultanément sur plusieurs postes distincts : ${assignment.shifts.join(', ')}.`
        });
      }
    });

    return logs;
  };

  const renderSectorRows = (postName: string, sectorName: string, accentBgHeader: string, textColorAccent: string, stripBgAccent: string) => {
    const { minageRows } = getPostState(postName);
    // Filter matching rows
    const rows = minageRows
      .map((row, idx) => ({ row, idx }))
      .filter(item => {
        const rowSec = (item.row.sector || '').trim().toLowerCase();
        const targetSec = sectorName.trim().toLowerCase();
        return rowSec === targetSec;
      });

    return (
      <>
        {/* Header Band */}
        <tr className={`${accentBgHeader} border-y border-slate-250 select-none`}>
          <td colSpan={13} className="p-2 text-[10.5px] font-black uppercase tracking-wider">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 inline-block ${stripBgAccent}`}></span>
                <span className={`${textColorAccent}`}>Secteur : <strong className="font-extrabold">{sectorName}</strong></span>
              </div>
              <button
                type="button"
                onClick={() => addMinageRowForSector(postName, sectorName)}
                className="bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-[9px] uppercase px-3 py-1 flex items-center gap-1 transition-all rounded shadow-sm cursor-pointer"
              >
                <Plus className="w-3 h-3 text-[#00BFFF]" /> Ajouter Ligne ({sectorName})
              </button>
            </div>
          </td>
        </tr>

        {/* Rows list */}
        {rows.map(({ row, idx }) => {
          return (
            <tr key={idx} className="hover:bg-slate-50 transition-colors">
              <td className="p-2 font-mono text-slate-400 bg-slate-50/50 text-center font-bold border-r border-slate-200">{idx + 1}</td>
              
              {/* Dynamically filtered Chantier list according to selected Sector */}
              <td className="p-2 border-r border-slate-200">
                <select
                  value={row.chantierId}
                  onChange={e => updateMinageCell(postName, idx, 'chantierId', e.target.value)}
                  className="w-full text-slate-800 border border-slate-200 p-1 focus:border-[#8B0000] focus:ring-1 focus:ring-[#8B0000] outline-none font-bold"
                >
                  <option value="">(Sélectionner Chantier)</option>
                  {(() => {
                    const rowSec = (row.sector || 'Imiter 1').trim().toLowerCase();
                    const filteredChan = chantiers.filter(c => {
                      const cSec = (c.sector || '').trim().toLowerCase();
                      return cSec === rowSec || cSec.includes(rowSec) || rowSec.includes(cSec);
                    });
                    const displayedList = filteredChan.length > 0 ? filteredChan : chantiers;
                    return displayedList.map(c => (
                      <option key={c.id} value={c.id}>{c.name || c.id}</option>
                    ));
                  })()}
                </select>
              </td>

              <td className="p-2 border-r border-slate-200">
                <EmployeeCell
                  matricule={row.minerMatricule}
                  name={row.minerName}
                  onChange={(mat) => updateMinageCell(postName, idx, 'minerMatricule', mat)}
                  employees={activeEmployees}
                  placeholder="Matr. Mineur..."
                />
              </td>
              <td className="p-2 border-r border-slate-200">
                <EmployeeCell
                  matricule={row.assistantMatricule}
                  name={row.assistantName}
                  onChange={(mat) => updateMinageCell(postName, idx, 'assistantMatricule', mat)}
                  employees={activeEmployees}
                  placeholder="Matr. Assistant..."
                />
              </td>
              <td className="p-2 border-r border-slate-200 text-center">
                <select
                  value={row.gallerySize}
                  onChange={e => updateMinageCell(postName, idx, 'gallerySize', Number(e.target.value))}
                  className="border border-slate-200 p-1 w-full text-center font-bold"
                >
                  <option value={9}>9m</option>
                  <option value={12}>12m</option>
                </select>
              </td>
              <td className="p-2 border-r border-slate-200 text-center">
                <input
                  type="number"
                  value={row.realHoles}
                  onChange={e => updateMinageCell(postName, idx, 'realHoles', Number(e.target.value))}
                  className="w-full font-mono text-center border border-slate-200 p-1"
                />
              </td>
              <td className="p-2 border-r border-slate-200 text-center">
                <input
                  type="number"
                  value={row.realRounds}
                  onChange={e => updateMinageCell(postName, idx, 'realRounds', Number(e.target.value))}
                  className="w-full font-mono text-center border border-slate-200 p-1 font-bold"
                />
              </td>
              <td className="p-2 border-r border-slate-200 text-center text-[#8B0000] bg-[#8B0000]/5 font-bold">
                {row.meterage.toFixed(1)}m
              </td>
              
              {/* Métrage Arraché Column */}
              <td className="p-2 border-r border-slate-200 text-center bg-teal-50 text-teal-900">
                <input
                  type="number"
                  step="0.1"
                  value={row.realMeterage === undefined ? row.meterage : row.realMeterage}
                  onChange={e => updateMinageCell(postName, idx, 'realMeterage', Number(e.target.value))}
                  className="w-full font-mono text-center font-black select-all"
                />
              </td>

              {/* ANFO Column */}
              <td className="p-2 border-r border-slate-200 text-center bg-slate-50/50">
                <input
                  type="number"
                  value={row.anfo === 0 || row.anfo === undefined ? '' : row.anfo}
                  placeholder="0"
                  onChange={e => updateMinageCell(postName, idx, 'anfo', Number(e.target.value))}
                  className="w-14 text-center font-mono border border-slate-200 p-0.5 rounded select-all font-bold"
                />
              </td>

              {/* TOVEX Column */}
              <td className="p-2 border-r border-slate-200 text-center bg-slate-50/50">
                <input
                  type="number"
                  value={row.tovex === 0 || row.tovex === undefined ? '' : row.tovex}
                  placeholder="0"
                  onChange={e => updateMinageCell(postName, idx, 'tovex', Number(e.target.value))}
                  className="w-14 text-center font-mono border border-slate-200 p-0.5 rounded select-all font-bold"
                />
              </td>

              {/* Amorces Column */}
              <td className="p-2 border-r border-slate-200 text-center bg-slate-50/50">
                <input
                  type="number"
                  value={row.ammorces === 0 || row.ammorces === undefined ? '' : row.ammorces}
                  placeholder="0"
                  onChange={e => updateMinageCell(postName, idx, 'ammorces', Number(e.target.value))}
                  className="w-14 text-center font-mono border border-slate-200 p-0.5 rounded select-all font-bold"
                />
              </td>

              <td className="p-1 text-center">
                <button
                  type="button"
                  onClick={() => deleteMinageRow(postName, idx)}
                  className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                  title="Supprimer la ligne"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </td>
            </tr>
          );
        })}
        {rows.length === 0 && (
          <tr>
            <td colSpan={13} className="p-4 text-center text-slate-400 font-semibold italic text-[10px]">
              Aucune ligne pour ce secteur. Cliquez sur "+ Ajouter Ligne" pour en insérer une.
            </td>
          </tr>
        )}
      </>
    );
  };

  const addDeblayageRowForSector = (postName: string, sector: string) => {
    const { setDeblayageRows, deblayageRows } = getPostState(postName);
    let start = '07:00';
    let end = '14:00';
    if (postName === 'Poste 1') { start = '07:00'; end = '14:00'; }
    else if (postName === 'Poste 2') { start = '15:00'; end = '22:00'; }
    else if (postName === 'Poste 3') { start = '23:00'; end = '06:00'; }

    setDeblayageRows([
      ...deblayageRows,
      {
        sector: sector,
        chantierId: '',
        driverMatricule: '',
        driverName: '',
        engineId: '',
        engineCode: '',
        godets: 0,
        volumeEstimated: 0,
        gasoil: 0,
        lubrifiant1: '',
        lubrifiant1Qty: 0,
        lubrifiant2: '',
        lubrifiant2Qty: 0,
        startTime: start,
        endTime: end,
        remarks: ''
      }
    ]);
  };

  const renderDeblayageSectorRows = (postName: string, sectorName: string, accentBgHeader: string, textColorAccent: string, stripBgAccent: string) => {
    const { deblayageRows } = getPostState(postName);
    
    // Filter rows belonging to the sectorName
    const rows = deblayageRows
      .map((row, idx) => ({ row, idx }))
      .filter(item => {
        const rowSec = (item.row.sector || '').trim().toLowerCase();
        const targetSec = sectorName.trim().toLowerCase();
        return rowSec === targetSec;
      });

    return (
      <>
        {/* Header Band */}
        <tr className={`${accentBgHeader} border-y border-slate-250 select-none`}>
          <td colSpan={16} className="p-2 text-[10.5px] font-black uppercase tracking-wider">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 inline-block ${stripBgAccent}`}></span>
                <span className={`${textColorAccent}`}>Secteur : <strong className="font-extrabold">{sectorName}</strong></span>
              </div>
              <button
                type="button"
                onClick={() => addDeblayageRowForSector(postName, sectorName)}
                className="bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-[9px] uppercase px-3 py-1 flex items-center gap-1 transition-all rounded shadow-sm cursor-pointer"
              >
                <Plus className="w-3 h-3 text-[#00BFFF]" /> Ajouter Ligne ({sectorName})
              </button>
            </div>
          </td>
        </tr>

        {/* Rows list */}
        {rows.map(({ row, idx }) => {
          const driverValName = getEmployeeName(row.driverMatricule);
          return (
            <tr key={idx} className="hover:bg-slate-50 transition-colors">
              <td className="p-2 font-mono text-slate-400 bg-slate-50/50 text-center font-bold border-r border-slate-200">{idx + 1}</td>
              
              {/* Dynamically filtered Chantier list according to selected Sector */}
              <td className="p-2 border-r border-slate-200">
                <select
                  value={row.chantierId}
                  onChange={e => updateDeblayageCell(postName, idx, 'chantierId', e.target.value)}
                  className="w-full text-slate-805 border border-slate-200 p-1 focus:border-[#8B0000] focus:ring-1 focus:ring-[#8B0000] outline-none font-bold"
                >
                  <option value="">(Sélectionner Chantier)</option>
                  {(() => {
                    const rowSec = (row.sector || 'Imiter 1').trim().toLowerCase();
                    const filteredChan = chantiers.filter(c => {
                      const cSec = (c.sector || '').trim().toLowerCase();
                      return cSec === rowSec || cSec.includes(rowSec) || rowSec.includes(cSec);
                    });
                    const displayedList = filteredChan.length > 0 ? filteredChan : chantiers;
                    return displayedList.map(c => (
                      <option key={c.id} value={c.id}>{c.name || c.id}</option>
                    ));
                  })()}
                </select>
              </td>

              <td className="p-2 border-r border-slate-200">
                <EmployeeCell
                  matricule={row.driverMatricule}
                  name={row.driverName}
                  onChange={(mat) => updateDeblayageCell(postName, idx, 'driverMatricule', mat)}
                  employees={activeEmployees}
                  placeholder="Matr. Conducteur..."
                  hideNameLabel={true}
                />
              </td>
              <td className="p-2 border-r border-slate-200 text-xs font-semibold text-slate-500 bg-slate-50/20">
                {driverValName || 'Inconnu'}
              </td>

              {/* LHD Engines dropdown */}
              <td className="p-2 border-r border-slate-200 font-bold">
                <select
                  value={row.engineId || row.engineCode || ''}
                  onChange={e => updateDeblayageCell(postName, idx, 'engineId', e.target.value)}
                  className="w-full border border-slate-200 p-1 font-mono text-xs font-bold"
                >
                  <option value="">-- Sélectionner LHD --</option>
                  {platformSettings.engines.map(eng => <option key={eng} value={eng}>{eng}</option>)}
                </select>
              </td>

              <td className="p-2 border-r border-slate-200 text-center bg-[#00BFFF]/5 font-black text-blue-900">
                <input
                  type="number"
                  value={row.godets === 0 || row.godets === undefined ? '' : row.godets}
                  placeholder="0"
                  onChange={e => updateDeblayageCell(postName, idx, 'godets', Number(e.target.value))}
                  className="w-16 text-center bg-transparent border border-dashed border-slate-300 outline-none select-all font-black text-xs"
                />
              </td>
              <td className="p-2 border-r border-slate-200 text-center font-bold font-mono text-emerald-800 bg-slate-50">
                {row.volumeEstimated.toFixed(1)} m³
              </td>

              {/* Heure Début */}
              <td className="p-2 border-r border-slate-200 text-center">
                {renderTimeSelect(row.startTime || '', (val) => updateDeblayageCell(postName, idx, 'startTime', val))}
              </td>

              {/* Heure Finition */}
              <td className="p-2 border-r border-slate-200 text-center">
                {renderTimeSelect(row.endTime || '', (val) => updateDeblayageCell(postName, idx, 'endTime', val))}
              </td>

              {/* Gasoil Qty */}
              <td className="p-2 border-r border-slate-200 text-center bg-blue-50/50">
                <input
                  type="number"
                  placeholder="0"
                  value={row.gasoil === 0 || row.gasoil === undefined ? '' : row.gasoil}
                  onChange={e => updateDeblayageCell(postName, idx, 'gasoil', Number(e.target.value))}
                  className="w-16 font-mono font-black text-center text-blue-950 border border-slate-200 p-0.5 rounded-sm text-xs"
                />
              </td>

              {/* Lubrifiant Pris 1 Dropdown */}
              <td className="p-2 border-r border-slate-200 bg-blue-50/10">
                <select
                  value={row.lubrifiant1 || ''}
                  onChange={e => updateDeblayageCell(postName, idx, 'lubrifiant1', e.target.value)}
                  className="w-full border border-slate-200 p-0.5 text-[10px]"
                >
                  <option value="">-- Aucun --</option>
                  {platformSettings.oils.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </td>
              <td className="p-2 border-r border-slate-200 text-center bg-slate-50">
                <input
                  type="number"
                  placeholder="0"
                  value={row.lubrifiant1Qty === 0 || row.lubrifiant1Qty === undefined ? '' : row.lubrifiant1Qty}
                  onChange={e => updateDeblayageCell(postName, idx, 'lubrifiant1Qty', Number(e.target.value))}
                  className="w-12 text-center font-mono text-xs border border-slate-200 p-0.5"
                />
              </td>

              {/* Lubrifiant Pris 2 Dropdown */}
              <td className="p-2 border-r border-slate-200 bg-blue-50/10">
                <select
                  value={row.lubrifiant2 || ''}
                  onChange={e => updateDeblayageCell(postName, idx, 'lubrifiant2', e.target.value)}
                  className="w-full border border-slate-200 p-0.5 text-[10px]"
                >
                  <option value="">-- Aucun --</option>
                  {platformSettings.oils.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </td>
              <td className="p-2 border-r border-slate-200 text-center bg-slate-50">
                <input
                  type="number"
                  placeholder="0"
                  value={row.lubrifiant2Qty === 0 || row.lubrifiant2Qty === undefined ? '' : row.lubrifiant2Qty}
                  onChange={e => updateDeblayageCell(postName, idx, 'lubrifiant2Qty', Number(e.target.value))}
                  className="w-12 text-center font-mono text-xs border border-slate-200 p-0.5"
                />
              </td>

              {/* Fait de rotation remarks */}
              <td className="p-2 border-r border-slate-200">
                <input
                  type="text"
                  placeholder="Fait marquant de rotation..."
                  value={row.remarks || ''}
                  onChange={e => updateDeblayageCell(postName, idx, 'remarks', e.target.value)}
                  className="w-full border-0 outline-none uppercase bg-transparent text-slate-600 font-bold"
                />
              </td>

              <td className="p-1 text-center">
                <button
                  type="button"
                  onClick={() => deleteDeblayageRow(postName, idx)}
                  className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                  title="Supprimer la ligne"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </td>
            </tr>
          );
        })}
        {rows.length === 0 && (
          <tr>
            <td colSpan={16} className="p-4 text-center text-slate-400 font-semibold italic text-[10px]">
              Aucune ligne pour ce secteur. Cliquez sur "+ Ajouter Ligne" pour en insérer une.
            </td>
          </tr>
        )}
      </>
    );
  };

  const anomalies = calculateAnomalies();

  return (
    <div className="bg-white min-h-screen p-6 rounded-none space-y-8 select-none border border-slate-100">
      
      {/* BRAND HEADER BANNER WITH PURE HYDRO-MINES LUXURY OUTLINE */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center border-b-[3px] border-[#8B0000] pb-6 gap-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#8B0000] flex items-center justify-center text-white font-black text-xl rounded-none select-none">
              HM
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight uppercase font-sans select-none leading-none">
                <span className="text-[#00BFFF]">hydro</span><span className="text-[#8B0000]">mines</span>
              </h1>
              <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest mt-1">
                système d'enregistrement de fond et registre de poste
              </p>
            </div>
          </div>
        </div>

        {/* Real-time Status indicators */}
        <div className="flex items-center gap-3">
          <div className="bg-slate-50 px-4 py-2 border border-slate-300/80 text-right shadow-sm rounded-none">
            <span className="text-[10px] font-black text-slate-500 uppercase block leading-none tracking-wider">Métrage Jour</span>
            <span className="text-xl font-black text-slate-800 mt-1 block font-mono">
              {(
                p1MinageRows.reduce((acc, r) => acc + (r.chantierId ? r.meterage : 0), 0) +
                p2MinageRows.reduce((acc, r) => acc + (r.chantierId ? r.meterage : 0), 0) +
                p3MinageRows.reduce((acc, r) => acc + (r.chantierId ? r.meterage : 0), 0)
              ).toFixed(1)} m
            </span>
          </div>
          <div className="bg-slate-50 px-4 py-2 border border-slate-300/80 text-right shadow-sm rounded-none">
            <span className="text-[10px] font-black text-slate-500 uppercase block leading-none tracking-wider">Total Wagons</span>
            <span className="text-xl font-black text-slate-800 mt-1 block font-mono">
              {p1ExtractionRows.reduce((acc, r) => acc + (r.wagonsActual || 0), 0) +
               p2ExtractionRows.reduce((acc, r) => acc + (r.wagonsActual || 0), 0) +
               p3ExtractionRows.reduce((acc, r) => acc + (r.wagonsActual || 0), 0)} u
            </span>
          </div>
          <div className="hidden sm:flex flex-col justify-center">
            <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider text-right">SMI Cadran</span>
            <span className="text-[10px] text-emerald-650 font-black uppercase text-right flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span> Actif en Ligne
            </span>
          </div>
        </div>
      </div>

      {/* CAHIER CONTROL STRIP (DATE & VIEW OPTION) */}
      <div className="bg-[#8B0000]/5 p-4 border border-[#8B0000]/10 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#8B0000]" />
            <span className="text-xs font-black uppercase text-[#8B0000]">Cahier d'Enregistrement :</span>
            <input 
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="bg-white text-slate-800 font-black text-xs border border-slate-300 rounded-none px-3 py-1.5 focus:border-[#8B0000] focus:ring-1 focus:ring-[#8B0000] outline-none"
            />
          </div>
          
          <div className="h-6 w-px bg-slate-200 hidden md:block" />

          {/* S Mode vs Archive Mode tabs */}
          <div className="flex gap-1 bg-slate-100 p-1 border border-slate-200">
            <button 
              onClick={() => setViewMode('sheet')}
              className={`px-4 py-1.5 font-black text-[10px] uppercase tracking-wider transition-all ${
                viewMode === 'sheet' 
                  ? 'bg-[#8B0000] text-white' 
                  : 'bg-transparent text-slate-600 hover:text-[#8B0000]'
              }`}
            >
              📊 Registre Saisie Interactive
            </button>
            <button 
              onClick={() => setViewMode('history')}
              className={`px-4 py-1.5 font-black text-[10px] uppercase tracking-wider transition-all ${
                viewMode === 'history' 
                  ? 'bg-[#8B0000] text-white' 
                  : 'bg-transparent text-slate-600 hover:text-[#8B0000]'
              }`}
            >
              📋 Archives des fiches ({dataHistory.length})
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadGlobalWorkbook}
            className="border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold px-4 py-1.5 text-xs transition-all flex items-center gap-1.5 rounded-none"
            title="Rafraîchir les données du serveur"
          >
            <RotateCcw className="w-3.5 h-3.5 text-[#00BFFF]" /> Recharger
          </button>
          
          <button
            onClick={saveWorkbook}
            disabled={saveStatus === 'saving'}
            className="bg-[#00BFFF] hover:bg-[#00BFFF]/90 text-white font-black px-6 py-2 text-xs uppercase tracking-widest flex items-center gap-2 transition-all shadow-md"
          >
            <Save className="w-4 h-4" /> 
            {saveStatus === 'saving' ? 'Gravure en cours...' : saveStatus === 'saved' ? '✓ Enregistré !' : 'Graver au Registre SMI'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center text-xs font-bold text-[#8B0000] uppercase tracking-widest animate-pulse flex flex-col items-center justify-center gap-3">
          <Clock className="w-8 h-8 text-[#00BFFF] animate-spin" />
          Synchronisation du registre de fond avec la base de données...
        </div>
      ) : viewMode === 'sheet' ? (
        <div className="space-y-6">
          
          {draftAvailable && (
            <div className="bg-amber-50 border-l-4 border-amber-500 p-4 flex flex-col sm:flex-row gap-3 items-center justify-between shadow-sm rounded-none border border-amber-200">
              <div className="flex gap-3 items-center">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <h4 className="text-xs font-black uppercase text-amber-950 tracking-wider">📝 Brouillon de saisie locale détecté</h4>
                  <p className="text-[11px] text-amber-900 font-bold mt-0.5">
                    Le système d'enregistrement Hydromines a automatiquement récupéré des modifications locales non sauvegardées pour le <span className="underline">{selectedDate}</span>. Voulez-vous restaurer votre session de travail ?
                  </p>
                </div>
              </div>
              <div className="flex gap-2 text-xs font-black shrink-0 mt-2 sm:mt-0">
                <button
                  type="button"
                  onClick={restoreDraft}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-1.5 font-bold uppercase text-[10px] tracking-wider transition-colors cursor-pointer"
                >
                  Restaurer le Brouillon
                </button>
                <button
                  type="button"
                  onClick={discardDraft}
                  className="bg-transparent hover:bg-slate-200 text-slate-500 px-3 py-1.5 font-bold uppercase text-[10px] tracking-wider transition-colors cursor-pointer"
                >
                  Ignorer
                </button>
              </div>
            </div>
          )}

          {isTemplateLoaded && (
            <div className="bg-sky-50 border-l-4 border-[#00BFFF] p-4 flex gap-3 items-center">
              <Info className="w-5 h-5 text-[#00BFFF] shrink-0" />
              <div>
                <h4 className="text-xs font-black uppercase text-sky-900 tracking-wider">Plan d'Hier Chargé</h4>
                <p className="text-[11px] text-sky-800 font-bold mt-0.5">
                  Ce registre n'est pas encore enregistré. Les lignes ont été pré-remplies automatiquement à partir de la planification du <span className="underline">{templateDateHint}</span> pour vous permettre de simplement saisir les réalisés.
                </p>
              </div>
            </div>
          )}

          {/* SPREADSHEET TABS */}
          <div className="border border-slate-200 p-4 bg-slate-50/50 space-y-4 shadow-sm">
            <div className="flex flex-wrap items-center border-b border-slate-200 pb-2 gap-2">
              {[
                { id: 'minage', label: '🔨 Sheet 1 - Forage & Minage', activeStyle: 'bg-[#8B0000] text-white' },
                { id: 'deblayage', label: 'LHD - Déblayage & Charge', activeStyle: 'bg-[#00BFFF] text-white' },
                { id: 'extraction', label: '🚃 Sheet 3 - Extraction & Wagons', activeStyle: 'bg-[#8B0000] text-white' },
                { id: 'maintenance', label: '🔧 Sheet 4 - Brigade Technique', activeStyle: 'bg-slate-800 text-white' },
              ].map(sheet => (
                <button
                  key={sheet.id}
                  onClick={() => setActiveSheetTab(sheet.id as any)}
                  className={`px-4 py-2 font-black text-xs uppercase tracking-wide transition-all ${
                    activeSheetTab === sheet.id 
                      ? sheet.activeStyle 
                      : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-50'
                  }`}
                >
                  {sheet.label}
                </button>
              ))}
            </div>

            {/* ASSISTANTS DE SAISIE POUR LE SECRETARIAT */}
            <div className="bg-white border border-slate-200/80 p-3 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-black tracking-widest text-[#8B0000] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#00BFFF]" /> Assistants de Saisie (Espace Secrétariat SMI)
                </span>
                <p className="text-[10px] text-slate-500 font-bold">
                  Utilisez ces raccourcis premium pour accélérer considérablement le remplissage de vos fiches de poste quotidiennes.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={copyYesterdayShiftTeam}
                  disabled={copyStatus === 'copying'}
                  className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-wider flex items-center gap-2 transition-all border ${
                    copyStatus === 'copied' 
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold'
                      : copyStatus === 'no_data'
                      ? 'bg-amber-50 text-amber-800 border-amber-300'
                      : copyStatus === 'error'
                      ? 'bg-red-50 text-red-800 border-red-300'
                      : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100 font-bold'
                  }`}
                  title="Copie automatiquement l'effectif / personnel du même poste de la veille pour éviter la saisie manuelle répétitive."
                >
                  <UserCheck className="w-3.5 h-3.5 text-[#8B0000]" />
                  {copyStatus === 'copying' && 'Recherche en cours...'}
                  {copyStatus === 'copied' && '✓ Personnel d\'hier copié !'}
                  {copyStatus === 'no_data' && `⚠️ Pas d'équipe enregistrée le ${format(subDays(new Date(selectedDate + "T12:00:00"), 1), 'dd/MM/yyyy')}`}
                  {copyStatus === 'error' && '❌ Erreur de copie'}
                  {copyStatus === 'idle' && `Copier l'équipe du même poste d'hier (${format(subDays(new Date(selectedDate + "T12:00:00"), 1), 'dd/MM')})`}
                </button>

                <button
                  type="button"
                  onClick={standardizeHours}
                  className="bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-300 px-4 py-1.5 text-[10px] font-black uppercase tracking-wider flex items-center gap-2 transition-all"
                  title="Pré-remplit les colonnes Horaires avec les heures de début/fin standards pour le poste actif."
                >
                  <Clock3 className="w-3.5 h-3.5 text-[#00BFFF]" />
                  Remplir Horaires standard
                </button>
              </div>
            </div>

            {/* TAB CONTENT: MINAGE */}
            {activeSheetTab === 'minage' && (
              <div className="space-y-8">
                <div className="bg-red-50/50 p-4 border border-[#8B0000]/20 rounded mb-1">
                  <h3 className="text-xs font-black uppercase text-[#8B0000] tracking-wider flex items-center gap-2">
                    <Hammer className="w-4 h-4 text-[#00BFFF]" /> Forage et Tirs de Volée de Front (Saisie Multiguichet de Postes)
                  </h3>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mt-1">
                    Gestion conjointe de l'avancement et de l'encadrement des trois postes de travail (Poste 1, Poste 2, Poste 3) pour la date sélectionnée.
                  </p>
                </div>

                {['Poste 1', 'Poste 2', 'Poste 3'].map((shiftName) => {
                  const state = getPostState(shiftName);
                  const rows = state.minageRows;

                  return (
                    <div key={shiftName} className="border border-slate-200 bg-white p-5 rounded-lg shadow-sm space-y-4">
                      {/* Shift title and Hours bar with beautiful styling */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-3 gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">
                            {shiftName === 'Poste 1' ? '☀️' : shiftName === 'Poste 2' ? '⛅' : '🌙'}
                          </span>
                          <h4 className="text-sm font-black uppercase text-slate-800 tracking-wider">
                            {shiftName === 'Poste 1' ? 'POSTE 1 : MATIN' : shiftName === 'Poste 2' ? 'POSTE 2 : APRÈS-MIDI' : 'POSTE 3 : NUIT'}
                          </h4>
                          <span className="font-mono text-xs font-bold text-slate-400 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                            {shiftName === 'Poste 1' ? '07:00 - 14:00 GMT' : shiftName === 'Poste 2' ? '15:00 - 22:00 GMT' : '23:00 - 06:00 GMT'}
                          </span>
                        </div>

                        {/* Assistants row specifically for this shift */}
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => copyYesterdayShiftTeam(shiftName)}
                            disabled={copyStatus === 'copying'}
                            className="px-3 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-black uppercase tracking-wider rounded flex items-center gap-1.5 transition-all"
                          >
                            <UserCheck className="w-3.5 h-3.5 text-[#8B0000]" /> Copier l'équipe d'hier
                          </button>
                          <button
                            type="button"
                            onClick={() => standardizeHours(shiftName)}
                            className="px-3 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-[10px] font-black uppercase tracking-wider rounded flex items-center gap-1.5 transition-all"
                          >
                            <Clock3 className="w-3.5 h-3.5 text-[#00BFFF]" /> Remplir Heures Standard
                          </button>
                        </div>
                      </div>

                      {/* Chef(s) inputs */}
                      <div className="bg-slate-50 p-4 border border-slate-200/80 grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-[#8B0000] text-white">
                            <HardHat className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                              Chef de Poste Principal (OBLIGATOIRE)
                            </label>
                            <EmployeeCell
                              matricule={state.chiefMatricule}
                              name={state.chiefName}
                              onChange={(mat, resName) => {
                                state.setChiefMatricule(mat);
                                state.setChiefName(resName);
                              }}
                              employees={activeEmployees}
                              placeholder="Matricule Chef..."
                            />
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-slate-700 text-white">
                            <Plus className="w-5 h-5 text-[#00BFFF]" />
                          </div>
                          <div className="flex-1">
                            <label className="text-[10px] font-black uppercase text-slate-500 block mb-1">
                              Autre Chef (Optionnel / Si double encadrement)
                            </label>
                             <EmployeeCell
                              matricule={state.secondChiefMatricule}
                              name={state.secondChiefName}
                              onChange={(mat, resName) => {
                                state.setSecondChiefMatricule(mat);
                                state.setSecondChiefName(resName);
                              }}
                              employees={activeEmployees}
                              placeholder="Matricule Autre Chef..."
                            />
                          </div>
                        </div>
                      </div>

                      {/* Forage & Minage table */}
                      <div className="overflow-x-auto rounded border border-slate-200 bg-white shadow-sm">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-extrabold uppercase text-[10px] tracking-wider">
                              <th className="p-2 text-[10px] font-black uppercase text-center w-12 border-r border-slate-200 text-slate-500 bg-slate-50">#</th>
                              <th className="p-2 text-[10px] font-black uppercase border-r border-slate-200 text-slate-700">Chantier</th>
                              <th className="p-2 text-[10px] font-black uppercase w-48 border-r border-slate-200 text-slate-700">Matr. Mineur</th>
                              <th className="p-2 text-[10px] font-black uppercase w-48 border-r border-slate-200 text-slate-700">Matr. Assistant</th>
                              <th className="p-2 text-[10px] font-black uppercase w-32 border-r border-slate-200 text-center text-slate-700">Section</th>
                              <th className="p-2 text-[10px] font-black uppercase w-24 border-r border-slate-200 text-center text-slate-700">Trous forés</th>
                              <th className="p-2 text-[10px] font-black uppercase w-24 border-r border-slate-200 text-center text-slate-700">Nbr. volées</th>
                              <th className="p-2 text-[10px] font-black uppercase w-28 border-r border-slate-200 text-center text-red-900 bg-red-50/50">Métrage Planifié</th>
                              <th className="p-2 text-[10px] font-black uppercase w-28 border-r border-slate-200 text-center bg-emerald-50 text-emerald-950 font-black">Métrage Arraché</th>
                              <th className="p-2 text-[10px] font-black uppercase w-20 border-r border-slate-200 text-center text-slate-700 bg-slate-100 font-bold">ANFO (kg)</th>
                              <th className="p-2 text-[10px] font-black uppercase w-20 border-r border-slate-200 text-center text-slate-700 bg-slate-100 font-bold">TOVEX (kg)</th>
                              <th className="p-2 text-[10px] font-black uppercase w-20 border-r border-slate-200 text-center text-slate-700 bg-slate-100 font-bold">Amorces</th>
                              <th className="p-2 text-[10px] font-black uppercase text-center w-14 text-slate-700 bg-slate-50">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-150 text-[11px]">
                            {renderSectorRows(shiftName, 'Imiter 2', 'bg-neutral-100/90 border-neutral-300 border-t-2', 'text-neutral-900', 'bg-[#8B0000]')}
                            {renderSectorRows(shiftName, 'Imiter 1', 'bg-sky-50/80 border-sky-300 border-t-2', 'text-sky-950', 'bg-[#00BFFF]')}
                            {renderSectorRows(shiftName, 'Imiter Est', 'bg-teal-50/80 border-teal-300 border-t-2', 'text-teal-950', 'bg-teal-600')}
                            
                            {(() => {
                              const otherRows = rows.filter(r => 
                                !['imiter 2', 'imiter 1', 'imiter est'].includes((r.sector || '').trim().toLowerCase())
                              );
                              if (otherRows.length === 0) return null;
                              return renderSectorRows(shiftName, 'Autres / Non Classés', 'bg-slate-50', 'text-slate-900', 'bg-slate-400');
                            })()}

                            {rows.length === 0 && (
                              <tr>
                                <td colSpan={13} className="text-center p-8 text-slate-400 font-bold">
                                  Aucune ligne active. Veuillez ajouter une ligne de minage pour commencer.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}

                {/* DAILY CONSOLIDATED SUMMARY TABLE FOR ALL SHIFTS */}
                <div className="mt-8 border border-slate-300 rounded overflow-hidden shadow-sm bg-white p-6 space-y-4">
                  <div className="flex items-center gap-2 border-b pb-3">
                    <TrendingUp className="w-5 h-5 text-[#8B0000]" />
                    <h3 className="text-sm font-black uppercase text-slate-800 tracking-wider">
                      Tableau Récapitulatif Global de Minage (Tout Postes Confondus - Jour J)
                    </h3>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse border border-slate-250">
                      <thead>
                        <tr className="bg-slate-800 text-white text-[10px] font-black uppercase tracking-wider">
                          <th className="p-3 border border-slate-350">Poste / Shift</th>
                          <th className="p-3 text-center border border-slate-350">Trous Forés (u)</th>
                          <th className="p-3 text-center border border-slate-350">Volées Réalisées</th>
                          <th className="p-3 text-center border border-slate-350 text-red-100 bg-red-900/30">Métrage Planifié</th>
                          <th className="p-3 text-center border border-slate-350 text-emerald-100 bg-emerald-950/30">Métrage Arraché</th>
                          <th className="p-3 text-center border border-slate-350 bg-slate-700">ANFO (kg)</th>
                          <th className="p-3 text-center border border-slate-350 bg-slate-700">TOVEX (kg)</th>
                          <th className="p-3 text-center border border-slate-350 bg-slate-700">Amorces (u)</th>
                          <th className="p-3 text-center border border-slate-350 bg-amber-950/40">Arrachement (%)</th>
                        </tr>
                      </thead>
                      <tbody className="text-xs font-bold text-slate-700 divide-y divide-slate-200">
                        {(() => {
                          const shiftsList = [
                            { name: 'Poste 1 (Matin)', rows: p1MinageRows },
                            { name: 'Poste 2 (Après-midi)', rows: p2MinageRows },
                            { name: 'Poste 3 (Nuit)', rows: p3MinageRows },
                          ];

                          const stats = shiftsList.map(s => {
                            const holes = s.rows.reduce((sum, r) => sum + (Number(r.realHoles) || 0), 0);
                            const rounds = s.rows.reduce((sum, r) => sum + (Number(r.realRounds) || 0), 0);
                            const planned = s.rows.reduce((sum, r) => sum + (Number(r.meterage) || 0), 0);
                            const real = s.rows.reduce((sum, r) => sum + (Number(r.realMeterage === undefined ? r.meterage : r.realMeterage) || 0), 0);
                            const anfo = s.rows.reduce((sum, r) => sum + (Number(r.anfo) || 0), 0);
                            const tovex = s.rows.reduce((sum, r) => sum + (Number(r.tovex) || 0), 0);
                            const ammorces = s.rows.reduce((sum, r) => sum + (Number(r.ammorces) || 0), 0);
                            const eff = planned > 0 ? ((real / planned) * 100).toFixed(1) : '0.0';
                            return { name: s.name, holes, rounds, planned, real, anfo, tovex, ammorces, eff };
                          });

                          const totalHoles = stats.reduce((sum, s) => sum + s.holes, 0);
                          const totalRounds = stats.reduce((sum, s) => sum + s.rounds, 0);
                          const totalPlanned = stats.reduce((sum, s) => sum + s.planned, 0);
                          const totalReal = stats.reduce((sum, s) => sum + s.real, 0);
                          const totalAnfo = stats.reduce((sum, s) => sum + s.anfo, 0);
                          const totalTovex = stats.reduce((sum, s) => sum + s.tovex, 0);
                          const totalAmorces = stats.reduce((sum, s) => sum + s.ammorces, 0);
                          const totalEff = totalPlanned > 0 ? ((totalReal / totalPlanned) * 100).toFixed(1) : '0.0';

                          return (
                            <>
                              {stats.map(s => (
                                <tr key={s.name} className="hover:bg-slate-50 transition-colors">
                                  <td className="p-3 font-black text-slate-800 border border-slate-200">{s.name}</td>
                                  <td className="p-3 text-center border border-slate-200 font-mono text-slate-600">{s.holes}</td>
                                  <td className="p-3 text-center border border-slate-200 font-mono text-slate-600">{s.rounds}</td>
                                  <td className="p-3 text-center border border-slate-200 font-mono text-red-800 bg-red-50/20">{s.planned.toFixed(1)} m</td>
                                  <td className="p-3 text-center border border-slate-200 font-mono text-emerald-800 bg-emerald-50">{s.real.toFixed(1)} m</td>
                                  <td className="p-3 text-center border border-slate-200 font-mono">{s.anfo} kg</td>
                                  <td className="p-3 text-center border border-slate-200 font-mono">{s.tovex} kg</td>
                                  <td className="p-3 text-center border border-slate-200 font-mono">{s.ammorces}</td>
                                  <td className="p-3 text-center border border-slate-200 font-mono text-amber-750 bg-amber-50/40">{s.eff}%</td>
                                </tr>
                              ))}
                              
                              {/* Total row */}
                              <tr className="bg-slate-100 text-[#8B0000] font-black border-t-2 border-slate-350">
                                <td className="p-3 border border-slate-200 uppercase tracking-widest text-xs">Total de la Journée</td>
                                <td className="p-3 text-center border border-slate-200 font-mono text-black text-xs">{totalHoles} u.</td>
                                <td className="p-3 text-center border border-slate-200 font-mono text-black text-xs">{totalRounds} v.</td>
                                <td className="p-3 text-center border border-slate-200 font-mono text-red-900 bg-red-100/30 text-xs">{totalPlanned.toFixed(1)} m</td>
                                <td className="p-3 text-center border border-slate-200 font-mono text-emerald-950 bg-emerald-100/30 text-xs">{totalReal.toFixed(1)} m</td>
                                <td className="p-3 text-center border border-slate-200 font-mono text-black text-xs">{totalAnfo} kg</td>
                                <td className="p-3 text-center border border-slate-200 font-mono text-black text-xs">{totalTovex} kg</td>
                                <td className="p-3 text-center border border-slate-200 font-mono text-black text-xs">{totalAmorces}</td>
                                <td className="p-3 text-center border border-slate-200 font-mono text-amber-950 bg-amber-100/30 text-xs">{totalEff}%</td>
                              </tr>
                            </>
                          );
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: DEBLAYAGE */}
            {activeSheetTab === 'deblayage' && (
              <div className="space-y-8">
                <div className="bg-sky-50/50 p-4 border border-[#00BFFF]/20 rounded mb-1">
                  <h3 className="text-xs font-black uppercase text-[#00BFFF] tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#8B0000]" /> Déblayage mécanique LHD (Secteurs de Fond & Fluides)
                  </h3>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mt-1">
                    Saisie globale des volumes et fluides consommés par les chargeuses souterraines sur les 3 postes de rotation.
                  </p>
                </div>

                {['Poste 1', 'Poste 2', 'Poste 3'].map((shiftName) => {
                  const { deblayageRows } = getPostState(shiftName);

                  return (
                    <div key={shiftName} className="border border-slate-200 bg-white p-5 rounded-lg shadow-sm space-y-4">
                      {/* Shift title and Hours bar */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-3 gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">
                            {shiftName === 'Poste 1' ? '☀️' : shiftName === 'Poste 2' ? '⛅' : '🌙'}
                          </span>
                          <h4 className="text-sm font-black uppercase text-slate-800 tracking-wider">
                            {shiftName === 'Poste 1' ? 'POSTE 1 : MATIN' : shiftName === 'Poste 2' ? 'POSTE 2 : APRÈS-MIDI' : 'POSTE 3 : NUIT'}
                          </h4>
                          <span className="font-mono text-xs font-bold text-slate-400 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                            {shiftName === 'Poste 1' ? '07:00 - 14:00 GMT' : shiftName === 'Poste 2' ? '15:00 - 22:00 GMT' : '23:00 - 06:00 GMT'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => addDeblayageRow(shiftName)}
                            className="bg-[#00BFFF] hover:bg-[#00BFFF]/95 text-white font-black text-[10px] uppercase px-3 py-1.5 flex items-center gap-1.5 transition-all shadow-sm rounded cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" /> Ajouter une ligne ({shiftName})
                          </button>
                        </div>
                      </div>

                      {/* Deblayage details table */}
                      <div className="overflow-x-auto rounded border border-slate-200 bg-white">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-extrabold uppercase text-[10px] tracking-wider">
                              <th className="p-2 text-[10px] font-black uppercase text-center w-12 border-r border-slate-200 text-slate-500 bg-slate-50">#</th>
                              <th className="p-2 text-[10px] font-black uppercase w-32 border-r border-slate-200 text-slate-700">Secteur Chargé</th>
                              <th className="p-2 text-[10px] font-black uppercase w-32 border-r border-slate-200 text-slate-700">Matr. Conducteur</th>
                              <th className="p-2 text-[10px] font-black uppercase w-44 border-r border-slate-200 text-slate-700">Conducteur Nom</th>
                              <th className="p-2 text-[10px] font-black uppercase w-36 border-r border-slate-200 text-slate-700">Engin Charge-LHD</th>
                              <th className="p-2 text-[10px] font-black uppercase w-24 border-r border-slate-200 text-center bg-slate-50 text-slate-700">Nombre Godets</th>
                              <th className="p-2 text-[10px] font-black uppercase w-24 border-r border-slate-200 text-center text-slate-700">Volume Estimé</th>
                              <th className="p-2 text-[10px] font-black uppercase w-24 border-r border-slate-200 text-center text-slate-700">Heure Début</th>
                              <th className="p-2 text-[10px] font-black uppercase w-24 border-r border-slate-200 text-center text-slate-700">Heure Finition</th>
                              <th className="p-2 text-[10px] font-black uppercase w-24 border-r border-slate-200 text-center bg-blue-50/50 text-blue-900 font-bold">Gasoil Pris (L)</th>
                              <th className="p-2 text-[10px] font-black uppercase w-36 border-r border-slate-200 bg-slate-50 text-slate-700">Lubrifiant Pris 1</th>
                              <th className="p-2 text-[10px] font-black uppercase w-20 border-r border-slate-200 text-center bg-slate-50 text-slate-700 font-bold">Qté 1 (L/Kg)</th>
                              <th className="p-2 text-[10px] font-black uppercase w-36 border-r border-slate-200 bg-slate-50 text-slate-700">Lubrifiant Pris 2</th>
                              <th className="p-2 text-[10px] font-black uppercase w-20 border-r border-slate-200 text-center bg-slate-50 text-slate-700 font-bold">Qté 2 (L/Kg)</th>
                              <th className="p-2 text-[10px] font-black uppercase border-r border-slate-200 text-slate-700">Fait de rotation</th>
                              <th className="p-2 text-[10px] font-black uppercase text-center w-14 text-slate-700">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-150 text-[11px]">
                            {renderDeblayageSectorRows(shiftName, 'Imiter 2', 'bg-neutral-100/90 border-neutral-300 border-t-2', 'text-neutral-900', 'bg-[#8B0000]')}
                            {renderDeblayageSectorRows(shiftName, 'Imiter 1', 'bg-sky-50/80 border-sky-300 border-t-2', 'text-sky-950', 'bg-[#00BFFF]')}
                            {renderDeblayageSectorRows(shiftName, 'Imiter Est', 'bg-teal-50/80 border-teal-300 border-t-2', 'text-teal-950', 'bg-teal-600')}
                            
                            {(() => {
                              const otherRows = deblayageRows.filter(r => 
                                !['imiter 2', 'imiter 1', 'imiter est'].includes((r.sector || '').trim().toLowerCase())
                              );
                              if (otherRows.length === 0) return null;
                              return renderDeblayageSectorRows(shiftName, 'Autres / Non Classés', 'bg-slate-50', 'text-slate-900', 'bg-slate-400');
                            })()}

                            {deblayageRows.length === 0 && (
                              <tr>
                                <td colSpan={16} className="text-center p-8 text-slate-400 font-bold">
                                  Aucune ligne active. Veuillez ajouter une ligne de déblayage pour commencer.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}

                {/* DAILY CONSOLIDATED SUMMARY TABLE FOR DEBLAYAGE */}
                <div className="mt-8 border border-slate-300 rounded overflow-hidden shadow-sm bg-white p-6 space-y-4">
                  <div className="flex items-center gap-2 border-b pb-3">
                    <TrendingUp className="w-5 h-5 text-[#00BFFF]" />
                    <h3 className="text-sm font-black uppercase text-slate-800 tracking-wider">
                      Tableau Récapitulatif Global de Déblayage & Fluides (Tout Postes Confondus - Jour J)
                    </h3>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse border border-slate-250">
                      <thead>
                        <tr className="bg-slate-800 text-white text-[10px] font-black uppercase tracking-wider">
                          <th className="p-3 border border-slate-350 bg-slate-900">Poste / Shift</th>
                          <th className="p-3 text-center border border-slate-350 bg-slate-900">Nombre Godets (u)</th>
                          <th className="p-3 text-center border border-slate-350 text-emerald-100 bg-emerald-950/30">Volume Souterrain Estimé</th>
                          <th className="p-3 text-center border border-slate-350 text-blue-105 bg-blue-950/30">Gasoil Pris (L)</th>
                          <th className="p-3 text-center border border-slate-350 bg-slate-700">Lubrifiant 1 (L/Kg)</th>
                          <th className="p-3 text-center border border-slate-350 bg-slate-700">Lubrifiant 2 (L/Kg)</th>
                          <th className="p-3 text-center border border-slate-350 bg-[#8B0000]/25 text-[#8B0000]">Ratio Conso (L/m³)</th>
                          <th className="p-3 text-center border border-slate-350 bg-teal-950/40 text-teal-100">Facteur Remplissage (m³/Godet)</th>
                        </tr>
                      </thead>
                      <tbody className="text-xs font-bold text-slate-700 divide-y divide-slate-200">
                        {(() => {
                          const shiftsList = [
                            { name: 'Poste 1 (Matin)', rows: p1DeblayageRows },
                            { name: 'Poste 2 (Après-midi)', rows: p2DeblayageRows },
                            { name: 'Poste 3 (Nuit)', rows: p3DeblayageRows },
                          ];

                          const stats = shiftsList.map(s => {
                            const godets = s.rows.reduce((sum, r) => sum + (Number(r.godets) || 0), 0);
                            const volume = s.rows.reduce((sum, r) => sum + (Number(r.volumeEstimated) || 0), 0);
                            const gasoil = s.rows.reduce((sum, r) => sum + (Number(r.gasoil) || 0), 0);
                            const lub1 = s.rows.reduce((sum, r) => sum + (Number(r.lubrifiant1Qty) || 0), 0);
                            const lub2 = s.rows.reduce((sum, r) => sum + (Number(r.lubrifiant2Qty) || 0), 0);
                            const ratio = volume > 0 ? (gasoil / volume).toFixed(3) : '0';
                            const fillFactor = godets > 0 ? (volume / godets).toFixed(2) : '1.50';
                            return { name: s.name, godets, volume, gasoil, lub1, lub2, ratio, fillFactor };
                          });

                          const totalGodets = stats.reduce((sum, d) => sum + d.godets, 0);
                          const totalVolume = stats.reduce((sum, d) => sum + d.volume, 0);
                          const totalGasoil = stats.reduce((sum, d) => sum + d.gasoil, 0);
                          const totalLub1 = stats.reduce((sum, d) => sum + d.lub1, 0);
                          const totalLub2 = stats.reduce((sum, d) => sum + d.lub2, 0);
                          const totalRatio = totalVolume > 0 ? (totalGasoil / totalVolume).toFixed(3) : '0';
                          const totalFillFactor = totalGodets > 0 ? (totalVolume / totalGodets).toFixed(2) : '1.50';

                          return (
                            <>
                              {stats.map(s => (
                                <tr key={s.name} className="hover:bg-slate-50 transition-colors">
                                  <td className="p-3 font-black text-slate-800 border border-slate-200">{s.name}</td>
                                  <td className="p-3 text-center border border-slate-200 font-mono text-slate-600">{s.godets}</td>
                                  <td className="p-3 text-center border border-slate-200 font-mono text-emerald-800 bg-emerald-50">{s.volume.toFixed(1)} m³</td>
                                  <td className="p-3 text-center border border-slate-200 font-mono text-blue-800 bg-blue-50/20">{s.gasoil} L</td>
                                  <td className="p-3 text-center border border-slate-200 font-mono">{s.lub1}</td>
                                  <td className="p-3 text-center border border-slate-200 font-mono">{s.lub2}</td>
                                  <td className="p-3 text-center border border-slate-200 font-mono text-red-750 bg-red-50/25">{s.ratio}</td>
                                  <td className="p-3 text-center border border-slate-200 font-mono text-teal-800 bg-teal-50/20">{s.fillFactor}</td>
                                </tr>
                              ))}
                              
                              {/* Total row */}
                              <tr className="bg-slate-100 text-[#00BFFF] font-black border-t-2 border-slate-350">
                                <td className="p-3 border border-slate-200 uppercase tracking-widest text-[#00BFFF] text-xs font-black">Total de la Journée</td>
                                <td className="p-3 text-center border border-slate-200 font-mono text-black text-xs">{totalGodets} u.</td>
                                <td className="p-3 text-center border border-slate-200 font-mono text-emerald-950 bg-emerald-100/30 text-xs">{totalVolume.toFixed(1)} m³</td>
                                <td className="p-3 text-center border border-slate-200 font-mono text-blue-950 bg-blue-100/30 text-xs">{totalGasoil} L</td>
                                <td className="p-3 text-center border border-slate-200 font-mono text-black text-xs">{totalLub1}</td>
                                <td className="p-3 text-center border border-slate-200 font-mono text-black text-xs">{totalLub2}</td>
                                <td className="p-3 text-center border border-slate-200 font-mono text-red-950 bg-red-100/30 text-xs font-black">{totalRatio}</td>
                                <td className="p-3 text-center border border-slate-200 font-mono text-teal-950 bg-teal-100/30 text-xs font-black">{totalFillFactor}</td>
                              </tr>
                            </>
                          );
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: EXTRACTION */}
            {activeSheetTab === 'extraction' && (
              <div className="space-y-8">
                <div className="bg-amber-50/50 p-4 border border-amber-500/20 rounded mb-1">
                  <h3 className="text-xs font-black uppercase text-[#8B0000] tracking-wider flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#00BFFF]" /> Extraction - Bure igoudrane N340 imiter est
                  </h3>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mt-1">
                    Saisie et suivi des wagons de minerai et de stérile extraits par les treuils d'extraction sur chacun des trois postes.
                  </p>
                </div>

                {['Poste 1', 'Poste 2', 'Poste 3'].map((shiftName) => {
                  const { extractionRows } = getPostState(shiftName);

                  return (
                    <div key={shiftName} className="border border-slate-200 bg-white p-5 rounded-lg shadow-sm space-y-4">
                      {/* Shift Title with beautiful styling */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-3 gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">
                            {shiftName === 'Poste 1' ? '☀️' : shiftName === 'Poste 2' ? '⛅' : '🌙'}
                          </span>
                          <h4 className="text-sm font-black uppercase text-slate-800 tracking-wider">
                            {shiftName === 'Poste 1' ? 'POSTE 1 : MATIN' : shiftName === 'Poste 2' ? 'POSTE 2 : APRÈS-MIDI' : 'POSTE 3 : NUIT'}
                          </h4>
                          <span className="font-mono text-xs font-bold text-slate-400 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                            {shiftName === 'Poste 1' ? '07:00 - 14:00 GMT' : shiftName === 'Poste 2' ? '15:00 - 22:00 GMT' : '23:00 - 06:00 GMT'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => addExtractionRow(shiftName)}
                            className="bg-[#00BFFF] hover:bg-[#00BFFF]/95 text-white font-black text-[10px] uppercase px-3 py-1.5 flex items-center gap-1.5 transition-all shadow-sm rounded cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" /> Ajouter une ligne ({shiftName})
                          </button>
                        </div>
                      </div>

                      {/* Chef de poste read-only pulling from Minage */}
                      {(() => {
                        const { chiefName } = getPostState(shiftName);
                        return (
                          <div className="bg-slate-50 px-4 py-2 border border-slate-200 rounded flex items-center gap-3">
                            <span className="text-[10px] bg-[#8B0000] text-white px-2 py-1 font-black uppercase">
                              Chef de Sec (Imiter Est) / Poste
                            </span>
                            <span className="text-xs font-extrabold text-slate-700 uppercase">
                              {chiefName || 'Non défini (Saisir le Chef dans la feuille Minage)'}
                            </span>
                          </div>
                        );
                      })()}

                      {/* Extraction details table */}
                      <div className="overflow-x-auto rounded border border-slate-200 bg-white">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-extrabold uppercase text-[10px] tracking-wider">
                              <th className="p-2 text-[10px] font-black uppercase text-center w-12 border-r border-slate-200 text-slate-500 bg-slate-50">#</th>
                              <th className="p-2 text-[10px] font-black uppercase w-32 border-r border-slate-200 text-slate-700">Treuilliste</th>
                              <th className="p-2 text-[10px] font-black uppercase w-32 border-r border-slate-200 text-slate-700">Équipier 1</th>
                              <th className="p-2 text-[10px] font-black uppercase w-32 border-r border-slate-200 text-slate-700">Équipier 2</th>
                              <th className="p-2 text-[10px] font-black uppercase w-32 border-r border-slate-200 text-slate-700">Équipier 3</th>
                              <th className="p-2 text-[10px] font-black uppercase w-32 border-r border-slate-200 text-slate-700">Équipier 4</th>
                              <th className="p-2 text-[10px] font-black uppercase w-24 border-r border-slate-200 text-center bg-slate-50 text-slate-700">Wagons Chargés</th>
                              <th className="p-2 text-[10px] font-black uppercase w-16 border-r border-slate-200 text-center text-slate-700 font-bold">Objectif</th>
                              <th className="p-2 text-[10px] font-black uppercase w-24 border-r border-slate-200 text-center text-slate-700">Fréquence</th>
                              <th className="p-2 text-[10px] font-black uppercase w-20 border-r border-slate-200 text-center text-slate-700">Stérile (Wagons)</th>
                              <th className="p-2 text-[10px] font-black uppercase w-24 border-r border-slate-200 text-center text-slate-700">Heure Début</th>
                              <th className="p-2 text-[10px] font-black uppercase w-24 border-r border-slate-200 text-center text-slate-700">Heure Finit</th>
                              <th className="p-2 text-[10px] font-black uppercase text-center w-14 text-slate-700">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-150 text-[11px]">
                            {extractionRows.map((row, idx) => {
                              const freqMin = row.wagonsActual > 0 ? (360 / row.wagonsActual).toFixed(1) + ' min' : '0 min';
                              const pct = ((row.wagonsActual / (row.wagonsTarget || 48)) * 100).toFixed(0);

                              const treuillistName = getEmployeeName(row.treuilliste);
                              const eq1Name = getEmployeeName(row.equipier1);
                              const eq2Name = getEmployeeName(row.equipier2);
                              const eq3Name = getEmployeeName(row.equipier3);
                              const eq4Name = getEmployeeName(row.equipier4);

                              return (
                                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                  <td className="p-2 font-mono text-slate-400 bg-slate-50/50 text-center font-bold border-r border-slate-200">{idx + 1}</td>
                                  
                                  {/* Treuilliste Matricule */}
                                  <td className="p-2 border-r border-slate-200">
                                    <EmployeeCell
                                      matricule={row.treuilliste || ''}
                                      name={treuillistName}
                                      onChange={(mat) => updateExtractionCell(shiftName, idx, 'treuilliste', mat)}
                                      employees={activeEmployees}
                                      placeholder="Treuilliste..."
                                    />
                                  </td>

                                  {/* Équipier 1 */}
                                  <td className="p-2 border-r border-slate-200">
                                    <EmployeeCell
                                      matricule={row.equipier1 || ''}
                                      name={eq1Name}
                                      onChange={(mat) => updateExtractionCell(shiftName, idx, 'equipier1', mat)}
                                      employees={activeEmployees}
                                      placeholder="Équipier 1..."
                                    />
                                  </td>

                                  {/* Équipier 2 */}
                                  <td className="p-2 border-r border-slate-200">
                                    <EmployeeCell
                                      matricule={row.equipier2 || ''}
                                      name={eq2Name}
                                      onChange={(mat) => updateExtractionCell(shiftName, idx, 'equipier2', mat)}
                                      employees={activeEmployees}
                                      placeholder="Équipier 2..."
                                    />
                                  </td>

                                  {/* Équipier 3 */}
                                  <td className="p-2 border-r border-slate-200">
                                    <EmployeeCell
                                      matricule={row.equipier3 || ''}
                                      name={eq3Name}
                                      onChange={(mat) => updateExtractionCell(shiftName, idx, 'equipier3', mat)}
                                      employees={activeEmployees}
                                      placeholder="Équipier 3..."
                                    />
                                  </td>

                                  {/* Équipier 4 */}
                                  <td className="p-2 border-r border-slate-200">
                                    <EmployeeCell
                                      matricule={row.equipier4 || ''}
                                      name={eq4Name}
                                      onChange={(mat) => updateExtractionCell(shiftName, idx, 'equipier4', mat)}
                                      employees={activeEmployees}
                                      placeholder="Équipier 4..."
                                    />
                                  </td>

                                  {/* Wagons actual */}
                                  <td className="p-2 border-r border-slate-200 bg-emerald-50 text-center">
                                    <input
                                      type="number"
                                      value={row.wagonsActual === 0 ? '' : row.wagonsActual}
                                      placeholder="0"
                                      onChange={e => updateExtractionCell(shiftName, idx, 'wagonsActual', Number(e.target.value))}
                                      className="w-16 font-black text-center text-emerald-900 outline-none bg-transparent select-all"
                                    />
                                  </td>

                                  {/* Objective (always 48) */}
                                  <td className="p-2 border-r border-slate-200 text-center font-bold text-slate-400 bg-slate-50">
                                    {row.wagonsTarget || 48}
                                  </td>

                                  {/* Frequency */}
                                  <td className="p-2 border-r border-slate-200 text-center font-bold text-blue-900 bg-slate-50/50">
                                    {freqMin} <span className="text-[9px] text-[#8B0000] font-black">({pct}%)</span>
                                  </td>

                                  {/* Stérile (wagons) */}
                                  <td className="p-2 border-r border-slate-200 text-center font-bold text-slate-500">
                                    <input
                                      type="number"
                                      value={row.sterileBureImiterEst === 0 ? '' : row.sterileBureImiterEst}
                                      placeholder="0"
                                      onChange={e => updateExtractionCell(shiftName, idx, 'sterileBureImiterEst', Number(e.target.value))}
                                      className="w-14 text-center font-mono select-all focus:outline-none focus:border-amber-500"
                                    />
                                  </td>

                                  {/* Heure Début */}
                                  <td className="p-2 border-r border-slate-200 text-center">
                                    {renderTimeSelect(row.startTime || '', (val) => updateExtractionCell(shiftName, idx, 'startTime', val))}
                                  </td>

                                  {/* Heure Finit */}
                                  <td className="p-2 border-r border-slate-200 text-center">
                                    {renderTimeSelect(row.endTime || '', (val) => updateExtractionCell(shiftName, idx, 'endTime', val))}
                                  </td>

                                  <td className="p-1 text-center">
                                    <button
                                      type="button"
                                      onClick={() => deleteExtractionRow(shiftName, idx)}
                                      className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                                      title="Supprimer la ligne"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                            {extractionRows.length === 0 && (
                              <tr>
                                <td colSpan={13} className="text-center p-8 text-slate-400 font-bold">
                                  Aucune ligne active. Cliquez sur "Ajouter une ligne ({shiftName})" pour commencer la saisie.
                                </td>
                              </tr>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}

                {/* DAILY CONSOLIDATED SUMMARY TABLE FOR EXTRACTION */}
                <div className="mt-8 border border-slate-300 rounded overflow-hidden shadow-sm bg-white p-6 space-y-4">
                  <div className="flex items-center gap-2 border-b pb-3">
                    <TrendingUp className="w-5 h-5 text-[#8B0000]" />
                    <h3 className="text-sm font-black uppercase text-slate-800 tracking-wider">
                      Tableau Récapitulatif Global d'Extraction (Tout Postes Confondus - Jour J)
                    </h3>
                  </div>
                  
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse border border-slate-250">
                      <thead>
                        <tr className="bg-slate-800 text-white text-[10px] font-black uppercase tracking-wider">
                          <th className="p-3 border border-slate-350 bg-slate-900">Poste / Shift</th>
                          <th className="p-3 text-center border border-slate-350 text-emerald-100 bg-emerald-950/30">Wagons Chargés (u)</th>
                          <th className="p-3 text-center border border-slate-350 bg-slate-700 font-bold">Objectif du Poste (u)</th>
                          <th className="p-3 text-center border border-slate-350 text-amber-100 bg-amber-950/30 font-bold">Stérile Extrait (Wagons)</th>
                          <th className="p-3 text-center border border-slate-350 bg-slate-700">Total Wagons Transférés (u)</th>
                          <th className="p-3 text-center border border-slate-350 bg-blue-950/30 text-blue-100">Taux Réalisation Objectif (%)</th>
                          <th className="p-3 text-center border border-slate-350 bg-red-950/25 text-[#8B0000]">Ratio Stérile (%)</th>
                        </tr>
                      </thead>
                      <tbody className="text-xs font-bold text-slate-700 divide-y divide-slate-200">
                        {(() => {
                          const shiftsList = [
                            { name: 'Poste 1 (Matin)', rows: p1ExtractionRows },
                            { name: 'Poste 2 (Après-midi)', rows: p2ExtractionRows },
                            { name: 'Poste 3 (Nuit)', rows: p3ExtractionRows },
                          ];

                          const stats = shiftsList.map(s => {
                            const wagons = s.rows.reduce((sum, r) => sum + (Number(r.wagonsActual) || 0), 0);
                            const target = s.rows.reduce((sum, r) => sum + (Number(r.wagonsTarget) || 48), 0);
                            const sterile = s.rows.reduce((sum, r) => sum + (Number(r.sterileBureImiterEst) || 0), 0);
                            const totalWag = wagons + sterile;
                            const pct = target > 0 ? ((wagons / target) * 105).toFixed(1) : '0'; // Adjust target ratio calculation
                            const sterilePct = totalWag > 0 ? ((sterile / totalWag) * 100).toFixed(1) : '0';
                            return { name: s.name, wagons, target, sterile, totalWag, pct, sterilePct };
                          });

                          const totalWagons = stats.reduce((sum, e) => sum + e.wagons, 0);
                          const totalTarget = stats.reduce((sum, e) => sum + e.target, 0);
                          const totalSterile = stats.reduce((sum, e) => sum + e.sterile, 0);
                          const totalTransferred = totalWagons + totalSterile;
                          const totalPct = totalTarget > 0 ? ((totalWagons / totalTarget) * 100).toFixed(1) : '0';
                          const totalSterilePct = totalTransferred > 0 ? ((totalSterile / totalTransferred) * 100).toFixed(1) : '0';

                          return (
                            <>
                              {stats.map(s => (
                                <tr key={s.name} className="hover:bg-slate-50 transition-colors">
                                  <td className="p-3 font-black text-slate-800 border border-slate-200">{s.name}</td>
                                  <td className="p-3 text-center border border-slate-200 font-mono text-emerald-800 bg-emerald-50">{s.wagons} Wagons</td>
                                  <td className="p-3 text-center border border-slate-200 font-mono">{s.target}</td>
                                  <td className="p-3 text-center border border-slate-200 font-mono text-amber-800 bg-amber-50/30">{s.sterile} Wg.</td>
                                  <td className="p-3 text-center border border-slate-200 font-mono text-slate-600">{s.totalWag}</td>
                                  <td className="p-3 text-center border border-slate-200 font-mono text-blue-800 bg-blue-50/20">{s.pct}%</td>
                                  <td className="p-3 text-center border border-slate-200 font-mono text-red-750 bg-red-50/25">{s.sterilePct}%</td>
                                </tr>
                              ))}
                              
                              {/* Total row */}
                              <tr className="bg-slate-100 text-[#8B0000] font-black border-t-2 border-slate-350">
                                <td className="p-3 border border-slate-200 uppercase tracking-widest text-[#8B0000] text-xs font-black">Total de la Journée</td>
                                <td className="p-3 text-center border border-slate-200 font-mono text-emerald-950 bg-emerald-100/30 text-xs">{totalWagons} Wagons</td>
                                <td className="p-3 text-center border border-slate-200 font-mono text-black text-xs">{totalTarget}</td>
                                <td className="p-3 text-center border border-slate-200 font-mono text-amber-950 bg-amber-100/30 text-xs">{totalSterile} Wg.</td>
                                <td className="p-3 text-center border border-slate-200 font-mono text-black text-xs">{totalTransferred}</td>
                                <td className="p-3 text-center border border-slate-200 font-mono text-blue-950 bg-blue-100/30 text-xs font-black">{totalPct}%</td>
                                <td className="p-3 text-center border border-slate-200 font-mono text-red-950 bg-red-100/30 text-xs font-black">{totalSterilePct}%</td>
                              </tr>
                            </>
                          );
                        })()}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: MAINTENANCE */}
            {activeSheetTab === 'maintenance' && (
              <div className="space-y-8">
                <div className="bg-purple-50/50 p-4 border border-purple-500/20 rounded mb-1">
                  <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-[#8B0000]" /> Brigade Mobile de diagnostic/mécanique souterraine
                  </h3>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mt-1">
                    Saisie des interventions de maintenance préventive et curative effectuées par la brigade mobile souterraine sur l'ensemble des postes.
                  </p>
                </div>

                {['Poste 1', 'Poste 2', 'Poste 3'].map((shiftName) => {
                  const { maintenanceRows } = getPostState(shiftName);

                  return (
                    <div key={shiftName} className="border border-slate-200 bg-white p-5 rounded-lg shadow-sm space-y-4">
                      {/* Shift Title and Hours */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-3 gap-3">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">
                            {shiftName === 'Poste 1' ? '☀️' : shiftName === 'Poste 2' ? '⛅' : '🌙'}
                          </span>
                          <h4 className="text-sm font-black uppercase text-slate-800 tracking-wider">
                            {shiftName === 'Poste 1' ? 'POSTE 1 : MATIN' : shiftName === 'Poste 2' ? 'POSTE 2 : APRÈS-MIDI' : 'POSTE 3 : NUIT'}
                          </h4>
                          <span className="font-mono text-xs font-bold text-slate-400 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded">
                            {shiftName === 'Poste 1' ? '07:00 - 14:00 GMT' : shiftName === 'Poste 2' ? '15:00 - 22:00 GMT' : '23:00 - 06:00 GMT'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => addMaintenanceRow(shiftName)}
                            className="bg-[#00BFFF] hover:bg-[#00BFFF]/95 text-white font-black text-[10px] uppercase px-3 py-1.5 flex items-center gap-1.5 transition-all shadow-sm rounded cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" /> Ajouter une ligne ({shiftName})
                          </button>
                        </div>
                      </div>

                      {/* Maintenance details table */}
                      <div className="overflow-x-auto rounded border border-slate-200 bg-white">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 font-extrabold uppercase text-[10px] tracking-wider">
                              <th className="p-2 text-[10px] font-black uppercase text-center w-12 border-r border-slate-200 text-slate-500 bg-slate-50">#</th>
                              <th className="p-2 text-[10px] font-black uppercase w-48 border-r border-slate-200 text-slate-700">Rôle Prévu Souterrain</th>
                              <th className="p-2 text-[10px] font-black uppercase w-32 border-r border-slate-200 text-slate-700">Matricule Spécialiste</th>
                              <th className="p-2 text-[10px] font-black uppercase w-44 border-r border-slate-200 text-slate-700">Nom Spécialiste</th>
                              <th className="p-2 text-[10px] font-black uppercase w-48 border-r border-slate-200 text-slate-700">Machine Clé de l'Intervention</th>
                              <th className="p-2 text-[10px] font-black uppercase w-20 border-r border-slate-200 text-center text-slate-700">Durée (h)</th>
                              <th className="p-2 text-[10px] font-black uppercase border-r border-slate-200 text-slate-700">Description diagnostic / Remise en route</th>
                              <th className="p-2 text-[10px] font-black uppercase text-center w-14 text-slate-700">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-150 text-[11px]">
                            {maintenanceRows.map((row, idx) => {
                              const agentValName = getEmployeeName(row.agentMatricule);

                              return (
                                <tr key={idx} className="hover:bg-slate-50 transition-colors">
                                  <td className="p-2 font-mono text-slate-400 bg-slate-50/50 text-center font-bold border-r border-slate-200">{idx + 1}</td>
                                  <td className="p-2 border-r border-slate-200 bg-purple-50/20">
                                    <select
                                      value={row.roleLabel || ''}
                                      onChange={e => updateMaintenanceCell(shiftName, idx, 'roleLabel', e.target.value)}
                                      className="w-full font-black text-purple-900 border border-slate-200 bg-white p-1 rounded-none text-xs text-slate-700"
                                    >
                                      <option value="">-- Choisir Rôle --</option>
                                      <option value="MÉCANICIENS">MÉCANICIENS</option>
                                      <option value="CHAUDRONNIER">CHAUDRONNIER</option>
                                      <option value="ÉLECTRICIEN">ÉLECTRICIEN</option>
                                    </select>
                                  </td>
                                  <td className="p-2 border-r border-slate-200">
                                    <EmployeeCell
                                      matricule={row.agentMatricule}
                                      name={row.agentName}
                                      onChange={(mat) => updateMaintenanceCell(shiftName, idx, 'agentMatricule', mat)}
                                      employees={activeEmployees}
                                      placeholder="Matr. Spécialiste..."
                                      hideNameLabel={true}
                                    />
                                  </td>
                                  <td className="p-2 border-r border-slate-200 text-xs text-slate-500 font-bold bg-slate-50/30">
                                    {agentValName || 'Inconnu'}
                                  </td>
                                  <td className="p-2 border-r border-slate-200">
                                    <select
                                      value={row.engineId || row.engineCode || ''}
                                      onChange={e => updateMaintenanceCell(shiftName, idx, 'engineId', e.target.value)}
                                      className="w-full border border-slate-200 p-1 font-mono text-xs"
                                    >
                                      <option value="">(Aucun engin repéré)</option>
                                      {platformSettings.engines.map(eng => <option key={eng} value={eng}>{eng}</option>)}
                                    </select>
                                  </td>
                                  <td className="p-2 border-r border-slate-200 text-center font-mono">
                                    <input
                                      type="number"
                                      value={row.hoursSpent === 0 ? '' : row.hoursSpent}
                                      placeholder="0"
                                      onChange={e => updateMaintenanceCell(shiftName, idx, 'hoursSpent', Number(e.target.value))}
                                      className="w-14 text-center p-1 border border-slate-200 select-all"
                                    />
                                  </td>
                                  <td className="p-2 border-r border-slate-200">
                                    <input
                                      type="text"
                                      placeholder="Vidange de carter moteur, changement tuyauterie hydraulique..."
                                      value={row.workDescription}
                                      onChange={e => updateMaintenanceCell(shiftName, idx, 'workDescription', e.target.value)}
                                      className="w-full border-0 outline-none uppercase bg-transparent text-slate-700"
                                    />
                                  </td>
                                  <td className="p-1 text-center">
                                    <button
                                      type="button"
                                      onClick={() => deleteMaintenanceRow(shiftName, idx)}
                                      className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                                      title="Supprimer la ligne"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                            {maintenanceRows.length === 0 ? (
                              <tr>
                                <td colSpan={8} className="text-center p-8 text-slate-400 font-bold">
                                  Aucune ligne active. Cliquez sur "Ajouter une ligne ({shiftName})" pour commencer la saisie.
                                </td>
                              </tr>
                            ) : (
                              <>
                                {/* Totals Row */}
                                {(() => {
                                  const totalHours = maintenanceRows.reduce((sum, r) => sum + (Number(r.hoursSpent) || 0), 0);
                                  const interventionsCount = maintenanceRows.filter(r => r.workDescription || r.agentMatricule).length;

                                  return (
                                    <>
                                      <tr className="bg-slate-50 text-slate-800 font-extrabold text-[11px] border-t-2 border-slate-300">
                                        <td colSpan={5} className="p-3 uppercase text-right tracking-wider text-slate-600 font-black">Totaux de Poste (Maintenance - {shiftName})</td>
                                        
                                        {/* Durée (h) */}
                                        <td className="p-3 text-center bg-purple-50 text-purple-900 font-mono font-black border-r border-slate-200">
                                          {totalHours} h
                                        </td>
                                        
                                        {/* Description & Action */}
                                        <td colSpan={2} className="p-3"></td>
                                      </tr>

                                      <tr className="bg-slate-100 text-slate-800 font-black text-[11px] border-t border-slate-300">
                                        <td colSpan={5} className="p-3 text-right text-slate-500 uppercase font-black">Analyse S.M.I:</td>
                                        <td colSpan={3} className="p-3 text-center bg-purple-500/10 text-purple-900 tracking-wide uppercase font-black">
                                          🛠️ Charge d'Indisponibilité Machine : <span className="text-xs font-black font-mono ml-1.5">{totalHours} h d'arrêt / {interventionsCount} interventions</span>
                                        </td>
                                      </tr>
                                    </>
                                  );
                                })()}
                              </>
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* REALTIME SYSTEM ANOMALIES & AUDITS FOR THE RESPONSIBLES (RED AND AMBER WARNINGS) */}
          {anomalies.length > 0 && (
            <div className="bg-[#8B0000]/5 border border-[#8B0000]/10 p-4 space-y-2">
              <h4 className="text-xs font-black text-[#8B0000] uppercase tracking-widest flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-[#8B0000]" /> Détecteur d'Incohérences & Anomalies de production en temps réel :
              </h4>
              <ul className="space-y-1 text-xs font-bold text-slate-700 list-disc list-inside">
                {anomalies.map((an, ind) => (
                  <li key={ind} className={an.level === 'danger' ? 'text-red-700' : 'text-amber-700'}>
                    {an.msg}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* LOWER FOOTER COMMAND TRAY AND PERSISTENCE CONTROL */}
          <div className="bg-slate-900 text-white p-5 flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Compte de session SMI</p>
              <h4 className="text-xs font-black text-[#00BFFF] mt-0.5 uppercase tracking-wide">
                AUTHENTIFIÉ : {user?.email || 'Secrétaire de Bureau Technique'}
              </h4>
            </div>

            <button
              onClick={saveWorkbook}
              disabled={saveStatus === 'saving'}
              className="w-full md:w-auto bg-[#00BFFF] hover:bg-sky-500 text-white font-black py-3 px-8 text-xs uppercase tracking-widest transition-all shadow-md hover:scale-[1.02] active:scale-95"
            >
              {saveStatus === 'saving' ? 'Gravure en cours ...' : saveStatus === 'saved' ? '✓ GRAVÉ AVEC SUCCÈS !' : 'Enregistrer et figer la production du Poste'}
            </button>
          </div>
        </div>
      ) : (
        /* SOUCHIER / CONSOLIDATED HISTORIC LIST */
        <div className="bg-white border-2 border-slate-200">
          <div className="p-4 border-b border-slate-250 bg-slate-50">
            <h3 className="text-sm font-black uppercase text-[#8B0000] tracking-wider">
              📋 Livre d'Or des Fiches de Poste Consolidées
            </h3>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest mt-0.5">
              Historique des cahiers scellés dans la base de données de fond
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse bg-white">
              <thead>
                <tr className="bg-slate-100 border-b border-slate-300 text-slate-700 text-[10px] uppercase font-black">
                  <th className="px-6 py-4 border-r border-slate-200">Date du cahier</th>
                  <th className="px-6 py-4 border-r border-slate-200">Poste concerné</th>
                  <th className="px-6 py-4 border-r border-slate-200 text-right">Métrage Minage</th>
                  <th className="px-6 py-4 border-r border-slate-200 text-right">Total Wagons</th>
                  <th className="px-6 py-4 border-r border-slate-200">Dernier Enregistrement</th>
                  <th className="px-6 py-4">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-150 text-xs">
                {dataHistory.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-slate-800">{rec.date}</td>
                    <td className="px-6 py-4 border-r border-slate-200">
                      <span className="bg-[#8B0000]/5 text-[#8B0000] border border-[#8B0000]/15 px-3 py-1 font-black uppercase text-[10px]">
                        {rec.post}
                      </span>
                    </td>
                    <td className="px-6 py-4 border-r border-slate-200 text-right font-black text-rose-800">{rec.totalMeterage?.toFixed(1)} m</td>
                    <td className="px-6 py-4 border-r border-slate-200 text-right font-black text-blue-900">{rec.totalWagons || 0} u</td>
                    <td className="px-6 py-4 border-r border-slate-200 text-slate-500 font-semibold">
                      {rec.lastUpdated ? format(new Date(rec.lastUpdated), 'dd/MM/yyyy HH:mm') : '--'}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-teal-50 border border-teal-500/20 text-teal-800 font-extrabold text-[10px] uppercase">
                        <CheckCircle className="w-3.5 h-3.5 text-teal-600" /> SCELLÉ AVEC SUCCÈS
                      </span>
                    </td>
                  </tr>
                ))}
                {dataHistory.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center py-20 italic text-slate-400 font-bold uppercase tracking-widest">
                      Aucune fiche scellée trouvée dans les registres.
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
