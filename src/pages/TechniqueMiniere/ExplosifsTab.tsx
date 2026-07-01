import React from 'react';
import { motion } from 'motion/react';
import { Flame, ShieldAlert, Zap, Layers } from 'lucide-react';

interface ExplosifsTabProps {
  gabarit: '12m2' | '9m2';
}

export const ExplosifsTab: React.FC<ExplosifsTabProps> = ({ gabarit }) => {
  const is9m2 = gabarit === '9m2';

  const anfoQty = is9m2 ? "30.0" : "40.0";
  const tovexQty = is9m2 ? "2.4" : "3.2";
  const detonatorQty = is9m2 ? "27" : "32 à 38";

  return (
    <div className="space-y-8 bg-white rounded-3xl p-6 border border-slate-100 shadow-xs">
      
      {/* SECTION HEADER */}
      <div className="border-b border-slate-100 pb-4">
        <span className="text-[10px] font-black uppercase text-amber-600 tracking-widest block">
          Ressources & Substances explosives
        </span>
        <h2 className="text-xl font-black uppercase tracking-widest text-slate-900 mt-1">
          Inventaire des Explosifs pour Galerie de {gabarit === '9m2' ? '9 m²' : '12 m²'}
        </h2>
        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-0.5">
          Dosages officiels de l'ingénierie SMI pour garantir un abattage optimal sans hors-profils
        </p>
      </div>

      {/* SUMMARY STATS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* STAT 1 */}
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-150 flex items-center justify-between">
          <div>
            <span className="text-[9px] font-black uppercase text-slate-400 block">Agent de Charge Principal</span>
            <p className="text-2xl font-black text-slate-800 mt-1">ANFO (Bulk)</p>
            <p className="text-xs font-bold text-amber-600 uppercase mt-0.5">{anfoQty} Kilogrammes</p>
          </div>
          <span className="text-3xl">🏭</span>
        </div>

        {/* STAT 2 */}
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-150 flex items-center justify-between">
          <div>
            <span className="text-[9px] font-black uppercase text-slate-400 block">Amorceur de Fond</span>
            <p className="text-2xl font-black text-slate-800 mt-1">Tovex (Hydrogel)</p>
            <p className="text-xs font-bold text-rose-600 uppercase mt-0.5">{tovexQty} Kilogrammes</p>
          </div>
          <span className="text-3xl">🧨</span>
        </div>

        {/* STAT 3 */}
        <div className="bg-slate-50 p-5 rounded-2xl border border-slate-150 flex items-center justify-between">
          <div>
            <span className="text-[9px] font-black uppercase text-slate-400 block">Allumage Séquentiel</span>
            <p className="text-2xl font-black text-slate-800 mt-1">Amorces</p>
            <p className="text-xs font-bold text-blue-600 uppercase mt-0.5">{detonatorQty} Unités</p>
          </div>
          <span className="text-3xl">⚡</span>
        </div>

      </div>

      {/* DETAILED PRODUCTS SPEC CARDS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pt-2">
        
        {/* PRODUCT 1: ANFO */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs flex flex-col justify-between">
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🏭</span>
                <div>
                  <h3 className="text-sm font-black uppercase text-slate-900">ANFO Bulk</h3>
                  <p className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest mt-0.5">Nitrate de Fioul</p>
                </div>
              </div>
              <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[8px] font-black uppercase rounded">
                Volume principal
              </span>
            </div>

            {/* Specs list */}
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-2 py-1.5 border-b border-slate-50">
                <span className="text-slate-400 font-bold uppercase text-[9px]">Composition</span>
                <span className="font-extrabold text-slate-800 text-right">94% Nitrate / 6% Fuel</span>
              </div>
              <div className="grid grid-cols-2 gap-2 py-1.5 border-b border-slate-50">
                <span className="text-slate-400 font-bold uppercase text-[9px]">Densité en place</span>
                <span className="font-extrabold text-slate-800 text-right">0.85 g/cm³</span>
              </div>
              <div className="grid grid-cols-2 gap-2 py-1.5 border-b border-slate-50">
                <span className="text-slate-400 font-bold uppercase text-[9px]">Vitesse Détonation</span>
                <span className="font-extrabold text-slate-800 text-right">4 500 m/s</span>
              </div>
              <div className="grid grid-cols-2 gap-2 py-1.5 border-b border-slate-50">
                <span className="text-slate-400 font-bold uppercase text-[9px]">Pression de Gaz</span>
                <span className="font-extrabold text-slate-800 text-right">48 000 bar</span>
              </div>
              <div className="grid grid-cols-2 gap-2 py-1.5">
                <span className="text-slate-400 font-bold uppercase text-[9px]">Sensibilité d'impact</span>
                <span className="font-extrabold text-amber-600 text-right uppercase text-[9.5px]">Basse (Sécuritaire)</span>
              </div>
            </div>

            {/* Mode d'emploi */}
            <div className="bg-slate-50 p-4 rounded-xl space-y-2">
              <p className="text-[9.5px] font-black uppercase text-slate-700 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-slate-500" /> Mode d'emploi terrain :
              </p>
              <ul className="text-[10px] font-semibold text-slate-600 space-y-1.5 list-disc list-inside">
                <li>Souffler le trou à l'air comprimé avant injection.</li>
                <li>Utiliser le distributeur pneumatique (chargeur ANFO).</li>
                <li>Garantir une densité homogène sans vide d'air.</li>
                <li>Laisser la longueur de bourrage réglementaire vide au col.</li>
              </ul>
            </div>
          </div>

          <div className="bg-amber-400/10 border-t border-amber-400/20 p-4">
            <p className="text-[9.5px] font-bold text-amber-800 leading-relaxed uppercase">
              ⚠️ Attention : L'ANFO est hydrosoluble. Il ne doit jamais être utilisé dans des trous humides ou comportant des venues d'eau (perte d'énergie immédiate).
            </p>
          </div>
        </div>

        {/* PRODUCT 2: TOVEX */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs flex flex-col justify-between">
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🧨</span>
                <div>
                  <h3 className="text-sm font-black uppercase text-slate-900">Tovex Hydrogel</h3>
                  <p className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest mt-0.5">Émulsion Cartouchée</p>
                </div>
              </div>
              <span className="px-2 py-0.5 bg-rose-50 text-rose-700 text-[8px] font-black uppercase rounded">
                Amorceur / Eau
              </span>
            </div>

            {/* Specs list */}
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-2 py-1.5 border-b border-slate-50">
                <span className="text-slate-400 font-bold uppercase text-[9px]">Diamètre cartouche</span>
                <span className="font-extrabold text-slate-800 text-right">25 mm ou 32 mm</span>
              </div>
              <div className="grid grid-cols-2 gap-2 py-1.5 border-b border-slate-50">
                <span className="text-slate-400 font-bold uppercase text-[9px]">Densité en place</span>
                <span className="font-extrabold text-slate-800 text-right">1.25 g/cm³</span>
              </div>
              <div className="grid grid-cols-2 gap-2 py-1.5 border-b border-slate-50">
                <span className="text-slate-400 font-bold uppercase text-[9px]">Vitesse Détonation</span>
                <span className="font-extrabold text-slate-800 text-right">5 600 m/s</span>
              </div>
              <div className="grid grid-cols-2 gap-2 py-1.5 border-b border-slate-50">
                <span className="text-slate-400 font-bold uppercase text-[9px]">Résistance à l'eau</span>
                <span className="font-extrabold text-emerald-600 text-right uppercase text-[9.5px]">Maximale (100%)</span>
              </div>
              <div className="grid grid-cols-2 gap-2 py-1.5">
                <span className="text-slate-400 font-bold uppercase text-[9px]">Énergie de choc</span>
                <span className="font-extrabold text-slate-800 text-right">Très élevée (Amorçage)</span>
              </div>
            </div>

            {/* Mode d'emploi */}
            <div className="bg-slate-50 p-4 rounded-xl space-y-2">
              <p className="text-[9.5px] font-black uppercase text-slate-700 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-slate-500" /> Mode d'emploi terrain :
              </p>
              <ul className="text-[10px] font-semibold text-slate-600 space-y-1.5 list-disc list-inside">
                <li>Préparer la cartouche-amorce en insérant le détonateur.</li>
                <li>Pousser délicatement la cartouche jusqu'au fond du trou.</li>
                <li>Charger 1 cartouche de Tovex par trou comme multiplicateur.</li>
                <li>Utiliser exclusivement du Tovex en cas de trou mouillé.</li>
              </ul>
            </div>
          </div>

          <div className="bg-rose-50 border-t border-rose-200 p-4">
            <p className="text-[9.5px] font-bold text-rose-800 leading-relaxed uppercase">
              🎯 Rôle Clé : Le Tovex possède une vitesse d'onde de choc ultra-rapide capable d'initier la détonation stable de l'ANFO, qui est insensible à l'amorce seule.
            </p>
          </div>
        </div>

        {/* PRODUCT 3: DETONATORS */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs flex flex-col justify-between">
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-2xl">⚡</span>
                <div>
                  <h3 className="text-sm font-black uppercase text-slate-900">Détonateurs</h3>
                  <p className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest mt-0.5">Amorces Électroniques</p>
                </div>
              </div>
              <span className="px-2 py-0.5 bg-blue-50 text-blue-700 text-[8px] font-black uppercase rounded">
                Amorçage / Contrôle
              </span>
            </div>

            {/* Specs list */}
            <div className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-2 py-1.5 border-b border-slate-50">
                <span className="text-slate-400 font-bold uppercase text-[9px]">Gamme de retard</span>
                <span className="font-extrabold text-slate-800 text-right">0 ms à 125 ms</span>
              </div>
              <div className="grid grid-cols-2 gap-2 py-1.5 border-b border-slate-50">
                <span className="text-slate-400 font-bold uppercase text-[9px]">Précision de tir</span>
                <span className="font-extrabold text-slate-800 text-right">±0.05 ms (Électronique)</span>
              </div>
              <div className="grid grid-cols-2 gap-2 py-1.5 border-b border-slate-50">
                <span className="text-slate-400 font-bold uppercase text-[9px]">Type de signal</span>
                <span className="font-extrabold text-slate-800 text-right">Bus numérique codé</span>
              </div>
              <div className="grid grid-cols-2 gap-2 py-1.5 border-b border-slate-50">
                <span className="text-slate-400 font-bold uppercase text-[9px]">Résistance d'eau</span>
                <span className="font-extrabold text-emerald-600 text-right uppercase text-[9.5px]">Étanche HP (IP68)</span>
              </div>
              <div className="grid grid-cols-2 gap-2 py-1.5">
                <span className="text-slate-400 font-bold uppercase text-[9px]">Protection foudre</span>
                <span className="font-extrabold text-slate-800 text-right">Intégrée (Antistatique)</span>
              </div>
            </div>

            {/* Mode d'emploi */}
            <div className="bg-slate-50 p-4 rounded-xl space-y-2">
              <p className="text-[9.5px] font-black uppercase text-slate-700 flex items-center gap-1">
                <Layers className="w-3.5 h-3.5 text-slate-500" /> Mode d'emploi terrain :
              </p>
              <ul className="text-[10px] font-semibold text-slate-600 space-y-1.5 list-disc list-inside">
                <li>Manipuler avec les mains sèches et propres.</li>
                <li>Vérifier l'intégrité du câble d'alimentation (jaunâtre/bleu).</li>
                <li>Raccorder la ligne de bus en série stricte sans court-circuit.</li>
                <li>Tester la résistance globale au pont de tir réglementaire.</li>
              </ul>
            </div>
          </div>

          <div className="bg-blue-50 border-t border-blue-200 p-4">
            <p className="text-[9.5px] font-bold text-blue-800 leading-relaxed uppercase">
              🔒 Sécurité foudre : La technologie électronique codée empêche tout déclenchement intempestif par courants vagabonds ou décharges électrostatiques atmosphériques.
            </p>
          </div>
        </div>

      </div>

      {/* STORAGE & SAFETY STATS */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 space-y-4">
        <h3 className="text-sm font-black uppercase text-[#ffd700] tracking-widest flex items-center gap-2">
          <ShieldAlert className="w-5 h-5" />
          Règles strictes de gestion et stockage SMI Imiter
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs text-slate-300 font-medium">
          <div className="space-y-2 leading-relaxed">
            <p className="flex items-start gap-2">
              <span className="text-[#ffd700] text-lg mt-0.5">•</span>
              <span><strong>Séparation absolue :</strong> Il est strictement interdit de stocker ou de transporter les détonateurs (amorces) et les explosifs (ANFO, Tovex) dans le même véhicule ou compartiment de dépôt.</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-[#ffd700] text-lg mt-0.5">•</span>
              <span><strong>Registre d'émargement :</strong> Toute sortie de substance explosive souterraine doit faire l'objet d'un double émargement systématique par le chef de poste boutefeu et le responsable de la poudrière SMI.</span>
            </p>
          </div>
          <div className="space-y-2 leading-relaxed">
            <p className="flex items-start gap-2">
              <span className="text-[#ffd700] text-lg mt-0.5">•</span>
              <span><strong>Gestion des invendus :</strong> Les cartouches de Tovex non amorcées et les sacs d'ANFO restants à la fin d'une volée doivent être remontés immédiatement au dépôt principal. Aucun explosif ne doit dormir sur un chantier actif.</span>
            </p>
            <p className="flex items-start gap-2">
              <span className="text-[#ffd700] text-lg mt-0.5">•</span>
              <span><strong>Procédure de ratés :</strong> En cas de raté de tir (absence de détonation), interdiction stricte de pénétrer sur le front avant un délai d'attente obligatoire de 30 minutes. Le front doit être rincé à l'eau claire pour dissoudre l'ANFO restant.</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
