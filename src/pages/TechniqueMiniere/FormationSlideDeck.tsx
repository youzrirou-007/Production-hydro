import React, { useState, useEffect } from 'react';
import { FormationSchemaViewer, FormationBlastStep } from './FormationSchemaViewer';
import type { GabaritType } from './types';
import bannerExcellenceImg from '../../assets/images/Banner excellence.jpg';
import excellenceLogoImg from '../../assets/images/excellence_logo.png';
import { 
  ChevronLeft, ChevronRight, X, ShieldAlert, CheckCircle2, Award, 
  Sparkles, RotateCcw, FileText, Share2, Flame, Zap, 
  AlertTriangle, Gauge, Check, HelpCircle, Layers, Wrench, Eye,
  Maximize2, Minimize2, ListOrdered, BookOpen, ShieldCheck, Compass, Tv, Play
} from 'lucide-react';

export type ExtendedModuleType = GabaritType | 'explosifs' | 'securite' | 'diagnostic';

export interface SlideKeyMetric {
  label: string;
  value: string;
  unit?: string;
  subtext?: string;
}

export interface SlideQuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface Slide {
  kicker: string;
  title: string;
  body: string[];
  safety?: string;
  ruleOfArt?: string;
  expertTag?: string;
  metrics?: SlideKeyMetric[];
  highlightStep?: FormationBlastStep;
  showSchema?: boolean;
  schemaType?: GabaritType;
  quiz?: SlideQuizQuestion;
  type?: 'intro' | 'sommaire' | 'standard' | 'formula' | 'quiz' | 'synthesis';
}

// ==========================================
// 1. MODULE 12M² SMI — ENRICHED BY 5 EXPERTS
// ==========================================
const SLIDES_12M2: Slide[] = [
  {
    type: 'intro',
    kicker: 'SLIDE 01 — INTRODUCTION OFFICIELLE',
    title: 'Galerie 12m² SMI — Standard de Référence Imiter',
    expertTag: '🎓 Formateur Pédagogique & Direction Minière',
    body: [
      "Bienvenue dans la formation de niveau supérieur sur le gabarit 12m² SMI (section utile 3.8m × 3.5m). Ce cours constitue le standard absolu appliqué sur les chantiers de la Société Métallurgique d'Imiter.",
      "Conçu conjointement par 5 experts du secteur minier (Ingénieurs de forage, chimistes d'explosifs, responsables QHSE, géotechniciens et formateurs), ce module garantit un rendement net d'avancement de 98% sans dégradation du massif rocheux.",
      "Informations de chargement certifiées terrain : Chaque trou chargé reçoit 1 cartouche de TOVEX (100g). Seuls les 6 trous chargés du bouchon sont renforcés avec 2 cartouches de TOVEX (200g) pour vaincre le confinement triaxial maximal."
    ],
    metrics: [
      { label: 'Section Utile', value: '12', unit: 'm²' },
      { label: 'Nombre de Trous', value: '38', subtext: '3 Vides / 35 Chargés' },
      { label: 'TOVEX Bouchon', value: '2 × 100g', subtext: '200g par trou (6 trous)' },
      { label: 'TOVEX Autres Trous', value: '1 × 100g', subtext: '100g par trou (29 trous)' }
    ]
  },
  {
    type: 'sommaire',
    kicker: 'SLIDE 02 — SOMMAIRE INTERACTIF DE LA FORMATION',
    title: 'Table des Matières & Navigation Rapide',
    expertTag: '🎓 Concepteur Pédagogique',
    body: [
      "Utilisez ce sommaire pour naviguer à tout moment dans le cours ou diffuser une slide spécifique en réunion de chantier."
    ]
  },
  {
    kicker: 'EQUIPEMENT & OUTILLAGE',
    title: 'Spécifications Techniques du Train de Tige & Taillants',
    expertTag: '⚡ Expert Forage & Abattage',
    body: [
      "Le forage d'une galerie de 12m² exige un contrôle rigoureux du train de tige pneumatique ou hydraulique (Jumbo / Marteau Montabert T23).",
      "• Taillant Ø 38 mm à boutons carbure monobloc ou vissé pour les 35 trous chargés. Pour le vide central du bouchon, utilisez 3 trous de Ø 38 mm côte à côte ou alésés à Ø 75 mm.",
      "• Barres coniques H22 de 1,8m (longueur utile 1,7m) ou 2,4m (longueur utile 2,3m). Contrôlez l'usure de la jupe et le méplat des boutons : un taillant usé augmente la déviation de forage de 40%.",
      "• Alignement et guidage : L'angle de dépouille des parements est réglé strictement à 1,5° vers l'extérieur pour maintenir la largeur utile de 3,8m sans sur-profil."
    ],
    ruleOfArt: "Règle de l'Expert Forage : Utilisez un niveau à bulle ou un pointeur laser de glissière. 3 cm d'erreur de pointage au bouchon se traduisent par 50 cm de perte d'avancement !",
    metrics: [
      { label: 'Diamètre Taillant', value: '38', unit: 'mm' },
      { label: 'Pression Injection Eau', value: '5-8', unit: 'bar' },
      { label: 'Angle Dépouille Murs', value: '1.5', unit: '°' },
      { label: 'Tolérance Déviation', value: '< 2', unit: 'cm/m' }
    ]
  },
  {
    kicker: 'CONTRÔLE PRÉ-FORAGE QHSE',
    title: 'Le Triptyque Doré : Aérage, Arrosage, Purge Méthodique',
    expertTag: '🛡️ Expert QHSE & Sécurité Mine',
    body: [
      "Aucune opération de forage ne démarre sans la validation intégrale du triptyque de sécurité au front :",
      "1. AÉRAGE (Ventilation) : Assurez un débit d'air frais d'au moins 3 m³/s en bout de canard. Tolérance zéro pour le CO (> 20 ppm) et NO2 (> 3 ppm).",
      "2. ARROSAGE DU FRONT : Arrosez abondamment les parements, la voûte et le sol. L'eau abat la poussière de silice alvéolaire et révèle les micro-fissures et les culots masqués.",
      "3. PURGE DE ROCHE : Purge à la barre en aluminium rigide (2,5m / 3,5m) sous zone soutenue. Écoutez le son de la roche : un son métallique clair signifie roche saine ; un son mat/creux signale une écaille mortelle à tomber immédiatement !"
    ],
    safety: "Alerte Sécurité Non Négociable : Si vous décelez des culots de trous de la volée précédente, marquez-les à la peinture ROUGE FLUO. Ne touchez JAMAIS un culot avec un taillant !",
    metrics: [
      { label: 'Débit Aérage Min', value: '3.0', unit: 'm³/s' },
      { label: 'Seuil Max CO', value: '< 20', unit: 'ppm' },
      { label: 'Longueur Barre Purge', value: '2.5 - 3.5', unit: 'm' }
    ]
  },
  {
    kicker: 'PLAN DE TIR GLOBAL',
    title: 'Architecture & Répartition des 38 Trous',
    expertTag: '🎓 Concepteur & Expert Explosifs',
    body: [
      "Le schéma de tir SMI 12m² est structuré en 7 sous-ensembles géométriques étagés dans le temps :",
      "• 3 Vides Centraux (non chargés) + 6 Trous de Bouchon (détonation D0 à 0ms - Double TOVEX 200g).",
      "• 4 Trous Groupe 1 (D1 à +25ms - TOVEX 100g) — Premier carré d'expansion.",
      "• 4 Trous Groupe 2 (D2 à +50ms - TOVEX 100g) — Deuxième carré d'expansion.",
      "• 4 Trous Groupe 3 (D3 à +75ms - TOVEX 100g) — Troisième carré d'expansion.",
      "• 4 Trous Groupe 4 (D4 à +100ms - TOVEX 100g) — Zone tampon avant contour.",
      "• 4 Trous de Radier + 6 Trous de Parements (D4/D5 à +100/125ms - TOVEX 100g).",
      "• 3 Trous de Voûte (D5 à +125ms en DERNIER - TOVEX 100g) — Découpe doux de sécurité."
    ],
    showSchema: true,
    highlightStep: 'tous',
    schemaType: '12m2'
  },
  {
    kicker: 'BOUCHON BRÛLÉ D0 (0 ms)',
    title: 'Le Bouchon Brûlé : Cœur & Libération (2 Cartouches TOVEX 200g)',
    expertTag: '⚡ Expert Forage & Chimiste Explosifs',
    body: [
      "Le bouchon à 3 vides d'expansion centraux est l'épicentre du tir. Détonant à 0 ms (instantané), ses 6 trous chargés au TOVEX (2 cartouches de 100g = 200g par trou) + ANFO brisent la roche vers le vide des 3 trous non chargés.",
      "Raison Scientifique du Renforcement (2 Cartouches de 100g au Bouchon) :",
      "1. Confinement Triaxial Extrême : Au bouchon, le massif est vierge et enserré sans surface libre latérale. La résistance au cisaillage est à son maximum absolu.",
      "2. Énergie d'Onde de Choc Doublée : La VOD du TOVEX (4 800 m/s) fournit une impulsion d'impédance élevée qui initie instantanément l'ANFO au régime de détonation idéal (> 10 GPa). 2 cartouches (200g) garantissent le cisaillement du fond de trou sans risque de fusage ou de raté.",
      "3. Pour tous les 29 autres trous de la volée, le massif étant déconfiné par la cavité du bouchon, 1 seule cartouche (100g) suffit amplement."
    ],
    showSchema: true,
    highlightStep: 'bouchon',
    schemaType: '12m2',
    ruleOfArt: "Règle Scientifique de l'Ingénieur : Insérez les 2 cartouches de TOVEX 100g bord à bord au fond du trou de bouchon avec le détonateur noyé dans la première cartouche orienté vers l'embouchure.",
    metrics: [
      { label: 'Trous Vides Centraux', value: '3', unit: 'Ø 38mm' },
      { label: 'Trous Chargés Bouchon', value: '6', unit: '0 ms (D0)' },
      { label: 'TOVEX par Trou Bouchon', value: '2', unit: 'cartouches (200g)' },
      { label: 'Total TOVEX Bouchon', value: '1.20', unit: 'kg (12 cartouches)' }
    ]
  },
  {
    kicker: 'EXPANSION GROUPE 1 (D1 +25 ms)',
    title: 'Premier Carré d\'Élargissement (G1 - 1 Cartouche TOVEX 100g)',
    expertTag: '🪨 Expert Géotechnique & Mécanique des Roches',
    body: [
      "25 millisecondes après l'explosion du bouchon, la cavité centrale est entièrement ouverte et vidée de sa roche.",
      "Les 4 trous du Groupe 1 détachent un prisme rectangulaire vers le vide central en diagonale. La distance de fardeau (burden $B$) est calculée à $B = 0.45 \text{ m}$.",
      "Chargement G1 : 1 seule cartouche de TOVEX 100g au fond du trou suffit car la roche dispose désormais d'une surface libre dégagée vers le bouchon."
    ],
    showSchema: true,
    highlightStep: 'g1',
    schemaType: '12m2'
  },
  {
    kicker: 'EXPANSION GROUPE 2 (D2 +50 ms)',
    title: 'Deuxième Carré d\'Élargissement (G2 - 1 Cartouche TOVEX 100g)',
    expertTag: '🪨 Expert Géotechnique',
    body: [
      "À +50 ms, le Groupe 2 prend le relais. Il détruit les coins et élargit la cavité ouverte à une section carrée d'environ $1.6\text{m} \times 1.6\text{m}$.",
      "À ce stade, la roche est abattue avec une très faible consommation spécifique d'énergie car la surface libre est désormais large. Amorçage par 1 cartouche de TOVEX 100g."
    ],
    showSchema: true,
    highlightStep: 'g2',
    schemaType: '12m2'
  },
  {
    kicker: 'EXPANSION GROUPE 3 & 4 (D3/D4)',
    title: 'Groupes 3 et 4 : Progression Vers le Profil (1 Cartouche TOVEX 100g)',
    expertTag: '⚡ Expert Forage & Abattage',
    body: [
      "• Groupe 3 (+75 ms) : Élargit la cavité aux dimensions $2.4\text{m} \times 2.4\text{m}$.",
      "• Groupe 4 (+100 ms) : Agit comme une couronne tampon. Il soulage la charge de massif que devront abattre les trous de parements et de radier.",
      "Le Groupe 4 garantit que les trous périphériques n'auront à cisailler qu'une bande de roche contrôlée de 50 cm d'épaisseur. Amorçage standard : 1 cartouche TOVEX (100g) par trou."
    ],
    showSchema: true,
    highlightStep: 'g4',
    schemaType: '12m2'
  },
  {
    kicker: 'PROFILAGE RADIER & PAREMENTS',
    title: 'Découpe du Radier (Sole) et des Parements (Murs)',
    expertTag: '⚡ Expert Forage & Abattage',
    body: [
      "• Trous de Radier (4 trous) : Forés avec un piqué (angle vers le bas) de 3° à 5° afin de former une sole parfaitement plate sans 'pattes' ni ressauts qui détruiraient les pneus des chargeuses LHD. Amorçage : 1 cartouche TOVEX 100g.",
      "• Trous de Parements (6 trous) : Forés avec une dépouille de 1.5° vers l'extérieur. Leur détonation à +100ms / +125ms détache les murs verticaux droits de la galerie. Amorçage : 1 cartouche TOVEX 100g."
    ],
    showSchema: true,
    highlightStep: 'radier_parements',
    schemaType: '12m2'
  },
  {
    kicker: 'DÉCOUPE DOUX DE VOÛTE (D5 +125 ms)',
    title: 'La Voûte : Découpe de Sécurité & Profil Auto-Portant',
    expertTag: '🪨 Expert Géotechnique & Sécurité',
    body: [
      "Principe Fondamental : Les 3 trous de Voûte détonent TOUJOURS en tout dernier délai (D5, +125 ms) avec 1 cartouche de TOVEX 100g.",
      "Explication Physique : En détonant après l'évacuation totale de la roche sous-jacente, la charge casse vers un espace entièrement dégagé. Les gaz s'échappent sans exercer de sur-pression vers le haut.",
      "Résultat : Le toit conserve une forme en arc ogival lisse, préservant la voûte naturelle de décharge du massif rocheux et réduisant les besoins en boulonnage de 50%."
    ],
    showSchema: true,
    highlightStep: 'voute',
    schemaType: '12m2',
    safety: "Interdiction absolue de faire détoner la voûte avant ou en même temps que les autres trous !"
  },
  {
    kicker: 'DOSAGE EXPLOSIFS & BOURRAGE',
    title: 'Plan de Chargement ANFO, TOVEX Certifié (100g & 200g) & Bourrage',
    expertTag: '💣 Expert Explosifs & Chimiste',
    body: [
      "Formulation scientifique certifiée terrain pour une volée SMI 12m² (35 trous chargés) :",
      "1. TOVEX Bouchon (6 trous chargés) : 2 cartouches de 100g par trou (soit 200g par trou) = 1.20 kg (12 cartouches). Nécessaire pour surmonter le confinement triaxial maximal au cœur du massif.",
      "2. TOVEX Autres Trous (29 trous chargés) : 1 seule cartouche de 100g par trou = 2.90 kg (29 cartouches). Massif déconfiné, l'amorce de 100g suffit pour initier l'ANFO.",
      "3. TOTAL TOVEX VOLÉE : 41 cartouches de 100g = 4.10 kg de TOVEX.",
      "4. ANFO (Nitrate-Fioul) : Injecté pneumatiquement à 5 bar (~1.05 kg par trou = ~36.75 kg sur la volée).",
      "5. Bourrage Rétenteur Réglé : $L_{\text{bourrage}} = 20 \times \emptyset_{\text{trou}} = 20 \times 38\text{ mm} = 76\text{ cm}$ d'argile compactée à l'embouchure."
    ],
    ruleOfArt: "Règle de l'Expert Explosifs : Le doublement du TOVEX à 200g au bouchon garantit une impulsion de détéctation > 10 GPa en zone de fort confinement. Le bourrage de 76 cm emprisonne les 10 000 bars de pression.",
    metrics: [
      { label: 'Total Cartouches TOVEX', value: '41', unit: 'cartouches 100g' },
      { label: 'Masse TOVEX Volée', value: '4.10', unit: 'kg' },
      { label: 'Masse ANFO Volée', value: '36.75', unit: 'kg' },
      { label: 'Longueur Bourrage', value: '76', unit: 'cm (20 × D)' }
    ]
  },
  {
    type: 'quiz',
    kicker: 'SLIDE 13 — TEST DE VALIDATION',
    title: 'Évaluation des Connaissances : Galerie 12m² SMI',
    expertTag: '🎓 Formateur Pédagogique',
    body: ["Testez votre compréhension technique du plan de tir SMI 12m²."],
    quiz: {
      question: "Pourquoi les 6 trous chargés du bouchon reçoivent-ils 2 cartouches de TOVEX 100g (200g total) alors que les 29 autres trous n'en reçoivent qu'une seule (100g) ?",
      options: [
        "Parce que les trous de bouchon sont forés avec un taillant deux fois plus grand",
        "Pour surmonter le confinement triaxial maximal du massif vierge et fournir l'onde de choc (VOD 4800 m/s) nécessaire au cisaillement du prisme sans raté",
        "Pour réduire le bruit de l'explosion perçu à la surface de la mine",
        "Parce que les cartouches de 100g s'évaporent au bout de 5 minutes dans le bouchon"
      ],
      correctAnswer: 1,
      explanation: "Au bouchon, la roche est confinée sans surface libre. 2 cartouches (200g) de TOVEX haute brisance sont indispensables pour surmonter le confinement triaxial et initier l'ANFO au régime de détonation idéal."
    }
  },
  {
    type: 'synthesis',
    kicker: 'SLIDE 14 — FICHE MÉMOTECHNIQUE',
    title: 'Aide-Mémoire de Terrain SMI 12m²',
    expertTag: '🎓 Synthèse Générale des 5 Experts',
    body: [
      "• SECTION & TROUS : 12 m² | 38 trous total (3 Vides, 35 Chargés)",
      "• BOUCHON : 3 Vides centraux alignés + 6 Chargés détonant à 0ms (D0)",
      "• TOVEX BOUCHON : 2 Cartouches de 100g (200g/trou) pour 6 trous chargés (1.20 kg)",
      "• TOVEX AUTRES TROUS : 1 Cartouche de 100g (100g/trou) pour 29 trous (2.90 kg)",
      "• TOTAL EXPLOSIFS : 4.10 kg TOVEX (41 cartouches 100g) + 36.75 kg ANFO",
      "• SÉQUENCE : Bouchon D0 (0ms) → G1 (25ms) → G2 (50ms) → G3 (75ms) → G4 (100ms) → Radier/Parements (100-125ms) → Voûte D5 (125ms)",
      "• BOURRAGE : 76 cm d'argile tassée obligatoire (Formule 20 × D)",
      "• SÉCURITÉ CULOTS : Interdiction de forer dans un culot. Marquage fluo et distance ≥ 20 cm !"
    ]
  }
];

// ==========================================
// 2. MODULE 12M² INTERNATIONAL (LANGEFORS)
// ==========================================
const SLIDES_12M2_INTL: Slide[] = [
  {
    type: 'intro',
    kicker: 'SLIDE 01 — STANDARD INTERNATIONAL',
    title: 'Galerie 12m² International — Langefors-Kihlström',
    expertTag: '🎓 Formateur & Ingénieur Suédois',
    body: [
      "Le standard international 12m² s'appuie sur la théorie de la détonation de Langefors & Kihlström (École Suédoise des Mines).",
      "Conçu spécifiquement pour les roches à très haute résistance mécanique (compressibilité $> 180\text{ MPa}$, quartzites, basates dures), il utilise un bouchon élargi à 6 trous vides centraux.",
      "Ce module décortique la géométrie d'expansion et les équations de burden pour garantir un tir réussi même sous confinement extrême."
    ],
    metrics: [
      { label: 'Méthode', value: 'Langefors', subtext: 'Standard Suédois 1963' },
      { label: 'Trous Vides', value: '6', subtext: 'Ratio Expansion 2:1' },
      { label: 'Résistance Roche', value: '> 180', unit: 'MPa' }
    ]
  },
  {
    type: 'sommaire',
    kicker: 'SLIDE 02 — SOMMAIRE INTERACTIF',
    title: 'Table des Matières : Standard International 12m²',
    expertTag: '🎓 Concepteur Pédagogique',
    body: ["Cliquez sur une slide pour y accéder directement pendant votre présentation."]
  },
  {
    kicker: 'BOUCHON À 6 TROUS VIDES',
    title: 'Le Bouchon Suédois Langefors à Double Colonne',
    expertTag: '⚡ Expert Forage & Abattage',
    body: [
      "Dans les massifs très durs, le prisme de roche brisée au bouchon a tendance à foisonner fortement et se re-compacter sur lui-même ('effet bouchon soudé').",
      "La solution Langefors consiste à aligner 6 trous vides centraux de Ø 38 mm (ou 2 gros trous d'alésage Ø 102 mm) disposés en 2 colonnes verticales parallèles.",
      "3 trous chargés centraux détonent à 0 ms. Le ratio de volume libre est multiplié par 2 par rapport à un bouchon classique, garantissant une projection fluide."
    ],
    showSchema: true,
    highlightStep: 'bouchon',
    schemaType: '12m2_intl',
    metrics: [
      { label: 'Nombre Trous Vides', value: '6', unit: 'Ø 38mm' },
      { label: 'Ratio de Vide', value: '2.1', subtext: 'Volume libre / chargé' },
      { label: 'Foisonnement Max', value: '+50%', subtext: 'Espace d\'expansion' }
    ]
  },
  {
    kicker: 'SÉQUENCE DE CHRONO-AMORÇAGE',
    title: 'Micro-Intervalle Court-Délai International',
    expertTag: '💣 Expert Explosifs',
    body: [
      "Le plan de tir Langefors utilise des détonateurs à retard très précis (série MS) :",
      "1. Bouchon Central : 0 ms (D0)",
      "2. Premier Carré d'Expansion : 25 ms (D1)",
      "3. Deuxième Carré : 50 ms (D2)",
      "4. Troisième Carré : 75 ms (D3)",
      "5. Trous du Contour & Voûte : 100 à 125 ms (D4/D5)"
    ],
    showSchema: true,
    highlightStep: 'tous',
    schemaType: '12m2_intl'
  },
  {
    type: 'quiz',
    kicker: 'TEST DE VALIDATION',
    title: 'Évaluation : Standard International 12m²',
    expertTag: '🎓 Formateur Pédagogique',
    body: ["Validez vos connaissances sur le schéma Langefors."],
    quiz: {
      question: "Pourquoi le schéma Langefors préconise-t-il 6 trous vides centraux dans les roches très dures (> 180 MPa) ?",
      options: [
        "Pour réduire le coût global d'achat des détonateurs",
        "Afin de fournir un volume libre suffisant pour empêcher la re-compaction du prisme de roche cisaillé",
        "Pour diminuer la poussière de forage au front",
        "Pour accélérer la vitesse de rotation de la glissière du Jumbo"
      ],
      correctAnswer: 1,
      explanation: "En roche très dure, le foisonnement de la roche brisée nécessite un grand volume libre. 6 trous vides offrent un ratio 2:1 empêchant le resoudage de la roche cisaillée."
    }
  }
];

// ==========================================
// 3. MODULE 9M² TRAÇAGE ÉTROIT
// ==========================================
const SLIDES_9M2: Slide[] = [
  {
    type: 'intro',
    kicker: 'SLIDE 01 — TRAÇAGE ÉTROIT',
    title: 'Galerie & Traçage 9m² SMI (28 Trous)',
    expertTag: '🎓 Formateur & Direction Minière',
    body: [
      "Le traçage 9m² (3.0m × 3.0m) est le profil d'avancement rapide privilégié pour les sous-niveaux d'exploitation et galeries de recoupement.",
      "Optimisé avec seulement 28 trous au total (1 vide / 27 chargés), ce schéma réduit la durée de forage par volée de 35 minutes par rapport au 12m², tout en conservant un avancement net de 1.7m.",
      "Découvrez la suppression stratégique du Groupe 4 et l'ajustement du bouchon compact."
    ],
    metrics: [
      { label: 'Section Utile', value: '9', unit: 'm²' },
      { label: 'Nombre de Trous', value: '28', subtext: '1 Vide / 27 Chargés' },
      { label: 'Gain Temps Forage', value: '-35', unit: 'min / volée' }
    ]
  },
  {
    type: 'sommaire',
    kicker: 'SLIDE 02 — SOMMAIRE INTERACTIF',
    title: 'Table des Matières : Traçage 9m²',
    expertTag: '🎓 Concepteur Pédagogique',
    body: ["Selectionnez la slide souhaitée pour une présentation ciblée."]
  },
  {
    kicker: 'OPTIMISATION SPATIALE',
    title: 'Suppression du Groupe 4 & Architecture Économique',
    expertTag: '⚡ Expert Forage & Abattage',
    body: [
      "En section 9m², la distance entre le centre du front et les parois est réduite de 40 cm par rapport à une galerie 12m².",
      "Par conséquent, le Groupe 4 est totalement inutile : le Groupe 3 (+75 ms) dégage directement le volume nécessaire avant le tir du contour (parements, radier et voûte).",
      "Économie par volée : 10 trous de forage en moins, 10 détonateurs économisés et 11 kg d'explosif épargnés."
    ],
    showSchema: true,
    highlightStep: 'g3',
    schemaType: '9m2'
  },
  {
    type: 'quiz',
    kicker: 'TEST DE VALIDATION',
    title: 'Évaluation : Traçage 9m²',
    expertTag: '🎓 Formateur Pédagogique',
    body: ["Testez vos connaissances sur le schéma 9m²."],
    quiz: {
      question: "Quelle est la raison principale de l'absence du Groupe 4 dans le schéma de tir 9m² ?",
      options: [
        "Un oubli lors de la rédaction de la fiche technique",
        "La distance réduite au contour permet au Groupe 3 de libérer la roche sans étape tampon intermédiaire",
        "Les marteaux pneumatiques ne peuvent pas forer plus de 3 groupes",
        "Pour éviter de trop chauffer le canard d'aérage"
      ],
      correctAnswer: 1,
      explanation: "En section 9m² (3.0m x 3.0m), la géométrie réduite permet d'atteindre les parements et le toit directement depuis le Groupe 3 sans sur-forage."
    }
  }
];

// ==========================================
// 4. MODULE INGÉNIERIE DES EXPLOSIFS
// ==========================================
const SLIDES_EXPLOSIFS: Slide[] = [
  {
    type: 'intro',
    kicker: 'SLIDE 01 — INGÉNIERIE CHIMIQUE',
    title: 'Chimie des Explosifs, Amorçage TOVEX & Confinement',
    expertTag: '💣 Expert Explosifs & Chimiste Mine',
    body: [
      "Ce module aborde la physique et la chimie de la détonation souterraine : la synergie thermodynamique entre l'ANFO (Nitrate-Fioul) et le TOVEX (Hydrogel).",
      "Apprenez à maîtriser les vitesses de détonation (VOD), calculer la densité de chargement et appliquer la formule scientifique du bourrage pour transformer 100% de l'énergie chimique en fracturation utile.",
      "Un module indispensable pour boutefeus, chefs de poste et ingénieurs de tir."
    ],
    metrics: [
      { label: 'ANFO VOD', value: '3,200', unit: 'm/s' },
      { label: 'TOVEX VOD', value: '4,800', unit: 'm/s' },
      { label: 'Pression Gaz', value: '10,000', unit: 'bar' }
    ]
  },
  {
    type: 'sommaire',
    kicker: 'SLIDE 02 — SOMMAIRE INTERACTIF',
    title: 'Table des Matières : Chimie des Explosifs',
    expertTag: '🎓 Concepteur Pédagogique',
    body: ["Accédez directement à une partie du cours."]
  },
  {
    kicker: 'PROPRIÉTÉS ANFO vs TOVEX',
    title: 'Complémentarité physique entre ANFO & TOVEX',
    expertTag: '💣 Expert Explosifs',
    body: [
      "• ANFO (94% Nitrate d'Ammonium + 6% Fioul) : Explosif vrac à forte production de gaz poussants. Densité 0.85 g/cm³. Il nécessite une onde de choc initiale puissante pour s'amorcer.",
      "• TOVEX (Hydrogel sensibilisé) : Explosif moléculaire à haute vitesse de détonation (4 800 m/s), insensible à l'eau. Utilisé en cartouche d'amorce au fond du trou pour initier l'ANFO et casser le fond dur.",
      "Sensibilité à l'eau : L'ANFO se dissout instantanément au contact de l'eau stagnant dans les trous forés ! En trou mouillé, utilisez une gaine plastique étanche ou du TOVEX continu."
    ],
    ruleOfArt: "Règle de l'Expert : Insérez la cartouche de TOVEX avec le détonateur orienté VERS L'EMBOUCHURE du trou pour maximiser l'onde de détonation directe (amorce de fond).",
    metrics: [
      { label: 'Résistance Eau ANFO', value: 'NULLE', subtext: 'Se dégrade si mouillé' },
      { label: 'Résistance Eau TOVEX', value: 'EXCELLENTE', subtext: 'Étanche en trou d\'eau' }
    ]
  },
  {
    kicker: 'LA FORMULE SCIENTIFIQUE DU BOURRAGE',
    title: 'Calcul Exact de la Longueur de Bourrage (20 × D)',
    expertTag: '💣 Expert Explosifs',
    body: [
      "Lorsqu'un trou détone, la pression des gaz monte à 10 000 bars en quelques micro-secondes.",
      "Sans bourrage rétenteur à l'embouchure, les gaz s'échappent à Mach 10 par l'ouverture (effet canon / coup soufflé) : 60% de l'énergie d'abattage est perdue !",
      "Formule scientifique SMI : $L_{\text{bourrage}} = 20 \times \emptyset_{\text{trou}}$",
      "Calcul pour taillant Ø 38 mm : $20 \times 38\text{ mm} = 760\text{ mm} = 76\text{ cm}$. Utiliser des cartouches d'argile plastique compactée sur 76 cm."
    ],
    metrics: [
      { label: 'Formule Bourrage', value: '20 × D', subtext: 'Règle universelle SMI' },
      { label: 'Longueur Cible Ø38', value: '76', unit: 'cm' },
      { label: 'Gain de Pression', value: '+60%', subtext: 'Gaz retenus dans le trou' }
    ]
  },
  {
    type: 'quiz',
    kicker: 'TEST DE VALIDATION',
    title: 'Évaluation : Chimie & Chargement',
    expertTag: '🎓 Formateur Pédagogique',
    body: ["Testez vos connaissances sur le chargement."],
    quiz: {
      question: "Quelle est la longueur de bourrage rétenteur exigée pour un trou foré à Ø 38 mm selon la formule Lb = 20 × D ?",
      options: [
        "25 cm",
        "50 cm",
        "76 cm",
        "120 cm"
      ],
      correctAnswer: 2,
      explanation: "20 × 38 mm = 760 mm = 76 cm. C'est la longueur optimale pour confiner les 10 000 bars de pression jusqu'à la fracturation complète de la roche."
    }
  }
];

// ==========================================
// 5. MODULE SÉCURITÉ & PRÉVENTION QHSE
// ==========================================
const SLIDES_SECURITE: Slide[] = [
  {
    type: 'intro',
    kicker: 'SLIDE 01 — PRÉVENTION SOU TERRAINE',
    title: 'Sécurité Absolue, Purge du Front & Tirs Ratés (Misfires)',
    expertTag: '🛡️ Expert QHSE & Sécurité Mine',
    body: [
      "La sécurité en mine souterraine est la priorité absolue. La quasi-totalité des accidents graves survient lors de la purge de roches décollées ou lors du forage involontaire dans un tir raté (misfire).",
      "Ce module formalise les protocoles stricts d'assainissement de l'atmosphère (CO, NOx), la technique de sonorisation acoustique de la voûte et les consignes de gestion des culots de trous.",
      "Protéger votre vie et celle de vos collègues exige une discipline rigoureuse."
    ],
    metrics: [
      { label: 'Objectif Sécurité', value: 'ZERO', subtext: 'Accident toléré' },
      { label: 'Longueur Barre Purge', value: '2.5 / 3.5', unit: 'm' },
      { label: 'Distance Culot Min', value: '20', unit: 'cm' }
    ]
  },
  {
    type: 'sommaire',
    kicker: 'SLIDE 02 — SOMMAIRE INTERACTIF',
    title: 'Table des Matières : Sécurité & Purge',
    expertTag: '🎓 Concepteur Pédagogique',
    body: ["Sélectionnez le chapitre souhaité."]
  },
  {
    kicker: 'AÉRAGE & TOXIQUES POST-TIR',
    title: 'Contrôle Atmosphérique : Monoxyde de Carbone (CO) & NOx',
    expertTag: '🛡️ Expert QHSE',
    body: [
      "Après un tir de volée, la détonation libère des milliers de mètres cubes de monoxyde de carbone (CO) et d'oxydes d'azote (NOx) mortels et inodores.",
      "1. Ne pénétrez JAMAIS au front avant au moins 20 à 30 minutes d'aérage forcé à débit maximal (≥ 3 m³/s).",
      "2. Contrôlez l'atmosphère avec le détecteur multigaz portable maintenu à hauteur de torse (CO < 20 ppm, NO2 < 3 ppm, O2 > 19.5%).",
      "3. En cas d'alarme sonore du détecteur, faites immédiatement demi-tour vers la galerie d'air frais !"
    ],
    safety: "Le monoxyde de carbone (CO) est inodore, incolore et mortel à faible dose. Ne vous fiez jamais à votre odorat !"
  },
  {
    kicker: 'GESTION DES TIRS RATÉS (MISFIRES)',
    title: 'Règle d\'Or des Culots de Trous : 20 cm d\'Écart',
    expertTag: '🛡️ Expert QHSE & Sécurité',
    body: [
      "Un culot de trou est le fond d'un trou de mine restant visible sur le front après le tir.",
      "DANGER EXTRÊME : Le culot peut abriter une cartouche de TOVEX non explosée ou un détonateur intact masqué sous la poussière.",
      "1. INTERDICTION STRICTE DE FORER DANS UN CULOT EXISTANT OU D'Y INTRODUIRE UN OUTIL MÉTALLIQUE !",
      "2. Repérez et marquez TOUS les culots visibles à la peinture ROUGE FLUO.",
      "3. Tout nouveau trou foré doit respecter une distance minimale de 20 cm parallèles par rapport au culot.",
      "4. Traitement d'un raté : Seul le chef de tir habilité peut rincer le trou à l'eau sous faible pression ou ré-amorcer après évacuation du chantier."
    ],
    safety: "Forer dans un culot chargé est la première cause de mortalité par explosion involontaire en mine souterraine.",
    metrics: [
      { label: 'Distance Forage / Culot', value: '≥ 20', unit: 'cm' },
      { label: 'Marquage Obligatoire', value: 'FLUO', subtext: 'Peinture Rouge' }
    ]
  },
  {
    type: 'quiz',
    kicker: 'TEST DE VALIDATION',
    title: 'Évaluation : Sécurité & Purge',
    expertTag: '🎓 Formateur Pédagogique',
    body: ["Testez vos réflexes de sécurité."],
    quiz: {
      question: "Quelle est la consigne absolue à appliquer lorsqu'on découvre un culot de trou de mine sur le front après le tir ?",
      options: [
        "Nettoyer le culot en forant directement dedans avec le taillant",
        "Introduire une tige d'acier pour mesurer la profondeur restante",
        "Interdiction de forer dedans, le marquer à la peinture rouge fluo et forer à au moins 20 cm d'écart",
        "Remplir le culot avec du fioul pur"
      ],
      correctAnswer: 2,
      explanation: "Forer dans un culot peut faire détoner un reste de TOVEX ou un détonateur intact. La règle d'or est le marquage fluo et un écart minimal de 20 cm."
    }
  }
];

// ==========================================
// 6. MODULE DIAGNOSTIC & AUDIT DE VOLÉE
// ==========================================
const SLIDES_DIAGNOSTIC: Slide[] = [
  {
    type: 'intro',
    kicker: 'SLIDE 01 — AUDIT DE PERFORMANCE',
    title: 'Diagnostic de Volée, Fragmentation & Profil de Galerie',
    expertTag: '🪨 Expert Géotechnique & Chef d\'Exploitation',
    body: [
      "La volée ne s'arrête pas à la mise à feu. L'ingénieur et le chef de chantier doivent examiner le résultat du tir dès le retour au front.",
      "Ce module enseigne l'analyse du profil du tas de minerai (muckpile), la mesure de la granulométrie ($D_{50}$), la détection du sur-profil (overbreak) et les corrections à apporter immédiatement pour la volée suivante.",
      "Transformez l'observation du terrain en leviers de rentabilité économique."
    ],
    metrics: [
      { label: 'Target Avancement', value: '> 95', unit: '%' },
      { label: 'Granulométrie D50', value: '250', unit: 'mm' },
      { label: 'Hors-Profil Max', value: '< 8', unit: '%' }
    ]
  },
  {
    type: 'sommaire',
    kicker: 'SLIDE 02 — SOMMAIRE INTERACTIF',
    title: 'Table des Matières : Diagnostic de Volée',
    expertTag: '🎓 Concepteur Pédagogique',
    body: ["Sélectionnez le chapitre de votre choix."]
  },
  {
    kicker: 'ANALYSE DU TAS DE MINERAI',
    title: 'Profils du Muckpile : Détecter les Anomalies',
    expertTag: '🪨 Expert Géotechnique',
    body: [
      "• TAS CONCENTRÉ À PENTE RÉGULIÈRE (Idéal) : Le tas s'étale régulièrement à 10-12m du front. Signe d'un foisonnement parfait et d'une excellente distribution de l'énergie.",
      "• TAS PROJETÉ TRÈS LOIN (> 25m) : Résultat d'un sur-dosage en ANFO ou d'un manque de bourrage. Risque d'endommager les câbles d'aérage et matériels.",
      "• TAS BLOQUÉ EN CLOCHE CONTRE LE FRONT : Roche compactée avec gros blocs. Signale un échec du bouchon (manque de surface libre) ou un tir de voûte prématuré."
    ],
    ruleOfArt: "Examinez la pente du tas avant d'engager le godet de la chargeuse LHD !"
  },
  {
    type: 'quiz',
    kicker: 'TEST DE VALIDATION',
    title: 'Évaluation : Diagnostic de Volée',
    expertTag: '🎓 Formateur Pédagogique',
    body: ["Validez vos compétences d'analyse."],
    quiz: {
      question: "Quelle est la cause principale d'un tas de minerai bloqué en cloche contre le front avec de gros blocs incassés ?",
      options: [
        "Un sur-dosage d'ANFO dans les parements",
        "Un échec du bouchon (manque d'espace libre d'expansion) ou un tir de voûte prématuré",
        "Un aérage trop fort du canard",
        "L'utilisation de barres de purge en aluminium"
      ],
      correctAnswer: 1,
      explanation: "Si le bouchon ne dégage pas la cavité initiale, la roche des trous suivants n'a aucun espace où s'éjecter et reste compactée contre le front."
    }
  }
];

export const SLIDE_DECKS: Record<ExtendedModuleType, Slide[]> = {
  '12m2': SLIDES_12M2,
  '12m2_intl': SLIDES_12M2_INTL,
  '9m2': SLIDES_9M2,
  '9m2_intl': SLIDES_9M2,
  'explosifs': SLIDES_EXPLOSIFS,
  'securite': SLIDES_SECURITE,
  'diagnostic': SLIDES_DIAGNOSTIC
};

interface FormationSlideDeckProps {
  gabarit: ExtendedModuleType;
  onClose: () => void;
}

export const FormationSlideDeck: React.FC<FormationSlideDeckProps> = ({ gabarit, onClose }) => {
  const slides = SLIDE_DECKS[gabarit] || SLIDES_12M2;
  const [index, setIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [quizSubmitted, setQuizSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const slide = slides[index];
  const totalSlides = slides.length;

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.log(err));
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const handleNext = () => {
    if (index < totalSlides - 1) {
      setIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setQuizSubmitted(false);
    }
  };

  const handlePrev = () => {
    if (index > 0) {
      setIndex(prev => prev - 1);
      setSelectedAnswer(null);
      setQuizSubmitted(false);
    }
  };

  const handleQuizSubmit = () => {
    if (selectedAnswer === null || !slide.quiz) return;
    setQuizSubmitted(true);
    if (selectedAnswer === slide.quiz.correctAnswer) {
      setScore(prev => prev + 1);
    }
  };

  const handleReset = () => {
    setIndex(0);
    setSelectedAnswer(null);
    setQuizSubmitted(false);
    setScore(0);
  };

  const handleJumpToSlide = (slideIndex: number) => {
    setIndex(slideIndex);
    setSelectedAnswer(null);
    setQuizSubmitted(false);
  };

  const handleCopySynthesis = () => {
    if (!slide.body) return;
    const text = `${slide.title}\n${slide.body.join('\n')}`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-slate-950 flex flex-col justify-between overflow-hidden font-sans select-none">
      
      {/* Top Presentation Header Bar */}
      <div className="bg-slate-900 border-b border-amber-500/30 px-6 py-3.5 flex items-center justify-between shadow-2xl relative z-20">
        
        {/* Left: SMI Logo & Course Title */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-950 p-1.5 px-3 rounded-xl border border-amber-500/40">
            <img 
              src={excellenceLogoImg} 
              alt="SMI Excellence Logo" 
              className="h-7 w-auto object-contain"
            />
            <div className="hidden sm:block text-left border-l border-slate-800 pl-2">
              <span className="text-[10px] font-black uppercase text-amber-400 tracking-widest block">
                SMI EXCELLENCE
              </span>
              <span className="text-[9px] text-slate-400 font-extrabold uppercase block">
                CENTRE DE FORMATION
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase text-amber-300 tracking-wider bg-amber-500/20 px-2 py-0.5 rounded border border-amber-400/40">
                MODE PLEIN ÉCRAN PRESENTATION
              </span>
              <span className="text-[11px] text-amber-400 font-mono font-bold">
                SLIDE {index + 1} / {totalSlides}
              </span>
            </div>
            <h3 className="text-white text-sm md:text-base font-black tracking-tight truncate max-w-xs md:max-w-md">
              {slide.title}
            </h3>
          </div>
        </div>

        {/* Center: Slide Progress Dots */}
        <div className="hidden xl:flex items-center gap-1.5 max-w-sm w-full mx-4">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => handleJumpToSlide(i)}
              className={`h-2 flex-1 rounded-full transition-all cursor-pointer ${
                i === index 
                  ? 'bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.8)] scale-110' 
                  : i < index 
                  ? 'bg-amber-600/70' 
                  : 'bg-slate-800'
              }`}
              title={`Aller à la slide ${i + 1}`}
            />
          ))}
        </div>

        {/* Right Controls: Fullscreen Toggle & Close */}
        <div className="flex items-center gap-2">
          <button
            onClick={toggleFullscreen}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-white transition-all cursor-pointer border border-amber-500/30 flex items-center gap-1.5 text-xs font-bold"
            title={isFullscreen ? "Quitter le plein écran" : "Mode Plein Écran (Projo / Beamer)"}
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            <span className="hidden md:inline">{isFullscreen ? 'Fenêtré' : 'Plein Écran'}</span>
          </button>

          <button
            onClick={onClose}
            className="p-2.5 rounded-xl bg-rose-900/80 hover:bg-rose-800 text-rose-200 hover:text-white transition-colors cursor-pointer border border-rose-700/50"
            title="Fermer la formation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Slide Content Workspace */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 flex items-center justify-center relative bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
        
        {/* Maximize Card Container */}
        <div className="max-w-6xl w-full bg-white border-2 border-slate-200 rounded-3xl shadow-2xl p-6 md:p-10 space-y-6 relative overflow-hidden">
          
          {/* Top Gold Bar */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-600" />

          {/* Header Metadata & Expert Badge */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <span className="text-xs font-black uppercase tracking-widest text-amber-600 flex items-center gap-2">
              <Layers className="w-4 h-4 text-amber-500" />
              {slide.kicker}
            </span>

            {slide.expertTag && (
              <span className="text-[11px] font-black uppercase bg-slate-900 text-amber-400 px-3 py-1 rounded-full border border-amber-400/40 shadow-sm flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                {slide.expertTag}
              </span>
            )}
          </div>

          {/* SLIDE TYPE 1: INTRO SLIDE WITH BANNER EXCELLENCE LOGO */}
          {slide.type === 'intro' ? (
            <div className="space-y-6">
              {/* Banner Image Hero Header */}
              <div className="relative rounded-2xl overflow-hidden border-2 border-amber-500/40 shadow-xl h-48 md:h-60 flex items-center justify-center text-center p-6 bg-slate-950">
                <img 
                  src={bannerExcellenceImg} 
                  alt="Banner Excellence SMI" 
                  className="absolute inset-0 w-full h-full object-cover opacity-85"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/60 to-transparent" />
                
                <div className="relative z-10 space-y-3 max-w-3xl">
                  <div className="inline-flex items-center gap-2 bg-amber-500 text-slate-950 text-xs font-black px-3 py-1 rounded-full uppercase tracking-wider shadow-md">
                    <Award className="w-4 h-4" /> MODULE HAUTE PERFORMANCE SMI
                  </div>
                  <h1 className="text-2xl md:text-4xl font-black uppercase text-white tracking-tight drop-shadow-lg">
                    {slide.title}
                  </h1>
                </div>
              </div>

              {/* Body Text Paragraphs */}
              <div className="space-y-3 text-slate-700 text-sm md:text-base leading-relaxed font-medium">
                {slide.body.map((p, idx) => (
                  <p key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                    {p}
                  </p>
                ))}
              </div>

              {/* Key Metrics */}
              {slide.metrics && (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                  {slide.metrics.map((m, mIdx) => (
                    <div key={mIdx} className="bg-slate-900 text-white p-4 rounded-2xl border border-amber-500/40 text-center space-y-1 shadow-md">
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 block">{m.label}</span>
                      <div className="text-2xl font-black text-white">
                        {m.value} <span className="text-xs font-normal text-amber-200">{m.unit}</span>
                      </div>
                      {m.subtext && <span className="text-[9px] text-slate-400 block">{m.subtext}</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : slide.type === 'sommaire' ? (
            /* SLIDE TYPE 2: INTERACTIVE SOMMAIRE / TABLE OF CONTENTS */
            <div className="space-y-6">
              <div className="flex items-center gap-3 bg-slate-900 text-white p-5 rounded-2xl border border-amber-400/40 shadow-md">
                <ListOrdered className="w-8 h-8 text-amber-400 flex-shrink-0" />
                <div>
                  <h4 className="font-black text-lg text-amber-300">Sommaire Interactif de la Formation</h4>
                  <p className="text-xs text-slate-300">Cliquez sur n'importe quel chapitre pour y accéder directement.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[420px] overflow-y-auto pr-2">
                {slides.map((item, sIdx) => (
                  <button
                    key={sIdx}
                    onClick={() => handleJumpToSlide(sIdx)}
                    className={`text-left p-4 rounded-2xl border transition-all flex items-start gap-3.5 cursor-pointer group ${
                      sIdx === index 
                        ? 'bg-amber-500 text-slate-950 border-amber-600 font-extrabold shadow-md' 
                        : 'bg-slate-50 hover:bg-amber-50/60 border-slate-200 text-slate-800 hover:border-amber-400'
                    }`}
                  >
                    <span className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs flex-shrink-0 mt-0.5 ${
                      sIdx === index ? 'bg-slate-950 text-amber-400' : 'bg-slate-200 text-slate-700 group-hover:bg-amber-500 group-hover:text-slate-950'
                    }`}>
                      {sIdx + 1}
                    </span>
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-wider block opacity-75">
                        {item.kicker}
                      </span>
                      <h5 className="font-black text-sm leading-snug">{item.title}</h5>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : slide.type === 'quiz' ? (
            /* SLIDE TYPE 3: INTERACTIVE QUIZ */
            <div className="space-y-6">
              <div className="flex items-center gap-3 text-amber-600 bg-amber-50 p-4 rounded-2xl border border-amber-200">
                <HelpCircle className="w-8 h-8 flex-shrink-0" />
                <div>
                  <h4 className="font-black text-slate-900 text-lg">Évaluation des Connaissances</h4>
                  <p className="text-xs text-slate-600">Validez vos compétences avant de passer à la suite.</p>
                </div>
              </div>

              {slide.quiz && (
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4">
                  <h5 className="font-black text-slate-900 text-base">{slide.quiz.question}</h5>
                  <div className="space-y-2.5">
                    {slide.quiz.options.map((opt, optIdx) => {
                      const isSelected = selectedAnswer === optIdx;
                      const isCorrect = optIdx === slide.quiz?.correctAnswer;
                      
                      let btnStyle = "bg-white border-slate-200 text-slate-800 hover:border-amber-400 hover:bg-amber-50/50";
                      if (quizSubmitted) {
                        if (isCorrect) {
                          btnStyle = "bg-emerald-500 text-white border-emerald-600 font-extrabold";
                        } else if (isSelected && !isCorrect) {
                          btnStyle = "bg-rose-500 text-white border-rose-600 font-bold";
                        } else {
                          btnStyle = "bg-slate-100 border-slate-200 text-slate-400 opacity-60";
                        }
                      } else if (isSelected) {
                        btnStyle = "bg-slate-900 text-white border-slate-900 font-extrabold";
                      }

                      return (
                        <button
                          key={optIdx}
                          disabled={quizSubmitted}
                          onClick={() => setSelectedAnswer(optIdx)}
                          className={`w-full text-left p-4 rounded-xl border text-sm transition-all flex items-center justify-between cursor-pointer ${btnStyle}`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`w-6 h-6 rounded-full text-xs flex items-center justify-center font-black ${
                              isSelected ? 'bg-amber-400 text-slate-900' : 'bg-slate-200 text-slate-700'
                            }`}>
                              {String.fromCharCode(65 + optIdx)}
                            </span>
                            <span>{opt}</span>
                          </div>
                          {quizSubmitted && isCorrect && <CheckCircle2 className="w-5 h-5 text-white" />}
                        </button>
                      );
                    })}
                  </div>

                  {!quizSubmitted ? (
                    <button
                      onClick={handleQuizSubmit}
                      disabled={selectedAnswer === null}
                      className="w-full py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-40 text-slate-950 font-black rounded-xl uppercase text-xs tracking-wider transition-colors shadow-md cursor-pointer mt-4"
                    >
                      Valider ma Réponse
                    </button>
                  ) : (
                    <div className="p-4 rounded-xl bg-slate-900 text-white space-y-2 text-xs">
                      <p className="font-extrabold flex items-center gap-2 text-amber-400">
                        <Sparkles className="w-4 h-4" /> Explication de l'Expert :
                      </p>
                      <p className="text-slate-300 leading-relaxed">{slide.quiz.explanation}</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          ) : slide.type === 'synthesis' ? (
            /* SLIDE TYPE 4: SYNTHESIS / MÉMOTECHNIQUE */
            <div className="space-y-6">
              <div className="flex items-center justify-between bg-slate-900 text-white p-6 rounded-2xl shadow-md border border-amber-400/40">
                <div className="flex items-center gap-4">
                  <Award className="w-10 h-10 text-amber-400 flex-shrink-0" />
                  <div>
                    <h4 className="font-black text-xl text-amber-300">Fiche Mémotechnique de Terrain</h4>
                    <p className="text-xs text-slate-300">Synthèse opérationnelle pour le boutefeu & chef de chantier.</p>
                  </div>
                </div>
                <button
                  onClick={handleCopySynthesis}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl flex items-center gap-2 transition-all cursor-pointer"
                >
                  {copied ? <Check className="w-4 h-4" /> : <FileText className="w-4 h-4" />}
                  {copied ? 'Copié !' : 'Copier Mémo'}
                </button>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-3 font-mono text-xs text-slate-800">
                {slide.body.map((line, idx) => (
                  <div key={idx} className="p-3.5 bg-white border border-slate-200 rounded-xl flex items-start gap-3 shadow-sm">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 mt-1 flex-shrink-0" />
                    <p className="leading-relaxed font-sans text-slate-800 font-bold">{line}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* SLIDE TYPE 5: STANDARD TECHNICAL SLIDE WITH SCHEMAS & METRICS */
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Text & Technical Content */}
              <div className={`space-y-5 ${slide.showSchema ? 'lg:col-span-7' : 'lg:col-span-12'}`}>
                <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-snug">
                  {slide.title}
                </h2>

                <div className="space-y-3 text-slate-700 text-sm md:text-base leading-relaxed">
                  {slide.body.map((paragraph, pIdx) => (
                    <p key={pIdx} className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 font-medium">
                      {paragraph}
                    </p>
                  ))}
                </div>

                {/* Metrics */}
                {slide.metrics && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-1">
                    {slide.metrics.map((m, mIdx) => (
                      <div key={mIdx} className="bg-slate-900 text-white p-3 rounded-2xl border border-amber-500/30 text-center space-y-0.5 shadow-sm">
                        <span className="text-[9px] font-black uppercase tracking-wider text-amber-400 block">{m.label}</span>
                        <div className="text-lg font-black text-white">
                          {m.value} <span className="text-xs font-normal text-amber-200">{m.unit}</span>
                        </div>
                        {m.subtext && <span className="text-[8px] text-slate-400 block truncate">{m.subtext}</span>}
                      </div>
                    ))}
                  </div>
                )}

                {/* Rule of Art Box */}
                {slide.ruleOfArt && (
                  <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-extrabold text-amber-900 text-xs uppercase tracking-wider">Règle de l'Art & Métier :</h5>
                      <p className="text-xs text-amber-800 font-medium mt-1 leading-relaxed">{slide.ruleOfArt}</p>
                    </div>
                  </div>
                )}

                {/* Safety Alert Box */}
                {slide.safety && (
                  <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-4 flex items-start gap-3">
                    <ShieldAlert className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-extrabold text-rose-900 text-xs uppercase tracking-wider">Alerte Sécurité Non Négociable :</h5>
                      <p className="text-xs text-rose-800 font-semibold mt-1 leading-relaxed">{slide.safety}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Interactive Schema Graphic Column */}
              {slide.showSchema && (
                <div className="lg:col-span-5 bg-slate-950 rounded-2xl p-5 border-2 border-slate-800 shadow-2xl space-y-4">
                  <div className="flex items-center justify-between text-white border-b border-slate-800 pb-3">
                    <span className="text-[10px] font-black uppercase text-amber-400 tracking-wider flex items-center gap-1.5">
                      <Eye className="w-3.5 h-3.5" /> Schéma Interactif
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono uppercase">
                      Étape : {slide.highlightStep || 'Vue globale'}
                    </span>
                  </div>

                  <div className="h-64 sm:h-72 w-full flex items-center justify-center">
                    <FormationSchemaViewer
                      gabarit={slide.schemaType || (gabarit as GabaritType) || '12m2'}
                      highlightStep={slide.highlightStep || 'tous'}
                      className="w-full h-full max-h-64"
                    />
                  </div>

                  <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-center">
                    <p className="text-[11px] text-slate-300 font-medium">
                      Les trous surbrillants en <span className="text-amber-400 font-extrabold">Jaune Or</span> représentent l'étage de détonation actif.
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* Bottom Navigation Toolbar */}
      <div className="bg-slate-900 border-t border-amber-500/30 px-6 py-4 flex items-center justify-between shadow-2xl relative z-20">
        <button
          onClick={handlePrev}
          disabled={index === 0}
          className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white text-xs font-black uppercase tracking-wider rounded-xl flex items-center gap-2 transition-colors cursor-pointer border border-slate-700"
        >
          <ChevronLeft className="w-4 h-4" /> Précédent
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={handleReset}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white rounded-xl transition-colors cursor-pointer border border-slate-700"
            title="Recommencer la formation"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <span className="text-xs text-amber-400 font-mono font-bold hidden sm:inline">
            Slide {index + 1} de {totalSlides}
          </span>
        </div>

        <button
          onClick={handleNext}
          disabled={index === totalSlides - 1}
          className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-30 text-slate-950 text-xs font-black uppercase tracking-wider rounded-xl flex items-center gap-2 transition-all shadow-md cursor-pointer"
        >
          Suivant <ChevronRight className="w-4 h-4" />
        </button>
      </div>

    </div>
  );
};
