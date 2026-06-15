import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, Check, MapPin, User, ChevronDown } from 'lucide-react';

interface MatriculeAutocompleteProps {
  value: string;            // matricule actuel
  onChange: (matricule: string, employee: any | null) => void;
  employees: any[];         // liste personnel
  sector?: string;          // secteur attendu (ex: "Imiter 2")
  fonctions?: string[];     // fonctions attendues (ex: ["CHEF"])
  alternativeFonctions?: string[]; // alternative roles allowed to avoid blockages
  post?: 'Poste 1' | 'Poste 2' | 'Poste 3'; // poste attendu
  placeholder?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export const MatriculeAutocomplete: React.FC<MatriculeAutocompleteProps> = ({
  value,
  onChange,
  employees,
  sector,
  fonctions,
  alternativeFonctions,
  post,
  placeholder = "Saisir r...",
  onKeyDown
}) => {
  const [typed, setTyped] = useState(value || '');
  const [isOpen, setIsOpen] = useState(false);
  const [direction, setDirection] = useState<'up' | 'down'>('down');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTyped(value || '');
  }, [value]);

  // Adjust direction dynamically depending on proximity to bottom
  useEffect(() => {
    if (!isOpen) return;

    const updateDirection = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        
        // Also check parent scroll container bottom if applicable
        const parentScroll = containerRef.current.closest('.overflow-x-auto');
        let parentSpaceBelow = 999;
        if (parentScroll) {
          const parentRect = parentScroll.getBoundingClientRect();
          parentSpaceBelow = parentRect.bottom - rect.bottom;
        }

        // If less than 220px below in either viewport or parent scroll, flip upward to prevent clipping:
        if (spaceBelow < 220 || parentSpaceBelow < 220) {
          setDirection('up');
        } else {
          setDirection('down');
        }
      }
    };

    updateDirection();

    // Listen to scroll events on window & any parent scrollable elements
    window.addEventListener('scroll', updateDirection, true);
    window.addEventListener('resize', updateDirection);

    return () => {
      window.removeEventListener('scroll', updateDirection, true);
      window.removeEventListener('resize', updateDirection);
    };
  }, [isOpen]);

  // Handle outside clicks
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        // If they click on the scrollbar track of the parent scrollable container,
        // let's avoid closing the dropdown immediately, which gives a horrible UX.
        const target = e.target as HTMLElement;
        if (target && target.closest('.overflow-x-auto')) {
          if (target.classList.contains('overflow-x-auto') || (target.tagName === 'DIV' && target.scrollWidth > target.clientWidth)) {
            // It's a scrollbar click, don't close!
            return;
          }
        }
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  // Check exact employee match
  const exactEmp = employees.find(
    e => (e.matricule || '').toUpperCase().trim() === typed.toUpperCase().trim()
  );

  const query = typed.trim().toLowerCase();

  // Helper function to check if candidate matches query text
  const matchesText = (emp: any) => {
    if (!query) return true;
    const m = (emp.matricule || '').toLowerCase();
    const nomcomplet = `${emp.nom || ''} ${emp.prenom || ''}`.toLowerCase();
    const prenomnom = `${emp.prenom || ''} ${emp.nom || ''}`.toLowerCase();
    return m.includes(query) || nomcomplet.includes(query) || prenomnom.includes(query);
  };

  // Helper checks for levels of filters
  const matchesFunction = (emp: any) => !fonctions || fonctions.includes(emp.fonction);
  const matchesAlternativeFunction = (emp: any) => !!alternativeFonctions && alternativeFonctions.includes(emp.fonction);
  const matchesAllowedFonctions = (emp: any) => {
    if (!fonctions && !alternativeFonctions) return true;
    return (fonctions?.includes(emp.fonction) || alternativeFonctions?.includes(emp.fonction));
  };
  const matchesSector = (emp: any) => !sector || emp.sector === sector;
  const matchesPost = (emp: any) => !post || emp.currentPost === post;
  const isActive = (emp: any) => emp.status === 'actif';

  // Sort and partition logic
  // 1. Group A (Primary): active, matches function, matches sector, matches post
  const groupA = employees.filter(emp => 
    isActive(emp) && matchesFunction(emp) && matchesSector(emp) && matchesPost(emp) && matchesText(emp)
  );

  // 2. Group B: other posts (active, function, sector, but not post)
  const groupB = employees.filter(emp => 
    isActive(emp) && matchesFunction(emp) && matchesSector(emp) && !matchesPost(emp) && matchesText(emp)
  );

  // 3. Group C: other sectors & posts (active, function, but not sector)
  const groupC = employees.filter(emp => 
    isActive(emp) && matchesFunction(emp) && !matchesSector(emp) && matchesText(emp)
  );

  // 3b. Group Alt: alternative roles (active, matches alternative function)
  const groupAlt = employees.filter(emp =>
    isActive(emp) && matchesAlternativeFunction(emp) && matchesText(emp)
  );

  // 4. Group D: other registered workers that match our text query and are inside allowed functions (but not in A, B, C, Alt)
  const groupD = query ? employees.filter(emp => 
    isActive(emp) &&
    matchesText(emp) && 
    matchesAllowedFonctions(emp) &&
    !groupA.some(x => x.id === emp.id) &&
    !groupB.some(x => x.id === emp.id) &&
    !groupC.some(x => x.id === emp.id) &&
    !groupAlt.some(x => x.id === emp.id)
  ) : [];

  // Determine if typed matricule is invalid/absent or inactive
  const hasTypedSomething = typed.trim().length > 0;
  const isInvalid = hasTypedSomething && (!exactEmp || exactEmp.status !== 'actif');
  const isValidAndActive = hasTypedSomething && exactEmp && exactEmp.status === 'actif';

  // Selection handler
  const handleSelect = (emp: any) => {
    setTyped(emp.matricule);
    onChange(emp.matricule, emp);
    setIsOpen(false);
  };

  // Build combined suggestions tree for the dropdown
  // We limit the total suggestions rendered to keep dropdown quick
  const hasPrimarySuggestions = groupA.length > 0;
  const hasOtherRolesGlobal = groupB.length > 0 || groupC.length > 0;
  const hasAlternativeSuggestions = groupAlt.length > 0;
  const hasSecondarySuggestions = hasOtherRolesGlobal || groupD.length > 0 || hasAlternativeSuggestions;

  return (
    <div ref={containerRef} className="relative w-full min-w-[140px]">
      <div 
        className={`flex items-center transition-all bg-white px-2 py-1 border shadow-sm ${
          isInvalid 
            ? 'border-red-400 bg-red-50/50 focus-within:border-red-500 focus-within:ring-1 focus-within:ring-red-200' 
            : isValidAndActive
              ? 'border-emerald-400 focus-within:border-emerald-500 focus-within:ring-1 focus-within:ring-emerald-105'
              : 'border-slate-300 focus-within:border-[#8B0000] focus-within:ring-1 focus-within:ring-[#8B0000]/15'
        }`}
      >
        <input
          type="text"
          placeholder={placeholder}
          value={typed}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && suggestionsList().length > 0 && isOpen) {
              e.preventDefault();
              handleSelect(suggestionsList()[0]);
            }
            if (onKeyDown) onKeyDown(e);
          }}
          onChange={(e) => {
            const val = e.target.value;
            setTyped(val);
            setIsOpen(true);

            const matched = employees.find(
              emp => (emp.matricule || '').toUpperCase().trim() === val.toUpperCase().trim()
            );
            if (matched) {
              onChange(matched.matricule, matched);
            } else {
              onChange(val, null);
            }
          }}
          onFocus={() => setIsOpen(true)}
          className="w-full font-mono text-[11px] font-bold text-slate-800 bg-transparent outline-none uppercase placeholder-slate-400 py-0.5"
        />

        {/* Status Indicator Icon */}
        <div className="shrink-0 ml-1 flex items-center gap-1">
          {isInvalid && (
            <AlertCircle className="w-3.5 h-3.5 text-red-500 animate-pulse" title="Absent de l'effectif actif" />
          )}
          {isValidAndActive && (
            <Check className="w-3.5 h-3.5 text-emerald-500" title="Matricule validé actif" />
          )}
          <ChevronDown className="w-3 h-3 text-slate-400" />
        </div>
      </div>

      {isInvalid && (
        <span className="text-[8.5px] text-red-600 font-extrabold tracking-tight mt-0.5 block pl-0.5">
          ⚠️ Matricule non reconnu ou inactif
        </span>
      )}

      {isOpen && (hasPrimarySuggestions || hasSecondarySuggestions) && (
        <div className={`absolute left-0 right-0 max-h-60 overflow-y-auto bg-white border-2 border-slate-900 shadow-[4px_4px_0px_0px_rgba(20,20,20,1)] z-[999] divide-y divide-slate-150 ${direction === 'up' ? 'bottom-full mb-1.5' : 'top-full mt-1'}`}>
          
          {/* PRIMARY SUGGESTIONS SECTION */}
          {hasPrimarySuggestions && (
            <div>
              <div className="bg-slate-50 px-2 py-1 text-[8.5px] font-black text-slate-500 uppercase tracking-wider border-b border-slate-100 flex justify-between items-center">
                <span>Suggestions prioritaires</span>
                {sector && <span className="text-slate-400 text-[8px]">Secteur: {sector}</span>}
              </div>
              {groupA.slice(0, 8).map((emp) => (
                <button
                  key={`prim-${emp.id}`}
                  type="button"
                  onClick={() => handleSelect(emp)}
                  className="w-full text-left px-2.5 py-1.5 hover:bg-emerald-50 transition-colors flex items-center justify-between text-[11px] group"
                >
                  <div className="truncate pr-2">
                    <div className="font-bold text-slate-900 uppercase truncate flex items-center gap-1.5">
                      <User className="w-3 h-3 text-emerald-600 shrink-0" />
                      {emp.nom} {emp.prenom}
                    </div>
                    <div className="text-[9px] text-slate-550 font-medium">
                      {emp.fonction} • {emp.sector} • <span className="text-emerald-700 font-bold">{emp.currentPost}</span>
                    </div>
                  </div>
                  <span className="font-mono text-[10px] font-black bg-slate-100 group-hover:bg-emerald-100 text-slate-600 group-hover:text-emerald-800 px-1.5 py-0.5 rounded shrink-0">
                    {emp.matricule}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* OTHER PRIMARY ROLE EMPLOYEES (Global search before alternative functions) */}
          {hasOtherRolesGlobal && (
            <div>
              <div className="bg-slate-100/90 px-2 py-1 text-[8.5px] font-black text-slate-600 uppercase tracking-wider border-b border-slate-150">
                <span>Autres {fonctions ? fonctions.join('/') : 'profils'} (Recherche globale)</span>
              </div>
              {[...groupB, ...groupC].slice(0, 10).map((emp) => (
                <button
                  key={`other-prim-${emp.id}`}
                  type="button"
                  onClick={() => handleSelect(emp)}
                  className="w-full text-left px-2.5 py-1.5 hover:bg-slate-100 transition-colors flex items-center justify-between text-[11px] group"
                >
                  <div className="truncate pr-2 opacity-90 group-hover:opacity-100">
                    <div className="font-bold text-slate-750 group-hover:text-slate-900 uppercase truncate">
                      {emp.nom} {emp.prenom} {emp.status !== 'actif' && ' (INACTIF)'}
                    </div>
                    <div className="text-[9px] text-slate-500 font-medium">
                      {emp.fonction} • {emp.sector || 'Sans Secteur'} • <span className="text-slate-500">{emp.currentPost || 'Pas de poste'}</span>
                    </div>
                  </div>
                  <span className="font-mono text-[9.5px] font-black bg-slate-50 group-hover:bg-slate-200 text-slate-550 px-1.5 py-0.5 rounded shrink-0">
                    {emp.matricule}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* ALTERNATIVE SUGGESTIONS SECTION (Lower priority) */}
          {hasAlternativeSuggestions && (
            <div>
              <div className="bg-amber-50 px-2 py-1 text-[8.5px] font-black text-amber-800 uppercase tracking-wider border-b border-amber-100 flex justify-between items-center">
                <span>Alternatives acceptées ({alternativeFonctions ? alternativeFonctions.join('/') : 'Aide-Mineur'})</span>
              </div>
              {groupAlt.slice(0, 6).map((emp) => (
                <button
                  key={`alt-${emp.id}`}
                  type="button"
                  onClick={() => handleSelect(emp)}
                  className="w-full text-left px-2.5 py-1.5 hover:bg-amber-50/50 transition-colors flex items-center justify-between text-[11px] group"
                >
                  <div className="truncate pr-2">
                    <div className="font-bold text-amber-900 uppercase truncate flex items-center gap-1.5">
                      <User className="w-3 h-3 text-amber-650 shrink-0" />
                      {emp.nom} {emp.prenom}
                    </div>
                    <div className="text-[9px] text-amber-700/80 font-medium">
                      {emp.fonction} • {emp.sector || 'SMI'} • <span className="text-slate-500">{emp.currentPost || 'Libre'}</span>
                    </div>
                  </div>
                  <span className="font-mono text-[9.5px] font-black bg-amber-100 group-hover:bg-amber-250 text-amber-900 px-1.5 py-0.5 rounded shrink-0">
                    {emp.matricule}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* OTHER DEVIANT/REGISTERED SUPPORT WORKERS */}
          {groupD.length > 0 && (
            <div>
              <div className="bg-slate-50 px-2 py-1 text-[8.5px] font-black text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <span>Autres profils d'appui enregistrés</span>
              </div>
              {groupD.slice(0, 10).map((emp) => (
                <button
                  key={`sec-${emp.id}`}
                  type="button"
                  onClick={() => handleSelect(emp)}
                  className="w-full text-left px-2.5 py-1.5 hover:bg-slate-50 transition-colors flex items-center justify-between text-[11px] group"
                >
                  <div className="truncate pr-2 opacity-75 group-hover:opacity-100">
                    <div className="font-bold text-slate-600 group-hover:text-slate-800 uppercase truncate">
                      {emp.nom} {emp.prenom}
                    </div>
                    <div className="text-[9px] text-slate-400 font-medium">
                      {emp.fonction}
                    </div>
                  </div>
                  <span className="font-mono text-[9.5px] font-black bg-slate-50 group-hover:bg-slate-200 text-slate-550 px-1.5 py-0.5 rounded shrink-0">
                    {emp.matricule}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );

  // Flattened helpful array for enter-to-select support
  function suggestionsList() {
    return [...groupA, ...groupB, ...groupC, ...groupAlt, ...groupD];
  }
};
