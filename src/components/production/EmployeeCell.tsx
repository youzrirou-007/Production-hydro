import React from 'react';

interface EmployeeCellProps {
  matricule: string;
  name?: string;
  onChange: (mat: string, resolvedName: string) => void;
  employees: any[];
  placeholder?: string;
  hideNameLabel?: boolean;
  onKeyDown?: React.KeyboardEventHandler<HTMLInputElement>;
}

export const EmployeeCell: React.FC<EmployeeCellProps> = ({ 
  matricule, name, onChange, employees, placeholder = "Matricule...", hideNameLabel = false, onKeyDown 
}) => {
  const [typed, setTyped] = React.useState(matricule || '');
  const [isOpen, setIsOpen] = React.useState(false);

  React.useEffect(() => {
    setTyped(matricule || '');
  }, [matricule]);

  const exactEmp = employees.find(
    e => (e.matricule || '').toUpperCase().trim() === typed.toUpperCase().trim()
  );

  const query = typed.trim().toLowerCase();

  const suggestions = query && !exactEmp ? employees.filter(emp => {
    const m = (emp.matricule || '').toLowerCase();
    const fullName = `${emp.nom || ''} ${emp.prenom || ''}`.toLowerCase();
    const reverseFullName = `${emp.prenom || ''} ${emp.nom || ''}`.toLowerCase();
    return m.includes(query) || fullName.includes(query) || reverseFullName.includes(query);
  }) : [];

  const isInvalid = typed.trim().length > 0 && !exactEmp && suggestions.length === 0;

  return (
    <div className="relative w-full min-w-[130px]">
      <div className={`flex items-center transition-all bg-white px-1 py-0.5 border rounded ${isInvalid ? 'border-red-500 bg-red-50/70 border-2' : 'border-slate-200 focus-within:border-sky-400 focus-within:ring-1 focus-within:ring-sky-400'}`}>
        <input
          type="text"
          placeholder={placeholder}
          value={typed}
          onKeyDown={onKeyDown}
          onChange={(e) => {
            const val = e.target.value;
            setTyped(val);
            setIsOpen(true);
            
            const matched = employees.find(emp => (emp.matricule || '').toUpperCase().trim() === val.toUpperCase().trim());
            if (matched) {
              onChange(matched.matricule, `${matched.nom} ${matched.prenom}`);
            } else {
              onChange(val, 'Inconnu');
            }
          }}
          onFocus={() => setIsOpen(true)}
          onBlur={() => {
            setTimeout(() => {
              setIsOpen(false);
            }, 250);
          }}
          className="w-full font-mono text-[10px] font-bold text-slate-800 bg-transparent py-0.5 px-1 outline-none uppercase placeholder-slate-400"
        />
        {exactEmp && !hideNameLabel && (
          <span className="text-[8px] font-black bg-slate-100 text-slate-500 px-1 py-0.2 rounded shrink-0 uppercase tracking-tight">
            {exactEmp.fonction}
          </span>
        )}
      </div>

      {isInvalid && (
        <div className="absolute left-0 right-0 top-full mt-1 bg-red-600 text-white font-black text-[8px] uppercase px-1.5 py-1 rounded shadow-lg z-50 animate-bounce border border-red-700 leading-tight select-none">
          ⚠️ ABSENT DE L'EFFECTIF HYDROMINES SMI
        </div>
      )}

      {isOpen && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 mt-1 max-h-36 overflow-y-auto bg-white border border-slate-200 shadow-xl rounded z-50 divide-y divide-slate-100">
          {suggestions.slice(0, 10).map((emp) => {
            const empName = `${emp.nom} ${emp.prenom}`;
            return (
              <button
                key={emp.id || emp.matricule}
                type="button"
                onMouseDown={() => {
                  setTyped(emp.matricule);
                  onChange(emp.matricule, empName);
                  setIsOpen(false);
                }}
                className="w-full text-left px-2 py-1 hover:bg-sky-50 transition-colors flex items-center justify-between text-[10px] cursor-pointer"
              >
                <div className="font-bold flex flex-col truncate pr-1">
                  <span className="text-slate-800 uppercase truncate">{empName}</span>
                  <span className="text-[8px] text-slate-400 uppercase tracking-wider">{emp.fonction}</span>
                </div>
                <span className="font-mono text-[9px] font-black bg-slate-100 px-1 rounded text-slate-500 shrink-0">
                  {emp.matricule}
                </span>
              </button>
            );
          })}
        </div>
      )}

      {exactEmp && !hideNameLabel && (
        <div className="text-[8px] text-emerald-800 bg-emerald-50 border border-emerald-100 font-extrabold mt-0.5 truncate px-1 py-0.2 rounded flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 inline-block"></span>
          <span className="truncate">{exactEmp.nom} {exactEmp.prenom}</span>
        </div>
      )}
    </div>
  );
};

export const timeOptions = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2);
  const m = (i % 2) * 30;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
});

export const renderTimeSelect = (value: string, onChange: (val: string) => void) => {
  const options = [...timeOptions];
  if (value && !options.includes(value)) {
    options.push(value);
    options.sort();
  }
  return (
    <select
      value={value || ''}
      onChange={e => onChange(e.target.value)}
      className="w-full font-mono text-center border border-slate-200 p-1 text-[11px] rounded-none outline-none font-bold text-slate-700 bg-white cursor-pointer hover:border-slate-300 focus:border-[#8B0000]"
    >
      <option value="">--:--</option>
      {options.map(t => (
        <option key={t} value={t}>{t}</option>
      ))}
    </select>
  );
};

export const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLSelectElement>) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    const cardElement = e.currentTarget.closest('[data-card-container]');
    if (cardElement) {
      const focusables = Array.from(cardElement.querySelectorAll('input, select, button')) as HTMLElement[];
      const currentIndex = focusables.indexOf(e.currentTarget);
      if (currentIndex !== -1 && currentIndex < focusables.length - 1) {
        let nextIndex = currentIndex + 1;
        while (nextIndex < focusables.length) {
          const nextEl = focusables[nextIndex];
          if ((nextEl.tagName === 'INPUT' || nextEl.tagName === 'SELECT') && 
              !(nextEl as any).disabled && !(nextEl as any).readOnly) {
            nextEl.focus();
            if (nextEl.tagName === 'INPUT') {
              (nextEl as HTMLInputElement).select?.();
            }
            break;
          }
          nextIndex++;
        }
      }
    }
  }
};
