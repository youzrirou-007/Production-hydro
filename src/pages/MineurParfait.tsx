import React, { useState } from 'react';
import { t } from '../data/mineurParfaitTranslations';
import { IllustrationPurge, IllustrationForage, IllustrationSoufflage, IllustrationPortanole } from '../components/Illustrations';
import bannerExcellenceImg from '../assets/images/Banner excellence.jpg';
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
  const [lang, setLang] = useState<'fr' | 'ar'>('fr');
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
      return { text: t[lang].verdictPerfect, color: 'text-emerald-600' };
    }
    if (divergenceAngle <= 1) {
      return { text: `${t[lang].verdictExcellent}${effectiveCm}cm`, color: 'text-emerald-600' };
    }
    if (divergenceAngle <= 2) {
      return { text: `${t[lang].verdictAcceptable}${effectiveCm}cm`, color: 'text-amber-600' };
    }
    if (divergenceAngle <= 3) {
      return { text: `${t[lang].verdictAttention}${effectiveCm}cm`, color: 'text-orange-600' };
    }
    return { text: `${t[lang].verdictCritique}${effectiveCm}cm${t[lang].verdictReformer}`, color: 'text-rose-600' };
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

  const renderStepHeader = (num: number, _icon: string, _title: string, _cat: 'FORAGE' | 'EXPLOSIFS' | 'TECHNIQUE' | 'SÉCURITÉ') => {
    const stepConfig = t[lang].stepHeaders.find(s => s.num === num)!;
    const isOpen = expandedStep === num;
    const catStyles = {
      FORAGE: 'bg-blue-50 text-blue-700 border border-blue-200',
      EXPLOSIFS: 'bg-rose-50 text-rose-700 border border-rose-200',
      TECHNIQUE: 'bg-slate-100 text-slate-700 border border-slate-200',
      SÉCURITÉ: 'bg-amber-50 text-amber-800 border border-amber-200',
      'حفر': 'bg-blue-50 text-blue-700 border border-blue-200',
      'متفجرات': 'bg-rose-50 text-rose-700 border border-rose-200',
      'فني': 'bg-slate-100 text-slate-700 border border-slate-200',
      'سلامة': 'bg-amber-50 text-amber-800 border border-amber-200',
    };

    const catLabel = stepConfig.cat;
    const catClass = catStyles[catLabel as keyof typeof catStyles] || 'bg-slate-100 text-slate-700 border border-slate-200';

    return (
      <div 
        onClick={() => toggleStep(num)}
        className="p-5 flex items-center justify-between cursor-pointer select-none bg-slate-50/40 hover:bg-slate-50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <div className="bg-gradient-to-br from-amber-400 to-[#b8860b] text-white font-black text-sm w-9 h-9 flex items-center justify-center rounded-full shadow-xs">
            {num}
          </div>
          <span className="text-2xl">{stepConfig.icon}</span>
          <h3 className="font-bold text-slate-800 text-[14px] uppercase tracking-wide">
            {stepConfig.title}
          </h3>
        </div>
        <div className="flex items-center gap-3">
          <span className={`text-[9px] font-extrabold uppercase px-2.5 py-0.5 rounded-full tracking-wider ${catClass}`}>
            {catLabel}
          </span>
          {isOpen ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white text-slate-800 pb-24 font-sans" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className={`max-w-4xl mx-auto px-4 ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
        
        {/* Language Selection Button */}
        <div className="pt-4 flex justify-end">
          <button
            onClick={() => setLang(lang === 'fr' ? 'ar' : 'fr')}
            className="flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-wider rounded-xl border border-amber-500/20 bg-amber-500/5 text-[#b8860b] hover:bg-amber-500/10 transition-all cursor-pointer shadow-sm"
          >
            🌐 {lang === 'fr' ? 'العربية' : 'Français'}
          </button>
        </div>

        {/* Premium Excellence Gold Banner with Banner excellence image */}
        <div 
          className="p-6 sm:p-8 rounded-3xl border border-amber-500/30 shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6 mb-6 mt-6"
        >
          {/* Banner Image Background (100% original, untouched) */}
          <div 
            className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none"
            style={{ backgroundImage: `url(${bannerExcellenceImg})` }}
          />

          <div className={`flex items-center gap-5 z-10 text-center ${lang === 'ar' ? 'md:text-right' : 'md:text-left'} flex-col md:flex-row`}>
            <div className="w-16 h-16 shrink-0 relative flex items-center justify-center drop-shadow-[0_4px_8px_rgba(0,0,0,0.8)]">
              <svg viewBox="0 0 100 100" className="w-16 h-16">
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
            <div className="text-center">
              <div className="subtle-glow-line w-24 mb-1.5 mx-auto opacity-80" />
              <h1 className="gold-title text-xl sm:text-2xl md:text-3xl font-black tracking-wider leading-none uppercase">
                {t[lang].title}
              </h1>
              <div className="subtle-glow-line w-full mt-2 mb-2.5 mx-auto opacity-80" />
              <p className="text-[10px] sm:text-xs font-black uppercase text-amber-100 tracking-widest text-center">
                {t[lang].subtitle}
              </p>
            </div>
          </div>

          {/* Welcome Card & Bilan summary on the right side - representing the 25% Excellence Touch */}
          <div className="bg-slate-900/80 backdrop-blur-md border border-amber-400/40 rounded-2xl p-4 flex flex-col items-center justify-center text-center z-10 w-full md:w-56 shrink-0 shadow-lg">
            <div className="text-[#ffd700] text-[8px] font-black uppercase tracking-wider">
              {t[lang].targetYield}
            </div>
            <div className="text-white text-[12px] font-black uppercase flex items-center gap-1.5 mt-1">
              {t[lang].excellence}
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <p className="text-[9px] text-amber-200 font-bold uppercase tracking-widest mt-1">
              {t[lang].fromBouchon}
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
                    {t[lang].step1Title}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                    {t[lang].step1Grid.map((item, idx) => (
                      <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-200/60">
                        <div className="font-black text-[#b8860b] uppercase text-[10px] tracking-wider mb-1">{item.title}</div>
                        <p>{item.text}</p>
                      </div>
                    ))}
                  </div>
                  <Alert type="securite" text={t[lang].step1Alert} />
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
                    {t[lang].step2Title}
                  </p>
                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-200/60 space-y-3.5">
                    <h4 className="font-black uppercase text-[10px] tracking-widest text-slate-500">{t[lang].step2ProcTitle}</h4>
                    <ol className={`list-decimal ${lang === 'ar' ? 'pr-5' : 'pl-5'} space-y-2.5 text-slate-700 font-medium`}>
                      {t[lang].step2Proc.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ol>
                  </div>
                  <Alert type="regle" text={t[lang].step2Alert} />
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
                    {t[lang].step3Title}
                  </p>
                  <Alert type="regle" text={t[lang].step3Alert} />
                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-200/60 space-y-3.5 mt-4">
                    <h4 className="font-black uppercase text-[10px] tracking-widest text-slate-500">{t[lang].step3ProcTitle}</h4>
                    <ol className={`list-decimal ${lang === 'ar' ? 'pr-5' : 'pl-5'} space-y-2.5 text-slate-700 font-medium`}>
                      {t[lang].step3Proc.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ol>
                  </div>
                  <Alert type="securite" text={t[lang].step3AlertSilicose} />
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
                  <Alert type="regle" text={t[lang].step4Alert} />
                  <p className="font-bold text-slate-800 text-sm mb-4">
                    {t[lang].step4Title}
                  </p>

                  {/* HIGH-FIDELITY VECTOR ILLUSTRATION FOR PURGE */}
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/60 flex flex-col md:flex-row gap-6 items-center my-5">
                    <div className="w-full md:w-1/2 space-y-3">
                      <div>
                        <span className="text-[10px] font-black text-[#b8860b] uppercase tracking-wider block">{t[lang].purgeEquip}</span>
                        <h4 className="text-sm font-black text-slate-800 uppercase tracking-wide">{t[lang].purgeEquipTitle}</h4>
                      </div>
                      <p className="text-slate-600 leading-relaxed text-[11px]">
                        {t[lang].purgeEquipDesc1}
                      </p>
                      <p className="text-slate-600 leading-relaxed text-[11px]">
                        {t[lang].purgeEquipDesc2}
                      </p>
                    </div>
                    <div className="w-full md:w-1/2 bg-white rounded-xl p-3 border border-slate-200/50 flex flex-col items-center justify-center shadow-xs">
                      <IllustrationPurge className="w-full h-auto max-w-[280px]" />
                      
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
                          <span>{t[lang].btnEnLarge}</span>
                        </span>
                      </motion.button>

                      <div className="flex gap-4 text-[9px] text-slate-500 font-bold uppercase mt-1 border-t border-slate-100 pt-2 w-full justify-around">
                        <span className="flex items-center gap-1">{t[lang].purgeSpecs1}</span>
                        <span className="flex items-center gap-1">{t[lang].purgeSpecs2}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-200/60 space-y-3">
                    <h4 className="font-black text-[#b8860b] uppercase text-[10px] tracking-widest">{t[lang].step4RuleTitle}</h4>
                    <ul className={`list-disc ${lang === 'ar' ? 'pr-5' : 'pl-5'} space-y-2.5 text-slate-700 font-medium`}>
                      {t[lang].step4Rules.map((item, idx) => (
                        <li key={idx}>{item}</li>
                      ))}
                    </ul>
                  </div>
                  <Alert type="securite" text={t[lang].step4AlertSafety} />
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
                    {t[lang].step5Title}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-4">
                      <div className="bg-slate-50 p-5 rounded-xl border border-slate-200/60">
                        <h4 className="font-black text-[#b8860b] uppercase text-[10px] tracking-widest mb-3">{t[lang].step5ChecklistTitle}</h4>
                        <ul className="space-y-2 text-slate-700 font-medium">
                          {t[lang].step5Checklist.map((item, idx) => (
                            <li key={idx}>☐ {item}</li>
                          ))}
                        </ul>
                      </div>
                      <div className="bg-slate-50 p-5 rounded-xl border border-slate-200/60">
                        <h4 className="font-black text-[#b8860b] uppercase text-[10px] tracking-widest mb-3">{t[lang].step5FlexTitle}</h4>
                        <ul className="space-y-2 text-slate-700 font-medium">
                          {t[lang].step5Flex.map((item, idx) => {
                            const lines = item.split('\n');
                            return (
                              <li key={idx}>
                                ☐ {lines[0]}
                                {lines.slice(1).map((line, lIdx) => (
                                  <span key={lIdx} className={`${lang === 'ar' ? 'pr-4' : 'pl-4'} text-slate-500 block`}>
                                    {line}
                                  </span>
                                ))}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 flex flex-col items-center justify-center">
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">
                        {lang === 'ar' ? "مخطط المطرقة الثاقبة والدعامة الهوائية" : "SCHÉMA PERFORATEUR & POUSSOIR"}
                      </span>
                      <div className="bg-white rounded-xl p-3 border border-slate-200/40 w-full flex flex-col items-center justify-center shadow-xs">
                        <IllustrationForage className="w-full h-auto max-w-[290px]" />

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
                            <span>{t[lang].btnEnLarge}</span>
                          </span>
                        </motion.button>
                      </div>
                      <div className="text-[8px] text-slate-500 font-semibold mt-2 uppercase tracking-wide">
                        {t[lang].pressureSpecs}
                      </div>
                    </div>
                  </div>
                  <Alert type="securite" text={t[lang].step5SafetyAlert} />
                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-200/60 mt-4">
                    <h4 className="font-black text-rose-700 uppercase text-[10px] tracking-widest mb-2">{t[lang].step5NoiseTitle}</h4>
                    <p className="text-slate-700 font-medium">{t[lang].step5NoiseDesc}</p>
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
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#b8860b]">{t[lang].gallerySection}</span>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => setGabarit('12m2')}
                        className={`px-3 py-1.5 rounded-lg font-black text-[10px] uppercase tracking-wide transition-all ${gabarit === '12m2' ? 'bg-[#b8860b] text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                      >
                        🔷 {t[lang].smiGabarit}
                      </button>
                      <button 
                        onClick={() => setGabarit('12m2_intl')}
                        className={`px-3 py-1.5 rounded-lg font-black text-[10px] uppercase tracking-wide transition-all ${gabarit === '12m2_intl' ? 'bg-[#b8860b] text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                      >
                        🌍 {t[lang].intlGabarit}
                      </button>
                      <button 
                        onClick={() => setGabarit('9m2')}
                        className={`px-3 py-1.5 rounded-lg font-black text-[10px] uppercase tracking-wide transition-all ${gabarit === '9m2' ? 'bg-[#b8860b] text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
                      >
                        🔹 {t[lang].gabarit9m2}
                      </button>
                    </div>
                  </div>

                  <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5">
                    <div className="text-center">
                      <div className="text-[#b8860b] font-black text-4xl">
                        1.7m
                      </div>
                      <div className="text-slate-500 text-[10px] font-black uppercase tracking-wider mt-1">
                        {t[lang].foreMustArrache}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3 mt-4 text-center">
                      <div>
                        <div className="text-slate-800 font-black text-xl">100%</div>
                        <div className="text-emerald-600 text-[9px] uppercase font-bold">{t[lang].bourrageParfait}</div>
                      </div>
                      <div>
                        <div className="text-slate-800 font-black text-xl">0°</div>
                        <div className="text-emerald-600 text-[9px] uppercase font-bold">{t[lang].divergenceIdeale}</div>
                      </div>
                      <div>
                        <div className="text-slate-800 font-black text-xl">{gabarit === '9m2' ? '28' : '38'}</div>
                        <div className="text-emerald-600 text-[9px] uppercase font-bold">{t[lang].trousRespectes}</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">{t[lang].planTirInteractive}</h4>
                    <p className="text-[10px] text-slate-500">{t[lang].planTirInstruction}</p>
                    
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
                            {t[lang].activeGroupLabels[activeGroup] || t[lang].activeGroupLabels['contour']}
                          </text>
                        )}
                      </svg>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full mt-4 border-t border-slate-200 pt-4 text-[10px] text-slate-700 font-medium">
                        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#60a5fa] border border-[#3b82f6]" /> <span>{t[lang].legendVide}</span></div>
                        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#fbbf24] border border-[#f59e0b]" /> <span>{t[lang].legendBouchon}</span></div>
                        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#22c55e] border border-[#16a34a]" /> <span>{t[lang].legendG1}</span></div>
                        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#f97316] border border-[#ea580c]" /> <span>{t[lang].legendG2}</span></div>
                        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#06b6d4] border border-[#0891b2]" /> <span>{t[lang].legendG3}</span></div>
                        {gabarit !== '9m2' && (
                          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#a855f7] border border-[#9333ea]" /> <span>{t[lang].legendG4}</span></div>
                        )}
                        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#8b5cf6] border border-[#7c3aed]" /> <span>{t[lang].legendRadier} ({gabarit === '9m2' ? 'D4' : 'D5'})</span></div>
                        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#2dd4bf] border border-[#14b8a6]" /> <span>{t[lang].legendParements} ({gabarit === '9m2' ? 'D4' : 'D5'})</span></div>
                        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-[#f43f5e] border border-[#e11d48]" /> <span>{t[lang].legendVoute} ({gabarit === '9m2' ? 'D5' : 'D6'})</span></div>
                      </div>

                      <div className="text-[10px] text-slate-500 mt-4 text-center bg-white px-4 py-2 rounded-xl border border-slate-200/80">
                        {gabarit === '12m2' && t[lang].gabarit12m2Label}
                        {gabarit === '12m2_intl' && t[lang].gabaritIntlLabel}
                        {gabarit === '9m2' && t[lang].gabarit9m2Label}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3.5">
                    <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">{t[lang].ordreForageTitle}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 flex flex-col justify-between">
                        <div>
                          <div className="font-black text-[#b8860b] text-[10px] uppercase tracking-wider mb-2">{t[lang].orderStepA}</div>
                          <p className="text-[10px] text-slate-600">{t[lang].orderStepADesc}</p>
                        </div>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 flex flex-col justify-between">
                        <div>
                          <div className="font-black text-[#b8860b] text-[10px] uppercase tracking-wider mb-2">{t[lang].orderStepB}</div>
                          <p className="text-[10px] text-slate-600">
                            {gabarit === '9m2' ? t[lang].orderStepBDesc9m2 : t[lang].orderStepBDesc12m2}.
                          </p>
                        </div>
                      </div>
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 flex flex-col justify-between">
                        <div>
                          <div className="font-black text-[#b8860b] text-[10px] uppercase tracking-wider mb-2">{t[lang].orderStepC}</div>
                          <p className="text-[10px] text-slate-600">{t[lang].orderStepCDesc}</p>
                        </div>
                      </div>
                    </div>
                    <Alert type="regle" text={t[lang].orderRule} />
                  </div>

                  <div className="space-y-4 pt-2 border-t border-slate-200">
                    <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">{t[lang].parallelismeTitle}</h4>
                    <p className="text-[10.5px] text-slate-600 leading-relaxed">
                      {t[lang].parallelismeDesc}
                    </p>
                    
                    <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/60 space-y-4">
                      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
                        <span className="font-bold text-slate-700 text-[10px] uppercase tracking-wider">{t[lang].simulatorDeviation}</span>
                        <span className="text-[#b8860b] font-mono font-black text-sm bg-white px-3 py-1 rounded-lg border border-slate-200 shadow-xs">
                          {t[lang].angleDivergence} : {divergenceAngle}°
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
                          <div className="text-[10px] uppercase text-slate-500 font-bold">{t[lang].volumeArrache}</div>
                          <div className={`text-lg font-black mt-0.5 ${verdict.color}`}>
                            {effectiveCm} cm / {drilledCm} cm
                          </div>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-slate-200/60 shadow-xs">
                          <div className="text-[10px] uppercase text-slate-500 font-bold">{t[lang].rendementVolee}</div>
                          <div className={`text-lg font-black mt-0.5 ${verdict.color}`}>
                            {yieldPct}%
                          </div>
                        </div>
                        <div className="bg-white p-3 rounded-xl border border-slate-200/60 shadow-xs">
                          <div className="text-[10px] uppercase text-slate-500 font-bold">{t[lang].culotResiduel}</div>
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
                        <table className="w-full text-left text-[10px] border-collapse" dir="ltr">
                          <thead>
                            <tr className="border-b border-slate-200 text-slate-500 uppercase tracking-wider">
                              <th className="py-2">{t[lang].angle}</th>
                              <th className="py-2">{t[lang].culot}</th>
                              <th className="py-2">{t[lang].arrache}</th>
                              <th className="py-2">{t[lang].rendement}</th>
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
                    {t[lang].step7Title}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5 items-stretch">
                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-200/60 space-y-3.5 md:col-span-2 flex flex-col justify-between">
                      <div>
                        <h4 className="font-black uppercase text-[10px] tracking-widest text-slate-500 mb-2">{t[lang].step7ChecklistTitle}</h4>
                        <ul className="space-y-3 text-slate-700 font-medium text-[11px]">
                          {t[lang].step7Checklist.map((item, idx) => {
                            const lines = item.split('\n');
                            return (
                              <li key={idx} className="flex items-start gap-2.5">
                                <span className="text-[#b8860b] font-bold">☐</span>
                                <div>
                                  {lines.map((line, lIdx) => (
                                    <span key={lIdx} className={`${lIdx > 0 ? (lang === 'ar' ? 'text-slate-500 pr-4 block mt-0.5' : 'text-slate-500 pl-4 block mt-0.5') : 'block'}`}>
                                      {line}
                                    </span>
                                  ))}
                                </div>
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                      <div className="text-[10px] text-[#b8860b] font-bold bg-amber-500/5 p-3 rounded-lg border border-amber-500/10 mt-2">
                        {t[lang].step7Advice}
                      </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 flex flex-col items-center justify-center">
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2.5 text-center">{t[lang].step7VisualTitle}</span>
                      <div className="bg-white rounded-xl p-3 border border-slate-200/40 w-full flex flex-col items-center justify-center shadow-xs">
                        <IllustrationSoufflage className="w-full h-auto max-w-[200px]" />

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
                            <span>{t[lang].btnEnLarge}</span>
                          </span>
                        </motion.button>
                      </div>
                    </div>
                  </div>

                  <Alert type="technique" text={t[lang].step7Alert} />
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
                    {t[lang].step8Title}
                  </p>

                  <div className="space-y-3">
                    <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">{t[lang].step8TovexTitle}</h4>
                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-200/60 space-y-3">
                      <ol className={`list-decimal ${lang === 'ar' ? 'pr-5' : 'pl-5'} space-y-2 text-slate-700 font-medium`}>
                        <li>{t[lang].step8TovexProc[0]}</li>
                        <li>{t[lang].step8TovexProc[1]}</li>
                        <li className="font-bold text-slate-800">{t[lang].step8TovexProc[2]}</li>
                      </ol>
                      <Alert type="regle" text={t[lang].step8TovexProc[3]} />
                      <ol className={`list-decimal ${lang === 'ar' ? 'pr-5' : 'pl-5'} space-y-2 text-slate-700 font-medium`} start={4}>
                        <li>{t[lang].step8TovexProc[4]}</li>
                        <li>{t[lang].step8TovexProc[5]}</li>
                        <li>{t[lang].step8TovexProc[6]}</li>
                      </ol>
                    </div>
                  </div>

                  <div className="space-y-4 pt-2 border-t border-slate-200">
                    <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">{t[lang].step8PortanoleTitle}</h4>
                    
                    <div className="flex flex-col md:flex-row gap-6 items-center">
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 w-full max-w-[220px] flex justify-center">
                        <IllustrationPortanole className="w-full h-auto max-w-[200px]" />
                      </div>

                      <div className="flex-1 space-y-2">
                        <ol className={`list-decimal ${lang === 'ar' ? 'pr-5' : 'pl-5'} space-y-1.5 text-slate-700 font-medium`}>
                          {t[lang].step8PortanoleProc.map((stepItem, sIdx) => (
                            <li key={sIdx}>{stepItem}</li>
                          ))}
                        </ol>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 space-y-2 text-[10.5px]">
                      <div className="font-bold text-slate-800 mb-1">{t[lang].colonneConfigTitle}</div>
                      <p className="text-slate-600">• {t[lang].colonneConfig18}</p>
                      <p className="text-slate-600">• {t[lang].colonneConfig24}</p>
                    </div>

                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-200/60">
                      <div className="font-black text-slate-700 text-[10px] uppercase tracking-wider mb-2">
                        {t[lang].step8QuantitiesTitle.replace('{gabarit}', gabarit === '9m2' ? (lang === 'ar' ? '9م²' : '9m²') : gabarit === '12m2' ? (lang === 'ar' ? '12م² EXCELLENCE' : '12m² EXCELLENCE') : (lang === 'ar' ? '12م² الدولي' : '12m² Intl'))}
                      </div>
                      {gabarit === '9m2' ? (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                          <div className="bg-white p-2 rounded-lg border border-slate-200/60">
                            <div className="font-bold text-[#b8860b]">{lang === 'ar' ? "22 إلى 24 كجم" : "22 à 24 kg"}</div>
                            <div className="text-[8px] text-slate-500">{t[lang].qAnfoTotal}</div>
                          </div>
                          <div className="bg-white p-2 rounded-lg border border-slate-200/60">
                            <div className="font-bold text-[#b8860b]">{lang === 'ar' ? "4 خراطيش" : "4 cartouches"}</div>
                            <div className="text-[8px] text-slate-500">{t[lang].qTovex100g}</div>
                          </div>
                          <div className="bg-white p-2 rounded-lg border border-slate-200/60">
                            <div className="font-bold text-[#b8860b]">{lang === 'ar' ? "28 وحدة" : "28 unités"}</div>
                            <div className="text-[8px] text-slate-500">{t[lang].qAmorces}</div>
                          </div>
                          <div className="bg-white p-2 rounded-lg border border-slate-200/60">
                            <div className="font-bold text-[#b8860b]">{lang === 'ar' ? "27 ثقباً" : "27 trous"}</div>
                            <div className="text-[8px] text-slate-500">{t[lang].qToCharge}</div>
                          </div>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                          <div className="bg-white p-2 rounded-lg border border-slate-200/60">
                            <div className="font-bold text-[#b8860b]">{lang === 'ar' ? "29 إلى 32 كجم" : "29 à 32 kg"}</div>
                            <div className="text-[8px] text-slate-500">{t[lang].qAnfoTotal}</div>
                          </div>
                          <div className="bg-white p-2 rounded-lg border border-slate-200/60">
                            <div className="font-bold text-[#b8860b]">
                              {lang === 'ar' 
                                ? (gabarit === '12m2' ? "6 خراطيش" : "3 خراطيش") 
                                : `${gabarit === '12m2' ? '6' : '3'} cartouches`}
                            </div>
                            <div className="text-[8px] text-slate-500">{t[lang].qTovex100g}</div>
                          </div>
                          <div className="bg-white p-2 rounded-lg border border-slate-200/60">
                            <div className="font-bold text-[#b8860b]">{lang === 'ar' ? "38 وحدة" : "38 unités"}</div>
                            <div className="text-[8px] text-slate-500">{t[lang].qAmorces}</div>
                          </div>
                          <div className="bg-white p-2 rounded-lg border border-slate-200/60">
                            <div className="font-bold text-[#b8860b]">
                              {lang === 'ar' 
                                ? (gabarit === '12m2' ? "35 ثقباً" : "32 ثقباً") 
                                : `${gabarit === '12m2' ? '35' : '32'} trous`}
                            </div>
                            <div className="text-[8px] text-slate-500">{t[lang].qToCharge}</div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3 pt-2 border-t border-slate-200">
                    <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider">{t[lang].lBourrageTitle}</h4>
                    <p className="text-[10.5px] text-slate-600 leading-relaxed">
                      {t[lang].lBourrageDesc}
                    </p>
                    
                    <div className="bg-slate-50 border border-amber-500/20 rounded-xl p-4">
                      <div className="text-[#b8860b] font-mono font-black text-xl text-center">
                        {t[lang].lBourrageFormula}
                      </div>
                      <div className="text-center text-slate-600 text-[10px] mt-2 uppercase tracking-wider">
                        {t[lang].lBourrageMinimum}
                      </div>
                    </div>

                    <div className="bg-slate-50 p-5 rounded-xl border border-slate-200/60 space-y-3 text-slate-700 font-medium">
                      <div className="font-bold text-slate-800">{t[lang].bourrageProcTitle}</div>
                      <ul className={`list-disc ${lang === 'ar' ? 'pr-5' : 'pl-5'} space-y-2`}>
                        <li>
                          <span className="font-semibold text-[#b8860b]">{t[lang].bourrageProc1}</span><br/>
                          <span className={`${lang === 'ar' ? 'pr-4' : 'pl-4'} text-slate-500 block`}>{t[lang].bourrageProc1a}</span>
                          <span className={`${lang === 'ar' ? 'pr-4' : 'pl-4'} text-slate-500 block`}>{t[lang].bourrageProc1b}</span>
                        </li>
                        <li>{t[lang].bourrageProc2}</li>
                        <li>{t[lang].bourrageProc3}</li>
                        <li>{t[lang].bourrageProc4}</li>
                        <li>{t[lang].bourrageProc5}</li>
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
                    {t[lang].step9Title}
                  </p>

                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-200/60 space-y-3">
                    <h4 className="font-black uppercase text-[10px] tracking-widest text-slate-500">{t[lang].step9ChecklistTitle}</h4>
                    <ul className="space-y-2.5 text-slate-700 font-medium">
                      {t[lang].step9Checklist.map((chk, cIdx) => (
                        <li key={cIdx} className="flex items-start gap-2.5">
                          <span>☐</span> <span>{chk}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bg-slate-50 p-5 rounded-xl border border-slate-200/60 space-y-2.5">
                    <h4 className="font-black text-[#b8860b] uppercase text-[10px] tracking-widest">{t[lang].step9ProcTitle}</h4>
                    <ol className={`list-decimal ${lang === 'ar' ? 'pr-5' : 'pl-5'} space-y-2 text-[10.5px] text-slate-700 font-medium`}>
                      {t[lang].step9Proc.map((prc, pIdx) => (
                        <li key={pIdx}>{prc}</li>
                      ))}
                    </ol>
                  </div>

                  <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl text-rose-900 text-[10.5px]">
                    <div className="font-black text-rose-700 uppercase tracking-wider mb-1">{t[lang].step9AlertTitle}</div>
                    {t[lang].step9Alerts.map((altLine, aIdx) => (
                      <p key={aIdx} className="font-medium">{altLine}</p>
                    ))}
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
                    {t[lang].step10Desc}
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 flex flex-col justify-between">
                      <div>
                        <div className="font-bold text-slate-800 text-[10px] uppercase tracking-wider mb-1">{t[lang].step10Grid1Title}</div>
                        <p className="text-slate-600">
                          {gabarit === '9m2' ? t[lang].step10Grid1Desc9m2 : t[lang].step10Grid1Desc12m2}
                        </p>
                      </div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 flex flex-col justify-between">
                      <div>
                        <div className="font-bold text-slate-800 text-[10px] uppercase tracking-wider mb-1">{t[lang].step10Grid2Title}</div>
                        <p className="text-slate-600">
                          {gabarit === '12m2' && t[lang].step10Grid2Desc12m2}
                          {gabarit === '12m2_intl' && t[lang].step10Grid2DescIntl}
                          {gabarit === '9m2' && t[lang].step10Grid2Desc9m2}
                        </p>
                      </div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 flex flex-col justify-between">
                      <div>
                        <div className="font-bold text-slate-800 text-[10px] uppercase tracking-wider mb-1">{t[lang].step10Grid3Title}</div>
                        <p className="text-slate-600 font-semibold">{t[lang].step10Grid3Desc}</p>
                      </div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 flex flex-col justify-between">
                      <div>
                        <div className="font-bold text-slate-800 text-[10px] uppercase tracking-wider mb-1">{t[lang].step10Grid4Title}</div>
                        <p className="text-slate-600">{t[lang].step10Grid4Desc}</p>
                      </div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 flex flex-col justify-between">
                      <div>
                        <div className="font-bold text-slate-800 text-[10px] uppercase tracking-wider mb-1">{t[lang].step10Grid5Title}</div>
                        <p className="text-slate-600 font-semibold">{t[lang].step10Grid5Desc}</p>
                      </div>
                    </div>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/60 flex flex-col justify-between">
                      <div>
                        <div className="font-bold text-slate-800 text-[10px] uppercase tracking-wider mb-1">{t[lang].step10Grid6Title}</div>
                        <p className="text-slate-600">{t[lang].step10Grid6Desc}</p>
                      </div>
                    </div>
                  </div>

                  <Alert type="regle" text={t[lang].step10Alert} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>

        </div>
      </div>

      {/* Bottom progress bar */}
      <div className="sticky bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-slate-200 px-6 py-3 flex items-center gap-3 z-50 shadow-lg">
        <span className="text-slate-500 text-[9px] font-black uppercase">{t[lang].progression}</span>
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
                  {activeLightbox === 'purge' && t[lang].lightboxPurgeTitle}
                  {activeLightbox === 'forage' && t[lang].lightboxForageTitle}
                  {activeLightbox === 'soufflage' && t[lang].lightboxSoufflageTitle}
                </h3>
                
                <div className="w-full max-w-[550px] aspect-[4/3] bg-white rounded-xl p-2 flex items-center justify-center border border-slate-100">
                  {activeLightbox === 'purge' && (
                    <IllustrationPurge className="w-full h-full max-w-none border-none shadow-none bg-transparent" />
                  )}

                  {activeLightbox === 'forage' && (
                    <IllustrationForage className="w-full h-full max-w-none border-none shadow-none bg-transparent" />
                  )}

                  {activeLightbox === 'soufflage' && (
                    <IllustrationSoufflage className="w-full h-full max-w-none border-none shadow-none bg-transparent" />
                  )}
                </div>
                
                <p className="mt-4 text-xs text-slate-500 text-center leading-relaxed font-medium">
                  {activeLightbox === 'purge' && t[lang].lightboxPurgeDesc}
                  {activeLightbox === 'forage' && t[lang].lightboxForageDesc}
                  {activeLightbox === 'soufflage' && t[lang].lightboxSoufflageDesc}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
