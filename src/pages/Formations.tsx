import React, { useState } from 'react';
import bannerExcellenceImg from '../assets/images/Banner excellence.jpg';
import { FormationSchemaViewer } from './TechniqueMiniere/FormationSchemaViewer';
import { FormationSlideDeck, ExtendedModuleType } from './TechniqueMiniere/FormationSlideDeck';
import { 
  Crown, GraduationCap, Search, Sparkles, Clock, ShieldCheck, 
  ArrowRight, BookOpen, Flame, ShieldAlert, BarChart3, CheckCircle2, 
  Award, Filter, Layers, Zap
} from 'lucide-react';

export interface FormationModuleCard {
  id: ExtendedModuleType;
  category: 'schema' | 'explosifs' | 'securite' | 'diagnostic';
  categoryLabel: string;
  badgeBg: string;
  badgeText: string;
  title: string;
  subtitle: string;
  duration: string;
  level: 'Débutant' | 'Intermédiaire' | 'Expert';
  slidesCount: number;
  hasQuiz: boolean;
  objectives: string[];
  holes?: string;
  schemaType?: '12m2' | '12m2_intl' | '9m2' | '9m2_intl';
}

const MODULES_DATA: FormationModuleCard[] = [
  {
    id: '12m2',
    category: 'schema',
    categoryLabel: 'SCHÉMA DE FORAGE',
    badgeBg: 'bg-blue-600',
    badgeText: 'text-white',
    title: 'Galerie 12m² SMI — Imiter',
    subtitle: 'Gabarit de référence 3.8m × 3.5m',
    duration: '25 min',
    level: 'Intermédiaire',
    slidesCount: 15,
    hasQuiz: true,
    holes: '38 trous',
    schemaType: '12m2',
    objectives: [
      'Implémentation rigoureuse du bouchon à 3 vides centraux',
      'Maîtrise des 7 étages de micro-retards (D0 à D5)',
      'Découpe doux de voûte pour éliminer l\'écaillag'
    ]
  },
  {
    id: '12m2_intl',
    category: 'schema',
    categoryLabel: 'STANDARD INTERNATIONAL',
    badgeBg: 'bg-amber-600',
    badgeText: 'text-white',
    title: 'Galerie 12m² International',
    subtitle: 'Standard Langefors-Kihlström 1963',
    duration: '20 min',
    level: 'Expert',
    slidesCount: 12,
    hasQuiz: true,
    holes: '38 trous',
    schemaType: '12m2_intl',
    objectives: [
      'Bouchon suédois à 6 trous vides centraux (Ratio 2:1)',
      'Calcul des burdens en roche très dure (> 180 MPa)',
      'Prévention des tirs bloqués et des ré-alignements'
    ]
  },
  {
    id: '9m2',
    category: 'schema',
    categoryLabel: 'TRAÇAGE ÉTROIT',
    badgeBg: 'bg-emerald-700',
    badgeText: 'text-white',
    title: 'Traçage 9m² SMI & International',
    subtitle: 'Profil compact 3.0m × 3.0m',
    duration: '15 min',
    level: 'Débutant',
    slidesCount: 10,
    hasQuiz: true,
    holes: '28 trous',
    schemaType: '9m2',
    objectives: [
      'Optimisation avec suppression du Groupe 4',
      'Bouchon cylindrique simple (1 vide / 4 chargés)',
      'Maintien d\'un rendement d\'avancement ≥ 95%'
    ]
  },
  {
    id: 'explosifs',
    category: 'explosifs',
    categoryLabel: 'CHIMIE DES EXPLOSIFS',
    badgeBg: 'bg-orange-600',
    badgeText: 'text-white',
    title: 'Chimie des Explosifs & Bourrage',
    subtitle: 'Synergie ANFO / TOVEX & Confinement',
    duration: '20 min',
    level: 'Intermédiaire',
    slidesCount: 12,
    hasQuiz: true,
    objectives: [
      'Propriétés physico-chimiques ANFO vs TOVEX (VOD & Densité)',
      'Montage d\'une cartouche amorce de fond de trou',
      'Application de la formule du bourrage Lb = 20 × D (76cm)'
    ]
  },
  {
    id: 'securite',
    category: 'securite',
    categoryLabel: 'SÉCURITÉ & PRÉVENTION',
    badgeBg: 'bg-rose-600',
    badgeText: 'text-white',
    title: 'Sécurité Absolue, Purge & Tirs Ratés',
    subtitle: 'Protocole pré-forage & Gestion des Culots',
    duration: '30 min',
    level: 'Expert',
    slidesCount: 14,
    hasQuiz: true,
    objectives: [
      'Triptyque Aérage (3 m³/s), Arrosage et Purge méthodique',
      'Sonorisation de la roche à la barre en aluminium (2.5m/3.5m)',
      'Règle stricte des culots de trous (Misfires) : 20 cm d\'écart'
    ]
  },
  {
    id: 'diagnostic',
    category: 'diagnostic',
    categoryLabel: 'DIAGNOSTIC & PERFORMANCE',
    badgeBg: 'bg-indigo-600',
    badgeText: 'text-white',
    title: 'Diagnostic de Volée & Performance',
    subtitle: 'Analyse du Tas, Fragmentation & Overbreak',
    duration: '20 min',
    level: 'Intermédiaire',
    slidesCount: 11,
    hasQuiz: true,
    objectives: [
      'Lecture visuelle de la forme du tas de minerai (Muckpile)',
      'Évaluation de la granulométrie D50 pour le marinage LHD',
      'Analyse des hors-profils (sur-profil overbreak & piquets)'
    ]
  }
];

export const Formations: React.FC = () => {
  const [activeModule, setActiveModule] = useState<ExtendedModuleType | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const filteredModules = MODULES_DATA.filter(mod => {
    const matchesCategory = selectedCategory === 'all' || mod.category === selectedCategory;
    const matchesSearch = mod.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          mod.subtitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          mod.objectives.some(o => o.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  if (activeModule) {
    return <FormationSlideDeck gabarit={activeModule} onClose={() => setActiveModule(null)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6 md:p-10 space-y-8 flex flex-col justify-between font-sans">
      <div className="max-w-7xl mx-auto w-full space-y-8">
        
        {/* Header Banner - High-contrast White Theme with Excellence Image */}
        <div 
          id="formations-header-banner" 
          className="p-8 md:p-10 rounded-3xl shadow-xl border-2 border-amber-500/40 relative overflow-hidden flex flex-col items-center justify-center text-center space-y-6"
        >
          {/* Banner Image Background */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none opacity-90"
            style={{ backgroundImage: `url(${bannerExcellenceImg})` }}
          />

          <div className="relative z-10 max-w-4xl space-y-4">
            <div className="inline-flex items-center gap-2 bg-slate-900/90 text-amber-300 text-[11px] font-black uppercase tracking-widest px-4 py-2 rounded-xl border border-amber-400/40 shadow-lg">
              <Crown className="w-4 h-4 text-amber-400" />
              SMI • CENTRE D'EXCELLENCE & INGÉNIERIE MINIÈRE
            </div>

            <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-white drop-shadow-md">
              ACADÉMIE DE FORMATION TECHNIQUE
            </h1>

            <p className="text-amber-100 text-sm md:text-base font-bold max-w-2xl mx-auto leading-relaxed drop-shadow-sm">
              Formations complètes 100% qualifiantes — Du premier trou foré au bourrage de précision et contrôle de sécurité du front.
            </p>
          </div>
        </div>

        {/* Search Bar & Category Filters */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Rechercher un module, mot-clé..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-amber-500 transition-colors"
              />
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
              {[
                { id: 'all', label: '🎓 Tous les modules (6)' },
                { id: 'schema', label: '🎯 Schémas de Forage (3)' },
                { id: 'explosifs', label: '💣 Explosifs & Tir (1)' },
                { id: 'securite', label: '🛡️ Sécurité & Purge (1)' },
                { id: 'diagnostic', label: '📊 Diagnostic Volée (1)' },
              ].map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-slate-900 text-amber-400 shadow-md border border-amber-400/40'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredModules.map((mod) => (
            <div
              key={mod.id}
              onClick={() => setActiveModule(mod.id)}
              className="cursor-pointer bg-white border-2 border-slate-200 hover:border-amber-400/80 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 relative flex flex-col justify-between group min-h-[500px]"
            >
              {/* Top & Bottom Gold Gradient Accents */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600" />
              <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-500" />

              <div className="p-7 space-y-5 flex-1 flex flex-col justify-between">
                
                {/* Module Category & Level Badges */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className={`${mod.badgeBg} ${mod.badgeText} text-[9px] font-black px-2.5 py-1 rounded-lg uppercase tracking-wider shadow-sm`}>
                      {mod.categoryLabel}
                    </span>
                    <span className="text-[10px] font-extrabold uppercase bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-md border border-slate-200">
                      NIVEAU : {mod.level}
                    </span>
                  </div>

                  <div>
                    <h2 className="text-xl font-black uppercase tracking-tight text-slate-900 group-hover:text-amber-600 transition-colors">
                      {mod.title}
                    </h2>
                    <p className="text-xs font-bold uppercase text-amber-600 tracking-wider mt-0.5">
                      {mod.subtitle}
                    </p>
                  </div>
                </div>

                {/* Preview Thumbnail Graphic / Diagram */}
                <div className="bg-slate-950 rounded-2xl p-4 flex items-center justify-center relative border border-slate-800 h-36 overflow-hidden shadow-inner">
                  {mod.schemaType ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <FormationSchemaViewer gabarit={mod.schemaType} highlightStep="tous" className="w-full h-full max-h-28 opacity-90 group-hover:opacity-100 transition-opacity" />
                    </div>
                  ) : mod.category === 'explosifs' ? (
                    <div className="flex flex-col items-center justify-center text-amber-400 space-y-1">
                      <Flame className="w-10 h-10 animate-pulse" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">ANFO • TOVEX • BOURRAGE 76CM</span>
                    </div>
                  ) : mod.category === 'securite' ? (
                    <div className="flex flex-col items-center justify-center text-rose-500 space-y-1">
                      <ShieldAlert className="w-10 h-10" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">AÉRAGE • PURGE • CULOTS 20CM</span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center text-indigo-400 space-y-1">
                      <BarChart3 className="w-10 h-10" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">MUCKPILE • D50 • OVERBREAK</span>
                    </div>
                  )}
                </div>

                {/* Learning Objectives List */}
                <div className="space-y-2">
                  <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider block">
                    OBJECTIFS PÉDAGOGIQUES CLÉS :
                  </span>
                  <div className="space-y-1.5 text-xs text-slate-700 font-medium">
                    {mod.objectives.map((obj, oIdx) => (
                      <div key={oIdx} className="flex items-start gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
                        <span className="leading-snug">{obj}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Module Metadata Metrics Bar */}
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs font-bold text-slate-700">
                  <div className="flex items-center gap-1.5 bg-slate-50 p-2 rounded-xl">
                    <Clock className="w-3.5 h-3.5 text-amber-500" />
                    <span>{mod.duration}</span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-50 p-2 rounded-xl">
                    <BookOpen className="w-3.5 h-3.5 text-amber-500" />
                    <span>{mod.slidesCount} Slides + Quiz</span>
                  </div>
                </div>

                {/* CTA Action Button */}
                <div className="pt-2">
                  <div className="w-full py-3 px-4 bg-slate-900 group-hover:bg-amber-500 text-white group-hover:text-slate-950 rounded-xl text-center text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all border border-amber-400/30 shadow-md">
                    DÉMARRER LA FORMATION
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1.5" />
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>

        {/* Bottom Educational Quality Footer */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center space-y-3 shadow-sm">
          <div className="inline-flex items-center gap-2 text-amber-600 font-black text-xs uppercase tracking-widest">
            <Award className="w-5 h-5" />
            STANDARDS PÉDAGOGIQUES VALIDÉS PAR LE BUREAU D'ÉTUDES SOU TERRAIN SMI
          </div>
          <p className="text-xs text-slate-600 font-medium max-w-3xl mx-auto leading-relaxed">
            Chaque module inclut des fiches d'instructions étape par étape, des calculs scientifiques d'ingénierie minière, des évaluations interactives par QCM et des synthèses mémotechniques téléchargeables.
          </p>
        </div>

      </div>
    </div>
  );
};

export default Formations;
