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
  Calendar
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  roles?: string[];
  category: 'production' | 'admin';
}

const NAV_ITEMS: NavItem[] = [
  // CORE PRODUCTION
  { id: 'production', label: 'Registre de Poste (Fond)', icon: <Plus className="w-5 h-5" />, category: 'production' },
  { id: 'daily_report', label: 'Rapport Consolidé', icon: <Layers className="w-5 h-5" />, category: 'production' },
  { id: 'chantiers', label: 'Chantiers', icon: <MapPin className="w-5 h-5" />, category: 'production' },
  { id: 'planning', label: 'Planification', icon: <Calendar className="w-5 h-5" />, category: 'production' },
  
  // ADMIN
  { id: 'admin', label: 'Administration', icon: <Users className="w-5 h-5" />, roles: ['admin'], category: 'admin' },
];

export const Layout: React.FC<{ 
  activeTab: string; 
  setActiveTab: (tab: string) => void;
  children: React.ReactNode;
}> = ({ activeTab, setActiveTab, children }) => {
  const { user, profile, logout } = useAuth();
  const [isOpen, setIsOpen] = React.useState(true);

  if (!user) return <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center">{children}</div>;

  const filteredNav = NAV_ITEMS.filter(item => 
    !item.roles || (profile && item.roles.includes(profile.role))
  );

  const categories = [
    { id: 'production', label: 'Production Core' },
    { id: 'admin', label: 'Administration' },
  ];

  return (
    <div className="flex h-screen bg-[#F5F5F0] font-sans selection:bg-[#00BFFF]/20">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ 
          width: isOpen ? 260 : 0,
          borderRightWidth: isOpen ? 1 : 0
        }}
        className="bg-white border-[#141414]/10 flex flex-col z-50 overflow-hidden relative shadow-2xl"
      >
        <div className="p-6 border-b border-[#141414]/10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Factory className="w-8 h-8 text-[#00BFFF]" />
            {isOpen && (
              <h1 className="text-2xl font-black tracking-tighter leading-none italic uppercase">
                <span className="text-[#00BFFF]">Hydro</span>
                <span className="text-[#8B0000]">Mines</span>
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

        <nav className="flex-1 px-4 py-4 space-y-6 overflow-y-auto custom-scrollbar">
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
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-none transition-all duration-200 group relative",
                    activeTab === item.id 
                      ? "bg-[#141414] text-white shadow-lg" 
                      : "text-[#141414]/60 hover:bg-[#141414]/5 hover:text-[#141414]"
                  )}
                >
                  <div className={cn(
                    "flex-shrink-0 transition-transform duration-300",
                    activeTab === item.id && "scale-110"
                  )}>
                    {item.icon}
                  </div>
                  {isOpen && (
                    <span className="font-bold text-[10.5px] uppercase tracking-tight">{item.label}</span>
                  )}
                  {activeTab === item.id && (
                    <motion.div 
                      layoutId="active-indicator"
                      className="absolute left-0 w-1 h-6 bg-[#00BFFF]" 
                    />
                  )}
                </button>
              ))}
            </div>
          ))}
        </nav>

        <div className="p-4 border-t border-[#141414]/10 space-y-2">
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="w-full flex items-center gap-3 px-3 py-2 text-[#141414]/60 hover:text-[#141414] transition-colors"
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            {isOpen && <span className="text-xs font-bold uppercase tracking-widest">Réduire</span>}
          </button>
          
          <button 
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            {isOpen && <span className="text-sm font-bold uppercase tracking-widest">Déconnexion</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#F5F5F0]">
        <header className="h-16 border-b border-[#141414]/10 bg-white/80 backdrop-blur-md flex items-center justify-between px-8 sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 hover:bg-[#141414]/5 text-[#141414] transition-colors flex items-center justify-center rounded-lg mr-1 border border-[#141414]/10"
              title="Menu principal"
              id="sidebar_toggle_button"
            >
              <Menu className="w-5 h-5 text-[#8B0000]" />
            </button>
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-[#141414]/40">
              {NAV_ITEMS.find(n => n.id === activeTab)?.label}
            </h2>
          </div>
          <div className="flex items-center gap-4">
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
    </div>
  );
};
