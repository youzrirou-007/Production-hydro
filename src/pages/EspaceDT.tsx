import React, { useState, useEffect, lazy, Suspense } from 'react';

const HistoryTrends = lazy(() => import('../components/HistoryTrends').then(m => ({ default: m.HistoryTrends })));
const SectorsCompare = lazy(() => import('../components/SectorsCompare').then(m => ({ default: m.SectorsCompare })));
const GlobalRankings = lazy(() => import('../components/GlobalRankings').then(m => ({ default: m.GlobalRankings })));
const CausesChart = lazy(() => import('../components/CausesChart').then(m => ({ default: m.CausesChart })));
const SmartAlertsCenter = lazy(() => import('../components/SmartAlertsCenter').then(m => ({ default: m.SmartAlertsCenter })));
import { format } from 'date-fns';
import { calculateAssistantMinerStats } from '../lib/rhCalculations';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  collection, doc, query, where, orderBy, limit,
  onSnapshot, setDoc
} from 'firebase/firestore';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';

type DTTab = 'vue_ensemble' | 'journal' | 'attachements' | 'explosifs' | 'rapport' | 'ia' | 'comparaison';

interface AttachementChantier {
  chantierId: string;
  chantierName: string;
  secteur: string;
  galleryType: '9' | '12';
  metrageGeometre: number;
}

interface Attachement {
  id?: string;
  siteId: string;
  mois: string;
  dateSaisie?: any;
  saisiPar?: string;
  saisiParNom?: string;
  valide: boolean;
  secteurs: Record<string, { metrageGeometre: number; nbChantiers: number }>;
  chantiers: AttachementChantier[];
  totalMetrageGeometre: number;
  totalMetrage9m2: number;
  totalMetrage12m2: number;
}

// Palette de statut officielle HydroMines — utilisée pour tout indicateur de santé (secteurs, alertes, KPI)
const STATUS_COLORS = {
  nominal:  { text: 'text-[#00A0E3]', bg: 'bg-[#00A0E3]/10', border: 'border-[#00A0E3]/30', dot: 'bg-[#00A0E3]', hex: '#00A0E3' },
  attention:{ text: 'text-[#b8860b]', bg: 'bg-[#b8860b]/10', border: 'border-[#b8860b]/30', dot: 'bg-[#ffd700]', hex: '#b8860b' },
  critique: { text: 'text-[#8B1A1A]', bg: 'bg-[#8B1A1A]/10', border: 'border-[#8B1A1A]/30', dot: 'bg-[#8B1A1A]', hex: '#8B1A1A' },
};

// Palette "pierres précieuses" — couleur fixe par secteur, indépendante du statut de performance
const SECTOR_GEMS: Record<string, { gradient: string; stroke: string; text: string }> = {
  'Imiter 1':   { gradient: 'url(#gemRuby)',     stroke: '#5a1414', text: '#ffffff' },
  'Imiter 2':   { gradient: 'url(#gemSapphire)', stroke: '#0a4a75', text: '#ffffff' },
  'Imiter Est': { gradient: 'url(#gemSilver)',   stroke: '#5c6572', text: '#3d4652' },
};

export const EspaceDT: React.FC = () => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<DTTab>('vue_ensemble');
  const [bureFocusPeriod, setBureFocusPeriod] = useState<'jour' | 'semaine' | 'mois'>('jour');
  const [patternRole, setPatternRole] = useState<'mineurs' | 'chefs' | 'aides'>('mineurs');
  const [expandedPerson, setExpandedPerson] = useState<string | null>(null);
  const [expandedSector, setExpandedSector] = useState<string | null>(null);
  const [tickerIndex, setTickerIndex] = useState(0);
  const [bannerMouse, setBannerMouse] = useState({ x: 0, y: 0 });
  const [crownKey, setCrownKey] = useState(0);

  const handleBannerMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left - rect.width / 2) / (rect.width / 2);
    const y = (e.clientY - rect.top - rect.height / 2) / (rect.height / 2);
    setBannerMouse({ x, y });
  };

  const handleBannerMouseLeave = () => {
    setBannerMouse({ x: 0, y: 0 });
  };

  const renderKPIIcon = (icon: string) => {
    if (icon === 'wagon') {
      return (
        <motion.div
          className="relative w-8 h-8 flex items-center justify-center shrink-0"
          animate={{
            y: [0, -1.5, 0, -1.5, 0],
            rotate: [0, -1, 1, -1, 0],
          }}
          transition={{
            duration: 2.0,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          <svg viewBox="0 0 100 100" className="w-8 h-8 drop-shadow-[0_1px_4px_rgba(184,134,11,0.4)]" fill="none">
            {/* Rails */}
            <path d="M 10 82 L 90 82" stroke="#94a3b8" strokeWidth="4" strokeLinecap="round" />
            <path d="M 25 82 L 25 90" stroke="#64748b" strokeWidth="3" strokeLinecap="round" />
            <path d="M 50 82 L 50 90" stroke="#64748b" strokeWidth="3" strokeLinecap="round" />
            <path d="M 75 82 L 75 90" stroke="#64748b" strokeWidth="3" strokeLinecap="round" />
            
            {/* Wagon Body (Classic Metallic Mine Cart) */}
            <path 
              d="M 15 32 L 85 32 L 75 68 L 25 68 Z" 
              fill="url(#wagonGoldGradient)" 
              stroke="#b8860b" 
              strokeWidth="3.5" 
              strokeLinejoin="round" 
            />
            
            {/* Metal band accent */}
            <path d="M 20 50 L 80 50" stroke="#ffd700" strokeWidth="2.5" opacity="0.8" />
            
            {/* Mineral loads (Silver ores blocks) stacked inside */}
            <path d="M 22 32 C 25 15, 38 18, 45 32" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="2" />
            <path d="M 40 32 C 48 10, 62 14, 68 32" fill="#94a3b8" stroke="#64748b" strokeWidth="2" />
            <path d="M 60 32 C 65 18, 78 22, 78 32" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="2" />
            
            {/* Little glistening stars on silver ore */}
            <motion.path 
              d="M 32 18 L 34 22 L 38 22 L 35 24 L 36 28 L 32 25 L 28 28 L 29 24 L 26 22 L 30 22 Z" 
              fill="#ffffff"
              animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            />
            <motion.path 
              d="M 55 12 L 57 15 L 60 15 L 58 17 L 59 20 L 55 18 L 51 20 L 52 17 L 50 15 L 53 15 Z" 
              fill="#ffd700"
              animate={{ opacity: [1, 0.4, 1], scale: [1.2, 0.8, 1.2] }}
              transition={{ repeat: Infinity, duration: 1.8, ease: "easeInOut", delay: 0.3 }}
            />

            {/* Wheels on tracks */}
            <motion.circle 
              cx="35" 
              cy="76" 
              r="7.5" 
              fill="#334155" 
              stroke="#ffd700" 
              strokeWidth="2.5" 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
            />
            {/* Wheel Spokes */}
            <line x1="35" y1="68.5" x2="35" y2="83.5" stroke="#ffd700" strokeWidth="1.5" />
            <line x1="27.5" y1="76" x2="42.5" y2="76" stroke="#ffd700" strokeWidth="1.5" />

            <motion.circle 
              cx="65" 
              cy="76" 
              r="7.5" 
              fill="#334155" 
              stroke="#ffd700" 
              strokeWidth="2.5" 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
            />
            {/* Wheel Spokes */}
            <line x1="65" y1="68.5" x2="65" y2="83.5" stroke="#ffd700" strokeWidth="1.5" />
            <line x1="57.5" y1="76" x2="72.5" y2="76" stroke="#ffd700" strokeWidth="1.5" />

            <defs>
              <linearGradient id="wagonGoldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#475569" />
                <stop offset="50%" stopColor="#1e293b" />
                <stop offset="100%" stopColor="#0f172a" />
              </linearGradient>
            </defs>
          </svg>
        </motion.div>
      );
    }
    return <span className="text-xl shrink-0">{icon}</span>;
  };

  const [selectedMois, setSelectedMois] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [currentAttachement, setCurrentAttachement] = useState<Attachement | null>(null);
  const [loadingAttachement, setLoadingAttachement] = useState(false);
  const [allChantiers, setAllChantiers] = useState<any[]>([]);
  const [saisieMode, setSaisieMode] = useState(false);
  const [saisieData, setSaisieData] = useState<AttachementChantier[]>([]);
  const [savingAttachement, setSavingAttachement] = useState(false);
  const [historiqueAttachements, setHistoriqueAttachements] = useState<Attachement[]>([]);
  const [allProductionDocs, setAllProductionDocs] = useState<any[]>([]);
  const [allPlanningSheets, setAllPlanningSheets] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [engines, setEngines] = useState<any[]>([]);
  const [globalCausesData, setGlobalCausesData] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  const [journalDate, setJournalDate] = useState<string>(() =>
    new Date().toISOString().split('T')[0]
  );
  const [journalProduction, setJournalProduction] = useState<any>(null);
  const [journalPlanning, setJournalPlanning] = useState<any>(null);
  const [loadingJournal, setLoadingJournal] = useState(false);
  const [journalExplications, setJournalExplications] = useState<any[]>([]);

  const [explosifsMonth, setExplosifsMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [explosifsHistory, setExplosifsHistory] = useState<any[]>([]);
  const [platformSettings, setPlatformSettings] = useState<any>({});

  const [rapportMonth, setRapportMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [rapportHistory, setRapportHistory] = useState<any[]>([]);
  const [rapportAttachement, setRapportAttachement] = useState<any>(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  const [dtQuestion, setDtQuestion] = useState('');
  const [dtResponse, setDtResponse] = useState<string | null>(null);
  const [loadingDT, setLoadingDT] = useState(false);
  const [dtError, setDtError] = useState<string | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);

  const [structuredResponse, setStructuredResponse] = useState<{
    analysis: string;
    anomalies: string[];
    suggestions: string[];
    logic?: string;
  } | null>(null);
  const [loaderStep, setLoaderStep] = useState(0);
  const [savedAnalyses, setSavedAnalyses] = useState<{
    id: string;
    date: string;
    question: string;
    response: {
      analysis: string;
      anomalies: string[];
      suggestions: string[];
      logic?: string;
    };
  }[]>([]);
  const [activeReportTab, setActiveReportTab] = useState<'synthese' | 'anomalies' | 'recommandations' | 'logique'>('synthese');

  const [dtNotes, setDtNotes] = useState<string>(() => {
    return localStorage.getItem('hydromines_dt_notes') || 
      "✍️ CARNET DU DIRECTEUR - HAMID EL YAAKOUBY\n\n" +
      "• Suivi ANFO : Veiller à ce que le ratio d'explosifs reste sous la barre nominale.\n" +
      "• Sécurité Boulonnage : Rappeler au chef du Poste B d'accentuer le contrôle géologique au niveau -1200m.\n" +
      "• Taux de Réalisation : Atteindre l'objectif de 95% de tirs qualifiés ce mois-ci.\n" +
      "• Note de service : Planifier l'inspection du système d'aérage de la descenderie Est mardi matin.";
  });

  useEffect(() => {
    localStorage.setItem('hydromines_dt_notes', dtNotes);
  }, [dtNotes]);

  // Dynamic Shift & Local Operational Status
  const [currentShiftInfo, setCurrentShiftInfo] = useState<{
    name: string;
    hours: string;
    progress: number;
    postKey: 'Poste 1' | 'Poste 2' | 'Poste 3';
  }>({ name: '1ère Poste', hours: '06h00 - 14h00', progress: 50, postKey: 'Poste 1' });

  useEffect(() => {
    const updateShift = () => {
      const now = new Date();
      const hour = now.getHours();
      let shift: typeof currentShiftInfo = { name: '3ème Poste (Nuit)', hours: '22h00 - 06h00', progress: 0, postKey: 'Poste 3' };
      if (hour >= 6 && hour < 14) {
        const elapsedMinutes = (hour - 6) * 60 + now.getMinutes();
        shift = {
          name: '1ère Poste',
          hours: '06h00 - 14h00',
          progress: Math.min(100, Math.round((elapsedMinutes / 480) * 100)),
          postKey: 'Poste 1'
        };
      } else if (hour >= 14 && hour < 22) {
        const elapsedMinutes = (hour - 14) * 60 + now.getMinutes();
        shift = {
          name: '2ème Poste',
          hours: '14h00 - 22h00',
          progress: Math.min(100, Math.round((elapsedMinutes / 480) * 100)),
          postKey: 'Poste 2'
        };
      } else {
        const elapsedMinutes = (hour >= 22 ? hour - 22 : hour + 2) * 60 + now.getMinutes();
        shift = {
          name: '3ème Poste (Nuit)',
          hours: '22h00 - 06h00',
          progress: Math.min(100, Math.round((elapsedMinutes / 480) * 100)),
          postKey: 'Poste 3'
        };
      }
      setCurrentShiftInfo(shift);
    };
    updateShift();
    const interval = setInterval(updateShift, 60000);
    return () => clearInterval(interval);
  }, []);

  const getChefsForCurrentPost = () => {
    const normalizeEmpSector = (s: string) => {
      const low = (s || '').toLowerCase();
      if (low.includes('imiter 2')) return 'Imiter 2';
      if (low.includes('imiter 1')) return 'Imiter 1';
      if (low.includes('imiter est') || low.includes('bure')) return 'Imiter Est';
      return '';
    };
    const sectors = ['Imiter 1', 'Imiter 2', 'Imiter Est'];
    return sectors.map(sec => {
      const chef = employees.find((e: any) =>
        e.fonction === 'CHEF' &&
        e.status === 'actif' &&
        normalizeEmpSector(e.sector) === sec &&
        e.currentPost === currentShiftInfo.postKey
      );
      return { sector: sec, chefName: chef ? `${chef.prenom || ''} ${chef.nom || ''}`.trim() : 'Aucun' };
    });
  };

  // Comparison & Simulation Tab States
  const [comparisonMetric, setComparisonMetric] = useState<'meters' | 'explosives' | 'efficiency' | 'extraction'>('meters');
  const [simVolees, setSimVolees] = useState<number>(150);
  const [simLongueur, setSimLongueur] = useState<number>(3.2);
  const [simSucces, setSimSucces] = useState<number>(88);
  const [simChargeTarget, setSimChargeTarget] = useState<number>(24);

  const tabs: { id: DTTab; label: string; icon: string }[] = [
    { id: 'vue_ensemble', label: "Vue d'Ensemble", icon: '🏠' },
    { id: 'journal', label: 'Journal de la Mine', icon: '📋' },
    { id: 'attachements', label: 'Attachements & Fiabilité', icon: '📐' },
    { id: 'explosifs', label: 'Suivi Explosifs', icon: '💥' },
    { id: 'rapport', label: 'Rapport Mensuel', icon: '📄' },
    { id: 'ia', label: 'Assistant DT', icon: '🤖' },
    { id: 'comparaison', label: 'Comparaison Inter-Mois', icon: '📊' },
  ];

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'chantiers'), where('siteId', '==', 'SMI')),
      (snap) => setAllChantiers(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      (err) => handleFirestoreError(err, OperationType.GET, 'chantiers')
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    setLoadingAttachement(true);
    const docId = `SMI_${selectedMois}`;
    const unsub = onSnapshot(
      doc(db, 'attachements', docId),
      (snap) => {
        if (snap.exists()) {
          setCurrentAttachement({ id: snap.id, ...snap.data() } as Attachement);
        } else {
          setCurrentAttachement(null);
        }
        setLoadingAttachement(false);
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, `attachements/${docId}`);
        setLoadingAttachement(false);
      }
    );
    return () => unsub();
  }, [selectedMois]);

  useEffect(() => {
    const q = query(collection(db, 'production'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setAllProductionDocs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'production')
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'daily_planning_sheets'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setAllPlanningSheets(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'daily_planning_sheets')
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'personnel'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setEmployees(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'personnel')
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'engines'));
    const unsub = onSnapshot(
      q,
      (snap) => setEngines(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      (err) => handleFirestoreError(err, OperationType.GET, 'engines')
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    const startOfMonthDate = new Date(selectedMois + '-01');
    const endOfMonthDate = new Date(startOfMonthDate.getFullYear(), startOfMonthDate.getMonth() + 1, 0);
    const startStr = format(startOfMonthDate, 'yyyy-MM-dd');
    const endStr = format(endOfMonthDate, 'yyyy-MM-dd');

    const q = query(collection(db, 'non_realisation_explanations'), where('status', '==', 'explained'));
    const unsub = onSnapshot(q, (snap) => {
      const explanations = snap.docs.map(d => d.data()).filter((e: any) => e.date >= startStr && e.date <= endStr);
      const grouped = explanations.reduce((acc: any, exp: any) => {
        const cause = exp.cause;
        if (!acc[cause]) acc[cause] = { name: exp.causeLabel || cause, value: 0, lastDate: exp.date };
        acc[cause].value++;
        if (exp.date > acc[cause].lastDate) acc[cause].lastDate = exp.date;
        return acc;
      }, {});
      setGlobalCausesData(Object.values(grouped).sort((a: any, b: any) => b.value - a.value));
    }, (err) => handleFirestoreError(err, OperationType.GET, 'non_realisation_explanations'));
    return () => unsub();
  }, [selectedMois]);

  useEffect(() => {
    const q = query(collection(db, 'audit_logs'), orderBy('timestamp', 'desc'), limit(500));
    const unsub = onSnapshot(
      q,
      (snap) => setAuditLogs(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      (err) => handleFirestoreError(err, OperationType.GET, 'audit_logs')
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(
      collection(db, 'attachements'),
      where('siteId', '==', 'SMI'),
      orderBy('mois', 'desc'),
      limit(6)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setHistoriqueAttachements(
          snap.docs.map(d => ({ id: d.id, ...d.data() } as Attachement))
        );
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'attachements')
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    setLoadingJournal(true);
    const prodUnsub = onSnapshot(
      doc(db, 'production', journalDate),
      (snap) => {
        setJournalProduction(snap.exists() ? snap.data() : null);
        setLoadingJournal(false);
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, `production/${journalDate}`);
        setLoadingJournal(false);
      }
    );
    const planUnsub = onSnapshot(
      doc(db, 'daily_planning_sheets', journalDate),
      (snap) => setJournalPlanning(snap.exists() ? snap.data() : null),
      (err) => handleFirestoreError(err, OperationType.GET, `daily_planning_sheets/${journalDate}`)
    );
    const explUnsub = onSnapshot(
      query(
        collection(db, 'non_realisation_explanations'),
        where('date', '==', journalDate)
      ),
      (snap) => setJournalExplications(
        snap.docs.map(d => ({ id: d.id, ...d.data() }))
      ),
      (err) => handleFirestoreError(err, OperationType.GET, 'non_realisation_explanations')
    );
    return () => { prodUnsub(); planUnsub(); explUnsub(); };
  }, [journalDate]);

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'platform_settings', 'config'),
      (snap) => { if (snap.exists()) setPlatformSettings(snap.data()); },
      (err) => handleFirestoreError(err, OperationType.GET, 'platform_settings/config')
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(
      collection(db, 'production_history'),
      where('date', '>=', `${explosifsMonth}-01`),
      where('date', '<=', `${explosifsMonth}-31`),
      orderBy('date', 'asc')
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setExplosifsHistory(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'production_history')
    );
    return () => unsub();
  }, [explosifsMonth]);

  useEffect(() => {
    const q = query(
      collection(db, 'production_history'),
      where('date', '>=', `${rapportMonth}-01`),
      where('date', '<=', `${rapportMonth}-31`),
      orderBy('date', 'asc')
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setRapportHistory(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'production_history')
    );
    return () => unsub();
  }, [rapportMonth]);

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'attachements', `SMI_${rapportMonth}`),
      (snap) => setRapportAttachement(snap.exists() ? snap.data() : null),
      (err) => handleFirestoreError(err, OperationType.GET, `attachements/SMI_${rapportMonth}`)
    );
    return () => unsub();
  }, [rapportMonth]);

  const getMonthlyProductionByChantier = (mois: string): Record<string, number> => {
    const byChantier: Record<string, number> = {};
    allProductionDocs.forEach(d => {
      const dateStr = d.date || d.id;
      if (dateStr && dateStr.startsWith(mois)) {
        if (d.postes) {
          ['poste1', 'poste2', 'poste3'].forEach(pKey => {
            const minageRows = d.postes?.[pKey]?.minage || [];
            minageRows.forEach((row: any) => {
              const r = row.reel || row;
              const plan = row.plan || {};
              const chantierId = r.chantierId || row.chantierId || plan.chantierId;
              if (chantierId) {
                const meters = Number(r.realMeterage || 0);
                byChantier[chantierId] = (byChantier[chantierId] || 0) + meters;
              }
            });
          });
        }
      }
    });
    return byChantier;
  };

  const computeEcartPct = (metrageGeometre: number, metragePlateforme: number): number => {
    if (metrageGeometre === 0) return 0;
    return ((metragePlateforme - metrageGeometre) / metrageGeometre) * 105 - 5;
  };

  const computeEcartPctActual = (metrageGeometre: number, metragePlateforme: number): number => {
    if (metrageGeometre === 0) return 0;
    return ((metragePlateforme - metrageGeometre) / metrageGeometre) * 100;
  };

  const getFiabiliteLabel = (ecartPct: number): {
    label: string; color: string; bg: string; icon: string
  } => {
    const abs = Math.abs(ecartPct);
    if (abs <= 10) return {
      label: 'FIABLE', color: 'text-emerald-400',
      bg: 'bg-emerald-950/20 border-emerald-500/20', icon: '✅'
    };
    if (abs <= 25) return {
      label: 'ATTENTION', color: 'text-amber-400',
      bg: 'bg-amber-950/20 border-amber-500/20', icon: '⚠️'
    };
    return {
      label: 'ALERTE', color: 'text-rose-400',
      bg: 'bg-rose-950/20 border-rose-500/20', icon: '🚨'
    };
  };

  const isSuspectFraude = (ecartPct: number): boolean => ecartPct > 25;

  const changeJournalDate = (days: number) => {
    const d = new Date(journalDate);
    d.setDate(d.getDate() + days);
    setJournalDate(d.toISOString().split('T')[0]);
  };

  const getBilanJournal = () => {
    let totalPlan = 0;
    let totalReel = 0;
    let totalWagonsPlan = 0;
    let totalWagonsReel = 0;
    let totalAnfo = 0;

    ['poste1', 'poste2', 'poste3'].forEach(pKey => {
      const pData = journalProduction?.postes?.[pKey];
      const plData = journalPlanning?.postes?.[pKey];

      const minage = pData?.minage || [];
      minage.forEach((r: any) => {
        const row = r.reel || r;
        if (row) {
          totalReel += Number(row.realMeterage || row.meterage || 0);
          totalAnfo += Number(row.anfo || 0);
        }
      });

      const plMinage = plData?.minage || [];
      plMinage.forEach((r: any) => {
        totalPlan += Number(r.meterage || r.plannedMeterage || 0);
      });

      totalWagonsReel += Number(pData?.deblayageSummary?.totalWagons || pData?.deblayage?.reduce((s: number, r: any) => s + Number(r.reel?.tripCount || r.tripCount || 0), 0) || 0);
      totalWagonsPlan += Number(plData?.deblayageSummary?.totalWagons || plData?.deblayage?.reduce((s: number, r: any) => s + Number(r.tripCount || r.plannedTripCount || 0), 0) || 0);
    });

    const totalNonRealises = journalExplications.length;

    return {
      totalPlan,
      totalReel,
      totalWagonsPlan,
      totalWagonsReel,
      totalAnfo,
      totalNonRealises
    };
  };

  const normalizeSectorEspaceDT = (s: string) => {
    const low = (s || '').toLowerCase();
    if (low.includes('bure') || low.includes('imiter est')) return 'Imiter Est';
    if (low.includes('imiter 2')) return 'Imiter 2';
    if (low.includes('imiter 1')) return 'Imiter 1';
    return '';
  };

  const getSectorHealth = () => {
    const sectors: Record<string, { reel: number; plan: number; byChantier: Record<string, number> }> = {
      'Imiter 1': { reel: 0, plan: 0, byChantier: {} },
      'Imiter 2': { reel: 0, plan: 0, byChantier: {} },
      'Imiter Est': { reel: 0, plan: 0, byChantier: {} },
    };

    ['poste1', 'poste2', 'poste3'].forEach(pKey => {
      const pData = journalProduction?.postes?.[pKey];
      const plData = journalPlanning?.postes?.[pKey];

      (pData?.minage || []).forEach((r: any) => {
        const row = r.reel || r;
        const sec = normalizeSectorEspaceDT(row?.sectorGroup || row?.sector || '');
        if (sectors[sec]) {
          const meterage = Number(row.realMeterage || 0);
          sectors[sec].reel += meterage;
          const chantier = allChantiers.find((c: any) => c.id === row.chantierId);
          const label = chantier?.name || row.chantierId || 'Chantier inconnu';
          sectors[sec].byChantier[label] = (sectors[sec].byChantier[label] || 0) + meterage;
        }
      });

      (plData?.minage || []).forEach((r: any) => {
        const sec = normalizeSectorEspaceDT(r?.sectorGroup || r?.sector || '');
        if (sectors[sec]) sectors[sec].plan += Number(r.meterage || r.plannedMeterage || 0);
      });
    });

    const totalReel = Object.values(sectors).reduce((sum, v) => sum + v.reel, 0);

    return Object.entries(sectors).map(([name, v]) => {
      const pct = v.plan > 0 ? (v.reel / v.plan) * 100 : 100;
      const status: 'nominal' | 'attention' | 'critique' = pct >= 90 ? 'nominal' : pct >= 70 ? 'attention' : 'critique';
      const contribution = totalReel > 0 ? (v.reel / totalReel) * 100 : 0;
      const chantierBreakdown = Object.entries(v.byChantier)
        .map(([chantier, meterage]) => ({ chantier, meterage }))
        .sort((a, b) => b.meterage - a.meterage);
      return { name, reel: v.reel, plan: v.plan, pct, status, contribution, chantierBreakdown };
    });
  };

  const isBureSector = (sector: string) => {
    const s = (sector || '').trim().toLowerCase();
    return s === 'bure imiter est' || s === 'imiter est bure' || s === 'bure';
  };

  const getBureFocusData = (period: 'jour' | 'semaine' | 'mois') => {
    const todayStr = new Date().toISOString().split('T')[0];
    const currentMonth = todayStr.substring(0, 7);
    const sevenDaysAgoObj = new Date();
    sevenDaysAgoObj.setDate(sevenDaysAgoObj.getDate() - 6);
    const sevenDaysAgoStr = sevenDaysAgoObj.toISOString().split('T')[0];

    const relevantDocs = allProductionDocs.filter(doc => {
      const dateStr = doc.id;
      if (!dateStr) return false;
      if (period === 'jour') return dateStr === todayStr;
      if (period === 'semaine') return dateStr >= sevenDaysAgoStr && dateStr <= todayStr;
      return dateStr.substring(0, 7) === currentMonth;
    });

    let meterage = 0;
    let wagonsActual = 0;
    let wagonsTarget = 0;
    const engineGodets: Record<string, number> = { 'ST2G 1': 0, 'ST2G 3': 0 };

    relevantDocs.forEach(doc => {
      ['poste1', 'poste2', 'poste3'].forEach(pKey => {
        const pData = doc.postes?.[pKey];

        (pData?.minage || []).forEach((r: any) => {
          const row = r.reel || r;
          if (isBureSector(row?.sectorGroup || row?.sector)) {
            meterage += Number(row.realMeterage || 0);
          }
        });

        (pData?.deblayage || []).forEach((r: any) => {
          const row = r.reel || r;
          if (isBureSector(row?.sectorGroup || row?.sector)) {
            const eng = (row.engineId || row.engineCode || '').trim();
            if (engineGodets[eng] !== undefined) {
              engineGodets[eng] += Number(row.godets || 0);
            }
          }
        });

        (pData?.extraction || []).forEach((r: any) => {
          const row = r.reel || r;
          wagonsActual += Number(row?.wagonsActual || 0);
          wagonsTarget += Number(row?.wagonsTarget || 0);
        });
      });
    });

    return { meterage, wagonsActual, wagonsTarget, engineGodets };
  };

  const getDeblayageVolumeDaily = () => {
    const cutoffObj = new Date();
    cutoffObj.setDate(cutoffObj.getDate() - 29);
    const cutoffStr = cutoffObj.toISOString().split('T')[0];

    const byDate: Record<string, number> = {};

    allProductionDocs
      .filter(doc => doc.id && doc.id >= cutoffStr)
      .forEach(doc => {
        let dayVolume = 0;
        ['poste1', 'poste2', 'poste3'].forEach(pKey => {
          const pData = doc.postes?.[pKey];
          (pData?.deblayage || []).forEach((r: any) => {
            const row = r.reel || r;
            if (isBureSector(row?.sectorGroup || row?.sector)) {
              dayVolume += Number(row.volumeEstimated || 0);
            }
          });
        });
        byDate[doc.id] = dayVolume;
      });

    return Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, volume]) => ({ date: date.slice(5), volume: Number(volume.toFixed(1)) }));
  };

  const getBureEngineDailyTrend = () => {
    const cutoffObj = new Date();
    cutoffObj.setDate(cutoffObj.getDate() - 29);
    const cutoffStr = cutoffObj.toISOString().split('T')[0];

    const byDate: Record<string, { st2g1: number; st2g3: number }> = {};

    allProductionDocs
      .filter(doc => doc.id && doc.id >= cutoffStr)
      .forEach(doc => {
        const day = { st2g1: 0, st2g3: 0 };
        ['poste1', 'poste2', 'poste3'].forEach(pKey => {
          const pData = doc.postes?.[pKey];
          (pData?.deblayage || []).forEach((r: any) => {
            const row = r.reel || r;
            if (isBureSector(row?.sectorGroup || row?.sector)) {
              const eng = (row.engineId || row.engineCode || '').trim();
              if (eng === 'ST2G 1') day.st2g1 += Number(row.godets || 0);
              if (eng === 'ST2G 3') day.st2g3 += Number(row.godets || 0);
            }
          });
        });
        byDate[doc.id] = day;
      });

    return Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, v]) => ({ date: date.slice(5), 'ST2G 1': v.st2g1, 'ST2G 3': v.st2g3 }));
  };

  const getExtractionDailyTrend = () => {
    const cutoffObj = new Date();
    cutoffObj.setDate(cutoffObj.getDate() - 29);
    const cutoffStr = cutoffObj.toISOString().split('T')[0];

    const byDate: Record<string, number> = {};

    allProductionDocs
      .filter(doc => doc.id && doc.id >= cutoffStr)
      .forEach(doc => {
        let dayWagons = 0;
        ['poste1', 'poste2', 'poste3'].forEach(pKey => {
          const pData = doc.postes?.[pKey];
          (pData?.extraction || []).forEach((r: any) => {
            const row = r.reel || r;
            dayWagons += Number(row?.wagonsActual || 0);
          });
        });
        byDate[doc.id] = dayWagons;
      });

    return Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, wagons]) => ({ date: date.slice(5), wagons }));
  };

  const getVoleeRateePatterns = () => {
    const currentMonth = selectedMois; // format 'YYYY-MM'
    const byMineur: Record<string, { name: string; count: number; details: any[] }> = {};
    const byChef: Record<string, { name: string; count: number; details: any[] }> = {};
    const byAide: Record<string, { name: string; count: number; details: any[] }> = {};

    allProductionDocs
      .filter(doc => doc.id && doc.id.startsWith(currentMonth))
      .forEach(doc => {
        ['poste1', 'poste2', 'poste3'].forEach((pKey, idx) => {
          const pData = doc.postes?.[pKey];
          (pData?.minage || []).forEach((r: any) => {
            const row = r.reel || r;
            if (!row.volee_ratee) return;

            const chantier = allChantiers.find((c: any) => c.id === row.chantierId);
            const detail = {
              date: doc.id,
              chantier: chantier?.name || row.chantierId || 'Inconnu',
              poste: `Poste ${idx + 1}`,
              chef: row.chiefName || 'Inconnu',
            };

            if (row.minerMatricule) {
              if (!byMineur[row.minerMatricule]) byMineur[row.minerMatricule] = { name: row.minerName || row.minerMatricule, count: 0, details: [] };
              byMineur[row.minerMatricule].count++;
              byMineur[row.minerMatricule].details.push(detail);
            }
            if (row.chiefMatricule) {
              if (!byChef[row.chiefMatricule]) byChef[row.chiefMatricule] = { name: row.chiefName || row.chiefMatricule, count: 0, details: [] };
              byChef[row.chiefMatricule].count++;
              byChef[row.chiefMatricule].details.push(detail);
            }
            if (row.assistantMatricule) {
              if (!byAide[row.assistantMatricule]) byAide[row.assistantMatricule] = { name: row.assistantName || row.assistantMatricule, count: 0, details: [] };
              byAide[row.assistantMatricule].count++;
              byAide[row.assistantMatricule].details.push(detail);
            }
          });
        });
      });

    const toSorted = (obj: Record<string, any>) => Object.values(obj).sort((a: any, b: any) => b.count - a.count);
    return { mineurs: toSorted(byMineur), chefs: toSorted(byChef), aides: toSorted(byAide) };
  };

  const getMonthlyConsolidatedStats = () => {
    const statsMap: Record<string, {
      month: string;
      totalReel: number;
      totalAnfo: number;
      totalWagonsReel: number;
      daysCount: number;
    }> = {};

    allProductionDocs.forEach(doc => {
      const dateStr = doc.id; // e.g., "2026-07-08"
      if (!dateStr || dateStr.length < 7) return;
      const month = dateStr.substring(0, 7); // "2026-07"

      if (!statsMap[month]) {
        statsMap[month] = {
          month,
          totalReel: 0,
          totalAnfo: 0,
          totalWagonsReel: 0,
          daysCount: 0
        };
      }

      const current = statsMap[month];
      current.daysCount += 1;

      // Sum over postes
      ['poste1', 'poste2', 'poste3'].forEach(pKey => {
        const pData = doc.postes?.[pKey];
        
        const minage = pData?.minage || [];
        minage.forEach((r: any) => {
          const row = r.reel || r;
          if (row) {
            current.totalReel += Number(row.realMeterage || row.meterage || 0);
            current.totalAnfo += Number(row.anfo || 0);
          }
        });

        current.totalWagonsReel += Number(
          pData?.deblayageSummary?.totalWagons || 
          pData?.deblayage?.reduce((s: number, r: any) => s + Number(r.reel?.tripCount || r.tripCount || 0), 0) || 
          0
        );
      });
    });

    return Object.values(statsMap).sort((a, b) => a.month.localeCompare(b.month));
  };

  const getComparisonData = () => {
    // Merge attachements history with our aggregated production data
    const list = historiqueAttachements.map(att => {
      const month = att.mois; // e.g., "2026-06"
      const stats = getMonthlyConsolidatedStats().find(s => s.month === month);
      
      const declaredMeters = stats ? stats.totalReel : 0;
      const geometreMeters = att.totalMetrageGeometre || 0;
      const gap = declaredMeters - geometreMeters;
      const gapPct = geometreMeters > 0 ? (gap / geometreMeters) * 100 : 0;
      const anfo = stats ? stats.totalAnfo : 0;
      const wagons = stats ? stats.totalWagonsReel : 0;
      const specificCharge = geometreMeters > 0 ? (anfo / geometreMeters) : (declaredMeters > 0 ? (anfo / declaredMeters) : 0);

      return {
        month, // YYYY-MM
        declaredMeters,
        geometreMeters,
        gap,
        gapPct,
        anfo,
        wagons,
        specificCharge
      };
    });

    // Make sure we include current month as well if not already in attachments
    const currentMonthStr = journalDate.substring(0, 7);
    if (!list.some(item => item.month === currentMonthStr)) {
      const stats = getMonthlyConsolidatedStats().find(s => s.month === currentMonthStr);
      if (stats) {
        const declaredMeters = stats.totalReel;
        const geometreMeters = currentAttachement?.totalMetrageGeometre || 0;
        const gap = declaredMeters - geometreMeters;
        const gapPct = geometreMeters > 0 ? (gap / geometreMeters) * 100 : 0;
        const anfo = stats.totalAnfo;
        const wagons = stats.totalWagonsReel;
        const specificCharge = geometreMeters > 0 ? (anfo / geometreMeters) : (declaredMeters > 0 ? (anfo / declaredMeters) : 0);

        list.push({
          month: currentMonthStr,
          declaredMeters,
          geometreMeters,
          gap,
          gapPct,
          anfo,
          wagons,
          specificCharge
        });
      }
    }

    return list.sort((a, b) => a.month.localeCompare(b.month));
  };

  const getExplosifsStats = () => {
    let monthlyAnfo = 0;
    let monthlyTovex = 0;
    let monthlyAmorces = 0;
    let monthlyMeterage = 0;
    let monthlyRounds = 0;
    let monthlyTheorAnfo = 0;

    const theorAnfo9 = (platformSettings?.explosifs_9m2_anfo ?? 35);
    const theorAnfo12 = (platformSettings?.explosifs_12m2_anfo ?? 40);

    const monthlyProdDocs = allProductionDocs.filter(d => {
      const dateStr = d.date || d.id;
      return dateStr && dateStr.startsWith(explosifsMonth);
    });

    monthlyProdDocs.forEach(d => {
      if (d.postes) {
        ['poste1', 'poste2', 'poste3'].forEach(pKey => {
          const minageRows = d.postes?.[pKey]?.minage || [];
          minageRows.forEach((r: any) => {
            const row = r.reel || r;
            if (!row) return;
            const anfo = Number(row.anfo || 0);
            const tovex = Number(row.tovex || 0);
            const am = Number(row.ammorces || row.amorces || 0);
            const met = Number(row.realMeterage || 0);
            const rnd = Number(row.realRounds || row.rounds || 0);
            const gSize = Number(row.gallerySize || row.galleryType || 9);

            monthlyAnfo += anfo;
            monthlyTovex += tovex;
            monthlyAmorces += am;
            monthlyMeterage += met;
            monthlyRounds += rnd;

            const stdAnfo = gSize === 12 ? theorAnfo12 : theorAnfo9;
            monthlyTheorAnfo += rnd * stdAnfo;
          });
        });
      }
    });

    const nbRoundsTotal = explosifsHistory.reduce((s, d) => s + (d.totalRounds || 0), 0) || monthlyRounds;

    let ratio9 = 0.5;
    let ratio12 = 0.5;
    let rawRounds9 = 0;
    let rawRounds12 = 0;

    monthlyProdDocs.forEach(d => {
      if (d.postes) {
        ['poste1', 'poste2', 'poste3'].forEach(pKey => {
          const minageRows = d.postes?.[pKey]?.minage || [];
          minageRows.forEach((r: any) => {
            const row = r.reel || r;
            if (!row) return;
            const rnd = Number(row.realRounds || row.rounds || 0);
            const gSize = Number(row.gallerySize || row.galleryType || 9);
            if (gSize === 12) {
              rawRounds12 += rnd;
            } else {
              rawRounds9 += rnd;
            }
          });
        });
      }
    });

    const totalRawRounds = rawRounds9 + rawRounds12;
    if (totalRawRounds > 0) {
      ratio9 = rawRounds9 / totalRawRounds;
      ratio12 = rawRounds12 / totalRawRounds;
    }

    const theorique = nbRoundsTotal * (ratio9 * theorAnfo9 + ratio12 * theorAnfo12) || monthlyTheorAnfo;

    const ecart = monthlyAnfo - theorique;
    const ecartPct = theorique > 0 ? (ecart / theorique) * 100 : 0;

    const avgAnfoPerMeter = monthlyMeterage > 0 ? (monthlyAnfo / monthlyMeterage) : 0;

    return {
      monthlyAnfo,
      monthlyTovex,
      monthlyAmorces,
      monthlyMeterage,
      monthlyRounds,
      theorique,
      monthlyTheorAnfo,
      ecart,
      ecartPct,
      avgAnfoPerMeter
    };
  };

  const saveAttachement = async () => {
    if (saisieData.length === 0) return;
    setSavingAttachement(true);
    try {
      const docId = `SMI_${selectedMois}`;
      const totalGeometre = saisieData.reduce((s, c) => s + c.metrageGeometre, 0);
      const total9m2 = saisieData
        .filter(c => c.galleryType === '9')
        .reduce((s, c) => s + c.metrageGeometre, 0);
      const total12m2 = saisieData
        .filter(c => c.galleryType === '12')
        .reduce((s, c) => s + c.metrageGeometre, 0);

      const secteurs: Record<string, any> = {};
      saisieData.forEach(c => {
        if (!secteurs[c.secteur]) secteurs[c.secteur] = {
          metrageGeometre: 0, nbChantiers: 0
        };
        secteurs[c.secteur].metrageGeometre += c.metrageGeometre;
        secteurs[c.secteur].nbChantiers++;
      });

      await setDoc(doc(db, 'attachements', docId), {
        siteId: 'SMI',
        mois: selectedMois,
        dateSaisie: new Date().toISOString(),
        saisiPar: profile?.name || 'DT',
        valide: false,
        chantiers: saisieData,
        secteurs,
        totalMetrageGeometre: totalGeometre,
        totalMetrage9m2: total9m2,
        totalMetrage12m2: total12m2,
      });
      setSaisieMode(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingAttachement(false);
    }
  };

  const productionByChantier = getMonthlyProductionByChantier(selectedMois);
  const totalPlatef = currentAttachement ? currentAttachement.chantiers.reduce((s, c) => s + (productionByChantier[c.chantierId] || 0), 0) : 0;
  const ecartGlobal = currentAttachement ? totalPlatef - currentAttachement.totalMetrageGeometre : 0;
  const globalEcartPct = currentAttachement ? computeEcartPctActual(currentAttachement.totalMetrageGeometre, totalPlatef) : 0;
  const globalFiab = getFiabiliteLabel(globalEcartPct);

  const suspectChantiers = currentAttachement ? currentAttachement.chantiers.filter(c => {
    const platef = productionByChantier[c.chantierId] || 0;
    const ecartPct = computeEcartPctActual(c.metrageGeometre, platef);
    return isSuspectFraude(ecartPct) || (c.metrageGeometre === 0 && platef > 0);
  }) : [];

  const sortedHistory = [...historiqueAttachements].sort((a, b) => a.mois.localeCompare(b.mois));
  const systematicAnomalies: { chantierName: string; consecutiveMonths: number }[] = [];

  allChantiers.forEach(chan => {
    let maxConsecutive = 0;
    let currentConsecutive = 0;
    sortedHistory.forEach(att => {
      const chRow = att.chantiers?.find((x: any) => x.chantierId === chan.id);
      if (chRow) {
        const prodMap = getMonthlyProductionByChantier(att.mois);
        const platefProd = prodMap[chan.id] || 0;
        if (platefProd > chRow.metrageGeometre) {
          currentConsecutive++;
          if (currentConsecutive > maxConsecutive) {
            maxConsecutive = currentConsecutive;
          }
        } else {
          currentConsecutive = 0;
        }
      } else {
        currentConsecutive = 0;
      }
    });
    if (maxConsecutive >= 3) {
      systematicAnomalies.push({ chantierName: chan.name, consecutiveMonths: maxConsecutive });
    }
  });

  const bilan = getBilanJournal();
  const expStats = getExplosifsStats();

  const dailyRows = (explosifsHistory || []).map(h => {
    const dailyAnfo = h.totalAnfo || 0;
    const dailyTovex = h.totalTovex || 0;
    const dailyAmorces = h.totalAmorces || 0;
    const dailyMeterage = h.totalMeterage || 0;
    const ratio = dailyMeterage > 0 ? (dailyAnfo / dailyMeterage) : 0;

    let statusLabel = '-';
    let statusClass = 'text-slate-400 bg-slate-900/40 border-slate-700/50';

    if (h.status === 'locked' || h.status === 'sealed') {
      statusLabel = 'SCELLÉ';
      statusClass = 'bg-emerald-950/20 text-emerald-400 border-emerald-500/20';
    } else if (h.status) {
      statusLabel = 'EN COURS';
      statusClass = 'bg-amber-950/20 text-amber-400 border-amber-500/20';
    }

    return {
      date: h.date,
      anfo: dailyAnfo,
      tovex: dailyTovex,
      tovexTimes10: dailyTovex * 10,
      amorces: dailyAmorces,
      ratio,
      statusLabel,
      statusClass
    };
  });

  const generateMonthlyReport = () => {
    setGeneratingPDF(true);

    const totalMeteragePlatf = rapportHistory.reduce((s, d) => s + (d.totalMeterageRealised || 0), 0);
    const totalMeteragePlan = rapportHistory.reduce((s, d) => s + (d.totalMeteragePlanned || 0), 0);
    const totalMetrageGeo = rapportAttachement?.totalMetrageGeometre || null;
    const totalWagons = rapportHistory.reduce((s, d) => s + (d.totalWagonsRealised || 0), 0);
    const totalAnfo = rapportHistory.reduce((s, d) => s + (d.totalAnfo || 0), 0);
    const tauxRealisation = totalMeteragePlan > 0
      ? (totalMeteragePlatf / totalMeteragePlan * 100).toFixed(1) : '—';

    const [year, month] = rapportMonth.split('-');
    const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    const monthLabel = `${monthNames[parseInt(month) - 1]} ${year}`;

    const html = `<!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <title>Rapport Production — SMI Imiter — ${monthLabel}</title>
      <script src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"></script>
      <script>
        function downloadPDF() {
          const btn = document.getElementById('download-btn');
          const originalText = btn ? btn.innerHTML : '';
          if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<span>⏳</span> Téléchargement...';
          }
          
          const element = document.querySelector('.report-container');
          const opt = {
            margin:       [12, 12, 12, 12],
            filename:     'Rapport_Mensuel_Production_SMI_Imiter_${rapportMonth}.pdf',
            image:        { type: 'jpeg', quality: 0.98 },
            html2canvas:  { 
              scale: 2, 
              useCORS: true, 
              logging: false,
              letterRendering: true
            },
            jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
          };
          
          html2pdf().from(element).set(opt).save().then(() => {
            if (btn) {
              btn.disabled = false;
              btn.innerHTML = originalText;
            }
          }).catch(err => {
            console.error('Error generating PDF:', err);
            if (btn) {
              btn.disabled = false;
              btn.innerHTML = originalText;
            }
          });
        }

        window.onload = function() {
          setTimeout(downloadPDF, 1200);
        };
      </script>
      <style>
        @page { margin: 20mm; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; font-size: 11px; color: #1e293b; background: #f1f5f9; margin: 0; padding: 0; }
        .report-container {
          max-width: 210mm;
          margin: 20px auto;
          background: white;
          padding: 20mm;
          box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
          border-radius: 12px;
        }
        .header { background: #0f172a; padding: 20px 28px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .header-left h1 { color: #ffd700; font-size: 16px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; }
        .header-left p { color: #94a3b8; font-size: 9px; text-transform: uppercase; letter-spacing: 1px; margin-top: 3px; }
        .header-right { text-align: right; }
        .header-right .mois { color: #ffd700; font-size: 18px; font-weight: 900; text-transform: uppercase; }
        .header-right .site { color: #64748b; font-size: 9px; text-transform: uppercase; letter-spacing: 1px; margin-top: 2px; }
        .section-title { font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 1.5px; color: #0f172a; border-left: 4px solid #ffd700; padding-left: 10px; margin: 18px 0 10px; }
        .kpi-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; margin-bottom: 18px; }
        .kpi { border: 1.5px solid #e2e8f0; border-radius: 8px; padding: 12px; text-align: center; }
        .kpi-value { font-size: 22px; font-weight: 900; color: #1a5276; }
        .kpi-label { font-size: 8px; text-transform: uppercase; color: #64748b; font-weight: 700; margin-top: 3px; letter-spacing: 0.8px; }
        .kpi-sub { font-size: 8px; color: #94a3b8; margin-top: 2px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        th { background: #0f172a; color: white; padding: 7px 8px; font-size: 8px; text-transform: uppercase; letter-spacing: 0.5px; text-align: left; }
        td { padding: 6px 8px; border-bottom: 1px solid #f1f5f9; font-size: 10px; }
        tr:nth-child(even) td { background: #f8fafc; }
        .badge { display: inline-block; padding: 2px 7px; border-radius: 99px; font-size: 8px; font-weight: 900; text-transform: uppercase; }
        .badge-green { background: #dcfce7; color: #166534; }
        .badge-amber { background: #fef3c7; color: #92400e; }
        .badge-red { background: #fee2e2; color: #991b1b; }
        .attachement-box { background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 8px; padding: 12px; margin-bottom: 16px; }
        .no-attachement { background: #fef9c3; border: 1.5px solid #fde047; border-radius: 8px; padding: 12px; margin-bottom: 16px; font-size: 9px; color: #854d0e; text-transform: uppercase; font-weight: 700; }
        .footer { margin-top: 24px; padding-top: 10px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; color: #94a3b8; font-size: 8px; }
        .signature-box { border-top: 1px solid #1e293b; width: 180px; padding-top: 4px; font-size: 8px; color: #64748b; text-transform: uppercase; }
        
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
          .report-container {
            max-width: 100%;
            margin: 0;
            padding: 0;
            box-shadow: none;
            border-radius: 0;
          }
        }
      </style>
    </head>
    <body>
      <div class="no-print" style="background:#1e293b; padding:12px 24px; display:flex; justify-content:space-between; align-items:center; border-bottom:3px solid #b8860b; font-family: system-ui, -apple-system, sans-serif; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);">
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="font-size:16px;">📄</span>
          <div>
            <div style="color:#ffffff; font-weight:800; font-size:13px; text-transform:uppercase; letter-spacing:0.5px;">Aperçu du Rapport Mensuel</div>
            <div style="color:#94a3b8; font-size:10px; font-weight:500;">SMI Imiter — Hydromines</div>
          </div>
        </div>
        <button id="download-btn" onclick="downloadPDF()" style="background:linear-gradient(135deg, #b8860b, #ffd700); color:#0f172a; border:none; padding:8px 18px; border-radius:8px; font-weight:900; font-size:11px; cursor:pointer; display:flex; align-items:center; gap:8px; box-shadow:0 2px 4px rgba(0,0,0,0.15); transition:all 0.2s; text-transform:uppercase; letter-spacing:0.5px;">
          <span>⬇️</span> Télécharger le PDF
        </button>
      </div>

      <div class="report-container">
        <div class="header">
          <div class="header-left">
            <h1>⛏️ HYDROMINES — SMI IMITER</h1>
            <p>Rapport Mensuel de Production — Confidentiel</p>
            <p style="color:#475569; margin-top:4px;">
              Généré le ${new Date().toLocaleDateString('fr-MA', {
                day: 'numeric', month: 'long', year: 'numeric'
              })} par El yaakouby Hamid
            </p>
          </div>
          <div class="header-right">
            <div class="mois">${monthLabel}</div>
            <div class="site">Mine Souterraine d'Argent</div>
          </div>
        </div>

        <div class="section-title">Indicateurs Clés de Performance</div>
      <div class="kpi-grid">
        <div class="kpi">
          <div class="kpi-value">${totalMeteragePlatf.toFixed(0)} m</div>
          <div class="kpi-label">⛏️ Métrage Plateforme</div>
          <div class="kpi-sub">Planifié : ${totalMeteragePlan.toFixed(0)} m</div>
        </div>
        ${totalMetrageGeo !== null ? `
        <div class="kpi">
          <div class="kpi-value" style="color:#16a34a">
            ${totalMetrageGeo.toFixed(0)} m
          </div>
          <div class="kpi-label">📐 Métrage Géomètre Officiel</div>
          <div class="kpi-sub">Source : Attachements MANAGEM</div>
        </div>` : `
        <div class="kpi" style="background:#fef9c3">
          <div class="kpi-value" style="color:#d97706">N/A</div>
          <div class="kpi-label">📐 Métrage Géomètre</div>
          <div class="kpi-sub">Attachements non saisis</div>
        </div>`}
        <div class="kpi">
          <div class="kpi-value">${totalWagons}</div>
          <div class="kpi-label">🚛 Wagons Extraits</div>
        </div>
        <div class="kpi">
          <div class="kpi-value">${tauxRealisation}%</div>
          <div class="kpi-label">🎯 Taux Réalisation</div>
          <div class="kpi-sub">Plateforme vs Planifié</div>
        </div>
      </div>

      ${rapportAttachement ? `
      <div class="attachement-box">
        ✅ Attachements géomètres disponibles — Métrage officiel :
        <strong>${rapportAttachement.totalMetrageGeometre.toFixed(1)} m</strong>
        (dont 9m² : ${rapportAttachement.totalMetrage9m2.toFixed(1)} m |
        12m² : ${rapportAttachement.totalMetrage12m2.toFixed(1)} m)
      </div>` : `
      <div class="no-attachement">
        ⚠️ Attachements géomètres non encore saisis pour ${monthLabel}.
        Le métrage affiché est celui de la plateforme (non validé géomètre).
      </div>`}

      <div class="section-title">Détail Journalier</div>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Prévu (m)</th>
            <th>Réalisé (m)</th>
            <th>Taux</th>
            <th>Wagons Prévu</th>
            <th>Wagons Réalisé</th>
            <th>ANFO (kg)</th>
            <th>Statut</th>
          </tr>
        </thead>
        <tbody>
          ${rapportHistory.map(d => {
            const taux = d.totalMeteragePlanned > 0
              ? (d.totalMeterageRealised / d.totalMeteragePlanned * 100).toFixed(0)
              : '—';
            const tauxNum = Number(taux);
            const badge = tauxNum >= 90 ? 'badge-green'
              : tauxNum >= 70 ? 'badge-amber' : 'badge-red';
            return `
            <tr>
              <td><strong>${d.date || d.id}</strong></td>
              <td>${(d.totalMeteragePlanned || 0).toFixed(1)}</td>
              <td><strong>${(d.totalMeterageRealised || 0).toFixed(1)}</strong></td>
              <td><span class="badge ${badge}">${taux}%</span></td>
              <td>${d.totalWagonsPlanned || 0}</td>
              <td><strong>${d.totalWagonsRealised || 0}</strong></td>
              <td>${(d.totalAnfo || 0).toFixed(0)}</td>
              <td>${d.sealed ? '✅ Scellé' : '⏳'}</td>
            </tr>`;
          }).join('')}
        </tbody>
        <tfoot>
          <tr style="background:#f1f5f9; font-weight:900;">
            <td>TOTAL MOIS</td>
            <td>${totalMeteragePlan.toFixed(1)}</td>
            <td>${totalMeteragePlatf.toFixed(1)}</td>
            <td><span class="badge ${
              Number(tauxRealisation) >= 90 ? 'badge-green'
              : Number(tauxRealisation) >= 70 ? 'badge-amber' : 'badge-red'
            }">${tauxRealisation}%</span></td>
            <td>${rapportHistory.reduce((s, d) => s + (d.totalWagonsPlanned || 0), 0)}</td>
            <td>${totalWagons}</td>
            <td>${totalAnfo.toFixed(0)} kg</td>
            <td></td>
          </tr>
        </tfoot>
      </table>

      <div class="footer">
        <div>HYDROMINES | SMI Imiter | Document Confidentiel</div>
        <div class="signature-box">
          Directeur Technique<br/>
          <strong>El yaakouby Hamid</strong>
        </div>
      </div>
      </div>
    </body></html>`;

    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => { setGeneratingPDF(false); }, 600);
    } else {
      setGeneratingPDF(false);
    }
  };

  const QUESTIONS_DT = [
    "Quel secteur performe le moins bien ce mois-ci et pourquoi ?",
    "Y a-t-il des chantiers dont les déclarations de métrage semblent suspectes ?",
    "Quelle est la tendance de consommation d'explosifs sur les 14 derniers jours ?",
    "Quels sont les 3 points d'amélioration prioritaires pour le mois prochain ?",
    "Quel mineur décroche en termes de rendement m/volée ?",
    "La projection fin de mois est-elle en ligne avec les objectifs ?",
  ];

  const CATEGORIZED_QUESTIONS_DT = [
    {
      category: "Rendement & Performance",
      icon: "📈",
      color: "amber",
      questions: [
        {
          label: "Secteur Moins Performant",
          q: "Quel secteur performe le moins bien ce mois-ci et pourquoi ?",
          desc: "Analyse des pertes d'avancement par zone de la SMI."
        },
        {
          label: "Alerte Rendement Foration",
          q: "Quel mineur décroche en termes de rendement m/volée ?",
          desc: "Contrôle individuel des performances de foration."
        }
      ]
    },
    {
      category: "Fiabilité & Audit de Données",
      icon: "🔍",
      color: "blue",
      questions: [
        {
          label: "Détection de Métrages Suspects",
          q: "Y a-t-il des chantiers dont les déclarations de métrage semblent suspectes ?",
          desc: "Audit de cohérence entre les déclarations SMI."
        },
        {
          label: "Consommation d'Explosifs",
          q: "Quelle est la tendance de consommation d'explosifs sur les 14 derniers jours ?",
          desc: "Suivi d'efficience et surcharges de chargement."
        }
      ]
    },
    {
      category: "Décisions & Anticipation",
      icon: "⚡",
      color: "gold",
      questions: [
        {
          label: "Priorités d'Amélioration SMI",
          q: "Quels sont les 3 points d'amélioration prioritaires pour le mois prochain ?",
          desc: "Décisions clés pour optimiser les cycles."
        },
        {
          label: "Projection d'Objectifs",
          q: "La projection fin de mois est-elle en ligne avec les objectifs ?",
          desc: "Calcul prédictif et extrapolations d'avancement."
        },
        {
          label: "Rapport Flash de Direction",
          q: "Générer un rapport flash d'optimisation d'urgence pour le Comité de Direction.",
          desc: "Synthèse stratégique d'impact prête à présenter."
        }
      ]
    }
  ];

  const dtProductionData = {
    moisActuel: rapportMonth,
    nbJours: rapportHistory.length,
    totalMeteragePlatf: rapportHistory
      .reduce((s, d) => s + (d.totalMeterageRealised || 0), 0).toFixed(1),
    totalMeteragePlan: rapportHistory
      .reduce((s, d) => s + (d.totalMeteragePlanned || 0), 0).toFixed(1),
    totalAnfo: rapportHistory
      .reduce((s, d) => s + (d.totalAnfo || 0), 0).toFixed(0),
    metrageGeoOfficial: rapportAttachement?.totalMetrageGeometre?.toFixed(1) || 'Non disponible',
    derniers7jours: rapportHistory.slice(-7).map(d => ({
      date: d.date,
      meterage: d.totalMeterageRealised,
      wagons: d.totalWagonsRealised,
    })),
    site: 'SMI Imiter — Mine souterraine d\'argent',
    secteurs: ['Imiter 1', 'Imiter 2', 'Imiter Est'],
  };

  const callDtIA = async (overrideQuestion?: string) => {
    const questionToUse = overrideQuestion || dtQuestion;
    if (!questionToUse) return;
    setLoadingDT(true);
    setDtResponse(null);
    setStructuredResponse(null);
    setDtError(null);
    setLoaderStep(0);
    try {
      const response = await fetch('/api/ia/expert-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expertName: 'M. ELYAAKOUBY HAMID',
          profile: `Directeur technique hydromines avec une expertise chevronnée dans les mines souterraines d'argent au Maroc. Expert en optimisation de production, gestion des explosifs, rendement des équipes de foreurs et analyse des performances de chantier. Il répond toujours de manière directe, avec des chiffres précis et des décisions concrètes. Il identifie le problème et donne la solution.`,
          dataContext: dtProductionData,
          customQuestion: questionToUse,
        }),
      });
      if (!response.ok) throw new Error(`Erreur ${response.status}`);
      const data = await response.json();
      
      const structuredData = {
        analysis: data.analysis || '',
        anomalies: data.anomalies || [],
        suggestions: data.suggestions || [],
        logic: data.logic || ''
      };

      setStructuredResponse(structuredData);

      const text = [
        data.analysis,
        data.anomalies?.length
          ? '\n\n⚠️ Anomalies :\n' + data.anomalies.join('\n')
          : '',
        data.suggestions?.length
          ? '\n\n✅ Recommandations :\n' + data.suggestions.join('\n')
          : '',
      ].filter(Boolean).join('');
      setDtResponse(text);

      // Save to local history
      setSavedAnalyses(prev => [
        {
          id: Date.now().toString(),
          date: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          question: questionToUse,
          response: structuredData
        },
        ...prev
      ]);
      setActiveReportTab('synthese');
    } catch (err: any) {
      setDtError(err.message || 'Erreur de connexion');
    } finally {
      setLoadingDT(false);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loadingDT) {
      setLoaderStep(0);
      interval = setInterval(() => {
        setLoaderStep(prev => (prev < 4 ? prev + 1 : prev));
      }, 850);
    }
    return () => clearInterval(interval);
  }, [loadingDT]);

  const overviewBilan = getBilanJournal();
  const overviewExplosifs = getExplosifsStats();
  const overviewSectorHealth = getSectorHealth();
  const bureFocusData = getBureFocusData(bureFocusPeriod);
  const voleeRateePatterns = getVoleeRateePatterns();

  const getUserEngagement = () => {
    const currentMonth = selectedMois;
    const byUser: Record<string, { count: number; lastTimestamp: string; lastAction: string; actions: Record<string, number> }> = {};

    auditLogs
      .filter((log: any) => log.date && log.date.startsWith(currentMonth))
      .forEach((log: any) => {
        const user = log.user || 'Inconnu';
        if (!byUser[user]) byUser[user] = { count: 0, lastTimestamp: '', lastAction: '', actions: {} };
        byUser[user].count++;
        byUser[user].actions[log.action] = (byUser[user].actions[log.action] || 0) + 1;
        if (!byUser[user].lastTimestamp || log.timestamp > byUser[user].lastTimestamp) {
          byUser[user].lastTimestamp = log.timestamp;
          byUser[user].lastAction = log.action;
        }
      });

    return Object.entries(byUser)
      .map(([user, v]) => ({ user, ...v }))
      .sort((a, b) => b.count - a.count);
  };

  const userEngagement = getUserEngagement();
  const chefsForCurrentPost = getChefsForCurrentPost();
  const aideMineurRanking = employees
    .filter((e: any) => e.fonction === 'AIDE_MINEUR' && e.status === 'actif')
    .map((e: any) => ({
      ...calculateAssistantMinerStats(e.matricule, allProductionDocs),
      name: `${e.prenom || ''} ${e.nom || ''}`.trim()
    }))
    .filter((s: any) => s.totalMetersAssisted > 0)
    .sort((a: any, b: any) => b.totalMetersAssisted - a.totalMetersAssisted)
    .slice(0, 5);
  const deblayageVolumeData = getDeblayageVolumeDaily();
  const bureEngineDailyTrend = getBureEngineDailyTrend();
  const extractionDailyTrend = getExtractionDailyTrend();

  const overviewAlerts: { type: 'critique' | 'attention'; text: string; source: DTTab }[] = [];

  if (journalExplications.length > 0) {
    overviewAlerts.push({
      type: 'attention',
      text: `${journalExplications.length} explication${journalExplications.length > 1 ? 's' : ''} en attente pour le ${journalDate}`,
      source: 'journal'
    });
  }

  if (suspectChantiers.length > 0) {
    suspectChantiers.forEach(c => {
      overviewAlerts.push({
        type: 'critique',
        text: `${c.chantierName} : déclaration suspecte détectée pour ${selectedMois}`,
        source: 'attachements'
      });
    });
  }

  if (systematicAnomalies.length > 0) {
    systematicAnomalies.forEach(a => {
      overviewAlerts.push({
        type: 'critique',
        text: `${a.chantierName} : écart anormal sur ${a.consecutiveMonths} mois consécutifs — audit recommandé`,
        source: 'attachements'
      });
    });
  }

  const overviewStatusGlobal: 'nominal' | 'attention' =
    overviewAlerts.some(a => a.type === 'critique') ? 'attention' : 'nominal';

  useEffect(() => {
    if (overviewAlerts.length <= 1) return;
    const interval = setInterval(() => setTickerIndex(i => (i + 1) % overviewAlerts.length), 5000);
    return () => clearInterval(interval);
  }, [overviewAlerts.length]);

  const overviewLastAnalysis = savedAnalyses.length > 0
    ? savedAnalyses[savedAnalyses.length - 1]
    : null;

  return (
    <div className="min-h-screen bg-white p-4 sm:p-6">
      {/* Premium Hydromines Gold Banner */}
      <div 
        className="bg-white p-6 sm:p-8 rounded-3xl border border-[#b8860b]/15 shadow-lg relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 mb-6 group"
        style={{ boxShadow: '0 4px 20px -2px rgba(184, 134, 11, 0.04), 0 1px 3px rgba(0,0,0,0.05)' }}
        onMouseMove={handleBannerMouseMove}
        onMouseLeave={handleBannerMouseLeave}
      >
        {/* Background Subtle Shimmer */}
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-amber-500/5 animate-pulse pointer-events-none" />

        {/* High-End Vector Topographical Mine Grid Overlay */}
        <motion.div 
          className="absolute inset-0 z-0 opacity-[0.14] pointer-events-none select-none overflow-hidden"
          animate={{
            x: bannerMouse.x * -18,
            y: bannerMouse.y * -18,
          }}
          transition={{ type: 'spring', stiffness: 80, damping: 20 }}
        >
          <svg viewBox="0 0 1000 240" fill="none" className="w-full h-full object-cover">
            <defs>
              <linearGradient id="mineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#b8860b" />
                <stop offset="50%" stopColor="#ffd700" />
                <stop offset="100%" stopColor="#b8860b" />
              </linearGradient>
            </defs>
            {/* Topographic mineral veins */}
            <motion.path 
              d="M-50,180 Q200,60 450,160 T950,100 T1100,190" 
              stroke="url(#mineGradient)" 
              strokeWidth="1.5"
              strokeDasharray="5, 8"
              animate={{ strokeDashoffset: [0, -50] }}
              transition={{ repeat: Infinity, ease: "linear", duration: 15 }}
            />
            <motion.path 
              d="M-50,130 Q250,200 500,80 T1050,140" 
              stroke="url(#mineGradient)" 
              strokeWidth="1"
              strokeDasharray="12, 12"
              animate={{ strokeDashoffset: [0, 60] }}
              transition={{ repeat: Infinity, ease: "linear", duration: 25 }}
            />
            <motion.path 
              d="M-50,70 Q300,-10 550,120 T1150,50" 
              stroke="url(#mineGradient)" 
              strokeWidth="0.75"
              opacity="0.6"
            />
            {/* Horizontal Grid Lines */}
            <line x1="0" y1="40" x2="1100" y2="40" stroke="#b8860b" strokeWidth="0.5" strokeDasharray="1, 15" opacity="0.3" />
            <line x1="0" y1="120" x2="1100" y2="120" stroke="#b8860b" strokeWidth="0.5" strokeDasharray="1, 15" opacity="0.3" />
            <line x1="0" y1="200" x2="1100" y2="200" stroke="#b8860b" strokeWidth="0.5" strokeDasharray="1, 15" opacity="0.3" />
            
            {/* Stylized Tunnel Junction markers */}
            <circle cx="200" cy="113" r="3" fill="#ffd700" className="animate-ping" style={{ animationDuration: '3s' }} />
            <circle cx="200" cy="113" r="2.5" fill="#b8860b" />
            
            <circle cx="725" cy="118" r="3" fill="#ffd700" className="animate-ping" style={{ animationDuration: '4s' }} />
            <circle cx="725" cy="118" r="2.5" fill="#b8860b" />

            <circle cx="482" cy="85" r="3" fill="#ffd700" className="animate-ping" style={{ animationDuration: '5s' }} />
            <circle cx="482" cy="85" r="2.5" fill="#b8860b" />
          </svg>
          
          {/* Mine Coordinate Indicators in monospace for realism */}
          <div className="absolute bottom-2 left-4 font-mono text-[8px] text-slate-400 tracking-wider">
            COORD_X: 428.529 • LEVEL: 1450m • GRID: SMI_IMITER_MAIN
          </div>
          <div className="absolute top-2 right-4 font-mono text-[8px] text-slate-400 tracking-wider">
            SYS_STATUS: NOMINAL • LATENCY: 24MS
          </div>
        </motion.div>
        
        <div className="flex items-center gap-5 z-10 text-center md:text-left flex-col md:flex-row">
          <motion.div 
            key={crownKey}
            title="Cliquez pour ré-assembler la couronne de la Haute Direction"
            onClick={() => setCrownKey(p => p + 1)}
            className="w-16 h-16 rounded-2xl bg-slate-950 flex items-center justify-center shadow-[0_4px_15px_rgba(184,134,11,0.2)] border border-[#b8860b]/40 cursor-pointer select-none shrink-0 relative overflow-hidden group/crown"
            animate={{
              rotate: [0, -2, 2, -2, 0],
              scale: [1, 1.02, 1],
            }}
            whileHover={{ scale: 1.05, borderColor: '#ffd700', boxShadow: '0 0 20px rgba(255,215,0,0.4)' }}
            whileTap={{ scale: 0.95 }}
            transition={{
              rotate: {
                repeat: Infinity,
                duration: 6,
                ease: "easeInOut"
              },
              scale: {
                repeat: Infinity,
                duration: 4,
                ease: "easeInOut"
              }
            }}
          >
            {/* White shadow/glow at the beginning, fades out completely at 4s */}
            <motion.div
              className="absolute inset-2 bg-white rounded-full filter blur-md pointer-events-none"
              initial={{ opacity: 0.95, scale: 1.1 }}
              animate={{ 
                opacity: 0,
                scale: 0.5,
              }}
              transition={{
                duration: 4.0,
                ease: [0.16, 1, 0.3, 1]
              }}
            />

            {/* Projection de lumière blanche sur le bord droit de sa carte (crown block card) */}
            <motion.div
              className="absolute top-0 right-0 h-full w-5 bg-gradient-to-l from-white/45 via-white/15 to-transparent pointer-events-none transform skew-x-[-15deg] origin-top-right z-20"
              animate={{
                opacity: [0.3, 0.85, 0.5, 0.85, 0.3],
              }}
              transition={{
                duration: 4.0,
                repeat: Infinity,
                ease: "easeInOut"
              }}
            />

            {/* Subtle rotating starfield or dust particles behind the crown */}
            <div className="absolute inset-0 bg-[radial-gradient(#ffd70012_1px,transparent_1px)] [background-size:8px_8px] opacity-60 pointer-events-none" />

            {/* Micro-sparkle light glint line */}
            <motion.div 
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full"
              style={{
                animation: 'shimmer-fast 3.5s infinite linear'
              }}
            />

            {/* High-End Vector Crown SVG with pure white luminous glow and no dark shadows */}
            <svg 
              viewBox="0 0 100 100" 
              fill="none" 
              className="w-12 h-12 z-10 drop-shadow-[0_0_12px_rgba(255,255,255,0.95)]"
            >
              <defs>
                <linearGradient id="crownGold" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ffd700" />
                  <stop offset="40%" stopColor="#ffb300" />
                  <stop offset="75%" stopColor="#b8860b" />
                  <stop offset="100%" stopColor="#ffd700" />
                </linearGradient>
                <linearGradient id="jewelAmber" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="35%" stopColor="#ffb300" />
                  <stop offset="100%" stopColor="#8b5a00" />
                </linearGradient>
              </defs>

              {/* 1. Base Band of the Crown - flies in from the bottom with rotation */}
              <motion.path
                d="M 22 66 C 22 64.5, 23.5 63, 25 63 h 50 C 76.5 63, 78 64.5, 78 66 v 4 C 78 71.5, 76.5 73, 75 73 H 25 C 23.5 73, 22 71.5, 22 70 Z"
                fill="url(#crownGold)"
                initial={{ opacity: 0, y: 55, x: -10, rotate: -25 }}
                animate={{ opacity: 1, y: 0, x: 0, rotate: 0 }}
                transition={{ duration: 4.0, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
              />

              {/* 2. Left Peak - flies in from left and rotates into place */}
              <motion.path
                d="M 24 63 L 33 34 L 42 52 L 35 63 Z"
                fill="url(#crownGold)"
                initial={{ opacity: 0, x: -35, y: -20, rotate: -45 }}
                animate={{ opacity: 1, x: 0, y: 0, rotate: 0 }}
                transition={{ duration: 4.0, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
              />

              {/* 3. Right Peak - flies in from right and rotates into place */}
              <motion.path
                d="M 76 63 L 67 34 L 58 52 L 65 63 Z"
                fill="url(#crownGold)"
                initial={{ opacity: 0, x: 35, y: -20, rotate: 45 }}
                animate={{ opacity: 1, x: 0, y: 0, rotate: 0 }}
                transition={{ duration: 4.0, delay: 0.7, ease: [0.16, 1, 0.3, 1] }}
              />

              {/* 4. Middle Peak - scale up from center bottom of the crown */}
              <motion.path
                d="M 38 63 L 50 21 L 62 63 Z"
                fill="url(#crownGold)"
                initial={{ opacity: 0, y: -30, scaleY: 0.2 }}
                animate={{ opacity: 1, y: 0, scaleY: 1 }}
                transition={{ duration: 4.0, delay: 1.0, ease: [0.16, 1, 0.3, 1] }}
              />

              {/* 5. Left Peak Jewel - scales in after peaks land */}
              <motion.circle
                cx="33"
                cy="29"
                r="3.5"
                fill="url(#jewelAmber)"
                stroke="#ffd700"
                strokeWidth="0.5"
                initial={{ opacity: 0, scale: 0, y: -15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 4.0, delay: 1.4, ease: [0.16, 1, 0.3, 1] }}
              />

              {/* 6. Right Peak Jewel - scales in after peaks land */}
              <motion.circle
                cx="67"
                cy="29"
                r="3.5"
                fill="url(#jewelAmber)"
                stroke="#ffd700"
                strokeWidth="0.5"
                initial={{ opacity: 0, scale: 0, y: -15 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 4.0, delay: 1.6, ease: [0.16, 1, 0.3, 1] }}
              />

              {/* 7. Middle Peak Jewel (Main Diamond) - drops majestically from above */}
              <motion.circle
                cx="50"
                cy="15"
                r="4.5"
                fill="url(#jewelAmber)"
                stroke="#ffd700"
                strokeWidth="0.5"
                initial={{ opacity: 0, y: -50, scale: 0 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 4.0, delay: 2.0, ease: [0.16, 1, 0.3, 1] }}
              />

              {/* 8. Base Embellishment Gems - appear with a sparkle shimmer */}
              <motion.circle
                cx="32"
                cy="68"
                r="1.8"
                fill="#ffffff"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: [0, 0, 1], scale: [0, 0, 1] }}
                transition={{ duration: 4.0, delay: 2.4 }}
              />
              <motion.circle
                cx="50"
                cy="68"
                r="1.8"
                fill="#ffffff"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: [0, 0, 1], scale: [0, 0, 1] }}
                transition={{ duration: 4.0, delay: 2.6 }}
              />
              <motion.circle
                cx="68"
                cy="68"
                r="1.8"
                fill="#ffffff"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: [0, 0, 1], scale: [0, 0, 1] }}
                transition={{ duration: 4.0, delay: 2.8 }}
              />
            </svg>

            {/* Glowing gold border overlay after assembly completes */}
            <motion.div 
              className="absolute inset-0 border border-[#ffd700] rounded-2xl opacity-0 pointer-events-none"
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0, 0.4, 0] }}
              transition={{ duration: 4.0, delay: 2.8 }}
            />
          </motion.div>
          <div>
            <div className="subtle-glow-line w-24 mb-1.5 mx-auto md:mx-0 opacity-80" />
            <h1 className="gold-title text-xl sm:text-2xl md:text-3xl font-black tracking-wider leading-none uppercase">
              ESPACE DIRECTEUR TECHNIQUE
            </h1>
            <div className="subtle-glow-line w-full mt-2 mb-2.5 opacity-80" />
            <p className="text-[10px] sm:text-xs font-black uppercase text-slate-500 tracking-widest">
              SMI IMITER — MR. EL YAAKOUBY HAMID • DIRECTION TECHNIQUE & COMMANDEMENT D'EXPLOITATION
            </p>
          </div>
        </div>

        {/* Welcome Card & Bilan summary on the right side - representing the 25% Hydromines Touch */}
        <motion.div 
          className="bg-slate-50/95 backdrop-blur-xs border border-amber-500/25 rounded-2xl p-4 flex flex-col items-center justify-center text-center z-10 w-full md:w-56 shrink-0 shadow-sm"
          animate={{
            x: bannerMouse.x * 12,
            y: bannerMouse.y * 12,
          }}
          transition={{ type: 'spring', stiffness: 100, damping: 15 }}
        >
          <div className="text-[#b8860b] text-[8px] font-black uppercase tracking-widest">
            Session Haute Direction
          </div>
          <div className="text-slate-800 text-[12px] font-black uppercase flex items-center gap-1.5 mt-1.5">
            Mr. HAMID EL YAAKOUBY
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">
            Directeur Technique
          </p>
        </motion.div>
      </div>

      {/* Tab Selector Buttons using Premium Gold & Amber accents with smooth sliding pill layout transitions */}
      <div className="flex justify-start sm:justify-center gap-2 mb-6 overflow-x-auto pb-1.5 scrollbar-thin">
        {tabs.map(tab => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`relative flex items-center gap-2 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all duration-300 ease-out cursor-pointer select-none border ${
                isActive
                  ? 'border-transparent shadow-[0_2px_10px_rgba(184,134,11,0.15)]'
                  : 'bg-white border-[#b8860b]/15 shadow-[0_4px_12px_-2px_rgba(184,134,11,0.03),0_1px_2px_rgba(0,0,0,0.02)] hover:border-[#b8860b]/40 hover:shadow-[0_4px_15px_-1px_rgba(184,134,11,0.08)] hover:-translate-y-0.5'
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeDTTab"
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-[#b8860b] to-[#ffd700] shadow-[0_2px_10px_rgba(184,134,11,0.2)]"
                  transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                />
              )}
              <span className={`text-xs shrink-0 z-10 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                {tab.icon}
              </span>
              <span className={`z-10 transition-colors duration-300 ${isActive ? 'text-slate-950 font-black' : 'text-slate-600 hover:text-slate-900 font-semibold'}`}>
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>

      <div className="p-6">
        {activeTab === 'vue_ensemble' && (
          <div className="space-y-6">

            {overviewAlerts.length > 0 && (() => {
              const current = overviewAlerts[tickerIndex % overviewAlerts.length];
              const c = current.type === 'critique' ? STATUS_COLORS.critique : STATUS_COLORS.attention;
              return (
                <button
                  onClick={() => setActiveTab(current.source)}
                  className={`w-full text-left rounded-xl border px-4 py-2.5 flex items-center gap-3 transition-colors ${c.bg} ${c.border}`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${c.dot}`} />
                  <span className={`text-[11px] font-bold ${c.text}`}>{current.text}</span>
                </button>
              );
            })()}

            {/* PANNEAU DE BIENVENUE */}
            <div className="mb-8 animate-in fade-in slide-in-from-top-2 duration-500">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#b8860b] mb-1">
                {new Date().getHours() < 12 ? 'Bonjour' : new Date().getHours() < 18 ? 'Bon après-midi' : 'Bonsoir'}
              </p>
              <h2 className="text-2xl font-black text-slate-900 tracking-tight">
                {profile?.name || 'Hamid El Yaakouby'}
              </h2>
              <p className="text-[11px] font-semibold text-slate-400 mt-1 capitalize">
                {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>

            {/* STATUS GLOBAL */}
            <div className={`mb-8 rounded-2xl border p-5 flex items-center justify-between
              animate-in fade-in slide-in-from-top-2 duration-500 delay-75
              ${overviewStatusGlobal === 'nominal' ? `${STATUS_COLORS.nominal.bg} ${STATUS_COLORS.nominal.border}` : `${STATUS_COLORS.critique.bg} ${STATUS_COLORS.critique.border}`}`}
            >
              <div className="flex items-center gap-3">
                <span className={`w-2.5 h-2.5 rounded-full ${
                  overviewStatusGlobal === 'nominal' ? STATUS_COLORS.nominal.dot : `${STATUS_COLORS.critique.dot} animate-pulse`
                }`} />
                <span className={`text-[13px] font-black uppercase tracking-wider ${
                  overviewStatusGlobal === 'nominal' ? STATUS_COLORS.nominal.text : STATUS_COLORS.critique.text
                }`}>
                  {overviewStatusGlobal === 'nominal' ? 'Tout est nominal' : `${overviewAlerts.length} point${overviewAlerts.length > 1 ? 's' : ''} d'attention`}
                </span>
              </div>
              <div className="h-1 w-16 rounded-full bg-gradient-to-r from-[#00A0E3] via-[#ffd700] to-[#8B1A1A] opacity-70" />
            </div>

            {/* CARTE VIVANTE DES 3 SECTEURS */}
            <div className="bg-white border border-[#b8860b]/20 rounded-2xl p-6 mb-8">
              <svg viewBox="0 0 340 220" className="w-full max-w-md mx-auto">
                <defs>
                  <radialGradient id="gemRuby" cx="35%" cy="30%" r="75%">
                    <stop offset="0%" stopColor="#e8626a" />
                    <stop offset="55%" stopColor="#a83232" />
                    <stop offset="100%" stopColor="#6e1a1a" />
                  </radialGradient>
                  <radialGradient id="gemSapphire" cx="35%" cy="30%" r="75%">
                    <stop offset="0%" stopColor="#7fd4f7" />
                    <stop offset="55%" stopColor="#1a8fd1" />
                    <stop offset="100%" stopColor="#0a5f96" />
                  </radialGradient>
                  <radialGradient id="gemSilver" cx="35%" cy="30%" r="75%">
                    <stop offset="0%" stopColor="#f1f4f7" />
                    <stop offset="55%" stopColor="#aab4c0" />
                    <stop offset="100%" stopColor="#727d8a" />
                  </radialGradient>
                  <radialGradient id="gemGold" cx="35%" cy="30%" r="75%">
                    <stop offset="0%" stopColor="#fff3c4" />
                    <stop offset="45%" stopColor="#f0c34a" />
                    <stop offset="100%" stopColor="#a8790f" />
                  </radialGradient>
                  <filter id="goldGlow" x="-80%" y="-80%" width="260%" height="260%">
                    <feGaussianBlur stdDeviation="9" result="blur" />
                    <feMerge>
                      <feMergeNode in="blur" />
                      <feMergeNode in="SourceGraphic" />
                    </feMerge>
                  </filter>
                </defs>

                {overviewSectorHealth.map((s, i) => {
                  const gem = SECTOR_GEMS[s.name] || SECTOR_GEMS['Imiter 1'];
                  const positions = [
                    { cx: 80, cy: 70, rx: 66, ry: 52, labelY: 66, valY: 84 },
                    { cx: 80, cy: 160, rx: 66, ry: 52, labelY: 156, valY: 174 },
                    { cx: 235, cy: 115, rx: 95, ry: 90, labelY: 45, valY: null },
                  ][i];
                  return (
                    <g key={s.name} onClick={() => setExpandedSector(expandedSector === s.name ? null : s.name)} className="cursor-pointer">
                      <ellipse cx={positions.cx} cy={positions.cy} rx={positions.rx} ry={positions.ry}
                        fill={gem.gradient} stroke={gem.stroke} strokeWidth="1" />
                      <text x={positions.cx} y={positions.labelY} textAnchor="middle"
                        style={{ fontSize: '13px', fontWeight: 500, fill: gem.text }}>
                        {s.name}
                      </text>
                      {positions.valY && (
                        <text x={positions.cx} y={positions.valY} textAnchor="middle"
                          style={{ fontSize: '11px', fill: gem.text }}>
                          {s.pct.toFixed(0)}%
                        </text>
                      )}
                    </g>
                  );
                })}

                {(() => {
                  const bure = overviewSectorHealth.find(s => s.name === 'Imiter Est');
                  if (!bure) return null;
                  return (
                    <g onClick={() => setExpandedSector(expandedSector === 'Imiter Est' ? null : 'Imiter Est')} className="cursor-pointer">
                      <g filter="url(#goldGlow)">
                        <circle cx="245" cy="140" r="42" fill="url(#gemGold)" stroke="#7a5809" strokeWidth="1" />
                      </g>
                      <text x="245" y="136" textAnchor="middle" style={{ fontSize: '11px', fontWeight: 500, fill: '#4a3406' }}>Bure</text>
                      <text x="245" y="150" textAnchor="middle" style={{ fontSize: '9px', fill: '#4a3406' }}>{bure.pct.toFixed(0)}%</text>
                    </g>
                  );
                })()}
              </svg>

              {expandedSector && (() => {
                const sector = overviewSectorHealth.find(s => s.name === expandedSector);
                if (!sector) return null;
                return (
                  <div className="mt-4 pt-4 border-t border-slate-100 animate-in fade-in slide-in-from-top-1 duration-300">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[12px] font-black text-slate-800">{sector.name}</span>
                      <span className="text-[11px] font-bold text-[#b8860b]">{sector.contribution.toFixed(0)}% de la production totale</span>
                    </div>
                    {sector.chantierBreakdown.length === 0 ? (
                      <p className="text-[11px] text-slate-400">Aucune donnée de chantier pour aujourd'hui.</p>
                    ) : (
                      <div className="space-y-1.5">
                        {sector.chantierBreakdown.map((c: any) => (
                          <div key={c.chantier} className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-600">{c.chantier}</span>
                            <span className="font-bold text-slate-800">{c.meterage.toFixed(1)} m</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>

            {/* GRILLE DES 4 KPI CARDS */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              {[
                {
                  label: 'Métrage du jour',
                  value: `${overviewBilan.totalReel.toFixed(1)}`,
                  unit: `/ ${overviewBilan.totalPlan.toFixed(1)} m`,
                  pct: overviewBilan.totalPlan > 0 ? (overviewBilan.totalReel / overviewBilan.totalPlan) * 100 : null,
                  icon: '⛏️',
                  targetTab: 'journal' as DTTab
                },
                {
                  label: 'Wagons du jour',
                  value: `${overviewBilan.totalWagonsReel}`,
                  unit: `/ ${overviewBilan.totalWagonsPlan} u`,
                  pct: overviewBilan.totalWagonsPlan > 0 ? (overviewBilan.totalWagonsReel / overviewBilan.totalWagonsPlan) * 100 : null,
                  icon: 'wagon',
                  targetTab: 'journal' as DTTab
                },
                {
                  label: `Fiabilité — ${selectedMois}`,
                  value: currentAttachement ? `${(100 - Math.abs(globalEcartPct)).toFixed(0)}%` : '—',
                  unit: currentAttachement ? globalFiab.label : 'Non saisi',
                  pct: currentAttachement ? (100 - Math.abs(globalEcartPct)) : null,
                  icon: '📐',
                  targetTab: 'attachements' as DTTab
                },
                {
                  label: 'ANFO — Réel / Théorique',
                  value: `${overviewExplosifs.monthlyAnfo.toFixed(0)}`,
                  unit: `/ ${overviewExplosifs.monthlyTheorAnfo.toFixed(0)} kg`,
                  pct: overviewExplosifs.monthlyTheorAnfo > 0 ? (overviewExplosifs.monthlyAnfo / overviewExplosifs.monthlyTheorAnfo) * 100 : null,
                  icon: '💥',
                  targetTab: 'explosifs' as DTTab
                },
              ].map((kpi, i) => (
                <button
                  key={kpi.label}
                  onClick={() => setActiveTab(kpi.targetTab)}
                  style={{ animationDelay: `${150 + i * 60}ms` }}
                  className="text-left w-full cursor-pointer select-none animate-in fade-in slide-in-from-bottom-2 duration-500 fill-mode-both
                    bg-white border border-[#b8860b]/20 rounded-2xl p-5
                    shadow-[0_2px_8px_rgba(184,134,11,0.03),0_1px_2px_rgba(0,0,0,0.02)]
                    hover:shadow-[0_4px_24px_rgba(184,134,11,0.12),0_2px_6px_rgba(184,134,11,0.06)]
                    hover:border-[#ffd700] hover:-translate-y-0.5 transition-all duration-300 ease-out"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-50 border border-slate-100">
                      {renderKPIIcon(kpi.icon)}
                    </div>
                    {kpi.pct !== null && (
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full font-mono ${
                        kpi.pct >= 90 ? 'bg-emerald-50 text-emerald-700' :
                        kpi.pct >= 70 ? 'bg-amber-50 text-amber-700' :
                        'bg-rose-50 text-rose-700'
                      }`}>
                        {kpi.pct.toFixed(0)}%
                      </span>
                    )}
                  </div>
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">
                    {kpi.label}
                  </p>
                  <p className="text-2xl font-black text-slate-900 tracking-tight">
                    {kpi.value}
                    <span className="text-[11px] font-bold text-slate-400 ml-1.5">{kpi.unit}</span>
                  </p>
                  
                  {/* Micro gold-accent progress bar */}
                  {kpi.pct !== null && (
                    <div className="w-full h-1 bg-slate-100 rounded-full mt-3 overflow-hidden relative">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, kpi.pct)}%` }}
                        transition={{ duration: 1.2, ease: "easeOut", delay: 0.2 }}
                        className={`h-full rounded-full bg-gradient-to-r ${
                          kpi.pct >= 90 ? 'from-[#b8860b] to-[#ffd700]' :
                          kpi.pct >= 70 ? 'from-amber-500 to-amber-300' :
                          'from-rose-500 to-rose-400'
                        }`}
                      />
                    </div>
                  )}
                </button>
              ))}
            </div>

            {/* FOCUS BURE IMITER EST */}
            <div className="bg-[#f4f5f7] border border-[#dcdfe4] rounded-2xl p-6 mb-8">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-black uppercase tracking-wide text-slate-800">Focus Bure Imiter Est</span>
                  <span className="text-[10px] text-slate-400 font-semibold">(2 engins — ST2G 1 / ST2G 3)</span>
                </div>
                <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
                  {(['jour', 'semaine', 'mois'] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => setBureFocusPeriod(p)}
                      className={`text-[10px] font-bold px-3 py-1.5 rounded-md transition-colors ${
                        bureFocusPeriod === p ? 'bg-[#141c2b] text-[#ffd700]' : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      {p === 'jour' ? 'Dernier jour' : p === 'semaine' ? 'Semaine' : 'Mois en cours'}
                    </button>
                  ))}
                </div>
              </div>

              <p className="text-[11px] text-slate-400 mb-4">
                Métrage arraché secteur — <span className="font-bold text-slate-700">{bureFocusData.meterage.toFixed(1)} m</span>
              </p>

              <table className="w-full text-[12px] mb-4">
                <thead>
                  <tr>
                    <td className="pb-2 text-[9px] uppercase tracking-wide text-slate-400 border-b border-[#b8860b]/20">Engin</td>
                    <td className="pb-2 text-[9px] uppercase tracking-wide text-slate-400 border-b border-[#b8860b]/20 text-right">Godets déblayés</td>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(bureFocusData.engineGodets).map(([eng, godets]) => (
                    <tr key={eng}>
                      <td className="py-1.5 text-slate-700">{eng}</td>
                      <td className="py-1.5 text-right text-slate-700 font-semibold">{godets}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="flex items-center justify-between bg-slate-50 rounded-xl px-4 py-3 mb-6">
                <span className="text-[11px] font-bold uppercase tracking-wide text-slate-500">Extraction (équipe dédiée)</span>
                <span className="text-[13px] font-black text-slate-800">
                  {bureFocusData.wagonsActual} <span className="text-slate-400 font-normal">/ {bureFocusData.wagonsTarget || 48} wagons</span>
                </span>
              </div>

              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mb-2">
                Déblayage journalier — ST2G 1 / ST2G 3 (30 derniers jours)
              </p>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={bureEngineDailyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1eee5" />
                  <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 9 }} unit=" g" />
                  <Tooltip />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                  <Line type="monotone" dataKey="ST2G 1" stroke="#00A0E3" strokeWidth={2} dot={false} />
                  <Line type="monotone" dataKey="ST2G 3" stroke="#b8860b" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>

              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mb-2 mt-6">
                Volume déblayé (m³) — 30 derniers jours
              </p>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={deblayageVolumeData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1eee5" />
                  <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 9 }} unit=" m³" />
                  <Tooltip formatter={(v: number) => [`${v} m³`, 'Volume']} />
                  <Line type="monotone" dataKey="volume" stroke="#8B1A1A" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>

              <p className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mb-2 mt-6">
                Extraction journalière — wagons (30 derniers jours)
              </p>
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={extractionDailyTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1eee5" />
                  <XAxis dataKey="date" tick={{ fontSize: 9 }} />
                  <YAxis tick={{ fontSize: 9 }} unit=" wagons" />
                  <Tooltip />
                  <Line type="monotone" dataKey="wagons" stroke="#141c2b" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* COMPARATIF MENSUEL */}
            <div className="bg-[#fdfaf2] border border-[#e8dfc0] rounded-2xl p-6 mb-8">
              <Suspense fallback={<div className="text-[11px] text-slate-400 text-center py-8">Chargement du comparatif...</div>}>
                <HistoryTrends
                  allProductionDocs={allProductionDocs}
                  allPlanningSheets={allPlanningSheets}
                />
              </Suspense>
            </div>

            {/* COGNITIVE LAYER — PATTERNS VOLÉES RATÉES */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              <div className="lg:col-span-2 bg-[#eef7fc] border border-[#c9e4f2] rounded-2xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-400">
                    Patterns volées ratées — {selectedMois}
                  </p>
                  <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
                    {(['mineurs', 'chefs', 'aides'] as const).map(r => (
                      <button
                        key={r}
                        onClick={() => { setPatternRole(r); setExpandedPerson(null); }}
                        className={`text-[10px] font-bold px-3 py-1.5 rounded-md transition-colors ${
                          patternRole === r ? 'bg-[#141c2b] text-[#ffd700]' : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        {r === 'mineurs' ? 'Mineurs' : r === 'chefs' ? 'Chefs de poste' : 'Aide-mineurs'}
                      </button>
                    ))}
                  </div>
                </div>

                {voleeRateePatterns[patternRole].length === 0 ? (
                  <p className="text-[11px] text-slate-400">Aucune volée ratée ce mois pour cette catégorie.</p>
                ) : (
                  <div className="space-y-1.5">
                    {voleeRateePatterns[patternRole].map((p: any) => (
                      <div key={p.name} className="border border-slate-100 rounded-xl overflow-hidden">
                        <button
                          onClick={() => setExpandedPerson(expandedPerson === p.name ? null : p.name)}
                          className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-slate-50 transition-colors"
                        >
                          <span className="text-[12px] font-bold text-slate-700">{p.name}</span>
                          <span className={`text-[11px] font-black ${p.count >= 3 ? 'text-[#8B1A1A]' : 'text-slate-500'}`}>
                            {p.count} volée{p.count > 1 ? 's' : ''} ratée{p.count > 1 ? 's' : ''} ce mois
                          </span>
                        </button>
                        {expandedPerson === p.name && (
                          <div className="bg-slate-50 px-3 py-2 space-y-1 border-t border-slate-100">
                            {p.details.map((d: any, i: number) => (
                              <div key={i} className="text-[10px] text-slate-500 flex justify-between">
                                <span>{d.date.slice(5).split('-').reverse().join('/')} · {d.chantier} · {d.poste}</span>
                                <span className="text-slate-400">Chef : {d.chef}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="bg-[#eef7fc] border border-[#c9e4f2] rounded-2xl p-5">
                <p className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-400 mb-3">
                  Causes des volées ratées — {selectedMois}
                </p>
                {globalCausesData.length === 0 ? (
                  <p className="text-[11px] text-slate-400">Aucune volée ratée expliquée ce mois.</p>
                ) : (
                  <div className="space-y-2.5">
                    {globalCausesData.map((c: any) => (
                      <div key={c.name} className="flex items-center justify-between text-[12px]">
                        <span className="font-bold text-slate-700 truncate pr-2">{c.name}</span>
                        <span className="text-slate-500 whitespace-nowrap">{c.value} fois · {c.lastDate?.slice(5).split('-').reverse().join('/')}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* AUDIT D'ENGAGEMENT — BASÉ SUR LES ACTIONS RÉELLES */}
            <div className="bg-[#eef7fc] border border-[#c9e4f2] rounded-2xl p-6 mb-8">
              <p className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-400 mb-1">
                Engagement réel — {selectedMois}
              </p>
              <p className="text-[10px] text-slate-400 mb-4">
                Basé sur les actions enregistrées (sauvegarde, validation, suppression de planning). Pas de temps de connexion simulé.
              </p>
              {userEngagement.length === 0 ? (
                <p className="text-[11px] text-slate-400">Aucune action enregistrée ce mois.</p>
              ) : (
                <div className="space-y-2">
                  {userEngagement.map((u: any) => (
                    <div key={u.user} className="flex items-center justify-between border border-slate-100 rounded-xl px-4 py-2.5">
                      <div>
                        <p className="text-[12px] font-bold text-slate-700">{u.user}</p>
                        <p className="text-[9px] text-slate-400">
                          Dernière action : {u.lastAction} · {new Date(u.lastTimestamp).toLocaleDateString('fr-FR')} à {new Date(u.lastTimestamp).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <span className={`text-[13px] font-black ${u.count >= 10 ? 'text-[#00A0E3]' : u.count >= 3 ? 'text-[#b8860b]' : 'text-slate-400'}`}>
                        {u.count} action{u.count > 1 ? 's' : ''}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* EXPLOSIFS — COMPARAISON SECTEURS */}
            <div className="bg-[#fdfaf2] border border-[#e8dfc0] rounded-2xl p-6 mb-8">
              <Suspense fallback={<div className="text-[11px] text-slate-400 text-center py-8">Chargement...</div>}>
                <SectorsCompare
                  allProductionDocs={allProductionDocs}
                  allPlanningSheets={allPlanningSheets}
                  chantiers={allChantiers}
                  employees={employees}
                  reportType="day"
                  filterDate={journalDate}
                  filterMonth={selectedMois}
                />
              </Suspense>
            </div>

            {/* RH — CLASSEMENTS */}
            <div className="bg-[#eef7fc] border border-[#c9e4f2] rounded-2xl p-6 mb-8">
              <Suspense fallback={<div className="text-[11px] text-slate-400 text-center py-8">Chargement...</div>}>
                <GlobalRankings
                  allProductionDocs={allProductionDocs}
                  allPlanningSheets={allPlanningSheets}
                  chantiers={allChantiers}
                  employees={employees}
                  engines={engines}
                  reportType="day"
                  filterDate={journalDate}
                  filterMonth={selectedMois}
                />
              </Suspense>

              <div className="mt-6 pt-6 border-t border-slate-100">
                <p className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-400 mb-3">Top 5 — Aide Mineur</p>
                {aideMineurRanking.length === 0 ? (
                  <p className="text-[11px] text-slate-400">Aucune donnée pour le moment.</p>
                ) : (
                  <div className="space-y-2">
                    {aideMineurRanking.map((a: any, i: number) => (
                      <div key={a.matricule} className="flex items-center justify-between bg-slate-50 rounded-lg px-3 py-2">
                        <span className="text-[12px] font-bold text-slate-700">#{i + 1} {a.name}</span>
                        <span className="text-[11px] text-slate-500">{a.totalMetersAssisted.toFixed(1)} m · {a.roundsAssisted} volées</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* CENTRE D'ALERTES SMART */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-6 mb-8">
              <Suspense fallback={<div className="text-[11px] text-slate-400 text-center py-8">Chargement...</div>}>
                <SmartAlertsCenter
                  allProductionDocs={allProductionDocs}
                  allPlanningSheets={allPlanningSheets}
                  chantiers={allChantiers}
                  employees={employees}
                  engines={engines}
                />
              </Suspense>
            </div>

            {/* TWO-COLUMN GRID FOR PREMIUM INFORMATION & DIRECTEUR ENGAGEMENT */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              
              {/* LEFT COLUMN: Alerts, AI Analysis, Quick Access */}
              <div className="lg:col-span-7 space-y-6">
                {/* ALERTES */}
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-300 fill-mode-both">
                  <p className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-400 mb-3">
                    Ce qui mérite votre attention {overviewAlerts.length > 0 && `(${overviewAlerts.length})`}
                  </p>
                  {overviewAlerts.length === 0 ? (
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-6 text-center
                      shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                      <p className="text-emerald-600 font-black text-[12px] uppercase tracking-wider">
                        ✓ Aucune alerte — tout est nominal
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {overviewAlerts.map((a, i) => (
                        <button
                          key={i}
                          onClick={() => setActiveTab(a.source)}
                          className={`w-full text-left bg-white border rounded-xl px-4 py-3 flex items-center
                            justify-between group transition-all duration-200
                            shadow-[0_1px_2px_rgba(0,0,0,0.03)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)]
                            ${a.type === 'critique' ? 'border-rose-200 hover:border-rose-300' : 'border-amber-200 hover:border-amber-300'}`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`w-1.5 h-1.5 rounded-full ${
                              a.type === 'critique' ? 'bg-rose-500' : 'bg-amber-500'
                            }`} />
                            <span className="text-[11px] font-semibold text-slate-700">{a.text}</span>
                          </div>
                          <span className="text-slate-300 group-hover:text-slate-500 transition-colors text-xs">→</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* ANALYSE IA */}
                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 delay-[360ms] fill-mode-both">
                  <p className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-400 mb-3">
                    Assistant DT
                  </p>
                  <button
                    onClick={() => setActiveTab('ia')}
                    className="w-full text-left bg-gradient-to-br from-white to-slate-50/50 border border-slate-200/80
                      rounded-2xl p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_16px_rgba(0,0,0,0.06)]
                      hover:border-[#ffd700]/40 transition-all duration-300 group"
                  >
                    {overviewLastAnalysis ? (
                      <>
                        <p className="text-[13px] font-bold text-slate-800 mb-1">
                          "{overviewLastAnalysis.question}"
                        </p>
                        <p className="text-[9px] font-semibold text-slate-400 uppercase tracking-wider">
                          {overviewLastAnalysis.date}
                        </p>
                      </>
                    ) : (
                      <p className="text-[11px] font-semibold text-slate-400">
                        Aucune analyse effectuée récemment — Posez une question à l'assistant DT
                      </p>
                    )}
                  </button>
                </div>

                {/* BOUTONS ACCES RAPIDE */}
                <div className="flex flex-wrap gap-2 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-[420ms] fill-mode-both">
                  {[
                    { id: 'journal' as DTTab, label: 'Journal de la Mine' },
                    { id: 'attachements' as DTTab, label: 'Attachements & Fiabilité' },
                    { id: 'rapport' as DTTab, label: 'Rapport Mensuel' },
                  ].map(link => (
                    <button
                      key={link.id}
                      onClick={() => setActiveTab(link.id)}
                      className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px]
                        font-black uppercase tracking-wider text-slate-600 hover:text-slate-900
                        hover:border-slate-300 hover:bg-slate-50 transition-all duration-200 shadow-sm"
                    >
                      {link.label} →
                    </button>
                  ))}
                </div>
              </div>

              {/* RIGHT COLUMN: Director's Carnet and Mine Operational Status / Météo */}
              <div className="lg:col-span-5 space-y-6">
                
                {/* SITE STATUS WIDGET */}
                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_8px_24px_rgba(0,0,0,0.04)] hover:shadow-[0_2px_4px_rgba(0,0,0,0.06)] transition-all duration-300 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-[360ms]">
                  <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">⏱️</span>
                      <h3 className="text-[11px] font-black uppercase tracking-wider text-slate-500">
                        Poste Actif & Climat Site
                      </h3>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[8px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      Temps Réel
                    </span>
                  </div>

                  <div className="mb-4">
                    <div className="flex justify-between items-end mb-1.5">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Équipe en rotation</p>
                        <h4 className="text-[13px] font-black text-slate-800 uppercase tracking-wide">{currentShiftInfo.name}</h4>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Horaires du poste</p>
                        <span className="text-[11px] font-black text-[#b8860b] uppercase tracking-wide">{currentShiftInfo.hours}</span>
                      </div>
                    </div>

                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden relative">
                      <div 
                        className="h-full bg-gradient-to-r from-[#b8860b] to-[#ffd700] rounded-full transition-all duration-1000"
                        style={{ width: `${currentShiftInfo.progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between items-center mt-1 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                      <span>{currentShiftInfo.hours}</span>
                      <span>Progression : {currentShiftInfo.progress}%</span>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
                      {chefsForCurrentPost.map(c => (
                        <div key={c.sector} className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-500 font-semibold">{c.sector}</span>
                          <span className={`font-bold ${c.chefName === 'Aucun' ? 'text-slate-300 italic' : 'text-slate-700'}`}>
                            {c.chefName}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

              </div>

            </div>

          </div>
        )}

        {activeTab === 'journal' && (
          <div className="space-y-6">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="date"
                  value={journalDate}
                  onChange={(e) => setJournalDate(e.target.value)}
                  className="bg-white border border-slate-200 text-[#b8860b] text-[11px] font-black rounded-xl px-4 py-2.5 outline-none shadow-sm"
                />
                <div className="flex gap-1.5">
                  <button
                    onClick={() => changeJournalDate(-1)}
                    className="px-3 py-2 bg-white text-slate-700 text-[10px] font-black uppercase rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm"
                  >
                    ← Hier
                  </button>
                  <button
                    onClick={() => setJournalDate(new Date().toISOString().split('T')[0])}
                    className="px-3 py-2 bg-white text-slate-700 text-[10px] font-black uppercase rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm"
                  >
                    Aujourd'hui
                  </button>
                  <button
                    onClick={() => changeJournalDate(1)}
                    className="px-3 py-2 bg-white text-slate-700 text-[10px] font-black uppercase rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm"
                  >
                    Demain →
                  </button>
                </div>
              </div>

              {/* Ruban de performance journalier en haut pour M. ELYAAKOUBY HAMID */}
              <div className="flex flex-wrap gap-2.5">
                <div className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 flex items-center gap-2 shadow-sm">
                  <span className="text-sm">⛏️</span>
                  <div>
                    <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Forage Global</p>
                    <p className="text-[10px] text-slate-800 font-extrabold">
                      {bilan.totalReel.toFixed(1)} / {bilan.totalPlan.toFixed(1)} m
                    </p>
                  </div>
                  {bilan.totalPlan > 0 && (
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-black border ${
                      (bilan.totalReel / bilan.totalPlan) >= 0.9
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : (bilan.totalReel / bilan.totalPlan) >= 0.7
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      {((bilan.totalReel / bilan.totalPlan) * 100).toFixed(0)}%
                    </span>
                  )}
                </div>

                <div className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 flex items-center gap-2 shadow-sm">
                  <div className="w-5 h-5 flex items-center justify-center shrink-0">
                    <svg viewBox="0 0 100 100" className="w-5 h-5 drop-shadow-[0_0.5px_2px_rgba(184,134,11,0.2)]" fill="none">
                      {/* Rails */}
                      <path d="M 10 82 L 90 82" stroke="#94a3b8" strokeWidth="5" strokeLinecap="round" />
                      
                      {/* Wagon Body */}
                      <path 
                        d="M 15 32 L 85 32 L 75 68 L 25 68 Z" 
                        fill="#334155" 
                        stroke="#b8860b" 
                        strokeWidth="5" 
                        strokeLinejoin="round" 
                      />
                      
                      {/* Mineral loads */}
                      <path d="M 22 32 C 25 15, 38 18, 45 32" fill="#cbd5e1" stroke="#cbd5e1" strokeWidth="2" />
                      <path d="M 40 32 C 48 10, 62 14, 68 32" fill="#94a3b8" stroke="#94a3b8" strokeWidth="2" />
                      <path d="M 60 32 C 65 18, 78 22, 78 32" fill="#cbd5e1" stroke="#cbd5e1" strokeWidth="2" />
                      
                      {/* Wheels */}
                      <circle cx="35" cy="76" r="9" fill="#1e293b" stroke="#ffd700" strokeWidth="3" />
                      <circle cx="65" cy="76" r="9" fill="#1e293b" stroke="#ffd700" strokeWidth="3" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Wagons Extraits</p>
                    <p className="text-[10px] text-slate-800 font-extrabold">
                      {bilan.totalWagonsReel} / {bilan.totalWagonsPlan} u
                    </p>
                  </div>
                  {bilan.totalWagonsPlan > 0 && (
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-black border ${
                      (bilan.totalWagonsReel / bilan.totalWagonsPlan) >= 0.9
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : (bilan.totalWagonsReel / bilan.totalWagonsPlan) >= 0.7
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      {((bilan.totalWagonsReel / bilan.totalWagonsPlan) * 100).toFixed(0)}%
                    </span>
                  )}
                </div>

                <div className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 flex items-center gap-2 shadow-sm">
                  <span className="text-sm">💥</span>
                  <div>
                    <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">ANFO Consommé</p>
                    <p className="text-[10px] text-rose-600 font-extrabold">{bilan.totalAnfo.toFixed(0)} kg</p>
                  </div>
                </div>

                <div className={`border rounded-xl px-3 py-1.5 flex items-center gap-2 shadow-sm ${
                  bilan.totalNonRealises > 0
                    ? 'bg-amber-50/50 border-amber-200 text-amber-800'
                    : 'bg-emerald-50/50 border-emerald-200 text-emerald-800'
                }`}>
                  <span className="text-sm">{bilan.totalNonRealises > 0 ? '⚠️' : '✅'}</span>
                  <div>
                    <p className="text-[8px] font-bold uppercase tracking-wider">Incidents</p>
                    <p className="text-[10px] font-extrabold">{bilan.totalNonRealises} tirs avortés</p>
                  </div>
                </div>
              </div>
            </div>

            {loadingJournal ? (
              <div className="flex items-center justify-center h-64 text-[#b8860b] font-black text-[11px] uppercase tracking-widest animate-pulse">
                Chargement du journal...
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                  {[
                    { n: 1, label: 'POSTE 1', hours: '07h-15h' },
                    { n: 2, label: 'POSTE 2', hours: '15h-23h' },
                    { n: 3, label: 'POSTE 3', hours: '23h-07h' }
                  ].map(({ n, label, hours }) => {
                    const posteData = journalProduction?.postes?.[`poste${n}`];
                    const planData = journalPlanning?.postes?.[`poste${n}`];
                    const isSealed = !!(posteData?.locked || posteData?.sealed || posteData?.status === 'locked' || posteData?.status === 'sealed');
                    const exists = !!posteData;

                    let borderClass = 'border-slate-200';
                    let statusLabel = 'NON SAISI';
                    let statusClass = 'bg-slate-100 text-slate-500 border-slate-200';

                    if (isSealed) {
                      borderClass = 'border-emerald-500';
                      statusLabel = 'SCELLÉ';
                      statusClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                    } else if (exists) {
                      borderClass = 'border-amber-500';
                      statusLabel = 'EN COURS';
                      statusClass = 'bg-amber-50 text-amber-700 border-amber-200';
                    }

                    const shiftAnfo = posteData?.minage?.reduce((s: number, r: any) => s + Number(r.reel?.anfo || r.anfo || 0), 0) || 0;
                    const shiftTovex = posteData?.minage?.reduce((s: number, r: any) => s + Number(r.reel?.tovex || r.tovex || 0), 0) || 0;
                    const shiftAmorces = posteData?.minage?.reduce((s: number, r: any) => s + Number(r.reel?.ammorces || r.reel?.amorces || r.ammorces || r.amorces || 0), 0) || 0;

                    const shiftExplications = journalExplications.filter(e => String(e.poste || e.shift) === String(n));

                    return (
                      <div key={n} className={`bg-white border-2 ${borderClass} rounded-2xl p-5 flex flex-col justify-between shadow-md`}>
                        <div>
                          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                            <div>
                              <h3 className="text-[#b8860b] font-black text-sm tracking-wider uppercase">{label}</h3>
                              <p className="text-slate-400 text-[10px] font-bold mt-0.5">{hours}</p>
                            </div>
                            <span className={`px-2 py-0.5 border text-[9px] font-black rounded uppercase ${statusClass}`}>
                              {statusLabel}
                            </span>
                          </div>

                          <div className="space-y-3">
                            <h4 className="text-slate-400 text-[9px] font-black uppercase tracking-wider mb-2">Avancement Minage</h4>
                            {['Imiter 1', 'Imiter 2', 'Imiter Est'].map(secteur => {
                              const minageRows = posteData?.minage?.filter((r: any) => {
                                const sGroup = r.reel?.sectorGroup || r.sectorGroup || r.reel?.sector || r.sector || r.reel?.secteur || r.secteur || '';
                                return sGroup.toLowerCase() === secteur.toLowerCase();
                              }) || [];

                              const planRows = planData?.minage?.filter((r: any) => {
                                const sGroup = r.sectorGroup || r.sector || r.secteur || '';
                                return sGroup.toLowerCase() === secteur.toLowerCase();
                              }) || [];

                              const totalReel = minageRows.reduce((s: number, r: any) => {
                                const rowData = r.reel || r;
                                return s + (Number(rowData.realMeterage || rowData.meterage || 0));
                              }, 0);

                              const totalPlan = planRows.reduce((s: number, r: any) => s + (Number(r.meterage || r.plannedMeterage || 0)), 0);

                              const rate = totalPlan > 0 ? (totalReel / totalPlan * 100) : null;

                              let badgeColor = 'text-slate-500 bg-slate-50 border-slate-200';
                              if (rate !== null) {
                                if (rate >= 90) badgeColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
                                else if (rate >= 70) badgeColor = 'text-amber-700 bg-amber-50 border-amber-200';
                                else badgeColor = 'text-rose-700 bg-rose-50 border-rose-200';
                              }

                              return (
                                <div key={secteur} className="flex items-center justify-between py-1 border-b border-slate-100 last:border-0 last:pb-0">
                                  <div className="text-slate-700 text-[10px] font-bold uppercase">{secteur}</div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-slate-400 text-[9px]">
                                      Pl: <span className="text-slate-500">{totalPlan.toFixed(1)}m</span>
                                    </span>
                                    <span className="text-slate-400 text-[9px]">
                                      R: <span className="text-[#00BFFF] font-black">{totalReel.toFixed(1)}m</span>
                                    </span>
                                    <span className={`px-1 rounded text-[8.5px] font-black border ${badgeColor}`}>
                                      {rate !== null ? `${rate.toFixed(0)}%` : '-'}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          <div className="mt-5 space-y-2 border-t border-slate-100 pt-3">
                            <h4 className="text-slate-400 text-[9px] font-black uppercase tracking-wider">Explosifs Consommés</h4>
                            <div className="grid grid-cols-3 gap-2 text-center">
                              <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-200/60">
                                <span className="text-rose-600 text-[10px] font-black">{shiftAnfo.toFixed(0)} kg</span>
                                <p className="text-slate-400 text-[8px] uppercase font-bold tracking-wider mt-0.5">ANFO</p>
                              </div>
                              <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-200/60">
                                <span className="text-orange-600 text-[10px] font-black">{shiftTovex.toFixed(1)} kg</span>
                                <p className="text-slate-400 text-[8px] uppercase font-bold tracking-wider mt-0.5">TOVEX</p>
                              </div>
                              <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-200/60">
                                <span className="text-amber-600 text-[10px] font-black">{shiftAmorces} u</span>
                                <p className="text-slate-400 text-[8px] uppercase font-bold tracking-wider mt-0.5">AMORCES</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {shiftExplications.length > 0 ? (
                          <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-3">
                            <div className="text-rose-600 text-[8.5px] font-black uppercase tracking-wider flex items-center gap-1">
                              <span>⚠️</span> Justifications ({shiftExplications.length})
                            </div>
                            <div className="max-h-[140px] overflow-y-auto space-y-1.5 pr-1">
                              {shiftExplications.map((exp, idx) => (
                                <div key={idx} className="bg-rose-50 border border-rose-200 rounded-lg p-2 text-[9px]">
                                  <div className="flex justify-between font-bold text-slate-700">
                                    <span className="text-rose-700 font-extrabold uppercase">{exp.chantierName || exp.chantierId || 'Chantier'}</span>
                                    <span className="text-slate-400 text-[8px]">Par {exp.author || exp.saisiPar || 'Auteur'}</span>
                                  </div>
                                  <p className="text-slate-600 mt-1 italic font-semibold">"{exp.explanation || exp.reason || exp.raison || 'Sans explication'}"</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="text-slate-400 text-[8.5px] uppercase font-bold tracking-wider mt-4 border-t border-slate-100 pt-3">
                            ✅ Aucun tir avorté signalé
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-md mt-6">
                  <h3 className="text-[#b8860b] text-xs font-black uppercase tracking-widest mb-4">
                    Bilan de la Journée
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-center">
                      <span className="text-slate-400 text-[9px] uppercase font-bold tracking-wider">Avancement Forage</span>
                      <div className="text-sky-600 text-lg font-black mt-1">
                        {bilan.totalReel.toFixed(1)} / {bilan.totalPlan.toFixed(1)} m
                      </div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">
                        {bilan.totalPlan > 0 ? `${((bilan.totalReel / bilan.totalPlan) * 100).toFixed(0)}% de réalisation` : '-'}
                      </p>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-center">
                      <span className="text-slate-400 text-[9px] uppercase font-bold tracking-wider">Wagons Extraits</span>
                      <div className="text-slate-800 text-lg font-black mt-1">
                        {bilan.totalWagonsReel} / {bilan.totalWagonsPlan} u
                      </div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">
                        {bilan.totalWagonsPlan > 0 ? `${((bilan.totalWagonsReel / bilan.totalWagonsPlan) * 100).toFixed(0)}% de réalisation` : '-'}
                      </p>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-center">
                      <span className="text-slate-400 text-[9px] uppercase font-bold tracking-wider">ANFO Consommé</span>
                      <div className="text-rose-600 text-lg font-black mt-1">
                        {bilan.totalAnfo.toFixed(0)} kg
                      </div>
                      <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mt-1">Cumulative de jour</p>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-center">
                      <span className="text-slate-400 text-[9px] uppercase font-bold tracking-wider">Tirs Avortés</span>
                      <div className={`text-lg font-black mt-1 ${bilan.totalNonRealises > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {bilan.totalNonRealises}
                      </div>
                      <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mt-1">Total excuses</p>
                    </div>

                    <div className="bg-amber-50/50 border border-amber-200 p-3.5 rounded-xl text-center col-span-2 md:col-span-1">
                      <span className="text-amber-700 text-[9px] uppercase font-black tracking-widest">Rapport Posté</span>
                      <div className="text-slate-800 text-[11px] font-black uppercase mt-1">
                        SMI Imiter
                      </div>
                      <p className="text-[9px] text-slate-500 uppercase font-bold mt-1">
                        {journalDate}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Rendement Comparatif des Postes (Performance Forage) */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm mt-6">
                  <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2">
                    <div>
                      <h3 className="text-slate-800 text-xs font-black uppercase tracking-widest flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full bg-[#00BFFF]" />
                        Rendement Comparatif des Postes (Forage Réalisé)
                      </h3>
                      <p className="text-slate-400 text-[8px] font-bold uppercase tracking-wider mt-0.5">
                        Performance par équipe de poste pour la journée du {journalDate}
                      </p>
                    </div>
                    <span className="text-slate-400 text-[8.5px] font-black uppercase tracking-widest bg-slate-100 px-2.5 py-0.5 rounded-full">
                      Données de quart
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[1, 2, 3].map(n => {
                      const shiftKey = `poste${n}`;
                      const posteData = journalProduction?.postes?.[shiftKey];
                      const planData = journalPlanning?.postes?.[shiftKey];
                      
                      const totalReel = posteData?.minage?.reduce((s: number, r: any) => {
                        const rowData = r.reel || r;
                        return s + (Number(rowData.realMeterage || rowData.meterage || 0));
                      }, 0) || 0;
                      
                      const totalPlan = planData?.minage?.reduce((s: number, r: any) => s + (Number(r.meterage || r.plannedMeterage || 0)), 0) || 0;
                      const rate = totalPlan > 0 ? (totalReel / totalPlan) * 100 : 0;
                      
                      const wagons = posteData?.minage?.reduce((s: number, r: any) => {
                        const rowData = r.reel || r;
                        return s + (Number(rowData.wagons || 0));
                      }, 0) || 0;

                      return (
                        <div key={n} className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-[10px] font-black text-slate-700 uppercase">POSTE {n}</span>
                              <span className={`px-2 py-0.5 rounded text-[8px] font-black ${
                                totalPlan > 0 
                                  ? rate >= 90 ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                    rate >= 70 ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                    'bg-rose-50 text-rose-700 border border-rose-200'
                                  : 'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}>
                                {totalPlan > 0 ? `${rate.toFixed(0)}% du plan` : 'Pas de plan'}
                              </span>
                            </div>
                            
                            <div className="space-y-2">
                              <div>
                                <div className="flex justify-between text-[9px] font-bold text-slate-500 mb-1">
                                  <span>Mètres Forés :</span>
                                  <span className="text-slate-800 font-extrabold">{totalReel.toFixed(1)} / {totalPlan.toFixed(1)} m</span>
                                </div>
                                <div className="w-full bg-slate-200/80 h-1.5 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full rounded-full transition-all duration-500 ${
                                      rate >= 90 ? 'bg-emerald-500' : rate >= 70 ? 'bg-amber-500' : 'bg-rose-500'
                                    }`}
                                    style={{ width: `${totalPlan > 0 ? Math.min(100, rate) : 0}%` }}
                                  />
                                </div>
                              </div>
                              
                              <div className="flex justify-between items-center text-[9px] font-bold text-slate-500 pt-1">
                                <span>Wagons d'argent :</span>
                                <span className="text-slate-800 font-extrabold">{wagons} u</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* 
                  ========================================================================
                  ANALYSES MENSUELLES & COCKPIT DE CONTRÔLE (Intégration Directe au Journal)
                  ========================================================================
                */}
                <div className="mt-8 border-t border-slate-200/80 pt-8">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-1.5 h-7 bg-gradient-to-b from-[#b8860b] to-[#ffd700] rounded-full shrink-0" />
                      <div>
                        <h2 className="text-[#b8860b] font-black text-sm tracking-wider uppercase">
                          Analyses & Cockpit Mensuel — {journalDate.substring(0, 7)}
                        </h2>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">
                          Suivi cumulatif et analyse de performance globale pour la Direction Technique
                        </p>
                      </div>
                    </div>
                    <span className="bg-amber-500/10 text-amber-700 text-[9px] font-black px-3 py-1 rounded-full border border-amber-500/20 uppercase tracking-wider self-start sm:self-center">
                      Données Consolidées
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {/* Month Cumulative Meters */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Cumul Avancement</span>
                          <span className="text-xl">📏</span>
                        </div>
                        <p className="text-2xl font-black text-slate-800">
                          {(() => {
                            const month = journalDate.substring(0, 7);
                            const stats = getMonthlyConsolidatedStats().find(s => s.month === month);
                            return stats ? stats.totalReel.toFixed(1) : '0.0';
                          })()} m
                        </p>
                        <p className="text-[10px] text-slate-500 font-medium mt-1">
                          Somme des avancements mesurés sur les chantiers SMI ce mois-ci.
                        </p>
                      </div>
                    </div>

                    {/* Month Cumulative Explosives */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Explosifs Consommés</span>
                          <span className="text-xl">💥</span>
                        </div>
                        <p className="text-2xl font-black text-slate-800">
                          {(() => {
                            const month = journalDate.substring(0, 7);
                            const stats = getMonthlyConsolidatedStats().find(s => s.month === month);
                            return stats ? stats.totalAnfo.toLocaleString('fr-FR') : '0';
                          })()} kg
                        </p>
                        <p className="text-[10px] text-slate-500 font-medium mt-1">
                          ANFO total consommé pour l'abattage de roche.
                        </p>
                      </div>
                    </div>

                    {/* Month Specific Charge Fact */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Facteur de Charge</span>
                          <span className="text-xl">⚡</span>
                        </div>
                        <p className="text-2xl font-black text-slate-800">
                          {(() => {
                            const month = journalDate.substring(0, 7);
                            const stats = getMonthlyConsolidatedStats().find(s => s.month === month);
                            if (stats && stats.totalReel > 0) {
                              return (stats.totalAnfo / stats.totalReel).toFixed(1);
                            }
                            return '0.0';
                          })()} kg/m
                        </p>
                        <p className="text-[10px] text-slate-500 font-medium mt-1">
                          Ratio d'explosif par mètre d'avancement foré.
                        </p>
                      </div>
                    </div>

                    {/* Month Extraction Volume */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <span className="text-xs font-black text-slate-400 uppercase tracking-wider">Wagons Extraits</span>
                          <span className="text-xl">🚛</span>
                        </div>
                        <p className="text-2xl font-black text-slate-800">
                          {(() => {
                            const month = journalDate.substring(0, 7);
                            const stats = getMonthlyConsolidatedStats().find(s => s.month === month);
                            return stats ? stats.totalWagonsReel.toLocaleString('fr-FR') : '0';
                          })()} u
                        </p>
                        <p className="text-[10px] text-slate-500 font-medium mt-1">
                          Nombre total de wagons acheminés au jour d'aujourd'hui.
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Analyse qualitative et Décision pour le DT */}
                  <div className="bg-[#f8fafc] border border-slate-200 rounded-2xl p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-lg">🎯</span>
                      <h4 className="text-slate-800 font-black text-[11px] uppercase tracking-wider">
                        Diagnostic de Performance Mensuelle — Direction Technique
                      </h4>
                    </div>
                    <div className="text-slate-600 text-xs leading-relaxed space-y-2">
                      <p>
                        Pour le mois de <strong>{journalDate.substring(0, 7)}</strong>, la mine d'argent d'Imiter affiche un cumul d'avancement de{' '}
                        <strong>
                          {(() => {
                            const month = journalDate.substring(0, 7);
                            const stats = getMonthlyConsolidatedStats().find(s => s.month === month);
                            return stats ? stats.totalReel.toFixed(1) : '0.0';
                          })()}{' '}
                          mètres
                        </strong>{' '}
                        sur l'ensemble des galeries actives de sections 9m² et 12m². 
                      </p>
                      <p>
                        Le facteur de charge moyen d'explosif se situe à{' '}
                        <span className="font-bold text-slate-800">
                          {(() => {
                            const month = journalDate.substring(0, 7);
                            const stats = getMonthlyConsolidatedStats().find(s => s.month === month);
                            if (stats && stats.totalReel > 0) {
                              const ratio = stats.totalAnfo / stats.totalReel;
                              return `${ratio.toFixed(1)} kg/m`;
                            }
                            return '0.0 kg/m';
                          })()}
                        </span>
                        .{' '}
                        {(() => {
                          const month = journalDate.substring(0, 7);
                          const stats = getMonthlyConsolidatedStats().find(s => s.month === month);
                          if (!stats || stats.totalReel === 0) return '';
                          const ratio = stats.totalAnfo / stats.totalReel;
                          if (ratio > 26) {
                            return "⚠️ Attention : Le ratio d'explosif est supérieur au standard cible (24 kg/m). Une inspection des plans de tir et du rendement des volées est fortement recommandée pour optimiser la consommation d'ANFO.";
                          } else if (ratio < 22) {
                            return "✅ Efficience optimale : Le facteur d'explosif est très bien maîtrisé ce mois-ci, témoignant d'une excellente exécution des forages et d'un bon calage des plans de tir.";
                          } else {
                            return "ℹ️ Stabilité opérationnelle : La consommation d'explosifs est parfaitement en ligne avec le standard de foration de la SMI.";
                          }
                        })()}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'attachements' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <input
                  type="month"
                  value={selectedMois}
                  onChange={(e) => setSelectedMois(e.target.value)}
                  className="bg-white border border-slate-200 text-[#b8860b] text-[11px] font-black rounded-xl px-4 py-2.5 outline-none shadow-sm"
                />
                <button
                  onClick={() => {
                    setSaisieMode(true);
                    setSaisieData(allChantiers.map(c => ({
                      chantierId: c.id,
                      chantierName: c.name,
                      secteur: c.sector || c.secteur || '',
                      galleryType: (c.galleryType === '9m2' || c.galleryType === '9') ? '9' : '12',
                      metrageGeometre: 0,
                    })));
                  }}
                  className="px-5 py-2.5 bg-[#ffd700] text-[#0f172a] text-[10px] font-black uppercase tracking-wider rounded-xl hover:bg-yellow-300 transition-colors shadow-sm"
                >
                  📐 Saisir Données Géomètres — {selectedMois}
                </button>
              </div>
            </div>

            {saisieMode && (
              <div className="fixed inset-0 z-50 bg-[#0a0f1a]/80 backdrop-blur-md overflow-y-auto p-6 flex items-center justify-center">
                <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl p-6 shadow-2xl">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
                    <div>
                      <h2 className="text-[#b8860b] font-black text-lg uppercase tracking-wider">
                        Saisie Attachements — {selectedMois}
                      </h2>
                      <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mt-0.5">
                        Données officielles des géomètres — MANAGEM SMI
                      </p>
                    </div>
                    <button
                      onClick={() => setSaisieMode(false)}
                      className="text-slate-400 hover:text-slate-600 font-black uppercase text-xs"
                    >
                      Fermer
                    </button>
                  </div>

                  <div className="space-y-1 max-h-[60vh] overflow-y-auto pr-2">
                    {saisieData.map((c, idx) => (
                      <div key={idx} className="grid grid-cols-[1fr_120px_80px_140px] gap-3 items-center py-3 border-b border-slate-100">
                        <div>
                          <div className="text-slate-800 text-[11px] font-black uppercase">
                            {c.chantierName}
                          </div>
                          <div className="text-slate-400 text-[9px] uppercase">
                            {c.secteur} — {c.galleryType}m²
                          </div>
                        </div>
                        <div className="text-slate-500 text-[10px] font-bold">
                          {c.galleryType === '9' ? 'Traçage 9m²' : 'Galerie 12m²'}
                        </div>
                        <div className="text-[#b8860b] text-[9px] font-black uppercase">
                          m foré
                        </div>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={c.metrageGeometre || ''}
                          onChange={(e) => setSaisieData(prev => prev.map(ch =>
                            ch.chantierId === c.chantierId
                              ? { ...ch, metrageGeometre: Number(e.target.value) || 0 }
                              : ch
                          ))}
                          placeholder="0.0"
                          className="bg-white border border-slate-200 text-slate-800 text-[11px] font-black rounded-lg px-3 py-2 outline-none focus:border-[#b8860b] text-right"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center border-t border-slate-100 pt-4 mt-4">
                    <div className="text-[#b8860b] text-xl font-black">
                      TOTAL GÉOMÈTRES : {saisieData.reduce((s, c) => s + c.metrageGeometre, 0).toFixed(1)} m
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setSaisieMode(false)}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-black uppercase tracking-wider rounded-xl transition-colors"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={saveAttachement}
                        disabled={savingAttachement}
                        className="px-4 py-2 bg-[#ffd700] text-[#0f172a] hover:bg-yellow-300 text-[10px] font-black uppercase tracking-wider rounded-xl transition-colors disabled:opacity-50"
                      >
                        {savingAttachement ? 'Enregistrement...' : 'Enregistrer les attachements'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {loadingAttachement ? (
              <div className="flex items-center justify-center h-64 text-slate-500 font-black text-[11px] uppercase tracking-widest">
                Chargement...
              </div>
            ) : !currentAttachement ? (
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
                <div className="text-slate-400 text-3xl mb-3">📐</div>
                <div className="text-[#b8860b] text-[12px] font-black uppercase tracking-widest mb-2">
                  Aucun attachement saisi pour ce mois ({selectedMois})
                </div>
                <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mb-6 max-w-md mx-auto">
                  Veuillez saisir les données mesurées par les géomètres pour activer le module de comparaison et de fiabilité.
                </p>
                <button
                  onClick={() => {
                    setSaisieMode(true);
                    setSaisieData(allChantiers.map(c => ({
                      chantierId: c.id,
                      chantierName: c.name,
                      secteur: c.sector || c.secteur || '',
                      galleryType: (c.galleryType === '9m2' || c.galleryType === '9') ? '9' : '12',
                      metrageGeometre: 0,
                    })));
                  }}
                  className="px-6 py-3 bg-[#ffd700] text-[#0f172a] text-[10px] font-black uppercase tracking-wider rounded-xl hover:bg-yellow-300 transition-colors shadow-sm"
                >
                  Saisir les données géomètres
                </button>
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                    <div className="text-slate-400 text-[9px] font-black uppercase tracking-wider">
                      Métrage Géomètre Total
                    </div>
                    <div className="text-[#b8860b] text-2xl font-black mt-1">
                      {currentAttachement.totalMetrageGeometre.toFixed(1)} m
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                    <div className="text-slate-400 text-[9px] font-black uppercase tracking-wider">
                      Métrage Plateforme Total
                    </div>
                    <div className="text-slate-800 text-2xl font-black mt-1">
                      {totalPlatef.toFixed(1)} m
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                    <div className="text-slate-400 text-[9px] font-black uppercase tracking-wider">
                      Écart Global
                    </div>
                    <div className={`text-2xl font-black mt-1 ${
                      globalEcartPct > 25 ? 'text-rose-600' : globalEcartPct > 10 ? 'text-amber-600' : 'text-emerald-600'
                    }`}>
                      {ecartGlobal > 0 ? `+${ecartGlobal.toFixed(1)}` : ecartGlobal.toFixed(1)} m ({globalEcartPct > 0 ? `+${globalEcartPct.toFixed(1)}` : globalEcartPct.toFixed(1)}%)
                    </div>
                  </div>

                  <div className={`border rounded-xl p-4 shadow-sm ${
                    globalFiab.label === 'FIABLE' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-amber-50 border-amber-200 text-amber-700'
                  }`}>
                    <div className="text-[9px] font-black uppercase tracking-wider">
                      Score de Fiabilité
                    </div>
                    <div className="text-2xl font-black mt-1 flex items-center gap-2">
                      <span>{globalFiab.icon}</span>
                      {globalFiab.label}
                    </div>
                  </div>
                </div>

                {/* Section Signature et Validation de l'Audit Mensuel */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl mt-0.5">✍️</span>
                    <div>
                      <h3 className="text-slate-800 text-xs font-black uppercase tracking-widest">
                        Validation de l'Audit de Rapprochement Mensuel
                      </h3>
                      <p className="text-slate-500 text-[10px] uppercase font-bold mt-1 tracking-wider leading-relaxed">
                        En tant que Directeur Technique, validez la conformité des métrages déclarés par rapport aux géomètres.
                      </p>
                      {currentAttachement.valide ? (
                        <div className="mt-2.5 flex items-center gap-2">
                          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest">
                            ✅ AUDIT SIGNÉ & VALIDÉ
                          </span>
                          <span className="text-slate-400 text-[9px] font-semibold">
                            Par {currentAttachement.validePar || 'Hamid EL YAAKOUBY'} le {currentAttachement.dateValidation ? new Date(currentAttachement.dateValidation).toLocaleDateString('fr-FR') : ''}
                          </span>
                        </div>
                      ) : (
                        <div className="mt-2.5">
                          <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest">
                            ⏳ EN ATTENTE DE SIGNATURE
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    {currentAttachement.valide ? (
                      <button
                        onClick={async () => {
                          try {
                            const docId = `SMI_${selectedMois}`;
                            await setDoc(doc(db, 'attachements', docId), {
                              ...currentAttachement,
                              valide: false,
                              validePar: null,
                              dateValidation: null,
                            });
                          } catch (err) {
                            console.error(err);
                          }
                        }}
                        className="px-4 py-2.5 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all"
                      >
                        Annuler la signature
                      </button>
                    ) : (
                      <button
                        onClick={async () => {
                          try {
                            const docId = `SMI_${selectedMois}`;
                            await setDoc(doc(db, 'attachements', docId), {
                              ...currentAttachement,
                              valide: true,
                              validePar: profile?.name || 'Hamid EL YAAKOUBY',
                              dateValidation: new Date().toISOString(),
                            });
                          } catch (err) {
                            console.error(err);
                          }
                        }}
                        className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-650 hover:from-emerald-600 hover:to-teal-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-sm"
                      >
                        ✍️ Signer & Valider l'Audit
                      </button>
                    )}
                  </div>
                </div>

                {/* Distribution visuelle des écarts par chantier */}
                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm mb-6">
                  <h3 className="text-slate-800 text-xs font-black uppercase tracking-widest mb-4 border-b border-slate-100 pb-2">
                    Analyse Visuelle de la Fidélité des Déclarations par Chantier
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {currentAttachement.chantiers.map((c: any, idx: number) => {
                      const platef = productionByChantier[c.chantierId] || 0;
                      const ecartPct = computeEcartPctActual(c.metrageGeometre, platef);
                      const isSuspect = isSuspectFraude(ecartPct) || (c.metrageGeometre === 0 && platef > 0);
                      
                      return (
                        <div key={idx} className={`p-4 rounded-xl border ${
                          isSuspect 
                            ? 'bg-rose-50/40 border-rose-200' 
                            : 'bg-slate-50/60 border-slate-200/80'
                        }`}>
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <span className="text-slate-800 text-[11px] font-black uppercase block">{c.chantierName}</span>
                              <span className="text-slate-400 text-[8.5px] uppercase font-bold">{c.secteur} — {c.galleryType}m²</span>
                            </div>
                            <span className={`px-2 py-0.5 rounded text-[8px] font-black ${
                              isSuspect 
                                ? 'bg-rose-100 text-rose-700' 
                                : Math.abs(ecartPct) <= 10 
                                ? 'bg-emerald-100 text-emerald-850' 
                                : 'bg-amber-100 text-amber-850'
                            }`}>
                              {ecartPct > 0 ? `+${ecartPct.toFixed(0)}%` : `${ecartPct.toFixed(0)}%`}
                            </span>
                          </div>
                          
                          <div className="space-y-1.5 mt-2">
                            <div className="flex justify-between text-[9px] text-slate-500 font-semibold">
                              <span>Géomètre vs Déclaré:</span>
                              <span className="text-slate-700 font-extrabold">{c.metrageGeometre.toFixed(1)}m / {platef.toFixed(1)}m</span>
                            </div>
                            <div className="w-full bg-slate-200/60 h-1.5 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full ${
                                  isSuspect ? 'bg-rose-500' : 'bg-emerald-500'
                                }`}
                                style={{ width: `${platef > 0 ? Math.min(100, Math.max(0, (c.metrageGeometre / platef) * 100)) : 0}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {suspectChantiers.length > 0 && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-850 p-4 rounded-xl mb-6 flex items-start gap-3 shadow-sm">
                    <span className="text-xl">⚠️</span>
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-rose-700">
                        DÉCLARATION SUSPECTE — Écart &gt; 25% — Audit recommandé
                      </h3>
                      <p className="text-[10px] mt-1 text-rose-600 uppercase tracking-wide">
                        Les chantiers suivants présentent un excédent de déclaration critique : {suspectChantiers.map(c => c.chantierName).join(', ')}
                      </p>
                    </div>
                  </div>
                )}

                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mb-6 shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[9px] font-black tracking-wider uppercase text-slate-500">
                          <th className="p-3">Chantier</th>
                          <th className="p-3">Section</th>
                          <th className="p-3">Secteur</th>
                          <th className="p-3 text-right">Géomètre (m)</th>
                          <th className="p-3 text-right">Plateforme (m)</th>
                          <th className="p-3 text-right">Écart (m)</th>
                          <th className="p-3 text-right">Écart (%)</th>
                          <th className="p-3 text-center">Fiabilité</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {currentAttachement.chantiers.map((c, idx) => {
                          const platef = productionByChantier[c.chantierId] || 0;
                          const ecart = platef - c.metrageGeometre;
                          const ecartPct = computeEcartPctActual(c.metrageGeometre, platef);
                          const fiab = getFiabiliteLabel(ecartPct);
                          const suspect = isSuspectFraude(ecartPct) || (c.metrageGeometre === 0 && platef > 0);

                          return (
                            <tr
                              key={idx}
                              className={`transition-colors ${
                                suspect ? 'bg-rose-50/50 hover:bg-rose-50' : 'hover:bg-slate-50/50'
                              }`}
                            >
                              <td className="p-3">
                                <div className="text-slate-800 text-[11px] font-black uppercase">
                                  {c.chantierName}
                                </div>
                              </td>
                              <td className="p-3">
                                <div className="text-slate-500 text-[10px] font-bold">
                                  {c.galleryType === '9' ? 'Traçage 9m²' : 'Galerie 12m²'}
                                </div>
                              </td>
                              <td className="p-3">
                                <div className="text-slate-400 text-[10px] font-bold uppercase">
                                  {c.secteur}
                                </div>
                              </td>
                              <td className="p-3 text-right font-mono text-[11px] text-slate-600">
                                {c.metrageGeometre.toFixed(1)} m
                              </td>
                              <td className="p-3 text-right font-mono text-[11px] text-sky-600 font-bold">
                                {platef.toFixed(1)} m
                              </td>
                              <td className={`p-3 text-right font-mono text-[11px] font-bold ${
                                ecart > 0 ? 'text-rose-600' : ecart < 0 ? 'text-sky-600' : 'text-slate-500'
                              }`}>
                                {ecart > 0 ? `+${ecart.toFixed(1)}` : ecart.toFixed(1)} m
                              </td>
                              <td className={`p-3 text-right font-mono text-[11px] font-bold ${
                                ecartPct > 25 ? 'text-rose-600' : ecartPct > 10 ? 'text-amber-600' : 'text-emerald-600'
                              }`}>
                                {ecartPct > 0 ? `+${ecartPct.toFixed(1)}` : ecartPct.toFixed(1)}%
                              </td>
                              <td className="p-3 text-center">
                                <span className={`inline-flex px-2 py-0.5 border text-[8.5px] font-black uppercase rounded ${
                                  suspect
                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                    : fiab.label === 'FIABLE'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                }`}>
                                  {suspect ? 'ALERTE' : fiab.label}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {systematicAnomalies.length > 0 && (
                  <div className="space-y-3 mb-6">
                    {systematicAnomalies.map((anom, idx) => (
                      <div key={idx} className="bg-rose-50 border border-rose-350 text-rose-800 p-4 rounded-xl flex items-start gap-3 shadow-sm">
                        <span className="text-xl">🚨</span>
                        <div>
                          <h3 className="text-xs font-black uppercase tracking-wider text-rose-700">
                            ANOMALIE SYSTÉMATIQUE — {anom.chantierName}
                          </h3>
                          <p className="text-[10px] mt-1 text-rose-600 uppercase tracking-wide font-bold">
                            Déclare systématiquement plus que le réalisé réel. {anom.consecutiveMonths} mois consécutifs d'excédent détecté. Audit physique requis.
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-8">
                  <h3 className="text-[#b8860b] text-[11px] font-black uppercase tracking-widest mb-4">
                    Historique de Fiabilité — 6 derniers mois
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                    {historiqueAttachements.map((hist, idx) => {
                      const histTotalPlatef = hist.chantiers.reduce((s, c) => {
                        const hProdMap = getMonthlyProductionByChantier(hist.mois);
                        return s + (hProdMap[c.chantierId] || 0);
                      }, 0);
                      const histEcartPct = computeEcartPctActual(hist.totalMetrageGeometre, histTotalPlatef);
                      const histFiab = getFiabiliteLabel(histEcartPct);

                      return (
                        <div key={idx} className="bg-white border border-slate-200 rounded-xl p-3 text-center shadow-sm">
                          <div className="text-slate-400 text-[10px] font-black uppercase">
                            {hist.mois}
                          </div>
                          <div className={`text-sm font-black mt-1 ${
                            histEcartPct > 25 ? 'text-rose-600' : histEcartPct > 10 ? 'text-amber-600' : 'text-emerald-600'
                          }`}>
                            {histEcartPct > 0 ? `+${histEcartPct.toFixed(1)}` : histEcartPct.toFixed(1)}%
                          </div>
                          <div className="mt-2">
                            <span className={`px-1.5 py-0.5 text-[8px] font-black uppercase rounded border ${
                              histEcartPct > 25
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : histFiab.label === 'FIABLE'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>
                              {histFiab.label}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'explosifs' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <input
                type="month"
                value={explosifsMonth}
                onChange={(e) => setExplosifsMonth(e.target.value)}
                className="bg-white border border-slate-200 text-[#b8860b] text-[11px] font-black rounded-xl px-4 py-2.5 outline-none shadow-sm"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <span className="text-slate-400 text-[9px] font-black uppercase tracking-wider">ANFO Consommé</span>
                <div className="text-slate-800 text-2xl font-black mt-1">
                  {expStats.monthlyAnfo.toFixed(0)} kg
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <span className="text-slate-400 text-[9px] font-black uppercase tracking-wider">Tovex Consommé</span>
                <div className="text-slate-800 text-2xl font-black mt-1">
                  {expStats.monthlyTovex.toFixed(1)} kg
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <span className="text-slate-400 text-[9px] font-black uppercase tracking-wider">Amorces Utilisées</span>
                <div className="text-slate-800 text-2xl font-black mt-1">
                  {expStats.monthlyAmorces} u
                </div>
              </div>

              <div className="bg-white border border-amber-200 rounded-xl p-4 shadow-sm">
                <span className="text-amber-700 text-[9px] font-black uppercase tracking-wider">Ratio Moyen ANFO / Mètre</span>
                <div className="text-amber-800 text-2xl font-black mt-1">
                  {expStats.avgAnfoPerMeter.toFixed(2)} kg/m
                </div>
              </div>
            </div>

            {/* Indicateurs Avancés Plan de Tir & Charge Spécifique (Drill & Blast) */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm mb-6">
              <h3 className="text-slate-800 text-xs font-black uppercase tracking-widest mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#8B0000]" />
                Analyse de Performance Foration & Minage (Drill & Blast)
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl">
                  <span className="text-slate-400 text-[8.5px] uppercase font-black tracking-wider block">Taux de Réussite des Volées (Blast Success)</span>
                  <div className="text-emerald-600 text-lg font-black mt-1">
                    {(() => {
                      const totalShots = expStats.monthlyRounds;
                      const abortedShots = rapportHistory.filter(d => (d.totalNonRealises || 0) > 0).length;
                      const successRate = totalShots > 0 ? ((totalShots - abortedShots) / totalShots) * 100 : 100;
                      return `${successRate.toFixed(1)}%`;
                    })()}
                  </div>
                  <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                    Pourcentage de tirs réalisés conformément aux objectifs de la quinzaine
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl">
                  <span className="text-slate-400 text-[8.5px] uppercase font-black tracking-wider block">Facteur d'Énergie Estimé (Specific Charge)</span>
                  <div className="text-[#8B0000] text-lg font-black mt-1">
                    {expStats.avgAnfoPerMeter > 0 ? `${(expStats.avgAnfoPerMeter * 1.15).toFixed(2)} kg/m³` : 'N/A'}
                  </div>
                  <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                    Estimation de la charge d'énergie par volume rocheux (m³)
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl">
                  <span className="text-slate-400 text-[8.5px] uppercase font-black tracking-wider block">Diagnostic de Chargement Front</span>
                  <div className="mt-1.5 flex items-center gap-2">
                    {expStats.avgAnfoPerMeter > 45 ? (
                      <>
                        <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse" />
                        <span className="text-rose-700 text-xs font-black uppercase">⚠️ Surconsommation détectée</span>
                      </>
                    ) : expStats.avgAnfoPerMeter > 30 ? (
                      <>
                        <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-emerald-700 text-xs font-black uppercase">✅ Chargement optimal</span>
                      </>
                    ) : (
                      <>
                        <span className="h-2.5 w-2.5 rounded-full bg-amber-500 animate-pulse" />
                        <span className="text-amber-700 text-xs font-black uppercase">⚠️ Sous-chargement possible</span>
                      </>
                    )}
                  </div>
                  <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                    Sécurité dynamique du front et fragmentation des blocs
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-slate-800 text-xs font-black uppercase tracking-widest">
                  Comparaison Réel vs Théorique (ANFO)
                </h3>
                <span className={`px-2.5 py-1 text-[9px] font-black rounded uppercase border ${
                  Math.abs(expStats.ecartPct) < 15
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : Math.abs(expStats.ecartPct) <= 25
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}>
                  Écart : {Math.abs(expStats.ecartPct) < 15 ? 'NORMAL' : Math.abs(expStats.ecartPct) <= 25 ? 'ATTENTION' : 'ALERTE'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                <div className="space-y-1.5 text-xs font-bold text-slate-700">
                  <div className="flex justify-between pb-1 border-b border-slate-100">
                    <span className="text-slate-400">Consommation réelle :</span>
                    <span className="text-slate-800 font-extrabold">{expStats.monthlyAnfo.toFixed(0)} kg</span>
                  </div>
                  <div className="flex justify-between pb-1 border-b border-slate-100">
                    <span className="text-slate-400">Consommation théorique :</span>
                    <span className="text-slate-500">{expStats.theorique.toFixed(0)} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Écart de consommation :</span>
                    <span className={`font-black ${expStats.ecart > 0 ? 'text-rose-600' : 'text-emerald-650'}`}>
                      {expStats.ecart > 0 ? `+${expStats.ecart.toFixed(0)}` : expStats.ecart.toFixed(0)} kg ({expStats.ecartPct > 0 ? `+${expStats.ecartPct.toFixed(1)}` : expStats.ecartPct.toFixed(1)}%)
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl col-span-2">
                  <p className="text-slate-500 text-[10px] leading-relaxed font-semibold uppercase tracking-wide">
                    Le calcul théorique s'appuie sur le nombre de volées tirées ({expStats.monthlyRounds}) pondéré par les configurations enregistrées (Théorique 9m² : {platformSettings?.explosifs_9m2_anfo ?? 35} kg, 12m² : {platformSettings?.explosifs_12m2_anfo ?? 40} kg). Un écart positif indique un excédent de chargement d'ANFO en front de taille.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-slate-800 text-xs font-black uppercase tracking-widest">
                  Évolution de la Consommation d'Explosifs
                </h3>
                <span className="text-slate-400 text-[9px] uppercase font-bold tracking-wider">
                  Note: TOVEX est multiplié par 10 pour l'échelle visuelle
                </span>
              </div>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={dailyRows}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }} labelStyle={{ color: '#0f172a' }} />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                    <Line type="monotone" dataKey="anfo" name="ANFO (kg)" stroke="#f43f5e" strokeWidth={2} dot={{ r: 2 }} />
                    <Line type="monotone" dataKey="tovexTimes10" name="TOVEX × 10 (kg)" stroke="#f97316" strokeWidth={2} dot={{ r: 2 }} />
                    <Line type="monotone" dataKey="amorces" name="Amorces (u)" stroke="#06b6d4" strokeWidth={2} dot={{ r: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mt-6 shadow-sm">
              <div className="p-4 border-b border-slate-200 bg-slate-50">
                <h3 className="text-slate-800 text-xs font-black uppercase tracking-widest">
                  Détail de la Consommation Journalière
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[9px] font-black tracking-wider uppercase text-slate-500">
                      <th className="p-3">Date</th>
                      <th className="p-3 text-right">ANFO (kg)</th>
                      <th className="p-3 text-right">TOVEX (kg)</th>
                      <th className="p-3 text-right">Amorces</th>
                      <th className="p-3 text-right">ANFO/m (kg/m)</th>
                      <th className="p-3 text-center">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dailyRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-3 text-slate-800 text-[11px] font-black uppercase">
                          {row.date}
                        </td>
                        <td className="p-3 text-right font-mono text-[11px] text-slate-600">
                          {row.anfo.toFixed(0)} kg
                        </td>
                        <td className="p-3 text-right font-mono text-[11px] text-slate-600">
                          {row.tovex.toFixed(1)} kg
                        </td>
                        <td className="p-3 text-right font-mono text-[11px] text-slate-600">
                          {row.amorces} u
                        </td>
                        <td className="p-3 text-right font-mono text-[11px] text-[#b8860b] font-bold">
                          {row.ratio.toFixed(2)} kg/m
                        </td>
                        <td className="p-3 text-center">
                          {row.statusLabel !== '-' ? (
                            <span className={`inline-flex px-2 py-0.5 text-[8px] font-black uppercase rounded ${
                              row.statusLabel === 'SCELLÉ'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              {row.statusLabel}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-bold">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {dailyRows.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400 font-bold text-[10px] uppercase">
                          Aucune donnée enregistrée pour ce mois ({explosifsMonth})
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'rapport' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <input
                type="month"
                value={rapportMonth}
                onChange={(e) => setRapportMonth(e.target.value)}
                className="bg-white border border-slate-200 text-[#b8860b] text-[11px] font-black rounded-xl px-4 py-2.5 outline-none shadow-sm"
              />
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm max-w-2xl mx-auto text-center space-y-6">
              <span className="text-4xl block">📄</span>
              <div>
                <h3 className="text-[#b8860b] text-sm font-black uppercase tracking-wider">
                  Génération du Rapport Mensuel Officiel
                </h3>
                <p className="text-slate-500 text-[11px] font-semibold mt-1">
                  Générez un rapport de production consolidé au format PDF prêt à imprimer ou enregistrer.
                </p>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-left space-y-2.5 max-w-md mx-auto text-[11px] font-bold">
                <div className="flex justify-between pb-1.5 border-b border-slate-200">
                  <span className="text-slate-400">Mois sélectionné :</span>
                  <span className="text-slate-800 uppercase font-black">{rapportMonth}</span>
                </div>
                <div className="flex justify-between pb-1.5 border-b border-slate-200">
                  <span className="text-slate-400">Données de production :</span>
                  <span className="text-slate-700 font-extrabold">{rapportHistory.length} jours disponibles</span>
                </div>
                <div className="flex justify-between pb-1.5 border-b border-slate-200">
                  <span className="text-slate-400">Validation Géomètre (MANAGEM) :</span>
                  <span className={rapportAttachement ? 'text-emerald-700' : 'text-amber-700'}>
                    {rapportAttachement ? '✅ Saisis (Officiel)' : '⚠️ Non saisis (Plateforme)'}
                  </span>
                </div>
                {rapportAttachement && (
                  <div className="flex justify-between text-emerald-750 text-[10px] uppercase font-black">
                    <span>Métrage officiel géomètre :</span>
                    <span>{rapportAttachement.totalMetrageGeometre.toFixed(1)} m</span>
                  </div>
                )}
              </div>

              <div>
                <button
                  onClick={generateMonthlyReport}
                  disabled={generatingPDF}
                  className="px-8 py-4 bg-[#ffd700] text-[#0f172a] text-[12px] font-black uppercase tracking-widest rounded-2xl hover:bg-yellow-300 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generatingPDF ? '⏳ Génération...' : '📄 Générer le Rapport Mensuel PDF'}
                </button>
              </div>
            </div>

            {/* Interactive Preview Panel of the Monthly Report */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-md max-w-4xl mx-auto mt-6">
              <h3 className="text-slate-800 text-xs font-black uppercase tracking-widest mb-4 border-b border-slate-100 pb-2 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#00BFFF]" />
                Aperçu Interactif des Indicateurs ({rapportMonth})
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-slate-50 border border-slate-200/85 p-4 rounded-xl text-center">
                  <span className="text-slate-400 text-[8.5px] uppercase font-black tracking-wider block">Avancement Réalisé</span>
                  <div className="text-[#00BFFF] text-xl font-black mt-1">
                    {(() => {
                      const totalMeters = rapportHistory.reduce((s, d) => s + (d.totalMeterageRealised || 0), 0);
                      return `${totalMeters.toFixed(1)} m`;
                    })()}
                  </div>
                  <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                    Cumul sur {rapportHistory.length} jours enregistrés
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200/85 p-4 rounded-xl text-center">
                  <span className="text-slate-400 text-[8.5px] uppercase font-black tracking-wider block">Objectif Planifié</span>
                  <div className="text-slate-700 text-xl font-black mt-1">
                    {(() => {
                      const totalMetersPlan = rapportHistory.reduce((s, d) => s + (d.totalMeteragePlanned || 0), 0);
                      return `${totalMetersPlan.toFixed(1)} m`;
                    })()}
                  </div>
                  <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                    Métrage total d'avancement cible
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200/85 p-4 rounded-xl text-center">
                  <span className="text-slate-400 text-[8.5px] uppercase font-black tracking-wider block">Taux de Réalisation</span>
                  <div className="text-emerald-600 text-xl font-black mt-1">
                    {(() => {
                      const totalMeters = rapportHistory.reduce((s, d) => s + (d.totalMeterageRealised || 0), 0);
                      const totalMetersPlan = rapportHistory.reduce((s, d) => s + (d.totalMeteragePlanned || 0), 0);
                      const rate = totalMetersPlan > 0 ? (totalMeters / totalMetersPlan) * 100 : 0;
                      return `${rate.toFixed(1)}%`;
                    })()}
                  </div>
                  <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                    Performance moyenne plateforme
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200/85 p-4 rounded-xl text-center">
                  <span className="text-slate-400 text-[8.5px] uppercase font-black tracking-wider block">Wagons d'Argent Extraits</span>
                  <div className="text-amber-600 text-xl font-black mt-1">
                    {(() => {
                      const totalWagons = rapportHistory.reduce((s, d) => s + (d.totalWagonsRealised || 0), 0);
                      return `${totalWagons} u`;
                    })()}
                  </div>
                  <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                    Matière extraite expédiée au traitement
                  </p>
                </div>
              </div>

              {/* Progress visualizer */}
              <div className="space-y-2 bg-slate-50 border border-slate-200/80 p-4 rounded-xl">
                <div className="flex justify-between text-[10px] font-black text-slate-700 uppercase">
                  <span>Progression de l'Objectif Mensuel</span>
                  <span>
                    {(() => {
                      const totalMeters = rapportHistory.reduce((s, d) => s + (d.totalMeterageRealised || 0), 0);
                      const totalMetersPlan = rapportHistory.reduce((s, d) => s + (d.totalMeteragePlanned || 0), 0);
                      return `${totalMeters.toFixed(0)}m sur ${totalMetersPlan.toFixed(0)}m`;
                    })()}
                  </span>
                </div>
                <div className="w-full bg-slate-200 h-2.5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-[#00BFFF] to-[#8B0000] rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(
                        100,
                        (() => {
                          const totalMeters = rapportHistory.reduce((s, d) => s + (d.totalMeterageRealised || 0), 0);
                          const totalMetersPlan = rapportHistory.reduce((s, d) => s + (d.totalMeteragePlanned || 0), 0);
                          return totalMetersPlan > 0 ? (totalMeters / totalMetersPlan) * 100 : 0;
                        })()
                      )}%`
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ia' && (
          <div className="space-y-6">
            {/* 1. Header de l'expert */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700/30 rounded-2xl p-6 shadow-lg relative overflow-hidden">
              <div className="absolute right-0 top-0 h-full w-1/3 opacity-5 pointer-events-none bg-no-repeat bg-right-bottom bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-amber-400 via-yellow-500 to-transparent"></div>
              
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-start sm:items-center gap-4">
                  <div className="relative flex-shrink-0">
                    <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-[#ffd700] rounded-2xl flex items-center justify-center font-black text-[#0f172a] text-lg shadow-md border-2 border-[#ffd700]/30">
                      EH
                    </div>
                    <span className="absolute -bottom-1 -right-1 bg-emerald-500 border-2 border-slate-900 w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-md">
                      <span className="w-2 h-2 bg-white rounded-full animate-ping"></span>
                    </span>
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-white text-base font-black uppercase tracking-wider">
                        M. ELYAAKOUBY HAMID
                      </h3>
                      <span className="bg-amber-400/10 text-amber-300 border border-amber-400/20 px-2.5 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-widest">
                        Directeur technique hydromines
                      </span>
                    </div>
                    <p className="text-slate-300 text-[11px] font-medium mt-1 leading-relaxed">
                      Expert chevronné de la mine d'argent souterraine. Optimisation des chantiers, rendement foration (Montabert T23), maîtrise des explosifs et prises de décisions chiffrées d'urgence.
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-[9px] text-emerald-400 font-bold uppercase tracking-wider">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      Moteur IA Gemini 2.0 Flash — Connecté en direct sur la base SMI
                    </div>
                  </div>
                </div>

                {/* Bouton de réinitialisation rapide si besoin */}
                {(structuredResponse || dtResponse) && (
                  <button
                    onClick={() => {
                      setDtResponse(null);
                      setStructuredResponse(null);
                      setSelectedQuestion(null);
                      setDtQuestion('');
                    }}
                    className="self-start lg:self-center px-4 py-2 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                  >
                    🔄 Nouvelle analyse
                  </button>
                )}
              </div>
            </div>

            {/* 2. Tableau de bord opérationnel immédiat (KPI pré-calculés) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-[#ffd700]" />
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-[8.5px] font-black uppercase tracking-wider">Avancement Mensuel</span>
                  <span className="text-xs">⛏️</span>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-lg font-black text-slate-800">
                    {(() => {
                      const totalMetersReel = rapportHistory.reduce((s, d) => s + (d.totalMeterageRealised || 0), 0);
                      return totalMetersReel.toFixed(1);
                    })()} m
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    / {(() => {
                      const totalMetersPlan = rapportHistory.reduce((s, d) => s + (d.totalMeteragePlanned || 0), 0);
                      return totalMetersPlan.toFixed(1);
                    })()} m
                  </span>
                </div>
                <div className="mt-2.5 flex items-center gap-1.5">
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-amber-500 h-full rounded-full transition-all duration-500" 
                      style={{ 
                        width: `${(() => {
                          const totalMetersReel = rapportHistory.reduce((s, d) => s + (d.totalMeterageRealised || 0), 0);
                          const totalMetersPlan = rapportHistory.reduce((s, d) => s + (d.totalMeteragePlanned || 0), 0);
                          const pct = totalMetersPlan > 0 ? (totalMetersReel / totalMetersPlan) * 100 : 0;
                          return Math.min(100, pct);
                        })()}%` 
                      }}
                    />
                  </div>
                  <span className="text-[9px] font-black text-amber-600">
                    {(() => {
                      const totalMetersReel = rapportHistory.reduce((s, d) => s + (d.totalMeterageRealised || 0), 0);
                      const totalMetersPlan = rapportHistory.reduce((s, d) => s + (d.totalMeteragePlanned || 0), 0);
                      return (totalMetersPlan > 0 ? (totalMetersReel / totalMetersPlan) * 100 : 0).toFixed(0);
                    })()}%
                  </span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-500" />
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-[8.5px] font-black uppercase tracking-wider">Ratio de Chargement</span>
                  <span className="text-xs">💥</span>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-lg font-black text-slate-800">
                    {(() => {
                      const totalMetersReel = rapportHistory.reduce((s, d) => s + (d.totalMeterageRealised || 0), 0);
                      const totalAnfoCons = rapportHistory.reduce((s, d) => s + (d.totalAnfo || 0), 0);
                      const ratio = totalMetersReel > 0 ? totalAnfoCons / totalMetersReel : 0;
                      return ratio.toFixed(2);
                    })()} kg
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    ANFO / m
                  </span>
                </div>
                <div className="mt-2.5 flex items-center justify-between">
                  <span className="text-[8px] text-slate-400 font-black uppercase tracking-wide">
                    Consommation totale :
                  </span>
                  <span className="text-[9px] font-extrabold text-slate-700 font-mono">
                    {(() => {
                      const totalAnfoCons = rapportHistory.reduce((s, d) => s + (d.totalAnfo || 0), 0);
                      return totalAnfoCons.toLocaleString('fr-FR');
                    })()} kg
                  </span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-500" />
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-[8.5px] font-black uppercase tracking-wider">Densité Wagons / Mètre</span>
                  <span className="text-xs">🚛</span>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-lg font-black text-slate-800">
                    {(() => {
                      const totalMetersReel = rapportHistory.reduce((s, d) => s + (d.totalMeterageRealised || 0), 0);
                      const wagonsTotalReel = rapportHistory.reduce((s, d) => s + (d.totalWagonsRealised || 0), 0);
                      const ratio = totalMetersReel > 0 ? wagonsTotalReel / totalMetersReel : 0;
                      return ratio.toFixed(2);
                    })()} u
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    wagons / m
                  </span>
                </div>
                <div className="mt-2.5 flex items-center justify-between">
                  <span className="text-[8px] text-slate-400 font-black uppercase tracking-wide">
                    Extraction totale :
                  </span>
                  <span className="text-[9px] font-extrabold text-slate-700">
                    {(() => {
                      const wagonsTotalReel = rapportHistory.reduce((s, d) => s + (d.totalWagonsRealised || 0), 0);
                      return wagonsTotalReel;
                    })()} wagons
                  </span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-400 to-pink-500" />
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-[8.5px] font-black uppercase tracking-wider">Fiabilité Données Géomètre</span>
                  <span className="text-xs">📐</span>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-lg font-black text-slate-800">
                    {rapportAttachement ? 'OFFICIEL' : 'ESTIMÉ'}
                  </span>
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${
                    rapportAttachement ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                  }`}>
                    {rapportAttachement ? 'Validé' : 'SMI Plateforme'}
                  </span>
                </div>
                <div className="mt-2.5 flex items-center justify-between">
                  <span className="text-[8px] text-slate-400 font-black uppercase tracking-wide">
                    Écarts de tir détectés :
                  </span>
                  <span className="text-[9px] font-extrabold text-rose-600">
                    {(() => {
                      const hasGeo = !!rapportAttachement;
                      if (!hasGeo) return 0;
                      return rapportHistory.filter(d => Math.abs((d.totalMeterageRealised || 0) - (d.totalMeteragePlanned || 0)) > 3).length;
                    })()} anomalies
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Zone principale en deux colonnes si historique disponible */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              
              {/* Colonne gauche (2/3 de l'espace) - Formulaire de question et raccourcis */}
              <div className="xl:col-span-2 space-y-6">
                
                {/* Raccourcis IA catégorisés */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
                  <div>
                    <h4 className="text-[#b8860b] text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                      <span className="w-1.5 h-3 bg-[#b8860b] rounded-full"></span>
                      Raccourcis Décisionnels d'un Clic (M. ELYAAKOUBY HAMID)
                    </h4>
                    <p className="text-slate-400 text-[9px] font-bold mt-1 uppercase tracking-wider">
                      Cliquez sur une macro-commande pour lancer une analyse profonde instantanée des données
                    </p>
                  </div>

                  <div className="space-y-4">
                    {CATEGORIZED_QUESTIONS_DT.map((cat, idx) => (
                      <div key={idx} className="space-y-2">
                        <div className="flex items-center gap-1.5 pb-1 border-b border-slate-100">
                          <span className="text-xs">{cat.icon}</span>
                          <span className="text-slate-700 text-[9px] font-black uppercase tracking-wider">{cat.category}</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {cat.questions.map((item, qIdx) => (
                            <button
                              key={qIdx}
                              onClick={() => {
                                setSelectedQuestion(item.q);
                                setDtQuestion(item.q);
                                callDtIA(item.q);
                              }}
                              className={`px-4 py-3 rounded-xl text-left border transition-all flex flex-col justify-between h-22 group ${
                                selectedQuestion === item.q
                                  ? 'bg-gradient-to-br from-amber-500 to-[#ffd700] text-[#0f172a] border-amber-400 shadow-md transform scale-[1.01]'
                                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-amber-50/50 hover:border-amber-200/60'
                              }`}
                            >
                              <div>
                                <p className={`text-[10px] font-black uppercase tracking-wider ${
                                  selectedQuestion === item.q ? 'text-[#0f172a]' : 'text-slate-800'
                                }`}>
                                  {item.label}
                                </p>
                                <p className={`text-[8.5px] font-semibold mt-1 leading-normal ${
                                  selectedQuestion === item.q ? 'text-[#0f172a]/80' : 'text-slate-400 group-hover:text-slate-500'
                                }`}>
                                  {item.desc}
                                </p>
                              </div>
                              <span className={`text-[7.5px] font-black uppercase tracking-widest mt-2 self-end px-2 py-0.5 rounded-md ${
                                selectedQuestion === item.q 
                                  ? 'bg-[#0f172a] text-[#ffd700]' 
                                  : 'bg-white border border-slate-200 text-slate-500'
                              }`}>
                                {selectedQuestion === item.q ? '⚡ ACTIF' : '🔍 EXÉCUTER'}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Formulaire de question libre */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                  <div>
                    <h4 className="text-slate-800 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                      <span className="w-1.5 h-3 bg-slate-600 rounded-full"></span>
                      Demande personnalisée ou instruction libre
                    </h4>
                    <p className="text-slate-400 text-[9px] font-bold mt-1 uppercase tracking-wider">
                      Saisissez une question précise sur un chantier, un foreur, une consommation d'explosif ou une anomalie
                    </p>
                  </div>

                  <div className="relative">
                    <textarea
                      value={dtQuestion}
                      onChange={(e) => {
                        setDtQuestion(e.target.value);
                        setSelectedQuestion(null);
                      }}
                      placeholder="Exemple: Pourquoi le chantier Imiter Est a connu une baisse de rendement de foration du perforateur Montabert T23 du 12 au 15 ?"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-[11px] font-medium rounded-xl px-4 py-3 resize-none h-24 outline-none focus:bg-white focus:border-amber-500 placeholder:text-slate-400 font-mono transition-all shadow-inner"
                    />
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-[8.5px] text-slate-400 font-black uppercase tracking-wider">
                      {dtQuestion.length} caractères saisis
                    </span>
                    <button
                      onClick={() => callDtIA()}
                      disabled={loadingDT || !dtQuestion}
                      className="px-6 py-3 bg-gradient-to-r from-amber-500 to-[#ffd700] text-[#0f172a] text-[10px] font-black uppercase tracking-widest rounded-xl hover:shadow-md transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {loadingDT ? (
                        <>
                          <span className="w-3 h-3 border-2 border-[#0f172a] border-t-transparent rounded-full animate-spin"></span>
                          ANALYSE EN COURS...
                        </>
                      ) : (
                        <>
                          <span>⚡</span> EXECUTER L'ANALYSE EXPERTE
                        </>
                      )}
                    </button>
                  </div>
                </div>

              </div>

              {/* Colonne droite (1/3 de l'espace) - Historique de la session et info-expert */}
              <div className="space-y-6">
                
                {/* Historique des analyses de la session */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h4 className="text-slate-800 text-[10px] font-black uppercase tracking-widest">
                      📋 Historique Session
                    </h4>
                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[8px] font-black">
                      {savedAnalyses.length} analyses
                    </span>
                  </div>

                  {savedAnalyses.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 text-[10px] uppercase font-bold space-y-2">
                      <span className="text-2xl block opacity-30">⏳</span>
                      <p>Aucun audit lancé dans cette session</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                      {savedAnalyses.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            setStructuredResponse(item.response);
                            setDtResponse(
                              [
                                item.response.analysis,
                                item.response.anomalies?.length ? '\n\n⚠️ Anomalies :\n' + item.response.anomalies.join('\n') : '',
                                item.response.suggestions?.length ? '\n\n✅ Recommandations :\n' + item.response.suggestions.join('\n') : ''
                              ].filter(Boolean).join('')
                            );
                            setDtQuestion(item.question);
                            setSelectedQuestion(item.question);
                          }}
                          className="w-full text-left p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-amber-300 hover:bg-amber-50/20 transition-all text-[9.5px] font-semibold flex flex-col justify-between gap-1.5 group"
                        >
                          <div className="flex justify-between items-center text-[8px] text-slate-400 uppercase font-black">
                            <span>🕒 {item.date}</span>
                            <span className="text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity">Charger 📂</span>
                          </div>
                          <p className="text-slate-700 line-clamp-2 font-mono uppercase tracking-wide">
                            {item.question}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bloc d'aide technique / Normes de la mine d'argent d'Imiter */}
                <div className="bg-slate-900 border border-slate-800 text-slate-300 rounded-2xl p-6 shadow-md space-y-4 relative overflow-hidden">
                  <div className="absolute right-0 bottom-0 text-[100px] text-slate-800 font-bold select-none leading-none opacity-20 pointer-events-none translate-y-10 translate-x-10">
                    SMI
                  </div>
                  <h4 className="text-amber-400 text-[9px] font-black uppercase tracking-widest">
                    ℹ️ Normes de Référence SMI
                  </h4>
                  <ul className="space-y-2.5 text-[9.5px] font-semibold text-slate-400">
                    <li className="flex items-start gap-2">
                      <span className="text-amber-400 text-xs mt-0.5">▪</span>
                      <div>
                        <strong className="text-slate-200">Rendement de foration :</strong> Standard de 1.2 à 1.5 mètres de volée par tir pour les perforateurs Montabert T23.
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-400 text-xs mt-0.5">▪</span>
                      <div>
                        <strong className="text-slate-200">Maîtrise Explosifs :</strong> Norme stricte de max 50 kg d'ANFO par volée d'avancement pour limiter le surbreak et sécuriser la structure.
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-400 text-xs mt-0.5">▪</span>
                      <div>
                        <strong className="text-slate-200">Taux d'avancement :</strong> Objectif théorique mensuel de 120m par chantier de traçage actif.
                      </div>
                    </li>
                  </ul>
                </div>

              </div>

            </div>

            {/* 4. Etats d'Erreur */}
            {dtError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl p-5 text-[11px] font-black flex items-center gap-3 shadow-sm">
                <span className="text-xl">❌</span> 
                <div>
                  <p className="uppercase tracking-wider">Erreur de traitement d'audit</p>
                  <p className="text-slate-500 font-bold mt-0.5 font-mono">{dtError}</p>
                </div>
              </div>
            )}

            {/* 5. Progressive Interactive Loader Simulator */}
            {loadingDT && (
              <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-8 shadow-xl text-center space-y-6 max-w-2xl mx-auto">
                <div className="flex justify-center items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></span>
                  <p className="text-[#ffd700] text-[10px] font-black uppercase tracking-widest">
                    MOTEUR DE SYNTHÈSE M. ELYAAKOUBY HAMID ACTIF
                  </p>
                </div>
                
                <div>
                  <h4 className="text-white text-sm font-black uppercase tracking-wider">
                    Diagnostic Opérationnel SMI en cours...
                  </h4>
                  <p className="text-slate-400 text-[10.5px] font-medium mt-1">
                    Analyse comparative et calculs d'écarts par rapport aux normes d'ingénierie souterraine.
                  </p>
                </div>

                <div className="bg-slate-900 rounded-xl p-5 border border-slate-800 text-left space-y-3.5 max-w-md mx-auto">
                  <div className="flex items-center gap-3">
                    <span className="text-xs">{loaderStep >= 1 ? '✅' : '⏳'}</span>
                    <span className={`text-[10px] font-semibold ${loaderStep >= 1 ? 'text-emerald-400 font-bold' : 'text-slate-400'}`}>
                      Lecture des données opérationnelles SMI ({rapportHistory.length} jours)
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs">{loaderStep >= 2 ? '✅' : loaderStep === 1 ? '⏳' : '⚪'}</span>
                    <span className={`text-[10px] font-semibold ${loaderStep >= 2 ? 'text-emerald-400 font-bold' : loaderStep === 1 ? 'text-slate-300' : 'text-slate-500'}`}>
                      Audit de cohérence fiches vs métrages Géomètre
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs">{loaderStep >= 3 ? '✅' : loaderStep === 2 ? '⏳' : '⚪'}</span>
                    <span className={`text-[10px] font-semibold ${loaderStep >= 3 ? 'text-emerald-400 font-bold' : loaderStep === 2 ? 'text-slate-300' : 'text-slate-500'}`}>
                      Calcul des indices d'explosifs ANFO/mètre
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs">{loaderStep >= 4 ? '✅' : loaderStep === 3 ? '⏳' : '⚪'}</span>
                    <span className={`text-[10px] font-semibold ${loaderStep >= 4 ? 'text-emerald-400 font-bold' : loaderStep === 3 ? 'text-slate-300' : 'text-slate-500'}`}>
                      Analyse de rendement d'avancement des perforateurs Montabert T23
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs">{loaderStep === 4 ? '⏳' : '⚪'}</span>
                    <span className={`text-[10px] font-semibold ${loaderStep === 4 ? 'text-amber-400 font-bold animate-pulse' : 'text-slate-500'}`}>
                      Formulation des décisions stratégiques du Directeur Technique
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 6. GOD LEVEL REPORT VIEWER BOARD */}
            {structuredResponse && !loadingDT && (
              <div className="bg-white border border-slate-300 rounded-2xl shadow-xl overflow-hidden relative transition-all">
                
                {/* En-tête style document officiel de la mine d'Imiter */}
                <div className="bg-gradient-to-r from-slate-900 to-[#1e293b] text-white p-6 border-b border-[#ffd700]/30 relative">
                  <div className="absolute right-6 top-6 bg-[#ffd700]/10 text-[#ffd700] border border-[#ffd700]/30 px-3 py-1 rounded-md text-[8px] font-black uppercase tracking-widest">
                    STRICTEMENT CONFIDENTIEL — USAGE INTERNE
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">🛡️</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-[#ffd700] font-black uppercase tracking-widest">SMI Imiter — Groupe Managem</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Direction Technique</span>
                      </div>
                      <h4 className="text-base font-black uppercase tracking-wider text-white mt-1">
                        Rapport Diagnostic & Recommandations d'Ingénierie
                      </h4>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mt-0.5 font-mono">
                        Édité pour le mois : {rapportMonth} — Basé sur {rapportHistory.length} fiches journalières consolidées
                      </p>
                    </div>
                  </div>
                </div>

                {/* Onglets interactifs à l'intérieur du rapport pour une lecture propre */}
                <div className="bg-slate-50 border-b border-slate-200 flex flex-wrap gap-1 px-4 pt-3">
                  <button
                    onClick={() => setActiveReportTab('synthese')}
                    className={`px-4 py-2 rounded-t-xl text-[10px] font-black uppercase tracking-wider transition-all border-t border-x ${
                      activeReportTab === 'synthese'
                        ? 'bg-white border-slate-200 text-[#b8860b] shadow-sm font-black translate-y-[1px] z-10'
                        : 'border-transparent text-slate-500 hover:text-slate-800 bg-transparent'
                    }`}
                  >
                    📊 Synthèse d'Analyse
                  </button>
                  <button
                    onClick={() => setActiveReportTab('anomalies')}
                    className={`px-4 py-2 rounded-t-xl text-[10px] font-black uppercase tracking-wider transition-all border-t border-x relative ${
                      activeReportTab === 'anomalies'
                        ? 'bg-white border-slate-200 text-[#b8860b] shadow-sm font-black translate-y-[1px] z-10'
                        : 'border-transparent text-slate-500 hover:text-slate-800 bg-transparent'
                    }`}
                  >
                    ⚠️ Anomalies Détectées
                    {structuredResponse.anomalies.length > 0 && (
                      <span className="ml-1.5 bg-rose-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full font-mono">
                        {structuredResponse.anomalies.length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveReportTab('recommandations')}
                    className={`px-4 py-2 rounded-t-xl text-[10px] font-black uppercase tracking-wider transition-all border-t border-x ${
                      activeReportTab === 'recommandations'
                        ? 'bg-white border-slate-200 text-[#b8860b] shadow-sm font-black translate-y-[1px] z-10'
                        : 'border-transparent text-slate-500 hover:text-slate-800 bg-transparent'
                    }`}
                  >
                    💡 Recommandations Opérationnelles
                    {structuredResponse.suggestions.length > 0 && (
                      <span className="ml-1.5 bg-emerald-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full font-mono">
                        {structuredResponse.suggestions.length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveReportTab('logique')}
                    className={`px-4 py-2 rounded-t-xl text-[10px] font-black uppercase tracking-wider transition-all border-t border-x ${
                      activeReportTab === 'logique'
                        ? 'bg-white border-slate-200 text-[#b8860b] shadow-sm font-black translate-y-[1px] z-10'
                        : 'border-transparent text-slate-500 hover:text-slate-800 bg-transparent'
                    }`}
                  >
                    🧠 Logique & Méthode
                  </button>
                </div>

                {/* Contenu du rapport */}
                <div className="p-6 relative">
                  
                  {/* Filigrane CONFIDENTIEL en arrière-plan */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none select-none">
                    <span className="text-[120px] font-black uppercase tracking-widest border-[20px] border-amber-950 p-10 rotate-12">
                      SMI IMITER
                    </span>
                  </div>

                  {activeReportTab === 'synthese' && (
                    <div className="space-y-4">
                      <div className="bg-amber-50/40 border border-amber-100 rounded-xl p-4 mb-4 text-[11px] font-semibold text-amber-900 leading-relaxed">
                        🤖 <strong className="uppercase font-black text-amber-950">Synthèse Générée par l'IA :</strong> Les résultats ci-dessous reflètent une analyse approfondie des performances de foration et de consommation.
                      </div>
                      <div className="whitespace-pre-wrap text-slate-800 text-[11px] leading-relaxed font-semibold font-mono bg-slate-50 border border-slate-200 p-6 rounded-2xl shadow-inner max-h-[450px] overflow-y-auto">
                        {structuredResponse.analysis}
                      </div>
                    </div>
                  )}

                  {activeReportTab === 'anomalies' && (
                    <div className="space-y-3">
                      {structuredResponse.anomalies.length === 0 ? (
                        <div className="text-center py-12 bg-emerald-50/20 border border-emerald-100 rounded-2xl text-emerald-800 font-bold text-[11px] uppercase">
                          🎉 Aucune anomalie critique détectée par le Directeur Technique pour ce mois.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-2.5">
                          {structuredResponse.anomalies.map((anom, idx) => (
                            <div key={idx} className="bg-rose-50/50 border border-rose-200 rounded-xl p-4 flex items-start gap-3 shadow-sm hover:bg-rose-50 transition-colors">
                              <span className="text-lg mt-0.5">⚠️</span>
                              <div>
                                <p className="text-[10px] font-black text-rose-900 uppercase tracking-wider">
                                  Anomalie Opérationnelle #{idx + 1}
                                </p>
                                <p className="text-slate-800 text-[10.5px] font-semibold mt-1 font-mono leading-relaxed">
                                  {anom}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {activeReportTab === 'recommandations' && (
                    <div className="space-y-3">
                      {structuredResponse.suggestions.length === 0 ? (
                        <div className="text-center py-12 bg-slate-50 border border-slate-200 rounded-2xl text-slate-500 font-bold text-[11px] uppercase">
                          Aucune suggestion générée pour ce rapport.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-3">
                          {structuredResponse.suggestions.map((sugg, idx) => (
                            <div key={idx} className="bg-emerald-50/40 border border-emerald-100 rounded-xl p-4 flex items-start gap-3 shadow-sm hover:bg-emerald-50/80 transition-colors">
                              <span className="text-lg mt-0.5">💡</span>
                              <div className="flex-1">
                                <div className="flex justify-between items-center">
                                  <p className="text-[10px] font-black text-emerald-950 uppercase tracking-wider">
                                    Décision d'Urgence #{idx + 1}
                                  </p>
                                  <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider">
                                    À Appliquer
                                  </span>
                                </div>
                                <p className="text-slate-800 text-[10.5px] font-semibold mt-1.5 font-mono leading-relaxed">
                                  {sugg}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {activeReportTab === 'logique' && (
                    <div className="space-y-4">
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                        <h5 className="text-slate-800 text-[10px] font-black uppercase tracking-wider">
                          🧬 Cadre Analytique d'Expertise
                        </h5>
                        <p className="text-slate-600 text-[10.5px] font-medium leading-relaxed">
                          Cette analyse a été automatisée à l'aide des règles de l'art du Directeur Technique. Elle applique les règles de logique d'ingénierie minière souterraine suivantes :
                        </p>
                        
                        <div className="bg-white border border-slate-200 rounded-xl p-4 text-[10.5px] font-mono leading-relaxed text-slate-800 max-h-[300px] overflow-y-auto">
                          {structuredResponse.logic || (
                            "Logique standard de rendement : Écart d'avancement m/tir par rapport à la grille de tir SMI standard. Analyse de charge explosive volumique par volée de traçage pour corréler la surconsommation d'explosif au mauvais rendement de tir."
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                </div>

                {/* Pied de page du rapport avec actions de partage / copie */}
                <div className="bg-slate-50 border-t border-slate-200 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-slate-400 text-[8.5px] uppercase font-black tracking-widest font-mono">
                    Document généré électroniquement par M. ELYAAKOUBY HAMID twin
                  </div>
                  
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => {
                        const plainText = `RAPPORT DE DIAGNOSTIC - DIRECTION TECHNIQUE SMI\nMois: ${rapportMonth}\n\nSYNTHÈSE TECHNIQUE:\n${structuredResponse.analysis}\n\nANOMALIES DÉTECTÉES:\n${structuredResponse.anomalies.map((a, i) => `${i+1}. ${a}`).join('\n')}\n\nRECOMMANDATIONS:\n${structuredResponse.suggestions.map((s, i) => `${i+1}. ${s}`).join('\n')}\n\nSMI IMITER - DOCUMENT CONFIDENTIEL`;
                        navigator.clipboard.writeText(plainText);
                        alert('Rapport copié dans le presse-papiers sous format e-mail professionnel !');
                      }}
                      className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5"
                    >
                      📋 Copier pour E-mail
                    </button>
                    <button
                      onClick={() => {
                        window.print();
                      }}
                      className="flex-1 sm:flex-none px-4 py-2.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-[9px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5"
                    >
                      🖨️ Imprimer la Note
                    </button>
                  </div>
                </div>

              </div>
            )}

          </div>
        )}

        {activeTab === 'comparaison' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Titre & Description du Cockpit de Comparaison */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <h2 className="text-[#b8860b] font-black text-base uppercase tracking-wider flex items-center gap-2">
                  <span>📊</span> Comparaison Inter-Mois & Cockpit Prédictif
                </h2>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">
                  Analyse d'évolution, détection de dérive et simulateur de rendement technique
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans">Métrique active :</span>
                <select
                  value={comparisonMetric}
                  onChange={(e) => setComparisonMetric(e.target.value as any)}
                  className="bg-white border border-slate-200 text-[#b8860b] text-[11px] font-black rounded-xl px-4 py-2 outline-none shadow-sm font-sans"
                >
                  <option value="meters">📏 Métrages (Géomètre vs Déclaré)</option>
                  <option value="explosives">💥 Consommation d'Explosifs (ANFO kg)</option>
                  <option value="efficiency">⚡ Facteur de Charge (ANFO kg/m)</option>
                  <option value="extraction">🚛 Volume d'Extraction (Wagons)</option>
                </select>
              </div>
            </div>

            {/* Section 1 : Graphique Recharts interactif d'évolution */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-slate-800 font-black text-[12px] uppercase tracking-wider">
                    {comparisonMetric === 'meters' && "Écart Métrage Déclaré vs Mesure Géomètre Officielle"}
                    {comparisonMetric === 'explosives' && "Volume de Consommation Explosive ANFO Cumulé"}
                    {comparisonMetric === 'efficiency' && "Évolution du Facteur de Charge Spécifique Moyen"}
                    {comparisonMetric === 'extraction' && "Volume Cumulé d'Extraction Souterraine"}
                  </h3>
                  <p className="text-slate-400 text-[9px] font-semibold uppercase tracking-wider mt-0.5">
                    Tendance historique des 6 derniers mois d'exploitation de la SMI
                  </p>
                </div>
                <div className="flex gap-2">
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border border-slate-200 text-[9px] font-black text-slate-500 bg-slate-50 uppercase tracking-wider">
                    <span className="w-2 h-2 rounded-full bg-[#b8860b]"></span>
                    Tendance
                  </span>
                </div>
              </div>

              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={getComparisonData()}
                    margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis 
                      dataKey="month" 
                      stroke="#94a3b8" 
                      fontSize={10} 
                      fontWeight="bold"
                      tickFormatter={(v) => {
                        const parts = v.split('-');
                        if (parts.length === 2) {
                          const mNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
                          const idx = parseInt(parts[1], 10) - 1;
                          return `${mNames[idx]} ${parts[0]}`;
                        }
                        return v;
                      }}
                    />
                    <YAxis stroke="#94a3b8" fontSize={10} fontWeight="bold" />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '12px', color: '#fff', fontSize: '11px', fontFamily: 'monospace' }}
                      labelClassName="text-amber-400 font-bold"
                    />
                    <Legend wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }} />
                    
                    {comparisonMetric === 'meters' && (
                      <>
                        <Line name="Métrage Déclaré (m)" type="monotone" dataKey="declaredMeters" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} />
                        <Line name="Métrage Validé Géomètre (m)" type="monotone" dataKey="geometreMeters" stroke="#b8860b" strokeWidth={3} dot={{ r: 4 }} />
                      </>
                    )}

                    {comparisonMetric === 'explosives' && (
                      <Line name="ANFO Consommé (kg)" type="monotone" dataKey="anfo" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} />
                    )}

                    {comparisonMetric === 'efficiency' && (
                      <Line name="Charge Spécifique (kg/m)" type="monotone" dataKey="specificCharge" stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                    )}

                    {comparisonMetric === 'extraction' && (
                      <Line name="Wagons Extraits (u)" type="monotone" dataKey="wagons" stroke="#f59e0b" strokeWidth={3} dot={{ r: 4 }} />
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Section 2 : Tableau Comparatif Analytique complet */}
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
              <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex justify-between items-center">
                <h3 className="text-slate-800 font-black text-xs uppercase tracking-wider flex items-center gap-1.5">
                  <span>📋</span> Tableau de Bord Synthétique Comparatif
                </h3>
                <span className="text-[9px] font-bold uppercase text-slate-400 font-mono">Confidentialité SMI</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/50 text-[9px] font-black uppercase tracking-widest text-slate-500">
                      <th className="px-6 py-3">Mois d'exploitation</th>
                      <th className="px-6 py-3 text-right">Métrage Déclaré</th>
                      <th className="px-6 py-3 text-right">Métrage Validé</th>
                      <th className="px-6 py-3 text-right">Écart Déclaration</th>
                      <th className="px-6 py-3 text-right">ANFO Consommé</th>
                      <th className="px-6 py-3 text-right">Charge Spécifique</th>
                      <th className="px-6 py-3 text-right">Wagons</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-[10.5px] font-semibold text-slate-700">
                    {getComparisonData().map((item, idx, arr) => {
                      const prevItem = idx > 0 ? arr[idx - 1] : null;
                      
                      // Calculate trend for declared meters
                      let trendIcon = "➡️";
                      let trendColor = "text-slate-400";
                      if (prevItem) {
                        const diff = item.declaredMeters - prevItem.declaredMeters;
                        if (diff > 5) {
                          trendIcon = "↗️";
                          trendColor = "text-emerald-500";
                        } else if (diff < -5) {
                          trendIcon = "↘️";
                          trendColor = "text-rose-500";
                        }
                      }

                      return (
                        <tr key={item.month} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-3.5 font-bold uppercase">
                            <span className="font-mono text-slate-400 text-[9px] mr-1.5">{item.month}</span>
                            {(() => {
                              const parts = item.month.split('-');
                              if (parts.length === 2) {
                                const mNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
                                return mNames[parseInt(parts[1], 10) - 1];
                              }
                              return item.month;
                            })()}
                          </td>
                          <td className="px-6 py-3.5 text-right font-bold">
                            <span className={`inline-block mr-1 ${trendColor}`}>{trendIcon}</span>
                            {item.declaredMeters.toFixed(1)} m
                          </td>
                          <td className="px-6 py-3.5 text-right font-extrabold text-[#b8860b]">
                            {item.geometreMeters > 0 ? `${item.geometreMeters.toFixed(1)} m` : 'Non saisi'}
                          </td>
                          <td className="px-6 py-3.5 text-right">
                            {item.geometreMeters > 0 ? (
                              <span className={`px-2 py-0.5 rounded text-[9px] font-black border ${
                                Math.abs(item.gapPct) <= 5
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-100'
                                  : Math.abs(item.gapPct) <= 10
                                  ? 'bg-amber-50 text-amber-700 border-amber-100'
                                  : 'bg-rose-50 text-rose-700 border-rose-100'
                              }`}>
                                {item.gap > 0 ? '+' : ''}{item.gap.toFixed(1)} m ({item.gapPct.toFixed(1)}%)
                              </span>
                            ) : (
                              <span className="text-slate-400 font-normal">En attente</span>
                            )}
                          </td>
                          <td className="px-6 py-3.5 text-right font-mono text-slate-600">
                            {item.anfo.toLocaleString('fr-FR')} kg
                          </td>
                          <td className="px-6 py-3.5 text-right font-mono font-bold">
                            {item.specificCharge.toFixed(2)} kg/m
                          </td>
                          <td className="px-6 py-3.5 text-right font-mono font-extrabold text-slate-800">
                            {item.wagons.toLocaleString('fr-FR')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Section 3 : Le Cockpit Décisionnel / Diagnostic de Dérive */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Alerte Dérive & Plan d'Action */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-lg">🎯</span>
                    <h3 className="text-slate-800 font-black text-xs uppercase tracking-wider font-sans">
                      Analyse de Dérive de Déclaration (Audit de Cohérence)
                    </h3>
                  </div>
                  <div className="text-slate-600 text-xs leading-relaxed space-y-3 font-medium">
                    <p>
                      En tant que Directeur Technique, l'une de vos tâches principales consiste à maintenir l'écart entre le métrage déclaré par les chantiers (SMI) et le métrage validé par l'équipe de géomètres en dessous d'un seuil critique de <strong>5%</strong>.
                    </p>
                    {(() => {
                      const comparison = getComparisonData().filter(item => item.geometreMeters > 0);
                      if (comparison.length === 0) {
                        return (
                          <p className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-slate-500 font-semibold font-mono">
                            ℹ️ Données d'attachements géomètres insuffisantes sur la période pour calculer le diagnostic de dérive automatique.
                          </p>
                        );
                      }
                      
                      const lastMonth = comparison[comparison.length - 1];
                      const hasHighGap = Math.abs(lastMonth.gapPct) > 5;

                      return (
                        <div className="space-y-3">
                          <div className={`p-4 rounded-2xl border ${
                            hasHighGap 
                              ? 'bg-rose-50/50 border-rose-200 text-rose-950' 
                              : 'bg-emerald-50/50 border-emerald-200 text-emerald-950'
                          }`}>
                            <div className="font-black uppercase text-[10px] tracking-wider mb-1 flex items-center gap-1.5">
                              {hasHighGap ? '⚠️ ALERTE DE DÉRIVE DÉTECTÉE' : '✅ COHÉRENCE CONFORME'}
                            </div>
                            <p className="text-[11px] leading-relaxed">
                              Le mois de <strong>{lastMonth.month}</strong> affiche un écart de <strong>{lastMonth.gapPct.toFixed(1)}%</strong> ({lastMonth.gap.toFixed(1)} m en surcharge déclarée). 
                              {hasHighGap 
                                ? " L'écart dépasse le seuil critique toléré de 5%. Une dérive de déclaration ou un problème de sur-mesure au chantier est à suspecter." 
                                : " L'écart est parfaitement sous contrôle. Les déclarations chantiers concordent de manière fiable avec le relevé officiel."}
                            </p>
                          </div>

                          <div className="space-y-1.5">
                            <h4 className="text-[10px] font-black uppercase text-slate-700 tracking-wider">Plan d'action recommandé par le DT :</h4>
                            <ul className="list-disc pl-5 space-y-1 text-slate-500 text-[11px]">
                              {hasHighGap ? (
                                <>
                                  <li>Déclencher un audit de métrage inopiné sur les chantiers les plus volumineux ce mois-ci.</li>
                                  <li>Vérifier l'étalonnage des dispositifs de mesure manuels utilisés par les chefs de poste.</li>
                                  <li>Organiser une séance de recallage des tolérances de sur-profil et hors-profil avec les foreurs.</li>
                                </>
                              ) : (
                                <>
                                  <li>Poursuivre le contrôle quotidien via les fiches de poste scellées numériquement.</li>
                                  <li>Féliciter les chefs de poste pour la précision rigoureuse de leurs saisies de métrage.</li>
                                  <li>Maintenir la cadence d'avancement sans altérer la qualité des tirs.</li>
                                </>
                              )}
                            </ul>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>

              {/* Simulateur Technique de Rendement Mensuel */}
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-lg">⚙️</span>
                    <h3 className="text-slate-800 font-black text-xs uppercase tracking-wider font-sans">
                      Simulateur Technique de Rendement Mensuel
                    </h3>
                  </div>
                  
                  <p className="text-slate-500 text-[10.5px] font-medium leading-relaxed mb-4">
                    Ajustez les leviers techniques clés pour simuler instantanément la performance cumulative mensuelle théorique de la SMI.
                  </p>

                  <div className="space-y-4">
                    {/* Slider 1: Volées cibles */}
                    <div>
                      <div className="flex justify-between text-[10.5px] font-bold text-slate-700 mb-1.5">
                        <span>Nombre de volées mensuelles (Tirs)</span>
                        <span className="text-[#b8860b] font-black">{simVolees} tirs</span>
                      </div>
                      <input 
                        type="range" 
                        min="50" 
                        max="250" 
                        value={simVolees} 
                        onChange={(e) => setSimVolees(Number(e.target.value))}
                        className="w-full accent-[#b8860b] h-1.5 bg-slate-100 rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* Slider 2: Longueur de volée */}
                    <div>
                      <div className="flex justify-between text-[10.5px] font-bold text-slate-700 mb-1.5">
                        <span>Longueur moyenne de maille (Longueur forée)</span>
                        <span className="text-[#b8860b] font-black">{simLongueur.toFixed(1)} m</span>
                      </div>
                      <input 
                        type="range" 
                        min="2.0" 
                        max="4.0" 
                        step="0.1"
                        value={simLongueur} 
                        onChange={(e) => setSimLongueur(Number(e.target.value))}
                        className="w-full accent-[#b8860b] h-1.5 bg-slate-100 rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* Slider 3: Taux de réussite de volée */}
                    <div>
                      <div className="flex justify-between text-[10.5px] font-bold text-slate-700 mb-1.5">
                        <span>Taux de réussite de volée (Efficacité d'avancement)</span>
                        <span className="text-[#b8860b] font-black">{simSucces}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="60" 
                        max="100" 
                        value={simSucces} 
                        onChange={(e) => setSimSucces(Number(e.target.value))}
                        className="w-full accent-[#b8860b] h-1.5 bg-slate-100 rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* Slider 4: Charge explosive */}
                    <div>
                      <div className="flex justify-between text-[10.5px] font-bold text-slate-700 mb-1.5">
                        <span>Facteur de Charge Explosive Standard Target</span>
                        <span className="text-[#b8860b] font-black">{simChargeTarget} kg/m</span>
                      </div>
                      <input 
                        type="range" 
                        min="15" 
                        max="35" 
                        value={simChargeTarget} 
                        onChange={(e) => setSimChargeTarget(Number(e.target.value))}
                        className="w-full accent-[#b8860b] h-1.5 bg-slate-100 rounded-lg cursor-pointer"
                      />
                    </div>
                  </div>

                  {/* Résultat des calculs prédictifs */}
                  <div className="mt-6 pt-5 border-t border-slate-100 grid grid-cols-2 gap-4 font-sans">
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-center">
                      <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider">Avancement Prédictif</p>
                      <p className="text-xl font-black text-[#b8860b] mt-1">
                        {((simVolees * simLongueur) * (simSucces / 100)).toFixed(1)} m
                      </p>
                      <p className="text-[8px] text-slate-500 mt-0.5 font-medium">Mètres cumulés théoriques</p>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-center">
                      <p className="text-[9px] text-slate-400 font-black uppercase tracking-wider">Volume Explosifs Requis</p>
                      <p className="text-xl font-black text-rose-600 mt-1">
                        {(((simVolees * simLongueur) * (simSucces / 100)) * simChargeTarget).toFixed(0)} kg
                      </p>
                      <p className="text-[8px] text-slate-500 mt-0.5 font-medium">Consommation ANFO requise</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
