
import React from 'react';

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string | number; label: string }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, options, className = '', ...props }, ref) => {
    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label className="text-sm font-semibold text-slate-700 block">
            {label}
          </label>
        )}
        <select
          ref={ref}
          className={`
            w-full bg-white border border-slate-200 rounded-lg py-2.5 px-4
            text-slate-900 appearance-none
            focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500
            transition-all duration-200
            bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20fill%3D%22none%22%20viewBox%3D%220%200%2024%2024%22%20stroke%3D%22currentColor%22%3E%3Cpath%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%20stroke-width%3D%222%22%20d%3D%22M19%209l-7%207-7-7%22%2F%3E%3C%2Fsvg%3E')]
            bg-[length:1.25rem_1.25rem] bg-[right_0.75rem_center] bg-no-repeat
            ${error ? 'border-rose-500 focus:ring-rose-500/20 focus:border-rose-500' : ''}
            ${className}
          `}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-xs font-medium text-rose-500">{error}</p>}
      </div>
    );
  }
);

Select.displayName = 'Select';
