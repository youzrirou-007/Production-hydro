import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Plus, 
  Check, 
  Search, 
  Filter, 
  Calendar, 
  Hammer, 
  MapPin, 
  Clock, 
  X, 
  FileSpreadsheet,
  Save,
  RotateCcw,
  CheckCircle,
  Info,
  Wrench,
  Truck
} from 'lucide-react';
import { collection, query, onSnapshot, setDoc, doc, getDocs, deleteDoc, where, writeBatch, addDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { format, addDays } from 'date-fns';

// Excel interface structures matching Production schema for full planning alignment
interface ExcelMinage {
  chantierId: string;
  chiefMatricule: string;
  chiefName: string;
  minerMatricule: string;
  minerName: string;
  assistantMatricule: string;
  assistantName: string;
  gallerySize: 9 | 12; // m²
  plannedHoles: number;
  realHoles: number;
  plannedRounds: number;
  realRounds: number;
  meterage: number; // calculated target avancement
  anfo: number;
  tovex: number;
  ammorces: number;
  remarks: string;
}

interface ExcelDeblayage {
  chantierId: string;
  driverMatricule: string;
  driverName: string;
  engineId: string;
  engineCode: string;
  godets: number;
  volumeEstimated: number; // godets * 1.5
  hoursWorked: number;
  remarks: string;
}

interface ExcelExtraction {
  chantierName: string; // "Bure Imiter Est", "Bure Ouest", "Rampe Principale"
  treuilliste1: string;
  treuilliste2: string;
  treuilliste3: string;
  ouvriersCount: number;
  wagonsTarget: number;
  wagonsActual: number; // Not useful in planning but kept for structural synchronization with Production.tsx
  sterileBureImiterEst: number;
  remarks: string;
}

interface ExcelMaintenance {
  roleLabel: string; // MÉCANICIEN 1, etc.
  agentMatricule: string;
  agentName: string;
  engineId: string;
  engineCode: string;
  hoursSpent: number;
  workDescription: string;
}

export const Planning: React.FC = () => {
  const { user } = useAuth();

  // App views: 'sheet' (Excel Mode) or 'history' (Consolidated lists)
  const [viewMode, setViewMode] = useState<'sheet' | 'history'>('sheet');
  const [activeSheetTab, setActiveSheetTab] = useState<'minage' | 'deblayage' | 'extraction' | 'maintenance'>('minage');

  // Core planning filters: default date is tomorrow (addDays)
  const [selectedDate, setSelectedDate] = useState(format(addDays(new Date(), 1), 'yyyy-MM-dd'));
  const [selectedPost, setSelectedPost] = useState<'Poste 1' | 'Poste 2' | 'Poste 3'>('Poste 1');

  // Reference tables from Firebase
  const [planningsHistory, setPlanningsHistory] = useState<any[]>([]);
  const [chantiers, setChantiers] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [engines, setEngines] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Planning Excel grids template state
  const [minageRows, setMinageRows] = useState<ExcelMinage[]>([]);
  const [deblayageRows, setDeblayageRows] = useState<ExcelDeblayage[]>([]);
  const [extractionRows, setExtractionRows] = useState<ExcelExtraction[]>([]);
  const [maintenanceRows, setMaintenanceRows] = useState<ExcelMaintenance[]>([]);

  // Load baseline master configuration lists & historical saved sheets from Firestore
  useEffect(() => {
    // 1. Load consolidated planning record history
    const qHist = query(collection(db, 'daily_planning_sheets'));
    const unsubHist = onSnapshot(qHist, (snapshot) => {
      setPlanningsHistory(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // 2. Open mining work sites
    const qChan = query(collection(db, 'chantiers'), where('status', '==', 'ouvert'));
    const unsubChan = onSnapshot(qChan, (snapshot) => {
      setChantiers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // 3. Personnel records
    const qRH = query(collection(db, 'personnel'));
    const unsubRH = onSnapshot(qRH, (snapshot) => {
      setEmployees(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // 4. Heavy LHD machinery
    const qEngs = query(collection(db, 'engines'));
    const unsubEngs = onSnapshot(qEngs, (snapshot) => {
      setEngines(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => { unsubHist(); unsubChan(); unsubRH(); unsubEngs(); };
  }, []);

  // Sync Excel grid content whenever selected date, shift, or catalogs change
  useEffect(() => {
    loadPlanningWorkbook();
  }, [selectedDate, selectedPost, employees, chantiers, engines]);

  const loadPlanningWorkbook = async () => {
    setLoading(true);
    try {
      const docId = `${selectedDate}_${selectedPost.replace(/\s+/g, '_')}`;
      const qSnapshot = await getDocs(query(collection(db, 'daily_planning_sheets')));
      const matchedDoc = qSnapshot.docs.find(d => d.id === docId);

      if (matchedDoc && matchedDoc.exists()) {
        const workbook = matchedDoc.data();
        setMinageRows(workbook.minageRows || []);
        setDeblayageRows(workbook.deblayageRows || []);
        setExtractionRows(workbook.extractionRows || []);
        setMaintenanceRows(workbook.maintenanceRows || []);
      } else {
        // Build empty default grid templates (Aesthetic Swiss style high density layout)
        const initialMinage: ExcelMinage[] = Array.from({ length: 12 }, () => ({
          chantierId: '', chiefMatricule: '', chiefName: '', minerMatricule: '', minerName: '',
          assistantMatricule: '', assistantName: '', gallerySize: 12, plannedHoles: 32, realHoles: 32,
          plannedRounds: 1, realRounds: 1, meterage: 1.7, anfo: 50, tovex: 12, ammorces: 12, remarks: ''
        }));

        const initialDeblayage: ExcelDeblayage[] = Array.from({ length: 12 }, () => ({
          chantierId: '', driverMatricule: '', driverName: '', engineId: '', engineCode: '',
          godets: 0, volumeEstimated: 0, hoursWorked: 6, remarks: ''
        }));

        const initialExtraction: ExcelExtraction[] = [
          { chantierName: 'Bure Imiter Est', treuilliste1: '', treuilliste2: '', treuilliste3: '', ouvriersCount: 4, wagonsTarget: 48, wagonsActual: 0, sterileBureImiterEst: 0, remarks: '' },
          { chantierName: 'Bure Ouest', treuilliste1: '', treuilliste2: '', treuilliste3: '', ouvriersCount: 4, wagonsTarget: 48, wagonsActual: 0, sterileBureImiterEst: 0, remarks: '' },
          { chantierName: 'Rampe Principale', treuilliste1: '', treuilliste2: '', treuilliste3: '', ouvriersCount: 4, wagonsTarget: 48, wagonsActual: 0, sterileBureImiterEst: 0, remarks: '' }
        ];

        const initialMaintenance: ExcelMaintenance[] = [
          { roleLabel: 'MÉCANICIEN 1', agentMatricule: '', agentName: '', engineId: '', engineCode: '', hoursSpent: 6, workDescription: '' },
          { roleLabel: 'MÉCANICIEN 2', agentMatricule: '', agentName: '', engineId: '', engineCode: '', hoursSpent: 6, workDescription: '' },
          { roleLabel: 'MÉCANICIEN 3', agentMatricule: '', agentName: '', engineId: '', engineCode: '', hoursSpent: 6, workDescription: '' },
          { roleLabel: 'MÉCANICIEN 4', agentMatricule: '', agentName: '', engineId: '', engineCode: '', hoursSpent: 6, workDescription: '' },
          { roleLabel: 'CHAUDRONNIER', agentMatricule: '', agentName: '', engineId: '', engineCode: '', hoursSpent: 6, workDescription: '' },
          { roleLabel: 'ÉLECTRICIEN', agentMatricule: '', agentName: '', engineId: '', engineCode: '', hoursSpent: 6, workDescription: '' },
        ];

        setMinageRows(initialMinage);
        setDeblayageRows(initialDeblayage);
        setExtractionRows(initialExtraction);
        setMaintenanceRows(initialMaintenance);
      }
    } catch (err) {
      console.error("Erreur de chargement du classeur : ", err);
    } finally {
      setLoading(false);
    }
  };

  // Personnel lookup helper
  const getEmployeeName = (matricule: string) => {
    const emp = employees.find(e => e.matricule?.toUpperCase() === matricule?.trim().toUpperCase() && e.status === 'actif');
    return emp ? `${emp.nom} ${emp.prenom} (${emp.fonction})` : '';
  };

  // Cell state modifier handlers
  const updateMinageCell = (index: number, field: keyof ExcelMinage, value: any) => {
    const clone = [...minageRows];
    clone[index] = { ...clone[index], [field]: value };
    
    if (field === 'chiefMatricule') {
      const emp = employees.find(e => e.matricule?.toUpperCase() === String(value).trim().toUpperCase());
      clone[index].chiefName = emp ? `${emp.nom} ${emp.prenom}` : 'Inconnu';
    }
    if (field === 'minerMatricule') {
      const emp = employees.find(e => e.matricule?.toUpperCase() === String(value).trim().toUpperCase());
      clone[index].minerName = emp ? `${emp.nom} ${emp.prenom}` : 'Inconnu';
    }
    if (field === 'assistantMatricule') {
      const emp = employees.find(e => e.matricule?.toUpperCase() === String(value).trim().toUpperCase());
      clone[index].assistantName = emp ? `${emp.nom} ${emp.prenom}` : 'Inconnu';
    }
    if (field === 'plannedRounds') {
      clone[index].meterage = Number(value) * 1.7;
    }
    setMinageRows(clone);
  };

  const updateDeblayageCell = (index: number, field: keyof ExcelDeblayage, value: any) => {
    const clone = [...deblayageRows];
    clone[index] = { ...clone[index], [field]: value };

    if (field === 'driverMatricule') {
      const emp = employees.find(e => e.matricule?.toUpperCase() === String(value).trim().toUpperCase());
      clone[index].driverName = emp ? `${emp.nom} ${emp.prenom}` : 'Inconnu';
    }
    if (field === 'engineId') {
      const eng = engines.find(e => e.id === value);
      clone[index].engineCode = eng ? eng.code : '';
    }
    if (field === 'godets') {
      clone[index].volumeEstimated = Number(value) * 1.5;
    }
    setDeblayageRows(clone);
  };

  const updateExtractionCell = (index: number, field: keyof ExcelExtraction, value: any) => {
    const clone = [...extractionRows];
    clone[index] = { ...clone[index], [field]: value };
    setExtractionRows(clone);
  };

  const updateMaintenanceCell = (index: number, field: keyof ExcelMaintenance, value: any) => {
    const clone = [...maintenanceRows];
    clone[index] = { ...clone[index], [field]: value };

    if (field === 'agentMatricule') {
      const emp = employees.find(e => e.matricule?.toUpperCase() === String(value).trim().toUpperCase());
      clone[index].agentName = emp ? `${emp.nom} ${emp.prenom}` : 'Inconnu';
    }
    if (field === 'engineId') {
      const eng = engines.find(e => e.id === value);
      clone[index].engineCode = eng ? eng.code : '';
    }
    setMaintenanceRows(clone);
  };

  // Master Workbook Persistence and Sync to granular discrete planning collection
  const savePlanningWorkbook = async () => {
    setSaveStatus('saving');
    try {
      const docId = `${selectedDate}_${selectedPost.replace(/\s+/g, '_')}`;
      
      const payload = {
        date: selectedDate,
        post: selectedPost,
        operator: user?.email || 'Planificateur de Direction SMI',
        timestamp: new Date().toISOString(),
        minageRows: minageRows.filter(r => r.chantierId !== ''),
        deblayageRows: deblayageRows.filter(r => r.driverMatricule !== ''),
        extractionRows: extractionRows,
        maintenanceRows: maintenanceRows.filter(r => r.agentMatricule !== '')
      };

      // 1. Commit consolidated sheet doc
      await setDoc(doc(db, 'daily_planning_sheets', docId), payload);

      // 2. Fetch and delete existing discrete planning docs matching date + post to allow total overwriting
      const planColl = collection(db, 'planning');
      const qExist = query(planColl, where('date', '==', selectedDate), where('post', '==', selectedPost));
      const existSnap = await getDocs(qExist);
      
      for (const d of existSnap.docs) {
        await deleteDoc(doc(db, 'planning', d.id));
      }

      // 3. Populate new granular plans for automated pre-filling inside Saisie/Production page
      // Save planned Minage rows
      for (const row of minageRows.filter(r => r.chantierId !== '')) {
        const chantierObj = chantiers.find(c => c.id === row.chantierId);
        await addDoc(planColl, {
          date: selectedDate,
          post: selectedPost,
          type: 'minage',
          chantierId: row.chantierId,
          chantierName: chantierObj?.name || 'Slick',
          chiefMatricule: row.chiefMatricule,
          chiefName: row.chiefName,
          minerMatricule: row.minerMatricule,
          minerName: row.minerName,
          assistantMatricule: row.assistantMatricule,
          assistantName: row.assistantName,
          galleryType: row.gallerySize === 9 ? '9m2' : '12m2',
          plannedHoles: row.plannedHoles,
          plannedRounds: row.plannedRounds,
          explosives: {
            anfo: row.anfo,
            tovex: row.tovex,
            ammorces: row.ammorces
          }
        });
      }

      // Save planned LHD Deblayage rows
      for (const row of deblayageRows.filter(r => r.driverMatricule !== '')) {
        const chantierObj = chantiers.find(c => c.id === row.chantierId);
        const engineObj = engines.find(e => e.id === row.engineId);
        await addDoc(planColl, {
          date: selectedDate,
          post: selectedPost,
          type: 'deblayage',
          chantierId: row.chantierId,
          chantierName: chantierObj?.name || 'Slick',
          driverMatricule: row.driverMatricule,
          driverName: row.driverName,
          engineId: row.engineId,
          engineCode: row.engineCode,
          engineName: engineObj?.name || ''
        });
      }

      // Save planned Support Maintenance rows
      for (const row of maintenanceRows.filter(r => r.agentMatricule !== '')) {
        const engineObj = engines.find(e => e.id === row.engineId);
        await addDoc(planColl, {
          date: selectedDate,
          post: selectedPost,
          type: 'maintenance',
          agentMatricule: row.agentMatricule,
          agentName: row.agentName,
          agentFonction: row.roleLabel,
          engineId: row.engineId,
          engineCode: row.engineCode,
          engineName: engineObj?.name || '',
          visitType: 'preventive',
          description: row.workDescription
        });
      }

      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2500);
    } catch (err) {
      console.error("Erreur de sauvegarde de planification :", err);
      setSaveStatus('error');
    }
  };

  return (
    <div className="space-y-4">
      {/* Dense industrial header bar */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end border-b-2 border-[#141414] pb-2 gap-2">
        <div>
          <h3 className="text-xl font-black tracking-tight text-[#141414] uppercase flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-[#00BFFF]" /> Planification-Ordonnancement SMI
          </h3>
          <p className="text-[9px] font-bold uppercase tracking-wider text-gray-500">
            Cahier de Chargement Théorique • Alignement optimal des équipes et chantiers du fond
          </p>
        </div>

        {/* View Toggle tabs */}
        <div className="flex gap-1.5 p-1 bg-[#141414]/5">
          <button 
            onClick={() => setViewMode('sheet')}
            className={`px-3 py-1 font-black text-[9px] uppercase tracking-wider transition-all border ${
              viewMode === 'sheet' 
                ? 'bg-[#141414] text-white border-[#141414]' 
                : 'bg-white text-gray-700 border-[#141414]/10 hover:bg-gray-50'
            }`}
          >
            🟩 Planification interactive
          </button>
          <button 
            onClick={() => setViewMode('history')}
            className={`px-3 py-1 font-black text-[9px] uppercase tracking-wider transition-all border ${
              viewMode === 'history' 
                ? 'bg-[#141414] text-white border-[#141414]' 
                : 'bg-white text-gray-700 border-[#141414]/10 hover:bg-gray-50'
            }`}
          >
            📋 Cahiers planifiés ({planningsHistory.length})
          </button>
        </div>
      </div>

      {/* Date & Shift workbook controller */}
      <div className="bg-[#141414] text-white p-3 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-[#00BFFF]" />
            <span className="text-[9px] font-black uppercase text-white/50">Plan théorique du :</span>
            <input 
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="bg-white/10 text-white font-black text-[10px] uppercase border-0 outline-none px-2 py-1 focus:bg-white focus:text-[#141414]"
            />
          </div>

          <div className="flex items-center gap-2 border-l border-white/20 pl-4">
            <span className="text-[9px] font-black uppercase text-white/50">Poste :</span>
            <select 
              value={selectedPost}
              onChange={e => setSelectedPost(e.target.value as any)}
              className="bg-white/10 text-white font-black text-[10px] uppercase border-0 outline-none px-2 py-1 focus:bg-white focus:text-[#141414] appearance-none"
            >
              <option value="Poste 1" className="text-black">POSTE 1 (MATIN)</option>
              <option value="Poste 2" className="text-black">POSTE 2 (MIDI)</option>
              <option value="Poste 3" className="text-black">POSTE 3 (NUIT)</option>
            </select>
          </div>
        </div>

        {viewMode === 'sheet' && (
          <div className="flex items-center gap-2">
            <button
              onClick={loadPlanningWorkbook}
              className="bg-white/10 hover:bg-white/20 text-white px-3 py-1 text-[9px] font-bold uppercase transition-all flex items-center gap-1.5"
              title="Réinitialiser ou recharger depuis le cloud"
            >
              <RotateCcw className="w-3 h-3 text-[#00BFFF]" /> Recharger
            </button>
            <button
              onClick={savePlanningWorkbook}
              disabled={saveStatus === 'saving'}
              className="bg-[#00BFFF] hover:bg-[#00BFFF]/90 text-white font-black px-4 py-1.5 text-[9px] uppercase tracking-wider flex items-center gap-2 transition-all shadow-md active:translate-y-px"
            >
              <Save className="w-3.5 h-3.5" /> 
              {saveStatus === 'saving' ? 'Enregistrement...' : saveStatus === 'saved' ? '✓ Enregistré !' : 'Graver l\'Ordonnancement'}
            </button>
          </div>
        )}
      </div>

      {loading ? (
        <div className="py-20 text-center text-[10px] font-bold text-gray-400 uppercase tracking-widest animate-pulse">
          Synchronisation du planning avec Firestore...
        </div>
      ) : viewMode === 'sheet' ? (
        <div className="space-y-4">
          
          {/* SPREADSHEET WORKSPACE */}
          <div className="w-full space-y-3 bg-white border border-[#141414] p-3 shadow-md">
            
            {/* Sheet Tabs */}
            <div className="flex items-center border-b border-gray-200 pb-1.5 gap-1">
              {[
                { id: 'minage', label: '🔨 Sheet 1 - Alignement Forage & Minage', activeColor: 'border-b-2 border-red-600 font-black text-red-700' },
                { id: 'deblayage', label: '🚜 Sheet 2 - Programme Déblayage & Vol', activeColor: 'border-b-2 border-[#00BFFF] font-black text-[#00BFFF]' },
                { id: 'extraction', label: '🚃 Sheet 3 - Objectifs Extraction', activeColor: 'border-b-2 border-green-600 font-black text-green-700' },
                { id: 'maintenance', label: '🔧 Sheet 4 - Brigade Maintenance Programmée', activeColor: 'border-b-2 border-purple-600 font-black text-purple-700' },
              ].map(sheet => (
                <button
                  key={sheet.id}
                  onClick={() => setActiveSheetTab(sheet.id as any)}
                  className={`px-3 py-1 text-[9px] uppercase tracking-wider transition-colors border-r border-gray-100 ${
                    activeSheetTab === sheet.id 
                      ? sheet.activeColor + ' bg-gray-50 font-black' 
                      : 'text-gray-400 hover:text-[#141414]'
                  }`}
                >
                  {sheet.label}
                </button>
              ))}
            </div>

            {/* SHEET 1: BLASTING & MINAGE GRID */}
            {activeSheetTab === 'minage' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse border border-gray-200">
                  <thead>
                    <tr className="bg-gray-100 text-[#141414] border-b border-gray-300">
                      <th className="p-1 text-[9px] font-black uppercase text-center w-8">Row</th>
                      <th className="p-1 text-[9px] font-black uppercase w-40 border-r border-gray-300">Chantier Souterrain</th>
                      <th className="p-1 text-[9px] font-black uppercase w-24 border-r border-gray-300">Matr. Chef</th>
                      <th className="p-1 text-[9px] font-black uppercase w-24 border-r border-gray-300">Matr. Mineur</th>
                      <th className="p-1 text-[9px] font-black uppercase w-24 border-r border-gray-300">Matr. Aide</th>
                      <th className="p-1 text-[9px] font-black uppercase w-16 border-r border-gray-300 text-center">Galerie (m²)</th>
                      <th className="p-1 text-[9px] font-black uppercase w-16 border-r border-gray-300 text-center">Volées Cibles</th>
                      <th className="p-1 text-[9px] font-black uppercase w-20 border-r border-gray-300 text-center">Avancement (m)</th>
                      <th className="p-1 text-[9px] font-black uppercase">Consignes / Remarques</th>
                    </tr>
                  </thead>
                  <tbody>
                    {minageRows.map((row, idx) => {
                      const chefValidName = getEmployeeName(row.chiefMatricule);
                      const minerValidName = getEmployeeName(row.minerMatricule);
                      const assistantValidName = getEmployeeName(row.assistantMatricule);

                      return (
                        <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50/50">
                          <td className="p-1 text-[9px] font-mono text-gray-400 text-center bg-gray-50 border-r border-gray-200">{idx + 1}</td>
                          <td className="p-1 border-r border-gray-200">
                            <select
                              value={row.chantierId}
                              onChange={e => updateMinageCell(idx, 'chantierId', e.target.value)}
                              className="w-full text-[10px] font-semibold border border-transparent hover:border-gray-300 focus:border-[#00BFFF] outline-none bg-transparent p-0.5"
                            >
                              <option value="">(Vide / Aucun)</option>
                              {chantiers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                          </td>
                          <td className="p-1 border-r border-gray-200 relative group">
                            <input
                              type="text"
                              placeholder="M-..."
                              value={row.chiefMatricule}
                              onChange={e => updateMinageCell(idx, 'chiefMatricule', e.target.value.toUpperCase())}
                              className="w-full text-[10px] font-mono border border-transparent hover:border-gray-300 focus:border-[#00BFFF] outline-none bg-transparent p-0.5 uppercase"
                            />
                            {chefValidName && (
                              <div className="absolute left-0 bottom-full bg-[#141414] text-white p-1 text-[8px] rounded hidden group-focus-within:block z-10 whitespace-nowrap">
                                {chefValidName}
                              </div>
                            )}
                          </td>
                          <td className="p-1 border-r border-gray-200 relative group">
                            <input
                              type="text"
                              placeholder="M-..."
                              value={row.minerMatricule}
                              onChange={e => updateMinageCell(idx, 'minerMatricule', e.target.value.toUpperCase())}
                              className="w-full text-[10px] font-mono border border-transparent hover:border-gray-300 focus:border-[#00BFFF] outline-none bg-transparent p-0.5 uppercase"
                            />
                            {minerValidName && (
                              <div className="absolute left-0 bottom-full bg-[#141414] text-white p-1 text-[8px] rounded hidden group-focus-within:block z-10 whitespace-nowrap">
                                {minerValidName}
                              </div>
                            )}
                          </td>
                          <td className="p-1 border-r border-gray-200 relative group">
                            <input
                              type="text"
                              placeholder="M-..."
                              value={row.assistantMatricule}
                              onChange={e => updateMinageCell(idx, 'assistantMatricule', e.target.value.toUpperCase())}
                              className="w-full text-[10px] font-mono border border-transparent hover:border-gray-300 focus:border-[#00BFFF] outline-none bg-transparent p-0.5 uppercase"
                            />
                            {assistantValidName && (
                              <div className="absolute left-0 bottom-full bg-[#141414] text-white p-1 text-[8px] rounded hidden group-focus-within:block z-10 whitespace-nowrap">
                                {assistantValidName}
                              </div>
                            )}
                          </td>
                           <td className="p-1 border-r border-gray-200 text-center">
                            <select
                              value={row.gallerySize}
                              onChange={e => updateMinageCell(idx, 'gallerySize', Number(e.target.value))}
                              className="text-[10px] bg-transparent outline-none w-full text-center p-0.5 font-bold"
                            >
                              <option value={9}>9 m²</option>
                              <option value={12}>12 m²</option>
                            </select>
                          </td>
                          <td className="p-1 border-r border-gray-200 text-center">
                            <input
                              type="number"
                              value={row.plannedRounds}
                              onChange={e => updateMinageCell(idx, 'plannedRounds', Number(e.target.value))}
                              className="w-full text-[10px] font-mono text-center border border-transparent hover:border-gray-300 focus:border-[#00BFFF] outline-none bg-transparent p-0.5 font-bold"
                            />
                          </td>
                          <td className="p-1 border-r border-gray-200 text-center bg-[#00BFFF]/5 font-black text-blue-700">
                            {row.meterage.toFixed(1)}m
                          </td>
                          <td className="p-1">
                            <input
                              type="text"
                              placeholder="Prescription géologique, vitesse d'avancement..."
                              value={row.remarks}
                              onChange={e => updateMinageCell(idx, 'remarks', e.target.value)}
                              className="w-full text-[9px] border border-transparent hover:border-gray-300 focus:border-[#00BFFF] outline-none bg-transparent p-0.5"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* SHEET 2: LOADER DEBLAYAGE GRID */}
            {activeSheetTab === 'deblayage' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse border border-gray-200">
                  <thead>
                    <tr className="bg-gray-100 text-[#141414] border-b border-gray-300">
                      <th className="p-1 text-[9px] font-black uppercase text-center w-8">Row</th>
                      <th className="p-1 text-[9px] font-black uppercase w-40 border-r border-gray-300">Nettoyage Chantier</th>
                      <th className="p-1 text-[9px] font-black uppercase w-24 border-r border-gray-300">Matr. Conducteur</th>
                      <th className="p-1 text-[9px] font-black uppercase w-36 border-r border-gray-300">Conducteur Nom</th>
                      <th className="p-1 text-[9px] font-black uppercase w-48 border-r border-gray-300">Engin Assigné (LHD)</th>
                      <th className="p-1 text-[9px] font-black uppercase w-20 border-r border-gray-300 text-center bg-[#00BFFF]/5 text-[#00BFFF]">Nombre Godets Cibles</th>
                      <th className="p-1 text-[9px] font-black uppercase w-24 border-r border-gray-300 text-center">Volume Théorique (m³)</th>
                      <th className="p-1 text-[9px] font-black uppercase w-16 border-r border-gray-300 text-center">Heures Prévues</th>
                      <th className="p-1 text-[9px] font-black uppercase">Directives Planification</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deblayageRows.map((row, idx) => {
                      const condValidName = getEmployeeName(row.driverMatricule);

                      return (
                        <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50/50">
                          <td className="p-1 text-[9px] font-mono text-gray-400 text-center bg-gray-50 border-r border-gray-200">{idx + 1}</td>
                          <td className="p-1 border-r border-gray-200">
                            <select
                              value={row.chantierId}
                              onChange={e => updateDeblayageCell(idx, 'chantierId', e.target.value)}
                              className="w-full text-[10px] font-semibold border border-transparent hover:border-gray-300 focus:border-[#00BFFF] outline-none bg-transparent p-0.5"
                            >
                              <option value="">(Choisir chantier)</option>
                              {chantiers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                          </td>
                          <td className="p-1 border-r border-gray-200 relative">
                            <input
                              type="text"
                              placeholder="M-..."
                              value={row.driverMatricule}
                              onChange={e => updateDeblayageCell(idx, 'driverMatricule', e.target.value.toUpperCase())}
                              className="w-full text-[10px] font-mono border border-transparent hover:border-gray-300 focus:border-[#00BFFF] outline-none bg-transparent p-0.5 uppercase"
                            />
                          </td>
                          <td className="p-1 border-r border-gray-200 text-[10px] font-medium text-gray-500 bg-gray-50/50">
                            {condValidName ? condValidName.split(' ')[0] + ' ' + (condValidName.split(' ')[1] || '') : 'Aucun'}
                          </td>
                          <td className="p-1 border-r border-gray-200">
                            <select
                              value={row.engineId}
                              onChange={e => updateDeblayageCell(idx, 'engineId', e.target.value)}
                              className="w-full text-[10px] border border-transparent hover:border-gray-300 focus:border-[#00BFFF] outline-none bg-transparent p-0.5"
                            >
                              <option value="">-- CHOISIR ENGIN --</option>
                              {engines.map(eng => (
                                <option key={eng.id} value={eng.id}>
                                  [{eng.code}] - {eng.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="p-1 border-r border-gray-200 text-center bg-[#00BFFF]/5">
                            <input
                              type="number"
                              value={row.godets === 0 ? '' : row.godets}
                              placeholder="0"
                              onChange={e => updateDeblayageCell(idx, 'godets', Number(e.target.value))}
                              className="w-full text-[10px] font-black text-center text-blue-800 outline-none bg-transparent p-0.5"
                            />
                          </td>
                          <td className="p-1 border-r border-gray-200 text-center text-[10px] font-mono font-bold text-gray-700 bg-gray-50">
                            {row.volumeEstimated.toFixed(1)} m³
                          </td>
                          <td className="p-1 border-r border-gray-200 text-center">
                            <input
                              type="number"
                              step="0.5"
                              value={row.hoursWorked}
                              onChange={e => updateDeblayageCell(idx, 'hoursWorked', Number(e.target.value))}
                              className="w-full text-[10px] font-mono text-center outline-none bg-transparent p-0.5"
                            />
                          </td>
                          <td className="p-1">
                            <input
                              type="text"
                              placeholder="Sens de déblayage, niveau de priorité..."
                              value={row.remarks}
                              onChange={e => updateDeblayageCell(idx, 'remarks', e.target.value)}
                              className="w-full text-[9px] border border-transparent hover:border-gray-300 focus:border-[#00BFFF] outline-none bg-transparent p-0.5"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* SHEET 3: WINCH EXTRACTION GRID */}
            {activeSheetTab === 'extraction' && (
              <div className="overflow-x-auto text-[11px]">
                <table className="w-full text-left border-collapse border border-gray-200">
                  <thead>
                    <tr className="bg-gray-100 text-[#141414] border-b border-gray-300">
                      <th className="p-1 text-[9px] font-black uppercase text-center w-8">Row</th>
                      <th className="p-1 text-[9px] font-black uppercase w-48 border-r border-gray-300">Bure / Secteur Extraction</th>
                      <th className="p-1 text-[9px] font-black uppercase w-28 border-r border-gray-300">Treuilliste 1</th>
                      <th className="p-1 text-[9px] font-black uppercase w-28 border-r border-gray-300">Treuilliste 2</th>
                      <th className="p-1 text-[9px] font-black uppercase w-28 border-r border-gray-300">Treuilliste 3</th>
                      <th className="p-1 text-[9px] font-black uppercase w-14 border-r border-gray-300 text-center">Ouvriers</th>
                      <th className="p-1 text-[9px] font-black uppercase w-20 border-r border-gray-300 text-center bg-green-50 text-green-900">Wagons Cible</th>
                      <th className="p-1 text-[9px] font-black uppercase w-22 border-r border-gray-300 text-center font-mono text-indigo-700">Durée/Wagon visée</th>
                      <th className="p-1 text-[9px] font-black uppercase w-16 border-r border-gray-300 text-center">Stérile prévu</th>
                      <th className="p-1 text-[9px] font-black uppercase">Consignes spéciales</th>
                    </tr>
                  </thead>
                  <tbody>
                    {extractionRows.map((row, idx) => {
                      const avgMin = row.wagonsTarget > 0 ? (360 / row.wagonsTarget) : 0;

                      return (
                        <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50/50">
                          <td className="p-1 text-[9px] font-mono text-gray-400 text-center bg-gray-50 border-r border-gray-200">{idx + 1}</td>
                          <td className="p-1 border-r border-gray-200 font-bold uppercase text-[#141414] bg-gray-50/55">{row.chantierName}</td>
                          <td className="p-1 border-r border-gray-200">
                            <input
                              type="text"
                              placeholder="M-..."
                              value={row.treuilliste1}
                              onChange={e => updateExtractionCell(idx, 'treuilliste1', e.target.value.toUpperCase())}
                              className="w-full text-[10px] font-mono border border-transparent hover:border-gray-300 focus:border-[#00BFFF] outline-none bg-transparent p-0.5"
                            />
                          </td>
                          <td className="p-1 border-r border-gray-200">
                            <input
                              type="text"
                              placeholder="M-..."
                              value={row.treuilliste2}
                              onChange={e => updateExtractionCell(idx, 'treuilliste2', e.target.value.toUpperCase())}
                              className="w-full text-[10px] font-mono border border-transparent hover:border-gray-300 focus:border-[#00BFFF] outline-none bg-transparent p-0.5"
                            />
                          </td>
                          <td className="p-1 border-r border-gray-200">
                            <input
                              type="text"
                              placeholder="M-..."
                              value={row.treuilliste3}
                              onChange={e => updateExtractionCell(idx, 'treuilliste3', e.target.value.toUpperCase())}
                              className="w-full text-[10px] font-mono border border-transparent hover:border-gray-300 focus:border-[#00BFFF] outline-none bg-transparent p-0.5"
                            />
                          </td>
                          <td className="p-1 border-r border-gray-200 text-center">
                            <input
                              type="number"
                              value={row.ouvriersCount}
                              onChange={e => updateExtractionCell(idx, 'ouvriersCount', Number(e.target.value))}
                              className="w-full text-[10px] text-center border border-transparent hover:border-gray-300 focus:border-[#00BFFF] outline-none bg-transparent p-0.5"
                            />
                          </td>
                          <td className="p-1 border-r border-gray-200 text-center bg-green-50/50 font-black">
                            <input
                              type="number"
                              value={row.wagonsTarget}
                              onChange={e => updateExtractionCell(idx, 'wagonsTarget', Number(e.target.value))}
                              className="w-full text-[11px] font-black text-center text-green-800 outline-none bg-transparent p-0.5"
                            />
                          </td>
                          <td className="p-1 border-r border-gray-200 text-center font-mono font-black text-indigo-700 bg-indigo-50/30">
                            {row.wagonsTarget > 0 ? `${avgMin.toFixed(1)} mins` : '--'}
                          </td>
                          <td className="p-1 border-r border-gray-200 text-center">
                            <input
                              type="number"
                              value={row.sterileBureImiterEst}
                              onChange={e => updateExtractionCell(idx, 'sterileBureImiterEst', Number(e.target.value))}
                              className="w-full text-[10px] font-mono text-center outline-none bg-transparent p-0.5 text-gray-600 font-bold"
                            />
                          </td>
                          <td className="p-1">
                            <input
                              type="text"
                              placeholder="Instructions d'evacuation, entretien treuils..."
                              value={row.remarks}
                              onChange={e => updateExtractionCell(idx, 'remarks', e.target.value)}
                              className="w-full text-[9px] border border-transparent hover:border-gray-300 focus:border-[#00BFFF] outline-none bg-transparent p-0.5"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* SHEET 4: BRIGADE MAINTENANCE SUPPORT */}
            {activeSheetTab === 'maintenance' && (
              <div className="overflow-x-auto text-[11px]">
                <table className="w-full text-left border-collapse border border-gray-200">
                  <thead>
                    <tr className="bg-gray-100 text-[#141414] border-b border-gray-300">
                      <th className="p-1 text-[9px] font-black uppercase text-center w-8">Row</th>
                      <th className="p-1 text-[9px] font-black uppercase w-32 border-r border-gray-300">Rôle Fixe SMI</th>
                      <th className="p-1 text-[9px] font-black uppercase w-24 border-r border-gray-300">Matr. Spécialiste</th>
                      <th className="p-1 text-[9px] font-black uppercase w-36 border-r border-gray-300">Nom Spécialiste</th>
                      <th className="p-1 text-[9px] font-black uppercase w-48 border-r border-gray-300">Machine d'Intervention</th>
                      <th className="p-1 text-[9px] font-black uppercase w-16 border-r border-gray-300 text-center">Heures</th>
                      <th className="p-1 text-[9px] font-black uppercase">Fiche d'Opérations techniques de maintenance planifiée</th>
                    </tr>
                  </thead>
                  <tbody>
                    {maintenanceRows.map((row, idx) => {
                      const expertValidName = getEmployeeName(row.agentMatricule);

                      return (
                        <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50/50">
                          <td className="p-1 text-[9px] font-mono text-gray-400 text-center bg-gray-50 border-r border-gray-200">{idx + 1}</td>
                          <td className="p-1 border-r border-gray-200 font-black uppercase text-purple-700 bg-[#A020F0]/5">{row.roleLabel}</td>
                          <td className="p-1 border-r border-gray-200">
                            <input
                              type="text"
                              placeholder="M-..."
                              value={row.agentMatricule}
                              onChange={e => updateMaintenanceCell(idx, 'agentMatricule', e.target.value.toUpperCase())}
                              className="w-full text-[10px] font-mono border border-transparent hover:border-gray-300 focus:border-[#A020F0] outline-none bg-transparent p-0.5"
                            />
                          </td>
                          <td className="p-1 border-r border-gray-200 text-[10px] font-semibold text-gray-500 bg-gray-50">
                            {expertValidName ? expertValidName.split(' ')[0] + ' ' + (expertValidName.split(' ')[1] || '') : 'Inconnu'}
                          </td>
                          <td className="p-1 border-r border-gray-200">
                            <select
                              value={row.engineId}
                              onChange={e => updateMaintenanceCell(idx, 'engineId', e.target.value)}
                              className="w-full text-[10px] border border-transparent hover:border-gray-300 focus:border-[#A020F0] outline-none bg-transparent p-0.5"
                            >
                              <option value="">(Aucun engin repéré)</option>
                              {engines.map(eng => (
                                <option key={eng.id} value={eng.id}>
                                  [{eng.code}] - {eng.name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="p-1 border-r border-gray-200 text-center">
                            <input
                              type="number"
                              value={row.hoursSpent}
                              onChange={e => updateMaintenanceCell(idx, 'hoursSpent', Number(e.target.value))}
                              className="w-full text-[10px] font-mono text-center outline-none bg-transparent p-0.5"
                            />
                          </td>
                          <td className="p-1">
                            <input
                              type="text"
                              placeholder="Visite périodique des 250h, graissage, vidange pont..."
                              value={row.workDescription}
                              onChange={e => updateMaintenanceCell(idx, 'workDescription', e.target.value)}
                              className="w-full text-[9px] border border-transparent hover:border-gray-300 focus:border-[#00BFFF] outline-none bg-transparent p-0.5 uppercase"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Auto Legend Info */}
            <div className="flex justify-between items-center text-[8px] text-gray-400 mt-2 italic bg-gray-50 p-2 border border-gray-100/50">
              <span>* Les prévisions de chargement s'injectent instantanément dans les fiches de Saisie Surface correspondantes.</span>
              <span>* Matrice automatisée : Le nom et la fonction de l'effectif se cherchent en temps réel en tapant le matricule.</span>
            </div>
          </div>

          {/* INTEGRATED FULL-WIDTH BOTTOM SUMMARY BAR */}
          <div className="bg-[#141414] text-white p-4 flex flex-col md:flex-row items-center justify-between gap-4 border border-[#141414] shadow-md">
            <div className="flex items-center gap-6">
              <div className="border-r border-white/20 pr-6">
                <span className="text-white/40 uppercase text-[8px] font-bold block">Chantiers programmés</span>
                <span className="text-lg font-black text-white mt-0.5 block">
                  {minageRows.filter(r => r.chantierId !== '').length + deblayageRows.filter(r => r.chantierId !== '').length} postes de fond
                </span>
              </div>
              <div className="border-r border-white/20 pr-6">
                <span className="text-white/40 uppercase text-[8px] font-bold block">Objectif Avancement</span>
                <span className="text-lg font-black text-[#00BFFF] mt-0.5 block">
                  {minageRows.reduce((a, b) => a + (b.chantierId ? b.meterage : 0), 0).toFixed(1)} mètres
                </span>
              </div>
              <div>
                <span className="text-white/40 uppercase text-[8px] font-bold block">Coordinateur</span>
                <span className="text-[10px] font-semibold text-[#00BFFF] mt-0.5 block uppercase">
                  {user?.email || 'Secrétaire de Planification SMI'}
                </span>
              </div>
            </div>

            <button 
              onClick={savePlanningWorkbook}
              disabled={saveStatus === 'saving'}
              className="w-full md:w-auto bg-[#00BFFF] hover:bg-sky-500 text-white py-2.5 px-6 font-black uppercase tracking-widest text-[9px] transition-all shadow-md active:translate-y-px"
            >
              {saveStatus === 'saving' ? 'Validation ...' : saveStatus === 'saved' ? '✓ Enregistré !' : 'Graver l\'Ordonnancement Complet'}
            </button>
          </div>
        </div>
      ) : (
        /* CONSOLIDATED HISTORY LIST VIEW */
        <div className="bg-white border-2 border-[#141414] shadow-[8px_8px_0px_rgba(20,20,20,0.05)]">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#141414] text-white">
                  {['Date programmée', 'Shift / Poste', 'Chantiers planifiés (Blasting)', 'Avancement ciblé', 'Sauvegardé par', 'Fiche'].map(h => (
                    <th key={h} className="px-5 py-3 text-[9px] font-black uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#141414]/10 text-[10px]">
                {planningsHistory.map((record) => (
                  <tr key={record.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-5 py-3 font-mono font-bold">{record.date}</td>
                    <td className="px-5 py-3">
                      <span className="bg-gray-100 px-2 py-0.5 font-bold uppercase border border-gray-200">{record.post}</span>
                    </td>
                    <td className="px-5 py-3 text-[#8B0000] font-black">
                      {record.minageRows ? record.minageRows.length : 0} chantiers tirs
                    </td>
                    <td className="px-5 py-3 font-black text-blue-700">
                      {record.minageRows ? record.minageRows.reduce((acc: number, r: any) => acc + (r.meterage || 0), 0).toFixed(1) : '0.0'} m
                    </td>
                    <td className="px-5 py-3 text-gray-400 font-bold uppercase text-[9px]">
                      {record.operator ? record.operator.split('@')[0] : 'SMI USER'}
                    </td>
                    <td className="px-5 py-3">
                      <div className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-green-50 border border-green-500/20 text-green-700 font-bold uppercase text-[8px]">
                        <CheckCircle className="w-3 h-3 text-green-600" /> Planifié Souterrain
                      </div>
                    </td>
                  </tr>
                ))}
                {planningsHistory.length === 0 && (
                  <tr>
                    <td colSpan={6} className="text-center p-16 italic text-gray-300 uppercase font-black text-[10px]">
                      Aucun grand livre de planification enregistré.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
