import React, { useEffect, useState, useContext } from 'react';
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

// Cette plateforme HydroMines Production est dédiée exclusivement au site SMI Imiter.
// Le site actif est figé volontairement : aucune bascule vers un autre chantier n'est possible.
// Les autres chantiers disposeront de leurs propres applications clonées.
const ACTIVE_SITE_ID = 'SMI';

const SiteContext = React.createContext<{
  activeSiteId: string;
  siteConfig: SiteConfig | null;
  loadingSite: boolean;
}>({
  activeSiteId: ACTIVE_SITE_ID,
  siteConfig: null,
  loadingSite: true,
});

export const SiteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [siteConfig, setSiteConfig] = useState<SiteConfig | null>(null);
  const [loadingSite, setLoadingSite] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'sites', ACTIVE_SITE_ID), (snap) => {
      if (snap.exists()) {
        setSiteConfig({ id: snap.id, ...snap.data() } as SiteConfig);
      } else {
        setSiteConfig(null);
      }
      setLoadingSite(false);
    }, () => setLoadingSite(false));
    return () => unsub();
  }, []);

  return (
    <SiteContext.Provider value={{ activeSiteId: ACTIVE_SITE_ID, siteConfig, loadingSite }}>
      {children}
    </SiteContext.Provider>
  );
};

export const useSite = () => useContext(SiteContext);
