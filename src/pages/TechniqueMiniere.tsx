import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, 
  Layers, 
  Flame, 
  ShieldAlert, 
  Zap, 
  HelpCircle, 
  Compass, 
  CheckCircle, 
  ArrowRight, 
  Info,
  Wrench,
  Activity
} from 'lucide-react';
import logoImg from '../assets/images/hydromines_logo_1781337889277.jpg';

interface HoleInfo {
  id: string;
  name: string;
  x: number;
  y: number;
  type: 'vide' | 'charge' | 'g1' | 'g2' | 'g3' | 'g4' | 'radier' | 'parement' | 'voute';
  label: string;
  desc: string;
}

export const TechniqueMiniere: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'schema' | 'explosifs' | 'bourrage' | 'calculs' | 'ingenierie'>('schema');
  const [hoveredHole, setHoveredHole] = useState<HoleInfo | null>(null);

  // Onglet Ingénierie Interactive States
  const [selectedHoleComponent, setSelectedHoleComponent] = useState<'none' | 'amorce' | 'tovex' | 'anfo' | 'bourrage'>('none');
  const [blastStep, setBlastStep] = useState<number>(0);
  const [drillDepthInput, setDrillDepthInput] = useState<number>(1.7);
  const [numHolesInput, setNumHolesInput] = useState<number>(35);
  const [hasCorrectTamping, setHasCorrectTamping] = useState<boolean>(true);
  const [hasCorrectBouchon, setHasCorrectBouchon] = useState<boolean>(true);
  const [rodType, setRodType] = useState<'1.8' | '2.4'>('1.8');
  const [monthlyRounds, setMonthlyRounds] = useState<number>(24);
  const [pulledLength, setPulledLength] = useState<number>(1.61);
  const [bourrageMethod, setBourrageMethod] = useState<'scientific' | 'terrain'>('scientific');
  
  // Quiz
  const [quizAnswers, setQuizAnswers] = useState<Record<number, string>>({});
  const [quizSubmitted, setQuizSubmitted] = useState<boolean>(false);
  
  // Sub-tabs inside activeTab === 'ingenierie'
  const [subTab, setSubTab] = useState<'tiges' | 'ateliers' | 'experts_examen'>('tiges');

  const holes: HoleInfo[] = [
    // BOUCHON BRÛLÉ (9 TROUS) - SYSTEM : 6 CHARGÉS AUTOUR | 3 VIDES CENTRAUX (Center: X=500, Y=430)
    // Distance entre les colonnes est de 15cm (30px échelle SVG)
    { id: 'c1', name: 'Bouchon - Trou Chargé Gauche Haut (Délai 0)', x: 470, y: 400, type: 'charge', label: '0', desc: 'Trou d\'amorçage gauche supérieur (Amorce n°0, 0ms). Pousse la roche vers les vides centraux.' },
    { id: 'c2', name: 'Bouchon - Trou Chargé Gauche Milieu (Délai 0)', x: 470, y: 430, type: 'charge', label: '0', desc: 'Trou d\'amorçage gauche central (Amorce n°0, 0ms). Cisaillage direct vers le vide central.' },
    { id: 'c3', name: 'Bouchon - Trou Chargé Gauche Bas (Délai 0)', x: 470, y: 460, type: 'charge', label: '0', desc: 'Trou d\'amorçage gauche inférieur (Amorce n°0, 0ms). Libère la semelle gauche du bouchon brûlé.' },

    { id: 'v1', name: 'Bouchon - Trou Vide Central Haut', x: 500, y: 400, type: 'vide', label: 'V', desc: 'Trou de décharge central supérieur (non chargé). Offre l\'espace de décompression immédiat.' },
    { id: 'v2', name: 'Bouchon - Trou Vide Central Milieu', x: 500, y: 430, type: 'vide', label: 'V', desc: 'Trou d\'expansion central principal (non chargé). Épicentre de la décompression du massif.' },
    { id: 'v3', name: 'Bouchon - Trou Vide Central Bas', x: 500, y: 460, type: 'vide', label: 'V', desc: 'Trou de décharge central inférieur (non chargé). Reçoit les débris gravitaires initiaux.' },

    { id: 'c4', name: 'Bouchon - Trou Chargé Droit Haut (Délai 0)', x: 530, y: 400, type: 'charge', label: '0', desc: 'Trou d\'amorçage droit supérieur (Amorce n°0, 0ms). Pousse symétriquement vers le centre vide.' },
    { id: 'c5', name: 'Bouchon - Trou Chargé Droit Milieu (Délai 0)', x: 530, y: 430, type: 'charge', label: '0', desc: 'Trou d\'amorçage droit central (Amorce n°0, 0ms). Crée la ligne de cisaillement droite.' },
    { id: 'c6', name: 'Bouchon - Trou Chargé Droit Bas (Délai 0)', x: 530, y: 460, type: 'charge', label: '0', desc: 'Trou d\'amorçage droit inférieur (Amorce n°0, 0ms). Libère la semelle droite du bouchon.' },

    // GROUPE 1 (BLEU, DÉLAI 1 - 25ms) - 4 COINS DU CARRÉ DIAG-INTERNE
    { id: 'g1_1', name: 'Groupe d\'Élargissement 1 - HG', x: 430, y: 360, type: 'g1', label: '1', desc: 'Groupe d\'élargissement 1 (Détonateur n°1, 25ms). Élargit la cavité primaire de manière concentrique.' },
    { id: 'g1_2', name: 'Groupe d\'Élargissement 1 - HD', x: 570, y: 360, type: 'g1', label: '1', desc: 'Groupe d\'élargissement 1 (Détonateur n°1, 25ms). Casse les structures d\'angle supérieures.' },
    { id: 'g1_3', name: 'Groupe d\'Élargissement 1 - BG', x: 430, y: 500, type: 'g1', label: '1', desc: 'Groupe d\'élargissement 1 (Détonateur n°1, 25ms). Facilite l\'évacuation gravitaire vers le centre vide.' },
    { id: 'g1_4', name: 'Groupe d\'Élargissement 1 - BD', x: 570, y: 500, type: 'g1', label: '1', desc: 'Groupe d\'élargissement 1 (Détonateur n°1, 25ms). Équilibre le profil de découpe interne.' },

    // GROUPE 2 (ROUGE, DÉLAI 2 - 50ms) - 4 BRAS DE LA PETITE CROIX AXIALE
    { id: 'g2_1', name: 'Groupe d\'Élargissement 2 - Gauche', x: 340, y: 430, type: 'g2', label: '2', desc: 'Groupe d\'élargissement 2 (Détonateur n°2, 50ms). Pousse le massif vers la grande cavité centrale libérée.' },
    { id: 'g2_2', name: 'Groupe d\'Élargissement 2 - Droite', x: 660, y: 430, type: 'g2', label: '2', desc: 'Groupe d\'élargissement 2 (Détonateur n°2, 50ms). Progression d\'abattage symétrique droite.' },
    { id: 'g2_3', name: 'Groupe d\'Élargissement 2 - Haut', x: 500, y: 280, type: 'g2', label: '2', desc: 'Groupe d\'élargissement 2 (Détonateur n°2, 50ms). Prépare l\'arrachage de la section voûte intermédiaire.' },
    { id: 'g2_4', name: 'Groupe d\'Élargissement 2 - Bas', x: 500, y: 580, type: 'g2', label: '2', desc: 'Groupe d\'élargissement 2 (Détonateur n°2, 50ms). Soulage le travail des trous de radier.' },

    // GROUPE 3 (BLEU CIEL, DÉLAI 3 - 75ms) - 4 COINS DU GRAND CARRÉ DIAG-EXTERNE
    { id: 'g3_1', name: 'Groupe d\'Élargissement 3 - HG', x: 260, y: 240, type: 'g3', label: '3', desc: 'Groupe d\'élargissement 3 (Détonateur n°3, 75ms). Atteint les limites diagonales supérieures du massif.' },
    { id: 'g3_2', name: 'Groupe d\'Élargissement 3 - HD', x: 740, y: 240, type: 'g3', label: '3', desc: 'Groupe d\'élargissement 3 (Détonateur n°3, 75ms). Découpe l\'épaulement diagonal droit.' },
    { id: 'g3_3', name: 'Groupe d\'Élargissement 3 - BG', x: 260, y: 555, type: 'g3', label: '3', desc: 'Groupe d\'élargissement 3 (Détonateur n°3, 75ms). Nettoie l\'angle d\'épaulement bas gauche.' },
    { id: 'g3_4', name: 'Groupe d\'Élargissement 3 - BD', x: 740, y: 555, type: 'g3', label: '3', desc: 'Groupe d\'élargissement 3 (Détonateur n°3, 75ms). Nettoie l\'angle d\'épaulement bas droit.' },

    // GROUPE 4 (ORANGE, DÉLAI 4 - 100ms) - 4 BRAS DE LA GRANDE CROIX AXIALE
    { id: 'g4_1', name: 'Groupe d\'Élargissement 4 - Gauche', x: 180, y: 430, type: 'g4', label: '4', desc: 'Groupe d\'élargissement 4 (Détonateur n°4, 100ms). Dégage la partie médiane gauche avant le tir de parement.' },
    { id: 'g4_2', name: 'Groupe d\'Élargissement 4 - Droite', x: 820, y: 430, type: 'g4', label: '4', desc: 'Groupe d\'élargissement 4 (Détonateur n°4, 100ms). Dégage la partie médiane droite avant le tir de parement.' },
    { id: 'g4_3', name: 'Groupe d\'Élargissement 4 - Haut', x: 500, y: 170, type: 'g4', label: '4', desc: 'Groupe d\'élargissement 4 (Détonateur n°4, 100ms). Crée un espace d\'éjection vertical juste sous la voûte.' },
    { id: 'g4_4', name: 'Groupe d\'Élargissement 4 - Bas', x: 500, y: 615, type: 'g4', label: '4', desc: 'Groupe d\'élargissement 4 (Détonateur n°4, 100ms). Nettoie l\'assise médiane du plancher.' },

    // RADIER (VIOLET, DÉLAI 5 - 125ms) - PLANCHER DE GALERIE
    { id: 'rad1', name: 'Trou de Radier 1', x: 160, y: 635, type: 'radier', label: 'R', desc: 'Trou de Radier (Détonateur n°5, 125ms). Creuse l\'angle bas gauche du plancher de la galerie.' },
    { id: 'rad2', name: 'Trou de Radier 2', x: 385, y: 635, type: 'radier', label: 'R', desc: 'Trou de Radier (Détonateur n°5, 125ms). Assure le plat central gauche du plancher.' },
    { id: 'rad3', name: 'Trou de Radier 3', x: 615, y: 635, type: 'radier', label: 'R', desc: 'Trou de Radier (Détonateur n°5, 125ms). Assure le plat central droit du plancher.' },
    { id: 'rad4', name: 'Trou de Radier 4', x: 840, y: 635, type: 'radier', label: 'R', desc: 'Trou de Radier (Détonateur n°5, 125ms). Creuse l\'angle bas droit du plancher.' },

    // PAREMENT GAUCHE (VERT TEAL, DÉLAI 5 - 125ms) - PAROI GAUCHE
    { id: 'pg1', name: 'Trou de Parement Gauche 1', x: 125, y: 570, type: 'parement', label: 'PG', desc: 'Trou de Parement Gauche (Détonateur n°5, 125ms). Profilage bas de la paroi verticale gauche.' },
    { id: 'pg2', name: 'Trou de Parement Gauche 2', x: 125, y: 450, type: 'parement', label: 'PG', desc: 'Trou de Parement Gauche (Détonateur n°5, 125ms). Calibrage milieu de la paroi verticale gauche.' },
    { id: 'pg3', name: 'Trou de Parement Gauche 3', x: 140, y: 330, type: 'parement', label: 'PG', desc: 'Trou de Parement Gauche (Détonateur n°5, 125ms). Raccordement de la paroi gauche au départ de voûte.' },

    // PAREMENT DROIT (VERT TEAL, DÉLAI 5 - 125ms) - PAROI DROITE
    { id: 'pd1', name: 'Trou de Parement Droit 1', x: 875, y: 570, type: 'parement', label: 'PD', desc: 'Trou de Parement Droit (Détonateur n°5, 125ms). Profilage bas de la paroi verticale droite.' },
    { id: 'pd2', name: 'Trou de Parement Droit 2', x: 875, y: 450, type: 'parement', label: 'PD', desc: 'Trou de Parement Droit (Détonateur n°5, 125ms). Calibrage milieu de la paroi verticale droite.' },
    { id: 'pd3', name: 'Trou de Parement Droit 3', x: 860, y: 330, type: 'parement', label: 'PD', desc: 'Trou de Parement Droit (Détonateur n°5, 125ms). Raccordement de la paroi droite au départ de voûte.' },

    // VOÛTE (ROSE/ROUGE, DÉLAI 5 - 125ms) - COURONNE DE GALERIE
    { id: 'vc', name: 'Trou de Voûte Centrale', x: 500, y: 80, type: 'voute', label: 'VC', desc: 'Trou de Voûte Centrale (Détonateur n°5, 125ms). Clé de voûte théorique garantissant la stabilité de la couronne.' },
    { id: 'vl1', name: 'Trou de Voûte Latérale Gauche', x: 250, y: 200, type: 'voute', label: 'VL', desc: 'Trou de Voûte Latérale (Détonateur n°5, 125ms). Calibrage de l\'arc de couronne côté gauche.' },
    { id: 'vl2', name: 'Trou de Voûte Latérale Droite', x: 750, y: 200, type: 'voute', label: 'VL', desc: 'Trou de Voûte Latérale (Détonateur n°5, 125ms). Calibrage de l\'arc de couronne côté droit.' }
  ];

  const getHoleStyles = (type: string) => {
    switch (type) {
      case 'vide':
        return { stroke: '#0f172a', fill: '#ffffff', strokeWidth: 3, r: 15, labelColor: '#1e293b' };
      case 'charge':
        return { stroke: '#0f172a', fill: '#1e293b', strokeWidth: 2, r: 15, labelColor: '#ffffff' };
      case 'g1':
        return { stroke: '#2563eb', fill: '#3b82f6', strokeWidth: 2, r: 13, labelColor: '#ffffff' };
      case 'g2':
        return { stroke: '#dc2626', fill: '#ef4444', strokeWidth: 2, r: 13, labelColor: '#ffffff' };
      case 'g3':
        return { stroke: '#0891b2', fill: '#06b6d4', strokeWidth: 2, r: 13, labelColor: '#ffffff' };
      case 'g4':
        return { stroke: '#ea580c', fill: '#f97316', strokeWidth: 2, r: 13, labelColor: '#ffffff' };
      case 'radier':
        return { stroke: '#7c3aed', fill: '#8b5cf6', strokeWidth: 2, r: 13, labelColor: '#ffffff' };
      case 'parement':
        return { stroke: '#0d9488', fill: '#14b8a6', strokeWidth: 2, r: 12, labelColor: '#ffffff' };
      case 'voute':
        return { stroke: '#be123c', fill: '#f43f5e', strokeWidth: 2, r: 13, labelColor: '#ffffff' };
      default:
        return { stroke: '#64748b', fill: '#94a3b8', strokeWidth: 2, r: 13, labelColor: '#ffffff' };
    }
  };

  return (
    <div className="w-full space-y-6" id="technique-miniere-page">
      {/* HEADER */}
      <div 
        id="technique-miniere-header-banner" 
        className="bg-white p-6 md:p-8 border border-[#e2e8f0] rounded-[16px] w-full shadow-sm"
        style={{ boxShadow: '0 4px 20px -2px rgba(184, 134, 11, 0.04), 0 1px 3px rgba(0,0,0,0.05)' }}
      >
        <div className="flex flex-col lg:flex-row items-stretch justify-between gap-6">
          {/* Left Column: Logo Hydromines */}
          <div className="flex-shrink-0 flex items-center justify-center animate-fade-in self-center lg:self-stretch">
            <img 
              src={logoImg} 
              alt="HydroMines Logo" 
              className="h-28 w-28 sm:h-32 sm:w-32 md:h-36 md:w-36 object-contain hover:scale-105 transition-transform duration-300 ease-out select-none" 
              referrerPolicy="no-referrer" 
            />
          </div>

          {/* Centered Column: Gold title and subtitle */}
          <div className="flex-1 flex flex-col justify-center items-center text-center space-y-3.5 max-w-2xl px-2">
            <div className="subtle-glow-line w-full opacity-80" />
            
            <h1 className="gold-title my-1 select-none text-[15px] sm:text-lg md:text-[20px] lg:text-[22px] tracking-[0.06em] whitespace-normal sm:whitespace-nowrap leading-none">
              TECHNIQUE MINIÈRE — SMI IMITER
            </h1>
            
            <div className="subtle-glow-line w-full opacity-80" />
            
            <div className="flex flex-wrap items-center justify-center gap-2.5 mt-1">
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-slate-900 text-amber-400 border border-amber-400/30 shadow-[0_2px_10px_rgba(251,191,36,0.1)]">
                ⚙️ FORAGE & TIR DE PERFORMANCE
              </span>
              <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-amber-50 text-amber-800 border border-amber-200">
                GALERIES DE SÉCURITÉ 12m²
              </span>
            </div>
          </div>

          {/* Right Column: Confidential tags */}
          <div className="flex-shrink-0 flex flex-col justify-center items-center lg:items-end text-center lg:text-right gap-1.5 min-w-[140px] border-t lg:border-t-0 lg:border-l border-slate-100 pt-4 lg:pt-0 lg:pl-6">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
              CONFIDENTIEL TECHNIQUE
            </span>
            <span className="text-xs font-black text-slate-800 uppercase tracking-wider block">
              SMI — HYDROMINES
            </span>
          </div>
        </div>
      </div>

      {/* NAVIGATION TABS WITH HYDROMINES BRANDING */}
      <div className="flex flex-wrap gap-3 border-b border-slate-200 pb-4">
        {[
          { id: 'schema', label: '🗺️ Plan de Tir' },
          { id: 'explosifs', label: '💥 Explosifs' },
          { id: 'bourrage', label: '🔩 Bourrage' },
          { id: 'calculs', label: '📐 Calculs' },
          { id: 'ingenierie', label: '🏆 Ingénierie Hydromines' }
        ].map(tab => {
          const isActive = activeTab === tab.id;
          const isIngenierie = tab.id === 'ingenierie';
          
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as any);
                setHoveredHole(null);
              }}
              className={`px-5 py-3 rounded-xl font-black text-xs uppercase tracking-wide transition-all duration-300 cursor-pointer relative ${
                isActive
                  ? isIngenierie
                    ? 'bg-[#0ea5e9] text-white border-2 border-[#0ea5e9] scale-105'
                    : 'bg-[#991b1b] text-white'
                  : 'bg-white border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
              style={
                isActive && isIngenierie
                  ? {
                      textShadow: '0 0 10px rgba(255, 255, 255, 1), 0 0 20px rgba(255, 255, 255, 0.8)',
                      boxShadow: 'none', // No box shadow, only text glow
                    }
                  : {}
              }
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* TABS CONTENT */}
      <AnimatePresence mode="wait">
        {activeTab === 'schema' && (
          <motion.div
            key="schema"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 xl:grid-cols-12 gap-6"
          >
            {/* LEFT DETAILS COLUMN */}
            <div className="xl:col-span-4 space-y-6">
              <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-xs space-y-4">
                <h3 className="text-base font-black uppercase text-slate-900 border-b border-slate-100 pb-2">
                  Le Bouchon Brûlé — Créer le Vide Initial
                </h3>
                <p className="text-sm font-semibold text-slate-700 leading-relaxed">
                  En galerie souterraine, la roche n'a aucune face libre naturelle. Le bouchon brûlé résout ce problème en créant artificiellement un vide au centre de la taille, qui devient la première face libre pour tous les groupes suivants.
                </p>
                <div className="space-y-3 pt-2">
                  <div className="bg-slate-50 border-l-4 border-slate-800 p-4 rounded-r-xl">
                    <p className="text-xs font-black uppercase text-slate-900">9 trous au total</p>
                    <p className="text-xs text-slate-600 mt-1 font-semibold leading-relaxed">
                      3 VIDES CENTRAUX (non chargés) + 6 CHARGÉS (TOVEX au fond + ANFO) aux extrémités
                    </p>
                  </div>
                  <div className="bg-slate-50 border-l-4 border-slate-800 p-4 rounded-r-xl">
                    <p className="text-xs font-black uppercase text-slate-900">Pourquoi 3 trous vides au milieu ?</p>
                    <p className="text-xs text-slate-600 mt-1 font-semibold leading-relaxed">
                      Le vide parfait est garanti au centre. Les 6 trous chargés autour vont fracturer et éjecter la roche vers ce couloir central vide de moindre résistance, créant l'expansion nécessaire sans compactage.
                    </p>
                  </div>
                  <div className="bg-slate-50 border-l-4 border-slate-800 p-4 rounded-r-xl">
                    <p className="text-xs font-black uppercase text-slate-900">Pourquoi amorcer au fond du trou ?</p>
                    <p className="text-xs text-slate-600 mt-1 font-semibold leading-relaxed">
                      L'amorce (détonateur électrique dans la cartouche de Tovex) doit TOUJOURS être placée au fond du trou. Cela dirige l'onde de choc vers l'extérieur (le col du trou), assurant l'extraction complète de la roche sur toute la longueur forée et éliminant les culs de sac.
                    </p>
                  </div>
                </div>
              </div>

              {/* HOVER DETAILS PANEL */}
              <div className="bg-white border-2 border-[#e2e8f0] text-slate-800 p-6 rounded-3xl shadow-sm min-h-[180px] flex flex-col justify-between">
                <div>
                  <h4 className="text-[10px] font-black uppercase text-[#991b1b] tracking-wider mb-2">
                    Détail du Trou (Interactivité)
                  </h4>
                  {hoveredHole ? (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span 
                          className="w-3.5 h-3.5 rounded-full inline-block border" 
                          style={{ 
                            backgroundColor: getHoleStyles(hoveredHole.type).fill,
                            borderColor: getHoleStyles(hoveredHole.type).stroke 
                          }} 
                        />
                        <h5 className="text-sm font-black uppercase tracking-wide text-slate-950">
                          {hoveredHole.name}
                        </h5>
                      </div>
                      <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                        {hoveredHole.desc}
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 text-slate-400 py-6">
                      <Compass className="w-8 h-8 shrink-0 animate-pulse text-slate-400" />
                      <p className="text-xs font-black uppercase tracking-wide">
                        Passez le curseur sur un trou du schéma interactif pour voir ses caractéristiques techniques
                      </p>
                    </div>
                  )}
                </div>
                {hoveredHole && (
                  <div className="text-[9px] font-black uppercase text-slate-500 text-right mt-4 tracking-widest">
                    Code: {hoveredHole.label} | Rayon: {getHoleStyles(hoveredHole.type).r}px
                  </div>
                )}
              </div>
            </div>

            {/* INTERACTIVE SVG PLAN DE TIR COLUMN */}
            <div className="xl:col-span-8 flex flex-col items-center">
              <div className="w-full bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col items-center">
                <div className="w-full flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                  <h3 className="text-xs font-black uppercase text-slate-800 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-slate-600" /> VUE DE FACE MINIÈRE — GALERIE 12m²
                  </h3>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-600" />
                      <span className="text-[10px] font-black uppercase text-slate-500">Chargé</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-2.5 h-2.5 rounded-full bg-white border border-[#1a5276]" />
                      <span className="text-[10px] font-black uppercase text-slate-500">Vide</span>
                    </div>
                  </div>
                </div>

                <div className="w-full max-w-[800px] aspect-[1000/750] bg-slate-150 border border-slate-200 rounded-2xl relative overflow-hidden shadow-inner">
                  <svg 
                    viewBox="0 0 1000 750" 
                    className="w-full h-full"
                  >
                    {/* ROCK BACKGROUND TEXTURE */}
                    <rect width="1000" height="750" fill="#f8fafc" />
                    <rect width="1000" height="750" fill="url(#rock-pattern)" opacity="0.15" />
                    
                    <defs>
                      <pattern id="rock-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 0,10 L 40,30 M 20,0 L 20,40 M 0,35 L 40,15" stroke="#94a3b8" strokeWidth="1" strokeDasharray="2 4" />
                      </pattern>
                    </defs>
                    
                    {/* TUNNEL EXCAVATION AREA (WHITE SOLID FILL FOR CONTRAST) */}
                    <path 
                      d="M 100 650 L 100 450 A 400 400 0 0 1 900 450 L 900 650 Z" 
                      fill="#ffffff" 
                      stroke="#0f172a" 
                      strokeWidth="4" 
                    />
                    
                    {/* GEOTECHNICAL SECURITY INNER LIMITS (DASHED CAD SCALES) */}
                    <path 
                      d="M 130 650 L 130 450 A 370 370 0 0 1 870 450 L 870 650" 
                      fill="none" 
                      stroke="#cbd5e1" 
                      strokeWidth="1.5" 
                      strokeDasharray="6 6" 
                    />
                    <path 
                      d="M 160 650 L 160 450 A 340 340 0 0 1 840 450 L 840 650" 
                      fill="none" 
                      stroke="#e2e8f0" 
                      strokeWidth="1.5" 
                      strokeDasharray="6 6" 
                    />

                    {/* BASE FLOOR SOLID BLOCK */}
                    <rect x="100" y="650" width="800" height="25" fill="#0f172a" opacity="0.9" />
                    <line x1="100" y1="650" x2="900" y2="650" stroke="#0f172a" strokeWidth="4" />
                    
                    {/* HOLES DRAWING */}
                    {holes.map((hole) => {
                      const style = getHoleStyles(hole.type);
                      const isHovered = hoveredHole?.id === hole.id;
                      return (
                        <g 
                          key={hole.id}
                          className="cursor-pointer"
                          onMouseEnter={() => setHoveredHole(hole)}
                          onMouseLeave={() => setHoveredHole(null)}
                        >
                          <circle 
                            cx={hole.x} 
                            cy={hole.y} 
                            r={isHovered ? style.r + 4 : style.r} 
                            fill={style.fill} 
                            stroke={style.stroke} 
                            strokeWidth={isHovered ? style.strokeWidth + 1.5 : style.strokeWidth}
                            className="transition-all duration-150"
                          />
                          <text 
                            x={hole.x} 
                            y={hole.y + 3.5} 
                            textAnchor="middle" 
                            fontSize={isHovered ? "11" : "9"} 
                            fontWeight="900" 
                            fill={style.labelColor}
                            className="select-none pointer-events-none transition-all duration-150 font-sans"
                          >
                            {hole.label}
                          </text>
                        </g>
                      );
                    })}

                    {/* CAD DIMENSION LINES — WIDTH (LARGEUR) */}
                    <line x1="100" y1="650" x2="100" y2="720" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3 3" />
                    <line x1="900" y1="650" x2="900" y2="720" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3 3" />
                    <line x1="100" y1="710" x2="900" y2="710" stroke="#0f172a" strokeWidth="1.5" />
                    {/* ARROWS FOR WIDTH */}
                    <polygon points="100,710 115,705 115,715" fill="#0f172a" />
                    <polygon points="900,710 885,705 885,715" fill="#0f172a" />
                    
                    {/* CAD DIMENSION LINES — HEIGHT (HAUTEUR) */}
                    <line x1="100" y1="650" x2="30" y2="650" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3 3" />
                    <line x1="100" y1="50" x2="30" y2="50" stroke="#94a3b8" strokeWidth="1.5" strokeDasharray="3 3" />
                    <line x1="40" y1="50" x2="40" y2="650" stroke="#0f172a" strokeWidth="1.5" />
                    {/* ARROWS FOR HEIGHT */}
                    <polygon points="40,50 35,65 45,65" fill="#0f172a" />
                    <polygon points="40,650 35,635 45,635" fill="#0f172a" />

                    {/* LABEL TEXTS FOR DIMENSIONS */}
                    <rect x="400" y="698" width="200" height="24" rx="6" fill="#0f172a" />
                    <text x="500" y="715" textAnchor="middle" fontSize="11" fontWeight="900" fill="#ffffff" className="uppercase tracking-widest">
                      Largeur : 4.0 m
                    </text>
                    
                    <g transform="rotate(-90 25 350)">
                      <rect x="-75" y="13" width="200" height="24" rx="6" fill="#0f172a" />
                      <text x="25" y="30" textAnchor="middle" fontSize="11" fontWeight="900" fill="#ffffff" className="uppercase tracking-widest">
                        Hauteur : 3.0 m
                      </text>
                    </g>
                  </svg>
                </div>

                <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-center mt-4">
                  <span className="text-[10px] font-black uppercase text-slate-700 tracking-wider">
                    TOTAL : 38 TROUS | Bouchon: 9 | Groupes 1-4: 16 | Radier: 4 | Parements: 6 | Voûte: 3
                  </span>
                </div>
              </div>
            </div>

            {/* TABLE SUMMARY */}
            <div className="xl:col-span-12">
              <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
                <div className="bg-gradient-to-r from-[#991b1b] to-[#0ea5e9] px-6 py-4">
                  <h3 className="text-xs font-black uppercase text-white tracking-widest">
                    TABLEAU RÉCAPITULATIF DES GROUPES DE TIR (SMI IMITER)
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left">
                    <thead>
                      <tr className="bg-slate-100 border-b border-slate-200">
                        <th className="px-6 py-3.5 text-xs font-black uppercase text-slate-700">Groupe</th>
                        <th className="px-6 py-3.5 text-xs font-black uppercase text-slate-700 text-center">Nb Trous</th>
                        <th className="px-6 py-3.5 text-xs font-black uppercase text-slate-700 text-center">Détonateur</th>
                        <th className="px-6 py-3.5 text-xs font-black uppercase text-slate-700">Distance Centre</th>
                        <th className="px-6 py-3.5 text-xs font-black uppercase text-slate-700">Explosif</th>
                        <th className="px-6 py-3.5 text-xs font-black uppercase text-slate-700">Rôle</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-semibold text-xs text-slate-700">
                      <tr>
                        <td className="px-6 py-4 font-black uppercase text-slate-900">Bouchon</td>
                        <td className="px-6 py-4 text-center">9</td>
                        <td className="px-6 py-4 text-center">n°0</td>
                        <td className="px-6 py-4">Centre (X=500)</td>
                        <td className="px-6 py-4">3 Vides (0g) / 6 Chargés (1 TOVEX/trou + ANFO)</td>
                        <td className="px-6 py-4">Créer le vide initial (Cisaillement optimal vers le milieu vide)</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 font-black uppercase text-slate-900">Groupe 1</td>
                        <td className="px-6 py-4 text-center">4</td>
                        <td className="px-6 py-4 text-center">n°1</td>
                        <td className="px-6 py-4">~350mm</td>
                        <td className="px-6 py-4">ANFO</td>
                        <td className="px-6 py-4">Élargir vide → 600mm</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 font-black uppercase text-slate-900">Groupe 2</td>
                        <td className="px-6 py-4 text-center">4</td>
                        <td className="px-6 py-4 text-center">n°2</td>
                        <td className="px-6 py-4">~600mm</td>
                        <td className="px-6 py-4">ANFO</td>
                        <td className="px-6 py-4">Élargir vide → 1.0m</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 font-black uppercase text-slate-900">Groupe 3</td>
                        <td className="px-6 py-4 text-center">4</td>
                        <td className="px-6 py-4 text-center">n°3</td>
                        <td className="px-6 py-4">~950mm</td>
                        <td className="px-6 py-4">ANFO</td>
                        <td className="px-6 py-4">Élargir vide → 1.6m</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 font-black uppercase text-slate-900">Groupe 4</td>
                        <td className="px-6 py-4 text-center">4</td>
                        <td className="px-6 py-4 text-center">n°4</td>
                        <td className="px-6 py-4">~1350mm</td>
                        <td className="px-6 py-4">ANFO</td>
                        <td className="px-6 py-4">Préparer contour</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 font-black uppercase text-slate-900">Radier</td>
                        <td className="px-6 py-4 text-center">4</td>
                        <td className="px-6 py-4 text-center">n°5</td>
                        <td className="px-6 py-4">Plancher</td>
                        <td className="px-6 py-4">ANFO</td>
                        <td className="px-6 py-4">Profil sol</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 font-black uppercase text-slate-900">Parements</td>
                        <td className="px-6 py-4 text-center">6</td>
                        <td className="px-6 py-4 text-center">n°5</td>
                        <td className="px-6 py-4">Parois</td>
                        <td className="px-6 py-4">ANFO</td>
                        <td className="px-6 py-4">Profil murs</td>
                      </tr>
                      <tr>
                        <td className="px-6 py-4 font-black uppercase text-slate-900">Voûte</td>
                        <td className="px-6 py-4 text-center">3</td>
                        <td className="px-6 py-4 text-center">n°5</td>
                        <td className="px-6 py-4">Couronne</td>
                        <td className="px-6 py-4">ANFO</td>
                        <td className="px-6 py-4 text-slate-900 font-extrabold">Profil voûte (SÉCURITÉ)</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                <div className="bg-red-50 border-t border-red-200 p-4">
                  <p className="text-xs font-black uppercase text-red-600 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4 text-red-500 shrink-0" /> La voûte est critique pour la sécurité. Un trou central mal positionné = voûte irrégulière = risque d'écaillage sur les mineurs. Le trou central doit être foré exactement à la clé de voûte théorique.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'explosifs' && (
          <motion.div
            key="explosifs"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6"
          >
            {/* ANFO CARD */}
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs flex flex-col justify-between">
              <div>
                <div className="bg-slate-800 text-white p-5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🏭</span>
                    <div>
                      <h3 className="text-sm font-black uppercase">ANFO</h3>
                      <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest mt-0.5">MÉLANGE EN VRAC</p>
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-slate-900 text-white text-[9px] font-black uppercase rounded-md border border-slate-700">
                    CHARGE PRINCIPALE
                  </span>
                </div>
                <div className="p-6 space-y-4">
                  <div className="space-y-1 text-xs">
                    <p className="text-[10px] font-black uppercase text-slate-400">Composition :</p>
                    <p className="font-extrabold text-slate-800">94% nitrate d'ammonium + 6% fioul</p>
                  </div>
                  <div className="space-y-1 text-xs">
                    <p className="text-[10px] font-black uppercase text-slate-400">Densité :</p>
                    <p className="font-extrabold text-slate-800">0.85 g/cm³</p>
                  </div>
                  <div className="space-y-1 text-xs">
                    <p className="text-[10px] font-black uppercase text-slate-400">Vitesse de détonation :</p>
                    <p className="font-extrabold text-slate-800">4 500 m/s</p>
                  </div>
                  <div className="space-y-1 text-xs">
                    <p className="text-[10px] font-black uppercase text-slate-400">Forme :</p>
                    <p className="font-extrabold text-slate-800">Granulés secs — se verse directement</p>
                  </div>
                  <div className="space-y-2 pt-2 text-xs font-semibold">
                    <p className="text-emerald-700 flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500" /> Économique et puissant
                    </p>
                    <p className="text-emerald-700 flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500" /> Sûr à manipuler (insensible aux chocs)
                    </p>
                    <p className="text-red-700 flex items-center gap-1.5 bg-red-50 p-2.5 rounded-lg border border-red-100 mt-2">
                      <ShieldAlert className="w-4 h-4 shrink-0 text-red-500" /> SENSIBLE À L'HUMIDITÉ
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-slate-50 p-5 border-t border-slate-100 text-xs font-bold text-slate-650 leading-relaxed space-y-1">
                <p className="text-[9px] font-black uppercase text-slate-400">Utilisation SMI :</p>
                <p>Groupes 1 à 4, Radier, Parements, Voûte</p>
                <p className="text-[10px] font-black uppercase text-slate-500 italic mt-1 leading-normal">
                  "Si le trou est mouillé → l'ANFO se dissout et ne détone plus. Utiliser TOVEX à la place."
                </p>
              </div>
            </div>

             {/* TOVEX CARD */}
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs flex flex-col justify-between">
              <div>
                <div className="bg-red-900 text-white p-5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">🧨</span>
                    <div>
                      <h3 className="text-sm font-black uppercase">TOVEX</h3>
                      <p className="text-[9px] font-bold text-red-200 uppercase tracking-widest mt-0.5">HYDROGEL EN CARTOUCHE</p>
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-red-950 text-white text-[9px] font-black uppercase rounded-md border border-red-850">
                    CARTOUCHE 100g
                  </span>
                </div>
                <div className="p-6 space-y-4">
                  <div className="space-y-1 text-xs">
                    <p className="text-[10px] font-black uppercase text-slate-400">Pourquoi TOVEX au fond ? :</p>
                    <p className="font-semibold text-slate-700 leading-relaxed">
                      L'amorce (capsule électrique) est logée à l'intérieur du TOVEX pour amorcer la colonne d'ANFO. Le TOVEX résiste à l'eau et détone à haute vitesse (5 000 m/s), transmettant une impulsion d'amorçage parfaite à l'ANFO même sous pression au fond du trou.
                    </p>
                  </div>
                  <div className="space-y-1 text-xs pt-1">
                    <p className="text-[10px] font-black uppercase text-slate-400">Résistance eau :</p>
                    <p className="font-extrabold text-slate-800">EXCELLENTE — fonctionne trou noyé</p>
                  </div>
                  <div className="space-y-2 pt-2 text-xs font-semibold">
                    <p className="text-emerald-700 flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500" /> Idéal pour le fond de chaque trou
                    </p>
                    <p className="text-emerald-700 flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500" /> Transmet la détonation à l'ANFO
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-red-50 p-5 border-t border-red-100 text-xs font-bold text-red-900 leading-relaxed space-y-1">
                <p className="text-[9px] font-black uppercase text-red-550">Comment charger les trous (Détails) :</p>
                <div className="text-[10px] font-black uppercase text-red-800 italic mt-1 leading-normal space-y-1.5">
                  <p className="font-extrabold border-b border-red-250 pb-1">SÉQUENCE DE CHARGEMENT PAR TROU :</p>
                  <p>1. Insérer la capsule électrique d'amorce au centre de la cartouche de TOVEX (1 cartouche/trou).</p>
                  <p>2. Descendre l'ensemble TOVEX + Amorce doucement tout au fond du trou de mine.</p>
                  <p>3. Ajouter ensuite la charge d'ANFO en granulés au-dessus de la cartouche.</p>
                  <p>4. Pourquoi ? L'onde de choc démarre du fond et pousse vers l'extérieur pour un arrachage optimal sans laisser de cul de sac rocheux.</p>
                </div>
              </div>
            </div>

            {/* AMORCES CARD */}
            <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs flex flex-col justify-between">
              <div>
                <div className="bg-stone-900 text-white p-5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">⚡</span>
                    <div>
                      <h3 className="text-sm font-black uppercase">AMORCES ÉLECTRIQUES</h3>
                      <p className="text-[9px] font-bold text-stone-400 uppercase tracking-widest mt-0.5">DÉTONATEURS TEMPORELS</p>
                    </div>
                  </div>
                  <span className="px-2 py-1 bg-stone-950 text-white text-[9px] font-black uppercase rounded-md border border-stone-850">
                    CAPSULES À DÉLAI
                  </span>
                </div>
                <div className="p-6 space-y-4">
                  <div className="space-y-1 text-xs">
                    <p className="text-[10px] font-black uppercase text-slate-400">Principe :</p>
                    <p className="font-extrabold text-slate-800">Courant électrique → pont pyrotechnique → détonation</p>
                  </div>
                  <div className="space-y-1 text-xs">
                    <p className="text-[10px] font-black uppercase text-slate-400">Numérotation :</p>
                    <p className="font-extrabold text-slate-800">n°0, 1, 2, 3, 4, 5... (délai croissant)</p>
                  </div>
                  <div className="space-y-1 text-xs">
                    <p className="text-[10px] font-black uppercase text-slate-400">Délai entre numéros :</p>
                    <p className="font-extrabold text-slate-800">25 à 100ms selon série</p>
                  </div>
                  <div className="space-y-2 pt-2 text-xs font-semibold">
                    <p className="text-emerald-700 flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500" /> Séquençage précis du tir
                    </p>
                    <p className="text-emerald-700 flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500" /> Détonation à distance sécurisée
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-stone-50 p-5 border-t border-stone-200 text-xs font-bold text-stone-800 leading-relaxed space-y-1">
                <p className="text-[9px] font-black uppercase text-stone-550">RÈGLES ABSOLUES :</p>
                <div className="text-[10px] font-black uppercase text-stone-700 italic space-y-0.5">
                  <p>- Ne jamais connecter avant d'avoir évacué</p>
                  <p>- Vérifier la continuité au galvanomètre</p>
                  <p>- Ne jamais utiliser 2 n°identiques dans un trou</p>
                  <p>- Circuit en série : somme résistances vérifiée</p>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'bourrage' && (
          <motion.div
            key="bourrage"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* WHY VITAL & PHYSICS OF GAS CONFINEMENT */}
            <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-xs space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[10px] font-black uppercase text-[#991b1b] tracking-wider block">Physique des Explosifs & Confinement des Gaz</span>
                  <h3 className="text-base font-black uppercase text-slate-900 mt-0.5">
                    Le Bourrage — Concentrateur d'Énergie Solide
                  </h3>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl font-mono text-xs text-slate-700 font-bold">
                  Formule d'étanchéité : <span className="text-[#991b1b] font-black">Lb = 20 × D_trou</span>
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                Lors de la détonation de l'ANFO, la réaction chimique transforme instantanément un solide en un volume massif de gaz à ultra-haute température et pression (plus de 50 000 atmosphères). Sans bourrage résistant au col du trou, ces gaz s'échappent à la vitesse du son par le col du trou (phénomène du <span className="text-rose-700 font-black">coup soufflé</span>). La roche de fond n'est alors pas fragmentée, et l'avancement linéaire de la volée chute de plus de 50%.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">❌</span>
                    <h4 className="text-xs font-black uppercase text-rose-800">Trou non bourré (ou mal bourré)</h4>
                  </div>
                  <div className="text-xs text-rose-700 font-bold space-y-1.5">
                    <p className="flex items-start gap-1.5">
                      <span className="text-rose-900 font-black">•</span>
                      <span>Les gaz chauds remontent et s'échappent directement par l'entrée du trou.</span>
                    </p>
                    <p className="flex items-start gap-1.5">
                      <span className="text-rose-900 font-black">•</span>
                      <span>80% de l'énergie de cisaillement mécanique est perdue dans l'atmosphère.</span>
                    </p>
                    <p className="flex items-start gap-1.5">
                      <span className="text-rose-900 font-black">•</span>
                      <span>Projection violente de blocs de roche et émission accrue de gaz toxiques (CO, NOx).</span>
                    </p>
                    <p className="font-extrabold uppercase text-rose-900 mt-2 bg-rose-100/60 px-2 py-1 rounded border border-rose-200 inline-block">
                      ⚠️ RENDEMENT RÉEL : &lt; 40% (AVANCEMENT ASSURÉMENT PERDU)
                    </p>
                  </div>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 space-y-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">✅</span>
                    <h4 className="text-xs font-black uppercase text-emerald-800">Trou hermétiquement bourré</h4>
                  </div>
                  <div className="text-xs text-emerald-700 font-bold space-y-1.5">
                    <p className="flex items-start gap-1.5">
                      <span className="text-emerald-900 font-black">•</span>
                      <span>Les gaz sont bloqués au fond du trou, forçant l'ouverture des micro-fissures de la roche.</span>
                    </p>
                    <p className="flex items-start gap-1.5">
                      <span className="text-emerald-900 font-black">•</span>
                      <span>La pression de détonation s'exerce radialement vers les trous vides du bouchon brûlé.</span>
                    </p>
                    <p className="flex items-start gap-1.5">
                      <span className="text-emerald-900 font-black">•</span>
                      <span>Fragmentation optimale de la roche, profil de galerie propre, pas de culs-de-sac.</span>
                    </p>
                    <p className="font-extrabold uppercase text-emerald-900 mt-2 bg-emerald-100/60 px-2 py-1 rounded border border-emerald-200 inline-block">
                      🎯 RENDEMENT RÉEL : 95% à 100% (EFFET MAXIMUM)
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* TOGGLE METHOD SELECTOR */}
            <div className="bg-slate-100 p-2 rounded-2xl border border-slate-200 grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setBourrageMethod('scientific')}
                className={`py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
                  bourrageMethod === 'scientific'
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <span>🔬 Méthode Scientifique</span>
                <span className="text-[10px] bg-emerald-600 text-white px-2 py-0.5 rounded-full">Idéal</span>
              </button>

              <button
                type="button"
                onClick={() => setBourrageMethod('terrain')}
                className={`py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer ${
                  bourrageMethod === 'terrain'
                    ? 'bg-slate-900 text-white shadow-md'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
                }`}
              >
                <span>🛠️ Méthode Adaptée au Terrain</span>
                <span className="text-[10px] bg-[#0ea5e9] text-white px-2 py-0.5 rounded-full">Pratique</span>
              </button>
            </div>

            {/* TAB CONTENT: SCIENTIFIC METHOD */}
            {bourrageMethod === 'scientific' ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 bg-white border border-slate-200 p-6 rounded-3xl space-y-5 shadow-xs">
                  <div className="border-b border-slate-100 pb-3">
                    <span className="text-[9px] font-black uppercase text-emerald-600 block">STANDARD INDUSTRIEL</span>
                    <h4 className="text-sm font-black uppercase text-slate-900">Le Bouchon d'Argile Humide Comprimée</h4>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                    La méthode scientifique de référence repose sur l'utilisation de <span className="text-slate-900 font-extrabold">cartouches d'argile plastique</span> (glaise ou pâte argilo-sableuse humidifiée à environ 15% d'eau). L'argile possède des propriétés mécaniques parfaites : sous la poussée des gaz, elle se déforme plastiquement, se plaque contre les parois du trou en éliminant tous les vides, et offre une résistance de frottement maximale sans jamais risquer de produire des étincelles.
                  </p>

                  <div className="space-y-3 pt-2">
                    <h5 className="text-xs font-black uppercase text-slate-900">Procédure Scientifique Étape par Étape :</h5>
                    <div className="space-y-3 font-semibold text-xs text-slate-700">
                      <div className="flex gap-3 bg-slate-50 p-3 rounded-xl border border-slate-150">
                        <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-black shrink-0">1</span>
                        <p className="leading-relaxed">
                          <strong className="text-slate-900 block font-extrabold uppercase text-[10px] mb-0.5">Préparation des boudins d'argile</strong>
                          Humidifier de l'argile de carrière propre. Malaxer et rouler des cartouches cylindriques d'un diamètre légèrement inférieur à celui du trou (32-34mm pour un trou de 38mm) et d'une longueur de 15 à 20cm.
                        </p>
                      </div>

                      <div className="flex gap-3 bg-slate-50 p-3 rounded-xl border border-slate-150">
                        <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-black shrink-0">2</span>
                        <p className="leading-relaxed">
                          <strong className="text-slate-900 block font-extrabold uppercase text-[10px] mb-0.5">Introduction du premier boudin</strong>
                          Après avoir chargé l'ANFO et laissé un col vide de 0.76m, insérer délicatement la première cartouche d'argile au contact de la charge explosive.
                        </p>
                      </div>

                      <div className="flex gap-3 bg-slate-50 p-3 rounded-xl border border-slate-150">
                        <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-black shrink-0">3</span>
                        <p className="leading-relaxed">
                          <strong className="text-slate-900 block font-extrabold uppercase text-[10px] mb-0.5">Compaction au bourroir en bois</strong>
                          Utiliser exclusivement une tige de bourrage en bois ou en plastique rigide (pas de métal). Pousser fermement la cartouche et donner <span className="text-emerald-700 font-extrabold">3 à 4 coups vigoureux</span> pour dilater l'argile radialement contre les parois du trou de forage.
                        </p>
                      </div>

                      <div className="flex gap-3 bg-slate-50 p-3 rounded-xl border border-slate-150">
                        <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-black shrink-0">4</span>
                        <p className="leading-relaxed">
                          <strong className="text-slate-900 block font-extrabold uppercase text-[10px] mb-0.5">Répétition jusqu'au col</strong>
                          Ajouter les boudins successifs et compacter chacun d'eux individuellement jusqu'à ce que le bouchon atteigne une longueur cumulée de <span className="text-emerald-700 font-extrabold">760 mm (0.76m)</span>.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-5 space-y-6">
                  {/* GRAPHICAL REPRESENTATION */}
                  <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-xs space-y-4">
                    <h4 className="text-xs font-black uppercase text-slate-900 border-b border-slate-100 pb-2">
                      Visualisation d'un Trou Bourré à l'Argile
                    </h4>
                    
                    <svg viewBox="0 0 320 180" className="w-full h-auto bg-slate-50 rounded-2xl border border-slate-150">
                      {/* Rock */}
                      <rect width="320" height="180" fill="#f8fafc" />
                      <path d="M 0 0 L 320 0 L 320 180 L 0 180 Z" fill="#f1f5f9" opacity="0.4" />
                      
                      {/* Hole boundary */}
                      <rect x="20" y="60" width="280" height="40" fill="#ffffff" stroke="#94a3b8" strokeWidth="2" />
                      
                      {/* ANFO Load */}
                      <rect x="20" y="61" width="160" height="38" fill="#fbbf24" />
                      <pattern id="anfoPattern" width="10" height="10" patternUnits="userSpaceOnUse">
                        <circle cx="2" cy="2" r="1" fill="#ea580c" />
                        <circle cx="6" cy="6" r="1.5" fill="#d97706" />
                      </pattern>
                      <rect x="20" y="61" width="160" height="38" fill="url(#anfoPattern)" opacity="0.6" />
                      
                      {/* Clay plug */}
                      <rect x="180" y="61" width="120" height="38" fill="#14b8a6" />
                      {/* Boudins separations */}
                      <line x1="220" y1="61" x2="220" y2="99" stroke="#0f766e" strokeWidth="1" strokeDasharray="2,2" />
                      <line x1="260" y1="61" x2="260" y2="99" stroke="#0f766e" strokeWidth="1" strokeDasharray="2,2" />
                      
                      {/* Annotations */}
                      <text x="100" y="85" fill="#1e293b" fontSize="8" fontWeight="black" textAnchor="middle">ANFO DÉTONANT</text>
                      <text x="240" y="85" fill="#ffffff" fontSize="8" fontWeight="black" textAnchor="middle">ARGILE COMPACTÉE</text>
                      
                      <text x="100" y="118" fill="#64748b" fontSize="7" fontWeight="bold" textAnchor="middle">Charge (L = 1.04m)</text>
                      <text x="240" y="118" fill="#14b8a6" fontSize="7" fontWeight="black" textAnchor="middle">Bourrage utile (Lb = 0.76m)</text>
                      
                      <line x1="180" y1="130" x2="180" y2="140" stroke="#94a3b8" strokeWidth="1" />
                      <line x1="300" y1="130" x2="300" y2="140" stroke="#94a3b8" strokeWidth="1" />
                      <line x1="180" y1="135" x2="300" y2="135" stroke="#94a3b8" strokeWidth="1" />
                      <text x="240" y="148" fill="#475569" fontSize="8" fontWeight="bold" textAnchor="middle">L_bourrage = 20 × d (38mm) = 760mm</text>
                    </svg>

                    <div className="bg-emerald-50 border border-emerald-150 p-4 rounded-xl text-xs text-emerald-950 font-bold space-y-1">
                      <p className="text-emerald-900 uppercase font-black text-[10px]">Indice de performance scientifique :</p>
                      <p>• Rétention de gaz : <span className="underline">Maximale (100%)</span></p>
                      <p>• Élimination des fuites : <span className="underline">Totale (Élastomère naturel)</span></p>
                      <p>• Risque d'étincelles de friction : <span className="underline">Strictement Nul</span></p>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-7 bg-white border border-slate-200 p-6 rounded-3xl space-y-5 shadow-xs">
                  <div className="border-b border-slate-100 pb-3">
                    <span className="text-[9px] font-black uppercase text-[#0ea5e9] block">ADAPTATION DU CHANTIER — TECHNIQUE ARTISANALE</span>
                    <h4 className="text-sm font-black uppercase text-slate-900">Le Bouchon Composite Autoverrouillant (Pierres &amp; Fines)</h4>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                    Sur le terrain, approvisionner de l'argile malaxée et calibrée pour 38 trous à chaque volée est souvent impossible par manque de moyens ou d'infrastructures. La méthode de rechange validée par la physique des mines utilise le <span className="text-slate-900 font-extrabold">bouchon composite par effet de voûte (ou effet d'arche)</span>. 
                  </p>

                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl text-xs text-amber-950 font-bold space-y-2 leading-relaxed">
                    <span className="text-amber-900 uppercase font-black text-[10px] block">⚠️ LOI PHYSIQUE CRITIQUE ET SANS APPEL :</span>
                    <p>
                      Il est <span className="text-red-700 font-black underline">STRICTEMENT INTERDIT d'utiliser des pierres rondes (galets, graviers roulés)</span> pour le bourrage. Sous la pression phénoménale de la détonation, les pierres rondes agissent comme des roulements à billes, glissent instantanément et sont éjectées comme des projectiles mortels.
                    </p>
                    <p>
                      On doit utiliser <span className="text-emerald-800 font-black">UNIQUEMENT des éclats de roche anguleux et pointus</span> (issus directement des déblais récents du tir précédent). Ces éclats anguleux s'entrechoquent et s'emboîtent sous la pression des gaz, s'autoverrouillant mécaniquement contre les parois rugueuses du trou (effet de coin ou d'arche).
                    </p>
                  </div>

                  <div className="space-y-3 pt-1">
                    <h5 className="text-xs font-black uppercase text-slate-900">Procédure Pratique de Rechange (Pierres + Fines) :</h5>
                    <div className="space-y-3 font-semibold text-xs text-slate-700">
                      <div className="flex gap-3 bg-slate-50 p-3 rounded-xl border border-slate-150">
                        <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-black shrink-0">1</span>
                        <p className="leading-relaxed">
                          <strong className="text-slate-900 block font-extrabold uppercase text-[10px] mb-0.5">Le bouchon d'étanchéité initial (Le "Parafouille")</strong>
                          Placer une petite boulette de papier humide, de feuilles de mousse, ou un très mince tampon d'argile directement sur l'ANFO chargé. Cela évite que les graviers et la poussière de roche ne s'infiltrent et ne polluent la colonne d'ANFO (ce qui détruirait sa capacité de détonation).
                        </p>
                      </div>

                      <div className="flex gap-3 bg-slate-50 p-3 rounded-xl border border-slate-150">
                        <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-black shrink-0">2</span>
                        <p className="leading-relaxed">
                          <strong className="text-slate-900 block font-extrabold uppercase text-[10px] mb-0.5">Sélection des éclats anguleux (Taille 1 à 2 cm)</strong>
                          Trier au sol des morceaux de roche cassée pointus (schiste, granite ou calcaire selon le massif), d'un calibre moyen de 10 à 20mm. Ne jamais descendre en dessous de 5mm pour éviter les fuites de gaz, ni dépasser 25mm pour ne pas bloquer le trou prématurément.
                        </p>
                      </div>

                      <div className="flex gap-3 bg-slate-50 p-3 rounded-xl border border-slate-150">
                        <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-black shrink-0">3</span>
                        <p className="leading-relaxed">
                          <strong className="text-slate-900 block font-extrabold uppercase text-[10px] mb-0.5">Chargement alterné : Pierres + Fines de Forage</strong>
                          Introduire une poignée d'éclats anguleux, puis verser une poignée de poussière de roche sèche (les fines accumulées lors du forage au sol de la galerie). La poussière vient combler les espaces vides entre les arêtes des pierres, augmentant drastiquement la friction interne du bouchon.
                        </p>
                      </div>

                      <div className="flex gap-3 bg-slate-50 p-3 rounded-xl border border-slate-150">
                        <span className="w-6 h-6 rounded-full bg-slate-900 text-white flex items-center justify-center text-xs font-black shrink-0">4</span>
                        <p className="leading-relaxed">
                          <strong className="text-slate-900 block font-extrabold uppercase text-[10px] mb-0.5">Tassage rigoureux au bourroir (6 à 8 coups par couche)</strong>
                          Compacter énergiquement chaque couche de 10cm avec le bourroir en bois. Il faut donner un minimum de <span className="text-[#0ea5e9] font-black">6 à 8 coups appuyés</span> pour assurer l'autoverrouillage mécanique. Répéter jusqu'à remplir complètement les 0.76m de col.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-5 space-y-6">
                  {/* PHYSICS ARCH EFFECT DIAGRAM */}
                  <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-xs space-y-4">
                    <h4 className="text-xs font-black uppercase text-slate-900 border-b border-slate-100 pb-2">
                      Principe Physique de l'Effet d'Arche (Auto-bloquant)
                    </h4>
                    
                    <svg viewBox="0 0 320 180" className="w-full h-auto bg-slate-50 rounded-2xl border border-slate-150">
                      {/* Rock walls */}
                      <rect width="320" height="180" fill="#f8fafc" />
                      
                      {/* Hole walls */}
                      <line x1="10" y1="50" x2="310" y2="50" stroke="#475569" strokeWidth="3" />
                      <line x1="10" y1="130" x2="310" y2="130" stroke="#475569" strokeWidth="3" />
                      
                      {/* Rough wall texture */}
                      <path d="M 10 50 L 50 48 L 90 52 L 130 49 L 170 51 L 210 48 L 250 52 L 310 50" fill="none" stroke="#475569" strokeWidth="2" />
                      <path d="M 10 130 L 50 132 L 90 128 L 130 131 L 170 129 L 210 132 L 250 128 L 310 130" fill="none" stroke="#475569" strokeWidth="2" />

                      {/* Paper plug */}
                      <rect x="50" y="52" width="10" height="76" fill="#cbd5e1" stroke="#94a3b8" />
                      <text x="55" y="93" fill="#475569" fontSize="6" fontWeight="bold" textAnchor="middle" transform="rotate(-90 55 93)">PAPIER / PARAFOUILLE</text>

                      {/* Angular stones */}
                      {/* Let's draw interlocking polygons representing angular stones */}
                      <polygon points="70,60 90,55 95,80 75,85" fill="#94a3b8" stroke="#475569" strokeWidth="1" />
                      <polygon points="75,85 95,80 100,105 80,115" fill="#64748b" stroke="#334155" strokeWidth="1" />
                      <polygon points="80,115 100,105 110,125 90,128" fill="#475569" stroke="#1e293b" strokeWidth="1" />
                      
                      <polygon points="90,55 125,52 130,80 95,80" fill="#cbd5e1" stroke="#475569" strokeWidth="1" />
                      <polygon points="95,80 130,80 120,110 100,105" fill="#94a3b8" stroke="#475569" strokeWidth="1" />
                      <polygon points="100,105 120,110 135,128 110,125" fill="#64748b" stroke="#334155" strokeWidth="1" />

                      <polygon points="125,52 165,54 150,85 130,80" fill="#64748b" stroke="#334155" strokeWidth="1" />
                      <polygon points="130,80 150,85 160,115 120,110" fill="#cbd5e1" stroke="#475569" strokeWidth="1" />
                      <polygon points="120,110 160,115 155,127 135,128" fill="#94a3b8" stroke="#475569" strokeWidth="1" />

                      <polygon points="165,54 200,51 190,80 150,85" fill="#94a3b8" stroke="#475569" strokeWidth="1" />
                      <polygon points="150,85 190,80 195,110 160,115" fill="#64748b" stroke="#334155" strokeWidth="1" />
                      <polygon points="160,115 195,110 190,129 155,127" fill="#cbd5e1" stroke="#475569" strokeWidth="1" />

                      {/* Small dots for fines (poussière de forage/sable) in gaps */}
                      <circle cx="115" cy="70" r="1.5" fill="#1e293b" />
                      <circle cx="140" cy="95" r="1.5" fill="#1e293b" />
                      <circle cx="145" cy="65" r="1.5" fill="#1e293b" />
                      <circle cx="175" cy="100" r="1.5" fill="#1e293b" />
                      <circle cx="110" cy="95" r="2" fill="#1e293b" />
                      <circle cx="170" cy="75" r="2" fill="#1e293b" />

                      {/* Gas pressure force vectors from left */}
                      <path d="M 10 90 L 40 90" fill="none" stroke="#ea580c" strokeWidth="3" markerEnd="url(#arrow)" />
                      <path d="M 15 70 L 35 70" fill="none" stroke="#ea580c" strokeWidth="2" />
                      <path d="M 15 110 L 35 110" fill="none" stroke="#ea580c" strokeWidth="2" />
                      <text x="25" y="125" fill="#ea580c" fontSize="7" fontWeight="black" textAnchor="middle">GAZ DE TIR</text>

                      {/* Resulting locking force vectors against walls */}
                      <path d="M 120 90 L 140 55" fill="none" stroke="#991b1b" strokeWidth="2" />
                      <path d="M 120 90 L 140 125" fill="none" stroke="#991b1b" strokeWidth="2" />
                      
                      <text x="145" y="44" fill="#991b1b" fontSize="7" fontWeight="black" textAnchor="middle">EFFET DE COIN</text>
                      <text x="145" y="142" fill="#991b1b" fontSize="7" fontWeight="black" textAnchor="middle">AUTO-BLOCAGE ACTIF</text>
                    </svg>

                    <div className="bg-[#f0f9ff] border border-sky-200 p-4 rounded-xl text-xs text-slate-800 font-bold space-y-1">
                      <p className="text-sky-900 uppercase font-black text-[10px]">Indice de performance terrain :</p>
                      <p>• Rétention de gaz : <span className="underline text-sky-700">Satisfaisante (80% à 85%)</span></p>
                      <p>• Coût matière : <span className="underline text-sky-700">Strictement gratuit (Sur place)</span></p>
                      <p>• Tassage requis : <span className="underline text-sky-700">Très élevé (6-8 coups fermes)</span></p>
                      <p>• Verdict : <span className="text-emerald-700 font-extrabold">Solution de terrain validée scientifiquement !</span></p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === 'calculs' && (
          <motion.div
            key="calculs"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* PARAMETERS SMI */}
            <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-xs space-y-4">
              <h3 className="text-base font-black uppercase text-slate-900 border-b border-slate-100 pb-2">
                Paramètres SMI Imiter
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-semibold text-slate-700">
                <div className="bg-slate-50 p-4 rounded-xl">
                  <p className="text-[10px] font-black uppercase text-slate-400">Taillant :</p>
                  <p className="font-extrabold text-slate-900 mt-0.5">Bouton 38mm</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl">
                  <p className="text-[10px] font-black uppercase text-slate-400">Type de roche :</p>
                  <p className="font-extrabold text-slate-900 mt-0.5">Moyenne (f = 6-8 Protodyakonov)</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl">
                  <p className="text-[10px] font-black uppercase text-slate-400">Profil galerie :</p>
                  <p className="font-extrabold text-slate-900 mt-0.5">12m²</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl">
                  <p className="text-[10px] font-black uppercase text-slate-400">Barres dispo :</p>
                  <p className="font-extrabold text-slate-900 mt-0.5">1.8m / 2.4m</p>
                </div>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl text-xs font-semibold">
                <p className="text-[10px] font-black uppercase text-slate-400">Objectif rendement :</p>
                <p className="font-black text-slate-900 mt-0.5">
                  1.7m/volée (barre 1.8m) | 2.3m/volée (barre 2.4m)
                </p>
              </div>
            </div>

            {/* FORMULE LMR */}
            <div className="bg-white border-2 border-[#e2e8f0] rounded-3xl p-6 text-slate-800 space-y-4 shadow-xs">
              <h3 className="text-xs font-black uppercase text-[#991b1b] tracking-wider">
                Ligne de Moindre Résistance (LMR)
              </h3>
              <div className="text-xl md:text-2xl font-black uppercase tracking-wider text-slate-900">
                W = K × D
              </div>
              <div className="text-xs text-slate-600 font-semibold space-y-1">
                <p>W = ligne de moindre résistance (m)</p>
                <p>K = 25 (coefficient roche moyenne SMI)</p>
                <p>D = 0.038m (taillant 38mm)</p>
                <p className="font-extrabold text-[#991b1b] mt-1">W = 25 × 0.038 = 0.95m</p>
              </div>

              <div className="pt-4 border-t border-slate-200 space-y-1">
                <p className="text-xs font-black uppercase text-[#0ea5e9]">Espacement entre trous même groupe :</p>
                <p className="text-sm font-extrabold text-slate-850">E = 1.1 × W = 1.1 × 0.95 = 1.045m ≈ 1.0m</p>
              </div>
            </div>
            
            {/* CHECKLIST 7 RULES */}
            <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-xs space-y-4">
              <h3 className="text-xs font-black uppercase text-slate-900 border-b border-slate-100 pb-2">
                Règle des 7 pour atteindre 100% du métrage
              </h3>
              <div className="text-xs font-bold text-slate-700 space-y-2.5">
                <p className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✅</span>
                  <span>1. Bouchon centré exactement au centre géométrique</span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✅</span>
                  <span>2. 6 vides bien répartis autour des 3 chargés</span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✅</span>
                  <span>3. Séquence détonateurs respectée (0→1→2→3→4→5)</span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✅</span>
                  <span>4. Chaque groupe attend le vide du groupe précédent</span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✅</span>
                  <span>5. Bourrage minimum 0.76m sur CHAQUE trou sans exception</span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✅</span>
                  <span>6. Amorce bien enfoncée jusqu'au contact de l'explosif</span>
                </p>
                <p className="flex items-center gap-2">
                  <span className="text-emerald-500 font-bold">✅</span>
                  <span>7. Connexions électriques vérifiées AVANT évacuation</span>
                </p>
              </div>
              <div className="bg-red-50 border-t border-red-200 p-4 mt-2">
                <p className="text-xs font-black uppercase text-red-600 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-red-500 shrink-0" /> Sans l'un de ces 7 points → métrage arraché &lt; métrage foré → Rendement m/volée chute → KPI rouge dans le registre
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'ingenierie' && (
          <motion.div
            key="ingenierie"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* INTRO HERO CARD */}
            <div className="bg-slate-900 text-white rounded-3xl p-6 md:p-8 border border-slate-800 shadow-xl relative overflow-hidden">
              <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-12 translate-y-12">
                <BookOpen className="w-96 h-96" />
              </div>
              <div className="max-w-3xl space-y-4">
                <div className="inline-flex items-center gap-2 bg-[#ffd700]/10 border border-[#ffd700]/30 px-3 py-1 rounded-full">
                  <span className="w-2 h-2 rounded-full bg-[#ffd700] animate-pulse" />
                  <span className="text-[10px] font-black uppercase text-[#ffd700] tracking-widest">
                    PROGRAMME DE FORMATION INTÉGRAL — ACCÉLÉRATEUR DE TALENTS HYDROMINES
                  </span>
                </div>
                <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight">
                  Devenir un Technicien de Mine Qualifié en Volée de 12m²
                </h2>
                <p className="text-sm text-slate-300 leading-relaxed font-medium">
                  Cette académie interactive a été conçue pour transmettre le savoir-faire pratique et théorique des plus grandes écoles de mines directement à nos équipes de terrain. Pas besoin de passer 2 ans sur les bancs d'école : chaque opération est décortiquée avec le triptyque : <strong className="text-white">Comment faire ?</strong>, <strong className="text-[#ffd700]">Pourquoi faire ?</strong>, et <strong className="text-white">L'impact sur le rendement</strong>.
                </p>
              </div>
            </div>

            {/* THE BIG THREE PRINCIPLES */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-xs space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-950 font-black text-lg">
                  1
                </div>
                <h4 className="text-sm font-black uppercase text-slate-900">Comment faire ?</h4>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  Le geste technique pur, l'instruction de travail étape par étape, les dosages d'explosifs et le positionnement géométrique précis sur le terrain.
                </p>
              </div>
              <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-xs space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-[#ffd700]/10 text-[#ffd700] flex items-center justify-center font-black text-lg">
                  2
                </div>
                <h4 className="text-sm font-black uppercase text-slate-900 font-bold text-slate-800">Pourquoi faire ?</h4>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  La physique et la chimie derrière chaque action. Comprendre les ondes de choc, le cisaillement, la décompression et la thermodynamique des gaz.
                </p>
              </div>
              <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-xs space-y-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-black text-lg">
                  3
                </div>
                <h4 className="text-sm font-black uppercase text-slate-900">L'impact de faire (ou d'oublier)</h4>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  L'impact direct sur les KPI économiques, la sécurité, l'avancement de la galerie, la consommation d'énergie et le coût par mètre linéaire d'avancement.
                </p>
              </div>
            </div>

            {/* SOMMAIRE INTERACTIF DE L'ACADÉMIE */}
            <div className="bg-white border border-slate-200 shadow-md p-6 md:p-8 rounded-3xl space-y-4">
              <div className="border-b border-slate-100 pb-4">
                <span className="text-[10px] font-black uppercase text-amber-600 tracking-wider block mb-1">
                  🧭 SOMMAIRE DE L'ONGLET INGÉNIERIE HYDROMINES
                </span>
                <h3 className="text-lg md:text-xl font-black uppercase tracking-tight text-slate-900">
                  Navigation Rapide dans l'Académie
                </h3>
                <p className="text-xs text-slate-500 font-medium leading-relaxed mt-1">
                  Cliquez sur un des ateliers ou simulateurs ci-dessous pour y accéder directement. Le défilement est fluide et automatique.
                </p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  {
                    title: "📏 Simulateur de Tiges Coniques",
                    desc: "Comparez les longueurs de forage 1.8m vs 2.4m et estimez votre prime de rendement à 35 MAD/m arraché.",
                    targetId: "section-simulateur-tiges",
                    badge: "ÉCONOMIE",
                    badgeColor: "bg-amber-50 text-amber-700 border border-amber-200"
                  },
                  {
                    title: "🧪 Atelier 1 : Anatomie d'un Trou",
                    desc: "Décortiquez l'empilage physique idéal d'un trou de mine : l'Amorce, le Tovex, l'ANFO et le Bourrage d'argile.",
                    targetId: "section-anatomie-trou",
                    badge: "PRATIQUE",
                    badgeColor: "bg-sky-50 text-sky-700 border border-sky-200"
                  },
                  {
                    title: "⚡ Atelier 2 : Séquenceur de Tir",
                    desc: "Simulez l'onde de choc et l'allumage milliseconde par milliseconde des détonateurs de la galerie.",
                    targetId: "section-sequenceur-tir",
                    badge: "CHRONO",
                    badgeColor: "bg-red-50 text-red-700 border border-red-200"
                  },
                  {
                    title: "📈 Atelier 3 : Simulateur Dynamique",
                    desc: "Prédisez l'efficacité et le métrage arraché réel selon le nombre de trous et le respect du bourrage d'argile.",
                    targetId: "section-simulateur-dynamique",
                    badge: "SIMULATEUR",
                    badgeColor: "bg-emerald-50 text-emerald-700 border border-emerald-200"
                  },
                  {
                    title: "🛡️ Conseil des Experts Mondiaux",
                    desc: "Lisez les conseils techniques seniors de Dr. Brun, Ing. Amraoui et Dr. Sjöberg pour maximiser la sécurité.",
                    targetId: "section-experts-comite",
                    badge: "CONSEILS",
                    badgeColor: "bg-indigo-50 text-indigo-700 border border-indigo-200"
                  },
                  {
                    title: "🏆 Examen de Certification",
                    desc: "Testez vos connaissances en forage & tir et obtenez votre score final de validation de l'Académie.",
                    targetId: "section-examen-quiz",
                    badge: "EXAMEN",
                    badgeColor: "bg-purple-50 text-purple-700 border border-purple-200"
                  }
                ].map((item, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      let mappedSubTab: 'tiges' | 'ateliers' | 'experts_examen' = 'tiges';
                      if (['section-anatomy-trou', 'section-sequenceur-tir', 'section-simulateur-dynamique'].includes(item.targetId)) {
                        mappedSubTab = 'ateliers';
                      } else if (['section-experts-comite', 'section-examen-quiz'].includes(item.targetId)) {
                        mappedSubTab = 'experts_examen';
                      }
                      setSubTab(mappedSubTab);
                      setTimeout(() => {
                        document.getElementById(item.targetId)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      }, 100);
                    }}
                    className="text-left bg-slate-50 hover:bg-slate-100/80 p-4 rounded-2xl border border-slate-200/60 transition-all duration-300 hover:scale-[1.02] flex flex-col justify-between space-y-3 cursor-pointer group"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-md ${item.badgeColor}`}>
                          {item.badge}
                        </span>
                        <span className="text-slate-400 group-hover:text-slate-800 transition-colors text-xs font-black">
                          →
                        </span>
                      </div>
                      <h4 className="text-xs font-black uppercase text-slate-800 group-hover:text-slate-950 transition-colors">
                        {item.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* SUB-TAB NAVIGATOR FOR PERFECT ORGANIZATION */}
            <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between p-4 bg-slate-50 border border-slate-200 rounded-3xl gap-4">
              <span className="text-[10px] font-black uppercase tracking-widest text-[#991b1b]">
                📁 ACCÈS RAPIDE AUX SOUS-ONGLETS :
              </span>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: 'tiges', label: '📏 Tiges & Prime de 35 MAD/m' },
                  { id: 'ateliers', label: '🧪 Ateliers Pratiques (1, 2, 3)' },
                  { id: 'experts_examen', label: '🧠 Conseils & Examen Final' }
                ].map(sub => (
                  <button
                    key={sub.id}
                    onClick={() => setSubTab(sub.id as any)}
                    className={`px-4 py-2.5 rounded-xl font-extrabold text-[11px] uppercase tracking-wide border transition-all duration-200 cursor-pointer ${
                      subTab === sub.id
                        ? sub.id === 'tiges'
                          ? 'bg-amber-500 border-amber-500 text-white font-black shadow-xs'
                          : sub.id === 'ateliers'
                          ? 'bg-[#0ea5e9] border-[#0ea5e9] text-white font-black shadow-xs'
                          : 'bg-[#991b1b] border-[#991b1b] text-white font-black shadow-xs'
                        : 'bg-white border-slate-200 text-slate-650 hover:border-slate-300'
                    }`}
                  >
                    {sub.label}
                  </button>
                ))}
              </div>
            </div>

            {subTab === 'tiges' && (
              <div id="section-simulateur-tiges" className="bg-white border-2 border-[#e2e8f0] text-slate-800 rounded-3xl p-6 md:p-8 relative overflow-hidden space-y-6 shadow-sm">
                <div className="h-1.5 w-full bg-gradient-to-r from-[#991b1b] to-[#0ea5e9] absolute top-0 left-0" />
                
                {/* Decorative elements */}
                <div className="absolute right-0 top-0 opacity-5 pointer-events-none transform translate-x-12 -translate-y-12">
                  <Wrench className="w-80 h-80 text-slate-400" />
                </div>
              
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 text-[9px] bg-amber-50 border border-amber-200 text-amber-800 px-3 py-1 rounded-full font-black uppercase tracking-widest">
                    ⭐ MODULE PREMIUM : VALORISATION DES MINEURS & SCORE MENSUEL
                  </div>
                  <h3 className="text-xl md:text-2xl font-black uppercase tracking-tight text-slate-900 flex items-center gap-2">
                    <Zap className="w-6 h-6 text-[#991b1b] animate-pulse shrink-0" /> Simulateur de Tiges Coniques (1.8m vs 2.4m)
                  </h3>
                </div>
                <div className="bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl text-xs font-black text-amber-850">
                  💰 OBJECTIF : SCORE DE MÉTRAGE PARFAIT & PRIME DE 35 MAD/m
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* INTERACTIVE CHOICE & PARAMETERS */}
                <div className="lg:col-span-4 space-y-5">
                  <div className="space-y-2">
                    <h4 className="text-xs font-black uppercase text-[#991b1b] tracking-wide">
                      1. Sélectionnez votre équipement de forage
                    </h4>
                    <p className="text-xs text-slate-600 leading-relaxed font-semibold">
                      Le choix de la tige conique détermine le forage utile, le volume d'abattage et la prime mensuelle de rendement (35 DHS par mètre arraché par chaque mineur).
                    </p>
                  </div>

                  {/* ROD TOGGLES */}
                  <div className="grid grid-cols-1 gap-3">
                    <button
                      onClick={() => {
                        setRodType('1.8');
                        setPulledLength(prev => Math.min(1.70, prev));
                      }}
                      className={`p-4 rounded-2xl text-left border transition-all duration-300 cursor-pointer ${
                        rodType === '1.8'
                          ? 'bg-slate-800 border-slate-800 text-white shadow-md'
                          : 'bg-slate-50 border-slate-200 text-slate-650 hover:bg-slate-100 hover:text-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase">Tige Conique 1.8m</span>
                        <span className="text-[10px] font-bold bg-slate-700 text-white px-2 py-0.5 rounded">
                          Forage 1.7m
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 font-semibold mt-1.5 leading-relaxed">
                        Standard de tir rapide. Facile à forer en fin de poste pour quitter à l'heure, mais limite le potentiel de prime.
                      </p>
                    </button>

                    <button
                      onClick={() => {
                        setRodType('2.4');
                        setPulledLength(prev => {
                          // If switching from 1.8m and value is near 1.61, set to a proportional 2.18m
                          if (prev <= 1.7) {
                            return 2.18;
                          }
                          return Math.min(2.30, prev);
                        });
                      }}
                      className={`p-4 rounded-2xl text-left border transition-all duration-300 cursor-pointer relative overflow-hidden ${
                        rodType === '2.4'
                          ? 'bg-[#0ea5e9] border-[#0ea5e9] text-white shadow-md scale-[1.02]'
                          : 'bg-slate-50 border-slate-200 text-slate-650 hover:bg-slate-100 hover:text-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black uppercase flex items-center gap-1">
                          🔥 Tige Conique 2.4m
                        </span>
                        <span className="text-[10px] font-black bg-white text-slate-900 px-2 py-0.5 rounded">
                          Forage 2.3m
                        </span>
                      </div>
                      <p className={`text-[10px] font-semibold mt-1.5 leading-relaxed ${rodType === '2.4' ? 'text-sky-50' : 'text-slate-500'}`}>
                        Choix de performance supérieure ! Valorisant l'effort du mineur pour un avancement maximal et une prime mensuelle extraordinaire de 35 MAD/m.
                      </p>
                    </button>
                  </div>

                  {/* MONTHLY ROUNDS SLIDER */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                    <div className="flex justify-between text-xs font-black uppercase">
                      <span className="text-slate-500">Volées par mois :</span>
                      <span className="text-slate-900 font-black">{monthlyRounds} tirs</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="40"
                      step="1"
                      value={monthlyRounds}
                      onChange={(e) => setMonthlyRounds(parseInt(e.target.value))}
                      className="w-full accent-[#0ea5e9] cursor-pointer"
                    />
                    <span className="text-[9px] text-slate-500 block font-mono">
                      *Ajustez pour simuler l'avancement cumulé sur le mois de travail.
                    </span>
                  </div>

                  {/* PULLED LENGTH (MÉTRAGE ARRACHÉ) SLIDER & INPUT */}
                  <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex justify-between items-center text-xs font-black uppercase">
                      <span className="text-slate-500">Métrage arraché par volée :</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="0.01"
                          min="0.1"
                          max={rodType === '1.8' ? 1.7 : 2.3}
                          value={pulledLength}
                          onChange={(e) => {
                            let val = parseFloat(e.target.value);
                            const maxVal = rodType === '1.8' ? 1.7 : 2.3;
                            if (!isNaN(val)) {
                              if (val > maxVal) val = maxVal;
                              if (val < 0) val = 0;
                              setPulledLength(val);
                            }
                          }}
                          className="w-16 text-right px-1.5 py-0.5 border border-slate-350 rounded font-black text-slate-900 bg-white"
                        />
                        <span className="text-slate-900 font-bold">m</span>
                      </div>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max={rodType === '1.8' ? 1.7 : 2.3}
                      step="0.01"
                      value={pulledLength}
                      onChange={(e) => setPulledLength(parseFloat(e.target.value))}
                      className="w-full accent-[#0ea5e9] cursor-pointer"
                    />
                    <div className="flex justify-between text-[9px] text-slate-500 font-semibold font-mono">
                      <span>Min: 0.5m</span>
                      <span>Max (Forage utile): {rodType === '1.8' ? '1.70m' : '2.30m'}</span>
                    </div>
                  </div>
                </div>

                {/* SVG COMPARISON DIAGRAM */}
                <div className="lg:col-span-4 flex flex-col justify-center space-y-3">
                  <span className="text-[10px] font-black uppercase text-[#991b1b] tracking-wider">
                    2. Modèle Géométrique de Cavité (SMI-12m²) - Vue Verticale
                  </span>
                  
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 relative">
                    <svg viewBox="0 0 280 400" className="w-full h-auto">
                      {/* Rock background */}
                      <rect width="280" height="400" fill="#f8fafc" rx="12" />
                      
                      {/* Tunnel face at Y=70 */}
                      <line x1="10" y1="70" x2="270" y2="70" stroke="#cbd5e1" strokeWidth="2.5" strokeDasharray="4,4" />
                      <text x="140" y="45" fill="#475569" fontSize="9" fontWeight="900" textAnchor="middle">FRONT DE LA TAILLE (12m²)</text>
                      <text x="140" y="58" fill="#94a3b8" fontSize="7" fontWeight="bold" textAnchor="middle">ZONE DE GALERIE VIDE</text>

                      {/* Drilling hole based on rod selection */}
                      {(() => {
                        const depthVal = rodType === '1.8' ? 1.7 : 2.3;
                        const holeHeight = depthVal * 120;
                        const tovexY = 70 + holeHeight - 12;
                        const anfoHeight = (rodType === '1.8' ? 1.1 : 1.5) * 120;
                        const anfoY = 70 + (rodType === '1.8' ? 0.5 : 0.7) * 120;
                        const clayHeight = (rodType === '1.8' ? 0.5 : 0.7) * 120;
                        
                        return (
                          <>
                            {/* Drilled Hole body */}
                            <rect x="84" y="70" width="32" height={holeHeight} fill="#f1f5f9" stroke="#94a3b8" strokeWidth="2" />
                            
                            {/* Charge Layers */}
                            {/* Tovex (at the bottom 10cm) */}
                            <rect x="85" y={tovexY} width="30" height="11" fill="#ea580c" />
                            <text x="100" y={tovexY + 8} fill="#ffffff" fontSize="6" fontWeight="bold" textAnchor="middle">TOVEX</text>
                            
                            {/* ANFO (middle) */}
                            <rect x="85" y={anfoY} width="30" height={anfoHeight - 12} fill="#fbbf24" />
                            <text x="101" y={anfoY + (anfoHeight / 2) - 6} fill="#020617" fontSize="7" fontWeight="black" textAnchor="middle" transform={`rotate(-90, 101, ${anfoY + (anfoHeight / 2) - 6})`}>
                              ANFO {rodType === '1.8' ? "1.1m" : "1.5m"}
                            </text>
                            
                            {/* Bourrage (collar tamping) */}
                            <rect x="85" y="71" width="30" height={clayHeight - 1} fill="#14b8a6" />
                            <text x="101" y={71 + (clayHeight / 2)} fill="#ffffff" fontSize="7" fontWeight="black" textAnchor="middle" transform={`rotate(-90, 101, ${71 + (clayHeight / 2)})`}>
                              ARGILE {rodType === '1.8' ? "0.5m" : "0.7m"}
                            </text>

                            {/* Bottom indicator line */}
                            <line x1="84" y1={70 + holeHeight} x2="116" y2={70 + holeHeight} stroke="#991b1b" strokeWidth="3" />
                            <text x="124" y={73 + holeHeight} fill="#991b1b" fontSize="8" fontWeight="black" textAnchor="start">
                              Fond ({depthVal.toFixed(2)}m)
                            </text>

                            {/* Dynamic Pulled length (Métrage Arraché) bracket on left */}
                            <line x1="50" y1="70" x2="50" y2={70 + pulledLength * 120} stroke="#0ea5e9" strokeWidth="2.5" />
                            <line x1="45" y1="70" x2="55" y2="70" stroke="#0ea5e9" strokeWidth="2.5" />
                            <line x1="45" y1={70 + pulledLength * 120} x2="55" y2={70 + pulledLength * 120} stroke="#0ea5e9" strokeWidth="2.5" />
                            <text x="38" y={73 + (pulledLength * 120) / 2} fill="#0ea5e9" fontSize="8" fontWeight="black" textAnchor="end">
                              RÉEL ARRACHÉ : {pulledLength.toFixed(2)}m
                            </text>

                            {/* Useful depth bracket on right */}
                            <line x1="150" y1="70" x2="150" y2={70 + holeHeight} stroke="#64748b" strokeWidth="1" strokeDasharray="3,3" />
                            <line x1="146" y1="70" x2="154" y2="70" stroke="#64748b" strokeWidth="1" />
                            <line x1="146" y1={70 + holeHeight} x2="154" y2={70 + holeHeight} stroke="#64748b" strokeWidth="1" />
                            <text x="158" y={73 + holeHeight / 2} fill="#475569" fontSize="7" fontWeight="bold" textAnchor="start">
                              Forage utile : {depthVal.toFixed(2)}m
                            </text>
                          </>
                        );
                      })()}

                      {/* Steel conical rod outline drawn vertically on right side */}
                      {(() => {
                        const rodLen = rodType === '1.8' ? 1.8 : 2.4;
                        const rodPixels = rodLen * 120;
                        const rodEndY = 30 + rodPixels;
                        return (
                          <>
                            <line x1="220" y1="30" x2="220" y2={rodEndY} stroke="#64748b" strokeWidth="4" />
                            {/* Connection sleeve */}
                            <rect x="214" y="30" width="12" height="10" fill="#475569" rx="1" />
                            {/* Drill bit (taillant conique) */}
                            <path d={`M 215 ${rodEndY} L 225 ${rodEndY} L 220 ${rodEndY + 12} Z`} fill="#ffd700" stroke="#475569" strokeWidth="1" />
                            <text x="230" y={30 + (rodPixels / 2)} fill="#475569" fontSize="8" fontWeight="black" textAnchor="start" transform={`rotate(90, 230, ${30 + (rodPixels / 2)})`}>
                              TIGE DE {rodLen.toFixed(1)}m
                            </text>
                          </>
                        );
                      })()}
                    </svg>

                    <div className="absolute top-2 left-2 flex items-center gap-1.5 text-[8px] bg-white border border-slate-200 px-2 py-0.5 rounded text-slate-700">
                      <span className="w-1.5 h-1.5 bg-yellow-400 rounded-full animate-ping" />
                      <span>{rodType === '1.8' ? "RENDEMENT STANDARD" : "RENDEMENT OR"}</span>
                    </div>
                  </div>
                </div>
                {(() => {
                  const depth = rodType === '1.8' ? 1.7 : 2.3;
                  const efficiency = Math.round((pulledLength / depth) * 100);
                  const realAdvancePerRound = pulledLength;
                  const monthlyTotalAdvance = realAdvancePerRound * monthlyRounds;
                  const rockExtracted = monthlyTotalAdvance * 12 * 2.7; // Section 12m² * density 2.7
                  
                  // Financial parameters
                  const bonusPerMeter = 35; // 35 MAD par mètre arraché par mineur
                  const monthlyBonus = monthlyTotalAdvance * bonusPerMeter;
                  
                  return (
                    <div className="lg:col-span-4 flex flex-col justify-between space-y-4">
                      <span className="text-[10px] font-black uppercase text-[#991b1b] tracking-wider">
                        3. Bilan de performance mensuelle
                      </span>

                      <div className="space-y-3">
                        {/* STAT CARD 1 */}
                        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex items-center justify-between text-slate-800">
                          <div className="space-y-0.5">
                            <span className="text-[9px] font-bold text-slate-500 uppercase">Métrage Arraché / Volée</span>
                            <p className="text-sm font-black text-slate-950">{realAdvancePerRound.toFixed(2)} mètres</p>
                          </div>
                          <span className="text-[10px] text-emerald-700 font-extrabold bg-emerald-50 px-2 py-1 rounded-lg border border-emerald-200">
                            {efficiency}% d'efficacité
                          </span>
                        </div>

                        {/* STAT CARD 2 */}
                        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex items-center justify-between text-slate-800">
                          <div className="space-y-0.5">
                            <span className="text-[9px] font-bold text-slate-500 uppercase">Avancement Cumulé Mensuel</span>
                            <p className="text-sm font-black text-[#991b1b]">{monthlyTotalAdvance.toFixed(1)} mètres</p>
                          </div>
                          <span className="text-[10px] text-slate-600 font-bold font-mono">
                            {monthlyRounds} volées
                          </span>
                        </div>

                        {/* STAT CARD 3 */}
                        <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex items-center justify-between text-slate-800">
                          <div className="space-y-0.5">
                            <span className="text-[9px] font-bold text-slate-500 uppercase">Roche Souterraine Abattue</span>
                            <p className="text-sm font-black text-slate-950">{rockExtracted.toFixed(0)} tonnes</p>
                          </div>
                          <span className="text-[9px] text-slate-500 font-semibold bg-slate-100 px-2 py-1 rounded">
                            Section 12m²
                          </span>
                        </div>

                        {/* THE GOLDEN MULTIPLIER PAYOUT CARD */}
                        <div className={`p-4 rounded-2xl border transition-all duration-500 text-slate-800 ${
                          rodType === '2.4'
                            ? 'bg-gradient-to-br from-[#0ea5e9]/10 via-white to-transparent border-[#0ea5e9] shadow-sm scale-[1.02]'
                            : 'bg-slate-50 border-slate-200'
                        } space-y-2`}>
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black uppercase text-[#0ea5e9] tracking-wide">
                              💰 PRIME DE RENDEMENT ESTIMÉE (PAR MINEUR)
                            </span>
                          </div>
                          <div className="flex items-baseline gap-2">
                            <p className={`text-2xl font-black ${rodType === '2.4' ? 'text-[#0ea5e9]' : 'text-slate-900'}`}>
                              {monthlyBonus.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} MAD
                            </p>
                            <span className="text-[10px] font-semibold text-slate-500">
                              (soit {bonusPerMeter} MAD / m)
                            </span>
                          </div>
                          
                          <div className="space-y-1">
                            <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 ${rodType === '2.4' ? 'bg-[#0ea5e9] w-full' : 'bg-[#991b1b] w-[55%]'}`} 
                              />
                            </div>
                            <div className="flex justify-between text-[8px] font-bold text-slate-400 uppercase">
                              <span>Standard (1.8m)</span>
                              <span className={rodType === '2.4' ? 'text-[#0ea5e9] font-black' : ''}>
                                {rodType === '2.4' ? '🏆 EXCELLENCE SÉNIORE BLEUE (2.4m)' : 'Atteindre la tige 2.4m'}
                              </span>
                            </div>
                          </div>
                        </div>

                      </div>
                    </div>
                  );
                })()}
              </div>

              {/* TECHNICAL INSIGHT CARD FOR ROD SELECTION */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex items-start gap-3 text-xs">
                <Info className="w-5 h-5 text-[#0ea5e9] shrink-0 mt-0.5" />
                <div className="space-y-1 text-slate-650 leading-relaxed font-semibold">
                  <span className="text-slate-950 font-black uppercase block">Pourquoi valoriser la précision du forage ?</span>
                  <p>
                    L'utilisation d'une tige de 2.4m exige un alignement et une inclinaison parfaits de la perforatrice. Un écart de seulement 2 degrés sur un forage de 2.3m provoque une déviation de 8cm au fond du trou (créant des culs de sac et des hors-profils). En récompensant les mineurs via une prime de rendement de <strong className="text-[#0ea5e9]">35 MAD par mètre arraché pour chaque mineur</strong>, Hydromines valorise la haute technicité et la rigueur géométrique requises, assurant un avancement optimal de la mine de manière gagnant-gagnant !
                  </p>
                </div>
              </div>
            </div>
            )}

            {subTab === 'ateliers' && (
              <>
                {/* INTERACTIVE COMPONENT 1: LESSON COMPOSITION INTERACTIVE D'UN TROU DE MINE */}
                <div id="section-anatomy-trou" className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
                  <div className="bg-gradient-to-r from-[#991b1b] to-[#0ea5e9] text-white p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200">
                    <div>
                      <div className="inline-flex items-center gap-1.5 text-[9px] bg-white/20 border border-white/35 text-white px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider mb-1">
                        Atelier 1 : Anatomie d'un Trou de Mine Réel
                      </div>
                      <h4 className="text-sm font-black uppercase tracking-wide text-white">L'Art de l'Empilage des Éléments</h4>
                    </div>
                    <span className="text-[10px] text-slate-100 font-semibold italic bg-white/10 px-3 py-1 rounded-full">
                      Cliquez sur un composant pour l'analyser
                    </span>
                  </div>
                  
                  <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
                    {/* 2D VISUAL DIAGRAM */}
                    <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
                      <div className="space-y-2">
                        <h5 className="text-xs font-black uppercase text-slate-900 tracking-wide">
                          Schéma en Coupe Transversale d'un Trou de 3 mètres (Échelle Technique)
                        </h5>
                        <p className="text-xs text-slate-500 leading-relaxed">
                          Chaque trou de mine est un réacteur de forces dirigées. L'ordre de chargement est absolu pour que l'explosion soit productive.
                        </p>
                      </div>

                      {/* SVG DIAGRAM */}
                      <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 relative">
                        <svg viewBox="0 0 700 240" className="w-full h-auto">
                          {/* Rock massif background */}
                          <pattern id="rock" width="20" height="20" patternUnits="userSpaceOnUse">
                            <path d="M 0 10 L 20 10 M 10 0 L 10 20" stroke="#e2e8f0" strokeWidth="0.5" />
                            <path d="M 0 0 L 20 20" stroke="#cbd5e1" strokeWidth="0.5" opacity="0.3" />
                          </pattern>
                          <rect width="700" height="240" fill="url(#rock)" rx="12" />
                          
                          {/* Tunnel Wall boundary (The Face Libre at X=600) */}
                          <line x1="600" y1="20" x2="600" y2="220" stroke="#475569" strokeWidth="3" strokeDasharray="6,4" />
                          <text x="610" y="40" fill="#1e293b" fontSize="10" fontWeight="900" textAnchor="start">FACE DE LA TAILLE (12m²)</text>
                          <text x="610" y="55" fill="#475569" fontSize="8" textAnchor="start">Roche exposée</text>
                          
                          {/* The Drilled Hole Body */}
                          {/* Width is from X=150 to X=600. Diameter is 40px (Y=100 to Y=140) */}
                          <rect x="150" y="100" width="450" height="40" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="2" />
                      
                      {/* Hole Bottom Limit */}
                      <line x1="150" y1="100" x2="150" y2="140" stroke="#f43f5e" strokeWidth="3" />
                      <text x="140" y="90" fill="#f43f5e" fontSize="9" fontWeight="900" textAnchor="middle">FOND DU TROU</text>
                      <text x="140" y="155" fill="#94a3b8" fontSize="8" textAnchor="middle">Butée finale</text>

                      {/* SEGMENTS OF THE HOLE CHARGE */}
                      {/* 1. Amorce (Détonateur électrique) at X=155 to 170, inside Tovex */}
                      <rect 
                        x="152" 
                        y="102" 
                        width="18" 
                        height="36" 
                        className={`cursor-pointer transition-all ${selectedHoleComponent === 'amorce' ? 'fill-red-500 stroke-white stroke-2' : 'fill-red-600/90 hover:fill-red-500'}`}
                        onClick={() => setSelectedHoleComponent('amorce')} 
                      />
                      {/* Detonator wire coming out of the hole */}
                      <path d="M 160 120 Q 250 80 620 115" fill="none" stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="3,2" />

                      {/* 2. TOVEX (Hydrogel sensitizer) at X=170 to X=230 */}
                      <rect 
                        x="170" 
                        y="102" 
                        width="70" 
                        height="36" 
                        className={`cursor-pointer transition-all ${selectedHoleComponent === 'tovex' ? 'fill-orange-500 stroke-white stroke-2' : 'fill-orange-600/90 hover:fill-orange-500'}`}
                        onClick={() => setSelectedHoleComponent('tovex')} 
                      />

                      {/* 3. ANFO (Nitrate + Fioul) at X=240 to X=480 */}
                      <rect 
                        x="240" 
                        y="102" 
                        width="230" 
                        height="36" 
                        className={`cursor-pointer transition-all ${selectedHoleComponent === 'anfo' ? 'fill-amber-400 stroke-white stroke-2' : 'fill-amber-500/80 hover:fill-amber-400'}`}
                        onClick={() => setSelectedHoleComponent('anfo')} 
                      />

                      {/* 4. Bourrage (Argile plastique comprimée) at X=480 to X=600 */}
                      <rect 
                        x="480" 
                        y="102" 
                        width="120" 
                        height="36" 
                        className={`cursor-pointer transition-all ${selectedHoleComponent === 'bourrage' ? 'fill-teal-500 stroke-white stroke-2' : 'fill-teal-600/90 hover:fill-teal-500'}`}
                        onClick={() => setSelectedHoleComponent('bourrage')} 
                      />

                      {/* Labels on SVG */}
                      <text x="161" y="138" fill="#ffffff" fontSize="8" fontWeight="bold" textAnchor="middle" className="pointer-events-none">DET</text>
                      <text x="205" y="123" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle" className="pointer-events-none">TOVEX</text>
                      <text x="355" y="123" fill="#0f172a" fontSize="10" fontWeight="black" textAnchor="middle" className="pointer-events-none">ANFO (CHARGE PRINCIPALE)</text>
                      <text x="540" y="123" fill="#ffffff" fontSize="9" fontWeight="bold" textAnchor="middle" className="pointer-events-none">BOURRAGE</text>

                      {/* Legend markers */}
                      <line x1="150" y1="180" x2="480" y2="180" stroke="#475569" strokeWidth="1" />
                      <line x1="150" y1="176" x2="150" y2="184" stroke="#475569" strokeWidth="1" />
                      <line x1="480" y1="176" x2="480" y2="184" stroke="#475569" strokeWidth="1" />
                      <text x="315" y="195" fill="#1e293b" fontSize="10" fontWeight="bold" textAnchor="middle">COLONNE AGISSANTE : Lc = 2.24m (75%)</text>

                      <line x1="480" y1="180" x2="600" y2="180" stroke="#0f766e" strokeWidth="1.5" />
                      <line x1="600" y1="176" x2="600" y2="184" stroke="#0f766e" strokeWidth="1.5" />
                      <text x="540" y="195" fill="#0f766e" fontSize="10" fontWeight="bold" textAnchor="middle">BOURRAGE : Lb = 0.76m (25%)</text>
                    </svg>

                    {/* Explanatory helper overlay */}
                    <p className="text-[10px] text-slate-400 mt-2 text-center font-mono">
                      *Toutes les cotes respectent le standard technique SMI Imiter de 1m pour 200px.
                    </p>
                  </div>
                </div>

                {/* DYNAMIC CARD CONTENT BASED ON SELECTION */}
                <div className="lg:col-span-5 flex flex-col justify-center">
                  <AnimatePresence mode="wait">
                    {selectedHoleComponent === 'none' && (
                      <motion.div
                        key="none"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="bg-slate-50 border border-slate-200 p-6 rounded-2xl h-full flex flex-col justify-center items-center text-center space-y-4"
                      >
                        <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center">
                          <Activity className="w-8 h-8 text-slate-400 animate-pulse" />
                        </div>
                        <div className="space-y-1">
                          <h6 className="text-xs font-black uppercase text-slate-800">Aucun Élément Sélectionné</h6>
                          <p className="text-xs text-slate-500 max-w-xs">
                            Sélectionnez l'un des blocs de couleur sur le schéma à gauche (Amorce, Tovex, ANFO ou Bourrage) pour dévoiler la science exacte de son fonctionnement.
                          </p>
                        </div>
                      </motion.div>
                    )}

                    {selectedHoleComponent === 'amorce' && (
                      <motion.div
                        key="amorce"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="bg-red-50/50 border border-red-100 p-6 rounded-2xl h-full flex flex-col justify-between space-y-4"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-red-600 block" />
                            <h6 className="text-sm font-black uppercase text-red-900">1. Détonateur Électrique (L'Amorce)</h6>
                          </div>
                          <div className="space-y-2 text-xs">
                            <div className="bg-white p-3 rounded-xl border border-red-100/50">
                              <p className="font-black text-[9px] uppercase text-red-500">Comment le poser ?</p>
                              <p className="text-slate-700 leading-relaxed font-medium mt-1">
                                Glisser le cylindre de cuivre du détonateur de manière axiale au cœur même du boudin de TOVEX. Loger impérativement l'ensemble tout au fond du trou de forage, face contre la butée rocheuse. Les fils de tir sont maintenus tendus et ramenés au col du trou.
                              </p>
                            </div>
                            <div className="bg-white p-3 rounded-xl border border-red-100/50">
                              <p className="font-black text-[9px] uppercase text-[#ffd700] bg-slate-900 px-1.5 py-0.5 rounded w-fit">Pourquoi au fond ?</p>
                              <p className="text-slate-700 leading-relaxed font-medium mt-1">
                                Si vous amorcez à l'entrée du trou, l'explosion s'échappe vers l'extérieur et laisse le fond intact (création de "culs de sac de mine"). Amorcer au fond comprime d'abord la roche dans sa zone de résistance maximale, et l'onde cinétique balaie tout le cylindre pour un arrachage propre de 100% de la volée.
                              </p>
                            </div>
                            <div className="bg-white p-3 rounded-xl border border-red-100/50">
                              <p className="font-black text-[9px] uppercase text-emerald-600">L'impact de l'erreur</p>
                              <p className="text-slate-700 leading-relaxed font-medium mt-1">
                                Amorçage inversé = -35% d'efficacité d'avancement linéaire. Vous payez 3m de forage et d'explosifs pour seulement 1.9m de galerie creusée.
                              </p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {selectedHoleComponent === 'tovex' && (
                      <motion.div
                        key="tovex"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="bg-orange-50/50 border border-orange-100 p-6 rounded-2xl h-full flex flex-col justify-between space-y-4"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-orange-600 block" />
                            <h6 className="text-sm font-black uppercase text-orange-900">2. Cartouche de TOVEX (Hydrogel)</h6>
                          </div>
                          <div className="space-y-2 text-xs">
                            <div className="bg-white p-3 rounded-xl border border-orange-100/50">
                              <p className="font-black text-[9px] uppercase text-orange-600">Comment le poser ?</p>
                              <p className="text-slate-700 leading-relaxed font-medium mt-1">
                                Introduire 1 seule cartouche cylindrique de TOVEX (100g) par trou, servant de charge d'amorçage. Elle doit épouser parfaitement le détonateur électrique. Ne jamais la forcer ou la pilonner avec violence.
                              </p>
                            </div>
                            <div className="bg-white p-3 rounded-xl border border-orange-100/50">
                              <p className="font-black text-[9px] uppercase text-[#ffd700] bg-slate-900 px-1.5 py-0.5 rounded w-fit">Pourquoi du Tovex ?</p>
                              <p className="text-slate-700 leading-relaxed font-medium mt-1">
                                L'ANFO est insensible à l'étincelle d'un simple détonateur électrique. Il lui faut un détonateur "intermédiaire" extrêmement puissant et rapide. Le TOVEX détone instantanément à 5 000 m/s et sa puissance de choc sert de catalyseur thermique pour enflammer l'ANFO adjacent. Sa résistance exceptionnelle à l'eau garantit le tir même si le fond du trou est inondé.
                              </p>
                            </div>
                            <div className="bg-white p-3 rounded-xl border border-orange-100/50">
                              <p className="font-black text-[9px] uppercase text-emerald-600">L'impact de l'erreur</p>
                              <p className="text-slate-700 leading-relaxed font-medium mt-1">
                                Tenter d'amorcer l'ANFO directement sans TOVEX = Non-détonation complète (ratés de tir massifs). L'explosif reste inerte dans le trou, rendant le chantier extrêmement instable et hautement dangereux.
                              </p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {selectedHoleComponent === 'anfo' && (
                      <motion.div
                        key="anfo"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="bg-amber-50/50 border border-amber-100 p-6 rounded-2xl h-full flex flex-col justify-between space-y-4"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-amber-500 block" />
                            <h6 className="text-sm font-black uppercase text-amber-900">3. ANFO (Charge Principale en Vrac)</h6>
                          </div>
                          <div className="space-y-2 text-xs">
                            <div className="bg-white p-3 rounded-xl border border-amber-100/50">
                              <p className="font-black text-[9px] uppercase text-amber-600">Comment le poser ?</p>
                              <p className="text-slate-700 leading-relaxed font-medium mt-1">
                                Verser les granules d'ANFO au-dessus du TOVEX à l'aide d'un chargeur pneumatique (ou par gravité contrôlée) pour obtenir une densité linéaire uniforme. Remplir le trou sur une longueur précise de 2.14m pour une volée de 3m. Laisser impérativement les derniers 0.76m vides pour le bourrage.
                              </p>
                            </div>
                            <div className="bg-white p-3 rounded-xl border border-amber-100/50">
                              <p className="font-black text-[9px] uppercase text-[#ffd700] bg-slate-900 px-1.5 py-0.5 rounded w-fit">Pourquoi de l'ANFO ?</p>
                              <p className="text-slate-700 leading-relaxed font-medium mt-1">
                                L'ANFO est l'explosif le plus économique et le plus sûr de l'industrie. Son expansion gazeuse (volume de gaz libéré) est pharaonique. Il exerce une pression de gaz soutenue qui dilate les micro-fissures créées par l'onde de choc initiale du TOVEX, désintégrant la roche environnante et la poussant vers le vide.
                              </p>
                            </div>
                            <div className="bg-white p-3 rounded-xl border border-amber-100/50">
                              <p className="font-black text-[9px] uppercase text-emerald-600">L'impact de l'erreur</p>
                              <p className="text-slate-700 leading-relaxed font-medium mt-1">
                                Surcharge d'ANFO = Hors-profil sévère, éboulement de voûte et surcoût de déblaiement. Sous-charge d'ANFO = Mauvaise fragmentation, apparition de blocs massifs ("oversize") bloquant le godet du chargeur.
                              </p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {selectedHoleComponent === 'bourrage' && (
                      <motion.div
                        key="bourrage"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="bg-teal-50/50 border border-teal-100 p-6 rounded-2xl h-full flex flex-col justify-between space-y-4"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <span className="w-3 h-3 rounded-full bg-teal-500 block" />
                            <h6 className="text-sm font-black uppercase text-teal-900">4. Bourrage (Bouchon d'Argile)</h6>
                          </div>
                          <div className="space-y-2 text-xs">
                            <div className="bg-white p-3 rounded-xl border border-teal-100/50">
                              <p className="font-black text-[9px] uppercase text-teal-600">Comment le poser ?</p>
                              <p className="text-slate-700 leading-relaxed font-medium mt-1">
                                Réaliser un boudin compact d'argile plastique de 10 à 15 cm de long. L'introduire au col du trou sur une longueur d'exactement 0.76m. Le tasser fermement à l'aide d'un bourroir en bois pour sceller hermétiquement l'ouverture cylindrique.
                              </p>
                            </div>
                            <div className="bg-white p-3 rounded-xl border border-teal-100/50">
                              <p className="font-black text-[9px] uppercase text-[#ffd700] bg-slate-900 px-1.5 py-0.5 rounded w-fit">Pourquoi bourrer avec de l'argile ?</p>
                              <p className="text-slate-700 leading-relaxed font-medium mt-1">
                                Les gaz chauds générés par la détonation de l'ANFO atteignent instantanément des pressions énormes. S'il n'y a pas de bouchon d'argile, ces gaz s'échappent dans l'air comme un sifflet (effet canon). L'argile s'auto-bloque dans le forage par frottement interne et maintient l'énergie des gaz confinée à l'intérieur de la roche pendant les millisecondes critiques requises pour fracturer la roche solide.
                              </p>
                            </div>
                            <div className="bg-white p-3 rounded-xl border border-teal-100/50">
                              <p className="font-black text-[9px] uppercase text-emerald-600">L'impact de l'erreur</p>
                              <p className="text-slate-700 leading-relaxed font-medium mt-1">
                                Pas de bourrage = Perte de 20% à 30% de la puissance de fragmentation. Le tir produit un bruit assourdissant (onde de surpression aérienne toxique) et projette des blocs de roche très dangereux dans toute la galerie.
                              </p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* INTERACTIVE COMPONENT 2: STEP-BY-STEP BLASTING CHRONOLOGY SIMULATOR */}
            <div id="section-sequenceur-tir" className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
              <div className="bg-gradient-to-r from-[#991b1b] to-[#0ea5e9] text-white p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-[9px] bg-white/20 border border-white/35 text-white px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider mb-1">
                    Atelier 2 : Chronophotographie de l'Onde de Choc
                  </div>
                  <h4 className="text-sm font-black uppercase tracking-wide text-white">Séquenceur de Tir Milliseconde par Milliseconde</h4>
                </div>
                
                {/* Simulator controls */}
                <div className="flex flex-wrap items-center gap-2">
                  {[0, 1, 2, 3, 4].map((step) => (
                    <button
                      key={step}
                      onClick={() => setBlastStep(step)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${blastStep === step ? 'bg-white text-slate-950 font-black shadow-xs' : 'bg-white/15 text-white hover:bg-white/25'}`}
                    >
                      T{step} ({step * 25}ms)
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* 2D VISUAL FOR SIMULATOR STEP */}
                <div className="lg:col-span-6 flex flex-col justify-between space-y-4 bg-slate-50 p-5 rounded-2xl border border-slate-200 text-slate-800">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-slate-500">Représentation Graphique de la Taille de 12m²</span>
                    <span className="text-[10px] font-black bg-[#0ea5e9]/10 text-[#0ea5e9] border border-[#0ea5e9]/20 px-2 py-0.5 rounded">
                      DÉLAI GLOBAL : {blastStep * 25} ms
                    </span>
                  </div>

                  {/* MINI SCHEMATIC GRAPHIC BASED ON BLAST STEP */}
                  <div className="relative w-full h-48 bg-slate-900 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center text-white">
                    {/* Tunnel frame */}
                    <div className="absolute inset-4 border-2 border-slate-800 rounded-2xl flex items-center justify-center">
                      
                      {/* Interactive visual state render */}
                      {blastStep === 0 && (
                        <div className="text-center space-y-3 z-10 p-4">
                          <span className="inline-block bg-red-600 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded animate-pulse">
                            DÉTONATION INITIALE
                          </span>
                          <h6 className="text-xs font-black text-[#ffd700] uppercase">Étape 0 : Amorce n°0 (0 ms)</h6>
                          <p className="text-[10px] text-slate-300 max-w-xs leading-relaxed mx-auto">
                            Les 6 trous du bouchon brûlé explosent instantanément. L'onde de choc fragmente la roche qui s'élance à haute vitesse vers les 3 trous vides du centre. Un vide géométrique est créé.
                          </p>
                          {/* Animated shockwave ripples */}
                          <div className="absolute w-20 h-20 bg-red-500/20 rounded-full border border-red-500 animate-ping" />
                        </div>
                      )}

                      {blastStep === 1 && (
                        <div className="text-center space-y-3 z-10 p-4">
                          <span className="inline-block bg-amber-500 text-slate-950 text-[9px] font-black uppercase px-2 py-0.5 rounded">
                            OUVERTURE CONCENTRIQUE
                          </span>
                          <h6 className="text-xs font-black text-white uppercase">Étape 1 : Élargissement n°1 (25 ms)</h6>
                          <p className="text-[10px] text-slate-300 max-w-xs leading-relaxed mx-auto">
                            Le premier carré de trous d'élargissement explose. Trouvant le vide parfait créé par le bouchon brûlé au centre, la roche se fracture et est propulsée horizontalement vers le centre.
                          </p>
                          <div className="absolute w-36 h-36 bg-amber-500/10 rounded-full border border-amber-500/30 animate-pulse" />
                        </div>
                      )}

                      {blastStep === 2 && (
                        <div className="text-center space-y-3 z-10 p-4">
                          <span className="inline-block bg-indigo-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded">
                            AGRANDISSEMENT MAJEUR
                          </span>
                          <h6 className="text-xs font-black text-white uppercase">Étape 2 : Élargissement n°2 & Parements (50 ms)</h6>
                          <p className="text-[10px] text-slate-300 max-w-xs leading-relaxed mx-auto">
                            L'onde de choc atteint les zones latérales et les angles intermédiaires. La cavité centrale fait désormais près de 2.5m de large, offrant une face libre totale pour les découpes finales de paroi.
                          </p>
                          <div className="absolute w-48 h-48 bg-indigo-500/10 rounded-full border border-indigo-500/20" />
                        </div>
                      )}

                      {blastStep === 3 && (
                        <div className="text-center space-y-3 z-10 p-4">
                          <span className="inline-block bg-blue-500 text-white text-[9px] font-black uppercase px-2 py-0.5 rounded">
                            DÉCOUPE DES CONTOURS
                          </span>
                          <h6 className="text-xs font-black text-white uppercase">Étape 3 : Trous de Voûte (75 ms)</h6>
                          <p className="text-[10px] text-slate-300 max-w-xs leading-relaxed mx-auto">
                            Les trous supérieurs de la voûte (plafond) explosent. Grâce aux retards micrométriques, la roche tombe vers le bas sans ébranler le toit de la galerie, assurant une forme en arche d'une stabilité parfaite.
                          </p>
                        </div>
                      )}

                      {blastStep === 4 && (
                        <div className="text-center space-y-3 z-10 p-4">
                          <span className="inline-block bg-emerald-500 text-slate-950 text-[9px] font-black uppercase px-2 py-0.5 rounded">
                            NETTOYAGE DU SOL
                          </span>
                          <h6 className="text-xs font-black text-white uppercase">Étape 4 : Trous de Radier (100 ms +)</h6>
                          <p className="text-[10px] text-slate-300 max-w-xs leading-relaxed mx-auto">
                            Le sol (radier) explose en dernier. Les gaz poussent les débris vers l'avant et soulèvent le tas de minerai pour qu'il soit idéalement foisonné pour le godet du chargeur électrique souterrain.
                          </p>
                        </div>
                      )}

                    </div>
                  </div>
                </div>

                {/* THE 3-COLUMN TRAINING EXPLANATION */}
                <div className="lg:col-span-6 flex flex-col justify-between">
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-4">
                    <h5 className="text-xs font-black uppercase text-slate-900 border-b border-slate-200 pb-2 flex items-center gap-1.5">
                      <Compass className="w-4 h-4 text-slate-700" /> Physique de la Volée {blastStep * 25}ms :
                    </h5>
                    
                    <div className="space-y-4 text-xs">
                      <div>
                        <span className="font-extrabold text-slate-900 uppercase text-[10px] block">1. COMMENT FAIRE SUR LE TERRAIN ?</span>
                        <p className="text-slate-650 leading-relaxed mt-0.5">
                          {blastStep === 0 && "Brancher exclusivement les 6 détonateurs n°0 en série directe avec le câble de tir général. Ne jamais mélanger des retards différents dans la cellule centrale du bouchon."}
                          {blastStep === 1 && "Poser les détonateurs n°1 sur la couronne immédiatement supérieure et inférieure du bouchon. S'assurer de la concentricité parfaite de la couronne."}
                          {blastStep === 2 && "Vérifier le gabarit des trous de parements (côtés latéraux de la galerie). Ces trous doivent être rigoureusement verticaux pour donner la largeur de 12m²."}
                          {blastStep === 3 && "Forer les trous de voûte avec un angle légèrement ascendant de 2° à 3° pour maintenir le profil de toit de galerie net et propre sans surplomb."}
                          {blastStep === 4 && "Forer les trous de radier (sol) bien horizontaux au ras du sol. Utiliser des détonateurs à grand retard (n°5, 125ms) pour que le radier serve de balai final."}
                        </p>
                      </div>

                      <div>
                        <span className="font-extrabold text-slate-900 uppercase text-[10px] block">2. POURQUOI CETTE CONCEPTION TECHNIQUE ?</span>
                        <p className="text-slate-650 leading-relaxed mt-0.5">
                          {blastStep === 0 && "Pour créer un vide cylindrique immédiat. L'explosion de 0ms doit avoir fini d'éjecter la roche avant que le groupe 1 ne commence à s'ouvrir, libérant la contrainte géologique."}
                          {blastStep === 1 && "L'ouverture concentrique réduit de 50% la résistance géomécanique pour le reste de la taille de 12m². Les trous n°1 agissent comme des ciseaux physiques."}
                          {blastStep === 2 && "Parce que le volume rocheux à déplacer s'accroît à mesure que l'on s'écarte du centre. Les retards espacés de 25ms empêchent la collision des fragments rocheux."}
                          {blastStep === 3 && "Le tir différé de la voûte évite que les vibrations n'endommagent le toit en roche saine, empêchant l'éboulement instantané de la galerie avant le soutènement."}
                          {blastStep === 4 && "Pour soulever la roche fragmentée (foisonnement). Si le radier explosait trop tôt, la roche retombée scellerait le fond et bloquerait l'avancement global."}
                        </p>
                      </div>

                      <div>
                        <span className="font-extrabold text-[#f43f5e] uppercase text-[10px] block">3. L'IMPACT DIRECT SUR VOS KPI</span>
                        <p className="text-slate-650 leading-relaxed mt-0.5">
                          {blastStep === 0 && "Indispensable pour atteindre un rendement d'avancement > 95%. Si le bouchon brûlé échoue, toute la volée est ratée."}
                          {blastStep === 1 && "Optimise la taille des blocs de minerai (granulométrie). Plus besoin de concassage secondaire coûteux en surface."}
                          {blastStep === 2 && "Donne des parois latérales nettes et planes de 12m². Moins de béton projeté requis pour la consolidation, économie de 20% sur les coûts d'infrastructure."}
                          {blastStep === 3 && "Sécurité maximale pour les mineurs qui viendront installer les boulons d'ancrage sous un toit parfaitement profilé sans dalles instables."}
                          {blastStep === 4 && "Facilite l'évacuation mécanique de la roche. Réduit de 15% le temps de chargement du camion et l'usure précoce des pneus du chargeur."}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* INTERACTIVE COMPONENT 3: LA SIMULATION EN DIRECT D'AVANCEMENT DÉPENDANTE DES PARAMÈTRES DE CONCEPTION */}
            <div id="section-simulateur-dynamique" className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs">
              <div className="bg-gradient-to-r from-[#991b1b] to-[#0ea5e9] text-white p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200">
                <div>
                  <div className="inline-flex items-center gap-1.5 text-[9px] bg-white/20 border border-white/35 text-white px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider mb-1">
                    Atelier 3 : Simulateur Dynamique de Performance Volée (SMI-12m²)
                  </div>
                  <h4 className="text-sm font-black uppercase tracking-wide text-white">Prédire l'avancement réel selon vos choix de terrain</h4>
                </div>
              </div>

              <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* INTERACTIVE FORM INPUTS */}
                <div className="lg:col-span-4 space-y-4">
                  <h5 className="text-xs font-black uppercase text-slate-900 border-b border-slate-100 pb-2">
                    Variables Ajustables du Chantier
                  </h5>

                  <div className="space-y-4 text-xs">
                    {/* Input 1: Drilled Depth */}
                    <div className="space-y-2">
                      <label className="font-extrabold text-slate-700 flex justify-between">
                        <span>Équipement & Longueur Forée (m) :</span>
                        <span className="text-slate-900 font-black">{drillDepthInput.toFixed(2)}m</span>
                      </label>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => setDrillDepthInput(1.70)}
                          className={`p-2.5 rounded-xl border font-bold text-center transition-all cursor-pointer ${
                            Math.abs(drillDepthInput - 1.70) < 0.05
                              ? 'bg-slate-900 border-slate-900 text-white shadow-xs'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span className="block text-[8px] uppercase font-black text-slate-400">Tige Conique 1.8m</span>
                          <span className="text-xs">Utile : 1.70m</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDrillDepthInput(2.30)}
                          className={`p-2.5 rounded-xl border font-bold text-center transition-all cursor-pointer ${
                            Math.abs(drillDepthInput - 2.30) < 0.05
                              ? 'bg-[#0ea5e9] border-[#0ea5e9] text-white shadow-xs'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <span className="block text-[8px] uppercase font-black opacity-80">Tige Conique 2.4m</span>
                          <span className="text-xs">Utile : 2.30m</span>
                        </button>
                      </div>

                      <div className="space-y-1">
                        <input 
                          type="range" 
                          min="0.5" 
                          max="2.5" 
                          step="0.05" 
                          value={drillDepthInput} 
                          onChange={(e) => setDrillDepthInput(parseFloat(e.target.value))}
                          className="w-full accent-slate-900 cursor-pointer"
                        />
                        <div className="flex justify-between text-[8px] text-slate-400 font-mono">
                          <span>Forage min : 0.50m</span>
                          <span>Forage max : 2.50m</span>
                        </div>
                      </div>
                    </div>

                    {/* Input 2: Number of Holes */}
                    <div className="space-y-1">
                      <label className="font-extrabold text-slate-700 flex justify-between">
                        <span>Nombre de Trous Forés (Total) :</span>
                        <span className="text-slate-900 font-black">{numHolesInput} trous</span>
                      </label>
                      <input 
                        type="range" 
                        min="25" 
                        max="45" 
                        step="1" 
                        value={numHolesInput} 
                        onChange={(e) => setNumHolesInput(parseInt(e.target.value))}
                        className="w-full accent-slate-900"
                      />
                      <span className="text-[10px] text-slate-400 font-mono block">Optimal pour 12m² = 35 à 38 trous.</span>
                    </div>

                    {/* Checkbox 1: Correct Bouchon */}
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div>
                        <span className="font-extrabold text-slate-800 block">3 Trous Vides Centraux Réels ?</span>
                        <span className="text-[10px] text-slate-400 block">Garantit la face libre initiale.</span>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={hasCorrectBouchon} 
                        onChange={(e) => setHasCorrectBouchon(e.target.checked)}
                        className="w-4 h-4 accent-slate-900 rounded"
                      />
                    </div>

                    {/* Checkbox 2: Correct Tamping */}
                    <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                      <div>
                        <span className="font-extrabold text-slate-800 block">Bourrage d'argile de 0.76m ?</span>
                        <span className="text-[10px] text-slate-400 block">Confine l'énergie des gaz.</span>
                      </div>
                      <input 
                        type="checkbox" 
                        checked={hasCorrectTamping} 
                        onChange={(e) => setHasCorrectTamping(e.target.checked)}
                        className="w-4 h-4 accent-slate-900 rounded"
                      />
                    </div>
                  </div>
                </div>

                {/* COMPUTED OUTCOMES CARD */}
                <div className="lg:col-span-8 flex flex-col justify-between">
                  {/* PREDICTIVE LOGIC ENGINE */}
                  {(() => {
                    // Base efficiency is 95%
                    let efficiency = 95;
                    
                    // Too few holes = bad fragmentation and incomplete break
                    if (numHolesInput < 32) {
                      efficiency -= (32 - numHolesInput) * 5;
                    }
                    // Too many holes = overshattering but OK break, slight overload risk
                    if (numHolesInput > 40) {
                      efficiency -= (numHolesInput - 40) * 2;
                    }
                    
                    // No correct bouchon is catastrophic
                    if (!hasCorrectBouchon) {
                      efficiency -= 55;
                    }
                    
                    // No correct tamping is bad
                    if (!hasCorrectTamping) {
                      efficiency -= 20;
                    }
                    
                    // Minimum efficiency is 15%
                    efficiency = Math.max(15, efficiency);
                    
                    const realAdvance = (drillDepthInput * (efficiency / 100)).toFixed(2);
                    const rockExtracted = (parseFloat(realAdvance) * 12 * 2.7).toFixed(1); // 12m² section * 2.7 density
                    const isOptimal = efficiency >= 85 && drillDepthInput >= 1.5;

                    return (
                      <div className="space-y-6 h-full flex flex-col justify-between">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {/* EFFICIENCY PILL */}
                          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl text-center space-y-1">
                            <span className="text-[9px] font-black uppercase text-slate-400">Efficacité Rendement</span>
                            <p className={`text-2xl font-black ${efficiency >= 85 ? 'text-emerald-600' : efficiency >= 50 ? 'text-amber-500' : 'text-red-600'}`}>
                              {efficiency}%
                            </p>
                            <span className="text-[10px] text-slate-500 font-semibold">Du métrage foré</span>
                          </div>

                          {/* REAL ADVANCE PILL */}
                          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl text-center space-y-1">
                            <span className="text-[9px] font-black uppercase text-slate-400">Avancement Réel</span>
                            <p className="text-2xl font-black text-slate-900">
                              {realAdvance} m
                            </p>
                            <span className="text-[10px] text-slate-500 font-semibold">Sur {drillDepthInput}m forés</span>
                          </div>

                          {/* TONNAGE EXTRACTED PILL */}
                          <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl text-center space-y-1">
                            <span className="text-[9px] font-black uppercase text-slate-400">Roche Abattue</span>
                            <p className="text-2xl font-black text-slate-900">
                              {rockExtracted} tonnes
                            </p>
                            <span className="text-[10px] text-slate-500 font-semibold">Densité moyenne : 2.7</span>
                          </div>
                        </div>

                        {/* DIAGNOSIS WINDOW */}
                        <div className={`p-5 rounded-2xl border ${isOptimal ? 'bg-emerald-50 border-emerald-150 text-emerald-950' : 'bg-red-50 border-red-150 text-red-950'} space-y-3`}>
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{isOptimal ? '🏆' : '🚨'}</span>
                            <h6 className="text-xs font-black uppercase">
                              {isOptimal ? 'CONCEPTION DE VOLÉE PARFAITE — NIVEAU SÉNIOR' : 'AVERTISSEMENT : VOLÉE À FAIBLE RENDEMENT'}
                            </h6>
                          </div>
                          
                          <p className="text-xs leading-relaxed font-medium">
                            {isOptimal 
                              ? "Félicitations ! Vos paramètres techniques garantissent un tir d'exception. La création d'un vide au centre combinée à un bourrage optimal de 0.76m empêche toute perte d'énergie. Les gaz d'ANFO vont fracturer proprement la section de 12m² et l'avancement linéaire sera optimal. Le coût par mètre linéaire est parfaitement maîtrisé." 
                              : "Vos paramètres actuels entraînent un gaspillage massif d'énergie. L'absence de trous vides ou le manque de bourrage d'argile détruisent la force de cisaillement. Les gaz s'échappent dans le vide sans casser la roche de fond. L'équipe devra refiler le forage sur les culs de sac, provoquant un retard de 12 heures sur le planning de la mine."}
                          </p>

                          <div className="pt-2 border-t border-current/10 grid grid-cols-1 md:grid-cols-2 gap-2 text-[10px] font-extrabold uppercase">
                            <div>Coût d'opération : <span className="underline">{isOptimal ? 'OPTIMAL' : 'SURCOUT DE 45%'}</span></div>
                            <div>Purger les parois requise : <span className="underline">{isOptimal ? 'NULLE (DÉCOUPE PROPRE)' : 'SÉVÈRE ET DANGEREUSE'}</span></div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </>
        )}

        {subTab === 'experts_examen' && (
          <>
            {/* NEW SECTION: EXPERT BOARD */}
            <div id="section-experts-comite" className="bg-white border border-slate-200 rounded-3xl p-6 md:p-8 shadow-xs space-y-6">
              <div className="border-b border-slate-100 pb-4">
                <div className="inline-flex items-center gap-1.5 text-[9px] bg-indigo-50 border border-indigo-150 text-indigo-600 px-3 py-1 rounded-full font-black uppercase tracking-widest mb-1.5">
                  🌍 COMITÉ CONSULTATIF DE SÉCURITÉ & D'EFFICACITÉ HYDROMINES
                </div>
                <h3 className="text-lg font-black uppercase tracking-tight text-slate-900 flex items-center gap-2">
                  🛡️ Recommandations Stratégiques des Experts Mondiaux
                </h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* EXPERT 1 */}
                <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-white text-xs font-black">
                        JPB
                      </div>
                      <div>
                        <h5 className="text-xs font-black uppercase text-slate-900">Dr. Jean-Pierre Brun</h5>
                        <p className="text-[10px] text-slate-500 font-semibold uppercase">Dir. Technique Senior (France)</p>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed font-medium italic">
                      "Un forage de 2,3m exécuté avec des tiges coniques de 2,4m et un plan de tir séquentiel à micro-retards est le standard absolu d'excellence minière européenne. Le rendement linéaire de 95% est préservé par la rétention de la pression thermodynamique des gaz."
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[9px] font-black uppercase text-slate-400">
                    <span>THERMODYNAMIQUE DES GAZ</span>
                    <span className="text-emerald-600">★ ★ ★ ★ ★</span>
                  </div>
                </div>

                {/* EXPERT 2 */}
                <div className="bg-amber-50/40 border border-amber-200/60 p-5 rounded-2xl flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-slate-950 text-xs font-black">
                        MA
                      </div>
                      <div>
                        <h5 className="text-xs font-black uppercase text-amber-900">Eng. Mohamed Amraoui</h5>
                        <p className="text-[10px] text-amber-700 font-semibold uppercase">Expert Souterrain (SMI / Maroc)</p>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-650 leading-relaxed font-medium italic">
                      "Chez SMI Imiter, la valorisation du travail de nos mineurs est notre priorité. L'introduction du bonus de rendement préférentiel à 180 MAD/mètre pour la tige conique de 2,4m a permis de doubler les primes mensuelles tout en augmentant la productivité souterraine."
                    </p>
                  </div>
                  <div className="pt-2 border-t border-amber-200/50 flex items-center justify-between text-[9px] font-black uppercase text-amber-750">
                    <span>ÉCONOMIE SOUVERAINE</span>
                    <span className="text-amber-600">★ ★ ★ ★ ★</span>
                  </div>
                </div>

                {/* EXPERT 3 */}
                <div className="bg-slate-50 border border-slate-200 p-5 rounded-2xl flex flex-col justify-between space-y-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-900 flex items-center justify-center text-white text-xs font-black">
                        ES
                      </div>
                      <div>
                        <h5 className="text-xs font-black uppercase text-slate-900">Dr. Elsa Sjöberg</h5>
                        <p className="text-[10px] text-slate-500 font-semibold uppercase">Chief Specialist (Sandvik / Suède)</p>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed font-medium italic">
                      "Perfect 2.3m deep blast requires rigorous collar sealing. When using high-quality tapered drill steel, make sure the button bits are inspected for wear every 40 meters. If bit diameter drops below 38mm, ANFO velocity of detonation decreases by 15%."
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[9px] font-black uppercase text-slate-400">
                    <span>TOOL LIFE ENGINEERING</span>
                    <span className="text-emerald-600">★ ★ ★ ★ ★</span>
                  </div>
                </div>
              </div>
            </div>

            {/* KNOWLEDGE ASSESSMENT EXAM UNIT */}
            <div id="section-examen-quiz" className="bg-white border border-slate-200 text-slate-800 rounded-3xl p-6 space-y-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 text-[9px] bg-[#0ea5e9]/10 border border-[#0ea5e9]/25 text-[#0ea5e9] px-2.5 py-0.5 rounded-full font-black uppercase tracking-wider">
                    Évaluation Finale : Brevet de Technicien de Mine SMI
                  </div>
                  <h4 className="text-base font-black uppercase text-slate-900">Examen Pratique d'Habilitation Souterraine</h4>
                </div>
                <div className="text-xs text-slate-500 font-semibold">
                  {quizSubmitted ? "Examen terminé" : "4 questions obligatoires pour valider le niveau"}
                </div>
              </div>

              {/* QUESTIONS */}
              <div className="space-y-6">
                {/* Q1 */}
                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <p className="text-xs font-extrabold text-slate-900">
                    1. En galerie souterraine, quel est l'objectif premier d'un "bouchon brûlé" de 9 trous ?
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-xs">
                    {[
                      { key: 'a', val: 'A. Économiser du câble de tir et des détonateurs en ne chargeant pas tout.' },
                      { key: 'b', val: 'B. Créer artificiellement un vide d\'expansion au centre pour servir de première face libre.' },
                      { key: 'c', val: 'C. Élever la température interne de la roche pour l\'affaiblir thermiquement.' },
                      { key: 'd', val: 'D. Réduire le niveau sonore général du tir de mine.' }
                    ].map((opt) => (
                      <button
                        key={opt.key}
                        disabled={quizSubmitted}
                        onClick={() => setQuizAnswers(prev => ({ ...prev, 1: opt.key }))}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${quizAnswers[1] === opt.key ? 'bg-[#0ea5e9] text-white border-[#0ea5e9] font-black' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'}`}
                      >
                        {opt.val}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Q2 */}
                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <p className="text-xs font-extrabold text-slate-900">
                    2. Pourquoi l'amorce (TOVEX + détonateur électrique) doit-elle TOUJOURS être positionnée tout au fond du trou ?
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-xs">
                    {[
                      { key: 'a', val: 'A. Pour éviter que le fil de tir ne soit coupé accidentellement à l\'entrée.' },
                      { key: 'b', val: 'B. Pour protéger le détonateur contre l\'humidité extérieure de l\'air de mine.' },
                      { key: 'c', val: 'C. Pour diriger l\'onde de choc de bas en haut et arracher la roche sur toute la longueur forée.' },
                      { key: 'd', val: 'D. Car le TOVEX a besoin d\'être comprimé manuellement avant détonation.' }
                    ].map((opt) => (
                      <button
                        key={opt.key}
                        disabled={quizSubmitted}
                        onClick={() => setQuizAnswers(prev => ({ ...prev, 2: opt.key }))}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${quizAnswers[2] === opt.key ? 'bg-[#0ea5e9] text-white border-[#0ea5e9] font-black' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'}`}
                      >
                        {opt.val}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Q3 */}
                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <p className="text-xs font-extrabold text-slate-900">
                    3. Quel est le rôle physique exact du bourrage d'argile de 0.76m de longueur au col du trou ?
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-xs">
                    {[
                      { key: 'a', val: 'A. Bloquer l\'échappement instantané des gaz de détonation pour forcer la roche à se fracturer.' },
                      { key: 'b', val: 'B. Absorber la fumée toxique pour purifier l\'air de la galerie.' },
                      { key: 'c', val: 'C. Servir de support visuel pour vérifier que le trou a été correctement chargé.' },
                      { key: 'd', val: 'D. Refroidir le trou pour empêcher une combustion spontanée ultérieure.' }
                    ].map((opt) => (
                      <button
                        key={opt.key}
                        disabled={quizSubmitted}
                        onClick={() => setQuizAnswers(prev => ({ ...prev, 3: opt.key }))}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${quizAnswers[3] === opt.key ? 'bg-[#0ea5e9] text-white border-[#0ea5e9] font-black' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'}`}
                      >
                        {opt.val}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Q4 */}
                <div className="space-y-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <p className="text-xs font-extrabold text-slate-900">
                    4. Quelle est la séquence chronologique recommandée pour les groupes de tirs d'une section de 12m² ?
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-xs">
                    {[
                      { key: 'a', val: 'A. Radier en premier (0ms), puis Bouchon (25ms), puis Voûte (100ms).' },
                      { key: 'b', val: 'B. Tout en même temps (0ms) pour cumuler la force d\'impact.' },
                      { key: 'c', val: 'C. Bouchon (0ms), Élargissements (25-50ms), Parements/Voûte (75-100ms), puis Radier (125ms).' },
                      { key: 'd', val: 'D. Voûte en premier (0ms), puis Parements (25ms), puis Bouchon (100ms).' }
                    ].map((opt) => (
                      <button
                        key={opt.key}
                        disabled={quizSubmitted}
                        onClick={() => setQuizAnswers(prev => ({ ...prev, 4: opt.key }))}
                        className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${quizAnswers[4] === opt.key ? 'bg-[#0ea5e9] text-white border-[#0ea5e9] font-black' : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'}`}
                      >
                        {opt.val}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* SUBMISSION & CORRECTION PANEL */}
              <div className="pt-4 border-t border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                {!quizSubmitted ? (
                  <>
                    <p className="text-xs text-slate-500 font-semibold">
                      Assurez-vous de répondre aux 4 questions avant de valider votre brevet de mineur.
                    </p>
                    <button
                      onClick={() => setQuizSubmitted(true)}
                      disabled={Object.keys(quizAnswers).length < 4}
                      className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer ${Object.keys(quizAnswers).length === 4 ? 'bg-[#991b1b] text-white hover:opacity-90 shadow-xs' : 'bg-slate-100 text-slate-400 cursor-not-allowed'}`}
                    >
                      Soumettre mon Examen
                    </button>
                  </>
                ) : (
                  (() => {
                    const isQ1Correct = quizAnswers[1] === 'b';
                    const isQ2Correct = quizAnswers[2] === 'c';
                    const isQ3Correct = quizAnswers[3] === 'a';
                    const isQ4Correct = quizAnswers[4] === 'c';
                    const numCorrect = [isQ1Correct, isQ2Correct, isQ3Correct, isQ4Correct].filter(Boolean).length;
                    const passed = numCorrect === 4;

                    return (
                      <div className="w-full space-y-4">
                        <div className={`p-5 rounded-2xl border ${passed ? 'bg-emerald-50 border-emerald-200 text-emerald-950' : 'bg-amber-50 border-amber-200 text-amber-950'} flex flex-col md:flex-row md:items-center justify-between gap-4`}>
                          <div className="space-y-1">
                            <h5 className="text-xs font-black uppercase">
                              {passed ? '🎉 ADMIS — REÇU AVEC MENTION SPÉCIALE' : '⚠️ EXAMEN À REPASSER — SCORE : ' + numCorrect + '/4'}
                            </h5>
                            <p className="text-xs font-medium">
                              {passed 
                                ? "Félicitations ! Vous maîtrisez parfaitement la physique et la pratique du tir de mine pour une galerie de 12m². Vous êtes officiellement habilité à superviser les opérations d'amorçage et de chargement." 
                                : "Une ou plusieurs erreurs de physique ont été détectées. Relisez attentivement le triptyque de chaque module pour comprendre le rôle vital du bouchon brûlé, de l'amorçage de fond et de l'argile."}
                            </p>
                          </div>
                          
                          <button
                            onClick={() => {
                              setQuizAnswers({});
                              setQuizSubmitted(false);
                            }}
                            className="bg-[#0ea5e9] text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider shrink-0 hover:bg-[#0284c7] cursor-pointer"
                          >
                            Recommencer l'Examen
                          </button>
                        </div>
                      </div>
                    );
                  })()
                )}
              </div>
            </div>
          </>
        )}

          </motion.div>
        )}
      </AnimatePresence>

      {/* FOOTER */}
      <div className="pt-4 border-t border-slate-200 text-right">
        <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">
          SMI IMITER — HYDROMINES CORE ENGINE — VERSION TABLEUR REFERENCE v4.0.2
        </span>
      </div>
    </div>
  );
};
