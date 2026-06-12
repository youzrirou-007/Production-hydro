import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, Filter, Calendar, MapPin, Layers, Clock, ChevronDown, Download } from 'lucide-react';
import { collection, query, onSnapshot, orderBy, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { format } from 'date-fns';

export const DailyReport: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [chantiers, setChantiers] = useState<any[]>([]);
  const [filterChantier, setFilterChantier] = useState('all');
  const [filterDate, setFilterDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load Chantiers for filter
    const qChan = query(collection(db, 'chantiers'));
    const unsubChan = onSnapshot(qChan, (snap) => {
      setChantiers(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    // Load Production Data
    const qProd = query(collection(db, 'production'));
    const unsubProd = onSnapshot(qProd, (snap) => {
      const allRows: any[] = [];
      snap.docs.forEach(docSnap => {
        const docData = docSnap.data();
        const date = docData.date || docSnap.id;
        if (docData.postes) {
          Object.entries(docData.postes).forEach(([pKey, pVal]: [string, any]) => {
            const postName = pKey === 'poste1' ? 'Poste 1' : pKey === 'poste2' ? 'Poste 2' : 'Poste 3';
            if (pVal.minage && Array.isArray(pVal.minage)) {
              pVal.minage.forEach((row: any) => {
                if (row.chantierId) {
                  allRows.push({
                    id: `${docSnap.id}_${pKey}_minage_${row.chantierId}`,
                    date,
                    post: postName,
                    chantierId: row.chantierId,
                    chantierName: row.chantierName || 'Slick',
                    chiefName: row.chiefName || pVal.chiefName || '',
                    minerName: row.minerName || '',
                    assistantName: row.assistantName || '',
                    gallerySize: row.gallerySize || 12,
                    holeCount: row.realHoles || 0,
                    rounds: row.realRounds || 0,
                    meterage: row.realMeterage || 0,
                    meteragePlanned: row.meterage || 0,
                    explosives: row.explosives || { anfo: 0, tovex: 0, ammorces: 0 },
                    timestamp: docData.timestamp || ''
                  });
                }
              });
            }
          });
        }
      });
      // Sort all rows by date desc, then shift asc
      allRows.sort((a, b) => {
        const dCompare = b.date.localeCompare(a.date);
        if (dCompare !== 0) return dCompare;
        return a.post.localeCompare(b.post);
      });
      setData(allRows);
      setLoading(false);
    });

    return () => { unsubChan(); unsubProd(); };
  }, []);

  const filteredData = data.map(item => {
    const matchedChan = chantiers.find(c => c.id === item.chantierId);
    return {
      ...item,
      chantierName: matchedChan ? matchedChan.name : item.chantierName
    };
  }).filter(r => {
    const matchesChantier = filterChantier === 'all' || r.chantierId === filterChantier;
    const matchesDate = !filterDate || r.date === filterDate;
    return matchesChantier && matchesDate;
  });

  const getYieldInfo = (meterage: number, rounds: number) => {
    if (!rounds || rounds === 0) return { label: 'N/A', color: 'text-gray-300' };
    const yieldValue = meterage / rounds;
    if (yieldValue >= 1.5) return { label: 'BON RENDEMENT', color: 'text-green-600' };
    if (yieldValue <= 1.3) return { label: 'FAIBLE RENDEMENT', color: 'text-red-600' };
    return { label: 'NORMAL', color: 'text-blue-600' };
  };

  const totalDayMeterage = filteredData.reduce((acc, r) => acc + (r.meterage || 0), 0);
  const totalDayAnfo = filteredData.reduce((acc, r) => acc + (r.explosives?.anfo || 0), 0);
  const totalDayTovex = filteredData.reduce((acc, r) => acc + (r.explosives?.tovex || 0), 0);
  const totalDayAmorces = filteredData.reduce((acc, r) => acc + (r.explosives?.ammorces || 0), 0);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-end border-b-4 border-[#141414] pb-4">
        <div>
          <h3 className="text-5xl font-black tracking-tighter text-[#141414] uppercase italic">Rapport Consolidé</h3>
          <p className="text-sm font-black uppercase tracking-[0.3em] text-[#00BFFF]">Master Data SMI • Performance & Consommations</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-white border-2 border-[#141414] px-4 py-2 flex items-center gap-3">
            <Calendar className="w-4 h-4 text-[#141414]/40" />
            <input 
              type="date" 
              value={filterDate}
              onChange={e => setFilterDate(e.target.value)}
              className="text-xs font-black uppercase outline-none"
            />
          </div>
          <div className="bg-white border-2 border-[#141414] px-4 py-2 flex items-center gap-3">
            <MapPin className="w-4 h-4 text-[#141414]/40" />
            <select 
              value={filterChantier}
              onChange={e => setFilterChantier(e.target.value)}
              className="text-xs font-black uppercase outline-none bg-transparent"
            >
              <option value="all">Tous les Chantiers</option>
              {chantiers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <button className="bg-[#141414] text-white p-4 hover:bg-[#00BFFF] transition-all">
            <Download className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#141414] p-6 text-white border-l-8 border-[#00BFFF]">
            <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Métrage Cumulé</p>
            <h4 className="text-3xl font-black">{totalDayMeterage.toFixed(1)} m</h4>
        </div>
        <div className="bg-white p-6 border-2 border-[#141414]/5 shadow-sm">
            <p className="text-[10px] font-black uppercase text-[#141414]/40 mb-2">Total ANFO</p>
            <h4 className="text-3xl font-black text-[#8B0000]">{totalDayAnfo} kg</h4>
        </div>
        <div className="bg-white p-6 border-2 border-[#141414]/5 shadow-sm">
            <p className="text-[10px] font-black uppercase text-[#141414]/40 mb-2">ANFO / mètre</p>
            <h4 className="text-3xl font-black text-[#141414]">{(totalDayAnfo / (totalDayMeterage || 1)).toFixed(2)}</h4>
        </div>
        <div className="bg-white p-6 border-2 border-[#141414]/5 shadow-sm">
            <p className="text-[10px] font-black uppercase text-[#141414]/40 mb-2">Total Amorces</p>
            <h4 className="text-3xl font-black text-[#00BFFF]">{totalDayAmorces}</h4>
        </div>
      </div>

      <div className="bg-white border-4 border-[#141414] p-0 shadow-[16px_16px_0px_rgba(20,20,20,0.1)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#141414] text-white">
                {['Shift', 'Chantier', 'Équipe (Chef/Min/Aid)', 'Forage (Trs/Vol)', 'Métrage Actual', 'KPI Rendement', 'Explosifs (Anf/Tov/Am)', 'Ratio Exp/m'].map(h => (
                  <th key={h} className="px-4 py-5 text-[9px] font-black uppercase tracking-[0.1em] whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#141414]/10">
              {filteredData.map((r, i) => {
                const yieldInfo = getYieldInfo(r.meterage, r.rounds);
                return (
                  <tr key={i} className="hover:bg-[#F5F5F0] transition-colors">
                    <td className="px-4 py-4 text-[10px] font-black uppercase">{r.post}</td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase text-[#00BFFF]">{r.chantierName}</span>
                        <span className="text-[8px] font-bold text-gray-400">Section: {r.gallerySize}m²</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[9px] font-black uppercase truncate max-w-[150px]">{r.chiefName}</span>
                        <span className="text-[8px] font-bold text-gray-400 uppercase truncate max-w-[150px]">{r.minerName} / {r.assistantName}</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black">{r.holeCount} trs</span>
                        <span className="text-xs text-gray-300">/</span>
                        <span className="text-[10px] font-black text-[#141414]">{r.rounds} vol</span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                       <div className="flex flex-col">
                          <span className="text-sm font-black text-[#141414]">{r.meterage}m</span>
                          <span className="text-[8px] font-bold text-gray-400 uppercase">Plan: {r.meteragePlanned?.toFixed(1)}m</span>
                       </div>
                    </td>
                    <td className="px-4 py-4">
                        <span className={cn("text-[9px] font-black uppercase tracking-tighter border-2 px-2 py-1", yieldInfo.color)}>
                          {yieldInfo.label}
                        </span>
                    </td>
                    <td className="px-4 py-4">
                       <div className="grid grid-cols-3 gap-2">
                          <div className="text-center bg-red-50 p-1">
                            <p className="text-[7px] text-[#8B0000] font-bold">ANF</p>
                            <p className="text-[10px] font-black">{r.explosives?.anfo}</p>
                          </div>
                          <div className="text-center bg-red-50 p-1">
                            <p className="text-[7px] text-[#8B0000] font-bold">TOV</p>
                            <p className="text-[10px] font-black">{r.explosives?.tovex}</p>
                          </div>
                          <div className="text-center bg-red-50 p-1">
                            <p className="text-[7px] text-[#8B0000] font-bold">AMO</p>
                            <p className="text-[10px] font-black">{r.explosives?.ammorces}</p>
                          </div>
                       </div>
                    </td>
                    <td className="px-4 py-4 text-[10px] font-black">
                      {(r.explosives?.anfo / (r.meterage || 1)).toFixed(2)} kg/m
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};


function cn(...inputs: any[]) {
  return inputs.filter(Boolean).join(' ');
}
