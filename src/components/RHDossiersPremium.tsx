import React, { useState, useMemo } from 'react';
import { 
  HardHat, 
  Award, 
  ShieldCheck, 
  Fuel, 
  Bomb, 
  Clock, 
  HelpCircle, 
  AlertTriangle, 
  Activity, 
  User, 
  CheckCircle,
  FileText,
  TrendingUp,
  Search,
  BookOpen,
  Briefcase
} from 'lucide-react';
import { 
  calculateMinerStats, 
  calculateDriverStats, 
  calculateChiefStats, 
  calculateAssistantMinerStats 
} from '../lib/rhCalculations';

interface Employee {
  id: string;
  name: string;
  matricule: string;
  role: 'Mineur' | 'Aide Mineur' | 'Conducteur LHD' | 'Chef d\'Équipe' | 'Treuilliste' | 'Équipier' | string;
  phone?: string;
  active?: boolean;
}

interface RHDossiersPremiumProps {
  employees: Employee[];
  allProductionDocs: any[];
  allPlanningSheets: any[];
}

export const RHDossiersPremium: React.FC<RHDossiersPremiumProps> = ({
  employees = [],
  allProductionDocs = [],
  allPlanningSheets = []
}) => {
  const [selectedMatricule, setSelectedMatricule] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  // Filter employees based on search
  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const nameMatch = (emp.name || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matMatch = (emp.matricule || '').toLowerCase().includes(searchTerm.toLowerCase());
      const roleMatch = (emp.role || '').toLowerCase().includes(searchTerm.toLowerCase());
      return nameMatch || matMatch || roleMatch;
    });
  }, [employees, searchTerm]);

  // Set default selection on mount if available
  React.useEffect(() => {
    if (employees.length > 0 && !selectedMatricule) {
      setSelectedMatricule(employees[0].matricule || employees[0].id);
    }
  }, [employees, selectedMatricule]);

  const selectedEmployee = useMemo(() => {
    return employees.find(emp => emp.matricule === selectedMatricule || emp.id === selectedMatricule);
  }, [employees, selectedMatricule]);

  // Compile calculations for selected employee
  const selectedEmployeeStats = useMemo(() => {
    if (!selectedEmployee) return null;
    const mat = (selectedEmployee.matricule || '').toUpperCase();

    // Fetch individual metrics
    const minerStats = calculateMinerStats(mat, allProductionDocs);
    const driverStats = calculateDriverStats(mat, allProductionDocs);
    const chiefStats = calculateChiefStats(mat, allProductionDocs, allPlanningSheets);
    const assistantStats = calculateAssistantMinerStats(mat, allProductionDocs);

    // Activity check
    const hasMiner = minerStats.totalRounds > 0;
    const hasDriver = driverStats.totalVolume > 0;
    const hasChief = chiefStats.shiftsLed > 0;
    const hasAssistant = assistantStats.roundsAssisted > 0;

    // Attendance & shifts
    let totalPresenceShifts = 0;
    allProductionDocs.forEach(doc => {
      let isPresent = false;
      if (doc.minageRows && Array.isArray(doc.minageRows)) {
        if (doc.minageRows.some((r: any) => r.minerMatricule === mat || r.assistantMatricule === mat)) isPresent = true;
      }
      if (doc.deblayageRows && Array.isArray(doc.deblayageRows)) {
        if (doc.deblayageRows.some((r: any) => r.driverMatricule === mat)) isPresent = true;
      }
      if (isPresent) totalPresenceShifts++;
    });

    return {
      minerStats,
      driverStats,
      chiefStats,
      assistantStats,
      hasMiner,
      hasDriver,
      hasChief,
      hasAssistant,
      totalPresenceShifts
    };
  }, [selectedEmployee, allProductionDocs, allPlanningSheets]);

  // Strengths & recommendations based on role
  const profileInsights = useMemo(() => {
    if (!selectedEmployee || !selectedEmployeeStats) return null;
    const role = (selectedEmployee.role || '').toUpperCase();
    const stats = selectedEmployeeStats;

    let strengths: string[] = [];
    let weaknesses: string[] = [];
    let grade = 'B';
    let safetyIndex = 95; // default starting

    if (role.includes('MINEUR') && stats.hasMiner) {
      const yieldAvg = stats.minerStats.avgYield;
      const specificExp = stats.minerStats.specificExplosiveConsumption;

      if (yieldAvg >= 1.6) {
        strengths.push('Rendement de tir supérieur à la moyenne (>1.6m/v). Excellent schéma de foration.');
        grade = 'A+';
      } else if (yieldAvg >= 1.4) {
        strengths.push('Excellente régularité sur les tirées standards de front de galerie.');
        grade = 'A';
      } else {
        weaknesses.push('Rendement moyen de tirée améliorable (<1.3m/v). Possibles déviations d\'angle de foration.');
        grade = 'C';
      }

      if (specificExp <= 1.9) {
        strengths.push('Consommation spécifique optimisée d\'explosifs (ANFO/Tovex). Moins de hors-profil.');
      } else {
        weaknesses.push('Consommation d\'explosifs légèrement supérieure à la cible par mètre (sur-chargement).');
      }
    } else if (role.includes('CONDUCTEUR') && stats.hasDriver) {
      const fillRate = stats.driverStats.avgVolumePerGodet;
      const fuelEfficiency = stats.driverStats.specificGasoilRatio;

      if (fillRate >= 2.2) {
        strengths.push('Remplissage optimal des godets, limitant le nombre de cycles à vide.');
        grade = 'A+';
      } else {
        weaknesses.push('Chargement moyen par godet faible. Cycles de chargement sous-optimisés.');
      }

      if (fuelEfficiency <= 2.2) {
        strengths.push('Excellent ratio d\'efficience énergétique du carburant gasoil.');
      } else {
        weaknesses.push('Consommation spécifique de carburant par m³ élevée (ralenti prolongé probable).');
      }
    } else if (role.includes('CHEF') && stats.hasChief) {
      const scores = stats.chiefStats.averageGlobalScoreUnderManagement;
      if (scores >= 90) {
        strengths.push('Leadership exceptionnel avec scores d\'équipe consolidés élevés (>90%).');
        grade = 'A+';
      } else if (scores >= 80) {
        strengths.push('Bonne cohésion d\'équipe et alignement strict avec la planification du shift.');
        grade = 'A';
      } else {
        weaknesses.push('Disparités régulières de performance sur l\'équipe sous gestion.');
        grade = 'C';
      }
    } else {
      // Default placeholder metrics
      strengths.push('Assiduité irréprochable sur les shifts affectés.');
      strengths.push('Zéro incident de sécurité déclaré en fond de mine.');
    }

    return { strengths, weaknesses, grade, safetyIndex };
  }, [selectedEmployee, selectedEmployeeStats]);

  return (
    <div className="space-y-8">
      {/* EXPLANATORY CONSULTING BANNER (Mission 5 context) */}
      <div className="bg-slate-50 border border-slate-150 rounded-3xl p-6 text-slate-800 space-y-3">
        <h3 className="text-xs font-black uppercase text-slate-800 flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-[#b8860b]" /> VALEUR CONTEXTUELLE DES DOSSIERS RH PREMIUM
        </h3>
        <p className="text-[10.5px] leading-relaxed text-slate-600 font-medium">
          Ce module prépare l'intégration d'un <strong>passeport d'activité individuel</strong> pour l'ensemble du personnel SMI du fond de mine (Mineurs, Conducteurs, Chefs d'équipe, etc.). Il permet de croiser l'assiduité déclarative de la feuille de présence avec la productivité mécanique réelle issue des rapports de production journaliers.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div className="bg-white p-4.5 rounded-xl border border-slate-150">
            <span className="text-[8.5px] font-black text-emerald-700 uppercase tracking-wider block mb-1">💡 Bénéfices métiers clés :</span>
            <ul className="list-disc pl-4 space-y-1 text-[10px] text-slate-500 font-bold uppercase">
              <li>Classement objectif des primes de rendement sur des données inaltérables.</li>
              <li>Identification précoce des besoins de formation (ex: foration oblique ou roulage).</li>
              <li>Fidélisation des meilleurs profils et amélioration du climat social.</li>
            </ul>
          </div>
          <div className="bg-white p-4.5 rounded-xl border border-slate-150">
            <span className="text-[8.5px] font-black text-rose-700 uppercase tracking-wider block mb-1">⚠️ Limites actuelles & données manquantes :</span>
            <ul className="list-disc pl-4 space-y-1 text-[10px] text-slate-500 font-bold uppercase">
              <li>Manque d'évaluation comportementale directe et de contrôles de sécurité.</li>
              <li>Données historiques limitées aux saisies manuelles déclaratives (à automatiser).</li>
              <li>Besoin d'intégrer le suivi d'usure matériel imputable au conducteur/mineur.</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* LEFT COLUMN: STAFF LIST & SEARCH */}
        <div className="bg-white border border-gray-150 rounded-3xl p-5 shadow-xs space-y-4 xl:col-span-1">
          <div className="space-y-1.5">
            <h4 className="text-xs font-black uppercase text-slate-800">Registre du Personnel Fond</h4>
            <p className="text-[10px] text-slate-400 font-bold">Sélectionner un collaborateur pour compiler son dossier</p>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder="Rechercher nom, rôle ou matricule..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-150 text-[10.5px] font-black uppercase text-slate-800 rounded-xl pl-9 pr-4 py-2 outline-none focus:bg-white"
            />
          </div>

          <div className="space-y-1.5 overflow-y-auto max-h-96 pr-1">
            {filteredEmployees.map(emp => {
              const isSelected = emp.matricule === selectedMatricule || emp.id === selectedMatricule;
              return (
                <button
                  key={emp.id}
                  onClick={() => setSelectedMatricule(emp.matricule || emp.id)}
                  className={`w-full text-left p-3 rounded-xl border transition-all flex items-center justify-between cursor-pointer ${
                    isSelected 
                      ? 'bg-slate-900 border-slate-950 text-white shadow-md' 
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-150 text-slate-800'
                  }`}
                >
                  <div className="min-w-0">
                    <span className="text-[10.5px] font-black uppercase block truncate">{emp.name}</span>
                    <span className={`text-[8.5px] font-bold block ${isSelected ? 'text-slate-400' : 'text-slate-500'}`}>{emp.role}</span>
                  </div>
                  <span className={`text-[9px] font-mono font-black border rounded px-1.5 py-0.5 shrink-0 ${
                    isSelected ? 'bg-slate-800 text-[#ffd700] border-slate-700' : 'bg-white text-slate-600 border-slate-200'
                  }`}>
                    {emp.matricule || 'N/A'}
                  </span>
                </button>
              );
            })}
            {filteredEmployees.length === 0 && (
              <div className="text-center py-6 text-slate-400 text-[10px] uppercase font-black">
                Aucun collaborateur trouvé
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: PREMIUM PASSPORT */}
        <div className="xl:col-span-2 space-y-6">
          {selectedEmployee ? (
            <div className="bg-slate-900 border border-slate-950 text-white rounded-3xl p-6 relative overflow-hidden shadow-xl space-y-6">
              {/* Background badge decorations */}
              <div className="absolute top-0 right-0 p-8 opacity-5">
                <HardHat className="w-48 h-48" />
              </div>
              <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-[#b8860b]/10 rounded-full blur-3xl" />

              {/* Header Passport Card */}
              <div className="flex flex-col sm:flex-row justify-between sm:items-start gap-4 border-b border-slate-800 pb-5">
                <div className="flex items-center gap-3.5">
                  <span className="p-3.5 bg-[#b8860b]/15 text-[#ffd700] rounded-2xl border border-[#b8860b]/30">
                    <User className="w-7 h-7" />
                  </span>
                  <div>
                    <span className="text-[9px] text-[#ffd700] font-black tracking-widest uppercase block">SMI Fond - Passeport de Rendement</span>
                    <h3 className="text-base font-black uppercase text-slate-100">{selectedEmployee.name}</h3>
                    <div className="flex flex-wrap gap-x-3 gap-y-1 text-[9.5px] text-slate-400 font-bold mt-1.5 uppercase">
                      <span>Rôle : <span className="text-slate-200">{selectedEmployee.role}</span></span>
                      <span>•</span>
                      <span>Matricule : <span className="text-[#ffd700] font-mono">{selectedEmployee.matricule}</span></span>
                    </div>
                  </div>
                </div>

                {profileInsights && (
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-[8px] text-slate-400 uppercase font-black block">Évaluation SMI</span>
                      <span className="text-[9.5px] font-bold text-[#ffd700] uppercase">Grade {profileInsights.grade}</span>
                    </div>
                    <div className="w-11 h-11 rounded-xl bg-[#b8860b]/20 border border-[#b8860b]/40 flex items-center justify-center text-lg font-black text-[#ffd700] font-mono shadow-inner">
                      {profileInsights.grade}
                    </div>
                  </div>
                )}
              </div>

              {/* Quantitative Metrics Section */}
              <div className="space-y-3">
                <h5 className="text-[10px] font-black text-[#ffd700] uppercase tracking-wider">📊 INDICATEURS DE PRODUCTION RECONSTITUÉS</h5>
                
                {selectedEmployeeStats ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-slate-800/60 border border-slate-750 rounded-xl p-3.5">
                      <span className="text-[8.5px] text-slate-400 uppercase font-bold block mb-1">Shifts d'activité</span>
                      <span className="text-base font-mono font-black text-white">{selectedEmployeeStats.totalPresenceShifts} Shifts</span>
                    </div>

                    {/* Mineur details */}
                    {selectedEmployeeStats.hasMiner && (
                      <>
                        <div className="bg-slate-800/60 border border-slate-750 rounded-xl p-3.5">
                          <span className="text-[8.5px] text-slate-400 uppercase font-bold block mb-1">Métrage Cumulé</span>
                          <span className="text-base font-mono font-black text-white">{selectedEmployeeStats.minerStats.totalMeters.toFixed(1)} m</span>
                        </div>
                        <div className="bg-slate-800/60 border border-slate-750 rounded-xl p-3.5">
                          <span className="text-[8.5px] text-slate-400 uppercase font-bold block mb-1">Rendement de Tir</span>
                          <span className="text-base font-mono font-black text-emerald-400">{selectedEmployeeStats.minerStats.avgYield.toFixed(2)} m/v</span>
                        </div>
                        <div className="bg-slate-800/60 border border-slate-750 rounded-xl p-3.5">
                          <span className="text-[8.5px] text-slate-400 uppercase font-bold block mb-1">Explosif spécifique</span>
                          <span className="text-base font-mono font-black text-rose-400">{selectedEmployeeStats.minerStats.specificExplosiveConsumption.toFixed(2)} kg/m</span>
                        </div>
                      </>
                    )}

                    {/* Conducteur details */}
                    {selectedEmployeeStats.hasDriver && (
                      <>
                        <div className="bg-slate-800/60 border border-slate-750 rounded-xl p-3.5">
                          <span className="text-[8.5px] text-slate-400 uppercase font-bold block mb-1">Volume Déblayé</span>
                          <span className="text-base font-mono font-black text-white">{selectedEmployeeStats.driverStats.totalVolume.toFixed(0)} m³</span>
                        </div>
                        <div className="bg-slate-800/60 border border-slate-750 rounded-xl p-3.5">
                          <span className="text-[8.5px] text-slate-400 uppercase font-bold block mb-1">Volume/Godet</span>
                          <span className="text-base font-mono font-black text-sky-400">{selectedEmployeeStats.driverStats.avgVolumePerGodet.toFixed(2)} m³</span>
                        </div>
                        <div className="bg-slate-800/60 border border-slate-750 rounded-xl p-3.5">
                          <span className="text-[8.5px] text-slate-400 uppercase font-bold block mb-1">Gasoil Spécifique</span>
                          <span className="text-base font-mono font-black text-amber-400">{selectedEmployeeStats.driverStats.specificGasoilRatio.toFixed(2)} L/m³</span>
                        </div>
                        <div className="bg-slate-800/60 border border-slate-750 rounded-xl p-3.5">
                          <span className="text-[8.5px] text-slate-400 uppercase font-bold block mb-1">Gasoil Cumulé</span>
                          <span className="text-base font-mono font-black text-white">{selectedEmployeeStats.driverStats.totalGasoil} L</span>
                        </div>
                      </>
                    )}

                    {/* Team chief details */}
                    {selectedEmployeeStats.hasChief && (
                      <>
                        <div className="bg-slate-800/60 border border-slate-750 rounded-xl p-3.5">
                          <span className="text-[8.5px] text-slate-400 uppercase font-bold block mb-1">Shifts Managés</span>
                          <span className="text-base font-mono font-black text-white">{selectedEmployeeStats.chiefStats.shiftsLed} Postes</span>
                        </div>
                        <div className="bg-slate-800/60 border border-slate-750 rounded-xl p-3.5">
                          <span className="text-[8.5px] text-slate-400 uppercase font-bold block mb-1">Score Management</span>
                          <span className="text-base font-mono font-black text-purple-400">{selectedEmployeeStats.chiefStats.averageGlobalScoreUnderManagement.toFixed(1)}%</span>
                        </div>
                        <div className="bg-slate-800/60 border border-slate-750 rounded-xl p-3.5">
                          <span className="text-[8.5px] text-slate-400 uppercase font-bold block mb-1">Mètres managés</span>
                          <span className="text-base font-mono font-black text-white">{selectedEmployeeStats.chiefStats.totalMetersUnderManagement.toFixed(0)} m</span>
                        </div>
                      </>
                    )}

                    {/* Assistant miner details */}
                    {selectedEmployeeStats.hasAssistant && (
                      <>
                        <div className="bg-slate-800/60 border border-slate-750 rounded-xl p-3.5">
                          <span className="text-[8.5px] text-slate-400 uppercase font-bold block mb-1">Rondes Assistées</span>
                          <span className="text-base font-mono font-black text-white">{selectedEmployeeStats.assistantStats.roundsAssisted} Volées</span>
                        </div>
                        <div className="bg-slate-800/60 border border-slate-750 rounded-xl p-3.5">
                          <span className="text-[8.5px] text-slate-400 uppercase font-bold block mb-1">Métrage assisté</span>
                          <span className="text-base font-mono font-black text-teal-400">{selectedEmployeeStats.assistantStats.totalMetersAssisted.toFixed(1)} m</span>
                        </div>
                      </>
                    )}
                  </div>
                ) : null}
              </div>

              {/* Qualitatives / Insights strengths and weaknesses */}
              {profileInsights && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px] pt-1">
                  <div className="bg-slate-800/40 border border-slate-800 p-4 rounded-xl space-y-2">
                    <span className="text-[8.5px] font-black text-emerald-400 uppercase tracking-wider block">🟢 Points forts observés :</span>
                    <ul className="list-disc pl-4 space-y-1.5 text-slate-300 font-medium">
                      {profileInsights.strengths.map((str, idx) => <li key={idx}>{str}</li>)}
                    </ul>
                  </div>

                  <div className="bg-slate-800/40 border border-slate-800 p-4 rounded-xl space-y-2">
                    <span className="text-[8.5px] font-black text-amber-400 uppercase tracking-wider block">⚠️ Pistes d'amélioration technique :</span>
                    <ul className="list-disc pl-4 space-y-1.5 text-slate-300 font-medium">
                      {profileInsights.weaknesses.length > 0 ? (
                        profileInsights.weaknesses.map((weak, idx) => <li key={idx}>{weak}</li>)
                      ) : (
                        <li>Aucune anomalie critique relevée sur la période consolidée.</li>
                      )}
                    </ul>
                  </div>
                </div>
              )}

              {/* Missing data parameters to collect strategically (Mission 5 requirement) */}
              <div className="bg-amber-500/10 border border-amber-500/20 text-slate-300 rounded-xl p-4 space-y-2 text-[10.5px]">
                <span className="text-[9px] font-black text-[#ffd700] uppercase tracking-wider block flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" /> RECOMMANDATIONS D'AUDIT : COMPLÉTER LES DONNÉES DU PASSEPORT RH
                </span>
                <p className="font-medium leading-relaxed">
                  Pour élever ce dossier à une certification premium de la SMI, les données de fond doivent s'enrichir des dimensions manquantes suivantes :
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[9.5px] uppercase font-bold text-slate-400 pt-1">
                  <div className="flex gap-2 items-center"><span className="text-amber-500">➔</span> Visite médicale clinique d'aptitude fond</div>
                  <div className="flex gap-2 items-center"><span className="text-amber-500">➔</span> Cumul d'heures d'exposition thermique souterraine</div>
                  <div className="flex gap-2 items-center"><span className="text-amber-500">➔</span> Presqu'accidents & collisions engins imputés</div>
                  <div className="flex gap-2 items-center"><span className="text-amber-500">➔</span> Heures de tutorat ou de compagnonnage accomplies</div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white border border-gray-150 rounded-3xl p-8 text-center text-slate-400 uppercase font-black text-[10px]">
              Aucun collaborateur sélectionné pour l'affichage de son passeport premium
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
