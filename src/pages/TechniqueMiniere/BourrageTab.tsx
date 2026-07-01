import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, Info, HelpCircle, Activity } from 'lucide-react';

interface BourrageTabProps {
  gabarit: '12m2' | '9m2';
}

export const BourrageTab: React.FC<BourrageTabProps> = ({ gabarit }) => {
  const [holeDepth, setHoleDepth] = useState<number>(1.8);
  const [method, setMethod] = useState<'scientific' | 'field'>('scientific');

  // Physical Constants
  const HOLE_DIAMETER_MM = 38; // 38mm button bits
  const ANFO_DENSITY = 0.85; // 0.85 g/cm3

  // Scientific calculation: Lb = 20 * D_trou
  // Lb = 20 * 0.038m = 0.76m
  const tampingLength = method === 'scientific' ? 0.76 : 0.50; // Field default is 50cm
  
  const loadedLength = Math.max(0, holeDepth - tampingLength);

  // Math for ANFO load per hole:
  // Area = pi * r^2 (r = 19mm = 0.019m)
  // Area = 3.14159 * 0.019^2 = 0.001134 m2
  // Volume loaded = Area * loadedLength
  // ANFO mass = Volume * Density * 1000 = Area * loadedLength * 850 kg
  const anfoPerMeter = 3.14159265 * Math.pow(0.019, 2) * 850; // kg/m
  const anfoRequiredKg = loadedLength * anfoPerMeter;

  return (
    <div className="space-y-8 bg-white rounded-3xl p-6 border border-slate-100 shadow-xs">
      
      {/* SECTION HEADER */}
      <div className="border-b border-slate-100 pb-4">
        <span className="text-[10px] font-black uppercase text-amber-600 tracking-widest block">
          Physique du confinement des gaz
        </span>
        <h2 className="text-xl font-black uppercase tracking-widest text-slate-900 mt-1">
          Le Bourrage — Concentrateur d'Énergie Solide
        </h2>
        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-0.5">
          Pourquoi confiner l'explosif augmente de 50% le rendement de l'arrachage du massif rocheux
        </p>
      </div>

      {/* PHYSICS INTRO */}
      <div className="bg-slate-50 rounded-2xl p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200/60 pb-3">
          <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider">
            Thermodynamique de la détonation souterraine
          </h3>
          <span className="bg-slate-900 text-[#ffd700] px-3 py-1 rounded-lg font-mono text-xs font-bold">
            Formule d'étanchéité : Lb = 20 × D_trou
          </span>
        </div>
        <p className="text-xs text-slate-600 leading-relaxed font-semibold">
          Lors de la détonation, l'ANFO solide se transforme instantanément en un volume massif de gaz chauds à ultra-haute pression (plus de 50 000 fois la pression atmosphérique). Sans un bouchon résistant au col du trou, ces gaz s'échappent directement vers l'extérieur à la vitesse du son. C'est le phénomène destructeur du <span className="text-rose-700 font-black uppercase">coup soufflé</span>. L'énergie s'échappe dans l'air, la roche ne se fracture pas, et on laisse de longs culots de forage improductifs.
        </p>
      </div>

      {/* METHOD SELECTOR & INTERACTIVE CALCULATOR */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* INPUTS PANEL (5 Columns) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 space-y-6">
          <h3 className="text-xs font-black uppercase text-slate-900 border-b border-slate-100 pb-3">
            CALCULATEUR DE BOURRAGE INTERACTIF
          </h3>

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
              <span>Standard : 1.80m</span>
              <span>Long : 2.40m</span>
            </div>
          </div>

          {/* Method Selector Toggle */}
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase text-slate-400">Méthode de calcul</span>
            <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setMethod('scientific')}
                className={`py-2 rounded-lg text-xs font-black uppercase transition-all ${
                  method === 'scientific'
                    ? 'bg-slate-950 text-white shadow'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                🔬 Scientifique
              </button>
              <button
                onClick={() => setMethod('field')}
                className={`py-2 rounded-lg text-xs font-black uppercase transition-all ${
                  method === 'field'
                    ? 'bg-slate-950 text-white shadow'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                ⛰️ Terrain
              </button>
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
              <span className="font-black text-rose-700 font-mono">{(tampingLength * 100).toFixed(0)} cm</span>
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

        {/* OUTPUT DIAGRAM PREVIEW (7 Columns) */}
        <div className="lg:col-span-7 bg-slate-950 rounded-2xl border border-slate-850 p-6 flex flex-col justify-between h-[360px] relative overflow-hidden shadow-xl">
          
          <div className="absolute top-4 left-4">
            <span className="text-[10px] font-black uppercase text-amber-500 bg-amber-400/10 px-2 py-0.5 rounded">
              Schéma en Coupe Transversale d'un Trou Foré (Échelle d'ingénierie)
            </span>
          </div>

          {/* HORIZONTAL SVG DRILL HOLE COUPE */}
          <div className="flex-1 flex items-center justify-center pt-6">
            <svg viewBox="0 0 800 240" className="w-full h-auto">
              {/* Rock container bounds */}
              <rect width="800" height="240" fill="#1e293b" opacity="0.4" />
              <path d="M 0 50 L 800 50 M 0 190 L 800 190" stroke="#475569" strokeWidth="2" strokeDasharray="4,4" />

              {/* The Hole Channel */}
              {/* Width represents total depth of the hole */}
              <rect x="50" y="80" width="700" height="80" fill="#020617" stroke="#64748b" strokeWidth="2.5" />

              {/* Bottom end cap of the hole */}
              <line x1="50" y1="80" x2="50" y2="160" stroke="#64748b" strokeWidth="3" />

              {/* 1. Tovex Primer cartridge at the very bottom (Left-most) */}
              <g>
                <rect x="65" y="90" width="100" height="60" fill="#ef4444" rx="4" stroke="#ffffff" strokeWidth="1" />
                <text x="115" y="125" textAnchor="middle" className="fill-white font-black text-[10px] uppercase">TOVEX</text>
                <text x="115" y="138" textAnchor="middle" className="fill-white font-bold text-[8px] uppercase">AMORCEUR</text>
                
                {/* Yellow wire representing the detonator line */}
                <path d="M 120 120 C 130 110 300 95 780 120" fill="none" stroke="#eab308" strokeWidth="2.5" />
                {/* Small spark star at det */}
                <circle cx="120" cy="120" r="4" fill="#fbbf24" className="animate-ping" />
              </g>

              {/* 2. ANFO Column (Bulk grains, gray dotted pattern) */}
              {/* Spans from Tovex to the collar minus tamping */}
              {/* Math: Tovex takes 65-165, total channel is 50 to 750 (700px).
                  Let's make ANFO column take from 165 to 550.
                  Tamping takes from 550 to 750 (200px width). */}
              <g>
                <rect x="165" y="82" width="385" height="76" fill="#475569" opacity="0.3" />
                {/* Grainy dots represent ANFO granules */}
                {Array.from({ length: 45 }).map((_, i) => (
                  <circle
                    key={i}
                    cx={175 + (i * 8.2) + Math.sin(i) * 3}
                    cy={92 + (i % 5) * 14 + Math.cos(i) * 2}
                    r="2.5"
                    fill="#cbd5e1"
                    opacity="0.85"
                  />
                ))}
                <text x="357" y="125" textAnchor="middle" className="fill-amber-400 font-black text-[11px] uppercase tracking-widest">
                  COLONNE D'ANFO ({(loadedLength * 100).toFixed(0)} CM)
                </text>
              </g>

              {/* 3. Tamping plug (Bourrage, yellow clay or crushed dust) */}
              <g>
                <rect x="550" y="82" width="200" height="76" fill="#b45309" opacity="0.8" />
                <text x="650" y="125" textAnchor="middle" className="fill-white font-black text-[11px] uppercase tracking-widest">
                  BOURRAGE ({(tampingLength * 100).toFixed(0)} CM)
                </text>
                <text x="650" y="140" textAnchor="middle" className="fill-yellow-200 font-bold text-[8.5px] uppercase">
                  ARGILE SERRÉE
                </text>
              </g>

              {/* Annotations */}
              <text x="50" y="70" className="fill-slate-400 font-bold text-[10px] uppercase">Fond de trou</text>
              <text x="750" y="70" textAnchor="end" className="fill-slate-400 font-bold text-[10px] uppercase">Col du trou (Entrée)</text>

            </svg>
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 text-[10.5px] text-slate-300 font-semibold uppercase leading-relaxed text-center">
            Structure interne du trou de forage : L'argile assure l'étanchéité absolue au col, forçant les gaz de l'ANFO à pousser radialement à l'intérieur de la roche.
          </div>
        </div>

      </div>

      {/* ALERT BOX */}
      <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-5 space-y-2.5">
        <h4 className="text-xs font-black uppercase text-red-800 flex items-center gap-1.5">
          <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
          Rendement & Phénomène de perte d'énergie "Coup de Feu"
        </h4>
        <div className="text-xs text-red-700 font-bold space-y-1.5 leading-relaxed">
          <p>
            • Un bourrage trop court (inférieur à 50 cm) cède instantanément sous la pression des gaz. L'énergie mécanique est éjectée comme un canon par le col.
          </p>
          <p>
            • Les mineurs entendent un bruit sur-aigu à l'allumage : c'est la perte complète de décompression de la volée.
          </p>
          <p className="font-extrabold uppercase text-red-900 bg-red-100 p-2 rounded-lg border border-red-200 inline-block mt-1">
            ⚠️ IMPACT FINANCIER SMR : Rendement d'arrachage de l'avancement divisé par deux = perte sèche d'environ 15 000 MAD par volée ratée.
          </p>
        </div>
      </div>
    </div>
  );
};
