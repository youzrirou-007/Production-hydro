export const SMI_SEED: any = {
  name: "CHANTIER MINIER (X)",
  minerai: "Argent",
  type: "souterrain",
  roche: { coefficient: "6-8", description: "Moyenne — ni trop dure ni trop fragile" },
  taillant: { diametre: 38, type: "bouton" },
  secteurs: ["Imiter 1", "Imiter 2", "Imiter Est"],
  galleryTypes: ["9", "12"],
  postes: 3,
  createdAt: new Date().toISOString()
};

export const SEED_EMPLOYEES = [
  // Chefs de poste (CHEF)
  { matricule: 'M001', nom: 'EL IDRISSI', prenom: 'Ahmed', fonction: 'CHEF', status: 'actif', sector: 'Imiter 1', currentPost: 'Poste 1', rotationGroup: 'default' },
  { matricule: 'M007', nom: 'CHARAF', prenom: 'Ali', fonction: 'CHEF', status: 'actif', sector: 'Imiter 2', currentPost: 'Poste 1', rotationGroup: 'default' },
  { matricule: 'M025', nom: 'BENNANI', prenom: 'Tarik', fonction: 'CHEF', status: 'actif', sector: 'Imiter Est', currentPost: 'Poste 2', rotationGroup: 'default' },
  { matricule: 'M026', nom: 'OUTALHA', prenom: 'Brahim', fonction: 'CHEF', status: 'actif', sector: 'Imiter Est Bure', currentPost: 'Poste 3', rotationGroup: 'default' },

  // Boutefeus (BOUTEFEU)
  { matricule: 'BF01', nom: 'MEHTI', prenom: 'Mustapha', fonction: 'BOUTEFEU', status: 'actif', sector: 'Non assigné', currentPost: 'Poste 1', rotationGroup: 'default' },
  { matricule: 'BF02', nom: 'KARRAUY', prenom: 'Brahim', fonction: 'BOUTEFEU', status: 'actif', sector: 'Non assigné', currentPost: 'Poste 1', rotationGroup: 'default' },
  { matricule: 'BF03', nom: 'SILKANE', prenom: 'Hamid', fonction: 'BOUTEFEU', status: 'actif', sector: 'Non assigné', currentPost: 'Poste 2', rotationGroup: 'default' },

  // Mineurs (MINEUR)
  { matricule: 'M002', nom: 'AIT OUFKIR', prenom: 'Mustapha', fonction: 'MINEUR', status: 'actif', sector: 'Imiter 1', currentPost: 'Poste 1', rotationGroup: 'default' },
  { matricule: 'M003', nom: 'HADDAD', prenom: 'Youssef', fonction: 'MINEUR', status: 'actif', sector: 'Imiter 2', currentPost: 'Poste 1', rotationGroup: 'default' },
  { matricule: 'M008', nom: 'AMRAOUI', prenom: 'Hassan', fonction: 'MINEUR', status: 'actif', sector: 'Imiter Est', currentPost: 'Poste 2', rotationGroup: 'default' },
  { matricule: 'M009', nom: 'EL HASSANI', prenom: 'Said', fonction: 'MINEUR', status: 'actif', sector: 'Imiter Est Bure', currentPost: 'Poste 3', rotationGroup: 'default' },
  { matricule: 'M027', nom: 'TAZI', prenom: 'Abdellah', fonction: 'MINEUR', status: 'actif', sector: 'Imiter 1', currentPost: 'Poste 1', rotationGroup: 'default' },
  { matricule: 'M028', nom: 'BAKIRI', prenom: 'Youssef', fonction: 'MINEUR', status: 'actif', sector: 'Imiter 2', currentPost: 'Poste 2', rotationGroup: 'default' },
  { matricule: 'M029', nom: 'MOSTAFAWI', prenom: 'Khalid', fonction: 'MINEUR', status: 'actif', sector: 'Imiter Est', currentPost: 'Poste 3', rotationGroup: 'default' },

  // Aides Mineurs (AIDE_MINEUR)
  { matricule: 'M010', nom: 'AIT HAMMOU', prenom: 'Mohamed', fonction: 'AIDE_MINEUR', status: 'actif', sector: 'Imiter 1', currentPost: 'Poste 1', rotationGroup: 'default' },
  { matricule: 'M011', nom: 'BELKACEM', prenom: 'Yassine', fonction: 'AIDE_MINEUR', status: 'actif', sector: 'Imiter 2', currentPost: 'Poste 2', rotationGroup: 'default' },
  { matricule: 'M012', nom: 'OUBELLA', prenom: 'Brahim', fonction: 'AIDE_MINEUR', status: 'actif', sector: 'Imiter Est', currentPost: 'Poste 3', rotationGroup: 'default' },
  { matricule: 'M030', nom: 'CHAKIRI', prenom: 'Lahcen', fonction: 'AIDE_MINEUR', status: 'actif', sector: 'Imiter Est Bure', currentPost: 'Poste 1', rotationGroup: 'default' },
  { matricule: 'M031', nom: 'SEKKAT', prenom: 'Omar', fonction: 'AIDE_MINEUR', status: 'actif', sector: 'Imiter 1', currentPost: 'Poste 2', rotationGroup: 'default' },
  { matricule: 'M032', nom: 'JABRI', prenom: 'Nabil', fonction: 'AIDE_MINEUR', status: 'actif', sector: 'Imiter 2', currentPost: 'Poste 3', rotationGroup: 'default' },

  // Conducteurs d'engins (CONDUCTEUR_ENGIN)
  { matricule: 'M004', nom: 'AMRANI', prenom: 'Rachid', fonction: 'CONDUCTEUR_ENGIN', status: 'actif', sector: 'Imiter 1', currentPost: 'Poste 1', rotationGroup: 'default' },
  { matricule: 'M013', nom: 'BENALI', prenom: 'Khalid', fonction: 'CONDUCTEUR_ENGIN', status: 'actif', sector: 'Imiter 2', currentPost: 'Poste 2', rotationGroup: 'default' },
  { matricule: 'M014', nom: 'MOURID', prenom: 'Abdelilah', fonction: 'CONDUCTEUR_ENGIN', status: 'actif', sector: 'Imiter Est', currentPost: 'Poste 3', rotationGroup: 'default' },
  { matricule: 'M033', nom: 'ALAMI', prenom: 'Hicham', fonction: 'CONDUCTEUR_ENGIN', status: 'actif', sector: 'Imiter Est Bure', currentPost: 'Poste 1', rotationGroup: 'default' },
  { matricule: 'M034', nom: 'KABBOUR', prenom: 'Reda', fonction: 'CONDUCTEUR_ENGIN', status: 'actif', sector: 'Imiter 1', currentPost: 'Poste 2', rotationGroup: 'default' },

  // Treuillistes (TREUILLISTE)
  { matricule: 'M015', nom: 'FAROOQ', prenom: 'Omar', fonction: 'TREUILLISTE', status: 'actif', sector: 'Imiter Est Bure', currentPost: 'Poste 1', rotationGroup: 'default' },
  { matricule: 'M035', nom: 'CHERRADI', prenom: 'Samir', fonction: 'TREUILLISTE', status: 'actif', sector: 'Imiter Est Bure', currentPost: 'Poste 2', rotationGroup: 'default' },
  { matricule: 'M036', nom: 'SABRI', prenom: 'Amine', fonction: 'TREUILLISTE', status: 'actif', sector: 'Imiter Est Bure', currentPost: 'Poste 3', rotationGroup: 'default' },

  // Ouvriers d'extraction / Ouvriers (OUVRIER)
  { matricule: 'M016', nom: 'AIT ALI', prenom: 'Lahcen', fonction: 'OUVRIER', status: 'actif', sector: 'Imiter Est Bure', currentPost: 'Poste 1', rotationGroup: 'default' },
  { matricule: 'M017', nom: 'AIT EL CAID', prenom: 'Youssef', fonction: 'OUVRIER', status: 'actif', sector: 'Imiter Est Bure', currentPost: 'Poste 1', rotationGroup: 'default' },
  { matricule: 'M037', nom: 'TAHIRI', prenom: 'Kamal', fonction: 'OUVRIER', status: 'actif', sector: 'Imiter Est Bure', currentPost: 'Poste 2', rotationGroup: 'default' },
  { matricule: 'M038', nom: 'ROUICHI', prenom: 'Adil', fonction: 'OUVRIER', status: 'actif', sector: 'Imiter Est Bure', currentPost: 'Poste 2', rotationGroup: 'default' },
  { matricule: 'M039', nom: 'HAKIMI', prenom: 'Fouad', fonction: 'OUVRIER', status: 'actif', sector: 'Imiter Est Bure', currentPost: 'Poste 3', rotationGroup: 'default' },
  { matricule: 'M040', nom: 'FAWZI', prenom: 'Karim', fonction: 'OUVRIER', status: 'actif', sector: 'Imiter Est Bure', currentPost: 'Poste 3', rotationGroup: 'default' },

  // Électriciens / Chaudronniers / Mécaniciens
  { matricule: 'M005', nom: 'KASSIMI', prenom: 'Hassan', fonction: 'ELECTRICIEN', status: 'actif', sector: 'Atelier / Surface', currentPost: 'Poste 1', rotationGroup: 'default' },
  { matricule: 'M018', nom: 'NACIRI', prenom: 'Hicham', fonction: 'ELECTRICIEN', status: 'actif', sector: 'Atelier / Surface', currentPost: 'Poste 2', rotationGroup: 'default' },
  { matricule: 'M006', nom: 'NAJI', prenom: 'Khalid', fonction: 'CHAUDRONNIER', status: 'actif', sector: 'Atelier / Surface', currentPost: 'Poste 1', rotationGroup: 'default' },
  { matricule: 'M019', nom: 'EL FASSI', prenom: 'Rachid', fonction: 'MECANICIEN', status: 'actif', sector: 'Atelier / Surface', currentPost: 'Poste 2', rotationGroup: 'default' },

  // Responsables & Support
  { matricule: 'M020', nom: 'MOUDIR', prenom: 'Driss', fonction: 'MAGASINIER', status: 'actif', sector: 'Atelier / Surface', currentPost: 'Poste 1', rotationGroup: 'default' },
  { matricule: 'M021', nom: 'TAGMOUT', prenom: 'Said', fonction: 'RESPONSABLE_CHANTIER', status: 'actif', sector: 'Non assigné', currentPost: 'Poste 1', rotationGroup: 'default' },
  { matricule: 'M022', nom: 'EL ALAOUI', prenom: 'Fatim-Zahra', fonction: 'SECRETAIRE_CHANTIER', status: 'actif', sector: 'Non assigné', currentPost: 'Poste 1', rotationGroup: 'default' }
];
