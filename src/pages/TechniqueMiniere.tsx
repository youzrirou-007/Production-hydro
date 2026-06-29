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
  const [activeTab, setActiveTab] = useState<'schema' | 'explosifs' | 'bourrage' | 'calculs'>('schema');
  const [hoveredHole, setHoveredHole] = useState<HoleInfo | null>(null);

  const holes: HoleInfo[] = [
    // BOUCHON BRÛLÉ (9 TROUS) - SYSTEM : 3 VIDES | 3 CHARGÉS | 3 VIDES
    { id: 'v1', name: 'Bouchon - Trou Vide 1', x: 450, y: 360, type: 'vide', label: 'V', desc: 'Trou de décharge non chargé (x=450, y=360). Permet l\'expansion de la roche à proximité immédiate.' },
    { id: 'v2', name: 'Bouchon - Trou Vide 2', x: 450, y: 410, type: 'vide', label: 'V', desc: 'Trou d\'expansion intermédiaire gauche (x=450, y=410). Guide l\'énergie initiale vers le vide central.' },
    { id: 'v3', name: 'Bouchon - Trou Vide 3', x: 450, y: 460, type: 'vide', label: 'V', desc: 'Trou de décharge inférieur gauche (x=450, y=460). Prévient le compactage des débris de base.' },

    { id: 'c1', name: 'Bouchon - Trou Chargé 1 (Délai 0)', x: 500, y: 360, type: 'charge', label: '0', desc: 'Trou d\'amorçage supérieur (Amorce n°0, 0ms). Explose en premier pour fracturer la roche vers les vides adjacents.' },
    { id: 'c2', name: 'Bouchon - Trou Chargé 2 (Délai 0)', x: 500, y: 410, type: 'charge', label: '0', desc: 'Trou d\'amorçage central (Amorce n°0, 0ms). Point névralgique de libération des contraintes géotechniques.' },
    { id: 'c3', name: 'Bouchon - Trou Chargé 3 (Délai 0)', x: 500, y: 460, type: 'charge', label: '0', desc: 'Trou d\'amorçage inférieur (Amorce n°0, 0ms). Assure l\'arrachement parfait de la base du bouchon.' },

    { id: 'v4', name: 'Bouchon - Trou Vide 4', x: 550, y: 360, type: 'vide', label: 'V', desc: 'Trou de décharge supérieur droit (x=550, y=360). Reçoit la projection de matière du tir initial.' },
    { id: 'v5', name: 'Bouchon - Trou Vide 5', x: 550, y: 410, type: 'vide', label: 'V', desc: 'Trou d\'expansion intermédiaire droit (x=550, y=410). Clé de la symétrie horizontale de la cavité.' },
    { id: 'v6', name: 'Bouchon - Trou Vide 6', x: 550, y: 460, type: 'vide', label: 'V', desc: 'Trou de décharge inférieur droit (x=550, y=460). Évite les butées rocheuses internes.' },

    // GROUPE 1 (BLEU, DÉLAI 1 - 25ms) - 4 COINS DU CARRÉ DIAG-INTERNE
    { id: 'g1_1', name: 'Groupe d\'Élargissement 1 - HG', x: 400, y: 310, type: 'g1', label: '1', desc: 'Groupe d\'élargissement 1 (Détonateur n°1, 25ms). Élargit la cavité primaire de manière concentrique.' },
    { id: 'g1_2', name: 'Groupe d\'Élargissement 1 - HD', x: 600, y: 310, type: 'g1', label: '1', desc: 'Groupe d\'élargissement 1 (Détonateur n°1, 25ms). Casse les structures d\'angle supérieures.' },
    { id: 'g1_3', name: 'Groupe d\'Élargissement 1 - BG', x: 400, y: 510, type: 'g1', label: '1', desc: 'Groupe d\'élargissement 1 (Détonateur n°1, 25ms). Facilite l\'évacuation gravitaire vers le centre vide.' },
    { id: 'g1_4', name: 'Groupe d\'Élargissement 1 - BD', x: 600, y: 510, type: 'g1', label: '1', desc: 'Groupe d\'élargissement 1 (Détonateur n°1, 25ms). Équilibre le profil de découpe interne.' },

    // GROUPE 2 (ROUGE, DÉLAI 2 - 50ms) - 4 BRAS DE LA PETITE CROIX AXIALE
    { id: 'g2_1', name: 'Groupe d\'Élargissement 2 - Gauche', x: 340, y: 410, type: 'g2', label: '2', desc: 'Groupe d\'élargissement 2 (Détonateur n°2, 50ms). Pousse le massif vers la grande cavité centrale libérée.' },
    { id: 'g2_2', name: 'Groupe d\'Élargissement 2 - Droite', x: 660, y: 410, type: 'g2', label: '2', desc: 'Groupe d\'élargissement 2 (Détonateur n°2, 50ms). Progression d\'abattage symétrique droite.' },
    { id: 'g2_3', name: 'Groupe d\'Élargissement 2 - Haut', x: 500, y: 250, type: 'g2', label: '2', desc: 'Groupe d\'élargissement 2 (Détonateur n°2, 50ms). Prépare l\'arrachage de la section voûte intermédiaire.' },
    { id: 'g2_4', name: 'Groupe d\'Élargissement 2 - Bas', x: 500, y: 570, type: 'g2', label: '2', desc: 'Groupe d\'élargissement 2 (Détonateur n°2, 50ms). Soulage le travail des trous de radier.' },

    // GROUPE 3 (BLEU CIEL, DÉLAI 3 - 75ms) - 4 COINS DU GRAND CARRÉ DIAG-EXTERNE
    { id: 'g3_1', name: 'Groupe d\'Élargissement 3 - HG', x: 280, y: 190, type: 'g3', label: '3', desc: 'Groupe d\'élargissement 3 (Détonateur n°3, 75ms). Atteint les limites diagonales supérieures du massif.' },
    { id: 'g3_2', name: 'Groupe d\'Élargissement 3 - HD', x: 720, y: 190, type: 'g3', label: '3', desc: 'Groupe d\'élargissement 3 (Détonateur n°3, 75ms). Découpe l\'épaulement diagonal droit.' },
    { id: 'g3_3', name: 'Groupe d\'Élargissement 3 - BG', x: 280, y: 630, type: 'g3', label: '3', desc: 'Groupe d\'élargissement 3 (Détonateur n°3, 75ms). Nettoie l\'angle d\'épaulement bas gauche.' },
    { id: 'g3_4', name: 'Groupe d\'Élargissement 3 - BD', x: 720, y: 630, type: 'g3', label: '3', desc: 'Groupe d\'élargissement 3 (Détonateur n°3, 75ms). Nettoie l\'angle d\'épaulement bas droit.' },

    // GROUPE 4 (ORANGE, DÉLAI 4 - 100ms) - 4 BRAS DE LA GRANDE CROIX AXIALE
    { id: 'g4_1', name: 'Groupe d\'Élargissement 4 - Gauche', x: 220, y: 410, type: 'g4', label: '4', desc: 'Groupe d\'élargissement 4 (Détonateur n°4, 100ms). Dégage la partie médiane gauche avant le tir de parement.' },
    { id: 'g4_2', name: 'Groupe d\'Élargissement 4 - Droite', x: 780, y: 410, type: 'g4', label: '4', desc: 'Groupe d\'élargissement 4 (Détonateur n°4, 100ms). Dégage la partie médiane droite avant le tir de parement.' },
    { id: 'g4_3', name: 'Groupe d\'Élargissement 4 - Haut', x: 500, y: 130, type: 'g4', label: '4', desc: 'Groupe d\'élargissement 4 (Détonateur n°4, 100ms). Crée un espace d\'éjection vertical juste sous la voûte.' },
    { id: 'g4_4', name: 'Groupe d\'Élargissement 4 - Bas', x: 500, y: 630, type: 'g4', label: '4', desc: 'Groupe d\'élargissement 4 (Détonateur n°4, 100ms). Nettoie l\'assise médiane du plancher.' },

    // RADIER (VIOLET, DÉLAI 5 - 125ms) - PLANCHER DE GALERIE
    { id: 'rad1', name: 'Trou de Radier 1', x: 150, y: 635, type: 'radier', label: 'R', desc: 'Trou de Radier (Détonateur n°5, 125ms). Creuse l\'angle bas gauche du plancher de la galerie.' },
    { id: 'rad2', name: 'Trou de Radier 2', x: 380, y: 635, type: 'radier', label: 'R', desc: 'Trou de Radier (Détonateur n°5, 125ms). Assure le plat central gauche du plancher.' },
    { id: 'rad3', name: 'Trou de Radier 3', x: 620, y: 635, type: 'radier', label: 'R', desc: 'Trou de Radier (Détonateur n°5, 125ms). Assure le plat central droit du plancher.' },
    { id: 'rad4', name: 'Trou de Radier 4', x: 850, y: 635, type: 'radier', label: 'R', desc: 'Trou de Radier (Détonateur n°5, 125ms). Creuse l\'angle bas droit du plancher.' },

    // PAREMENT GAUCHE (VERT TEAL, DÉLAI 5 - 125ms) - PAROI GAUCHE
    { id: 'pg1', name: 'Trou de Parement Gauche 1', x: 130, y: 570, type: 'parement', label: 'PG', desc: 'Trou de Parement Gauche (Détonateur n°5, 125ms). Profilage bas de la paroi verticale gauche.' },
    { id: 'pg2', name: 'Trou de Parement Gauche 2', x: 130, y: 450, type: 'parement', label: 'PG', desc: 'Trou de Parement Gauche (Détonateur n°5, 125ms). Calibrage milieu de la paroi verticale gauche.' },
    { id: 'pg3', name: 'Trou de Parement Gauche 3', x: 150, y: 330, type: 'parement', label: 'PG', desc: 'Trou de Parement Gauche (Détonateur n°5, 125ms). Raccordement de la paroi gauche au départ de voûte.' },

    // PAREMENT DROIT (VERT TEAL, DÉLAI 5 - 125ms) - PAROI DROITE
    { id: 'pd1', name: 'Trou de Parement Droit 1', x: 870, y: 570, type: 'parement', label: 'PD', desc: 'Trou de Parement Droit (Détonateur n°5, 125ms). Profilage bas de la paroi verticale droite.' },
    { id: 'pd2', name: 'Trou de Parement Droit 2', x: 870, y: 450, type: 'parement', label: 'PD', desc: 'Trou de Parement Droit (Détonateur n°5, 125ms). Calibrage milieu de la paroi verticale droite.' },
    { id: 'pd3', name: 'Trou de Parement Droit 3', x: 850, y: 330, type: 'parement', label: 'PD', desc: 'Trou de Parement Droit (Détonateur n°5, 125ms). Raccordement de la paroi droite au départ de voûte.' },

    // VOÛTE (ROSE/ROUGE, DÉLAI 5 - 125ms) - COURONNE DE GALERIE
    { id: 'vc', name: 'Trou de Voûte Centrale', x: 500, y: 75, type: 'voute', label: 'VC', desc: 'Trou de Voûte Centrale (Détonateur n°5, 125ms). Clé de voûte théorique garantissant la stabilité de la couronne.' },
    { id: 'vl1', name: 'Trou de Voûte Latérale Gauche', x: 300, y: 140, type: 'voute', label: 'VL', desc: 'Trou de Voûte Latérale (Détonateur n°5, 125ms). Calibrage de l\'arc de couronne côté gauche.' },
    { id: 'vl2', name: 'Trou de Voûte Latérale Droite', x: 700, y: 140, type: 'voute', label: 'VL', desc: 'Trou de Voûte Latérale (Détonateur n°5, 125ms). Calibrage de l\'arc de couronne côté droit.' }
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
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 text-white relative overflow-hidden shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#ffd700] via-slate-800 to-[#1a5276]" />
        <div className="space-y-2">
          <h1 className="text-xl md:text-2xl font-black tracking-wider flex items-center gap-2">
            ⛏️ TECHNIQUE MINIÈRE — SMI IMITER
          </h1>
          <p className="text-xs font-black text-[#ffd700] uppercase tracking-wider">
            Support de Référence — Forage & Tir — Galeries 12m²
          </p>
        </div>
        <div className="shrink-0 bg-[#ffd700]/10 border border-[#ffd700]/30 px-4 py-2 rounded-xl text-center">
          <span className="text-[10px] font-black uppercase text-[#ffd700] tracking-widest block">
            CONFIDENTIEL TECHNIQUE
          </span>
          <span className="text-xs font-bold text-white uppercase tracking-wider block mt-0.5">
            SMI — HYDROMINES
          </span>
        </div>
      </div>

      {/* NAVIGATION TABS */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {[
          { id: 'schema', label: '🗺️ Plan de Tir' },
          { id: 'explosifs', label: '💥 Explosifs' },
          { id: 'bourrage', label: '🔩 Bourrage' },
          { id: 'calculs', label: '📐 Calculs' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as any);
              setHoveredHole(null);
            }}
            className={`px-5 py-3 rounded-xl font-black text-xs uppercase tracking-wide transition-all cursor-pointer ${
              activeTab === tab.id
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
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
                  En galerie souterraine, la roche n'a aucune face libre naturelle. Sans face libre, l'énergie de l'explosion se dissipe dans toutes les directions — aucun métrage arraché. Le bouchon brûlé résout ce problème : il crée artificiellement un vide au centre de la taille, qui devient la première face libre pour tous les groupes suivants.
                </p>
                <div className="space-y-3 pt-2">
                  <div className="bg-slate-50 border-l-4 border-slate-800 p-4 rounded-r-xl">
                    <p className="text-xs font-black uppercase text-slate-900">9 trous au total</p>
                    <p className="text-xs text-slate-600 mt-1 font-semibold leading-relaxed">
                      6 VIDES (sans explosif) + 3 CHARGÉS (TOVEX + Amorce n°0)
                    </p>
                  </div>
                  <div className="bg-slate-50 border-l-4 border-slate-800 p-4 rounded-r-xl">
                    <p className="text-xs font-black uppercase text-slate-900">Le ratio 2:1</p>
                    <p className="text-xs text-slate-600 mt-1 font-semibold leading-relaxed">
                      (vides/chargés) garantit que les gaz trouvent suffisamment d'espace pour s'expanser
                    </p>
                  </div>
                  <div className="bg-slate-50 border-l-4 border-slate-800 p-4 rounded-r-xl">
                    <p className="text-xs font-black uppercase text-slate-900">Détonateur n°0</p>
                    <p className="text-xs text-slate-600 mt-1 font-semibold leading-relaxed">
                      Premiers à exploser — Créent un vide de ≈ 250mm de diamètre
                    </p>
                  </div>
                </div>
              </div>

              {/* HOVER DETAILS PANEL */}
              <div className="bg-slate-900 border border-slate-800 text-white p-6 rounded-3xl shadow-md min-h-[180px] flex flex-col justify-between">
                <div>
                  <h4 className="text-[10px] font-black uppercase text-[#ffd700] tracking-wider mb-2">
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
                        <h5 className="text-sm font-black uppercase tracking-wide">
                          {hoveredHole.name}
                        </h5>
                      </div>
                      <p className="text-xs text-slate-300 font-semibold leading-relaxed">
                        {hoveredHole.desc}
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-3 text-slate-450 py-6">
                      <Compass className="w-8 h-8 shrink-0 animate-pulse" />
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
                <div className="bg-slate-900 px-6 py-4 border-b border-slate-800">
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
                        <td className="px-6 py-4">Centre</td>
                        <td className="px-6 py-4">TOVEX 100g</td>
                        <td className="px-6 py-4">Créer vide initial</td>
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
                    <p className="text-[10px] font-black uppercase text-slate-400">Forme :</p>
                    <p className="font-extrabold text-slate-800">Cartouche cylindrique 100g / Ø25-32mm</p>
                  </div>
                  <div className="space-y-1 text-xs">
                    <p className="text-[10px] font-black uppercase text-slate-400">Vitesse de détonation :</p>
                    <p className="font-extrabold text-slate-800">4 000 - 5 000 m/s</p>
                  </div>
                  <div className="space-y-1 text-xs">
                    <p className="text-[10px] font-black uppercase text-slate-400">Résistance eau :</p>
                    <p className="font-extrabold text-slate-800">EXCELLENTE — fonctionne trou noyé</p>
                  </div>
                  <div className="space-y-2 pt-2 text-xs font-semibold">
                    <p className="text-emerald-700 flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500" /> Idéal pour le bouchon
                    </p>
                    <p className="text-emerald-700 flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500" /> Remplace l'ANFO si trou humide
                    </p>
                    <p className="text-emerald-700 flex items-center gap-1.5">
                      <CheckCircle className="w-4 h-4 shrink-0 text-emerald-500" /> Puissance de détonation maximale
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-red-50 p-5 border-t border-red-100 text-xs font-bold text-red-900 leading-relaxed space-y-1">
                <p className="text-[9px] font-black uppercase text-red-550">Utilisation SMI :</p>
                <p>Bouchon brûlé (trous chargés n°0)</p>
                <div className="text-[10px] font-black uppercase text-red-800 italic mt-1 leading-normal space-y-0.5">
                  <p>1. Introduire la cartouche doucement</p>
                  <p>2. Connecter l'amorce AVANT d'insérer</p>
                  <p>3. NE PAS forcer — ne jamais utiliser la tige</p>
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
            {/* WHY VITAL */}
            <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-xs space-y-4">
              <h3 className="text-base font-black uppercase text-slate-900 border-b border-slate-100 pb-2">
                Le Bourrage — Concentrateur d'Énergie
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">❌</span>
                    <h4 className="text-xs font-black uppercase text-rose-800">Sans bourrage</h4>
                  </div>
                  <div className="text-xs text-rose-700 font-bold space-y-2">
                    <p>• Les gaz remontent directement vers l'entrée du trou</p>
                    <p>• 80% de l'énergie s'échappe dans la galerie</p>
                    <p>• Seulement 20% pousse la roche vers la face libre</p>
                    <p>• Métrage arraché : 0.8m au lieu de 1.7m</p>
                    <p className="font-extrabold uppercase text-rose-900 mt-1">⚠️ COUP SOUFFLÉ — danger mortel pour les mineurs</p>
                  </div>
                </div>

                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">✅</span>
                    <h4 className="text-xs font-black uppercase text-emerald-800">Avec bourrage</h4>
                  </div>
                  <div className="text-xs text-emerald-700 font-bold space-y-2">
                    <p>• Les gaz sont bloqués derrière l'explosif</p>
                    <p>• 100% de l'énergie pousse vers la roche</p>
                    <p>• Métrage arraché = métrage foré</p>
                    <p className="font-extrabold uppercase text-emerald-900 mt-1">🎯 Objectif SMI : 1.7m foré → 1.7m arraché</p>
                  </div>
                </div>
              </div>
            </div>

            {/* BOURRAGE LENGTH CALCULATION */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white space-y-6 shadow-md">
              <div className="space-y-1">
                <h4 className="text-[10px] font-black uppercase text-[#ffd700] tracking-wider">
                  Calculateur de la Longueur de Bourrage
                </h4>
                <div className="text-xl md:text-2xl font-black uppercase tracking-wider text-white mt-1">
                  L_bourrage = 20 × D_trou
                </div>
                <div className="text-xs text-slate-400 font-bold uppercase mt-1">
                  L_bourrage = 20 × 38mm = 760mm ≈ 0.76m
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <div className="space-y-1">
                  <p className="text-xs font-black uppercase text-[#ffd700]">Pour un trou de 1.8m (barre 1.8m) :</p>
                  <div className="w-full bg-slate-850 h-8 rounded-lg overflow-hidden flex text-[10px] font-black uppercase tracking-wider relative border border-slate-750">
                    <div className="h-full bg-sky-600 flex items-center justify-center text-white" style={{ width: '42.2%' }}>
                      Bourrage 0.76m (42%)
                    </div>
                    <div className="h-full bg-red-600 flex items-center justify-center text-white" style={{ width: '57.8%' }}>
                      Explosif 1.04m (58%)
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 font-extrabold uppercase mt-1">Trou 1.8m : ≈ 0.95 kg ANFO</p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs font-black uppercase text-[#ffd700]">Si trou 2.4m (barre 2.4m) :</p>
                  <div className="w-full bg-slate-850 h-8 rounded-lg overflow-hidden flex text-[10px] font-black uppercase tracking-wider relative border border-slate-750">
                    <div className="h-full bg-sky-600 flex items-center justify-center text-white" style={{ width: '31.7%' }}>
                      Bourrage 0.76m (32%)
                    </div>
                    <div className="h-full bg-red-600 flex items-center justify-center text-white" style={{ width: '68.3%' }}>
                      Explosif 1.64m (68%)
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-400 font-extrabold uppercase mt-1">Trou 2.4m : ≈ 1.58 kg ANFO</p>
                </div>
              </div>
            </div>

            {/* PROCEDURE STANDARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white border border-slate-200 p-6 rounded-3xl shadow-xs space-y-4">
                <h3 className="text-xs font-black uppercase text-slate-900 border-b border-slate-100 pb-2">
                  BOURRAGE STANDARD (SABLE / DÉBLAIS FINS)
                </h3>
                <div className="text-xs font-semibold text-slate-700 space-y-3 leading-relaxed">
                  <p>1. Charger l'explosif jusqu'à 0.76m de l'entrée</p>
                  <p>2. Introduire des déblais fins (sable, fines de forage)</p>
                  <p>3. Compacter avec la tige de bourrage</p>
                  <p>4. Répéter par couches de 15-20cm</p>
                  <p>5. Vérifier : le trou est plein jusqu'à l'entrée</p>
                  <p className="text-emerald-700 font-black mt-2">Efficacité : 100% ✅</p>
                </div>
              </div>

              <div className="bg-amber-50/50 border border-amber-300 p-6 rounded-3xl shadow-xs space-y-4">
                <h3 className="text-xs font-black uppercase text-amber-900 border-b border-amber-200 pb-2">
                  SYSTÈME DÉPANNAGE (PIERRES)
                </h3>
                <div className="text-xs font-semibold text-amber-800 space-y-3 leading-relaxed">
                  <p className="font-extrabold uppercase text-amber-950">Quand le sable ou les fines manquent :</p>
                  <p>1. Ramasser des éclats de roche (1-3cm) dans les déblais</p>
                  <p>2. UNIQUEMENT des fragments fins et anguleux (s'emboîtent, les ronds glissent)</p>
                  <p>3. Introduire par poignées successives</p>
                  <p>4. Compacter : minimum 6-8 coups de tige par couche</p>
                  <p>5. Remplir jusqu'à 70cm de l'entrée</p>
                  <p className="text-amber-800 font-black mt-2">Efficacité : 70-80% ⚠️</p>
                </div>
              </div>
            </div>
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
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 text-white space-y-4 shadow-md">
              <h3 className="text-xs font-black uppercase text-[#ffd700] tracking-wider">
                Ligne de Moindre Résistance (LMR)
              </h3>
              <div className="text-xl md:text-2xl font-black uppercase tracking-wider text-white">
                W = K × D
              </div>
              <div className="text-xs text-slate-350 font-semibold space-y-1">
                <p>W = ligne de moindre résistance (m)</p>
                <p>K = 25 (coefficient roche moyenne SMI)</p>
                <p>D = 0.038m (taillant 38mm)</p>
                <p className="font-extrabold text-[#ffd700] mt-1">W = 25 × 0.038 = 0.95m</p>
              </div>

              <div className="pt-4 border-t border-slate-800 space-y-1">
                <p className="text-xs font-black uppercase text-[#ffd700]">Espacement entre trous même groupe :</p>
                <p className="text-sm font-extrabold">E = 1.1 × W = 1.1 × 0.95 = 1.045m ≈ 1.0m</p>
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
