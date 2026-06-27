import React from 'react';

interface TimeRangeCellProps {
  startTime: string;
  endTime: string;
  onStartChange: (time: string) => void;
  onEndChange: (time: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export const TimeRangeCell: React.FC<TimeRangeCellProps> = ({
  startTime,
  endTime,
  onStartChange,
  onEndChange,
  onKeyDown,
}) => {
  return (
    <div className="flex items-center justify-center gap-1">
      <input
        type="time"
        value={startTime || ''}
        onChange={(e) => onStartChange(e.target.value)}
        onKeyDown={onKeyDown}
        className="text-xs font-mono font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      <span className="text-slate-400 text-[10px] font-bold">→</span>
      <input
        type="time"
        value={endTime || ''}
        onChange={(e) => onEndChange(e.target.value)}
        onKeyDown={onKeyDown}
        className="text-xs font-mono font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded px-1.5 py-1 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
    </div>
  );
};
