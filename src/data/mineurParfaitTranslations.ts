export interface Translation {
  title: string;
  subtitle: string;
  targetYield: string;
  excellence: string;
  fromBouchon: string;
  step: string;
  progression: string;
  btnEnLarge: string;
  btnEnLargePurge: string;
  btnEnLargeForage: string;
  btnEnLargeSoufflage: string;
  pressureSpecs: string;
  earSpecsTitle: string;
  earSpecsDesc: string;
  gallerySection: string;
  smiGabarit: string;
  intlGabarit: string;
  gabarit9m2: string;
  foreMustArrache: string;
  bourrageParfait: string;
  divergenceIdeale: string;
  trousRespectes: string;
  planTirInteractive: string;
  planTirInstruction: string;
  gabarit12m2Label: string;
  gabaritIntlLabel: string;
  gabarit9m2Label: string;
  ordreForageTitle: string;
  orderStepA: string;
  orderStepADesc: string;
  orderStepB: string;
  orderStepBDesc9m2: string;
  orderStepBDesc12m2: string;
  orderStepC: string;
  orderStepCDesc: string;
  orderRule: string;
  parallelismeTitle: string;
  parallelismeDesc: string;
  simulatorDeviation: string;
  angleDivergence: string;
  volumeArrache: string;
  rendementVolee: string;
  culotResiduel: string;
  angle: string;
  culot: string;
  arrache: string;
  rendement: string;
  purgeEquip: string;
  purgeEquipTitle: string;
  purgeEquipDesc1: string;
  purgeEquipDesc2: string;
  purgeSpecs1: string;
  purgeSpecs2: string;
  verdictPerfect: string;
  verdictExcellent: string;
  verdictAcceptable: string;
  verdictAttention: string;
  verdictCritique: string;
  verdictReformer: string;
  colonneConfigTitle: string;
  colonneConfig18: string;
  colonneConfig24: string;
  quantitiesTitle: string;
  qAnfoTotal: string;
  qTovex100g: string;
  qAmorces: string;
  qToCharge: string;
  lBourrageTitle: string;
  lBourrageDesc: string;
  lBourrageFormula: string;
  lBourrageMinimum: string;
  bourrageProcTitle: string;
  bourrageProc1: string;
  bourrageProc1a: string;
  bourrageProc1b: string;
  bourrageProc2: string;
  bourrageProc3: string;
  bourrageProc4: string;
  bourrageProc5: string;
  step10Desc: string;
  step10Grid1Title: string;
  step10Grid1Desc9m2: string;
  step10Grid1Desc12m2: string;
  step10Grid2Title: string;
  step10Grid2Desc12m2: string;
  step10Grid2DescIntl: string;
  step10Grid2Desc9m2: string;
  step10Grid3Title: string;
  step10Grid3Desc: string;
  step10Grid4Title: string;
  step10Grid4Desc: string;
  step10Grid5Title: string;
  step10Grid5Desc: string;
  step10Grid6Title: string;
  step10Grid6Desc: string;
  step10Alert: string;
  step1ShortTitle: string;
  step2ShortTitle: string;
  step3ShortTitle: string;
  step4ShortTitle: string;
  step5ShortTitle: string;
  step6ShortTitle: string;
  step7ShortTitle: string;
  step8ShortTitle: string;
  step9ShortTitle: string;
  step10ShortTitle: string;
  catTechnique: string;
  catSecurite: string;
  catForage: string;
  catExplosifs: string;
  lightboxPurgeTitle: string;
  lightboxForageTitle: string;
  lightboxSoufflageTitle: string;
  lightboxPurgeDesc: string;
  lightboxForageDesc: string;
  lightboxSoufflageDesc: string;
  stepHeaders: Array<{ num: number; icon: string; title: string; cat: string }>;
  step1Title: string;
  step1Grid: Array<{ title: string; text: string }>;
  step1Alert: string;
  step2Title: string;
  step2ProcTitle: string;
  step2Proc: string[];
  step2Alert: string;
  step3Title: string;
  step3Alert: string;
  step3ProcTitle: string;
  step3Proc: string[];
  step3AlertSilicose: string;
  step4Alert: string;
  step4Title: string;
  step4RuleTitle: string;
  step4Rules: string[];
  step4AlertSafety: string;
  step5Title: string;
  step5ChecklistTitle: string;
  step5Checklist: string[];
  step5FlexTitle: string;
  step5Flex: string[];
  step5SafetyAlert: string;
  step5NoiseTitle: string;
  step5NoiseDesc: string;
  step7Title: string;
  step7ChecklistTitle: string;
  step7Checklist: string[];
  step7Advice: string;
  step7VisualTitle: string;
  step7Alert: string;
  step8Title: string;
  step8TovexTitle: string;
  step8TovexProc: string[];
  step8PortanoleTitle: string;
  step8PortanoleProc: string[];
  step8QuantitiesTitle: string;
  step9Title: string;
  step9ChecklistTitle: string;
  step9Checklist: string[];
  step9ProcTitle: string;
  step9Proc: string[];
  step9AlertTitle: string;
  step9Alerts: string[];
  legendVide: string;
  legendBouchon: string;
  legendG1: string;
  legendG2: string;
  legendG3: string;
  legendG4: string;
  legendRadier: string;
  legendParements: string;
  legendVoute: string;
  activeGroupLabels: Record<string, string>;
}

export const t: Record<'fr' | 'ar', Translation> = {
  fr: {
    title: '⚠️ Anomalies et problèmes signalés',
    subtitle: 'SMI IMITER — Procédures Opérationnelles de Forage et Tir Haute Performance',
    targetYield: 'Rendement cible',
    excellence: '🎯 Excellence 100%',
    fromBouchon: 'Du bouchon au registre journalier',
    step: 'Étape',
    progression: 'Progression :',
    btnEnLarge: "Agrandir l'image",
    btnEnLargePurge: "Agrandir l'image",
    btnEnLargeForage: "Agrandir l'image",
    btnEnLargeSoufflage: "Agrandir l'image",
    pressureSpecs: '⚠️ Pressions nominales : Air 7-9 bar | Eau 4-6 bar',
    earSpecsTitle: '🎧 Protection auditive',
    earSpecsDesc: 'Port du casque antibruit obligatoire avant démarrage du perforateur. Niveau sonore forage : 100 dB à 110 dB. Exposition non protégée = perte auditive irréversible.',
    gallerySection: "Galerie d'illustrations techniques",
    smiGabarit: 'Gabarit SMI — 12 m²',
    intlGabarit: 'Gabarit International — 12 m²',
    gabarit9m2: 'Gabarit 9 m²',
    foreMustArrache: "Le forage doit dépasser la profondeur d'abattage de 10 cm minimum",
    bourrageParfait: 'Bourrage parfait',
    divergenceIdeale: 'Divergence idéale : 0°',
    trousRespectes: 'Trous respectés',
    planTirInteractive: 'Plan de tir interactif',
    planTirInstruction: 'Survolez les groupes pour voir la séquence de tir',
    gabarit12m2Label: 'Gabarit SMI 12 m²',
    gabaritIntlLabel: 'Gabarit International 12 m²',
    gabarit9m2Label: 'Gabarit 9 m²',
    ordreForageTitle: 'Ordre de forage par groupes',
    orderStepA: '1er : Trous de bouchon (D0)',
    orderStepADesc: 'Forer les trous de bouchon en premier — ils servent de référence pour tout le reste',
    orderStepB: '2ème : Groupes 1 à 4 (D1-D4)',
    orderStepBDesc9m2: 'Gabarit 9 m² : 4 groupes principaux (20 trous)',
    orderStepBDesc12m2: 'Gabarit 12 m² : 4 groupes principaux (24 trous)',
    orderStepC: 'Dernier : Trous de contour (D5)',
    orderStepCDesc: 'Radier, parements et voûte — tirés en dernier pour préserver la stabilité du front',
    orderRule: "⚠️ Règle d'or : ne pas commencer un groupe avant d'avoir terminé le précédent",
    parallelismeTitle: 'Simulation interactive : parallélisme et divergence',
    parallelismeDesc: 'Déplacez le curseur pour simuler la divergence de la perforatrice. Chaque degré de divergence fait perdre des centimètres de rendement.',
    simulatorDeviation: 'Simulateur de divergence',
    angleDivergence: 'Angle de divergence',
    volumeArrache: "Volume arraché",
    rendementVolee: 'Rendement de la volée',
    culotResiduel: 'Culot résiduel',
    angle: 'Angle',
    culot: 'Culot',
    arrache: 'Arrachement',
    rendement: 'Rendement',
    purgeEquip: 'Canne de purge',
    purgeEquipTitle: 'Canne de purge + tête de purge type 2',
    purgeEquipDesc1: 'Canne de purge (Scaling bar)',
    purgeEquipDesc2: "Lampe d'inspection manuelle",
    purgeSpecs1: 'Canne de purge : 1.5m ou 2.4m',
    purgeSpecs2: "Lampe d'inspection : 360° avec LED",
    verdictPerfect: 'Parfait — 0° de divergence',
    verdictExcellent: 'Excellent — ≤ 1° de divergence',
    verdictAcceptable: 'Acceptable — ≤ 2° de divergence',
    verdictAttention: 'Attention — 3° de divergence',
    verdictCritique: 'Critique — 4°+ de divergence',
    verdictReformer: 'À reformer — 5°+ de divergence',
    colonneConfigTitle: 'Configuration de la colonne de charge',
    colonneConfig18: 'Fleuret 1.8m — Forage 1.7m',
    colonneConfig24: 'Fleuret 2.4m — Forage 2.3m',
    quantitiesTitle: 'Quantités requises estimées',
    qAnfoTotal: 'ANFO total requis',
    qTovex100g: 'Cartouches TOVEX 100g',
    qAmorces: 'Amorces électriques',
    qToCharge: 'À charger',
    lBourrageTitle: 'Longueur de bourrage (Stemming)',
    lBourrageDesc: "Le bourrage confère à l'onde de choc la puissance nécessaire pour briser la roche au lieu de la dissiper dans l'air (Blow-out).",
    lBourrageFormula: 'Bourrage = Profondeur du trou - Profondeur de la charge',
    lBourrageMinimum: 'Bourrage minimum : 30 cm',
    bourrageProcTitle: 'Procédure de bourrage :',
    bourrageProc1: "1. Ne pas remplir le trou entièrement d'explosifs — laisser de la place pour le bourrage",
    bourrageProc1a: 'Fleuret 1.8m : bourrage 30 cm',
    bourrageProc1b: 'Fleuret 2.4m : bourrage 40 cm',
    bourrageProc2: "2. Utiliser de l'argile de bourrage ou du sable sec comme matériau de bourrage",
    bourrageProc3: '3. Bourrer en tassant (Tamping) — pas en comprimant violemment',
    bourrageProc4: '4. Le bourrage commence au-dessus de la charge et descend progressivement',
    bourrageProc5: '5. S\'assurer que le bourrage est compact et sans vides',
    step10Desc: "La déclaration dans le registre journalier est l'acte technique final du mineur. Elle alimente directement la plateforme HydroMines Production — les données doivent être exactes et complètes.",
    step10Grid1Title: '📊 Trous forés total',
    step10Grid1Desc9m2: '28 trous — conformes au plan',
    step10Grid1Desc12m2: '38 trous — conformes au plan',
    step10Grid2Title: '🔩 Répartition bouchon',
    step10Grid2Desc12m2: '3 vides + 6 chargés TOVEX',
    step10Grid2DescIntl: '6 vides + 3 chargés TOVEX',
    step10Grid2Desc9m2: '1 vide + 4 chargés TOVEX',
    step10Grid3Title: '📏 Fleuret utilisé',
    step10Grid3Desc: 'Fleuret 1.8m (forage 1.7m) ou Fleuret 2.4m (forage 2.3m)',
    step10Grid4Title: '💥 Explosifs consommés',
    step10Grid4Desc: 'ANFO : X kg | TOVEX : X cartouches | Amorces : X',
    step10Grid5Title: '📐 Métrage foré déclaré',
    step10Grid5Desc: '= Longueur fleuret × 1 (par trou) — hors trous vides',
    step10Grid6Title: '⏰ Heure de tir réelle',
    step10Grid6Desc: "Heure réelle du tir — comparer à l'heure planifiée",
    step10Alert: "Un registre inexact a des conséquences sur la traçabilité des explosifs et sur la sécurité du poste suivant. La précision du registre reflète la rigueur du mineur.",
    step1ShortTitle: 'PRISE DE POSTE ET CONSIGNES TECHNIQUES',
    step2ShortTitle: "VÉRIFICATION DE L'AÉRAGE",
    step3ShortTitle: 'ARROSAGE DU CHANTIER',
    step4ShortTitle: 'PURGE DU CHANTIER',
    step5ShortTitle: 'VÉRIFICATION DU MATÉRIEL DE FORAGE',
    step6ShortTitle: 'FORAGE — ATTEINDRE 100% DU MÉTRAGE',
    step7ShortTitle: 'VÉRIFICATION ET NETTOYAGE DES TROUS',
    step8ShortTitle: 'CHARGEMENT EXPLOSIFS',
    step9ShortTitle: 'PRÉ-TIR ET MISE À FEU',
    step10ShortTitle: 'SAISIE DU REGISTRE JOURNALIER',
    catTechnique: 'TECHNIQUE',
    catSecurite: 'SÉCURITÉ',
    catForage: 'FORAGE',
    catExplosifs: 'EXPLOSIFS',
    lightboxPurgeTitle: "🔍 Illustration : Canne de purge & Bec Type 2 (Agrandie)",
    lightboxForageTitle: "🔍 Illustration : Perforatrice Montabert T23 (Agrandie)",
    lightboxSoufflageTitle: "🔍 Illustration : Soufflage des trous (Agrandie)",
    lightboxPurgeDesc: "Détail haute résolution de la canne de purge et de la tête de purge SMI avec",
    lightboxForageDesc: "Détail haute résolution de la perforatrice Montabert T23 avec flexibles d'air et d'eau",
    lightboxSoufflageDesc: "Détail haute résolution du flexible de soufflage à air comprimé et de la tige de mesure",
    stepHeaders: [
      { num: 1, icon: '📋', title: 'Prise de poste & Consignes', cat: 'TECHNIQUE' },
      { num: 2, icon: '🌬️', title: 'Aérage & Ventilation', cat: 'TECHNIQUE' },
      { num: 3, icon: '💧', title: 'Arrosage & Purge', cat: 'TECHNIQUE' },
      { num: 4, icon: '⛏️', title: 'Purge du chantier', cat: 'SÉCURITÉ' },
      { num: 5, icon: '🔧', title: 'Inspection perforateur', cat: 'TECHNIQUE' },
      { num: 6, icon: '🔩', title: 'Forage — 100% métrage', cat: 'FORAGE' },
      { num: 7, icon: '🔍', title: 'Soufflage & Contrôle', cat: 'TECHNIQUE' },
      { num: 8, icon: '💥', title: 'Chargement explosifs', cat: 'EXPLOSIFS' },
      { num: 9, icon: '⚡', title: 'Pré-tir & Mise à feu', cat: 'EXPLOSIFS' },
      { num: 10, icon: '📊', title: 'Registre journalier', cat: 'TECHNIQUE' }
    ],
    step1Title: 'Ce que vous recevez du poste précédent conditionne votre efficacité et votre sécurité sur toute la durée du poste.',
    step1Grid: [
      { title: '📍 Avancement du chantier', text: 'Métrage réalisé au poste précédent. Position actuelle du front.' },
      { title: '💥 État de la dernière volée', text: 'Trous ratés ? Raté non tiré ? Culots résiduels signalés ?' },
      { title: '🌬️ État de la ventilation', text: 'Galerie aérée ? Depuis combien de temps ? CO résiduel ?' },
      { title: '🔧 Matériel disponible', text: 'Perforateur opérationnel ? Flexibles en état ? Consommables ?' },
      { title: '📦 Stock explosifs', text: 'ANFO disponible, TOVEX, amorces — quantités suffisantes ?' },
      { title: '⚠️ Anomalies signalées', text: 'Zones instables, infiltrations eau, incidents du poste précédent' }
    ],
    step1Alert: "Un trou raté non signalé par le poste précédent est un danger mortel. Exiger la confirmation explicite de l'état de tous les trous avant pénétration du front.",
    step2Title: "L'aérage est la première vérification technique avant toute entrée en galerie. Une galerie mal aérée contient du CO et des gaz nitreux invisibles et mortels après tir.",
    step2ProcTitle: 'Procédure de contrôle :',
    step2Proc: [
      "Vérifier le débit d'air à l'entrée de la galerie — flux d'air perceptible sur la peau du visage",
      'Contrôler le ventilateur et le tubage souple (manchette) : aucun pli, aucune déchirure, raccords étanches',
      "En présence d'un détecteur CO : mesure < 25 ppm (ISO 4225 : µmol/mol) avant entrée",
      'Délai post-tir minimum à respecter : 30 minutes de ventilation continue avant toute entrée',
      "Vérifier que l'air circule jusqu'au FRONT DE TAILLE — pas seulement à l'entrée"
    ],
    step2Alert: "L'aérage n'est pas optionnel. Si la ventilation est insuffisante — STOP — le travail est interdit jusqu'à rétablissement du flux conforme aux spécifications.",
    step3Title: "L'arrosage précède toujours la purge. L'eau humidifie la roche et révèle les fissures, les plans de décollement et les blocs instables invisibles à l'œil sec sur roche sèche. Un chantier mal arrosé cache ses dangers.",
    step3Alert: "L'eau révèle ce que l'œil ne voit pas sur roche sèche. L'arrosage = la préparation d'une purge efficace et sûre.",
    step3ProcTitle: "Procédure d'arrosage :",
    step3Proc: [
      'Connecter le flexible à la conduite de chantier',
      'Arroser le FRONT DE TAILLE en premier : zones fissurées, plans de couches, défauts visibles',
      'Arroser la VOÛTE sur 15 m minimum depuis le front — les zones humides révèlent les fissures ouvertes',
      'Arroser les PAREMENTS (murs latéraux) de haut en bas',
      'Arroser le SOL — lutte contre la poussière de silice',
      "Le chantier est correctement arrosé quand aucun nuage de poussière ne se forme lors des déplacements"
    ],
    step3AlertSilicose: "La poussière de roche contient de la silice libre. Inhalation chronique = silicose professionnelle irréversible (ISO 14001). L'arrosage protège vos poumons pour toute votre carrière.",
    step4Alert: '« La chute de blocs est le premier ennemi dans les mines souterraines »',
    step4Title: 'La purge consiste à désolidariser tous les blocs instables de la voûte et des parements sur 15 m minimum depuis le front de taille. Elle se fait après arrosage, quand la roche a révélé ses fissures et ses défauts.',
    step4RuleTitle: 'Règles absolues :',
    step4Rules: [
      'AUCUNE MACHINE EN FONCTIONNEMENT pendant la purge — L\'écoute des vibrations et craquements est essentielle',
      'Se positionner TOUJOURS hors de la zone de chute potentielle — jamais sous un bloc en cours de purge',
      'Frapper méthodiquement la voûte et les parements — SON CREUX = bloc instable à purger immédiatement | SON PLEIN = roche stable, continuer',
      'La purge est terminée quand 100% des zones testées donnent un son plein — pas 99%',
      'Distance de travail : 15 m minimum depuis le front'
    ],
    step4AlertSafety: 'Un bloc non purgé peut tomber lors du forage ou du chargement. Un seul bloc suffit. La purge n\'est jamais abrégée.',
    step5Title: 'Avant de démarrer le perforateur, chaque composant est inspecté. Un flexible qui éclate sous 10 bar devient une arme dans la galerie.',
    step5ChecklistTitle: '🔩 Montabert T23 — Checklist',
    step5Checklist: [
      'Taillant bouton 38mm : serré et non usé',
      "Lubrificateur d'air : niveau huile suffisant",
      "Raccord d'eau de forage : connexion étanche",
      'Boulon de fixation barre de guidage : serré',
      'Silencieux et protège-taillant : en place'
    ],
    step5FlexTitle: '🌬️ Flexibles — Anti-éclatement',
    step5Flex: [
      'Aucune coupure, boursouflure ou usure',
      'Raccord d\'air comprimé protégé par : \n→ Colliers de sécurité ou câbles anti-fouet',
      'Attaches et colliers serrés des deux côtés',
      "Flexible d'eau de forage (2 pouces) : état vérifié"
    ],
    step5SafetyAlert: 'Un flexible d\'air sous 10 bar qui se décroche ou éclate devient un fouet violent. Chaque raccord doit être sécurisé avant de mettre en pression.',
    step5NoiseTitle: '🎧 Équipement auditif',
    step5NoiseDesc: 'Casque anti-bruit obligatoire avant démarrage du perforateur. Niveau sonore forage : 100 dB à 110 dB. Exposition non protégée = perte auditive irréversible.',
    step7Title: 'Avant le chargement des explosifs, chaque trou est soufflé et contrôlé. Un trou bouché ou insuffisamment profond = cartouche TOVEX coincée = raté de tir.',
    step7ChecklistTitle: 'Checklist technique :',
    step7Checklist: [
      "Soufflage de chaque trou à l'air comprimé (du fond vers l'entrée)",
      'Vérification de la profondeur avec la tige de mesure → Trou trop court : noter la référence pour correction → Profondeur conforme : marquer d\'un repère à la craie',
      "Contrôle rigoureux de l'humidité : → Trou sec : chargeable à l'ANFO de performance → Trou humide/eau : TOVEX uniquement (l'ANFO se dissout)",
      'Contrôle visuel des trous de bouchon (alignement)'
    ],
    step7Advice: '💡 CONSEIL : Souffler énergiquement libère la silice résiduelle. Portez impérativement votre masque respiratoire à cartouche lors de cette opération !',
    step7Alert: 'Un trou mouillé chargé avec ANFO = raté garanti. Le TOVEX résiste à l\'eau et garantit la détonation même dans un trou noyé. Adapter selon l\'état de chaque trou.',
    step7VisualTitle: 'Trou Nettoyé & Soufflé',
    step8Title: "Le chargement se fait 30 à 60 minutes avant l'heure de tir. L'ordre est impératif : TOVEX en premier, ANFO ensuite, bourrage en dernier.",
    step8TovexTitle: '1. TOVEX + Amorce — La Base du Tir',
    step8TovexProc: [
      'Prendre une cartouche TOVEX (100g)',
      "Insérer la capsule amorce électrique à l'intérieur de la cartouche TOVEX",
      "RÈGLE ABSOLUE ET SACRÉE — Court-circuiter le circuit électrique des fils :",
      "Les fils de l'amorce doivent être torsadés et liés ensemble (shuntés) jusqu'au moment final de connexion au fil de tir principal. Ne jamais laisser de fil libre. Un fil libre peut capter des charges statiques ou des courants vagabonds provoquant un tir accidentel et mortel.",
      'Insérer la cartouche TOVEX équipée de l\'amorce au fond du trou, complètement',
      "Ne pas pousser avec force et ne pas utiliser la barre de forage pour l'enfoncer",
      "Le fil de l'amorce doit sortir du trou et rester court-circuité ou shunté"
    ],
    step8PortanoleTitle: '2. Portanole Pneumatique — Chargement ANFO',
    step8PortanoleProc: [
      'Vérifier la connexion du flexible anti-statique au portanole',
      "Contrôler l'état du flexible — aucune coupure ou fissure",
      "Insérer l'extrémité du flexible au fond du trou",
      'Remplir la trémie du portanole avec le mélange ANFO (granulés)',
      'Pomper et souffler progressivement — du fond vers l\'orifice du trou',
      "S'arrêter à la longueur définie pour la colonne de charge :"
    ],
    step8QuantitiesTitle: 'Quantités requises estimées pour ce gabarit ({gabarit}) :',
    step9Title: "La mise à feu est la conclusion de toute la préparation. Les 15 minutes précédentes sont les plus critiques — une check-list non respectée ici remet en cause toute la journée.",
    step9ChecklistTitle: 'CHECKLIST PRÉ-TIR :',
    step9Checklist: [
      'Évacuation complète du chantier — aucune personne dans la zone de tir',
      'Rangement du matériel et des outils — rien ne doit rester sur le front',
      'Vérification des connexions électriques — chaque fil correctement raccordé',
      'Shuntage maintenu jusqu\'à la connexion finale',
      'Contrôle du circuit de tir avec ohmmètre — continuité confirmée',
      'Signalisation et barrage de la zone de tir',
      'Vérification finale de l\'évacuation — comptage des personnes',
      "Respect strict de l'heure de tir planifiée"
    ],
    step9ProcTitle: 'Procédure de mise à feu :',
    step9Proc: [
      'S\'éloigner à une distance de sécurité de minimum 100 m depuis le front',
      'Vérification finale que personne n\'est présent dans la zone',
      'Connexion du fil de tir à l\'exploseur homologué SMI',
      "Chargement de l'exploseur pour générer l'impulsion électrique",
      "Appui sur le bouton de tir — vérification du signal de réussite"
    ],
    step9AlertTitle: '⚠️ POST-TIR & INCIDENTS',
    step9Alerts: [
      "Attendre 30 minutes minimum avant toute entrée",
      "Vérifier l'aérage et le taux de CO avant retour",
      'En cas de raté de tir : protocole des trous ratés — interdiction d\'approche avant 30 min, avertir le responsable technique immédiatement'
    ],
    legendVide: 'Vide (V)',
    legendBouchon: 'Bouchon (D0)',
    legendG1: 'Groupe 1 (D1 — 25 ms)',
    legendG2: 'Groupe 2 (D2 — 50 ms)',
    legendG3: 'Groupe 3 (D3 — 75 ms)',
    legendG4: 'Groupe 4 (D4 — 100 ms)',
    legendRadier: 'Radier',
    legendParements: 'Parements',
    legendVoute: 'Voûte',
    activeGroupLabels: {
      0: 'D0 — 0 ms — Bouchon TOVEX',
      25: 'D1 — 25 ms — Groupe 1 ANFO',
      50: 'D2 — 50 ms — Groupe 2 ANFO',
      75: 'D3 — 75 ms — Groupe 3 ANFO',
      100: 'D4 — 100 ms — Groupe 4 ANFO',
      contour: 'D5 — 125 ms — Contour (Radier/Parements/Voûte) ANFO'
    }
  },
  ar: {
    title: '⚠️ الحالات الشاذة والمشاكل المُبلَّغ عنها',
    subtitle: 'الشركة المعدنية لإيميتر (SMI IMITER) — إجراءاتيات التفجير والحفر عالي الأداء',
    targetYield: 'الإنتاجية المستهدفة',
    excellence: '🎯 التميز 100%',
    fromBouchon: 'من القطع إلى السجل اليومي',
    step: 'المرحلة',
    progression: 'التقدم :',
    btnEnLarge: 'تكبير الصورة',
    btnEnLargePurge: 'تكبير الصورة',
    btnEnLargeForage: 'تكبير الصورة',
    btnEnLargeSoufflage: 'تكبير الصورة',
    pressureSpecs: '⚠️ الضغوط الاسمية: هواء 7-9 بار | ماء 4-6 بار',
    earSpecsTitle: '🎧 حماية السمع',
    earSpecsDesc: 'ارتداء الخوذة المضادة للضوضاء إلزامي قبل تشغيل آلة الحفر. مستوى ضجيج الحفر: 100 ديسيبل إلى 110 ديسيبل. التعرض بدون حماية يؤدي إلى فقدان السمع الدائم.',
    gallerySection: 'معرض الصور التقنية',
    smiGabarit: 'نموذج SMI — 12 م²',
    intlGabarit: 'نموذج دولي — 12 م²',
    gabarit9m2: 'نموذج 9 م²',
    foreMustArrache: 'يجب أن يتجاوز الحفر عمق الاستخراج بـ 10 سم على الأقل',
    bourrageParfait: 'الحشو المثالي',
    divergenceIdeale: 'الانحراف المثالي: 0°',
    trousRespectes: 'الثقوب المطابقة للمخطط',
    planTirInteractive: 'مخطط التفجير التفاعلي',
    planTirInstruction: 'حوّل المؤشر فوق المجموعات لرؤية تسلسل التفجير',
    gabarit12m2Label: 'نموذج SMI 12 م²',
    gabaritIntlLabel: 'نموذج دولي 12 م²',
    gabarit9m2Label: 'نموذج 9 م²',
    ordreForageTitle: 'ترتيب الحفر حسب المجموعات',
    orderStepA: 'الأولى: ثقوب القطع (D0)',
    orderStepADesc: 'احفر ثقوب القطع أولاً — فهي المرجع لكل ما يلي',
    orderStepB: 'الثانية: المجموعات 1 إلى 4 (D1-D4)',
    orderStepBDesc9m2: 'نموذج 9 م²: 4 مجموعات رئيسية (20 ثقباً)',
    orderStepBDesc12m2: 'نموذج 12 م²: 4 مجموعات رئيسية (24 ثقباً)',
    orderStepC: 'الأخيرة: ثقوب المحيط (D5)',
    orderStepCDesc: 'الأرضية والجوانب والسقف — تُفجر أخيراً للحفاظ على استقرار الجبهة',
    orderRule: '⚠️ القاعدة الذهبية: لا تبدأ مجموعة قبل الانتهاء من السابقة',
    parallelismeTitle: 'المحاكاة التفاعلية: التوازي والانحراف',
    parallelismeDesc: 'حرّك المؤشر لمحاكاة انحراف آلة الحفر. كل درجة من الانحراف تفقدك سنتيمترات من الإنتاجية.',
    simulatorDeviation: 'محاكي الانحراف',
    angleDivergence: 'زاوية الانحراف',
    volumeArrache: 'الحجم المستخرج',
    rendementVolee: 'إنتاجية التفجيرة',
    culotResiduel: 'القاعدة المتبقية',
    angle: 'الزاوية',
    culot: 'القاعدة',
    arrache: 'الاستخراج',
    rendement: 'الإنتاجية',
    purgeEquip: 'عصا التطهير',
    purgeEquipTitle: 'عصا التطهير + رأس التطهير من النوع 2',
    purgeEquipDesc1: 'عصا التطهير (Scaling bar)',
    purgeEquipDesc2: 'مصباح الفحص اليدوي',
    purgeSpecs1: 'عصا التطهير: 1.5 م أو 2.4 م',
    purgeSpecs2: 'مصباح الفحص: 360° مع LED',
    verdictPerfect: 'مثالي — 0° انحراف',
    verdictExcellent: 'ممتاز — ≤ 1° انحراف',
    verdictAcceptable: 'مقبول — ≤ 2° انحراف',
    verdictAttention: 'انتباه — 3° انحراف',
    verdictCritique: 'حرج — 4°+ انحراف',
    verdictReformer: 'يحتاج إعادة — 5°+ انحراف',
    colonneConfigTitle: 'تهيئة عمود الشحنة',
    colonneConfig18: 'قضيب 1.8 م — حفر 1.7 م',
    colonneConfig24: 'قضيب 2.4 م — حفر 2.3 م',
    quantitiesTitle: 'الكميات التقديرية المطلوبة',
    qAnfoTotal: 'إجمالي الأنفور المطلوب',
    qTovex100g: 'خراطيش التوفيكس 100 غرام',
    qAmorces: 'المفجرات الكهربائية',
    qToCharge: 'للشحن',
    lBourrageTitle: 'طول الحشو (Stemming)',
    lBourrageDesc: 'يمنح الحشو موجة الصدمة القوة اللازمة لتحطيم الصخر بدلاً من تبديدها في الهواء (Blow-out).',
    lBourrageFormula: 'الحشو = عمق الثقب - عمق الشحنة',
    lBourrageMinimum: 'الحد الأدنى للحشو: 30 سم',
    bourrageProcTitle: 'إجراء الحشو:',
    bourrageProc1: '1. لا تملأ الثقب بالمتفجرات بالكامل — اترك مساحة للحشو',
    bourrageProc1a: 'قضيب 1.8 م: حشو 30 سم',
    bourrageProc1b: 'قضيب 2.4 م: حشو 40 سم',
    bourrageProc2: '2. استخدم طين الحشو أو الرمل الجاف كمادة للحشو',
    bourrageProc3: '3. احشو بالترويس (Tamping) — لا بالضغط العنيف',
    bourrageProc4: '4. يبدأ الحشو فوق الشحنة وينزل تدريجياً',
    bourrageProc5: '5. تأكد من أن الحشو مضغوط وخالٍ من الفراغات',
    step10Desc: 'تسجيل البيانات في السجل اليومي هو آخر خطوة فنية يقوم بها عامل المنجم. تغذي هذه البيانات منصة هيدرومينز للإنتاج مباشرة، لذا يجب أن تكون دقيقة وكاملة.',
    step10Grid1Title: '📊 إجمالي الثقوب المحفورة',
    step10Grid1Desc9m2: '28 ثقباً — مطابقة للمخطط',
    step10Grid1Desc12m2: '38 ثقباً — مطابقة للمخطط',
    step10Grid2Title: '🔩 توزيع شحنة البداية',
    step10Grid2Desc12m2: '3 فارغة + 6 معبأة بالتوفيكس',
    step10Grid2DescIntl: '6 فارغة + 3 معبأة بالتوفيكس',
    step10Grid2Desc9m2: '1 فارغة + 4 معبأة بالتوفيكس',
    step10Grid3Title: '📏 نوع القضيب المستخدم',
    step10Grid3Desc: 'قضيب 1.8 م (حفر 1.7 م) أو قضيب 2.4 م (حفر 2.3 م)',
    step10Grid4Title: '💥 المتفجرات المستهلكة',
    step10Grid4Desc: 'الأنفور: X كجم | التوفيكس: X خرطوشة | المفجرات: X',
    step10Grid5Title: '📐 إجمالي أمتار الحفر المصرح عنها',
    step10Grid5Desc: '= عمق الثقب × 1 (لكل ثقب) — باستثناء الثقوب الفارغة',
    step10Grid6Title: '⏰ الوقت الدقيق للتفجير',
    step10Grid6Desc: 'الوقت الدقيق للتفجير — يجب تدوينه بدقة متناهية',
    step10Alert: "أي خطأ في السجل اليومي (Rapport journalier) يؤثر سلباً على تتبع حركة المتفجرات ويهدد سلامة الوردية القادمة (Poste suivant). دقة السجل تعكس مدى انضباط واحترافية عامل المنجم.",
    step1ShortTitle: 'استلام الوردية والتوجيهات الفنية',
    step2ShortTitle: 'التحقق من التجديد الهوائي',
    step3ShortTitle: 'رش ورشة العمل بالماء',
    step4ShortTitle: 'تطهير السقف والجوانب',
    step5ShortTitle: 'فحص معدات الحفر',
    step6ShortTitle: 'الحفر — تحقيق 100% من العمق',
    step7ShortTitle: 'الفحص والتنظيف',
    step8ShortTitle: 'تعبئة وشحن المتفجرات',
    step9ShortTitle: 'الإشعال والتفجير',
    step10ShortTitle: 'السجل اليومي والتقييم',
    catTechnique: 'تقني',
    catSecurite: 'أمن',
    catForage: 'حفر',
    catExplosifs: 'متفجرات',
    lightboxPurgeTitle: "توضيح: عمود التطهير (Canne de purge) ورأس التطهير من النوع 2 (Tête de purge Type 2) (صورة مكبّرة)",
    lightboxForageTitle: "توضيح: آلة الحفر مونتابير T23 (صورة مكبّرة)",
    lightboxSoufflageTitle: "توضيح: نفخ الثقوب (صورة مكبّرة)",
    lightboxPurgeDesc: "تفصيل عالي الدقة لعصا التطهير ورأس التطهير SMI مع",
    lightboxForageDesc: "تفصيل عالي الدقة لآلة الحفر مونتابير T23 مع خراطيم الهواء والماء",
    lightboxSoufflageDesc: "تفصيل عالي الدقة لخرطوم النفخ بالهواء المضغوط وقضيب القياس",
    stepHeaders: [
      { num: 1, icon: '📋', title: 'استلام الوردية والتوجيهات الفنية (Consignes de poste)', cat: 'تقني' },
      { num: 2, icon: '🌬️', title: 'التحقق من التجديد الهوائي (Vérification de l\\'aérage)', cat: 'تقني' },
      { num: 3, icon: '💧', title: 'رش ورشة العمل بالماء (Arrosage du chantier)', cat: 'تقني' },
      { num: 4, icon: '⛏️', title: 'تطهير السقف والجوانب (Purge)', cat: 'أمن' },
      { num: 5, icon: '🔧', title: 'فحص معدات الحفر (Contrôle de la perforatrice)', cat: 'تقني' },
      { num: 6, icon: '🔩', title: 'الحفر — تحقيق 100% من العمق (Forage — 100% métrage)', cat: 'حفر' },
      { num: 7, icon: '🔍', title: 'الفحص والتنظيف (Soufflage & Contrôle)', cat: 'تقني' },
      { num: 8, icon: '💥', title: 'تعبئة وشحن المتفجرات (Chargement explosifs)', cat: 'متفجرات' },
      { num: 9, icon: '⚡', title: 'الإشعال والتفجير (Pré-tir & Mise à feu)', cat: 'متفجرات' },
      { num: 10, icon: '📊', title: 'السجل اليومي والتقييم (Registre journalier)', cat: 'تقني' }
    ],
    step1Title: 'ما تستلمه من الوردية السابقة يحدد كفاءتك وسلامتك طوال اليوم.',
    step1Grid: [
      { title: '📍 مؤشرات الإنجاز في الورشة', text: 'المعايير المنجزة في الوردية السابقة. الموقع الحالي لوجه العمل (Front de taille).' },
      { title: '💥 حالة التفجير الأخير', text: 'ثقوب متخلفة؟ ثقوب غير منفجرة؟ قواعد متبقية (culots) مسجلة؟' },
      { title: '🌬️ حالة التهوية', text: 'هل تم تهوية النفق؟ منذ متى بدأت التهوية؟ ما نسبة أحادي أكسيد الكربون (CO) المتبقية؟' },
      { title: '🔧 المعدات المتاحة', text: 'هل آلة الحفر جاهزة للعمل؟ هل الخراطيم والوصلات في حالة جيدة؟ هل المستهلكات متوفرة (مثقاب، رؤوس قطع)؟' },
      { title: '📦 مخزون المتفجرات', text: 'هل مخزون ANFO وTOVEX والأمورس كافٍ للوردية المخططة؟' },
      { title: '⚠️ الشواذ والحالات الاستثنائية المسجلة', text: 'مناطق غير مستقرة، تسربات مياه، حوادث الوردية السابقة' }
    ],
    step1Alert: 'الثقب المتخلف غير المُبلَّغ عنه من الوردية السابقة يشكل خطراً قاتلاً. اطلب تأكيداً صريحاً ومكتوباً عن حالة جميع الثقوب قبل دخول جبهة العمل.',
    step2Title: 'التجديد الهوائي هو أول فحص فني قبل أي دخول للنفق. النفق المُهوَّى بشكل سيء يحتوي على غاز أحادي أكسيد الكربون (CO) وأبخرة التفجير (fumées post-tir) الخفية والقاتلة.',
    step2ProcTitle: 'إجراء التحقق:',
    step2Proc: [
      'التحقق من تدفق الهواء عند مدخل النفق — يجب أن يُحسَّ بتيار هوائي على بشرة الوجه',
      'فحص حالة المروحة والأنبوب المرن (ماسورة التهوية): التأكد من خلوهما من التواءات أو تمزقات، ومن محكمة التوصيلات',
      'باستخدام كاشف الغاز: يجب أن تكون قراءة أحادي أكسيد الكربون أقل من 25 جزء في المليون (ppm) قبل الدخول',
      'الحد الأدنى للانتظار بعد التفجير: 30 دقيقة من التهوية المستمرة قبل أي دخول للورشة',
      'التأكد من وصول الهواء إلى وجه العمل — وليس فقط عند مدخل النفق'
    ],
    step2Alert: 'التجديد الهوائي ليس اختيارياً. إذا كانت التهوية غير كافية — قف — العمل ممنوع حتى استعادة التدفق المطابق للمواصفات.',
    step3Title: 'الرش بالماء يسبق دائماً عملية التطهير (Purge). الماء يرطب الصخر ويكشف الشقوق ومستويات الانفصال والكتل غير المستقرة التي لا تراها العين المجردة على الصخور الجافة. الورشة غير المرشوشة تخفي مخاطرها.',
    step3Alert: 'يكشف الماء ما لا تراه العين على الصخور الجافة. الرش بالماء = إعداد عملية تطهير فعّالة وآمنة.',
    step3ProcTitle: 'إجراء الرش:',
    step3Proc: [
      'توصيل خرطوم المياه بأنبوب الورشة الرئيسي',
      'رش وجه العمل أولاً: المناطق المتشققة، مستويات الطبقات، العيوب المرئية',
      'رش السقف على مسافة 15 متراً على الأقل من الجبهة — المناطق الرطبة تكشف الشقوق المفتوحة',
      'رش الجوانب من الأعلى إلى الأسفل',
      'رش الأرضية — للحد من غبار السيليكا الضار',
      'تكون الورشة مرشوشة بشكل صحيح عندما لا يتصاعد أي غبار أثناء الحركة والتنقل'
    ],
    step3AlertSilicose: 'يحتوي غبار الصخور على السيليكا الحرة. الاستنشاق المزمن يؤدي إلى داء السيليكوز (Silicose) المهني غير القابل للعلاج (ISO 14001). الرش يحمي رئتيك طوال مسيرتك المهنية.',
    step4Alert: '« سقوط الكتل الصخرية هو الخطر الأول في المناجم الجوفية »',
    step4Title: 'تتمثل عملية التطهير في إزالة جميع الكتل الصخرية غير المستقرة من السقف والجوانب على عمق لا يقل عن 15 متراً من وجه العمل. تتم بعد الرش، عندما تكشف الصخور عن شقوقها وعيوبها.',
    step4RuleTitle: 'قواعد إلزامية للتطهير:',
    step4Rules: [
      'يجب إيقاف جميع الآلات أثناء التطهير — الاستماع إلى أصوات الاهتزاز والتشقق أمر حيوي للسلامة',
      'قف دائماً خارج منطقة السقوط المحتملة — لا تقف أبداً تحت كتلة أثناء إزالتها',
      'اضرب السقف والجوانب بشكل منهجي — الصوت الخافت (المطروق) = كتلة غير مستقرة، أزلها فوراً | الصوت الصافي (المعدني) = صخرة مستقرة، واصل',
      'تنتهي عملية التطهير عندما تعطي جميع المناطق المختبرة صوتاً صافياً — وليس 99%',
      'مسافة العمل الآمنة: 15 متراً كحد أدنى من وجه العمل'
    ],
    step4AlertSafety: 'الكتلة غير المزالة قد تسقط أثناء الحفر أو التحميل. كتلة واحدة تكفي لإحداث كارثة. لا تستهن أبداً بعملية التطهير ولا تقلل منها.',
    step5Title: 'قبل تشغيل آلة الحفر، يتم فحص كل جزء بدقة. إن انفجار خرطوم تحت ضغط 10 بار يتحول إلى سوطٍ قاتلٍ داخل النفق.',
    step5ChecklistTitle: '🔩 قائمة فحص آلة الحفر مونتابير T23',
    step5Checklist: [
      'لقمة الحفر ذات الأزرار 38 مم: مثبتة بإحكام وغير مبللة',
      'مُزيِّت الهواء: مستوى الزيت فوق الخط الأدنى',
      'وصلة مياه الحفر: التوصيل محكم ولا يوجد تسريب',
      'برغي تثبيت دليل القضيب: مشدود بإحكام',
      'كاتم الصوت وواقي اللقمة: في مكانهما الصحيح'
    ],
    step5FlexTitle: '🌬️ الخراطيم — منع الانفجار',
    step5Flex: [
      'خلو تام من القطع والانتفاخات والتآكل',
      'وصلة الهواء المضغوط محمية بـ: \n→ حلقات أمان أو كوابل مضادة للالتواء المفاجئ',
      'المثبتات والحلقات مشدودة من الطرفين',
      'خرطوم مياه الحفر (2 بوصة): تم التحقق من حالته'
    ],
    step5SafetyAlert: 'إن خرطوم الهواء الخاضع لضغط 10 بار إذا انفصل أو انفجر يتحول إلى سوطٍ قاتلٍ. يجب تأمين كل وصلة قبل تشغيل الضغط.',
    step5NoiseTitle: '🎧 معدات حماية السمع',
    step5NoiseDesc: 'واقي الأذن أو الخوذة المضادة للضوضاء إلزامي قبل تشغيل آلة الحفر. مستوى ضجيج الحفر: 100 ديسيبل إلى 110 ديسيبل. التعرض بدون حماية يؤدي إلى فقدان السمع الدائم.',
    step7Title: 'قبل تعبئة المتفجرات، يتم تنظيف كل ثقب بالنفخ وفحصه بدقة. أي ثقب مسدود أو غير عميق بما يكفي = احتباس خرطوشة التوفيكس = فشل التفجير.',
    step7ChecklistTitle: 'قائمة التحقق الفني:',
    step7Checklist: [
      'نفخ كل ثقب بالهواء المضغوط من القاع إلى الخارج',
      'التحقق من العمق باستخدام قضيب القياس المخصص: ثقب قصير جداً: تسجيل رقمه لتعديله وإعادة حفره — العمق مطابق: وضع علامة بالطبشور',
      'الفحص الدقيق للرطوبة: ثقب جاف: يمكن تعبئته بخليط الأنفور عالي الأداء — ثقب رطب أو يحتوي على ماء: التوفيكس فقط (لأن الأنفور يذوب بالماء)',
      'الفحص البصري لثقوب القطع'
    ],
    step7Advice: '💡 نصيحة: النفخ القوي يحرر غبار السيليكا المتبقي. ارتدِ قناع التنفس المزود بخرطوشة واقية إلزامياً أثناء هذه العملية!',
    step7Alert: 'تعبئة ثقب مبلل بخليط الأنفور = فشل تفجير محتم. يتميز التوفيكس بمقاومته للمياه ويضمن الانفجار حتى في الثقوب المغمورة. يجب اختيار نوع المتفجر حسب حالة كل ثقب.',
    step7VisualTitle: 'ثقب نظيف ومنفوخ بالكامل',
    step8Title: 'تتم عملية الشحن والتعبئة قبل 30 إلى 60 دقيقة من موعد التفجير. الترتيب إلزامي: التوفيكس أولاً، ثم الأنفور، يليه الحشو في النهاية.',
    step8TovexTitle: '1. التوفيكس مع المفجر — أساس الشحنة',
    step8TovexProc: [
      'أخذ خرطوشة التوفيكس (100 غرام)',
      'إدخال كبسولة المفجر الكهربائي داخل خرطوشة التوفيكس',
      'القاعدة المطلقة والمقدسة — قصر الدائرة الكهربائية للأسلاك:',
      'يجب أن تُلَف أسلاك المفجر وتُربط معاً (شنط) حتى اللحظة النهائية للتوصيل بسلك التفجير الرئيسي. لا تترك سلكاً حراً أبداً. السلك الحر قد يلتقط شحنات كهروستاتيكية أو تيارات ضالة تؤدي إلى تفجير عرضي وقاتل.',
      'إدخال خرطوشة التوفيكس المجهزة بالمفجر إلى قاع الثقب، بالكامل',
      'لا تدفع بقوة ولا تستخدم قضيب الحفر لدفعها',
      'يجب أن يخرج سلك المفجر من الثقب ويبقى قصر الدائرة أو شنطاً'
    ],
    step8PortanoleTitle: '2. جهاز الشحن الهوائي — تعبئة الأنفور',
    step8PortanoleProc: [
      'التحقق من توصيل الخرطوم المضاد للكهرباء الساكنة بالجهاز',
      'فحص حالة الخرطوم — خلوه من القطع والشقوق',
      'إدخال طرف الخرطوم إلى قاع الثقب',
      'ملء قمع الجهاز بخليط الأنفور (حبيبات)',
      'الضخ والنفخ تدريجياً — من القاع نحو فتحة الثقب',
      'التوقف عند الطول المحدد لعمود الشحنة:'
    ],
    step8QuantitiesTitle: 'الكميات التقديرية المطلوبة لهذا النموذج ({gabarit}) :',
    step9Title: 'عملية الإشعال والتفجير هي نتيجة كل هذا العمل. الخمس عشرة دقيقة السابقة للتفجير هي الأكثر حرجاً — أي خطأ في قائمة الفحص هنا قد يُبطل مجهود اليوم كاملاً.',
    step9ChecklistTitle: 'قائمة التحقق قبل التفجير:',
    step9Checklist: [
      'إخلاء كامل للورشة — لا يوجد أي شخص في منطقة التفجير',
      'ترتيب المعدات والأدوات — لا يجب أن يبقى شيء على الجبهة',
      'التحقق من التوصيلات الكهربائية — كل سلك موصول بشكل صحيح',
      'الحفاظ على قصر الدائرة أو الشنط (Shuntage) للأسلاك حتى لحظة التوصيل النهائي',
      'التحقق من دائرة التفجير بجهاز الأوميتر: تأكيد سلامة وتوصيل الدائرة كاملة',
      'وضع إشارات التحذير والحواجز لتأمين منطقة التفجير',
      'التأكيد على الإخلاء التام والدقيق لجميع الأشخاص — عامل المنجم ومساعده',
      'الالتزام بالوقت المحدد والمخطط له للتفجير'
    ],
    step9ProcTitle: 'خطوات عملية الإشعال والتفجير:',
    step9Proc: [
      'الابتعاد إلى مسافة أمان كافية (100 متر على الأقل من جبهة العمل)',
      'التأكد للمرة الأخيرة من خلو المنطقة تماماً من أي شخص',
      'توصيل سلك التفجير بجهاز الإشعال المعتمد والمصادق عليه من SMI',
      'شحن جهاز الإشعال لتوليد النبضة الكهربائية',
      'الضغط على زر التفجير — والتحقق من إشارة نجاح الإشعال'
    ],
    step9AlertTitle: '⚠️ ما بعد التفجير والطوارئ:',
    step9Alerts: [
      'الانتظار لمدة 30 دقيقة على الأقل كحد أدنى قبل دخول أي شخص',
      'التحقق من عمل التهوية ونسبة غاز أحادي أكسيد الكربون (CO) قبل العودة',
      'في حالة وجود ثقب فاشل التفجير: تطبيق بروتوكول الثقوب الفاشلة — يمنع الاقتراب تماماً قبل مرور 30 دقيقة على الأقل، وإبلاغ المسؤول الفني فوراً.'
    ],
    legendVide: 'ثقوب فارغة لتخفيف الضغط (V)',
    legendBouchon: 'ثقوب القطع بالتوفيكس (D0)',
    legendG1: 'المجموعة 1 (D1 — 25 مللي ثانية)',
    legendG2: 'المجموعة 2 (D2 — 50 مللي ثانية)',
    legendG3: 'المجموعة 3 (D3 — 75 مللي ثانية)',
    legendG4: 'المجموعة 4 (D4 — 100 مللي ثانية)',
    legendRadier: 'الأرضية (Radier)',
    legendParements: 'الجوانب (Parements)',
    legendVoute: 'السقف (Voûte)',
    activeGroupLabels: {
      0: "D0 — 0 مللي ثانية — ثقوب القطع بالتوفيكس (TOVEX)",
      25: "D1 — 25 مللي ثانية — المجموعة 1 بالأنفور (ANFO)",
      50: "D2 — 50 مللي ثانية — المجموعة 2 بالأنفور (ANFO)",
      75: "D3 — 75 مللي ثانية — المجموعة 3 بالأنفور (ANFO)",
      100: "D4 — 100 مللي ثانية — المجموعة 4 بالأنفور (ANFO)",
      contour: "D5 — 125 مللي ثانية — ثقوب المحيط (الأرضية / الجوانب / السقف) بالأنفور (ANFO)"
    }
  }
};
