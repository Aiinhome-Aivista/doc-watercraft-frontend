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

const Button: React.FC<ButtonProps> = ({ 
  className, 
  variant = 'primary', 
  size = 'md', 
  ...props 
}) => {
  return (
    <button
      className={cn(
        'btn',
        variant !== 'primary' && `btn-${variant}`,
        size === 'sm' && 'btn-sm',
        className
      )}
      {...props}
    />
  );
};

export default Button;
