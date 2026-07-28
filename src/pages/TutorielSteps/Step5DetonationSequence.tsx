import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowUp, ArrowDown, CheckCircle, AlertTriangle, Play, HelpCircle, Activity } from 'lucide-react';

interface Step5Props {
  step5Sequence: string[];
  setStep5Sequence: React.Dispatch<React.SetStateAction<string[]>>;
  step5SequenceSuccess: boolean;
  step5SequenceSubmitted: boolean;
  step5Q: string;
  setStep5Q: (val: string) => void;
  moveSequenceItem: (index: number, direction: 'up' | 'down') => void;
  handleStep5VerifyOrder: () => void;
}

export const Step5DetonationSequence: React.FC<Step5Props> = ({
  step5Sequence,
  setStep5Sequence,
  step5SequenceSuccess,
  step5SequenceSubmitted,
  step5Q,
  setStep5Q,
  moveSequenceItem,
  handleStep5VerifyOrder
}) => {
  const [isPlayingAnimation, setIsPlayingAnimation] = useState(false);
  const [activeAnimStep, setActiveAnimStep] = useState<number | null>(null);

  const startDetonationAnimation = () => {
    setIsPlayingAnimation(true);
    setActiveAnimStep(0);

    const delays = [0, 1, 2, 3, 4, 5];
    delays.forEach((stepIdx) => {
      setTimeout(() => {
        setActiveAnimStep(stepIdx);
        if (stepIdx === 5) {
          setTimeout(() => {
            setIsPlayingAnimation(false);
            setActiveAnimStep(null);
          }, 800);
        }
      }, stepIdx * 450);
    });
  };

  const getStepColorClass = (item: string) => {
    if (item.includes('0ms')) return 'border-l-4 border-l-yellow-500';
    if (item.includes('25ms')) return 'border-l-4 border-l-blue-500';
    if (item.includes('50ms')) return 'border-l-4 border-l-red-500';
    if (item.includes('75ms')) return 'border-l-4 border-l-cyan-500';
    if (item.includes('100ms')) return 'border-l-4 border-l-orange-500';
    if (item.includes('125ms')) return 'border-l-4 border-l-purple-500';
    return '';
  };

  const getStepBgColor = (idx: number) => {
    if (activeAnimStep === idx) return 'bg-[#b8860b]/15 border-[#b8860b]/40 shadow-xs ring-1 ring-[#b8860b]/10';
    return 'bg-white border-slate-200 hover:border-slate-300';
  };

  return (
    <div className="space-y-8" id="step5-workspace">
      <div>
        <p className="text-sm text-slate-600 leading-relaxed font-medium">
          Une détonation n'est jamais instantanée. Elle est ordonnée à la milliseconde près (ms). 
          <strong> Le bouchon au centre doit impérativement détoner en premier (0ms)</strong> pour créer l'espace vide nécessaire avant que les couronnes d'élargissement ne s'abattent l'une après l'autre.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Sorting Timeline Column */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <span className="text-xs font-black uppercase tracking-widest text-[#b8860b] flex items-center gap-1.5">
              <Activity className="w-4 h-4" />
              Séquenceur de micro-retards (Triez l'ordre)
            </span>
            <button
              onClick={startDetonationAnimation}
              disabled={isPlayingAnimation}
              className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-black uppercase text-[10px] tracking-wider rounded-xl transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              {isPlayingAnimation ? "Séquençage en cours..." : "Simuler la détonation"}
            </button>
          </div>

          <div className="space-y-2.5">
            <AnimatePresence mode="popLayout">
              {step5Sequence.map((item, idx) => {
                const stepColorBorder = getStepColorClass(item);
                const isCurrentActiveAnim = activeAnimStep === idx;

                return (
                  <motion.div
                    key={item}
                    layout
                    className={`p-3.5 border rounded-2xl flex items-center justify-between transition-all duration-300 shadow-2xs relative overflow-hidden ${stepColorBorder} ${getStepBgColor(idx)}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-6 h-6 rounded-lg text-[10px] font-mono font-bold flex items-center justify-center ${
                        isCurrentActiveAnim ? 'bg-[#b8860b] text-white animate-pulse' : 'bg-slate-100 text-slate-500'
                      }`}>
                        {idx + 1}
                      </div>
                      <div>
                        <span className="text-xs font-black uppercase tracking-wide text-slate-700">{item}</span>
                        {isCurrentActiveAnim && (
                          <span className="ml-2.5 text-[8px] font-black uppercase tracking-widest text-[#b8860b] animate-pulse">Explosion !</span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => moveSequenceItem(idx, 'up')}
                        disabled={idx === 0 || isPlayingAnimation}
                        className="p-1.5 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-lg text-slate-500 cursor-pointer transition-colors disabled:opacity-30 disabled:pointer-events-none"
                        title="Monter"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => moveSequenceItem(idx, 'down')}
                        disabled={idx === step5Sequence.length - 1 || isPlayingAnimation}
                        className="p-1.5 hover:bg-slate-100 border border-slate-200 hover:border-slate-300 rounded-lg text-slate-500 cursor-pointer transition-colors disabled:opacity-30 disabled:pointer-events-none"
                        title="Descendre"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Progress pulse fill indicator */}
                    {isCurrentActiveAnim && (
                      <motion.div 
                        initial={{ left: '-100%' }}
                        animate={{ left: '0%' }}
                        transition={{ duration: 0.4 }}
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#b8860b]"
                      />
                    )}
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>

          <div className="pt-2 flex justify-end gap-2.5">
            <button
              onClick={handleStep5VerifyOrder}
              className="px-6 py-3 bg-[#b8860b] text-white hover:bg-[#9a7209] font-black text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-sm"
            >
              Vérifier la conformité de la séquence
            </button>
          </div>

          {step5SequenceSubmitted && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 rounded-2xl border text-xs font-bold leading-relaxed ${
                step5SequenceSuccess 
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              {step5SequenceSuccess ? (
                <p className="flex items-center gap-2 uppercase font-black tracking-wider">
                  <CheckCircle className="w-5 h-5 shrink-0" /> Séquence parfaite ! Le front se décompresse vers le vide central sans perturbation.
                </p>
              ) : (
                <div className="space-y-1">
                  <p className="font-black uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600" /> Ordre non conforme !
                  </p>
                  <p className="text-[10.5px] text-rose-600 font-bold uppercase tracking-wide leading-relaxed pl-6">
                    Le tir commence toujours par le Bouchon central (0ms) pour vider le cœur, puis s'élargit progressivement du Groupe 1 (25ms) au Groupe 4 (100ms) pour finir par la Découpe de Voûte/Finition (125ms).
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </div>

        {/* Informative Visual Timeline Explainer Card */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-50 border border-slate-200/80 rounded-3xl p-5 space-y-4">
            <h5 className="text-[10px] font-black uppercase tracking-widest text-[#b8860b]">
              Visualisation : Onde de choc (ms)
            </h5>
            <p className="text-[11.5px] text-slate-600 leading-relaxed font-medium">
              Chaque micro-retard correspond à l'explosion ordonnée de différentes couronnes d'abattage de la roche. 
              Le délai idéal réglementaire SMI entre deux couronnes d'élargissement est de <strong>25 ms</strong>.
            </p>

            <div className="border border-slate-200 rounded-2xl p-4 bg-white text-center space-y-3 shadow-2xs">
              <span className="text-[8px] font-black uppercase tracking-widest text-slate-400 block">Propagation théorique</span>
              
              {/* Graphic animation representation */}
              <div className="w-32 h-32 mx-auto rounded-full bg-slate-900 relative overflow-hidden flex items-center justify-center border border-slate-800">
                
                {/* Outward rings */}
                <div className={`absolute w-6 h-6 rounded-full border border-yellow-500 ${isPlayingAnimation && activeAnimStep === 0 ? 'scale-150 border-2 bg-yellow-500/20' : ''} transition-all duration-300`} />
                <div className={`absolute w-12 h-12 rounded-full border border-blue-500 ${isPlayingAnimation && activeAnimStep === 1 ? 'scale-125 border-2 bg-blue-500/20' : ''} transition-all duration-300`} />
                <div className={`absolute w-18 h-18 rounded-full border border-red-500 ${isPlayingAnimation && activeAnimStep === 2 ? 'scale-115 border-2 bg-red-500/20' : ''} transition-all duration-300`} />
                <div className={`absolute w-24 h-24 rounded-full border border-cyan-500 ${isPlayingAnimation && activeAnimStep === 3 ? 'scale-110 border-2 bg-cyan-500/20' : ''} transition-all duration-300`} />
                <div className={`absolute w-28 h-28 rounded-full border border-orange-500 ${isPlayingAnimation && activeAnimStep === 4 ? 'scale-105 border-2 bg-orange-500/20' : ''} transition-all duration-300`} />
                <div className={`absolute w-32 h-32 rounded-full border border-purple-500 ${isPlayingAnimation && activeAnimStep === 5 ? 'scale-100 border-2 bg-purple-500/20' : ''} transition-all duration-300`} />

                <span className="text-[9px] font-mono font-bold uppercase text-slate-400 z-10 bg-slate-900/80 px-2 py-0.5 rounded-md border border-slate-800">
                  {isPlayingAnimation ? `${activeAnimStep !== null ? activeAnimStep * 25 : 0} ms` : "STANDBY"}
                </span>
              </div>
              <p className="text-[9px] text-slate-500 font-bold uppercase">Cliquez sur "Simuler" ci-dessus pour lancer</p>
            </div>
          </div>

          {/* Quiz Section for Step 5 */}
          <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-4 shadow-xs">
            <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <HelpCircle className="w-4 h-4 text-[#b8860b]" />
              <p className="text-[11px] font-black uppercase text-slate-900 tracking-wider">
                Quiz d'Habilitation : Le Timing G3
              </p>
            </div>
            <p className="text-xs font-black text-slate-700 uppercase tracking-wide">
              Quel est le micro-retard (en millisecondes) théorique standard appliqué au Groupe d'Élargissement 3 (G3) ?
            </p>
            <div className="grid grid-cols-2 gap-2">
              {['0', '25', '75', '125'].map(opt => (
                <button
                  key={opt}
                  onClick={() => setStep5Q(opt)}
                  className={`p-3.5 rounded-xl text-xs font-black uppercase tracking-widest border transition-all cursor-pointer ${
                    step5Q === opt 
                      ? 'bg-amber-50/50 border-[#b8860b] text-[#b8860b] ring-1 ring-[#b8860b]/10' 
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {opt} ms
                </button>
              ))}
            </div>
            {step5Q && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className={`p-3 rounded-xl text-[10.5px] font-bold ${
                  step5Q === '75' 
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
                    : 'bg-rose-50 border border-rose-200 text-rose-800'
                }`}
              >
                {step5Q === '75' 
                  ? "✅ Parfait ! G0 = 0ms, G1 = 25ms, G2 = 50ms, G3 = 75ms. C'est l'ordre géométrique parfait." 
                  : "❌ Faux ! Rappelez-vous que G3 correspond au troisième groupe d'élargissement décalé à 75ms."}
              </motion.div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
