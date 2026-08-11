import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Wrench, 
  ChevronLeft, 
  Compass, 
  Layers, 
  Flame, 
  Activity, 
  HelpCircle,
  Crown
} from 'lucide-react';

// Subcomponents modular imports
import { HomeCards } from './TechniqueMiniere/HomeCards';
import { SchemaTab } from './TechniqueMiniere/SchemaTab';
import { Vue3DSchemaTab } from './TechniqueMiniere/Vue3DSchemaTab';
import { DrillingGuideTab } from './TechniqueMiniere/DrillingGuideTab';
import { ExplosifsTab } from './TechniqueMiniere/ExplosifsTab';
import { BourrageTab } from './TechniqueMiniere/BourrageTab';
import { CalculsTab } from './TechniqueMiniere/CalculsTab';
import { IngenierieTab } from './TechniqueMiniere/IngenierieTab';
import { GabaritType, TabType } from './TechniqueMiniere/types';
import bannerExcellenceImg from '../assets/images/Banner excellence.jpg';

export const TechniqueMiniere: React.FC = () => {
  const [isDetailOpen, setIsDetailOpen] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<TabType>('schema');
  const [gabarit, setGabarit] = useState<GabaritType>('12m2');

  const handleSelectGabarit = (selected: GabaritType) => {
    setGabarit(selected);
    setIsDetailOpen(true);
    setActiveTab('schema');
  };

  const handleBackToSelection = () => {
    setIsDetailOpen(false);
  };

  return (
    <div className="bg-white min-h-screen">
      <AnimatePresence mode="wait">
        
        {/* VIEW 1 : HOME SELECTION SCREEN WITH 2 GOLD CARDS */}
        {!isDetailOpen ? (
          <motion.div
            key="home-cards-view"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full"
          >
            <HomeCards onSelect={handleSelectGabarit} />
          </motion.div>
        ) : (
          <motion.div
            key="detail-tabs-view"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="w-full max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-6"
          >
            {/* NAVIGATION / HEADER BANNER WITH BANNER EXCELLENCE IMAGE */}
            <div className="p-6 rounded-3xl border border-amber-500/30 shadow-xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div 
                className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
                style={{ backgroundImage: `url(${bannerExcellenceImg})` }}
              />
              <div className="relative z-10 flex items-center gap-3.5 mx-auto md:mx-0 text-center md:text-left">
                <button
                  onClick={handleBackToSelection}
                  className="p-2.5 bg-slate-900/80 hover:bg-slate-900 rounded-xl border border-amber-400/40 transition-colors text-amber-300 flex items-center justify-center cursor-pointer group shadow-md"
                  title="Retour à la sélection des galeries"
                >
                  <ChevronLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                </button>
                <div className="text-center md:text-left">
                  <span className="text-[10px] font-black uppercase text-amber-200 tracking-widest block">Galerie active : {gabarit === '9m2' ? '9 m² — Traçage' : gabarit === '12m2_intl' ? '12 m² — Standard International' : '12 m² — Gabarit SMI'}</span>
                  <h1 className="text-lg md:text-xl font-black uppercase tracking-wider text-white flex items-center justify-center md:justify-start gap-2 drop-shadow-sm">
                    <Wrench className="w-5 h-5 text-amber-400 shrink-0" />
                    DOSSIER DE TIR & INGENIERIE DE VOLÉE
                  </h1>
                </div>
              </div>

              {/* Accès Badge */}
              <div className="relative z-10 mx-auto md:mx-0">
                <span className="inline-flex items-center gap-1.5 bg-slate-900/80 backdrop-blur-md text-[#ffd700] text-[9px] font-black uppercase tracking-wider px-3.5 py-2 rounded-xl border border-[#ffd700]/40 shadow-lg">
                  <Crown className="w-3.5 h-3.5" />
                  CHANTIER MINIER (X) — Bureau d'études
                </span>
              </div>
            </div>

            {/* TAB SELECTOR BAR */}
            <div className="flex flex-wrap border-b border-slate-200 text-xs font-black uppercase tracking-widest gap-2 md:gap-4 lg:gap-6">
              
              {/* TAB 1 */}
              <button
                onClick={() => setActiveTab('schema')}
                className={`pb-4 border-b-2 transition-all ${
                  activeTab === 'schema'
                    ? 'border-amber-500 text-slate-950 font-black'
                    : 'border-transparent text-slate-400 hover:text-slate-900'
                }`}
              >
                🎯 Plan de tir interactif
              </button>

              {/* TAB 1.25 - VUE 3D SCHEMA */}
              <button
                onClick={() => setActiveTab('vue3d')}
                className={`pb-4 border-b-2 transition-all ${
                  activeTab === 'vue3d'
                    ? 'border-amber-500 text-slate-950 font-black'
                    : 'border-transparent text-slate-400 hover:text-slate-900'
                }`}
              >
                🏔️ VUE 3D schéma
              </button>

              {/* TAB 1.5 - DRILLING GUIDE */}
              <button
                onClick={() => setActiveTab('drilling')}
                className={`pb-4 border-b-2 transition-all ${
                  activeTab === 'drilling'
                    ? 'border-amber-500 text-slate-950 font-black'
                    : 'border-transparent text-slate-400 hover:text-slate-900'
                }`}
              >
                📐 Guide de forage 3D
              </button>

              {/* TAB 2 */}
              <button
                onClick={() => setActiveTab('explosifs')}
                className={`pb-4 border-b-2 transition-all ${
                  activeTab === 'explosifs'
                    ? 'border-amber-500 text-slate-950 font-black'
                    : 'border-transparent text-slate-400 hover:text-slate-900'
                }`}
              >
                🧨 Inventaire Explosifs
              </button>

              {/* TAB 3 */}
              <button
                onClick={() => setActiveTab('bourrage')}
                className={`pb-4 border-b-2 transition-all ${
                  activeTab === 'bourrage'
                    ? 'border-amber-500 text-slate-950 font-black'
                    : 'border-transparent text-slate-400 hover:text-slate-900'
                }`}
              >
                🔒 Étanchéité & Bourrage
              </button>

              {/* TAB 4 */}
              <button
                onClick={() => setActiveTab('calculs')}
                className={`pb-4 border-b-2 transition-all ${
                  activeTab === 'calculs'
                    ? 'border-amber-500 text-slate-950 font-black'
                    : 'border-transparent text-slate-400 hover:text-slate-900'
                }`}
              >
                📊 Prévisions & Rentabilité
              </button>

              {/* TAB 5 */}
              <button
                onClick={() => setActiveTab('ingenierie')}
                className={`pb-4 border-b-2 transition-all ${
                  activeTab === 'ingenierie'
                    ? 'border-amber-500 text-slate-950 font-black'
                    : 'border-transparent text-slate-400 hover:text-slate-900'
                }`}
              >
                🎓 Académie SMI
              </button>
            </div>

            {/* TAB CONTENT PANELS */}
            <div className="pt-2">
              <AnimatePresence mode="wait">
                
                {activeTab === 'schema' && (
                  <motion.div
                    key="tab-schema"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <SchemaTab gabarit={gabarit} />
                  </motion.div>
                )}

                {activeTab === 'vue3d' && (
                  <motion.div
                    key="tab-vue3d"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Vue3DSchemaTab gabarit={gabarit} />
                  </motion.div>
                )}

                {activeTab === 'drilling' && (
                  <motion.div
                    key="tab-drilling"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <DrillingGuideTab gabarit={gabarit} />
                  </motion.div>
                )}

                {activeTab === 'explosifs' && (
                  <motion.div
                    key="tab-explosifs"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ExplosifsTab gabarit={gabarit} />
                  </motion.div>
                )}

                {activeTab === 'bourrage' && (
                  <motion.div
                    key="tab-bourrage"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <BourrageTab gabarit={gabarit} />
                  </motion.div>
                )}

                {activeTab === 'calculs' && (
                  <motion.div
                    key="tab-calculs"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <CalculsTab gabarit={gabarit} />
                  </motion.div>
                )}

                {activeTab === 'ingenierie' && (
                  <motion.div
                    key="tab-ingenierie"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    <IngenierieTab gabarit={gabarit} />
                  </motion.div>
                )}

              </AnimatePresence>
            </div>

          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
};

export default TechniqueMiniere;
