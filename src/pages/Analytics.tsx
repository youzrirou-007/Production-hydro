import React, { useState, useEffect, useMemo } from 'react';
import { db } from '../lib/firebase';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  limit, 
  doc 
} from 'firebase/firestore';
import { ResponsiveContainer, ComposedChart, BarChart, Bar, Line, Cell, XAxis, YAxis, Tooltip, Legend, RadialBarChart, RadialBar } from 'recharts';

export const Analytics: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'direction' | 'personnel' | 'secteurs' | 'equipements' | 'explosifs'>('direction');
  const [productionHistory, setProductionHistory] = useState<any[]>([]);
  const [allProductionDocs, setAllProductionDocs] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [chantiers, setChantiers] = useState<any[]>([]);
  const [platformSettings, setPlatformSettings] = useState<any>({});
  const [loadingData, setLoadingData] = useState(true);
  const [filterPeriod, setFilterPeriod] = useState<'7j' | '30j' | '90j'>('30j');

  useEffect(() => {
    let activeListeners = 5;
    const checkLoading = () => {
      activeListeners -= 1;
      if (activeListeners <= 0) {
        setLoadingData(false);
      }
    };

    const qHistory = query(collection(db, 'production_history'), orderBy('date', 'desc'), limit(90));
    const unsubHistory = onSnapshot(qHistory, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setProductionHistory(data);
      checkLoading();
    }, () => checkLoading());

    const qProduction = query(collection(db, 'production'), orderBy('date', 'desc'), limit(90));
    const unsubProd = onSnapshot(qProduction, (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setAllProductionDocs(data);
      checkLoading();
    }, () => checkLoading());

    const unsubPersonnel = onSnapshot(collection(db, 'personnel'), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setEmployees(data);
      checkLoading();
    }, () => checkLoading());

    const unsubChantiers = onSnapshot(collection(db, 'chantiers'), (snap) => {
      const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setChantiers(data);
      checkLoading();
    }, () => checkLoading());

    const unsubSettings = onSnapshot(doc(db, 'platform_settings', 'config'), (snap) => {
      if (snap.exists()) {
        setPlatformSettings(snap.data());
      }
      checkLoading();
    }, () => checkLoading());

    return () => {
      unsubHistory();
      unsubProd();
      unsubPersonnel();
      unsubChantiers();
      unsubSettings();
    };
  }, []);

  const cutoffDate = useMemo(() => {
    const days = filterPeriod === '7j' ? 7 : filterPeriod === '30j' ? 30 : 90;
    const d = new Date();
    d.setDate(d.getDate() - days);
    return d.toISOString().split('T')[0];
  }, [filterPeriod]);

  const filteredHistory = useMemo(() =>
    productionHistory.filter(d => d.date >= cutoffDate),
  [productionHistory, cutoffDate]);

  const totalRealised = useMemo(() => {
    return filteredHistory.reduce((s, d) => s + (d.totalMeterageRealised || 0), 0);
  }, [filteredHistory]);

  const totalPlanned = useMemo(() => {
    return filteredHistory.reduce((s, d) => s + (d.totalMeteragePlanned || 0), 0);
  }, [filteredHistory]);

  const kpiCards = useMemo(() => {
    const meters = totalRealised.toFixed(1);
    
    const wagons = filteredHistory.reduce((s, d) => s + (d.totalWagonsRealised || 0), 0);
    
    const rateVal = totalPlanned > 0 ? (totalRealised / totalPlanned * 100) : 0;
    const rate = rateVal.toFixed(1) + "%";
    
    const days = filteredHistory.length;

    return [
      {
        value: meters,
        label: "Mètres forés",
        icon: "⛏️",
        color: "border-l-emerald-500 text-emerald-600"
      },
      {
        value: wagons,
        label: "Wagons extraits",
        icon: "🚛",
        color: "border-l-sky-500 text-sky-600"
      },
      {
        value: rate,
        label: "Taux réalisation",
        icon: "🎯",
        color: rateVal >= 90 ? "border-l-emerald-500 text-emerald-600" : "border-l-amber-500 text-amber-600"
      },
      {
        value: days,
        label: "Jours enregistrés",
        icon: "📅",
        color: "border-l-slate-500 text-slate-600"
      }
    ];
  }, [filteredHistory, totalRealised, totalPlanned]);

  const chartData = useMemo(() => {
    return [...filteredHistory].reverse().map(d => ({
      ...d,
      formattedDate: d.date ? `${d.date.slice(8, 10)}/${d.date.slice(5, 7)}` : '',
    }));
  }, [filteredHistory]);

  const maxMeterage = useMemo(() => {
    if (filteredHistory.length === 0) return 10;
    const vals = filteredHistory.flatMap(d => [d.totalMeterageRealised || 0, d.totalMeteragePlanned || 0]);
    return Math.max(...vals, 10);
  }, [filteredHistory]);

  const maxWagons = useMemo(() => {
    if (filteredHistory.length === 0) return 10;
    const vals = filteredHistory.flatMap(d => [d.totalWagonsRealised || 0, d.totalWagonsPlanned || 0]);
    return Math.max(...vals, 10);
  }, [filteredHistory]);

  const todayObj = useMemo(() => new Date(), []);
  const currentMonth = useMemo(() => todayObj.toISOString().slice(0, 7), [todayObj]);
  const daysInMonth = useMemo(() => new Date(todayObj.getFullYear(), todayObj.getMonth() + 1, 0).getDate(), [todayObj]);
  const dayOfMonth = useMemo(() => todayObj.getDate(), [todayObj]);
  const daysRemaining = useMemo(() => daysInMonth - dayOfMonth, [daysInMonth, dayOfMonth]);

  const thisMonthHistory = useMemo(() => {
    return productionHistory.filter(d => d.date?.startsWith(currentMonth));
  }, [productionHistory, currentMonth]);

  const avgDailyMeterage = useMemo(() => {
    return thisMonthHistory.length > 0
      ? thisMonthHistory.reduce((s, d) => s + (d.totalMeterageRealised || 0), 0) / thisMonthHistory.length
      : 0;
  }, [thisMonthHistory]);

  const avgDailyWagons = useMemo(() => {
    return thisMonthHistory.length > 0
      ? thisMonthHistory.reduce((s, d) => s + (d.totalWagonsRealised || 0), 0) / thisMonthHistory.length
      : 0;
  }, [thisMonthHistory]);

  const projectedMonthMeterage = useMemo(() => {
    const currentTotal = thisMonthHistory.reduce((s, d) => s + (d.totalMeterageRealised || 0), 0);
    return currentTotal + (avgDailyMeterage * daysRemaining);
  }, [thisMonthHistory, avgDailyMeterage, daysRemaining]);

  const projectedMonthWagons = useMemo(() => {
    const currentTotal = thisMonthHistory.reduce((s, d) => s + (d.totalWagonsRealised || 0), 0);
    return currentTotal + (avgDailyWagons * daysRemaining);
  }, [thisMonthHistory, avgDailyWagons, daysRemaining]);

  const targetWagons = platformSettings?.wagonsTarget || platformSettings?.defaultWagonsTarget || 48;
  const objectifMensuel = (platformSettings?.wagonsTarget * 30) || 450;
  const projectedWagonsThreshold = targetWagons * daysInMonth * 0.8;

  const alerts = useMemo(() => {
    const list: { type: 'ROUGE' | 'AMBER'; text: string; badge: string }[] = [];
    const recent7 = filteredHistory.slice(0, 7);
    
    if (recent7.length >= 3) {
      const recent3 = recent7.slice(0, 3);
      
      const avg3m = recent3.reduce((s, d) => s + (d.totalMeterageRealised || 0), 0) / recent3.length;
      const avg7m = recent7.reduce((s, d) => s + (d.totalMeterageRealised || 0), 0) / recent7.length;
      if (avg7m > 0 && avg3m < avg7m * 0.85) {
        const dec = Math.round(((avg7m - avg3m) / avg7m) * 100);
        list.push({
          type: 'ROUGE',
          text: `⚠️ Dérive détectée : rendement minage -${dec}% sur les 3 derniers jours`,
          badge: 'Dérive Minage'
        });
      }

      const avg3w = recent3.reduce((s, d) => s + (d.totalWagonsRealised || 0), 0) / recent3.length;
      const avg7w = recent7.reduce((s, d) => s + (d.totalWagonsRealised || 0), 0) / recent7.length;
      if (avg7w > 0 && avg3w < avg7w * 0.85) {
        const dec = Math.round(((avg7w - avg3w) / avg7w) * 100);
        list.push({
          type: 'ROUGE',
          text: `⚠️ Dérive détectée : rendement wagons -${dec}% sur les 3 derniers jours`,
          badge: 'Dérive Extraction'
        });
      }
    }

    if (recent7.length > 0) {
      const tRealised = recent7.reduce((s, d) => s + (d.totalMeterageRealised || 0), 0);
      const tPlanned = recent7.reduce((s, d) => s + (d.totalMeteragePlanned || 0), 0);
      if (tPlanned > 0 && (tRealised / tPlanned) < 0.80) {
        list.push({
          type: 'AMBER',
          text: `📉 Taux de réalisation métrage sous 80% sur 7 jours`,
          badge: 'Taux Faible'
        });
      }
    }

    const yesterdayStr = (() => {
      const d = new Date();
      d.setDate(d.getDate() - 1);
      return d.toISOString().split('T')[0];
    })();

    const mostRecentDate = filteredHistory[0]?.date;
    if (!mostRecentDate || mostRecentDate < yesterdayStr) {
      list.push({
        type: 'AMBER',
        text: `⏰ Aucune saisie enregistrée aujourd'hui`,
        badge: "Saisie"
      });
    }

    return list;
  }, [filteredHistory]);

  const filteredProduction = useMemo(() =>
    allProductionDocs.filter(d => d.id >= cutoffDate),
  [allProductionDocs, cutoffDate]);

  const sortedMiners = useMemo(() => {
    const minerStats: Record<string, {
      matricule: string;
      name: string;
      totalMeterage: number;
      totalRounds: number;
      totalAnfo: number;
      days: number;
      avgYield: number;
      last3DaysYield: number;
      trend: 'up' | 'down' | 'stable';
    }> = {};

    filteredProduction.forEach(doc => {
      const postes = doc.postes || {};
      ['poste1', 'poste2', 'poste3'].forEach(pKey => {
        const minage = postes[pKey]?.minage || [];
        minage.forEach((r: any) => {
          const row = r.reel || r;
          if (!row || !row.minerMatricule) return;
          const key = row.minerMatricule;
          if (!minerStats[key]) {
            minerStats[key] = {
              matricule: key,
              name: employees.find(e => e.matricule === key)?.name || key,
              totalMeterage: 0,
              totalRounds: 0,
              totalAnfo: 0,
              days: 0,
              avgYield: 0,
              last3DaysYield: 0,
              trend: 'stable'
            };
          }
          minerStats[key].totalMeterage += Number(row.realMeterage || 0);
          minerStats[key].totalRounds += Number(row.realRounds || 0);
          minerStats[key].totalAnfo += Number(row.anfo || row.reel?.anfo || 0);
          minerStats[key].days++;
        });
      });
    });

    Object.values(minerStats).forEach(m => {
      m.avgYield = m.totalRounds > 0 ? m.totalMeterage / m.totalRounds : 0;
    });

    const sortedFilteredProduction = [...filteredProduction].sort((a, b) => b.id.localeCompare(a.id));
    const last3Docs = sortedFilteredProduction.slice(0, 3);
    const minerLast3Stats: Record<string, { meterage: number, rounds: number }> = {};
    last3Docs.forEach(doc => {
      const postes = doc.postes || {};
      ['poste1', 'poste2', 'poste3'].forEach(pKey => {
        const minage = postes[pKey]?.minage || [];
        minage.forEach((r: any) => {
          const row = r.reel || r;
          if (row && row.minerMatricule) {
            const mId = row.minerMatricule;
            if (!minerLast3Stats[mId]) {
              minerLast3Stats[mId] = { meterage: 0, rounds: 0 };
            }
            minerLast3Stats[mId].meterage += Number(row.realMeterage || 0);
            minerLast3Stats[mId].rounds += Number(row.realRounds || 0);
          }
        });
      });
    });

    Object.values(minerStats).forEach(m => {
      const last3 = minerLast3Stats[m.matricule];
      if (last3 && last3.rounds > 0) {
        m.last3DaysYield = last3.meterage / last3.rounds;
        if (m.last3DaysYield > m.avgYield * 1.05) {
          m.trend = 'up';
        } else if (m.last3DaysYield < m.avgYield * 0.90) {
          m.trend = 'down';
        } else {
          m.trend = 'stable';
        }
      } else {
        m.last3DaysYield = m.avgYield;
        m.trend = 'stable';
      }
    });

    return Object.values(minerStats).sort((a, b) => b.avgYield - a.avgYield);
  }, [filteredProduction, employees]);

  const downMiners = useMemo(() => {
    return sortedMiners.filter(m => m.trend === 'down');
  }, [sortedMiners]);

  const kpiGood = platformSettings?.kpi_18m_good ?? 1.6;
  const kpiLow = platformSettings?.kpi_18m_low ?? 1.5;

  interface SectorStats {
    name: string;
    totalMeterage: number;
    totalPlannedMeterage: number;
    totalRounds: number;
    totalWagons: number;
    totalAnfo: number;
    days: Set<string>;
    avgYield: number;
    tauxRealisation: number;
    chantiers: Set<string>;
  }

  const sectorStatsCalculated = useMemo<Record<string, SectorStats>>(() => {
    const stats: Record<string, {
      name: string;
      totalMeterage: number;
      totalPlannedMeterage: number;
      totalRounds: number;
      totalWagons: number;
      totalAnfo: number;
      days: Set<string>;
      avgYield: number;
      tauxRealisation: number;
      chantiers: Set<string>;
    }> = {
      'Imiter 1': { name: 'Imiter 1', totalMeterage: 0, totalPlannedMeterage: 0, totalRounds: 0, totalWagons: 0, totalAnfo: 0, days: new Set(), avgYield: 0, tauxRealisation: 0, chantiers: new Set() },
      'Imiter 2': { name: 'Imiter 2', totalMeterage: 0, totalPlannedMeterage: 0, totalRounds: 0, totalWagons: 0, totalAnfo: 0, days: new Set(), avgYield: 0, tauxRealisation: 0, chantiers: new Set() },
      'Imiter Est': { name: 'Imiter Est', totalMeterage: 0, totalPlannedMeterage: 0, totalRounds: 0, totalWagons: 0, totalAnfo: 0, days: new Set(), avgYield: 0, tauxRealisation: 0, chantiers: new Set() }
    };

    const normalizeSector = (s: string): string => {
      if (!s) return 'Imiter 1';
      const sl = s.toLowerCase();
      if (sl.includes('1')) return 'Imiter 1';
      if (sl.includes('2')) return 'Imiter 2';
      if (sl.includes('est')) return 'Imiter Est';
      return 'Imiter 1';
    };

    filteredProduction.forEach(doc => {
      const docId = doc.id;
      const postes = doc.postes || {};
      ['poste1', 'poste2', 'poste3'].forEach(pKey => {
        const minage = postes[pKey]?.minage || [];
        minage.forEach((r: any) => {
          const row = r.reel || r;
          if (!row) return;
          const sec = normalizeSector(row.sectorGroup || row.sector || '');
          if (!stats[sec]) return;

          const rMet = row.realMeterage !== undefined && row.realMeterage !== null
            ? row.realMeterage
            : (row.meterage !== undefined ? row.meterage : 0);

          stats[sec].totalMeterage += Number(rMet || 0);
          stats[sec].totalPlannedMeterage += Number(r.plan?.meterage || 0);
          stats[sec].totalRounds += Number(row.realRounds || 0);
          stats[sec].totalAnfo += Number(row.anfo || 0);
          stats[sec].days.add(docId);
          if (row.chantierId) stats[sec].chantiers.add(row.chantierId);
        });
      });
    });

    Object.values(stats).forEach(s => {
      s.avgYield = s.totalRounds > 0 ? s.totalMeterage / s.totalRounds : 0;
      s.tauxRealisation = s.totalPlannedMeterage > 0
        ? (s.totalMeterage / s.totalPlannedMeterage) * 100
        : 0;
    });

    return stats;
  }, [filteredProduction]);

  const bestSectorName = useMemo(() => {
    let bestName = '';
    let maxTaux = -1;
    (Object.values(sectorStatsCalculated) as SectorStats[]).forEach(s => {
      if (s.tauxRealisation > maxTaux) {
        maxTaux = s.tauxRealisation;
        bestName = s.name;
      }
    });
    return bestName;
  }, [sectorStatsCalculated]);

  const postStatsCalculated = useMemo(() => {
    const stats = {
      'Poste 1': { totalMeterage: 0, totalWagons: 0, maxMeterage: 0, maxDate: '' },
      'Poste 2': { totalMeterage: 0, totalWagons: 0, maxMeterage: 0, maxDate: '' },
      'Poste 3': { totalMeterage: 0, totalWagons: 0, maxMeterage: 0, maxDate: '' },
    };

    filteredProduction.forEach(doc => {
      const dateStr = doc.id;
      const postes = doc.postes || {};
      ['poste1', 'poste2', 'poste3'].forEach(pKey => {
        const pName = pKey === 'poste1' ? 'Poste 1' : pKey === 'poste2' ? 'Poste 2' : 'Poste 3';
        const pData = postes[pKey] || {};
        
        let dayMeterage = 0;
        let dayWagons = 0;

        // Minage
        const minage = pData.minage || [];
        minage.forEach((r: any) => {
          const row = r.reel || r;
          const rMet = row.realMeterage !== undefined && row.realMeterage !== null
            ? row.realMeterage
            : (row.meterage !== undefined ? row.meterage : 0);
          dayMeterage += Number(rMet) || 0;
        });

        // Extraction
        const extraction = pData.extraction || [];
        extraction.forEach((r: any) => {
          dayWagons += Number(r.reel?.wagonsActual || r.wagonsActual || 0);
        });

        stats[pName].totalMeterage += dayMeterage;
        stats[pName].totalWagons += dayWagons;
        
        if (dayMeterage > stats[pName].maxMeterage) {
          stats[pName].maxMeterage = dayMeterage;
          stats[pName].maxDate = dateStr;
        }
      });
    });

    const den = filteredProduction.length || 1;
    return ['Poste 1', 'Poste 2', 'Poste 3'].map(pName => {
      const s = stats[pName as 'Poste 1' | 'Poste 2' | 'Poste 3'];
      return {
        name: pName,
        avgMeterage: s.totalMeterage / den,
        avgWagons: s.totalWagons / den,
        maxDate: s.maxDate,
        maxMeterage: s.maxMeterage,
      };
    });
  }, [filteredProduction]);

  const chantierStats = useMemo(() => {
    const stats: Record<string, {
      chantierId: string;
      sector: string;
      totalMeterage: number;
      totalRounds: number;
    }> = {};

    const normalizeSector = (s: string): string => {
      if (!s) return 'Imiter 1';
      const sl = s.toLowerCase();
      if (sl.includes('1')) return 'Imiter 1';
      if (sl.includes('2')) return 'Imiter 2';
      if (sl.includes('est')) return 'Imiter Est';
      return 'Imiter 1';
    };

    filteredProduction.forEach(doc => {
      const postes = doc.postes || {};
      ['poste1', 'poste2', 'poste3'].forEach(pKey => {
        const minage = postes[pKey]?.minage || [];
        minage.forEach((r: any) => {
          const row = r.reel || r;
          if (!row || !row.chantierId) return;
          const cId = row.chantierId;
          const rawSec = row.sectorGroup || row.sector || '';
          const sec = normalizeSector(rawSec);

          if (!stats[cId]) {
            stats[cId] = {
              chantierId: cId,
              sector: sec,
              totalMeterage: 0,
              totalRounds: 0,
            };
          }
          const rMet = row.realMeterage !== undefined && row.realMeterage !== null
            ? row.realMeterage
            : (row.meterage !== undefined ? row.meterage : 0);
          stats[cId].totalMeterage += Number(rMet || 0);
          stats[cId].totalRounds += Number(row.realRounds || 0);
        });
      });
    });

    const list = Object.values(stats).sort((a, b) => b.totalMeterage - a.totalMeterage);
    return list.slice(0, 10);
  }, [filteredProduction]);

  const generateDirectionReport = () => {
    const today = new Date().toLocaleDateString('fr-MA', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    const totalMeterage = filteredHistory
      .reduce((s, d) => s + (d.totalMeterageRealised || 0), 0).toFixed(1);
    const totalWagons = filteredHistory
      .reduce((s, d) => s + (d.totalWagonsRealised || 0), 0);
    const totalAnfo = filteredHistory
      .reduce((s, d) => s + (d.totalAnfo || 0), 0).toFixed(0);
    const tauxRealisation = filteredHistory.length > 0
      ? (filteredHistory.reduce((s, d) =>
          s + (d.totalMeterageRealised || 0), 0) /
         Math.max(1, filteredHistory.reduce((s, d) =>
          s + (d.totalMeteragePlanned || 0), 0)) * 100).toFixed(1)
      : '—';

    const html = `<!DOCTYPE html><html lang="fr">
    <head>
      <meta charset="UTF-8">
      <title>Rapport Direction SMI — ${today}</title>
      <style>
        body { font-family: 'Arial', sans-serif; margin: 0; padding: 24px;
          color: #1e293b; font-size: 12px; }
        .header { background: #0f172a; color: white; padding: 24px 32px;
          border-radius: 8px; margin-bottom: 24px; }
        .header h1 { margin: 0; font-size: 20px; font-weight: 900;
          text-transform: uppercase; letter-spacing: 2px; }
        .header .subtitle { color: #ffd700; font-size: 10px;
          font-weight: 700; text-transform: uppercase; margin-top: 4px; }
        .header .date { color: #94a3b8; font-size: 10px; margin-top: 2px; }
        .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr);
          gap: 16px; margin-bottom: 24px; }
        .kpi-card { border: 2px solid #e2e8f0; border-radius: 8px;
          padding: 16px; text-align: center; }
        .kpi-value { font-size: 28px; font-weight: 900; color: #1a5276; }
        .kpi-label { font-size: 9px; text-transform: uppercase;
          color: #64748b; font-weight: 700; margin-top: 4px;
          letter-spacing: 1px; }
        .section-title { font-size: 11px; font-weight: 900;
          text-transform: uppercase; color: #0f172a; letter-spacing: 1px;
          border-left: 4px solid #ffd700; padding-left: 10px;
          margin: 20px 0 12px 0; }
        table { width: 100%; border-collapse: collapse; font-size: 10px; }
        th { background: #0f172a; color: white; padding: 8px;
          text-align: left; font-size: 9px; text-transform: uppercase; }
        td { padding: 7px 8px; border-bottom: 1px solid #e2e8f0; }
        tr:nth-child(even) td { background: #f8fafc; }
        .footer { margin-top: 32px; padding-top: 12px;
          border-top: 1px solid #e2e8f0; color: #94a3b8; font-size: 9px;
          text-align: center; }
        .badge { display: inline-block; padding: 2px 8px; border-radius: 99px;
          font-size: 8px; font-weight: 900; text-transform: uppercase; }
        .badge-green { background: #dcfce7; color: #166534; }
        .badge-red { background: #fee2e2; color: #991b1b; }
        @media print {
          body { padding: 0; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div style="display:flex; justify-content:space-between; align-items:center;">
          <div>
            <h1>🏔️ HYDROMINES — SMI IMITER</h1>
            <div class="subtitle">⛏️ Rapport Analytique Direction — Période ${filterPeriod}</div>
            <div class="date">Généré le ${today}</div>
          </div>
          <div style="text-align:right; color:#ffd700; font-size:11px;
            font-weight:900; text-transform:uppercase;">
            GOD LEVEL<br>ANALYTICS
          </div>
        </div>
      </div>

      <div class="kpi-grid">
        <div class="kpi-card">
          <div class="kpi-value">${totalMeterage} m</div>
          <div class="kpi-label">⛏️ Mètres Forés</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-value">${totalWagons}</div>
          <div class="kpi-label">🚛 Wagons Extraits</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-value">${tauxRealisation}%</div>
          <div class="kpi-label">🎯 Taux Réalisation</div>
        </div>
        <div class="kpi-card">
          <div class="kpi-value">${totalAnfo} kg</div>
          <div class="kpi-label">💥 ANFO Consommé</div>
        </div>
      </div>

      <div class="section-title">📊 Détail Journalier</div>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Métrage Prévu (m)</th>
            <th>Métrage Réalisé (m)</th>
            <th>Taux</th>
            <th>Wagons Prévus</th>
            <th>Wagons Réalisés</th>
            <th>ANFO (kg)</th>
          </tr>
        </thead>
        <tbody>
          ${filteredHistory.map(d => {
            const taux = d.totalMeteragePlanned > 0
              ? (d.totalMeterageRealised / d.totalMeteragePlanned * 100).toFixed(0)
              : '—';
            return `<tr>
              <td><strong>${d.date || d.id}</strong></td>
              <td>${(d.totalMeteragePlanned || 0).toFixed(1)}</td>
              <td><strong>${(d.totalMeterageRealised || 0).toFixed(1)}</strong></td>
              <td><span class="badge ${Number(taux) >= 90 ? 'badge-green' : 'badge-red'}">${taux}%</span></td>
              <td>${d.totalWagonsPlanned || 0}</td>
              <td><strong>${d.totalWagonsRealised || 0}</strong></td>
              <td>${(d.totalAnfo || 0).toFixed(0)}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>

      <div class="footer">
        Document confidentiel — HYDROMINES | SMI Imiter |
        Système HydroMines Production Platform |
        Généré automatiquement — ${new Date().toISOString()}
      </div>
    </body></html>`;

    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => win.print(), 500);
    }
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin w-8 h-8 border-4 border-[#1a5276] border-t-transparent rounded-full" />
        <span className="ml-3 text-[11px] font-black uppercase text-slate-400 tracking-widest">Chargement des données analytiques...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 rounded-2xl shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight">📊 Analytique SMI Imiter</h1>
            <span className="bg-[#ffd700] text-slate-950 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md shadow-xs animate-pulse">
              GOD LEVEL ANALYTICS
            </span>
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tableaux de bord opérationnels et réglementaires</p>
        </div>

        <div className="flex items-center gap-1.5 bg-slate-950/50 p-1 rounded-xl border border-slate-700/30">
          {(['7j', '30j', '90j'] as const).map((period) => (
            <button
              key={period}
              type="button"
              onClick={() => setFilterPeriod(period)}
              className={`px-3.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                filterPeriod === period
                  ? 'bg-[#1a5276] text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {period}
            </button>
          ))}
        </div>
      </div>

      <div className="border-b border-slate-200">
        <nav className="flex flex-wrap -mb-px gap-2">
          {([
            { id: 'direction', label: '🎯 Vue Directeur' },
            { id: 'personnel', label: '👷 Personnel' },
            { id: 'secteurs', label: '🗺️ Secteurs' },
            { id: 'equipements', label: '🚛 Équipements' },
            { id: 'explosifs', label: '💥 Explosifs' }
          ] as const).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`pb-3 px-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                activeTab === tab.id
                  ? 'border-[#ffd700] text-slate-900 font-black'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      <div className="min-h-[300px]">
        {activeTab === 'direction' ? (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-4 rounded-2xl border border-gray-150 shadow-sm">
              <div>
                <h2 className="text-xs font-black uppercase tracking-widest text-slate-400">Vue d'ensemble de la performance</h2>
              </div>
              <button
                onClick={generateDirectionReport}
                className="px-4 py-2 bg-[#ffd700] text-[#0f172a] text-[10px] font-black
                  uppercase rounded-xl hover:bg-yellow-400 transition-colors shadow-md
                  tracking-wider"
              >
                📄 Exporter Rapport Direction
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {kpiCards.map((card, idx) => (
                <div key={idx} className={`bg-white p-5 border-l-4 ${card.color} rounded-2xl shadow-sm space-y-2`}>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{card.icon}</span>
                  </div>
                  <div className="space-y-0.5">
                    <p className="text-3xl font-black tracking-tight text-slate-900">{card.value}</p>
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">{card.label}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
                  📈 Évolution Métrage & Wagons — {filterPeriod.toUpperCase()}
                </h3>
              </div>
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <XAxis 
                      dataKey="formattedDate" 
                      tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }}
                      axisLine={{ stroke: '#cbd5e1' }}
                      tickLine={false}
                    />
                    <YAxis 
                      yAxisId="gauche" 
                      orientation="left" 
                      stroke="#1a5276"
                      tick={{ fill: '#1a5276', fontSize: 10, fontWeight: 'bold' }}
                      axisLine={{ stroke: '#1a5276' }}
                      tickLine={false}
                      domain={[0, Math.ceil(maxMeterage * 1.2)]}
                    />
                    <YAxis 
                      yAxisId="droite" 
                      orientation="right" 
                      stroke="#ffd700"
                      tick={{ fill: '#b59400', fontSize: 10, fontWeight: 'bold' }}
                      axisLine={{ stroke: '#ffd700' }}
                      tickLine={false}
                      domain={[0, Math.ceil(maxWagons * 1.2)]}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px' }}
                      labelStyle={{ fontWeight: 'black', color: '#1e293b', fontSize: '11px' }}
                      itemStyle={{ fontWeight: 'bold', fontSize: '11px' }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36} 
                      wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}
                    />
                    <Bar 
                      yAxisId="gauche" 
                      dataKey="totalMeteragePlanned" 
                      name="Métrage Prévu (m)" 
                      fill="#e2e8f0" 
                      radius={[4, 4, 0, 0]}
                    />
                    <Bar 
                      yAxisId="gauche" 
                      dataKey="totalMeterageRealised" 
                      name="Métrage Réalisé (m)" 
                      fill="#1a5276" 
                      radius={[4, 4, 0, 0]}
                    />
                    <Line 
                      yAxisId="droite" 
                      type="monotone" 
                      dataKey="totalWagonsRealised" 
                      name="Wagons Réalisés" 
                      stroke="#ffd700" 
                      strokeWidth={2}
                      dot={{ r: 2 }}
                    />
                    <Line 
                      yAxisId="droite" 
                      type="monotone" 
                      dataKey="totalWagonsPlanned" 
                      name="Wagons Prévus" 
                      stroke="#94a3b8" 
                      strokeDasharray="4 2"
                      dot={false}
                    />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
                🎯 Projection Fin de Mois
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className={`bg-white p-5 border-l-4 ${projectedMonthMeterage >= objectifMensuel ? 'border-l-emerald-500' : 'border-l-amber-500'} rounded-2xl shadow-sm space-y-2`}>
                  <div className="space-y-0.5">
                    <p className="text-3xl font-black tracking-tight text-slate-900">{projectedMonthMeterage.toFixed(0)} m</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Projection fin {currentMonth}</p>
                  </div>
                  <div className="pt-2 border-t border-slate-100 space-y-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <p>Moyenne journalière : {avgDailyMeterage.toFixed(1)} m/jour</p>
                    <p>{daysRemaining} jours restants dans le mois</p>
                  </div>
                </div>

                <div className={`bg-white p-5 border-l-4 ${projectedMonthWagons >= projectedWagonsThreshold ? 'border-l-emerald-500' : 'border-l-amber-500'} rounded-2xl shadow-sm space-y-2`}>
                  <div className="space-y-0.5">
                    <p className="text-3xl font-black tracking-tight text-slate-900">{projectedMonthWagons.toFixed(0)} wagons</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase">Projection fin {currentMonth}</p>
                  </div>
                  <div className="pt-2 border-t border-slate-100 space-y-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <p>Moyenne journalière : {avgDailyWagons.toFixed(1)} wagons/jour</p>
                    <p>{daysRemaining} jours restants dans le mois</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
                🚨 Alertes Opérationnelles
              </h3>
              {alerts.length === 0 ? (
                <div className="text-emerald-600 font-black text-[11px] uppercase py-2">
                  ✅ Tous les indicateurs sont nominaux
                </div>
              ) : (
                <div className="space-y-2.5">
                  {alerts.map((alert, idx) => (
                    <div 
                      key={idx} 
                      className={`flex items-center justify-between p-3.5 rounded-xl border ${
                        alert.type === 'ROUGE' 
                          ? 'bg-rose-50 border-rose-500 text-rose-800' 
                          : 'bg-amber-50 border-amber-400 text-amber-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold leading-tight">{alert.text}</span>
                      </div>
                      <span 
                        className={`text-[9px] px-2 py-0.5 rounded font-black uppercase tracking-wider ${
                          alert.type === 'ROUGE' 
                            ? 'bg-rose-100 text-rose-800' 
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {alert.badge}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : activeTab === 'personnel' ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {sortedMiners.slice(0, 3).map((miner, idx) => {
                const isFirst = idx === 0;
                const isSecond = idx === 1;
                const isThird = idx === 2;
                const borderClass = isFirst 
                  ? 'border-[#ffd700] shadow-lg md:scale-105 z-10' 
                  : isSecond 
                    ? 'border-slate-300 shadow-sm' 
                    : 'border-amber-600 shadow-sm';
                const medal = isFirst ? '🥇' : isSecond ? '🥈' : '🥉';
                const rankText = isFirst ? '1er' : isSecond ? '2ème' : '3ème';

                return (
                  <div key={miner.matricule} className={`bg-white border-2 ${borderClass} rounded-2xl p-6 flex flex-col items-center text-center space-y-3 relative`}>
                    <div className="absolute top-3 left-3 bg-slate-950 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      {medal} {rankText}
                    </div>
                    <div className="pt-4 space-y-1">
                      <h4 className="font-black uppercase text-sm text-slate-900 tracking-tight">{miner.name}</h4>
                      <p className="text-[10px] font-bold text-slate-400 font-mono">MATRICULE: {miner.matricule}</p>
                    </div>
                    <div className="space-y-0.5">
                      <p className="text-3xl font-black text-slate-900">{miner.avgYield.toFixed(2)} <span className="text-xs font-bold text-slate-500 uppercase">m/v</span></p>
                      <p className="text-[10px] font-black uppercase tracking-wider text-slate-500">{miner.totalMeterage.toFixed(0)} m forés ({miner.totalRounds} volées)</p>
                    </div>
                    <div className="pt-1">
                      {miner.trend === 'up' ? (
                        <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[9px] font-black uppercase">↗️ PROGRESSION</span>
                      ) : miner.trend === 'down' ? (
                        <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded text-[9px] font-black uppercase animate-pulse">↘️ DÉCROCHAGE</span>
                      ) : (
                        <span className="bg-slate-50 text-slate-600 border border-slate-200 px-2 py-0.5 rounded text-[9px] font-black uppercase">→ STABLE</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-[#0f172a] text-white text-[10px] font-black uppercase tracking-wider">
                    <tr>
                      <th className="p-3 text-center border-r border-slate-700/50">#</th>
                      <th className="p-3 border-r border-slate-700/50">Mineur</th>
                      <th className="p-3 border-r border-slate-700/50 text-center">Matricule</th>
                      <th className="p-3 border-r border-slate-700/50 text-center">Moy. m/v</th>
                      <th className="p-3 border-r border-slate-700/50 text-center">Métrage Total</th>
                      <th className="p-3 border-r border-slate-700/50 text-center">Volées</th>
                      <th className="p-3 border-r border-slate-700/50 text-center">ANFO Total (kg)</th>
                      <th className="p-3 border-r border-slate-700/50 text-center">Tendance</th>
                      <th className="p-3 text-center">KPI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-xs">
                    {sortedMiners.map((miner, idx) => {
                      let kpiBadge = null;
                      if (miner.avgYield >= kpiGood) {
                        kpiBadge = <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded text-[9px] font-black uppercase">PERFORMANT</span>;
                      } else if (miner.avgYield <= kpiLow) {
                        kpiBadge = <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded text-[9px] font-black uppercase">SOUS-KPI</span>;
                      } else {
                        kpiBadge = <span className="bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded text-[9px] font-black uppercase">MOYEN</span>;
                      }

                      let trendCell = <span className="text-slate-400 font-bold">→</span>;
                      if (miner.trend === 'up') {
                        const percent = miner.avgYield > 0 ? Math.abs(((miner.last3DaysYield - miner.avgYield) / miner.avgYield) * 100).toFixed(0) : '0';
                        trendCell = <span className="text-emerald-600 font-black">↗️ +{percent}%</span>;
                      } else if (miner.trend === 'down') {
                        const percent = miner.avgYield > 0 ? Math.abs(((miner.last3DaysYield - miner.avgYield) / miner.avgYield) * 100).toFixed(0) : '0';
                        trendCell = <span className="text-rose-600 font-black animate-pulse">↘️ -{percent}%</span>;
                      }

                      return (
                        <tr key={miner.matricule} className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 text-center font-bold text-slate-400 border-r border-gray-100">{idx + 1}</td>
                          <td className="p-3 font-bold text-slate-800 border-r border-gray-100 uppercase">{miner.name}</td>
                          <td className="p-3 text-center font-mono text-slate-500 border-r border-gray-100">{miner.matricule}</td>
                          <td className="p-3 text-center font-black text-slate-900 border-r border-gray-100">{miner.avgYield.toFixed(2)}</td>
                          <td className="p-3 text-center font-mono text-slate-600 font-bold border-r border-gray-100">{miner.totalMeterage.toFixed(1)} m</td>
                          <td className="p-3 text-center font-mono text-slate-600 border-r border-gray-100">{miner.totalRounds}</td>
                          <td className="p-3 text-center font-mono text-slate-600 border-r border-gray-100">{miner.totalAnfo.toFixed(0)}</td>
                          <td className="p-3 text-center font-bold border-r border-gray-100">{trendCell}</td>
                          <td className="p-3 text-center">{kpiBadge}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {downMiners.length > 0 && (
              <div className="bg-rose-50 border border-rose-200 rounded-2xl p-5 space-y-3">
                <h4 className="text-rose-800 text-xs font-black uppercase tracking-wider flex items-center gap-2">
                  ⚠️ Mineurs en décrochage
                </h4>
                <div className="space-y-2">
                  {downMiners.map(miner => {
                    const diffPercent = miner.avgYield > 0 
                      ? Math.abs(((miner.last3DaysYield - miner.avgYield) / miner.avgYield) * 100).toFixed(0) 
                      : '0';
                    return (
                      <div key={miner.matricule} className="flex flex-col sm:flex-row sm:items-center justify-between p-3 bg-white border border-rose-100 rounded-xl text-rose-950 font-bold text-xs gap-2">
                        <div>
                          <span className="uppercase font-black text-rose-900">{miner.name}</span> (Matricule: <span className="font-mono">{miner.matricule}</span>)
                        </div>
                        <div className="text-right font-bold text-[11px]">
                          Rendement récent : <span className="text-rose-600 font-black">{miner.last3DaysYield.toFixed(2)} m/v</span> (baisse de <span className="text-rose-600 font-black animate-pulse">-{diffPercent}%</span> vs moyenne de <span className="font-black text-slate-700">{miner.avgYield.toFixed(2)} m/v</span>)
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : activeTab === 'secteurs' ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(Object.values(sectorStatsCalculated) as SectorStats[]).map(sector => {
                const isBest = sector.name === bestSectorName;
                const tr = sector.tauxRealisation;
                let cardBg = 'bg-rose-50 border-rose-500 text-rose-950';
                if (tr >= 95) {
                  cardBg = 'bg-emerald-50 border-emerald-500 text-emerald-950';
                } else if (tr >= 80) {
                  cardBg = 'bg-amber-50 border-amber-400 text-amber-950';
                }

                let secColor = '#1a5276';
                if (sector.name === 'Imiter 2') secColor = '#16a34a';
                if (sector.name === 'Imiter Est') secColor = '#d97706';

                return (
                  <div key={sector.name} className={`relative border-2 ${cardBg} rounded-2xl p-6 flex flex-col space-y-4 shadow-sm`}>
                    {isBest && (
                      <span className="absolute top-3 right-3 bg-[#ffd700] text-slate-950 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded shadow-xs">
                        ⭐ MEILLEUR SECTEUR
                      </span>
                    )}
                    <div className="space-y-1">
                      <h4 className="font-black uppercase text-xs tracking-wider text-slate-500">{sector.name}</h4>
                      <p className="text-3xl font-black">{tr.toFixed(1)}%</p>
                    </div>
                    <div className="w-full bg-gray-200/50 h-2 rounded-full overflow-hidden">
                      <div className="h-full" style={{ width: `${Math.min(tr, 100)}%`, backgroundColor: secColor }} />
                    </div>
                    <div className="space-y-1.5 text-xs font-bold text-slate-700">
                      <div className="flex items-center gap-2">
                        <span>⛏️</span>
                        <span>{sector.totalMeterage.toFixed(0)} m forés</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>🔄</span>
                        <span>{sector.totalRounds} volées</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>💥</span>
                        <span>{sector.totalAnfo.toFixed(0)} kg ANFO</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span>🏗️</span>
                        <span>{sector.chantiers.size} galeries actives</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
                📊 Performance de Production par Poste (moyens)
              </h3>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 h-[260px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={postStatsCalculated} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <XAxis 
                        dataKey="name" 
                        tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }}
                        axisLine={{ stroke: '#cbd5e1' }}
                        tickLine={false}
                      />
                      <YAxis 
                        tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }}
                        axisLine={{ stroke: '#cbd5e1' }}
                        tickLine={false}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px' }}
                        labelStyle={{ fontWeight: 'black', color: '#1e293b', fontSize: '11px' }}
                        itemStyle={{ fontWeight: 'bold', fontSize: '11px' }}
                      />
                      <Legend 
                        verticalAlign="bottom" 
                        height={36} 
                        wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}
                      />
                      <Bar dataKey="avgMeterage" name="Métrage Moyen (m)">
                        {postStatsCalculated.map((entry, idx) => {
                          const colors = ['#1a5276', '#ffd700', '#16a34a'];
                          return <Cell key={`cell-m-${idx}`} fill={colors[idx]} />;
                        })}
                      </Bar>
                      <Bar dataKey="avgWagons" name="Wagons Moyens">
                        {postStatsCalculated.map((entry, idx) => {
                          const colors = ['#1a5276', '#ffd700', '#16a34a'];
                          return <Cell key={`cell-w-${idx}`} fill={colors[idx]} fillOpacity={0.6} />;
                        })}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col justify-center">
                  <div className="border border-gray-150 rounded-2xl overflow-hidden">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-[#0f172a] text-white text-[9px] font-black uppercase tracking-wider">
                        <tr>
                          <th className="p-2 border-r border-slate-700/50">Poste</th>
                          <th className="p-2 border-r border-slate-700/50 text-center">Moy. m</th>
                          <th className="p-2 border-r border-slate-700/50 text-center">Moy. Wagons</th>
                          <th className="p-2 text-center">Meilleur jour</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-[11px]">
                        {postStatsCalculated.map((post) => (
                          <tr key={post.name} className="hover:bg-slate-50 transition-colors">
                            <td className="p-2 font-black text-slate-800 border-r border-gray-100 uppercase">{post.name}</td>
                            <td className="p-2 text-center font-bold text-slate-900 border-r border-gray-100">{post.avgMeterage.toFixed(1)} m</td>
                            <td className="p-2 text-center font-bold text-slate-900 border-r border-gray-100">{post.avgWagons.toFixed(1)} u</td>
                            <td className="p-2 text-center font-mono text-slate-500 font-bold">
                              {post.maxDate ? `${post.maxDate.slice(8, 10)}/${post.maxDate.slice(5, 7)}` : '--'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
                🚀 Avancement Cumulé par Galerie (Top 10)
              </h3>
              <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-[#0f172a] text-white text-[10px] font-black uppercase tracking-wider">
                      <tr>
                        <th className="p-3 text-center border-r border-slate-700/50">Rang</th>
                        <th className="p-3 border-r border-slate-700/50">Galerie</th>
                        <th className="p-3 border-r border-slate-700/50">Secteur</th>
                        <th className="p-3 border-r border-slate-700/50 text-center">Mètres Cumulés</th>
                        <th className="p-3 border-r border-slate-700/50 text-center">Volées</th>
                        <th className="p-3 text-center">Progression</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 text-xs">
                      {chantierStats.map((item, idx) => {
                        const maxVal = Math.max(...chantierStats.map(c => c.totalMeterage), 1);
                        const pct = (item.totalMeterage / maxVal) * 100;
                        
                        let barColor = 'bg-[#1a5276]';
                        if (item.sector === 'Imiter 2') barColor = 'bg-[#16a34a]';
                        if (item.sector === 'Imiter Est') barColor = 'bg-[#d97706]';

                        return (
                          <tr key={item.chantierId} className="hover:bg-slate-50 transition-colors">
                            <td className="p-3 text-center font-bold text-slate-400 border-r border-gray-100">{idx + 1}</td>
                            <td className="p-3 font-bold text-slate-800 border-r border-gray-100 uppercase">{item.chantierId}</td>
                            <td className="p-3 font-bold text-slate-600 border-r border-gray-100">{item.sector}</td>
                            <td className="p-3 text-center font-black text-slate-900 border-r border-gray-100">{item.totalMeterage.toFixed(1)} m</td>
                            <td className="p-3 text-center font-mono text-slate-600 border-r border-gray-100">{item.totalRounds}</td>
                            <td className="p-3">
                              <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden max-w-xs mx-auto">
                                <div 
                                  className={`h-full ${barColor}`} 
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        ) : activeTab === 'equipements' ? (() => {
          const engineStats: Record<string, {
            code: string;
            totalVolume: number;
            totalTrips: number;
            maintenanceHours: number;
            activeDays: number;
            avgVolumePerDay: number;
            availabilityRate: number;
          }> = {};

          filteredProduction.forEach(doc => {
            const docId = doc.id;
            const postes = doc.postes || {};
            const enginesSeenToday = new Set<string>();

            ['poste1', 'poste2', 'poste3'].forEach(pKey => {
              const pData = postes[pKey] || {};
              const deblayage = pData.deblayage || [];
              const maintenance = pData.maintenance || [];

              deblayage.forEach((r: any) => {
                const row = r.reel || r;
                if (!row) return;
                const key = row.engineCode || row.engineId || 'Inconnu';
                if (!engineStats[key]) {
                  engineStats[key] = {
                    code: key,
                    totalVolume: 0,
                    totalTrips: 0,
                    maintenanceHours: 0,
                    activeDays: 0,
                    avgVolumePerDay: 0,
                    availabilityRate: 100
                  };
                }
                engineStats[key].totalVolume += Number(row.volumeDeblaye || 0);
                engineStats[key].totalTrips += Number(row.tripCount || 0);
                if (!enginesSeenToday.has(key)) {
                  enginesSeenToday.add(key);
                  engineStats[key].activeDays++;
                }
              });

              maintenance.forEach((r: any) => {
                const row = r.reel || r;
                if (!row) return;
                const key = row.engineCode || row.engineId || 'Inconnu';
                if (!engineStats[key]) {
                  engineStats[key] = {
                    code: key,
                    totalVolume: 0,
                    totalTrips: 0,
                    maintenanceHours: 0,
                    activeDays: 0,
                    avgVolumePerDay: 0,
                    availabilityRate: 100
                  };
                }
                engineStats[key].maintenanceHours += Number(row.duration || 0);
              });
            });
          });

          const totalDays = filteredHistory.length || 1;
          Object.values(engineStats).forEach(e => {
            e.avgVolumePerDay = e.totalVolume / totalDays;
            const totalHoursAvailable = totalDays * 24;
            e.availabilityRate = totalHoursAvailable > 0
              ? Math.max(0, (totalHoursAvailable - e.maintenanceHours) / totalHoursAvailable * 100)
              : 100;
          });

          let bestEngineCode = '';
          let maxVolume = -1;
          Object.values(engineStats).forEach(e => {
            if (e.totalVolume > maxVolume && e.totalVolume > 0) {
              maxVolume = e.totalVolume;
              bestEngineCode = e.code;
            }
          });

          const sortedDates = [...filteredHistory].sort((a, b) => a.date.localeCompare(b.date));
          const chartData = sortedDates.map(h => {
            const prodDoc = filteredProduction.find(d => d.id === h.date);
            const dataPoint: Record<string, any> = {
              date: h.date,
              formattedDate: `${h.date.slice(8, 10)}/${h.date.slice(5, 7)}`
            };

            Object.keys(engineStats).forEach(code => {
              dataPoint[code] = 0;
            });

            if (prodDoc) {
              const postes = prodDoc.postes || {};
              ['poste1', 'poste2', 'poste3'].forEach(pKey => {
                const deblayage = postes[pKey]?.deblayage || [];
                deblayage.forEach((r: any) => {
                  const row = r.reel || r;
                  if (!row) return;
                  const key = row.engineCode || row.engineId || 'Inconnu';
                  dataPoint[key] = (dataPoint[key] || 0) + Number(row.volumeDeblaye || 0);
                });
              });
            }

            return dataPoint;
          });

          const avgDailyWagons = filteredHistory.length > 0
            ? filteredHistory.reduce((s, d) => s + (d.totalWagonsRealised || 0), 0) / filteredHistory.length
            : 0;

          const correlations: Array<{
            date: string;
            formattedDate: string;
            engineCode: string;
            duration: number;
            dayWagons: number;
            wagonsLost: number;
          }> = [];

          filteredProduction.forEach(doc => {
            const docId = doc.id;
            const postes = doc.postes || {};
            const dayEngineMaintenance: Record<string, number> = {};

            ['poste1', 'poste2', 'poste3'].forEach(pKey => {
              const maintenance = postes[pKey]?.maintenance || [];
              maintenance.forEach((r: any) => {
                const row = r.reel || r;
                if (!row) return;
                const key = row.engineCode || row.engineId || 'Inconnu';
                dayEngineMaintenance[key] = (dayEngineMaintenance[key] || 0) + Number(row.duration || 0);
              });
            });

            const histDay = filteredHistory.find(h => h.date === docId);
            const dayWagons = histDay?.totalWagonsRealised || 0;

            Object.entries(dayEngineMaintenance).forEach(([engineCode, duration]) => {
              if (duration > 4) {
                const wagonsLost = Math.max(0, avgDailyWagons - dayWagons);
                correlations.push({
                  date: docId,
                  formattedDate: `${docId.slice(8, 10)}/${docId.slice(5, 7)}`,
                  engineCode,
                  duration,
                  dayWagons,
                  wagonsLost
                });
              }
            });
          });

          correlations.sort((a, b) => b.date.localeCompare(a.date));
          const totalWagonsLost = correlations.reduce((sum, item) => sum + item.wagonsLost, 0);

          const engineColors = ['#1a5276', '#16a34a', '#d97706', '#9333ea', '#ec4899', '#06b6d4', '#f43f5e', '#14b8a6'];

          return (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.values(engineStats).map(engine => {
                  const isBest = engine.code === bestEngineCode;
                  const ar = engine.availabilityRate;
                  let cardBg = 'bg-rose-50 border-rose-500 text-rose-950';
                  if (ar >= 90) {
                    cardBg = 'bg-emerald-50 border-emerald-500 text-emerald-950';
                  } else if (ar >= 75) {
                    cardBg = 'bg-amber-50 border-amber-400 text-amber-950';
                  }

                  let progressColor = '#ef4444';
                  if (ar >= 90) progressColor = '#10b981';
                  else if (ar >= 75) progressColor = '#f59e0b';

                  return (
                    <div key={engine.code} className={`relative border-2 ${cardBg} rounded-2xl p-6 flex flex-col space-y-4 shadow-sm`}>
                      {isBest && (
                        <span className="absolute top-3 right-3 bg-[#ffd700] text-slate-950 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded shadow-xs">
                          🏆 MEILLEUR LHD
                        </span>
                      )}
                      <div className="space-y-1">
                        <h4 className="font-black uppercase text-xs tracking-wider text-slate-500">{engine.code}</h4>
                        <p className="text-3xl font-black">{ar.toFixed(1)}%</p>
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Disponibilité</p>
                      </div>
                      <div className="w-full bg-gray-200/50 h-2 rounded-full overflow-hidden">
                        <div className="h-full" style={{ width: `${Math.min(ar, 100)}%`, backgroundColor: progressColor }} />
                      </div>
                      <div className="space-y-1.5 text-xs font-bold text-slate-700">
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5">🪨 Vol. total :</span>
                          <span>{engine.totalVolume.toFixed(0)} m³</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5">📈 Vol. moyen/jour :</span>
                          <span>{engine.avgVolumePerDay.toFixed(1)} m³</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5">🔄 Trajets totaux :</span>
                          <span>{engine.totalTrips}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-1.5">🛠️ Maintenance :</span>
                          <span>{engine.maintenanceHours.toFixed(1)} h</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
                  📈 Évolution du Volume Journalier par Moteur (m³)
                </h3>
                <div className="h-[240px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <XAxis 
                        dataKey="formattedDate" 
                        tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }}
                        axisLine={{ stroke: '#cbd5e1' }}
                        tickLine={false}
                      />
                      <YAxis 
                        tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }}
                        axisLine={{ stroke: '#cbd5e1' }}
                        tickLine={false}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px' }}
                        labelStyle={{ fontWeight: 'black', color: '#1e293b', fontSize: '11px' }}
                        itemStyle={{ fontWeight: 'bold', fontSize: '11px' }}
                      />
                      <Legend 
                        verticalAlign="bottom" 
                        height={36} 
                        wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}
                      />
                      {Object.keys(engineStats).map((code, idx) => {
                        const color = engineColors[idx % engineColors.length];
                        return (
                          <Line
                            key={code}
                            type="monotone"
                            dataKey={code}
                            name={code}
                            stroke={color}
                            strokeWidth={3}
                            dot={{ r: 4, strokeWidth: 1 }}
                            activeDot={{ r: 6 }}
                          />
                        );
                      })}
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
                  ⚠️ Corrélation Maintenance → Wagons Perdus
                </h3>
                {correlations.length === 0 ? (
                  <div className="p-6 text-center text-xs font-bold text-slate-500 bg-white border border-gray-150 rounded-2xl">
                    ✅ Aucune maintenance prolongée détectée sur la période
                  </div>
                ) : (
                  <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead className="bg-[#0f172a] text-white text-[10px] font-black uppercase tracking-wider">
                          <tr>
                            <th className="p-3 border-r border-slate-700/50">Date</th>
                            <th className="p-3 border-r border-slate-700/50">Moteur</th>
                            <th className="p-3 border-r border-slate-700/50 text-center">Durée maintenance</th>
                            <th className="p-3 border-r border-slate-700/50 text-center">Wagons ce jour</th>
                            <th className="p-3 text-center">Wagons perdus (estimé)</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-xs">
                          {correlations.map((item, idx) => (
                            <tr key={`${item.date}-${item.engineCode}-${idx}`} className="hover:bg-slate-50 transition-colors">
                              <td className="p-3 font-bold text-slate-600 border-r border-gray-100">{item.formattedDate}</td>
                              <td className="p-3 font-bold text-slate-800 border-r border-gray-100 uppercase">{item.engineCode}</td>
                              <td className="p-3 text-center font-mono text-slate-600 border-r border-gray-100">{item.duration.toFixed(1)} h</td>
                              <td className="p-3 text-center font-black text-slate-900 border-r border-gray-100">{item.dayWagons} u</td>
                              <td className="p-3 text-center font-black text-rose-600 font-mono">-{item.wagonsLost.toFixed(1)} u</td>
                            </tr>
                          ))}
                          <tr className="bg-slate-50 font-black">
                            <td colSpan={4} className="p-3 text-right text-slate-700 border-r border-gray-200 text-xs uppercase">
                              Total wagons perdus estimé sur la période :
                            </td>
                            <td className="p-3 text-center text-rose-600 text-sm font-black font-mono">
                              -{totalWagonsLost.toFixed(1)} u
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
                    ⚙️ OEE Minier (Overall Equipment Effectiveness)
                  </h3>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">
                    Référence industrie minière : OEE ≥ 65% = performant
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.values(engineStats).map(engine => {
                    const availability = engine.availabilityRate / 100;
                    const actualVol = engine.avgVolumePerDay;
                    const theoreticalMaxVol = actualVol * 1.15;
                    const performance = theoreticalMaxVol > 0 ? actualVol / theoreticalMaxVol : 0;
                    const quality = 0.95;
                    const oee = availability * performance * quality * 100;

                    let oeeBg = 'bg-rose-50 border-rose-500 text-rose-950';
                    let oeeLabel = 'À améliorer';
                    let oeeTextColor = 'text-rose-600';
                    if (oee >= 70) {
                      oeeBg = 'bg-emerald-50 border-emerald-500 text-emerald-950';
                      oeeLabel = 'World Class';
                      oeeTextColor = 'text-emerald-600';
                    } else if (oee >= 50) {
                      oeeBg = 'bg-amber-50 border-amber-400 text-amber-950';
                      oeeLabel = 'Acceptable';
                      oeeTextColor = 'text-amber-600';
                    }

                    return (
                      <div key={`oee-${engine.code}`} className={`border-2 ${oeeBg} rounded-2xl p-6 flex flex-col justify-between space-y-4 shadow-sm`}>
                        <div className="space-y-1">
                          <h4 className="font-black uppercase text-xs tracking-wider text-slate-500">{engine.code}</h4>
                          <p className={`text-4xl font-black ${oeeTextColor}`}>{oee.toFixed(1)}%</p>
                          <span className="inline-block text-[10px] font-black uppercase tracking-widest bg-white/60 px-2 py-0.5 rounded border border-current">
                            {oeeLabel}
                          </span>
                        </div>
                        <div className="space-y-1 text-[10px] font-bold text-slate-600">
                          <div className="flex justify-between">
                            <span>Disponibilité:</span>
                            <span>{(availability * 100).toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Performance:</span>
                            <span>{(performance * 100).toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Qualité (fixe):</span>
                            <span>95.0%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })() : activeTab === 'explosifs' ? (() => {
          const explosifStats = {
            totalAnfo: 0,
            totalTovex: 0,
            totalAmorces: 0,
            totalMeterage: 0,
            totalRounds: 0,
            estimatedMaxRounds: 0,
            byMiner: {} as Record<string, {
              code: string;
              name: string;
              anfo: number;
              tovex: number;
              amorces: number;
              meterage: number;
              rounds: number;
              ratioAnfoPerMeter: number;
              ratioAnfoPerRound: number;
              gallerySizes: Record<number, number>;
            }>,
            byGallerySize: {
              9: { anfo: 0, tovex: 0, rounds: 0, meterage: 0 },
              12: { anfo: 0, tovex: 0, rounds: 0, meterage: 0 }
            }
          };

          filteredProduction.forEach(doc => {
            const postes = doc.postes || {};
            ['poste1', 'poste2', 'poste3'].forEach(pKey => {
              const pData = postes[pKey] || {};
              const minage = pData.minage || [];

              minage.forEach((r: any) => {
                const row = r.reel || r;
                if (!row) return;

                explosifStats.totalAnfo += Number(row.anfo || 0);
                explosifStats.totalTovex += Number(row.tovex || 0);
                explosifStats.totalAmorces += Number(row.ammorces || 0);
                explosifStats.totalMeterage += Number(row.realMeterage || 0);
                explosifStats.totalRounds += Number(row.realRounds || 0);

                const stdHoles = Number(row.gallerySize) === 12 
                  ? (platformSettings?.explosifs_12m2_trous ?? 38) 
                  : (platformSettings?.explosifs_9m2_trous ?? 28);
                const holes = (row.plannedHoles && Number(row.plannedHoles) > 0) ? Number(row.plannedHoles) : stdHoles;
                explosifStats.estimatedMaxRounds += (holes / stdHoles);

                const key = (row.minerMatricule || 'Inconnu').trim().toUpperCase();
                if (!explosifStats.byMiner[key]) {
                  explosifStats.byMiner[key] = {
                    code: key,
                    name: employees.find(e => e.matricule?.toUpperCase() === key || e.id?.toUpperCase() === key)?.name || key,
                    anfo: 0,
                    tovex: 0,
                    amorces: 0,
                    meterage: 0,
                    rounds: 0,
                    ratioAnfoPerMeter: 0,
                    ratioAnfoPerRound: 0,
                    gallerySizes: { 9: 0, 12: 0 }
                  };
                }

                const miner = explosifStats.byMiner[key];
                miner.anfo += Number(row.anfo || 0);
                miner.tovex += Number(row.tovex || 0);
                miner.amorces += Number(row.ammorces || 0);
                miner.meterage += Number(row.realMeterage || 0);
                miner.rounds += Number(row.realRounds || 0);

                const gSize = Number(row.gallerySize);
                if (gSize === 9 || gSize === 12) {
                  miner.gallerySizes[gSize] = (miner.gallerySizes[gSize] || 0) + 1;
                  explosifStats.byGallerySize[gSize].anfo += Number(row.anfo || 0);
                  explosifStats.byGallerySize[gSize].tovex += Number(row.tovex || 0);
                  explosifStats.byGallerySize[gSize].rounds += Number(row.realRounds || 0);
                  explosifStats.byGallerySize[gSize].meterage += Number(row.realMeterage || 0);
                }
              });
            });
          });

          Object.values(explosifStats.byMiner).forEach(miner => {
            miner.ratioAnfoPerMeter = miner.meterage > 0 ? (miner.anfo / miner.meterage) : 0;
            miner.ratioAnfoPerRound = miner.rounds > 0 ? (miner.anfo / miner.rounds) : 0;
          });

          const globalRatioAnfoPerMeter = explosifStats.totalMeterage > 0
            ? explosifStats.totalAnfo / explosifStats.totalMeterage
            : 0;

          const sortedDates = [...filteredHistory].sort((a, b) => a.date.localeCompare(b.date));
          const chartData = sortedDates.map(h => {
            const prodDoc = filteredProduction.find(d => d.id === h.date);
            let dailyAnfo = 0;
            let dailyTovex = 0;
            let dailyMeterage = 0;

            if (prodDoc) {
              const postes = prodDoc.postes || {};
              ['poste1', 'poste2', 'poste3'].forEach(pKey => {
                const minage = postes[pKey]?.minage || [];
                minage.forEach((r: any) => {
                  const row = r.reel || r;
                  if (!row) return;
                  dailyAnfo += Number(row.anfo || 0);
                  dailyTovex += Number(row.tovex || 0);
                  dailyMeterage += Number(row.realMeterage || 0);
                });
              });
            }

            return {
              date: h.date,
              formattedDate: `${h.date.slice(8, 10)}/${h.date.slice(5, 7)}`,
              totalAnfo: dailyAnfo,
              totalTovex: dailyTovex,
              ratioAnfoPerMeter: dailyMeterage > 0 ? (dailyAnfo / dailyMeterage) : 0
            };
          });

          const engineStats: Record<string, {
            code: string;
            totalVolume: number;
            totalTrips: number;
            maintenanceHours: number;
            activeDays: number;
            avgVolumePerDay: number;
            availabilityRate: number;
          }> = {};

          filteredProduction.forEach(doc => {
            const postes = doc.postes || {};
            const enginesSeenToday = new Set<string>();

            ['poste1', 'poste2', 'poste3'].forEach(pKey => {
              const pData = postes[pKey] || {};
              const deblayage = pData.deblayage || [];
              const maintenance = pData.maintenance || [];

              deblayage.forEach((r: any) => {
                const row = r.reel || r;
                if (!row) return;
                const key = row.engineCode || row.engineId || 'Inconnu';
                if (!engineStats[key]) {
                  engineStats[key] = {
                    code: key,
                    totalVolume: 0,
                    totalTrips: 0,
                    maintenanceHours: 0,
                    activeDays: 0,
                    avgVolumePerDay: 0,
                    availabilityRate: 100
                  };
                }
                engineStats[key].totalVolume += Number(row.volumeDeblaye || 0);
                engineStats[key].totalTrips += Number(row.tripCount || 0);
                if (!enginesSeenToday.has(key)) {
                  enginesSeenToday.add(key);
                  engineStats[key].activeDays++;
                }
              });

              maintenance.forEach((r: any) => {
                const row = r.reel || r;
                if (!row) return;
                const key = row.engineCode || row.engineId || 'Inconnu';
                if (!engineStats[key]) {
                  engineStats[key] = {
                    code: key,
                    totalVolume: 0,
                    totalTrips: 0,
                    maintenanceHours: 0,
                    activeDays: 0,
                    avgVolumePerDay: 0,
                    availabilityRate: 100
                  };
                }
                engineStats[key].maintenanceHours += Number(row.duration || 0);
              });
            });
          });

          const totalDaysVal = filteredHistory.length || 1;
          Object.values(engineStats).forEach(e => {
            e.avgVolumePerDay = e.totalVolume / totalDaysVal;
            const totalHoursAvailable = totalDaysVal * 24;
            e.availabilityRate = totalHoursAvailable > 0
              ? Math.max(0, (totalHoursAvailable - e.maintenanceHours) / totalHoursAvailable * 100)
              : 100;
          });

          const enginesList = Object.values(engineStats);
          const avgAvailabilityRate = enginesList.length > 0
            ? enginesList.reduce((sum, e) => sum + e.availabilityRate, 0) / enginesList.length
            : 100;

          const globalEfficaciteTir = explosifStats.estimatedMaxRounds > 0
            ? (explosifStats.totalRounds / explosifStats.estimatedMaxRounds) * 100
            : 0;

          const globalMeterageRealisationRate = totalPlanned > 0
            ? (totalRealised / totalPlanned) * 100
            : 100;

          const radialData = [
            {
              name: 'Disponibilité LHD',
              value: Math.round(Math.min(100, Math.max(0, avgAvailabilityRate))),
              fill: avgAvailabilityRate >= 90 ? '#10b981' : avgAvailabilityRate >= 75 ? '#f59e0b' : '#ef4444'
            },
            {
              name: 'Réalisation Métrage',
              value: Math.round(Math.min(100, Math.max(0, globalMeterageRealisationRate))),
              fill: globalMeterageRealisationRate >= 95 ? '#10b981' : globalMeterageRealisationRate >= 80 ? '#f59e0b' : '#ef4444'
            },
            {
              name: 'Efficacité Tir',
              value: Math.round(Math.min(100, Math.max(0, globalEfficaciteTir))),
              fill: globalEfficaciteTir >= 90 ? '#10b981' : globalEfficaciteTir >= 75 ? '#f59e0b' : '#ef4444'
            }
          ];

          const sortedMinersList = Object.values(explosifStats.byMiner).sort((a, b) => b.ratioAnfoPerRound - a.ratioAnfoPerRound);

          return (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">ANFO Consommé</span>
                    <p className="text-3xl font-black mt-1 text-slate-900">{explosifStats.totalAnfo.toFixed(0)} kg</p>
                  </div>
                </div>
                <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Tovex Consommé</span>
                    <p className="text-3xl font-black mt-1 text-slate-900">{explosifStats.totalTovex.toFixed(2)} kg</p>
                  </div>
                </div>
                <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Amorces Utilisées</span>
                    <p className="text-3xl font-black mt-1 text-slate-900">{explosifStats.totalAmorces} u.</p>
                  </div>
                </div>
                <div className="bg-white border border-gray-150 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Ratio ANFO / Mètre</span>
                    <p className="text-3xl font-black mt-1 text-slate-900">{globalRatioAnfoPerMeter.toFixed(2)} kg/m</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Théorique galerie 9m²</span>
                    <p className="text-sm font-bold text-slate-800 mt-1">Sert de référence de calcul</p>
                  </div>
                  <span className="text-lg font-black text-slate-900 bg-white border border-slate-200 px-3 py-1 rounded-xl">
                    {platformSettings?.explosifs_9m2_anfo ?? 35} kg/volée
                  </span>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-500 tracking-wider">Théorique galerie 12m²</span>
                    <p className="text-sm font-bold text-slate-800 mt-1">Sert de référence de calcul</p>
                  </div>
                  <span className="text-lg font-black text-slate-900 bg-white border border-slate-200 px-3 py-1 rounded-xl">
                    {platformSettings?.explosifs_12m2_anfo ?? 40} kg/volée
                  </span>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
                  📈 Consommation d'Explosifs et Ratio Journalier
                </h3>
                <div className="h-[240px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <XAxis 
                        dataKey="formattedDate" 
                        tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }}
                        axisLine={{ stroke: '#cbd5e1' }}
                        tickLine={false}
                      />
                      <YAxis 
                        yAxisId="left"
                        tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }}
                        axisLine={{ stroke: '#cbd5e1' }}
                        tickLine={false}
                      />
                      <YAxis 
                        yAxisId="right"
                        orientation="right"
                        tick={{ fill: '#64748b', fontSize: 10, fontWeight: 'bold' }}
                        axisLine={{ stroke: '#cbd5e1' }}
                        tickLine={false}
                      />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px' }}
                        labelStyle={{ fontWeight: 'black', color: '#1e293b', fontSize: '11px' }}
                        itemStyle={{ fontWeight: 'bold', fontSize: '11px' }}
                      />
                      <Legend 
                        verticalAlign="bottom" 
                        height={36} 
                        wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', textTransform: 'uppercase' }}
                      />
                      <Bar 
                        yAxisId="left" 
                        dataKey="totalAnfo" 
                        name="ANFO (kg)" 
                        fill="#dc2626" 
                        radius={[4, 4, 0, 0]} 
                      />
                      <Bar 
                        yAxisId="left" 
                        dataKey="totalTovex" 
                        name="Tovex (kg)" 
                        fill="#ea580c" 
                        radius={[4, 4, 0, 0]} 
                      />
                      <Line 
                        yAxisId="right" 
                        type="monotone" 
                        dataKey="ratioAnfoPerMeter" 
                        name="Ratio ANFO/m (kg/m)" 
                        stroke="#ffd700" 
                        strokeWidth={3} 
                        dot={{ r: 4 }} 
                      />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">
                  👷 Ratios de Consommation par Mineur
                </h3>
                <div className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead className="bg-[#0f172a] text-white text-[10px] font-black uppercase tracking-wider">
                        <tr>
                          <th className="p-3 border-r border-slate-700/50 text-center w-12">#</th>
                          <th className="p-3 border-r border-slate-700/50">Mineur</th>
                          <th className="p-3 border-r border-slate-700/50 text-center">ANFO total</th>
                          <th className="p-3 border-r border-slate-700/50 text-center">ANFO / volée</th>
                          <th className="p-3 border-r border-slate-700/50 text-center">ANFO / mètre</th>
                          <th className="p-3 border-r border-slate-700/50 text-center">vs Théorique</th>
                          <th className="p-3 text-center">Alerte</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 text-xs font-bold">
                        {sortedMinersList.map((miner, idx) => {
                          const size9Count = miner.gallerySizes[9] || 0;
                          const size12Count = miner.gallerySizes[12] || 0;
                          const dominantSize = size12Count > size9Count ? 12 : 9;
                          const theoreticalAnfo = dominantSize === 12 
                            ? (platformSettings?.explosifs_12m2_anfo ?? 40) 
                            : (platformSettings?.explosifs_9m2_anfo ?? 35);
                          
                          const diffPct = theoreticalAnfo > 0 ? ((miner.ratioAnfoPerRound - theoreticalAnfo) / theoreticalAnfo) * 100 : 0;
                          const diffSign = diffPct >= 0 ? `+` : ``;
                          const diffColor = diffPct > 20 ? 'text-rose-600' : diffPct < -20 ? 'text-amber-600' : 'text-emerald-600';

                          let alertBadge = null;
                          if (miner.ratioAnfoPerRound > theoreticalAnfo * 1.20) {
                            alertBadge = (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 animate-pulse">
                                ⚠️ SURCONSO
                              </span>
                            );
                          } else if (miner.ratioAnfoPerRound < theoreticalAnfo * 0.80) {
                            alertBadge = (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800">
                                ⬇️ SOUS-CONSO
                              </span>
                            );
                          } else {
                            alertBadge = (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-800">
                                ✅ NOMINAL
                              </span>
                            );
                          }

                          return (
                            <tr key={miner.code} className="hover:bg-slate-50 transition-colors">
                              <td className="p-3 text-center text-slate-400 border-r border-gray-100">{idx + 1}</td>
                              <td className="p-3 border-r border-gray-100 text-slate-800 font-extrabold uppercase">{miner.name}</td>
                              <td className="p-3 text-center border-r border-gray-100 text-slate-700">{miner.anfo.toFixed(0)} kg</td>
                              <td className="p-3 text-center border-r border-gray-100 text-slate-900 font-black">{miner.ratioAnfoPerRound.toFixed(1)} kg/v</td>
                              <td className="p-3 text-center border-r border-gray-100 text-slate-700">{miner.ratioAnfoPerMeter.toFixed(1)} kg/m</td>
                              <td className={`p-3 text-center border-r border-gray-100 font-mono font-black ${diffColor}`}>
                                {diffSign}{diffPct.toFixed(1)}%
                              </td>
                              <td className="p-3 text-center">{alertBadge}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="space-y-4">
                  <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Efficacité opérationnelle</span>
                  <h3 className="text-3xl font-black text-slate-900">Efficacité de tir : {globalEfficaciteTir.toFixed(1)}%</h3>
                  <p className="text-xs font-semibold text-slate-500 leading-relaxed">
                    L'efficacité de tir compare le nombre de volées réellement tirées par rapport à la perforation planifiée (trous forés). Un taux proche de 100% indique une parfaite exécution du plan de tir.
                  </p>
                  <div className="pt-2 text-xs font-bold text-slate-700 space-y-2">
                    <p>🎯 Sur <span className="font-extrabold text-slate-900">{explosifStats.totalRounds}</span> volées réalisées — <span className="font-extrabold text-slate-900">{explosifStats.totalMeterage.toFixed(0)}</span> mètres</p>
                    <p>Consommation totale : ANFO <span className="font-extrabold text-slate-900">{explosifStats.totalAnfo.toFixed(0)}</span> kg | Tovex <span className="font-extrabold text-slate-900">{explosifStats.totalTovex.toFixed(2)}</span> kg | Amorces <span className="font-extrabold text-slate-900">{explosifStats.totalAmorces}</span> u.</p>
                  </div>
                </div>
                <div className="h-[240px] w-full flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart 
                      cx="50%" 
                      cy="50%" 
                      innerRadius="20%" 
                      outerRadius="90%" 
                      barSize={12} 
                      data={radialData}
                    >
                      <RadialBar
                        background
                        clockWise
                        dataKey="value"
                      />
                      <Legend 
                        iconSize={8} 
                        layout="vertical" 
                        verticalAlign="middle" 
                        align="right" 
                        wrapperStyle={{ fontSize: '10px', fontWeight: 'bold' }} 
                      />
                      <Tooltip />
                    </RadialBarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          );
        })() : null}
      </div>
    </div>
  );
};
