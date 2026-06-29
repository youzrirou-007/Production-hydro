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
  UserCheck,
  User,
  Copy,
  Lock,
  Pencil
} from 'lucide-react';
import { collection, query, onSnapshot, setDoc, doc, arrayUnion, orderBy, where, getDocs, getDoc, addDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { format, subDays } from 'date-fns';
import logoImg from '../assets/images/hydromines_logo_1781337889277.jpg';

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

function calculateDuration(startTime: string, endTime: string): number {
  if (!startTime || !endTime) return 0;
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  
  let startMinutes = startH * 60 + startM;
  let endMinutes = endH * 60 + endM;
  
  if (endMinutes < startMinutes) {
    endMinutes += 24 * 60;
  }
  
  const durationMinutes = endMinutes - startMinutes;
  return durationMinutes / 60;
}

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
  chargedHoles?: number; // Trous chargés d'explosifs
  emptyHoles?: number; // Trous forés mais non chargés
  plannedRounds: number;
  realRounds: number; // Nombre de volées
  barType?: '1.8m' | '2.4m';
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
  chantierName?: string; // Optional site title
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

interface ExcelRow<T> {
  rowId: string;
  plan: T;
  reel: T;
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
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
  disabled?: boolean;
}

const EmployeeCell: React.FC<EmployeeCellProps> = ({ matricule, name, onChange, employees, placeholder = "Matricule...", hideNameLabel = false, onKeyDown, disabled = false }) => {
  const [typed, setTyped] = React.useState(matricule || '');
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    setTyped(matricule || '');
  }, [matricule]);

  // Only consider active employees for the search list!
  const activeEmps = React.useMemo(() => {
    return (employees || []).filter(e => e.status === 'actif');
  }, [employees]);

  // Try to find exact match in active list or by matching the typed value
  const exactEmp = React.useMemo(() => {
    const q = typed.trim().toUpperCase();
    if (!q) return null;
    return activeEmps.find(
      e => (e.matricule || '').toUpperCase().trim() === q ||
           `${e.nom || ''} ${e.prenom || ''}`.toUpperCase().trim() === q ||
           `${e.prenom || ''} ${e.nom || ''}`.toUpperCase().trim() === q
    );
  }, [typed, activeEmps]);

  const query = typed.trim().toLowerCase();

  // Filter active employees matching query
  const suggestions = React.useMemo(() => {
    if (!query || exactEmp) return [];
    return activeEmps.filter(emp => {
      const m = (emp.matricule || '').toLowerCase();
      const fullName = `${emp.nom || ''} ${emp.prenom || ''}`.toLowerCase();
      const reverseFullName = `${emp.prenom || ''} ${emp.nom || ''}`.toLowerCase();
      return m.includes(query) || fullName.includes(query) || reverseFullName.includes(query);
    });
  }, [query, exactEmp, activeEmps]);

  const isInvalid = typed.trim().length > 0 && !exactEmp && suggestions.length === 0;

  const handleSelect = (emp: any) => {
    setTyped(emp.matricule);
    onChange(emp.matricule, `${emp.nom} ${emp.prenom}`);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full min-w-[130px]">
      <div className={`flex items-center transition-all px-1 py-0.5 border rounded ${disabled ? 'bg-slate-50 border-slate-200 opacity-80 cursor-not-allowed' : isInvalid ? 'border-red-500 bg-red-50/70 border-2' : 'border-slate-200 focus-within:border-sky-400 focus-within:ring-1 focus-within:ring-sky-400'} has-[:disabled]:bg-slate-50 has-[:disabled]:border-slate-200 has-[:disabled]:opacity-80 has-[:disabled]:cursor-not-allowed`}>
        <input
          type="text"
          placeholder={placeholder}
          value={typed}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === 'Tab') {
              if (exactEmp) {
                handleSelect(exactEmp);
              } else if (typed.trim() === '') {
                onChange('', '');
                setIsOpen(false);
              } else if (suggestions.length > 0) {
                handleSelect(suggestions[0]);
              } else {
                setTyped(matricule || '');
                setIsOpen(false);
              }
            }
            if (onKeyDown) onKeyDown(e);
          }}
          disabled={disabled}
          onChange={(e) => {
            if (disabled) return;
            const val = e.target.value;
            setTyped(val);
            setIsOpen(true);
            
            const matched = activeEmps.find(
              emp => (emp.matricule || '').toUpperCase().trim() === val.toUpperCase().trim() ||
                     `${emp.nom || ''} ${emp.prenom || ''}`.toUpperCase().trim() === val.toUpperCase().trim() ||
                     `${emp.prenom || ''} ${emp.nom || ''}`.toUpperCase().trim() === val.toUpperCase().trim()
            );
            if (matched) {
              onChange(matched.matricule, `${matched.nom} ${matched.prenom}`);
            }
          }}
          onFocus={() => {
            if (!disabled) setIsOpen(true);
          }}
          onBlur={() => {
            setTimeout(() => {
              setIsOpen(false);
              const matched = activeEmps.find(
                emp => (emp.matricule || '').toUpperCase().trim() === typed.toUpperCase().trim() ||
                       `${emp.nom || ''} ${emp.prenom || ''}`.toUpperCase().trim() === typed.toUpperCase().trim() ||
                       `${emp.prenom || ''} ${emp.nom || ''}`.toUpperCase().trim() === typed.toUpperCase().trim()
              );
              if (matched) {
                setTyped(matched.matricule);
                onChange(matched.matricule, `${matched.nom} ${matched.prenom}`);
              } else {
                if (typed.trim() === '') {
                  onChange('', '');
                } else {
                  setTyped(matricule || '');
                }
              }
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
                  handleSelect(emp);
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
  const { user, profile } = useAuth();

  // Helper for Enter/Tab keyboard navigation between inputs/selects on cards
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const cardElement = e.currentTarget.closest('[data-card-container]');
      if (cardElement) {
        const focusables = Array.from(cardElement.querySelectorAll('input, select, button')) as HTMLElement[];
        const currentIndex = focusables.indexOf(e.currentTarget);
        if (currentIndex !== -1 && currentIndex < focusables.length - 1) {
          let nextIndex = currentIndex + 1;
          while (nextIndex < focusables.length) {
            const nextEl = focusables[nextIndex];
            if ((nextEl.tagName === 'INPUT' || nextEl.tagName === 'SELECT') && 
                !(nextEl as any).disabled && !(nextEl as any).readOnly) {
              nextEl.focus();
              if (nextEl.tagName === 'INPUT') {
                (nextEl as HTMLInputElement).select?.();
              }
              break;
            }
            nextIndex++;
          }
        }
      }
    }
  };
  
  // App views: 'sheet' (Excel Mode) or 'history' (Consolidated list)
  const [viewMode, setViewMode] = useState<'sheet' | 'history'>('sheet');
  const [activeSheetTab, setActiveSheetTab] = useState<'minage' | 'deblayage' | 'extraction' | 'maintenance'>('minage');
  
  // Core filters
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedPost, setSelectedPost] = useState<'Poste 1' | 'Poste 2' | 'Poste 3'>('Poste 1');

  // Timezone-robust yesterday object for labels & bridges
  const yesterdayDateLabel = (() => {
    if (!selectedDate) return null;
    const parts = selectedDate.split('-');
    if (parts.length !== 3) return null;
    const yDateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 12, 0, 0);
    const yesterdayObj = new Date(yDateObj);
    yesterdayObj.setDate(yesterdayObj.getDate() - 1);
    return yesterdayObj;
  })();

  // Platform Settings State
  const [platformSettings, setPlatformSettings] = useState<{
    sectors: string[];
    engines: string[];
    oils: string[];
    defaultWagonsTarget?: number;
    advance_18m?: number;
    advance_24m?: number;
  }>({
    sectors: ['Imiter 1', 'Imiter 2', 'Imiter Est'],
    engines: ['ST2D', 'ST2G 1', 'ST2G 3', 'ST2G 4', 'ST2G 5', 'ST2G6'],
    oils: ['Huile Moteur 15W40', 'Huile Hydraulique HV46', 'Huile Hydraulique HV68', 'Huile Transmission SAE30', 'Huile Transmission SAE50', 'Graisse Extrême Pression'],
    defaultWagonsTarget: 48,
    advance_18m: 1.7,
    advance_24m: 2.3
  });

  const [isMonthClosed, setIsMonthClosed] = useState(false);

  // Master lists from Firebase
  const [dataHistory, setDataHistory] = useState<any[]>([]);
  const [chantiers, setChantiers] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [engines, setEngines] = useState<any[]>([]);
  const [plannings, setPlannings] = useState<any[]>([]);
  const [allPlanningSheets, setAllPlanningSheets] = useState<any[]>([]);
  const [allProductionDocs, setAllProductionDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copying' | 'copied' | 'no_data' | 'error'>('idle');
  const [isTemplateLoaded, setIsTemplateLoaded] = useState(false);
  const [templateDateHint, setTemplateDateHint] = useState('');
  const [noPlanFound, setNoPlanFound] = useState(false);
  const [planFoundType, setPlanFoundType] = useState<'same_date' | 'yesterday' | 'none'>('none');
  const [structureEditMode, setStructureEditMode] = useState<boolean>(false);
  
  // Custom non-blocking popups
  const [confirmModal, setConfirmModal] = useState<{ title: string; message: string; onConfirm: () => void; onCancel?: () => void } | null>(null);
  const [infoModal, setInfoModal] = useState<{ title: string; message: string; type: 'error' | 'info' | 'success' } | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successToastMsg, setSuccessToastMsg] = useState('');
  const [unexplainedGaps, setUnexplainedGaps] = useState(0);

  useEffect(() => {
    if (!user || !selectedDate) return;
    
    const q = query(
      collection(db, 'non_realisation_explanations'),
      where('date', '==', selectedDate),
      where('status', '==', 'pending')
    );
    
    const unsub = onSnapshot(q, (snap) => {
      setUnexplainedGaps(snap.size);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'non_realisation_explanations');
    });
    
    return () => unsub();
  }, [user, selectedDate]);

  const safeConfirm = (message: string, onConfirm: () => void, onCancel?: () => void) => {
    setConfirmModal({
      title: "Confirmation SMI",
      message,
      onConfirm,
      onCancel
    });
  };

  const safeAlert = (message: string, title: string = "Signalement de Bureau Technique", type: 'error' | 'info' | 'success' = 'info') => {
    setInfoModal({
      title,
      message,
      type
    });
  };
  
  // Pont d'Exportation de Planification states
  const [syncingBridge, setSyncingBridge] = useState<boolean>(false);
  const [bridgeSuccessDate, setBridgeSuccessDate] = useState<string>('');
  const [bridgeDate, setBridgeDate] = useState<string>('');

  // Excel grids state for Poste 1
  const [p1MinageRows, setP1MinageRows] = useState<ExcelRow<ExcelMinage>[]>([]);
  const [p1DeblayageRows, setP1DeblayageRows] = useState<ExcelRow<ExcelDeblayage>[]>([]);
  const [p1ExtractionRowsRaw, setP1ExtractionRowsRaw] = useState<ExcelRow<ExcelExtraction>[]>([]);
  const [p1MaintenanceRows, setP1MaintenanceRows] = useState<ExcelRow<ExcelMaintenance>[]>([]);
  const [p1ChiefMatricule, setP1ChiefMatricule] = useState<string>('');
  const [p1ChiefName, setP1ChiefName] = useState<string>('');
  const [p1SecondChiefMatricule, setP1SecondChiefMatricule] = useState<string>('');
  const [p1SecondChiefName, setP1SecondChiefName] = useState<string>('');
  const [p1SectorChefs, setP1SectorChefs] = useState<{ [key: string]: { chiefMatricule: string; chiefName: string; secondChiefMatricule: string; secondChiefName: string; } }>({
    'Imiter 2': { chiefMatricule: '', chiefName: '', secondChiefMatricule: '', secondChiefName: '' },
    'Imiter 1': { chiefMatricule: '', chiefName: '', secondChiefMatricule: '', secondChiefName: '' },
    'Imiter Est': { chiefMatricule: '', chiefName: '', secondChiefMatricule: '', secondChiefName: '' },
    'Autres / Non Classés': { chiefMatricule: '', chiefName: '', secondChiefMatricule: '', secondChiefName: '' }
  });

  // Excel grids state for Poste 2
  const [p2MinageRows, setP2MinageRows] = useState<ExcelRow<ExcelMinage>[]>([]);
  const [p2DeblayageRows, setP2DeblayageRows] = useState<ExcelRow<ExcelDeblayage>[]>([]);
  const [p2ExtractionRowsRaw, setP2ExtractionRowsRaw] = useState<ExcelRow<ExcelExtraction>[]>([]);
  const [p2MaintenanceRows, setP2MaintenanceRows] = useState<ExcelRow<ExcelMaintenance>[]>([]);
  const [p2ChiefMatricule, setP2ChiefMatricule] = useState<string>('');
  const [p2ChiefName, setP2ChiefName] = useState<string>('');
  const [p2SecondChiefMatricule, setP2SecondChiefMatricule] = useState<string>('');
  const [p2SecondChiefName, setP2SecondChiefName] = useState<string>('');
  const [p2SectorChefs, setP2SectorChefs] = useState<{ [key: string]: { chiefMatricule: string; chiefName: string; secondChiefMatricule: string; secondChiefName: string; } }>({
    'Imiter 2': { chiefMatricule: '', chiefName: '', secondChiefMatricule: '', secondChiefName: '' },
    'Imiter 1': { chiefMatricule: '', chiefName: '', secondChiefMatricule: '', secondChiefName: '' },
    'Imiter Est': { chiefMatricule: '', chiefName: '', secondChiefMatricule: '', secondChiefName: '' },
    'Autres / Non Classés': { chiefMatricule: '', chiefName: '', secondChiefMatricule: '', secondChiefName: '' }
  });

  // Excel grids state for Poste 3
  const [p3MinageRows, setP3MinageRows] = useState<ExcelRow<ExcelMinage>[]>([]);
  const [p3DeblayageRows, setP3DeblayageRows] = useState<ExcelRow<ExcelDeblayage>[]>([]);
  const [p3ExtractionRowsRaw, setP3ExtractionRowsRaw] = useState<ExcelRow<ExcelExtraction>[]>([]);
  const [p3MaintenanceRows, setP3MaintenanceRows] = useState<ExcelRow<ExcelMaintenance>[]>([]);
  const [p3ChiefMatricule, setP3ChiefMatricule] = useState<string>('');
  const [p3ChiefName, setP3ChiefName] = useState<string>('');
  const [p3SecondChiefMatricule, setP3SecondChiefMatricule] = useState<string>('');
  const [p3SecondChiefName, setP3SecondChiefName] = useState<string>('');
  const [p3SectorChefs, setP3SectorChefs] = useState<{ [key: string]: { chiefMatricule: string; chiefName: string; secondChiefMatricule: string; secondChiefName: string; } }>({
    'Imiter 2': { chiefMatricule: '', chiefName: '', secondChiefMatricule: '', secondChiefName: '' },
    'Imiter 1': { chiefMatricule: '', chiefName: '', secondChiefMatricule: '', secondChiefName: '' },
    'Imiter Est': { chiefMatricule: '', chiefName: '', secondChiefMatricule: '', secondChiefName: '' },
    'Autres / Non Classés': { chiefMatricule: '', chiefName: '', secondChiefMatricule: '', secondChiefName: '' }
  });

  // Helper to build default main sector-level chiefs
  const buildDefaultSectorChefs = (pName: string, yesterdayStr: string) => {
    const activeChefs = (employees.length > 0 ? employees : DEFAULT_EMPLOYEES).filter(e => e.fonction === 'CHEF' && e.status === 'actif');
    const shiftPlans = plannings.filter(p => p.date === yesterdayStr && p.post === pName);

    const getSectorChefDefault = (sec: string) => {
      const planSec = shiftPlans.find(
        p => p.type === 'minage' && 
        (p.sector || '').toLowerCase() === sec.toLowerCase() && 
        p.chiefMatricule
      );
      if (planSec) {
        return {
          matricule: planSec.chiefMatricule,
          name: planSec.chiefName || ''
        };
      }
      const chf = activeChefs.find(e => (e.sector || '').toLowerCase() === sec.toLowerCase());
      return chf ? { matricule: chf.matricule || '', name: `${chf.nom || ''} ${chf.prenom || ''}`.trim() } : { matricule: '', name: '' };
    };

    return {
      'Imiter 2': { chiefMatricule: getSectorChefDefault('Imiter 2').matricule, chiefName: getSectorChefDefault('Imiter 2').name, secondChiefMatricule: '', secondChiefName: '' },
      'Imiter 1': { chiefMatricule: getSectorChefDefault('Imiter 1').matricule, chiefName: getSectorChefDefault('Imiter 1').name, secondChiefMatricule: '', secondChiefName: '' },
      'Imiter Est': { chiefMatricule: getSectorChefDefault('Imiter Est').matricule, chiefName: getSectorChefDefault('Imiter Est').name, secondChiefMatricule: '', secondChiefName: '' },
      'Autres / Non Classés': { chiefMatricule: '', chiefName: '', secondChiefMatricule: '', secondChiefName: '' }
    };
  };

  // Helper to recover sector chiefs from Firestore or fallback
  const getSectorChefsFromDocOrDefaults = (docData: any, pName: string, yesterdayStr: string, rows: ExcelMinage[]) => {
    const defaultChefs = buildDefaultSectorChefs(pName, yesterdayStr);
    const result = { ...defaultChefs };

    if (docData && docData.sectorChefs) {
      return {
        ...result,
        ...docData.sectorChefs
      };
    }

    const sectorsList = ['Imiter 2', 'Imiter 1', 'Imiter Est', 'Autres / Non Classés'];
    for (const sec of sectorsList) {
      const matching = rows.find(r => (r.sector || '').trim().toLowerCase() === sec.toLowerCase() && r.chiefMatricule);
      if (matching) {
        const parts = matching.chiefName.split(' / ');
        result[sec] = {
          chiefMatricule: matching.chiefMatricule,
          chiefName: parts[0] || '',
          secondChiefMatricule: '',
          secondChiefName: parts[1] || ''
        };
      }
    }

    if (docData && docData.chiefMatricule) {
      for (const sec of sectorsList) {
        if (!result[sec].chiefMatricule) {
          result[sec].chiefMatricule = docData.chiefMatricule;
          result[sec].chiefName = docData.chiefName || '';
          result[sec].secondChiefMatricule = docData.secondChiefMatricule || '';
          result[sec].secondChiefName = docData.secondChiefName || '';
        }
      }
    }

    return result;
  };

  const createEmptyMinage = (sector: string = ''): ExcelMinage => ({
    sector,
    chantierId: '',
    chiefMatricule: '',
    chiefName: '',
    minerMatricule: '',
    minerName: '',
    assistantMatricule: '',
    assistantName: '',
    gallerySize: 12,
    plannedHoles: 32,
    realHoles: 0,
    chargedHoles: 0,
    emptyHoles: 0,
    plannedRounds: 1,
    realRounds: 0,
    meterage: 0,
    realMeterage: 0,
    anfo: 0,
    tovex: 0,
    ammorces: 0
  });

  const createEmptyDeblayage = (sector: string = '', start: string = '07:00', end: string = '14:00'): ExcelDeblayage => ({
    sector,
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
  });

  const createEmptyExtraction = (start: string = '08:00', end: string = '13:30'): ExcelExtraction => ({
    treuilliste: '',
    equipier1: '',
    equipier2: '',
    equipier3: '',
    equipier4: '',
    wagonsActual: 0,
    wagonsTarget: platformSettings.defaultWagonsTarget ?? 48,
    sterileBureImiterEst: 0,
    startTime: start,
    endTime: end,
    chantierName: 'Extraction Bure N340 Imiter Est'
  });

  const createEmptyMaintenance = (): ExcelMaintenance => ({
    roleLabel: '',
    agentMatricule: '',
    agentName: '',
    engineId: '',
    engineCode: '',
    hoursSpent: 0,
    workDescription: ''
  });

  const normalizeLoadedExtraction = (rows: ExcelRow<ExcelExtraction>[]): ExcelRow<ExcelExtraction>[] => {
    if (!rows || rows.length === 0) {
      const empty = createEmptyExtraction();
      return [{
        rowId: 'extraction_single_fixed',
        plan: empty,
        reel: empty
      }];
    }
    const first = rows[0];
    const plan = { ...createEmptyExtraction(), ...first.plan };
    const reel = { ...createEmptyExtraction(), ...first.reel };
    
    plan.chantierName = 'Extraction Bure N340 Imiter Est';
    reel.chantierName = 'Extraction Bure N340 Imiter Est';

    const planTreuilliste = plan.treuilliste || (plan as any).treuilliste1 || '';
    const reelTreuilliste = reel.treuilliste || (reel as any).treuilliste1 || '';

    plan.treuilliste = planTreuilliste;
    reel.treuilliste = reelTreuilliste;

    if (plan.wagonsTarget === undefined || plan.wagonsTarget === null) plan.wagonsTarget = platformSettings.defaultWagonsTarget ?? 48;
    if (reel.wagonsTarget === undefined || reel.wagonsTarget === null) reel.wagonsTarget = (plan.wagonsTarget !== undefined && plan.wagonsTarget !== null) ? plan.wagonsTarget : (platformSettings.defaultWagonsTarget ?? 48);

    return [{
      rowId: first.rowId || 'extraction_single_fixed',
      plan,
      reel
    }];
  };

  const p1ExtractionRows = normalizeLoadedExtraction(p1ExtractionRowsRaw);
  const p2ExtractionRows = normalizeLoadedExtraction(p2ExtractionRowsRaw);
  const p3ExtractionRows = normalizeLoadedExtraction(p3ExtractionRowsRaw);

  const setP1ExtractionRows = (val: any) => {
    if (typeof val === 'function') {
      setP1ExtractionRowsRaw(prev => val(normalizeLoadedExtraction(prev)));
    } else {
      setP1ExtractionRowsRaw(normalizeLoadedExtraction(val));
    }
  };
  const setP2ExtractionRows = (val: any) => {
    if (typeof val === 'function') {
      setP2ExtractionRowsRaw(prev => val(normalizeLoadedExtraction(prev)));
    } else {
      setP2ExtractionRowsRaw(normalizeLoadedExtraction(val));
    }
  };
  const setP3ExtractionRows = (val: any) => {
    if (typeof val === 'function') {
      setP3ExtractionRowsRaw(prev => val(normalizeLoadedExtraction(prev)));
    } else {
      setP3ExtractionRowsRaw(normalizeLoadedExtraction(val));
    }
  };

  const mapToExcelRowArray = <T,>(arr: any[], defaultCreatorWithSector: (sec: string) => T): ExcelRow<T>[] => {
    if (!Array.isArray(arr)) return [];
    return arr.map((item, idx) => {
      let planObj = item?.plan || item;
      let reelObj = item?.reel || item;

      // Ensure plan explosives are flattened
      if (planObj && typeof planObj === 'object') {
        const explosives = planObj.explosives || {};
        const anfo = explosives.anfo !== undefined ? explosives.anfo : (planObj.anfo !== undefined ? planObj.anfo : 0);
        const tovex = explosives.tovex !== undefined ? explosives.tovex : (planObj.tovex !== undefined ? planObj.tovex : 0);
        const ammorces = explosives.ammorces !== undefined ? explosives.ammorces : (planObj.ammorces !== undefined ? planObj.ammorces : 0);
        planObj = { ...planObj, anfo, tovex, ammorces };
      }

      if (item && 'rowId' in item && 'plan' in item && 'reel' in item) {
        return {
          ...item,
          plan: planObj,
          reel: reelObj
        } as ExcelRow<T>;
      }
      const sector = item?.sector || item?.reel?.sector || item?.plan?.sector || '';
      return {
        rowId: item?.rowId || `row_${idx}_${Math.random().toString(36).substr(2, 9)}`,
        plan: planObj || defaultCreatorWithSector(sector),
        reel: reelObj || defaultCreatorWithSector(sector),
      };
    });
  };

  const generateFromPlan = <T,>(plannedList: T[], defaultCreatorWithSector: (sec: string) => T, postName: string, typeName: string): ExcelRow<T>[] => {
    if (!plannedList || plannedList.length === 0) {
      return [];
    }
    return plannedList.map((plannedItem: any, idx) => {
      // Decode sector supporting both 'sector' & 'sectorGroup'
      let sector = plannedItem?.sector || plannedItem?.sectorGroup || '';
      if (!sector && plannedItem?.chantierId) {
        const foundChan = chantiers.find((c: any) => c.id === plannedItem.chantierId);
        if (foundChan) {
          sector = foundChan.sector || '';
        }
      }

      const explosives = plannedItem?.explosives || {};
      const planValue = { 
        ...plannedItem, 
        sector,
        ...(typeName === 'minage' ? {
          plannedRounds: 1,
          anfo: explosives.anfo !== undefined ? explosives.anfo : (plannedItem?.anfo || 0),
          tovex: explosives.tovex !== undefined ? explosives.tovex : (plannedItem?.tovex || 0),
          ammorces: explosives.ammorces !== undefined ? explosives.ammorces : (plannedItem?.ammorces || 0),
        } : {})
      };
      
      const reelValue: any = {
        ...defaultCreatorWithSector(sector),
        chantierId: plannedItem?.chantierId || '',
        sector: sector,
      };
      
      if (typeName === 'minage') {
        const gSize = plannedItem?.gallerySize || (plannedItem?.galleryType === '9m2' ? 9 : 12);
        reelValue.gallerySize = gSize;
        reelValue.barType = plannedItem?.barType || '1.8m';
        reelValue.minerMatricule = plannedItem?.minerMatricule || '';
        reelValue.minerName = plannedItem?.minerName || '';
        reelValue.assistantMatricule = plannedItem?.assistantMatricule || '';
        reelValue.assistantName = plannedItem?.assistantName || '';
        
        // Ensure each separated card represents exactly 1 volée
        reelValue.plannedRounds = 1;
        reelValue.realRounds = 1;
        const advanceFactor = reelValue.barType === '2.4m' ? (platformSettings?.advance_24m ?? 2.3) : (platformSettings?.advance_18m ?? 1.7);
        reelValue.meterage = advanceFactor;
        reelValue.realMeterage = advanceFactor;
      } else if (typeName === 'deblayage') {
        reelValue.driverMatricule = plannedItem?.driverMatricule || '';
        reelValue.driverName = plannedItem?.driverName || '';
        reelValue.engineId = plannedItem?.engineId || '';
        reelValue.engineCode = plannedItem?.engineCode || '';
        reelValue.godets = plannedItem?.godets || 0;
        reelValue.volumeEstimated = plannedItem?.volumeEstimated || 0;
      } else if (typeName === 'maintenance') {
        reelValue.agentMatricule = plannedItem?.agentMatricule || '';
        reelValue.agentName = plannedItem?.agentName || '';
        reelValue.roleLabel = plannedItem?.roleLabel || '';
        reelValue.engineId = plannedItem?.engineId || '';
        reelValue.engineCode = plannedItem?.engineCode || '';
      } else if (typeName === 'extraction') {
        reelValue.treuilliste = plannedItem?.treuilliste || '';
        reelValue.equipier1 = plannedItem?.equipier1 || '';
        reelValue.equipier2 = plannedItem?.equipier2 || '';
        reelValue.equipier3 = plannedItem?.equipier3 || '';
        reelValue.equipier4 = plannedItem?.equipier4 || '';
        reelValue.wagonsTarget = plannedItem?.wagonsTarget !== undefined && plannedItem?.wagonsTarget !== null ? Number(plannedItem.wagonsTarget) : (platformSettings.defaultWagonsTarget ?? 48);
        reelValue.wagonsActual = plannedItem?.wagonsActual !== undefined && plannedItem?.wagonsActual !== null ? Number(plannedItem.wagonsActual) : 0;
        reelValue.sterileBureImiterEst = plannedItem?.sterileBureImiterEst !== undefined && plannedItem?.sterileBureImiterEst !== null ? Number(plannedItem.sterileBureImiterEst) : 0;
        reelValue.installationName = plannedItem?.installationName || plannedItem?.chantierName || 'Bure';
      }
      
      return {
        rowId: `${typeName}_${idx}_${Math.random().toString(36).substr(2, 9)}`,
        plan: planValue,
        reel: reelValue as unknown as T
      };
    });
  };

  const filterRealPlannedRows = <T,>(arr: T[], type: string): T[] => {
    if (!Array.isArray(arr)) return [];
    return arr.filter((item: any) => {
      if (!item) return false;
      if (type === 'minage') {
        const isChildVolee = !!(item.remarks && typeof item.remarks === 'string' && item.remarks.includes('(Volée'));
        const hasChantier = !!(item.chantierId || item.chantierName || isChildVolee);
        return hasChantier;
      }
      if (type === 'deblayage') {
        const hasChantier = !!(item.chantierId || item.chantierName);
        return hasChantier;
      }
      if (type === 'extraction') {
        // Safe check for planning fields
        return !!(item.treuilliste1 || item.treuilliste || item.equipier1 || item.equipier2 || item.chantierName || (item.wagonsTarget && item.wagonsTarget > 0));
      }
      if (type === 'maintenance') {
        return !!(item.agentMatricule || item.roleLabel);
      }
      return true;
    });
  };

  const generateSaisieLibreDefaults = (postName: string) => {
    let start = '07:00';
    let end = '14:00';
    if (postName === 'Poste 1') { start = '07:00'; end = '14:00'; }
    else if (postName === 'Poste 2') { start = '15:00'; end = '22:00'; }
    else if (postName === 'Poste 3') { start = '23:00'; end = '06:00'; }

    const minageSectors = ['Imiter 2', 'Imiter 1', 'Imiter Est'];
    const minage: ExcelRow<ExcelMinage>[] = [];
    minageSectors.forEach(sec => {
      const count = (postName === 'Poste 1' && sec !== 'Imiter Est') ? 1 : 2;
      for (let i = 0; i < count; i++) {
        minage.push({
          rowId: `minage_saisie_${sec}_${i}_${Math.random().toString(36).substr(2, 9)}`,
          plan: createEmptyMinage(sec),
          reel: createEmptyMinage(sec)
        });
      }
    });

    const deblayageSectors = ['Imiter 2', 'Imiter 1', 'Imiter Est'];
    const deblayage: ExcelRow<ExcelDeblayage>[] = [];
    deblayageSectors.forEach(sec => {
      const count = sec === 'Imiter Est' ? 3 : sec === 'Imiter 2' ? 2 : 1;
      for (let i = 0; i < count; i++) {
        deblayage.push({
          rowId: `deblayage_saisie_${sec}_${i}_${Math.random().toString(36).substr(2, 9)}`,
          plan: createEmptyDeblayage(sec, start, end),
          reel: createEmptyDeblayage(sec, start, end)
        });
      }
    });

    const extraction: ExcelRow<ExcelExtraction>[] = Array.from({ length: 1 }, (_, i) => ({
      rowId: `extraction_saisie_${i}_${Math.random().toString(36).substr(2, 9)}`,
      plan: createEmptyExtraction(start, end),
      reel: createEmptyExtraction(start, end)
    }));

    const maintenance: ExcelRow<ExcelMaintenance>[] = Array.from({ length: 4 }, (_, i) => ({
      rowId: `maintenance_saisie_${i}_${Math.random().toString(36).substr(2, 9)}`,
      plan: createEmptyMaintenance(),
      reel: createEmptyMaintenance()
    }));

    return { minage, deblayage, extraction, maintenance };
  };

  // Local draft state to prevent losing inputted data
  const [draftAvailable, setDraftAvailable] = useState<boolean>(false);
  const [exactPlanMissing, setExactPlanMissing] = useState<boolean>(false);
  const [forceFreeEntryApproved, setForceFreeEntryApproved] = useState<boolean>(false);

  // Dynamically merged vectors with fallbacks for high uptime
  const activeSectors = chantiers.length > 0 ? chantiers : DEFAULT_SECTORS;
  const activeEmployees = employees.length > 0 ? employees : DEFAULT_EMPLOYEES;
  const activeEngines = engines.length > 0 ? engines : DEFAULT_ENGINES;

  // Success Toast Auto-close timer
  useEffect(() => {
    if (showSuccessToast) {
      const timer = setTimeout(() => {
        setShowSuccessToast(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [showSuccessToast]);

  // Real-time listeners
  useEffect(() => {
    // 1. History
    const qHistory = query(collection(db, 'production_history'), orderBy('lastUpdated', 'desc'));
    const unsubHist = onSnapshot(qHistory, (snapshot) => {
      const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setDataHistory(records);
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
        setPlatformSettings(prev => ({
          ...prev,
          sectors: data.sectors || ['Imiter 1', 'Imiter 2', 'Imiter Est'],
          engines: data.engines || ['ST2D', 'ST2G 1', 'ST2G 3', 'ST2G 4', 'ST2G 5', 'ST2G6'],
          oils: data.oils || ['Huile Moteur 15W40', 'Huile Hydraulique HV46', 'Huile Hydraulique HV68', 'Huile Transmission SAE30', 'Huile Transmission SAE50', 'Graisse Extrême Pression'],
          defaultWagonsTarget: data.defaultWagonsTarget !== undefined ? data.defaultWagonsTarget : 48
        }));
      }
    }, (err) => {
      console.warn("Permission logs on Snapshot setting platform:", err.message);
    });

    // 6b. Operational Settings Configuration
    const unsubOpSettings = onSnapshot(doc(db, 'platform_settings', 'config'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setPlatformSettings(prev => ({
          ...prev,
          advance_18m: data.advance_18m ?? 1.7,
          advance_24m: data.advance_24m ?? 2.3
        }));
      }
    }, (err) => {
      console.warn("Permission logs on Snapshot setting platform config:", err.message);
    });

    // 7. Daily Planning Sheets (for notifications of unfilled plannings)
    const qDailyPlannings = query(collection(db, 'daily_planning_sheets'));
    const unsubDailyPlannings = onSnapshot(qDailyPlannings, (snapshot) => {
      const sheets = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAllPlanningSheets(sheets);
    }, (err) => {
      console.warn("Permission logs on Snapshot daily_planning_sheets:", err.message);
    });

    // 8. Production (for checking unfilled plannings)
    const qProduction = query(collection(db, 'production'));
    const unsubProduction = onSnapshot(qProduction, (snapshot) => {
      setAllProductionDocs(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => {
      console.warn("Permission logs on Snapshot production:", err.message);
    });

    return () => { 
      unsubHist(); 
      unsubChan(); 
      unsubRH(); 
      unsubEngs(); 
      unsubPlan(); 
      unsubSettings(); 
      unsubOpSettings();
      unsubDailyPlannings();
      unsubProduction();
    };
  }, []);

  // Realtime mouth closure detector
  useEffect(() => {
    if (!selectedDate) return;
    const monthStr = selectedDate.substring(0, 7); // 'YYYY-MM'
    const unsubClosure = onSnapshot(doc(db, 'settings', 'closures'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setIsMonthClosed(!!data[monthStr]);
      } else {
        setIsMonthClosed(false);
      }
    }, (err) => {
      console.warn("Error reading closures settings:", err);
    });
    return () => unsubClosure();
  }, [selectedDate]);

  // Check if draft exists when date changes & initialize bridge date
  useEffect(() => {
    if (!selectedDate) return;
    const draft = localStorage.getItem(`draft_production_${selectedDate}`);
    setDraftAvailable(!!draft);

    const parts = selectedDate.split('-');
    if (parts.length === 3) {
      const yDateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 12, 0, 0);
      const yesterdayDateObj = new Date(yDateObj);
      yesterdayDateObj.setDate(yDateObj.getDate() - 1);
      setBridgeDate(format(yesterdayDateObj, 'yyyy-MM-dd'));
    }
  }, [selectedDate]);

  // Save drafts to localStorage to prevent data loss on accidental reload (debounced to avoid UI lag on fast typing)
  useEffect(() => {
    if (!selectedDate || loading) return;
    
    const handler = setTimeout(() => {
      const draftPayload = {
        p1MinageRows, p1DeblayageRows, p1ExtractionRows, p1MaintenanceRows,
        p1ChiefMatricule, p1ChiefName, p1SecondChiefMatricule, p1SecondChiefName,
        p1SectorChefs,
        p2MinageRows, p2DeblayageRows, p2ExtractionRows, p2MaintenanceRows,
        p2ChiefMatricule, p2ChiefName, p2SecondChiefMatricule, p2SecondChiefName,
        p2SectorChefs,
        p3MinageRows, p3DeblayageRows, p3ExtractionRows, p3MaintenanceRows,
        p3ChiefMatricule, p3ChiefName, p3SecondChiefMatricule, p3SecondChiefName,
        p3SectorChefs,
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
    }, 1000); // 1-second debounce
    
    return () => clearTimeout(handler);
  }, [
    selectedDate, loading,
    p1MinageRows, p1DeblayageRows, p1ExtractionRows, p1MaintenanceRows,
    p1ChiefMatricule, p1ChiefName, p1SecondChiefMatricule, p1SecondChiefName,
    p1SectorChefs,
    p2MinageRows, p2DeblayageRows, p2ExtractionRows, p2MaintenanceRows,
    p2ChiefMatricule, p2ChiefName, p2SecondChiefMatricule, p2SecondChiefName,
    p2SectorChefs,
    p3MinageRows, p3DeblayageRows, p3ExtractionRows, p3MaintenanceRows,
    p3ChiefMatricule, p3ChiefName, p3SecondChiefMatricule, p3SecondChiefName,
    p3SectorChefs,
  ]);

  // Prevent closing the tab with unsaved modifications
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      const draft = localStorage.getItem(`draft_production_${selectedDate}`);
      if (draft) {
        e.preventDefault();
        e.returnValue = "Vous avez des modifications non enregistrées sur ce Registre Journalier. Souhaitez-vous vraiment quitter ?";
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
        if (d.p1SectorChefs) setP1SectorChefs(d.p1SectorChefs);

        if (d.p2MinageRows) setP2MinageRows(d.p2MinageRows);
        if (d.p2DeblayageRows) setP2DeblayageRows(d.p2DeblayageRows);
        if (d.p2ExtractionRows) setP2ExtractionRows(d.p2ExtractionRows);
        if (d.p2MaintenanceRows) setP2MaintenanceRows(d.p2MaintenanceRows);
        if (d.p2ChiefMatricule !== undefined) setP2ChiefMatricule(d.p2ChiefMatricule);
        if (d.p2ChiefName !== undefined) setP2ChiefName(d.p2ChiefName);
        if (d.p2SecondChiefMatricule !== undefined) setP2SecondChiefMatricule(d.p2SecondChiefMatricule);
        if (d.p2SecondChiefName !== undefined) setP2SecondChiefName(d.p2SecondChiefName);
        if (d.p2SectorChefs) setP2SectorChefs(d.p2SectorChefs);

        if (d.p3MinageRows) setP3MinageRows(d.p3MinageRows);
        if (d.p3DeblayageRows) setP3DeblayageRows(d.p3DeblayageRows);
        if (d.p3ExtractionRows) setP3ExtractionRows(d.p3ExtractionRows);
        if (d.p3MaintenanceRows) setP3MaintenanceRows(d.p3MaintenanceRows);
        if (d.p3ChiefMatricule !== undefined) setP3ChiefMatricule(d.p3ChiefMatricule);
        if (d.p3ChiefName !== undefined) setP3ChiefName(d.p3ChiefName);
        if (d.p3SecondChiefMatricule !== undefined) setP3SecondChiefMatricule(d.p3SecondChiefMatricule);
        if (d.p3SecondChiefName !== undefined) setP3SecondChiefName(d.p3SecondChiefName);
        if (d.p3SectorChefs) setP3SectorChefs(d.p3SectorChefs);

        setDraftAvailable(false);
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (e) {
        console.error("Error parsing draft", e);
      }
    }
  };

  const discardDraft = () => {
    safeConfirm("⚠️ Voulez-vous vraiment écraser votre travail en cours et supprimer définitivement ce brouillon local ?", () => {
      localStorage.removeItem(`draft_production_${selectedDate}`);
      setDraftAvailable(false);
    });
  };

  // Initialize/Load workbook from firestore whenever Date changes
  useEffect(() => {
    const handleDateChange = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail?.date) {
        setSelectedDate(customEvent.detail.date);
      }
    };
    window.addEventListener('production-date-changed', handleDateChange);

    const pendingDate = window.sessionStorage.getItem('goto-production-date');
    if (pendingDate) {
      setSelectedDate(pendingDate);
      window.sessionStorage.removeItem('goto-production-date');
    }

    return () => window.removeEventListener('production-date-changed', handleDateChange);
  }, []);

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
    const minageImiter2: ExcelMinage[] = Array.from({ length: Math.max(lengthImiter2, plansImiter2.length) }, (_, i) => {
      const matchingPlan = plansImiter2[i];
      if (matchingPlan) {
        const m = 1 * (matchingPlan.barType === '2.4m' ? (platformSettings?.advance_24m ?? 2.3) : (platformSettings?.advance_18m ?? 1.7));
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
          plannedRounds: 1,
          realRounds: 1,
          barType: matchingPlan.barType || '1.8m',
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
        plannedRounds: 1, realRounds: 1, barType: '1.8m', meterage: platformSettings?.advance_18m ?? 1.7, realMeterage: platformSettings?.advance_18m ?? 1.7, anfo: 0, tovex: 0, ammorces: 0
      };
    });

    const plansImiter1 = shiftPlans.filter(p => p.type === 'minage' && (p.sector || '').toLowerCase() === 'imiter 1');
    const minageImiter1: ExcelMinage[] = Array.from({ length: Math.max(lengthImiter1, plansImiter1.length) }, (_, i) => {
      const matchingPlan = plansImiter1[i];
      if (matchingPlan) {
        const m = 1 * (matchingPlan.barType === '2.4m' ? (platformSettings?.advance_24m ?? 2.3) : (platformSettings?.advance_18m ?? 1.7));
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
          plannedRounds: 1,
          realRounds: 1,
          barType: matchingPlan.barType || '1.8m',
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
        plannedRounds: 1, realRounds: 1, barType: '1.8m', meterage: platformSettings?.advance_18m ?? 1.7, realMeterage: platformSettings?.advance_18m ?? 1.7, anfo: 0, tovex: 0, ammorces: 0
      };
    });

    const plansImiterEst = shiftPlans.filter(p => p.type === 'minage' && (p.sector || '').toLowerCase() === 'imiter est');
    const minageImiterEst: ExcelMinage[] = Array.from({ length: Math.max(lengthImiterEst, plansImiterEst.length) }, (_, i) => {
      const matchingPlan = plansImiterEst[i];
      if (matchingPlan) {
        const m = 1 * (matchingPlan.barType === '2.4m' ? (platformSettings?.advance_24m ?? 2.3) : (platformSettings?.advance_18m ?? 1.7));
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
          plannedRounds: 1,
          realRounds: 1,
          barType: matchingPlan.barType || '1.8m',
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
        plannedRounds: 1, realRounds: 1, barType: '1.8m', meterage: platformSettings?.advance_18m ?? 1.7, realMeterage: platformSettings?.advance_18m ?? 1.7, anfo: 0, tovex: 0, ammorces: 0
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

  const loadGlobalWorkbook = async (force: boolean = false, isManualClick: boolean = false) => {
    // 1. Check if an exploitable exact plan exists for YESTERDAY (D-1) as today's (selectedDate) production is based on yesterday's plan
    try {
      const parts = selectedDate.split('-');
      const yDateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 12, 0, 0);
      const yesterdayDateObj = new Date(yDateObj);
      yesterdayDateObj.setDate(yDateObj.getDate() - 1);
      const yesterdayDateStr = format(yesterdayDateObj, 'yyyy-MM-dd');

      const planRefForD = doc(db, 'daily_planning_sheets', yesterdayDateStr);
      const planSnapForD = await getDoc(planRefForD);
      let exactPlanExistsAndExploitable = false;
      if (planSnapForD.exists()) {
        const pd = planSnapForD.data();
        const hasMinage = !!(pd?.postes?.poste1?.minage?.length || pd?.postes?.poste2?.minage?.length || pd?.postes?.poste3?.minage?.length);
        const hasDeblayage = !!(pd?.postes?.poste1?.deblayage?.length || pd?.postes?.poste2?.deblayage?.length || pd?.postes?.poste3?.deblayage?.length);
        const hasExtraction = !!(pd?.postes?.poste1?.extraction?.length || pd?.postes?.poste2?.extraction?.length || pd?.postes?.poste3?.extraction?.length);
        const hasMaintenance = !!(pd?.postes?.poste1?.maintenance?.length || pd?.postes?.poste2?.maintenance?.length || pd?.postes?.poste3?.maintenance?.length);
        
        if (hasMinage || hasDeblayage || hasExtraction || hasMaintenance) {
          exactPlanExistsAndExploitable = true;
        }
      }
      setExactPlanMissing(!exactPlanExistsAndExploitable);
      setForceFreeEntryApproved(false);
    } catch (e) {
      console.warn("Error checking exact plan existence: ", e);
    }

    const savedDraft = localStorage.getItem(`draft_production_${selectedDate}`);
    if (isManualClick && !force && savedDraft) {
      safeConfirm("⚠️ Attention : Vous avez des saisies de brouillon locales non enregistrées. Recharger les données depuis le serveur principal écrasera vos modifications actuelles si vous ne les restaurez pas via la barre d'alerte. Voulez-vous vraiment continuer ?", async () => {
        await loadGlobalWorkbook(true, isManualClick);
      });
      return;
    }
    setLoading(true);
    setNoPlanFound(false);
    try {
      const parts = selectedDate.split('-');
      const yDateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 12, 0, 0);
      const yesterdayDateObj = new Date(yDateObj);
      yesterdayDateObj.setDate(yDateObj.getDate() - 1);
      const yesterdayDateStr = format(yesterdayDateObj, 'yyyy-MM-dd');

      // Fetch consolidated production document for the selected date
      const docRef = doc(db, 'production', selectedDate);
      const snap = await getDoc(docRef);

      if (snap.exists()) {
        const docData = snap.data();
        setIsTemplateLoaded(false);

        // Post 1
        const p1Data = docData?.postes?.poste1;
        if (p1Data) {
          setP1MinageRows(mapToExcelRowArray(p1Data.minage || [], createEmptyMinage));
          setP1DeblayageRows(mapToExcelRowArray(p1Data.deblayage || [], createEmptyDeblayage));
          setP1ExtractionRows(mapToExcelRowArray(p1Data.extraction || [], createEmptyExtraction));
          setP1MaintenanceRows(mapToExcelRowArray(p1Data.maintenance || [], createEmptyMaintenance));
          setP1ChiefMatricule(p1Data.chiefMatricule || '');
          setP1ChiefName(p1Data.chiefName || '');
          setP1SecondChiefMatricule(p1Data.secondChiefMatricule || '');
          setP1SecondChiefName(p1Data.secondChiefName || '');
          setP1SectorChefs(p1Data.sectorChefs || buildDefaultSectorChefs('Poste 1', yesterdayDateStr));
        } else {
          const defaults = generateSaisieLibreDefaults('Poste 1');
          setP1MinageRows(defaults.minage);
          setP1DeblayageRows(defaults.deblayage);
          setP1ExtractionRows(defaults.extraction);
          setP1MaintenanceRows(defaults.maintenance);
          setP1ChiefMatricule(''); setP1ChiefName('');
          setP1SecondChiefMatricule(''); setP1SecondChiefName('');
          setP1SectorChefs(buildDefaultSectorChefs('Poste 1', yesterdayDateStr));
        }

        // Post 2
        const p2Data = docData?.postes?.poste2;
        if (p2Data) {
          setP2MinageRows(mapToExcelRowArray(p2Data.minage || [], createEmptyMinage));
          setP2DeblayageRows(mapToExcelRowArray(p2Data.deblayage || [], createEmptyDeblayage));
          setP2ExtractionRows(mapToExcelRowArray(p2Data.extraction || [], createEmptyExtraction));
          setP2MaintenanceRows(mapToExcelRowArray(p2Data.maintenance || [], createEmptyMaintenance));
          setP2ChiefMatricule(p2Data.chiefMatricule || '');
          setP2ChiefName(p2Data.chiefName || '');
          setP2SecondChiefMatricule(p2Data.secondChiefMatricule || '');
          setP2SecondChiefName(p2Data.secondChiefName || '');
          setP2SectorChefs(p2Data.sectorChefs || buildDefaultSectorChefs('Poste 2', yesterdayDateStr));
        } else {
          const defaults = generateSaisieLibreDefaults('Poste 2');
          setP2MinageRows(defaults.minage);
          setP2DeblayageRows(defaults.deblayage);
          setP2ExtractionRows(defaults.extraction);
          setP2MaintenanceRows(defaults.maintenance);
          setP2ChiefMatricule(''); setP2ChiefName('');
          setP2SecondChiefMatricule(''); setP2SecondChiefName('');
          setP2SectorChefs(buildDefaultSectorChefs('Poste 2', yesterdayDateStr));
        }

        // Post 3
        const p3Data = docData?.postes?.poste3;
        if (p3Data) {
          setP3MinageRows(mapToExcelRowArray(p3Data.minage || [], createEmptyMinage));
          setP3DeblayageRows(mapToExcelRowArray(p3Data.deblayage || [], createEmptyDeblayage));
          setP3ExtractionRows(mapToExcelRowArray(p3Data.extraction || [], createEmptyExtraction));
          setP3MaintenanceRows(mapToExcelRowArray(p3Data.maintenance || [], createEmptyMaintenance));
          setP3ChiefMatricule(p3Data.chiefMatricule || '');
          setP3ChiefName(p3Data.chiefName || '');
          setP3SecondChiefMatricule(p3Data.secondChiefMatricule || '');
          setP3SecondChiefName(p3Data.secondChiefName || '');
          setP3SectorChefs(p3Data.sectorChefs || buildDefaultSectorChefs('Poste 3', yesterdayDateStr));
        } else {
          const defaults = generateSaisieLibreDefaults('Poste 3');
          setP3MinageRows(defaults.minage);
          setP3DeblayageRows(defaults.deblayage);
          setP3ExtractionRows(defaults.extraction);
          setP3MaintenanceRows(defaults.maintenance);
          setP3ChiefMatricule(''); setP3ChiefName('');
          setP3SecondChiefMatricule(''); setP3SecondChiefName('');
          setP3SectorChefs(buildDefaultSectorChefs('Poste 3', yesterdayDateStr));
        }

      } else {
        // No production, try loaded daily_planning_sheets
        // Force loading only from yesterday's planning (D-1) as today's production is linked to yesterday's plan
        const planSnap = await getDoc(doc(db, 'daily_planning_sheets', yesterdayDateStr));
        const activePlanDateStr = yesterdayDateStr;

        if (planSnap.exists()) {
          const planData = planSnap.data();
          setIsTemplateLoaded(true);
          setPlanFoundType('yesterday');
          setTemplateDateHint(format(new Date(activePlanDateStr + "T12:00:00"), 'dd/MM/yyyy'));

          // Post 1
          const p1Plan = planData?.postes?.poste1;
          if (p1Plan) {
            const p1Min = generateFromPlan(filterRealPlannedRows(p1Plan.minage || [], 'minage'), createEmptyMinage, 'Poste 1', 'minage');
            setP1MinageRows(p1Min);
            const p1Deb = generateFromPlan(filterRealPlannedRows(p1Plan.deblayage || [], 'deblayage'), createEmptyDeblayage, 'Poste 1', 'deblayage');
            setP1DeblayageRows(p1Deb);
            const p1Ext = generateFromPlan(filterRealPlannedRows(p1Plan.extraction || [], 'extraction'), createEmptyExtraction, 'Poste 1', 'extraction');
            setP1ExtractionRows(p1Ext);
            const p1Maint = generateFromPlan(filterRealPlannedRows(p1Plan.maintenance || [], 'maintenance'), createEmptyMaintenance, 'Poste 1', 'maintenance');
            setP1MaintenanceRows(p1Maint);
            setP1ChiefMatricule(p1Plan.chiefMatricule || '');
            setP1ChiefName(p1Plan.chiefName || '');
            setP1SecondChiefMatricule(p1Plan.secondChiefMatricule || '');
            setP1SecondChiefName(p1Plan.secondChiefName || '');
            setP1SectorChefs(buildDefaultSectorChefs('Poste 1', activePlanDateStr));
          } else {
            setP1MinageRows([]);
            setP1DeblayageRows([]);
            setP1ExtractionRows([]);
            setP1MaintenanceRows([]);
            setP1ChiefMatricule(''); setP1ChiefName('');
            setP1SecondChiefMatricule(''); setP1SecondChiefName('');
            setP1SectorChefs(buildDefaultSectorChefs('Poste 1', activePlanDateStr));
          }

          // Post 2
          const p2Plan = planData?.postes?.poste2;
          if (p2Plan) {
            const p2Min = generateFromPlan(filterRealPlannedRows(p2Plan.minage || [], 'minage'), createEmptyMinage, 'Poste 2', 'minage');
            setP2MinageRows(p2Min);
            const p2Deb = generateFromPlan(filterRealPlannedRows(p2Plan.deblayage || [], 'deblayage'), createEmptyDeblayage, 'Poste 2', 'deblayage');
            setP2DeblayageRows(p2Deb);
            const p2Ext = generateFromPlan(filterRealPlannedRows(p2Plan.extraction || [], 'extraction'), createEmptyExtraction, 'Poste 2', 'extraction');
            setP2ExtractionRows(p2Ext);
            const p2Maint = generateFromPlan(filterRealPlannedRows(p2Plan.maintenance || [], 'maintenance'), createEmptyMaintenance, 'Poste 2', 'maintenance');
            setP2MaintenanceRows(p2Maint);
            setP2ChiefMatricule(p2Plan.chiefMatricule || '');
            setP2ChiefName(p2Plan.chiefName || '');
            setP2SecondChiefMatricule(p2Plan.secondChiefMatricule || '');
            setP2SecondChiefName(p2Plan.secondChiefName || '');
            setP2SectorChefs(buildDefaultSectorChefs('Poste 2', activePlanDateStr));
          } else {
            setP2MinageRows([]);
            setP2DeblayageRows([]);
            setP2ExtractionRows([]);
            setP2MaintenanceRows([]);
            setP2ChiefMatricule(''); setP2ChiefName('');
            setP2SecondChiefMatricule(''); setP2SecondChiefName('');
            setP2SectorChefs(buildDefaultSectorChefs('Poste 2', activePlanDateStr));
          }

          // Post 3
          const p3Plan = planData?.postes?.poste3;
          if (p3Plan) {
            const p3Min = generateFromPlan(filterRealPlannedRows(p3Plan.minage || [], 'minage'), createEmptyMinage, 'Poste 3', 'minage');
            setP3MinageRows(p3Min);
            const p3Deb = generateFromPlan(filterRealPlannedRows(p3Plan.deblayage || [], 'deblayage'), createEmptyDeblayage, 'Poste 3', 'deblayage');
            setP3DeblayageRows(p3Deb);
            const p3Ext = generateFromPlan(filterRealPlannedRows(p3Plan.extraction || [], 'extraction'), createEmptyExtraction, 'Poste 3', 'extraction');
            setP3ExtractionRows(p3Ext);
            const p3Maint = generateFromPlan(filterRealPlannedRows(p3Plan.maintenance || [], 'maintenance'), createEmptyMaintenance, 'Poste 3', 'maintenance');
            setP3MaintenanceRows(p3Maint);
            setP3ChiefMatricule(p3Plan.chiefMatricule || '');
            setP3ChiefName(p3Plan.chiefName || '');
            setP3SecondChiefMatricule(p3Plan.secondChiefMatricule || '');
            setP3SecondChiefName(p3Plan.secondChiefName || '');
            setP3SectorChefs(buildDefaultSectorChefs('Poste 3', activePlanDateStr));
          } else {
            setP3MinageRows([]);
            setP3DeblayageRows([]);
            setP3ExtractionRows([]);
            setP3MaintenanceRows([]);
            setP3ChiefMatricule(''); setP3ChiefName('');
            setP3SecondChiefMatricule(''); setP3SecondChiefName('');
            setP3SectorChefs(buildDefaultSectorChefs('Poste 3', activePlanDateStr));
          }

        } else {
          // Both do not exist -> Free Entry
          setNoPlanFound(true);
          setIsTemplateLoaded(false);
          setPlanFoundType('none');

          const default1 = generateSaisieLibreDefaults('Poste 1');
          setP1MinageRows(default1.minage);
          setP1DeblayageRows(default1.deblayage);
          setP1ExtractionRows(default1.extraction);
          setP1MaintenanceRows(default1.maintenance);
          setP1ChiefMatricule(''); setP1ChiefName('');
          setP1SecondChiefMatricule(''); setP1SecondChiefName('');
          setP1SectorChefs(buildDefaultSectorChefs('Poste 1', selectedDate));

          const default2 = generateSaisieLibreDefaults('Poste 2');
          setP2MinageRows(default2.minage);
          setP2DeblayageRows(default2.deblayage);
          setP2ExtractionRows(default2.extraction);
          setP2MaintenanceRows(default2.maintenance);
          setP2ChiefMatricule(''); setP2ChiefName('');
          setP2SecondChiefMatricule(''); setP2SecondChiefName('');
          setP2SectorChefs(buildDefaultSectorChefs('Poste 2', selectedDate));

          const default3 = generateSaisieLibreDefaults('Poste 3');
          setP3MinageRows(default3.minage);
          setP3DeblayageRows(default3.deblayage);
          setP3ExtractionRows(default3.extraction);
          setP3MaintenanceRows(default3.maintenance);
          setP3ChiefMatricule(''); setP3ChiefName('');
          setP3SecondChiefMatricule(''); setP3SecondChiefName('');
          setP3SectorChefs(buildDefaultSectorChefs('Poste 3', selectedDate));
        }
      }
      // Keep old setTemplateDateHint for backward compatibility state trackers if any
      if (!isTemplateLoaded && planFoundType === 'none') {
        setTemplateDateHint(format(yesterdayDateObj, 'dd/MM/yyyy'));
      }
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
        secondChiefName: p1SecondChiefName, setSecondChiefName: setP1SecondChiefName,
        sectorChefs: p1SectorChefs, setSectorChefs: setP1SectorChefs
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
        secondChiefName: p2SecondChiefName, setSecondChiefName: setP2SecondChiefName,
        sectorChefs: p2SectorChefs, setSectorChefs: setP2SectorChefs
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
        secondChiefName: p3SecondChiefName, setSecondChiefName: setP3SecondChiefName,
        sectorChefs: p3SectorChefs, setSectorChefs: setP3SectorChefs
      };
    }
  };

  // State-wide Plan to Reel Copying Helpers
  const isMinageReelFilled = (reel: any) => {
    return !!(
      reel.chantierId ||
      reel.minerMatricule ||
      reel.assistantMatricule ||
      reel.realHoles > 0 ||
      reel.realRounds > 0 ||
      reel.realMeterage > 0 ||
      reel.anfo > 0 ||
      reel.tovex > 0 ||
      reel.ammorces > 0
    );
  };

  const copyMinagePlanToReel = (postName: string, originalIndex: number) => {
    const { setMinageRows, minageRows } = getPostState(postName);
    const clone = [...minageRows];
    const row = clone[originalIndex];
    if (!row) return;

    const performCopy = () => {
      const realH = row.plan.plannedHoles || row.reel.realHoles || 0;
      const chargedH = row.plan.plannedHoles || row.reel.chargedHoles || 0;
      const emptyH = Math.max(0, realH - chargedH);

      const updatedReel = {
        ...row.reel,
        chantierId: row.plan.chantierId || row.reel.chantierId || '',
        minerMatricule: row.plan.minerMatricule || row.reel.minerMatricule || '',
        minerName: row.plan.minerName || row.reel.minerName || '',
        assistantMatricule: row.plan.assistantMatricule || row.reel.assistantMatricule || '',
        assistantName: row.plan.assistantName || row.reel.assistantName || '',
        gallerySize: row.plan.gallerySize || row.reel.gallerySize || 12,
        realHoles: realH,
        chargedHoles: chargedH,
        emptyHoles: emptyH,
        realRounds: row.plan.plannedRounds || row.reel.realRounds || 0,
        realMeterage: row.plan.plannedRounds ? (row.plan.meterage || row.plan.plannedRounds * (row.plan.barType === '2.4m' ? (platformSettings?.advance_24m ?? 2.3) : (platformSettings?.advance_18m ?? 1.7))) : row.reel.realMeterage || 0,
        meterage: row.plan.plannedRounds ? (row.plan.meterage || row.plan.plannedRounds * (row.plan.barType === '2.4m' ? (platformSettings?.advance_24m ?? 2.3) : (platformSettings?.advance_18m ?? 1.7))) : row.reel.meterage || 0,
      };
      clone[originalIndex] = { ...row, reel: updatedReel };
      setMinageRows(clone);
    };

    if (isMinageReelFilled(row.reel)) {
      safeConfirm("La ligne de minage réelle possède déjà des données. Voulez-vous écraser avec le plan ?", () => {
        performCopy();
      });
    } else {
      performCopy();
    }
  };

  const copyAllMinagePlanToReel = (postName: string) => {
    const { setMinageRows, minageRows } = getPostState(postName);
    const hasFilled = minageRows.some(row => isMinageReelFilled(row.reel));
    const performCopy = () => {
      const updated = minageRows.map(row => {
        const realH = row.plan.plannedHoles || row.reel.realHoles || 0;
        const chargedH = row.plan.plannedHoles || row.reel.chargedHoles || 0;
        const emptyH = Math.max(0, realH - chargedH);

        const updatedReel = {
          ...row.reel,
          chantierId: row.plan.chantierId || row.reel.chantierId || '',
          minerMatricule: row.plan.minerMatricule || row.reel.minerMatricule || '',
          minerName: row.plan.minerName || row.reel.minerName || '',
          assistantMatricule: row.plan.assistantMatricule || row.reel.assistantMatricule || '',
          assistantName: row.plan.assistantName || row.reel.assistantName || '',
          gallerySize: row.plan.gallerySize || row.reel.gallerySize || 12,
          realHoles: realH,
          chargedHoles: chargedH,
          emptyHoles: emptyH,
          realRounds: row.plan.plannedRounds || row.reel.realRounds || 0,
          realMeterage: row.plan.plannedRounds ? (row.plan.meterage || row.plan.plannedRounds * (row.plan.barType === '2.4m' ? (platformSettings?.advance_24m ?? 2.3) : (platformSettings?.advance_18m ?? 1.7))) : row.reel.realMeterage || 0,
          meterage: row.plan.plannedRounds ? (row.plan.meterage || row.plan.plannedRounds * (row.plan.barType === '2.4m' ? (platformSettings?.advance_24m ?? 2.3) : (platformSettings?.advance_18m ?? 1.7))) : row.reel.meterage || 0,
        };
        return { ...row, reel: updatedReel };
      });
      setMinageRows(updated);
    };

    if (hasFilled) {
      safeConfirm("Certaines lignes de minage réelles possèdent déjà des données. Voulez-vous tout écraser avec le plan ?", () => {
        performCopy();
      });
    } else {
      performCopy();
    }
  };

  const isDeblayageReelFilled = (reel: any) => {
    return !!(
      reel.chantierId ||
      reel.driverMatricule ||
      reel.engineId ||
      reel.godets > 0 ||
      reel.volumeEstimated > 0 ||
      reel.gasoil > 0 ||
      reel.remarks
    );
  };

  const copyDeblayagePlanToReel = (postName: string, originalIndex: number) => {
    const { setDeblayageRows, deblayageRows } = getPostState(postName);
    const clone = [...deblayageRows];
    const row = clone[originalIndex];
    if (!row) return;

    const performCopy = () => {
      const updatedReel = {
        ...row.reel,
        chantierId: row.plan.chantierId || row.reel.chantierId || '',
        driverMatricule: row.plan.driverMatricule || row.reel.driverMatricule || '',
        driverName: row.plan.driverName || row.reel.driverName || '',
        engineId: row.plan.engineId || row.reel.engineId || '',
        engineCode: row.plan.engineCode || row.reel.engineCode || '',
        godets: row.plan.godets || row.reel.godets || 0,
        volumeEstimated: row.plan.volumeEstimated || row.reel.volumeEstimated || 0,
        gasoil: row.plan.gasoil || row.reel.gasoil || 0,
        startTime: row.plan.startTime || row.reel.startTime,
        endTime: row.plan.endTime || row.reel.endTime,
      };
      clone[originalIndex] = { ...row, reel: updatedReel };
      setDeblayageRows(clone);
    };

    if (isDeblayageReelFilled(row.reel)) {
      safeConfirm("La ligne de déblayage réelle possède déjà des données. Écraser ?", () => {
        performCopy();
      });
    } else {
      performCopy();
    }
  };

  const copyAllDeblayagePlanToReel = (postName: string) => {
    const { setDeblayageRows, deblayageRows } = getPostState(postName);
    const hasFilled = deblayageRows.some(row => isDeblayageReelFilled(row.reel));
    const performCopy = () => {
      const updated = deblayageRows.map(row => {
        const updatedReel = {
          ...row.reel,
          chantierId: row.plan.chantierId || row.reel.chantierId || '',
          driverMatricule: row.plan.driverMatricule || row.reel.driverMatricule || '',
          driverName: row.plan.driverName || row.reel.driverName || '',
          engineId: row.plan.engineId || row.reel.engineId || '',
          engineCode: row.plan.engineCode || row.reel.engineCode || '',
          godets: row.plan.godets || row.reel.godets || 0,
          volumeEstimated: row.plan.volumeEstimated || row.reel.volumeEstimated || 0,
          gasoil: row.plan.gasoil || row.reel.gasoil || 0,
          startTime: row.plan.startTime || row.reel.startTime,
          endTime: row.plan.endTime || row.reel.endTime,
        };
        return { ...row, reel: updatedReel };
      });
      setDeblayageRows(updated);
    };

    if (hasFilled) {
      safeConfirm("Certaines lignes de déblayage réelles possèdent déjà des données. Écraser tout ?", () => {
        performCopy();
      });
    } else {
      performCopy();
    }
  };

  const isExtractionReelFilled = (reel: any) => {
    return !!(
      reel.treuilliste ||
      reel.equipier1 ||
      reel.equipier2 ||
      reel.equipier3 ||
      reel.equipier4 ||
      reel.wagonsActual > 0 ||
      reel.sterileBureImiterEst > 0
    );
  };

  const copyExtractionPlanToReel = (postName: string, originalIndex: number) => {
    const { setExtractionRows, extractionRows } = getPostState(postName);
    const clone = [...extractionRows];
    const row = clone[originalIndex];
    if (!row) return;

    const performCopy = () => {
      const updatedReel = {
        ...row.reel,
        treuilliste: row.plan.treuilliste || row.reel.treuilliste || '',
        equipier1: row.plan.equipier1 || row.reel.equipier1 || '',
        equipier2: row.plan.equipier2 || row.reel.equipier2 || '',
        equipier3: row.plan.equipier3 || row.reel.equipier3 || '',
        equipier4: row.plan.equipier4 || row.reel.equipier4 || '',
        wagonsActual: (row.plan.wagonsActual !== undefined && row.plan.wagonsActual !== null) ? row.plan.wagonsActual : (row.reel.wagonsActual || 0),
        wagonsTarget: (row.plan.wagonsTarget !== undefined && row.plan.wagonsTarget !== null) ? row.plan.wagonsTarget : ((row.reel.wagonsTarget !== undefined && row.reel.wagonsTarget !== null) ? row.reel.wagonsTarget : 48),
        sterileBureImiterEst: (row.plan.sterileBureImiterEst !== undefined && row.plan.sterileBureImiterEst !== null) ? row.plan.sterileBureImiterEst : (row.reel.sterileBureImiterEst || 0),
        startTime: row.plan.startTime || row.reel.startTime,
        endTime: row.plan.endTime || row.reel.endTime,
      };
      clone[originalIndex] = { ...row, reel: updatedReel };
      setExtractionRows(clone);
    };

    if (isExtractionReelFilled(row.reel)) {
      safeConfirm("La ligne d'extraction réelle possède déjà des données. Écraser ?", () => {
        performCopy();
      });
    } else {
      performCopy();
    }
  };

  const copyAllExtractionPlanToReel = (postName: string) => {
    const { setExtractionRows, extractionRows } = getPostState(postName);
    const hasFilled = extractionRows.some(row => isExtractionReelFilled(row.reel));
    const performCopy = () => {
      const updated = extractionRows.map(row => {
        const updatedReel = {
          ...row.reel,
          treuilliste: row.plan.treuilliste || row.reel.treuilliste || '',
          equipier1: row.plan.equipier1 || row.reel.equipier1 || '',
          equipier2: row.plan.equipier2 || row.reel.equipier2 || '',
          equipier3: row.plan.equipier3 || row.reel.equipier3 || '',
          equipier4: row.plan.equipier4 || row.reel.equipier4 || '',
          wagonsActual: (row.plan.wagonsActual !== undefined && row.plan.wagonsActual !== null) ? row.plan.wagonsActual : (row.reel.wagonsActual || 0),
          wagonsTarget: (row.plan.wagonsTarget !== undefined && row.plan.wagonsTarget !== null) ? row.plan.wagonsTarget : ((row.reel.wagonsTarget !== undefined && row.reel.wagonsTarget !== null) ? row.reel.wagonsTarget : 48),
          sterileBureImiterEst: (row.plan.sterileBureImiterEst !== undefined && row.plan.sterileBureImiterEst !== null) ? row.plan.sterileBureImiterEst : (row.reel.sterileBureImiterEst || 0),
          startTime: row.plan.startTime || row.reel.startTime,
          endTime: row.plan.endTime || row.reel.endTime,
        };
        return { ...row, reel: updatedReel };
      });
      setExtractionRows(updated);
    };

    if (hasFilled) {
      safeConfirm("Certaines lignes d'extraction réelles possèdent déjà des données. Écraser tout ?", () => {
        performCopy();
      });
    } else {
      performCopy();
    }
  };

  // Row Manipulation Tools (Add/Delete/Modify)
  const addMinageRowForSector = (postName: string, sector: string) => {
    const { setMinageRows, minageRows } = getPostState(postName);
    setMinageRows([
      ...minageRows,
      {
        rowId: `minage_add_${Math.random().toString(36).substr(2, 9)}`,
        plan: createEmptyMinage(sector),
        reel: createEmptyMinage(sector)
      }
    ]);
  };

  const updateSectorChief = (
    postName: string,
    sectorName: string,
    type: 'chief' | 'second',
    matricule: string,
    name: string
  ) => {
    const state = getPostState(postName);
    const sectorChefs = state.sectorChefs || {};
    
    const updated = {
      ...sectorChefs,
      [sectorName]: {
        ...(sectorChefs[sectorName] || { chiefMatricule: '', chiefName: '', secondChiefMatricule: '', secondChiefName: '' }),
        ...(type === 'chief'
          ? { chiefMatricule: matricule, chiefName: name }
          : { secondChiefMatricule: matricule, secondChiefName: name })
      }
    };
    
    state.setSectorChefs(updated);

    // Sync overall post chief details for backwards compatibility / overall report view.
    const activeSectorsWithChefs = Object.keys(updated)
      .map(s => updated[s])
      .filter(sc => sc.chiefMatricule);
      
    if (activeSectorsWithChefs.length > 0) {
      const primary = activeSectorsWithChefs[0];
      state.setChiefMatricule(primary.chiefMatricule);
      state.setChiefName(primary.chiefName);
      
      const seconds = activeSectorsWithChefs
        .filter(sc => sc.secondChiefMatricule)
        .map(sc => sc.secondChiefName);
      if (seconds.length > 0) {
        state.setSecondChiefMatricule(activeSectorsWithChefs[0].secondChiefMatricule || '');
        state.setSecondChiefName(seconds[0]);
      } else {
        state.setSecondChiefMatricule('');
        state.setSecondChiefName('');
      }
    } else {
      state.setChiefMatricule('');
      state.setChiefName('');
      state.setSecondChiefMatricule('');
      state.setSecondChiefName('');
    }
  };

  const deleteMinageRow = (postName: string, index: number) => {
    const { setMinageRows } = getPostState(postName);
    setMinageRows(prev => prev.filter((_, i) => i !== index));
  };

  const updateMinageCell = (postName: string, index: number, field: keyof ExcelMinage, value: any) => {
    const { setMinageRows, minageRows } = getPostState(postName);
    const clone = [...minageRows];
    const rowWrapper = clone[index];
    const updatedReel = { ...rowWrapper.reel, [field]: value };
    
    if (field === 'minerMatricule') {
      const emp = activeEmployees.find(e => e.matricule?.toUpperCase() === String(value).trim().toUpperCase());
      updatedReel.minerName = emp ? `${emp.nom} ${emp.prenom}` : 'Inconnu';
    }
    if (field === 'assistantMatricule') {
      const emp = activeEmployees.find(e => e.matricule?.toUpperCase() === String(value).trim().toUpperCase());
      updatedReel.assistantName = emp ? `${emp.nom} ${emp.prenom}` : 'Inconnu';
    }
    if (field === 'realRounds') {
      const is24m = rowWrapper.plan?.barType === '2.4m' || rowWrapper.reel?.barType === '2.4m';
      const advanceFactor = is24m ? (platformSettings?.advance_24m ?? 2.3) : (platformSettings?.advance_18m ?? 1.7);
      const computed = Number(value) * advanceFactor;
      updatedReel.meterage = computed;
      updatedReel.realMeterage = computed;
    }
    if (field === 'realHoles' || field === 'chargedHoles') {
      const realH = field === 'realHoles' ? Number(value) : (Number(updatedReel.realHoles) || 0);
      const chargedH = field === 'chargedHoles' ? Number(value) : (Number(updatedReel.chargedHoles) || 0);
      updatedReel.emptyHoles = Math.max(0, realH - chargedH);
    }
    if (field === 'chantierId') {
      const foundChan = chantiers.find(c => c.id === value);
      if (foundChan && foundChan.sector) {
        updatedReel.sector = foundChan.sector;
        
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
    clone[index] = { ...rowWrapper, reel: updatedReel };
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
        rowId: `deblayage_add_${Math.random().toString(36).substr(2, 9)}`,
        plan: createEmptyDeblayage('Imiter 1', start, end),
        reel: createEmptyDeblayage('Imiter 1', start, end)
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
    const rowWrapper = clone[index];
    const updatedReel = { ...rowWrapper.reel, [field]: value };

    if (field === 'driverMatricule') {
      const emp = activeEmployees.find(e => e.matricule?.toUpperCase() === String(value).trim().toUpperCase());
      updatedReel.driverName = emp ? `${emp.nom} ${emp.prenom}` : 'Inconnu';
    }
    if (field === 'engineId') {
      updatedReel.engineCode = String(value);
    }
    if (field === 'godets') {
      updatedReel.volumeEstimated = Number(value) * 1.5;
    }
    clone[index] = { ...rowWrapper, reel: updatedReel };
    setDeblayageRows(clone);
  };

  const addExtractionRow = (postName: string) => {
    const { setExtractionRows, extractionRows } = getPostState(postName);
    setExtractionRows([
      ...extractionRows,
      {
        rowId: `extraction_add_${Math.random().toString(36).substr(2, 9)}`,
        plan: createEmptyExtraction(),
        reel: createEmptyExtraction()
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
    const rowWrapper = clone[index];
    const updatedReel = { ...rowWrapper.reel, [field]: value };
    clone[index] = { ...rowWrapper, reel: updatedReel };
    setExtractionRows(clone);
  };

  const addMaintenanceRow = (postName: string) => {
    const { setMaintenanceRows, maintenanceRows } = getPostState(postName);
    setMaintenanceRows([
      ...maintenanceRows,
      {
        rowId: `maintenance_add_${Math.random().toString(36).substr(2, 9)}`,
        plan: createEmptyMaintenance(),
        reel: createEmptyMaintenance()
      }
    ]);
  };

  const deleteMaintenanceRow = (postName: string, index: number) => {
    const { setMaintenanceRows } = getPostState(postName);
    setMaintenanceRows(prev => prev.filter((_, i) => i !== index));
  };

  const updateMaintenanceCell = (postName: string, index: number, field: keyof ExcelMaintenance, value: any) => {
    const { setMaintenanceRows, maintenanceRows } = getPostState(postName);
    const clone = [...maintenanceRows];
    const rowWrapper = clone[index];
    const updatedReel = { ...rowWrapper.reel, [field]: value };

    if (field === 'agentMatricule') {
      const emp = activeEmployees.find(e => e.matricule?.toUpperCase() === String(value).trim().toUpperCase());
      updatedReel.agentName = emp ? `${emp.nom} ${emp.prenom}` : 'Inconnu';
    }
    if (field === 'engineId') {
      updatedReel.engineCode = String(value);
    }
    clone[index] = { ...rowWrapper, reel: updatedReel };
    setMaintenanceRows(clone);
  };

  // Save Workbook
  const saveWorkbook = async () => {
    if (isMonthClosed) {
      safeAlert("⚠️ ERREUR : Ce mois est clôturé et verrouillé. Aucune modification n'est permise.", "Mois Clôturé", "error");
      return;
    }

    // Direct, professional confirmation check for unchanged explosives consumption
    let anyActiveMinage = false;
    let allIdentical = true;
    const postsListCheck = ['Poste 1', 'Poste 2', 'Poste 3'];
    
    for (const pName of postsListCheck) {
      const { minageRows } = getPostState(pName);
      if (Array.isArray(minageRows)) {
        for (const row of minageRows) {
          const isFilled = !!(row.reel?.chantierId || row.reel?.minerMatricule || row.reel?.assistantMatricule);
          if (isFilled) {
            anyActiveMinage = true;
            const planAnfo = Number(row.plan?.anfo) || 0;
            const planTovex = Number(row.plan?.tovex) || 0;
            const planAmmorces = Number(row.plan?.ammorces) || 0;
            
            const reelAnfo = Number(row.reel?.anfo) || 0;
            const reelTovex = Number(row.reel?.tovex) || 0;
            const reelAmmorces = Number(row.reel?.ammorces) || 0;
            
            if (planAnfo !== reelAnfo || planTovex !== reelTovex || planAmmorces !== reelAmmorces) {
              allIdentical = false;
            }
          }
        }
      }
    }

    const proceedSave = async () => {
      setSaveStatus('saving');
      try {
        const postsList = ['Poste 1', 'Poste 2', 'Poste 3'];
        const postesObj: any = {};

        for (const pName of postsList) {
          const pKey = pName === 'Poste 1' ? 'poste1' : pName === 'Poste 2' ? 'poste2' : 'poste3';
          const {
            minageRows, deblayageRows, extractionRows, maintenanceRows,
            chiefMatricule, chiefName, secondChiefMatricule, secondChiefName,
            sectorChefs
          } = getPostState(pName);

          // Inject the sector-specific chef(s) into each individual minage row for compatibility
          const finalMinageRows = minageRows.map(row => {
            const rowSecName = row.reel.sector || 'Autres / Non Classés';
            const secChief = sectorChefs[rowSecName] || { chiefMatricule: '', chiefName: '', secondChiefMatricule: '', secondChiefName: '' };
            const finalChiefMatricule = secChief.chiefMatricule;
            const finalChiefName = secChief.secondChiefName ? `${secChief.chiefName} / ${secChief.secondChiefName}` : secChief.chiefName;
            return {
              ...row,
              reel: {
                ...row.reel,
                chiefMatricule: finalChiefMatricule,
                chiefName: finalChiefName
              }
            };
          });

          postesObj[pKey] = {
            chiefMatricule: chiefMatricule || '',
            chiefName: chiefName || '',
            secondChiefMatricule: secondChiefMatricule || '',
            secondChiefName: secondChiefName || '',
            status: 'scelle',
            minage: finalMinageRows,
            deblayage: deblayageRows,
            extraction: extractionRows,
            maintenance: maintenanceRows,
            sectorChefs: sectorChefs || {}
          };
        }

        const payload = {
          date: selectedDate,
          status: 'scelle',
          operator: user?.email || 'Secrétaire de Direction SMI',
          timestamp: new Date().toISOString(),
          postes: postesObj
        };

        // Save to production under a single daily document with merging enabled
        await setDoc(doc(db, 'production', selectedDate), payload, { merge: true });

        // Compute consolidated totals for the whole day (all 3 posts combined)
        let totalMeteragePlanned = 0;
        let totalMeterageRealised = 0;
        let totalDeblayagePlanned = 0;
        let totalDeblayageRealised = 0;
        let totalWagonsPlanned = 0;
        let totalWagonsRealised = 0;
        let totalAnfo = 0;
        let totalTovex = 0;
        let totalAmorces = 0;

        for (const pName of postsList) {
          const pKey = pName === 'Poste 1' ? 'poste1' : pName === 'Poste 2' ? 'poste2' : 'poste3';
          const pData = postesObj[pKey];
          if (pData) {
            const minageRows = pData.minage || [];
            const deblayageRows = pData.deblayage || [];
            const extractionRows = pData.extraction || [];

            // Minage (Métrage & Explosives)
            minageRows.forEach((r: any) => {
              // Planned meterage
              const planMet = Number(r.plan?.meterage) || 0;
              totalMeteragePlanned += planMet;

              // Realised meterage
              const rMet = r.reel?.realMeterage !== undefined && r.reel?.realMeterage !== null
                ? r.reel.realMeterage
                : (r.reel?.meterage !== undefined ? r.reel?.meterage : 0);
              totalMeterageRealised += (Number(rMet) || 0);

              // Explosives (only on realized minage rows)
              totalAnfo += (Number(r.reel?.anfo) || 0);
              totalTovex += (Number(r.reel?.tovex) || 0);
              totalAmorces += (Number(r.reel?.ammorces) || 0);
            });

            // Deblayage (Volume)
            deblayageRows.forEach((r: any) => {
              const planVol = Number(r.plan?.volumeEstimated) || 0;
              totalDeblayagePlanned += planVol;

              const reelVol = Number(r.reel?.volumeEstimated || r.volumeEstimated) || 0;
              totalDeblayageRealised += reelVol;
            });

            // Extraction (Wagons)
            extractionRows.forEach((r: any) => {
              const planWag = r.plan?.wagonsTarget !== undefined && r.plan?.wagonsTarget !== null ? Number(r.plan.wagonsTarget) : 48;
              totalWagonsPlanned += planWag;

              const reelWag = Number(r.reel?.wagonsActual) || 0;
              totalWagonsRealised += reelWag;
            });
          }
        }

        // Save a single daily consolidated record to production_history
        const histId = selectedDate;
        await setDoc(doc(db, 'production_history', histId), {
          date: selectedDate,
          totalMeteragePlanned: Number(totalMeteragePlanned) || 0,
          totalMeterageRealised: Number(totalMeterageRealised) || 0,
          totalDeblayagePlanned: Number(totalDeblayagePlanned) || 0,
          totalDeblayageRealised: Number(totalDeblayageRealised) || 0,
          totalWagonsPlanned: Number(totalWagonsPlanned) || 0,
          totalWagonsRealised: Number(totalWagonsRealised) || 0,
          totalAnfo: Number(totalAnfo) || 0,
          totalTovex: Number(totalTovex) || 0,
          totalAmorces: Number(totalAmorces) || 0,
          secretary: profile?.name || user?.displayName || user?.email?.split('@')[0] || 'Secrétaire',
          lastUpdated: new Date().toISOString()
        }, { merge: true });

        // Clear draft on successful save
        localStorage.removeItem(`draft_production_${selectedDate}`);
        setDraftAvailable(false);

        setIsTemplateLoaded(false);
        setTemplateDateHint('');
        setSaveStatus('saved');
        
        // Show the beautiful Hydromines success toast
        setSuccessToastMsg(`Le registre journalier du ${formatFrenchDate(selectedDate)} a été enregistré avec succès et gravé au Registre SMI.`);
        setShowSuccessToast(true);

        setTimeout(() => setSaveStatus('idle'), 2500);
      } catch (err) {
        console.error("Error saving workbook: ", err);
        setSaveStatus('error');
      }
    };

    if (anyActiveMinage && allIdentical) {
      safeConfirm(
        "Vous n'avez changé aucune chose dans le réalisé des consommations des explosifs. Est-ce que vous êtes sûr que les consommations réalisées des explosifs sont vraiment identiques à ce que vous avez planifié ? Si non, veuillez saisir les vrais consommations.",
        async () => {
          await proceedSave();
        }
      );
    } else {
      await proceedSave();
    }
  };

  const unsealWorkbook = async () => {
    if (isMonthClosed) {
      safeAlert("❌ Ce mois est clôturé. Aucun déscellement n'est autorisé.", "Mois Clôturé", "error");
      return;
    }

    const canUnseal = profile && ['admin', 'direction'].includes(profile.role);
    if (!canUnseal) {
      safeAlert("❌ Vous n'avez pas l'autorisation de désceller ce registre.", "Accès Refusé", "error");
      return;
    }

    safeConfirm(
      `🔓 Êtes-vous sûr de vouloir désceller le registre du ${formatFrenchDate(selectedDate)} ? Cela permettra d'apporter à nouveau des modifications au réalisé de cette journée.`,
      async () => {
        setSaveStatus('saving');
        try {
          const docRef = doc(db, 'production', selectedDate);
          const docSnap = await getDoc(docRef);
          
          if (docSnap.exists()) {
            const currentData = docSnap.data();
            
            // Revert status to 'brouillon' or empty so it is no longer 'scelle'
            const updatedPayload: any = {
              ...currentData,
              status: 'brouillon',
              timestamp: new Date().toISOString(),
              unsealedBy: user?.email || profile?.name || 'Secrétaire'
            };

            // Also, update the status field of each post in the document for completeness
            if (updatedPayload.postes) {
              for (const postKey of Object.keys(updatedPayload.postes)) {
                if (updatedPayload.postes[postKey]) {
                  updatedPayload.postes[postKey].status = 'brouillon';
                }
              }
            }

            await setDoc(docRef, updatedPayload);
            
            // Add to audit trail/logs
            await setDoc(doc(db, 'audit_logs', `${selectedDate}_unseal_${Date.now()}`), {
              date: selectedDate,
              action: 'DESCELLAGE',
              actor: user?.email || profile?.name || 'Secrétaire',
              timestamp: new Date().toISOString()
            });

            setSaveStatus('saved');
            setSuccessToastMsg(`Le registre journalier du ${formatFrenchDate(selectedDate)} a été déscellé avec succès. Vous pouvez maintenant le modifier.`);
            setShowSuccessToast(true);
            setTimeout(() => setSaveStatus('idle'), 2500);
          } else {
            safeAlert("❌ Aucun document enregistré trouvé pour cette date.", "Erreur", "error");
            setSaveStatus('idle');
          }
        } catch (err) {
          console.error("Error unsealing workbook: ", err);
          setSaveStatus('error');
        }
      }
    );
  };

  const exportPlanningToProduction = async (targetDate: string) => {
    if (!targetDate) return;
    if (isMonthClosed) {
      safeAlert("❌ Ce mois est clôturé. Aucune modification de production ou ré-exportation n'est autorisée.", "Mois Clôturé", "error");
      return;
    }

    safeConfirm(
      `⚠️ Attention : Cette action va écraser les données du réalisé de production actuel pour la date du ${formatFrenchDate(selectedDate)} avec les planifications du ${formatFrenchDate(targetDate)}. Vos éventuelles saisies de réalisé en cours pour cette journée seront remplacées. Voulez-vous vraiment continuer ?`,
      async () => {
        setSyncingBridge(true);
        setBridgeSuccessDate('');
        try {
          // 1. Fetch the daily planning sheet for targetDate
          const planSnap = await getDoc(doc(db, 'daily_planning_sheets', targetDate));
          if (!planSnap.exists()) {
            safeAlert(`❌ Aucune planification trouvée pour le ${formatFrenchDate(targetDate)}. Veuillez d'avance enregistrer une planification pour ce jour.`, "Saisie SMI requise", "error");
            setSyncingBridge(false);
            return;
          }

          const planData = planSnap.data();
          const postesObj: any = {};
          const postsList = ['Poste 1', 'Poste 2', 'Poste 3'];

          postsList.forEach(pName => {
            const pKey = pName === 'Poste 1' ? 'poste1' : pName === 'Poste 2' ? 'poste2' : 'poste3';
            const pPlan = planData?.postes?.[pKey];

            const minageRows = pPlan ? generateFromPlan(filterRealPlannedRows(pPlan.minage || [], 'minage'), createEmptyMinage, pName, 'minage') : [];
            const deblayageRows = pPlan ? generateFromPlan(filterRealPlannedRows(pPlan.deblayage || [], 'deblayage'), createEmptyDeblayage, pName, 'deblayage') : [];
            const extractionRows = pPlan ? generateFromPlan(filterRealPlannedRows(pPlan.extraction || [], 'extraction'), createEmptyExtraction, pName, 'extraction') : [];
            const maintenanceRows = pPlan ? generateFromPlan(filterRealPlannedRows(pPlan.maintenance || [], 'maintenance'), createEmptyMaintenance, pName, 'maintenance') : [];

            // Active planned rows
            const finalMinage = minageRows;
            const finalDeblayage = deblayageRows;
            const finalExtraction = extractionRows;
            const finalMaintenance = maintenanceRows;

            // Inject sector chiefs
            const sectorChefs = pPlan?.sectorChefs || buildDefaultSectorChefs(pName, targetDate);

            // Map and format for production compatibility - with fallback chain for sector matching
            const mappedMinage = finalMinage.map((row: any) => {
              const rowSecName = row.reel?.sector || row.plan?.sector || row.sector || 'Autres / Non Classés';
              const secChief = sectorChefs[rowSecName] || { chiefMatricule: '', chiefName: '', secondChiefMatricule: '', secondChiefName: '' };
              return {
                ...row,
                reel: {
                  ...(row.reel || {}),
                  chiefMatricule: secChief.chiefMatricule || '',
                  chiefName: secChief.secondChiefName ? `${secChief.chiefName} / ${secChief.secondChiefName}` : secChief.chiefName || ''
                }
              };
            });

            postesObj[pKey] = {
              chiefMatricule: pPlan?.chiefMatricule || '',
              chiefName: pPlan?.chiefName || '',
              secondChiefMatricule: pPlan?.secondChiefMatricule || '',
              secondChiefName: pPlan?.secondChiefName || '',
              status: 'planifie',
              minage: mappedMinage,
              deblayage: finalDeblayage,
              extraction: finalExtraction,
              maintenance: finalMaintenance,
              sectorChefs: sectorChefs
            };
          });

          const payload = {
            date: selectedDate,
            status: 'scelle', // Treat as initialized/sealed template ready for editing
            operator: user?.email || 'Pont d\'Export SMI',
            timestamp: new Date().toISOString(),
            postes: postesObj
          };

          // Save to production without merge to prevent ghost fields from previous states
          await setDoc(doc(db, 'production', selectedDate), payload);

          setBridgeSuccessDate(targetDate);
          
          // Since it is saved under selectedDate, we can reload of the workbook directly
          await loadGlobalWorkbook(true);
          
          setTimeout(() => {
            setBridgeSuccessDate('');
          }, 5000);

        } catch (err) {
          console.error("Error running SMI Data sync-bridge: ", err);
          safeAlert("❌ Une erreur est survenue lors de l'exportation de la planification.", "Erreur d'Exploitation", "error");
        } finally {
          setSyncingBridge(false);
        }
      }
    );
  };

  const standardizeHours = (postName: string) => {
    let start = '07:00';
    let end = '14:00';
    if (postName === 'Poste 1') { start = '07:00'; end = '14:00'; }
    else if (postName === 'Poste 2') { start = '15:00'; end = '22:00'; }
    else if (postName === 'Poste 3') { start = '23:00'; end = '06:00'; }

    const { setMinageRows, setDeblayageRows, setExtractionRows } = getPostState(postName);

    setMinageRows(prev => prev.map(row => ({ ...row, reel: { ...row.reel, startTime: start, endTime: end } })));
    setDeblayageRows(prev => prev.map(row => ({ ...row, reel: { ...row.reel, startTime: start, endTime: end } })));
    setExtractionRows(prev => prev.map(row => ({ ...row, reel: { ...row.reel, startTime: start, endTime: end } })));
  };

  const copyYesterdayShiftTeam = async (postName: string) => {
    setCopyStatus('copying');
    try {
      const parts = selectedDate.split('-');
      const yDateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 12, 0, 0);
      const yesterdayObj = new Date(yDateObj);
      yesterdayObj.setDate(yDateObj.getDate() - 1);
      const yesterdayStr = format(yesterdayObj, 'yyyy-MM-dd');

      // Fetch unified yesterday production document
      const yesterdayDocSnap = await getDoc(doc(db, 'production', yesterdayStr));

      if (yesterdayDocSnap.exists()) {
        const docData = yesterdayDocSnap.data();
        const pKey = postName === 'Poste 1' ? 'poste1' : postName === 'Poste 2' ? 'poste2' : 'poste3';
        const data = docData.postes?.[pKey];

        if (data) {
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

          // Copy sector chief details
          if (data.sectorChefs) {
            const { setSectorChefs } = getPostState(postName);
            setSectorChefs(data.sectorChefs);
          }

          // 1. Minage rows copy miners & assistant - Match by chantierId first, then fallback to index
          if (data.minage && data.minage.length > 0) {
            setMinageRows(prev => prev.map((row, idx) => {
              const yRow = (row.chantierId && data.minage.find((yr: any) => yr.chantierId === row.chantierId)) || data.minage[idx];
              if (yRow) {
                const yReel = yRow.reel || yRow;
                return {
                  ...row,
                  reel: {
                    ...row.reel,
                    minerMatricule: yReel.minerMatricule || '',
                    minerName: yReel.minerName || '',
                    assistantMatricule: yReel.assistantMatricule || '',
                    assistantName: yReel.assistantName || '',
                  }
                };
              }
              return row;
            }));
          }

          // 2. Deblayage rows - Match by chantierId first, then fallback to index
          if (data.deblayage && data.deblayage.length > 0) {
            setDeblayageRows(prev => prev.map((row, idx) => {
              const yRow = (row.chantierId && data.deblayage.find((yr: any) => yr.chantierId === row.chantierId)) || data.deblayage[idx];
              if (yRow) {
                const yReel = yRow.reel || yRow;
                return {
                  ...row,
                  reel: {
                    ...row.reel,
                    driverMatricule: yReel.driverMatricule || '',
                    driverName: yReel.driverName || '',
                  }
                };
              }
              return row;
            }));
          }

          // 3. Extraction rows - Match by chantierName first, then fallback to index
          if (data.extraction && data.extraction.length > 0) {
            setExtractionRows(prev => prev.map((row, idx) => {
              const yRow = (row.chantierName && data.extraction.find((yr: any) => yr.chantierName === row.chantierName)) || data.extraction[idx];
              if (yRow) {
                const yReel = yRow.reel || yRow;
                return {
                  ...row,
                  reel: {
                    ...row.reel,
                    treuilliste: yReel.treuilliste || '',
                    equipier1: yReel.equipier1 || '',
                    equipier2: yReel.equipier2 || '',
                    equipier3: yReel.equipier3 || '',
                    equipier4: yReel.equipier4 || '',
                  }
                };
              }
              return row;
            }));
          }

          // 4. Maintenance rows - Match by role/engine details, then fallback to index
          if (data.maintenance && data.maintenance.length > 0) {
            setMaintenanceRows(prev => prev.map((row, idx) => {
              const yRow = data.maintenance.find((yr: any) => {
                const yrRole = yr.roleLabel || yr.plan?.roleLabel || yr.reel?.roleLabel;
                const rowRole = row.roleLabel || row.plan?.roleLabel || row.reel?.roleLabel;
                const yrEngine = yr.engineCode || yr.plan?.engineCode || yr.reel?.engineCode;
                const rowEngine = row.engineCode || row.plan?.engineCode || row.reel?.engineCode;
                return (yrRole && yrRole === rowRole) || (yrEngine && yrEngine === rowEngine);
              }) || data.maintenance[idx];
              if (yRow) {
                const yReel = yRow.reel || yRow;
                return {
                  ...row,
                  reel: {
                    ...row.reel,
                    agentMatricule: yReel.agentMatricule || '',
                    agentName: yReel.agentName || '',
                  }
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
      const { minageRows: minageWrappers, deblayageRows: deblayageWrappers, extractionRows: extractionWrappers, sectorChefs } = state;
      const minageRows = minageWrappers.map(w => w.reel);
      const deblayageRows = deblayageWrappers.map(w => w.reel);
      const extractionRows = extractionWrappers.map(w => w.reel);

      // Check missing chief / double chief within each sector
      const sectors = ['Imiter 2', 'Imiter 1', 'Imiter Est', 'Autres / Non Classés'];
      sectors.forEach(secName => {
        const sectorRows = minageRows.filter(r => (r.sector || '').trim().toLowerCase() === secName.trim().toLowerCase() && r.chantierId);
        const secChief = (sectorChefs || {})[secName] || { chiefMatricule: '', chiefName: '', secondChiefMatricule: '', secondChiefName: '' };
        
        // Missing sector chief when active (Shift 3 is optional as per user criteria: "parfois comme la 3eme poste on a pas un chef et c'est pas grave")
        if (sectorRows.length > 0 && !secChief.chiefMatricule && shiftName !== 'Poste 3') {
          logs.push({
            level: 'danger',
            msg: `⚠️ Encadrement requis pour ${secName} (${shiftName}) : Des activités de minage sont saisies mais aucun Chef de Poste n'est spécifié pour ce secteur.`
          });
        }

        // Double chief within same sector
        if (secChief.chiefMatricule && secChief.secondChiefMatricule && secChief.chiefMatricule.trim().toUpperCase() === secChief.secondChiefMatricule.trim().toUpperCase()) {
          logs.push({
            level: 'danger',
            msg: `⚠️ Doublon d'encadrement sur le secteur ${secName} du ${shiftName} : Le chef principal et le deuxième chef possèdent le même matricule (${secChief.chiefMatricule}).`
          });
        }

        // Track chef assignments across shifts ONLY if there is actual activity in this sector for this shift!
        if (sectorRows.length > 0) {
          if (secChief.chiefMatricule) {
            const key = secChief.chiefMatricule.trim().toUpperCase();
            if (!chefShifts[key]) {
              chefShifts[key] = { name: secChief.chiefName || secChief.chiefMatricule, shifts: [] };
            }
            if (!chefShifts[key].shifts.includes(shiftName)) {
              chefShifts[key].shifts.push(shiftName);
            }
          }
          if (secChief.secondChiefMatricule) {
            const key = secChief.secondChiefMatricule.trim().toUpperCase();
            if (!chefShifts[key]) {
              chefShifts[key] = { name: secChief.secondChiefName || secChief.secondChiefMatricule, shifts: [] };
            }
            if (!chefShifts[key].shifts.includes(shiftName)) {
              chefShifts[key].shifts.push(shiftName);
            }
          }
        }
      });

      // 3. Extraction productivity cadence warning
      extractionRows.forEach(row => {
        if (row.wagonsActual > 0) {
          const avgMin = 360 / row.wagonsActual;
          if (avgMin > 10) {
            const rowTarget = (row.wagonsTarget !== undefined && row.wagonsTarget !== null) ? Number(row.wagonsTarget) : 48;
            const pctStr = rowTarget > 0 ? ((row.wagonsActual / rowTarget) * 100).toFixed(0) + '%' : 'Cible non définie';
            logs.push({
              level: 'warning',
              msg: `🛠️ Extraction (${shiftName}) : Cadence de ${avgMin.toFixed(1)} mins/wagon (Standard requis: 8 mins). Rendement d'extraction actuel : ${pctStr}.`
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
            const advanceFactor = blast.barType === '2.4m' ? (platformSettings?.advance_24m ?? 2.3) : (platformSettings?.advance_18m ?? 1.7);
            const inSituVol = blast.realRounds * advanceFactor * (blast.gallerySize || 12);
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

  const renderSectorCardsStub1 = (postName: string, sectorName: string, borderColorAccent: string, textColorAccent: string, stripBgAccent: string) => {
    // Legacy card view bypassed for the unified Excel-style alignment table
    return null;
  };

  const renderMinageUnifiedTable = (postName: string) => {
    const { minageRows, sectorChefs } = getPostState(postName);
    const SECTORS = ['Imiter 2', 'Imiter 1', 'Imiter Est', 'Autres / Non Classés'];

    // Verify if there are any rows at all
    if (minageRows.length === 0) {
      return (
        <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-6 text-center max-w-xl mx-auto my-4 shadow-xs" id={`empty_minage_plan_${postName.replace(/\s+/g, '_')}`}>
          <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
            <AlertTriangle className="w-6 h-6 text-amber-600" />
          </div>
          <h4 className="text-xs font-black uppercase text-amber-900 tracking-wider mb-2">
            Planification Non Saisie — {postName}
          </h4>
          <p className="text-[11px] text-amber-800 font-bold leading-relaxed">
            Aucune planification de forage ou de minage s'y rapportant n'a été enregistrée pour le <span className="underline">{postName}</span> à cette date.
            Veuillez d'abord saisir le chantier et l'équipe dans le <span className="underline">Planning Journalier</span> pour pouvoir ajouter le réalisé.
          </p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto rounded-xl border border-slate-250 bg-white shadow-xs">
        <table className="w-full text-left border-collapse text-[11px]">
          <thead>
            <tr className="bg-slate-900 text-white select-none text-[9.5px] font-black tracking-wider uppercase sticky top-0 z-10">
              <th className="p-2 border-r border-slate-700/50 text-center w-10">#</th>
              <th className="p-2 border-r border-slate-700/50 text-center w-24">Actions</th>
              <th className="p-2 border-r border-[#ffd700]/30 min-w-[130px] bg-slate-850/80 text-sky-200">Chantier</th>
              <th className="p-2 border-r border-slate-700/50 w-14 text-center">Type</th>
              <th className="p-2 border-r border-slate-700/50 min-w-[155px] text-[#ffd700]">Mineur (Matricule / Nom)</th>
              <th className="p-2 border-r border-slate-700/50 min-w-[155px] text-sky-200">Aide-Mineur / Assistant</th>
              <th className="p-2 border-r border-slate-700/50 w-16 text-center text-rose-250">Section</th>
              <th className="p-2 border-r border-slate-700/50 w-16 text-center">Trous (u)</th>
              <th className="p-2 border-r border-slate-700/50 w-20 text-center text-[#ffd700]">Trous chargés</th>
              <th className="p-2 border-r border-slate-700/50 w-24 text-center">Trous vides</th>
              <th className="p-2 border-r border-slate-700/50 w-16 text-center">Volées (u)</th>
              <th className="p-2 border-r border-slate-700/50 w-20 text-center text-amber-200">Métrage (m)</th>
              <th className="p-2 border-r border-slate-700/50 w-16 text-center">ANFO (kg)</th>
              <th className="p-2 border-r border-slate-700/50 w-16 text-center">Tovex (kg)</th>
              <th className="p-2 border-r border-slate-700/50 w-16 text-center text-rose-220">Amorces</th>
              <th className="p-2 text-center min-w-[130px] bg-slate-950 text-emerald-300">Rendement & Écart</th>
            </tr>
          </thead>
          <tbody>
            {SECTORS.map(secName => {
              const rows = minageRows
                .map((row, idx) => ({ row, idx }))
                .filter(item => {
                  const rowSec = (item.row.reel.sector || item.row.plan.sector || '').trim().toLowerCase();
                  const targetSec = secName.trim().toLowerCase();
                  if (targetSec === 'autres / non classés') {
                    return !['imiter 2', 'imiter 1', 'imiter est'].includes(rowSec);
                  }
                  return rowSec === targetSec;
                });

              if (rows.length === 0) return null;

              // Color styles for beautiful sector group header
              let headerStyle = {
                bg: 'bg-neutral-105 border-l-4 border-neutral-400',
                text: 'text-neutral-900',
                bullet: 'bg-neutral-500'
              };
              if (secName.toLowerCase() === 'imiter 2') {
                headerStyle = {
                  bg: 'bg-red-50/70 border-l-4 border-[#8B0000]',
                  text: 'text-[#8B0000]',
                  bullet: 'bg-[#8B0000]'
                };
              } else if (secName.toLowerCase() === 'imiter 1') {
                headerStyle = {
                  bg: 'bg-sky-50/70 border-l-4 border-[#00BFFF]',
                  text: 'text-sky-950',
                  bullet: 'bg-[#00BFFF]'
                };
              } else if (secName.toLowerCase() === 'imiter est') {
                headerStyle = {
                  bg: 'bg-teal-50/70 border-l-4 border-teal-600',
                  text: 'text-teal-950',
                  bullet: 'bg-teal-600'
                };
              }

              return (
                <React.Fragment key={secName}>
                  {/* Sector Header Row spanning all 16 columns */}
                  <tr className="bg-slate-100/90 border-y border-slate-205 select-none font-bold">
                    <td colSpan={16} className="py-2.5 px-3">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <span className={`w-3 h-3 ${headerStyle.bullet} rounded-sm shrink-0`}></span>
                          <span className={`${headerStyle.text} text-xs font-black uppercase tracking-wider`}>
                            Secteur : <strong>{secName}</strong>
                          </span>
                          {structureEditMode && (
                            <button
                              type="button"
                              onClick={() => addMinageRowForSector(postName, secName === 'Autres / Non Classés' ? '' : secName)}
                              className="bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-[9px] uppercase px-2.5 py-1.5 flex items-center gap-1 transition-all rounded shadow-sm cursor-pointer shrink-0"
                            >
                              <Plus className="w-3 h-3 text-[#00BFFF]" /> Ajouter Ligne
                            </button>
                          )}
                        </div>

                        {/* Supervisor / Assistant inputs inline */}
                        {secName !== 'Autres / Non Classés' && (
                          <div className="flex flex-wrap items-center gap-3 bg-white/95 p-1 rounded border border-slate-200">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-slate-800 font-extrabold uppercase shrink-0">Chef de Secteur :</span>
                              <div className="w-36 shrink-0">
                                <EmployeeCell
                                  matricule={(sectorChefs || {})[secName]?.chiefMatricule || ''}
                                  name={(sectorChefs || {})[secName]?.chiefName || ''}
                                  onChange={(mat, resName) => updateSectorChief(postName, secName, 'chief', mat, resName)}
                                  employees={activeEmployees}
                                  placeholder="Chef..."
                                />
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] text-slate-500 font-bold uppercase shrink-0">Adjoint :</span>
                              <div className="w-36 shrink-0">
                                <EmployeeCell
                                  matricule={(sectorChefs || {})[secName]?.secondChiefMatricule || ''}
                                  name={(sectorChefs || {})[secName]?.secondChiefName || ''}
                                  onChange={(mat, resName) => updateSectorChief(postName, secName, 'second', mat, resName)}
                                  employees={activeEmployees}
                                  placeholder="Adjoint..."
                                />
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* Sector Rows */}
                  {rows.map(({ row: rowWrapper, idx }) => {
                    const row = rowWrapper.reel;
                    const plan = rowWrapper.plan || {} as ExcelMinage;

                    const minerMismatch = !!(row.minerMatricule && plan.minerMatricule && row.minerMatricule.trim().toUpperCase() !== plan.minerMatricule.trim().toUpperCase());
                    const assistantMismatch = !!(row.assistantMatricule && plan.assistantMatricule && row.assistantMatricule.trim().toUpperCase() !== plan.assistantMatricule.trim().toUpperCase());

                    const realMeterageVal = row.realMeterage === undefined ? row.meterage : row.realMeterage;
                    const rendement = row.realRounds > 0 ? (realMeterageVal / row.realRounds) : 0;
                    const plannedMeterageVal = plan.meterage || 0;
                    const diffMeteragePct = plannedMeterageVal > 0 ? ((realMeterageVal - plannedMeterageVal) / plannedMeterageVal) * 100 : 0;

                    const chantierObj = chantiers.find(c => c.id === row.chantierId);
                    const plannedTotalMeterage = chantierObj?.plannedTotalMeterage || 100;
                    const currentMeterage = chantierObj?.currentMeterage || 0;
                    const progressPct = plannedTotalMeterage > 0 ? Math.min(100, (currentMeterage / plannedTotalMeterage) * 100) : 0;

                    // Compute Performance Color based directly on the cell's real meterage
                    const colorMeterage = realMeterageVal;

                    let valBg = "bg-teal-50/20";
                    let valText = "text-teal-950";
                    if (colorMeterage !== undefined && colorMeterage !== null && colorMeterage !== 0) {
                      if (colorMeterage >= 1.5) {
                        valBg = "bg-emerald-100/50";
                        valText = "text-emerald-920";
                      } else if (colorMeterage >= 1.4 && colorMeterage < 1.5) {
                        valBg = "bg-amber-100/50";
                        valText = "text-amber-920";
                      } else if (colorMeterage < 1.4) {
                        valBg = "bg-rose-100/50";
                        valText = "text-rose-920";
                      }
                    }

                    return (
                      <React.Fragment key={idx}>
                        {/* FIRST ROW: Plan Values + spanned columns */}
                        <tr className="bg-slate-50/55 text-slate-500 font-bold border-t border-slate-200">
                          {/* # (Spanned over 2 rows: Plan + Real) */}
                          <td rowSpan={2} className="p-2 border-r border-slate-200 text-center font-black uppercase select-none align-middle bg-slate-50 text-slate-707">
                            #{idx + 1}
                          </td>

                          {/* Actions (Spanned over 2 rows: Plan + Real) */}
                          <td rowSpan={2} className="p-2 border-r border-slate-200 text-center align-middle bg-slate-50">
                            <div className="flex flex-col gap-1 items-center justify-center">
                              <button
                                type="button"
                                onClick={() => copyMinagePlanToReel(postName, idx)}
                                className="px-1.5 py-1 text-[8.5px] font-black uppercase bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-200 rounded tracking-wider cursor-pointer transition-all flex items-center gap-1 shadow-sm select-none"
                                title="Copier les valeurs de planification de ce chantier vers le réel"
                              >
                                <Copy className="w-2.5 h-2.5 text-amber-600" /> Copier
                              </button>
                              {structureEditMode && (
                                <button
                                  type="button"
                                  onClick={() => deleteMinageRow(postName, idx)}
                                  className="p-1 text-slate-450 hover:text-red-600 transition-colors cursor-pointer select-none"
                                  title="Supprimer ce chantier"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>

                          {/* Chantier (Spanned over 2 rows: Plan + Real) */}
                          <td rowSpan={2} className="p-2 border-r border-slate-300 min-w-[130px] align-middle font-bold bg-white">
                            <div className="space-y-1.5">
                              <select
                                value={row.chantierId}
                                onChange={e => updateMinageCell(postName, idx, 'chantierId', e.target.value)}
                                className="w-full text-xs font-black uppercase text-slate-850 border border-slate-200 rounded p-1 bg-transparent cursor-pointer focus:border-[#8B0000] focus:ring-0 outline-none"
                              >
                                <option value="">(Choisir Chantier)</option>
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
                              
                              {/* Inline mini progress bar */}
                              {row.chantierId && (
                                <div className="space-y-0.5 select-none">
                                  <div className="flex justify-between text-[7px] font-black uppercase text-slate-500">
                                    <span>Progression</span>
                                    <span className="font-mono">{currentMeterage.toFixed(1)}/{plannedTotalMeterage.toFixed(1)}m</span>
                                  </div>
                                  <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden">
                                    <div className="bg-[#00BFFF] h-full transition-all duration-305" style={{ width: `${progressPct}%` }}></div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>

                          {/* Type (Plan) */}
                          <td className="p-1 px-1.5 border-r border-slate-205 text-[8px] font-black uppercase text-center bg-slate-105 flex items-center justify-center gap-0.5 select-none min-h-[28px] border-b border-slate-100">
                            <Lock className="w-2.5 h-2.5 text-slate-400" /> Plan
                          </td>

                          {/* Plan Mineur */}
                          <td className="p-1 px-2 border-r border-slate-200 font-mono text-[9.5px] text-slate-500 italic">
                            {plan.minerMatricule ? `${plan.minerMatricule} - ${plan.minerName || ''}` : '(Aucun)'}
                          </td>

                          {/* Plan Assistant */}
                          <td className="p-1 px-2 border-r border-slate-200 font-mono text-[9.5px] text-slate-500 italic">
                            {plan.assistantMatricule ? `${plan.assistantMatricule} - ${plan.assistantName || ''}` : '(Aucun)'}
                          </td>

                          {/* Plan Section */}
                          <td className="p-1 text-center border-r border-slate-200 font-mono text-slate-500 select-none">
                            {plan.gallerySize || 12}m²
                          </td>

                          {/* Plan Trous */}
                          <td className="p-1 text-center border-r border-slate-200 font-mono text-slate-500 select-none">
                            {plan.plannedHoles || 32}
                          </td>

                          {/* Plan Trous chargés */}
                          <td className="p-1 text-center border-r border-slate-200 font-mono text-slate-400 select-none bg-slate-100/30">
                            -
                          </td>

                          {/* Plan Trous vides */}
                          <td className="p-1 text-center border-r border-slate-200 font-mono text-slate-400 select-none bg-slate-100/30">
                            -
                          </td>

                          {/* Plan Volées */}
                          <td className="p-1 text-center border-r border-slate-200 font-mono text-slate-500 select-none">
                            {plan.plannedRounds || 1}
                          </td>

                          {/* Plan Métrage */}
                          <td className="p-1 text-center border-r border-slate-200 font-mono text-slate-500 font-bold select-none text-[10px]">
                            {plan.meterage?.toFixed(1) || '0.0'}m
                          </td>

                          {/* Plan ANFO */}
                          <td className="p-1 text-center border-r border-slate-200 font-mono text-slate-450 select-none bg-slate-50/30">
                            {plan.anfo || 0}
                          </td>

                          {/* Plan Tovex */}
                          <td className="p-1 text-center border-r border-slate-200 font-mono text-slate-450 select-none bg-slate-50/30">
                            {plan.tovex || 0}
                          </td>

                          {/* Plan Amorces */}
                          <td className="p-1 text-center border-r border-slate-300 font-mono text-slate-450 select-none bg-slate-50/30">
                            {plan.ammorces || 0}
                          </td>

                          {/* Performance & Écart (Spanned over 2 rows for cleaner layout) */}
                          <td rowSpan={2} className="p-2 text-center align-middle bg-slate-50/40 text-[10px] min-w-[130px] border-l border-slate-105">
                            <div className="flex flex-col gap-1.5 justify-center items-center font-bold">
                              <div className="flex items-center gap-1 text-[9.5px]" title="Rendement de volée en mètres">
                                <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
                                <span>Rend. : <strong className="text-slate-800 font-black">{rendement.toFixed(2)} m/v</strong></span>
                              </div>
                              <div className="flex items-center gap-1 text-[9.5px]" title="Écart métrage réel vs planifié">
                                <CheckCircle className="w-3.5 h-3.5 text-teal-655" />
                                <span className={diffMeteragePct === 0 ? "text-slate-600" : diffMeteragePct > 0 ? "text-emerald-700 bg-emerald-50 px-1 rounded font-black" : "text-rose-700 bg-rose-50 px-1 rounded font-black"}>
                                  Écart: {diffMeteragePct > 0 ? '+' : ''}{diffMeteragePct.toFixed(1)}%
                                </span>
                              </div>
                            </div>
                          </td>
                        </tr>

                        {/* SECOND ROW: Editable Real Values */}
                        <tr className="bg-white border-b border-slate-205">
                          {/* Type (Réel) */}
                          <td className="p-1 px-1.5 border-r border-slate-205 text-[8px] font-black uppercase text-center bg-slate-50 flex items-center justify-center gap-0.5 select-none min-h-[36px]">
                            <Pencil className="w-2.5 h-2.5 text-red-700" /> Réel
                          </td>

                          {/* Real Mineur EmployeeCell */}
                          <td className="p-1 border-r border-slate-200">
                            <EmployeeCell
                              matricule={row.minerMatricule}
                              name={row.minerName}
                              onChange={(mat) => updateMinageCell(postName, idx, 'minerMatricule', mat)}
                              employees={activeEmployees}
                              placeholder="Mineur..."
                              hideNameLabel={true}
                              onKeyDown={handleKeyDown}
                            />
                            {minerMismatch && (
                              <div className="text-[7px] font-black uppercase text-amber-700 leading-none mt-0.5 select-none" title={`Planifié : ${plan.minerMatricule}`}>
                                ⚠️ ≠ Plan ({plan.minerMatricule})
                              </div>
                            )}
                          </td>

                          {/* Real Assistant EmployeeCell */}
                          <td className="p-1 border-r border-slate-200">
                            <EmployeeCell
                              matricule={row.assistantMatricule}
                              name={row.assistantName}
                              onChange={(mat) => updateMinageCell(postName, idx, 'assistantMatricule', mat)}
                              employees={activeEmployees}
                              placeholder="Assistant..."
                              hideNameLabel={true}
                              onKeyDown={handleKeyDown}
                            />
                            {assistantMismatch && (
                              <div className="text-[7px] font-black uppercase text-amber-700 leading-none mt-0.5 select-none" title={`Planifié : ${plan.assistantMatricule}`}>
                                ⚠️ ≠ Plan ({plan.assistantMatricule})
                              </div>
                            )}
                          </td>

                          {/* Real Section dropdown select */}
                          <td className="p-1 border-r border-slate-200 text-center">
                            <select
                              value={row.gallerySize}
                              onChange={e => updateMinageCell(postName, idx, 'gallerySize', Number(e.target.value))}
                              onKeyDown={handleKeyDown}
                              className="border border-slate-200 p-1 text-center font-bold font-mono bg-transparent rounded focus:ring-1 focus:ring-[#8B0000] focus:border-[#8B0000] text-[10px]"
                            >
                              <option value={9}>9</option>
                              <option value={12}>12</option>
                            </select>
                          </td>

                          {/* Real Trous input */}
                          <td className="p-1 border-r border-slate-200 text-center w-14">
                            <input
                              type="number"
                              value={row.realHoles}
                              onChange={e => updateMinageCell(postName, idx, 'realHoles', Number(e.target.value))}
                              onKeyDown={handleKeyDown}
                              className="w-full font-mono text-center border border-slate-200 p-1 text-[10px] rounded focus:ring-1 focus:ring-[#8B0000] focus:border-[#8B0000]"
                            />
                          </td>

                          {/* Real Trous chargés input */}
                          <td className="p-1 border-r border-slate-200 text-center w-20">
                            <input
                              type="number"
                              value={row.chargedHoles === undefined ? '' : row.chargedHoles}
                              onChange={e => updateMinageCell(postName, idx, 'chargedHoles', Number(e.target.value))}
                              onKeyDown={handleKeyDown}
                              placeholder="0"
                              className="w-full font-mono text-center border border-slate-200 p-1 text-[10px] rounded focus:ring-1 focus:ring-[#8B0000] focus:border-[#8B0000] font-bold"
                            />
                          </td>

                          {/* Real Trous vides display */}
                          <td className="p-1 border-r border-slate-200 text-center w-24 bg-slate-50/10 text-[10px] font-bold">
                            {(() => {
                              const realH = Number(row.realHoles) || 0;
                              const chargedH = Number(row.chargedHoles) || 0;
                              const emptyH = Math.max(0, realH - chargedH);
                              if (realH === 0) {
                                return <span className="text-slate-400 font-medium">-</span>;
                              }
                              if (emptyH > 0) {
                                return (
                                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-amber-50 text-amber-800 border border-amber-200">
                                    ⚠️ {emptyH} vides
                                  </span>
                                );
                              }
                              return (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
                                  ✓ Tous chargés
                                </span>
                              );
                            })()}
                          </td>

                          {/* Real Volées input */}
                          <td className="p-1 border-r border-slate-200 text-center w-14">
                            <input
                              type="number"
                              value={row.realRounds}
                              onChange={e => updateMinageCell(postName, idx, 'realRounds', Number(e.target.value))}
                              onKeyDown={handleKeyDown}
                              className="w-full font-mono text-center border border-slate-200 p-1 font-bold text-[10px] rounded focus:ring-1 focus:ring-[#8B0000] focus:border-[#8B0000]"
                            />
                          </td>

                          {/* Real Meterage input with color based on performance */}
                          <td className={`p-1 border-r border-slate-200 text-center w-18 transition-colors duration-200 ${valBg}`}>
                            <input
                              type="number"
                              step="0.1"
                              value={row.realMeterage === undefined ? row.meterage : row.realMeterage}
                              onChange={e => updateMinageCell(postName, idx, 'realMeterage', Number(e.target.value))}
                              onKeyDown={handleKeyDown}
                              className={`w-full font-mono text-center font-black select-all bg-transparent focus:outline-none focus:ring-0 ${valText} text-[10px]`}
                            />
                          </td>

                          {/* Real ANFO input */}
                          <td className="p-1 border-r border-slate-200 text-center w-14 bg-slate-50/10">
                            <input
                              type="number"
                              value={row.anfo === 0 || row.anfo === undefined ? '' : row.anfo}
                              placeholder="AN"
                              onChange={e => updateMinageCell(postName, idx, 'anfo', Number(e.target.value))}
                              onKeyDown={handleKeyDown}
                              className="w-full text-center font-mono border border-slate-200 p-1 text-[10px] rounded select-all font-bold focus:ring-1 focus:ring-[#8B0000]"
                              title="ANFO (kg)"
                            />
                          </td>

                          {/* Real TOVEX input */}
                          <td className="p-1 border-r border-slate-200 text-center w-14 bg-slate-50/10">
                            <input
                              type="number"
                              value={row.tovex === 0 || row.tovex === undefined ? '' : row.tovex}
                              placeholder="TV"
                              onChange={e => updateMinageCell(postName, idx, 'tovex', Number(e.target.value))}
                              onKeyDown={handleKeyDown}
                              className="w-full text-center font-mono border border-slate-200 p-1 text-[10px] rounded select-all font-bold focus:ring-1 focus:ring-[#8B0000]"
                              title="TOVEX (kg)"
                            />
                          </td>

                          {/* Real AMORCES input */}
                          <td className="p-1 border-r border-slate-350 text-center w-14 bg-slate-50/10">
                            <input
                              type="number"
                              value={row.ammorces === 0 || row.ammorces === undefined ? '' : row.ammorces}
                              placeholder="AM"
                              onChange={e => updateMinageCell(postName, idx, 'ammorces', Number(e.target.value))}
                              onKeyDown={handleKeyDown}
                              className="w-full text-center font-mono border border-slate-200 p-1 text-[10px] rounded select-all font-bold focus:ring-1 focus:ring-[#8B0000]"
                              title="Amorces"
                            />
                          </td>
                        </tr>
                      </React.Fragment>
                    );
                  })}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  const renderSectorCardsStub2 = (postName: string, sectorName: string, borderColorAccent: string, textColorAccent: string, stripBgAccent: string) => {
    const { minageRows, sectorChefs } = getPostState(postName);
    
    // Filter matching rows
    const rows = minageRows
      .map((row, idx) => ({ row, idx }))
      .filter(item => {
        const rowSec = (item.row.reel.sector || item.row.plan.sector || '').trim().toLowerCase();
        const targetSec = sectorName.trim().toLowerCase();
        if (targetSec === 'autres / non classés') {
          return !['imiter 2', 'imiter 1', 'imiter est'].includes(rowSec);
        }
        return rowSec === targetSec;
      });

    return (
      <div className="space-y-3">
        {/* Sector Control Band */}
        <div className={`p-3 bg-slate-100 rounded-lg border-l-4 ${borderColorAccent} flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs`}>
          <div className="flex items-center gap-3">
            <span className={`w-3 h-3 ${stripBgAccent} rounded-sm shrink-0`}></span>
            <span className={`${textColorAccent} text-sm font-black uppercase tracking-wider`}>
              Secteur : <strong>{sectorName}</strong>
            </span>
            {structureEditMode && (
              <button
                type="button"
                onClick={() => addMinageRowForSector(postName, sectorName)}
                className="bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-[9px] uppercase px-3 py-1.5 flex items-center gap-1 transition-all rounded shadow-sm cursor-pointer shrink-0"
              >
                <Plus className="w-3 h-3 text-[#00BFFF]" /> Ajouter Ligne
              </button>
            )}
          </div>

          {/* Encadrement de secteur */}
          <div className="flex items-center gap-3 flex-wrap bg-white p-1.5 rounded-md border border-slate-200/80 max-w-4xl">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-800 font-extrabold uppercase shrink-0">Chef de Secteur :</span>
              <div className="w-40 shrink-0">
                <EmployeeCell
                  matricule={(sectorChefs || {})[sectorName]?.chiefMatricule || ''}
                  name={(sectorChefs || {})[sectorName]?.chiefName || ''}
                  onChange={(mat, resName) => updateSectorChief(postName, sectorName, 'chief', mat, resName)}
                  employees={activeEmployees}
                  placeholder="Chef..."
                />
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-slate-500 font-bold uppercase shrink-0">Adjoint :</span>
              <div className="w-40 shrink-0">
                <EmployeeCell
                  matricule={(sectorChefs || {})[sectorName]?.secondChiefMatricule || ''}
                  name={(sectorChefs || {})[sectorName]?.secondChiefName || ''}
                  onChange={(mat, resName) => updateSectorChief(postName, sectorName, 'second', mat, resName)}
                  employees={activeEmployees}
                  placeholder="Adjoint..."
                />
              </div>
            </div>
          </div>
        </div>

        {/* Card Grid */}
        {rows.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {rows.map(({ row: rowWrapper, idx }) => {
              const row = rowWrapper.reel;
              const plan = rowWrapper.plan || {} as ExcelMinage;

              const minerMismatch = !!(row.minerMatricule && plan.minerMatricule && row.minerMatricule.trim().toUpperCase() !== plan.minerMatricule.trim().toUpperCase());
              const assistantMismatch = !!(row.assistantMatricule && plan.assistantMatricule && row.assistantMatricule.trim().toUpperCase() !== plan.assistantMatricule.trim().toUpperCase());
              const hasMismatch = minerMismatch || assistantMismatch;

              const realMeterageVal = row.realMeterage === undefined ? row.meterage : row.realMeterage;
              const rendement = row.realRounds > 0 ? (realMeterageVal / row.realRounds) : 0;
              const plannedMeterageVal = plan.meterage || 0;
              const diffMeteragePct = plannedMeterageVal > 0 ? ((realMeterageVal - plannedMeterageVal) / plannedMeterageVal) * 100 : 0;

              const chantierObj = chantiers.find(c => c.id === row.chantierId);
              const plannedTotalMeterage = chantierObj?.plannedTotalMeterage || 100;
              const currentMeterage = chantierObj?.currentMeterage || 0;
              const progressPct = plannedTotalMeterage > 0 ? Math.min(100, (currentMeterage / plannedTotalMeterage) * 100) : 0;

              return (
                <div 
                  key={idx} 
                  data-card-container="true"
                  className="bg-white border border-slate-300 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow relative space-y-3 flex flex-col justify-between"
                >
                  <div>
                    {/* Header: Nom Chantier, Badge Secteur, Gallery size badge, Progress Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 border-b border-slate-100 pb-2">
                      <div className="space-y-1 select-none">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase font-black px-1.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded">
                            #{idx + 1}
                          </span>
                          <select
                            value={row.chantierId}
                            onChange={e => updateMinageCell(postName, idx, 'chantierId', e.target.value)}
                            className="text-xs font-black uppercase text-slate-850 border-b border-dashed border-slate-300 focus:border-[#8B0000] focus:ring-0 outline-none pr-6 bg-transparent cursor-pointer"
                          >
                            <option value="">(Choisir Chantier)</option>
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
                        </div>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          <span className="inline-block text-[8px] font-black uppercase tracking-wider text-[#8B0000] bg-red-50 border border-red-200/50 px-1.5 py-0.5 rounded">
                            {sectorName}
                          </span>
                          <span className="inline-block text-[8px] font-black uppercase tracking-wider text-teal-850 bg-teal-50 border border-teal-200/50 px-1.5 py-0.5 rounded">
                            Section: {row.gallerySize || 12} m²
                          </span>
                          {hasMismatch && (
                            <span className="inline-block text-[8px] font-black uppercase tracking-wider text-amber-900 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded animate-pulse" title="Mineur ou Assistant réel ≠ Planifié">
                              ⚠️ Équipe ≠ Plan
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Header Actions */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => copyMinagePlanToReel(postName, idx)}
                          className="px-2 py-1 text-[9px] font-black uppercase bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-200 rounded tracking-wider cursor-pointer transition-all inline-flex items-center gap-1 shadow-sm select-none"
                          title="Copier les valeurs de planification de ce chantier vers le réel"
                        >
                          <Copy className="w-2.5 h-2.5 text-amber-600" /> Copier
                        </button>
                        {structureEditMode && (
                          <button
                            type="button"
                            onClick={() => deleteMinageRow(postName, idx)}
                            className="p-1 text-slate-400 hover:text-red-600 transition-colors cursor-pointer select-none"
                            title="Supprimer ce chantier"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Progress gauge */}
                    <div className="w-full space-y-1 py-1 border-b border-slate-100">
                      <div className="flex justify-between items-center text-[9px] font-black uppercase text-slate-500">
                        <span>Progression Chantier</span>
                        <span className="font-mono">{currentMeterage.toFixed(1)} / {plannedTotalMeterage.toFixed(1)} m ({progressPct.toFixed(0)}%)</span>
                      </div>
                      <div className="w-full bg-slate-150 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-[#00BFFF] h-full transition-all duration-300" style={{ width: `${progressPct}%` }}></div>
                      </div>
                    </div>

                    {/* Mini-table content wrapper */}
                    <div className="overflow-x-auto mt-2">
                      <table className="w-full text-left border-collapse border border-slate-200 text-[10px]">
                        <thead>
                          <tr className="bg-slate-50 text-[8px] font-black uppercase tracking-wider text-slate-500 border-b border-slate-200">
                            <th className="p-1 px-1.5 border-r border-slate-200 w-14 text-center">Type</th>
                            <th className="p-1 px-1.5 border-r border-slate-200">Mineur</th>
                            <th className="p-1 px-1.5 border-r border-slate-200">Assistant</th>
                            <th className="p-1 px-1.5 border-r border-slate-200 text-center w-12">Sect</th>
                            <th className="p-1 px-1.5 border-r border-slate-200 text-center w-12">Trous</th>
                            <th className="p-1 px-1.5 border-r border-slate-200 text-center w-12">Vol</th>
                            <th className="p-1 px-1.5 border-r border-slate-200 text-center w-14 text-red-900">Métrage</th>
                            <th className="p-1 px-1.5 text-center">ANFO/TOV/Am</th>
                          </tr>
                        </thead>
                        <tbody>
                          {/* Plan Row */}
                          <tr className="bg-slate-105 text-slate-500 font-bold border-b border-slate-200">
                            <td className="p-1.5 border-r border-slate-200 text-[8px] font-black uppercase text-center bg-slate-150 flex items-center justify-center gap-1 select-none">
                              <Lock className="w-2.5 h-2.5 text-slate-400" /> Plan
                            </td>
                            <td className="p-1 px-1.5 border-r border-slate-200 font-mono text-[9px]">{plan.minerMatricule || '(Aucun)'}</td>
                            <td className="p-1 px-[9.5px] border-r border-slate-200 font-mono text-[9px]">{plan.assistantMatricule || '(Aucun)'}</td>
                            <td className="p-1 border-r border-slate-200 text-center font-mono">{plan.gallerySize || 12}m²</td>
                            <td className="p-1 border-r border-slate-200 text-center font-mono">{plan.plannedHoles || 32}</td>
                            <td className="p-1 border-r border-slate-200 text-center font-mono">{plan.plannedRounds || 1}</td>
                            <td className="p-1 border-r border-slate-200 text-center font-mono text-red-900">{plan.meterage?.toFixed(1) || '0.0'}m</td>
                            <td className="p-1 text-center font-mono text-[9px]">
                              <div className="flex items-center gap-0.5 justify-center">
                                <span className="w-8 text-[9px] text-center font-mono bg-slate-100 p-0.5 rounded-sm font-bold text-slate-600" title={`Planifié ANFO: ${plan.anfo || 0} kg`}>
                                  {plan.anfo || 0}
                                </span>
                                <span className="w-8 text-[9px] text-center font-mono bg-slate-100 p-0.5 rounded-sm font-bold text-slate-600" title={`Planifié TOVEX: ${plan.tovex || 0} kg`}>
                                  {plan.tovex || 0}
                                </span>
                                <span className="w-8 text-[9px] text-center font-mono bg-slate-100 p-0.5 rounded-sm font-bold text-slate-600" title={`Planifié Amorces: ${plan.ammorces || 0}`}>
                                  {plan.ammorces || 0}
                                </span>
                              </div>
                            </td>
                          </tr>
                          {/* Real Row */}
                          <tr className="bg-white text-slate-900 font-bold">
                            <td className="p-1 border-r border-slate-200 text-[8px] font-black uppercase text-center bg-slate-50/50 flex items-center justify-center gap-1 select-none">
                              <Pencil className="w-2.5 h-2.5 text-red-700" /> Réel
                            </td>
                            <td className="p-1 border-r border-slate-200">
                              <EmployeeCell
                                matricule={row.minerMatricule}
                                name={row.minerName}
                                onChange={(mat) => updateMinageCell(postName, idx, 'minerMatricule', mat)}
                                employees={activeEmployees}
                                placeholder="Mineur..."
                                hideNameLabel={true}
                                onKeyDown={handleKeyDown}
                              />
                              {minerMismatch && (
                                <div className="text-[7.5px] font-black uppercase text-amber-700 leading-none mt-0.5 select-none" title={`Planifié : ${plan.minerMatricule}`}>
                                  ⚠️ ≠ Plan ({plan.minerMatricule})
                                </div>
                              )}
                            </td>
                            <td className="p-1 border-r border-slate-200">
                              <EmployeeCell
                                matricule={row.assistantMatricule}
                                name={row.assistantName}
                                onChange={(mat) => updateMinageCell(postName, idx, 'assistantMatricule', mat)}
                                employees={activeEmployees}
                                placeholder="Assistant..."
                                hideNameLabel={true}
                                onKeyDown={handleKeyDown}
                              />
                              {assistantMismatch && (
                                <div className="text-[7.5px] font-black uppercase text-amber-700 leading-none mt-0.5 select-none" title={`Planifié : ${plan.assistantMatricule}`}>
                                  ⚠️ ≠ Plan ({plan.assistantMatricule})
                                </div>
                              )}
                            </td>
                            <td className="p-1 border-r border-slate-200 text-center">
                              <select
                                value={row.gallerySize}
                                onChange={e => updateMinageCell(postName, idx, 'gallerySize', Number(e.target.value))}
                                onKeyDown={handleKeyDown}
                                className="border border-slate-200 p-0.5 text-center font-bold font-mono bg-transparent"
                              >
                                <option value={9}>9</option>
                                <option value={12}>12</option>
                              </select>
                            </td>
                            <td className="p-1 border-r border-slate-200 text-center">
                              <input
                                type="number"
                                value={row.realHoles}
                                onChange={e => updateMinageCell(postName, idx, 'realHoles', Number(e.target.value))}
                                onKeyDown={handleKeyDown}
                                className="w-full font-mono text-center border border-slate-200 p-0.5"
                              />
                            </td>
                            <td className="p-1 border-r border-slate-200 text-center">
                              <input
                                type="number"
                                value={row.realRounds}
                                onChange={e => updateMinageCell(postName, idx, 'realRounds', Number(e.target.value))}
                                onKeyDown={handleKeyDown}
                                className="w-full font-mono text-center border border-slate-200 p-0.5 font-bold"
                              />
                            </td>
                            {(() => {
                              const rMet = row.realMeterage === undefined ? row.meterage : row.realMeterage;
                              
                              // Compute Performance Color based directly on the cell's real meterage
                              const colorMeterage = rMet;

                              let valBg = "bg-teal-50/30";
                              let valText = "text-teal-950";
                              if (colorMeterage !== undefined && colorMeterage !== null && colorMeterage !== 0) {
                                if (colorMeterage >= 1.5) {
                                  valBg = "bg-emerald-100 border-emerald-300";
                                  valText = "text-emerald-900";
                                } else if (colorMeterage >= 1.4 && colorMeterage < 1.5) {
                                  valBg = "bg-amber-100 border-amber-300";
                                  valText = "text-amber-900";
                                } else if (colorMeterage < 1.4) {
                                  valBg = "bg-rose-100 border-rose-300";
                                  valText = "text-rose-900";
                                }
                              }
                              return (
                                <td className={`p-1 border-r border-slate-200 text-center transition-colors duration-200 ${valBg}`}>
                                  <input
                                    type="number"
                                    step="0.1"
                                    value={row.realMeterage === undefined ? row.meterage : row.realMeterage}
                                    onChange={e => updateMinageCell(postName, idx, 'realMeterage', Number(e.target.value))}
                                    onKeyDown={handleKeyDown}
                                    className={`w-full font-mono text-center font-black select-all bg-transparent focus:outline-none focus:ring-0 ${valText}`}
                                  />
                                </td>
                              );
                            })()}
                            <td className="p-1 text-center font-mono">
                              <div className="flex items-center gap-0.5 justify-center">
                                <input
                                  type="number"
                                  value={row.anfo === 0 || row.anfo === undefined ? '' : row.anfo}
                                  placeholder="AN"
                                  onChange={e => updateMinageCell(postName, idx, 'anfo', Number(e.target.value))}
                                  onKeyDown={handleKeyDown}
                                  className="w-8 text-[9px] text-center font-mono border border-slate-200 p-0.5 rounded-sm select-all font-bold"
                                  title="ANFO (kg)"
                                />
                                <input
                                  type="number"
                                  value={row.tovex === 0 || row.tovex === undefined ? '' : row.tovex}
                                  placeholder="TV"
                                  onChange={e => updateMinageCell(postName, idx, 'tovex', Number(e.target.value))}
                                  onKeyDown={handleKeyDown}
                                  className="w-8 text-[9px] text-center font-mono border border-slate-200 p-0.5 rounded-sm select-all font-bold"
                                  title="TOVEX (kg)"
                                />
                                <input
                                  type="number"
                                  value={row.ammorces === 0 || row.ammorces === undefined ? '' : row.ammorces}
                                  placeholder="AM"
                                  onChange={e => updateMinageCell(postName, idx, 'ammorces', Number(e.target.value))}
                                  onKeyDown={handleKeyDown}
                                  className="w-8 text-[9px] text-center font-mono border border-slate-200 p-0.5 rounded-sm select-all font-bold"
                                  title="Amorces"
                                />
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Deviations / Calculations and short text metrics */}
                  <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-[10px] text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
                      <span>Rendement : <strong className="text-slate-800 text-xs">{rendement.toFixed(2)} m/volée</strong></span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-teal-600" />
                      <span>Écart Métrage : <strong className={diffMeteragePct === 0 ? "text-slate-600" : diffMeteragePct > 0 ? "text-emerald-700 bg-emerald-50 px-1 rounded font-bold" : "text-rose-700 bg-rose-50 px-1 rounded font-bold"}>
                        {diffMeteragePct > 0 ? '+' : ''}{diffMeteragePct.toFixed(1)}% vs. Obj
                      </strong></span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-[10px] text-slate-400 font-bold italic p-3 bg-slate-50 rounded border border-dashed border-slate-200/60 font-black uppercase tracking-wider text-center">
            Aucun chantier pour ce secteur.
          </div>
        )}
      </div>
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
        rowId: `deblayage_add_${Math.random().toString(36).substr(2, 9)}`,
        plan: createEmptyDeblayage(sector, start, end),
        reel: createEmptyDeblayage(sector, start, end)
      }
    ]);
  };

  const renderDeblayageSectorCards = (postName: string, sectorName: string, borderColorAccent: string, textColorAccent: string, stripBgAccent: string) => {
    const { deblayageRows } = getPostState(postName);
    
    // Filter rows belonging to the sectorName
    const rows = deblayageRows
      .map((row, idx) => ({ row, idx }))
      .filter(item => {
        const rowSec = (item.row.reel.sector || item.row.plan.sector || '').trim().toLowerCase();
        const targetSec = sectorName.trim().toLowerCase();
        return rowSec === targetSec;
      });

    return (
      <div className="space-y-3">
        {/* Sector Control Band */}
        <div className={`p-3 bg-slate-100 rounded-lg border-l-4 ${borderColorAccent} flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs`}>
          <div className="flex items-center gap-3">
            <span className={`w-3 h-3 ${stripBgAccent} rounded-sm shrink-0`}></span>
            <span className={`${textColorAccent} text-sm font-black uppercase tracking-wider`}>
              Secteur : <strong>{sectorName}</strong>
            </span>
            {structureEditMode && (
              <button
                type="button"
                onClick={() => addDeblayageRowForSector(postName, sectorName)}
                className="bg-slate-800 hover:bg-slate-900 text-white font-extrabold text-[9px] uppercase px-3 py-1 flex items-center gap-1 transition-all rounded shadow-sm cursor-pointer shrink-0"
              >
                <Plus className="w-3 h-3 text-[#00BFFF]" /> Ajouter Ligne
              </button>
            )}
          </div>
        </div>

        {/* Card Grid */}
        {rows.length > 0 ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {rows.map(({ row: rowWrapper, idx }) => {
              const row = rowWrapper.reel;
              const plan = rowWrapper.plan || {} as ExcelDeblayage;
              const driverValName = getEmployeeName(row.driverMatricule);

              const driverMismatch = !!(row.driverMatricule && plan.driverMatricule && row.driverMatricule.trim().toUpperCase() !== plan.driverMatricule.trim().toUpperCase());
              const realEngine = (row.engineId || row.engineCode || '').trim().toUpperCase();
              const planEngine = (plan.engineId || plan.engineCode || '').trim().toUpperCase();
              const engineMismatch = !!(realEngine && planEngine && realEngine !== planEngine);
              const hasMismatch = driverMismatch || engineMismatch;

              const targetVol = plan.volumeEstimated || 0;
              const realVol = row.volumeEstimated || 0;
              const diffVolAbs = realVol - targetVol;
              const diffVolPct = targetVol > 0 ? (diffVolAbs / targetVol) * 100 : 0;

              const gasoil = row.gasoil || 0;
              const godets = row.godets || 0;
              const ratioGasoilGodet = godets > 0 ? (gasoil / godets) : 0;

              const chantierObj = chantiers.find(c => c.id === row.chantierId);
              const plannedTotalMeterage = chantierObj?.plannedTotalMeterage || 100;
              const currentMeterage = chantierObj?.currentMeterage || 0;
              const progressPct = plannedTotalMeterage > 0 ? Math.min(100, (currentMeterage / plannedTotalMeterage) * 100) : 0;

              return (
                <div 
                  key={idx} 
                  data-card-container="true"
                  className="bg-white border border-slate-300 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow relative space-y-3 flex flex-col justify-between"
                >
                  <div>
                    {/* Header: Nom Chantier, Badge Secteur, Gallery size badge, Progress Bar */}
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 border-b border-slate-100 pb-2">
                      <div className="space-y-1 select-none">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] uppercase font-black px-1.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded">
                            #{idx + 1}
                          </span>
                          <select
                            value={row.chantierId}
                            onChange={e => updateDeblayageCell(postName, idx, 'chantierId', e.target.value)}
                            className="text-xs font-black uppercase text-slate-850 border-b border-dashed border-slate-300 focus:border-[#8B0000] focus:ring-0 outline-none pr-6 bg-transparent cursor-pointer"
                          >
                            <option value="">(Choisir Chantier)</option>
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
                        </div>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          <span className="inline-block text-[8px] font-black uppercase tracking-wider text-[#00BFFF] bg-sky-50 border border-sky-250 px-1.5 py-0.5 rounded">
                            {sectorName}
                          </span>
                          {chantierObj?.galleryType && (
                            <span className="inline-block text-[8px] font-black uppercase tracking-wider text-teal-850 bg-teal-50 border border-teal-200/50 px-1.5 py-0.5 rounded">
                              Section: {chantierObj.galleryType === '9m2' ? '9m²' : '12m²'}
                            </span>
                          )}
                          {hasMismatch && (
                            <span className="inline-block text-[8px] font-black uppercase tracking-wider text-amber-900 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded animate-pulse" title="Conducteur ou engin différent du plan">
                              ⚠️ Équipe/Engin ≠ Plan
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Header Actions */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => copyDeblayagePlanToReel(postName, idx)}
                          className="px-2 py-1 text-[9px] font-black uppercase bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-200 rounded tracking-wider cursor-pointer transition-all inline-flex items-center gap-1 shadow-sm select-none"
                          title="Copier les valeurs de planification de ce chantier vers le réel"
                        >
                          <Copy className="w-2.5 h-2.5 text-amber-600" /> Copier
                        </button>
                        {structureEditMode && (
                          <button
                            type="button"
                            onClick={() => deleteDeblayageRow(postName, idx)}
                            className="p-1 text-slate-400 hover:text-red-600 transition-colors cursor-pointer select-none"
                            title="Supprimer ce chantier"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Progress gauge */}
                    <div className="w-full space-y-1 py-1 border-b border-slate-100">
                      <div className="flex justify-between items-center text-[9px] font-black uppercase text-slate-500">
                        <span>Progression Chantier</span>
                        <span className="font-mono">{currentMeterage.toFixed(1)} / {plannedTotalMeterage.toFixed(1)} m ({progressPct.toFixed(0)}%)</span>
                      </div>
                      <div className="w-full bg-slate-150 h-1.5 rounded-full overflow-hidden">
                        <div className="bg-[#00BFFF] h-full transition-all duration-300" style={{ width: `${progressPct}%` }}></div>
                      </div>
                    </div>

                    {/* Mini-table content wrapper */}
                    <div className="overflow-x-auto mt-2">
                      <table className="w-full text-left border-collapse border border-slate-200 text-[10px]">
                        <thead>
                          <tr className="bg-slate-50 text-[8px] font-black uppercase tracking-wider text-slate-500 border-b border-slate-200">
                            <th className="p-1 px-1.5 border-r border-slate-200 w-14 text-center">Type</th>
                            <th className="p-1 px-1.5 border-r border-slate-200">Conducteur</th>
                            <th className="p-1 px-1.5 border-r border-slate-200">Engin Assigné</th>
                            <th className="p-1 px-1.5 border-r border-slate-200 text-center w-12 font-black">Godets</th>
                            <th className="p-1 px-1.5 border-r border-slate-200 text-center w-14">Vol (m³)</th>
                            <th className="p-1 px-1.5 border-r border-slate-200 text-center w-24">Heures / Horaires</th>
                            <th className="p-1 px-1.5 border-r border-slate-200 text-center w-14">Durée</th>
                            <th className="p-1 px-1.5 border-r border-slate-200 text-center w-12">Norme</th>
                            <th className="p-1 px-1.5 border-r border-slate-200 text-center w-24">Écart</th>
                            <th className="p-1 px-1.5 border-r border-slate-200 text-center w-12 text-blue-900 bg-blue-50/20 font-bold">Gasoil</th>
                            <th className="p-1 px-1.5 border-r border-slate-200 text-center">Lubrifiant 1</th>
                            <th className="p-1 px-1.5 text-center">Lubrifiant 2</th>
                          </tr>
                        </thead>
                        <tbody>
                          {/* Plan Row */}
                          <tr className="bg-slate-105 text-slate-500 font-bold border-b border-slate-200">
                            <td className="p-1.5 border-r border-slate-200 text-[8px] font-black uppercase text-center bg-slate-150 flex items-center justify-center gap-1 select-none">
                              <Lock className="w-2.5 h-2.5 text-slate-400" /> Plan
                            </td>
                            <td className="p-1 px-1.5 border-r border-slate-200 font-mono text-[9px]" colSpan={2}>
                              {plan.driverMatricule ? `${plan.driverMatricule} - ${plan.driverName || ''}` : '(Aucun)'} 
                              {plan.engineId || plan.engineCode ? ` [${plan.engineId || plan.engineCode}]` : ''}
                            </td>
                            <td className="p-1 border-r border-slate-200 text-center font-mono">{plan.godets || 0}</td>
                            <td className="p-1 border-r border-slate-200 text-center font-mono font-bold">{(plan.volumeEstimated || 0).toFixed(1)} m³</td>
                            <td className="p-1 border-r border-slate-200 text-center font-mono">{(plan.hoursWorked || 6).toFixed(1)}h prév.</td>
                            <td className="p-1 border-r border-slate-200 text-center font-mono text-slate-400 select-none bg-slate-100/30">-</td>
                            <td className="p-1 border-r border-slate-200 text-center font-mono text-slate-400 select-none bg-slate-100/30">-</td>
                            <td className="p-1 border-r border-slate-200 text-center font-mono text-slate-400 select-none bg-slate-100/30">-</td>
                            <td className="p-1 border-r border-slate-200 text-center font-mono">-</td>
                            <td className="p-1 border-r border-slate-200 text-center font-mono">-</td>
                            <td className="p-1 text-center font-mono">-</td>
                          </tr>
                          {/* Real Row */}
                          <tr className="bg-white text-slate-900 font-bold">
                            <td className="p-1 border-r border-slate-200 text-[8px] font-black uppercase text-center bg-slate-50/50 flex items-center justify-center gap-1 select-none">
                              <Pencil className="w-2.5 h-2.5 text-red-700" /> Réel
                            </td>
                            <td className="p-1 border-r border-slate-200">
                              <EmployeeCell
                                matricule={row.driverMatricule}
                                name={row.driverName}
                                onChange={(mat) => updateDeblayageCell(postName, idx, 'driverMatricule', mat)}
                                employees={activeEmployees}
                                placeholder="Cond..."
                                hideNameLabel={true}
                                onKeyDown={handleKeyDown}
                              />
                              {driverMismatch && (
                                <div className="text-[7.5px] font-black uppercase text-amber-700 leading-none mt-0.5 select-none" title={`Planifié : ${plan.driverMatricule}`}>
                                  ⚠️ ≠ Plan ({plan.driverMatricule})
                                </div>
                              )}
                            </td>
                            <td className="p-1 border-r border-slate-200">
                              <select
                                value={row.engineId || row.engineCode || ''}
                                onChange={e => updateDeblayageCell(postName, idx, 'engineId', e.target.value)}
                                onKeyDown={handleKeyDown}
                                className="w-full border border-slate-200 p-0.5 font-mono text-[10px] font-bold"
                              >
                                <option value="">-- LHD --</option>
                                {platformSettings.engines.map(eng => <option key={eng} value={eng}>{eng}</option>)}
                              </select>
                              {engineMismatch && (
                                <div className="text-[7.5px] font-black uppercase text-amber-700 leading-none mt-0.5 select-none">
                                  ⚠️ ≠ Plan ({plan.engineId || plan.engineCode || ''})
                                </div>
                              )}
                            </td>
                            <td className="p-1 border-r border-slate-200 text-center">
                              <input
                                type="number"
                                value={row.godets === 0 || row.godets === undefined ? '' : row.godets}
                                placeholder="0"
                                onChange={e => updateDeblayageCell(postName, idx, 'godets', Number(e.target.value))}
                                onKeyDown={handleKeyDown}
                                className="w-full text-center bg-transparent border border-dashed border-slate-300 outline-none select-all font-black text-[11px]"
                              />
                            </td>
                            <td className="p-1 border-r border-slate-200 text-center font-bold font-mono text-emerald-800 bg-slate-50/10">
                              {row.volumeEstimated.toFixed(1)}
                            </td>
                            <td className="p-1 border-r border-slate-200 text-center">
                              <div className="flex items-center gap-0.5 justify-center">
                                {renderTimeSelect(row.startTime || '', (val) => updateDeblayageCell(postName, idx, 'startTime', val))}
                                <span className="text-[9px] text-slate-400 font-bold select-none">→</span>
                                {renderTimeSelect(row.endTime || '', (val) => updateDeblayageCell(postName, idx, 'endTime', val))}
                              </div>
                            </td>
                            {/* Real Durée display (non-editable, calculated) */}
                            <td className="p-1 border-r border-slate-200 text-center font-mono text-[10px] bg-slate-50/50">
                              {(() => {
                                const dur = calculateDuration(row.startTime || '', row.endTime || '');
                                return dur > 0 ? `${dur.toFixed(1)}h` : '-';
                              })()}
                            </td>

                            {/* Real Norme display (non-editable, fixed) */}
                            <td className="p-1 border-r border-slate-200 text-center font-mono text-[10px] text-slate-400 bg-slate-50/50">
                              6.0h
                            </td>

                            {/* Real Écart display (non-editable, calculated badge) */}
                            <td className="p-1 border-r border-slate-200 text-center font-mono text-[10px] bg-slate-50/50 min-w-[120px]">
                              {(() => {
                                const dur = calculateDuration(row.startTime || '', row.endTime || '');
                                if (dur <= 0) return <span className="text-slate-400 font-medium">-</span>;
                                const gap = dur - 6.0;
                                
                                if (gap > 0) {
                                  return (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-rose-50 text-rose-850 border border-rose-200">
                                      ⚠️ +{gap.toFixed(1)}h dépassement
                                    </span>
                                  );
                                } else if (gap === 0) {
                                  return (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-50 text-emerald-850 border border-emerald-200">
                                      ✓ Conforme
                                    </span>
                                  );
                                } else {
                                  return (
                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase bg-sky-50 text-sky-850 border border-sky-200">
                                      ✓ {gap.toFixed(1)}h
                                    </span>
                                  );
                                }
                              })()}
                            </td>
                            <td className="p-1 border-r border-slate-200 text-center bg-blue-50/20">
                              <input
                                type="number"
                                placeholder="0"
                                value={row.gasoil === 0 || row.gasoil === undefined ? '' : row.gasoil}
                                onChange={e => updateDeblayageCell(postName, idx, 'gasoil', Number(e.target.value))}
                                onKeyDown={handleKeyDown}
                                className="w-12 font-mono font-black text-center text-blue-950 border border-slate-200 p-0.5 rounded-sm select-all"
                              />
                            </td>
                            <td className="p-1 border-r border-slate-200">
                              <div className="flex flex-col gap-0.5 min-w-[70px]">
                                <select
                                  value={row.lubrifiant1 || ''}
                                  onChange={e => updateDeblayageCell(postName, idx, 'lubrifiant1', e.target.value)}
                                  onKeyDown={handleKeyDown}
                                  className="w-full border border-slate-200 p-0.5 text-[9px]"
                                >
                                  <option value="">-- Aucun --</option>
                                  {platformSettings.oils.map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                                <input
                                  type="number"
                                  placeholder="0 L"
                                  value={row.lubrifiant1Qty === 0 || row.lubrifiant1Qty === undefined ? '' : row.lubrifiant1Qty}
                                  onChange={e => updateDeblayageCell(postName, idx, 'lubrifiant1Qty', Number(e.target.value))}
                                  onKeyDown={handleKeyDown}
                                  className="w-full text-center font-mono text-[9px] border border-slate-200 p-0.5"
                                />
                              </div>
                            </td>
                            <td className="p-1">
                              <div className="flex flex-col gap-0.5 min-w-[70px]">
                                <select
                                  value={row.lubrifiant2 || ''}
                                  onChange={e => updateDeblayageCell(postName, idx, 'lubrifiant2', e.target.value)}
                                  onKeyDown={handleKeyDown}
                                  className="w-full border border-slate-200 p-0.5 text-[9px]"
                                >
                                  <option value="">-- Aucun --</option>
                                  {platformSettings.oils.map(o => <option key={o} value={o}>{o}</option>)}
                                </select>
                                <input
                                  type="number"
                                  placeholder="0 L"
                                  value={row.lubrifiant2Qty === 0 || row.lubrifiant2Qty === undefined ? '' : row.lubrifiant2Qty}
                                  onChange={e => updateDeblayageCell(postName, idx, 'lubrifiant2Qty', Number(e.target.value))}
                                  onKeyDown={handleKeyDown}
                                  className="w-full text-center font-mono text-[9px] border border-slate-200 p-0.5"
                                />
                              </div>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>

                    {/* Fait de rotation - remarks inline */}
                    <div className="mt-2 bg-slate-50/50 p-1.5 rounded border border-slate-150 flex items-center gap-1">
                      <span className="text-[8px] font-black uppercase text-slate-500 select-none">Remarques :</span>
                      <input
                        type="text"
                        value={row.remarks || ''}
                        placeholder="Fait de rotation..."
                        onChange={e => updateDeblayageCell(postName, idx, 'remarks', e.target.value)}
                        onKeyDown={handleKeyDown}
                        className="flex-1 bg-transparent border-none outline-none text-[10px] p-0 font-medium text-slate-800"
                      />
                    </div>
                  </div>

                  {/* Calculations and Deviations */}
                  <div className="pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-[10px] text-slate-600">
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-blue-500" />
                      <span>Écart Vol. vs Obj : <strong className={diffVolAbs === 0 ? "text-slate-600" : diffVolAbs > 0 ? "text-emerald-700 bg-emerald-50 px-1 rounded font-bold" : "text-rose-700 bg-rose-50 px-1 rounded font-bold"}>
                        {diffVolAbs > 0 ? '+' : ''}{diffVolAbs.toFixed(1)} m³ ({diffVolPct > 0 ? '+' : ''}{diffVolPct.toFixed(1)}%)
                      </strong></span>
                    </div>

                    <div className="flex items-center gap-1.5 font-mono">
                      <Gauge className="w-3.5 h-3.5 text-amber-600" />
                      <span>Ratio G/G : <strong className="text-slate-800 font-bold">{ratioGasoilGodet.toFixed(2)} L/godet</strong></span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-[10px] text-slate-400 font-bold italic p-3 bg-slate-50 rounded border border-dashed border-slate-200/60 font-black uppercase tracking-wider text-center">
            Aucun engin de déblayage pour ce secteur.
          </div>
        )}
      </div>
    );
  };

  const unfilledPlannings = allPlanningSheets
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
        id: planDate,
        planDate,
        expectedProdDate,
        exists: prodExists,
        planData: plan
      };
    })
    .filter((item): item is { id: string; planDate: string; expectedProdDate: string; exists: boolean; planData: any } => item !== null && !item.exists)
    .sort((a, b) => b.expectedProdDate.localeCompare(a.expectedProdDate));

  const formatFrenchDate = (dateStr: string) => {
    try {
      const [year, month, day] = dateStr.split('-');
      const months = [
        'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
        'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
      ];
      return `${parseInt(day, 10)} ${months[parseInt(month, 10) - 1]}`;
    } catch (e) {
      return dateStr;
    }
  };

  const anomalies = calculateAnomalies();

  const currentDocStatus = allProductionDocs.find(doc => doc.id === selectedDate)?.status;
  const isReadOnly = isMonthClosed || currentDocStatus === 'scelle';
  const canUnseal = profile && ['admin', 'direction'].includes(profile.role);

  return (
    <div className="space-y-4 font-sans select-none pb-12">
      {/* Custom Non-blocking Dialog Overlays */}
      <AnimatePresence>
        {confirmModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="custom-confirm-modal">
            <div className="bg-white border-t-4 border-[#8B0000] rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
              <button 
                type="button"
                onClick={() => {
                  if (confirmModal.onCancel) confirmModal.onCancel();
                  setConfirmModal(null);
                }}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0">
                  <AlertTriangle className="w-6 h-6 text-[#8B0000]" />
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase text-slate-900 tracking-wider mb-2">
                    {confirmModal.title}
                  </h3>
                  <p className="text-[11px] text-slate-800 font-bold leading-relaxed whitespace-pre-line">
                    {confirmModal.message}
                  </p>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    if (confirmModal.onCancel) confirmModal.onCancel();
                    setConfirmModal(null);
                  }}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-black uppercase text-[10px] tracking-wider rounded-lg transition-all cursor-pointer border border-slate-200"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={() => {
                    confirmModal.onConfirm();
                    setConfirmModal(null);
                  }}
                  className="px-4 py-2 bg-[#8B0000] hover:bg-red-800 text-white font-black uppercase text-[10px] tracking-wider rounded-lg transition-all cursor-pointer shadow-md shadow-red-900/10"
                >
                  Confirmer
                </button>
              </div>
            </div>
          </div>
        )}

        {infoModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" id="custom-info-modal">
            <div className={`bg-white border-t-4 ${infoModal.type === 'error' ? 'border-rose-600' : 'border-sky-500'} rounded-2xl max-w-md w-full p-6 shadow-2xl relative`}>
              <button 
                type="button"
                onClick={() => setInfoModal(null)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-full ${infoModal.type === 'error' ? 'bg-rose-50' : 'bg-sky-50'} flex items-center justify-center shrink-0`}>
                  {infoModal.type === 'error' ? (
                    <AlertTriangle className="w-6 h-6 text-rose-600" />
                  ) : (
                    <Info className="w-6 h-6 text-sky-600" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase text-slate-900 tracking-wider mb-2">
                    {infoModal.title}
                  </h3>
                  <p className="text-[11px] text-slate-800 font-bold leading-relaxed whitespace-pre-line">
                    {infoModal.message}
                  </p>
                </div>
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  onClick={() => setInfoModal(null)}
                  className={`px-4 py-2 ${infoModal.type === 'error' ? 'bg-rose-600 hover:bg-rose-700' : 'bg-slate-800 hover:bg-slate-900'} text-white font-black uppercase text-[10px] tracking-wider rounded-lg transition-all cursor-pointer shadow-md`}
                >
                  Entendu
                </button>
              </div>
            </div>
          </div>
        )}
      </AnimatePresence>

      {isMonthClosed && (
        <div className="font-sans py-2.5 px-4 bg-red-600 text-white font-extrabold uppercase rounded-xl text-center text-xs tracking-wider flex items-center justify-center gap-2 shadow-md animate-pulse">
          ⛔ Mois de {selectedDate.substring(0, 7)} Clôturé — Modification Impossible
        </div>
      )}
      
      {/* Unified Elegant Header Banner with Enlarged Logo and Centered Title - Style MATCHING Planning.tsx */}
      <div 
        id="unified-production-banner" 
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

          {/* Centered Column: Header Title on One Line, Subtitle, Date selectors */}
          <div className="flex-1 flex flex-col justify-center items-center text-center space-y-3.5 max-w-2xl px-2">
            {/* Upper Decorative Gold Line */}
            <div className="subtle-glow-line w-full opacity-80" />
            
            {/* Premium Gold Shimmer Title - Sized precisely to cover one line */}
            <h1 className="gold-title my-1 select-none text-[15px] sm:text-lg md:text-[20px] lg:text-[22px] tracking-[0.06em] whitespace-normal sm:whitespace-nowrap leading-none">
              REGISTRE JOURNALIER — SUIVI DU RÉEL
            </h1>
            
            {/* Lower Decorative Gold Line */}
            <div className="subtle-glow-line w-full opacity-80" />

            {/* Elegant Subtitle with precise spacing */}
            <p 
              className="uppercase tracking-[0.2em] my-1.5 block text-[9px] md:text-[10px] font-extrabold"
              style={{ color: '#64748b', letterSpacing: '0.2em' }}
            >
              Rapport Journalier d'Exploitation • Validation physique et suivi de l'avancement d'exploitation
            </p>

            {/* Date selection and state badges */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-1.5">
              <div className="inline-flex items-center gap-2 bg-amber-50/60 border border-amber-100/80 px-3 py-1.5 rounded-xl shadow-xs">
                <span className="text-[10px] font-black uppercase text-[#b8860b] tracking-wider">
                  📅 Registre du :
                </span>
                <input 
                  type="date"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="bg-white hover:bg-amber-50/30 text-slate-950 font-extrabold text-[12px] uppercase border border-amber-200 rounded-lg px-2.5 py-1 outline-none focus:ring-1 focus:ring-[#b8860b]/30 cursor-pointer transition-colors"
                />
              </div>

              {noPlanFound ? (
                <div id="no-plan-found-badge" className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-amber-800 bg-amber-50 border border-amber-200 rounded-xl shadow-xs animate-fade-in">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse shrink-0"></span>
                  Saisie Libre (Aucun Plan Théorique)
                </div>
              ) : (
                <div className="inline-flex items-center gap-2 bg-amber-55 border border-amber-200 px-3 py-1.5 rounded-xl shadow-xs">
                  <span className="text-[10px] font-black uppercase text-amber-800 tracking-wider">
                    {planFoundType === 'same_date' ? `🔗 Lié au Plan du Jour (${templateDateHint})` : `🔗 Lié au Plan d'Hier (${templateDateHint})`}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Real-time Status counters and view toggle pills */}
          <div className="flex flex-col items-center lg:items-end justify-between gap-4 w-full lg:w-auto self-center lg:self-stretch min-h-[140px]">
            {/* S Mode vs Archive Mode tabs as PILLED selectors */}
            <div className="flex gap-1 p-1 bg-slate-100 rounded-xl w-full max-w-xs md:max-w-none border border-slate-200 shadow-xs">
              <button 
                onClick={() => setViewMode('sheet')}
                className={`flex-1 px-4 py-1.5 rounded-lg font-black text-[10px] uppercase tracking-wider transition-all text-center cursor-pointer ${
                  viewMode === 'sheet' 
                    ? 'bg-gradient-to-r from-[#b8860b] to-[#ffd700] text-slate-950 shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                📊 Saisie Réel
              </button>
              <button 
                onClick={() => setViewMode('history')}
                className={`flex-1 px-4 py-1.5 rounded-lg font-black text-[10px] uppercase tracking-wider transition-all text-center cursor-pointer ${
                  viewMode === 'history' 
                    ? 'bg-gradient-to-r from-[#b8860b] to-[#ffd700] text-slate-950 shadow-sm' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                }`}
              >
                📋 Archives ({dataHistory.length})
              </button>
            </div>

            {/* Quick Action indicators aligned at bottom */}
            <div className="flex items-center gap-2 mt-auto">
              <div className="bg-amber-50/50 px-3.5 py-1.5 border border-amber-200/50 text-right shadow-xs rounded-xl">
                <span className="text-[8px] font-black text-amber-800 uppercase block tracking-wider">Métrage Arraché</span>
                <span className="text-sm font-black text-slate-850 mt-0.5 block font-mono">
                  {(
                    p1MinageRows.reduce((acc, r) => acc + (r.reel?.chantierId ? (r.reel.realMeterage === undefined ? r.reel.meterage : r.reel.realMeterage) : 0), 0) +
                    p2MinageRows.reduce((acc, r) => acc + (r.reel?.chantierId ? (r.reel.realMeterage === undefined ? r.reel.meterage : r.reel.realMeterage) : 0), 0) +
                    p3MinageRows.reduce((acc, r) => acc + (r.reel?.chantierId ? (r.reel.realMeterage === undefined ? r.reel.meterage : r.reel.realMeterage) : 0), 0)
                  ).toFixed(1)} m
                </span>
              </div>
              <div className="bg-amber-50/50 px-3.5 py-1.5 border border-amber-200/50 text-right shadow-xs rounded-xl">
                <span className="text-[8px] font-black text-amber-800 uppercase block tracking-wider">Total Wagons</span>
                <span className="text-sm font-black text-slate-850 mt-0.5 block font-mono">
                  {p1ExtractionRows.reduce((acc, r) => acc + (r.reel?.wagonsActual || 0), 0) +
                   p2ExtractionRows.reduce((acc, r) => acc + (r.reel?.wagonsActual || 0), 0) +
                   p3ExtractionRows.reduce((acc, r) => acc + (r.reel?.wagonsActual || 0), 0)} u
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* RE-LOADING AND SAVING FLOATING STRIP */}
        <div className="border-t border-slate-100 pt-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[10px] text-amber-800 bg-amber-50 border border-amber-100 px-2 py-1 rounded-lg font-black uppercase">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span> Actif en Ligne
            </span>
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-wider">
              Enregistrements d'avancement SMI • Sécurisés par Firestore
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => loadGlobalWorkbook(false, true)}
              className="bg-gray-50 hover:bg-amber-50/50 text-gray-855 hover:text-[#b8860b] border border-gray-200 hover:border-amber-200 px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 shadow-sm cursor-pointer"
              title="Rafraîchir les données du serveur"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#b8860b]" /> Recharger
            </button>
            
            <button
              onClick={saveWorkbook}
              disabled={saveStatus === 'saving' || isMonthClosed}
              className={`font-black px-5 py-1.5 rounded-lg text-[9.5px] uppercase tracking-wider flex items-center gap-2 transition-all shadow-md cursor-pointer hover:scale-[1.02] active:scale-[0.98] hover:shadow-lg active:translate-y-px ${
                isMonthClosed 
                  ? 'bg-red-700 text-white cursor-not-allowed opacity-50 border border-red-800' 
                  : 'bg-gradient-to-r from-[#b8860b] to-[#ffd700] hover:from-[#a07409] hover:to-[#e5bf4e] text-slate-950 border border-[#b8860b]/30'
              }`}
            >
              <Save className="w-4 h-4 text-slate-950" /> 
              {isMonthClosed ? '🔒 MOIS CLÔTURÉ (Lecture seule)' : saveStatus === 'saving' ? 'Gravure en cours...' : saveStatus === 'saved' ? '✓ Enregistré !' : 'Graver au Registre SMI'}
            </button>
          </div>
        </div>
      </div>

      {(() => {
        const status = allProductionDocs.find(doc => doc.id === selectedDate)?.status;
        return status === 'scelle' && unexplainedGaps > 0 ? (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 flex items-center gap-3 animate-fade-in">
            <AlertTriangle className="text-amber-600 w-5 h-5 flex-shrink-0" />
            <div className="flex-1">
              <span className="text-amber-800 text-sm">
                ⚠️ Ce registre comporte <strong>{unexplainedGaps}</strong> écart(s) non expliqué(s).
              </span>
            </div>
            <button 
              onClick={() => {
                window.sessionStorage.setItem('goto-explications-date', selectedDate);
                window.dispatchEvent(new CustomEvent('navigate-to-tab', { detail: { tab: 'explications' } }));
              }}
              className="text-amber-700 underline text-sm font-semibold hover:text-amber-900 whitespace-nowrap"
            >
              Voir les explications →
            </button>
          </div>
        ) : null;
      })()}

      {loading ? (
        <div className="py-24 text-center text-xs font-bold text-slate-500 uppercase tracking-widest animate-pulse flex flex-col items-center justify-center gap-3">
          <Clock className="w-8 h-8 text-[#00BFFF] animate-spin" />
          Synchronisation du registre journalier avec la base de données...
        </div>
      ) : viewMode === 'sheet' ? (
        <div className="space-y-6">
          
          {unfilledPlannings.length > 0 && (
            <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-3 flex flex-col md:flex-row gap-3 items-center justify-between shadow-xs animate-fade-in">
              <div className="flex gap-2.5 items-center">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="text-[11px] text-amber-900 font-bold">
                  En attente de réalisé ({unfilledPlannings.length}) :
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5 text-xs font-black shrink-0">
                {unfilledPlannings.map(plan => (
                  <button
                    key={plan.expectedProdDate}
                    type="button"
                    onClick={() => setSelectedDate(plan.expectedProdDate)}
                    className="px-2 py-1 bg-white hover:bg-amber-100 text-amber-800 border border-amber-200 hover:border-amber-300 rounded-lg font-extrabold uppercase text-[9px] tracking-wider transition-all cursor-pointer shadow-2xs"
                    title={`Basé sur la planification du ${formatFrenchDate(plan.planDate)}`}
                  >
                    📅 {formatFrenchDate(plan.expectedProdDate)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* PASSERELLE SMI DETACHEE - Only displays if automatic planning load has failed (i.e. exactPlanMissing is true) */}
          {exactPlanMissing && (
            <div className="bg-white text-slate-800 border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3 relative overflow-hidden animate-fade-in">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-1 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#00BFFF]" />
                  <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-900">
                    <span className="text-[#00BFFF]">Passerelle SMI</span> : Synchronisation Pont de Données
                  </h4>
                </div>
                <div className="inline-flex items-center px-1.5 py-0.5 text-[8px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 border border-emerald-200 rounded-md">
                  Pont d'Échange Actif
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <p className="text-[11px] text-slate-600 font-bold">
                  Chargement automatique impossible. Sélectionnez la date de la planification à importer (généralement la veille) :
                </p>

                <div className="flex flex-wrap items-center gap-2 bg-slate-50 border border-slate-200/60 p-2 rounded-xl shrink-0">
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[8px] font-black uppercase tracking-wider text-[#00BFFF]">Date Plan :</span>
                    <input
                      type="date"
                      value={bridgeDate}
                      onChange={(e) => setBridgeDate(e.target.value)}
                      className="bg-white text-slate-900 font-extrabold text-[10px] border border-slate-200 rounded-md px-1.5 py-0.5 outline-none focus:ring-1 focus:ring-[#00BFFF]/50 cursor-pointer"
                    />
                  </div>

                  <div className="flex flex-col gap-0.5">
                    <span className="text-[8px] font-black uppercase tracking-wider text-slate-400">Action :</span>
                    <button
                      type="button"
                      onClick={() => exportPlanningToProduction(bridgeDate)}
                      disabled={syncingBridge}
                      className="bg-[#00BFFF] hover:bg-sky-500 disabled:bg-slate-300 disabled:text-slate-400 text-white font-black px-3 py-1 cursor-pointer rounded-lg text-[9px] uppercase tracking-wider transition-all shadow-xs flex items-center gap-1 disabled:cursor-not-allowed"
                    >
                      {syncingBridge ? <Clock className="w-3 animate-spin"/> : <RotateCcw className="w-3"/>}
                      Force-Exporter
                    </button>
                  </div>
                </div>
              </div>

              {bridgeSuccessDate && (
                <div className="p-2 bg-emerald-50 border border-emerald-150 rounded-xl flex items-center gap-2 text-emerald-700 text-[9px] font-extrabold uppercase animate-fade-in">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Succès : Planification du {formatFrenchDate(bridgeSuccessDate)} synchronisée !</span>
                </div>
              )}
            </div>
          )}
          
          {draftAvailable && (
            <div className="bg-amber-50/60 border-l-4 border-amber-500 p-3 flex flex-col sm:flex-row gap-3 items-center justify-between shadow-xs rounded-xl border border-amber-200 animate-fade-in">
              <div className="flex gap-2.5 items-center">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <div>
                  <h4 className="text-[11px] font-black uppercase text-amber-955 tracking-wider">📝 Brouillon détecté</h4>
                  <p className="text-[10px] text-amber-800 font-bold mt-0.5">
                    Des modifications locales non sauvegardées existent pour le {selectedDate}.
                  </p>
                </div>
              </div>
              <div className="flex gap-1.5 text-xs font-black shrink-0">
                <button
                  type="button"
                  onClick={restoreDraft}
                  className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1 rounded-lg font-bold uppercase text-[9px] tracking-wider transition-colors cursor-pointer"
                >
                  Restaurer
                </button>
                <button
                  type="button"
                  onClick={discardDraft}
                  className="bg-transparent hover:bg-slate-200 text-slate-500 px-2 py-1 rounded-lg font-bold uppercase text-[9px] tracking-wider transition-colors cursor-pointer"
                >
                  Ignorer
                </button>
              </div>
            </div>
          )}

          {isTemplateLoaded && (
            <div className="bg-sky-50/50 border border-sky-200/40 rounded-2xl p-3 flex gap-2.5 items-center shadow-xs animate-fade-in mb-4">
              <Info className="w-4 h-4 text-[#00BFFF] shrink-0" />
              <div>
                <h4 className="text-[11px] font-black uppercase text-sky-900 tracking-wider">
                  Plan de référence pré-chargé ({templateDateHint})
                </h4>
                <p className="text-[10px] text-sky-800/80 font-bold mt-0.5">
                  Lignes pré-remplies automatiquement à partir de la planification du {templateDateHint}.
                </p>
              </div>
            </div>
          )}

          {exactPlanMissing && (
            <div className="bg-red-50/60 border-l-4 border-red-500 p-3 flex flex-col sm:flex-row gap-3 items-center justify-between shadow-xs rounded-xl border border-red-200 mb-4 animate-fade-in" id="exact_plan_missing_alert">
              <div className="flex gap-2.5 items-center">
                <AlertTriangle className="w-4 h-4 text-red-650 shrink-0 animate-pulse" />
                <div>
                  <h4 className="text-[11px] font-black uppercase text-red-955 tracking-wider">⚠️ Aucun plan de référence</h4>
                  <p className="text-[10px] text-red-900 font-bold mt-0.5">
                    Aucune planification pour le {formatFrenchDate(selectedDate)}.
                  </p>
                </div>
              </div>
              {!forceFreeEntryApproved && (
                <div className="shrink-0">
                  <button
                    type="button"
                    onClick={() => setForceFreeEntryApproved(true)}
                    className="bg-red-650 hover:bg-red-700 text-white font-extrabold uppercase text-[9px] tracking-wider px-3 py-1 rounded-lg transition-colors cursor-pointer shadow-xs"
                    id="btn_confirm_free_entry"
                  >
                    Saisie libre sans plan
                  </button>
                </div>
              )}
            </div>
          )}

          <div className="relative">
            {exactPlanMissing && !forceFreeEntryApproved && (
              <div className="absolute inset-x-0 top-0 bottom-0 bg-slate-900/30 backdrop-blur-xs rounded-2xl z-40 flex flex-col items-center justify-center p-4 text-center" id="free_entry_blocker_overlay" style={{ minHeight: '260px' }}>
                <div className="bg-white p-5 rounded-2xl shadow-xl max-w-sm w-full border border-gray-100 flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center mb-3">
                    <AlertTriangle className="w-5 h-5 text-red-650" />
                  </div>
                  <h3 className="text-xs font-black text-gray-950 uppercase tracking-wider mb-1.5">Aucun plan de référence</h3>
                  <p className="text-[11px] text-gray-600 font-bold mb-4 leading-relaxed">
                    Saisie libre sans planification pour la journée du {formatFrenchDate(selectedDate)}.
                  </p>
                  <button
                    type="button"
                    onClick={() => setForceFreeEntryApproved(true)}
                    className="w-full bg-red-650 hover:bg-red-750 text-white font-extrabold uppercase text-[10px] tracking-wider py-2 px-4 rounded-xl transition-colors cursor-pointer shadow-md"
                    id="btn_confirm_free_entry_overlay"
                  >
                    Confirmer la saisie libre
                  </button>
                </div>
              </div>
            )}

            {/* SPREADSHEET TABS - Redesigned matching Planning.tsx rounded-2xl style */}
            <div className={`bg-white border border-gray-200 rounded-2xl p-5 md:p-6 shadow-sm space-y-5 transition-all duration-300 ${exactPlanMissing && !forceFreeEntryApproved ? 'pointer-events-none select-none blur-[1px]' : ''}`}>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between border-b border-gray-100 pb-3 gap-4">
              <div className="flex flex-wrap gap-1.5 p-1 bg-gray-100 rounded-xl">
                {[
                  { id: 'minage', label: '🔨 Sheet 1 - Forage & Minage' },
                  { id: 'deblayage', label: 'LHD - Déblayage & Charge' },
                  { id: 'extraction', label: '🚃 Sheet 3 - Extraction' },
                  { id: 'maintenance', label: '🔧 Sheet 4 - Brigade Tech' },
                ].map(sheet => (
                  <button
                    key={sheet.id}
                    onClick={() => setActiveSheetTab(sheet.id as any)}
                    className={`px-3.5 py-1.5 rounded-lg font-extrabold text-[10px] uppercase tracking-wider transition-all text-center cursor-pointer ${
                      activeSheetTab === sheet.id 
                        ? 'bg-white text-gray-950 shadow-xs border border-gray-200/60' 
                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50/50'
                    }`}
                  >
                    {sheet.label}
                  </button>
                ))}
              </div>

              {/* Mode d'Ajustement Structurel Optionnel */}
              <div className="flex items-center gap-2 bg-slate-50 px-3.5 py-1.5 border border-slate-150 rounded-xl shadow-xs self-start lg:self-auto">
                <span className="text-[10px] font-black uppercase text-slate-600 tracking-wider">Ajustements Exceptionnels :</span>
                <label className="relative inline-flex items-center cursor-pointer select-none">
                  <input 
                    type="checkbox" 
                    checked={structureEditMode} 
                    onChange={e => setStructureEditMode(e.target.checked)}
                    className="sr-only peer" 
                  />
                  <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#00BFFF]"></div>
                  <span className="ml-2 text-[10px] font-black text-slate-700 uppercase tracking-wide">
                    {structureEditMode ? 'Actif' : 'Inactif'}
                  </span>
                </label>
              </div>
            </div>

            <fieldset disabled={isReadOnly} className="contents">

            {/* ASSISTANTS DE SAISIE POUR LE SECRETARIAT */}
            <div className="bg-slate-50/50 border border-slate-150 rounded-xl p-4 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-black tracking-widest text-[#8B0000] flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-[#00BFFF]" /> Assistants de Saisie (Secrétariat SMI)
                </span>
                <p className="text-[10px] text-slate-500 font-medium">
                  Utilisez ces raccourcis d'ingénierie pour accélérer considérablement le remplissage de vos fiches de poste quotidiennes.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
                <button
                  type="button"
                  onClick={copyYesterdayShiftTeam}
                  disabled={copyStatus === 'copying'}
                  className={`px-3.5 py-2 text-[9px] font-black uppercase tracking-wider flex items-center gap-2 transition-all rounded-lg border shadow-xs cursor-pointer ${
                    copyStatus === 'copied' 
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-300 font-bold'
                      : copyStatus === 'no_data'
                      ? 'bg-amber-50 text-amber-800 border-amber-300 font-bold'
                      : copyStatus === 'error'
                      ? 'bg-red-50 text-red-800 border-red-300 font-bold'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 font-bold'
                  }`}
                  title="Copie automatiquement l'effectif / personnel du même poste de la veille pour éviter la saisie manuelle répétitive."
                >
                  <UserCheck className="w-3.5 h-3.5 text-[#8B0000]" />
                  {copyStatus === 'copying' && 'Recherche en cours...'}
                  {copyStatus === 'copied' && '✓ Personnel d\'hier copié !'}
                  {copyStatus === 'no_data' && `⚠️ Pas d'équipe enregistrée le ${yesterdayDateLabel ? format(yesterdayDateLabel, 'dd/MM/yyyy') : ''}`}
                  {copyStatus === 'error' && '❌ Erreur de copie'}
                  {copyStatus === 'idle' && `Copier l'équipe d'hier (${yesterdayDateLabel ? format(yesterdayDateLabel, 'dd/MM') : ''})`}
                </button>

                <button
                  type="button"
                  onClick={standardizeHours}
                  className="bg-white hover:bg-slate-50 text-slate-705 border border-slate-200 px-3.5 py-2 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-2 transition-all shadow-xs cursor-pointer"
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
                          <button
                            type="button"
                            onClick={() => copyAllMinagePlanToReel(shiftName)}
                            className="px-3 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-[10px] font-black uppercase tracking-wider rounded flex items-center gap-1.5 transition-all cursor-pointer"
                          >
                            <Copy className="w-3.5 h-3.5 text-amber-600" /> Copier Tout le Plan (Minage)
                          </button>
                        </div>
                      </div>

                      {/* Forage & Minage unified grand table */}
                      <div className="space-y-6">
                        {renderMinageUnifiedTable(shiftName)}
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
                            // Only count rows that have an active chantierId to avoid summing blank preset rows
                            const activeRows = s.rows.filter(r => r.reel?.chantierId);
                            const holes = activeRows.reduce((sum, r) => sum + (Number(r.reel?.realHoles) || 0), 0);
                            const rounds = activeRows.reduce((sum, r) => sum + (Number(r.reel?.realRounds) || 0), 0);
                            const planned = activeRows.reduce((sum, r) => sum + (Number(r.plan?.meterage) || 0), 0);
                            const real = activeRows.reduce((sum, r) => {
                              const rMet = r.reel?.realMeterage !== undefined && r.reel?.realMeterage !== null
                                ? r.reel.realMeterage
                                : (r.reel?.meterage !== undefined ? r.reel?.meterage : 0);
                              return sum + (Number(rMet) || 0);
                            }, 0);
                            const anfo = activeRows.reduce((sum, r) => sum + (Number(r.reel?.anfo) || 0), 0);
                            const tovex = activeRows.reduce((sum, r) => sum + (Number(r.reel?.tovex) || 0), 0);
                            const ammorces = activeRows.reduce((sum, r) => sum + (Number(r.reel?.ammorces) || 0), 0);
                            
                            // Let's compute a PERFECT rate of blast pull (taux d'arrachement):
                            // Arrachement % = (Real meterage / Theoretical length of drilled holes) * 100
                            const totalExpectedAdvanceForRealRounds = activeRows.reduce((sum, r) => {
                              const is24m = r.plan?.barType === '2.4m' || r.reel?.barType === '2.4m';
                              const advanceFactor = is24m ? (platformSettings?.advance_24m ?? 2.3) : (platformSettings?.advance_18m ?? 1.7);
                              return sum + ((r.reel?.realRounds || 0) * advanceFactor);
                            }, 0);
                            
                            const eff = totalExpectedAdvanceForRealRounds > 0 
                              ? ((real / totalExpectedAdvanceForRealRounds) * 100).toFixed(1)
                              : (planned > 0 ? ((real / planned) * 100).toFixed(1) : '0.0');

                            return { name: s.name, holes, rounds, planned, real, anfo, tovex, ammorces, eff };
                          });

                          const totalHoles = stats.reduce((sum, s) => sum + s.holes, 0);
                          const totalRounds = stats.reduce((sum, s) => sum + s.rounds, 0);
                          const totalPlanned = stats.reduce((sum, s) => sum + s.planned, 0);
                          const totalReal = stats.reduce((sum, s) => sum + s.real, 0);
                          const totalAnfo = stats.reduce((sum, s) => sum + s.anfo, 0);
                          const totalTovex = stats.reduce((sum, s) => sum + s.tovex, 0);
                          const totalAmorces = stats.reduce((sum, s) => sum + s.ammorces, 0);

                          // To get the average total arrachement % perfectly:
                          const totalTheoreticalExpectedAdvance = shiftsList.reduce((sumSh, s) => {
                            const activeRows = s.rows.filter(r => r.reel?.chantierId);
                            return sumSh + activeRows.reduce((sumR, r) => {
                              const is24m = r.plan?.barType === '2.4m' || r.reel?.barType === '2.4m';
                              const advanceFactor = is24m ? (platformSettings?.advance_24m ?? 2.3) : (platformSettings?.advance_18m ?? 1.7);
                              return sumR + ((r.reel?.realRounds || 0) * advanceFactor);
                            }, 0);
                          }, 0);

                          const totalEff = totalTheoreticalExpectedAdvance > 0
                            ? ((totalReal / totalTheoreticalExpectedAdvance) * 100).toFixed(1)
                            : (totalPlanned > 0 ? ((totalReal / totalPlanned) * 100).toFixed(1) : '0.0');

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
                            onClick={() => copyAllDeblayagePlanToReel(shiftName)}
                            className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-[10px] font-black uppercase tracking-wider rounded flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                          >
                            <Copy className="w-3.5 h-3.5 text-amber-600" /> Copier Tout le Plan
                          </button>
                          {structureEditMode && (
                            <button
                              type="button"
                              onClick={() => addDeblayageRow(shiftName)}
                              className="bg-[#00BFFF] hover:bg-[#00BFFF]/95 text-white font-black text-[10px] uppercase px-3 py-1.5 flex items-center gap-1.5 transition-all shadow-sm rounded cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" /> Ajouter une ligne ({shiftName})
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Deblayage details cards */}
                      <div className="space-y-6">
                        {renderDeblayageSectorCards(shiftName, 'Imiter 2', 'border-neutral-300', 'text-neutral-900', 'bg-[#8B0000]')}
                        {renderDeblayageSectorCards(shiftName, 'Imiter 1', 'border-sky-300', 'text-sky-950', 'bg-[#00BFFF]')}
                        {renderDeblayageSectorCards(shiftName, 'Imiter Est', 'border-teal-300', 'text-teal-950', 'bg-teal-600')}
                        
                        {(() => {
                          const otherRows = deblayageRows.filter(r => 
                            !['imiter 2', 'imiter 1', 'imiter est'].includes((r.sector || '').trim().toLowerCase())
                          );
                          if (otherRows.length === 0) return null;
                          return renderDeblayageSectorCards(shiftName, 'Autres / Non Classés', 'border-slate-300', 'text-slate-900', 'bg-slate-400');
                        })()}

                         {deblayageRows.length === 0 && (
                          <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-6 text-center max-w-xl mx-auto my-4 shadow-xs" id={`empty_deblayage_plan_${shiftName.replace(/\s+/g, '_')}`}>
                            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
                              <AlertTriangle className="w-6 h-6 text-amber-600" />
                            </div>
                            <h4 className="text-xs font-black uppercase text-amber-900 tracking-wider mb-2">
                              Planification Non Saisie — {shiftName}
                            </h4>
                            <p className="text-[11px] text-amber-800 font-bold leading-relaxed">
                              Aucune planification de déblayage ou de conduite d'engins n'a été enregistrée pour le <span className="underline">{shiftName}</span> à cette date.
                              Veuillez d'abord saisir le chantier, l'engin et le conducteur dans le <span className="underline">Planning Journalier</span> pour pouvoir ajouter le réalisé.
                            </p>
                          </div>
                        )}
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
                          <th className="p-3 text-center border border-slate-350 bg-slate-700">Lubrifiant 1 (L)</th>
                          <th className="p-3 text-center border border-slate-350 bg-slate-700">Lubrifiant 2 (L)</th>
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
                            const godets = s.rows.reduce((sum, r) => sum + (Number(r.reel?.godets || r.godets || 0)), 0);
                            const godetsPlan = s.rows.reduce((sum, r) => sum + (Number(r.plan?.godets || 0)), 0);
                            const volume = s.rows.reduce((sum, r) => sum + (Number(r.reel?.volumeEstimated || r.volumeEstimated || 0)), 0);
                            const volumePlan = s.rows.reduce((sum, r) => sum + (Number(r.plan?.volumeEstimated || 0)), 0);
                            const gasoil = s.rows.reduce((sum, r) => sum + (Number(r.gasoil || r.reel?.gasoil || 0)), 0);
                            const lub1 = s.rows.reduce((sum, r) => sum + (Number(r.lubrifiant1Qty || r.reel?.lubrifiant1Qty || 0)), 0);
                            const lub2 = s.rows.reduce((sum, r) => sum + (Number(r.lubrifiant2Qty || r.reel?.lubrifiant2Qty || 0)), 0);
                            const ratio = volume > 0 ? (gasoil / volume).toFixed(3) : '0';
                            const fillFactor = godets > 0 ? (volume / godets).toFixed(2) : '1.50';
                            return { name: s.name, godets, godetsPlan, volume, volumePlan, gasoil, lub1, lub2, ratio, fillFactor };
                          });

                          const totalGodets = stats.reduce((sum, d) => sum + d.godets, 0);
                          const totalGodetsPlan = stats.reduce((sum, d) => sum + d.godetsPlan, 0);
                          const totalVolume = stats.reduce((sum, d) => sum + d.volume, 0);
                          const totalVolumePlan = stats.reduce((sum, d) => sum + d.volumePlan, 0);
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
                                  <td className="p-3 text-center border border-slate-200 font-mono text-slate-600">
                                    <div className="text-[10px] text-slate-400 font-bold">P: {s.godetsPlan}</div>
                                    <div className="font-extrabold text-slate-900">R: {s.godets} u</div>
                                  </td>
                                  <td className="p-3 text-center border border-slate-200 font-mono text-emerald-800 bg-emerald-50">
                                    <div className="text-[10px] text-emerald-600/70 font-bold">P: {s.volumePlan.toFixed(1)} m³</div>
                                    <div className="font-extrabold text-emerald-950">R: {s.volume.toFixed(1)} m³</div>
                                  </td>
                                  <td className="p-3 text-center border border-slate-200 font-mono text-blue-800 bg-blue-50/20">{s.gasoil} L</td>
                                  <td className="p-3 text-center border border-slate-200 font-mono">{s.lub1} L</td>
                                  <td className="p-3 text-center border border-slate-200 font-mono">{s.lub2} L</td>
                                  <td className="p-3 text-center border border-slate-200 font-mono text-red-750 bg-red-50/25">{s.ratio}</td>
                                  <td className="p-3 text-center border border-slate-200 font-mono text-teal-800 bg-teal-50/20">{s.fillFactor}</td>
                                </tr>
                              ))}
                              
                              {/* Total row */}
                              <tr className="bg-slate-100 text-[#00BFFF] font-black border-t-2 border-slate-350">
                                <td className="p-3 border border-slate-200 uppercase tracking-widest text-[#00BFFF] text-xs font-black">Total de la Journée</td>
                                <td className="p-3 text-center border border-slate-200 font-mono text-black text-xs">
                                  <div className="text-[10px] text-slate-500 font-bold">P: {totalGodetsPlan}</div>
                                  <div className="font-extrabold text-slate-900">R: {totalGodets} u.</div>
                                </td>
                                <td className="p-3 text-center border border-slate-200 font-mono text-emerald-950 bg-emerald-100/30 text-xs">
                                  <div className="text-[10px] text-emerald-700 font-bold">P: {totalVolumePlan.toFixed(1)} m³</div>
                                  <div className="font-extrabold text-emerald-950">R: {totalVolume.toFixed(1)} m³</div>
                                </td>
                                <td className="p-3 text-center border border-slate-200 font-mono text-blue-950 bg-blue-100/30 text-xs">{totalGasoil} L</td>
                                <td className="p-3 text-center border border-slate-200 font-mono text-black text-xs">{totalLub1} L</td>
                                <td className="p-3 text-center border border-slate-200 font-mono text-black text-xs">{totalLub2} L</td>
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
                            onClick={() => copyAllExtractionPlanToReel(shiftName)}
                            className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-[10px] font-black uppercase tracking-wider rounded flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
                          >
                            <Copy className="w-3.5 h-3.5 text-amber-600" /> Copier Tout le Plan
                          </button>
                          {structureEditMode && (
                            <button
                              type="button"
                              onClick={() => addExtractionRow(shiftName)}
                              className="bg-[#00BFFF] hover:bg-[#00BFFF]/95 text-white font-black text-[10px] uppercase px-3 py-1.5 flex items-center gap-1.5 transition-all shadow-sm rounded cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" /> Ajouter une ligne ({shiftName})
                            </button>
                          )}
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
                            <span className="text-xs font-bold text-slate-800">
                              {chiefName || "(Aucun affecté)"}
                            </span>
                          </div>
                        );
                      })()}

                      {/* Extraction single details card */}
                      <div className="max-w-4xl mx-auto">
                         {(() => {
                          const rowWrapper = extractionRows[0];
                          if (!rowWrapper) {
                            return (
                              <div className="bg-amber-50/50 border border-amber-200 rounded-xl p-6 text-center max-w-xl mx-auto my-4 shadow-xs" id={`empty_extraction_plan_${shiftName.replace(/\s+/g, '_')}`}>
                                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
                                  <AlertTriangle className="w-6 h-6 text-amber-600" />
                                </div>
                                <h4 className="text-xs font-black uppercase text-amber-900 tracking-wider mb-2">
                                  Planification Non Saisie — {shiftName}
                                </h4>
                                <p className="text-[11px] text-amber-800 font-bold leading-relaxed">
                                  Aucune planification d'extraction (treuil, wagonnage) n'a été enregistrée pour le <span className="underline">{shiftName}</span> à cette date.
                                  Veuillez d'abord planifier l'extraction dans le <span className="underline">Planning Journalier</span> pour pouvoir ajouter le réalisé.
                                </p>
                              </div>
                            );
                          }
                          const row = rowWrapper.reel;
                          const plan = rowWrapper.plan || {} as ExcelExtraction;
                          const idx = 0;
                          
                          const freqMin = row.wagonsActual > 0 ? (360 / row.wagonsActual).toFixed(1) + ' min' : '0 min';
                          const targetVal = row.wagonsTarget !== undefined && row.wagonsTarget !== null ? Number(row.wagonsTarget) : 48;
                          const pct = targetVal > 0 ? ((row.wagonsActual / targetVal) * 100).toFixed(0) : '0';

                          const pTreuillisteName = getEmployeeName(plan.treuilliste);
                          const rTreuillisteName = getEmployeeName(row.treuilliste);

                          const pEq1Name = getEmployeeName(plan.equipier1);
                          const rEq1Name = getEmployeeName(row.equipier1);

                          const pEq2Name = getEmployeeName(plan.equipier2);
                          const rEq2Name = getEmployeeName(row.equipier2);

                          const pEq3Name = getEmployeeName(plan.equipier3);
                          const rEq3Name = getEmployeeName(row.equipier3);

                          const pEq4Name = getEmployeeName(plan.equipier4);
                          const rEq4Name = getEmployeeName(row.equipier4);

                          const treuillisteMismatch = !!(row.treuilliste && plan.treuilliste && row.treuilliste.trim().toUpperCase() !== plan.treuilliste.trim().toUpperCase());
                          const eq1Mismatch = !!(row.equipier1 && plan.equipier1 && row.equipier1.trim().toUpperCase() !== plan.equipier1.trim().toUpperCase());
                          const eq2Mismatch = !!(row.equipier2 && plan.equipier2 && row.equipier2.trim().toUpperCase() !== plan.equipier2.trim().toUpperCase());
                          const eq3Mismatch = !!(row.equipier3 && plan.equipier3 && row.equipier3.trim().toUpperCase() !== plan.equipier3.trim().toUpperCase());
                          const eq4Mismatch = !!(row.equipier4 && plan.equipier4 && row.equipier4.trim().toUpperCase() !== plan.equipier4.trim().toUpperCase());
                          const hasMismatch = treuillisteMismatch || eq1Mismatch || eq2Mismatch || eq3Mismatch || eq4Mismatch;

                          const wagonsTarget = (row.wagonsTarget !== undefined && row.wagonsTarget !== null) ? Number(row.wagonsTarget) : 48;
                          const realWagons = row.wagonsActual || 0;
                          const realPct = wagonsTarget > 0 ? (realWagons / wagonsTarget) * 100 : 0;
                          const diffWagonsPct = wagonsTarget > 0 ? ((realWagons - wagonsTarget) / wagonsTarget) * 100 : 0;

                          let speedLabel = 'SOUS-KPI';
                          let speedColor = 'bg-rose-950/50 text-rose-300 border-rose-800 animate-pulse';
                          if (wagonsTarget === 0) {
                            if (realWagons === 0) {
                              speedLabel = "PAS D'EXTRACTION PRÉVUE";
                              speedColor = 'bg-slate-800/80 text-slate-400 border-slate-700';
                            } else {
                              speedLabel = 'EXTRACTION NON PLANIFIÉE';
                              speedColor = 'bg-emerald-950/50 text-emerald-300 border-emerald-800';
                            }
                          } else if (diffWagonsPct >= 0) {
                            speedLabel = 'CIBLE ATTEINTE';
                            speedColor = 'bg-emerald-950/50 text-emerald-300 border-emerald-800';
                          } else if (diffWagonsPct >= -15) {
                            speedLabel = 'CORRECT';
                            speedColor = 'bg-blue-950/50 text-blue-300 border-blue-800';
                          }

                          const getHoursBetween = (start: string, end: string) => {
                            if (!start || !end) return 6.5;
                            const [h1, m1] = start.split(':').map(Number);
                            const [h2, m2] = end.split(':').map(Number);
                            let startMinutes = h1 * 60 + m1;
                            let endMinutes = h2 * 60 + m2;
                            if (endMinutes < startMinutes) {
                              endMinutes += 24 * 60;
                            }
                            const hours = (endMinutes - startMinutes) / 60;
                            return hours > 0 ? hours : 6.5;
                          };
                          const durationHours = getHoursBetween(row.startTime || '07:00', row.endTime || '14:00');
                          const cadence = durationHours > 0 ? (realWagons / durationHours) : 0;

                          return (
                            <div 
                              data-card-container="true"
                              className="bg-[#F5F5F0] border-2 border-[#141414] p-6 shadow-[4px_4px_0px_0px_#141414] hover:shadow-[6px_6px_0px_0px_#141414] transition-all duration-150 flex flex-col space-y-6"
                            >
                              {/* Header */}
                              <div className="border-b-2 border-[#141414] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div>
                                  <span className="text-[10px] font-black uppercase bg-[#8B0000] text-white px-2 py-1 font-mono tracking-wider">
                                    Poste Unique Consolidé
                                  </span>
                                  <h3 className="text-lg font-black uppercase text-slate-900 mt-1">
                                    Extraction Bure N340 Imiter Est
                                  </h3>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                  {hasMismatch && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-black uppercase bg-amber-100 text-amber-900 border border-amber-300 rounded leading-none select-none animate-pulse" title="La composition réelle diffère de la planification">
                                      ⚠️ Équipe ≠ Plan
                                    </span>
                                  )}
                                  <span className="inline-flex items-center gap-1 text-[10px] font-black bg-emerald-600 text-white px-3 py-1 uppercase border border-[#141414]">
                                    <Layers className="w-3.5 h-3.5 text-white" /> Treuils
                                  </span>
                                </div>
                              </div>

                              {/* Three column Swiss architecture: Plan, Real, Deviations */}
                              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                                {/* Section 1: PLAN */}
                                <div className="space-y-4 bg-slate-200/50 p-4 border border-[#141414]/30 rounded">
                                  <div className="flex items-center gap-1.5 border-b border-[#141414]/25 pb-1">
                                    <Lock className="w-4 h-4 text-slate-500" />
                                    <h4 className="text-xs font-black uppercase text-slate-700 tracking-wider">
                                      1. Planification
                                    </h4>
                                  </div>

                                  <div className="space-y-3 text-[11px] font-bold text-slate-600">
                                    <div>
                                      <span className="block text-[8px] font-black text-slate-500 uppercase leading-none">Treuilliste Prévu</span>
                                      <span className="font-mono text-slate-800 text-xs block truncate mt-0.5" title={pTreuillisteName}>
                                        {plan.treuilliste ? `${plan.treuilliste} - ${pTreuillisteName.split(' (')[0]}` : '(Aucun)'}
                                      </span>
                                    </div>

                                    <div>
                                      <span className="block text-[8px] font-black text-slate-500 uppercase leading-none">Équipe Prévue</span>
                                      <ul className="space-y-1 mt-1 font-mono text-slate-800">
                                        <li className="truncate" title={pEq1Name}>{plan.equipier1 ? `• ${plan.equipier1} - ${pEq1Name.split(' (')[0]}` : '• Éq 1: (Vide)'}</li>
                                        <li className="truncate" title={pEq2Name}>{plan.equipier2 ? `• ${plan.equipier2} - ${pEq2Name.split(' (')[0]}` : '• Éq 2: (Vide)'}</li>
                                        <li className="truncate" title={pEq3Name}>{plan.equipier3 ? `• ${plan.equipier3} - ${pEq3Name.split(' (')[0]}` : '• Éq 3: (Vide)'}</li>
                                        <li className="truncate" title={pEq4Name}>{plan.equipier4 ? `• ${plan.equipier4} - ${pEq4Name.split(' (')[0]}` : '• Éq 4: (Vide)'}</li>
                                      </ul>
                                    </div>

                                    <div className="pt-2 border-t border-[#141414]/10 grid grid-cols-2 gap-2">
                                      <div>
                                        <span className="block text-[8px] font-black text-slate-500 uppercase leading-none">Cible Wagons</span>
                                        <span className="font-mono text-slate-900 text-xs font-black">{plan.wagonsTarget || 48} Wg</span>
                                      </div>
                                      <div>
                                        <span className="block text-[8px] font-black text-slate-500 uppercase leading-none">Shift Prévu</span>
                                        <span className="font-mono text-slate-900 text-xs font-black">{plan.startTime || '08:00'} - {plan.endTime || '13:30'}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Section 2: REEL */}
                                <div className="space-y-4 bg-white p-4 border-2 border-[#141414] rounded shadow-sm">
                                  <div className="flex items-center gap-1.5 border-b border-[#141414]/25 pb-1">
                                    <Pencil className="w-4 h-4 text-[#00BFFF]" />
                                    <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">
                                      2. Réalisé (Saisie)
                                    </h4>
                                  </div>

                                  <div className="space-y-3 text-[11px]">
                                    {/* Treuilliste */}
                                    <div>
                                      <label className="block text-[8px] font-black text-slate-500 uppercase leading-none mb-1">
                                        Treuilliste Réel
                                      </label>
                                      <EmployeeCell
                                        matricule={row.treuilliste || ''}
                                        name={rTreuillisteName}
                                        onChange={(mat) => updateExtractionCell(shiftName, idx, 'treuilliste', mat)}
                                        employees={activeEmployees}
                                        onKeyDown={handleKeyDown}
                                        placeholder="T..."
                                      />
                                      {treuillisteMismatch && (
                                        <span className="text-[8px] font-black text-amber-600 block mt-0.5 animate-pulse">
                                          ⚠️ Diffère du plan (Plan : {plan.treuilliste || '(Vide)'})
                                        </span>
                                      )}
                                    </div>

                                    {/* Equipiers */}
                                    <div>
                                      <label className="block text-[8px] font-black text-slate-500 uppercase leading-none mb-1">
                                        Équipiers Réels (4 Personnes)
                                      </label>
                                      <div className="grid grid-cols-2 gap-2">
                                        <div>
                                          <EmployeeCell
                                            matricule={row.equipier1 || ''}
                                            name={rEq1Name}
                                            onChange={(mat) => updateExtractionCell(shiftName, idx, 'equipier1', mat)}
                                            onKeyDown={handleKeyDown}
                                            employees={activeEmployees}
                                            placeholder="Eq1..."
                                          />
                                          {eq1Mismatch && (
                                            <span className="text-[7px] font-black text-amber-600 block truncate" title={`Plan : ${plan.equipier1 || '(Vide)'}`}>
                                              ⚠️ Plan : {plan.equipier1 || 'Vide'}
                                            </span>
                                          )}
                                        </div>

                                        <div>
                                          <EmployeeCell
                                            matricule={row.equipier2 || ''}
                                            name={rEq2Name}
                                            onChange={(mat) => updateExtractionCell(shiftName, idx, 'equipier2', mat)}
                                            onKeyDown={handleKeyDown}
                                            employees={activeEmployees}
                                            placeholder="Eq2..."
                                          />
                                          {eq2Mismatch && (
                                            <span className="text-[7px] font-black text-amber-600 block truncate" title={`Plan : ${plan.equipier2 || '(Vide)'}`}>
                                              ⚠️ Plan : {plan.equipier2 || 'Vide'}
                                            </span>
                                          )}
                                        </div>

                                        <div>
                                          <EmployeeCell
                                            matricule={row.equipier3 || ''}
                                            name={rEq3Name}
                                            onChange={(mat) => updateExtractionCell(shiftName, idx, 'equipier3', mat)}
                                            onKeyDown={handleKeyDown}
                                            employees={activeEmployees}
                                            placeholder="Eq3..."
                                          />
                                          {eq3Mismatch && (
                                            <span className="text-[7px] font-black text-amber-600 block truncate" title={`Plan : ${plan.equipier3 || '(Vide)'}`}>
                                              ⚠️ Plan : {plan.equipier3 || 'Vide'}
                                            </span>
                                          )}
                                        </div>

                                        <div>
                                          <EmployeeCell
                                            matricule={row.equipier4 || ''}
                                            name={rEq4Name}
                                            onChange={(mat) => updateExtractionCell(shiftName, idx, 'equipier4', mat)}
                                            onKeyDown={handleKeyDown}
                                            employees={activeEmployees}
                                            placeholder="Eq4..."
                                          />
                                          {eq4Mismatch && (
                                            <span className="text-[7px] font-black text-amber-600 block truncate" title={`Plan : ${plan.equipier4 || '(Vide)'}`}>
                                              ⚠️ Plan : {plan.equipier4 || 'Vide'}
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    {/* Wagons actual & Sterile actual */}
                                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#141414]/10">
                                      <div className="bg-slate-50 border border-slate-200 p-1.5 rounded">
                                        <span className="block text-[8px] font-black text-slate-500 uppercase leading-none">Wagons Réels</span>
                                        <input
                                          type="number"
                                          min="0"
                                          value={row.wagonsActual === 0 ? '' : row.wagonsActual}
                                          placeholder="0"
                                          onKeyDown={handleKeyDown}
                                          onChange={e => updateExtractionCell(shiftName, idx, 'wagonsActual', Number(e.target.value))}
                                          className="w-full text-xs font-black text-center text-emerald-950 font-mono outline-none bg-transparent"
                                        />
                                      </div>
                                      <div className="bg-slate-50 border border-slate-200 p-1.5 rounded">
                                        <span className="block text-[8px] font-black text-slate-500 uppercase leading-none">Stérile (Wg)</span>
                                        <input
                                          type="number"
                                          min="0"
                                          value={row.sterileBureImiterEst === 0 ? '' : row.sterileBureImiterEst}
                                          placeholder="0"
                                          onKeyDown={handleKeyDown}
                                          onChange={e => updateExtractionCell(shiftName, idx, 'sterileBureImiterEst', Number(e.target.value))}
                                          className="w-full text-xs font-black text-center text-slate-800 font-mono outline-none bg-transparent"
                                        />
                                      </div>
                                    </div>

                                    {/* Hours real */}
                                    <div className="grid grid-cols-2 gap-2">
                                      <div className="bg-slate-50 border border-slate-200 p-1.5 rounded">
                                        <span className="block text-[8px] font-black text-slate-500 uppercase leading-none">Début Réel</span>
                                        {renderTimeSelect(row.startTime || '', (val) => updateExtractionCell(shiftName, idx, 'startTime', val))}
                                      </div>
                                      <div className="bg-slate-50 border border-slate-200 p-1.5 rounded">
                                        <span className="block text-[8px] font-black text-slate-500 uppercase leading-none">Fin Réelle</span>
                                        {renderTimeSelect(row.endTime || '', (val) => updateExtractionCell(shiftName, idx, 'endTime', val))}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Section 3: ECARTS / GAUGES */}
                                <div className="space-y-4 bg-[#141414] text-white p-4 border border-[#141414] rounded shadow-md flex flex-col justify-between">
                                  <div>
                                    <div className="flex items-center gap-1.5 border-b border-white/20 pb-1 mb-3">
                                      <Gauge className="w-4 h-4 text-[#00BFFF]" />
                                      <h4 className="text-xs font-black uppercase text-sky-400 tracking-wider">
                                        3. Écarts & Cadence
                                      </h4>
                                    </div>

                                    <div className="space-y-4 text-[11px] font-mono select-none">
                                      {/* Taux de réalisation gauge */}
                                      <div className="space-y-1.5 font-bold">
                                        <div className="flex justify-between text-slate-300">
                                          <span className="text-[8px] font-black uppercase">Réalisation Objectif</span>
                                          <span className="font-mono text-white font-extrabold">{realWagons} / {wagonsTarget} Wg</span>
                                        </div>
                                        <div className="flex items-center justify-between gap-1 mt-1">
                                          <span className="text-[8px] text-slate-400 font-bold uppercase">Écart vs Objectif</span>
                                          <span className={`inline-flex px-2 py-0.5 border text-[9px] font-black uppercase rounded ${speedColor}`}>
                                            {wagonsTarget === 0 ? (realWagons === 0 ? "PAS D'EXTRACTION PRÉVUE" : `+${realWagons} Wg — ${speedLabel}`) : `${diffWagonsPct > 0 ? '+' : ''}${diffWagonsPct.toFixed(1)}% — ${speedLabel}`}
                                          </span>
                                        </div>
                                        <div className="w-full bg-slate-800 h-2 border border-white/10 rounded overflow-hidden mt-1">
                                          <div 
                                            className={`h-full transition-all duration-300 ${wagonsTarget === 0 ? (realWagons === 0 ? 'bg-slate-600' : 'bg-emerald-500') : (diffWagonsPct >= 0 ? 'bg-emerald-500' : diffWagonsPct >= -15 ? 'bg-[#00BFFF]' : 'bg-[#8B0000]')}`} 
                                            style={{ width: `${wagonsTarget === 0 ? (realWagons === 0 ? 0 : 100) : Math.min(100, Math.max(0, realPct))}%` }}
                                          ></div>
                                        </div>
                                      </div>

                                      {/* Cadence / Fréquence metrics */}
                                      <div className="grid grid-cols-2 gap-3 pt-2 text-slate-200 font-bold">
                                        <div className="bg-white/5 p-2 rounded border border-white/10">
                                          <span className="block text-[8.5px] font-black text-slate-500 uppercase">Cadence</span>
                                          <strong className="text-white text-xs font-black font-mono block mt-0.5">{cadence.toFixed(2)} Wg/h</strong>
                                        </div>
                                        <div className="bg-white/5 p-2 rounded border border-white/10">
                                          <span className="block text-[8.5px] font-black text-slate-500 uppercase">Fréquence</span>
                                          <strong className="text-white text-xs font-black font-mono block mt-0.5">{freqMin}</strong>
                                        </div>
                                      </div>

                                      {/* Warning indicators for mismatch */}
                                      {hasMismatch && (
                                        <div className="bg-amber-950/40 border border-amber-500/30 text-amber-200 p-2 rounded text-[9.5px] leading-relaxed">
                                          <strong>Notice :</strong> Des changements d'affectation ont été détectés par rapport à la planification théorique de cette équipe.
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Copy action btn */}
                                  <div className="pt-4 border-t border-white/10 flex items-center justify-end">
                                    <button
                                      type="button"
                                      onClick={() => copyExtractionPlanToReel(shiftName, idx)}
                                      className="px-3 py-1.5 text-[10px] font-black uppercase bg-[#00BFFF] hover:bg-[#00BFFF]/90 text-[#141414] border border-black rounded flex items-center gap-1.5 shadow-sm transition-all cursor-pointer font-sans"
                                      title="Copier les structures d'affection de planification vers le réel"
                                    >
                                      <Copy className="w-3 h-3 text-[#141414]" /> Copier Plan ➔ Réel
                                    </button>
                                  </div>
                                </div>

                              </div>
                            </div>
                          );
                        })()}
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
                          <th className="p-3 text-center border border-slate-350 bg-blue-950/30 text-blue-100">Écart vs Objectif (%)</th>
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
                            const wagons = s.rows.reduce((sum, r) => sum + (Number(r.reel.wagonsActual) || 0), 0);
                            const target = s.rows.reduce((sum, r) => sum + (r.reel.wagonsTarget !== undefined && r.reel.wagonsTarget !== null ? Number(r.reel.wagonsTarget) : 48), 0);
                            const sterile = s.rows.reduce((sum, r) => sum + (Number(r.reel.sterileBureImiterEst) || 0), 0);
                            const totalWag = wagons + sterile;
                            const diffWagonsPct = target > 0 ? ((wagons - target) / target) * 100 : 0;
                            const sterilePct = totalWag > 0 ? ((sterile / totalWag) * 100).toFixed(1) : '0';
                            return { name: s.name, wagons, target, sterile, totalWag, diffWagonsPct, sterilePct };
                          });

                          const totalWagons = stats.reduce((sum, e) => sum + e.wagons, 0);
                          const totalTarget = stats.reduce((sum, e) => sum + e.target, 0);
                          const totalSterile = stats.reduce((sum, e) => sum + e.sterile, 0);
                          const totalTransferred = totalWagons + totalSterile;
                          const totalDiffWagonsPct = totalTarget > 0 ? ((totalWagons - totalTarget) / totalTarget) * 100 : 0;
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
                                  <td className="p-3 text-center border border-slate-200 font-mono">
                                    {s.target === 0 ? (
                                      s.wagons === 0 ? (
                                        <span className="inline-flex px-1.5 py-0.5 border text-[10px] font-bold rounded bg-slate-50 text-slate-500 border-slate-200">
                                          PAS D'EXTRACTION PRÉVUE
                                        </span>
                                      ) : (
                                        <span className="inline-flex px-1.5 py-0.5 border text-[10px] font-bold rounded bg-emerald-50 text-emerald-800 border-emerald-250">
                                          +{s.wagons} Wg (EXTRACTION NON PLANIFIÉE)
                                        </span>
                                      )
                                    ) : (
                                      <span className={`inline-flex px-1.5 py-0.5 border text-[10px] font-bold rounded ${
                                        s.diffWagonsPct >= 0 
                                          ? 'bg-emerald-50 text-emerald-800 border-emerald-250' 
                                          : (s.diffWagonsPct >= -15 ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-rose-50 text-rose-700 border-rose-200')
                                      }`}>
                                        {s.diffWagonsPct > 0 ? '+' : ''}{s.diffWagonsPct.toFixed(1)}%
                                      </span>
                                    )}
                                  </td>
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
                                <td className="p-3 text-center border border-slate-200 font-mono text-xs font-black">
                                  {totalTarget === 0 ? (
                                    totalWagons === 0 ? (
                                      <span className="inline-flex px-1.5 py-0.5 border text-[10px] font-black rounded bg-slate-50 text-slate-500 border-slate-200">
                                        PAS D'EXTRACTION PRÉVUE
                                      </span>
                                    ) : (
                                      <span className="inline-flex px-1.5 py-0.5 border text-[10px] font-black rounded bg-emerald-50 text-emerald-800 border-emerald-250">
                                        +{totalWagons} Wg (EXTRACTION NON PLANIFIÉE)
                                      </span>
                                    )
                                  ) : (
                                    <span className={`inline-flex px-1.5 py-0.5 border text-[10px] font-black rounded ${
                                      totalDiffWagonsPct >= 0 
                                        ? 'bg-emerald-50 text-emerald-800 border-emerald-250' 
                                        : (totalDiffWagonsPct >= -15 ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-rose-50 text-rose-700 border-rose-200')
                                    }`}>
                                      {totalDiffWagonsPct > 0 ? '+' : ''}{totalDiffWagonsPct.toFixed(1)}%
                                    </span>
                                  )}
                                </td>
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

                        {structureEditMode && (
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => addMaintenanceRow(shiftName)}
                              className="bg-[#00BFFF] hover:bg-[#00BFFF]/95 text-white font-black text-[10px] uppercase px-3 py-1.5 flex items-center gap-1.5 transition-all shadow-sm rounded cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" /> Ajouter une ligne ({shiftName})
                            </button>
                          </div>
                        )}
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
                              {structureEditMode && <th className="p-2 text-[10px] font-black uppercase text-center w-14 text-slate-700">Action</th>}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-150 text-[11px]">
                            {maintenanceRows.map((rowWrapper, idx) => {
                              const row = rowWrapper.reel;
                              const plan = rowWrapper.plan || {} as ExcelMaintenance;
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
                                  {structureEditMode && (
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
                                  )}
                                </tr>
                              );
                            })}
                            {maintenanceRows.length === 0 ? (
                              <tr>
                                <td colSpan={structureEditMode ? 8 : 7} className="text-center p-8 bg-amber-50/20 text-amber-900 border border-amber-200">
                                  <div className="flex flex-col items-center justify-center py-4 space-y-2 max-w-md mx-auto">
                                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                                    <p className="font-bold text-xs uppercase tracking-wider text-amber-950">Planification Non Saisie — {shiftName}</p>
                                    <p className="text-[10px] text-amber-800 font-bold leading-relaxed">
                                      Aucune planification de brigade de maintenance souterraine n'a été enregistrée pour le <span className="underline">{shiftName}</span> à cette date.
                                      Veuillez d'abord planifier l'équipe de maintenance dans le <span className="underline">Planning Journalier</span> pour pouvoir enregistrer son réalisé.
                                    </p>
                                  </div>
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
                                        <td colSpan={structureEditMode ? 2 : 1} className="p-3"></td>
                                      </tr>

                                      <tr className="bg-slate-100 text-slate-800 font-black text-[11px] border-t border-slate-300">
                                        <td colSpan={5} className="p-3 text-right text-slate-500 uppercase font-black">Analyse S.M.I:</td>
                                        <td colSpan={structureEditMode ? 3 : 2} className="p-3 text-center bg-purple-500/10 text-purple-900 tracking-wide uppercase font-black">
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
            </fieldset>
          </div>
        </div>

          {/* REALTIME SYSTEM ANOMALIES & AUDITS FOR THE RESPONSIBLES (RED AND AMBER WARNINGS) */}
          {anomalies.length > 0 && (
            <div className="bg-rose-50/40 border border-rose-200/60 p-5 rounded-2xl space-y-3 shadow-xs animate-fade-in">
              <h4 className="text-xs font-black text-rose-950 uppercase tracking-widest flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-700 animate-pulse" /> Détecteur d'Incohérences & Anomalies de production en temps réel :
              </h4>
              <ul className="space-y-1.5 text-[11px] font-bold text-slate-700 list-disc list-inside">
                {anomalies.map((an, ind) => (
                  <li key={ind} className={an.level === 'danger' ? 'text-red-700 font-extrabold' : 'text-amber-700'}>
                    {an.msg}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* LOWER FOOTER COMMAND TRAY AND PERSISTENCE CONTROL */}
          <div className="bg-slate-950 border border-slate-900/60 text-white p-5 md:p-6 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6 shadow-sm">
            <div>
              <p className="text-[9px] font-black text-[#00BFFF] uppercase tracking-widest">Compte de session SMI</p>
              <h4 className="text-xs font-black text-white mt-1.5 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> Authentifié : {user?.email || 'Secrétaire de Bureau Technique'}
              </h4>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              {currentDocStatus === 'scelle' && !isMonthClosed && canUnseal && (
                <button
                  onClick={unsealWorkbook}
                  disabled={saveStatus === 'saving'}
                  className="w-full sm:w-auto font-black py-3 px-8 text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-md hover:scale-[1.01] active:scale-95 cursor-pointer bg-amber-600 hover:bg-amber-500 text-white flex items-center justify-center gap-2"
                >
                  🔓 Désceller le Cahier
                </button>
              )}
              
              <button
                onClick={saveWorkbook}
                disabled={saveStatus === 'saving' || isMonthClosed || currentDocStatus === 'scelle'}
                className={`w-full sm:w-auto font-black py-3 px-8 text-[10px] uppercase tracking-widest rounded-xl transition-all shadow-md hover:scale-[1.01] active:scale-95 cursor-pointer ${
                  isMonthClosed 
                    ? 'bg-red-700 text-white cursor-not-allowed opacity-50' 
                    : currentDocStatus === 'scelle'
                      ? 'bg-emerald-700 text-white cursor-not-allowed opacity-85'
                      : 'bg-[#00BFFF] hover:bg-sky-500 text-white'
                }`}
              >
                {isMonthClosed 
                  ? '🔒 MOIS CLÔTURÉ (Lecture seule)' 
                  : currentDocStatus === 'scelle'
                    ? '🔒 REGISTRE SCÉLLÉ (SMI)'
                    : saveStatus === 'saving' 
                      ? 'Gravure en cours ...' 
                      : saveStatus === 'saved' 
                        ? '✓ GRAVÉ AVEC SUCCÈS !' 
                        : 'Enregistrer et figer la production du Poste'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* SOUCHIER / CONSOLIDATED HISTORIC LIST */
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 bg-slate-50/50">
            <h3 className="text-sm font-black uppercase text-slate-900 tracking-wider">
              📋 Livre d'Or des Fiches Journalières Consolidées
            </h3>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-1">
              Historique des cahiers scellés dans la base de données de fond
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse bg-white">
              <thead>
                <tr className="bg-slate-50 border-b border-gray-150 text-slate-700 text-[10px] uppercase font-black">
                  <th rowSpan={2} className="px-4 py-3 border-r border-slate-200 text-left align-middle font-black">Date du cahier</th>
                  <th rowSpan={2} className="px-4 py-3 border-r border-slate-200 text-center align-middle font-black">Métrage Planifié</th>
                  <th rowSpan={2} className="px-4 py-3 border-r border-slate-200 text-center align-middle font-black">Métrage Arraché</th>
                  <th rowSpan={2} className="px-4 py-3 border-r border-slate-200 text-center align-middle font-black">Déblayage Planifié</th>
                  <th rowSpan={2} className="px-4 py-3 border-r border-slate-200 text-center align-middle font-black">Déblayage Réalisé</th>
                  <th rowSpan={2} className="px-4 py-3 border-r border-slate-200 text-center align-middle font-black">Wagons Planifié</th>
                  <th rowSpan={2} className="px-4 py-3 border-r border-slate-200 text-center align-middle font-black">Wagons Extraits</th>
                  <th colSpan={3} className="px-4 py-2 border-r border-slate-200 text-center bg-amber-50/50 text-amber-900 border-b border-slate-200 font-black">Consommation Explosifs</th>
                  <th rowSpan={2} className="px-4 py-3 border-r border-slate-200 text-left align-middle font-black">Secrétaire</th>
                  <th rowSpan={2} className="px-4 py-3 border-r border-slate-200 text-left align-middle font-black">Dernier Enregistrement</th>
                  <th rowSpan={2} className="px-4 py-3 text-center align-middle font-black">Statut</th>
                </tr>
                <tr className="bg-slate-50 border-b border-gray-150 text-slate-700 text-[9px] uppercase font-black">
                  <th className="px-2 py-1.5 border-r border-slate-200 text-center bg-amber-50/25 text-amber-800 font-black">ANFO</th>
                  <th className="px-2 py-1.5 border-r border-slate-200 text-center bg-amber-50/25 text-amber-800 font-black">TOVEX</th>
                  <th className="px-2 py-1.5 border-r border-slate-200 text-center bg-amber-50/25 text-amber-800 font-black">AMORCES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-xs font-semibold text-slate-700">
                {dataHistory.map((rec) => {
                  const formattedDate = rec.date ? rec.date.split('-').reverse().join('/') : rec.id;
                  return (
                    <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-4 py-3 font-mono font-black text-slate-900 border-r border-slate-150">{formattedDate}</td>
                      <td className="px-4 py-3 text-center font-mono text-slate-600 border-r border-slate-150">
                        {rec.totalMeteragePlanned !== undefined ? `${rec.totalMeteragePlanned.toFixed(1)} m` : '--'}
                      </td>
                      <td className="px-4 py-3 text-center font-mono font-black text-emerald-800 bg-emerald-50/15 border-r border-slate-150">
                        {rec.totalMeterageRealised !== undefined ? `${rec.totalMeterageRealised.toFixed(1)} m` : (rec.totalMeterage !== undefined ? `${rec.totalMeterage.toFixed(1)} m` : '--')}
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-slate-600 border-r border-slate-150">
                        {rec.totalDeblayagePlanned !== undefined ? `${rec.totalDeblayagePlanned.toFixed(1)} m³` : '--'}
                      </td>
                      <td className="px-4 py-3 text-center font-mono font-black text-blue-800 bg-blue-50/15 border-r border-slate-150">
                        {rec.totalDeblayageRealised !== undefined ? `${rec.totalDeblayageRealised.toFixed(1)} m³` : '--'}
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-slate-600 border-r border-slate-150">
                        {rec.totalWagonsPlanned !== undefined ? `${rec.totalWagonsPlanned} u` : '--'}
                      </td>
                      <td className="px-4 py-3 text-center font-mono font-black text-sky-850 bg-sky-50/15 border-r border-slate-150">
                        {rec.totalWagonsRealised !== undefined ? `${rec.totalWagonsRealised} u` : (rec.totalWagons !== undefined ? `${rec.totalWagons} u` : '--')}
                      </td>
                      <td className="px-3 py-3 text-center font-mono text-amber-800 bg-amber-50/5 border-r border-slate-150">
                        {rec.totalAnfo !== undefined ? `${rec.totalAnfo.toFixed(0)} kg` : '--'}
                      </td>
                      <td className="px-3 py-3 text-center font-mono text-amber-800 bg-amber-50/5 border-r border-slate-150">
                        {rec.totalTovex !== undefined ? `${rec.totalTovex.toFixed(1)} kg` : '--'}
                      </td>
                      <td className="px-3 py-3 text-center font-mono text-amber-800 bg-amber-50/5 border-r border-slate-150">
                        {rec.totalAmorces !== undefined ? `${rec.totalAmorces} u` : '--'}
                      </td>
                      <td className="px-4 py-3 text-slate-800 font-bold border-r border-slate-150">
                        <span className="inline-flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5 text-slate-400" />
                          {rec.secretary || 'Secrétaire'}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-500 border-r border-slate-150">
                        {rec.lastUpdated ? format(new Date(rec.lastUpdated), 'dd/MM/yyyy HH:mm') : '--'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-500/20 text-emerald-800 rounded-lg font-extrabold text-[9px] uppercase tracking-wider">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-650" /> Scellé
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {dataHistory.length === 0 && (
                  <tr>
                    <td colSpan={13} className="text-center py-20 italic text-slate-400 font-bold uppercase tracking-widest font-mono text-[10px]">
                      Aucune fiche scellée trouvée dans les registres.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Custom Beautiful Toast Notification for Hydromines */}
      <AnimatePresence>
        {showSuccessToast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="fixed bottom-6 right-6 z-50 max-w-sm bg-white border border-slate-100 shadow-2xl rounded-2xl flex flex-col p-4 border-l-4 border-l-emerald-500 overflow-hidden"
          >
            <div className="flex items-start gap-3">
              {/* Mini-Logo Hydromines */}
              <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center shrink-0 shadow-sm relative overflow-hidden">
                <div className="absolute inset-0 bg-radial-gradient from-blue-500/20 to-transparent"></div>
                {/* Customized emblem representing Water and Mine/Mountain */}
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                </svg>
              </div>

              <div className="flex-1 space-y-1">
                <div className="flex items-center justify-between gap-4">
                  <h4 className="text-[11px] font-black uppercase text-slate-950 tracking-widest">
                    SMI HYDROMINES
                  </h4>
                  <button 
                    onClick={() => setShowSuccessToast(false)}
                    className="text-slate-400 hover:text-slate-600 cursor-pointer p-0.5 rounded transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                <p className="text-[10px] text-emerald-650 font-extrabold uppercase tracking-wider">
                  ✓ Enregistrement Confirmé
                </p>
                <p className="text-[11px] text-slate-700 font-bold leading-relaxed">
                  {successToastMsg}
                </p>
              </div>
            </div>
            
            {/* Micro loading progress line */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-100">
              <div 
                className="h-full bg-emerald-500 origin-left w-full" 
                style={{ 
                  animation: 'shrinkWidth 5000ms linear forwards' 
                }}
              ></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Keyframes Style */}
      <style>{`
        @keyframes shrinkWidth {
          from { transform: scaleX(1); }
          to { transform: scaleX(0); }
        }
      `}</style>
    </div>
  );
};
