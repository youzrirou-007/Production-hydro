export interface HoleInfo {
  id: string;
  name: string;
  x: number;
  y: number;
  type: 'vide' | 'charge' | 'g1' | 'g2' | 'g3' | 'g4' | 'radier' | 'parement' | 'voute';
  label: string;
  desc: string;
  delay: number;
}

export type TabType = 'schema' | 'vue3d' | 'drilling' | 'explosifs' | 'bourrage' | 'calculs' | 'ingenierie';

export type GabaritType = '12m2' | '12m2_intl' | '9m2' | '9m2_intl';

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}
