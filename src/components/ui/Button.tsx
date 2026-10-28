import React from 'react';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'secondary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#167a53] disabled:opacity-50 disabled:pointer-events-none cursor-pointer select-none whitespace-nowrap shrink-0';

  const sizeClasses = {
    sm: 'text-xs px-2.5 py-1.5 gap-1.5 h-8',
    md: 'text-sm px-3.5 py-2 gap-2 h-9',
    lg: 'text-sm px-4 py-2.5 gap-2.5 h-10',
  };

  const variantClasses = {
    primary:
      'bg-[#167a53] text-white hover:bg-[#126846] active:bg-[#0e563a] shadow-sm shadow-[#167a53]/20 border border-transparent',
    secondary:
      'bg-white dark:bg-[#181f1b] text-slate-800 dark:text-neutral-200 border border-slate-200 dark:border-neutral-800 hover:bg-slate-50 dark:hover:bg-[#202924] shadow-xs',
    outline:
      'bg-transparent text-slate-700 dark:text-neutral-300 border border-slate-300 dark:border-neutral-700 hover:bg-slate-100 dark:hover:bg-neutral-800',
    ghost:
      'bg-transparent text-slate-700 dark:text-neutral-300 hover:bg-slate-100 dark:hover:bg-[#1e2621]',
    danger:
      'bg-rose-600 text-white hover:bg-rose-700 active:bg-rose-800 shadow-sm border border-transparent',
  };

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : (
        leftIcon && <span className="shrink-0">{leftIcon}</span>
      )}
      <span>{children}</span>
      {!isLoading && rightIcon && <span className="shrink-0">{rightIcon}</span>}
    </button>
  );
};
