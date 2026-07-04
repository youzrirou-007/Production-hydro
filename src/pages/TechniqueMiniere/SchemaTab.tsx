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
import { HOLES_DATA, HOLES_DATA_9, HOLES_DATA_12_INTL } from './data';
import { HoleInfo, GabaritType } from './types';

interface SchemaTabProps {
  gabarit: GabaritType;
}

export const SchemaTab: React.FC<SchemaTabProps> = ({ gabarit }) => {
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
    nbTrousForés: gabarit === '9m2' ? 28 : 38,
    observations: '',
  });
  const [showFicheForm, setShowFicheForm] = useState(false);
  const [realtimeMode, setRealtimeMode] = useState<boolean>(false);
  const [realtimeMs, setRealtimeMs] = useState<number>(0);
  const [realtimePlaying, setRealtimePlaying] = useState<boolean>(false);
  const realtimeRef = useRef<NodeJS.Timeout | null>(null);
  const [showDangerZones, setShowDangerZones] = useState<boolean>(false);
  const [activeDangerLayer, setActiveDangerLayer] = useState<'all' | 'projection' | 'vibrations' | 'gaz'>('all');

  const REAL_DELAYS_MS = gabarit === '9m2'
    ? [0, 25, 50, 75, 100, 125]
    : [0, 25, 50, 75, 100, 125, 150];

  const TOTAL_DURATION_MS = gabarit === '9m2' ? 125 : 150;

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

  const maxStep = gabarit === '9m2' ? 5 : 6;

  // Reset step if it exceeds bounds on gabarit swap
  useEffect(() => {
    if (activeStep > maxStep) {
      setActiveStep(maxStep);
    }
    setFicheData(p => ({ ...p, nbTrousForés: gabarit === '9m2' ? 28 : 38 }));
  }, [gabarit, maxStep, activeStep]);

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
    if (gabarit === '9m2') {
      switch (activeStep) {
        case 0: return 0.0;
        case 1: return Number((totalDepth * 0.15).toFixed(2));
        case 2: return Number((totalDepth * 0.30).toFixed(2));
        case 3: return Number((totalDepth * 0.50).toFixed(2));
        case 4: return Number((totalDepth * 0.75).toFixed(2));
        case 5: return totalDepth;
        default: return 0.0;
      }
    } else {
      switch (activeStep) {
        case 0: return 0.0;
        case 1: return Number((totalDepth * 0.15).toFixed(2));
        case 2: return Number((totalDepth * 0.35).toFixed(2));
        case 3: return Number((totalDepth * 0.55).toFixed(2));
        case 4: return Number((totalDepth * 0.70).toFixed(2));
        case 5: return Number((totalDepth * 0.85).toFixed(2));
        case 6: return totalDepth;
        default: return 0.0;
      }
    }
  };

  // Cavity expansion dimensions on SVG
  const getCavityRadius = () => {
    if (gabarit === '9m2') {
      switch (activeStep) {
        case 0: return 0;
        case 1: return 45;   // Bouchon central
        case 2: return 90;   // G1
        case 3: return 140;  // G2
        case 4: return 200;  // G3
        case 5: return 200;  // Finition : le vide ne s'agrandit pas pendant la finition
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
        case 6: return 360;  // Finition : le vide ne s'agrandit pas pendant la finition
        default: return 0;
      }
    }
  };

  // Helper to determine the blasting step for each hole type
  const getBlastStepForHole = (hole: HoleInfo, gab: GabaritType) => {
    if (hole.type === 'vide') return -1;
    if (gab === '9m2') {
      if (hole.type === 'charge') return 1;
      if (hole.type === 'g1') return 2;
      if (hole.type === 'g2') return 3;
      if (hole.type === 'g3') return 4;
      return 5; // radier, parement, voute
    } else {
      if (hole.type === 'charge') return 1;
      if (hole.type === 'g1') return 2;
      if (hole.type === 'g2') return 3;
      if (hole.type === 'g3') return 4;
      if (hole.type === 'g4') return 5;
      return 6; // radier, parement, voute
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
    const is9m2 = gabarit === '9m2';

    const bouchonConfig = is9m2
      ? '5 trous (1 vide + 4 chargés TOVEX) — Bouchon cylindrique'
      : isIntl
      ? '9 trous (6 vides + 3 chargés TOVEX) — Standard Langefors-Kihlström'
      : '9 trous (3 vides + 6 chargés TOVEX) — Configuration SMI Imiter';

    const totalTrous = is9m2 ? 28 : 38;
    const nbChargés = is9m2 ? 27 : 37;
    const anfoKg = is9m2 ? 22.8 : 29.0;
    const tovexCartouches = is9m2 ? 4 : 3;
    const nbAmorces = totalTrous;

    const sequenceLignes = is9m2 ? [
      { det: '0 ms', desc: 'Bouchon cylindrique — TOVEX', trous: 4 },
      { det: '25 ms', desc: 'Groupe 1 — ANFO', trous: 4 },
      { det: '50 ms', desc: 'Groupe 2 — ANFO', trous: 4 },
      { det: '75 ms', desc: 'Groupe 3 — ANFO', trous: 4 },
      { det: '100 ms', desc: 'Radier + Parements — ANFO', trous: 8 },
      { det: '125 ms', desc: 'Voûte — ANFO', trous: 3 },
    ] : [
      { det: '0 ms', desc: 'Bouchon brûlé — TOVEX', trous: isIntl ? 3 : 6 },
      { det: '25 ms', desc: 'Groupe 1 — ANFO', trous: 4 },
      { det: '50 ms', desc: 'Groupe 2 — ANFO', trous: 4 },
      { det: '75 ms', desc: 'Groupe 3 — ANFO', trous: 4 },
      { det: '100 ms', desc: 'Groupe 4 — ANFO', trous: 4 },
      { det: '125 ms', desc: 'Radier + Parements — ANFO', trous: 10 },
      { det: '150 ms', desc: 'Voûte — ANFO', trous: 3 },
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

    const sequenceLignesRows = sequenceLignes.map(l => '<tr><td><strong>' + l.det + '</strong></td><td>' + l.desc + '</td><td style="text-align:center;">' + l.trous + '</td><td>' + (l.desc.includes('TOVEX') ? 'TOVEX 100g' : 'ANFO') + '</td></tr>').join('');

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Fiche de Tir ${ficheData.numeroTir} — SMI Imiter</title>
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
      <div class="header-title">⛏️ HYDROMINES — SMI IMITER</div>
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
      HydroMines SMI Imiter · Fiche N° ${ficheData.numeroTir || '—'} · ${dateFormatted}
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
      if (gabarit === '9m2') {
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

  const stepExplanations = gabarit === '9m2' ? stepExplanationsNine : stepExplanationsTwelve;

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
    const cy = gabarit === '9m2' ? 350 : 430;
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
    gabarit === '12m2_intl' ? HOLES_DATA_12_INTL :
    HOLES_DATA;

  // Stable cached calculations using useMemo to fulfill the "RÈGLES DE PERFORMANCE"
  const stableExplosionData = useMemo(() => {
    const particlesMap: Record<string, any[]> = {};
    const smokeMap: Record<string, any[]> = {};
    const fragmentsMap: Record<string, any[]> = {};
    const debrisMap: Record<string, any[]> = {};

    const cx = 500;
    const cy = gabarit === '9m2' ? 350 : 430;

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
        const floorY = gabarit === '9m2' ? 520 : 650;
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
    return { x: 500, y: gabarit === '9m2' ? 350 : 430 };
  })();

  // Dynamic screen shake intensity and duration based on blasting step
  const shake = (() => {
    if (activeStep === 0) return { amplitude: 0, duration: 0 };
    if (activeStep === 1) return { amplitude: 5, duration: 0.20 }; // Bouchon (Forte)
    if (activeStep === maxStep) return { amplitude: 1.5, duration: 0.10 }; // Finition (Légère)
    return { amplitude: 3, duration: 0.15 }; // G1-G4 (Moyenne)
  })();

  // Dynamic zoom viewBox with expanded empty margins at top and bottom for optimal vertical space
  const dynamicViewBox = gabarit === '9m2' ? "210 -10 580 580" : "0 -180 1000 920";

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
        <div className="bg-slate-950 rounded-3xl border border-slate-850 p-6 relative shadow-2xl flex items-center justify-center overflow-hidden">
          
          {/* Legend absolute inside top right */}
          <div className="absolute top-4 left-4 bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-2 text-[9px] font-bold text-slate-400 uppercase tracking-wider space-y-1 z-10">
            <p className="text-[10px] font-black text-[#ffd700] border-b border-slate-800 pb-1 mb-1">Délai Séquence</p>
            <p className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-slate-900 border border-white" /> Bouchon : 0ms</p>
            <p className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-blue-500" /> Groupe 1 : 25ms</p>
            <p className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-red-500" /> Groupe 2 : 50ms</p>
            <p className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-cyan-400" /> Groupe 3 : 75ms</p>
            {gabarit === '12m2' && (
              <p className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-orange-500" /> Groupe 4 : 100ms</p>
            )}
            <p className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-violet-500" /> Radier : {gabarit === '9m2' ? '100ms' : '125ms'}</p>
            <p className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-teal-500" /> Parement : {gabarit === '9m2' ? '100ms' : '125ms'}</p>
            <p className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-rose-500" /> Voûte : 125ms</p>
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
              {gabarit === '9m2' ? (
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
              {gabarit === '9m2' ? (
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
                    d={getOrganicVoidPath(500, gabarit === '9m2' ? 350 : 430, activeStep, 3)}
                    fill="none"
                    stroke="#475569"
                    strokeWidth="4"
                    opacity="0.6"
                    pointerEvents="none"
                  />
                  {/* The jagged raw rock void itself */}
                  <motion.path
                    key={`organic-void-${gabarit}`}
                    d={getOrganicVoidPath(500, gabarit === '9m2' ? 350 : 430, activeStep, 0)}
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
                  d={gabarit === '9m2' ? "M 280,520 L 280,280 A 220,220 0 0,1 720,280 L 720,520 Z" : "M 100,650 L 100,300 A 400,400 0 0,1 900,300 L 900,650 Z"}
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
                    animate={{ r: gabarit === '9m2' ? 200 : 350, opacity: 0 }}
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
                          r={gabarit === '9m2' ? "6" : "10"}
                          fill="#1a1a2e"
                          stroke="#4b5563"
                          strokeWidth="1.5"
                          strokeDasharray="3,2"
                        />
                        {/* Radial cracking lines */}
                        <line x1={hole.x - (gabarit === '9m2' ? 9 : 14)} y1={hole.y} x2={hole.x - (gabarit === '9m2' ? 4 : 6)} y2={hole.y} stroke="#4b5563" strokeWidth="1.5" />
                        <line x1={hole.x + (gabarit === '9m2' ? 4 : 6)} y1={hole.y} x2={hole.x + (gabarit === '9m2' ? 9 : 14)} y2={hole.y} stroke="#4b5563" strokeWidth="1.5" />
                        <line x1={hole.x} y1={hole.y - (gabarit === '9m2' ? 9 : 14)} x2={hole.x} y2={hole.y - (gabarit === '9m2' ? 4 : 6)} stroke="#4b5563" strokeWidth="1.5" />
                        <line x1={hole.x} y1={hole.y + (gabarit === '9m2' ? 4 : 6)} x2={hole.x} y2={hole.y + (gabarit === '9m2' ? 9 : 14)} stroke="#4b5563" strokeWidth="1.5" />
                        
                        {/* Diagonal cracking lines */}
                        <line x1={hole.x - (gabarit === '9m2' ? 6 : 10)} y1={hole.y - (gabarit === '9m2' ? 6 : 10)} x2={hole.x - (gabarit === '9m2' ? 3 : 4)} y2={hole.y - (gabarit === '9m2' ? 3 : 4)} stroke="#4b5563" strokeWidth="1" />
                        <line x1={hole.x + (gabarit === '9m2' ? 3 : 4)} y1={hole.y + (gabarit === '9m2' ? 3 : 4)} x2={hole.x + (gabarit === '9m2' ? 6 : 10)} y2={hole.y + (gabarit === '9m2' ? 6 : 10)} stroke="#4b5563" strokeWidth="1" />
                        <line x1={hole.x + (gabarit === '9m2' ? 3 : 4)} y1={hole.y - (gabarit === '9m2' ? 3 : 4)} x2={hole.x + (gabarit === '9m2' ? 6 : 10)} y2={hole.y - (gabarit === '9m2' ? 6 : 10)} stroke="#4b5563" strokeWidth="1" />
                        <line x1={hole.x - (gabarit === '9m2' ? 6 : 10)} y1={hole.y + (gabarit === '9m2' ? 3 : 4)} x2={hole.x - (gabarit === '9m2' ? 3 : 4)} y2={hole.y + (gabarit === '9m2' ? 6 : 10)} stroke="#4b5563" strokeWidth="1" />
                        
                        {/* Central hot spot */}
                        <circle
                          cx={hole.x}
                          cy={hole.y}
                          r={gabarit === '9m2' ? "2" : "3"}
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
                                r={gabarit === '9m2' ? s.size * 0.6 : s.size}
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
                            r={gabarit === '9m2' ? "17" : "26"}
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
                          r={hoveredHole?.id === hole.id ? (gabarit === '9m2' ? "16" : "24") : (gabarit === '9m2' ? "11.5" : "18")}
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
                        y={gabarit === '9m2' ? hole.y + 3.5 : hole.y + 5}
                        textAnchor="middle"
                        className="font-black uppercase tracking-tighter fill-current select-none pointer-events-none"
                        style={{ fontSize: gabarit === '9m2' ? '8px' : '12px' }}
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
                          initial={{ r: gabarit === '9m2' ? 12 : 20, opacity: 0.8 }}
                          animate={{ r: gabarit === '9m2' ? 50 : 80, opacity: 0 }}
                          transition={{ duration: 0.5, ease: "easeOut" }}
                          fill="url(#blast-glow)"
                          pointerEvents="none"
                        />

                        {/* Outer expanding shock disk */}
                        <circle
                          cx={hole.x}
                          cy={hole.y}
                          r={gabarit === '9m2' ? "22" : "35"}
                          fill="rgba(245, 158, 11, 0.35)"
                          className="animate-ping"
                        />

                        {/* MICRO-ONDE PAR TROU */}
                        <motion.circle
                          cx={hole.x}
                          cy={hole.y}
                          initial={{ r: gabarit === '9m2' ? 9 : 15, opacity: 0.9 }}
                          animate={{ r: gabarit === '9m2' ? 32 : 50, opacity: 0 }}
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
              <div className="flex gap-2">
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
                      Le gabarit 12m² SMI est la configuration de référence du terrain de SMI Imiter. Optimisé pour les roches hautement silicifiées de la mine, il utilise un bouchon en triangle à 3 trous vides (décompression) pour guider l'énergie du tir. Ce design historique permet un avancement fiable de 2.1m par volée avec un taux de réussite de 94% dans nos conditions géologiques spécifiques.
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
                  📄 FICHE DE TIR — SMI IMITER
                </h3>
                <p className="text-[10px] text-slate-300 uppercase font-bold tracking-wider mt-1">
                  {gabarit === '9m2' ? 'Traçage 9m²' : 'Galerie 12m²'}
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
};
