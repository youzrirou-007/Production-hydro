import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { getDoc, doc } from 'firebase/firestore';
import { format } from 'date-fns';
import { 
  ExcelMinage, ExcelDeblayage, ExcelExtraction, ExcelMaintenance,
  ActivityName
} from '../types/mining';
import {
  ExcelRow,
  DEFAULT_EMPLOYEES,
  createEmptyMinage, createEmptyDeblayage, createEmptyExtraction, createEmptyMaintenance,
  mapToExcelRowArray, generateFromPlan, filterRealPlannedRows, generateSaisieLibreDefaults,
  buildDefaultSectorChefs
} from '../lib/productionUtils';
import { useProductionSubscribers } from './useProductionSubscribers';

export const useProduction = (selectedDate: string, setSelectedDate: (date: string) => void) => {
  const { user, profile } = useAuth();

  // Active sheet tab & selected post
  const [activeSheetTab, setActiveSheetTab] = useState<ActivityName>('minage');
  const [selectedPost, setSelectedPost] = useState<'Poste 1' | 'Poste 2' | 'Poste 3'>('Poste 1');

  // Loading/Save/Sync status
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [draftAvailable, setDraftAvailable] = useState<boolean>(false);
  const [isMonthClosed, setIsMonthClosed] = useState<boolean>(false);
  const [exactPlanMissing, setExactPlanMissing] = useState<boolean>(false);
  const [forceFreeEntryApproved, setForceFreeEntryApproved] = useState<boolean>(false);
  const [noPlanFound, setNoPlanFound] = useState<boolean>(false);
  const [isTemplateLoaded, setIsTemplateLoaded] = useState<boolean>(false);
  const [planFoundType, setPlanFoundType] = useState<'none' | 'yesterday'>('none');
  const [templateDateHint, setTemplateDateHint] = useState<string>('');
  const [unexplainedGaps, setUnexplainedGaps] = useState<number>(0);
  
  // Real-time collections data
  const [chantiers, setChantiers] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [engines, setEngines] = useState<any[]>([]);
  const [plannings, setPlannings] = useState<any[]>([]);
  const [allPlanningSheets, setAllPlanningSheets] = useState<any[]>([]);
  const [allProductionDocs, setAllProductionDocs] = useState<any[]>([]);
  const [dataHistory, setDataHistory] = useState<any[]>([]);
  const [platformSettings, setPlatformSettings] = useState<any>({
    sectors: ['Imiter 1', 'Imiter 2', 'Imiter Est'],
    engines: ['ST2D', 'ST2G 1', 'ST2G 3', 'ST2G 4', 'ST2G 5', 'ST2G6'],
    oils: ['Huile Moteur 15W40', 'Huile Hydraulique HV46', 'Huile Hydraulique HV68', 'Huile Transmission SAE30', 'Huile Transmission SAE50', 'Graisse Extrême Pression'],
    defaultWagonsTarget: 48
  });

  // Poste 1 states
  const [p1MinageRows, setP1MinageRows] = useState<ExcelRow<ExcelMinage>[]>([]);
  const [p1DeblayageRows, setP1DeblayageRows] = useState<ExcelRow<ExcelDeblayage>[]>([]);
  const [p1ExtractionRows, setP1ExtractionRows] = useState<ExcelRow<ExcelExtraction>[]>([]);
  const [p1MaintenanceRows, setP1MaintenanceRows] = useState<ExcelRow<ExcelMaintenance>[]>([]);
  const [p1ChiefMatricule, setP1ChiefMatricule] = useState('');
  const [p1ChiefName, setP1ChiefName] = useState('');
  const [p1SecondChiefMatricule, setP1SecondChiefMatricule] = useState('');
  const [p1SecondChiefName, setP1SecondChiefName] = useState('');
  const [p1SectorChefs, setP1SectorChefs] = useState<any>({});

  // Poste 2 states
  const [p2MinageRows, setP2MinageRows] = useState<ExcelRow<ExcelMinage>[]>([]);
  const [p2DeblayageRows, setP2DeblayageRows] = useState<ExcelRow<ExcelDeblayage>[]>([]);
  const [p2ExtractionRows, setP2ExtractionRows] = useState<ExcelRow<ExcelExtraction>[]>([]);
  const [p2MaintenanceRows, setP2MaintenanceRows] = useState<ExcelRow<ExcelMaintenance>[]>([]);
  const [p2ChiefMatricule, setP2ChiefMatricule] = useState('');
  const [p2ChiefName, setP2ChiefName] = useState('');
  const [p2SecondChiefMatricule, setP2SecondChiefMatricule] = useState('');
  const [p2SecondChiefName, setP2SecondChiefName] = useState('');
  const [p2SectorChefs, setP2SectorChefs] = useState<any>({});

  // Poste 3 states
  const [p3MinageRows, setP3MinageRows] = useState<ExcelRow<ExcelMinage>[]>([]);
  const [p3DeblayageRows, setP3DeblayageRows] = useState<ExcelRow<ExcelDeblayage>[]>([]);
  const [p3ExtractionRows, setP3ExtractionRows] = useState<ExcelRow<ExcelExtraction>[]>([]);
  const [p3MaintenanceRows, setP3MaintenanceRows] = useState<ExcelRow<ExcelMaintenance>[]>([]);
  const [p3ChiefMatricule, setP3ChiefMatricule] = useState('');
  const [p3ChiefName, setP3ChiefName] = useState('');
  const [p3SecondChiefMatricule, setP3SecondChiefMatricule] = useState('');
  const [p3SecondChiefName, setP3SecondChiefName] = useState('');
  const [p3SectorChefs, setP3SectorChefs] = useState<any>({});

  const activeEmployees = employees.length > 0 ? employees : DEFAULT_EMPLOYEES;

  useProductionSubscribers({
    setSelectedDate,
    selectedDate,
    setDataHistory,
    setChantiers,
    setEmployees,
    setEngines,
    setPlannings,
    setPlatformSettings,
    setAllPlanningSheets,
    setAllProductionDocs,
    setIsMonthClosed,
    setUnexplainedGaps
  });

  const getPostState = (postName: string) => {
    if (postName === 'Poste 1') {
      return {
        minageRows: p1MinageRows, setMinageRows: setP1MinageRows,
        deblayageRows: p1DeblayageRows, setDeblayageRows: setP1DeblayageRows,
        extractionRows: p1ExtractionRows, setExtractionRows: setP1ExtractionRows,
        maintenanceRows: p1MaintenanceRows, setMaintenanceRows: setP1MaintenanceRows,
        chiefMatricule: p1ChiefMatricule, setChiefMatricule: setP1ChiefMatricule,
        chiefName: p1ChiefName, setChiefName: setP1ChiefName,
        secondChiefMatricule: p1SecondChiefMatricule, setSecondChiefMatricule: setP1SecondChiefMatricule,
        secondChiefName: p1SecondChiefName, setSecondChiefName: setP1SecondChiefName,
        sectorChefs: p1SectorChefs, setSectorChefs: setP1SectorChefs,
      };
    } else if (postName === 'Poste 2') {
      return {
        minageRows: p2MinageRows, setMinageRows: setP2MinageRows,
        deblayageRows: p2DeblayageRows, setDeblayageRows: setP2DeblayageRows,
        extractionRows: p2ExtractionRows, setExtractionRows: setP2ExtractionRows,
        maintenanceRows: p2MaintenanceRows, setMaintenanceRows: setP2MaintenanceRows,
        chiefMatricule: p2ChiefMatricule, setChiefMatricule: setP2ChiefMatricule,
        chiefName: p2ChiefName, setChiefName: setP2ChiefName,
        secondChiefMatricule: p2SecondChiefMatricule, setSecondChiefMatricule: setP2SecondChiefMatricule,
        secondChiefName: p2SecondChiefName, setSecondChiefName: setP2SecondChiefName,
        sectorChefs: p2SectorChefs, setSectorChefs: setP2SectorChefs,
      };
    } else {
      return {
        minageRows: p3MinageRows, setMinageRows: setP3MinageRows,
        deblayageRows: p3DeblayageRows, setDeblayageRows: setP3DeblayageRows,
        extractionRows: p3ExtractionRows, setExtractionRows: setP3ExtractionRows,
        maintenanceRows: p3MaintenanceRows, setMaintenanceRows: setP3MaintenanceRows,
        chiefMatricule: p3ChiefMatricule, setChiefMatricule: setP3ChiefMatricule,
        chiefName: p3ChiefName, setChiefName: setP3ChiefName,
        secondChiefMatricule: p3SecondChiefMatricule, setSecondChiefMatricule: setP3SecondChiefMatricule,
        secondChiefName: p3SecondChiefName, setSecondChiefName: setP3SecondChiefName,
        sectorChefs: p3SectorChefs, setSectorChefs: setP3SectorChefs,
      };
    }
  };

  const loadGlobalWorkbook = async () => {
    setLoading(true);
    setNoPlanFound(false);
    try {
      const parts = selectedDate.split('-');
      const yDateObj = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), 12, 0, 0);
      const yesterdayDateObj = new Date(yDateObj);
      yesterdayDateObj.setDate(yDateObj.getDate() - 1);
      const yesterdayDateStr = format(yesterdayDateObj, 'yyyy-MM-dd');

      const planSnapForD = await getDoc(doc(db, 'daily_planning_sheets', yesterdayDateStr));
      const planExists = planSnapForD.exists() && (
        !!(planSnapForD.data()?.postes?.poste1?.minage?.length || 
           planSnapForD.data()?.postes?.poste2?.minage?.length || 
           planSnapForD.data()?.postes?.poste3?.minage?.length)
      );
      setExactPlanMissing(!planExists);
      setForceFreeEntryApproved(false);

      const snap = await getDoc(doc(db, 'production', selectedDate));
      if (snap.exists()) {
        const docData = snap.data();
        setIsTemplateLoaded(false);

        const loadPost = (pKey: string, pName: string, setMin: any, setDeb: any, setExt: any, setMaint: any, setChfM: any, setChfN: any, setChf2M: any, setChf2N: any, setSectChf: any) => {
          const pData = docData?.postes?.[pKey];
          if (pData) {
            setMin(mapToExcelRowArray(pData.minage || [], createEmptyMinage));
            setDeb(mapToExcelRowArray(pData.deblayage || [], createEmptyDeblayage));
            setExt(mapToExcelRowArray(pData.extraction || [], createEmptyExtraction));
            setMaint(mapToExcelRowArray(pData.maintenance || [], createEmptyMaintenance));
            setChfM(pData.chiefMatricule || '');
            setChfN(pData.chiefName || '');
            setChf2M(pData.secondChiefMatricule || '');
            setChf2N(pData.secondChiefName || '');
            setSectChf(pData.sectorChefs || buildDefaultSectorChefs(pName, yesterdayDateStr, plannings, activeEmployees));
          } else {
            const defaults = generateSaisieLibreDefaults(pName, platformSettings.defaultWagonsTarget);
            setMin(defaults.minage); setDeb(defaults.deblayage); setExt(defaults.extraction); setMaint(defaults.maintenance);
            setChfM(''); setChfN(''); setChf2M(''); setChf2N('');
            setSectChf(buildDefaultSectorChefs(pName, yesterdayDateStr, plannings, activeEmployees));
          }
        };

        loadPost('poste1', 'Poste 1', setP1MinageRows, setP1DeblayageRows, setP1ExtractionRows, setP1MaintenanceRows, setP1ChiefMatricule, setP1ChiefName, setP1SecondChiefMatricule, setP1SecondChiefName, setP1SectorChefs);
        loadPost('poste2', 'Poste 2', setP2MinageRows, setP2DeblayageRows, setP2ExtractionRows, setP2MaintenanceRows, setP2ChiefMatricule, setP2ChiefName, setP2SecondChiefMatricule, setP2SecondChiefName, setP2SectorChefs);
        loadPost('poste3', 'Poste 3', setP3MinageRows, setP3DeblayageRows, setP3ExtractionRows, setP3MaintenanceRows, setP3ChiefMatricule, setP3ChiefName, setP3SecondChiefMatricule, setP3SecondChiefName, setP3SectorChefs);
      } else {
        if (planSnapForD.exists()) {
          const planData = planSnapForD.data();
          setIsTemplateLoaded(true);
          setPlanFoundType('yesterday');
          setTemplateDateHint(format(new Date(yesterdayDateStr + "T12:00:00"), 'dd/MM/yyyy'));

          const loadPostFromPlan = (pKey: string, pName: string, setMin: any, setDeb: any, setExt: any, setMaint: any, setChfM: any, setChfN: any, setChf2M: any, setChf2N: any, setSectChf: any) => {
            const pPlan = planData?.postes?.[pKey];
            if (pPlan) {
              setMin(generateFromPlan(filterRealPlannedRows(pPlan.minage || [], 'minage'), createEmptyMinage, pName, 'minage', chantiers));
              setDeb(generateFromPlan(filterRealPlannedRows(pPlan.deblayage || [], 'deblayage'), createEmptyDeblayage, pName, 'deblayage', chantiers));
              setExt(generateFromPlan(filterRealPlannedRows(pPlan.extraction || [], 'extraction'), createEmptyExtraction, pName, 'extraction', chantiers));
              setMaint(generateFromPlan(filterRealPlannedRows(pPlan.maintenance || [], 'maintenance'), createEmptyMaintenance, pName, 'maintenance', chantiers));
              setChfM(pPlan.chiefMatricule || ''); setChfN(pPlan.chiefName || '');
              setChf2M(pPlan.secondChiefMatricule || ''); setChf2N(pPlan.secondChiefName || '');
              setSectChf(buildDefaultSectorChefs(pName, yesterdayDateStr, plannings, activeEmployees));
            } else {
              setMin([]); setDeb([]); setExt([]); setMaint([]);
              setChfM(''); setChfN(''); setChf2M(''); setChf2N('');
              setSectChf(buildDefaultSectorChefs(pName, yesterdayDateStr, plannings, activeEmployees));
            }
          };

          loadPostFromPlan('poste1', 'Poste 1', setP1MinageRows, setP1DeblayageRows, setP1ExtractionRows, setP1MaintenanceRows, setP1ChiefMatricule, setP1ChiefName, setP1SecondChiefMatricule, setP1SecondChiefName, setP1SectorChefs);
          loadPostFromPlan('poste2', 'Poste 2', setP2MinageRows, setP2DeblayageRows, setP2ExtractionRows, setP2MaintenanceRows, setP2ChiefMatricule, setP2ChiefName, setP2SecondChiefMatricule, setP2SecondChiefName, setP2SectorChefs);
          loadPostFromPlan('poste3', 'Poste 3', setP3MinageRows, setP3DeblayageRows, setP3ExtractionRows, setP3MaintenanceRows, setP3ChiefMatricule, setP3ChiefName, setP3SecondChiefMatricule, setP3SecondChiefName, setP3SectorChefs);
        } else {
          setNoPlanFound(true);
          setIsTemplateLoaded(false);
          setPlanFoundType('none');
          setTemplateDateHint(format(yesterdayDateObj, 'dd/MM/yyyy'));

          const loadFree = (pName: string, setMin: any, setDeb: any, setExt: any, setMaint: any, setChfM: any, setChfN: any, setChf2M: any, setChf2N: any, setSectChf: any) => {
            const defaults = generateSaisieLibreDefaults(pName, platformSettings.defaultWagonsTarget);
            setMin(defaults.minage); setDeb(defaults.deblayage); setExt(defaults.extraction); setMaint(defaults.maintenance);
            setChfM(''); setChfN(''); setChf2M(''); setChf2N('');
            setSectChf(buildDefaultSectorChefs(pName, selectedDate, plannings, activeEmployees));
          };

          loadFree('Poste 1', setP1MinageRows, setP1DeblayageRows, setP1ExtractionRows, setP1MaintenanceRows, setP1ChiefMatricule, setP1ChiefName, setP1SecondChiefMatricule, setP1SecondChiefName, setP1SectorChefs);
          loadFree('Poste 2', setP2MinageRows, setP2DeblayageRows, setP2ExtractionRows, setP2MaintenanceRows, setP2ChiefMatricule, setP2ChiefName, setP2SecondChiefMatricule, setP2SecondChiefName, setP2SectorChefs);
          loadFree('Poste 3', setP3MinageRows, setP3DeblayageRows, setP3ExtractionRows, setP3MaintenanceRows, setP3ChiefMatricule, setP3ChiefName, setP3SecondChiefMatricule, setP3SecondChiefName, setP3SectorChefs);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedDate) {
      loadGlobalWorkbook();
    }
  }, [selectedDate]);

  useEffect(() => {
    if (!selectedDate) return;
    setDraftAvailable(!!localStorage.getItem(`draft_production_${selectedDate}`));
  }, [selectedDate]);

  useEffect(() => {
    if (!selectedDate || loading) return;
    const payload = {
      p1MinageRows, p1DeblayageRows, p1ExtractionRows, p1MaintenanceRows,
      p1ChiefMatricule, p1ChiefName, p1SecondChiefMatricule, p1SecondChiefName, p1SectorChefs,
      p2MinageRows, p2DeblayageRows, p2ExtractionRows, p2MaintenanceRows,
      p2ChiefMatricule, p2ChiefName, p2SecondChiefMatricule, p2SecondChiefName, p2SectorChefs,
      p3MinageRows, p3DeblayageRows, p3ExtractionRows, p3MaintenanceRows,
      p3ChiefMatricule, p3ChiefName, p3SecondChiefMatricule, p3SecondChiefName, p3SectorChefs,
    };
    const hasData = [
      p1MinageRows, p1DeblayageRows, p1ExtractionRows, p1MaintenanceRows,
      p2MinageRows, p2DeblayageRows, p2ExtractionRows, p2MaintenanceRows,
      p3MinageRows, p3DeblayageRows, p3ExtractionRows, p3MaintenanceRows
    ].some(arr => arr && arr.length > 0);
    if (hasData) {
      localStorage.setItem(`draft_production_${selectedDate}`, JSON.stringify(payload));
    }
  }, [
    selectedDate, loading,
    p1MinageRows, p1DeblayageRows, p1ExtractionRows, p1MaintenanceRows,
    p1ChiefMatricule, p1ChiefName, p1SecondChiefMatricule, p1SecondChiefName, p1SectorChefs,
    p2MinageRows, p2DeblayageRows, p2ExtractionRows, p2MaintenanceRows,
    p2ChiefMatricule, p2ChiefName, p2SecondChiefMatricule, p2SecondChiefName, p2SectorChefs,
    p3MinageRows, p3DeblayageRows, p3ExtractionRows, p3MaintenanceRows,
    p3ChiefMatricule, p3ChiefName, p3SecondChiefMatricule, p3SecondChiefName, p3SectorChefs,
  ]);

  const restoreDraft = () => {
    const savedDraft = localStorage.getItem(`draft_production_${selectedDate}`);
    if (savedDraft) {
      try {
        const d = JSON.parse(savedDraft);
        if (d.p1MinageRows) setP1MinageRows(d.p1MinageRows);
        if (d.p1DeblayageRows) setP1DeblayageRows(d.p1DeblayageRows);
        if (d.p1ExtractionRows) setP1ExtractionRows(d.p1ExtractionRows);
        if (d.p1MaintenanceRows) setP1MaintenanceRows(d.p1MaintenanceRows);
        if (d.p1ChiefMatricule !== undefined) setP1ChiefMatricule(d.p1ChiefMatricule);
        if (d.p1ChiefName !== undefined) setP1ChiefName(d.p1ChiefName);
        if (d.p1SecondChiefMatricule !== undefined) setP1SecondChiefMatricule(d.p1SecondChiefMatricule);
        if (d.p1SecondChiefName !== undefined) setP1SecondChiefName(d.p1SecondChiefName);
        if (d.p1SectorChefs) setP1SectorChefs(d.p1SectorChefs);

        if (d.p2MinageRows) setP2MinageRows(d.p2MinageRows);
        if (d.p2DeblayageRows) setP2DeblayageRows(d.p2DeblayageRows);
        if (d.p2ExtractionRows) setP2ExtractionRows(d.p2ExtractionRows);
        if (d.p2MaintenanceRows) setP2MaintenanceRows(d.p2MaintenanceRows);
        if (d.p2ChiefMatricule !== undefined) setP2ChiefMatricule(d.p2ChiefMatricule);
        if (d.p2ChiefName !== undefined) setP2ChiefName(d.p2ChiefName);
        if (d.p2SecondChiefMatricule !== undefined) setP2SecondChiefMatricule(d.p2SecondChiefMatricule);
        if (d.p2SecondChiefName !== undefined) setP2SecondChiefName(d.p2SecondChiefName);
        if (d.p2SectorChefs) setP2SectorChefs(d.p2SectorChefs);

        if (d.p3MinageRows) setP3MinageRows(d.p3MinageRows);
        if (d.p3DeblayageRows) setP3DeblayageRows(d.p3DeblayageRows);
        if (d.p3ExtractionRows) setP3ExtractionRows(d.p3ExtractionRows);
        if (d.p3MaintenanceRows) setP3MaintenanceRows(d.p3MaintenanceRows);
        if (d.p3ChiefMatricule !== undefined) setP3ChiefMatricule(d.p3ChiefMatricule);
        if (d.p3ChiefName !== undefined) setP3ChiefName(d.p3ChiefName);
        if (d.p3SecondChiefMatricule !== undefined) setP3SecondChiefMatricule(d.p3SecondChiefMatricule);
        if (d.p3SecondChiefName !== undefined) setP3SecondChiefName(d.p3SecondChiefName);
        if (d.p3SectorChefs) setP3SectorChefs(d.p3SectorChefs);
      } catch (err) {
        console.error(err);
      }
    }
  };

  return {
    user, profile,
    activeSheetTab, setActiveSheetTab,
    selectedDate,
    selectedPost, setSelectedPost,
    loading, setLoading,
    saveStatus, setSaveStatus,
    draftAvailable, setDraftAvailable, restoreDraft,
    isMonthClosed, setIsMonthClosed,
    exactPlanMissing, setExactPlanMissing,
    forceFreeEntryApproved, setForceFreeEntryApproved,
    noPlanFound, setNoPlanFound,
    isTemplateLoaded, setIsTemplateLoaded,
    planFoundType, setPlanFoundType,
    templateDateHint, setTemplateDateHint,
    unexplainedGaps,
    chantiers, employees, engines, plannings,
    allPlanningSheets, allProductionDocs, dataHistory,
    platformSettings,
    p1MinageRows, setP1MinageRows, p1DeblayageRows, setP1DeblayageRows, p1ExtractionRows, setP1ExtractionRows, p1MaintenanceRows, setP1MaintenanceRows,
    p1ChiefMatricule, setP1ChiefMatricule, p1ChiefName, setP1ChiefName, p1SecondChiefMatricule, setP1SecondChiefMatricule, p1SecondChiefName, setP1SecondChiefName, p1SectorChefs, setP1SectorChefs,
    p2MinageRows, setP2MinageRows, p2DeblayageRows, setP2DeblayageRows, p2ExtractionRows, setP2ExtractionRows, p2MaintenanceRows, setP2MaintenanceRows,
    p2ChiefMatricule, setP2ChiefMatricule, p2ChiefName, setP2ChiefName, p2SecondChiefMatricule, setP2SecondChiefMatricule, p2SecondChiefName, setP2SecondChiefName, p2SectorChefs, setP2SectorChefs,
    p3MinageRows, setP3MinageRows, p3DeblayageRows, setP3DeblayageRows, p3ExtractionRows, setP3ExtractionRows, p3MaintenanceRows, setP3MaintenanceRows,
    p3ChiefMatricule, setP3ChiefMatricule, p3ChiefName, setP3ChiefName, p3SecondChiefMatricule, setP3SecondChiefMatricule, p3SecondChiefName, setP3SecondChiefName, p3SectorChefs, setP3SectorChefs,
    getPostState, loadGlobalWorkbook, activeEmployees
  };
};
