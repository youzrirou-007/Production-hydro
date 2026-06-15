import React from 'react';
import { X, Calendar, ArrowRightLeft, UserX, AlertTriangle, CheckCircle } from 'lucide-react';

interface TeamChange {
  type: string;
  role: string;
  chantierName: string;
  oldName: string;
  newName: string;
}

interface InactiveAssigned {
  name: string;
  matricule: string;
  role: string;
}

interface UnassignedWorker {
  name: string;
  matricule: string;
  sector: string;
  fonction: string;
}

interface GapReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  selectedDate: string;
  selectedPost: string;
  teamChanges: TeamChange[];
  inactiveAssigned: InactiveAssigned[];
  unassignedPersonnel: UnassignedWorker[];
}

export const GapReportModal: React.FC<GapReportModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  selectedDate,
  selectedPost,
  teamChanges,
  inactiveAssigned,
  unassignedPersonnel
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/40 backdrop-blur-sm animate-fade-in">
      <div 
        id="gap-report-container" 
        className="bg-white border-2 border-gray-950 rounded-2xl w-full max-w-3xl shadow-[8px_8px_0px_0px_rgba(20,20,20,1)] overflow-hidden flex flex-col max-h-[85vh] animate-scale-up"
      >
        {/* Modal Header */}
        <div className="bg-gray-950 p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
            <span className="text-xs font-black uppercase tracking-widest text-amber-450">Assistant de Planification</span>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-transform duration-200 active:scale-95 border border-gray-800 p-1 rounded hover:bg-gray-900 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Sub-Header */}
        <div className="border-b border-gray-150 p-5 bg-gradient-to-r from-gray-50 to-neutral-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg md:text-xl font-black uppercase tracking-tight text-gray-900">
              📊 Rapport d'écarts & Contrôle
            </h2>
            <p className="text-[10px] md:text-[11px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1.5 mt-0.5">
              <Calendar className="w-4 h-4 text-[#00BFFF]" />
              {selectedPost} — {selectedDate} (SMI - Imiter Minière)
            </p>
          </div>
          <div className="text-[9px] font-black uppercase tracking-wider bg-amber-100 text-amber-900 px-3 py-1.5 border border-amber-200 rounded-lg flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Contrôle & Validation requis</span>
          </div>
        </div>

        {/* Modal Content - Scrollable */}
        <div className="p-5 overflow-y-auto space-y-6 flex-1">
          
          {/* Subheader summary tip */}
          <p className="text-xs text-gray-500 font-medium">
            Voici l'analyse comparative de la proposition d'ordonnancement par rapport à la veille (ou plan de rotation de référence). Examinez les écarts opérationnels et les alertes de ressources avant d'appliquer.
          </p>

          {/* Alert Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* INACTIVE ASSIGNED WARNINGS */}
            <div className="bg-red-50/70 border border-red-200 p-4 rounded-xl space-y-2.5">
              <h3 className="text-xs font-black uppercase tracking-wider text-red-900 flex items-center gap-1.5">
                <UserX className="w-4.5 h-4.5" />
                <span>Ressources Inactives / Absentes ({inactiveAssigned.length})</span>
              </h3>
              {inactiveAssigned.length === 0 ? (
                <p className="text-[10px] text-emerald-800 font-bold uppercase tracking-wide">
                  ✓ Aucun personnel inactif ou absent affecté.
                </p>
              ) : (
                <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                  {inactiveAssigned.map((item, idx) => (
                    <div key={idx} className="bg-white p-2 border border-red-150 rounded-lg text-[10px] flex items-center justify-between">
                      <div>
                        <span className="font-extrabold text-gray-900">{item.name}</span>
                        <span className="text-neutral-405 font-mono ml-1.5">({item.matricule})</span>
                      </div>
                      <span className="text-[8.5px] font-black uppercase bg-red-100 text-red-800 px-1.5 py-0.5 rounded">
                        {item.role}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* UNASSIGNED PERSONNEL LIST */}
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2.5">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <AlertTriangle className="w-4.5 h-4.5 text-amber-500" />
                <span>Membres Disponibles Non Affectés ({unassignedPersonnel.length})</span>
              </h3>
              {unassignedPersonnel.length === 0 ? (
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">
                  ✓ Tous les effectifs de ce shift ont été affectés.
                </p>
              ) : (
                <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                  {unassignedPersonnel.map((item, idx) => (
                    <div key={idx} className="bg-white p-2 border border-slate-150 rounded-lg text-[10px] flex items-center justify-between">
                      <div>
                        <span className="font-extrabold text-gray-900">{item.name}</span>
                        <span className="text-neutral-450 font-mono ml-1">{item.matricule}</span>
                      </div>
                      <div className="flex gap-1">
                        <span className="text-[7.5px] font-black uppercase bg-slate-100 text-slate-600 px-1.5 py-0.5">
                          {item.sector}
                        </span>
                        <span className="text-[7.5px] font-mono bg-blue-50 text-blue-850 px-1.5 py-0.5">
                          {item.fonction}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* TEAM CHANGES COMPARISON TABLE */}
          <div className="space-y-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-gray-805 flex items-center gap-1.5">
              <ArrowRightLeft className="w-4.5 h-4.5 text-[#00BFFF]" />
              <span>Changements opérationnels journaliers ({teamChanges.length})</span>
            </h3>

            {teamChanges.length === 0 ? (
              <div className="bg-emerald-50/40 border border-emerald-150 p-4 rounded-xl text-center">
                <p className="text-xs text-emerald-800 font-bold uppercase tracking-wide">
                  ✓ Reconduction identique du plan précédent. Aucun changement opérationnel détecté.
                </p>
              </div>
            ) : (
              <div className="border border-gray-200 rounded-xl overflow-hidden shadow-sm max-h-[220px] overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-100 text-[9px] uppercase tracking-wider text-gray-500 font-black border-b border-gray-200">
                      <th className="px-3 py-2.5">Chantier / Poste</th>
                      <th className="px-3 py-2.5">Rôle / Tâche</th>
                      <th className="px-3 py-2.5">Prise de Poste d'Origine</th>
                      <th className="px-3 py-2.5" />
                      <th className="px-3 py-2.5">Nouvelle Affectation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-150 text-[10px]">
                    {teamChanges.map((change, index) => (
                      <tr key={index} className="hover:bg-gray-50/50">
                        <td className="px-3 py-2.5 font-bold text-gray-900">{change.chantierName}</td>
                        <td className="px-3 py-2.5">
                          <span className="bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded text-[8px] font-black uppercase">
                            {change.role}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-red-650 font-bold">{change.oldName || '(Inoccupé)'}</td>
                        <td className="px-2 py-2.5 text-gray-400">➔</td>
                        <td className="px-3 py-2.5 text-emerald-700 font-extrabold">{change.newName || '(Laissé vacant)'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer / Actions */}
        <div className="border-t border-gray-150 p-4 bg-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-[9px] text-gray-400 uppercase font-bold tracking-wider">
            SMI - HydroMines Système d'Aide à la Décision
          </p>
          <div className="flex gap-2 justify-end">
            <button
              onClick={onClose}
              className="bg-white border border-gray-300 hover:bg-gray-100 text-gray-800 font-extrabold px-4 py-2 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
            >
              Annuler
            </button>
            <button
              onClick={onConfirm}
              className="bg-gray-950 text-white font-extrabold px-5 py-2.5 rounded-xl text-xs uppercase tracking-widest hover:bg-gray-900 active:translate-y-px transition-all cursor-pointer shadow-sm flex items-center gap-2"
            >
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <span>Valider la proposition</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
