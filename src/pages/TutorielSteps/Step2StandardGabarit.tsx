import React from 'react';
import { motion } from 'motion/react';
import { HelpCircle, CheckCircle, RotateCcw, AlertCircle, Compass, ShieldAlert } from 'lucide-react';
import { HOLES_DATA } from '../TechniqueMiniere/data';
import { HoleInfo } from '../TechniqueMiniere/types';

interface Step2Props {
  hoveredHole: HoleInfo | null;
  setHoveredHole: (hole: HoleInfo | null) => void;
  gasExpanded: boolean;
  setGasExpanded: (val: boolean) => void;
  step2Quiz: { q1: string; q2: string; q3: string };
  setStep2Quiz: React.Dispatch<React.SetStateAction<{ q1: string; q2: string; q3: string }>>;
  step2Submitted: boolean;
  step2Passed: boolean;
  handleStep2Submit: () => void;
  handleStep2Reset: () => void;
  getHoleColor: (type: string) => string;
}

export const Step2StandardGabarit: React.FC<Step2Props> = ({
  hoveredHole,
  setHoveredHole,
  gasExpanded,
  setGasExpanded,
  step2Quiz,
  setStep2Quiz,
  step2Submitted,
  step2Passed,
  handleStep2Submit,
  handleStep2Reset,
  getHoleColor
}) => {

  const getHoleNameInFrench = (type: string) => {
    switch (type) {
      case 'vide': return 'Trou vide de décharge';
      case 'charge': return 'Bouchon chargé';
      case 'g1': return 'Élargissement G1';
      case 'g2': return 'Élargissement G2';
      case 'g3': return 'Élargissement G3';
      case 'g4': return 'Élargissement G4';
      case 'radier': return 'Trous de Radier (Sol)';
      case 'parement': return 'Trous de Parement (Côtés)';
      case 'voute': return 'Trous de Voûte (Toit)';
      default: return 'Forage Technique';
    }
  };

  const getHoleExplosiveInfo = (type: string) => {
    if (type === 'vide') return { explosive: 'Aucun (Expansion libre)', weight: '0 kg', sequence: 'Aucune' };
    if (type === 'charge' || type === 'g1') return { explosive: 'Cartouche Tovex (Dynamite)', weight: '0.8 kg', sequence: 'Instantané / 25ms' };
    return { explosive: 'ANFO (Mélange nitrate-fioul)', weight: '1.2 kg', sequence: 'Minutée (50-125ms)' };
  };

  return (
    <div className="space-y-8" id="step2-workspace">
      <div>
        <p className="text-sm text-slate-600 leading-relaxed font-medium">
          La galerie de <strong className="text-slate-900">12m²</strong> est la section standard des galeries principales de la SMI. 
          Elle comporte un patron géométrique réglementaire rigoureux de <strong className="text-slate-900">38 trous</strong> de forage d'un diamètre de <strong className="text-slate-900">38mm</strong>.
        </p>
      </div>

      {/* 12m2 Interactive SVG Schema */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <span className="text-xs font-black uppercase tracking-widest text-[#b8860b] flex items-center gap-1.5">
            <Compass className="w-4 h-4" />
            Schéma d'ingénierie du front de taille (12m²)
          </span>
          <button
            onClick={() => setGasExpanded(!gasExpanded)}
            className={`px-4 py-1.5 text-[10px] font-black uppercase tracking-wider rounded-xl border transition-all cursor-pointer ${
              gasExpanded 
                ? 'bg-amber-100 border-amber-300 text-amber-800 ring-2 ring-amber-50' 
                : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
            }`}
          >
            {gasExpanded ? "Masquer la décompression" : "Simuler l'expansion des gaz"}
          </button>
        </div>

        <div className="relative">
          {/* Engineering Blueprint Wrapper */}
          <div className="bg-slate-950 rounded-2xl border border-slate-800 p-4 shadow-xl overflow-hidden relative">
            
            {/* Blueprint Grid Background Pattern */}
            <svg viewBox="0 0 1000 700" className="w-full h-[400px]">
              <defs>
                <pattern id="blueprint-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(59, 130, 246, 0.08)" strokeWidth="1" />
                </pattern>
                <radialGradient id="blueprint-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="rgba(30, 41, 59, 0.6)" />
                  <stop offset="100%" stopColor="rgba(15, 23, 42, 0.95)" />
                </radialGradient>
                <radialGradient id="shockwave">
                  <stop offset="0%" stopColor="#ef4444" />
                  <stop offset="40%" stopColor="#f59e0b" />
                  <stop offset="100%" stopColor="transparent" />
                </radialGradient>
                <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#f59e0b" />
                </marker>
              </defs>

              {/* Layout Layers */}
              <rect width="1000" height="700" fill="url(#blueprint-glow)" />
              <rect width="1000" height="700" fill="url(#blueprint-grid)" />

              {/* Technical Survey Lines */}
              {/* Outer boundary lines */}
              <g stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1">
                <line x1="50" y1="50" x2="950" y2="50" />
                <line x1="50" y1="650" x2="950" y2="650" />
                <line x1="50" y1="50" x2="50" y2="650" />
                <line x1="950" y1="50" x2="950" y2="650" />
                {/* Axes */}
                <line x1="500" y1="50" x2="500" y2="650" strokeDasharray="5,5" stroke="rgba(59, 130, 246, 0.2)" strokeWidth="1.5" />
                <line x1="50" y1="430" x2="950" y2="430" strokeDasharray="5,5" stroke="rgba(59, 130, 246, 0.2)" strokeWidth="1.5" />
              </g>

              {/* Architectural Dimensions indicators */}
              <g stroke="rgba(59, 130, 246, 0.4)" strokeWidth="1.5">
                {/* Horizontal width line (4.00 m) */}
                <line x1="125" y1="620" x2="875" y2="620" />
                <path d="M 125 615 L 125 625 M 875 615 L 875 625" />
                {/* Vertical height line (3.00 m) */}
                <line x1="80" y1="200" x2="80" y2="570" />
                <path d="M 75 200 L 85 200 M 75 570 L 85 570" />
              </g>
              <text x="500" y="610" textAnchor="middle" fill="#60a5fa" className="text-[12px] font-mono font-bold uppercase tracking-widest">
                Largeur nominale : 4.00 m (± 10cm)
              </text>
              <text x="95" y="380" textAnchor="middle" fill="#60a5fa" className="text-[12px] font-mono font-bold uppercase tracking-widest" transform="rotate(-90, 95, 380)">
                Hauteur : 3.00 m
              </text>

              {/* Tunnel outer path */}
              <path d="M 125 570 L 125 330 A 375 375 0 0 1 875 330 L 875 570 Z" fill="none" stroke="rgba(59, 130, 246, 0.25)" strokeWidth="8" />
              <path d="M 125 570 L 125 330 A 375 375 0 0 1 875 330 L 875 570 Z" fill="none" stroke="#60a5fa" strokeWidth="2.5" strokeDasharray="10,5" />

              {/* Center point crosshair */}
              <path d="M 490 430 L 510 430 M 500 420 L 500 440" stroke="#f59e0b" strokeWidth="2" />
              
              {/* Shockwave gas expansion visual animation */}
              {gasExpanded && (
                <g>
                  <circle cx="500" cy="430" r="150" fill="url(#shockwave)" opacity="0.3">
                    <animate attributeName="r" values="30;180;30" dur="2s" repeatCount="indefinite" />
                  </circle>
                  {/* Arrows pointing to the empty expansion volume */}
                  <path d="M 440 430 L 480 430" stroke="#f59e0b" strokeWidth="3" markerEnd="url(#arrow)" fill="none" />
                  <path d="M 560 430 L 520 430" stroke="#f59e0b" strokeWidth="3" markerEnd="url(#arrow)" fill="none" />
                </g>
              )}

              {/* Render all 38 holes */}
              {HOLES_DATA.map((hole) => {
                const isHovered = hoveredHole?.id === hole.id;
                const isVide = hole.type === 'vide';

                return (
                  <g 
                    key={hole.id}
                    onMouseEnter={() => setHoveredHole(hole)}
                    onMouseLeave={() => setHoveredHole(null)}
                    className="cursor-pointer group"
                  >
                    {/* Glowing ring if hovered */}
                    <circle 
                      cx={hole.x} 
                      cy={hole.y} 
                      r={isVide ? "26" : "22"} 
                      fill="none" 
                      stroke={isHovered ? getHoleColor(hole.type) : 'transparent'} 
                      strokeWidth="2" 
                      className="transition-all duration-300"
                      opacity={isHovered ? 0.8 : 0}
                    />

                    {/* Main Hole Circle */}
                    <circle 
                      cx={hole.x} 
                      cy={hole.y} 
                      r={isVide ? "15" : "13"} 
                      fill={isVide ? 'none' : getHoleColor(hole.type)} 
                      stroke={isVide ? '#ffffff' : 'rgba(15, 23, 42, 0.8)'} 
                      strokeWidth={isVide ? '3' : '2'}
                      className="transition-all duration-300 group-hover:scale-110"
                    />

                    {/* Empty hole inner point */}
                    {isVide && (
                      <circle cx={hole.x} cy={hole.y} r="5" fill="#ffffff" />
                    )}

                    {/* Numeric Timing label inside hole */}
                    <text 
                      x={hole.x} 
                      y={hole.y + 4} 
                      textAnchor="middle" 
                      fill={isVide ? '#0f172a' : '#ffffff'} 
                      className="text-[10px] font-black select-none pointer-events-none font-mono"
                    >
                      {hole.label}
                    </text>
                  </g>
                );
              })}
            </svg>

            {/* Custom Telemetry HUD Tooltip overlay */}
            {hoveredHole ? (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                className="absolute bottom-4 left-4 right-4 bg-slate-900/95 border border-slate-700 rounded-2xl p-4 text-white shadow-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 backdrop-blur-xs"
              >
                <div className="flex items-center gap-3.5">
                  <div className="w-4 h-4 rounded-full shrink-0 border border-white/20" style={{ backgroundColor: getHoleColor(hoveredHole.type) }} />
                  <div>
                    <h5 className="text-xs font-black uppercase tracking-wider text-amber-400">
                      {getHoleNameInFrench(hoveredHole.type)} ({hoveredHole.name})
                    </h5>
                    <p className="text-[11px] text-slate-300 font-bold mt-0.5">
                      {hoveredHole.desc}
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4 border-t md:border-t-0 md:border-l border-slate-800 pt-3 md:pt-0 md:pl-4 text-left text-[10px] font-mono">
                  <div>
                    <span className="text-slate-400 block uppercase font-black text-[9px]">Explosif</span>
                    <span className="font-bold text-slate-100">{getHoleExplosiveInfo(hoveredHole.type).explosive}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block uppercase font-black text-[9px]">Poids estimatif</span>
                    <span className="font-bold text-slate-100">{getHoleExplosiveInfo(hoveredHole.type).weight}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block uppercase font-black text-[9px]">Délai d'amorçage</span>
                    <span className="font-bold text-[#b8860b]">{hoveredHole.delay} ms</span>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="absolute bottom-4 left-4 right-4 bg-slate-900/90 border border-slate-800 rounded-2xl p-3 text-center text-slate-400 text-[10px] font-black uppercase tracking-widest font-mono">
                🔍 Survolez un trou de forage pour activer la télémétrie technique
              </div>
            )}
          </div>
        </div>

        {/* Step Explanation Text */}
        <div className="bg-slate-50 border border-slate-200/60 rounded-3xl p-5 grid grid-cols-1 md:grid-cols-2 gap-6 shadow-2xs">
          <div className="space-y-1">
            <h5 className="text-[10px] font-black uppercase tracking-widest text-[#b8860b]">
              Pourquoi 3 vides de décharge ?
            </h5>
            <p className="text-[11.5px] text-slate-600 leading-relaxed font-medium">
              Les <strong className="text-slate-900">3 trous vides centraux</strong> ne contiennent aucun explosif. 
              Ils offrent l'unique volume d'expansion libre initial vers lequel la roche des trous chargés voisins se dilate. 
              Sans ces 3 trous d'expansion vides, la roche resterait coincée, le tir ferait "coup manqué" et la galerie n'avancerait pas.
            </p>
          </div>
          <div className="space-y-1">
            <h5 className="text-[10px] font-black uppercase tracking-widest text-emerald-600">
              Pourquoi 35 chargés ?
            </h5>
            <p className="text-[11.5px] text-slate-600 leading-relaxed font-medium">
              Les <strong className="text-slate-900">35 trous restants</strong> reçoivent la dynamite (Tovex) et le nitrate (ANFO). 
              Ils explosent de façon très séquencée (de 0ms à 125ms) pour cisailler, briser, broyer la roche et l'éjecter de manière ordonnée et optimale.
            </p>
          </div>
        </div>

        {/* Quiz Section */}
        <div className="bg-white border border-slate-200/85 rounded-3xl p-6 space-y-5 shadow-xs">
          <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
            <HelpCircle className="w-5 h-5 text-[#b8860b]" />
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-900">
              Quiz d'Habilitation : Gabarit 12m²
            </h4>
          </div>

          {/* Question 1 */}
          <div className="space-y-3">
            <p className="text-[11.5px] font-black uppercase tracking-wide text-slate-700">
              Q1 : Combien de trous de forage totaux comporte une galerie réglementaire de 12m² ?
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {['28', '35', '38', '42'].map(opt => (
                <label 
                  key={opt}
                  className={`p-3.5 border rounded-2xl flex items-center gap-2.5 cursor-pointer transition-all text-xs font-black uppercase ${
                    step2Quiz.q1 === opt 
                      ? 'bg-amber-50/50 border-[#b8860b] text-[#b8860b] ring-1 ring-[#b8860b]/10' 
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <input 
                    type="radio" 
                    name="q1" 
                    value={opt} 
                    checked={step2Quiz.q1 === opt}
                    onChange={(e) => setStep2Quiz(prev => ({ ...prev, q1: e.target.value }))}
                    disabled={step2Submitted && step2Passed}
                    className="accent-[#b8860b] w-4 h-4"
                  />
                  {opt} trous
                </label>
              ))}
            </div>
          </div>

          {/* Question 2 */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <p className="text-[11.5px] font-black uppercase tracking-wide text-slate-700">
              Q2 : Quelle est la fonction obligatoire des 3 trous de forage laissés vides ?
            </p>
            <div className="space-y-3">
              {[
                { val: 'eco', label: 'Économiser la dynamite et réduire le budget d\'explosifs' },
                { val: 'expansion', label: 'Offrir un vide d\'expansion pour que la roche se décomprime et se brise' },
                { val: 'vent', label: 'Améliorer le flux de ventilation et dissiper les gaz toxiques' },
                { val: 'topo', label: 'Repères topographiques indispensables pour guider le laser de ciblage' }
              ].map(item => (
                <label 
                  key={item.val}
                  className={`p-3.5 border rounded-2xl flex items-center gap-3.5 cursor-pointer transition-all text-xs font-bold ${
                    step2Quiz.q2 === item.val 
                      ? 'bg-amber-50/50 border-[#b8860b] text-[#b8860b] ring-1 ring-[#b8860b]/10' 
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <input 
                    type="radio" 
                    name="q2" 
                    value={item.val} 
                    checked={step2Quiz.q2 === item.val}
                    onChange={(e) => setStep2Quiz(prev => ({ ...prev, q2: e.target.value }))}
                    disabled={step2Submitted && step2Passed}
                    className="accent-[#b8860b] w-4 h-4 shrink-0"
                  />
                  <span>{item.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Question 3 */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <p className="text-[11.5px] font-black uppercase tracking-wide text-slate-700">
              Q3 : Quel est le diamètre réglementaire du taillant de forage (mèche) utilisé à la SMI ?
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {['32', '38', '42', '50'].map(opt => (
                <label 
                  key={opt}
                  className={`p-3.5 border rounded-2xl flex items-center gap-2.5 cursor-pointer transition-all text-xs font-black uppercase ${
                    step2Quiz.q3 === opt 
                      ? 'bg-amber-50/50 border-[#b8860b] text-[#b8860b] ring-1 ring-[#b8860b]/10' 
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <input 
                    type="radio" 
                    name="q3" 
                    value={opt} 
                    checked={step2Quiz.q3 === opt}
                    onChange={(e) => setStep2Quiz(prev => ({ ...prev, q3: e.target.value }))}
                    disabled={step2Submitted && step2Passed}
                    className="accent-[#b8860b] w-4 h-4"
                  />
                  {opt} mm
                </label>
              ))}
            </div>
          </div>

          {/* Feedback & Actions */}
          <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
            {step2Submitted && (
              <div className={`p-4 rounded-2xl border text-xs font-bold flex-1 ${
                step2Passed 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}>
                {step2Passed ? (
                  <p className="flex items-center gap-2 uppercase font-black tracking-wider">
                    <CheckCircle className="w-5 h-5 shrink-0" /> Félicitations ! Réponses parfaites (3/3).
                  </p>
                ) : (
                  <div className="space-y-1">
                    <p className="font-black uppercase tracking-wider flex items-center gap-1.5">
                      <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" /> Échec : une ou plusieurs réponses fausses.
                    </p>
                    <p className="text-[10.5px] text-rose-600 font-bold uppercase tracking-wide leading-relaxed pl-6">
                      Rappel : une galerie standard de 12m² comporte 38 trous de 38mm. Les 3 trous vides servent exclusivement de volume de décompression. Recommencez !
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="flex gap-2.5 justify-end">
              {!step2Passed ? (
                <button
                  onClick={handleStep2Submit}
                  disabled={!step2Quiz.q1 || !step2Quiz.q2 || !step2Quiz.q3}
                  className="px-6 py-3 bg-[#b8860b] disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 border border-[#b8860b] text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-[#9a7209] transition-all cursor-pointer shadow-sm hover:scale-[1.02] active:scale-[0.98]"
                >
                  Valider les réponses
                </button>
              ) : (
                <div className="flex items-center gap-2 text-emerald-600 font-black text-xs uppercase tracking-wider bg-emerald-50 border border-emerald-200 px-5 py-3 rounded-xl shadow-2xs">
                  <CheckCircle className="w-4 h-4" /> Validé
                </div>
              )}

              {step2Submitted && !step2Passed && (
                <button
                  onClick={handleStep2Reset}
                  className="p-3 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-xl transition-all text-slate-700 cursor-pointer shadow-2xs"
                  title="Recommencer"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
