import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, limit, onSnapshot, addDoc } from 'firebase/firestore';
import { ShieldCheck, Clock, X, Terminal, Search, ChevronRight } from 'lucide-react';

interface AuditLog {
  id: string;
  date: string;
  timestamp: string;
  user: string;
  post: string;
  action: string;
  details: string;
}

interface AuditLogsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string;
}

// Global helper to easily create audit logs from anywhere in the app
export const logPlanningAction = async (userEmail: string, action: string, post: string, date: string, details: string) => {
  try {
    await addDoc(collection(db, 'audit_logs'), {
      date,
      timestamp: new Date().toISOString(),
      user: userEmail || 'Planificateur SMI',
      post,
      action,
      details
    });
  } catch (err) {
    console.error("Error writing audit log:", err);
  }
};

export const AuditLogsDrawer: React.FC<AuditLogsDrawerProps> = ({
  isOpen,
  onClose,
  selectedDate
}) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [search, setSearch] = useState('');
  const [filterAction, setFilterAction] = useState('ALL');

  useEffect(() => {
    if (!isOpen) return;

    const q = query(
      collection(db, 'audit_logs'),
      orderBy('timestamp', 'desc'),
      limit(100)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: AuditLog[] = [];
      snapshot.forEach(docSnap => {
        const d = docSnap.data();
        list.push({
          id: docSnap.id,
          date: d.date || '',
          timestamp: d.timestamp || '',
          user: d.user || '',
          post: d.post || '',
          action: d.action || '',
          details: d.details || ''
        });
      });
      setLogs(list);
    }, (err) => {
      console.error("Permission issue/error reading audit logs: ", err.message);
    });

    return () => unsubscribe();
  }, [isOpen]);

  if (!isOpen) return null;

  const filteredLogs = logs.filter(log => {
    // Search general text match
    const textStr = `${log.action} ${log.details} ${log.user} ${log.post} ${log.date}`.toLowerCase();
    const searchMatch = textStr.includes(search.toLowerCase());
    
    // Filter by category
    if (filterAction === 'ALL') return searchMatch;
    return searchMatch && log.action.toUpperCase().includes(filterAction);
  });

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop overlay */}
      <div 
        onClick={onClose} 
        className="absolute inset-0 bg-gray-950/30 backdrop-blur-xs transition-opacity cursor-pointer"
      />

      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white border-l-2 border-gray-950 shadow-2xl flex flex-col h-full animate-slide-in">
          
          {/* Drawer Header */}
          <div className="bg-gray-950 p-4 text-white flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <h2 className="text-sm font-black uppercase tracking-wider">
                🪵 AUDIT ET HISTORIQUE SMI
              </h2>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-transform active:scale-95 border border-gray-800 p-1 rounded hover:bg-gray-900 cursor-pointer"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>

          {/* Subheader info block */}
          <div className="p-4 border-b border-gray-150 bg-gradient-to-r from-gray-50 to-neutral-50 flex items-center gap-2.5">
            <Terminal className="w-4 h-4 text-sky-600 flex-shrink-0" />
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wide">
              Traçabilité complète des ordres de planifications journaliers.
            </p>
          </div>

          {/* Filters & Search bars */}
          <div className="p-4 border-b border-gray-150 space-y-3 bg-neutral-50/50">
            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Rechercher par utilisateur, action, chantier..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-gray-950 focus:border-gray-950 transition-all bg-white"
              />
            </div>

            {/* Category tabs */}
            <div className="flex gap-1.5 overflow-x-auto pb-0.5 scrollbar-thin">
              {[
                { label: 'Tous', filter: 'ALL' },
                { label: 'Générations', filter: 'PROPOSITION' },
                { label: 'Sauvegardes', filter: 'SAUVEGARDE' },
                { label: 'Graves', filter: 'PLAN' }
              ].map(tab => (
                <button
                  key={tab.filter}
                  onClick={() => setFilterAction(tab.filter)}
                  className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-wider border transition-all whitespace-nowrap cursor-pointer ${
                    filterAction === tab.filter
                      ? 'bg-gray-950 text-white border-gray-950'
                      : 'bg-white hover:bg-gray-100 text-gray-600 border-gray-200 shadow-xs'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Logs List Container */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-white">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-10 space-y-2">
                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">Aucun log trouvé</p>
                <p className="text-[10px] text-gray-400">Modifiez ou faites des actions pour alimenter le registre d'audit.</p>
              </div>
            ) : (
              <div className="relative border-l-2 border-gray-100 pl-4 ml-2.5 space-y-5">
                {filteredLogs.map((log) => {
                  const formatTime = (isoString?: string) => {
                    if (!isoString) return '--:--';
                    try {
                      const d = new Date(isoString);
                      return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
                    } catch {
                      return '--:--';
                    }
                  };

                  const isGenerate = log.action.toUpperCase().includes('PROPOSITION') || log.action.toUpperCase().includes('GENERE');
                  const isSave = log.action.toUpperCase().includes('SAUVEGARDE') || log.action.toUpperCase().includes('GRAV');

                  return (
                    <div key={log.id} className="relative group">
                      {/* Timeline dot accent */}
                      <span className={`absolute -left-[24.5px] top-1 w-3.5 h-3.5 rounded-full border-2 border-white ring-2 ${
                        isGenerate 
                          ? 'bg-amber-400 ring-amber-100' 
                          : isSave 
                            ? 'bg-emerald-500 ring-emerald-100' 
                            : 'bg-sky-500 ring-sky-100'
                      }`} />

                      <div className="space-y-1">
                        {/* Title, Badge and Timetags */}
                        <div className="flex items-center justify-between gap-2.5">
                          <span className="text-[10px] font-black uppercase text-gray-950 tracking-wide">
                            {log.action}
                          </span>
                          <div className="flex items-center gap-1.5 text-neutral-400 font-mono text-[8.5px]">
                            <Clock className="w-3 h-3 flex-shrink-0" />
                            <span>{formatTime(log.timestamp)}</span>
                          </div>
                        </div>

                        {/* Details content card */}
                        <div className="bg-gray-50 border border-gray-150 p-2.5 rounded-lg text-[9.5px] leading-relaxed text-gray-600 space-y-1.5 shadow-sm">
                          <p>{log.details}</p>
                          <div className="flex flex-wrap gap-1.5 text-[8px] font-black uppercase tracking-wider text-gray-400 pt-0.5 border-t border-gray-100">
                            <span>Saisi par : <strong className="text-gray-500">{log.user.split('@')[0]}</strong></span>
                            <span>•</span>
                            <span>Vol : <strong className="text-sky-750">{log.post}</strong></span>
                            {log.date && (
                              <>
                                <span>•</span>
                                <span>Plan du : <strong className="text-[#8B0000]">{log.date}</strong></span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Drawer Footer Status indicator */}
          <div className="bg-neutral-50 p-3 border-t border-gray-150 text-center flex items-center justify-center gap-1.5 text-[8.5px] font-black uppercase tracking-wide text-gray-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>Serveur d'audit opérationnel • SMI - Imiter</span>
          </div>

        </div>
      </div>
    </div>
  );
};
