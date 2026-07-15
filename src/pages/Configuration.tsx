import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Settings, 
  Plus, 
  Trash2, 
  Check, 
  AlertTriangle, 
  FileText, 
  Database,
  Crown,
  Info,
  Users,
  ShieldAlert,
  Search,
  UserX,
  UserCheck,
  X,
  Shield,
  Ban,
  Clock,
  Briefcase
} from 'lucide-react';
import { collection, onSnapshot, doc, deleteDoc, setDoc, query } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

export interface CausePreset {
  id: string;
  name: string;
  category: string;
  subCauses: string[];
  actions: string[];
}

export interface UserAccount {
  id: string;
  name: string;
  email?: string;
  role: 'secretary' | 'responsible' | 'chief' | 'direction' | 'admin' | 'direction_technique';
  siteIds?: string[];
  bannedUntil?: string | null;
  bannedPermanently?: boolean | null;
  banReason?: string | null;
}

export const DEFAULT_PRESET_CAUSES: CausePreset[] = [
  {
    id: "air_comprime",
    name: "Air comprimé insuffisant",
    category: "Réseaux & Fluides",
    subCauses: [
      "Pression réseau générale inférieure à 4 bars",
      "Fuite d'air sur conduite principale de galerie",
      "Compresseur principal de surface hors-service",
      "Ginglard d'alimentation colmaté"
    ],
    actions: [
      "Raccordement au réseau de secours Est",
      "Intervention d'urgence équipe Tuyauterie",
      "Démarrage du compresseur électrique de rechange",
      "Purger et remplacer le flexible de forage"
    ]
  },
  {
    id: "perforateur_panne",
    name: "Panne de perforateur (Jumbo/Pantera)",
    category: "Matériel de forage",
    subCauses: [
      "Flexible hydraulique éclaté sur glissière",
      "Défaut électrique armoire de commande",
      "Usure anormale de l'emmanchement",
      "Fuite d'huile au niveau du nez de rotation"
    ],
    actions: [
      "Remplacement immédiat du flexible par l'atelier",
      "Réinitialisation automate par électromécanicien",
      "Remplacement de l'emmanchement en atelier",
      "Mise en sécurité et transfert à l'atelier central"
    ]
  },
  {
    id: "retard_deblayage",
    name: "Retard de déblayage du front",
    category: "Opérationnel",
    subCauses: [
      "Panne du chargeur LHD (Scooptram)",
      "Encombrement de la galerie de desserte",
      "Manque de camions pour le transport des stériles",
      "Présence d'eau importante bloquant le chargement"
    ],
    actions: [
      "Redéploiement d'un LHD de réserve (Secteur 2)",
      "Dégagement prioritaire de l'axe de roulage",
      "Optimisation de la rotation des camions de mine",
      "Mise en route de deux pompes submersibles"
    ]
  },
  {
    id: "tige_taillant",
    name: "Casse d'outil de forage (Tige/Taillant)",
    category: "Consommables",
    subCauses: [
      "Tige conique coincée et rompue dans le trou",
      "Usure prématurée des boutons du taillant",
      "Casse de filetage sur barre d'extension R32",
      "Déviation excessive du trou de mine"
    ],
    actions: [
      "Extraction de la tige cassée au récupérateur",
      "Remplacement du taillant par un neuf renforcé",
      "Changement de la barre d'extension",
      "Recalibrage des paramètres de poussée du Jumbo"
    ]
  },
  {
    id: "eau_pression",
    name: "Infiltration d'eau sous forte pression",
    category: "Géologique",
    subCauses: [
      "Venue d'eau inattendue lors du forage du bouchon",
      "Inondation temporaire de la sole du chantier",
      "Humidité extrême empêchant le chargement de l'ANFO",
      "Effondrement partiel des parois du trou de mine"
    ],
    actions: [
      "Cimentation immédiate des venues d'eau",
      "Raccordement d'un collecteur de drainage rapide",
      "Passage obligatoire aux cartouches d'émulsion étanches",
      "Forage de trous de décharge pour drainer"
    ]
  },
  {
    id: "electricite_panne",
    name: "Coupure d'alimentation électrique SMI",
    category: "Réseaux & Fluides",
    subCauses: [
      "Disjonction du sous-station de secteur 15kV",
      "Câble d'alimentation basse tension sectionné par un engin",
      "Panne d'alternateur sur groupe électrogène local",
      "Surcharge réseau sur transformateur de galerie"
    ],
    actions: [
      "Rétablissement par l'équipe Électricité Réseau",
      "Pose d'une boîte de jonction étanche rapide",
      "Basculement manuel sur le groupe de secours",
      "Délestage des équipements non prioritaires"
    ]
  }
];

export const Configuration: React.FC = () => {
  const { profile, user: currentUser } = useAuth();
  
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'presets' | 'roles'>('roles');

  // Failed blast causes presets state
  const [presets, setPresets] = useState<CausePreset[]>([]);
  const [loadingPresets, setLoadingPresets] = useState<boolean>(true);

  // User list state
  const [users, setUsers] = useState<UserAccount[]>([]);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(true);
  const [userSearch, setUserSearch] = useState<string>('');

  // Toast notifications
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Form states for new Cause
  const [newCauseName, setNewCauseName] = useState('');
  const [newCauseCategory, setNewCauseCategory] = useState('Opérationnel');
  const [subCausesInput, setSubCausesInput] = useState('');
  const [actionsInput, setActionsInput] = useState('');

  // Selected preset for detailed view/edit
  const [selectedPreset, setSelectedPreset] = useState<CausePreset | null>(null);

  // Ban action states
  const [banningUser, setBanningUser] = useState<UserAccount | null>(null);
  const [banDuration, setBanDuration] = useState<'24h' | '48h' | 'permanent' | 'unban'>('24h');
  const [banReason, setBanReason] = useState('Saisie d\'informations fausses ou non conformes');
  const [customBanReason, setCustomBanReason] = useState('');

  // Permissions helper
  const isSuperAdmin = profile?.role === 'admin';
  const isTechDirector = profile?.role === 'direction_technique';
  const isDirection = profile?.role === 'direction';
  const hasManagementAccess = isSuperAdmin || isTechDirector || isDirection;

  // Toast trigger
  const triggerToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Load Presets from Firestore
  useEffect(() => {
    setLoadingPresets(true);
    const q = query(collection(db, 'failed_blast_causes'));
    const unsub = onSnapshot(q, (snap) => {
      if (snap.empty) {
        seedDefaultCauses();
      } else {
        const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as CausePreset);
        setPresets(list);
        setLoadingPresets(false);
      }
    }, (err) => {
      console.error("Error fetching presets:", err);
      handleFirestoreError(err, OperationType.LIST, 'failed_blast_causes');
      setLoadingPresets(false);
    });

    return () => unsub();
  }, []);

  // Load Users from Firestore
  useEffect(() => {
    setLoadingUsers(true);
    const q = query(collection(db, 'users'));
    const unsub = onSnapshot(q, (snap) => {
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }) as UserAccount);
      setUsers(list);
      setLoadingUsers(false);
    }, (err) => {
      console.error("Error fetching users list:", err);
      handleFirestoreError(err, OperationType.LIST, 'users');
      setLoadingUsers(false);
    });

    return () => unsub();
  }, []);

  const seedDefaultCauses = async () => {
    try {
      for (const cause of DEFAULT_PRESET_CAUSES) {
        await setDoc(doc(db, 'failed_blast_causes', cause.id), cause);
      }
      triggerToast("Base de données initialisée avec les causes par défaut.", "success");
    } catch (err) {
      console.error("Error seeding default causes:", err);
    }
  };

  // Create Cause Preset
  const handleCreateCause = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCauseName.trim()) {
      triggerToast("Veuillez saisir un nom de cause principale.", "error");
      return;
    }

    const subCausesList = subCausesInput
      .split('\n')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    const actionsList = actionsInput
      .split('\n')
      .map(a => a.trim())
      .filter(a => a.length > 0);

    if (subCausesList.length === 0) {
      triggerToast("Saisissez au moins une sous-cause explicative.", "error");
      return;
    }

    if (actionsList.length === 0) {
      triggerToast("Saisissez au moins une action corrective associée.", "error");
      return;
    }

    try {
      const generatedId = "cause_" + Date.now();
      const payload: CausePreset = {
        id: generatedId,
        name: newCauseName.trim(),
        category: newCauseCategory,
        subCauses: subCausesList,
        actions: actionsList
      };

      await setDoc(doc(db, 'failed_blast_causes', generatedId), payload);
      triggerToast("Nouvelle cause configurée avec succès !", "success");
      
      // Reset form
      setNewCauseName('');
      setSubCausesInput('');
      setActionsInput('');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'failed_blast_causes');
      triggerToast("Erreur lors de la configuration.", "error");
    }
  };

  // Delete Cause Preset
  const handleDeleteCause = async (id: string) => {
    if (!window.confirm("Voulez-vous supprimer cette cause ainsi que toutes ses explications et actions correctives ?")) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'failed_blast_causes', id));
      triggerToast("Cause supprimée du système.", "success");
      if (selectedPreset?.id === id) {
        setSelectedPreset(null);
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'failed_blast_causes/' + id);
      triggerToast("Erreur lors de la suppression.", "error");
    }
  };

  // Update user role
  const handleUpdateRole = async (userId: string, newRole: UserAccount['role']) => {
    if (!hasManagementAccess) {
      triggerToast("Autorisation insuffisante pour modifier les rôles.", "error");
      return;
    }

    const targetUser = users.find(u => u.id === userId);
    if (!targetUser) return;

    if (userId === currentUser?.uid && newRole !== 'admin') {
      if (!window.confirm("Attention : Vous modifiez votre propre rôle de Superadmin. Vous risquez de perdre l'accès à ce panneau. Continuer ?")) {
        return;
      }
    }

    try {
      await setDoc(doc(db, 'users', userId), { role: newRole }, { merge: true });
      triggerToast(`Rôle de ${targetUser.name} mis à jour en "${getRoleLabel(newRole)}".`, "success");
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'users/' + userId);
      triggerToast("Erreur lors de la modification du rôle.", "error");
    }
  };

  // Submit Ban / Suspension
  const handleApplyBan = async () => {
    if (!banningUser) return;
    if (!hasManagementAccess) {
      triggerToast("Autorisation insuffisante pour suspendre des accès.", "error");
      return;
    }

    if (banningUser.id === currentUser?.uid) {
      triggerToast("Vous ne pouvez pas suspendre votre propre compte.", "error");
      return;
    }

    const reasonText = banReason === 'Autre motif' ? customBanReason.trim() : banReason;
    if (!reasonText && banDuration !== 'unban') {
      triggerToast("Veuillez renseigner ou sélectionner le motif de la suspension.", "error");
      return;
    }

    try {
      if (banDuration === 'unban') {
        // Lift suspension
        await setDoc(doc(db, 'users', banningUser.id), {
          bannedUntil: null,
          bannedPermanently: false,
          banReason: null
        }, { merge: true });
        triggerToast(`La suspension d'accès de ${banningUser.name} a été levée.`, "success");
      } else {
        // Apply suspension
        let bannedUntilDate: string | null = null;
        if (banDuration === '24h') {
          bannedUntilDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
        } else if (banDuration === '48h') {
          bannedUntilDate = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();
        }

        await setDoc(doc(db, 'users', banningUser.id), {
          bannedUntil: bannedUntilDate,
          bannedPermanently: banDuration === 'permanent',
          banReason: reasonText
        }, { merge: true });

        const durationText = banDuration === '24h' ? '24 Heures' : banDuration === '48h' ? '48 Heures' : 'Désactivation Définitive';
        triggerToast(`Compte de ${banningUser.name} suspendu avec succès (${durationText}).`, "success");
      }

      setBanningUser(null);
      setCustomBanReason('');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'users/' + banningUser.id);
      triggerToast("Erreur lors de l'application de la suspension.", "error");
    }
  };

  // Delete User Profile
  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!isSuperAdmin && !isTechDirector) {
      triggerToast("Seuls le Superadmin et le Directeur Technique peuvent supprimer des utilisateurs.", "error");
      return;
    }

    if (userId === currentUser?.uid) {
      triggerToast("Action interdite : vous ne pouvez pas vous supprimer vous-même.", "error");
      return;
    }

    if (!window.confirm(`ATTENTION DANGER : Voulez-vous supprimer définitivement le profil de "${userName}" ? Cette action effacera sa fiche utilisateur du système.`)) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'users', userId));
      triggerToast(`Profil de "${userName}" supprimé définitivement.`, "success");
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'users/' + userId);
      triggerToast("Erreur lors de la suppression de l'utilisateur.", "error");
    }
  };

  // UI labels mapping
  const getRoleLabel = (role: UserAccount['role']) => {
    switch (role) {
      case 'admin': return 'Superadministrateur';
      case 'direction_technique': return 'Directeur Technique';
      case 'direction': return 'Direction Générale';
      case 'chief': return 'Chef de Chantier';
      case 'responsible': return 'Responsable de Secteur';
      case 'secretary': return 'Secrétaire de Saisie';
      default: return role;
    }
  };

  const getRoleColor = (role: UserAccount['role']) => {
    switch (role) {
      case 'admin': return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'direction_technique': return 'bg-amber-50 text-amber-700 border-[#b8860b]/30';
      case 'direction': return 'bg-sky-50 text-sky-700 border-sky-200';
      case 'chief': return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'responsible': return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'secretary': return 'bg-slate-100 text-slate-700 border-slate-200';
      default: return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  // Filter users based on search
  const filteredUsers = users.filter(u => {
    const term = userSearch.toLowerCase();
    const nameMatch = u.name?.toLowerCase().includes(term);
    const emailMatch = u.email?.toLowerCase().includes(term);
    const roleMatch = getRoleLabel(u.role).toLowerCase().includes(term);
    return nameMatch || emailMatch || roleMatch;
  });

  const getBanStatus = (u: UserAccount) => {
    if (u.bannedPermanently) {
      return { status: 'permanent', label: 'Désactivé', color: 'bg-rose-50 text-rose-700 border-rose-200' };
    }
    if (u.bannedUntil && new Date(u.bannedUntil) > new Date()) {
      const remainingHours = Math.ceil((new Date(u.bannedUntil).getTime() - Date.now()) / (60 * 60 * 1000));
      return { 
        status: 'temp', 
        label: `Suspendu (Reste ${remainingHours}h)`, 
        color: 'bg-orange-50 text-orange-700 border-orange-200' 
      };
    }
    return { status: 'active', label: 'Actif', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
  };

  return (
    <div className="min-h-screen bg-[#FBFBFA] text-slate-800 py-10 px-4 sm:px-6 lg:px-8">
      {/* Toast Notification Banner */}
      <AnimatePresence>
        {toast && (
          <motion.div 
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -30 }}
            className={`fixed top-6 right-6 z-50 p-4 rounded-xl shadow-lg border text-xs font-black uppercase tracking-wider flex items-center gap-2.5 ${
              toast.type === 'success' 
                ? 'bg-[#0f2e1a] border-emerald-500 text-emerald-100' 
                : 'bg-[#3b0f0f] border-rose-500 text-rose-100'
            }`}
          >
            <Check className="w-4 h-4 text-emerald-400" />
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <span className="text-[10px] font-black uppercase tracking-widest text-[#b8860b]">
          Panneau d'Administration & Sécurité SMI
        </span>
        <h1 className="text-3xl font-black uppercase tracking-wider text-slate-900 mt-1 flex items-center gap-3">
          <Settings className="w-8 h-8 text-[#b8860b]" />
          Configuration du Système
        </h1>
        <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1.5 border-b border-slate-100 pb-4">
          Contrôlez les privilèges d'accès, administrez les comptes d'utilisateurs et standardisez les options de saisie automatique.
        </p>
      </div>

      {/* Quick Navigation Tabs */}
      <div className="max-w-7xl mx-auto mb-8 flex border-b border-slate-200/80">
        <button
          onClick={() => setActiveTab('roles')}
          className={`py-3 px-6 text-xs font-black uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'roles'
              ? 'border-[#b8860b] text-[#b8860b]'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Users className="w-4 h-4" />
          Rôles & Comptes Utilisateurs
        </button>
        <button
          onClick={() => setActiveTab('presets')}
          className={`py-3 px-6 text-xs font-black uppercase tracking-wider flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
            activeTab === 'presets'
              ? 'border-[#b8860b] text-[#b8860b]'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Database className="w-4 h-4" />
          Saisie Automatique
        </button>
      </div>

      {/* Tab Contents */}
      <div className="max-w-7xl mx-auto">
        <AnimatePresence mode="wait">
          {activeTab === 'roles' ? (
            <motion.div
              key="roles-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {/* Directive Header */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200/60">
                <div className="lg:col-span-1 border-r border-slate-200/60 pr-4 flex flex-col justify-center">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-900">
                    <Crown className="w-4 h-4 text-[#b8860b]" />
                    <span>Sécurité d'Accès</span>
                  </div>
                  <p className="text-[10px] text-slate-500 font-semibold uppercase mt-1">
                    Gestion stricte de l'habilitation et du statut des collaborateurs par la Direction Générale.
                  </p>
                </div>
                <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-[10px] text-slate-600 space-y-1 p-1">
                    <span className="font-bold block text-[#991b1b]">M. El-Hassan (DT) :</span>
                    <p className="italic">"Un compte suspect doit être suspendu instantanément pour 24h ou 48h afin de préserver la souveraineté de nos registres."</p>
                  </div>
                  <div className="text-[10px] text-slate-600 space-y-1 p-1">
                    <span className="font-bold block text-sky-600">M. Youcef (DG) :</span>
                    <p className="italic">"L'accès aux fiches de paie et aux données de production est réglementé. Ajustez les rôles avec la plus grande rigueur."</p>
                  </div>
                  <div className="text-[10px] text-slate-600 space-y-1 p-1">
                    <span className="font-bold block text-amber-600">Comité Technique :</span>
                    <p className="italic">"Seuls le Superadmin et moi-même en tant que Directeur Technique possédons l'autorisation de supprimer un profil."</p>
                  </div>
                </div>
              </div>

              {/* Roles Dashboard Statistics */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-black uppercase text-slate-400 block">Collaborateurs</span>
                    <span className="text-2xl font-black text-slate-900">{users.length}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl">
                    <Users className="w-5 h-5 text-slate-500" />
                  </div>
                </div>

                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-black uppercase text-slate-400 block">Accès Actifs</span>
                    <span className="text-2xl font-black text-emerald-600">
                      {users.filter(u => getBanStatus(u).status === 'active').length}
                    </span>
                  </div>
                  <div className="p-3 bg-emerald-50 rounded-xl">
                    <UserCheck className="w-5 h-5 text-emerald-500" />
                  </div>
                </div>

                <div className="bg-white border border-slate-200 p-5 rounded-2xl shadow-xs flex items-center justify-between">
                  <div>
                    <span className="text-[9px] font-black uppercase text-slate-400 block">Sanctionnés / Exclus</span>
                    <span className="text-2xl font-black text-rose-600">
                      {users.filter(u => getBanStatus(u).status !== 'active').length}
                    </span>
                  </div>
                  <div className="p-3 bg-rose-50 rounded-xl">
                    <UserX className="w-5 h-5 text-rose-500" />
                  </div>
                </div>
              </div>

              {/* Main Accounts Table Card */}
              <div className="bg-white border border-slate-200 rounded-2xl shadow-xs overflow-hidden">
                {/* Filters Header */}
                <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-50/50">
                  <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-[#b8860b]" />
                    <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">
                      Contrôle des Habilitations & Rôles
                    </h2>
                  </div>

                  {/* Search Bar */}
                  <div className="relative w-full sm:w-72">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Chercher par nom, email, rôle..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-semibold focus:outline-none focus:border-[#b8860b] text-slate-800 placeholder-slate-400"
                    />
                  </div>
                </div>

                {/* Table Layout */}
                {loadingUsers ? (
                  <div className="py-16 text-center text-xs font-black uppercase text-slate-400 animate-pulse">
                    Chargement du registre des utilisateurs...
                  </div>
                ) : filteredUsers.length === 0 ? (
                  <div className="py-16 text-center text-xs font-bold text-slate-400 uppercase">
                    Aucun utilisateur trouvé correspondant aux critères de recherche.
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-100 text-[10px] font-black uppercase tracking-widest text-slate-400">
                          <th className="py-4 px-6">Identité / Collaborateur</th>
                          <th className="py-4 px-6">Rôle d'Habilitation</th>
                          <th className="py-4 px-6">Statut d'Accès</th>
                          <th className="py-4 px-6 text-right">Actions de Sécurité</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-xs">
                        {filteredUsers.map((u) => {
                          const banState = getBanStatus(u);
                          const isSelf = u.id === currentUser?.uid;

                          return (
                            <tr key={u.id} className="hover:bg-slate-50/40 transition-all">
                              {/* Name and Email */}
                              <td className="py-4 px-6">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center font-black uppercase text-slate-600 text-xs shrink-0 shadow-2xs">
                                    {u.name?.charAt(0) || u.email?.charAt(0) || '?'}
                                  </div>
                                  <div className="flex flex-col">
                                    <span className="font-bold text-slate-900 flex items-center gap-1.5">
                                      {u.name || 'Utilisateur'}
                                      {isSelf && (
                                        <span className="text-[8px] font-black uppercase px-1.5 py-0.2 bg-slate-900 text-[#ffd700] rounded-sm tracking-wide">
                                          Moi
                                        </span>
                                      )}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-semibold">{u.email || 'Aucun e-mail'}</span>
                                  </div>
                                </div>
                              </td>

                              {/* Role Selector or Badge */}
                              <td className="py-4 px-6">
                                {hasManagementAccess && !isSelf ? (
                                  <select
                                    value={u.role}
                                    onChange={(e) => handleUpdateRole(u.id, e.target.value as UserAccount['role'])}
                                    className={`border rounded-lg px-2.5 py-1.5 text-xs font-black uppercase focus:outline-none cursor-pointer ${getRoleColor(u.role)}`}
                                  >
                                    <option value="secretary">Secrétaire de Saisie</option>
                                    <option value="responsible">Responsable de Secteur</option>
                                    <option value="chief">Chef de Chantier</option>
                                    <option value="direction">Direction Générale</option>
                                    <option value="direction_technique">Directeur Technique</option>
                                    <option value="admin">Superadministrateur</option>
                                  </select>
                                ) : (
                                  <span className={`px-2.5 py-1.5 border rounded-lg text-[9px] font-black uppercase ${getRoleColor(u.role)}`}>
                                    {getRoleLabel(u.role)}
                                  </span>
                                )}
                              </td>

                              {/* Status Badge */}
                              <td className="py-4 px-6">
                                <div className="flex flex-col gap-0.5">
                                  <span className={`px-2.5 py-1 border rounded-lg text-[9px] font-black uppercase w-fit tracking-wider ${banState.color}`}>
                                    {banState.label}
                                  </span>
                                  {banState.status !== 'active' && u.banReason && (
                                    <span className="text-[9px] text-rose-500 font-semibold italic mt-1 max-w-xs truncate">
                                      "{u.banReason}"
                                    </span>
                                  )}
                                </div>
                              </td>

                              {/* Action Buttons */}
                              <td className="py-4 px-6 text-right">
                                <div className="flex items-center justify-end gap-2.5">
                                  {/* Ban Option Trigger */}
                                  <button
                                    onClick={() => {
                                      setBanningUser(u);
                                      setBanDuration(banState.status !== 'active' ? 'unban' : '24h');
                                    }}
                                    disabled={isSelf || !hasManagementAccess}
                                    className={`p-2 rounded-xl border transition-all ${
                                      isSelf || !hasManagementAccess
                                        ? 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed'
                                        : banState.status !== 'active'
                                          ? 'bg-emerald-50 border-emerald-200 text-emerald-600 hover:bg-emerald-100'
                                          : 'bg-amber-50 border-amber-200 text-amber-600 hover:bg-amber-100'
                                    }`}
                                    title={banState.status !== 'active' ? "Lever la suspension" : "Ajuster la suspension d'accès"}
                                  >
                                    {banState.status !== 'active' ? (
                                      <UserCheck className="w-4 h-4" />
                                    ) : (
                                      <ShieldAlert className="w-4 h-4" />
                                    )}
                                  </button>

                                  {/* Delete Profile button (Superadmin & DT Only) */}
                                  {(isSuperAdmin || isTechDirector) && (
                                    <button
                                      onClick={() => handleDeleteUser(u.id, u.name)}
                                      disabled={isSelf}
                                      className={`p-2 rounded-xl border transition-all ${
                                        isSelf 
                                          ? 'bg-slate-50 border-slate-100 text-slate-300 cursor-not-allowed'
                                          : 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100'
                                      }`}
                                      title="Supprimer définitivement le compte"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Ban Setup Dialogue / Modal */}
              <AnimatePresence>
                {banningUser && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0.95, opacity: 0 }}
                      className="bg-white border border-slate-200 rounded-3xl p-6 shadow-2xl w-full max-w-md relative overflow-hidden"
                    >
                      <button
                        onClick={() => setBanningUser(null)}
                        className="p-1 text-slate-400 hover:text-slate-600 absolute top-4 right-4"
                      >
                        <X className="w-5 h-5" />
                      </button>

                      <div className="flex items-center gap-3 pb-4 border-b border-slate-100 mb-5">
                        <div className="p-2.5 bg-amber-50 rounded-xl text-[#b8860b]">
                          <ShieldAlert className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="text-sm font-black uppercase text-slate-900">
                            Sécurité & Sanctions : {banningUser.name}
                          </h3>
                          <span className="text-[10px] text-slate-400 font-bold block uppercase mt-0.5">
                            Modifier le statut d'accès du compte
                          </span>
                        </div>
                      </div>

                      <div className="space-y-4 text-xs">
                        {/* Status Switch Choice */}
                        <div className="space-y-1">
                          <label className="text-[9px] font-black uppercase text-slate-500">Choisir la mesure</label>
                          <div className="grid grid-cols-2 gap-2 mt-1">
                            {getBanStatus(banningUser).status !== 'active' ? (
                              <button
                                type="button"
                                onClick={() => setBanDuration('unban')}
                                className={`p-3 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all flex flex-col items-center gap-1.5 justify-center ${
                                  banDuration === 'unban'
                                    ? 'bg-emerald-900 border-emerald-500 text-emerald-100'
                                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                                }`}
                              >
                                <UserCheck className="w-4 h-4" />
                                Lever la sanction
                              </button>
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setBanDuration('24h')}
                                  className={`p-3 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all flex flex-col items-center gap-1.5 justify-center ${
                                    banDuration === '24h'
                                      ? 'bg-amber-900 border-amber-500 text-amber-100 shadow-xs'
                                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                                  }`}
                                >
                                  <Clock className="w-4 h-4" />
                                  Suspendre 24H
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setBanDuration('48h')}
                                  className={`p-3 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all flex flex-col items-center gap-1.5 justify-center ${
                                    banDuration === '48h'
                                      ? 'bg-orange-900 border-orange-500 text-orange-100 shadow-xs'
                                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                                  }`}
                                >
                                  <Clock className="w-4 h-4" />
                                  Suspendre 48H
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setBanDuration('permanent')}
                                  className={`p-3 col-span-2 rounded-xl border text-[10px] font-black uppercase tracking-wider transition-all flex flex-col items-center gap-1.5 justify-center ${
                                    banDuration === 'permanent'
                                      ? 'bg-rose-950 border-rose-500 text-rose-100 shadow-xs'
                                      : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                                  }`}
                                >
                                  <Ban className="w-4 h-4" />
                                  Désactiver Définitivement
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Ban Reason Selector */}
                        {banDuration !== 'unban' && (
                          <div className="space-y-3 pt-2">
                            <div className="space-y-1">
                              <label className="text-[9px] font-black uppercase text-slate-500">Motif administratif</label>
                              <select
                                value={banReason}
                                onChange={(e) => setBanReason(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold focus:outline-none focus:border-[#b8860b]"
                              >
                                <option value="Saisie d'informations fausses ou non conformes">Saisie de fausses données / Falsification</option>
                                <option value="Non-respect des protocoles de sécurité SMI">Non-respect des règles de sécurité SMI</option>
                                <option value="Comportement indésirable sur la plateforme">Inconduite ou comportement indésirable</option>
                                <option value="Autre motif">Autre motif personnalisé</option>
                              </select>
                            </div>

                            {banReason === 'Autre motif' && (
                              <div className="space-y-1">
                                <label className="text-[9px] font-black uppercase text-rose-500">Explication détaillée (Requis)</label>
                                <textarea
                                  value={customBanReason}
                                  onChange={(e) => setCustomBanReason(e.target.value)}
                                  placeholder="Veuillez spécifier la raison de l'exclusion temporaire ou définitive..."
                                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:border-[#b8860b] text-slate-800"
                                  rows={3}
                                  required
                                />
                              </div>
                            )}
                          </div>
                        )}

                        <div className="flex gap-3 pt-4 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => setBanningUser(null)}
                            className="w-1/2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all"
                          >
                            Annuler
                          </button>
                          <button
                            type="button"
                            onClick={handleApplyBan}
                            className={`w-1/2 py-2.5 text-[10px] font-black uppercase tracking-wider rounded-xl transition-all text-white ${
                              banDuration === 'unban'
                                ? 'bg-emerald-600 hover:bg-emerald-700'
                                : 'bg-slate-900 hover:bg-slate-800'
                            }`}
                          >
                            {banDuration === 'unban' ? 'Valider Activation' : 'Confirmer Sanction'}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  </div>
                )}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div
              key="presets-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-1 lg:grid-cols-3 gap-8"
            >
              {/* Left Column: List of existing Cause Presets */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs">
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <Database className="w-5 h-5 text-sky-600" />
                      <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">
                        Causes Principales Actives ({presets.length})
                      </h2>
                    </div>
                    <button 
                      onClick={seedDefaultCauses}
                      className="text-[9px] font-black uppercase tracking-widest text-[#b8860b] hover:underline"
                    >
                      Réinitialiser par défaut
                    </button>
                  </div>

                  {loadingPresets ? (
                    <div className="py-12 text-center text-xs font-black uppercase text-slate-400 animate-pulse">
                      Chargement des configurations...
                    </div>
                  ) : presets.length === 0 ? (
                    <div className="py-12 text-center text-xs font-semibold text-slate-400 uppercase">
                      Aucune cause configurée. Veuillez ajouter ou réinitialiser.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {presets.map((preset) => (
                        <div 
                          key={preset.id}
                          className={`p-4 rounded-xl border transition-all cursor-pointer ${
                            selectedPreset?.id === preset.id 
                              ? 'border-[#b8860b] bg-amber-50/20 shadow-xs' 
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                          onClick={() => setSelectedPreset(preset)}
                        >
                          <div className="flex items-start justify-between">
                            <div>
                              <span className="text-[9px] font-black uppercase px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full">
                                {preset.category}
                              </span>
                              <h3 className="text-xs font-black text-slate-900 mt-2">
                                {preset.name}
                              </h3>
                            </div>
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteCause(preset.id);
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600 rounded transition-all cursor-pointer"
                              title="Supprimer la cause"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="mt-4 flex gap-4 text-[10px] text-slate-500 font-bold uppercase">
                            <div>
                              <span className="text-slate-800 font-black">{preset.subCauses.length}</span> Sous-causes
                            </div>
                            <div>
                              <span className="text-slate-800 font-black">{preset.actions.length}</span> Actions correctives
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Detailed view of selected Cause Preset */}
                {selectedPreset && (
                  <motion.div 
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-6"
                  >
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                      <div>
                        <span className="text-[9px] font-black uppercase text-slate-400 block">Saisie standardisée active</span>
                        <h3 className="text-sm font-black uppercase text-[#b8860b] mt-0.5">
                          Détail des Presets : {selectedPreset.name}
                        </h3>
                      </div>
                      <button 
                        onClick={() => setSelectedPreset(null)}
                        className="text-[10px] font-black uppercase tracking-wider text-slate-400 hover:text-slate-900"
                      >
                        Fermer l'aperçu
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Sub causes */}
                      <div className="space-y-3">
                        <span className="text-[10px] font-black uppercase text-[#991b1b] flex items-center gap-1.5">
                          <Info className="w-3.5 h-3.5" />
                          Sous-causes explicatives de la liste déroulante
                        </span>
                        <div className="space-y-2">
                          {selectedPreset.subCauses.map((sc, index) => (
                            <div key={index} className="p-2.5 bg-red-50/40 text-red-950 text-xs font-semibold rounded-lg border border-red-100">
                              {sc}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Standard Actions */}
                      <div className="space-y-3">
                        <span className="text-[10px] font-black uppercase text-sky-600 flex items-center gap-1.5">
                          <Check className="w-3.5 h-3.5" />
                          Actions correctives standardisées suggérées
                        </span>
                        <div className="space-y-2">
                          {selectedPreset.actions.map((act, index) => (
                            <div key={index} className="p-2.5 bg-sky-50/40 text-sky-950 text-xs font-semibold rounded-lg border border-sky-100">
                              {act}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </div>

              {/* Right Column: Add New Cause Form */}
              <div className="space-y-6">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 shadow-xs">
                  <div className="pb-3 border-b border-slate-200 mb-4">
                    <div className="flex items-center gap-2">
                      <Plus className="w-5 h-5 text-[#b8860b]" />
                      <h2 className="text-sm font-black uppercase tracking-wider text-slate-900">
                        Ajouter une Cause Prédéfinie
                      </h2>
                    </div>
                    <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">
                      Configurez une nouvelle liste déroulante pour les opérateurs du front de taille.
                    </p>
                  </div>

                  <form onSubmit={handleCreateCause} className="space-y-4 text-xs font-semibold text-slate-700">
                    {/* Category */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-slate-500">Catégorie technique</label>
                      <select
                        value={newCauseCategory}
                        onChange={(e) => setNewCauseCategory(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-bold focus:outline-none focus:border-[#b8860b]"
                      >
                        <option value="Opérationnel">Opérationnel (Retard de cycle/Crew)</option>
                        <option value="Matériel de forage">Matériel de forage (Jumbo, Perforateur)</option>
                        <option value="Réseaux & Fluides">Réseaux & Fluides (Air, Énergie, Ventilation)</option>
                        <option value="Consommables">Consommables (Tiges, Taillants, Explosifs)</option>
                        <option value="Géologique">Géologique (Infiltration d'eau, Effondrement)</option>
                      </select>
                    </div>

                    {/* Name */}
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase text-slate-500">Nom de la Cause Principale</label>
                      <input
                        type="text"
                        required
                        placeholder="Ex: Panne de compresseur local"
                        value={newCauseName}
                        onChange={(e) => setNewCauseName(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:border-[#b8860b] text-slate-800 placeholder-slate-400"
                      />
                    </div>

                    {/* Sub causes - text area */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[9px] font-black uppercase text-[#991b1b]">Sous-Causes Explicatives</label>
                        <span className="text-[8px] font-black uppercase text-slate-400">(Une option par ligne)</span>
                      </div>
                      <textarea
                        required
                        rows={4}
                        placeholder={`Ex:\nCompresseur en surchauffe thermique\nFuite d'huile sur carter d'arbre\nDéfaut d'alimentation 380V`}
                        value={subCausesInput}
                        onChange={(e) => setSubCausesInput(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:border-[#b8860b] text-slate-800 placeholder-slate-400"
                      />
                    </div>

                    {/* Corrective actions - text area */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-[9px] font-black uppercase text-sky-600">Actions Correctives Prédéfinies</label>
                        <span className="text-[8px] font-black uppercase text-slate-400">(Une action par ligne)</span>
                      </div>
                      <textarea
                        required
                        rows={4}
                        placeholder={`Ex:\nDémarrage du compresseur mobile de secours\nRemplacement joint spi par mécanicien de garde\nRecâblage disjoncteur principal`}
                        value={actionsInput}
                        onChange={(e) => setActionsInput(e.target.value)}
                        className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-semibold focus:outline-none focus:border-[#b8860b] text-slate-800 placeholder-slate-400"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-[#ffd700] text-[10px] font-black uppercase tracking-wider rounded-xl shadow-md transition-all cursor-pointer mt-2"
                    >
                      Valider et Enregistrer la Cause
                    </button>
                  </form>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Configuration;
