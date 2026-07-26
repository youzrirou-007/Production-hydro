import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  SkipForward, 
  ChevronLeft, 
  ChevronRight, 
  Flame, 
  Info, 
  ShieldAlert, 
  Activity 
} from 'lucide-react';
import { HOLES_DATA, HOLES_DATA_9, HOLES_DATA_12_INTL, HOLES_DATA_9_INTL } from './data';
import { HoleInfo, GabaritType } from './types';
import { getExplosifsData } from './explosifsCalc';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

interface SchemaTabProps {
  gabarit: GabaritType;
}

export const SchemaTab: React.FC<SchemaTabProps> = ({ gabarit }) => {
  const is9m2 = gabarit.startsWith('9m2');
  const initialHolesCount = gabarit === '9m2_intl' ? 30 : gabarit === '9m2' ? 28 : 38;

  const [activeStep, setActiveStep] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [rodType, setRodType] = useState<'1.8' | '2.4'>('1.8');
  const [hoveredHole, setHoveredHole] = useState<HoleInfo | null>(null);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [ficheData, setFicheData] = useState({
    numeroTir: '',
    date: new Date().toISOString().split('T')[0],
    chantier: '',
    boutefeuNom: '',
    boutefeuMatricule: '',
    chefPostNom: '',
    barreType: '1.8' as '1.8' | '2.4',
    nbTrousForés: initialHolesCount,
    observations: '',
  });
  const [showFicheForm, setShowFicheForm] = useState(false);
  const [realtimeMode, setRealtimeMode] = useState<boolean>(false);
  const [realtimeMs, setRealtimeMs] = useState<number>(0);
  const [realtimePlaying, setRealtimePlaying] = useState<boolean>(false);
  const realtimeRef = useRef<NodeJS.Timeout | null>(null);
  const [showDangerZones, setShowDangerZones] = useState<boolean>(false);
  const [activeDangerLayer, setActiveDangerLayer] = useState<'all' | 'projection' | 'vibrations' | 'gaz'>('all');
  const [view3D, setView3D] = useState<boolean>(false);

  const REAL_DELAYS_MS = is9m2
    ? [0, 0, 25, 50, 75, 100, 125]
    : [0, 0, 25, 50, 75, 100, 125, 150];

  const TOTAL_DURATION_MS = is9m2 ? 125 : 150;

  const startRealtimePlayback = () => {
    setRealtimeMs(0);
    setRealtimePlaying(true);
    setActiveStep(0);

    const startTime = Date.now();
    const scale = 100;

    const tick = () => {
      const elapsed = (Date.now() - startTime) / scale;
      setRealtimeMs(parseFloat(elapsed.toFixed(1)));

      const currentStep = REAL_DELAYS_MS.reduce((step, delay, idx) => {
        return elapsed >= delay ? idx : step;
      }, 0);
      setActiveStep(currentStep);

      if (elapsed < TOTAL_DURATION_MS) {
        realtimeRef.current = setTimeout(tick, 16);
      } else {
        setRealtimeMs(TOTAL_DURATION_MS);
        setActiveStep(REAL_DELAYS_MS.length - 1);
        setRealtimePlaying(false);
      }
    };

    realtimeRef.current = setTimeout(tick, 16);
  };

  const stopRealtimePlayback = () => {
    if (realtimeRef.current) clearTimeout(realtimeRef.current);
    setRealtimePlaying(false);
  };

  useEffect(() => {
    return () => {
      if (realtimeRef.current) clearTimeout(realtimeRef.current);
    };
  }, []);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const maxStep = is9m2 ? 6 : 7;

  // Reset step if it exceeds bounds on gabarit swap
  useEffect(() => {
    if (activeStep > maxStep) {
      setActiveStep(maxStep);
    }
    setFicheData(p => ({ ...p, nbTrousForés: initialHolesCount }));
  }, [gabarit, maxStep, activeStep, initialHolesCount]);

  // Auto playback controls
  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setActiveStep((prev) => {
          if (prev >= maxStep) {
            return 0; // Loop back
          }
          return prev + 1;
        });
      }, 2000);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, maxStep]);

  const handleNext = () => {
    setActiveStep((prev) => (prev < maxStep ? prev + 1 : maxStep));
  };

  const handlePrev = () => {
    setActiveStep((prev) => (prev > 0 ? prev - 1 : 0));
  };

  const handleReset = () => {
    setActiveStep(0);
    setIsPlaying(false);
  };

  const handleGoToEnd = () => {
    setActiveStep(maxStep);
    setIsPlaying(false);
  };

  // Footage math linked to the rod type and the current blast step
  const getFootage = () => {
    const totalDepth = rodType === '1.8' ? 1.7 : 2.3;
    if (is9m2) {
      switch (activeStep) {
        case 0: return 0.0;
        case 1: return Number((totalDepth * 0.15).toFixed(2));
        case 2: return Number((totalDepth * 0.30).toFixed(2));
        case 3: return Number((totalDepth * 0.50).toFixed(2));
        case 4: return Number((totalDepth * 0.70).toFixed(2));
        case 5: return Number((totalDepth * 0.85).toFixed(2));
        case 6: return totalDepth;
        default: return 0.0;
      }
    } else {
      switch (activeStep) {
        case 0: return 0.0;
        case 1: return Number((totalDepth * 0.15).toFixed(2));
        case 2: return Number((totalDepth * 0.30).toFixed(2));
        case 3: return Number((totalDepth * 0.45).toFixed(2));
        case 4: return Number((totalDepth * 0.60).toFixed(2));
        case 5: return Number((totalDepth * 0.75).toFixed(2));
        case 6: return Number((totalDepth * 0.90).toFixed(2));
        case 7: return totalDepth;
        default: return 0.0;
      }
    }
  };

  // Cavity expansion dimensions on SVG
  const getCavityRadius = () => {
    if (is9m2) {
      switch (activeStep) {
        case 0: return 0;
        case 1: return 45;   // Bouchon central
        case 2: return 90;   // G1
        case 3: return 140;  // G2
        case 4: return 200;  // G3
        case 5: return 200;  // Radier + Parements
        case 6: return 200;  // Voûte
        default: return 0;
      }
    } else {
      switch (activeStep) {
        case 0: return 0;
        case 1: return 60;   // Bouchon central
        case 2: return 120;  // G1 coins
        case 3: return 200;  // G2 petite croix
        case 4: return 280;  // G3 grand carré
        case 5: return 360;  // G4 grande croix
        case 6: return 360;  // Radier + Parements
        case 7: return 360;  // Voûte
        default: return 0;
      }
    }
  };

  // Helper to determine the blasting step for each hole type
  const getBlastStepForHole = (hole: HoleInfo, gab: GabaritType) => {
    if (hole.type === 'vide') return -1;
    if (gab.startsWith('9m2')) {
      if (hole.type === 'charge') return 1;
      if (hole.type === 'g1') return 2;
      if (hole.type === 'g2') return 3;
      if (hole.type === 'g3') return 4;
      if (hole.type === 'radier') return 5;
      if (hole.type === 'parement') return 5;
      return 6; // voute — dernière, séparée
    } else {
      if (hole.type === 'charge') return 1;
      if (hole.type === 'g1') return 2;
      if (hole.type === 'g2') return 3;
      if (hole.type === 'g3') return 4;
      if (hole.type === 'g4') return 5;
      if (hole.type === 'radier') return 6;
      if (hole.type === 'parement') return 6;
      return 7; // voute — dernière, séparée
    }
  };

  // Helper to determine if a hole has already exploded at a given stage
  const getHoleStatus = (hole: HoleInfo) => {
    if (hole.type === 'vide') return 'normal';
    const blastStepForHole = getBlastStepForHole(hole, gabarit);
    if (activeStep === 0) return 'normal';
    if (activeStep === blastStepForHole) return 'blasting';
    if (activeStep > blastStepForHole) return 'exploded';
    return 'normal';
  };

  const generateFicheTir = () => {
    const drilledLength = ficheData.barreType === '1.8' ? 1.7 : 2.3;
    const isIntl = gabarit === '12m2_intl';
    const is9m2Family = gabarit.startsWith('9m2');

    const bouchonConfig = gabarit === '9m2_intl'
      ? '7 trous (3 vides + 4 chargés TOVEX + ANFO) — Standard International (3 Vides)'
      : gabarit === '9m2'
      ? '5 trous (1 vide + 4 chargés TOVEX + ANFO) — Bouchon cylindrique'
      : isIntl
      ? '9 trous (6 vides + 3 chargés TOVEX + ANFO) — Standard Langefors-Kihlström'
      : '9 trous (3 vides + 6 chargés TOVEX + ANFO) — Configuration CHANTIER MINIER (X)';

    const explosifs = getExplosifsData(gabarit, ficheData.barreType);
    const totalTrous = explosifs.totalHoles;
    const nbChargés = explosifs.loadedHoles;
    const anfoKg = explosifs.anfoKgTotal;
    const tovexCartouches = explosifs.tovexCartouches;
    const nbAmorces = explosifs.amorces;

    const sequenceLignes = is9m2Family ? [
      { det: '0 ms', desc: 'Bouchon central', trous: 4 },
      { det: '25 ms', desc: 'Groupe d\'Élargissement 1', trous: 4 },
      { det: '50 ms', desc: 'Groupe d\'Élargissement 2', trous: 4 },
      { det: '75 ms', desc: 'Groupe d\'Élargissement 3', trous: 4 },
      { det: '100 ms', desc: 'Radier + Parements', trous: 8 },
      { det: '125 ms', desc: 'Voûte (Découpe d\'Arche)', trous: 3 },
    ] : [
      { det: '0 ms', desc: 'Bouchon brûlé', trous: isIntl ? 3 : 6 },
      { det: '25 ms', desc: 'Groupe d\'Élargissement 1', trous: 4 },
      { det: '50 ms', desc: 'Groupe d\'Élargissement 2', trous: 4 },
      { det: '75 ms', desc: 'Groupe d\'Élargissement 3', trous: 4 },
      { det: '100 ms', desc: 'Groupe d\'Élargissement 4', trous: 4 },
      { det: '125 ms', desc: 'Radier + Parements', trous: 10 },
      { det: '150 ms', desc: 'Voûte (Découpe de Voûte)', trous: 3 },
    ];

    const dateFormatted = new Date(ficheData.date + 'T12:00:00')
      .toLocaleDateString('fr-MA', { day: '2-digit', month: 'long', year: 'numeric' });

    const observationsHTML = ficheData.observations ? `
  <div class="section-title">Observations</div>
  <div class="info-box" style="margin-bottom:10px;">
    <div class="info-value" style="font-weight:600; font-size:9.5px;">
      ${ficheData.observations}
    </div>
  </div>` : '';

    const signatureMatriculeHTML = ficheData.boutefeuMatricule ? `<div style="font-size:8px;color:#64748b;">Mat: ${ficheData.boutefeuMatricule}</div>` : '';

    const sequenceLignesRows = sequenceLignes.map(l => '<tr><td><strong>' + l.det + '</strong></td><td>' + l.desc + '</td><td style="text-align:center;">' + l.trous + '</td><td>' + 'TOVEX 100g (Amorceur) + ANFO (Colonne)' + '</td></tr>').join('');

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Fiche de Tir ${ficheData.numeroTir} — CHANTIER MINIER (X)</title>
  <style>
    @page { margin: 15mm; size: A4; }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 10px;
      color: #1e293b; background: white; }

    .header-band {
      background: #0f172a; color: white;
      padding: 14px 18px; display: flex;
      justify-content: space-between; align-items: center;
      margin-bottom: 14px;
    }
    .header-title { font-size: 15px; font-weight: 900;
      text-transform: uppercase; letter-spacing: 2px; color: #ffd700; }
    .header-sub { font-size: 9px; color: #94a3b8;
      text-transform: uppercase; letter-spacing: 1px; margin-top: 2px; }
    .header-badge { background: rgba(255,215,0,0.15);
      border: 1px solid rgba(255,215,0,0.4); border-radius: 8px;
      padding: 6px 12px; color: #ffd700; font-size: 10px;
      font-weight: 900; text-align: center; text-transform: uppercase; }
    .header-badge .num { font-size: 14px; display: block; }

    .section-title { font-size: 9px; font-weight: 900;
      text-transform: uppercase; letter-spacing: 1.5px;
      color: #0f172a; border-left: 3px solid #ffd700;
      padding-left: 8px; margin: 12px 0 8px; }

    .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 6px; }
    .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 6px; }

    .info-box { border: 1px solid #e2e8f0; border-radius: 6px;
      padding: 7px 10px; background: #f8fafc; }
    .info-label { font-size: 7.5px; text-transform: uppercase;
      color: #64748b; font-weight: 700; letter-spacing: 0.8px; margin-bottom: 2px; }
    .info-value { font-size: 11px; font-weight: 900; color: #0f172a; }

    table { width: 100%; border-collapse: collapse; margin-bottom: 10px; }
    th { background: #0f172a; color: white; padding: 6px 8px;
      font-size: 8.5px; text-transform: uppercase;
      letter-spacing: 0.5px; text-align: left; }
    td { padding: 5px 8px; border-bottom: 1px solid #f1f5f9;
      font-size: 9.5px; }
    tr:nth-child(even) td { background: #f8fafc; }

    .explosifs-card { background: #1a1a2e; border-radius: 8px;
      padding: 12px 14px; margin-bottom: 10px; }
    .explosifs-title { color: #ffd700; font-size: 9px;
      font-weight: 900; text-transform: uppercase;
      letter-spacing: 1.5px; margin-bottom: 8px; }
    .explosifs-grid { display: grid; grid-template-columns: 1fr 1fr 1fr;
      gap: 8px; }
    .explosif-item { text-align: center; }
    .explosif-qty { color: #ffffff; font-size: 16px;
      font-weight: 900; display: block; }
    .explosif-label { color: #94a3b8; font-size: 7.5px;
      text-transform: uppercase; }

    .signatures { display: grid; grid-template-columns: 1fr 1fr 1fr;
      gap: 12px; margin-top: 14px; }
    .sig-box { border-top: 1.5px solid #1e293b; padding-top: 5px; }
    .sig-label { font-size: 8px; text-transform: uppercase;
      color: #64748b; font-weight: 700; letter-spacing: 0.8px; }
    .sig-name { font-size: 9px; font-weight: 900;
      color: #0f172a; margin-top: 14px; }
    .sig-space { height: 30px; }

    .alert-box { background: #fff8e6; border: 1.5px solid #fcd34d;
      border-radius: 6px; padding: 8px 10px; margin: 10px 0; }
    .alert-text { font-size: 9px; font-weight: 700; color: #92400e; }

    .footer-band { background: #0f172a; padding: 8px 18px;
      display: flex; justify-content: space-between;
      margin-top: 14px; }
    .footer-text { color: rgba(255,255,255,0.5);
      font-size: 8px; }
    .footer-conf { color: #ffd700; font-size: 8px;
      font-weight: 700; text-transform: uppercase; }

    @media print { .no-print { display: none; } }
  </style>
</head>
<body>

  <div class="header-band">
    <div>
      <div class="header-title">⛏️ EXCELLENCE — CHANTIER MINIER (X)</div>
      <div class="header-sub">Fiche Officielle de Tir Souterrain — Document Réglementaire ONHYM</div>
    </div>
    <div class="header-badge">
      <span class="num">${ficheData.numeroTir || 'N/A'}</span>
      Numéro de Tir
    </div>
  </div>

  <div class="section-title">Identification du Tir</div>
  <div class="grid-3" style="margin-bottom:10px;">
    <div class="info-box">
      <div class="info-label">Date</div>
      <div class="info-value">${dateFormatted}</div>
    </div>
    <div class="info-box">
      <div class="info-label">Chantier / Galerie</div>
      <div class="info-value">${ficheData.chantier || '—'}</div>
    </div>
    <div class="info-box">
      <div class="info-label">Section de galerie</div>
      <div class="info-value">${is9m2 ? 'Traçage 9 m²' : isIntl ? 'Galerie 12 m² — Std. Intl' : 'Galerie 12 m² — SMI'}</div>
    </div>
    <div class="info-box">
      <div class="info-label">Tige utilisée</div>
      <div class="info-value">${ficheData.barreType} m (forage ${drilledLength} m)</div>
    </div>
    <div class="info-box">
      <div class="info-label">Nombre total de trous</div>
      <div class="info-value">${totalTrous} trous</div>
    </div>
    <div class="info-box">
      <div class="info-label">Trous chargés</div>
      <div class="info-value">${nbChargés} trous</div>
    </div>
  </div>

  <div class="section-title">Configuration du Bouchon</div>
  <div class="info-box" style="margin-bottom:10px;">
    <div class="info-label">Type de bouchon</div>
    <div class="info-value">${bouchonConfig}</div>
  </div>

  <div class="explosifs-card">
    <div class="explosifs-title">Inventaire Explosifs Prévisionnel</div>
    <div class="explosifs-grid">
      <div class="explosif-item">
        <span class="explosif-qty">${anfoKg.toFixed(1)} kg</span>
        <span class="explosif-label">ANFO</span>
      </div>
      <div class="explosif-item">
        <span class="explosif-qty">${tovexCartouches}</span>
        <span class="explosif-label">Cartouches TOVEX 100g</span>
      </div>
      <div class="explosif-item">
        <span class="explosif-qty">${nbAmorces}</span>
        <span class="explosif-label">Amorces électriques</span>
      </div>
    </div>
  </div>

  <div class="section-title">Séquence de Tir</div>
  <table>
    <thead>
      <tr>
        <th>Délai</th>
        <th>Description</th>
        <th>Nb Trous</th>
        <th>Explosif</th>
      </tr>
    </thead>
    <tbody>
      ${sequenceLignesRows}
    </tbody>
  </table>

  <div class="alert-box">
    <div class="alert-text">
      ⚠️ CONSIGNES SÉCURITÉ OBLIGATOIRES : Évacuation complète avant
      connexion des amorces. Distance minimale 50m depuis le front de taille.
      Délai post-tir minimum 30 minutes avant accès. Vérification CO et
      ventilation obligatoire avant retour en galerie.
    </div>
  </div>

  ${observationsHTML}

  <div class="section-title">Signatures</div>
  <div class="signatures">
    <div class="sig-box">
      <div class="sig-label">Boutefeu Responsable</div>
      <div class="sig-space"></div>
      <div class="sig-name">${ficheData.boutefeuNom || '____________________'}</div>
      ${signatureMatriculeHTML}
    </div>
    <div class="sig-box">
      <div class="sig-label">Chef de Poste</div>
      <div class="sig-space"></div>
      <div class="sig-name">${ficheData.chefPostNom || '____________________'}</div>
    </div>
    <div class="sig-box">
      <div class="sig-label">Directeur Technique</div>
      <div class="sig-space"></div>
      <div class="sig-name">____________________</div>
    </div>
  </div>

  <div class="footer-band">
    <div class="footer-text">
      Excellence CHANTIER MINIER (X) · Fiche N° ${ficheData.numeroTir || '—'} · ${dateFormatted}
    </div>
    <div class="footer-conf">⛏ Document Confidentiel — Usage Interne</div>
  </div>

</body>
</html>`;

    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
      win.focus();
      setTimeout(() => { win.print(); }, 500);
    }
    setShowFicheForm(false);
  };

  // Hex color lookup for holes
  const getHoleColorHex = (hole: HoleInfo) => {
    switch (hole.type) {
      case 'charge': return '#f59e0b'; // Gold
      case 'g1': return '#3b82f6'; // Blue
      case 'g2': return '#ef4444'; // Red
      case 'g3': return '#22d3ee'; // Cyan
      case 'g4': return '#f97316'; // Orange
      case 'radier': return '#8b5cf6'; // Violet
      case 'parement': return '#14b8a6'; // Teal
      case 'voute': return '#f43f5e'; // Rose
      default: return '#94a3b8';
    }
  };

  // Generate stable dynamic organic void path with jagged raw rock edges
  const getOrganicVoidPath = (cx: number, cy: number, step: number, offset: number) => {
    if (step <= 0) return "";
    const points = [];
    const numPoints = 36; // high frequency jaggedness
    for (let i = 0; i < numPoints; i++) {
      const angle = (i * (360 / numPoints)) * Math.PI / 180;
      
      // Determine the precise target radius for this angle and step
      let r = 0;
      if (is9m2) {
        switch (step) {
          case 1: // Bouchon central
            r = 45;
            break;
          case 2: // G1
            r = 90;
            break;
          case 3: // G2
            r = 140;
            break;
          case 4: // G3 (cloverleaf / star shape to reach diagonal G3 and avoid G4/radier)
            // Diagonals need to reach ~210. Orthogonals stay smaller (~130) to avoid radier and outer boundary
            r = 175 - 45 * Math.cos(4 * angle) - 20 * Math.max(0, Math.sin(angle));
            break;
          default:
            r = 140;
        }
      } else {
        // 12m2
        switch (step) {
          case 1: // Bouchon central
            r = 60;
            break;
          case 2: // G1
            r = 120;
            break;
          case 3: // G2
            r = 190;
            break;
          case 4: // G3 (cloverleaf/star shape to reach diagonal G3 but avoid G4/radier)
            // Diagonals reach ~275, orthogonals stay smaller (~160) to avoid G4 and radier
            r = 215 - 55 * Math.cos(4 * angle) - 15 * Math.max(0, Math.sin(angle));
            break;
          case 5: // G4 (cross shape to reach G4 but avoid finishing boundary)
            // Right/Left (0, pi): ~330. Top (3pi/2): ~270. Bottom (pi/2): ~195.
            r = 250 + 80 * Math.abs(Math.cos(angle)) + 20 * Math.max(0, -Math.sin(angle)) - 55 * Math.max(0, Math.sin(angle));
            break;
          default:
            r = 190;
        }
      }

      // Add the offset (e.g. +3 for outer rim shadow)
      r += offset;

      const seed = (i * 13) % 7;
      const baseVariation = 0.95 + (seed / 140); // small organic swell
      
      // Alternate high frequency peaks/valleys to create a crisp jagged raw rock profile
      const spikeFactor = i % 2 === 0 ? 0.97 : 1.03;
      const currentR = r * baseVariation * spikeFactor;
      
      const x = cx + Math.cos(angle) * currentR;
      const y = cy + Math.sin(angle) * currentR;
      points.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    }
    return `M ${points.join(" L ")} Z`;
  };

  // Descriptions for each step of the timeline
  const stepExplanationsTwelve = [
    {
      title: "État initial",
      time: "Pre-firing",
      desc: "Tous les trous sont forés parallèlement et chargés conformément au plan d'ingénierie souterraine. La roche de front est intacte, dense et solide."
    },
    {
      title: "Bouchon (0ms)",
      time: "0 ms",
      desc: "Les 6 trous du bouchon brûlé explosent instantanément. Les 3 trous vides centraux n'explosent pas : ils offrent l'unique espace de décompression libre. La roche comprimée s'y pulvérise et s'éjecte."
    },
    {
      title: "Groupe 1 (25ms)",
      time: "25 ms",
      desc: "Les 4 trous d'angle du Groupe 1 explosent. La roche fracturée se déplace vers la cavité centrale initialement libérée par le bouchon, élargissant la zone vide à 30%."
    },
    {
      title: "Groupe 2 (50ms)",
      time: "50 ms",
      desc: "Les 4 trous en croix du Groupe 2 explosent. L'onde de cisaillement pousse le massif rocheux vers le vide qui s'élargit désormais pour libérer 50% de la section."
    },
    {
      title: "Groupe 3 (75ms)",
      time: "75 ms",
      desc: "Les 4 grands angles extérieurs du Groupe 3 détruisent la roche intermédiaire. La cavité s'ouvre à 70%, nettoyant les diagonales supérieures et inférieures."
    },
    {
      title: "Groupe 4 (100ms)",
      time: "100 ms",
      desc: "Les 4 bras géants du Groupe 4 détonent à haute pression. Cette étape finale d'élargissement vide 85% de la galerie, laissant uniquement les contours extérieurs."
    },
    {
      title: "Finition (125ms)",
      time: "125 ms",
      desc: "Les trous de radier (pieds), de parements (côtés) et de voûte détonent ensemble. Leurs ondes de choc découpent les parois de manière lisse et régulière. 100% du métrage est arraché."
    }
  ];

  const stepExplanationsNine = [
    {
      title: "État initial",
      time: "Pre-firing",
      desc: "Tous les 28 trous du gabarit de reconnaissance de 9m² sont forés de manière parfaitement parallèle et chargés. La masse rocheuse solide du front est stable."
    },
    {
      title: "Bouchon (0ms)",
      time: "0 ms",
      desc: "Les 4 trous chargés du bouchon cylindrique détonnent en instantané (0ms). Trou foré à 38mm mais non chargé (vide d'expansion). Offre un volume de dégagement initial central. Même profondeur et même diamètre que les trous chargés."
    },
    {
      title: "Groupe 1 (25ms)",
      time: "25 ms",
      desc: "Les 4 trous du Groupe 1 (25ms, détonateur 1) explosent. La roche cisaillée est projetée vers la cavité cylindrique libre du bouchon."
    },
    {
      title: "Groupe 2 (50ms)",
      time: "50 ms",
      desc: "Les 4 trous en croix du Groupe 2 (50ms, détonateur 2) détonnent pour étendre la cavité vers les limites intermédiaires horizontales et verticales."
    },
    {
      title: "Groupe 3 (75ms)",
      time: "75 ms",
      desc: "Les 4 trous diagonaux du Groupe 3 (75ms, détonateur 3) cisaillent la roche d'angle interne pour nettoyer 75% du cœur de la galerie."
    },
    {
      title: "Finition (100-125ms)",
      time: "100-125 ms",
      desc: "Tirs de contour : radier et parements à 100ms (détonateur 4), voûte à 125ms (détonateur 5). Profil final : parois verticales (parements), sol plat (radier) et voûte en arc de cercle (voûte). La galerie 9m² est formée."
    }
  ];

  const stepExplanations = is9m2 ? stepExplanationsNine : stepExplanationsTwelve;

  // Colors for rendering the holes based on type
  const getHoleColorClasses = (hole: HoleInfo, status: string) => {
    if (status === 'exploded') {
      return 'fill-slate-800/20 stroke-slate-600/35 stroke-[1px] opacity-40';
    }
    if (status === 'blasting') {
      return 'fill-red-500 stroke-yellow-400 stroke-[4px] animate-pulse';
    }

    switch (hole.type) {
      case 'vide': return 'fill-white stroke-slate-500 stroke-[3px]';
      case 'charge': return 'fill-slate-900 stroke-white stroke-[3px]';
      case 'g1': return 'fill-blue-500 stroke-blue-600 stroke-[3px]';
      case 'g2': return 'fill-red-500 stroke-red-600 stroke-[3px]';
      case 'g3': return 'fill-cyan-400 stroke-cyan-500 stroke-[3px]';
      case 'g4': return 'fill-orange-500 stroke-orange-600 stroke-[3px]';
      case 'radier': return 'fill-violet-500 stroke-violet-600 stroke-[3px]';
      case 'parement': return 'fill-teal-500 stroke-teal-600 stroke-[3px]';
      case 'voute': return 'fill-rose-500 stroke-rose-600 stroke-[3px]';
      default: return 'fill-slate-400';
    }
  };

  // Logic to draw vector arrow pointing from hole center towards the epicentre (500, 430) for 12m2, and (500, 350) for 9m2
  const getArrowCoords = (hole: HoleInfo) => {
    const cx = 500;
    const cy = is9m2 ? 350 : 430;
    const dx = cx - hole.x;
    const dy = cy - hole.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) return null;

    // Normalised vector
    const ux = dx / len;
    const uy = dy / len;

    // Line start (just outside the hole radius) and end (offset by 60px toward the center)
    const x1 = hole.x + ux * 18;
    const y1 = hole.y + uy * 18;
    const x2 = hole.x + ux * 65;
    const y2 = hole.y + uy * 65;

    return { x1, y1, x2, y2 };
  };

  const currentMaxDepth = rodType === '1.8' ? 1.7 : 2.3;
  const currentPercentage = Math.round((getFootage() / currentMaxDepth) * 100);
  const holesToRender =
    gabarit === '9m2' ? HOLES_DATA_9 :
    gabarit === '9m2_intl' ? HOLES_DATA_9_INTL :
    gabarit === '12m2_intl' ? HOLES_DATA_12_INTL :
    HOLES_DATA;

  // Stable cached calculations using useMemo to fulfill the "RÈGLES DE PERFORMANCE"
  const stableExplosionData = useMemo(() => {
    const particlesMap: Record<string, any[]> = {};
    const smokeMap: Record<string, any[]> = {};
    const fragmentsMap: Record<string, any[]> = {};
    const debrisMap: Record<string, any[]> = {};

    const cx = 500;
    const cy = is9m2 ? 350 : 430;

    holesToRender.forEach((hole) => {
      // 1. PARTICLES (Polygons of rock, max 15 per hole)
      const color = getHoleColorHex(hole);
      const parts = [];
      const partCount = 12 + (parseInt(hole.id.replace(/\D/g, '') || '0') % 4); // 12 to 15 particles
      for (let i = 0; i < partCount; i++) {
        const angle = (i * (360 / partCount)) + (parseInt(hole.id.replace(/\D/g, '') || '0') % 10) * 5;
        const rad = (angle * Math.PI) / 180;
        const dist = 30 + (((i * 7) + parseInt(hole.id.replace(/\D/g, '') || '0')) % 50); // 30px to 80px
        const targetX = Math.cos(rad) * dist;
        const targetY = Math.sin(rad) * dist;
        
        // Stable rock polygons (triangles or quads)
        const seed = (i * 13 + parseInt(hole.id.replace(/\D/g, '') || '0')) % 7;
        const size = 3 + (seed % 3);
        let points = "";
        if (seed % 2 === 0) {
          points = `0,-${size} ${size},${size} -${size},${size}`;
        } else {
          points = `-${size},-${size} ${size + 1},-${size} ${size},${size + 1} -${size - 1},${size}`;
        }

        parts.push({
          id: `${hole.id}-part-${i}`,
          tx: targetX,
          ty: targetY,
          color: color,
          points: points,
          rot: 180 + (seed * 90)
        });
      }
      particlesMap[hole.id] = parts;

      // 2. SMOKE (Radial dispersion towards void, max 4 per hole)
      const smk = [];
      const isFinishing = ['radier', 'parement', 'voute'].includes(hole.type);
      const smokeCount = isFinishing ? 2 : 4; // lighter smoke for finishing
      let dx = cx - hole.x;
      let dy = cy - hole.y;
      let len = Math.sqrt(dx * dx + dy * dy);
      if (len === 0) {
        dx = 0;
        dy = -1;
        len = 1;
      }
      const ux = dx / len;
      const uy = dy / len;

      for (let i = 0; i < smokeCount; i++) {
        const angleOffset = -30 + (i * 20);
        const angleRad = (angleOffset * Math.PI) / 180;
        const rx = ux * Math.cos(angleRad) - uy * Math.sin(angleRad);
        const ry = ux * Math.sin(angleRad) + uy * Math.cos(angleRad);

        const dist = 30 + (i * 15);
        const tx = rx * dist;
        const ty = ry * dist;

        smk.push({
          id: `${hole.id}-smoke-${i}`,
          tx: tx,
          ty: ty,
          delay: i * 0.15,
          size: 8 + (i * 3) // smaller bubbles for performance and aesthetics
        });
      }
      smokeMap[hole.id] = smk;

      // 3. FRAGMENTS (Finition vs Elargissement direction, max 8 per hole)
      const frgs = [];
      const fragmentCount = 6 + (parseInt(hole.id.replace(/\D/g, '') || '0') % 3); // 6 to 8 fragments
      
      // FINITION: fragments inwards towards center/void; ELARGISSEMENT: outwards away from center
      let fdx = isFinishing ? cx - hole.x : hole.x - cx;
      let fdy = isFinishing ? cy - hole.y : hole.y - cy;
      let flen = Math.sqrt(fdx * fdx + fdy * fdy);
      if (flen === 0) {
        fdx = 0;
        fdy = -1;
        flen = 1;
      }
      const fux = fdx / flen;
      const fuy = fdy / flen;

      for (let i = 0; i < fragmentCount; i++) {
        const angleOffset = -45 + (((i * 15) + parseInt(hole.id.replace(/\D/g, '') || '0')) % 90);
        const angleRad = (angleOffset * Math.PI) / 180;
        const rx = fux * Math.cos(angleRad) - fuy * Math.sin(angleRad);
        const ry = fux * Math.sin(angleRad) + fuy * Math.cos(angleRad);
        
        const dist = 40 + (((i * 11) + parseInt(hole.id.replace(/\D/g, '') || '0')) % 60); // 40-100px
        const tx = rx * dist;
        const ty = ry * dist;
        
        const size = 4 + (i % 3);
        const polyPoints = `0,0 ${size},-${size} ${size * 2},0 ${size},${size}`;

        frgs.push({
          id: `${hole.id}-frag-${i}`,
          points: polyPoints,
          tx,
          ty,
          rot: 360 + (i * 90)
        });
      }
      fragmentsMap[hole.id] = frgs;

      // 4. DEBRIS AT THE RADIER (Gravity falling, only for elargissement, max 5 per hole)
      const dbr = [];
      if (!isFinishing && hole.type !== 'vide') {
        const debrisCount = 3 + (parseInt(hole.id.replace(/\D/g, '') || '0') % 3); // 3 to 5 debris pieces
        const floorY = is9m2 ? 520 : 650;
        const fallDist = floorY - hole.y;

        for (let i = 0; i < debrisCount; i++) {
          const seed = (i * 23 + parseInt(hole.id.replace(/\D/g, '') || '0')) % 11;
          const spreadX = -40 + (seed * 8); // horizontal bounce/slide
          const size = 3 + (seed % 3);
          const polyPoints = `0,0 ${size},-${size} ${size * 1.5},0 ${size},${size}`;
          
          dbr.push({
            id: `${hole.id}-debris-${i}`,
            points: polyPoints,
            tx: spreadX,
            ty: fallDist - 5,
            delay: 0.1 + (i * 0.1)
          });
        }
      }
      debrisMap[hole.id] = dbr;
    });

    return { particlesMap, smokeMap, fragmentsMap, debrisMap };
  }, [gabarit, holesToRender]);

  // Center of gravity calculation for the active blasting group
  const blastingHoles = holesToRender.filter(h => {
    if (h.type === 'vide') return false;
    return activeStep === getBlastStepForHole(h, gabarit);
  });
  
  const centerOfGravity = (() => {
    if (blastingHoles.length > 0) {
      const sumX = blastingHoles.reduce((acc, h) => acc + h.x, 0);
      const sumY = blastingHoles.reduce((acc, h) => acc + h.y, 0);
      return { x: sumX / blastingHoles.length, y: sumY / blastingHoles.length };
    }
    return { x: 500, y: is9m2 ? 350 : 430 };
  })();

  // Dynamic screen shake intensity and duration based on blasting step
  const shake = (() => {
    if (activeStep === 0) return { amplitude: 0, duration: 0 };
    if (activeStep === 1) return { amplitude: 5, duration: 0.20 }; // Bouchon (Forte)
    if (activeStep === maxStep) return { amplitude: 1.5, duration: 0.10 }; // Finition (Légère)
    return { amplitude: 3, duration: 0.15 }; // G1-G4 (Moyenne)
  })();

  // Dynamic zoom viewBox with expanded empty margins at top and bottom for optimal vertical space
  const dynamicViewBox = is9m2 ? "210 -10 580 580" : "0 -180 1000 920";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 bg-white rounded-3xl p-6 border border-slate-100 shadow-xs">
      
      {/* LEFT COLUMN: THE CORE SVG PLAN DE TIR (9 Columns) */}
      <div className="lg:col-span-9 space-y-6 flex flex-col justify-between">
        
        {/* Toggle Rod type bar */}
        <div className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-2xl p-4">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-amber-500 shrink-0" />
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400">Longueur de tige</p>
              <p className="text-xs font-extrabold text-slate-800 uppercase">
                Tige conique : {rodType === '1.8' ? '1.8 mètres' : '2.4 mètres'}
              </p>
            </div>
          </div>
          <div className="flex bg-white border border-slate-200 rounded-xl p-1 shadow-sm gap-1">
            <button
              onClick={() => setRodType('1.8')}
              className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-colors ${
                rodType === '1.8'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              1.8 m (Forage 1.7m)
            </button>
            <button
              onClick={() => setRodType('2.4')}
              className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-colors ${
                rodType === '2.4'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              2.4 m (Forage 2.3m)
            </button>
          </div>
        </div>

        <div className="flex justify-end gap-3 flex-wrap">
          <button
            onClick={() => setShowFicheForm(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-slate-900
              hover:bg-black text-[#ffd700] text-[10px] font-black uppercase
              tracking-wider rounded-xl border border-[#ffd700]/40 shadow-md
              transition-colors"
          >
            📄 Fiche de Tir Officielle
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-slate-900 hover:bg-black text-amber-400 border border-amber-400/20 text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-sm flex items-center gap-2 hover:border-amber-400 cursor-pointer"
          >
            <Info className="w-4 h-4 text-amber-400" />
            Pourquoi ce gabarit ?
          </button>
        </div>

        {/* INTERACTIVE SVG STAGE */}
        <div className="bg-slate-950 rounded-3xl border border-slate-850 p-6 relative shadow-2xl flex items-center justify-center overflow-hidden w-full">
          
          {!view3D && (
            <>
              {/* Legend absolute inside top right */}
              <div className="absolute top-4 left-4 bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2 text-[9px] font-bold text-slate-400 uppercase tracking-wider space-y-1 z-10">
                <p className="text-[10px] font-black text-[#ffd700] border-b border-slate-800 pb-1 mb-1">Délai Séquence</p>
                <p className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-900 border border-white" /> Bouchon : 0ms</p>
                <p className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500" /> Groupe 1 : 25ms</p>
                <p className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500" /> Groupe 2 : 50ms</p>
                <p className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-cyan-400" /> Groupe 3 : 75ms</p>
                {!is9m2 && (
                  <p className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-orange-500" /> Groupe 4 : 100ms</p>
                )}
                <p className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-violet-500" /> Radier : {is9m2 ? '100ms' : '125ms'}</p>
                <p className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-teal-500" /> Parement : {is9m2 ? '100ms' : '125ms'}</p>
                <p className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500" /> Voûte : {is9m2 ? '125ms' : '150ms'}</p>
              </div>

              <svg viewBox={dynamicViewBox} className="w-full h-auto select-none">
            <defs>
              {/* Rocky Dark Granite Pattern */}
              <pattern id="granite-rock" width="120" height="120" patternUnits="userSpaceOnUse">
                <rect width="120" height="120" fill="#111827" />
                <path d="M 0 10 C 20 15 30 5 60 18 C 90 30 110 5 120 15" fill="none" stroke="#1f2937" strokeWidth="1.5" opacity="0.6"/>
                <path d="M 10 120 C 40 80 70 110 90 75 C 100 50 110 90 120 100" fill="none" stroke="#1f2937" strokeWidth="1" opacity="0.4"/>
                {/* Mineral grains */}
                <circle cx="20" cy="30" r="1.5" fill="#374151" opacity="0.4"/>
                <circle cx="70" cy="50" r="2" fill="#4b5563" opacity="0.3"/>
                <circle cx="95" cy="15" r="1.2" fill="#1f2937" opacity="0.7"/>
                <circle cx="45" cy="95" r="1.8" fill="#4b5563" opacity="0.4"/>
                <circle cx="110" cy="85" r="2.2" fill="#374151" opacity="0.5"/>
              </pattern>

              {/* Arrow Head Marker */}
              <marker
                id="marker-arrow"
                viewBox="0 0 10 10"
                refX="6"
                refY="5"
                markerWidth="6"
                markerHeight="6"
                orient="auto-start-reverse"
              >
                <path d="M 0 2 L 10 5 L 0 8 z" fill="#fbbf24" />
              </marker>

              {/* Radial Glow Gradient */}
              <radialGradient id="blast-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.8"/>
                <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.3"/>
                <stop offset="100%" stopColor="#f59e0b" stopOpacity="0"/>
              </radialGradient>

              {/* Organic Void Edge Backlight */}
              <radialGradient id="void-backlight" cx="50%" cy="50%" r="50%">
                <stop offset="85%" stopColor="#000000" stopOpacity="1" />
                <stop offset="96%" stopColor="#1e293b" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#334155" stopOpacity="0.3" />
              </radialGradient>

              {/* ClipPaths to keep all dynamic explosion effects inside the gallery walls */}
              <clipPath id="gallery-clip-9m2">
                <path d="M 280,520 L 280,280 A 220,220 0 0,1 720,280 L 720,520 Z" />
              </clipPath>
              <clipPath id="gallery-clip-12m2">
                <path d="M 100,650 L 100,300 A 400,400 0 0,1 900,300 L 900,650 Z" />
              </clipPath>

              {/* Linear gradients for colored rock fragments */}
              <linearGradient id="grad-charge" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#374151" />
              </linearGradient>
              <linearGradient id="grad-g1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#3b82f6" />
                <stop offset="100%" stopColor="#374151" />
              </linearGradient>
              <linearGradient id="grad-g2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#ef4444" />
                <stop offset="100%" stopColor="#374151" />
              </linearGradient>
              <linearGradient id="grad-g3" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#22d3ee" />
                <stop offset="100%" stopColor="#374151" />
              </linearGradient>
              <linearGradient id="grad-g4" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#374151" />
              </linearGradient>
              <linearGradient id="grad-radier" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="100%" stopColor="#374151" />
              </linearGradient>
              <linearGradient id="grad-parement" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#14b8a6" />
                <stop offset="100%" stopColor="#374151" />
              </linearGradient>
              <linearGradient id="grad-voute" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f43f5e" />
                <stop offset="100%" stopColor="#374151" />
              </linearGradient>
            </defs>

            {/* SCREEN SHAKE WRAPPER */}
            <motion.g
              key={`shake-${activeStep}`}
              animate={activeStep > 0 ? {
                x: [0, -shake.amplitude, shake.amplitude, -shake.amplitude * 0.6, shake.amplitude * 0.6, 0],
                y: [0, -shake.amplitude * 0.7, shake.amplitude * 0.7, -shake.amplitude * 0.4, shake.amplitude * 0.4, 0]
              } : {}}
              transition={{ duration: shake.duration, ease: "easeInOut" }}
            >
              {/* Background of the overall tunnel face (solid rock block) */}
              <rect x="-1000" y="-1000" width="3000" height="3000" fill="url(#granite-rock)" />

              {/* Gallery Tunnel Face Silhouette */}
              {/* Gallery Tunnel Face Silhouette */}
              {is9m2 ? (
                <path
                  d="M 280,520 L 280,280 A 220,220 0 0,1 720,280 L 720,520 Z"
                  fill="url(#granite-rock)"
                  stroke="#0f172a"
                  strokeWidth="10"
                  className="drop-shadow-[0_15px_30px_rgba(0,0,0,0.8)]"
                />
              ) : (
                <path
                  d="M 100,650 L 100,300 A 400,400 0 0,1 900,300 L 900,650 Z"
                  fill="url(#granite-rock)"
                  stroke="#0f172a"
                  strokeWidth="10"
                  className="drop-shadow-[0_15px_30px_rgba(0,0,0,0.8)]"
                />
              )}

              {/* Internal edge shadow line */}
              {is9m2 ? (
                <path
                  d="M 280,520 L 280,280 A 220,220 0 0,1 720,280 L 720,520 Z"
                  fill="none"
                  stroke="#374151"
                  strokeWidth="2"
                  opacity="0.8"
                />
              ) : (
                <path
                  d="M 100,650 L 100,300 A 400,400 0 0,1 900,300 L 900,650 Z"
                  fill="none"
                  stroke="#374151"
                  strokeWidth="2"
                  opacity="0.8"
                />
              )}

              {/* DYNAMIC EXCAVATED ORGANIC VOID (Morphing jagged cavity with raw rock outline) */}
              {activeStep > 0 && activeStep < maxStep && (
                <g>
                  {/* Outer glow/rim shadow */}
                  <motion.path
                    key={`organic-void-bg-${gabarit}`}
                    d={getOrganicVoidPath(500, is9m2 ? 350 : 430, activeStep, 3)}
                    fill="none"
                    stroke="#475569"
                    strokeWidth="4"
                    opacity="0.6"
                    pointerEvents="none"
                  />
                  {/* The jagged raw rock void itself */}
                  <motion.path
                    key={`organic-void-${gabarit}`}
                    d={getOrganicVoidPath(500, is9m2 ? 350 : 430, activeStep, 0)}
                    fill="url(#void-backlight)"
                    stroke="#ffffff"
                    strokeWidth="2"
                    strokeDasharray="8,4"
                    initial={{ opacity: 0.8 }}
                    animate={{ opacity: 0.95 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                    className="shadow-inner"
                  />
                </g>
              )}

              {/* STAGE COMPLETE: FULL Profile Excavation Complete */}
              {activeStep === maxStep && (
                <motion.path
                  d={is9m2 ? "M 280,520 L 280,280 A 220,220 0 0,1 720,280 L 720,520 Z" : "M 100,650 L 100,300 A 400,400 0 0,1 900,300 L 900,650 Z"}
                  fill="#000000"
                  stroke="#22c55e"
                  strokeWidth="4"
                  initial={{ opacity: 0.8 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                />
              )}

              {/* CONNECTED GROUP LINES (Show holes of the active/blasting group linked together) */}
              {blastingHoles.length > 1 && (
                <g opacity="0.35" pointerEvents="none">
                  {blastingHoles.map((h, idx) => {
                    const nextHole = blastingHoles[(idx + 1) % blastingHoles.length];
                    const color = getHoleColorHex(h);
                    return (
                      <motion.line
                        key={`line-${h.id}-${nextHole.id}`}
                        x1={h.x}
                        y1={h.y}
                        x2={nextHole.x}
                        y2={nextHole.y}
                        stroke={color}
                        strokeWidth="1.5"
                        strokeDasharray="4,4"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 0.4 }}
                      />
                    );
                  })}
                </g>
              )}

              {/* SHOCK WAVE radiating from group gravity epicentre */}
              {activeStep > 0 && (
                <g clipPath={`url(#gallery-clip-${gabarit})`}>
                  <motion.circle
                    key={`shockwave-${activeStep}`}
                    cx={centerOfGravity.x}
                    cy={centerOfGravity.y}
                    initial={{ r: 10, opacity: 0.8 }}
                    animate={{ r: is9m2 ? 200 : 350, opacity: 0 }}
                    transition={{ duration: 0.6, ease: "easeOut" }}
                    fill="none"
                    stroke="#fbbf24"
                    strokeWidth="2.5"
                    pointerEvents="none"
                  />
                </g>
              )}

              {/* VISUAL PUSH ARROWS ON HOVER */}
              {hoveredHole && hoveredHole.type !== 'vide' && getHoleStatus(hoveredHole) === 'normal' && (
                <>
                  {/* Golden line representing force vector */}
                  {(() => {
                    const arrow = getArrowCoords(hoveredHole);
                    if (!arrow) return null;
                    return (
                      <motion.line
                        x1={arrow.x1}
                        y1={arrow.y1}
                        x2={arrow.x2}
                        y2={arrow.y2}
                        stroke="#fbbf24"
                        strokeWidth="3.5"
                        markerEnd="url(#marker-arrow)"
                        initial={{ strokeDashoffset: 50, strokeDasharray: 100 }}
                        animate={{ strokeDashoffset: 0 }}
                        className="animate-pulse"
                      />
                    );
                  })()}
                </>
              )}

              {showDangerZones && (
                <g className="danger-zones">
                  {(activeDangerLayer === 'all' || activeDangerLayer === 'projection') && (
                    <g>
                      <rect x="100" y="50" width="800" height="600"
                        fill="rgba(239,68,68,0.15)"
                        stroke="rgba(239,68,68,0.6)"
                        strokeWidth="3"
                        strokeDasharray="8,4"
                        rx="4"
                      />
                      <text x="500" y="100" fill="rgba(239,68,68,0.85)"
                        fontSize="22" fontWeight="900" textAnchor="middle"
                        fontFamily="Arial" textDecoration="none"
                      >
                        ⚠️ ZONE DE PROJECTION — Min. 50m
                      </text>
                      <text x="500" y="125" fill="rgba(239,68,68,0.65)"
                        fontSize="14" fontWeight="700" textAnchor="middle"
                        fontFamily="Arial"
                      >
                        Évacuation totale obligatoire
                      </text>

                      <path d="M 500 620 L 500 680"
                        stroke="rgba(239,68,68,0.7)"
                        strokeWidth="3" markerEnd="url(#arrowRed)" />
                      <text x="500" y="700" fill="rgba(239,68,68,0.7)"
                        fontSize="13" fontWeight="700" textAnchor="middle"
                        fontFamily="Arial">ÉVACUER ICI</text>

                      <defs>
                        <marker id="arrowRed" markerWidth="10" markerHeight="7"
                          refX="10" refY="3.5" orient="auto">
                          <polygon points="0 0, 10 3.5, 0 7"
                            fill="rgba(239,68,68,0.7)" />
                        </marker>
                      </defs>
                    </g>
                  )}

                  {(activeDangerLayer === 'all' || activeDangerLayer === 'vibrations') && (
                    <g>
                      <ellipse cx="500" cy="430" rx="200" ry="150"
                        fill="rgba(249,115,22,0.10)"
                        stroke="rgba(249,115,22,0.5)"
                        strokeWidth="2.5"
                        strokeDasharray="6,3"
                      />
                      <text x="500" y="260" fill="rgba(249,115,22,0.80)"
                        fontSize="17" fontWeight="900" textAnchor="middle"
                        fontFamily="Arial"
                      >
                        🟠 ZONE VIBRATIONS — Contrôle soutènement
                      </text>
                      <text x="500" y="280" fill="rgba(249,115,22,0.60)"
                        fontSize="13" fontWeight="600" textAnchor="middle"
                        fontFamily="Arial"
                      >
                        Inspecter boulons + grillage après tir
                      </text>
                    </g>
                  )}

                  {(activeDangerLayer === 'all' || activeDangerLayer === 'gaz') && (
                    <g>
                      <ellipse cx="500" cy="200" rx="350" ry="120"
                        fill="rgba(234,179,8,0.12)"
                        stroke="rgba(234,179,8,0.5)"
                        strokeWidth="2"
                        strokeDasharray="5,3"
                      />
                      <text x="500" y="155" fill="rgba(180,130,0,0.85)"
                        fontSize="17" fontWeight="900" textAnchor="middle"
                        fontFamily="Arial"
                      >
                        🟡 GAZ TOXIQUES — CO · NO₂ · NH₃
                      </text>
                      <text x="500" y="175" fill="rgba(180,130,0,0.65)"
                        fontSize="13" fontWeight="600" textAnchor="middle"
                        fontFamily="Arial"
                      >
                        Ventilation min. 30 min — Mesure CO obligatoire
                      </text>
                    </g>
                  )}
                </g>
              )}

              {/* DRAW ALL HOLES */}
              {holesToRender.map((hole) => {
                const status = getHoleStatus(hole);
                return (
                  <g key={hole.id}>
                    
                    {/* Blasted Hole Scar (Remains visible as crater in the void) */}
                    {status === 'exploded' && (
                      <g opacity="0.5">
                        {/* Dark crater background */}
                        <circle
                          cx={hole.x}
                          cy={hole.y}
                          r={is9m2 ? "6" : "10"}
                          fill="#1a1a2e"
                          stroke="#4b5563"
                          strokeWidth="1.5"
                          strokeDasharray="3,2"
                        />
                        {/* Radial cracking lines */}
                        <line x1={hole.x - (is9m2 ? 9 : 14)} y1={hole.y} x2={hole.x - (is9m2 ? 4 : 6)} y2={hole.y} stroke="#4b5563" strokeWidth="1.5" />
                        <line x1={hole.x + (is9m2 ? 4 : 6)} y1={hole.y} x2={hole.x + (is9m2 ? 9 : 14)} y2={hole.y} stroke="#4b5563" strokeWidth="1.5" />
                        <line x1={hole.x} y1={hole.y - (is9m2 ? 9 : 14)} x2={hole.x} y2={hole.y - (is9m2 ? 4 : 6)} stroke="#4b5563" strokeWidth="1.5" />
                        <line x1={hole.x} y1={hole.y + (is9m2 ? 4 : 6)} x2={hole.x} y2={hole.y + (is9m2 ? 9 : 14)} stroke="#4b5563" strokeWidth="1.5" />
                        
                        {/* Diagonal cracking lines */}
                        <line x1={hole.x - (is9m2 ? 6 : 10)} y1={hole.y - (is9m2 ? 6 : 10)} x2={hole.x - (is9m2 ? 3 : 4)} y2={hole.y - (is9m2 ? 3 : 4)} stroke="#4b5563" strokeWidth="1" />
                        <line x1={hole.x + (is9m2 ? 3 : 4)} y1={hole.y + (is9m2 ? 3 : 4)} x2={hole.x + (is9m2 ? 6 : 10)} y2={hole.y + (is9m2 ? 6 : 10)} stroke="#4b5563" strokeWidth="1" />
                        <line x1={hole.x + (is9m2 ? 3 : 4)} y1={hole.y - (is9m2 ? 3 : 4)} x2={hole.x + (is9m2 ? 6 : 10)} y2={hole.y - (is9m2 ? 6 : 10)} stroke="#4b5563" strokeWidth="1" />
                        <line x1={hole.x - (is9m2 ? 6 : 10)} y1={hole.y + (is9m2 ? 3 : 4)} x2={hole.x - (is9m2 ? 3 : 4)} y2={hole.y + (is9m2 ? 6 : 10)} stroke="#4b5563" strokeWidth="1" />
                        
                        {/* Central hot spot */}
                        <circle
                          cx={hole.x}
                          cy={hole.y}
                          r={is9m2 ? "2" : "3"}
                          fill="#ef4444"
                          opacity="0.6"
                        />
                      </g>
                    )}

                    {/* Smoke trails from recently exploded group */}
                    {(() => {
                      const blastStep = getBlastStepForHole(hole, gabarit);
                      if (activeStep > 0 && activeStep - 1 === blastStep) {
                        return (
                          <g clipPath={`url(#gallery-clip-${gabarit})`}>
                            {stableExplosionData.smokeMap[hole.id]?.map((s) => (
                              <motion.circle
                                key={s.id}
                                cx={hole.x}
                                cy={hole.y}
                                r={is9m2 ? s.size * 0.6 : s.size}
                                fill="#4b5563"
                                initial={{ x: 0, y: 0, opacity: 0.6, scale: 0.6 }}
                                animate={{ x: s.tx, y: s.ty, opacity: 0, scale: 1.5 }}
                                transition={{ duration: 2.0, delay: s.delay, ease: "easeOut" }}
                                pointerEvents="none"
                              />
                            ))}
                          </g>
                        );
                      }
                      return null;
                    })()}

                    {/* Active hole's physical circle */}
                    {status !== 'exploded' && (
                      <>
                        {/* High-tech glow ring for unexploded holes (Solution C) */}
                        {status === 'normal' && (
                          <motion.circle
                            cx={hole.x}
                            cy={hole.y}
                            r={is9m2 ? "17" : "26"}
                            fill="none"
                            stroke={getHoleColorHex(hole)}
                            strokeWidth="1.5"
                            opacity="0.3"
                            animate={{
                              scale: [0.95, 1.12, 0.95],
                              opacity: [0.25, 0.5, 0.25]
                            }}
                            transition={{
                              duration: 2 + (hole.x % 3) * 0.4,
                              repeat: Infinity,
                              ease: "easeInOut"
                            }}
                            pointerEvents="none"
                          />
                        )}
                        <circle
                          cx={hole.x}
                          cy={hole.y}
                          r={hoveredHole?.id === hole.id ? (is9m2 ? "16" : "24") : (is9m2 ? "11.5" : "18")}
                          className={`${getHoleColorClasses(hole, status)} transition-all duration-300 cursor-pointer stroke-[3.5px]`}
                          onMouseEnter={() => setHoveredHole(hole)}
                          onMouseLeave={() => setHoveredHole(null)}
                        />
                      </>
                    )}

                    {/* Text label index inside the circle */}
                    {status !== 'exploded' && (
                      <text
                        x={hole.x}
                        y={is9m2 ? hole.y + 3.5 : hole.y + 5}
                        textAnchor="middle"
                        className="font-black uppercase tracking-tighter fill-current select-none pointer-events-none"
                        style={{ fontSize: is9m2 ? '8px' : '12px' }}
                        fill={
                          hole.type === 'vide'
                            ? '#1e293b'
                            : hole.type === 'charge'
                            ? '#ffffff'
                            : '#111827'
                        }
                      >
                        {hole.label}
                      </text>
                    )}

                    {/* Cinematic explosion triggers on 'blasting' */}
                    {status === 'blasting' && (
                      <g clipPath={`url(#gallery-clip-${gabarit})`}>
                        {/* Golden Radial Blast Flare */}
                        <motion.circle
                          cx={hole.x}
                          cy={hole.y}
                          initial={{ r: is9m2 ? 12 : 20, opacity: 0.8 }}
                          animate={{ r: is9m2 ? 50 : 80, opacity: 0 }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                          fill="url(#blast-glow)"
                          pointerEvents="none"
                        />

                        {/* Outer expanding shock disk */}
                        <circle
                          cx={hole.x}
                          cy={hole.y}
                          r={is9m2 ? "22" : "35"}
                          fill="rgba(245, 158, 11, 0.35)"
                          className="animate-ping"
                        />

                        {/* MICRO-ONDE PAR TROU */}
                        <motion.circle
                          cx={hole.x}
                          cy={hole.y}
                          initial={{ r: is9m2 ? 9 : 15, opacity: 0.9 }}
                          animate={{ r: is9m2 ? 32 : 50, opacity: 0 }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                          fill="none"
                          stroke="#fbbf24"
                          strokeWidth="1.5"
                          pointerEvents="none"
                        />

                        {/* Spinning stone fragments flying (Colored by group gradient, max 8) */}
                        {stableExplosionData.fragmentsMap[hole.id]?.map((f) => (
                          <motion.polygon
                            key={f.id}
                            points={f.points}
                            fill={`url(#grad-${hole.type})`}
                            stroke="#111827"
                            strokeWidth="0.5"
                            initial={{ x: hole.x, y: hole.y, opacity: 1, rotate: 0, scale: 1 }}
                            animate={{ x: hole.x + f.tx, y: hole.y + f.ty, opacity: 0, rotate: f.rot, scale: 0.5 }}
                            transition={{ duration: 0.9, ease: "easeOut" }}
                            pointerEvents="none"
                          />
                        ))}

                        {/* Fine explosion rock particles (Triangular/Quad polygons, max 15) */}
                        {stableExplosionData.particlesMap[hole.id]?.map((p) => (
                          <motion.polygon
                            key={p.id}
                            points={p.points}
                            fill={p.color}
                            stroke="#111827"
                            strokeWidth="0.3"
                            initial={{ x: hole.x, y: hole.y, opacity: 1, rotate: 0, scale: 1 }}
                            animate={{ x: hole.x + p.tx, y: hole.y + p.ty, opacity: 0, rotate: p.rot, scale: 0.2 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            pointerEvents="none"
                          />
                        ))}

                        {/* Gravity falling debris (Only for elargissement, max 5) */}
                        {stableExplosionData.debrisMap[hole.id]?.map((d) => (
                          <motion.polygon
                            key={d.id}
                            points={d.points}
                            fill="#1e293b"
                            stroke="#475569"
                            strokeWidth="0.5"
                            initial={{ x: hole.x, y: hole.y, opacity: 1, rotate: 0 }}
                            animate={{ x: hole.x + d.tx, y: hole.y + d.ty, opacity: [1, 1, 0], rotate: 360 }}
                            transition={{ duration: 1.2, delay: d.delay, ease: "easeIn" }}
                            pointerEvents="none"
                          />
                        ))}
                      </g>
                    )}
                  </g>
                );
              })}
            </motion.g>
          </svg>
            </>
          )}

          {view3D && (
            <Iso3DView
              gabarit={gabarit}
              activeStep={activeStep}
              holesToRender={holesToRender}
              getBlastStepForHole={getBlastStepForHole}
              setHoveredHole={setHoveredHole}
              hoveredHole={hoveredHole}
            />
          )}
        </div>

        {showDangerZones && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
            {(activeDangerLayer === 'all' || activeDangerLayer === 'projection') && (
              <div className="bg-rose-50 border border-rose-200 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-3 h-3 rounded-full bg-rose-500 block" />
                  <span className="text-[10px] font-black uppercase text-rose-700 tracking-wider">Zone de Projection</span>
                </div>
                <p className="text-[9px] text-rose-600 font-semibold leading-relaxed">
                  Distance minimale : 50 m depuis le front de taille.
                  Toute présence humaine interdite. Accès condamné
                  par le boutefeu avant connexion des amorces.
                </p>
              </div>
            )}

            {(activeDangerLayer === 'all' || activeDangerLayer === 'vibrations') && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-3 h-3 rounded-full bg-orange-500 block" />
                  <span className="text-[10px] font-black uppercase text-orange-700 tracking-wider">Zone Vibrations</span>
                </div>
                <p className="text-[9px] text-orange-600 font-semibold leading-relaxed">
                  Zone de contrainte vibratoire (10–50 m).
                  Inspecter le soutènement (boulons, grillage, béton projeté)
                  avant retour du personnel en galerie.
                </p>
              </div>
            )}

            {(activeDangerLayer === 'all' || activeDangerLayer === 'gaz') && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="w-3 h-3 rounded-full bg-yellow-500 block" />
                  <span className="text-[10px] font-black uppercase text-yellow-700 tracking-wider">Gaz Toxiques</span>
                </div>
                <p className="text-[9px] text-yellow-700 font-semibold leading-relaxed">
                  CO, NO₂, NH₃ produits après détonation.
                  Ventilation forcée minimum 30 minutes.
                  Mesure CO obligatoire (&lt;25 ppm) avant accès.
                  Détecteur multi-gaz recommandé.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ACTIVE HOVER DETAIL BOARD */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 text-xs font-semibold text-white shadow-xl">
          {hoveredHole ? (
            <div className="space-y-1.5 w-full">
              <div className="flex items-center gap-2">
                <span className={`w-3 h-3 rounded-full ${
                  hoveredHole.type === 'vide' ? 'bg-white border' : 'bg-amber-400'
                }`} />
                <span className="font-black uppercase tracking-wider text-amber-400 text-sm">
                  {hoveredHole.name}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[10px] text-slate-300 uppercase">
                <p>Type: <span className="font-extrabold text-white">{hoveredHole.type}</span></p>
                <p>Délai: <span className="font-extrabold text-white">{hoveredHole.delay} ms</span></p>
                {hoveredHole.type !== 'vide' && (
                  <p className="text-amber-300 flex items-center gap-1 font-black">
                    🎯 Vecteur de poussée : VERS LE VIDE CENTRAL
                  </p>
                )}
              </div>
              <p className="text-slate-400 text-[11px] font-medium leading-relaxed italic border-t border-slate-800/60 pt-2 mt-1.5">
                {hoveredHole.desc}
              </p>
            </div>
          ) : (
            <div className="text-slate-400 font-medium italic py-2 flex items-center gap-2">
              <Info className="w-4 h-4 text-slate-400 shrink-0 animate-pulse" />
              Survolez un trou de forage sur le schéma pour analyser son délai, sa fonction et le vecteur de poussée mécanique.
            </div>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN: TIMELINE & FOOTAGE METERS (3 Columns) */}
      <div className="lg:col-span-3 flex flex-col justify-between space-y-6">
        
        {/* PROGRESS METRAGE PANEL */}
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
              Rendement Volée
            </span>
            <span className="text-[10px] font-black uppercase text-amber-600 bg-amber-400/10 px-2 py-0.5 rounded">
              SMI Objectif
            </span>
          </div>

          <h3 className="text-sm font-black uppercase text-slate-800 tracking-tight">
            MÉTRAGE ARRACHÉ ESTIMÉ
          </h3>

          <div className="space-y-2">
            <div className="flex justify-between items-baseline font-mono">
              <span className="text-3xl font-black text-slate-900">
                {getFootage().toFixed(1)} m
              </span>
              <span className="text-xs font-bold text-slate-500">
                sur {currentMaxDepth.toFixed(1)} m foré
              </span>
            </div>

            {/* GOLD PROGRESS BAR */}
            <div className="w-full bg-slate-200 h-4 rounded-full overflow-hidden relative border border-slate-300/30">
              <motion.div
                className="bg-gradient-to-r from-amber-500 to-amber-400 h-full rounded-full"
                initial={{ width: '0%' }}
                animate={{ width: `${currentPercentage}%` }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
              />
            </div>
            
            <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
              <span>Départ : 0.0m</span>
              <span>{currentPercentage}% du plan d'avancement</span>
            </div>
          </div>

          {/* ACTIVE GOAL VERDICT */}
          <div className="border-t border-slate-200/50 pt-4 mt-2">
            {activeStep === maxStep ? (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-emerald-800 space-y-1">
                <p className="text-xs font-black uppercase flex items-center gap-1.5">
                  ✅ 100% DU MÉTRAGE FORÉ
                </p>
                <p className="text-[10.5px] font-semibold text-emerald-700 leading-relaxed">
                  Excellent ! Le tir est complet. La roche de fond est intégralement arrachée jusqu'à l'extrémité des barres de forage, ne laissant aucun culot improductif.
                </p>
              </div>
            ) : (
              <div className="bg-slate-100 rounded-xl p-3 text-slate-600 space-y-1">
                <p className="text-xs font-black uppercase text-slate-700">
                  Tir en cours ({activeStep}/{maxStep})
                </p>
                <p className="text-[10.5px] font-semibold text-slate-500 leading-relaxed">
                  Faites défiler les étapes pour analyser le front de taille. Le métrage arraché augmente proportionnellement à l'évacuation des anneaux de cisaillement.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* TIMELINE CONTROLLERS */}
        <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-5 flex-1 flex flex-col justify-between">
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase text-amber-600 bg-amber-400/10 px-2 py-0.5 rounded">
              Séquence Temporelle
            </span>
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h3 className="text-sm font-black uppercase text-slate-900">
                LIGNE DE RETARD
              </h3>
              <span className="font-mono text-xs font-black bg-slate-900 text-white px-2 py-0.5 rounded">
                Étape {activeStep} / {maxStep}
              </span>
            </div>
          </div>

          {/* Current step card description */}
          <div className="bg-slate-50 border border-slate-100 rounded-xl p-4 space-y-2 flex-1 flex flex-col justify-center">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black uppercase text-slate-800">
                {stepExplanations[activeStep].title}
              </span>
              <span className="text-[10px] font-black uppercase text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded flex items-center gap-1">
                <Flame className="w-3 h-3 text-rose-500 shrink-0" />
                {stepExplanations[activeStep].time}
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-600 leading-relaxed">
              {stepExplanations[activeStep].desc}
            </p>
          </div>

          {/* CONTROLS BAR */}
          <div className="space-y-4 pt-2">
            
            {/* STEP DOTS CLICKABLE */}
            <div className="flex items-center justify-between px-1">
              {Array.from({ length: maxStep + 1 }).map((_, stepIdx) => (
                <button
                  key={stepIdx}
                  onClick={() => {
                    setActiveStep(stepIdx);
                    setIsPlaying(false);
                  }}
                  className={`w-6 h-6 rounded-full font-mono text-[10px] font-black flex items-center justify-center transition-all ${
                    activeStep === stepIdx
                      ? 'bg-amber-400 text-slate-950 scale-120 ring-2 ring-amber-500/30 font-black'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-500'
                  }`}
                >
                  {stepIdx}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                Contrôle du Tir
              </span>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setView3D(prev => !prev)}
                  className={`flex items-center gap-2 px-4 py-2.5 text-[10px]
                    font-black uppercase tracking-wider rounded-xl border
                    shadow-md transition-all ${view3D
                      ? 'bg-indigo-600 text-white border-indigo-700 shadow-indigo-500/30'
                      : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-300'
                    }`}
                >
                  🏔️ Vue 3D
                </button>
                <button
                  onClick={() => setShowDangerZones(prev => !prev)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-[9px]
                    font-black uppercase tracking-wider rounded-lg border transition-colors
                    ${showDangerZones
                      ? 'bg-rose-600 text-white border-rose-700'
                      : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-rose-50 hover:text-rose-600'
                    }`}
                >
                  ⚠️ Zones de Danger
                </button>
                <button
                  onClick={() => {
                    setRealtimeMode(prev => !prev);
                    setRealtimePlaying(false);
                    setRealtimeMs(0);
                    setIsPlaying(false);
                    if (realtimeRef.current) clearTimeout(realtimeRef.current);
                  }}
                  className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-wider
                    rounded-lg border transition-colors ${realtimeMode
                      ? 'bg-amber-500 text-white border-amber-600'
                      : 'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200'
                    }`}
                >
                  ⚡ Temps Réel ×100
                </button>
              </div>
            </div>

            {view3D && (
              <div className="flex items-center gap-2 px-4 py-2 bg-indigo-950/50
                border border-indigo-900/50 rounded-xl text-[9px] text-indigo-300
                font-semibold">
                <span>🏔️</span>
                <span>
                  Vue isométrique active — Les contrôles de séquence animent
                  la vue 3D. Cliquez à nouveau sur "Vue 3D" pour revenir à la
                  vue de face interactive.
                </span>
              </div>
            )}

            {showDangerZones && (
              <div className="flex items-center gap-2 flex-wrap pt-1">
                <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider">Afficher :</span>
                {[
                  { id: 'all', label: 'Toutes les zones', color: 'bg-slate-700' },
                  { id: 'projection', label: '🔴 Projection', color: 'bg-rose-600' },
                  { id: 'vibrations', label: '🟠 Vibrations', color: 'bg-orange-500' },
                  { id: 'gaz', label: '🟡 Gaz toxiques', color: 'bg-yellow-500' },
                ].map(layer => (
                  <button
                    key={layer.id}
                    onClick={() => setActiveDangerLayer(layer.id as any)}
                    className={`px-3 py-1.5 text-[9px] font-black uppercase
                      tracking-wider rounded-lg transition-colors ${
                      activeDangerLayer === layer.id
                        ? `${layer.color} text-white`
                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                  >
                    {layer.label}
                  </button>
                ))}
              </div>
            )}

            {realtimeMode ? (
              <div className="flex justify-center pt-1">
                {!realtimePlaying ? (
                  <button
                    onClick={startRealtimePlayback}
                    className="flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-colors w-full justify-center"
                  >
                    💥 Déclencher le Tir
                  </button>
                ) : (
                  <button
                    onClick={stopRealtimePlayback}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-800 text-white text-[10px] font-black uppercase tracking-wider rounded-xl transition-colors w-full justify-center"
                  >
                    ⏹ Arrêter
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-5 gap-2 pt-1">
                <button
                  onClick={handleReset}
                  title="Départ"
                  className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg flex items-center justify-center transition-colors text-xs font-bold"
                >
                  <RotateCcw className="w-4 h-4 shrink-0" />
                </button>
                <button
                  onClick={handlePrev}
                  disabled={activeStep === 0}
                  className="py-2.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-800 rounded-lg flex items-center justify-center transition-colors text-xs font-bold"
                >
                  <ChevronLeft className="w-4 h-4 shrink-0" />
                </button>
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className={`py-2.5 rounded-lg flex items-center justify-center gap-1.5 transition-colors text-xs font-black uppercase tracking-wider ${
                    isPlaying
                      ? 'bg-rose-500 hover:bg-rose-600 text-white'
                      : 'bg-amber-400 hover:bg-amber-500 text-slate-950 font-black'
                  }`}
                >
                  {isPlaying ? <Pause className="w-3.5 h-3.5 shrink-0" /> : <Play className="w-3.5 h-3.5 shrink-0" />}
                  {isPlaying ? "PAUSE" : "AUTO"}
                </button>
                <button
                  onClick={handleNext}
                  disabled={activeStep === maxStep}
                  className="py-2.5 bg-slate-100 hover:bg-slate-200 disabled:opacity-40 text-slate-800 rounded-lg flex items-center justify-center transition-colors text-xs font-bold"
                >
                  <ChevronRight className="w-4 h-4 shrink-0" />
                </button>
                <button
                  onClick={handleGoToEnd}
                  title="Fin"
                  className="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg flex items-center justify-center transition-colors text-xs font-bold"
                >
                  <SkipForward className="w-4 h-4 shrink-0" />
                </button>
              </div>
            )}

            {realtimeMode && (realtimePlaying || realtimeMs > 0) && (
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-center gap-4 py-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="text-center">
                    <span className="text-[#ffd700] font-black text-3xl font-mono">
                      {realtimeMs.toFixed(1)}
                    </span>
                    <span className="text-slate-400 text-xs ml-1">ms</span>
                    <div className="text-slate-500 text-[8px] uppercase tracking-wider mt-0.5">
                      Temps écoulé (×100 accéléré)
                    </div>
                  </div>

                  <div className="w-px h-10 bg-slate-700" />

                  <div className="text-center">
                    <span className="text-white font-black text-xl">
                      {TOTAL_DURATION_MS} ms
                    </span>
                    <div className="text-slate-500 text-[8px] uppercase tracking-wider mt-0.5">
                      Durée totale réelle
                    </div>
                  </div>

                  <div className="w-px h-10 bg-slate-700" />

                  <div className="text-center">
                    <span className="text-emerald-400 font-black text-xl">
                      {REAL_DELAYS_MS[activeStep]} ms
                    </span>
                    <div className="text-slate-500 text-[8px] uppercase tracking-wider mt-0.5">
                      Détonateur actif
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-500 transition-all"
                      style={{ width: `${(realtimeMs / TOTAL_DURATION_MS) * 100}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[8px] text-slate-500 mt-1">
                    <span>0 ms</span>
                    {REAL_DELAYS_MS.slice(1).map(d => (
                      <span key={d}>{d} ms</span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* CAVEAT ALERTS */}
        <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
          <p className="text-[10.5px] font-black uppercase text-red-700 flex items-center gap-1.5 mb-1">
            <ShieldAlert className="w-4 h-4 text-red-500 shrink-0" />
            Consigne critique de sécurité
          </p>
          <p className="text-[10px] font-bold text-red-600 leading-relaxed">
            La voûte de galerie est la zone la plus exposée à l'écaillage. Les {gabarit === '9m2' ? '3' : '3'} trous de voûte doivent être forés parallèlement avec un angle de relèvement de 3% maximum. Un sur-profilage fragilise le massif, tandis qu'un sous-profilage bloque la circulation des engins de transport de minerai.
          </p>
        </div>

      </div>

      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-lg w-full relative z-10 overflow-hidden"
            >
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-500" />
              <div className="p-6 md:p-8 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                    <Info className="w-5 h-5 text-amber-500" />
                    Pourquoi ce gabarit ?
                  </h3>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors cursor-pointer text-sm font-bold"
                  >
                    ✕
                  </button>
                </div>
                <div className="text-slate-600 font-medium text-xs leading-relaxed uppercase tracking-wide">
                  {gabarit === '12m2' && (
                    <p>
                      Le gabarit 12m² SMI est la configuration de référence du terrain du CHANTIER MINIER (X). Optimisé pour les roches hautement silicifiées de la mine, il utilise un bouchon en triangle à 3 trous vides (décompression) pour guider l'énergie du tir. Ce design historique permet un avancement fiable de 2.1m par volée avec un taux de réussite de 94% dans nos conditions géologiques spécifiques.
                    </p>
                  )}
                  {gabarit === '12m2_intl' && (
                    <p>
                      Le gabarit 12m² International repose sur la méthodologie standard Langefors-Kihlström (1963). Conçu pour une distribution de contraintes perfectly homogène, il utilise un bouchon en carré de 6 trous de décompression vides entourant 3 trous chargés. Ce standard mondial maximise le coefficient de foisonnement et minimise les hors-profils dans les terrains réguliers.
                    </p>
                  )}
                  {gabarit === '9m2' && (
                    <p>
                      Le gabarit 9m² est optimisé pour les galeries de reconnaissance et de traçage de section réduite (3m x 3m). Avec seulement 28 trous et un bouchon à un seul trou vide d'expansion, il réduit la consommation d'explosifs et le temps de foration par cycle, tout en maintenant un profil de voûte en arc de cercle autoportant.
                    </p>
                  )}
                  {gabarit === '9m2_intl' && (
                    <p>
                      Le gabarit 9m² International est configuré avec un bouchon standard de 7 trous (3 vides de décompression et 4 chargés avec TOVEX + ANFO). Ce standard permet d'équilibrer l'évacuation de la roche broyée et de garantir un avancement parfait de la galerie même dans les terrains rocheux les plus durs et silicifiés de SMI.
                    </p>
                  )}
                </div>
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="px-5 py-2.5 bg-slate-900 hover:bg-black text-[#ffd700] text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-md"
                  >
                    Fermer
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {showFicheForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFicheForm(false)}
              className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.5 }}
              className="bg-white rounded-2xl shadow-2xl border border-slate-100 max-w-lg w-full relative z-10 overflow-hidden"
            >
              <div className="bg-slate-900 p-5 text-white relative">
                <button
                  onClick={() => setShowFicheForm(false)}
                  className="absolute top-5 right-5 text-slate-400 hover:text-white text-sm font-bold cursor-pointer"
                >
                  ✕
                </button>
                <h3 className="text-sm font-black tracking-widest text-[#ffd700] flex items-center gap-2">
                  📄 FICHE DE TIR — CHANTIER MINIER (X)
                </h3>
                <p className="text-[10px] text-slate-300 uppercase font-bold tracking-wider mt-1">
                  {is9m2 ? 'Traçage 9m²' : 'Galerie 12m²'}
                </p>
              </div>

              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                      Numéro de tir*
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: T-2026-001"
                      value={ficheData.numeroTir}
                      onChange={(e) => setFicheData(p => ({ ...p, numeroTir: e.target.value }))}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[11px] font-semibold text-slate-800 outline-none focus:border-amber-400 w-full"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                      Date*
                    </label>
                    <input
                      type="date"
                      value={ficheData.date}
                      onChange={(e) => setFicheData(p => ({ ...p, date: e.target.value }))}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[11px] font-semibold text-slate-800 outline-none focus:border-amber-400 w-full"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                      Chantier / Galerie*
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: G-14 — Niveau 680"
                      value={ficheData.chantier}
                      onChange={(e) => setFicheData(p => ({ ...p, chantier: e.target.value }))}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[11px] font-semibold text-slate-800 outline-none focus:border-amber-400 w-full"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                      Type de tige
                    </label>
                    <div className="flex gap-2 h-[32px]">
                      <button
                        type="button"
                        onClick={() => setFicheData(p => ({ ...p, barreType: '1.8' }))}
                        className={`flex-1 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors ${
                          ficheData.barreType === '1.8'
                            ? 'bg-slate-900 text-white shadow-sm'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                        }`}
                      >
                        1.8 m
                      </button>
                      <button
                        type="button"
                        onClick={() => setFicheData(p => ({ ...p, barreType: '2.4' }))}
                        className={`flex-1 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors ${
                          ficheData.barreType === '2.4'
                            ? 'bg-slate-900 text-white shadow-sm'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                        }`}
                      >
                        2.4 m
                      </button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                      Nom du Boutefeu*
                    </label>
                    <input
                      type="text"
                      value={ficheData.boutefeuNom}
                      onChange={(e) => setFicheData(p => ({ ...p, boutefeuNom: e.target.value }))}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[11px] font-semibold text-slate-800 outline-none focus:border-amber-400 w-full"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                      Matricule Boutefeu
                    </label>
                    <input
                      type="text"
                      value={ficheData.boutefeuMatricule}
                      onChange={(e) => setFicheData(p => ({ ...p, boutefeuMatricule: e.target.value }))}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[11px] font-semibold text-slate-800 outline-none focus:border-amber-400 w-full"
                    />
                  </div>

                  <div className="col-span-2 space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                      Chef de Poste
                    </label>
                    <input
                      type="text"
                      value={ficheData.chefPostNom}
                      onChange={(e) => setFicheData(p => ({ ...p, chefPostNom: e.target.value }))}
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[11px] font-semibold text-slate-800 outline-none focus:border-amber-400 w-full"
                    />
                  </div>

                  <div className="col-span-2 space-y-1">
                    <label className="text-[10px] font-black uppercase text-slate-500 tracking-wider">
                      Observations
                    </label>
                    <textarea
                      rows={3}
                      value={ficheData.observations}
                      onChange={(e) => setFicheData(p => ({ ...p, observations: e.target.value }))}
                      placeholder="Conditions particulières, incidents, remarques..."
                      className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-[11px] font-semibold text-slate-800 outline-none focus:border-amber-400 w-full resize-none"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 p-4 flex justify-end gap-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowFicheForm(false)}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-black uppercase tracking-widest rounded-xl transition-all"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={generateFicheTir}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-black text-[#ffd700] text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-md"
                >
                  📄 Générer la Fiche PDF
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

interface Iso3DViewProps {
  gabarit: GabaritType;
  activeStep: number;
  holesToRender: HoleInfo[];
  getBlastStepForHole: (hole: HoleInfo, gab: GabaritType) => number;
  setHoveredHole: (hole: HoleInfo | null) => void;
  hoveredHole: HoleInfo | null;
}

const Iso3DView: React.FC<Iso3DViewProps> = ({
  gabarit, activeStep, holesToRender, getBlastStepForHole, setHoveredHole, hoveredHole
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const is9m2 = gabarit.startsWith('9m2');
  
  // Engine selection state
  const [engineMode, setEngineMode] = useState<'webgl' | 'svg'>('webgl');
  const [webglSupported, setWebglSupported] = useState<boolean>(true);

  // Toggles as standard React state
  const [showFores, setShowFores] = useState<boolean>(true);
  const [showExplosives, setShowExplosives] = useState<boolean>(true);
  const [showWalls, setShowWalls] = useState<boolean>(true);
  const [autoRotate, setAutoRotate] = useState<boolean>(false);

  // Vector 3D Engine coordinates state (SVG fall-back / concurrent mode)
  const [yaw, setYaw] = useState<number>(35);
  const [pitch, setPitch] = useState<number>(-20);
  const [zoom, setZoom] = useState<number>(is9m2 ? 1.05 : 0.85);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStart = useRef({ x: 0, y: 0 });

  // Dimensioning
  const gW = is9m2 ? 260 : 400;
  const gH = is9m2 ? 160 : 220;
  const gCX = 500;
  const gCY = is9m2 ? 350 : 430;
  const DEPTH = is9m2 ? 240 : 300;

  const sectionPoints = useMemo(() => {
    return is9m2 ? [
      [gCX - gW/2, gCY + gH/2],
      [gCX + gW/2, gCY + gH/2],
      [gCX + gW/2, gCY],
      [gCX + gW*0.45, gCY - gH*0.5],
      [gCX, gCY - gH*0.8],
      [gCX - gW*0.45, gCY - gH*0.5],
      [gCX - gW/2, gCY],
    ] : [
      [gCX - gW/2, gCY + gH/2],
      [gCX + gW/2, gCY + gH/2],
      [gCX + gW/2, gCY],
      [gCX + gW*0.45, gCY - gH*0.55],
      [gCX, gCY - gH*0.95],
      [gCX - gW*0.45, gCY - gH*0.55],
      [gCX - gW/2, gCY],
    ];
  }, [is9m2, gW, gH, gCX, gCY]);

  // WebGL detector
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const support = !!(
        window.WebGLRenderingContext &&
        (canvas.getContext('webgl') || canvas.getContext('experimental-webgl'))
      );
      setWebglSupported(support);
      if (!support) {
        setEngineMode('svg');
      }
    } catch (e) {
      setWebglSupported(false);
      setEngineMode('svg');
    }
  }, []);

  // Transform coordinates
  const getHole3DCoords = (hole: HoleInfo, z: number): { x: number; y: number; z: number } => {
    const isBouchon = hole.type === 'charge' || hole.type === 'vide';
    if (isBouchon && hole.type !== 'vide') {
      const convergenceFactor = 0.22 * (z / DEPTH);
      const x = hole.x + (gCX - hole.x) * convergenceFactor;
      const y = hole.y + (gCY - hole.y) * convergenceFactor;
      return { x, y, z };
    }
    return { x: hole.x, y: hole.y, z };
  };

  const getHole3DVector = (hole: HoleInfo, z: number): THREE.Vector3 => {
    const coords = getHole3DCoords(hole, z);
    return new THREE.Vector3(
      (coords.x - gCX) * 0.05,
      -(coords.y - gCY) * 0.05,
      (coords.z) * 0.05
    );
  };

  // SVG Projection function (Painter's Algorithm)
  const rotatePoint = (x: number, y: number, z: number): { sx: number; sy: number; depth: number } => {
    const xc = x - gCX;
    const yc = y - gCY;
    const zc = z - DEPTH / 2;

    const radYaw = (yaw * Math.PI) / 180;
    const radPitch = (pitch * Math.PI) / 180;

    // Y-axis rotation (Yaw)
    const x1 = xc * Math.cos(radYaw) - zc * Math.sin(radYaw);
    const z1 = xc * Math.sin(radYaw) + zc * Math.cos(radYaw);
    const y1 = yc;

    // X-axis rotation (Pitch)
    const x2 = x1;
    const y2 = y1 * Math.cos(radPitch) - z1 * Math.sin(radPitch);
    const z2 = y1 * Math.sin(radPitch) + z1 * Math.cos(radPitch);

    // Final 2D projection
    const sx = 500 + x2 * zoom;
    const sy = 280 + y2 * zoom;

    return { sx, sy, depth: z2 };
  };

  // Auto-rotate tick for SVG mode
  useEffect(() => {
    let animId: number;
    if (autoRotate && engineMode === 'svg') {
      const tick = () => {
        setYaw(y => (y + 0.4) % 360);
        animId = requestAnimationFrame(tick);
      };
      animId = requestAnimationFrame(tick);
    }
    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [autoRotate, engineMode]);

  // Event handlers for interactive dragging of the 3D SVG model
  const handleMouseDownSvg = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    setAutoRotate(false);
  };

  const handleMouseMoveSvg = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStart.current.x;
    const dy = e.clientY - dragStart.current.y;
    setYaw(prev => (prev + dx * 0.5 + 360) % 360);
    setPitch(prev => Math.max(-85, Math.min(85, prev - dy * 0.5)));
    dragStart.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUpSvg = () => {
    setIsDragging(false);
  };

  const handleTouchStartSvg = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setIsDragging(true);
      dragStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
      setAutoRotate(false);
    }
  };

  const handleTouchMoveSvg = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length !== 1) return;
    const dx = e.touches[0].clientX - dragStart.current.x;
    const dy = e.touches[0].clientY - dragStart.current.y;
    setYaw(prev => (prev + dx * 0.5 + 360) % 360);
    setPitch(prev => Math.max(-85, Math.min(85, prev - dy * 0.5)));
    dragStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleWheelSvg = (e: React.WheelEvent) => {
    if (e.deltaY < 0) {
      setZoom(z => Math.min(2.0, z + 0.05));
    } else {
      setZoom(z => Math.max(0.4, z - 0.05));
    }
  };

  // Helper functions for SVG Compass
  const compassCenter = { x: 910, y: 480 };
  const compassScale = 35;
  const radYaw = (yaw * Math.PI) / 180;
  const radPitch = (pitch * Math.PI) / 180;

  const rotateVector = (vx: number, vy: number, vz: number) => {
    const x1 = vx * Math.cos(radYaw) - vz * Math.sin(radYaw);
    const z1 = vx * Math.sin(radYaw) + vz * Math.cos(radYaw);
    const y1 = vy;
    const x2 = x1;
    const y2 = y1 * Math.cos(radPitch) - z1 * Math.sin(radPitch);
    return {
      ex: compassCenter.x + x2 * compassScale,
      ey: compassCenter.y + y2 * compassScale
    };
  };

  const axisX = rotateVector(1, 0, 0);
  const axisY = rotateVector(0, -1, 0);
  const axisZ = rotateVector(0, 0, 1);

  // Dynamic drawing queue for Painter's Algorithm in SVG mode
  const drawItems = useMemo(() => {
    const items: { depth: number; render: () => React.JSX.Element }[] = [];

    // 1. Back Face Plate
    const backProjPoints = sectionPoints.map(([px, py]) => rotatePoint(px, py, DEPTH));
    const backDepth = backProjPoints.reduce((acc, p) => acc + p.depth, 0) / backProjPoints.length;
    items.push({
      depth: backDepth,
      render: () => (
        <polygon
          key="back-plate-svg"
          points={backProjPoints.map(p => `${p.sx},${p.sy}`).join(' ')}
          fill="#060913"
          stroke="#1e293b"
          strokeWidth="1.5"
          opacity="0.95"
        />
      )
    });

    // 2. Tunnel Walls
    const SLICES = 6;
    if (showWalls) {
      for (let s = 0; s < SLICES; s++) {
        const za = s * (DEPTH / SLICES);
        const zb = (s + 1) * (DEPTH / SLICES);

        for (let i = 0; i < sectionPoints.length; i++) {
          const nextIdx = (i + 1) % sectionPoints.length;
          const p1 = sectionPoints[i];
          const p2 = sectionPoints[nextIdx];

          const v0 = rotatePoint(p1[0], p1[1], za);
          const v1 = rotatePoint(p2[0], p2[1], za);
          const v2 = rotatePoint(p2[0], p2[1], zb);
          const v3 = rotatePoint(p1[0], p1[1], zb);

          const wallDepth = (v0.depth + v1.depth + v2.depth + v3.depth) / 4;

          const dx = p2[0] - p1[0];
          const dy = p2[1] - p1[1];
          const len = Math.sqrt(dx * dx + dy * dy);
          const nx = dy / len;
          const ny = -dx / len;

          const lx = -0.3;
          const ly = -0.8;
          const dot = nx * lx + ny * ly;
          const brightnessFactor = 0.5 + 0.45 * Math.abs(dot);

          const r = Math.floor(18 + brightnessFactor * 30);
          const g = Math.floor(24 + brightnessFactor * 32);
          const b = Math.floor(38 + brightnessFactor * 42);
          const wallColor = `rgb(${r}, ${g}, ${b})`;

          items.push({
            depth: wallDepth,
            render: () => (
              <polygon
                key={`wall-${s}-${i}`}
                points={`${v0.sx},${v0.sy} ${v1.sx},${v1.sy} ${v2.sx},${v2.sy} ${v3.sx},${v3.sy}`}
                fill={wallColor}
                stroke="#0f172a"
                strokeWidth="0.5"
                opacity="0.82"
              />
            )
          });
        }
      }
    }

    // 3. Holes Initiation Delay network cords
    const activeHoles = holesToRender.filter(h => !activeStep || getBlastStepForHole(h, gabarit) >= activeStep);
    const sortedActive = [...activeHoles].sort((a, b) => getBlastStepForHole(a, gabarit) - getBlastStepForHole(b, gabarit));
    for (let i = 0; i < sortedActive.length - 1; i++) {
      const hA = sortedActive[i];
      const hB = sortedActive[i + 1];
      const stepA = getBlastStepForHole(hA, gabarit);
      const stepB = getBlastStepForHole(hB, gabarit);
      if (stepA === stepB || stepB === stepA + 1) {
        const ptA = getHole3DCoords(hA, 0);
        const ptB = getHole3DCoords(hB, 0);
        const projA = rotatePoint(ptA.x, ptA.y, 0);
        const projB = rotatePoint(ptB.x, ptB.y, 0);
        const cordDepth = (projA.depth + projB.depth) / 2 + 0.5;
        items.push({
          depth: cordDepth,
          render: () => (
            <line
              key={`cord-${hA.id}-${hB.id}`}
              x1={projA.sx} y1={projA.sy}
              x2={projB.sx} y2={projB.sy}
              stroke="rgba(244,63,94,0.3)"
              strokeWidth="1.2"
              strokeDasharray="3,3"
              pointerEvents="none"
            />
          )
        });
      }
    }

    // 4. Hole cylinders and spheres
    holesToRender.forEach((hole) => {
      const blastStep = getBlastStepForHole(hole, gabarit);
      const isExploded = activeStep > blastStep;
      const isBlasting = activeStep === blastStep;

      if (isExploded) return;

      const ptFront = getHole3DCoords(hole, 0);
      const ptMid = getHole3DCoords(hole, DEPTH * 0.35);
      const ptBack = getHole3DCoords(hole, DEPTH);

      const projFront = rotatePoint(ptFront.x, ptFront.y, ptFront.z);
      const projMid = rotatePoint(ptMid.x, ptMid.y, ptMid.z);
      const projBack = rotatePoint(ptBack.x, ptBack.y, ptBack.z);

      const color =
        hole.type === 'vide'     ? '#38bdf8' :
        hole.type === 'charge'   ? '#eab308' :
        hole.type === 'g1'       ? '#3b82f6' :
        hole.type === 'g2'       ? '#ef4444' :
        hole.type === 'g3'       ? '#22d3ee' :
        hole.type === 'g4'       ? '#f97316' :
        hole.type === 'radier'   ? '#8b5cf6' :
        hole.type === 'parement' ? '#14b8a6' :
                                   '#f43f5e';

      const diameter = hole.type === 'vide' ? 5 : 3.5;
      const strokeW = diameter * zoom;

      // Stemming line segment
      if (showFores) {
        const seg1Depth = (projFront.depth + projMid.depth) / 2;
        items.push({
          depth: seg1Depth,
          render: () => (
            <line
              key={`stem-${hole.id}`}
              x1={projFront.sx} y1={projFront.sy}
              x2={projMid.sx} y2={projMid.sy}
              stroke={hole.type === 'vide' ? 'rgba(56,189,248,0.7)' : '#94a3b8'}
              strokeWidth={strokeW}
              strokeDasharray={hole.type === 'vide' ? 'none' : '2,2'}
            />
          )
        });
      }

      // Explosive line segment
      if (showExplosives && hole.type !== 'vide') {
        const seg2Depth = (projMid.depth + projBack.depth) / 2;
        items.push({
          depth: seg2Depth,
          render: () => (
            <line
              key={`exp-${hole.id}`}
              x1={projMid.sx} y1={projMid.sy}
              x2={projBack.sx} y2={projBack.sy}
              stroke={isBlasting ? '#ffffff' : color}
              strokeWidth={strokeW + (isBlasting ? 2.5 : 0)}
              opacity={isBlasting ? 1.0 : 0.9}
            />
          )
        });
      }

      // Mouth Ellipse sphere
      items.push({
        depth: projFront.depth + 1.2,
        render: () => (
          <ellipse
            key={`mouth-${hole.id}`}
            cx={projFront.sx}
            cy={projFront.sy}
            rx={diameter * 1.5 * zoom}
            ry={diameter * 0.75 * zoom}
            fill={isBlasting ? '#ffffff' : hole.type === 'vide' ? '#090d16' : color}
            stroke={isBlasting ? '#fbbf24' : '#090d16'}
            strokeWidth={isBlasting ? 2.5 : 1}
            onMouseEnter={() => setHoveredHole(hole)}
            onMouseLeave={() => setHoveredHole(null)}
            style={{ cursor: 'pointer' }}
          />
        )
      });

      // Explosion Fire Ejection Simulation
      if (isBlasting) {
        const pCount = 10;
        for (let k = 0; k < pCount; k++) {
          const angle = (k * (360 / pCount)) * Math.PI / 180;
          const zEjected = -100;
          const pLocalX = ptFront.x + Math.cos(angle) * 35;
          const pLocalY = ptFront.y + Math.sin(angle) * 35;

          const projEject = rotatePoint(pLocalX, pLocalY, zEjected);
          const particleDepth = (projFront.depth + projEject.depth) / 2 + 15;

          items.push({
            depth: particleDepth,
            render: () => (
              <g key={`blast-${hole.id}-${k}`}>
                <line
                  x1={projFront.sx} y1={projFront.sy}
                  x2={projEject.sx} y2={projEject.sy}
                  stroke={k % 2 === 0 ? '#fb923c' : '#facc15'}
                  strokeWidth={2 * zoom}
                  strokeDasharray="3,1"
                  opacity="0.85"
                />
                <circle
                  cx={projFront.sx + (projEject.sx - projFront.sx) * 0.45}
                  cy={projFront.sy + (projEject.sy - projFront.sy) * 0.45}
                  r={3 + (k % 3)}
                  fill={k % 2 === 0 ? '#ef4444' : '#fff'}
                  opacity="0.75"
                />
              </g>
            )
          });
        }
      }
    });

    // 5. Front geological Rock Mass with gallery mask
    const frontProjPoints = sectionPoints.map(([px, py]) => rotatePoint(px, py, 0));
    const frontDepth = frontProjPoints.reduce((acc, p) => acc + p.depth, 0) / frontProjPoints.length;

    items.push({
      depth: frontDepth - 4,
      render: () => (
        <g key="rock-mass-front">
          <mask id="front-mask-svg">
            <rect x="-1000" y="-1000" width="3000" height="3000" fill="#ffffff" />
            <polygon points={frontProjPoints.map(p => `${p.sx},${p.sy}`).join(' ')} fill="#000000" />
          </mask>

          <rect
            x="-50" y="-50"
            width="1100" height="700"
            fill="url(#rock-texture-pattern)"
            opacity="0.9"
            mask="url(#front-mask-svg)"
          />

          <polygon
            points={frontProjPoints.map(p => `${p.sx},${p.sy}`).join(' ')}
            fill="none"
            stroke="#eab308"
            strokeWidth="3.5"
            opacity="0.95"
          />
          <polygon
            points={frontProjPoints.map(p => `${p.sx},${p.sy}`).join(' ')}
            fill="none"
            stroke="rgba(234,179,8,0.25)"
            strokeWidth="9"
            opacity="0.4"
          />
        </g>
      )
    });

    return items;
  }, [gabarit, activeStep, holesToRender, showFores, showExplosives, showWalls, sectionPoints, zoom, yaw, pitch, DEPTH]);

  const sortedDrawItems = useMemo(() => {
    return [...drawItems].sort((a, b) => b.depth - a.depth);
  }, [drawItems]);


  // Refs for smooth camera preset interpolations in WebGL
  const targetCamPos = useRef<THREE.Vector3>(new THREE.Vector3(8, 7, -10));
  const targetLookAt = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, (DEPTH * 0.05) / 2));
  const isInterpolating = useRef<boolean>(true);

  const applyPreset = (preset: 'face' | 'iso' | 'side' | 'top') => {
    setAutoRotate(false);
    
    // WebGL variables setup
    isInterpolating.current = true;
    const centerZ = (DEPTH * 0.05) / 2;
    targetLookAt.current.set(0, 0, centerZ);
    if (preset === 'face') {
      targetCamPos.current.set(0, 0, -15);
    } else if (preset === 'iso') {
      targetCamPos.current.set(8, 7, -10);
    } else if (preset === 'side') {
      targetCamPos.current.set(14, 0, centerZ);
    } else if (preset === 'top') {
      targetCamPos.current.set(0, 14, centerZ);
    }

    // SVG variables setup (perfect alignment sync)
    if (preset === 'face') {
      setYaw(0);
      setPitch(0);
    } else if (preset === 'iso') {
      setYaw(35);
      setPitch(-20);
    } else if (preset === 'side') {
      setYaw(90);
      setPitch(0);
    } else if (preset === 'top') {
      setYaw(0);
      setPitch(-90);
    }
  };

  // Three.js instances refs
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const holesGroupRef = useRef<THREE.Group | null>(null);
  const sparksRef = useRef<{ mesh: THREE.Mesh; velocity: THREE.Vector3; life: number; maxLife: number }[]>([]);
  const smokeRef = useRef<{ mesh: THREE.Mesh; velocity: THREE.Vector3; life: number; maxLife: number; rotSpeed: number }[]>([]);
  const cracksRef = useRef<{ line: THREE.Line; life: number; maxLife: number }[]>([]);
  const shockwavesRef = useRef<{ mesh: THREE.Mesh; scaleSpeed: number; opacitySpeed: number; life: number }[]>([]);
  const cameraShakeRef = useRef<number>(0);
  const particlesGroupRef = useRef<THREE.Group | null>(null);
  const tunnelMeshRef = useRef<THREE.Mesh | null>(null);
  const tunnelWireframeRef = useRef<THREE.LineSegments | null>(null);
  const massMeshRef = useRef<THREE.Mesh | null>(null);
  const backMeshRef = useRef<THREE.Mesh | null>(null);
  const backBorderLineRef = useRef<THREE.Line | null>(null);

  // Initialize and run Three.js WebGL canvas (Only if engineMode is webgl)
  useEffect(() => {
    if (engineMode !== 'webgl' || !containerRef.current) return;

    const width = containerRef.current.clientWidth || 1000;
    const height = 580;

    // Create Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x030712); // Elegant slate-black
    
    // Atmospheric mine linear fog
    scene.fog = new THREE.Fog(0x030712, 12, 32);
    sceneRef.current = scene;

    // Create Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.copy(targetCamPos.current);
    cameraRef.current = camera;

    // Create Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    // Clear old canvases
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Setup OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 + 0.35;
    controls.target.copy(targetLookAt.current);
    controlsRef.current = controls;

    controls.addEventListener('start', () => {
      isInterpolating.current = false;
      setAutoRotate(false);
    });

    // Lights
    const ambientLight = new THREE.AmbientLight(0x1e293b, 1.4);
    scene.add(ambientLight);

    const headlamp = new THREE.PointLight(0xfff7ed, 2.2, 35, 0.4);
    camera.add(headlamp);
    scene.add(camera);

    // Grid Floor CAD workbench
    const gridHelper = new THREE.GridHelper(30, 30, 0x475569, 0x111827);
    gridHelper.position.y = -(gCY + gH/2 - gCY) * 0.05;
    gridHelper.position.z = (DEPTH * 0.05) / 2;
    scene.add(gridHelper);

    // Gallery profile shape
    const shape = new THREE.Shape();
    sectionPoints.forEach(([px, py], idx) => {
      const x = (px - gCX) * 0.05;
      const y = -(py - gCY) * 0.05;
      if (idx === 0) shape.moveTo(x, y);
      else shape.lineTo(x, y);
    });
    shape.closePath();

    // Extrude gallery tunnel
    const extrudeSettings = {
      depth: DEPTH * 0.05,
      bevelEnabled: false,
      steps: 40
    };
    const tunnelGeo = new THREE.ExtrudeGeometry(shape, extrudeSettings);
    const tunnelMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      roughness: 0.9,
      metalness: 0.1,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: showWalls ? 0.45 : 0.05,
      depthWrite: false
    });
    const tunnelMesh = new THREE.Mesh(tunnelGeo, tunnelMat);
    scene.add(tunnelMesh);
    tunnelMeshRef.current = tunnelMesh;

    // Contours / Wireframe
    const wireframeGeo = new THREE.WireframeGeometry(tunnelGeo);
    const wireframeMat = new THREE.LineBasicMaterial({
      color: 0x475569,
      transparent: true,
      opacity: showWalls ? 0.3 : 0.05
    });
    const tunnelWireframe = new THREE.LineSegments(wireframeGeo, wireframeMat);
    scene.add(tunnelWireframe);
    tunnelWireframeRef.current = tunnelWireframe;

    // Front geological face plate at Z = 0 with opening
    const massShape = new THREE.Shape();
    massShape.moveTo(-30, -20);
    massShape.lineTo(30, -20);
    massShape.lineTo(30, 20);
    massShape.lineTo(-30, 20);
    massShape.closePath();
    massShape.holes.push(shape);

    const massGeo = new THREE.ShapeGeometry(massShape);
    const massMat = new THREE.MeshStandardMaterial({
      color: 0x0f172a,
      roughness: 0.95,
      metalness: 0.05,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: showWalls ? 0.35 : 0.05,
      depthWrite: false
    });
    const massMesh = new THREE.Mesh(massGeo, massMat);
    scene.add(massMesh);
    massMeshRef.current = massMesh;

    // Yellow neon outline for gallery entrance
    const borderGeo = new THREE.BufferGeometry().setFromPoints(shape.getPoints());
    const borderMat = new THREE.LineBasicMaterial({ color: 0xeab308 });
    const borderLine = new THREE.Line(borderGeo, borderMat);
    borderLine.position.z = 0.02; // floating slightly in front to prevent Z-fighting
    scene.add(borderLine);

    // Closed Back Face Plate at tunnel end
    const backGeo = new THREE.ShapeGeometry(shape);
    const backMat = new THREE.MeshStandardMaterial({
      color: 0x060913,
      roughness: 0.9,
      side: THREE.DoubleSide,
      transparent: true,
      opacity: showWalls ? 0.35 : 0.05,
      depthWrite: false
    });
    const backMesh = new THREE.Mesh(backGeo, backMat);
    backMesh.position.z = DEPTH * 0.05;
    scene.add(backMesh);
    backMeshRef.current = backMesh;

    // Dynamic glowing neon outline on the back face (Z = DEPTH * 0.05)
    const backBorderMat = new THREE.LineBasicMaterial({ color: 0x10b981, linewidth: 3, transparent: true, opacity: 0.15 });
    const backBorderLine = new THREE.Line(borderGeo, backBorderMat);
    backBorderLine.position.z = DEPTH * 0.05 - 0.01;
    scene.add(backBorderLine);
    backBorderLineRef.current = backBorderLine;

    // Groups
    const holesGroup = new THREE.Group();
    scene.add(holesGroup);
    holesGroupRef.current = holesGroup;

    const particlesGroup = new THREE.Group();
    scene.add(particlesGroup);
    particlesGroupRef.current = particlesGroup;

    // Live HUD Angle update callback
    controls.addEventListener('change', () => {
      const spherical = new THREE.Spherical().setFromVector3(
        camera.position.clone().sub(controls.target)
      );
      const yawDeg = (spherical.theta * 180) / Math.PI;
      const pitchDeg = 90 - (spherical.phi * 180) / Math.PI;

      const el = document.getElementById('hud-camera-angles');
      if (el) {
        el.textContent = `Caméra : Yaw ${Math.round(yawDeg)}° | Pitch ${Math.round(pitchDeg)}°`;
      }
    });

    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        const w = entry.contentRect.width;
        if (renderer && camera) {
          renderer.setSize(w, height);
          camera.aspect = w / height;
          camera.updateProjectionMatrix();
        }
      }
    });
    resizeObserver.observe(containerRef.current);

    let lastTime = performance.now();
    let frameId: number;

    const tick = () => {
      const now = performance.now();
      const deltaTime = (now - lastTime) / 1000;
      lastTime = now;

      controls.update();

      // Camera preset interpolation
      if (isInterpolating.current) {
        camera.position.lerp(targetCamPos.current, 0.07);
        controls.target.lerp(targetLookAt.current, 0.07);
        if (camera.position.distanceTo(targetCamPos.current) < 0.02 && controls.target.distanceTo(targetLookAt.current) < 0.02) {
          isInterpolating.current = false;
        }
      }

      // Animate glowing back face border line representing perfect gabarit finish
      if (backBorderLineRef.current) {
        const mat = backBorderLineRef.current.material as THREE.LineBasicMaterial;
        const maxStep = is9m2 ? 6 : 7;
        if (activeStep === maxStep) {
          const pulse = 0.5 + 0.5 * Math.sin(now * 0.008);
          mat.opacity = 0.4 + 0.6 * pulse;
          const hue = (now * 0.05) % 360;
          mat.color.setHSL(hue / 360, 0.9, 0.5);
        } else {
          mat.opacity = 0.15;
          mat.color.setHex(0x475569); // Subtle slate-grey
        }
      }

      shockwavesRef.current = shockwavesRef.current.filter(sw => {
        sw.life -= 0.025;
        sw.mesh.scale.setScalar(1 + (1 - sw.life) * sw.scaleSpeed);
        (sw.mesh.material as THREE.MeshStandardMaterial).opacity = sw.life * 0.85;
        if (sw.life <= 0) {
          scene.remove(sw.mesh);
          sw.mesh.geometry.dispose();
          (sw.mesh.material as THREE.MeshStandardMaterial).dispose();
          return false;
        }
        return true;
      });

      // Update active sparks/particles in ThreeJS
      sparksRef.current = sparksRef.current.filter(spark => {
        spark.life -= deltaTime;
        
        // Physics update: add scaled velocity, gravity pull, and drag multiplier
        spark.mesh.position.addScaledVector(spark.velocity, deltaTime);
        spark.velocity.y -= 1.2 * deltaTime; // gravity pull
        spark.velocity.multiplyScalar(0.96); // drag/friction
        
        const ratio = Math.max(0, spark.life / spark.maxLife);
        spark.mesh.scale.setScalar(ratio);
        
        if (spark.mesh.material && 'opacity' in spark.mesh.material) {
          (spark.mesh.material as any).opacity = ratio * 0.95;
        }
        
        if (spark.life <= 0) {
          if (particlesGroupRef.current) {
            particlesGroupRef.current.remove(spark.mesh);
          }
          spark.mesh.geometry.dispose();
          if (Array.isArray(spark.mesh.material)) {
            spark.mesh.material.forEach(m => m.dispose());
          } else {
            spark.mesh.material.dispose();
          }
          return false;
        }
        return true;
      });

      smokeRef.current = smokeRef.current.filter(smoke => {
        smoke.life -= deltaTime * 0.18;
        smoke.mesh.position.addScaledVector(smoke.velocity, deltaTime);
        smoke.mesh.rotation.z += smoke.rotSpeed * deltaTime;
        const ratio = Math.max(0, smoke.life / smoke.maxLife);
        const mat = smoke.mesh.material as THREE.MeshStandardMaterial;
        mat.opacity = ratio * 0.22;
        smoke.mesh.scale.setScalar(1 + (1 - ratio) * 3.5);
        if (smoke.life <= 0) {
          scene.remove(smoke.mesh);
          smoke.mesh.geometry.dispose();
          mat.dispose();
          return false;
        }
        return true;
      });

      cracksRef.current = cracksRef.current.filter(crack => {
        crack.life -= deltaTime * 0.3;
        const mat = crack.line.material as THREE.LineBasicMaterial;
        mat.opacity = Math.max(0, crack.life / crack.maxLife) * 0.85;
        if (crack.life <= 0) {
          scene.remove(crack.line);
          crack.line.geometry.dispose();
          mat.dispose();
          return false;
        }
        return true;
      });

      // 4. Project 3D positions to 2D labels overlays
      const widthCurrent = containerRef.current?.clientWidth || width;
      holesToRender.forEach(hole => {
        const el = document.getElementById(`hole-label-${hole.id}`);
        if (!el) return;

        const blastStep = getBlastStepForHole(hole, gabarit);
        const isExploded = activeStep > blastStep;
        if (isExploded) {
          el.style.opacity = '0';
          return;
        }

        const pos = getHole3DVector(hole, 0);
        pos.z -= 0.05; // Slightly forward
        pos.project(camera);

        if (pos.z > 1) {
          el.style.opacity = '0';
          return;
        }

        const px = (pos.x * 0.5 + 0.5) * widthCurrent;
        const py = (-(pos.y * 0.5) + 0.5) * height;

        el.style.left = `${px}px`;
        el.style.top = `${py}px`;
        el.style.opacity = '0.95';

        const color =
          hole.type === 'vide'     ? '#38bdf8' :
          hole.type === 'charge'   ? '#eab308' :
          hole.type === 'g1'       ? '#3b82f6' :
          hole.type === 'g2'       ? '#ef4444' :
          hole.type === 'g3'       ? '#22d3ee' :
          hole.type === 'g4'       ? '#f97316' :
          hole.type === 'radier'   ? '#8b5cf6' :
          hole.type === 'parement' ? '#14b8a6' :
                                     '#f43f5e';
        el.style.borderColor = color;
        el.style.color = color;
      });

      // Camera shake rumble computation
      const originalCamPos = camera.position.clone();
      if (cameraShakeRef.current > 0) {
        const shake = cameraShakeRef.current;
        camera.position.x += (Math.random() - 0.5) * shake * 0.15;
        camera.position.y += (Math.random() - 0.5) * shake * 0.15;
        camera.position.z += (Math.random() - 0.5) * shake * 0.15;
        cameraShakeRef.current -= deltaTime * 2.2; // decay shake
      }

      renderer.render(scene, camera);

      // Restore position immediately after rendering so OrbitControls doesn't jitter
      if (cameraShakeRef.current > 0) {
        camera.position.copy(originalCamPos);
      }
      frameId = requestAnimationFrame(tick);
    };

    frameId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frameId);
      resizeObserver.disconnect();
      
      // Dispose meshes and geometry
      tunnelGeo.dispose();
      tunnelMat.dispose();
      wireframeGeo.dispose();
      wireframeMat.dispose();
      massGeo.dispose();
      massMat.dispose();
      borderGeo.dispose();
      borderMat.dispose();
      backBorderMat.dispose();
      backGeo.dispose();
      backMat.dispose();
      
      // Dispose render loop references
      if (controls) controls.dispose();
      if (renderer) {
        if (containerRef.current && renderer.domElement.parentNode) {
          try {
            containerRef.current.removeChild(renderer.domElement);
          } catch(e) {}
        }
        renderer.dispose();
      }
    };
  }, [engineMode, gabarit, sectionPoints, gCX, gCY, gW, gH, DEPTH]);

  useEffect(() => {
    if (engineMode !== 'webgl') return;
    const scene = sceneRef.current;
    const holesGroup = holesGroupRef.current;
    if (!scene || !holesGroup) return;

    const blastingHoles = holesToRender.filter(h => getBlastStepForHole(h, gabarit) === activeStep);

    if (activeStep > 0 && blastingHoles.length > 0) {
      const center = new THREE.Vector3();
      blastingHoles.forEach(h => {
        const v = getHole3DVector(h, DEPTH * 0.5);
        center.add(v);
      });
      center.divideScalar(blastingHoles.length);

      const shockGeo = new THREE.SphereGeometry(0.1, 16, 16);
      const shockMat = new THREE.MeshStandardMaterial({
        color: 0xffd700,
        emissive: 0xffd700,
        emissiveIntensity: 2.5,
        transparent: true,
        opacity: 0.85,
        wireframe: true,
      });
      const shockMesh = new THREE.Mesh(shockGeo, shockMat);
      shockMesh.position.copy(center);
      scene.add(shockMesh);

      const blastLight = new THREE.PointLight(0xffd700, 8, 6);
      blastLight.position.copy(center);
      scene.add(blastLight);

      setTimeout(() => {
        scene.remove(blastLight);
      }, 800);

      shockwavesRef.current.push({
        mesh: shockMesh,
        scaleSpeed: 3.5,
        opacitySpeed: 1.8,
        life: 1.0,
      });

      // Activate modern immersive camera shake rumble
      cameraShakeRef.current = 0.28;

      // Spawn real-time dynamic, glowing sparks shooting out of active blast mouths
      const particlesGroup = particlesGroupRef.current;
      if (particlesGroup) {
        blastingHoles.forEach(h => {
          const mouthPos = getHole3DVector(h, 0);
          for (let i = 0; i < 18; i++) {
            const size = 0.015 + Math.random() * 0.025;
            const sparkGeo = new THREE.SphereGeometry(size, 4, 4);
            const sparkMat = new THREE.MeshBasicMaterial({
              color: Math.random() > 0.35 ? 0xffaa00 : 0xffdd33, // fire orange/yellow
              transparent: true,
              opacity: 0.95,
            });
            const sparkMesh = new THREE.Mesh(sparkGeo, sparkMat);
            sparkMesh.position.copy(mouthPos);
            particlesGroup.add(sparkMesh);

            // Velocity vectors pointing outwards and downwards under gravity
            const velocity = new THREE.Vector3(
              (Math.random() - 0.5) * 4.5,
              (Math.random() - 0.5) * 2.5 + 0.8,
              (1.5 + Math.random() * 4.0)
            );

            const maxLife = 0.6 + Math.random() * 0.8;
            sparksRef.current.push({
              mesh: sparkMesh,
              velocity,
              life: maxLife,
              maxLife,
            });
          }
        });
      }

      const smokeCount = blastingHoles.length * 3;
      for (let i = 0; i < smokeCount; i++) {
        const size = 0.25 + Math.random() * 0.45;
        const smokeGeo = new THREE.SphereGeometry(size, 6, 6);
        const smokeMat = new THREE.MeshStandardMaterial({
          color: 0x94a3b8,
          transparent: true,
          opacity: 0.18,
          roughness: 1,
          metalness: 0,
          depthWrite: false,
        });
        const smokeMesh = new THREE.Mesh(smokeGeo, smokeMat);
        const blastCenter = new THREE.Vector3();
        blastingHoles.forEach(h => blastCenter.add(getHole3DVector(h, DEPTH * 0.3)));
        blastCenter.divideScalar(blastingHoles.length);
        smokeMesh.position.copy(blastCenter);
        smokeMesh.position.x += (Math.random() - 0.5) * 1.5;
        smokeMesh.position.z += (Math.random() - 0.5) * 0.8;
        scene.add(smokeMesh);
        const maxLife = 2.5 + Math.random() * 2.0;
        smokeRef.current.push({
          mesh: smokeMesh,
          velocity: new THREE.Vector3(
            (Math.random() - 0.5) * 0.3,
            0.4 + Math.random() * 0.6,
            (Math.random() - 0.5) * 0.2
          ),
          life: maxLife,
          maxLife,
          rotSpeed: (Math.random() - 0.5) * 0.8,
        });
      }

      blastingHoles.forEach(h => {
        const holePos = getHole3DVector(h, 0);
        const numCracks = 3 + Math.floor(Math.random() * 3);
        for (let i = 0; i < numCracks; i++) {
          const angle = (Math.PI * 2 * i) / numCracks + (Math.random() - 0.5) * 0.8;
          const length = 0.3 + Math.random() * 0.7;
          const endX = holePos.x + Math.cos(angle) * length;
          const endY = holePos.y + Math.sin(angle) * length;
          const points = [
            new THREE.Vector3(holePos.x, holePos.y, holePos.z + 0.01),
            new THREE.Vector3(endX, endY, holePos.z + 0.01),
          ];
          const crackGeo = new THREE.BufferGeometry().setFromPoints(points);
          const crackMat = new THREE.LineBasicMaterial({
            color: 0xffd700,
            transparent: true,
            opacity: 0.85,
            linewidth: 1,
          });
          const crackLine = new THREE.Line(crackGeo, crackMat);
          scene.add(crackLine);
          cracksRef.current.push({
            line: crackLine,
            life: 1.8 + Math.random() * 1.2,
            maxLife: 1.8 + Math.random() * 1.2,
          });
        }
      });

      const ambientLight = scene.children.find(
        c => c instanceof THREE.AmbientLight
      ) as THREE.AmbientLight | undefined;

      if (ambientLight) {
        const baseIntensity = 1.4;
        const blastBoost = Math.min(activeStep * 0.3, 1.5);
        ambientLight.intensity = baseIntensity + blastBoost;
        const warmth = Math.min(activeStep * 0.1, 0.6);
        ambientLight.color.setRGB(1, 1 - warmth * 0.2, 1 - warmth * 0.4);
      }
    }

    if (activeStep === 0) {
      targetCamPos.current.set(8, 7, -10);
      targetLookAt.current.set(0, 0, (DEPTH * 0.05) / 2);
      isInterpolating.current = true;

      const ambientLight = scene?.children.find(
        c => c instanceof THREE.AmbientLight
      ) as THREE.AmbientLight | undefined;
      if (ambientLight) {
        ambientLight.intensity = 1.4;
        ambientLight.color.setRGB(1, 1, 1);
      }

      // Clear any leftover sparks/particles on playback reset
      const particlesGroup = particlesGroupRef.current;
      if (particlesGroup) {
        while (particlesGroup.children.length > 0) {
          const child = particlesGroup.children[0] as THREE.Mesh;
          particlesGroup.remove(child);
          child.geometry.dispose();
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      }
      sparksRef.current = [];

      smokeRef.current.forEach(s => {
        scene.remove(s.mesh);
        s.mesh.geometry.dispose();
        (s.mesh.material as THREE.MeshStandardMaterial).dispose();
      });
      smokeRef.current = [];

      cracksRef.current.forEach(c => {
        scene.remove(c.line);
        c.line.geometry.dispose();
        (c.line.material as THREE.LineBasicMaterial).dispose();
      });
      cracksRef.current = [];
    }

    while (holesGroup.children.length > 0) {
      const child = holesGroup.children[0] as THREE.Mesh;
      holesGroup.remove(child);
      child.geometry.dispose();
      if (Array.isArray(child.material)) {
        child.material.forEach(m => m.dispose());
      } else {
        child.material.dispose();
      }
    }

    const getColorForType = (type: string) => {
      switch (type) {
        case 'charge':   return 0xfbbf24;
        case 'vide':     return 0x38bdf8;
        case 'g1':       return 0xfb923c;
        case 'g2':       return 0xf87171;
        case 'g3':       return 0xa78bfa;
        case 'g4':       return 0x60a5fa;
        case 'radier':   return 0x4ade80;
        case 'parement': return 0x34d399;
        case 'voute':    return 0xf472b6;
        default:         return 0x94a3b8;
      }
    };

    holesToRender.forEach(hole => {
      const blastStep = getBlastStepForHole(hole, gabarit);
      const isExploded = activeStep > blastStep;
      const isBlasting = activeStep === blastStep;
      const isGhosted = isExploded; // Render finished steps as beautiful, glass-like semi-transparent holes

      const pA = getHole3DVector(hole, 0);
      pA.z -= 0.05;

      const pMid = getHole3DVector(hole, DEPTH * 0.35);
      pMid.z -= 0.03;

      const pB = getHole3DVector(hole, DEPTH);

      const isVide = hole.type === 'vide';
      const colorHex = getColorForType(hole.type);

      const buildCylinder = (start: THREE.Vector3, end: THREE.Vector3, radius: number, material: THREE.Material) => {
        const direction = new THREE.Vector3().subVectors(end, start);
        const length = direction.length();
        const cylinderGeo = new THREE.CylinderGeometry(radius, radius, length, 8);
        const cylinder = new THREE.Mesh(cylinderGeo, material);
        const midpoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
        cylinder.position.copy(midpoint);
        const up = new THREE.Vector3(0, 1, 0);
        const dirNorm = direction.clone().normalize();
        cylinder.quaternion.setFromUnitVectors(up, dirNorm);
        cylinder.userData = { hole };
        return cylinder;
      };

      if (isVide) {
        const videMat = new THREE.MeshStandardMaterial({
          color: 0x38bdf8,
          roughness: 0.5,
          metalness: 0.2,
          transparent: true,
          opacity: isGhosted ? 0.12 : 0.5,
          side: THREE.DoubleSide,
          depthWrite: false
        });
        const mesh = buildCylinder(pA, pB, 0.08, videMat);
        holesGroup.add(mesh);
      } else {
        if (showFores) {
          const stemmingMat = new THREE.MeshStandardMaterial({
            color: 0x94a3b8,
            roughness: 0.95,
            metalness: 0.0,
            transparent: isGhosted,
            opacity: isGhosted ? 0.08 : 1.0,
          });
          const stemmingMesh = buildCylinder(pA, pMid, 0.05, stemmingMat);
          holesGroup.add(stemmingMesh);
        }

        if (showExplosives) {
          const expMat = new THREE.MeshStandardMaterial({
            color: colorHex,
            roughness: 0.3,
            metalness: 0.3,
            transparent: isGhosted,
            opacity: isGhosted ? 0.18 : 1.0,
            emissive: colorHex,
            emissiveIntensity: isBlasting ? 2.5 : (isGhosted ? 0.08 : 0.5)
          });

          if (isBlasting) {
            expMat.color.setHex(0xffffff);
            expMat.emissive.setHex(0xffffff);
          }

          const radius = isBlasting ? 0.08 : 0.05;
          const expMesh = buildCylinder(pMid, pB, radius, expMat);
          holesGroup.add(expMesh);
        }
      }

      const mouthMat = new THREE.MeshStandardMaterial({
        color: isBlasting ? 0xffffff : colorHex,
        roughness: 0.2,
        transparent: isGhosted,
        opacity: isGhosted ? 0.22 : 1.0,
        emissive: isBlasting ? 0xffffff : colorHex,
        emissiveIntensity: isBlasting ? 2.5 : (isGhosted ? 0.1 : 0.6)
      });
      const mouthGeo = new THREE.SphereGeometry(isBlasting ? 0.12 : 0.08, 8, 8);
      const mouthMesh = new THREE.Mesh(mouthGeo, mouthMat);
      mouthMesh.position.copy(pA);
      mouthMesh.userData = { hole };
      holesGroup.add(mouthMesh);
    });
  }, [engineMode, holesToRender, activeStep, showFores, showExplosives, gabarit, DEPTH]);

  useEffect(() => {
    if (engineMode !== 'webgl') return;
    const camera = cameraRef.current;
    if (!camera) return;

    const totalSteps = is9m2 ? 6 : 7;
    const progress = activeStep / totalSteps;

    const targetZ = -10 + progress * 7;
    const targetY = 7 - progress * 2;

    targetCamPos.current.set(8 - progress * 3, targetY, targetZ);
    isInterpolating.current = true;
  }, [activeStep, engineMode, gabarit]);

  // Synchronize walls inside WebGL
  useEffect(() => {
    if (engineMode !== 'webgl') return;
    if (tunnelMeshRef.current) {
      (tunnelMeshRef.current.material as THREE.MeshStandardMaterial).opacity = showWalls ? 0.45 : 0.05;
    }
    if (tunnelWireframeRef.current) {
      (tunnelWireframeRef.current.material as THREE.LineBasicMaterial).opacity = showWalls ? 0.3 : 0.05;
    }
    if (massMeshRef.current) {
      (massMeshRef.current.material as THREE.MeshStandardMaterial).opacity = showWalls ? 0.35 : 0.05;
    }
    if (backMeshRef.current) {
      (backMeshRef.current.material as THREE.MeshStandardMaterial).opacity = showWalls ? 0.35 : 0.05;
    }
  }, [showWalls, engineMode]);

  // Synchronize auto rotation in WebGL mode
  useEffect(() => {
    if (engineMode !== 'webgl') return;
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoRotate;
      controlsRef.current.autoRotateSpeed = 2.0;
    }
  }, [autoRotate, engineMode]);

  // WebGL Raycasting for interactive hover
  const handleMouseMoveCanvas = (e: React.MouseEvent) => {
    if (engineMode !== 'webgl') return;
    const renderer = rendererRef.current;
    const camera = cameraRef.current;
    const holesGroup = holesGroupRef.current;
    if (!renderer || !camera || !holesGroup) return;

    const rect = renderer.domElement.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(new THREE.Vector2(x, y), camera);

    const intersects = raycaster.intersectObjects(holesGroup.children);
    if (intersects.length > 0) {
      const match = intersects.find(intersect => intersect.object.userData && intersect.object.userData.hole);
      if (match) {
        setHoveredHole(match.object.userData.hole);
        return;
      }
    }
    setHoveredHole(null);
  };

  const handleMouseLeaveCanvas = () => {
    setHoveredHole(null);
  };

  return (
    <div className="w-full flex flex-col rounded-3xl overflow-hidden bg-slate-950 border border-slate-850 shadow-2xl relative">
      
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            🏔️
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-white font-black text-xs uppercase tracking-wider">
                Simulation Immersive 3D de la Mine
              </h4>
              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${
                engineMode === 'webgl' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/25' : 'bg-amber-500/10 text-amber-400 border border-amber-500/25'
              }`}>
                {engineMode === 'webgl' ? 'Moteur WebGL 3D' : 'Moteur Vectoriel 3D'}
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
              Excavation Tridimensionnelle interactive · {is9m2 ? 'Traçage 9m²' : 'Galerie 12m²'}
            </p>
          </div>
        </div>

        {/* Engine switcher bar */}
        <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 p-1 rounded-xl">
          <button
            onClick={() => {
              if (webglSupported) {
                setEngineMode('webgl');
              }
            }}
            disabled={!webglSupported}
            className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
              engineMode === 'webgl'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white disabled:opacity-30'
            }`}
            title={!webglSupported ? 'WebGL non pris en charge par votre carte graphique/navigateur' : ''}
          >
            🔌 WebGL {webglSupported ? '' : '(Bloqué)'}
          </button>
          <button
            onClick={() => setEngineMode('svg')}
            className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider transition-all ${
              engineMode === 'svg'
                ? 'bg-amber-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            ⚡ Vectoriel (Haute Compatibilité)
          </button>
        </div>

        {/* Legend */}
        <div className="flex gap-4 text-[9px] font-black uppercase tracking-wider text-slate-400 flex-wrap">
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-[#94a3b8] border border-slate-700" />
            Bourrage
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-500" />
            Explosif
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-sky-400" />
            Trous Vides
          </span>
          <span className="flex items-center gap-1.5 text-[#ffd700] animate-pulse">
            💥 Étape active
          </span>
        </div>
      </div>

      {/* Interactive stage */}
      {engineMode === 'webgl' ? (
        // WebGL / Three.js Container
        <div 
          ref={containerRef}
          className="w-full relative overflow-hidden h-[580px]"
          onMouseMove={handleMouseMoveCanvas}
          onMouseLeave={handleMouseLeaveCanvas}
          style={{ cursor: 'grab' }}
        >
          {/* Dynamic HTML labels overlay (Z-Projected) */}
          {holesToRender.map(hole => (
            <div
              key={`label-${hole.id}`}
              id={`hole-label-${hole.id}`}
              className="absolute pointer-events-none select-none px-1.5 py-0.5 rounded text-[8px] font-black font-mono transition-all duration-100 shadow-md border text-center"
              style={{
                transform: 'translate(-50%, -50%)',
                opacity: 0,
                left: 0,
                top: 0,
                zIndex: 20
              }}
            >
              {hole.label}
            </div>
          ))}

          {/* HUD WebGL live Telemetry */}
          <div className="absolute bottom-4 left-4 bg-slate-950/90 border border-slate-800 rounded-2xl p-4 min-w-[260px] space-y-1.5 shadow-2xl backdrop-blur-md pointer-events-none z-10">
            <p className="text-[10px] font-black text-[#ffd700] border-b border-slate-800/80 pb-1.5 uppercase tracking-wider flex items-center gap-1.5">
              📊 TÉLÉMÉTRIE SÉQUENCE WEBGL
            </p>
            <div className="text-[9px] font-bold text-slate-400 space-y-1 uppercase tracking-wider">
              <p>Profil : <span className="text-white font-extrabold">{is9m2 ? 'Traçage 9m² (1.7m)' : 'Galerie 12m² (2.3m)'}</span></p>
              <p>Éléments Actifs : <span className="text-white font-extrabold">{holesToRender.length} Trous de forage</span></p>
              <p id="hud-camera-angles">Caméra : Yaw 35° | Pitch -20°</p>
              <p>Moteur : <span className="text-emerald-400 font-black">GPU matériel • 60 FPS</span></p>
            </div>
          </div>

          {/* Quick Help overlay */}
          <div className="absolute top-4 right-4 bg-slate-900/95 border border-slate-800 rounded-2xl p-4 max-w-xs space-y-2.5 shadow-xl backdrop-blur-sm z-10">
            <p className="text-[10px] font-black text-[#ffd700] border-b border-slate-800 pb-1.5 uppercase tracking-wider flex items-center gap-1.5">
              🎮 NAVIGATION 3D
            </p>
            <ul className="text-[9px] font-bold text-slate-400 space-y-1 uppercase tracking-wider">
              <li className="flex items-center gap-1.5">🖱️ <span className="text-white">Clic Gauche :</span> Rotation orbite</li>
              <li className="flex items-center gap-1.5">🖐️ <span className="text-white">Clic Droit :</span> Translation</li>
              <li className="flex items-center gap-1.5">🎡 <span className="text-white">Molette :</span> Zoom avant / arrière</li>
              <li className="flex items-center gap-1.5">🎯 <span className="text-white">Survol :</span> Inspecter trou</li>
            </ul>
          </div>
        </div>
      ) : (
        // High-Contrast SVG 3D Engine Fallback
        <div
          className="w-full relative overflow-hidden h-[580px] bg-[#030712] select-none"
          onMouseDown={handleMouseDownSvg}
          onMouseMove={handleMouseMoveSvg}
          onMouseUp={handleMouseUpSvg}
          onMouseLeave={handleMouseUpSvg}
          onTouchStart={handleTouchStartSvg}
          onTouchMove={handleTouchMoveSvg}
          onTouchEnd={handleMouseUpSvg}
          onWheel={handleWheelSvg}
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
          <svg className="w-full h-full" viewBox="0 0 1000 580" xmlns="http://www.w3.org/2000/svg">
            <defs>
              {/* Procedural geological rock face texture */}
              <pattern id="rock-texture-pattern" width="80" height="80" patternUnits="userSpaceOnUse" patternTransform="rotate(15)">
                <rect width="80" height="80" fill="#090e18" />
                <path d="M 0 15 L 40 22 L 80 15 M 20 40 L 60 45 M 0 65 L 80 65" stroke="#121b2d" strokeWidth="1.2" />
                <path d="M 15 0 L 22 40 L 15 80 M 55 0 L 48 80" stroke="#0f1626" strokeWidth="1.2" />
                <path d="M 0 0 C 20 8, 30 20, 40 40 C 45 60, 60 70, 80 80" stroke="#1c2b4c" strokeWidth="0.6" strokeDasharray="3,3" />
              </pattern>
            </defs>

            {/* Grid Floor */}
            <g opacity="0.15">
              {Array.from({ length: 21 }).map((_, i) => {
                const zVal = (i / 20) * DEPTH;
                const pL = rotatePoint(gCX - 250, gCY + gH/2, zVal);
                const pR = rotatePoint(gCX + 250, gCY + gH/2, zVal);
                return (
                  <line
                    key={`grid-z-${i}`}
                    x1={pL.sx} y1={pL.sy}
                    x2={pR.sx} y2={pR.sy}
                    stroke="#475569"
                    strokeWidth="1"
                  />
                );
              })}
            </g>

            {/* Depth-sorted rendered 3D primitives (Painter's Algorithm) */}
            {sortedDrawItems.map(item => item.render())}

            {/* Interactive Vector compass HUD */}
            <g transform="translate(0, 0)">
              {/* Compass Background plate */}
              <circle cx={compassCenter.x} cy={compassCenter.y} r={compassScale + 12} fill="#020617" stroke="#1e293b" strokeWidth="1.5" opacity="0.9" />
              
              {/* X Axis (Red) */}
              <line x1={compassCenter.x} y1={compassCenter.y} x2={axisX.ex} y2={axisX.ey} stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" />
              <text x={axisX.ex + (axisX.ex > compassCenter.x ? 6 : -10)} y={axisX.ey + 3} fill="#ef4444" className="text-[9px] font-black">X</text>
              
              {/* Y Axis (Green) */}
              <line x1={compassCenter.x} y1={compassCenter.y} x2={axisY.ex} y2={axisY.ey} stroke="#22c55e" strokeWidth="2.5" strokeLinecap="round" />
              <text x={axisY.ex - 3} y={axisY.ey - 6} fill="#22c55e" className="text-[9px] font-black">Y</text>
              
              {/* Z Axis (Blue) */}
              <line x1={compassCenter.x} y1={compassCenter.y} x2={axisZ.ex} y2={axisZ.ey} stroke="#3b82f6" strokeWidth="2.5" strokeLinecap="round" />
              <text x={axisZ.ex + (axisZ.ex > compassCenter.x ? 6 : -10)} y={axisZ.ey + 4} fill="#3b82f6" className="text-[9px] font-black">Z</text>
            </g>
          </svg>

          {/* Fallback SVG Live Telemetry HUD overlay */}
          <div className="absolute bottom-4 left-4 bg-slate-950/90 border border-slate-800 rounded-2xl p-4 min-w-[260px] space-y-1.5 shadow-2xl backdrop-blur-md pointer-events-none z-10">
            <p className="text-[10px] font-black text-[#f59e0b] border-b border-slate-800/80 pb-1.5 uppercase tracking-wider flex items-center gap-1.5">
              📊 TÉLÉMÉTRIE VECTORIELLE 3D
            </p>
            <div className="text-[9px] font-bold text-slate-400 space-y-1 uppercase tracking-wider">
              <p>Profil : <span className="text-white font-extrabold">{is9m2 ? 'Traçage 9m² (1.7m)' : 'Galerie 12m² (2.3m)'}</span></p>
              <p>Éléments Actifs : <span className="text-white font-extrabold">{holesToRender.length} Trous de forage</span></p>
              <p>Rotation : <span className="text-amber-400 font-extrabold">Yaw {Math.round(yaw)}° | Pitch {Math.round(pitch)}°</span></p>
              <p>Rendu : <span className="text-amber-400 font-black">Vectoriel SVG 3D • 100% Fluide</span></p>
            </div>
          </div>

          {/* Quick Help overlay */}
          <div className="absolute top-4 right-4 bg-slate-900/95 border border-slate-800 rounded-2xl p-4 max-w-xs space-y-2.5 shadow-xl backdrop-blur-sm z-10">
            <p className="text-[10px] font-black text-[#f59e0b] border-b border-slate-800 pb-1.5 uppercase tracking-wider flex items-center gap-1.5">
              🎮 DRAG & DROP 3D
            </p>
            <ul className="text-[9px] font-bold text-slate-400 space-y-1 uppercase tracking-wider">
              <li className="flex items-center gap-1.5">🖱️ <span className="text-white">Glisser gauche/droite :</span> Rotation Yaw</li>
              <li className="flex items-center gap-1.5">↕️ <span className="text-white">Glisser haut/bas :</span> Inclinaison Pitch</li>
              <li className="flex items-center gap-1.5">🎡 <span className="text-white">Molette :</span> Zoom avant / arrière</li>
              <li className="flex items-center gap-1.5">🎯 <span className="text-white">Survol :</span> Inspecter trou</li>
            </ul>
          </div>
        </div>
      )}

      {/* Control Panel Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 bg-slate-900 border-t border-slate-800">
        
        {/* Toggle displays */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowWalls(prev => !prev)}
            className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all border ${
              showWalls
                ? 'bg-slate-800 text-white border-slate-700'
                : 'bg-slate-950 text-slate-500 border-slate-900 hover:text-white'
            }`}
          >
            🧱 Parois Rocheuses {showWalls ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={() => setShowFores(prev => !prev)}
            className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all border ${
              showFores
                ? 'bg-slate-800 text-white border-slate-700'
                : 'bg-slate-950 text-slate-500 border-slate-900 hover:text-white'
            }`}
          >
            🥖 Bourrage {showFores ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={() => setShowExplosives(prev => !prev)}
            className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all border ${
              showExplosives
                ? 'bg-slate-800 text-white border-slate-700'
                : 'bg-slate-950 text-slate-500 border-slate-900 hover:text-white'
            }`}
          >
            🧨 Charges Explosives {showExplosives ? 'ON' : 'OFF'}
          </button>
        </div>

        {/* Camera Preset Angles */}
        <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl p-1">
          <span className="text-[8px] font-black uppercase tracking-wider text-slate-500 px-2">VUES CAO</span>
          <button
            onClick={() => applyPreset('iso')}
            className="px-2.5 py-1 rounded-lg text-[9px] font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-all uppercase"
          >
            Isometric 3D
          </button>
          <button
            onClick={() => applyPreset('face')}
            className="px-2.5 py-1 rounded-lg text-[9px] font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-all uppercase"
          >
            Face
          </button>
          <button
            onClick={() => applyPreset('side')}
            className="px-2.5 py-1 rounded-lg text-[9px] font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-all uppercase"
          >
            Profil (Flanc)
          </button>
          <button
            onClick={() => applyPreset('top')}
            className="px-2.5 py-1 rounded-lg text-[9px] font-bold text-slate-300 hover:text-white hover:bg-slate-800 transition-all uppercase"
          >
            Dessus
          </button>
        </div>

        {/* Auto Rotation and Reset */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRotate(prev => !prev)}
            className={`flex items-center gap-1.5 px-4 py-2 text-[9px] font-black uppercase tracking-widest rounded-xl border transition-all ${
              autoRotate
                ? 'bg-amber-600 text-white border-amber-500 animate-pulse shadow-md'
                : 'bg-slate-950 text-slate-300 border-slate-800 hover:bg-slate-800'
            }`}
          >
            🔄 ROTATION ORBITALE {autoRotate ? 'ON' : 'OFF'}
          </button>
          <button
            onClick={() => applyPreset('iso')}
            className="px-3 py-2 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white text-[9px] font-black uppercase tracking-widest rounded-xl border border-slate-800 transition-all"
          >
            Reset Caméra
          </button>
        </div>

      </div>

    </div>
  );
};
