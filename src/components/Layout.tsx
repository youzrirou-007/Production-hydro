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
  CheckCircle2
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

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  roles?: string[];
  category: 'production' | 'admin' | 'analyse';
}

const NAV_ITEMS: NavItem[] = [
  // CORE PRODUCTION
  { id: 'production', label: 'Registre Journalier', icon: <Plus className="w-5 h-5" />, category: 'production' },
  { id: 'daily_report', label: 'Rapport Consolidé', icon: <Layers className="w-5 h-5" />, category: 'production' },
  { id: 'chantiers', label: 'Chantiers', icon: <MapPin className="w-5 h-5" />, category: 'production' },
  { id: 'planning', label: 'Planification', icon: <Calendar className="w-5 h-5" />, category: 'production' },
  { id: 'rotation', label: 'Changement de Poste', icon: <RefreshCw className="w-5 h-5" />, category: 'production' },
  { id: 'explications', label: 'Explications', icon: <AlertTriangle className="w-5 h-5" />, category: 'production' },
  { id: 'technique', label: '📐 Technique Minière', icon: <Wrench className="w-5 h-5" />, category: 'production' },
  { id: 'messages', label: 'Messages & Directives', icon: <Mail className="w-5 h-5" />, category: 'production' },
  
  // ANALYSE
  { id: 'analytics', label: '📊 Analytique', icon: <BarChart3 className="w-5 h-5" />, category: 'analyse' },
  { id: 'analyse_strategie', label: 'Pilotage & Stratégie', icon: <Activity className="w-5 h-5" />, category: 'analyse' },
  { id: 'analyse_terrain', label: 'Performance Terrain', icon: <Layers className="w-5 h-5" />, category: 'analyse' },
  { id: 'analyse_rh', label: 'Ressources Humaines', icon: <HardHat className="w-5 h-5" />, category: 'analyse' },
  { id: 'analyse_logistique', label: 'Matériel & Historiques', icon: <Wrench className="w-5 h-5" />, category: 'analyse' },

  // ADMIN
  { id: 'admin', label: 'Administration', icon: <Users className="w-5 h-5" />, roles: ['admin'], category: 'admin' },
];
export const Layout: React.FC<{ 
  activeTab: string; 
  setActiveTab: (tab: string) => void;
  children: React.ReactNode;
}> = ({ activeTab, setActiveTab, children }) => {
  const { user, profile, logout } = useAuth();
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

  const [isOpen, setIsOpen] = React.useState(true);
  const [rotationPending, setRotationPending] = React.useState(false);
  const [hasPendingRequests, setHasPendingRequests] = React.useState(false);
  const [unexplainedCount, setUnexplainedCount] = React.useState(0);

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
      where('date', '>=', startStr),
      where('date', '<=', endStr),
      where('status', '==', 'pending')
    );
    
    const unsub = onSnapshot(q, (snap) => {
      setUnexplainedCount(snap.size);
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

  if (!user) return <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center">{children}</div>;

  const filteredNav = NAV_ITEMS.filter(item => 
    !item.roles || (profile && item.roles.includes(profile.role))
  );

  const categories = [
    { id: 'production', label: 'Production Core' },
    { id: 'analyse', label: 'Analyses' },
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
        className="bg-white border-[#141414]/10 flex flex-col z-50 overflow-hidden relative shadow-2xl"
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
              <h1 className="text-sm font-black tracking-tighter leading-none uppercase animate-fade-in">
                <span className="text-[#b8860b]">Hydro</span>
                <span className="text-[#141414]">Mines</span>
              </h1>
            )}
          </div>
          {isOpen && (
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-[#141414]/5 text-[#141414]/60 hover:text-[#8B0000] rounded transition-colors"
              title="Réduire le menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <nav className={cn(
          "flex-1 py-4 space-y-6 overflow-y-auto custom-scrollbar",
          isOpen ? "px-4" : "px-2"
        )}>
          {categories.map(cat => (
            <div key={cat.id} className="space-y-1">
              {isOpen && (
                <p className="px-3 text-[8px] font-black uppercase tracking-[0.25em] text-[#141414]/40 mb-2">
                  {cat.label}
                </p>
              )}
              {filteredNav.filter(item => item.category === cat.id).map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id);
                  }}
                  className={cn(
                    "w-full flex items-center rounded-none transition-all duration-200 group relative",
                    isOpen ? "gap-3 px-3 py-2.5" : "justify-center p-3",
                    activeTab === item.id 
                      ? "bg-[#141414] text-white shadow-lg" 
                      : "text-[#141414]/60 hover:bg-[#141414]/5 hover:text-[#141414]",
                    item.id === 'explications' && unexplainedCount > 0 && activeTab !== 'explications' && [
                      "animate-pulse",
                      "shadow-[0_0_15px_rgba(239,68,68,0.6)]",
                      "border-l-2 border-red-500",
                      "bg-red-50/10"
                    ]
                  )}
                  title={!isOpen ? item.label : undefined}
                >
                  <div className={cn(
                    "flex-shrink-0 transition-transform duration-300",
                    activeTab === item.id && "scale-110",
                    item.id === 'explications' && unexplainedCount > 0 && activeTab !== 'explications' && "text-red-500 animate-bounce"
                  )}>
                    {item.icon}
                  </div>
                  {isOpen && (
                    <span className="font-bold text-[10.5px] uppercase tracking-tight flex-1 text-left">{item.label}</span>
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
                      isOpen && (
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
                  {activeTab === item.id && (
                    <motion.div 
                      layoutId="active-indicator"
                      className="absolute left-0 w-1 h-6 bg-[#b8860b]" 
                    />
                  )}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className={cn("p-4 border-t border-[#141414]/10 space-y-2", !isOpen && "px-2 text-center")}>
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 text-[#141414]/60 hover:text-[#141414] transition-colors",
              !isOpen && "justify-center"
            )}
            title={!isOpen ? "Agrandir" : "Réduire"}
          >
            {isOpen ? <X className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
            {isOpen && <span className="text-xs font-bold uppercase tracking-widest">Réduire</span>}
          </button>
          
          <button 
            onClick={logout}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors",
              !isOpen && "justify-center"
            )}
            title={!isOpen ? "Déconnexion" : undefined}
          >
            <LogOut className="w-5 h-5" />
            {isOpen && <span className="text-sm font-bold uppercase tracking-widest">Déconnexion</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-white">
        <header className="h-16 border-b border-[#141414]/10 bg-white/80 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 hover:bg-[#141414]/5 text-[#141414] transition-colors flex items-center justify-center rounded-lg mr-1 border border-[#141414]/10"
              title="Menu principal"
              id="sidebar_toggle_button"
            >
              <Menu className="w-5 h-5 text-[#b8860b]" />
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
            <div className="text-right hidden sm:block">
              <p className="text-xs font-black uppercase text-[#141414] leading-none mb-1">
                {user.displayName || user.email?.split('@')[0]}
              </p>
              <p className="text-[10px] font-bold uppercase text-[#141414]/40 tracking-wider">
                {profile?.role || 'Compte non configuré'}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-[#141414] flex items-center justify-center text-white font-black text-sm border-2 border-white shadow-sm overflow-hidden">
              {user.photoURL ? <img src={user.photoURL} alt="" /> : user.email?.[0].toUpperCase()}
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
    </div>
  );
};
