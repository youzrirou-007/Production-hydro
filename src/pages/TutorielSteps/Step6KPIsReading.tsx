import React from 'react';
import { motion } from 'motion/react';
import { HelpCircle, CheckCircle2, AlertTriangle, Table, ClipboardCheck, ArrowRight, ShieldCheck } from 'lucide-react';

interface Step6Props {
  step6RowClicked: boolean;
  setStep6RowClicked: (val: boolean) => void;
  step6Q1: string;
  setStep6Q1: (val: string) => void;
  step6Q2: string;
  setStep6Q2: (val: string) => void;
}

export const Step6KPIsReading: React.FC<Step6Props> = ({
  step6RowClicked,
  setStep6RowClicked,
  step6Q1,
  setStep6Q1,
  step6Q2,
  setStep6Q2
}) => {

  const reportData = [
    { id: 1, sector: 'Imiter 2', shift: 'Poste 1 (Matin)', planned: '1.7 m', real: '1.7 m', anfo: '40 kg', ratio: '100%', status: 'optimal', comment: 'Rien à signaler. Cycle bouclé.' },
    { id: 2, sector: 'Imiter 1', shift: 'Poste 2 (Après-midi)', planned: '1.7 m', real: '1.6 m', anfo: '38 kg', ratio: '94%', status: 'excellent', comment: 'Légers culots en voûte.' },
    { id: 3, sector: 'Imiter 1', shift: 'Poste 1 (Matin)', planned: '1.7 m', real: '0.6 m', anfo: '15 kg', ratio: '35%', status: 'critical', comment: '⚠️ TAILLANT DE FORAGE CASSÉ EN FOND DE TROU' },
    { id: 4, sector: 'Imiter Est', shift: 'Poste 1 (Matin)', planned: '1.7 m', real: '1.7 m', anfo: '40 kg', ratio: '100%', status: 'optimal', comment: 'Rendement parfait.' }
  ];

  return (
    <div className="space-y-8" id="step6-workspace">
      <div>
        <p className="text-sm text-slate-600 leading-relaxed font-medium">
          En tant que secrétaire de chantier, vous êtes la première personne à voir le rapport journalier de production souterraine. 
          Vous devez apprendre à <strong>détecter instantanément l'incohérence ou la volée ratée (failed blast)</strong>.
        </p>
      </div>

      {/* Interactive Report Table Card */}
      <div className="border border-slate-200/80 rounded-2xl overflow-hidden shadow-md relative">
        <div className="bg-slate-900 p-3.5 text-white flex justify-between text-[10px] font-black uppercase tracking-widest font-mono">
          <span className="flex items-center gap-1.5"><Table className="w-4 h-4 text-[#b8860b]" /> Fiche Journalière de Production (Cliquer sur la ligne défectueuse) :</span>
          <span className="text-[#b8860b]">SMI HydroMines</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[10px] font-black uppercase tracking-wider text-slate-500 font-mono">
                <th className="p-4">Secteur</th>
                <th className="p-4">Quart / Poste</th>
                <th className="p-4">Avancement Cible</th>
                <th className="p-4 text-slate-900 font-black">Avancement Réel</th>
                <th className="p-4">Quantité ANFO</th>
                <th className="p-4">Rendement de Tir</th>
                <th className="p-4">Statut d'Habilitation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {reportData.map((row) => {
                const isCritical = row.status === 'critical';
                const isSelected = isCritical && step6RowClicked;

                let rowBg = 'bg-white hover:bg-slate-50/50';
                if (isCritical) {
                  rowBg = isSelected 
                    ? 'bg-rose-50/50 hover:bg-rose-100/50 border-y-2 border-rose-400 font-semibold' 
                    : 'bg-rose-50/20 hover:bg-rose-50/40 animate-pulse-slow font-medium';
                }

                return (
                  <tr
                    key={row.id}
                    onClick={() => {
                      if (isCritical) setStep6RowClicked(true);
                    }}
                    className={`cursor-pointer transition-all duration-200 ${rowBg}`}
                  >
                    <td className="p-4 font-bold text-slate-900 font-sans uppercase tracking-wider">{row.sector}</td>
                    <td className="p-4 text-slate-500 font-mono text-[11px]">{row.shift}</td>
                    <td className="p-4 font-mono text-slate-600">{row.planned}</td>
                    <td className={`p-4 font-mono font-bold ${isCritical ? 'text-rose-600 text-[13px]' : 'text-slate-800'}`}>{row.real}</td>
                    <td className="p-4 font-mono text-slate-600">{row.anfo}</td>
                    <td className={`p-4 font-mono font-bold ${isCritical ? 'text-rose-600' : 'text-emerald-600'}`}>{row.ratio}</td>
                    <td className="p-4">
                      {row.status === 'optimal' && (
                        <span className="px-2.5 py-1 text-[8.5px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-800 rounded-md border border-emerald-200">
                          Optimal
                        </span>
                      )}
                      {row.status === 'excellent' && (
                        <span className="px-2.5 py-1 text-[8.5px] font-black uppercase tracking-widest bg-blue-50 text-blue-800 rounded-md border border-blue-200">
                          Excellent
                        </span>
                      )}
                      {row.status === 'critical' && (
                        <span className="px-2.5 py-1 text-[8.5px] font-black uppercase tracking-widest bg-rose-100 text-rose-800 rounded-md border border-rose-300 inline-flex items-center gap-1">
                          ⚠️ ALERTE VOLÉE
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Diagnostic panel that reveals when clicked */}
      {step6RowClicked ? (
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-rose-50 border border-rose-200 rounded-3xl p-6 flex gap-4 items-start shadow-sm"
        >
          <div className="p-3 bg-rose-100 rounded-2xl text-rose-600 shrink-0">
            <AlertTriangle className="w-6 h-6 animate-pulse" />
          </div>
          <div className="space-y-1.5 flex-1">
            <span className="text-[8px] font-black uppercase tracking-widest bg-rose-600 text-white px-2 py-0.5 rounded-md">
              Diagnostic technique SMI
            </span>
            <h5 className="text-xs font-black uppercase text-rose-900 tracking-wider mt-1.5">
              Anomalie Détectée - Volée Ratée (Ligne 3)
            </h5>
            <p className="text-[11.5px] text-rose-800 leading-relaxed font-semibold">
              Exact ! Vous avez cliqué sur la ligne critique. Le planifié de forage était de <strong className="text-slate-900">1.7 m</strong>, mais l'avancement réel s'est arrêté à <strong className="text-rose-700 text-[13px]">0.6 m</strong>. 
              Il s'agit d'une perte d'exploitation gravissime d'un mètre linéaire due à une casse outil (taillant cassé). Vous devez déclarer cet incident immédiatement.
            </p>
          </div>
        </motion.div>
      ) : (
        <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl text-center text-slate-500 text-[10.5px] font-bold uppercase tracking-wider font-mono">
          🔎 Trouvez et cliquez sur la ligne du tableau qui présente une anomalie d'avancement gravissime pour continuer
        </div>
      )}

      {/* Quiz Section */}
      <div className={`bg-white border border-slate-200/85 rounded-3xl p-6 space-y-5 shadow-xs transition-all ${
        !step6RowClicked ? 'opacity-50 pointer-events-none' : ''
      }`}>
        <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-[#b8860b]" />
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-900">
            Quiz d'Habilitation : KPIs SMI
          </h4>
        </div>

        {/* Q1 */}
        <div className="space-y-3">
          <p className="text-[11.5px] font-black uppercase tracking-wide text-slate-700">
            Q1 : Quel est l'avancement cible planifié standard de la SMI pour chaque tir de galerie de 12m² ?
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {['0.6', '1.0', '1.7', '1.8'].map(val => (
              <button
                key={val}
                onClick={() => setStep6Q1(val)}
                className={`p-3.5 rounded-2xl text-xs font-black uppercase tracking-widest border transition-all cursor-pointer ${
                  step6Q1 === val 
                    ? 'bg-amber-50/50 border-[#b8860b] text-[#b8860b]' 
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {val} m
              </button>
            ))}
          </div>
          {step6Q1 && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className={`p-3 rounded-xl text-[10.5px] font-bold ${
                step6Q1 === '1.7' 
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
                  : 'bg-rose-50 border border-rose-200 text-rose-800'
              }`}
            >
              {step6Q1 === '1.7' 
                ? "✅ Correct ! La norme SMI prévoit toujours un avancement planifié de 1.7 m (par rapport à la tige de 1.8m)." 
                : "❌ Faux ! L'avancement nominal réglementaire est de 1.7 m de progression horizontale par volée."}
            </motion.div>
          )}
        </div>

        {/* Q2 */}
        <div className="space-y-3 pt-3 border-t border-slate-100">
          <p className="text-[11.5px] font-black uppercase tracking-wide text-slate-700">
            Q2 : Quelle est la charge d'ANFO (nitrate d'ammonium) standard consommée par un tir de 12m² conforme ?
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {['15', '25', '40', '60'].map(val => (
              <button
                key={val}
                onClick={() => setStep6Q2(val)}
                className={`p-3.5 rounded-2xl text-xs font-black uppercase tracking-widest border transition-all cursor-pointer ${
                  step6Q2 === val 
                    ? 'bg-amber-50/50 border-[#b8860b] text-[#b8860b]' 
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {val} kg
              </button>
            ))}
          </div>
          {step6Q2 && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className={`p-3 rounded-xl text-[10.5px] font-bold ${
                step6Q2 === '40' 
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
                  : 'bg-rose-50 border border-rose-200 text-rose-800'
              }`}
            >
              {step6Q2 === '40' 
                ? "✅ Correct ! La charge de calcul théorique moyenne réglementaire est de 40 kg d'ANFO injectés pneumatiquement." 
                : "❌ Faux ! La charge de référence standard est de 40 kg d'ANFO pour un patron de forage à 35 trous chargés."}
            </motion.div>
          )}
        </div>
      </div>

      {/* Step Validation Banner */}
      {step6RowClicked && step6Q1 === '1.7' && step6Q2 === '40' && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-5 rounded-3xl flex items-center gap-4 shadow-2xs"
        >
          <div className="p-2.5 bg-emerald-100 rounded-2xl text-emerald-600 shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h5 className="text-xs font-black uppercase tracking-wider">Habilitation KPIs Saisie Validée !</h5>
            <p className="text-[11px] text-emerald-700 font-semibold mt-0.5 leading-relaxed">
              Félicitations ! Vous savez analyser les données journalières de forage et repérer l'anomalie d'avancement ainsi que les métriques d'ANFO correspondantes.
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
};
