
import React from 'react';

interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => React.ReactNode);
  className?: string;
  headerClassName?: string;
  hideOnMobile?: boolean;
}

interface ResponsiveTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (item: T) => string | number;
  onRowClick?: (item: T) => void;
  selectedIds?: (string | number)[];
  onSelectionChange?: (ids: (string | number)[]) => void;
  emptyMessage?: string;
  isLoading?: boolean;
  rowClassName?: string;
  tableWrapperClassName?: string;
  tableClassName?: string;
  mobileContainerClassName?: string;
  desktopBreakpoint?: 'md' | 'lg';
  headerCellClassName?: string;
  bodyCellClassName?: string;
}

export function ResponsiveTable<T>({
  columns,
  data,
  keyExtractor,
  onRowClick,
  selectedIds = [],
  onSelectionChange,
  emptyMessage = 'No data found',
  isLoading = false,
  rowClassName = '',
  tableWrapperClassName = '',
  tableClassName = '',
  mobileContainerClassName = '',
  desktopBreakpoint = 'md',
  headerCellClassName = '',
  bodyCellClassName = '',
}: ResponsiveTableProps<T>) {
  const handleSelectAll = (checked: boolean) => {
    if (!onSelectionChange) return;
    if (checked) {
      onSelectionChange(data.map(item => keyExtractor(item)));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectRow = (e: React.MouseEvent, id: string | number) => {
    e.stopPropagation();
    if (!onSelectionChange) return;
    if (selectedIds.includes(id)) {
      onSelectionChange(selectedIds.filter(i => i !== id));
    } else {
      onSelectionChange([...selectedIds, id]);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-slate-50 animate-pulse rounded-2xl w-full border border-slate-100" />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="py-20 text-center flex flex-col items-center justify-center">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4 text-slate-200">
          <MoreHorizontal size={32} />
        </div>
        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">{emptyMessage}</p>
      </div>
    );
  }

  const desktopViewClassName = desktopBreakpoint === 'lg'
    ? 'hidden lg:block overflow-x-auto'
    : 'hidden md:block overflow-x-auto';
  const mobileViewClassName = desktopBreakpoint === 'lg'
    ? 'lg:hidden space-y-4 px-4 pb-4'
    : 'md:hidden space-y-4 px-4 pb-4';

  return (
    <div className="w-full">
      {/* Desktop Table View */}
      <div className={`${desktopViewClassName} ${tableWrapperClassName}`}>
        <table className={`w-full text-left border-collapse ${tableClassName}`}>
          <thead>
            <tr className="border-b border-slate-100">
              {onSelectionChange && (
                <th className="pl-6 py-4 w-10">
                  <input
                    type="checkbox"
                    checked={data.length > 0 && selectedIds.length === data.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 transition-all cursor-pointer"
                  />
                </th>
              )}
              {columns.map((col, idx) => (
                <th 
                  key={idx} 
                  className={`px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ${headerCellClassName} ${col.headerClassName || ''} ${col.hideOnMobile ? 'hidden md:table-cell' : ''}`}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {data.map((item) => {
              const id = keyExtractor(item);
              const isSelected = selectedIds.includes(id);
              return (
                <tr 
                  key={id}
                  onClick={() => onRowClick?.(item)}
                  className={`
                    transition-all duration-200
                    ${onRowClick ? 'cursor-pointer' : ''}
                    ${isSelected ? 'bg-emerald-50/30' : 'hover:bg-slate-50/50'}
                    ${rowClassName}
                  `}
                >
                  {onSelectionChange && (
                    <td className="pl-6 py-4" onClick={(e) => handleSelectRow(e, id)}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        readOnly
                        className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 transition-all cursor-pointer"
                      />
                    </td>
                  )}
                  {columns.map((col, idx) => (
                    <td key={idx} className={`px-6 py-4 text-sm text-slate-600 ${bodyCellClassName} ${col.className || ''} ${col.hideOnMobile ? 'hidden md:table-cell' : ''}`}>
                      {typeof col.accessor === 'function' 
                        ? col.accessor(item) 
                        : (item[col.accessor] as React.ReactNode)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className={`${mobileViewClassName} ${mobileContainerClassName}`}>
        {data.map((item) => {
          const id = keyExtractor(item);
          const isSelected = selectedIds.includes(id);
          return (
            <div 
              key={id}
              onClick={() => onRowClick?.(item)}
              className={`
                bg-white p-5 rounded-[2rem] border transition-all duration-300 relative
                ${isSelected ? 'border-emerald-500 ring-4 ring-emerald-500/5 bg-emerald-50/10' : 'border-slate-100 shadow-sm'}
                ${onRowClick ? 'active:scale-[0.98]' : ''}
              `}
            >
              {onSelectionChange && (
                <div 
                  className="absolute top-5 right-5 z-10"
                  onClick={(e) => handleSelectRow(e, id)}
                >
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-200 bg-white'}`}>
                    {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                  </div>
                </div>
              )}
              {columns.filter(c => !c.hideOnMobile).map((col, idx) => (
                <div key={idx} className="flex flex-col gap-1.5">
                  <span className="text-[9px] font-black text-slate-300 uppercase tracking-[0.2em]">
                    {col.header}
                  </span>
                  <div className={`text-slate-900 ${col.className?.replace(/md:min-w-\[.*?\]/g, '').replace(/lg:max-w-\[.*?\]/g, '') || ''}`}>
                    {typeof col.accessor === 'function' 
                      ? col.accessor(item) 
                      : (item[col.accessor] as React.ReactNode)}
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}


