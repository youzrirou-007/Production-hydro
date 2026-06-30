import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Plus, 
  MapPin, 
  Layers, 
  Target, 
  BarChart, 
  X, 
  Upload, 
  ImageIcon, 
  Unlock, 
  Lock, 
  Trash2, 
  AlertCircle, 
  CheckCircle,
  Activity,
  Search,
  Edit2,
  SlidersHorizontal
} from 'lucide-react';
import { collection, query, onSnapshot, addDoc, deleteDoc, doc, updateDoc, orderBy, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useSite } from '../contexts/SiteContext';
import logoImg from '../assets/images/hydromines_logo_1781337889277.jpg';

interface Chantier {
  id: string;
  name: string;
  sector: string;
  galleryType: '9m2' | '12m2';
  plannedTotalMeterage: number;
  currentMeterage: number;
  status: 'ouvert' | 'fermé';
  croquisUrl?: string;
  createdAt: string;
}

export const Chantiers: React.FC = () => {
  const { activeSiteId } = useSite();
  const [chantiers, setChantiers] = useState<Chantier[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Toast Notification state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    sector: 'Bure Imiter Est',
    galleryType: '12m2' as const,
    plannedTotalMeterage: 0,
    croquisUrl: ''
  });

  // Search & Filtering State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'ouvert' | 'fermé'>('all');
  const [sizeFilter, setSizeFilter] = useState<'all' | '9m2' | '12m2'>('all');

  // Edit State
  const [editingChantier, setEditingChantier] = useState<Chantier | null>(null);
  const [editFormData, setEditFormData] = useState({
    name: '',
    sector: 'Bure Imiter Est',
    galleryType: '12m2' as '9m2' | '12m2',
    plannedTotalMeterage: 0,
    currentMeterage: 0,
    croquisUrl: ''
  });

  const startEditing = (c: Chantier) => {
    setEditingChantier(c);
    setEditFormData({
      name: c.name,
      sector: c.sector,
      galleryType: c.galleryType,
      plannedTotalMeterage: c.plannedTotalMeterage,
      currentMeterage: c.currentMeterage || 0,
      croquisUrl: c.croquisUrl || ''
    });
  };

  const handleEditImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1.5 * 1024 * 1024) {
        showToast("L'image est trop lourde. Limite : 1.5 Mo.", "error");
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setEditFormData(prev => ({ ...prev, croquisUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChantier) return;
    
    if (!editFormData.name.trim()) {
      showToast("Le nom du chantier est requis.", "error");
      return;
    }
    if (!editFormData.plannedTotalMeterage || editFormData.plannedTotalMeterage <= 0) {
      showToast("Veuillez saisir un objectif de métrage valide (supérieur à 0).", "error");
      return;
    }
    if (editFormData.currentMeterage < 0) {
      showToast("Le métrage réalisé ne peut pas être négatif.", "error");
      return;
    }

    setLoading(true);
    try {
      await updateDoc(doc(db, 'chantiers', editingChantier.id), {
        name: editFormData.name.toUpperCase().trim(),
        sector: editFormData.sector,
        galleryType: editFormData.galleryType,
        plannedTotalMeterage: Number(editFormData.plannedTotalMeterage),
        currentMeterage: Number(editFormData.currentMeterage),
        croquisUrl: editFormData.croquisUrl
      });
      setEditingChantier(null);
      showToast("Le chantier a été mis à jour avec succès !", "success");
    } catch (err: any) {
      console.error("Edit chantier error:", err);
      showToast(`Erreur lors de la modification : ${err?.message || err}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    // Auto dismiss after 4 seconds
    const timer = setTimeout(() => {
      setToast(null);
    }, 4000);
    return () => clearTimeout(timer);
  };

  useEffect(() => {
    const q = query(
      collection(db, 'chantiers'),
      where('siteId', '==', activeSiteId)
    );
    const unsub = onSnapshot(q, (snapshot) => {
      setChantiers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Chantier)));
    }, (error) => {
      console.error("Firestore loading error:", error);
      showToast("Erreur lors de la synchronisation des données depuis le cloud.", "error");
    });
    return () => unsub();
  }, [activeSiteId]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 1.5 * 1024 * 1024) {
        showToast("L'image est trop lourde. Limite : 1.5 Mo.", "error");
        return;
      }
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, croquisUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      showToast("Le nom du chantier est requis.", "error");
      return;
    }
    if (!formData.plannedTotalMeterage || formData.plannedTotalMeterage <= 0) {
      showToast("Veuillez saisir un objectif de métrage valide (supérieur à 0).", "error");
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, 'chantiers'), {
        name: formData.name.toUpperCase().trim(),
        sector: formData.sector,
        siteId: activeSiteId,
        galleryType: formData.galleryType,
        plannedTotalMeterage: Number(formData.plannedTotalMeterage),
        currentMeterage: 0,
        status: 'ouvert',
        croquisUrl: formData.croquisUrl,
        createdAt: new Date().toISOString()
      });
      
      // Reset form & states
      setFormData({ 
        name: '', 
        sector: 'Bure Imiter Est', 
        galleryType: '12m2', 
        plannedTotalMeterage: 0, 
        croquisUrl: '' 
      });
      setShowAdd(false);
      showToast("Le nouveau chantier a été enregistré et ouvert avec succès !", "success");
    } catch (err: any) {
      console.error("Create chantier error:", err);
      showToast(`Erreur lors de l'enregistrement : ${err?.message || err}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const toggleStatus = async (id: string, currentStatus: string) => {
    try {
      await updateDoc(doc(db, 'chantiers', id), {
        status: currentStatus === 'ouvert' ? 'fermé' : 'ouvert'
      });
      showToast(`Chantier mis à jour avec succès.`, 'success');
    } catch (err) {
      console.error(err);
      showToast("Erreur lors de la mise à jour du chantier.", "error");
    }
  };

  const deleteChantier = async (id: string) => {
    if (confirm("Supprimer définitivement ce chantier de la plateforme HydroMines ?")) {
      try {
        await deleteDoc(doc(db, 'chantiers', id));
        showToast("Le chantier a été définitivement supprimé.", 'success');
      } catch (err) {
        console.error(err);
        showToast("Erreur lors de la suppression.", "error");
      }
    }
  };

  // Custom hierarchical sorting strategy requested by user:
  // 1. Bure Imiter Est (Bure / N340)
  // 2. Imiter Est
  // 3. Imiter 2
  // 4. Imiter 1
  const getSectorWeight = (sectorStr: string, nameStr: string): number => {
    const s = (sectorStr || '').toLowerCase().trim();
    const n = (nameStr || '').toLowerCase().trim();
    
    if (s.includes('bure') || s.includes('n340') || n.includes('bure')) {
      return 1;
    }
    if (s.includes('est') || n.includes('est')) {
      return 2;
    }
    if (s.includes('2') || s.includes('ii')) {
      return 3;
    }
    if (s.includes('1') || s.includes('i')) {
      return 4;
    }
    return 5;
  };

  const sortedChantiers = [...chantiers].sort((a, b) => {
    const wA = getSectorWeight(a.sector, a.name);
    const wB = getSectorWeight(b.sector, b.name);
    
    if (wA !== wB) {
      return wA - wB;
    }
    // Secondary sort: alphabetically by name for consistency
    return a.name.localeCompare(b.name);
  });

  const filteredChantiers = sortedChantiers.filter(c => {
    // Search by name or sector
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.sector.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filter by status (ouvert/fermé/all)
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    
    // Filter by size
    const matchesSize = sizeFilter === 'all' || c.galleryType === sizeFilter;
    
    return matchesSearch && matchesStatus && matchesSize;
  });

  const imiter1Chantiers = filteredChantiers.filter(c => c.sector === 'Imiter 1');
  const imiter2Chantiers = filteredChantiers.filter(c => c.sector === 'Imiter 2');
  const imiterEstChantiers = filteredChantiers.filter(c => c.sector === 'Imiter Est' || c.sector === 'Bure Imiter Est');
  const otherChantiers = filteredChantiers.filter(c => 
    c.sector !== 'Imiter 1' && 
    c.sector !== 'Imiter 2' && 
    c.sector !== 'Imiter Est' && 
    c.sector !== 'Bure Imiter Est'
  );

  // Stats calculation for the KPI cards
  const imiterEstOnlyChantiers = sortedChantiers.filter(c => c.sector === 'Imiter Est' || c.sector === 'Bure Imiter Est');
  const imiterEstOnlyCount = imiterEstOnlyChantiers.length;
  const imiterEstOnlyActiveCount = imiterEstOnlyChantiers.filter(c => c.status === 'ouvert').length;

  const bureChantiers = sortedChantiers.filter(c => c.sector === 'Bure Imiter Est');
  const bureCount = bureChantiers.length;
  const bureActiveCount = bureChantiers.filter(c => c.status === 'ouvert').length;

  const imiter2Count = imiter2Chantiers.length;
  const imiter2ActiveCount = imiter2Chantiers.filter(c => c.status === 'ouvert').length;

  const imiter1Count = imiter1Chantiers.length;
  const imiter1ActiveCount = imiter1Chantiers.filter(c => c.status === 'ouvert').length;

  const getSectorColor = (sector: string) => {
    const s = sector.toLowerCase();
    if (s.includes('bure')) {
      return 'bg-rose-50 border-rose-200 text-rose-700';
    }
    if (s.includes('est')) {
      return 'bg-sky-50 border-sky-200 text-sky-700';
    }
    if (s.includes('2')) {
      return 'bg-amber-50 border-amber-200 text-amber-700';
    }
    return 'bg-slate-50 border-slate-205 text-slate-700';
  };

  const renderChantierGroup = (title: string, groupChantiers: Chantier[], colorTheme: string, subtitle?: string) => {
    return (
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between border-b border-gray-200 pb-2.5 gap-2.5">
          <div className="flex items-center gap-2.5">
            <div className="w-3.5 h-3.5 rounded-full" style={{ backgroundColor: colorTheme }} />
            <h4 className="text-lg font-black uppercase text-slate-800 tracking-tight">{title}</h4>
            {subtitle && (
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider hidden sm:inline">• {subtitle}</span>
            )}
          </div>
          <div className="flex items-center gap-2.5">
            {subtitle && (
              <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider sm:hidden">{subtitle}</span>
            )}
            <span className="text-[10px] bg-slate-100 text-slate-600 font-semibold px-3 py-1 rounded-full uppercase border border-slate-200/50">
              {groupChantiers.length} {groupChantiers.length > 1 ? 'Chantiers' : 'Chantier'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {groupChantiers.map(c => {
            const progress = Math.min((c.currentMeterage / c.plannedTotalMeterage) * 100, 100) || 0;
            const roundsLeft = Math.ceil((c.plannedTotalMeterage - c.currentMeterage) / 1.7);

            return (
              <div 
                key={c.id} 
                className={`bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col relative overflow-hidden ${
                  c.status === 'fermé' ? 'opacity-70 bg-gray-50/50' : ''
                }`}
              >
                {/* Image Preview Block */}
                {c.croquisUrl ? (
                  <div className="h-44 overflow-hidden bg-slate-50 border-b border-gray-100 relative">
                    <img 
                      src={c.croquisUrl} 
                      alt="Croquis" 
                      className="w-full h-full object-cover" 
                      referrerPolicy="no-referrer" 
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                  </div>
                ) : (
                  <div className="h-44 bg-slate-50/70 border-b border-gray-150 flex flex-col items-center justify-center p-4 text-center">
                    <img 
                      src={logoImg} 
                      alt="HydroMines Logo Placeholder" 
                      className="w-14 h-14 object-contain rounded-lg opacity-40 mb-2 mix-blend-multiply" 
                      referrerPolicy="no-referrer" 
                    />
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
                      Aucun Croquis Technique
                    </span>
                    <span className="text-[8.5px] text-gray-400 mt-1 max-w-[200px] leading-relaxed">
                      Si le croquis technique est prêt, veuillez modifier ou ajouter le croquis du chantier.
                    </span>
                  </div>
                )}

                {/* Main Info Body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      {/* Sector Badge with hierarchical color weighting */}
                      <div className={`px-2.5 py-1 text-[8px] font-bold uppercase rounded-lg border flex items-center h-5 gap-1 ${getSectorColor(c.sector)}`}>
                        <MapPin className="w-2.5 h-2.5 shrink-0" />
                        {c.sector}
                      </div>
                      {/* Status indicator */}
                      <span className={`text-[8px] font-bold uppercase px-2.5 py-0.5 rounded-lg border ${
                        c.status === 'ouvert' 
                          ? 'border-emerald-200 text-emerald-700 bg-emerald-50' 
                          : 'border-rose-200 text-rose-700 bg-rose-50'
                      }`}>
                        {c.status === 'ouvert' ? 'Actif' : 'Clôturé'}
                      </span>
                    </div>

                    {/* Name and size details */}
                    <div>
                      <h4 className="text-xl font-extrabold uppercase text-[#141414] tracking-tight">{c.name}</h4>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">SMI Souterrain Section</p>
                    </div>
                  </div>

                  {/* Sub Metadata Rows */}
                  <div className="grid grid-cols-2 gap-3 pb-1">
                    <div className="bg-slate-50/60 border border-gray-100/80 rounded-xl p-2.5">
                      <span className="text-[8px] font-bold uppercase text-slate-400 block tracking-wider">Taille Galerie</span>
                      <span className="text-xs font-extrabold text-slate-800">{c.galleryType === '9m2' ? '9 m²' : '12 m²'}</span>
                    </div>
                    <div className="bg-slate-50/60 border border-gray-100/80 rounded-xl p-2.5">
                      <span className="text-[8px] font-bold uppercase text-slate-400 block tracking-wider">Total Prévu</span>
                      <span className="text-xs font-extrabold text-slate-800">{c.plannedTotalMeterage}m</span>
                    </div>
                  </div>

                  {/* Progress Visualizer */}
                  <div className="space-y-1.5 border-t border-gray-100 pt-3">
                    <div className="flex justify-between items-end">
                      <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Avancement cumulé</p>
                      <p className="text-xs font-black text-[#00BFFF]">{progress.toFixed(1)}%</p>
                    </div>
                    {/* Progress fill */}
                    <div className="w-full h-2.5 bg-slate-100 border border-slate-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-slate-900 transition-all duration-500 rounded-full" 
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[9px] font-bold text-slate-400">
                      <span>Réalisé: {c.currentMeterage || '0'}m</span>
                      <span>Reste: {(c.plannedTotalMeterage - c.currentMeterage).toFixed(1)}m (~{roundsLeft > 0 ? roundsLeft : 0} volées)</span>
                    </div>
                  </div>

                  {/* Action Controls Footer */}
                  <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                    <button 
                      onClick={() => toggleStatus(c.id, c.status)} 
                      className={`flex-1 flex items-center justify-center gap-1.5 py-2 border rounded-xl text-[9px] font-bold uppercase transition-all cursor-pointer ${
                        c.status === 'ouvert' 
                          ? 'border-rose-100 text-rose-600 hover:bg-rose-600 hover:text-white hover:border-rose-600' 
                          : 'border-emerald-100 text-emerald-700 hover:bg-emerald-600 hover:text-white hover:border-emerald-600'
                      }`}
                      title={c.status === 'ouvert' ? 'Fermer le chantier' : 'Ouvrir le chantier'}
                    >
                      {c.status === 'ouvert' ? (
                        <>
                          <Lock className="w-3.5 h-3.5" /> Clôturer
                        </>
                      ) : (
                        <>
                          <Unlock className="w-3.5 h-3.5" /> Libérer
                        </>
                      )}
                    </button>
                    <button 
                      onClick={() => startEditing(c)} 
                      className="p-2 border border-slate-100 rounded-xl text-slate-500 hover:bg-slate-50 hover:text-slate-800 hover:border-slate-200 transition-all shrink-0 cursor-pointer animate-fade-in"
                      title="Modifier les détails techniques"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={() => deleteChantier(c.id)} 
                      className="p-2 border border-slate-100 rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all shrink-0 cursor-pointer"
                      title="Supprimer définitivement"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {groupChantiers.length === 0 && (
            <div className="col-span-full py-16 text-center border border-dashed border-gray-200 rounded-2xl bg-slate-50/50">
              <Layers className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <h5 className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Aucun chantier actif dans cette zone</h5>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-6 md:p-8 shadow-sm space-y-8 relative">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 shadow-xl rounded-xl border font-bold text-xs uppercase tracking-wider ${
              toast.type === 'success' 
                ? 'bg-slate-900 text-white border-emerald-500' 
                : 'bg-white text-rose-700 border-rose-200'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle className="w-4 h-4 text-emerald-450 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Unified Elegant Header Banner with Logo and Corporate Titles matching page planification */}
      <div 
        id="chantiers-header-banner" 
        className="bg-white p-6 md:p-8 border border-[#e2e8f0] rounded-[16px] w-full shadow-sm"
        style={{ boxShadow: '0 4px 20px -2px rgba(184, 134, 11, 0.04), 0 1px 3px rgba(0,0,0,0.05)' }}
      >
        <div className="flex flex-col lg:flex-row items-stretch justify-between gap-6">
          {/* Left Column: 30% larger, borderless & clean logo with responsive scaling */}
          <div className="flex-shrink-0 flex items-center justify-center animate-fade-in self-center lg:self-stretch">
            <img 
              src={logoImg} 
              alt="HydroMines Logo" 
              className="h-28 w-28 sm:h-32 sm:w-32 md:h-36 md:w-36 object-contain hover:scale-105 transition-transform duration-300 ease-out select-none" 
              referrerPolicy="no-referrer" 
            />
          </div>

          {/* Centered Column: Header Title on One Line, Subtitle, Info tags */}
          <div className="flex-1 flex flex-col justify-center items-center text-center space-y-3.5 max-w-2xl px-2">
            {/* Upper Decorative Gold Line */}
            <div className="subtle-glow-line w-full opacity-80" />
            
            {/* Premium Gold Shimmer Title - Sized precisely to cover one line */}
            <h1 className="gold-title my-1 select-none text-[15px] sm:text-lg md:text-[20px] lg:text-[22px] tracking-[0.06em] whitespace-normal sm:whitespace-nowrap leading-none">
              RÉPERTOIRE TECHNIQUE DES CHANTIERS
            </h1>
            
            {/* Lower Decorative Gold Line */}
            <div className="subtle-glow-line w-full opacity-80" />

            {/* Elegant Subtitle with precise spacing */}
            <p 
              className="uppercase tracking-[0.2em] my-1.5 block text-[9px] md:text-[10px] font-extrabold"
              style={{ color: '#64748b', letterSpacing: '0.2em' }}
            >
              Suivi d'avancement des projets • HydroMines
            </p>

            {/* Centered information/shift capsule */}
            <div className="flex flex-wrap items-center justify-center gap-3 pt-1.5">
              <div className="inline-flex items-center gap-2 bg-amber-50/80 border border-amber-200/80 px-3 py-1.5 rounded-xl shadow-xs">
                <span className="text-[10px] font-black uppercase text-amber-800 tracking-wider">
                  🚧 Ordonnancement Trié • Bure Imiter Est en Priorité Majeure Semencière
                </span>
              </div>
            </div>
          </div>

          {/* Action Triggering Row right-aligned */}
          <div className="flex-shrink-0 flex items-center justify-center lg:justify-end self-center lg:self-stretch min-h-[100px]">
            <button 
              onClick={() => {
                setFormData({
                  name: '',
                  sector: 'Bure Imiter Est',
                  galleryType: '12m2',
                  plannedTotalMeterage: 0,
                  croquisUrl: ''
                });
                setShowAdd(true);
              }}
              className="px-6 py-3.5 rounded-xl text-slate-950 font-black text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-md cursor-pointer hover:scale-[1.02] active:scale-[0.98] bg-gradient-to-r from-[#b8860b] to-[#ffd700] hover:from-[#a07409] hover:to-[#e5bf4e] border border-[#b8860b]/30"
            >
              <Plus className="w-4 h-4 text-slate-950" /> Nouveau Chantier
            </button>
          </div>
        </div>
      </div>

      {/* KPI Stats Summary Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Imiter Est */}
        <div className="bg-slate-50/40 hover:bg-slate-50/80 border border-slate-200/60 rounded-2xl p-4.5 shadow-xs flex items-center justify-between transition-all">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Imiter Est</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-slate-850">{imiterEstOnlyActiveCount}</span>
              <span className="text-xs font-bold text-slate-600">Actifs</span>
              <span className="text-[10px] text-slate-400">/ {imiterEstOnlyCount} total</span>
            </div>
            <span className="text-[9px] font-bold text-sky-600 uppercase tracking-wide block">Zone Est + Bure Inclus</span>
          </div>
          <div className="bg-sky-50 p-2.5 rounded-xl border border-sky-100/50 flex-shrink-0">
            <Target className="w-5 h-5 text-sky-500" />
          </div>
        </div>

        {/* Card 2: Bure Imiter Est */}
        <div className="bg-rose-50/30 hover:bg-rose-50/70 border border-rose-100 rounded-2xl p-4.5 shadow-xs flex items-center justify-between transition-all animate-fade-in">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-rose-500/80 uppercase tracking-widest block">Bure Imiter Est</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-rose-800">{bureActiveCount}</span>
              <span className="text-xs font-bold text-rose-500">Actifs</span>
              <span className="text-[10px] text-rose-450">/ {bureCount} total</span>
            </div>
            <span className="text-[9.5px] font-black text-rose-600 uppercase tracking-wide block">2 engins actifs</span>
          </div>
          <div className="bg-rose-50 p-2.5 rounded-xl border border-rose-100/70 flex-shrink-0">
            <Activity className="w-5 h-5 text-rose-500" />
          </div>
        </div>

        {/* Card 3: Imiter 2 */}
        <div className="bg-amber-50/20 hover:bg-amber-50/50 border border-amber-100 rounded-2xl p-4.5 shadow-xs flex items-center justify-between transition-all">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-amber-500 uppercase tracking-widest block">Imiter 2</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-amber-800">{imiter2ActiveCount}</span>
              <span className="text-xs font-bold text-amber-650">Actifs</span>
              <span className="text-[10px] text-amber-450">/ {imiter2Count} total</span>
            </div>
            <span className="text-[9px] font-bold text-amber-600 uppercase tracking-wide block">Zone Médiane II</span>
          </div>
          <div className="bg-amber-50 p-2.5 rounded-xl border border-amber-100/70 flex-shrink-0">
            <BarChart className="w-5 h-5 text-amber-500" />
          </div>
        </div>

        {/* Card 4: Imiter 1 */}
        <div className="bg-slate-50/65 hover:bg-slate-100/40 border border-slate-200/70 rounded-2xl p-4.5 shadow-xs flex items-center justify-between transition-all">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest block">Imiter 1</span>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-slate-800">{imiter1ActiveCount}</span>
              <span className="text-xs font-bold text-slate-650">Actifs</span>
              <span className="text-[10px] text-slate-450">/ {imiter1Count} total</span>
            </div>
            <span className="text-[9px] font-bold text-slate-600 uppercase tracking-wide block">Zone Supérieure I</span>
          </div>
          <div className="bg-slate-100 p-2.5 rounded-xl border border-slate-200/50 flex-shrink-0">
            <Layers className="w-5 h-5 text-slate-500" />
          </div>
        </div>
      </div>

      {sortedChantiers.length === 0 ? (
        <div className="p-12 text-center text-[11px] font-black uppercase text-slate-400 tracking-widest">
          Aucun chantier enregistré pour ce site
        </div>
      ) : (
        <div className="space-y-10">
          {/* Search & Filtration Bar */}
          <div className="bg-slate-50 border border-gray-150/80 rounded-2xl p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:w-80">
              <Search className="w-4 h-4 text-slate-405 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input 
                type="text"
                placeholder="Rechercher par nom ou secteur..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-gray-200 focus:border-[#00BFFF] focus:ring-1 focus:ring-[#00BFFF]/30 rounded-xl pl-10 pr-4 py-2.5 text-xs font-semibold outline-none transition-all placeholder:text-slate-400 text-slate-700"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              {/* Status Filter */}
              <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Statut:</span>
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value as any)}
                  className="text-xs font-bold text-slate-700 outline-none bg-transparent cursor-pointer"
                >
                  <option value="all">Tous</option>
                  <option value="ouvert">Actifs</option>
                  <option value="fermé">Clôturés</option>
                </select>
              </div>

              {/* Size Filter */}
              <div className="flex items-center gap-1.5 bg-white border border-gray-200 rounded-xl px-3 py-2 shadow-2xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Gabarit:</span>
                <select
                  value={sizeFilter}
                  onChange={e => setSizeFilter(e.target.value as any)}
                  className="text-xs font-bold text-slate-700 outline-none bg-transparent cursor-pointer"
                >
                  <option value="all">SMI Standard</option>
                  <option value="9m2">9 m²</option>
                  <option value="12m2">12 m²</option>
                </select>
              </div>

              {(searchQuery || statusFilter !== 'all' || sizeFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setStatusFilter('all');
                    setSizeFilter('all');
                  }}
                  className="text-[10px] text-rose-500 hover:text-rose-700 font-extrabold uppercase tracking-wider py-2 px-3 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  Réinitialiser
                </button>
              )}

              <div className="ml-auto text-[10px] text-slate-400 font-bold uppercase tracking-wider bg-slate-100 hover:bg-slate-200 px-3 py-2 rounded-xl transition-all">
                {filteredChantiers.length} trouvé{filteredChantiers.length > 1 ? 's' : ''}
              </div>
            </div>
          </div>

          {/* List Content */}
          {filteredChantiers.length === 0 ? (
            <div className="py-16 text-center border border-dashed border-gray-200 rounded-2xl bg-slate-50/50">
              <Search className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <h5 className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">Aucun chantier ne correspond aux filtres appliqués</h5>
              <button 
                onClick={() => {
                  setSearchQuery('');
                  setStatusFilter('all');
                  setSizeFilter('all');
                }}
                className="text-xs text-[#00BFFF] hover:underline font-bold mt-2 cursor-pointer uppercase"
              >
                Effacer les filtres
              </button>
            </div>
          ) : (
            <div className="space-y-12">
              {/* Section 1: Imiter Est */}
              {renderChantierGroup("Imiter Est", imiterEstChantiers, "#00BFFF", "Inclus : Bure Imiter Est")}
              
              {/* Section 2: Imiter 2 */}
              {renderChantierGroup("Imiter 2", imiter2Chantiers, "#F59E0B")}

              {/* Section 3: Imiter 1 */}
              {renderChantierGroup("Imiter 1", imiter1Chantiers, "#4B5563")}

              {/* Section 4: Other */}
              {otherChantiers.length > 0 && renderChantierGroup("Autres Zones", otherChantiers, "#141414")}
            </div>
          )}
        </div>
      )}

      {/* Modern High-contrast Custom Addition Form Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white w-full max-w-lg rounded-2xl border border-gray-200 p-8 shadow-2xl relative"
          >
            {/* Close modal button */}
            <button 
              onClick={() => {
                setShowAdd(false);
                setFormData({
                  name: '',
                  sector: 'Bure Imiter Est',
                  galleryType: '12m2',
                  plannedTotalMeterage: 0,
                  croquisUrl: ''
                });
              }} 
              className="absolute right-6 top-6 p-2 hover:bg-slate-50 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>

            {/* Title block */}
            <div className="mb-6 text-center sm:text-left">
              <h3 className="text-2xl font-black tracking-tight uppercase text-slate-900">Ouverture d'un Chantier</h3>
              <p className="text-[10px] font-bold uppercase text-[#00BFFF] tracking-widest mt-0.5">Cahier d'enregistrement technique SMI</p>
            </div>

            {/* Input Form structure */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-4">
                {/* Chantier Name */}
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">Identifiant / Nom du Chantier (ex: CH-101)</label>
                  <input 
                    required 
                    type="text"
                    maxLength={20}
                    placeholder="Saisir identifiant unique..." 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    className="w-full bg-slate-50 hover:bg-slate-100/50 border border-gray-200 focus:border-[#00BFFF] focus:bg-white rounded-xl px-4 py-3 text-sm font-extrabold uppercase outline-none transition-all" 
                  />
                </div>
                
                {/* Sector and gallery config */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">Secteur Géo-SMI</label>
                    <select 
                      value={formData.sector} 
                      onChange={e => setFormData({...formData, sector: e.target.value})} 
                      className="w-full bg-slate-50 hover:bg-slate-100/50 border border-gray-200 focus:border-[#00BFFF] rounded-xl px-3 py-3 text-xs font-extrabold uppercase outline-none cursor-pointer transition-all"
                    >
                      <option value="Bure Imiter Est">Bure Imiter Est</option>
                      <option value="Imiter Est">Imiter Est</option>
                      <option value="Imiter 2">Imiter 2</option>
                      <option value="Imiter 1">Imiter 1</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">Type Volume m²</label>
                    <select 
                      value={formData.galleryType} 
                      onChange={e => setFormData({...formData, galleryType: e.target.value as any})} 
                      className="w-full bg-slate-50 hover:bg-slate-100/50 border border-gray-200 focus:border-[#00BFFF] rounded-xl px-3 py-3 text-xs font-extrabold uppercase outline-none cursor-pointer transition-all"
                    >
                      <option value="9m2">9 m²</option>
                      <option value="12m2">12 m²</option>
                    </select>
                  </div>
                </div>

                {/* Total Avancement Objective */}
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">Objectif de Métrage Planifié (m)</label>
                  <input 
                    required 
                    type="number" 
                    min="1"
                    placeholder="Entrez la cible de creusement..." 
                    value={formData.plannedTotalMeterage === 0 ? '' : formData.plannedTotalMeterage} 
                    onChange={e => setFormData({...formData, plannedTotalMeterage: Number(e.target.value)})} 
                    className="w-full bg-slate-50 hover:bg-slate-100/50 border border-gray-200 focus:border-[#00BFFF] focus:bg-white rounded-xl px-4 py-3 text-sm font-extrabold outline-none transition-all" 
                  />
                </div>

                {/* Optional Front Profile Image upload with rich feedback */}
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">Croquis Technique de Coupe (Optionnel)</label>
                  <div className="relative border border-dashed border-gray-250 p-6 text-center hover:border-[#00BFFF] rounded-xl transition-all cursor-pointer bg-slate-50/50 hover:bg-slate-100/40 group">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleImageUpload} 
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
                    />
                    {formData.croquisUrl ? (
                      <div className="flex items-center justify-center gap-3">
                        <img 
                          src={formData.croquisUrl} 
                          alt="Preview" 
                          className="w-12 h-12 object-cover border border-slate-200 rounded-lg shadow-xs" 
                        />
                        <div className="text-left">
                          <span className="text-[9px] font-bold uppercase text-[#00BFFF] block">Image Chargée avec succès</span>
                          <span className="text-[8px] text-gray-400 block font-semibold">Cliquez pour modifier</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1.5">
                        <Upload className="w-6 h-6 text-slate-300 group-hover:text-[#00BFFF] transition-colors" />
                        <span className="text-[9px] font-bold uppercase text-slate-400">Cliquez pour téléverser un fichier</span>
                        <span className="text-[8px] text-gray-400 font-semibold uppercase">Format PNG, JPG • Max 1.5M</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action triggering Button */}
              <button 
                type="submit" 
                disabled={loading} 
                className="w-full bg-slate-900 hover:bg-[#00BFFF] text-white py-4 rounded-xl font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center text-xs cursor-pointer"
              >
                {loading ? 'OUVERTURE EN COURS...' : 'ENREGISTRER TECHNIQUEMENT'}
              </button>
            </form>
          </motion.div>
        </div>
      )}

      {/* Modern High-contrast Custom Modification Form Modal */}
      {editingChantier && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white w-full max-w-lg rounded-2xl border border-gray-200 p-8 shadow-2xl relative"
          >
            {/* Close modal button */}
            <button 
              onClick={() => {
                setEditingChantier(null);
              }} 
              className="absolute right-6 top-6 p-2 hover:bg-slate-50 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-5 h-5 text-slate-500" />
            </button>

            {/* Title block */}
            <div className="mb-6 text-center sm:text-left">
              <h3 className="text-2xl font-black tracking-tight uppercase text-slate-900 flex items-center gap-2">
                <Edit2 className="w-5 h-5 text-[#00BFFF]" /> Modification du Chantier
              </h3>
              <p className="text-[10px] font-bold uppercase text-[#00BFFF] tracking-widest mt-0.5">Administration &amp; Ajustements Techniques SMI</p>
            </div>

            {/* Input Form structure */}
            <form onSubmit={handleEditSubmit} className="space-y-5">
              <div className="space-y-4">
                {/* Chantier Name */}
                <div>
                  <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">Identifiant / Nom du Chantier</label>
                  <input 
                    required 
                    type="text"
                    maxLength={20}
                    placeholder="Saisir identifiant unique..." 
                    value={editFormData.name} 
                    onChange={e => setEditFormData({...editFormData, name: e.target.value})} 
                    className="w-full bg-slate-50 hover:bg-slate-100/50 border border-gray-200 focus:border-[#00BFFF] focus:bg-white rounded-xl px-4 py-3 text-sm font-extrabold uppercase outline-none transition-all" 
                  />
                </div>
                
                {/* Sector and gallery config */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">Secteur Géo-SMI</label>
                    <select 
                      value={editFormData.sector} 
                      onChange={e => setEditFormData({...editFormData, sector: e.target.value})} 
                      className="w-full bg-slate-50 hover:bg-slate-100/50 border border-gray-200 focus:border-[#00BFFF] rounded-xl px-3 py-3 text-xs font-extrabold uppercase outline-none cursor-pointer transition-all"
                    >
                      <option value="Bure Imiter Est">Bure Imiter Est</option>
                      <option value="Imiter Est">Imiter Est</option>
                      <option value="Imiter 2">Imiter 2</option>
                      <option value="Imiter 1">Imiter 1</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">Type Volume m²</label>
                    <select 
                      value={editFormData.galleryType} 
                      onChange={e => setEditFormData({...editFormData, galleryType: e.target.value as any})} 
                      className="w-full bg-slate-50 hover:bg-slate-100/50 border border-gray-200 focus:border-[#00BFFF] rounded-xl px-3 py-3 text-xs font-extrabold uppercase outline-none cursor-pointer transition-all"
                    >
                      <option value="9m2">9 m²</option>
                      <option value="12m2">12 m²</option>
                    </select>
                  </div>
                </div>

                {/* Meterage Adjustment Configuration Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">Objectif Planifié (m)</label>
                    <input 
                      required 
                      type="number" 
                      min="1"
                      placeholder="Cible..." 
                      value={editFormData.plannedTotalMeterage === 0 ? '' : editFormData.plannedTotalMeterage} 
                      onChange={e => setEditFormData({...editFormData, plannedTotalMeterage: Number(e.target.value)})} 
                      className="w-full bg-slate-50 hover:bg-slate-100/50 border border-gray-200 focus:border-[#00BFFF] focus:bg-white rounded-xl px-4 py-3 text-sm font-extrabold outline-none transition-all" 
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mb-1.5 block">Métrage Réalisé Cumulé (m)</label>
                    <input 
                      required 
                      type="number" 
                      min="0"
                      placeholder="Cumul..." 
                      value={editFormData.currentMeterage} 
                      onChange={e => setEditFormData({...editFormData, currentMeterage: Number(e.target.value)})} 
                      className="w-full bg-emerald-50/50 hover:bg-emerald-55 border border-emerald-200 focus:border-emerald-500 focus:bg-white rounded-xl px-4 py-3 text-sm font-extrabold outline-none transition-all text-emerald-800" 
                    />
                  </div>
                </div>

                {/* Optional Front Profile Image upload with rich feedback */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-[9px] font-bold uppercase tracking-wider text-slate-400 block">Croquis Technique de Coupe</label>
                    {editFormData.croquisUrl && (
                      <button
                        type="button"
                        onClick={() => setEditFormData(prev => ({ ...prev, croquisUrl: '' }))}
                        className="text-[8px] font-extrabold text-rose-500 uppercase hover:underline"
                      >
                        Retirer le croquis
                      </button>
                    )}
                  </div>
                  <div className="relative border border-dashed border-gray-200 p-5 text-center hover:border-[#00BFFF] rounded-xl transition-all cursor-pointer bg-slate-50/50 hover:bg-slate-100/40 group">
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleEditImageUpload} 
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full" 
                    />
                    {editFormData.croquisUrl ? (
                      <div className="flex items-center justify-center gap-3">
                        <img 
                          src={editFormData.croquisUrl} 
                          alt="Preview" 
                          className="w-12 h-12 object-cover border border-slate-200 rounded-lg shadow-xs" 
                        />
                        <div className="text-left">
                          <span className="text-[9px] font-bold uppercase text-emerald-600 block">Croquis Technique Chargé</span>
                          <span className="text-[8px] text-gray-400 block font-semibold">Cliquez pour modifier le fichier</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <Upload className="w-5 h-5 text-slate-300 group-hover:text-[#00BFFF] transition-colors" />
                        <span className="text-[9px] font-bold uppercase text-slate-400">Cliquez pour importer un croquis</span>
                        <span className="text-[8px] text-slate-400 font-semibold uppercase">Format PNG, JPG • Max 1.5M</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action triggering Button */}
              <div className="flex gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setEditingChantier(null)}
                  className="w-1/3 border border-slate-250 hover:bg-slate-50 hover:border-slate-350 text-slate-650 py-3 rounded-xl font-bold uppercase tracking-wider transition-all text-[10px] cursor-pointer"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  disabled={loading} 
                  className="flex-1 bg-slate-900 hover:bg-[#00BFFF] text-white py-3 rounded-xl font-bold uppercase tracking-wider shadow-md hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center text-[10px] cursor-pointer whitespace-nowrap"
                >
                  {loading ? 'MODIFICATION...' : 'METTRE À JOUR LE CHANTIER'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
