import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { 
  collection, query, onSnapshot, setDoc, doc, getDocs, deleteDoc, 
  where, writeBatch, addDoc, getDoc 
} from 'firebase/firestore';
import { format } from 'date-fns';
import { 
  ExcelMinage, ExcelDeblayage, ExcelExtraction, ExcelMaintenance,
  ActivityName
} from '../types/mining';

export const usePlanning = (initialDate: string) => {
  const { user, profile } = useAuth();

  // App views: 'sheet' (Excel Mode) or 'history' (Consolidated lists)
  const [viewMode, setViewMode] = useState<'sheet' | 'history'>('sheet');
  const [activeSheetTab, setActiveSheetTab] = useState<ActivityName>('minage');

  // Core planning filters
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [selectedPost, setSelectedPost] = useState<'Poste 1' | 'Poste 2' | 'Poste 3'>('Poste 1');

  // Realtime month closure states
  const [isMonthClosedForPlanning, setIsMonthClosedForPlanning] = useState(false);
  const [monthClosureInfo, setMonthClosureInfo] = useState<{ closedBy: string; closedAt: string } | null>(null);

  // Local autosave states
  const [lastAutosaveTime, setLastAutosaveTime] = useState<Date | null>(null);
  const [draftAvailable, setDraftAvailable] = useState<{ savedAt: string; data: any } | null>(null);

  // Reference tables from Firebase
  const [planningsHistory, setPlanningsHistory] = useState<any[]>([]);
  const [deletedLogs, setDeletedLogs] = useState<any[]>([]);
  const [activeHistoryTab, setActiveHistoryTab] = useState<'books' | 'deletions'>('books');
  const [recordToDelete, setRecordToDelete] = useState<any | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletionNotification, setDeletionNotification] = useState<{ date: string; deletedBy: string } | null>(null);
  const [chantiers, setChantiers] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [engines, setEngines] = useState<any[]>([]);
  const [platformSettings, setPlatformSettings] = useState<{
    sectors: string[];
    engines: string[];
    oils: string[];
    defaultWagonsTarget?: number;
    lhdBucketCapacities?: Record<string, number>;
  }>({
    sectors: ['Imiter 1', 'Imiter 2', 'Imiter Est'],
    engines: ['ST2D', 'ST2G 1', 'ST2G 3', 'ST2G 4', 'ST2G 5', 'ST2G6'],
    oils: ['Huile Moteur 15W40', 'Huile Hydraulique HV46', 'Huile Hydraulique HV68', 'Huile Transmission SAE30', 'Huile Transmission SAE50', 'Graisse Extrême Pression'],
    defaultWagonsTarget: 48,
    lhdBucketCapacities: {
      'ST2D': 2.4,
      'ST2G': 2.0,
      'ST2G 1': 2.0,
      'ST2G 3': 2.0,
      'ST2G 4': 2.0,
      'ST2G 5': 2.0,
      'ST2G 6': 2.0,
    }
  });
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Traceability & signature states
  const [signatureInfo, setSignatureInfo] = useState<{
    savedBy?: string;
    savedAt?: string;
    lastModifiedBy?: string;
    lastModifiedAt?: string;
  } | null>(null);
  const [isPlanningSavedInDb, setIsPlanningSavedInDb] = useState(false);
  const [validationInfo, setValidationInfo] = useState<{
    validatedBy?: string;
    validatedByUid?: string;
    validatedAt?: string;
    status?: string;
  } | null>(null);
  const [modRequests, setModRequests] = useState<any[]>([]);
  const [currentTime, setCurrentTime] = useState(Date.now());
  const [productionDates, setProductionDates] = useState<Set<string>>(new Set());

  // Grids
  const [minageRowsByPost, setMinageRowsByPost] = useState<Record<'Poste 1' | 'Poste 2' | 'Poste 3', ExcelMinage[]>>({
    'Poste 1': [],
    'Poste 2': [],
    'Poste 3': []
  });
  const [deblayageRowsByPost, setDeblayageRowsByPost] = useState<Record<'Poste 1' | 'Poste 2' | 'Poste 3', ExcelDeblayage[]>>({
    'Poste 1': [],
    'Poste 2': [],
    'Poste 3': []
  });
  const [extractionRowsByPost, setExtractionRowsByPost] = useState<Record<'Poste 1' | 'Poste 2' | 'Poste 3', ExcelExtraction[]>>({
    'Poste 1': [],
    'Poste 2': [],
    'Poste 3': []
  });
  const [maintenanceRowsByPost, setMaintenanceRowsByPost] = useState<Record<'Poste 1' | 'Poste 2' | 'Poste 3', ExcelMaintenance[]>>({
    'Poste 1': [],
    'Poste 2': [],
    'Poste 3': []
  });
  const [sectorChiefs, setSectorChiefs] = useState<Record<'Poste 1' | 'Poste 2' | 'Poste 3', Record<'Imiter 2' | 'Imiter 1' | 'Imiter Est', string>>>({
    'Poste 1': { 'Imiter 2': '', 'Imiter 1': '', 'Imiter Est': '' },
    'Poste 2': { 'Imiter 2': '', 'Imiter 1': '', 'Imiter Est': '' },
    'Poste 3': { 'Imiter 2': '', 'Imiter 1': '', 'Imiter Est': '' }
  });
  const [sectorBoutefeus, setSectorBoutefeus] = useState<Record<'Poste 1' | 'Poste 2' | 'Poste 3', Record<'Imiter 2' | 'Imiter 1' | 'Imiter Est', string>>>({
    'Poste 1': { 'Imiter 2': '', 'Imiter 1': '', 'Imiter Est': '' },
    'Poste 2': { 'Imiter 2': '', 'Imiter 1': '', 'Imiter Est': '' },
    'Poste 3': { 'Imiter 2': '', 'Imiter 1': '', 'Imiter Est': '' }
  });
  const [sectorBoutefeuTasks, setSectorBoutefeuTasks] = useState<Record<'Poste 1' | 'Poste 2' | 'Poste 3', Record<'Imiter 2' | 'Imiter 1' | 'Imiter Est', string>>>({
    'Poste 1': { 'Imiter 2': '', 'Imiter 1': '', 'Imiter Est': '' },
    'Poste 2': { 'Imiter 2': '', 'Imiter 1': '', 'Imiter Est': '' },
    'Poste 3': { 'Imiter 2': '', 'Imiter 1': '', 'Imiter Est': '' }
  });

  return {
    user, profile,
    viewMode, setViewMode,
    activeSheetTab, setActiveSheetTab,
    selectedDate, setSelectedDate,
    selectedPost, setSelectedPost,
    isMonthClosedForPlanning, setIsMonthClosedForPlanning,
    monthClosureInfo, setMonthClosureInfo,
    lastAutosaveTime, setLastAutosaveTime,
    draftAvailable, setDraftAvailable,
    planningsHistory, setPlanningsHistory,
    deletedLogs, setDeletedLogs,
    activeHistoryTab, setActiveHistoryTab,
    recordToDelete, setRecordToDelete,
    isDeleteModalOpen, setIsDeleteModalOpen,
    deletionNotification, setDeletionNotification,
    chantiers, setChantiers,
    employees, setEmployees,
    engines, setEngines,
    platformSettings, setPlatformSettings,
    loading, setLoading,
    saveStatus, setSaveStatus,
    signatureInfo, setSignatureInfo,
    isPlanningSavedInDb, setIsPlanningSavedInDb,
    validationInfo, setValidationInfo,
    modRequests, setModRequests,
    currentTime, setCurrentTime,
    productionDates, setProductionDates,
    minageRowsByPost, setMinageRowsByPost,
    deblayageRowsByPost, setDeblayageRowsByPost,
    extractionRowsByPost, setExtractionRowsByPost,
    maintenanceRowsByPost, setMaintenanceRowsByPost,
    sectorChiefs, setSectorChiefs,
    sectorBoutefeus, setSectorBoutefeus,
    sectorBoutefeuTasks, setSectorBoutefeuTasks,
  };
};
