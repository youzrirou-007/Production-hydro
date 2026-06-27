import React, { useState } from 'react';
import { 
  RotateCcw, Save, Sparkles, AlertTriangle, Info, CheckCircle, Clock, Trash2
} from 'lucide-react';
import { formatFrenchDate } from '../../lib/productionUtils';

interface ProductionHeaderProps {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  saveStatus: 'idle' | 'saving' | 'saved' | 'error';
  isMonthClosed: boolean;
  exactPlanMissing: boolean;
  forceFreeEntryApproved: boolean;
  setForceFreeEntryApproved: (val: boolean) => void;
  draftAvailable: boolean;
  restoreDraft: () => void;
  discardDraft: () => void;
  isTemplateLoaded: boolean;
  templateDateHint: string;
  p1MinageRows: any[];
  p2MinageRows: any[];
  p3MinageRows: any[];
  p1ExtractionRows: any[];
  p2ExtractionRows: any[];
  p3ExtractionRows: any[];
  loadGlobalWorkbook: () => void;
  saveWorkbook: () => void;
  exportPlanningToProduction: (date: string) => void;
  allProductionDocs: any[];
  unexplainedGaps: number;
}

export const ProductionHeader: React.FC<ProductionHeaderProps> = ({
  selectedDate,
  setSelectedDate,
  saveStatus,
  isMonthClosed,
  exactPlanMissing,
  forceFreeEntryApproved,
  setForceFreeEntryApproved,
  draftAvailable,
  restoreDraft,
  discardDraft,
  isTemplateLoaded,
  templateDateHint,
  p1MinageRows,
  p2MinageRows,
  p3MinageRows,
  p1ExtractionRows,
  p2ExtractionRows,
  p3ExtractionRows,
  loadGlobalWorkbook,
  saveWorkbook,
  exportPlanningToProduction,
  allProductionDocs,
  unexplainedGaps
}) => {
  const [bridgeDate, setBridgeDate] = useState('');

  const totalMeterage = (
    p1MinageRows.reduce((acc, r) => acc + (r.reel?.chantierId ? (r.reel.realMeterage ?? r.reel.meterage ?? 0) : 0), 0) +
    p2MinageRows.reduce((acc, r) => acc + (r.reel?.chantierId ? (r.reel.realMeterage ?? r.reel.meterage ?? 0) : 0), 0) +
    p3MinageRows.reduce((acc, r) => acc + (r.reel?.chantierId ? (r.reel.realMeterage ?? r.reel.meterage ?? 0) : 0), 0)
  );

  const totalWagons = (
    p1ExtractionRows.reduce((acc, r) => acc + (r.reel?.wagonsActual || 0), 0) +
    p2ExtractionRows.reduce((acc, r) => acc + (r.reel?.wagonsActual || 0), 0) +
    p3ExtractionRows.reduce((acc, r) => acc + (r.reel?.wagonsActual || 0), 0)
  );

  const status = allProductionDocs.find(doc => doc.id === selectedDate)?.status;

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-2xl p-4 md:p-6 shadow-xs flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="space-y-1">
          <span className="text-[10px] font-black text-[#b8860b] uppercase tracking-widest block font-mono">
            SMI • BUREAU TECHNIQUE DE PRODUCTION
          </span>
          <h1 className="text-xl font-extrabold tracking-tight text-slate-900 uppercase">
            Registre Journalier d'Avancement
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Saisie de la production réelle, suivi des explosifs et réconciliation Plan vs Réel
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex flex-col gap-0.5">
            <span className="text-[8px] font-black uppercase text-slate-400 block tracking-wider font-mono">
              JOURNÉE D'EXPLOITATION
            </span>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-slate-50 text-slate-900 font-black text-xs border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-1 focus:ring-[#b8860b]/50 cursor-pointer shadow-xs"
            />
          </div>

          <div className="flex items-center gap-2 mt-auto">
            <div className="bg-amber-50/50 px-3 py-1.5 border border-amber-200/50 text-right shadow-2xs rounded-xl">
              <span className="text-[8px] font-black text-amber-800 uppercase block tracking-wider">Métrage Arraché</span>
              <span className="text-xs font-black text-slate-800 block font-mono">
                {totalMeterage.toFixed(1)} m
              </span>
            </div>
            <div className="bg-amber-50/50 px-3 py-1.5 border border-amber-200/50 text-right shadow-2xs rounded-xl">
              <span className="text-[8px] font-black text-amber-800 uppercase block tracking-wider">Total Wagons</span>
              <span className="text-xs font-black text-slate-800 block font-mono">
                {totalWagons} u
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200/60 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-[9px] text-amber-800 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-lg font-black uppercase">
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span> Actif en Ligne
          </span>
          <span className="text-[9px] font-bold text-slate-400 block uppercase tracking-wider">
            Enregistrements d'avancement SMI • Sécurisés par Firestore
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadGlobalWorkbook}
            className="bg-gray-50 hover:bg-amber-50/50 text-gray-700 hover:text-[#b8860b] border border-gray-200 hover:border-amber-200 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <RotateCcw className="w-3 h-3 text-[#b8860b]" /> Recharger
          </button>
          
          <button
            onClick={saveWorkbook}
            disabled={saveStatus === 'saving' || isMonthClosed}
            className={`font-black px-4 py-1 rounded-lg text-[9px] uppercase tracking-wider flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer ${
              isMonthClosed 
                ? 'bg-red-700 text-white cursor-not-allowed opacity-50 border border-red-800' 
                : 'bg-gradient-to-r from-[#b8860b] to-[#ffd700] hover:from-[#a07409] hover:to-[#e5bf4e] text-slate-950'
            }`}
          >
            <Save className="w-3.5 h-3.5 text-slate-950" /> 
            {isMonthClosed ? '🔒 MOIS CLÔTURÉ (Lecture seule)' : saveStatus === 'saving' ? 'Gravure...' : 'Graver au Registre SMI'}
          </button>
        </div>
      </div>

      {status === 'scelle' && unexplainedGaps > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-center gap-3 animate-fade-in">
          <AlertTriangle className="text-amber-600 w-5 h-5 flex-shrink-0" />
          <div className="flex-1">
            <span className="text-amber-800 text-sm">
              ⚠️ Ce registre comporte <strong>{unexplainedGaps}</strong> écart(s) non expliqué(s).
            </span>
          </div>
          <button 
            onClick={() => {
              window.sessionStorage.setItem('goto-explications-date', selectedDate);
              window.dispatchEvent(new CustomEvent('navigate-to-tab', { detail: { tab: 'explications' } }));
            }}
            className="text-amber-700 underline text-sm font-semibold hover:text-amber-900 whitespace-nowrap"
          >
            Voir les explications →
          </button>
        </div>
      )}

      {exactPlanMissing && (
        <div className="bg-red-50/60 border border-red-200 p-3 rounded-xl flex flex-col sm:flex-row gap-3 items-center justify-between shadow-2xs">
          <div className="flex gap-2.5 items-center">
            <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            <div>
              <h4 className="text-[11px] font-black uppercase text-red-950 tracking-wider">⚠️ Aucun plan de référence</h4>
              <p className="text-[10px] text-red-800 font-bold">
                Saisie libre sans planification pour la journée du {formatFrenchDate(selectedDate)}.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={bridgeDate}
              onChange={(e) => setBridgeDate(e.target.value)}
              className="bg-white text-slate-900 font-extrabold text-[10px] border border-slate-200 rounded-md px-1.5 py-0.5"
            />
            <button
              onClick={() => exportPlanningToProduction(bridgeDate)}
              className="bg-red-650 hover:bg-red-700 text-white font-extrabold uppercase text-[9px] tracking-wider px-3 py-1 rounded-lg cursor-pointer transition-colors"
            >
              Importer Plan
            </button>
            {!forceFreeEntryApproved && (
              <button
                onClick={() => setForceFreeEntryApproved(true)}
                className="bg-slate-800 hover:bg-slate-900 text-white font-extrabold uppercase text-[9px] tracking-wider px-3 py-1 rounded-lg cursor-pointer"
              >
                Saisie Libre
              </button>
            )}
          </div>
        </div>
      )}

      {draftAvailable && (
        <div className="bg-amber-50 border border-amber-200 p-3 flex flex-col sm:flex-row gap-3 items-center justify-between rounded-xl shadow-2xs">
          <div className="flex gap-2.5 items-center">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <h4 className="text-[11px] font-black uppercase text-amber-950 tracking-wider">📝 Brouillon détecté</h4>
              <p className="text-[10px] text-amber-800 font-bold">
                Des modifications locales non sauvegardées existent pour le {selectedDate.split('-').reverse().join('/')}.
              </p>
            </div>
          </div>
          <div className="flex gap-1.5 text-xs font-black shrink-0">
            <button
              onClick={restoreDraft}
              className="bg-amber-600 hover:bg-amber-700 text-white px-3 py-1 rounded-lg font-bold uppercase text-[9px] cursor-pointer"
            >
              Restaurer
            </button>
            <button
              onClick={discardDraft}
              className="bg-transparent hover:bg-slate-200 text-slate-500 px-2 py-1 rounded-lg font-bold uppercase text-[9px] cursor-pointer"
            >
              Ignorer
            </button>
          </div>
        </div>
      )}

      {isTemplateLoaded && (
        <div className="bg-sky-50 border border-sky-200 rounded-xl p-3 flex gap-2.5 items-center">
          <Info className="w-4 h-4 text-sky-600 shrink-0" />
          <div>
            <h4 className="text-[11px] font-black uppercase text-sky-950 tracking-wider">
              Plan de référence pré-chargé ({templateDateHint})
            </h4>
            <p className="text-[10px] text-sky-800 font-medium">
              Lignes pré-remplies automatiquement à partir de la planification du {templateDateHint}.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
