import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, ShieldAlert, Cpu, CheckCircle2, AlertTriangle, Loader2, History, Scale } from 'lucide-react';
import { collection, query, limit, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';

export const Audit: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [stats, setStats] = useState({ total: 0, risky: 0 });

  useEffect(() => {
    const q = query(collection(db, 'production'), limit(20));
    const unsub = onSnapshot(q, (snapshot) => {
      setStats({
        total: snapshot.size,
        risky: snapshot.docs.filter(d => d.data().fuelConsumption > 500 && d.data().meterage < 10).length
      });
    });
    return () => unsub();
  }, []);

  const runAuditIA = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, 'production'), limit(10), orderBy('timestamp', 'desc'));
      const unsub = onSnapshot(q, async (snapshot) => {
        const records = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const res = await fetch('/api/ia/audit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ contextData: records })
        });
        const data = await res.json();
        setResults(prev => [{ ...data, timestamp: new Date().toISOString() }, ...prev]);
        setLoading(false);
        unsub(); // Only run once
      });
    } catch (e) {
      console.error(e);
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h3 className="text-3xl font-black tracking-tighter text-[#141414]">Audit & Détection Fraude</h3>
          <p className="text-xs font-bold uppercase tracking-widest text-[#141414]/40">Intelligence Artificielle de contrôle comportemental</p>
        </div>
        <button 
          onClick={runAuditIA}
          disabled={loading}
          className="bg-[#8B0000] text-white px-8 py-4 rounded-2xl font-black text-sm flex items-center gap-3 hover:bg-[#8B0000]/90 transition-all shadow-xl shadow-[#8B0000]/20 disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldAlert className="w-5 h-5" />}
          Lancer Scan IA
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Risk Stats */}
        <div className="md:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-[#141414]/5">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#141414]/40 mb-6">Indice de Risque Global</h4>
            <div className="flex items-center justify-center p-8 bg-[#8B0000]/5 rounded-full w-48 h-48 mx-auto border-8 border-[#8B0000]/10">
              <div className="text-center">
                <span className="text-4xl font-black text-[#8B0000]">{Math.round((stats.risky / (stats.total || 1)) * 100)}%</span>
                <p className="text-[8px] font-black uppercase text-[#141414]/40 mt-1">Anomalies</p>
              </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-[#141414]/5 space-y-4">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#141414]/40">Alertes Actives</h4>
            {stats.risky > 0 ? (
              <div className="p-4 bg-red-50 rounded-2xl flex items-center gap-4 text-red-700">
                <AlertTriangle className="w-6 h-6 flex-shrink-0" />
                <p className="text-xs font-bold leading-tight">Incohérence détectée entre consommation gazole et métrage foré à OUMEJRANE.</p>
              </div>
            ) : (
              <div className="p-4 bg-green-50 rounded-2xl flex items-center gap-4 text-green-700">
                <CheckCircle2 className="w-6 h-6 flex-shrink-0" />
                <p className="text-xs font-bold leading-tight">Aucun pattern de fraude flagrant détecté ces dernières 24h.</p>
              </div>
            )}
          </div>
        </div>

        {/* Audit Results Feed */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-[#141414] rounded-3xl p-8 min-h-[500px]">
            <h4 className="text-sm font-black uppercase tracking-[0.2em] text-white flex items-center gap-3 mb-8">
              <History className="w-5 h-5 text-[#00BFFF]" />
              Historique des Scans IA
            </h4>

            <div className="space-y-6">
              {results.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-white/20">
                  <Cpu className="w-16 h-16 mb-4 opacity-10" />
                  <p className="text-sm font-bold uppercase tracking-widest">En attente de scan...</p>
                </div>
              ) : results.map((res, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all cursor-default"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-3 rounded-xl",
                        res.score > 50 ? "bg-red-500/20 text-red-500" : "bg-green-500/20 text-green-500"
                      )}>
                        <Scale className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Audit Score</p>
                        <h5 className="text-xl font-black text-white">{res.score}/100</h5>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-white/20">{new Date(res.timestamp).toLocaleTimeString()}</span>
                  </div>
                  <p className="text-sm text-white/70 leading-relaxed mb-4 font-medium italic">
                    "{res.justification}"
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {res.flags?.map((f: string, fi: number) => (
                      <span key={fi} className="px-2 py-1 bg-white/5 text-[8px] font-black uppercase tracking-widest text-white/40 rounded border border-white/10">
                        {f}
                      </span>
                    ))}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
