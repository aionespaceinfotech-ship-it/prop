
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className = '', ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="text-sm font-semibold text-slate-700 block">
            {label}
          </label>
        )}
        <div className="relative group">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 transition-colors">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={`
              w-full bg-white border border-slate-200 rounded-lg py-2.5 
              ${icon ? 'pl-10' : 'px-4'} pr-4
              text-slate-900 placeholder:text-slate-400
              focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500
              transition-all duration-200
              ${error ? 'border-rose-500 focus:ring-rose-500/20 focus:border-rose-500' : ''}
              ${className}
            `}
            {...props}
          />
        </div>
        {error && <p className="text-xs font-medium text-rose-500">{error}</p>}
      </div>
    );
  }
);

Input.displayName = 'Input';
