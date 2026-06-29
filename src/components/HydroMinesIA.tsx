import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Brain, 
  Zap, 
  ShieldAlert, 
  Sparkles, 
  RefreshCw, 
  Play, 
  ArrowRight, 
  Info,
  CheckCircle,
  AlertTriangle,
  XCircle,
  FileText,
  Activity,
  HardHat,
  Bomb,
  Truck,
  Wrench,
  Gauge,
  TrendingUp,
  Eye,
  Settings,
  ChevronRight
} from 'lucide-react';

interface HydroMinesIAProps {
  allProductionDocs: any[];
  chantiers: any[];
  employees: any[];
  platformSettings?: any;
}

export const HydroMinesIA: React.FC<HydroMinesIAProps> = ({
  allProductionDocs,
  chantiers,
  employees,
  platformSettings
}) => {
  const [activeMode, setActiveMode] = useState<'vision' | 'audit' | 'assistant' | 'expert'>('vision');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [customPrompt, setCustomPrompt] = useState('');
  const [selectedExpert, setSelectedExpert] = useState<'geologue' | 'ingenieur_minage' | 'rh' | 'securite'>('ingenieur_minage');

  const getProductionData = () => {
    const sortedDocs = [...(allProductionDocs || [])].sort((a, b) => {
      const dateA = a.date || a.id || '';
      const dateB = b.date || b.id || '';
      return dateA.localeCompare(dateB);
    });
    
    const last14Days = sortedDocs.slice(-14);
    
    const totalMeteragePlanned = last14Days.reduce((s, d) => s + (d.totalMeteragePlanned || 0), 0);
    const totalMeterageRealised = last14Days.reduce((s, d) => s + (d.totalMeterageRealised || 0), 0);
    const totalWagonsPlanned = last14Days.reduce((s, d) => s + (d.totalWagonsPlanned || 0), 0);
    const totalWagonsRealised = last14Days.reduce((s, d) => s + (d.totalWagonsRealised || 0), 0);
    const totalAnfo = last14Days.reduce((s, d) => s + (d.totalAnfo || 0), 0);
    
    const tauxRealisation = totalMeteragePlanned > 0 
      ? Number(((totalMeterageRealised / totalMeteragePlanned) * 100).toFixed(1))
      : 100;

    return {
      period: last14Days.length > 0 
        ? `${last14Days[0]?.date || last14Days[0]?.id || ''} au ${last14Days[last14Days.length - 1]?.date || last14Days[last14Days.length - 1]?.id || ''}`
        : 'Aucune donnée',
      totalMeteragePlanned: totalMeteragePlanned.toFixed(1),
      totalMeterageRealised: totalMeterageRealised.toFixed(1),
      totalWagonsPlanned,
      totalWagonsRealised,
      totalAnfo: totalAnfo.toFixed(0),
      tauxRealisation,
      dailyDetails: last14Days.map(d => ({
        date: d.date || d.id,
        meterageRealised: d.totalMeterageRealised || 0,
        meteragePlanned: d.totalMeteragePlanned || 0,
        wagonsRealised: d.totalWagonsRealised || 0,
      })),
      nbChantiers: (chantiers || []).filter(c => c.status === 'ouvert').length,
      sectors: ['Imiter 1', 'Imiter 2', 'Imiter Est'],
      site: 'SMI Imiter — Mine souterraine d\'argent'
    };
  };

  const callIA = async () => {
    setLoading(true);
    setResult(null);
    setError(null);

    const dataContext = getProductionData();
    const safetyData = { site: 'SMI Imiter', type: 'mine souterraine argent' };
    const maintenanceData = { engines: 'LHD ST2D, LHD ST2G, Perforateur Montabert T23' };

    try {
      let endpoint = '';
      let body = {};

      if (activeMode === 'vision') {
        endpoint = '/api/ia/vision';
        body = {
          productionData: dataContext,
          maintenanceData,
          safetyData,
          prompt: customPrompt || 'Analyse la performance globale de la mine sur les 14 derniers jours. Identifie les tendances, anomalies, et donne 3 recommandations prioritaires en français.'
        };
      } else if (activeMode === 'audit') {
        endpoint = '/api/ia/audit';
        body = { contextData: dataContext };
      } else if (activeMode === 'assistant') {
        endpoint = '/api/ia/assistant';
        body = {
          skillId: 'metier',
          customPrompt: customPrompt || 'Quelles sont les 5 améliorations les plus impactantes pour augmenter le métrage mensuel à SMI Imiter ?',
          appContext: JSON.stringify(dataContext)
        };
      } else if (activeMode === 'expert') {
        const experts = {
          geologue: {
            name: 'Dr. Hassan Benali',
            profile: 'Géologue minier senior, 25 ans d\'expérience dans les mines d\'argent au Maroc. Expert en géomécanique et stabilité des galeries.'
          },
          ingenieur_minage: {
            name: 'Ing. Karim Tazi',
            profile: 'Ingénieur minage, spécialiste en forage et tir, optimisation des explosifs ANFO/Tovex, rendement des perforateurs Montabert T23.'
          },
          rh: {
            name: 'Mme. Fatima Alaoui',
            profile: 'DRH minière, spécialiste en gestion des équipes en postes 3x8, performance individuelle, absentéisme et productivité.'
          },
          securite: {
            name: 'Ing. Youssef Idrissi',
            profile: 'Ingénieur HSE, expert sécurité mine souterraine, réglementation marocaine ONHYM, risques explosifs et ventilation.'
          }
        };
        endpoint = '/api/ia/expert-analysis';
        body = {
          expertName: experts[selectedExpert].name,
          profile: experts[selectedExpert].profile,
          dataContext
        };
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        throw new Error(`Erreur serveur : ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Erreur de connexion à l\'IA');
    } finally {
      setLoading(false);
    }
  };

  const dataContext = getProductionData();

  return (
    <div className="w-full bg-slate-950 rounded-3xl border border-slate-800 p-6 shadow-2xl text-slate-100 flex flex-col gap-6" id="hydromines-ia-panel">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div className="space-y-1">
          <h2 className="text-base md:text-lg font-black tracking-wider text-white flex items-center gap-2">
            🤖 HYDROMINES INTELLIGENCE ARTIFICIELLE
          </h2>
          <p className="text-xs font-black text-[#ffd700] uppercase tracking-wide">
            Powered by Gemini — Analyse en temps réel
          </p>
        </div>
        <div className="inline-flex items-center gap-2 bg-[#ffd700]/10 border border-[#ffd700]/30 px-3 py-1.5 rounded-xl">
          <span className="w-2 h-2 rounded-full bg-[#ffd700] animate-ping" />
          <span className="text-[10px] font-black uppercase text-[#ffd700] tracking-wide">
            ⚡ LIVE DATA — 14 derniers jours ({dataContext.period})
          </span>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 border-b border-slate-850 pb-4">
        {[
          { id: 'vision', label: '🔭 Vision Stratégique' },
          { id: 'audit', label: '🔍 Audit & Fraude' },
          { id: 'assistant', label: '💡 Assistant Terrain' },
          { id: 'expert', label: '👨‍💼 Panel Experts' }
        ].map(mode => (
          <button
            key={mode.id}
            onClick={() => {
              setActiveMode(mode.id as any);
              setResult(null);
              setError(null);
            }}
            className={`px-4 py-2.5 rounded-xl font-black text-xs uppercase tracking-wide transition-all cursor-pointer ${
              activeMode === mode.id
                ? 'bg-[#1a5276] text-white shadow-md'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            {mode.label}
          </button>
        ))}
      </div>

      {(activeMode === 'vision' || activeMode === 'assistant') && (
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Prompt d'analyse personnalisé (facultatif) :
          </label>
          <textarea
            value={customPrompt}
            onChange={e => setCustomPrompt(e.target.value)}
            placeholder={
              activeMode === 'vision'
                ? "Ex: Pourquoi le secteur Imiter Est performe moins bien cette semaine ?"
                : "Ex: Comment améliorer le rendement du Poste 2 ?"
            }
            className="w-full bg-slate-900 border border-slate-800 text-white text-xs font-semibold rounded-xl px-4 py-3 resize-none h-20 outline-none placeholder:text-slate-500 focus:border-[#ffd700]"
          />
        </div>
      )}

      {activeMode === 'expert' && (
        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase tracking-wider text-slate-400">
            Sélectionner un expert du panel :
          </label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { id: 'geologue', label: '🪨 Géologue Minier', name: 'Dr. Hassan Benali' },
              { id: 'ingenieur_minage', label: '💥 Ingénieur Minage', name: 'Ing. Karim Tazi' },
              { id: 'rh', label: '👷 DRH Minière', name: 'Mme. Fatima Alaoui' },
              { id: 'securite', label: '🛡️ Ingénieur HSE', name: 'Ing. Youssef Idrissi' }
            ].map(exp => (
              <button
                key={exp.id}
                onClick={() => {
                  setSelectedExpert(exp.id as any);
                  setResult(null);
                  setError(null);
                }}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  selectedExpert === exp.id
                    ? 'border-[#ffd700] bg-[#ffd700]/10 shadow-lg'
                    : 'border-slate-800 bg-slate-900 hover:bg-slate-850'
                }`}
              >
                <div className="text-xs font-black uppercase text-white leading-tight">
                  {exp.label}
                </div>
                <div className="text-[10px] text-slate-400 mt-1 uppercase font-bold">
                  {exp.name}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex justify-start">
        <button
          onClick={callIA}
          disabled={loading}
          className="bg-[#ffd700] text-slate-950 font-black uppercase rounded-xl px-8 py-3.5 text-xs tracking-wider hover:bg-yellow-400 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Analyse en cours...
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              {activeMode === 'vision' && "Lancer la Vision IA"}
              {activeMode === 'audit' && "Lancer l'Audit IA"}
              {activeMode === 'assistant' && "Obtenir les Recommandations"}
              {activeMode === 'expert' && "Consulter l'Expert"}
            </>
          )}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-8 rounded-2xl bg-slate-900/50 border border-slate-800 flex flex-col items-center justify-center text-center gap-3"
          >
            <RefreshCw className="w-8 h-8 text-[#ffd700] animate-spin" />
            <div className="space-y-1">
              <p className="text-sm font-black uppercase tracking-wide text-white">
                L'IA analyse vos données de production...
              </p>
              <p className="text-xs text-slate-400 font-semibold uppercase">
                Patientez — requête Gemini en cours
              </p>
            </div>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-5 rounded-2xl bg-red-950/40 border border-red-850 flex flex-col items-start gap-3"
          >
            <div className="flex items-center gap-2 text-red-400 font-black uppercase text-xs">
              <XCircle className="w-5 h-5 text-red-500" />
              Erreur de l'Analyse IA
            </div>
            <p className="text-xs text-red-300 font-semibold">{error}</p>
            <button
              onClick={callIA}
              className="text-xs font-black uppercase text-[#ffd700] hover:underline"
            >
              Réessayer
            </button>
          </motion.div>
        )}

        {result && !loading && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {activeMode === 'vision' && (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-lg text-slate-800 space-y-4">
                <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                  <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
                  <h3 className="text-sm font-black uppercase text-slate-900 tracking-wide">
                    🔭 Analyse Vision HydroMines
                  </h3>
                </div>
                <p className="whitespace-pre-wrap text-sm text-slate-700 leading-relaxed font-semibold">
                  {result.result || result}
                </p>
                <div className="pt-3 border-t border-slate-100 text-[10px] text-slate-400 font-black uppercase tracking-wider">
                  Généré par Gemini 2.0 Flash — Données réelles SMI Imiter
                </div>
              </div>
            )}

            {activeMode === 'audit' && (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-lg text-slate-800 space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-rose-500" />
                    <h3 className="text-sm font-black uppercase text-slate-900 tracking-wide">
                      🔍 Rapport d'Audit & Détection d'Anomalies
                    </h3>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black uppercase text-slate-500">
                      Score de suspicion:
                    </span>
                    <div className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider ${
                      (result.score || 0) <= 30 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : (result.score || 0) <= 60
                        ? 'bg-amber-50 text-amber-700 border border-amber-200'
                        : 'bg-rose-50 text-rose-800 border border-rose-200 animate-pulse'
                    }`}>
                      {result.score || 0} / 100 — {(result.score || 0) <= 30 ? '✅ NOMINAL' : (result.score || 0) <= 60 ? '⚠️ ATTENTION' : '🚨 ALERTE'}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <h4 className="text-xs font-black uppercase text-slate-450 tracking-wider">
                    Justification de l'Audit:
                  </h4>
                  <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap font-semibold">
                    {result.justification}
                  </p>
                </div>

                {result.flags && result.flags.length > 0 && (
                  <div className="space-y-3 pt-4 border-t border-slate-100">
                    <h4 className="text-xs font-black uppercase text-rose-600 tracking-wider">
                      Flags & Points d'Attention Détectés:
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {result.flags.map((flag: string, index: number) => (
                        <span key={index} className="px-3 py-1.5 bg-rose-50 border border-rose-100 text-rose-700 text-[10px] font-extrabold uppercase rounded-lg">
                          🚨 {flag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeMode === 'assistant' && (
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-5 h-5 text-amber-500" />
                  <h3 className="text-sm font-black uppercase text-slate-100 tracking-wide">
                    💡 Recommandations de l'Assistant Tactique
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {(result.suggestions || []).map((sug: any, idx: number) => {
                    const isHigh = sug.impact?.toLowerCase() === 'high';
                    const isMedium = sug.impact?.toLowerCase() === 'medium';
                    return (
                      <div key={idx} className={`p-5 rounded-2xl bg-white border transition-all ${
                        isHigh 
                          ? 'border-l-[6px] border-l-rose-500 border-y-slate-200 border-r-slate-200' 
                          : isMedium 
                          ? 'border-l-[6px] border-l-amber-500 border-y-slate-200 border-r-slate-200' 
                          : 'border-l-[6px] border-l-slate-400 border-y-slate-200 border-r-slate-200'
                      }`}>
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <span className="px-2 py-1 bg-slate-150 text-slate-700 text-[9px] font-black uppercase rounded-md">
                            {sug.category || 'GÉNÉRAL'}
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase ${
                            isHigh 
                              ? 'bg-rose-100 text-rose-700' 
                              : isMedium 
                              ? 'bg-amber-100 text-amber-700' 
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            Impact: {sug.impact || 'LOW'}
                          </span>
                        </div>
                        <h4 className="text-xs font-black uppercase text-slate-900 mb-1">
                          {sug.title}
                        </h4>
                        <p className="text-xs text-slate-650 leading-relaxed font-semibold">
                          {sug.description_fr || sug.description}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {activeMode === 'expert' && (
              <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-lg text-slate-800 space-y-6">
                <div className="flex items-center gap-4 border-b border-slate-100 pb-4">
                  <div className="w-12 h-12 rounded-full bg-slate-900 text-[#ffd700] flex items-center justify-center font-black text-sm border-2 border-[#ffd700] shrink-0">
                    {selectedExpert === 'geologue' ? 'HB' : selectedExpert === 'ingenieur_minage' ? 'KT' : selectedExpert === 'rh' ? 'FA' : 'YI'}
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase text-slate-950">
                      {selectedExpert === 'geologue' ? 'Dr. Hassan Benali' : selectedExpert === 'ingenieur_minage' ? 'Ing. Karim Tazi' : selectedExpert === 'rh' ? 'Mme. Fatima Alaoui' : 'Ing. Youssef Idrissi'}
                    </h3>
                    <p className="text-[10px] text-slate-500 uppercase tracking-wider font-extrabold leading-tight">
                      {selectedExpert === 'geologue' ? 'Géologue minier senior' : selectedExpert === 'ingenieur_minage' ? 'Spécialiste Forage & Minage' : selectedExpert === 'rh' ? 'DRH Minière Senior' : 'Ingénieur HSE Chef'}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <h4 className="text-xs font-black uppercase text-slate-500 flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-slate-450" /> Analyse de l'expert :
                      </h4>
                      <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap bg-slate-50 p-4 rounded-xl border border-slate-150 font-semibold">
                        {result.analysis}
                      </p>
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-black uppercase text-slate-450 flex items-center gap-1.5">
                        <Brain className="w-4 h-4 text-[#ffd700]" /> Logique d'analyse :
                      </h4>
                      <p className="text-xs text-slate-600 leading-relaxed whitespace-pre-wrap italic bg-slate-50 p-4 rounded-xl border border-slate-150 font-semibold">
                        {result.logic}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <h4 className="text-xs font-black uppercase text-rose-600">
                        Anomalies relevées:
                      </h4>
                      <div className="flex flex-col gap-1.5">
                        {(result.anomalies || []).map((an: string, idx: number) => (
                          <div key={idx} className="flex items-start gap-2 bg-rose-50 border border-rose-100 p-3 rounded-lg text-rose-700 text-xs font-semibold">
                            <span className="mt-0.5 font-bold">🚨</span>
                            <span>{an}</span>
                          </div>
                        ))}
                        {(!result.anomalies || result.anomalies.length === 0) && (
                          <div className="text-xs text-slate-400 italic">Aucune anomalie signalée.</div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <h4 className="text-xs font-black uppercase text-emerald-600">
                        Suggestions d'optimisation:
                      </h4>
                      <div className="flex flex-col gap-1.5">
                        {(result.suggestions || []).map((sug: string, idx: number) => (
                          <div key={idx} className="flex items-start gap-2 bg-emerald-50 border border-emerald-100 p-3 rounded-lg text-emerald-800 text-xs font-semibold">
                            <span className="mt-0.5 font-bold">🟢</span>
                            <span>{sug}</span>
                          </div>
                        ))}
                        {(!result.suggestions || result.suggestions.length === 0) && (
                          <div className="text-xs text-slate-400 italic">Aucune suggestion disponible.</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="pt-3 border-t border-slate-900 flex justify-end">
        <span className="text-[9px] text-slate-500 font-black uppercase tracking-widest">
          🔒 Données traitées côté serveur — Clé API sécurisée — ~0.001€ par analyse
        </span>
      </div>
    </div>
  );
};
