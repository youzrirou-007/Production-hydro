import { format, addDays } from 'date-fns';

export const ROTATION_CYCLE: Record<'Poste 1' | 'Poste 2' | 'Poste 3', 'Poste 1' | 'Poste 2' | 'Poste 3'> = {
  'Poste 1': 'Poste 2',
  'Poste 2': 'Poste 3',
  'Poste 3': 'Poste 1',
};

export const getNextPost = (current: string): 'Poste 1' | 'Poste 2' | 'Poste 3' =>
  (ROTATION_CYCLE as any)[current] || 'Poste 1';

export const ROTATION_FUNCTIONS = ['MINEUR', 'AIDE_MINEUR', 'CONDUCTEUR_ENGIN', 'TREUILLISTE', 'OUVRIER', 'CHEF'];

export const getUpcomingMonday = (refDate: Date = new Date()): string => {
  const day = refDate.getDay();
  const diff = (1 - day + 7) % 7 || 7;
  const targetDate = addDays(refDate, diff);
  return format(targetDate, 'yyyy-MM-dd');
};

export const getUpcomingSaturday = (refDate: Date = new Date()): string => {
  const day = refDate.getDay();
  const diff = (6 - day + 7) % 7;
  const targetDate = addDays(refDate, diff);
  return format(targetDate, 'yyyy-MM-dd');
};
