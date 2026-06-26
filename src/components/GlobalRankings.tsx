import React, { useState } from 'react';
import { 
  Award, 
  Layers, 
  MapPin, 
  HardHat, 
  TrendingUp, 
  Tractor, 
  Train, 
  Zap,
  Star,
  Search,
  Filter,
  Users
} from 'lucide-react';

interface GlobalRankingsProps {
  allProductionDocs: any[];
  allPlanningSheets: any[];
  chantiers: any[];
  employees: any[];
  engines: any[];
  reportType: 'day' | 'month';
  filterDate: string;
  filterMonth: string;
}

export const GlobalRankings: React.FC<GlobalRankingsProps> = ({
  allProductionDocs,
  allPlanningSheets,
  chantiers,
  employees,
  engines,
  reportType,
  filterDate,
  filterMonth
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'mineurs' | 'conducteurs' | 'chefs' | 'chantiers' | 'secteurs' | 'equipes'>('mineurs');
  const [searchQuery, setSearchQuery] = useState('');

  // Timezone safe shift for date calculation
  const getPreviousDateStr = (dateStr: string) => {
    try {
      const d = new Date(dateStr + 'T12:00:00');
      d.setDate(d.getDate() - 1);
      return d.toISOString().split('T')[0];
    } catch (e) {
      return dateStr;
    }
  };

  const getRecordSectorGroup = (rec: any) => {
    const row = rec.reel || rec;
    const plan = rec.plan || {};
    const sector = row.sector || plan.sector || rec.sector || rec.sectorGroup || rec.reel?.sectorGroup || rec.plan?.sectorGroup || plan.sectorGroup || '';
    if (sector) return sector;
    const chantierId = row.chantierId || rec.chantierId || plan.chantierId;
    if (chantierId) {
      const matched = chantiers.find(c => c.id === chantierId);
      if (matched && matched.sector) return matched.sector;
    }
    return '';
  };

  const getPersonnelName = (matricule: string) => {
    if (!matricule) return 'N/A';
    const match = employees.find(e => e.matricule?.toUpperCase() === matricule.toUpperCase());
    return match ? `${match.nom} ${match.prenom}` : matricule;
  };

  const getChantierName = (id: string) => {
    if (!id) return 'N/A';
    if (id.startsWith('stock_')) return id.replace('stock_', 'STOCK : ').toUpperCase();
    const match = chantiers.find(c => c.id === id);
    return match ? match.name : id;
  };

  // Get active aligned days for current selection
  const getAlignedDays = () => {
    let aligned: { prodDate: string; planDate: string; prodDoc: any; planDoc: any }[] = [];
    if (reportType === 'day') {
      const prevDate = getPreviousDateStr(filterDate);
      const pDoc = allProductionDocs.find(d => d.id === filterDate);
      const sDoc = allPlanningSheets.find(d => d.id === prevDate);
      aligned.push({ prodDate: filterDate, planDate: prevDate, prodDoc: pDoc || null, planDoc: sDoc || null });
    } else {
      const prefix = filterMonth;
      const daysInMonth = allProductionDocs.filter(d => d.id.startsWith(prefix));
      daysInMonth.forEach(pDoc => {
        const dateStr = pDoc.id;
        const prevDateStr = getPreviousDateStr(dateStr);
        const sDoc = allPlanningSheets.find(d => d.id === prevDateStr);
        aligned.push({ prodDate: dateStr, planDate: prevDateStr, prodDoc: pDoc, planDoc: sDoc || null });
      });
    }
    return aligned;
  };

  const alignedDays = getAlignedDays();

  // Aggregate stats
  const getLeaderboardData = () => {
    // 1. Miner Statistics
    const minerData: { [mat: string]: { matricule: string; name: string; meters: number; rounds: number; holes: number; anfo: number; tovex: number; count: number } } = {};
    // 2. Driver Statistics
    const driverData: { [mat: string]: { matricule: string; name: string; volume: number; godets: number; gasoil: number; count: number } } = {};
    // 3. Chief Statistics
    const chiefData: { [mat: string]: { matricule: string; name: string; meterageSupervised: number; volumeSupervised: number; shiftsCount: number; points: number } } = {};
    // 4. Chantier Progress
    const chantierProgress: { [id: string]: { id: string; name: string; sector: string; meters: number; volume: number; rounds: number } } = {};
    // 5. Team / Extraction Crews
    const crewData: { [key: string]: { treuilliste: string; equipiers: string[]; wagonsActual: number; wagonsTarget: number; durationHours: number; runsCount: number } } = {};
    // 6. Secteurs Scorecard
    const sectorsData = {
      'Imiter 1': { name: 'IMITER 1', realMet: 0, planMet: 0, realVol: 0, planVol: 0, score: 0 },
      'Imiter 2': { name: 'IMITER 2', realMet: 0, planMet: 0, realVol: 0, planVol: 0, score: 0 },
      'Imiter Est': { name: 'IMITER EST', realMet: 0, planMet: 0, realVol: 0, planVol: 0, score: 0 },
      'Bure Imiter Est': { name: 'BURE IMITER EST', realMet: 0, planMet: 0, realVol: 0, planVol: 0, score: 0 }
    };

    alignedDays.forEach(({ prodDoc, planDoc }) => {
      if (!prodDoc) return;

      const pDocPostes = prodDoc.postes || {};
      ['poste1', 'poste2', 'poste3'].forEach(pKey => {
        const postObj = pDocPostes[pKey] || {};
        const minage = postObj.minage || [];
        const deblayage = postObj.deblayage || [];
        const extraction = postObj.extraction || [];
        const sectorChefs = postObj.sectorChefs || {};

        // Process Minage for Miners, Chantiers, Sectors, and Chiefs
        minage.forEach((row: any) => {
          const r = row.reel || row || {};
          const plan = row.plan || {};
          const secName = getRecordSectorGroup(row);
          const chantierId = r.chantierId || plan.chantierId;

          const meters = Number(r.realMeterage || 0);
          const rounds = Number(r.realRounds || 0);
          const holes = Number(r.realHoles || 0);
          const anfo = Number(r.anfo || 0);
          const tovex = Number(r.tovex || 0);

          // Miners
          if (r.minerMatricule) {
            const mat = r.minerMatricule.toUpperCase().trim();
            if (!minerData[mat]) {
              minerData[mat] = { matricule: mat, name: getPersonnelName(mat), meters: 0, rounds: 0, holes: 0, anfo: 0, tovex: 0, count: 0 };
            }
            minerData[mat].meters += meters;
            minerData[mat].rounds += rounds;
            minerData[mat].holes += holes;
            minerData[mat].anfo += anfo;
            minerData[mat].tovex += tovex;
            minerData[mat].count += 1;
          }

          // Chantiers
          if (chantierId) {
            if (!chantierProgress[chantierId]) {
              const matched = chantiers.find(c => c.id === chantierId);
              chantierProgress[chantierId] = { id: chantierId, name: getChantierName(chantierId), sector: matched?.sector || secName, meters: 0, volume: 0, rounds: 0 };
            }
            chantierProgress[chantierId].meters += meters;
            chantierProgress[chantierId].rounds += rounds;
          }

          // Sectors
          const normSec = secName.toLowerCase().trim();
          if (normSec === 'imiter 1') { sectorsData['Imiter 1'].realMet += meters; }
          else if (normSec === 'imiter 2') { sectorsData['Imiter 2'].realMet += meters; }
          else if (normSec === 'imiter est') { sectorsData['Imiter Est'].realMet += meters; }
          else if (normSec === 'bure imiter est' || normSec === 'imiter est bure') { sectorsData['Bure Imiter Est'].realMet += meters; }

          // Chiefs
          // Find the chef supervising this sector on this shift
          const activeChef = Object.keys(sectorChefs).find(k => k.toLowerCase().trim() === secName.toLowerCase().trim());
          if (activeChef) {
            const chefInfo = sectorChefs[activeChef];
            const chefMat = chefInfo?.chiefMatricule;
            if (chefMat) {
              const mat = chefMat.toUpperCase().trim();
              if (!chiefData[mat]) {
                chiefData[mat] = { matricule: mat, name: chefInfo.chiefName || getPersonnelName(chefMat), meterageSupervised: 0, volumeSupervised: 0, shiftsCount: 0, points: 0 };
              }
              chiefData[mat].meterageSupervised += meters;
              // we will credit a shift supervised
              chiefData[mat].shiftsCount += 0.1; // proportional weight per row
            }
          }
        });

        // Process Deblayage for LHD Drivers, Chantiers, Sectors, and Chiefs
        deblayage.forEach((row: any) => {
          const r = row.reel || row || {};
          const plan = row.plan || {};
          const secName = getRecordSectorGroup(row);
          const chantierId = r.chantierId || plan.chantierId;

          const vol = Number(r.volumeEstimated || 0);
          const godets = Number(r.godets || 0);
          const gasoil = Number(r.gasoil || 0);

          // Drivers
          if (r.driverMatricule) {
            const mat = r.driverMatricule.toUpperCase().trim();
            if (!driverData[mat]) {
              driverData[mat] = { matricule: mat, name: getPersonnelName(mat), volume: 0, godets: 0, gasoil: 0, count: 0 };
            }
            driverData[mat].volume += vol;
            driverData[mat].godets += godets;
            driverData[mat].gasoil += gasoil;
            driverData[mat].count += 1;
          }

          // Chantiers
          if (chantierId) {
            if (!chantierProgress[chantierId]) {
              const matched = chantiers.find(c => c.id === chantierId);
              chantierProgress[chantierId] = { id: chantierId, name: getChantierName(chantierId), sector: matched?.sector || secName, meters: 0, volume: 0, rounds: 0 };
            }
            chantierProgress[chantierId].volume += vol;
          }

          // Sectors
          const normSec = secName.toLowerCase().trim();
          if (normSec === 'imiter 1') { sectorsData['Imiter 1'].realVol += vol; }
          else if (normSec === 'imiter 2') { sectorsData['Imiter 2'].realVol += vol; }
          else if (normSec === 'imiter est') { sectorsData['Imiter Est'].realVol += vol; }
          else if (normSec === 'bure imiter est' || normSec === 'imiter est bure') { sectorsData['Bure Imiter Est'].realVol += vol; }

          // Chiefs
          const activeChef = Object.keys(sectorChefs).find(k => k.toLowerCase().trim() === secName.toLowerCase().trim());
          if (activeChef) {
            const chefInfo = sectorChefs[activeChef];
            const chefMat = chefInfo?.chiefMatricule;
            if (chefMat) {
              const mat = chefMat.toUpperCase().trim();
              if (!chiefData[mat]) {
                chiefData[mat] = { matricule: mat, name: chefInfo.chiefName || getPersonnelName(chefMat), meterageSupervised: 0, volumeSupervised: 0, shiftsCount: 0, points: 0 };
              }
              chiefData[mat].volumeSupervised += vol;
              chiefData[mat].shiftsCount += 0.1;
            }
          }
        });

        // Process Extraction for Crews / Teams
        extraction.forEach((row: any) => {
          const r = row.reel || row || {};
          const plan = row.plan || {};
          const treuilliste = r.treuilliste;
          const wAct = Number(r.wagonsActual || 0);
          const wTarget = Number(plan.wagonsTarget || r.wagonsTarget || 48);

          if (treuilliste) {
            const crewKey = `${treuilliste.toUpperCase().trim()}_${r.equipier1 || ''}_${r.equipier2 || ''}`;
            if (!crewData[crewKey]) {
              crewData[crewKey] = {
                treuilliste: treuilliste,
                equipiers: [r.equipier1, r.equipier2, r.equipier3, r.equipier4].filter(Boolean),
                wagonsActual: 0,
                wagonsTarget: 0,
                durationHours: 0,
                runsCount: 0
              };
            }
            crewData[crewKey].wagonsActual += wAct;
            crewData[crewKey].wagonsTarget += wTarget;
            crewData[crewKey].durationHours += 8; // default shift duration
            crewData[crewKey].runsCount += 1;
          }
        });
      });
    });

    // Also inject PLANNING targets for Sectors from planDocs to calculate achievement rate
    alignedDays.forEach(({ planDoc }) => {
      if (!planDoc) return;
      ['poste1', 'poste2', 'poste3'].forEach(pKey => {
        const post = planDoc.postes?.[pKey] || {};
        const minage = post.minage || [];
        const deblayage = post.deblayage || [];

        minage.forEach((row: any) => {
          const secName = getRecordSectorGroup(row);
          const normSec = secName.toLowerCase().trim();
          const targetMet = Number(row.meterage || row.plannedRounds * 1.7 || 0);
          if (normSec === 'imiter 1') { sectorsData['Imiter 1'].planMet += targetMet; }
          else if (normSec === 'imiter 2') { sectorsData['Imiter 2'].planMet += targetMet; }
          else if (normSec === 'imiter est') { sectorsData['Imiter Est'].planMet += targetMet; }
          else if (normSec === 'bure imiter est' || normSec === 'imiter est bure') { sectorsData['Bure Imiter Est'].planMet += targetMet; }
        });

        deblayage.forEach((row: any) => {
          const secName = getRecordSectorGroup(row);
          const normSec = secName.toLowerCase().trim();
          const targetVol = Number(row.volumeEstimated || 0);
          if (normSec === 'imiter 1') { sectorsData['Imiter 1'].planVol += targetVol; }
          else if (normSec === 'imiter 2') { sectorsData['Imiter 2'].planVol += targetVol; }
          else if (normSec === 'imiter est') { sectorsData['Imiter Est'].planVol += targetVol; }
          else if (normSec === 'bure imiter est' || normSec === 'imiter est bure') { sectorsData['Bure Imiter Est'].planVol += targetVol; }
        });
      });
    });

    // Final calculations and mapping
    const miners = Object.values(minerData).map(m => {
      const avgYield = m.rounds > 0 ? m.meters / m.rounds : 0;
      const explosivesTotal = m.anfo + m.tovex;
      const explosiveEfficiency = m.meters > 0 ? explosivesTotal / m.meters : 0; // kg/m
      
      // Calculate a performance rating score (0 to 100)
      // High meters is main indicator, penalize high explosive ratio, reward good yield
      let rating = Math.min(100, (m.meters / 15) * 50); // up to 50pts for quantity
      if (avgYield >= 1.6) rating += 25; // 25pts for yield
      else if (avgYield >= 1.4) rating += 15;
      
      if (explosiveEfficiency > 0 && explosiveEfficiency < 22) rating += 25; // 25pts for explosive efficiency
      else if (explosiveEfficiency >= 22 && explosiveEfficiency < 28) rating += 15;

      return { ...m, avgYield, explosivesTotal, explosiveEfficiency, score: Math.round(Math.min(100, rating)) };
    }).sort((a, b) => b.score - a.score || b.meters - a.meters);

    const drivers = Object.values(driverData).map(d => {
      const fuelEfficiency = d.volume > 0 ? d.gasoil / d.volume : 0; // L/m³
      const avgVolumePerGodet = d.godets > 0 ? d.volume / d.godets : 0;

      let rating = Math.min(100, (d.volume / 250) * 50); // quantity (max 50pts)
      if (fuelEfficiency > 0 && fuelEfficiency < 1.3) rating += 25; // energy efficiency (max 25pts)
      else if (fuelEfficiency >= 1.3 && fuelEfficiency < 1.8) rating += 15;

      if (avgVolumePerGodet >= 2.0) rating += 25; // godet fill rate reward (max 25pts)
      else if (avgVolumePerGodet >= 1.5) rating += 15;

      return { ...d, fuelEfficiency, avgVolumePerGodet, score: Math.round(Math.min(100, rating)) };
    }).sort((a, b) => b.score - a.score || b.volume - a.volume);

    const chiefs = Object.values(chiefData).map(c => {
      // Points based on supervised achievements
      const score = Math.min(100, Math.round((c.meterageSupervised / 30) * 50 + (c.volumeSupervised / 400) * 50));
      return { ...c, score };
    }).sort((a, b) => b.score - a.score || b.meterageSupervised - a.meterageSupervised);

    const chantiersList = Object.values(chantierProgress).map(ch => {
      const score = Math.round(Math.min(100, (ch.meters / 15) * 50 + (ch.volume / 200) * 50));
      return { ...ch, score };
    }).sort((a, b) => b.score - a.score || b.meters - a.meters);

    const crews = Object.values(crewData).map(cr => {
      const rate = cr.wagonsTarget > 0 ? (cr.wagonsActual / cr.wagonsTarget) * 100 : 100;
      const productivity = cr.durationHours > 0 ? cr.wagonsActual / cr.durationHours : 0; // wagons per hour
      const score = Math.min(100, Math.round(rate));
      return { ...cr, rate, productivity, score };
    }).sort((a, b) => b.score - a.score || b.wagonsActual - a.wagonsActual);

    const sectors = Object.values(sectorsData).map(sec => {
      const metRate = sec.planMet > 0 ? (sec.realMet / sec.planMet) * 100 : 100;
      const volRate = sec.planVol > 0 ? (sec.realVol / sec.planVol) * 100 : 100;
      const score = Math.min(100, Math.round((metRate * 0.6) + (volRate * 0.4)));
      return { ...sec, metRate, volRate, score };
    }).sort((a, b) => b.score - a.score);

    return { miners, drivers, chiefs, chantiersList, crews, sectors };
  };

  const leaderboards = getLeaderboardData();

  // Search filter
  const filterBySearch = (list: any[], fields: string[]) => {
    if (!searchQuery) return list;
    const q = searchQuery.toLowerCase().trim();
    return list.filter(item => {
      return fields.some(f => {
        const val = item[f];
        return val && String(val).toLowerCase().includes(q);
      });
    });
  };

  const getRankMedal = (index: number) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return `#${index + 1}`;
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-600 bg-emerald-50 border-emerald-100';
    if (score >= 70) return 'text-amber-600 bg-amber-50 border-amber-100';
    return 'text-rose-600 bg-rose-50 border-rose-100';
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Tab Header with Search */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-50 border border-[#d4af37]/35 p-4 rounded-2xl relative overflow-hidden shadow-2xs">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0ea5e9] to-[#ef4444]" />
        <div className="flex items-center gap-2 mt-1">
          <Award className="w-5 h-5 text-[#b8860b]" />
          <h2 className="text-xs font-black uppercase text-slate-800">Classements Globaux de Performance</h2>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto shrink-0">
          {/* Search Box */}
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input 
              type="text"
              placeholder="Rechercher par nom, matricule..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 border border-slate-200 rounded-xl text-xs bg-white focus:border-[#b8860b] focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Leaderboard subtabs navigation */}
      <div className="flex flex-wrap gap-1.5 border-b border-gray-150 pb-px">
        {[
          { id: 'mineurs', label: 'Mineurs (Tirées)', icon: <HardHat className="w-4 h-4" /> },
          { id: 'conducteurs', label: 'Conducteurs (LHD)', icon: <Tractor className="w-4 h-4" /> },
          { id: 'chefs', label: 'Chefs de Poste', icon: <Users className="w-4 h-4" /> },
          { id: 'chantiers', label: 'Chantiers (Avancement)', icon: <MapPin className="w-4 h-4" /> },
          { id: 'equipes', label: 'Équipes Extraction', icon: <Train className="w-4 h-4" /> },
          { id: 'secteurs', label: 'Secteurs (Score)', icon: <Layers className="w-4 h-4" /> }
        ].map(tb => (
          <button
            key={tb.id}
            onClick={() => { setActiveSubTab(tb.id as any); setSearchQuery(''); }}
            className={`flex items-center gap-2 px-3.5 py-2.5 border-b-2 font-black text-[10px] uppercase tracking-wider transition-all cursor-pointer ${
              activeSubTab === tb.id 
                ? 'border-[#b8860b] text-[#b8860b] bg-amber-50/10' 
                : 'border-transparent text-slate-400 hover:text-slate-600'
            }`}
          >
            {tb.icon}
            {tb.label}
          </button>
        ))}
      </div>

      {/* RENDER ACTIVE SUBTAB CONTENT */}
      <div className="bg-white border border-[#d4af37]/35 rounded-2xl p-5 relative overflow-hidden shadow-2xs">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#0ea5e9] to-[#ef4444]" />
        
        {/* MINEURS LEADERBOARD */}
        {activeSubTab === 'mineurs' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black uppercase text-slate-800">Palmarès des Mineurs (Foreurs & Boutefeux)</h3>
              <span className="text-[8px] font-black uppercase bg-slate-100 px-2 py-0.5 rounded text-slate-600">Basé sur les mètres forés, le rendement m/volée & la sécurité explosive</span>
            </div>

            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <table className="w-full text-left border-collapse text-[10.5px]">
                <thead>
                  <tr className="bg-slate-900 text-white uppercase text-[8.5px] font-bold">
                    <th className="p-3 text-center w-12">Rang</th>
                    <th className="p-3">Mineur</th>
                    <th className="p-3 text-center">Mètres Forés</th>
                    <th className="p-3 text-center">Volées Tirées</th>
                    <th className="p-3 text-center">Rendement Moyen</th>
                    <th className="p-3 text-center">Consommation Explosifs</th>
                    <th className="p-3 text-center">Spécifique kg/m</th>
                    <th className="p-3 text-center">Score Efficacité</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filterBySearch(leaderboards.miners, ['name', 'matricule']).map((m, idx) => (
                    <tr key={m.matricule} className={`hover:bg-slate-50/50 ${idx < 3 ? 'bg-amber-50/5' : ''}`}>
                      <td className="p-3 text-center font-black text-xs">{getRankMedal(idx)}</td>
                      <td className="p-3">
                        <div className="font-black uppercase text-slate-800">{m.name}</div>
                        <div className="text-[8.5px] font-mono text-slate-400 uppercase">Matricule: {m.matricule}</div>
                      </td>
                      <td className="p-3 text-center font-mono font-black text-slate-800">{m.meters.toFixed(1)} m</td>
                      <td className="p-3 text-center font-mono text-slate-600">{m.rounds}</td>
                      <td className="p-3 text-center">
                        <span className={`px-1.5 py-0.5 rounded text-[8.5px] font-black ${m.avgYield >= 1.5 ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}>
                          {m.avgYield > 0 ? `${m.avgYield.toFixed(2)} m/v` : '0.00'}
                        </span>
                      </td>
                      <td className="p-3 text-center font-mono text-slate-500">{m.explosivesTotal.toFixed(0)} kg</td>
                      <td className="p-3 text-center font-mono font-bold text-orange-600">{m.explosiveEfficiency > 0 ? `${m.explosiveEfficiency.toFixed(1)} kg/m` : '0.0'}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 border text-[9px] font-black rounded-lg ${getScoreColor(m.score)}`}>
                          {m.score} pts
                        </span>
                      </td>
                    </tr>
                  ))}
                  {leaderboards.miners.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-6 text-center text-slate-400 uppercase font-black">Aucune donnée de minage disponible</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CONDUCTEURS LEADERBOARD */}
        {activeSubTab === 'conducteurs' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black uppercase text-slate-800">Classement de Rendement des Conducteurs d'Engins LHD</h3>
              <span className="text-[8px] font-black uppercase bg-slate-100 px-2 py-0.5 rounded text-slate-600">Calculé sur la volumétrie déplacée & la consommation d'énergie</span>
            </div>

            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <table className="w-full text-left border-collapse text-[10.5px]">
                <thead>
                  <tr className="bg-slate-900 text-white uppercase text-[8.5px] font-bold">
                    <th className="p-3 text-center w-12">Rang</th>
                    <th className="p-3">Conducteur</th>
                    <th className="p-3 text-center">Volume Estimé</th>
                    <th className="p-3 text-center">Godets Effectués</th>
                    <th className="p-3 text-center">Gasoil Consommé</th>
                    <th className="p-3 text-center">Consommation Spécifique</th>
                    <th className="p-3 text-center">Vol. Moyen par Godet</th>
                    <th className="p-3 text-center">Score Éco-Conduite</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filterBySearch(leaderboards.drivers, ['name', 'matricule']).map((d, idx) => (
                    <tr key={d.matricule} className={`hover:bg-slate-50/50 ${idx < 3 ? 'bg-amber-50/5' : ''}`}>
                      <td className="p-3 text-center font-black text-xs">{getRankMedal(idx)}</td>
                      <td className="p-3">
                        <div className="font-black uppercase text-slate-800">{d.name}</div>
                        <div className="text-[8.5px] font-mono text-slate-400 uppercase">Matricule: {d.matricule}</div>
                      </td>
                      <td className="p-3 text-center font-mono font-black text-slate-800">{d.volume.toFixed(1)} m³</td>
                      <td className="p-3 text-center font-mono text-slate-600">{d.godets} gts</td>
                      <td className="p-3 text-center font-mono text-amber-600 font-bold">{d.gasoil} L</td>
                      <td className="p-3 text-center font-mono font-black text-emerald-600">{d.fuelEfficiency > 0 ? `${d.fuelEfficiency.toFixed(2)} L/m³` : '0.00'}</td>
                      <td className="p-3 text-center font-mono text-slate-500">{d.avgVolumePerGodet > 0 ? `${d.avgVolumePerGodet.toFixed(2)} m³/gt` : '0.00'}</td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 border text-[9px] font-black rounded-lg ${getScoreColor(d.score)}`}>
                          {d.score} pts
                        </span>
                      </td>
                    </tr>
                  ))}
                  {leaderboards.drivers.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-6 text-center text-slate-400 uppercase font-black">Aucune donnée de déblayage disponible</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CHEFS LEADERBOARD */}
        {activeSubTab === 'chefs' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black uppercase text-slate-800">Performance Managériale des Chefs de Poste</h3>
              <span className="text-[8px] font-black uppercase bg-slate-100 px-2 py-0.5 rounded text-slate-600">Supervision globale : Mètres forés + Volumes déblayés sur leurs secteurs</span>
            </div>

            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <table className="w-full text-left border-collapse text-[10.5px]">
                <thead>
                  <tr className="bg-slate-900 text-white uppercase text-[8.5px] font-bold">
                    <th className="p-3 text-center w-12">Rang</th>
                    <th className="p-3">Chef de Poste / Encadrant</th>
                    <th className="p-3 text-center">Postes Supervisés</th>
                    <th className="p-3 text-center">Forage Supervisé</th>
                    <th className="p-3 text-center">Volume Supervisé</th>
                    <th className="p-3 text-center">Indicateur de Rendement</th>
                    <th className="p-3 text-center">Score de Shift</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filterBySearch(leaderboards.chiefs, ['name', 'matricule']).map((c, idx) => (
                    <tr key={c.matricule} className={`hover:bg-slate-50/50`}>
                      <td className="p-3 text-center font-black text-xs">{getRankMedal(idx)}</td>
                      <td className="p-3">
                        <div className="font-black uppercase text-slate-800">{c.name}</div>
                        <div className="text-[8.5px] font-mono text-slate-400 uppercase">Matricule: {c.matricule}</div>
                      </td>
                      <td className="p-3 text-center font-mono font-bold text-slate-500">{Math.ceil(c.shiftsCount)} shifts</td>
                      <td className="p-3 text-center font-mono font-black text-slate-800">{c.meterageSupervised.toFixed(1)} m</td>
                      <td className="p-3 text-center font-mono font-black text-slate-800">{c.volumeSupervised.toFixed(1)} m³</td>
                      <td className="p-3 text-center font-mono text-slate-400">
                        {(c.meterageSupervised / (c.shiftsCount || 1)).toFixed(1)} m/shift
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 border text-[9px] font-black rounded-lg ${getScoreColor(c.score)}`}>
                          {c.score} %
                        </span>
                      </td>
                    </tr>
                  ))}
                  {leaderboards.chiefs.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-slate-400 uppercase font-black">Aucun encadrant actif enregistré sur cette période</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CHANTIERS LEADERBOARD */}
        {activeSubTab === 'chantiers' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black uppercase text-slate-800">Rythme d'Avancement des Chantiers & Galeries</h3>
              <span className="text-[8px] font-black uppercase bg-slate-100 px-2 py-0.5 rounded text-slate-600">Chantiers les plus actifs (Mètres linéaires gagnés & Volume extrait)</span>
            </div>

            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <table className="w-full text-left border-collapse text-[10.5px]">
                <thead>
                  <tr className="bg-slate-900 text-white uppercase text-[8.5px] font-bold">
                    <th className="p-3 text-center w-12">Rang</th>
                    <th className="p-3">Galerie / Chantier d'Abattage</th>
                    <th className="p-3">Secteur Géo</th>
                    <th className="p-3 text-center">Mètres Gagnés (m)</th>
                    <th className="p-3 text-center">Volume Évacué (m³)</th>
                    <th className="p-3 text-center">Tours Réalisés</th>
                    <th className="p-3 text-center">Activité Relative</th>
                    <th className="p-3 text-center">Score Avancement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filterBySearch(leaderboards.chantiersList, ['name', 'sector']).map((ch, idx) => (
                    <tr key={ch.id} className="hover:bg-slate-50/50">
                      <td className="p-3 text-center font-black text-xs">#{idx + 1}</td>
                      <td className="p-3 font-black uppercase text-[#b8860b]">{ch.name}</td>
                      <td className="p-3 uppercase font-bold text-slate-400">{ch.sector}</td>
                      <td className="p-3 text-center font-mono font-black text-slate-800">{ch.meters.toFixed(1)} m</td>
                      <td className="p-3 text-center font-mono text-slate-700">{ch.volume.toFixed(1)} m³</td>
                      <td className="p-3 text-center font-mono text-slate-500">{ch.rounds} volées</td>
                      <td className="p-3 text-center">
                        <div className="w-16 bg-slate-100 h-1 rounded-full mx-auto overflow-hidden">
                          <div className="h-full bg-[#b8860b]" style={{ width: `${Math.min(100, ch.score)}%` }} />
                        </div>
                      </td>
                      <td className="p-3 text-center">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 font-bold rounded-lg text-[9px]">
                          {ch.score} pts
                        </span>
                      </td>
                    </tr>
                  ))}
                  {leaderboards.chantiersList.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-6 text-center text-slate-400 uppercase font-black">Aucun chantier actif enregistré</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* EQUIPES LEADERBOARD */}
        {activeSubTab === 'equipes' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black uppercase text-slate-800">Efficacité des Équipes Complètes d'Extraction (Bure & Wagons)</h3>
              <span className="text-[8px] font-black uppercase bg-slate-100 px-2 py-0.5 rounded text-slate-600">Productivité : Nombre de wagons acheminés par poste de travail</span>
            </div>

            <div className="overflow-x-auto border border-slate-100 rounded-xl">
              <table className="w-full text-left border-collapse text-[10.5px]">
                <thead>
                  <tr className="bg-slate-900 text-white uppercase text-[8.5px] font-bold">
                    <th className="p-3 text-center w-12">Rang</th>
                    <th className="p-3">Chef d'Équipe (Treuilliste)</th>
                    <th className="p-3">Équipiers Affectés au Fond</th>
                    <th className="p-3 text-center">Wagons Extraits</th>
                    <th className="p-3 text-center">Objectif Prévu</th>
                    <th className="p-3 text-center">Productivité Horaire</th>
                    <th className="p-3 text-center">Taux d'Atteinte</th>
                    <th className="p-3 text-center">Score Équipe</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filterBySearch(leaderboards.crews, ['treuilliste']).map((cr, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/50">
                      <td className="p-3 text-center font-black text-xs">🥇 {idx + 1}</td>
                      <td className="p-3 font-black uppercase text-indigo-700">
                        {getPersonnelName(cr.treuilliste)}
                      </td>
                      <td className="p-3 leading-tight uppercase font-bold text-slate-400 text-[9px]">
                        {cr.equipiers.map(getPersonnelName).join(' • ')}
                      </td>
                      <td className="p-3 text-center font-mono font-black text-slate-800">{cr.wagonsActual} wgs</td>
                      <td className="p-3 text-center font-mono text-slate-400">{cr.wagonsTarget} wgs</td>
                      <td className="p-3 text-center font-mono text-slate-600 font-bold">
                        {cr.productivity.toFixed(1)} wg/h
                      </td>
                      <td className="p-3 text-center font-mono font-black text-indigo-600">
                        {cr.rate.toFixed(0)}%
                      </td>
                      <td className="p-3 text-center">
                        <span className={`px-2 py-0.5 border text-[9px] font-black rounded-lg ${getScoreColor(cr.score)}`}>
                          {cr.score} %
                        </span>
                      </td>
                    </tr>
                  ))}
                  {leaderboards.crews.length === 0 && (
                    <tr>
                      <td colSpan={8} className="p-6 text-center text-slate-400 uppercase font-black">Aucune équipe d'extraction active sur cette période</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* SECTEURS LEADERBOARD */}
        {activeSubTab === 'secteurs' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-black uppercase text-slate-800">Classement Opérationnel des Secteurs</h3>
              <span className="text-[8px] font-black uppercase bg-slate-100 px-2 py-0.5 rounded text-slate-600">Calcul composite : 60% Réussite Forage + 40% Réussite Volumétrie LHD</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {leaderboards.sectors.map((sec, idx) => {
                let badgeColor = 'bg-rose-50 text-rose-800 border-rose-100';
                if (sec.score >= 90) badgeColor = 'bg-emerald-50 text-emerald-800 border-emerald-200';
                else if (sec.score >= 75) badgeColor = 'bg-amber-50 text-amber-800 border-amber-200';

                return (
                  <div key={sec.name} className="border border-[#d4af37]/35 rounded-xl p-4 bg-white flex flex-col justify-between hover:shadow-2xs transition-all relative overflow-hidden">
                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#0ea5e9] to-[#ef4444]" />
                    <div className="absolute top-2 right-2 font-mono font-black text-slate-300 text-lg mt-1">#{idx + 1}</div>
                    <div className="mt-1">
                      <span className="text-[9.5px] font-black text-slate-400 uppercase block">SECTEUR</span>
                      <span className="text-sm font-black text-slate-800 block uppercase mb-3">{sec.name}</span>
                      
                      <div className="space-y-2 mb-4 text-[10px]">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400 font-bold uppercase">Mètres Forés :</span>
                          <span className="font-mono font-bold text-slate-800">{sec.realMet.toFixed(1)}m</span>
                        </div>
                        <div className="flex justify-between items-center">
                          <span className="text-slate-400 font-bold uppercase">Volume Déblayé :</span>
                          <span className="font-mono font-bold text-slate-800">{sec.realVol.toFixed(1)}m³</span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                      <span className="text-[8.5px] text-slate-400 uppercase font-bold">Score Global</span>
                      <span className={`px-2 py-0.5 rounded-lg border text-[10.5px] font-black ${badgeColor}`}>
                        {sec.score}%
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
