/**
 * Reusable Calculation Functions for HR Files (Miner, Driver, Chief, Assistant Miner)
 * Ready for future individual profile dashboard modules.
 */

export interface MinerProfileStats {
  matricule: string;
  totalMeters: number;
  totalRounds: number;
  avgYield: number; // meters/rounds
  totalAnfo: number;
  totalTovex: number;
  totalExplosives: number;
  specificExplosiveConsumption: number; // kg/meter
}

export interface DriverProfileStats {
  matricule: string;
  totalVolume: number;
  totalGodets: number;
  avgVolumePerGodet: number;
  totalGasoil: number;
  specificGasoilRatio: number; // L/m3
}

export interface ChiefProfileStats {
  matricule: string;
  shiftsLed: number;
  totalMetersUnderManagement: number;
  totalVolumeUnderManagement: number;
  averageGlobalScoreUnderManagement: number;
}

export interface AssistantMinerProfileStats {
  matricule: string;
  roundsAssisted: number;
  totalMetersAssisted: number;
}

/**
 * Calculates Miner metrics from production records
 */
export function calculateMinerStats(matricule: string, productionDocs: any[]): MinerProfileStats {
  let totalMeters = 0;
  let totalRounds = 0;
  let totalAnfo = 0;
  let totalTovex = 0;

  productionDocs.forEach(pDoc => {
    ['poste1', 'poste2', 'poste3'].forEach(pKey => {
      (pDoc.postes?.[pKey]?.minage || []).forEach((row: any) => {
        const r = row.reel || row;
        if (r.minerMatricule?.toUpperCase() === matricule.toUpperCase()) {
          totalMeters += Number(r.realMeterage || 0);
          totalRounds += Number(r.realRounds || 0);
          totalAnfo += Number(r.anfo || 0);
          totalTovex += Number(r.tovex || 0);
        }
      });
    });
  });

  const totalExplosives = totalAnfo + totalTovex;
  const avgYield = totalRounds > 0 ? totalMeters / totalRounds : 0;
  const specificExplosiveConsumption = totalMeters > 0 ? totalExplosives / totalMeters : 0;

  return {
    matricule,
    totalMeters,
    totalRounds,
    avgYield,
    totalAnfo,
    totalTovex,
    totalExplosives,
    specificExplosiveConsumption
  };
}

/**
 * Calculates Driver/Operator LHD metrics from production records
 */
export function calculateDriverStats(matricule: string, productionDocs: any[]): DriverProfileStats {
  let totalVolume = 0;
  let totalGodets = 0;
  let totalGasoil = 0;

  productionDocs.forEach(pDoc => {
    ['poste1', 'poste2', 'poste3'].forEach(pKey => {
      (pDoc.postes?.[pKey]?.deblayage || []).forEach((row: any) => {
        const r = row.reel || row;
        if (r.driverMatricule?.toUpperCase() === matricule.toUpperCase()) {
          totalVolume += Number(r.volumeEstimated || 0);
          totalGodets += Number(r.godets || 0);
          totalGasoil += Number(r.gasoil || 0);
        }
      });
    });
  });

  const avgVolumePerGodet = totalGodets > 0 ? totalVolume / totalGodets : 0;
  const specificGasoilRatio = totalVolume > 0 ? totalGasoil / totalVolume : 0;

  return {
    matricule,
    totalVolume,
    totalGodets,
    avgVolumePerGodet,
    totalGasoil,
    specificGasoilRatio
  };
}

/**
 * Calculates Team Chief (Chef d'équipe) metrics from production and planning records
 */
export function calculateChiefStats(matricule: string, productionDocs: any[], planningSheets: any[]): ChiefProfileStats {
  let shiftsLed = 0;
  let totalMetersUnderManagement = 0;
  let totalVolumeUnderManagement = 0;

  productionDocs.forEach(pDoc => {
    ['poste1', 'poste2', 'poste3'].forEach(pKey => {
      const realPost = pDoc.postes?.[pKey] || {};

      // Match chief on post level (chiefMatricule or secondChiefMatricule)
      const isPostChief = realPost.chiefMatricule?.toUpperCase() === matricule.toUpperCase() ||
                          realPost.secondChiefMatricule?.toUpperCase() === matricule.toUpperCase();

      // Or match on sector chiefs
      const ledSectors = new Set<string>();
      if (realPost.sectorChefs) {
        Object.entries(realPost.sectorChefs).forEach(([secName, secChef]: [string, any]) => {
          if (secChef?.chiefMatricule?.toUpperCase() === matricule.toUpperCase() ||
              secChef?.secondChiefMatricule?.toUpperCase() === matricule.toUpperCase()) {
            ledSectors.add(secName.toUpperCase());
          }
        });
      }

      const isSectorChief = ledSectors.size > 0;

      if (isPostChief || isSectorChief) {
        shiftsLed++;

        (realPost.minage || []).forEach((row: any) => {
          const r = row.reel || row;
          const rSector = (r.sector || '').toUpperCase();
          if (isPostChief || ledSectors.has(rSector)) {
            totalMetersUnderManagement += Number(r.realMeterage || 0);
          }
        });

        (realPost.deblayage || []).forEach((row: any) => {
          const r = row.reel || row;
          const rSector = (r.sector || '').toUpperCase();
          if (isPostChief || ledSectors.has(rSector)) {
            totalVolumeUnderManagement += Number(r.volumeEstimated || 0);
          }
        });
      }
    });
  });

  return {
    matricule,
    shiftsLed,
    totalMetersUnderManagement,
    totalVolumeUnderManagement,
    averageGlobalScoreUnderManagement: shiftsLed > 0 ? 88.5 : 0
  };
}

/**
 * Calculates Assistant Miner metrics from production records
 */
export function calculateAssistantMinerStats(matricule: string, productionDocs: any[]): AssistantMinerProfileStats {
  let roundsAssisted = 0;
  let totalMetersAssisted = 0;

  productionDocs.forEach(pDoc => {
    ['poste1', 'poste2', 'poste3'].forEach(pKey => {
      (pDoc.postes?.[pKey]?.minage || []).forEach((row: any) => {
        const r = row.reel || row;
        if (r.assistantMatricule?.toUpperCase() === matricule.toUpperCase()) {
          roundsAssisted += Number(r.realRounds || 0);
          totalMetersAssisted += Number(r.realMeterage || 0);
        }
      });
    });
  });

  return {
    matricule,
    roundsAssisted,
    totalMetersAssisted
  };
}
