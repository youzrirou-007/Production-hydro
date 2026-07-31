import React, { useState } from 'react';
import { FormationSchemaViewer, FormationBlastStep } from './FormationSchemaViewer';
import type { GabaritType } from './types';
import { ChevronLeft, ChevronRight, X, ShieldAlert } from 'lucide-react';

interface Slide {
  kicker: string;
  title: string;
  body: string;
  safety?: string;
  highlightStep: FormationBlastStep;
  showSchema: boolean;
}

const SLIDES_12M2: Slide[] = [
  {
    kicker: 'FORMATION TECHNIQUE DE FORAGE',
    title: 'Galerie 12m² SMI',
    body: "Du premier trou foré au bourrage parfait.",
    highlightStep: 'tous', showSchema: false,
  },
  {
    kicker: 'POURQUOI CETTE FORMATION',
    title: 'Un mètre mal foré, c\'est un mètre perdu pour toujours.',
    body: "Rendement maximal, zéro incident. À la fin de cette formation, vous forerez avec la précision d'un ingénieur.",
    highlightStep: 'tous', showSchema: false,
  },
  {
    kicker: 'VUE D\'ENSEMBLE',
    title: 'Le gabarit dans son ensemble',
    body: "38 trous au total — 3 vides de dégagement, 35 trous chargés répartis en bouchon, 4 groupes, radier, parements et voûte. Chaque trou a sa place, son rôle, et son moment précis.",
    highlightStep: 'tous', showSchema: true,
  },
  {
    kicker: 'AVANT DE TOUCHER AU MARTEAU',
    title: 'Le matériel',
    body: "T23 Montabert, barres de forage 1,8m et 2,4m, taillant Ø38mm — jamais 75mm. Vérifiez l'état du taillant avant de commencer : un taillant usé, c'est un rendement qui ment.",
    safety: "Contrôle visuel de l'équipement obligatoire avant chaque poste.",
    highlightStep: 'tous', showSchema: false,
  },
  {
    kicker: 'LE RITUEL AVANT LE FORAGE',
    title: 'Aérage, arrosage, purge',
    body: "L'arrosage vient avant la purge — l'eau révèle les fissures que l'œil sec ne voit pas. On ne fore jamais un front qu'on n'a pas écouté.",
    safety: "Aucun forage ne commence sans ce triptyque complet.",
    highlightStep: 'tous', showSchema: false,
  },
  {
    kicker: 'ÉTAPE 1 — D0, 0ms',
    title: 'Le Bouchon',
    body: "Premier à détoner. Il crée le vide de dégagement vers lequel tout le reste de la volée va casser. Sans lui, rien d'autre ne peut fonctionner.",
    safety: "Vérifiez que les fils sont shuntés (torsadés) avant de forer les trous suivants — jamais de fil libre.",
    highlightStep: 'bouchon', showSchema: true,
  },
  {
    kicker: 'ÉTAPE 2 — D1, +25ms',
    title: 'Groupe 1',
    body: "25 millisecondes après le bouchon. Le premier anneau de trous qui élargit le vide créé.",
    highlightStep: 'g1', showSchema: true,
  },
  {
    kicker: 'ÉTAPE 3 — D2, +50ms',
    title: 'Groupe 2',
    body: "La cadence continue. Chaque groupe casse vers l'espace ouvert par le précédent.",
    highlightStep: 'g2', showSchema: true,
  },
  {
    kicker: 'ÉTAPE 4 — D3, +75ms',
    title: 'Groupe 3',
    body: "On élargit encore. La galerie prend forme, section après section.",
    highlightStep: 'g3', showSchema: true,
  },
  {
    kicker: 'ÉTAPE 5 — D4, +100ms',
    title: 'Groupe 4',
    body: "Le dernier groupe intérieur avant les surfaces définitives. Uniquement présent sur les gabarits 12m² — la section 9m² n'en a pas besoin, ce n'est pas un oubli.",
    highlightStep: 'g4', showSchema: true,
  },
  {
    kicker: 'ÉTAPE 6 — MÊME DÉLAI',
    title: 'Radier et parements',
    body: "Ils partent ensemble parce qu'ils définissent la forme finale de la galerie — le sol et les murs.",
    highlightStep: 'radier_parements', showSchema: true,
  },
  {
    kicker: 'ÉTAPE 7 — TOUJOURS EN DERNIER',
    title: 'La Voûte',
    body: "Jamais avant les autres. On casse vers une structure déjà allégée — ça réduit le risque de blocs en surplomb après le tir. Ce n'est pas une préférence, c'est une règle de sécurité.",
    safety: "La séquence voûte-en-dernier est non négociable, sur tous les gabarits, sans exception.",
    highlightStep: 'voute', showSchema: true,
  },
  {
    kicker: 'LE CHARGEMENT',
    title: 'ANFO et TOVEX',
    body: "La colonne ANFO remplit chaque trou chargé : longueur forée moins bourrage (76cm) moins TOVEX (15cm). Le TOVEX sert d'amorce dans TOUS les trous chargés — jamais seulement dans le bouchon.",
    highlightStep: 'tous', showSchema: true,
  },
  {
    kicker: 'LA CLÉ DU RENDEMENT',
    title: 'Le Bourrage',
    body: "Sans bourrage, le gaz de l'explosion s'échappe par le haut du trou avant d'avoir fracturé la roche — énergie perdue, mauvaise fragmentation. Avec 76cm d'argile bien tassée, l'énergie reste emprisonnée et travaille la roche jusqu'au bout.",
    safety: "20 fois le diamètre du trou, minimum — jamais moins.",
    highlightStep: 'tous', showSchema: false,
  },
  {
    kicker: 'DERNIER REGARD',
    title: 'La séquence complète',
    body: "Bouchon, G1, G2, G3, G4, radier et parements, puis la voûte. Vérification finale, évacuation, tir. C'est ainsi qu'on atteint 100% de rendement — pas par chance, par méthode.",
    highlightStep: 'tous', showSchema: true,
  },
];

const SLIDES_BY_GABARIT: Record<GabaritType, Slide[]> = {
  '12m2': SLIDES_12M2,
  '12m2_intl': SLIDES_12M2,
  '9m2': SLIDES_12M2,
  '9m2_intl': SLIDES_12M2,
};

export const FormationSlideDeck: React.FC<{ gabarit: GabaritType; onClose: () => void }> = ({ gabarit, onClose }) => {
  const [index, setIndex] = useState(0);
  const slides = SLIDES_BY_GABARIT[gabarit];
  const slide = slides[index];

  const next = () => setIndex(i => Math.min(i + 1, slides.length - 1));
  const prev = () => setIndex(i => Math.max(i - 1, 0));

  return (
    <div className="fixed inset-0 z-[400] bg-[#0f172a] flex flex-col">
      <div className="flex gap-1.5 px-6 pt-5">
        {slides.map((_, i) => (
          <div key={i} className="flex-1 h-1 rounded-full bg-slate-700 overflow-hidden">
            <div
              className="h-full bg-[#ffd700] transition-all duration-300"
              style={{ width: i < index ? '100%' : i === index ? '100%' : '0%' }}
            />
          </div>
        ))}
      </div>

      <button onClick={onClose} className="absolute top-5 right-6 text-slate-400 hover:text-white transition-colors cursor-pointer">
        <X className="w-6 h-6" />
      </button>

      <div className="flex-1 flex items-center justify-center px-6 lg:px-16 py-8">
        <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#ffd700] mb-3">{slide.kicker}</p>
            <h2 className="text-2xl lg:text-4xl font-black text-white tracking-tight mb-4">{slide.title}</h2>
            <p className="text-slate-300 text-[15px] leading-relaxed">{slide.body}</p>
            {slide.safety && (
              <div className="mt-5 flex items-start gap-2.5 bg-[#8B1A1A]/10 border border-[#8B1A1A]/30 rounded-xl p-3.5">
                <ShieldAlert className="w-4 h-4 text-[#e8626a] flex-shrink-0 mt-0.5" />
                <p className="text-[12px] text-[#ffb4b4]">{slide.safety}</p>
              </div>
            )}
          </div>
          {slide.showSchema && (
            <div className="h-64 lg:h-96">
              <FormationSchemaViewer gabarit={gabarit} highlightStep={slide.highlightStep} />
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between px-6 pb-8">
        <button onClick={prev} disabled={index === 0} className="flex items-center gap-1.5 text-slate-400 hover:text-white disabled:opacity-30 transition-colors text-[12px] font-bold uppercase tracking-wide cursor-pointer">
          <ChevronLeft className="w-4 h-4" /> Précédent
        </button>
        <span className="text-slate-500 text-[11px]">{index + 1} / {slides.length}</span>
        <button onClick={next} disabled={index === slides.length - 1} className="flex items-center gap-1.5 text-[#ffd700] hover:text-white disabled:opacity-30 transition-colors text-[12px] font-bold uppercase tracking-wide cursor-pointer">
          Suivant <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
