import React, { useState, useEffect, useMemo } from 'react';
import { 
  collection, 
  query, 
  where, 
  onSnapshot 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useSite } from '../contexts/SiteContext';
import { useAuth } from '../contexts/AuthContext';
import { 
  Hammer, 
  ShieldCheck, 
  Layers, 
  TrendingUp, 
  HardHat, 
  Calendar, 
  Building, 
  Users, 
  Award, 
  FileText, 
  Search,
  CheckCircle,
  Clock,
  Briefcase,
  X
} from 'lucide-react';
import { format, subDays, startOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';

interface ExcelBoulonnage {
  sectorGroup?: string;
  chantierId: string;
  minerMatricule: string;
  minerName: string;
  assistantMatricule: string;
  assistantName: string;
  type: 'Boulonnage' | 'Soutenement';
  plannedBolts: number;
  realBolts: number;
  hasGrillage: boolean;
  grillageQuantity: number;
  remarks?: string;
}

interface RowWrapper {
  rowId: string;
  plan: ExcelBoulonnage;
  reel: ExcelBoulonnage;
}

interface ProductionDay {
  id: string;
  date: string;
  siteId: string;
  postes: {
    poste1?: {
      boulonnage?: RowWrapper[];
    };
    poste2?: {
      boulonnage?: RowWrapper[];
    };
    poste3?: {
      boulonnage?: RowWrapper[];
    };
  };
}

export const Boulonnage: React.FC = () => {
  const { activeSiteId } = useSite();
  const { user } = useAuth();

  // Date range filters (default to current month)
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [activeSubTab, setActiveSubTab] = useState<'chantier' | 'miner' | 'assistant' | 'history'>('chantier');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEmployeeReport, setSelectedEmployeeReport] = useState<{
    matricule: string;
    name: string;
    role: 'miner' | 'assistant';
  } | null>(null);

  // Loaded data
  const [productionDays, setProductionDays] = useState<ProductionDay[]>([]);
  const [chantiersMap, setChantiersMap] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  // Load chantiers to resolve names
  useEffect(() => {
    const q = query(collection(db, 'chantiers'));
    const unsub = onSnapshot(q, (snap) => {
      const mapping: Record<string, string> = {};
      snap.forEach(doc => {
        mapping[doc.id] = doc.data().name || doc.id;
      });
      setChantiersMap(mapping);
    });
    return () => unsub();
  }, []);

  // Load production days filtered by site
  useEffect(() => {
    if (!activeSiteId) return;

    const q = query(
      collection(db, 'production'),
      where('siteId', '==', activeSiteId)
    );

    setLoading(true);
    const unsub = onSnapshot(q, (snap) => {
      const days: ProductionDay[] = [];
      snap.forEach((doc) => {
        const data = doc.data() as Omit<ProductionDay, 'id'>;
        days.push({
          id: doc.id,
          ...data
        });
      });
      // Sort descending by date
      days.sort((a, b) => b.date.localeCompare(a.date));
      setProductionDays(days);
      setLoading(false);
    }, (error) => {
      console.error("Error loading production for boulonnage tracking:", error);
      setLoading(false);
    });

    return () => unsub();
  }, [activeSiteId]);

  // Filter days based on date range
  const filteredDays = productionDays.filter(day => {
    return day.date >= startDate && day.date <= endDate;
  });

  // Extract all boulonnage rows with context (date, poste)
  const allBoulonnageRows = filteredDays.flatMap(day => {
    const rows: { date: string; poste: string; row: RowWrapper }[] = [];
    const postes = day.postes || {};
    
    if (postes.poste1?.boulonnage) {
      postes.poste1.boulonnage.forEach(r => rows.push({ date: day.date, poste: 'Poste 1', row: r }));
    }
    if (postes.poste2?.boulonnage) {
      postes.poste2.boulonnage.forEach(r => rows.push({ date: day.date, poste: 'Poste 2', row: r }));
    }
    if (postes.poste3?.boulonnage) {
      postes.poste3.boulonnage.forEach(r => rows.push({ date: day.date, poste: 'Poste 3', row: r }));
    }
    return rows;
  });

  // Compute performance report data for the selected employee
  const employeeReportData = useMemo(() => {
    if (!selectedEmployeeReport) return null;
    const { matricule, role } = selectedEmployeeReport;

    // Filter rows where the selected employee was involved in either actual (reel) or planned (plan) as fallback
    const list = allBoulonnageRows.filter(({ row }) => {
      const targetMat = role === 'miner' 
        ? (row.reel.minerMatricule || row.plan.minerMatricule) 
        : (row.reel.assistantMatricule || row.plan.assistantMatricule);
      return targetMat && targetMat.toUpperCase() === matricule.toUpperCase();
    });

    const totalRealBolts = list.reduce((acc, { row }) => acc + (Number(row.reel.realBolts) || 0), 0);
    const totalRealGrillage = list.reduce((acc, { row }) => acc + (Number(row.reel.grillageQuantity) || 0), 0);
    
    // Each bolt contributes +0.1m of equivalent minage yield/encouragement
    const totalEncouragement = totalRealBolts * 0.1;

    return {
      list,
      totalRealBolts,
      totalRealGrillage,
      totalEncouragement
    };
  }, [selectedEmployeeReport, allBoulonnageRows]);

  // Aggregations
  // 1. By Chantier
  const chantierStats = (() => {
    const stats: Record<string, {
      chantierId: string;
      chantierName: string;
      plannedBolts: number;
      realBolts: number;
      plannedGrillage: number;
      realGrillage: number;
      boulonnageCount: number;
      soutenementCount: number;
    }> = {};

    allBoulonnageRows.forEach(({ row }) => {
      const chantierId = row.reel.chantierId || row.plan.chantierId;
      if (!chantierId) return;

      const name = chantiersMap[chantierId] || chantierId;

      if (!stats[chantierId]) {
        stats[chantierId] = {
          chantierId,
          chantierName: name,
          plannedBolts: 0,
          realBolts: 0,
          plannedGrillage: 0,
          realGrillage: 0,
          boulonnageCount: 0,
          soutenementCount: 0
        };
      }

      const item = stats[chantierId];
      item.plannedBolts += Number(row.plan.plannedBolts) || 0;
      item.realBolts += Number(row.reel.realBolts) || 0;
      item.plannedGrillage += row.plan.hasGrillage ? (Number(row.plan.grillageQuantity) || 1) : 0;
      item.realGrillage += Number(row.reel.grillageQuantity) || 0;
      
      if (row.reel.type === 'Soutenement' || row.plan.type === 'Soutenement') {
        item.soutenementCount += 1;
      } else {
        item.boulonnageCount += 1;
      }
    });

    return Object.values(stats).sort((a, b) => b.realBolts - a.realBolts);
  })();

  // 2. By Mineur
  const minerStats = (() => {
    const stats: Record<string, {
      matricule: string;
      name: string;
      plannedBolts: number;
      realBolts: number;
      realGrillage: number;
      sessionsCount: number;
      encouragementBonusMeters: number;
    }> = {};

    allBoulonnageRows.forEach(({ row }) => {
      const matricule = row.reel.minerMatricule || row.plan.minerMatricule;
      if (!matricule) return;

      const name = row.reel.minerName || row.plan.minerName || 'Mineur ' + matricule;

      if (!stats[matricule]) {
        stats[matricule] = {
          matricule,
          name,
          plannedBolts: 0,
          realBolts: 0,
          realGrillage: 0,
          sessionsCount: 0,
          encouragementBonusMeters: 0
        };
      }

      const item = stats[matricule];
      item.plannedBolts += Number(row.plan.plannedBolts) || 0;
      const rBolts = Number(row.reel.realBolts) || 0;
      item.realBolts += rBolts;
      item.realGrillage += Number(row.reel.grillageQuantity) || 0;
      item.sessionsCount += 1;
      // 1.3 meters equivalent encouragement per bolt placed
      item.encouragementBonusMeters += rBolts * 1.3;
    });

    return Object.values(stats).sort((a, b) => b.realBolts - a.realBolts);
  })();

  // 3. By Aide-Mineur
  const assistantStats = (() => {
    const stats: Record<string, {
      matricule: string;
      name: string;
      plannedBolts: number;
      realBolts: number;
      realGrillage: number;
      sessionsCount: number;
      encouragementBonusMeters: number;
    }> = {};

    allBoulonnageRows.forEach(({ row }) => {
      const matricule = row.reel.assistantMatricule || row.plan.assistantMatricule;
      if (!matricule) return;

      const name = row.reel.assistantName || row.plan.assistantName || 'Aide ' + matricule;

      if (!stats[matricule]) {
        stats[matricule] = {
          matricule,
          name,
          plannedBolts: 0,
          realBolts: 0,
          realGrillage: 0,
          sessionsCount: 0,
          encouragementBonusMeters: 0
        };
      }

      const item = stats[matricule];
      item.plannedBolts += Number(row.plan.plannedBolts) || 0;
      const rBolts = Number(row.reel.realBolts) || 0;
      item.realBolts += rBolts;
      item.realGrillage += Number(row.reel.grillageQuantity) || 0;
      item.sessionsCount += 1;
      // 1.3 meters equivalent encouragement per bolt placed
      item.encouragementBonusMeters += rBolts * 1.3;
    });

    return Object.values(stats).sort((a, b) => b.realBolts - a.realBolts);
  })();

  // Format Date to French label
  const formatFrenchDate = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
      return format(d, 'EEEE d MMMM yyyy', { locale: fr });
    } catch {
      return dateStr;
    }
  };

  // Overall sums
  const totalPlannedBolts = allBoulonnageRows.reduce((acc, r) => acc + (Number(r.row.plan.plannedBolts) || 0), 0);
  const totalRealBolts = allBoulonnageRows.reduce((acc, r) => acc + (Number(r.row.reel.realBolts) || 0), 0);
  const totalPlannedGrillage = allBoulonnageRows.reduce((acc, r) => acc + (r.row.plan.hasGrillage ? (Number(r.row.plan.grillageQuantity) || 1) : 0), 0);
  const totalRealGrillage = allBoulonnageRows.reduce((acc, r) => acc + (Number(r.row.reel.grillageQuantity) || 0), 0);
  const totalEncouragementMeters = totalRealBolts * 1.3;

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 py-6 font-sans">
      
      {/* Premium Hydromines Gold Banner */}
      <div className="bg-[#1e293b] text-white p-6 sm:p-8 rounded-3xl border border-amber-500/20 shadow-lg relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Background Subtle Shimmer */}
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-amber-500/5 animate-pulse" />
        
        <div className="flex items-center gap-5 z-10 text-center md:text-left flex-col md:flex-row">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-400 to-[#b8860b] flex items-center justify-center shadow-md animate-bounce-slow">
            <Hammer className="w-8 h-8 text-slate-950" />
          </div>
          <div>
            <div className="subtle-glow-line w-24 mb-1 mx-auto md:mx-0 opacity-80" />
            <h1 className="gold-title text-xl sm:text-2xl md:text-3xl font-black tracking-wider leading-none uppercase">
              SUIVI DU BOULONNAGE S.M.I
            </h1>
            <div className="subtle-glow-line w-full mt-1.5 mb-2 opacity-80" />
            <p className="text-[10px] sm:text-xs font-black uppercase text-amber-200 tracking-widest">
              Analyses & Performances terrain du soutènement mécanique et d'encouragement
            </p>
          </div>
        </div>

        {/* Global Quick KPI Badge */}
        <div className="bg-slate-900/60 border border-amber-500/30 rounded-2xl p-4 flex flex-col items-center justify-center text-center z-10 w-full md:w-56">
          <Award className="w-6 h-6 text-amber-400 mb-1" />
          <span className="text-[10px] font-black uppercase text-amber-200 tracking-wider">Equivalent Encouragement</span>
          <span className="text-xl font-mono font-black text-white mt-1 bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent">
            +{totalEncouragementMeters.toFixed(1)} m
          </span>
          <span className="text-[9px] font-extrabold text-slate-400 uppercase mt-0.5">(1.3m par boulon SPLIT)</span>
        </div>
      </div>

      {/* FILTERS CARD */}
      <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <span className="text-[10px] font-black uppercase text-slate-600 tracking-wider">Du :</span>
            <input 
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="bg-transparent text-slate-800 font-extrabold text-xs uppercase cursor-pointer outline-none"
            />
          </div>

          <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <span className="text-[10px] font-black uppercase text-slate-600 tracking-wider">Au :</span>
            <input 
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="bg-transparent text-slate-800 font-extrabold text-xs uppercase cursor-pointer outline-none"
            />
          </div>
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-64">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </span>
          <input
            type="text"
            placeholder="Rechercher nom, matricule..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="pl-9 pr-4 py-2 bg-slate-50 hover:bg-slate-100/50 focus:bg-white text-slate-800 placeholder-slate-400 border border-slate-200 focus:border-amber-500 rounded-xl w-full text-xs font-bold transition-all outline-none"
          />
        </div>
      </div>

      {/* HIGH-LEVEL GLOBAL KPIS GRID */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* KPI 1: Boulons Réalisés */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Boulons SPLIT Posés</span>
            <span className="text-2xl font-mono font-black text-slate-900 block mt-1">{totalRealBolts}</span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mt-0.5 block">
              Prévu: {totalPlannedBolts} • Taux: {totalPlannedBolts > 0 ? ((totalRealBolts / totalPlannedBolts) * 100).toFixed(0) : 0}%
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600">
            <Hammer className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 2: Grillage Réalisé */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Grillage Installé</span>
            <span className="text-2xl font-mono font-black text-slate-900 block mt-1">{totalRealGrillage} <span className="text-xs text-slate-400 uppercase">m²</span></span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mt-0.5 block">
              Prévu: {totalPlannedGrillage} • Taux: {totalPlannedGrillage > 0 ? ((totalRealGrillage / totalPlannedGrillage) * 100).toFixed(0) : 0}%
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center text-sky-600">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 3: Nombre d'équipes de soutènement engagées */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-sm flex items-center justify-between gap-4">
          <div>
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Fiches Remplies</span>
            <span className="text-2xl font-mono font-black text-slate-900 block mt-1">{allBoulonnageRows.length}</span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide mt-0.5 block">
              Soutènements de galerie
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center text-purple-600">
            <HardHat className="w-6 h-6" />
          </div>
        </div>

        {/* KPI 4: Equivalent encouragements */}
        <div className="bg-gradient-to-br from-[#1e293b] to-slate-950 text-white rounded-2xl p-4 shadow-md flex items-center justify-between gap-4 border border-amber-500/20">
          <div>
            <span className="text-[10px] font-black text-amber-300 uppercase tracking-wider block">Gain Équivalent Primes</span>
            <span className="text-2xl font-mono font-black text-white block mt-1">+{totalEncouragementMeters.toFixed(1)} m</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide mt-0.5 block">
              Prime de rendement préservée
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-400 flex items-center justify-center text-slate-950 font-black text-lg shadow-sm">
            🚀
          </div>
        </div>
      </div>

      {/* DETAILED STATISTICS SUB-TABS */}
      <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm space-y-6">
        
        {/* Sub-navigation buttons */}
        <div className="flex flex-wrap gap-2 p-1 bg-gray-100 rounded-2xl self-start max-w-fit">
          <button
            onClick={() => setActiveSubTab('chantier')}
            className={`px-4 py-2 rounded-xl font-extrabold text-[11px] uppercase tracking-wider transition-all cursor-pointer ${
              activeSubTab === 'chantier'
                ? 'bg-white text-slate-950 shadow-sm border border-gray-250/50'
                : 'text-gray-500 hover:text-slate-800'
            }`}
          >
            <Building className="w-3.5 h-3.5 inline mr-1.5" /> Synthèse par Chantier
          </button>
          <button
            onClick={() => setActiveSubTab('miner')}
            className={`px-4 py-2 rounded-xl font-extrabold text-[11px] uppercase tracking-wider transition-all cursor-pointer ${
              activeSubTab === 'miner'
                ? 'bg-white text-slate-950 shadow-sm border border-gray-250/50'
                : 'text-gray-500 hover:text-slate-800'
            }`}
          >
            <HardHat className="w-3.5 h-3.5 inline mr-1.5" /> Performance Mineurs
          </button>
          <button
            onClick={() => setActiveSubTab('assistant')}
            className={`px-4 py-2 rounded-xl font-extrabold text-[11px] uppercase tracking-wider transition-all cursor-pointer ${
              activeSubTab === 'assistant'
                ? 'bg-white text-slate-950 shadow-sm border border-gray-250/50'
                : 'text-gray-500 hover:text-slate-800'
            }`}
          >
            <Users className="w-3.5 h-3.5 inline mr-1.5" /> Performance Aide-Mineurs
          </button>
          <button
            onClick={() => setActiveSubTab('history')}
            className={`px-4 py-2 rounded-xl font-extrabold text-[11px] uppercase tracking-wider transition-all cursor-pointer ${
              activeSubTab === 'history'
                ? 'bg-white text-slate-950 shadow-sm border border-gray-250/50'
                : 'text-gray-500 hover:text-slate-800'
            }`}
          >
            <FileText className="w-3.5 h-3.5 inline mr-1.5" /> Registre d'Exploitation
          </button>
        </div>

        {/* LOADING INDICATOR */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-3">
            <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-black uppercase text-slate-500 tracking-wider">Chargement des données du registre...</p>
          </div>
        ) : (
          <div className="animate-fade-in">
            
            {/* SUB-TAB 1: CHANTIER */}
            {activeSubTab === 'chantier' && (
              <div className="space-y-4">
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-900 text-[#ffd700] uppercase text-[10px] tracking-wider font-extrabold select-none border-b border-slate-700">
                        <th className="p-3">Nom du Chantier</th>
                        <th className="p-3 text-center">Interventions Boulonnage</th>
                        <th className="p-3 text-center">Interventions Soutènement</th>
                        <th className="p-3 text-center">Boulons Planifiés</th>
                        <th className="p-3 text-center bg-amber-500/10 text-amber-200">Boulons Réalisés</th>
                        <th className="p-3 text-center">Grillage Planifié (Qté)</th>
                        <th className="p-3 text-center bg-emerald-500/10 text-emerald-200">Grillage Réalisé (Qté)</th>
                        <th className="p-3 text-center">Ratio Réalisation</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-150 text-[11px] font-bold text-slate-700">
                      {chantierStats
                        .filter(item => item.chantierName.toLowerCase().includes(searchQuery.toLowerCase()))
                        .map((c) => {
                          const boltsRatio = c.plannedBolts > 0 ? (c.realBolts / c.plannedBolts) * 100 : 100;
                          return (
                            <tr key={c.chantierId} className="hover:bg-slate-50 transition-colors">
                              <td className="p-3 text-slate-900 font-extrabold flex items-center gap-2">
                                <Building className="w-4 h-4 text-slate-400" /> {c.chantierName}
                              </td>
                              <td className="p-3 text-center font-mono">{c.boulonnageCount}</td>
                              <td className="p-3 text-center font-mono">{c.soutenementCount}</td>
                              <td className="p-3 text-center font-mono text-slate-400">{c.plannedBolts} u.</td>
                              <td className="p-3 text-center font-mono font-black text-amber-900 bg-amber-50/40">{c.realBolts} u.</td>
                              <td className="p-3 text-center font-mono text-slate-400">{c.plannedGrillage}</td>
                              <td className="p-3 text-center font-mono font-black text-emerald-900 bg-emerald-50/40">{c.realGrillage}</td>
                              <td className="p-3 text-center">
                                <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-extrabold font-mono uppercase ${
                                  boltsRatio >= 95 ? 'bg-emerald-100 text-emerald-800' :
                                  boltsRatio >= 75 ? 'bg-amber-100 text-amber-800' :
                                  'bg-rose-100 text-rose-800'
                                }`}>
                                  {boltsRatio.toFixed(0)}%
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      {chantierStats.length === 0 && (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-slate-400 uppercase font-black tracking-wider text-xs">
                            Aucune donnée enregistrée sur cette période
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SUB-TAB 2: MINEURS */}
            {activeSubTab === 'miner' && (
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-center gap-3">
                  <span className="text-xl">💡</span>
                  <p className="text-[11px] font-bold text-amber-900 leading-relaxed uppercase">
                    Chaque boulon Split de 1.7m posé donne un bonus de 1.3m de métrage fictif aux mineurs pour les encourager et garantir que le temps passé au boulonnage ne pénalise pas leur prime de rendement globale.
                  </p>
                </div>

                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-900 text-[#ffd700] uppercase text-[10px] tracking-wider font-extrabold select-none border-b border-slate-700">
                        <th className="p-3">Matricule</th>
                        <th className="p-3">Nom du Mineur</th>
                        <th className="p-3 text-center">Fiches Signées</th>
                        <th className="p-3 text-center">Boulons Planifiés</th>
                        <th className="p-3 text-center bg-amber-500/10 text-amber-200">Boulons SPLIT Posés</th>
                        <th className="p-3 text-center">Grillage Posé (u.)</th>
                        <th className="p-3 text-center bg-gradient-to-r from-amber-500/20 to-amber-600/10 text-amber-900">Encouragement Equivalent</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-150 text-[11px] font-bold text-slate-700">
                      {minerStats
                        .filter(item => 
                          item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.matricule.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .map((m) => (
                          <tr 
                            key={m.matricule} 
                            onClick={() => setSelectedEmployeeReport({ matricule: m.matricule, name: m.name, role: 'miner' })}
                            className="hover:bg-amber-50/40 cursor-pointer transition-colors"
                            title="Cliquez pour afficher le rapport de performance détaillé"
                          >
                            <td className="p-3 font-mono font-black text-slate-500">{m.matricule}</td>
                            <td className="p-3 text-slate-900 font-extrabold flex items-center gap-2">
                              <HardHat className="w-4 h-4 text-slate-400" /> {m.name}
                            </td>
                            <td className="p-3 text-center font-mono">{m.sessionsCount}</td>
                            <td className="p-3 text-center font-mono text-slate-400">{m.plannedBolts} u.</td>
                            <td className="p-3 text-center font-mono font-black text-amber-900 bg-amber-50/40">{m.realBolts} u.</td>
                            <td className="p-3 text-center font-mono">{m.realGrillage}</td>
                            <td className="p-3 text-center">
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-amber-500/10 to-amber-500/20 border border-amber-500/20 rounded-full font-mono text-xs font-black text-amber-950">
                                🚀 +{m.encouragementBonusMeters.toFixed(1)} m de rendement
                              </span>
                            </td>
                          </tr>
                        ))}
                      {minerStats.length === 0 && (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-slate-400 uppercase font-black tracking-wider text-xs">
                            Aucune donnée enregistrée sur cette période
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SUB-TAB 3: AIDE-MINEURS */}
            {activeSubTab === 'assistant' && (
              <div className="space-y-4">
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-900 text-[#ffd700] uppercase text-[10px] tracking-wider font-extrabold select-none border-b border-slate-700">
                        <th className="p-3">Matricule</th>
                        <th className="p-3">Nom de l'Aide-Mineur</th>
                        <th className="p-3 text-center">Fiches Remplies</th>
                        <th className="p-3 text-center">Boulons Planifiés</th>
                        <th className="p-3 text-center bg-amber-500/10 text-amber-200">Boulons SPLIT Posés</th>
                        <th className="p-3 text-center">Grillage Posé (u.)</th>
                        <th className="p-3 text-center bg-gradient-to-r from-amber-500/20 to-amber-600/10 text-amber-900">Encouragement Equivalent</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-150 text-[11px] font-bold text-slate-700">
                      {assistantStats
                        .filter(item => 
                          item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.matricule.toLowerCase().includes(searchQuery.toLowerCase())
                        )
                        .map((m) => (
                          <tr 
                            key={m.matricule} 
                            onClick={() => setSelectedEmployeeReport({ matricule: m.matricule, name: m.name, role: 'assistant' })}
                            className="hover:bg-amber-50/40 cursor-pointer transition-colors"
                            title="Cliquez pour afficher le rapport de performance détaillé"
                          >
                            <td className="p-3 font-mono font-black text-slate-500">{m.matricule}</td>
                            <td className="p-3 text-slate-900 font-extrabold flex items-center gap-2">
                              <Users className="w-4 h-4 text-slate-400" /> {m.name}
                            </td>
                            <td className="p-3 text-center font-mono">{m.sessionsCount}</td>
                            <td className="p-3 text-center font-mono text-slate-400">{m.plannedBolts} u.</td>
                            <td className="p-3 text-center font-mono font-black text-amber-900 bg-amber-50/40">{m.realBolts} u.</td>
                            <td className="p-3 text-center font-mono">{m.realGrillage}</td>
                            <td className="p-3 text-center">
                              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-amber-500/10 to-amber-500/20 border border-amber-500/20 rounded-full font-mono text-xs font-black text-amber-950">
                                🚀 +{m.encouragementBonusMeters.toFixed(1)} m de rendement
                              </span>
                            </td>
                          </tr>
                        ))}
                      {assistantStats.length === 0 && (
                        <tr>
                          <td colSpan={7} className="p-8 text-center text-slate-400 uppercase font-black tracking-wider text-xs">
                            Aucune donnée enregistrée sur cette période
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* SUB-TAB 4: HISTORY */}
            {activeSubTab === 'history' && (
              <div className="space-y-4">
                <div className="overflow-x-auto rounded-xl border border-gray-200">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-900 text-[#ffd700] uppercase text-[10px] tracking-wider font-extrabold select-none border-b border-slate-700">
                        <th className="p-3 w-40">Date</th>
                        <th className="p-3 w-28 text-center">Poste</th>
                        <th className="p-3">Chantier</th>
                        <th className="p-3">Type</th>
                        <th className="p-3">Mineur (Perforateur)</th>
                        <th className="p-3">Aide-Mineur</th>
                        <th className="p-3 text-center">Prévu</th>
                        <th className="p-3 text-center bg-amber-500/10 text-amber-200">Réalisé</th>
                        <th className="p-3 text-center">Grillage</th>
                        <th className="p-3">Remarques & Incidents</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-150 text-[11px] font-bold text-slate-700">
                      {allBoulonnageRows
                        .filter(({ row }) => {
                          const nameSearch = (row.reel.minerName || '').toLowerCase() + (row.reel.assistantName || '').toLowerCase() + (chantiersMap[row.reel.chantierId] || '').toLowerCase();
                          return nameSearch.includes(searchQuery.toLowerCase());
                        })
                        .map(({ date, poste, row }, index) => {
                          const chantierName = chantiersMap[row.reel.chantierId || row.plan.chantierId] || row.reel.chantierId || 'Non spécifié';
                          return (
                            <tr key={index} className="hover:bg-slate-50 transition-colors">
                              <td className="p-3 text-slate-900 whitespace-nowrap font-extrabold flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-slate-400" /> {formatFrenchDate(date)}
                              </td>
                              <td className="p-3 text-center">
                                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                                  poste === 'Poste 1' ? 'bg-amber-50 border border-amber-200 text-amber-800' :
                                  poste === 'Poste 2' ? 'bg-sky-50 border border-sky-200 text-sky-800' :
                                  'bg-indigo-50 border border-indigo-200 text-indigo-800'
                                }`}>
                                  {poste}
                                </span>
                              </td>
                              <td className="p-3 text-slate-900 uppercase font-extrabold">{chantierName}</td>
                              <td className="p-3">
                                <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                                  row.reel.type === 'Soutenement' ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-800'
                                }`}>
                                  {row.reel.type || 'Boulonnage'}
                                </span>
                              </td>
                              <td className="p-3 text-slate-900 font-extrabold">{row.reel.minerName || 'Inconnu'}</td>
                              <td className="p-3 text-slate-700">{row.reel.assistantName || 'Inconnu'}</td>
                              <td className="p-3 text-center font-mono text-slate-400">{row.plan.plannedBolts || 0}</td>
                              <td className="p-3 text-center font-mono font-black text-amber-900 bg-amber-50/40">{row.reel.realBolts || 0} u.</td>
                              <td className="p-3 text-center font-mono">{row.reel.grillageQuantity || 0}</td>
                              <td className="p-3 text-slate-500 uppercase text-[10px] max-w-xs truncate" title={row.reel.remarks || ''}>
                                {row.reel.remarks || '-'}
                              </td>
                            </tr>
                          );
                        })}
                      {allBoulonnageRows.length === 0 && (
                        <tr>
                          <td colSpan={10} className="p-8 text-center text-slate-400 uppercase font-black tracking-wider text-xs">
                            Aucune donnée enregistrée sur cette période
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

          </div>
        )}

      </div>

      {/* DETAILED EMPLOYEE REPORT MODAL */}
      {selectedEmployeeReport && employeeReportData && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in font-sans">
          <div className="bg-white rounded-3xl border border-amber-300 shadow-2xl max-w-4xl w-full overflow-hidden transform transition-all flex flex-col max-h-[90vh]">
            
            {/* Header */}
            <div className="bg-slate-900 p-5 text-white flex items-center justify-between border-b border-amber-500 select-none">
              <div className="flex items-center gap-3.5">
                <div className="bg-gradient-to-br from-amber-400 to-[#b8860b] p-2.5 rounded-2xl shrink-0">
                  <HardHat className="w-6 h-6 text-slate-950" />
                </div>
                <div>
                  <span className="font-extrabold text-[9px] uppercase tracking-widest text-amber-200 block mb-0.5">
                    Fiche d'Évaluation Individuelle ({selectedEmployeeReport.role === 'miner' ? 'Mineur' : 'Aide-Mineur'})
                  </span>
                  <h3 className="font-black text-base uppercase tracking-wider text-white">
                    {selectedEmployeeReport.name}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-0.5 font-mono">
                    Matricule : {selectedEmployeeReport.matricule}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEmployeeReport(null)}
                className="text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 p-2 rounded-xl transition-all cursor-pointer border border-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body with Scrollable Area */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              
              {/* Quick Metrics */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Boulons Posés</span>
                  <span className="text-xl font-mono font-black text-slate-900 block mt-1">
                    {employeeReportData.totalRealBolts} u.
                  </span>
                  <span className="text-[9px] font-bold text-slate-500 uppercase block mt-0.5">
                    Sur {employeeReportData.list.length} interventions
                  </span>
                </div>
                
                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Grillage Installé</span>
                  <span className="text-xl font-mono font-black text-slate-900 block mt-1">
                    {employeeReportData.totalRealGrillage} m²
                  </span>
                  <span className="text-[9px] font-bold text-slate-500 uppercase block mt-0.5">
                    Renforcement voûte
                  </span>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-4 rounded-2xl">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Fiches Remplies</span>
                  <span className="text-xl font-mono font-black text-slate-900 block mt-1">
                    {employeeReportData.list.length}
                  </span>
                  <span className="text-[9px] font-bold text-slate-500 uppercase block mt-0.5">
                    Postes de travail
                  </span>
                </div>

                <div className="bg-gradient-to-br from-[#1e293b] to-slate-950 text-white p-4 rounded-2xl border border-amber-500/20">
                  <span className="text-[10px] font-black text-amber-300 uppercase tracking-wider block">Equivalent Rendement</span>
                  <span className="text-xl font-mono font-black text-white block mt-1">
                    +{employeeReportData.totalEncouragement.toFixed(1)} m
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 uppercase block mt-0.5">
                    Primes d'encouragement
                  </span>
                </div>
              </div>

              {/* Detail Table */}
              <div className="space-y-3">
                <h4 className="text-[11px] font-black uppercase tracking-wider text-slate-800 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-500" /> Historique détaillé des chantiers
                </h4>
                
                <div className="overflow-x-auto rounded-xl border border-gray-200 max-h-[300px] overflow-y-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-900 text-[#ffd700] uppercase text-[9px] tracking-wider font-extrabold select-none border-b border-slate-700 sticky top-0 z-10">
                        <th className="p-2.5 w-32">Date</th>
                        <th className="p-2.5 w-24 text-center">Poste</th>
                        <th className="p-2.5">Chantier</th>
                        <th className="p-2.5">Type</th>
                        <th className="p-2.5 text-center">Boulons SPLIT</th>
                        <th className="p-2.5 text-center">Grillage (m²)</th>
                        <th className="p-2.5">Co-équipier</th>
                        <th className="p-2.5">Remarques & Incidents</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-150 text-[10.5px] font-bold text-slate-700">
                      {employeeReportData.list.map(({ date, poste, row }, index) => {
                        const chantierName = chantiersMap[row.reel.chantierId || row.plan.chantierId] || row.reel.chantierId || 'Non spécifié';
                        const teammateName = selectedEmployeeReport.role === 'miner'
                          ? row.reel.assistantName || row.plan.assistantName || 'Aucun aide'
                          : row.reel.minerName || row.plan.minerName || 'Aucun mineur';
                        const teammateMatricule = selectedEmployeeReport.role === 'miner'
                          ? row.reel.assistantMatricule || row.plan.assistantMatricule
                          : row.reel.minerMatricule || row.plan.minerMatricule;

                        return (
                          <tr key={index} className="hover:bg-slate-50 transition-colors">
                            <td className="p-2.5 text-slate-900 whitespace-nowrap">
                              {formatFrenchDate(date)}
                            </td>
                            <td className="p-2.5 text-center">
                              <span className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase ${
                                poste === 'Poste 1' ? 'bg-amber-50 border border-amber-200 text-amber-800' :
                                poste === 'Poste 2' ? 'bg-sky-50 border border-sky-200 text-sky-800' :
                                'bg-indigo-50 border border-indigo-200 text-indigo-800'
                              }`}>
                                {poste}
                              </span>
                            </td>
                            <td className="p-2.5 text-slate-900 uppercase font-extrabold">{chantierName}</td>
                            <td className="p-2.5">
                              <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-extrabold uppercase ${
                                row.reel.type === 'Soutenement' ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-800'
                              }`}>
                                {row.reel.type || 'Boulonnage'}
                              </span>
                            </td>
                            <td className="p-2.5 text-center font-mono text-amber-900 bg-amber-50/20">{row.reel.realBolts || 0} u.</td>
                            <td className="p-2.5 text-center font-mono">{row.reel.grillageQuantity || 0} m²</td>
                            <td className="p-2.5">
                              <div className="font-extrabold text-slate-800">{teammateName}</div>
                              {teammateMatricule && <div className="text-[9px] text-slate-400 font-mono">Matr: {teammateMatricule}</div>}
                            </td>
                            <td className="p-2.5 text-slate-500 max-w-xs truncate" title={row.reel.remarks || ''}>
                              {row.reel.remarks || '-'}
                            </td>
                          </tr>
                        );
                      })}
                      {employeeReportData.list.length === 0 && (
                        <tr>
                          <td colSpan={8} className="p-8 text-center text-slate-400 uppercase font-black tracking-wider text-xs">
                            Aucune donnée enregistrée sur cette période
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                S.M.I Imiter - Service de Suivi Technique
              </span>
              <button
                type="button"
                onClick={() => setSelectedEmployeeReport(null)}
                className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white font-extrabold uppercase text-[10px] tracking-wider rounded-xl transition-all shadow-md cursor-pointer"
              >
                Fermer le Rapport
              </button>
            </div>

          </div>
        </div>
      )}

      {/* DETAILED STATISTICS SUB-TABS */}
      {/* (Moved original content end brackets appropriately) */}
      
    </div>
  );
};
