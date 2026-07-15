import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Award, CheckCircle2, AlertTriangle, Printer, Share2, ShieldCheck, Download, Award as RibbonIcon, Landmark } from 'lucide-react';

interface Step9Props {
  step9Data: {
    planned: string;
    real: string;
    buckets: string;
    gasoil: string;
    checklistTamping: string;
    failedBlastCause: string;
    failedBlastComment: string;
    isSubmitted: boolean;
    errorMessage: string;
    isPassed: boolean;
    userName: string;
  };
  setStep9Data: React.Dispatch<React.SetStateAction<{
    planned: string;
    real: string;
    buckets: string;
    gasoil: string;
    checklistTamping: string;
    failedBlastCause: string;
    failedBlastComment: string;
    isSubmitted: boolean;
    errorMessage: string;
    isPassed: boolean;
    userName: string;
  }>>;
  handleStep9Submit: (e: React.FormEvent) => void;
  certificateEarned: boolean;
}

export const Step9FinalExam: React.FC<Step9Props> = ({
  step9Data,
  setStep9Data,
  handleStep9Submit,
  certificateEarned
}) => {

  const handlePrint = () => {
    window.print();
  };

  // Mathematically generate a beautiful complex gold guilloche rosette using SVG paths
  const generateGuillochePath = () => {
    let path = '';
    const cx = 100;
    const cy = 100;
    const R = 65; // Outer radius
    const r = 12; // Inner radius
    const p = 40; // Frequency factor

    for (let theta = 0; theta <= Math.PI * 2 + 0.1; theta += 0.02) {
      const x = cx + (R - r) * Math.cos(theta) + p * Math.cos(((R - r) / r) * theta);
      const y = cy + (R - r) * Math.sin(theta) + p * Math.sin(((R - r) / r) * theta);
      if (theta === 0) {
        path += `M ${x} ${y}`;
      } else {
        path += ` L ${x} ${y}`;
      }
    }
    return path;
  };

  return (
    <div className="space-y-8" id="step9-workspace">
      <div>
        <p className="text-sm text-slate-600 leading-relaxed font-medium">
          Voici votre épreuve d'homologation finale. Vous devez analyser la fiche d'avancement réelle reçue du front, saisir les bons KPIs calculés (pelles, carburant), identifier la non-conformité, et déclarer l'incident.
        </p>
      </div>

      {!certificateEarned ? (
        <form onSubmit={handleStep9Submit} className="bg-white border border-slate-200/80 rounded-3xl p-6 space-y-6 shadow-md">
          <div className="border-b border-slate-100 pb-3.5 flex items-center gap-2">
            <Award className="w-5 h-5 text-[#b8860b]" />
            <h4 className="text-xs font-black uppercase tracking-widest text-slate-900">
              Épreuve de Certification - Saisie Sûreté SMI
            </h4>
          </div>

          {/* User Name input */}
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase tracking-wider text-[#b8860b]">
              Nom & Prénom du Candidat (Pour l'impression du diplôme)
            </label>
            <input
              type="text"
              required
              placeholder="Saisissez votre nom complet..."
              value={step9Data.userName}
              onChange={(e) => setStep9Data(prev => ({ ...prev, userName: e.target.value }))}
              className="w-full bg-slate-50 border border-slate-250 focus:border-[#b8860b] rounded-xl p-3.5 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#b8860b]/15 focus:bg-white transition-all text-slate-800"
            />
          </div>

          {/* Theoretical Problem statement */}
          <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-2xl space-y-3">
            <span className="text-[8px] font-black uppercase tracking-widest bg-[#b8860b] text-white px-2 py-0.5 rounded-md">
              Sujet de l'examen
            </span>
            <p className="text-[11px] text-slate-600 leading-relaxed font-semibold">
              Rapport de poste reçu : Secteur <strong className="text-slate-950">Imiter 2</strong>. Forage standard 12m² avec tige de 1.8m (cible 1.7m). 
              L'avancement réel mesuré n'est que de <strong className="text-slate-950">0.9m</strong>. 
              Les mineurs ont chargé 45 godets de minerai noble et consommé 35 litres de gazole sur le chargeur bas-profil (LHD). 
              L'enquête montre que le chef de chantier n'a mis que <strong className="text-slate-950">40cm de bourrage d'argile</strong> au lieu de 76cm.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Buckets */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                Saisir le nombre de godets évacués
              </label>
              <input
                type="number"
                required
                placeholder="Ex: 40"
                value={step9Data.buckets}
                onChange={(e) => setStep9Data(prev => ({ ...prev, buckets: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-250 rounded-xl p-3 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#b8860b]/20 focus:bg-white"
              />
              <span className="text-[9px] text-slate-400 font-bold uppercase block">(Indice : 45 godets)</span>
            </div>

            {/* Gasoil */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                Saisir la consommation carburant LHD (L)
              </label>
              <input
                type="number"
                required
                placeholder="Ex: 30"
                value={step9Data.gasoil}
                onChange={(e) => setStep9Data(prev => ({ ...prev, gasoil: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-250 rounded-xl p-3 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#b8860b]/20 focus:bg-white"
              />
              <span className="text-[9px] text-slate-400 font-bold uppercase block">(Indice : 35 litres)</span>
            </div>

            {/* Checklist */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                Statut Fiche Bourrage (40cm mesurés)
              </label>
              <select
                value={step9Data.checklistTamping}
                onChange={(e) => setStep9Data(prev => ({ ...prev, checklistTamping: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-250 rounded-xl p-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#b8860b]/20"
              >
                <option value="CONFORME">CONFORME (Norme SMI)</option>
                <option value="NON CONFORME">NON CONFORME (Incident)</option>
              </select>
            </div>

            {/* Cause */}
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                Cause racine du Failed Blast (Volée ratée)
              </label>
              <select
                value={step9Data.failedBlastCause}
                onChange={(e) => setStep9Data(prev => ({ ...prev, failedBlastCause: e.target.value }))}
                className="w-full bg-slate-50 border border-slate-250 rounded-xl p-3 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#b8860b]/20"
              >
                <option value="">-- Choisir --</option>
                <option value="Bourrage insuffisant">Bourrage insuffisant (Coup soufflé)</option>
                <option value="Taillant cassé">Taillant de forage cassé</option>
                <option value="Défaut dynamite">Amorçage Tovex défaillant</option>
              </select>
            </div>
          </div>

          {/* Comment */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-black uppercase tracking-wider text-slate-500">
                Description de l'anomalie de tamping (10 car. min)
              </label>
              <span className="text-[9px] font-mono text-slate-400">
                {step9Data.failedBlastComment.length} / 10 car. min
              </span>
            </div>
            <textarea
              placeholder="Expliquez la cause technique du coup soufflé..."
              rows={3}
              value={step9Data.failedBlastComment}
              onChange={(e) => setStep9Data(prev => ({ ...prev, failedBlastComment: e.target.value }))}
              className="w-full bg-slate-50 border border-slate-250 rounded-xl p-3 text-xs focus:outline-none focus:ring-2 focus:ring-[#b8860b]/20 focus:bg-white resize-none"
            />
          </div>

          {step9Data.isSubmitted && step9Data.errorMessage && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-2xl text-[11px] font-bold uppercase tracking-wide flex items-start gap-2"
            >
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-black">Échec de validation de l'épreuve !</p>
                <p className="text-[10px] text-rose-600 font-bold mt-0.5">{step9Data.errorMessage}</p>
              </div>
            </motion.div>
          )}

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-8 py-3.5 bg-[#b8860b] hover:bg-[#9a7209] text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer shadow-md"
            >
              Soumettre pour examen d'habilitation
            </button>
          </div>
        </form>
      ) : (
        // Spectacular Swiss-designed Physical Diploma of Qualifications
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="print:border-0 print:shadow-none"
        >
          {/* Main frame */}
          <div className="bg-white border-[12px] border-double border-[#b8860b]/65 rounded-3xl p-8 sm:p-12 relative overflow-hidden shadow-2xl max-w-3xl mx-auto font-serif">
            
            {/* Dynamic Gold Guilloche Stamp SVG positioned beautifully as a security seal */}
            <div className="absolute bottom-6 right-8 w-44 h-44 opacity-25 sm:opacity-90 pointer-events-none select-none">
              <svg viewBox="0 0 200 200" className="w-full h-full">
                {/* Mathematical guilloche path */}
                <path d={generateGuillochePath()} stroke="#b8860b" strokeWidth="0.6" fill="none" />
                <path d={generateGuillochePath()} stroke="#b8860b" strokeWidth="0.3" fill="none" transform="rotate(45,100,100)" />
                {/* Official Stamp circle */}
                <circle cx="100" cy="100" r="45" fill="none" stroke="#b8860b" strokeWidth="1.5" strokeDasharray="3,3" />
                <text x="100" y="94" textAnchor="middle" fill="#b8860b" className="text-[8px] font-sans font-black uppercase tracking-widest">SMI IMITER</text>
                <text x="100" y="105" textAnchor="middle" fill="#b8860b" className="text-[10px] font-sans font-black uppercase tracking-widest">SÛRETÉ</text>
                <text x="100" y="115" textAnchor="middle" fill="#b8860b" className="text-[8px] font-sans font-black uppercase tracking-widest">VALIDÉ ✓</text>
              </svg>
            </div>

            {/* Inner certificate border line */}
            <div className="border border-[#b8860b]/30 p-6 sm:p-8 rounded-xl relative space-y-6 text-center">
              
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-[#b8860b]/10 flex items-center justify-center border border-[#b8860b]/20">
                  <RibbonIcon className="w-8 h-8 text-[#b8860b]" />
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="text-[10px] font-sans font-black uppercase tracking-[0.25em] text-[#b8860b] flex items-center justify-center gap-1.5">
                  <Landmark className="w-4 h-4" /> Société Métallurgique d'Imiter (SMI)
                </h4>
                <p className="text-[11px] font-sans text-slate-400 font-bold uppercase tracking-widest">Groupe HydroMines S.A.</p>
              </div>

              <div className="space-y-2 pt-4">
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 uppercase tracking-wide leading-tight">
                  Brevet de Qualification & d'Habilitation
                </h1>
                <p className="text-[13px] text-slate-500 italic">
                  Décerné en vertu de l'évaluation rigoureuse du contrôle d'intégrité minière
                </p>
              </div>

              <div className="py-4">
                <span className="text-[11px] font-sans font-black uppercase tracking-widest text-slate-400 block mb-1">à Monsieur / Madame</span>
                <h2 className="text-2xl sm:text-3xl font-black text-[#b8860b] font-serif tracking-wide border-b border-slate-100 pb-2 max-w-lg mx-auto">
                  {step9Data.userName || "Candidat SMI"}
                </h2>
                <p className="text-[12.5px] text-slate-600 font-sans font-medium mt-3 leading-relaxed max-w-xl mx-auto">
                  Ayant complété avec succès l'ensemble du parcours d'apprentissage technique souterrain, validé les fiches de tirs, analysé les KPIs d'avancement et démontré une maîtrise administrative parfaite des protocoles de sécurité de volée.
                </p>
              </div>

              {/* Technical credentials summary in elegant box */}
              <div className="bg-slate-50 border border-slate-150 rounded-xl p-4 max-w-md mx-auto text-left grid grid-cols-2 gap-4 text-[11px] font-mono leading-relaxed">
                <div>
                  <span className="text-slate-400 block uppercase font-black text-[8px]">Habilitation</span>
                  <span className="font-bold text-slate-800 uppercase">Secrétaire de Chantier</span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase font-black text-[8px]">Fiche d'Audit</span>
                  <span className="font-bold text-emerald-600 uppercase">Conforme (100% Score)</span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase font-black text-[8px]">Secteur d'Action</span>
                  <span className="font-bold text-slate-800 uppercase">Imiter 1, 2 & Est</span>
                </div>
                <div>
                  <span className="text-slate-400 block uppercase font-black text-[8px]">ID Certification</span>
                  <span className="font-bold text-[#b8860b] uppercase">SMI-2026-CERT-A8</span>
                </div>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-8 pt-8 max-w-lg mx-auto font-sans text-left text-[10px] text-slate-500 border-t border-slate-100">
                <div>
                  <span className="block font-black uppercase tracking-widest text-slate-400 mb-4">Le Chef de Mine</span>
                  {/* Signature graphic vector representation */}
                  <svg className="w-24 h-8 text-[#b8860b]" viewBox="0 0 100 30">
                    <path d="M 10 15 Q 30 5 40 25 T 70 15 T 90 20" stroke="#b8860b" strokeWidth="1.5" fill="none" />
                    <path d="M 15 10 C 25 3 35 18 45 10" stroke="#b8860b" strokeWidth="1" fill="none" />
                  </svg>
                  <span className="block font-bold text-slate-700">A. Benjelloun</span>
                </div>
                <div className="text-right">
                  <span className="block font-black uppercase tracking-widest text-slate-400 mb-4">Le Directeur Général</span>
                  {/* Signature graphic vector representation */}
                  <svg className="w-24 h-8 text-[#b8860b] ml-auto" viewBox="0 0 100 30">
                    <path d="M 10 20 Q 25 10 50 15 T 80 10 T 95 18" stroke="#b8860b" strokeWidth="1.5" fill="none" />
                    <path d="M 30 5 C 40 15 50 5 60 25" stroke="#b8860b" strokeWidth="1" fill="none" />
                  </svg>
                  <span className="block font-bold text-slate-700">M. El Idrissi</span>
                </div>
              </div>

            </div>
          </div>

          {/* Practical print & share controls */}
          <div className="mt-8 flex justify-center gap-4 print:hidden">
            <button
              onClick={handlePrint}
              className="px-5 py-3 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-md hover:scale-[1.02]"
            >
              <Printer className="w-4 h-4" /> Imprimer le diplôme officiel
            </button>
            <button
              onClick={() => alert("Lien de qualification copié dans le presse-papiers !")}
              className="px-5 py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-black text-xs uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center gap-2 shadow-sm hover:scale-[1.02]"
            >
              <Share2 className="w-4 h-4 text-[#b8860b]" /> Partager les résultats
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
};
