import { GabaritType } from './types';

export interface ExplosifsData {
  totalHoles: number;
  emptyHoles: number;
  loadedHoles: number;
  anfoKgPerHole: number;
  anfoKgTotal: number;
  tovexCartouches: number;
  tovexKgTotal: number;
  amorces: number;
}

const TOVEX_CARTOUCHE_KG = 0.1;
const TAMPING_M = 0.76;
const TOVEX_LENGTH_M = 0.15;
const ANFO_DENSITY_KGM3 = 850;
const HOLE_RADIUS_M = 0.019;

export const getExplosifsData = (
  gabarit: GabaritType,
  barreType: '1.8' | '2.4'
): ExplosifsData => {
  const is9m2 = gabarit.startsWith('9m2');
  const totalHoles = is9m2 
    ? (gabarit === '9m2_intl' ? 30 : 28) 
    : 38;
  const emptyHoles =
    gabarit === '12m2' ? 3 :
    gabarit === '12m2_intl' ? 6 :
    gabarit === '9m2_intl' ? 3 :
    1;

  const loadedHoles = totalHoles - emptyHoles;

  const drilledDepthM = barreType === '1.8' ? 1.7 : 2.3;
  const anfoColumnM = Math.max(0, drilledDepthM - TAMPING_M - TOVEX_LENGTH_M);
  const anfoPerMeterKg = Math.PI * Math.pow(HOLE_RADIUS_M, 2) * ANFO_DENSITY_KGM3;
  const anfoKgPerHole = parseFloat((anfoColumnM * anfoPerMeterKg).toFixed(3));
  const anfoKgTotal = parseFloat((anfoKgPerHole * loadedHoles).toFixed(1));

  const tovexCartouches = loadedHoles;
  const tovexKgTotal = parseFloat((tovexCartouches * TOVEX_CARTOUCHE_KG).toFixed(2));

  const amorces = loadedHoles;

  return {
    totalHoles,
    emptyHoles,
    loadedHoles,
    anfoKgPerHole,
    anfoKgTotal,
    tovexCartouches,
    tovexKgTotal,
    amorces,
  };
};
