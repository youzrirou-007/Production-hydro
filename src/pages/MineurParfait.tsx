import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ChevronDown, 
  ChevronUp, 
  Check, 
  Info, 
  AlertTriangle, 
  HardHat, 
  ArrowRight,
  Sliders,
  Sparkles
} from 'lucide-react';

interface Hole {
  id: string;
  x: number;
  y: number;
  type: string;
  delay: number;
  label: string;
}

const HOLES_12M2_SMI: Hole[] = [
  { id: 'v1', x: 500, y: 400, type: 'vide', delay: 0, label: 'V' },
  { id: 'v2', x: 500, y: 430, type: 'vide', delay: 0, label: 'V' },
  { id: 'v3', x: 500, y: 460, type: 'vide', delay: 0, label: 'V' },
  { id: 'c1', x: 470, y: 400, type: 'charge', delay: 0, label: 'D0' },
  { id: 'c2', x: 470, y: 430, type: 'charge', delay: 0, label: 'D0' },
  { id: 'c3', x: 470, y: 460, type: 'charge', delay: 0, label: 'D0' },
  { id: 'c4', x: 530, y: 400, type: 'charge', delay: 0, label: 'D0' },
  { id: 'c5', x: 530, y: 430, type: 'charge', delay: 0, label: 'D0' },
  { id: 'c6', x: 530, y: 460, type: 'charge', delay: 0, label: 'D0' },
  { id: 'g1_1', x: 430, y: 360, type: 'g1', delay: 25, label: '1' },
  { id: 'g1_2', x: 570, y: 360, type: 'g1', delay: 25, label: '1' },
  { id: 'g1_3', x: 430, y: 500, type: 'g1', delay: 25, label: '1' },
  { id: 'g1_4', x: 570, y: 500, type: 'g1', delay: 25, label: '1' },
  { id: 'g2_1', x: 340, y: 430, type: 'g2', delay: 50, label: '2' },
  { id: 'g2_2', x: 660, y: 430, type: 'g2', delay: 50, label: '2' },
  { id: 'g2_3', x: 500, y: 280, type: 'g2', delay: 50, label: '2' },
  { id: 'g2_4', x: 500, y: 580, type: 'g2', delay: 50, label: '2' },
  { id: 'g3_1', x: 260, y: 240, type: 'g3', delay: 75, label: '3' },
  { id: 'g3_2', x: 740, y: 240, type: 'g3', delay: 75, label: '3' },
  { id: 'g3_3', x: 260, y: 555, type: 'g3', delay: 75, label: '3' },
  { id: 'g3_4', x: 740, y: 555, type: 'g3', delay: 75, label: '3' },
  { id: 'g4_1', x: 180, y: 430, type: 'g4', delay: 100, label: '4' },
  { id: 'g4_2', x: 820, y: 430, type: 'g4', delay: 100, label: '4' },
  { id: 'g4_3', x: 500, y: 170, type: 'g4', delay: 100, label: '4' },
  { id: 'g4_4', x: 500, y: 615, type: 'g4', delay: 100, label: '4' },
  { id: 'rad1', x: 160, y: 635, type: 'radier', delay: 125, label: '5' },
  { id: 'rad2', x: 385, y: 635, type: 'radier', delay: 125, label: '5' },
  { id: 'rad3', x: 615, y: 635, type: 'radier', delay: 125, label: '5' },
  { id: 'rad4', x: 840, y: 635, type: 'radier', delay: 125, label: '5' },
  { id: 'pg1', x: 125, y: 570, type: 'parement', delay: 125, label: '5' },
  { id: 'pg2', x: 125, y: 450, type: 'parement', delay: 125, label: '5' },
  { id: 'pg3', x: 140, y: 330, type: 'parement', delay: 125, label: '5' },
  { id: 'pd1', x: 875, y: 570, type: 'parement', delay: 125, label: '5' },
  { id: 'pd2', x: 875, y: 450, type: 'parement', delay: 125, label: '5' },
  { id: 'pd3', x: 860, y: 330, type: 'parement', delay: 125, label: '5' },
  { id: 'voute_c', x: 500, y: 80, type: 'voute', delay: 125, label: '6' },
  { id: 'voute_g', x: 250, y: 200, type: 'voute', delay: 125, label: '6' },
  { id: 'voute_d', x: 750, y: 200, type: 'voute', delay: 125, label: '6' },
];

const HOLES_12M2_INTL: Hole[] = [
  { id: 'vi1', x: 470, y: 400, type: 'vide', delay: 0, label: 'V' },
  { id: 'vi2', x: 470, y: 430, type: 'vide', delay: 0, label: 'V' },
  { id: 'vi3', x: 470, y: 460, type: 'vide', delay: 0, label: 'V' },
  { id: 'vi4', x: 530, y: 400, type: 'vide', delay: 0, label: 'V' },
  { id: 'vi5', x: 530, y: 430, type: 'vide', delay: 0, label: 'V' },
  { id: 'vi6', x: 530, y: 460, type: 'vide', delay: 0, label: 'V' },
  { id: 'ci1', x: 500, y: 400, type: 'charge', delay: 0, label: 'D0' },
  { id: 'ci2', x: 500, y: 430, type: 'charge', delay: 0, label: 'D0' },
  { id: 'ci3', x: 500, y: 460, type: 'charge', delay: 0, label: 'D0' },
  { id: 'g1_1', x: 430, y: 360, type: 'g1', delay: 25, label: '1' },
  { id: 'g1_2', x: 570, y: 360, type: 'g1', delay: 25, label: '1' },
  { id: 'g1_3', x: 430, y: 500, type: 'g1', delay: 25, label: '1' },
  { id: 'g1_4', x: 570, y: 500, type: 'g1', delay: 25, label: '1' },
  { id: 'g2_1', x: 340, y: 430, type: 'g2', delay: 50, label: '2' },
  { id: 'g2_2', x: 660, y: 430, type: 'g2', delay: 50, label: '2' },
  { id: 'g2_3', x: 500, y: 280, type: 'g2', delay: 50, label: '2' },
  { id: 'g2_4', x: 500, y: 580, type: 'g2', delay: 50, label: '2' },
  { id: 'g3_1', x: 260, y: 240, type: 'g3', delay: 75, label: '3' },
  { id: 'g3_2', x: 740, y: 240, type: 'g3', delay: 75, label: '3' },
  { id: 'g3_3', x: 260, y: 555, type: 'g3', delay: 75, label: '3' },
  { id: 'g3_4', x: 740, y: 555, type: 'g3', delay: 75, label: '3' },
  { id: 'g4_1', x: 180, y: 430, type: 'g4', delay: 100, label: '4' },
  { id: 'g4_2', x: 820, y: 430, type: 'g4', delay: 100, label: '4' },
  { id: 'g4_3', x: 500, y: 170, type: 'g4', delay: 100, label: '4' },
  { id: 'g4_4', x: 500, y: 615, type: 'g4', delay: 100, label: '4' },
  { id: 'rad1', x: 160, y: 635, type: 'radier', delay: 125, label: '5' },
  { id: 'rad2', x: 385, y: 635, type: 'radier', delay: 125, label: '5' },
  { id: 'rad3', x: 615, y: 635, type: 'radier', delay: 125, label: '5' },
  { id: 'rad4', x: 840, y: 635, type: 'radier', delay: 125, label: '5' },
  { id: 'pg1', x: 125, y: 570, type: 'parement', delay: 125, label: '5' },
  { id: 'pg2', x: 125, y: 450, type: 'parement', delay: 125, label: '5' },
  { id: 'pg3', x: 140, y: 330, type: 'parement', delay: 125, label: '5' },
  { id: 'pd1', x: 875, y: 570, type: 'parement', delay: 125, label: '5' },
  { id: 'pd2', x: 875, y: 450, type: 'parement', delay: 125, label: '5' },
  { id: 'pd3', x: 860, y: 330, type: 'parement', delay: 125, label: '5' },
  { id: 'voute_c', x: 500, y: 80, type: 'voute', delay: 125, label: '6' },
  { id: 'voute_g', x: 250, y: 200, type: 'voute', delay: 125, label: '6' },
  { id: 'voute_d', x: 750, y: 200, type: 'voute', delay: 125, label: '6' },
];

const HOLES_9M2: Hole[] = [
  { id: 'v1', x: 500, y: 350, type: 'vide', delay: 0, label: 'V' },
  { id: 'c1', x: 500, y: 310, type: 'charge', delay: 0, label: 'D0' },
  { id: 'c2', x: 500, y: 390, type: 'charge', delay: 0, label: 'D0' },
  { id: 'c3', x: 460, y: 350, type: 'charge', delay: 0, label: 'D0' },
  { id: 'c4', x: 540, y: 350, type: 'charge', delay: 0, label: 'D0' },
  { id: 'g1_1', x: 450, y: 290, type: 'g1', delay: 25, label: '1' },
  { id: 'g1_2', x: 550, y: 290, type: 'g1', delay: 25, label: '1' },
  { id: 'g1_3', x: 450, y: 410, type: 'g1', delay: 25, label: '1' },
  { id: 'g1_4', x: 550, y: 410, type: 'g1', delay: 25, label: '1' },
  { id: 'g2_1', x: 380, y: 350, type: 'g2', delay: 50, label: '2' },
  { id: 'g2_2', x: 620, y: 350, type: 'g2', delay: 50, label: '2' },
  { id: 'g2_3', x: 500, y: 240, type: 'g2', delay: 50, label: '2' },
  { id: 'g2_4', x: 500, y: 460, type: 'g2', delay: 50, label: '2' },
  { id: 'g3_1', x: 340, y: 220, type: 'g3', delay: 75, label: '3' },
  { id: 'g3_2', x: 660, y: 220, type: 'g3', delay: 75, label: '3' },
  { id: 'g3_3', x: 340, y: 480, type: 'g3', delay: 75, label: '3' },
  { id: 'g3_4', x: 660, y: 480, type: 'g3', delay: 75, label: '3' },
  { id: 'rad1', x: 220, y: 580, type: 'radier', delay: 100, label: '4' },
  { id: 'rad2', x: 407, y: 580, type: 'radier', delay: 100, label: '4' },
  { id: 'rad3', x: 593, y: 580, type: 'radier', delay: 100, label: '4' },
  { id: 'rad4', x: 780, y: 580, type: 'radier', delay: 100, label: '4' },
  { id: 'pg1', x: 220, y: 460, type: 'parement', delay: 100, label: '4' },
  { id: 'pg2', x: 220, y: 350, type: 'parement', delay: 100, label: '4' },
  { id: 'pd1', x: 780, y: 460, type: 'parement', delay: 100, label: '4' },
  { id: 'pd2', x: 780, y: 350, type: 'parement', delay: 100, label: '4' },
  { id: 'voute_c', x: 500, y: 110, type: 'voute', delay: 125, label: '5' },
  { id: 'voute_g', x: 280, y: 190, type: 'voute', delay: 125, label: '5' },
  { id: 'voute_d', x: 720, y: 190, type: 'voute', delay: 125, label: '5' },
];

const getCouleur = (type: string) => {
  switch (type) {
    case 'vide': return '#60a5fa';
    case 'charge': return '#fbbf24';
    case 'g1': return '#22c55e';
    case 'g2': return '#f97316';
    case 'g3': return '#06b6d4';
    case 'g4': return '#a855f7';
    case 'radier': return '#8b5cf6';
    case 'parement': return '#2dd4bf';
    case 'voute': return '#f43f5e';
    default: return '#cccccc';
  }
};

const getStroke = (type: string) => {
  switch (type) {
    case 'vide': return '#3b82f6';
    case 'charge': return '#f59e0b';
    case 'g1': return '#16a34a';
    case 'g2': return '#ea580c';
    case 'g3': return '#0891b2';
    case 'g4': return '#9333ea';
    case 'radier': return '#7c3aed';
    case 'parement': return '#14b8a6';
    case 'voute': return '#e11d48';
    default: return '#999999';
  }
};

interface AlertProps {
  type: 'technique' | 'securite' | 'regle';
  text: string;
}

const Alert: React.FC<AlertProps> = ({ type, text }) => {
  if (type === 'technique') {
    return (
      <div className="bg-blue-50 border-l-4 border-blue-600 rounded-r-xl p-3.5 my-3">
        <p className="text-blue-900 text-[11px] font-semibold leading-relaxed">
          💡 {text}
        </p>
      </div>
    );
  }
  if (type === 'securite') {
    return (
      <div className="bg-amber-50 border-l-4 border-amber-600 rounded-r-xl p-3.5 my-3">
        <p className="text-amber-900 text-[11px] font-semibold leading-relaxed">
          ⚠️ {text}
        </p>
      </div>
    );
  }
  return (
    <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 my-3">
      <p className="text-[#b8860b] text-[11px] font-black uppercase tracking-wide leading-relaxed text-center">
        {text}
      </p>
    </div>
  );
};

export const MineurParfait: React.FC = () => {
  const [gabarit, setGabarit] = useState<'12m2' | '12m2_intl' | '9m2'>('12m2');
  const [expandedStep, setExpandedStep] = useState<number | null>(1);
  const [divergenceAngle, setDivergenceAngle] = useState<number>(0);
  const [activeGroup, setActiveGroup] = useState<number | null>(null);
  const [activeLightbox, setActiveLightbox] = useState<'purge' | 'forage' | 'soufflage' | null>(null);

  const drilledCm = 170;
  const lostCm = Math.round(drilledCm * Math.tan(divergenceAngle * Math.PI / 180));
  const effectiveCm = Math.max(0, drilledCm - lostCm);
  const yieldPct = Math.round((effectiveCm / drilledCm) * 100);

  const getVerdictDetails = () => {
    if (divergenceAngle === 0) {
      return { text: 'PARFAIT — 170cm arrachés / 170cm', color: 'text-emerald-600' };
    }
    if (divergenceAngle <= 1) {
      return { text: `EXCELLENT — ${effectiveCm}cm`, color: 'text-emerald-600' };
    }
    if (divergenceAngle <= 2) {
      return { text: `ACCEPTABLE — ${effectiveCm}cm`, color: 'text-amber-600' };
    }
    if (divergenceAngle <= 3) {
      return { text: `ATTENTION — ${effectiveCm}cm`, color: 'text-orange-600' };
    }
    return { text: `CRITIQUE — ${effectiveCm}cm — REFORER`, color: 'text-rose-600' };
  };

  const verdict = getVerdictDetails();

  const getHolesData = () => {
    if (gabarit === '12m2') return HOLES_12M2_SMI;
    if (gabarit === '12m2_intl') return HOLES_12M2_INTL;
    return HOLES_9M2;
  };

  const holes = getHolesData();

  const toggleStep = (stepNumber: number) => {
    setExpandedStep(expandedStep === stepNumber ? null : stepNumber);
  };

  const renderStepHeader = (num: number, icon: string, title: string, cat: 'FORAGE' | 'EXPLOSIFS' | 'TECHNIQUE' | 'SÉCURITÉ') => {
    const isOpen = expandedStep === num;
    const catStyles = {
      FORAGE: 'bg-blue-50 text-blue-700 border border-blue-200',
      EXPLOSIFS: 'bg-rose-50 text-rose-700 border border-rose-200',
      TECHNIQUE: 'bg-slate-100 text-slate-700 border border-slate-200',
      SÉCURITÉ: 'bg-amber-50 text-amber-800 border border-amber-200',
    };

    return (
      <div 
        onClick={() => toggleStep(num)}
        className="p-5 flex items-center justify-between cursor-pointer select-none bg-slate-50/40 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-br from-amber-400 to-[#b8860b] text-white font-black text-sm w-9 h-9 flex items-center justify-center rounded-full shadow-xs">
            {num}
          </div>
          <span className="text-2xl">{icon}</span>
          <h3 className="font-bold text-slate-800 text-[14px] uppercase tracking-wide">
            {title}
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full tracking-wider ${catStyles[cat]}`}>
            {cat}
          </span>
          {isOpen ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white text-slate-800 pb-24 font-sans">
      <div className="max-w-4xl mx-auto px-4">
        {/* Premium Hydromines Gold Banner - Identical to EspaceDT */}
        <div 
          className="bg-white p-6 sm:p-8 rounded-3xl border border-[#b8860b]/15 shadow-lg relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 mb-6 mt-6"
          style={{ boxShadow: '0 4px 20px -2px rgba(184, 134, 11, 0.04), 0 1px 3px rgba(0,0,0,0.05)' }}
        >
          {/* Background Subtle Shimmer */}
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-amber-500/5 animate-pulse pointer-events-none" />
          
          <div className="flex items-center gap-5 z-10 text-center md:text-left flex-col md:flex-row">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-[#b8860b] flex items-center justify-center shadow-md shrink-0 relative overflow-hidden">
              <svg viewBox="0 0 100 100" className="w-12 h-12 drop-shadow-md">
                {/* White safety helmet contours */}
                <path 
                  d="M 15 55 C 15 28, 85 28, 85 55 C 85 57, 87 59, 83 59 L 17 59 C 13 59, 15 57, 15 55 Z" 
                  fill="#f8fafc" 
                  stroke="#e2e8f0" 
                  strokeWidth="1.5" 
                />
                {/* Helmet visor/brim */}
                <path 
                  d="M 10 58 L 90 58 C 93 58, 93 61, 90 62 L 10 62 C 7 62, 7 58, 10 58 Z" 
                  fill="#f1f5f9" 
                  stroke="#cbd5e1" 
                  strokeWidth="1" 
                />
                {/* Helmet center ridge/rib */}
                <path 
                  d="M 45 31 C 45 31, 50 28, 50 41 L 50 57 L 46 57 Z" 
                  fill="#e2e8f0" 
                />
                <path 
                  d="M 50 31 C 50 31, 55 28, 55 41 L 55 57 L 54 57 Z" 
                  fill="#cbd5e1" 
                />
                {/* Headlamp bracket (dark slate) */}
                <rect x="41" y="46" width="18" height="9" rx="1.5" fill="#334155" stroke="#1e293b" strokeWidth="1" />
                {/* Headlamp body & glass/reflector */}
                <circle cx="50" cy="50.5" r="5.5" fill="#fef08a" stroke="#ca8a04" strokeWidth="1" />
                {/* Headlamp lens center shine */}
                <circle cx="48.5" cy="49" r="1.5" fill="#ffffff" />
                {/* Light beam cone emission */}
                <polygon 
                  points="50 51, 15 95, 85 95" 
                  fill="url(#helmet-light-beam)" 
                  opacity="0.2" 
                />
                <defs>
                  <linearGradient id="helmet-light-beam" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fef08a" stopOpacity="0.8" />
                    <stop offset="100%" stopColor="#eab308" stopOpacity="0" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
            <div>
              <div className="subtle-glow-line w-24 mb-1.5 mx-auto md:mx-0 opacity-80" />
              <h1 className="gold-title text-xl sm:text-2xl md:text-3xl font-black tracking-wider leading-none uppercase">
                LE MINEUR PARFAIT
              </h1>
              <div className="subtle-glow-line w-full mt-2 mb-2.5 opacity-80" />
              <p className="text-[10px] sm:text-xs font-black uppercase text-slate-500 tracking-widest">
                SMI IMITER — PROCÉDURES OPÉRATIONNELLES DE FORAGE & TIR DE PERFORMANCE
              </p>
            </div>
          </div>

          {/* Welcome Card & Bilan summary on the right side - representing the 25% Hydromines Touch */}
          <div className="bg-slate-50 border border-amber-500/20 rounded-2xl p-4 flex flex-col items-center justify-center text-center z-10 w-full md:w-56 shrink-0 shadow-xs">
            <div className="text-[#b8860b] text-[8px] font-black uppercase tracking-wider">
              Rendement Cible
            </div>
            <div className="text-slate-800 text-[12px] font-black uppercase flex items-center gap-1.5 mt-1">
              🎯 EXCELLENCE 100%
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mt-1">
              Du Bouchon au Registre
            </p>
          </div>
        </div>

        <div className="space-y-4">

          {/* STEP 1 */}
          <div className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden ${expandedStep === 1 ? 'border-[#b8860b]/60 shadow-[0_4px_20px_rgba(184,134,11,0.08)]' : 'border-slate-100 hover:border-[#b8860b]/20 shadow-xs'}`}>
            {renderStepHeader(1, '📋', 'PRISE DE POSTE & CONSIGNES TECHNIQUES', 'TECHNIQUE')}
            <AnimatePresence initial={false}>
              {expandedStep === 1 && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-slate-100 p-6 bg-white text-xs text-slate-600 leading-relaxed"
                >
                  <p className="font-bold text-slate-800 text-sm mb-4">
                    Ce que vous recevez du poste précédent conditionne votre efficacité et votre sécurité pour toute la journée.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                      <div className="font-black text-[#b8860b] uppercase text-[10px] tracking-wider mb-1">📍 Avancement du chantier</div>
                      <p>Métrage réalisé au poste précédent. Position actuelle du front.</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                      <div className="font-black text-[#b8860b] uppercase text-[10px] tracking-wider mb-1">💥 État de la dernière volée</div>
                      <p>Trous ratés ? Raté non tiré ? Culots résiduels signalés ?</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                      <div className="font-black text-[#b8860b] uppercase text-[10px] tracking-wider mb-1">🌬️ État de la ventilation</div>
                      <p>Galerie aérée ? Depuis combien de temps ? CO résiduel ?</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                      <div className="font-black text-[#b8860b] uppercase text-[10px] tracking-wider mb-1">🔧 Matériel disponible</div>
                      <p>Perforateur opérationnel ? Flexibles en état ? Consommables ?</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                      <div className="font-black text-[#b8860b] uppercase text-[10px] tracking-wider mb-1">📦 Stock explosifs</div>
                      <p>ANFO disponible, TOVEX, amorces — quantités suffisantes ?</p>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                      <div className="font-black text-[#b8860b] uppercase text-[10px] tracking-wider mb-1">⚠️ Anomalies signalées</div>
                      <p>Zones instables, infiltrations eau, incidents du poste précédent</p>
                    </div>
                  </div>
                  <Alert type="securite" text="Un trou raté non signalé par le poste précédent est un danger mortel. Exiger la confirmation explicite de l'état des trous avant d'entrer dans la galerie." />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* STEP 2 */}
          <div className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden ${expandedStep === 2 ? 'border-[#b8860b]/60 shadow-[0_4px_20px_rgba(184,134,11,0.08)]' : 'border-slate-100 hover:border-[#b8860b]/20 shadow-xs'}`}>
            {renderStepHeader(2, '🌬', 'VÉRIFICATION DE L\'AÉRAGE', 'TECHNIQUE')}
            <AnimatePresence initial={false}>
              {expandedStep === 2 && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-slate-100 p-6 bg-white text-xs text-slate-600 leading-relaxed"
                >
                  <p className="font-bold text-slate-800 text-sm mb-4">
                    L'aérage est la première vérification technique avant toute entrée en galerie. Une galerie mal ventilée contient du CO (monoxyde de carbone) et des fumées nitreuses post-tir invisibles et mortels.
                  </p>
                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-200/60 space-y-3.5">
                    <h4 className="font-black uppercase text-[10px] tracking-widest text-slate-500">Procédure de vérification :</h4>
                    <ol className="list-decimal pl-5 space-y-2.5 text-slate-700 font-medium">
                      <li>Vérifier le débit d'air à l'entrée de la galerie — flux d'air perceptible sur la peau du visage</li>
                      <li>Contrôler l'état du ventilateur et du tubage souple (manchette) : aucun pli, aucune déchirure, raccords étanches</li>
                      <li>En présence d'un détecteur CO : mesure &lt; 25 ppm avant entrée</li>
                      <li>Délai post-tir minimum à respecter : 30 minutes de ventilation avant tout accès au chantier</li>
                      <li>Vérifier que l'air circule jusqu'au FRONT DE TAILLE — pas seulement à l'entrée de la galerie</li>
                    </ol>
                  </div>
                  <Alert type="regle" text="L'aérage n'est pas optionnel. Si la ventilation est insuffisante — STOP — le travail est interdit jusqu'au rétablissement d'un débit conforme." />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* STEP 3 */}
          <div className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden ${expandedStep === 3 ? 'border-[#b8860b]/60 shadow-[0_4px_20px_rgba(184,134,11,0.08)]' : 'border-slate-100 hover:border-[#b8860b]/20 shadow-xs'}`}>
            {renderStepHeader(3, '💧', 'ARROSAGE DU CHANTIER', 'TECHNIQUE')}
            <AnimatePresence initial={false}>
              {expandedStep === 3 && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-slate-100 p-6 bg-white text-xs text-slate-600 leading-relaxed"
                >
                  <p className="font-bold text-slate-800 text-sm mb-4">
                    L'arrosage précède toujours la purge. L'eau humidifie la roche et révèle les fissures, les zones de décollement et les blocs instables invisibles à l'œil sec. Un chantier mal arrosé cache ses dangers.
                  </p>
                  <Alert type="regle" text="L'eau révèle ce que l'œil ne voit pas sur roche sèche. Arroser = préparer une purge efficace." />
                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-200/60 space-y-3.5 mt-4">
                    <h4 className="font-black uppercase text-[10px] tracking-widest text-slate-500">Procédure d'arrosage :</h4>
                    <ol className="list-decimal pl-5 space-y-2.5 text-slate-700 font-medium">
                      <li>Connecter le flexible d'eau à la conduite de chantier</li>
                      <li>Arroser le FRONT DE TAILLE en premier : zones fissurées, joints de stratification, discontinuités visibles</li>
                      <li>Arroser la VOÛTE sur 15m minimum depuis le front — les zones humides qui ressortent signalent des fissures ouvertes</li>
                      <li>Arroser les PAREMENTS (murs latéraux) de haut en bas</li>
                      <li>Arroser le SOL — lutte contre la poussière de silice</li>
                      <li>Le chantier est correctement arrosé quand aucun nuage de poussière ne se soulève lors des déplacements</li>
                    </ol>
                  </div>
                  <Alert type="securite" text="La poussière de roche contient de la silice libre. Inhalation chronique = silicose professionnelle irréversible. L'arrosage protège les poumons pour toute la carrière du mineur." />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* STEP 4 */}
          <div className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden ${expandedStep === 4 ? 'border-[#b8860b]/60 shadow-[0_4px_20px_rgba(184,134,11,0.08)]' : 'border-slate-100 hover:border-[#b8860b]/20 shadow-xs'}`}>
            {renderStepHeader(4, '⛏️', 'PURGE DU CHANTIER', 'SÉCURITÉ')}
            <AnimatePresence initial={false}>
              {expandedStep === 4 && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-slate-100 p-6 bg-white text-xs text-slate-600 leading-relaxed"
                >
                  <Alert type="regle" text="« La chute de blocs est le premier ennemi dans les mines souterraines »" />
                  <p className="font-bold text-slate-800 text-sm mb-4">
                    La purge consiste à désolidariser tous les blocs instables de la voûte et des parements sur 15 mètres minimum depuis le front de taille. Elle se fait APRÈS l'arrosage, quand la roche a révélé ses fissures.
                  </p>

                  {/* HIGH-FIDELITY VECTOR ILLUSTRATION FOR PURGE */}
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/60 flex flex-col md:flex-row gap-6 items-center my-5">
                    <div className="w-full md:w-1/2 space-y-3">
                      <div>
                        <span className="text-[10px] font-black text-[#b8860b] uppercase tracking-wider block">Équipement Certifié SMI</span>
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide">Pince à Purger & Bec de Purge Type 2</h4>
                      </div>
                      <p className="text-slate-600 leading-relaxed text-[11px]">
                        La pince à purger est une barre robuste en acier spécial ou alliage léger d'aluminium haute résistance, conçue spécifiquement pour la purge minière manuelle.
                      </p>
                      <p className="text-slate-600 leading-relaxed text-[11px]">
                        Le <strong>bec de purge de Type 2 (Spécification SMI Imiter)</strong> possède un angle de levier optimisé et un tranchant trempé double biseau. Il permet de s'insérer précisément dans les fractures de décollement pour déloger mécaniquement les dalles instables à distance de sécurité.
                      </p>
                    </div>
                    <div className="w-full md:w-1/2 bg-white rounded-xl p-3 border border-slate-200/50 flex flex-col items-center justify-center shadow-xs">
                      <svg viewBox="0 0 400 220" className="w-full h-auto max-w-[280px]">
                        <defs>
                          {/* Rock texture gradient */}
                          <linearGradient id="rock-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                            <stop offset="0%" stopColor="#475569" />
                            <stop offset="50%" stopColor="#334155" />
                            <stop offset="100%" stopColor="#1e293b" />
                          </linearGradient>
                          {/* Loose slab gradient */}
                          <linearGradient id="slab-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="#64748b" />
                            <stop offset="100%" stopColor="#475569" />
                          </linearGradient>
                          {/* Metal rod gradient */}
                          <linearGradient id="metal-rod" x1="0%" y1="0%" x2="100%" y2="0%">
                            <stop offset="0%" stopColor="#cbd5e1" />
                            <stop offset="50%" stopColor="#f1f5f9" />
                            <stop offset="100%" stopColor="#94a3b8" />
                          </linearGradient>
                          {/* Gold accent for highlighting active areas */}
                          <radialGradient id="glow-gold" cx="50%" cy="50%" r="50%">
                            <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
                          </radialGradient>
                        </defs>

                        {/* Background Rock Texture with strata */}
                        <rect x="5" y="5" width="390" height="210" rx="10" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1" />
                        
                        {/* Upper solid rock mass */}
                        <path d="M 5 5 C 100 8, 300 12, 395 5 L 395 55 C 320 50, 240 55, 170 45 C 130 40, 90 42, 5 40 Z" fill="url(#rock-grad)" />
                        
                        {/* Quartz gold vein running through solid rock */}
                        <path d="M 5 18 Q 80 25, 160 20 T 395 15" stroke="#d97706" strokeWidth="3.5" fill="none" opacity="0.65" strokeDasharray="15 3 5 4" />
                        <path d="M 5 18 Q 80 25, 160 20 T 395 15" stroke="#fef08a" strokeWidth="1" fill="none" opacity="0.8" />
                        
                        {/* The unstable fractured cloche (slab) hanging down */}
                        {/* This shows the real fracture line with water seepage (dark red/blue) */}
                        <path d="M 40 41 Q 120 70, 200 60 L 220 44" stroke="#dc2626" strokeWidth="2" strokeDasharray="3 1" fill="none" />
                        <path d="M 40 41 Q 120 70, 200 60 L 215 45 Z" fill="url(#slab-grad)" stroke="#1e293b" strokeWidth="1" />
                        
                        {/* Seeping water droplets from fracture */}
                        <circle cx="100" cy="58" r="1.5" fill="#3b82f6" opacity="0.8" />
                        <circle cx="150" cy="62" r="1.2" fill="#3b82f6" opacity="0.8" />
                        
                        {/* Detailed falling blocks (the block that is being scaled off) */}
                        <g transform="translate(0, 10)">
                          {/* Falling stone 1 */}
                          <path d="M 120 90 L 145 88 L 150 110 L 125 115 Z" fill="#475569" stroke="#334155" strokeWidth="1" />
                          {/* Falling stone 2 */}
                          <path d="M 160 100 L 175 95 L 180 112 L 165 115 Z" fill="#64748b" stroke="#334155" strokeWidth="1" />
                          
                          {/* Speed/gravity lines for falling stone */}
                          <line x1="135" y1="75" x2="135" y2="85" stroke="#94a3b8" strokeWidth="1" />
                          <line x1="170" y1="85" x2="170" y2="92" stroke="#94a3b8" strokeWidth="1" />
                          <line x1="145" y1="118" x2="145" y2="128" stroke="#94a3b8" strokeWidth="1" />
                          
                          {/* Force/Chute indicators */}
                          <path d="M 145 130 L 145 142 M 145 142 L 141 137 M 145 142 L 149 137" stroke="#dc2626" strokeWidth="1.5" fill="none" />
                          <text x="153" y="141" fill="#dc2626" fontSize="8" fontWeight="bold" fontFamily="Arial">CHUTE LIBRE</text>
                        </g>

                        {/* Solid Rock floor representation at the bottom */}
                        <path d="M 5 215 Q 120 210, 240 215 T 395 210" stroke="#cbd5e1" strokeWidth="2" fill="none" />

                        {/* Purging scale bar (Pince à purger) */}
                        {/* Shows real metal hexagonal thickness and the double biseau angle tip */}
                        {/* Tip coordinates: (116, 56) at the fracture site */}
                        <g>
                          {/* Glow at contact point */}
                          <circle cx="118" cy="54" r="16" fill="url(#glow-gold)" />
                          
                          {/* The long hexagonal rod */}
                          <line x1="340" y1="180" x2="128" y2="60" stroke="url(#metal-rod)" strokeWidth="4.5" strokeLinecap="butt" />
                          {/* Steel details/shadows on the rod */}
                          <line x1="340" y1="180" x2="128" y2="60" stroke="#475569" strokeWidth="0.8" opacity="0.4" />
                          
                          {/* Rubber handle sleeve at the end */}
                          <line x1="340" y1="180" x2="280" y2="146" stroke="#1e293b" strokeWidth="5.5" strokeLinecap="round" />
                          {/* Safety hand guard ring */}
                          <circle cx="280" cy="146" r="4" fill="#d97706" />

                          {/* Bec de Purge Type 2 (SMI Spec) detailed wedge tip inserted in crack */}
                          {/* It is double-beveled: one sharp chisel side, one lever flat side */}
                          <path d="M 128 60 L 112 51 C 110 50, 109 52, 111 54 L 124 63 Z" fill="#94a3b8" stroke="#1e293b" strokeWidth="0.8" /> {/* Main Bevel */}
                          <path d="M 128 60 L 115 67 C 113 68, 112 66, 114 64 L 126 61 Z" fill="#475569" stroke="#1e293b" strokeWidth="0.8" /> {/* Secondary Bevel */}
                        </g>
                        
                        {/* Circle highlight around the double bevel chisel tip */}
                        <circle cx="118" cy="58" r="14" fill="none" stroke="#d97706" strokeWidth="1" strokeDasharray="3 2" />
                        
                        {/* Explanatory Technical Annotations */}
                        <text x="210" y="105" fill="#475569" fontSize="8" fontWeight="bold" fontFamily="Arial">Manche rigide en alliage d'aluminium</text>
                        <path d="M 210 108 L 220 120" stroke="#94a3b8" strokeWidth="0.8" fill="none" />
                        
                        <text x="50" y="90" fill="#d97706" fontSize="8" fontWeight="black" fontFamily="Arial">Wedge Type 2 (35°)</text>
                        <path d="M 100 87 Q 112 85, 116 68" stroke="#d97706" strokeWidth="0.8" fill="none" strokeDasharray="2 1" />
                        
                        <text x="235" y="45" fill="#ef4444" fontSize="8" fontWeight="black" fontFamily="Arial">Fissure humide d'arrosage</text>
                        <path d="M 230 43 L 180 50" stroke="#ef4444" strokeWidth="0.8" fill="none" />
                        
                        <text x="200" y="195" fill="#1e293b" fontSize="8" fontWeight="bold" fontFamily="Arial">Position de sécurité du mineur (Sous toit sain)</text>
                      </svg>
                      
                      <motion.button 
                        onClick={() => setActiveLightbox('purge')}
                        className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg select-none transition-all relative overflow-hidden shadow-none cursor-pointer"
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        id="btn-zoom-purge"
                      >
                        <motion.div 
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                          initial={{ x: '-100%' }}
                          animate={{ x: '100%' }}
                          transition={{ repeat: Infinity, repeatType: 'loop', duration: 2.2, ease: 'linear' }}
                        />
                        <span className="relative z-10 flex items-center gap-1.5">
                          <span className="text-slate-400">🔍</span>
                          <span>Agrandir l'image</span>
                        </span>
                      </motion.button>

                      <div className="flex gap-4 text-[9px] text-slate-500 font-bold uppercase mt-1 border-t border-slate-100 pt-2 w-full justify-around">
                        <span className="flex items-center gap-1">🔘 Manche acier/alu : légère & rigide</span>
                        <span className="flex items-center gap-1">📐 Bec Type 2 : angle levier 35°</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-200/60 space-y-3">
                    <h4 className="font-black text-[#b8860b] uppercase text-[10px] tracking-widest">Règles absolues :</h4>
                    <ul className="list-disc pl-5 space-y-2.5 text-slate-700 font-medium">
                      <li>AUCUNE MACHINE EN FONCTIONNEMENT pendant la purge — L'écoute des vibrations et craquements est essentielle</li>
                      <li>Se positionner TOUJOURS hors de la zone de chute potentielle — jamais sous un bloc en cours de purge</li>
                      <li>Frapper méthodiquement la voûte et les parements — SON CREUX = bloc instable à purger immédiatement | SON PLEIN = roche stable, continuer</li>
                      <li>La purge est terminée quand 100% des zones testées donnent un son plein — pas 99%</li>
                      <li>Distance de travail : 15m minimum depuis le front</li>
                    </ul>
                  </div>
                  <Alert type="securite" text="Un bloc non purgé peut tomber lors du forage ou du chargement. Un seul bloc suffit. La purge n'est jamais abrégée." />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* STEP 5 */}
          <div className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden ${expandedStep === 5 ? 'border-[#b8860b]/60 shadow-[0_4px_20px_rgba(184,134,11,0.08)]' : 'border-slate-100 hover:border-[#b8860b]/20 shadow-xs'}`}>
            {renderStepHeader(5, '🔧', 'VÉRIFICATION MATÉRIEL FORAGE', 'TECHNIQUE')}
            <AnimatePresence initial={false}>
              {expandedStep === 5 && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-slate-100 p-6 bg-white text-xs text-slate-600 leading-relaxed"
                >
                  <p className="font-bold text-slate-800 text-sm mb-4">
                    Avant de démarrer le perforateur, chaque composant est inspecté. Un flexible qui éclate sous 10 bars est une arme dans la galerie.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <div className="bg-slate-50 p-5 rounded-xl border border-slate-200/60">
                        <h4 className="font-black text-[#b8860b] uppercase text-[10px] tracking-widest mb-3">🔩 Montabert T23 — Checklist</h4>
                        <ul className="space-y-2 text-slate-700 font-medium">
                          <li>☐ Taillant bouton 38mm : serré et non usé</li>
                          <li>☐ Lubrificateur d'air : niveau huile suffisant</li>
                          <li>☐ Raccord d'eau de forage : connexion étanche</li>
                          <li>☐ Boulon de fixation barre de guidage : serré</li>
                          <li>☐ Silencieux et protège-taillant : en place</li>
                        </ul>
                      </div>
                      <div className="bg-slate-50 p-5 rounded-xl border border-slate-200/60">
                        <h4 className="font-black text-[#b8860b] uppercase text-[10px] tracking-widest mb-3">🌬️ Flexibles — Anti-éclatement</h4>
                        <ul className="space-y-2 text-slate-700 font-medium">
                          <li>☐ Aucune coupure, boursouflure ou usure</li>
                          <li>☐ Raccord d'air comprimé protégé par :<br/><span className="text-slate-500 pl-4">→ Colliers de sécurité ou câbles anti-fouet</span></li>
                          <li>☐ Attaches et colliers serrés des deux côtés</li>
                          <li>☐ Flexible d'eau de forage (2 pouces) : état vérifié</li>
                        </ul>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 flex flex-col items-center justify-center">
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Schéma Technique — Matériel SMI</span>
                      <div className="bg-white rounded-xl p-3 border border-slate-200/40 w-full flex items-center justify-center shadow-xs">
                        <svg viewBox="0 0 400 240" className="w-full h-auto max-w-[290px]">
                          <defs>
                            {/* Green Montabert Paint Gradient */}
                            <linearGradient id="montabert-paint" x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor="#22c55e" />
                              <stop offset="30%" stopColor="#16a34a" />
                              <stop offset="70%" stopColor="#15803d" />
                              <stop offset="100%" stopColor="#14532d" />
                            </linearGradient>
                            {/* Shiny Steel/Chrome Gradient for piston and shafts */}
                            <linearGradient id="shiny-steel" x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor="#f1f5f9" />
                              <stop offset="30%" stopColor="#cbd5e1" />
                              <stop offset="70%" stopColor="#94a3b8" />
                              <stop offset="100%" stopColor="#475569" />
                            </linearGradient>
                            {/* Dark Cast Iron/Steel Gradient */}
                            <linearGradient id="dark-steel" x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor="#475569" />
                              <stop offset="50%" stopColor="#334155" />
                              <stop offset="100%" stopColor="#1e293b" />
                            </linearGradient>
                            {/* Yellow safety hose */}
                            <linearGradient id="yellow-hose" x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor="#fef08a" />
                              <stop offset="50%" stopColor="#eab308" />
                              <stop offset="100%" stopColor="#ca8a04" />
                            </linearGradient>
                          </defs>

                          {/* Background Grid Plate */}
                          <rect x="5" y="5" width="390" height="230" rx="10" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1" />
                          
                          {/* ZOOM CONTAINER FOR THE 38mm BUTTON BIT (TAILLANT) */}
                          {/* Positioned top left */}
                          <g transform="translate(10, 10)">
                            {/* Circular zoom border */}
                            <circle cx="40" cy="40" r="30" fill="#ffffff" stroke="#15803d" strokeWidth="1.5" />
                            {/* Circular zoom inner backdrop */}
                            <circle cx="40" cy="40" r="28.5" fill="#f1f5f9" />
                            {/* 3D button bit drawing inside zoom */}
                            {/* Bit Body */}
                            <path d="M 22 40 L 32 30 L 52 30 L 58 40 L 54 52 L 26 52 Z" fill="url(#shiny-steel)" stroke="#334155" strokeWidth="1" />
                            <rect x="32" y="34" width="16" height="12" fill="none" stroke="#475569" strokeWidth="1" />
                            {/* Tungsten carbide studs (buttons) */}
                            <circle cx="27" cy="40" r="3" fill="#fbbf24" stroke="#d97706" strokeWidth="0.8" /> {/* Side button */}
                            <circle cx="34" cy="32" r="3" fill="#fbbf24" stroke="#d97706" strokeWidth="0.8" /> {/* Front button */}
                            <circle cx="46" cy="32" r="3" fill="#fbbf24" stroke="#d97706" strokeWidth="0.8" /> {/* Front button */}
                            <circle cx="53" cy="40" r="3" fill="#fbbf24" stroke="#d97706" strokeWidth="0.8" /> {/* Side button */}
                            <circle cx="40" cy="42" r="4" fill="#fbbf24" stroke="#d97706" strokeWidth="0.8" /> {/* Center button */}
                            {/* Water flushing holes in bit face */}
                            <circle cx="34" cy="46" r="2" fill="#1e293b" />
                            <circle cx="46" cy="46" r="2" fill="#1e293b" />
                            
                            {/* Annotation label */}
                            <text x="40" y="82" fill="#15803d" fontSize="7" fontWeight="black" textAnchor="middle" fontFamily="Arial">TAILLANT BOUTONS</text>
                            {/* Zoom link lines */}
                            <path d="M 68 49 L 105 85" stroke="#15803d" strokeWidth="0.8" strokeDasharray="2 2" fill="none" />
                          </g>

                          {/* MAIN DRILL STEEL / FLEURET ASSEMBLY */}
                          {/* Drill steel extends from the machine chuck (x=160, y=95) to the front face */}
                          <line x1="80" y1="95" x2="160" y2="95" stroke="url(#shiny-steel)" strokeWidth="4" />
                          {/* Hexagonal steel texture lines */}
                          <line x1="80" y1="94" x2="160" y2="94" stroke="#f8fafc" strokeWidth="0.8" opacity="0.6" />
                          
                          {/* Standard collars/shims on the drill steel */}
                          <rect x="145" y="91" width="4" height="8" fill="#475569" stroke="#1e293b" strokeWidth="0.8" /> {/* Collar */}
                          
                          {/* The actual drill bit at the front end */}
                          <path d="M 70 91 L 76 91 L 78 88 L 82 88 L 84 91 L 86 95 L 84 99 L 82 102 L 78 102 L 76 99 L 70 99 Z" fill="url(#shiny-steel)" stroke="#1e293b" strokeWidth="1" />
                          <circle cx="78" cy="95" r="1" fill="#fbbf24" />
                          <circle cx="82" cy="92" r="0.8" fill="#fbbf24" />
                          <circle cx="82" cy="98" r="0.8" fill="#fbbf24" />

                          {/* MONTABERT T23 PNEUMATIC DRILL BODY */}
                          {/* Highly realistic forged steel body with distinct components */}
                          {/* Chuck/Fronthead (x=160 to x=180) */}
                          <path d="M 160 87 L 180 87 L 180 103 L 160 103 Z" fill="url(#dark-steel)" stroke="#1e293b" strokeWidth="1.2" />
                          
                          {/* Main Cylinder body with cooling/strengthening structural ridges (x=180 to x=225) */}
                          <path d="M 180 82 L 225 82 L 225 108 L 180 108 Z" fill="url(#montabert-paint)" stroke="#14532d" strokeWidth="1.2" />
                          {/* Structural ribs/channels for heat dissipation */}
                          <rect x="187" y="85" width="4" height="20" fill="#15803d" opacity="0.4" />
                          <rect x="196" y="85" width="4" height="20" fill="#15803d" opacity="0.4" />
                          <rect x="205" y="85" width="4" height="20" fill="#15803d" opacity="0.4" />
                          <rect x="214" y="85" width="4" height="20" fill="#15803d" opacity="0.4" />
                          
                          {/* Horizontal side tension rods (Tirants de liaison) holding drill components together */}
                          <line x1="162" y1="84" x2="242" y2="84" stroke="url(#shiny-steel)" strokeWidth="2.5" />
                          <line x1="162" y1="106" x2="242" y2="106" stroke="url(#shiny-steel)" strokeWidth="2.5" />
                          {/* Nuts on the rods */}
                          <rect x="158" y="82" width="3" height="5" rx="0.5" fill="#1e293b" />
                          <rect x="158" y="104" width="3" height="5" rx="0.5" fill="#1e293b" />
                          <rect x="241" y="82" width="3" height="5" rx="0.5" fill="#1e293b" />
                          <rect x="241" y="104" width="3" height="5" rx="0.5" fill="#1e293b" />

                          {/* Control Backhead (tête arrière) x=225 to x=245 */}
                          <path d="M 225 85 L 245 85 L 245 105 L 225 105 Z" fill="url(#dark-steel)" stroke="#1e293b" strokeWidth="1" />
                          
                          {/* Throttle Control Lever (Levier de commande d'air) at the back */}
                          <path d="M 240 85 L 255 70 C 257 68, 259 70, 257 72 L 245 92 Z" fill="url(#shiny-steel)" stroke="#1e293b" strokeWidth="1" />
                          {/* Red handle knob */}
                          <circle cx="256" cy="70" r="3.5" fill="#ef4444" stroke="#b91c1c" strokeWidth="0.8" />
                          
                          {/* Water inlet valve at the backhead base */}
                          <rect x="235" y="105" width="8" height="6" fill="url(#shiny-steel)" stroke="#1e293b" strokeWidth="0.8" />

                          {/* TELESCOPIC PNEUMATIC JACKLEG (POUSSOIR) CONNECTION AT RIGHT EDGE */}
                          {/* Pivot point swivel hinge on the drill body - shifted to right edge */}
                          <rect x="230" y="108" width="10" height="8" fill="url(#dark-steel)" stroke="#1e293b" strokeWidth="1" />
                          <circle cx="235" cy="112" r="3" fill="#fbbf24" stroke="#d97706" strokeWidth="1" /> {/* Joint Pin */}

                          {/* Telescopic pusher cylinder sleeve (Vérin) */}
                          {/* Outer Sleeve (Strong charcoal/grey) */}
                          <line x1="235" y1="114" x2="285" y2="190" stroke="#475569" strokeWidth="7" strokeLinecap="round" />
                          <line x1="235" y1="114" x2="285" y2="190" stroke="url(#shiny-steel)" strokeWidth="3" strokeLinecap="round" />
                          {/* Inner telescopic piston rod (Shiny chrome extension) */}
                          <line x1="285" y1="190" x2="307" y2="223" stroke="url(#shiny-steel)" strokeWidth="3.5" strokeLinecap="round" />
                          {/* Base spade claw anchor (Foot double-claw) */}
                          <path d="M 307 223 L 300 228 L 315 231 L 313 221 Z" fill="#1e293b" stroke="#000" strokeWidth="1" />
                          {/* Anchor claw spike detailing */}
                          <polygon points="303 226, 295 231, 301 233" fill="#1e293b" />
                          <polygon points="309 227, 315 234, 309 233" fill="#1e293b" />

                          {/* HIGH-PRESSURE AIR AND WATER HOSES */}
                          {/* Blue water hose (Forage à l'eau to prevent silicosis) */}
                          <path d="M 238 108 C 242 120, 265 140, 310 150" stroke="#0ea5e9" strokeWidth="3" fill="none" strokeLinecap="round" />
                          {/* Heavy duty high pressure yellow/black Air hose (2 inches) */}
                          <path d="M 245 98 C 260 115, 290 125, 335 135" stroke="url(#yellow-hose)" strokeWidth="5.5" fill="none" strokeLinecap="round" />
                          {/* Black striped segments on the yellow air hose for extreme realism */}
                          <path d="M 245 98 C 260 115, 290 125, 335 135" stroke="#1e293b" strokeWidth="5.5" fill="none" strokeDasharray="3 8" strokeLinecap="round" opacity="0.75" />
                          
                          {/* Steel safety whipcheck clip (Câble anti-fouet) */}
                          {/* Linking the high pressure hose to the drill's backhead */}
                          <path d="M 245 92 Q 262 102 278 110" stroke="#cbd5e1" strokeWidth="1.2" fill="none" />
                          <path d="M 245 92 Q 262 102 278 110" stroke="#64748b" strokeWidth="0.5" fill="none" />
                          {/* Spring and safety loop indicators */}
                          <circle cx="245" cy="92" r="2" fill="#64748b" />
                          <circle cx="278" cy="110" r="2" fill="#64748b" />

                          {/* EXPLICIT BLUEPRINT LABELS & ANNOTATIONS */}
                          <text x="145" y="55" fill="#15803d" fontSize="8" fontWeight="black" fontFamily="Arial">MONTABERT T23 (SMI)</text>
                          <path d="M 195 58 L 195 81" stroke="#15803d" strokeWidth="0.8" fill="none" />
                          
                          <text x="320" y="125" fill="#d97706" fontSize="7.5" fontWeight="bold" fontFamily="Arial">Air 2" (7 bar)</text>
                          <text x="290" y="165" fill="#0284c7" fontSize="7.5" fontWeight="bold" fontFamily="Arial">Eau de rinçage</text>
                          
                          <text x="285" y="100" fill="#475569" fontSize="7" fontWeight="bold" fontFamily="Arial">Câble Whipcheck</text>
                          <path d="M 280 102 L 265 103" stroke="#94a3b8" strokeWidth="0.6" fill="none" />

                          <text x="105" y="150" fill="#475569" fontSize="8" fontWeight="bold" fontFamily="Arial">Poussoir télescopique</text>
                          <path d="M 185 148 Q 240 148 250 140" stroke="#94a3b8" strokeWidth="0.6" fill="none" />

                          <text x="310" y="215" fill="#1e293b" fontSize="7" fontWeight="bold" fontFamily="Arial">Griffe d'ancrage (Sol)</text>
                        </svg>

                        <motion.button 
                          onClick={() => setActiveLightbox('forage')}
                          className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg select-none transition-all relative overflow-hidden shadow-none cursor-pointer"
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          id="btn-zoom-forage"
                        >
                          <motion.div 
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                            initial={{ x: '-100%' }}
                            animate={{ x: '100%' }}
                            transition={{ repeat: Infinity, repeatType: 'loop', duration: 2.2, ease: 'linear' }}
                          />
                          <span className="relative z-10 flex items-center gap-1.5">
                            <span className="text-slate-400">🔍</span>
                            <span>Agrandir l'image</span>
                          </span>
                        </motion.button>
                      </div>
                      <div className="text-[8px] text-slate-500 font-semibold mt-2 uppercase tracking-wide">
                        ⚠️ Pressions nominales : Air 7-9 bars | Eau 4-6 bars
                      </div>
                    </div>
                  </div>
                  <Alert type="securite" text="Un flexible d'air sous 10 bars qui se décroche ou éclate devient un fouet violent. Chaque raccord doit être sécurisé avant de mettre en pression." />
                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-200/60 mt-4">
                    <h4 className="font-black text-rose-700 uppercase text-[10px] tracking-widest mb-2">🎧 Équipement auditif</h4>
                    <p className="text-slate-700 font-medium">Casque anti-bruit obligatoire avant démarrage du perforateur. Niveau sonore forage : 100-110 dB. Exposition non protégée = perte auditive irréversible.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* STEP 6 */}
          <div className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden ${expandedStep === 6 ? 'border-[#b8860b]/60 shadow-[0_4px_20px_rgba(184,134,11,0.08)]' : 'border-slate-100 hover:border-[#b8860b]/20 shadow-xs'}`}>
            {renderStepHeader(6, '🔩', 'FORAGE — ATTEINDRE 100% DU MÉTRAGE', 'FORAGE')}
            <AnimatePresence initial={false}>
              {expandedStep === 6 && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-slate-100 p-6 bg-white text-xs text-slate-600 leading-relaxed space-y-6"
                >
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 flex flex-col md:flex-row items-center justify-between gap-4">
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#b8860b]">Section de galerie — Plan de tir :</span>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setGabarit('12m2')}
                        className={`px-3 py-1.5 rounded-lg font-black text-[10px] uppercase tracking-wide transition-all ${gabarit === '12m2' ? 'bg-[#b8860b] text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                      >
                        🔷 12m² — SMI
                      </button>
                      <button 
                        onClick={() => setGabarit('12m2_intl')}
                        className={`px-3 py-1.5 rounded-lg font-black text-[10px] uppercase tracking-wide transition-all ${gabarit === '12m2_intl' ? 'bg-[#b8860b] text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                      >
                        🌍 12m² — Intl
                      </button>
                      <button 
                        onClick={() => setGabarit('9m2')}
                        className={`px-3 py-1.5 rounded-lg font-black text-[10px] uppercase tracking-wide transition-all ${gabarit === '9m2' ? 'bg-[#b8860b] text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                      >
                        🔹 9m² — Traçage
                      </button>
                    </div>
                  </div>

                  <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5">
                    <div className="text-center">
                      <div className="text-[#b8860b] font-black text-4xl">
                        1.7m
                      </div>
                      <div className="text-slate-500 text-[10px] font-black uppercase tracking-wider mt-1">
                        FORÉ → DOIT ÊTRE ARRACHÉ
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mt-4 text-center">
                      <div>
                        <div className="text-slate-800 font-black text-xl">100%</div>
                        <div className="text-emerald-600 text-[9px] uppercase font-bold">Bourrage parfait</div>
                      </div>
                      <div>
                        <div className="text-slate-800 font-black text-xl">0°</div>
                        <div className="text-emerald-600 text-[9px] uppercase font-bold">Divergence idéale</div>
                      </div>
                      <div>
                        <div className="text-slate-800 font-black text-xl">{gabarit === '9m2' ? '28' : '38'}</div>
                        <div className="text-emerald-600 text-[9px] uppercase font-bold">Trous respectés</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">Plan de Tir Interactif</h4>
                    <p className="text-[10px] text-slate-500">Survolez un groupe de délais pour mettre en évidence les trous correspondants et visualiser l'ordre séquentiel du tir.</p>
                    
                    <div className="bg-slate-50 border border-slate-200/60 rounded-2xl p-4 flex flex-col items-center">
                      <svg viewBox={gabarit === '9m2' ? "0 0 1000 660" : "0 0 1000 710"} className="w-full max-w-[550px] h-auto">
                        {gabarit === '9m2' ? (
                          <path d="M 200 600 L 200 420 Q 200 180 500 100 Q 800 180 800 420 L 800 600 Z" fill="#f8fafc" stroke="#b8860b" strokeWidth="3" />
                        ) : (
                          <path d="M 100 670 L 100 430 Q 100 200 500 80 Q 900 200 900 430 L 900 670 Z" fill="#f8fafc" stroke="#b8860b" strokeWidth="3" />
                        )}

                        {holes.map((hole) => (
                          <g 
                            key={hole.id}
                            onMouseEnter={() => setActiveGroup(hole.delay)}
                            onMouseLeave={() => setActiveGroup(null)}
                            style={{ cursor: 'pointer' }}
                          >
                            <circle
                              cx={hole.x}
                              cy={hole.y}
                              r={hole.type === 'vide' ? 14 : 10}
                              fill={getCouleur(hole.type)}
                              stroke={getStroke(hole.type)}
                              strokeWidth="2"
                              opacity={activeGroup === null || activeGroup === hole.delay ? 1 : 0.25}
                              className="transition-all duration-250"
                            />
                            <text
                              x={hole.x}
                              y={hole.y + 1}
                              textAnchor="middle"
                              dominantBaseline="middle"
                              fill="white"
                              fontSize={hole.type === 'vide' ? "11" : "9"}
                              fontWeight="900"
                              fontFamily="Arial"
                              opacity={activeGroup === null || activeGroup === hole.delay ? 1 : 0.25}
                            >
                              {hole.label}
                            </text>
                          </g>
                        ))}

                        {activeGroup !== null && (
                          <text 
                            x="500" 
                            y={gabarit === '9m2' ? "640" : "695"} 
                            textAnchor="middle" 
                            fill="#b8860b"
                            fontSize="14" 
                            fontWeight="900" 
                            fontFamily="Arial"
                          >
                            {activeGroup === 0 ? "D0 — 0ms — BOUCHON (TOVEX)" :
                             activeGroup === 25 ? "D1 — 25ms — GROUPE 1 (ANFO)" :
                             activeGroup === 50 ? "D2 — 50ms — GROUPE 2 (ANFO)" :
                             activeGroup === 75 ? "D3 — 75ms — GROUPE 3 (ANFO)" :
                             activeGroup === 100 ? "D4 — 100ms — GROUPE 4 (ANFO)" :
                             "D5 — 125ms — CONTOUR (Radier / Parements / Voûte) — ANFO"}
                          </text>
                        )}
                      </svg>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full mt-4 border-t border-slate-200 pt-4 text-[10px] text-slate-700 font-medium">
                        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#60a5fa] border border-[#3b82f6]" /> <span>Vide décharge (V)</span></div>
                        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#fbbf24] border border-[#f59e0b]" /> <span>Bouchon TOVEX (D0)</span></div>
                        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#22c55e] border border-[#16a34a]" /> <span>Groupe 1 (D1 — 25ms)</span></div>
                        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#f97316] border border-[#ea580c]" /> <span>Groupe 2 (D2 — 50ms)</span></div>
                        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#06b6d4] border border-[#0891b2]" /> <span>Groupe 3 (D3 — 75ms)</span></div>
                        {gabarit !== '9m2' && (
                          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#a855f7] border border-[#9333ea]" /> <span>Groupe 4 (D4 — 100ms)</span></div>
                        )}
                        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#8b5cf6] border border-[#7c3aed]" /> <span>Radier ({gabarit === '9m2' ? 'D4' : 'D5'})</span></div>
                        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#2dd4bf] border border-[#14b8a6]" /> <span>Parements ({gabarit === '9m2' ? 'D4' : 'D5'})</span></div>
                        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#f43f5e] border border-[#e11d48]" /> <span>Voûte ({gabarit === '9m2' ? 'D5' : 'D6'})</span></div>
                      </div>

                      <div className="text-[10px] text-slate-500 mt-4 text-center bg-white px-4 py-2 rounded-xl border border-slate-200/80">
                        {gabarit === '12m2' && "12m² SMI : 38 trous | Bouchon : 3V + 6C | 6 groupes | D0 → D5"}
                        {gabarit === '12m2_intl' && "12m² Intl : 38 trous | Bouchon : 6V + 3C | 6 groupes | D0 → D5"}
                        {gabarit === '9m2' && "9m² : 28 trous | Bouchon : 1V + 4C | 5 groupes | D0 → D4"}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3.5">
                    <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">Ordre de Forage — Ne Jamais Déroger</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 flex flex-col justify-between">
                        <div>
                          <div className="font-black text-[#b8860b] text-[10px] uppercase tracking-wider mb-2">ÉTAPE A → BOUCHON EN PREMIER</div>
                          <p className="text-[10px] text-slate-600">Le bouchon crée la première face libre. Sans face libre, l'énergie explose dans toutes les directions et rien ne bouge. Le bouchon est la fondation de tout le tir.</p>
                        </div>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 flex flex-col justify-between">
                        <div>
                          <div className="font-black text-[#b8860b] text-[10px] uppercase tracking-wider mb-2">ÉTAPE B → INTÉRIEUR VERS EXTÉRIEUR</div>
                          <p className="text-[10px] text-slate-600">
                            {gabarit === '9m2' ? 'G1 → G2 → G3' : 'G1 → G2 → G3 → G4'}. Chaque groupe tire vers le vide créé par le groupe précédent. Ne jamais sauter un groupe — le vide n'existe pas encore.
                          </p>
                        </div>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 flex flex-col justify-between">
                        <div>
                          <div className="font-black text-[#b8860b] text-[10px] uppercase tracking-wider mb-2">ÉTAPE C → CONTOUR EN DERNIER</div>
                          <p className="text-[10px] text-slate-600">Radier → Parements → Voûte. Le contour découpe le profil officiel de la galerie. Foré en dernier pour ne pas fragiliser la galerie pendant le forage des trous centraux.</p>
                        </div>
                      </div>
                    </div>
                    <Alert type="regle" text="Un seul trou foré dans le mauvais ordre = rendement réduit. L'ordre n'est pas une suggestion — c'est une règle physique." />
                  </div>

                  <div className="space-y-4 pt-2 border-t border-slate-200">
                    <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">Parallélisme des Trous — L'Ennemi du Rendement</h4>
                    <p className="text-[10.5px] text-slate-600 leading-relaxed">
                      Tous les trous doivent être rigoureusement parallèles entre eux et perpendiculaires au front de taille. Un trou dévié crée un culot (fond de trou non arraché) qui se cumule d'une volée à l'autre.
                    </p>
                    
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/60 space-y-4">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                        <span className="font-bold text-slate-700 text-[10px] uppercase tracking-wider">Simulateur de déviation de tir :</span>
                        <span className="text-[#b8860b] font-mono font-black text-sm bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-xs">
                          Angle de divergence : {divergenceAngle}°
                        </span>
                      </div>

                      <div className="py-2">
                        <input 
                          type="range" 
                          min={0} 
                          max={8} 
                          step={0.5}
                          value={divergenceAngle}
                          onChange={(e) => setDivergenceAngle(parseFloat(e.target.value))}
                          className="w-full h-2 rounded-lg appearance-none cursor-pointer accent-[#b8860b] bg-slate-200"
                        />
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-center">
                        <div className="bg-white p-3 rounded-xl border border-slate-200/60 shadow-xs">
                          <div className="text-[10px] uppercase text-slate-500 font-bold">Volume Arraché</div>
                          <div className={`text-lg font-black mt-0.5 ${verdict.color}`}>
                            {effectiveCm} cm / {drilledCm} cm
                          </div>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-slate-200/60 shadow-xs">
                          <div className="text-[10px] uppercase text-slate-500 font-bold">Rendement Volée</div>
                          <div className={`text-lg font-black mt-0.5 ${verdict.color}`}>
                            {yieldPct}%
                          </div>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-slate-200/60 shadow-xs">
                          <div className="text-[10px] uppercase text-slate-500 font-bold">Culot Résiduel</div>
                          <div className="text-rose-600 text-lg font-black mt-0.5">
                            {lostCm} cm
                          </div>
                        </div>
                      </div>

                      <div className="text-center pt-1">
                        <span className={`text-[11px] font-black uppercase tracking-wider ${verdict.color}`}>
                          {verdict.text}
                        </span>
                      </div>

                      <div className="pt-2">
                        <table className="w-full text-left text-[10px] border-collapse">
                          <thead>
                            <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider">
                              <th className="py-2">Angle</th>
                              <th className="py-2">Culot</th>
                              <th className="py-2">Arraché</th>
                              <th className="py-2">Rendement</th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr className={`border-b border-slate-100 transition-colors ${divergenceAngle === 0 ? 'bg-amber-500/10 text-[#b8860b] font-bold' : 'text-slate-500'}`}>
                              <td className="py-1.5">0°</td>
                              <td className="py-1.5">0cm</td>
                              <td className="py-1.5">170cm</td>
                              <td className="py-1.5">100%</td>
                            </tr>
                            <tr className={`border-b border-slate-100 transition-colors ${divergenceAngle === 1 ? 'bg-amber-500/10 text-[#b8860b] font-bold' : 'text-slate-500'}`}>
                              <td className="py-1.5">1°</td>
                              <td className="py-1.5">3cm</td>
                              <td className="py-1.5">167cm</td>
                              <td className="py-1.5">98%</td>
                            </tr>
                            <tr className={`border-b border-slate-100 transition-colors ${divergenceAngle === 2 ? 'bg-amber-500/10 text-[#b8860b] font-bold' : 'text-slate-500'}`}>
                              <td className="py-1.5">2°</td>
                              <td className="py-1.5">6cm</td>
                              <td className="py-1.5">164cm</td>
                              <td className="py-1.5">96%</td>
                            </tr>
                            <tr className={`border-b border-slate-100 transition-colors ${divergenceAngle === 3 ? 'bg-amber-500/10 text-[#b8860b] font-bold' : 'text-slate-500'}`}>
                              <td className="py-1.5">3°</td>
                              <td className="py-1.5">9cm</td>
                              <td className="py-1.5">161cm</td>
                              <td className="py-1.5">95%</td>
                            </tr>
                            <tr className={`border-b border-slate-100 transition-colors ${divergenceAngle >= 5 ? 'bg-amber-500/10 text-[#b8860b] font-bold' : 'text-slate-500'}`}>
                              <td className="py-1.5">5°</td>
                              <td className="py-1.5">15cm</td>
                              <td className="py-1.5">155cm</td>
                              <td className="py-1.5">91%</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* STEP 7 */}
          <div className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden ${expandedStep === 7 ? 'border-[#b8860b]/60 shadow-[0_4px_20px_rgba(184,134,11,0.08)]' : 'border-slate-100 hover:border-[#b8860b]/20 shadow-xs'}`}>
            {renderStepHeader(7, '🔍', 'VÉRIFICATION & NETTOYAGE DES TROUS', 'TECHNIQUE')}
            <AnimatePresence initial={false}>
              {expandedStep === 7 && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-slate-100 p-6 bg-white text-xs text-slate-600 leading-relaxed"
                >
                  <p className="font-bold text-slate-800 text-sm mb-4">
                    Avant le chargement des explosifs, chaque trou est soufflé et contrôlé. Un trou bouché ou insuffisamment profond = cartouche TOVEX coincée = raté de tir.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-200/60 space-y-3.5 md:col-span-2 flex flex-col justify-between">
                      <div>
                        <h4 className="font-black uppercase text-[10px] tracking-widest text-slate-500 mb-2">Checklist technique :</h4>
                        <ul className="space-y-3 text-slate-700 font-medium text-[11px]">
                          <li className="flex items-start gap-2.5">
                            <span className="text-[#b8860b] font-bold">☐</span>
                            <span>Soufflage de chaque trou à l'air comprimé (du fond vers l'entrée)</span>
                          </li>
                          <li className="flex items-start gap-2.5">
                            <span className="text-[#b8860b] font-bold">☐</span>
                            <span>Vérification de la profondeur avec la tige de mesure<br/>
                              <span className="text-slate-500 pl-4 block mt-0.5">→ Trou trop court : noter la référence pour correction</span>
                              <span className="text-slate-500 pl-4 block">→ Profondeur conforme : marquer d'un repère à la craie</span>
                            </span>
                          </li>
                          <li className="flex items-start gap-2.5">
                            <span className="text-[#b8860b] font-bold">☐</span>
                            <span>Contrôle rigoureux de l'humidité :<br/>
                              <span className="text-slate-500 pl-4 block mt-0.5">→ Trou sec : chargeable à l'ANFO de performance</span>
                              <span className="text-slate-500 pl-4 block">→ Trou humide/eau : TOVEX uniquement (l'ANFO se dissout)</span>
                            </span>
                          </li>
                          <li className="flex items-start gap-2.5">
                            <span className="text-[#b8860b] font-bold">☐</span>
                            <span>Contrôle visuel des trous de bouchon (alignement)</span>
                          </li>
                        </ul>
                      </div>
                      <div className="text-[10px] text-[#b8860b] font-bold bg-amber-500/5 p-3 rounded-lg border border-amber-500/10 mt-2">
                        💡 CONSEIL : Souffler énergiquement libère la silice résiduelle. Portez impérativement votre masque respiratoire à cartouche lors de cette opération !
                      </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 flex flex-col items-center justify-center">
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2.5 text-center">Trou Nettoyé & Soufflé</span>
                      <div className="bg-white rounded-xl p-3 border border-slate-200/40 w-full flex items-center justify-center shadow-xs">
                        <svg viewBox="0 0 240 300" className="w-full h-auto max-w-[200px]">
                          <defs>
                            {/* Rock strata gradient */}
                            <linearGradient id="schist-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                              <stop offset="0%" stopColor="#334155" />
                              <stop offset="60%" stopColor="#1e293b" />
                              <stop offset="100%" stopColor="#0f172a" />
                            </linearGradient>
                            {/* Shiny copper pipe gradient */}
                            <linearGradient id="copper-pipe" x1="0%" y1="0%" x2="0%" y2="100%">
                              <stop offset="0%" stopColor="#fdba74" />
                              <stop offset="30%" stopColor="#ea580c" />
                              <stop offset="70%" stopColor="#c2410c" />
                              <stop offset="100%" stopColor="#7c2d12" />
                            </linearGradient>
                            {/* Air stream glow */}
                            <linearGradient id="air-glow" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
                              <stop offset="100%" stopColor="#e0f2fe" stopOpacity="0" />
                            </linearGradient>
                          </defs>

                          {/* Background Rock Texture with cross section container */}
                          <rect x="5" y="5" width="230" height="290" rx="12" fill="url(#schist-grad)" stroke="#1e293b" strokeWidth="1.5" />
                          
                          {/* Geological stratification line (Quartz vein) */}
                          <path d="M 5 60 Q 90 85, 140 50 T 235 75" stroke="#ca8a04" strokeWidth="2" fill="none" opacity="0.4" />
                          <path d="M 5 200 Q 70 220, 150 185 T 235 210" stroke="#ca8a04" strokeWidth="1.5" fill="none" opacity="0.3" />

                          {/* Rock Front face edge (La face libre / front de taille) */}
                          {/* Space to the left is the gallery air, space to the right is solid rock */}
                          <rect x="5" y="5" width="40" height="290" fill="#f1f5f9" opacity="0.15" />
                          <path d="M 45 5 L 45 295" stroke="#475569" strokeWidth="4" strokeLinecap="round" />

                          {/* The drilled cylindrical hole (38mm diameter) inside solid rock */}
                          {/* Extends from x=45 (mouth) to x=210 (bottom of the hole), height is 45px (y=125 to y=170) */}
                          {/* Smooth cylindrical profile */}
                          <path d="M 45 125 L 205 125 Q 210 125, 210 147.5 Q 210 170, 205 170 L 45 170 Z" fill="#0f172a" stroke="#475569" strokeWidth="1.5" />
                          
                          {/* Smooth shiny interior borehole walls (indicator of excellent drilling quality) */}
                          <line x1="45" y1="127" x2="204" y2="127" stroke="#0ea5e9" strokeWidth="0.8" opacity="0.4" />
                          <line x1="45" y1="168" x2="204" y2="168" stroke="#0ea5e9" strokeWidth="0.8" opacity="0.4" />

                          {/* Depth markers in meters along the borehole */}
                          <line x1="93" y1="125" x2="93" y2="130" stroke="#475569" strokeWidth="1" />
                          <line x1="141" y1="125" x2="141" y2="130" stroke="#475569" strokeWidth="1" />
                          <line x1="189" y1="125" x2="189" y2="130" stroke="#475569" strokeWidth="1" />
                          <text x="93" y="120" fill="#94a3b8" fontSize="6.5" textAnchor="middle" fontFamily="Arial">0.5m</text>
                          <text x="141" y="120" fill="#94a3b8" fontSize="6.5" textAnchor="middle" fontFamily="Arial">1.0m</text>
                          <text x="189" y="120" fill="#94a3b8" fontSize="6.5" textAnchor="middle" fontFamily="Arial">1.5m</text>
                          <text x="210" y="115" fill="#38bdf8" fontSize="7" fontWeight="black" textAnchor="middle" fontFamily="Arial">1.7m</text>

                          {/* Polished copper blowpipe (Soufflette) inserted in the hole to clean it */}
                          {/* Pipe body extends from left gallery (x=15) into the hole up to x=155 */}
                          <line x1="15" y1="147.5" x2="155" y2="147.5" stroke="url(#copper-pipe)" strokeWidth="4.5" strokeLinecap="round" />
                          {/* Shiny copper highlight on pipe */}
                          <line x1="15" y1="146.5" x2="155" y2="146.5" stroke="#ffedd5" strokeWidth="0.8" opacity="0.6" />
                          {/* Pipe nozzle end (reductor tip for higher pressure velocity) */}
                          <rect x="150" y="144" width="7" height="7" rx="1" fill="#475569" stroke="#1e293b" strokeWidth="0.8" />

                          {/* HIGH-VELOCITY AIR JETS LOOPING BACK TO SWEEP OUT RESIDUALS */}
                          {/* Air jet shoots from nozzle (x=157) to the bottom of the hole (x=210), rebounds, and sweeps out */}
                          {/* Air jets shooting forward */}
                          <path d="M 157 147.5 L 206 147.5" stroke="#e0f2fe" strokeWidth="2.5" strokeLinecap="round" opacity="0.9" />
                          <path d="M 157 147.5 L 200 142" stroke="#38bdf8" strokeWidth="1" opacity="0.8" />
                          <path d="M 157 147.5 L 200 153" stroke="#38bdf8" strokeWidth="1" opacity="0.8" />
                          
                          {/* Air turbulence looping backwards along the borehole walls to evacuate dust */}
                          <path d="M 205 147.5 C 205 130, 150 131, 45 134" stroke="url(#air-glow)" strokeWidth="2" fill="none" strokeLinecap="round" />
                          <path d="M 205 147.5 C 205 165, 150 164, 45 161" stroke="url(#air-glow)" strokeWidth="2" fill="none" strokeLinecap="round" />

                          {/* Evacuated debris: dust cloud and water droplets flushing out of the hole mouth */}
                          {/* Dust cloud at the mouth (x=30-55, y=115-180) */}
                          <ellipse cx="40" cy="147.5" rx="14" ry="26" fill="#94a3b8" opacity="0.25" />
                          <ellipse cx="30" cy="147.5" rx="10" ry="18" fill="#cbd5e1" opacity="0.35" />
                          
                          {/* Evacuated flying particles and water droplets */}
                          <circle cx="36" cy="132" r="1.5" fill="#3b82f6" opacity="0.9" /> {/* Water drop */}
                          <circle cx="28" cy="155" r="1" fill="#94a3b8" /> {/* Dust */}
                          <circle cx="48" cy="160" r="1.2" fill="#64748b" /> {/* Fine gravel */}
                          <circle cx="32" cy="162" r="1.5" fill="#3b82f6" opacity="0.9" /> {/* Water drop */}
                          <circle cx="24" cy="140" r="1" fill="#cbd5e1" />

                          {/* Shiny Star highlight indicating absolute cleanliness inside */}
                          <path d="M 185 142 L 188 145 L 193 147 L 188 149 L 185 152 L 182 149 L 177 147 L 182 145 Z" fill="#eab308" />
                          <circle cx="185" cy="147" r="1" fill="#ffffff" />
                          <circle cx="110" cy="137" r="0.8" fill="#eab308" />

                          {/* Technical Annotations & Headings */}
                          <text x="120" y="25" fill="#f1f5f9" fontSize="10" fontWeight="black" textAnchor="middle" fontFamily="Arial" letterSpacing="1">SOUFFLAGE DU FRONT</text>
                          
                          <text x="120" y="98" fill="#38bdf8" fontSize="8" fontWeight="black" textAnchor="middle" fontFamily="Arial">FLUX D'AIR COMPRIMÉ CYCLONIQUE</text>
                          
                          <text x="120" y="195" fill="#eab308" fontSize="8" fontWeight="black" textAnchor="middle" fontFamily="Arial">ÉVACUATION SILICE & HUMIDITÉ</text>
                          <text x="120" y="210" fill="#cbd5e1" fontSize="7.5" fontWeight="bold" textAnchor="middle" fontFamily="Arial">Conformité de tir 100% assurée</text>
                          
                          {/* Soufflette labeling */}
                          <text x="120" y="248" fill="#94a3b8" fontSize="7.5" fontWeight="bold" textAnchor="middle" fontFamily="Arial">Canne de soufflage cuivre Ø12mm</text>
                          <path d="M 120 238 Q 110 230, 95 152" stroke="#94a3b8" strokeWidth="0.8" fill="none" strokeDasharray="2 2" />
                        </svg>

                        <motion.button 
                          onClick={() => setActiveLightbox('soufflage')}
                          className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg select-none transition-all relative overflow-hidden shadow-none cursor-pointer"
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          id="btn-zoom-soufflage"
                        >
                          <motion.div 
                            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent"
                            initial={{ x: '-100%' }}
                            animate={{ x: '100%' }}
                            transition={{ repeat: Infinity, repeatType: 'loop', duration: 2.2, ease: 'linear' }}
                          />
                          <span className="relative z-10 flex items-center gap-1.5">
                            <span className="text-slate-400">🔍</span>
                            <span>Agrandir l'image</span>
                          </span>
                        </motion.button>
                      </div>
                    </div>
                  </div>

                  <Alert type="technique" text="Un trou mouillé chargé avec ANFO = raté garanti. Le TOVEX résiste à l'eau et garantit la détonation même dans un trou noyé. Adapter selon l'état de chaque trou." />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* STEP 8 */}
          <div className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden ${expandedStep === 8 ? 'border-[#b8860b]/60 shadow-[0_4px_20px_rgba(184,134,11,0.08)]' : 'border-slate-100 hover:border-[#b8860b]/20 shadow-xs'}`}>
            {renderStepHeader(8, '💥', 'CHARGEMENT EXPLOSIFS', 'EXPLOSIFS')}
            <AnimatePresence initial={false}>
              {expandedStep === 8 && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-slate-100 p-6 bg-white text-xs text-slate-600 leading-relaxed space-y-6"
                >
                  <p className="font-bold text-slate-800 text-sm">
                    Le chargement se fait 30 à 60 minutes avant l'heure de tir. L'ordre est impératif : TOVEX en premier, ANFO ensuite, bourrage en dernier.
                  </p>

                  <div className="space-y-3">
                    <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">1. TOVEX + Amorce — La Base du Tir</h4>
                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-200/60 space-y-3">
                      <ol className="list-decimal pl-5 space-y-2 text-slate-700 font-medium">
                        <li>Prendre la cartouche TOVEX 100g</li>
                        <li>Insérer la capsule électrique dans la cartouche TOVEX</li>
                        <li className="font-bold text-slate-800">RÈGLE ABSOLUE — SHUNTAGE DES FILS :</li>
                      </ol>
                      <Alert type="regle" text="Les fils de l'amorce doivent être TORSADÉS ENSEMBLE (shuntés) jusqu'au moment du raccordement final au fil de tir. Aucun fil ne doit rester libre. Un fil libre capte l'électricité statique ou un courant vagabond = détonation accidentelle." />
                      <ol className="list-decimal pl-5 space-y-2 text-slate-700 font-medium" start={4}>
                        <li>Introduire la cartouche TOVEX amorcée AU FOND DU TROU</li>
                        <li>Ne jamais forcer — ne jamais utiliser la tige de forage</li>
                        <li>Le fil de l'amorce sort du trou et reste shunté</li>
                      </ol>
                    </div>
                  </div>

                  <div className="space-y-4 pt-2 border-t border-slate-200">
                    <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">2. Portanole Pneumatique — Chargement ANFO</h4>
                    
                    <div className="flex flex-col md:flex-row gap-6 items-center">
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 w-full max-w-[220px] flex justify-center">
                        <svg width="160" height="120" viewBox="0 0 160 120" className="w-full">
                          <rect x="10" y="30" width="140" height="20" fill="#cbd5e1" />
                          <line x1="30" y1="40" x2="150" y2="40" stroke="#0284c7" strokeWidth="4" />
                          <rect x="10" y="30" width="40" height="20" fill="#dc2626" />
                          <rect x="50" y="30" width="70" height="20" fill="#b45309" fillOpacity="0.15" />
                          
                          {Array.from({ length: 25 }).map((_, i) => {
                            const rx = 52 + (i % 8) * 8;
                            const ry = 34 + Math.floor(i / 8) * 5;
                            return (
                              <circle key={i} cx={rx} cy={ry} r="2" fill="#b45309" />
                            );
                          })}

                          <path d="M 140 40 L 155 10 L 150 10 L 140 36" stroke="#0284c7" strokeWidth="2" fill="none" />
                          
                          <text x="30" y="75" fill="#dc2626" fontSize="8" fontWeight="bold" textAnchor="middle">TOVEX (Fond)</text>
                          <text x="85" y="75" fill="#b45309" fontSize="8" fontWeight="bold" textAnchor="middle">ANFO</text>
                          <text x="80" y="105" fill="#0284c7" fontSize="8" fontWeight="bold" textAnchor="middle">Flexible antistatique</text>
                          <text x="145" y="112" fill="#475569" fontSize="6" fontWeight="bold" textAnchor="middle">COL</text>
                          
                          <line x1="140" y1="40" x2="110" y2="40" stroke="#475569" strokeWidth="2" />
                        </svg>
                      </div>

                      <div className="flex-1 space-y-2">
                        <ol className="list-decimal pl-5 space-y-1.5 text-slate-700 font-medium">
                          <li>Vérifier que le FLEXIBLE ANTISTATIQUE est bien attaché à la portanole</li>
                          <li>Vérifier l'état du flexible — aucune coupure ni usure</li>
                          <li>Introduire l'extrémité du flexible au fond du trou</li>
                          <li>Charger l'ANFO (granulés) dans la portanole</li>
                          <li>Souffler progressivement — du fond vers le col</li>
                          <li>Arrêter à la longueur de colonne explosive prévue :</li>
                        </ol>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-2 text-[10.5px]">
                      <div className="font-bold text-slate-800 mb-1">Configuration de la colonne :</div>
                      <p className="text-slate-600">• Barre 1.8m (forage 1.7m = 170cm) : bourrage 76cm → colonne ANFO 94cm</p>
                      <p className="text-slate-600">• Barre 2.4m (forage 2.3m = 230cm) : bourrage 76cm → colonne ANFO 154cm</p>
                    </div>

                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-200/60">
                      <div className="font-black text-slate-700 text-[10px] uppercase tracking-wider mb-2">Quantités requises estimées pour ce gabarit ({gabarit}) :</div>
                      {gabarit === '9m2' ? (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                          <div className="bg-white p-2 rounded-lg border border-slate-200/60"><div className="font-bold text-[#b8860b]">22 à 24 kg</div><div className="text-[8px] text-slate-500">ANFO TOTAL</div></div>
                          <div className="bg-white p-2 rounded-lg border border-slate-200/60"><div className="font-bold text-[#b8860b]">4 cartouches</div><div className="text-[8px] text-slate-500">TOVEX 100G</div></div>
                          <div className="bg-white p-2 rounded-lg border border-slate-200/60"><div className="font-bold text-[#b8860b]">28 unités</div><div className="text-[8px] text-slate-500">AMORCES</div></div>
                          <div className="bg-white p-2 rounded-lg border border-slate-200/60"><div className="font-bold text-[#b8860b]">27 trous</div><div className="text-[8px] text-slate-500">À CHARGER</div></div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                          <div className="bg-white p-2 rounded-lg border border-slate-200/60"><div className="font-bold text-[#b8860b]">29 à 32 kg</div><div className="text-[8px] text-slate-500">ANFO TOTAL</div></div>
                          <div className="bg-white p-2 rounded-lg border border-slate-200/60"><div className="font-bold text-[#b8860b]">{gabarit === '12m2' ? '6' : '3'} cartouches</div><div className="text-[8px] text-slate-500">TOVEX 100G</div></div>
                          <div className="bg-white p-2 rounded-lg border border-slate-200/60"><div className="font-bold text-[#b8860b]">38 unités</div><div className="text-[8px] text-slate-500">AMORCES</div></div>
                          <div className="bg-white p-2 rounded-lg border border-slate-200/60"><div className="font-bold text-[#b8860b]">{gabarit === '12m2' ? '35' : '32'} trous</div><div className="text-[8px] text-slate-500">À CHARGER</div></div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 pt-2 border-t border-slate-200">
                    <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">3. Bourrage — La Clé du Rendement 100%</h4>
                    <p className="text-[10.5px] text-slate-600 leading-relaxed">
                      Un bourrage insuffisant = les gaz s'échappent vers l'entrée = 50 à 80% de l'énergie explosive perdue = culot = métrage raté. Le bourrage est ce qui fait la différence entre 70% et 100% du métrage arraché.
                    </p>
                    
                    <div className="bg-slate-50 border border-amber-500/20 rounded-xl p-4">
                      <div className="text-[#b8860b] font-mono font-black text-xl text-center">
                        L_bourrage = 20 × Ø_taillant
                      </div>
                      <div className="text-center text-slate-600 text-[10px] mt-2 uppercase tracking-wider">
                        20 × 38mm = 760mm = <strong className="text-slate-800">76cm MINIMUM</strong>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-200/60 space-y-3 text-slate-700 font-medium">
                      <div className="font-bold text-slate-800">Procédure de bourrage :</div>
                      <ul className="list-disc pl-5 space-y-2">
                        <li>
                          <span className="font-semibold text-[#b8860b]">Matériau : ARGILE de préférence</span><br/>
                          <span className="text-slate-500 pl-4">→ En dépannage : fines de roche anguleuses (efficacité 70%)</span><br/>
                          <span className="text-slate-500 pl-4">→ Jamais : galets ronds, pierres lisses, déblais grossiers</span>
                        </li>
                        <li>Introduire l'argile par couches de 15-20cm</li>
                        <li>Compacter chaque couche : 6 à 8 coups de tige MINIMUM</li>
                        <li>Remplir jusqu'à 70-80cm de l'entrée du trou</li>
                        <li>Vérifier que le fil de l'amorce sort proprement — non coincé</li>
                      </ul>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* STEP 9 */}
          <div className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden ${expandedStep === 9 ? 'border-[#b8860b]/60 shadow-[0_4px_20px_rgba(184,134,11,0.08)]' : 'border-slate-100 hover:border-[#b8860b]/20 shadow-xs'}`}>
            {renderStepHeader(9, '🔌', 'PRÉ-TIR & MISE À FEU', 'TECHNIQUE')}
            <AnimatePresence initial={false}>
              {expandedStep === 9 && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-slate-100 p-6 bg-white text-xs text-slate-600 leading-relaxed space-y-4"
                >
                  <p className="font-bold text-slate-800 text-sm">
                    La mise à feu est la conclusion de toute la préparation. Les 15 minutes précédentes sont les plus critiques — une check-list non respectée ici remet en cause toute la journée.
                  </p>

                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-200/60 space-y-3">
                    <h4 className="font-black uppercase text-[10px] tracking-widest text-slate-500">CHECKLIST PRÉ-TIR :</h4>
                    <ul className="space-y-2.5 text-slate-700 font-medium">
                      <li className="flex items-start gap-2.5"><span>☐</span> <span>Outils de forage évacués de la zone de tir</span></li>
                      <li className="flex items-start gap-2.5"><span>☐</span> <span>Flexibles d'air comprimé rangés et sécurisés</span></li>
                      <li className="flex items-start gap-2.5"><span>☐</span> <span>Pince à purger replacée — hors zone tir</span></li>
                      <li className="flex items-start gap-2.5"><span>☐</span> <span>Fil de tir principal : non coupé, non coincé, longueur suffisante</span></li>
                      <li className="flex items-start gap-2.5"><span>☐</span> <span>Connexion de chaque amorce au fil de tir vérifiée</span></li>
                      <li className="flex items-start gap-2.5"><span>☐</span> <span>Shuntage maintenu jusqu'à la connexion finale</span></li>
                      <li className="flex items-start gap-2.5"><span>☐</span> <span>Galvanomètre : continuité du circuit confirmée</span></li>
                      <li className="flex items-start gap-2.5"><span>☐</span> <span>Signalisation de la zone de tir mise en place (barrières)</span></li>
                      <li className="flex items-start gap-2.5"><span>☐</span> <span>Évacuation totale confirmée — mineur + aide-mineur</span></li>
                      <li className="flex items-start gap-2.5"><span>☐</span> <span>Heure de tir planifiée respectée</span></li>
                    </ul>
                  </div>

                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-200/60 space-y-2.5">
                    <h4 className="font-black text-[#b8860b] uppercase text-[10px] tracking-widest">Procédure de mise à feu :</h4>
                    <ol className="list-decimal pl-5 space-y-2 text-[10.5px] text-slate-700 font-medium">
                      <li>S'éloigner à distance de sécurité (minimum 100m depuis le front)</li>
                      <li>Vérifier une dernière fois qu'aucune personne n'est dans la zone</li>
                      <li>Raccorder le fil de tir à l'appareil de tir homologué SMI</li>
                      <li>Charger l'appareil de tir (impulsion électrique)</li>
                      <li>Déclencher — vérifier le signal de mise à feu</li>
                    </ol>
                  </div>

                  <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl text-rose-900 text-[10.5px]">
                    <div className="font-black text-rose-700 uppercase tracking-wider mb-1">⚠️ POST-TIR & INCIDENTS</div>
                    <p className="font-medium">• Attente minimum 30 minutes avant tout accès</p>
                    <p className="font-medium">• Vérification ventilation et CO avant retour</p>
                    <p className="font-medium">• En cas de raté : procédure trou raté — NE PAS APPROCHER avant 30 minutes. Signaler au Responsable Technique.</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* STEP 10 */}
          <div className={`bg-white rounded-2xl border transition-all duration-300 overflow-hidden ${expandedStep === 10 ? 'border-[#b8860b]/60 shadow-[0_4px_20px_rgba(184,134,11,0.08)]' : 'border-slate-100 hover:border-[#b8860b]/20 shadow-xs'}`}>
            {renderStepHeader(10, '📝', 'SAISIE DU REGISTRE JOURNALIER', 'TECHNIQUE')}
            <AnimatePresence initial={false}>
              {expandedStep === 10 && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-slate-100 p-6 bg-white text-xs text-slate-600 leading-relaxed space-y-4"
                >
                  <p className="font-bold text-slate-800 text-sm">
                    La déclaration dans le registre journalier est l'acte technique final du mineur. Elle alimente directement la plateforme HydroMines Production — les données doivent être exactes et complètes.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 flex flex-col justify-between">
                      <div>
                        <div className="font-bold text-slate-800 text-[10px] uppercase tracking-wider mb-1">📊 Trous forés total</div>
                        <p className="text-slate-600">{gabarit === '9m2' ? '28' : '38'} trous — conformes au plan</p>
                      </div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 flex flex-col justify-between">
                      <div>
                        <div className="font-bold text-slate-800 text-[10px] uppercase tracking-wider mb-1">🔩 Répartition bouchon</div>
                        <p className="text-slate-600">
                          {gabarit === '12m2' && "3 vides + 6 chargés TOVEX"}
                          {gabarit === '12m2_intl' && "6 vides + 3 chargés TOVEX"}
                          {gabarit === '9m2' && "1 vide + 4 chargés TOVEX"}
                        </p>
                      </div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 flex flex-col justify-between">
                      <div>
                        <div className="font-bold text-slate-800 text-[10px] uppercase tracking-wider mb-1">📏 Barre utilisée</div>
                        <p className="text-slate-600 font-semibold">Barre 1.8m (forage 1.7m) ou Barre 2.4m (forage 2.3m)</p>
                      </div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 flex flex-col justify-between">
                      <div>
                        <div className="font-bold text-slate-800 text-[10px] uppercase tracking-wider mb-1">💥 Explosifs consommés</div>
                        <p className="text-slate-600">ANFO : X kg | TOVEX : X cartouches | Amorces : X</p>
                      </div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 flex flex-col justify-between">
                      <div>
                        <div className="font-bold text-slate-800 text-[10px] uppercase tracking-wider mb-1">📐 Métrage foré déclaré</div>
                        <p className="text-slate-600 font-semibold">= Longueur barre × 1 (par trou) — hors trous vides</p>
                      </div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 flex flex-col justify-between">
                      <div>
                        <div className="font-bold text-slate-800 text-[10px] uppercase tracking-wider mb-1">⏰ Heure de tir effective</div>
                        <p className="text-slate-600">Heure réelle du tir — à déclarer précisément</p>
                      </div>
                    </div>
                  </div>

                  <Alert type="regle" text="Un registre inexact a des conséquences sur la traçabilité des explosifs et sur la sécurité du poste suivant. La précision du registre reflète la rigueur du mineur." />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>

      {/* Bottom progress bar */}
      <div className="sticky bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-slate-200 px-6 py-3 flex items-center gap-3 z-50 shadow-lg">
        <span className="text-slate-500 text-[9px] font-black uppercase">Progression :</span>
        <div className="flex gap-1 flex-1">
          {Array.from({ length: 10 }).map((_, i) => (
            <div 
              key={i}
              className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${expandedStep !== null && expandedStep > i ? 'bg-[#b8860b]' : 'bg-slate-100'}`}
            />
          ))}
        </div>
        <span className="text-[#b8860b] text-[9px] font-black uppercase">
          {expandedStep ? `${expandedStep}/10` : '—/10'}
        </span>
      </div>

      {/* Lightbox Modal Overlay */}
      <AnimatePresence>
        {activeLightbox && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm"
            onClick={() => setActiveLightbox(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="relative max-w-4xl w-full bg-white rounded-2xl overflow-hidden p-6 border border-slate-200/50 flex flex-col items-center justify-center"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close Button */}
              <button 
                onClick={() => setActiveLightbox(null)}
                className="absolute top-4 right-4 text-slate-500 hover:text-slate-800 p-2 bg-slate-50 hover:bg-slate-100 rounded-full transition-all cursor-pointer z-10"
              >
                ✕
              </button>
              
              <div className="w-full flex flex-col items-center">
                <h3 className="text-base font-black text-slate-800 uppercase tracking-widest mb-4">
                  {activeLightbox === 'purge' && "🔍 Illustration : Pince à purger & Bec Type 2 (Agrandie)"}
                  {activeLightbox === 'forage' && "🔍 Illustration : Perforateur Montabert T23 & Poussoir (Agrandie)"}
                  {activeLightbox === 'soufflage' && "🔍 Illustration : Nettoyage & Soufflage du Trou (Agrandie)"}
                </h3>
                
                <div className="w-full max-w-[550px] aspect-[4/3] bg-white rounded-xl p-2 flex items-center justify-center border border-slate-100">
                  {activeLightbox === 'purge' && (
                    <svg viewBox="0 0 400 220" className="w-full h-full">
                      <defs>
                        <linearGradient id="rock-grad-zoom" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#475569" />
                          <stop offset="50%" stopColor="#334155" />
                          <stop offset="100%" stopColor="#1e293b" />
                        </linearGradient>
                        <linearGradient id="slab-grad-zoom" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#64748b" />
                          <stop offset="100%" stopColor="#475569" />
                        </linearGradient>
                        <linearGradient id="metal-rod-zoom" x1="0%" y1="0%" x2="100%" y2="0%">
                          <stop offset="0%" stopColor="#cbd5e1" />
                          <stop offset="50%" stopColor="#f1f5f9" />
                          <stop offset="100%" stopColor="#94a3b8" />
                        </linearGradient>
                        <radialGradient id="glow-gold-zoom" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.4" />
                          <stop offset="100%" stopColor="#fbbf24" stopOpacity="0" />
                        </radialGradient>
                      </defs>
                      <rect x="5" y="5" width="390" height="210" rx="10" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1" />
                      <path d="M 5 5 C 100 8, 300 12, 395 5 L 395 55 C 320 50, 240 55, 170 45 C 130 40, 90 42, 5 40 Z" fill="url(#rock-grad-zoom)" />
                      <path d="M 5 18 Q 80 25, 160 20 T 395 15" stroke="#d97706" strokeWidth="3.5" fill="none" opacity="0.65" strokeDasharray="15 3 5 4" />
                      <path d="M 5 18 Q 80 25, 160 20 T 395 15" stroke="#fef08a" strokeWidth="1" fill="none" opacity="0.8" />
                      <path d="M 40 41 Q 120 70, 200 60 L 220 44" stroke="#dc2626" strokeWidth="2" strokeDasharray="3 1" fill="none" />
                      <path d="M 40 41 Q 120 70, 200 60 L 215 45 Z" fill="url(#slab-grad-zoom)" stroke="#1e293b" strokeWidth="1" />
                      <circle cx="100" cy="58" r="1.5" fill="#3b82f6" opacity="0.8" />
                      <circle cx="150" cy="62" r="1.2" fill="#3b82f6" opacity="0.8" />
                      <g transform="translate(0, 10)">
                        <path d="M 120 90 L 145 88 L 150 110 L 125 115 Z" fill="#475569" stroke="#334155" strokeWidth="1" />
                        <path d="M 160 100 L 175 95 L 180 112 L 165 115 Z" fill="#64748b" stroke="#334155" strokeWidth="1" />
                        <line x1="135" y1="75" x2="135" y2="85" stroke="#94a3b8" strokeWidth="1" />
                        <line x1="170" y1="85" x2="170" y2="92" stroke="#94a3b8" strokeWidth="1" />
                        <line x1="145" y1="118" x2="145" y2="128" stroke="#94a3b8" strokeWidth="1" />
                        <path d="M 145 130 L 145 142 M 145 142 L 141 137 M 145 142 L 149 137" stroke="#dc2626" strokeWidth="1.5" fill="none" />
                        <text x="153" y="141" fill="#dc2626" fontSize="8" fontWeight="bold" fontFamily="Arial">CHUTE LIBRE</text>
                      </g>
                      <path d="M 5 215 Q 120 210, 240 215 T 395 210" stroke="#cbd5e1" strokeWidth="2" fill="none" />
                      <g>
                        <circle cx="118" cy="54" r="16" fill="url(#glow-gold-zoom)" />
                        <line x1="340" y1="180" x2="128" y2="60" stroke="url(#metal-rod-zoom)" strokeWidth="4.5" strokeLinecap="butt" />
                        <line x1="340" y1="180" x2="128" y2="60" stroke="#475569" strokeWidth="0.8" opacity="0.4" />
                        <line x1="340" y1="180" x2="280" y2="146" stroke="#1e293b" strokeWidth="5.5" strokeLinecap="round" />
                        <circle cx="280" cy="146" r="4" fill="#d97706" />
                        <path d="M 128 60 L 112 51 C 110 50, 109 52, 111 54 L 124 63 Z" fill="#94a3b8" stroke="#1e293b" strokeWidth="0.8" />
                        <path d="M 128 60 L 115 67 C 113 68, 112 66, 114 64 L 126 61 Z" fill="#475569" stroke="#1e293b" strokeWidth="0.8" />
                      </g>
                      <circle cx="118" cy="58" r="14" fill="none" stroke="#d97706" strokeWidth="1" strokeDasharray="3 2" />
                      <text x="210" y="105" fill="#475569" fontSize="8" fontWeight="bold" fontFamily="Arial">Manche rigide en alliage d'aluminium</text>
                      <path d="M 210 108 L 220 120" stroke="#94a3b8" strokeWidth="0.8" fill="none" />
                      <text x="50" y="90" fill="#d97706" fontSize="8" fontWeight="black" fontFamily="Arial">Wedge Type 2 (35°)</text>
                      <path d="M 100 87 Q 112 85, 116 68" stroke="#d97706" strokeWidth="0.8" fill="none" strokeDasharray="2 1" />
                      <text x="235" y="45" fill="#ef4444" fontSize="8" fontWeight="black" fontFamily="Arial">Fissure humide d'arrosage</text>
                      <path d="M 230 43 L 180 50" stroke="#ef4444" strokeWidth="0.8" fill="none" />
                      <text x="200" y="195" fill="#1e293b" fontSize="8" fontWeight="bold" fontFamily="Arial">Position de sécurité du mineur (Sous toit sain)</text>
                    </svg>
                  )}

                  {activeLightbox === 'forage' && (
                    <svg viewBox="0 0 400 240" className="w-full h-full">
                      <defs>
                        <linearGradient id="montabert-paint-zoom" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#22c55e" />
                          <stop offset="30%" stopColor="#16a34a" />
                          <stop offset="70%" stopColor="#15803d" />
                          <stop offset="100%" stopColor="#14532d" />
                        </linearGradient>
                        <linearGradient id="shiny-steel-zoom" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#f1f5f9" />
                          <stop offset="30%" stopColor="#cbd5e1" />
                          <stop offset="70%" stopColor="#94a3b8" />
                          <stop offset="100%" stopColor="#475569" />
                        </linearGradient>
                        <linearGradient id="dark-steel-zoom" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#475569" />
                          <stop offset="50%" stopColor="#334155" />
                          <stop offset="100%" stopColor="#1e293b" />
                        </linearGradient>
                        <linearGradient id="yellow-hose-zoom" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#fef08a" />
                          <stop offset="50%" stopColor="#eab308" />
                          <stop offset="100%" stopColor="#ca8a04" />
                        </linearGradient>
                      </defs>
                      <rect x="5" y="5" width="390" height="230" rx="10" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="1" />
                      <g transform="translate(10, 10)">
                        <circle cx="40" cy="40" r="30" fill="#ffffff" stroke="#15803d" strokeWidth="1.5" />
                        <circle cx="40" cy="40" r="28.5" fill="#f1f5f9" />
                        <path d="M 22 40 L 32 30 L 52 30 L 58 40 L 54 52 L 26 52 Z" fill="url(#shiny-steel-zoom)" stroke="#334155" strokeWidth="1" />
                        <rect x="32" y="34" width="16" height="12" fill="none" stroke="#475569" strokeWidth="1" />
                        <circle cx="27" cy="40" r="3" fill="#fbbf24" stroke="#d97706" strokeWidth="0.8" />
                        <circle cx="34" cy="32" r="3" fill="#fbbf24" stroke="#d97706" strokeWidth="0.8" />
                        <circle cx="46" cy="32" r="3" fill="#fbbf24" stroke="#d97706" strokeWidth="0.8" />
                        <circle cx="53" cy="40" r="3" fill="#fbbf24" stroke="#d97706" strokeWidth="0.8" />
                        <circle cx="40" cy="42" r="4" fill="#fbbf24" stroke="#d97706" strokeWidth="0.8" />
                        <circle cx="34" cy="46" r="2" fill="#1e293b" />
                        <circle cx="46" cy="46" r="2" fill="#1e293b" />
                        <text x="40" y="82" fill="#15803d" fontSize="7" fontWeight="black" textAnchor="middle" fontFamily="Arial">TAILLANT BOUTONS</text>
                        <path d="M 68 49 L 105 85" stroke="#15803d" strokeWidth="0.8" strokeDasharray="2 2" fill="none" />
                      </g>
                      <line x1="80" y1="95" x2="160" y2="95" stroke="url(#shiny-steel-zoom)" strokeWidth="4" />
                      <line x1="80" y1="94" x2="160" y2="94" stroke="#f8fafc" strokeWidth="0.8" opacity="0.6" />
                      <rect x="145" y="91" width="4" height="8" fill="#475569" stroke="#1e293b" strokeWidth="0.8" />
                      <path d="M 70 91 L 76 91 L 78 88 L 82 88 L 84 91 L 86 95 L 84 99 L 82 102 L 78 102 L 76 99 L 70 99 Z" fill="url(#shiny-steel-zoom)" stroke="#1e293b" strokeWidth="1" />
                      <circle cx="78" cy="95" r="1" fill="#fbbf24" />
                      <circle cx="82" cy="92" r="0.8" fill="#fbbf24" />
                      <circle cx="82" cy="98" r="0.8" fill="#fbbf24" />
                      <path d="M 160 87 L 180 87 L 180 103 L 160 103 Z" fill="url(#dark-steel-zoom)" stroke="#1e293b" strokeWidth="1.2" />
                      <path d="M 180 82 L 225 82 L 225 108 L 180 108 Z" fill="url(#montabert-paint-zoom)" stroke="#14532d" strokeWidth="1.2" />
                      <rect x="187" y="85" width="4" height="20" fill="#15803d" opacity="0.4" />
                      <rect x="196" y="85" width="4" height="20" fill="#15803d" opacity="0.4" />
                      <rect x="205" y="85" width="4" height="20" fill="#15803d" opacity="0.4" />
                      <rect x="214" y="85" width="4" height="20" fill="#15803d" opacity="0.4" />
                      <line x1="162" y1="84" x2="242" y2="84" stroke="url(#shiny-steel-zoom)" strokeWidth="2.5" />
                      <line x1="162" y1="106" x2="242" y2="106" stroke="url(#shiny-steel-zoom)" strokeWidth="2.5" />
                      <rect x="158" y="82" width="3" height="5" rx="0.5" fill="#1e293b" />
                      <rect x="158" y="104" width="3" height="5" rx="0.5" fill="#1e293b" />
                      <rect x="241" y="82" width="3" height="5" rx="0.5" fill="#1e293b" />
                      <rect x="241" y="104" width="3" height="5" rx="0.5" fill="#1e293b" />
                      <path d="M 225 85 L 245 85 L 245 105 L 225 105 Z" fill="url(#dark-steel-zoom)" stroke="#1e293b" strokeWidth="1" />
                      <path d="M 240 85 L 255 70 C 257 68, 259 70, 257 72 L 245 92 Z" fill="url(#shiny-steel-zoom)" stroke="#1e293b" strokeWidth="1" />
                      <circle cx="256" cy="70" r="3.5" fill="#ef4444" stroke="#b91c1c" strokeWidth="0.8" />
                      <rect x="235" y="105" width="8" height="6" fill="url(#shiny-steel-zoom)" stroke="#1e293b" strokeWidth="0.8" />
                      
                      {/* Swivel point on right edge */}
                      <rect x="230" y="108" width="10" height="8" fill="url(#dark-steel-zoom)" stroke="#1e293b" strokeWidth="1" />
                      <circle cx="235" cy="112" r="3" fill="#fbbf24" stroke="#d97706" strokeWidth="1" />
                      
                      <line x1="235" y1="114" x2="285" y2="190" stroke="#475569" strokeWidth="7" strokeLinecap="round" />
                      <line x1="235" y1="114" x2="285" y2="190" stroke="url(#shiny-steel-zoom)" strokeWidth="3" strokeLinecap="round" />
                      <line x1="285" y1="190" x2="307" y2="223" stroke="url(#shiny-steel-zoom)" strokeWidth="3.5" strokeLinecap="round" />
                      <path d="M 307 223 L 300 228 L 315 231 L 313 221 Z" fill="#1e293b" stroke="#000" strokeWidth="1" />
                      <polygon points="303 226, 295 231, 301 233" fill="#1e293b" />
                      <polygon points="309 227, 315 234, 309 233" fill="#1e293b" />
                      
                      <path d="M 238 108 C 242 120, 265 140, 310 150" stroke="#0ea5e9" strokeWidth="3" fill="none" strokeLinecap="round" />
                      <path d="M 245 98 C 260 115, 290 125, 335 135" stroke="url(#yellow-hose-zoom)" strokeWidth="5.5" fill="none" strokeLinecap="round" />
                      <path d="M 245 98 C 260 115, 290 125, 335 135" stroke="#1e293b" strokeWidth="5.5" fill="none" strokeDasharray="3 8" strokeLinecap="round" opacity="0.75" />
                      <path d="M 245 92 Q 262 102 278 110" stroke="#cbd5e1" strokeWidth="1.2" fill="none" />
                      <path d="M 245 92 Q 262 102 278 110" stroke="#64748b" strokeWidth="0.5" fill="none" />
                      <circle cx="245" cy="92" r="2" fill="#64748b" />
                      <circle cx="278" cy="110" r="2" fill="#64748b" />
                      <text x="145" y="55" fill="#15803d" fontSize="8" fontWeight="black" fontFamily="Arial">MONTABERT T23 (SMI)</text>
                      <path d="M 195 58 L 195 81" stroke="#15803d" strokeWidth="0.8" fill="none" />
                      <text x="320" y="125" fill="#d97706" fontSize="7.5" fontWeight="bold" fontFamily="Arial">Air 2" (7 bar)</text>
                      <text x="290" y="165" fill="#0284c7" fontSize="7.5" fontWeight="bold" fontFamily="Arial">Eau de rinçage</text>
                      <text x="285" y="100" fill="#475569" fontSize="7" fontWeight="bold" fontFamily="Arial">Câble Whipcheck</text>
                      <path d="M 280 102 L 265 103" stroke="#94a3b8" strokeWidth="0.6" fill="none" />
                      <text x="105" y="150" fill="#475569" fontSize="8" fontWeight="bold" fontFamily="Arial">Poussoir télescopique</text>
                      <path d="M 185 148 Q 240 148 250 140" stroke="#94a3b8" strokeWidth="0.6" fill="none" />
                      <text x="310" y="215" fill="#1e293b" fontSize="7" fontWeight="bold" fontFamily="Arial">Griffe d'ancrage (Sol)</text>
                    </svg>
                  )}

                  {activeLightbox === 'soufflage' && (
                    <svg viewBox="0 0 240 260" className="w-full h-full max-w-[240px]">
                      <defs>
                        <linearGradient id="rock-face-zoom" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor="#334155" />
                          <stop offset="100%" stopColor="#0f172a" />
                        </linearGradient>
                        <linearGradient id="copper-pipe-zoom" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#ea580c" />
                          <stop offset="50%" stopColor="#ffedd5" />
                          <stop offset="100%" stopColor="#9a3412" />
                        </linearGradient>
                        <radialGradient id="air-glow-zoom" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.6" />
                          <stop offset="100%" stopColor="#38bdf8" stopOpacity="0" />
                        </radialGradient>
                      </defs>
                      <rect x="5" y="5" width="230" height="250" rx="10" fill="#1e293b" stroke="#334155" strokeWidth="1" />
                      <path d="M 45 30 L 45 110 Q 45 130, 45 135 L 45 160 L 45 230" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="3 3" opacity="0.15" />
                      <path d="M 45 5 L 45 135 L 215 135 L 215 160 L 45 160 L 45 255" fill="none" stroke="#475569" strokeWidth="4" />
                      <path d="M 45 135 L 215 135" stroke="#ef4444" strokeWidth="1" opacity="0.6" />
                      <path d="M 45 160 L 215 160" stroke="#ef4444" strokeWidth="1" opacity="0.6" />
                      <rect x="47" y="137" width="166" height="21" fill="url(#rock-face-zoom)" />
                      <circle cx="100" cy="143" r="1.5" fill="#0284c7" />
                      <circle cx="160" cy="151" r="1.2" fill="#0284c7" />
                      <ellipse cx="140" cy="148.5" rx="75" ry="10" fill="#f8fafc" opacity="0.08" />
                      <line x1="15" y1="147.5" x2="155" y2="147.5" stroke="url(#copper-pipe-zoom)" strokeWidth="4.5" strokeLinecap="round" />
                      <line x1="15" y1="146.5" x2="155" y2="146.5" stroke="#ffedd5" strokeWidth="0.8" opacity="0.6" />
                      <rect x="150" y="144" width="7" height="7" rx="1" fill="#475569" stroke="#1e293b" strokeWidth="0.8" />
                      <line x1="157" y1="147.5" x2="206" y2="147.5" stroke="#e0f2fe" strokeWidth="2.5" strokeLinecap="round" opacity="0.9" />
                      <line x1="157" y1="147.5" x2="200" y2="142" stroke="#38bdf8" strokeWidth="1" opacity="0.8" />
                      <line x1="157" y1="147.5" x2="200" y2="153" stroke="#38bdf8" strokeWidth="1" opacity="0.8" />
                      <path d="M 205 147.5 C 205 130, 150 131, 45 134" stroke="url(#air-glow-zoom)" strokeWidth="2" fill="none" strokeLinecap="round" />
                      <path d="M 205 147.5 C 205 165, 150 164, 45 161" stroke="url(#air-glow-zoom)" strokeWidth="2" fill="none" strokeLinecap="round" />
                      <ellipse cx="40" cy="147.5" rx="14" ry="26" fill="#94a3b8" opacity="0.25" />
                      <ellipse cx="30" cy="147.5" rx="10" ry="18" fill="#cbd5e1" opacity="0.35" />
                      <circle cx="36" cy="132" r="1.5" fill="#3b82f6" opacity="0.9" />
                      <circle cx="28" cy="155" r="1" fill="#94a3b8" />
                      <circle cx="48" cy="160" r="1.2" fill="#64748b" />
                      <circle cx="32" cy="162" r="1.5" fill="#3b82f6" opacity="0.9" />
                      <circle cx="24" cy="140" r="1" fill="#cbd5e1" />
                      <path d="M 185 142 L 188 145 L 193 147 L 188 149 L 185 152 L 182 149 L 177 147 L 182 145 Z" fill="#eab308" />
                      <circle cx="185" cy="147" r="1" fill="#ffffff" />
                      <circle cx="110" cy="137" r="0.8" fill="#eab308" />
                      <text x="120" y="25" fill="#f1f5f9" fontSize="10" fontWeight="black" textAnchor="middle" fontFamily="Arial" letterSpacing="1">SOUFFLAGE DU FRONT</text>
                      <text x="120" y="98" fill="#38bdf8" fontSize="8" fontWeight="black" textAnchor="middle" fontFamily="Arial">FLUX D'AIR COMPRIMÉ CYCLONIQUE</text>
                      <text x="120" y="195" fill="#eab308" fontSize="8" fontWeight="black" textAnchor="middle" fontFamily="Arial">ÉVACUATION SILICE & HUMIDITÉ</text>
                      <text x="120" y="210" fill="#cbd5e1" fontSize="7.5" fontWeight="bold" textAnchor="middle" fontFamily="Arial">Conformité de tir 100% assurée</text>
                      <text x="120" y="248" fill="#94a3b8" fontSize="7.5" fontWeight="bold" textAnchor="middle" fontFamily="Arial">Canne de soufflage cuivre Ø12mm</text>
                      <path d="M 120 238 Q 110 230, 95 152" stroke="#94a3b8" strokeWidth="0.8" fill="none" strokeDasharray="2 2" />
                    </svg>
                  )}
                </div>
                
                <p className="mt-4 text-xs text-slate-500 text-center leading-relaxed font-medium">
                  {activeLightbox === 'purge' && "Détail haute définition de la pince à purger et du bec de Type 2 SMI avec biseau double trempé de 35° engagé dans la fissure."}
                  {activeLightbox === 'forage' && "Schéma précis du perforateur à poussoir pneumatique Montabert T23 en livrée verte d'origine avec son raccordement de béquille excentré à l'arrière."}
                  {activeLightbox === 'soufflage' && "Illustration de la canne de soufflage en cuivre insérée à fond de trou pour l'évacuation cyclonique des poussières de silice."}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
