import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, onSnapshot, getDoc, doc, writeBatch } from 'firebase/firestore';
import { getNextPost, getUpcomingSaturday, ROTATION_FUNCTIONS } from '../lib/rotation';
import { 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle2, 
  Users, 
  ArrowRight, 
  ArrowLeftRight,
  ShieldAlert,
  CalendarDays,
  Check
} from 'lucide-react';

interface Employee {
  id: string;
  matricule: string;
  nom: string;
  prenom: string;
  fonction: string;
  status: 'actif' | 'inactif';
  sector?: string;
  currentPost?: 'Poste 1' | 'Poste 2' | 'Poste 3' | '';
  rotationGroup?: string;
}

const ROLE_LABELS: Record<string, string> = {
  RESPONSABLE_CHANTIER: 'Responsable de Chantiers',
  SECRETAIRE_CHANTIER: 'Secrétaire de Chantiers',
  MAGASINIER: 'Magasinier',
  CHEF: 'Chef de Poste',
  MINEUR: 'Mineur',
  TREUILLISTE: 'Treuilliste',
  CONDUCTEUR_ENGIN: "Conducteur d'Engins",
  MECANICIEN: 'Mécanicien',
  AIDE_MINEUR: 'Aide Mineur',
  CHAUDRONNIER: 'Chaudronnier',
  ELECTRICIEN: 'Électricien',
  OUVRIER: 'Ouvrier',
  POMPISTE: 'Pompiste'
};

const getRoleLabel = (roleId: string) => ROLE_LABELS[roleId] || roleId;

export const RotationPoste: React.FC = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [validated, setValidated] = useState(false);
  const [validatedData, setValidatedData] = useState<any>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const targetDateStr = getUpcomingSaturday();
  const isTodaySaturday = new Date().getDay() === 6;

  // Real-time synchronization of active Personnel
  useEffect(() => {
    const q = query(collection(db, 'personnel'));
    const unsubscribePersonnel = onSnapshot(q, (snapshot) => {
      const activeList: Employee[] = [];
      snapshot.forEach(doc => {
        const data = doc.data() as Omit<Employee, 'id'>;
        if (data.status === 'actif' && ROTATION_FUNCTIONS.includes(data.fonction)) {
          activeList.push({ id: doc.id, ...data });
        }
      });
      setEmployees(activeList);
      setLoading(false);
    }, (error) => {
      console.error("Erreur de chargement du personnel:", error);
      setLoading(false);
    });

    return () => unsubscribePersonnel();
  }, []);

  // Check if a rotation record already exists for the next Saturday date
  useEffect(() => {
    let active = true;
    const checkValidatedState = async () => {
      try {
        const docRef = doc(db, 'rotations_history', targetDateStr);
        const docSnap = await getDoc(docRef);
        if (active) {
          if (docSnap.exists()) {
            setValidated(true);
            setValidatedData(docSnap.data());
          } else {
            setValidated(false);
            setValidatedData(null);
          }
        }
      } catch (err) {
        console.error("Erreur d'accès à l'historique de rotation:", err);
      }
    };

    checkValidatedState();

    // Recheck checkValidatedState periodically or when success happens
    return () => {
      active = false;
    };
  }, [targetDateStr, successMessage]);

  // Compute calculated rotation changes
  const computedChanges = employees.map(emp => {
    const currentPost = emp.currentPost || '';
    const toPost = getNextPost(currentPost);
    const hasChange = currentPost !== toPost;
    return {
      employee: emp,
      currentPost,
      toPost,
      hasChange
    };
  });

  const activeChanges = computedChanges.filter(c => c.hasChange);
  const totalChangesCount = activeChanges.length;

  // Sorted employees by sector then by fonction
  const sortedComputedChanges = [...computedChanges].sort((a, b) => {
    const sA = a.employee.sector || 'Non assigné';
    const sB = b.employee.sector || 'Non assigné';
    if (sA !== sB) return sA.localeCompare(sB);

    const fA = a.employee.fonction || '';
    const fB = b.employee.fonction || '';
    return fA.localeCompare(fB);
  });

  // Validating the weekly rotation process
  const validateWeeklyRotation = async () => {
    if (validated) {
      alert("La rotation pour cette semaine a déjà été validée.");
      return;
    }

    if (activeChanges.length === 0) {
      alert("Aucun changement de poste n'est à effectuer.");
      return;
    }

    const confirmMsg = `Confirmez-vous la validation de la rotation hebdomadaire automatique pour le samedi ${targetDateStr} ?\n` +
      `Cela va permuter les postes de ${totalChangesCount} employés concernés dans la base de données.`;

    if (!window.confirm(confirmMsg)) {
      return;
    }

    setLoading(true);
    try {
      const batch = writeBatch(db);

      // Create rotation log document
      const rotationRef = doc(db, 'rotations_history', targetDateStr);
      const changesToSave = activeChanges.map(c => ({
        employeeId: c.employee.id,
        matricule: c.employee.matricule,
        name: `${c.employee.nom} ${c.employee.prenom}`,
        fonction: c.employee.fonction,
        sector: c.employee.sector || 'Non assigné',
        fromPost: c.currentPost || 'Poste 1',
        toPost: c.toPost
      }));

      batch.set(rotationRef, {
        date: targetDateStr,
        appliedBy: user?.email || 'Inconnu',
        changes: changesToSave
      });

      // Update personnel docs
      activeChanges.forEach(c => {
        const empRef = doc(db, 'personnel', c.employee.id);
        batch.update(empRef, {
          currentPost: c.toPost
        });
      });

      await batch.commit();

      setSuccessMessage(`La rotation hebdomadaire pour le ${targetDateStr} a été exécutée et enregistrée avec succès !`);
      
      // Auto-clear success banner after 8 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 8000);

    } catch (err) {
      console.error("Erreur de rotation:", err);
      alert("Une erreur est survenue lors de l'enregistrement de la rotation.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 relative pb-12">
      {/* Saturday Notification alert block */}
      {isTodaySaturday && !validated && (
        <div id="saturday-alert-banner" className="bg-[#8B0000] text-white p-4 border-2 border-[#141414] shadow-[4px_4px_0px_0px_#141414] font-black uppercase tracking-wider text-xs flex items-center gap-3 animate-pulse">
          <ShieldAlert className="w-6 h-6 flex-shrink-0 text-white" />
          <div className="flex-1">
            ⚠️ Rotation hebdomadaire à valider aujourd'hui — {totalChangesCount} changements détectés. Cliquez sur 'Valider la rotation' ci-dessous.
          </div>
        </div>
      )}

      {/* Success banner alert */}
      {successMessage && (
        <div className="bg-emerald-600 text-white p-4 border-2 border-[#141414] shadow-[4px_4px_0px_0px_#141414] font-black uppercase tracking-wider text-xs flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 flex-shrink-0 text-white fill-emerald-800" />
          <div className="flex-1">{successMessage}</div>
          <button onClick={() => setSuccessMessage(null)} className="hover:scale-110 active:scale-90 font-black px-2 py-1 bg-black/10">✕</button>
        </div>
      )}

      {/* Header Panel */}
      <div className="bg-white border-2 border-[#141414] shadow-[4px_4px_0px_0px_#141414] p-6 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#00BFFF] to-[#8B0000]" />
        
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <RefreshCw className="w-5 h-5 text-[#00BFFF] animate-spin-slow" />
              <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight text-[#141414]">
                Changement de Poste
              </h1>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 flex items-center gap-1.5">
              <CalendarDays className="w-4.5 h-4.5 text-[#8B0000]" />
              Semaine d'application : <span className="text-[#141414] bg-neutral-100 px-2 py-0.5">Samedi {targetDateStr}</span> (Rotation Automatique)
            </p>
          </div>

          {/* Validation actions zone */}
          <div className="flex items-center">
            {validated ? (
              <div className="flex items-center gap-2 bg-emerald-50 border-2 border-emerald-500 text-emerald-800 px-4 py-2.5 shadow-[2px_2px_0px_0px_#141414] font-black uppercase tracking-wide text-[10px]">
                <Check className="w-4 h-4 text-emerald-600 fill-emerald-200" />
                <span>✅ Rotation déjà validée pour le {targetDateStr}</span>
              </div>
            ) : (
              <button
                onClick={validateWeeklyRotation}
                disabled={loading || totalChangesCount === 0}
                className={`flex items-center gap-2 border-2 border-[#141414] px-4 py-3 shadow-[4px_4px_0px_0px_#141414] text-xs font-black uppercase tracking-widest transition-all cursor-pointer ${
                  loading || totalChangesCount === 0
                    ? 'bg-neutral-200 text-neutral-400 opacity-60 cursor-not-allowed shadow-[2px_2px_0px_0px_#141414] translate-x-0.5 translate-y-0.5'
                    : 'bg-[#00BFFF] text-white hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_#141414] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0px_0px_#141414]'
                }`}
              >
                <ArrowLeftRight className="w-4.5 h-4.5" />
                Valider la rotation hebdomadaire ({totalChangesCount} membres)
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Counters and explanation details bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border-2 border-[#141414] shadow-[4px_4px_0px_0px_#141414] p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-[#00BFFF]/10 border border-[#00BFFF]/30 flex items-center justify-center text-[#00BFFF]">
            <RefreshCw className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[20px] font-black leading-none text-[#141414]">{totalChangesCount}</p>
            <p className="text-[9px] font-black uppercase text-neutral-400 tracking-wider">Changements de poste détectés</p>
          </div>
        </div>

        <div className="bg-white border-2 border-[#141414] shadow-[4px_4px_0px_0px_#141414] p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[20px] font-black leading-none text-[#141414]">
              {employees.filter(e => !e.currentPost).length}
            </p>
            <p className="text-[9px] font-black uppercase text-neutral-400 tracking-wider">Membres non configurés</p>
          </div>
        </div>

        <div className="bg-white border-2 border-[#141414] shadow-[4px_4px_0px_0px_#141414] p-4 flex items-center gap-4">
          <div className="w-12 h-12 bg-[#8B0000]/10 border border-[#8B0000]/30 flex items-center justify-center text-[#8B0000]">
            <CalendarDays className="w-6 h-6" />
          </div>
          <div>
            <p className="text-[14px] font-black uppercase leading-tight text-[#141414]">{targetDateStr}</p>
            <p className="text-[9px] font-black uppercase text-neutral-400 tracking-wider">Date cible d'application</p>
          </div>
        </div>
      </div>

      {/* Main Table for computing the changes */}
      <div className="bg-white border-2 border-[#141414] shadow-[4px_4px_0px_0px_#141414] overflow-hidden">
        <div className="bg-[#141414] px-6 py-3 border-b-2 border-[#141414] flex justify-between items-center text-white">
          <span className="font-black text-xs uppercase tracking-wider">Rapport de Rotation hebdomadaire</span>
          <span className="text-[9px] font-bold text-[#00BFFF] uppercase tracking-wider">{employees.length} membres actifs sous rotation</span>
        </div>

        {loading && employees.length === 0 ? (
          <div className="p-12 text-center text-neutral-450 uppercase font-black text-xs tracking-wider">
            Chargement en cours des équipes actives...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-neutral-100 border-b-2 border-[#141414]">
                  <th className="p-3 text-[10px] font-black uppercase text-[#141414] border-r border-neutral-200">Matricule</th>
                  <th className="p-3 text-[10px] font-black uppercase text-[#141414] border-r border-neutral-200">Nom & Prénom</th>
                  <th className="p-3 text-[10px] font-black uppercase text-[#141414] border-r border-neutral-200">Fonction</th>
                  <th className="p-3 text-[10px] font-black uppercase text-[#141414] border-r border-neutral-200">Secteur</th>
                  <th className="p-3 text-[10px] font-black uppercase text-[#141414] border-r border-neutral-200 text-center">Poste actuel</th>
                  <th className="p-3 text-[10px] font-black uppercase text-[#141414] border-r border-neutral-200 text-center">Poste prochain</th>
                  <th className="p-3 text-[10px] font-black uppercase text-[#141414] text-center">Statut</th>
                </tr>
              </thead>
              <tbody>
                {sortedComputedChanges.length > 0 ? (
                  sortedComputedChanges.map(({ employee, currentPost, toPost, hasChange }) => (
                    <tr 
                      key={employee.id} 
                      className={`border-b border-neutral-200 transition-colors ${
                        hasChange ? 'bg-[#00BFFF]/5 hover:bg-[#00BFFF]/10' : 'hover:bg-neutral-50'
                      }`}
                    >
                      {/* Matricule */}
                      <td className="p-3 font-mono font-bold text-[#8B0000] text-xs border-r border-neutral-200">
                        {employee.matricule}
                      </td>

                      {/* Name */}
                      <td className="p-3 font-black uppercase text-xs text-[#141414] border-r border-neutral-200">
                        {employee.nom} {employee.prenom}
                      </td>

                      {/* Fonction */}
                      <td className="p-3 border-r border-neutral-200">
                        <span className="inline-block px-1.5 py-0.5 bg-neutral-100 text-[9px] font-extrabold text-neutral-600 uppercase">
                          {getRoleLabel(employee.fonction)}
                        </span>
                      </td>

                      {/* Secteur */}
                      <td className="p-3 border-r border-neutral-200 text-xs font-bold text-neutral-600">
                        {employee.sector || <span className="text-neutral-300 italic">Non assigné</span>}
                      </td>

                      {/* Poste Actuel */}
                      <td className="p-3 border-r border-neutral-200 text-center text-xs font-extrabold text-[#141414]">
                        {currentPost ? (
                          <span className="inline-block px-2 py-0.5 bg-neutral-200 text-neutral-800 text-[10px] font-black uppercase">
                            {currentPost}
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 bg-yellow-500/10 text-yellow-700 text-[10px] font-bold uppercase border border-yellow-200">
                            Non défini
                          </span>
                        )}
                      </td>

                      {/* Poste Prochain */}
                      <td className="p-3 border-r border-neutral-200 text-center text-xs font-black">
                        <span className="inline-block px-2 py-0.5 bg-[#00BFFF]/10 text-[#00BFFF] text-[10px] font-black uppercase border border-[#00BFFF]/20">
                          {toPost}
                        </span>
                      </td>

                      {/* Change indication status badge */}
                      <td className="p-3 text-center">
                        {hasChange ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-[#00BFFF]/20 text-[#00BFFF] text-[9px] font-black uppercase">
                            <ArrowRight className="w-3 h-3" />
                            🔄 Changement
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 bg-neutral-200 text-neutral-500 text-[9px] font-extrabold">
                            = Inchangé
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="p-12 text-center text-neutral-400 font-bold uppercase text-xs">
                      Aucun employé actif ne requiert de rotation automatique.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Admin Information guidelines block */}
      <div className="bg-neutral-100 border-2 border-[#141414] p-5 shadow-[4px_4px_0px_0px_#141414] text-[11px] leading-relaxed text-[#141414]/75">
        <h3 className="font-black uppercase text-[#141414] mb-2 text-xs flex items-center gap-1.5">
          <AlertTriangle className="w-4 h-4 text-[#8B0000]" />
          Instructions de Commandement Technique
        </h3>
        <p className="mb-1.5">
          1. La rotation est basée sur un cycle infini régulier : <strong>Poste 1 → Poste 2 → Poste 3 → Poste 1</strong>.
        </p>
        <p className="mb-1.5">
          2. Elle s'applique automatiquement à tous les collaborateurs actifs ayant pour rôles de production : <strong>Chef de Poste (CHEF)</strong>, <strong>Mineurs (MINEUR)</strong>, <strong>Aide Mineurs (AIDE_MINEUR)</strong>, <strong>Conducteurs d'Engins (CONDUCTEUR_ENGIN)</strong>, <strong>Treuillistes (TREUILLISTE)</strong>, et <strong>Ouvriers (OUVRIER)</strong>.
        </p>
        <p className="mb-1.5">
          3. Pour des raisons techniques de sécurité des infrastructures de surface, les fonctions de <strong>Mécanicien</strong>, <strong>Chaudronnier</strong>, et <strong>Électricien</strong> ne sont pas programmées pour de la rotation de poste automatique.
        </p>
        <p>
          4. La validation finale de la rotation hebdomadaire est irréversible, consigne l'exécution dans Firestore <strong>rotations_history</strong> et met à jour instantanément les fiches actives du personnel.
        </p>
      </div>
    </div>
  );
};
