import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  Activity,
  Eye,
  Sliders,
  Maximize2,
  HardHat,
  Zap,
  Lock,
  Grid,
  Radio,
  Sparkles,
  Music,
  Volume2,
  User
} from 'lucide-react';
import { HOLES_DATA, HOLES_DATA_9, HOLES_DATA_12_INTL } from './data';
import { HoleInfo, GabaritType } from './types';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface Vue3DSchemaTabProps {
  gabarit: GabaritType;
}

export const Vue3DSchemaTab: React.FC<Vue3DSchemaTabProps> = ({ gabarit }) => {
  // Blasting active stage
  const [activeStep, setActiveStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [rodType, setRodType] = useState<'1.8' | '2.4'>('1.8');
  const [hoveredHole, setHoveredHole] = useState<HoleInfo | null>(null);

  // Reality toggles
  const [showRockbolts, setShowRockbolts] = useState<boolean>(true);
  const [showArches, setShowArches] = useState<boolean>(true);
  const [showDrillMachine, setShowDrillMachine] = useState<boolean>(true);
  const [showLasers, setShowLasers] = useState<boolean>(true);
  const [showSeismograph, setShowSeismograph] = useState<boolean>(true);
  const [showFores, setShowFores] = useState<boolean>(true);
  const [showExplosives, setShowExplosives] = useState<boolean>(true);
  const [showWalls, setShowWalls] = useState<boolean>(true);
  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [dustDensity, setDustDensity] = useState<'none' | 'low' | 'high'>('none');

  // Real-time playback variables (for simulation)
  const [realtimeMode, setRealtimeMode] = useState<boolean>(false);
  const [realtimeMs, setRealtimeMs] = useState<number>(0);
  const [realtimePlaying, setRealtimePlaying] = useState<boolean>(false);
  const realtimeRef = useRef<NodeJS.Timeout | null>(null);

  // Seismograph seismic waveform variables
  const [seismicData, setSeismicData] = useState<number[]>(Array(50).fill(0));
  const seismicCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Cinematic Orchestrator Mode (Trent Reznor & Atticus Ross Soundtrack)
  const [soundtrackActive, setSoundtrackActive] = useState<boolean>(false);
  const [cinematicCamera, setCinematicCamera] = useState<boolean>(false);
  const [audioVolume, setAudioVolume] = useState<number>(0.65);

  const prevStepRef = useRef<number>(0);
  const cameraShakeRef = useRef<number>(0);

  // Web Audio Synth references
  const audioCtxRef = useRef<AudioContext | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);
  const droneOsc1Ref = useRef<OscillatorNode | null>(null);
  const droneOsc2Ref = useRef<OscillatorNode | null>(null);
  const droneLfoRef = useRef<OscillatorNode | null>(null);
  const periodicNoteTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Sync refs to avoid ThreeJS canvas rebuilds
  const isPlayingRef = useRef<boolean>(false);
  const realtimePlayingRef = useRef<boolean>(false);
  const cinematicCameraRef = useRef<boolean>(false);
  const autoRotateRef = useRef<boolean>(false);

  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { realtimePlayingRef.current = realtimePlaying; }, [realtimePlaying]);
  useEffect(() => { cinematicCameraRef.current = cinematicCamera; }, [cinematicCamera]);
  useEffect(() => { autoRotateRef.current = autoRotate; }, [autoRotate]);

  // Hole data mapping
  const holesToRender = useMemo(() => {
    if (gabarit === '9m2') return HOLES_DATA_9;
    if (gabarit === '12m2_intl') return HOLES_DATA_12_INTL;
    return HOLES_DATA;
  }, [gabarit]);

  const maxStep = gabarit === '9m2' ? 5 : 6;

  const REAL_DELAYS_MS = gabarit === '9m2'
    ? [0, 25, 50, 75, 100, 125]
    : [0, 25, 50, 75, 100, 125, 150];

  const TOTAL_DURATION_MS = gabarit === '9m2' ? 125 : 150;

  // Realtime playback loop
  const startRealtimePlayback = () => {
    setRealtimeMs(0);
    setRealtimePlaying(true);
    setActiveStep(0);
    setIsPlaying(false);

    const startTime = Date.now();
    const scale = 100; // 100x slower for human viewing

    const tick = () => {
      const elapsed = (Date.now() - startTime) / scale;
      setRealtimeMs(parseFloat(elapsed.toFixed(1)));

      const currentStep = REAL_DELAYS_MS.reduce((step, delay, idx) => {
        return elapsed >= delay ? idx : step;
      }, 0);
      setActiveStep(currentStep);

      // Shake seismograph data based on step detonics
      if (currentStep > 0) {
        setSeismicData(prev => {
          const next = [...prev.slice(1)];
          // Trigger a seismic spike when step increments
          const isSpike = Math.random() < 0.3 || elapsed - REAL_DELAYS_MS[currentStep] < 4;
          const amplitude = isSpike ? (1.2 - (elapsed - REAL_DELAYS_MS[currentStep]) / 25) * (40 + Math.random() * 40) : (Math.random() * 5);
          next.push(Math.max(2, amplitude));
          return next;
        });
      }

      if (elapsed < TOTAL_DURATION_MS) {
        realtimeRef.current = setTimeout(tick, 16);
      } else {
        setRealtimeMs(TOTAL_DURATION_MS);
        setActiveStep(REAL_DELAYS_MS.length - 1);
        setRealtimePlaying(false);
      }
    };

    realtimeRef.current = setTimeout(tick, 16);
  };

  const stopRealtimePlayback = () => {
    if (realtimeRef.current) clearTimeout(realtimeRef.current);
    setRealtimePlaying(false);
  };

  // Standard auto playback loop
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setActiveStep((prev) => {
          if (prev >= maxStep) return 0;
          return prev + 1;
        });
      }, 2500);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, maxStep]);

  useEffect(() => {
    return () => {
      if (realtimeRef.current) clearTimeout(realtimeRef.current);
    };
  }, []);

  // ==========================================
  // WEB AUDIO SYNTHESIZER ENGINE (Trent Reznor & Atticus Ross Tribute)
  // ==========================================

  const playSynthesizedPianoNote = (frequency: number, delayTime = 0) => {
    const ctx = audioCtxRef.current;
    const masterGain = masterGainRef.current;
    if (!ctx || !masterGain || ctx.state === 'suspended') return;

    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    const delayNode = ctx.createDelay();
    const delayFeedback = ctx.createGain();

    osc.type = 'triangle'; // pure warm analog-like tone
    osc.frequency.setValueAtTime(frequency, ctx.currentTime + delayTime);

    // Envelope with rapid attack and long, melancholic decay
    oscGain.gain.setValueAtTime(0, ctx.currentTime + delayTime);
    oscGain.gain.linearRampToValueAtTime(0.18, ctx.currentTime + delayTime + 0.05);
    oscGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delayTime + 2.5);

    // Simple delay feedback to act as acoustic room resonance
    delayNode.delayTime.setValueAtTime(0.45, ctx.currentTime + delayTime);
    delayFeedback.gain.setValueAtTime(0.35, ctx.currentTime + delayTime);

    osc.connect(oscGain);
    oscGain.connect(masterGain);
    
    oscGain.connect(delayNode);
    delayNode.connect(delayFeedback);
    delayFeedback.connect(delayNode);
    delayFeedback.connect(masterGain);

    osc.start(ctx.currentTime + delayTime);
    osc.stop(ctx.currentTime + delayTime + 3.0);
  };

  const startAmbientMelodyLoop = () => {
    if (periodicNoteTimeoutRef.current) clearTimeout(periodicNoteTimeoutRef.current);
    
    const playNext = () => {
      if (!audioCtxRef.current || audioCtxRef.current.state === 'suspended') return;
      const notes = [130.81, 155.56, 196.00, 233.08, 261.63, 311.13]; // C3, Eb3, G3, Bb3, C4, Eb4 (minor pentatonic)
      const randomNote1 = notes[Math.floor(Math.random() * notes.length)];
      const randomNote2 = notes[Math.floor(Math.random() * notes.length)];
      
      playSynthesizedPianoNote(randomNote1, 0);
      if (Math.random() > 0.45) {
        playSynthesizedPianoNote(randomNote2, 0.6); // slight offset echo
      }

      // Repeat every 4 to 8 seconds randomly
      const nextDelay = 3500 + Math.random() * 4500;
      periodicNoteTimeoutRef.current = setTimeout(playNext, nextDelay);
    };

    playNext();
  };

  const initAudioEngine = () => {
    if (audioCtxRef.current) return;
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtxClass();
      audioCtxRef.current = ctx;

      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(audioVolume * 0.35, ctx.currentTime);
      masterGain.connect(ctx.destination);
      masterGainRef.current = masterGain;

      // 1. Deep Trent Reznor Sub-Drone
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const droneGain = ctx.createGain();

      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(55, ctx.currentTime); // A1 note
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(55.4, ctx.currentTime); // slightly detuned for analog drift beating

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(140, ctx.currentTime); // Dark cutoff
      filter.Q.setValueAtTime(4, ctx.currentTime);

      droneGain.gain.setValueAtTime(0.45, ctx.currentTime);

      osc1.connect(filter);
      osc2.connect(filter);
      filter.connect(droneGain);
      droneGain.connect(masterGain);

      osc1.start();
      osc2.start();
      droneOsc1Ref.current = osc1;
      droneOsc2Ref.current = osc2;

      // LFO to modulate filter cutoff for slow breathing "Magnetic" drone effect
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      lfo.type = 'sine';
      lfo.frequency.setValueAtTime(0.08, ctx.currentTime); // very slow: ~12s cycle
      lfoGain.gain.setValueAtTime(45, ctx.currentTime); // sweep filter +-45Hz

      lfo.connect(lfoGain);
      lfoGain.connect(filter.frequency);
      lfo.start();
      droneLfoRef.current = lfo;

      // Start the Trent Reznor piano/glitch ambient loop
      startAmbientMelodyLoop();
    } catch (e) {
      console.warn("Web Audio API not supported or blocked", e);
    }
  };

  const playSynthesizedDetonation = (isBouchon = false) => {
    const ctx = audioCtxRef.current;
    const masterGain = masterGainRef.current;
    if (!ctx || !masterGain || ctx.state === 'suspended') return;

    // 1. Heavy Low frequency thump (Earth trembling)
    const subOsc = ctx.createOscillator();
    const subGain = ctx.createGain();
    subOsc.type = 'sine';
    subOsc.frequency.setValueAtTime(65, ctx.currentTime);
    subOsc.frequency.exponentialRampToValueAtTime(25, ctx.currentTime + 0.4); // sweep pitch down to sub-bass

    subGain.gain.setValueAtTime(isBouchon ? 0.95 : 0.68, ctx.currentTime);
    subGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);

    subOsc.connect(subGain);
    subGain.connect(masterGain);
    subOsc.start();
    subOsc.stop(ctx.currentTime + 0.7);

    // 2. High pressure white noise blast
    const bufferSize = ctx.sampleRate * 0.5; // 0.5 seconds of noise
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noiseNode = ctx.createBufferSource();
    noiseNode.buffer = buffer;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(240, ctx.currentTime);
    noiseFilter.frequency.exponentialRampToValueAtTime(70, ctx.currentTime + 0.35);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(isBouchon ? 0.38 : 0.24, ctx.currentTime);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.45);

    noiseNode.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(masterGain);
    noiseNode.start();
    noiseNode.stop(ctx.currentTime + 0.5);
  };

  const handleToggleSoundtrack = () => {
    if (!soundtrackActive) {
      if (!audioCtxRef.current) {
        initAudioEngine();
      } else if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
        startAmbientMelodyLoop();
      }
      setSoundtrackActive(true);
    } else {
      if (audioCtxRef.current && audioCtxRef.current.state === 'running') {
        audioCtxRef.current.suspend();
      }
      if (periodicNoteTimeoutRef.current) clearTimeout(periodicNoteTimeoutRef.current);
      setSoundtrackActive(false);
    }
  };

  // Live master volume adjustments
  useEffect(() => {
    if (masterGainRef.current && audioCtxRef.current) {
      masterGainRef.current.gain.setValueAtTime(audioVolume * 0.35, audioCtxRef.current.currentTime);
    }
  }, [audioVolume]);

  // Handle soundtrack detonics trigger and camera shakes
  useEffect(() => {
    if (activeStep > prevStepRef.current) {
      if (soundtrackActive) {
        const isBouchon = activeStep === 1;
        playSynthesizedDetonation(isBouchon);
      }
      // Trigger camera shake
      cameraShakeRef.current = activeStep === 1 ? 0.7 : 0.38;
    }
    prevStepRef.current = activeStep;
  }, [activeStep, soundtrackActive]);

  // Cleanup Web Audio nodes on unmount
  useEffect(() => {
    return () => {
      if (periodicNoteTimeoutRef.current) clearTimeout(periodicNoteTimeoutRef.current);
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
      }
    };
  }, []);

  // Update seismograph on regular tick when not playing realtime
  useEffect(() => {
    const handle = setInterval(() => {
      setSeismicData(prev => {
        const next = [...prev.slice(1)];
        let amplitude = Math.random() * 4;
        // If auto playing and just switched steps, add a small spike
        if (isPlaying || realtimePlaying) {
          amplitude = Math.random() * 12;
        }
        next.push(amplitude);
        return next;
      });
    }, 100);
    return () => clearInterval(handle);
  }, [isPlaying, realtimePlaying]);

  // Redraw seismograph canvas
  useEffect(() => {
    const canvas = seismicCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const w = canvas.width;
    const h = canvas.height;

    // Draw grid
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < w; i += 30) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, h);
      ctx.stroke();
    }
    for (let j = 0; j < h; j += 15) {
      ctx.beginPath();
      ctx.moveTo(0, j);
      ctx.lineTo(w, j);
      ctx.stroke();
    }

    // Baseline
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();

    // Draw wave
    ctx.strokeStyle = '#f59e0b'; // Gold
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const step = w / (seismicData.length - 1);
    seismicData.forEach((val, idx) => {
      const x = idx * step;
      // alternate signs to create oscillating waveform
      const sign = idx % 2 === 0 ? 1 : -1;
      const y = h / 2 + (val * sign * (h / 120));
      if (idx === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    ctx.stroke();

    // Glow effect
    ctx.shadowColor = '#f59e0b';
    ctx.shadowBlur = 4;
    ctx.strokeStyle = 'rgba(245, 158, 11, 0.4)';
    ctx.stroke();
    ctx.shadowBlur = 0; // Reset
  }, [seismicData]);

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

  // Retrieve blasting step for specific hole
  const getBlastStepForHole = (hole: HoleInfo, gab: GabaritType) => {
    if (hole.type === 'vide') return -1;
    if (gab === '9m2') {
      if (hole.type === 'charge') return 1;
      if (hole.type === 'g1') return 2;
      if (hole.type === 'g2') return 3;
      if (hole.type === 'g3') return 4;
      return 5;
    } else {
      if (hole.type === 'charge') return 1;
      if (hole.type === 'g1') return 2;
      if (hole.type === 'g2') return 3;
      if (hole.type === 'g3') return 4;
      if (hole.type === 'g4') return 5;
      return 6;
    }
  };

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

  const currentPercentage = Math.round((getFootage() / (rodType === '1.8' ? 1.7 : 2.3)) * 100);

  // 3D Canvas container and engine variables
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const holesGroupRef = useRef<THREE.Group | null>(null);
  const supportGroupRef = useRef<THREE.Group | null>(null);
  const drillRigGroupRef = useRef<THREE.Group | null>(null);
  const lasersGroupRef = useRef<THREE.Group | null>(null);
  const backBorderLineRef = useRef<THREE.Line | null>(null);

  // Sparks & shockwaves
  const sparksRef = useRef<{ mesh: THREE.Mesh; velocity: THREE.Vector3; life: number; maxLife: number }[]>([]);
  const shockwavesRef = useRef<{ mesh: THREE.Mesh; scaleSpeed: number; opacitySpeed: number; life: number }[]>([]);
  const dustParticlesRef = useRef<{ mesh: THREE.Mesh; velocity: THREE.Vector3; range: number }[]>([]);

  // Dimension helpers
  const gCX = 500;
  const gCY = gabarit === '9m2' ? 350 : 430;
  const DEPTH = gabarit === '9m2' ? 240 : 300;

  // Real world dimensions (meters)
  const SCALE = gabarit === '9m2' ? 0.007 : 0.005;
  const DEPTH_METERS = gabarit === '9m2' ? 12.0 : 15.0;

  // Coordinate mapper (Hole relative x,y,z in SVG space to 3D Space meters)
  const getHole3DVector = (hole: HoleInfo, zValue: number): THREE.Vector3 => {
    const isBouchon = hole.type === 'charge' || hole.type === 'vide';
    const angleX = isBouchon ? 0 : (hole.x - gCX) * 0.03;
    const angleY = isBouchon ? 0 : (hole.y - gCY) * 0.03;

    const z_m = (zValue / DEPTH) * DEPTH_METERS;

    return new THREE.Vector3(
      (hole.x - gCX) * SCALE + z_m * Math.sin(angleX * Math.PI / 180) * 0.05,
      -(hole.y - gCY) * SCALE - z_m * Math.sin(angleY * Math.PI / 180) * 0.05,
      z_m
    );
  };

  // Interactive camera preset interpolator
  const targetCamPos = useRef<THREE.Vector3>(new THREE.Vector3(0, 0.7, gabarit === '9m2' ? -3.8 : -4.5));
  const targetLookAt = useRef<THREE.Vector3>(new THREE.Vector3(0, 0.7, 3.0));
  const isInterpolating = useRef<boolean>(true);

  const applyPreset = (preset: 'face' | 'iso' | 'side' | 'top') => {
    setAutoRotate(false);
    isInterpolating.current = true;
    const centerZ = DEPTH_METERS / 2;

    if (preset === 'face') {
      targetLookAt.current.set(0, 0.7, 3.0);
      targetCamPos.current.set(0, 0.7, gabarit === '9m2' ? -3.8 : -4.5);
    } else if (preset === 'iso') {
      targetLookAt.current.set(0, 0.5, centerZ);
      targetCamPos.current.set(3.5, 2.5, -3.0);
    } else if (preset === 'side') {
      targetLookAt.current.set(0, 0.5, centerZ);
      targetCamPos.current.set(5.0, 0.5, centerZ);
    } else if (preset === 'top') {
      targetLookAt.current.set(0, 0.5, centerZ);
      targetCamPos.current.set(0, 6.0, centerZ);
    }
  };

  // Realistic Procedural Rocky Texture Generators (to avoid loading errors and have stunning local textures)
  const rockTexture = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      // Dark rough slate background
      ctx.fillStyle = '#141b27';
      ctx.fillRect(0, 0, 512, 512);

      // Noise and rugged patterns
      for (let i = 0; i < 6000; i++) {
        const size = 1 + Math.random() * 3;
        const opacity = 0.04 + Math.random() * 0.12;
        ctx.fillStyle = Math.random() > 0.4 ? `rgba(10, 15, 26, ${opacity})` : `rgba(255, 255, 255, ${opacity})`;
        ctx.fillRect(Math.random() * 512, Math.random() * 512, size, size);
      }

      // Drawing dark basalt structural veins/cracks
      ctx.strokeStyle = '#0a0d14';
      ctx.lineWidth = 2.0;
      for (let j = 0; j < 25; j++) {
        ctx.beginPath();
        let lx = Math.random() * 512;
        let ly = Math.random() * 512;
        ctx.moveTo(lx, ly);
        for (let k = 0; k < 6; k++) {
          lx += (Math.random() - 0.5) * 80;
          ly += (Math.random() - 0.5) * 80;
          ctx.lineTo(lx, ly);
        }
        ctx.stroke();
      }

      // Gold copper metallic quartz veins
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.45)';
      ctx.lineWidth = 1.2;
      for (let j = 0; j < 6; j++) {
        ctx.beginPath();
        let lx = Math.random() * 512;
        let ly = Math.random() * 512;
        ctx.moveTo(lx, ly);
        for (let k = 0; k < 5; k++) {
          lx += (Math.random() - 0.5) * 110;
          ly += (Math.random() - 0.5) * 110;
          ctx.lineTo(lx, ly);
        }
        ctx.stroke();
      }
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 15);
    return texture;
  }, []);

  const rockBumpMap = useMemo(() => {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#808080';
      ctx.fillRect(0, 0, 256, 256);

      // Add deep radial bumps
      for (let i = 0; i < 700; i++) {
        const radius = 8 + Math.random() * 25;
        const rx = Math.random() * 256;
        const ry = Math.random() * 256;
        const grad = ctx.createRadialGradient(rx, ry, 0, rx, ry, radius);
        const intensity = Math.floor(Math.random() * 55);
        grad.addColorStop(0, `rgba(${128 + intensity}, ${128 + intensity}, ${128 + intensity}, 0.25)`);
        grad.addColorStop(1, 'rgba(128,128,128,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(rx, ry, radius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 15);
    return texture;
  }, []);

  // Set up the ThreeJS rendering context
  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth || 1000;
    const height = 780;

    // 1. Create Scene & Atmospheric volumetric Mine Fog
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617); // Rich dark underground blue-black
    scene.fog = dustDensity === 'none' 
      ? null 
      : new THREE.FogExp2(0x020617, dustDensity === 'high' ? 0.07 : 0.03);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 150);
    camera.position.copy(targetCamPos.current);
    cameraRef.current = camera;

    // 3. WebGL Renderer with High-contrast shadow mapping
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // 4. Orbit Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 + 0.35; // Don't look too far under the grid floor
    controls.target.copy(targetLookAt.current);
    controlsRef.current = controls;

    controls.addEventListener('start', () => {
      isInterpolating.current = false;
      setAutoRotate(false);
    });

    // 5. Ambient underground lighting (dim blue headlamp tint)
    const ambientLight = new THREE.AmbientLight(0x1e293b, 1.1);
    scene.add(ambientLight);

    // Camera Point Light (headlamp simulation)
    const headlamp = new THREE.PointLight(0xfff8f0, 2.8, 45, 0.45);
    camera.add(headlamp);
    scene.add(camera);

    // Directional beam mimicking mine entrance spotlights
    const spotLight = new THREE.DirectionalLight(0xffedd5, 1.8);
    spotLight.position.set(-6, 12, -10);
    spotLight.castShadow = true;
    spotLight.shadow.mapSize.width = 1024;
    spotLight.shadow.mapSize.height = 1024;
    scene.add(spotLight);

    // 6. Geological Workbench helper floor
    const gridHelper = new THREE.GridHelper(40, 40, 0x334155, 0x0f172a);
    const floorY = gabarit === '9m2' ? -(520 - gCY) * SCALE : -(650 - gCY) * SCALE;
    gridHelper.position.y = floorY - 0.01;
    gridHelper.position.z = DEPTH_METERS / 2;
    scene.add(gridHelper);

    // 7. Tunnel Gallery Geometry
    const shape = new THREE.Shape();
    if (gabarit !== '9m2') {
      // 12m2 tunnel profile (width = 800px, height = 750px)
      // Bottom-left corner is at (100, 650) relative to (gCX, gCY) = (500, 430)
      const x1 = (100 - gCX) * SCALE;
      const y1 = -(650 - gCY) * SCALE;
      shape.moveTo(x1, y1);

      const x2 = (100 - gCX) * SCALE;
      const y2 = -(300 - gCY) * SCALE;
      shape.lineTo(x2, y2);

      const arcCenterX = (500 - gCX) * SCALE;
      const arcCenterY = -(300 - gCY) * SCALE;
      const arcRadius = 400 * SCALE;
      for (let i = 1; i <= 20; i++) {
        const angle = Math.PI - (i / 20) * Math.PI;
        const ax = arcCenterX + arcRadius * Math.cos(angle);
        const ay = arcCenterY + arcRadius * Math.sin(angle);
        shape.lineTo(ax, ay);
      }

      const x3 = (900 - gCX) * SCALE;
      const y3 = -(650 - gCY) * SCALE;
      shape.lineTo(x3, y3);
    } else {
      // 9m2 tunnel profile (width = 440px, height = 370px)
      // SVG path: M 280,520 L 280,280 A 220,220 0 0,1 720,280 L 720,520 Z
      const x1 = (280 - gCX) * SCALE;
      const y1 = -(520 - gCY) * SCALE;
      shape.moveTo(x1, y1);

      const x2 = (280 - gCX) * SCALE;
      const y2 = -(280 - gCY) * SCALE;
      shape.lineTo(x2, y2);

      const arcCenterX = (500 - gCX) * SCALE;
      const arcCenterY = -(280 - gCY) * SCALE;
      const arcRadius = 220 * SCALE;
      for (let i = 1; i <= 20; i++) {
        const angle = Math.PI - (i / 20) * Math.PI;
        const ax = arcCenterX + arcRadius * Math.cos(angle);
        const ay = arcCenterY + arcRadius * Math.sin(angle);
        shape.lineTo(ax, ay);
      }

      const x3 = (720 - gCX) * SCALE;
      const y3 = -(520 - gCY) * SCALE;
      shape.lineTo(x3, y3);
    }
    shape.closePath();

    // Extrude Tunnel Geometry
    const extrudeSettings = {
      depth: DEPTH_METERS,
      bevelEnabled: false,
      steps: 40
    };
    const tunnelGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    
    // Apply highly realistic stone texturing
    const tunnelMat = new THREE.MeshStandardMaterial({
      map: rockTexture,
      bumpMap: rockBumpMap,
      bumpScale: 0.08,
      roughness: 0.92,
      metalness: 0.15,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: showWalls ? 0.75 : 0.06
    });
    const tunnelMesh = new THREE.Mesh(tunnelGeo, tunnelMat);
    tunnelMesh.receiveShadow = true;
    scene.add(tunnelMesh);

    // High fidelity wireframe contours
    const wireframeGeo = new THREE.WireframeGeometry(tunnelGeo);
    const wireframeMat = new THREE.LineBasicMaterial({
      color: 0x475569,
      transparent: true,
      opacity: showWalls ? 0.16 : 0.02
    });
    const tunnelWireframe = new THREE.LineSegments(wireframeGeo, wireframeMat);
    scene.add(tunnelWireframe);

    // Solid Back Rock Mass at the mouth end (Z = 0)
    const massShape = new THREE.Shape();
    massShape.moveTo(-10, -8);
    massShape.lineTo(10, -8);
    massShape.lineTo(10, 8);
    massShape.lineTo(-10, 8);
    massShape.closePath();
    massShape.holes.push(shape); // subtract tunnel hole for hollow entrance

    const massGeo = new THREE.ShapeGeometry(massShape);
    const massMat = new THREE.MeshStandardMaterial({
      map: rockTexture,
      bumpMap: rockBumpMap,
      bumpScale: 0.08,
      roughness: 0.95,
      metalness: 0.05,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: showWalls ? 0.65 : 0.04
    });
    const massMesh = new THREE.Mesh(massGeo, massMat);
    massMesh.receiveShadow = true;
    scene.add(massMesh);

    // Dynamic glowing neon outline on the entrance edge
    const borderGeo = new THREE.BufferGeometry().setFromPoints(shape.getPoints());
    const borderMat = new THREE.LineBasicMaterial({ color: 0xf59e0b, linewidth: 2 });
    const borderLine = new THREE.Line(borderGeo, borderMat);
    borderLine.position.z = 0.02; // Floating offset to avoid z-fighting
    scene.add(borderLine);

    // Closed geological backplate at the tunnel end face (Z = DEPTH_METERS)
    const backFaceGeo = new THREE.ShapeGeometry(shape);
    const backFaceMat = new THREE.MeshStandardMaterial({
      map: rockTexture,
      bumpMap: rockBumpMap,
      bumpScale: 0.09,
      roughness: 0.9,
      transparent: true,
      opacity: showWalls ? 0.8 : 0.05
    });
    const backFaceMesh = new THREE.Mesh(backFaceGeo, backFaceMat);
    backFaceMesh.position.z = DEPTH_METERS;
    backFaceMesh.receiveShadow = true;
    scene.add(backFaceMesh);

    // Dynamic glowing neon outline on the back face (Z = DEPTH_METERS) for high-precision finish visual
    const backBorderMat = new THREE.LineBasicMaterial({ color: 0x10b981, linewidth: 3, transparent: true, opacity: 0.15 });
    const backBorderLine = new THREE.Line(borderGeo, backBorderMat);
    backBorderLine.position.z = DEPTH_METERS - 0.01;
    scene.add(backBorderLine);
    backBorderLineRef.current = backBorderLine;

    // 8. Reinforcement Structures & Anchor Bolts Group (Support)
    const supportGroup = new THREE.Group();
    scene.add(supportGroup);
    supportGroupRef.current = supportGroup;

    // Rock Bolts splits & metallic frame ribs at 3-meter intervals
    if (showArches || showRockbolts) {
      const spacingMeters = 3.0;
      const totalLenMeters = DEPTH_METERS;
      const steelMat = new THREE.MeshStandardMaterial({
        color: 0x64748b, // Industrial Slate Grey Steel
        roughness: 0.45,
        metalness: 0.8
      });

      for (let zOffset = spacingMeters; zOffset < totalLenMeters - 1.5; zOffset += spacingMeters) {
        // Steel arches frames
        if (showArches) {
          const archPoints = shape.getPoints().map(p => new THREE.Vector3(p.x, p.y, zOffset));
          // Slightly offset inwards to avoid z-fighting with the tunnel wall mesh
          archPoints.forEach(p => {
            const dir = new THREE.Vector3(p.x, p.y, 0).normalize();
            p.addScaledVector(dir, -0.02);
          });
          const archFrameGeo = new THREE.TubeGeometry(
            new THREE.CatmullRomCurve3(archPoints),
            32,
            0.025, // 5cm thick steel ribs
            6,
            true
          );
          const archMesh = new THREE.Mesh(archFrameGeo, steelMat);
          supportGroup.add(archMesh);
        }

        // Rockbolts split set anchor rods radiating outwards
        if (showRockbolts) {
          const boltLength = 1.2; // 1.2m anchor bolts
          const points = shape.getPoints();
          
          const boltIndices = [2, 5, 8, 11, 14, 17, 20];
          boltIndices.forEach(b => {
            if (b >= points.length) return;
            const wallPt = points[b];
            const startVec = new THREE.Vector3(wallPt.x, wallPt.y, zOffset);
            
            // direction vector pointing away from gallery arch center
            const arcCenterY = gabarit === '9m2' ? -(280 - gCY) * SCALE : -(300 - gCY) * SCALE;
            const dirVec = new THREE.Vector3(wallPt.x, wallPt.y - arcCenterY, 0).normalize();
            const endVec = startVec.clone().addScaledVector(dirVec, boltLength);

            const boltGeo = new THREE.CylinderGeometry(0.012, 0.012, boltLength, 6);
            boltGeo.translate(0, boltLength / 2, 0);
            boltGeo.rotateX(Math.PI / 2);

            const boltMesh = new THREE.Mesh(boltGeo, steelMat);
            boltMesh.position.copy(startVec);
            boltMesh.lookAt(endVec);

            supportGroup.add(boltMesh);

            // Add metallic split-set head plates
            const plateGeo = new THREE.BoxGeometry(0.08, 0.08, 0.015);
            const plateMesh = new THREE.Mesh(plateGeo, steelMat);
            plateMesh.position.copy(startVec);
            plateMesh.lookAt(endVec);
            supportGroup.add(plateMesh);
          });
        }
      }
    }

    // 9. Automated alignment lasers Group
    const lasersGroup = new THREE.Group();
    scene.add(lasersGroup);
    lasersGroupRef.current = lasersGroup;

    if (showLasers) {
      const laserColor = 0x10b981; // Green guide lasers
      const laserMat = new THREE.LineBasicMaterial({ color: laserColor });
      
      // Horizontal and vertical guide laser lines intersecting at the face center
      const pointsH = [new THREE.Vector3(-2.2, 0.5, DEPTH_METERS - 0.02), new THREE.Vector3(2.2, 0.5, DEPTH_METERS - 0.02)];
      const pointsV = [new THREE.Vector3(0, floorY, DEPTH_METERS - 0.02), new THREE.Vector3(0, 2.5, DEPTH_METERS - 0.02)];

      const geoH = new THREE.BufferGeometry().setFromPoints(pointsH);
      const geoV = new THREE.BufferGeometry().setFromPoints(pointsV);

      const laserH = new THREE.Line(geoH, laserMat);
      const laserV = new THREE.Line(geoV, laserMat);
      lasersGroup.add(laserH, laserV);
    }

    // 10. Stylized 3D Montabert T23 Pneumatic Drill & Miner Silhouette Group (positioned near the active face)
    const drillRigGroup = new THREE.Group();
    scene.add(drillRigGroup);
    drillRigGroupRef.current = drillRigGroup;

    if (showDrillMachine) {
      const steelMat = new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.3, metalness: 0.8 }); // Silver metal
      const darkSteelMat = new THREE.MeshStandardMaterial({ color: 0x334155, roughness: 0.6, metalness: 0.7 }); // Dark steel
      const highVizMat = new THREE.MeshStandardMaterial({ color: 0xeab308, roughness: 0.4, metalness: 0.1 }); // Yellow helmet
      const operatorMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.8, metalness: 0.1 }); // Dark miner clothing

      const zFace = DEPTH_METERS;
      const drillY = floorY + 1.15; // standard drilling height in 3D (meters)
      const drillX = 0;             // centered on the face for default visual symmetry

      // A. Perforateur Montabert T23 Body (horizontal steel cylinder)
      const t23Body = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.35, 8), darkSteelMat);
      t23Body.rotation.x = Math.PI / 2;
      t23Body.position.set(drillX, drillY, zFace - 0.7);
      drillRigGroup.add(t23Body);

      // Front chuck & handle grip
      const chuck = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.1, 8), steelMat);
      chuck.rotation.x = Math.PI / 2;
      chuck.position.set(drillX, drillY, zFace - 0.5);
      drillRigGroup.add(chuck);

      const handle = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.015, 6, 12, Math.PI), darkSteelMat);
      handle.position.set(drillX, drillY, zFace - 0.88);
      handle.rotation.z = Math.PI / 2;
      drillRigGroup.add(handle);

      // B. Drill Steel (Fleuret / Tige de forage) extending to the face
      const fleuretGeo = new THREE.CylinderGeometry(0.01, 0.01, 0.52, 6);
      fleuretGeo.rotateX(Math.PI / 2);
      const fleuret = new THREE.Mesh(fleuretGeo, steelMat);
      fleuret.position.set(drillX, drillY, zFace - 0.25);
      drillRigGroup.add(fleuret);

      // C. Telescopic leg (Poussoir / Jackleg)
      // Leg base stands on floor, angled up to T23 swivel joint at Z = zFace - 0.75
      const legBasePos = new THREE.Vector3(drillX - 0.1, floorY, zFace - 1.25);
      const legSwivelPos = new THREE.Vector3(drillX, drillY - 0.04, zFace - 0.72);

      // Jackleg outer tube
      const legVec = legSwivelPos.clone().sub(legBasePos);
      const legLen = legVec.length();
      const legOuterGeo = new THREE.CylinderGeometry(0.022, 0.022, legLen * 0.55, 8);
      legOuterGeo.translate(0, legLen * 0.275, 0); // align bottom pivot
      const legOuter = new THREE.Mesh(legOuterGeo, darkSteelMat);
      legOuter.position.copy(legBasePos);
      legOuter.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), legVec.clone().normalize());
      drillRigGroup.add(legOuter);

      // Jackleg inner silver extension rod
      const legInnerGeo = new THREE.CylinderGeometry(0.013, 0.013, legLen * 0.5, 8);
      legInnerGeo.translate(0, legLen * 0.25, 0);
      const legInner = new THREE.Mesh(legInnerGeo, steelMat);
      legInner.position.copy(legBasePos.clone().add(legVec.clone().multiplyScalar(0.5)));
      legInner.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), legVec.clone().normalize());
      drillRigGroup.add(legInner);

      // D. Operator Silhouette (The Miner)
      const pOpHead = new THREE.Vector3(drillX - 0.35, drillY + 0.15, zFace - 1.15);
      
      // Miner Torso
      const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.09, 0.65, 8), operatorMat);
      torso.position.set(pOpHead.x, floorY + 0.65, pOpHead.z);
      drillRigGroup.add(torso);

      // Miner Head (Sphere)
      const head = new THREE.Mesh(new THREE.SphereGeometry(0.075, 12, 12), operatorMat);
      head.position.copy(pOpHead);
      drillRigGroup.add(head);

      // High-Visibility Safety Helmet (Half sphere or cap)
      const helmet = new THREE.Mesh(new THREE.SphereGeometry(0.082, 12, 12, 0, Math.PI * 2, 0, Math.PI / 1.8), highVizMat);
      helmet.position.copy(pOpHead);
      helmet.position.y += 0.015;
      drillRigGroup.add(helmet);

      // Miner Arms holding the T23
      const armGeo = new THREE.CylinderGeometry(0.02, 0.018, 0.35, 6);
      armGeo.rotateZ(Math.PI / 2.6);
      const arm = new THREE.Mesh(armGeo, operatorMat);
      arm.position.set((pOpHead.x + drillX) / 2, drillY - 0.05, (pOpHead.z + (zFace - 0.75)) / 2);
      drillRigGroup.add(arm);

      // E. Helmet LED Headlamp Light Cone Beam
      const targetPoint = new THREE.Vector3(drillX, drillY, zFace);
      const beamDir = targetPoint.clone().sub(pOpHead);
      const beamLen = beamDir.length();
      
      // Cone pointing towards face representing the LED headlamp beam
      const lightConeGeo = new THREE.ConeGeometry(0.3, beamLen, 16, 1, true);
      lightConeGeo.rotateX(Math.PI / 2);
      lightConeGeo.translate(0, 0, beamLen / 2); // extend from apex
      const lightConeMat = new THREE.MeshBasicMaterial({
        color: 0xfef08a,
        transparent: true,
        opacity: 0.18,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide
      });
      const lightCone = new THREE.Mesh(lightConeGeo, lightConeMat);
      lightCone.position.copy(pOpHead);
      lightCone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), beamDir.clone().normalize());
      drillRigGroup.add(lightCone);
    }

    // 11. Sparks particles group
    const holesGroup = new THREE.Group();
    scene.add(holesGroup);
    holesGroupRef.current = holesGroup;

    // 12. Create static dust particulate background
    if (dustDensity !== 'none') {
      const count = dustDensity === 'high' ? 80 : 35;
      const dustGeo = new THREE.DodecahedronGeometry(0.04, 0);
      const dustMat = new THREE.MeshBasicMaterial({
        color: 0x94a3b8,
        transparent: true,
        opacity: 0.25
      });

      for (let d = 0; d < count; d++) {
        const mesh = new THREE.Mesh(dustGeo, dustMat);
        const rx = (Math.random() - 0.5) * 12;
        const ry = (Math.random() - 0.5) * 8;
        const rz = Math.random() * DEPTH_METERS;
        mesh.position.set(rx, ry, rz);
        scene.add(mesh);
        
        dustParticlesRef.current.push({
          mesh,
          velocity: new THREE.Vector3((Math.random() - 0.5) * 0.1, (Math.random() - 0.5) * 0.05, (Math.random() - 0.5) * 0.05),
          range: DEPTH_METERS
        });
      }
    }

    // HUD Live callback updating degrees
    controls.addEventListener('change', () => {
      const spherical = new THREE.Spherical().setFromVector3(
        camera.position.clone().sub(controls.target)
      );
      const el = document.getElementById('hud3d-angles');
      if (el) {
        const yawDeg = Math.round(spherical.theta * (180 / Math.PI));
        const pitchDeg = Math.round((spherical.phi - Math.PI / 2) * (180 / Math.PI));
        el.innerText = `Caméra : Orbite Yaw ${yawDeg}° | Pitch ${pitchDeg}°`;
      }
    });

    const resizeObserver = new ResizeObserver(() => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = 780;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    resizeObserver.observe(containerRef.current);

    // Animation Tick
    let lastTime = performance.now();
    let frameId: number;

    const tick = () => {
      const now = performance.now();
      const deltaTime = (now - lastTime) / 1000;
      lastTime = now;

      // Update Controls
      controls.update();

      // Slow auto rotate camera
      if (autoRotateRef.current) {
        controls.autoRotate = true;
        controls.autoRotateSpeed = 1.0;
      } else {
        controls.autoRotate = false;
      }

      // Smooth camera presets transition interpolator
      if (isInterpolating.current) {
        camera.position.lerp(targetCamPos.current, 0.07);
        controls.target.lerp(targetLookAt.current, 0.07);
        if (camera.position.distanceTo(targetCamPos.current) < 0.02 && controls.target.distanceTo(targetLookAt.current) < 0.02) {
          isInterpolating.current = false;
        }
      } else if (cinematicCameraRef.current && (isPlayingRef.current || realtimePlayingRef.current)) {
        // Gorgeous, slow-motion sweeping drone shot
        const time = now * 0.00015; // ultra smooth speed
        const centerZ = DEPTH_METERS / 2;
        const targetX = Math.sin(time) * 1.8;
        const targetY = 0.5 + Math.cos(time * 0.6) * 0.4;
        const targetZ = centerZ + Math.sin(time * 1.1) * 1.5 - 2.0;
        
        camera.position.lerp(new THREE.Vector3(targetX, targetY, targetZ), 0.015);
        controls.target.lerp(new THREE.Vector3(0, 0.5, centerZ), 0.015);
      }

      // Apply dynamic camera shake
      if (cameraShakeRef.current > 0.01) {
        const factor = cameraShakeRef.current;
        const sX = (Math.random() - 0.5) * factor;
        const sY = (Math.random() - 0.5) * factor;
        const sZ = (Math.random() - 0.5) * factor;

        camera.position.x += sX;
        camera.position.y += sY;
        camera.position.z += sZ;

        controls.target.x += sX * 0.4;
        controls.target.y += sY * 0.4;
        controls.target.z += sZ * 0.4;

        // Fast decaying spring
        cameraShakeRef.current *= 0.88;
      }

      // Drift particulate dust
      dustParticlesRef.current.forEach(dust => {
        dust.mesh.position.addScaledVector(dust.velocity, deltaTime);
        // keep within bounds of the 4m x 3.5m tunnel
        if (Math.abs(dust.mesh.position.x) > 1.8) dust.velocity.x *= -1;
        if (dust.mesh.position.y < floorY || dust.mesh.position.y > 2.5) dust.velocity.y *= -1;
        if (dust.mesh.position.z < 0 || dust.mesh.position.z > dust.range) {
          dust.mesh.position.z = Math.random() * dust.range;
        }
      });

      // Sparks emitter for active step detonation
      const blastingHoles = holesToRender.filter(h => getBlastStepForHole(h, gabarit) === activeStep);
      if (activeStep > 0 && blastingHoles.length > 0) {
        blastingHoles.forEach(hole => {
          // Dynamic shockwave disc expanding occasionally
          if (Math.random() < 0.18) {
            const ringGeo = new THREE.RingGeometry(0.01, 0.02, 16);
            const ringMat = new THREE.MeshBasicMaterial({
              color: 0xff8c00,
              side: THREE.DoubleSide,
              transparent: true,
              opacity: 0.85
            });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            const mouthPos = getHole3DVector(hole, 0);
            mouthPos.z -= 0.01; // slightly in front
            ring.position.copy(mouthPos);
            scene.add(ring);

            shockwavesRef.current.push({
              mesh: ring,
              scaleSpeed: 2.5,
              opacitySpeed: 2.3,
              life: 0.4
            });
          }

          // Emit spark particles
          for (let i = 0; i < 4; i++) {
            const sparkGeo = new THREE.BoxGeometry(0.04, 0.04, 0.04);
            const sparkMat = new THREE.MeshBasicMaterial({
              color: new THREE.Color().setHSL(0.04 + Math.random() * 0.08, 1.0, 0.65),
              transparent: true,
              opacity: 0.95
            });
            const sparkMesh = new THREE.Mesh(sparkGeo, sparkMat);
            const mouthPos = getHole3DVector(hole, 0);
            mouthPos.z -= 0.04;
            sparkMesh.position.copy(mouthPos);

            // Flying rocks vector ejection (direction +Z towards the back of the gallery)
            const velocity = new THREE.Vector3(
              (Math.random() - 0.5) * 2.2,
              (Math.random() - 0.5) * 2.2 + 0.6, // slight upward bounce
              (1.5 + Math.random() * 4.0) // high-speed inward ejection
            );

            const life = 0.35 + Math.random() * 0.6;
            scene.add(sparkMesh);
            sparksRef.current.push({
              mesh: sparkMesh,
              velocity,
              life,
              maxLife: life
            });
          }
        });
      }

      // Update existing sparks
      for (let idx = sparksRef.current.length - 1; idx >= 0; idx--) {
        const spark = sparksRef.current[idx];
        spark.mesh.position.addScaledVector(spark.velocity, deltaTime);
        spark.velocity.y -= 4.2 * deltaTime; // gravity pull
        spark.life -= deltaTime;
        const ratio = Math.max(0, spark.life / spark.maxLife);
        spark.mesh.material.opacity = ratio;
        spark.mesh.scale.set(ratio, ratio, ratio);

        if (spark.life <= 0) {
          scene.remove(spark.mesh);
          spark.mesh.geometry.dispose();
          spark.mesh.material.dispose();
          sparksRef.current.splice(idx, 1);
        }
      }

      // Update existing shockwaves
      for (let idx = shockwavesRef.current.length - 1; idx >= 0; idx--) {
        const wave = shockwavesRef.current[idx];
        const s = wave.mesh.scale.x + wave.scaleSpeed * deltaTime;
        wave.mesh.scale.set(s, s, 1);
        wave.life -= deltaTime;
        const ratio = Math.max(0, wave.life / 0.4);
        wave.mesh.material.opacity = ratio * 0.9;

        if (wave.life <= 0) {
          scene.remove(wave.mesh);
          wave.mesh.geometry.dispose();
          wave.mesh.material.dispose();
          shockwavesRef.current.splice(idx, 1);
        }
      }

      // Animate glowing back face border line representing perfect gabarit finish
      if (backBorderLineRef.current) {
        const mat = backBorderLineRef.current.material as THREE.LineBasicMaterial;
        if (activeStep === maxStep) {
          const pulse = 0.5 + 0.5 * Math.sin(now * 0.008);
          mat.opacity = 0.4 + 0.6 * pulse;
          const hue = (now * 0.05) % 360;
          mat.color.setHSL(hue / 360, 0.9, 0.5);
        } else {
          mat.opacity = 0.15;
          mat.color.setHex(0x475569); // Subtle slate-grey
        }
      }

      // Project 2D HTML tag badges precisely in 3D
      const widthCurrent = containerRef.current?.clientWidth || width;
      holesToRender.forEach(hole => {
        const el = document.getElementById(`3d-label-${hole.id}`);
        if (!el) return;

        const blastStep = getBlastStepForHole(hole, gabarit);
        const isExploded = activeStep > blastStep;
        if (isExploded) {
          el.style.opacity = '0';
          return;
        }

        const pos = getHole3DVector(hole, 0);
        pos.z -= 0.05; // Slightly forward
        pos.project(camera);

        if (pos.z > 1) {
          el.style.opacity = '0';
          return;
        }

        const sx = (pos.x * .5 + .5) * widthCurrent;
        const sy = (-(pos.y * .5) + .5) * height;

        el.style.left = `${sx}px`;
        el.style.top = `${sy}px`;
        el.style.opacity = '0.9';

        const color =
          hole.type === 'vide'     ? '#38bdf8' :
          hole.type === 'charge'   ? '#fbbf24' :
          hole.type === 'g1'       ? '#3b82f6' :
          hole.type === 'g2'       ? '#ef4444' :
          hole.type === 'g3'       ? '#22d3ee' :
          hole.type === 'g4'       ? '#f97316' :
          hole.type === 'radier'   ? '#8b5cf6' :
          hole.type === 'parement' ? '#14b8a6' :
                                     '#f43f5e';
        el.style.borderColor = color;
        el.style.color = color;
      });

      renderer.render(scene, camera);
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();

      // Dispose of resources
      tunnelGeo.dispose();
      tunnelMat.dispose();
      wireframeGeo.dispose();
      wireframeMat.dispose();
      massGeo.dispose();
      massMat.dispose();
      borderGeo.dispose();
      borderMat.dispose();
      backBorderMat.dispose();
      backFaceGeo.dispose();
      backFaceMat.dispose();

      if (controls) controls.dispose();
      if (renderer) {
        if (containerRef.current && renderer.domElement.parentNode) {
          try {
            containerRef.current.removeChild(renderer.domElement);
          } catch(e) {}
        }
        renderer.dispose();
      }
    };
  }, [gabarit, showWalls, showRockbolts, showArches, showLasers, showDrillMachine, dustDensity]);

  // Re-build and render holes dynamically when activeStep, toggles, or props change
  useEffect(() => {
    const scene = sceneRef.current;
    const holesGroup = holesGroupRef.current;
    if (!scene || !holesGroup) return;

    // Smooth focal sweep or top view on step transitions
    if (activeStep < maxStep) {
      // Perfectly face-to-face perspective to inspect the hole locations with clear front alignment
      targetLookAt.current.set(0, 0.7, 3.0);
      targetCamPos.current.set(0, 0.7, gabarit === '9m2' ? -3.8 : -4.5);
      isInterpolating.current = true;
    } else if (activeStep === maxStep) {
      // Final view: Immersive and dramatic low-angle side perspective from inside the gallery, looking towards the finished face.
      // This highlights the perfect symmetry and alignment of the floor (radier), arch (voûte), and wall (parement) contour holes.
      targetLookAt.current.set(0, 0.6, DEPTH_METERS - 1.5);
      targetCamPos.current.set(2.4, 0.5, DEPTH_METERS - 8.5);
      isInterpolating.current = true;
    }

    // Clear old hole meshes
    while (holesGroup.children.length > 0) {
      const child = holesGroup.children[0] as THREE.Mesh;
      holesGroup.remove(child);
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach(m => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    }

    const getColorForType = (type: string) => {
      switch (type) {
        case 'vide': return 0x38bdf8;
        case 'charge': return 0xf59e0b;
        case 'g1': return 0x3b82f6;
        case 'g2': return 0xef4444;
        case 'g3': return 0x22d3ee;
        case 'g4': return 0xf97316;
        case 'radier': return 0x8b5cf6;
        case 'parement': return 0x14b8a6;
        default: return 0xf43f5e;
      }
    };

    holesToRender.forEach((hole) => {
      const blastStep = getBlastStepForHole(hole, gabarit);
      const isExploded = activeStep > blastStep;
      const isBlasting = activeStep === blastStep;
      const isGhosted = isExploded;

      const pA = getHole3DVector(hole, 0);
      pA.z -= 0.01; // floating offset in meters

      const pMid = getHole3DVector(hole, DEPTH * 0.35);
      pMid.z -= 0.01;

      const pB = getHole3DVector(hole, DEPTH);

      const isVide = hole.type === 'vide';
      const colorHex = getColorForType(hole.type);

      const buildCylinder = (start: THREE.Vector3, end: THREE.Vector3, radius: number, material: THREE.Material) => {
        const direction = new THREE.Vector3().subVectors(end, start);
        const length = direction.length();
        const cylinderGeo = new THREE.CylinderGeometry(radius, radius, length, 8);
        const cylinder = new THREE.Mesh(cylinderGeo, material);
        
        const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
        cylinder.position.copy(midpoint);
        
        const up = new THREE.Vector3(0, 1, 0);
        const dirNorm = direction.clone().normalize();
        cylinder.quaternion.setFromUnitVectors(up, dirNorm);
        
        cylinder.userData = { hole };
        return cylinder;
      };

      if (isVide) {
        // Empty holes: single cyan cylinder across entire depth
        const videMat = new THREE.MeshStandardMaterial({
          color: 0x38bdf8,
          roughness: 0.5,
          metalness: 0.2,
          transparent: true,
          opacity: isGhosted ? 0.12 : 0.5,
          side: THREE.DoubleSide,
          depthWrite: false
        });
        const mesh = buildCylinder(pA, pB, 0.045, videMat);
        holesGroup.add(mesh);
      } else {
        // Stemming Bourrage (Slate Grey)
        if (showFores) {
          const stemmingMat = new THREE.MeshStandardMaterial({
            color: 0x94a3b8,
            roughness: 0.95,
            metalness: 0.0,
            transparent: isGhosted,
            opacity: isGhosted ? 0.08 : 1.0
          });
          const stemmingMesh = buildCylinder(pA, pMid, 0.035, stemmingMat);
          holesGroup.add(stemmingMesh);
        }

        // Active explosive charge (Emissive glows)
        if (showExplosives) {
          const isContourHole = ['radier', 'parement', 'voute'].includes(hole.type);
          const expMat = new THREE.MeshStandardMaterial({
            color: colorHex,
            roughness: 0.3,
            metalness: 0.3,
            transparent: isGhosted,
            opacity: isGhosted ? 0.18 : 1.0,
            emissive: colorHex,
            emissiveIntensity: isBlasting ? (isContourHole ? 4.5 : 3.0) : (isGhosted ? 0.08 : 0.5)
          });

          if (isBlasting && !isContourHole) {
            expMat.color.setHex(0xffffff);
            expMat.emissive.setHex(0xffffff);
          }

          const radius = isBlasting ? (isContourHole ? 0.055 : 0.045) : 0.035;
          const explosiveMesh = buildCylinder(pMid, pB, radius, expMat);
          holesGroup.add(explosiveMesh);
        }
      }

      // Sphere Mouth indicator
      const isContourHole = ['radier', 'parement', 'voute'].includes(hole.type);
      const mouthMat = new THREE.MeshStandardMaterial({
        color: (isBlasting && !isContourHole) ? 0xffffff : colorHex,
        roughness: 0.2,
        transparent: isGhosted,
        opacity: isGhosted ? 0.22 : 1.0,
        emissive: (isBlasting && !isContourHole) ? 0xffffff : colorHex,
        emissiveIntensity: isBlasting ? (isContourHole ? 4.5 : 3.0) : (isGhosted ? 0.1 : 0.6)
      });
      const mouthGeo = new THREE.SphereGeometry(isBlasting ? (isContourHole ? 0.08 : 0.055) : 0.042, 8, 8);
      const mouthMesh = new THREE.Mesh(mouthGeo, mouthMat);
      mouthMesh.position.copy(pA);
      mouthMesh.userData = { hole };
      holesGroup.add(mouthMesh);
    });
  }, [holesToRender, activeStep, showFores, showExplosives, gabarit, DEPTH]);

  // WebGL Raycasting for interactive hover
  const handleMouseMoveCanvas = (e: React.MouseEvent) => {
    const renderer = rendererRef.current;
    const camera = cameraRef.current;
    const holesGroup = holesGroupRef.current;

    if (!renderer || !camera || !holesGroup) return;

    const rect = renderer.domElement.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), camera);

    const intersects = raycaster.intersectObjects(holesGroup.children);
    if (intersects.length > 0) {
      const match = intersects.find(intersect => intersect.object.userData && intersect.object.userData.hole);
      if (match) {
        setHoveredHole(match.object.userData.hole);
      }
    }
  };

  const handleMouseLeaveCanvas = () => {
    setHoveredHole(null);
  };

  return (
    <div className="space-y-6 w-full">
      {/* REALITY OVERVIEW BANNER */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative overflow-hidden shadow-xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="space-y-2 relative z-10">
          <span className="inline-flex items-center gap-1.5 bg-amber-500/10 text-[#ffd700] text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border border-amber-500/20">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            SIMULATION RÉALISTE À 100%
          </span>
          <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight">
            VUE SCHÉMA 3D DE LA GALERIE
          </h2>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest leading-relaxed max-w-2xl">
            Modélisation géotechnique tridimensionnelle interactive du front de taille. Analysez la disposition spatiale des cibles de forage, les lignes de cisaillement et le soutènement physique en conditions souterraines réelles.
          </p>
        </div>

        {/* Dynamic Telemetry Metric Cards */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 shrink-0">
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-center">
            <span className="text-slate-500 text-[8px] font-black uppercase tracking-wider block">Métrage Arraché</span>
            <span className="text-white text-xl font-black font-mono">{getFootage().toFixed(1)} m</span>
            <span className="text-amber-500 text-[9px] font-bold block mt-0.5">{currentPercentage}% volée</span>
          </div>
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-center">
            <span className="text-slate-500 text-[8px] font-black uppercase tracking-wider block">Détonateurs Actifs</span>
            <span className="text-amber-400 text-xl font-black font-mono">
              {holesToRender.filter(h => getBlastStepForHole(h, gabarit) === activeStep).length} / {holesToRender.length}
            </span>
            <span className="text-slate-400 text-[9px] font-bold block mt-0.5">Trous de forage</span>
          </div>
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-4 text-center col-span-2 md:col-span-1">
            <span className="text-slate-500 text-[8px] font-black uppercase tracking-wider block">Moteur Graphique</span>
            <span className="text-emerald-400 text-xl font-black flex items-center justify-center gap-1.5 font-mono">
              <Zap className="w-4 h-4 text-emerald-400" /> GPU
            </span>
            <span className="text-slate-400 text-[9px] font-bold block mt-0.5">WebGL 60 FPS</span>
          </div>
        </div>
      </div>

      {/* THREEJS IMMERSIVE STAGE AND REALITY CONTROL PANELS (WIDESCREEN 12 COLS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* LEFT PANEL: 3D WEBGL STAGE (8 Cols) */}
        <div className="lg:col-span-8 flex flex-col justify-between bg-slate-950 border border-slate-800 rounded-3xl relative overflow-hidden min-h-[620px] shadow-2xl">
          
          {/* TOP OVERLAYS: Legend & Navigation controls */}
          <div className="absolute top-4 left-4 right-4 flex items-center justify-between gap-4 z-10 pointer-events-none">
            {/* Legend */}
            <div className="flex gap-2.5 bg-slate-950/90 border border-slate-800 px-3.5 py-2 rounded-2xl shadow-xl pointer-events-auto text-[9px] font-black uppercase tracking-wider text-slate-400 flex-wrap">
              <span className="flex items-center gap-1.5 text-slate-200">
                <span className="w-2.5 h-2.5 rounded-full bg-sky-400 inline-block" /> Vide
              </span>
              <span className="flex items-center gap-1.5 text-slate-200">
                <span className="w-2.5 h-2.5 rounded-full bg-[#f59e0b] inline-block" /> Bouchon
              </span>
              <span className="flex items-center gap-1.5 text-slate-200">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" /> G1
              </span>
              <span className="flex items-center gap-1.5 text-slate-200">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> G2
              </span>
              <span className="flex items-center gap-1.5 text-slate-200">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" /> G3
              </span>
              {gabarit !== '9m2' && (
                <span className="flex items-center gap-1.5 text-slate-200">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block" /> G4
                </span>
              )}
              <span className="flex items-center gap-1.5 text-slate-200">
                <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" /> Radier/Parement
              </span>
            </div>

            {/* Presets Camera */}
            <div className="flex items-center gap-1 bg-slate-950/90 border border-slate-800 p-1 rounded-xl shadow-xl pointer-events-auto">
              {[
                { id: 'iso', label: 'Iso' },
                { id: 'face', label: 'Face' },
                { id: 'side', label: 'Profil' },
                { id: 'top', label: 'Dessus' },
              ].map(cam => (
                <button
                  key={cam.id}
                  onClick={() => applyPreset(cam.id as any)}
                  className="px-2.5 py-1 text-[9px] font-black uppercase text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  {cam.label}
                </button>
              ))}
            </div>
          </div>

          {/* THREEJS CANVAS STAGE CONTAINER */}
          <div 
            ref={containerRef}
            onMouseMove={handleMouseMoveCanvas}
            onMouseLeave={handleMouseLeaveCanvas}
            className="w-full h-[780px] relative overflow-hidden"
            style={{ cursor: 'grab' }}
          >
            {/* Projected HTML label markers */}
            {holesToRender.map(hole => (
              <div
                key={`3d-label-${hole.id}`}
                id={`3d-label-${hole.id}`}
                className="absolute pointer-events-none select-none px-1.5 py-0.5 rounded text-[8px] font-black font-mono transition-all duration-100 shadow-lg border text-center bg-slate-950/90 backdrop-blur-xs"
                style={{
                  transform: 'translate(-50%, -50%)',
                  opacity: 0,
                  left: 0,
                  top: 0,
                  zIndex: 20
                }}
              >
                {hole.label}
              </div>
            ))}
          </div>

          {/* BOTTOM INTERACTIVE METRICS HUD (Floating Telemetry Panel) */}
          <div className="px-6 py-4 bg-slate-950 border-t border-slate-800/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <div>
                <p id="hud3d-angles" className="text-[10px] font-black text-[#ffd700] uppercase tracking-wider">
                  Caméra : Orbite Yaw 35° | Pitch -20°
                </p>
                <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest">
                  Analyse Géotechnique interactive · SMI Imiter CAD
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4 text-[9px] font-bold text-slate-400 uppercase tracking-widest">
              <p>Section : <span className="text-white font-extrabold">{gabarit === '9m2' ? 'Traçage 9m² (1.7m)' : 'Galerie 12m² (2.3m)'}</span></p>
              <div className="w-px h-4 bg-slate-800" />
              <p>Foration : <span className="text-white font-extrabold">{holesToRender.length} Trous</span></p>
            </div>
          </div>
        </div>

        {/* RIGHT PANEL: REALITY CONTROL COCKPIT (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col justify-between bg-white border border-slate-200 rounded-3xl p-6 space-y-6 shadow-xl">
          
          {/* SECTION 1: DETONICS CONTROLLER */}
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider flex items-center gap-2">
                <Radio className="w-4 h-4 text-rose-500" />
                CONTRÔLEUR DE TIR & RETARD
              </h3>
              <span className="font-mono text-[9px] font-black bg-slate-900 text-white px-2 py-0.5 rounded-lg">
                Étape {activeStep} / {maxStep}
              </span>
            </div>

            {/* Time delay playback bar */}
            <div className="flex items-center justify-between px-1">
              {Array.from({ length: maxStep + 1 }).map((_, stepIdx) => (
                <button
                  key={stepIdx}
                  onClick={() => {
                    setActiveStep(stepIdx);
                    setIsPlaying(false);
                    stopRealtimePlayback();
                  }}
                  className={`w-7 h-7 rounded-full font-mono text-[10.5px] font-black flex items-center justify-center transition-all cursor-pointer ${
                    activeStep === stepIdx
                      ? 'bg-amber-400 text-slate-950 scale-110 ring-4 ring-amber-500/20 font-black shadow-md'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-500'
                  }`}
                >
                  {stepIdx}
                </button>
              ))}
            </div>

            {/* Playback action buttons */}
            <div className="grid grid-cols-5 gap-2 pt-1">
              <button
                onClick={handleReset}
                title="Reset"
                className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl flex items-center justify-center transition-colors text-xs font-bold cursor-pointer"
              >
                <RotateCcw className="w-4 h-4 shrink-0" />
              </button>
              <button
                onClick={handlePrev}
                disabled={activeStep === 0}
                className="py-2.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-800 rounded-xl flex items-center justify-center transition-colors text-xs font-bold cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4 shrink-0" />
              </button>
              <button
                onClick={() => {
                  setIsPlaying(!isPlaying);
                  stopRealtimePlayback();
                  setRealtimeMode(false);
                }}
                className={`py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition-colors text-xs font-black uppercase tracking-wider cursor-pointer col-span-2 ${
                  isPlaying
                    ? 'bg-rose-500 hover:bg-rose-600 text-white'
                    : 'bg-amber-400 hover:bg-amber-500 text-slate-950'
                }`}
              >
                {isPlaying ? <Pause className="w-3.5 h-3.5 shrink-0" /> : <Play className="w-3.5 h-3.5 shrink-0" />}
                {isPlaying ? "PAUSE" : "AUTO PLAY"}
              </button>
              <button
                onClick={handleNext}
                disabled={activeStep === maxStep}
                className="py-2.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-800 rounded-xl flex items-center justify-center transition-colors text-xs font-bold cursor-pointer"
              >
                <ChevronRight className="w-4 h-4 shrink-0" />
              </button>
            </div>

            {/* Realtime microsecond slow-motion mode */}
            <div className="border-t border-slate-100 pt-3 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
                  Mode Temps Réel ×100
                </span>
                <button
                  onClick={() => {
                    setRealtimeMode(prev => !prev);
                    setIsPlaying(false);
                    stopRealtimePlayback();
                    setRealtimeMs(0);
                  }}
                  className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border transition-colors cursor-pointer ${
                    realtimeMode
                      ? 'bg-amber-500 text-white border-amber-600 shadow-sm'
                      : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                  }`}
                >
                  {realtimeMode ? 'ACTIF' : 'DÉSACTIVÉ'}
                </button>
              </div>

              {realtimeMode && (
                <div className="space-y-3 bg-slate-950 p-4 rounded-2xl border border-slate-900">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[#ffd700] font-black text-2xl font-mono">
                        {realtimeMs.toFixed(1)}
                      </span>
                      <span className="text-slate-400 text-xs ml-1 font-mono">ms</span>
                    </div>
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">
                      CHRONO BLAST
                    </span>
                  </div>

                  <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500 transition-all"
                      style={{ width: `${(realtimeMs / TOTAL_DURATION_MS) * 100}%` }}
                    />
                  </div>

                  {!realtimePlaying ? (
                    <button
                      onClick={startRealtimePlayback}
                      className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white text-[9px] font-black uppercase tracking-wider rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5 shadow-md"
                    >
                      <Flame className="w-3.5 h-3.5" /> DÉCLENCHER LE TIR MICRO-STAGED
                    </button>
                  ) : (
                    <button
                      onClick={stopRealtimePlayback}
                      className="w-full py-2 bg-slate-800 hover:bg-slate-950 text-white text-[9px] font-black uppercase tracking-wider rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      ⏹ ARRÊTER LA MODÉLISATION
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* SECTION 1.5: L'ORCHESTRATEUR CINÉMATIQUE (TRENT REZNOR STYLE) */}
          <div className="space-y-4 bg-slate-950 p-4 rounded-2xl border border-slate-900 text-white shadow-inner">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h3 className="text-xs font-black uppercase text-[#ffd700] tracking-wider flex items-center gap-2">
                <Music className="w-4 h-4 text-amber-400 animate-pulse" />
                L'ORCHESTRATEUR SONORE
              </h3>
              <span className="text-[7.5px] font-black bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded border border-amber-500/20">
                REZNOR & ROSS TRIBUTE
              </span>
            </div>

            <p className="text-slate-400 text-[9.5px] font-bold uppercase tracking-widest leading-relaxed">
              Synthétiseur analogique dynamique de tir. Génère une nappe sombre ambiante et des détonations physiques synchronisées en temps réel.
            </p>

            <div className="grid grid-cols-2 gap-2">
              {/* Soundtrack Toggle */}
              <button
                onClick={handleToggleSoundtrack}
                className={`py-2 px-3 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                  soundtrackActive
                    ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 border-amber-600 shadow-md font-black'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border-slate-800 font-bold'
                }`}
              >
                <Music className="w-3.5 h-3.5" />
                {soundtrackActive ? 'ORCHESTRATION ON' : 'ACTIVER SON'}
              </button>

              {/* Cinematic Camera Toggle */}
              <button
                onClick={() => setCinematicCamera(prev => !prev)}
                className={`py-2 px-3 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer border ${
                  cinematicCamera
                    ? 'bg-purple-600 hover:bg-purple-700 text-white border-purple-700 shadow-md font-black'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border-slate-800 font-bold'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                {cinematicCamera ? 'DRONE ACTIF' : 'CAMÉRA LIBRE'}
              </button>
            </div>

            {/* Volume controller slider */}
            {soundtrackActive && (
              <div className="space-y-1.5 pt-1 border-t border-slate-900">
                <div className="flex items-center justify-between text-[8px] font-black text-slate-400 uppercase tracking-widest">
                  <span className="flex items-center gap-1">
                    <Volume2 className="w-3 h-3" /> Volume du Synthétiseur
                  </span>
                  <span>{Math.round(audioVolume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={audioVolume}
                  onChange={(e) => setAudioVolume(parseFloat(e.target.value))}
                  className="w-full accent-amber-500 bg-slate-800 h-1 rounded-lg appearance-none cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* SECTION 2: REALITY OVERLAYS & STRUCTURAL TOGGLES */}
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase text-slate-900 border-b border-slate-100 pb-2 tracking-wider flex items-center gap-2">
              <Sliders className="w-4 h-4 text-amber-500" />
              ÉLÉMENTS GÉOTECHNIQUES 3D
            </h3>

            <div className="grid grid-cols-4 gap-1.5">
              {/* Rockbolts */}
              <button
                onClick={() => setShowRockbolts(prev => !prev)}
                className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between h-18 ${
                  showRockbolts
                    ? 'bg-amber-500/5 border-amber-500/20 text-slate-900'
                    : 'bg-slate-50/50 border-slate-200 text-slate-400'
                }`}
              >
                <HardHat className={`w-3.5 h-3.5 ${showRockbolts ? 'text-amber-500' : 'text-slate-400'}`} />
                <div className="mt-1">
                  <span className="text-[8px] font-black uppercase tracking-wider block leading-none">Boulon</span>
                  <span className="text-[7px] font-medium text-slate-500 block leading-tight mt-0.5">Split Sets</span>
                </div>
              </button>

              {/* Arches */}
              <button
                onClick={() => setShowArches(prev => !prev)}
                className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between h-18 ${
                  showArches
                    ? 'bg-amber-500/5 border-amber-500/20 text-slate-900'
                    : 'bg-slate-50/50 border-slate-200 text-slate-400'
                }`}
              >
                <Grid className={`w-3.5 h-3.5 ${showArches ? 'text-amber-500' : 'text-slate-400'}`} />
                <div className="mt-1">
                  <span className="text-[8px] font-black uppercase tracking-wider block leading-none">Soutien</span>
                  <span className="text-[7px] font-medium text-slate-500 block leading-tight mt-0.5">Arceaux</span>
                </div>
              </button>

              {/* Guidelasers */}
              <button
                onClick={() => setShowLasers(prev => !prev)}
                className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between h-18 ${
                  showLasers
                    ? 'bg-amber-500/5 border-amber-500/20 text-slate-900'
                    : 'bg-slate-50/50 border-slate-200 text-slate-400'
                }`}
              >
                <Zap className={`w-3.5 h-3.5 ${showLasers ? 'text-amber-500' : 'text-slate-400'}`} />
                <div className="mt-1">
                  <span className="text-[8px] font-black uppercase tracking-wider block leading-none">Lasers</span>
                  <span className="text-[7px] font-medium text-slate-500 block leading-tight mt-0.5">Ciblage</span>
                </div>
              </button>

              {/* Foreur Montabert T23 */}
              <button
                onClick={() => setShowDrillMachine(prev => !prev)}
                className={`p-2 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between h-18 ${
                  showDrillMachine
                    ? 'bg-amber-500/5 border-amber-500/20 text-slate-900'
                    : 'bg-slate-50/50 border-slate-200 text-slate-400'
                }`}
              >
                <User className={`w-3.5 h-3.5 ${showDrillMachine ? 'text-amber-500' : 'text-slate-400'}`} />
                <div className="mt-1">
                  <span className="text-[8px] font-black uppercase tracking-wider block leading-none">Foreur</span>
                  <span className="text-[7px] font-medium text-slate-500 block leading-tight mt-0.5">Montabert</span>
                </div>
              </button>
            </div>

            {/* Fog density selector */}
            <div className="flex items-center justify-between pt-1">
              <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Particules & Poussières</span>
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                {['none', 'low', 'high'].map(d => (
                  <button
                    key={d}
                    onClick={() => setDustDensity(d as any)}
                    className={`px-2 py-1 text-[8px] font-black uppercase rounded-lg cursor-pointer ${
                      dustDensity === d ? 'bg-amber-400 text-slate-950 font-black' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {d === 'none' ? 'Sans' : d === 'low' ? 'Léger' : 'Fort'}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* SECTION 3: SEISMOGRAPH / GEOPHONE SIMULATION GRAPH */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider flex items-center gap-2">
                <Activity className="w-4 h-4 text-amber-500" />
                SÉISMOGRAPHE & CAPTEURS VIBRATOIRES
              </h3>
              <span className="inline-flex items-center gap-1 text-[8px] font-black text-slate-500 uppercase">
                🔴 LIVE FEED
              </span>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-2 relative h-28 overflow-hidden flex items-center justify-center">
              <canvas
                ref={seismicCanvasRef}
                width={360}
                height={100}
                className="w-full h-full"
              />
              <div className="absolute bottom-2 left-2 pointer-events-none text-[8px] text-slate-500 font-black uppercase tracking-widest">
                SMI Géophone central · Seismog-9X
              </div>
            </div>
          </div>

          {/* HOVER HOLE DETAILS (STUNNING CONTEXTUAL HUD) */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-xs text-white">
            {hoveredHole ? (
              <div className="space-y-1.5 w-full">
                <div className="flex items-center gap-2">
                  <span className={`w-3 h-3 rounded-full ${
                    hoveredHole.type === 'vide' ? 'bg-white border' : 'bg-amber-400'
                  }`} />
                  <span className="font-black uppercase tracking-wider text-amber-400 text-sm">
                    {hoveredHole.name}
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[9px] text-slate-300 uppercase">
                  <p>Type: <span className="font-extrabold text-white">{hoveredHole.type}</span></p>
                  <p>Délai: <span className="font-extrabold text-white">{hoveredHole.delay} ms</span></p>
                  {hoveredHole.type !== 'vide' && (
                    <p className="text-amber-300 flex items-center gap-1 font-black">
                      🎯 Vecteur de cisaillement : VERS LE VIDE CENTRAL
                    </p>
                  )}
                </div>
                <p className="text-slate-400 text-[10.5px] font-medium leading-relaxed italic border-t border-slate-800/60 pt-2 mt-1.5">
                  {hoveredHole.desc}
                </p>
              </div>
            ) : (
              <div className="text-slate-400 font-medium italic py-1 flex items-center gap-2 text-[10.5px] leading-relaxed">
                <Info className="w-4 h-4 text-slate-400 shrink-0" />
                Survolez un trou de forage sur le schéma 3D pour analyser son délai, sa fonction et le vecteur de poussée mécanique.
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
