import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  GraduationCap, 
  BookOpen, 
  Video, 
  HelpCircle, 
  Activity, 
  CheckCircle, 
  CheckCircle2,
  ShieldAlert, 
  FileText, 
  ChevronRight,
  ChevronLeft,
  HardHat,
  Search,
  Compass,
  Map,
  Users,
  Trophy,
  ArrowRight,
  Sparkles,
  RotateCcw,
  Sliders,
  Check,
  AlertTriangle,
  Play,
  Flame,
  Wrench,
  ThumbsUp
} from 'lucide-react';
import { HOLES_DATA, getHolesData } from './TechniqueMiniere/data';
import { HoleInfo } from './TechniqueMiniere/types';

// Persistence interface
interface TutorialProgress {
  currentStep: number;
  completedSteps: number[];
  certificateEarned: boolean;
}

const DEFAULT_PROGRESS: TutorialProgress = {
  currentStep: 1,
  completedSteps: [],
  certificateEarned: false
};

export const Tutoriel: React.FC = () => {
  // Load initial progress from localStorage
  const [progress, setProgress] = useState<TutorialProgress>(() => {
    try {
      const saved = localStorage.getItem('hydromines_tutorial_progress');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error("Failed to load tutorial progress", e);
    }
    return DEFAULT_PROGRESS;
  });

  const { currentStep, completedSteps, certificateEarned } = progress;

  // Save progress on change
  const saveProgress = (newProgress: TutorialProgress) => {
    setProgress(newProgress);
    try {
      localStorage.setItem('hydromines_tutorial_progress', JSON.stringify(newProgress));
    } catch (e) {
      console.error("Failed to save progress", e);
    }
  };

  const handleStepClick = (stepNum: number) => {
    const maxUnlocked = Math.max(1, ...completedSteps) + 1;
    if (stepNum <= maxUnlocked || completedSteps.includes(stepNum)) {
      saveProgress({
        ...progress,
        currentStep: stepNum
      });
    }
  };

  const markStepComplete = (stepNum: number) => {
    if (!completedSteps.includes(stepNum)) {
      const updatedCompleted = [...completedSteps, stepNum];
      saveProgress({
        ...progress,
        completedSteps: updatedCompleted
      });
    }
  };

  const handleNext = () => {
    markStepComplete(currentStep);
    if (currentStep < 9) {
      saveProgress({
        ...progress,
        completedSteps: completedSteps.includes(currentStep) ? completedSteps : [...completedSteps, currentStep],
        currentStep: currentStep + 1
      });
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      saveProgress({
        ...progress,
        currentStep: currentStep - 1
      });
    }
  };

  const handleResetProgress = () => {
    if (window.confirm("Êtes-vous sûr de vouloir réinitialiser tout votre progrès du tutoriel ?")) {
      saveProgress(DEFAULT_PROGRESS);
    }
  };

  // State managers for step-specific validations
  // Step 1
  const [step1Started, setStep1Started] = useState(false);
  // Step 2
  const [hoveredHole, setHoveredHole] = useState<HoleInfo | null>(null);
  const [gasExpanded, setGasExpanded] = useState(false);
  const [step2Quiz, setStep2Quiz] = useState({ q1: '', q2: '', q3: '' });
  const [step2Submitted, setStep2Submitted] = useState(false);
  const [step2Passed, setStep2Passed] = useState(false);
  // Step 3
  const [step3Ex1, setStep3Ex1] = useState<'none' | 'success' | 'fail'>('none');
  const [step3Ex2, setStep3Ex2] = useState<'none' | 'success' | 'fail'>('none');
  const [step3Ex3, setStep3Ex3] = useState('');
  const [step3ClickedHoleId, setStep3ClickedHoleId] = useState<string | null>(null);
  // Step 4
  const [draggedSlots, setDraggedSlots] = useState<{ fond: string; colonne: string; bourrage: string }>({
    fond: '',
    colonne: '',
    bourrage: ''
  });
  const [step4OrderError, setStep4OrderError] = useState(false);
  const [step4OrderSuccess, setStep4OrderSuccess] = useState(false);
  const [step4SliderVal, setStep4SliderVal] = useState(60); // 60cm
  const [step4Formula, setStep4Formula] = useState('');
  // Step 5
  const [step5Sequence, setStep5Sequence] = useState<string[]>([
    "Groupe d'Élargissement 2 (50ms)",
    "Bouchon central (0ms)",
    "Groupe d'Élargissement 4 (100ms)",
    "Tir de Découpe / Finition (125ms)",
    "Groupe d'Élargissement 1 (25ms)",
    "Groupe d'Élargissement 3 (75ms)"
  ]);
  const [step5SequenceSuccess, setStep5SequenceSuccess] = useState(false);
  const [step5SequenceSubmitted, setStep5SequenceSubmitted] = useState(false);
  const [step5Q, setStep5Q] = useState('');
  // Step 6
  const [step6RowClicked, setStep6RowClicked] = useState(false);
  const [step6Q1, setStep6Q1] = useState('');
  const [step6Q2, setStep6Q2] = useState('');
  // Step 7
  const [step7Checklist, setStep7Checklist] = useState({
    alignment: 'CONFORME',
    depth: 'CONFORME',
    tamping: 'CONFORME',
    tovex: 'CONFORME',
    sequence: 'CONFORME'
  });
  const [step7Incoherence, setStep7Incoherence] = useState(true);
  const [step7Q, setStep7Q] = useState('');
  // Step 8
  const [step8Form, setStep8Form] = useState({
    sector: 'Imiter 1',
    shift: 'Poste 1',
    planned: '1.7',
    real: '0.6',
    cause: 'Taillant cassé',
    status: 'Justifié',
    comment: ''
  });
  const [step8Submitted, setStep8Submitted] = useState(false);
  const [step8Q, setStep8Q] = useState('');
  // Step 9 (EXAMEN FINAL)
  const [step9Data, setStep9Data] = useState({
    planned: '1.7',
    real: '0.9',
    buckets: '',
    gasoil: '',
    checklistTamping: 'CONFORME',
    failedBlastCause: '',
    failedBlastComment: '',
    isSubmitted: false,
    errorMessage: '',
    isPassed: false,
    userName: ''
  });

  // Confetti effect canvas ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Auto-scrolling to top of content on step change
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

  // Effect for Confetti on Step 9 Complete
  useEffect(() => {
    if (certificateEarned && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      let animationFrameId: number;
      const particles: Array<{
        x: number;
        y: number;
        r: number;
        d: number;
        color: string;
        tilt: number;
        tiltAngleIncremental: number;
        tiltAngle: number;
      }> = [];

      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;

      const colors = ['#b8860b', '#ffd700', '#22c55e', '#3b82f6', '#ec4899', '#a855f7'];

      for (let i = 0; i < 150; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height - canvas.height,
          r: Math.random() * 6 + 4,
          d: Math.random() * canvas.height,
          color: colors[Math.floor(Math.random() * colors.length)],
          tilt: Math.random() * 10 - 5,
          tiltAngleIncremental: Math.random() * 0.07 + 0.02,
          tiltAngle: 0
        });
      }

      const draw = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        particles.forEach((p, index) => {
          p.tiltAngle += p.tiltAngleIncremental;
          p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2;
          p.x += Math.sin(p.tiltAngle);
          p.tilt = Math.sin(p.tiltAngle - index / 3) * 15;

          if (p.y > canvas.height) {
            particles[index] = {
              ...p,
              x: Math.random() * canvas.width,
              y: -20,
              tilt: Math.random() * 10 - 5
            };
          }

          ctx.beginPath();
          ctx.lineWidth = p.r;
          ctx.strokeStyle = p.color;
          ctx.moveTo(p.x + p.tilt + p.r / 2, p.y);
          ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2);
          ctx.stroke();
        });

        animationFrameId = requestAnimationFrame(draw);
      };

      draw();

      const handleResize = () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
      };
      window.addEventListener('resize', handleResize);

      return () => {
        cancelAnimationFrame(animationFrameId);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [certificateEarned]);

  // Validation Check per Step
  const isStepValid = (): boolean => {
    switch (currentStep) {
      case 1:
        return step1Started;
      case 2:
        return step2Passed;
      case 3:
        return step3Ex1 === 'success' && step3Ex2 === 'success' && step3Ex3 === '1.7';
      case 4:
        return step4OrderSuccess && step4SliderVal === 76 && step4Formula === '20';
      case 5:
        return step5SequenceSuccess && step5Q === '75';
      case 6:
        return step6RowClicked && step6Q1 === '1.7' && step6Q2 === '40';
      case 7:
        return !step7Incoherence && step7Checklist.tamping === 'NON CONFORME' && step7Q === 'sec';
      case 8:
        return step8Submitted && step8Q === 'side';
      case 9:
        return step9Data.isPassed || certificateEarned;
      default:
        return false;
    }
  };

  // Check Step 2 Quiz Answers
  const handleStep2Submit = () => {
    setStep2Submitted(true);
    const correct1 = step2Quiz.q1 === '38';
    const correct2 = step2Quiz.q2 === 'expansion';
    const correct3 = step2Quiz.q3 === '38';
    const allCorrect = correct1 && correct2 && correct3;
    setStep2Passed(allCorrect);
  };

  const handleStep2Reset = () => {
    setStep2Quiz({ q1: '', q2: '', q3: '' });
    setStep2Submitted(false);
    setStep2Passed(false);
  };

  // Step 4 drag-and-drop / click handler
  const assignSlot = (slot: 'fond' | 'colonne' | 'bourrage', value: string) => {
    setDraggedSlots(prev => ({ ...prev, [slot]: value }));
  };

  const handleStep4VerifyOrder = () => {
    setStep4OrderError(false);
    setStep4OrderSuccess(false);
    if (draggedSlots.fond === 'Tovex' && draggedSlots.colonne === 'ANFO' && draggedSlots.bourrage === 'Bourrage d\'argile') {
      setStep4OrderSuccess(true);
    } else {
      setStep4OrderError(true);
    }
  };

  // Step 5 Reorder actions
  const moveSequenceItem = (index: number, direction: 'up' | 'down') => {
    const newSeq = [...step5Sequence];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx >= 0 && targetIdx < newSeq.length) {
      const temp = newSeq[index];
      newSeq[index] = newSeq[targetIdx];
      newSeq[targetIdx] = temp;
      setStep5Sequence(newSeq);
    }
  };

  const handleStep5VerifyOrder = () => {
    setStep5SequenceSubmitted(true);
    const correctOrder = [
      "Bouchon central (0ms)",
      "Groupe d'Élargissement 1 (25ms)",
      "Groupe d'Élargissement 2 (50ms)",
      "Groupe d'Élargissement 3 (75ms)",
      "Groupe d'Élargissement 4 (100ms)",
      "Tir de Découpe / Finition (125ms)"
    ];
    const isMatched = step5Sequence.every((val, idx) => val === correctOrder[idx]);
    setStep5SequenceSuccess(isMatched);
  };

  // Step 7 checklist handler
  const handleStep7Toggle = (key: keyof typeof step7Checklist, val: string) => {
    const updated = { ...step7Checklist, [key]: val };
    setStep7Checklist(updated);
    
    // If everything is CONFORME, trigger incoherence
    const allConforme = Object.values(updated).every(v => v === 'CONFORME');
    if (allConforme) {
      setStep7Incoherence(true);
    } else if (updated.tamping === 'NON CONFORME' && updated.alignment === 'CONFORME' && updated.depth === 'CONFORME' && updated.tovex === 'CONFORME' && updated.sequence === 'CONFORME') {
      setStep7Incoherence(false);
    } else {
      setStep7Incoherence(true);
    }
  };

  // Step 8 Form Submit
  const handleStep8Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step8Form.comment.trim().length < 10) {
      alert("Le commentaire doit faire au moins 10 caractères.");
      return;
    }
    setStep8Submitted(true);
  };

  // Step 9 Submit Examen
  const handleStep9Submit = () => {
    const d = step9Data;
    if (!d.userName.trim()) {
      setStep9Data(prev => ({ ...prev, errorMessage: "Veuillez saisir votre Nom complet pour le certificat." }));
      return;
    }
    if (d.real !== '0.9') {
      setStep9Data(prev => ({ ...prev, errorMessage: "Erreur de saisie de l'avancement miné réel. Il doit être de 0.9m pour ce chantier." }));
      return;
    }
    if (d.buckets !== '45' || d.gasoil !== '35') {
      setStep9Data(prev => ({ ...prev, errorMessage: "Erreur dans les valeurs LHD du suivi du réel (45 godets et 35L de gasoil requis)." }));
      return;
    }
    if (d.checklistTamping !== 'NON CONFORME') {
      setStep9Data(prev => ({ ...prev, errorMessage: "Incohérence checklist : Le bourrage d'argile n'étant pas fait correctement, il doit être NON CONFORME." }));
      return;
    }
    if (d.failedBlastCause !== 'Bourrage insuffisant' && d.failedBlastCause !== 'Taillant cassé') {
      setStep9Data(prev => ({ ...prev, errorMessage: "Veuillez enregistrer la volée ratée avec la cause appropriée ('Bourrage insuffisant')." }));
      return;
    }
    if (d.failedBlastComment.trim().length < 10) {
      setStep9Data(prev => ({ ...prev, errorMessage: "Le commentaire de volée ratée doit comporter au moins 10 caractères." }));
      return;
    }

    // Success!
    setStep9Data(prev => ({ ...prev, isPassed: true, errorMessage: '' }));
    markStepComplete(9);
    saveProgress({
      currentStep: 9,
      completedSteps: [1, 2, 3, 4, 5, 6, 7, 8, 9],
      certificateEarned: true
    });
  };

  // Helper colors for holes
  const getHoleColor = (type: string) => {
    switch (type) {
      case 'vide': return '#94a3b8'; // gray
      case 'charge': return '#eab308'; // yellow
      case 'g1': return '#3b82f6'; // blue
      case 'g2': return '#ef4444'; // red
      case 'g3': return '#06b6d4'; // cyan
      case 'g4': return '#f97316'; // orange
      case 'radier': return '#a855f7'; // purple
      case 'parement': return '#14b8a6'; // teal
      case 'voute': return '#ec4899'; // pink
      default: return '#cccccc';
    }
  };

  const currentStepTitle = [
    "",
    "Bienvenue dans la famille SMI Imiter",
    "Le Gabarit 12m² — Le Standard SMI",
    "Forer Correctement — La Clé du Métrage",
    "Bourrer Correctement — Le Secret de l'Énergie",
    "La Séquence de Détonation — L'Ordre Parfait",
    "Lire et Comprendre les KPIs",
    "La Check-list de Validation",
    "Gérer les Volées Ratées",
    "Examen Final — Devenez Secrétaire Qualifié SMI"
  ][currentStep];

  return (
    <div className="min-h-screen bg-[#F5F5F0] text-[#141414] py-8 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      
      {/* Confetti Overlay Canvas */}
      {certificateEarned && (
        <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-50 w-full h-full" />
      )}

      {/* Main Container */}
      <div className="max-w-6xl mx-auto">
        
        {/* Header Block */}
        <div className="mb-8 bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-[#b8860b] flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5" />
              Académie de Formation SCM • HydroMines
            </span>
            <h1 className="text-2xl font-black uppercase tracking-wider text-slate-900 mt-1">
              Module d'Habilitation Secrétaire de Chantier
            </h1>
            <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-0.5">
              Devenez un maillon essentiel de la traçabilité et de la performance minière
            </p>
          </div>
          <div className="flex gap-2.5 items-center">
            {certificateEarned && (
              <span className="bg-emerald-100 text-emerald-800 border border-emerald-300 text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full flex items-center gap-1 shadow-xs">
                <Trophy className="w-3.5 h-3.5 text-amber-500" /> Habilité SMI
              </span>
            )}
            <button 
              onClick={handleResetProgress}
              className="px-3 py-1.5 bg-slate-100 border border-slate-200 hover:bg-slate-200 text-slate-600 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all"
            >
              Réinitialiser
            </button>
          </div>
        </div>

        {/* Permanent 9-Step Progress Bar */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs mb-8">
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-black uppercase tracking-wider mb-3 px-1">
            <span>Progression du cursus</span>
            <span className="text-[#b8860b]">Étape {currentStep} sur 9</span>
          </div>

          <div className="grid grid-cols-9 gap-2">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((stepNum) => {
              const isActive = currentStep === stepNum;
              const isCompleted = completedSteps.includes(stepNum);
              const maxUnlocked = Math.max(1, ...completedSteps) + 1;
              const isUnlocked = stepNum <= maxUnlocked || completedSteps.includes(stepNum);

              let barColor = "bg-slate-200";
              if (isActive) barColor = "bg-[#b8860b]";
              else if (isCompleted) barColor = "bg-emerald-500 animate-pulse";

              return (
                <button
                  key={stepNum}
                  onClick={() => handleStepClick(stepNum)}
                  disabled={!isUnlocked}
                  className={`group relative text-center flex flex-col items-center gap-2 focus:outline-none focus:ring-0 ${
                    isUnlocked ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                  }`}
                >
                  {/* Visual Circle Indicator */}
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black transition-all ${
                    isActive 
                      ? 'bg-[#b8860b] text-white ring-4 ring-[#b8860b]/20 scale-110' 
                      : isCompleted 
                        ? 'bg-emerald-500 text-white' 
                        : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                  }`}>
                    {isCompleted ? <Check className="w-3.5 h-3.5" /> : stepNum}
                  </div>
                  {/* Segment Line */}
                  <div className={`w-full h-1.5 rounded-full ${barColor} transition-colors`} />
                  <span className="hidden md:block text-[8px] font-bold uppercase tracking-widest text-slate-400 group-hover:text-slate-950 truncate max-w-full">
                    Étape {stepNum}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Interactive Workspace Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Main workspace (left/mid) */}
          <div className="lg:col-span-8 space-y-6">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                transition={{ duration: 0.25 }}
                className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6"
              >
                {/* Step Header */}
                <div className="border-b border-slate-100 pb-5">
                  <div className="flex items-center gap-2">
                    <span className="bg-[#b8860b]/10 text-[#b8860b] text-[9px] font-black uppercase tracking-widest px-2.5 py-1 rounded-md border border-[#b8860b]/15">
                      Étape {currentStep} • SCM Académie
                    </span>
                  </div>
                  <h2 className="text-xl font-black uppercase tracking-wider text-slate-900 mt-3">
                    {currentStepTitle}
                  </h2>
                </div>

                {/* --- RENDERING OF STEP CONTENTS --- */}

                {/* STEP 1 */}
                {currentStep === 1 && (
                  <div className="space-y-6">
                    <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                      Bienvenue au sein du groupe <strong>Société Métallurgique d'Imiter (SMI)</strong>. 
                      Ici, la traçabilité des cycles d'abattage de la roche est essentielle pour la sécurité de nos mineurs, la productivité et la pureté de l'argent extrait.
                    </p>

                    {/* Interactive Sectors Map */}
                    <div className="space-y-3">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-[#b8860b] flex items-center gap-1">
                        <Map className="w-3.5 h-3.5" /> Secteurs Opérationnels d'Imiter (Cliquez pour explorer)
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        <div className="bg-blue-50/50 hover:bg-blue-50 border border-blue-200 rounded-xl p-3.5 text-center cursor-pointer transition-all">
                          <div className="w-2 h-2 rounded-full bg-blue-500 mx-auto mb-2" />
                          <h5 className="text-[10px] font-black uppercase tracking-wider text-blue-900">Imiter 1</h5>
                          <p className="text-[9px] text-blue-600 font-bold uppercase mt-1">Production active</p>
                        </div>
                        <div className="bg-emerald-50/50 hover:bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 text-center cursor-pointer transition-all">
                          <div className="w-2 h-2 rounded-full bg-emerald-500 mx-auto mb-2" />
                          <h5 className="text-[10px] font-black uppercase tracking-wider text-emerald-900">Imiter 2</h5>
                          <p className="text-[9px] text-emerald-600 font-bold uppercase mt-1">Zone mécanisée</p>
                        </div>
                        <div className="bg-orange-50/50 hover:bg-orange-50 border border-orange-200 rounded-xl p-3.5 text-center cursor-pointer transition-all">
                          <div className="w-2 h-2 rounded-full bg-orange-500 mx-auto mb-2" />
                          <h5 className="text-[10px] font-black uppercase tracking-wider text-orange-900">Imiter Est</h5>
                          <p className="text-[9px] text-orange-600 font-bold uppercase mt-1">Nouveau front</p>
                        </div>
                        <div className="bg-rose-50/50 hover:bg-rose-50 border border-rose-200 rounded-xl p-3.5 text-center cursor-pointer transition-all">
                          <div className="w-2 h-2 rounded-full bg-rose-500 mx-auto mb-2" />
                          <h5 className="text-[10px] font-black uppercase tracking-wider text-rose-900">Bure Imiter Est</h5>
                          <p className="text-[9px] text-rose-600 font-bold uppercase mt-1">Extraction uniquement</p>
                        </div>
                      </div>
                    </div>

                    {/* Mining cycle in 5 steps */}
                    <div className="space-y-3 pt-2">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-[#b8860b] flex items-center gap-1">
                        <Activity className="w-3.5 h-3.5" /> Le Cycle de Production Souterraine (Horizontal)
                      </h4>
                      
                      <div className="grid grid-cols-5 gap-2 bg-slate-50 border border-slate-100 rounded-2xl p-4 overflow-x-auto min-w-[500px]">
                        <div className="text-center space-y-1.5">
                          <div className="w-8 h-8 rounded-full bg-amber-100 text-[#b8860b] flex items-center justify-center mx-auto">
                            <Wrench className="w-4 h-4" />
                          </div>
                          <h6 className="text-[9px] font-black uppercase tracking-wider">1. Forage</h6>
                          <p className="text-[8px] text-slate-500 leading-tight">Forage précis selon le plan de tir 12m².</p>
                        </div>
                        <div className="text-center space-y-1.5">
                          <div className="w-8 h-8 rounded-full bg-amber-100 text-[#b8860b] flex items-center justify-center mx-auto">
                            <Flame className="w-4 h-4" />
                          </div>
                          <h6 className="text-[9px] font-black uppercase tracking-wider">2. Chargement</h6>
                          <p className="text-[8px] text-slate-500 leading-tight">Remplissage d'ANFO et amorces Tovex.</p>
                        </div>
                        <div className="text-center space-y-1.5">
                          <div className="w-8 h-8 rounded-full bg-amber-100 text-[#b8860b] flex items-center justify-center mx-auto">
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <h6 className="text-[9px] font-black uppercase tracking-wider">3. Tir</h6>
                          <p className="text-[8px] text-slate-500 leading-tight">Détonation milliseconde minutée.</p>
                        </div>
                        <div className="text-center space-y-1.5">
                          <div className="w-8 h-8 rounded-full bg-amber-100 text-[#b8860b] flex items-center justify-center mx-auto">
                            <Users className="w-4 h-4" />
                          </div>
                          <h6 className="text-[9px] font-black uppercase tracking-wider">4. Marinage</h6>
                          <p className="text-[8px] text-slate-500 leading-tight">Déblayage par chargeur articulé LHD.</p>
                        </div>
                        <div className="text-center space-y-1.5">
                          <div className="w-8 h-8 rounded-full bg-amber-100 text-[#b8860b] flex items-center justify-center mx-auto">
                            <Trophy className="w-4 h-4" />
                          </div>
                          <h6 className="text-[9px] font-black uppercase tracking-wider">5. Extraction</h6>
                          <p className="text-[8px] text-slate-500 leading-tight">Remontée des minerais nobles.</p>
                        </div>
                      </div>
                    </div>

                    {/* Role summary with high contrast representation */}
                    <div className="bg-[#b8860b]/5 border border-[#b8860b]/20 rounded-2xl p-5 flex items-start gap-4">
                      <div className="p-2.5 bg-[#b8860b]/10 rounded-xl text-[#b8860b] shrink-0 mt-0.5">
                        <HardHat className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">Votre Mission de Secrétaire de Chantier :</h4>
                        <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                          Vous n'êtes pas au fond de la mine, mais vous êtes <strong>le centre névralgique du contrôle technique</strong>. 
                          C'est vous qui saisissez les fiches d'avancement, vérifiez la conformité des tirs, comparez le planifié au réel, et signalez immédiatement les anomalies directionnelles (failed blasts). 
                          Sans votre rigueur de saisie, la direction pilote la mine à l'aveugle !
                        </p>
                      </div>
                    </div>

                    {/* Step Validation Button */}
                    <div className="pt-4 flex justify-end">
                      {!step1Started ? (
                        <button
                          onClick={() => {
                            setStep1Started(true);
                            markStepComplete(1);
                          }}
                          className="px-6 py-3 bg-[#b8860b] text-white hover:bg-[#9a7209] text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 shadow-xs cursor-pointer"
                        >
                          Commencer le parcours d'apprentissage <ArrowRight className="w-4 h-4" />
                        </button>
                      ) : (
                        <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-wider bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-xl">
                          <CheckCircle className="w-4 h-4" /> Étape 1 validée. Cliquez sur "Valider et continuer" à droite !
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* STEP 2 */}
                {currentStep === 2 && (
                  <div className="space-y-6">
                    <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                      La galerie de <strong>12m²</strong> est la section standard des galeries principales de la SMI. 
                      Elle comporte un patron géométrique réglementaire rigoureux de <strong>38 trous</strong> de forage d'un diamètre de <strong>38mm</strong>.
                    </p>

                    {/* 12m2 Interactive SVG Schema */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black uppercase tracking-widest text-[#b8860b]">
                          Schéma interactif du front de taille (12m²)
                        </span>
                        <button
                          onClick={() => setGasExpanded(!gasExpanded)}
                          className={`px-3 py-1 text-[9px] font-black uppercase tracking-wider rounded-lg border transition-all ${
                            gasExpanded 
                              ? 'bg-amber-100 border-amber-300 text-amber-800' 
                              : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                          }`}
                        >
                          {gasExpanded ? "Masquer la décompression" : "Simuler l'expansion des gaz"}
                        </button>
                      </div>

                      <div className="relative">
                        <svg viewBox="0 0 1000 700" className="w-full h-[400px] bg-slate-950 rounded-2xl border border-slate-800 shadow-inner">
                          {/* Inner rock area background overlay */}
                          <path d="M 125 570 L 125 330 A 375 375 0 0 1 875 330 L 875 570 Z" fill="#1e293b" opacity="0.4" />
                          <path d="M 125 570 L 125 330 A 375 375 0 0 1 875 330 L 875 570 Z" fill="none" stroke="#475569" strokeWidth="4" strokeDasharray="6,4" />
                          
                          {/* Shockwave gas expansion visual animation */}
                          {gasExpanded && (
                            <g>
                              <circle cx="500" cy="430" r="140" fill="url(#shockwave)" opacity="0.35">
                                <animate attributeName="r" values="30;160;30" dur="2.5s" repeatCount="indefinite" />
                              </circle>
                              {/* Arrows pointing to the empty holes */}
                              <path d="M 470 430 Q 485 430 495 430" stroke="#f59e0b" strokeWidth="3" markerEnd="url(#arrow)" fill="none" />
                              <path d="M 530 430 Q 515 430 505 430" stroke="#f59e0b" strokeWidth="3" markerEnd="url(#arrow)" fill="none" />
                            </g>
                          )}

                          <defs>
                            <radialGradient id="shockwave">
                              <stop offset="0%" stopColor="#ef4444" />
                              <stop offset="50%" stopColor="#f59e0b" />
                              <stop offset="100%" stopColor="transparent" />
                            </radialGradient>
                            <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                              <path d="M 0 0 L 10 5 L 0 10 z" fill="#f59e0b" />
                            </marker>
                          </defs>

                          {/* Render all 38 holes */}
                          {HOLES_DATA.map((hole) => {
                            const isHovered = hoveredHole?.id === hole.id;
                            const isVide = hole.type === 'vide';

                            return (
                              <g 
                                key={hole.id}
                                onMouseEnter={() => setHoveredHole(hole)}
                                onMouseLeave={() => setHoveredHole(null)}
                                className="cursor-pointer"
                              >
                                {/* Glow if hovered */}
                                {isHovered && (
                                  <circle cx={hole.x} cy={hole.y} r="22" fill="white" opacity="0.2" />
                                )}
                                
                                <circle 
                                  cx={hole.x} 
                                  cy={hole.y} 
                                  r={isVide ? "14" : "12"} 
                                  fill={isVide ? 'none' : getHoleColor(hole.type)} 
                                  stroke={isVide ? '#ffffff' : '#1e293b'} 
                                  strokeWidth="3"
                                />

                                {isVide && (
                                  <circle cx={hole.x} cy={hole.y} r="6" fill="#ffffff" />
                                )}

                                <text 
                                  x={hole.x} 
                                  y={hole.y + 4} 
                                  textAnchor="middle" 
                                  fill={isVide ? '#0f172a' : '#ffffff'} 
                                  className="text-[9px] font-black select-none pointer-events-none"
                                >
                                  {hole.label}
                                </text>
                              </g>
                            );
                          })}
                        </svg>

                        {/* Interactive Tooltip Card */}
                        {hoveredHole ? (
                          <div className="absolute bottom-4 left-4 right-4 bg-slate-900 border border-slate-700/80 rounded-2xl p-4 text-white shadow-xl flex items-center gap-4 transition-all animate-in fade-in duration-150">
                            <div className="w-4 h-4 rounded-full shrink-0" style={{ backgroundColor: getHoleColor(hoveredHole.type) }} />
                            <div>
                              <h5 className="text-xs font-black uppercase tracking-wider text-amber-400">
                                {hoveredHole.name} ({hoveredHole.type.toUpperCase()})
                              </h5>
                              <p className="text-[10px] text-slate-300 mt-0.5 font-semibold">
                                {hoveredHole.desc} • Délai de tir : {hoveredHole.delay} ms
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="absolute bottom-4 left-4 right-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-3 text-center text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                            Survolez un trou de forage pour voir son rôle technique
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Step Explanation Text */}
                    <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h5 className="text-[10px] font-black uppercase tracking-widest text-[#b8860b]">
                          Pourquoi 3 vides de décharge ?
                        </h5>
                        <p className="text-[10.5px] text-slate-600 mt-1 leading-relaxed">
                          Les <strong>3 trous vides centraux</strong> ne contiennent aucun explosif. 
                          Ils offrent l'unique volume d'expansion libre initial vers lequel la roche des trous chargés voisins se dilate. 
                          Sans ces 3 trous d'expansion vides, la roche resterait coincée, le tir ferait "coup manqué" et la galerie n'avancerait pas.
                        </p>
                      </div>
                      <div>
                        <h5 className="text-[10px] font-black uppercase tracking-widest text-emerald-600">
                          Pourquoi 35 chargés ?
                        </h5>
                        <p className="text-[10.5px] text-slate-600 mt-1 leading-relaxed">
                          Les <strong>35 trous restants</strong> reçoivent la dynamite (Tovex) et le nitrate (ANFO). 
                          Ils explosent de façon très séquencée (de 0ms à 125ms) pour cisailler, briser, broyer la roche et l'éjecter de manière ordonnée et optimale.
                        </p>
                      </div>
                    </div>

                    {/* Quiz Section */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-2xs">
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-2.5">
                        <HelpCircle className="w-4 h-4 text-[#b8860b]" /> Quiz d'Habilitation : Gabarit 12m²
                      </h4>

                      {/* Question 1 */}
                      <div className="space-y-2">
                        <p className="text-[11px] font-black uppercase tracking-wide text-slate-700">
                          Q1 : Combien de trous de forage totaux comporte une galerie réglementaire de 12m² ?
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {['28', '35', '38', '42'].map(opt => (
                            <label 
                              key={opt}
                              className={`p-3 border rounded-xl flex items-center gap-2 cursor-pointer transition-colors text-[11px] font-bold uppercase ${
                                step2Quiz.q1 === opt 
                                  ? 'bg-[#b8860b]/10 border-[#b8860b] text-[#b8860b]' 
                                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              <input 
                                type="radio" 
                                name="q1" 
                                value={opt} 
                                checked={step2Quiz.q1 === opt}
                                onChange={(e) => setStep2Quiz(prev => ({ ...prev, q1: e.target.value }))}
                                disabled={step2Submitted && step2Passed}
                                className="accent-[#b8860b]"
                              />
                              {opt} trous
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Question 2 */}
                      <div className="space-y-2 pt-2">
                        <p className="text-[11px] font-black uppercase tracking-wide text-slate-700">
                          Q2 : Quelle est la fonction obligatoire des 3 trous de forage laissés vides ?
                        </p>
                        <div className="space-y-2">
                          {[
                            { val: 'eco', label: 'Économiser la dynamite et réduire le budget d\'explosifs' },
                            { val: 'expansion', label: 'Offrir un vide d\'expansion pour que la roche se décomprime et se brise' },
                            { val: 'vent', label: 'Améliorer le flux de ventilation et dissiper les gaz toxiques' },
                            { val: 'topo', label: 'Repères topographiques indispensables pour guider le laser du Jumbo' }
                          ].map(item => (
                            <label 
                              key={item.val}
                              className={`p-3 border rounded-xl flex items-center gap-3.5 cursor-pointer transition-colors text-[10.5px] font-semibold ${
                                step2Quiz.q2 === item.val 
                                  ? 'bg-[#b8860b]/10 border-[#b8860b] text-[#b8860b]' 
                                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              <input 
                                type="radio" 
                                name="q2" 
                                value={item.val} 
                                checked={step2Quiz.q2 === item.val}
                                onChange={(e) => setStep2Quiz(prev => ({ ...prev, q2: e.target.value }))}
                                disabled={step2Submitted && step2Passed}
                                className="accent-[#b8860b]"
                              />
                              {item.label}
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Question 3 */}
                      <div className="space-y-2 pt-2">
                        <p className="text-[11px] font-black uppercase tracking-wide text-slate-700">
                          Q3 : Quel est le diamètre réglementaire du taillant de forage (mèche) utilisé à la SMI ?
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {['32', '38', '42', '50'].map(opt => (
                            <label 
                              key={opt}
                              className={`p-3 border rounded-xl flex items-center gap-2 cursor-pointer transition-colors text-[11px] font-bold uppercase ${
                                step2Quiz.q3 === opt 
                                  ? 'bg-[#b8860b]/10 border-[#b8860b] text-[#b8860b]' 
                                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              <input 
                                type="radio" 
                                name="q3" 
                                value={opt} 
                                checked={step2Quiz.q3 === opt}
                                onChange={(e) => setStep2Quiz(prev => ({ ...prev, q3: e.target.value }))}
                                disabled={step2Submitted && step2Passed}
                                className="accent-[#b8860b]"
                              />
                              {opt} mm
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Feedback & Actions */}
                      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-4">
                        {step2Submitted && (
                          <div className={`p-3.5 rounded-xl border text-[11px] font-semibold flex-1 ${
                            step2Passed 
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                              : 'bg-rose-50 border-rose-200 text-rose-800'
                          }`}>
                            {step2Passed ? (
                              <p className="flex items-center gap-1.5 uppercase font-black tracking-wider">
                                <CheckCircle className="w-4 h-4 shrink-0" /> Félicitations ! 3/3 réponses correctes.
                              </p>
                            ) : (
                              <div>
                                <p className="font-black uppercase tracking-wider">❌ Échec : Réponses incorrectes.</p>
                                <p className="text-[10px] text-rose-600 font-bold mt-0.5 uppercase tracking-wide">
                                  Pour rappel : une galerie 12m² comporte 38 trous de 38mm. Les 3 trous vides servent exclusivement au vide d'expansion de la roche. Réessayez !
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex gap-2">
                          {!step2Passed ? (
                            <button
                              onClick={handleStep2Submit}
                              disabled={!step2Quiz.q1 || !step2Quiz.q2 || !step2Quiz.q3}
                              className="px-5 py-3 bg-[#b8860b] disabled:bg-slate-200 disabled:text-slate-400 text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-[#9a7209] transition-all cursor-pointer"
                            >
                              Valider les réponses
                            </button>
                          ) : (
                            <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-wider bg-emerald-50 border border-emerald-200 px-4 py-2.5 rounded-xl">
                              <CheckCircle className="w-4 h-4" /> Validé
                            </div>
                          )}

                          {step2Submitted && !step2Passed && (
                            <button
                              onClick={handleStep2Reset}
                              className="p-3 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl transition-all text-slate-700"
                              title="Recommencer"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 3 */}
                {currentStep === 3 && (
                  <div className="space-y-6">
                    <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                      Forer correctement est indispensable. Un mauvais parallélisme des trous ou un mauvais alignement provoque des <strong>pertes de métrage considérables (culots de trous importants)</strong>.
                    </p>

                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 space-y-3">
                      <h4 className="text-[11px] font-black uppercase tracking-wider text-[#b8860b] flex items-center gap-1.5">
                        <Compass className="w-4 h-4" /> Atelier Pratique de Forage Interactif
                      </h4>
                      <p className="text-[10.5px] text-slate-600 font-bold uppercase tracking-wide">
                        Complétez les 3 exercices de pointage ci-dessous pour valider l'étape :
                      </p>

                      {/* Ex 1 */}
                      <div className="bg-white rounded-xl p-3.5 border border-slate-100 space-y-2">
                        <span className="text-[9px] font-black uppercase tracking-widest bg-slate-900 text-amber-400 px-2 py-0.5 rounded-md">
                          Exercice 1
                        </span>
                        <p className="text-[11px] font-black text-slate-700 uppercase tracking-wide">
                          Montre-moi sur le schéma ci-dessous où on doit forer en premier ?
                        </p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                          (Indice : On commence toujours par le Bouchon pour créer un vide d'expansion !)
                        </p>
                        {step3Ex1 !== 'none' && (
                          <div className={`p-2 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                            step3Ex1 === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-rose-50 text-rose-800 border border-rose-100'
                          }`}>
                            {step3Ex1 === 'success' 
                              ? "✅ Exact ! On commence impérativement par forer le Bouchon Central pour décompresser le massif rocheux." 
                              : "❌ Non ! Commencer par les parements ou la voûte n'aurait aucun espace d'expansion, causant un échec de tir."}
                          </div>
                        )}
                      </div>

                      {/* Ex 2 */}
                      <div className="bg-white rounded-xl p-3.5 border border-slate-100 space-y-2">
                        <span className="text-[9px] font-black uppercase tracking-widest bg-slate-900 text-[#3b82f6] px-2 py-0.5 rounded-md">
                          Exercice 2
                        </span>
                        <p className="text-[11px] font-black text-slate-700 uppercase tracking-wide">
                          Trouvez et cliquez sur n'importe quel trou du Groupe d'Élargissement 3 (Délai : 75ms)
                        </p>
                        {step3Ex2 !== 'none' && (
                          <div className={`p-2 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                            step3Ex2 === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-rose-50 text-rose-800 border border-rose-100'
                          }`}>
                            {step3Ex2 === 'success' 
                              ? "✅ Parfait ! Vous avez bien cliqué sur un trou d'élargissement G3 (75ms) de couleur cyan." 
                              : `❌ Non ! Ce trou appartient au groupe de type: ${step3ClickedHoleId}. Cherchez les trous cyan (Légende 3).`}
                          </div>
                        )}
                      </div>

                      {/* Ex 3 */}
                      <div className="bg-white rounded-xl p-3.5 border border-slate-100 space-y-3">
                        <span className="text-[9px] font-black uppercase tracking-widest bg-slate-900 text-white px-2 py-0.5 rounded-md">
                          Exercice 3
                        </span>
                        <p className="text-[11px] font-black text-slate-700 uppercase tracking-wide">
                          Quelle est l'avancement théorique (métrage) maximum que l'on obtient en forant avec une tige de forage de 1.8m ?
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {['1.5', '1.7', '1.8', '2.0'].map(val => (
                            <button
                              key={val}
                              onClick={() => setStep3Ex3(val)}
                              className={`p-2 rounded-xl text-[11px] font-black uppercase tracking-widest border transition-all ${
                                step3Ex3 === val 
                                  ? 'bg-[#b8860b] border-[#b8860b] text-white' 
                                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              {val} m
                            </button>
                          ))}
                        </div>
                        {step3Ex3 && (
                          <div className={`p-2 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                            step3Ex3 === '1.7' ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-rose-50 text-rose-800 border border-rose-100'
                          }`}>
                            {step3Ex3 === '1.7' 
                              ? "✅ Correct ! Avec une tige de 1.8m, on perd toujours environ 10cm en fond de trou, l'avancement optimal réel est donc de 1.7m." 
                              : "❌ Incorrect. Pour une tige de 1.8m, la valeur d'avancement planifiée SMI réglementaire est de 1.7m."}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* SVG Map of Holes for Exercise Pointing */}
                    <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-xs relative">
                      <div className="bg-slate-900 p-2.5 text-white flex justify-between text-[9px] font-black uppercase tracking-widest">
                        <span>Pointez directement les trous de la galerie :</span>
                        <span className="text-[#b8860b]">Front de taille interactif 12m²</span>
                      </div>
                      
                      <svg viewBox="0 0 1000 700" className="w-full h-[320px] bg-slate-950">
                        {/* Interactive holes for clicking */}
                        {HOLES_DATA.map((hole) => {
                          const isBouchon = hole.type === 'vide' || hole.type === 'charge';
                          const isG3 = hole.type === 'g3';

                          return (
                            <g 
                              key={hole.id}
                              onClick={() => {
                                // Ex 1 click
                                if (step3Ex1 !== 'success') {
                                  if (isBouchon) {
                                    setStep3Ex1('success');
                                  } else {
                                    setStep3Ex1('fail');
                                  }
                                }
                                // Ex 2 click
                                else if (step3Ex2 !== 'success') {
                                  if (isG3) {
                                    setStep3Ex2('success');
                                  } else {
                                    setStep3Ex2('fail');
                                    setStep3ClickedHoleId(hole.type);
                                  }
                                }
                              }}
                              className="cursor-pointer group"
                            >
                              <circle 
                                cx={hole.x} 
                                cy={hole.y} 
                                r="16" 
                                fill={getHoleColor(hole.type)} 
                                className="transition-all opacity-85 group-hover:opacity-100 group-hover:scale-110"
                              />
                              <text 
                                x={hole.x} 
                                y={hole.y + 3} 
                                textAnchor="middle" 
                                fill="#ffffff" 
                                className="text-[8px] font-black select-none pointer-events-none"
                              >
                                {hole.label}
                              </text>
                            </g>
                          );
                        })}
                      </svg>
                      
                      <div className="absolute top-12 right-4 bg-slate-900/80 border border-slate-700/60 p-3 rounded-xl text-[9px] text-white font-bold uppercase tracking-wider space-y-1">
                        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-yellow-500" /> Bouchon central</div>
                        <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-cyan-500" /> Élargissement G3 (75ms)</div>
                      </div>
                    </div>

                    {/* Step Validation */}
                    {step3Ex1 === 'success' && step3Ex2 === 'success' && step3Ex3 === '1.7' && (
                      <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs font-black uppercase tracking-wider flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5" /> Parfait ! Les 3 ateliers pratiques de forage sont réussis. Vous pouvez continuer !
                      </div>
                    )}
                  </div>
                )}

                {/* STEP 4 */}
                {currentStep === 4 && (
                  <div className="space-y-6">
                    <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                      Le bourrage consiste à insérer l'explosif de fond (Tovex), l'explosif principal en colonne (ANFO), puis à refermer de façon étanche avec de l'argile compressée. 
                      <strong> Un bourrage insuffisant provoque un "coup soufflé"</strong> : l'énergie de l'explosion s'échappe vers l'extérieur sans casser la roche de fond.
                    </p>

                    {/* Interactive D&D / Click Ordering */}
                    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-4">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-[#b8860b] flex items-center gap-1.5">
                        <Sliders className="w-4 h-4" /> Exercice : Ordre de Bourrage d'un Trou de Mine
                      </h4>
                      <p className="text-[10.5px] text-slate-500 font-bold uppercase tracking-wide leading-relaxed">
                        Pour charger un trou de forage (du fond vers le col de sortie), attribuez les bons éléments aux 3 compartiments réglementaires :
                      </p>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
                        {/* Fond */}
                        <div className="bg-white border border-slate-200 rounded-xl p-3 text-center space-y-2">
                          <span className="text-[8px] font-black uppercase tracking-widest bg-slate-950 text-white px-2 py-0.5 rounded-md">
                            1. Fond de trou (Amorçage)
                          </span>
                          <select 
                            value={draggedSlots.fond}
                            onChange={(e) => assignSlot('fond', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-[10px] font-black uppercase tracking-wider focus:outline-none"
                          >
                            <option value="">-- Choisir --</option>
                            <option value="ANFO">ANFO (Nitrate)</option>
                            <option value="Tovex">Dynamite Tovex</option>
                            <option value="Bourrage d'argile">Bourrage d'argile</option>
                            <option value="Poche d'air">Poche d'air</option>
                          </select>
                        </div>

                        {/* Colonne */}
                        <div className="bg-white border border-slate-200 rounded-xl p-3 text-center space-y-2">
                          <span className="text-[8px] font-black uppercase tracking-widest bg-slate-950 text-white px-2 py-0.5 rounded-md">
                            2. Colonne de trou (Force)
                          </span>
                          <select 
                            value={draggedSlots.colonne}
                            onChange={(e) => assignSlot('colonne', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-[10px] font-black uppercase tracking-wider focus:outline-none"
                          >
                            <option value="">-- Choisir --</option>
                            <option value="ANFO">ANFO (Nitrate)</option>
                            <option value="Tovex">Dynamite Tovex</option>
                            <option value="Bourrage d'argile">Bourrage d'argile</option>
                            <option value="Poche d'air">Poche d'air</option>
                          </select>
                        </div>

                        {/* Bourrage */}
                        <div className="bg-white border border-slate-200 rounded-xl p-3 text-center space-y-2">
                          <span className="text-[8px] font-black uppercase tracking-widest bg-slate-950 text-white px-2 py-0.5 rounded-md">
                            3. Col de trou (Confinement)
                          </span>
                          <select 
                            value={draggedSlots.bourrage}
                            onChange={(e) => assignSlot('bourrage', e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-[10px] font-black uppercase tracking-wider focus:outline-none"
                          >
                            <option value="">-- Choisir --</option>
                            <option value="ANFO">ANFO (Nitrate)</option>
                            <option value="Tovex">Dynamite Tovex</option>
                            <option value="Bourrage d'argile">Bourrage d'argile</option>
                            <option value="Poche d'air">Poche d'air</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          onClick={handleStep4VerifyOrder}
                          className="px-4 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-wider rounded-xl hover:bg-slate-850"
                        >
                          Vérifier le chargement
                        </button>
                      </div>

                      {step4OrderError && (
                        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-[10px] font-bold uppercase tracking-wide">
                          ❌ Mauvaise séquence ! Le Tovex (dynamite dense) amorce le fond de trou, l'ANFO (nitrate) remplit la colonne, et l'argile compressée assure l'étanchéité au col. Réessayez !
                        </div>
                      )}
                      {step4OrderSuccess && (
                        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-[10px] font-bold uppercase tracking-wide">
                          ✅ Parfait ! Séquence de chargement réglementaire respectée.
                        </div>
                      )}
                    </div>

                    {/* Interactive Bourrage Slider Calculator */}
                    <div className="bg-slate-900 text-white rounded-2xl p-5 space-y-4">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-[#b8860b]">
                        Simulateur de Longueur de Bourrage
                      </h4>
                      <p className="text-[10.5px] text-slate-300 font-bold uppercase tracking-wider">
                        Ajustez la longueur de bourrage d'argile pour votre trou de forage de 1.8m (taillant 38mm) :
                      </p>

                      <div className="space-y-2">
                        <div className="flex justify-between text-[11px] font-bold">
                          <span>Longueur de Bourrage : <strong className="text-amber-400">{step4SliderVal} cm</strong></span>
                          <span>Norme SMI : 76 cm</span>
                        </div>
                        <input 
                          type="range" 
                          min="40" 
                          max="100" 
                          value={step4SliderVal}
                          onChange={(e) => setStep4SliderVal(parseInt(e.target.value))}
                          className="w-full accent-[#b8860b]"
                        />
                      </div>

                      {/* Resulting state display */}
                      {step4SliderVal === 76 ? (
                        <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 p-4 rounded-xl flex items-center gap-2">
                          <CheckCircle2 className="w-5 h-5" />
                          <div>
                            <span className="text-xs font-black uppercase tracking-wider">✅ BOURRAGE CONFORME !</span>
                            <p className="text-[10px] text-slate-300 mt-0.5">La pression des gaz est parfaitement confinée. Le rendement de tir sera optimal (1.7m d'avancement obtenu).</p>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-xl flex items-center gap-2">
                          <AlertTriangle className="w-5 h-5 shrink-0" />
                          <div>
                            <span className="text-xs font-black uppercase tracking-wider">❌ BOURRAGE NON CONFORME ({step4SliderVal}cm)</span>
                            <p className="text-[10px] text-slate-300 mt-0.5">
                              {step4SliderVal < 76 
                                ? "⚠️ COUP SOUFFLÉ ! Bourrage trop court. Perte estimée d'avancement de 0.48m." 
                                : "⚠️ Bourrage trop long ! Perte de charge explosive active en colonne, diminution du métrage."}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Question Formula */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
                      <p className="text-[11px] font-black uppercase text-slate-700 tracking-wide">
                        Quelle est la formule scientifique universelle réglementaire de la longueur de bourrage ?
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { val: '5', label: 'Lb = 5 × D_trou' },
                          { val: '10', label: 'Lb = 10 × D_trou' },
                          { val: '20', label: 'Lb = 20 × D_trou (76cm pour 38mm)' },
                          { val: '50', label: 'Lb = 50 × D_trou' }
                        ].map(item => (
                          <label 
                            key={item.val}
                            className={`p-3 border rounded-xl flex items-center gap-2.5 cursor-pointer text-[11px] font-black ${
                              step4Formula === item.val 
                                ? 'bg-[#b8860b]/10 border-[#b8860b] text-[#b8860b]' 
                                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                            }`}
                          >
                            <input 
                              type="radio" 
                              name="step4Formula" 
                              value={item.val}
                              checked={step4Formula === item.val}
                              onChange={(e) => setStep4Formula(e.target.value)}
                              className="accent-[#b8860b]"
                            />
                            {item.label}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 5 */}
                {currentStep === 5 && (
                  <div className="space-y-6">
                    <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                      L'explosion n'est jamais instantanée pour toute la galerie. Elle s'effectue par des <strong>intervalles de détonation ultra-précis en millisecondes (ms)</strong>. 
                      L'ordre parfait permet d'éjecter la roche centrale pour libérer de l'espace pour les tirs périphériques.
                    </p>

                    {/* Sequence CSS Loop Animation */}
                    <div className="bg-slate-900 text-white rounded-2xl p-5 space-y-4">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-[#b8860b]">
                        Visualisation de la Séquence de Tir SMI (Boucle continue)
                      </h4>
                      
                      <div className="flex flex-wrap items-center justify-center gap-3 py-4">
                        {[
                          { id: 1, label: 'Bouchon', ms: '0ms', color: '#eab308' },
                          { id: 2, label: 'G1 (Élargissement)', ms: '25ms', color: '#3b82f6' },
                          { id: 3, label: 'G2 (Élargissement)', ms: '50ms', color: '#ef4444' },
                          { id: 4, label: 'G3 (Élargissement)', ms: '75ms', color: '#06b6d4' },
                          { id: 5, label: 'G4 (Élargissement)', ms: '100ms', color: '#f97316' },
                          { id: 6, label: 'Finition (Radier/Voûte)', ms: '125ms', color: '#a855f7' }
                        ].map((grp) => (
                          <div key={grp.id} className="text-center bg-slate-800 border border-slate-700/60 p-3 rounded-xl min-w-[110px] space-y-1">
                            <span className="text-[14px] font-black" style={{ color: grp.color }}>
                              {grp.ms}
                            </span>
                            <div className="text-[9px] font-black uppercase tracking-wider text-slate-200">{grp.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Reordering Exercise with robust Up/Down Buttons */}
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-[#b8860b]">
                        Exercice : Remettre la séquence de tir dans l'ordre chronologique
                      </h4>
                      <p className="text-[10.5px] text-slate-500 font-bold uppercase tracking-wide">
                        Utilisez les flèches pour trier la séquence temporelle de 0ms à 125ms :
                      </p>

                      <div className="space-y-2">
                        {step5Sequence.map((val, idx) => (
                          <div 
                            key={val} 
                            className="bg-white border border-slate-200 rounded-xl p-3 flex items-center justify-between gap-4 shadow-3xs"
                          >
                            <div className="flex items-center gap-3">
                              <span className="w-5 h-5 rounded-full bg-slate-900 text-[#ffd700] text-[10px] font-black flex items-center justify-center">
                                {idx + 1}
                              </span>
                              <span className="text-xs font-black uppercase text-slate-700 tracking-wider">{val}</span>
                            </div>
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => moveSequenceItem(idx, 'up')}
                                disabled={idx === 0}
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-md text-[10px] font-bold disabled:opacity-30 disabled:cursor-not-allowed"
                              >
                                ▲ Monter
                              </button>
                              <button
                                onClick={() => moveSequenceItem(idx, 'down')}
                                disabled={idx === step5Sequence.length - 1}
                                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded-md text-[10px] font-bold disabled:opacity-30 disabled:cursor-not-allowed"
                              >
                                ▼ Descendre
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="pt-2 flex justify-end gap-3 items-center">
                        {step5SequenceSubmitted && (
                          <div className="text-[10px] font-bold uppercase tracking-wide">
                            {step5SequenceSuccess 
                              ? <span className="text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg border border-emerald-200">✅ Séquence ordonnée avec succès !</span> 
                              : <span className="text-rose-600 bg-rose-50 px-3 py-2 rounded-lg border border-rose-200">❌ Ordre incorrect. La finition ne peut pas exploser avant d'avoir fait de la place au centre !</span>
                            }
                          </div>
                        )}
                        <button
                          onClick={handleStep5VerifyOrder}
                          className="px-4 py-2 bg-slate-900 hover:bg-slate-850 text-white text-[10px] font-black uppercase tracking-wider rounded-xl cursor-pointer"
                        >
                          Vérifier la séquence
                        </button>
                      </div>
                    </div>

                    {/* Question Delay */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
                      <p className="text-[11px] font-black uppercase text-slate-700 tracking-wide">
                        Quel est le délai théorique réglementaire affecté aux détonateurs du Groupe d'Élargissement 3 ?
                      </p>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                        {['25ms', '50ms', '75ms', '100ms'].map(opt => {
                          const val = opt.replace('ms', '');
                          return (
                            <label 
                              key={opt}
                              className={`p-3 border rounded-xl flex items-center gap-2 cursor-pointer text-[11px] font-black ${
                                step5Q === val 
                                  ? 'bg-[#b8860b]/10 border-[#b8860b] text-[#b8860b]' 
                                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                              }`}
                            >
                              <input 
                                type="radio" 
                                name="step5Q" 
                                value={val}
                                checked={step5Q === val}
                                onChange={(e) => setStep5Q(e.target.value)}
                                className="accent-[#b8860b]"
                              />
                              {opt}
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 6 */}
                {currentStep === 6 && (
                  <div className="space-y-6">
                    <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                      En fin de poste, vous recevez les données brutes de production de la mine. 
                      Vous devez être capable de lire les indicateurs clés (KPIs) et de détecter immédiatement une anomalie flagrante de rendement.
                    </p>

                    {/* Interactive Production Table */}
                    <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                      <div className="bg-slate-900 p-3 text-white text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5">
                        <Activity className="w-4 h-4 text-[#b8860b]" /> Rapport de Production Journalier (Registre de Simulation)
                      </div>
                      
                      <div className="overflow-x-auto">
                        <table className="w-full text-[11px] text-left border-collapse">
                          <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-black uppercase tracking-wider">
                              <th className="p-3">Poste / Shift</th>
                              <th className="p-3">Forage Planifié</th>
                              <th className="p-3">Avancement Réel</th>
                              <th className="p-3">Rendement de Tir</th>
                              <th className="p-3">Statut</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 font-semibold text-slate-700">
                            <tr className="hover:bg-slate-50/50 cursor-pointer">
                              <td className="p-3 font-black text-slate-900">Poste 1 (Matin)</td>
                              <td className="p-3">1.7 m</td>
                              <td className="p-3">1.5 m</td>
                              <td className="p-3 text-emerald-600">88%</td>
                              <td className="p-3"><span className="bg-emerald-100 text-emerald-800 text-[8px] font-black uppercase px-2 py-0.5 rounded-md">Optimal</span></td>
                            </tr>
                            <tr className="hover:bg-slate-50/50 cursor-pointer">
                              <td className="p-3 font-black text-slate-900">Poste 2 (Après-midi)</td>
                              <td className="p-3">1.7 m</td>
                              <td className="p-3">1.7 m</td>
                              <td className="p-3 text-emerald-600">100%</td>
                              <td className="p-3"><span className="bg-emerald-100 text-emerald-800 text-[8px] font-black uppercase px-2 py-0.5 rounded-md">Excellent</span></td>
                            </tr>
                            <tr 
                              onClick={() => setStep6RowClicked(true)}
                              className={`cursor-pointer transition-colors ${
                                step6RowClicked ? 'bg-amber-100/50 hover:bg-amber-100/60' : 'bg-red-50/40 hover:bg-red-50/60 animate-pulse'
                              }`}
                            >
                              <td className="p-3 font-black text-slate-900">Poste 3 (Nuit)</td>
                              <td className="p-3">1.7 m</td>
                              <td className="p-3">0.8 m</td>
                              <td className="p-3 text-rose-600 font-black">47%</td>
                              <td className="p-3">
                                <span className="bg-rose-100 text-rose-800 text-[8px] font-black uppercase px-2 py-0.5 rounded-md">
                                  {step6RowClicked ? "Sélectionné" : "Cliquez ici !"}
                                </span>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {step6RowClicked && (
                      <div className="bg-[#b8860b]/5 border border-[#b8860b]/20 p-4 rounded-xl flex gap-3 animate-in fade-in duration-200">
                        <ShieldAlert className="w-5 h-5 text-[#b8860b] shrink-0 mt-0.5" />
                        <div>
                          <span className="text-xs font-black uppercase tracking-wider text-slate-950">ANOMALIE COMPRISE ET SÉLECTIONNÉE</span>
                          <p className="text-[10.5px] text-slate-600 mt-1 leading-relaxed font-semibold">
                            Rendement à <strong>47% (seulement 0.8m d'avancement réel pour 1.7m planifiés)</strong>. 
                            Ceci indique une défaillance opérationnelle grave (coup soufflé, tige cassée, taillant brisé). 
                            En tant que secrétaire de chantier, vous devez obligatoirement investiguer l'origine technique de cet écart auprès du chef d'équipe de nuit.
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Quick validation questions */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-3xs">
                      {/* Q1 */}
                      <div className="space-y-2">
                        <p className="text-[11px] font-black uppercase tracking-wide text-slate-700">
                          Q1 : Quel est l'avancement réglementaire cible standard avec une tige de forage de 1.8m ?
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          {['1.5', '1.7', '1.8'].map(val => (
                            <label 
                              key={val}
                              className={`p-3 border rounded-xl flex items-center gap-2 cursor-pointer text-[11px] font-black ${
                                step6Q1 === val 
                                  ? 'bg-[#b8860b]/10 border-[#b8860b] text-[#b8860b]' 
                                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              <input 
                                type="radio" 
                                name="step6Q1" 
                                value={val}
                                checked={step6Q1 === val}
                                onChange={(e) => setStep6Q1(e.target.value)}
                                className="accent-[#b8860b]"
                              />
                              {val} m/volée
                            </label>
                          ))}
                        </div>
                      </div>

                      {/* Q2 */}
                      <div className="space-y-2 pt-2">
                        <p className="text-[11px] font-black uppercase tracking-wide text-slate-700">
                          Q2 : Quelle est la quantité moyenne d'ANFO nécessaire pour charger un front de taille de 12m² ?
                        </p>
                        <div className="grid grid-cols-3 gap-2">
                          {['20', '40', '80'].map(val => (
                            <label 
                              key={val}
                              className={`p-3 border rounded-xl flex items-center gap-2 cursor-pointer text-[11px] font-black ${
                                step6Q2 === val 
                                  ? 'bg-[#b8860b]/10 border-[#b8860b] text-[#b8860b]' 
                                  : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                              }`}
                            >
                              <input 
                                type="radio" 
                                name="step6Q2" 
                                value={val}
                                checked={step6Q2 === val}
                                onChange={(e) => setStep6Q2(e.target.value)}
                                className="accent-[#b8860b]"
                              />
                              ~{val} kg
                            </label>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 7 */}
                {currentStep === 7 && (
                  <div className="space-y-6">
                    <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                      La check-list des chefs d'équipe de poste est essentielle pour certifier la conformité technique du tir. 
                      Vous devez la reporter de façon stricte et détecter toute incohérence manifeste entre les déclarations techniques et le métrage obtenu.
                    </p>

                    <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 space-y-4">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-900">
                        Simulation Interactive : Saisie de la Check-list du Poste
                      </h4>
                      
                      <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 shadow-3xs">
                        <p className="text-[10.5px] text-slate-600 font-bold uppercase leading-relaxed">
                          <strong>Scénario :</strong> Le chef d'équipe prétend à la remontée que tout s'est déroulé de manière parfaitement conforme. 
                          Cependant, l'avancement miné réel de la volée est de seulement <strong>0.9m</strong> pour un forage théorique de <strong>1.7m</strong> (soit 53% de rendement).
                        </p>

                        <div className="space-y-3.5 pt-2">
                          {/* Alignement */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                            <span className="text-[10.5px] font-bold text-slate-700">1. Alignement et parallélisme du Jumbo :</span>
                            <div className="flex gap-2">
                              {['CONFORME', 'NON CONFORME'].map(val => (
                                <button
                                  key={val}
                                  onClick={() => handleStep7Toggle('alignment', val)}
                                  className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                                    step7Checklist.alignment === val 
                                      ? val === 'CONFORME' ? 'bg-emerald-100 border-emerald-300 text-emerald-800' : 'bg-rose-100 border-rose-300 text-rose-800'
                                      : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'
                                  } border`}
                                >
                                  {val}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Profondeur */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                            <span className="text-[10.5px] font-bold text-slate-700">2. Profondeur des trous de forage :</span>
                            <div className="flex gap-2">
                              {['CONFORME', 'NON CONFORME'].map(val => (
                                <button
                                  key={val}
                                  onClick={() => handleStep7Toggle('depth', val)}
                                  className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                                    step7Checklist.depth === val 
                                      ? val === 'CONFORME' ? 'bg-emerald-100 border-emerald-300 text-emerald-800' : 'bg-rose-100 border-rose-300 text-rose-800'
                                      : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'
                                  } border`}
                                >
                                  {val}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Bourrage */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                            <span className="text-[10.5px] font-bold text-slate-700">3. Longueur réglementaire du bourrage d'argile :</span>
                            <div className="flex gap-2">
                              {['CONFORME', 'NON CONFORME'].map(val => (
                                <button
                                  key={val}
                                  onClick={() => handleStep7Toggle('tamping', val)}
                                  className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                                    step7Checklist.tamping === val 
                                      ? val === 'CONFORME' ? 'bg-emerald-100 border-emerald-300 text-emerald-800' : 'bg-rose-100 border-rose-300 text-rose-800'
                                      : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'
                                  } border`}
                                >
                                  {val}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Tovex */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2">
                            <span className="text-[10.5px] font-bold text-slate-700">4. Quantité de cartouches de dynamite (Tovex) :</span>
                            <div className="flex gap-2">
                              {['CONFORME', 'NON CONFORME'].map(val => (
                                <button
                                  key={val}
                                  onClick={() => handleStep7Toggle('tovex', val)}
                                  className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                                    step7Checklist.tovex === val 
                                      ? val === 'CONFORME' ? 'bg-emerald-100 border-emerald-300 text-emerald-800' : 'bg-rose-100 border-rose-300 text-rose-800'
                                      : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'
                                  } border`}
                                >
                                  {val}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Séquence */}
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <span className="text-[10.5px] font-bold text-slate-700">5. Raccordement et séquence de tir (EXEL) :</span>
                            <div className="flex gap-2">
                              {['CONFORME', 'NON CONFORME'].map(val => (
                                <button
                                  key={val}
                                  onClick={() => handleStep7Toggle('sequence', val)}
                                  className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
                                    step7Checklist.sequence === val 
                                      ? val === 'CONFORME' ? 'bg-emerald-100 border-emerald-300 text-emerald-800' : 'bg-rose-100 border-rose-300 text-rose-800'
                                      : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'
                                  } border`}
                                >
                                  {val}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Warning alerts on incoherence */}
                      {step7Incoherence ? (
                        <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-xs font-black uppercase tracking-wider">⚠️ INCOHÉRENCE DÉTECTÉE PAR LE SYSTÈME</span>
                            <p className="text-[10.5px] text-slate-600 mt-1 leading-relaxed">
                              L'avancement n'est que de 0.9m pour 1.7m planifiés. 
                              Il est <strong>techniquement impossible</strong> que l'ensemble des facteurs de forage et dynamitage soient conformes. 
                              Vous devez confronter le chef d'équipe ! 
                              <span className="text-[#b8860b] block mt-1 font-bold">
                                (Ajustement : Le chef d'équipe admet après discussion que le bourrage était trop court. Réglez "Longueur du bourrage" sur NON CONFORME !)
                              </span>
                            </p>
                          </div>
                        </div>
                      ) : (
                        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl flex items-start gap-3">
                          <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5" />
                          <div>
                            <span className="text-xs font-black uppercase tracking-wider">✅ COHÉRENCE TECHNIQUE DE SAISIE RETROUVÉE</span>
                            <p className="text-[10.5px] text-slate-600 mt-1 leading-relaxed">
                              Excellent ! Le signalement de non-conformité sur le Bourrage d'argile explique parfaitement le coup soufflé à 0.9m. 
                              Le système autorise la validation de la check-list.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Question check */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
                      <p className="text-[11px] font-black uppercase text-slate-700 tracking-wide">
                        Qui est réglementairement responsable d'initier la saisie de cette check-list sur HydroMines ?
                      </p>
                      <div className="space-y-2">
                        {[
                          { val: 'chef', label: 'Le chef d\'équipe lui-même depuis sa cabine de Jumbo au fond de la galerie' },
                          { val: 'sec', label: 'Le secrétaire de chantier (vous-même) sur la base des déclarations verbales du chef' },
                          { val: 'dir', label: 'Le directeur général de la SMI lors de la commission d\'analyse hebdomadaire' }
                        ].map(item => (
                          <label 
                            key={item.val}
                            className={`p-3 border rounded-xl flex items-center gap-2.5 cursor-pointer text-[10.5px] font-semibold ${
                              step7Q === item.val 
                                ? 'bg-[#b8860b]/10 border-[#b8860b] text-[#b8860b]' 
                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <input 
                              type="radio" 
                              name="step7Q" 
                              value={item.val}
                              checked={step7Q === item.val}
                              onChange={(e) => setStep7Q(e.target.value)}
                              className="accent-[#b8860b]"
                            />
                            {item.label}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 8 */}
                {currentStep === 8 && (
                  <div className="space-y-6">
                    <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                      Chaque fois qu'un avancement de tir de volée est <strong>inférieur à 80% du forage planifié</strong>, le système exige l'enregistrement formel d'une <strong>Volée Ratée (Failed Blast)</strong>. 
                      Cela permet de tracer l'historique et de commander des actions correctives.
                    </p>

                    <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 space-y-4">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-rose-800 flex items-center gap-1.5">
                        <ShieldAlert className="w-4 h-4 text-rose-600" /> Simulateur d'Enregistrement de Volée Ratée
                      </h4>
                      <p className="text-[10.5px] text-rose-700 font-bold uppercase tracking-wide">
                        Complétez le formulaire de déclaration avec les données techniques de l'incident :
                      </p>

                      <form onSubmit={handleStep8Submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-white border border-rose-100 p-4 rounded-xl">
                        {/* Sector */}
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Secteur actif</label>
                          <select 
                            value={step8Form.sector}
                            onChange={(e) => setStep8Form(prev => ({ ...prev, sector: e.target.value }))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold focus:outline-none"
                          >
                            <option value="Imiter 1">Imiter 1</option>
                            <option value="Imiter 2">Imiter 2</option>
                            <option value="Imiter Est">Imiter Est</option>
                          </select>
                        </div>

                        {/* Shift */}
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Poste / Shift</label>
                          <select 
                            value={step8Form.shift}
                            onChange={(e) => setStep8Form(prev => ({ ...prev, shift: e.target.value }))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold focus:outline-none"
                          >
                            <option value="Poste 1">Poste 1 (Matin)</option>
                            <option value="Poste 2">Poste 2 (Après-midi)</option>
                            <option value="Poste 3">Poste 3 (Nuit)</option>
                          </select>
                        </div>

                        {/* Planifié */}
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Avancement Planifié (m)</label>
                          <input 
                            type="text" 
                            disabled 
                            value={step8Form.planned}
                            className="w-full bg-slate-100 border border-slate-200 text-slate-500 rounded-lg p-2 text-xs font-semibold"
                          />
                        </div>

                        {/* Réel */}
                        <div className="space-y-1.5">
                          <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Avancement Réel (m)</label>
                          <input 
                            type="text" 
                            disabled 
                            value={step8Form.real}
                            className="w-full bg-slate-100 border border-slate-200 text-slate-500 rounded-lg p-2 text-xs font-semibold"
                          />
                        </div>

                        {/* Cause */}
                        <div className="space-y-1.5 sm:col-span-2">
                          <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Cause technique de l'écart</label>
                          <select 
                            value={step8Form.cause}
                            onChange={(e) => setStep8Form(prev => ({ ...prev, cause: e.target.value }))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold focus:outline-none"
                          >
                            <option value="Tige conique cassée">🔧 Tige conique cassée</option>
                            <option value="Retard de déblayage">⏰ Retard de déblayage</option>
                            <option value="Taillant cassé">💥 Taillant cassé</option>
                            <option value="Air comprimé faible / absent">💨 Air comprimé faible / absent</option>
                            <option value="Autres">❓ Autres causes</option>
                          </select>
                        </div>

                        {/* Commentaire */}
                        <div className="space-y-1.5 sm:col-span-2">
                          <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Commentaire détaillé (10 caractères minimum)</label>
                          <textarea 
                            value={step8Form.comment}
                            onChange={(e) => setStep8Form(prev => ({ ...prev, comment: e.target.value }))}
                            placeholder="Saisissez la justification technique rapportée par le chef d'équipe..."
                            rows={3}
                            className="w-full bg-slate-50 border border-slate-200 rounded-lg p-2 text-xs font-semibold focus:outline-none"
                          />
                        </div>

                        {/* Action submit */}
                        <div className="sm:col-span-2 pt-1 flex justify-end">
                          {!step8Submitted ? (
                            <button
                              type="submit"
                              className="px-5 py-2.5 bg-rose-600 text-white text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-rose-700 transition-all cursor-pointer"
                            >
                              Soumettre la déclaration de volée ratée
                            </button>
                          ) : (
                            <div className="bg-emerald-100 border border-emerald-300 text-emerald-800 p-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5">
                              <CheckCircle className="w-4 h-4" /> Déclaration enregistrée dans le simulateur !
                            </div>
                          )}
                        </div>
                      </form>
                    </div>

                    {/* Question official register */}
                    <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3">
                      <p className="text-[11px] font-black uppercase text-slate-700 tracking-wide">
                        Où se trouve le registre permanent répertoriant toutes les volées ratées de la mine ?
                      </p>
                      <div className="space-y-2">
                        {[
                          { val: 'tech', label: 'Dans l\'onglet Technique Minière' },
                          { val: 'side', label: 'Dans le menu latéral "⚠️ Volées Ratées" pour un accès direct et réglementaire' },
                          { val: 'archi', label: 'Uniquement stocké dans le classeur d\'archives physiques de la direction' }
                        ].map(item => (
                          <label 
                            key={item.val}
                            className={`p-3 border rounded-xl flex items-center gap-2.5 cursor-pointer text-[10.5px] font-semibold ${
                              step8Q === item.val 
                                ? 'bg-[#b8860b]/10 border-[#b8860b] text-[#b8860b]' 
                                : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                            }`}
                          >
                            <input 
                              type="radio" 
                              name="step8Q" 
                              value={item.val}
                              checked={step8Q === item.val}
                              onChange={(e) => setStep8Q(e.target.value)}
                              className="accent-[#b8860b]"
                            />
                            {item.label}
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* STEP 9 - PRACTICAL EXAM */}
                {currentStep === 9 && (
                  <div className="space-y-6">
                    <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                      C'est l'examen final de qualification. Vous êtes mis en situation réelle de fin de poste. 
                      Remplissez l'ensemble des modules sans erreur, validez les registres et obtenez votre habilitation officielle SMI.
                    </p>

                    {/* Check if already certified */}
                    {certificateEarned ? (
                      <div className="bg-gradient-to-br from-amber-500 to-[#b8860b] text-white rounded-3xl p-6 sm:p-8 border border-amber-400 shadow-xl space-y-6 text-center">
                        <div className="w-20 h-20 bg-white/15 rounded-full flex items-center justify-center mx-auto ring-8 ring-white/10 animate-bounce">
                          <Trophy className="w-10 h-10 text-[#ffd700]" />
                        </div>
                        
                        <div className="space-y-2">
                          <span className="text-[10px] font-black tracking-widest uppercase bg-white/20 px-3 py-1 rounded-md">
                            Certificat d'Habilitation Officiel
                          </span>
                          <h3 className="text-2xl font-black uppercase tracking-wider">
                            FÉLICITATIONS !
                          </h3>
                          <p className="text-xs font-bold uppercase tracking-wider max-w-lg mx-auto leading-relaxed">
                            {step9Data.userName || "Secrétaire Qualifié"}, vous avez complété l'intégralité du cursus de formation HydroMines avec succès. 
                            Vous êtes officiellement qualifié et habilité par la SMI à saisir les registres de chantiers souterrains !
                          </p>
                        </div>

                        {/* Digital Certificate mockup */}
                        <div className="bg-white text-slate-900 border-4 border-amber-600 p-6 rounded-2xl max-w-md mx-auto space-y-4 shadow-lg text-left relative overflow-hidden">
                          {/* Background stamp style */}
                          <div className="absolute -right-8 -bottom-8 w-36 h-36 border-8 border-amber-500/10 rounded-full flex items-center justify-center transform rotate-12">
                            <span className="text-[10px] font-black text-amber-500/10">SMI VALIDATED</span>
                          </div>

                          <div className="text-center border-b border-slate-100 pb-3">
                            <h4 className="text-[11px] font-black uppercase tracking-widest text-[#b8860b]">SOCIÉTÉ MÉTALLURGIQUE D'IMITER</h4>
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">GROUPE MANAGEM</p>
                          </div>

                          <div className="space-y-2.5 text-center py-2">
                            <p className="text-[9px] font-bold text-slate-500 uppercase">Le présent certificat atteste de la qualification de :</p>
                            <h5 className="text-base font-black uppercase tracking-wide text-slate-900 underline decoration-[#b8860b] decoration-2">
                              {step9Data.userName || "Opérateur SMI"}
                            </h5>
                            <p className="text-[9px] font-semibold text-slate-500 leading-relaxed">
                              Ayant démontré une maîtrise rigoureuse de la saisie des registres journaliers, du contrôle de conformité des plans de tir de 12m², du calcul du bourrage d'argile, et du protocole réglementaire de déclaration des volées ratées.
                            </p>
                          </div>

                          <div className="flex justify-between items-end pt-2 text-[8px] font-black uppercase text-slate-400 tracking-wider">
                            <div>
                              <p>Délivré le :</p>
                              <p className="text-slate-800 mt-0.5">{new Date().toLocaleDateString('fr-FR')}</p>
                            </div>
                            <div className="text-right">
                              <p>Le Directeur de Mine :</p>
                              <p className="text-slate-800 mt-0.5 font-serif italic">M. El-Hassani</p>
                            </div>
                          </div>
                        </div>

                        <div className="pt-2">
                          <p className="text-[10px] font-semibold text-slate-100 uppercase tracking-widest">
                            Ce certificat est conservé de manière permanente dans votre navigateur local.
                          </p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Interactive Exam Panels */}
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-4">
                          <h4 className="text-xs font-black uppercase tracking-wider text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-2">
                            <Sliders className="w-4.5 h-4.5 text-[#b8860b]" /> Panneau de Situation Réelle
                          </h4>
                          
                          <div className="space-y-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              {/* Nom de l'opérateur */}
                              <div className="space-y-1.5 sm:col-span-2">
                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Votre Prénom et Nom de Famille :</label>
                                <input 
                                  type="text" 
                                  placeholder="Entrez votre nom complet pour l'habilitation..."
                                  value={step9Data.userName}
                                  onChange={(e) => setStep9Data(prev => ({ ...prev, userName: e.target.value }))}
                                  className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs font-semibold focus:outline-none focus:border-[#b8860b]"
                                />
                              </div>

                              {/* Planned (Fixed) */}
                              <div className="space-y-1.5">
                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Forage Planifié Standard</label>
                                <input 
                                  type="text" 
                                  disabled 
                                  value={step9Data.planned}
                                  className="w-full bg-slate-100 border border-slate-200 text-slate-500 rounded-lg p-2.5 text-xs font-semibold"
                                />
                              </div>

                              {/* Real Input */}
                              <div className="space-y-1.5">
                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Avancement Réel obtenu au Chantier CH-101 (m)</label>
                                <input 
                                  type="text" 
                                  placeholder="Entrez 0.9 pour simuler l'avancement de cette volée..."
                                  value={step9Data.real}
                                  onChange={(e) => setStep9Data(prev => ({ ...prev, real: e.target.value }))}
                                  className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs font-semibold focus:outline-none focus:border-[#b8860b]"
                                />
                              </div>

                              {/* LHD Buckets */}
                              <div className="space-y-1.5">
                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Volume LHD (Nombre de Godets)</label>
                                <input 
                                  type="number" 
                                  placeholder="Saisissez 45 godets..."
                                  value={step9Data.buckets}
                                  onChange={(e) => setStep9Data(prev => ({ ...prev, buckets: e.target.value }))}
                                  className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs font-semibold focus:outline-none"
                                />
                              </div>

                              {/* LHD Gasoil */}
                              <div className="space-y-1.5">
                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400">Consommation Gasoil LHD (L)</label>
                                <input 
                                  type="number" 
                                  placeholder="Saisissez 35 Litres..."
                                  value={step9Data.gasoil}
                                  onChange={(e) => setStep9Data(prev => ({ ...prev, gasoil: e.target.value }))}
                                  className="w-full bg-white border border-slate-200 rounded-lg p-2.5 text-xs font-semibold focus:outline-none"
                                />
                              </div>
                            </div>

                            {/* Checklist Toggle inside Examen */}
                            <div className="bg-white p-4 rounded-xl border border-slate-150 space-y-3">
                              <h5 className="text-[10px] font-black uppercase tracking-widest text-slate-900 border-b border-slate-50 pb-2">
                                Check-list Technique du Poste (CH-101)
                              </h5>
                              <p className="text-[9.5px] text-slate-500 font-bold uppercase tracking-wider">
                                (Indicateur : Le chef d'équipe indique que le bourrage n'était pas suffisant.)
                              </p>

                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-semibold text-slate-700">
                                <span>Longueur de bourrage d'argile :</span>
                                <div className="flex gap-2">
                                  {['CONFORME', 'NON CONFORME'].map(val => (
                                    <button
                                      key={val}
                                      onClick={() => setStep9Data(prev => ({ ...prev, checklistTamping: val }))}
                                      className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider border transition-all ${
                                        step9Data.checklistTamping === val 
                                          ? val === 'CONFORME' ? 'bg-emerald-100 border-emerald-300 text-emerald-800' : 'bg-rose-100 border-rose-300 text-rose-800'
                                          : 'bg-slate-50 border-slate-200 text-slate-400 hover:bg-slate-100'
                                      }`}
                                    >
                                      {val}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            </div>

                            {/* Failed Blast form inside Examen */}
                            <div className="bg-rose-50/50 border border-rose-150 p-4 rounded-xl space-y-3">
                              <h5 className="text-[10px] font-black uppercase tracking-widest text-rose-800 border-b border-rose-100/50 pb-2">
                                Déclaration Obligatoire de Volée Ratée associe (Rendement &lt; 80%)
                              </h5>
                              
                              <div className="grid grid-cols-1 gap-3">
                                <div className="space-y-1">
                                  <label className="text-[8.5px] font-black uppercase tracking-widest text-slate-400">Cause principale</label>
                                  <select
                                    value={step9Data.failedBlastCause}
                                    onChange={(e) => setStep9Data(prev => ({ ...prev, failedBlastCause: e.target.value }))}
                                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold focus:outline-none"
                                  >
                                    <option value="">-- Sélectionner la cause --</option>
                                    <option value="Bourrage insuffisant">💥 Bourrage d'argile insuffisant (Coup soufflé)</option>
                                    <option value="Taillant cassé">🔧 Taillant de Jumbo cassé</option>
                                    <option value="Retard de déblayage">⏰ Retard de marinage/déblayage</option>
                                  </select>
                                </div>

                                <div className="space-y-1">
                                  <label className="text-[8.5px] font-black uppercase tracking-widest text-slate-400">Commentaire justificatif (10 caractères min)</label>
                                  <textarea
                                    value={step9Data.failedBlastComment}
                                    onChange={(e) => setStep9Data(prev => ({ ...prev, failedBlastComment: e.target.value }))}
                                    placeholder="Exemple : Le bourrage d'argile sur CH-101 a été insuffisant (50cm au lieu de 76cm), causant un coup soufflé."
                                    rows={2}
                                    className="w-full bg-white border border-slate-200 rounded-lg p-2 text-xs font-semibold focus:outline-none"
                                  />
                                </div>
                              </div>
                            </div>

                            {/* Error display */}
                            {step9Data.errorMessage && (
                              <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded-xl text-[10px] font-black uppercase tracking-wide flex items-center gap-1.5">
                                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" /> {step9Data.errorMessage}
                              </div>
                            )}

                            {/* CTA Action Exam */}
                            <div className="pt-2 flex justify-end">
                              <button
                                onClick={handleStep9Submit}
                                className="px-6 py-3.5 bg-gradient-to-r from-[#b8860b] to-[#d4af37] text-slate-950 text-xs font-black uppercase tracking-widest rounded-xl hover:scale-103 transition-all cursor-pointer shadow-md flex items-center gap-2"
                              >
                                <CheckCircle className="w-4.5 h-4.5" /> Soumettre mon examen & sceller le poste
                              </button>
                            </div>

                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* --- WORKSPACE FOOTER CONTROLS --- */}
                <div className="border-t border-slate-100 pt-5 flex items-center justify-between gap-4">
                  {currentStep > 1 ? (
                    <button
                      onClick={handlePrevious}
                      className="px-4 py-2 bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200 text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-1"
                    >
                      <ChevronLeft className="w-4 h-4" /> Étape précédente
                    </button>
                  ) : (
                    <div />
                  )}

                  {isStepValid() && currentStep < 9 && (
                    <button
                      onClick={handleNext}
                      className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white text-xs font-black uppercase tracking-widest rounded-xl hover:scale-102 transition-all flex items-center gap-1"
                    >
                      Valider et continuer <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>

              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right sidebar: Training Info and Context (3 columns) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Guide Card context */}
            <div className="bg-slate-900 text-white border border-slate-800 rounded-3xl p-5 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-amber-400">
                <BookOpen className="w-5 h-5" />
                <h4 className="text-xs font-black uppercase tracking-wider">Objectif de l'Étape</h4>
              </div>

              <div className="space-y-3.5">
                <p className="text-[11px] text-slate-300 font-medium leading-relaxed">
                  Chaque étape est conçue pour vous initier de manière pratique à un aspect de la saisie technique HydroMines :
                </p>

                <ul className="space-y-2.5 text-[10.5px] text-slate-300 font-semibold uppercase tracking-wide">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Connaître les gabarits</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Comprendre le bourrage</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Identifier les anomalies</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                    <span>Maîtriser les volées ratées</span>
                  </li>
                </ul>
              </div>

              <div className="border-t border-slate-800 pt-4 text-center">
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">
                  HydroMines • SMI Imiter 2026
                </span>
              </div>
            </div>

            {/* Video or extra resource Card */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-xs text-center space-y-3">
              <div className="w-10 h-10 bg-[#b8860b]/10 text-[#b8860b] rounded-full flex items-center justify-center mx-auto">
                <Video className="w-5 h-5" />
              </div>
              <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-900">
                Support d'Apprentissage SCM
              </h4>
              <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
                Visionnez la vidéo officielle de la SMI expliquant le protocole de saisie et de sécurité au poste souterrain.
              </p>
              <button
                onClick={() => alert("Lecture du tutoriel vidéo SCM SMI_V1.mp4")}
                className="w-full py-2 bg-slate-900 hover:bg-slate-850 text-white text-[9.5px] font-black uppercase tracking-wider rounded-xl transition-all"
              >
                Visionner le support vidéo
              </button>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
};

export default Tutoriel;
