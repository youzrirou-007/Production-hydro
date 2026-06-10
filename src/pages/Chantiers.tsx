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
  CheckCircle 
} from 'lucide-react';
import { collection, query, onSnapshot, addDoc, deleteDoc, doc, updateDoc, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';

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

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    // Auto dismiss after 4 seconds
    const timer = setTimeout(() => {
      setToast(null);
    }, 4000);
    return () => clearTimeout(timer);
  };

  useEffect(() => {
    const q = query(collection(db, 'chantiers'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      setChantiers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Chantier)));
    }, (error) => {
      console.error("Firestore loading error:", error);
      showToast("Erreur lors de la synchronisation des données depuis le cloud.", "error");
    });
    return () => unsub();
  }, []);

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
        siteId: 'SMI',
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

  const getSectorColor = (sector: string) => {
    const s = sector.toLowerCase();
    if (s.includes('bure')) {
      return 'bg-[#8B0000] text-white border-[#8B0000]';
    }
    if (s.includes('est')) {
      return 'bg-[#00BFFF] text-white border-[#00BFFF]';
    }
    if (s.includes('2')) {
      return 'bg-amber-500 text-black border-amber-500';
    }
    return 'bg-zinc-600 text-white border-zinc-600';
  };

  return (
    <div className="space-y-6 relative">
      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-6 py-4 shadow-2xl border-2 font-black text-xs uppercase tracking-wider ${
              toast.type === 'success' 
                ? 'bg-[#141414] text-white border-[#00BFFF]' 
                : 'bg-white text-[#8B0000] border-[#8B0000]'
            }`}
          >
            {toast.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-[#00BFFF] shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 text-[#8B0000] shrink-0" />
            )}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Header / Command Row */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end border-b-4 border-[#141414] pb-4 gap-4">
        <div>
          <h3 className="text-4xl font-black tracking-tighter text-[#141414] uppercase italic">Répertoire Technique des Chantiers</h3>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-[#00BFFF]">
            Ordonnancement Trié • Bure Imiter Est en Priorité Majeure Semencière
          </p>
        </div>
        <button 
          onClick={() => {
            // Fresh form reset before showing
            setFormData({
              name: '',
              sector: 'Bure Imiter Est',
              galleryType: '12m2',
              plannedTotalMeterage: 0,
              croquisUrl: ''
            });
            setShowAdd(true);
          }}
          className="bg-[#141414] text-white px-8 py-4 rounded-none font-black text-xs uppercase tracking-widest flex items-center gap-3 hover:bg-[#00BFFF] transition-all shadow-[6px_6px_0px_#00BFFF] active:translate-x-1 active:translate-y-1 active:shadow-none"
        >
          <Plus className="w-4 h-4" /> Nouveau Chantier
        </button>
      </div>

      {/* Grid displays Open and Closed chantiers perfectly in sorted order */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedChantiers.map(c => {
          const progress = Math.min((c.currentMeterage / c.plannedTotalMeterage) * 100, 100) || 0;
          const roundsLeft = Math.ceil((c.plannedTotalMeterage - c.currentMeterage) / 1.7);

          return (
            <div 
              key={c.id} 
              className={`bg-white border-4 border-[#141414] shadow-[8px_8px_0px_rgba(20,20,20,0.06)] flex flex-col hover:shadow-[12px_12px_0px_rgba(20,20,20,0.1)] transition-all relative ${
                c.status === 'fermé' ? 'opacity-70 grayscale bg-gray-50' : ''
              }`}
            >
              {/* Image Preview Block */}
              {c.croquisUrl ? (
                <div className="h-44 overflow-hidden bg-zinc-100 border-b-4 border-[#141414] relative">
                  <img 
                    src={c.croquisUrl} 
                    alt="Croquis" 
                    className="w-full h-full object-cover" 
                    referrerPolicy="no-referrer" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
                </div>
              ) : (
                <div className="h-44 bg-[#F5F5F0] flex flex-col items-center justify-center border-b-4 border-[#141414]">
                  <ImageIcon className="w-10 h-10 text-[#141414]/15" />
                  <p className="text-[9px] font-black uppercase text-[#141414]/25 mt-2 tracking-widest">Aucun Croquis Technique</p>
                </div>
              )}

              {/* Main Info Body */}
              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    {/* Sector Badge with hierarchical color weighting */}
                    <div className={`px-2.5 py-1 text-[8px] font-black uppercase border-1.5 ${getSectorColor(c.sector)}`}>
                      <MapPin className="w-2.5 h-2.5 inline mr-1" />
                      {c.sector}
                    </div>
                    {/* Status indicator */}
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 border ${
                      c.status === 'ouvert' 
                        ? 'border-green-600 text-green-700 bg-green-50' 
                        : 'border-red-500 text-red-600 bg-red-50'
                    }`}>
                      {c.status === 'ouvert' ? 'Actif' : 'Verrouillé'}
                    </span>
                  </div>

                  {/* Name and size details */}
                  <div>
                    <h4 className="text-xl font-black uppercase text-[#141414] tracking-tight">{c.name}</h4>
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">SMI Souterrain Section</p>
                  </div>
                </div>

                {/* Sub Metadata Rows */}
                <div className="grid grid-cols-2 gap-3 pb-2">
                  <div className="bg-[#141414]/5 p-2.5">
                    <span className="text-[8px] font-black uppercase text-[#141414]/40 block">Taille Galerie</span>
                    <span className="text-xs font-black text-[#141414]">{c.galleryType === '9m2' ? '9 m²' : '12 m²'}</span>
                  </div>
                  <div className="bg-[#141414]/5 p-2.5">
                    <span className="text-[8px] font-black uppercase text-[#141414]/40 block">Total Prévu</span>
                    <span className="text-xs font-black text-[#141414]">{c.plannedTotalMeterage}m</span>
                  </div>
                </div>

                {/* Progress Visualizer */}
                <div className="space-y-1.5 border-t border-[#141414]/5 pt-3">
                  <div className="flex justify-between items-end">
                    <p className="text-[9px] font-black uppercase tracking-wider text-[#141414]/60">Avancement cumulé</p>
                    <p className="text-xs font-black text-[#00BFFF]">{progress.toFixed(1)}%</p>
                  </div>
                  {/* Progress fill */}
                  <div className="w-full h-3 bg-gray-100 border-2 border-[#141414]">
                    <div 
                      className="h-full bg-[#141414] transition-all duration-500" 
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[9px] font-bold text-gray-400 italic">
                    <span>Réalisé: {c.currentMeterage || '0'}m</span>
                    <span>Reste: {(c.plannedTotalMeterage - c.currentMeterage).toFixed(1)}m (~{roundsLeft > 0 ? roundsLeft : 0} volées)</span>
                  </div>
                </div>

                {/* Action Controls Footer */}
                <div className="flex items-center gap-2 pt-3 border-t border-[#141414]/5">
                  <button 
                    onClick={() => toggleStatus(c.id, c.status)} 
                    className={`flex-1 flex items-center justify-center gap-2 py-2 border-2 text-[9px] font-black uppercase transition-all ${
                      c.status === 'ouvert' 
                        ? 'border-red-600 text-red-600 hover:bg-red-600 hover:text-white' 
                        : 'border-green-600 text-green-700 hover:bg-green-600 hover:text-white'
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
                    onClick={() => deleteChantier(c.id)} 
                    className="p-2 border-2 border-gray-200 text-gray-400 hover:bg-red-600 hover:text-white hover:border-red-600 transition-all shrink-0"
                    title="Supprimer définitivement"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {sortedChantiers.length === 0 && (
          <div className="col-span-full py-24 text-center border-4 border-dashed border-[#141414]/10 bg-white">
            <Layers className="w-12 h-12 text-[#141414]/15 mx-auto mb-3" />
            <h4 className="text-lg font-black uppercase text-[#141414]/40 tracking-tight">Aucun Chantier Enregistré</h4>
            <p className="text-xs text-gray-400 font-bold mt-1 uppercase">Cliquez sur "Nouveau Chantier" pour configurer la production souterraine.</p>
          </div>
        )}
      </div>

      {/* Modern High-contrast Custom Addition Form Modal */}
      {showAdd && (
        <div className="fixed inset-0 bg-[#141414]/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white w-full max-w-lg border-t-8 border-[#00BFFF] p-10 shadow-2xl relative"
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
              className="absolute right-6 top-6 p-2 hover:bg-black/5 rounded-full transition-colors"
            >
              <X className="w-5 h-5"/>
            </button>

            {/* Title block */}
            <div className="mb-8 text-center sm:text-left">
              <h3 className="text-3xl font-black tracking-tighter uppercase text-[#141414] italic">Ouverture d'un Chantier</h3>
              <p className="text-[10px] font-black uppercase text-[#00BFFF] tracking-widest mt-1">Cahier d'enregistrement technique SMI</p>
            </div>

            {/* Input Form structure */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-4">
                {/* Chantier Name */}
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-[#141414]/50 mb-1.5 block">Identifiant / Nom du Chantier (ex: CH-101)</label>
                  <input 
                    required 
                    type="text"
                    maxLength={20}
                    placeholder="Saisir identifiant unique..." 
                    value={formData.name} 
                    onChange={e => setFormData({...formData, name: e.target.value})} 
                    className="w-full bg-[#F5F5F0] border-2 border-transparent focus:border-[#141414] px-4 py-3.5 text-sm font-black uppercase outline-none transition-colors" 
                  />
                </div>
                
                {/* Sector and gallery config */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-[#141414]/50 mb-1.5 block">Secteur Géo-SMI</label>
                    <select 
                      value={formData.sector} 
                      onChange={e => setFormData({...formData, sector: e.target.value})} 
                      className="w-full bg-[#F5F5F0] border-2 border-transparent focus:border-[#141414] px-3 py-3.5 text-xs font-black uppercase outline-none cursor-pointer"
                    >
                      <option value="Bure Imiter Est">Bure Imiter Est</option>
                      <option value="Imiter Est">Imiter Est</option>
                      <option value="Imiter 2">Imiter 2</option>
                      <option value="Imiter 1">Imiter 1</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase tracking-widest text-[#141414]/50 mb-1.5 block">Type Volume m²</label>
                    <select 
                      value={formData.galleryType} 
                      onChange={e => setFormData({...formData, galleryType: e.target.value as any})} 
                      className="w-full bg-[#F5F5F0] border-2 border-transparent focus:border-[#141414] px-3 py-3.5 text-xs font-black uppercase outline-none cursor-pointer"
                    >
                      <option value="9m2">9 m²</option>
                      <option value="12m2">12 m²</option>
                    </select>
                  </div>
                </div>

                {/* Total Avancement Objective */}
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-[#141414]/50 mb-1.5 block">Objectif de Métrage Planifié (m)</label>
                  <input 
                    required 
                    type="number" 
                    min="1"
                    placeholder="Entrez la cible de creusement..." 
                    value={formData.plannedTotalMeterage === 0 ? '' : formData.plannedTotalMeterage} 
                    onChange={e => setFormData({...formData, plannedTotalMeterage: Number(e.target.value)})} 
                    className="w-full bg-[#F5F5F0] border-2 border-transparent focus:border-[#141414] px-4 py-3.5 text-sm font-black outline-none transition-colors" 
                  />
                </div>

                {/* Optional Front Profile Image upload with rich feedback */}
                <div>
                  <label className="text-[9px] font-black uppercase tracking-widest text-[#141414]/50 mb-1.5 block">Croquis Technique de Coupe (Optionnel)</label>
                  <div className="relative border-2 border-dashed border-[#141414]/20 p-6 text-center hover:border-[#00BFFF] transition-all cursor-pointer bg-[#F5F5F0]/50 hover:bg-[#F5F5F0] group">
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
                          className="w-12 h-12 object-cover border-2 border-black" 
                        />
                        <div className="text-left">
                          <span className="text-[9px] font-black uppercase text-[#00BFFF] block">Image Chargée avec succès</span>
                          <span className="text-[8px] text-gray-400 block font-semibold italic">Cliquez pour modifier</span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-1.5">
                        <Upload className="w-6 h-6 text-[#141414]/30 group-hover:text-[#00BFFF] transition-colors" />
                        <span className="text-[9px] font-black uppercase text-[#141414]/30">Cliquez pour téléverser un fichier</span>
                        <span className="text-[8px] text-gray-400 font-semibold uppercase italic">Format PNG, JPG • Max 1.5M</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Action triggering */}
              <button 
                type="submit" 
                disabled={loading} 
                className="w-full bg-[#141414] text-white py-5 font-black uppercase tracking-[0.2em] shadow-[6px_6px_0px_#00BFFF] hover:bg-[#00BFFF] hover:text-white hover:shadow-none transition-all disabled:opacity-50 flex items-center justify-center text-xs"
              >
                {loading ? 'OUVERTURE EN COURS...' : 'ENREGISTRER TECHNIQUEMENT'}
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};
