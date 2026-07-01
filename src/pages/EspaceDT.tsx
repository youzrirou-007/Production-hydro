import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
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

  const [structuredResponse, setStructuredResponse] = useState<{
    analysis: string;
    anomalies: string[];
    suggestions: string[];
    logic?: string;
  } | null>(null);
  const [loaderStep, setLoaderStep] = useState(0);
  const [savedAnalyses, setSavedAnalyses] = useState<{
    id: string;
    date: string;
    question: string;
    response: {
      analysis: string;
      anomalies: string[];
      suggestions: string[];
      logic?: string;
    };
  }[]>([]);
  const [activeReportTab, setActiveReportTab] = useState<'synthese' | 'anomalies' | 'recommandations' | 'logique'>('synthese');

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
      (snap) => setAllChantiers(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      (err) => handleFirestoreError(err, OperationType.GET, 'chantiers')
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    setLoadingAttachement(true);
    const docId = `SMI_${selectedMois}`;
    const unsub = onSnapshot(
      doc(db, 'attachements', docId),
      (snap) => {
        if (snap.exists()) {
          setCurrentAttachement({ id: snap.id, ...snap.data() } as Attachement);
        } else {
          setCurrentAttachement(null);
        }
        setLoadingAttachement(false);
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, `attachements/${docId}`);
        setLoadingAttachement(false);
      }
    );
    return () => unsub();
  }, [selectedMois]);

  useEffect(() => {
    const q = query(collection(db, 'production'));
    const unsub = onSnapshot(
      q,
      (snap) => {
        setAllProductionDocs(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'production')
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(
      collection(db, 'attachements'),
      where('siteId', '==', 'SMI'),
      orderBy('mois', 'desc'),
      limit(6)
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setHistoriqueAttachements(
          snap.docs.map(d => ({ id: d.id, ...d.data() } as Attachement))
        );
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'attachements')
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    setLoadingJournal(true);
    const prodUnsub = onSnapshot(
      doc(db, 'production', journalDate),
      (snap) => {
        setJournalProduction(snap.exists() ? snap.data() : null);
        setLoadingJournal(false);
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, `production/${journalDate}`);
        setLoadingJournal(false);
      }
    );
    const planUnsub = onSnapshot(
      doc(db, 'daily_planning_sheets', journalDate),
      (snap) => setJournalPlanning(snap.exists() ? snap.data() : null),
      (err) => handleFirestoreError(err, OperationType.GET, `daily_planning_sheets/${journalDate}`)
    );
    const explUnsub = onSnapshot(
      query(
        collection(db, 'non_realisation_explanations'),
        where('date', '==', journalDate)
      ),
      (snap) => setJournalExplications(
        snap.docs.map(d => ({ id: d.id, ...d.data() }))
      ),
      (err) => handleFirestoreError(err, OperationType.GET, 'non_realisation_explanations')
    );
    return () => { prodUnsub(); planUnsub(); explUnsub(); };
  }, [journalDate]);

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'platform_settings', 'config'),
      (snap) => { if (snap.exists()) setPlatformSettings(snap.data()); },
      (err) => handleFirestoreError(err, OperationType.GET, 'platform_settings/config')
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
    const unsub = onSnapshot(
      q,
      (snap) => {
        setExplosifsHistory(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'production_history')
    );
    return () => unsub();
  }, [explosifsMonth]);

  useEffect(() => {
    const q = query(
      collection(db, 'production_history'),
      where('date', '>=', `${rapportMonth}-01`),
      where('date', '<=', `${rapportMonth}-31`),
      orderBy('date', 'asc')
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        setRapportHistory(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      },
      (err) => handleFirestoreError(err, OperationType.GET, 'production_history')
    );
    return () => unsub();
  }, [rapportMonth]);

  useEffect(() => {
    const unsub = onSnapshot(
      doc(db, 'attachements', `SMI_${rapportMonth}`),
      (snap) => setRapportAttachement(snap.exists() ? snap.data() : null),
      (err) => handleFirestoreError(err, OperationType.GET, `attachements/SMI_${rapportMonth}`)
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

  const CATEGORIZED_QUESTIONS_DT = [
    {
      category: "Rendement & Performance",
      icon: "📈",
      color: "amber",
      questions: [
        {
          label: "Secteur Moins Performant",
          q: "Quel secteur performe le moins bien ce mois-ci et pourquoi ?",
          desc: "Analyse des pertes d'avancement par zone de la SMI."
        },
        {
          label: "Alerte Rendement Foration",
          q: "Quel mineur décroche en termes de rendement m/volée ?",
          desc: "Contrôle individuel des performances de foration."
        }
      ]
    },
    {
      category: "Fiabilité & Audit de Données",
      icon: "🔍",
      color: "blue",
      questions: [
        {
          label: "Détection de Métrages Suspects",
          q: "Y a-t-il des chantiers dont les déclarations de métrage semblent suspectes ?",
          desc: "Audit de cohérence entre les déclarations SMI."
        },
        {
          label: "Consommation d'Explosifs",
          q: "Quelle est la tendance de consommation d'explosifs sur les 14 derniers jours ?",
          desc: "Suivi d'efficience et surcharges de chargement."
        }
      ]
    },
    {
      category: "Décisions & Anticipation",
      icon: "⚡",
      color: "gold",
      questions: [
        {
          label: "Priorités d'Amélioration SMI",
          q: "Quels sont les 3 points d'amélioration prioritaires pour le mois prochain ?",
          desc: "Décisions clés pour optimiser les cycles."
        },
        {
          label: "Projection d'Objectifs",
          q: "La projection fin de mois est-elle en ligne avec les objectifs ?",
          desc: "Calcul prédictif et extrapolations d'avancement."
        },
        {
          label: "Rapport Flash de Direction",
          q: "Générer un rapport flash d'optimisation d'urgence pour le Comité de Direction.",
          desc: "Synthèse stratégique d'impact prête à présenter."
        }
      ]
    }
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

  const callDtIA = async (overrideQuestion?: string) => {
    const questionToUse = overrideQuestion || dtQuestion;
    if (!questionToUse) return;
    setLoadingDT(true);
    setDtResponse(null);
    setStructuredResponse(null);
    setDtError(null);
    setLoaderStep(0);
    try {
      const response = await fetch('/api/ia/expert-analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          expertName: 'M. ELYAAKOUBY HAMID',
          profile: `Directeur Technique de la SMI avec une expertise chevronnée dans les mines souterraines d'argent au Maroc. Expert en optimisation de production, gestion des explosifs, rendement des équipes de foreurs et analyse des performances de chantier. Il répond toujours de manière directe, avec des chiffres précis et des décisions concrètes. Il identifie le problème et donne la solution.`,
          dataContext: dtProductionData,
          customQuestion: questionToUse,
        }),
      });
      if (!response.ok) throw new Error(`Erreur ${response.status}`);
      const data = await response.json();
      
      const structuredData = {
        analysis: data.analysis || '',
        anomalies: data.anomalies || [],
        suggestions: data.suggestions || [],
        logic: data.logic || ''
      };

      setStructuredResponse(structuredData);

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

      // Save to local history
      setSavedAnalyses(prev => [
        {
          id: Date.now().toString(),
          date: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          question: questionToUse,
          response: structuredData
        },
        ...prev
      ]);
      setActiveReportTab('synthese');
    } catch (err: any) {
      setDtError(err.message || 'Erreur de connexion');
    } finally {
      setLoadingDT(false);
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loadingDT) {
      setLoaderStep(0);
      interval = setInterval(() => {
        setLoaderStep(prev => (prev < 4 ? prev + 1 : prev));
      }, 850);
    }
    return () => clearInterval(interval);
  }, [loadingDT]);

  return (
    <div className="min-h-screen bg-[#f8fafc]">
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
                ? 'bg-[#ffd700] text-[#0f172a] shadow-md'
                : 'bg-slate-800/60 text-slate-300 hover:bg-slate-700/60 hover:text-white'
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
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="date"
                  value={journalDate}
                  onChange={(e) => setJournalDate(e.target.value)}
                  className="bg-white border border-slate-200 text-[#b8860b] text-[11px] font-black rounded-xl px-4 py-2.5 outline-none shadow-sm"
                />
                <div className="flex gap-1.5">
                  <button
                    onClick={() => changeJournalDate(-1)}
                    className="px-3 py-2 bg-white text-slate-700 text-[10px] font-black uppercase rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm"
                  >
                    ← Hier
                  </button>
                  <button
                    onClick={() => setJournalDate(new Date().toISOString().split('T')[0])}
                    className="px-3 py-2 bg-white text-slate-700 text-[10px] font-black uppercase rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm"
                  >
                    Aujourd'hui
                  </button>
                  <button
                    onClick={() => changeJournalDate(1)}
                    className="px-3 py-2 bg-white text-slate-700 text-[10px] font-black uppercase rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors shadow-sm"
                  >
                    Demain →
                  </button>
                </div>
              </div>

              {/* Ruban de performance journalier en haut pour M. ELYAAKOUBY HAMID */}
              <div className="flex flex-wrap gap-2.5">
                <div className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 flex items-center gap-2 shadow-sm">
                  <span className="text-sm">⛏️</span>
                  <div>
                    <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Forage Global</p>
                    <p className="text-[10px] text-slate-800 font-extrabold">
                      {bilan.totalReel.toFixed(1)} / {bilan.totalPlan.toFixed(1)} m
                    </p>
                  </div>
                  {bilan.totalPlan > 0 && (
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-black border ${
                      (bilan.totalReel / bilan.totalPlan) >= 0.9
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : (bilan.totalReel / bilan.totalPlan) >= 0.7
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      {((bilan.totalReel / bilan.totalPlan) * 100).toFixed(0)}%
                    </span>
                  )}
                </div>

                <div className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 flex items-center gap-2 shadow-sm">
                  <span className="text-sm">🚛</span>
                  <div>
                    <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">Wagons Extraits</p>
                    <p className="text-[10px] text-slate-800 font-extrabold">
                      {bilan.totalWagonsReel} / {bilan.totalWagonsPlan} u
                    </p>
                  </div>
                  {bilan.totalWagonsPlan > 0 && (
                    <span className={`px-1.5 py-0.5 rounded text-[8px] font-black border ${
                      (bilan.totalWagonsReel / bilan.totalWagonsPlan) >= 0.9
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : (bilan.totalWagonsReel / bilan.totalWagonsPlan) >= 0.7
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}>
                      {((bilan.totalWagonsReel / bilan.totalWagonsPlan) * 100).toFixed(0)}%
                    </span>
                  )}
                </div>

                <div className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 flex items-center gap-2 shadow-sm">
                  <span className="text-sm">💥</span>
                  <div>
                    <p className="text-[8px] text-slate-400 font-bold uppercase tracking-wider">ANFO Consommé</p>
                    <p className="text-[10px] text-rose-600 font-extrabold">{bilan.totalAnfo.toFixed(0)} kg</p>
                  </div>
                </div>

                <div className={`border rounded-xl px-3 py-1.5 flex items-center gap-2 shadow-sm ${
                  bilan.totalNonRealises > 0
                    ? 'bg-amber-50/50 border-amber-200 text-amber-800'
                    : 'bg-emerald-50/50 border-emerald-200 text-emerald-800'
                }`}>
                  <span className="text-sm">{bilan.totalNonRealises > 0 ? '⚠️' : '✅'}</span>
                  <div>
                    <p className="text-[8px] font-bold uppercase tracking-wider">Incidents</p>
                    <p className="text-[10px] font-extrabold">{bilan.totalNonRealises} tirs avortés</p>
                  </div>
                </div>
              </div>
            </div>

            {loadingJournal ? (
              <div className="flex items-center justify-center h-64 text-[#b8860b] font-black text-[11px] uppercase tracking-widest animate-pulse">
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

                    let borderClass = 'border-slate-200';
                    let statusLabel = 'NON SAISI';
                    let statusClass = 'bg-slate-100 text-slate-500 border-slate-200';

                    if (isSealed) {
                      borderClass = 'border-emerald-500';
                      statusLabel = 'SCELLÉ';
                      statusClass = 'bg-emerald-50 text-emerald-700 border-emerald-200';
                    } else if (exists) {
                      borderClass = 'border-amber-500';
                      statusLabel = 'EN COURS';
                      statusClass = 'bg-amber-50 text-amber-700 border-amber-200';
                    }

                    const shiftAnfo = posteData?.minage?.reduce((s: number, r: any) => s + Number(r.reel?.anfo || r.anfo || 0), 0) || 0;
                    const shiftTovex = posteData?.minage?.reduce((s: number, r: any) => s + Number(r.reel?.tovex || r.tovex || 0), 0) || 0;
                    const shiftAmorces = posteData?.minage?.reduce((s: number, r: any) => s + Number(r.reel?.ammorces || r.reel?.amorces || r.ammorces || r.amorces || 0), 0) || 0;

                    const shiftExplications = journalExplications.filter(e => String(e.poste || e.shift) === String(n));

                    return (
                      <div key={n} className={`bg-white border-2 ${borderClass} rounded-2xl p-5 flex flex-col justify-between shadow-md`}>
                        <div>
                          <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
                            <div>
                              <h3 className="text-[#b8860b] font-black text-sm tracking-wider uppercase">{label}</h3>
                              <p className="text-slate-400 text-[10px] font-bold mt-0.5">{hours}</p>
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

                              let badgeColor = 'text-slate-500 bg-slate-50 border-slate-200';
                              if (rate !== null) {
                                if (rate >= 90) badgeColor = 'text-emerald-700 bg-emerald-50 border-emerald-200';
                                else if (rate >= 70) badgeColor = 'text-amber-700 bg-amber-50 border-amber-200';
                                else badgeColor = 'text-rose-700 bg-rose-50 border-rose-200';
                              }

                              return (
                                <div key={secteur} className="flex items-center justify-between py-1 border-b border-slate-100 last:border-0 last:pb-0">
                                  <div className="text-slate-700 text-[10px] font-bold uppercase">{secteur}</div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-slate-400 text-[9px]">
                                      Pl: <span className="text-slate-500">{totalPlan.toFixed(1)}m</span>
                                    </span>
                                    <span className="text-slate-400 text-[9px]">
                                      R: <span className="text-[#00BFFF] font-black">{totalReel.toFixed(1)}m</span>
                                    </span>
                                    <span className={`px-1 rounded text-[8.5px] font-black border ${badgeColor}`}>
                                      {rate !== null ? `${rate.toFixed(0)}%` : '-'}
                                    </span>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          <div className="mt-5 space-y-2 border-t border-slate-100 pt-3">
                            <h4 className="text-slate-400 text-[9px] font-black uppercase tracking-wider">Explosifs Consommés</h4>
                            <div className="grid grid-cols-3 gap-2 text-center">
                              <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-200/60">
                                <span className="text-rose-600 text-[10px] font-black">{shiftAnfo.toFixed(0)} kg</span>
                                <p className="text-slate-400 text-[8px] uppercase font-bold tracking-wider mt-0.5">ANFO</p>
                              </div>
                              <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-200/60">
                                <span className="text-orange-600 text-[10px] font-black">{shiftTovex.toFixed(1)} kg</span>
                                <p className="text-slate-400 text-[8px] uppercase font-bold tracking-wider mt-0.5">TOVEX</p>
                              </div>
                              <div className="bg-slate-50 p-1.5 rounded-lg border border-slate-200/60">
                                <span className="text-amber-600 text-[10px] font-black">{shiftAmorces} u</span>
                                <p className="text-slate-400 text-[8px] uppercase font-bold tracking-wider mt-0.5">AMORCES</p>
                              </div>
                            </div>
                          </div>
                        </div>

                        {shiftExplications.length > 0 ? (
                          <div className="mt-4 space-y-1.5 border-t border-slate-100 pt-3">
                            <div className="text-rose-600 text-[8.5px] font-black uppercase tracking-wider flex items-center gap-1">
                              <span>⚠️</span> Justifications ({shiftExplications.length})
                            </div>
                            <div className="max-h-[140px] overflow-y-auto space-y-1.5 pr-1">
                              {shiftExplications.map((exp, idx) => (
                                <div key={idx} className="bg-rose-50 border border-rose-200 rounded-lg p-2 text-[9px]">
                                  <div className="flex justify-between font-bold text-slate-700">
                                    <span className="text-rose-700 font-extrabold uppercase">{exp.chantierName || exp.chantierId || 'Chantier'}</span>
                                    <span className="text-slate-400 text-[8px]">Par {exp.author || exp.saisiPar || 'Auteur'}</span>
                                  </div>
                                  <p className="text-slate-600 mt-1 italic font-semibold">"{exp.explanation || exp.reason || exp.raison || 'Sans explication'}"</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="text-slate-400 text-[8.5px] uppercase font-bold tracking-wider mt-4 border-t border-slate-100 pt-3">
                            ✅ Aucun tir avorté signalé
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-md mt-6">
                  <h3 className="text-[#b8860b] text-xs font-black uppercase tracking-widest mb-4">
                    Bilan de la Journée
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-center">
                      <span className="text-slate-400 text-[9px] uppercase font-bold tracking-wider">Avancement Forage</span>
                      <div className="text-sky-600 text-lg font-black mt-1">
                        {bilan.totalReel.toFixed(1)} / {bilan.totalPlan.toFixed(1)} m
                      </div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">
                        {bilan.totalPlan > 0 ? `${((bilan.totalReel / bilan.totalPlan) * 100).toFixed(0)}% de réalisation` : '-'}
                      </p>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-center">
                      <span className="text-slate-400 text-[9px] uppercase font-bold tracking-wider">Wagons Extraits</span>
                      <div className="text-slate-800 text-lg font-black mt-1">
                        {bilan.totalWagonsReel} / {bilan.totalWagonsPlan} u
                      </div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">
                        {bilan.totalWagonsPlan > 0 ? `${((bilan.totalWagonsReel / bilan.totalWagonsPlan) * 100).toFixed(0)}% de réalisation` : '-'}
                      </p>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-center">
                      <span className="text-slate-400 text-[9px] uppercase font-bold tracking-wider">ANFO Consommé</span>
                      <div className="text-rose-600 text-lg font-black mt-1">
                        {bilan.totalAnfo.toFixed(0)} kg
                      </div>
                      <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mt-1">Cumulative de jour</p>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 p-3.5 rounded-xl text-center">
                      <span className="text-slate-400 text-[9px] uppercase font-bold tracking-wider">Tirs Avortés</span>
                      <div className={`text-lg font-black mt-1 ${bilan.totalNonRealises > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {bilan.totalNonRealises}
                      </div>
                      <p className="text-[9px] text-slate-400 uppercase font-black tracking-widest mt-1">Total excuses</p>
                    </div>

                    <div className="bg-amber-50/50 border border-amber-200 p-3.5 rounded-xl text-center col-span-2 md:col-span-1">
                      <span className="text-amber-700 text-[9px] uppercase font-black tracking-widest">Rapport Posté</span>
                      <div className="text-slate-800 text-[11px] font-black uppercase mt-1">
                        SMI Imiter
                      </div>
                      <p className="text-[9px] text-slate-500 uppercase font-bold mt-1">
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
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <input
                  type="month"
                  value={selectedMois}
                  onChange={(e) => setSelectedMois(e.target.value)}
                  className="bg-white border border-slate-200 text-[#b8860b] text-[11px] font-black rounded-xl px-4 py-2.5 outline-none shadow-sm"
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
                  className="px-5 py-2.5 bg-[#ffd700] text-[#0f172a] text-[10px] font-black uppercase tracking-wider rounded-xl hover:bg-yellow-300 transition-colors shadow-sm"
                >
                  📐 Saisir Données Géomètres — {selectedMois}
                </button>
              </div>
            </div>

            {saisieMode && (
              <div className="fixed inset-0 z-50 bg-[#0a0f1a]/80 backdrop-blur-md overflow-y-auto p-6 flex items-center justify-center">
                <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-2xl p-6 shadow-2xl">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
                    <div>
                      <h2 className="text-[#b8860b] font-black text-lg uppercase tracking-wider">
                        Saisie Attachements — {selectedMois}
                      </h2>
                      <p className="text-slate-400 text-[10px] uppercase font-bold tracking-widest mt-0.5">
                        Données officielles des géomètres — MANAGEM SMI
                      </p>
                    </div>
                    <button
                      onClick={() => setSaisieMode(false)}
                      className="text-slate-400 hover:text-slate-600 font-black uppercase text-xs"
                    >
                      Fermer
                    </button>
                  </div>

                  <div className="space-y-1 max-h-[60vh] overflow-y-auto pr-2">
                    {saisieData.map((c, idx) => (
                      <div key={idx} className="grid grid-cols-[1fr_120px_80px_140px] gap-3 items-center py-3 border-b border-slate-100">
                        <div>
                          <div className="text-slate-800 text-[11px] font-black uppercase">
                            {c.chantierName}
                          </div>
                          <div className="text-slate-400 text-[9px] uppercase">
                            {c.secteur} — {c.galleryType}m²
                          </div>
                        </div>
                        <div className="text-slate-500 text-[10px] font-bold">
                          {c.galleryType === '9' ? 'Traçage 9m²' : 'Galerie 12m²'}
                        </div>
                        <div className="text-[#b8860b] text-[9px] font-black uppercase">
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
                          className="bg-white border border-slate-200 text-slate-800 text-[11px] font-black rounded-lg px-3 py-2 outline-none focus:border-[#b8860b] text-right"
                        />
                      </div>
                    ))}
                  </div>

                  <div className="flex justify-between items-center border-t border-slate-100 pt-4 mt-4">
                    <div className="text-[#b8860b] text-xl font-black">
                      TOTAL GÉOMÈTRES : {saisieData.reduce((s, c) => s + c.metrageGeometre, 0).toFixed(1)} m
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => setSaisieMode(false)}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-black uppercase tracking-wider rounded-xl transition-colors"
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
              <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center shadow-sm">
                <div className="text-slate-400 text-3xl mb-3">📐</div>
                <div className="text-[#b8860b] text-[12px] font-black uppercase tracking-widest mb-2">
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
                  className="px-6 py-3 bg-[#ffd700] text-[#0f172a] text-[10px] font-black uppercase tracking-wider rounded-xl hover:bg-yellow-300 transition-colors shadow-sm"
                >
                  Saisir les données géomètres
                </button>
              </div>
            ) : (
              <div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                    <div className="text-slate-400 text-[9px] font-black uppercase tracking-wider">
                      Métrage Géomètre Total
                    </div>
                    <div className="text-[#b8860b] text-2xl font-black mt-1">
                      {currentAttachement.totalMetrageGeometre.toFixed(1)} m
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                    <div className="text-slate-400 text-[9px] font-black uppercase tracking-wider">
                      Métrage Plateforme Total
                    </div>
                    <div className="text-slate-800 text-2xl font-black mt-1">
                      {totalPlatef.toFixed(1)} m
                    </div>
                  </div>

                  <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                    <div className="text-slate-400 text-[9px] font-black uppercase tracking-wider">
                      Écart Global
                    </div>
                    <div className={`text-2xl font-black mt-1 ${
                      globalEcartPct > 25 ? 'text-rose-600' : globalEcartPct > 10 ? 'text-amber-600' : 'text-emerald-600'
                    }`}>
                      {ecartGlobal > 0 ? `+${ecartGlobal.toFixed(1)}` : ecartGlobal.toFixed(1)} m ({globalEcartPct > 0 ? `+${globalEcartPct.toFixed(1)}` : globalEcartPct.toFixed(1)}%)
                    </div>
                  </div>

                  <div className={`border rounded-xl p-4 shadow-sm ${
                    globalFiab.label === 'FIABLE' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-amber-50 border-amber-200 text-amber-700'
                  }`}>
                    <div className="text-[9px] font-black uppercase tracking-wider">
                      Score de Fiabilité
                    </div>
                    <div className="text-2xl font-black mt-1 flex items-center gap-2">
                      <span>{globalFiab.icon}</span>
                      {globalFiab.label}
                    </div>
                  </div>
                </div>

                {suspectChantiers.length > 0 && (
                  <div className="bg-rose-50 border border-rose-200 text-rose-850 p-4 rounded-xl mb-6 flex items-start gap-3 shadow-sm">
                    <span className="text-xl">⚠️</span>
                    <div>
                      <h3 className="text-xs font-black uppercase tracking-wider text-rose-700">
                        DÉCLARATION SUSPECTE — Écart &gt; 25% — Audit recommandé
                      </h3>
                      <p className="text-[10px] mt-1 text-rose-600 uppercase tracking-wide">
                        Les chantiers suivants présentent un excédent de déclaration critique : {suspectChantiers.map(c => c.chantierName).join(', ')}
                      </p>
                    </div>
                  </div>
                )}

                <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mb-6 shadow-sm">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 border-b border-slate-200 text-[9px] font-black tracking-wider uppercase text-slate-500">
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
                      <tbody className="divide-y divide-slate-100">
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
                                suspect ? 'bg-rose-50/50 hover:bg-rose-50' : 'hover:bg-slate-50/50'
                              }`}
                            >
                              <td className="p-3">
                                <div className="text-slate-800 text-[11px] font-black uppercase">
                                  {c.chantierName}
                                </div>
                              </td>
                              <td className="p-3">
                                <div className="text-slate-500 text-[10px] font-bold">
                                  {c.galleryType === '9' ? 'Traçage 9m²' : 'Galerie 12m²'}
                                </div>
                              </td>
                              <td className="p-3">
                                <div className="text-slate-400 text-[10px] font-bold uppercase">
                                  {c.secteur}
                                </div>
                              </td>
                              <td className="p-3 text-right font-mono text-[11px] text-slate-600">
                                {c.metrageGeometre.toFixed(1)} m
                              </td>
                              <td className="p-3 text-right font-mono text-[11px] text-sky-600 font-bold">
                                {platef.toFixed(1)} m
                              </td>
                              <td className={`p-3 text-right font-mono text-[11px] font-bold ${
                                ecart > 0 ? 'text-rose-600' : ecart < 0 ? 'text-sky-600' : 'text-slate-500'
                              }`}>
                                {ecart > 0 ? `+${ecart.toFixed(1)}` : ecart.toFixed(1)} m
                              </td>
                              <td className={`p-3 text-right font-mono text-[11px] font-bold ${
                                ecartPct > 25 ? 'text-rose-600' : ecartPct > 10 ? 'text-amber-600' : 'text-emerald-600'
                              }`}>
                                {ecartPct > 0 ? `+${ecartPct.toFixed(1)}` : ecartPct.toFixed(1)}%
                              </td>
                              <td className="p-3 text-center">
                                <span className={`inline-flex px-2 py-0.5 border text-[8.5px] font-black uppercase rounded ${
                                  suspect
                                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                                    : fiab.label === 'FIABLE'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                    : 'bg-amber-50 text-amber-700 border-amber-200'
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
                      <div key={idx} className="bg-rose-50 border border-rose-350 text-rose-800 p-4 rounded-xl flex items-start gap-3 shadow-sm">
                        <span className="text-xl">🚨</span>
                        <div>
                          <h3 className="text-xs font-black uppercase tracking-wider text-rose-700">
                            ANOMALIE SYSTÉMATIQUE — {anom.chantierName}
                          </h3>
                          <p className="text-[10px] mt-1 text-rose-600 uppercase tracking-wide font-bold">
                            Déclare systématiquement plus que le réalisé réel. {anom.consecutiveMonths} mois consécutifs d'excédent détecté. Audit physique requis.
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                <div className="mt-8">
                  <h3 className="text-[#b8860b] text-[11px] font-black uppercase tracking-widest mb-4">
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
                        <div key={idx} className="bg-white border border-slate-200 rounded-xl p-3 text-center shadow-sm">
                          <div className="text-slate-400 text-[10px] font-black uppercase">
                            {hist.mois}
                          </div>
                          <div className={`text-sm font-black mt-1 ${
                            histEcartPct > 25 ? 'text-rose-600' : histEcartPct > 10 ? 'text-amber-600' : 'text-emerald-600'
                          }`}>
                            {histEcartPct > 0 ? `+${histEcartPct.toFixed(1)}` : histEcartPct.toFixed(1)}%
                          </div>
                          <div className="mt-2">
                            <span className={`px-1.5 py-0.5 text-[8px] font-black uppercase rounded border ${
                              histEcartPct > 25
                                ? 'bg-rose-50 text-rose-700 border-rose-200'
                                : histFiab.label === 'FIABLE'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border-amber-200'
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
                className="bg-white border border-slate-200 text-[#b8860b] text-[11px] font-black rounded-xl px-4 py-2.5 outline-none shadow-sm"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <span className="text-slate-400 text-[9px] font-black uppercase tracking-wider">ANFO Consommé</span>
                <div className="text-slate-800 text-2xl font-black mt-1">
                  {expStats.monthlyAnfo.toFixed(0)} kg
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <span className="text-slate-400 text-[9px] font-black uppercase tracking-wider">Tovex Consommé</span>
                <div className="text-slate-800 text-2xl font-black mt-1">
                  {expStats.monthlyTovex.toFixed(1)} kg
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm">
                <span className="text-slate-400 text-[9px] font-black uppercase tracking-wider">Amorces Utilisées</span>
                <div className="text-slate-800 text-2xl font-black mt-1">
                  {expStats.monthlyAmorces} u
                </div>
              </div>

              <div className="bg-white border border-amber-200 rounded-xl p-4 shadow-sm">
                <span className="text-amber-700 text-[9px] font-black uppercase tracking-wider">Ratio Moyen ANFO / Mètre</span>
                <div className="text-amber-800 text-2xl font-black mt-1">
                  {expStats.avgAnfoPerMeter.toFixed(2)} kg/m
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-slate-800 text-xs font-black uppercase tracking-widest">
                  Comparaison Réel vs Théorique (ANFO)
                </h3>
                <span className={`px-2.5 py-1 text-[9px] font-black rounded uppercase border ${
                  Math.abs(expStats.ecartPct) < 15
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : Math.abs(expStats.ecartPct) <= 25
                    ? 'bg-amber-50 text-amber-700 border-amber-200'
                    : 'bg-rose-50 text-rose-700 border-rose-200'
                }`}>
                  Écart : {Math.abs(expStats.ecartPct) < 15 ? 'NORMAL' : Math.abs(expStats.ecartPct) <= 25 ? 'ATTENTION' : 'ALERTE'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                <div className="space-y-1.5 text-xs font-bold text-slate-700">
                  <div className="flex justify-between pb-1 border-b border-slate-100">
                    <span className="text-slate-400">Consommation réelle :</span>
                    <span className="text-slate-800 font-extrabold">{expStats.monthlyAnfo.toFixed(0)} kg</span>
                  </div>
                  <div className="flex justify-between pb-1 border-b border-slate-100">
                    <span className="text-slate-400">Consommation théorique :</span>
                    <span className="text-slate-500">{expStats.theorique.toFixed(0)} kg</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Écart de consommation :</span>
                    <span className={`font-black ${expStats.ecart > 0 ? 'text-rose-600' : 'text-emerald-650'}`}>
                      {expStats.ecart > 0 ? `+${expStats.ecart.toFixed(0)}` : expStats.ecart.toFixed(0)} kg ({expStats.ecartPct > 0 ? `+${expStats.ecartPct.toFixed(1)}` : expStats.ecartPct.toFixed(1)}%)
                    </span>
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl col-span-2">
                  <p className="text-slate-500 text-[10px] leading-relaxed font-semibold uppercase tracking-wide">
                    Le calcul théorique s'appuie sur le nombre de volées tirées ({expStats.monthlyRounds}) pondéré par les configurations enregistrées (Théorique 9m² : {platformSettings?.explosifs_9m2_anfo ?? 35} kg, 12m² : {platformSettings?.explosifs_12m2_anfo ?? 40} kg). Un écart positif indique un excédent de chargement d'ANFO en front de taille.
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-slate-800 text-xs font-black uppercase tracking-widest">
                  Évolution de la Consommation d'Explosifs
                </h3>
                <span className="text-slate-400 text-[9px] uppercase font-bold tracking-wider">
                  Note: TOVEX est multiplié par 10 pour l'échelle visuelle
                </span>
              </div>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={dailyRows}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 10 }} />
                    <YAxis tick={{ fill: '#64748b', fontSize: 10 }} />
                    <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0' }} labelStyle={{ color: '#0f172a' }} />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                    <Line type="monotone" dataKey="anfo" name="ANFO (kg)" stroke="#f43f5e" strokeWidth={2} dot={{ r: 2 }} />
                    <Line type="monotone" dataKey="tovexTimes10" name="TOVEX × 10 (kg)" stroke="#f97316" strokeWidth={2} dot={{ r: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden mt-6 shadow-sm">
              <div className="p-4 border-b border-slate-200 bg-slate-50">
                <h3 className="text-slate-800 text-xs font-black uppercase tracking-widest">
                  Détail de la Consommation Journalière
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-[9px] font-black tracking-wider uppercase text-slate-500">
                      <th className="p-3">Date</th>
                      <th className="p-3 text-right">ANFO (kg)</th>
                      <th className="p-3 text-right">TOVEX (kg)</th>
                      <th className="p-3 text-right">Amorces</th>
                      <th className="p-3 text-right">ANFO/m (kg/m)</th>
                      <th className="p-3 text-center">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {dailyRows.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-3 text-slate-800 text-[11px] font-black uppercase">
                          {row.date}
                        </td>
                        <td className="p-3 text-right font-mono text-[11px] text-slate-600">
                          {row.anfo.toFixed(0)} kg
                        </td>
                        <td className="p-3 text-right font-mono text-[11px] text-slate-600">
                          {row.tovex.toFixed(1)} kg
                        </td>
                        <td className="p-3 text-right font-mono text-[11px] text-slate-600">
                          {row.amorces} u
                        </td>
                        <td className="p-3 text-right font-mono text-[11px] text-[#b8860b] font-bold">
                          {row.ratio.toFixed(2)} kg/m
                        </td>
                        <td className="p-3 text-center">
                          {row.statusLabel !== '-' ? (
                            <span className={`inline-flex px-2 py-0.5 text-[8px] font-black uppercase rounded ${
                              row.statusLabel === 'SCELLÉ'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}>
                              {row.statusLabel}
                            </span>
                          ) : (
                            <span className="text-slate-400 font-bold">-</span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {dailyRows.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-400 font-bold text-[10px] uppercase">
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
                className="bg-white border border-slate-200 text-[#b8860b] text-[11px] font-black rounded-xl px-4 py-2.5 outline-none shadow-sm"
              />
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm max-w-2xl mx-auto text-center space-y-6">
              <span className="text-4xl block">📄</span>
              <div>
                <h3 className="text-[#b8860b] text-sm font-black uppercase tracking-wider">
                  Génération du Rapport Mensuel Officiel
                </h3>
                <p className="text-slate-500 text-[11px] font-semibold mt-1">
                  Générez un rapport de production consolidé au format PDF prêt à imprimer ou enregistrer.
                </p>
              </div>

              <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 text-left space-y-2.5 max-w-md mx-auto text-[11px] font-bold">
                <div className="flex justify-between pb-1.5 border-b border-slate-200">
                  <span className="text-slate-400">Mois sélectionné :</span>
                  <span className="text-slate-800 uppercase font-black">{rapportMonth}</span>
                </div>
                <div className="flex justify-between pb-1.5 border-b border-slate-200">
                  <span className="text-slate-400">Données de production :</span>
                  <span className="text-slate-700 font-extrabold">{rapportHistory.length} jours disponibles</span>
                </div>
                <div className="flex justify-between pb-1.5 border-b border-slate-200">
                  <span className="text-slate-400">Validation Géomètre (MANAGEM) :</span>
                  <span className={rapportAttachement ? 'text-emerald-700' : 'text-amber-700'}>
                    {rapportAttachement ? '✅ Saisis (Officiel)' : '⚠️ Non saisis (Plateforme)'}
                  </span>
                </div>
                {rapportAttachement && (
                  <div className="flex justify-between text-emerald-750 text-[10px] uppercase font-black">
                    <span>Métrage officiel géomètre :</span>
                    <span>{rapportAttachement.totalMetrageGeometre.toFixed(1)} m</span>
                  </div>
                )}
              </div>

              <div>
                <button
                  onClick={generateMonthlyReport}
                  disabled={generatingPDF}
                  className="px-8 py-4 bg-[#ffd700] text-[#0f172a] text-[12px] font-black uppercase tracking-widest rounded-2xl hover:bg-yellow-300 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generatingPDF ? '⏳ Génération...' : '📄 Générer le Rapport Mensuel PDF'}
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'ia' && (
          <div className="space-y-6">
            {/* 1. Header de l'expert */}
            <div className="bg-gradient-to-r from-slate-900 to-slate-800 border border-slate-700/30 rounded-2xl p-6 shadow-lg relative overflow-hidden">
              <div className="absolute right-0 top-0 h-full w-1/3 opacity-5 pointer-events-none bg-no-repeat bg-right-bottom bg-[radial-gradient(ellipse_at_bottom_right,_var(--tw-gradient-stops))] from-amber-400 via-yellow-500 to-transparent"></div>
              
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex items-start sm:items-center gap-4">
                  <div className="relative flex-shrink-0">
                    <div className="w-14 h-14 bg-gradient-to-br from-amber-500 to-[#ffd700] rounded-2xl flex items-center justify-center font-black text-[#0f172a] text-lg shadow-md border-2 border-[#ffd700]/30">
                      EH
                    </div>
                    <span className="absolute -bottom-1 -right-1 bg-emerald-500 border-2 border-slate-900 w-4.5 h-4.5 rounded-full flex items-center justify-center shadow-md">
                      <span className="w-2 h-2 bg-white rounded-full animate-ping"></span>
                    </span>
                  </div>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-white text-base font-black uppercase tracking-wider">
                        M. ELYAAKOUBY HAMID
                      </h3>
                      <span className="bg-amber-400/10 text-amber-300 border border-amber-400/20 px-2.5 py-0.5 rounded-full text-[8.5px] font-black uppercase tracking-widest">
                        Directeur Technique de la SMI
                      </span>
                    </div>
                    <p className="text-slate-300 text-[11px] font-medium mt-1 leading-relaxed">
                      Expert chevronné de la mine d'argent souterraine. Optimisation des chantiers, rendement foration (Montabert T23), maîtrise des explosifs et prises de décisions chiffrées d'urgence.
                    </p>
                    <div className="flex items-center gap-2 mt-2 text-[9px] text-emerald-400 font-bold uppercase tracking-wider">
                      <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                      Moteur IA Gemini 2.0 Flash — Connecté en direct sur la base SMI
                    </div>
                  </div>
                </div>

                {/* Bouton de réinitialisation rapide si besoin */}
                {(structuredResponse || dtResponse) && (
                  <button
                    onClick={() => {
                      setDtResponse(null);
                      setStructuredResponse(null);
                      setSelectedQuestion(null);
                      setDtQuestion('');
                    }}
                    className="self-start lg:self-center px-4 py-2 border border-slate-700 text-slate-300 hover:text-white hover:border-slate-500 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all"
                  >
                    🔄 Nouvelle analyse
                  </button>
                )}
              </div>
            </div>

            {/* 2. Tableau de bord opérationnel immédiat (KPI pré-calculés) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-400 to-[#ffd700]" />
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-[8.5px] font-black uppercase tracking-wider">Avancement Mensuel</span>
                  <span className="text-xs">⛏️</span>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-lg font-black text-slate-800">
                    {(() => {
                      const totalMetersReel = rapportHistory.reduce((s, d) => s + (d.totalMeterageRealised || 0), 0);
                      return totalMetersReel.toFixed(1);
                    })()} m
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    / {(() => {
                      const totalMetersPlan = rapportHistory.reduce((s, d) => s + (d.totalMeteragePlanned || 0), 0);
                      return totalMetersPlan.toFixed(1);
                    })()} m
                  </span>
                </div>
                <div className="mt-2.5 flex items-center gap-1.5">
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-amber-500 h-full rounded-full transition-all duration-500" 
                      style={{ 
                        width: `${(() => {
                          const totalMetersReel = rapportHistory.reduce((s, d) => s + (d.totalMeterageRealised || 0), 0);
                          const totalMetersPlan = rapportHistory.reduce((s, d) => s + (d.totalMeteragePlanned || 0), 0);
                          const pct = totalMetersPlan > 0 ? (totalMetersReel / totalMetersPlan) * 100 : 0;
                          return Math.min(100, pct);
                        })()}%` 
                      }}
                    />
                  </div>
                  <span className="text-[9px] font-black text-amber-600">
                    {(() => {
                      const totalMetersReel = rapportHistory.reduce((s, d) => s + (d.totalMeterageRealised || 0), 0);
                      const totalMetersPlan = rapportHistory.reduce((s, d) => s + (d.totalMeteragePlanned || 0), 0);
                      return (totalMetersPlan > 0 ? (totalMetersReel / totalMetersPlan) * 100 : 0).toFixed(0);
                    })()}%
                  </span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-indigo-500" />
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-[8.5px] font-black uppercase tracking-wider">Ratio de Chargement</span>
                  <span className="text-xs">💥</span>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-lg font-black text-slate-800">
                    {(() => {
                      const totalMetersReel = rapportHistory.reduce((s, d) => s + (d.totalMeterageRealised || 0), 0);
                      const totalAnfoCons = rapportHistory.reduce((s, d) => s + (d.totalAnfo || 0), 0);
                      const ratio = totalMetersReel > 0 ? totalAnfoCons / totalMetersReel : 0;
                      return ratio.toFixed(2);
                    })()} kg
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    ANFO / m
                  </span>
                </div>
                <div className="mt-2.5 flex items-center justify-between">
                  <span className="text-[8px] text-slate-400 font-black uppercase tracking-wide">
                    Consommation totale :
                  </span>
                  <span className="text-[9px] font-extrabold text-slate-700 font-mono">
                    {(() => {
                      const totalAnfoCons = rapportHistory.reduce((s, d) => s + (d.totalAnfo || 0), 0);
                      return totalAnfoCons.toLocaleString('fr-FR');
                    })()} kg
                  </span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-400 to-teal-500" />
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-[8.5px] font-black uppercase tracking-wider">Densité Wagons / Mètre</span>
                  <span className="text-xs">🚛</span>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-lg font-black text-slate-800">
                    {(() => {
                      const totalMetersReel = rapportHistory.reduce((s, d) => s + (d.totalMeterageRealised || 0), 0);
                      const wagonsTotalReel = rapportHistory.reduce((s, d) => s + (d.totalWagonsRealised || 0), 0);
                      const ratio = totalMetersReel > 0 ? wagonsTotalReel / totalMetersReel : 0;
                      return ratio.toFixed(2);
                    })()} u
                  </span>
                  <span className="text-[10px] text-slate-400 font-semibold">
                    wagons / m
                  </span>
                </div>
                <div className="mt-2.5 flex items-center justify-between">
                  <span className="text-[8px] text-slate-400 font-black uppercase tracking-wide">
                    Extraction totale :
                  </span>
                  <span className="text-[9px] font-extrabold text-slate-700">
                    {(() => {
                      const wagonsTotalReel = rapportHistory.reduce((s, d) => s + (d.totalWagonsRealised || 0), 0);
                      return wagonsTotalReel;
                    })()} wagons
                  </span>
                </div>
              </div>

              <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-400 to-pink-500" />
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 text-[8.5px] font-black uppercase tracking-wider">Fiabilité Données Géomètre</span>
                  <span className="text-xs">📐</span>
                </div>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-lg font-black text-slate-800">
                    {rapportAttachement ? 'OFFICIEL' : 'ESTIMÉ'}
                  </span>
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${
                    rapportAttachement ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                  }`}>
                    {rapportAttachement ? 'Validé' : 'SMI Plateforme'}
                  </span>
                </div>
                <div className="mt-2.5 flex items-center justify-between">
                  <span className="text-[8px] text-slate-400 font-black uppercase tracking-wide">
                    Écarts de tir détectés :
                  </span>
                  <span className="text-[9px] font-extrabold text-rose-600">
                    {(() => {
                      const hasGeo = !!rapportAttachement;
                      if (!hasGeo) return 0;
                      return rapportHistory.filter(d => Math.abs((d.totalMeterageRealised || 0) - (d.totalMeteragePlanned || 0)) > 3).length;
                    })()} anomalies
                  </span>
                </div>
              </div>
            </div>

            {/* 3. Zone principale en deux colonnes si historique disponible */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
              
              {/* Colonne gauche (2/3 de l'espace) - Formulaire de question et raccourcis */}
              <div className="xl:col-span-2 space-y-6">
                
                {/* Raccourcis IA catégorisés */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
                  <div>
                    <h4 className="text-[#b8860b] text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                      <span className="w-1.5 h-3 bg-[#b8860b] rounded-full"></span>
                      Raccourcis Décisionnels d'un Clic (M. ELYAAKOUBY HAMID)
                    </h4>
                    <p className="text-slate-400 text-[9px] font-bold mt-1 uppercase tracking-wider">
                      Cliquez sur une macro-commande pour lancer une analyse profonde instantanée des données
                    </p>
                  </div>

                  <div className="space-y-4">
                    {CATEGORIZED_QUESTIONS_DT.map((cat, idx) => (
                      <div key={idx} className="space-y-2">
                        <div className="flex items-center gap-1.5 pb-1 border-b border-slate-100">
                          <span className="text-xs">{cat.icon}</span>
                          <span className="text-slate-700 text-[9px] font-black uppercase tracking-wider">{cat.category}</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {cat.questions.map((item, qIdx) => (
                            <button
                              key={qIdx}
                              onClick={() => {
                                setSelectedQuestion(item.q);
                                setDtQuestion(item.q);
                                callDtIA(item.q);
                              }}
                              className={`px-4 py-3 rounded-xl text-left border transition-all flex flex-col justify-between h-22 group ${
                                selectedQuestion === item.q
                                  ? 'bg-gradient-to-br from-amber-500 to-[#ffd700] text-[#0f172a] border-amber-400 shadow-md transform scale-[1.01]'
                                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-amber-50/50 hover:border-amber-200/60'
                              }`}
                            >
                              <div>
                                <p className={`text-[10px] font-black uppercase tracking-wider ${
                                  selectedQuestion === item.q ? 'text-[#0f172a]' : 'text-slate-800'
                                }`}>
                                  {item.label}
                                </p>
                                <p className={`text-[8.5px] font-semibold mt-1 leading-normal ${
                                  selectedQuestion === item.q ? 'text-[#0f172a]/80' : 'text-slate-400 group-hover:text-slate-500'
                                }`}>
                                  {item.desc}
                                </p>
                              </div>
                              <span className={`text-[7.5px] font-black uppercase tracking-widest mt-2 self-end px-2 py-0.5 rounded-md ${
                                selectedQuestion === item.q 
                                  ? 'bg-[#0f172a] text-[#ffd700]' 
                                  : 'bg-white border border-slate-200 text-slate-500'
                              }`}>
                                {selectedQuestion === item.q ? '⚡ ACTIF' : '🔍 EXÉCUTER'}
                              </span>
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Formulaire de question libre */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                  <div>
                    <h4 className="text-slate-800 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                      <span className="w-1.5 h-3 bg-slate-600 rounded-full"></span>
                      Demande personnalisée ou instruction libre
                    </h4>
                    <p className="text-slate-400 text-[9px] font-bold mt-1 uppercase tracking-wider">
                      Saisissez une question précise sur un chantier, un foreur, une consommation d'explosif ou une anomalie
                    </p>
                  </div>

                  <div className="relative">
                    <textarea
                      value={dtQuestion}
                      onChange={(e) => {
                        setDtQuestion(e.target.value);
                        setSelectedQuestion(null);
                      }}
                      placeholder="Exemple: Pourquoi le chantier Imiter Est a connu une baisse de rendement de foration du perforateur Montabert T23 du 12 au 15 ?"
                      className="w-full bg-slate-50 border border-slate-200 text-slate-800 text-[11px] font-medium rounded-xl px-4 py-3 resize-none h-24 outline-none focus:bg-white focus:border-amber-500 placeholder:text-slate-400 font-mono transition-all shadow-inner"
                    />
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-[8.5px] text-slate-400 font-black uppercase tracking-wider">
                      {dtQuestion.length} caractères saisis
                    </span>
                    <button
                      onClick={() => callDtIA()}
                      disabled={loadingDT || !dtQuestion}
                      className="px-6 py-3 bg-gradient-to-r from-amber-500 to-[#ffd700] text-[#0f172a] text-[10px] font-black uppercase tracking-widest rounded-xl hover:shadow-md transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {loadingDT ? (
                        <>
                          <span className="w-3 h-3 border-2 border-[#0f172a] border-t-transparent rounded-full animate-spin"></span>
                          ANALYSE EN COURS...
                        </>
                      ) : (
                        <>
                          <span>⚡</span> EXECUTER L'ANALYSE EXPERTE
                        </>
                      )}
                    </button>
                  </div>
                </div>

              </div>

              {/* Colonne droite (1/3 de l'espace) - Historique de la session et info-expert */}
              <div className="space-y-6">
                
                {/* Historique des analyses de la session */}
                <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h4 className="text-slate-800 text-[10px] font-black uppercase tracking-widest">
                      📋 Historique Session
                    </h4>
                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[8px] font-black">
                      {savedAnalyses.length} analyses
                    </span>
                  </div>

                  {savedAnalyses.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 text-[10px] uppercase font-bold space-y-2">
                      <span className="text-2xl block opacity-30">⏳</span>
                      <p>Aucun audit lancé dans cette session</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                      {savedAnalyses.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => {
                            setStructuredResponse(item.response);
                            setDtResponse(
                              [
                                item.response.analysis,
                                item.response.anomalies?.length ? '\n\n⚠️ Anomalies :\n' + item.response.anomalies.join('\n') : '',
                                item.response.suggestions?.length ? '\n\n✅ Recommandations :\n' + item.response.suggestions.join('\n') : ''
                              ].filter(Boolean).join('')
                            );
                            setDtQuestion(item.question);
                            setSelectedQuestion(item.question);
                          }}
                          className="w-full text-left p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-amber-300 hover:bg-amber-50/20 transition-all text-[9.5px] font-semibold flex flex-col justify-between gap-1.5 group"
                        >
                          <div className="flex justify-between items-center text-[8px] text-slate-400 uppercase font-black">
                            <span>🕒 {item.date}</span>
                            <span className="text-amber-600 opacity-0 group-hover:opacity-100 transition-opacity">Charger 📂</span>
                          </div>
                          <p className="text-slate-700 line-clamp-2 font-mono uppercase tracking-wide">
                            {item.question}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bloc d'aide technique / Normes de la mine d'argent d'Imiter */}
                <div className="bg-slate-900 border border-slate-800 text-slate-300 rounded-2xl p-6 shadow-md space-y-4 relative overflow-hidden">
                  <div className="absolute right-0 bottom-0 text-[100px] text-slate-800 font-bold select-none leading-none opacity-20 pointer-events-none translate-y-10 translate-x-10">
                    SMI
                  </div>
                  <h4 className="text-amber-400 text-[9px] font-black uppercase tracking-widest">
                    ℹ️ Normes de Référence SMI
                  </h4>
                  <ul className="space-y-2.5 text-[9.5px] font-semibold text-slate-400">
                    <li className="flex items-start gap-2">
                      <span className="text-amber-400 text-xs mt-0.5">▪</span>
                      <div>
                        <strong className="text-slate-200">Rendement de foration :</strong> Standard de 1.2 à 1.5 mètres de volée par tir pour les perforateurs Montabert T23.
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-400 text-xs mt-0.5">▪</span>
                      <div>
                        <strong className="text-slate-200">Maîtrise Explosifs :</strong> Norme stricte de max 50 kg d'ANFO par volée d'avancement pour limiter le surbreak et sécuriser la structure.
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-amber-400 text-xs mt-0.5">▪</span>
                      <div>
                        <strong className="text-slate-200">Taux d'avancement :</strong> Objectif théorique mensuel de 120m par chantier de traçage actif.
                      </div>
                    </li>
                  </ul>
                </div>

              </div>

            </div>

            {/* 4. Etats d'Erreur */}
            {dtError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl p-5 text-[11px] font-black flex items-center gap-3 shadow-sm">
                <span className="text-xl">❌</span> 
                <div>
                  <p className="uppercase tracking-wider">Erreur de traitement d'audit</p>
                  <p className="text-slate-500 font-bold mt-0.5 font-mono">{dtError}</p>
                </div>
              </div>
            )}

            {/* 5. Progressive Interactive Loader Simulator */}
            {loadingDT && (
              <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-8 shadow-xl text-center space-y-6 max-w-2xl mx-auto">
                <div className="flex justify-center items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></span>
                  <p className="text-[#ffd700] text-[10px] font-black uppercase tracking-widest">
                    MOTEUR DE SYNTHÈSE M. ELYAAKOUBY HAMID ACTIF
                  </p>
                </div>
                
                <div>
                  <h4 className="text-white text-sm font-black uppercase tracking-wider">
                    Diagnostic Opérationnel SMI en cours...
                  </h4>
                  <p className="text-slate-400 text-[10.5px] font-medium mt-1">
                    Analyse comparative et calculs d'écarts par rapport aux normes d'ingénierie souterraine.
                  </p>
                </div>

                <div className="bg-slate-900 rounded-xl p-5 border border-slate-800 text-left space-y-3.5 max-w-md mx-auto">
                  <div className="flex items-center gap-3">
                    <span className="text-xs">{loaderStep >= 1 ? '✅' : '⏳'}</span>
                    <span className={`text-[10px] font-semibold ${loaderStep >= 1 ? 'text-emerald-400 font-bold' : 'text-slate-400'}`}>
                      Lecture des données opérationnelles SMI ({rapportHistory.length} jours)
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs">{loaderStep >= 2 ? '✅' : loaderStep === 1 ? '⏳' : '⚪'}</span>
                    <span className={`text-[10px] font-semibold ${loaderStep >= 2 ? 'text-emerald-400 font-bold' : loaderStep === 1 ? 'text-slate-300' : 'text-slate-500'}`}>
                      Audit de cohérence fiches vs métrages Géomètre
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs">{loaderStep >= 3 ? '✅' : loaderStep === 2 ? '⏳' : '⚪'}</span>
                    <span className={`text-[10px] font-semibold ${loaderStep >= 3 ? 'text-emerald-400 font-bold' : loaderStep === 2 ? 'text-slate-300' : 'text-slate-500'}`}>
                      Calcul des indices d'explosifs ANFO/mètre
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs">{loaderStep >= 4 ? '✅' : loaderStep === 3 ? '⏳' : '⚪'}</span>
                    <span className={`text-[10px] font-semibold ${loaderStep >= 4 ? 'text-emerald-400 font-bold' : loaderStep === 3 ? 'text-slate-300' : 'text-slate-500'}`}>
                      Analyse de rendement d'avancement des perforateurs Montabert T23
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs">{loaderStep === 4 ? '⏳' : '⚪'}</span>
                    <span className={`text-[10px] font-semibold ${loaderStep === 4 ? 'text-amber-400 font-bold animate-pulse' : 'text-slate-500'}`}>
                      Formulation des décisions stratégiques du Directeur Technique
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* 6. GOD LEVEL REPORT VIEWER BOARD */}
            {structuredResponse && !loadingDT && (
              <div className="bg-white border border-slate-300 rounded-2xl shadow-xl overflow-hidden relative transition-all">
                
                {/* En-tête style document officiel de la mine d'Imiter */}
                <div className="bg-gradient-to-r from-slate-900 to-[#1e293b] text-white p-6 border-b border-[#ffd700]/30 relative">
                  <div className="absolute right-6 top-6 bg-[#ffd700]/10 text-[#ffd700] border border-[#ffd700]/30 px-3 py-1 rounded-md text-[8px] font-black uppercase tracking-widest">
                    STRICTEMENT CONFIDENTIEL — USAGE INTERNE
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <span className="text-3xl">🛡️</span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] text-[#ffd700] font-black uppercase tracking-widest">SMI Imiter — Groupe Managem</span>
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Direction Technique</span>
                      </div>
                      <h4 className="text-base font-black uppercase tracking-wider text-white mt-1">
                        Rapport Diagnostic & Recommandations d'Ingénierie
                      </h4>
                      <p className="text-[9px] font-bold text-slate-400 uppercase tracking-wide mt-0.5 font-mono">
                        Édité pour le mois : {rapportMonth} — Basé sur {rapportHistory.length} fiches journalières consolidées
                      </p>
                    </div>
                  </div>
                </div>

                {/* Onglets interactifs à l'intérieur du rapport pour une lecture propre */}
                <div className="bg-slate-50 border-b border-slate-200 flex flex-wrap gap-1 px-4 pt-3">
                  <button
                    onClick={() => setActiveReportTab('synthese')}
                    className={`px-4 py-2 rounded-t-xl text-[10px] font-black uppercase tracking-wider transition-all border-t border-x ${
                      activeReportTab === 'synthese'
                        ? 'bg-white border-slate-200 text-[#b8860b] shadow-sm font-black translate-y-[1px] z-10'
                        : 'border-transparent text-slate-500 hover:text-slate-800 bg-transparent'
                    }`}
                  >
                    📊 Synthèse d'Analyse
                  </button>
                  <button
                    onClick={() => setActiveReportTab('anomalies')}
                    className={`px-4 py-2 rounded-t-xl text-[10px] font-black uppercase tracking-wider transition-all border-t border-x relative ${
                      activeReportTab === 'anomalies'
                        ? 'bg-white border-slate-200 text-[#b8860b] shadow-sm font-black translate-y-[1px] z-10'
                        : 'border-transparent text-slate-500 hover:text-slate-800 bg-transparent'
                    }`}
                  >
                    ⚠️ Anomalies Détectées
                    {structuredResponse.anomalies.length > 0 && (
                      <span className="ml-1.5 bg-rose-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full font-mono">
                        {structuredResponse.anomalies.length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveReportTab('recommandations')}
                    className={`px-4 py-2 rounded-t-xl text-[10px] font-black uppercase tracking-wider transition-all border-t border-x ${
                      activeReportTab === 'recommandations'
                        ? 'bg-white border-slate-200 text-[#b8860b] shadow-sm font-black translate-y-[1px] z-10'
                        : 'border-transparent text-slate-500 hover:text-slate-800 bg-transparent'
                    }`}
                  >
                    💡 Recommandations Opérationnelles
                    {structuredResponse.suggestions.length > 0 && (
                      <span className="ml-1.5 bg-emerald-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full font-mono">
                        {structuredResponse.suggestions.length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setActiveReportTab('logique')}
                    className={`px-4 py-2 rounded-t-xl text-[10px] font-black uppercase tracking-wider transition-all border-t border-x ${
                      activeReportTab === 'logique'
                        ? 'bg-white border-slate-200 text-[#b8860b] shadow-sm font-black translate-y-[1px] z-10'
                        : 'border-transparent text-slate-500 hover:text-slate-800 bg-transparent'
                    }`}
                  >
                    🧠 Logique & Méthode
                  </button>
                </div>

                {/* Contenu du rapport */}
                <div className="p-6 relative">
                  
                  {/* Filigrane CONFIDENTIEL en arrière-plan */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-[0.02] pointer-events-none select-none">
                    <span className="text-[120px] font-black uppercase tracking-widest border-[20px] border-amber-950 p-10 rotate-12">
                      SMI IMITER
                    </span>
                  </div>

                  {activeReportTab === 'synthese' && (
                    <div className="space-y-4">
                      <div className="bg-amber-50/40 border border-amber-100 rounded-xl p-4 mb-4 text-[11px] font-semibold text-amber-900 leading-relaxed">
                        🤖 <strong className="uppercase font-black text-amber-950">Synthèse Générée par l'IA :</strong> Les résultats ci-dessous reflètent une analyse approfondie des performances de foration et de consommation.
                      </div>
                      <div className="whitespace-pre-wrap text-slate-800 text-[11px] leading-relaxed font-semibold font-mono bg-slate-50 border border-slate-200 p-6 rounded-2xl shadow-inner max-h-[450px] overflow-y-auto">
                        {structuredResponse.analysis}
                      </div>
                    </div>
                  )}

                  {activeReportTab === 'anomalies' && (
                    <div className="space-y-3">
                      {structuredResponse.anomalies.length === 0 ? (
                        <div className="text-center py-12 bg-emerald-50/20 border border-emerald-100 rounded-2xl text-emerald-800 font-bold text-[11px] uppercase">
                          🎉 Aucune anomalie critique détectée par le Directeur Technique pour ce mois.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-2.5">
                          {structuredResponse.anomalies.map((anom, idx) => (
                            <div key={idx} className="bg-rose-50/50 border border-rose-200 rounded-xl p-4 flex items-start gap-3 shadow-sm hover:bg-rose-50 transition-colors">
                              <span className="text-lg mt-0.5">⚠️</span>
                              <div>
                                <p className="text-[10px] font-black text-rose-900 uppercase tracking-wider">
                                  Anomalie Opérationnelle #{idx + 1}
                                </p>
                                <p className="text-slate-800 text-[10.5px] font-semibold mt-1 font-mono leading-relaxed">
                                  {anom}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {activeReportTab === 'recommandations' && (
                    <div className="space-y-3">
                      {structuredResponse.suggestions.length === 0 ? (
                        <div className="text-center py-12 bg-slate-50 border border-slate-200 rounded-2xl text-slate-500 font-bold text-[11px] uppercase">
                          Aucune suggestion générée pour ce rapport.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 gap-3">
                          {structuredResponse.suggestions.map((sugg, idx) => (
                            <div key={idx} className="bg-emerald-50/40 border border-emerald-100 rounded-xl p-4 flex items-start gap-3 shadow-sm hover:bg-emerald-50/80 transition-colors">
                              <span className="text-lg mt-0.5">💡</span>
                              <div className="flex-1">
                                <div className="flex justify-between items-center">
                                  <p className="text-[10px] font-black text-emerald-950 uppercase tracking-wider">
                                    Décision d'Urgence #{idx + 1}
                                  </p>
                                  <span className="bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider">
                                    À Appliquer
                                  </span>
                                </div>
                                <p className="text-slate-800 text-[10.5px] font-semibold mt-1.5 font-mono leading-relaxed">
                                  {sugg}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {activeReportTab === 'logique' && (
                    <div className="space-y-4">
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3">
                        <h5 className="text-slate-800 text-[10px] font-black uppercase tracking-wider">
                          🧬 Cadre Analytique d'Expertise
                        </h5>
                        <p className="text-slate-600 text-[10.5px] font-medium leading-relaxed">
                          Cette analyse a été automatisée à l'aide des règles de l'art du Directeur Technique. Elle applique les règles de logique d'ingénierie minière souterraine suivantes :
                        </p>
                        
                        <div className="bg-white border border-slate-200 rounded-xl p-4 text-[10.5px] font-mono leading-relaxed text-slate-800 max-h-[300px] overflow-y-auto">
                          {structuredResponse.logic || (
                            "Logique standard de rendement : Écart d'avancement m/tir par rapport à la grille de tir SMI standard. Analyse de charge explosive volumique par volée de traçage pour corréler la surconsommation d'explosif au mauvais rendement de tir."
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                </div>

                {/* Pied de page du rapport avec actions de partage / copie */}
                <div className="bg-slate-50 border-t border-slate-200 p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-slate-400 text-[8.5px] uppercase font-black tracking-widest font-mono">
                    Document généré électroniquement par M. ELYAAKOUBY HAMID twin
                  </div>
                  
                  <div className="flex gap-2 w-full sm:w-auto">
                    <button
                      onClick={() => {
                        const plainText = `RAPPORT DE DIAGNOSTIC - DIRECTION TECHNIQUE SMI\nMois: ${rapportMonth}\n\nSYNTHÈSE TECHNIQUE:\n${structuredResponse.analysis}\n\nANOMALIES DÉTECTÉES:\n${structuredResponse.anomalies.map((a, i) => `${i+1}. ${a}`).join('\n')}\n\nRECOMMANDATIONS:\n${structuredResponse.suggestions.map((s, i) => `${i+1}. ${s}`).join('\n')}\n\nSMI IMITER - DOCUMENT CONFIDENTIEL`;
                        navigator.clipboard.writeText(plainText);
                        alert('Rapport copié dans le presse-papiers sous format e-mail professionnel !');
                      }}
                      className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5"
                    >
                      📋 Copier pour E-mail
                    </button>
                    <button
                      onClick={() => {
                        window.print();
                      }}
                      className="flex-1 sm:flex-none px-4 py-2.5 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 rounded-xl text-[9px] font-black uppercase tracking-widest transition-colors flex items-center justify-center gap-1.5"
                    >
                      🖨️ Imprimer la Note
                    </button>
                  </div>
                </div>

              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
};
