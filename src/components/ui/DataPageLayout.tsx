import React, { useState } from 'react';
import { PageHeader } from './PageHeader';
import { Button } from './Button';
import { Card } from './Card';
import { Search, Filter, Plus, ChevronDown } from 'lucide-react';
import { cn } from '../../utils/cn';

interface DataPageLayoutProps {
  title: string;
  subtitle?: string;
  primaryAction?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
  search?: {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
  };
  filters?: {
    isOpen?: boolean;
    onToggle?: () => void;
    content: React.ReactNode;
  };
  stats?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

export const DataPageLayout: React.FC<DataPageLayoutProps> = ({
  title,
  subtitle,
  primaryAction,
  search,
  filters,
  stats,
  children,
  className = '',
}) => {
  const [showInternalFilters, setShowInternalFilters] = useState(false);
  const filtersOpen = filters?.isOpen ?? showInternalFilters;
  const toggleFilters = filters?.onToggle ?? (() => setShowInternalFilters(!showInternalFilters));

  return (
    <div className={cn("p-4 sm:p-6 lg:p-8 space-y-6 max-w-[1700px] mx-auto", className)}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <PageHeader title={title} subtitle={subtitle} />
        {primaryAction && (
          <Button onClick={primaryAction.onClick} className="rounded-xl shadow-lg shadow-emerald-200">
            {primaryAction.icon || <Plus size={18} className="mr-2" />}
            {primaryAction.label}
          </Button>
        )}
      </div>

      {/* Stats row if any */}
      {stats && <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">{stats}</div>}

      {/* Search & Filters Bar */}
      <div className="space-y-4">
        <Card className="p-3 sm:p-4 border-none shadow-sm ring-1 ring-slate-200 rounded-2xl lg:rounded-3xl">
          <div className="flex flex-col md:flex-row items-center gap-3 sm:gap-4">
            {search && (
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder={search.placeholder || "Search..."}
                  value={search.value}
                  onChange={(e) => search.onChange(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 sm:py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-4 focus:ring-emerald-500/5 focus:border-emerald-500 transition-all placeholder:text-slate-400 font-medium"
                />
              </div>
            )}
            {filters && (
              <Button 
                variant="outline" 
                onClick={toggleFilters} 
                className="rounded-xl w-full md:w-auto h-10 sm:h-11 text-[10px] sm:text-xs font-black uppercase tracking-widest"
              >
                <Filter size={14} className="mr-2" />
                Filter Engine
                <ChevronDown size={14} className={cn('ml-2 transition-transform duration-300', filtersOpen && 'rotate-180')} />
              </Button>
            )}
          </div>
          
          {filters && filtersOpen && (
            <div className="mt-4 pt-4 border-t border-slate-50 animate-in fade-in slide-in-from-top-2 duration-500">
              {filters.content}
            </div>
          )}
        </Card>
      </div>

      {/* Main Content */}
      {children}
    </div>
  );
};
