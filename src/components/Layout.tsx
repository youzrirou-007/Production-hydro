import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BarChart3, 
  Settings, 
  Users, 
  HardHat, 
  Truck, 
  AlertTriangle, 
  Search, 
  LineChart, 
  Layers,
  LogOut,
  ChevronRight,
  Menu,
  X,
  ChevronsLeft,
  ChevronsRight,
  Factory,
  Database,
  ShieldCheck,
  Sparkles,
  Brain,
  Plus,
  MapPin,
  Calendar,
  RefreshCw,
  Gauge,
  Activity,
  Wrench,
  Mail,
  AlertCircle,
  CheckCircle2,
  Crown,
  Hammer,
  GraduationCap,
  FileText,
  TrendingUp
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSite } from '../contexts/SiteContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, getDoc, collection, collectionGroup, query, where, onSnapshot, updateDoc, orderBy } from 'firebase/firestore';
import { format } from 'date-fns';
import { getUpcomingSaturday } from '../lib/rotation';
import logoImg from '../assets/images/hydromines_logo_1781337889277.jpg';
import loginBgImg from '../assets/images/login-background-smi.jpg';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  roles?: string[];
  category: 'direction' | 'production' | 'ingenierie' | 'analyse' | 'admin';
}

const NAV_ITEMS: NavItem[] = [
  // DIRECTION
  {
    id: 'espace_dt',
    label: 'Espace Directeur Technique',
    icon: <Crown className="w-5 h-5" />,
    roles: ['admin', 'direction_technique'],
    category: 'direction'
  },

  // OPÉRATIONS CHANTIER
  { id: 'production', label: 'Registre Journalier', icon: <Plus className="w-5 h-5" />, category: 'production' },
  { id: 'chantiers', label: 'Chantiers', icon: <MapPin className="w-5 h-5" />, category: 'production' },
  { id: 'planning', label: 'Planification', icon: <Calendar className="w-5 h-5" />, category: 'production' },
  { id: 'rotation', label: 'Changement de Poste', icon: <RefreshCw className="w-5 h-5" />, category: 'production' },
  { id: 'explications', label: 'Explications', icon: <AlertTriangle className="w-5 h-5" />, category: 'production' },
  
  // INGÉNIERIE & RÈGLEMENTS
  { id: 'technique', label: 'Technique Minière', icon: <Wrench className="w-5 h-5" />, category: 'ingenierie' },
  {
    id: 'mineur_parfait',
    label: 'Le Mineur Parfait',
    icon: <HardHat className="w-5 h-5" />,
    category: 'production'
  },
  { id: 'messages', label: 'Messages & Directives', icon: <Mail className="w-5 h-5" />, category: 'ingenierie' },
  { id: '/volées-ratées', label: 'Volées Ratées', icon: <AlertTriangle className="w-5 h-5" />, category: 'ingenierie' },
  { id: '/tutoriel', label: 'Tutoriel', icon: <GraduationCap className="w-5 h-5" />, category: 'ingenierie' },
  
  // ANALYSE & PERFORMANCE
  { id: 'daily_report', label: 'Rapport Consolidé', icon: <FileText className="w-5 h-5" />, category: 'analyse' },
  { id: 'analytics', label: 'Analytique', icon: <BarChart3 className="w-5 h-5" />, category: 'analyse' },
  { id: 'analyse_strategie', label: 'Pilotage & Stratégie', icon: <Activity className="w-5 h-5" />, category: 'analyse' },
  { id: 'analyse_terrain', label: 'Performance Terrain', icon: <TrendingUp className="w-5 h-5" />, category: 'analyse' },
  { id: 'analyse_rh', label: 'Ressources Humaines', icon: <HardHat className="w-5 h-5" />, category: 'analyse' },
  { id: 'analyse_logistique', label: 'Matériel & Historiques', icon: <Database className="w-5 h-5" />, category: 'analyse' },
  { id: 'boulonnage', label: 'Suivi Boulonnage', icon: <Hammer className="w-5 h-5" />, category: 'analyse' },

  // ADMIN
  { id: 'admin', label: 'Administration', icon: <Users className="w-5 h-5" />, roles: ['admin'], category: 'admin' },
  { id: 'configuration', label: 'Configuration', icon: <Settings className="w-5 h-5" />, roles: ['admin', 'direction', 'chief', 'responsible', 'secretary', 'direction_technique'], category: 'admin' },
];

const prefetchPage = (id: string) => {
  switch (id) {
    case 'production':
      import('../pages/Production');
      break;
    case 'planning':
      import('../pages/Planning');
      break;
    case 'daily_report':
      import('../pages/DailyReport');
      break;
    case 'admin':
      import('../pages/Admin');
      break;
    case 'chantiers':
      import('../pages/Chantiers');
      break;
    case 'rotation':
      import('../pages/RotationPoste');
      break;
    case 'analyse_strategie':
    case 'analyse_terrain':
    case 'analyse_rh':
    case 'analyse_logistique':
    case 'analyse_dashboard':
      import('../pages/AnalyseDashboard');
      break;
    case 'analytics':
      import('../pages/Analytics');
      break;
    case 'messages':
      import('../pages/Messages');
      break;
    case 'explication_non_realise':
    case 'explications':
      import('../pages/ExplicationNonRealise');
      break;
    case 'technique':
      import('../pages/TechniqueMiniere');
      break;
    case 'mineur_parfait':
      import('../pages/MineurParfait');
      break;
    case 'espace_dt':
      import('../pages/EspaceDT');
      break;
    case 'boulonnage':
      import('../pages/Boulonnage');
      break;
    case 'failed_blasts':
    case '/volées-ratées':
      import('../pages/FailedBlasts');
      break;
    case 'configuration':
      import('../pages/Configuration');
      break;
    case 'tutoriel':
    case '/tutoriel':
      import('../pages/Tutoriel');
      break;
    default:
      break;
  }
};

export const Layout: React.FC<{ 
  activeTab: string; 
  setActiveTab: (tab: string) => void;
  children: React.ReactNode;
}> = ({ activeTab, setActiveTab, children }) => {
  const { user, profile, loading, signIn, logout } = useAuth();
  const { activeSiteId, setActiveSiteId, siteConfig } = useSite();
  const accessibleSites = profile?.siteIds && profile.siteIds.length > 0
    ? profile.siteIds
    : ['SMI'];

  const STORAGE_KEY = 'hydromines_active_site';

  React.useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && accessibleSites.includes(saved)) {
      setActiveSiteId(saved);
    }
  }, [accessibleSites.join(',')]);

  React.useEffect(() => {
    localStorage.setItem(STORAGE_KEY, activeSiteId);
  }, [activeSiteId]);

  const [isOpen, setIsOpen] = React.useState(false);
  const [rotationPending, setRotationPending] = React.useState(false);
  const [hasPendingRequests, setHasPendingRequests] = React.useState(false);
  const [unexplainedCount, setUnexplainedCount] = React.useState(0);
  const [hoveredItem, setHoveredItem] = React.useState<{ label: string; top: number } | null>(null);

  const [introPhase, setIntroPhase] = React.useState<'drop' | 'splash' | 'assemble' | 'reveal' | 'arch' | 'text' | 'done'>('drop');
  const [bgLoaded, setBgLoaded] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const img = new Image();
      img.src = loginBgImg;
      img.onload = () => setBgLoaded(true);
      // Fallback in case of caching or error
      img.onerror = () => setBgLoaded(true);
    }
  }, []);

  React.useEffect(() => {
    if (user) {
      setIntroPhase('done');
      return;
    }
    const sequence: { phase: typeof introPhase; delay: number }[] = [
      { phase: 'splash', delay: 700 },
      { phase: 'assemble', delay: 1500 },
      { phase: 'reveal', delay: 2700 },
      { phase: 'arch', delay: 3400 },
      { phase: 'text', delay: 3800 },
      { phase: 'done', delay: 4400 }
    ];
    const timers = sequence.map(s =>
      setTimeout(() => setIntroPhase(s.phase), s.delay)
    );
    return () => timers.forEach(clearTimeout);
  }, [user]);

  // Unread alerts (System messages) states
  const [unreadAlerts, setUnreadAlerts] = React.useState<any[]>([]);
  const [activeAlert, setActiveAlert] = React.useState<any | null>(null);
  const [alertReply, setAlertReply] = React.useState('');
  const prevAlertReplyRef = React.useRef('');
  const [alertDeletedDrafts, setAlertDeletedDrafts] = React.useState<string[]>([]);
  const [alertKeystrokes, setAlertKeystrokes] = React.useState(0);
  const [submittingAlertReply, setSubmittingAlertReply] = React.useState(false);

  // Listen to unread critical or standard alerts in real-time
  React.useEffect(() => {
    if (!user || !profile) return;
    
    const q = query(collection(db, 'system_messages'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const emailKey = user.email?.replace(/\./g, '_') || '';
      const unreadList: any[] = [];
      
      snapshot.forEach((doc) => {
        const msg = { id: doc.id, ...doc.data() } as any;
        
        // Match target criteria
        const matchesRole = msg.targetRole === 'all' || msg.targetRole === profile.role;
        const matchesEmail = !msg.targetUserEmail || msg.targetUserEmail.toLowerCase().trim() === user.email?.toLowerCase().trim();
        const isNotRead = !msg.reads || !msg.reads[emailKey];
        
        if (matchesRole && matchesEmail && isNotRead) {
          unreadList.push(msg);
        }
      });
      
      setUnreadAlerts(unreadList);
      
      // Auto-open alert if none is active
      if (unreadList.length > 0) {
        // Prioritize critical urgency alerts
        const critical = unreadList.find(m => m.urgency === 'critical');
        setActiveAlert(critical || unreadList[0]);
      } else {
        setActiveAlert(null);
      }
    }, (err) => {
      console.warn("Unread system messages listener warning:", err);
    });
    
    return () => unsub();
  }, [user, profile]);

  // Keystroke telemetry draft tracker for in-app alert popup
  React.useEffect(() => {
    if (!activeAlert) return;
    
    const prev = prevAlertReplyRef.current;
    if (alertReply === prev) return;
    
    setAlertKeystrokes(k => k + 1);
    
    if (prev.length > alertReply.length) {
      const diffLength = prev.length - alertReply.length;
      let deletedPart = '';
      if (prev.startsWith(alertReply)) {
        deletedPart = prev.substring(alertReply.length);
      } else if (prev.endsWith(alertReply)) {
        deletedPart = prev.substring(0, diffLength);
      } else {
        let firstDiff = 0;
        while (firstDiff < alertReply.length && prev[firstDiff] === alertReply[firstDiff]) {
          firstDiff++;
        }
        deletedPart = prev.substring(firstDiff, firstDiff + diffLength);
      }
      
      const trimmed = deletedPart.trim();
      if (trimmed.length > 2) {
        setAlertDeletedDrafts(prevList => {
          if (!prevList.includes(trimmed)) return [...prevList, trimmed];
          return prevList;
        });
      }
    }
    
    prevAlertReplyRef.current = alertReply;
    
    // Live telemetry sync to Firestore for active draft
    const emailKey = user?.email?.replace(/\./g, '_') || '';
    const delayTimer = setTimeout(() => {
      if (!activeAlert.reads?.[emailKey]?.response) {
        const msgRef = doc(db, 'system_messages', activeAlert.id);
        const readAt = activeAlert.reads?.[emailKey]?.readAt || new Date().toISOString();
        const delaySeconds = activeAlert.reads?.[emailKey]?.delaySeconds || 0;
        
        updateDoc(msgRef, {
          [`reads.${emailKey}`]: {
            userEmail: user?.email || '',
            userName: profile?.nom ? `${profile.prenom} ${profile.nom}` : user?.displayName || 'Utilisateur',
            userRole: profile?.role || 'operator',
            readAt,
            delaySeconds,
            lastActiveDraft: alertReply,
            deletedDrafts: alertDeletedDrafts,
            totalKeystrokes: alertKeystrokes + 1
          }
        }).catch(err => console.warn("Live popup telemetry warning ignored:", err));
      }
    }, 1500);
    
    return () => clearTimeout(delayTimer);
  }, [alertReply, activeAlert]);

  // Handle acknowledging the popup alert
  const handleAcknowledgeAlert = async () => {
    if (!activeAlert) return;
    setSubmittingAlertReply(true);
    
    try {
      const emailKey = user?.email?.replace(/\./g, '_') || '';
      const msgRef = doc(db, 'system_messages', activeAlert.id);
      const now = new Date();
      
      let delaySecs = 0;
      if (activeAlert.createdAt) {
        const createdTime = activeAlert.createdAt.seconds 
          ? new Date(activeAlert.createdAt.seconds * 1000) 
          : new Date(activeAlert.createdAt);
        delaySecs = Math.max(0, Math.floor((now.getTime() - createdTime.getTime()) / 1000));
      }
      
      const updateData: any = {
        [`reads.${emailKey}.userEmail`]: user?.email || '',
        [`reads.${emailKey}.userName`]: profile?.nom ? `${profile.prenom} ${profile.nom}` : user?.displayName || 'Utilisateur',
        [`reads.${emailKey}.userRole`]: profile?.role || 'operator',
        [`reads.${emailKey}.readAt`]: now.toISOString(),
        [`reads.${emailKey}.delaySeconds`]: delaySecs,
        [`reads.${emailKey}.deletedDrafts`]: alertDeletedDrafts,
        [`reads.${emailKey}.totalKeystrokes`]: alertKeystrokes,
        [`reads.${emailKey}.finalizedAt`]: now.toISOString()
      };
      
      if (alertReply.trim()) {
        updateData[`reads.${emailKey}.response`] = alertReply.trim();
      }
      
      await updateDoc(msgRef, updateData);
      
      // Clear alert states
      setAlertReply('');
      prevAlertReplyRef.current = '';
      setAlertDeletedDrafts([]);
      setAlertKeystrokes(0);
      setActiveAlert(null);
      setSubmittingAlertReply(false);
    } catch (err) {
      setSubmittingAlertReply(false);
      console.error("Error acknowledging critical alert:", err);
    }
  };

  React.useEffect(() => {
    if (!user) {
      setUnexplainedCount(0);
      return;
    }
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    const startStr = format(startOfMonth, 'yyyy-MM-dd');
    const endStr = format(endOfMonth, 'yyyy-MM-dd');
    
    const q = query(
      collection(db, 'non_realisation_explanations'),
      where('status', '==', 'pending')
    );
    
    const unsub = onSnapshot(q, (snap) => {
      const filtered = snap.docs.filter(d => {
        const data = d.data();
        return data.date >= startStr && data.date <= endStr;
      });
      setUnexplainedCount(filtered.length);
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'non_realisation_explanations');
    });
    
    return () => unsub();
  }, [user]);

  React.useEffect(() => {
    if (!user || !profile || profile.role !== 'admin') {
      setHasPendingRequests(false);
      return;
    }
    const qReqs = query(collectionGroup(db, 'modification_requests'), where('status', '==', 'pending'));
    const unsub = onSnapshot(qReqs, (snap) => {
      setHasPendingRequests(!snap.empty);
    }, (err) => {
      console.warn("Permission logs on collectionGroup modification_requests:", err);
    });
    return () => unsub();
  }, [user, profile]);

  React.useEffect(() => {
    if (!user) return;
    const isSaturday = new Date().getDay() === 6;
    if (!isSaturday) {
      setRotationPending(false);
      return;
    }

    const checkRotation = async () => {
      try {
        const saturdayStr = getUpcomingSaturday();
        const docRef = doc(db, 'rotations_history', saturdayStr);
        const docSnap = await getDoc(docRef);
        setRotationPending(!docSnap.exists());
      } catch (err) {
        console.error("Error checking rotation_history in Layout:", err);
      }
    };

    checkRotation();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex flex-col items-center justify-center gap-4">
        <div className="animate-spin w-10 h-10 border-4 border-[#1a5276] border-t-[#ffd700] rounded-full" />
        <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">
          Chargement de l'application...
        </span>
      </div>
    );
  }

  if (!user) {
    return (
      <div 
        className="min-h-screen w-full relative overflow-hidden flex items-center justify-center animate-fade-in"
        style={{ background: 'radial-gradient(circle at center, #1b354a 0%, #0c1822 100%)' }}
      >
        {/* Full-screen Background with Golden Hour Atmosphere & Dust Particles */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: (bgLoaded && (introPhase === 'reveal' || introPhase === 'arch' || introPhase === 'text' || introPhase === 'done')) ? 1 : 0 }}
          transition={{ duration: 1.4, ease: 'easeOut' }}
          className="fixed inset-0 w-full h-full z-0 bg-cover bg-center overflow-hidden"
          style={{ backgroundImage: `url(${loginBgImg})` }}
        >
          {/* Professional Camera High-Definition Adjustment & Sun-drenched Luminous Tint */}
          <div className="absolute inset-0 bg-gradient-to-tr from-amber-500/5 via-transparent to-white/10 backdrop-brightness-[1.28] backdrop-contrast-[1.12] backdrop-saturate-[1.3]" />
          
          {/* Subtle warm ambient dust/particle layer */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-30">
            <div className="absolute top-[-50%] left-[-50%] right-[-50%] bottom-[-50%] bg-[radial-gradient(circle_at_center,_rgba(255,215,0,0.18)_1.5px,_transparent_1.5px)] bg-[length:24px_24px] animate-[pulse_6s_infinite_ease-in-out]" />
          </div>
          
          {/* High-end linear shadow gradient overlay for text legibility */}
          <div className="absolute inset-0 bg-gradient-to-tr from-slate-950/80 via-slate-900/35 to-transparent" />
        </motion.div>

        {/* Dynamic bottom-left text (Typography pair with custom colors) */}
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          animate={{
            opacity: (introPhase === 'text' || introPhase === 'done') ? 1 : 0,
            y: (introPhase === 'text' || introPhase === 'done') ? 0 : 35
          }}
          transition={{ type: 'spring', stiffness: 90, damping: 15 }}
          className="absolute bottom-12 left-10 md:left-16 lg:left-24 z-10 max-w-2xl select-none"
        >
          <div className="flex flex-col gap-0.5">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tighter leading-none text-white drop-shadow-xl mt-1.5">
              <span className="text-[#00A0E3]">HYDRO</span>
              <span className="text-[#8B1A1A]">MINES</span>
            </h1>
            
            <div className="h-1 w-24 bg-gradient-to-r from-[#00A0E3] to-[#8B1A1A] rounded-full my-3" />
            
            <p className="text-xs md:text-sm font-extrabold text-slate-100 tracking-wider uppercase drop-shadow-md">
              Système de Commandement de la Production
            </p>
            <p className="text-[10px] text-slate-300/80 font-medium tracking-wider mt-1 max-w-sm drop-shadow-md uppercase">
              Abattage, géologie & chantiers actifs SMI Imiter.
            </p>
          </div>
        </motion.div>

        {/* Floating Pure White form aligned on the right */}
        <div className="absolute right-6 md:right-16 lg:right-24 top-1/2 -translate-y-1/2 z-10 w-full max-w-sm p-4">
          <motion.div
            initial={{ opacity: 0, x: 50, scale: 0.95 }}
            animate={{
              opacity: introPhase === 'done' ? 1 : 0,
              x: introPhase === 'done' ? 0 : 50,
              scale: introPhase === 'done' ? 1 : 0.95,
            }}
            transition={{ type: 'spring', stiffness: 100, damping: 16 }}
            className="w-full bg-white border border-slate-100 rounded-3xl p-8 shadow-2xl relative overflow-hidden"
          >
            {/* Elegant multi-brand border stripe */}
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#00A0E3] via-[#ffd700] to-[#8B1A1A]" />
            
            {/* Visual internal gradient overlays to enrich the form look */}
            <div className="absolute -top-12 -right-12 w-32 h-32 bg-[#00A0E3]/5 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-[#8B1A1A]/5 rounded-full blur-2xl pointer-events-none" />

            <div className="flex justify-center mb-6">
              <img
                src={logoImg}
                alt="SMI Logo"
                className="h-16 w-auto object-contain rounded-xl shadow-md"
              />
            </div>

            <div className="text-center mb-8">
              <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginBottom: 8 }}>
                <span style={{ color: '#00A0E3', fontWeight: 900, fontSize: 20, letterSpacing: '0.05em' }}>
                  HYDRO
                </span>
                <span style={{ color: '#8B1A1A', fontWeight: 900, fontSize: 20, letterSpacing: '0.05em' }}>
                  MINES
                </span>
              </div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Suivi & Gestion des Opérations Minières
              </p>
            </div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <button
                onClick={signIn}
                className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-[#1a5276] to-[#154360] hover:from-[#154360] hover:to-[#0f3147] text-white font-black uppercase text-xs tracking-wider py-4 px-6 rounded-2xl transition-all duration-300 shadow-lg hover:shadow-xl cursor-pointer"
                style={{
                  boxShadow: '0 4px 15px rgba(26,82,118,0.2)'
                }}
              >
                <div className="bg-white p-1 rounded-lg shadow-sm">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                  </svg>
                </div>
                <span>Se connecter avec Google</span>
              </button>
            </motion.div>

            <div className="mt-8 text-center border-t border-slate-200/50 pt-6">
              <span className="inline-block px-2.5 py-0.5 bg-red-50 border border-red-100 rounded-full text-[8px] font-black text-red-500 uppercase tracking-widest">
                Réseau SMI Intranet Sécurisé
              </span>
              <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-2">
                Accès réservé exclusivement au personnel habilité
              </p>
            </div>
          </motion.div>
        </div>

        {/* Cinematic Assembly Intro Overlay with White/Light Radial Background */}
        <AnimatePresence>
          {introPhase !== 'done' && (
            <motion.div
              className="fixed inset-0 z-[100] flex items-center justify-center pointer-events-none overflow-hidden"
              style={{ background: 'radial-gradient(circle at center, #ffffff 0%, #f8fafc 100%)' }}
              initial={{ opacity: 1 }}
              animate={{
                opacity: (introPhase === 'reveal' || introPhase === 'arch' || introPhase === 'text') ? 0 : 1
              }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: 'easeInOut' }}
            >
              {/* FALLING DROPLET PHASE */}
              {introPhase === 'drop' && (
                <motion.div
                  initial={{ y: -350, scale: 0.6, opacity: 0 }}
                  animate={{ y: 0, scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15, duration: 0.8 }}
                  style={{
                    width: 48,
                    height: 64,
                    background: 'linear-gradient(180deg, #00A0E3 0%, #0077B6 100%)',
                    borderRadius: '50% 50% 50% 0',
                    transform: 'rotate(45deg)',
                    boxShadow: '0 0 50px rgba(0,160,227,0.8)',
                    position: 'absolute',
                  }}
                />
              )}

              {/* WATER SPLASH & DARK RED/SKY BLUE EXPLOSION PHASE */}
              {introPhase === 'splash' && (
                <>
                  <motion.div
                    className="absolute rounded-full"
                    style={{
                      border: '3px solid #8B1A1A',
                      width: 30,
                      height: 30,
                      boxShadow: '0 0 30px rgba(139,26,26,0.6)',
                    }}
                    initial={{ scale: 0, opacity: 1 }}
                    animate={{ scale: 28, opacity: 0 }}
                    transition={{ duration: 1.0, ease: 'easeOut' }}
                  />
                  <motion.div
                    className="absolute rounded-full"
                    style={{
                      border: '2px solid #00A0E3',
                      width: 30,
                      height: 30,
                      boxShadow: '0 0 20px rgba(0,160,227,0.4)',
                    }}
                    initial={{ scale: 0, opacity: 0.8 }}
                    animate={{ scale: 18, opacity: 0 }}
                    transition={{ duration: 1.2, delay: 0.15, ease: 'easeOut' }}
                  />
                </>
              )}

              {/* LOGO PIECES ASSEMBLY PHASE (With custom crown, subtitle, celestial stars, larger logo, and absolute design precision) */}
              {introPhase === 'assemble' && (
                <div className="relative w-96 h-[400px] flex items-center justify-center">
                  
                  {/* Elegant Twinkling Stars ONLY during logo display */}
                  <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    {[...Array(14)].map((_, i) => {
                      const size = i % 3 === 0 ? 14 : i % 2 === 0 ? 9 : 6;
                      const initialRotation = i * 45;
                      return (
                        <motion.div
                          key={i}
                          className="absolute rounded-full flex items-center justify-center select-none"
                          style={{
                            top: `${(i * 23) % 75 + 12}%`,
                            left: `${(i * 19) % 75 + 12}%`,
                            color: i % 3 === 0 ? '#00A0E3' : i % 2 === 0 ? '#8B1A1A' : '#FFF2B2',
                            fontSize: size,
                            filter: 'drop-shadow(0 0 4px rgba(0, 0, 0, 0.1))',
                          }}
                          initial={{ opacity: 0, scale: 0, rotate: initialRotation }}
                          animate={{
                            opacity: [0, 1, 0.4, 1, 0],
                            scale: [0.3, 1.2, 0.7, 1.2, 0.3],
                            rotate: initialRotation + 360,
                            y: [-6, 6, -6],
                          }}
                          transition={{
                            duration: 3.0 + (i % 2),
                            repeat: Infinity,
                            ease: 'easeInOut',
                            delay: i * 0.08,
                          }}
                        >
                          ✦
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Golden Crown sitting perfectly above the logo - Enters from top with bouncing motion */}
                  <motion.div
                    style={{
                      position: 'absolute',
                      top: 10,
                      zIndex: 20,
                    }}
                    initial={{ y: -180, opacity: 0, scale: 0.3, rotate: -15 }}
                    animate={{ y: 0, opacity: 1, scale: 1, rotate: 0 }}
                    transition={{
                      type: 'spring',
                      stiffness: 85,
                      damping: 12,
                      delay: 0.55,
                    }}
                  >
                    <svg viewBox="0 0 100 60" className="w-16 h-12 drop-shadow-[0_4px_6px_rgba(0,0,0,0.12)]">
                      <defs>
                        <linearGradient id="crownGold" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#FFF2B2" />
                          <stop offset="50%" stopColor="#D4AF37" />
                          <stop offset="100%" stopColor="#AA7C11" />
                        </linearGradient>
                      </defs>
                      <path
                        d="M 15 50 
                           L 10 23 
                           L 32 36 
                           L 50 12 
                           L 68 36 
                           L 90 23 
                           L 85 50 
                           Z"
                        fill="url(#crownGold)"
                      />
                      <rect x="15" y="50" width="70" height="6" rx="3" fill="url(#crownGold)" />
                      {/* Detailed Gemstones matching brand colors */}
                      <circle cx="10" cy="20" r="3.2" fill="#FFFFFF" />
                      <circle cx="32" cy="33" r="2.2" fill="#00A0E3" />
                      <circle cx="50" cy="9" r="4.0" fill="#8B1A1A" />
                      <circle cx="68" cy="33" r="2.2" fill="#00A0E3" />
                      <circle cx="90" cy="20" r="3.2" fill="#FFFFFF" />
                      <circle cx="28" cy="53" r="1.6" fill="#8B1A1A" />
                      <circle cx="50" cy="53" r="2.0" fill="#FFFFFF" />
                      <circle cx="72" cy="53" r="1.6" fill="#00A0E3" />
                    </svg>
                  </motion.div>

                  {/* Left Fragment of real Logo image (Agrandit & clean without blue shadow glow) */}
                  <motion.img
                    src={logoImg}
                    alt="Logo Fragment Left"
                    style={{
                      position: 'absolute',
                      width: 210,
                      height: 210,
                      objectFit: 'contain',
                      clipPath: 'polygon(0 0, 50% 0, 50% 100%, 0 100%)',
                      top: 75,
                    }}
                    initial={{ x: -240, opacity: 0, rotate: -270, scale: 0.5 }}
                    animate={{ x: 0, opacity: 1, rotate: 0, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 75, damping: 13, duration: 1.3 }}
                  />

                  {/* Right Fragment of real Logo image (Agrandit & clean without blue shadow glow) */}
                  <motion.img
                    src={logoImg}
                    alt="Logo Fragment Right"
                    style={{
                      position: 'absolute',
                      width: 210,
                      height: 210,
                      objectFit: 'contain',
                      clipPath: 'polygon(50% 0, 100% 0, 100% 100%, 50% 100%)',
                      top: 75,
                    }}
                    initial={{ x: 240, opacity: 0, rotate: 270, scale: 0.5 }}
                    animate={{ x: 0, opacity: 1, rotate: 0, scale: 1 }}
                    transition={{ type: 'spring', stiffness: 75, damping: 13, duration: 1.3 }}
                  />

                  {/* Shimmer sweep effect */}
                  <motion.div
                    className="absolute inset-x-0 h-[210px] bg-gradient-to-r from-transparent via-white/50 to-transparent pointer-events-none"
                    style={{ mixBlendMode: 'overlay', transform: 'skewX(-25deg)', top: 75 }}
                    initial={{ x: '-150%' }}
                    animate={{ x: '150%' }}
                    transition={{ delay: 1.2, duration: 1.0, ease: 'easeInOut' }}
                  />

                  {/* Elegant dynamic Subtitle: Mines - Eau - Environnement */}
                  <motion.div
                    style={{
                      position: 'absolute',
                      bottom: 35,
                    }}
                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{
                      type: 'spring',
                      stiffness: 90,
                      damping: 14,
                      delay: 0.9,
                    }}
                    className="text-center"
                  >
                    <span className="text-sm font-extrabold tracking-[0.25em] bg-gradient-to-r from-[#00A0E3] via-slate-600 to-[#8B1A1A] bg-clip-text text-transparent uppercase select-none">
                      Mines • Eau • Environnement
                    </span>
                  </motion.div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  // Intercept banned/suspended users
  const isBanned = profile && (
    (profile as any).bannedPermanently || 
    ((profile as any).bannedUntil && new Date((profile as any).bannedUntil) > new Date())
  );

  if (isBanned) {
    const isPermanent = (profile as any).bannedPermanently;
    const banUntilDate = (profile as any).bannedUntil ? new Date((profile as any).bannedUntil) : null;
    const banReason = (profile as any).banReason || 'Infraction aux consignes de sécurité SMI ou suspension par la direction';

    return (
      <div className="min-h-screen bg-[#0d0707] flex items-center justify-center p-4 selection:bg-red-900/40">
        <div className="w-full max-w-md bg-zinc-950 border border-red-950 rounded-3xl p-8 shadow-[0_0_50px_rgba(239,68,68,0.15)] text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-red-600 via-rose-500 to-red-600 animate-pulse" />
          
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-red-950/20 border border-red-500/30 rounded-full">
              <AlertTriangle className="w-12 h-12 text-red-500" />
            </div>
          </div>
          
          <h2 className="text-xl font-black text-red-400 uppercase tracking-tight mb-1">
            Accès Suspendu
          </h2>
          <p className="text-[10px] font-black text-red-500/70 uppercase tracking-widest mb-6">
            Sécurité & Administration SMI HydroMines
          </p>

          <div className="bg-red-950/10 border border-red-500/20 rounded-2xl p-5 mb-8 text-left space-y-4">
            <div className="space-y-1">
              <span className="text-[9px] font-black uppercase text-red-400 tracking-wider">Statut de votre compte</span>
              <p className="text-xs font-bold text-zinc-300 uppercase">
                {isPermanent ? "Désactivation définitive" : "Suspension temporaire d'accès"}
              </p>
            </div>

            {!isPermanent && banUntilDate && (
              <div className="space-y-1">
                <span className="text-[9px] font-black uppercase text-red-400 tracking-wider">Fin de la suspension</span>
                <p className="text-xs font-black text-zinc-100">
                  {banUntilDate.toLocaleString('fr-FR', { 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric', 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </p>
              </div>
            )}

            <div className="space-y-1">
              <span className="text-[9px] font-black uppercase text-red-400 tracking-wider">Motif de la décision</span>
              <p className="text-xs font-semibold text-zinc-400 italic">
                "{banReason}"
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 bg-red-950/40 hover:bg-red-900/30 border border-red-500/30 text-red-200 font-black uppercase text-xs tracking-wider py-3.5 px-6 rounded-2xl transition-all duration-300 shadow-lg cursor-pointer"
          >
            Se déconnecter
          </button>
        </div>
      </div>
    );
  }

  const filteredNav = NAV_ITEMS.filter(item => 
    !item.roles || (profile && item.roles.includes(profile.role))
  );

  const categories = [
    { id: 'direction', label: 'Direction' },
    { id: 'production', label: 'Opérations Chantier' },
    { id: 'ingenierie', label: 'Ingénierie & Consignes' },
    { id: 'analyse', label: 'Analyses & Performance' },
    { id: 'admin', label: 'Administration' },
  ];

  return (
    <div className="flex h-screen bg-[#FAFAF9] font-sans selection:bg-[#b8860b]/20">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ 
          width: isOpen ? 260 : 72,
          borderRightWidth: 1
        }}
        className="bg-white border-[#141414]/10 flex flex-col z-50 overflow-hidden relative shadow-[4px_0_30px_rgba(255,255,255,1)]"
      >
        <div className={cn(
          "border-b border-[#141414]/10 flex items-center justify-between gap-2.5",
          isOpen ? "p-4" : "p-3 justify-center"
        )}>
          <div className="flex items-center gap-2.5">
            <img 
              src={logoImg} 
              alt="HydroMines logo" 
              className={cn(
                "object-contain rounded-lg shrink-0 transition-all duration-300",
                isOpen ? "w-[72px] h-[72px]" : "w-10 h-10"
              )} 
              referrerPolicy="no-referrer" 
            />
            {isOpen && (
              <div className="flex flex-col">
                <h1 className="text-sm font-black tracking-tighter leading-none uppercase animate-fade-in">
                  <span className="text-[#00BFFF]">Hydro</span>
                  <span className="text-[#8B0000]">Mines</span>
                </h1>
              </div>
            )}
          </div>
          {isOpen && (
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 hover:bg-slate-100 text-slate-500 hover:text-[#8B0000] rounded-lg transition-all duration-300 hover:scale-110 active:scale-95 flex items-center justify-center border border-slate-200/50 hover:border-[#8B0000]/20 shadow-sm"
              title="Réduire le menu"
            >
              <ChevronsLeft className="w-4.5 h-4.5 stroke-[2.5]" />
            </button>
          )}
        </div>

        <nav className={cn(
          "flex-1 py-4 space-y-6 overflow-y-auto custom-scrollbar",
          isOpen ? "px-4" : "px-2"
        )}>
          {categories.map(cat => {
            const items = filteredNav.filter(item => item.category === cat.id);
            if (items.length === 0) return null;
            return (
              <div key={cat.id} className="space-y-1">
                {isOpen && cat.label && (
                  <p className="px-3 text-[8px] font-black uppercase tracking-[0.25em] text-[#141414]/40 mb-2">
                    {cat.label}
                  </p>
                )}
                {items.map((item) => {
                  const isActive = activeTab === item.id;
                  const isEspaceDT = item.id === 'espace_dt';

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveTab(item.id);
                      }}
                      onMouseEnter={(e) => {
                        prefetchPage(item.id);
                        if (!isOpen) {
                          const rect = e.currentTarget.getBoundingClientRect();
                          setHoveredItem({
                            label: item.label,
                            top: rect.top + (rect.height / 2) - 16
                          });
                        }
                      }}
                      onMouseLeave={() => setHoveredItem(null)}
                      className={cn(
                        "w-full flex items-center rounded-none transition-all duration-300 group relative",
                        isOpen ? "overflow-hidden gap-3 px-3 py-2.5" : "justify-center p-3",
                        isEspaceDT
                          ? isActive
                            ? "bg-black text-[#ffd700] border border-[#ffd700]/50 shadow-[0_0_20px_rgba(255,215,0,0.4)] font-black"
                            : "bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-transparent border border-amber-500/10 text-amber-500 hover:text-amber-400 hover:from-amber-500/20 font-extrabold shadow-[0_0_8px_rgba(218,165,32,0.05)]"
                          : isActive
                            ? "bg-black text-white shadow-lg font-bold"
                            : "text-[#141414]/60 hover:bg-[#141414]/5 hover:text-[#141414]",
                        item.id === 'explications' && unexplainedCount > 0 && activeTab !== 'explications' && [
                          "animate-pulse",
                          "shadow-[0_0_15px_rgba(239,68,68,0.6)]",
                          "border-l-2 border-red-500",
                          "bg-red-50/10"
                        ]
                      )}
                      title={undefined}
                    >
                      <div className={cn(
                        "flex-shrink-0 transition-transform duration-300 relative",
                        isActive && "scale-110",
                        isEspaceDT && "text-[#ffd700]",
                        item.id === 'explications' && unexplainedCount > 0 && activeTab !== 'explications' && "text-red-500 animate-bounce"
                      )}>
                        {isEspaceDT ? (
                          <div className="relative flex items-center justify-center">
                            <Crown className={cn(
                              "w-5 h-5",
                              isActive ? "text-[#ffd700] drop-shadow-[0_0_8px_#ffd700]" : "text-amber-500 animate-pulse"
                            )} />
                            <span className="absolute -inset-1 bg-[#ffd700]/20 rounded-full blur-sm animate-ping duration-1000" />
                          </div>
                        ) : (
                          item.icon
                        )}
                      </div>
                      {isOpen && (
                        <span className={cn(
                          "font-bold text-[10.5px] uppercase tracking-tight flex-1 text-left",
                          isEspaceDT && (
                            isActive
                              ? "font-black bg-clip-text text-transparent bg-gradient-to-r from-[#ffd700] via-[#fcd34d] to-[#b8860b] drop-shadow-[0_1px_2px_rgba(0,0,0,0.2)] tracking-wider"
                              : "font-black text-amber-700 group-hover:text-amber-800 tracking-wider"
                          )
                        )}>
                          {item.label}
                        </span>
                      )}
                      {isEspaceDT && isOpen && (
                        <div className="ml-auto flex items-center gap-1.5">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ffd700]"></span>
                          </span>
                        </div>
                      )}
                      {item.id === 'explications' && (
                        unexplainedCount > 0 ? (
                          isOpen ? (
                            <span className="ml-auto bg-red-500 text-white text-[9px] font-extrabold rounded-full w-4 h-4 flex items-center justify-center animate-bounce">
                              {unexplainedCount}
                            </span>
                          ) : (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-extrabold rounded-full w-4 h-4 flex items-center justify-center animate-bounce">
                              {unexplainedCount}
                            </span>
                          )
                        ) : (
                          isOpen && !isEspaceDT && (
                            <span className="ml-auto bg-emerald-600 text-white text-[9px] font-extrabold rounded-full w-4 h-4 flex items-center justify-center">
                              ✓
                            </span>
                          )
                        )
                      )}
                      {item.id === 'rotation' && rotationPending && (
                        isOpen ? (
                          <span className="w-2.5 h-2.5 rounded-full bg-red-600 animate-pulse absolute right-4 top-1/2 -translate-y-1/2" />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse absolute right-1.5 top-1.5" />
                        )
                      )}
                      {item.id === 'admin' && hasPendingRequests && (
                        isOpen ? (
                          <span className="w-2.5 h-2.5 bg-red-600 border border-white rounded-full h-3 w-3 flex items-center justify-center text-[7px] text-white font-extrabold absolute right-4 top-1/2 -translate-y-1/2 animate-pulse" title="Demande en attente admin" />
                        ) : (
                          <span className="w-2 h-2 bg-red-600 border border-white rounded-full flex items-center justify-center absolute right-1.5 top-1.5 animate-pulse" title="Demande en attente admin" />
                        )
                      )}
                      {isActive && (
                        <motion.div 
                          layoutId="active-indicator"
                          className="absolute left-0 w-1.5 h-full bg-[#ffd700] shadow-[0_0_8px_#ffd700]" 
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </nav>

        <div className={cn("p-4 border-t border-[#141414]/10 space-y-2", !isOpen && "px-2 text-center")}>
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 text-[#141414]/60 hover:text-[#141414] hover:bg-slate-100 rounded-lg transition-all",
              !isOpen && "justify-center"
            )}
            title={!isOpen ? "Agrandir" : "Réduire"}
          >
            {isOpen ? (
              <ChevronsLeft className="w-5 h-5 text-slate-500 hover:text-[#8B0000] transition-colors" />
            ) : (
              <ChevronsRight className="w-5 h-5 text-[#00BFFF] hover:scale-110 transition-transform" />
            )}
            {isOpen && <span className="text-xs font-bold uppercase tracking-widest">Réduire</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-white">
        <header className="h-16 border-b border-[#141414]/10 bg-white/80 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 hover:bg-slate-50 text-[#141414] hover:text-[#00BFFF] transition-all duration-300 flex items-center justify-center rounded-lg mr-1 border border-slate-200 hover:border-[#00BFFF]/20 shadow-sm active:scale-95"
              title="Menu principal"
              id="sidebar_toggle_button"
            >
              <Menu className="w-5 h-5 text-[#00BFFF]" />
            </button>
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-[#141414]/40">
              {NAV_ITEMS.find(n => n.id === activeTab)?.label}
            </h2>
          </div>
          <div className="flex items-center gap-4">
            {accessibleSites.length === 1 ? (
              <div className="bg-slate-800 border border-slate-700 text-[#ffd700] text-[11px] font-black uppercase tracking-wider rounded-lg px-3 py-1.5">
                🏔️ {siteConfig?.name || 'SMI Imiter'}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-black uppercase tracking-wider text-slate-400">
                  🏔️ Site Actif
                </span>
                <select
                  value={activeSiteId}
                  onChange={(e) => setActiveSiteId(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-[#ffd700] text-[11px] font-black uppercase tracking-wider rounded-lg px-3 py-1.5 outline-none cursor-pointer hover:bg-slate-700 transition-colors"
                >
                  {accessibleSites.map((siteId: string) => (
                    <option key={siteId} value={siteId}>
                      {siteId === 'SMI' ? 'SMI Imiter' : siteId}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="h-6 w-px bg-slate-200" />

            <div className="flex items-center gap-3">
              <div className="hidden md:flex flex-col text-right">
                <span className="text-xs font-black text-slate-800 uppercase tracking-tight leading-none">
                  {profile?.name || user?.displayName || 'Agent HydroMines'}
                </span>
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">
                  {profile?.role === 'admin' ? 'Administrateur' : profile?.role === 'manager' ? 'Directeur' : profile?.role === 'engineer' ? 'Ingénieur Chantier' : 'Agent'}
                </span>
              </div>

              {user?.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'Avatar'}
                  className="w-8 h-8 rounded-full border border-slate-200 object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#1a5276]/10 border border-[#1a5276]/20 flex items-center justify-center text-xs font-black text-[#1a5276] uppercase">
                  {(profile?.name || user?.email || 'H').substring(0, 2).toUpperCase()}
                </div>
              )}

              <button
                onClick={logout}
                className="p-2 hover:bg-red-50 text-slate-500 hover:text-red-600 rounded-lg transition-all border border-transparent hover:border-red-200/50 shadow-xs hover:scale-105 active:scale-95 flex items-center justify-center cursor-pointer"
                title="Se déconnecter"
              >
                <LogOut className="w-4.5 h-4.5" />
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="p-4 md:p-6 max-w-full w-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Real-time In-App Notification Modal Overlay (God Level) */}
      <AnimatePresence>
        {activeAlert && (
          <div className="fixed inset-0 bg-[#141414]/75 backdrop-blur-md flex items-center justify-center z-[9999] p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white max-w-xl w-full rounded-[32px] overflow-hidden border border-[#141414]/10 shadow-2xl flex flex-col relative"
            >
              {/* Alert Header bar */}
              <div className={`p-6 text-white flex items-center justify-between ${activeAlert.urgency === 'critical' ? 'bg-gradient-to-r from-red-600 to-red-800 animate-pulse' : 'bg-[#141414]'}`}>
                <div className="flex items-center gap-3">
                  <AlertCircle className="w-6 h-6" />
                  <div>
                    <h3 className="text-xs font-black uppercase tracking-widest text-white/70">Alerte de Direction SMI</h3>
                    <h4 className="text-sm font-black uppercase tracking-tight">Consigne Technique Obligatoire</h4>
                  </div>
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 px-2.5 py-1 rounded-md">
                  {activeAlert.urgency === 'critical' ? 'CRITIQUE' : 'IMPORTANT'}
                </span>
              </div>

              {/* Body */}
              <div className="p-8 flex flex-col gap-6">
                <div>
                  <h4 className="text-xs font-bold text-[#141414]/40 uppercase tracking-widest">
                    Diffusé par {activeAlert.senderName} ({activeAlert.senderEmail})
                  </h4>
                  <h3 className="text-xl font-black uppercase tracking-tight text-[#141414] mt-1">
                    {activeAlert.title}
                  </h3>
                </div>

                <div className="bg-[#F5F5F0] p-6 rounded-2xl border border-[#141414]/5 text-sm font-semibold text-[#141414]/80 whitespace-pre-wrap leading-relaxed max-h-[180px] overflow-y-auto">
                  {activeAlert.body}
                </div>

                {/* Reply section in alert */}
                <div className="flex flex-col gap-2 relative">
                  <label className="text-[9px] font-black uppercase tracking-wider text-[#141414]/50">
                    Saisir une réponse / Accusé de réception technique (Optionnel)
                  </label>
                  <input
                    type="text"
                    value={alertReply}
                    onChange={(e) => setAlertReply(e.target.value)}
                    placeholder="Saisir votre retour d'information pour la Direction..."
                    className="w-full px-4 py-3 bg-[#F5F5F0] border border-[#141414]/10 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#00BFFF]"
                  />
                  {alertKeystrokes > 0 && (
                    <div className="absolute right-3 top-8 flex items-center gap-1.5 text-[8px] font-black uppercase tracking-widest text-red-500 bg-red-50 border border-red-100 px-1.5 py-0.5 rounded-md">
                      <span className="w-1 h-1 bg-red-500 rounded-full animate-ping" />
                      Télémétrie active
                    </div>
                  )}
                </div>
              </div>

              {/* Actions Footer */}
              <div className="p-6 bg-[#F5F5F0]/50 border-t border-[#141414]/5 flex justify-end">
                <button
                  onClick={handleAcknowledgeAlert}
                  disabled={submittingAlertReply}
                  className="px-8 py-4 bg-[#141414] hover:bg-[#252525] text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 shadow-lg disabled:opacity-40"
                >
                  {submittingAlertReply ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  )}
                  Confirmer la bonne lecture
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Floating high-contrast tooltip for collapsed sidebar */}
      <AnimatePresence>
        {hoveredItem && !isOpen && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.15 }}
            style={{ top: hoveredItem.top }}
            className="fixed left-20 z-[99999] bg-[#0b1c28] text-[#ffd700] border border-[#ffd700]/30 text-[10px] font-black uppercase tracking-wider px-3.5 py-2 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.5)] pointer-events-none whitespace-nowrap flex items-center gap-2"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-[#00BFFF] animate-pulse" />
            {hoveredItem.label}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
