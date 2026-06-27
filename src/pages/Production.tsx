import React, { useState } from 'react';
import { useProduction } from '../hooks/useProduction';
import { useProductionActions } from '../hooks/useProductionActions';
import { ProductionHeader } from '../components/production/ProductionHeader';
import { ProductionPosteTabs } from '../components/production/ProductionPosteTabs';
import { ProductionMinageTable } from '../components/production/ProductionMinageTable';
import { ProductionDeblayageTable } from '../components/production/ProductionDeblayageTable';
import { ProductionExtractionTable } from '../components/production/ProductionExtractionTable';
import { ProductionMaintenanceTable } from '../components/production/ProductionMaintenanceTable';
import { ConfirmModal, InfoModal, SuccessToast } from '../components/production/ProductionModals';
import { ProductionHistoryTable } from '../components/production/ProductionHistoryTable';

export function Production() {
  const [selectedDate, setSelectedDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [viewMode, setViewMode] = useState<'entry' | 'history'>('entry');
  const [confirmModal, setConfirmModal] = useState<{ title: string; message: string; onConfirm: () => void; onCancel?: () => void } | null>(null);
  const [infoModal, setInfoModal] = useState<{ title: string; message: string; type: 'error' | 'info' | 'success' } | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successToastMsg, setSuccessToastMsg] = useState('');
  const [copyStatus, setCopyStatus] = useState<'idle' | 'copying' | 'copied' | 'no_data' | 'error'>('idle');

  const prodState = useProduction(selectedDate, setSelectedDate);
  const {
    activeSheetTab, setActiveSheetTab, selectedPost, setSelectedPost, loading, saveStatus,
    draftAvailable, restoreDraft, isMonthClosed, exactPlanMissing, forceFreeEntryApproved,
    setForceFreeEntryApproved, isTemplateLoaded, templateDateHint, dataHistory, chantiers,
    activeEmployees, platformSettings, allProductionDocs, unexplainedGaps, getPostState, loadGlobalWorkbook
  } = prodState;

  const safeConfirm = (message: string, onConfirm: () => void) => setConfirmModal({ title: "Validation Requise", message, onConfirm });
  const safeAlert = (message: string, title = "Alerte Bureau Technique", type: 'error' | 'info' | 'success' = 'info') => setInfoModal({ title, message, type });

  const actions = useProductionActions(prodState, safeConfirm, safeAlert, setSuccessToastMsg, setShowSuccessToast, setCopyStatus);
  const cur = getPostState(selectedPost);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 space-y-6">
      <div className="flex gap-2 p-1 bg-slate-200/60 rounded-xl max-w-xs">
        <button onClick={() => setViewMode('entry')} className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${viewMode === 'entry' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}>Saisie Active</button>
        <button onClick={() => setViewMode('history')} className={`flex-1 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all ${viewMode === 'history' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-600 hover:text-slate-900'}`}>Archives</button>
      </div>

      {viewMode === 'entry' ? (
        <div className="space-y-6 animate-fade-in">
          <ProductionHeader selectedDate={selectedDate} setSelectedDate={setSelectedDate} saveStatus={saveStatus} isMonthClosed={isMonthClosed} exactPlanMissing={exactPlanMissing} forceFreeEntryApproved={forceFreeEntryApproved} setForceFreeEntryApproved={setForceFreeEntryApproved} draftAvailable={draftAvailable} restoreDraft={restoreDraft} discardDraft={actions.discardDraft} isTemplateLoaded={isTemplateLoaded} templateDateHint={templateDateHint} p1MinageRows={getPostState('Poste 1').minageRows} p2MinageRows={getPostState('Poste 2').minageRows} p3MinageRows={getPostState('Poste 3').minageRows} p1ExtractionRows={getPostState('Poste 1').extractionRows} p2ExtractionRows={getPostState('Poste 2').extractionRows} p3ExtractionRows={getPostState('Poste 3').extractionRows} loadGlobalWorkbook={loadGlobalWorkbook} saveWorkbook={actions.saveWorkbook} exportPlanningToProduction={actions.exportPlanningToProduction} allProductionDocs={allProductionDocs} unexplainedGaps={unexplainedGaps} />
          
          <div className="bg-white border border-slate-200 rounded-2xl p-4 md:p-6 shadow-xs space-y-6">
            <div className="flex border-b border-slate-100 gap-6">
              {(['minage', 'deblayage', 'extraction', 'maintenance'] as const).map(tab => (
                <button key={tab} onClick={() => setActiveSheetTab(tab)} className={`pb-3 font-black text-xs uppercase tracking-wider border-b-2 transition-all cursor-pointer ${activeSheetTab === tab ? 'border-[#b8860b] text-slate-950' : 'border-transparent text-slate-400 hover:text-slate-700'}`}>{tab === 'minage' ? '🔥 Forage & Tir' : tab === 'deblayage' ? '🚜 LHD / Déblayage' : tab === 'extraction' ? '🚠 Wagons / Extraction' : '🛠️ Maintenance'}</button>
              ))}
            </div>

            <ProductionPosteTabs selectedPost={selectedPost} setSelectedPost={setSelectedPost} activeSheetTab={activeSheetTab} copyYesterdayShiftTeam={actions.copyYesterdayShiftTeam} standardizeHours={actions.standardizeHours} copyAllMinagePlanToReel={actions.copyAllMinagePlanToReel} copyAllDeblayagePlanToReel={actions.copyAllDeblayagePlanToReel} copyAllExtractionPlanToReel={actions.copyAllExtractionPlanToReel} copyStatus={copyStatus} />

            {loading ? (
              <div className="py-20 text-center text-xs font-black uppercase text-slate-400 tracking-widest animate-pulse">SMI : Extraction du Registre...</div>
            ) : (
              <div className="space-y-6">
                {activeSheetTab === 'minage' && <ProductionMinageTable postName={selectedPost} minageRows={cur.minageRows} sectorChefs={cur.sectorChefs} chantiers={chantiers} activeEmployees={activeEmployees} structureEditMode={false} addMinageRowForSector={actions.addMinageRowForSector} deleteMinageRow={actions.deleteMinageRow} copyMinagePlanToReel={actions.copyMinagePlanToReel} updateMinageCell={actions.updateMinageCell} updateSectorChief={actions.updateSectorChief} />}
                {activeSheetTab === 'deblayage' && <ProductionDeblayageTable postName={selectedPost} deblayageRows={cur.deblayageRows} chantiers={chantiers} activeEmployees={activeEmployees} engines={platformSettings.engines} oils={platformSettings.oils} addDeblayageRow={actions.addDeblayageRow} deleteDeblayageRow={actions.deleteDeblayageRow} copyDeblayagePlanToReel={actions.copyDeblayagePlanToReel} updateDeblayageCell={actions.updateDeblayageCell} />}
                {activeSheetTab === 'extraction' && <ProductionExtractionTable postName={selectedPost} extractionRows={cur.extractionRows} addExtractionRow={actions.addExtractionRow} deleteExtractionRow={actions.deleteExtractionRow} copyExtractionPlanToReel={actions.copyExtractionPlanToReel} updateExtractionCell={actions.updateExtractionCell} />}
                {activeSheetTab === 'maintenance' && <ProductionMaintenanceTable postName={selectedPost} maintenanceRows={cur.maintenanceRows} activeEmployees={activeEmployees} engines={platformSettings.engines} addMaintenanceRow={actions.addMaintenanceRow} deleteMaintenanceRow={actions.deleteMaintenanceRow} updateMaintenanceCell={actions.updateMaintenanceCell} />}
              </div>
            )}
          </div>
        </div>
      ) : (
        <ProductionHistoryTable dataHistory={dataHistory} />
      )}

      <ConfirmModal modal={confirmModal} onClose={() => setConfirmModal(null)} />
      <InfoModal modal={infoModal} onClose={() => setInfoModal(null)} />
      <SuccessToast show={showSuccessToast} message={successToastMsg} onClose={() => setShowSuccessToast(false)} />
    </div>
  );
}
