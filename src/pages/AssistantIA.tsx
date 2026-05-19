import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, Lightbulb, AppWindow, Zap, Loader2, Send, ChevronRight, MessageSquare } from 'lucide-react';

interface Suggestion {
  category: string;
  title: string;
  description: string;
  impact: 'High' | 'Medium' | 'Low';
}

const SKILLS = [
  { id: 'metier', label: 'AMELIORATION METIER', icon: <Zap className="w-5 h-5 text-orange-500" />, desc: 'Optimisation des opérations minières et forage.' },
  { id: 'app', label: 'AMELIORATION APP', icon: <AppWindow className="w-5 h-5 text-blue-500" />, desc: 'Amélioration de l’interface et des fonctionnalités.' },
  { id: 'tout', label: 'AMELIORATION DE TOUT', icon: <Sparkles className="w-5 h-5 text-purple-500" />, desc: 'Vision globale pour une excellence opérationnelle.' },
];

export const AssistantIA: React.FC = () => {
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [userInput, setUserInput] = useState('');
  const [error, setError] = useState<string | null>(null);

  const getSuggestions = async (skillId: string, customPrompt?: string) => {
    setLoading(true);
    setSelectedSkill(skillId);
    setError(null);
    try {
      const res = await fetch('/api/ia/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          skillId, 
          customPrompt: customPrompt || '',
          appContext: "HydroMines is a production tracking app for underground mining (sites: SMI, OUMEJRANE, KOUDIA, BOU-AZZER, OUANSIMI). It covers production, engines, maintenance, safety, and stocks."
        })
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `Le service IA est temporairement indisponible (503). Veuillez réessayer dans quelques instants.`);
      }

      const data = await res.json();
      setSuggestions(data.suggestions || []);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Une erreur est survenue lors de la communication avec l'IA.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h3 className="text-3xl font-black tracking-tighter text-[#141414]">Assistant IA Evolution</h3>
          <p className="text-xs font-bold uppercase tracking-widest text-[#141414]/40">Propulsez HydroMines vers l'excellence</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {SKILLS.map((skill) => (
          <motion.button
            key={skill.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => getSuggestions(skill.id)}
            className={cn(
              "p-6 rounded-3xl text-left transition-all border-2",
              selectedSkill === skill.id 
                ? "bg-[#141414] border-[#141414] text-white shadow-xl shadow-black/10" 
                : "bg-white border-[#141414]/5 text-[#141414] hover:border-[#141414]/10"
            )}
          >
            <div className="bg-[#F5F5F0] w-12 h-12 rounded-2xl flex items-center justify-center mb-4">
              {skill.icon}
            </div>
            <h4 className="text-sm font-black uppercase tracking-wider mb-2">{skill.label}</h4>
            <p className={cn("text-xs leading-relaxed", selectedSkill === skill.id ? "text-white/60" : "text-[#141414]/40")}>
              {skill.desc}
            </p>
          </motion.button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="bg-white rounded-[40px] p-20 flex flex-col items-center justify-center border border-[#141414]/5"
              >
                <Loader2 className="w-12 h-12 text-[#00BFFF] animate-spin mb-6" />
                <p className="text-sm font-black uppercase tracking-[0.3em] text-[#141414]/40 italic">Génération du plan d'évolution...</p>
              </motion.div>
            ) : error ? (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="bg-red-50 rounded-[40px] p-20 flex flex-col items-center justify-center border border-red-100"
              >
                <div className="bg-red-100 p-4 rounded-2xl mb-6">
                  <ShieldAlert className="w-12 h-12 text-red-600" />
                </div>
                <h4 className="text-lg font-black text-red-900 mb-2 uppercase tracking-tight">IA Indisponible</h4>
                <p className="text-sm text-red-700/60 font-medium text-center max-w-md mb-8">
                  {error}
                </p>
                <button 
                  onClick={() => selectedSkill && getSuggestions(selectedSkill)}
                  className="bg-red-600 text-white px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg active:scale-95"
                >
                  Réessayer
                </button>
              </motion.div>
            ) : suggestions.length > 0 ? (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {suggestions.map((s, i) => (
                  <div key={i} className="bg-white p-6 rounded-3xl border border-[#141414]/5 shadow-sm group hover:border-[#00BFFF]/30 transition-all">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-[#00BFFF]/10 rounded-xl">
                          <Lightbulb className="w-5 h-5 text-[#00BFFF]" />
                        </div>
                        <div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-[#141414]/40">{s.category}</span>
                          <h5 className="text-lg font-black text-[#141414]">{s.title}</h5>
                        </div>
                      </div>
                      <span className={cn(
                        "text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-wider",
                        s.impact === 'High' ? 'bg-red-100 text-red-700' : 
                        s.impact === 'Medium' ? 'bg-orange-100 text-orange-700' : 'bg-blue-100 text-blue-700'
                      )}>
                        Impact {s.impact}
                      </span>
                    </div>
                    <p className="text-sm text-[#141414]/60 leading-relaxed font-medium">
                      {s.description}
                    </p>
                    <div className="mt-4 pt-4 border-t border-[#141414]/5 flex justify-end">
                      <button className="text-[10px] font-black uppercase tracking-widest text-[#00BFFF] flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        Planifier <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </motion.div>
            ) : (
              <div className="bg-white rounded-[40px] p-20 flex flex-col items-center justify-center border border-[#141414]/5 border-dashed">
                <Sparkles className="w-16 h-16 text-[#141414]/5 mb-4" />
                <p className="text-sm font-black uppercase tracking-widest text-[#141414]/20">Sélectionnez un axe d'amélioration</p>
              </div>
            )}
          </AnimatePresence>
        </div>

        <div className="space-y-6">
          <div className="bg-[#141414] rounded-[32px] p-8 text-white shadow-2xl relative overflow-hidden">
            <h4 className="text-sm font-black uppercase tracking-[0.2em] mb-6 text-[#00BFFF] flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Requête Personnalisée
            </h4>
            <p className="text-xs text-white/40 mb-6 leading-relaxed">
              Demandez à l'IA de se concentrer sur un aspect spécifique du métier ou de l'application.
            </p>
            <textarea 
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Ex: Comment améliorer la saisie terrain pour les secrétaires ?"
              className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xs focus:outline-none focus:ring-2 focus:ring-[#00BFFF]/50 min-h-[120px] mb-4 text-white placeholder:text-white/20"
            />
            <button 
              onClick={() => getSuggestions(selectedSkill || 'tout', userInput)}
              disabled={loading || !userInput.trim()}
              className="w-full bg-[#00BFFF] text-white py-4 rounded-xl font-black uppercase tracking-widest text-xs hover:bg-[#009ACD] transition-all disabled:opacity-50"
            >
              Envoyer la requête
            </button>
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <Cpu className="w-24 h-24" />
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

import { Cpu, ShieldAlert } from 'lucide-react';
