import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Map, 
  Activity, 
  HardHat, 
  ArrowRight, 
  Wrench, 
  Flame, 
  Sparkles, 
  Users, 
  Trophy, 
  CheckCircle,
  HelpCircle,
  ShieldCheck
} from 'lucide-react';

interface Step1Props {
  step1Started: boolean;
  setStep1Started: (val: boolean) => void;
  markStepComplete: (step: number) => void;
}

export const Step1Welcome: React.FC<Step1Props> = ({
  step1Started,
  setStep1Started,
  markStepComplete
}) => {
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [activeCycleIndex, setActiveCycleIndex] = useState<number | null>(null);

  const sectors = [
    {
      id: 'imiter1',
      name: 'Imiter 1',
      status: 'Production active',
      color: 'blue',
      desc: 'Zone historique d\'extraction à haute teneur en argent. Utilise des méthodes conventionnelles d\'abattage par tirs régulés.',
      tonnage: '320 t/jour',
      depth: '450m'
    },
    {
      id: 'imiter2',
      name: 'Imiter 2',
      status: 'Zone hautement mécanisée',
      color: 'emerald',
      desc: 'Secteur moderne équipé de jumbos de forage électro-hydrauliques et de chargeurs LHD à haute capacité.',
      tonnage: '580 t/jour',
      depth: '600m'
    },
    {
      id: 'imiter_est',
      name: 'Imiter Est',
      status: 'Nouveau front d\'expansion',
      color: 'amber',
      desc: 'Nouveau gisement en cours de traçage et d\'exploration géologique avancée. Forte concentration de filons d\'argent.',
      tonnage: '150 t/jour',
      depth: '300m'
    },
    {
      id: 'bure_est',
      name: 'Bure Imiter Est',
      status: 'Extraction verticale',
      color: 'rose',
      desc: 'Puits de remontée et de liaison verticale. Point clé pour le transit des stériles et du minerai noble vers l\'usine de traitement.',
      tonnage: 'Stériles & Minerais',
      depth: '520m'
    }
  ];

  const cycleSteps = [
    {
      id: 1,
      title: 'Forage',
      subtitle: 'Précision géométrique',
      icon: Wrench,
      desc: 'Forage des 38 trous à l\'aide du perforateur Montabert T23. Respect rigoureux du parallélisme pour éviter la déviation.',
      equipment: 'Jumbo Sandvik DT820C',
      safety: 'Vérification du toit et purge des blocs instables'
    },
    {
      id: 2,
      title: 'Chargement',
      subtitle: 'Dosage de l\'énergie',
      icon: Flame,
      desc: 'Introduction des cartouches de Tovex (dynamite de fond) et injection pneumatique du nitrate ANFO en colonne.',
      equipment: 'Chargeuse d\'Anfo Sika',
      safety: 'Interdiction de fumer, balisage strict de la zone'
    },
    {
      id: 3,
      title: 'Tir',
      subtitle: 'Séquence décalée',
      icon: Sparkles,
      desc: 'Détonation milliseconde contrôlée via détonateurs EXEL. La séquence débute au centre pour créer le vide d\'expansion.',
      equipment: 'Console d\'allumage centralisée',
      safety: 'Évacuation totale de la mine vers la surface'
    },
    {
      id: 4,
      title: 'Marinage',
      subtitle: 'Déblayage rapide',
      icon: Users,
      desc: 'Chargement et évacuation des blocs de roche abattus par le chargeur articulé bas profil (LHD) vers le puits d\'extraction.',
      equipment: 'Chargeuse LHD Sandvik LH517',
      safety: 'Arrosage du tas pour rabattre les poussières et les gaz'
    },
    {
      id: 5,
      title: 'Extraction',
      subtitle: 'Valorisation matière',
      icon: Trophy,
      desc: 'Remontée mécanique du minerai argentifère vers l\'usine métallurgique pour broyage, flottation et cyanuration.',
      equipment: 'Skips verticaux automatiques',
      safety: 'Inspections régulières des câbles et guides de cage'
    }
  ];

  return (
    <div className="space-y-8" id="step1-workspace">
      <div>
        <p className="text-sm text-slate-600 leading-relaxed font-medium">
          Bienvenue au sein du groupe <strong className="text-slate-900">Société Métallurgique d'Imiter (SMI)</strong>. 
          Ici, la traçabilité des cycles d'abattage de la roche est essentielle pour la sécurité de nos mineurs, la productivité et la pureté de l'argent extrait.
        </p>
      </div>

      {/* Interactive Sectors Map */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
          <Map className="w-4 h-4 text-[#b8860b]" />
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-800">
            Secteurs Opérationnels d'Imiter (Cliquez pour explorer)
          </h4>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {sectors.map((sector) => {
            const isSelected = selectedSector === sector.id;
            const borderColors: Record<string, string> = {
              blue: 'hover:border-blue-400 border-slate-200/80',
              emerald: 'hover:border-emerald-400 border-slate-200/80',
              amber: 'hover:border-amber-400 border-slate-200/80',
              rose: 'hover:border-rose-400 border-slate-200/80'
            };
            const activeBgColors: Record<string, string> = {
              blue: 'bg-blue-50/40 border-blue-400 ring-2 ring-blue-100',
              emerald: 'bg-emerald-50/40 border-emerald-400 ring-2 ring-emerald-100',
              amber: 'bg-amber-50/40 border-amber-400 ring-2 ring-amber-100',
              rose: 'bg-rose-50/40 border-rose-400 ring-2 ring-rose-100'
            };

            const textColors: Record<string, string> = {
              blue: 'text-blue-700',
              emerald: 'text-emerald-700',
              amber: 'text-amber-700',
              rose: 'text-rose-700'
            };

            const bulletColors: Record<string, string> = {
              blue: 'bg-blue-500',
              emerald: 'bg-emerald-500',
              amber: 'bg-amber-500',
              rose: 'bg-rose-500'
            };

            return (
              <div
                key={sector.id}
                onClick={() => setSelectedSector(isSelected ? null : sector.id)}
                className={`p-4 border rounded-2xl cursor-pointer transition-all duration-300 flex flex-col justify-between shadow-2xs group relative overflow-hidden ${
                  isSelected ? activeBgColors[sector.color] : `bg-white ${borderColors[sector.color]}`
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-black uppercase tracking-wider text-slate-900 group-hover:text-[#b8860b] transition-colors">
                      {sector.name}
                    </span>
                    <div className={`w-2 h-2 rounded-full ${bulletColors[sector.color]}`} />
                  </div>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">
                    {sector.status}
                  </p>
                </div>
                <div className="mt-4 flex items-center justify-between text-[10px] text-slate-400 font-medium">
                  <span>Prof. : {sector.depth}</span>
                  <span>{sector.tonnage}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Sector Details Drawer */}
        {selectedSector && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-50 border border-slate-150 rounded-2xl p-4 flex gap-4 items-start"
          >
            <div className="p-3 bg-white rounded-xl border border-slate-200/60 shadow-2xs text-[#b8860b]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <h5 className="text-[11px] font-black uppercase tracking-wider text-slate-900">
                Spécificités Techniques - {sectors.find(s => s.id === selectedSector)?.name}
              </h5>
              <p className="text-[11.5px] text-slate-600 leading-relaxed font-medium">
                {sectors.find(s => s.id === selectedSector)?.desc}
              </p>
            </div>
          </motion.div>
        )}
      </div>

      {/* Mining Cycle */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
          <Activity className="w-4 h-4 text-[#b8860b]" />
          <h4 className="text-xs font-black uppercase tracking-widest text-slate-800">
            Le Cycle de Production Souterraine (Horizontal)
          </h4>
        </div>

        <p className="text-[11px] text-slate-500 font-semibold uppercase tracking-wider">
          Cliquez sur chaque étape du cycle pour comprendre les contraintes techniques du front :
        </p>

        {/* Chevron style horizontal timeline */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          {cycleSteps.map((step, idx) => {
            const Icon = step.icon;
            const isActive = activeCycleIndex === idx;

            return (
              <div
                key={step.id}
                onClick={() => setActiveCycleIndex(isActive ? null : idx)}
                className={`p-4 border rounded-2xl cursor-pointer transition-all duration-300 text-center relative overflow-hidden flex flex-col justify-between ${
                  isActive 
                    ? 'bg-amber-50/50 border-[#b8860b] ring-1 ring-[#b8860b]/20 shadow-xs' 
                    : 'bg-white border-slate-200 hover:border-slate-350 hover:bg-slate-50/20'
                }`}
              >
                <div className="space-y-2">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center mx-auto transition-colors ${
                    isActive ? 'bg-[#b8860b] text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <h5 className="text-xs font-black uppercase tracking-wider text-slate-800">
                    {step.id}. {step.title}
                  </h5>
                  <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                    {step.subtitle}
                  </p>
                </div>

                <div className="mt-3 text-[10px] text-[#b8860b] font-bold uppercase tracking-widest flex items-center justify-center gap-0.5">
                  <span>Savoir plus</span>
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Cycle Step Details drawer */}
        {activeCycleIndex !== null && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-50 border border-slate-150 rounded-2xl p-5 grid grid-cols-1 md:grid-cols-3 gap-4"
          >
            <div className="md:col-span-2 space-y-1">
              <span className="text-[9px] font-black uppercase tracking-widest bg-slate-900 text-white px-2 py-0.5 rounded-md">
                Description de la tâche
              </span>
              <h5 className="text-xs font-black uppercase text-[#b8860b] tracking-wider mt-2">
                Étape {cycleSteps[activeCycleIndex].id} : {cycleSteps[activeCycleIndex].title}
              </h5>
              <p className="text-[11.5px] text-slate-600 leading-relaxed font-medium">
                {cycleSteps[activeCycleIndex].desc}
              </p>
            </div>
            <div className="bg-white border border-slate-200/60 p-3.5 rounded-xl space-y-2.5">
              <div>
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-400">Équipement type</span>
                <p className="text-[10px] font-bold text-slate-800 uppercase tracking-wide">
                  {cycleSteps[activeCycleIndex].equipment}
                </p>
              </div>
              <div className="border-t border-slate-100 pt-2">
                <span className="text-[8px] font-black uppercase tracking-widest text-rose-400">Consigne sécurité</span>
                <p className="text-[10px] font-bold text-rose-700 uppercase tracking-wide leading-tight">
                  ⚠️ {cycleSteps[activeCycleIndex].safety}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Role Summary with custom style */}
      <div className="bg-[#b8860b]/5 border border-[#b8860b]/20 rounded-3xl p-6 flex items-start gap-4">
        <div className="p-3 bg-[#b8860b]/15 rounded-2xl text-[#b8860b] shrink-0 mt-0.5 shadow-2xs">
          <HardHat className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
            Votre Mission de Secrétaire de Chantier :
          </h4>
          <p className="text-[11.5px] text-slate-600 mt-1 leading-relaxed font-medium">
            Vous n'êtes pas au fond de la mine, mais vous êtes <strong className="text-slate-950">le centre névralgique du contrôle technique</strong>. 
            C'est vous qui saisissez les fiches d'avancement, vérifiez la conformité des tirs, comparez le planifié au réel, et signalez immédiatement les anomalies directionnelles (failed blasts). 
            Sans votre rigueur de saisie, la direction pilote la mine à l'aveugle !
          </p>
        </div>
      </div>

      {/* Step Validation Button */}
      <div className="pt-4 flex justify-end">
        {!step1Started ? (
          <button
            onClick={() => {
              setStep1Started(true);
              markStepComplete(1);
            }}
            className="px-6 py-3 bg-[#b8860b] text-white hover:bg-[#9a7209] text-xs font-black uppercase tracking-widest rounded-xl transition-all flex items-center gap-2 shadow-sm cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
          >
            Commencer le parcours d'apprentissage <ArrowRight className="w-4 h-4" />
          </button>
        ) : (
          <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs uppercase tracking-wider bg-emerald-50 border border-emerald-200 px-5 py-3 rounded-xl shadow-2xs">
            <CheckCircle className="w-4 h-4" /> Étape 1 validée. Cliquez sur "Valider et continuer" ci-dessous !
          </div>
        )}
      </div>
    </div>
  );
};
