import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Production } from './pages/Production';
import { Audit } from './pages/Audit';
import { AssistantIA } from './pages/AssistantIA';
import { Factory, ShieldCheck, Mail, LogIn, HardHat } from 'lucide-react';

const PlaceholderContent: React.FC<{ title: string }> = ({ title }) => (
  <div className="flex flex-col items-center justify-center py-40 bg-white rounded-3xl border border-[#141414]/5">
    <HardHat className="w-16 h-16 text-[#141414]/10 mb-4" />
    <h3 className="text-xl font-black uppercase tracking-tighter text-[#141414]/20">{title} en Maintenance</h3>
    <p className="text-xs font-bold uppercase tracking-widest text-[#141414]/10 mt-2">Déploiement en cours...</p>
  </div>
);

const AppContent: React.FC = () => {
  const { user, profile, loading, signIn } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F5F0] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Factory className="w-12 h-12 text-[#00BFFF] animate-bounce" />
          <p className="text-[10px] font-black uppercase tracking-[0.3em] text-[#141414]/40">Initialisation HydroMines...</p>
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
          <h1 className="text-4xl font-black tracking-tighter italic uppercase mb-2">
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
      case 'dashboard': return <Dashboard />;
      case 'production': return <Production />;
      case 'audit': return <Audit />;
      case 'assistant': return <AssistantIA />;
      case 'engines': return <PlaceholderContent title="Module Engins" />;
      case 'performance': return <PlaceholderContent title="Indice de Performance" />;
      case 'maintenance': return <PlaceholderContent title="Gestion Maintenance" />;
      case 'safety': return <PlaceholderContent title="Sécurité & Incidents" />;
      case 'stocks': return <PlaceholderContent title="Gestion Stocks" />;
      case 'admin': return <PlaceholderContent title="Administration" />;
      default: return <Dashboard />;
    }
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </Layout>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
