import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  SkipForward, 
  ChevronLeft, 
  ChevronRight, 
  Flame, 
  Info, 
  ShieldAlert, 
  Activity 
} from 'lucide-react';
import { HOLES_DATA, HOLES_DATA_9 } from './data';
import { HoleInfo } from './types';

interface SchemaTabProps {
  gabarit: '12m2' | '9m2';
}

export const SchemaTab: React.FC<SchemaTabProps> = ({ gabarit }) => {
  const [activeStep, setActiveStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [rodType, setRodType] = useState<'1.8' | '2.4'>('1.8');
  const [hoveredHole, setHoveredHole] = useState<HoleInfo | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const maxStep = gabarit === '9m2' ? 5 : 6;

  // Reset step if it exceeds bounds on gabarit swap
  useEffect(() => {
    if (activeStep > maxStep) {
      setActiveStep(maxStep);
    }
  }, [gabarit, maxStep, activeStep]);

  // Auto playback controls
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setActiveStep((prev) => {
          if (prev >= maxStep) {
            return 0; // Loop back
          }
          return prev + 1;
        });
      }, 2000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, maxStep]);

  const handleNext = () => {
    setActiveStep((prev) => (prev < maxStep ? prev + 1 : maxStep));
  };

  const handlePrev = () => {
    setActiveStep((prev) => (prev > 0 ? prev - 1 : 0));
  };

  const handleReset = () => {
    setActiveStep(0);
    setIsPlaying(false);
  };

  const handleGoToEnd = () => {
    setActiveStep(maxStep);
    setIsPlaying(false);
  };

  // Footage math linked to the rod type and the current blast step
  const getFootage = () => {
    const totalDepth = rodType === '1.8' ? 1.7 : 2.3;
    if (gabarit === '9m2') {
      switch (activeStep) {
        case 0: return 0.0;
        case 1: return Number((totalDepth * 0.15).toFixed(2));
        case 2: return Number((totalDepth * 0.30).toFixed(2));
        case 3: return Number((totalDepth * 0.50).toFixed(2));
        case 4: return Number((totalDepth * 0.75).toFixed(2));
        case 5: return totalDepth;
        default: return 0.0;
      }
    } else {
      switch (activeStep) {
        case 0: return 0.0;
        case 1: return Number((totalDepth * 0.15).toFixed(2));
        case 2: return Number((totalDepth * 0.35).toFixed(2));
        case 3: return Number((totalDepth * 0.55).toFixed(2));
        case 4: return Number((totalDepth * 0.70).toFixed(2));
        case 5: return Number((totalDepth * 0.85).toFixed(2));
        case 6: return totalDepth;
        default: return 0.0;
      }
    }
  };

  // Cavity expansion dimensions on SVG
  const getCavityRadius = () => {
    if (gabarit === '9m2') {
      switch (activeStep) {
        case 0: return 0;
        case 1: return 45;   // Bouchon central
        case 2: return 90;   // G1
        case 3: return 140;  // G2
        case 4: return 200;  // G3
        case 5: return 280;  // Finition
        default: return 0;
      }
    } else {
      switch (activeStep) {
        case 0: return 0;
        case 1: return 60;   // Bouchon central
        case 2: return 120;  // G1 coins
        case 3: return 200;  // G2 petite croix
        case 4: return 280;  // G3 grand carré
        case 5: return 360;  // G4 grande croix
        case 6: return 500;  // Full profile
        default: return 0;
      }
    }
  };

  // Helper to determine if a hole has already exploded at a given stage
  const getHoleStatus = (hole: HoleInfo) => {
    const isVide = hole.type === 'vide';
    if (isVide) return 'normal';

    let blastStepForHole = 6; // default final for 12m2
    if (gabarit === '9m2') {
      if (hole.type === 'charge') blastStepForHole = 1;
      else if (hole.type === 'g1') blastStepForHole = 2;
      else if (hole.type === 'g2') blastStepForHole = 3;
      else if (hole.type === 'g3') blastStepForHole = 4;
      else blastStepForHole = 5; // radier, parement, voute
    } else {
      if (hole.type === 'charge') blastStepForHole = 1;
      else if (hole.type === 'g1') blastStepForHole = 2;
      else if (hole.type === 'g2') blastStepForHole = 3;
      else if (hole.type === 'g3') blastStepForHole = 4;
      else if (hole.type === 'g4') blastStepForHole = 5;
      else blastStepForHole = 6;
    }

    if (activeStep === 0) return 'normal';
    if (activeStep === blastStepForHole) return 'blasting';
    if (activeStep > blastStepForHole) return 'exploded';
    return 'normal';
  };

  // Descriptions for each step of the timeline
  const stepExplanationsTwelve = [
    {
      title: "État initial",
      time: "Pre-firing",
      desc: "Tous les trous sont forés parallèlement et chargés conformément au plan d'ingénierie souterraine. La roche de front est intacte, dense et solide."
    },
    {
      title: "Bouchon (0ms)",
      time: "0 ms",
      desc: "Les 6 trous du bouchon brûlé explosent instantanément. Les 3 trous vides centraux n'explosent pas : ils offrent l'unique espace de décompression libre. La roche comprimée s'y pulvérise et s'éjecte."
    },
    {
      title: "Groupe 1 (25ms)",
      time: "25 ms",
      desc: "Les 4 trous d'angle du Groupe 1 explosent. La roche fracturée se déplace vers la cavité centrale initialement libérée par le bouchon, élargissant la zone vide à 30%."
    },
    {
      title: "Groupe 2 (50ms)",
      time: "50 ms",
      desc: "Les 4 trous en croix du Groupe 2 explosent. L'onde de cisaillement pousse le massif rocheux vers le vide qui s'élargit désormais pour libérer 50% de la section."
    },
    {
      title: "Groupe 3 (75ms)",
      time: "75 ms",
      desc: "Les 4 grands angles extérieurs du Groupe 3 détruisent la roche intermédiaire. La cavité s'ouvre à 70%, nettoyant les diagonales supérieures et inférieures."
    },
    {
      title: "Groupe 4 (100ms)",
      time: "100 ms",
      desc: "Les 4 bras géants du Groupe 4 détonent à haute pression. Cette étape finale d'élargissement vide 85% de la galerie, laissant uniquement les contours extérieurs."
    },
    {
      title: "Finition (125ms)",
      time: "125 ms",
      desc: "Les trous de radier (pieds), de parements (côtés) et de voûte détonent ensemble. Leurs ondes de choc découpent les parois de manière lisse et régulière. 100% du métrage est arraché."
    }
  ];

  const stepExplanationsNine = [
    {
      title: "État initial",
      time: "Pre-firing",
      desc: "Tous les 28 trous du gabarit de reconnaissance de 9m² sont forés de manière parfaitement parallèle et chargés. La masse rocheuse solide du front est stable."
    },
    {
      title: "Bouchon (0ms)",
      time: "0 ms",
      desc: "Les 4 trous chargés du bouchon cylindrique détonnent en instantané (0ms). Trou foré à 38mm mais non chargé (vide d'expansion). Offre un volume de dégagement initial central. Même profondeur et même diamètre que les trous chargés."
    },
    {
      title: "Groupe 1 (25ms)",
      time: "25 ms",
      desc: "Les 4 trous du Groupe 1 (25ms, détonateur 1) explosent. La roche cisaillée est projetée vers la cavité cylindrique libre du bouchon."
    },
    {
      title: "Groupe 2 (50ms)",
      time: "50 ms",
      desc: "Les 4 trous en croix du Groupe 2 (50ms, détonateur 2) détonnent pour étendre la cavité vers les limites intermédiaires horizontales et verticales."
    },
    {
      title: "Groupe 3 (75ms)",
      time: "75 ms",
      desc: "Les 4 trous diagonaux du Groupe 3 (75ms, détonateur 3) cisaillent la roche d'angle interne pour nettoyer 75% du cœur de la galerie."
    },
    {
      title: "Finition (100-125ms)",
      time: "100-125 ms",
      desc: "Tirs de contour : radier et parements à 100ms (détonateur 4), voûte à 125ms (détonateur 5). Profil final : parois verticales (parements), sol plat (radier) et voûte en arc de cercle (voûte). La galerie 9m² est formée."
    }
  ];

  const stepExplanations = gabarit === '9m2' ? stepExplanationsNine : stepExplanationsTwelve;

  // Colors for rendering the holes based on type
  const getHoleColorClasses = (hole: HoleInfo, status: string) => {
    if (status === 'exploded') {
      return 'fill-slate-800/20 stroke-slate-600/35 stroke-[1px] opacity-40';
    }
    if (status === 'blasting') {
      return 'fill-red-500 stroke-yellow-400 stroke-[4px] animate-pulse';
    }

    switch (hole.type) {
      case 'vide': return 'fill-white stroke-slate-500 stroke-[3px]';
      case 'charge': return 'fill-slate-900 stroke-white stroke-[3px]';
      case 'g1': return 'fill-blue-500 stroke-blue-600 stroke-[3px]';
      case 'g2': return 'fill-red-500 stroke-red-600 stroke-[3px]';
      case 'g3': return 'fill-cyan-400 stroke-cyan-500 stroke-[3px]';
      case 'g4': return 'fill-orange-500 stroke-orange-600 stroke-[3px]';
      case 'radier': return 'fill-violet-500 stroke-violet-600 stroke-[3px]';
      case 'parement': return 'fill-teal-500 stroke-teal-600 stroke-[3px]';
      case 'voute': return 'fill-rose-500 stroke-rose-600 stroke-[3px]';
      default: return 'fill-slate-400';
    }
  };

  // Logic to draw vector arrow pointing from hole center towards the epicentre (500, 430) for 12m2, and (500, 350) for 9m2
  const getArrowCoords = (hole: HoleInfo) => {
    const cx = 500;
    const cy = gabarit === '9m2' ? 350 : 430;
    const dx = cx - hole.x;
    const dy = cy - hole.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) return null;

    // Normalised vector
    const ux = dx / len;
    const uy = dy / len;

    // Line start (just outside the hole radius) and end (offset by 60px toward the center)
    const x1 = hole.x + ux * 18;
    const y1 = hole.y + uy * 18;
    const x2 = hole.x + ux * 65;
    const y2 = hole.y + uy * 65;

    return { x1, y1, x2, y2 };
  };

  const currentMaxDepth = rodType === '1.8' ? 1.7 : 2.3;
  const currentPercentage = Math.round((getFootage() / currentMaxDepth) * 100);
  const holesToRender = gabarit === '9m2' ? HOLES_DATA_9 : HOLES_DATA;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-white rounded-3xl p-6 border border-slate-100 shadow-xs">
      
      {/* LEFT COLUMN: THE CORE SVG PLAN DE TIR (8 Columns) */}
      <div className="lg:col-span-8 space-y-6 flex flex-col justify-between">
        
        {/* Toggle Rod type bar */}
        <div className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-2xl p-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400">Longueur de tige</p>
              <p className="text-xs font-extrabold text-slate-800 uppercase">
                Tige conique : {rodType === '1.8' ? '1.8 mètres' : '2.4 mètres'}
              </p>
            </div>
          </div>
          <div className="flex bg-white border border-slate-200 rounded-xl p-1 shadow-sm gap-1">
            <button
              onClick={() => setRodType('1.8')}
              className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-colors ${
                rodType === '1.8'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              1.8 m (Forage 1.7m)
            </button>
            <button
              onClick={() => setRodType('2.4')}
              className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-colors ${
                rodType === '2.4'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              2.4 m (Forage 2.3m)
            </button>
          </div>
        </div>

        {/* INTERACTIVE SVG STAGE */}
        <div className="bg-slate-950 rounded-3xl border border-slate-850 p-4 relative shadow-2xl flex items-center justify-center overflow-hidden min-h-[480px]">
          
          {/* Legend absolute inside top right */}
          <div className="absolute top-4 left-4 bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2 text-[9px] font-bold text-slate-400 uppercase tracking-wider space-y-1 z-10">
            <p className="text-[10px] font-black text-[#ffd700] border-b border-slate-800 pb-1 mb-1">Délai Séquence</p>
            <p className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-900 border border-white" /> Bouchon : 0ms</p>
            <p className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500" /> Groupe 1 : 25ms</p>
            <p className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500" /> Groupe 2 : 50ms</p>
            <p className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-cyan-400" /> Groupe 3 : 75ms</p>
            {gabarit === '12m2' && (
              <p className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-orange-500" /> Groupe 4 : 100ms</p>
            )}
            <p className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-violet-500" /> Radier : {gabarit === '9m2' ? '100ms' : '125ms'}</p>
            <p className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-teal-500" /> Parement : {gabarit === '9m2' ? '100ms' : '125ms'}</p>
            <p className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500" /> Voûte : 125ms</p>
          </div>

          <svg viewBox="0 0 1000 700" className="w-full h-auto select-none">
            <defs>
              {/* Rocky Dark Granite Pattern */}
              <pattern id="granite-rock" width="120" height="120" patternUnits="userSpaceOnUse">
                <rect width="120" height="120" fill="#111827" />
                <path d="M 0 10 C 20 15 30 5 60 18 C 90 30 110 5 120 15" fill="none" stroke="#1f2937" strokeWidth="1.5" opacity="0.6"/>
                <path d="M 10 120 C 40 80 70 110 90 75 C 100 50 110 90 120 100" fill="none" stroke="#1f2937" strokeWidth="1" opacity="0.4"/>
                {/* Mineral grains */}
                <circle cx="20" cy="30" r="1.5" fill="#374151" opacity="0.4"/>
                <circle cx="70" cy="50" r="2" fill="#4b5563" opacity="0.3"/>
                <circle cx="95" cy="15" r="1.2" fill="#1f2937" opacity="0.7"/>
                <circle cx="45" cy="95" r="1.8" fill="#4b5563" opacity="0.4"/>
                <circle cx="110" cy="85" r="2.2" fill="#374151" opacity="0.5"/>
              </pattern>

              {/* Arrow Head Marker */}
              <marker
                id="marker-arrow"
                viewBox="0 0 10 10"
                refX="6"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 2 L 10 5 L 0 8 z" fill="#fbbf24" />
              </marker>
            </defs>

            {/* Background of the overall tunnel face (solid rock block) */}
            <rect width="1000" height="700" fill="url(#granite-rock)" />

            {/* Gallery Tunnel Face Silhouette */}
            {gabarit === '9m2' ? (
              <path
                d="M 280,520 L 280,280 A 220,220 0 0,1 720,280 L 720,520 Z"
                fill="url(#granite-rock)"
                stroke="#0f172a"
                strokeWidth="10"
                className="drop-shadow-[0_15px_30px_rgba(0,0,0,0.8)]"
              />
            ) : (
              <path
                d="M 100,650 L 100,300 A 400,400 0 0,1 900,300 L 900,650 Z"
                fill="url(#granite-rock)"
                stroke="#0f172a"
                strokeWidth="10"
                className="drop-shadow-[0_15px_30px_rgba(0,0,0,0.8)]"
              />
            )}

            {/* Internal edge shadow line */}
            {gabarit === '9m2' ? (
              <path
                d="M 280,520 L 280,280 A 220,220 0 0,1 720,280 L 720,520 Z"
                fill="none"
                stroke="#374151"
                strokeWidth="2"
                opacity="0.8"
              />
            ) : (
              <path
                d="M 100,650 L 100,300 A 400,400 0 0,1 900,300 L 900,650 Z"
                fill="none"
                stroke="#374151"
                strokeWidth="2"
                opacity="0.8"
              />
            )}

            {/* DYNAMIC EXCAVATED VOID (The Black Cavity that Expands Symmetrical) */}
            {activeStep > 0 && activeStep < maxStep && (
              <motion.circle
                cx="500"
                cy={gabarit === '9m2' ? "350" : "430"}
                r={getCavityRadius()}
                fill="#000000"
                stroke="#ffffff"
                strokeWidth="2.5"
                strokeDasharray="6,4"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="shadow-inner"
                opacity="0.95"
              />
            )}

            {/* STAGE COMPLETE: FULL Profile Excavation Complete */}
            {activeStep === maxStep && (
              <motion.path
                d={gabarit === '9m2' ? "M 280,520 L 280,280 A 220,220 0 0,1 720,280 L 720,520 Z" : "M 100,650 L 100,300 A 400,400 0 0,1 900,300 L 900,650 Z"}
                fill="#000000"
                stroke="#22c55e"
                strokeWidth="4"
                initial={{ opacity: 0.8 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
              />
            )}

            {/* VISUAL PUSH ARROWS ON HOVER */}
            {hoveredHole && hoveredHole.type !== 'vide' && getHoleStatus(hoveredHole) === 'normal' && (
              <>
                {/* Golden line representing force vector */}
                {(() => {
                  const arrow = getArrowCoords(hoveredHole);
                  if (!arrow) return null;
                  return (
                    <motion.line
                      x1={arrow.x1}
                      y1={arrow.y1}
                      x2={arrow.x2}
                      y2={arrow.y2}
                      stroke="#fbbf24"
                      strokeWidth="3.5"
                      markerEnd="url(#marker-arrow)"
                      initial={{ strokeDashoffset: 50, strokeDasharray: 100 }}
                      animate={{ strokeDashoffset: 0 }}
                      className="animate-pulse"
                    />
                  );
                })()}
              </>
            )}

            {/* DRAW ALL HOLES */}
            {holesToRender.map((hole) => {
              const status = getHoleStatus(hole);
              return (
                <g key={hole.id}>
                  {/* Explosion star overlay on current blasting step */}
                  {status === 'blasting' && (
                    <g>
                      <circle
                        cx={hole.x}
                        cy={hole.y}
                        r="35"
                        fill="rgba(239, 68, 68, 0.45)"
                        className="animate-ping"
                      />
                      <path
                        d={`M ${hole.x} ${hole.y} l -25 -25 l 35 15 l 20 -35 l -5 45 l 40 5 l -40 20 l 15 35 l -30 -25 l -30 30 l 10 -40 z`}
                        fill="#f59e0b"
                        stroke="#f97316"
                        strokeWidth="2"
                        className="animate-pulse"
                      />
                    </g>
                  )}

                  {/* The hole physical circle */}
                  <circle
                    cx={hole.x}
                    cy={hole.y}
                    r={hoveredHole?.id === hole.id ? "24" : "18"}
                    className={`${getHoleColorClasses(hole, status)} transition-all duration-300 cursor-pointer stroke-[3.5px]`}
                    onMouseEnter={() => setHoveredHole(hole)}
                    onMouseLeave={() => setHoveredHole(null)}
                  />

                  {/* Text label index inside the circle */}
                  {status !== 'exploded' && (
                    <text
                      x={hole.x}
                      y={hole.y + 5}
                      textAnchor="middle"
                      className="font-black text-[12px] uppercase tracking-tighter fill-current select-none pointer-events-none"
                      fill={
                        hole.type === 'vide'
                          ? '#1e293b'
                          : hole.type === 'charge'
                          ? '#ffffff'
                          : '#111827'
                      }
                    >
                      {hole.label}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>

          {/* ACTIVE HOVER DETAIL BOARD */}
          <div className="absolute bottom-4 left-4 right-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-4 text-xs font-semibold text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            {hoveredHole ? (
              <div className="space-y-1 w-full">
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${
                    hoveredHole.type === 'vide' ? 'bg-white border' : 'bg-amber-400'
                  }`} />
                  <span className="font-black uppercase tracking-wider text-amber-400">
                    {hoveredHole.name}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-slate-300 uppercase">
                  <p>Type: <span className="font-extrabold text-white">{hoveredHole.type}</span></p>
                  <p>Délai: <span className="font-extrabold text-white">{hoveredHole.delay} ms</span></p>
                  {hoveredHole.type !== 'vide' && (
                    <p className="text-amber-300 flex items-center gap-1 font-black">
                      🎯 Vecteur de poussée : VERS LE VIDE CENTRAL
                    </p>
                  )}
                </div>
                <p className="text-slate-400 text-[10.5px] font-medium leading-relaxed italic border-t border-slate-800/60 pt-1.5 mt-1">
                  {hoveredHole.desc}
                </p>
              </div>
            ) : (
              <div className="text-slate-400 font-medium italic py-2 flex items-center gap-2">
                <Info className="w-4 h-4 text-slate-400 shrink-0" />
                Survolez un trou de forage sur le schéma pour analyser son délai, sa fonction et le vecteur de poussée mécanique.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: TIMELINE & FOOTAGE METERS (4 Columns) */}
      <div className="lg:col-span-4 flex flex-col justify-between space-y-6">
        
        {/* PROGRESS METRAGE PANEL */}
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
              Rendement Volée
            </span>
            <span className="text-[10px] font-black uppercase text-amber-600 bg-amber-400/10 px-2 py-0.5 rounded">
              SMI Objectif
            </span>
          </div>

          <h3 className="text-sm font-black uppercase text-slate-800 tracking-tight">
            MÉTRAGE ARRACHÉ ESTIMÉ
          </h3>

          <div className="space-y-2">
            <div className="flex justify-between items-baseline font-mono">
              <span className="text-3xl font-black text-slate-900">
                {getFootage().toFixed(1)} m
              </span>
              <span className="text-xs font-bold text-slate-500">
                sur {currentMaxDepth.toFixed(1)} m foré
              </span>
            </div>

            {/* GOLD PROGRESS BAR */}
            <div className="w-full bg-slate-200 h-4 rounded-full overflow-hidden relative border border-slate-300/30">
              <motion.div
                className="bg-gradient-to-r from-amber-500 to-amber-400 h-full rounded-full"
                initial={{ width: '0%' }}
                animate={{ width: `${currentPercentage}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
            </div>
            
            <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
              <span>Départ : 0.0m</span>
              <span>{currentPercentage}% du plan d'avancement</span>
            </div>
          </div>

          {/* ACTIVE GOAL VERDICT */}
          <div className="border-t border-slate-200/50 pt-4 mt-2">
            {activeStep === maxStep ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-emerald-800 space-y-1">
                <p className="text-xs font-black uppercase flex items-center gap-1.5">
                  ✅ 100% DU MÉTRAGE FORÉ
                </p>
                <p className="text-[10.5px] font-semibold text-emerald-700 leading-relaxed">
                  Excellent ! Le tir est complet. La roche de fond est intégralement arrachée jusqu'à l'extrémité des barres de forage, ne laissant aucun culot improductif.
                </p>
              </div>
            ) : (
              <div className="bg-slate-100 rounded-xl p-3 text-slate-600 space-y-1">
                <p className="text-xs font-black uppercase text-slate-700">
                  Tir en cours ({activeStep}/{maxStep})
                </p>
                <p className="text-[10.5px] font-semibold text-slate-500 leading-relaxed">
                  Faites défiler les étapes pour analyser le front de taille. Le métrage arraché augmente proportionnellement à l'évacuation des anneaux de cisaillement.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* TIMELINE CONTROLLERS */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5 flex-1 flex flex-col justify-between">
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase text-amber-600 bg-amber-400/10 px-2 py-0.5 rounded">
              Séquence Temporelle
            </span>
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="text-sm font-black uppercase text-slate-900">
                LIGNE DE RETARD
              </h3>
              <span className="font-mono text-xs font-black bg-slate-900 text-white px-2 py-0.5 rounded">
                Étape {activeStep} / {maxStep}
              </span>
            </div>
          </div>

          {/* Current step card description */}
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-2 flex-1 flex flex-col justify-center">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-slate-800">
                {stepExplanations[activeStep].title}
              </span>
              <span className="text-[10px] font-black uppercase text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded flex items-center gap-1">
                <Flame className="w-3 h-3 text-rose-500 shrink-0" />
                {stepExplanations[activeStep].time}
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-600 leading-relaxed">
              {stepExplanations[activeStep].desc}
            </p>
          </div>

          {/* CONTROLS BAR */}
          <div className="space-y-4 pt-2">
            
            {/* STEP DOTS CLICKABLE */}
            <div className="flex items-center justify-between px-1">
              {Array.from({ length: maxStep + 1 }).map((_, stepIdx) => (
                <button
                  key={stepIdx}
                  onClick={() => {
                    setActiveStep(stepIdx);
                    setIsPlaying(false);
                  }}
                  className={`w-6 h-6 rounded-full font-mono text-[10px] font-black flex items-center justify-center transition-all ${
                    activeStep === stepIdx
                      ? 'bg-amber-400 text-slate-950 scale-120 ring-2 ring-amber-500/30 font-black'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-500'
                  }`}
                >
                  {stepIdx}
                </button>
              ))}
            </div>

            {/* BUTTONS ROW */}
            <div className="grid grid-cols-5 gap-2 pt-1">
              <button
                onClick={handleReset}
                title="Départ"
                className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg flex items-center justify-center transition-colors text-xs font-bold"
              >
                <RotateCcw className="w-4 h-4 shrink-0" />
              </button>
              <button
                onClick={handlePrev}
                disabled={activeStep === 0}
                className="py-2.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-800 rounded-lg flex items-center justify-center transition-colors text-xs font-bold"
              >
                <ChevronLeft className="w-4 h-4 shrink-0" />
              </button>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className={`py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors text-xs font-black uppercase tracking-wider ${
                  isPlaying
                    ? 'bg-rose-500 hover:bg-rose-600 text-white'
                    : 'bg-amber-400 hover:bg-amber-500 text-slate-950 font-black'
                }`}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5 shrink-0" /> : <Play className="w-3.5 h-3.5 shrink-0" />}
                {isPlaying ? "PAUSE" : "AUTO"}
              </button>
              <button
                onClick={handleNext}
                disabled={activeStep === maxStep}
                className="py-2.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-800 rounded-lg flex items-center justify-center transition-colors text-xs font-bold"
              >
                <ChevronRight className="w-4 h-4 shrink-0" />
              </button>
              <button
                onClick={handleGoToEnd}
                title="Fin"
                className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg flex items-center justify-center transition-colors text-xs font-bold"
              >
                <SkipForward className="w-4 h-4 shrink-0" />
              </button>
            </div>
          </div>
        </div>

        {/* CAVEAT ALERTS */}
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
          <p className="text-[10.5px] font-black uppercase text-red-700 flex items-center gap-1.5 mb-1">
            <ShieldAlert className="w-4 h-4 text-red-500 shrink-0" />
            Consigne critique de sécurité
          </p>
          <p className="text-[10px] font-bold text-red-600 leading-relaxed">
            La voûte de galerie est la zone la plus exposée à l'écaillage. Les {gabarit === '9m2' ? '3' : '3'} trous de voûte doivent être forés parallèlement avec un angle de relèvement de 3% maximum. Un sur-profilage fragilise le massif, tandis qu'un sous-profilage bloque la circulation des engins de transport de minerai.
          </p>
        </div>

      </div>
    </div>
  );
};
