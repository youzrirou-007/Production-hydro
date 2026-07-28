import React from 'react';
import { motion } from 'motion/react';
import { ShieldAlert, CheckCircle2, ClipboardCheck, ArrowRight, HelpCircle } from 'lucide-react';

interface Step8Props {
  step8Form: {
    sector: string;
    shift: string;
    planned: string;
    real: string;
    cause: string;
    status: string;
    comment: string;
  };
  setStep8Form: React.Dispatch<React.SetStateAction<{
    sector: string;
    shift: string;
    planned: string;
    real: string;
    cause: string;
    status: string;
    comment: string;
  }>>;
  step8Submitted: boolean;
  setStep8Submitted: (val: boolean) => void;
  step8Q: string;
  setStep8Q: (val: string) => void;
  handleStep8Submit: (e: React.FormEvent) => void;
}

export const Step8FailedBlasts: React.FC<Step8Props> = ({
  step8Form,
  setStep8Form,
  step8Submitted,
  setStep8Submitted,
  step8Q,
  setStep8Q,
  handleStep8Submit
}) => {

  const hasMinimumCommentLength = step8Form.comment.trim().length >= 10;

  return (
    <div className="space-y-8" id="step8-workspace">
      <div>
        <p className="text-sm text-slate-600 leading-relaxed font-medium">
          Lorsqu'une anomalie majeure survient (comme l'avancement réel de 0.6m au lieu de 1.7m), vous devez impérativement rédiger et soumettre une <strong>Fiche de Volée Ratée (Failed Blast)</strong>.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Incident Form Column */}
        <div className="lg:col-span-7 space-y-4">
          <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2">
            <ShieldAlert className="w-5 h-5 text-rose-500" />
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-800">
              Déclaration Officielle de Volée Ratée (Formulaire)
            </h4>
          </div>

          {!step8Submitted ? (
            <form onSubmit={handleStep8Submit} className="bg-white border border-slate-200/80 rounded-3xl p-6 space-y-4 shadow-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Secteur */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Secteur Minière</label>
                  <select
                    value={step8Form.sector}
                    onChange={(e) => setStep8Form(prev => ({ ...prev, sector: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#b8860b]/20"
                  >
                    <option value="Imiter 1">Imiter 1</option>
                    <option value="Imiter 2">Imiter 2</option>
                    <option value="Imiter Est">Imiter Est</option>
                  </select>
                </div>

                {/* Poste */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Poste / Quart</label>
                  <select
                    value={step8Form.shift}
                    onChange={(e) => setStep8Form(prev => ({ ...prev, shift: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#b8860b]/20"
                  >
                    <option value="Poste 1">Poste 1 (Matin)</option>
                    <option value="Poste 2">Poste 2 (Après-midi)</option>
                    <option value="Poste 3">Poste 3 (Nuit)</option>
                  </select>
                </div>

                {/* Avancement planned */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Avancement Planifié (m)</label>
                  <input
                    type="text"
                    disabled
                    value={step8Form.planned}
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl p-3 text-xs font-mono font-bold text-slate-500 cursor-not-allowed"
                  />
                </div>

                {/* Avancement Réel */}
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Avancement Réel Enregistré (m)</label>
                  <input
                    type="text"
                    disabled
                    value={step8Form.real}
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl p-3 text-xs font-mono font-bold text-slate-500 cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Cause technique */}
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">Cause principale d'échec</label>
                <select
                  value={step8Form.cause}
                  onChange={(e) => setStep8Form(prev => ({ ...prev, cause: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#b8860b]/20"
                >
                  <option value="Taillant cassé">Taillant de forage cassé</option>
                  <option value="Coup soufflé (Bourrage)">Coup soufflé (Bourrage insuffisant)</option>
                  <option value="Pression gaz faible">Pression d'ANFO insuffisante</option>
                  <option value="Incohérence séquence">Mauvais couplage de séquence (ms)</option>
                </select>
              </div>

              {/* Commentaire de sécurité */}
              <div className="space-y-1">
                <div className="flex justify-between items-center">
                  <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                    Rapport de Sécurité & Actions Correctives
                  </label>
                  <span className={`text-[9px] font-black uppercase tracking-wider ${
                    hasMinimumCommentLength ? 'text-emerald-600' : 'text-rose-500'
                  }`}>
                    {step8Form.comment.length} / 10 car. min
                  </span>
                </div>
                <textarea
                  placeholder="Décrivez l'incident de manière technique (ex: Casse outil taillant, arrêt obligatoire, remplacement jumbo...)"
                  rows={4}
                  value={step8Form.comment}
                  onChange={(e) => setStep8Form(prev => ({ ...prev, comment: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-[#b8860b]/20 focus:bg-white transition-all resize-none font-sans font-medium text-slate-700"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={!hasMinimumCommentLength}
                  className="px-6 py-3 bg-[#b8860b] disabled:bg-slate-100 disabled:text-slate-400 disabled:border-slate-200 border border-[#b8860b] text-white font-black text-xs uppercase tracking-widest rounded-xl hover:bg-[#9a7209] transition-all cursor-pointer shadow-sm disabled:scale-100"
                >
                  Soumettre au Registre de Sécurité
                </button>
              </div>
            </form>
          ) : (
            // Breathtaking receipt certificate layout
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white border-2 border-dashed border-slate-300 rounded-3xl p-6 relative overflow-hidden shadow-md"
            >
              {/* Security stamp overlay */}
              <div className="absolute top-4 right-4 border-4 border-dashed border-emerald-600 text-emerald-600 text-[10px] font-black uppercase tracking-widest p-2 rounded-xl transform rotate-12 select-none">
                ENREGISTRÉ ✓ REGISTERED
              </div>

              <div className="space-y-4">
                <div className="border-b border-slate-100 pb-3 flex items-center gap-2">
                  <ClipboardCheck className="w-5 h-5 text-emerald-600" />
                  <div>
                    <h5 className="text-[10px] font-black uppercase text-slate-400 font-mono tracking-widest">SMI EXCELLENCE REGISTRY</h5>
                    <h4 className="text-xs font-black uppercase tracking-wide text-slate-900">Récépissé de Saisie de Sûreté</h4>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-[10.5px] font-mono leading-relaxed">
                  <div>
                    <span className="text-slate-400 block uppercase font-black text-[9px]">ID Volée</span>
                    <span className="font-bold text-slate-800">SMI-FAILED-0847B</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block uppercase font-black text-[9px]">Secteur</span>
                    <span className="font-bold text-slate-800 uppercase">{step8Form.sector}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block uppercase font-black text-[9px]">Poste</span>
                    <span className="font-bold text-slate-800 uppercase">{step8Form.shift}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block uppercase font-black text-[9px]">Perte Linéaire</span>
                    <span className="font-bold text-rose-600">-1.10 m (65% d'énergie perdue)</span>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200/60 p-3.5 rounded-xl">
                  <span className="text-slate-400 block uppercase font-mono font-black text-[8.5px]">Rapport technique enregistré :</span>
                  <p className="text-[11.5px] text-slate-700 font-sans font-medium italic mt-1 pl-2 border-l-2 border-[#b8860b]">
                    "{step8Form.comment}"
                  </p>
                </div>

                {/* Clean barcode */}
                <div className="pt-3 border-t border-slate-100 flex flex-col items-center justify-center space-y-1">
                  <svg className="w-48 h-8 opacity-75">
                    <rect x="0" width="4" height="32" fill="#0f172a" />
                    <rect x="8" width="2" height="32" fill="#0f172a" />
                    <rect x="14" width="6" height="32" fill="#0f172a" />
                    <rect x="24" width="2" height="32" fill="#0f172a" />
                    <rect x="30" width="4" height="32" fill="#0f172a" />
                    <rect x="38" width="8" height="32" fill="#0f172a" />
                    <rect x="50" width="2" height="32" fill="#0f172a" />
                    <rect x="56" width="4" height="32" fill="#0f172a" />
                    <rect x="64" width="6" height="32" fill="#0f172a" />
                    <rect x="74" width="2" height="32" fill="#0f172a" />
                    <rect x="80" width="10" height="32" fill="#0f172a" />
                    <rect x="94" width="4" height="32" fill="#0f172a" />
                    <rect x="102" width="2" height="32" fill="#0f172a" />
                    <rect x="108" width="6" height="32" fill="#0f172a" />
                    <rect x="118" width="4" height="32" fill="#0f172a" />
                    <rect x="126" width="8" height="32" fill="#0f172a" />
                    <rect x="138" width="2" height="32" fill="#0f172a" />
                    <rect x="144" width="4" height="32" fill="#0f172a" />
                    <rect x="152" width="6" height="32" fill="#0f172a" />
                    <rect x="162" width="2" height="32" fill="#0f172a" />
                    <rect x="168" width="10" height="32" fill="#0f172a" />
                    <rect x="182" width="4" height="32" fill="#0f172a" />
                  </svg>
                  <span className="text-[8px] font-mono text-slate-400 uppercase font-bold tracking-widest">SMI-SEC-INC-08472B</span>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Quiz column */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-50 border border-slate-200/80 rounded-3xl p-5 space-y-4">
            <h5 className="text-[10px] font-black uppercase tracking-widest text-[#b8860b]">
              Rappel du Processus de Contrôle
            </h5>
            <p className="text-[11.5px] text-slate-600 leading-relaxed font-medium">
              Toutes les fiches d'avancement ratées enregistrées sont directement accessibles aux ingénieurs topographes et directeurs via l'outil de gestion centralisé de la SMI.
            </p>
          </div>

          <div className={`bg-white border border-slate-200 rounded-3xl p-5 space-y-4 shadow-xs transition-all ${
            !step8Submitted ? 'opacity-50 pointer-events-none' : ''
          }`}>
            <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <HelpCircle className="w-4 h-4 text-[#b8860b]" />
              <p className="text-[11px] font-black uppercase text-slate-900 tracking-wider">
                Quiz d'Habilitation : Rapports d'Incident
              </p>
            </div>
            <p className="text-xs font-black text-slate-700 uppercase tracking-wide">
              Dans l'application principale de la SMI, via quel élément pouvez-vous accéder à l'historique complet de toutes ces fiches de volées ratées (Failed Blasts) ?
            </p>
            <div className="space-y-2.5">
              {[
                { val: 'header', label: 'Depuis le bandeau d\'aide supérieure' },
                { val: 'side', label: 'Depuis le menu latéral principal ("Volées Ratées")' },
                { val: 'profile', label: 'Uniquement depuis les paramètres administrateur' }
              ].map(opt => (
                <button
                  key={opt.val}
                  onClick={() => setStep8Q(opt.val)}
                  className={`w-full p-3.5 rounded-xl text-left text-xs font-bold border transition-all cursor-pointer ${
                    step8Q === opt.val 
                      ? 'bg-amber-50/50 border-[#b8860b] text-[#b8860b]' 
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            {step8Q && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className={`p-3 rounded-xl text-[10.5px] font-bold ${
                  step8Q === 'side' 
                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
                    : 'bg-rose-50 border border-rose-200 text-rose-800'
                }`}
              >
                {step8Q === 'side' 
                  ? "✅ Parfait ! Le menu latéral offre un lien direct vers la page 'Volées Ratées' permettant d'imprimer, éditer et analyser ces rapports d'incident." 
                  : "❌ Non ! Cet historique est directement accessible à tout moment dans la barre de navigation latérale de l'application."}
              </motion.div>
            )}
          </div>
        </div>

      </div>

      {/* Step Validation Banner */}
      {step8Submitted && step8Q === 'side' && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-5 rounded-3xl flex items-center gap-4 shadow-2xs"
        >
          <div className="p-2.5 bg-emerald-100 rounded-2xl text-emerald-600 shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h5 className="text-xs font-black uppercase tracking-wider">Habilitation Registre Incident Validée !</h5>
            <p className="text-[11px] text-emerald-700 font-semibold mt-0.5 leading-relaxed">
              Félicitations ! Vous maîtrisez la rédaction formelle d'une fiche d'incident et la traçabilité des volées ratées sous format administratif.
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
};
