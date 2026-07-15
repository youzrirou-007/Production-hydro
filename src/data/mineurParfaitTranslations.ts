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
  activeGroupLabels: Record<number | string, string>;
}

export const t: Record<'fr' | 'ar', Translation> = {
  fr: {
    title: "LE MINEUR PARFAIT",
    subtitle: "SMI IMITER — PROCÉDURES OPÉRATIONNELLES DE FORAGE & TIR DE PERFORMANCE",
    targetYield: "Rendement Cible",
    excellence: "🎯 EXCELLENCE 100%",
    fromBouchon: "Du Bouchon au Registre",
    step: "Étape",
    progression: "Progression :",
    btnEnLarge: "Agrandir l'image",
    btnEnLargePurge: "Agrandir l'image",
    btnEnLargeForage: "Agrandir l'image",
    btnEnLargeSoufflage: "Agrandir l'image",
    pressureSpecs: "⚠️ Pressions nominales : Air 7-9 bars | Eau 4-6 bars",
    earSpecsTitle: "🎧 Équipement auditif",
    earSpecsDesc: "Casque anti-bruit obligatoire avant démarrage du perforateur. Niveau sonore du forage : 100-110 dB. Une exposition non protégée entraîne une perte auditive irréversible.",
    gallerySection: "Section de galerie — Plan de tir :",
    smiGabarit: "🔷 12m² — SMI",
    intlGabarit: "🌍 12m² — Intl",
    gabarit9m2: "🔹 9m² — Traçage",
    foreMustArrache: "FORÉ → DOIT ÊTRE ARRACHÉ",
    bourrageParfait: "Bourrage parfait",
    divergenceIdeale: "Divergence idéale",
    trousRespectes: "Trous respectés",
    planTirInteractive: "Plan de Tir Interactif",
    planTirInstruction: "Survolez un groupe de délais pour mettre en évidence les trous correspondants et visualiser l'ordre séquentiel du tir.",
    gabarit12m2Label: "12m² SMI : 38 trous | Bouchon : 3V + 6C | 6 groupes | D0 → D5",
    gabaritIntlLabel: "12m² Intl : 38 trous | Bouchon : 6V + 3C | 6 groupes | D0 → D5",
    gabarit9m2Label: "9m² : 28 trous | Bouchon : 1V + 4C | 5 groupes | D0 → D4",
    ordreForageTitle: "Ordre de Forage — Ne Jamais Déroger",
    orderStepA: "ÉTAPE A → BOUCHON EN PREMIER",
    orderStepADesc: "Le bouchon crée la première face libre. Sans face libre, l'énergie explose dans toutes les directions et rien ne bouge. Le bouchon est la fondation de tout le tir.",
    orderStepB: "ÉTAPE B → INTÉRIEUR VERS EXTÉRIEUR",
    orderStepBDesc9m2: "G1 → G2 → G3. Chaque groupe tire vers le vide créé par le groupe précédent. Ne jamais sauter un groupe — le vide n'existe pas encore.",
    orderStepBDesc12m2: "G1 → G2 → G3 → G4. Chaque groupe tire vers le vide créé par le groupe précédent. Ne jamais sauter un groupe — le vide n'existe pas encore.",
    orderStepC: "ÉTAPE C → CONTOUR EN DERNIER",
    orderStepCDesc: "Radier → Parements → Voûte. Le contour découpe le profil officiel de la galerie. Foré en dernier pour ne pas fragiliser la galerie pendant le forage des trous centraux.",
    orderRule: "Un seul trou foré dans le mauvais ordre = rendement réduit. L'ordre n'est pas une suggestion — c'est une règle physique.",
    parallelismeTitle: "Parallélisme des Trous — La Clé du Rendement",
    parallelismeDesc: "Tous les trous doivent être rigoureusement parallèles entre eux et perpendiculaires au front de taille. Un trou dévié crée un culot (fond de trou non arraché) qui se cumule d'une volée à l'autre.",
    simulatorDeviation: "Simulateur de déviation de tir :",
    angleDivergence: "Angle de divergence :",
    volumeArrache: "Volume Arraché",
    rendementVolee: "Rendement Volée",
    culotResiduel: "Culot Résiduel",
    angle: "Angle",
    culot: "Culot",
    arrache: "Arraché",
    rendement: "Rendement",
    purgeEquip: "Équipement Certifié SMI",
    purgeEquipTitle: "Canne de Purge & Bec de Purge Type 2",
    purgeEquipDesc1: "La canne de purge est une barre robuste en acier spécial ou alliage léger d'aluminium haute résistance, conçue spécifiquement pour la purge minière manuelle.",
    purgeEquipDesc2: "Le bec de purge de Type 2 (Spécification SMI Imiter) possède un angle de levier optimisé et un tranchant trempé à double biseau. Il permet de s'insérer précisément dans les fractures de décollement pour déloger mécaniquement les dalles instables à distance de sécurité.",
    purgeSpecs1: "🔘 Manche acier/alu : légère & rigide",
    purgeSpecs2: "📐 Bec Type 2 : angle levier 35°",
    verdictPerfect: "PARFAIT — 170cm arrachés / 170cm",
    verdictExcellent: "EXCELLENT — ",
    verdictAcceptable: "ACCEPTABLE — ",
    verdictAttention: "ATTENTION — ",
    verdictCritique: "CRITIQUE — ",
    verdictReformer: " — REFORER",
    colonneConfigTitle: "Configuration de la colonne :",
    colonneConfig18: "Fleuret 1,8m (forage 1,7m = 170cm) : bourrage 76cm → colonne ANFO 94cm",
    colonneConfig24: "Fleuret 2,4m (forage 2,3m = 230cm) : bourrage 76cm → colonne ANFO 154cm",
    quantitiesTitle: "Quantités requises estimées pour ce gabarit",
    qAnfoTotal: "ANFO TOTAL",
    qTovex100g: "TOVEX 100G",
    qAmorces: "AMORCES",
    qToCharge: "À CHARGER",
    lBourrageTitle: "3. Bourrage — La Clé du Rendement 100%",
    lBourrageDesc: "Un bourrage insuffisant = les gaz s'échappent vers l'entrée = 50 à 80% de l'énergie explosive perdue = culot = métrage raté. Le bourrage est ce qui fait la différence entre 70% et 100% du métrage arraché.",
    lBourrageFormula: "L_bourrage = 20 × Ø_taillant",
    lBourrageMinimum: "20 × 38mm = 760mm = 76cm MINIMUM",
    bourrageProcTitle: "Procédure de bourrage :",
    bourrageProc1: "Matériau : ARGILE de préférence",
    bourrageProc1a: "→ En dépannage : fines de roche anguleuses (efficacité 70%)",
    bourrageProc1b: "→ Jamais : galets ronds, pierres lisses, déblais grossiers",
    bourrageProc2: "Introduire l'argile par couches de 15-20cm",
    bourrageProc3: "Compacter chaque couche : 6 à 8 coups de tige MINIMUM",
    bourrageProc4: "Remplir jusqu'à 70-80cm de l'entrée du trou",
    bourrageProc5: "Vérifier que le fil de l'amorce sort proprement — sans être coincé",
    step10Desc: "La déclaration dans le registre journalier est l'acte technique final du mineur. Elle alimente directement la plateforme HydroMines Production — les données doivent être exactes et complètes.",
    step10Grid1Title: "📊 Trous forés total",
    step10Grid1Desc9m2: "28 trous — conformes au plan",
    step10Grid1Desc12m2: "38 trous — conformes au plan",
    step10Grid2Title: "🔩 Répartition bouchon",
    step10Grid2Desc12m2: "3 vides + 6 chargés TOVEX",
    step10Grid2DescIntl: "6 vides + 3 chargés TOVEX",
    step10Grid2Desc9m2: "1 vide + 4 chargés TOVEX",
    step10Grid3Title: "📏 Fleuret utilisé",
    step10Grid3Desc: "Fleuret 1.8m (forage 1.7m) ou Fleuret 2.4m (forage 2.3m)",
    step10Grid4Title: "💥 Explosifs consommés",
    step10Grid4Desc: "ANFO : X kg | TOVEX : X cartouches | Amorces : X",
    step10Grid5Title: "📐 Métrage foré déclaré",
    step10Grid5Desc: "= Longueur fleuret × 1 (par trou) — hors trous vides",
    step10Grid6Title: "⏰ Heure de tir effective",
    step10Grid6Desc: "Heure réelle du tir — à déclarer précisément",
    step10Alert: "Un registre inexact a des conséquences sur la traçabilité des explosifs et sur la sécurité du poste suivant. La précision du registre reflète la rigueur du mineur.",
    lightboxPurgeTitle: "🔍 Illustration : Canne de purge & Bec Type 2 (Agrandie)",
    lightboxForageTitle: "🔍 Illustration : Perforateur Montabert T23 & Béquille (Agrandie)",
    lightboxSoufflageTitle: "🔍 Illustration : Nettoyage & Soufflage du Trou (Agrandie)",
    lightboxPurgeDesc: "Détail haute définition de la canne de purge et du bec de Type 2 SMI avec double biseau trempé de 35° engagé dans la fissure.",
    lightboxForageDesc: "Schéma précis du perforateur à poussoir pneumatique Montabert T23 en livrée verte d'origine avec son raccordement de béquille excentré à l'arrière.",
    lightboxSoufflageDesc: "Illustration de la canne de soufflage en cuivre insérée à fond de trou pour l'évacuation cyclonique des poussières de silice.",
    stepHeaders: [
      { num: 1, icon: '📋', title: 'PRISE DE POSTE & CONSIGNES TECHNIQUES', cat: 'TECHNIQUE' },
      { num: 2, icon: '🌬', title: "VÉRIFICATION DE L'AÉRAGE", cat: 'TECHNIQUE' },
      { num: 3, icon: '💧', title: 'ARROSAGE DU CHANTIER', cat: 'TECHNIQUE' },
      { num: 4, icon: '⛏️', title: 'PURGE DU CHANTIER', cat: 'SÉCURITÉ' },
      { num: 5, icon: '🔧', title: 'VÉRIFICATION MATÉRIEL FORAGE', cat: 'TECHNIQUE' },
      { num: 6, icon: '🔩', title: 'FORAGE — ATTEINDRE 100% DU MÉTRAGE', cat: 'FORAGE' },
      { num: 7, icon: '🔍', title: 'VÉRIFICATION & NETTOYAGE DES TROUS', cat: 'TECHNIQUE' },
      { num: 8, icon: '💥', title: 'CHARGEMENT EXPLOSIFS', cat: 'EXPLOSIFS' },
      { num: 9, icon: '🔌', title: 'PRÉ-TIR & MISE À FEU', cat: 'TECHNIQUE' },
      { num: 10, icon: '📝', title: 'SAISIE DU REGISTRE JOURNALIER', cat: 'TECHNIQUE' }
    ],
    step1Title: "Ce que vous recevez du poste précédent conditionne votre efficacité et votre sécurité pour toute la journée.",
    step1Grid: [
      { title: "📍 Avancement du chantier", text: "Métrage réalisé au poste précédent. Position actuelle du front." },
      { title: "💥 État de la dernière volée", text: "Trous ratés ? Raté non tiré ? Culots résiduels signalés ?" },
      { title: "🌬️ État de la ventilation", text: "Galerie aérée ? Depuis combien de temps ? CO résiduel ?" },
      { title: "🔧 Matériel disponible", text: "Perforateur opérationnel ? Flexibles en état ? Consommables ?" },
      { title: "📦 Stock explosifs", text: "ANFO disponible, TOVEX, amorces — quantités suffisantes ?" },
      { title: "⚠️ Anomalies signalées", text: "Zones instables, infiltrations eau, incidents du poste précédent" }
    ],
    step1Alert: "Un trou raté non signalé par le poste précédent est un danger mortel. Exigez la confirmation explicite de l'état des trous avant d'entrer dans la galerie.",
    step2Title: "L'aérage est la première vérification technique avant toute entrée en galerie. Une galerie mal ventilée contient du CO (monoxyde de carbone) et des fumées nitreuses post-tir invisibles et mortels.",
    step2ProcTitle: "Procédure de vérification :",
    step2Proc: [
      "Vérifier le débit d'air à l'entrée de la galerie — flux d'air perceptible sur la peau du visage",
      "Contrôler l'état du ventilateur et du tubage souple (manchette) : aucun pli, aucune déchirure, raccords étanches",
      "En présence d'un détecteur CO : mesure < 25 ppm avant entrée",
      "Délai post-tir minimum à respecter : 30 minutes de ventilation avant tout accès au chantier",
      "Vérifier que l'air circule jusqu'au FRONT DE TAILLE — pas seulement à l'entrée de la galerie"
    ],
    step2Alert: "L'aérage n'est pas optionnel. Si la ventilation est insuffisante — STOP — le travail est interdit jusqu'au rétablissement d'un débit conforme.",
    step3Title: "L'arrosage précède toujours la purge. L'eau humidifie la roche et révèle les fissures, les zones de décollement et les blocs instables invisibles à l'œil sec. Un chantier mal arrosé cache ses dangers.",
    step3Alert: "L'eau révèle ce que l'œil ne voit pas sur roche sèche. Arroser = préparer une purge efficace.",
    step3ProcTitle: "Procédure d'arrosage :",
    step3Proc: [
      "Connecter le flexible d'eau à la conduite de chantier",
      "Arroser le FRONT DE TAILLE en premier : zones fissurées, joints de stratification, discontinuités visibles",
      "Arroser la VOÛTE sur 15m minimum depuis le front — les zones humides qui ressortent signalent des fissures ouvertes",
      "Arroser les PAREMENTS (murs latéraux) de haut en bas",
      "Arroser le SOL — lutte contre la poussière de silice",
      "Le chantier est correctement arrosé quand aucun nuage de poussière ne se soulève lors des déplacements"
    ],
    step3AlertSilicose: "La poussière de roche contient de la silice libre. Inhalation chronique = silicose professionnelle irréversible. L'arrosage protège les poumons pour toute la carrière du mineur.",
    step4Alert: "« La chute de blocs est le premier ennemi dans les mines souterraines »",
    step4Title: "La purge consiste à désolidariser tous les blocs instables de la voûte et des parements sur 15 mètres minimum depuis le front de taille. Elle se fait APRÈS l'arrosage, quand la roche a révélé ses fissures.",
    step4RuleTitle: "Règles absolues :",
    step4Rules: [
      "AUCUNE MACHINE EN FONCTIONNEMENT pendant la purge — L'écoute des vibrations et craquements est essentielle",
      "Se positionner TOUJOURS hors de la zone de chute potentielle — jamais sous un bloc en cours de purge",
      "Frapper méthodiquement la voûte et les parements — SON CREUX = bloc instable à purger immédiatement | SON PLEIN = roche stable, continuer",
      "La purge est terminée quand 100% des zones testées donnent un son plein — pas 99%",
      "Distance de travail : 15m minimum depuis le front"
    ],
    step4AlertSafety: "Un bloc non purgé peut tomber lors du forage ou du chargement. Un seul bloc suffit. La purge n'est jamais abrégée.",
    step5Title: "Avant de démarrer le perforateur, chaque composant est inspecté. Un flexible qui éclate sous 10 bars est une arme dans la galerie.",
    step5ChecklistTitle: "🔩 Montabert T23 — Checklist",
    step5Checklist: [
      "Taillant bouton 38mm : serré et non usé",
      "Lubrificateur d'air : niveau d'huile suffisant",
      "Raccord d'eau de forage : connexion étanche",
      "Boulon de fixation barre de guidage : serré",
      "Silencieux et protège-taillant : en place"
    ],
    step5FlexTitle: "🌬️ Flexibles — Anti-éclatement",
    step5Flex: [
      "Aucune coupure, boursouflure ou usure",
      "Raccord d'air comprimé protégé par : \n→ Colliers de sécurité ou câbles anti-fouet",
      "Attaches et colliers serrés des deux côtés",
      "Flexible d'eau de forage (2 pouces) : état vérifié"
    ],
    step5SafetyAlert: "Un flexible d'air sous 10 bars qui se décroche ou éclate devient un fouet violent. Chaque raccord doit être sécurisé avant de mettre en pression.",
    step5NoiseTitle: "🎧 Équipement auditif",
    step5NoiseDesc: "Casque anti-bruit obligatoire avant démarrage du perforateur. Niveau sonore forage : 100-110 dB. Exposition non protégée = perte auditive irréversible.",
    step7Title: "Avant le chargement des explosifs, chaque trou est soufflé et contrôlé. Un trou bouché ou insuffisamment profond = cartouche TOVEX coincée = raté de tir.",
    step7ChecklistTitle: "Checklist technique :",
    step7Checklist: [
      "Soufflage de chaque trou à l'air comprimé (du fond vers l'entrée)",
      "Vérification de la profondeur avec la tige de mesure \n→ Trou trop court : noter la référence pour correction \n→ Profondeur conforme : marquer d'un repère à la craie",
      "Contrôle rigoureux de l'humidité : \n→ Trou sec : chargeable à l'ANFO de performance \n→ Trou humide/eau : TOVEX uniquement (l'ANFO se dissout)",
      "Contrôle visuel des trous de bouchon (alignement)"
    ],
    step7Advice: "💡 CONSEIL : Souffler énergiquement libère la silice résiduelle. Portez impérativement votre masque respiratoire à cartouche lors de cette opération !",
    step7VisualTitle: "Trou Nettoyé & Soufflé",
    step7Alert: "Un trou mouillé chargé avec ANFO = raté garanti. Le TOVEX résiste à l'eau et garantit la détonation même dans un trou noyé. Adapter selon l'état de chaque trou.",
    step8Title: "Le chargement se fait 30 à 60 minutes avant l'heure de tir. L'ordre est impératif : TOVEX en premier, ANFO ensuite, bourrage en dernier.",
    step8TovexTitle: "1. TOVEX + Amorce — La Base du Tir",
    step8TovexProc: [
      "Prendre la cartouche TOVEX 100g",
      "Insérer la capsule électrique dans la cartouche TOVEX",
      "RÈGLE ABSOLUE — SHUNTAGE DES FILS :",
      "Les fils de l'amorce doivent être TORSADÉS ENSEMBLE (shuntés) jusqu'au moment du raccordement final au fil de tir. Aucun fil ne doit rester libre. Un fil libre capte l'électricité statique ou un courant vagabond = détonation accidentelle.",
      "Introduire la cartouche TOVEX amorcée AU FOND DU TROU",
      "Ne jamais forcer — ne jamais utiliser de fleuret ou de tige métallique",
      "Le fil de l'amorce sort du trou et reste shunté"
    ],
    step8PortanoleTitle: "2. Portanole Pneumatique — Chargement ANFO",
    step8PortanoleProc: [
      "Vérifier que le FLEXIBLE ANTISTATIQUE est bien attaché à la portanole",
      "Vérifier l'état du flexible — aucune coupure ni usure",
      "Introduire l'extrémité du flexible au fond du trou",
      "Charger l'ANFO (granulés) dans la portanole",
      "Souffler progressivement — du fond vers le col",
      "Arrêter à la longueur de colonne explosive prévue :"
    ],
    step8QuantitiesTitle: "Quantités requises estimées pour ce gabarit ({gabarit}) :",
    step9Title: "La mise à feu est la conclusion de toute la préparation. Les 15 minutes précédentes sont les plus critiques — une check-list non respectée ici remet en cause toute la journée.",
    step9ChecklistTitle: "CHECKLIST PRÉ-TIR :",
    step9Checklist: [
      "Outils de forage évacués de la zone de tir",
      "Flexibles d'air comprimé rangés et sécurisés",
      "Canne de purge replacée — hors zone de tir",
      "Fil de tir principal : non coupé, non coincé, longueur suffisante",
      "Connexion de chaque amorce au fil de tir vérifiée",
      "Shuntage maintenu jusqu'à la connexion finale",
      "Galvanomètre : continuité du circuit confirmée",
      "Signalisation de la zone de tir mise en place (barrières)",
      "Évacuation totale confirmée — mineur + aide-mineur",
      "Heure de tir planifiée respectée"
    ],
    step9ProcTitle: "Procédure de mise à feu :",
    step9Proc: [
      "S'éloigner à distance de sécurité (minimum 100m depuis le front)",
      "Vérifier une dernière fois qu'aucune personne n'est dans la zone",
      "Raccorder le fil de tir à l'appareil de tir homologué SMI",
      "Charger l'appareil de tir (impulsion électrique)",
      "Déclencher — vérifier le signal de mise à feu"
    ],
    step9AlertTitle: "⚠️ POST-TIR & INCIDENTS",
    step9Alerts: [
      "• Attente minimum 30 minutes avant tout accès",
      "• Vérification ventilation et CO avant retour",
      "• En cas de raté : procédure trou raté — NE PAS APPROCHER avant 30 minutes. Signaler au Responsable Technique."
    ],
    legendVide: "Vide décharge (V)",
    legendBouchon: "Bouchon TOVEX (D0)",
    legendG1: "Groupe 1 (D1 — 25ms)",
    legendG2: "Groupe 2 (D2 — 50ms)",
    legendG3: "Groupe 3 (D3 — 75ms)",
    legendG4: "Groupe 4 (D4 — 100ms)",
    legendRadier: "Radier",
    legendParements: "Parements",
    legendVoute: "Voûte",
    activeGroupLabels: {
      0: "D0 — 0ms — BOUCHON (TOVEX)",
      25: "D1 — 25ms — GROUPE 1 (ANFO)",
      50: "D2 — 50ms — GROUPE 2 (ANFO)",
      75: "D3 — 75ms — GROUPE 3 (ANFO)",
      100: "D4 — 100ms — GROUPE 4 (ANFO)",
      contour: "D5 — 125ms — CONTOUR (Radier / Parements / Voûte) — ANFO"
    }
  },
  ar: {
    title: "العامل المنجمي المثالي",
    subtitle: "شركة معادن إميضر (SMI) — دليل إجراءات الحفر والتفجير عالي الأداء",
    targetYield: "المردود المستهدف",
    excellence: "🎯 التميز 100%",
    fromBouchon: "من ثقوب القطع (البوشون) إلى سجل العمل اليومي",
    step: "الخطوة",
    progression: "مستوى التقدم:",
    btnEnLarge: "تكبير المخطط",
    btnEnLargePurge: "تكبير الرسم التوضيحي",
    btnEnLargeForage: "تكبير الرسم التوضيحي",
    btnEnLargeSoufflage: "تكبير الرسم التوضيحي",
    pressureSpecs: "⚠️ الضغوط الاسمية: الهواء 7-9 بار | الماء 4-6 بار",
    earSpecsTitle: "🎧 معدات حماية السمع",
    earSpecsDesc: "ارتداء واقيات السمع أو الخوذة المضادة للضوضاء إلزامي قبل تشغيل آلة الحفر (المثقاب). مستوى ضجيج الحفر يتراوح بين 100 و110 ديسيبل. التعرض دون حماية يسبب فقداً دائماً وغير قابل للاسترداد للسمع.",
    gallerySection: "مقطع الرواق — مخطط التفجير:",
    smiGabarit: "🔷 نموذج 12م² — SMI",
    intlGabarit: "🌍 نموذج 12م² — دولي",
    gabarit9m2: "🔹 نموذج 9م² — التخطيط",
    foreMustArrache: "الطول المحفور ← يجب أن يُنسف بالكامل",
    bourrageParfait: "حشو مثالي ومحكم",
    divergenceIdeale: "توازي مثالي (لا انحراف)",
    trousRespectes: "تطابق الثقوب المحفورة",
    planTirInteractive: "مخطط تفجير تفاعلي",
    planTirInstruction: "مرر مؤشر الماوس فوق أي مجموعة توقيت لتحديد الثقوب المعنية ورؤية التسلسل الزمني للتفجير.",
    gabarit12m2Label: "نموذج 12م² لـ SMI: 38 ثقباً | ثقوب القطع (البوشون): 3 فارغة + 6 معبأة بالتوفيكس | 6 مجموعات | من D0 إلى D5",
    gabaritIntlLabel: "النموذج الدولي 12م²: 38 ثقباً | ثقوب القطع (البوشون): 6 فارغة + 3 معبأة بالتوفيكس | 6 مجموعات | من D0 إلى D5",
    gabarit9m2Label: "نموذج 9م²: 28 ثقباً | ثقوب القطع (البوشون): 1 فارغ + 4 معبأة بالتوفيكس | 5 مجموعات | من D0 إلى D4",
    ordreForageTitle: "ترتيب الحفر — ممنوع تجاوزه نهائياً",
    orderStepA: "الخطوة أ ← ثقوب القطع (البوشون) أولاً",
    orderStepADesc: "تخلق ثقوب القطع (البوشون) أول مساحة حرة للنسف. بدون هذه المساحة الحرة، تتبدد طاقة الانفجار في جميع الاتجاهات داخل الصخر دون تحقيق أي إزاحة. البوشون هو الركيزة الأساسية لعملية التفجير بأكملها.",
    orderStepB: "الخطوة ب ← من الداخل نحو الخارج",
    orderStepBDesc9m2: "G1 ← G2 ← G3. تنفجر كل مجموعة في اتجاه الفراغ الذي أحدثته المجموعة السابقة. لا تتجاوز أي مجموعة أبداً، لأن الفراغ الضروري للتفجير التالي لم يتشكل بعد.",
    orderStepBDesc12m2: "G1 ← G2 ← G3 ← G4. تنفجر كل مجموعة في اتجاه الفراغ الذي أحدثته المجموعة السابقة. لا تتجاوز أي مجموعة أبداً، لأن الفراغ الضروري للتفجير التالي لم يتشكل بعد.",
    orderStepC: "الخطوة ج ← ثقوب المحيط (الكونتور) في النهاية",
    orderStepCDesc: "الأرضية (Radier) ← الجوانب (Parements) ← السقف (Voûte). يحدد الكونتور المظهر النهائي للرواق. يتم حفر ثقوب المحيط في النهاية لتفادي إضعاف واستثارة الصخور المحيطة بالرواق أثناء حفر الثقوب المركزية.",
    orderRule: "حفر ثقب واحد في غير محله أو بترتيب خاطئ يقلل بشكل كبير من مردودية التفجير. الالتزام بالترتيب ليس مجرد اقتراح، بل هو قاعدة فيزيائية حتمية.",
    parallelismeTitle: "توازي الثقوب — أساس المردودية العالية",
    parallelismeDesc: "يجب أن تكون جميع الثقوب متوازية تماماً فيما بينها وعمودية على جبهة الحفر. أي انحراف في حفر الثقوب يؤدي إلى بقاء قعر غير متفجر (Culot) يتراكم من تفجير لآخر ويعيق تقدم الرواق.",
    simulatorDeviation: "محاكي انحراف الحفر والتفجير:",
    angleDivergence: "زاوية الانحراف عن التوازي:",
    volumeArrache: "التقدم المحقق",
    rendementVolee: "مردودية التفجير",
    culotResiduel: "القعر المتبقي",
    angle: "الزاوية",
    culot: "القعر المتبقي",
    arrache: "التقدم المحقق",
    rendement: "المردودية",
    purgeEquip: "معدات معتمدة من شركة SMI",
    purgeEquipTitle: "عمود التقشير ورأس التقشير من الصنف 2",
    purgeEquipDesc1: "عمود التقشير هو عبارة عن قضيب متين ومقاوم مصنوع من الفولاذ الخاص أو خلائط الألومنيوم الخفيفة عالية الصلابة، مصمم خصيصاً لعمليات تقشير الصخور اليدوية في المناجم.",
    purgeEquipDesc2: "يتميز رأس التقشير من الصنف 2 (المعتمد في منجم إميضر SMI) بزاوية رافعة محسنة وشفرة حادة صلبة ذات شطب مزدوج. يسمح هذا التصميم بإدخاله بدقة في شقوق الانفصال لإسقاط الألواح الصخرية غير المستقرة ميكانيكياً مع الحفاظ على مسافة أمان كافية.",
    purgeSpecs1: "🔘 مقبض فولاذي/ألومنيوم: خفيف الوزن وعالي الصلابة",
    purgeSpecs2: "📐 رأس من الصنف 2: زاوية رافعة مثالية بـ 35 درجة",
    verdictPerfect: "مثالي — تقدم بـ 170 سم / 170 سم",
    verdictExcellent: "ممتاز — ",
    verdictAcceptable: "مقبول — ",
    verdictAttention: "انتباه — ",
    verdictCritique: "حرج — ",
    verdictReformer: " — تجب إعادة الحفر",
    colonneConfigTitle: "تكوين العمود المتفجر:",
    colonneConfig18: "قضيب الحفر (فلوري) 1.8م (عمق الحفر 1.7م = 170سم): الحشو 76سم ← عمود الأنفور (ANFO) 94سم",
    colonneConfig24: "قضيب الحفر (فلوري) 2.4م (عمق الحفر 2.3م = 230سم): الحشو 76سم ← عمود الأنفور (ANFO) 154سم",
    quantitiesTitle: "الكميات التقريبية المطلوبة لهذا المقاس",
    qAnfoTotal: "إجمالي الأنفور (ANFO)",
    qTovex100g: "توفيكس 100غ",
    qAmorces: "الصواعق",
    qToCharge: "ثقوب للشحن",
    lBourrageTitle: "3. الحشو (Bourrage) — مفتاح الحصول على مردودية 100%",
    lBourrageDesc: "الحشو غير الكافي يؤدي إلى تسرب غازات الانفجار نحو الخارج، مما يضيع 50% إلى 80% من الطاقة الانفجارية ويتسبب في تشكل القعر المتبقي (Culot) وفشل التقدم المطلوب. الحشو المحكم هو الفارق الحاسم بين تحقيق مردود 70% أو 100% من طول الوجبة.",
    lBourrageFormula: "طول الحشو = 20 × قطر لقمة الحفر",
    lBourrageMinimum: "20 × 38 مم = 760 مم = 76 سم كحد أدنى",
    bourrageProcTitle: "بروتوكول عملية الحشو:",
    bourrageProc1: "المادة: الطين (Argile) هو الخيار الأفضل والأكثر كفاءة",
    bourrageProc1a: "← كبديل مؤقت: فتات صخري زاوي حاد الحواف (بفعالية 70%)",
    bourrageProc1b: "← يُمنع منعاً كلياً: الحصى المستدير، الحجارة الملساء، الركام الخشن",
    bourrageProc2: "إدخال الطين على دفعات متتالية يتراوح طول كل منها بين 15 و20 سم",
    bourrageProc3: "دك كل دفعة بإحكام: 6 إلى 8 ضربات على الأقل باستخدام قضيب الدك (المسواك)",
    bourrageProc4: "تعبئة الحشو حتى عمق 70 إلى 80 سم من مدخل الثقب",
    bourrageProc5: "التأكد من خروج سلك الصاعق بشكل سليم دون تعرضه للاحتكاك أو القطع",
    step10Desc: "إن تسجيل البيانات في السجل اليومي هو الخطوة التقنية الختامية لعامل المنجم. ترسل هذه البيانات مباشرة إلى منصة HydroMines Production، لذا يجب أن تكون دقيقة وشاملة بالكامل.",
    step10Grid1Title: "📊 إجمالي الثقوب المحفورة",
    step10Grid1Desc9m2: "28 ثقباً — مطابقة لمخطط التفجير",
    step10Grid1Desc12m2: "38 ثقباً — مطابقة لمخطط التفجير",
    step10Grid2Title: "🔩 توزيع شحنة القطع (البوشون)",
    step10Grid2Desc12m2: "3 ثقوب فارغة + 6 معبأة بالتوفيكس (TOVEX)",
    step10Grid2DescIntl: "6 ثقوب فارغة + 3 معبأة بالتوفيكس (TOVEX)",
    step10Grid2Desc9m2: "1 ثقب فارغ + 4 معبأة بالتوفيكس (TOVEX)",
    step10Grid3Title: "📏 نوع قضيب الحفر المستخدم",
    step10Grid3Desc: "قضيب حفر (فلوري) 1.8م (عمق 1.7م) أو قضيب 2.4م (عمق 2.3م)",
    step10Grid4Title: "💥 المتفجرات المستهلكة",
    step10Grid4Desc: "أنفور (ANFO): X كجم | توفيكس (TOVEX): X خراطيش | صواعق: X",
    step10Grid5Title: "📐 مجموع أمتار الحفر المصرح بها",
    step10Grid5Desc: "= طول قضيب الحفر × عدد الثقوب (باستثناء الثقوب الفارغة)",
    step10Grid6Title: "⏰ وقت التفجير الفعلي",
    step10Grid6Desc: "ساعة التفجير الفعلية والوقوع الحقيقي للتفجير",
    step10Alert: "إن تسجيل بيانات غير دقيقة في السجل يضر بتتبع المتفجرات ويشكل خطراً حقيقياً على سلامة الوردية التالية. دقة السجل تعكس مدى احترافية وانضباط عامل المنجم.",
    lightboxPurgeTitle: "رسم توضيحي: عمود التقشير ورأس التقشير من الصنف 2 (مكبّر)",
    lightboxForageTitle: "رسم توضيحي: آلة الحفر Montabert T23 والدعامة بجميع تفاصيلها (مكبّر)",
    lightboxSoufflageTitle: "رسم توضيحي: تنظيف ونفخ الثقوب قبل الشحن (مكبّر)",
    lightboxPurgeDesc: "رسم تفصيلي لعمود التقشير ورأس التقشير المعتمد لدى منجم SMI إميضر مع زاوية ميلان 35 درجة داخل الفالق الصخري.",
    lightboxForageDesc: "رسم تخطيطي دقيق لآلة الحفر بالدفع الهوائي Montabert T23 بلونها الأخضر الأصلي مع مخرج الدعامة التلسكوبية اللامركزي في الواجهة الخلفية.",
    lightboxSoufflageDesc: "تمثيل فني لأنبوب النفخ النحاسي أثناء إدخاله إلى عمق الثقب للتخلص من غبار السيليكا المتراكم بشكل حلزوني وآمن.",
    stepHeaders: [
      { num: 1, icon: '📋', title: 'تلقي الوردية والتعليمات التقنية', cat: 'فني' },
      { num: 2, icon: '🌬', title: 'التحقق من تهوية الرواق', cat: 'فني' },
      { num: 3, icon: '💧', title: 'رش ورشة العمل بالماء', cat: 'فني' },
      { num: 4, icon: '⛏️', title: 'تقشير السقف والجوانب (Purge)', cat: 'سلامة' },
      { num: 5, icon: '🔧', title: 'فحص وتدقيق معدات الحفر', cat: 'فني' },
      { num: 6, icon: '🔩', title: 'الحفر — تحقيق العمق الكامل للوجبة', cat: 'حفر' },
      { num: 7, icon: '🔍', title: 'فحص وتنظيف ونفخ الثقوب', cat: 'فني' },
      { num: 8, icon: '💥', title: 'شحن وتعبئة المواد المتفجرة', cat: 'متفجرات' },
      { num: 9, icon: '🔌', title: 'التحضير للنسف وإطلاق الشرارة', cat: 'فني' },
      { num: 10, icon: '📝', title: 'ملء السجل اليومي للعملية', cat: 'فني' }
    ],
    step1Title: "إن ما تتلقاه من الوردية السابقة يحدد مدى كفاءتك وسلامتك طوال اليوم.",
    step1Grid: [
      { title: "📍 تقدم العمل في الورشة", text: "الأمتار المنجزة في الوردية السابقة. الموقع الحالي لجبهة العمل (جبهة الحفر)." },
      { title: "💥 حالة التفجير الأخير", text: "ثقوب فاشلة؟ ثقوب لم تنفجر؟ بقايا الثقوب (القعور المتبقية Culots) المسجلة؟" },
      { title: "🌬️ حالة التهوية", text: "هل الرواق مهوى؟ منذ متى؟ نسبة غاز أحادي أكسيد الكربون (CO) المتبقي؟" },
      { title: "🔧 المعدات المتاحة", text: "هل آلة الحفر (المثقاب) جاهزة؟ هل الخراطيم بحالة جيدة؟ المستهلكات (القضبان واللقم)؟" },
      { title: "📦 مخزون المتفجرات", text: "هل الأنفور (ANFO)، والتوفيكس (TOVEX)، والصواعق متوفرة بكميات كافية؟" },
      { title: "⚠️ العيوب والمشاكل المبلغ عنها", text: "المناطق غير المستقرة، تسربات المياه، حوادث الوردية السابقة." }
    ],
    step1Alert: "الثقب الفاشل غير المبلغ عنه من الوردية السابقة يمثل خطراً قاتلاً. يجب المطالبة بتأكيد صريح لحالة الثقوب قبل دخول الرواق.",
    step2Title: "التهوية هي أول فحص تقني قبل أي دخول إلى الرواق. الرواق الذي يفتقر للتهوية الجيدة يحتوي على غاز أحادي أكسيد الكربون (CO) والغازات النيتروجينية السامة الناتجة عن التفجير، وهي غازات غير مرئية وقاتلة.",
    step2ProcTitle: "بروتوكول التحقق:",
    step2Proc: [
      "التحقق من تدفق الهواء عند مدخل الرواق — يجب الشعور بتيار الهواء على بشرة الوجه",
      "فحص حالة المروحة والأنبوب المرن (الكم): خلوها من الالتواءات والتمزقات والتأكد من إحكام التوصيلات",
      "في حال وجود كاشف الغاز: يجب أن تكون نسبة أحادي أكسيد الكربون أقل من 25 جزء في المليون (ppm) قبل الدخول",
      "الحد الأدنى للانتظار بعد التفجير: 30 دقيقة من التهوية المستمرة قبل أي دخول لورشة العمل",
      "التأكد من وصول الهواء النقي إلى جبهة الحفر مباشرة وليس فقط عند مدخل الرواق"
    ],
    step2Alert: "التهوية ليست اختيارية. إذا كانت التهوية غير كافية، قف فوراً (STOP) ويُمنع العمل تماماً حتى تتم استعادة تدفق الهواء المطابق للمواصفات.",
    step3Title: "رش الماء يسبق دائماً عملية تقشير السقف والجوانب (Purge). فالماء يرطب الصخور ويكشف الشقوق ومناطق الانفصال والكتل غير المستقرة التي لا يمكن رؤيتها بالعين المجردة عندما تكون جافة. ورشة العمل الجافة تخفي مخاطرها.",
    step3Alert: "يكشف الماء ما لا تراه العين على الصخور الجافة. الرش بالماء = التحضير لتقشير آمن وفعال.",
    step3ProcTitle: "بروتوكول الرش بالماء:",
    step3Proc: [
      "توصيل خرطوم المياه بالأنبوب الرئيسي لورشة العمل",
      "رش جبهة الحفر أولاً: المناطق المتشققة، ومستويات الطبقات، والعيوب الظاهرة",
      "رش السقف على مسافة 15 متراً على الأقل من الجبهة — تبرز المناطق الرطبة لتشير إلى الشقوق المفتوحة",
      "رش الجوانب من الأعلى إلى الأسفل",
      "رش الأرضية للحد من انتشار غبار السيليكا الضار",
      "تكون ورشة العمل مرشوشة بشكل صحيح عندما لا يتصاعد أي غبار أثناء الحركة والتنقل"
    ],
    step3AlertSilicose: "يحتوي غبار الصخور على السيليكا الحرة. استنشاقها المستمر يؤدي إلى مرض السحار الرئوي (السيليكوز) المهني غير القابل للعلاج. الرش بالماء يحمي رئتيك طوال حياتك المهنية.",
    step4Alert: "« سقوط الكتل الصخرية هو العدو الأول في المناجم الجوفية »",
    step4Title: "تتمثل عملية التقشير (Purge) في إسقاط جميع الكتل الصخرية غير المستقرة من السقف والجوانب على مسافة لا تقل عن 15 متراً من جبهة الحفر. وتتم هذه العملية بعد رش الماء، بعد أن كشفت الصخور عن شقوقها وفوالقها.",
    step4RuleTitle: "قواعد صارمة لا غنى عنها:",
    step4Rules: [
      "إيقاف جميع الآلات تماماً أثناء التقشير — الاستماع لصوت الاهتزازات والتصدعات داخل الصخور أمر بالغ الأهمية لسلامتك",
      "الوقوف دائماً خارج منطقة السقوط المحتملة — لا تقف أبداً تحت كتلة صخرية تقوم بتقشيرها",
      "طرق السقف والجوانب بشكل منهجي بمقبض عمود التقشير — الصوت الأجوف = كتلة غير مستقرة تجب إزالتها فوراً | الصوت المعدني الرنان = صخرة مستقرة، واصل العمل",
      "تنتهي عملية التقشير عندما تعطي جميع المناطق المختبرة صوتاً معدنياً رناناً بنسبة 100% وليس 99%",
      "مسافة الأمان للعمل: الوقوف على بعد 15 متراً كحد أدنى من جبهة الحفر غير المحمية"
    ],
    step4AlertSafety: "الكتلة الصخرية غير المستقرة التي لم يتم تقشيرها قد تسقط أثناء الحفر أو التعبئة. صخرة واحدة كافية لإحداث كارثة. لا تستهن أبداً بعملية التقشير ولا تختصرها.",
    step5Title: "قبل تشغيل آلة الحفر (المثقاب)، يتم فحص كل جزء بدقة. إن انفجار خرطوم هواء تحت ضغط 10 بار يشبه إطلاق قذيفة قاتلة داخل الرواق.",
    step5ChecklistTitle: "🔩 قائمة فحص آلة الحفر Montabert T23",
    step5Checklist: [
      "لقمة الحفر ذات الأزرار (38 مم): مثبتة بإحكام وغير متآكلة",
      "مزيتة الهواء: مستوى زيت كافٍ",
      "وصلة مياه الحفر: التوصيل محكم وخالٍ من التسربات",
      "مسمار تثبيت قضيب التوجيه: مربوط بإحكام شديد",
      "كاتم الصوت وواقي اللقمة: في مكانهما الصحيح وسليمان"
    ],
    step5FlexTitle: "🌬️ الخراطيم — منع الانفجار المفاجئ",
    step5Flex: [
      "خلو تام من القطوع، والانتفاخات، أو التآكل الظاهر",
      "وصلة الهواء المضغوط محمية بواسطة: \n← مرابط أمان أو كابلات مانعة للالتواء المفاجئ (Câbles anti-fouet)",
      "المثبتات والمرابط مشدودة جيداً من الطرفين",
      "خرطوم مياه الحفر (2 بوصة): تم التحقق من حالته وسلامته"
    ],
    step5SafetyAlert: "إن خرطوم الهواء الخاضع لضغط 10 بار إذا انفصل أو انفجر يتحول إلى سوط عنيف ومميت. يجب تأمين كل وصلة تماماً قبل وضع الخراطيم تحت الضغط.",
    step5NoiseTitle: "🎧 معدات حماية السمع",
    step5NoiseDesc: "واقي الأذن أو خوذة الحماية من الضوضاء إلزامية قبل بدء تشغيل آلة الحفر. مستوى ضجيج الحفر يتراوح بين 100 و110 ديسيبل. التعرض بدون حماية يؤدي إلى فقدان السمع بشكل دائم وغير قابل للاسترداد.",
    step7Title: "قبل تعبئة المتفجرات، يتم تنظيف كل ثقب بالنفخ وفحصه بدقة. أي ثقب مسدود أو غير عميق بما يكفي يتسبب في انحشار خرطوشة التوفيكس (TOVEX) وفشل عملية التفجير.",
    step7ChecklistTitle: "قائمة التحقق التقني للثقوب:",
    step7Checklist: [
      "نفخ كل ثقب بالهواء المضغوط باستخدام أنبوب النفخ (من القاع إلى الخارج)",
      "التحقق من العمق باستخدام قضيب القياس المخصص (Tige de mesure) \n← ثقب قصير جداً: تسجيل رقمه وموقعه لإعادة حفره \n← العمق مطابق: وضع علامة مميزة بالطبشور على الصخر",
      "الفحص الدقيق لرطوبة الثقب ووجود المياه: \n← ثقب جاف: يمكن شحنه بخليط الأنفور (ANFO) عالي الأداء \n← ثقب رطب أو مغمور بالماء: يُشحن بالتوفيكس (TOVEX) فقط (لأن الأنفور يذوب بالماء ويفقد مفعوله)",
      "الفحص البصري لتوازي وتنسيق ثقوب القطع (البوشون)"
    ],
    step7Advice: "💡 نصيحة: عملية النفخ تنشر غبار السيليكا المتراكم بشكل كثيف. ارتدِ قناع التنفس ذو المرشح إلزامياً لحماية رئتيك أثناء النفخ!",
    step7VisualTitle: "ثقب نظيف ومنفوخ بالكامل",
    step7Alert: "تعبئة ثقب مبلل بخليط الأنفور (ANFO) يعني فشل التفجير حتماً في هذا الثقب. يتميز التوفيكس (TOVEX) بمقاومته الفائقة للمياه وضمان الإشعال حتى في الثقوب المغمورة. يجب تكييف نوع المتفجر حسب حالة كل ثقب.",
    step8Title: "تتم عملية شحن وتعبئة المواد المتفجرة قبل 30 إلى 60 دقيقة من موعد التفجير. ترتيب الشحن إلزامي وصارم: التوفيكس (TOVEX) أولاً في قاع الثقب، ثم الأنفور (ANFO)، يليهما الحشو (Bourrage) في النهاية.",
    step8TovexTitle: "1. التوفيكس (TOVEX) مع الصاعق — أساس الشحنة",
    step8TovexProc: [
      "أخذ خرطوشة التوفيكس (100 غرام)",
      "إدخال كبسولة الصاعق الكهربائي بعناية داخل خرطوشة التوفيكس",
      "قاعدة صارمة ومقدسة — شنط (قصر) أسلاك الصاعق (Shuntage):",
      "يجب أن تظل أسلاك الصاعق ملفوفة ومربوطة معاً (مشنطة) بشكل مستمر حتى لحظة التوصيل النهائي بسلك التفجير الرئيسي. لا تترك أي سلك حراً أبداً. السلك الحر يمكن أن يلتقط الشحنات الكهربائية الساكنة أو التيارات الشاردة مما يتسبب في تفجير مفاجئ ومميت.",
      "إدخال خرطوشة التوفيكس المجهزة بالصاعق برفق إلى قاع الثقب تماماً",
      "لا تضغط بقوة مفرطة ولا تستخدم قضيب الحفر المعدني (الفلوري) لدفع الخرطوشة تفادياً لخطر الاحتكاك أو الصدم",
      "يجب أن يخرج سلك الصاعق من فوهة الثقب ويظل مشنطاً (موصول الطرفين)"
    ],
    step8PortanoleTitle: "2. جهاز الشحن الهوائي (Portanole) — تعبئة الأنفور (ANFO)",
    step8PortanoleProc: [
      "التأكد من توصيل الخرطوم المانع للشحنات الساكنة (Tuyau antistatique) بجهاز الشحن (البورتانول)",
      "التحقق من سلامة الخرطوم وموصلية الأرضي — لا توجد قطوع أو اهتراء",
      "إدخال نهاية الخرطوم إلى قاع الثقب المُراد شحنه",
      "تعبئة خليط الأنفور (ANFO) في خزان جهاز الشحن",
      "الضخ والنفخ تدريجياً — مع سحب الخرطوم ببطء من القاع باتجاه الفوهة",
      "التوقف عند الطول المحدد لتوفير مساحة للحشو الفعال:"
    ],
    step8QuantitiesTitle: "الكميات التقريبية المطلوبة لهذا المقاس ({gabarit}) :",
    step9Title: "عملية الإشعال والتفجير هي ثمرة كل هذا العمل الشاق. الخمس عشرة دقيقة السابقة للتفجير هي الأكثر خطورة وحرجاً — أي خطأ أو تهاون في قائمة الفحص هنا قد يضيع مجهود اليوم كاملاً ويشكل خطراً على الأرواح.",
    step9ChecklistTitle: "قائمة التحقق قبل التفجير (Check-list):",
    step9Checklist: [
      "إخلاء جميع معدات وأدوات الحفر والآلات من منطقة التفجير",
      "ترتيب وتأمين خراطيم الهواء المضغوط وسحبها لمسافة آمنة",
      "إعادة عمود التقشير إلى مكانه الآمن خارج منطقة التأثير",
      "سلك التفجير الرئيسي (Ligne de tir): سليم، غير مقطوع، بطول كافٍ وآمن",
      "التحقق الدقيق من توصيل أسلاك كل صاعق بسلك التفجير الرئيسي",
      "الحفاظ على شنط (قصر) الأسلاك حتى لحظة الربط والتوصيل النهائي",
      "استخدم جهاز قياس المقاومة لتأكيد سلامة واتصال الدائرة بالكامل",
      "وضع حواجز وإشارات تحذير واضحة لمنع الدخول إلى منطقة التفجير",
      "تأكيد الإخلاء التام والدقيق لجميع الأشخاص — عامل المنجم ومساعده",
      "الالتزام الصارم بالوقت المحدد والمخطط له مسبقاً للتفجير"
    ],
    step9ProcTitle: "بروتوكول عملية الإطلاق والتفجير:",
    step9Proc: [
      "الابتعاد إلى ملجأ آمن ومصادق عليه (على مسافة 100 متر كحد أدنى من الجبهة)",
      "التأكد للمرة الأخيرة والقطعية من خلو المنطقة تماماً من أي عنصر بشري",
      "توصيل سلك التفجير الرئيسي بجهاز الإشعال (Exploseur) المعتمد من SMI",
      "شحن جهاز الإشعال لتوليد النبضة الكهربائية المناسبة",
      "الضغط على زر التفجير — والتحقق من سماع دوي الانفجارات المتتالية"
    ],
    step9AlertTitle: "⚠️ مرحلة ما بعد التفجير والحوادث الطارئة",
    step9Alerts: [
      "• الانتظار الإلزامي لمدة 30 دقيقة على الأقل (Délai d'attente) قبل التفكير في الدخول",
      "• التحقق من تفعيل التهوية وزوال الغبار، وفحص نسبة الغازات السامة (CO) قبل العودة",
      "• في حال وجود ثقب فاشل (Trou raté / Culot chargé): تطبيق بروتوكول التعامل مع الثقوب الفاشلة — يُمنع منعاً كلياً الاقتراب قبل مرور 30 دقيقة على الأقل، وإبلاغ المشرف الفني فوراً لإتلافه بأمان."
    ],
    legendVide: "ثقوب فارغة لتخفيف الضغط (V)",
    legendBouchon: "ثقوب القطع بالتوفيكس (D0)",
    legendG1: "المجموعة 1 (D1 — 25 مللي ثانية)",
    legendG2: "المجموعة 2 (D2 — 50 مللي ثانية)",
    legendG3: "المجموعة 3 (D3 — 75 مللي ثانية)",
    legendG4: "المجموعة 4 (D4 — 100 مللي ثانية)",
    legendRadier: "الأرضية (Radier)",
    legendParements: "الجوانب (Parements)",
    legendVoute: "السقف (Voûte)",
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
