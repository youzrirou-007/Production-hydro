import React, { useState, useEffect, useContext } from 'react';
import { db } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export interface SiteConfig {
  id: string;
  name: string;
  minerai: string;
  type: 'souterrain' | 'ciel_ouvert' | 'autre';
  roche: { coefficient: string; description: string };
  taillant: { diametre: number; type: string };
  secteurs: string[];
  galleryTypes: string[];
  postes: number;
  createdAt?: string;
}

const SiteContext = React.createContext<{
  activeSiteId: string;
  setActiveSiteId: (id: string) => void;
  siteConfig: SiteConfig | null;
  loadingSite: boolean;
}>({
  activeSiteId: 'SMI',
  setActiveSiteId: () => {},
  siteConfig: null,
  loadingSite: true,
});

export const SiteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeSiteId, setActiveSiteId] = useState<string>('SMI');
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
  const [loadingSite, setLoadingSite] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'sites', activeSiteId), (snap) => {
      if (snap.exists()) {
        setSiteConfig({ id: snap.id, ...snap.data() } as SiteConfig);
      } else {
        setSiteConfig(null);
      }
      setLoadingSite(false);
    }, () => setLoadingSite(false));
    return () => unsub();
  }, [activeSiteId]);

  return (
    <SiteContext.Provider value={{ activeSiteId, setActiveSiteId, siteConfig, loadingSite }}>
      {children}
    </SiteContext.Provider>
  );
};

export const useSite = () => useContext(SiteContext);
