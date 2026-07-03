import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, Info, HelpCircle, Activity, CheckCircle2, AlertTriangle, TrendingDown, ArrowRight, Zap } from 'lucide-react';

interface BourrageTabProps {
  gabarit: '12m2' | '9m2';
}

export const BourrageTab: React.FC<BourrageTabProps> = ({ gabarit }) => {
  const [holeDepth, setHoleDepth] = useState<number>(1.8); // 1.0m to 3.0m
  const [tampingLengthCm, setTampingLengthCm] = useState<number>(76); // 0cm to 150cm
  const [viewMode, setViewMode] = useState<'both' | 'conforme' | 'souffle'>('both');

  // Physical Constants
  const HOLE_DIAMETER_MM = 38; // 38mm button bits
  const ANFO_DENSITY = 0.85; // 0.85 g/cm3
  const OPTIMAL_TAMPING_M = 0.76; // Lb = 20 * D = 20 * 0.038 = 0.76m (76cm)

  const tampingLengthM = tampingLengthCm / 100;
  const loadedLength = Math.max(0, holeDepth - tampingLengthM);

  // ANFO math
  // Area = pi * r^2 (r = 19mm = 0.019m)
  const anfoPerMeter = 3.14159265 * Math.pow(0.019, 2) * 850; // kg/m
  const anfoRequiredKg = loadedLength * anfoPerMeter;

  // Verdict calculation
  const isConforme = tampingLengthCm >= 76;
  
  // Loss in footage scaling based on tamping quality
  // If tamping is >= 76cm, loss is 0.
  // If tamping is less, loss scales linearly up to 0.8m when tamping is 0.
  const estimatedLossM = isConforme ? 0 : Math.max(0, (76 - tampingLengthCm) * 0.03);

  const finalAdvanceM = Math.max(0, holeDepth - estimatedLossM);
  const efficiencyPercent = holeDepth > 0 ? (finalAdvanceM / holeDepth) * 100 : 0;

  return (
    <div className="space-y-8 bg-white rounded-3xl p-6 border border-slate-100 shadow-xs">
      
      {/* Dynamic Keyframe Animation Styles */}
      <style>{`
        @keyframes gasStream {
          0% { transform: translateX(0) scaleY(1); opacity: 0.9; }
          50% { transform: translateX(15px) scaleY(1.2); opacity: 0.6; }
          100% { transform: translateX(35px) scaleY(1); opacity: 0; }
        }
        @keyframes shockwave {
          0% { transform: scale(0.9); opacity: 0.5; }
          50% { transform: scale(1.15); opacity: 0.8; }
          100% { transform: scale(1.3); opacity: 0; }
        }
        @keyframes pressureWave {
          0% { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: -20; }
        }
        .gas-particle {
          animation: gasStream 1.5s infinite ease-out;
        }
        .shockwave-ring {
          animation: shockwave 2s infinite ease-out;
          transform-origin: center;
        }
        .pressure-line {
          stroke-dasharray: 6,4;
          animation: pressureWave 1s infinite linear;
        }
      `}</style>

      {/* SECTION HEADER */}
      <div className="border-b border-slate-100 pb-5">
        <span className="text-[10px] font-black uppercase text-amber-600 tracking-widest block">
          Physique du confinement des gaz d'allumage
        </span>
        <h2 className="text-xl font-black uppercase tracking-widest text-slate-900 mt-1">
          Le Bourrage — Concentrateur d'Énergie Souterraine
        </h2>
        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-0.5">
          Pourquoi confiner l'explosif augmente de 50% le rendement de l'arrachage du massif d'argent
        </p>
      </div>

      {/* PHYSICS INTRO */}
      <div className="bg-slate-50 rounded-2xl p-5 space-y-3.5 border border-slate-100">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/60 pb-3">
          <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider flex items-center gap-1.5">
            <Zap className="w-4 h-4 text-amber-500" />
            Thermodynamique de la détonation souterraine (Imiter)
          </h3>
          <span className="bg-slate-900 text-[#ffd700] px-3 py-1 rounded-lg font-mono text-xs font-bold border border-slate-800">
            Formule d'étanchéité : Lb = 20 × D_trou (38mm) = 76 cm
          </span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed font-semibold">
          Lors de la détonation, l'ANFO solide se transforme instantanément en un volume colossal de gaz chauds à ultra-haute pression (plus de 50 000 fois la pression atmosphérique). Sans un bouchon d'argile compact au col du trou, ces gaz s'échappent directement vers l'extérieur à la vitesse du son. C'est le phénomène catastrophique du <span className="text-rose-700 font-black uppercase">coup soufflé</span>. L'énergie s'échappe dans la galerie, la roche ne se fracture pas, et on laisse de longs culots de forage improductifs.
        </p>
      </div>

      {/* COMPARATIVE PHOTO / DIAGRAM GALLERY SECTION */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-[#b8860b]" />
            <h3 className="text-xs font-black uppercase text-slate-900 tracking-wider">
              Galerie Comparative — Comportement Physique des Gaz
            </h3>
          </div>
          
          {/* Toggle buttons for view modes */}
          <div className="flex bg-slate-100 p-1 rounded-lg border border-slate-200 self-start sm:self-auto">
            <button
              onClick={() => setViewMode('both')}
              className={`px-3 py-1 rounded text-[10px] font-black uppercase tracking-wider transition-all ${
                viewMode === 'both' ? 'bg-white text-[#b8860b] shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Vue Côte à Côte
            </button>
            <button
              onClick={() => setViewMode('conforme')}
              className={`px-3 py-1 rounded text-[10px] font-black uppercase tracking-wider transition-all ${
                viewMode === 'conforme' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Correct (Optimum)
            </button>
            <button
              onClick={() => setViewMode('souffle')}
              className={`px-3 py-1 rounded text-[10px] font-black uppercase tracking-wider transition-all ${
                viewMode === 'souffle' ? 'bg-rose-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Coup Soufflé (Perte)
            </button>
          </div>
        </div>

        {/* Dynamic Interactive SVG Comparison Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Card 1: BOURRAGE CONFORME */}
          {(viewMode === 'both' || viewMode === 'conforme') && (
            <div className="bg-slate-950 border border-emerald-800/40 rounded-2xl p-5 shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[300px]">
              <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
                <span className="text-[9px] font-black uppercase text-emerald-400 bg-emerald-950/80 border border-emerald-500/30 px-2.5 py-1 rounded-lg flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                  BOURRAGE CORRECT (≥ 76cm)
                </span>
              </div>

              {/* Conforme SVG */}
              <div className="flex-1 flex items-center justify-center my-4 pt-6">
                <svg viewBox="0 0 500 180" className="w-full h-auto">
                  {/* Rock layer background */}
                  <rect width="500" height="180" fill="#111827" rx="8" />
                  
                  {/* Fracture lines radiating outwards in rock (Pressure action) */}
                  <path d="M 120 40 L 160 10 M 180 30 L 220 5 M 260 40 L 300 20 M 150 140 L 190 170 M 240 145 L 290 175 M 320 130 L 370 160" stroke="#10b981" strokeWidth="2.5" opacity="0.6" strokeDasharray="5,3" />
                  <path d="M 80 45 L 60 10 M 100 135 L 70 170 M 340 50 L 390 15" stroke="#10b981" strokeWidth="2.5" opacity="0.6" strokeDasharray="5,3" />

                  {/* Hole outline */}
                  <rect x="30" y="60" width="440" height="60" fill="#030712" stroke="#4b5563" strokeWidth="2" />
                  
                  {/* Bottom cap */}
                  <line x1="30" y1="60" x2="30" y2="120" stroke="#4b5563" strokeWidth="3.5" />

                  {/* 1. Tovex Primer at base */}
                  <rect x="40" y="66" width="60" height="48" fill="#F97316" rx="3" stroke="#ffffff" strokeWidth="0.5" />
                  <text x="70" y="92" textAnchor="middle" className="fill-white font-black text-[9px] uppercase tracking-wider">TOVEX</text>
                  <text x="70" y="103" textAnchor="middle" className="fill-white font-bold text-[7px] uppercase opacity-90">135g</text>

                  {/* Detonator Wire */}
                  <path d="M 70 90 Q 200 70 470 90" fill="none" stroke="#ffd700" strokeWidth="2" className="pressure-line" />

                  {/* 2. Bulk ANFO Column */}
                  <rect x="100" y="62" width="220" height="56" fill="#FBBF24" opacity="0.85" />
                  {/* Draw granules inside */}
                  {Array.from({ length: 18 }).map((_, i) => (
                    <circle key={i} cx={110 + (i * 12) + Math.sin(i)*2} cy={72 + (i % 3) * 16} r="2" fill="#fff" opacity="0.8" />
                  ))}
                  <text x="210" y="95" textAnchor="middle" className="fill-slate-950 font-black text-[9.5px] uppercase tracking-widest">ANFO CONFINÉ</text>

                  {/* 3. Tamping Plug (Bourrage correct) */}
                  <rect x="320" y="62" width="150" height="56" fill="#8B4513" opacity="0.9" />
                  <text x="395" y="90" textAnchor="middle" className="fill-white font-black text-[9px] uppercase tracking-widest">BOURRAGE</text>
                  <text x="395" y="102" textAnchor="middle" className="fill-amber-200 font-bold text-[7.5px] uppercase">76cm Argile</text>

                  {/* Pressure Wave Indicators pointing into rock walls */}
                  <g className="shockwave-ring">
                    <path d="M 120 55 L 120 30 M 180 55 L 180 30 M 240 55 L 240 30 M 300 55 L 300 30" stroke="#10b981" strokeWidth="2" />
                    <path d="M 120 125 L 120 150 M 180 125 L 180 150 M 240 125 L 240 150 M 300 125 L 300 150" stroke="#10b981" strokeWidth="2" />
                  </g>
                </svg>
              </div>

              <div className="bg-emerald-950/30 border border-emerald-900/40 rounded-xl p-3 text-[10px] text-emerald-300 font-bold uppercase leading-relaxed text-center">
                ✅ Énergie transférée à 100% au massif : Les gaz d'explosifs sont verrouillés hermétiquement par le bouchon d'argile compacté, forçant la fracturation radiale complète.
              </div>
            </div>
          )}

          {/* Card 2: COUP SOUFFLÉ (BOURRAGE INSUFFISANT) */}
          {(viewMode === 'both' || viewMode === 'souffle') && (
            <div className="bg-slate-950 border border-rose-800/40 rounded-2xl p-5 shadow-lg relative overflow-hidden flex flex-col justify-between min-h-[300px]">
              <div className="absolute top-4 left-4 flex items-center gap-2 z-10">
                <span className="text-[9px] font-black uppercase text-rose-400 bg-rose-950/80 border border-rose-500/30 px-2.5 py-1 rounded-lg flex items-center gap-1 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
                  RISQUE CRITIQUE — COUP SOUFFLÉ
                </span>
              </div>

              {/* Non-Conforme SVG */}
              <div className="flex-1 flex items-center justify-center my-4 pt-6">
                <svg viewBox="0 0 500 180" className="w-full h-auto">
                  {/* Rock layer background */}
                  <rect width="500" height="180" fill="#111827" rx="8" />
                  
                  {/* No fracture lines - poor energy transfer */}
                  <text x="210" y="35" textAnchor="middle" className="fill-rose-500/40 font-black text-[9px] uppercase tracking-widest animate-pulse">ÉNERGIE RADIALE PERDUE</text>

                  {/* Hole outline */}
                  <rect x="30" y="60" width="440" height="60" fill="#030712" stroke="#4b5563" strokeWidth="2" />
                  
                  {/* Bottom cap */}
                  <line x1="30" y1="60" x2="30" y2="120" stroke="#4b5563" strokeWidth="3.5" />

                  {/* 1. Tovex Primer at base */}
                  <rect x="40" y="66" width="60" height="48" fill="#F97316" rx="3" stroke="#ffffff" strokeWidth="0.5" />
                  <text x="70" y="92" textAnchor="middle" className="fill-white font-black text-[9px] uppercase tracking-wider">TOVEX</text>
                  <text x="70" y="103" textAnchor="middle" className="fill-white font-bold text-[7px] uppercase opacity-90">135g</text>

                  {/* Detonator Wire */}
                  <path d="M 70 90 Q 200 70 470 90" fill="none" stroke="#f43f5e" strokeWidth="2" />

                  {/* 2. Bulk ANFO Column (Very large due to thin tamping) */}
                  <rect x="100" y="62" width="290" height="56" fill="#FBBF24" opacity="0.4" />
                  <text x="245" y="95" textAnchor="middle" className="fill-rose-400 font-black text-[9.5px] uppercase tracking-widest animate-pulse">SURCHARGE ANFO / PERTE D'ÉTANCHÉITÉ</text>

                  {/* 3. Tamping Plug (Bourrage insuffisant - only 30cm) */}
                  <rect x="390" y="62" width="50" height="56" fill="#8B4513" opacity="0.5" />
                  <line x1="390" y1="62" x2="390" y2="118" stroke="#f43f5e" strokeWidth="2" strokeDasharray="3,3" />

                  {/* Gas ejection jet stream coming out of collar */}
                  <g className="gas-particle">
                    <path d="M 440 65 L 490 50 L 495 130 L 440 115 Z" fill="url(#gasGradient)" opacity="0.8" />
                    <line x1="440" y1="90" x2="495" y2="90" stroke="#FBBF24" strokeWidth="3" strokeDasharray="5,5" />
                  </g>
                </svg>

                {/* Gradients declaration */}
                <svg className="h-0 w-0 absolute">
                  <defs>
                    <linearGradient id="gasGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#ffd700" stopOpacity="0.9" />
                      <stop offset="50%" stopColor="#f97316" stopOpacity="0.6" />
                      <stop offset="100%" stopColor="#ef4444" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>
              </div>

              <div className="bg-rose-950/30 border border-rose-900/40 rounded-xl p-3 text-[10px] text-rose-300 font-bold uppercase leading-relaxed text-center">
                🚨 Effet Canon (Coup Soufflé) : Le bouchon de bourrage est trop mince pour résister. Il est éjecté instantanément au départ du coup, soufflant les gaz brûlants dans la galerie.
              </div>
            </div>
          )}

        </div>
      </div>

      {/* METHOD SELECTOR & INTERACTIVE CALCULATOR */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* INPUTS PANEL (5 Columns) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 space-y-6">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Activity className="w-5 h-5 text-amber-500" />
            <h3 className="text-xs font-black uppercase text-slate-900">
              SIMULATEUR DE TIR & BOURRAGE INTERACTIF
            </h3>
          </div>

          {/* Depth Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-700 uppercase">Profondeur du trou (foré) :</span>
              <span className="font-mono font-black text-slate-900 bg-slate-100 px-2 py-0.5 rounded">
                {holeDepth.toFixed(2)} m
              </span>
            </div>
            <input
              type="range"
              min="1.0"
              max="3.0"
              step="0.1"
              value={holeDepth}
              onChange={(e) => setHoleDepth(parseFloat(e.target.value))}
              className="w-full accent-amber-500 bg-slate-200 h-2 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase">
              <span>Court : 1.20m</span>
              <span>SMI Standard : 1.80m</span>
              <span>SMI Long : 2.40m</span>
            </div>
          </div>

          {/* Measured Tamping Slider */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-700 uppercase">Bourrage mesuré (Collar Plug) :</span>
              <span className={`font-mono font-black px-2 py-0.5 rounded ${
                isConforme ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}>
                {tampingLengthCm} cm
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="150"
              step="5"
              value={tampingLengthCm}
              onChange={(e) => setTampingLengthCm(parseInt(e.target.value))}
              className={`w-full h-2 rounded-lg cursor-pointer accent-[#8B4513] bg-slate-200`}
            />
            <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase">
              <span>0 cm (Aucun)</span>
              <span className="text-rose-600 font-extrabold">🚨 Alerte : &lt;76cm</span>
              <span className="text-emerald-600 font-extrabold">✅ Conforme: &ge;76cm</span>
              <span>150 cm</span>
            </div>
          </div>

          {/* DYNAMIC RESULTS BOARD */}
          <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 space-y-4 text-xs">
            <div className="flex justify-between items-center py-1.5 border-b border-slate-200/50">
              <span className="text-slate-500 font-bold uppercase text-[9px]">Diamètre taillant</span>
              <span className="font-extrabold text-slate-800 font-mono">{HOLE_DIAMETER_MM} mm</span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-200/50">
              <span className="text-slate-500 font-bold uppercase text-[9px]">Longueur de bourre</span>
              <span className={`font-mono font-black ${isConforme ? 'text-emerald-600' : 'text-rose-600 animate-pulse'}`}>
                {tampingLengthCm} cm {isConforme ? '(Conforme)' : '(Insuffisant)'}
              </span>
            </div>
            <div className="flex justify-between items-center py-1.5 border-b border-slate-200/50">
              <span className="text-slate-500 font-bold uppercase text-[9px]">Colonne chargée d'ANFO</span>
              <span className="font-extrabold text-slate-800 font-mono">{loadedLength.toFixed(2)} m</span>
            </div>
            <div className="flex justify-between items-center py-1.5">
              <span className="text-slate-500 font-bold uppercase text-[9px]">Charge requise par trou</span>
              <span className="font-black text-amber-600 font-mono">{anfoRequiredKg.toFixed(2)} kg / trou</span>
            </div>
          </div>
        </div>

        {/* OUTPUT DIAGRAM PREVIEW & PHYSICAL GRAPH (7 Columns) */}
        <div className="lg:col-span-7 bg-slate-950 rounded-2xl border border-slate-850 p-6 flex flex-col justify-between h-full min-h-[380px] relative overflow-hidden shadow-xl">
          
          <div className="absolute top-4 left-4 z-10">
            <span className="text-[9px] font-black uppercase text-amber-500 bg-amber-400/10 px-2 py-1 rounded">
              Graphe de Performance & Rendement Opérationnel du Tir
            </span>
          </div>

          {/* Live Verdict & Losses Dashboard */}
          <div className="grid grid-cols-2 gap-4 mt-6 z-10">
            {/* Box 1: Safety Verdict */}
            <div className={`p-4 rounded-xl border ${
              isConforme 
                ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200' 
                : 'bg-rose-950/40 border-rose-800/60 text-rose-200'
            }`}>
              <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider mb-1 opacity-80">
                {isConforme ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />}
                Statut d'étanchéité
              </div>
              <div className="text-[11px] font-black uppercase tracking-wide">
                {isConforme ? '✅ CONFINEMENT OPTIMAL' : '🚨 CONFINEMENT INSUFFISANT'}
              </div>
              <div className="text-[9px] font-semibold mt-1 opacity-75">
                {isConforme 
                  ? 'Pression de détonation hermétiquement emprisonnée.' 
                  : 'Risque de projection violente de roches et coup soufflé !'}
              </div>
            </div>

            {/* Box 2: Loss & Advance metrics */}
            <div className={`p-4 rounded-xl border ${
              isConforme 
                ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200' 
                : 'bg-amber-950/40 border-amber-800/60 text-amber-200'
            }`}>
              <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider mb-1 opacity-80">
                <TrendingDown className="w-3.5 h-3.5" />
                Perte d'avancement estimée
              </div>
              <div className="text-base font-black font-mono">
                {estimatedLossM > 0 ? `-${estimatedLossM.toFixed(2)} m` : '0.00 m'}
              </div>
              <div className="text-[9.5px] font-semibold mt-1 opacity-75 uppercase">
                {isConforme 
                  ? 'Rendement de tir : 100%' 
                  : `Efficacité de volée : ${efficiencyPercent.toFixed(0)}%`}
              </div>
            </div>
          </div>

          {/* Central Compare Block */}
          <div className="my-6 bg-slate-900/60 border border-slate-800/80 p-4 rounded-xl">
            <div className="flex items-center justify-between text-[10px] font-black uppercase text-slate-300 mb-2">
              <span>Profondeur Forée</span>
              <span>Avancement Réel Estimé</span>
            </div>
            <div className="space-y-3">
              {/* Target Depth Line */}
              <div>
                <div className="flex justify-between text-[8.5px] text-slate-400 font-mono mb-1">
                  <span>Théorique : {holeDepth.toFixed(2)}m</span>
                  <span>100%</span>
                </div>
                <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                  <div className="bg-[#b8860b] h-full" style={{ width: '100%' }} />
                </div>
              </div>

              {/* Estimated Realized Advance Line */}
              <div>
                <div className="flex justify-between text-[8.5px] text-slate-400 font-mono mb-1">
                  <span>Réel Récupéré : {finalAdvanceM.toFixed(2)}m</span>
                  <span className={isConforme ? 'text-emerald-400 font-extrabold' : 'text-amber-500 font-extrabold'}>
                    {efficiencyPercent.toFixed(0)}%
                  </span>
                </div>
                <div className="w-full bg-slate-950 h-2.5 rounded-full overflow-hidden border border-slate-800">
                  <div className={`h-full ${isConforme ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${efficiencyPercent}%` }} />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-[10.5px] text-slate-300 font-semibold uppercase leading-relaxed text-center">
            {isConforme 
              ? `Le bourrage est conforme aux spécifications SMI. Vos tirs d'avancement produiront le maximum d'énergie utile et un fracturage optimal.`
              : `Alerte : Bourrage insuffisant ! ${estimatedLossM.toFixed(1)}m de trou seront perdus, créant des culots résiduels inutilisables.`}
          </div>
        </div>

      </div>

      {/* OPERATIONAL IMPACT SECTION */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-6 space-y-4">
        <h3 className="text-xs font-black uppercase text-slate-900 flex items-center gap-1.5 border-b border-slate-200 pb-3">
          <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
          Impact Opérationnel de l'insuffisance de Bourrage à SMI Imiter
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          <div className="p-4 bg-white border border-slate-150 rounded-xl">
            <span className="text-[17px] block mb-2">🪨</span>
            <h4 className="text-[11px] font-black uppercase text-slate-800 tracking-wide mb-1">
              Fragmentation Grossière
            </h4>
            <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
              La perte de pression engendre des blocs massifs (hors gabarit). Cela bloque les trémies du bure et endommage le concasseur principal d'Imiter 1 & 2.
            </p>
          </div>

          <div className="p-4 bg-white border border-slate-150 rounded-xl">
            <span className="text-[17px] block mb-2">🚜</span>
            <h4 className="text-[11px] font-black uppercase text-slate-800 tracking-wide mb-1">
              Dégâts Matériels
            </h4>
            <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
              La projection violente de pierres (effet canon) endommage directement les flexibles hydrauliques des jumbos de forage et les cabines des chargeuses LHD.
            </p>
          </div>

          <div className="p-4 bg-white border border-slate-150 rounded-xl">
            <span className="text-[17px] block mb-2">💨</span>
            <h4 className="text-[11px] font-black uppercase text-slate-800 tracking-wide mb-1">
              Gaz Toxiques Abondants
            </h4>
            <p className="text-[10px] text-slate-500 font-semibold leading-relaxed">
              Une mauvaise combustion produit des vapeurs nitreuses denses (fumées rousses hautement toxiques), prolongeant le temps de purge et d'arrêt de la galerie.
            </p>
          </div>

          <div className="p-4 bg-white border border-slate-150 rounded-xl">
            <span className="text-[17px] block mb-2">📉</span>
            <h4 className="text-[11px] font-black uppercase text-slate-800 tracking-wide mb-1">
              Perte Financière Majeure
            </h4>
            <p className="text-[10px] text-slate-500 font-semibold leading-relaxed font-mono">
              Un avancement divisé par deux représente une perte sèche de dynamite déjà injectée, de métrage d'argent SMI non valorisé, estimée à 15 000 MAD / tir raté. Chaque centimètre de bourrage manquant sous les 76cm = perte de 0.03m de métrage.
            </p>
          </div>

        </div>
      </div>

    </div>
  );
};
