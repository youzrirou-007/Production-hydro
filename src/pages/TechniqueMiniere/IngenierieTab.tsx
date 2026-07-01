import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, Compass, Award, ShieldAlert, Check, HelpCircle, Activity, ArrowRight } from 'lucide-react';
import { QUIZ_DATA } from './data';

interface IngenierieTabProps {
  gabarit: '12m2' | '9m2';
}

export const IngenierieTab: React.FC<IngenierieTabProps> = ({ gabarit }) => {
  const is9m2 = gabarit === '9m2';

  const [subTab, setSubTab] = useState<'tiges' | 'ateliers' | 'examen'>('tiges');

  // "Tiges" Subtab State
  const [roundsPerMonth, setRoundsPerMonth] = useState<number>(24);

  // Examen States
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [score, setScore] = useState<number>(0);

  const handleAnswerSelect = (qId: number, optionIdx: number) => {
    if (isSubmitted) return;
    setSelectedAnswers((prev) => ({ ...prev, [qId]: optionIdx }));
  };

  const handleSubmitExam = () => {
    let finalScore = 0;
    QUIZ_DATA.forEach((q) => {
      if (selectedAnswers[q.id] === q.correctAnswer) {
        finalScore += 1;
      }
    });
    setScore(finalScore);
    setIsSubmitted(true);
  };

  const handleResetExam = () => {
    setSelectedAnswers({});
    setIsSubmitted(false);
    setScore(0);
  };

  // Math for Tiges Subtab
  const shortRodProgress = roundsPerMonth * 1.7; // 1.7m pulled per round
  const longRodProgress = roundsPerMonth * 2.3; // 2.3m pulled per round
  const shortRodPayout = shortRodProgress * 35; // 35 MAD per meter
  const longRodPayout = longRodProgress * 35;

  return (
    <div className="space-y-8 bg-white rounded-3xl p-6 border border-slate-100 shadow-xs">
      
      {/* SECTION HEADER */}
      <div className="border-b border-slate-100 pb-4">
        <span className="text-[10px] font-black uppercase text-amber-600 tracking-widest block">
          Académie d'Ingénierie Minière souterraine
        </span>
        <h2 className="text-xl font-black uppercase tracking-widest text-slate-900 mt-1">
          Espace de Perfectionnement Technique SMI
        </h2>
        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-0.5">
          Maîtrisez l'alignement des tirs, l'expansion pneumatique et passez l'examen final de certification
        </p>
      </div>

      {/* SUB-TABS SELECTOR */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-black uppercase tracking-widest pb-px">
        <button
          onClick={() => setSubTab('tiges')}
          className={`pb-4 border-b-2 transition-all ${
            subTab === 'tiges'
              ? 'border-amber-500 text-slate-950 font-black'
              : 'border-transparent text-slate-400 hover:text-slate-900'
          }`}
        >
          📈 Simulateur Tiges (1.8m vs 2.4m)
        </button>
        <button
          onClick={() => setSubTab('ateliers')}
          className={`pb-4 border-b-2 transition-all ${
            subTab === 'ateliers'
              ? 'border-amber-500 text-slate-950 font-black'
              : 'border-transparent text-slate-400 hover:text-slate-900'
          }`}
        >
          🛠️ Les 3 Ateliers Pratiques
        </button>
        <button
          onClick={() => setSubTab('examen')}
          className={`pb-4 border-b-2 transition-all ${
            subTab === 'examen'
              ? 'border-amber-500 text-slate-950 font-black'
              : 'border-transparent text-slate-400 hover:text-slate-900'
          }`}
        >
          🎓 Examen & Certificat
        </button>
      </div>

      {/* SUB-TABS CONTENT */}
      <div className="pt-2">
        <AnimatePresence mode="wait">
          
          {/* SUB-TAB 1 : TIGES SIMULATOR */}
          {subTab === 'tiges' && (
            <motion.div
              key="tiges"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="bg-slate-50 border border-slate-150 p-6 rounded-2xl grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-8 space-y-2">
                  <h3 className="text-sm font-black uppercase text-slate-800 tracking-tight">
                    Optimisation de l'équipement : Passez de la tige 1.8m à 2.4m
                  </h3>
                  <p className="text-xs text-slate-600 font-semibold leading-relaxed">
                    Le passage à des tiges coniques de 2.4 mètres permet de forer des trous plus profonds, ce qui augmente le volume de roche abattue par cycle de tir (avancement linéaire moyen de 2.30m par volée au lieu de 1.70m). Cela réduit le nombre d'allers-retours du matériel roulant, économise l'énergie d'aération de la galerie et décuple la prime d'avancement des mineurs.
                  </p>
                </div>
                
                {/* Cycles/Rounds Slider Input */}
                <div className="md:col-span-4 bg-white border border-slate-200 p-4 rounded-xl space-y-3 shadow-xs">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-600 uppercase">Volées par mois :</span>
                    <span className="font-mono font-black text-slate-950 bg-slate-100 px-2.5 py-0.5 rounded">
                      {roundsPerMonth} tirs
                    </span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="40"
                    step="1"
                    value={roundsPerMonth}
                    onChange={(e) => setRoundsPerMonth(parseInt(e.target.value))}
                    className="w-full accent-amber-500 bg-slate-200 h-2 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase">
                    <span>Min : 10 tirs</span>
                    <span>Max : 40 tirs</span>
                  </div>
                </div>
              </div>

              {/* SIMULATION RESULTS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* PANNEL SHORT TIGE */}
                <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4">
                  <div className="border-b border-slate-100 pb-2">
                    <span className="text-[9px] font-bold text-slate-400 uppercase">Équipement Actuel</span>
                    <h4 className="text-xs font-black uppercase text-slate-700">Tige Conique 1.8 m</h4>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Rendement d'arrachage :</span>
                      <span className="font-extrabold text-slate-800">1.70 m / volée</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Progression mensuelle :</span>
                      <span className="font-extrabold text-slate-900 font-mono">{shortRodProgress.toFixed(1)} m</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-slate-50">
                      <span className="text-slate-400">Prime d'avancement :</span>
                      <span className="font-black text-slate-950 font-mono">{shortRodPayout.toFixed(0)} MAD</span>
                    </div>
                  </div>
                </div>

                {/* PANNEL LONG TIGE */}
                <div className="bg-amber-400/5 border-2 border-amber-400/30 p-6 rounded-2xl space-y-4">
                  <div className="border-b border-amber-400/20 pb-2 flex items-center justify-between">
                    <div>
                      <span className="text-[9px] font-black text-amber-600 uppercase">Cible SMI</span>
                      <h4 className="text-xs font-black uppercase text-slate-900">Tige Conique 2.4 m</h4>
                    </div>
                    <span className="px-2 py-0.5 bg-amber-400 text-slate-950 text-[9px] font-black uppercase rounded">
                      RECOMMANDE
                    </span>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Rendement d'arrachage :</span>
                      <span className="font-extrabold text-slate-800">2.30 m / volée</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Progression mensuelle :</span>
                      <span className="font-extrabold text-slate-900 font-mono text-amber-600">{longRodProgress.toFixed(1)} m</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-slate-100">
                      <span className="text-slate-400">Prime d'avancement :</span>
                      <span className="font-black text-slate-950 font-mono text-lg">{longRodPayout.toFixed(0)} MAD</span>
                    </div>
                  </div>
                </div>

                {/* NET GAIN DISPLAY */}
                <div className="bg-slate-900 text-white p-6 rounded-2xl space-y-4 flex flex-col justify-between">
                  <div className="space-y-1">
                    <span className="text-[9px] font-black uppercase text-[#ffd700]">Gain Net de Rendement</span>
                    <h4 className="text-sm font-black uppercase text-white">ÉCART MENSUEL CRÉÉ</h4>
                  </div>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Avancement en plus :</span>
                      <span className="font-extrabold text-[#ffd700]">+{(longRodProgress - shortRodProgress).toFixed(1)} mètres</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Gain de prime / mineur :</span>
                      <span className="font-black text-[#ffd700] text-base">+{(longRodPayout - shortRodPayout).toFixed(0)} MAD / mois</span>
                    </div>
                  </div>
                  <div className="bg-slate-850 p-3 rounded-lg border border-slate-800 text-[10px] text-slate-300 font-semibold leading-relaxed uppercase">
                    🚀 Augmentez de 35% votre rendement sans forer plus de trous par front !
                  </div>
                </div>

              </div>
            </motion.div>
          )}

          {/* SUB-TAB 2 : THE 3 WORKSHOPS */}
          {subTab === 'ateliers' && (
            <motion.div
              key="ateliers"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-6"
            >
              {/* WORKSHOP 1 */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-base">
                    1
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase text-slate-400">Phase Forage</span>
                    <h4 className="text-xs font-black uppercase text-slate-900">Atelier Parallélisme & Calibrage</h4>
                  </div>
                  <p className="text-[11px] font-semibold text-slate-600 leading-relaxed">
                    Le mineur foreur doit utiliser les règles d'alignement télescopiques du jumbo ou du marteau à expansion. Les {is9m2 ? 28 : 38} trous doivent être parfaitement parallèles les uns aux autres. Une déviation d'angle supérieure à 5% augmente la ligne de moindre résistance (W) en fond de trou, empêchant le cisaillement de se produire, ce qui laisse des culots de plus de 40 cm.
                  </p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl">
                  <p className="text-[9.5px] font-black uppercase text-slate-800">Règle d'or forage :</p>
                  <p className="text-[10px] font-semibold text-slate-500 leading-relaxed mt-1">
                    Les trous de voûte doivent avoir un relèvement de 3% maximum pour assurer la clé de voûte sans créer de sur-profilage fragile.
                  </p>
                </div>
              </div>

              {/* WORKSHOP 2 */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-base">
                    2
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase text-slate-400">Phase Chargement</span>
                    <h4 className="text-xs font-black uppercase text-slate-900">Atelier Confinement & Énergie</h4>
                  </div>
                  <p className="text-[11px] font-semibold text-slate-600 leading-relaxed">
                    Avant de charger l'ANFO, chaque trou doit être nettoyé à l'aide d'une tige soufflante à air comprimé pour éliminer l'eau et les poussières de forage. La cartouche de Tovex (primer) contenant le détonateur électronique doit être tassée fermement au fond du trou. L'ANFO est ensuite injecté sous pression pneumatique uniforme à une densité constante de 0.85 g/cm³.
                  </p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl">
                  <p className="text-[9.5px] font-black uppercase text-slate-800">Règle d'or chargement :</p>
                  <p className="text-[10px] font-semibold text-slate-500 leading-relaxed mt-1">
                    Insérez un bourrage d'argile serré de 76 cm au col de chaque trou chargé pour sceller hermétiquement la détonation.
                  </p>
                </div>
              </div>

              {/* WORKSHOP 3 */}
              <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="w-10 h-10 bg-slate-900 text-white rounded-xl flex items-center justify-center font-black text-base">
                    3
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase text-slate-400">Phase Raccordement</span>
                    <h4 className="text-xs font-black uppercase text-slate-900">Atelier Séquençage Numérique</h4>
                  </div>
                  <p className="text-[11px] font-semibold text-slate-600 leading-relaxed">
                    Le boutefeu qualifié raccorde les {is9m2 ? '27' : '32 à 38'} détonateurs électroniques en série stricte à l'aide de connecteurs étanches à double bus. La résistance électrique de la ligne globale doit être mesurée à l'aide du consolateur numérique SMI en retrait de sécurité avant d'envoyer l'impulsion électrique codée finale de tir.
                  </p>
                </div>
                <div className="bg-slate-50 p-3 rounded-xl">
                  <p className="text-[9.5px] font-black uppercase text-slate-800">Règle d'or raccordement :</p>
                  <p className="text-[10px] font-semibold text-slate-500 leading-relaxed mt-1">
                    Vérifiez l'état des bus de câblage au col du trou. Tout câble pincé ou dénudé peut provoquer un raté d'allumage périphérique.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* SUB-TAB 3 : FINAL EXAM & TECHNICAL CERTIFICATION */}
          {subTab === 'examen' && (
            <motion.div
              key="examen"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-8"
            >
              
              {/* DESCRIPTION ACADEMY */}
              <div className="bg-slate-900 text-white rounded-2xl p-6 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1.5 max-w-2xl">
                  <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest block">
                    Validation des connaissances de forage & tir
                  </span>
                  <h3 className="text-base font-black uppercase text-white tracking-tight">
                    Examen d'Aptitude de Chef de Poste SMI Imiter
                  </h3>
                  <p className="text-[11px] font-semibold text-slate-300 leading-relaxed">
                    Cet examen évalue vos aptitudes sur la physique des explosifs, l'alignement géométrique, le bourrage des trous et les retards de séquence. Répondez correctement aux 5 questions techniques pour obtenir votre <strong>Brevet d'Aptitude d'Ingénierie de Volée SMI</strong>.
                  </p>
                </div>
                <div className="bg-slate-850 px-4 py-3 rounded-xl border border-slate-800 text-center shrink-0">
                  <p className="text-[9px] font-bold text-slate-400 uppercase">Aptitude minimale</p>
                  <p className="text-lg font-black text-amber-500">5 / 5 Correct</p>
                </div>
              </div>

              {/* QUESTIONS LIST */}
              <div className="space-y-6">
                {QUIZ_DATA.map((q, qIdx) => {
                  const isCorrect = selectedAnswers[q.id] === q.correctAnswer;
                  const isWrong = selectedAnswers[q.id] !== undefined && selectedAnswers[q.id] !== q.correctAnswer;

                  return (
                    <div key={q.id} className="bg-white border border-slate-200 rounded-xl p-5 space-y-3.5 shadow-xs">
                      <p className="text-xs font-black uppercase text-slate-800">
                        Question {qIdx + 1} : {q.question}
                      </p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                        {q.options.map((option, optIdx) => {
                          const isSelected = selectedAnswers[q.id] === optIdx;
                          let btnClass = "bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700";
                          
                          if (isSelected) {
                            btnClass = "bg-slate-950 border-slate-950 text-white";
                          }

                          if (isSubmitted) {
                            if (optIdx === q.correctAnswer) {
                              btnClass = "bg-emerald-500 border-emerald-500 text-white font-black";
                            } else if (isSelected) {
                              btnClass = "bg-rose-500 border-rose-500 text-white font-black";
                            } else {
                              btnClass = "bg-slate-50 border-slate-200 text-slate-400 opacity-50 cursor-not-allowed";
                            }
                          }

                          return (
                            <button
                              key={optIdx}
                              disabled={isSubmitted}
                              onClick={() => handleAnswerSelect(q.id, optIdx)}
                              className={`p-3 rounded-xl border text-left text-[11px] font-semibold transition-all flex items-start gap-2 ${btnClass}`}
                            >
                              <span className="font-bold uppercase text-[9px] bg-slate-200 text-slate-800 w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                                {String.fromCharCode(65 + optIdx)}
                              </span>
                              <span>{option}</span>
                            </button>
                          );
                        })}
                      </div>

                      {/* INDIVIDUAL EXPLANATION */}
                      {isSubmitted && (
                        <div className={`p-4 rounded-xl text-[10.5px] font-semibold leading-relaxed border ${
                          isCorrect ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'
                        }`}>
                          <p className="font-black uppercase mb-1 flex items-center gap-1.5">
                            {isCorrect ? '✓ Réponse Correcte' : '✗ Réponse Erronée'}
                          </p>
                          <p className="text-slate-600">{q.explanation}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* ACTION BUTTONS & CERTIFICATE AT THE BOTTOM */}
              <div className="pt-4 border-t border-slate-100 flex flex-col items-center justify-center space-y-6">
                
                {!isSubmitted ? (
                  <button
                    disabled={Object.keys(selectedAnswers).length < QUIZ_DATA.length}
                    onClick={handleSubmitExam}
                    className="px-8 py-3 bg-slate-950 hover:bg-black text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    SOUMETTRE MON EXAMEN TECHNIQUE
                  </button>
                ) : (
                  <div className="space-y-6 w-full max-w-2xl text-center">
                    
                    <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 text-xs font-semibold text-slate-700">
                      <p className="text-[10px] font-black uppercase text-slate-400">Résultat Examen</p>
                      <p className="text-xl font-black text-slate-900 mt-1">
                        Votre Score : <span className={score === 5 ? 'text-emerald-500' : 'text-rose-500'}>{score} / 5</span>
                      </p>
                      <p className="text-[10.5px] font-medium text-slate-500 leading-relaxed uppercase mt-0.5">
                        {score === 5 ? 'Félicitations ! Vous possédez une expertise technique solide.' : 'Nous vous suggérons de relire l\'onglet "Schéma" et "Bourrage" pour parfaire vos connaissances.'}
                      </p>
                    </div>

                    {/* RENDER THE MAJESTIC CERTIFICATE ONLY IF PERFECT SCORE */}
                    {score === 5 && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white border-4 border-double border-amber-400 rounded-3xl p-8 relative shadow-2xl flex flex-col justify-between h-[360px] mx-auto w-full max-w-xl text-center overflow-hidden"
                      >
                        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 to-amber-500" />
                        <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 to-amber-400" />

                        <div className="space-y-4">
                          <p className="text-[9px] font-black uppercase text-amber-600 tracking-widest">
                            SMI Imiter — Comité de Certification Souterraine
                          </p>
                          <h4 className="text-lg font-black uppercase text-slate-900 tracking-wider">
                            BREVET D'EXCELLENCE EN TIR CONTRÔLÉ
                          </h4>
                          <div className="h-px bg-slate-200 w-32 mx-auto" />
                        </div>

                        <div className="space-y-2">
                          <p className="text-[10.5px] font-semibold text-slate-600 leading-relaxed italic">
                            Le présent titre est décerné à un
                          </p>
                          <p className="text-base font-black text-slate-900 uppercase tracking-widest">
                            CHEF DE POSTE DE VOLÉE QUALIFIÉ
                          </p>
                          <p className="text-[10px] font-medium text-slate-500 leading-relaxed">
                            Pour avoir démontré une maîtrise absolue de la mécanique de cisaillement concentrique, de la physique de confinement des gaz (Formule Lb=20D) et du parallélisme de forage.
                          </p>
                        </div>

                        <div className="flex justify-between items-center text-[9px] font-bold text-slate-400 uppercase pt-4 border-t border-slate-100">
                          <div>
                            <p>Bureau de contrôle</p>
                            <p className="text-slate-800 font-extrabold mt-0.5">SMI Imiter</p>
                          </div>
                          <span className="w-8 h-8 rounded-full border-2 border-amber-400 flex items-center justify-center text-amber-500 font-black text-xs">SMI</span>
                          <div>
                            <p>Directeur Technique</p>
                            <p className="text-slate-800 font-extrabold mt-0.5">Hydromines S.A.</p>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    <div className="pt-2">
                      <button
                        onClick={handleResetExam}
                        className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg text-xs font-black uppercase tracking-wider transition-colors"
                      >
                        🔄 Recommencer l'examen
                      </button>
                    </div>

                  </div>
                )}

              </div>

            </motion.div>
          )}

        </AnimatePresence>
      </div>

    </div>
  );
};
