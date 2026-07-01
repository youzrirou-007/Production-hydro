import React from 'react';
import { motion } from 'motion/react';
import { Crown, Lock, Hammer, ArrowRight, Info } from 'lucide-react';
import logoImg from '../../assets/images/hydromines_logo_1781337889277.jpg';
import { HOLES_DATA, HOLES_DATA_9 } from './data';

interface HomeCardsProps {
  onSelect: (gabarit: '12m2' | '9m2') => void;
}

export const HomeCards: React.FC<HomeCardsProps> = ({ onSelect }) => {
  // Helper to map hole type to css color classes
  const getHoleColor = (type: string) => {
    switch (type) {
      case 'vide': return 'fill-white stroke-slate-400';
      case 'charge': return 'fill-slate-900 stroke-white';
      case 'g1': return 'fill-blue-500 stroke-blue-600';
      case 'g2': return 'fill-red-500 stroke-red-600';
      case 'g3': return 'fill-cyan-400 stroke-cyan-500';
      case 'g4': return 'fill-orange-500 stroke-orange-600';
      case 'radier': return 'fill-violet-500 stroke-violet-600';
      case 'parement': return 'fill-teal-500 stroke-teal-600';
      case 'voute': return 'fill-rose-500 stroke-rose-600';
      default: return 'fill-slate-400';
    }
  };

  return (
    <div className="bg-white min-h-screen p-6 md:p-8 space-y-8 flex flex-col justify-between">
      {/* HEADER SECTION */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-amber-400/10 rounded-2xl border border-amber-400/20">
            <img src={logoImg} alt="HydroMines Logo" className="w-12 h-12 object-contain" />
          </div>
          <div>
            <span className="text-[10px] font-black uppercase text-amber-600 tracking-widest block">SMI Imiter</span>
            <h1 className="text-xl md:text-2xl font-black uppercase tracking-widest text-slate-900">
              TECHNIQUE MINIÈRE
            </h1>
            <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-0.5">
              Optimisation du forage & tir contrôlé souterrain
            </p>
          </div>
        </div>
        <div>
          <span className="inline-flex items-center gap-2 bg-slate-900 text-[#ffd700] text-[10px] font-black uppercase tracking-wider px-4 py-2 rounded-xl border border-[#ffd700]/30 shadow-[0_4px_12px_rgba(255,215,0,0.1)]">
            <Crown className="w-4 h-4 text-[#ffd700]" />
            Accès réservé — Chefs de poste & Ingénieurs
          </span>
        </div>
      </div>

      {/* TWO MAIN CARDS SIDE BY SIDE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto w-full flex-1 items-center py-4">
        
        {/* CARTE 1 — 12 m² (ACTIVE, CLIQUABLE) */}
        <motion.div
          onClick={() => onSelect('12m2')}
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 15 }}
          whileHover={{ y: -8, scale: 1.02 }}
          className="cursor-pointer bg-white border-2 border-amber-400/60 rounded-3xl overflow-hidden shadow-[0_10px_30px_rgba(218,165,32,0.06)] hover:shadow-[0_20px_40px_rgba(218,165,32,0.15)] transition-shadow duration-300 relative flex flex-col justify-between h-[480px]"
        >
          {/* Gold gradients top and bottom */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500" />
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-400" />

          {/* Active Badge */}
          <span className="absolute top-4 right-4 bg-emerald-500 text-white text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider shadow-sm animate-pulse">
            ACTIF
          </span>

          <div className="p-8 space-y-6 flex-1 flex flex-col justify-between">
            {/* Title & Subtitle */}
            <div>
              <h2 className="text-4xl font-black uppercase tracking-tight text-slate-900">
                12 m²
              </h2>
              <p className="text-xs font-bold uppercase text-amber-600 tracking-widest mt-1">
                Galerie souterraine standard — 4.0m x 3.0m
              </p>
            </div>

            {/* Mini SVG Schematic of 38 holes */}
            <div className="bg-slate-950/95 rounded-2xl p-4 flex items-center justify-center relative border border-slate-800 h-32 overflow-hidden shadow-inner">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]" />
              <svg viewBox="100 50 800 600" className="w-full h-full max-h-24">
                {/* Profile path */}
                <path
                  d="M 100,650 L 100,300 A 400,400 0 0,1 900,300 L 900,650 Z"
                  fill="none"
                  stroke="#334155"
                  strokeWidth="3"
                  strokeDasharray="4,4"
                  opacity="0.4"
                />
                {/* Draw all 38 miniature dots */}
                {HOLES_DATA.map((hole) => (
                  <circle
                    key={hole.id}
                    cx={hole.x}
                    cy={hole.y}
                    r="15"
                    className={`${getHoleColor(hole.type)} stroke-[3px]`}
                  />
                ))}
              </svg>
            </div>

            {/* Specifications list */}
            <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-700">
              <div className="space-y-1">
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Tiges coniques :</span>
                <p className="text-slate-800 font-extrabold uppercase">1,8 m ou 2,4 m</p>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Métrage foré :</span>
                <p className="text-slate-800 font-extrabold uppercase">1,7 m ou 2,3 m</p>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Charges explosifs :</span>
                <p className="text-slate-800 font-extrabold uppercase">ANFO 40kg / Tovex 3.2kg</p>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Plan d'amorçage :</span>
                <p className="text-slate-800 font-extrabold uppercase">32 à 38 Amorces</p>
              </div>
            </div>

            {/* Gold Action Button */}
            <div className="pt-2">
              <div className="w-full py-3 bg-slate-900 hover:bg-black text-white rounded-xl text-center text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-colors border border-amber-400/30 group">
                ACCÉDER AU PLAN DE TIR
                <ArrowRight className="w-4 h-4 text-amber-400 transition-transform group-hover:translate-x-1.5" />
              </div>
            </div>
          </div>
        </motion.div>

        {/* CARTE 2 — 9 m² (ACTIVE, CLIQUABLE) */}
        <motion.div
          onClick={() => onSelect('9m2')}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: 'spring', stiffness: 100, damping: 15 }}
          whileHover={{ y: -8, scale: 1.02 }}
          className="cursor-pointer bg-white border-2 border-amber-400/60 rounded-3xl overflow-hidden shadow-[0_10px_30px_rgba(218,165,32,0.06)] hover:shadow-[0_20px_40px_rgba(218,165,32,0.15)] transition-shadow duration-300 relative flex flex-col justify-between h-[480px]"
        >
          {/* Gold gradients top and bottom */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500" />
          <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-400" />

          {/* Active Badge */}
          <span className="absolute top-4 right-4 bg-amber-500 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider shadow-sm animate-pulse">
            ACTIF
          </span>

          <div className="p-8 space-y-6 flex-1 flex flex-col justify-between">
            {/* Title & Subtitle */}
            <div>
              <h2 className="text-4xl font-black uppercase tracking-tight text-slate-900">
                9 m²
              </h2>
              <p className="text-xs font-bold uppercase text-amber-600 tracking-widest mt-1">
                Galerie de reconnaissance — 3.0m x 3.0m
              </p>
            </div>

            {/* Mini SVG representation of 28 holes */}
            <div className="bg-slate-950/95 rounded-2xl p-4 flex items-center justify-center h-32 relative border border-slate-800 overflow-hidden shadow-inner">
              <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:16px_16px]" />
              <svg viewBox="250 120 500 420" className="w-full h-full max-h-24">
                <path
                  d="M 280,520 L 280,280 A 220,220 0 0,1 720,280 L 720,520 Z"
                  fill="none"
                  stroke="#334155"
                  strokeWidth="3.5"
                  strokeDasharray="4,4"
                  opacity="0.4"
                />
                {/* Symmetrical smaller layout of 28 dots */}
                {HOLES_DATA_9.map((hole) => (
                  <circle
                    key={hole.id}
                    cx={hole.x}
                    cy={hole.y}
                    r="15"
                    className={`${getHoleColor(hole.type)} stroke-[3px]`}
                  />
                ))}
              </svg>
            </div>

            {/* Specifications list */}
            <div className="grid grid-cols-2 gap-4 text-xs font-semibold text-slate-700">
              <div className="space-y-1">
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Tiges coniques :</span>
                <p className="text-slate-800 font-extrabold uppercase">1,8 m ou 2,4 m</p>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Métrage foré :</span>
                <p className="text-slate-800 font-extrabold uppercase">1,7 m ou 2,3 m</p>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Charges explosifs :</span>
                <p className="text-slate-800 font-extrabold uppercase">ANFO 30kg / Tovex 2.4kg</p>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">Plan d'amorçage :</span>
                <p className="text-slate-800 font-extrabold uppercase">27 Amorces (28 trous)</p>
              </div>
            </div>

            {/* Clickable Button */}
            <div className="pt-2">
              <div className="w-full py-3 bg-slate-900 hover:bg-black text-white rounded-xl text-center text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-colors border border-amber-400/30 group">
                ACCÉDER AU PLAN DE TIR
                <ArrowRight className="w-4 h-4 text-amber-400 transition-transform group-hover:translate-x-1.5" />
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* FOOTER / COLOR LEGEND */}
      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 max-w-4xl mx-auto w-full space-y-3">
        <p className="text-[10px] font-black uppercase text-slate-500 text-center tracking-widest">
          Code couleur officiel du plan de tir — SMI Imiter Souterrain
        </p>
        <div className="flex flex-wrap items-center justify-center gap-y-2 gap-x-5 text-[10px] font-bold uppercase text-slate-600">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-white border border-slate-400 inline-block" />
            <span>Vide (Décompression)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-white inline-block" />
            <span>Chargé Bouchon (0ms)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block" />
            <span>Groupe 1 (25ms)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
            <span>Groupe 2 (50ms)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" />
            <span>Groupe 3 (75ms)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block" />
            <span>Groupe 4 (100ms)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-violet-500 inline-block" />
            <span>Radier (100/125ms)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-teal-500 inline-block" />
            <span>Parements (100/125ms)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
            <span>Voûte (125ms)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
