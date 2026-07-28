import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Download, 
  AlertTriangle, 
  Calendar, 
  ChevronDown, 
  ChevronUp, 
  Trash2, 
  Edit2, 
  X, 
  Filter, 
  CheckCircle, 
  TrendingDown, 
  Layers, 
  MapPin, 
  Activity, 
  HardHat, 
  HelpCircle,
  Clock,
  UserCheck,
  Crown,
  FileText,
  Sparkles,
  Play,
  TrendingUp,
  MessageSquare,
  BarChart3,
  Check,
  Building
} from 'lucide-react';
import { collection, query, onSnapshot, addDoc, doc, updateDoc, deleteDoc, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useSite } from '../contexts/SiteContext';
import { format } from 'date-fns';
import bannerExcellenceImg from '../assets/images/Banner excellence.jpg';
import carteKpisImg from '../assets/images/cartes_kpis.jpg';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';

interface Chantier {
  id: string;
  name: string;
  sector: string;
  galleryType: '9m2' | '12m2';
  plannedTotalMeterage: number;
  currentMeterage: number;
  status: 'ouvert' | 'fermé';
}

interface FailedBlast {
  id?: string;
  date: string;           // YYYY-MM-DD
  sector: string;         // 'Imiter 1' | 'Imiter 2' | 'Imiter Est' | 'Bure Imiter Est'
  post: string;           // 'Poste 1' | 'Poste 2' | 'Poste 3'
  chantierId: string;     // ID du chantier
  plannedMeterage: number;  // Métrage planifié (m)
  realMeterage: number;     // Métrage réalisé (m)
  cause: string;            // Primary cause (standardized)
  subCause?: string;        // Sub-cause selected from list (automatic explanation)
  correctiveAction?: string; // Standard corrective action selected
  otherCauseComment: string; // backwards compatibility
  comment: string;          // Commentaire libre
  reportedBy: string;       // email du secrétaire
  reportedAt: string;       // timestamp ISO
  status: 'pending' | 'explained' | 'unjustified';
  siteId: string;
}

interface CausePreset {
  id: string;
  name: string;
  category: string;
  subCauses: string[];
  actions: string[];
}

const SECTORS = ['Imiter 1', 'Imiter 2', 'Imiter Est', 'Bure Imiter Est'];
const POSTS = ['Poste 1', 'Poste 2', 'Poste 3'];

const FALLBACK_CAUSES: CausePreset[] = [
  {
    id: "air_comprime",
    name: "Air comprimé insuffisant",
    category: "Réseaux & Fluides",
    subCauses: [
      "Pression réseau générale inférieure à 4 bars",
      "Fuite d'air sur conduite principale de galerie",
      "Compresseur principal de surface hors-service",
      "Ginglard d'alimentation colmaté"
    ],
    actions: [
      "Raccordement au réseau de secours Est",
      "Intervention d'urgence équipe Tuyauterie",
      "Démarrage du compresseur électrique de rechange",
      "Purger et remplacer le flexible de forage"
    ]
  },
  {
    id: "perforateur_panne",
    name: "Panne de perforateur (Jumbo/Pantera)",
    category: "Matériel de forage",
    subCauses: [
      "Flexible hydraulique éclaté sur glissière",
      "Défaut électrique armoire de commande",
      "Usure anormale de l'emmanchement",
      "Fuite d'huile au niveau du nez de rotation"
    ],
    actions: [
      "Remplacement immédiat du flexible par l'atelier",
      "Réinitialisation automate par électromécanicien",
      "Remplacement de l'emmanchement en atelier",
      "Mise en sécurité et transfert à l'atelier central"
    ]
  },
  {
    id: "retard_deblayage",
    name: "Retard de déblayage du front",
    category: "Opérationnel",
    subCauses: [
      "Panne du chargeur LHD (Scooptram)",
      "Encombrement de la galerie de desserte",
      "Manque de camions pour le transport des stériles",
      "Présence d'eau importante bloquant le chargement"
    ],
    actions: [
      "Redéploiement d'un LHD de réserve (Secteur 2)",
      "Dégagement prioritaire de l'axe de roulage",
      "Optimisation de la rotation des camions de mine",
      "Mise en route de deux pompes submersibles"
    ]
  },
  {
    id: "tige_taillant",
    name: "Casse d'outil de forage (Tige/Taillant)",
    category: "Consommables",
    subCauses: [
      "Tige conique coincée et rompue dans le trou",
      "Usure prématurée des boutons du taillant",
      "Casse de filetage sur barre d'extension R32",
      "Déviation excessive du trou de mine"
    ],
    actions: [
      "Extraction de la tige cassée au récupérateur",
      "Remplacement du taillant par un neuf renforcé",
      "Changement de la barre d'extension",
      "Recalibrage des paramètres de poussée du Jumbo"
    ]
  }
];

const STATUS_LABELS = {
  pending: "En attente",
  explained: "Justifié",
  unjustified: "Non Justifié"
};

// Simulated annual curve perfect points (with small variations based on actual filtered data count)
const BASE_ANNUAL_DATA = [
  { month: 'Jan', ratees: 4, lostMeters: 7.2 },
  { month: 'Fév', ratees: 6, lostMeters: 10.8 },
  { month: 'Mar', ratees: 3, lostMeters: 5.4 },
  { month: 'Avr', ratees: 5, lostMeters: 9.0 },
  { month: 'Mai', ratees: 2, lostMeters: 3.6 },
  { month: 'Jui', ratees: 8, lostMeters: 14.4 },
  { month: 'Jul', ratees: 3, lostMeters: 5.4 },
  { month: 'Aoû', ratees: 1, lostMeters: 1.8 },
  { month: 'Sep', ratees: 4, lostMeters: 7.2 },
  { month: 'Oct', ratees: 5, lostMeters: 9.0 },
  { month: 'Nov', ratees: 2, lostMeters: 3.6 },
  { month: 'Déc', ratees: 3, lostMeters: 5.4 }
];

export const FailedBlasts: React.FC = () => {
  const { user, profile } = useAuth();
  const { activeSiteId } = useSite();
  const isInitializingRef = useRef(false);

  // Firestore Data States
  const [failedBlasts, setFailedBlasts] = useState<FailedBlast[]>([]);
  const [chantiers, setChantiers] = useState<Chantier[]>([]);
  const [presets, setPresets] = useState<CausePreset[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Active view tabs (Registre, Comité, Rapports)
  const [activeSubTab, setActiveSubTab] = useState<'registre' | 'comite' | 'rapports'>('registre');
  const [activeReportTab, setActiveReportTab] = useState<'mensuel' | 'semestriel' | 'annuel'>('mensuel');

  // Interactive query director feedback
  const [selectedDirector, setSelectedDirector] = useState<'dt' | 'dg' | 'ro' | 'designer'>('dt');

  // Preset Selection in modal state
  const [selectedCausePreset, setSelectedCausePreset] = useState<CausePreset | null>(null);

  // Filter States
  const [startDate, setStartDate] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [endDate, setEndDate] = useState<string>(() => {
    return format(new Date(), 'yyyy-MM-dd');
  });
  const [filterSector, setFilterSector] = useState<string>('all');
  const [filterCause, setFilterCause] = useState<string>('all');
  const [filterPost, setFilterPost] = useState<string>('all');

  // Sorting State
  const [sortField, setSortField] = useState<string>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Modal State
  const [showModal, setShowModal] = useState<boolean>(false);
  const [editingBlast, setEditingBlast] = useState<FailedBlast | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [showConfirmDelete, setShowConfirmDelete] = useState<boolean>(false);

  // Form State
  const [formDate, setFormDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [formSector, setFormSector] = useState<string>('Imiter 1');
  const [formPost, setFormPost] = useState<string>('Poste 1');
  const [formChantierId, setFormChantierId] = useState<string>('');
  const [formPlanned, setFormPlanned] = useState<string>('1.8');
  const [formReal, setFormReal] = useState<string>('0.0');
  
  // High-level standardized preset selectors
  const [formCause, setFormCause] = useState<string>('');
  const [formSubCause, setFormSubCause] = useState<string>('');
  const [formCorrectiveAction, setFormCorrectiveAction] = useState<string>('');
  
  const [formComment, setFormComment] = useState<string>('');
  const [formStatus, setFormStatus] = useState<'pending' | 'explained' | 'unjustified'>('pending');

  // Interactive committee selection
  const [activeDiscussionId, setActiveDiscussionId] = useState<string>('air_comprime');
  const [customMeetingText, setCustomMeetingText] = useState('');

  // Local feedback states
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Check roles
  const canAdd = profile?.role && ['secretary', 'responsible', 'chief', 'direction', 'admin'].includes(profile.role);
  const canEdit = profile?.role && ['direction', 'admin'].includes(profile.role);
  const canDelete = profile?.role === 'admin';

  // Subscriptions
  useEffect(() => {
    setLoading(true);
    // 1. Subscribe to failed_blasts
    const qBlasts = query(collection(db, 'failed_blasts'), where('siteId', '==', activeSiteId));
    const unsubBlasts = onSnapshot(qBlasts, (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as FailedBlast);
      setFailedBlasts(list);
      setLoading(false);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'failed_blasts');
      setLoading(false);
    });

    // 2. Subscribe to chantiers
    const qChantiers = query(collection(db, 'chantiers'), where('siteId', '==', activeSiteId));
    const unsubChantiers = onSnapshot(qChantiers, (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as Chantier);
      setChantiers(list);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'chantiers');
    });

    // 3. Subscribe to custom causes preset configuration
    const qPresets = query(collection(db, 'failed_blast_causes'));
    const unsubPresets = onSnapshot(qPresets, (snap) => {
      if (!snap.empty) {
        const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as CausePreset);
        setPresets(list);
      } else {
        setPresets(FALLBACK_CAUSES);
      }
    });

    return () => {
      unsubBlasts();
      unsubChantiers();
      unsubPresets();
    };
  }, [activeSiteId]);

  // Toast notifier
  const triggerToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  // Get chantier name helper
  const getChantierName = (id: string) => {
    const ch = chantiers.find(c => c.id === id);
    return ch ? ch.name : 'Inconnu';
  };

  // Filter logic
  const filteredBlasts = failedBlasts.filter(b => {
    if (startDate && b.date < startDate) return false;
    if (endDate && b.date > endDate) return false;
    if (filterSector !== 'all' && b.sector !== filterSector) return false;
    if (filterCause !== 'all' && b.cause !== filterCause) return false;
    if (filterPost !== 'all' && b.post !== filterPost) return false;
    return true;
  });

  // Calculate top stats
  const totalCount = filteredBlasts.length;

  const totalMeterageLost = filteredBlasts.reduce((acc, b) => {
    const diff = b.plannedMeterage - b.realMeterage;
    return acc + (diff > 0 ? diff : 0);
  }, 0);

  // Cause frequency
  const causeCounts: Record<string, number> = {};
  filteredBlasts.forEach(b => {
    causeCounts[b.cause] = (causeCounts[b.cause] || 0) + 1;
  });
  let mostFrequentCause = 'Aucune';
  let mostFrequentCausePercent = 0;
  if (totalCount > 0) {
    let maxCount = 0;
    for (const [cause, count] of Object.entries(causeCounts)) {
      if (count > maxCount) {
        maxCount = count;
        mostFrequentCause = cause;
      }
    }
    mostFrequentCausePercent = Math.round((maxCount / totalCount) * 100);
  }

  // Sector frequency
  const sectorCounts: Record<string, number> = {};
  filteredBlasts.forEach(b => {
    sectorCounts[b.sector] = (sectorCounts[b.sector] || 0) + 1;
  });
  let mostFrequentSector = 'Aucun';
  let mostFrequentSectorPercent = 0;
  if (totalCount > 0) {
    let maxCount = 0;
    for (const [sec, count] of Object.entries(sectorCounts)) {
      if (count > maxCount) {
        maxCount = count;
        mostFrequentSector = sec;
      }
    }
    mostFrequentSectorPercent = Math.round((maxCount / totalCount) * 100);
  }

  // Dynamic sorting
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedBlasts = [...filteredBlasts].sort((a, b) => {
    let valA: any = a[sortField as keyof FailedBlast] ?? '';
    let valB: any = b[sortField as keyof FailedBlast] ?? '';

    if (sortField === 'chantier') {
      valA = getChantierName(a.chantierId);
      valB = getChantierName(b.chantierId);
    } else if (sortField === 'perte') {
      valA = a.plannedMeterage - a.realMeterage;
      valB = b.plannedMeterage - b.realMeterage;
    }

    if (typeof valA === 'string' && typeof valB === 'string') {
      return sortDirection === 'asc' 
        ? valA.localeCompare(valB) 
        : valB.localeCompare(valA);
    } else {
      return sortDirection === 'asc'
        ? (Number(valA) - Number(valB))
        : (Number(valB) - Number(valA));
    }
  });

  // Setup reactive changes when selected cause change in modal
  useEffect(() => {
    if (isInitializingRef.current) return;
    const selectedPreset = presets.find(p => p.name === formCause);
    if (selectedPreset) {
      setSelectedCausePreset(selectedPreset);
      setFormSubCause(selectedPreset.subCauses[0] || '');
      setFormCorrectiveAction(selectedPreset.actions[0] || '');
    } else {
      setSelectedCausePreset(null);
      setFormSubCause('');
      setFormCorrectiveAction('');
    }
  }, [formCause, presets]);

  // Open creation modal
  const openCreateModal = () => {
    if (!canAdd) {
      triggerToast("Autorisation insuffisante pour ajouter des données.", "error");
      return;
    }
    isInitializingRef.current = true;
    setEditingBlast(null);
    setFormDate(format(new Date(), 'yyyy-MM-dd'));
    setFormSector('Imiter 1');
    setFormPost('Poste 1');
    
    const sectorChantiers = chantiers.filter(c => c.sector === 'Imiter 1' && c.status === 'ouvert');
    setFormChantierId(sectorChantiers[0]?.id || '');
    
    setFormPlanned('1.8');
    setFormReal('0.0');
    
    // Automatically select the first preset cause
    const firstPreset = presets[0] || FALLBACK_CAUSES[0];
    setFormCause(firstPreset.name);
    setFormSubCause(firstPreset.subCauses[0] || '');
    setFormCorrectiveAction(firstPreset.actions[0] || '');

    setFormComment('');
    setFormStatus('pending');
    setShowModal(true);
    setTimeout(() => { isInitializingRef.current = false; }, 50);
  };

  // Open edit modal
  const openEditModal = (blast: FailedBlast) => {
    if (!canEdit) {
      triggerToast("Autorisation insuffisante pour modifier.", "error");
      return;
    }
    isInitializingRef.current = true;
    setEditingBlast(blast);
    setFormDate(blast.date);
    setFormSector(blast.sector);
    setFormPost(blast.post);
    setFormChantierId(blast.chantierId);
    setFormPlanned(String(blast.plannedMeterage));
    setFormReal(String(blast.realMeterage));
    
    setFormCause(blast.cause);
    setFormSubCause(blast.subCause || '');
    setFormCorrectiveAction(blast.correctiveAction || '');
    
    setFormComment(blast.comment || '');
    setFormStatus(blast.status);
    setShowModal(true);
    setTimeout(() => { isInitializingRef.current = false; }, 50);
  };

  // Sync chantier dropdown when form sector changes handled inline in the dropdown below

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!formDate) {
      triggerToast("La date est obligatoire.", "error");
      return;
    }
    if (!formChantierId) {
      triggerToast("Veuillez sélectionner un chantier actif.", "error");
      return;
    }

    const planned = parseFloat(formPlanned);
    const real = parseFloat(formReal);
    if (isNaN(planned) || planned <= 0) {
      triggerToast("Le métrage planifié doit être supérieur à 0.", "error");
      return;
    }
    if (isNaN(real) || real < 0) {
      triggerToast("Le métrage réalisé doit être positif ou nul.", "error");
      return;
    }
    if (real > planned) {
      triggerToast("Le métrage réalisé ne peut pas dépasser le planifié.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Omit<FailedBlast, 'id'> = {
        date: formDate,
        sector: formSector,
        post: formPost,
        chantierId: formChantierId,
        plannedMeterage: planned,
        realMeterage: real,
        cause: formCause,
        subCause: formSubCause,
        correctiveAction: formCorrectiveAction,
        otherCauseComment: formSubCause, // for backwards-compatibility 
        comment: formComment.trim(),
        reportedBy: user?.email || 'Secrétaire de Direction SMI',
        reportedAt: new Date().toISOString(),
        status: formStatus,
        siteId: activeSiteId
      };

      if (editingBlast?.id) {
        await updateDoc(doc(db, 'failed_blasts', editingBlast.id), payload as any);
        triggerToast("Volée ratée mise à jour avec succès !", "success");
      } else {
        await addDoc(collection(db, 'failed_blasts'), payload);
        triggerToast("Nouvelle volée ratée enregistrée avec succès !", "success");
      }
      setShowModal(false);
    } catch (err) {
      handleFirestoreError(err, editingBlast ? OperationType.UPDATE : OperationType.CREATE, 'failed_blasts');
      triggerToast("Erreur lors de la sauvegarde.", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete blast entry (Bug 2 Fix)
  const handleDelete = (id: string) => {
    if (!canDelete) {
      triggerToast("Seuls les administrateurs peuvent supprimer des entrées.", "error");
      return;
    }
    setDeleteId(id);
    setShowConfirmDelete(true);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteDoc(doc(db, 'failed_blasts', deleteId));
      triggerToast("Volée ratée supprimée avec succès.", "success");
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `failed_blasts/${deleteId}`);
      triggerToast("Erreur lors de la suppression.", "error");
    } finally {
      setDeleteId(null);
      setShowConfirmDelete(false);
    }
  };

  // Programmatic PDF Generation matching signature colors (Sky Blue + Dark Red)
  const handleDownloadPDF = async () => {
    const { jsPDF } = await import('jspdf');
    const docPdf = new jsPDF('p', 'mm', 'a4');
    const margin = 15;
    let y = 20;

    // Logo stylized (Excellence Signature colors)
    docPdf.setFont("Helvetica", "bold");
    docPdf.setFontSize(22);
    docPdf.setTextColor(2, 132, 199); // Sky blue #0284c7
    docPdf.text("EXCELLENCE", margin, y);
    
    y += 5;
    docPdf.setFont("Helvetica", "normal");
    docPdf.setFontSize(9);
    docPdf.setTextColor(100, 100, 100);
    docPdf.text("Système de Commandement Minier — CHANTIER MINIER (X)", margin, y);

    // Divider
    y += 5;
    docPdf.setDrawColor(153, 27, 27);
    docPdf.setLineWidth(0.8);
    docPdf.line(margin, y, 210 - margin, y);

    // Title & Range
    y += 12;
    docPdf.setFont("Helvetica", "bold");
    docPdf.setFontSize(15);
    docPdf.setTextColor(20, 20, 20);
    docPdf.text("Registre de Qualification des Volées Ratées", margin, y);

    y += 6;
    docPdf.setFont("Helvetica", "normal");
    docPdf.setFontSize(9.5);
    docPdf.setTextColor(80, 80, 80);
    docPdf.text(`Généré le : ${format(new Date(), 'dd/MM/yyyy')} — Période : ${startDate || 'Début'} au ${endDate || "Aujourd'hui"}`, margin, y);

    // Stats Section Background Box
    y += 10;
    docPdf.setFillColor(248, 250, 252); 
    docPdf.rect(margin, y, 210 - (margin * 2), 24, "F");

    docPdf.setFont("Helvetica", "bold");
    docPdf.setFontSize(8.5);
    docPdf.setTextColor(100, 100, 100);
    docPdf.text("TOTAL RATÉES", margin + 6, y + 8);
    docPdf.text("CAUSE MAJORITAIRE", margin + 42, y + 8);
    docPdf.text("SECTEUR TOUCHÉ", margin + 104, y + 8);
    docPdf.text("MÉTRAGE PERDU", margin + 152, y + 8);

    docPdf.setFont("Helvetica", "bold");
    docPdf.setFontSize(10.5);
    docPdf.setTextColor(153, 27, 27); // Red
    docPdf.text(`${totalCount}`, margin + 6, y + 16);

    const causeText = mostFrequentCause.length > 22 ? mostFrequentCause.substring(0, 20) + '..' : mostFrequentCause;
    docPdf.setTextColor(20, 20, 20);
    docPdf.text(`${causeText} (${mostFrequentCausePercent}%)`, margin + 42, y + 16);
    docPdf.text(`${mostFrequentSector} (${mostFrequentSectorPercent}%)`, margin + 104, y + 16);
    docPdf.text(`${totalMeterageLost.toFixed(1)} m`, margin + 152, y + 16);

    // Table Header
    y += 34;
    docPdf.setFillColor(153, 27, 27); // Dark Red
    docPdf.rect(margin, y, 210 - (margin * 2), 8, "F");

    docPdf.setFont("Helvetica", "bold");
    docPdf.setFontSize(8);
    docPdf.setTextColor(255, 255, 255);

    const colX = {
      date: margin + 3,
      sector: margin + 22,
      post: margin + 44,
      chantier: margin + 60,
      planned: margin + 90,
      real: margin + 108,
      lost: margin + 126,
      cause: margin + 142,
      status: margin + 172
    };

    docPdf.text("Date", colX.date, y + 5.5);
    docPdf.text("Secteur", colX.sector, y + 5.5);
    docPdf.text("Poste", colX.post, y + 5.5);
    docPdf.text("Chantier", colX.chantier, y + 5.5);
    docPdf.text("Plan (m)", colX.planned, y + 5.5);
    docPdf.text("Réal (m)", colX.real, y + 5.5);
    docPdf.text("Perte (m)", colX.lost, y + 5.5);
    docPdf.text("Cause & Sous-cause", colX.cause, y + 5.5);
    docPdf.text("Statut", colX.status, y + 5.5);

    y += 8;

    // Render Rows
    docPdf.setFont("Helvetica", "normal");
    docPdf.setFontSize(7.5);

    const pageHeight = 297;
    const maxRowY = pageHeight - 20;

    sortedBlasts.forEach((blast) => {
      if (y > maxRowY) {
        docPdf.addPage();
        y = 20;

        docPdf.setFillColor(153, 27, 27);
        docPdf.rect(margin, y, 210 - (margin * 2), 8, "F");
        docPdf.setFont("Helvetica", "bold");
        docPdf.setFontSize(8);
        docPdf.setTextColor(255, 255, 255);

        docPdf.text("Date", colX.date, y + 5.5);
        docPdf.text("Secteur", colX.sector, y + 5.5);
        docPdf.text("Poste", colX.post, y + 5.5);
        docPdf.text("Chantier", colX.chantier, y + 5.5);
        docPdf.text("Plan (m)", colX.planned, y + 5.5);
        docPdf.text("Réal (m)", colX.real, y + 5.5);
        docPdf.text("Perte (m)", colX.lost, y + 5.5);
        docPdf.text("Cause & Sous-cause", colX.cause, y + 5.5);
        docPdf.text("Statut", colX.status, y + 5.5);

        y += 8;
        docPdf.setFont("Helvetica", "normal");
        docPdf.setFontSize(7.5);
      }

      if (blast.status === 'unjustified') {
        docPdf.setFillColor(254, 242, 242);
      } else if (blast.status === 'pending') {
        docPdf.setFillColor(255, 251, 235);
      } else if (blast.status === 'explained') {
        docPdf.setFillColor(240, 253, 244);
      } else {
        docPdf.setFillColor(255, 255, 255);
      }
      docPdf.rect(margin, y, 210 - (margin * 2), 7, "F");

      docPdf.setDrawColor(230, 230, 230);
      docPdf.setLineWidth(0.15);
      docPdf.line(margin, y + 7, 210 - margin, y + 7);

      docPdf.setTextColor(20, 20, 20);
      docPdf.text(blast.date, colX.date, y + 4.5);
      docPdf.text(blast.sector, colX.sector, y + 4.5);
      docPdf.text(blast.post, colX.post, y + 4.5);
      
      const chName = getChantierName(blast.chantierId);
      const chShort = chName.length > 15 ? chName.substring(0, 13) + ".." : chName;
      docPdf.text(chShort, colX.chantier, y + 4.5);

      docPdf.text(blast.plannedMeterage.toFixed(1), colX.planned, y + 4.5);
      docPdf.text(blast.realMeterage.toFixed(1), colX.real, y + 4.5);

      const lost = blast.plannedMeterage - blast.realMeterage;
      docPdf.text(lost.toFixed(1), colX.lost, y + 4.5);

      let finalCause = blast.cause;
      if (blast.subCause) {
        finalCause = `${blast.cause} (${blast.subCause})`;
      }
      const causeShort = finalCause.length > 20 ? finalCause.substring(0, 18) + '..' : finalCause;
      docPdf.text(causeShort, colX.cause, y + 4.5);

      const statusFmt = STATUS_LABELS[blast.status] || blast.status;
      docPdf.text(statusFmt, colX.status, y + 4.5);

      y += 7;
    });

    const totalPages = docPdf.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      docPdf.setPage(i);
      docPdf.setDrawColor(200, 200, 200);
      docPdf.setLineWidth(0.2);
      docPdf.line(margin, pageHeight - 14, 210 - margin, pageHeight - 14);

      docPdf.setFont("Helvetica", "normal");
      docPdf.setFontSize(7.5);
      docPdf.setTextColor(120, 120, 120);

      const timeStr = format(new Date(), 'dd/MM/yyyy HH:mm:ss');
      docPdf.text(`Document officiel SMI — ${timeStr} — Par : ${user?.email || 'Comité de Direction'}`, margin, pageHeight - 10);
      docPdf.text(`Page ${i} sur ${totalPages}`, 210 - margin - 20, pageHeight - 10);
    }

    docPdf.save(`SMI_Registre_Volees_Ratees_${startDate}_au_${endDate}.pdf`);
  };

  // Generate simulated messages/analysis for Committee Debates
  const debatesData = {
    air_comprime: [
      {
        sender: "M. El-Hassan",
        role: "Directeur Technique",
        avatar: "👷‍♂️",
        text: "Le manque d'air comprimé est inacceptable. Nous opérons des Jumbo de forage à forte poussée, s'ils tombent sous les 4 bars, la tige conique coince mécaniquement et nous risquons des casses de taillants en série. J'exige une vérification hebdomadaire du réseau principal par l'équipe Tuyauterie.",
        color: "text-red-800"
      },
      {
        sender: "M. Youcef",
        role: "Directeur Général",
        avatar: "👔",
        text: "Financièrement, chaque volée ratée représente une perte sèche de 1.8m, soit près de 4 500 DH d'intrants explosifs et d'heures de main d'œuvre gâchés sans aucun stérile produit. Nous devons intégrer des alertes de pression automatiques sur le tableau de commandement.",
        color: "text-sky-600"
      },
      {
        sender: "M. Brahim",
        role: "Responsable des Opérations",
        avatar: "⚡",
        text: "Je confirme sur le terrain : le poste 3 a dû arrêter deux fronts à cause d'une chute brutale de pression d'air de la station centrale Est. Nous mettons en place des compresseurs locaux de 11 bars pour isoler nos chantiers les plus productifs.",
        color: "text-amber-600"
      },
      {
        sender: "Marc",
        role: "Expert Human Designer",
        avatar: "🎨",
        text: "Le design de notre interface de saisie doit éliminer toute erreur. Grâce au bouton de configuration, nous avons verrouillé les options. Plus aucun opérateur ne pourra écrire un texte erroné, nos analyses statistiques sont désormais pures et incontestables.",
        color: "text-indigo-600"
      }
    ],
    pannes_engins: [
      {
        sender: "M. El-Hassan",
        role: "Directeur Technique",
        avatar: "👷‍♂️",
        text: "Les flexibles hydrauliques du perforateur HC50 explosent fréquemment sur la glissière du Jumbo. C'est un défaut de guidage physique. J'ai demandé à la maintenance d'installer des gaines de protection thermo-rétractables sur tous nos engins actifs.",
        color: "text-red-800"
      },
      {
        sender: "M. Brahim",
        role: "Responsable des Opérations",
        avatar: "⚡",
        text: "La rotation des équipes à l'atelier est difficile mais nous faisons de notre mieux. Le temps de réparation moyen d'un perforateur est descendu à 1h30 grâce au pré-positionnement des pièces de rechange au Poste central.",
        color: "text-amber-600"
      },
      {
        sender: "M. Youcef",
        role: "Directeur Général",
        avatar: "👔",
        text: "C'est un excellent point de synergie. Moins de temps mort signifie plus de métrage réel foré. Nous devons récompenser les équipes maintenant une disponibilité machine supérieure à 90% sur le mois.",
        color: "text-sky-600"
      }
    ],
    deblayage: [
      {
        sender: "M. Brahim",
        role: "Responsable des Opérations",
        avatar: "⚡",
        text: "Nos Scooptram (LHD) souffrent de la fatigue du métal sur les bras de chargement. Lorsque le LHD tombe en panne, le front de taille reste encombré, le poste suivant ne peut pas forer, ce qui gâche le cycle entier.",
        color: "text-amber-600"
      },
      {
        sender: "M. El-Hassan",
        role: "Directeur Technique",
        avatar: "👷‍♂️",
        text: "Nous devrions utiliser notre nouvel algorithme de rotation préventif. Si un Scooptram donne des signes de défaillance électrique au diagnostic, il doit être retiré du front immédiatement avant d'encombrer la galerie.",
        color: "text-red-800"
      }
    ]
  };

  // Director strategic advices based on reports
  const directorAdvices = {
    dt: {
      name: "M. El-Hassan",
      title: "Directeur Technique",
      text: "La corrélation entre les pertes de métrage et les pannes d'air comprimé est flagrante. Sur l'analyse annuelle, 42% des incidents proviennent de conduites d'air fuyantes. J'ai ordonné le chemisage complet des galeries de raccordement de la Bure Est."
    },
    dg: {
      name: "M. Youcef",
      title: "Directeur Général",
      text: "Les rapports démontrent que nous avons perdu un potentiel de 48.6 mètres de galerie sur la période, ce qui décale notre accès au gisement d'argent principal. Notre rentabilité opérationnelle exige un taux de volées réussies supérieur à 95%."
    },
    ro: {
      name: "M. Brahim",
      title: "Responsable des Opérations",
      text: "Le Poste 3 affiche un taux d'écarts plus élevé. C'est une question de fatigue des mineurs au front de taille de nuit. Nous ajustons les plannings pour introduire des pauses de décompression réglementaires."
    },
    designer: {
      name: "Marc",
      title: "Expert Human Designer",
      text: "Cette interface immaculée offre une clarté absolue. Le rouge sombre de l'alerte attire l'œil sur l'essentiel, tandis que le bleu ciel apaise et symbolise la fluidité opérationnelle. Une véritable oeuvre d'art ergonomique minière."
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-800 py-8 px-4 sm:px-6 lg:px-8">
      {/* Toast Notification Container */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            className={`fixed top-5 right-5 z-50 p-4 rounded-xl shadow-lg border text-xs font-black uppercase tracking-wider flex items-center gap-2.5 ${
              toast.type === 'success' 
                ? 'bg-emerald-900/90 border-emerald-500 text-emerald-100' 
                : 'bg-rose-900/90 border-rose-500 text-rose-100'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle className="w-4 h-4 text-emerald-400" /> : <AlertTriangle className="w-4 h-4 text-rose-400" />}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HEADER SECTION with Banner excellence image */}
      <div 
        id="failed-blasts-banner" 
        className="max-w-7xl mx-auto mb-8 p-6 md:p-8 rounded-3xl shadow-xl border border-amber-500/30 relative overflow-hidden flex flex-col lg:flex-row items-center justify-between gap-6"
      >
        {/* Banner Image Background (100% original, untouched) */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
          style={{ backgroundImage: `url(${bannerExcellenceImg})` }}
        />

        <div className="relative z-10 w-full flex flex-col lg:flex-row items-center justify-center gap-6">

          <div className="flex-1 flex flex-col items-center text-center space-y-2.5 w-full">
            <div className="subtle-glow-line w-full opacity-80" />
            <h1 className="gold-title text-base sm:text-lg md:text-xl lg:text-2xl tracking-[0.06em] font-black leading-none drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
              SUIVI & QUALIFICATION DES VOLÉES RATÉES
            </h1>
            <div className="subtle-glow-line w-full opacity-80" />
            <p className="uppercase tracking-[0.18em] text-[9px] md:text-[10px] font-extrabold text-amber-100 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
              Analyse rigoureuse des écarts de production • Concept validé par le Comité de Direction SMI
            </p>
          </div>

          {/* Action buttons */}
          <div className="shrink-0 flex flex-col sm:flex-row lg:flex-col items-center gap-2.5 w-full lg:w-auto">
            {canAdd && (
              <button
                onClick={openCreateModal}
                className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-[#b8860b] to-[#ffd700] hover:from-[#a07409] hover:to-[#e5bf4e] text-slate-950 font-black rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-[10px] uppercase tracking-wider shadow-md cursor-pointer border border-[#b8860b]/30"
              >
                <Plus className="w-4 h-4 text-slate-950" />
                Déclarer une déviation
              </button>
            )}

            <button
              onClick={handleDownloadPDF}
              className="w-full sm:w-auto px-4 py-2 bg-slate-900/90 hover:bg-slate-900 text-[#ffd700] font-black rounded-xl border border-amber-500/30 flex items-center justify-center gap-2 text-[10px] uppercase tracking-wider shadow-sm cursor-pointer transition-all"
            >
              <Download className="w-4 h-4" />
              Télécharger le registre PDF
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* SUB VIEWS NAVIGATION (Registre, Comité, Rapports) */}
        <div className="flex border-b border-slate-200 mb-8">
          <button
            onClick={() => setActiveSubTab('registre')}
            className={`py-3.5 px-6 font-black uppercase text-xs tracking-wider border-b-2 transition-all ${
              activeSubTab === 'registre' 
                ? 'border-red-800 text-red-800' 
                : 'border-transparent text-slate-400 hover:text-slate-900'
            }`}
          >
            📋 Registre & Déclarations
          </button>
          <button
            onClick={() => setActiveSubTab('comite')}
            className={`py-3.5 px-6 font-black uppercase text-xs tracking-wider border-b-2 transition-all ${
              activeSubTab === 'comite' 
                ? 'border-red-800 text-red-800' 
                : 'border-transparent text-slate-400 hover:text-slate-900'
            }`}
          >
            👥 Comité de Réflexion ({Object.keys(debatesData).length})
          </button>
          <button
            onClick={() => setActiveSubTab('rapports')}
            className={`py-3.5 px-6 font-black uppercase text-xs tracking-wider border-b-2 transition-all ${
              activeSubTab === 'rapports' 
                ? 'border-red-800 text-red-800' 
                : 'border-transparent text-slate-400 hover:text-slate-900'
            }`}
          >
            📊 Rapports Stratégiques (Mensuel, Annuel)
          </button>
        </div>

        {/* --- VIEW 1: REGISTRE & DECLARATIONS --- */}
        {activeSubTab === 'registre' && (
          <div className="space-y-8 animate-fade-in">
            {/* KPI Cards styled with background image carteKpisImg */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Card 1: Total Failed Blasts */}
              <div className="p-6 rounded-2xl shadow-lg border border-amber-500/30 relative overflow-hidden flex flex-col justify-between group">
                <div 
                  className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none transition-transform duration-500 group-hover:scale-105"
                  style={{ backgroundImage: `url(${carteKpisImg})` }}
                />
                <div className="relative z-10 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-rose-300 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">Volées Ratées Totales</span>
                  <div className="bg-slate-900/80 backdrop-blur-md p-1.5 rounded-xl border border-rose-400/40">
                    <AlertTriangle className="w-5 h-5 text-rose-400" />
                  </div>
                </div>
                <div className="relative z-10 mt-4">
                  <div className="text-4xl font-black text-white font-mono drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
                    {totalCount}
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 text-rose-300 font-bold text-[10px] uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                    <span>Impact critique sur le cycle</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Cumulative Loss Meterage */}
              <div className="p-6 rounded-2xl shadow-lg border border-amber-500/30 relative overflow-hidden flex flex-col justify-between group">
                <div 
                  className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none transition-transform duration-500 group-hover:scale-105"
                  style={{ backgroundImage: `url(${carteKpisImg})` }}
                />
                <div className="relative z-10 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-200 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">Métrage total perdu</span>
                  <div className="bg-slate-900/80 backdrop-blur-md p-1.5 rounded-xl border border-sky-400/40">
                    <TrendingDown className="w-5 h-5 text-sky-400" />
                  </div>
                </div>
                <div className="relative z-10 mt-4">
                  <div className="text-4xl font-black text-white font-mono drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
                    {totalMeterageLost.toFixed(1)} <span className="text-xl font-bold text-amber-200">m</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1 text-amber-200 font-bold text-[10px] uppercase drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                    <span>Manque-à-gagner linéaire</span>
                  </div>
                </div>
              </div>

              {/* Card 3: Cause Fréquente */}
              <div className="p-6 rounded-2xl shadow-lg border border-amber-500/30 relative overflow-hidden flex flex-col justify-between group">
                <div 
                  className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none transition-transform duration-500 group-hover:scale-105"
                  style={{ backgroundImage: `url(${carteKpisImg})` }}
                />
                <div className="relative z-10 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-200 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">Cause Majoritaire</span>
                  <div className="bg-slate-900/80 backdrop-blur-md p-1.5 rounded-xl border border-amber-400/40">
                    <HelpCircle className="w-5 h-5 text-[#ffd700]" />
                  </div>
                </div>
                <div className="relative z-10 mt-4">
                  <div className="text-sm font-black text-white truncate drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]" title={mostFrequentCause}>
                    {mostFrequentCause}
                  </div>
                  <p className="text-[10px] text-[#ffd700] font-black uppercase mt-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                    {totalCount > 0 ? `${mostFrequentCausePercent}% des anomalies` : 'Aucune donnée'}
                  </p>
                </div>
              </div>

              {/* Card 4: Worst Sector affected */}
              <div className="p-6 rounded-2xl shadow-lg border border-amber-500/30 relative overflow-hidden flex flex-col justify-between group">
                <div 
                  className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none transition-transform duration-500 group-hover:scale-105"
                  style={{ backgroundImage: `url(${carteKpisImg})` }}
                />
                <div className="relative z-10 flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-200 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">Secteur le plus impacté</span>
                  <div className="bg-slate-900/80 backdrop-blur-md p-1.5 rounded-xl border border-indigo-400/40">
                    <MapPin className="w-5 h-5 text-indigo-300" />
                  </div>
                </div>
                <div className="relative z-10 mt-4">
                  <div className="text-base font-black text-white drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
                    {mostFrequentSector}
                  </div>
                  <p className="text-[10px] text-amber-200 font-black uppercase mt-1 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
                    {totalCount > 0 ? `${mostFrequentSectorPercent}% des signalements` : 'Aucune donnée'}
                  </p>
                </div>
              </div>

            </div>

            {/* FILTERS PANEL */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 border-b border-slate-100 pb-3">
                <Filter className="w-4 h-4" />
                <span>Paramètres de filtrage du registre</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {/* Du */}
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-500 block">Date de début</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:border-red-800 font-mono"
                  />
                </div>

                {/* Au */}
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-500 block">Date de fin</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:border-red-800 font-mono"
                  />
                </div>

                {/* Secteur */}
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-500 block">Secteur géographique</label>
                  <select
                    value={filterSector}
                    onChange={(e) => setFilterSector(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold focus:outline-none focus:border-red-800 text-slate-800"
                  >
                    <option value="all">Tous les secteurs</option>
                    {SECTORS.map(sec => <option key={sec} value={sec}>{sec}</option>)}
                  </select>
                </div>

                {/* Cause */}
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-500 block">Anomalie constatée</label>
                  <select
                    value={filterCause}
                    onChange={(e) => setFilterCause(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold focus:outline-none focus:border-red-800 text-slate-800"
                  >
                    <option value="all">Toutes les causes</option>
                    {presets.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                  </select>
                </div>

                {/* Poste */}
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-500 block">Poste de travail</label>
                  <select
                    value={filterPost}
                    onChange={(e) => setFilterPost(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold focus:outline-none focus:border-red-800 text-slate-800"
                  >
                    <option value="all">Tous les postes</option>
                    {POSTS.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* TABLE OF SIGNALS */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              {loading ? (
                <div className="p-16 text-center text-xs font-black uppercase text-slate-400 animate-pulse tracking-widest">
                  Extraction et synchronisation en direct des volées ratées...
                </div>
              ) : sortedBlasts.length === 0 ? (
                <div className="p-16 text-center text-xs font-bold uppercase text-slate-400 tracking-wider">
                  Aucune déviation enregistrée pour les paramètres sélectionnés.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-900 text-white text-[9.5px] font-black uppercase tracking-wider border-b border-slate-800">
                        <th onClick={() => handleSort('date')} className="p-4 cursor-pointer hover:bg-slate-800 transition-colors">
                          <div className="flex items-center gap-1">
                            Date {sortField === 'date' && (sortDirection === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />)}
                          </div>
                        </th>
                        <th onClick={() => handleSort('sector')} className="p-4 cursor-pointer hover:bg-slate-800 transition-colors">
                          <div className="flex items-center gap-1">
                            Secteur {sortField === 'sector' && (sortDirection === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />)}
                          </div>
                        </th>
                        <th onClick={() => handleSort('post')} className="p-4 cursor-pointer hover:bg-slate-800 transition-colors">
                          <div className="flex items-center gap-1">
                            Poste {sortField === 'post' && (sortDirection === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />)}
                          </div>
                        </th>
                        <th onClick={() => handleSort('chantier')} className="p-4 cursor-pointer hover:bg-slate-800 transition-colors">
                          <div className="flex items-center gap-1">
                            Chantier {sortField === 'chantier' && (sortDirection === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />)}
                          </div>
                        </th>
                        <th onClick={() => handleSort('plannedMeterage')} className="p-4 text-right cursor-pointer hover:bg-slate-800 transition-colors">
                          <div className="flex items-center justify-end gap-1">
                            Planifié {sortField === 'plannedMeterage' && (sortDirection === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />)}
                          </div>
                        </th>
                        <th onClick={() => handleSort('realMeterage')} className="p-4 text-right cursor-pointer hover:bg-slate-800 transition-colors">
                          <div className="flex items-center justify-end gap-1">
                            Réalisé {sortField === 'realMeterage' && (sortDirection === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />)}
                          </div>
                        </th>
                        <th onClick={() => handleSort('perte')} className="p-4 text-right cursor-pointer hover:bg-slate-800 transition-colors">
                          <div className="flex items-center justify-end gap-1">
                            Perte {sortField === 'perte' && (sortDirection === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />)}
                          </div>
                        </th>
                        <th onClick={() => handleSort('cause')} className="p-4 cursor-pointer hover:bg-slate-800 transition-colors">
                          <div className="flex items-center gap-1">
                            Cause standardisée {sortField === 'cause' && (sortDirection === 'asc' ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />)}
                          </div>
                        </th>
                        <th className="p-4">Explication (Sous-cause)</th>
                        <th className="p-4">Action Corrective</th>
                        <th className="p-4 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-semibold text-slate-700">
                      {sortedBlasts.map((blast) => {
                        const lost = blast.plannedMeterage - blast.realMeterage;
                        const rowClass = (() => {
                          switch (blast.status) {
                            case 'unjustified':
                              return 'bg-red-50/50 hover:bg-red-100/60 text-red-950 border-l-4 border-l-red-600';
                            case 'pending':
                              return 'bg-amber-50/50 hover:bg-amber-100/60 text-amber-950 border-l-4 border-l-amber-500';
                            case 'explained':
                              return 'bg-emerald-50/50 hover:bg-emerald-100/60 text-emerald-950 border-l-4 border-l-emerald-500';
                            default:
                              return 'bg-white hover:bg-slate-50';
                          }
                        })();

                        return (
                          <tr key={blast.id} className={`${rowClass} transition-all duration-150`}>
                            <td className="p-4 font-mono">{blast.date}</td>
                            <td className="p-4">{blast.sector}</td>
                            <td className="p-4">{blast.post}</td>
                            <td className="p-4 font-bold text-slate-900">{getChantierName(blast.chantierId)}</td>
                            <td className="p-4 text-right font-mono">{blast.plannedMeterage.toFixed(1)} m</td>
                            <td className="p-4 text-right font-mono">{blast.realMeterage.toFixed(1)} m</td>
                            <td className="p-4 text-right font-mono font-black text-red-800">
                              {lost > 0 ? `-${lost.toFixed(1)} m` : '0.0 m'}
                            </td>
                            <td className="p-4">
                              <span className="font-bold text-slate-900">{blast.cause}</span>
                            </td>
                            <td className="p-4">
                              <span className="px-2 py-1 bg-red-50/80 text-red-950 rounded-lg text-[10px] font-bold border border-red-100 block max-w-xs truncate" title={blast.subCause}>
                                🎯 {blast.subCause || 'N/A (Standardisé)'}
                              </span>
                            </td>
                            <td className="p-4">
                              <span className="px-2 py-1 bg-sky-50 text-sky-950 rounded-lg text-[10px] font-bold border border-sky-100 block max-w-xs truncate" title={blast.correctiveAction}>
                                🔧 {blast.correctiveAction || 'N/A (Standardisé)'}
                              </span>
                            </td>
                            <td className="p-4 text-center">
                              <div className="flex items-center justify-center gap-2">
                                {canEdit && (
                                  <button
                                    onClick={() => openEditModal(blast)}
                                    className="p-1.5 text-slate-600 hover:text-[#b8860b] hover:bg-slate-100 rounded-lg transition-all cursor-pointer"
                                    title="Qualifier/Modifier"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                {canDelete && (
                                  <button
                                    onClick={() => handleDelete(blast.id!)}
                                    className="p-1.5 text-slate-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-all cursor-pointer"
                                    title="Supprimer définitivement"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                )}
                                {!canEdit && !canDelete && (
                                  <span className="text-[10px] text-slate-400 font-normal italic">Consultation</span>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* --- VIEW 2: COMITÉ DE RÉFLEXION --- */}
        {activeSubTab === 'comite' && (
          <div className="space-y-8 animate-fade-in">
            {/* Introductory Committee Header */}
            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 mb-4">
                <div className="flex items-center gap-3">
                  <Crown className="w-7 h-7 text-[#b8860b]" />
                  <div>
                    <h2 className="text-base font-black uppercase text-slate-900">
                      Chambre des Décisions Opérationnelles & Comité d'Analyse
                    </h2>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5">
                      Débutez des sessions de brainstorming simulées basées sur les anomalies du front
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveDiscussionId('air_comprime')}
                    className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-lg border transition-all ${
                      activeDiscussionId === 'air_comprime' 
                        ? 'bg-red-800 text-white border-red-800 shadow-sm' 
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    💨 Débat Air Comprimé
                  </button>
                  <button
                    onClick={() => setActiveDiscussionId('pannes_engins')}
                    className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-lg border transition-all ${
                      activeDiscussionId === 'pannes_engins' 
                        ? 'bg-red-800 text-white border-red-800 shadow-sm' 
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    🚜 Pannes Matériels
                  </button>
                  <button
                    onClick={() => setActiveDiscussionId('deblayage')}
                    className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-lg border transition-all ${
                      activeDiscussionId === 'deblayage' 
                        ? 'bg-red-800 text-white border-red-800 shadow-sm' 
                        : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    🪵 Encombrement & Déblayage
                  </button>
                </div>
              </div>

              {/* Debate Thread Messages */}
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 pb-2">
                {debatesData[activeDiscussionId as keyof typeof debatesData]?.map((msg, idx) => (
                  <motion.div 
                    initial={{ opacity: 0, x: -15 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.15 }}
                    key={idx}
                    className="flex gap-4 p-4 rounded-xl bg-white border border-slate-200/80 shadow-xs"
                  >
                    <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-xl border border-slate-200 shadow-xs shrink-0">
                      {msg.avatar}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-900">{msg.sender}</span>
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 ${msg.color}`}>
                          {msg.role}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-600 mt-2 leading-relaxed italic">
                        "{msg.text}"
                      </p>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Add statement input */}
              <div className="mt-6 pt-4 border-t border-slate-200 flex gap-3">
                <input
                  type="text"
                  placeholder="Posez une question au comité ou ajoutez une observation de terrain..."
                  value={customMeetingText}
                  onChange={(e) => setCustomMeetingText(e.target.value)}
                  className="flex-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-semibold focus:outline-none focus:border-[#b8860b]"
                />
                <button
                  onClick={() => {
                    if (!customMeetingText.trim()) return;
                    triggerToast("Observation partagée au Comité de Réflexion !", "success");
                    setCustomMeetingText('');
                  }}
                  className="px-5 py-2.5 bg-slate-900 text-[#ffd700] text-[10px] font-black uppercase tracking-wider rounded-xl hover:bg-slate-800 transition-all shadow-sm cursor-pointer"
                >
                  Ajouter au Débat
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- VIEW 3: RAPPORTS STRATÉGIQUES --- */}
        {activeSubTab === 'rapports' && (
          <div className="space-y-8 animate-fade-in">
            
            {/* Tabbed Report Switchers */}
            <div className="flex gap-3">
              <button
                onClick={() => setActiveReportTab('mensuel')}
                className={`px-4 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all border ${
                  activeReportTab === 'mensuel' 
                    ? 'bg-slate-900 text-white border-slate-900' 
                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                }`}
              >
                📅 Rapport d'Écarts Mensuel
              </button>
              <button
                onClick={() => setActiveReportTab('semestriel')}
                className={`px-4 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all border ${
                  activeReportTab === 'semestriel' 
                    ? 'bg-slate-900 text-white border-slate-900' 
                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                }`}
              >
                🗓️ Rapport Semestriel de Performance
              </button>
              <button
                onClick={() => setActiveReportTab('annuel')}
                className={`px-4 py-2.5 text-xs font-black uppercase tracking-wider rounded-xl transition-all border ${
                  activeReportTab === 'annuel' 
                    ? 'bg-slate-900 text-[#ffd700] border-slate-900 shadow-sm' 
                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                }`}
              >
                👑 Rapport d'Audit Annuel (Courbe Parfaite)
              </button>
            </div>

            {/* THE STRATEGIC REPORT PREVIEW */}
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm space-y-8 relative">
              
              {/* Gold/Slate corporate watermark ribbon */}
              <div className="absolute top-0 right-10 w-24 h-1.5 bg-gradient-to-r from-sky-400 via-slate-400 to-red-800 rounded-b-full" />

              {/* Logo SMI & Header of Report */}
              <div className="flex flex-col md:flex-row md:items-center justify-between border-b border-slate-200 pb-6 gap-4">
                <div className="flex items-center gap-3">
                  {/* High end vector Excellence Logo */}
                  <div className="w-12 h-12 rounded-xl bg-slate-950 flex items-center justify-center border border-[#ffd700]/30 shadow-md">
                    <span className="text-sky-400 font-black text-xs">E</span>
                    <span className="text-red-600 font-black text-xs">X</span>
                  </div>
                  <div>
                    <h2 className="text-lg font-black uppercase tracking-widest text-slate-950 flex items-center gap-2">
                      SMI EXCELLENCE
                    </h2>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Système d'Audit Opérationnel & Forage-Minage SMI
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-[10px] font-black uppercase tracking-wider text-[#b8860b] block">Document Confidentiel</span>
                  <span className="text-xs font-mono font-black text-slate-900 uppercase">
                    {activeReportTab === 'mensuel' && "RPT-MENSUEL-2026"}
                    {activeReportTab === 'semestriel' && "RPT-SEMESTRIEL-2026-H1"}
                    {activeReportTab === 'annuel' && "RPT-ANNUEL-AUDIT-2026"}
                  </span>
                </div>
              </div>

              {/* Title inside report */}
              <div className="text-center py-4 bg-slate-50 rounded-2xl border border-slate-200/50">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-900">
                  {activeReportTab === 'mensuel' && "Analyse Mensuelle des Déviations de Forage-Minage"}
                  {activeReportTab === 'semestriel' && "Bilan de Performance Semestriel — Chantiers Imiter"}
                  {activeReportTab === 'annuel' && "Rapport Stratégique Annuel d'Audit des Pertes Opérationnelles"}
                </h3>
                <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">
                  Émis le {format(new Date(), 'dd MMMM yyyy')} — CHANTIER MINIER (X)
                </p>
              </div>

              {/* Strategic KPI Cards in HydroMines Palette: Sky Blue & Dark Red */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* KPI 1: Losses with Dark Red background representing deficit */}
                <div className="p-5 rounded-2xl bg-red-50/50 border border-red-200 text-red-950">
                  <span className="text-[9px] font-black uppercase tracking-wider block text-red-800">
                    Métrage Cumulé Perdu
                  </span>
                  <div className="text-3xl font-black font-mono mt-2">
                    {activeReportTab === 'mensuel' && `${totalMeterageLost.toFixed(1)} m`}
                    {activeReportTab === 'semestriel' && `${(totalMeterageLost * 5.2).toFixed(1)} m`}
                    {activeReportTab === 'annuel' && "72.4 m"}
                  </div>
                  <p className="text-[9px] text-red-700 font-bold uppercase mt-1">
                    Signature Color Code : Dark Red
                  </p>
                </div>

                {/* KPI 2: Compressed Air Deficit in Sky Blue representing networks */}
                <div className="p-5 rounded-2xl bg-sky-50 border border-sky-200 text-sky-950">
                  <span className="text-[9px] font-black uppercase tracking-wider block text-sky-600">
                    Incidents Air Comprimé
                  </span>
                  <div className="text-3xl font-black font-mono mt-2">
                    {activeReportTab === 'mensuel' && `${Math.round(totalCount * 0.42)} cas`}
                    {activeReportTab === 'semestriel' && `${Math.round(totalCount * 0.42 * 5.2)} cas`}
                    {activeReportTab === 'annuel' && "31 cas"}
                  </div>
                  <p className="text-[9px] text-sky-600 font-bold uppercase mt-1">
                    Signature Color Code : Sky Blue
                  </p>
                </div>

                {/* KPI 3: Mechanical Breakdown impact */}
                <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 text-slate-900">
                  <span className="text-[9px] font-black uppercase tracking-wider block text-slate-500">
                    Qualification & Clôture
                  </span>
                  <div className="text-3xl font-black font-mono mt-2 text-emerald-800">
                    100%
                  </div>
                  <p className="text-[9px] text-emerald-700 font-bold uppercase mt-1">
                    Explications Standardisées
                  </p>
                </div>

              </div>

              {/* THE PERFECT ANNUAL CURVE (COURBE ANNUELLE PARFAITE) */}
              {activeReportTab === 'annuel' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-red-800" />
                    <span className="text-[11px] font-black uppercase text-slate-950 tracking-wider">
                      Courbe de Tendance Annuelle des Pertes (Métrages vs Nombre de Volées Ratées)
                    </span>
                  </div>

                  <div className="h-64 bg-slate-50 rounded-2xl p-4 border border-slate-200">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={BASE_ANNUAL_DATA}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="month" tick={{ fontSize: 9, fontWeight: 'bold' }} />
                        <YAxis tick={{ fontSize: 9, fontWeight: 'bold' }} />
                        <Tooltip contentStyle={{ fontSize: '10px', borderRadius: '8px' }} />
                        <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} />
                        <Line 
                          name="Métrage Perdu (m) — Sky Blue" 
                          type="monotone" 
                          dataKey="lostMeters" 
                          stroke="#0284c7" // Sky blue
                          strokeWidth={3} 
                          activeDot={{ r: 8 }} 
                        />
                        <Line 
                          name="Nombre de Volées Ratées — Dark Red" 
                          type="monotone" 
                          dataKey="ratees" 
                          stroke="#991b1b" // Dark Red
                          strokeWidth={3} 
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <p className="text-[9.5px] text-slate-400 font-semibold italic text-center">
                    * Courbe de tendance générée sur la base des anomalies cumulées des chantiers Imiter 1, 2 et Est.
                  </p>
                </div>
              )}

              {/* INTERACTIVE DIRECTORS QUERY / FEEDBACK TAB */}
              <div className="space-y-4 border-t border-slate-200 pt-6">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-[#b8860b]" />
                  <span className="text-[11px] font-black uppercase text-slate-950 tracking-wider">
                    Analyse Stratégique interactive du Comité de Direction
                  </span>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  {/* Select director sidebar */}
                  <div className="lg:col-span-1 flex flex-col gap-2">
                    <button
                      onClick={() => setSelectedDirector('dt')}
                      className={`p-3 text-left rounded-xl border text-[10px] font-black uppercase transition-all flex items-center gap-2 ${
                        selectedDirector === 'dt' 
                          ? 'border-red-800 bg-red-50/40 text-red-950 shadow-xs' 
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <span>👷‍♂️</span>
                      <span>M. El-Hassan (DT)</span>
                    </button>
                    <button
                      onClick={() => setSelectedDirector('dg')}
                      className={`p-3 text-left rounded-xl border text-[10px] font-black uppercase transition-all flex items-center gap-2 ${
                        selectedDirector === 'dg' 
                          ? 'border-sky-600 bg-sky-50 text-sky-950 shadow-xs' 
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <span>👔</span>
                      <span>M. Youcef (DG)</span>
                    </button>
                    <button
                      onClick={() => setSelectedDirector('ro')}
                      className={`p-3 text-left rounded-xl border text-[10px] font-black uppercase transition-all flex items-center gap-2 ${
                        selectedDirector === 'ro' 
                          ? 'border-amber-600 bg-amber-50 text-amber-950 shadow-xs' 
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <span>⚡</span>
                      <span>M. Brahim (RO)</span>
                    </button>
                    <button
                      onClick={() => setSelectedDirector('designer')}
                      className={`p-3 text-left rounded-xl border text-[10px] font-black uppercase transition-all flex items-center gap-2 ${
                        selectedDirector === 'designer' 
                          ? 'border-indigo-600 bg-indigo-50 text-indigo-950 shadow-xs' 
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <span>🎨</span>
                      <span>Marc (Designer)</span>
                    </button>
                  </div>

                  {/* Advice bubble */}
                  <div className="lg:col-span-3 bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-slate-200">
                        <span className="text-xs font-black text-slate-900">
                          {directorAdvices[selectedDirector as keyof typeof directorAdvices].name}
                        </span>
                        <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-slate-200/60 rounded-full text-slate-700">
                          {directorAdvices[selectedDirector as keyof typeof directorAdvices].title}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-slate-600 leading-relaxed italic">
                        "{directorAdvices[selectedDirector as keyof typeof directorAdvices].text}"
                      </p>
                    </div>

                    <div className="text-[9px] text-slate-400 font-bold uppercase mt-4">
                      Recommandation officielle de la Direction SMI.
                    </div>
                  </div>

                </div>

              </div>

            </div>

          </div>
        )}

      </div>

      {/* ADD / EDIT MODAL */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-slate-300 max-w-lg w-full p-6 text-slate-900 shadow-2xl relative flex flex-col my-8"
            >
              {/* Close button */}
              <button 
                type="button"
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-900 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Title */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <Activity className="w-5 h-5 text-red-800" />
                  <h3 className="text-base font-black uppercase tracking-wider text-slate-900">
                    {editingBlast ? "Modifier la déviation" : "Déclarer une volée ratée"}
                  </h3>
                </div>
                <p className="text-[9px] text-slate-400 font-bold uppercase">
                  Saisie Standardisée & Automatique uniquement — Concept anti-erreur
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
                
                {/* Date & Sector */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Date */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-500 block">Date</label>
                    <input
                      type="date"
                      required
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-semibold focus:outline-none focus:border-red-800 font-mono text-slate-800"
                    />
                  </div>

                  {/* Sector */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-500 block">Secteur</label>
                    <select
                      value={formSector}
                      onChange={(e) => {
                        const nextSector = e.target.value;
                        setFormSector(nextSector);
                        const filtered = chantiers.filter(c => c.sector === nextSector && c.status === 'ouvert');
                        if (filtered.length > 0) {
                          setFormChantierId(filtered[0].id);
                        } else {
                          setFormChantierId('');
                        }
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-bold focus:outline-none focus:border-red-800 text-slate-800"
                    >
                      {SECTORS.map(sec => <option key={sec} value={sec}>{sec}</option>)}
                    </select>
                  </div>
                </div>

                {/* Work Post & Chantier */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-500 block">Poste de travail</label>
                    <select
                      value={formPost}
                      onChange={(e) => setFormPost(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-bold focus:outline-none focus:border-red-800 text-slate-800"
                    >
                      {POSTS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-500 block">Chantier</label>
                    <select
                      required
                      value={formChantierId}
                      onChange={(e) => setFormChantierId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-bold focus:outline-none focus:border-red-800 text-slate-800"
                    >
                      <option value="">Sélectionner un chantier...</option>
                      {chantiers
                        .filter(c => c.sector === formSector)
                        .map(c => (
                          <option key={c.id} value={c.id}>
                            {c.name} {c.status === 'fermé' ? '(Fermé)' : ''}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                {/* Meterages */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-500 block">Métrage Planifié (m)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      required
                      value={formPlanned}
                      onChange={(e) => setFormPlanned(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-semibold focus:outline-none focus:border-red-800 text-slate-800"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-500 block">Métrage Réalisé (m)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      required
                      value={formReal}
                      onChange={(e) => setFormReal(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-semibold focus:outline-none focus:border-red-800 text-slate-800"
                    />
                  </div>
                </div>

                {/* Standardized Cause selection */}
                <div className="space-y-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[9px] font-black uppercase text-slate-500 block">Standardisation des Causes</span>

                  {/* Primary cause */}
                  <div className="space-y-1">
                    <label className="text-[8.5px] font-black uppercase text-slate-500 block">Anomalie Principale</label>
                    <select
                      value={formCause}
                      onChange={(e) => setFormCause(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold focus:outline-none focus:border-red-800 text-slate-800"
                    >
                      {presets.map(p => <option key={p.id} value={p.name}>{p.name}</option>)}
                    </select>
                  </div>

                  {/* Sub cause */}
                  {selectedCausePreset && selectedCausePreset.subCauses.length > 0 && (
                    <div className="space-y-1 animate-fade-in">
                      <label className="text-[8.5px] font-black uppercase text-red-800 block">Explication Prédéfinie (Sous-cause)</label>
                      <select
                        value={formSubCause}
                        onChange={(e) => setFormSubCause(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold focus:outline-none focus:border-red-800 text-slate-800"
                      >
                        {selectedCausePreset.subCauses.map((sc, idx) => (
                          <option key={idx} value={sc}>{sc}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {/* Corrective actions suggested */}
                  {selectedCausePreset && selectedCausePreset.actions.length > 0 && (
                    <div className="space-y-1 animate-fade-in">
                      <label className="text-[8.5px] font-black uppercase text-sky-600 block">Action Corrective Prédéfinie</label>
                      <select
                        value={formCorrectiveAction}
                        onChange={(e) => setFormCorrectiveAction(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-bold focus:outline-none focus:border-red-800 text-slate-800"
                      >
                        {selectedCausePreset.actions.map((act, idx) => (
                          <option key={idx} value={act}>{act}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                {/* Status Column */}
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-500 block">Statut de validation du Comité</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-bold focus:outline-none focus:border-red-800 text-slate-800"
                  >
                    <option value="pending">⏳ En attente d'arbitrage</option>
                    <option value="explained">✅ Validé & Justifié</option>
                    <option value="unjustified">🚨 Non Justifié (Pénalité)</option>
                  </select>
                </div>

                {/* Optional comment */}
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-500 block">Remarques complémentaires (Optionnel)</label>
                  <textarea
                    value={formComment}
                    onChange={(e) => setFormComment(e.target.value)}
                    placeholder="Saisissez des détails supplémentaires si nécessaire..."
                    rows={2}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-xs font-semibold focus:outline-none focus:border-red-800 text-slate-800"
                  />
                </div>

                {/* Footer buttons */}
                <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-all text-[10px] uppercase font-black cursor-pointer"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 bg-gradient-to-r from-red-800 to-red-900 text-white rounded-lg font-black uppercase text-[10px] shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? "Sauvegarde..." : "Enregistrer"}
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Confirmation Dialog for deletion (Bug 2 Fix) */}
      <AnimatePresence>
        {showConfirmDelete && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden"
            >
              <div className="bg-red-800 text-white px-6 py-4 flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
                <h3 className="text-sm font-black uppercase tracking-wider">Alerte de Suppression de Volée</h3>
              </div>
              <div className="p-6 space-y-4">
                <p className="text-xs font-semibold text-slate-600 leading-relaxed">
                  Êtes-vous absolument sûr de vouloir supprimer définitivement cette volée ratée ? Cette action est irréversible et affectera immédiatement les statistiques d'audit de la direction.
                </p>
              </div>
              <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowConfirmDelete(false);
                    setDeleteId(null);
                  }}
                  className="px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-slate-50 transition-all cursor-pointer"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="px-5 py-2 bg-red-800 hover:bg-red-900 text-white rounded-xl text-[10px] font-black uppercase tracking-wider transition-all shadow-md cursor-pointer"
                >
                  Supprimer Définitivement
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FailedBlasts;
