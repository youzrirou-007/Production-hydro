import React from 'react';
import { ExcelRow } from '../../lib/productionUtils';
import { ExcelMaintenance } from '../../types/mining';
import { MaintenanceShiftPanel } from './MaintenanceShiftPanel';

interface ProductionMaintenanceTableProps {
  p1MaintenanceRows: ExcelRow<ExcelMaintenance>[];
  p2MaintenanceRows: ExcelRow<ExcelMaintenance>[];
  p3MaintenanceRows: ExcelRow<ExcelMaintenance>[];
  activeEmployees: any[];
  platformSettings: any;
  structureEditMode: boolean;
  getEmployeeName: (matricule: string) => string;
  addMaintenanceRow: (post: string) => void;
  deleteMaintenanceRow: (post: string, idx: number) => void;
  updateMaintenanceCell: (post: string, idx: number, key: keyof ExcelMaintenance, value: any) => void;
}

export const ProductionMaintenanceTable: React.FC<ProductionMaintenanceTableProps> = ({
  p1MaintenanceRows,
  p2MaintenanceRows,
  p3MaintenanceRows,
  activeEmployees,
  platformSettings,
  structureEditMode,
  getEmployeeName,
  addMaintenanceRow,
  deleteMaintenanceRow,
  updateMaintenanceCell
}) => {
  const shiftsList = [
    { id: 'Poste 1', rows: p1MaintenanceRows },
    { id: 'Poste 2', rows: p2MaintenanceRows },
    { id: 'Poste 3', rows: p3MaintenanceRows },
  ];

  return (
    <div className="space-y-6">
      {shiftsList.map(s => (
        <MaintenanceShiftPanel
          key={s.id}
          shiftName={s.id}
          maintenanceRows={s.rows}
          activeEmployees={activeEmployees}
          platformSettings={platformSettings}
          structureEditMode={structureEditMode}
          getEmployeeName={getEmployeeName}
          addMaintenanceRow={addMaintenanceRow}
          deleteMaintenanceRow={deleteMaintenanceRow}
          updateMaintenanceCell={updateMaintenanceCell}
        />
      ))}
    </div>
  );
};
