import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ExcelRow, createEmptyMinage, createEmptyDeblayage, createEmptyExtraction, createEmptyMaintenance, generateFromPlan, filterRealPlannedRows, buildDefaultSectorChefs, formatFrenchDate } from '../lib/productionUtils';
import { ExcelMinage, ExcelDeblayage, ExcelExtraction, ExcelMaintenance } from '../types/mining';
import { format } from 'date-fns';

interface ProdState {
  user: any;
  profile: any;
  selectedDate: string;
  isMonthClosed: boolean;
  activeEmployees: any[];
  chantiers: any[];
  plannings: any[];
  platformSettings: any;
  getPostState: (postName: string) => any;
  setSaveStatus: (status: 'idle' | 'saving' | 'saved' | 'error') => void;
  setDraftAvailable: (val: boolean) => void;
  setIsTemplateLoaded: (val: boolean) => void;
  setTemplateDateHint: (val: string) => void;
  setExactPlanMissing: (val: boolean) => void;
  setForceFreeEntryApproved: (val: boolean) => void;
  loadGlobalWorkbook: () => void;
}

export const useProductionActions = (
  state: ProdState,
  safeConfirm: (message: string, onConfirm: () => void) => void,
  safeAlert: (message: string, title?: string, type?: 'error' | 'info' | 'success') => void,
  setSuccessToastMsg: (msg: string) => void,
  setShowSuccessToast: (val: boolean) => void,
  setCopyStatus: (status: 'idle' | 'copying' | 'copied' | 'no_data' | 'error') => void
) => {
  const {
    user, profile, selectedDate, isMonthClosed, activeEmployees, chantiers, plannings, platformSettings,
    getPostState, setSaveStatus, setDraftAvailable, setIsTemplateLoaded, setTemplateDateHint,
    setExactPlanMissing, setForceFreeEntryApproved, loadGlobalWorkbook
  } = state;

  const copyMinagePlanToReel = (postName: string, originalIndex: number) => {
    const pState = getPostState(postName);
    const clone = [...pState.minageRows];
    const row = clone[originalIndex];
    if (!row) return;

    const performCopy = () => {
      const realH = row.plan.plannedHoles || row.reel.realHoles || 0;
      const chargedH = row.plan.plannedHoles || row.reel.chargedHoles || 0;
      const emptyH = Math.max(0, realH - chargedH);

      const updatedReel = {
        ...row.reel,
        chantierId: row.plan.chantierId || row.reel.chantierId || '',
        minerMatricule: row.plan.minerMatricule || row.reel.minerMatricule || '',
        minerName: row.plan.minerName || row.reel.minerName || '',
        assistantMatricule: row.plan.assistantMatricule || row.reel.assistantMatricule || '',
        assistantName: row.plan.assistantName || row.reel.assistantName || '',
        gallerySize: row.plan.gallerySize || row.reel.gallerySize || 12,
        realHoles: realH,
        chargedHoles: chargedH,
        emptyHoles: emptyH,
        realRounds: row.plan.plannedRounds || row.reel.realRounds || 0,
        realMeterage: row.plan.plannedRounds ? (row.plan.meterage || row.plan.plannedRounds * 1.7) : row.reel.realMeterage || 0,
        meterage: row.plan.plannedRounds ? (row.plan.meterage || row.plan.plannedRounds * 1.7) : row.reel.meterage || 0,
      };
      clone[originalIndex] = { ...row, reel: updatedReel };
      pState.setMinageRows(clone);
    };

    performCopy();
  };

  const copyAllMinagePlanToReel = (postName: string) => {
    const pState = getPostState(postName);
    const updated = pState.minageRows.map((row: any) => {
      const realH = row.plan.plannedHoles || row.reel.realHoles || 0;
      const chargedH = row.plan.plannedHoles || row.reel.chargedHoles || 0;
      const emptyH = Math.max(0, realH - chargedH);

      const updatedReel = {
        ...row.reel,
        chantierId: row.plan.chantierId || row.reel.chantierId || '',
        minerMatricule: row.plan.minerMatricule || row.reel.minerMatricule || '',
        minerName: row.plan.minerName || row.reel.minerName || '',
        assistantMatricule: row.plan.assistantMatricule || row.reel.assistantMatricule || '',
        assistantName: row.plan.assistantName || row.reel.assistantName || '',
        gallerySize: row.plan.gallerySize || row.reel.gallerySize || 12,
        realHoles: realH,
        chargedHoles: chargedH,
        emptyHoles: emptyH,
        realRounds: row.plan.plannedRounds || row.reel.realRounds || 0,
        realMeterage: row.plan.plannedRounds ? (row.plan.meterage || row.plan.plannedRounds * 1.7) : row.reel.realMeterage || 0,
        meterage: row.plan.plannedRounds ? (row.plan.meterage || row.plan.plannedRounds * 1.7) : row.reel.meterage || 0,
      };
      return { ...row, reel: updatedReel };
    });
    pState.setMinageRows(updated);
  };

  const copyDeblayagePlanToReel = (postName: string, originalIndex: number) => {
    const pState = getPostState(postName);
    const clone = [...pState.deblayageRows];
    const row = clone[originalIndex];
    if (!row) return;

    const performCopy = () => {
      const updatedReel = {
        ...row.reel,
        chantierId: row.plan.chantierId || row.reel.chantierId || '',
        driverMatricule: row.plan.driverMatricule || row.reel.driverMatricule || '',
        driverName: row.plan.driverName || row.reel.driverName || '',
        engineId: row.plan.engineId || row.reel.engineId || '',
        engineCode: row.plan.engineCode || row.reel.engineCode || '',
        godets: row.plan.godets || row.reel.godets || 0,
        volumeEstimated: row.plan.volumeEstimated || row.reel.volumeEstimated || 0,
        gasoil: row.plan.gasoil || row.reel.gasoil || 0,
        startTime: row.plan.startTime || row.reel.startTime,
        endTime: row.plan.endTime || row.reel.endTime,
      };
      clone[originalIndex] = { ...row, reel: updatedReel };
      pState.setDeblayageRows(clone);
    };

    performCopy();
  };

  const copyAllDeblayagePlanToReel = (postName: string) => {
    const pState = getPostState(postName);
    const updated = pState.deblayageRows.map((row: any) => ({
      ...row,
      reel: {
        ...row.reel,
        chantierId: row.plan.chantierId || row.reel.chantierId || '',
        driverMatricule: row.plan.driverMatricule || row.reel.driverMatricule || '',
        driverName: row.plan.driverName || row.reel.driverName || '',
        engineId: row.plan.engineId || row.reel.engineId || '',
        engineCode: row.plan.engineCode || row.reel.engineCode || '',
        godets: row.plan.godets || row.reel.godets || 0,
        volumeEstimated: row.plan.volumeEstimated || row.reel.volumeEstimated || 0,
        gasoil: row.plan.gasoil || row.reel.gasoil || 0,
        startTime: row.plan.startTime || row.reel.startTime,
        endTime: row.plan.endTime || row.reel.endTime,
      }
    }));
    pState.setDeblayageRows(updated);
  };

  const copyExtractionPlanToReel = (postName: string, originalIndex: number) => {
    const pState = getPostState(postName);
    const clone = [...pState.extractionRows];
    const row = clone[originalIndex];
    if (!row) return;

    const performCopy = () => {
      const updatedReel = {
        ...row.reel,
        treuilliste: row.plan.treuilliste || row.reel.treuilliste || '',
        equipier1: row.plan.equipier1 || row.reel.equipier1 || '',
        equipier2: row.plan.equipier2 || row.reel.equipier2 || '',
        equipier3: row.plan.equipier3 || row.reel.equipier3 || '',
        equipier4: row.plan.equipier4 || row.reel.equipier4 || '',
        wagonsActual: row.plan.wagonsActual ?? row.reel.wagonsActual ?? 0,
        wagonsTarget: row.plan.wagonsTarget ?? row.reel.wagonsTarget ?? 48,
        sterileBureImiterEst: row.plan.sterileBureImiterEst ?? row.reel.sterileBureImiterEst ?? 0,
        startTime: row.plan.startTime || row.reel.startTime,
        endTime: row.plan.endTime || row.reel.endTime,
      };
      clone[originalIndex] = { ...row, reel: updatedReel };
      pState.setExtractionRows(clone);
    };

    performCopy();
  };

  const copyAllExtractionPlanToReel = (postName: string) => {
    const pState = getPostState(postName);
    const updated = pState.extractionRows.map((row: any) => ({
      ...row,
      reel: {
        ...row.reel,
        treuilliste: row.plan.treuilliste || row.reel.treuilliste || '',
        equipier1: row.plan.equipier1 || row.reel.equipier1 || '',
        equipier2: row.plan.equipier2 || row.reel.equipier2 || '',
        equipier3: row.plan.equipier3 || row.reel.equipier3 || '',
        equipier4: row.plan.equipier4 || row.reel.equipier4 || '',
        wagonsActual: row.plan.wagonsActual ?? row.reel.wagonsActual ?? 0,
        wagonsTarget: row.plan.wagonsTarget ?? row.reel.wagonsTarget ?? 48,
        sterileBureImiterEst: row.plan.sterileBureImiterEst ?? row.reel.sterileBureImiterEst ?? 0,
        startTime: row.plan.startTime || row.reel.startTime,
        endTime: row.plan.endTime || row.reel.endTime,
      }
    }));
    pState.setExtractionRows(updated);
  };

  const addMinageRowForSector = (postName: string, sector: string) => {
    const pState = getPostState(postName);
    pState.setMinageRows([
      ...pState.minageRows,
      {
        rowId: `minage_add_${Math.random().toString(36).substr(2, 9)}`,
        plan: createEmptyMinage(sector),
        reel: createEmptyMinage(sector)
      }
    ]);
  };

  const deleteMinageRow = (postName: string, index: number) => {
    const pState = getPostState(postName);
    pState.setMinageRows((prev: any[]) => prev.filter((_, i) => i !== index));
  };

  const updateMinageCell = (postName: string, index: number, field: keyof ExcelMinage, value: any) => {
    const pState = getPostState(postName);
    const clone = [...pState.minageRows];
    const rowWrapper = clone[index];
    const updatedReel = { ...rowWrapper.reel, [field]: value };
    
    if (field === 'minerMatricule') {
      const emp = activeEmployees.find(e => e.matricule?.toUpperCase() === String(value).trim().toUpperCase());
      updatedReel.minerName = emp ? `${emp.nom} ${emp.prenom}` : 'Inconnu';
    }
    if (field === 'assistantMatricule') {
      const emp = activeEmployees.find(e => e.matricule?.toUpperCase() === String(value).trim().toUpperCase());
      updatedReel.assistantName = emp ? `${emp.nom} ${emp.prenom}` : 'Inconnu';
    }
    if (field === 'realRounds') {
      const advanceFactor = rowWrapper.plan?.barType === '2.4m' || rowWrapper.reel?.barType === '2.4m' ? 2.3 : 1.7;
      const computed = Number(value) * advanceFactor;
      updatedReel.meterage = computed;
      updatedReel.realMeterage = computed;
    }
    if (field === 'realHoles' || field === 'chargedHoles') {
      const realH = field === 'realHoles' ? Number(value) : (Number(updatedReel.realHoles) || 0);
      const chargedH = field === 'chargedHoles' ? Number(value) : (Number(updatedReel.chargedHoles) || 0);
      updatedReel.emptyHoles = Math.max(0, realH - chargedH);
    }
    if (field === 'chantierId') {
      const foundChan = chantiers.find(c => c.id === value);
      if (foundChan && foundChan.sector) {
        updatedReel.sector = foundChan.sector;
        if (!pState.chiefMatricule) {
          const activeChefs = activeEmployees.filter(e => e.fonction === 'CHEF' && e.status === 'actif');
          const sectorChef = activeChefs.find(e => (e.sector || '').toLowerCase() === foundChan.sector.toLowerCase());
          if (sectorChef) {
            pState.setChiefMatricule(sectorChef.matricule || '');
            pState.setChiefName(`${sectorChef.nom || ''} ${sectorChef.prenom || ''}`.trim());
          }
        }
      }
    }
    clone[index] = { ...rowWrapper, reel: updatedReel };
    pState.setMinageRows(clone);
  };

  const updateSectorChief = (postName: string, sectorName: string, type: 'chief' | 'second', matricule: string, name: string) => {
    const pState = getPostState(postName);
    const sectorChefs = pState.sectorChefs || {};
    const updated = {
      ...sectorChefs,
      [sectorName]: {
        ...(sectorChefs[sectorName] || { chiefMatricule: '', chiefName: '', secondChiefMatricule: '', secondChiefName: '' }),
        ...(type === 'chief' ? { chiefMatricule: matricule, chiefName: name } : { secondChiefMatricule: matricule, secondChiefName: name })
      }
    };
    pState.setSectorChefs(updated);
  };

  const addDeblayageRow = (postName: string) => {
    const pState = getPostState(postName);
    let start = '07:00'; let end = '14:00';
    if (postName === 'Poste 1') { start = '07:00'; end = '14:00'; }
    else if (postName === 'Poste 2') { start = '15:00'; end = '22:00'; }
    else if (postName === 'Poste 3') { start = '23:00'; end = '06:00'; }

    pState.setDeblayageRows([
      ...pState.deblayageRows,
      {
        rowId: `deblayage_add_${Math.random().toString(36).substr(2, 9)}`,
        plan: createEmptyDeblayage('Imiter 1', start, end),
        reel: createEmptyDeblayage('Imiter 1', start, end)
      }
    ]);
  };

  const deleteDeblayageRow = (postName: string, index: number) => {
    const pState = getPostState(postName);
    pState.setDeblayageRows((prev: any[]) => prev.filter((_, i) => i !== index));
  };

  const updateDeblayageCell = (postName: string, index: number, field: keyof ExcelDeblayage, value: any) => {
    const pState = getPostState(postName);
    const clone = [...pState.deblayageRows];
    const rowWrapper = clone[index];
    const updatedReel = { ...rowWrapper.reel, [field]: value };

    if (field === 'driverMatricule') {
      const emp = activeEmployees.find(e => e.matricule?.toUpperCase() === String(value).trim().toUpperCase());
      updatedReel.driverName = emp ? `${emp.nom} ${emp.prenom}` : 'Inconnu';
    }
    if (field === 'engineId') {
      updatedReel.engineCode = String(value);
    }
    if (field === 'godets') {
      updatedReel.volumeEstimated = Number(value) * 1.5;
    }
    clone[index] = { ...rowWrapper, reel: updatedReel };
    pState.setDeblayageRows(clone);
  };

  const addExtractionRow = (postName: string) => {
    const pState = getPostState(postName);
    pState.setExtractionRows([
      ...pState.extractionRows,
      {
        rowId: `extraction_add_${Math.random().toString(36).substr(2, 9)}`,
        plan: createEmptyExtraction(),
        reel: createEmptyExtraction()
      }
    ]);
  };

  const deleteExtractionRow = (postName: string, index: number) => {
    const pState = getPostState(postName);
    pState.setExtractionRows((prev: any[]) => prev.filter((_, i) => i !== index));
  };

  const updateExtractionCell = (postName: string, index: number, field: keyof ExcelExtraction, value: any) => {
    const pState = getPostState(postName);
    const clone = [...pState.extractionRows];
    const rowWrapper = clone[index];
    const updatedReel = { ...rowWrapper.reel, [field]: value };
    clone[index] = { ...rowWrapper, reel: updatedReel };
    pState.setExtractionRows(clone);
  };

  const addMaintenanceRow = (postName: string) => {
    const pState = getPostState(postName);
    pState.setMaintenanceRows([
      ...pState.maintenanceRows,
      {
        rowId: `maintenance_add_${Math.random().toString(36).substr(2, 9)}`,
        plan: createEmptyMaintenance(),
        reel: createEmptyMaintenance()
      }
    ]);
  };

  const deleteMaintenanceRow = (postName: string, index: number) => {
    const pState = getPostState(postName);
    pState.setMaintenanceRows((prev: any[]) => prev.filter((_, i) => i !== index));
  };

  const updateMaintenanceCell = (postName: string, index: number, field: keyof ExcelMaintenance, value: any) => {
    const pState = getPostState(postName);
    const clone = [...pState.maintenanceRows];
    const rowWrapper = clone[index];
    const updatedReel = { ...rowWrapper.reel, [field]: value };

    if (field === 'agentMatricule') {
      const emp = activeEmployees.find(e => e.matricule?.toUpperCase() === String(value).trim().toUpperCase());
      updatedReel.agentName = emp ? `${emp.nom} ${emp.prenom}` : 'Inconnu';
    }
    if (field === 'engineId') {
      updatedReel.engineCode = String(value);
    }
    clone[index] = { ...rowWrapper, reel: updatedReel };
    pState.setMaintenanceRows(clone);
  };

  const discardDraft = () => {
    safeConfirm("⚠️ Voulez-vous vraiment écraser votre travail en cours et supprimer définitivement ce brouillon local ?", () => {
      localStorage.removeItem(`draft_production_${selectedDate}`);
      state.setDraftAvailable(false);
      loadGlobalWorkbook();
    });
  };

  const standardizeHours = (postName: string) => {
    let start = '07:00'; let end = '14:00';
    if (postName === 'Poste 1') { start = '07:00'; end = '14:00'; }
    else if (postName === 'Poste 2') { start = '15:00'; end = '22:00'; }
    else if (postName === 'Poste 3') { start = '23:00'; end = '06:00'; }

    const pState = getPostState(postName);
    pState.setMinageRows((prev: any[]) => prev.map(row => ({ ...row, reel: { ...row.reel, startTime: start, endTime: end } })));
    pState.setDeblayageRows((prev: any[]) => prev.map(row => ({ ...row, reel: { ...row.reel, startTime: start, endTime: end } })));
    pState.setExtractionRows((prev: any[]) => prev.map(row => ({ ...row, reel: { ...row.reel, startTime: start, endTime: end } })));
  };

  const copyYesterdayShiftTeam = async (postName: string) => {
    setCopyStatus('copying');
    try {
      const parts = selectedDate.split('-');
      const yDateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 12, 0, 0);
      const yesterdayObj = new Date(yDateObj);
      yesterdayObj.setDate(yDateObj.getDate() - 1);
      const yesterdayStr = format(yesterdayObj, 'yyyy-MM-dd');

      const yesterdayDocSnap = await getDoc(doc(db, 'production', yesterdayStr));

      if (yesterdayDocSnap.exists()) {
        const docData = yesterdayDocSnap.data();
        const pKey = postName === 'Poste 1' ? 'poste1' : postName === 'Poste 2' ? 'poste2' : 'poste3';
        const data = docData.postes?.[pKey];

        if (data) {
          const pState = getPostState(postName);

          if (data.chiefMatricule) {
            pState.setChiefMatricule(data.chiefMatricule);
            pState.setChiefName(data.chiefName || '');
          }
          if (data.secondChiefMatricule) {
            pState.setSecondChiefMatricule(data.secondChiefMatricule);
            pState.setSecondChiefName(data.secondChiefName || '');
          }

          if (data.sectorChefs) {
            pState.setSectorChefs(data.sectorChefs);
          }

          if (data.minage && data.minage.length > 0) {
            pState.setMinageRows((prev: any[]) => prev.map((row, idx) => {
              const yRow = (row.chantierId && data.minage.find((yr: any) => yr.chantierId === row.chantierId)) || data.minage[idx];
              if (yRow) {
                const yReel = yRow.reel || yRow;
                return {
                  ...row,
                  reel: {
                    ...row.reel,
                    minerMatricule: yReel.minerMatricule || '',
                    minerName: yReel.minerName || '',
                    assistantMatricule: yReel.assistantMatricule || '',
                    assistantName: yReel.assistantName || '',
                  }
                };
              }
              return row;
            }));
          }

          if (data.deblayage && data.deblayage.length > 0) {
            pState.setDeblayageRows((prev: any[]) => prev.map((row, idx) => {
              const yRow = (row.chantierId && data.deblayage.find((yr: any) => yr.chantierId === row.chantierId)) || data.deblayage[idx];
              if (yRow) {
                const yReel = yRow.reel || yRow;
                return {
                  ...row,
                  reel: {
                    ...row.reel,
                    driverMatricule: yReel.driverMatricule || '',
                    driverName: yReel.driverName || '',
                  }
                };
              }
              return row;
            }));
          }

          if (data.extraction && data.extraction.length > 0) {
            pState.setExtractionRows((prev: any[]) => prev.map((row, idx) => {
              const yRow = (row.chantierName && data.extraction.find((yr: any) => yr.chantierName === row.chantierName)) || data.extraction[idx];
              if (yRow) {
                const yReel = yRow.reel || yRow;
                return {
                  ...row,
                  reel: {
                    ...row.reel,
                    treuilliste: yReel.treuilliste || '',
                    equipier1: yReel.equipier1 || '',
                    equipier2: yReel.equipier2 || '',
                    equipier3: yReel.equipier3 || '',
                    equipier4: yReel.equipier4 || '',
                  }
                };
              }
              return row;
            }));
          }

          if (data.maintenance && data.maintenance.length > 0) {
            pState.setMaintenanceRows((prev: any[]) => prev.map((row, idx) => {
              const yRow = data.maintenance.find((yr: any) => {
                const yrRole = yr.roleLabel || yr.plan?.roleLabel || yr.reel?.roleLabel;
                const rowRole = row.roleLabel || row.plan?.roleLabel || row.reel?.roleLabel;
                const yrEngine = yr.engineCode || yr.plan?.engineCode || yr.reel?.engineCode;
                const rowEngine = row.engineCode || row.plan?.engineCode || row.reel?.engineCode;
                return (yrRole && yrRole === rowRole) || (yrEngine && yrEngine === rowEngine);
              }) || data.maintenance[idx];
              if (yRow) {
                const yReel = yRow.reel || yRow;
                return {
                  ...row,
                  reel: {
                    ...row.reel,
                    agentMatricule: yReel.agentMatricule || '',
                    agentName: yReel.agentName || '',
                  }
                };
              }
              return row;
            }));
          }

          setCopyStatus('copied');
          setTimeout(() => setCopyStatus('idle'), 2500);
        } else {
          setCopyStatus('no_data');
          setTimeout(() => setCopyStatus('idle'), 2500);
        }
      } else {
        setCopyStatus('no_data');
        setTimeout(() => setCopyStatus('idle'), 2500);
      }
    } catch (err) {
      console.error(err);
      setCopyStatus('error');
      setTimeout(() => setCopyStatus('idle'), 2500);
    }
  };

  const exportPlanningToProduction = async (targetDate: string) => {
    if (!targetDate) return;
    if (isMonthClosed) {
      safeAlert("❌ Ce mois est clôturé. Aucune modification de production ou ré-exportation n'est autorisée.", "Mois Clôturé", "error");
      return;
    }

    safeConfirm(
      `⚠️ Attention : Cette action va écraser les données du réalisé de production actuel pour la date du ${formatFrenchDate(selectedDate)} avec les planifications du ${formatFrenchDate(targetDate)}. Vos éventuelles saisies de réalisé en cours pour cette journée seront remplacées. Voulez-vous vraiment continuer ?`,
      async () => {
        try {
          const planSnap = await getDoc(doc(db, 'daily_planning_sheets', targetDate));
          if (!planSnap.exists()) {
            safeAlert(`❌ Aucune planification trouvée pour le ${formatFrenchDate(targetDate)}. Veuillez d'avance enregistrer une planification pour ce jour.`, "Saisie SMI requise", "error");
            return;
          }

          const planData = planSnap.data();
          const postesObj: any = {};
          const postsList = ['Poste 1', 'Poste 2', 'Poste 3'];

          postsList.forEach(pName => {
            const pKey = pName === 'Poste 1' ? 'poste1' : pName === 'Poste 2' ? 'poste2' : 'poste3';
            const pPlan = planData?.postes?.[pKey];

            const minageRows = pPlan ? generateFromPlan(filterRealPlannedRows(pPlan.minage || [], 'minage'), createEmptyMinage, pName, 'minage', chantiers) : [];
            const deblayageRows = pPlan ? generateFromPlan(filterRealPlannedRows(pPlan.deblayage || [], 'deblayage'), createEmptyDeblayage, pName, 'deblayage', chantiers) : [];
            const extractionRows = pPlan ? generateFromPlan(filterRealPlannedRows(pPlan.extraction || [], 'extraction'), createEmptyExtraction, pName, 'extraction', chantiers) : [];
            const maintenanceRows = pPlan ? generateFromPlan(filterRealPlannedRows(pPlan.maintenance || [], 'maintenance'), createEmptyMaintenance, pName, 'maintenance', chantiers) : [];

            const sectorChefs = pPlan?.sectorChefs || buildDefaultSectorChefs(pName, targetDate, plannings, activeEmployees);

            const mappedMinage = minageRows.map((row: any) => {
              const rowSecName = row.reel?.sector || row.plan?.sector || row.sector || 'Autres / Non Classés';
              const secChief = sectorChefs[rowSecName] || { chiefMatricule: '', chiefName: '', secondChiefMatricule: '', secondChiefName: '' };
              return {
                ...row,
                reel: {
                  ...(row.reel || {}),
                  chiefMatricule: secChief.chiefMatricule || '',
                  chiefName: secChief.secondChiefName ? `${secChief.chiefName} / ${secChief.secondChiefName}` : secChief.chiefName || ''
                }
              };
            });

            postesObj[pKey] = {
              chiefMatricule: pPlan?.chiefMatricule || '',
              chiefName: pPlan?.chiefName || '',
              secondChiefMatricule: pPlan?.secondChiefMatricule || '',
              secondChiefName: pPlan?.secondChiefName || '',
              status: 'planifie',
              minage: mappedMinage,
              deblayage: deblayageRows,
              extraction: extractionRows,
              maintenance: maintenanceRows,
              sectorChefs: sectorChefs
            };
          });

          const payload = {
            date: selectedDate,
            status: 'scelle',
            operator: user?.email || 'Pont d\'Export SMI',
            timestamp: new Date().toISOString(),
            postes: postesObj
          };

          await setDoc(doc(db, 'production', selectedDate), payload);
          await loadGlobalWorkbook();

        } catch (err) {
          console.error("Error running SMI Data sync-bridge: ", err);
          safeAlert("❌ Une erreur est survenue lors de l'exportation de la planification.", "Erreur d'Exploitation", "error");
        }
      }
    );
  };

  const saveWorkbook = async () => {
    if (isMonthClosed) {
      safeAlert("⚠️ ERREUR : Ce mois est clôturé et verrouillé. Aucune modification n'est permise.", "Mois Clôturé", "error");
      return;
    }

    setSaveStatus('saving');
    try {
      const postsList = ['Poste 1', 'Poste 2', 'Poste 3'];
      const postesObj: any = {};

      let totalMeteragePlanned = 0;
      let totalMeterageRealised = 0;
      let totalDeblayagePlanned = 0;
      let totalDeblayageRealised = 0;
      let totalWagonsPlanned = 0;
      let totalWagonsRealised = 0;
      let totalAnfo = 0;
      let totalTovex = 0;
      let totalAmorces = 0;

      for (const pName of postsList) {
        const pKey = pName === 'Poste 1' ? 'poste1' : pName === 'Poste 2' ? 'poste2' : 'poste3';
        const pState = getPostState(pName);

        const finalMinageRows = pState.minageRows.map((row: any) => {
          const rowSecName = row.reel.sector || 'Autres / Non Classés';
          const secChief = pState.sectorChefs[rowSecName] || { chiefMatricule: '', chiefName: '', secondChiefMatricule: '', secondChiefName: '' };
          return {
            ...row,
            reel: {
              ...row.reel,
              chiefMatricule: secChief.chiefMatricule,
              chiefName: secChief.secondChiefName ? `${secChief.chiefName} / ${secChief.secondChiefName}` : secChief.chiefName
            }
          };
        });

        postesObj[pKey] = {
          chiefMatricule: pState.chiefMatricule || '',
          chiefName: pState.chiefName || '',
          secondChiefMatricule: pState.secondChiefMatricule || '',
          secondChiefName: pState.secondChiefName || '',
          status: 'scelle',
          minage: finalMinageRows,
          deblayage: pState.deblayageRows,
          extraction: pState.extractionRows,
          maintenance: pState.maintenanceRows,
          sectorChefs: pState.sectorChefs || {}
        };

        finalMinageRows.forEach((r: any) => {
          totalMeteragePlanned += Number(r.plan?.meterage) || 0;
          totalMeterageRealised += Number(r.reel?.realMeterage ?? r.reel?.meterage ?? 0);
          totalAnfo += Number(r.reel?.anfo || 0);
          totalTovex += Number(r.reel?.tovex || 0);
          totalAmorces += Number(r.reel?.ammorces || 0);
        });

        pState.deblayageRows.forEach((r: any) => {
          totalDeblayagePlanned += Number(r.plan?.volumeEstimated) || 0;
          totalDeblayageRealised += Number(r.reel?.volumeEstimated ?? r.volumeEstimated ?? 0);
        });

        pState.extractionRows.forEach((r: any) => {
          totalWagonsPlanned += r.plan?.wagonsTarget ?? 48;
          totalWagonsRealised += Number(r.reel?.wagonsActual || 0);
        });
      }

      const payload = {
        date: selectedDate,
        status: 'scelle',
        operator: user?.email || 'Secrétaire de Direction SMI',
        timestamp: new Date().toISOString(),
        postes: postesObj
      };

      await setDoc(doc(db, 'production', selectedDate), payload, { merge: true });

      await setDoc(doc(db, 'production_history', selectedDate), {
        date: selectedDate,
        totalMeteragePlanned,
        totalMeterageRealised,
        totalDeblayagePlanned,
        totalDeblayageRealised,
        totalWagonsPlanned,
        totalWagonsRealised,
        totalAnfo,
        totalTovex,
        totalAmorces,
        secretary: profile?.name || user?.displayName || user?.email?.split('@')[0] || 'Secrétaire',
        lastUpdated: new Date().toISOString()
      }, { merge: true });

      localStorage.removeItem(`draft_production_${selectedDate}`);
      setDraftAvailable(false);
      setIsTemplateLoaded(false);
      setTemplateDateHint('');
      setSaveStatus('saved');
      
      setSuccessToastMsg(`Le registre journalier du ${selectedDate.split('-').reverse().join('/')} a été enregistré avec succès et gravé au Registre SMI.`);
      setShowSuccessToast(true);

      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch (err) {
      console.error(err);
      setSaveStatus('error');
    }
  };

  return {
    copyMinagePlanToReel,
    copyAllMinagePlanToReel,
    copyDeblayagePlanToReel,
    copyAllDeblayagePlanToReel,
    copyExtractionPlanToReel,
    copyAllExtractionPlanToReel,
    addMinageRowForSector,
    deleteMinageRow,
    updateMinageCell,
    updateSectorChief,
    addDeblayageRow,
    deleteDeblayageRow,
    updateDeblayageCell,
    addExtractionRow,
    deleteExtractionRow,
    updateExtractionCell,
    addMaintenanceRow,
    deleteMaintenanceRow,
    updateMaintenanceCell,
    discardDraft,
    standardizeHours,
    copyYesterdayShiftTeam,
    saveWorkbook,
    exportPlanningToProduction
  };
};
