
import React from 'react';

type BadgeVariant = 'success' | 'warning' | 'error' | 'info' | 'neutral';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ 
  children, 
  variant = 'neutral', 
  size = 'md',
  className = '' 
}) => {
  const variants = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    warning: 'bg-amber-50 text-amber-700 border-amber-100',
    error: 'bg-rose-50 text-rose-700 border-rose-100',
    info: 'bg-blue-50 text-blue-700 border-blue-100',
    neutral: 'bg-slate-50 text-slate-700 border-slate-100',
  };

  const sizes = {
    sm: 'px-1.5 py-0 text-[9px]',
    md: 'px-2 py-0.5 text-[10px]',
  };

  return (
    <span className={`
      inline-flex items-center rounded-full font-bold uppercase tracking-wider border
      ${variants[variant]}
      ${sizes[size]}
      ${className}
    `}>
      {children}
    </span>
  );
};
