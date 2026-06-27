import React, { useState, useCallback } from 'react';
import { PosteName, ActivityName } from '../types/mining';

export function usePosteActivity<T>(
  initialData: Record<PosteName, Record<ActivityName, T[]>>,
  options?: {
    onAddRow?: (poste: PosteName, activity: ActivityName) => T;
    onRemoveRow?: (poste: PosteName, activity: ActivityName, index: number) => boolean;
  }
) {
  const [activePoste, setActivePoste] = useState<PosteName>('poste1');
  const [activeActivity, setActiveActivity] = useState<ActivityName>('minage');
  const [data, setData] = useState(initialData);
  const [focusedCell, setFocusedCell] = useState<{ row: number; col: number } | null>(null);
  
  // Keyboard navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent, row: number, col: number, maxCol: number) => {
    switch(e.key) {
      case 'ArrowDown': 
        e.preventDefault(); 
        setFocusedCell({ row: row + 1, col }); 
        break;
      case 'ArrowUp': 
        e.preventDefault(); 
        setFocusedCell({ row: Math.max(0, row - 1), col }); 
        break;
      case 'ArrowRight': 
        e.preventDefault(); 
        setFocusedCell({ row, col: Math.min(maxCol, col + 1) }); 
        break;
      case 'ArrowLeft': 
        e.preventDefault(); 
        setFocusedCell({ row, col: Math.max(0, col - 1) }); 
        break;
      case 'Tab': 
        e.preventDefault(); 
        setFocusedCell({ row, col: col + 1 >= maxCol ? 0 : col + 1 }); 
        break;
      case 'Enter': 
        e.preventDefault(); 
        setFocusedCell({ row: row + 1, col }); 
        break;
    }
  }, []);
  
  const addRow = (poste: PosteName, activity: ActivityName, defaultRow: T) => {
    setData(prev => ({
      ...prev,
      [poste]: {
        ...prev[poste],
        [activity]: [...prev[poste][activity], defaultRow]
      }
    }));
  };
  
  const removeRow = (poste: PosteName, activity: ActivityName, index: number) => {
    if (options?.onRemoveRow) {
      const allowed = options.onRemoveRow(poste, activity, index);
      if (!allowed) return;
    }
    setData(prev => ({
      ...prev,
      [poste]: {
        ...prev[poste],
        [activity]: prev[poste][activity].filter((_, i) => i !== index)
      }
    }));
  };
  
  const updateCell = (poste: PosteName, activity: ActivityName, rowIndex: number, field: keyof T, value: any) => {
    setData(prev => ({
      ...prev,
      [poste]: {
        ...prev[poste],
        [activity]: prev[poste][activity].map((row, i) => 
          i === rowIndex ? { ...row, [field]: value } : row
        )
      }
    }));
  };
  
  return {
    activePoste, setActivePoste,
    activeActivity, setActiveActivity,
    data, setData,
    focusedCell, setFocusedCell,
    handleKeyDown,
    addRow, removeRow, updateCell
  };
}
