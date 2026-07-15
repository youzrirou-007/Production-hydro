import React, { useEffect } from 'react';
import { motion } from 'motion/react';
import { ClipboardCheck, CheckCircle2, ShieldCheck, ShieldAlert, HelpCircle, Eye } from 'lucide-react';

interface Step7Props {
  step7Checklist: {
    alignment: string;
    depth: string;
    tamping: string;
    tovex: string;
    sequence: string;
  };
  setStep7Checklist: React.Dispatch<React.SetStateAction<{
    alignment: string;
    depth: string;
    tamping: string;
    tovex: string;
    sequence: string;
  }>>;
  step7Incoherence: boolean;
  setStep7Incoherence: (val: boolean) => void;
  step7Q: string;
  setStep7Q: (val: string) => void;
  handleStep7Toggle: (key: 'alignment' | 'depth' | 'tamping' | 'tovex' | 'sequence', val: string) => void;
}

export const Step7ChecklistValidation: React.FC<Step7Props> = ({
  step7Checklist,
  setStep7Checklist,
  step7Incoherence,
  setStep7Incoherence,
  step7Q,
  setStep7Q,
  handleStep7Toggle
}) => {

  // Run integrity check whenever checklist changes
  useEffect(() => {
    const isMatched = 
      step7Checklist.alignment === 'CONFORME' &&
      step7Checklist.depth === 'CONFORME' &&
      step7Checklist.tamping === 'NON CONFORME' &&
      step7Checklist.tovex === 'CONFORME' &&
      step7Checklist.sequence === 'CONFORME';

    setStep7Incoherence(!isMatched);
  }, [step7Checklist, setStep7Incoherence]);

  const checklistItems = [
    { key: 'alignment' as const, label: 'Parallélisme & Alignement', desc: 'Déviation des trous inférieure à 2cm par mètre linéaire.' },
    { key: 'depth' as const, label: 'Profondeur de forage', desc: 'Longueur uniforme des trous mesurée à 1.80m ± 5cm.' },
    { key: 'tamping' as const, label: 'Longueur de bourrage (Clay)', desc: 'Vérification de la longueur de confinement d\'argile réglée à 76cm.' },
    { key: 'tovex' as const, label: 'Épaisseur Dynamite de Fond', desc: 'Présence effective d\'une cartouche Tovex en fond de chaque trou chargé.' },
    { key: 'sequence' as const, label: 'Séquence détonateurs Exel', desc: 'Respect du plan de tir décalé milliseconde de 0ms à 125ms.' }
  ];

  return (
    <div className="space-y-8" id="step7-workspace">
      <div>
        <p className="text-sm text-slate-600 leading-relaxed font-medium">
          Avant d'envoyer l'allumage final du tir, le chef de chantier remplit la <strong>fiche de conformité</strong>. 
          En tant que secrétaire de chantier, vous devez auditer cette fiche et isoler l'élément non conforme qui a provoqué la volée ratée.
        </p>
      </div>

      {/* Audit Workspace Dashboard */}
      <div className="bg-slate-50 border border-slate-200/85 rounded-3xl p-6 space-y-6 shadow-2xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <span className="text-xs font-black uppercase tracking-widest text-[#b8860b] flex items-center gap-1.5">
            <ClipboardCheck className="w-5 h-5" />
            Console d'Audit de Conformité (Détecter l'Anomalie)
          </span>
          <span className="text-[10px] bg-slate-900 text-white font-mono font-black uppercase tracking-wider px-2.5 py-1 rounded-md">
            Volée : Imiter 1 / Poste Matin
          </span>
        </div>

        <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider leading-relaxed">
          Un "coup soufflé" a été enregistré. Consigne de sécurité : Ajustez le statut de chaque critère ci-dessous pour localiser la cause racine :
        </p>

        {/* Custom Toggle Switch Grid */}
        <div className="space-y-3.5">
          {checklistItems.map((item) => {
            const isConforme = step7Checklist[item.key] === 'CONFORME';

            return (
              <div 
                key={item.key}
                className={`p-4 rounded-2xl border transition-all duration-300 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 shadow-3xs ${
                  isConforme 
                    ? 'bg-white border-slate-200 hover:border-slate-250' 
                    : 'bg-rose-50/50 border-rose-350'
                }`}
              >
                <div>
                  <h5 className="text-xs font-black uppercase tracking-wide text-slate-800 flex items-center gap-2">
                    {item.label}
                    {!isConforme && (
                      <span className="text-[8px] font-black uppercase tracking-widest bg-rose-600 text-white px-1.5 py-0.5 rounded-sm animate-pulse">
                        ANOMALIE CIBLE
                      </span>
                    )}
                  </h5>
                  <p className="text-[10.5px] text-slate-400 font-bold uppercase mt-0.5">{item.desc}</p>
                </div>

                {/* Styled toggle capsule */}
                <div className="flex bg-slate-100 rounded-xl p-1 shrink-0 select-none">
                  <button
                    onClick={() => handleStep7Toggle(item.key, 'CONFORME')}
                    className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      isConforme 
                        ? 'bg-emerald-600 text-white shadow-xs' 
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Conforme
                  </button>
                  <button
                    onClick={() => handleStep7Toggle(item.key, 'NON CONFORME')}
                    className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                      !isConforme 
                        ? 'bg-rose-600 text-white shadow-xs' 
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Non Conforme
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Real-time Integrity engine validator */}
        {!step7Incoherence ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-emerald-50 border border-emerald-200 p-5 rounded-2xl flex items-start gap-4"
          >
            <div className="p-2.5 bg-emerald-100 rounded-xl text-emerald-600 shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-widest text-emerald-800 block">✓ INTÉGRITÉ DE L'AUDIT VALIDÉE</span>
              <p className="text-[11px] text-emerald-700 font-semibold mt-1 leading-relaxed uppercase">
                Parfait ! Vous avez isolé que seule la "Longueur de bourrage (Clay)" est Non Conforme (car le bourrage d'argile n'était pas suffisant), tandis que toutes les autres opérations techniques étaient parfaites. C'est l'explication indiscutable du coup soufflé !
              </p>
            </div>
          </motion.div>
        ) : (
          <div className="bg-amber-500/5 border border-amber-500/15 p-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-[#b8860b] flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 animate-bounce" /> Saisie incorrecte ou incohérente : Le chef de chantier a indiqué que l'ANFO/Tovex étaient parfaits, seul le confinement d'argile a failli. Ajustez les boutons !
          </div>
        )}
      </div>

      {/* Role Responsibility Quiz */}
      <div className={`bg-white border border-slate-200 rounded-3xl p-6 space-y-4 shadow-xs transition-all ${
        step7Incoherence ? 'opacity-50 pointer-events-none' : ''
      }`}>
        <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2">
          <HelpCircle className="w-5 h-5 text-[#b8860b]" />
          <p className="text-xs font-black uppercase text-slate-900 tracking-widest">
            Quiz d'Habilitation : Validation de Signature
          </p>
        </div>
        <p className="text-[11.5px] font-black uppercase text-slate-700 tracking-wide">
          À qui revient la responsabilité administrative finale de valider et signer la fiche de conformité sur le chantier ?
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            { val: 'forg', label: 'Le mineur-perforateur au front de taille' },
            { val: 'sec', label: 'Le secrétaire de chantier (Aide topographe)' },
            { val: 'direct', label: 'Le Directeur d\'exploitation de la SMI' }
          ].map(item => (
            <label 
              key={item.val}
              className={`p-4 border rounded-2xl flex items-center gap-3 cursor-pointer text-xs font-black transition-all ${
                step7Q === item.val 
                  ? 'bg-amber-50/50 border-[#b8860b] text-[#b8860b] ring-1 ring-[#b8860b]/10' 
                  : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              <input 
                type="radio" 
                name="step7Q" 
                value={item.val}
                checked={step7Q === item.val}
                onChange={(e) => setStep7Q(e.target.value)}
                className="accent-[#b8860b] w-4 h-4 shrink-0"
              />
              <span>{item.label}</span>
            </label>
          ))}
        </div>
        {step7Q && (
          <motion.div 
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className={`p-3 rounded-xl text-xs font-bold ${
              step7Q === 'sec' 
                ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
                : 'bg-rose-50 border border-rose-200 text-rose-800'
            }`}
          >
            {step7Q === 'sec' 
              ? "✅ Correct ! C'est le Secrétaire de Chantier qui centralise, compile et valide administrativement les fiches d'avancement." 
              : "❌ Non ! Le secrétaire de chantier est le garant officiel de la saisie de conformité avant envoi en base de données."}
          </motion.div>
        )}
      </div>

      {/* Validation Banner */}
      {!step7Incoherence && step7Q === 'sec' && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-5 rounded-3xl flex items-center gap-4 shadow-2xs"
        >
          <div className="p-2.5 bg-emerald-100 rounded-2xl text-emerald-600 shrink-0">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h5 className="text-xs font-black uppercase tracking-wider">Habilitation Audit Fiches Validée !</h5>
            <p className="text-[11px] text-emerald-700 font-semibold mt-0.5 leading-relaxed">
              Félicitations ! Vous savez auditer une fiche de tir non conforme et localiser précisément la cause d'un coup soufflé d'argile.
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
};
