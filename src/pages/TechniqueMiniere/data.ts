import { HoleInfo, QuizQuestion } from './types';

export const HOLES_DATA: HoleInfo[] = [
  // BOUCHON BRÛLÉ (9 trous)
  // 3 trous vides (colonne centrale x=500)
  {
    id: 'v1',
    name: 'Bouchon - Trou Vide Central Supérieur',
    x: 500,
    y: 400,
    type: 'vide',
    label: 'V',
    desc: 'Trou vide d\'expansion. Offre un volume d\'expansion immédiat pour la roche cisaillée.',
    delay: 0
  },
  {
    id: 'v2',
    name: 'Bouchon - Trou Vide Central Médian',
    x: 500,
    y: 430,
    type: 'vide',
    label: 'V',
    desc: 'Épicentre de décompression du massif. Reçoit la première onde de choc.',
    delay: 0
  },
  {
    id: 'v3',
    name: 'Bouchon - Trou Vide Central Inférieur',
    x: 500,
    y: 460,
    type: 'vide',
    label: 'V',
    desc: 'Trou d\'expansion inférieur. Facilite l\'évacuation gravitaire initiale des débris.',
    delay: 0
  },
  // 3 trous chargés gauche (colonne gauche x=470)
  {
    id: 'c1',
    name: 'Bouchon - Trou Chargé Gauche Supérieur',
    x: 470,
    y: 400,
    type: 'charge',
    label: '0',
    desc: 'Amorçage instantané (0ms). Pousse la roche horizontalement vers le vide central.',
    delay: 0
  },
  {
    id: 'c2',
    name: 'Bouchon - Trou Chargé Gauche Médian',
    x: 470,
    y: 430,
    type: 'charge',
    label: '0',
    desc: 'Cisaillement direct vers le centre. Libère le premier bloc de roche solide.',
    delay: 0
  },
  {
    id: 'c3',
    name: 'Bouchon - Trou Chargé Gauche Inférieur',
    x: 470,
    y: 460,
    type: 'charge',
    label: '0',
    desc: 'Assure la fracturation de la semelle gauche du bouchon brûlé.',
    delay: 0
  },
  // 3 trous chargés droit (colonne droite x=530)
  {
    id: 'c4',
    name: 'Bouchon - Trou Chargé Droit Supérieur',
    x: 530,
    y: 400,
    type: 'charge',
    label: '0',
    desc: 'Amorçage instantané (0ms). Pousse la roche symétriquement vers le trou vide.',
    delay: 0
  },
  {
    id: 'c5',
    name: 'Bouchon - Trou Chargé Droit Médian',
    x: 530,
    y: 430,
    type: 'charge',
    label: '0',
    desc: 'Libération symétrique droite par cisaillement direct à haute pression.',
    delay: 0
  },
  {
    id: 'c6',
    name: 'Bouchon - Trou Chargé Droit Inférieur',
    x: 530,
    y: 460,
    type: 'charge',
    label: '0',
    desc: 'Assure la fracturation de la semelle droite du bouchon brûlé.',
    delay: 0
  },

  // GROUPE 1 (4 trous, bleu)
  {
    id: 'g1_1',
    name: 'Groupe d\'Élargissement 1 - Haut Gauche',
    x: 430,
    y: 360,
    type: 'g1',
    label: '1',
    desc: 'Élargissement 1er niveau (25ms). Pousse diagonalement vers la cavité centrale libérée.',
    delay: 25
  },
  {
    id: 'g1_2',
    name: 'Groupe d\'Élargissement 1 - Haut Droit',
    x: 570,
    y: 360,
    type: 'g1',
    label: '1',
    desc: 'Élargissement (25ms). Fragmente le massif supérieur et élargit le vide primaire.',
    delay: 25
  },
  {
    id: 'g1_3',
    name: 'Groupe d\'Élargissement 1 - Bas Gauche',
    x: 430,
    y: 500,
    type: 'g1',
    label: '1',
    desc: 'Élargissement (25ms). Éjecte les premiers blocs de base vers la cavité centrale.',
    delay: 25
  },
  {
    id: 'g1_4',
    name: 'Groupe d\'Élargissement 1 - Bas Droit',
    x: 570,
    y: 500,
    type: 'g1',
    label: '1',
    desc: 'Élargissement (25ms). Équilibre l\'abattage du premier anneau concentrique.',
    delay: 25
  },

  // GROUPE 2 (4 trous, rouge)
  {
    id: 'g2_1',
    name: 'Groupe d\'Élargissement 2 - Gauche',
    x: 340,
    y: 430,
    type: 'g2',
    label: '2',
    desc: 'Élargissement 2ème niveau (50ms). Cisaille la roche à gauche vers le vide grandissant.',
    delay: 50
  },
  {
    id: 'g2_2',
    name: 'Groupe d\'Élargissement 2 - Droite',
    x: 660,
    y: 430,
    type: 'g2',
    label: '2',
    desc: 'Élargissement (50ms). Cisaille la roche à droite vers le vide.',
    delay: 50
  },
  {
    id: 'g2_3',
    name: 'Groupe d\'Élargissement 2 - Haut',
    x: 500,
    y: 280,
    type: 'g2',
    label: '2',
    desc: 'Élargissement (50ms). Prépare la rupture de la section de voûte intermédiaire.',
    delay: 50
  },
  {
    id: 'g2_4',
    name: 'Groupe d\'Élargissement 2 - Bas',
    x: 500,
    y: 580,
    type: 'g2',
    label: '2',
    desc: 'Élargissement (50ms). Soulage l\'effort requis pour les trous de radier.',
    delay: 50
  },

  // GROUPE 3 (4 trous, cyan)
  {
    id: 'g3_1',
    name: 'Groupe d\'Élargissement 3 - Haut Gauche',
    x: 260,
    y: 240,
    type: 'g3',
    label: '3',
    desc: 'Élargissement 3ème niveau (75ms). Fragmente la roche en diagonale haute-gauche.',
    delay: 75
  },
  {
    id: 'g3_2',
    name: 'Groupe d\'Élargissement 3 - Haut Droit',
    x: 740,
    y: 240,
    type: 'g3',
    label: '3',
    desc: 'Élargissement (75ms). Fragmente la roche en diagonale haute-droite.',
    delay: 75
  },
  {
    id: 'g3_3',
    name: 'Groupe d\'Élargissement 3 - Bas Gauche',
    x: 260,
    y: 555,
    type: 'g3',
    label: '3',
    desc: 'Élargissement (75ms). Ébauche l\'angle inférieur gauche de la galerie.',
    delay: 75
  },
  {
    id: 'g3_4',
    name: 'Groupe d\'Élargissement 3 - Bas Droit',
    x: 740,
    y: 555,
    type: 'g3',
    label: '3',
    desc: 'Élargissement (75ms). Ébauche l\'angle inférieur droit de la galerie.',
    delay: 75
  },

  // GROUPE 4 (4 trous, orange)
  {
    id: 'g4_1',
    name: 'Groupe d\'Élargissement 4 - Gauche',
    x: 180,
    y: 430,
    type: 'g4',
    label: '4',
    desc: 'Élargissement final (100ms). Nettoie la zone médiane latérale gauche.',
    delay: 100
  },
  {
    id: 'g4_2',
    name: 'Groupe d\'Élargissement 4 - Droite',
    x: 820,
    y: 430,
    type: 'g4',
    label: '4',
    desc: 'Élargissement (100ms). Nettoie la zone médiane latérale droite.',
    delay: 100
  },
  {
    id: 'g4_3',
    name: 'Groupe d\'Élargissement 4 - Haut',
    x: 500,
    y: 170,
    type: 'g4',
    label: '4',
    desc: 'Élargissement (100ms). Libère l\'espace central vertical sous la clé de voûte.',
    delay: 100
  },
  {
    id: 'g4_4',
    name: 'Groupe d\'Élargissement 4 - Bas',
    x: 500,
    y: 615,
    type: 'g4',
    label: '4',
    desc: 'Élargissement (100ms). Assure l\'abaissement final de la sole de galerie.',
    delay: 100
  },

  // RADIER (4 trous, violet)
  {
    id: 'rad1',
    name: 'Trou de Radier 1 - Pied Gauche',
    x: 160,
    y: 635,
    type: 'radier',
    label: 'R',
    desc: 'Découpe du radier (125ms). Assure le niveau plat du sol dans le coin gauche.',
    delay: 125
  },
  {
    id: 'rad2',
    name: 'Trou de Radier 2 - Centre Gauche',
    x: 385,
    y: 635,
    type: 'radier',
    label: 'R',
    desc: 'Découpe du radier (125ms). Nivelle la sole et évite les bosselures de fond.',
    delay: 125
  },
  {
    id: 'rad3',
    name: 'Trou de Radier 3 - Centre Droit',
    x: 615,
    y: 635,
    type: 'radier',
    label: 'R',
    desc: 'Découpe du radier (125ms). Maintient le plat de chargement pour les engins.',
    delay: 125
  },
  {
    id: 'rad4',
    name: 'Trou de Radier 4 - Pied Droit',
    x: 840,
    y: 635,
    type: 'radier',
    label: 'R',
    desc: 'Découpe du radier (125ms). Profilage bas d\'angle droit.',
    delay: 125
  },

  // PAREMENTS (6 trous total, vert teal)
  // Gauche
  {
    id: 'pg1',
    name: 'Trou de Parement Gauche - Bas',
    x: 125,
    y: 570,
    type: 'parement',
    label: 'PG',
    desc: 'Découpe parement (125ms). Définit la verticalité inférieure de la paroi gauche.',
    delay: 125
  },
  {
    id: 'pg2',
    name: 'Trou de Parement Gauche - Milieu',
    x: 125,
    y: 450,
    type: 'parement',
    label: 'PG',
    desc: 'Découpe parement (125ms). Calibre la largeur utile de la galerie souterraine.',
    delay: 125
  },
  {
    id: 'pg3',
    name: 'Trou de Parement Gauche - Haut',
    x: 140,
    y: 330,
    type: 'parement',
    label: 'PG',
    desc: 'Découpe parement (125ms). Assure la transition avec la naissance de voûte.',
    delay: 125
  },
  // Droit
  {
    id: 'pd1',
    name: 'Trou de Parement Droit - Bas',
    x: 875,
    y: 570,
    type: 'parement',
    label: 'PD',
    desc: 'Découpe parement (125ms). Définit la verticalité inférieure de la paroi droite.',
    delay: 125
  },
  {
    id: 'pd2',
    name: 'Trou de Parement Droit - Milieu',
    x: 875,
    y: 450,
    type: 'parement',
    label: 'PD',
    desc: 'Découpe parement (125ms). Garantie la régularité et le profil utile droit.',
    delay: 125
  },
  {
    id: 'pd3',
    name: 'Trou de Parement Droit - Haut',
    x: 860,
    y: 330,
    type: 'parement',
    label: 'PD',
    desc: 'Découpe parement (125ms). Raccordement symétrique droit à la voûte.',
    delay: 125
  },

  // VOÛTE (3 trous, rose)
  {
    id: 'voute1',
    name: 'Trou de Voûte - Clé de Voûte (Centre)',
    x: 500,
    y: 80,
    type: 'voute',
    label: 'VC',
    desc: 'Tir contrôlé de voûte (125ms). Crée un arc régulier auto-portant très stable.',
    delay: 125
  },
  {
    id: 'voute2',
    name: 'Trou de Voûte - Flanc Gauche',
    x: 250,
    y: 200,
    type: 'voute',
    label: 'VL',
    desc: 'Tir contrôlé de voûte (125ms). Découpe l\'épaulement cintré gauche de la galerie.',
    delay: 125
  },
  {
    id: 'voute3',
    name: 'Trou de Voûte - Flanc Droit',
    x: 750,
    y: 200,
    type: 'voute',
    label: 'VL',
    desc: 'Tir contrôlé de voûte (125ms). Découpe l\'épaulement cintré droit de la galerie.',
    delay: 125
  }
];

export const HOLES_DATA_9: HoleInfo[] = [
  // BOUCHON CYLINDRIQUE (5 trous : 4 chargés + 1 vide central)
  {
    id: 'v9_1',
    name: 'Bouchon - Trou Vide Central',
    x: 500,
    y: 350,
    type: 'vide',
    label: 'V',
    desc: 'Trou vide d\'expansion. Offre un volume de dégagement initial central au cœur du massif.',
    delay: 0
  },
  {
    id: 'c9_1',
    name: 'Bouchon - Trou Chargé Haut',
    x: 500,
    y: 310,
    type: 'charge',
    label: '0',
    desc: 'Amorçage instantané (0ms). Pousse la roche verticalement vers le trou vide central.',
    delay: 0
  },
  {
    id: 'c9_2',
    name: 'Bouchon - Trou Chargé Bas',
    x: 500,
    y: 390,
    type: 'charge',
    label: '0',
    desc: 'Amorçage instantané (0ms). Pousse le massif inférieur vers la surface libre.',
    delay: 0
  },
  {
    id: 'c9_3',
    name: 'Bouchon - Trou Chargé Gauche',
    x: 460,
    y: 350,
    type: 'charge',
    label: '0',
    desc: 'Amorçage instantané (0ms). Pousse la roche horizontalement gauche vers le centre.',
    delay: 0
  },
  {
    id: 'c9_4',
    name: 'Bouchon - Trou Chargé Droite',
    x: 540,
    y: 350,
    type: 'charge',
    label: '0',
    desc: 'Amorçage instantané (0ms). Pousse la roche horizontalement droite vers le centre.',
    delay: 0
  },

  // GROUPE 1 (4 trous, bleu - delay 25ms, détonateur 1)
  {
    id: 'g1_9_1',
    name: 'Groupe d\'Élargissement 1 - Haut Gauche',
    x: 450,
    y: 290,
    type: 'g1',
    label: '1',
    desc: 'Élargissement (25ms). Fragmente la roche en diagonale supérieure gauche vers le vide créé.',
    delay: 25
  },
  {
    id: 'g1_9_2',
    name: 'Groupe d\'Élargissement 1 - Haut Droit',
    x: 550,
    y: 290,
    type: 'g1',
    label: '1',
    desc: 'Élargissement (25ms). Fragmente la roche en diagonale supérieure droite.',
    delay: 25
  },
  {
    id: 'g1_9_3',
    name: 'Groupe d\'Élargissement 1 - Bas Gauche',
    x: 450,
    y: 410,
    type: 'g1',
    label: '1',
    desc: 'Élargissement (25ms). Cisaille la base du cœur vers le centre libre.',
    delay: 25
  },
  {
    id: 'g1_9_4',
    name: 'Groupe d\'Élargissement 1 - Bas Droit',
    x: 550,
    y: 410,
    type: 'g1',
    label: '1',
    desc: 'Élargissement (25ms). Pousse diagonalement vers la droite.',
    delay: 25
  },

  // GROUPE 2 (4 trous, rouge - delay 50ms, détonateur 2)
  {
    id: 'g2_9_1',
    name: 'Groupe d\'Élargissement 2 - Gauche',
    x: 380,
    y: 350,
    type: 'g2',
    label: '2',
    desc: 'Élargissement 2ème niveau (50ms). Cisaille la roche latérale gauche.',
    delay: 50
  },
  {
    id: 'g2_9_2',
    name: 'Groupe d\'Élargissement 2 - Droite',
    x: 620,
    y: 350,
    type: 'g2',
    label: '2',
    desc: 'Élargissement 2ème niveau (50ms). Cisaille la roche latérale droite.',
    delay: 50
  },
  {
    id: 'g2_9_3',
    name: 'Groupe d\'Élargissement 2 - Haut',
    x: 500,
    y: 240,
    type: 'g2',
    label: '2',
    desc: 'Élargissement 2ème niveau (50ms). Crée de l\'espace sous la voûte.',
    delay: 50
  },
  {
    id: 'g2_9_4',
    name: 'Groupe d\'Élargissement 2 - Bas',
    x: 500,
    y: 460,
    type: 'g2',
    label: '2',
    desc: 'Élargissement 2ème niveau (50ms). Pousse et fragmente vers le bas du cœur.',
    delay: 50
  },

  // GROUPE 3 (4 trous, cyan - delay 75ms, détonateur 3)
  {
    id: 'g3_9_1',
    name: 'Groupe d\'Élargissement 3 - Haut Gauche',
    x: 320,
    y: 200,
    type: 'g3',
    label: '3',
    desc: 'Élargissement 3ème niveau (75ms). Débarrasse l\'épaule intermédiaire gauche.',
    delay: 75
  },
  {
    id: 'g3_9_2',
    name: 'Groupe d\'Élargissement 3 - Haut Droit',
    x: 680,
    y: 200,
    type: 'g3',
    label: '3',
    desc: 'Élargissement 3ème niveau (75ms). Débarrasse l\'épaule intermédiaire droite.',
    delay: 75
  },
  {
    id: 'g3_9_3',
    name: 'Groupe d\'Élargissement 3 - Bas Gauche',
    x: 320,
    y: 500,
    type: 'g3',
    label: '3',
    desc: 'Élargissement 3ème niveau (75ms). Prépare l\'angle inférieur gauche.',
    delay: 75
  },
  {
    id: 'g3_9_4',
    name: 'Groupe d\'Élargissement 3 - Bas Droit',
    x: 680,
    y: 500,
    type: 'g3',
    label: '3',
    desc: 'Élargissement 3ème niveau (75ms). Prépare l\'angle inférieur droit.',
    delay: 75
  },

  // RADIER (4 trous, violet - delay 100ms, détonateur 4)
  {
    id: 'rad9_1',
    name: 'Trou de Radier 1 - Pied Gauche',
    x: 300,
    y: 520,
    type: 'radier',
    label: 'R',
    desc: 'Découpe du radier (100ms). Niveau plat de la sole souterraine, coin gauche.',
    delay: 100
  },
  {
    id: 'rad9_2',
    name: 'Trou de Radier 2 - Centre Gauche',
    x: 420,
    y: 520,
    type: 'radier',
    label: 'R',
    desc: 'Découpe du radier (100ms). Assure le passage lisse des chargeuses au centre gauche.',
    delay: 100
  },
  {
    id: 'rad9_3',
    name: 'Trou de Radier 3 - Centre Droit',
    x: 580,
    y: 520,
    type: 'radier',
    label: 'R',
    desc: 'Découpe du radier (100ms). Assure le passage lisse des chargeuses au centre droit.',
    delay: 100
  },
  {
    id: 'rad9_4',
    name: 'Trou de Radier 4 - Pied Droit',
    x: 700,
    y: 520,
    type: 'radier',
    label: 'R',
    desc: 'Découpe du radier (100ms). Niveau plat de la sole souterraine, coin droit.',
    delay: 100
  },

  // PAREMENTS (4 trous, vert teal - delay 100ms, détonateur 4)
  {
    id: 'pg9_1',
    name: 'Trou de Parement Gauche - Bas',
    x: 280,
    y: 420,
    type: 'parement',
    label: 'PG',
    desc: 'Découpe parement gauche (100ms). Régule la verticalité inférieure gauche de la paroi.',
    delay: 100
  },
  {
    id: 'pg9_2',
    name: 'Trou de Parement Gauche - Haut',
    x: 280,
    y: 320,
    type: 'parement',
    label: 'PG',
    desc: 'Découpe parement gauche (100ms). Assure l\'alignement vertical supérieur gauche.',
    delay: 100
  },
  {
    id: 'pd9_1',
    name: 'Trou de Parement Droit - Bas',
    x: 720,
    y: 420,
    type: 'parement',
    label: 'PD',
    desc: 'Découpe parement droit (100ms). Régule la verticalité inférieure droite de la paroi.',
    delay: 100
  },
  {
    id: 'pd9_2',
    name: 'Trou de Parement Droit - Haut',
    x: 720,
    y: 320,
    type: 'parement',
    label: 'PD',
    desc: 'Découpe parement droit (100ms). Assure l\'alignement vertical supérieur droit.',
    delay: 100
  },

  // VOÛTE (3 trous, rose - delay 125ms, détonateur 5)
  {
    id: 'voute9_1',
    name: 'Trou de Voûte - Clé de Voûte (Centre)',
    x: 500,
    y: 150,
    type: 'voute',
    label: 'VC',
    desc: 'Tir contrôlé de voûte (125ms). Façonne l\'arc central supérieur de la galerie.',
    delay: 125
  },
  {
    id: 'voute9_2',
    name: 'Trou de Voûte - Flanc Gauche',
    x: 380,
    y: 190,
    type: 'voute',
    label: 'VL',
    desc: 'Tir contrôlé de voûte (125ms). Arrondit le coin latéral gauche sous l\'arc.',
    delay: 125
  },
  {
    id: 'voute9_3',
    name: 'Trou de Voûte - Flanc Droit',
    x: 620,
    y: 190,
    type: 'voute',
    label: 'VL',
    desc: 'Tir contrôlé de voûte (125ms). Arrondit le coin latéral droit sous l\'arc.',
    delay: 125
  }
];

export const getHolesData = (gabarit: '12m2' | '9m2'): HoleInfo[] => {
  return gabarit === '12m2' ? HOLES_DATA : HOLES_DATA_9;
};

export const QUIZ_DATA: QuizQuestion[] = [
  {
    id: 1,
    question: 'Quelle est la fonction principale des trous vides (vides de décharge) dans un bouchon brûlé ?',
    options: [
      'Contenir de plus grandes quantités d\'ANFO',
      'Offrir un volume d\'expansion libre pour que la roche cisaillée se dilate et s\'éjecte',
      'Éviter la propagation des vibrations vers les parements',
      'Réduire la poussière générée par le dynamitage'
    ],
    correctAnswer: 1,
    explanation: 'Dans un bouchon brûlé souterrain, les trous vides ne contiennent aucun explosif. Ils offrent l\'unique espace libre initial vers lequel la roche des trous chargés voisins se brise et s\'expanse. Sans ces trous vides, la roche resterait comprimée et la volée échouerait.'
  },
  {
    id: 2,
    question: 'Selon la formule scientifique validée à la SMI, quelle doit être la longueur minimale du bourrage (col de trou) ?',
    options: [
      'Lb = 5 × Diamètre du trou',
      'Lb = 10 × Diamètre du trou',
      'Lb = 20 × Diamètre du trou',
      'Lb = 50 × Diamètre du trou'
    ],
    correctAnswer: 2,
    explanation: 'La formule scientifique standard est Lb = 20 × D_trou. Pour un taillant de 38mm (0.038m), la longueur de bourrage optimale est de 20 × 38mm = 760mm (~76cm). Un bourrage plus court cause un coup soufflé, perdant l\'énergie utile des gaz.'
  },
  {
    id: 3,
    question: 'Quel type d\'énergie mécanique est principalement requis pour abattre la roche de fond et comment l\'ANFO la produit-il ?',
    options: [
      'Une onde thermique qui liquéfie la roche granitique',
      'La libération massive et continue de gaz chauds sous haute pression (effet pneumatique)',
      'Une impulsion électromagnétique intense cassant la silice',
      'Un cisaillement par cavitation ultrasonique'
    ],
    correctAnswer: 1,
    explanation: 'L\'ANFO est un explosif boulant (pneumatique) qui libère un volume géant de gaz chauds à ultra-haute pression. C\'est cette dilatation des gaz emprisonnés qui fissure le massif et pousse la roche fracturée vers l\'espace libre, d\'où le besoin absolu d\'un bourrage étanche.'
  },
  {
    id: 4,
    question: 'Pourquoi le tir des parements, du radier et de la voûte est-il retardé à l\'étape finale (125ms) ?',
    options: [
      'Pour laisser le temps au boutefeu de se cacher',
      'Parce que leurs détonateurs sont de mauvaise qualité',
      'Pour garantir que la zone centrale est complètement vide et évacuée, créant le vide nécessaire pour que la découpe finale se fasse sans contrainte',
      'Pour réduire le bruit global du tir'
    ],
    correctAnswer: 2,
    explanation: 'Les tirs périphériques (Radier, Parements, Voûte) profilent la galerie. Ils ne peuvent fonctionner correctement que si tout le cœur de la galerie (bouchon et élargissements) a déjà été broyé et éjecté. Ce décalage temporel garantit une découpe nette et stable.'
  },
  {
    id: 5,
    question: 'Quel est l\'effet immédiat sur le terrain d\'un défaut d\'alignement ou de parallélisme des trous lors du forage ?',
    options: [
      'La galerie se creuse plus vite car il y a moins de résistance',
      'Les trous divergent, le bourrage se fissure et on observe une perte majeure du métrage arraché (culots de trous importants)',
      'L\'ANFO explose avec une puissance doublée',
      'Aucun impact visuel ou opérationnel notable'
    ],
    correctAnswer: 1,
    explanation: 'Le non-parallélisme est la cause numéro un de perte de métrage. Si les trous divergent, la distance de moindre résistance (W) augmente en fond de trou au-delà de la capacité de l\'explosif. La roche de fond reste soudée au massif, créant de longs culots inutilisables.'
  }
];
