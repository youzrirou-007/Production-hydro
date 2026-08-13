import React, { useState, useEffect } from 'react';
import { FormationSchemaViewer, FormationBlastStep } from './FormationSchemaViewer';
import type { GabaritType } from './types';
import bannerExcellenceImg from '../../assets/images/Banner excellence.jpg';
import excellenceLogoImg from '../../assets/images/excellence_logo.png';
import { 
  ChevronLeft, ChevronRight, X, ShieldAlert, CheckCircle2, Award, 
  Sparkles, RotateCcw, FileText, Share2, Flame, Zap, 
  AlertTriangle, Gauge, Check, HelpCircle, Layers, Wrench, Eye,
  Maximize2, Minimize2, ListOrdered, BookOpen, ShieldCheck, Compass, Tv, Play,
  Download
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
      "Conçu spécifiquement pour les roches à très haute résistance mécanique (compressibilité > 180 MPa, quartzites, basaltes durs), il utilise un bouchon élargi à 6 trous vides centraux.",
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
    kicker: 'MÉCANIQUE DE DÉTONATION',
    title: 'Théorie de Langefors-Kihlström & Déconfinement',
    expertTag: '🪨 Expert Géotechnique & Mécanique des Roches',
    body: [
      "Dans les roches extrêmement dures et peu fissurées, l'onde de choc de détonation s'atténue plus lentement mais la roche nécessite un volume de foisonnement nettement supérieur pour se dégager.",
      "La méthode Langefors calcule le burden maximal en fonction du diamètre du trou vide équivalent ($D_{e} = d \times \sqrt{n}$), de la densité de chargement et de la constante de roche $c = 0.40 \\text{ kg/m³}$.",
      "Une géométrie mal ajustée en roche dure provoque la re-compaction du prisme de bouchon sous l'effet de la pression extrême, conduisant à un blocage complet du tir."
    ],
    ruleOfArt: "Règle de Langefors : En roche hyper-résistante (> 180 MPa), le ratio de volume libre au bouchon doit être au moins égal à 2.0 fois le volume de roche cisaillée.",
    metrics: [
      { label: 'Constante Roche (c)', value: '0.40', unit: 'kg/m³' },
      { label: 'Ratio Foisonnement', value: '2.0', subtext: 'Volume libre / roche' },
      { label: 'Résistance Compression', value: '180-250', unit: 'MPa' }
    ]
  },
  {
    kicker: 'BOUCHON À 6 TROUS VIDES',
    title: 'Le Bouchon Suédois à Double Colonne (6 Vides Centraux)',
    expertTag: '⚡ Expert Forage & Abattage',
    body: [
      "Dans les massifs très durs, le prisme de roche brisée au bouchon a tendance à foisonner fortement et se re-compacter sur lui-même ('effet bouchon soudé').",
      "La solution Langefors consiste à aligner 6 trous vides centraux de Ø 38 mm (ou 2 gros trous d'alésage Ø 102 mm) disposés en 2 colonnes verticales parallèles.",
      "Les trous chargés centraux détonent à 0 ms (D0). Le ratio de volume libre est multiplié par 2 par rapport à un bouchon classique, garantissant une projection fluide."
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
    kicker: 'ÉQUATIONS DU BURDEN',
    title: 'Calcul du Burden Maximal (Bmax) & Diamètre Équivalent',
    expertTag: '🎓 Concepteur & Expert Explosifs',
    body: [
      "Le burden pratique du premier carré d'expansion selon Langefors est directement proportionnel au diamètre équivalent des trous vides :",
      "• Diamètre équivalent de 6 trous Ø 38 mm : $D_{e} = 38 \\times \\sqrt{6} \\approx 93\\text{ mm}$.",
      "• Burden maximal de première étape : $B_{1} = 1.5 \\times D_{e} = 1.5 \\times 93\\text{ mm} \\approx 0.14\\text{ m}$.",
      "• Les ouvertures successives s'élargissent géométriquement par un facteur $1.5$ à chaque carré d'expansion (B1 -> B2 -> B3 -> B4)."
    ],
    metrics: [
      { label: 'Diamètre Équivalent (De)', value: '93', unit: 'mm' },
      { label: 'Burden B1 Initial', value: '14', unit: 'cm' },
      { label: 'Facteur Progression', value: '1.5', subtext: 'Multiplicateur carré' }
    ]
  },
  {
    kicker: 'COMPARATIF DE SCHÉMA',
    title: '12m² SMI (3 Vides) vs 12m² International (6 Vides)',
    expertTag: '🎓 Formateur Pédagogique',
    body: [
      "• 12m² SMI (Standard Imiter) : 38 trous total | 3 vides centraux | 35 chargés. Adapté aux roches tendres à moyennement dures (80-150 MPa). Double TOVEX (200g) sur 6 trous de bouchon.",
      "• 12m² International (Langefors) : 38 trous total | 6 vides centraux | 32 chargés. Adapté aux roches très dures (> 180 MPa). 3 trous de bouchon chargés à détonation ultra-rapide.",
      "• Bilan comparatif : Le schéma International réduit le nombre de trous chargés de 35 à 32, économisant 3 détonateurs et environ 3.15 kg d'ANFO, mais exige un forage extrêmement précis des 6 trous vides."
    ],
    metrics: [
      { label: 'SMI 12m² Vides', value: '3', subtext: '35 trous chargés' },
      { label: 'INTL 12m² Vides', value: '6', subtext: '32 trous chargés' },
      { label: 'Économie Explosif INTL', value: '-3.15', unit: 'kg ANFO' }
    ]
  },
  {
    kicker: 'CHRONO-AMORÇAGE SÉQUENTIEL',
    title: 'Séquence Micro-Raccordée Court-Délai (0 à 125 ms)',
    expertTag: '💣 Expert Explosifs',
    body: [
      "Le plan de tir Langefors utilise des détonateurs à retard très précis (série MS) étagés à 25 ms d'intervalle :",
      "1. Bouchon Central : 0 ms (D0) — Pression instantanée pour éjecter le noyau vers les 6 vides.",
      "2. Premier Carré d'Expansion : 25 ms (D1) — Élargissement rectangulaire.",
      "3. Deuxième Carré : 50 ms (D2) — Ouverture vers la section $2.0\\text{m} \\times 2.0\\text{m}$.",
      "4. Troisième & Quatrième Carrés : 75 ms / 100 ms (D3/D4) — Approche du contour.",
      "5. Contour, Radier & Voûte : 100 à 125 ms (D4/D5) — Profilage définitif."
    ],
    showSchema: true,
    highlightStep: 'tous',
    schemaType: '12m2_intl'
  },
  {
    kicker: 'CONTRÔLE DE LA DÉVIATION',
    title: 'Gestion du Sur-Forage & Rigidité du Train de Tige',
    expertTag: '⚡ Expert Forage & Abattage',
    body: [
      "En roche très dure (> 180 MPa), le marteau pneumatique ou hydraulique subit une déviation accrue due à la résistance de la roche.",
      "Une déviation de 2% sur une tige de 2.4m déplace le fond de trou de 4.8 cm, ce qui modifie le burden théorique de 35% et risque de bloquer l'expansion.",
      "Correction Terrain : Utiliser des barres de forage rigides H22 ou R32, vérifier la pression d'incitation (5-8 bar) et appliquer un sur-forage systématique de 10-15 cm."
    ],
    ruleOfArt: "Règle de l'Expert Forage : Contrôlez la perpendicularité des coulisses du Jumbo toutes les 5 volées avec un distancier laser d'alignement.",
    metrics: [
      { label: 'Déviation Max Tolérée', value: '< 1.5', unit: '%' },
      { label: 'Sur-Forage Recommandé', value: '10-15', unit: 'cm' },
      { label: 'Rigidité Tige', value: 'H22/R32', subtext: 'Acier haute résistance' }
    ]
  },
  {
    kicker: 'AMORTISSEMENT PÉRIPHÉRIQUE',
    title: 'Découpe Périphérique & Pré-Découpage en Roche Dure',
    expertTag: '🪨 Expert Géotechnique',
    body: [
      "Dans les massifs compétents et durs, l'onde de choc de l'ANFO peut créer des micro-fissures profondes dans les parements et la voûte si la charge périphérique est trop forte.",
      "Technique de Découpe Douce (Smooth Blasting) : Charger les trous de voûte et de parements avec des demi-cartouches de TOVEX ou un tube d'ANFO découplé (diamètre de charge < diamètre du trou).",
      "Résultat : La pression des gaz découpe une fracture nette entre les trous adjacents sans endommager la roche encaissante."
    ],
    safety: "Alerte Géotechnique : L'absence de découpe douce en roche dure augmente le besoin en boulonnage de voûte de 40%."
  },
  {
    kicker: 'SÉCURITÉ & PROJECTIONS',
    title: 'Contrôle des Flyrocks & Périmètre Élargi (150 m)',
    expertTag: '🛡️ Expert QHSE & Sécurité Mine',
    body: [
      "L'énergie spécifique élevée déployée en roche très dure augmente le risque de projections violentes de roches (flyrocks) dans la galerie d'accès.",
      "1. Périmètre de Tir : Évacuation stricte de tous les chantiers adjacents dans un rayon de 150 mètres.",
      "2. Écrans de Protection : Installation d'un rideau de chaînes de protection ou d'un écran métallique à 30 mètres du front si le tir débouche vers une bifurcation.",
      "3. Attente Post-Tir : Maintien des barrages physiques pendant la durée minimale d'aérage (20 à 30 minutes)."
    ],
    safety: "Alerte Sécurité : Ne jamais réduire la distance de sécurité sous prétexte que le profil est restreint !"
  },
  {
    type: 'formula',
    kicker: 'FACTEUR DE CHARGE SÉVÈRE',
    title: 'Calcul du Facteur de Poudre Spécifique (qs)',
    expertTag: '💣 Expert Explosifs & Chimiste',
    body: [
      "Calcul du facteur de poudre spécifique pour le schéma 12m² International :",
      "• Volume théorique abattu pour une volée de 1.7m : $V = 12\\text{ m²} \\times 1.7\\text{ m} = 20.4\\text{ m³}$.",
      "• Masse totale d'explosifs (32 trous chargés) : 3.80 kg TOVEX + 33.60 kg ANFO = 37.40 kg d'explosifs.",
      "• Facteur de poudre spécifique : $q_{s} = \\frac{37.40\\text{ kg}}{20.4\\text{ m³}} = 1.83\\text{ kg/m³}$.",
      "En roche très dure, ce facteur de 1.83 kg/m³ garantit une granulométrie fine ($D_{50} < 250\\text{ mm}$) facilement mahrinée par les chargeuses LHD."
    ],
    metrics: [
      { label: 'Volume Volée (1.7m)', value: '20.4', unit: 'm³' },
      { label: 'Masse Totale Explosifs', value: '37.40', unit: 'kg' },
      { label: 'Facteur Poudre (qs)', value: '1.83', unit: 'kg/m³' }
    ]
  },
  {
    kicker: 'RÈGLE DE L\'ART LANGEFORS',
    title: 'Synthèse des Principes de l\'École Suédoise des Mines',
    expertTag: '🎓 Synthèse Générale des 5 Experts',
    body: [
      "1. Respecter scrupuleusement l'alignement parallèle des 6 trous vides centraux.",
      "2. Ne jamais surcharger les trous du premier carré d'expansion pour éviter la compaction de prisme.",
      "3. Appliquer la formule de bourrage rétenteur de 76 cm sur l'ensemble des 32 trous chargés.",
      "4. Contrôler le profil du tas de minerai après chaque tir pour ajuster le retard MS si nécessaire."
    ],
    ruleOfArt: "Règle d'Or Langefors : La précision du forage au bouchon détermine 90% du succès du tir en roche dure !"
  },
  {
    type: 'quiz',
    kicker: 'SLIDE 13 — TEST DE VALIDATION',
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
  },
  {
    type: 'synthesis',
    kicker: 'SLIDE 14 — FICHE MÉMOTECHNIQUE',
    title: 'Aide-Mémoire de Terrain 12m² International Langefors',
    expertTag: '🎓 Synthèse Générale des 5 Experts',
    body: [
      "• SECTION & TROUS : 12 m² | 38 trous total (6 Vides, 32 Chargés)",
      "• BOUCHON LANGEFORS : 6 Vides centraux en 2 colonnes + 3 Chargés centraux à 0ms (D0)",
      "• EXPLOSIFS TOTAL : 3.80 kg TOVEX + 33.60 kg ANFO = 37.40 kg d'explosifs",
      "• FACTEUR DE POUDRE : 1.83 kg/m³ pour un avancement net de 1.7 m (20.4 m³ abattus)",
      "• SÉQUENCE : Bouchon D0 (0ms) -> G1 (25ms) -> G2 (50ms) -> G3 (75ms) -> G4 (100ms) -> Contour/Voûte (125ms)",
      "• BOURRAGE RÉTENTEUR : 76 cm d'argile compactée (20 × D pour Ø 38 mm)",
      "• SÉCURITÉ : Périmètre d'évacuation 150 m | Contrôle strict de la déviation de forage (< 1.5%)"
    ]
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
    body: ["Sélectionnez la slide souhaitée pour une présentation ciblée."]
  },
  {
    kicker: 'GÉOMÉTRIE DE TRAÇAGE',
    title: 'Spécifications du Profil Étroit 9m² (3.0m × 3.0m)',
    expertTag: '⚡ Expert Forage & Abattage',
    body: [
      "La section 9m² offre une hauteur de 3.0 m et une largeur de 3.0 m en voute cintrée, idéale pour le passage des engins de marinage de taille moyenne (LHD 3.5 yd³).",
      "Le plan de tir comprend 28 trous forés au taillant de Ø 38 mm : 1 trou vide central + 27 trous chargés.",
      "Grâce à un périmètre réduit de 10.8 mètres (contre 12.6 m en 12m²), la densité de trous par mètre carré passe de 3.17 à 3.11 trous/m², garantissant un rendement élevé sans gaspillage de tir."
    ],
    metrics: [
      { label: 'Largeur Galerie', value: '3.0', unit: 'm' },
      { label: 'Hauteur Galerie', value: '3.0', unit: 'm' },
      { label: 'Périmètre Foré', value: '10.8', unit: 'm' },
      { label: 'Densité Forage', value: '3.11', unit: 'trous/m²' }
    ]
  },
  {
    kicker: 'PRÉREQUIS PRÉ-FORAGE',
    title: 'Contrôle QHSE & Encombrement Réduit au Front',
    expertTag: '🛡️ Expert QHSE & Sécurité Mine',
    body: [
      "Travailler dans une section étroite exige une rigueur accrue quant à la disposition des équipements et la sécurité des opérateurs :",
      "1. Positioning du Jumbo : Le bras du Jumbo doit être centré au millimètre près pour éviter les chocs contre les parements lors des manœuvres.",
      "2. Aérage de Zone Étroite : Un débit d'air frais minimal de 2.5 m³/s est requis. Le canard d'aérage (Ø 600 mm) doit être fixé au plus près de la voûte pour ne pas gêner le marinage.",
      "3. Purge Rigoureuse : En galerie de 3m de large, la chute d'une écaille de voûte balaye presque toute la largeur. La purge doit être effectuée avec une barre en alu de 2.5m."
    ],
    safety: "Consigne de Galerie Étroite : Interdiction de se tenir entre le bras du Jumbo et le parement pendant le positionnement du marteau !"
  },
  {
    kicker: 'PLAN DE TIR GLOBAL 9M²',
    title: 'Architecture & Répartition des 28 Trous',
    expertTag: '🎓 Concepteur & Expert Explosifs',
    body: [
      "Le schéma de tir 9m² est structuré en 6 sous-ensembles géométriques concentriques :",
      "• 1 Vide Central (non chargé) + 4 Trous de Bouchon (D0 à 0ms - Double TOVEX 200g).",
      "• 4 Trous Groupe 1 (D1 à +25ms - TOVEX 100g) — Premier carré d'expansion.",
      "• 4 Trous Groupe 2 (D2 à +50ms - TOVEX 100g) — Deuxième carré d'expansion.",
      "• 4 Trous Groupe 3 (D3 à +75ms - TOVEX 100g) — Troisième carré d'expansion (raccordement direct).",
      "• 4 Trous de Radier + 4 Trous de Parements (D4 à +100ms - TOVEX 100g).",
      "• 3 Trous de Voûte (D5 à +125ms en DERNIER - TOVEX 100g) — Profilage de sécurité."
    ],
    showSchema: true,
    highlightStep: 'tous',
    schemaType: '9m2'
  },
  {
    kicker: 'BOUCHON COMPACT D0',
    title: 'Bouchon Asymétrique à 1 Trou Vide Central (0 ms)',
    expertTag: '⚡ Expert Forage & Chimiste Explosifs',
    body: [
      "En section 9m², le bouchon est simplifié : 1 seul trou vide central (Ø 38 mm ou alésé Ø 75 mm) est entouré de 4 trous chargés disposés en carré étroit ($30\\text{ cm} \\times 30\\text{ cm}$).",
      "Chaque trou de bouchon reçoit 2 cartouches de TOVEX (200g total) pour surmonter la résistance initiale.",
      "Lors de la détonation à 0 ms (D0), les 4 trous expulsent la roche vers l'unique trou vide, créant le canal de libération nécessaire aux étapes suivantes."
    ],
    showSchema: true,
    highlightStep: 'bouchon',
    schemaType: '9m2',
    ruleOfArt: "Règle du Bouchon Compact : Si le trou vide est foré à Ø 38 mm sans alésage, réduisez la distance aux 4 trous chargés à 25 cm maximum.",
    metrics: [
      { label: 'Trou Vide Central', value: '1', unit: 'Ø 38mm' },
      { label: 'Trous Chargés Bouchon', value: '4', unit: '0 ms (D0)' },
      { label: 'TOVEX par Trou Bouchon', value: '2', unit: 'cartouches (200g)' },
      { label: 'Masse TOVEX Bouchon', value: '0.80', unit: 'kg (8 cartouches)' }
    ]
  },
  {
    kicker: 'EXPANSION GROUPE 1 (25 ms)',
    title: 'Premier Carré d\'Élargissement 9m²',
    expertTag: '🪨 Expert Géotechnique',
    body: [
      "À +25 ms, les 4 trous du Groupe 1 détonent autour de la cavité ouverte par le bouchon compact.",
      "Chargement G1 : 1 seule cartouche de TOVEX 100g au fond du trou + colonne d'ANFO.",
      "Le prisme de roche est cisaillé en diagonale avec un burden $B = 0.40\\text{ m}$, ouvrant un carré de $0.8\\text{m} \\times 0.8\\text{m}$."
    ],
    showSchema: true,
    highlightStep: 'g1',
    schemaType: '9m2'
  },
  {
    kicker: 'EXPANSION GROUPE 2 (50 ms)',
    title: 'Deuxième Carré d\'Élargissement 9m²',
    expertTag: '🪨 Expert Géotechnique',
    body: [
      "À +50 ms, le Groupe 2 prend le relais et détruit les coins, élargissant la cavité à $1.6\\text{m} \\times 1.6\\text{m}$.",
      "La roche s'éjecte librement vers le centre. Amorçage par 1 cartouche de TOVEX (100g) au fond de chaque trou."
    ],
    showSchema: true,
    highlightStep: 'g2',
    schemaType: '9m2'
  },
  {
    kicker: 'GROUPE 3 & SUPPRESSION G4',
    title: 'Groupe 3 (+75 ms) : Raccordement Direct au Contour',
    expertTag: '⚡ Expert Forage & Abattage',
    body: [
      "En section 9m², la distance entre le centre du front et les parois est réduite de 40 cm par rapport à une galerie 12m².",
      "Par conséquent, le Groupe 4 est totalement inutile : le Groupe 3 (+75 ms) dégage directement le volume nécessaire avant le tir du contour (parements, radier et voûte).",
      "Économie par volée : 10 trous de forage en moins, 10 détonateurs économisés et 11 kg d'explosif épargnés."
    ],
    showSchema: true,
    highlightStep: 'g3',
    schemaType: '9m2',
    metrics: [
      { label: 'Suppression G4', value: '-10', unit: 'trous de forage' },
      { label: 'Gain Explosif Volée', value: '-11', unit: 'kg d\'explosifs' },
      { label: 'Gain Temps Cycle', value: '-35', unit: 'min / volée' }
    ]
  },
  {
    kicker: 'FINITION DU PROFIL 9M²',
    title: 'Radier, Parements & Découpe Doux de Voûte (100 à 125 ms)',
    expertTag: '⚡ Expert Forage & Abattage',
    body: [
      "• Trous de Radier (4 trous) : Forés avec un piqué de 3° vers le bas. Amorçage 1 TOVEX 100g + ANFO.",
      "• Trous de Parements (4 trous) : Dépouille de 1.5° vers l'extérieur pour maintenir la largeur de 3.0 m. Détonation à +100 ms.",
      "• Trous de Voûte (3 trous) : Détonation impérative en DERNIER à +125 ms (D5) avec 1 cartouche de TOVEX 100g pour assurer une voûte auto-portante sans sur-fissuration."
    ],
    showSchema: true,
    highlightStep: 'voute',
    schemaType: '9m2',
    safety: "Règle de Sécurité : Ne jamais charger plus de 1 cartouche de TOVEX dans la voûte d'un traçage 9m² !"
  },
  {
    type: 'formula',
    kicker: 'DOSAGE EXPLOSIFS 9M²',
    title: 'Bilan Massique Volée 9m² & Bourrage (3.10 kg TOVEX)',
    expertTag: '💣 Expert Explosifs & Chimiste',
    body: [
      "Calcul certifié du plan de chargement pour un traçage 9m² (27 trous chargés) :",
      "1. TOVEX Bouchon (4 trous) : 2 cartouches de 100g par trou = 0.80 kg (8 cartouches).",
      "2. TOVEX Autres Trous (23 trous) : 1 cartouche de 100g par trou = 2.30 kg (23 cartouches).",
      "3. TOTAL TOVEX VOLÉE : 31 cartouches de 100g = 3.10 kg de TOVEX.",
      "4. ANFO (Nitrate-Fioul) : ~1.05 kg par trou × 27 trous = ~28.35 kg d'ANFO.",
      "5. Bourrage Rétenteur : 76 cm d'argile compactée par trou ($20 \\times \\emptyset 38\\text{ mm}$)."
    ],
    metrics: [
      { label: 'Total Cartouches TOVEX', value: '31', unit: 'cartouches 100g' },
      { label: 'Masse TOVEX Volée', value: '3.10', unit: 'kg' },
      { label: 'Masse ANFO Volée', value: '28.35', unit: 'kg' },
      { label: 'Longueur Bourrage', value: '76', unit: 'cm (20 × D)' }
    ]
  },
  {
    kicker: 'RENDEMENT ÉCONOMIQUE',
    title: 'Analyse Économique & Gain de Temps 9m² vs 12m²',
    expertTag: '🎓 Formateur & Direction Minière',
    body: [
      "Le choix du traçage 9m² pour les galeries d'accès secondaire offre un rendement opérationnel très élevé :",
      "• Temps de Forage : Réduit de 1h20 à 45 minutes par volée (soit -35 min).",
      "• Consommation Explosifs : 31.45 kg total contre 40.85 kg en 12m² (économie de 23%).",
      "• Volume de Marinage : 15.3 m³ par volée (contre 20.4 m³ en 12m²), accélérant la rotation des LHD de 25%."
    ],
    metrics: [
      { label: 'Volume Abattu / Volée', value: '15.3', unit: 'm³' },
      { label: 'Gain Explosif Total', value: '-23', unit: '%' },
      { label: 'Vitesse Avancement', value: '+1.5', unit: 'volées / poste' }
    ]
  },
  {
    type: 'quiz',
    kicker: 'SLIDE 13 — TEST DE VALIDATION',
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
  },
  {
    type: 'synthesis',
    kicker: 'SLIDE 14 — FICHE MÉMOTECHNIQUE',
    title: 'Aide-Mémoire de Terrain Traçage 9m² SMI',
    expertTag: '🎓 Synthèse Générale des 5 Experts',
    body: [
      "• SECTION & TROUS : 9 m² (3.0m × 3.0m) | 28 trous total (1 Vide, 27 Chargés)",
      "• BOUCHON COMPACT : 1 Vide central + 4 Chargés à 0ms (D0) avec 2 TOVEX (200g/trou)",
      "• AUTRES TROUS : 23 Trous chargés avec 1 TOVEX (100g/trou) + ANFO",
      "• TOTAL EXPLOSIFS : 3.10 kg TOVEX (31 cartouches 100g) + 28.35 kg ANFO",
      "• SÉQUENCE : Bouchon D0 (0ms) -> G1 (25ms) -> G2 (50ms) -> G3 (75ms) -> Radier/Parements (100ms) -> Voûte D5 (125ms)",
      "• OPTIMISATION : Suppression totale du Groupe 4 (-10 trous / -35 min forage)",
      "• BOURRAGE : 76 cm d'argile compactée obligatoire sur l'ensemble des 27 trous"
    ]
  }
];

// ==========================================
// 3.5. MODULE TRAÇAGE 9M² INTERNATIONAL (LANGEFORS)
// ==========================================
const SLIDES_9M2_INTL: Slide[] = [
  {
    type: 'intro',
    kicker: 'SLIDE 01 — SCHÉMA COMPACT LANGEFORS',
    title: 'Traçage 9m² Standard International (3 Trous Vides Centraux)',
    expertTag: '🎓 Formateur & Ingénieur Suédois',
    body: [
      "Le standard international Langefors pour profil étroit 9m² (3.0m × 3.0m) s'appuie sur un bouchon cylindrique à 3 trous vides alignés (Ø 38 mm).",
      "Conçu pour surmonter le confinement élevé des galeries réduites en roche très dure (> 150 MPa), ce schéma réorganise le bouchon central avec 3 vides et 4 trous chargés en croix.",
      "Ce module détaille les principes d'expansion géométrique, la séquence chrono-amorcée et la comparaison technique avec le modèle SMI à 1 seul trou vide."
    ],
    metrics: [
      { label: 'Section Galerie', value: '9.0', unit: 'm²' },
      { label: 'Trous Vides Bouchon', value: '3', unit: 'Ø 38mm' },
      { label: 'Total Trous Forés', value: '30', subtext: '3 Vides, 27 Chargés' }
    ]
  },
  {
    type: 'sommaire',
    kicker: 'SLIDE 02 — SOMMAIRE INTERACTIF',
    title: 'Table des Matières : Traçage 9m² International',
    expertTag: '🎓 Concepteur Pédagogique',
    body: ["Sélectionnez la slide souhaitée pour une présentation ciblée."]
  },
  {
    kicker: 'MÉCANIQUE DE DÉTONATION 9M²',
    title: 'Théorie du Bouchon Cylindrique Langefors en Galerie Étroite',
    expertTag: '🪨 Expert Géotechnique & Mécanique des Roches',
    body: [
      "En section réduite (3.0m × 3.0m), la roche offre une très forte résistance au dégagement en raison du confinement latéral étroit.",
      "Le bouchon cylindrique Langefors aligne 3 trous vides (Ø 38 mm) pour créer un diamètre équivalent $D_e = 38 \\times \\sqrt{3} \\approx 65.8\\text{ mm}$.",
      "Cette géométrie triple la surface libre initiale par rapport au trou vide unique du SMI, éliminant tout risque de 'bouchon soudé' et réduisant les vibrations."
    ],
    ruleOfArt: "Règle de Langefors Compact : La distance entre un trou chargé du bouchon et les trous vides alignés ne doit pas dépasser 1.5 × De (soit ~10 cm).",
    metrics: [
      { label: 'Diamètre Équivalent (De)', value: '65.8', unit: 'mm' },
      { label: 'Burden B1 Bouchon', value: '10', unit: 'cm' },
      { label: 'Gain Volume Libre', value: '+200', unit: '%' }
    ]
  },
  {
    kicker: 'PRÉREQUIS & SÉCURITÉ 9M²',
    title: 'Positionnement du Jumbo & Centrage en Galerie Étroite',
    expertTag: '🛡️ Expert QHSE & Sécurité Mine',
    body: [
      "La réalisation d'un bouchon à 3 trous vides alignés en galerie 9m² exige une précision de forage irréprochable :",
      "1. Parallélisme Strict : Les 3 trous vides et les 4 trous chargés du bouchon doivent être strictement parallèles (déviation < 1.0%).",
      "2. Alignement des Coulisses : Le bras du Jumbo doit être centré au laser. Toute déviation de 2 cm en fond de trou annule le bénéfice des 3 vides.",
      "3. Aérage de Zone : Débit d'air frais minimal de 2.5 m³/s à l'embouchure du canard (Ø 600 mm)."
    ],
    safety: "Consigne QHSE : Vérifier l'alignement horizontal des 3 trous vides avec une règle de guidage avant de charger les 4 trous du bouchon !"
  },
  {
    kicker: 'PLAN DE TIR GLOBAL 9M² INTL',
    title: 'Architecture & Répartition des 30 Trous',
    expertTag: '🎓 Concepteur & Expert Explosifs',
    body: [
      "Le schéma International 9m² comprend 30 trous au total (3 Vides + 27 Chargés) :",
      "• Bouchon Cylindrique : 3 Trous Vides alignés horizontalement (0 ms) + 4 Trous Chargés en croix (D0 à 0 ms - Double TOVEX 200g).",
      "• 4 Trous Groupe 1 (D1 à +25 ms) — Premier carré d'expansion ($0.8\\text{m} \\times 0.8\\text{m}$).",
      "• 4 Trous Groupe 2 (D2 à +50 ms) — Deuxième carré d'expansion ($1.6\\text{m} \\times 1.6\\text{m}$).",
      "• 4 Trous Groupe 3 (D3 à +75 ms) — Troisième carré d'expansion (Raccordement direct).",
      "• 4 Trous de Radier + 4 Trous de Parements (D4 à +100 ms - TOVEX 100g + ANFO).",
      "• 3 Trous de Voûte (D5 à +125 ms - Profilage doux de voûte cintrée)."
    ],
    showSchema: true,
    highlightStep: 'tous',
    schemaType: '9m2_intl'
  },
  {
    kicker: 'BOUCHON 3 VIDES + 4 CHARGÉS',
    title: 'Le Bouchon Cylindrique Langefors (3 Vides Centraux)',
    expertTag: '⚡ Expert Forage & Abattage',
    body: [
      "Au cœur du front, 3 trous vides de Ø 38 mm sont forés côte à côte horizontalement sur une largeur de 40 mm d'entraxe.",
      "4 trous chargés au TOVEX encadrent ce prisme rectangulaire : 1 en haut, 1 en bas, 1 à gauche, 1 à droite.",
      "Lors de la détonation instantanée à 0 ms (D0), la roche est cisaillée de manière isotrope vers la fente centrale formée par les 3 vides, créant une cavité rectangulaire parfaite."
    ],
    showSchema: true,
    highlightStep: 'bouchon',
    schemaType: '9m2_intl',
    metrics: [
      { label: 'Trous Vides Centraux', value: '3', unit: 'Ø 38mm' },
      { label: 'Trous Chargés Bouchon', value: '4', unit: '0 ms (D0)' },
      { label: 'Masse TOVEX Bouchon', value: '0.80', unit: 'kg (8 cartouches)' }
    ],
    ruleOfArt: "Règle de l'Expert : Chargez systématiquement 2 cartouches de TOVEX 100g (soit 200g) par trou dans les 4 trous du bouchon D0."
  },
  {
    kicker: 'EXPANSION GROUPE 1 (25 ms)',
    title: 'Premier Carré d\'Élargissement 9m² International',
    expertTag: '🪨 Expert Géotechnique',
    body: [
      "À +25 ms (D1), les 4 trous du Groupe 1 détonent autour de la fente rectangulaire dégagée par le bouchon à 3 vides.",
      "Le burden d'expansion $B_1 = 0.38\\text{ m}$ permet d'ouvrir une cavité carrée de $0.80\\text{m} \\times 0.80\\text{m}$.",
      "Amorçage : 1 cartouche de TOVEX 100g au fond + colonne d'ANFO vrac."
    ],
    showSchema: true,
    highlightStep: 'g1',
    schemaType: '9m2_intl'
  },
  {
    kicker: 'EXPANSION GROUPE 2 (50 ms)',
    title: 'Deuxième Carré d\'Élargissement 9m² International',
    expertTag: '🪨 Expert Géotechnique',
    body: [
      "À +50 ms (D2), le Groupe 2 brise les coins extérieurs et élargit la cavité à $1.60\\text{m} \\times 1.60\\text{m}$.",
      "La roche est expulsée en ligne directe vers le centre nettoyé par D0 et D1.",
      "Chaque trou contient 1 TOVEX 100g de fond + ~1.05 kg d'ANFO."
    ],
    showSchema: true,
    highlightStep: 'g2',
    schemaType: '9m2_intl'
  },
  {
    kicker: 'GROUPE 3 & SUPPRESSION G4',
    title: 'Groupe 3 (+75 ms) : Raccordement Direct & Économie de Cycle',
    expertTag: '⚡ Expert Forage & Abattage',
    body: [
      "Comme dans le standard SMI 9m², le Groupe 3 (+75 ms) assure le raccordement direct avec le contour (radier, parements, voûte).",
      "Le Groupe 4 est totalement supprimé, ce qui fait économiser 10 trous par rapport à un schéma non optimisé.",
      "Résultat : Temps de forage réduit de 35 minutes par volée et économie de 11 kg d'explosifs."
    ],
    showSchema: true,
    highlightStep: 'g3',
    schemaType: '9m2_intl',
    metrics: [
      { label: 'Suppression G4', value: '-10', unit: 'trous' },
      { label: 'Temps Gagné / Volée', value: '-35', unit: 'min' },
      { label: 'Rendement Avancement', value: '> 95', unit: '%' }
    ]
  },
  {
    kicker: 'FINITION DU CONTOUR 9M² INTL',
    title: 'Radier, Parements & Voûte (100 à 125 ms)',
    expertTag: '⚡ Expert Forage & Abattage',
    body: [
      "• Radier (4 trous à +100 ms) : Forés avec un piqué de 3° vers le bas pour maintenir la sole plate.",
      "• Parements (4 trous à +100 ms) : Dépouille légère de 1.5° vers l'extérieur pour garantir une largeur de 3.0 m.",
      "• Voûte (3 trous à +125 ms en DERNIER) : Profilage en arc cintré avec 1 cartouche de TOVEX 100g pour préserver le toit."
    ],
    showSchema: true,
    highlightStep: 'voute',
    schemaType: '9m2_intl',
    safety: "Alerte Voûte : Le tir de voûte doit impérativement avoir lieu en dernier (D5 à 125 ms) pour s'appuyer sur la cavité entièrement libre."
  },
  {
    type: 'formula',
    kicker: 'COMPARATIF 9M² SMI VS INTL',
    title: 'Analyse Comparative : 9m² SMI (1 Vide) vs 9m² INTL (3 Vides)',
    expertTag: '💣 Expert Explosifs & Chimiste',
    body: [
      "Comparatif technique des deux plans de tir en section 9m² :",
      "• 9m² SMI : 28 trous total | 1 vide central | 27 trous chargés | 3.10 kg TOVEX + 28.35 kg ANFO = 31.45 kg d'explosifs.",
      "• 9m² INTL : 30 trous total | 3 vides centraux | 27 trous chargés | 3.10 kg TOVEX + 28.35 kg ANFO = 31.45 kg d'explosifs.",
      "• Enseignement : La masse d'explosifs et le nombre de trous chargés (27) sont IDENTIQUES. La variante International ajoute simplement 2 trous vides au bouchon pour fiabiliser le tir en roche très dure (> 150 MPa)."
    ],
    metrics: [
      { label: 'SMI 9m² Trous Vides', value: '1', subtext: '28 trous total' },
      { label: 'INTL 9m² Trous Vides', value: '3', subtext: '30 trous total' },
      { label: 'Charge Explosifs', value: '31.45', unit: 'kg (identique)' }
    ]
  },
  {
    kicker: 'RÈGLE DE L\'ART LANGEFORS 9M²',
    title: 'Synthèse des Recommandations du Standard 9m² International',
    expertTag: '🎓 Synthèse Générale des 5 Experts',
    body: [
      "1. Forer les 3 trous vides du bouchon parfaitement horizontaux et alignés.",
      "2. Conserver une tolérance de déviation inférieure à 1.0% sur la volée de 1.8 m ou 2.4 m.",
      "3. Appliquer la formule de bourrage rétenteur de 76 cm sur les 27 trous chargés.",
      "4. En roche très dure (> 180 MPa), privilégier systématiquement le schéma 9m² International à 3 vides."
    ],
    ruleOfArt: "Règle d'Or 9m² INTL : Les 2 trous vides supplémentaires apportent 200% de volume d'expansion en plus sans consommer un seul gramme d'explosif !"
  },
  {
    type: 'quiz',
    kicker: 'SLIDE 13 — TEST DE VALIDATION',
    title: 'Évaluation : Traçage 9m² International',
    expertTag: '🎓 Formateur Pédagogique',
    body: ["Validez vos connaissances sur le schéma 9m² International Langefors."],
    quiz: {
      question: "Quelle est la différence principale entre le schéma 9m² SMI et le schéma 9m² International Langefors ?",
      options: [
        "Le schéma International utilise 50% d'explosifs en plus",
        "Le schéma International possède 3 trous vides alignés au bouchon (au lieu d'un seul en SMI) tout en conservant 27 trous chargés",
        "Le schéma SMI supprime les trous de voûte",
        "Le schéma International nécessite un profilage de 12m²"
      ],
      correctAnswer: 1,
      explanation: "Le schéma 9m² International ajoute 2 trous vides centraux supplémentaires (3 vides au total) pour faciliter le déconfinement en roche dure, tout en gardant exactement 27 trous chargés et la même consommation d'explosifs (31.45 kg)."
    }
  },
  {
    type: 'synthesis',
    kicker: 'SLIDE 14 — FICHE MÉMOTECHNIQUE',
    title: 'Aide-Mémoire de Terrain 9m² International Langefors',
    expertTag: '🎓 Synthèse Générale des 5 Experts',
    body: [
      "• SECTION & TROUS : 9 m² (3.0m × 3.0m) | 30 trous total (3 Vides alignés, 27 Chargés)",
      "• BOUCHON INTL : 3 Vides centraux horizontalement + 4 Chargés en croix à 0ms (D0) avec 2 TOVEX (200g/trou)",
      "• AUTRES TROUS : 23 Trous chargés avec 1 TOVEX (100g/trou) + ANFO vrac",
      "• TOTAL EXPLOSIFS : 3.10 kg TOVEX (31 cartouches 100g) + 28.35 kg ANFO = 31.45 kg total",
      "• SÉQUENCE : Bouchon D0 (0ms) -> G1 (25ms) -> G2 (50ms) -> G3 (75ms) -> Radier/Parements (100ms) -> Voûte D5 (125ms)",
      "• BOURRAGE : 76 cm d'argile compactée obligatoire sur l'ensemble des 27 trous chargés",
      "• AVANTAGE INTL : Surface libre triple au bouchon pour roches très dures (> 150 MPa) sans surcoût d'explosifs"
    ]
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
      "• ANFO (94% Nitrate d'Ammonium + 6% Fioul) : Explosif vrac à forte production de gaz poussants. Densité 0.85 g/cm³. VOD de 3 200 m/s. Nécessite une onde de choc initiale puissante pour s'amorcer.",
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
    kicker: 'ORDRE STRICT DE CHARGEMENT',
    title: 'Séquence Opérationnelle de Chargement du Trou',
    expertTag: '💣 Expert Explosifs & Chargement',
    body: [
      "Le chargement d'un trou de mine souterrain répond à un ordre chronologique strict et non négociable :",
      "1. POUX DE TROU : Insufflation d'air comprimé au tuyau rigide pour évacuation des boues de forage et de l'eau stagnante.",
      "2. AMORÇAGE DE FOND (TOVEX) : Enfilage du détonateur dans la cartouche de TOVEX (100g ou 200g au bouchon) et poussée au fond du trou.",
      "3. COLONNE D'ANFO : Injection pneumatique à 5 bar de l'ANFO depuis le fond vers l'embouchure sur la longueur calculée.",
      "4. BOURRAGE RÉTENTEUR (ARGILE) : Tassage d'une cartouche d'argile compactée de 76 cm à l'embouchure du trou."
    ],
    ruleOfArt: "Règle Absolue : Ne jamais inverser l'ordre TOVEX -> ANFO -> Argile. Un détonateur placé au milieu de la colonne d'ANFO réduit la brisance de fond de 50% !"
  },
  {
    kicker: 'MONTAGE CARTOUCHE AMORCE',
    title: 'Confection de la Cartouche Amorce & Détonateur',
    expertTag: '💣 Expert Explosifs',
    body: [
      "La confection de la cartouche amorce est l'acte le plus délicat de la préparation du tir :",
      "• Perforation de la Cartouche : Utiliser exclusivement un poinçon en bois ou en plastique rigide (anti-étincelle) pour percer le TOVEX.",
      "• Insertion du Détonateur : Insérer le détonateur électrique/pyrotechnique à retard (délai ±2-5ms) dans l'axe de la cartouche.",
      "• Verrouillage : Réaliser une demi-clé avec les fils ou le tube Signal Tube autour de la cartouche pour éviter l'arrachage lors du poussage au fond du trou.",
      "Orientation : L'œillet d'amorçage du détonateur doit être orienté vers la colonne d'ANFO (vers l'embouchure)."
    ],
    safety: "Alerte Sécurité : Interdiction absolue d'utiliser un objet métallique (clou, tournevis) pour percer la cartouche de TOVEX !"
  },
  {
    kicker: 'GÉRER L\'EAU AU FRONT',
    title: 'Techniques de Chargement en Trou Mouillé',
    expertTag: '🪨 Expert Géotechnique & Explosifs',
    body: [
      "L'eau présente dans les trous de forage est l'ennemi numéro 1 de l'ANFO (dissolution du nitrate d'ammonium).",
      "1. Test d'Humidité : Introduire le tuyau de chargeur pneumatique. Si de l'eau sort en continu sous pression d'air, le trou est classé 'mouillé'.",
      "2. Solution Gaine Plastique : Insérer une gaine polyéthylène transparente fermée au fond avant d'injecter l'ANFO à l'intérieur de la gaine.",
      "3. Solution TOVEX Continu : Pour les trous du radier très humides, remplacer la colonne d'ANFO par du TOVEX en cartouches continues bout à bout."
    ],
    metrics: [
      { label: 'Perte Énergie ANFO + Eau', value: '100', unit: '%' },
      { label: 'Épaisseur Gaine', value: '150', unit: 'µm' },
      { label: 'Pression Purge Air', value: '6', unit: 'bar' }
    ]
  },
  {
    kicker: 'INJECTION PNEUMATIQUE',
    title: 'Pression & Vitesse d\'Éjection de l\'ANFO-Loader',
    expertTag: '💣 Expert Explosifs',
    body: [
      "L'ANFO est projeté dans le trou à l'aide d'un chargeur pneumatique sous pression réglée à $4.5 - 5.5\\text{ bar}$.",
      "• Densité Rechargée : L'impact pneumatique compacte les granules d'ANFO au fond du trou, faisant passer sa densité vrac de 0.80 à $0.95\\text{ g/cm³}$, ce qui augmente sa VOD à $3 600\\text{ m/s}$.",
      "• Électricité Statique : Le frottement de l'ANFO dans le tuyau génère jusqu'à 15 000 Volts de charge statique. Utiliser exclusivement un tuyau semi-conducteur noir relié à la terre de la mine."
    ],
    safety: "Alerte Statique : Un tuyau non semi-conducteur peut provoquer l'amorçage intempestif d'un détonateur électrique par décharge statique !"
  },
  {
    type: 'formula',
    kicker: 'FORMULE SCIENTIFIQUE BOURRAGE',
    title: 'Calcul Exact de la Longueur de Bourrage (20 × D)',
    expertTag: '💣 Expert Explosifs',
    body: [
      "Lorsqu'un trou détone, la pression des gaz monte à 10 000 bars en quelques micro-secondes.",
      "Sans bourrage rétenteur à l'embouchure, les gaz s'échappent à Mach 10 par l'ouverture (effet canon / coup soufflé) : 60% de l'énergie d'abattage est perdue !",
      "Formule scientifique SMI : $L_{\\text{bourrage}} = 20 \\times \\emptyset_{\\text{trou}}$",
      "Calcul pour taillant Ø 38 mm : $20 \\times 38\\text{ mm} = 760\\text{ mm} = 76\\text{ cm}$. Utiliser des cartouches d'argile plastique compactée sur 76 cm."
    ],
    metrics: [
      { label: 'Formule Bourrage', value: '20 × D', subtext: 'Règle universelle SMI' },
      { label: 'Longueur Cible Ø38', value: '76', unit: 'cm' },
      { label: 'Gain de Pression', value: '+60%', subtext: 'Gaz retenus dans le trou' }
    ]
  },
  {
    kicker: 'STOCKAGE & POUDRIÈRE',
    title: 'Gestion des Dépôts d\'Explosifs & Registre d\'Émargement',
    expertTag: '🛡️ Expert QHSE & Sécurité Mine',
    body: [
      "Le stockage des explosifs en mine souterraine est soumis à une réglementation stricte :",
      "1. Séparation Absolue : Les détonateurs et les explosifs (ANFO, TOVEX) doivent être stockés dans des poudrières distinctes éloignées d'au moins 50 mètres.",
      "2. Ventilation Permanente : L'alvéole de stockage doit être balayée par un flux d'air frais continu (> 2.0 m³/s).",
      "3. Double Émargement : Toute entrée ou sortie de cartouche fait l'objet d'un registre signé conjointement par le responsable poudrière et le boutefeu."
    ],
    safety: "Consigne Poudrière : Aucun explosif ou détonateur ne doit rester au front en fin de poste !"
  },
  {
    kicker: 'FACTEUR DE POUDRE (qs)',
    title: 'Calcul du Facteur de Poudre & Consommation Spécifique',
    expertTag: '💣 Expert Explosifs & Chimiste',
    body: [
      "Le facteur de poudre ($q_{s}$) exprime la quantité d'explosifs consommée par unité de volume de roche abattue :",
      "• Formule : $q_{s} = \\frac{\\text{Masse totale d'explosifs (kg)}}{\\text{Volume de galerie (m³)}}$.",
      "• Exemple 12m² SMI (volée 1.7m) : $q_{s} = \\frac{40.85\\text{ kg}}{20.4\\text{ m³}} = 2.00\\text{ kg/m³}$.",
      "• Plage Optimale : Un $q_{s}$ compris entre 1.8 et 2.2 kg/m³ garantit une excellente fragmentation sans sur-fissuration des parois."
    ],
    metrics: [
      { label: 'Masse Explosifs 12m²', value: '40.85', unit: 'kg' },
      { label: 'Volume Abattu', value: '20.4', unit: 'm³' },
      { label: 'Facteur Poudre (qs)', value: '2.00', unit: 'kg/m³' }
    ]
  },
  {
    kicker: 'DÉTONATEURS À RETARD',
    title: 'Raccordement Pyrotechnique & Séquences Micro-Délai (MS)',
    expertTag: '💣 Expert Explosifs',
    body: [
      "Les détonateurs électriques ou pyrotechniques à retard permettent de décaler la mise à feu des trous par tranches de 25 ms :",
      "• Série Court-Délai (MS) : D0 (0 ms), D1 (25 ms), D2 (50 ms), D3 (75 ms), D4 (100 ms), D5 (125 ms).",
      "• Raccordement en Série : Vérifier la continuité électrique de la ligne de tir avec un ohmmètre de sécurité intrinsèque (courant de mesure < 10 mA).",
      "• Précision du Délai : Une tolérance de ±2 à 5 ms garantit que chaque groupe explose après l'évacuation complète de la roche du groupe précédent."
    ],
    metrics: [
      { label: 'Intervalle Court-Délai', value: '25', unit: 'ms' },
      { label: 'Courant Ohmmètre Max', value: '< 10', unit: 'mA' },
      { label: 'Précision Retard', value: '±2-5', unit: 'ms' }
    ]
  },
  {
    kicker: 'RÈGLE DE L\'ART BOUTEFEU',
    title: 'Les Bonnes Pratiques de Chargement du Boutefeu Certifié',
    expertTag: '🎓 Synthèse Générale des 5 Experts',
    body: [
      "1. Toujours vérifier la propreté du trou avant introduction du TOVEX.",
      "2. Maintenir une pression d'injection d'ANFO constante (5 bar) pour éviter les cavités d'air dans la colonne.",
      "3. Ne jamais compacter le bourrage d'argile avec un outil métallique.",
      "4. Mettre à la terre le chargeur pneumatique avant toute manipulation."
    ],
    ruleOfArt: "Règle de l'Expert Boutefeu : La qualité du bourrage d'argile (76 cm) équivaut à 20% d'explosif supplémentaire en termes d'énergie utile !"
  },
  {
    type: 'quiz',
    kicker: 'SLIDE 13 — TEST DE VALIDATION',
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
  },
  {
    type: 'synthesis',
    kicker: 'SLIDE 14 — FICHE MÉMOTECHNIQUE',
    title: 'Aide-Mémoire de Terrain Ingénierie des Explosifs',
    expertTag: '🎓 Synthèse Générale des 5 Experts',
    body: [
      "• PRODUITS : TOVEX (Hydrogel VOD 4800 m/s) + ANFO (Nitrate-Fioul VOD 3200 m/s)",
      "• AMORÇAGE BOUCHON : 2 Cartouches TOVEX 100g (200g) par trou chargé du bouchon",
      "• AMORÇAGE AUTRES TROUS : 1 Cartouche TOVEX 100g par trou au fond",
      "• ORDRE STRICT : Insufflation -> TOVEX fond -> ANFO pneumatique (5 bar) -> Argile (76 cm)",
      "• FORMULE BOURRAGE : 20 × D (76 cm d'argile compactée pour Ø 38 mm)",
      "• TROUS MOUILLÉS : Utiliser une gaine polyéthylène étanche ou du TOVEX continu",
      "• SÉCURITÉ STATIQUE : Tuyau d'ANFO-loader semi-conducteur relié à la terre obligatoire"
    ]
  }
];

// ==========================================
// 5. MODULE SÉCURITÉ & PRÉVENTION QHSE
// ==========================================
const SLIDES_SECURITE: Slide[] = [
  {
    type: 'intro',
    kicker: 'SLIDE 01 — PRÉVENTION SOUTERRAINE',
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
    kicker: 'ARROSAGE DU FRONT',
    title: 'Abattage des Poussières de Silice & Révélation de la Roche',
    expertTag: '🛡️ Expert QHSE & Santé Mine',
    body: [
      "L'arrosage abondant du front de taille à la lance à eau haute pression est la première opération physique au retour du tir :",
      "• Abattage de la Silice : L'eau piège les micro-particules de silice libre alvéolaire (< 5 µm) responsables de la silicose pulmonaire.",
      "• Révélation des Fractures : La roche mouillée révèle les micro-fissures de découpe, les blocs instables en voûte et la présence de culots masqués sous la poussière.",
      "• Dissolution de l'ANFO Résiduel : L'eau dissout instantanément les éventuels résidus de nitrate d'ammonium insérés dans les crevasses."
    ],
    safety: "Alerte Santé : Ne jamais purger ou forer sur un front sec sans arrosage préalable !"
  },
  {
    kicker: 'TECHNIQUE DE PURGE',
    title: 'Sonorisation Acoustique & Purge Méthodique à la Barre Aluminium',
    expertTag: '🛡️ Expert QHSE & Sécurité Mine',
    body: [
      "La purge de la roche décollée est l'opération la plus exposée du mineur :",
      "• Équipement : Barre de purge en tube d'aluminium rigide avec pointe en acier (longueur 2.5m à 3.5m selon la hauteur de voûte).",
      "• Positionnement : Toujours se tenir sous une zone déjà purgée et boulonnée, à un angle de 45° par rapport à l'écaille ciblée.",
      "• Sonorisation Acoustique : Taper la roche avec la pointe de la barre. Un son clair et métallique indique une roche saine et compacte. Un son mat, creux ou 'sourd' indique une écaille décollée à faire tomber immédiatement."
    ],
    ruleOfArt: "Règle de Purge : Purger toujours de l'extérieur vers le front (de l'arrière vers l'avant) et du haut vers le bas !"
  },
  {
    kicker: 'ÉQUIPEMENTS DE PROTECTION',
    title: 'Équipements Individuels (EPI) & Détecteur Multigaz Portable',
    expertTag: '🛡️ Expert QHSE',
    body: [
      "Tout intervenant en zone souterraine doit porter la panoplie complète des EPI certifiés SMI :",
      "• Casque de sécurité avec jugulaire 4 points et lampe frontale LED minier (min 10 000 Lux).",
      "• Bottes de sécurité coquées étanches avec semelle anti-perforation en acier.",
      "• Détecteur multigaz portable (O2, CO, NO2, H2S) étalonné et fixé au niveau du torse.",
      "• Auto-sauveteur à oxygène chimique (durée 30-60 min) porté à la ceinture en permanence."
    ],
    metrics: [
      { label: 'Autonomie Lampe', value: '12', unit: 'heures' },
      { label: 'Efficacité Autosafe', value: '60', unit: 'min' },
      { label: 'Seuil Alarme CO', value: '20', unit: 'ppm' }
    ]
  },
  {
    kicker: 'PÉRIMÈTRE DE TIR',
    title: 'Protocole d\'Évacuation, Barrages & Postes de Garde',
    expertTag: '🛡️ Expert QHSE & Direction Mine',
    body: [
      "Avant toute mise à feu, le boutefeu doit appliquer le protocole d'évacuation générale :",
      "1. Évacuation de Zone : Évacuer tout le personnel dans un rayon de 150 mètres minimum autour du tir.",
      "2. Barrages Physiques : Placer des barrières croisées 'TIR EN COURS - ACCÈS INTERDIT' sur toutes les galeries d'accès.",
      "3. Postes de Garde : Positionner des gardes de tir humains aux intersections principales.",
      "4. Signal Sonore : Émettre 3 coups de sirène prolongés avant le déclenchement de la ligne de tir."
    ],
    safety: "Règle Absolue : Un tir ne doit JAMAIS être déclenché si un poste de garde n'a pas confirmé le verrouillage de sa galerie !"
  },
  {
    kicker: 'GESTION DES CULOTS',
    title: 'Règle d\'Or des Culots de Trous : Marquage Fluo & 20 cm d\'Écart',
    expertTag: '🛡️ Expert QHSE & Sécurité',
    body: [
      "Un culot de trou est le fond d'un trou de mine restant visible sur le front après le tir.",
      "DANGER EXTRÊME : Le culot peut abriter une cartouche de TOVEX non explosée ou un détonateur intact masqué sous la poussière.",
      "1. INTERDICTION STRICTE DE FORER DANS UN CULOT EXISTANT OU D'Y INTRODUIRE UN OUTIL MÉTALLIQUE !",
      "2. Repérez et marquez TOUS les culots visibles à la peinture ROUGE FLUO.",
      "3. Tout nouveau trou foré doit respecter une distance minimale de 20 cm parallèles par rapport au culot.",
      "4. Traitement d'un raté : Seul le chef de tir habilité peut rincer le trou à l'eau sous faible pression ou ré-amorcer après évacuation du chantier."
    ],
    safety: "Forer dans un culot charged est la première cause de mortalité par explosion involontaire en mine souterraine.",
    metrics: [
      { label: 'Distance Forage / Culot', value: '≥ 20', unit: 'cm' },
      { label: 'Marquage Obligatoire', value: 'FLUO', subtext: 'Peinture Rouge' }
    ]
  },
  {
    kicker: 'PROCÉDURE POUR TIR RATÉ',
    title: 'Traitement Méthodique d\'un Misfire (Raté de Tir)',
    expertTag: '🛡️ Expert QHSE & Chef Boutefeu',
    body: [
      "En cas d'absence de détonation ou de tir partiel (misfire) :",
      "1. Délai d'Attente Obligatoire : Maintien du périmètre de sécurité pendant 30 minutes minimum.",
      "2. Inspection Exclusive : Seul le chef de tir certifié est autorisé à s'approcher du front.",
      "3. Neutralisation à l'Eau : Rincer le trou à la lance à eau douce sans pression pour dissoudre l'ANFO résiduel.",
      "4. Ré-Amorçage Contrôlé : En cas de présence de TOVEX, introduire une nouvelle cartouche amorce neuve et tirer à nouveau après évacuation de la mine."
    ],
    safety: "Alerte Misfire : Interdiction absolue de tenter d'extraire une cartouche de TOVEX coincée à l'aide d'une pince ou d'un crochet !"
  },
  {
    kicker: 'SOUTÈNEMENT DU TOIT',
    title: 'Boulonnage de Confortement & Maillage de Sécurité',
    expertTag: '🪨 Expert Géotechnique & Sécurité',
    body: [
      "Après arrosage et purge, le soutènement immédiat du toit et des parements est obligatoire :",
      "• Boulons à Friction (Split Set) ou à Résine : Posés selon une maille régulière $1.0\\text{m} \\times 1.0\\text{m}$ en voûte.",
      "• Grillage Métallique Tressé : Placé pour retenir les petites écailles (< 50 mm) entre les plaques de boulons.",
      "• Contrôle de Traction : Test de tirage de boulons (pull-test) sur 1 boulon sur 20 (résistance minimale 8 à 10 tonnes)."
    ],
    metrics: [
      { label: 'Maille Boulonnage', value: '1.0 × 1.0', unit: 'm' },
      { label: 'Résistance Pull-Test', value: '8-10', unit: 'tonnes' },
      { label: 'Maillage Grillage', value: '50 × 50', unit: 'mm' }
    ]
  },
  {
    kicker: 'SÉCURITÉ ÉLECTRIQUE',
    title: 'Prévention des Amorçages Intempestifs & Mise à la Terre',
    expertTag: '⚡ Expert Électrique & QHSE',
    body: [
      "Les détonateurs électriques peuvent être déclenchés involontairement par des courants vagabonds, des fuites de câbles ou de la foudre en surface :",
      "• Shuntage des Fils : Conserver les fils de détonateur court-circuités (shuntés) jusqu'au raccordement final.",
      "• Éteindre les Émetteurs Radio : Couper les talkies-walkies et téléphones mobiles à moins de 10 mètres de la ligne de tir.",
      "• Isoler de la Foudre : Lors d'orages en surface, suspendre immédiatement tout raccordement électrique au fond."
    ],
    safety: "Alerte Électrique : Test de continuité de ligne interdit avec un multimètre classique !"
  },
  {
    kicker: 'CHARTE QHSE SOUTERRAIN',
    title: 'Les Commandements de Sécurité Absolue CHANTIER MINIER (X)',
    expertTag: '🎓 Synthèse Générale des 5 Experts',
    body: [
      "1. Aérage forcé 30 min minimum après chaque tir.",
      "2. Arrosage systématique du front avant toute intervention.",
      "3. Purge méthodique sous zone couverte avec barre alu de 2.5-3.5m.",
      "4. Interdiction absolue de forer dans un culot (écartement 20 cm).",
      "5. Port permanent du détecteur multigaz et de l'auto-sauveteur."
    ],
    ruleOfArt: "Règle de Vie Minière : Aucun mètre d'avancement ne vaut le risque d'une vie humaine !"
  },
  {
    type: 'quiz',
    kicker: 'SLIDE 13 — TEST DE VALIDATION',
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
  },
  {
    type: 'synthesis',
    kicker: 'SLIDE 14 — FICHE MÉMOTECHNIQUE',
    title: 'Aide-Mémoire de Terrain Sécurité & QHSE',
    expertTag: '🎓 Synthèse Générale des 5 Experts',
    body: [
      "• AÉRAGE POST-TIR : 20-30 min à débit ≥ 3.0 m³/s | CO < 20 ppm | NO2 < 3 ppm | O2 > 19.5%",
      "• TRIPTYQUE FRONT : 1. Aérage -> 2. Arrosage abondant -> 3. Purge méthodique à la barre alu",
      "• SONORISATION : Son clair = roche saine | Son mat/sourd = écaille instable à faire tomber",
      "• CULOTS DE TROU : Interdiction de forer dedans | Marquage rouge fluo | Distance ≥ 20 cm",
      "• MISFIRE / RATÉ : Attente 30 min | Inspection exclusive par chef de tir | Rincage eau douce",
      "• PÉRIMÈTRE : Évacuation 150 m | Barrages physiques + 3 coups de sirène",
      "• EPI OBLIGATOIRES : Casque jugulaire, bottes coquées, auto-sauveteur à la ceinture, détecteur multigaz"
    ]
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
      "Ce module enseigne l'analyse du profil du tas de minerai (muckpile), la mesure de la granulométrie (D50), la détection du sur-profil (overbreak) et les corrections à apporter immédiatement pour la volée suivante.",
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
    kicker: 'ANALYSE DU MUCKPILE',
    title: 'Profils du Tas de Minerai & Distribution de l\'Énergie',
    expertTag: '🪨 Expert Géotechnique',
    body: [
      "• TAS CONCENTRÉ À PENTE RÉGULIÈRE (Idéal) : Le tas s'étale régulièrement à 10-12m du front. Signe d'un foisonnement parfait et d'une excellente distribution de l'énergie.",
      "• TAS PROJETÉ TRÈS LOIN (> 25m) : Résultat d'un sur-dosage en ANFO ou d'un manque de bourrage. Risque d'endommager les câbles d'aérage et matériels.",
      "• TAS BLOQUÉ EN CLOCHE CONTRE LE FRONT : Roche compactée avec gros blocs. Signale un échec du bouchon (manque de surface libre) ou un tir de voûte prématuré."
    ],
    ruleOfArt: "Examinez la pente du tas avant d'engager le godet de la chargeuse LHD !"
  },
  {
    kicker: 'GRANULOMÉTRIE D50 & D80',
    title: 'Mesure de la Fragmentation & Détection des Blocos',
    expertTag: '🪨 Expert Géotechnique & Mahrinage',
    body: [
      "La granulométrie du minerai abattu conditionne directement la vitesse de marinage par les chargeuses LHD et l'usure des concasseurs en surface :",
      "• Granulométrie Cible ($D_{50}$) : $50\\%$ des blocs doivent avoir un diamètre inférieur à $250\\text{ mm}$.",
      "• Taille Maximale ($D_{80}$) : $80\\%$ des blocs sous $400\\text{ mm}$.",
      "• Blocos (> 600 mm) : La présence de blocs incassés volumineux nécessite un pétardage secondaire ou un brise-roche hydraulique (BRH), représentant un surcoût de 15 MAD/tonne."
    ],
    metrics: [
      { label: 'Cible D50', value: '250', unit: 'mm' },
      { label: 'Seuil D80', value: '400', unit: 'mm' },
      { label: 'Coût Blocos BRH', value: '+15', unit: 'MAD/t' }
    ]
  },
  {
    kicker: 'SUR-PROFIL (OVERBREAK)',
    title: 'Détection & Chiffrage du Sur-Profil (< 8% Max)',
    expertTag: '🪨 Expert Géotechnique & Topographie',
    body: [
      "Le sur-profil (overbreak) correspond au volume de roche abattu accidentellement en dehors du gabarit théorique (12m² ou 9m²) :",
      "• Conséquences Financières : Un sur-profil de 15% augmente le volume de marinage non rémunéré et exige 20% de béton projeté supplémentaire pour combler les cavités.",
      "• Causes Principales : Angle de dépouille exagéré des parements (> 3°), sur-chargement en ANFO dans la voûte ou déviation des trous de contour.",
      "• Seuil Toléré SMI : Hors-profil strictement inférieur à 8% de la section théorique."
    ],
    metrics: [
      { label: 'Hors-Profil Cible', value: '< 8', unit: '%' },
      { label: 'Surcoût Béton 15%', value: '+20', unit: '%' },
      { label: 'Tolérance Dépouille', value: '1.5', unit: '°' }
    ]
  },
  {
    kicker: 'SOUS-PROFIL (UNDERBREAK)',
    title: 'Identification des \'Pattes\' et \'Ventres\' au Front',
    expertTag: '⚡ Expert Forage & Abattage',
    body: [
      "Le sous-profil (underbreak) est le reliquat de roche non abattue dépassant à l'intérieur du gabarit théorique :",
      "• Problématique : Réduit le gabarit de passage des camions de transport et des chargeuses.",
      "• Origine : Forage trop court des trous de radier, sous-dosage d'ANFO ou déviation vers l'intérieur du profil.",
      "• Traitement : Recipage manuel à la perforatrice pneumatique ou micro-tir de rattrapage."
    ],
    safety: "Alerte Chantier : Tout sous-profil au radier endommage la suspension et les pneus des chargeuses LHD !"
  },
  {
    kicker: 'INSPECTION DES CULOTS',
    title: 'Analyse de la Profondeur Restante & Banquettes',
    expertTag: '🪨 Expert Géotechnique & Forage',
    body: [
      "L'inspection des culots de trous après le marinage indique la qualité du fond de volée :",
      "• Culots Réduits (< 10 cm) : Signe d'un arrachement parfait sur toute la longueur forée.",
      "• Culots Longs (> 20 cm) : Indique un échec partiel de fond de trou (sous-dosage, absence de double TOVEX au bouchon ou humidité).",
      "• Banquettes en Sole : Présence de dalles non cisaillées au radier dues à un piqué insuffisant des trous de sole."
    ],
    metrics: [
      { label: 'Longueur Culot Idéale', value: '< 10', unit: 'cm' },
      { label: 'Culot Critique', value: '> 20', unit: 'cm' },
      { label: 'Piqué Sole Requis', value: '3-5', unit: '°' }
    ]
  },
  {
    type: 'formula',
    kicker: 'CALCUL RENDEMENT D\'ARRACHEMENT',
    title: 'Taux d\'Avancement Net (Rarrach = Lréel / Lforé × 100)',
    expertTag: '🎓 Formateur & Direction Mine',
    body: [
      "Le rendement net d'arrachement est le baromètre numéro 1 de la performance de tir :",
      "• Formule : $R_{\\text{arrach}} = \\frac{L_{\\text{avancement réel}}}{L_{\\text{longueur forée}}} \\times 100$.",
      "• Exemple pour tige 1.8m (longueur utiles 1.7m) : Si l'avancement mesuré est de 1.65 m, $R_{\\text{arrach}} = \\frac{1.65}{1.70} \\times 100 = 97.0\\%$.",
      "• Objectif Terrain SMI : Maintenir un rendement net d'arrachement supérieur à 95% sur toutes les volées de traçage."
    ],
    metrics: [
      { label: 'Rendement Cible', value: '> 95', unit: '%' },
      { label: 'Avancement Target 1.8m', value: '1.65', unit: 'm' },
      { label: 'Avancement Target 2.4m', value: '2.22', unit: 'm' }
    ]
  },
  {
    kicker: 'DIAGNOSTIC DU BOUCHON',
    title: 'Causes Principales d\'Échec du Bouchon Brûlé',
    expertTag: '⚡ Expert Forage & Explosifs',
    body: [
      "Lorsque la volée 'souffle' sans avancer (avancement < 50%), le bouchon est responsable dans 90% des cas :",
      "1. Déviation de Forage : Si les trous chargés convergent vers les trous vides, le burden s'annule et la roche se re-pacte.",
      "2. Oubli de la Double Cartouche TOVEX : Charger 1 seule cartouche au lieu de 2 (100g au lieu de 200g) ne fournit pas l'impulsion nécessaire au confinement triaxial.",
      "3. Écartement Excessif : Éloigner les 4 trous chargés du vide central de plus de 35 cm."
    ],
    ruleOfArt: "Règle de Correction : Ré-aligner les glissières du Jumbo et vérifier la double cartouche TOVEX de 100g !"
  },
  {
    kicker: 'AUDIT DE BOURRAGE',
    title: 'Traces d\'Effet Canon & Fuite de Pression',
    expertTag: '💣 Expert Explosifs',
    body: [
      "L'observation de l'embouchure des trous sur le front révèle la qualité du confinement :",
      "• Traces Noires Réglées : Brûlures circulaires à l'embouchure signifiant que les gaz ont été retenus par le bourrage jusqu'à la fracturation de la roche.",
      "• Traînées de Suie Linéaires (Effet Canon) : Les gaz se sont échappés à haute vitesse sans fracturer le massif.",
      "• Action Corrective : Rétablir la longueur de bourrage rétenteur d'argile à $20 \\times D = 76\\text{ cm}$ pour Ø 38 mm."
    ],
    metrics: [
      { label: 'Perte Énergie Effet Canon', value: '-60', unit: '%' },
      { label: 'Formule Rétablissement', value: '20 × D', subtext: '76 cm d\'argile' }
    ]
  },
  {
    kicker: 'IMPACT ÉCONOMIQUE',
    title: 'Calcul des Gains Financiers d\'un Tir Optimisé',
    expertTag: '🎓 Formateur & Direction Mine',
    body: [
      "L'impact d'une volée réussie sur la rentabilité globale du chantier est considérable :",
      "• Gain d'Avancement : Passer de 85% à 97% d'arrachement sur une tige 2.4m apporte $+0.28\\text{ m}$ par volée.",
      "• Gain Mensuel : Sur 30 volées par mois, cela représente $+8.4\\text{ mètres}$ de galerie créée sans aucun trou foré supplémentaire !",
      "• Valeur Financière : Représente un gain net de plus de 45 000 MAD par mois et par chantier."
    ],
    metrics: [
      { label: 'Gain Mensuel Avancement', value: '+8.4', unit: 'm / mois' },
      { label: 'Valeur Créée', value: '+45,000', unit: 'MAD / mois' },
      { label: 'ROI Optimisation', value: 'IMMÉDIAT', subtext: 'Dès la 1ère volée' }
    ]
  },
  {
    kicker: 'MATRICE DE CORRECTION',
    title: 'Guide de Décision Terrain : Symptôme -> Action',
    expertTag: '🎓 Synthèse Générale des 5 Experts',
    body: [
      "• Symptôme 1 : Gros blocs au sommet du tas -> Augmenter le dosage en voûte ou ajouter 1 trou tampon.",
      "• Symptôme 2 : Culots longs (> 20 cm) au bouchon -> Réduire l'écartement au vide et mettre 2 cartouches TOVEX (200g).",
      "• Symptôme 3 : Projections à plus de 25m -> Augmenter le bourrage d'argile à 76 cm et réduire l'ANFO de 10%.",
      "• Symptôme 4 : Sur-profil important en voûte -> Réduire la dépouille des trous du toit à 1.5° max."
    ],
    ruleOfArt: "Règle de l'Ingénieur : Une anomalie observée au tas doit être corrigée sur le schéma de la volée suivante !"
  },
  {
    type: 'quiz',
    kicker: 'SLIDE 13 — TEST DE VALIDATION',
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
  },
  {
    type: 'synthesis',
    kicker: 'SLIDE 14 — FICHE MÉMOTECHNIQUE',
    title: 'Aide-Mémoire de Terrain Diagnostic & Audit',
    expertTag: '🎓 Synthèse Générale des 5 Experts',
    body: [
      "• TARGET RENDEMENT : Avancement net ≥ 95% (1.65m pour tige 1.8m | 2.22m pour tige 2.4m)",
      "• GRANULOMÉTRIE CIBLE : D50 ≤ 250 mm | D80 ≤ 400 mm | Blocos (> 600 mm) à éliminer",
      "• MUCKPILE IDÉAL : Tas étalé à 10-12m du front à pente régulière | Pas de projections > 25m",
      "• OVERBREAK : Hors-profil strictement < 8% (contrôle de dépouille 1.5°)",
      "• CULOTS DE TROU : Inspection systématique | Culot < 10 cm = idéal | Culot > 20 cm = anomalie bouchon",
      "• BOURRAGE : Contrôle des traces d'effet canon | Maintien formule 20 × D = 76 cm d'argile",
      "• ACTION CONTINU : Toute déviation observée déclenche un réglage immédiat du schéma suivant"
    ]
  }
];

export const SLIDE_DECKS: Record<ExtendedModuleType, Slide[]> = {
  '12m2': SLIDES_12M2,
  '12m2_intl': SLIDES_12M2_INTL,
  '9m2': SLIDES_9M2,
  '9m2_intl': SLIDES_9M2_INTL,
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

    // Déclenche le vrai plein écran navigateur dès l'ouverture du diaporama.
    // Certains navigateurs bloquent requestFullscreen hors interaction utilisateur directe :
    // si ça échoue silencieusement (catch), l'overlay fixed inset-0 reste quand même
    // affiché en couverture totale de la fenêtre — comportement de repli acceptable.
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {
        // Échec silencieux toléré (ex: iframe, navigateur restrictif) — l'overlay
        // fixed inset-0 z-[9999] assure déjà une couverture visuelle complète.
      });
    }

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
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

  const handleDownloadSynthesis = () => {
    const allSlides = SLIDE_DECKS[gabarit] || slides;
    const moduleTitle = allSlides[0]?.title || 'Formation EXCELLENCE';

    const lines: string[] = [];
    lines.push('═'.repeat(70));
    lines.push('EXCELLENCE · OPÉRATIONS · INNOVATION · SMI IMITER');
    lines.push(`FICHE MÉMOTECHNIQUE DE TERRAIN — ${moduleTitle}`);
    lines.push('═'.repeat(70));
    lines.push('');

    allSlides.forEach((s, idx) => {
      if (s.type === 'sommaire') return; // pas de contenu utile à exporter
      lines.push('-'.repeat(70));
      lines.push(`[${idx + 1}] ${s.kicker || ''}`);
      lines.push(s.title);
      lines.push('-'.repeat(70));
      if (s.body?.length) {
        s.body.forEach(p => lines.push(p));
        lines.push('');
      }
      if (s.metrics?.length) {
        lines.push('DONNÉES CLÉS :');
        s.metrics.forEach(m => lines.push(`  • ${m.label} : ${m.value}${m.unit ? ' ' + m.unit : ''}${m.subtext ? ' (' + m.subtext + ')' : ''}`));
        lines.push('');
      }
      if (s.ruleOfArt) {
        lines.push(`RÈGLE DE L'ART : ${s.ruleOfArt}`);
        lines.push('');
      }
      if (s.safety) {
        lines.push(`⚠ SÉCURITÉ : ${s.safety}`);
        lines.push('');
      }
      if (s.quiz) {
        lines.push(`QUIZ : ${s.quiz.question}`);
        s.quiz.options.forEach((opt, i) => lines.push(`  ${i === s.quiz!.correctAnswer ? '✓' : ' '} ${opt}`));
        lines.push(`Explication : ${s.quiz.explanation}`);
        lines.push('');
      }
    });

    lines.push('═'.repeat(70));
    lines.push(`Document généré depuis la plateforme EXCELLENCE — ${new Date().toLocaleDateString('fr-FR')}`);
    lines.push('═'.repeat(70));

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `EXCELLENCE_Memo_${gabarit}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore la navigation clavier si le focus est sur un champ de saisie
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handlePrev();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        if (document.fullscreenElement) {
          document.exitFullscreen().catch(() => {});
        }
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [index, totalSlides, onClose]);

  useEffect(() => {
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, []);

  return (
    <div className="fixed inset-0 z-[9999] bg-gradient-to-b from-white via-amber-50/30 to-white flex flex-col justify-between overflow-hidden font-sans select-none">
      
      {/* Top Presentation Header Bar WITH BANNER EXCELLENCE IMAGE */}
      <div className="border-b border-amber-200 px-6 py-3.5 flex items-center justify-between shadow-sm relative z-20 overflow-hidden text-white bg-slate-900">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat pointer-events-none opacity-90"
          style={{ backgroundImage: `url(${bannerExcellenceImg})` }}
        />
        
        {/* Left: SMI Logo & Course Title */}
        <div className="flex items-center gap-4 relative z-10">
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
      <div className="flex-1 overflow-y-auto p-4 md:p-8 flex items-center justify-center relative bg-gradient-to-b from-slate-50 via-white to-slate-50">
        
        {/* Filigrane décoratif gauche — silhouette foreuse */}
        <svg
          className="hidden lg:block absolute left-0 top-1/2 -translate-y-1/2 w-48 h-96 pointer-events-none select-none"
          style={{ opacity: 0.04 }}
          viewBox="0 0 200 400"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect x="85" y="20" width="14" height="280" rx="4" fill="#0f172a" />
          <rect x="60" y="290" width="64" height="24" rx="6" fill="#0f172a" />
          <rect x="40" y="314" width="104" height="16" rx="4" fill="#0f172a" />
          <circle cx="92" cy="330" r="10" fill="#0f172a" />
          <circle cx="130" cy="330" r="10" fill="#0f172a" />
          <line x1="92" y1="340" x2="92" y2="380" stroke="#0f172a" strokeWidth="8" />
          <line x1="130" y1="340" x2="130" y2="380" stroke="#0f172a" strokeWidth="8" />
          <path d="M85 15 L92 0 L99 15 Z" fill="#0f172a" />
        </svg>

        {/* Filigrane décoratif droit — silhouette trou de mine (anneau + cible) */}
        <svg
          className="hidden lg:block absolute right-0 top-1/2 -translate-y-1/2 w-48 h-96 pointer-events-none select-none"
          style={{ opacity: 0.04 }}
          viewBox="0 0 200 400"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="100" cy="200" r="70" stroke="#0f172a" strokeWidth="6" />
          <circle cx="100" cy="200" r="45" stroke="#0f172a" strokeWidth="6" />
          <circle cx="100" cy="200" r="18" fill="#0f172a" />
          <line x1="100" y1="60" x2="100" y2="120" stroke="#0f172a" strokeWidth="4" />
          <line x1="100" y1="280" x2="100" y2="340" stroke="#0f172a" strokeWidth="4" />
          <line x1="-20" y1="200" x2="40" y2="200" stroke="#0f172a" strokeWidth="4" transform="translate(20,0)" />
          <line x1="160" y1="200" x2="220" y2="200" stroke="#0f172a" strokeWidth="4" transform="translate(-20,0)" />
        </svg>

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
                  onClick={handleDownloadSynthesis}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs uppercase tracking-wider rounded-xl flex items-center gap-2 transition-all cursor-pointer"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Download className="w-4 h-4" />}
                  {copied ? 'Téléchargé !' : 'Télécharger la fiche'}
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
      <div className="bg-slate-900 border-t border-amber-200 px-6 py-4 flex items-center justify-between shadow-2xl relative z-20">
        <button
          onClick={handlePrev}
          disabled={index === 0}
          className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white text-xs font-black uppercase tracking-wider rounded-xl flex items-center gap-2 transition-colors cursor-pointer border border-slate-700"
        >
          <ChevronLeft className="w-4 h-4" /> Précédent
        </button>

        <div className="flex items-center gap-4">
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
          <div className="hidden md:flex items-center gap-3 text-[10px] text-slate-500 font-mono">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-400">←</kbd>
              <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-400">→</kbd>
              Naviguer
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-slate-800 border border-slate-700 rounded text-slate-400">Esc</kbd>
              Quitter
            </span>
          </div>
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
