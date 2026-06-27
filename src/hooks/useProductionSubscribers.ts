import { useEffect } from 'react';
import { collection, query, onSnapshot, doc, orderBy, deleteDoc, where } from 'firebase/firestore';
import { db } from '../lib/firebase';

interface SubscribersProps {
  setSelectedDate: (date: string) => void;
  selectedDate: string;
  setDataHistory: (records: any[]) => void;
  setChantiers: (chantiers: any[]) => void;
  setEmployees: (employees: any[]) => void;
  setEngines: (engines: any[]) => void;
  setPlannings: (plannings: any[]) => void;
  setPlatformSettings: (settings: any) => void;
  setAllPlanningSheets: (sheets: any[]) => void;
  setAllProductionDocs: (docs: any[]) => void;
  setIsMonthClosed: (closed: boolean) => void;
  setUnexplainedGaps: (count: number) => void;
}

export const useProductionSubscribers = ({
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
}: SubscribersProps) => {
  // Real-time snapshot subscribers
  useEffect(() => {
    const unsubHist = onSnapshot(query(collection(db, 'production_history'), orderBy('lastUpdated', 'desc')), (snapshot) => {
      const records = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setDataHistory(records);
      records.forEach(async (rec) => {
        if (rec.id !== '2026-06-24') {
          try { await deleteDoc(doc(db, 'production_history', rec.id)); } catch {}
        }
      });
    });

    const unsubChan = onSnapshot(query(collection(db, 'chantiers')), (snap) => {
      setChantiers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubRH = onSnapshot(query(collection(db, 'personnel')), (snap) => {
      setEmployees(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubEngs = onSnapshot(query(collection(db, 'engines')), (snap) => {
      setEngines(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubPlan = onSnapshot(query(collection(db, 'planning')), (snap) => {
      setPlannings(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    const unsubSettings = onSnapshot(doc(db, 'settings', 'platform'), (docSnap) => {
      if (docSnap.exists()) {
        const d = docSnap.data();
        setPlatformSettings({
          sectors: d.sectors || ['Imiter 1', 'Imiter 2', 'Imiter Est'],
          engines: d.engines || ['ST2D', 'ST2G 1', 'ST2G 3', 'ST2G 4', 'ST2G 5', 'ST2G6'],
          oils: d.oils || ['Huile Moteur 15W40', 'Huile Hydraulique HV46', 'Huile Hydraulique HV68', 'Huile Transmission SAE30', 'Huile Transmission SAE50', 'Graisse Extrême Pression'],
          defaultWagonsTarget: d.defaultWagonsTarget ?? 48
        });
      }
    });

    const unsubDailyPlannings = onSnapshot(query(collection(db, 'daily_planning_sheets')), (snapshot) => {
      const sheets = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
      setAllPlanningSheets(sheets);
      sheets.forEach(async (sheet) => {
        if (sheet.id === '2026-06-14') {
          try { await deleteDoc(doc(db, 'daily_planning_sheets', '2026-06-14')); } catch {}
        }
      });
    });

    const unsubProduction = onSnapshot(query(collection(db, 'production')), (snapshot) => {
      setAllProductionDocs(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    });

    return () => { 
      unsubHist(); unsubChan(); unsubRH(); unsubEngs(); unsubPlan(); 
      unsubSettings(); unsubDailyPlannings(); unsubProduction();
    };
  }, []);

  // Closed month subscriber
  useEffect(() => {
    if (!selectedDate) return;
    const unsubClosure = onSnapshot(doc(db, 'settings', 'closures'), (docSnap) => {
      setIsMonthClosed(docSnap.exists() ? !!docSnap.data()[selectedDate.substring(0, 7)] : false);
    });
    return () => unsubClosure();
  }, [selectedDate]);

  // Unexplained gaps subscriber
  useEffect(() => {
    if (!selectedDate) return;
    const q = query(
      collection(db, 'non_realisation_explanations'),
      where('date', '==', selectedDate),
      where('status', '==', 'pending')
    );
    const unsubGaps = onSnapshot(q, (snap) => {
      setUnexplainedGaps(snap.size);
    }, (err) => {
      console.error("Error reading gaps: ", err);
    });
    return () => unsubGaps();
  }, [selectedDate]);
};
