import React from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Helper for merging classes if tailwind is used, otherwise just clsx
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'amber' | 'green' | 'red' | 'light';
  size?: 'sm' | 'md' | 'lg';
}

const variantClasses: Record<NonNullable<ButtonProps['variant']>, string> = {
  primary:
    'border-cyan-500/80 text-cyan-300 hover:border-cyan-400 hover:bg-cyan-500/10',
  ghost:
    'border-slate-700 text-slate-300 hover:border-slate-600 hover:bg-slate-800 hover:text-slate-100',
  amber:
    'border-amber-500/40 text-amber-300 hover:bg-amber-500/10',
  green:
    'border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10',
  red: 'border-rose-500/40 text-rose-300 hover:bg-rose-500/10',
  light:
    'border-slate-100 bg-slate-100 text-slate-900 hover:bg-transparent hover:text-slate-100',
};

const sizeClasses: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'px-2.5 py-1 text-xs',
  md: 'px-4 py-1.5 text-sm',
  lg: 'px-5 py-2 text-base',
};

const Button: React.FC<ButtonProps> = ({ 
  className, 
  variant = 'primary', 
  size = 'md', 
  ...props 
}) => {
  return (
    <button
      className={cn(
        "inline-flex items-center gap-1.5 border bg-transparent font-semibold tracking-wide transition-colors outline-none focus-visible:ring-2 focus-visible:ring-cyan-500/60 focus-visible:ring-offset-1 focus-visible:ring-offset-slate-950 [font-family:'Barlow_Condensed',sans-serif]",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    />
  );
};

export default Button;
