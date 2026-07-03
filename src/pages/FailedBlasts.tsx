import React, { useState, useEffect } from 'react';
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
  UserCheck
} from 'lucide-react';
import { collection, query, onSnapshot, addDoc, deleteDoc, doc, updateDoc, where } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useSite } from '../contexts/SiteContext';
import { format } from 'date-fns';
import { jsPDF } from 'jspdf';

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
  cause: string;            // dropdown value
  otherCauseComment: string; // OBLIGATOIRE si cause = 'Autres'
  comment: string;          // Commentaire libre (optionnel)
  reportedBy: string;       // email du secrétaire
  reportedAt: string;       // timestamp ISO
  status: 'pending' | 'explained' | 'unjustified';
  siteId: string;
}

const SECTORS = ['Imiter 1', 'Imiter 2', 'Imiter Est', 'Bure Imiter Est'];
const POSTS = ['Poste 1', 'Poste 2', 'Poste 3'];
const CAUSES = [
  "Tige conique cassée",
  "Retard de déblayage (1h)",
  "Retard de déblayage (2h)",
  "Retard de déblayage (3h ou plus)",
  "Taillant cassé",
  "Air comprimé faible",
  "Absence d'air comprimé",
  "Autres"
];

const STATUS_LABELS = {
  pending: "En attente",
  explained: "Justifié",
  unjustified: "Non Justifié"
};

export const FailedBlasts: React.FC = () => {
  const { user, profile } = useAuth();
  const { activeSiteId } = useSite();

  // Firestore Data States
  const [failedBlasts, setFailedBlasts] = useState<FailedBlast[]>([]);
  const [chantiers, setChantiers] = useState<Chantier[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filter States
  const [startDate, setStartDate] = useState<string>(() => {
    // Default to start of current month
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

  // Form State
  const [formDate, setFormDate] = useState<string>(format(new Date(), 'yyyy-MM-dd'));
  const [formSector, setFormSector] = useState<string>('Imiter 1');
  const [formPost, setFormPost] = useState<string>('Poste 1');
  const [formChantierId, setFormChantierId] = useState<string>('');
  const [formPlanned, setFormPlanned] = useState<string>('1.8');
  const [formReal, setFormReal] = useState<string>('0.0');
  const [formCause, setFormCause] = useState<string>(CAUSES[0]);
  const [formOtherComment, setFormOtherComment] = useState<string>('');
  const [formComment, setFormComment] = useState<string>('');
  const [formStatus, setFormStatus] = useState<'pending' | 'explained' | 'unjustified'>('pending');

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

    return () => {
      unsubBlasts();
      unsubChantiers();
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

  // Calculate top stats (on filtered results)
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

  // Open creation modal
  const openCreateModal = () => {
    if (!canAdd) {
      triggerToast("Autorisation insuffisante pour ajouter des données.", "error");
      return;
    }
    setEditingBlast(null);
    setFormDate(format(new Date(), 'yyyy-MM-dd'));
    setFormSector('Imiter 1');
    setFormPost('Poste 1');
    
    // Auto select first open chantier of that sector if available
    const sectorChantiers = chantiers.filter(c => c.sector === 'Imiter 1' && c.status === 'ouvert');
    setFormChantierId(sectorChantiers[0]?.id || '');
    
    setFormPlanned('1.8');
    setFormReal('0.0');
    setFormCause(CAUSES[0]);
    setFormOtherComment('');
    setFormComment('');
    setFormStatus('pending');
    setShowModal(true);
  };

  // Open edit modal
  const openEditModal = (blast: FailedBlast) => {
    if (!canEdit) {
      triggerToast("Autorisation insuffisante pour modifier.", "error");
      return;
    }
    setEditingBlast(blast);
    setFormDate(blast.date);
    setFormSector(blast.sector);
    setFormPost(blast.post);
    setFormChantierId(blast.chantierId);
    setFormPlanned(String(blast.plannedMeterage));
    setFormReal(String(blast.realMeterage));
    setFormCause(blast.cause);
    setFormOtherComment(blast.otherCauseComment || '');
    setFormComment(blast.comment || '');
    setFormStatus(blast.status);
    setShowModal(true);
  };

  // Sync chantier dropdown when form sector changes
  useEffect(() => {
    if (!editingBlast) {
      const filtered = chantiers.filter(c => c.sector === formSector && c.status === 'ouvert');
      if (filtered.length > 0) {
        setFormChantierId(filtered[0].id);
      } else {
        setFormChantierId('');
      }
    }
  }, [formSector, chantiers, editingBlast]);

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Validation
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

    if (formCause === 'Autres') {
      if (!formOtherComment || formOtherComment.trim().length < 10) {
        triggerToast("Veuillez préciser la cause (minimum 10 caractères obligatoires).", "error");
        return;
      }
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
        otherCauseComment: formCause === 'Autres' ? formOtherComment.trim() : '',
        comment: formComment.trim(),
        reportedBy: user?.email || 'Secrétaire de Direction SMI',
        reportedAt: new Date().toISOString(),
        status: formStatus,
        siteId: activeSiteId
      };

      if (editingBlast?.id) {
        // Edit
        await updateDoc(doc(db, 'failed_blasts', editingBlast.id), payload as any);
        triggerToast("Volée ratée mise à jour avec succès !", "success");
      } else {
        // Add
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

  // Delete blast entry
  const handleDelete = async (id: string) => {
    if (!canDelete) {
      triggerToast("Seuls les administrateurs peuvent supprimer des entrées.", "error");
      return;
    }
    if (!window.confirm("Êtes-vous absolument sûr de vouloir supprimer définitivement cette volée ratée ?")) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'failed_blasts', id));
      triggerToast("Volée ratée supprimée avec succès.", "success");
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `failed_blasts/${id}`);
      triggerToast("Erreur lors de la suppression.", "error");
    }
  };

  // Programmatic PDF Generation matching exactly the specified visual guidelines
  const handleDownloadPDF = () => {
    const docPdf = new jsPDF('p', 'mm', 'a4');
    const margin = 15;
    let y = 20;

    // Logo stylized
    docPdf.setFont("Helvetica", "bold");
    docPdf.setFontSize(20);
    docPdf.setTextColor(184, 134, 11); // gold #b8860b
    docPdf.text("HYDROMINES", margin, y);
    
    y += 5;
    docPdf.setFont("Helvetica", "normal");
    docPdf.setFontSize(9);
    docPdf.setTextColor(100, 100, 100);
    docPdf.text("Système de Commandement Minier", margin, y);

    // Divider
    y += 5;
    docPdf.setDrawColor(184, 134, 11);
    docPdf.setLineWidth(0.8);
    docPdf.line(margin, y, 210 - margin, y);

    // Title & Range
    y += 12;
    docPdf.setFont("Helvetica", "bold");
    docPdf.setFontSize(15);
    docPdf.setTextColor(20, 20, 20);
    docPdf.text("Registre des Volées Ratées — SMI Imiter", margin, y);

    y += 6;
    docPdf.setFont("Helvetica", "normal");
    docPdf.setFontSize(9.5);
    docPdf.setTextColor(80, 80, 80);
    docPdf.text(`Période du : ${startDate || 'Début'} au ${endDate || "Aujourd'hui"}`, margin, y);

    // Stats Section Background Box
    y += 10;
    docPdf.setFillColor(245, 245, 240); // HydroMines light gray #f5f5f0
    docPdf.rect(margin, y, 210 - (margin * 2), 24, "F");

    // Stats values & headers
    docPdf.setFont("Helvetica", "bold");
    docPdf.setFontSize(8.5);
    docPdf.setTextColor(100, 100, 100);
    docPdf.text("TOTAL RATÉES", margin + 6, y + 8);
    docPdf.text("CAUSE FRÉQUENTE", margin + 42, y + 8);
    docPdf.text("SECTEUR TOUCHÉ", margin + 104, y + 8);
    docPdf.text("MÉTRAGE PERDU", margin + 152, y + 8);

    docPdf.setFont("Helvetica", "bold");
    docPdf.setFontSize(10.5);
    docPdf.setTextColor(20, 20, 20);
    docPdf.text(`${totalCount}`, margin + 6, y + 16);

    const causeText = mostFrequentCause.length > 22 ? mostFrequentCause.substring(0, 20) + '..' : mostFrequentCause;
    docPdf.text(`${causeText} (${mostFrequentCausePercent}%)`, margin + 42, y + 16);
    docPdf.text(`${mostFrequentSector} (${mostFrequentSectorPercent}%)`, margin + 104, y + 16);
    docPdf.text(`${totalMeterageLost.toFixed(1)} m`, margin + 152, y + 16);

    // Table Header
    y += 34;
    docPdf.setFillColor(30, 41, 59); // Dark grey bg
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
    docPdf.text("Cause principale", colX.cause, y + 5.5);
    docPdf.text("Statut", colX.status, y + 5.5);

    y += 8;

    // Render Rows
    docPdf.setFont("Helvetica", "normal");
    docPdf.setFontSize(8);

    const pageHeight = 297;
    const maxRowY = pageHeight - 20;

    sortedBlasts.forEach((blast) => {
      if (y > maxRowY) {
        docPdf.addPage();
        y = 20;

        // Header on new page
        docPdf.setFillColor(30, 41, 59);
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
        docPdf.text("Cause principale", colX.cause, y + 5.5);
        docPdf.text("Statut", colX.status, y + 5.5);

        y += 8;
        docPdf.setFont("Helvetica", "normal");
        docPdf.setFontSize(8);
      }

      // Fill subtle BG according to status
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

      // Draw light bottom border
      docPdf.setDrawColor(230, 230, 230);
      docPdf.setLineWidth(0.15);
      docPdf.line(margin, y + 7, 210 - margin, y + 7);

      // Text colors & print
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
      if (blast.cause === 'Autres' && blast.otherCauseComment) {
        finalCause = `Autre: ${blast.otherCauseComment}`;
      }
      const causeShort = finalCause.length > 18 ? finalCause.substring(0, 16) + '..' : finalCause;
      docPdf.text(causeShort, colX.cause, y + 4.5);

      const statusFmt = STATUS_LABELS[blast.status] || blast.status;
      docPdf.text(statusFmt, colX.status, y + 4.5);

      y += 7;
    });

    // Footers across all pages
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
      const email = user?.email || 'Secrétaire de Direction SMI';
      docPdf.text(`Document généré par HydroMines — ${timeStr} — Par : ${email}`, margin, pageHeight - 10);
      docPdf.text(`Page ${i} sur ${totalPages}`, 210 - margin - 20, pageHeight - 10);
    }

    docPdf.save(`HydroMines_Registre_Volees_Ratees_${startDate}_au_${endDate}.pdf`);
  };

  return (
    <div className="min-h-screen bg-[#F5F5F0] text-[#141414] py-8 px-4 sm:px-6 lg:px-8">
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

      {/* HEADER SECTION */}
      <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <span className="text-[10px] font-black uppercase tracking-widest text-[#b8860b]">
            Suivi des écarts de production
          </span>
          <h1 className="text-2xl font-black uppercase tracking-wider text-slate-900 mt-1 flex items-center gap-2.5">
            <Activity className="w-6 h-6 text-[#b8860b]" />
            Registre des Volées Ratées — SMI Imiter
          </h1>
          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-0.5">
            Centralisation, qualification et analyse des écarts opérationnels de forage-minage
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex flex-wrap items-center gap-3">
          {canAdd && (
            <button
              onClick={openCreateModal}
              className="px-4 py-2 bg-gradient-to-r from-[#b8860b] to-[#d4af37] text-slate-950 font-black rounded-xl hover:scale-[1.03] active:scale-[0.98] transition-all flex items-center gap-2 text-[10.5px] uppercase tracking-wider shadow-md cursor-pointer"
            >
              <Plus className="w-4 h-4 text-slate-950" />
              Ajouter une volée ratée
            </button>
          )}

          <button
            onClick={handleDownloadPDF}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-[#ffd700] font-black rounded-xl border border-slate-800 flex items-center gap-2 text-[10.5px] uppercase tracking-wider shadow-sm cursor-pointer transition-all"
          >
            <Download className="w-4 h-4" />
            Télécharger le registre PDF
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto space-y-8">
        {/* STATS SUMMARY (4 Grid Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Total Ratees */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[9.5px] font-black uppercase tracking-wider">Total volées ratées</span>
              <AlertTriangle className="w-4 h-4 text-rose-500" />
            </div>
            <div className="mt-4">
              <div className="text-3xl font-black text-slate-900 font-mono">
                {totalCount}
              </div>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                Sur la période filtrée
              </p>
            </div>
          </div>

          {/* Card 2: Cause Frequente */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[9.5px] font-black uppercase tracking-wider">Cause fréquente</span>
              <HelpCircle className="w-4 h-4 text-amber-500" />
            </div>
            <div className="mt-4">
              <div className="text-base font-black text-slate-800 truncate" title={mostFrequentCause}>
                {mostFrequentCause}
              </div>
              <p className="text-[10px] text-amber-600 font-black uppercase mt-1 font-mono">
                {totalCount > 0 ? `${mostFrequentCausePercent}% des cas` : 'Aucun enregistrement'}
              </p>
            </div>
          </div>

          {/* Card 3: Secteur le plus touche */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[9.5px] font-black uppercase tracking-wider">Secteur le plus touché</span>
              <MapPin className="w-4 h-4 text-[#b8860b]" />
            </div>
            <div className="mt-4">
              <div className="text-lg font-black text-slate-800">
                {mostFrequentSector}
              </div>
              <p className="text-[10px] text-amber-600 font-black uppercase mt-1 font-mono">
                {totalCount > 0 ? `${mostFrequentSectorPercent}% de taux d'écarts` : 'Aucun enregistrement'}
              </p>
            </div>
          </div>

          {/* Card 4: Metrage total perdu */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-[9.5px] font-black uppercase tracking-wider">Métrage total perdu</span>
              <TrendingDown className="w-4 h-4 text-rose-600" />
            </div>
            <div className="mt-4">
              <div className="text-3xl font-black text-rose-600 font-mono">
                {totalMeterageLost.toFixed(1)} <span className="text-lg font-bold">m</span>
              </div>
              <p className="text-[10px] text-rose-500/80 font-black uppercase mt-1">
                Cumul du manque-à-gagner
              </p>
            </div>
          </div>

        </div>

        {/* FILTERS PANEL */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 border-b border-slate-100 pb-2.5">
            <Filter className="w-3.5 h-3.5" />
            <span>Filtres de recherche</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Du */}
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-slate-500 block">Du (Date)</label>
              <div className="relative">
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold focus:outline-none focus:border-[#b8860b] font-mono"
                />
              </div>
            </div>

            {/* Au */}
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-slate-500 block">Au (Date)</label>
              <div className="relative">
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold focus:outline-none focus:border-[#b8860b] font-mono"
                />
              </div>
            </div>

            {/* Secteur */}
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-slate-500 block">Secteur</label>
              <select
                value={filterSector}
                onChange={(e) => setFilterSector(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold focus:outline-none focus:border-[#b8860b]"
              >
                <option value="all">Tous les secteurs</option>
                {SECTORS.map(sec => <option key={sec} value={sec}>{sec}</option>)}
              </select>
            </div>

            {/* Cause */}
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-slate-500 block">Cause</label>
              <select
                value={filterCause}
                onChange={(e) => setFilterCause(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold focus:outline-none focus:border-[#b8860b]"
              >
                <option value="all">Toutes les causes</option>
                {CAUSES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {/* Poste */}
            <div className="space-y-1">
              <label className="text-[9px] font-black uppercase text-slate-500 block">Poste</label>
              <select
                value={filterPost}
                onChange={(e) => setFilterPost(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold focus:outline-none focus:border-[#b8860b]"
              >
                <option value="all">Tous les postes</option>
                {POSTS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* TABLE SECTION */}
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-xs font-black uppercase text-slate-400 animate-pulse tracking-widest">
              Chargement des registres de volées ratées...
            </div>
          ) : sortedBlasts.length === 0 ? (
            <div className="p-12 text-center text-xs font-bold uppercase text-slate-400">
              Aucune volée ratée enregistrée pour les filtres sélectionnés.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-800 text-white text-[9.5px] font-black uppercase tracking-wider border-b border-slate-700">
                    <th onClick={() => handleSort('date')} className="p-3.5 cursor-pointer hover:bg-slate-700 transition-colors">
                      <div className="flex items-center gap-1">
                        Date {sortField === 'date' && (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                      </div>
                    </th>
                    <th onClick={() => handleSort('sector')} className="p-3.5 cursor-pointer hover:bg-slate-700 transition-colors">
                      <div className="flex items-center gap-1">
                        Secteur {sortField === 'sector' && (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                      </div>
                    </th>
                    <th onClick={() => handleSort('post')} className="p-3.5 cursor-pointer hover:bg-slate-700 transition-colors">
                      <div className="flex items-center gap-1">
                        Poste {sortField === 'post' && (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                      </div>
                    </th>
                    <th onClick={() => handleSort('chantier')} className="p-3.5 cursor-pointer hover:bg-slate-700 transition-colors">
                      <div className="flex items-center gap-1">
                        Chantier {sortField === 'chantier' && (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                      </div>
                    </th>
                    <th onClick={() => handleSort('plannedMeterage')} className="p-3.5 text-right cursor-pointer hover:bg-slate-700 transition-colors">
                      <div className="flex items-center justify-end gap-1">
                        Planifié {sortField === 'plannedMeterage' && (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                      </div>
                    </th>
                    <th onClick={() => handleSort('realMeterage')} className="p-3.5 text-right cursor-pointer hover:bg-slate-700 transition-colors">
                      <div className="flex items-center justify-end gap-1">
                        Réalisé {sortField === 'realMeterage' && (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                      </div>
                    </th>
                    <th onClick={() => handleSort('perte')} className="p-3.5 text-right cursor-pointer hover:bg-slate-700 transition-colors">
                      <div className="flex items-center justify-end gap-1">
                        Perte {sortField === 'perte' && (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                      </div>
                    </th>
                    <th onClick={() => handleSort('cause')} className="p-3.5 cursor-pointer hover:bg-slate-700 transition-colors">
                      <div className="flex items-center gap-1">
                        Cause {sortField === 'cause' && (sortDirection === 'asc' ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />)}
                      </div>
                    </th>
                    <th className="p-3.5">Commentaire</th>
                    <th className="p-3.5">Signalé par</th>
                    <th className="p-3.5 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/80 text-[11px] font-semibold text-slate-700">
                  {sortedBlasts.map((blast) => {
                    const lost = blast.plannedMeterage - blast.realMeterage;
                    const rowClass = (() => {
                      switch (blast.status) {
                        case 'unjustified':
                          return 'bg-red-50/70 hover:bg-red-100/90 text-red-950 border-l-4 border-l-red-500';
                        case 'pending':
                          return 'bg-amber-50/70 hover:bg-amber-100/90 text-amber-950 border-l-4 border-l-amber-500';
                        case 'explained':
                          return 'bg-emerald-50/70 hover:bg-emerald-100/90 text-emerald-950 border-l-4 border-l-emerald-500';
                        default:
                          return 'bg-white hover:bg-slate-50';
                      }
                    })();

                    return (
                      <tr key={blast.id} className={`${rowClass} transition-all duration-150`}>
                        <td className="p-3 font-mono">{blast.date}</td>
                        <td className="p-3">{blast.sector}</td>
                        <td className="p-3">{blast.post}</td>
                        <td className="p-3 font-bold text-slate-900">{getChantierName(blast.chantierId)}</td>
                        <td className="p-3 text-right font-mono">{blast.plannedMeterage.toFixed(1)} m</td>
                        <td className="p-3 text-right font-mono">{blast.realMeterage.toFixed(1)} m</td>
                        <td className="p-3 text-right font-mono font-black text-rose-600">
                          {lost > 0 ? `-${lost.toFixed(1)} m` : '0.0 m'}
                        </td>
                        <td className="p-3">
                          <span className="font-bold">
                            {blast.cause === 'Autres' && blast.otherCauseComment 
                              ? `Autre: ${blast.otherCauseComment}` 
                              : blast.cause}
                          </span>
                        </td>
                        <td className="p-3 max-w-[150px] truncate" title={blast.comment}>
                          {blast.comment || <span className="text-slate-400 italic font-normal">N/A</span>}
                        </td>
                        <td className="p-3 text-slate-500 text-[10px]" title={`Signalé à: ${format(new Date(blast.reportedAt), 'dd/MM/yyyy HH:mm')}`}>
                          {blast.reportedBy}
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-2">
                            {canEdit && (
                              <button
                                onClick={() => openEditModal(blast)}
                                className="p-1 text-slate-600 hover:text-[#b8860b] hover:bg-slate-200/50 rounded transition-all cursor-pointer"
                                title="Modifier"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                            {canDelete && (
                              <button
                                onClick={() => handleDelete(blast.id!)}
                                className="p-1 text-slate-600 hover:text-rose-600 hover:bg-rose-100/50 rounded transition-all cursor-pointer"
                                title="Supprimer"
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

      {/* ADD / EDIT MODAL */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 z-50 overflow-y-auto animate-fade-in">
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
                  <Activity className="w-5 h-5 text-[#b8860b]" />
                  <h3 className="text-base font-black uppercase tracking-wider text-slate-900">
                    {editingBlast ? "Modifier la volée ratée" : "Déclarer une volée ratée"}
                  </h3>
                </div>
                <p className="text-[10px] text-slate-400 font-bold uppercase">
                  SMI Imiter — Saisie rigoureuse des déviations de forage-minage
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
                
                {/* 2-Column fields */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Date */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-500 block">Date</label>
                    <input
                      type="date"
                      required
                      value={formDate}
                      onChange={(e) => setFormDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold focus:outline-none focus:border-[#b8860b] font-mono text-slate-800"
                    />
                  </div>

                  {/* Sector */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-500 block">Secteur</label>
                    <select
                      value={formSector}
                      onChange={(e) => setFormSector(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold focus:outline-none focus:border-[#b8860b]"
                    >
                      {SECTORS.map(sec => <option key={sec} value={sec}>{sec}</option>)}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Post */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-500 block">Poste de travail</label>
                    <select
                      value={formPost}
                      onChange={(e) => setFormPost(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold focus:outline-none focus:border-[#b8860b]"
                    >
                      {POSTS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>

                  {/* Chantier */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-500 block">Chantier (Dropdown dynamique)</label>
                    <select
                      required
                      value={formChantierId}
                      onChange={(e) => setFormChantierId(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold focus:outline-none focus:border-[#b8860b]"
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

                <div className="grid grid-cols-2 gap-4">
                  {/* Planned */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-500 block">Métrage Planifié (m)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      required
                      value={formPlanned}
                      onChange={(e) => setFormPlanned(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold focus:outline-none focus:border-[#b8860b]"
                    />
                  </div>

                  {/* Realized */}
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase text-slate-500 block">Métrage Réalisé (m)</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      required
                      value={formReal}
                      onChange={(e) => setFormReal(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold focus:outline-none focus:border-[#b8860b]"
                    />
                  </div>
                </div>

                {/* Status Column for Justifications */}
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-500 block">Statut de qualification</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as any)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold focus:outline-none focus:border-[#b8860b]"
                  >
                    <option value="pending">⏳ En attente de justification</option>
                    <option value="explained">✅ Justifié & Validé</option>
                    <option value="unjustified">🚨 Non Justifié (Écart non réglementaire)</option>
                  </select>
                </div>

                {/* Cause dropdown */}
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-500 block">Cause principale</label>
                  <select
                    value={formCause}
                    onChange={(e) => setFormCause(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-bold focus:outline-none focus:border-[#b8860b]"
                  >
                    {CAUSES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>

                {/* Other Cause comments */}
                {formCause === "Autres" && (
                  <div className="space-y-1 animate-fade-in">
                    <label className="text-[9px] font-black uppercase text-rose-600 block">
                      Précisez la cause (Obligatoire - Min 10 caractères)
                    </label>
                    <input
                      type="text"
                      required
                      value={formOtherComment}
                      onChange={(e) => setFormOtherComment(e.target.value)}
                      placeholder="Indiquez clairement la raison physique de l'écart..."
                      className="w-full bg-rose-50/20 border border-rose-300 rounded-lg p-2 text-xs font-semibold focus:outline-none focus:border-rose-500 text-slate-800"
                    />
                  </div>
                )}

                {/* Optional comment */}
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase text-slate-500 block">Commentaires additionnels (Optionnel)</label>
                  <textarea
                    value={formComment}
                    onChange={(e) => setFormComment(e.target.value)}
                    placeholder="Saisissez d'autres détails techniques si nécessaire..."
                    rows={2}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold focus:outline-none focus:border-[#b8860b]"
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
                    className="px-5 py-2 bg-gradient-to-r from-[#b8860b] to-[#d4af37] text-slate-950 rounded-lg font-black uppercase text-[10px] shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
                  >
                    {isSubmitting ? "Sauvegarde..." : "Enregistrer"}
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
