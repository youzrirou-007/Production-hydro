import { format } from 'date-fns';
import { 
  ExcelMinage, ExcelDeblayage, ExcelExtraction, ExcelMaintenance,
  MinageRow, DeblayageRow, ExtractionRow, MaintenanceRow
} from '../types/mining';

export interface ExcelRow<T> {
  rowId: string;
  plan: T;
  reel: T;
}

export const DEFAULT_SECTORS = [
  { id: 'imiter_1', name: 'Imiter 1' },
  { id: 'imiter_2', name: 'Imiter 2' },
  { id: 'imiter_est', name: 'Imiter Est' },
  { id: 'imiter_est_bure', name: 'Imiter Est Bure' },
];

export const DEFAULT_EMPLOYEES = [
  { id: 'e1', matricule: 'M001', nom: 'El Idrissi', prenom: 'Ahmed', fonction: 'CHEF', status: 'actif' },
  { id: 'e2', matricule: 'M002', nom: 'Ait Oufkir', prenom: 'Mustapha', fonction: 'MINEUR', status: 'actif' },
  { id: 'e3', matricule: 'M003', nom: 'Haddad', prenom: 'Youssef', fonction: 'MINEUR', status: 'actif' },
  { id: 'e4', matricule: 'M004', nom: 'Amrani', prenom: 'Rachid', fonction: 'CONDUCTEUR', status: 'actif' },
  { id: 'e5', matricule: 'M005', nom: 'Kassimi', prenom: 'Hassan', fonction: 'ÉLECTRICIEN', status: 'actif' },
  { id: 'e6', matricule: 'M006', nom: 'Naji', prenom: 'Khalid', fonction: 'CHAUDRONNIER', status: 'actif' },
];

export const DEFAULT_ENGINES = [
  { id: 'lhd_01', code: 'LHD-01', name: 'Loader Atlas Copco ST14' },
  { id: 'lhd_02', code: 'LHD-02', name: 'Loader Sandvik LH410' },
  { id: 'lhd_03', code: 'LHD-03', name: 'LHD Toro 400 Souterrain' },
];

export function calculateDuration(startTime: string, endTime: string): number {
  if (!startTime || !endTime) return 0;
  const [startH, startM] = startTime.split(':').map(Number);
  const [endH, endM] = endTime.split(':').map(Number);
  
  let startMinutes = startH * 60 + startM;
  let endMinutes = endH * 60 + endM;
  
  if (endMinutes < startMinutes) {
    endMinutes += 24 * 60;
  }
  
  const durationMinutes = endMinutes - startMinutes;
  return durationMinutes / 60;
}

export const createEmptyMinage = (sector: string = ''): ExcelMinage => ({
  sector,
  chantierId: '',
  chiefMatricule: '',
  chiefName: '',
  minerMatricule: '',
  minerName: '',
  assistantMatricule: '',
  assistantName: '',
  gallerySize: 12,
  plannedHoles: 32,
  realHoles: 0,
  chargedHoles: 0,
  emptyHoles: 0,
  plannedRounds: 1,
  realRounds: 0,
  meterage: 0,
  realMeterage: 0,
  anfo: 0,
  tovex: 0,
  ammorces: 0
});

export const createEmptyDeblayage = (sector: string = '', start: string = '07:00', end: string = '14:00'): ExcelDeblayage => ({
  sector,
  chantierId: '',
  driverMatricule: '',
  driverName: '',
  engineId: '',
  engineCode: '',
  godets: 0,
  volumeEstimated: 0,
  gasoil: 0,
  lubrifiant1: '',
  lubrifiant1Qty: 0,
  lubrifiant2: '',
  lubrifiant2Qty: 0,
  startTime: start,
  endTime: end,
  remarks: ''
});

export const createEmptyExtraction = (start: string = '08:00', end: string = '13:30', defaultWagonsTarget: number = 48): ExcelExtraction => ({
  treuilliste: '',
  equipier1: '',
  equipier2: '',
  equipier3: '',
  equipier4: '',
  wagonsActual: 0,
  wagonsTarget: defaultWagonsTarget,
  sterileBureImiterEst: 0,
  startTime: start,
  endTime: end,
  chantierName: 'Extraction Bure N340 Imiter Est'
});

export const createEmptyMaintenance = (): ExcelMaintenance => ({
  roleLabel: '',
  agentMatricule: '',
  agentName: '',
  engineId: '',
  engineCode: '',
  hoursSpent: 6,
  workDescription: ''
});

export const isMinageReelFilled = (reel: any) => {
  return !!(
    reel.minerMatricule ||
    reel.assistantMatricule ||
    reel.chantierId ||
    reel.realHoles > 0 ||
    reel.chargedHoles > 0
  );
};

export const isDeblayageReelFilled = (reel: any) => {
  return !!(
    reel.driverMatricule ||
    reel.engineId ||
    reel.chantierId ||
    reel.godets > 0
  );
};

export const isExtractionReelFilled = (reel: any) => {
  return !!(
    reel.treuilliste ||
    reel.equipier1 ||
    reel.equipier2 ||
    reel.equipier3 ||
    reel.equipier4 ||
    reel.wagonsActual > 0 ||
    reel.sterileBureImiterEst > 0
  );
};

export const mapToExcelRowArray = <T,>(arr: any[], defaultCreatorWithSector: (sec: string) => T): ExcelRow<T>[] => {
  if (!Array.isArray(arr)) return [];
  return arr.map((item, idx) => {
    let planObj = item?.plan || item;
    let reelObj = item?.reel || item;

    if (planObj && typeof planObj === 'object') {
      const explosives = planObj.explosives || {};
      const anfo = explosives.anfo !== undefined ? explosives.anfo : (planObj.anfo !== undefined ? planObj.anfo : 0);
      const tovex = explosives.tovex !== undefined ? explosives.tovex : (planObj.tovex !== undefined ? planObj.tovex : 0);
      const ammorces = explosives.ammorces !== undefined ? explosives.ammorces : (planObj.ammorces !== undefined ? planObj.ammorces : 0);
      planObj = { ...planObj, anfo, tovex, ammorces };
    }

    if (item && 'rowId' in item && 'plan' in item && 'reel' in item) {
      return {
        ...item,
        plan: planObj,
        reel: reelObj
      } as ExcelRow<T>;
    }
    const sector = item?.sector || item?.reel?.sector || item?.plan?.sector || '';
    return {
      rowId: item?.rowId || `row_${idx}_${Math.random().toString(36).substr(2, 9)}`,
      plan: planObj || defaultCreatorWithSector(sector),
      reel: reelObj || defaultCreatorWithSector(sector),
    };
  });
};

export const generateFromPlan = <T,>(
  plannedList: T[], 
  defaultCreatorWithSector: (sec: string) => T, 
  postName: string, 
  typeName: string,
  chantiers: any[],
  defaultWagonsTarget: number = 48
): ExcelRow<T>[] => {
  if (!plannedList || plannedList.length === 0) {
    return [];
  }
  return plannedList.map((plannedItem: any, idx) => {
    let sector = plannedItem?.sector || plannedItem?.sectorGroup || '';
    if (!sector && plannedItem?.chantierId) {
      const foundChan = chantiers.find((c: any) => c.id === plannedItem.chantierId);
      if (foundChan) {
        sector = foundChan.sector || '';
      }
    }

    const explosives = plannedItem?.explosives || {};
    const planValue = { 
      ...plannedItem, 
      sector,
      ...(typeName === 'minage' ? {
        plannedRounds: 1,
        anfo: explosives.anfo !== undefined ? explosives.anfo : (plannedItem?.anfo || 0),
        tovex: explosives.tovex !== undefined ? explosives.tovex : (plannedItem?.tovex || 0),
        ammorces: explosives.ammorces !== undefined ? explosives.ammorces : (plannedItem?.ammorces || 0),
      } : {})
    };
    
    const reelValue: any = {
      ...defaultCreatorWithSector(sector),
      chantierId: plannedItem?.chantierId || '',
      sector: sector,
    };
    
    if (typeName === 'minage') {
      const gSize = plannedItem?.gallerySize || (plannedItem?.galleryType === '9m2' ? 9 : 12);
      reelValue.gallerySize = gSize;
      reelValue.barType = plannedItem?.barType || '1.8m';
      reelValue.minerMatricule = plannedItem?.minerMatricule || '';
      reelValue.minerName = plannedItem?.minerName || '';
      reelValue.assistantMatricule = plannedItem?.assistantMatricule || '';
      reelValue.assistantName = plannedItem?.assistantName || '';
      reelValue.plannedRounds = 1;
      reelValue.realRounds = 1;
      const advanceFactor = reelValue.barType === '2.4m' ? 2.3 : 1.7;
      reelValue.meterage = advanceFactor;
      reelValue.realMeterage = advanceFactor;
    } else if (typeName === 'deblayage') {
      reelValue.driverMatricule = plannedItem?.driverMatricule || '';
      reelValue.driverName = plannedItem?.driverName || '';
      reelValue.engineId = plannedItem?.engineId || '';
      reelValue.engineCode = plannedItem?.engineCode || '';
      reelValue.godets = plannedItem?.godets || 0;
      reelValue.volumeEstimated = plannedItem?.volumeEstimated || 0;
    } else if (typeName === 'maintenance') {
      reelValue.agentMatricule = plannedItem?.agentMatricule || '';
      reelValue.agentName = plannedItem?.agentName || '';
      reelValue.roleLabel = plannedItem?.roleLabel || '';
      reelValue.engineId = plannedItem?.engineId || '';
      reelValue.engineCode = plannedItem?.engineCode || '';
    } else if (typeName === 'extraction') {
      reelValue.treuilliste = plannedItem?.treuilliste || '';
      reelValue.equipier1 = plannedItem?.equipier1 || '';
      reelValue.equipier2 = plannedItem?.equipier2 || '';
      reelValue.equipier3 = plannedItem?.equipier3 || '';
      reelValue.equipier4 = plannedItem?.equipier4 || '';
      reelValue.wagonsTarget = plannedItem?.wagonsTarget !== undefined && plannedItem?.wagonsTarget !== null ? Number(plannedItem.wagonsTarget) : defaultWagonsTarget;
      reelValue.wagonsActual = plannedItem?.wagonsActual !== undefined && plannedItem?.wagonsActual !== null ? Number(plannedItem.wagonsActual) : 0;
      reelValue.sterileBureImiterEst = plannedItem?.sterileBureImiterEst !== undefined && plannedItem?.sterileBureImiterEst !== null ? Number(plannedItem.sterileBureImiterEst) : 0;
      reelValue.installationName = plannedItem?.installationName || plannedItem?.chantierName || 'Bure';
    }
    
    return {
      rowId: `${typeName}_${idx}_${Math.random().toString(36).substr(2, 9)}`,
      plan: planValue,
      reel: reelValue as unknown as T
    };
  });
};

export const filterRealPlannedRows = <T,>(arr: T[], type: string): T[] => {
  if (!Array.isArray(arr)) return [];
  return arr.filter((item: any) => {
    if (!item) return false;
    if (type === 'minage') {
      const isChildVolee = !!(item.remarks && typeof item.remarks === 'string' && item.remarks.includes('(Volée'));
      const hasChantier = !!(item.chantierId || item.chantierName || isChildVolee);
      return hasChantier;
    }
    if (type === 'deblayage') {
      return !!(item.chantierId || item.chantierName);
    }
    if (type === 'extraction') {
      return !!(item.treuilliste1 || item.treuilliste || item.equipier1 || item.equipier2 || item.chantierName || (item.wagonsTarget && item.wagonsTarget > 0));
    }
    if (type === 'maintenance') {
      return !!(item.agentMatricule || item.roleLabel);
    }
    return true;
  });
};

export const generateSaisieLibreDefaults = (postName: string, defaultWagonsTarget: number = 48) => {
  let start = '07:00';
  let end = '14:00';
  if (postName === 'Poste 1') { start = '07:00'; end = '14:00'; }
  else if (postName === 'Poste 2') { start = '15:00'; end = '22:00'; }
  else if (postName === 'Poste 3') { start = '23:00'; end = '06:00'; }

  const minageSectors = ['Imiter 2', 'Imiter 1', 'Imiter Est'];
  const minage: ExcelRow<ExcelMinage>[] = [];
  minageSectors.forEach(sec => {
    const count = (postName === 'Poste 1' && sec !== 'Imiter Est') ? 1 : 2;
    for (let i = 0; i < count; i++) {
      minage.push({
        rowId: `minage_saisie_${sec}_${i}_${Math.random().toString(36).substr(2, 9)}`,
        plan: createEmptyMinage(sec),
        reel: createEmptyMinage(sec)
      });
    }
  });

  const deblayageSectors = ['Imiter 2', 'Imiter 1', 'Imiter Est'];
  const deblayage: ExcelRow<ExcelDeblayage>[] = [];
  deblayageSectors.forEach(sec => {
    const count = sec === 'Imiter Est' ? 3 : sec === 'Imiter 2' ? 2 : 1;
    for (let i = 0; i < count; i++) {
      deblayage.push({
        rowId: `deblayage_saisie_${sec}_${i}_${Math.random().toString(36).substr(2, 9)}`,
        plan: createEmptyDeblayage(sec, start, end),
        reel: createEmptyDeblayage(sec, start, end)
      });
    }
  });

  const extraction: ExcelRow<ExcelExtraction>[] = Array.from({ length: 1 }, (_, i) => ({
    rowId: `extraction_saisie_${i}_${Math.random().toString(36).substr(2, 9)}`,
    plan: createEmptyExtraction(start, end, defaultWagonsTarget),
    reel: createEmptyExtraction(start, end, defaultWagonsTarget)
  }));

  const maintenance: ExcelRow<ExcelMaintenance>[] = Array.from({ length: 4 }, (_, i) => ({
    rowId: `maintenance_saisie_${i}_${Math.random().toString(36).substr(2, 9)}`,
    plan: createEmptyMaintenance(),
    reel: createEmptyMaintenance()
  }));

  return { minage, deblayage, extraction, maintenance };
};

export const buildDefaultSectorChefs = (pName: string, yesterdayStr: string, plannings: any[] = [], employees: any[] = []) => {
  const activeChefs = (employees.length > 0 ? employees : DEFAULT_EMPLOYEES).filter(e => e.fonction === 'CHEF' && e.status === 'actif');
  const shiftPlans = plannings.filter(p => p.date === yesterdayStr && p.post === pName);

  const getSectorChefDefault = (sec: string) => {
    const planSec = shiftPlans.find(
      p => p.type === 'minage' && 
      (p.sector || '').toLowerCase() === sec.toLowerCase() && 
      p.chiefMatricule
    );
    if (planSec) {
      return {
        matricule: planSec.chiefMatricule,
        name: planSec.chiefName || ''
      };
    }
    const chf = activeChefs.find(e => (e.sector || '').toLowerCase() === sec.toLowerCase());
    return chf ? { matricule: chf.matricule || '', name: `${chf.nom || ''} ${chf.prenom || ''}`.trim() } : { matricule: '', name: '' };
  };

  return {
    'Imiter 2': { chiefMatricule: getSectorChefDefault('Imiter 2').matricule, chiefName: getSectorChefDefault('Imiter 2').name, secondChiefMatricule: '', secondChiefName: '' },
    'Imiter 1': { chiefMatricule: getSectorChefDefault('Imiter 1').matricule, chiefName: getSectorChefDefault('Imiter 1').name, secondChiefMatricule: '', secondChiefName: '' },
    'Imiter Est': { chiefMatricule: getSectorChefDefault('Imiter Est').matricule, chiefName: getSectorChefDefault('Imiter Est').name, secondChiefMatricule: '', secondChiefName: '' },
    'Autres / Non Classés': { chiefMatricule: '', chiefName: '', secondChiefMatricule: '', secondChiefName: '' }
  };
};

export const getSectorChefsFromDocOrDefaults = (docData: any, pName: string, yesterdayStr: string, rows: any[], plannings: any[], employees: any[]) => {
  const defaultChefs = buildDefaultSectorChefs(pName, yesterdayStr, plannings, employees);
  const result = { ...defaultChefs };

  if (docData && docData.sectorChefs) {
    return {
      ...result,
      ...docData.sectorChefs
    };
  }

  const sectorsList = ['Imiter 2', 'Imiter 1', 'Imiter Est', 'Autres / Non Classés'];
  for (const sec of sectorsList) {
    const matching = rows.find(r => (r.sector || '').trim().toLowerCase() === sec.toLowerCase() && r.chiefMatricule);
    if (matching) {
      const parts = matching.chiefName.split(' / ');
      result[sec] = {
        chiefMatricule: matching.chiefMatricule,
        chiefName: parts[0] || '',
        secondChiefMatricule: '',
        secondChiefName: parts[1] || ''
      };
    }
  }

  if (docData && docData.chiefMatricule) {
    for (const sec of sectorsList) {
      if (!result[sec].chiefMatricule) {
        result[sec].chiefMatricule = docData.chiefMatricule;
        result[sec].chiefName = docData.chiefName || '';
        result[sec].secondChiefMatricule = docData.secondChiefMatricule || '';
        result[sec].secondChiefName = docData.secondChiefName || '';
      }
    }
  }

  return result;
};

export function buildSavePayload(selectedDate: string, userEmail: string, p1Data: any, p2Data: any, p3Data: any) {
  const postsList = ['Poste 1', 'Poste 2', 'Poste 3'];
  const postesObj: any = {};

  const getPost = (pName: string) => {
    return pName === 'Poste 1' ? p1Data : pName === 'Poste 2' ? p2Data : p3Data;
  };

  for (const pName of postsList) {
    const pKey = pName === 'Poste 1' ? 'poste1' : pName === 'Poste 2' ? 'poste2' : 'poste3';
    const state = getPost(pName);

    const finalMinageRows = state.minageRows.map((row: any) => {
      const rowSecName = row.reel.sector || 'Autres / Non Classés';
      const secChief = state.sectorChefs[rowSecName] || { chiefMatricule: '', chiefName: '', secondChiefMatricule: '', secondChiefName: '' };
      const finalChiefMatricule = secChief.chiefMatricule;
      const finalChiefName = secChief.secondChiefName ? `${secChief.chiefName} / ${secChief.secondChiefName}` : secChief.chiefName;
      return {
        ...row,
        reel: {
          ...row.reel,
          chiefMatricule: finalChiefMatricule,
          chiefName: finalChiefName
        }
      };
    });

    postesObj[pKey] = {
      chiefMatricule: state.chiefMatricule || '',
      chiefName: state.chiefName || '',
      secondChiefMatricule: state.secondChiefMatricule || '',
      secondChiefName: state.secondChiefName || '',
      status: 'scelle',
      minage: finalMinageRows,
      deblayage: state.deblayageRows,
      extraction: state.extractionRows,
      maintenance: state.maintenanceRows,
      sectorChefs: state.sectorChefs || {}
    };
  }

  return {
    date: selectedDate,
    status: 'scelle',
    operator: userEmail || 'Secrétaire de Direction SMI',
    timestamp: new Date().toISOString(),
    postes: postesObj
  };
}

export function computeConsolidatedHistory(selectedDate: string, postesObj: any, secretaryName: string) {
  let totalMeteragePlanned = 0;
  let totalMeterageRealised = 0;
  let totalDeblayagePlanned = 0;
  let totalDeblayageRealised = 0;
  let totalWagonsPlanned = 0;
  let totalWagonsRealised = 0;
  let totalAnfo = 0;
  let totalTovex = 0;
  let totalAmorces = 0;

  const postsList = ['Poste 1', 'Poste 2', 'Poste 3'];

  for (const pName of postsList) {
    const pKey = pName === 'Poste 1' ? 'poste1' : pName === 'Poste 2' ? 'poste2' : 'poste3';
    const pData = postesObj[pKey];
    if (pData) {
      const minageRows = pData.minage || [];
      const deblayageRows = pData.deblayage || [];
      const extractionRows = pData.extraction || [];

      minageRows.forEach((r: any) => {
        totalMeteragePlanned += Number(r.plan?.meterage) || 0;
        const rMet = r.reel?.realMeterage !== undefined && r.reel?.realMeterage !== null
          ? r.reel.realMeterage
          : (r.reel?.meterage !== undefined ? r.reel?.meterage : 0);
        totalMeterageRealised += Number(rMet) || 0;

        totalAnfo += Number(r.reel?.anfo) || 0;
        totalTovex += Number(r.reel?.tovex) || 0;
        totalAmorces += Number(r.reel?.ammorces) || 0;
      });

      deblayageRows.forEach((r: any) => {
        totalDeblayagePlanned += Number(r.plan?.volumeEstimated) || 0;
        totalDeblayageRealised += Number(r.reel?.volumeEstimated || r.volumeEstimated) || 0;
      });

      extractionRows.forEach((r: any) => {
        const planWag = r.plan?.wagonsTarget !== undefined && r.plan?.wagonsTarget !== null ? Number(r.plan.wagonsTarget) : 48;
        totalWagonsPlanned += planWag;
        totalWagonsRealised += Number(r.reel?.wagonsActual) || 0;
      });
    }
  }

  return {
    date: selectedDate,
    totalMeteragePlanned: Number(totalMeteragePlanned) || 0,
    totalMeterageRealised: Number(totalMeterageRealised) || 0,
    totalDeblayagePlanned: Number(totalDeblayagePlanned) || 0,
    totalDeblayageRealised: Number(totalDeblayageRealised) || 0,
    totalWagonsPlanned: Number(totalWagonsPlanned) || 0,
    totalWagonsRealised: Number(totalWagonsRealised) || 0,
    totalAnfo: Number(totalAnfo) || 0,
    totalTovex: Number(totalTovex) || 0,
    totalAmorces: Number(totalAmorces) || 0,
    secretary: secretaryName,
    lastUpdated: new Date().toISOString()
  };
}

export const formatFrenchDate = (dateStr: string) => {
  try {
    const [year, month, day] = dateStr.split('-');
    const months = [
      'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
    ];
    return `${parseInt(day, 10)} ${months[parseInt(month, 10) - 1]}`;
  } catch (e) {
    return dateStr;
  }
};
