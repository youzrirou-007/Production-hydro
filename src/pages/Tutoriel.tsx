import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  GraduationCap, 
  BookOpen, 
  Video, 
  Trophy, 
  Check, 
  ChevronRight, 
  ChevronLeft 
} from 'lucide-react';

import { HOLES_DATA } from './TechniqueMiniere/data';
import { HoleInfo } from './TechniqueMiniere/types';

// Import newly created modular step components
import { Step1Welcome } from './TutorielSteps/Step1Welcome';
import { Step2StandardGabarit } from './TutorielSteps/Step2StandardGabarit';
import { Step3PrecisionForage } from './TutorielSteps/Step3PrecisionForage';
import { Step4ClayTamping } from './TutorielSteps/Step4ClayTamping';
import { Step5DetonationSequence } from './TutorielSteps/Step5DetonationSequence';
import { Step6KPIsReading } from './TutorielSteps/Step6KPIsReading';
import { Step7ChecklistValidation } from './TutorielSteps/Step7ChecklistValidation';
import { Step8FailedBlasts } from './TutorielSteps/Step8FailedBlasts';
import { Step9FinalExam } from './TutorielSteps/Step9FinalExam';

import bannerExcellenceImg from '../assets/images/banner_excellence.webp';

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
      const saved = localStorage.getItem('excellence_tutorial_progress') || localStorage.getItem('hydromines_tutorial_progress');
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
      localStorage.setItem('excellence_tutorial_progress', JSON.stringify(newProgress));
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
    if (draggedSlots.fond === 'Tovex' && draggedSlots.colonne === 'ANFO' && draggedSlots.bourrage === "Bourrage d'argile") {
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
  };

  // Step 8 Incident Report Form submit
  const handleStep8Submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (step8Form.comment.trim().length >= 10) {
      setStep8Submitted(true);
      markStepComplete(8);
    }
  };

  // Step 9 Final Exam submit handler
  const handleStep9Submit = (e: React.FormEvent) => {
    e.preventDefault();
    const d = step9Data;
    setStep9Data(prev => ({ ...prev, isSubmitted: true }));

    if (!d.userName.trim()) {
      setStep9Data(prev => ({ ...prev, errorMessage: "Veuillez renseigner votre nom complet pour émettre votre diplôme." }));
      return;
    }
    if (d.real !== '0.9') {
      setStep9Data(prev => ({ ...prev, errorMessage: "Erreur de saisie de l'avancement miné réel. Il doit être de 0.9m pour ce chantier." }));
      return;
    }
    if (d.buckets !== '45' || d.gasoil !== '35') {
      setStep9Data(prev => ({ ...prev, errorMessage: "Erreur dans les valeurs LHD du suivi du réel (45 godets et 35L de gazole requis)." }));
      return;
    }
    if (d.checklistTamping !== 'NON CONFORME') {
      setStep9Data(prev => ({ ...prev, errorMessage: "Incohérence checklist : Le bourrage d'argile n'étant pas fait correctement, il doit être NON CONFORME." }));
      return;
    }
    if (d.failedBlastCause !== 'Bourrage insuffisant') {
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
    "Bienvenue dans la famille CHANTIER MINIER (X)",
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
    <div className="min-h-screen bg-slate-50 text-slate-800 py-10 px-4 sm:px-6 lg:px-8 relative overflow-hidden font-sans">
      
      {/* Confetti Overlay Canvas */}
      {certificateEarned && (
        <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-50 w-full h-full" />
      )}

      {/* Main Container */}
      <div className="max-w-6xl mx-auto relative z-10">
        
        {/* Header Block Banner with Banner excellence image */}
        <div className="mb-10 p-6 md:p-10 rounded-3xl shadow-xl border border-amber-500/30 relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Banner Image Background (100% original, untouched) */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
            style={{ backgroundImage: `url(${bannerExcellenceImg})` }}
          />

          {/* Banner Text Content directly on the image */}
          <div className="space-y-1.5 relative z-10 max-w-2xl">
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#ffd700] flex items-center gap-1.5 drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
              <GraduationCap className="w-4 h-4 text-[#ffd700]" />
              Académie de Formation SCM • Excellence
            </span>
            <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white leading-tight drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
              Module d'Habilitation Secrétaire de Chantier
            </h1>
            <p className="text-xs text-amber-100 font-bold uppercase tracking-wider drop-shadow-[0_2px_4px_rgba(0,0,0,0.9)]">
              Devenez un maillon essentiel de la traçabilité et de la performance minière de la SMI
            </p>
          </div>

          {/* Header Action Buttons directly on banner */}
          <div className="flex gap-2.5 items-center shrink-0 relative z-10">
            {certificateEarned && (
              <span className="bg-amber-500 text-slate-950 font-black uppercase tracking-widest text-[10px] px-4 py-2.5 rounded-xl flex items-center gap-1.5 shadow-lg border border-amber-300">
                <Trophy className="w-4 h-4" /> Habilité SMI
              </span>
            )}
            <button
              onClick={handleResetProgress}
              className="px-4 py-2.5 bg-slate-900/90 hover:bg-slate-900 text-white border border-slate-700 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-lg"
            >
              Réinitialiser
            </button>
          </div>
        </div>

        {/* Permanent 9-Step Progress Bar */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xl mb-10">
          <div className="flex items-center justify-between text-slate-400 text-[10px] font-black uppercase tracking-wider mb-4 px-1">
            <span>Progression du cursus d'habilitation</span>
            <span className="text-[#b8860b]">Étape {currentStep} sur 9</span>
          </div>

          <div className="grid grid-cols-9 gap-3">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((stepNum) => {
              const isActive = currentStep === stepNum;
              const isCompleted = completedSteps.includes(stepNum);
              const maxUnlocked = Math.max(1, ...completedSteps) + 1;
              const isUnlocked = stepNum <= maxUnlocked || completedSteps.includes(stepNum);

              let barColor = "bg-slate-100";
              if (isActive) barColor = "bg-[#b8860b]";
              else if (isCompleted) barColor = "bg-emerald-500";

              return (
                <button
                  key={stepNum}
                  onClick={() => handleStepClick(stepNum)}
                  disabled={!isUnlocked}
                  className={`group relative text-center flex flex-col items-center gap-2.5 focus:outline-none focus:ring-0 ${
                    isUnlocked ? 'cursor-pointer' : 'cursor-not-allowed opacity-40'
                  }`}
                >
                  {/* Visual Circle Indicator */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[11px] font-black transition-all ${
                    isActive 
                      ? 'bg-[#b8860b] text-white ring-4 ring-[#b8860b]/15 scale-110' 
                      : isCompleted 
                        ? 'bg-emerald-500 text-white' 
                        : 'bg-slate-50 text-slate-400 border border-slate-200/80 hover:bg-slate-100 hover:text-slate-600'
                  }`}>
                    {isCompleted ? <Check className="w-4 h-4 stroke-[3px]" /> : stepNum}
                  </div>
                  {/* Segment Line */}
                  <div className={`w-full h-1 rounded-full ${barColor} transition-colors`} />
                  <span className="hidden md:block text-[8px] font-black uppercase tracking-widest text-slate-400 group-hover:text-slate-900 truncate max-w-full">
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
                className="bg-white border border-slate-200/80 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6"
              >
                {/* Step Header */}
                <div className="border-b border-slate-100 pb-5">
                  <div className="flex items-center gap-2">
                    <span className="bg-[#b8860b]/10 text-[#b8860b] text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-md border border-[#b8860b]/15">
                      Étape {currentStep} • SCM Académie
                    </span>
                  </div>
                  <h2 className="text-xl font-black uppercase tracking-wider text-slate-900 mt-3">
                    {currentStepTitle}
                  </h2>
                </div>

                {/* --- RENDERING OF STEP CONTENTS DELEGATED TO MODULAR SUBCOMPONENTS --- */}

                {currentStep === 1 && (
                  <Step1Welcome 
                    step1Started={step1Started}
                    setStep1Started={setStep1Started}
                    markStepComplete={markStepComplete}
                  />
                )}

                {currentStep === 2 && (
                  <Step2StandardGabarit 
                    hoveredHole={hoveredHole}
                    setHoveredHole={setHoveredHole}
                    gasExpanded={gasExpanded}
                    setGasExpanded={setGasExpanded}
                    step2Quiz={step2Quiz}
                    setStep2Quiz={setStep2Quiz}
                    step2Submitted={step2Submitted}
                    step2Passed={step2Passed}
                    handleStep2Submit={handleStep2Submit}
                    handleStep2Reset={handleStep2Reset}
                    getHoleColor={getHoleColor}
                  />
                )}

                {currentStep === 3 && (
                  <Step3PrecisionForage 
                    step3Ex1={step3Ex1}
                    setStep3Ex1={setStep3Ex1}
                    step3Ex2={step3Ex2}
                    setStep3Ex2={setStep3Ex2}
                    step3Ex3={step3Ex3}
                    setStep3Ex3={setStep3Ex3}
                    step3ClickedHoleId={step3ClickedHoleId}
                    setStep3ClickedHoleId={setStep3ClickedHoleId}
                    getHoleColor={getHoleColor}
                  />
                )}

                {currentStep === 4 && (
                  <Step4ClayTamping 
                    draggedSlots={draggedSlots}
                    setDraggedSlots={setDraggedSlots}
                    step4OrderError={step4OrderError}
                    step4OrderSuccess={step4OrderSuccess}
                    step4SliderVal={step4SliderVal}
                    setStep4SliderVal={setStep4SliderVal}
                    step4Formula={step4Formula}
                    setStep4Formula={setStep4Formula}
                    assignSlot={assignSlot}
                    handleStep4VerifyOrder={handleStep4VerifyOrder}
                  />
                )}

                {currentStep === 5 && (
                  <Step5DetonationSequence 
                    step5Sequence={step5Sequence}
                    setStep5Sequence={setStep5Sequence}
                    step5SequenceSuccess={step5SequenceSuccess}
                    step5SequenceSubmitted={step5SequenceSubmitted}
                    step5Q={step5Q}
                    setStep5Q={setStep5Q}
                    moveSequenceItem={moveSequenceItem}
                    handleStep5VerifyOrder={handleStep5VerifyOrder}
                  />
                )}

                {currentStep === 6 && (
                  <Step6KPIsReading 
                    step6RowClicked={step6RowClicked}
                    setStep6RowClicked={setStep6RowClicked}
                    step6Q1={step6Q1}
                    setStep6Q1={setStep6Q1}
                    step6Q2={step6Q2}
                    setStep6Q2={setStep6Q2}
                  />
                )}

                {currentStep === 7 && (
                  <Step7ChecklistValidation 
                    step7Checklist={step7Checklist}
                    setStep7Checklist={setStep7Checklist}
                    step7Incoherence={step7Incoherence}
                    setStep7Incoherence={setStep7Incoherence}
                    step7Q={step7Q}
                    setStep7Q={setStep7Q}
                    handleStep7Toggle={handleStep7Toggle}
                  />
                )}

                {currentStep === 8 && (
                  <Step8FailedBlasts 
                    step8Form={step8Form}
                    setStep8Form={setStep8Form}
                    step8Submitted={step8Submitted}
                    setStep8Submitted={setStep8Submitted}
                    step8Q={step8Q}
                    setStep8Q={setStep8Q}
                    handleStep8Submit={handleStep8Submit}
                  />
                )}

                {currentStep === 9 && (
                  <Step9FinalExam 
                    step9Data={step9Data}
                    setStep9Data={setStep9Data}
                    handleStep9Submit={handleStep9Submit}
                    certificateEarned={certificateEarned}
                  />
                )}

                {/* --- WORKSPACE FOOTER CONTROLS --- */}
                <div className="border-t border-slate-100 pt-6 mt-4 flex items-center justify-between gap-4">
                  {currentStep > 1 ? (
                    <button
                      onClick={handlePrevious}
                      className="px-5 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-1 cursor-pointer shadow-3xs"
                    >
                      <ChevronLeft className="w-4 h-4" /> Étape précédente
                    </button>
                  ) : (
                    <div />
                  )}

                  {isStepValid() && currentStep < 9 && (
                    <button
                      onClick={handleNext}
                      className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-1 cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98]"
                    >
                      Valider et continuer <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                </div>

              </motion.div>
            </AnimatePresence>
          </div>

          {/* Right sidebar: Training Info and Context (4 columns) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Guide Card context styled in deep charcoal */}
            <div className="bg-slate-900 text-white border border-slate-800 rounded-3xl p-6 shadow-md space-y-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 rounded-full blur-2xl" />
              
              <div className="flex items-center gap-2 text-amber-400">
                <BookOpen className="w-5 h-5" />
                <h4 className="text-xs font-black uppercase tracking-wider">Objectif de l'Étape</h4>
              </div>

              <div className="space-y-4 relative">
                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wide leading-relaxed">
                  Chaque étape vous initie de manière pratique à un aspect de la saisie technique Excellence :
                </p>

                <ul className="space-y-3 text-[10.5px] text-slate-300 font-semibold uppercase tracking-wide">
                  <li className="flex items-start gap-2.5">
                    <div className="w-4 h-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5 text-emerald-400">✓</div>
                    <span>Connaître les gabarits</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <div className="w-4 h-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5 text-emerald-400">✓</div>
                    <span>Comprendre le bourrage</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <div className="w-4 h-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5 text-emerald-400">✓</div>
                    <span>Identifier les anomalies</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <div className="w-4 h-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center shrink-0 mt-0.5 text-emerald-400">✓</div>
                    <span>Maîtriser les volées ratées</span>
                  </li>
                </ul>
              </div>

              <div className="border-t border-slate-800 pt-4 text-center">
                <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500 block">
                  Excellence • CHANTIER MINIER (X) 2026
                </span>
              </div>
            </div>

            {/* Video support card with highly polished layout */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs text-center space-y-4">
              <div className="w-12 h-12 bg-[#b8860b]/10 text-[#b8860b] rounded-full flex items-center justify-center mx-auto border border-[#b8860b]/20">
                <Video className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-[11px] font-black uppercase tracking-widest text-slate-900">
                  Support d'Apprentissage SCM
                </h4>
                <p className="text-[10.5px] text-slate-500 font-semibold leading-relaxed mt-1">
                  Visionnez la vidéo officielle de la SMI expliquant le protocole de saisie et de sécurité au poste souterrain.
                </p>
              </div>
              <button
                onClick={() => alert("Lecture du tutoriel vidéo SCM SMI_V1.mp4")}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all cursor-pointer hover:scale-[1.01] shadow-2xs"
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
