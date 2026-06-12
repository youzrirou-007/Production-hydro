import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  Search, 
  Trash2, 
  X, 
  HardHat, 
  BadgeCheck, 
  MapPin, 
  Users, 
  Building2, 
  Filter,
  Edit2,
  Check,
  Network,
  Briefcase,
  ChevronDown,
  ChevronRight,
  TrendingUp
} from 'lucide-react';
import { collection, query, onSnapshot, addDoc, deleteDoc, doc, orderBy, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface Employee {
  id: string;
  matricule: string;
  nom: string;
  prenom: string;
  fonction: string;
  status: 'actif' | 'inactif';
  sector: string; // "Imiter 1" | "Imiter 2" | "Imiter Est" | "Imiter Est Bure" | "Atelier / Surface" | "Non assigné"
  currentPost: 'Poste 1' | 'Poste 2' | 'Poste 3';
  rotationGroup?: string;
}

// Hierarchy-perfect definition representing literal roles of interest
const ROLES = [
  { id: 'RESPONSABLE_CHANTIER', label: 'Responsable de Chantiers' },
  { id: 'SECRETAIRE_CHANTIER', label: 'Secrétaire de Chantiers' },
  { id: 'MAGASINIER', label: 'Magasinier' },
  { id: 'CHEF', label: 'Chef de Poste' },
  { id: 'MINEUR', label: 'Mineur' },
  { id: 'TREUILLISTE', label: 'Treuilliste' },
  { id: 'CONDUCTEUR_ENGIN', label: "Conducteur d'Engins" },
  { id: 'MECANICIEN', label: 'Mécanicien' },
  { id: 'AIDE_MINEUR', label: 'Aide Mineur' },
  { id: 'CHAUDRONNIER', label: 'Chaudronnier' },
  { id: 'ELECTRICIEN', label: 'Électricien' },
  { id: 'OUVRIER', label: 'Ouvrier' },
  { id: 'POMPISTE', label: 'Pompiste' }
];

const SECTORS = [
  { id: 'Imiter 1', label: 'Imiter 1' },
  { id: 'Imiter 2', label: 'Imiter 2' },
  { id: 'Imiter Est', label: 'Imiter Est' },
  { id: 'Imiter Est Bure', label: 'Imiter Est Bure' },
  { id: 'Atelier / Surface', label: 'Atelier / Surface' },
  { id: 'Non assigné', label: 'Non assigné' }
];

export const Admin: React.FC = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSectorFilter, setSelectedSectorFilter] = useState<string>('Tous');
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeAdminSubTab, setActiveAdminSubTab] = useState<'effectifs' | 'hierarchie' | 'parametres'>('effectifs');

  // Platform Settings State
  const [platformSettings, setPlatformSettings] = useState<{
    sectors: string[];
    engines: string[];
    oils: string[];
  }>({
    sectors: ['Imiter 1', 'Imiter 2', 'Imiter Est', 'Imiter Est Bure', 'Atelier / Surface', 'Non assigné'],
    engines: ['ST2D', 'ST2G 1', 'ST2G 3', 'ST2G 4', 'ST2G 5', 'ST2G6'],
    oils: ['Huile Moteur 15W40', 'Huile Hydraulique HV46', 'Huile Hydraulique HV68', 'Huile Transmission SAE30', 'Huile Transmission SAE50', 'Graisse Extrême Pression']
  });
  const [newSector, setNewSector] = useState('');
  const [newEngine, setNewEngine] = useState('');
  const [newOil, setNewOil] = useState('');

  // Listener for settings
  useEffect(() => {
    const unsubSettings = onSnapshot(doc(db, 'settings', 'platform'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setPlatformSettings({
          sectors: data.sectors || ['Imiter 1', 'Imiter 2', 'Imiter Est', 'Imiter Est Bure', 'Atelier / Surface', 'Non assigné'],
          engines: data.engines || ['ST2D', 'ST2G 1', 'ST2G 3', 'ST2G 4', 'ST2G 5', 'ST2G6'],
          oils: data.oils || ['Huile Moteur 15W40', 'Huile Hydraulique HV46', 'Huile Hydraulique HV68', 'Huile Transmission SAE30', 'Huile Transmission SAE50', 'Graisse Extrême Pression']
        });
      }
    }, (err) => {
      console.warn("Error loading settings:", err);
    });
    return () => unsubSettings();
  }, []);

  // Inline editing states
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    matricule: '',
    nom: '',
    prenom: '',
    fonction: 'MINEUR',
    sector: 'Non assigné',
    status: 'actif' as 'actif' | 'inactif',
    currentPost: 'Poste 1' as 'Poste 1' | 'Poste 2' | 'Poste 3',
    rotationGroup: 'default'
  });

  // RH Form init
  const [formData, setFormData] = useState({
    matricule: '',
    nom: '',
    prenom: '',
    fonction: 'MINEUR',
    sector: 'Non assigné',
    status: 'actif' as 'actif' | 'inactif',
    currentPost: 'Poste 1' as 'Poste 1' | 'Poste 2' | 'Poste 3',
    rotationGroup: 'default'
  });

  useEffect(() => {
    const qEmp = query(collection(db, 'personnel'), orderBy('matricule', 'asc'));
    const unsubEmp = onSnapshot(qEmp, (snapshot) => {
      setEmployees(snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          matricule: data.matricule || '',
          nom: data.nom || '',
          prenom: data.prenom || '',
          fonction: data.fonction || 'MINEUR',
          status: data.status || 'actif',
          sector: data.sector || 'Non assigné',
          currentPost: data.currentPost || 'Poste 1',
          rotationGroup: data.rotationGroup || 'default'
        } as Employee;
      }));
    });

    return () => unsubEmp();
  }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.matricule || !formData.nom) return;
    setLoading(true);
    try {
      await addDoc(collection(db, 'personnel'), {
        matricule: formData.matricule.trim().toUpperCase(),
        nom: formData.nom.trim().toUpperCase(),
        prenom: formData.prenom.trim(),
        fonction: formData.fonction,
        sector: formData.sector || 'Non assigné',
        status: formData.status,
        currentPost: formData.currentPost || 'Poste 1',
        rotationGroup: formData.rotationGroup || 'default'
      });
      setShowAdd(false);
      setFormData({
        matricule: '',
        nom: '',
        prenom: '',
        fonction: 'MINEUR',
        sector: 'Non assigné',
        status: 'actif',
        currentPost: 'Poste 1',
        rotationGroup: 'default'
      });
    } catch (err) {
      console.error("Error adding employee: ", err);
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (emp: Employee) => {
    setEditingId(emp.id);
    setEditForm({
      matricule: emp.matricule,
      nom: emp.nom,
      prenom: emp.prenom,
      fonction: emp.fonction,
      sector: emp.sector || 'Non assigné',
      status: emp.status,
      currentPost: emp.currentPost || 'Poste 1',
      rotationGroup: emp.rotationGroup || 'default'
    });
  };

  const handleSaveEdit = async (id: string) => {
    try {
      await updateDoc(doc(db, 'personnel', id), {
        matricule: editForm.matricule.trim().toUpperCase(),
        nom: editForm.nom.trim().toUpperCase(),
        prenom: editForm.prenom.trim(),
        fonction: editForm.fonction,
        sector: editForm.sector,
        status: editForm.status,
        currentPost: editForm.currentPost,
        rotationGroup: editForm.rotationGroup
      });
      setEditingId(null);
    } catch (err) {
      console.error("Error updating employee: ", err);
    }
  };

  const handleQuickUpdate = async (empId: string, field: 'sector' | 'currentPost', value: string) => {
    try {
      await updateDoc(doc(db, 'personnel', empId), {
        [field]: value
      });
    } catch (err) {
      console.error(`Error quick updating employee ${field}:`, err);
    }
  };

  const deleteEmployee = async (id: string, name: string) => {
    if (window.confirm(`Voulez-vous vraiment supprimer "${name}" de l'effectif ?`)) {
      try {
        await deleteDoc(doc(db, 'personnel', id));
      } catch (err) {
        console.error("Error deleting employee: ", err);
      }
    }
  };

  const getRoleLabel = (roleId: string) => {
    const r = ROLES.find(item => item.id === roleId || item.label.toUpperCase() === roleId.toUpperCase());
    return r ? r.label : roleId;
  };

  const getRoleBadgeStyle = (roleId: string) => {
    const normalized = roleId?.toUpperCase() || '';
    if (normalized === 'CHEF' || normalized === 'CHEF_DE_POSTE') {
      return 'bg-red-50 text-red-700 border-[#8B0000]/20';
    }
    if (normalized.includes('RESPONSABLE')) {
      return 'bg-purple-50 text-purple-700 border-purple-200';
    }
    if (normalized.includes('SECRETAIRE')) {
      return 'bg-blue-50 text-blue-700 border-blue-200';
    }
    if (normalized === 'MAGASINIER') {
      return 'bg-amber-50 text-amber-700 border-amber-200';
    }
    if (normalized === 'MECANICIEN') {
      return 'bg-teal-50 text-teal-700 border-teal-200';
    }
    if (normalized === 'ELECTRICIEN') {
      return 'bg-yellow-50 text-yellow-800 border-yellow-200';
    }
    if (normalized === 'CHAUDRONNIER') {
      return 'bg-cyan-50 text-cyan-700 border-cyan-200';
    }
    if (normalized === 'CONDUCTEUR_ENGIN') {
      return 'bg-orange-50 text-orange-700 border-orange-200';
    }
    if (normalized === 'POMPISTE') {
      return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    }
    return 'bg-slate-50 text-slate-700 border-slate-200';
  };

  // Filter & Search Logic
  const filteredEmployees = employees.filter(emp => {
    const matchesSearch = 
      emp.matricule.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.prenom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getRoleLabel(emp.fonction).toLowerCase().includes(searchQuery.toLowerCase());
    
    if (selectedSectorFilter === 'Tous') return matchesSearch;
    return matchesSearch && emp.sector?.toLowerCase() === selectedSectorFilter.toLowerCase();
  });

  // Hierarchy variables computed based on live personnel data
  const topResponsables = employees.filter(e => e.fonction === 'RESPONSABLE_CHANTIER');
  
  const supportStaff = employees.filter(e => 
    e.fonction === 'SECRETAIRE_CHANTIER' || 
    e.fonction === 'MAGASINIER' || 
    e.fonction === 'MECANICIEN'
  );

  const bottomTechStaff = employees.filter(e => 
    e.fonction === 'CHAUDRONNIER' || 
    e.fonction === 'ELECTRICIEN' || 
    e.fonction === 'OUVRIER' || 
    e.fonction === 'POMPISTE'
  );

  const getSecteurChefs = (sectorId: string) => employees.filter(e => e.fonction === 'CHEF' && e.sector === sectorId);
  const getSecteurStaff = (sectorId: string) => employees.filter(e => 
    e.sector === sectorId && 
    e.fonction !== 'CHEF' && 
    e.fonction !== 'RESPONSABLE_CHANTIER' &&
    e.fonction !== 'SECRETAIRE_CHANTIER' &&
    e.fonction !== 'MAGASINIER' &&
    e.fonction !== 'MECANICIEN' &&
    e.fonction !== 'CHAUDRONNIER' &&
    e.fonction !== 'ELECTRICIEN' &&
    e.fonction !== 'OUVRIER' &&
    e.fonction !== 'POMPISTE'
  );

  return (
    <div className="space-y-6">
      {/* Executive Page Header - Reduced Title Sizes */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b-2 border-slate-200 pb-4 gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900 uppercase">
            Ressources Humaines
          </h2>
          <p className="text-[10px] font-bold uppercase tracking-wider text-[#8B0000]">
            Classification, affectation territoriale et registre d'effectifs
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Main Tab Controls beside the action button */}
          <div className="flex bg-slate-200/60 p-1.5 border border-slate-300 rounded-lg gap-1">
            <button
              onClick={() => setActiveAdminSubTab('effectifs')}
              className={`px-4 py-2 font-black text-[10px] uppercase tracking-wider transition-all duration-300 rounded-md relative ${
                activeAdminSubTab === 'effectifs' 
                  ? 'bg-white text-[#8B0000] shadow-[0_0_15px_rgba(255,255,255,1),0_2px_8px_rgba(139,0,0,0.15)] border border-slate-200 scale-105 z-10' 
                  : 'text-slate-600 hover:text-slate-900 bg-transparent hover:bg-white/40'
              }`}
            >
              📋 Effectif (Tableau)
            </button>
            <button
              onClick={() => setActiveAdminSubTab('hierarchie')}
              className={`px-4 py-2 font-black text-[10px] uppercase tracking-wider transition-all duration-300 rounded-md relative ${
                activeAdminSubTab === 'hierarchie' 
                  ? 'bg-white text-[#8B0000] shadow-[0_0_15px_rgba(255,255,255,1),0_2px_8px_rgba(139,0,0,0.15)] border border-slate-200 scale-105 z-10' 
                  : 'text-slate-600 hover:text-slate-900 bg-transparent hover:bg-white/40'
              }`}
            >
              🌿 Hiérarchie (Arbre)
            </button>
            <button
              onClick={() => setActiveAdminSubTab('parametres')}
              className={`px-4 py-2 font-black text-[10px] uppercase tracking-wider transition-all duration-300 rounded-md relative ${
                activeAdminSubTab === 'parametres' 
                  ? 'bg-white text-[#8B0000] shadow-[0_0_15px_rgba(255,255,255,1),0_2px_8px_rgba(139,0,0,0.15)] border border-slate-200 scale-105 z-10' 
                  : 'text-slate-600 hover:text-slate-900 bg-transparent hover:bg-white/40'
              }`}
            >
              ⚙️ Paramètres de plateforme
            </button>
          </div>

          <button 
            onClick={() => setShowAdd(true)}
            className="bg-[#141414] text-white px-5 py-2.5 rounded-none font-black text-[10.5px] uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-[#8B0000] transition-colors border-b-4 border-black active:border-b-0 hover:border-[#8B0000]"
          >
            <Plus className="w-4 h-4" /> Ajouter Effectif
          </button>
        </div>
      </div>

      {activeAdminSubTab === 'effectifs' ? (
        <>
          {/* SEARCH AND SECTOR QUICK TABS */}
          <div className="bg-white border border-slate-200 p-4 space-y-4 shadow-sm">
            <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
              <div className="relative w-full md:max-w-md">
                <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Rechercher par nom, prénom, matricule, rôle..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-1.5 text-xs border border-slate-300 rounded-none outline-none focus:border-[#8B0000] focus:ring-1 focus:ring-[#8B0000]/15"
                />
              </div>

              <div className="text-[10.5px] font-bold text-slate-400">
                Total : <span className="text-slate-800 font-black">{filteredEmployees.length}</span> / {employees.length} collaborateurs
              </div>
            </div>

            {/* Sector Quick Filter Tags */}
            <div className="flex flex-wrap items-center gap-1.5 border-t border-slate-100 pt-3">
              <span className="text-[9.5px] font-black uppercase text-slate-400 mr-2 tracking-wider flex items-center gap-1">
                <Filter className="w-3.5 h-3.5" /> Secteur d'affectation :
              </span>
              {['Tous', 'Imiter 1', 'Imiter 2', 'Imiter Est', 'Imiter Est Bure', 'Atelier / Surface', 'Non assigné'].map(sect => {
                const isSel = selectedSectorFilter === sect;
                return (
                  <button
                    key={sect}
                    onClick={() => setSelectedSectorFilter(sect)}
                    className={`px-3 py-1 font-bold text-[9.5px] uppercase tracking-wide transition-all border ${
                      isSel 
                        ? 'bg-[#8B0000] border-[#8B0000] text-white' 
                        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    {sect}
                  </button>
                );
              })}
            </div>
          </div>

          {/* COLLABORATIVES DATABASE TABLE */}
          <div className="bg-white border border-slate-200 shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 text-slate-700">
                    <th className="px-5 py-3 text-[10px] font-black uppercase tracking-wider border-r border-slate-100">Matricule</th>
                    <th className="px-5 py-3 text-[10px] font-black uppercase tracking-wider border-r border-slate-100">Collaborateur</th>
                    <th className="px-5 py-3 text-[10px] font-black uppercase tracking-wider border-r border-slate-100">Hiérarchie / Fonction</th>
                    <th className="px-5 py-3 text-[10px] font-black uppercase tracking-wider border-r border-slate-100">Secteur / Rattachement</th>
                    <th className="px-5 py-3 text-[10px] font-black uppercase tracking-wider border-r border-slate-100">Poste actuel</th>
                    <th className="px-5 py-3 text-[10px] font-black uppercase tracking-wider border-r border-slate-100 text-center">Statut (Shift)</th>
                    <th className="px-5 py-3 text-[10px] font-black uppercase tracking-wider text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-150 text-[11px]">
                  {filteredEmployees.map((emp) => (
                    <tr key={emp.id} className="hover:bg-slate-50/55 transition-colors group">
                      {editingId === emp.id ? (
                        <>
                          {/* INLINE EDIT MODE ACTIVE */}
                          <td className="px-4 py-2 border-r border-slate-100 font-mono">
                            <input
                              type="text"
                              value={editForm.matricule}
                              onChange={e => setEditForm({ ...editForm, matricule: e.target.value })}
                              className="w-20 bg-slate-50 border border-slate-300 px-2 py-1 font-mono font-bold text-xs uppercase focus:border-[#8B0000] outline-none"
                            />
                          </td>
                          <td className="px-4 py-2 border-r border-slate-100">
                            <div className="flex gap-2">
                              <input
                                type="text"
                                placeholder="Nom"
                                value={editForm.nom}
                                onChange={e => setEditForm({ ...editForm, nom: e.target.value })}
                                className="w-28 bg-slate-50 border border-slate-300 px-2 py-1 font-semibold text-xs uppercase focus:border-[#8B0000] outline-none"
                              />
                              <input
                                type="text"
                                placeholder="Prénom"
                                value={editForm.prenom}
                                onChange={e => setEditForm({ ...editForm, prenom: e.target.value })}
                                className="w-28 bg-slate-50 border border-slate-300 px-2 py-1 font-semibold text-xs focus:border-[#8B0000] outline-none"
                              />
                            </div>
                          </td>
                          <td className="px-4 py-2 border-r border-slate-100">
                            <select
                              value={editForm.fonction}
                              onChange={e => setEditForm({ ...editForm, fonction: e.target.value })}
                              className="bg-slate-50 border border-slate-300 px-2 py-1 font-bold text-[10.5px] uppercase text-slate-850 focus:border-[#8B0000] outline-none"
                            >
                              {ROLES.map(r => (
                                <option key={r.id} value={r.id}>{r.label}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-2 border-r border-slate-100">
                            <select
                              value={editForm.sector}
                              onChange={e => setEditForm({ ...editForm, sector: e.target.value })}
                              className="bg-slate-50 border border-slate-300 px-2 py-1 font-bold text-[10px] uppercase text-slate-850 focus:border-[#8B0000] outline-none"
                            >
                              {SECTORS.map(s => (
                                <option key={s.id} value={s.id}>{s.label}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-2 border-r border-slate-100">
                            <select
                              value={editForm.currentPost}
                              onChange={e => setEditForm({ ...editForm, currentPost: e.target.value as any })}
                              className="bg-slate-50 border border-slate-300 px-2 py-1 font-bold text-[10px] uppercase text-slate-850 focus:border-[#8B0000] outline-none"
                            >
                              <option value="Poste 1">Poste 1</option>
                              <option value="Poste 2">Poste 2</option>
                              <option value="Poste 3">Poste 3</option>
                            </select>
                          </td>
                          <td className="px-4 py-2 border-r border-slate-100 text-center">
                            <select
                              value={editForm.status}
                              onChange={e => setEditForm({ ...editForm, status: e.target.value as any })}
                              className="bg-slate-50 border border-slate-300 px-1 py-1 font-bold text-[10px] uppercase text-slate-850 outline-none"
                            >
                              <option value="actif">Actif</option>
                              <option value="inactif">Inactif</option>
                            </select>
                          </td>
                          <td className="px-4 py-2 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1 px-1">
                              <button
                                onClick={() => handleSaveEdit(emp.id)}
                                className="bg-emerald-700 hover:bg-emerald-800 text-white font-black text-[9px] uppercase tracking-wider px-3 py-1.5 flex items-center gap-1 border-b-2 border-emerald-900 shadow-sm"
                              >
                                <Check className="w-3.5 h-3.5" /> Valider
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-[9px] uppercase tracking-wider px-2.5 py-1.5"
                              >
                                Annuler
                              </button>
                            </div>
                          </td>
                        </>
                      ) : (
                        <>
                          {/* STANDARD CELL DISPLAY */}
                          <td className="px-5 py-3 font-mono font-bold text-[#8B0000] border-r border-slate-100 text-[11px]">
                            {emp.matricule}
                          </td>
                          <td className="px-5 py-3 font-semibold text-slate-800 uppercase tracking-tight border-r border-slate-100">
                            {emp.nom} {emp.prenom}
                          </td>
                          <td className="px-5 py-3 border-r border-slate-100">
                            <span className={`inline-block px-2.5 py-0.5 border text-[9.5px] font-bold uppercase ${getRoleBadgeStyle(emp.fonction)}`}>
                              {getRoleLabel(emp.fonction)}
                            </span>
                          </td>
                          <td className="px-4 py-2 border-r border-slate-100">
                            <select
                              value={emp.sector || 'Non assigné'}
                              onChange={e => handleQuickUpdate(emp.id, 'sector', e.target.value)}
                              className="bg-slate-50 border border-slate-200 px-2 py-1 font-bold text-[10.5px] uppercase text-slate-700 outline-none focus:border-[#8B0000] hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                              {SECTORS.map(s => (
                                <option key={s.id} value={s.id}>{s.label}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-4 py-2 border-r border-slate-100">
                            <select
                              value={emp.currentPost || 'Poste 1'}
                              onChange={e => handleQuickUpdate(emp.id, 'currentPost', e.target.value)}
                              className="bg-slate-50 border border-slate-200 px-2 py-1 font-bold text-[10.5px] uppercase text-slate-700 outline-none focus:border-[#8B0000] hover:bg-slate-100 transition-colors cursor-pointer"
                            >
                              <option value="Poste 1">Poste 1</option>
                              <option value="Poste 2">Poste 2</option>
                              <option value="Poste 3">Poste 3</option>
                            </select>
                          </td>
                          <td className="px-5 py-3 border-r border-slate-100 text-center">
                            <span className={`inline-flex items-center gap-1 text-[9.5px] font-black uppercase ${
                              emp.status === 'actif' ? 'text-emerald-700' : 'text-slate-400'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${emp.status === 'actif' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                              {emp.status}
                            </span>
                          </td>
                          <td className="px-5 py-2.5 text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              <button 
                                onClick={() => startEditing(emp)}
                                className="p-1.5 rounded-none text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors"
                                title="Modifier les détails de la ligne"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button 
                                onClick={() => deleteEmployee(emp.id, `${emp.nom} ${emp.prenom}`)}
                                className="p-1.5 rounded-none text-slate-400 hover:text-red-700 hover:bg-red-50 transition-colors border-l border-slate-100 pl-2"
                                title="Supprimer définitivement"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </>
                      )}
                    </tr>
                  ))}
                  {filteredEmployees.length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-slate-400 font-bold italic">
                        Aucun collaborateur ne correspond à ces critères.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : activeAdminSubTab === 'hierarchie' ? (
        /* HIERARCHY TREE DIAGRAM - SCIENTIFICALLY POLISHED & ACCURATE */
        <div className="bg-slate-50 border border-slate-200 p-8 shadow-sm rounded-none min-h-[700px] flex flex-col items-center gap-12 overflow-x-auto relative">
          <div className="absolute right-4 top-4 bg-white/70 backdrop-blur border border-slate-200 px-3 py-1.5 text-[9px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 block" /> Actif
            <span className="w-2.5 h-2.5 rounded-full bg-slate-300 block ml-2" /> Hors-Shift
          </div>

          {/* LEVEL 1: EXECUTIVE / SUPERVISION (RESPONSABLE_CHANTIER) */}
          <div className="flex flex-col items-center max-w-lg w-full text-center">
            <span className="text-[9px] font-black uppercase tracking-[0.25em] text-[#8B0000] mb-2">★ Direction Suprême du Chantier</span>
            <div className="bg-white border-2 border-slate-900 p-4 shadow-md class-header relative group transition-all hover:scale-[1.01] w-full max-w-sm">
              <div className="absolute top-0 left-0 w-full h-1 bg-[#8B0000]" />
              <div className="flex items-center justify-center gap-2 mb-2">
                <Briefcase className="w-4 h-4 text-[#8B0000]" />
                <h4 className="font-black text-[10.5px] uppercase tracking-wide text-slate-900">Responsable de Chantiers (S.M.I)</h4>
              </div>
              <div className="space-y-1.5 pt-1 border-t border-slate-100 max-h-40 overflow-y-auto">
                {topResponsables.length > 0 ? (
                  topResponsables.map(r => (
                    <div key={r.id} className="flex items-center justify-between px-2 py-1 hover:bg-slate-50">
                      <div className="text-left">
                        <span className="font-mono text-[9px] font-black text-[#8B0000] mr-1.5">[{r.matricule}]</span>
                        <span className="text-slate-900 font-bold uppercase text-[10px]">{r.nom} {r.prenom}</span>
                      </div>
                      <span className={`w-1.5 h-1.5 rounded-full ${r.status === 'actif' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    </div>
                  ))
                ) : (
                  <p className="text-[10px] text-slate-400 italic font-medium py-1">Aucun Responsable assigné</p>
                )}
              </div>
            </div>
            {/* Visual connector branch line */}
            <div className="w-0.5 h-8 bg-slate-300 mt-2 relative">
              <ChevronDown className="w-3.5 h-3.5 text-slate-300 absolute -bottom-3 -left-1.5" />
            </div>
          </div>

          {/* LEVEL 2: COMPARTMENT GRID - SYMMETRICAL BRANCHES (FOND PRODUCTION VS PARC SERVICES) */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-10 w-full max-w-7xl pt-4 relative">
            
            {/* COLUMN A: PRODUCTION TIERS (SECTEURS FOND DETAILED WITH SUB-LEVELS) */}
            <div className="border border-slate-200 bg-white p-6 shadow-sm flex flex-col items-center">
              <div className="text-center pb-4 mb-4 border-b border-slate-100 w-full">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#00BFFF]">Filière Production & Secteurs Secs</span>
                <h3 className="font-black text-xs uppercase text-slate-900 mt-1">Secteurs Opérationnels de Fond</h3>
              </div>

              {/* THREE MAIN GEOGRAPHICAL SECTOR COLUMNS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full">
                
                {/* SECTOR 1: IMITER 1 */}
                <div className="bg-slate-50/70 border border-slate-200 p-3 flex flex-col items-center">
                  <div className="text-center font-black text-[9.5px] uppercase text-[#00BFFF] tracking-wider mb-2">Imiter 1</div>
                  
                  {/* CHEF DE POSTE CARD */}
                  <div className="bg-white border border-slate-300 p-2.5 shadow-xs w-full text-center">
                    <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Chef de Poste</div>
                    {getSecteurChefs('Imiter 1').length > 0 ? (
                      getSecteurChefs('Imiter 1').map(c => (
                        <div key={c.id} className="text-[9.5px] font-black text-slate-900 uppercase">
                          {c.nom} <span className="font-mono text-[#8B0000] text-[8px]">[{c.matricule}]</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-[8.5px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 uppercase block">Poste Vacant</span>
                    )}
                  </div>

                  {/* Connect arrow */}
                  <div className="w-0.5 h-4 bg-slate-300 my-1.5" />

                  {/* UNDERNEATH: MINEURS & AIDE MINEURS ATTACHED */}
                  <div className="w-full space-y-1">
                    <div className="text-[7.5px] font-bold text-center text-slate-400 uppercase tracking-wide mb-1">Brigade Mineurs</div>
                    {getSecteurStaff('Imiter 1').length > 0 ? (
                      getSecteurStaff('Imiter 1').map(s => (
                        <div key={s.id} className="bg-white border border-slate-200 px-2 py-1 text-[9px] flex items-center justify-between">
                          <div className="truncate">
                            <span className="font-mono text-[#8B0000] text-[8px] font-bold mr-1">[{s.matricule}]</span>
                            <span className="text-slate-800 font-bold uppercase truncate">{s.nom} {s.prenom[0]}.</span>
                          </div>
                          <span className="text-[7px] font-black uppercase text-slate-400 bg-slate-100 px-1 py-0.2">{getRoleLabel(s.fonction).split(' ')[0]}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-[8px] text-slate-400 italic text-center py-1">Équipe vide</p>
                    )}
                  </div>
                </div>

                {/* SECTOR 2: IMITER 2 */}
                <div className="bg-slate-50/70 border border-slate-200 p-3 flex flex-col items-center">
                  <div className="text-center font-black text-[9.5px] uppercase text-[#00BFFF] tracking-wider mb-2">Imiter 2</div>
                  
                  {/* CHEF DE POSTE CARD */}
                  <div className="bg-white border border-slate-300 p-2.5 shadow-xs w-full text-center">
                    <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Chef de Poste</div>
                    {getSecteurChefs('Imiter 2').length > 0 ? (
                      getSecteurChefs('Imiter 2').map(c => (
                        <div key={c.id} className="text-[9.5px] font-black text-slate-900 uppercase">
                          {c.nom} <span className="font-mono text-[#8B0000] text-[8px]">[{c.matricule}]</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-[8.5px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 uppercase block">Poste Vacant</span>
                    )}
                  </div>

                  {/* Connect arrow */}
                  <div className="w-0.5 h-4 bg-slate-300 my-1.5" />

                  {/* UNDERNEATH: MINEURS & AIDE MINEURS ATTACHED */}
                  <div className="w-full space-y-1">
                    <div className="text-[7.5px] font-bold text-center text-slate-400 uppercase tracking-wide mb-1">Brigade Mineurs</div>
                    {getSecteurStaff('Imiter 2').length > 0 ? (
                      getSecteurStaff('Imiter 2').map(s => (
                        <div key={s.id} className="bg-white border border-slate-200 px-2 py-1 text-[9px] flex items-center justify-between">
                          <div className="truncate mb-0.2">
                            <span className="font-mono text-[#8B0000] text-[8px] font-bold mr-1">[{s.matricule}]</span>
                            <span className="text-slate-800 font-bold uppercase truncate">{s.nom} {s.prenom[0]}.</span>
                          </div>
                          <span className="text-[7px] font-black uppercase text-slate-400 bg-slate-100 px-1 py-0.2">{getRoleLabel(s.fonction).split(' ')[0]}</span>
                        </div>
                      ))
                    ) : (
                      <p className="text-[8px] text-slate-400 italic text-center py-1">Équipe vide</p>
                    )}
                  </div>
                </div>

                {/* SECTOR 3: IMITER EST WITH TREUILLISTES */}
                <div className="bg-slate-50/70 border border-slate-200 p-3 flex flex-col items-center">
                  <div className="text-center font-black text-[9.5px] uppercase text-[#00BFFF] tracking-wider mb-2">Imiter Est</div>
                  
                  {/* CHEF DE POSTE CARD */}
                  <div className="bg-white border border-slate-300 p-2.5 shadow-xs w-full text-center">
                    <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Chef de Poste</div>
                    {getSecteurChefs('Imiter Est').length > 0 ? (
                      getSecteurChefs('Imiter Est').map(c => (
                        <div key={c.id} className="text-[9.5px] font-black text-slate-900 uppercase">
                          {c.nom} <span className="font-mono text-[#8B0000] text-[8px]">[{c.matricule}]</span>
                        </div>
                      ))
                    ) : (
                      <span className="text-[8.5px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 uppercase block">Poste Vacant</span>
                    )}
                  </div>

                  {/* Connect arrow */}
                  <div className="w-0.5 h-4 bg-slate-300 my-1.5" />

                  {/* UNDERNEATH: MINEURS, AIDES, ET TREUILLISTES SPÉCIFIQUEMENT */}
                  <div className="w-full space-y-1">
                    <div className="text-[7.5px] font-bold text-center text-slate-450 uppercase tracking-wide mb-1 italic">Mineurs & Treuillistes</div>
                    {getSecteurStaff('Imiter Est').length > 0 ? (
                      getSecteurStaff('Imiter Est').map(s => (
                        <div key={s.id} className="bg-white border border-slate-200 px-2 py-1 text-[9px] flex flex-col gap-0.5">
                          <div className="flex items-center justify-between">
                            <div className="truncate">
                              <span className="font-mono text-[#8B0000] text-[8px] font-bold mr-1">[{s.matricule}]</span>
                              <span className="text-slate-800 font-bold uppercase truncate">{s.nom} {s.prenom[0]}.</span>
                            </div>
                            <span className={`w-1.5 h-1.5 rounded-full ${s.status === 'actif' ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                          </div>
                          {/* Role tag highlighting Treuillistes for absolute clarity */}
                          <div className="flex items-center justify-between">
                            <span className={`text-[7.5px] font-bold uppercase px-1 py-0.2 ${
                              s.fonction === 'TREUILLISTE' 
                                ? 'bg-indigo-50 border border-indigo-200 text-indigo-700 font-black' 
                                : 'bg-slate-100 text-slate-500'
                            }`}>
                              {getRoleLabel(s.fonction)}
                            </span>
                            <span className="text-[6.5px] text-slate-400 capitalize">{s.status}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-[8px] text-slate-400 italic text-center py-1">Équipe vide</p>
                    )}
                  </div>
                </div>

              </div>
            </div>

            {/* COLUMN B: SUPPORT TIERS & PARC LOGISTIQUE (SECRETAIRE, MAGASINIER, MECANICIENS + BOTTOM BRIGADES) */}
            <div className="border border-slate-200 bg-white p-6 shadow-sm flex flex-col items-center">
              <div className="text-center pb-4 mb-4 border-b border-slate-100 w-full">
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#8B0000]">Filière Logistique & Ateliers</span>
                <h3 className="font-black text-xs uppercase text-slate-900 mt-1">Administration, Parc & Brigades Techniques</h3>
              </div>

              {/* LEVEL 2.1 SUPPORT DIRECTORS (SECRETAIRES, MAGASINIERS, MECANICIENS DANS LA MEME CATEGORIE) */}
              <div className="w-full bg-slate-50 border border-slate-200 p-4 rounded-none space-y-3">
                <div className="text-center">
                  <span className="text-[8.5px] font-black uppercase text-slate-500 tracking-[0.15em] block">
                    Gérance administrative & Mécaniques (Même Niveau)
                  </span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {/* Category: Secrétaires */}
                  <div className="bg-white border border-slate-200 p-2 text-center shadow-xs">
                    <span className="text-[7.5px] font-black uppercase text-slate-400 block mb-1">Secrétariat</span>
                    <div className="space-y-1 max-h-24 overflow-y-auto">
                      {supportStaff.filter(e => e.fonction === 'SECRETAIRE_CHANTIER').length > 0 ? (
                        supportStaff.filter(e => e.fonction === 'SECRETAIRE_CHANTIER').map(s => (
                          <div key={s.id} className="text-[9.5px] font-extrabold text-slate-800 uppercase text-left truncate">
                            👤 {s.nom} <span className="text-[7.5px] font-mono text-[#8B0000]">[{s.matricule}]</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-[8.5px] text-slate-400 italic">Aucun secrétaire</p>
                      )}
                    </div>
                  </div>

                  {/* Category: Magasiniers */}
                  <div className="bg-white border border-slate-200 p-2 text-center shadow-xs">
                    <span className="text-[7.5px] font-black uppercase text-slate-400 block mb-1">Magasiniers</span>
                    <div className="space-y-1 max-h-24 overflow-y-auto">
                      {supportStaff.filter(e => e.fonction === 'MAGASINIER').length > 0 ? (
                        supportStaff.filter(e => e.fonction === 'MAGASINIER').map(s => (
                          <div key={s.id} className="text-[9.5px] font-extrabold text-slate-800 uppercase text-left truncate">
                            📦 {s.nom} <span className="text-[7.5px] font-mono text-[#8B0000]">[{s.matricule}]</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-[8.5px] text-slate-400 italic">Aucun magasinier</p>
                      )}
                    </div>
                  </div>

                  {/* Category: Mécaniciens (Parc) */}
                  <div className="bg-white border border-slate-200 p-2 text-center shadow-xs">
                    <span className="text-[7.5px] font-black uppercase text-slate-400 block mb-1">Mécanique Parc</span>
                    <div className="space-y-1 max-h-24 overflow-y-auto">
                      {supportStaff.filter(e => e.fonction === 'MECANICIEN').length > 0 ? (
                        supportStaff.filter(e => e.fonction === 'MECANICIEN').map(s => (
                          <div key={s.id} className="text-[9.5px] font-extrabold text-[#8B0000] uppercase text-left truncate">
                            🔧 {s.nom} <span className="text-[7.5px] font-mono text-slate-400">[{s.matricule}]</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-[8.5px] text-slate-400 italic">Aucun mécanicien</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Vertical link line to the bottom units */}
              <div className="w-0.5 h-6 bg-slate-300 my-2" />

              {/* LEVEL 2.2 ATELIERS DE CHAUDRONNERIE, ELEC, ET AUTRES OUVRIERS (EN BAS DU PARC) */}
              <div className="w-full bg-[#141414] text-white p-4">
                <div className="text-center mb-2.5">
                  <span className="text-[8.5px] font-black uppercase text-[#00BFFF] tracking-[0.2em] block">
                    ⚡ Ateliers de Maintenance & Services du Parc (Échelons Bas)
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {/* Chaudronniers & Électriciens */}
                  <div className="bg-white/10 p-2.5">
                    <span className="text-[7px] font-black uppercase text-slate-300 tracking-wider block mb-1 border-b border-white/5 pb-1">⚡ Technique d'Atelier</span>
                    <div className="space-y-1 max-h-28 overflow-y-auto text-[8.5px]">
                      {bottomTechStaff.filter(e => e.fonction === 'CHAUDRONNIER' || e.fonction === 'ELECTRICIEN').length > 0 ? (
                        bottomTechStaff.filter(e => e.fonction === 'CHAUDRONNIER' || e.fonction === 'ELECTRICIEN').map(b => (
                          <div key={b.id} className="flex justify-between items-center text-white font-extrabold">
                            <span className="uppercase truncate">⚡ {b.nom}</span>
                            <span className="font-mono text-slate-400 uppercase text-[7.5px] px-1 bg-white/5">({getRoleLabel(b.fonction).split(' ')[0]})</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-[8px] text-slate-500 italic">Aucun électricien / chaudronnier</p>
                      )}
                    </div>
                  </div>

                  {/* Ouvriers et Pompistes */}
                  <div className="bg-white/10 p-2.5">
                    <span className="text-[7%px] font-black uppercase text-slate-300 tracking-wider block mb-1 border-b border-white/5 pb-1">⚓ Ouvriers & Pompes</span>
                    <div className="space-y-1 max-h-28 overflow-y-auto text-[8.5px]">
                      {bottomTechStaff.filter(e => e.fonction === 'OUVRIER' || e.fonction === 'POMPISTE').length > 0 ? (
                        bottomTechStaff.filter(e => e.fonction === 'OUVRIER' || e.fonction === 'POMPISTE').map(b => (
                          <div key={b.id} className="flex justify-between items-center text-white" style={{fontWeight: 900}}>
                            <span className="uppercase truncate">⚓ {b.nom}</span>
                            <span className="font-mono text-slate-450 text-[7px] bg-white/5 px-1 truncate">({getRoleLabel(b.fonction).split(' ')[0]})</span>
                          </div>
                        ))
                      ) : (
                        <p className="text-[8px] text-slate-500 italic">Aucun ouvrier / pompiste</p>
                      )}
                    </div>
                  </div>
                </div>

              </div>

            </div>

          </div>
          
          <div className="mt-4 text-center">
            <span className="text-[10px] font-bold text-slate-400 block uppercase tracking-widest">Hydromines S.A. Digital Fleet Registry</span>
            <span className="text-[8px] font-semibold text-slate-400 block">Calculé en temps réel depuis le cloud firestore</span>
          </div>
        </div>
      ) : (
        /* PARAMETERS PLATEFORME - EXTREMELY POLISHED SECTORS, ENGINES AND LUBRICANTS EDITOR */
        <div className="bg-white border border-slate-200 p-6 space-y-6 shadow-sm">
          <div className="border-b border-slate-150 pb-3">
            <h3 className="text-sm font-black uppercase text-[#8B0000] tracking-wide">
              ⚙️ Paramètres Globaux de la Plateforme S.M.I
            </h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-1">
              Configuration des listes restrictives pour le Registre de poste (la saisie manuelle est interdite).
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* CARD 1: SECTEURS */}
            <div className="border border-slate-200 p-4 space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="font-black text-xs uppercase text-slate-800">Secteurs de Travail</span>
                <span className="font-mono text-[9px] font-bold text-slate-400">({platformSettings.sectors.length} actifs)</span>
              </div>
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {platformSettings.sectors.map((sec, idx) => (
                  <div key={idx} className="flex justify-between items-center py-1.5 px-2 bg-slate-50 border border-slate-100 font-bold text-xs uppercase text-slate-700">
                    <span>{sec}</span>
                    <button 
                      onClick={async () => {
                        try {
                          const updated = platformSettings.sectors.filter((_, i) => i !== idx);
                          setPlatformSettings(prev => ({ ...prev, sectors: updated }));
                          await setDoc(doc(db, 'settings', 'platform'), { ...platformSettings, sectors: updated });
                        } catch (err) {
                          console.error("Erreur de suppression du secteur:", err);
                        }
                      }}
                      className="text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {platformSettings.sectors.length === 0 && (
                  <p className="text-[10px] text-slate-400 italic">Aucun secteur configuré</p>
                )}
              </div>
              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <input 
                  type="text"
                  placeholder="Nouveau secteur (Ex: Imiter Est)..."
                  value={newSector}
                  onChange={e => setNewSector(e.target.value)}
                  className="flex-1 text-xs border border-slate-300 p-1.5 px-2 font-bold uppercase outline-none focus:border-[#8B0000]"
                />
                <button
                  onClick={async () => {
                    if (newSector.trim()) {
                      try {
                        const updated = [...platformSettings.sectors, newSector.trim()];
                        setPlatformSettings(prev => ({ ...prev, sectors: updated }));
                        await setDoc(doc(db, 'settings', 'platform'), { ...platformSettings, sectors: updated });
                        setNewSector('');
                      } catch (err) {
                        console.error("Erreur d'ajout du secteur:", err);
                      }
                    }
                  }}
                  className="bg-[#141414] hover:bg-[#8B0000] text-white px-3 py-1.5 font-black text-xs uppercase transition-colors"
                >
                  Ajouter
                </button>
              </div>
            </div>

            {/* CARD 2: ENGINS (LHD) */}
            <div className="border border-slate-200 p-4 space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="font-black text-xs uppercase text-slate-800">Engins de Charge (LHD)</span>
                <span className="font-mono text-[9px] font-bold text-slate-400">({platformSettings.engines.length} actifs)</span>
              </div>
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {platformSettings.engines.map((eng, idx) => (
                  <div key={idx} className="flex justify-between items-center py-1.5 px-2 bg-slate-50 border border-slate-100 font-bold text-xs uppercase text-slate-700">
                    <span>{eng}</span>
                    <button 
                      onClick={async () => {
                        try {
                          const updated = platformSettings.engines.filter((_, i) => i !== idx);
                          setPlatformSettings(prev => ({ ...prev, engines: updated }));
                          await setDoc(doc(db, 'settings', 'platform'), { ...platformSettings, engines: updated });
                        } catch (err) {
                          console.error("Erreur de suppression de l'engin:", err);
                        }
                      }}
                      className="text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {platformSettings.engines.length === 0 && (
                  <p className="text-[10px] text-slate-400 italic">Aucun engin configuré</p>
                )}
              </div>
              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <input 
                  type="text"
                  placeholder="Code engin (Ex: ST2G 1)..."
                  value={newEngine}
                  onChange={e => setNewEngine(e.target.value)}
                  className="flex-1 text-xs border border-slate-300 p-1.5 px-2 font-bold uppercase outline-none focus:border-[#8B0000]"
                />
                <button
                  onClick={async () => {
                    if (newEngine.trim()) {
                      try {
                        const updated = [...platformSettings.engines, newEngine.trim()];
                        setPlatformSettings(prev => ({ ...prev, engines: updated }));
                        await setDoc(doc(db, 'settings', 'platform'), { ...platformSettings, engines: updated });
                        setNewEngine('');
                      } catch (err) {
                        console.error("Erreur d'ajout de l'engin:", err);
                      }
                    }
                  }}
                  className="bg-[#141414] hover:bg-[#8B0000] text-white px-3 py-1.5 font-black text-xs uppercase transition-colors"
                >
                  Ajouter
                </button>
              </div>
            </div>

            {/* CARD 3: HUILES & LUBRIFIANTS */}
            <div className="border border-slate-200 p-4 space-y-4">
              <div className="flex items-center justify-between border-b pb-2">
                <span className="font-black text-xs uppercase text-slate-800">Huiles & Lubrifiants</span>
                <span className="font-mono text-[9px] font-bold text-slate-400">({platformSettings.oils.length} actifs)</span>
              </div>
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {platformSettings.oils.map((oil, idx) => (
                  <div key={idx} className="flex justify-between items-center py-1.5 px-2 bg-slate-50 border border-slate-100 font-bold text-xs text-slate-700">
                    <span>{oil}</span>
                    <button 
                      onClick={async () => {
                        try {
                          const updated = platformSettings.oils.filter((_, i) => i !== idx);
                          setPlatformSettings(prev => ({ ...prev, oils: updated }));
                          await setDoc(doc(db, 'settings', 'platform'), { ...platformSettings, oils: updated });
                        } catch (err) {
                          console.error("Erreur de suppression de l'huile:", err);
                        }
                      }}
                      className="text-slate-400 hover:text-red-600 transition-colors cursor-pointer"
                      title="Supprimer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
                {platformSettings.oils.length === 0 && (
                  <p className="text-[10px] text-slate-400 italic">Aucune huile configurée</p>
                )}
              </div>
              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <input 
                  type="text"
                  placeholder="Élément d'huile (Ex: Huile Hydraulique HV68)..."
                  value={newOil}
                  onChange={e => setNewOil(e.target.value)}
                  className="flex-1 text-xs border border-slate-300 p-1.5 px-2 font-semibold outline-none focus:border-[#8B0000]"
                />
                <button
                  onClick={async () => {
                    if (newOil.trim()) {
                      try {
                        const updated = [...platformSettings.oils, newOil.trim()];
                        setPlatformSettings(prev => ({ ...prev, oils: updated }));
                        await setDoc(doc(db, 'settings', 'platform'), { ...platformSettings, oils: updated });
                        setNewOil('');
                      } catch (err) {
                        console.error("Erreur d'ajout de l'huile:", err);
                      }
                    }
                  }}
                  className="bg-[#141414] hover:bg-[#8B0000] text-white px-3 py-1.5 font-black text-xs uppercase transition-colors"
                >
                  Ajouter
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ADD COLLABORATOR DIALOG BOX - Reduced Heading Titles */}
      <AnimatePresence>
        {showAdd && (
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white w-full max-w-md rounded-none border border-slate-200 p-6 shadow-2xl relative"
            >
              <button 
                onClick={() => setShowAdd(false)} 
                className="absolute right-4 top-4 p-1 hover:bg-slate-100 text-slate-500 transition-colors"
              >
                <X className="w-5 h-5"/>
              </button>
              
              <div className="mb-4">
                <h3 className="text-sm font-bold tracking-tight text-slate-950 uppercase flex items-center gap-1.5">
                  <HardHat className="w-4 h-4 text-[#8B0000]" /> Nouveau Collaborateur
                </h3>
                <p className="text-[9.5px] text-slate-400 font-medium">Saisissez les informations d'affectation réglementaires.</p>
              </div>

              <form onSubmit={handleAdd} className="space-y-4">
                {/* Matricule */}
                <div className="space-y-1">
                  <label className="text-[9.5px] font-black uppercase tracking-wider text-slate-500 block">Matricule réglementaire *</label>
                  <input 
                    required 
                    placeholder="200" 
                    value={formData.matricule} 
                    onChange={e => setFormData({...formData, matricule: e.target.value})} 
                    className="w-full bg-slate-50 border border-slate-300 px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-[#8B0000] focus:ring-1 focus:ring-[#8B0000]/15" 
                  />
                </div>

                {/* Nom & Prénom */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9.5px] font-black uppercase tracking-wider text-slate-500 block">Nom de famille *</label>
                    <input 
                      required 
                      placeholder="Ex: OUZRIROU" 
                      value={formData.nom} 
                      onChange={e => setFormData({...formData, nom: e.target.value})} 
                      className="w-full bg-slate-50 border border-slate-300 px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-[#8B0000]" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9.5px] font-black uppercase tracking-wider text-slate-500 block">Prénom *</label>
                    <input 
                      required 
                      placeholder="Ex: Yahya" 
                      value={formData.prenom} 
                      onChange={e => setFormData({...formData, prenom: e.target.value})} 
                      className="w-full bg-slate-50 border border-slate-300 px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-[#8B0000]" 
                    />
                  </div>
                </div>

                {/* Role / Hierarchy Selection */}
                <div className="space-y-1">
                  <label className="text-[9.5px] font-black uppercase tracking-wider text-slate-500 block">Fonction (Échelon-Poste) *</label>
                  <select 
                    value={formData.fonction} 
                    onChange={e => setFormData({...formData, fonction: e.target.value})} 
                    className="w-full bg-slate-50 border border-slate-300 px-3 py-2 text-xs text-slate-850 outline-none focus:border-[#8B0000] font-bold"
                  >
                    {ROLES.map(role => (
                      <option key={role.id} value={role.id}>{role.label}</option>
                    ))}
                  </select>
                </div>

                {/* Sector / Affectation Selection */}
                <div className="space-y-1">
                  <label className="text-[9.5px] font-black uppercase tracking-wider text-[#141414] block">Secteur / Gisement Principal *</label>
                  <select 
                    value={formData.sector} 
                    onChange={e => setFormData({...formData, sector: e.target.value})} 
                    className="w-full bg-slate-50 border border-slate-300 px-3 py-2 text-xs text-slate-850 outline-none focus:border-[#8B0000] font-bold"
                  >
                    {SECTORS.map(sec => (
                      <option key={sec.id} value={sec.id}>{sec.label}</option>
                    ))}
                  </select>
                </div>

                {/* Poste actuel */}
                <div className="space-y-1">
                  <label className="text-[9.5px] font-black uppercase tracking-wider text-slate-500 block">Poste actuel *</label>
                  <select 
                    value={formData.currentPost} 
                    onChange={e => setFormData({...formData, currentPost: e.target.value as any})} 
                    className="w-full bg-slate-50 border border-slate-300 px-3 py-2 text-xs text-slate-850 outline-none focus:border-[#8B0000] font-bold"
                  >
                    <option value="Poste 1">Poste 1</option>
                    <option value="Poste 2">Poste 2</option>
                    <option value="Poste 3">Poste 3</option>
                  </select>
                </div>

                {/* Shift status */}
                <div className="space-y-1">
                  <label className="text-[9.5px] font-black uppercase tracking-wider text-slate-500 block">Statut d'activité</label>
                  <select 
                    value={formData.status} 
                    onChange={e => setFormData({...formData, status: e.target.value as any})} 
                    className="w-full bg-slate-50 border border-slate-300 px-3 py-2 text-xs text-slate-800 outline-none"
                  >
                    <option value="actif">Actif (Inclus aux shifts)</option>
                    <option value="inactif">Inactif (Congé / Suspension)</option>
                  </select>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-2">
                  <button 
                    type="button"
                    onClick={() => setShowAdd(false)}
                    className="flex-1 border border-slate-300 text-slate-600 font-bold py-2 text-[10px] uppercase transition-colors"
                  >
                    Annuler
                  </button>
                  <button 
                    type="submit" 
                    disabled={loading}
                    className="flex-1 bg-[#8B0000] text-white font-black py-2 text-[10px] uppercase tracking-wider transition-colors disabled:opacity-50"
                  >
                    {loading ? 'Création...' : 'Graver l\'Effectif'}
                  </button>
                </div>

              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
