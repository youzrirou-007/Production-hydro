import React from 'react';
import { motion } from 'motion/react';
import { Compass, CheckCircle2, AlertTriangle, ArrowRight, Target, ShieldCheck } from 'lucide-react';
import { HOLES_DATA } from '../TechniqueMiniere/data';
import { HoleInfo } from '../TechniqueMiniere/types';

interface Step3Props {
  step3Ex1: 'none' | 'success' | 'fail';
  setStep3Ex1: (val: 'none' | 'success' | 'fail') => void;
  step3Ex2: 'none' | 'success' | 'fail';
  setStep3Ex2: (val: 'none' | 'success' | 'fail') => void;
  step3Ex3: string;
  setStep3Ex3: (val: string) => void;
  step3ClickedHoleId: string | null;
  setStep3ClickedHoleId: (val: string | null) => void;
  getHoleColor: (type: string) => string;
}

export const Step3PrecisionForage: React.FC<Step3Props> = ({
  step3Ex1,
  step3Ex2,
  step3Ex3,
  setStep3Ex1,
  setStep3Ex2,
  setStep3Ex3,
  step3ClickedHoleId,
  setStep3ClickedHoleId,
  getHoleColor
}) => {

  const handleHoleClick = (hole: HoleInfo) => {
    const isBouchon = hole.type === 'vide' || hole.type === 'charge';
    const isG3 = hole.type === 'g3';

    // Ex 1 click logic
    if (step3Ex1 !== 'success') {
      if (isBouchon) {
        setStep3Ex1('success');
      } else {
        setStep3Ex1('fail');
      }
    }
    // Ex 2 click logic
    else if (step3Ex2 !== 'success') {
      if (isG3) {
        setStep3Ex2('success');
      } else {
        setStep3Ex2('fail');
        setStep3ClickedHoleId(hole.type.toUpperCase());
      }
    }
  };

  const getHoleLegendText = (type: string) => {
    switch (type.toLowerCase()) {
      case 'vide': return 'Vide';
      case 'charge': return 'Bouchon';
      case 'g1': return 'G1 (25ms)';
      case 'g2': return 'G2 (50ms)';
      case 'g3': return 'G3 (75ms)';
      case 'g4': return 'G4 (100ms)';
      case 'radier': return 'Radier';
      case 'parement': return 'Parements';
      case 'voute': return 'Voûte';
      default: return 'Technique';
    }
  };

  return (
    <div className="space-y-8" id="step3-workspace">
      <div>
        <p className="text-sm text-slate-600 leading-relaxed font-medium">
          Forer correctement est indispensable. Un mauvais parallélisme des trous ou un mauvais alignement provoque des <strong>pertes de métrage considérables (culots de trous importants)</strong>.
        </p>
      </div>

      <div className="bg-amber-500/5 border border-amber-500/15 rounded-3xl p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-amber-500/10 pb-2">
          <Compass className="w-5 h-5 text-[#b8860b]" />
          <h4 className="text-xs font-black uppercase tracking-widest text-[#b8860b]">
            Atelier Pratique de Forage Interactif
          </h4>
        </div>
        <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
          Complétez les 3 exercices de pointage ci-dessous pour valider l'étape :
        </p>

        {/* Ex 1 */}
        <div className="bg-white rounded-2xl p-4 border border-slate-150 space-y-2.5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black uppercase tracking-widest bg-slate-900 text-amber-400 px-2.5 py-1 rounded-md">
              Exercice 1
            </span>
            {step3Ex1 === 'success' && <span className="text-emerald-600 font-black text-[9px] uppercase">Complété ✓</span>}
          </div>
          <p className="text-xs font-black text-slate-700 uppercase tracking-wide">
            Montre-moi sur le schéma ci-dessous où on doit forer en premier ?
          </p>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            (Indice : On commence toujours par le Bouchon pour créer un vide d'expansion initial !)
          </p>
          {step3Ex1 !== 'none' && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className={`p-3 rounded-xl text-xs font-bold ${
                step3Ex1 === 'success' 
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
                  : 'bg-rose-50 border border-rose-200 text-rose-800'
              }`}
            >
              {step3Ex1 === 'success' 
                ? "✅ Exact ! On commence impérativement par forer le Bouchon Central pour décompresser le massif rocheux." 
                : "❌ Non ! Commencer par les parements ou la voûte n'aurait aucun espace d'expansion, causant un échec de tir."}
            </motion.div>
          )}
        </div>

        {/* Ex 2 */}
        <div className={`bg-white rounded-2xl p-4 border border-slate-150 space-y-2.5 shadow-2xs transition-all ${
          step3Ex1 !== 'success' ? 'opacity-50 pointer-events-none' : ''
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black uppercase tracking-widest bg-slate-900 text-blue-400 px-2.5 py-1 rounded-md">
              Exercice 2
            </span>
            {step3Ex2 === 'success' && <span className="text-emerald-600 font-black text-[9px] uppercase">Complété ✓</span>}
          </div>
          <p className="text-xs font-black text-slate-700 uppercase tracking-wide">
            Trouvez et cliquez sur n'importe quel trou du Groupe d'Élargissement 3 (Délai : 75ms)
          </p>
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
            (Indice : Cherchez les trous de couleur cyan dans la couronne périphérique du centre !)
          </p>
          {step3Ex2 !== 'none' && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className={`p-3 rounded-xl text-xs font-bold ${
                step3Ex2 === 'success' 
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
                  : 'bg-rose-50 border border-rose-200 text-rose-800'
              }`}
            >
              {step3Ex2 === 'success' 
                ? "✅ Parfait ! Vous avez cliqué sur un trou d'élargissement G3 (75ms) de couleur cyan." 
                : `❌ Non ! Ce trou est de type : ${step3ClickedHoleId}. Cherchez les trous cyan (Légende G3).`}
            </motion.div>
          )}
        </div>

        {/* Ex 3 */}
        <div className={`bg-white rounded-2xl p-4 border border-slate-150 space-y-3 shadow-2xs transition-all ${
          step3Ex2 !== 'success' ? 'opacity-50 pointer-events-none' : ''
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-black uppercase tracking-widest bg-slate-900 text-emerald-400 px-2.5 py-1 rounded-md">
              Exercice 3
            </span>
            {step3Ex3 === '1.7' && <span className="text-emerald-600 font-black text-[9px] uppercase">Complété ✓</span>}
          </div>
          <p className="text-xs font-black text-slate-700 uppercase tracking-wide">
            Quelle est l'avancement théorique (métrage) maximum que l'on obtient en forant avec une tige de forage de 1.8m ?
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {['1.5', '1.7', '1.8', '2.0'].map(val => (
              <button
                key={val}
                onClick={() => setStep3Ex3(val)}
                className={`p-3 rounded-2xl text-xs font-black uppercase tracking-widest border transition-all cursor-pointer ${
                  step3Ex3 === val 
                    ? 'bg-[#b8860b] border-[#b8860b] text-white ring-2 ring-[#b8860b]/20' 
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {val} m
              </button>
            ))}
          </div>
          {step3Ex3 && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className={`p-3 rounded-xl text-xs font-bold ${
                step3Ex3 === '1.7' 
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
                  : 'bg-rose-50 border border-rose-200 text-rose-800'
              }`}
            >
              {step3Ex3 === '1.7' 
                ? "✅ Correct ! Avec une tige de 1.8m, on perd toujours environ 10cm en fond de trou (culot inévitable), l'avancement optimal réel est donc de 1.7m." 
                : "❌ Incorrect. Pour une tige de 1.8m, la valeur d'avancement planifiée SMI réglementaire est de 1.7m (perte de 10cm)."}
            </motion.div>
          )}
        </div>
      </div>

      {/* SVG Map of Holes for Exercise Pointing */}
      <div className="border border-slate-200/80 rounded-2xl overflow-hidden shadow-md relative">
        <div className="bg-slate-900 p-3.5 text-white flex justify-between text-[10px] font-black uppercase tracking-widest font-mono">
          <span className="flex items-center gap-1.5"><Target className="w-4 h-4 text-rose-500 animate-pulse" /> Pointez directement les trous sur le front de taille :</span>
          <span className="text-[#b8860b]">Atelier de Forage Souterrain</span>
        </div>
        
        <div className="relative bg-slate-950 p-2">
          <svg viewBox="0 0 1000 700" className="w-full h-[320px]">
            <defs>
              <pattern id="step3-grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.04)" strokeWidth="1" />
              </pattern>
            </defs>
            
            <rect width="1000" height="700" fill="rgba(15, 23, 42, 0.95)" />
            <rect width="1000" height="700" fill="url(#step3-grid)" />

            {/* Inner Rock Tunnel Overlay */}
            <path d="M 125 570 L 125 330 A 375 375 0 0 1 875 330 L 875 570 Z" fill="none" stroke="rgba(59, 130, 246, 0.15)" strokeWidth="6" />
            <path d="M 125 570 L 125 330 A 375 375 0 0 1 875 330 L 875 570 Z" fill="none" stroke="rgba(59, 130, 246, 0.4)" strokeWidth="1.5" strokeDasharray="6,4" />

            {/* Guide markers on exercise targets */}
            {step3Ex1 !== 'success' && (
              <g>
                {/* Highlight Bouchon Central with flashing ring */}
                <circle cx="500" cy="430" r="70" fill="none" stroke="#ffd700" strokeWidth="2" strokeDasharray="4,4" className="animate-spin" style={{ transformOrigin: '500px 430px', animationDuration: '8s' }} />
                <text x="500" y="340" textAnchor="middle" fill="#ffd700" className="text-[13px] font-black uppercase tracking-wider font-mono animate-pulse">🎯 Cible 1 : Commencer par le Bouchon</text>
              </g>
            )}

            {step3Ex1 === 'success' && step3Ex2 !== 'success' && (
              <g>
                {/* Highlight G3 with flashing cyan rings */}
                <circle cx="500" cy="430" r="130" fill="none" stroke="#06b6d4" strokeWidth="1.5" strokeDasharray="3,3" />
                <text x="500" y="270" textAnchor="middle" fill="#06b6d4" className="text-[13px] font-black uppercase tracking-wider font-mono animate-pulse">🎯 Cible 2 : Pointez un trou cyan G3 (75ms)</text>
              </g>
            )}

            {/* Interactive holes for clicking */}
            {HOLES_DATA.map((hole) => {
              const isBouchon = hole.type === 'vide' || hole.type === 'charge';
              const isG3 = hole.type === 'g3';

              // Decide if pulsing ring is active
              const showPulse = (step3Ex1 !== 'success' && isBouchon) || (step3Ex1 === 'success' && step3Ex2 !== 'success' && isG3);

              return (
                <g 
                  key={hole.id}
                  onClick={() => handleHoleClick(hole)}
                  className="cursor-pointer group"
                >
                  {/* Outer pulsing scope target rings */}
                  {showPulse && (
                    <circle 
                      cx={hole.x} 
                      cy={hole.y} 
                      r="24" 
                      fill="none" 
                      stroke={step3Ex1 !== 'success' ? '#ffd700' : '#06b6d4'} 
                      strokeWidth="1.5" 
                      className="animate-ping"
                      opacity="0.5"
                    />
                  )}

                  <circle 
                    cx={hole.x} 
                    cy={hole.y} 
                    r="15" 
                    fill={getHoleColor(hole.type)} 
                    stroke="rgba(15, 23, 42, 0.9)"
                    strokeWidth="2.5"
                    className="transition-all opacity-90 group-hover:opacity-100 group-hover:scale-115"
                  />
                  <text 
                    x={hole.x} 
                    y={hole.y + 4} 
                    textAnchor="middle" 
                    fill="#ffffff" 
                    className="text-[9px] font-black select-none pointer-events-none font-mono"
                  >
                    {hole.label}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Miniature Floating Legend */}
          <div className="absolute top-4 right-4 bg-slate-900/90 border border-slate-700/60 p-3 rounded-xl text-[9px] text-white font-mono font-bold uppercase tracking-wider space-y-1.5 backdrop-blur-xs">
            <span className="text-[8px] text-slate-400 block border-b border-slate-800 pb-1 font-black mb-1">Légende active</span>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-yellow-500 border border-white/10" /> Bouchon central</div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-cyan-500 border border-white/10" /> Élargissement G3</div>
          </div>
        </div>
      </div>

      {/* Step Validation Banner */}
      {step3Ex1 === 'success' && step3Ex2 === 'success' && step3Ex3 === '1.7' && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-5 rounded-3xl flex items-center gap-4 shadow-2xs"
        >
          <div className="p-2.5 bg-emerald-100 rounded-2xl text-emerald-600 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h5 className="text-xs font-black uppercase tracking-wider">Habilitation Forage Validée !</h5>
            <p className="text-[11px] text-emerald-700 font-semibold mt-0.5 leading-relaxed">
              Félicitations ! Les 3 ateliers de pointage et de calcul d'avancement de forage sont réussis avec brio. Vous maîtrisez le parallélisme.
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
};
