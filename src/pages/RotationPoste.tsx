import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, onSnapshot, getDoc, doc, writeBatch, setDoc } from 'firebase/firestore';
import { getNextPost, getUpcomingMonday, ROTATION_FUNCTIONS } from '../lib/rotation';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

// Helper function to convert OKLCH color strings to standard RGB(A)
// html2canvas doesn't support parsing modern CSS color formulas like oklch or oklab.
function replaceModernColors(str: string): string {
  if (typeof str !== 'string') return str;
  
  let result = str;
  
  // 1. Convert oklch(L C H [/ A]) to RGB
  if (result.includes('oklch')) {
    result = result.replace(/oklch\(([^)]+)\)/gi, (match, contents) => {
      try {
        const parts = contents.trim().split(/[\s,/\s]+/);
        if (parts.length < 3) return '#ffffff';
        
        const lStr = parts[0];
        const cStr = parts[1];
        const hStr = parts[2];
        const aStr = parts[3];
        
        const L = lStr.endsWith('%') ? parseFloat(lStr) / 100 : parseFloat(lStr);
        const C = parseFloat(cStr);
        let H = parseFloat(hStr);
        
        if (hStr.endsWith('rad')) {
          H = H * (180 / Math.PI);
        } else if (hStr.endsWith('turn')) {
          H = H * 360;
        }
        
        let alpha = 1;
        if (aStr) {
          alpha = aStr.endsWith('%') ? parseFloat(aStr) / 100 : parseFloat(aStr);
        }
        
        const hRad = (H * Math.PI) / 180;
        const a_lab = C * Math.cos(hRad);
        const b_lab = C * Math.sin(hRad);
        
        // Oklab to LMS
        const l = L + 0.3963377774 * a_lab + 0.2158037573 * b_lab;
        const m = L - 0.1055613458 * a_lab - 0.0638541728 * b_lab;
        const s = L - 0.0894841775 * a_lab - 1.2914855480 * b_lab;
        
        // LMS to linear RGB
        const l_ = l * l * l;
        const m_ = m * m * m;
        const s_ = s * s * s;
        
        const r_lin =  4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_;
        const g_lin = -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_;
        const b_lin = -0.0041960863 * l_ - 0.7034186147 * m_ + 1.7076147010 * s_;
        
        const toSRGB = (x: number) => {
          if (x <= 0.0031308) return 12.92 * x;
          return 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
        };
        
        const r = Math.round(Math.max(0, Math.min(1, toSRGB(r_lin))) * 255);
        const g = Math.round(Math.max(0, Math.min(1, toSRGB(g_lin))) * 255);
        const b = Math.round(Math.max(0, Math.min(1, toSRGB(b_lin))) * 255);
        
        if (alpha === 1) {
          return `rgb(${r}, ${g}, ${b})`;
        } else {
          return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }
      } catch (e) {
        console.warn("Conversion oklch en échec:", match, e);
        return '#ffffff';
      }
    });
  }

  // 2. Convert oklab(L a b [/ A]) to RGB
  if (result.includes('oklab')) {
    result = result.replace(/oklab\(([^)]+)\)/gi, (match, contents) => {
      try {
        const parts = contents.trim().split(/[\s,/\s]+/);
        if (parts.length < 3) return '#ffffff';
        
        const lStr = parts[0];
        const aStr = parts[1];
        const bStr = parts[2];
        const alpStr = parts[3];
        
        const L = lStr.endsWith('%') ? parseFloat(lStr) / 100 : parseFloat(lStr);
        const a_lab = parseFloat(aStr);
        const b_lab = parseFloat(bStr);
        
        let alpha = 1;
        if (alpStr) {
          alpha = alpStr.endsWith('%') ? parseFloat(alpStr) / 100 : parseFloat(alpStr);
        }
        
        // Oklab to LMS
        const l = L + 0.3963377774 * a_lab + 0.2158037573 * b_lab;
        const m = L - 0.1055613458 * a_lab - 0.0638541728 * b_lab;
        const s = L - 0.0894841775 * a_lab - 1.2914855480 * b_lab;
        
        // LMS to linear RGB
        const l_ = l * l * l;
        const m_ = m * m * m;
        const s_ = s * s * s;
        
        const r_lin =  4.0767416621 * l_ - 3.3077115913 * m_ + 0.2309699292 * s_;
        const g_lin = -1.2684380046 * l_ + 2.6097574011 * m_ - 0.3413193965 * s_;
        const b_lin = -0.0041960863 * l_ - 0.7034186147 * m_ + 1.7076147010 * s_;
        
        const toSRGB = (x: number) => {
          if (x <= 0.0031308) return 12.92 * x;
          return 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
        };
        
        const r = Math.round(Math.max(0, Math.min(1, toSRGB(r_lin))) * 255);
        const g = Math.round(Math.max(0, Math.min(1, toSRGB(g_lin))) * 255);
        const b = Math.round(Math.max(0, Math.min(1, toSRGB(b_lin))) * 255);
        
        if (alpha === 1) {
          return `rgb(${r}, ${g}, ${b})`;
        } else {
          return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }
      } catch (e) {
        console.warn("Conversion oklab en échec:", match, e);
        return '#ffffff';
      }
    });
  }

  return result;
}
import logoImg from '../assets/images/hydromines_logo_1781337889277.jpg';
import { logPlanningAction } from '../components/AuditLogsDrawer';
import { 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  Users, 
  ArrowRight, 
  ArrowLeftRight,
  ShieldAlert,
  CalendarDays,
  Check,
  Search,
  Printer,
  Grid,
  Save,
  Info,
  X,
  RotateCcw,
  Sliders
} from 'lucide-react';

interface Employee {
  id: string;
  matricule: string;
  nom: string;
  prenom: string;
  fonction: string;
  status: 'actif' | 'inactif';
  sector?: string;
  currentPost?: 'Poste 1' | 'Poste 2' | 'Poste 3' | '';
  rotationGroup?: string;
}

const EpirocST2DIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-4 inline-block" }) => (
  <svg viewBox="0 0 48 32" className={`${className} select-none mr-1 h-4.5 w-5`} fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Wheels with tire tread style */}
    <circle cx="13" cy="22" r="5.5" fill="#1e293b" stroke="#334155" strokeWidth="1" />
    <circle cx="13" cy="22" r="2.5" fill="#64748b" />
    <circle cx="33" cy="22" r="5.5" fill="#1e293b" stroke="#334155" strokeWidth="1" />
    <circle cx="33" cy="22" r="2.5" fill="#64748b" />
    
    {/* Low profile chassis in signature Epiroc yellow/orange and dark gray */}
    <path d="M6 14 h30 v6 h-30 z" fill="#FBBF24" /> {/* Epiroc Yellow */}
    <path d="M5 15 h3 M8 17 h22 M34 15 h2" stroke="#0f172a" strokeWidth="1" /> {/* Details */}
    <path d="M3 16 h3 v4 h-3 z" fill="#475569" /> {/* Counterweight */}
    
    {/* Canopy / Cabin low profile with protective cage */}
    <path d="M18 14 l3 -6 h7 l2 6 z" fill="#334155" />
    <path d="M21 14 l1.5 -4 h4 l1 4 z" fill="#bae6fd" opacity="0.9" /> {/* Windshield */}
    <line x1="24" y1="8" x2="24" y2="14" stroke="#1e293b" strokeWidth="1" /> {/* ROPS bar */}
    
    {/* Front hydraulic boom arms */}
    <path d="M34 15 l6 2 l2 5" stroke="#475569" strokeWidth="2" strokeLinecap="round" />
    <line x1="29" y1="13" x2="36" y2="16" stroke="#94a3b8" strokeWidth="1.5" /> {/* Lift cylinder */}
    
    {/* Bucket Loader scoop */}
    <path d="M38 15 l6 -1 l1.5 8 l-4 1.5 z" fill="#1e293b" stroke="#475569" strokeWidth="0.8" />
  </svg>
);

const ROLE_LABELS: Record<string, string> = {
  RESPONSABLE_CHANTIER: 'Responsable de Chantiers',
  SECRETAIRE_CHANTIER: 'Secrétaire de Chantiers',
  MAGASINIER: 'Magasinier',
  CHEF: 'Chef de Poste',
  MINEUR: 'Mineur',
  TREUILLISTE: 'Treuilliste',
  CONDUCTEUR_ENGIN: "Conducteur d'Engins",
  MECANICIEN: 'Mécanicien',
  AIDE_MINEUR: 'Aide Mineur',
  CHAUDRONNIER: 'Chaudronnier',
  ELECTRICIEN: 'Électricien',
  OUVRIER: 'Ouvrier',
  POMPISTE: 'Pompiste'
};

const getRoleLabel = (roleId: string) => ROLE_LABELS[roleId] || roleId;

export const RotationPoste: React.FC = () => {
  const { user } = useAuth();
  
  // Real-time synchronization of state
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [validated, setValidated] = useState(false);
  
  // Custom states matching the 10 proposals
  const [nextPosts, setNextPosts] = useState<Record<string, 'Poste 1' | 'Poste 2' | 'Poste 3' | ''>>({});
  const [engineAssignments, setEngineAssignments] = useState<Record<string, string>>({});
  const [extractionPostAssigned, setExtractionPostAssigned] = useState<'Poste 1' | 'Poste 2' | 'Poste 3'>('Poste 1');
  const [activeTab, setActiveTab] = useState<'edit' | 'board'>('edit');
  const [hasDraft, setHasDraft] = useState(false);
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedEmpIds, setSelectedEmpIds] = useState<string[]>([]);
  
  // Search & Filtering states
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSectorFilter, setSelectedSectorFilter] = useState('ALL');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState('ALL');
  
  // Visual modes
  const [isPrintPreview, setIsPrintPreview] = useState(false);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);
  const [engines, setEngines] = useState<string[]>(['ST2D', 'ST2G 1', 'ST2G 3', 'ST2G 4', 'ST2G 5', 'ST2G6']);

  const handleDownloadPDF = async () => {
    setIsDownloadingPDF(true);
    
    // Save the original getComputedStyle
    const originalGetComputedStyle = window.getComputedStyle;
    
    try {
      const element = document.getElementById('pdf-content');
      if (!element) {
        console.error("Élément 'pdf-content' introuvable.");
        return;
      }
      
      // Temporarily override window.getComputedStyle to intercept oklch/oklab color values
      window.getComputedStyle = function(elt, pseudoElt) {
        const style = originalGetComputedStyle(elt, pseudoElt);
        return new Proxy(style, {
          get(target, prop) {
            if (prop === 'getPropertyValue') {
              return function(propertyName: string) {
                const value = target.getPropertyValue(propertyName);
                if (typeof value === 'string' && (value.includes('oklch') || value.includes('oklab'))) {
                  return replaceModernColors(value);
                }
                return value;
              };
            }
            
            const value = Reflect.get(target, prop);
            if (typeof value === 'function') {
              return value.bind(target);
            }
            if (typeof value === 'string' && (value.includes('oklch') || value.includes('oklab'))) {
              return replaceModernColors(value);
            }
            return value;
          }
        });
      };
      
      const canvas = await html2canvas(element, {
        scale: 2.0,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        windowWidth: 1200
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a4'
      });
      
      const pdfWidth = 297;
      const pdfHeight = 210;
      
      const contentRatio = canvas.width / canvas.height;
      const pageRatio = pdfWidth / pdfHeight;
      
      let imgWidth = pdfWidth;
      let imgHeight = pdfHeight;
      
      if (contentRatio > pageRatio) {
        imgWidth = pdfWidth - 10; // 5mm margin on left & right
        imgHeight = imgWidth / contentRatio;
      } else {
        imgHeight = pdfHeight - 10; // 5mm margin on top & bottom
        imgWidth = imgHeight * contentRatio;
      }
      
      const xOffset = (pdfWidth - imgWidth) / 2;
      const yOffset = (pdfHeight - imgHeight) / 2;
      
      pdf.addImage(imgData, 'PNG', xOffset, yOffset, imgWidth, imgHeight, undefined, 'FAST');
      
      pdf.save(`Affectations-Hydromines-SMI-${targetDateStr}.pdf`);
    } catch (err) {
      console.error('Erreur téléchargement PDF:', err);
      alert('Une erreur est survenue lors de la génération du fichier PDF.');
    } finally {
      // ALWAYS restore the original getComputedStyle!
      window.getComputedStyle = originalGetComputedStyle;
      setIsDownloadingPDF(false);
    }
  };

  const targetDateStr = getUpcomingMonday();
  const isTodayMonday = new Date().getDay() === 1;

  // Sector normalization helper
  const normalizeSector = (sec?: string): 'Imiter 1' | 'Imiter 2' | 'Imiter Est' | 'Autre' => {
    if (!sec) return 'Autre';
    const lowercase = sec.toLowerCase();
    if (lowercase.includes('imiter 2')) return 'Imiter 2';
    if (lowercase.includes('imiter 1')) return 'Imiter 1';
    if (lowercase.includes('imiter est') || lowercase.includes('bure')) return 'Imiter Est';
    return 'Autre';
  };

  // Load active personnel & drafts sequentially from Firebase
  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'personnel'));
    const unsubscribePersonnel = onSnapshot(q, async (snapshot) => {
      const activeList: Employee[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data() as Omit<Employee, 'id'>;
        if (data.status === 'actif' && ROTATION_FUNCTIONS.includes(data.fonction)) {
          activeList.push({ id: docSnap.id, ...data });
        }
      });
      setEmployees(activeList);

      // Attempt to load corresponding week draft if it exists
      try {
        const draftRef = doc(db, 'rotations_drafts', targetDateStr);
        const draftSnap = await getDoc(draftRef);
        if (draftSnap.exists()) {
          const draftData = draftSnap.data();
          if (draftData) {
            if (draftData.nextPosts) {
              setNextPosts(draftData.nextPosts);
            }
            if (draftData.engineAssignments) {
              setEngineAssignments(draftData.engineAssignments);
            }
            if (draftData.extractionPostAssigned) {
              setExtractionPostAssigned(draftData.extractionPostAssigned);
            }
            setHasDraft(true);
          } else {
            // Default rotation logic: current -> next
            const initial: Record<string, 'Poste 1' | 'Poste 2' | 'Poste 3' | ''> = {};
            activeList.forEach(emp => {
              initial[emp.id] = getNextPost(emp.currentPost || '');
            });
            setNextPosts(initial);
          }
        } else {
          // No draft in DB, calculate defaults
          const initial: Record<string, 'Poste 1' | 'Poste 2' | 'Poste 3' | ''> = {};
          activeList.forEach(emp => {
            initial[emp.id] = getNextPost(emp.currentPost || '');
          });
          setNextPosts(initial);
          setHasDraft(false);
        }
      } catch (err) {
        console.error("Erreur lecture draft rotation:", err);
      } finally {
        setLoading(false);
      }
    }, (error) => {
      console.error("Erreur de synchronisation du personnel:", error);
      setLoading(false);
    });

    return () => unsubscribePersonnel();
  }, [targetDateStr, user]);

  // Sync validation status when success or target shifts
  useEffect(() => {
    if (!user) return;
    let unmounted = false;
    const checkValidatedState = async () => {
      try {
        const docRef = doc(db, 'rotations_history', targetDateStr);
        const docSnap = await getDoc(docRef);
        if (!unmounted) {
          if (docSnap.exists()) {
            setValidated(true);
          } else {
            setValidated(false);
          }
        }
      } catch (err) {
        console.error("Erreur d'accès à l'historique de rotation:", err);
      }
    };

    checkValidatedState();

    return () => {
      unmounted = true;
    };
  }, [targetDateStr, successMessage, user]);

  // Load platform settings (engines list) for dropdown choice
  useEffect(() => {
    if (!user) return;
    const fetchPlatformSettings = async () => {
      try {
        const platformRef = doc(db, 'settings', 'platform');
        const platformSnap = await getDoc(platformRef);
        if (platformSnap.exists()) {
          const data = platformSnap.data();
          if (data && Array.isArray(data.engines)) {
            setEngines(data.engines);
          }
        }
      } catch (err) {
        console.error("Erreur de lecture des paramètres de plate-forme:", err);
      }
    };
    fetchPlatformSettings();
  }, [user]);

  // Compute live tallies to balance future week roles
  const tallies = {
    'Poste 1': { chefs: 0, mineurs: 0, aides: 0, conducteurs: 0, treuillistes: 0, total: 0 },
    'Poste 2': { chefs: 0, mineurs: 0, aides: 0, conducteurs: 0, treuillistes: 0, total: 0 },
    'Poste 3': { chefs: 0, mineurs: 0, aides: 0, conducteurs: 0, treuillistes: 0, total: 0 },
  };

  employees.forEach(emp => {
    const np = nextPosts[emp.id];
    if (np && (np === 'Poste 1' || np === 'Poste 2' || np === 'Poste 3')) {
      tallies[np].total += 1;
      if (emp.fonction === 'CHEF') tallies[np].chefs += 1;
      if (emp.fonction === 'MINEUR') tallies[np].mineurs += 1;
      if (emp.fonction === 'AIDE_MINEUR') tallies[np].aides += 1;
      if (emp.fonction === 'CONDUCTEUR_ENGIN') tallies[np].conducteurs += 1;
      if (emp.fonction === 'TREUILLISTE') tallies[np].treuillistes += 1;
    }
  });

  // Calculate changed totals
  const getManualOverridesCount = () => {
    let count = 0;
    employees.forEach(emp => {
      const np = nextPosts[emp.id];
      const defaultNp = getNextPost(emp.currentPost || '');
      if (np && np !== defaultNp) {
        count++;
      }
    });
    return count;
  };

  // Change individual next post
  const handleSinglePostChange = (id: string, value: 'Poste 1' | 'Poste 2' | 'Poste 3' | '') => {
    setNextPosts(prev => ({
      ...prev,
      [id]: value
    }));
  };

  // Toggle individual next post quickly via button
  const toggleNextPostQuickly = (id: string) => {
    const currentVal = nextPosts[id];
    let newVal: 'Poste 1' | 'Poste 2' | 'Poste 3' = 'Poste 1';
    if (currentVal === 'Poste 1') newVal = 'Poste 2';
    else if (currentVal === 'Poste 2') newVal = 'Poste 3';
    else if (currentVal === 'Poste 3') newVal = 'Poste 1';
    
    handleSinglePostChange(id, newVal);
  };

  // Bulk actions
  const applyStandardAutomaticRotation = () => {
    const updated: Record<string, 'Poste 1' | 'Poste 2' | 'Poste 3' | ''> = {};
    employees.forEach(emp => {
      updated[emp.id] = getNextPost(emp.currentPost || '');
    });
    setNextPosts(updated);
    setSuccessMessage("Réinitialisation de tous les postes au cycle automatique théorique (+1 poste).");
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  const handleBulkAssign = (post: 'Poste 1' | 'Poste 2' | 'Poste 3') => {
    if (selectedEmpIds.length === 0) {
      alert("Veuillez d'abord sélectionner des employés par les cases à cocher.");
      return;
    }
    setNextPosts(prev => {
      const updated = { ...prev };
      selectedEmpIds.forEach(id => {
        updated[id] = post;
      });
      return updated;
    });
    setSuccessMessage(`Assignation forcée de ${selectedEmpIds.length} employés sélectionnés au ${post}.`);
    setSelectedEmpIds([]);
    setTimeout(() => setSuccessMessage(null), 5050);
  };

  const handleSelectAll = (filteredList: Employee[]) => {
    if (selectedEmpIds.length === filteredList.length) {
      setSelectedEmpIds([]);
    } else {
      setSelectedEmpIds(filteredList.map(emp => emp.id));
    }
  };

  const handleSelectOne = (id: string) => {
    setSelectedEmpIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  // Draft mode saving
  const saveDraftToCloud = async () => {
    setIsSavingDraft(true);
    try {
      const draftRef = doc(db, 'rotations_drafts', targetDateStr);
      
      // Sanitize structures to guarantee no undefined values are written to Firestore
      const cleanNextPosts: Record<string, string> = {};
      Object.keys(nextPosts).forEach(key => {
        if (nextPosts[key] !== undefined && nextPosts[key] !== null) {
          cleanNextPosts[key] = nextPosts[key] as string;
        }
      });

      const cleanEngineAssignments: Record<string, string> = {};
      Object.keys(engineAssignments).forEach(key => {
        if (engineAssignments[key] !== undefined && engineAssignments[key] !== null) {
          cleanEngineAssignments[key] = engineAssignments[key] as string;
        }
      });

      await setDoc(draftRef, {
        date: targetDateStr,
        updatedAt: new Date().toISOString(),
        updatedBy: user?.email || 'Secrétariat de planification site SMI',
        nextPosts: cleanNextPosts,
        engineAssignments: cleanEngineAssignments,
        extractionPostAssigned: extractionPostAssigned || 'Poste 1'
      });
      setHasDraft(true);
      setSuccessMessage("💾 Brouillon enregistré ! Vos modifications manuelles, affectations d'engins et la planification sont conservées pour plus tard.");
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      console.error("Erreur enregistrement brouillon :", err);
      alert("Erreur technique lors de l'archivage du brouillon.");
    } finally {
      setIsSavingDraft(false);
    }
  };

  // Final confirmation and validation of next posts
  const validateWeeklyRotation = async () => {
    if (validated) {
      alert("La rotation pour cette semaine cible a déjà été validée définitivement.");
      return;
    }

    // List employee modifications
    const finalChangesList = employees.map(emp => {
      const current = emp.currentPost || 'Poste 1';
      const to = nextPosts[emp.id] || 'Poste 1';
      return {
        id: emp.id,
        matricule: emp.matricule,
        name: `${emp.nom} ${emp.prenom}`,
        fonction: emp.fonction,
        sector: emp.sector || 'Non assigné',
        fromPost: current,
        toPost: to,
        hasChange: current !== to
      };
    });

    const activeChanges = finalChangesList.filter(c => c.hasChange);
    const totalChanges = activeChanges.length;

    const confirmMsg = `Confirmez-vous la validation de la rotation pour le lundi ${targetDateStr} ?\n\n` +
      `- Total collaborateurs impliqués : ${employees.length}\n` +
      `- Changements réels opérés : ${totalChanges}\n` +
      `- Rallongement/Ajustements manuels saisis : ${getManualOverridesCount()}\n\n` +
      `Cette action va mettre à jour définitivement les fiches actives du personnel pour la planification.`;

    if (!window.confirm(confirmMsg)) {
      return;
    }

    setLoading(true);
    try {
      const batch = writeBatch(db);

      // Create history document
      const rotationRef = doc(db, 'rotations_history', targetDateStr);
      batch.set(rotationRef, {
        date: targetDateStr,
        appliedBy: user?.email || 'Secrétaire de Planification',
        changes: activeChanges,
        talliesScheduled: tallies,
        validatedAt: new Date().toISOString()
      });

      // Update actual active posts in personnel documents
      finalChangesList.forEach(c => {
        const empRef = doc(db, 'personnel', c.id);
        batch.update(empRef, {
          currentPost: c.toPost
        });
      });

      // Commit transaction
      await batch.commit();

      // Log to interactive Trace Audit Logs
      await logPlanningAction(
        user?.email || 'Secrétaire Planificateur',
        'COMMUTATION ROTATION',
        'TOUS LES SECTEURS',
        targetDateStr,
        `Validation définitive de la rotation hebdomadaire (${totalChanges} collaborateurs permutés, ${getManualOverridesCount()} forcages).`
      );

      setSuccessMessage(`✅ La rotation hebdomadaire pour le ${targetDateStr} a été exécutée et enregistrée avec succès !`);
      setTimeout(() => setSuccessMessage(null), 8000);

    } catch (err) {
      console.error("Erreur de sauvegarde de la rotation :", err);
      alert("Une erreur technique s'est produite lors du basculement.");
    } finally {
      setLoading(false);
    }
  };

  const handleEngineAssignmentChange = (employeeId: string, engineName: string) => {
    setEngineAssignments(prev => ({
      ...prev,
      [employeeId]: engineName
    }));
  };

  interface SectorGroupData {
    chefList: Employee[];
    mineurAidePairs: { mineur?: Employee; aide?: Employee }[];
    conducteurList: Employee[];
    pompisteList: Employee[];
    treuillisteList: Employee[];
    ouvrierList: Employee[];
  }

  const getSectorGroupData = (post: 'Poste 1' | 'Poste 2' | 'Poste 3', sectorType: 'Imiter 1' | 'Imiter 2' | 'Imiter Est'): SectorGroupData => {
    // Get all active employees allocated to this target post
    const assigned = employees.filter(emp => {
      const targetPost = nextPosts[emp.id] !== undefined ? nextPosts[emp.id] : (emp.currentPost || '');
      return targetPost === post && normalizeSector(emp.sector) === sectorType;
    });

    const chefs = assigned.filter(e => e.fonction === 'CHEF');
    const mineurs = assigned.filter(e => e.fonction === 'MINEUR');
    const aides = assigned.filter(e => e.fonction === 'AIDE_MINEUR');
    const conducteurs = assigned.filter(e => e.fonction === 'CONDUCTEUR_ENGIN');
    const pompistes = assigned.filter(e => e.fonction === 'POMPISTE');
    const treuillistes = assigned.filter(e => e.fonction === 'TREUILLISTE');
    const ouvriers = assigned.filter(e => e.fonction === 'OUVRIER');

    // Pair Mineurs with Aide-Mineurs
    const mineurAidePairs: { mineur?: Employee; aide?: Employee }[] = [];
    const maxPairs = Math.max(mineurs.length, aides.length);
    for (let i = 0; i < maxPairs; i++) {
      mineurAidePairs.push({
        mineur: mineurs[i],
        aide: aides[i]
      });
    }

    return {
      chefList: chefs,
      mineurAidePairs,
      conducteurList: conducteurs,
      pompisteList: pompistes,
      treuillisteList: treuillistes,
      ouvrierList: ouvriers
    };
  };

  const renderSectorTable = (
    sectorTitle: 'Imiter 1' | 'Imiter 2' | 'Imiter Est',
    isPrint: boolean = false
  ) => {
    const posts: ('Poste 1' | 'Poste 2' | 'Poste 3')[] = ['Poste 1', 'Poste 2', 'Poste 3'];

    const sectorAccentClass = isPrint 
      ? 'border-slate-900 border-t-2' 
      : 'border-slate-300 border-t-2';

    const sectorBgHeaderClass = isPrint
      ? 'bg-slate-100 text-slate-900 border-b border-slate-900'
      : 'bg-slate-50 text-slate-900 border-b border-slate-200';

    return (
      <div className={`border border-slate-300 bg-white shadow-xs rounded-lg overflow-hidden ${isPrint ? 'text-[8.5px]' : 'text-xs'} ${sectorAccentClass}`}>
        <div className={`${isPrint ? 'px-2 py-0.5' : 'px-4 py-2'} ${sectorBgHeaderClass} flex justify-between items-center`}>
          <div className="flex items-center gap-2">
            <span className={`${isPrint ? 'text-[9.5px]' : 'text-[11px]'} font-black uppercase tracking-wider text-slate-800`}>
              SECTEUR : {sectorTitle}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 text-[9px] uppercase tracking-wider font-extrabold border-b border-slate-300">
                <th className={`${isPrint ? 'px-1 py-0.5 w-16' : 'px-3 py-2 w-20'} text-center border-r border-slate-200`}>POSTE</th>
                <th className={`${isPrint ? 'px-2 py-0.5' : 'px-4 py-2'} text-left border-r border-slate-200`}>CHEF DE POSTE</th>
                <th className={`${isPrint ? 'px-2 py-0.5' : 'px-4 py-2'} text-left border-r border-slate-200 justify-start`}>ÉQUIPES DE MINAGE (MINEUR & AIDE)</th>
                <th className={`${isPrint ? 'px-2 py-0.5' : 'px-4 py-2'} text-left border-r border-slate-200`}>CONDUCTEURS D'ENGINS (LHD)</th>
                <th className={`${isPrint ? 'px-2 py-0.5 w-24' : 'px-3 py-2 w-32'} text-center border-r border-slate-200`}>POMPAGE</th>
                {sectorTitle === 'Imiter 2' && (
                  <th className={`${isPrint ? 'px-2 py-0.5' : 'px-4 py-2'} text-left`}>ÉQUIPE D'EXTRACTION</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {posts.map(pv => {
                const data = getSectorGroupData(pv, sectorTitle);
                const { chefList, mineurAidePairs, conducteurList, pompisteList, treuillisteList, ouvrierList } = data;

                return (
                  <tr key={pv} className="hover:bg-slate-55 transition-colors">
                    {/* Column 1: POSTE */}
                    <td className={`${isPrint ? 'px-1 py-1' : 'px-3 py-3'} text-center align-middle whitespace-nowrap bg-slate-50/50 border-r border-slate-200 font-bold`}>
                      <div className={`${isPrint ? 'text-[10px]' : 'text-xs'} font-black tracking-wide text-slate-900 uppercase`}>
                        {pv}
                      </div>
                      <div className="text-[8px] text-slate-400 font-bold font-mono uppercase mt-0.5">
                        {chefList.length + mineurAidePairs.length * 2 + conducteurList.length + pompisteList.length + (sectorTitle === 'Imiter 2' && extractionPostAssigned === pv ? (treuillisteList.length + ouvrierList.length) : 0)} pers
                      </div>
                    </td>

                    {/* Column 2: CHEF */}
                    <td className={`${isPrint ? 'px-2 py-1' : 'px-4 py-2.5'} align-middle border-r border-slate-200`}>
                      {chefList.length > 0 ? (
                        chefList.map(chef => (
                          <div key={chef.id} className="font-extrabold text-slate-800 uppercase leading-snug">
                            {chef.nom} {chef.prenom}
                            <span className="text-slate-400 font-mono text-[8.5px] block">
                              Mtr: {chef.matricule}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="text-slate-600 font-bold italic bg-slate-50 border border-slate-200 px-2 py-0.5 rounded text-[9.5px] w-fit">
                          À pourvoir
                        </div>
                      )}
                    </td>

                    {/* Column 3: MINAGE */}
                    <td className={`${isPrint ? 'px-2 py-1' : 'px-4 py-2.5'} align-middle min-w-[200px] border-r border-slate-200`}>
                      {mineurAidePairs.length > 0 ? (
                        <div className="space-y-1">
                          {mineurAidePairs.map((pair, index) => (
                            <div key={index} className="text-[9.5px] border-b border-dotted border-slate-200 pb-1 last:border-b-0 last:pb-0">
                              <div className="text-slate-800 uppercase font-bold">
                                <span className="text-slate-400 text-[8px] mr-1">M{index+1}:</span>
                                {pair.mineur ? (
                                  <span>{pair.mineur.nom} {pair.mineur.prenom} <span className="font-mono text-slate-400 text-[8px]">({pair.mineur.matricule})</span></span>
                                ) : (
                                  <span className="text-slate-500 italic">À pourvoir</span>
                                )}
                              </div>
                              <div className="text-slate-600 uppercase mt-0.5">
                                <span className="text-slate-400 text-[8px] mr-1">Aide:</span>
                                {pair.aide ? (
                                  <span>{pair.aide.nom} {pair.aide.prenom} <span className="font-mono text-slate-400 text-[8px]">({pair.aide.matricule})</span></span>
                                ) : (
                                  <span className="text-slate-450 italic">À pourvoir</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Néant</span>
                      )}
                    </td>

                    {/* Column 4: CONDUCTEURS */}
                    <td className={`${isPrint ? 'px-2 py-1' : 'px-4 py-2.5'} align-middle min-w-[200px] border-r border-slate-200`}>
                      {conducteurList.length > 0 ? (
                        <div className="space-y-1">
                          {conducteurList.map((cond, index) => (
                            <div key={cond.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-dotted border-slate-100 pb-1 last:border-b-0 last:pb-0">
                              <span className="font-bold text-slate-800 uppercase text-[9.5px] flex items-center">
                                <EpirocST2DIcon className="w-4.5 h-3.5 inline-block mr-1" />
                                {cond.nom} {cond.prenom.substring(0, 1)}. <span className="text-slate-400 text-[8px] font-mono ml-1">({cond.matricule})</span>
                              </span>
                              <select
                                value={engineAssignments[cond.id] || ''}
                                onChange={(e) => handleEngineAssignmentChange(cond.id, e.target.value)}
                                className={`bg-white border border-slate-200 rounded font-extrabold text-slate-800 focus:outline-none uppercase text-center cursor-pointer ${
                                  isPrint 
                                    ? 'px-1 py-0.5 text-[8.5px] w-24 appearance-none shadow-none' 
                                    : 'px-1.5 py-0.5 text-[9px] w-24'
                                }`}
                              >
                                <option value="">Pas d'engin</option>
                                {engines.map(eng => (
                                  <option key={eng} value={eng}>{eng}</option>
                                ))}
                              </select>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Aucun LHD</span>
                      )}
                    </td>

                    {/* Column 5: POMPAGE */}
                    <td className={`${isPrint ? 'px-2 py-0.5' : 'px-3 py-2.5'} align-middle w-32 border-r border-slate-200`}>
                      {sectorTitle === 'Imiter 1' && (
                        <div className="space-y-0.5 text-center">
                          {pompisteList.length > 0 ? (
                            pompisteList.map(pomp => (
                              <div key={pomp.id} className="font-extrabold text-slate-800 uppercase leading-tight text-[9.5px] text-left">
                                {pomp.nom} {pomp.prenom.substring(0, 1)}.
                                <span className="text-slate-400 text-[8px] font-mono block">Mtr: {pomp.matricule}</span>
                              </div>
                            ))
                          ) : (
                            <div className="text-slate-500 italic text-[8.5px] bg-slate-50 p-1 rounded border border-slate-200 font-bold">
                              Ch. Poste auto
                            </div>
                          )}
                        </div>
                      )}

                      {sectorTitle === 'Imiter 2' && (
                        <div className={`space-y-1 ${isPrint ? 'text-[8.5px]' : 'text-[9px]'}`}>
                          <div className={`${isPrint ? 'p-0.5' : 'p-1'} bg-slate-55 rounded border border-slate-200 leading-tight`}>
                            <span className="text-slate-500 font-extrabold text-[7.5px] uppercase block">Niveau 300</span>
                            {pompisteList[0] ? (
                              <span className="font-extrabold text-slate-800 uppercase block text-[9px] truncate">
                                {pompisteList[0].nom} {pompisteList[0].prenom.substring(0, 1)}.
                              </span>
                            ) : (
                              <span className="text-slate-400 italic text-[7.5px]">À pourvoir</span>
                            )}
                          </div>
                          
                          <div className={`${isPrint ? 'p-0.5' : 'p-1'} bg-slate-55 rounded border border-slate-200 leading-tight`}>
                            <span className="text-slate-500 font-extrabold text-[7.5px] uppercase block">Niveau 1070</span>
                            {pompisteList[1] ? (
                              <span className="font-extrabold text-slate-800 uppercase block text-[9px] truncate">
                                {pompisteList[1].nom} {pompisteList[1].prenom.substring(0, 1)}.
                              </span>
                            ) : (
                              <span className="text-slate-400 italic text-[7.5px]">À pourvoir</span>
                            )}
                          </div>
                        </div>
                      )}

                      {sectorTitle === 'Imiter Est' && (
                        <div className="text-slate-400 font-extrabold text-center py-1 text-[10px]">
                          —
                        </div>
                      )}
                    </td>

                    {/* Column 6: EXTRACTION (Only for Imiter 2) */}
                    {sectorTitle === 'Imiter 2' && (
                      <td className={`${isPrint ? 'px-2 py-0.5' : 'px-4 py-2.5'} align-middle min-w-[200px]`}>
                        {extractionPostAssigned === pv ? (
                          <div className="bg-slate-50 p-2 rounded border border-slate-200 space-y-2">
                            <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-1">
                              <span className="text-[8.5px] font-black text-slate-700 tracking-wider uppercase">Équipe Planifiée</span>
                              {!isPrint && (
                                <span className="text-[7.5px] bg-slate-700 text-white px-1.5 py-0.5 font-bold uppercase rounded">
                                  Bure / Contre-puit
                                </span>
                              )}
                            </div>

                            <div className="space-y-1 text-[9.5px]">
                              {/* Treuilliste */}
                              <div>
                                <span className="text-slate-450 italic text-[8px]">Treuilliste:</span>
                                {treuillisteList.length > 0 ? (
                                  <span className="font-extrabold text-slate-800 uppercase ml-1 block">
                                    {treuillisteList[0].nom} {treuillisteList[0].prenom} <span className="font-mono text-slate-400 text-[8px]">({treuillisteList[0].matricule})</span>
                                  </span>
                                ) : (
                                  <span className="text-slate-450 italic ml-1 select-none">À pourvoir</span>
                                )}
                              </div>

                              {/* Ouvriers */}
                              <div>
                                <span className="text-slate-455 italic text-[8px] block mt-1">Ouvriers d'Extraction:</span>
                                <div className="grid grid-cols-2 gap-1 mt-0.5">
                                  {Array.from({ length: 4 }).map((_, i) => {
                                    const worker = ouvrierList[i];
                                    return (
                                      <div key={i} className="bg-white px-1.5 py-0.5 rounded border border-dashed border-slate-200 truncate text-[9px]">
                                        {worker ? (
                                          <span className="font-extrabold text-slate-700 uppercase">
                                            {worker.nom} {worker.prenom.substring(0, 1)}.
                                          </span>
                                        ) : (
                                          <span className="text-slate-300 italic select-none">Eq {i+1} vide</span>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex flex-col items-center justify-center p-1.5 text-center text-slate-400 space-y-1 my-0.5">
                            <span className="text-[8.5px] italic">Non planifiée</span>
                            {!isPrint && (
                              <button
                                onClick={() => {
                                  handleExtractionPostChange(pv);
                                  setSuccessMessage(`Transféré l'équipe d'extraction obligatoire vers le ${pv}.`);
                                  setTimeout(() => setSuccessMessage(null), 4000);
                                }}
                                className="px-2 py-0.5 bg-white hover:bg-slate-800 hover:text-white text-[8.5px] text-slate-700 border border-slate-300 rounded font-bold cursor-pointer transition-all"
                              >
                                Transférer ici
                              </button>
                            )}
                          </div>
                        )}
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const handleExtractionPostChange = (post: 'Poste 1' | 'Poste 2' | 'Poste 3') => {
    setExtractionPostAssigned(post);
    setNextPosts(prev => {
      const updated = { ...prev };
      employees.forEach(emp => {
        if (normalizeSector(emp.sector) === 'Imiter 2' && (emp.fonction === 'TREUILLISTE' || emp.fonction === 'OUVRIER')) {
          updated[emp.id] = post;
        }
      });
      return updated;
    });
  };

  // Sector visual helper
  const getSectorColor = (sec?: string) => {
    if (!sec) return 'bg-gray-100/75 text-gray-750 border-gray-200';
    if (sec.includes('Imiter 2')) return 'bg-purple-50 text-purple-700 border-purple-200';
    if (sec.includes('Imiter 1')) return 'bg-sky-50 text-sky-700 border-sky-200';
    if (sec.includes('Imiter Est')) return 'bg-teal-50 text-teal-700 border-teal-200';
    return 'bg-amber-50 text-amber-700 border-amber-200';
  };

  // Filter lists
  const filteredEmployees = employees.filter(emp => {
    const q = searchQuery.toLowerCase();
    const nameMatch = `${emp.nom} ${emp.prenom} ${emp.matricule}`.toLowerCase().includes(q);
    const sectorMatch = selectedSectorFilter === 'ALL' || (emp.sector || 'Non assigné') === selectedSectorFilter;
    const roleMatch = selectedRoleFilter === 'ALL' || emp.fonction === selectedRoleFilter;
    return nameMatch && sectorMatch && roleMatch;
  });

  // Collect active sectors and roles for filters
  const sectorsInList = Array.from(new Set(employees.map(e => e.sector || 'Non assigné'))).filter(Boolean) as string[];
  const rolesInList = Array.from(new Set(employees.map(e => e.fonction))).filter(Boolean) as string[];

  if (isPrintPreview) {
    return (
      <div className="bg-white min-h-screen p-4 text-slate-900 font-sans space-y-4 print-container">
        <style dangerouslySetInnerHTML={{ __html: `
          @media print {
            body {
              background-color: white !important;
              color: #0f172a !important;
            }
            .print-container {
              width: 100% !important;
              max-width: 100% !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            @page {
              size: landscape;
              margin: 0.3cm;
            }
          }
        ` }} />

        {/* Exportable PDF Content Area */}
        <div id="pdf-content" className="bg-white p-2.5 space-y-2.5">
          {/* Header section with double styled title */}
          <div className="flex justify-between items-center border-b-2 border-slate-900 pb-2">
            <div>
              <div className="flex items-center gap-3">
                <img 
                  src={logoImg} 
                  alt="Hydromines logo" 
                  className="h-10 w-10 object-contain rounded" 
                  referrerPolicy="no-referrer"
                />
                <div>
                  <h1 className="text-lg font-black uppercase text-slate-900 tracking-wider">
                    Hydromines
                  </h1>
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                    Secrétariat de planification site SMI
                  </p>
                </div>
              </div>
            </div>

            <div className="text-right">
              <h2 className="text-[10px] font-black uppercase tracking-wide text-slate-800">
                📋 TABLEAU OFFICIEL DES AFFECTATIONS PAR SECTEURS
              </h2>
              <div className="flex items-center justify-end gap-2.5 mt-1 text-[8px]">
                <span className="font-mono bg-slate-50 text-slate-900 border border-slate-200 py-0.5 px-2 font-bold uppercase tracking-wider rounded">
                  Semaine d'application : Lundi {targetDateStr}
                </span>
                <span className="text-slate-500 font-bold uppercase text-[7.5px]">
                  GÉNÉRÉ LE : {new Date().toLocaleDateString('fr-FR')}
                </span>
              </div>
            </div>
          </div>

          {/* Landscape unified sector tables representing the sector groupings perfectly */}
          <div className="space-y-2.5">
            {renderSectorTable('Imiter 1', true)}
            {renderSectorTable('Imiter 2', true)}
            {renderSectorTable('Imiter Est', true)}
          </div>
        </div>

        {/* Print controls floating bar */}
        <div className="flex justify-end items-center gap-3 pt-3 border-t border-slate-100 print:hidden">
          <button 
            onClick={() => setIsPrintPreview(false)}
            className="px-3 py-1.5 bg-slate-800 text-white text-[10px] font-bold uppercase hover:bg-slate-900 transition-colors cursor-pointer rounded-lg border border-slate-900"
          >
            Quitter
          </button>
          
          <button 
            onClick={() => window.print()}
            className="px-3 py-1.5 bg-slate-100 text-slate-700 hover:bg-slate-200 text-[10px] font-bold uppercase border border-slate-300 rounded-lg flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" /> Impression Directe
          </button>

          <button 
            onClick={handleDownloadPDF}
            disabled={isDownloadingPDF}
            className="px-3 py-1.5 bg-[#00BFFF] text-white text-[10px] font-black uppercase hover:bg-sky-500 disabled:bg-sky-300 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 cursor-pointer rounded-lg shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" /> {isDownloadingPDF ? 'Génération...' : 'Télécharger PDF'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 relative pb-12">
      
      {/* Monday Notification alert block */}
      {isTodayMonday && !validated && (
        <div id="monday-alert-banner" className="bg-[#8B0000] text-white p-4 border-2 border-gray-950 shadow-[4px_4px_0px_0px_#141414] font-black uppercase tracking-wider text-xs flex items-center gap-3 animate-pulse rounded-2xl">
          <ShieldAlert className="w-6 h-6 flex-shrink-0 text-white" />
          <div className="flex-1">
            ⚠️ Attention : Nous sommes Lundi ! La rotation hebdomadaire des équipes doit être vérifiée et validée aujourd'hui pour être prête au tableau d'information.
          </div>
        </div>
      )}

      {/* Success banner alert */}
      {successMessage && (
        <div className="bg-emerald-600 text-white p-4 border-2 border-gray-950 shadow-[4px_4px_0px_0px_#141414] font-black uppercase tracking-wider text-xs flex items-center gap-3 rounded-2xl">
          <CheckCircle2 className="w-6 h-6 flex-shrink-0 text-white fill-emerald-800" />
          <div className="flex-1">{successMessage}</div>
          <button onClick={() => setSuccessMessage(null)} className="hover:scale-110 active:scale-90 font-black px-2 py-1 bg-black/10 rounded cursor-pointer">✕</button>
        </div>
      )}

      {/* Unified Elegant Header Banner with Enlarged Logo and Centered Title */}
      <div 
        id="unified-planning-banner" 
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

          {/* Centered Column: Header Title on One Line, Subtitle, Date & Shift controls */}
          <div className="flex-1 flex flex-col justify-center items-center text-center space-y-3.5 max-w-2xl px-2">
            {/* Upper Decorative Gold Line */}
            <div className="subtle-glow-line w-full opacity-80" />
            
            {/* Premium Gold Shimmer Title - Sized precisely to cover one line */}
            <h1 className="gold-title my-1 select-none text-[15px] sm:text-lg md:text-[20px] lg:text-[22px] tracking-[0.06em] whitespace-normal sm:whitespace-nowrap leading-none">
              CHANGEMENT DE POSTE HEBDOMADAIRE
            </h1>
            
            {/* Lower Decorative Gold Line */}
            <div className="subtle-glow-line w-full opacity-80" />

            {/* Elegant Subtitle with precise spacing */}
            <p 
              className="uppercase tracking-[0.2em] my-1.5 block text-[9px] md:text-[10px] font-extrabold"
              style={{ color: '#64748b', letterSpacing: '0.2em' }}
            >
              HydroMines (SMI) • Équipes Tournantes & Alignement des Ordres d'Exploitation
            </p>

            {/* Centered information/shift capsule */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-1.5">
              <div className="inline-flex items-center gap-2 bg-amber-50/60 border border-amber-100/80 px-3 py-1.5 rounded-xl shadow-xs">
                <CalendarDays className="w-4 h-4 text-amber-700" />
                <span className="text-[10px] font-black uppercase text-amber-800 tracking-wider">
                  Cible d'application : <strong>Lundi {targetDateStr}</strong>
                </span>
              </div>

              {hasDraft && (
                <span className="inline-flex items-center gap-1.5 bg-amber-55 text-amber-800 border border-amber-200 text-[10px] font-black uppercase tracking-wider px-2.5 py-1.5 rounded-xl shadow-xs">
                  📝 Brouillon en cours chargé
                </span>
              )}
            </div>
          </div>

          {/* Validation actions zone */}
          <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-end gap-3 self-center lg:self-stretch min-h-[100px]">
            {/* Save Draft Button */}
            <button
              onClick={saveDraftToCloud}
              disabled={loading || validated}
              className={`flex items-center gap-2 px-4 py-3 rounded-xl border border-gray-200 shadow-sm text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                validated 
                  ? 'bg-gray-150 text-gray-400 cursor-not-allowed border-gray-200' 
                  : 'bg-white hover:bg-gray-50 text-gray-855'
              }`}
              title="Enregistrer les modifications actuelles comme brouillon"
            >
              <Save className="w-4 h-4 text-sky-650" />
              {isSavingDraft ? 'Sauvegarde...' : 'Sauvegarder Brouillon'}
            </button>

            {validated ? (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-250 text-emerald-800 px-4 py-3.5 rounded-xl shadow-xs font-black uppercase tracking-wide text-[10px]">
                <Check className="w-4.5 h-4.5 text-emerald-600 fill-emerald-100" />
                <span>Rotation Validée & active</span>
              </div>
            ) : (
              <button
                onClick={validateWeeklyRotation}
                disabled={loading || employees.length === 0}
                className={`flex items-center gap-2 px-5 py-3.5 rounded-xl shadow-md text-xs font-black uppercase tracking-widest transition-all cursor-pointer border ${
                  loading || employees.length === 0
                    ? 'bg-neutral-100 text-neutral-450 border-neutral-200 cursor-not-allowed'
                    : 'bg-gradient-to-r from-[#b8860b] to-[#ffd700] hover:from-[#a07409] hover:to-[#e5bf4e] text-slate-950 border border-[#b8860b]/30'
                }`}
              >
                <ArrowLeftRight className="w-4.5 h-4.5 text-slate-950" />
                Valider {employees.length} rotations
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Counters & statistics summary bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4 shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xl font-black leading-none text-gray-950">{employees.length}</p>
            <p className="text-[9px] font-black uppercase text-gray-400 tracking-wider">Agents en rotation</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4 shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <Sliders className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xl font-black leading-none text-gray-950">{getManualOverridesCount()}</p>
            <p className="text-[9px] font-black uppercase text-gray-400 tracking-wider">Ajustements Manuels</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4 shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xl font-black leading-none text-gray-950">
              {employees.filter(e => e.currentPost === 'Poste 1').length} / {employees.filter(e => e.currentPost === 'Poste 2').length} / {employees.filter(e => e.currentPost === 'Poste 3').length}
            </p>
            <p className="text-[9px] font-black uppercase text-gray-400 tracking-wider">Répartition Actuelle (P1/P2/P3)</p>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4 shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-[#8B0000]/10 border border-[#8B0000]/20 flex items-center justify-center text-[#8B0000]">
            <Printer className="w-6 h-6" />
          </div>
          <div>
            <button 
              onClick={() => setIsPrintPreview(true)} 
              className="text-xs font-black uppercase text-[#8B0000] hover:underline flex items-center gap-1 cursor-pointer bg-transparent border-0 outline-none"
            >
              📄 Mode d'Impression
            </button>
            <p className="text-[9px] font-bold uppercase text-gray-400 tracking-wider">Générer note d'information</p>
          </div>
        </div>
      </div>

      {/* 📊 REAL-TIME TEAM STRENGTH & ROLE BALANCE PREVIEW */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 md:p-6 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <Grid className="w-5 h-5 text-sky-600" />
            <div>
              <h3 className="text-sm font-black uppercase text-gray-950 tracking-wider">
                📊 ÉQUILIBRE ET EFFECTIF DES POSTES POUR LA SEMAINE PROCHAINE
              </h3>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wide">
                Indicateurs calculés en temps réel d'après les assignations proposées.
              </p>
            </div>
          </div>
          <span className="text-[10px] font-black uppercase bg-sky-50 text-sky-700 px-2.5 py-1 rounded-full border border-sky-100">
            Target : Samedi {targetDateStr}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {['Poste 1', 'Poste 2', 'Poste 3'].map(postKey => {
            const pk = postKey as 'Poste 1' | 'Poste 2' | 'Poste 3';
            const postTally = tallies[pk] || { chefs: 0, mineurs: 0, aides: 0, conducteurs: 0, treuillistes: 0, total: 0 };
            
            return (
              <div key={postKey} className="border border-gray-150 rounded-xl p-4 bg-gray-50/50 space-y-3 shadow-xs">
                <div className="flex items-center justify-between border-b border-gray-200 pb-2">
                  <span className="text-xs font-black uppercase text-gray-950 tracking-wider">{postKey}</span>
                  <span className="text-xs font-mono font-black text-sky-600 bg-sky-50 border border-sky-200/50 rounded px-2">
                    {postTally.total} {postTally.total > 1 ? 'Membres' : 'Membre'}
                  </span>
                </div>

                <div className="space-y-2 text-[10.5px]">
                  <div className="flex justify-between items-center bg-white p-2 rounded-lg border border-gray-100">
                    <span className="font-semibold text-gray-600 uppercase">👨‍💼 Chefs de Poste</span>
                    <span className={`font-mono font-black border text-[10px] py-0.5 px-2 rounded ${
                      postTally.chefs === 0 
                        ? 'bg-amber-50 text-amber-600 border-amber-200 animate-pulse' 
                        : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    }`}>
                      {postTally.chefs}
                    </span>
                  </div>

                  <div className="flex justify-between items-center bg-white p-2 rounded-lg border border-gray-100">
                    <span className="font-semibold text-gray-600 uppercase">⛏️ Mineurs / Foreurs</span>
                    <span className={`font-mono font-black border text-[10px] py-0.5 px-2 rounded ${
                      postTally.mineurs === 0 
                        ? 'bg-amber-50 text-amber-600 border-amber-200 animate-pulse' 
                        : 'bg-slate-50 text-slate-800 border-slate-200'
                    }`}>
                      {postTally.mineurs}
                    </span>
                  </div>

                  <div className="flex justify-between items-center bg-white p-2 rounded-lg border border-gray-100">
                    <span className="font-semibold text-gray-600 uppercase">🤝 Aides-Mineurs</span>
                    <span className="font-mono font-black bg-slate-50 border border-slate-200 text-slate-800 text-[10px] py-0.5 px-2 rounded">
                      {postTally.aides}
                    </span>
                  </div>

                  <div className="flex justify-between items-center bg-white p-2 rounded-lg border border-gray-100">
                    <span className="font-semibold text-gray-600 uppercase flex items-center">
                      <EpirocST2DIcon className="w-4.5 h-3.5 inline-block mr-1 text-amber-500" /> Conducteurs LHD
                    </span>
                    <span className={`font-mono font-black border text-[10px] py-0.5 px-2 rounded ${
                      postTally.conducteurs === 0 
                        ? 'bg-amber-50 text-amber-600 border-amber-200 animate-pulse' 
                        : 'bg-slate-50 text-slate-800 border-slate-200'
                    }`}>
                      {postTally.conducteurs}
                    </span>
                  </div>

                  <div className="flex justify-between items-center bg-white p-2 rounded-lg border border-gray-100">
                    <span className="font-semibold text-gray-600 uppercase">⚓ Treuillistes</span>
                    <span className={`font-mono font-black border text-[10px] py-0.5 px-2 rounded ${
                      postTally.treuillistes === 0 
                        ? 'bg-slate-50 text-slate-450 border-slate-150' 
                        : 'bg-slate-50 text-slate-800 border-slate-200'
                    }`}>
                      {postTally.treuillistes}
                    </span>
                  </div>
                </div>

                {/* Soft Warning - non-blocking visual prompt */}
                {(postTally.chefs === 0 || postTally.conducteurs === 0 || postTally.mineurs === 0) && (
                  <div className="mt-2 text-[9px] font-bold uppercase text-amber-650 bg-amber-50/55 p-2 rounded-lg border border-amber-200 flex items-start gap-1.5 leading-relaxed">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 text-amber-600" />
                    <span>Poste actif sans rôle critique. Rééquilibrage manuel recommandé.</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Tab Switcher for different views */}
      <div className="flex border-b border-gray-205 gap-2 pb-1">
        <button
          onClick={() => setActiveTab('edit')}
          className={`px-4 py-2.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === 'edit'
              ? 'border-slate-900 text-slate-900 bg-gray-50/50 rounded-t-lg'
              : 'border-transparent text-gray-500 hover:text-gray-950 bg-transparent'
          }`}
        >
          ⚙️ Commutations & Préparation d'Équipe
        </button>
        <button
          onClick={() => setActiveTab('board')}
          className={`px-4 py-2.5 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === 'board'
              ? 'border-[#00BFFF] text-[#00BFFF] bg-sky-50/20 rounded-t-lg'
              : 'border-transparent text-gray-500 hover:text-gray-950 bg-transparent'
          }`}
        >
          📋 Tableau Officiel des Affectations par Secteurs
        </button>
      </div>

      {activeTab === 'board' ? (
        <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-gray-150 pb-4 gap-4">
            <div>
              <h3 className="text-base font-black uppercase text-slate-900 tracking-wider">
                📋 Tableau des Affectations par Secteurs • {targetDateStr}
              </h3>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wide">
                Visualisez la structure définitive théorique par poste et secteur. Renseignez directement les engins.
              </p>
            </div>
            
            <button
              onClick={() => setIsPrintPreview(true)}
              className="px-3 py-1.5 bg-[#8B0000] text-white hover:bg-red-800 rounded-lg text-[10.5px] font-black uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors"
            >
              <Printer className="w-4 h-4" /> Imprimer le Tableau Officiel
            </button>
          </div>

          <div className="space-y-6">
            {renderSectorTable('Imiter 1', false)}
            {renderSectorTable('Imiter 2', false)}
            {renderSectorTable('Imiter Est', false)}
          </div>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
        
        {/* Interactive Filters Bar */}
        <div className="p-4 bg-gray-50/70 border-b border-gray-150 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-1 flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px] max-w-sm">
              <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-2.5" />
              <input
                type="text"
                placeholder="Rechercher nom, prénom, matricule..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-gray-950 focus:border-gray-950 transition-all bg-white"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery('')} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-950 cursor-pointer bg-transparent border-0">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Sector Filter */}
            <select
              value={selectedSectorFilter}
              onChange={e => setSelectedSectorFilter(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs font-black uppercase text-gray-705 bg-white focus:outline-none cursor-pointer"
            >
              <option value="ALL">📍 Tous Secteurs</option>
              {sectorsInList.map(sec => (
                <option key={sec} value={sec}>📍 {sec}</option>
              ))}
            </select>

            {/* Role Filter */}
            <select
              value={selectedRoleFilter}
              onChange={e => setSelectedRoleFilter(e.target.value)}
              className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs font-black uppercase text-gray-750 bg-white focus:outline-none cursor-pointer"
            >
              <option value="ALL">👔 Toutes Fonctions</option>
              {rolesInList.map(role => (
                <option key={role} value={role}>👔 {getRoleLabel(role)}</option>
              ))}
            </select>
          </div>

          {/* Quick Actions Shortcuts tools */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={applyStandardAutomaticRotation}
              className="px-3 py-1.5 bg-sky-50 text-sky-700 border border-sky-100 hover:bg-sky-100 rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-all"
              title="Réappliquer la rotation de poste automatique standard (+1 poste)"
            >
              <RotateCcw className="w-3 h-3 text-sky-600" />
              Rotation Auto (+1)
            </button>

            {/* Micro-Dropdown for Bulk Selection changes */}
            {selectedEmpIds.length > 0 && (
              <div className="bg-amber-50 border border-amber-205 px-2.5 py-1.5 rounded-lg flex items-center gap-2 animate-fade-in text-[9px] font-black uppercase tracking-wider">
                <span className="text-amber-800">Assigner les {selectedEmpIds.length} sélectionné(s) :</span>
                <div className="flex gap-1">
                  {['Poste 1', 'Poste 2', 'Poste 3'].map(postOpt => (
                    <button
                      key={postOpt}
                      onClick={() => handleBulkAssign(postOpt as any)}
                      className="px-1.5 py-0.5 bg-white hover:bg-gray-100 border border-gray-200 rounded text-[9px] font-bold text-gray-800 cursor-pointer"
                    >
                      {postOpt}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* List Content */}
        <div className="overflow-x-auto bg-white">
          {loading ? (
            <div className="p-12 text-center text-gray-400 font-bold uppercase text-xs tracking-wider flex flex-col items-center gap-2">
              <RefreshCw className="w-5 h-5 text-[#00BFFF] animate-spin" />
              <span>Chargement du personnel actif...</span>
            </div>
          ) : filteredEmployees.length === 0 ? (
            <div className="p-12 text-center text-gray-400 font-bold uppercase text-xs">
              Aucun collaborateur trouvé pour les filtres actifs.
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-50/70 border-b border-gray-200">
                  <th className="p-3 text-[10px] font-black uppercase text-gray-700 w-12 text-center">
                    <input
                      type="checkbox"
                      checked={selectedEmpIds.length === filteredEmployees.length && filteredEmployees.length > 0}
                      onChange={() => handleSelectAll(filteredEmployees)}
                      className="rounded accent-sky-600 cursor-pointer"
                    />
                  </th>
                  <th className="p-3 text-[10px] font-black uppercase text-gray-700">Matricule</th>
                  <th className="p-3 text-[10px] font-black uppercase text-gray-700">Nom & Prénom</th>
                  <th className="p-3 text-[10px] font-black uppercase text-gray-700">Fonction de production</th>
                  <th className="p-3 text-[10px] font-black uppercase text-gray-700">Secteur</th>
                  <th className="p-3 text-[10px] font-black uppercase text-gray-700 text-center">Poste actuel</th>
                  <th className="p-3 text-[10px] font-black uppercase text-gray-700 text-center">Poste cible</th>
                  <th className="p-3 text-[10px] font-black uppercase text-gray-700 text-center">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredEmployees.map((employee) => {
                  const currentPost = employee.currentPost || '';
                  const toPost = nextPosts[employee.id] || '';
                  const hasChange = currentPost !== toPost;
                  const isOverridden = toPost !== getNextPost(currentPost);
                  const isSelected = selectedEmpIds.includes(employee.id);

                  return (
                    <tr 
                      key={employee.id} 
                      className={`transition-colors group ${
                        isSelected 
                          ? 'bg-amber-50/30' 
                          : hasChange 
                            ? 'bg-[#00BFFF]/5 hover:bg-[#00BFFF]/10' 
                            : 'hover:bg-neutral-50/50'
                      }`}
                    >
                      {/* Selection Box */}
                      <td className="p-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectOne(employee.id)}
                          className="rounded accent-sky-600 cursor-pointer"
                        />
                      </td>

                      {/* Matricule */}
                      <td className="p-3 font-mono font-bold text-[#8B0000] text-xs">
                        {employee.matricule}
                      </td>

                      {/* Name */}
                      <td className="p-3 font-black uppercase text-xs text-slate-800">
                        {employee.nom} {employee.prenom}
                      </td>

                      {/* Fonction */}
                      <td className="p-3 text-xs">
                        <span className="font-semibold text-gray-600 bg-gray-100/70 border border-gray-150 px-2 py-0.5 rounded text-[9.5px] uppercase">
                          {getRoleLabel(employee.fonction)}
                        </span>
                      </td>

                      {/* Secteur */}
                      <td className="p-3">
                        <span className={`inline-block px-2 py-0.5 border rounded-full text-[9px] font-bold ${getSectorColor(employee.sector)}`}>
                          🗺️ {employee.sector || 'Non assigné'}
                        </span>
                      </td>

                      {/* Current Post */}
                      <td className="p-3 text-center">
                        {currentPost ? (
                          <span className="inline-block px-2.5 py-1 bg-gray-100 text-gray-800 font-black text-[10px] uppercase rounded-lg border border-gray-200">
                            {currentPost}
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-1 bg-amber-50 text-amber-700 text-[9.5px] font-bold uppercase rounded border border-amber-200">
                            Non configuré
                          </span>
                        )}
                      </td>

                      {/* Next Post Overridable Selector */}
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <select
                            value={toPost}
                            onChange={(e) => handleSinglePostChange(employee.id, e.target.value as any)}
                            className="bg-white border border-gray-200 px-2.5 py-1 text-[10.5px] rounded-lg font-black uppercase text-gray-800 outline-none focus:ring-1 focus:ring-sky-600 cursor-pointer"
                          >
                            <option value="">Pas d'assignation</option>
                            <option value="Poste 1">Poste 1</option>
                            <option value="Poste 2">Poste 2</option>
                            <option value="Poste 3">Poste 3</option>
                          </select>

                          {/* Fast toggle icon */}
                          <button
                            onClick={() => toggleNextPostQuickly(employee.id)}
                            className="p-1 text-slate-400 hover:text-sky-600 bg-slate-50 hover:bg-slate-100 rounded border border-gray-200 cursor-pointer"
                            title="Passer rapidement au poste suivant (Toggle cycle)"
                          >
                            <RefreshCw className="w-3 h-3" />
                          </button>
                        </div>
                      </td>

                      {/* Change indication status badge */}
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {isOverridden ? (
                            <span className="inline-flex items-center text-[8.5px] bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full font-black uppercase tracking-wider">
                              ✨ Saisie Manuelle
                            </span>
                          ) : hasChange ? (
                            <span className="inline-flex items-center text-[8.5px] bg-[#00BFFF]/20 text-[#00BFFF] border border-[#00BFFF]/30 px-2 py-0.5 rounded-full font-black uppercase tracking-wider gap-0.5">
                              <ArrowRight className="w-3 h-3" />
                              Cycle Auto
                            </span>
                          ) : (
                            <span className="inline-block text-[8.5px] bg-neutral-100 text-neutral-400 px-2 py-0.5 rounded-full font-bold">
                              = Inchangé
                            </span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
      )}

      {/* Admin Information guidelines block */}
      <div className="bg-neutral-50 border border-gray-200 rounded-2xl p-5 shadow-xs text-[10.5px] leading-relaxed text-gray-500 space-y-2">
        <h3 className="font-extrabold uppercase text-gray-900 text-xs flex items-center gap-1.5">
          <Info className="w-4 h-4 text-[#8B0000]" />
          Règles Métier & Traçabilité des Ordres de Services
        </h3>
        <p>
          1. <strong>Cycle de Permutation</strong> : Le cycle standard théorique respecte la boucle de rotation uniforme : <strong>Poste 1 → Poste 2 → Poste 3 → Poste 1</strong>.
        </p>
        <p>
          2. <strong>Brouillon de Préparation</strong> : Les planificateurs peuvent sauvegarder de manière transitoire leur travail en cours en amont, avant d'effectuer la validation officielle et le déploiement.
        </p>
        <p>
          3. <strong>Saisie Manuelle d'Ajustement</strong> : Le secrétaire peut modifier de façon chirurgicale le poste programmé pour un mineur ou chef, le système l'identifiera explicitement comme une <strong>saisie manuelle</strong>.
        </p>
        <p>
          4. <strong>Validation Hebdomadaire</strong> : Elle est irréversible, consigne l'opération dans les journaux d'audit de sécurité des informations SMI, et substitue les postes d'exploitation de base.
        </p>
      </div>
    </div>
  );
};
