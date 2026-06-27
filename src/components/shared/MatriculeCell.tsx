import React from 'react';
import { MatriculeAutocomplete } from '../MatriculeAutocomplete';

export interface Employee {
  id: string;
  matricule: string;
  nom: string;
  prenom: string;
  fonction: string;
  status: string;
  sector?: string;
  currentPost?: string;
}

interface MatriculeCellProps {
  value: string;
  onChange: (matricule: string, employee?: Employee | null) => void;
  employees: Employee[];
  sector?: string;
  fonctions?: string[];
  alternativeFonctions?: string[];
  post?: 'Poste 1' | 'Poste 2' | 'Poste 3';
  placeholder?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  disabled?: boolean;
}

export const MatriculeCell: React.FC<MatriculeCellProps> = ({
  value,
  onChange,
  employees,
  sector,
  fonctions,
  alternativeFonctions,
  post,
  placeholder = "Saisir...",
  onKeyDown,
  disabled = false,
}) => {
  return (
    <MatriculeAutocomplete
      value={value}
      onChange={onChange}
      employees={employees}
      sector={sector}
      fonctions={fonctions}
      alternativeFonctions={alternativeFonctions}
      post={post}
      placeholder={placeholder}
      onKeyDown={onKeyDown}
      disabled={disabled}
    />
  );
};
