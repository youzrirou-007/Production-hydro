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
 earSpecsDesc: "Casque anti-bruit obligatoire avant démarrage du perforateur. Niveau sonore forage : 100 dB à 110 dB. Exposition non protégée = perte auditive irréversible.",
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
 parallelismeTitle: "Parallélisme des Trous — L'Ennemi du Rendement",
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
 purgeEquipDesc2: "Le bec de purge de Type 2 (Spécification SMI Imiter) possède un angle de levier optimisé et un tranchant trempé double biseau. Il permet de s'insérer précisément dans les fractures de décollement pour déloger mécaniquement les dalles instables à distance de sécurité.",
 purgeSpecs1: "🔘 Manche acier/alu : légère & rigide",
 purgeSpecs2: "📐 Bec Type 2 : angle levier 35°",
 verdictPerfect: "PARFAIT — 170cm arrachés / 170cm",
 verdictExcellent: "EXCELLENT — ",
 verdictAcceptable: "ACCEPTABLE — ",
 verdictAttention: "ATTENTION — ",
 verdictCritique: "CRITIQUE — ",
 verdictReformer: " — REFORER",
 colonneConfigTitle: "Configuration de la colonne :",
 colonneConfig18: "Fleuret 1.8m (forage 1.7m = 170cm) : bourrage 76cm → colonne ANFO 94cm",
 colonneConfig24: "Fleuret 2.4m (forage 2.3m = 230cm) : bourrage 76cm → colonne ANFO 154cm",
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
 bourrageProc5: "Vérifier que le fil de l'amorce sort proprement — non coincé",
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
 lightboxPurgeDesc: "Détail haute définition de la canne de purge et du bec de Type 2 SMI avec biseau double trempé de 35° engagé dans la fissure.",
 lightboxForageDesc: "Schéma précis du perforateur à poussoir pneumatique Montabert T23 en livrée verte d'origine avec son raccordement de béquille excentré à l'arrière.",
 lightboxSoufflageDesc: "Illustration de la canne de soufflage en cuivre insérée à fond de trou pour l'évacuation cyclonique des poussières de silice.",
 stepHeaders: [
 { num: 1, icon: '📋', title: 'PRISE DE POSTE & CONSIGNES TECHNIQUES', cat: 'تقني' },
 { num: 2, icon: '🌬', title: "VÉRIFICATION DE L'AÉRAGE", cat: 'تقني' },
 { num: 3, icon: '💧', title: 'ARROSAGE DU CHANTIER', cat: 'تقني' },
 { num: 4, icon: '⛏️', title: 'PURGE DU CHANTIER', cat: 'أمن' },
 { num: 5, icon: '🔧', title: 'VÉRIFICATION MATÉRIEL FORAGE', cat: 'تقني' },
 { num: 6, icon: '🔩', title: 'FORAGE — ATTEINDRE 100% DU MÉTRAGE', cat: 'حفر' },
 { num: 7, icon: '🔍', title: 'VÉRIFICATION & NETTOYAGE DES TROUS', cat: 'تقني' },
 { num: 8, icon: '💥', title: 'CHARGEMENT EXPLOSIFS', cat: 'متفجرات' },
 { num: 9, icon: '🔌', title: 'PRÉ-TIR & MISE À FEU', cat: 'تقني' },
 { num: 10, icon: '📝', title: 'SAISIE DU REGISTRE JOURNALIER', cat: 'تقني' }
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
 step1Alert: "Un trou raté non signalé par le poste précédent est un danger mortel. Exiger la confirmation explicite de l'état des trous avant d'entrer dans la galerie.",
 step2Title: "L'aérage est la première vérification technique avant toute entrée en galerie. Une galerie mal ventilée contient du CO (monoxyde de carbone) et des fumées nitreuses post-tir invisibles et mortels.",
 step2ProcTitle: "Procédure de vérification :",
 step2Proc: [
 "Vérifier le débit d'air à l'entrée de la galerie — flux d'air perceptible sur la peau du visage",
 "Contrôler l'état du ventilateur et du tubage souple (manchette) : aucun pli, aucune déchirure, raccords étanches",
 "En présence d'un détecteur CO : mesure < 25 ppm (ISO 4225 : µmol/mol) avant entrée",
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
 "Arroser la VOÛTE sur 15 m minimum depuis le front — les zones humides qui ressortent signalent des fissures ouvertes",
 "Arroser les PAREMENTS (murs latéraux) de haut en bas",
 "Arroser le SOL — lutte contre la poussière de silice",
 "Le chantier est correctement arrosé quand aucun nuage de poussière ne se soulève lors des déplacements"
 ],
 step3AlertSilicose: "La poussière de roche contient de la silice libre. Inhalation chronique = silicose professionnelle irréversible (ISO 14001). L'arrosage protège les poumons pour toute la carrière du mineur.",
 step4Alert: "« La chute de blocs est le premier ennemi dans les mines souterraines »",
 step4Title: "La purge consiste à désolidariser tous les blocs instables de la voûte et des parements sur 15 mètres minimum depuis le front de taille. Elle se fait APRÈS l'arrosage, quand la roche a révélé ses fissures.",
 step4RuleTitle: "Règles absolues :",
 step4Rules: [
 "AUCUNE MACHINE EN FONCTIONNEMENT pendant la purge — L'écoute des vibrations et craquements est essentielle",
 "Se positionner TOUJOURS hors de la zone de chute potentielle — jamais sous un bloc en cours de purge",
 "Frapper méthodiquement la voûte et les parements — SON CREUX = bloc instable à purger immédiatement | SON PLEIN = roche stable, continuer",
 "La purge est terminée quand 100% des zones testées donnent un son plein — pas 99%",
 "Distance de travail : 15 m minimum depuis le front"
 ],
 step4AlertSafety: "Un bloc non purgé peut tomber lors du forage ou du chargement. Un seul bloc suffit. La purge n'est jamais abrégée.",
 step5Title: "Avant de démarrer le perforateur, chaque composant est inspecté. Un flexible qui éclate sous 10 bar est une arme dans la galerie.",
 step5ChecklistTitle: "🔩 Montabert T23 — Checklist",
 step5Checklist: [
 "Taillant bouton 38mm : serré et non usé",
 "Lubrificateur d'air : niveau huile suffisant",
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
 step5SafetyAlert: "Un flexible d'air sous 10 bar qui se décroche ou éclate devient un fouet violent. Chaque raccord doit être sécurisé avant de mettre en pression.",
 step5NoiseTitle: "🎧 Équipement auditif",
 step5NoiseDesc: "Casque anti-bruit obligatoire avant démarrage du perforateur. Niveau sonore forage : 100 dB à 110 dB. Exposition non protégée = perte auditive irréversible.",
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
 "Ne jamais forcer — ne jamais utiliser la tige de forage",
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
 "S'éloigner à distance de sécurité (minimum 100 m depuis le front)",
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
 title: "عامل المنجم المثالي (Le Mineur Parfait)",
 subtitle: "الشركة المعدنية لإيميتر (SMI) — الإجراءات التشغيلية للحفر والتفجير عالي الأداء",
 targetYield: "الإنتاجية المستهدفة (Rendement cible)",
 excellence: "🎯 التميز 100%",
 fromBouchon: "من منطقة القطع (Bouchon) إلى دفتر السجل اليومي (Rapport journalier)",
 step: "خطوة (Étape)",
 progression: "نسبة الإنجاز (Progression) :",
 btnEnLarge: "تكبير الصورة",
 btnEnLargePurge: "تكبير الصورة",
 btnEnLargeForage: "تكبير الصورة",
 btnEnLargeSoufflage: "تكبير الصورة",
 pressureSpecs: "⚠️ الضغوط المقررة: الهواء 7-9 بار (Bar) | الماء 4-6 بار (Bar)",
 earSpecsTitle: "🎧 معدات حماية السمع (Protection auditive)",
 earSpecsDesc: "واقيات الأذن أو السماعات المضادة للضوضاء (Casque antibruit) إلزامية قبل بدء تشغيل آلة الحفر (Perforatrice). مستوى ضجيج الحفر: 100 ديسيبل إلى 110 ديسيبل (dB). التعرض بدون حماية يؤدي إلى فقدان السمع بشكل دائم وغير قابل للاسترداد.",
 gallerySection: "مقطع النفق (Section de la galerie) — مخطط التفجير (Plan de tir):",
 smiGabarit: "🔷 12 م² — معيار (Gabarit) SMI",
 intlGabarit: "🌍 12 م² — معيار دولي (Gabarit International)",
 gabarit9m2: "🔹 9 م² — أعمال التخطيط (Gabarit 9m² - Traçage)",
 foreMustArrache: "المسافة المحفورة (Longueur forée) ← يجب إزالتها بالتفجير (Longueur arrachée)",
 bourrageParfait: "حشو (Bourrage) مثالي ومحكم",
 divergenceIdeale: "الانحراف المثالي (Déviation idéale - Zéro)",
 trousRespectes: "الثقوب الملتزم بها (Trous respectés)",
 planTirInteractive: "مخطط تفجير تفاعلي (Plan de tir interactif)",
 planTirInstruction: "مرر مؤشر الماوس فوق أي مجموعة توقيت لتحديد الثقوب المعنية ورؤية التسلسل الزمني للتفجير.",
 gabarit12m2Label: "معيار (Gabarit) SMI 12م²: 38 ثقباً | القطع (Bouchon): 3 ثقوب فارغة (Trous vides) + 6 ثقوب معبأة بالتوفيكس (Tovex) | 6 مجموعات (Groupes) | D0 ← D5",
 gabaritIntlLabel: "المعيار الدولي (Gabarit International) 12م²: 38 ثقباً | القطع (Bouchon): 6 ثقوب فارغة (Trous vides) + 3 ثقوب معبأة بالتوفيكس (Tovex) | 6 مجموعات (Groupes) | D0 ← D5",
 gabarit9m2Label: "مقطع (Gabarit) 9م²: 28 ثقباً | القطع (Bouchon): 1 ثقب فارغ (Trou vide) + 4 ثقوب معبأة بالتوفيكس (Tovex) | 5 مجموعات (Groupes) | D0 ← D4",
 ordreForageTitle: "ترتيب الحفر (Ordre de forage) — ممنوع تجاوزه نهائياً",
 orderStepA: "الخطوة أ ← ثقوب القطع (Bouchon) أولاً",
 orderStepADesc: "تخلق ثقوب القطع (Bouchon) أول جبهة حرة (Surface libre) للحركة. وبدون هذه الجبهة، تتبدد الطاقة الانفجارية في جميع الاتجاهات دون تحريك الصخور. ثقوب القطع (Bouchon) هي أساس التفجير (Tir) بأكمله.",
 orderStepB: "الخطوة ب ← من الداخل إلى الخارج (De l'intérieur vers l'extérieur)",
 orderStepBDesc9m2: "G1 ← G2 ← G3. تنفجر كل مجموعة (Groupe) في اتجاه الفراغ الذي أوجدته المجموعة السابقة. لا تتجاوز أي مجموعة أبداً — فالفراغ لم يتكون بعد.",
 orderStepBDesc12m2: "G1 ← G2 ← G3 ← G4. تنفجر كل مجموعة (Groupe) في اتجاه الفراغ الذي أوجدته المجموعة السابقة. لا تتجاوز أي مجموعة أبداً — فالفراغ لم يتكون بعد.",
 orderStepC: "الخطوة ج ← ثقوب المحيط (Contour) أخيراً",
 orderStepCDesc: "الأرضية (Radier) ← الجوانب (Parements) ← السقف (Voûte). يحدد المحيط (Contour) الشكل النهائي للنفق. يتم حفر ثقوب المحيط (Trous de contour) في النهاية لتجنب إضعاف بنية النفق أثناء حفر الثقوب المركزية.",
 orderRule: "حفر ثقب واحد بترتيب خاطئ = انخفاض الكفاءة والإنتاجية (Rendement). الترتيب ليس مجرد اقتراح، بل هو قاعدة فيزيائية حتمية.",
 parallelismeTitle: "توازي الثقوب (Parallélisme) — الركيزة الأساسية للإنتاجية",
 parallelismeDesc: "يجب أن تكون جميع الثقوب متوازية تماماً (Parallèles) مع بعضها البعض وعمودية على وجه العمل (Front de taille). أي ثقب منحرف (Trou dévié) يخلف قعراً متبقياً (Culot) يتراكم من تفجير لآخر معيقاً تقدم العمل.",
 simulatorDeviation: "محاكي انحراف التفجير (Simulateur de déviation):",
 angleDivergence: "زاوية الانحراف (Angle de divergence):",
 volumeArrache: "حجم الصخور المزاحة (Volume arraché)",
 rendementVolee: "كفاءة التفجير (Rendement de la volée)",
 culotResiduel: "القعر المتبقي (Culot)",
 angle: "الزاوية (Angle)",
 culot: "القعر المتبقي (Culot)",
 arrache: "المزاح (Arraché)",
 rendement: "الكفاءة (Rendement)",
 purgeEquip: "معدات معتمدة من SMI",
 purgeEquipTitle: "عمود التطهير (Canne de purge) ورأس التطهير من النوع 2 (Tête de purge Type 2)",
 purgeEquipDesc1: "عمود التطهير (Canne de purge) هو قضيب متين مصنع من الصلب الخاص أو سبائك الألومنيوم الخفيفة وعالية المقاومة، مصمم خصيصاً لعمليات التطهير اليدوية للصخور في المناجم.",
 purgeEquipDesc2: "يتميز رأس التطهير من النوع 2 (Tête de purge Type 2) (المعتمد لدى منجم إيميتر SMI) بزاوية رافعة مثالية وحافة صلبة مزدوجة الشطب. يتيح ذلك إدخاله بدقة في شقوق الانفصال لإزالة القشور الصخرية غير المستقرة ميكانيكياً من مسافة آمنة.",
 purgeSpecs1: "🔘 مقبض صلب/ألومنيوم (Manche acier/alu): خفيف وصلب",
 purgeSpecs2: "📐 رأس من النوع 2 (Tête Type 2): زاوية رافعة 35 درجة",
 verdictPerfect: "ممتاز ومثالي — 170 سم تمت إزاحتها / 170 سم",
 verdictExcellent: "ممتاز جداً — ",
 verdictAcceptable: "مقبول — ",
 verdictAttention: "انتبه واحذر — ",
 verdictCritique: "وضع حرج — ",
 verdictReformer: " — يجب إعادة الحفر",
 colonneConfigTitle: "مواصفات العمود المتفجر (Colonne de charge):",
 colonneConfig18: "قضيب (Fleuret) 1.8 م (الحفر 1.7 م = 170 سم): الحشو (Bourrage) 76 سم ← عمود الأنفور (Anfo) 94 سم",
 colonneConfig24: "قضيب (Fleuret) 2.4 م (الحفر 2.3 م = 230 سم): الحشو (Bourrage) 76 سم ← عمود الأنفور (Anfo) 154 سم",
 quantitiesTitle: "الكميات التقديرية المطلوبة لهذا المقطع (Gabarit)",
 qAnfoTotal: "إجمالي الأنفور (ANFO total)",
 qTovex100g: "توفيكس 100 غرام (TOVEX 100g)",
 qAmorces: "المفجرات (Détonateurs)",
 qToCharge: "ثقوب للشحن (Trous à charger)",
 lBourrageTitle: "3. حشو الثقوب (Bourrage des trous) — سر تحقيق الكفاءة الكاملة",
 lBourrageDesc: "الحشو (Bourrage) غير الكافي = انفلات الغازات المتفجرة نحو الخارج = ضياع 50% إلى 80% من الطاقة الانفجارية = بقاء قعر الثقب غير منفجر (Culot) = فشل التقدم المطلوب. الحشو الجيد هو الفارق بين تحقيق كفاءة 70% و100% من حجم التفجير.",
 lBourrageFormula: "طول الحشو (Longueur de bourrage) = 20 × قطر لقمة الحفر (Diamètre du taillant)",
 lBourrageMinimum: "20 × 38 مم = 760 مم = 76 سم كحد أدنى (Minimum)",
 bourrageProcTitle: "خطوات حشو الثقوب (Procédure de bourrage):",
 bourrageProc1: "المادة المستخدمة: الطين (Argile) هو الخيار الأفضل",
 bourrageProc1a: "← في الحالات الطارئة: الفتات الصخري الزاوي (بكفاءة 70%)",
 bourrageProc1b: "← ممنوع تماماً: الحصى المستدير، الصخور الملساء، الركام الخشن",
 bourrageProc2: "إدخال الطين (Argile) على طبقات متتالية بسماكة 15-20 سم",
 bourrageProc3: "دك وضغط كل طبقة: 6 إلى 8 ضربات بالقضيب (Bourroir) كحد أدنى",
 bourrageProc4: "التعبئة حتى تترك مسافة 70-80 سم من فوهة الثقب",
 bourrageProc5: "التأكد من خروج سلك المفجر (Fil de détonateur) بشكل سليم ودون أي التواء أو احتباس",
 step10Desc: "تسجيل البيانات في السجل اليومي (Rapport journalier) هو آخر خطوة فنية يقوم بها عامل المنجم. تغذي هذه البيانات منصة هيدرومينز للإنتاج (HydroMines Production) مباشرة، لذا يجب أن تكون دقيقة وكاملة.",
 step10Grid1Title: "📊 إجمالي الثقوب المحفورة (Trous forés)",
 step10Grid1Desc9m2: "28 ثقباً — مطابقة للمخطط",
 step10Grid1Desc12m2: "38 ثقباً — مطابقة للمخطط",
 step10Grid2Title: "🔩 توزيع شحنة البداية (Charge du bouchon)",
 step10Grid2Desc12m2: "3 ثقوب فارغة + 6 معبأة بالتوفيكس",
 step10Grid2DescIntl: "6 ثقوب فارغة + 3 معبأة بالتوفيكس",
 step10Grid2Desc9m2: "1 ثقب فارغ + 4 معبأة بالتوفيكس",
 step10Grid3Title: "📏 نوع القضيب المستخدم (Type de fleuret)",
 step10Grid3Desc: "قضيب (Fleuret) 1.8 م (الحفر 1.7 م) أو قضيب (Fleuret) 2.4 م (الحفر 2.3 م)",
 step10Grid4Title: "💥 المتفجرات المستهلكة (Explosifs consommés)",
 step10Grid4Desc: "الأنفور (ANFO): X كجم | التوفيكس (TOVEX): X خرطوشة | المفجرات (Détonateurs): X",
 step10Grid5Title: "📐 إجمالي أمتار الحفر المصرح عنها (Mètres forés déclarés)",
 step10Grid5Desc: "= طول القضيب × 1 (لكل ثقب) — باستثناء الثقوب الفارغة",
 step10Grid6Title: "⏰ الوقت الفعلي للتفجير (Heure de tir réelle)",
 step10Grid6Desc: "الوقت الدقيق للتفجير — يجب تدوينه بدقة متناهية",
 step10Alert: "أي خطأ في السجل اليومي (Rapport journalier) يؤثر سلباً على تتبع حركة المتفجرات ويهدد سلامة الوردية القادمة (Poste suivant). دقة السجل تعكس مدى انضباط واحترافية عامل المنجم.",
 lightboxPurgeTitle: "توضيح: عمود التطهير (Canne de purge) ورأس التطهير من النوع 2 (Tête de purge Type 2) (صورة مكبرة)",
 lightboxForageTitle: "توضيح: آلة الحفر مونتابير (Montabert T23) والمسند التلسكوبي (Béquille) (صورة مكبرة)",
 lightboxSoufflageTitle: "توضيح: فحص وتنظيف الثقوب بالنفخ (Soufflage des trous) (صورة مكبرة)",
 lightboxPurgeDesc: "تفاصيل عالية الدقة لعمود التطهير (Canne de purge) ورأس التطهير المعتمد من SMI مع شطب مزدوج مقسى بزاوية 35 درجة موضوع في الشق الصخري.",
 lightboxForageDesc: "رسم تخطيطي دقيق لآلة الحفر بالدفع الهوائي مونتابير (Montabert T23) بلونها الأخضر الأصلي مع وصلة الدعامة التلسكوبية (Béquille) اللامركزية في الخلف.",
 lightboxSoufflageDesc: "توضيح لأنبوب النفخ النحاسي (Tube de soufflage) المدخل إلى قاع الثقب لتفريغ وإخراج غبار السيليكا (Silice) بشكل حلزوني.",
 stepHeaders: [
 { num: 1, icon: '📋', title: 'استلام الوردية والتوجيهات الفنية (Consignes de poste)', cat: 'تقني' },
 { num: 2, icon: '🌬', title: 'التحقق من التجديد الهوائي (Vérification de l\'aérage)', cat: 'تقني' },
 { num: 3, icon: '💧', title: 'رش ورشة العمل بالماء (Arrosage du chantier)', cat: 'تقني' },
 { num: 4, icon: '⛏️', title: 'تطهير السقف والجوانب (Purge)', cat: 'أمن' },
 { num: 5, icon: '🔧', title: 'فحص معدات الحفر (Contrôle de la perforatrice)', cat: 'تقني' },
 { num: 6, icon: '🔩', title: 'الحفر (Forage) — تحقيق 100% من العمق', cat: 'حفر' },
 { num: 7, icon: '🔍', title: 'فحص وتنظيف الثقوب (Soufflage et contrôle)', cat: 'تقني' },
 { num: 8, icon: '💥', title: 'تعبئة وشحن المتفجرات (Chargement des explosifs)', cat: 'متفجرات' },
 { num: 9, icon: '🔌', title: 'التحضير للتفجير والإشعال (Raccordement et tir)', cat: 'تقني' },
 { num: 10, icon: '📝', title: 'تسجيل البيانات في السجل اليومي (Rapport journalier)', cat: 'تقني' }
 ],
 step1Title: "إن ما تتلقاه من الوردية السابقة يحدد مدى كفاءتك وسلامتك طوال اليوم.",
 step1Grid: [
 { title: "📍 تقدم العمل في الورشة (Avancement du chantier)", text: "الأمتار المنجزة في الوردية السابقة. الموقع الحالي لجبهة العمل (Front de taille)." },
 { title: "💥 حالة التفجير الأخير (Dernier tir)", text: "ثقوب فاشلة؟ ثقوب لم تنفجر؟ بقايا الثقوب (Culots) المسجلة؟" },
 { title: "🌬️ حالة التهوية (Aérage)", text: "هل النفق مهوى؟ منذ متى؟ نسبة غاز أحادي أكسيد الكربون (CO) المتبقي؟" },
 { title: "🔧 المعدات المتاحة (Équipement)", text: "هل آلة الحفر (Perforatrice) جاهزة؟ هل الخراطيم (Flexibles) بحالة جيدة؟ المستهلكات (Consommables)؟" },
 { title: "📦 مخزون المتفجرات (Stock d'explosifs)", text: "هل الأنفور (ANFO)، والتوفيكس (TOVEX)، والمفجرات (Détonateurs) متوفرة بكميات كافية؟" },
 { title: "⚠️ العيوب والمشاكل المبلّغ عنها (Anomalies signalées)", text: "المناطق غير المستقرة (Zones instables)، تسرب المياه (Venues d'eau)، حوادث الوردية السابقة." }
 ],
 step1Alert: "الثقب المتخلف (Trou raté) غير المبلّغ عنه من الوردية السابقة يمثل خطراً قاتلاً. يجب المطالبة بتأكيد صريح لحالة الثقوب قبل دخول النفق.",
 step2Title: "التجديد الهوائي (Aérage) هو أول فحص فني قبل أي دخول إلى النفق. النفق الذي يفتقر للتهوية الجيدة يحتوي على أحادي أكسيد الكربون (CO) وأبخرة التفجير السامة (Gaz nitreux) غير المرئية والمميتة بعد التفجير.",
 step2ProcTitle: "خطوات التحقق (Procédure de contrôle):",
 step2Proc: [
 "التحقق من تدفق الهواء عند مدخل النفق — يجب الشعور بتدفق الهواء (Courant d'air) على بشرة الوجه",
 "فحص حالة المروحة (Ventilateur) والأنبوب المرن (Canalisation flexible - Manche d'aérage): لا توجد التواءات أو تمزقات، والتوصيلات محكمة",
 "في حالة وجود كاشف الغاز (Détecteur de gaz): يجب أن تكون القراءة أقل من 25 جزء في المليون (ppm) (ISO 4225: µmol/mol) قبل الدخول",
 "الحد الأدنى للانتظار بعد التفجير: 30 دقيقة من التهوية المستمرة (Aérage continu) قبل أي دخول للورشة (Chantier)",
 "التأكد من وصول الهواء إلى وجه العمل (Front de taille) — وليس فقط عند مدخل النفق"
 ],
 step2Alert: "التجديد الهوائي (Aérage) ليس اختيارياً. إذا كانت التهوية غير كافية — قف (STOP) — يمنع العمل تماماً حتى تتم استعادة التدفق المطابق للمواصفات.",
 step3Title: "الرش بالماء (Arrosage) يسبق دائماً عملية التطهير (Purge). فالماء يرطب الصخور ويكشف عن الشقوق (Fissures)، ومناطق الانفصال (Plans de rupture)، والكتل غير المستقرة التي لا يمكن رؤيتها بالعين المجردة عندما تكون جافة. الورشة غير المرشوشة تخفي مخاطرها.",
 step3Alert: "يكشف الماء ما لا تراه العين على الصخور الجافة. الرش بالماء (Arrosage) = التحضير للتطهير (Purge) فعال وآمن.",
 step3ProcTitle: "خطوات الرش بالماء (Procédure d'arrosage):",
 step3Proc: [
 "توصيل خرطوم المياه (Tuyau d'eau) بأنبوب الورشة الرئيسي",
 "رش وجه العمل (Front de taille) أولاً: المناطق المتشققة، ومستويات الطبقات، والعيوب الظاهرة",
 "رش السقف (Voûte / Toit) على مسافة 15 متراً على الأقل من الجبهة — تبرز المناطق الرطبة لتشير إلى الشقوق المفتوحة",
 "رش الجوانب (Parements) من الأعلى إلى الأسفل",
 "رش الأرضية (Radier) — للحد من غبار السيليكا (Silice) الضار",
 "تكون الورشة (Chantier) مرشوشة بشكل صحيح عندما لا يتصاعد أي غبار أثناء الحركة والتنقل"
 ],
 step3AlertSilicose: "يحتوي غبار الصخور على السيليكا الحرة (Silice libre). استنشاقها المستمر يؤدي إلى مرض السحار الرئوي (Silicose) المهني غير القابل للعلاج. الرش بالماء (Arrosage) يحمي رئتيك طوال حياتك المهنية.",
 step4Alert: "« سقوط الكتل الصخرية (Éboulements) هو العدو الأول في المناجم الجوفية »",
 step4Title: "تتمثل عملية التطهير (Purge) في إزالة جميع الكتل الصخرية غير المستقرة من السقف (Voûte) والجوانب (Parements) على مسافة لا تقل عن 15 متراً من وجه العمل (Front de taille). وتتم هذه العملية بعد رش الماء (Arrosage)، بعد أن كشفت الصخور عن شقوقها.",
 step4RuleTitle: "قواعد صارمة لا غنى عنها (Règles de purge):",
 step4Rules: [
 "يجب إيقاف جميع الآلات تماماً أثناء التطهير (Purge) — الاستماع لصوت الاهتزازات والتصدعات (Bruits de la roche) أمر بالغ الأهمية لسلامتك",
 "قف دائماً خارج منطقة السقوط المحتملة (Zone d'éboulement) — لا تقف أبداً تحت كتلة صخرية تقوم بتطهيرها",
 "اطرق السقف (Voûte) والجوانب (Parements) بشكل منهجي — الصوت الأجوف (Son sourd) = كتلة غير مستقرة يجب إزالتها فوراً | الصوت الصافي أو المعدني (Son clair) = صخرة مستقرة، واصل العمل",
 "ينتهي التطهير (Purge) عندما تعطي جميع المناطق المختبرة بنسبة 100% صوتاً صافياً — وليس 99%",
 "مسافة العمل الآمنة: 15 متراً كحد أدنى من الجبهة (Front)"
 ],
 step4AlertSafety: "الكتلة الصخرية التي لم تتم إزالتها قد تسقط أثناء الحفر (Forage) أو التعبئة (Chargement). كتلة واحدة تكفي لإحداث كارثة. لا تستهن أبداً بعملية التطهير (Purge) ولا تختصرها.",
 step5Title: "قبل تشغيل آلة الحفر (Perforatrice)، يتم فحص كل جزء بدقة. إن انفجار خرطوم (Flexible) تحت ضغط 10 bar (Bar) يتحول إلى سوطٍ قاتلٍ داخل النفق.",
 step5ChecklistTitle: "🔩 قائمة فحص آلة الحفر مونتابير (Montabert T23)",
 step5Checklist: [
 "لقمة الحفر ذات الأزرار (Taillant à boutons) 38 مم: مثبتة بإحكام وغير متآكلة",
 "مزيتة الهواء (Graisseur de ligne): مستوى الزيت كافٍ",
 "وصلة مياه الحفر (Injection d'eau): التوصيل محكم ولا يوجد تسريب",
 "مسمار تثبيت قضيب التوجيه (Guide-fleuret): مربوط بإحكام",
 "كاتم الصوت (Silencieux) وواقي اللقمة: في مكانهما الصحيح"
 ],
 step5FlexTitle: "🌬️ الخراطيم (Flexibles) — منع الانفجار",
 step5Flex: [
 "خلو تام من القطوع، والانتفاخات، أو التآكل (Usure)",
 "وصلة الهواء المضغوط محمية بواسطة: \n← مرابط أمان أو كابلات مانعة للالتواء المفاجئ (Câbles anti-fouet)",
 "المثبتات والمرابط (Colliers et raccords) مشدودة جيداً من الطرفين",
 "خرطوم مياه الحفر (Flexible d'eau) (2 بوصة): تم التحقق من حالته"
 ],
 step5SafetyAlert: "إن خرطوم الهواء (Flexible d'air) الخاضع لضغط 10 bar (Bar) إذا انفصل أو انفجر يتحول إلى سوط عنيف ومميت. يجب تأمين كل وصلة تماماً قبل تشغيل الضغط.",
 step5NoiseTitle: "🎧 معدات حماية السمع (Protection auditive)",
 step5NoiseDesc: "واقي الأذن أو خوذة الحماية من الضوضاء (Casque antibruit) إلزامي قبل بدء تشغيل آلة الحفر (Perforatrice). مستوى ضجيج الحفر: 100 ديسيبل إلى 110 ديسيبل (dB). التعرض بدون حماية يؤدي إلى فقدان السمع بشكل دائم.",
 step7Title: "قبل تعبئة المتفجرات (Explosifs)، يتم تنظيف كل ثقب بالنفخ (Soufflage) وفحصه بدقة. أي ثقب مسدود أو غير عميق بما يكفي = احتباس خرطوشة التوفيكس (TOVEX) = فشل التفجير (Raté de tir).",
 step7ChecklistTitle: "قائمة التحقق الفني (Contrôle technique):",
 step7Checklist: [
 "نفخ كل ثقب بالهواء المضغوط (Soufflage des trous) (من القاع إلى الخارج)",
 "التحقق من العمق باستخدام قضيب القياس المخصص (Tige de mesure) \n← ثقب قصير جداً: تسجيل رقمه لتعديله وإعادة حفره \n← العمق مطابق: وضع علامة مميزة بالطبشور",
 "الفحص الدقيق للرطوبة ووجود المياه: \n← ثقب جاف: يمكن تعبئته بخليط الأنفور (ANFO) عالي الأداء \n← ثقب رطب/يحتوي على ماء: التوفيكس (TOVEX) فقط (لأن الأنفور (ANFO) يذوب بالماء)",
 "الفحص البصري لثقوب القطع (Alignement du bouchon)"
 ],
 step7Advice: "💡 نصيحة: عملية النفخ (Soufflage) القوية تحرر غبار السيليكا (Silice) المتبقي. ارتدِ قناع التنفس المزود بخرطوشة واقية (Masque antipoussière) إلزامياً أثناء هذه العملية!",
 step7VisualTitle: "ثقب نظيف ومنفوخ بالكامل (Trou soufflé et propre)",
 step7Alert: "تعبئة ثقب مبلل بخليط الأنفور (ANFO) = فشل تفجير محتم (Raté de tir). يتميز التوفيكس (TOVEX) بمقاومته الفائقة للمياه ويضمن الانفجار حتى في الثقوب المغمورة. يجب اختيار نوع المتفجر حسب حالة كل ثقب.",
 step8Title: "تتم عملية الشحن والتعبئة (Chargement des explosifs) قبل 30 إلى 60 دقيقة من موعد التفجير. الترتيب إلزامي وصارم: التوفيكس (TOVEX) أولاً، ثم الأنفور (ANFO)، يليهما الحشو (Bourrage) في النهاية.",
 step8TovexTitle: "1. التوفيكس (TOVEX) مع المفجر (Détonateur) — أساس الشحنة",
 step8TovexProc: [
 "أخذ خرطوشة التوفيكس (Cartouche de TOVEX) (100 غرام)",
 "إدخال كبسولة المفجر الكهربائي (Détonateur électrique) داخل خرطوشة التوفيكس (TOVEX)",
 "قاعدة صارمة ومقدسة — قصر الدائرة الكهربائية للأسلاك (Court-circuitage ou Shuntage):",
 "يجب لف أسلاك المفجر وربطها معاً (Shuntage) حتى لحظة التوصيل النهائي بسلك التفجير الرئيسي (Ligne de tir). لا تترك أي سلك حراً أبداً. السلك الحر يمكن أن يلتقط الشحنات الساكنة (Charges statiques) أو التيارات الشاردة (Courants vagabonds) مما يتسبب في تفجير مفاجئ ومميت.",
 "إدخال خرطوشة التوفيكس (TOVEX) المجهزة بالمفجر (Amorcée) إلى قاع الثقب تماماً",
 "لا تضغط بقوة أبداً ولا تستخدم قضيب الحفر (Fleuret) لدفعها",
 "يجب أن يخرج سلك المفجر من الثقب ويظل مغلقاً أو مشنطاً (Shunté)"
 ],
 step8PortanoleTitle: "2. جهاز الشحن الهوائي (Portanole) — تعبئة الأنفور (ANFO)",
 step8PortanoleProc: [
 "التأكد من توصيل الخرطوم المانع للشحنات الساكنة (Tuyau antistatique) بجهاز الشحن (Portanole)",
 "التحقق من سلامة الخرطوم — لا توجد قطوع أو تشققات",
 "إدخال نهاية الخرطوم إلى قاع الثقب",
 "تعبئة خليط الأنفور (ANFO) (الحبيبات - Prills) في خزان جهاز الشحن (Portanole)",
 "الضخ والنفخ تدريجياً — من القاع باتجاه فوهة الثقب",
 "التوقف عند الطول المحدد للعمود المتفجر (Colonne de charge):"
 ],
 step8QuantitiesTitle: "الكميات التقديرية المطلوبة لهذا المقطع ({gabarit}) :",
 step9Title: "عملية الإشعال والتفجير (Tir) هي نتيجة كل هذا العمل. الخمس عشرة دقيقة السابقة للتفجير هي الأكثر خطورة وحرجاً — أي خطأ في قائمة الفحص (Check-list) هنا قد يضيع مجهود اليوم كاملاً.",
 step9ChecklistTitle: "قائمة التحقق قبل التفجير (Check-list avant tir):",
 step9Checklist: [
 "إخلاء جميع معدات وأدوات الحفر من منطقة التفجير",
 "ترتيب وتأمين خراطيم الهواء المضغوط وسحبها",
 "إعادة عمود التطهير (Canne de purge) إلى مكانه الآمن خارج منطقة التفجير",
 "سلك التفجير الرئيسي (Ligne de tir): سليم وغير مقطوع أو منحشر، وبطول كافٍ وآمن",
 "التحقق من توصيل كل مفجر بسلك التفجير الرئيسي (Ligne de tir) بدقة",
 "الحفاظ على قصر الدائرة أو الشنط (Shuntage) للأسلاك حتى لحظة التوصيل النهائي",
 "جهاز القياس أو الأوميتر (Ohmmètre / Galvanomètre): تأكيد سلامة وتوصيل الدائرة كاملة",
 "وضع إشارات التحذير والحواجز لتأمين منطقة التفجير",
 "تأكيد الإخلاء التام والدقيق لجميع الأشخاص — عامل المنجم ومساعده",
 "الالتزام بالوقت المحدد والمخطط له للتفجير"
 ],
 step9ProcTitle: "خطوات عملية الإشعال والتفجير (Procédure de tir):",
 step9Proc: [
 "الابتعاد إلى مسافة أمان كافية (100 متر على الأقل من جبهة العمل)",
 "التأكد للمرة الأخيرة من خلو المنطقة تماماً من أي شخص",
 "توصيل سلك التفجير (Ligne de tir) بجهاز الإشعال (Exploseur) المعتمد والمصادق عليه من SMI",
 "شحن جهاز الإشعال (Exploseur) لتوليد النبضة الكهربائية",
 "الضغط على زر التفجير (Bouton de tir) — والتحقق من إشارة نجاح الإشعال"
 ],
 step9AlertTitle: "⚠️ مرحلة ما بعد التفجير والتعامل مع الطوارئ (Après-tir et incidents):",
 step9Alerts: [
 "• الانتظار لمدة 30 دقيقة على الأقل كحد أدنى (Attente après tir) قبل دخول أي شخص",
 "• التحقق من عمل التهوية ونسبة غاز أحادي أكسيد الكربون (CO) قبل العودة",
 "• في حالة وجود ثقب فاشل التفجير (Raté de tir): تطبيق بروتوكول الثقوب الفاشلة — يمنع الاقتراب تماماً قبل مرور 30 دقيقة على الأقل، وإبلاغ المسؤول الفني فوراً."
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
