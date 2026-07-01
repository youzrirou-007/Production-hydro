import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import {
  collection, doc, query, where, orderBy, limit,
  onSnapshot, setDoc
} from 'firebase/firestore';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';

type DTTab = 'journal' | 'attachements' | 'explosifs' | 'rapport' | 'ia';

interface AttachementChantier {
  chantierId: string;
  chantierName: string;
  secteur: string;
  galleryType: '9' | '12';
  metrageGeometre: number;
}

interface Attachement {
  id?: string;
  siteId: string;
  mois: string;
  dateSaisie?: any;
  saisiPar?: string;
  saisiParNom?: string;
  valide: boolean;
  secteurs: Record<string, { metrageGeometre: number; nbChantiers: number }>;
  chantiers: AttachementChantier[];
  totalMetrageGeometre: number;
  totalMetrage9m2: number;
  totalMetrage12m2: number;
}

export const EspaceDT: React.FC = () => {
  const { profile } = useAuth();
  const [activeTab, setActiveTab] = useState<DTTab>('journal');

  const [selectedMois, setSelectedMois] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [currentAttachement, setCurrentAttachement] = useState<Attachement | null>(null);
  const [loadingAttachement, setLoadingAttachement] = useState(false);
  const [allChantiers, setAllChantiers] = useState<any[]>([]);
  const [saisieMode, setSaisieMode] = useState(false);
  const [saisieData, setSaisieData] = useState<AttachementChantier[]>([]);
  const [savingAttachement, setSavingAttachement] = useState(false);
  const [historiqueAttachements, setHistoriqueAttachements] = useState<Attachement[]>([]);
  const [allProductionDocs, setAllProductionDocs] = useState<any[]>([]);

  const [journalDate, setJournalDate] = useState<string>(() =>
    new Date().toISOString().split('T')[0]
  );
  const [journalProduction, setJournalProduction] = useState<any>(null);
  const [journalPlanning, setJournalPlanning] = useState<any>(null);
  const [loadingJournal, setLoadingJournal] = useState(false);
  const [journalExplications, setJournalExplications] = useState<any[]>([]);

  const [explosifsMonth, setExplosifsMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [explosifsHistory, setExplosifsHistory] = useState<any[]>([]);
  const [platformSettings, setPlatformSettings] = useState<any>({});

  const [rapportMonth, setRapportMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [rapportHistory, setRapportHistory] = useState<any[]>([]);
  const [rapportAttachement, setRapportAttachement] = useState<any>(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);

  const [dtQuestion, setDtQuestion] = useState('');
  const [dtResponse, setDtResponse] = useState<string | null>(null);
  const [loadingDT, setLoadingDT] = useState(false);
  const [dtError, setDtError] = useState<string | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<string | null>(null);

  const tabs: { id: DTTab; label: string; icon: string }[] = [
    { id: 'journal', label: 'Journal de la Mine', icon: '📋' },
    { id: 'attachements', label: 'Attachements & Fiabilité', icon: '📐' },
    { id: 'explosifs', label: 'Suivi Explosifs', icon: '💥' },
    { id: 'rapport', label: 'Rapport Mensuel', icon: '📄' },
    { id: 'ia', label: 'Assistant DT', icon: '🤖' },
  ];

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, 'chantiers'), where('siteId', '==', 'SMI')),
      (snap) => setAllChantiers(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    setLoadingAttachement(true);
    const docId = `SMI_${selectedMois}`;
    const unsub = onSnapshot(doc(db, 'attachements', docId), (snap) => {
      if (snap.exists()) {
        setCurrentAttachement({ id: snap.id, ...snap.data() } as Attachement);
      } else {
        setCurrentAttachement(null);
      }
      setLoadingAttachement(false);
    });
    return () => unsub();
  }, [selectedMois]);

  useEffect(() => {
    const q = query(collection(db, 'production'));
    const unsub = onSnapshot(q, (snap) => {
      setAllProductionDocs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(
      collection(db, 'attachements'),
      where('siteId', '==', 'SMI'),
      orderBy('mois', 'desc'),
      limit(6)
    );
    const unsub = onSnapshot(q, (snap) => {
      setHistoriqueAttachements(
        snap.docs.map(d => ({ id: d.id, ...d.data() } as Attachement))
      );
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    setLoadingJournal(true);
    const prodUnsub = onSnapshot(
      doc(db, 'production', journalDate),
      (snap) => {
        setJournalProduction(snap.exists() ? snap.data() : null);
        setLoadingJournal(false);
      }
    );
    const planUnsub = onSnapshot(
      doc(db, 'daily_planning_sheets', journalDate),
      (snap) => setJournalPlanning(snap.exists() ? snap.data() : null)
    );
    const explUnsub = onSnapshot(
      query(
        collection(db, 'non_realisation_explanations'),
        where('date', '==', journalDate)
      ),
      (snap) => setJournalExplications(
        snap.docs.map(d => ({ id: d.id, ...d.data() }))
      )
    );
    return () => { prodUnsub(); planUnsub(); explUnsub(); };
  }, [journalDate]);

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'platform_settings', 'config'),
      (snap) => { if (snap.exists()) setPlatformSettings(snap.data()); }
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(
      collection(db, 'production_history'),
      where('date', '>=', `${explosifsMonth}-01`),
      where('date', '<=', `${explosifsMonth}-31`),
      orderBy('date', 'asc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setExplosifsHistory(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [explosifsMonth]);

  useEffect(() => {
    const q = query(
      collection(db, 'production_history'),
      where('date', '>=', `${rapportMonth}-01`),
      where('date', '<=', `${rapportMonth}-31`),
      orderBy('date', 'asc')
    );
    const unsub = onSnapshot(q, (snap) => {
      setRapportHistory(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
    return () => unsub();
  }, [rapportMonth]);

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'attachements', `SMI_${rapportMonth}`),
      (snap) => setRapportAttachement(snap.exists() ? snap.data() : null)
    );
    return () => unsub();
  }, [rapportMonth]);

  const getMonthlyProductionByChantier = (mois: string): Record<string, number> => {
    const byChantier: Record<string, number> = {};
    allProductionDocs.forEach(d => {
      const dateStr = d.date || d.id;
      if (dateStr && dateStr.startsWith(mois)) {
        if (d.postes) {
          ['poste1', 'poste2', 'poste3'].forEach(pKey => {
            const minageRows = d.postes?.[pKey]?.minage || [];
            minageRows.forEach((row: any) => {
              const r = row.reel || row;
              const plan = row.plan || {};
              const chantierId = r.chantierId || row.chantierId || plan.chantierId;
              if (chantierId) {
                const meters = Number(r.realMeterage || 0);
                byChantier[chantierId] = (byChantier[chantierId] || 0) + meters;
              }
            });
          });
        }
      }
    });
    return byChantier;
  };

  const computeEcartPct = (metrageGeometre: number, metragePlateforme: number): number => {
    if (metrageGeometre === 0) return 0;
    return ((metragePlateforme - metrageGeometre) / metrageGeometre) * 105 - 5;
  };

  const computeEcartPctActual = (metrageGeometre: number, metragePlateforme: number): number => {
    if (metrageGeometre === 0) return 0;
    return ((metragePlateforme - metrageGeometre) / metrageGeometre) * 100;
  };

  const getFiabiliteLabel = (ecartPct: number): {
    label: string; color: string; bg: string; icon: string
  } => {
    const abs = Math.abs(ecartPct);
    if (abs <= 10) return {
      label: 'FIABLE', color: 'text-emerald-400',
      bg: 'bg-emerald-950/20 border-emerald-500/20', icon: '✅'
    };
    if (abs <= 25) return {
      label: 'ATTENTION', color: 'text-amber-400',
      bg: 'bg-amber-950/20 border-amber-500/20', icon: '⚠️'
    };
    return {
      label: 'ALERTE', color: 'text-rose-400',
      bg: 'bg-rose-950/20 border-rose-500/20', icon: '🚨'
    };
  };

  const isSuspectFraude = (ecartPct: number): boolean => ecartPct > 25;

  const changeJournalDate = (days: number) => {
    const d = new Date(journalDate);
    d.setDate(d.getDate() + days);
    setJournalDate(d.toISOString().split('T')[0]);
  };

  const getBilanJournal = () => {
    let totalPlan = 0;
    let totalReel = 0;
    let totalWagonsPlan = 0;
    let totalWagonsReel = 0;
    let totalAnfo = 0;

    ['poste1', 'poste2', 'poste3'].forEach(pKey => {
      const pData = journalProduction?.postes?.[pKey];
      const plData = journalPlanning?.postes?.[pKey];

      const minage = pData?.minage || [];
      minage.forEach((r: any) => {
        const row = r.reel || r;
        if (row) {
          totalReel += Number(row.realMeterage || row.meterage || 0);
          totalAnfo += Number(row.anfo || 0);
        }
      });

      const plMinage = plData?.minage || [];
      plMinage.forEach((r: any) => {
        totalPlan += Number(r.meterage || r.plannedMeterage || 0);
      });

      totalWagonsReel += Number(pData?.deblayageSummary?.totalWagons || pData?.deblayage?.reduce((s: number, r: any) => s + Number(r.reel?.tripCount || r.tripCount || 0), 0) || 0);
      totalWagonsPlan += Number(plData?.deblayageSummary?.totalWagons || plData?.deblayage?.reduce((s: number, r: any) => s + Number(r.tripCount || r.plannedTripCount || 0), 0) || 0);
    });

    const totalNonRealises = journalExplications.length;

    return {
      totalPlan,
      totalReel,
      totalWagonsPlan,
      totalWagonsReel,
      totalAnfo,
      totalNonRealises
    };
  };

  const getExplosifsStats = () => {
    let monthlyAnfo = 0;
    let monthlyTovex = 0;
    let monthlyAmorces = 0;
    let monthlyMeterage = 0;
    let monthlyRounds = 0;
    let monthlyTheorAnfo = 0;

    const theorAnfo9 = (platformSettings?.explosifs_9m2_anfo ?? 35);
    const theorAnfo12 = (platformSettings?.explosifs_12m2_anfo ?? 40);

    const monthlyProdDocs = allProductionDocs.filter(d => {
      const dateStr = d.date || d.id;
      return dateStr && dateStr.startsWith(explosifsMonth);
    });

    monthlyProdDocs.forEach(d => {
      if (d.postes) {
        ['poste1', 'poste2', 'poste3'].forEach(pKey => {
          const minageRows = d.postes?.[pKey]?.minage || [];
          minageRows.forEach((r: any) => {
            const row = r.reel || r;
            if (!row) return;
            const anfo = Number(row.anfo || 0);
            const tovex = Number(row.tovex || 0);
            const am = Number(row.ammorces || row.amorces || 0);
            const met = Number(row.realMeterage || 0);
            const rnd = Number(row.realRounds || row.rounds || 0);
            const gSize = Number(row.gallerySize || row.galleryType || 9);

            monthlyAnfo += anfo;
            monthlyTovex += tovex;
            monthlyAmorces += am;
            monthlyMeterage += met;
            monthlyRounds += rnd;

            const stdAnfo = gSize === 12 ? theorAnfo12 : theorAnfo9;
            monthlyTheorAnfo += rnd * stdAnfo;
          });
        });
      }
    });

    const nbRoundsTotal = explosifsHistory.reduce((s, d) => s + (d.totalRounds || 0), 0) || monthlyRounds;

    let ratio9 = 0.5;
    let ratio12 = 0.5;
    let rawRounds9 = 0;
    let rawRounds12 = 0;

    monthlyProdDocs.forEach(d => {
      if (d.postes) {
        ['poste1', 'poste2', 'poste3'].forEach(pKey => {
          const minageRows = d.postes?.[pKey]?.minage || [];
          minageRows.forEach((r: any) => {
            const row = r.reel || r;
            if (!row) return;
            const rnd = Number(row.realRounds || row.rounds || 0);
            const gSize = Number(row.gallerySize || row.galleryType || 9);
            if (gSize === 12) {
              rawRounds12 += rnd;
            } else {
              rawRounds9 += rnd;
            }
          });
        });
      }
    });

    const totalRawRounds = rawRounds9 + rawRounds12;
    if (totalRawRounds > 0) {
      ratio9 = rawRounds9 / totalRawRounds;
      ratio12 = rawRounds12 / totalRawRounds;
    }

    const theorique = nbRoundsTotal * (ratio9 * theorAnfo9 + ratio12 * theorAnfo12) || monthlyTheorAnfo;

    const ecart = monthlyAnfo - theorique;
    const ecartPct = theorique > 0 ? (ecart / theorique) * 100 : 0;

    const avgAnfoPerMeter = monthlyMeterage > 0 ? (monthlyAnfo / monthlyMeterage) : 0;

    return {
      monthlyAnfo,
      monthlyTovex,
      monthlyAmorces,
      monthlyMeterage,
      monthlyRounds,
      theorique,
      ecart,
      ecartPct,
      avgAnfoPerMeter
    };
  };

  const saveAttachement = async () => {
    if (saisieData.length === 0) return;
    setSavingAttachement(true);
    try {
      const docId = `SMI_${selectedMois}`;
      const totalGeometre = saisieData.reduce((s, c) => s + c.metrageGeometre, 0);
      const total9m2 = saisieData
        .filter(c => c.galleryType === '9')
        .reduce((s, c) => s + c.metrageGeometre, 0);
      const total12m2 = saisieData
        .filter(c => c.galleryType === '12')
        .reduce((s, c) => s + c.metrageGeometre, 0);

      const secteurs: Record<string, any> = {};
      saisieData.forEach(c => {
        if (!secteurs[c.secteur]) secteurs[c.secteur] = {
          metrageGeometre: 0, nbChantiers: 0
        };
        secteurs[c.secteur].metrageGeometre += c.metrageGeometre;
        secteurs[c.secteur].nbChantiers++;
      });

      await setDoc(doc(db, 'attachements', docId), {
        siteId: 'SMI',
        mois: selectedMois,
        dateSaisie: new Date().toISOString(),
        saisiPar: profile?.name || 'DT',
        valide: false,
        chantiers: saisieData,
        secteurs,
        totalMetrageGeometre: totalGeometre,
        totalMetrage9m2: total9m2,
        totalMetrage12m2: total12m2,
      });
      setSaisieMode(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingAttachement(false);
    }
  };

  const productionByChantier = getMonthlyProductionByChantier(selectedMois);
  const totalPlatef = currentAttachement ? currentAttachement.chantiers.reduce((s, c) => s + (productionByChantier[c.chantierId] || 0), 0) : 0;
  const ecartGlobal = currentAttachement ? totalPlatef - currentAttachement.totalMetrageGeometre : 0;
  const globalEcartPct = currentAttachement ? computeEcartPctActual(currentAttachement.totalMetrageGeometre, totalPlatef) : 0;
  const globalFiab = getFiabiliteLabel(globalEcartPct);

  const suspectChantiers = currentAttachement ? currentAttachement.chantiers.filter(c => {
    const platef = productionByChantier[c.chantierId] || 0;
    const ecartPct = computeEcartPctActual(c.metrageGeometre, platef);
    return isSuspectFraude(ecartPct) || (c.metrageGeometre === 0 && platef > 0);
  }) : [];

  const sortedHistory = [...historiqueAttachements].sort((a, b) => a.mois.localeCompare(b.mois));
  const systematicAnomalies: { chantierName: string; consecutiveMonths: number }[] = [];

  allChantiers.forEach(chan => {
    let maxConsecutive = 0;
    let currentConsecutive = 0;
    sortedHistory.forEach(att => {
      const chRow = att.chantiers?.find((x: any) => x.chantierId === chan.id);
      if (chRow) {
        const prodMap = getMonthlyProductionByChantier(att.mois);
        const platefProd = prodMap[chan.id] || 0;
        if (platefProd > chRow.metrageGeometre) {
          currentConsecutive++;
          if (currentConsecutive > maxConsecutive) {
            maxConsecutive = currentConsecutive;
          }
        } else {
          currentConsecutive = 0;
        }
      } else {
        currentConsecutive = 0;
      }
    });
    if (maxConsecutive >= 3) {
      systematicAnomalies.push({ chantierName: chan.name, consecutiveMonths: maxConsecutive });
    }
  });

  const bilan = getBilanJournal();
  const expStats = getExplosifsStats();

  const dailyRows = (explosifsHistory || []).map(h => {
    const dailyAnfo = h.totalAnfo || 0;
    const dailyTovex = h.totalTovex || 0;
    const dailyAmorces = h.totalAmorces || 0;
    const dailyMeterage = h.totalMeterage || 0;
    const ratio = dailyMeterage > 0 ? (dailyAnfo / dailyMeterage) : 0;

    let statusLabel = '-';
    let statusClass = 'text-slate-400 bg-slate-900/40 border-slate-700/50';

    if (h.status === 'locked' || h.status === 'sealed') {
      statusLabel = 'SCELLÉ';
      statusClass = 'bg-emerald-950/20 text-emerald-400 border-emerald-500/20';
    } else if (h.status) {
      statusLabel = 'EN COURS';
      statusClass = 'bg-amber-950/20 text-amber-400 border-amber-500/20';
    }

    return {
      date: h.date,
      anfo: dailyAnfo,
      tovex: dailyTovex,
      tovexTimes10: dailyTovex * 10,
      amorces: dailyAmorces,
      ratio,
      statusLabel,
      statusClass
    };
  });

  const generateMonthlyReport = () => {
    setGeneratingPDF(true);

    const totalMeteragePlatf = rapportHistory.reduce((s, d) => s + (d.totalMeterageRealised || 0), 0);
    const totalMeteragePlan = rapportHistory.reduce((s, d) => s + (d.totalMeteragePlanned || 0), 0);
    const totalMetrageGeo = rapportAttachement?.totalMetrageGeometre || null;
    const totalWagons = rapportHistory.reduce((s, d) => s + (d.totalWagonsRealised || 0), 0);
    const totalAnfo = rapportHistory.reduce((s, d) => s + (d.totalAnfo || 0), 0);
    const tauxRealisation = totalMeteragePlan > 0
      ? (totalMeteragePlatf / totalMeteragePlan * 100).toFixed(1) : '—';

    const [year, month] = rapportMonth.split('-');
    const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    const monthLabel = `${monthNames[parseInt(month) - 1]} ${year}`;

    const html = `<!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <title>Rapport Production — SMI Imiter — ${monthLabel}</title>
      <style>
        @page { margin: 20mm; }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; font-size: 11px; color: #1e293b; background: white; }
        .header { background: #0f172a; padding: 20px 28px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
        .header-left h1 { color: #ffd700; font-size: 16px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; }
        .header-left p { color: #94a3b8; font-size: 9px; text-transform: uppercase; letter-spacing: 1px; margin-top: 3px; }
        .header-right { text-align: right; }
        .header-right .mois { color: #ffd700; font-size: 18px; font-weight: 900; text-transform: uppercase; }
        .header-right .site { color: #64748b; font-size: 9px; text-transform: uppercase; letter-spacing: 1px; margin-top: 2px; }
        .section-title { font-size: 10px; font-weight: 900; text-transform: uppercase; letter-spacing: 1.5px; color: #0f172a; border-left: 4px solid #ffd700; padding-left: 10px; margin: 18px 0 10px; }
        .kpi-grid { display: grid; grid-template-columns: repeat(4,1fr); gap: 12px; margin-bottom: 18px; }
        .kpi { border: 1.5px solid #e2e8f0; border-radius: 8px; padding: 12px; text-align: center; }
        .kpi-value { font-size: 22px; font-weight: 900; color: #1a5276; }
        .kpi-label { font-size: 8px; text-transform: uppercase; color: #64748b; font-weight: 700; margin-top: 3px; letter-spacing: 0.8px; }
        .kpi-sub { font-size: 8px; color: #94a3b8; margin-top: 2px; }
        table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
        th { background: #0f172a; color: white; padding: 7px 8px; font-size: 8px; text-transform: uppercase; letter-spacing: 0.5px; text-align: left; }
        td { padding: 6px 8px; border-bottom: 1px solid #f1f5f9; font-size: 10px; }
        tr:nth-child(even) td { background: #f8fafc; }
        .badge { display: inline-block; padding: 2px 7px; border-radius: 99px; font-size: 8px; font-weight: 900; text-transform: uppercase; }
        .badge-green { background: #dcfce7; color: #166534; }
        .badge-amber { background: #fef3c7; color: #92400e; }
        .badge-red { background: #fee2e2; color: #991b1b; }
        .attachement-box { background: #f0fdf4; border: 1.5px solid #86efac; border-radius: 8px; padding: 12px; margin-bottom: 16px; }
        .no-attachement { background: #fef9c3; border: 1.5px solid #fde047; border-radius: 8px; padding: 12px; margin-bottom: 16px; font-size: 9px; color: #854d0e; text-transform: uppercase; font-weight: 700; }
        .footer { margin-top: 24px; padding-top: 10px; border-top: 1px solid #e2e8f0; display: flex; justify-content: space-between; color: #94a3b8; font-size: 8px; }
        .signature-box { border-top: 1px solid #1e293b; width: 180px; padding-top: 4px; font-size: 8px; color: #64748b; text-transform: uppercase; }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="header-left">
          <h1>⛏️ HYDROMINES — SMI IMITER</h1>
          <p>Rapport Mensuel de Production — Confidentiel</p>
          <p style="color:#475569; margin-top:4px;">
            Généré le ${new Date().toLocaleDateString('fr-MA', {
              day: 'numeric', month: 'long', year: 'numeric'
            })} par ${profile?.name || 'Directeur Technique'}
          </p>
        </div>
        <div class="header-right">
          <div class="mois">${monthLabel}</div>
          <div class="site">Mine Souterraine d'Argent</div>
        </div>
      </div>

      <div class="section-title">Indicateurs Clés de Performance</div>
      <div class="kpi-grid">
        <div class="kpi">
          <div class="kpi-value">${totalMeteragePlatf.toFixed(0)} m</div>
          <div class="kpi-label">⛏️ Métrage Plateforme</div>
          <div class="kpi-sub">Planifié : ${totalMeteragePlan.toFixed(0)} m</div>
        </div>
        ${totalMetrageGeo !== null ? `
        <div class="kpi">
          <div class="kpi-value" style="color:#16a34a">
            ${totalMetrageGeo.toFixed(0)} m
          </div>
          <div class="kpi-label">📐 Métrage Géomètre Officiel</div>
          <div class="kpi-sub">Source : Attachements MANAGEM</div>
        </div>` : `
        <div class="kpi" style="background:#fef9c3">
          <div class="kpi-value" style="color:#d97706">N/A</div>
          <div class="kpi-label">📐 Métrage Géomètre</div>
          <div class="kpi-sub">Attachements non saisis</div>
        </div>`}
        <div class="kpi">
          <div class="kpi-value">${totalWagons}</div>
          <div class="kpi-label">🚛 Wagons Extraits</div>
        </div>
        <div class="kpi">
          <div class="kpi-value">${tauxRealisation}%</div>
          <div class="kpi-label">🎯 Taux Réalisation</div>
          <div class="kpi-sub">Plateforme vs Planifié</div>
        </div>
      </div>

      ${rapportAttachement ? `
      <div class="attachement-box">
        ✅ Attachements géomètres disponibles — Métrage officiel :
        <strong>${rapportAttachement.totalMetrageGeometre.toFixed(1)} m</strong>
        (dont 9m² : ${rapportAttachement.totalMetrage9m2.toFixed(1)} m |
        12m² : ${rapportAttachement.totalMetrage12m2.toFixed(1)} m)
      </div>` : `
      <div class="no-attachement">
        ⚠️ Attachements géomètres non encore saisis pour ${monthLabel}.
        Le métrage affiché est celui de la plateforme (non validé géomètre).
      </div>`}

      <div class="section-title">Détail Journalier</div>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Prévu (m)</th>
            <th>Réalisé (m)</th>
            <th>Taux</th>
            <th>Wagons Prévu</th>
            <th>Wagons Réalisé</th>
            <th>ANFO (kg)</th>
            <th>Statut</th>
          </tr>
        </thead>
        <tbody>
          ${rapportHistory.map(d => {
            const taux = d.totalMeteragePlanned > 0
              ? (d.totalMeterageRealised / d.totalMeteragePlanned * 100).toFixed(0)
              : '—';
            const tauxNum = Number(taux);
            const badge = tauxNum >= 90 ? 'badge-green'
              : tauxNum >= 70 ? 'badge-amber' : 'badge-red';
            return `
            <tr>
              <td><strong>${d.date || d.id}</strong></td>
              <td>${(d.totalMeteragePlanned || 0).toFixed(1)}</td>
              <td><strong>${(d.totalMeterageRealised || 0).toFixed(1)}</strong></td>
              <td><span class="badge ${badge}">${taux}%</span></td>
              <td>${d.totalWagonsPlanned || 0}</td>
              <td><strong>${d.totalWagonsRealised || 0}</strong></td>
              <td>${(d.totalAnfo || 0).toFixed(0)}</td>
              <td>${d.sealed ? '✅ Scellé' : '⏳'}</td>
            </tr>`;
          }).join('')}
        </tbody>
        <tfoot>
          <tr style="background:#f1f5f9; font-weight:900;">
            <td>TOTAL MOIS</td>
            <td>${totalMeteragePlan.toFixed(1)}</td>
            <td>${totalMeteragePlatf.toFixed(1)}</td>
            <td><span class="badge ${
              Number(tauxRealisation) >= 90 ? 'badge-green'
              : Number(tauxRealisation) >= 70 ? 'badge-amber' : 'badge-red'
            }">${tauxRealisation}%</span></td>
            <td>${rapportHistory.reduce((s, d) => s + (d.totalWagonsPlanned || 0), 0)}</td>
            <td>${totalWagons}</td>
            <td>${totalAnfo.toFixed(0)} kg</td>
            <td></td>
          </tr>
        </tfoot>
      </table>

      <div class="footer">
        <div>HYDROMINES | SMI Imiter | Document Confidentiel</div>
        <div class="signature-box">
          Directeur Technique<br/>
          ${profile?.name || ''}
        </div>
      </div>
    </body></html>`;

    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => { win.print(); setGeneratingPDF(false); }, 600);
    } else {
      setGeneratingPDF(false);
    }
  };

  const QUESTIONS_DT = [
    "Quel secteur performe le moins bien ce mois-ci et pourquoi ?",
    "Y a-t-il des chantiers dont les déclarations de métrage semblent suspectes ?",
    "Quelle est la tendance de consommation d'explosifs sur les 14 derniers jours ?",
    "Quels sont les 3 points d'amélioration prioritaires pour le mois prochain ?",
    "Quel mineur décroche en termes de rendement m/volée ?",
    "La projection fin de mois est-elle en ligne avec les objectifs ?",
  ];

  const dtProductionData = {
    moisActuel: rapportMonth,
    nbJours: rapportHistory.length,
    totalMeteragePlatf: rapportHistory
      .reduce((s, d) => s + (d.totalMeterageRealised || 0), 0).toFixed(1),
    totalMeteragePlan: rapportHistory
      .reduce((s, d) => s + (d.totalMeteragePlanned || 0), 0).toFixed(1),
    totalAnfo: rapportHistory
      .reduce((s, d) => s + (d.totalAnfo || 0), 0).toFixed(0),
    metrageGeoOfficial: rapportAttachement?.totalMetrageGeometre?.toFixed(1) || 'Non disponible',
    derniers7jours: rapportHistory.slice(-7).map(d => ({
      date: d.date,
      meterage: d.totalMeterageRealised,
      wagons: d.totalWagonsRealised,
    })),
    site: 'SMI Imiter — Mine souterraine d\'argent',
    secteurs: ['Imiter 1', 'Imiter 2', 'Imiter Est'],
  };

  const callDtIA = async () => {
    if (!dtQuestion) return;
    setLoadingDT(true);
    setDtResponse(null);
    setDtError(null);
    try {
      const response = await fetch('/api/ia/expert-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expertName: 'Hamid Bensalem',
          profile: `Directeur Technique Senior avec 20 ans d'expérience dans les mines souterraines d'argent au Maroc. Expert en optimisation de production, gestion des explosifs, rendement des équipes de foreurs et analyse des performances de chantier. Il répond toujours de manière directe, avec des chiffres précis et des décisions concrètes. Il ne perd pas de temps en analyses superflues — il identifie le problème et donne la solution.`,
          dataContext: dtProductionData,
          customQuestion: dtQuestion,
        }),
      });
      if (!response.ok) throw new Error(`Erreur ${response.status}`);
      const data = await response.json();
      const text = [
        data.analysis,
        data.anomalies?.length
          ? '\n\n⚠️ Anomalies :\n' + data.anomalies.join('\n')
          : '',
        data.suggestions?.length
          ? '\n\n✅ Recommandations :\n' + data.suggestions.join('\n')
          : '',
      ].filter(Boolean).join('');
      setDtResponse(text);
    } catch (err: any) {
      setDtError(err.message || 'Erreur de connexion');
    } finally {
      setLoadingDT(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0f1a]">
      <div className="bg-gradient-to-r from-[#0f172a] via-[#1a3a5c] to-[#0f172a] border-b border-[#ffd700]/20 px-6 py-5">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-[#ffd700] text-2xl">👑</span>
              <div>
                <h1 className="text-[#ffd700] font-black text-xl uppercase tracking-[3px]">
                  ESPACE DIRECTEUR TECHNIQUE
                </h1>
                <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">
                  SMI Imiter — Tableau de Commandement Technique
                </p>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-[#ffd700] text-[9px] font-black uppercase tracking-widest">
              Bienvenue
            </div>
            <div className="text-white text-[11px] font-black uppercase">
              {profile?.name || 'Directeur Technique'}
            </div>
          </div>
        </div>

        <div className="flex gap-1 mt-5 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider whitespace-nowrap transition-all ${activeTab === tab.id
                ? 'bg-[#ffd700] text-[#0f172a]'
                : 'bg-slate-800/60 text-slate-400 hover:bg-slate-700/60 hover:text-white'
              }`}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        {activeTab === 'journal' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-3">
                <input
                  type="date"
                  value={journalDate}
                  onChange={(e) => setJournalDate(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-[#ffd700] text-[11px] font-black rounded-xl px-4 py-2.5 outline-none"
                />
                <div className="flex gap-1.5">
                  <button
                    onClick={() => changeJournalDate(-1)}
                    className="px-3 py-2 bg-slate-800 text-white text-[10px] font-black uppercase rounded-xl border border-slate-700 hover:bg-slate-750 transition-colors"
                  >
                    ← Hier
                  </button>
                  <button
                    onClick={() => setJournalDate(new Date().toISOString().split('T')[0])}
                    className="px-3 py-2 bg-slate-800 text-white text-[10px] font-black uppercase rounded-xl border border-slate-700 hover:bg-slate-750 transition-colors"
                  >
                    Aujourd'hui
                  </button>
                  <button
                    onClick={() => changeJournalDate(1)}
                    className="px-3 py-2 bg-slate-800 text-white text-[10px] font-black uppercase rounded-xl border border-slate-700 hover:bg-slate-750 transition-colors"
                  >
                    Demain →
                  </button>
                </div>
              </div>
            </div>

            {loadingJournal ? (
              <div className="flex items-center justify-center h-64 text-[#ffd700] font-black text-[11px] uppercase tracking-widest animate-pulse">
                Chargement du journal...
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                  {[
                    { n: 1, label: 'POSTE 1', hours: '07h-15h' },
                    { n: 2, label: 'POSTE 2', hours: '15h-23h' },
                    { n: 3, label: 'POSTE 3', hours: '23h-07h' }
                  ].map(({ n, label, hours }) => {
                    const posteData = journalProduction?.postes?.[`poste${n}`];
                    const planData = journalPlanning?.postes?.[`poste${n}`];
                    const isSealed = !!(posteData?.locked || posteData?.sealed || posteData?.status === 'locked' || posteData?.status === 'sealed');
                    const exists = !!posteData;

                    let borderClass = 'border-slate-700';
                    let statusLabel = 'NON SAISI';
                    let statusClass = 'bg-slate-900/40 text-slate-400 border-slate-700/50';

                    if (isSealed) {
                      borderClass = 'border-emerald-500';
                      statusLabel = 'SCELLÉ';
                      statusClass = 'bg-emerald-950/20 text-emerald-400 border-emerald-500/20';
                    } else if (exists) {
                      borderClass = 'border-amber-500';
                      statusLabel = 'EN COURS';
                      statusClass = 'bg-amber-950/20 text-amber-400 border-amber-500/20';
                    }

                    const shiftAnfo = posteData?.minage?.reduce((s: number, r: any) => s + Number(r.reel?.anfo || r.anfo || 0), 0) || 0;
                    const shiftTovex = posteData?.minage?.reduce((s: number, r: any) => s + Number(r.reel?.tovex || r.tovex || 0), 0) || 0;
                    const shiftAmorces = posteData?.minage?.reduce((s: number, r: any) => s + Number(r.reel?.ammorces || r.reel?.amorces || r.ammorces || r.amorces || 0), 0) || 0;

                    const shiftExplications = journalExplications.filter(e => String(e.poste || e.shift) === String(n));

                    return (
                      <div key={n} className={`bg-[#0f172a] border-2 ${borderClass} rounded-2xl p-5 flex flex-col justify-between shadow-lg`}>
                        <div>
                          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-800">
                            <div>
                              <h3 className="text-[#ffd700] font-black text-sm tracking-wider uppercase">{label}</h3>
                              <p className="text-slate-500 text-[10px] font-bold mt-0.5">{hours}</p>
                            </div>
                            <span className={`px-2 py-0.5 border text-[9px] font-black rounded uppercase ${statusClass}`}>
                              {statusLabel}
                            </span>
                          </div>

                          <div className="space-y-3">
                            <h4 className="text-slate-400 text-[9px] font-black uppercase tracking-wider mb-2">Avancement Minage</h4>
                            {['Imiter 1', 'Imiter 2', 'Imiter Est'].map(secteur => {
                              const minageRows = posteData?.minage?.filter((r: any) => {
                                const sGroup = r.reel?.sectorGroup || r.sectorGroup || r.reel?.sector || r.sector || r.reel?.secteur || r.secteur || '';
                                return sGroup.toLowerCase() === secteur.toLowerCase();
                              }) || [];

                              const planRows = planData?.minage?.filter((r: any) => {
                                const sGroup = r.sectorGroup || r.sector || r.secteur || '';
                                return sGroup.toLowerCase() === secteur.toLowerCase();
                              }) || [];

                              const totalReel = minageRows.reduce((s: number, r: any) => {
                                const rowData = r.reel || r;
                                return s + (Number(rowData.realMeterage || rowData.meterage || 0));
                              }, 0);

                              const totalPlan = planRows.reduce((s: number, r: any) => s + (Number(r.meterage || r.plannedMeterage || 0)), 0);

                              const rate = totalPlan > 0 ? (totalReel / totalPlan * 100) : null;

                              let badgeColor = 'text-slate-500 bg-slate-900/40 border-slate-800/50';
                              if (rate !== null) {
                                if (rate >= 90) badgeColor = 'text-emerald-400 bg-emerald-950/20 border-emerald-500/20';
                                else if (rate >= 70) badgeColor = 'text-amber-400 bg-amber-950/20 border-amber-500/20';
                                else badgeColor = 'text-rose-400 bg-rose-950/20 border-rose-500/20';
                              }

                              return (
                                <div key={secteur} className="flex items-center justify-between py-1 border-b border-slate-800/40 last:border-0 last:pb-0">
                                  <div className="text-white text-[10px] font-bold uppercase">{secteur}</div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-slate-500 text-[9px]">
                                      Pl: <span className="text-slate-400">{totalPlan.toFixed(1)}m</span>
                                    </span>
                                    <span className="text-slate-500 text-[9px]">
                                      R: <span className="text-[#00BFFF] font-bold">{totalReel.toFixed(1)}m</span>
                                    </span>
                                    <span className={`px-1 rounded text-[8.5px] font-black border ${badgeColor}`}>
                                      {rate !== null ? `${rate.toFixed(0)}%` : '-'}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          <div className="mt-5 space-y-2 border-t border-slate-800 pt-3">
                            <h4 className="text-slate-400 text-[9px] font-black uppercase tracking-wider">Explosifs Consommés</h4>
                            <div className="grid grid-cols-3 gap-2 text-center">
                              <div className="bg-slate-900/60 p-1.5 rounded-lg border border-slate-800/60">
                                <span className="text-rose-400 text-[10px] font-black">{shiftAnfo.toFixed(0)} kg</span>
                                <p className="text-slate-500 text-[8px] uppercase font-bold tracking-wider mt-0.5">ANFO</p>
                              </div>
                              <div className="bg-slate-900/60 p-1.5 rounded-lg border border-slate-800/60">
                                <span className="text-orange-400 text-[10px] font-black">{shiftTovex.toFixed(1)} kg</span>
                                <p className="text-slate-500 text-[8px] uppercase font-bold tracking-wider mt-0.5">TOVEX</p>
                              </div>
                              <div className="bg-slate-900/60 p-1.5 rounded-lg border border-slate-800/60">
                                <span className="text-amber-400 text-[10px] font-black">{shiftAmorces} u</span>
                                <p className="text-slate-500 text-[8px] uppercase font-bold tracking-wider mt-0.5">AMORCES</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {shiftExplications.length > 0 ? (
                          <div className="mt-4 space-y-1.5 border-t border-slate-800 pt-3">
                            <div className="text-rose-400 text-[8.5px] font-black uppercase tracking-wider flex items-center gap-1">
                              <span>⚠️</span> Justifications ({shiftExplications.length})
                            </div>
                            <div className="max-h-[140px] overflow-y-auto space-y-1.5 pr-1">
                              {shiftExplications.map((exp, idx) => (
                                <div key={idx} className="bg-rose-950/10 border border-rose-500/20 rounded-lg p-2 text-[9px]">
                                  <div className="flex justify-between font-bold text-slate-300">
                                    <span className="text-rose-300 font-extrabold uppercase">{exp.chantierName || exp.chantierId || 'Chantier'}</span>
                                    <span className="text-slate-500 text-[8px]">Par {exp.author || exp.saisiPar || 'Auteur'}</span>
                                  </div>
                                  <p className="text-slate-400 mt-1 italic font-semibold">"{exp.explanation || exp.reason || exp.raison || 'Sans explication'}"</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="text-slate-600 text-[8.5px] uppercase font-bold tracking-wider mt-4 border-t border-slate-800 pt-3">
                            ✅ Aucun tir avorté signalé
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="bg-[#0f172a] border border-[#ffd700]/10 rounded-2xl p-5 shadow-xl mt-6">
                  <h3 className="text-[#ffd700] text-xs font-black uppercase tracking-widest mb-4">
                    Bilan de la Journée
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="bg-slate-900/50 border border-slate-800 p-3.5 rounded-xl text-center">
                      <span className="text-slate-500 text-[9px] uppercase font-bold tracking-wider">Avancement Forage</span>
                      <div className="text-[#00BFFF] text-lg font-black mt-1">
                        {bilan.totalReel.toFixed(1)} / {bilan.totalPlan.toFixed(1)} m
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                        {bilan.totalPlan > 0 ? `${((bilan.totalReel / bilan.totalPlan) * 100).toFixed(0)}% de réalisation` : '-'}
                      </p>
                    </div>

                    <div className="bg-slate-900/50 border border-slate-800 p-3.5 rounded-xl text-center">
                      <span className="text-slate-500 text-[9px] uppercase font-bold tracking-wider">Wagons Extraits</span>
                      <div className="text-white text-lg font-black mt-1">
                        {bilan.totalWagonsReel} / {bilan.totalWagonsPlan} u
                      </div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                        {bilan.totalWagonsPlan > 0 ? `${((bilan.totalWagonsReel / bilan.totalWagonsPlan) * 100).toFixed(0)}% de réalisation` : '-'}
                      </p>
                    </div>

                    <div className="bg-slate-900/50 border border-slate-800 p-3.5 rounded-xl text-center">
                      <span className="text-slate-500 text-[9px] uppercase font-bold tracking-wider">ANFO Consommé</span>
                      <div className="text-rose-400 text-lg font-black mt-1">
                        {bilan.totalAnfo.toFixed(0)} kg
                      </div>
                      <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mt-1">Cumulative de jour</p>
                    </div>

                    <div className="bg-slate-900/50 border border-slate-800 p-3.5 rounded-xl text-center">
                      <span className="text-slate-500 text-[9px] uppercase font-bold tracking-wider">Tirs Avortés</span>
                      <div className={`text-lg font-black mt-1 ${bilan.totalNonRealises > 0 ? 'text-amber-500' : 'text-emerald-500'}`}>
                        {bilan.totalNonRealises}
                      </div>
                      <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest mt-1">Total excuses</p>
                    </div>

                    <div className="bg-[#ffd700]/5 border border-[#ffd700]/20 p-3.5 rounded-xl text-center col-span-2 md:col-span-1">
                      <span className="text-[#ffd700] text-[9px] uppercase font-black tracking-widest">Rapport Posté</span>
                      <div className="text-white text-[11px] font-black uppercase mt-1">
                        SMI Imiter
                      </div>
                      <p className="text-[9px] text-slate-400 uppercase font-bold mt-1">
                        {journalDate}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'attachements' && (
          <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <input
                  type="month"
                  value={selectedMois}
                  onChange={(e) => setSelectedMois(e.target.value)}
                  className="bg-slate-800 border border-slate-700 text-[#ffd700] text-[11px] font-black rounded-xl px-4 py-2.5 outline-none"
                />
                <button
                  onClick={() => {
                    setSaisieMode(true);
                    setSaisieData(allChantiers.map(c => ({
                      chantierId: c.id,
                      chantierName: c.name,
                      secteur: c.sector || c.secteur || '',
                      galleryType: (c.galleryType === '9m2' || c.galleryType === '9') ? '9' : '12',
                      metrageGeometre: 0,
                    })));
                  }}
                  className="px-5 py-2.5 bg-[#ffd700] text-[#0f172a] text-[10px] font-black uppercase tracking-wider rounded-xl hover:bg-yellow-300 transition-colors"
                >
                  📐 Saisir Données Géomètres — {selectedMois}
                </button>
              </div>
            </div>

            {saisieMode && (
              <div className="fixed inset-0 z-50 bg-[#0a0f1a]/95 backdrop-blur-md overflow-y-auto p-6 flex items-center justify-center">
                <div className="bg-[#0f172a] border border-[#ffd700]/20 rounded-2xl w-full max-w-2xl p-6 shadow-2xl">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-4">
                    <div>
                      <h2 className="text-[#ffd700] font-black text-lg uppercase tracking-wider">
                        Saisie Attachements — {selectedMois}
                      </h2>
                      <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mt-0.5">
                        Données officielles des géomètres — MANAGEM SMI
                      </p>
                    </div>
                    <button
                      onClick={() => setSaisieMode(false)}
                      className="text-slate-400 hover:text-white font-black uppercase text-xs"
                    >
                      Fermer
                    </button>
                  </div>

                  <div className="space-y-1 max-h-[60vh] overflow-y-auto pr-2">
                    {saisieData.map((c, idx) => (
                      <div key={idx} className="grid grid-cols-[1fr_120px_80px_140px] gap-3 items-center py-3 border-b border-slate-800/60">
                        <div>
                          <div className="text-white text-[11px] font-black uppercase">
                            {c.chantierName}
                          </div>
                          <div className="text-slate-500 text-[9px] uppercase">
                            {c.secteur} — {c.galleryType}m²
                          </div>
                        </div>
                        <div className="text-slate-400 text-[10px] font-bold">
                          {c.galleryType === '9' ? 'Traçage 9m²' : 'Galerie 12m²'}
                        </div>
                        <div className="text-[#ffd700] text-[9px] font-black uppercase">
                          m foré
                        </div>
                        <input
                          type="number"
                          step="0.1"
                          min="0"
                          value={c.metrageGeometre || ''}
                          onChange={(e) => setSaisieData(prev => prev.map(ch =>
                            ch.chantierId === c.chantierId
                              ? { ...ch, metrageGeometre: Number(e.target.value) || 0 }
                              : ch
                          ))}
                          placeholder="0.0"
                          className="bg-slate-800 border border-slate-600 text-white text-[11px] font-black rounded-lg px-3 py-2 outline-none focus:border-[#ffd700] text-right"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center border-t border-slate-800 pt-4 mt-4">
                    <div className="text-[#ffd700] text-xl font-black">
                      TOTAL GÉOMÈTRES : {saisieData.reduce((s, c) => s + c.metrageGeometre, 0).toFixed(1)} m
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setSaisieMode(false)}
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-colors"
                      >
                        Annuler
                      </button>
                      <button
                        onClick={saveAttachement}
                        disabled={savingAttachement}
                        className="px-4 py-2 bg-[#ffd700] text-[#0f172a] hover:bg-yellow-300 text-[10px] font-black uppercase tracking-wider rounded-xl transition-colors disabled:opacity-50"
                      >
                        {savingAttachement ? 'Enregistrement...' : 'Enregistrer les attachements'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {loadingAttachement ? (
              <div className="flex items-center justify-center h-64 text-slate-500 font-black text-[11px] uppercase tracking-widest">
                Chargement...
              </div>
            ) : !currentAttachement ? (
              <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-8 text-center">
                <div className="text-slate-500 text-3xl mb-3">📐</div>
                <div className="text-slate-300 text-[12px] font-black uppercase tracking-widest mb-2">
                  Aucun attachement saisi pour ce mois ({selectedMois})
                </div>
                <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mb-6 max-w-md mx-auto">
                  Veuillez saisir les données mesurées par les géomètres pour activer le module de comparaison et de fiabilité.
                </p>
                <button
                  onClick={() => {
                    setSaisieMode(true);
                    setSaisieData(allChantiers.map(c => ({
                      chantierId: c.id,
                      chantierName: c.name,
                      secteur: c.sector || c.secteur || '',
                      galleryType: (c.galleryType === '9m2' || c.galleryType === '9') ? '9' : '12',
                      metrageGeometre: 0,
                    })));
                  }}
                  className="px-6 py-3 bg-[#ffd700] text-[#0f172a] text-[10px] font-black uppercase tracking-wider rounded-xl hover:bg-yellow-300 transition-colors"
                >
                  Saisir les données géomètres
                </button>
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-[#0f172a] border border-[#ffd700]/20 rounded-xl p-4">
                    <div className="text-slate-400 text-[9px] font-black uppercase tracking-wider">
                      Métrage Géomètre Total
                    </div>
                    <div className="text-[#ffd700] text-2xl font-black mt-1">
                      {currentAttachement.totalMetrageGeometre.toFixed(1)} m
                    </div>
                  </div>

                  <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4">
                    <div className="text-slate-400 text-[9px] font-black uppercase tracking-wider">
                      Métrage Plateforme Total
                    </div>
                    <div className="text-white text-2xl font-black mt-1">
                      {totalPlatef.toFixed(1)} m
                    </div>
                  </div>

                  <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4">
                    <div className="text-slate-400 text-[9px] font-black uppercase tracking-wider">
                      Écart Global
                    </div>
                    <div className={`text-2xl font-black mt-1 ${
                      globalEcartPct > 25 ? 'text-rose-500' : globalEcartPct > 10 ? 'text-amber-500' : 'text-emerald-500'
                    }`}>
                      {ecartGlobal > 0 ? `+${ecartGlobal.toFixed(1)}` : ecartGlobal.toFixed(1)} m ({globalEcartPct > 0 ? `+${globalEcartPct.toFixed(1)}` : globalEcartPct.toFixed(1)}%)
                    </div>
                  </div>

                  <div className={`border rounded-xl p-4 ${globalFiab.bg}`}>
                    <div className={`${globalFiab.color} text-[9px] font-black uppercase tracking-wider`}>
                      Score de Fiabilité
                    </div>
                    <div className={`${globalFiab.color} text-2xl font-black mt-1 flex items-center gap-2`}>
                      <span>{globalFiab.icon}</span>
                      {globalFiab.label}
                    </div>
                  </div>
                </div>

                {suspectChantiers.length > 0 && (
                  <div className="bg-rose-950/40 border border-rose-500/30 text-rose-300 p-4 rounded-xl mb-6 animate-pulse flex items-start gap-3">
                    <span className="text-xl">⚠️</span>
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-rose-400">
                        DÉCLARATION SUSPECTE — Écart &gt; 25% — Audit recommandé
                      </h3>
                      <p className="text-[10px] mt-1 text-rose-350 uppercase tracking-wide">
                        Les chantiers suivants présentent un excédent de déclaration critique : {suspectChantiers.map(c => c.chantierName).join(', ')}
                      </p>
                    </div>
                  </div>
                )}

                <div className="bg-[#0f172a] border border-slate-800/80 rounded-xl overflow-hidden mb-6">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[#0c1220] border-b border-slate-800 text-[9px] font-black tracking-wider uppercase text-slate-400">
                          <th className="p-3">Chantier</th>
                          <th className="p-3">Section</th>
                          <th className="p-3">Secteur</th>
                          <th className="p-3 text-right">Géomètre (m)</th>
                          <th className="p-3 text-right">Plateforme (m)</th>
                          <th className="p-3 text-right">Écart (m)</th>
                          <th className="p-3 text-right">Écart (%)</th>
                          <th className="p-3 text-center">Fiabilité</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-850/50">
                        {currentAttachement.chantiers.map((c, idx) => {
                          const platef = productionByChantier[c.chantierId] || 0;
                          const ecart = platef - c.metrageGeometre;
                          const ecartPct = computeEcartPctActual(c.metrageGeometre, platef);
                          const fiab = getFiabiliteLabel(ecartPct);
                          const suspect = isSuspectFraude(ecartPct) || (c.metrageGeometre === 0 && platef > 0);

                          return (
                            <tr
                              key={idx}
                              className={`transition-colors ${
                                suspect ? 'bg-rose-950/20 hover:bg-rose-950/30' : 'hover:bg-slate-800/30'
                              }`}
                            >
                              <td className="p-3">
                                <div className="text-white text-[11px] font-black uppercase">
                                  {c.chantierName}
                                </div>
                              </td>
                              <td className="p-3">
                                <div className="text-slate-400 text-[10px] font-bold">
                                  {c.galleryType === '9' ? 'Traçage 9m²' : 'Galerie 12m²'}
                                </div>
                              </td>
                              <td className="p-3">
                                <div className="text-slate-500 text-[10px] font-bold uppercase">
                                  {c.secteur}
                                </div>
                              </td>
                              <td className="p-3 text-right font-mono text-[11px] text-slate-300">
                                {c.metrageGeometre.toFixed(1)} m
                              </td>
                              <td className="p-3 text-right font-mono text-[11px] text-[#00BFFF]">
                                {platef.toFixed(1)} m
                              </td>
                              <td className={`p-3 text-right font-mono text-[11px] font-bold ${
                                ecart > 0 ? 'text-rose-400' : ecart < 0 ? 'text-sky-400' : 'text-slate-400'
                              }`}>
                                {ecart > 0 ? `+${ecart.toFixed(1)}` : ecart.toFixed(1)} m
                              </td>
                              <td className={`p-3 text-right font-mono text-[11px] font-bold ${
                                ecartPct > 25 ? 'text-rose-400' : ecartPct > 10 ? 'text-amber-400' : 'text-emerald-400'
                              }`}>
                                {ecartPct > 0 ? `+${ecartPct.toFixed(1)}` : ecartPct.toFixed(1)}%
                              </td>
                              <td className="p-3 text-center">
                                <span className={`inline-flex px-2 py-0.5 border text-[8.5px] font-black uppercase rounded ${
                                  suspect
                                    ? 'bg-rose-900/40 text-rose-300 border-rose-500/50 animate-pulse'
                                    : fiab.label === 'FIABLE'
                                    ? 'bg-emerald-900/40 text-emerald-300 border-emerald-500/50'
                                    : 'bg-amber-900/40 text-amber-300 border-amber-500/50'
                                }`}>
                                  {suspect ? 'ALERTE' : fiab.label}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>

                {systematicAnomalies.length > 0 && (
                  <div className="space-y-3 mb-6">
                    {systematicAnomalies.map((anom, idx) => (
                      <div key={idx} className="bg-rose-950/40 border border-rose-500 text-rose-300 p-4 rounded-xl animate-pulse flex items-start gap-3">
                        <span className="text-xl">🚨</span>
                        <div>
                          <h3 className="text-xs font-black uppercase tracking-wider text-rose-400">
                            ANOMALIE SYSTÉMATIQUE — {anom.chantierName}
                          </h3>
                          <p className="text-[10px] mt-1 text-rose-350 uppercase tracking-wide font-bold">
                            Déclare systématiquement plus que le réalisé réel. {anom.consecutiveMonths} mois consécutifs d'excédent détecté. Audit physique requis.
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-8">
                  <h3 className="text-[#ffd700] text-[11px] font-black uppercase tracking-widest mb-4">
                    Historique de Fiabilité — 6 derniers mois
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
                    {historiqueAttachements.map((hist, idx) => {
                      const histTotalPlatef = hist.chantiers.reduce((s, c) => {
                        const hProdMap = getMonthlyProductionByChantier(hist.mois);
                        return s + (hProdMap[c.chantierId] || 0);
                      }, 0);
                      const histEcartPct = computeEcartPctActual(hist.totalMetrageGeometre, histTotalPlatef);
                      const histFiab = getFiabiliteLabel(histEcartPct);

                      return (
                        <div key={idx} className="bg-[#0f172a] border border-slate-800 rounded-xl p-3 text-center">
                          <div className="text-slate-400 text-[10px] font-black uppercase">
                            {hist.mois}
                          </div>
                          <div className={`text-sm font-black mt-1 ${
                            histEcartPct > 25 ? 'text-rose-400' : histEcartPct > 10 ? 'text-amber-400' : 'text-emerald-400'
                          }`}>
                            {histEcartPct > 0 ? `+${histEcartPct.toFixed(1)}` : histEcartPct.toFixed(1)}%
                          </div>
                          <div className="mt-2">
                            <span className={`px-1.5 py-0.5 text-[8px] font-black uppercase rounded ${
                              histEcartPct > 25
                                ? 'bg-rose-900/30 text-rose-300 border border-rose-500/30'
                                : histFiab.label === 'FIABLE'
                                ? 'bg-emerald-900/30 text-emerald-300 border border-emerald-500/30'
                                : 'bg-amber-900/30 text-amber-300 border border-amber-500/30'
                            }`}>
                              {histFiab.label}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'explosifs' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <input
                type="month"
                value={explosifsMonth}
                onChange={(e) => setExplosifsMonth(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-[#ffd700] text-[11px] font-black rounded-xl px-4 py-2.5 outline-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4">
                <span className="text-slate-400 text-[9px] font-black uppercase tracking-wider">ANFO Consommé</span>
                <div className="text-white text-2xl font-black mt-1">
                  {expStats.monthlyAnfo.toFixed(0)} kg
                </div>
              </div>

              <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4">
                <span className="text-slate-400 text-[9px] font-black uppercase tracking-wider">Tovex Consommé</span>
                <div className="text-white text-2xl font-black mt-1">
                  {expStats.monthlyTovex.toFixed(1)} kg
                </div>
              </div>

              <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-4">
                <span className="text-slate-400 text-[9px] font-black uppercase tracking-wider">Amorces Utilisées</span>
                <div className="text-white text-2xl font-black mt-1">
                  {expStats.monthlyAmorces} u
                </div>
              </div>

              <div className="bg-[#0f172a] border border-[#ffd700]/10 rounded-xl p-4">
                <span className="text-[#ffd700] text-[9px] font-black uppercase tracking-wider">Ratio Moyen ANFO / Mètre</span>
                <div className="text-[#ffd700] text-2xl font-black mt-1">
                  {expStats.avgAnfoPerMeter.toFixed(2)} kg/m
                </div>
              </div>
            </div>

            <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-5 shadow-xl mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white text-xs font-black uppercase tracking-widest">
                  Comparaison Réel vs Théorique (ANFO)
                </h3>
                <span className={`px-2.5 py-1 text-[9px] font-black rounded uppercase border ${
                  Math.abs(expStats.ecartPct) < 15
                    ? 'bg-emerald-950/20 text-emerald-400 border-emerald-500/20'
                    : Math.abs(expStats.ecartPct) <= 25
                    ? 'bg-amber-950/20 text-amber-400 border-amber-500/20'
                    : 'bg-rose-950/20 text-rose-400 border-rose-500/20 animate-pulse'
                }`}>
                  Écart : {Math.abs(expStats.ecartPct) < 15 ? 'NORMAL' : Math.abs(expStats.ecartPct) <= 25 ? 'ATTENTION' : 'ALERTE'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                <div className="space-y-1.5 text-xs font-bold text-slate-300">
                  <div className="flex justify-between pb-1 border-b border-slate-800">
                    <span className="text-slate-500">Consommation réelle :</span>
                    <span className="text-white font-extrabold">{expStats.monthlyAnfo.toFixed(0)} kg</span>
                  </div>
                  <div className="flex justify-between pb-1 border-b border-slate-800">
                    <span className="text-slate-500">Consommation théorique :</span>
                    <span className="text-slate-400">{expStats.theorique.toFixed(0)} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Écart de consommation :</span>
                    <span className={`font-black ${expStats.ecart > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                      {expStats.ecart > 0 ? `+${expStats.ecart.toFixed(0)}` : expStats.ecart.toFixed(0)} kg ({expStats.ecartPct > 0 ? `+${expStats.ecartPct.toFixed(1)}` : expStats.ecartPct.toFixed(1)}%)
                    </span>
                  </div>
                </div>

                <div className="bg-slate-900/40 border border-slate-800 p-4 rounded-xl col-span-2">
                  <p className="text-slate-400 text-[10px] leading-relaxed font-semibold uppercase tracking-wide">
                    Le calcul théorique s'appuie sur le nombre de volées tirées ({expStats.monthlyRounds}) pondéré par les configurations enregistrées (Théorique 9m² : {platformSettings?.explosifs_9m2_anfo ?? 35} kg, 12m² : {platformSettings?.explosifs_12m2_anfo ?? 40} kg). Un écart positif indique un excédent de chargement d'ANFO en front de taille.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-[#0f172a] p-5 rounded-2xl border border-slate-800 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-white text-xs font-black uppercase tracking-widest">
                  Évolution de la Consommation d'Explosifs
                </h3>
                <span className="text-slate-500 text-[9px] uppercase font-bold tracking-wider">
                  Note: TOVEX est multiplié par 10 pour l'échelle visuelle
                </span>
              </div>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={dailyRows}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                    <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155' }} labelStyle={{ color: '#fff' }} />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                    <Line type="monotone" dataKey="anfo" name="ANFO (kg)" stroke="#f43f5e" strokeWidth={2} dot={{ r: 2 }} />
                    <Line type="monotone" dataKey="tovexTimes10" name="TOVEX × 10 (kg)" stroke="#f97316" strokeWidth={2} dot={{ r: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-[#0f172a] border border-slate-800 rounded-xl overflow-hidden mt-6">
              <div className="p-4 border-b border-slate-800 bg-[#0c1220]">
                <h3 className="text-white text-xs font-black uppercase tracking-widest">
                  Détail de la Consommation Journalière
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#0c1220] border-b border-slate-800 text-[9px] font-black tracking-wider uppercase text-slate-400">
                      <th className="p-3">Date</th>
                      <th className="p-3 text-right">ANFO (kg)</th>
                      <th className="p-3 text-right">TOVEX (kg)</th>
                      <th className="p-3 text-right">Amorces</th>
                      <th className="p-3 text-right">ANFO/m (kg/m)</th>
                      <th className="p-3 text-center">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850/50">
                    {dailyRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30 transition-colors">
                        <td className="p-3 text-white text-[11px] font-black uppercase">
                          {row.date}
                        </td>
                        <td className="p-3 text-right font-mono text-[11px] text-slate-300">
                          {row.anfo.toFixed(0)} kg
                        </td>
                        <td className="p-3 text-right font-mono text-[11px] text-slate-300">
                          {row.tovex.toFixed(1)} kg
                        </td>
                        <td className="p-3 text-right font-mono text-[11px] text-slate-300">
                          {row.amorces} u
                        </td>
                        <td className="p-3 text-right font-mono text-[11px] text-[#ffd700] font-bold">
                          {row.ratio.toFixed(2)} kg/m
                        </td>
                        <td className="p-3 text-center">
                          {row.statusLabel !== '-' ? (
                            <span className={`inline-flex px-2 py-0.5 text-[8px] font-black uppercase rounded ${row.statusClass}`}>
                              {row.statusLabel}
                            </span>
                          ) : (
                            <span className="text-slate-600 font-bold">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {dailyRows.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-500 font-bold text-[10px] uppercase">
                          Aucune donnée enregistrée pour ce mois ({explosifsMonth})
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'rapport' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <input
                type="month"
                value={rapportMonth}
                onChange={(e) => setRapportMonth(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-[#ffd700] text-[11px] font-black rounded-xl px-4 py-2.5 outline-none"
              />
            </div>

            <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 shadow-xl max-w-2xl mx-auto text-center space-y-6">
              <span className="text-4xl">📄</span>
              <div>
                <h3 className="text-white text-sm font-black uppercase tracking-wider">
                  Génération du Rapport Mensuel Officiel
                </h3>
                <p className="text-slate-400 text-[11px] font-semibold mt-1">
                  Générez un rapport de production consolidé au format PDF prêt à imprimer ou enregistrer.
                </p>
              </div>

              <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800 text-left space-y-2.5 max-w-md mx-auto text-[11px] font-bold">
                <div className="flex justify-between pb-1.5 border-b border-slate-850">
                  <span className="text-slate-500">Mois sélectionné :</span>
                  <span className="text-white uppercase font-black">{rapportMonth}</span>
                </div>
                <div className="flex justify-between pb-1.5 border-b border-slate-850">
                  <span className="text-slate-500">Données de production :</span>
                  <span className="text-slate-300 font-extrabold">{rapportHistory.length} jours disponibles</span>
                </div>
                <div className="flex justify-between pb-1.5 border-b border-slate-850">
                  <span className="text-slate-500">Validation Géomètre (MANAGEM) :</span>
                  <span className={rapportAttachement ? 'text-emerald-400' : 'text-amber-500'}>
                    {rapportAttachement ? '✅ Saisis (Officiel)' : '⚠️ Non saisis (Plateforme)'}
                  </span>
                </div>
                {rapportAttachement && (
                  <div className="flex justify-between text-emerald-400/90 text-[10px] uppercase font-black">
                    <span>Métrage officiel géomètre :</span>
                    <span>{rapportAttachement.totalMetrageGeometre.toFixed(1)} m</span>
                  </div>
                )}
              </div>

              <div>
                <button
                  onClick={generateMonthlyReport}
                  disabled={generatingPDF}
                  className="px-8 py-4 bg-[#ffd700] text-[#0f172a] text-[12px] font-black uppercase tracking-widest rounded-2xl hover:bg-yellow-300 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generatingPDF ? '⏳ Génération...' : '📄 Générer le Rapport Mensuel PDF'}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ia' && (
          <div className="space-y-6">
            <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 shadow-xl">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-850 mb-6">
                <div>
                  <h3 className="text-white text-xs font-black uppercase tracking-widest flex items-center gap-2">
                    <span>🤖</span> ASSISTANT DIRECTEUR TECHNIQUE
                  </h3>
                  <p className="text-slate-500 text-[10px] font-bold mt-0.5 uppercase tracking-wide">
                    Powered by Gemini — Analyse basée sur vos données réelles
                  </p>
                </div>
                <span className="bg-[#ffd700]/10 text-[#ffd700] border border-[#ffd700]/20 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-wider">
                  Ing. Hamid Bensalem — DT Senior SMI
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-slate-400 text-[9px] font-black uppercase tracking-wider mb-2.5">
                    Questions fréquentes du Directeur Technique
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                    {QUESTIONS_DT.map(q => (
                      <button
                        key={q}
                        onClick={() => {
                          setSelectedQuestion(q);
                          setDtQuestion(q);
                        }}
                        className={`px-4 py-3 rounded-xl text-[10px] font-black uppercase tracking-wider text-left transition-colors border ${
                          selectedQuestion === q
                            ? 'bg-[#ffd700] text-[#0f172a] border-[#ffd700]'
                            : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-700'
                        }`}
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2 pt-2">
                  <h4 className="text-slate-400 text-[9px] font-black uppercase tracking-wider">
                    Question libre ou demande de précision
                  </h4>
                  <textarea
                    value={dtQuestion}
                    onChange={(e) => {
                      setDtQuestion(e.target.value);
                      setSelectedQuestion(null);
                    }}
                    placeholder="Posez votre question technique..."
                    className="w-full bg-slate-900 border border-slate-800 text-white text-[11px] font-semibold rounded-xl px-4 py-3 resize-none h-24 outline-none focus:border-[#ffd700]/40 placeholder:text-slate-600 font-mono"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={callDtIA}
                    disabled={loadingDT || !dtQuestion}
                    className="px-6 py-3 bg-[#ffd700] text-[#0f172a] text-[11px] font-black uppercase tracking-wider rounded-xl hover:bg-yellow-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loadingDT ? '⏳ Analyse en cours...' : '🔍 Analyser'}
                  </button>
                </div>
              </div>

              {dtError && (
                <div className="bg-rose-950/20 border border-rose-500/20 text-rose-400 rounded-xl p-4 mt-6 text-[11px] font-semibold flex items-center gap-2">
                  <span>❌</span> {dtError}
                </div>
              )}

              {loadingDT && (
                <div className="bg-[#ffd700]/5 border border-[#ffd700]/10 text-[#ffd700] rounded-2xl p-6 mt-6 text-center animate-pulse">
                  <span className="text-2xl block mb-2">⏳</span>
                  <p className="text-[10px] font-black uppercase tracking-widest">
                    Hamid Bensalem analyse vos données de production...
                  </p>
                </div>
              )}

              {dtResponse && !loadingDT && (
                <div className="bg-[#0b0f19] border border-[#ffd700]/20 rounded-2xl p-6 mt-6 shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-1 h-full bg-[#ffd700]" />
                  <div className="flex items-center gap-3 mb-5 pb-3 border-b border-slate-800/60">
                    <span className="text-2xl">🤖</span>
                    <div>
                      <h4 className="text-[#ffd700] text-[11px] font-black uppercase tracking-widest">
                        Rapport d'Analyse de l'Expert
                      </h4>
                      <p className="text-slate-500 text-[8px] uppercase font-black tracking-wider mt-0.5">
                        Mine Souterraine d'Imiter — Confidentiel
                      </p>
                    </div>
                  </div>
                  <div className="whitespace-pre-wrap text-slate-200 text-[11.5px] leading-relaxed font-semibold font-mono">
                    {dtResponse}
                  </div>
                  <div className="text-slate-500 text-[9px] uppercase font-black tracking-widest mt-6 pt-3 border-t border-slate-800/40 text-right">
                    Analyse basée sur {rapportHistory.length} jours de données — SMI Imiter — Gemini 2.0 Flash
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
