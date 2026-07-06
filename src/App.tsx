import React, { useState, Suspense, lazy } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SiteProvider } from './contexts/SiteContext';
import { Layout } from './components/Layout';
import { Production } from './pages/Production';
import { Planning } from './pages/Planning';
import { DailyReport } from './pages/DailyReport';
import { Factory, ShieldCheck, Mail, LogIn, HardHat } from 'lucide-react';
import logoImg from './assets/images/hydromines_logo_1781337889277.jpg';

const Admin = lazy(() =>
  import('./pages/Admin').then(m => ({ default: m.Admin })));

const Chantiers = lazy(() =>
  import('./pages/Chantiers').then(m => ({ default: m.Chantiers })));

const RotationPoste = lazy(() =>
  import('./pages/RotationPoste').then(m => ({ default: m.RotationPoste })));

const AnalyseDashboard = lazy(() =>
  import('./pages/AnalyseDashboard').then(m => ({ default: m.AnalyseDashboard })));

const ExplicationNonRealise = lazy(() =>
  import('./pages/ExplicationNonRealise').then(m => ({ default: m.ExplicationNonRealise })));

const Analytics = lazy(() =>
  import('./pages/Analytics').then(m => ({ default: m.Analytics })));

const Messages = lazy(() =>
  import('./pages/Messages').then(m => ({ default: m.Messages })));

const TechniqueMiniere = lazy(() =>
  import('./pages/TechniqueMiniere').then(m => ({ default: m.TechniqueMiniere })));

const EspaceDT = lazy(() =>
  import('./pages/EspaceDT').then(m => ({ default: m.EspaceDT })));

const Boulonnage = lazy(() =>
  import('./pages/Boulonnage').then(m => ({ default: m.Boulonnage })));

const FailedBlasts = lazy(() => import('./pages/FailedBlasts'));

const Tutoriel = lazy(() => import('./pages/Tutoriel'));

// Declarative route helper support
export const Route: React.FC<{ path: string; element: React.ReactNode }> = () => null;

const PlaceholderContent: React.FC<{ title: string }> = ({ title }) => (
  <div className="flex flex-col items-center justify-center py-40 bg-white rounded-3xl border border-[#141414]/5">
    <HardHat className="w-16 h-16 text-[#141414]/10 mb-4" />
    <h3 className="text-xl font-black uppercase tracking-tighter text-[#141414]/20">{title} en Maintenance</h3>
    <p className="text-xs font-bold uppercase tracking-widest text-[#141414]/10 mt-2">Déploiement en cours...</p>
  </div>
);

const AppContent: React.FC = () => {
  const { user, profile, loading, signIn } = useAuth();
  const [activeTab, setActiveTab] = useState('production');

  React.useEffect(() => {
    const handleNavigate = (e: Event) => {
      const customEvent = e as CustomEvent;
      if (customEvent.detail && customEvent.detail.tab) {
        setActiveTab(customEvent.detail.tab);
        if (customEvent.detail.date) {
          window.sessionStorage.setItem('goto-production-date', customEvent.detail.date);
          window.dispatchEvent(new CustomEvent('production-date-changed', { detail: { date: customEvent.detail.date } }));
        }
      }
    };
    window.addEventListener('navigate-to-tab', handleNavigate);
    return () => window.removeEventListener('navigate-to-tab', handleNavigate);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fafaf9] flex flex-col items-center justify-center p-6">
        <div className="flex flex-col items-center gap-6 max-w-xs text-center">
          {/* Logo container with delicate shadow and shape */}
          <div className="relative w-20 h-20 flex items-center justify-center bg-white rounded-2xl shadow-md border border-stone-200/40 p-2 overflow-hidden mb-2">
            <img 
              src={logoImg} 
              alt="HydroMines Logo" 
              className="w-full h-full object-contain" 
              referrerPolicy="no-referrer"
            />
          </div>
          
          {/* Elegant Circular Progress Indicator */}
          <div className="relative flex items-center justify-center">
            {/* Outer golden/amber delicate spinning ring */}
            <div className="w-10 h-10 rounded-full border-2 border-stone-200/60 border-t-amber-500 animate-spin" />
          </div>

          <div className="space-y-1">
            <h2 className="text-sm font-bold tracking-[0.25em] text-[#141414] uppercase">
              HydroMines
            </h2>
            <p className="text-[9px] font-medium tracking-[0.15em] text-stone-400 uppercase">
              Initialisation du système...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white p-12 rounded-[40px] shadow-2xl border border-[#141414]/5 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-[#00BFFF] to-[#8B0000]" />
          <Factory className="w-20 h-20 text-[#00BFFF] mx-auto mb-8" />
          <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">
            <span className="text-[#00BFFF]">Hydro</span>
            <span className="text-[#8B0000]">Mines</span>
          </h1>
          <p className="text-xs font-bold text-[#141414]/40 uppercase tracking-[0.2em] mb-12">Système de Commandement Minier</p>
          
          <button 
            onClick={signIn}
            className="w-full bg-[#141414] text-white py-5 rounded-2xl flex items-center justify-center gap-4 font-black uppercase tracking-widest text-sm hover:scale-[1.02] transition-all shadow-xl active:scale-95 group mb-4"
          >
            <LogIn className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            Accès Collaborateur
          </button>
          
          <p className="text-[10px] text-[#141414]/30 font-medium">
            Accès sécurisé réservé au personnel autorisé.<br/>Authentification Multi-Facteurs (MFA) requise.
          </p>
        </div>
      </div>
    );
  }

  // Route Rendering
  const renderContent = () => {
    switch (activeTab) {
      case 'production': return <Production />;
      case 'daily_report': return <DailyReport />;
      case 'chantiers': return <Chantiers />;
      case 'planning': return <Planning />;
      case 'rotation': return <RotationPoste />;
      case 'analyse_strategie': return <AnalyseDashboard pillar="strategie" />;
      case 'analyse_terrain': return <AnalyseDashboard pillar="terrain" />;
      case 'analyse_rh': return <AnalyseDashboard pillar="rh" />;
      case 'analyse_logistique': return <AnalyseDashboard pillar="logistique" />;
      case 'analyse_dashboard': return <AnalyseDashboard />;
      case 'analytics': return <Analytics />;
      case 'messages': return <Messages />;
      case 'explication_non_realise':
      case 'explications': return <ExplicationNonRealise />;
      case 'technique': return <TechniqueMiniere />;
      case 'espace_dt': return <EspaceDT />;
      case 'boulonnage': return <Boulonnage />;
      case 'failed_blasts':
      case '/volées-ratées': return <FailedBlasts />;
      case 'tutoriel':
      case '/tutoriel': return <Tutoriel />;
      case 'admin': return <Admin />;
      default: return <Production />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      <Suspense fallback={
        <div className="flex items-center justify-center h-64">
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin w-10 h-10 border-4 border-[#1a5276] border-t-[#ffd700] rounded-full" />
            <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">
              Chargement du module...
            </span>
          </div>
        </div>
      }>
        {renderContent()}
      </Suspense>
    </Layout>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <SiteProvider>
        <AppContent />
      </SiteProvider>
    </AuthProvider>
  );
}
