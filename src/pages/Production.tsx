import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Plus, Check, Search, Filter, MoreVertical, Calendar, Hammer, MapPin, Fuel, Clock, MessageSquare, ShieldCheck, X, HardHat, Ruler, Layers } from 'lucide-react';
import { collection, query, onSnapshot, addDoc, updateDoc, doc, serverTimestamp, arrayUnion, orderBy, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';

const SITES = ['SMI', 'OUMEJRANE', 'KOUDIA', 'BOU-AZZER', 'OUANSIMI'];

// specific data for SMI as requested by the manager
const SMI_CONFIG = {
  sectors: [
    { id: 'imiter_1', label: 'Imiter 1', manager: 'OUISSADINE ABDESSALAM' },
    { id: 'imiter_2', label: 'Imiter 2', manager: 'BEN AMAR MOHAMED' },
    { id: 'imiter_est', label: 'Imiter Est', manager: 'SADIK SAID' },
  ],
  chantiers: [
    { id: 'c1344_i1', name: 'ACCES 1344 IMITER 1', sector: 'imiter_1', gallery: '12m2' },
    { id: 'c640_ie', name: 'ACCES 640 IMITER EST', sector: 'imiter_est', gallery: '12m2' },
    { id: 'b400_ie', name: 'BASSIN 400 IMITER EST', sector: 'imiter_est', gallery: '9m2' },
  ],
  equipment: {
    drill: 'Montabert T23',
    bars: [1.8, 2.4]
  }
};

export const Production: React.FC = () => {
  const { user, profile } = useAuth();
  const [showAdd, setShowAdd] = useState(false);
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    siteId: 'SMI',
    sector: '',
    chantierId: '',
    team: '',
    drillModel: 'Montabert T23',
    barLength: 1.8,
    gallerySize: 12,
    meterage: 0,
    rounds: 0,
    fuelConsumption: 0,
    remarks: ''
  });

  useEffect(() => {
    const q = query(collection(db, 'production'), orderBy('timestamp', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      setData(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Find chantier name and sector manager for validation/display
      const chantierObj = SMI_CONFIG.chantiers.find(c => c.id === formData.chantierId);
      const sectorObj = SMI_CONFIG.sectors.find(s => s.id === formData.sector);

      await addDoc(collection(db, 'production'), {
        ...formData,
        chantierName: chantierObj?.name || formData.chantierId,
        sectorManager: sectorObj?.manager || 'Non assigné',
        date: format(new Date(), 'yyyy-MM-dd'),
        operatorId: user?.uid,
        status: 'pending_validation',
        validatedBy: [],
        timestamp: new Date().toISOString()
      });
      setShowAdd(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const validateRecord = async (recordId: string, currentValidatedBy: string[] = []) => {
    if (!user) return;
    try {
      await updateDoc(doc(db, 'production', recordId), {
        validatedBy: arrayUnion(user.uid),
        status: (currentValidatedBy?.length || 0) >= 2 ? 'validated' : 'pending_validation'
      });
    } catch (err) {
      console.error(err);
    }
  };

  const filteredChantiers = SMI_CONFIG.chantiers.filter(c => c.sector === formData.sector);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end border-b-4 border-[#141414] pb-4">
        <div>
          <h3 className="text-5xl font-black tracking-tighter text-[#141414] uppercase">Flux Production</h3>
          <p className="text-sm font-black uppercase tracking-[0.3em] text-[#00BFFF]">Centre de Commandement Stratégique</p>
        </div>
        <button 
          onClick={() => setShowAdd(true)}
          className="bg-[#141414] text-white px-10 py-5 rounded-none font-black text-xs uppercase tracking-widest flex items-center gap-4 hover:bg-[#00BFFF] transition-all shadow-[8px_8px_0px_#00BFFF] active:translate-x-1 active:translate-y-1 active:shadow-none"
        >
          <Plus className="w-5 h-5" /> Nouvelle Saisie SMI
        </button>
      </div>

      {/* Grid of Stats specialized for SMI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-1">
        <div className="bg-[#141414] p-6 text-white border-l-8 border-[#00BFFF]">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Métrage Total SMI</p>
            <h4 className="text-3xl font-black tracking-tighter">1,244.5 m</h4>
        </div>
        <div className="bg-white p-6 border-l-8 border-[#8B0000]">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#141414]/40 mb-2">Objectif Hebdo</p>
            <h4 className="text-3xl font-black tracking-tighter">85%</h4>
        </div>
        <div className="bg-[#F5F5F0] p-6 border-l-8 border-gray-400">
            <p className="text-[10px] font-black uppercase tracking-widest text-[#141414]/40 mb-2">Rendement T23</p>
            <h4 className="text-3xl font-black tracking-tighter">1.82 m/v</h4>
        </div>
      </div>

      {/* Table Section */}
      <div className="bg-white border-2 border-[#141414] shadow-[12px_12px_0px_rgba(20,20,20,0.05)]">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#141414] text-white">
                {['Date', 'Secteur', 'Chantier', 'Secteur Manager', 'Métrage', 'Equipement', 'Status', ''].map(h => (
                  <th key={h} className="px-6 py-5 text-[10px] font-black uppercase tracking-[0.2em]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y-2 divide-[#141414]/5">
              {data.map((record) => (
                <tr key={record.id} className="hover:bg-[#F5F5F0] transition-colors group">
                  <td className="px-6 py-6 text-xs font-black">{record.date}</td>
                  <td className="px-6 py-6">
                    <span className="text-[10px] font-black uppercase bg-[#141414]/5 px-2 py-1 border border-[#141414]/10">
                      {SMI_CONFIG.sectors.find(s => s.id === record.sector)?.label || record.sector}
                    </span>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex flex-col">
                      <span className="text-sm font-black text-[#141414] uppercase leading-none">{record.chantierName}</span>
                      <span className="text-[10px] font-bold text-[#141414]/40 mt-1">{record.gallerySize}m²</span>
                    </div>
                  </td>
                  <td className="px-6 py-6 text-[10px] font-black uppercase text-[#8B0000]">{record.sectorManager}</td>
                  <td className="px-6 py-6">
                    <div className="flex items-baseline gap-1">
                      <span className="text-lg font-black text-[#141414]">{record.meterage}m</span>
                      <span className="text-[10px] font-bold text-[#141414]/30">/ {record.rounds} v.</span>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                     <div className="flex flex-col">
                      <span className="text-[10px] font-black uppercase text-[#141414]">{record.drillModel}</span>
                      <span className="text-[10px] font-bold text-[#00BFFF]">Barre {record.barLength}m</span>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className={cn(
                      "inline-flex items-center gap-2 px-3 py-1.5 border-2",
                      record.status === 'validated' ? 'border-green-600 text-green-700' : 'border-[#8B0000] text-[#8B0000]'
                    )}>
                      {record.status === 'validated' ? <ShieldCheck className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                      <span className="text-[10px] font-black uppercase tracking-wider">
                        {record.status === 'validated' ? 'VALIDÉ' : 'EN ATTENTE'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-6 text-right">
                    {record.status !== 'validated' && (
                      <button 
                        onClick={() => validateRecord(record.id, record.validatedBy)}
                        className="p-2 hover:bg-[#141414] hover:text-white border-2 border-transparent transition-all"
                        disabled={record.validatedBy?.includes(user?.uid)}
                      >
                         <Check className={cn("w-5 h-5", record.validatedBy?.includes(user?.uid) && "opacity-20")} />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal specialized for SMI */}
      {showAdd && (
        <div className="fixed inset-0 bg-[#141414]/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <motion.div 
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-white w-full max-w-4xl rounded-none border-t-[12px] border-[#00BFFF] p-12 shadow-2xl relative"
          >
            <button onClick={() => setShowAdd(false)} className="absolute right-8 top-8 p-3 hover:bg-black/5 rounded-full transition-colors">
              <X className="w-6 h-6"/>
            </button>
            
            <div className="mb-10">
              <h3 className="text-4xl font-black tracking-tighter italic uppercase leading-none">
                <span className="text-[#00BFFF]">Saisie</span> <span className="text-[#8B0000]">Terrain SMI</span>
              </h3>
              <p className="text-xs font-black uppercase tracking-[0.3em] text-[#141414]/30 mt-2">Protocole de production industrielle</p>
            </div>

            <form onSubmit={handleSubmit} className="grid grid-cols-3 gap-10">
              {/* Column 1: Localization */}
              <div className="space-y-6">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-[#00BFFF] border-b border-[#00BFFF] pb-2">Localisation</h4>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#141414]/40 mb-2 block">Secteur</label>
                  <select 
                    value={formData.sector}
                    onChange={e => setFormData({...formData, sector: e.target.value, chantierId: ''})}
                    className="w-full bg-[#F5F5F0] border-2 border-transparent focus:border-[#141414] px-4 py-4 text-sm font-black uppercase outline-none transition-all"
                    required
                  >
                    <option value="">Sélectionner Secteur</option>
                    {SMI_CONFIG.sectors.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#141414]/40 mb-2 block">Chantier (Galerie)</label>
                  <select 
                    value={formData.chantierId}
                    onChange={e => {
                      const c = SMI_CONFIG.chantiers.find(x => x.id === e.target.value);
                      setFormData({...formData, chantierId: e.target.value, gallerySize: c?.gallery === '12m2' ? 12 : 9});
                    }}
                    className="w-full bg-[#F5F5F0] border-2 border-transparent focus:border-[#141414] px-4 py-4 text-sm font-black uppercase outline-none transition-all"
                    required
                    disabled={!formData.sector}
                  >
                    <option value="">Sélectionner Chantier</option>
                    {filteredChantiers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div className="p-4 bg-[#F5F5F0] border-l-4 border-[#8B0000]">
                  <p className="text-[8px] font-black uppercase text-[#141414]/40">Manager Responsable</p>
                  <p className="text-xs font-black uppercase mt-1">
                    {SMI_CONFIG.sectors.find(s => s.id === formData.sector)?.manager || 'En attente...'}
                  </p>
                </div>
              </div>

              {/* Column 2: Operation details */}
              <div className="space-y-6">
                <h4 className="text-[10px] font-black uppercase tracking-widest text-[#00BFFF] border-b border-[#00BFFF] pb-2">Opérationnel</h4>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#141414]/40 mb-2 block">Équipement</label>
                  <div className="p-4 bg-[#F5F5F0] text-xs font-black uppercase mb-4 border border-[#141414]/5 flex items-center gap-2">
                    <HardHat className="w-4 h-4" /> {SMI_CONFIG.equipment.drill}
                  </div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#141414]/40 mb-2 block">Barre Conique</label>
                  <div className="flex gap-2">
                    {SMI_CONFIG.equipment.bars.map(b => (
                      <button 
                        key={b}
                        type="button"
                        onClick={() => setFormData({...formData, barLength: b})}
                        className={cn(
                          "flex-1 py-3 text-xs font-black border-2 transition-all",
                          formData.barLength === b ? "bg-[#141414] text-white border-[#141414]" : "bg-white border-[#141414]/10 hover:border-[#141414]/30"
                        )}
                      >
                        {b}m
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-[#141414]/40 mb-2 block">Section Galerie</label>
                  <div className="flex gap-2">
                    {[9, 12].map(s => (
                      <button 
                        key={s}
                        type="button"
                        className={cn(
                          "flex-1 py-3 text-xs font-black border-2 transition-all",
                          formData.gallerySize === s ? "bg-[#8B0000] text-white border-[#8B0000]" : "bg-white border-[#141414]/10 opacity-50 cursor-not-allowed"
                        )}
                      >
                        {s}m²
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Column 3: Production Data */}
              <div className="space-y-6">
                 <h4 className="text-[10px] font-black uppercase tracking-widest text-[#00BFFF] border-b border-[#00BFFF] pb-2">Production</h4>
                 <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#141414]/40 mb-2 block">Métrage Avancement (m)</label>
                    <input 
                      type="number" 
                      step="0.1"
                      required
                      value={formData.meterage}
                      onChange={e => setFormData({...formData, meterage: Number(e.target.value)})}
                      className="w-full bg-[#F5F5F0] border-2 border-transparent focus:border-[#141414] px-4 py-4 text-2xl font-black outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#141414]/40 mb-2 block">Nombre de Volées</label>
                    <input 
                      type="number" 
                      required
                      value={formData.rounds}
                      onChange={e => setFormData({...formData, rounds: Number(e.target.value)})}
                      className="w-full bg-[#F5F5F0] border-2 border-transparent focus:border-[#141414] px-4 py-4 text-xl font-black outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#141414]/40 mb-2 block">Gasoil injecté (L)</label>
                    <input 
                      type="number" 
                      value={formData.fuelConsumption}
                      onChange={e => setFormData({...formData, fuelConsumption: Number(e.target.value)})}
                      className="w-full bg-[#F5F5F0] border-2 border-transparent focus:border-[#141414] px-4 py-4 text-xl font-black outline-none transition-all"
                    />
                  </div>
              </div>

              <div className="col-span-3 flex gap-4 pt-6">
                <button 
                  type="submit" 
                  disabled={loading || !formData.chantierId}
                  className="flex-1 bg-[#141414] text-white py-6 font-black uppercase tracking-[0.4em] text-sm hover:bg-[#00BFFF] transition-all disabled:opacity-20 shadow-[8px_8px_0px_#00BFFF]"
                >
                  {loading ? 'TRANSMISSION...' : 'VALIDER ET TRANSMETTRE AU MANAGER'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
