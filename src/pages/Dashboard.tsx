import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Layers, Zap, TrendingUp, AlertCircle, Send, Cpu, Loader2, ShieldCheck } from 'lucide-react';
import { collection, query, limit, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';

export const Dashboard: React.FC = () => {
  const [prompt, setPrompt] = useState('');
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [metrics, setMetrics] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'production'), orderBy('timestamp', 'desc'), limit(10));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        name: doc.data().date,
        meterage: doc.data().meterage,
        fuel: doc.data().fuelConsumption,
      }));
      setMetrics(data.reverse());
    });
    return () => unsub();
  }, []);

  const runVisionIA = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setAnalysis(null);
    try {
      const res = await fetch('/api/ia/vision', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          productionData: metrics,
          maintenanceData: [], // Would fetch real data here
          safetyData: []
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || "Le service IA est actuellement surchargé. Veuillez réessayer dans quelques instants.");
      }

      const data = await res.json();
      setAnalysis(data.result);
    } catch (e: any) {
      console.error(e);
      setAnalysis(`Désolé, une erreur est survenue : ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: 'Métrage Total SMI', value: '1,244 m', trend: '+18%', icon: <Zap className="text-[#00BFFF]" /> },
          { label: 'Rendement Barres', value: '1.82m', trend: '+5%', icon: <TrendingUp className="text-green-500" /> },
          { label: 'Disponibilité T23', value: '98%', trend: '+2%', icon: <Cpu className="text-orange-500" /> },
          { label: 'Sécurité Imiter', value: 'Zéro', trend: 'Stable', icon: <ShieldCheck className="text-[#8B0000]" /> },
        ].map((kpi, idx) => (
          <motion.div 
            key={idx}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white p-6 rounded-2xl border border-[#141414]/5 shadow-sm"
          >
            <div className="flex justify-between items-start mb-4">
              <div className="p-2 bg-[#F5F5F0] rounded-lg">{kpi.icon}</div>
              <span className={cn(
                "text-[10px] font-bold px-2 py-1 rounded-full",
                kpi.trend.startsWith('+') ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
              )}>
                {kpi.trend}
              </span>
            </div>
            <p className="text-xs font-bold uppercase tracking-wider text-[#141414]/40 mb-1">{kpi.label}</p>
            <h3 className="text-2xl font-black text-[#141414] tracking-tight">{kpi.value}</h3>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Charts Section */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-[#141414]/5 shadow-sm min-h-[400px]">
            <h4 className="text-sm font-black uppercase tracking-[0.2em] mb-8 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#00BFFF]" />
              Évolution Production vs Consommation
            </h4>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={metrics}>
                  <defs>
                    <linearGradient id="prodColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00BFFF" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#00BFFF" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#141414/0.05" />
                  <XAxis 
                    dataKey="name" 
                    hide 
                  />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '16px', 
                      border: 'none', 
                      boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                      fontFamily: 'system-ui'
                    }} 
                  />
                  <Area 
                    type="monotone" 
                    dataKey="meterage" 
                    stroke="#00BFFF" 
                    fillOpacity={1} 
                    fill="url(#prodColor)" 
                    strokeWidth={3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Vision IA Vision Section */}
        <div className="bg-[#141414] text-white p-8 rounded-3xl shadow-2xl relative overflow-hidden group">
          <div className="relative z-10 h-full flex flex-col">
            <h4 className="text-sm font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-2 text-[#00BFFF]">
              <Layers className="w-5 h-5 animate-pulse" />
              Vision IA Stratégique
            </h4>
            
            <div className="flex-1 overflow-y-auto mb-6 pr-2 custom-scrollbar">
              {loading ? (
                <div className="flex items-center gap-3 text-white/40 italic text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyse des flux opérationnels en cours...
                </div>
              ) : analysis ? (
                <div className="prose prose-invert prose-sm text-white/80 leading-relaxed font-medium">
                  {analysis}
                </div>
              ) : (
                <p className="text-white/40 text-sm italic">
                  Posez une question sur la rentabilité, les délais ou les risques pour générer une synthèse IA.
                </p>
              )}
            </div>

            <div className="relative">
              <input 
                type="text" 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && runVisionIA()}
                placeholder="Ex: Analyse de la rentabilité d'OUMEJRANE..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-sm focus:outline-none focus:ring-2 focus:ring-[#00BFFF]/50 placeholder:text-white/20 transition-all font-medium"
              />
              <button 
                onClick={runVisionIA}
                disabled={loading}
                className="absolute right-3 top-3 p-2 bg-[#00BFFF] hover:bg-[#00BFFF]/80 text-white rounded-xl transition-all active:scale-95 disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
          {/* Subtle grid pattern background */}
          <div className="absolute inset-0 opacity-10 pointer-events-none" 
               style={{ backgroundImage: 'radial-gradient(#00BFFF 0.5px, transparent 0.5px)', backgroundSize: '24px 24px' }} />
        </div>
      </div>
    </div>
  );
};

// Tool helper
function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
