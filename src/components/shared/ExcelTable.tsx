import React, { ReactNode } from 'react';

interface ExcelTableColumn<T> {
  key: keyof T;
  label: string;
  width?: string;
  editable?: boolean;
  render?: (value: any, row: T, rowIndex: number) => ReactNode;
}

interface ExcelTableProps<T> {
  columns: ExcelTableColumn<T>[];
  data: T[];
  onCellChange: (rowIndex: number, field: keyof T, value: any) => void;
  onKeyDown: (e: React.KeyboardEvent, row: number, col: number) => void;
  focusedCell: { row: number; col: number } | null;
  rowClassName?: (row: T, index: number) => string;
}

export function ExcelTable<T>({
  columns,
  data,
  onCellChange,
  onKeyDown,
  focusedCell,
  rowClassName,
}: ExcelTableProps<T>) {
  return (
    <div className="overflow-x-auto border border-slate-200 rounded-xl bg-white shadow-sm">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50 border-b border-slate-200">
            {columns.map((col, idx) => (
              <th
                key={idx}
                className="p-3 text-xs font-semibold text-slate-500 uppercase tracking-wider text-center"
                style={{ width: col.width }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {data.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              className={`hover:bg-slate-50/50 transition-colors ${
                rowClassName ? rowClassName(row, rowIndex) : ''
              }`}
            >
              {columns.map((col, colIndex) => {
                const isFocused =
                  focusedCell?.row === rowIndex && focusedCell?.col === colIndex;
                const value = row[col.key];

                return (
                  <td
                    key={colIndex}
                    className={`p-1.5 align-middle border-r border-slate-100 last:border-r-0 ${
                      isFocused ? 'ring-2 ring-blue-500 ring-inset bg-blue-50/20' : ''
                    }`}
                  >
                    {col.render ? (
                      col.render(value, row, rowIndex)
                    ) : col.editable ? (
                      <input
                        type="text"
                        value={value === undefined || value === null ? '' : String(value)}
                        onChange={(e) => onCellChange(rowIndex, col.key, e.target.value)}
                        onKeyDown={(e) => onKeyDown(e, rowIndex, colIndex)}
                        className="w-full p-1.5 text-sm bg-transparent border-0 focus:ring-0 focus:outline-none text-slate-800 text-center"
                      />
                    ) : (
                      <div className="w-full p-1.5 text-sm text-slate-650 text-center select-none">
                        {value === undefined || value === null ? '' : String(value)}
                      </div>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
