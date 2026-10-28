import React, { forwardRef } from 'react';
import { ChevronDown } from 'lucide-react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  helperText?: string;
  options: SelectOption[];
  optional?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, helperText, options, optional, className = '', id, ...props }, ref) => {
    const selectId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <div className="flex items-center justify-between">
            <label
              htmlFor={selectId}
              className="block text-xs font-semibold text-slate-700 dark:text-neutral-300"
            >
              {label}
            </label>
            {optional && (
              <span className="text-[11px] text-slate-400 dark:text-neutral-500 font-normal">
                Optional
              </span>
            )}
          </div>
        )}
        <div className="relative flex items-center">
          <select
            ref={ref}
            id={selectId}
            className={`w-full appearance-none rounded-lg border bg-white dark:bg-[#151b18] px-3 py-2 pr-9 text-sm text-slate-900 dark:text-neutral-100 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#167a53] disabled:opacity-50 disabled:bg-slate-50 dark:disabled:bg-neutral-900 cursor-pointer ${
              error
                ? 'border-rose-500 focus-visible:ring-rose-500'
                : 'border-slate-200 dark:border-neutral-800 hover:border-slate-300 dark:hover:border-neutral-700'
            } ${className}`}
            {...props}
          >
            {options.map((option) => (
              <option
                key={option.value}
                value={option.value}
                disabled={option.disabled}
                className="bg-white text-slate-900 dark:bg-[#181f1b] dark:text-neutral-100"
              >
                {option.label}
              </option>
            ))}
          </select>
          <div className="absolute right-3 flex items-center pointer-events-none text-slate-400 dark:text-neutral-500">
            <ChevronDown className="w-4 h-4" />
          </div>
        </div>
        {error ? (
          <p className="text-xs text-rose-600 dark:text-rose-400">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-slate-500 dark:text-neutral-400">{helperText}</p>
        ) : null}
      </div>
    );
  }
);

Select.displayName = 'Select';
