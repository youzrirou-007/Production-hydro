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

export type TabType = 'schema' | 'explosifs' | 'bourrage' | 'calculs' | 'ingenierie';

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}
