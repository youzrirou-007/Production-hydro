import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Activity, Info, Award, ShieldAlert, TrendingUp } from 'lucide-react';

interface CalculsTabProps {
  gabarit: '12m2' | '9m2';
}

export const CalculsTab: React.FC<CalculsTabProps> = ({ gabarit }) => {
  const is9m2 = gabarit === '9m2';
  const initialHoles = is9m2 ? 28 : 38;

  const [rodType, setRodType] = useState<'1.8' | '2.4'>('1.8');
  const [numHoles, setNumHoles] = useState<number>(initialHoles);
  
  // Depth defaults to 1.7 for 1.8m rod, and 2.3 for 2.4m rod
  const defaultDepth = rodType === '1.8' ? 1.7 : 2.3;
  const [drillDepth, setDrillDepth] = useState<number>(defaultDepth);

  // When gabarit changes, we should also handle state sync or update
  React.useEffect(() => {
    setNumHoles(is9m2 ? 28 : 38);
  }, [gabarit, is9m2]);

  // When rod type changes, update the default depth
  const handleRodChange = (type: '1.8' | '2.4') => {
    setRodType(type);
    setDrillDepth(type === '1.8' ? 1.7 : 2.3);
  };

  // MATHEMATICAL ESTIMATES
  // Loaded holes and empty holes based on gabarit
  const emptyHolesCount = is9m2 ? 1 : 3;
  const loadedHoles = Math.max(0, numHoles - emptyHolesCount);

  // ANFO consumption:
  // 12m²: ~40kg / 35 loaded holes = ~1.14 kg per hole
  // 9m²: ~30kg / 27 loaded holes = ~1.11 kg per hole
  const anfoPerHole = is9m2 ? (30.0 / 27) : (40.0 / 35);
  const totalAnfoKg = loadedHoles * anfoPerHole;

  // Tovex consumption:
  // 12m²: ~3.2kg / 35 loaded holes = ~0.091 kg per hole
  // 9m²: ~2.4kg / 27 loaded holes = ~0.089 kg per hole
  const tovexPerHole = is9m2 ? (2.4 / 27) : (3.2 / 35);
  const totalTovexKg = loadedHoles * tovexPerHole;

  // Detonator count matches loaded holes
  const detonatorsCount = loadedHoles;

  // Expected footage pulled (assuming 100% yield for perfect alignment)
  const expectedFootage = drillDepth;

  // Miner cash bonus is 35 MAD per meter pulled
  const minerBonusMAD = expectedFootage * 35;

  // Custom Chart alignment quality selected state
  const [deviationLevel, setDeviationLevel] = useState<'perfect' | 'minor' | 'major'>('perfect');

  const getChartData = () => {
    const foré = drillDepth;
    let arraché = drillDepth;
    let rate = 100;

    if (deviationLevel === 'minor') {
      arraché = Number((drillDepth * 0.80).toFixed(2));
      rate = 80;
    } else if (deviationLevel === 'major') {
      arraché = Number((drillDepth * 0.50).toFixed(2));
      rate = 50;
    }

    return { foré, arraché, rate };
  };

  const chart = getChartData();

  return (
    <div className="space-y-8 bg-white rounded-3xl p-6 border border-slate-100 shadow-xs">
      
      {/* HEADER */}
      <div className="border-b border-slate-100 pb-4">
        <span className="text-[10px] font-black uppercase text-amber-600 tracking-widest block">
          Calculateur prévisionnel & économie minière
        </span>
        <h2 className="text-xl font-black uppercase tracking-widest text-slate-900 mt-1">
          Simulateur Interactif de Volée & Rendement financier
        </h2>
        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-0.5">
          Modélisez la consommation d'explosifs et calculez la prime de rendement par mineur
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* INPUTS PANEL (5 Columns) */}
        <div className="lg:col-span-5 bg-white border border-slate-200 rounded-2xl p-6 space-y-6">
          <h3 className="text-xs font-black uppercase text-slate-900 border-b border-slate-100 pb-3">
            Paramètres du front de taille
          </h3>

          {/* Rod selector */}
          <div className="space-y-2">
            <span className="text-[10px] font-black uppercase text-slate-400 block">Type de tige de forage</span>
            <div className="grid grid-cols-2 gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => handleRodChange('1.8')}
                className={`py-2 rounded-lg text-xs font-black uppercase transition-all ${
                  rodType === '1.8'
                    ? 'bg-slate-950 text-white shadow'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                1.8 m (Tige courte)
              </button>
              <button
                onClick={() => handleRodChange('2.4')}
                className={`py-2 rounded-lg text-xs font-black uppercase transition-all ${
                  rodType === '2.4'
                    ? 'bg-slate-950 text-white shadow'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                2.4 m (Tige longue)
              </button>
            </div>
          </div>

          {/* Holes Input */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-700 uppercase">Nombre total de trous forés :</span>
              <span className="font-mono font-black text-slate-900 bg-slate-100 px-2.5 py-1 rounded">
                {numHoles} trous
              </span>
            </div>
            <input
              type="range"
              min={is9m2 ? 20 : 30}
              max={is9m2 ? 32 : 42}
              step="1"
              value={numHoles}
              onChange={(e) => setNumHoles(parseInt(e.target.value))}
              className="w-full accent-amber-500 bg-slate-200 h-2 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase">
              <span>Min : {is9m2 ? 20 : 30} trous</span>
              <span>{is9m2 ? 'Idéal (9m²) : 28 trous' : 'Idéal (12m²) : 38 trous'}</span>
              <span>Max : {is9m2 ? 32 : 42} trous</span>
            </div>
          </div>

          {/* Depth Input */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-slate-700 uppercase">Profondeur de forage réelle :</span>
              <span className="font-mono font-black text-slate-900 bg-slate-100 px-2.5 py-1 rounded">
                {drillDepth.toFixed(2)} m
              </span>
            </div>
            <input
              type="range"
              min="1.0"
              max="3.0"
              step="0.1"
              value={drillDepth}
              onChange={(e) => setDrillDepth(parseFloat(e.target.value))}
              className="w-full accent-amber-500 bg-slate-200 h-2 rounded-lg cursor-pointer"
            />
            <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase">
              <span>Min : 1.0 m</span>
              <span>Max : 3.0 m</span>
            </div>
          </div>
        </div>

        {/* PREVISIONNEL OUTPUTS (7 Columns) */}
        <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* OUTPUT CARD 1: EXPLO DOSES */}
          <div className="bg-slate-50 rounded-2xl p-6 border border-slate-150 space-y-4">
            <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider border-b border-slate-200/50 pb-2">
              Doses d'Explosifs Modélisées
            </h4>
            <div className="space-y-3.5 text-xs font-semibold">
              <div className="flex justify-between">
                <span className="text-slate-400 uppercase text-[9px]">Trous de mine chargés :</span>
                <span className="text-slate-800 font-extrabold">{loadedHoles} trous</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 uppercase text-[9px]">Trous vides d'expansion :</span>
                <span className="text-slate-800 font-extrabold text-blue-600">3 trous (V)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 uppercase text-[9px]">Volume ANFO requis :</span>
                <span className="text-slate-900 font-black">{totalAnfoKg.toFixed(1)} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 uppercase text-[9px]">Hydrogel Tovex requis :</span>
                <span className="text-slate-900 font-black">{totalTovexKg.toFixed(1)} kg</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400 uppercase text-[9px]">Amorces électroniques :</span>
                <span className="text-slate-950 font-black text-amber-600">{detonatorsCount} unités</span>
              </div>
            </div>
          </div>

          {/* OUTPUT CARD 2: INCOME ESTIMATE */}
          <div className="bg-amber-400/5 border border-amber-400/20 rounded-2xl p-6 space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <span className="text-[9px] font-black uppercase text-amber-600 bg-amber-400/10 px-2 py-0.5 rounded inline-block">
                SMI Prime de Rendement
              </span>
              <h4 className="text-xs font-black uppercase text-slate-800 tracking-wider">
                GAINS ESTIMÉS PAR MINEUR / VOLÉE
              </h4>
            </div>

            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase text-slate-400">Prime d'Avancement</span>
              <p className="text-3xl font-black text-slate-950 tracking-tight">
                {minerBonusMAD.toFixed(2)} MAD
              </p>
              <p className="text-[10px] font-bold text-slate-500 uppercase">
                Base officielle de 35 MAD par mètre arraché
              </p>
            </div>

            <div className="bg-white border border-amber-400/20 p-3 rounded-xl flex items-center gap-2.5">
              <Award className="w-5 h-5 text-amber-500 shrink-0" />
              <p className="text-[10px] font-semibold text-slate-600 leading-relaxed">
                Chaque mètre foré supplémentaire avec des tiges de 2.4m augmente la prime d'avancement mensuelle de près de <strong>1 400 MAD</strong> par mineur.
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* COMPARATIVE SECTION 1.8M VS 2.4M */}
      <div className="space-y-4 pt-4 border-t border-slate-100">
        <h3 className="text-xs font-black uppercase text-slate-800 tracking-wider">
          Comparaison d'Efficacité : Tige 1.8 m vs Tige 2.4 m
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border border-slate-200 rounded-xl overflow-hidden">
            <thead className="bg-slate-900 text-white font-black uppercase text-[10px] tracking-wider">
              <tr>
                <th className="p-4">Paramètre opérationnel (SMI)</th>
                <th className="p-4 text-center">Tige 1.8 mètres</th>
                <th className="p-4 text-center text-[#ffd700]">Tige 2.4 mètres</th>
                <th className="p-4 text-center text-emerald-400">Écart / Gain</th>
              </tr>
            </thead>
            <tbody className="font-semibold text-slate-700 divide-y divide-slate-100">
              <tr>
                <td className="p-4 font-extrabold text-slate-900">Profondeur théorique du trou</td>
                <td className="p-4 text-center">1.80 m</td>
                <td className="p-4 text-center">2.40 m</td>
                <td className="p-4 text-center text-slate-800 font-extrabold">+0.60 m</td>
              </tr>
              <tr>
                <td className="p-4 font-extrabold text-slate-900">Métrage arraché optimal</td>
                <td className="p-4 text-center">1.70 m</td>
                <td className="p-4 text-center">2.30 m</td>
                <td className="p-4 text-center text-slate-800 font-extrabold">+0.60 m (100% pull)</td>
              </tr>
              <tr>
                <td className="p-4 font-extrabold text-slate-900">Sacs d'ANFO nécessaires</td>
                <td className="p-4 text-center">{is9m2 ? "24.5 kg" : "36.8 kg"}</td>
                <td className="p-4 text-center">{is9m2 ? "40.1 kg" : "42.5 kg"}</td>
                <td className="p-4 text-center text-slate-500 font-normal">{is9m2 ? "+15.6 kg de charge" : "+5.7 kg de charge"}</td>
              </tr>
              <tr>
                <td className="p-4 font-extrabold text-slate-900">Temps de cycle forage</td>
                <td className="p-4 text-center">45 min</td>
                <td className="p-4 text-center">60 min</td>
                <td className="p-4 text-center text-slate-500 font-normal">+15 minutes de forage</td>
              </tr>
              <tr className="bg-amber-400/5">
                <td className="p-4 font-black text-slate-900">Prime de rendement par volée</td>
                <td className="p-4 text-center font-extrabold">59.50 MAD</td>
                <td className="p-4 text-center font-black text-slate-900">80.50 MAD</td>
                <td className="p-4 text-center text-emerald-600 font-black">+21.00 MAD (+35%)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* INTERACTIVE ALIGNMENT IMPACT CHART (SVG GRAPHIQUE) */}
      <div className="bg-slate-50 rounded-2xl p-6 border border-slate-200/60 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <span className="text-[9px] font-black uppercase text-amber-600 tracking-wider block">Étude physique de rendement</span>
            <h4 className="text-xs font-black uppercase text-slate-900 mt-0.5">
              Impact de l'alignement des trous sur le métrage arraché réel
            </h4>
          </div>
          
          {/* Quality Selector */}
          <div className="flex bg-white border border-slate-200 rounded-xl p-1 gap-1 shadow-sm">
            <button
              onClick={() => setDeviationLevel('perfect')}
              className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors ${
                deviationLevel === 'perfect'
                  ? 'bg-emerald-500 text-white'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Parallèle (100%)
            </button>
            <button
              onClick={() => setDeviationLevel('minor')}
              className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors ${
                deviationLevel === 'minor'
                  ? 'bg-amber-500 text-slate-950 font-black'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Déviation Légère (80%)
            </button>
            <button
              onClick={() => setDeviationLevel('major')}
              className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider transition-colors ${
                deviationLevel === 'major'
                  ? 'bg-rose-500 text-white'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Divergence Majeure (50%)
            </button>
          </div>
        </div>

        {/* DUAL SVG BAR CHART */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          
          {/* Left panel metrics (4 columns) */}
          <div className="md:col-span-4 space-y-4 text-xs">
            <div className="bg-white border border-slate-150 p-4 rounded-xl space-y-3 shadow-xs">
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase">Avancement théorique :</p>
                <p className="text-sm font-black text-slate-800">{drillDepth.toFixed(2)} mètres</p>
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-400 uppercase">Métrage arraché réel :</p>
                <p className="text-sm font-black text-slate-900">{chart.arraché.toFixed(2)} mètres</p>
              </div>
              <div className="pt-2 border-t border-slate-100">
                <p className="text-[9px] font-bold text-slate-400 uppercase">Taux de réussite :</p>
                <p className={`text-base font-black ${
                  chart.rate === 100 ? 'text-emerald-500' : chart.rate === 80 ? 'text-amber-500' : 'text-rose-500'
                }`}>{chart.rate}% du forage récupéré</p>
              </div>
            </div>
          </div>

          {/* Dual bar chart graphic (8 columns) */}
          <div className="md:col-span-8 bg-white border border-slate-150 p-4 rounded-xl shadow-xs">
            <svg viewBox="0 0 500 200" className="w-full h-auto">
              {/* Grid lines */}
              <line x1="50" y1="160" x2="450" y2="160" stroke="#cbd5e1" strokeWidth="2" />
              <line x1="50" y1="110" x2="450" y2="110" stroke="#f1f5f9" strokeWidth="1" />
              <line x1="50" y1="60" x2="450" y2="60" stroke="#f1f5f9" strokeWidth="1" />

              {/* BAR 1 : METRAGE FORE */}
              {/* X position 120 */}
              <rect x="130" y={160 - (100 * 1.1)} width="50" height={100 * 1.1} fill="#64748b" rx="4" />
              <text x="155" y={160 - (100 * 1.1) - 8} textAnchor="middle" className="font-mono text-[10px] font-black fill-slate-700">
                {drillDepth.toFixed(1)} m
              </text>

              {/* BAR 2 : METRAGE ARRACHE (Dynamic height based on deviation) */}
              {/* X position 280 */}
              <rect
                x="280"
                y={160 - (chart.rate * 1.1)}
                width="50"
                height={chart.rate * 1.1}
                fill={chart.rate === 100 ? '#10b981' : chart.rate === 80 ? '#f59e0b' : '#ef4444'}
                rx="4"
              />
              <text x="305" y={160 - (chart.rate * 1.1) - 8} textAnchor="middle" className="font-mono text-[10px] font-black fill-slate-900">
                {chart.arraché.toFixed(1)} m
              </text>

              {/* Labels on X Axis */}
              <text x="155" y="180" textAnchor="middle" className="text-[10px] font-black uppercase fill-slate-500">Métrage Foré</text>
              <text x="305" y="180" textAnchor="middle" className="text-[10px] font-black uppercase fill-slate-700">Métrage Arraché</text>
            </svg>
          </div>

        </div>

        {/* ANALYSIS ADVICE */}
        <p className="text-[10.5px] font-bold text-slate-500 leading-relaxed italic uppercase">
          * Les statistiques minières de la SMI prouvent que 90% des pertes de métrage (les culots de trous de plus de 40 cm) résultent d'un manque de parallélisme lors du forage. Un trou dévié s'éloigne de son voisin, augmentant la ligne de moindre résistance au-delà de la puissance d'abattage des gaz.
        </p>

      </div>
    </div>
  );
};
