export type PosteName = 'poste1' | 'poste2' | 'poste3';
export type ActivityName = 'minage' | 'deblayage' | 'extraction' | 'maintenance';
export type Status = 'brouillon' | 'planifie' | 'en_cours' | 'scelle';

export interface MinageRow {
  id?: string;
  chantierId: string;
  sector: string;
  chefEquipeMatricule: string;
  minerMatricule: string;
  assistantMatricule: string;
  gallerySize: 9 | 12;
  plannedHoles: number;
  chargedHoles: number;
  emptyHoles?: number; // Calculé
  rounds: number;
  meterage: number;
  anfo: number;
  tovex: number;
  ammorces: number;
  explosivesManualOverride: boolean;
  remarks: string;
}

export interface DeblayageRow {
  id?: string;
  chantierId: string;
  driverMatricule: string;
  engineId: string;
  godets: number;
  volumeEstimated: number;
  startTime: string;
  endTime: string;
  duration?: number; // Calculé
  norm?: number; // 6.0
  gap?: number; // Calculé
  gasoil: number;
  lubrifiant1Type: string;
  lubrifiant1Qty: number;
  lubrifiant2Type: string;
  lubrifiant2Qty: number;
  remarks: string;
}

export interface ExtractionRow {
  id?: string;
  installationId: string;
  treuillisteMatricule: string;
  equipier1Matricule: string;
  equipier2Matricule: string;
  equipier3Matricule: string;
  equipier4Matricule: string;
  wagonsTarget: number;
  wagonsActual: number;
  sterileBure: number;
  startTime: string;
  endTime: string;
  remarks: string;
}

export interface MaintenanceRow {
  id?: string;
  role: string;
  agentMatricule: string;
  engineId: string;
  hoursSpent: number;
  description: string;
}

export interface PosteData {
  minage: MinageRow[];
  deblayage: DeblayageRow[];
  extraction: ExtractionRow[];
  maintenance: MaintenanceRow[];
  sectorChefs: Record<string, string>;
}

export interface PlanningSheet {
  date: string;
  status: Status;
  postes: Record<PosteName, PosteData>;
}

export interface ProductionSheet {
  date: string;
  status: Exclude<Status, 'planifie'>;
  operator: string;
  timestamp: string;
  postes: Record<PosteName, {
    minage: { plan: MinageRow | null; reel: MinageRow | null }[];
    deblayage: { plan: DeblayageRow | null; reel: DeblayageRow | null }[];
    extraction: { plan: ExtractionRow | null; reel: ExtractionRow | null }[];
    maintenance: { plan: MaintenanceRow | null; reel: MaintenanceRow | null }[];
  }>;
}

export interface ExcelMinage {
  chantierId: string;
  chiefMatricule: string;
  chiefName: string;
  minerMatricule: string;
  minerName: string;
  assistantMatricule: string;
  assistantName: string;
  gallerySize: 9 | 12; // m²
  plannedHoles: number;
  realHoles: number;
  emptyHoles?: number; // Trous forés mais non chargés
  plannedRounds: number;
  realRounds: number;
  barType?: '1.8m' | '2.4m';
  barreType?: '6 pieds' | '8 pieds' | '10 pieds'; // Keep support for both or unify
  meterage: number; // calculated target avancement
  plannedMeterage?: number;
  anfo: number;
  tovex: number;
  ammorces: number;
  remarks: string;

  // Custom UI groupings/overrides
  sectorGroup?: string;
  explosivesManualOverride?: boolean;
}

export interface ExcelDeblayage {
  chantierId: string;
  driverMatricule: string;
  driverName: string;
  engineId: string;
  engineCode: string;
  godets: number;
  volumeEstimated: number; // godets * 1.5
  hoursWorked: number;
  hoursSpent?: number;
  remarks: string;

  // Custom UI grouping
  sectorGroup?: string;
}

export interface ExcelExtraction {
  chantierName: string; // "Extraction Bure N340 Imiter Est"
  treuilliste: string;
  equipier1: string;
  equipier2: string;
  equipier3: string;
  equipier4: string;
  wagonsTarget: number;
  wagonsActual: number; // Not useful in planning but kept for structural synchronization
  sterileBureImiterEst: number;
  startTime: string; // Heure début
  endTime: string; // Heure finit
  remarks: string;
  treuilliste1?: string;
  treuilliste2?: string;
  treuilliste3?: string;
  ouvriersCount?: number;
}

export interface ExcelMaintenance {
  roleLabel: string; // MÉCANICIEN 1, etc.
  agentMatricule: string;
  agentName: string;
  engineId: string;
  engineCode: string;
  hoursSpent: number;
  workDescription: string;
}
