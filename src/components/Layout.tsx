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

const starPositions = [
  { x: 50, y: 8, size: 20, delay: 0 },
  { x: 18, y: 30, size: 16, delay: 130 },
  { x: 82, y: 30, size: 16, delay: 260 },
  { x: 30, y: 0, size: 14, delay: 390 },
  { x: 70, y: 0, size: 14, delay: 520 },
];

const hydroChars = "HYDRO".split("");
const minesChars = "MINES".split("");

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
    category: 'ingenierie'
  },
  { id: '/tutoriel', label: 'Tutoriel', icon: <GraduationCap className="w-5 h-5" />, category: 'ingenierie' },
  
  // ANALYSE & PERFORMANCE
  { id: 'daily_report', label: 'Rapport Consolidé', icon: <FileText className="w-5 h-5" />, category: 'analyse' },
  { id: 'analytics', label: 'Analytique', icon: <BarChart3 className="w-5 h-5" />, category: 'analyse' },
  { id: 'analyse_strategie', label: 'Pilotage & Stratégie', icon: <Activity className="w-5 h-5" />, category: 'analyse' },
  { id: 'analyse_terrain', label: 'Performance Terrain', icon: <TrendingUp className="w-5 h-5" />, category: 'analyse' },
  { id: 'analyse_rh', label: 'Ressources Humaines', icon: <HardHat className="w-5 h-5" />, category: 'analyse' },
  { id: 'analyse_logistique', label: 'Matériel & Historiques', icon: <Database className="w-5 h-5" />, category: 'analyse' },
  { id: 'boulonnage', label: 'Suivi Boulonnage', icon: <Hammer className="w-5 h-5" />, category: 'analyse' },
  { id: '/volées-ratées', label: 'Volées Ratées', icon: <AlertTriangle className="w-5 h-5" />, category: 'analyse' },

  // ADMIN
  { id: 'messages', label: 'Messages & Directives', icon: <Mail className="w-5 h-5" />, category: 'admin' },
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

  const [introPhase, setIntroPhase] = React.useState<
    'drop' | 'splash' | 'reveal' | 'brand-hydro' | 'brand-mines' | 'tagline' | 'mission' | 'stars' | 'done'
  >('drop');
  const [showLoginText, setShowLoginText] = React.useState(false);
  const [showLoginForm, setShowLoginForm] = React.useState(false);
  const [postAuthPhase, setPostAuthPhase] = React.useState<
    'hidden' | 'showing' | 'wiping' | 'done'
  >('hidden');

  const [isLoggingOut, setIsLoggingOut] = React.useState(false);

  const handleInitiateLogout = async () => {
    setIsLoggingOut(true);
    setTimeout(async () => {
      try {
        await logout();
      } catch (err) {
        console.error("Logout error:", err);
      } finally {
        setIsLoggingOut(false);
      }
    }, 2000);
  };

  React.useEffect(() => {
    if (!user) {
      setPostAuthPhase('hidden');
      return;
    }
    setPostAuthPhase('showing');
    const timers = [
      setTimeout(() => setPostAuthPhase('wiping'), 2000),
      setTimeout(() => setPostAuthPhase('done'), 2300),
    ];
    return () => timers.forEach(clearTimeout);
  }, [user]);

  const [bgLoaded, setBgLoaded] = React.useState(false);
  const [mousePos, setMousePos] = React.useState({ x: 0, y: 0 });
  const [ripple, setRipple] = React.useState({ x: 0, y: 0 });
  const lastRippleTime = React.useRef(0);

  const handleMouseMove = (e: React.MouseEvent) => {
    const { clientWidth, clientHeight } = e.currentTarget;
    const x = (e.clientX - clientWidth / 2) / (clientWidth / 2);
    const y = (e.clientY - clientHeight / 2) / (clientHeight / 2);
    setMousePos({ x, y });

    const now = Date.now();
    if (now - lastRippleTime.current > 60) {
      setRipple({ x: e.clientX, y: e.clientY });
      lastRippleTime.current = now;
    }
  };

  const handleMouseLeave = () => {
    setMousePos({ x: 0, y: 0 });
  };

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      // Preload background image
      const img = new Image();
      img.src = loginBgImg;
      img.onload = () => setBgLoaded(true);
      img.onerror = () => setBgLoaded(true);

      // Preload HydroMines Logo image
      const logo = new Image();
      logo.src = logoImg;
    }
  }, []);

  React.useEffect(() => {
    if (user) {
      setIntroPhase('done');
      return;
    }
    const sequence: { phase: typeof introPhase; delay: number }[] = [
      { phase: 'reveal', delay: 1200 },       // 1.2s - logo reveals directly after the drop falls
      { phase: 'brand-hydro', delay: 2600 },  // 2.6s - HYDRO types
      { phase: 'brand-mines', delay: 2950 },  // 2.95s - MINES types
      { phase: 'tagline', delay: 3800 },      // 3.8s - line draw & tagline shows
      { phase: 'mission', delay: 4400 },      // 4.4s - mission shows
      { phase: 'stars', delay: 5100 },        // 5.1s - stars/caustics show (final result displays)
      { phase: 'done', delay: 7100 },         // 7.1s - complete (holds for exactly 2 seconds of stars)
    ];
    const timers = sequence.map(s =>
      setTimeout(() => setIntroPhase(s.phase), s.delay)
    );
    return () => timers.forEach(clearTimeout);
  }, [user]);

  React.useEffect(() => {
    if (user) {
      setShowLoginText(true);
      setShowLoginForm(true);
      return;
    }
    if (introPhase === 'done') {
      const t1 = setTimeout(() => setShowLoginText(true), 1000);
      const t2 = setTimeout(() => setShowLoginForm(true), 1800);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    } else {
      setShowLoginText(false);
      setShowLoginForm(false);
    }
  }, [introPhase, user]);

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
    const isMobile = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches;

    return (
      <div 
        className="min-h-screen w-full relative overflow-hidden flex items-center justify-center animate-fade-in"
        style={{ background: 'radial-gradient(circle at center, #1b354a 0%, #0c1822 100%)' }}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* Full-screen Background with Golden Hour Atmosphere & Dust Particles */}
        <motion.div
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ 
            opacity: (bgLoaded && (introPhase === 'reveal' || introPhase === 'text' || introPhase === 'done')) ? 1 : 0,
            x: mousePos.x * -15,
            y: mousePos.y * -15,
            scale: 1.05
          }}
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

        {/* Fond aquatique réactif à la souris */}
        {!isMobile && (
          <div
            className="fixed inset-0 pointer-events-none z-[5]"
            style={{
              background: `radial-gradient(circle 180px at ${ripple.x}px ${ripple.y}px, rgba(0,160,227,0.06), transparent 70%)`,
              transition: 'background 0.3s ease-out',
            }}
          />
        )}

        {/* Dynamic bottom-left text (Typography pair with custom colors) */}
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          animate={{
            opacity: showLoginText ? 1 : 0,
            y: showLoginText ? 0 : 35
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
              opacity: showLoginForm ? 1 : 0,
              x: showLoginForm ? mousePos.x * 12 : 50,
              y: showLoginForm ? mousePos.y * 12 : 0,
              scale: showLoginForm ? 1 : 0.95,
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
              whileHover={{ scale: 1.025 }}
              whileTap={{ scale: 0.975 }}
            >
              <button
                onClick={signIn}
                className="group relative w-full flex items-center justify-center gap-3 bg-gradient-to-r from-[#ffd700] via-[#ea580c] to-[#8B1A1A] hover:from-[#ffe033] hover:via-[#ff6b00] hover:to-[#a31a1a] text-white font-black uppercase text-xs tracking-wider py-4 px-6 rounded-2xl transition-[transform,shadow,border-color,opacity] duration-300 cursor-pointer overflow-hidden border border-[#ffd700]/30 bg-no-repeat bg-clip-padding [transform:translateZ(0)]"
              >
                {/* Micro-shimmer sweep line on hover */}
                <div 
                  className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent pointer-events-none"
                  style={{
                    transform: 'translateX(-200%) skewX(-25deg)',
                    animation: 'shimmer-fast 1.6s infinite linear'
                  }}
                />
                
                {/* Discrete white border glow */}
                <div className="absolute inset-0 border border-white/20 rounded-2xl pointer-events-none" />

                <div className="bg-white p-1 rounded-lg shadow-sm group-hover:scale-110 transition-transform duration-300 z-10">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335" />
                  </svg>
                </div>
                <span className="z-10 group-hover:translate-x-1 transition-transform duration-300">Se connecter avec Google</span>
              </button>
            </motion.div>

            <div className="mt-8 text-center border-t border-slate-200/50 pt-6">
              <span className="inline-block px-2.5 py-0.5 bg-[#b8860b]/10 border border-[#b8860b]/20 rounded-full text-[8px] font-black text-[#b8860b] uppercase tracking-widest">
                ISO/IEC 27001 : Authentification Sécurisée
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
              style={{ backgroundColor: '#ffffff' }}
              initial={{ opacity: 1 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.8, ease: 'easeInOut' }}
            >
              <div className="grain" />
              
              {/* Caustics drifting background */}
              <div className={cn("caustics", ['stars', 'done'].includes(introPhase) && "on")} />
              
              {/* Stars Wrap */}
              <div className={cn("stars-wrap", ['stars', 'done'].includes(introPhase) && "on")}>
                {starPositions.map((pos, i) => (
                  <div
                    key={i}
                    className={cn("star-item", ['stars', 'done'].includes(introPhase) && "on twinkle")}
                    style={{
                      left: `calc(${pos.x}% - ${pos.size / 2}px)`,
                      top: `calc(${pos.y}% - ${pos.size / 2}px)`,
                      transitionDelay: `${pos.delay}ms`,
                    }}
                  >
                    <svg className="star-svg" width={pos.size} height={pos.size} viewBox="0 0 24 24" fill="none">
                      <path d="M12 1.5L14.7 9.3L23 9.8L16.5 15.2L18.8 23L12 18.8L5.2 23L7.5 15.2L1 9.8L9.3 9.3L12 1.5Z" fill="white" stroke="rgba(2,132,199,0.2)" strokeWidth="0.5" strokeLinejoin="round"/>
                    </svg>
                  </div>
                ))}
              </div>

              {/* FALLING DROPLET */}
              {['drop', 'reveal'].includes(introPhase) && (
                <div className={cn("droplet-wrap", introPhase === 'drop' ? "fall" : "vanish")}>
                  <div className="droplet-trail" />
                  <svg className="droplet-svg w-12 h-[72px]" viewBox="0 0 48 72" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <radialGradient id="d-body" cx="45%" cy="42%" r="68%">
                        <stop offset="0%" stopColor="#E0F2FE" stopOpacity="0.08"/>
                        <stop offset="35%" stopColor="#38BDF8" stopOpacity="0.2"/>
                        <stop offset="75%" stopColor="#0284C7" stopOpacity="0.32"/>
                        <stop offset="100%" stopColor="#0C4A6E" stopOpacity="0.42"/>
                      </radialGradient>
                      <linearGradient id="d-flow" x1="50%" y1="0%" x2="50%" y2="100%">
                        <stop offset="0%" stopColor="#E0F2FE" stopOpacity="0"/>
                        <stop offset="25%" stopColor="#E0F2FE" stopOpacity="0.3"/>
                        <stop offset="55%" stopColor="#BAE6FD" stopOpacity="0.2"/>
                        <stop offset="85%" stopColor="#7DD3FC" stopOpacity="0.1"/>
                        <stop offset="100%" stopColor="#38BDF8" stopOpacity="0"/>
                      </linearGradient>
                      <radialGradient id="d-caustic1" cx="32%" cy="38%" r="22%">
                        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.45"/>
                        <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0"/>
                      </radialGradient>
                      <radialGradient id="d-caustic2" cx="62%" cy="52%" r="18%">
                        <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.3"/>
                        <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0"/>
                      </radialGradient>
                      <radialGradient id="d-caustic3" cx="48%" cy="68%" r="16%">
                        <stop offset="0%" stopColor="#E0F2FE" stopOpacity="0.35"/>
                        <stop offset="100%" stopColor="#E0F2FE" stopOpacity="0"/>
                      </radialGradient>
                      <linearGradient id="d-rim" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#0EA5E9" stopOpacity="0.3"/>
                        <stop offset="25%" stopColor="#38BDF8" stopOpacity="0.12"/>
                        <stop offset="50%" stopColor="#7DD3FC" stopOpacity="0.06"/>
                        <stop offset="75%" stopColor="#38BDF8" stopOpacity="0.12"/>
                        <stop offset="100%" stopColor="#0EA5E9" stopOpacity="0.3"/>
                      </linearGradient>
                      <filter id="d-turb" x="-30%" y="-30%" width="160%" height="160%">
                        <feTurbulence type="fractalNoise" baseFrequency="0.1" numOctaves="3" result="noise" />
                        <feDisplacementMap in="SourceGraphic" in2="noise" scale="1.2" xChannelSelector="R" yChannelSelector="G"/>
                      </filter>
                      <clipPath id="d-clip">
                        <path d="M24 1.5 C23.6 1.5, 4 28, 4 46 C4 60.5, 12.8 70.5, 24 70.5 C35.2 70.5, 44 60.5, 44 46 C44 28, 24.4 1.5, 24 1.5 Z"/>
                      </clipPath>
                    </defs>

                    <path d="M24 1.5 C23.6 1.5, 4 28, 4 46 C4 60.5, 12.8 70.5, 24 70.5 C35.2 70.5, 44 60.5, 44 46 C44 28, 24.4 1.5, 24 1.5 Z" 
                          fill="url(#d-body)" stroke="url(#d-rim)" strokeWidth="0.5"/>

                    <g clipPath="url(#d-clip)">
                      <path d="M18 6 Q21 22 19 36 Q17 50 21 62 Q22 66 24 69" 
                            fill="none" stroke="url(#d-flow)" strokeWidth="7" strokeLinecap="round" opacity="0.5" />
                      <path d="M28 8 Q25 24 27 38 Q29 52 25 64 Q24 67 24 70" 
                            fill="none" stroke="url(#d-flow)" strokeWidth="4.5" strokeLinecap="round" opacity="0.35" />

                      <ellipse cx="19" cy="26" rx="4.5" ry="6.5" fill="url(#d-caustic1)" className="droplet-caustic-pulse" />
                      <ellipse cx="29" cy="44" rx="3.5" ry="4.5" fill="url(#d-caustic2)" className="droplet-caustic-pulse" />
                      <ellipse cx="23" cy="56" rx="2.5" ry="3.5" fill="url(#d-caustic3)" className="droplet-caustic-pulse" />

                      <ellipse cx="24" cy="38" rx="15" ry="24" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.4" filter="url(#d-turb)"/>
                    </g>

                    {/* Highly polished specular highlight curves on left and right borders of the droplet */}
                    <path d="M11 30 C9.5 38, 11 48, 15 56" fill="none" stroke="rgba(255, 255, 255, 0.65)" strokeWidth="1.6" strokeLinecap="round" />
                    <path d="M13 24 C11.5 32, 13 42, 17 48" fill="none" stroke="rgba(255, 255, 255, 0.25)" strokeWidth="0.8" strokeLinecap="round" />
                    <path d="M37 30 C38.5 38, 37 48, 33 56" fill="none" stroke="rgba(56, 189, 248, 0.35)" strokeWidth="1.2" strokeLinecap="round" />

                    <ellipse cx="18" cy="18" rx="6" ry="9" fill="rgba(255,255,255,0.15)" transform="rotate(-16 18 18)"/>
                    <ellipse cx="20" cy="16" rx="2.5" ry="4" fill="rgba(255,255,255,0.25)" transform="rotate(-16 20 16)"/>
                    <path d="M14 60 Q24 65 34 60" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.8" strokeLinecap="round"/>
                  </svg>
                </div>
              )}

              {/* LOGO REVEAL */}
              {['reveal', 'brand-hydro', 'brand-mines', 'tagline', 'mission', 'stars'].includes(introPhase) && (
                <div className="logo-wrap-intro on breathe">
                  <img src={logoImg} alt="HydroMines Logo" className="w-[170px] sm:w-[220px] h-auto" />
                </div>
              )}

              {/* TYPOGRAPHY */}
              {['brand-hydro', 'brand-mines', 'tagline', 'mission', 'stars'].includes(introPhase) && (
                <div className="typo-wrap-intro on">
                  <div className="flex gap-[3px] items-baseline line-height-none">
                    <span className="flex">
                      {hydroChars.map((char, index) => (
                        <span
                          key={index}
                          className="typo-char show"
                          style={{
                            fontFamily: "'Space Grotesk', sans-serif",
                            fontWeight: 900,
                            fontSize: 'clamp(32px, 4.5vw, 52px)',
                            letterSpacing: '-0.04em',
                            color: '#0284C7',
                            lineHeight: 1,
                            transitionDelay: `${index * 55}ms`,
                          }}
                        >
                          {char}
                        </span>
                      ))}
                    </span>
                    
                    {['brand-mines', 'tagline', 'mission', 'stars'].includes(introPhase) && (
                      <span className="flex ml-1">
                        {minesChars.map((char, index) => (
                          <span
                            key={index}
                            className="typo-char show"
                            style={{
                              fontFamily: "'Space Grotesk', sans-serif",
                              fontWeight: 900,
                              fontSize: 'clamp(32px, 4.5vw, 52px)',
                              letterSpacing: '-0.04em',
                              color: '#991B1B',
                              lineHeight: 1,
                              transitionDelay: `${index * 55}ms`,
                            }}
                          >
                            {char}
                          </span>
                        ))}
                      </span>
                    )}
                  </div>

                  <div className={cn("typo-line", ['tagline', 'mission', 'stars'].includes(introPhase) && "draw")} />
                  
                  <div className={cn("typo-tagline", ['tagline', 'mission', 'stars'].includes(introPhase) && "show")}>
                    Mines · Eau · Environnement
                  </div>
                  
                  <div className={cn("typo-mission", ['mission', 'stars'].includes(introPhase) && "show")}>
                    Plateforme de Suivi et de Gestion des Opérations Minières
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* CSS Keyframes for High-End Premium Micro-Animations */}
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes shimmer-fast {
            0% { transform: translateX(-150%) skewX(-25deg); }
            100% { transform: translateX(150%) skewX(-25deg); }
          }
          @keyframes shimmer-slow {
            0% { transform: translateX(-150%) skewX(-20deg); }
            15% { transform: translateX(-150%) skewX(-20deg); }
            45% { transform: translateX(150%) skewX(-20deg); }
            100% { transform: translateX(150%) skewX(-20deg); }
          }
        `}} />
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
            onClick={handleInitiateLogout}
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    const firstName = user?.displayName?.split(' ')[0] || '';
    const greeting = hour < 12 ? 'Bonjour' : hour < 18 ? 'Bon après-midi' : 'Bonsoir';
    return firstName ? `${greeting}, ${firstName}` : `${greeting}`;
  };

  const categories = [
    { id: 'direction', label: 'I. Direction & Pilotage' },
    { id: 'production', label: 'II. Opérations & Saisies' },
    { id: 'ingenierie', label: 'III. Technique & Supports Métier' },
    { id: 'analyse', label: 'IV. Analyses & Intelligence' },
    { id: 'admin', label: 'V. Administration & Configuration' },
  ];

  return (
    <div className="flex h-screen bg-[#FAFAF9] font-sans selection:bg-[#b8860b]/20 overflow-hidden">
      <AnimatePresence>
        {isLoggingOut && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[300] flex flex-col items-center justify-center bg-white text-slate-950 overflow-hidden"
          >
            {/* Ambient water vapor / bubbles drifting upwards with soft light colors */}
            <div className="absolute inset-0 pointer-events-none opacity-40">
              <div className="absolute bottom-0 left-1/4 w-1.5 h-1.5 bg-cyan-100 border border-cyan-200/50 rounded-full animate-bubble" style={{ animationDelay: '0.1s', animationDuration: '2.5s' }} />
              <div className="absolute bottom-0 left-2/4 w-2 h-2 bg-sky-100 border border-sky-200/50 rounded-full animate-bubble" style={{ animationDelay: '0.5s', animationDuration: '1.8s' }} />
              <div className="absolute bottom-0 left-3/4 w-1.5 h-1.5 bg-cyan-50 border border-cyan-100/50 rounded-full animate-bubble" style={{ animationDelay: '1.2s', animationDuration: '2.2s' }} />
              <div className="absolute bottom-0 left-1/3 w-2.5 h-2.5 bg-sky-50 border border-sky-100/50 rounded-full animate-bubble" style={{ animationDelay: '0.8s', animationDuration: '3s' }} />
              <div className="absolute bottom-0 left-2/3 w-1.5 h-1.5 bg-teal-50 border border-teal-100/50 rounded-full animate-bubble" style={{ animationDelay: '1.5s', animationDuration: '2s' }} />
            </div>

            {/* Soft glowing ring/pulse in the center */}
            <div className="relative mb-6">
              <motion.img
                src={logoImg}
                alt="HydroMines Logo"
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="w-36 h-auto object-contain rounded-2xl shadow-[0_12px_32px_rgba(0,160,227,0.12)] border border-slate-100"
              />
              <div className="absolute -inset-4 bg-sky-500/5 rounded-full blur-xl animate-pulse pointer-events-none" />
            </div>

            {/* Title / Brand */}
            <motion.h1
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.4 }}
              className="text-2xl font-black tracking-widest text-center uppercase"
            >
              <span className="text-[#00A0E3] drop-shadow-[0_1px_2px_rgba(0,160,227,0.15)]">HYDRO</span>
              <span className="text-[#8B1A1A] ml-1 drop-shadow-[0_1px_2px_rgba(139,26,26,0.15)]">MINES</span>
            </motion.h1>

            {/* Status texts */}
            <motion.p
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              className="text-[10px] font-black tracking-[0.25em] text-slate-500 uppercase mt-4 text-center"
            >
              Sécurisation du Système de Pilotage...
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              transition={{ delay: 0.7, duration: 0.4 }}
              className="text-[8px] font-bold tracking-widest text-slate-400 uppercase mt-2 max-w-xs text-center leading-relaxed"
            >
              Fermeture sécurisée des protocoles de communication avec SMI Imiter. Sauvegarde de la session de production.
            </motion.p>

            {/* Count-down Progress Bar (2 seconds) */}
            <div className="w-48 h-[2px] bg-slate-100 rounded-full mt-8 overflow-hidden relative">
              <motion.div
                initial={{ width: '0%' }}
                animate={{ width: '100%' }}
                transition={{ duration: 1.8, ease: 'linear' }}
                className="h-full bg-gradient-to-r from-[#00A0E3] via-[#ffd700] to-[#8B1A1A]"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {(postAuthPhase === 'showing' || postAuthPhase === 'wiping') && (
        <motion.div
          className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-white"
          animate={{ opacity: postAuthPhase === 'wiping' ? 0 : 1, y: postAuthPhase === 'wiping' ? -40 : 0 }}
          transition={{ duration: 0.3, ease: 'easeInOut' }}
        >
          {/* Halo d'eau discret, réutilisation atténuée */}
          <div
            className="fixed inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(circle 180px at ${ripple.x}px ${ripple.y}px, rgba(0,160,227,0.03), transparent 70%)`,
            }}
          />

          <motion.img
            src={logoImg}
            alt="HydroMines Logo"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            style={{ width: 180, height: 'auto' }}
          />

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.6 }}
            className="text-xs md:text-sm font-extrabold text-slate-700 tracking-wider uppercase mt-4"
          >
            Système de Commandement de la Production
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.9 }}
            className="text-[11px] text-slate-400 font-medium tracking-wide mt-2"
          >
            {getGreeting()}
          </motion.p>

          <div className="w-40 h-[3px] bg-slate-100 rounded-full mt-6 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[#00A0E3] via-[#ffd700] to-[#8B1A1A] rounded-full"
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 1.5, delay: 0.5, ease: 'linear' }}
            />
          </div>
        </motion.div>
      )}

      <motion.div
        initial={false}
        animate={{
          opacity: postAuthPhase === 'wiping' || postAuthPhase === 'done' ? 1 : 0,
          y: postAuthPhase === 'wiping' || postAuthPhase === 'done' ? 0 : 20,
        }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="flex-1 flex min-w-0 h-full w-full"
      >
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
                onClick={handleInitiateLogout}
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
              className="p-4 md:p-6 max-w-7xl mx-auto w-full"
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
      </motion.div>

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
