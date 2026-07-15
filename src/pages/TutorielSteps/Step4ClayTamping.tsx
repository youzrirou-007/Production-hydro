import React from 'react';
import { motion } from 'motion/react';
import { Sliders, CheckCircle2, AlertTriangle, ShieldAlert, Sparkles, HelpCircle } from 'lucide-react';

interface Step4Props {
  draggedSlots: { fond: string; colonne: string; bourrage: string };
  setDraggedSlots: React.Dispatch<React.SetStateAction<{ fond: string; colonne: string; bourrage: string }>>;
  step4OrderError: boolean;
  step4OrderSuccess: boolean;
  step4SliderVal: number;
  setStep4SliderVal: (val: number) => void;
  step4Formula: string;
  setStep4Formula: (val: string) => void;
  assignSlot: (slot: 'fond' | 'colonne' | 'bourrage', value: string) => void;
  handleStep4VerifyOrder: () => void;
}

export const Step4ClayTamping: React.FC<Step4Props> = ({
  draggedSlots,
  setDraggedSlots,
  step4OrderError,
  step4OrderSuccess,
  step4SliderVal,
  setStep4SliderVal,
  step4Formula,
  setStep4Formula,
  assignSlot,
  handleStep4VerifyOrder
}) => {

  // Dynamic SVG Width for Clay based on slider (40cm to 100cm, map to SVG pixels)
  // Total hole is 1.8m (let's map 180cm to 600px width inside SVG)
  // Scale: 1cm = 3.33px. Total = 600px
  // Slider ranges from 40 to 100cm.
  const clayWidthPx = step4SliderVal * 3.33;
  const fondWidthPx = 30 * 3.33; // 30cm = ~100px
  const colonneWidthPx = (180 - 30 - step4SliderVal) * 3.33; // Remaining column

  return (
    <div className="space-y-8" id="step4-workspace">
      <div>
        <p className="text-sm text-slate-600 leading-relaxed font-medium">
          Le bourrage consiste à insérer l'explosif de fond (Tovex), l'explosif principal en colonne (ANFO), puis à refermer de façon étanche avec de l'argile compressée. 
          <strong> Un bourrage insuffisant provoque un "coup soufflé"</strong> : l'énergie de l'explosion s'échappe vers l'extérieur sans casser la roche de fond.
        </p>
      </div>

      {/* Interactive D&D / Click Ordering */}
      <div className="bg-slate-50 border border-slate-200/80 rounded-3xl p-6 space-y-5 shadow-2xs">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
          <Sliders className="w-5 h-5 text-[#b8860b]" />
          <h4 className="text-xs font-black uppercase tracking-widest text-[#b8860b]">
            Exercice : Séquence de Chargement d'un Trou de Mine
          </h4>
        </div>
        <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider leading-relaxed">
          Pour charger un trou de forage (du fond vers le col de sortie), attribuez les bons éléments aux 3 compartiments réglementaires :
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-1">
          {/* Fond */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 text-center space-y-3 shadow-2xs">
            <span className="text-[9px] font-black uppercase tracking-widest bg-slate-900 text-white px-2.5 py-1 rounded-md">
              1. Fond de trou (Amorçage)
            </span>
            <select 
              value={draggedSlots.fond}
              onChange={(e) => assignSlot('fond', e.target.value)}
              className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-250 rounded-xl p-3 text-xs font-black uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-[#b8860b]/20 transition-all cursor-pointer"
            >
              <option value="">-- Choisir --</option>
              <option value="ANFO">ANFO (Nitrate)</option>
              <option value="Tovex">Dynamite Tovex</option>
              <option value="Bourrage d'argile">Bourrage d'argile</option>
              <option value="Poche d'air">Poche d'air</option>
            </select>
            <p className="text-[9px] text-slate-400 font-bold uppercase">Assure l'amorçage initial</p>
          </div>

          {/* Colonne */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 text-center space-y-3 shadow-2xs">
            <span className="text-[9px] font-black uppercase tracking-widest bg-slate-900 text-white px-2.5 py-1 rounded-md">
              2. Colonne de trou (Force)
            </span>
            <select 
              value={draggedSlots.colonne}
              onChange={(e) => assignSlot('colonne', e.target.value)}
              className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-250 rounded-xl p-3 text-xs font-black uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-[#b8860b]/20 transition-all cursor-pointer"
            >
              <option value="">-- Choisir --</option>
              <option value="ANFO">ANFO (Nitrate)</option>
              <option value="Tovex">Dynamite Tovex</option>
              <option value="Bourrage d'argile">Bourrage d'argile</option>
              <option value="Poche d'air">Poche d'air</option>
            </select>
            <p className="text-[9px] text-slate-400 font-bold uppercase">Fournit le volume d'abattage</p>
          </div>

          {/* Bourrage */}
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 text-center space-y-3 shadow-2xs">
            <span className="text-[9px] font-black uppercase tracking-widest bg-slate-900 text-white px-2.5 py-1 rounded-md">
              3. Col de trou (Confinement)
            </span>
            <select 
              value={draggedSlots.bourrage}
              onChange={(e) => assignSlot('bourrage', e.target.value)}
              className="w-full bg-slate-50 hover:bg-slate-100 border border-slate-250 rounded-xl p-3 text-xs font-black uppercase tracking-wider focus:outline-none focus:ring-2 focus:ring-[#b8860b]/20 transition-all cursor-pointer"
            >
              <option value="">-- Choisir --</option>
              <option value="ANFO">ANFO (Nitrate)</option>
              <option value="Tovex">Dynamite Tovex</option>
              <option value="Bourrage d'argile">Bourrage d'argile</option>
              <option value="Poche d'air">Poche d'air</option>
            </select>
            <p className="text-[9px] text-slate-400 font-bold uppercase">Retient la pression des gaz</p>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={handleStep4VerifyOrder}
            className="px-5 py-3 bg-slate-900 text-white text-xs font-black uppercase tracking-wider rounded-xl hover:bg-slate-850 cursor-pointer shadow-sm active:scale-98 transition-all"
          >
            Vérifier le chargement du trou
          </button>
        </div>

        {step4OrderError && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl text-[11px] font-bold uppercase tracking-wide flex items-start gap-2"
          >
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-black uppercase">Séquence non conforme !</p>
              <p className="text-[10px] text-rose-600 font-bold mt-0.5 uppercase tracking-wide">
                La dynamite Tovex (plus dense) se place impérativement au fond pour amorcer. Le nitrate ANFO remplit la colonne active, et l'argile ferme le trou hermétiquement. Ajustez !
              </p>
            </div>
          </motion.div>
        )}
        {step4OrderSuccess && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-2xl text-[11px] font-bold uppercase tracking-wide flex items-start gap-2"
          >
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <p className="font-black uppercase">Séquence conforme !</p>
              <p className="text-[10px] text-emerald-600 font-bold mt-0.5">Le trou est correctement configuré de l'amorce jusqu'au confinement.</p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Interactive Bourrage Slider Calculator with Gorgeous 2D Vector Cross-section */}
      <div className="bg-slate-950 text-white rounded-3xl p-6 space-y-6 shadow-xl border border-slate-800">
        <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
          <Sparkles className="w-5 h-5 text-amber-500" />
          <h4 className="text-xs font-black uppercase tracking-widest text-[#b8860b]">
            Simulateur 2D Interactif de Trou de Mine (Forage : 1.8m)
          </h4>
        </div>
        <p className="text-[11px] text-slate-300 font-bold uppercase tracking-wider">
          Ajustez la longueur de bourrage d'argile et observez l'impact direct sur la détonation :
        </p>

        {/* Dynamic SVG Drawing of Borehole Cross-section */}
        <div className="bg-slate-900 border border-slate-850 rounded-2xl p-4 overflow-x-auto relative">
          <span className="absolute top-2 left-4 text-[8px] font-mono font-bold text-slate-500 uppercase tracking-widest">
            Schéma technique 2D (Vue en coupe latérale)
          </span>

          <svg viewBox="0 0 700 160" className="w-full h-[120px] min-w-[500px]">
            <defs>
              {/* Pattern for rock background */}
              <pattern id="rock-pattern" width="30" height="30" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
                <line x1="0" y1="0" x2="30" y2="0" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                <path d="M 5 5 L 15 15 M 20 5 L 25 20" stroke="rgba(255,255,255,0.04)" strokeWidth="0.8" />
              </pattern>
              
              {/* Pattern for ANFO prills */}
              <pattern id="anfo-pattern" width="10" height="10" patternUnits="userSpaceOnUse">
                <circle cx="3" cy="3" r="1.5" fill="#3b82f6" opacity="0.8" />
                <circle cx="7" cy="7" r="2" fill="#ef4444" opacity="0.8" />
                <circle cx="8" cy="2" r="1.2" fill="#ffffff" opacity="0.9" />
              </pattern>

              {/* Pattern for Clay */}
              <pattern id="clay-pattern" width="20" height="20" patternUnits="userSpaceOnUse">
                <rect width="20" height="20" fill="#a16207" opacity="0.85" />
                <path d="M 0 10 L 20 10 M 10 0 L 10 20" stroke="rgba(0,0,0,0.1)" strokeWidth="1" />
              </pattern>
            </defs>

            {/* Rock Background Area */}
            <rect x="10" y="20" width="680" height="110" fill="url(#rock-pattern)" rx="8" />

            {/* The Drilled Hole Tube */}
            <rect x="50" y="55" width="600" height="40" fill="#1e293b" stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />

            {/* FOND: Tovex Dynamite Stick (Fixed 30cm = 100px) */}
            <g>
              <rect x="50" y="58" width={fondWidthPx} height="34" fill={draggedSlots.fond === 'Tovex' ? '#eab308' : 'rgba(255,255,255,0.05)'} rx="2" stroke="rgba(0,0,0,0.2)" />
              {draggedSlots.fond === 'Tovex' && (
                <text x={50 + fondWidthPx / 2} y="78" textAnchor="middle" fill="#0f172a" className="text-[8px] font-black uppercase font-mono">TOVEX</text>
              )}
            </g>

            {/* COLONNE: ANFO (Nitrate) */}
            <g>
              <rect x={50 + fondWidthPx} y="58" width={colonneWidthPx} height="34" fill={draggedSlots.colonne === 'ANFO' ? 'url(#anfo-pattern)' : 'rgba(255,255,255,0.05)'} stroke="rgba(0,0,0,0.2)" />
              {draggedSlots.colonne === 'ANFO' && colonneWidthPx > 40 && (
                <rect x={50 + fondWidthPx + 5} y="64" width={colonneWidthPx - 10} height="22" fill="rgba(15,23,42,0.8)" rx="4" />
              )}
              {draggedSlots.colonne === 'ANFO' && colonneWidthPx > 45 && (
                <text x={50 + fondWidthPx + colonneWidthPx / 2} y="78" textAnchor="middle" fill="#60a5fa" className="text-[8px] font-black uppercase font-mono">ANFO Active</text>
              )}
            </g>

            {/* BOURRAGE: Clay Plug (Shrinks/grows based on slider) */}
            <g>
              <rect x={650 - clayWidthPx} y="58" width={clayWidthPx} height="34" fill={draggedSlots.bourrage === "Bourrage d'argile" ? 'url(#clay-pattern)' : 'rgba(255,255,255,0.05)'} stroke="rgba(0,0,0,0.2)" rx="1" />
              {draggedSlots.bourrage === "Bourrage d'argile" && clayWidthPx > 40 && (
                <text x={650 - clayWidthPx / 2} y="78" textAnchor="middle" fill="#ffffff" className="text-[8px] font-black uppercase font-mono drop-shadow-md">Argile</text>
              )}
            </g>

            {/* Blown-out shot visual indicators if clay tamping length is too small */}
            {step4SliderVal < 76 && (
              <g>
                {/* Blast wave leaking from the collar */}
                <circle cx="650" cy="75" r="15" fill="rgba(239, 68, 68, 0.4)" className="animate-ping" />
                <path d="M 650 75 L 685 60 M 650 75 L 690 75 M 650 75 L 685 90" stroke="#ef4444" strokeWidth="2.5" markerEnd="url(#arrow)" />
                <text x="630" y="45" fill="#f87171" className="text-[8px] font-black uppercase font-mono tracking-widest">⚠️ Fuite d'énergie !</text>
              </g>
            )}

            {/* Correct perfect tamping check (76cm) */}
            {step4SliderVal === 76 && (
              <g>
                <circle cx="500" cy="75" r="30" fill="none" stroke="#22c55e" strokeWidth="2" strokeDasharray="4,4" className="animate-pulse" />
                <text x="500" y="45" textAnchor="middle" fill="#4ade80" className="text-[9px] font-black uppercase font-mono tracking-widest">✓ Confinement optimal</text>
              </g>
            )}

            {/* Millimeter / centimeter dimension labels */}
            <g stroke="rgba(255,255,255,0.2)" strokeWidth="1">
              <line x1="50" y1="110" x2="650" y2="110" />
              <line x1="50" y1="106" x2="50" y2="114" />
              <line x1="650" y1="106" x2="650" y2="114" />
              <line x1={50 + fondWidthPx} y1="106" x2={50 + fondWidthPx} y2="114" />
              <line x1={650 - clayWidthPx} y1="106" x2={650 - clayWidthPx} y2="114" />
            </g>
            <text x="50" y="125" fill="#94a3b8" className="text-[8px] font-mono">0m (Fond)</text>
            <text x="650" y="125" fill="#94a3b8" className="text-[8px] font-mono text-right" textAnchor="end">1.80m (Col)</text>
          </svg>
        </div>

        {/* The Slider controller */}
        <div className="space-y-3">
          <div className="flex justify-between text-xs font-bold font-mono">
            <span className="text-slate-300">Longueur de Bourrage réglée : <strong className="text-amber-400 text-sm">{step4SliderVal} cm</strong></span>
            <span className="text-slate-400">Réglementaire SMI : <strong className="text-emerald-400">76 cm</strong></span>
          </div>
          <input 
            type="range" 
            min="40" 
            max="100" 
            value={step4SliderVal}
            onChange={(e) => setStep4SliderVal(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#b8860b]"
          />
          <div className="flex justify-between text-[8px] text-slate-500 font-bold uppercase font-mono tracking-widest">
            <span>Minimum (40cm)</span>
            <span className="text-emerald-500">Optimum (76cm)</span>
            <span>Maximum (100cm)</span>
          </div>
        </div>

        {/* Dynamic feedback panels based on slider state */}
        {step4SliderVal === 76 ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 p-4 rounded-2xl flex items-start gap-3"
          >
            <CheckCircle2 className="w-5 h-5 shrink-0 mt-0.5 text-emerald-500" />
            <div>
              <span className="text-xs font-black uppercase tracking-wider block">CONFORME : RENDEMENT OPTIMAL GARANTI</span>
              <p className="text-[10px] text-slate-300 mt-0.5 font-medium leading-relaxed">
                Excellent ! Les 76cm de bourrage d'argile confinent parfaitement la pression des gaz à l'explosion (20 fois le diamètre du trou de 38mm). Rendement de tir à 100% (1.7m réels obtenus).
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-2xl flex items-start gap-3"
          >
            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5 text-rose-500" />
            <div>
              <span className="text-xs font-black uppercase tracking-wider block">NON CONFORME ({step4SliderVal}cm)</span>
              <p className="text-[10px] text-slate-300 mt-0.5 font-medium leading-relaxed">
                {step4SliderVal < 76 
                  ? "⚠️ DANGER : COUP SOUFFLÉ ! Le bourrage est trop court pour retenir la pression. Les gaz s'échappent bruyamment comme un bouchon de champagne. La roche n'est pas abattue au fond, perte de métrage assurée de -0.48m !" 
                  : "⚠️ ERREUR : BOURRAGE TROP LONG ! Vous réduisez le volume utile de la charge explosive active en colonne, ce qui diminue la force de projection et provoque des blocs de roche géants (hors gabarit)."}
              </p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Question Formula */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-xs">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
          <HelpCircle className="w-5 h-5 text-[#b8860b]" />
          <p className="text-xs font-black uppercase text-slate-900 tracking-widest">
            Formule mathématique de confinement
          </p>
        </div>
        <p className="text-[11.5px] font-black uppercase text-slate-700 tracking-wide">
          Quelle est la formule scientifique universelle réglementaire de la longueur de bourrage ?
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            { val: '5', label: 'Lb = 5 × D_trou (Pas assez confinement)' },
            { val: '10', label: 'Lb = 10 × D_trou (Faible confinement)' },
            { val: '20', label: 'Lb = 20 × D_trou (76cm pour 38mm - Idéal SMI)' },
            { val: '50', label: 'Lb = 50 × D_trou (Excessif, pas de place charge)' }
          ].map(item => (
            <label 
              key={item.val}
              className={`p-4 border rounded-2xl flex items-center gap-3 cursor-pointer text-xs font-black transition-all ${
                step4Formula === item.val 
                  ? 'bg-amber-50/50 border-[#b8860b] text-[#b8860b] ring-1 ring-[#b8860b]/10' 
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <input 
                type="radio" 
                name="step4Formula" 
                value={item.val}
                checked={step4Formula === item.val}
                onChange={(e) => setStep4Formula(e.target.value)}
                className="accent-[#b8860b] w-4 h-4 shrink-0"
              />
              <span>{item.label}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
};
