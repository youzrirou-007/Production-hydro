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

export const useProduction = (initialDate: string) => {
  const { user, profile } = useAuth();

  // Active sheets
  const [activeSheetTab, setActiveSheetTab] = useState<ActivityName>('minage');

  // Selected filters
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [selectedPost, setSelectedPost] = useState<'Poste 1' | 'Poste 2' | 'Poste 3'>('Poste 1');

  // Loading/Save status
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Grids and sectors
  const [p1MinageRows, setP1MinageRows] = useState<ExcelMinage[]>([]);
  const [p2MinageRows, setP2MinageRows] = useState<ExcelMinage[]>([]);
  const [p3MinageRows, setP3MinageRows] = useState<ExcelMinage[]>([]);

  const [p1DeblayageRows, setP1DeblayageRows] = useState<ExcelDeblayage[]>([]);
  const [p2DeblayageRows, setP2DeblayageRows] = useState<ExcelDeblayage[]>([]);
  const [p3DeblayageRows, setP3DeblayageRows] = useState<ExcelDeblayage[]>([]);

  const [p1ExtractionRows, setP1ExtractionRows] = useState<ExcelExtraction[]>([]);
  const [p2ExtractionRows, setP2ExtractionRows] = useState<ExcelExtraction[]>([]);
  const [p3ExtractionRows, setP3ExtractionRows] = useState<ExcelExtraction[]>([]);

  const [p1MaintenanceRows, setP1MaintenanceRows] = useState<ExcelMaintenance[]>([]);
  const [p2MaintenanceRows, setP2MaintenanceRows] = useState<ExcelMaintenance[]>([]);
  const [p3MaintenanceRows, setP3MaintenanceRows] = useState<ExcelMaintenance[]>([]);

  // Sector chiefs
  const [p1SectorChefs, setP1SectorChefs] = useState<Record<string, string>>({ 'Imiter 2': '', 'Imiter 1': '', 'Imiter Est': '' });
  const [p2SectorChefs, setP2SectorChefs] = useState<Record<string, string>>({ 'Imiter 2': '', 'Imiter 1': '', 'Imiter Est': '' });
  const [p3SectorChefs, setP3SectorChefs] = useState<Record<string, string>>({ 'Imiter 2': '', 'Imiter 1': '', 'Imiter Est': '' });

  // References
  const [chantiers, setChantiers] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [engines, setEngines] = useState<any[]>([]);

  return {
    user, profile,
    activeSheetTab, setActiveSheetTab,
    selectedDate, setSelectedDate,
    selectedPost, setSelectedPost,
    loading, setLoading,
    saveStatus, setSaveStatus,
    p1MinageRows, setP1MinageRows,
    p2MinageRows, setP2MinageRows,
    p3MinageRows, setP3MinageRows,
    p1DeblayageRows, setP1DeblayageRows,
    p2DeblayageRows, setP2DeblayageRows,
    p3DeblayageRows, setP3DeblayageRows,
    p1ExtractionRows, setP1ExtractionRows,
    p2ExtractionRows, setP2ExtractionRows,
    p3ExtractionRows, setP3ExtractionRows,
    p1MaintenanceRows, setP1MaintenanceRows,
    p2MaintenanceRows, setP2MaintenanceRows,
    p3MaintenanceRows, setP3MaintenanceRows,
    p1SectorChefs, setP1SectorChefs,
    p2SectorChefs, setP2SectorChefs,
    p3SectorChefs, setP3SectorChefs,
    chantiers, setChantiers,
    employees, setEmployees,
    engines, setEngines,
  };
};
