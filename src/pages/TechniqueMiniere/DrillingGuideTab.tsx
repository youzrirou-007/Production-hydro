import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  Info, 
  Layers, 
  Compass, 
  ChevronRight, 
  Sparkles, 
  AlertTriangle, 
  TrendingDown, 
  CheckCircle, 
  AlertOctagon,
  ZoomIn,
  ZoomOut,
  Maximize2
} from 'lucide-react';
import { HOLES_DATA } from './data';
import { HoleInfo } from './types';

// Simple 3D projection mathematical utility to avoid Three.js dependency
interface Point3D {
  x: number;
  y: number;
  z: number;
}

export const DrillingGuideTab: React.FC = () => {
  // Stem (Tige) selection
  const [tige, setTige] = useState<'1.8m' | '2.4m'>('1.8m');
  const targetDepth = tige === '1.8m' ? 1.7 : 2.3;
  const targetAdvance = tige === '1.8m' ? 1.7 : 2.3;

  // View modes
  // 'guide': Step-by-step and 3D Guide, 'compare': Good vs Bad split-screen
  const [viewMode, setViewMode] = useState<'guide' | 'compare'>('guide');

  // Animation States for Sequence
  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [animationSpeed, setAnimationSpeed] = useState<'slow' | 'normal' | 'fast'>('normal');
  const [drillProgress, setDrillProgress] = useState<number>(0); // 0 to 100 for current active step

  // Interactivity controls for 3D Viewport
  const [zoom, setZoom] = useState<number>(1.2);
  const [angleX, setAngleX] = useState<number>(20); // Rotation around X (pitch)
  const [angleY, setAngleY] = useState<number>(-35); // Rotation around Y (yaw)
  const [isRotating, setIsRotating] = useState<boolean>(true);
  const [showParallelLines, setShowParallelLines] = useState<boolean>(true);
  const [showAngles, setShowAngles] = useState<boolean>(true);

  // Hovered Hole Info
  const [hoveredHole, setHoveredHole] = useState<HoleInfo | null>(null);

  // Custom user inputs for calculator
  const [calcDepth, setCalcDepth] = useState<number>(1.7);
  const [calcTamping, setCalcTamping] = useState<number>(76); // cm

  // Drag states for rotating the 3D SVG
  const isDragging = useRef<boolean>(false);
  const previousMousePosition = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Filter 12m2 holes only
  const holes12 = HOLES_DATA; // 38 holes

  // Séquence de tir / forage stages:
  // 0: Initial state (massif rocheux brut)
  // 1: Bouchon (Delay 0ms - 3 vides + 6 chargés)
  // 2: Élargissement (Delay 25ms, 50ms, 75ms, 100ms)
  // 3: Contour & Finition (Delay 125ms - Voûte, Parements, Radier)
  // 4: Alignement final & Parallélisme parfait
  const steps = [
    {
      title: 'Massif Brut & Tracé',
      desc: 'Le front de taille de 12m² est marqué au théodolite. Les 38 positions sont prêtes pour l\'implantation pneumatique.',
      delayRange: 'Tous'
    },
    {
      title: 'Bouchon Brûlé (Priorité 1)',
      desc: 'Forage des 3 trous vides de décharge (V, non chargés) et des 6 trous de mine (0ms) qui l\'enserrent. C\'est le vide d\'expansion critique.',
      delayRange: '0 ms'
    },
    {
      title: 'Éventail d\'Élargissement (Priorité 2)',
      desc: 'Forage des couronnes concentriques 1, 2, 3 et 4 (25ms à 100ms). Les trous s\'ouvrent progressivement pour agrandir le cône de cisaillement.',
      delayRange: '25 ms à 100 ms'
    },
    {
      title: 'Découpe et Finition (Priorité 3)',
      desc: 'Forage de la périphérie : Radier (R), Parements (PG/PD) et Voûte (VC/VL). Garantit la stabilité structurelle et le gabarit final net.',
      delayRange: '125 ms'
    },
    {
      title: 'Vérification du Parallélisme',
      desc: 'Contrôle des inclinaisons au clinomètre de forage. Tous les axes doivent être strictement parallèles à moins de 2° d\'écartement.',
      delayRange: 'Lignes de guidage'
    }
  ];

  // Auto incremental rotation effect
  useEffect(() => {
    if (!isRotating || isDragging.current) return;
    const interval = setInterval(() => {
      setAngleY((prev) => (prev + 0.4) % 360);
    }, 30);
    return () => clearInterval(interval);
  }, [isRotating]);

  // Main animation play controller
  useEffect(() => {
    if (!isPlaying) return;
    
    const intervalTime = animationSpeed === 'slow' ? 3500 : animationSpeed === 'normal' ? 2200 : 1200;
    
    const timer = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= steps.length - 1) {
          return 0; // Loop back
        }
        return prev + 1;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isPlaying, animationSpeed]);

  // Simulated drilling depth progress bar
  useEffect(() => {
    let frameId: number;
    const start = Date.now();
    const duration = animationSpeed === 'slow' ? 3000 : animationSpeed === 'normal' ? 1800 : 800;

    const animate = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min((elapsed / duration) * 100, 100);
      setDrillProgress(progress);

      if (progress < 100) {
        frameId = requestAnimationFrame(animate);
      }
    };

    if (isPlaying) {
      frameId = requestAnimationFrame(animate);
    } else {
      setDrillProgress(100);
    }

    return () => cancelAnimationFrame(frameId);
  }, [currentStep, isPlaying, animationSpeed]);

  // Determine which holes are "active" / "drilled" at the current step
  const getHoleDrilledState = (hole: HoleInfo, stepIndex: number) => {
    if (stepIndex === 0) return 'not_drilled';
    
    const delay = hole.delay;
    const isV = hole.type === 'vide';

    // Step 1: Bouchon (delay = 0)
    if (stepIndex === 1) {
      if (delay === 0) return 'drilled';
      return 'not_drilled';
    }

    // Step 2: Elargissements (25 to 100)
    if (stepIndex === 2) {
      if (delay === 0) return 'drilled';
      if (delay > 0 && delay <= 100) return 'drilled';
      return 'not_drilled';
    }

    // Step 3, 4: All drilled
    return 'drilled';
  };

  // Projection logic helper for 3D simulation
  const projectPoint = (x: number, y: number, z: number, angleXDeg: number, angleYDeg: number): { x: number; y: number } => {
    // Standard coordinates centering (HOLES x is 100 to 900, y is 80 to 650)
    // Scale down coordinates to fit comfortably in -150 to 150 bounding box
    const cx = (x - 500) * 0.35 * zoom;
    const cy = (y - 360) * 0.35 * zoom;
    const cz = (z - targetDepth / 2) * 90 * zoom; // Center z axis

    // Convert degrees to radians
    const radX = (angleXDeg * Math.PI) / 180;
    const radY = (angleYDeg * Math.PI) / 180;

    // Rotation around Y (yaw)
    const x1 = cx * Math.cos(radY) - cz * Math.sin(radY);
    const z1 = cx * Math.sin(radY) + cz * Math.cos(radY);

    // Rotation around X (pitch)
    const y2 = cy * Math.cos(radX) - z1 * Math.sin(radX);
    const z2 = cy * Math.sin(radX) + z1 * Math.cos(radX);

    // Viewport projection offset (Canvas center is 240, 240)
    return {
      x: 240 + x1,
      y: 200 + y2
    };
  };

  // Mouse Drag handlers for rotating the 3D model
  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    previousMousePosition.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const deltaX = e.clientX - previousMousePosition.current.x;
    const deltaY = e.clientY - previousMousePosition.current.y;

    setAngleY((prev) => (prev + deltaX * 0.5) % 360);
    setAngleX((prev) => Math.max(-60, Math.min(60, prev - deltaY * 0.5))); // Clamped pitch

    previousMousePosition.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  // Calculate lost meterage based on angle deviation
  const getLostMeterage = (deviationAngle: number): { culot: number; yieldPct: number } => {
    // Formula for culot: deviation angle -> culot length in cm
    // 0° -> 0cm, 1° -> 3cm, 3° -> 11cm, 5° -> 26cm, 8° -> 46cm, etc.
    const culot = Math.round(deviationAngle * deviationAngle * 0.7 + deviationAngle * 2.5);
    const targetCm = targetDepth * 100;
    const realAdvanceCm = Math.max(0, targetCm - culot);
    const yieldPct = Math.min(100, Math.max(0, Math.round((realAdvanceCm / targetCm) * 100)));
    return { culot, yieldPct };
  };

  // Hand-curated random light angles (deviation) for the "Bad Forage" view to demonstrate issues
  const getHoleAngleDeviation = (holeId: string, isGood: boolean): number => {
    if (isGood) return 0.2 + (parseInt(holeId.replace(/\D/g, '') || '0') % 5) * 0.1; // Perfect alignment (0.2° to 0.6°)
    
    // Critical outliers in Bad Drilling
    if (['voute1', 'pg3', 'rad1', 'pd1', 'g3_1', 'c2', 'c5'].includes(holeId)) {
      return 5.8 + (parseInt(holeId.replace(/\D/g, '') || '0') % 4) * 0.8; // Bad alignment (5.8° to 9°)
    }
    return 1.2 + (parseInt(holeId.replace(/\D/g, '') || '0') % 8) * 0.4; // Mild misalignment
  };

  // Manual interactive calculator computations
  const manualCalculatorVerdict = useMemo(() => {
    const minTamping = 76; // cm
    const isConforme = calcTamping >= minTamping;
    const delta = minTamping - calcTamping;
    // Perte: 0.03m per missing cm
    const lostM = isConforme ? 0 : Number((delta * 0.03).toFixed(2));
    const finalAdvance = Math.max(0, calcDepth - lostM);
    const pct = Math.round((finalAdvance / calcDepth) * 100);

    return {
      isConforme,
      lostM,
      finalAdvance: Number(finalAdvance.toFixed(2)),
      pct
    };
  }, [calcDepth, calcTamping]);

  return (
    <div className="space-y-6 text-slate-900">
      
      {/* EXPLANATORY HEADER BANNER */}
      <div className="bg-gradient-to-r from-slate-950 to-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="bg-amber-500/10 text-amber-400 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md border border-amber-400/20">
              MODULE HYDROMINES
            </span>
            <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md border border-emerald-400/20">
              PHYSIQUE DES PRESSIONS
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-black uppercase tracking-wide text-slate-100 font-sans">
            Guide Scientifique & Alignement de Forage (12 m²)
          </h2>
          <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
            Pour la mine souterraine de <strong className="text-slate-200">SMI Imiter (Maroc)</strong>, la géométrie du forage est le facteur critique n°1. 
            Une infime déviation angulaire de 3° crée un culot de trou de 20cm, empêchant l'avancement de la volée. 
            Ce guide interactif instruit les secrétaires et responsables sur la rigueur du parallélisme parfait.
          </p>
        </div>

        {/* Stem (Tige) Switcher */}
        <div className="bg-slate-900 p-1.5 rounded-xl border border-slate-800 flex items-center gap-2 shrink-0">
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider px-2">
            Longueur Tige :
          </span>
          <button
            onClick={() => { setTige('1.8m'); if (calcDepth > 1.7) setCalcDepth(1.7); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
              tige === '1.8m'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            1.8 m (Volée 1.7m)
          </button>
          <button
            onClick={() => { setTige('2.4m'); setCalcDepth(2.3); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
              tige === '2.4m'
                ? 'bg-amber-500 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            2.4 m (Volée 2.3m)
          </button>
        </div>
      </div>

      {/* VIEW SELECTOR TABS */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          onClick={() => setViewMode('guide')}
          className={`pb-3 font-black text-xs uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            viewMode === 'guide'
              ? 'border-amber-500 text-slate-950'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          <Layers className="w-4 h-4" />
          1. Vue 3D & Séquenceur Interactive
        </button>
        <button
          onClick={() => setViewMode('compare')}
          className={`pb-3 font-black text-xs uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
            viewMode === 'compare'
              ? 'border-amber-500 text-slate-950'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          <Compass className="w-4 h-4" />
          2. Comparatif "Bon Forage" vs "Mauvais Forage"
        </button>
      </div>

      <AnimatePresence mode="wait">

        {/* ========================================================= */}
        {/* MODULE 1A : GUIDE INTERACTIF AVEC ROTATION ET SÉQUENCEUR */}
        {/* ========================================================= */}
        {viewMode === 'guide' && (
          <motion.div
            key="view-guide-interactive"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-6"
          >
            {/* LEFT COLUMN: INTERACTIVE CONTROLS AND 3D GRAPHIC VIEWPORT (8 cols) */}
            <div className="lg:col-span-8 flex flex-col space-y-4">
              
              {/* 3D Viewport Outer Frame */}
              <div className="bg-slate-950 border border-slate-900 rounded-2xl relative shadow-inner overflow-hidden flex flex-col h-[520px]">
                
                {/* Visual Header of Canvas */}
                <div className="p-4 bg-slate-950/80 backdrop-blur-md border-b border-slate-900/50 flex justify-between items-center z-10">
                  <div className="flex items-center gap-3">
                    <span className="flex h-2.5 w-2.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                    </span>
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">
                        Rendu Perspective Isométrique SVG
                      </h3>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">
                        Étape {currentStep + 1} : {steps[currentStep].title}
                      </p>
                    </div>
                  </div>

                  {/* Viewport helpers toggles */}
                  <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-lg border border-slate-800">
                    <button
                      onClick={() => setShowParallelLines(!showParallelLines)}
                      className={`px-2 py-1 text-[9px] font-black uppercase tracking-wider rounded-md transition-all cursor-pointer ${
                        showParallelLines ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                      }`}
                      title="Afficher les vecteurs d'alignement idéal"
                    >
                      Grille Parallélisme
                    </button>
                    <button
                      onClick={() => setShowAngles(!showAngles)}
                      className={`px-2 py-1 text-[9px] font-black uppercase tracking-wider rounded-md transition-all cursor-pointer ${
                        showAngles ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-slate-200'
                      }`}
                      title="Afficher les écarts angulaires"
                    >
                      Angles
                    </button>
                  </div>
                </div>

                {/* The Interactive SVG Canvas */}
                <div 
                  className="flex-1 relative cursor-grab active:cursor-grabbing select-none"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                >
                  <svg 
                    className="w-full h-full"
                    viewBox="0 0 480 400"
                    preserveAspectRatio="xMidYMid meet"
                  >
                    {/* Sky/Atmosphere/Rock texture representation */}
                    <defs>
                      <radialGradient id="rock-grad" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#1e293b" stopOpacity="1" />
                        <stop offset="80%" stopColor="#0f172a" stopOpacity="1" />
                        <stop offset="100%" stopColor="#020617" stopOpacity="1" />
                      </radialGradient>
                      <linearGradient id="cylinder-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.85" />
                        <stop offset="70%" stopColor="#d97706" stopOpacity="0.6" />
                        <stop offset="100%" stopColor="#78350f" stopOpacity="0.1" />
                      </linearGradient>
                      <linearGradient id="vide-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.6" />
                        <stop offset="100%" stopColor="#0c4a6e" stopOpacity="0.1" />
                      </linearGradient>
                    </defs>

                    {/* Background */}
                    <rect width="100%" height="100%" fill="url(#rock-grad)" />

                    {/* Massive 3D tunnel/galerie outline */}
                    <path 
                      d={`M ${projectPoint(100, 650, 0, angleX, angleY).x} ${projectPoint(100, 650, 0, angleX, angleY).y}
                          L ${projectPoint(100, 330, 0, angleX, angleY).x} ${projectPoint(100, 330, 0, angleX, angleY).y}
                          Q ${projectPoint(500, 50, 0, angleX, angleY).x} ${projectPoint(500, 50, 0, angleX, angleY).y}
                            ${projectPoint(900, 330, 0, angleX, angleY).x} ${projectPoint(900, 330, 0, angleX, angleY).y}
                          L ${projectPoint(900, 650, 0, angleX, angleY).x} ${projectPoint(900, 650, 0, angleX, angleY).y}
                          Z`}
                      fill="#1e293b"
                      fillOpacity="0.25"
                      stroke="#475569"
                      strokeWidth="1.5"
                      strokeDasharray="4 4"
                    />

                    {/* Deep face background outline (extruded to back) */}
                    <path 
                      d={`M ${projectPoint(100, 650, targetDepth, angleX, angleY).x} ${projectPoint(100, 650, targetDepth, angleX, angleY).y}
                          L ${projectPoint(100, 330, targetDepth, angleX, angleY).x} ${projectPoint(100, 330, targetDepth, angleX, angleY).y}
                          Q ${projectPoint(500, 50, targetDepth, angleX, angleY).x} ${projectPoint(500, 50, targetDepth, angleX, angleY).y}
                            ${projectPoint(900, 330, targetDepth, angleX, angleY).x} ${projectPoint(900, 330, targetDepth, angleX, angleY).y}
                          L ${projectPoint(900, 650, targetDepth, angleX, angleY).x} ${projectPoint(900, 650, targetDepth, angleX, angleY).y}
                          Z`}
                      fill="#020617"
                      fillOpacity="0.75"
                      stroke="#1e293b"
                      strokeWidth="1"
                    />

                    {/* Parallélisme Grid lines (virtual connections in the rock mass) */}
                    {showParallelLines && currentStep === 4 && (
                      <g stroke="#e2e8f0" strokeOpacity="0.15" strokeWidth="0.5">
                        {/* Longitudinal lines from front to back grid */}
                        <line 
                          x1={projectPoint(100, 650, 0, angleX, angleY).x} y1={projectPoint(100, 650, 0, angleX, angleY).y}
                          x2={projectPoint(100, 650, targetDepth, angleX, angleY).x} y2={projectPoint(100, 650, targetDepth, angleX, angleY).y}
                        />
                        <line 
                          x1={projectPoint(900, 650, 0, angleX, angleY).x} y1={projectPoint(900, 650, 0, angleX, angleY).y}
                          x2={projectPoint(900, 650, targetDepth, angleX, angleY).x} y2={projectPoint(900, 650, targetDepth, angleX, angleY).y}
                        />
                        <line 
                          x1={projectPoint(500, 80, 0, angleX, angleY).x} y1={projectPoint(500, 80, 0, angleX, angleY).y}
                          x2={projectPoint(500, 80, targetDepth, angleX, angleY).x} y2={projectPoint(500, 80, targetDepth, angleX, angleY).y}
                        />
                        {/* Radial lines linking key zones */}
                        <line 
                          x1={projectPoint(500, 430, 0, angleX, angleY).x} y1={projectPoint(500, 430, 0, angleX, angleY).y}
                          x2={projectPoint(500, 80, 0, angleX, angleY).x} y2={projectPoint(500, 80, 0, angleX, angleY).y}
                          stroke="#10b981" strokeOpacity="0.3" strokeDasharray="2 2"
                        />
                        <line 
                          x1={projectPoint(500, 430, 0, angleX, angleY).x} y1={projectPoint(500, 430, 0, angleX, angleY).y}
                          x2={projectPoint(125, 450, 0, angleX, angleY).x} y2={projectPoint(125, 450, 0, angleX, angleY).y}
                          stroke="#10b981" strokeOpacity="0.3" strokeDasharray="2 2"
                        />
                        <line 
                          x1={projectPoint(500, 430, 0, angleX, angleY).x} y1={projectPoint(500, 430, 0, angleX, angleY).y}
                          x2={projectPoint(875, 450, 0, angleX, angleY).x} y2={projectPoint(875, 450, 0, angleX, angleY).y}
                          stroke="#10b981" strokeOpacity="0.3" strokeDasharray="2 2"
                        />
                      </g>
                    )}

                    {/* DRILLING CYLINDERS (Parallel Tubes in Rock) */}
                    {holes12.map((hole) => {
                      const drillState = getHoleDrilledState(hole, currentStep);
                      if (drillState === 'not_drilled') return null;

                      // Calculate current drilling depth based on progress (if active step and hole belongs to this stage)
                      const isHoleActiveInCurrentStep = 
                        (currentStep === 1 && hole.delay === 0) ||
                        (currentStep === 2 && hole.delay > 0 && hole.delay <= 100) ||
                        (currentStep === 3 && hole.delay === 125);

                      const activeProgressRatio = isHoleActiveInCurrentStep ? drillProgress / 100 : 1;
                      const holeDepth = targetDepth * activeProgressRatio;

                      const pStart = projectPoint(hole.x, hole.y, 0, angleX, angleY);
                      const pEnd = projectPoint(hole.x, hole.y, holeDepth, angleX, angleY);

                      const isVide = hole.type === 'vide';
                      const cylinderColor = isVide ? 'url(#vide-grad)' : 'url(#cylinder-grad)';
                      const strokeColor = isVide ? '#38bdf8' : '#fbbf24';

                      // Determine if highlighted
                      const isHovered = hoveredHole?.id === hole.id;

                      return (
                        <g 
                          key={hole.id}
                          className="transition-all cursor-pointer"
                          onMouseEnter={() => setHoveredHole(hole)}
                          onMouseLeave={() => setHoveredHole(null)}
                        >
                          {/* Outer thin helper alignment rays */}
                          {showParallelLines && (
                            <line 
                              x1={pStart.x} y1={pStart.y}
                              x2={projectPoint(hole.x, hole.y, targetDepth * 1.5, angleX, angleY).x}
                              y2={projectPoint(hole.x, hole.y, targetDepth * 1.5, angleX, angleY).y}
                              stroke="#475569"
                              strokeWidth="0.4"
                              strokeDasharray="2 4"
                              strokeOpacity="0.4"
                            />
                          )}

                          {/* The Cylinder representing the hole */}
                          <line 
                            x1={pStart.x} y1={pStart.y}
                            x2={pEnd.x} y2={pEnd.y}
                            stroke={cylinderColor}
                            strokeWidth={isHovered ? 4 : 2}
                            strokeLinecap="round"
                            opacity={isHovered ? 1.0 : 0.75}
                          />

                          {/* Front of the hole (small circular cap) */}
                          <circle 
                            cx={pStart.x}
                            cy={pStart.y}
                            r={isHovered ? 3.5 : 2}
                            fill={isVide ? '#0284c7' : '#d97706'}
                            stroke={strokeColor}
                            strokeWidth="0.5"
                          />

                          {/* Dynamic numeric depth tags when hovered */}
                          {isHovered && (
                            <g>
                              <rect 
                                x={pStart.x + 10}
                                y={pStart.y - 12}
                                width="40"
                                height="14"
                                rx="3"
                                fill="#0f172a"
                                stroke="#f59e0b"
                                strokeWidth="0.5"
                                opacity="0.9"
                              />
                              <text 
                                x={pStart.x + 30}
                                y={pStart.y - 2}
                                textAnchor="middle"
                                fill="#f59e0b"
                                fontSize="7"
                                fontWeight="black"
                                fontFamily="monospace"
                              >
                                {holeDepth.toFixed(1)}m
                              </text>
                            </g>
                          )}
                        </g>
                      );
                    })}

                    {/* Clinometer Vector Indicator on Hovered Hole */}
                    {hoveredHole && showAngles && (() => {
                      const pStart = projectPoint(hoveredHole.x, hoveredHole.y, 0, angleX, angleY);
                      return (
                        <g>
                          {/* Ideal normal projection */}
                          <circle cx={pStart.x} cy={pStart.y} r="8" fill="none" stroke="#10b981" strokeWidth="0.5" strokeDasharray="1 1" />
                          <line x1={pStart.x - 12} y1={pStart.y} x2={pStart.x + 12} y2={pStart.y} stroke="#10b981" strokeWidth="0.4" strokeOpacity="0.5" />
                          <line x1={pStart.x} y1={pStart.y - 12} x2={pStart.x} y2={pStart.y + 12} stroke="#10b981" strokeWidth="0.4" strokeOpacity="0.5" />
                          <text 
                            x={pStart.x + 15}
                            y={pStart.y + 15}
                            fontSize="8"
                            fontWeight="bold"
                            fill="#10b981"
                            fontFamily="monospace"
                          >
                            Incl. 0.0° OK
                          </text>
                        </g>
                      );
                    })()}
                  </svg>

                  {/* Drag to Rotate Info Tag */}
                  <div className="absolute bottom-4 left-4 text-[9px] font-mono text-slate-500 uppercase tracking-widest bg-slate-950/80 px-2.5 py-1 rounded-md border border-slate-900/40 pointer-events-none">
                    🖱️ Maintenir clic et glisser pour faire pivoter (3D)
                  </div>

                  {/* Canvas Legend */}
                  <div className="absolute top-4 right-4 bg-slate-950/90 border border-slate-900 rounded-lg p-2.5 space-y-1.5 z-10 text-[9px] pointer-events-none">
                    <span className="font-bold uppercase tracking-wider text-slate-400 block pb-1 border-b border-slate-900">Légende</span>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-1.5 bg-sky-400 rounded-sm"></span>
                      <span className="text-slate-300 font-medium">Vide décharge (V)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-1.5 bg-amber-500 rounded-sm"></span>
                      <span className="text-slate-300 font-medium">Bouchon / Trous chargés (0)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-1.5 bg-orange-400 rounded-sm"></span>
                      <span className="text-slate-300 font-medium">Élargissements (1 à 4)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-1.5 bg-violet-400 rounded-sm"></span>
                      <span className="text-slate-300 font-medium">Découpe (R, PG, PD, Voute)</span>
                    </div>
                  </div>
                </div>

                {/* Viewport Action Controls Bar */}
                <div className="p-3 bg-slate-950 border-t border-slate-900 flex flex-wrap items-center justify-between gap-3 z-10">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setZoom((prev) => Math.min(2.0, prev + 0.1))}
                      className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 cursor-pointer"
                      title="Zoom Avant"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setZoom((prev) => Math.max(0.6, prev - 0.1))}
                      className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 cursor-pointer"
                      title="Zoom Arrière"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setAngleX(20);
                        setAngleY(-35);
                        setZoom(1.2);
                      }}
                      className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 text-[10px] font-black uppercase tracking-wider cursor-pointer"
                    >
                      Reset Caméra
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsRotating(!isRotating)}
                      className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider cursor-pointer transition-all ${
                        isRotating 
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30' 
                          : 'bg-slate-900 text-slate-400 border border-slate-800'
                      }`}
                    >
                      {isRotating ? '⏸️ Auto-Rotation Active' : '▶️ Auto-Rotation Off'}
                    </button>
                  </div>
                </div>
              </div>

              {/* SEQUENCE PLAYBACK CONTROLLER TIMELINE */}
              <div className="bg-[#141414] border border-slate-800/80 rounded-2xl p-4 space-y-3 shadow-md">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    Timeline Séquentielle de Forage Pneumatique (T23)
                  </h4>
                  
                  {/* Speed Controls */}
                  <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-lg border border-slate-900 text-[9px] font-black uppercase">
                    <span className="text-slate-500 px-1.5">Vitesse :</span>
                    <button
                      onClick={() => setAnimationSpeed('slow')}
                      className={`px-1.5 py-0.5 rounded-md cursor-pointer ${animationSpeed === 'slow' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'}`}
                    >
                      Lent
                    </button>
                    <button
                      onClick={() => setAnimationSpeed('normal')}
                      className={`px-1.5 py-0.5 rounded-md cursor-pointer ${animationSpeed === 'normal' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'}`}
                    >
                      Normal
                    </button>
                    <button
                      onClick={() => setAnimationSpeed('fast')}
                      className={`px-1.5 py-0.5 rounded-md cursor-pointer ${animationSpeed === 'fast' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'}`}
                    >
                      Rapide
                    </button>
                  </div>
                </div>

                {/* Progress Slider (Interactive selection) */}
                <div className="grid grid-cols-5 gap-2 relative pt-2">
                  {steps.map((step, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setCurrentStep(idx);
                        setIsPlaying(false); // Stop auto playback on click
                      }}
                      className={`p-2 rounded-xl text-left border transition-all cursor-pointer ${
                        currentStep === idx
                          ? 'bg-amber-500/10 border-amber-500 text-slate-100 shadow-xs'
                          : 'bg-slate-950/40 border-slate-900 text-slate-400 hover:border-slate-800'
                      }`}
                    >
                      <div className="text-[9px] font-black uppercase text-amber-500/80 mb-0.5">Étape {idx + 1}</div>
                      <div className="text-[10px] font-black truncate text-slate-200">{step.title}</div>
                      <div className="text-[8px] font-mono text-slate-500 truncate">{step.delayRange}</div>
                    </button>
                  ))}
                </div>

                {/* Micro controller buttons */}
                <div className="flex items-center justify-between pt-1.5">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black uppercase tracking-wider rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
                    >
                      {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      {isPlaying ? 'Pause' : 'Lecture Auto'}
                    </button>
                    <button
                      onClick={() => {
                        setCurrentStep(0);
                        setIsPlaying(false);
                      }}
                      className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 rounded-xl transition-all cursor-pointer"
                      title="Réinitialiser"
                    >
                      <RotateCcw className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Dynamic description of active step */}
                  <div className="flex-1 ml-4 bg-slate-950/40 border border-slate-900/50 rounded-xl p-2.5 text-xs text-slate-300">
                    <span className="font-bold text-slate-200 block mb-0.5 uppercase tracking-wider text-[10px]">Statut Opérateur :</span>
                    {steps[currentStep].desc}
                  </div>
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: DETAILED INFOPANEL & HOVER TOOLTIPS (4 cols) */}
            <div className="lg:col-span-4 space-y-4">
              
              {/* INTERACTIVE HOVER CARD PANEL */}
              <div className="bg-[#141414] border border-slate-800 rounded-2xl p-5 space-y-4 shadow-md text-white">
                <div className="border-b border-slate-800 pb-3">
                  <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest block">
                    SÉLECTEUR D'ÉLÉMENT
                  </span>
                  <h3 className="text-sm font-black uppercase tracking-wide text-slate-100">
                    Sondage du Front de Taille
                  </h3>
                </div>

                {hoveredHole ? (
                  <motion.div
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3.5"
                  >
                    <div className="flex items-start justify-between">
                      <div className="bg-slate-900 px-3 py-1 rounded-lg border border-slate-800 font-mono text-amber-400 font-black text-xs">
                        {hoveredHole.label}
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] font-bold text-slate-400 block uppercase">
                          DÉLAI DE DÉTONATION
                        </span>
                        <span className="text-xs font-black text-amber-500 font-mono">
                          {hoveredHole.delay} ms
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">
                        Nom du trou & section
                      </span>
                      <h4 className="text-xs font-black text-slate-100 leading-tight">
                        {hoveredHole.name}
                      </h4>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">
                        Rôle Technique
                      </span>
                      <p className="text-xs text-slate-300 leading-relaxed bg-slate-900/40 p-2.5 rounded-lg border border-slate-900">
                        {hoveredHole.desc}
                      </p>
                    </div>

                    {/* Technical metrics */}
                    <div className="grid grid-cols-2 gap-2 text-center pt-2">
                      <div className="bg-slate-950 p-2 rounded-xl border border-slate-900">
                        <span className="text-[8px] text-slate-500 block uppercase font-bold">PROF. THÉORIQUE</span>
                        <span className="text-xs font-black text-slate-200 font-mono">{targetDepth.toFixed(2)} m</span>
                      </div>
                      <div className="bg-slate-950 p-2 rounded-xl border border-slate-900">
                        <span className="text-[8px] text-slate-500 block uppercase font-bold">ANGLE CONSEILLÉ</span>
                        <span className="text-xs font-black text-emerald-400 font-mono">90° (0° Déviation)</span>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <div className="flex flex-col items-center justify-center text-center py-10 space-y-2 text-slate-500 border border-dashed border-slate-800 rounded-xl bg-slate-950/20">
                    <Info className="w-8 h-8 text-slate-600 animate-pulse" />
                    <p className="text-xs font-bold uppercase tracking-wider">Aucun trou survolé</p>
                    <p className="text-[10px] max-w-xs px-4">
                      Survolez l'un des 38 points du front de taille ou des cylindres 3D pour révéler sa fiche technique.
                    </p>
                  </div>
                )}
              </div>

              {/* SCIENTIFIC INFORMATION CARD */}
              <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
                <div className="border-b border-slate-100 pb-3">
                  <h4 className="text-xs font-black uppercase text-slate-900 tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    Règle d'or : La Formule d'Arrachement
                  </h4>
                </div>

                <div className="space-y-3.5 text-xs text-slate-600 leading-relaxed">
                  <p>
                    Le parallélisme des trous conditionne la <strong>Distance de Moindre Résistance (W)</strong>. 
                    Si deux trous s'écartent l'un de l'autre en fond de taille :
                  </p>
                  
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono text-[11px] text-slate-700 space-y-1">
                    <div className="flex justify-between">
                      <span>• Déviation angulaire :</span>
                      <strong className="text-amber-700">3° max conseillé</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>• Écartement optimal :</span>
                      <strong className="text-slate-900">60 cm constant</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>• Diamètre taillant :</span>
                      <strong className="text-slate-900">38 mm (T23)</strong>
                    </div>
                  </div>

                  {/* Small Deviation Table */}
                  <div className="space-y-1">
                    <span className="text-[9px] font-black uppercase tracking-wider text-slate-400 block">
                      Tableau d'impact angulaire (Tige {tige})
                    </span>
                    <table className="w-full text-left text-[11px] border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-[10px] font-bold uppercase text-slate-500">
                          <th className="py-1">Angle (°)</th>
                          <th className="py-1">Culot estimé</th>
                          <th className="py-1 text-right">Rendement</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr className="border-b border-slate-100 text-emerald-700 font-bold">
                          <td className="py-1">0° à 1°</td>
                          <td className="py-1">0 - 3 cm</td>
                          <td className="py-1 text-right">98% (Excellent)</td>
                        </tr>
                        <tr className="border-b border-slate-100 text-amber-700">
                          <td className="py-1">3°</td>
                          <td className="py-1">11 cm</td>
                          <td className="py-1 text-right">91% (Admissible)</td>
                        </tr>
                        <tr className="border-b border-slate-100 text-orange-700 font-medium">
                          <td className="py-1">5°</td>
                          <td className="py-1">26 cm</td>
                          <td className="py-1 text-right">82% (Faible)</td>
                        </tr>
                        <tr className="text-red-700 font-black">
                          <td className="py-1">&gt; 8°</td>
                          <td className="py-1">&gt; 46 cm</td>
                          <td className="py-1 text-right">&lt; 70% (Désastreux)</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <p className="text-[10px] text-slate-400 italic">
                    * Un parallélisme défaillant crée des ponts rocheux incassables au fond, ce qui détruit le rendement de la volée et laisse de dangereux culots contenant de l'explosif non sauté.
                  </p>
                </div>
              </div>

            </div>
          </motion.div>
        )}

        {/* ========================================================= */}
        {/* MODULE 1B : COMPARAISON VISUELLE BON VS MAUVAIS FORAGE   */}
        {/* ========================================================= */}
        {viewMode === 'compare' && (
          <motion.div
            key="view-comparative"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-6"
          >
            {/* Split screen layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* LEFT CARD: BON FORAGE (CONFORME) */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                {/* Header tag */}
                <div className="bg-emerald-600 text-white px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-100 shrink-0" />
                    <div>
                      <h3 className="font-black uppercase text-xs tracking-wider">FORAGE CORRECT (CONFORME)</h3>
                      <p className="text-[10px] text-emerald-100 font-medium">Parallélisme parfait &bull; Écartement maîtrisé</p>
                    </div>
                  </div>
                  <span className="bg-white/20 text-white font-mono text-xs font-black px-2.5 py-1 rounded-lg">
                    Rendement : ~98%
                  </span>
                </div>

                {/* SVG Visual Representation of Good parallel holes */}
                <div className="bg-slate-950 h-[280px] relative flex items-center justify-center">
                  <svg className="w-full h-full" viewBox="0 0 400 240">
                    <defs>
                      <linearGradient id="correct-cyl" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.85" />
                        <stop offset="85%" stopColor="#047857" stopOpacity="0.5" />
                        <stop offset="100%" stopColor="#064e3b" stopOpacity="0.1" />
                      </linearGradient>
                    </defs>
                    {/* Tunnel mass limits */}
                    <rect x="20" y="30" width="360" height="180" fill="#111827" fillOpacity="0.7" rx="10" stroke="#334155" />
                    
                    {/* 3D Cut Representation of Rock face */}
                    <line x1="160" y1="30" x2="160" y2="210" stroke="#1e293b" strokeDasharray="3 3" />
                    
                    {/* Parallel holes */}
                    {[50, 80, 110, 140, 170, 200].map((yOffset, idx) => (
                      <g key={idx}>
                        {/* Perfect parallel horizontal tube */}
                        <line 
                          x1="40" y1={yOffset}
                          x2="280" y2={yOffset}
                          stroke="url(#correct-cyl)"
                          strokeWidth="6"
                          strokeLinecap="round"
                        />
                        {/* Entry collar */}
                        <circle cx="40" cy={yOffset} r="4" fill="#10b981" />
                        {/* Core center guideline showing perfect align */}
                        <line x1="40" y1={yOffset} x2="350" y2={yOffset} stroke="#10b981" strokeWidth="0.5" strokeDasharray="4 4" strokeOpacity="0.4" />
                        {/* Angle tag */}
                        <text x="50" y={yOffset - 6} fill="#34d399" fontSize="7" fontFamily="monospace">0.0°</text>
                      </g>
                    ))}

                    {/* Blast Advancement plane */}
                    <line x1="280" y1="30" x2="280" y2="210" stroke="#10b981" strokeWidth="1.5" strokeDasharray="2 2" />
                    <text x="285" y="45" fill="#10b981" fontSize="8" fontWeight="black" fontFamily="monospace">PLAN ARRACHÉ (1.7m)</text>

                    {/* Background rock volume */}
                    <rect x="280" y="30" width="100" height="180" fill="#020617" fillOpacity="0.9" />
                    <text x="330" y="125" textAnchor="middle" fill="#475569" fontSize="9" fontWeight="bold">MASSIF INTACT</text>
                  </svg>

                  {/* Absolute positioning badge */}
                  <div className="absolute bottom-3 left-3 bg-slate-900/90 text-white p-2 rounded-lg border border-slate-800 text-[10px] space-y-0.5 pointer-events-none">
                    <span className="text-emerald-400 font-bold block">✓ Aucun culot résiduel</span>
                    <span className="text-slate-300">✓ Gaz parfaitement confinés</span>
                  </div>
                </div>

                {/* Practical consequences listing */}
                <div className="p-5 space-y-3.5 text-xs text-slate-600">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">AVANCEMENT VOLÉE</span>
                      <span className="text-lg font-black text-slate-900">{targetAdvance.toFixed(1)} mètres</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">CULOTS ENREGISTRÉS</span>
                      <span className="text-lg font-black text-emerald-600">0 cm</span>
                    </div>
                  </div>

                  <div className="space-y-1 bg-emerald-50 text-emerald-950 p-3.5 rounded-xl border border-emerald-200">
                    <span className="font-bold block text-emerald-900 text-[11px] uppercase">Rendement de Fragmentation</span>
                    <p className="leading-relaxed text-[11px]">
                      Tous les trous sont parallèles. La pression de détonation de l'ANFO s'exerce de manière strictement uniforme sur toute la longueur. La roche se cisaille à 100% jusqu'à l'extrémité forée.
                    </p>
                  </div>
                </div>
              </div>

              {/* RIGHT CARD: MAUVAIS FORAGE (NON-CONFORME) */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                {/* Header tag */}
                <div className="bg-red-600 text-white px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertOctagon className="w-5 h-5 text-red-100 shrink-0" />
                    <div>
                      <h3 className="font-black uppercase text-xs tracking-wider">FORAGE INCORRECT (DÉVIANT)</h3>
                      <p className="text-[10px] text-red-100 font-medium">Trous divergents &bull; Mauvais parallélisme (&gt; 5°)</p>
                    </div>
                  </div>
                  <span className="bg-white/20 text-white font-mono text-xs font-black px-2.5 py-1 rounded-lg">
                    Rendement : ~65%
                  </span>
                </div>

                {/* SVG Visual Representation of Bad diverging holes */}
                <div className="bg-slate-950 h-[280px] relative flex items-center justify-center">
                  <svg className="w-full h-full" viewBox="0 0 400 240">
                    <defs>
                      <linearGradient id="deviant-cyl" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity="0.85" />
                        <stop offset="70%" stopColor="#b91c1c" stopOpacity="0.5" />
                        <stop offset="100%" stopColor="#7f1d1d" stopOpacity="0.1" />
                      </linearGradient>
                    </defs>
                    {/* Tunnel mass limits */}
                    <rect x="20" y="30" width="360" height="180" fill="#111827" fillOpacity="0.7" rx="10" stroke="#334155" />
                    
                    {/* Parallel lines for visual comparison */}
                    {[50, 80, 110, 140, 170, 200].map((y, idx) => (
                      <line key={idx} x1="40" y1={y} x2="280" y2={y} stroke="#334155" strokeWidth="0.5" strokeDasharray="2 4" strokeOpacity="0.5" />
                    ))}

                    {/* DIVERGENT HOLES - Non-parallel cylinders with curves/angles */}
                    {/* Hole 1: Diverges upwards */}
                    <line x1="40" y1="50" x2="250" y2="35" stroke="url(#deviant-cyl)" strokeWidth="6" strokeLinecap="round" />
                    <circle cx="40" cy="50" r="4" fill="#ef4444" />
                    <text x="50" y="44" fill="#f87171" fontSize="7" fontFamily="monospace">6.2° ↑</text>

                    {/* Hole 2: Perfect (just as a contrast) */}
                    <line x1="40" y1="80" x2="280" y2="80" stroke="url(#correct-cyl)" strokeWidth="6" strokeLinecap="round" opacity="0.4" />
                    <circle cx="40" cy="80" r="4" fill="#10b981" opacity="0.4" />

                    {/* Hole 3: Converges with Hole 4 */}
                    <line x1="40" y1="110" x2="240" y2="125" stroke="url(#deviant-cyl)" strokeWidth="6" strokeLinecap="round" />
                    <circle cx="40" cy="110" r="4" fill="#ef4444" />
                    <text x="50" y="104" fill="#f87171" fontSize="7" fontFamily="monospace">4.8° ↓</text>

                    {/* Hole 4: Diverges downwards */}
                    <line x1="40" y1="140" x2="230" y2="165" stroke="url(#deviant-cyl)" strokeWidth="6" strokeLinecap="round" />
                    <circle cx="40" cy="140" r="4" fill="#ef4444" />
                    <text x="50" y="134" fill="#f87171" fontSize="7" fontFamily="monospace">7.5° ↓</text>

                    {/* Hole 5: Diverges upwards */}
                    <line x1="40" y1="170" x2="260" y2="185" stroke="url(#deviant-cyl)" strokeWidth="6" strokeLinecap="round" />
                    <circle cx="40" cy="170" r="4" fill="#ef4444" />
                    <text x="50" y="164" fill="#f87171" fontSize="7" fontFamily="monospace">5.1° ↑</text>

                    {/* Blast Advancement plane truncated due to failures */}
                    <line x1="210" y1="30" x2="210" y2="210" stroke="#ef4444" strokeWidth="1.5" />
                    <text x="135" y="45" fill="#ef4444" fontSize="8" fontWeight="black" fontFamily="monospace">AVANCEMENT COUPE (1.1m)</text>

                    {/* CULOTS ZONE (Visibles en fond de trou sous forme de bloc rocheux intact sombre) */}
                    <path 
                      d="M 210,30 L 280,30 L 280,210 L 210,210 Z" 
                      fill="#1e1b4b" 
                      fillOpacity="0.8" 
                      stroke="#ef4444" 
                      strokeWidth="0.5"
                    />
                    <text x="245" y="125" textAnchor="middle" fill="#f87171" fontSize="9" fontWeight="black" className="animate-pulse">
                      CULOTS (50cm)
                    </text>

                    {/* Target plan dashed reference */}
                    <line x1="280" y1="30" x2="280" y2="210" stroke="#f59e0b" strokeWidth="1" strokeDasharray="3 3" />
                  </svg>

                  {/* Absolute positioning badge */}
                  <div className="absolute bottom-3 left-3 bg-red-950/95 text-white p-2 rounded-lg border border-red-900 text-[10px] space-y-0.5 pointer-events-none">
                    <span className="text-red-400 font-bold block">✗ Perte majeure d'énergie</span>
                    <span className="text-red-300">✗ Coups soufflés fréquents</span>
                  </div>
                </div>

                {/* Practical consequences listing */}
                <div className="p-5 space-y-3.5 text-xs text-slate-600">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">AVANCEMENT CONSTATÉ</span>
                      <span className="text-lg font-black text-red-600">1.1 mètres</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">PERTE DE MÉTRAGE (CULOT)</span>
                      <span className="text-lg font-black text-red-600">60 cm / volée</span>
                    </div>
                  </div>

                  <div className="space-y-1 bg-red-50 text-red-950 p-3.5 rounded-xl border border-red-200">
                    <span className="font-bold block text-red-900 text-[11px] uppercase">Gaspillage et Danger opérationnel</span>
                    <p className="leading-relaxed text-[11px]">
                      La déviation angulaire de forage élargit la distance entre charges au-delà du seuil critique de rupture. L'ANFO n'a plus l'énergie requise pour briser le massif de fond. La volée échoue à mi-chemin, laissant d'énormes culs-de-bouteille rocheux.
                    </p>
                  </div>
                </div>
              </div>

            </div>

            {/* EDUCATIONAL IMPACT CALCULATOR PANEL */}
            <div className="bg-[#141414] border border-slate-800 rounded-2xl p-6 text-white space-y-5">
              <div className="border-b border-slate-800 pb-3">
                <h4 className="text-sm font-black uppercase text-amber-500 tracking-wider flex items-center gap-1.5">
                  <TrendingDown className="w-5 h-5 text-amber-400" />
                  Calculateur de Simulation de Perte de Rendement (Régularité)
                </h4>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">
                  Simulez l'effet de l'alignement et du bourrage sur la volée réelle
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Input 1: Profondeur */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase text-slate-300 tracking-wider block">
                    Profondeur théorique du trou (mètres)
                  </label>
                  <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-xl border border-slate-900">
                    <input 
                      type="range" 
                      min="1.0" 
                      max="3.0" 
                      step="0.1"
                      value={calcDepth}
                      onChange={(e) => setCalcDepth(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                    <span className="font-mono font-black text-xs text-amber-400 w-12 text-right">{calcDepth}m</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    Dépend du perforateur pneumatique Montabert T23 et de la tige installée.
                  </p>
                </div>

                {/* Input 2: Bourrage */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase text-slate-300 tracking-wider block">
                    Longueur du bourrage d'argile (cm)
                  </label>
                  <div className="flex items-center gap-3 bg-slate-950 p-3 rounded-xl border border-slate-900">
                    <input 
                      type="range" 
                      min="20" 
                      max="150" 
                      step="1"
                      value={calcTamping}
                      onChange={(e) => setCalcTamping(Number(e.target.value))}
                      className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                    />
                    <span className="font-mono font-black text-xs text-amber-400 w-12 text-right">{calcTamping}cm</span>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-normal">
                    La norme SMI est de <strong>20 × D_trou = 76cm minimum</strong> pour étanchéifier les gaz d'ANFO.
                  </p>
                </div>

                {/* Output Verdict Card */}
                <div className={`p-4 rounded-xl border transition-all ${
                  manualCalculatorVerdict.isConforme 
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-100' 
                    : 'bg-red-500/10 border-red-500/30 text-red-100'
                } flex flex-col justify-between`}>
                  
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] font-black uppercase tracking-wider block">
                      Verdict Étanchéité
                    </span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-md uppercase font-sans tracking-wide ${
                      manualCalculatorVerdict.isConforme ? 'bg-emerald-500 text-slate-950' : 'bg-red-600 text-white'
                    }`}>
                      {manualCalculatorVerdict.isConforme ? 'Conforme' : 'Coup Soufflé Risqué'}
                    </span>
                  </div>

                  <div className="py-2.5">
                    <div className="text-2xl font-black font-mono tracking-tight text-white">
                      {manualCalculatorVerdict.pct}% <span className="text-xs text-slate-400 font-medium">rendement</span>
                    </div>
                    {manualCalculatorVerdict.lostM > 0 ? (
                      <p className="text-[10px] text-red-400 leading-tight mt-1">
                        ⚠️ Perte estimée de <strong className="font-mono">{manualCalculatorVerdict.lostM}m</strong> de métrage due à un bourrage insuffisant.
                      </p>
                    ) : (
                      <p className="text-[10px] text-emerald-400 leading-tight mt-1">
                        ✓ Confinement parfait des gaz d'ANFO. Énergie exploitée à 100%.
                      </p>
                    )}
                  </div>

                  <div className="text-[10px] text-slate-400 border-t border-slate-800/60 pt-1.5 flex justify-between font-mono">
                    <span>Avancement Réel :</span>
                    <strong className="text-slate-100">{manualCalculatorVerdict.finalAdvance} m</strong>
                  </div>

                </div>

              </div>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
};

export default DrillingGuideTab;
