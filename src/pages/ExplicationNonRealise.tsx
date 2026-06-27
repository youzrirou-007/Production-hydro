import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  X, 
  Edit2, 
  Save, 
  AlertCircle,
  TrendingDown,
  Info,
  RotateCcw,
  Ban,
  User,
  ExternalLink
} from 'lucide-react';
import { collection, query, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { format, parseISO } from 'date-fns';
import logoImg from '../assets/images/hydromines_logo_1781337889277.jpg';

// Types inside the page
interface Chantier {
  id: string;
  name: string;
  sector: string;
  galleryType: '9m2' | '12m2';
  status: 'ouvert' | 'fermé';
}

interface SavedExplanation {
  id: string;
  date: string;
  poste: string;
  chantierId: string;
  chantierName: string;
  activity: string;
  activityLabel: string;
  plannedValue: number;
  realValue: number;
  gapPercent: number;
  cause: string;
  causeLabel: string;
  otherDetails: string | null;
  reportedBy: string;
  reportedByUid: string;
  reportedAt: string;
  status: 'pending' | 'explained' | 'unjustified';
}

// Activity Causes options
const MINAGE_CAUSES = [
  { id: 'barre_conique_cassee', label: 'Barre conique cassée' },
  { id: 'chantier_danger', label: 'Chantier danger (purge > 2h)' },
  { id: 'taillant_mauvais_etat', label: 'Taillant en mauvais état' },
  { id: 'roches_dures', label: 'Roches dures' },
  { id: 'manque_personnel', label: 'Manque de personnel' },
  { id: 'panne_engin', label: 'Panne engin' },
  { id: 'chantier_non_deblaye', label: 'Chantier non déblayé' },
  { id: 'autre', label: 'Autre' }
];

const DEBLAYAGE_CAUSES = [
  { id: 'panne_chargeuse_lhd', label: 'Panne chargeuse LHD' },
  { id: 'manque_conducteur', label: 'Manque de conducteur' },
  { id: 'chantier_non_mine', label: 'Chantier non miné / non tiré' },
  { id: 'voie_encombree', label: 'Voie encombrée' },
  { id: 'probleme_ventilation', label: 'Problème de ventilation' },
  { id: 'arret_consignation', label: 'Arrêt pour consignation' },
  { id: 'manque_gasoil', label: 'Manque de gasoil' },
  { id: 'autre', label: 'Autre' }
];

const EXTRACTION_CAUSES = [
  { id: 'panne_treuil', label: 'Panne treuil' },
  { id: 'probleme_voie', label: 'Problème de voie / déraillement' },
  { id: 'manque_wagons', label: 'Manque de wagons disponibles' },
  { id: 'chantier_non_deblaye', label: 'Chantier non déblayé' },
  { id: 'arret_electrique', label: 'Arrêt électrique' },
  { id: 'manque_equipiers', label: 'Manque d\'équipiers' },
  { id: 'bourrage_bure', label: 'Bourrage au bure' },
  { id: 'autre', label: 'Autre' }
];

const MAINTENANCE_CAUSES = [
  { id: 'piece_indisponible', label: 'Pièce de rechange indisponible' },
  { id: 'diagnostic_complexe', label: 'Diagnostic plus complexe que prévu' },
  { id: 'arret_securite', label: 'Arrêt pour sécurité' },
  { id: 'manque_personnel_technique', label: 'Manque de personnel technique' },
  { id: 'priorite_changee', label: 'Priorité changée (urgence ailleurs)' },
  { id: 'autre', label: 'Autre' }
];

const getActivityCauses = (activity: string) => {
  switch (activity) {
    case 'minage': return MINAGE_CAUSES;
    case 'deblayage': return DEBLAYAGE_CAUSES;
    case 'extraction': return EXTRACTION_CAUSES;
    case 'maintenance': return MAINTENANCE_CAUSES;
    default: return [];
  }
};

const getActivityLabel = (activity: string) => {
  switch (activity) {
    case 'minage': return 'Forage & Minage';
    case 'deblayage': return 'Déblayage LHD';
    case 'extraction': return 'Extraction Treuil';
    case 'maintenance': return 'Maintenance';
    default: return activity;
  }
};

export const ExplicationNonRealise: React.FC = () => {
  const { user } = useAuth();
  
  // Filters State
  const [filterMonth, setFilterMonth] = useState(() => {
    const savedDate = window.sessionStorage.getItem('goto-explications-date');
    if (savedDate) {
      window.sessionStorage.removeItem('goto-explications-date');
      return savedDate.substring(0, 7); // yyyy-MM
    }
    return format(new Date(), 'yyyy-MM');
  });
  const [filterPost, setFilterPost] = useState<'all' | 'poste1' | 'poste2' | 'poste3'>('all');

  // Firestore & Data State
  const [chantiers, setChantiers] = useState<Chantier[]>([]);
  const [productionDocs, setProductionDocs] = useState<any[]>([]);
  const [explanations, setExplanations] = useState<Record<string, SavedExplanation>>({});
  const [loading, setLoading] = useState(true);

  // Editing Row State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editCause, setEditCause] = useState<string>('');
  const [editOtherText, setEditOtherText] = useState<string>('');

  // Toast State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    const timer = setTimeout(() => {
      setToast(null);
    }, 4000);
    return () => clearTimeout(timer);
  };

  // Real-time Firestore subscriptions
  useEffect(() => {
    if (!user) return;
    setLoading(true);

    // 1. Chantiers
    const unsubChantiers = onSnapshot(collection(db, 'chantiers'), (snap) => {
      setChantiers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Chantier)));
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'chantiers');
    });

    // 2. Production (documents scellés)
    const unsubProduction = onSnapshot(collection(db, 'production'), (snap) => {
      const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
      setProductionDocs(docs.filter(d => d.status === 'scelle'));
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'production');
    });

    // 3. Saved Explanations
    const unsubExplanations = onSnapshot(collection(db, 'non_realisation_explanations'), (snap) => {
      const expMap: Record<string, SavedExplanation> = {};
      snap.docs.forEach(doc => {
        expMap[doc.id] = { id: doc.id, ...doc.data() } as SavedExplanation;
      });
      setExplanations(expMap);
      setLoading(false);
    }, (err) => {
      setLoading(false);
      handleFirestoreError(err, OperationType.GET, 'non_realisation_explanations');
    });

    return () => {
      unsubChantiers();
      unsubProduction();
      unsubExplanations();
    };
  }, [user]);

  // Gap Detection and Merging
  const detectedGaps = React.useMemo(() => {
    const list: any[] = [];

    productionDocs.forEach((docData) => {
      const date = docData.date || docData.id;
      // Filter by month
      if (!date || !date.startsWith(filterMonth)) return;

      const postes = docData.postes || {};
      const postsToProcess = filterPost === 'all' 
        ? ['poste1', 'poste2', 'poste3'] 
        : [filterPost];

      postsToProcess.forEach((pKey) => {
        const post = postes[pKey];
        if (!post) return;

        // Process 4 activities
        const activities = ['minage', 'deblayage', 'extraction', 'maintenance'];
        
        activities.forEach((activity) => {
          const rows = post[activity] || [];
          
          rows.forEach((row: any, idx: number) => {
            const plan = row.plan || {};
            const reel = row.reel || {};

            // Resolve Chantier Info
            let chantierId = '';
            let chantierName = '';

            if (activity === 'minage' || activity === 'deblayage') {
              chantierId = plan.chantierId || reel.chantierId || '';
              // skip if empty slot row
              if (!chantierId) return;

              const chantierObj = chantiers.find(c => c.id === chantierId);
              chantierName = chantierObj ? chantierObj.name : (plan.sector || reel.sector || 'Chantier inconnu');
            } else if (activity === 'extraction') {
              chantierName = plan.chantierName || reel.chantierName || 'Extraction Treuil';
              chantierId = (chantierName || '').toLowerCase().replace(/[\s/]+/g, '_') || `row_${idx}`;
              // skip if empty slot row
              if (!plan.treuilliste && !reel.treuilliste) return;
            } else {
              // Maintenance
              chantierName = plan.roleLabel || reel.roleLabel || 'Maintenance';
              chantierId = (chantierName || '').toLowerCase().replace(/[\s/]+/g, '_') || `row_${idx}`;
              // skip if empty slot row
              if (!plan.agentMatricule && !reel.agentMatricule) return;
            }

            // Clean chantierId to ensure valid ID
            const cleanChantierId = (chantierId || `row_${idx}`).replace(/[\s/]+/g, '_');
            const uniqueId = `${date}_${pKey}_${cleanChantierId}_${activity}`;

            // Threshold and detection rules
            let hasEcart = false;
            let plannedValue = 0;
            let realValue = 0;
            let plannedStr = '';
            let realStr = '';
            let gapPercent = 0;
            let achievementRate = 1;

            if (activity === 'minage') {
              const plannedMeterage = plan.meterage || ((plan.plannedRounds || 0) * 1.7);
              const realMeterage = reel.realMeterage || 0;
              achievementRate = plannedMeterage > 0 ? realMeterage / plannedMeterage : 1;
              
              if (plannedMeterage > 0 && achievementRate < 0.824) {
                hasEcart = true;
                plannedValue = plannedMeterage;
                realValue = realMeterage;
                plannedStr = `${plannedMeterage.toFixed(1)} m`;
                realStr = `${realMeterage.toFixed(1)} m`;
                gapPercent = Math.round((achievementRate - 1) * 100);
              }
            } else if (activity === 'deblayage') {
              const plannedVolume = plan.volumeEstimated || 0;
              const realVolume = reel.volumeEstimated || 0;
              achievementRate = plannedVolume > 0 ? realVolume / plannedVolume : 1;

              if (plannedVolume > 0 && achievementRate < 0.90) {
                hasEcart = true;
                plannedValue = plannedVolume;
                realValue = realVolume;
                plannedStr = `${plannedVolume.toFixed(1)} m³`;
                realStr = `${realVolume.toFixed(1)} m³`;
                gapPercent = Math.round((achievementRate - 1) * 100);
              }
            } else if (activity === 'extraction') {
              const plannedWagons = plan.wagonsTarget !== undefined ? plan.wagonsTarget : 48;
              const realWagons = reel.wagonsActual || 0;
              achievementRate = plannedWagons > 0 ? realWagons / plannedWagons : 1;

              if (plannedWagons > 0 && achievementRate < 0.90) {
                hasEcart = true;
                plannedValue = plannedWagons;
                realValue = realWagons;
                plannedStr = `${plannedWagons} wagons`;
                realStr = `${realWagons} wagons`;
                gapPercent = Math.round((achievementRate - 1) * 100);
              }
            } else if (activity === 'maintenance') {
              const plannedHours = plan.hoursSpent || 0;
              const realHours = reel.hoursSpent || 0;
              achievementRate = plannedHours > 0 ? realHours / plannedHours : 1;

              if (plannedHours > 0 && achievementRate < 0.90) {
                hasEcart = true;
                plannedValue = plannedHours;
                realValue = realHours;
                plannedStr = `${plannedHours.toFixed(1)} h`;
                realStr = `${realHours.toFixed(1)} h`;
                gapPercent = Math.round((achievementRate - 1) * 100);
              }
            }

            if (hasEcart) {
              const saved = explanations[uniqueId];
              list.push({
                id: uniqueId,
                date,
                poste: pKey,
                posteLabel: pKey === 'poste1' ? 'P1 (Matin)' : pKey === 'poste2' ? 'P2 (Après-midi)' : 'P3 (Nuit)',
                chantierId: cleanChantierId,
                chantierName,
                activity,
                activityLabel: getActivityLabel(activity),
                plannedValue,
                realValue,
                plannedStr,
                realStr,
                gapPercent,
                achievementPercent: Math.round(achievementRate * 100),
                status: saved ? saved.status : 'pending',
                cause: saved ? saved.cause : '',
                causeLabel: saved ? saved.causeLabel : '',
                otherDetails: saved ? saved.otherDetails : null,
                reportedBy: saved ? saved.reportedBy : '',
                reportedAt: saved ? saved.reportedAt : ''
              });
            }
          });
        });
      });
    });

    // Sort by date desc, then poste asc
    return list.sort((a, b) => {
      if (b.date !== a.date) return b.date.localeCompare(a.date);
      return a.poste.localeCompare(b.poste);
    });
  }, [productionDocs, filterMonth, filterPost, chantiers, explanations]);

  // Statistics calculation
  const stats = React.useMemo(() => {
    let pending = 0;
    let explained = 0;
    let unjustified = 0;

    detectedGaps.forEach((g) => {
      if (g.status === 'explained') explained++;
      else if (g.status === 'unjustified') unjustified++;
      else pending++;
    });

    return { pending, explained, unjustified };
  }, [detectedGaps]);

  // Handle start editing
  const handleStartEdit = (gap: any) => {
    setEditingId(gap.id);
    setEditCause(gap.cause || '');
    setEditOtherText(gap.otherDetails || '');
  };

  // Handle cancel edit
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditCause('');
    setEditOtherText('');
  };

  // Save Explanation
  const handleSave = async (gap: any, forceStatus?: 'unjustified') => {
    if (!user) {
      showToast("Veuillez vous authentifier pour enregistrer l'explication", "error");
      return;
    }

    const finalStatus = forceStatus || 'explained';
    let finalCause = editCause;
    let finalOtherDetails = editOtherText;

    if (forceStatus === 'unjustified') {
      finalCause = 'non_justifie';
      finalOtherDetails = null;
    }

    // Validation for "Autre" cause
    if (finalStatus === 'explained' && finalCause === 'autre' && !finalOtherDetails.trim()) {
      showToast("Veuillez décrire la cause spécifique dans le champ requis", "error");
      return;
    }

    const causeOptions = getActivityCauses(gap.activity);
    const matchedOption = causeOptions.find(o => o.id === finalCause);
    const causeLabel = forceStatus === 'unjustified' 
      ? 'Pas de cause identifiée' 
      : (matchedOption ? matchedOption.label : 'Autre');

    const payload = {
      date: gap.date,
      poste: gap.poste,
      chantierId: gap.chantierId,
      chantierName: gap.chantierName,
      activity: gap.activity,
      activityLabel: gap.activityLabel,
      plannedValue: gap.plannedValue,
      realValue: gap.realValue,
      gapPercent: gap.gapPercent,
      cause: finalCause,
      causeLabel,
      otherDetails: finalCause === 'autre' ? finalOtherDetails.trim() : null,
      reportedBy: user.email || 'user@email.com',
      reportedByUid: user.uid,
      reportedAt: new Date().toISOString(),
      status: finalStatus
    };

    try {
      await setDoc(doc(db, 'non_realisation_explanations', gap.id), payload);
      setEditingId(null);
      setEditCause('');
      setEditOtherText('');
      showToast(
        finalStatus === 'unjustified' 
          ? "Écart marqué comme non justifié !" 
          : "Explication de non-réalisation enregistrée avec succès !", 
        "success"
      );
    } catch (err: any) {
      console.error("Error writing explanation to Firestore:", err);
      showToast(`Erreur d'enregistrement : ${err?.message || err}`, "error");
    }
  };

  return (
    <div className="space-y-6 relative max-w-7xl mx-auto px-1">
      {/* Custom Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-6 right-6 z-[999] flex items-center gap-3 px-5 py-3.5 shadow-xl rounded-xl border font-bold text-xs uppercase tracking-wider ${
              toast.type === 'success' 
                ? 'bg-slate-900 text-white border-emerald-500' 
                : 'bg-white text-rose-700 border-rose-200'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-450 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Corporate Title Banner */}
      <div 
        className="bg-white p-6 md:p-8 border border-slate-200/80 rounded-[16px] w-full shadow-sm"
        style={{ boxShadow: '0 4px 20px -2px rgba(184, 134, 11, 0.04), 0 1px 3px rgba(0,0,0,0.05)' }}
      >
        <div className="flex flex-col lg:flex-row items-stretch justify-between gap-6">
          <div className="flex-shrink-0 flex items-center justify-center self-center lg:self-stretch">
            <img 
              src={logoImg} 
              alt="HydroMines Logo" 
              className="h-24 w-24 sm:h-28 sm:w-28 object-contain hover:scale-105 transition-transform duration-300 ease-out select-none" 
              referrerPolicy="no-referrer"
            />
          </div>

          <div className="flex-1 flex flex-col justify-center text-center lg:text-left">
            <span className="text-[10px] font-black tracking-[0.3em] text-[#b8860b] uppercase mb-1">
              SOCIÉTÉ METALLURGIQUE D'IMITER
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-slate-900 font-display">
              Explication de Non-Réalisation
            </h1>
            <p className="text-xs font-semibold text-slate-500 mt-1">
              Plateforme d'analyse prédictive et de justification des écarts de production
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 self-center">
            {/* Month Filter */}
            <div className="flex flex-col">
              <label className="text-[8.5px] font-black uppercase tracking-[0.1em] text-slate-400 mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-[#b8860b]" /> Période d'analyse
              </label>
              <input
                type="month"
                value={filterMonth}
                onChange={(e) => {
                  setFilterMonth(e.target.value);
                  handleCancelEdit();
                }}
                className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#b8860b] focus:border-[#b8860b]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Summary Panel */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Pending Badge Card */}
        <div 
          className="bg-white p-5 border border-slate-200/80 rounded-2xl flex items-center justify-between shadow-xs relative overflow-hidden group"
        >
          <div className="space-y-1">
            <span className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">Écarts à justifier</span>
            <p className="text-2xl font-black text-slate-800 flex items-center gap-1.5">
              {stats.pending}
              {stats.pending > 0 && (
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                </span>
              )}
            </p>
          </div>
          <div className={`p-3 rounded-full ${stats.pending > 0 ? 'bg-rose-50 text-rose-600 animate-pulse' : 'bg-slate-50 text-slate-400'}`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
        </div>

        {/* Explained Card */}
        <div className="bg-white p-5 border border-slate-200/80 rounded-2xl flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">Écarts expliqués</span>
            <p className="text-2xl font-black text-slate-800">{stats.explained}</p>
          </div>
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-full">
            <CheckCircle className="w-5 h-5" />
          </div>
        </div>

        {/* Unjustified Card */}
        <div className="bg-white p-5 border border-slate-200/80 rounded-2xl flex items-center justify-between shadow-xs">
          <div className="space-y-1">
            <span className="text-[9px] font-black uppercase tracking-[0.15em] text-slate-400">Non identifiés</span>
            <p className="text-2xl font-black text-slate-800">{stats.unjustified}</p>
          </div>
          <div className="p-3 bg-slate-100 text-slate-500 rounded-full">
            <Ban className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Main Filter & Table Area */}
      <div className="bg-white border border-slate-200/80 rounded-2xl overflow-hidden shadow-xs">
        {/* Sub-Filters */}
        <div className="p-4 bg-slate-50/50 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500">Filtrer par poste :</span>
            <div className="inline-flex rounded-lg border border-slate-200 bg-white p-1">
              {(['all', 'poste1', 'poste2', 'poste3'] as const).map((postOpt) => (
                <button
                  key={postOpt}
                  onClick={() => {
                    setFilterPost(postOpt);
                    handleCancelEdit();
                  }}
                  className={`px-3 py-1 text-[10px] font-black uppercase tracking-tight rounded-md transition-all ${
                    filterPost === postOpt
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {postOpt === 'all' ? 'Tous' : postOpt === 'poste1' ? 'P1 (Matin)' : postOpt === 'poste2' ? 'P2 (Après-midi)' : 'P3 (Nuit)'}
                </button>
              ))}
            </div>
          </div>

          <div className="text-[10px] font-extrabold text-slate-500 flex items-center gap-1.5 uppercase tracking-wide">
            <Info className="w-4 h-4 text-[#b8860b]" />
            {detectedGaps.length} écarts détectés pour {format(parseISO(`${filterMonth}-02`), 'MMMM yyyy')}
          </div>
        </div>

        {/* Real-time Table */}
        <div className="overflow-x-auto">
          {loading ? (
            <div className="p-16 flex flex-col items-center justify-center gap-3">
              <div className="w-8 h-8 border-2 border-[#b8860b] border-t-transparent rounded-full animate-spin" />
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Chargement des données en temps réel...</p>
            </div>
          ) : detectedGaps.length === 0 ? (
            <div className="p-16 text-center text-slate-400 flex flex-col items-center justify-center gap-3">
              <CheckCircle className="w-12 h-12 text-emerald-400" />
              <div className="space-y-1">
                <p className="text-sm font-bold text-slate-700 uppercase tracking-tight">Aucun écart de production détecté</p>
                <p className="text-[10.5px] font-medium text-slate-400">Toutes les performances de ce mois respectent ou dépassent les seuils prescrits.</p>
              </div>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[9.5px] font-black uppercase tracking-wider text-slate-500">
                  <th className="p-3 text-center w-24">Date</th>
                  <th className="p-3 text-center w-20">Poste</th>
                  <th className="p-3 w-40">Chantier / Type</th>
                  <th className="p-3 w-36">Activité</th>
                  <th className="p-3 text-center w-24">Planifié</th>
                  <th className="p-3 text-center w-24">Réalisé</th>
                  <th className="p-3 text-center w-24">% Réal.</th>
                  <th className="p-3 w-64">Explication / Justificatif</th>
                  <th className="p-3 text-center w-24">Statut</th>
                  <th className="p-3 text-center w-28">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {detectedGaps.map((gap) => {
                  const isEditing = editingId === gap.id;
                  
                  // Color rate calculation
                  let rateColor = 'text-rose-600 bg-rose-50/50';
                  if (gap.achievementPercent >= 90) {
                    rateColor = 'text-emerald-700 bg-emerald-50/50';
                  } else if (gap.activity === 'minage' && gap.achievementPercent >= 82.4) {
                    rateColor = 'text-amber-700 bg-amber-50/50';
                  }

                  return (
                    <tr 
                      key={gap.id}
                      className={`hover:bg-slate-50/50 transition-colors ${
                        isEditing ? 'bg-[#b8860b]/3' : ''
                      }`}
                    >
                      {/* Date */}
                      <td className="p-3 text-center font-mono font-bold text-slate-700">
                        {(() => {
                          const [y, m, d] = gap.date.split('-');
                          return `${d}/${m}/${y}`;
                        })()}
                      </td>

                      {/* Poste */}
                      <td className="p-3 text-center">
                        <span className="inline-flex items-center px-2 py-0.5 rounded-sm text-[10px] font-black bg-slate-100 text-slate-700 uppercase">
                          {gap.posteLabel.split(' ')[0]}
                        </span>
                      </td>

                      {/* Chantier */}
                      <td className="p-3 font-semibold text-slate-950 uppercase tracking-tight text-[11px]">
                        {gap.chantierName}
                      </td>

                      {/* Activité */}
                      <td className="p-3">
                        <span className="text-slate-800 font-bold uppercase text-[10px] tracking-tight">
                          {gap.activityLabel}
                        </span>
                      </td>

                      {/* Planifié */}
                      <td className="p-3 text-center font-mono font-bold text-slate-500">
                        {gap.plannedStr}
                      </td>

                      {/* Réalisé */}
                      <td className="p-3 text-center font-mono font-bold text-slate-800">
                        {gap.realStr}
                      </td>

                      {/* % Réel */}
                      <td className="p-3 text-center">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full font-mono font-black text-[10px] ${rateColor}`}>
                          <TrendingDown className="w-3 h-3 mr-0.5 shrink-0" />
                          {gap.achievementPercent}%
                        </span>
                      </td>

                      {/* Cause Dropdown or Value */}
                      <td className="p-3">
                        {isEditing ? (
                          <div className="space-y-2 max-w-sm">
                            <select
                              value={editCause}
                              onChange={(e) => setEditCause(e.target.value)}
                              className="w-full bg-white border border-slate-300 rounded-md p-1.5 text-xs focus:ring-1 focus:ring-[#b8860b] focus:border-[#b8860b] font-bold text-slate-800"
                            >
                              <option value="" disabled>-- Sélectionner une cause --</option>
                              {getActivityCauses(gap.activity).map((opt) => (
                                <option key={opt.id} value={opt.id}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>

                            {editCause === 'autre' && (
                              <div className="space-y-1">
                                <textarea
                                  value={editOtherText}
                                  onChange={(e) => setEditOtherText(e.target.value)}
                                  placeholder="Décrivez la cause spécifique..."
                                  rows={2}
                                  className={`w-full text-xs p-2 border rounded-md focus:ring-1 focus:ring-[#b8860b] focus:border-[#b8860b] font-medium resize-y ${
                                    !editOtherText.trim() 
                                      ? 'border-red-500 focus:ring-red-500' 
                                      : 'border-slate-300'
                                  }`}
                                />
                                {!editOtherText.trim() && (
                                  <p className="text-[9px] text-red-600 font-bold uppercase tracking-tight">Description obligatoire si cause "Autre"</p>
                                )}
                              </div>
                            )}
                          </div>
                        ) : gap.status === 'explained' ? (
                          <div className="space-y-0.5 max-w-xs">
                            <p className="font-extrabold text-slate-900 text-[11px] leading-tight">
                              {gap.causeLabel}
                            </p>
                            {gap.cause === 'autre' && gap.otherDetails && (
                              <p className="text-slate-500 text-[10px] italic font-medium break-words leading-tight bg-slate-50 p-1.5 rounded border border-slate-100">
                                {gap.otherDetails}
                              </p>
                            )}
                            {gap.reportedBy && (
                              <div className="flex items-center gap-1 text-[8px] font-black uppercase tracking-tight text-slate-400 mt-1">
                                <User className="w-2.5 h-2.5 text-[#b8860b]" /> 
                                {gap.reportedBy.split('@')[0]}
                              </div>
                            )}
                          </div>
                        ) : gap.status === 'unjustified' ? (
                          <span className="text-slate-400 font-black uppercase text-[10px] tracking-wider italic">
                            Non justifié (absence de cause identifiée)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider bg-rose-50 text-rose-800 border border-rose-200/50 animate-pulse">
                            ⚠️ À justifier
                          </span>
                        )}
                      </td>

                      {/* Status Icon / Badge */}
                      <td className="p-3 text-center">
                        {gap.status === 'explained' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase bg-emerald-50 text-emerald-800 border border-emerald-200">
                            ✅ Expliqué
                          </span>
                        ) : gap.status === 'unjustified' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase bg-slate-100 text-slate-550 border border-slate-200">
                            ⏸️ Non justifié
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase bg-amber-50 text-amber-800 border border-amber-200">
                            ⏳ En attente
                          </span>
                        )}
                      </td>

                      {/* Actions Button */}
                      <td className="p-3 text-center">
                        {isEditing ? (
                          <div className="flex flex-col gap-1.5 items-stretch w-28 mx-auto">
                            <button
                              onClick={() => handleSave(gap)}
                              disabled={editCause === 'autre' && !editOtherText.trim()}
                              className={`w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all border ${
                                editCause === 'autre' && !editOtherText.trim()
                                  ? 'bg-slate-100 border-slate-200 text-slate-400 cursor-not-allowed'
                                  : 'bg-emerald-900 border-emerald-950 text-white hover:scale-[1.02] shadow-sm'
                              }`}
                            >
                              <Save className="w-3 h-3" /> Sauver
                            </button>
                            <button
                              onClick={() => handleSave(gap, 'unjustified')}
                              className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider bg-slate-100 border border-slate-200 text-slate-600 hover:bg-slate-200 transition-all"
                            >
                              <Ban className="w-3 h-3" /> Non Justifié
                            </button>
                            <button
                              onClick={handleCancelEdit}
                              className="w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all"
                            >
                              <X className="w-3 h-3" /> Annuler
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => handleStartEdit(gap)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 transition-all hover:scale-[1.02]"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                            {gap.status === 'explained' || gap.status === 'unjustified' ? 'Modifier' : 'Justifier'}
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};
