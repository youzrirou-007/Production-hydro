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
  ChevronLeft,
  Sparkles, 
  AlertTriangle, 
  TrendingDown, 
  CheckCircle, 
  AlertOctagon,
  ZoomIn,
  ZoomOut,
  Volume2,
  VolumeX,
  Eye,
  Activity,
  Maximize2,
  Minimize2,
  Move
} from 'lucide-react';
import { HOLES_DATA, getHolesData } from './data';
import { HoleInfo, GabaritType } from './types';

// Helper to retrieve color, gradient and label properties for each specific hole type
export const getHoleVisuals = (type: string) => {
  switch (type) {
    case 'vide':
      return {
        cylinder: 'url(#cylinder-grad-vide)',
        stroke: '#94a3b8', // Slate Blue Gray (cohérent avec Plan de Tir 2D)
        collar: '#64748b',
        text: 'Vide de décharge (Ø 75mm)',
        badgeClass: 'bg-slate-500/10 text-slate-400 border-slate-500/20'
      };
    case 'charge':
      return {
        cylinder: 'url(#cylinder-grad-charge)',
        stroke: '#f59e0b', // Gold (cohérent avec Plan de Tir 2D)
        collar: '#d97706',
        text: 'Trou de mine (Bouchon)',
        badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20'
      };
    case 'g1':
      return {
        cylinder: 'url(#cylinder-grad-g1)',
        stroke: '#3b82f6', // Royal Blue (cohérent avec Plan de Tir 2D)
        collar: '#2563eb',
        text: 'Bouchon - Élargisseur G1',
        badgeClass: 'bg-blue-500/10 text-blue-400 border-blue-500/20'
      };
    case 'g2':
      return {
        cylinder: 'url(#cylinder-grad-g2)',
        stroke: '#ef4444', // Red (cohérent avec Plan de Tir 2D)
        collar: '#dc2626',
        text: 'Bouchon - Élargisseur G2',
        badgeClass: 'bg-red-500/10 text-red-400 border-red-500/20'
      };
    case 'g3':
      return {
        cylinder: 'url(#cylinder-grad-g3)',
        stroke: '#22d3ee', // Cyan (cohérent avec Plan de Tir 2D)
        collar: '#0891b2',
        text: 'Bouchon - Élargisseur G3',
        badgeClass: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
      };
    case 'g4':
      return {
        cylinder: 'url(#cylinder-grad-g4)',
        stroke: '#f97316', // Orange (cohérent avec Plan de Tir 2D)
        collar: '#ea580c',
        text: 'Bouchon - Élargisseur G4',
        badgeClass: 'bg-orange-500/10 text-orange-400 border-orange-500/20'
      };
    case 'radier':
      return {
        cylinder: 'url(#cylinder-grad-radier)',
        stroke: '#8b5cf6', // Violet (cohérent avec Plan de Tir 2D)
        collar: '#7c3aed',
        text: 'Radier (Trous de Sole)',
        badgeClass: 'bg-purple-500/10 text-purple-400 border-purple-500/20'
      };
    case 'parement':
      return {
        cylinder: 'url(#cylinder-grad-parement)',
        stroke: '#14b8a6', // Teal (cohérent avec Plan de Tir 2D)
        collar: '#0d9488',
        text: 'Parement (Trous de Flancs)',
        badgeClass: 'bg-teal-500/10 text-teal-400 border-teal-500/20'
      };
    case 'voute':
      return {
        cylinder: 'url(#cylinder-grad-voute)',
        stroke: '#f43f5e', // Rose / Light Crimson (cohérent avec Plan de Tir 2D)
        collar: '#e11d48',
        text: 'Voûte (Trous de Ciel)',
        badgeClass: 'bg-rose-500/10 text-rose-400 border-rose-500/20'
      };
    default:
      return {
        cylinder: 'url(#cylinder-grad-gold)',
        stroke: '#fbbf24',
        collar: '#d97706',
        text: 'Trou de mine',
        badgeClass: 'bg-slate-500/10 text-slate-400 border-slate-500/20'
      };
  }
};

interface DrillingGuideTabProps {
  gabarit?: GabaritType;
}

export const DrillingGuideTab: React.FC<DrillingGuideTabProps> = ({ gabarit = '12m2' }) => {
  // Stem (Tige) selection
  const [tige, setTige] = useState<'1.8m' | '2.4m'>('1.8m');
  const targetDepth = tige === '1.8m' ? 1.7 : 2.3;

  // Exact gallery geometry defining 2D profile coordinates & 3D projection parameters
  const galleryGeometry = useMemo(() => {
    if (gabarit === '9m2') {
      return {
        xMin: 280,
        xMax: 720,
        yWall: 280,
        yMax: 520,
        yCtrl: -160,
        yApex: 60,
      };
    } else {
      // '12m2' or '12m2_intl'
      return {
        xMin: 60,
        xMax: 940,
        yWall: 280,
        yMax: 670,
        yCtrl: -180,
        yApex: 50,
      };
    }
  }, [gabarit]);

  // View modes
  // 'guide': Step-by-step and 3D Guide, 'compare': Good vs Bad split-screen
  const [viewMode, setViewMode] = useState<'guide' | 'compare'>('guide');

  // Animation & Séquencing States
  const [activePhaseIdx, setActivePhaseIdx] = useState<number>(0);
  const [activeHoleInPhaseIdx, setActiveHoleInPhaseIdx] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [animationSpeed, setAnimationSpeed] = useState<'slow' | 'normal' | 'fast'>('normal');
  const [drillProgress, setDrillProgress] = useState<number>(0); // 0 to 100 for current active step
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // Interactivity controls for 3D Viewport
  const [zoom, setZoom] = useState<number>(0.85); // Safer zoom to ensure empty borders (vides dans les bords)
  const [angleX, setAngleX] = useState<number>(0); // 0 by default for straight-on face-to-face view
  const [angleY, setAngleY] = useState<number>(0); // 0 by default for straight-on face-to-face view
  const [panX, setPanX] = useState<number>(0);
  const [panY, setPanY] = useState<number>(0);
  const [dragMode, setDragMode] = useState<'rotate' | 'pan'>('rotate');
  const [isRotating, setIsRotating] = useState<boolean>(false); // disabled by default for clear static initial presentation
  const [showParallelLines, setShowParallelLines] = useState<boolean>(true);
  const [showAngles, setShowAngles] = useState<boolean>(true);

  // Hovered Hole Info
  const [hoveredHole, setHoveredHole] = useState<HoleInfo | null>(null);

  // Custom user inputs for calculator
  const [calcDepth, setCalcDepth] = useState<number>(1.7);
  const [calcTamping, setCalcTamping] = useState<number>(76); // cm

  // Escape key listener to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  // Drag states for rotating the 3D SVG
  const isDragging = useRef<boolean>(false);
  const previousMousePosition = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragStartButton = useRef<number>(0);

  // Web Audio Synth for realistic drilling sound effects (rubbing and vibration)
  const audioCtxRef = useRef<AudioContext | null>(null);
  const drillGainNodeRef = useRef<GainNode | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(true); // Safe default

  const initAudio = () => {
    if (audioCtxRef.current) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      
      const gainNode = ctx.createGain();
      gainNode.gain.setValueAtTime(0, ctx.currentTime);
      gainNode.connect(ctx.destination);
      drillGainNodeRef.current = gainNode;
      audioCtxRef.current = ctx;

      // Rumble oscillator (hammer impact)
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(45, ctx.currentTime); 
      
      const oscFilter = ctx.createBiquadFilter();
      oscFilter.type = 'lowpass';
      oscFilter.frequency.setValueAtTime(80, ctx.currentTime);
      
      osc.connect(oscFilter);
      oscFilter.connect(gainNode);
      osc.start();

      // Metal friction hiss (brown/white noise mix)
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      noise.loop = true;

      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(1000, ctx.currentTime);
      noiseFilter.Q.setValueAtTime(2.5, ctx.currentTime);

      noise.connect(noiseFilter);
      noiseFilter.connect(gainNode);
      noise.start();

    } catch (e) {
      console.warn("Failed to initialize drilling Web Audio synth:", e);
    }
  };

  // Sound control effect
  useEffect(() => {
    if (!audioCtxRef.current || !drillGainNodeRef.current) return;
    const isDrillingNow = isPlaying && drillProgress > 0 && drillProgress < 100;
    
    if (isDrillingNow && !isMuted) {
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      drillGainNodeRef.current.gain.setTargetAtTime(0.12, audioCtxRef.current.currentTime, 0.08);
    } else {
      drillGainNodeRef.current.gain.setTargetAtTime(0, audioCtxRef.current.currentTime, 0.12);
    }
  }, [isPlaying, drillProgress, isMuted]);

  // Master sorted drilling list based on active gallery size
  const drillHolesList = useMemo(() => {
    const rawHoles = getHolesData(gabarit as GabaritType);
    
    const typeGroups: Record<string, HoleInfo[]> = {
      vide: [],
      charge: [],
      g1: [],
      g2: [],
      g3: [],
      g4: [],
      radier: [],
      parement: [],
      voute: [],
    };
    
    rawHoles.forEach(h => {
      if (typeGroups[h.type]) {
        typeGroups[h.type].push(h);
      }
    });
    
    // Sort items within each category for natural physical drilling paths (e.g. left to right, top to bottom)
    typeGroups.vide.sort((a, b) => a.y - b.y);
    typeGroups.charge.sort((a, b) => a.x - b.x || a.y - b.y);
    typeGroups.g1.sort((a, b) => a.x - b.x || a.y - b.y);
    typeGroups.g2.sort((a, b) => a.x - b.x || a.y - b.y);
    typeGroups.g3.sort((a, b) => a.x - b.x || a.y - b.y);
    typeGroups.g4.sort((a, b) => a.x - b.x || a.y - b.y);
    typeGroups.radier.sort((a, b) => a.x - b.x);
    typeGroups.parement.sort((a, b) => a.y - b.y || a.x - b.x);
    typeGroups.voute.sort((a, b) => a.x - b.x);
    
    const sorted: HoleInfo[] = [];
    const order = ['vide', 'charge', 'g1', 'g2', 'g3', 'g4', 'radier', 'parement', 'voute'];
    order.forEach(t => {
      sorted.push(...typeGroups[t]);
    });
    
    return sorted;
  }, [gabarit]);

  // Structured Drilling Phases according to User Specs
  // 12m²: 4 widening groups after the core.
  // 9m²: 3 widening groups after the core.
  const phases = useMemo(() => {
    if (gabarit === '9m2') {
      return [
        {
          id: 'bouchon',
          title: '1. Bouchon Cylindrique (Core)',
          desc: 'Forage du cœur de la volée : 1 trou vide de décharge central (V) non chargé pour l\'expansion de la roche, et 4 trous de mine chargés tirés à 0ms.',
          types: ['vide', 'charge'],
          color: 'from-amber-500 to-yellow-400',
          badge: 'Étape 1 : Le Bouchon'
        },
        {
          id: 'g1',
          title: '2. Élargissement - Groupe 1',
          desc: 'Premier anneau concentrique de 4 trous autour du bouchon. Pousse la roche diagonalement vers le vide central d\'abattage.',
          types: ['g1'],
          color: 'from-blue-500 to-cyan-400',
          badge: 'Étape 2 : Élargisseur 1'
        },
        {
          id: 'g2',
          title: '3. Élargissement - Groupe 2',
          desc: 'Deuxième couronne d\'abattage de 4 trous à retardement (50ms). Augmente la cavité centrale libérée.',
          types: ['g2'],
          color: 'from-rose-500 to-pink-400',
          badge: 'Étape 3 : Élargisseur 2'
        },
        {
          id: 'g3',
          title: '4. Élargissement - Groupe 3',
          desc: 'Troisième couronne d\'abattage concentrique de 4 trous à 75ms d\'allumage préparant le contour de la galerie.',
          types: ['g3'],
          color: 'from-teal-500 to-emerald-400',
          badge: 'Étape 4 : Élargisseur 3'
        },
        {
          id: 'contour',
          title: '5. Trous de Contour & Finition',
          desc: 'Forage périphérique de découpe finale : trous de semelle (Radier), parois droites/gauche (Parements) et voûte d\'arche.',
          types: ['radier', 'parement', 'voute'],
          color: 'from-purple-500 to-violet-400',
          badge: 'Étape 5 : Découpe Gabarit'
        }
      ];
    } else if (gabarit === '12m2_intl') {
      return [
        {
          id: 'bouchon',
          title: '1. Le Bouchon Standard International (Langefors)',
          desc: 'Bouchon cylindrique selon la méthode Langefors-Kihlström (1963) : 6 trous vides de décharge (non chargés) pour expansion maximale, et 3 trous chargés au TOVEX tirés à 0ms.',
          types: ['vide', 'charge'],
          color: 'from-amber-500 to-yellow-400',
          badge: 'Étape 1 : Bouchon Intl.'
        },
        {
          id: 'g1',
          title: '2. Élargissement - Groupe 1',
          desc: 'Premier anneau concentrique de 4 trous autour du bouchon. Casse la roche vers la large cavité centrale créée par les 6 trous de décharge.',
          types: ['g1'],
          color: 'from-blue-500 to-cyan-400',
          badge: 'Étape 2 : Élargisseur 1'
        },
        {
          id: 'g2',
          title: '3. Élargissement - Groupe 2',
          desc: 'Deuxième couronne d\'abattage de 4 trous (50ms) pour accroître le volume d\'ouverture. Ratio vide/chargé favorable.',
          types: ['g2'],
          color: 'from-rose-500 to-pink-400',
          badge: 'Étape 3 : Élargisseur 2'
        },
        {
          id: 'g3',
          title: '4. Élargissement - Groupe 3',
          desc: 'Troisième couronne de 4 trous (75ms). Progression concentrique symétrique vers le contour de la galerie.',
          types: ['g3'],
          color: 'from-teal-500 to-emerald-400',
          badge: 'Étape 4 : Élargisseur 3'
        },
        {
          id: 'g4',
          title: '5. Élargissement - Groupe 4',
          desc: 'Quatrième couronne de 4 trous (100ms), dernière étape avant les trous de finition périphérique.',
          types: ['g4'],
          color: 'from-orange-500 to-amber-400',
          badge: 'Étape 5 : Élargisseur 4'
        },
        {
          id: 'contour',
          title: '6. Trous de Contour & Finition',
          desc: 'Forage périphérique final : Radier (sol), Parements (murs), Voûte (arche). Découpe le profil officiel 12m² de la galerie.',
          types: ['radier', 'parement', 'voute'],
          color: 'from-purple-500 to-violet-400',
          badge: 'Étape 6 : Découpe Gabarit'
        }
      ];
    } else {
      // 12m² SMI
      return [
        {
          id: 'bouchon',
          title: '1. Le Bouchon Brûlé SMI (Core)',
          desc: 'Configuration terrain SMI Imiter : 3 trous vides de décharge (Ø38mm, non chargés) et 6 trous de mine chargés au TOVEX tirés à 0ms simultanément.',
          types: ['vide', 'charge'],
          color: 'from-amber-500 to-yellow-400',
          badge: 'Étape 1 : Le Bouchon'
        },
        {
          id: 'g1',
          title: '2. Élargissement - Groupe 1',
          desc: 'Premier anneau concentrique de 4 trous entourant le bouchon. Casse la roche vers la cavité centrale libérée.',
          types: ['g1'],
          color: 'from-blue-500 to-cyan-400',
          badge: 'Étape 2 : Élargisseur 1'
        },
        {
          id: 'g2',
          title: '3. Élargissement - Groupe 2',
          desc: 'Deuxième couronne d\'abattage concentrique de 4 trous (50ms) pour accroître le volume d\'ouverture rocheux.',
          types: ['g2'],
          color: 'from-rose-500 to-pink-400',
          badge: 'Étape 3 : Élargisseur 2'
        },
        {
          id: 'g3',
          title: '4. Élargissement - Groupe 3',
          desc: 'Troisième couronne d\'abattage concentrique de 4 trous (75ms) poussant la roche de manière symétrique vers le centre.',
          types: ['g3'],
          color: 'from-teal-500 to-emerald-400',
          badge: 'Étape 4 : Élargisseur 3'
        },
        {
          id: 'g4',
          title: '5. Élargissement - Groupe 4',
          desc: 'Quatrième couronne d\'abattage concentrique de 4 trous (100ms), dernière étape de broyage avant le contour de la galerie.',
          types: ['g4'],
          color: 'from-orange-500 to-amber-400',
          badge: 'Étape 5 : Élargisseur 4'
        },
        {
          id: 'contour',
          title: '6. Trous de Contour & Finition',
          desc: 'Forage périphérique de découpe finale de la galerie de 12m² : trous de semelle (Radier), parois (Parements) et voûte d\'arche.',
          types: ['radier', 'parement', 'voute'],
          color: 'from-purple-500 to-violet-400',
          badge: 'Étape 6 : Découpe Gabarit'
        }
      ];
    }
  }, [gabarit]);

  const activePhase = phases[activePhaseIdx] || phases[0];

  // Filter holes that belong to the active phase
  const activePhaseHoles = useMemo(() => {
    if (!activePhase) return [];
    return drillHolesList.filter(h => activePhase.types.includes(h.type));
  }, [activePhase, drillHolesList]);

  const selectedHole = activePhaseHoles[activeHoleInPhaseIdx] || activePhaseHoles[0] || null;

  // Reset drill progress when selecting a new hole manually or switching phase
  const selectHoleManually = (idx: number) => {
    setIsPlaying(false);
    setActiveHoleInPhaseIdx(idx);
    setDrillProgress(100); // Instantly drilled when manually inspected
  };

  const handleNextHole = () => {
    setIsPlaying(false);
    if (activeHoleInPhaseIdx < activePhaseHoles.length - 1) {
      setActiveHoleInPhaseIdx(prev => prev + 1);
      setDrillProgress(100);
    } else {
      // Move to next phase
      if (activePhaseIdx < phases.length - 1) {
        setActivePhaseIdx(prev => prev + 1);
        setActiveHoleInPhaseIdx(0);
        setDrillProgress(100);
      }
    }
  };

  const handlePrevHole = () => {
    setIsPlaying(false);
    if (activeHoleInPhaseIdx > 0) {
      setActiveHoleInPhaseIdx(prev => prev - 1);
      setDrillProgress(100);
    } else {
      // Move to previous phase
      if (activePhaseIdx > 0) {
        setActivePhaseIdx(prev => prev - 1);
        // We'll set the index to the last hole of the previous phase in its own hook
      }
    }
  };

  // Sync state transitions safely
  useEffect(() => {
    setActiveHoleInPhaseIdx(0);
    setDrillProgress(0);
  }, [activePhaseIdx]);

  useEffect(() => {
    setActivePhaseIdx(0);
    setActiveHoleInPhaseIdx(0);
    setDrillProgress(0);
  }, [gabarit]);

  // Auto-incremental rotation of 3D view
  useEffect(() => {
    if (!isRotating || isDragging.current) return;
    const interval = setInterval(() => {
      setAngleY((prev) => (prev + 0.3) % 360);
    }, 40);
    return () => clearInterval(interval);
  }, [isRotating]);

  // Drilling simulator sequencer logic
  useEffect(() => {
    if (!isPlaying) return;
    
    const intervalTime = animationSpeed === 'slow' ? 50 : animationSpeed === 'normal' ? 28 : 14;
    
    const timer = setInterval(() => {
      setDrillProgress((prev) => {
        if (prev < 100) {
          return prev + 1.2; // drill bit advancing
        } else {
          // Finished drilling this hole! Wait 1.2s then move to the next one
          clearInterval(timer);
          setTimeout(() => {
            setActiveHoleInPhaseIdx((currentHoleIdx) => {
              if (currentHoleIdx < activePhaseHoles.length - 1) {
                setDrillProgress(0);
                return currentHoleIdx + 1;
              } else {
                // Phase completed! Advance phase
                setActivePhaseIdx((currentPIdx) => {
                  if (currentPIdx < phases.length - 1) {
                    return currentPIdx + 1;
                  } else {
                    return 0; // Loop back
                  }
                });
                return 0;
              }
            });
          }, 1400);
          return 100;
        }
      });
    }, intervalTime);
    
    return () => clearInterval(timer);
  }, [isPlaying, activePhaseIdx, activeHoleInPhaseIdx, activePhaseHoles.length, phases.length, animationSpeed]);

  // Drilling status check helper for rendering
  const getHoleDrillingStatus = (hole: HoleInfo) => {
    const holePhaseIdx = phases.findIndex(p => p.types.includes(hole.type));
    if (holePhaseIdx < 0) return 'not_drilled';
    
    if (holePhaseIdx < activePhaseIdx) {
      return 'drilled';
    }
    if (holePhaseIdx > activePhaseIdx) {
      return 'not_drilled';
    }
    
    const holeIdxInPhase = activePhaseHoles.findIndex(h => h.id === hole.id);
    if (holeIdxInPhase < activeHoleInPhaseIdx) {
      return 'drilled';
    }
    if (holeIdxInPhase === activeHoleInPhaseIdx) {
      return 'drilling';
    }
    return 'not_drilled';
  };

  // Distance computation helper (Curated real physical dimensions of SMI Imiter)
  const getReferenceHole = (hole: HoleInfo, holesList: HoleInfo[]): { refHole: HoleInfo; label: string; distCm: number } | null => {
    if (hole.type === 'vide') {
      if (hole.id === 'v2' || hole.id === 'v9_1') {
        const v1 = holesList.find(h => h.id === 'v1');
        if (v1) return { refHole: v1, label: "Entraxes vides", distCm: 30 };
      }
      if (hole.id === 'v3') {
        const v2 = holesList.find(h => h.id === 'v2');
        if (v2) return { refHole: v2, label: "Entraxes vides", distCm: 30 };
      }
      return null;
    }
    
    if (hole.type === 'charge') {
      const emptyHoles = holesList.filter(h => h.type === 'vide');
      if (emptyHoles.length > 0) {
        let nearest = emptyHoles[0];
        let minDist = Infinity;
        emptyHoles.forEach(eh => {
          const d = Math.sqrt((eh.x - hole.x)**2 + (eh.y - hole.y)**2);
          if (d < minDist) {
            minDist = d;
            breakTarget: // break out optimization or similar
            minDist = d;
            nearest = eh;
          }
        });
        // 15 cm precisely as requested for realistic bouchon to central void distance
        const distCm = 15; 
        return { refHole: nearest, label: "Distance au vide central", distCm };
      }
    }
    
    if (hole.type === 'g1') {
      const emptyHoles = holesList.filter(h => h.type === 'vide');
      if (emptyHoles.length > 0) {
        const targetEmpty = emptyHoles.find(h => h.id === 'v2') || emptyHoles[0];
        // Scientific calculation for medium hardness rock with 38mm drilling bit
        const distCm = 30;
        return { refHole: targetEmpty, label: "Distance au vide du bouchon", distCm };
      }
    }
    
    if (hole.type === 'g2') {
      const g1Holes = holesList.filter(h => h.type === 'g1');
      if (g1Holes.length > 0) {
        let nearest = g1Holes[0];
        let minDist = Infinity;
        g1Holes.forEach(gh => {
          const d = Math.sqrt((gh.x - hole.x)**2 + (gh.y - hole.y)**2);
          if (d < minDist) {
            minDist = d;
            nearest = gh;
          }
        });
        // Scientific calculation for medium hardness rock with 38mm drilling bit
        const distCm = 45;
        return { refHole: nearest, label: "Distance à la cavité G1", distCm };
      }
    }
    
    if (hole.type === 'g3') {
      const g2Holes = holesList.filter(h => h.type === 'g2');
      if (g2Holes.length > 0) {
        let nearest = g2Holes[0];
        let minDist = Infinity;
        g2Holes.forEach(gh => {
          const d = Math.sqrt((gh.x - hole.x)**2 + (gh.y - hole.y)**2);
          if (d < minDist) {
            minDist = d;
            nearest = gh;
          }
        });
        // Scientific calculation for medium hardness rock with 38mm drilling bit
        const distCm = 60;
        return { refHole: nearest, label: "Distance à la cavité G2", distCm };
      }
    }
    
    if (hole.type === 'g4') {
      const g3Holes = holesList.filter(h => h.type === 'g3');
      if (g3Holes.length > 0) {
        let nearest = g3Holes[0];
        let minDist = Infinity;
        g3Holes.forEach(gh => {
          const d = Math.sqrt((gh.x - hole.x)**2 + (gh.y - hole.y)**2);
          if (d < minDist) {
            minDist = d;
            nearest = gh;
          }
        });
        // Scientific calculation for medium hardness rock with 38mm drilling bit
        const distCm = 75;
        return { refHole: nearest, label: "Distance à la cavité G3", distCm };
      }
    }
    
    if (['radier', 'parement', 'voute'].includes(hole.type)) {
      const siblings = holesList.filter(h => h.type === hole.type && h.id !== hole.id);
      if (siblings.length > 0) {
        let nearest = siblings[0];
        let minDist = Infinity;
        siblings.forEach(sh => {
          const d = Math.sqrt((sh.x - hole.x)**2 + (sh.y - hole.y)**2);
          if (d < minDist) {
            minDist = d;
            nearest = sh;
          }
        });
        let distCm = 60;
        if (hole.type === 'radier') distCm = 70;
        if (hole.type === 'voute') distCm = 50;
        return { refHole: nearest, label: "Écartement (Maille)", distCm };
      }
    }
    
    return null;
  };

  // Dynamic centering calculation based on the bounding box of projected coordinates
  const projectionTranslation = useMemo(() => {
    const geom = galleryGeometry;
    const points = [
      { x: geom.xMin, y: geom.yMax, z: 0 },
      { x: geom.xMax, y: geom.yMax, z: 0 },
      { x: 500, y: geom.yApex, z: 0 },
      { x: geom.xMin, y: geom.yWall, z: 0 },
      { x: geom.xMax, y: geom.yWall, z: 0 },
      { x: geom.xMin, y: geom.yMax, z: targetDepth },
      { x: geom.xMax, y: geom.yMax, z: targetDepth },
      { x: 500, y: geom.yApex, z: targetDepth },
      { x: geom.xMin, y: geom.yWall, z: targetDepth },
      { x: geom.xMax, y: geom.yWall, z: targetDepth }
    ];

    let minX1 = Infinity;
    let maxX1 = -Infinity;
    let minY2 = Infinity;
    let maxY2 = -Infinity;

    // Bounding box calculation performed in unzoomed space to prevent zoom-canceling math
    const BASE_SCALE = 0.44;
    const scaleFactor = BASE_SCALE; 
    const scaleFactorZ = 100;

    const radX = (angleX * Math.PI) / 180;
    const radY = (angleY * Math.PI) / 180;

    points.forEach(p => {
      const cx = (p.x - 500) * scaleFactor;
      const cy = (p.y - 360) * scaleFactor;
      const cz = (p.z - targetDepth / 2) * scaleFactorZ;

      // Y-axis rotation (yaw)
      const x1 = cx * Math.cos(radY) - cz * Math.sin(radY);
      const z1 = cx * Math.sin(radY) + cz * Math.cos(radY);

      // X-axis rotation (pitch)
      const y2 = cy * Math.cos(radX) - z1 * Math.sin(radX);

      if (x1 < minX1) minX1 = x1;
      if (x1 > maxX1) maxX1 = x1;
      if (y2 < minY2) minY2 = y2;
      if (y2 > maxY2) maxY2 = y2;
    });

    const projCenterX = (minX1 + maxX1) / 2;
    const projCenterY = (minY2 + maxY2) / 2;
    const width = maxX1 - minX1;
    const height = maxY2 - minY2;

    const MAX_WIDTH = 800;
    const MAX_HEIGHT = 580;
    const autoFitScaleX = width > 0 ? MAX_WIDTH / width : 1.0;
    const autoFitScaleY = height > 0 ? MAX_HEIGHT / height : 1.0;
    const autoFitScale = Math.min(autoFitScaleX, autoFitScaleY);

    return {
      offsetX: projCenterX,
      offsetY: projCenterY,
      width: width,
      height: height,
      autoFitScale: autoFitScale
    };
  }, [angleX, angleY, targetDepth, galleryGeometry]);

  // 3D Isometric SVG projection helper
  const projectPoint = (x: number, y: number, z: number, angleXDeg: number, angleYDeg: number): { x: number; y: number } => {
    // Math optimized to separate base projection geometry from responsive zoom
    const BASE_SCALE = 0.44;
    const scaleFactor = BASE_SCALE;
    const scaleFactorZ = 100;

    // Center coordinates projected cleanly
    const cx = (x - 500) * scaleFactor;
    const cy = (y - 360) * scaleFactor; 
    const cz = (z - targetDepth / 2) * scaleFactorZ; 

    const radX = (angleXDeg * Math.PI) / 180;
    const radY = (angleYDeg * Math.PI) / 180;

    // Y-axis rotation (yaw)
    const x1 = cx * Math.cos(radY) - cz * Math.sin(radY);
    const z1 = cx * Math.sin(radY) + cz * Math.cos(radY);

    // X-axis rotation (pitch)
    const y2 = cy * Math.cos(radX) - z1 * Math.sin(radX);

    // Perfect centering scale combining auto-fit geometry with reactive zoom factor
    const afs = projectionTranslation.autoFitScale * zoom;
    // Align the top of the 3D bounding box perfectly with the "Légende Volée (3D)" title (at y = 45) under any zoom level
    const centerY = 45 + 290 * zoom;
    return {
      x: 500 + (x1 - projectionTranslation.offsetX) * afs + panX,
      y: centerY + (y2 - projectionTranslation.offsetY) * afs + panY
    };
  };

  // Drag-to-rotate & drag-to-pan events
  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    previousMousePosition.current = { x: e.clientX, y: e.clientY };
    dragStartButton.current = e.button;
    if (e.button === 2) {
      e.preventDefault();
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const deltaX = e.clientX - previousMousePosition.current.x;
    const deltaY = e.clientY - previousMousePosition.current.y;

    const shouldPan = dragMode === 'pan' || e.shiftKey || dragStartButton.current === 2;

    if (shouldPan) {
      setPanX((prev) => prev + deltaX);
      setPanY((prev) => prev + deltaY);
    } else {
      setAngleY((prev) => (prev + deltaX * 0.5) % 360);
      setAngleX((prev) => Math.max(-50, Math.min(50, prev - deltaY * 0.5)));
    }

    previousMousePosition.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const refInfo = useMemo(() => {
    if (!selectedHole) return null;
    return getReferenceHole(selectedHole, drillHolesList);
  }, [selectedHole, drillHolesList]);

  // Good vs Bad Drilling mathematics
  const getLostMeterage = (deviationAngle: number): { culot: number; yieldPct: number } => {
    const targetCm = targetDepth * 100;
    const radians = (deviationAngle * Math.PI) / 180;
    const culot = Math.round(targetCm * Math.tan(radians));
    const realAdvanceCm = Math.max(0, targetCm - culot);
    const yieldPct = Math.min(100, Math.max(0, Math.round((realAdvanceCm / targetCm) * 100)));
    return { culot, yieldPct };
  };

  const manualCalculatorVerdict = useMemo(() => {
    const minTamping = 76; 
    const isConforme = calcTamping >= minTamping;
    const delta = minTamping - calcTamping;
    const lostM = isConforme ? 0 : Number((delta * 0.03).toFixed(2));
    const finalAdvance = Math.max(0, targetDepth - lostM);
    const pct = Math.round((finalAdvance / targetDepth) * 100);

    return {
      isConforme,
      lostM,
      finalAdvance: Number(finalAdvance.toFixed(2)),
      pct
    };
  }, [targetDepth, calcTamping]);

  return (
    <div className="space-y-6 text-slate-900" id="drilling-guide-tab">
      
      {/* EXPLANATORY HEADER BANNER */}
      <div className="bg-gradient-to-r from-slate-950 to-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-md flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="bg-amber-500/10 text-amber-400 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md border border-amber-400/20">
              MODULE HYDROMINES
            </span>
            <span className="bg-emerald-500/10 text-emerald-400 text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md border border-emerald-400/20">
              JUMBO SIMULATEUR T23
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-black uppercase tracking-wide text-slate-100 font-sans">
            Guide de Forage & Implantation d'Arche ({gabarit === '9m2' ? '9 m²' : '12 m²'})
          </h2>
          <p className="text-xs text-slate-400 max-w-3xl leading-relaxed">
            Pour la mine souterraine de <strong className="text-slate-200">SMI Imiter (Maroc)</strong>, la régularité spatiale est le premier facteur d'arrachement. 
            Ce guide interactif instruit pas-à-pas sur la séquence de perforation, les distances inter-trous critiques et la géométrie des semelles, parements et voûtes.
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
                ? 'bg-amber-500 text-slate-950 shadow-sm font-black'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            1.8 m (Volée 1.7m)
          </button>
          <button
            onClick={() => { setTige('2.4m'); setCalcDepth(2.3); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-black transition-all cursor-pointer ${
              tige === '2.4m'
                ? 'bg-amber-500 text-slate-950 shadow-sm font-black'
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
          1. Simulateur & Séquenceur de Forage Pas-à-Pas
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
            className="flex flex-col space-y-6"
          >
            {/* TOP ROW: 3D VIEWPORT WITH ADVANCED GRAPHICS (Full-Width) */}
            <div className="w-full flex flex-col space-y-4">
              
              <div className={isFullscreen 
                ? "fixed inset-0 z-50 bg-slate-950 flex flex-col w-screen h-screen p-6 overflow-hidden animate-in fade-in duration-200" 
                : "bg-slate-950 border border-slate-900 rounded-3xl relative shadow-2xl overflow-hidden flex flex-col h-[820px]"
              }>
                
                {/* Visual Header of Canvas */}
                <div className="p-4 bg-slate-950/95 border-b border-slate-900/80 flex justify-between items-center z-10">
                  <div className="flex items-center gap-3">
                    <span className="flex h-2.5 w-2.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                    </span>
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-slate-200">
                        Visualiseur 3D Mathématique Rigide
                      </h3>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest font-mono">
                        {activePhase.badge} &bull; Perforation active
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Audio Synth Activator */}
                    <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                      <button
                        onClick={() => {
                          initAudio();
                          setIsMuted(prev => !prev);
                        }}
                        className={`p-1.5 rounded-md transition-colors cursor-pointer flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider ${
                          !isMuted 
                            ? 'bg-amber-500 text-slate-950' 
                            : 'bg-slate-950 text-slate-400 hover:text-slate-200'
                        }`}
                        title={isMuted ? "Activer le son du perforateur" : "Couper le son"}
                      >
                        {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                        {!isMuted ? 'SON ON' : 'ACTIVER LE SON'}
                      </button>
                    </div>

                    {/* Fullscreen Toggle Button */}
                    <button
                      onClick={() => setIsFullscreen(prev => !prev)}
                      className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-amber-500 hover:text-amber-400 transition-colors cursor-pointer flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider"
                      title={isFullscreen ? "Quitter Plein Écran (Echap)" : "Plein Écran"}
                    >
                      {isFullscreen ? <Minimize2 className="w-3.5 h-3.5 text-rose-500" /> : <Maximize2 className="w-3.5 h-3.5" />}
                      {isFullscreen ? <span className="text-rose-500">QUITTER</span> : 'PLEIN ÉCRAN'}
                    </button>
                  </div>
                </div>

                {/* The Interactive SVG Canvas */}
                <div 
                  className="flex-1 min-h-0 relative cursor-grab active:cursor-grabbing select-none"
                  onMouseDown={handleMouseDown}
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                  onContextMenu={(e) => e.preventDefault()}
                  id="svg-viewport-area"
                >
                  <svg 
                    className="absolute inset-0 w-full h-full"
                    viewBox="0 0 1000 880"
                    preserveAspectRatio="xMidYMid meet"
                  >
                    <defs>
                      <radialGradient id="rock-grad-dark" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor="#1e293b" stopOpacity="1" />
                        <stop offset="85%" stopColor="#0f172a" stopOpacity="1" />
                        <stop offset="100%" stopColor="#020617" stopOpacity="1" />
                      </radialGradient>
                      {/* VIDE - Slate Gray */}
                      <linearGradient id="cylinder-grad-vide" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#94a3b8" stopOpacity="0.85" />
                        <stop offset="70%" stopColor="#64748b" stopOpacity="0.6" />
                        <stop offset="100%" stopColor="#475569" stopOpacity="0.15" />
                      </linearGradient>
                      {/* CHARGE - Amber Gold */}
                      <linearGradient id="cylinder-grad-charge" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.85" />
                        <stop offset="70%" stopColor="#d97706" stopOpacity="0.6" />
                        <stop offset="100%" stopColor="#78350f" stopOpacity="0.15" />
                      </linearGradient>
                      {/* G1 - Royal Blue */}
                      <linearGradient id="cylinder-grad-g1" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.85" />
                        <stop offset="70%" stopColor="#2563eb" stopOpacity="0.6" />
                        <stop offset="100%" stopColor="#1d4ed8" stopOpacity="0.15" />
                      </linearGradient>
                      {/* G2 - Bright Red */}
                      <linearGradient id="cylinder-grad-g2" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity="0.85" />
                        <stop offset="70%" stopColor="#dc2626" stopOpacity="0.6" />
                        <stop offset="100%" stopColor="#991b1b" stopOpacity="0.15" />
                      </linearGradient>
                      {/* G3 - Cyan */}
                      <linearGradient id="cylinder-grad-g3" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.85" />
                        <stop offset="70%" stopColor="#0891b2" stopOpacity="0.6" />
                        <stop offset="100%" stopColor="#0e7490" stopOpacity="0.15" />
                      </linearGradient>
                      {/* G4 - Orange */}
                      <linearGradient id="cylinder-grad-g4" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f97316" stopOpacity="0.85" />
                        <stop offset="70%" stopColor="#ea580c" stopOpacity="0.6" />
                        <stop offset="100%" stopColor="#9a3412" stopOpacity="0.15" />
                      </linearGradient>
                      {/* RADIER - Violet */}
                      <linearGradient id="cylinder-grad-radier" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.85" />
                        <stop offset="70%" stopColor="#7c3aed" stopOpacity="0.6" />
                        <stop offset="100%" stopColor="#5b21b6" stopOpacity="0.15" />
                      </linearGradient>
                      {/* PAREMENT - Teal */}
                      <linearGradient id="cylinder-grad-parement" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.85" />
                        <stop offset="70%" stopColor="#0d9488" stopOpacity="0.6" />
                        <stop offset="100%" stopColor="#115e59" stopOpacity="0.15" />
                      </linearGradient>
                      {/* VOUTE - Rose */}
                      <linearGradient id="cylinder-grad-voute" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.85" />
                        <stop offset="70%" stopColor="#e11d48" stopOpacity="0.6" />
                        <stop offset="100%" stopColor="#9f1239" stopOpacity="0.15" />
                      </linearGradient>
                      {/* Legacy fallbacks */}
                      <linearGradient id="cylinder-grad-gold" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.85" />
                        <stop offset="70%" stopColor="#d97706" stopOpacity="0.6" />
                        <stop offset="100%" stopColor="#78350f" stopOpacity="0.1" />
                      </linearGradient>
                      <linearGradient id="vide-grad-blue" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.6" />
                        <stop offset="100%" stopColor="#0c4a6e" stopOpacity="0.1" />
                      </linearGradient>
                    </defs>

                    {/* Rock Mass Background */}
                    <rect width="100%" height="100%" fill="url(#rock-grad-dark)" />

                    {/* Grid floor representation in 3D */}
                    <g opacity="0.12" stroke="#475569" strokeWidth="0.5">
                      {Array.from({ length: 9 }).map((_, i) => {
                        const xVal = galleryGeometry.xMin + i * (galleryGeometry.xMax - galleryGeometry.xMin) / 8;
                        const pStart = projectPoint(xVal, galleryGeometry.yMax, 0, angleX, angleY);
                        const pEnd = projectPoint(xVal, galleryGeometry.yMax, targetDepth, angleX, angleY);
                        return <line key={i} x1={pStart.x} y1={pStart.y} x2={pEnd.x} y2={pEnd.y} />;
                      })}
                    </g>

                    {/* Outer Front Face Gabarit Outline */}
                    <path 
                      d={`M ${projectPoint(galleryGeometry.xMin, galleryGeometry.yMax, 0, angleX, angleY).x} ${projectPoint(galleryGeometry.xMin, galleryGeometry.yMax, 0, angleX, angleY).y}
                          L ${projectPoint(galleryGeometry.xMin, galleryGeometry.yWall, 0, angleX, angleY).x} ${projectPoint(galleryGeometry.xMin, galleryGeometry.yWall, 0, angleX, angleY).y}
                          Q ${projectPoint(500, galleryGeometry.yCtrl, 0, angleX, angleY).x} ${projectPoint(500, galleryGeometry.yCtrl, 0, angleX, angleY).y}
                            ${projectPoint(galleryGeometry.xMax, galleryGeometry.yWall, 0, angleX, angleY).x} ${projectPoint(galleryGeometry.xMax, galleryGeometry.yWall, 0, angleX, angleY).y}
                          L ${projectPoint(galleryGeometry.xMax, galleryGeometry.yMax, 0, angleX, angleY).x} ${projectPoint(galleryGeometry.xMax, galleryGeometry.yMax, 0, angleX, angleY).y}
                          Z`}
                      fill="#1e293b"
                      fillOpacity="0.15"
                      stroke="#475569"
                      strokeWidth="1.5"
                      strokeDasharray="4 4"
                    />

                    {/* Back Extruded Face of Gallery (Theoretical Advance Limit) */}
                    <path 
                      d={`M ${projectPoint(galleryGeometry.xMin, galleryGeometry.yMax, targetDepth, angleX, angleY).x} ${projectPoint(galleryGeometry.xMin, galleryGeometry.yMax, targetDepth, angleX, angleY).y}
                          L ${projectPoint(galleryGeometry.xMin, galleryGeometry.yWall, targetDepth, angleX, angleY).x} ${projectPoint(galleryGeometry.xMin, galleryGeometry.yWall, targetDepth, angleX, angleY).y}
                          Q ${projectPoint(500, galleryGeometry.yCtrl, targetDepth, angleX, angleY).x} ${projectPoint(500, galleryGeometry.yCtrl, targetDepth, angleX, angleY).y}
                            ${projectPoint(galleryGeometry.xMax, galleryGeometry.yWall, targetDepth, angleX, angleY).x} ${projectPoint(galleryGeometry.xMax, galleryGeometry.yWall, targetDepth, angleX, angleY).y}
                          L ${projectPoint(galleryGeometry.xMax, galleryGeometry.yMax, targetDepth, angleX, angleY).x} ${projectPoint(galleryGeometry.xMax, galleryGeometry.yMax, targetDepth, angleX, angleY).y}
                          Z`}
                      fill="#020617"
                      fillOpacity="0.65"
                      stroke="#334155"
                      strokeWidth="1"
                    />

                    {/* ALL DRILLING HOLES (Tubes projected in the rock mass) */}
                    {drillHolesList.map((hole) => {
                      const status = getHoleDrillingStatus(hole);
                      const isDrilledOrDrilling = status === 'drilled' || status === 'drilling';

                      // Animated depth ratio for active drilling hole
                      const isDrilling = status === 'drilling';
                      const holeDepth = targetDepth * (isDrilling ? drillProgress / 100 : 1.0);

                      const pStart = projectPoint(hole.x, hole.y, 0, angleX, angleY);
                      const pEnd = projectPoint(hole.x, hole.y, holeDepth, angleX, angleY);

                      const holeVisuals = getHoleVisuals(hole.type);
                      const cylinderColor = holeVisuals.cylinder;
                      const strokeColor = holeVisuals.stroke;

                      const isHovered = hoveredHole?.id === hole.id || (selectedHole?.id === hole.id);

                      return (
                        <g 
                          key={hole.id}
                          className="transition-all cursor-pointer"
                          onMouseEnter={() => setHoveredHole(hole)}
                          onMouseLeave={() => setHoveredHole(null)}
                          onClick={() => {
                            // Find which phase contains this hole and select it
                            const holePhaseIdx = phases.findIndex(p => p.types.includes(hole.type));
                            if (holePhaseIdx >= 0) {
                              setActivePhaseIdx(holePhaseIdx);
                              const phaseHoles = drillHolesList.filter(h => phases[holePhaseIdx].types.includes(h.type));
                              const hIdx = phaseHoles.findIndex(h => h.id === hole.id);
                              if (hIdx >= 0) {
                                setActiveHoleInPhaseIdx(hIdx);
                                setDrillProgress(0);
                              }
                            }
                          }}
                        >
                          {/* Ideal normal projection guide lines (Parallélisme check) */}
                          {showParallelLines && isDrilledOrDrilling && (
                            <line 
                              x1={pStart.x} y1={pStart.y}
                              x2={projectPoint(hole.x, hole.y, targetDepth * 1.5, angleX, angleY).x}
                              y2={projectPoint(hole.x, hole.y, targetDepth * 1.5, angleX, angleY).y}
                              stroke="#475569"
                              strokeWidth="0.4"
                              strokeDasharray="2 4"
                              strokeOpacity="0.45"
                            />
                          )}

                          {/* 3D Cylinder representation - only if drilled or drilling */}
                          {isDrilledOrDrilling && (
                            <line 
                              x1={pStart.x} y1={pStart.y}
                              x2={pEnd.x} y2={pEnd.y}
                              stroke={strokeColor}
                              strokeWidth={isHovered ? 5.5 : 2.5}
                              strokeLinecap="round"
                              opacity={isHovered ? 1.0 : 0.8}
                            />
                          )}

                          {/* Front collar ring: Solid if drilled/drilling, dashed if planned/not_drilled */}
                          <circle 
                            cx={pStart.x}
                            cy={pStart.y}
                            r={isHovered ? 5.0 : isDrilledOrDrilling ? 2.8 : 2.0}
                            fill={isDrilledOrDrilling ? holeVisuals.collar : 'transparent'}
                            stroke={strokeColor}
                            strokeWidth={isDrilledOrDrilling ? "0.6" : "1.0"}
                            strokeDasharray={isDrilledOrDrilling ? undefined : "1.5 1"}
                            opacity={isHovered ? 1.0 : isDrilledOrDrilling ? 0.95 : 0.65}
                          />

                          {/* Tiny target center dot for planned holes */}
                          {!isDrilledOrDrilling && (
                            <circle 
                              cx={pStart.x}
                              cy={pStart.y}
                              r="1.2"
                              fill={strokeColor}
                              opacity="0.75"
                            />
                          )}

                          {/* Float visual tooltip tag when hovered */}
                          {isHovered && (
                            <g transform={`translate(${pStart.x}, ${pStart.y - 12})`} className="pointer-events-none">
                              <rect 
                                x="-45" 
                                y="-6" 
                                width="90" 
                                height="12" 
                                rx="3" 
                                fill="#020617" 
                                stroke={strokeColor} 
                                strokeWidth="0.8" 
                                opacity="0.95"
                              />
                              <text 
                                x="0" 
                                y="2" 
                                textAnchor="middle" 
                                fill="#f8fafc" 
                                fontSize="5.5" 
                                fontWeight="black" 
                                fontFamily="monospace"
                              >
                                {hole.name} • {hole.label}
                              </text>
                            </g>
                          )}
                        </g>
                      );
                    })}

                    {/* VISUAL PRIOR CAVITY REPRESENTATION (Vide créé par les tirs précédents) */}
                    {selectedHole && (() => {
                      const getPriorHolesList = (type: string, holes: HoleInfo[]): HoleInfo[] => {
                        if (type === 'charge') {
                          return holes.filter(h => h.type === 'vide');
                        }
                        if (type === 'g1') {
                          return holes.filter(h => ['vide', 'charge'].includes(h.type));
                        }
                        if (type === 'g2') {
                          return holes.filter(h => ['vide', 'charge', 'g1'].includes(h.type));
                        }
                        if (type === 'g3') {
                          return holes.filter(h => ['vide', 'charge', 'g1', 'g2'].includes(h.type));
                        }
                        if (type === 'g4') {
                          return holes.filter(h => ['vide', 'charge', 'g1', 'g2', 'g3'].includes(h.type));
                        }
                        if (['radier', 'parement', 'voute'].includes(type)) {
                          return holes.filter(h => ['vide', 'charge', 'g1', 'g2', 'g3', 'g4'].includes(h.type));
                        }
                        return [];
                      };

                      const priorHoles = getPriorHolesList(selectedHole.type, drillHolesList);
                      if (priorHoles.length === 0) return null;

                      // Find bounds of prior holes
                      let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
                      priorHoles.forEach(h => {
                        if (h.x < minX) minX = h.x;
                        if (h.x > maxX) maxX = h.x;
                        if (h.y < minY) minY = h.y;
                        if (h.y > maxY) maxY = h.y;
                      });

                      // We add a padding margin to represent the full cavity volume expanded around these holes
                      const padding = selectedHole.type === 'charge' ? 15 : 25;
                      const pTL = projectPoint(minX - padding, minY - padding, 0, angleX, angleY);
                      const pTR = projectPoint(maxX + padding, minY - padding, 0, angleX, angleY);
                      const pBR = projectPoint(maxX + padding, maxY + padding, 0, angleX, angleY);
                      const pBL = projectPoint(minX - padding, maxY + padding, 0, angleX, angleY);

                      // Center point for labeling
                      const centerX = (minX + maxX) / 2;
                      const centerY = (minY + maxY) / 2;
                      const pCenter = projectPoint(centerX, centerY, 0, angleX, angleY);

                      // Get cavity name based on active type
                      const getCavityLabel = (type: string) => {
                        if (type === 'charge') return "VIDE CENTRAL DE DILATATION (Ø 38mm — Taillant Bouton SMI)";
                        if (type === 'g1') return "VIDE LIBÉRÉ DU BOUCHON EN SÉQUENCE (1er TIR)";
                        if (type === 'g2') return "CAVITÉ CUMULÉE DISPONIBLE (BOUCHON + G1)";
                        if (type === 'g3') return "CAVITÉ CUMULÉE DISPONIBLE (BOUCHON + G1 + G2)";
                        if (type === 'g4') return "CAVITÉ CUMULÉE DISPONIBLE (BOUCHON + G1 à G3)";
                        return "CAVITÉ CENTRALE D'ABATTAGE DISPONIBLE";
                      };

                      return (
                        <g id="prior-blasted-cavity" className="animate-fade-in">
                          {/* Shaded/hatched or pulsing neon cavity polygon */}
                          <polygon 
                            points={`${pTL.x},${pTL.y} ${pTR.x},${pTR.y} ${pBR.x},${pBR.y} ${pBL.x},${pBL.y}`}
                            fill="#f59e0b"
                            fillOpacity="0.06"
                            stroke="#fbbf24"
                            strokeWidth="1.2"
                            strokeDasharray="4 3"
                            className="animate-pulse"
                          />

                          {/* Glowing corner indicators */}
                          <circle cx={pTL.x} cy={pTL.y} r="2" fill="#fbbf24" />
                          <circle cx={pTR.x} cy={pTR.y} r="2" fill="#fbbf24" />
                          <circle cx={pBR.x} cy={pBR.y} r="2" fill="#fbbf24" />
                          <circle cx={pBL.x} cy={pBL.y} r="2" fill="#fbbf24" />

                          {/* Cavity label tag */}
                          <g transform={`translate(${pCenter.x}, ${pCenter.y - (selectedHole.type === 'charge' ? 24 : 44)})`}>
                            <rect 
                              x="-110" 
                              y="-7" 
                              width="220" 
                              height="14" 
                              rx="4" 
                              fill="#090d16" 
                              stroke="#eab308" 
                              strokeWidth="0.8" 
                            />
                            <text 
                              x="0" 
                              y="2" 
                              textAnchor="middle" 
                              fill="#f59e0b" 
                              fontSize="6.5" 
                              fontWeight="black" 
                              fontFamily="monospace"
                              className="tracking-wider"
                            >
                              {getCavityLabel(selectedHole.type)}
                            </text>
                          </g>
                        </g>
                      );
                    })()}

                    {/* DYNAMIC DISTANCE DIMENSION TAGS (Règle d'or: visualiser les distances entre trous lors du forage) */}
                    {selectedHole && refInfo && (() => {
                      const pStart = projectPoint(selectedHole.x, selectedHole.y, 0, angleX, angleY);
                      const pEnd = projectPoint(refInfo.refHole.x, refInfo.refHole.y, 0, angleX, angleY);
                      
                      const midX = (pStart.x + pEnd.x) / 2;
                      const midY = (pStart.y + pEnd.y) / 2;

                      return (
                        <g id="distance-measurer-laser" className="animate-fade-in">
                          {/* Dashed measurement line between collars */}
                          <line 
                            x1={pStart.x} y1={pStart.y}
                            x2={pEnd.x} y2={pEnd.y}
                            stroke="#fbbf24"
                            strokeWidth="1.8"
                            strokeDasharray="3 3"
                            className="animate-pulse"
                          />

                          {/* Reference collar accent ring */}
                          <circle cx={pEnd.x} cy={pEnd.y} r="7" fill="none" stroke="#fbbf24" strokeWidth="1.2" className="animate-ping" />

                          {/* Beautiful glowing digital dimension tag */}
                          <g transform={`translate(${midX}, ${midY})`}>
                            <rect 
                              x="-25" 
                              y="-8" 
                              width="50" 
                              height="16" 
                              rx="5" 
                              fill="#020617" 
                              stroke="#fbbf24" 
                              strokeWidth="1.2" 
                              opacity="0.9"
                            />
                            <text 
                              x="0" 
                              y="3" 
                              textAnchor="middle" 
                              fill="#fbbf24" 
                              fontSize="8" 
                              fontWeight="black" 
                              fontFamily="monospace"
                            >
                              {refInfo.distCm} cm
                            </text>
                          </g>

                          {/* Dimension helper text floating */}
                          <g transform={`translate(${midX}, ${midY - 14})`}>
                            <rect 
                              x="-55" 
                              y="-6" 
                              width="110" 
                              height="11" 
                              rx="3" 
                              fill="#0f172a" 
                              stroke="#334155" 
                              strokeWidth="0.5" 
                              opacity="0.85"
                            />
                            <text 
                              x="0" 
                              y="2" 
                              textAnchor="middle" 
                              fill="#cbd5e1" 
                              fontSize="6" 
                              fontWeight="bold" 
                              className="uppercase tracking-widest"
                            >
                              {refInfo.label}
                            </text>
                          </g>
                        </g>
                      );
                    })()}

                    {/* JUMBO HYDRAULIC DRILLING RIG ARM (Real-time tracking of selected hole) */}
                    {selectedHole && (() => {
                      const pStart = projectPoint(selectedHole.x, selectedHole.y, 0, angleX, angleY);
                      // Drill machine body is statically positioned below at Z = -1.5m
                      const pRigBase = projectPoint(500, galleryGeometry.yMax, -1.5, angleX, angleY);

                      const isDrilling = getHoleDrillingStatus(selectedHole) === 'drilling';
                      const drillPercentage = isDrilling ? drillProgress : 100;

                      return (
                        <g id="jumbo-hydraulic-arm">
                          {/* Main Chassis representation */}
                          <path 
                            d={`M ${pRigBase.x - 20} ${pRigBase.y + 10} L ${pRigBase.x + 20} ${pRigBase.y + 10} L ${pRigBase.x + 10} ${pRigBase.y + 35} L ${pRigBase.x - 10} ${pRigBase.y + 35} Z`}
                            fill="#334155"
                            stroke="#1e293b"
                            strokeWidth="1.5"
                          />
                          {/* Yellow metal arm box */}
                          <line 
                            x1={pRigBase.x} y1={pRigBase.y}
                            x2={pStart.x} y2={pStart.y}
                            stroke="#eab308"
                            strokeWidth="5"
                            strokeLinecap="round"
                            strokeOpacity="0.85"
                          />
                          {/* Hydraulic silver cylinder */}
                          <line 
                            x1={pRigBase.x} y1={pRigBase.y}
                            x2={(pRigBase.x + pStart.x) / 2} y2={(pRigBase.y + pStart.y) / 2}
                            stroke="#94a3b8"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                          />
                          {/* Green targeting laser pointer */}
                          <line 
                            x1={pRigBase.x} y1={pRigBase.y}
                            x2={pStart.x} y2={pStart.y}
                            stroke="#22c55e"
                            strokeWidth="1"
                            strokeDasharray="2 3"
                            strokeOpacity="0.75"
                          />

                          {/* Sparks eruption at contact point when drilling */}
                          {isDrilling && drillPercentage > 0 && drillPercentage < 100 && (
                            <g>
                              <circle cx={pStart.x} cy={pStart.y} r="6" fill="#f97316" className="animate-ping" opacity="0.8" />
                              <circle cx={pStart.x} cy={pStart.y} r="2.5" fill="#fef08a" />
                              {/* Sparks particles */}
                              {Array.from({ length: 4 }).map((_, i) => {
                                const angle = (i * Math.PI) / 2 + (Date.now() / 150);
                                const sx = pStart.x + Math.cos(angle) * 8;
                                const sy = pStart.y + Math.sin(angle) * 8;
                                return (
                                  <line 
                                    key={i} 
                                    x1={pStart.x} y1={pStart.y} 
                                    x2={sx} y2={sy} 
                                    stroke="#f97316" 
                                    strokeWidth="1" 
                                  />
                                );
                              })}
                            </g>
                          )}
                        </g>
                      );
                    })()}
                  </svg>

                  {/* Drag-to-rotate guide label */}
                  <div className="absolute bottom-4 left-4 text-[9px] font-mono text-slate-400 uppercase tracking-widest bg-slate-950/85 px-3 py-1.5 rounded-lg border border-slate-900/40 pointer-events-none flex flex-col gap-0.5">
                    <span>🖱️ {dragMode === 'rotate' ? "Glisser pour pivoter l'arche (3D)" : "Glisser pour déplacer le schéma"}</span>
                    <span className="text-[7px] text-slate-500 lowercase font-normal">clic droit ou Shift+glisser pour déplacer à tout moment</span>
                  </div>

                  {/* Visual legends panel */}
                  <div className="absolute top-4 right-4 bg-slate-950/90 border border-slate-900/60 rounded-xl p-2.5 space-y-1.5 z-10 text-[8px] pointer-events-none shadow-xl backdrop-blur-sm w-[150px]">
                    <span className="font-black uppercase tracking-wider text-slate-400 block pb-1.5 border-b border-slate-900">Légende Volée (3D)</span>
                    
                    {/* Primary empty central void */}
                    <div className="flex items-center gap-2.5">
                      <span className="w-2.5 h-1.5 bg-[#94a3b8] rounded-sm shadow-[0_0_4px_#94a3b8]"></span>
                      <span className="text-slate-300 font-black">Vide de décharge (V)</span>
                    </div>

                    {/* Charged initial cut hole */}
                    <div className="flex items-center gap-2.5">
                      <span className="w-2.5 h-1.5 bg-[#f59e0b] rounded-sm shadow-[0_0_4px_#f59e0b]"></span>
                      <span className="text-slate-300 font-black">Trou Bouchon (0)</span>
                    </div>

                    {/* Concentric expanders (g1-g4) */}
                    <div className="space-y-1 pt-1 border-t border-slate-900/60">
                      <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block pb-0.5">Élargisseurs</span>
                      <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-1.5 bg-[#3b82f6] rounded-sm shadow-[0_0_4px_#3b82f6]"></span>
                        <span className="text-slate-300 font-black">Étape 2 : G1</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-1.5 bg-[#ef4444] rounded-sm shadow-[0_0_4px_#ef4444]"></span>
                        <span className="text-slate-300 font-black">Étape 3 : G2</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-1.5 bg-[#22d3ee] rounded-sm shadow-[0_0_4px_#22d3ee]"></span>
                        <span className="text-slate-300 font-black">Étape 4 : G3</span>
                      </div>
                      {drillHolesList.some(h => h.type === 'g4') && (
                        <div className="flex items-center gap-2.5">
                          <span className="w-2.5 h-1.5 bg-[#f97316] rounded-sm shadow-[0_0_4px_#f97316]"></span>
                          <span className="text-slate-300 font-black">Étape 5 : G4</span>
                        </div>
                      )}
                    </div>

                    {/* Trim & Contour final cutting holes */}
                    <div className="space-y-1 pt-1 border-t border-slate-900/60">
                      <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest block pb-0.5">Gabarit Contour</span>
                      <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-1.5 bg-[#f43f5e] rounded-sm shadow-[0_0_4px_#f43f5e]"></span>
                        <span className="text-slate-300 font-black">Voûte (Arche)</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-1.5 bg-[#14b8a6] rounded-sm shadow-[0_0_4px_#14b8a6]"></span>
                        <span className="text-slate-300 font-black">Parements (Flancs)</span>
                      </div>
                      <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-1.5 bg-[#8b5cf6] rounded-sm shadow-[0_0_4px_#8b5cf6]"></span>
                        <span className="text-slate-300 font-black">Radier (Sole / Pied)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Canvas Zoom & Rotation actions bar */}
                <div className="p-3 bg-slate-950 border-t border-slate-900 flex flex-wrap items-center justify-between gap-4 z-10">
                  
                  {/* Left: Zoom & Auto-Rotation & Interaction Tools */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      onClick={() => setZoom((prev) => Math.min(1.8, prev + 0.1))}
                      className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 cursor-pointer"
                      title="Zoom Avant"
                    >
                      <ZoomIn className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setZoom((prev) => Math.max(0.5, prev - 0.1))}
                      className="p-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-slate-300 cursor-pointer"
                      title="Zoom Arrière"
                    >
                      <ZoomOut className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setIsRotating(!isRotating)}
                      className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider cursor-pointer transition-all border ${
                        isRotating 
                          ? 'bg-amber-500/15 text-amber-400 border-amber-500/30 font-black' 
                          : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                      }`}
                      title="Auto-rotation de l'arche"
                    >
                      {isRotating ? '🔄 ROTATION ON' : '🔄 ROTATION OFF'}
                    </button>

                    {/* Drag Mode Selector */}
                    <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
                      <button
                        onClick={() => setDragMode('rotate')}
                        className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1 ${
                          dragMode === 'rotate' 
                            ? 'bg-amber-500 text-slate-950 font-black' 
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                        title="Faire glisser pour pivoter en 3D"
                      >
                        <Compass className="w-3 h-3" />
                        Pivoter
                      </button>
                      <button
                        onClick={() => setDragMode('pan')}
                        className={`px-2 py-1 rounded-md text-[9px] font-black uppercase tracking-wider transition-colors cursor-pointer flex items-center gap-1 ${
                          dragMode === 'pan' 
                            ? 'bg-amber-500 text-slate-950 font-black' 
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                        title="Faire glisser pour déplacer (Pan / Translation)"
                      >
                        <Move className="w-3 h-3" />
                        Déplacer
                      </button>
                    </div>

                    {(panX !== 0 || panY !== 0) && (
                      <button
                        onClick={() => {
                          setPanX(0);
                          setPanY(0);
                        }}
                        className="px-2 py-1.5 bg-slate-900 hover:bg-slate-800 text-rose-400 border border-slate-800 rounded-lg text-[9px] font-black uppercase tracking-wider cursor-pointer transition-colors"
                        title="Réinitialiser la position au centre"
                      >
                        Recentrer
                      </button>
                    )}
                  </div>

                  {/* Center: SEQUENCER PLAYBACK ACTION BUTTONS (PAUSE, LECTURE, ÉTAPE) */}
                  <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
                    <button
                      onClick={handlePrevHole}
                      className="p-1.5 bg-slate-950 hover:bg-slate-800 text-slate-200 rounded-lg cursor-pointer transition-colors"
                      title="Étape Précédente (Trou Précédent)"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setIsPlaying(!isPlaying)}
                      className={`px-4 py-1.5 rounded-lg flex items-center gap-1.5 transition-all text-[10px] font-black uppercase tracking-widest cursor-pointer ${
                        isPlaying 
                          ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-md' 
                          : 'bg-amber-500 hover:bg-amber-400 text-slate-950 font-black'
                      }`}
                    >
                      {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      {isPlaying ? "PAUSE" : "LECTURE"}
                    </button>

                    <button
                      onClick={handleNextHole}
                      className="p-1.5 bg-slate-950 hover:bg-slate-800 text-slate-200 rounded-lg cursor-pointer transition-colors"
                      title="Étape Suivante (Trou Suivant)"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Right: Camera Orientation Presets */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => {
                        setAngleX(0);
                        setAngleY(0);
                        setZoom(0.85);
                        setPanX(0);
                        setPanY(0);
                        setIsRotating(false);
                      }}
                      className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider cursor-pointer border transition-all ${
                        angleX === 0 && angleY === 0 && !isRotating
                          ? 'bg-amber-500 text-slate-950 border-amber-500 font-black'
                          : 'bg-slate-900 hover:bg-slate-850 text-slate-300 border-slate-800'
                      }`}
                      title="Profil Face par Défaut"
                    >
                      PROFIL FACE (DÉFAUT)
                    </button>
                    <button
                      onClick={() => {
                        setAngleX(18);
                        setAngleY(-25);
                        setZoom(0.85);
                        setPanX(0);
                        setPanY(0);
                        setIsRotating(false);
                      }}
                      className={`px-2.5 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider cursor-pointer border transition-all ${
                        angleX === 18 && angleY === -25
                          ? 'bg-amber-500 text-slate-950 border-amber-500 font-black'
                          : 'bg-slate-900 hover:bg-slate-850 text-slate-300 border-slate-800'
                      }`}
                      title="Perspective 3D Inclinée"
                    >
                      PERSPECTIVE 3D
                    </button>
                  </div>

                </div>
              </div>
              
              {/* PHASES STEPPER BAR */}
              <div className="bg-[#141414] border border-slate-800 rounded-2xl p-4 space-y-3">
                <h4 className="text-[11px] font-black uppercase text-amber-500 tracking-widest">
                  Phases d'Implantation de la Volée
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                  {phases.map((phase, idx) => {
                    const isActive = activePhaseIdx === idx;
                    return (
                      <button
                        key={phase.id}
                        onClick={() => setActivePhaseIdx(idx)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between h-20 ${
                          isActive 
                            ? 'bg-amber-500/10 border-amber-500 text-white font-black ring-2 ring-amber-500/20' 
                            : 'bg-slate-950/40 border-slate-900 text-slate-400 hover:border-slate-800'
                        }`}
                      >
                        <span className={`text-[8px] font-black uppercase tracking-wider ${isActive ? 'text-amber-400' : 'text-slate-500'}`}>
                          Phase {idx + 1}
                        </span>
                        <span className="text-[10px] font-black truncate text-slate-200 mt-1 leading-tight">
                          {phase.title.split(' (')[0]}
                        </span>
                        <span className="text-[8px] font-mono text-slate-500 truncate mt-0.5">
                          {activePhaseIdx > idx ? 'FORÉ ✓' : isActive ? 'FORAGE ACTIVE' : 'EN ATTENTE'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* BOTTOM PANEL: OPERATOR JUMBO CONSOLE & TECHNICAL DIRECTIONS */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch w-full">
              
              {/* OPERATOR JUMBO MACHINE INTERFACE (7 cols) */}
              <div className="lg:col-span-7 flex flex-col">
                <div className="bg-[#141414] border border-slate-800 rounded-3xl p-5 space-y-4 text-white shadow-xl h-full flex flex-col justify-between">
                
                <div className="border-b border-slate-800 pb-3 flex justify-between items-center">
                  <div>
                    <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest block">
                      JUMBO HYDRAULIQUE D'IMITER
                    </span>
                    <h3 className="text-sm font-black uppercase tracking-wide text-slate-100 font-mono">
                      Pupitre de Commande Perforation
                    </h3>
                  </div>
                  <span className="bg-slate-900 border border-slate-800 text-[10px] font-mono font-black text-emerald-400 px-2 py-0.5 rounded-lg">
                    {activeHoleInPhaseIdx + 1} / {activePhaseHoles.length} TROUS
                  </span>
                </div>

                {/* HOLE-BY-HOLE STEPPER SELECTOR (Trou par Trou) */}
                <div className="space-y-2">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                    Séquence Trou par Trou :
                  </span>
                  <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto bg-slate-950 p-2 rounded-xl border border-slate-900">
                    {activePhaseHoles.map((hole, hIdx) => {
                      const isHoleSelected = activeHoleInPhaseIdx === hIdx;
                      const status = getHoleDrillingStatus(hole);
                      
                      return (
                        <button
                          key={hole.id}
                          onClick={() => selectHoleManually(hIdx)}
                          className={`w-7 h-7 rounded-lg font-mono text-[10px] font-black flex items-center justify-center transition-all cursor-pointer border ${
                            isHoleSelected
                              ? 'bg-amber-400 text-slate-950 font-black border-amber-500 scale-110 shadow-md ring-4 ring-amber-500/25'
                              : status === 'drilled'
                              ? 'bg-slate-900 text-emerald-400 border-emerald-500/30 font-extrabold'
                              : 'bg-slate-900 hover:bg-slate-850 text-slate-500 border-slate-800'
                          }`}
                          title={hole.name}
                        >
                          {hole.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* SEQUENCER PLAYBACK ACTION BUTTONS */}
                <div className="grid grid-cols-4 gap-2">
                  <button
                    onClick={handlePrevHole}
                    className="py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 rounded-xl flex items-center justify-center transition-all cursor-pointer"
                    title="Trou Précédent"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className={`col-span-2 py-2 rounded-xl flex items-center justify-center gap-2 transition-all text-xs font-black uppercase tracking-widest cursor-pointer ${
                      isPlaying 
                        ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-900/10' 
                        : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/10 font-black'
                    }`}
                  >
                    {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 font-black" />}
                    {isPlaying ? "PAUSE" : "AUTO PLAY"}
                  </button>

                  <button
                    onClick={handleNextHole}
                    className="py-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-200 rounded-xl flex items-center justify-center transition-all cursor-pointer"
                    title="Trou Suivant"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>

                {/* DRILLING METRICS GAUGES */}
                {selectedHole && (
                  <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-900">
                    
                    {/* Active hole identification */}
                    <div className="flex justify-between items-start border-b border-slate-900 pb-2.5">
                      <div>
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest block">FORAGE EN COURS</span>
                        <h4 
                          className="text-xs font-black font-mono leading-relaxed uppercase"
                          style={{ color: getHoleVisuals(selectedHole.type).stroke }}
                        >
                          {selectedHole.name}
                        </h4>
                      </div>
                      <span className={`text-[9px] font-black uppercase px-2.5 py-1 rounded-md border ${getHoleVisuals(selectedHole.type).badgeClass}`}>
                        {getHoleVisuals(selectedHole.type).text}
                      </span>
                    </div>

                    {/* Progress Bar of Drill Depth */}
                    <div className="space-y-1">
                      <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase">
                        <span>Pénétration Tige ({tige})</span>
                        <span className="font-mono text-white font-black">
                          {((drillProgress / 100) * targetDepth).toFixed(2)} m / {targetDepth} m ({Math.round(drillProgress)}%)
                        </span>
                      </div>
                      <div className="w-full bg-slate-900 border border-slate-850 rounded-full h-3 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-emerald-400 transition-all duration-75 relative"
                          style={{ width: `${drillProgress}%` }}
                        >
                          <div className="absolute right-0 top-0 bottom-0 w-1 bg-white animate-pulse" />
                        </div>
                      </div>
                    </div>

                    {/* Drill variables table */}
                    <div className="grid grid-cols-2 gap-2 text-center pt-1.5">
                      <div className="bg-slate-900/60 p-2 rounded-xl border border-slate-900">
                        <span className="text-[8px] text-slate-500 block uppercase font-bold">Diamètre Taillant</span>
                        <span className="text-xs font-black text-slate-200 font-mono">
                          {selectedHole.type === 'vide' ? '75 mm' : '38 mm'} (T23)
                        </span>
                      </div>
                      <div className="bg-slate-900/60 p-2 rounded-xl border border-slate-900">
                        <span className="text-[8px] text-slate-500 block uppercase font-bold">Inclinaison Guide</span>
                        <span className="text-xs font-black text-emerald-400 font-mono">90.0° (Parfait)</span>
                      </div>
                    </div>

                    {/* Educational explanation card (La clé pour un nouveau mineur!) */}
                    <div className="bg-slate-900 p-3 rounded-xl border border-slate-900 text-[11px] leading-relaxed text-slate-300">
                      <p className="font-black text-slate-100 flex items-center gap-1 uppercase text-[9.5px] mb-1">
                        <Info className="w-3.5 h-3.5 text-amber-500" /> Note Opérateur :
                      </p>
                      <p className="text-[10.5px] leading-normal font-medium text-slate-400">
                        {selectedHole.desc}
                        {refInfo && ` Foré à une distance critique de précisément ${refInfo.distCm} cm pour garantir le volume de décompression adéquat.`}
                      </p>
                    </div>

                  </div>
                )}

                </div>
              </div>

              {/* TECHNICAL MANUAL ADVICE (5 cols) */}
              <div className="lg:col-span-5 flex flex-col">
                <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4 shadow-sm text-slate-800 h-full flex flex-col">
                <div className="border-b border-slate-100 pb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
                    Les Directives d'Arrachement (SMI)
                  </h4>
                </div>

                <div className="space-y-2.5 text-xs text-slate-600 leading-normal">
                  <p className="font-medium text-[11.5px] leading-relaxed">
                    Le perforateur de galerie d'Imiter doit assurer que <strong>l'écartement (E)</strong> et la <strong>banquette (W)</strong> soient strictement parallèles. Tout dérapage angulaire crée un pont rocheux infranchissable en fond de volée.
                  </p>
                  
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 font-mono text-[10.5px] text-slate-700 space-y-1">
                    <div className="flex justify-between">
                      <span>• Bouchon au vide central :</span>
                      <strong className="text-slate-900">15 cm constants (SMI)</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>• Élargisseurs (G1 à G4) :</span>
                      <strong className="text-slate-900">30 cm à 75 cm progressifs</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>• Spacing de Découpe (Voûte) :</span>
                      <strong className="text-purple-700">50 cm constants</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>• Spacing de Découpe (Parements) :</span>
                      <strong className="text-purple-700">60 cm constants</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>• Spacing de Découpe (Radier) :</span>
                      <strong className="text-slate-900">70 cm constants</strong>
                    </div>
                  </div>
                </div>
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

              {/* LEFT CARD: BON FORAGE (CONFORME) */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
                <div className="bg-emerald-600 text-white px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-100 shrink-0" />
                    <div>
                      <h3 className="font-black uppercase text-xs tracking-wider">FORAGE CORRECT (CONFORME)</h3>
                      <p className="text-[10px] text-emerald-100 font-medium font-sans">Parallélisme parfait &bull; Écartement maîtrisé</p>
                    </div>
                  </div>
                  <span className="bg-white/20 text-white font-mono text-xs font-black px-2.5 py-1 rounded-lg">
                    Rendement : ~98%
                  </span>
                </div>

                <div className="bg-slate-950 h-[280px] relative flex items-center justify-center">
                  <svg className="w-full h-full" viewBox="0 0 400 240">
                    <defs>
                      <linearGradient id="correct-cyl-tab" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.85" />
                        <stop offset="85%" stopColor="#047857" stopOpacity="0.5" />
                        <stop offset="100%" stopColor="#064e3b" stopOpacity="0.1" />
                      </linearGradient>
                    </defs>
                    <rect x="20" y="30" width="360" height="180" fill="#111827" fillOpacity="0.7" rx="10" stroke="#334155" />
                    
                    <line x1="160" y1="30" x2="160" y2="210" stroke="#1e293b" strokeDasharray="3 3" />
                    
                    {[50, 80, 110, 140, 170, 200].map((yOffset, idx) => (
                      <g key={idx}>
                        <line 
                          x1="40" y1={yOffset}
                          x2="280" y2={yOffset}
                          stroke="url(#correct-cyl-tab)"
                          strokeWidth="6"
                          strokeLinecap="round"
                        />
                        <circle cx="40" cy={yOffset} r="4" fill="#10b981" />
                        <line x1="40" y1={yOffset} x2="350" y2={yOffset} stroke="#10b981" strokeWidth="0.5" strokeDasharray="4 4" strokeOpacity="0.4" />
                        <text x="50" y={yOffset - 6} fill="#34d399" fontSize="7" fontFamily="monospace">0.0°</text>
                      </g>
                    ))}

                    <line x1="280" y1="30" x2="280" y2="210" stroke="#10b981" strokeWidth="1.5" strokeDasharray="2 2" />
                    <text x="285" y="45" fill="#10b981" fontSize="8" fontWeight="black" fontFamily="monospace">PLAN ARRACHÉ ({targetDepth.toFixed(1)}m)</text>

                    <rect x="280" y="30" width="100" height="180" fill="#020617" fillOpacity="0.9" />
                    <text x="330" y="125" textAnchor="middle" fill="#475569" fontSize="9" fontWeight="bold">MASSIF INTACT</text>
                  </svg>

                  <div className="absolute bottom-3 left-3 bg-slate-900/90 text-white p-2 rounded-lg border border-slate-800 text-[10px] space-y-0.5 pointer-events-none font-mono">
                    <span className="text-emerald-400 font-black block">✓ Aucun culot résiduel</span>
                    <span className="text-slate-300">✓ Énergie ANFO canalisée</span>
                  </div>
                </div>

                <div className="p-5 space-y-3.5 text-xs text-slate-600">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">AVANCEMENT VOLÉE</span>
                      <span className="text-lg font-black text-slate-900">{targetDepth.toFixed(1)} mètres</span>
                    </div>
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                      <span className="text-[10px] font-bold text-slate-400 uppercase block">CULOTS ENREGISTRÉS</span>
                      <span className="text-lg font-black text-emerald-600">0 cm</span>
                    </div>
                  </div>

                  <div className="space-y-1 bg-emerald-50 text-emerald-950 p-3.5 rounded-xl border border-emerald-200">
                    <span className="font-bold block text-emerald-900 text-[11px] uppercase">Rendement d'abattage optimal</span>
                    <p className="leading-relaxed text-[11px]">
                      Tous les trous sont parallèles. La pression de détonation de l'ANFO s'exerce de manière strictement uniforme sur toute la longueur. La roche se cisaille à 100% jusqu'à l'extrémité forée.
                    </p>
                  </div>
                </div>
              </div>

              {/* RIGHT CARD: MAUVAIS FORAGE (NON-CONFORME) */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
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

                <div className="bg-slate-950 h-[280px] relative flex items-center justify-center">
                  <svg className="w-full h-full" viewBox="0 0 400 240">
                    <defs>
                      <linearGradient id="deviant-cyl-tab" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#ef4444" stopOpacity="0.85" />
                        <stop offset="70%" stopColor="#b91c1c" stopOpacity="0.5" />
                        <stop offset="100%" stopColor="#7f1d1d" stopOpacity="0.1" />
                      </linearGradient>
                    </defs>
                    <rect x="20" y="30" width="360" height="180" fill="#111827" fillOpacity="0.7" rx="10" stroke="#334155" />
                    
                    {[50, 80, 110, 140, 170, 200].map((y, idx) => (
                      <line key={idx} x1="40" y1={y} x2="280" y2={y} stroke="#334155" strokeWidth="0.5" strokeDasharray="2 4" strokeOpacity="0.5" />
                    ))}

                    {/* Hole 1: Diverges upwards */}
                    <line x1="40" y1="50" x2="250" y2="35" stroke="url(#deviant-cyl-tab)" strokeWidth="6" strokeLinecap="round" />
                    <circle cx="40" cy="50" r="4" fill="#ef4444" />
                    <text x="50" y="44" fill="#f87171" fontSize="7" fontFamily="monospace">6.2° ↑</text>

                    {/* Hole 2: Perfect contrast */}
                    <line x1="40" y1="80" x2="280" y2="80" stroke="url(#correct-cyl-tab)" strokeWidth="6" strokeLinecap="round" opacity="0.4" />
                    <circle cx="40" cy="80" r="4" fill="#10b981" opacity="0.4" />

                    {/* Hole 3: Converges downwards */}
                    <line x1="40" y1="110" x2="240" y2="125" stroke="url(#deviant-cyl-tab)" strokeWidth="6" strokeLinecap="round" />
                    <circle cx="40" cy="110" r="4" fill="#ef4444" />
                    <text x="50" y="104" fill="#f87171" fontSize="7" fontFamily="monospace">4.8° ↓</text>

                    {/* Hole 4: Diverges downwards */}
                    <line x1="40" y1="140" x2="230" y2="165" stroke="url(#deviant-cyl-tab)" strokeWidth="6" strokeLinecap="round" />
                    <circle cx="40" cy="140" r="4" fill="#ef4444" />
                    <text x="50" y="134" fill="#f87171" fontSize="7" fontFamily="monospace">7.5° ↓</text>

                    {/* Hole 5: Diverges upwards */}
                    <line x1="40" y1="170" x2="260" y2="185" stroke="url(#deviant-cyl-tab)" strokeWidth="6" strokeLinecap="round" />
                    <circle cx="40" cy="170" r="4" fill="#ef4444" />
                    <text x="50" y="164" fill="#f87171" fontSize="7" fontFamily="monospace">5.1° ↑</text>

                    <line x1="210" y1="30" x2="210" y2="210" stroke="#ef4444" strokeWidth="1.5" />
                    <text x="110" y="45" fill="#ef4444" fontSize="8" fontWeight="black" fontFamily="monospace">AVANCEMENT COUPE (1.1m)</text>

                    <path 
                      d="M 210,30 L 280,30 L 280,210 L 210,210 Z" 
                      fill="#1e1b4b" 
                      fillOpacity="0.8" 
                      stroke="#ef4444" 
                      strokeWidth="0.5"
                    />
                    <text x="245" y="125" textAnchor="middle" fill="#f87171" fontSize="9" fontWeight="black" className="animate-pulse">
                      CULOTS (60cm)
                    </text>

                    <line x1="280" y1="30" x2="280" y2="210" stroke="#f59e0b" strokeWidth="1" strokeDasharray="3 3" />
                  </svg>

                  <div className="absolute bottom-3 left-3 bg-red-950/95 text-white p-2 rounded-lg border border-red-900 text-[10px] space-y-0.5 pointer-events-none font-mono">
                    <span className="text-red-400 font-black block">✗ Perte majeure de confinement</span>
                    <span className="text-red-300">✗ Risque de coup soufflé</span>
                  </div>
                </div>

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
                    <span className="font-bold block text-red-900 text-[11px] uppercase">Gaspillage d'explosifs & Danger</span>
                    <p className="leading-relaxed text-[11px]">
                      La déviation angulaire de forage élargit la distance entre charges au-delà du seuil critique de rupture. L'ANFO n'a plus l'énergie requise pour briser le massif de fond. La volée échoue à mi-chemin.
                    </p>
                  </div>
                </div>
              </div>

            </div>

            {/* EDUCATIONAL IMPACT CALCULATOR PANEL */}
            <div className="bg-[#141414] border border-slate-800 rounded-2xl p-6 text-white space-y-5 shadow-xl">
              <div className="border-b border-slate-800 pb-3">
                <h4 className="text-sm font-black uppercase text-amber-500 tracking-wider flex items-center gap-1.5 font-mono">
                  <TrendingDown className="w-5 h-5 text-amber-400" />
                  Simulateur de Confinement & Fuite d'Énergie (ANFO)
                </h4>
                <p className="text-[10px] text-slate-400 uppercase tracking-widest mt-0.5">
                  Estimez le rendement mécanique de la volée selon le bourrage des trous
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Input 1: Profondeur */}
                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase text-slate-300 tracking-wider block">
                    Profondeur théorique du forage (mètres)
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
                  <p className="text-[10px] text-slate-500 leading-normal font-medium">
                    Longueur de la tige insérée par le perforateur.
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
                  <p className="text-[10px] text-slate-500 leading-normal font-medium">
                    La norme SMI est de <strong>20 × D_trou = 76cm minimum</strong> pour contenir l'onde de choc de l'ANFO.
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
                      manualCalculatorVerdict.isConforme ? 'bg-emerald-500 text-slate-950' : 'bg-red-600 text-white font-black'
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
                        ⚠️ Perte estimée de <strong className="font-mono">{manualCalculatorVerdict.lostM}m</strong> de métrage due à un bourrage d'argile insuffisant.
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
