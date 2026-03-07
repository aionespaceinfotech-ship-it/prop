
import React from 'react';

interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  className?: string;
}

interface ResponsiveTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string | number;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  isLoading?: boolean;
  rowClassName?: string;
}

export function ResponsiveTable<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  emptyMessage = 'No data found',
  isLoading = false,
  rowClassName = '',
}: ResponsiveTableProps<T>) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-slate-100 animate-pulse rounded-lg w-full" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-slate-500 font-medium">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Desktop Table View */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-slate-200">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {columns.map((col, idx) => (
                <th 
                  key={idx} 
                  className={`px-5 py-3.5 text-[11px] font-bold text-slate-500 uppercase tracking-wider ${col.className || ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {data.map((item) => (
              <tr 
                key={keyExtractor(item)}
                onClick={() => onRowClick?.(item)}
                className={`
                  hover:bg-slate-50 transition-colors
                  ${onRowClick ? 'cursor-pointer' : ''}
                  ${rowClassName}
                `}
              >
                {columns.map((col, idx) => (
                  <td key={idx} className={`px-5 py-4 text-sm text-slate-700 ${col.className || ''}`}>
                    {typeof col.accessor === 'function' 
                      ? col.accessor(item) 
                      : (item[col.accessor] as React.ReactNode)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="md:hidden space-y-4">
        {data.map((item) => (
          <div 
            key={keyExtractor(item)}
            onClick={() => onRowClick?.(item)}
            className={`
              bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3
              ${onRowClick ? 'active:bg-slate-50' : ''}
            `}
          >
            {columns.map((col, idx) => (
              <div key={idx} className="flex justify-between items-start gap-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider shrink-0 mt-1">
                  {col.header}
                </span>
                <div className={`text-sm text-slate-700 text-right ${col.className || ''}`}>
                  {typeof col.accessor === 'function' 
                    ? col.accessor(item) 
                    : (item[col.accessor] as React.ReactNode)}
                </div>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
