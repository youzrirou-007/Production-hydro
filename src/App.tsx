import React, { useState, Suspense, lazy } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SiteProvider } from './contexts/SiteContext';
import { Layout } from './components/Layout';
import { Factory, ShieldCheck, Mail, LogIn, HardHat } from 'lucide-react';
import logoImg from './assets/images/hydromines_logo_1781337889277.jpg';

const Production = lazy(() =>
  import('./pages/Production').then(m => ({ default: m.Production })));

const Planning = lazy(() =>
  import('./pages/Planning').then(m => ({ default: m.Planning })));

const DailyReport = lazy(() =>
  import('./pages/DailyReport').then(m => ({ default: m.DailyReport })));

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

const MineurParfait = lazy(() =>
  import('./pages/MineurParfait').then(m => ({ default: m.MineurParfait })));

const FailedBlasts = lazy(() => import('./pages/FailedBlasts'));

const Configuration = lazy(() => import('./pages/Configuration'));

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

  // Underground Pre-caching mechanism: Preload all other lazy components in the background when online
  React.useEffect(() => {
    if (typeof window !== 'undefined' && 'navigator' in window && navigator.onLine) {
      const preloadChunks = [
        () => import('./pages/Production'),
        () => import('./pages/Planning'),
        () => import('./pages/DailyReport'),
        () => import('./pages/Admin'),
        () => import('./pages/Chantiers'),
        () => import('./pages/RotationPoste'),
        () => import('./pages/AnalyseDashboard'),
        () => import('./pages/ExplicationNonRealise'),
        () => import('./pages/Analytics'),
        () => import('./pages/Messages'),
        () => import('./pages/TechniqueMiniere'),
        () => import('./pages/EspaceDT'),
        () => import('./pages/Boulonnage'),
        () => import('./pages/MineurParfait'),
        () => import('./pages/FailedBlasts'),
        () => import('./pages/Configuration'),
        () => import('./pages/Tutoriel')
      ];

      // Staggered preload to not block the main threat and initial render
      const timer = setTimeout(() => {
        preloadChunks.forEach((importFn) => {
          importFn().catch((err) => {
            console.debug('Asynchronous route chunk preloading handled:', err);
          });
        });
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, []);

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
      case 'mineur_parfait': return <MineurParfait />;
      case 'failed_blasts':
      case '/volées-ratées': return <FailedBlasts />;
      case 'configuration': return <Configuration />;
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
