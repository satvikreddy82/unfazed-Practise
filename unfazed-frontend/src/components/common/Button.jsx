import React from 'react';
import { Loader2 } from 'lucide-react';

export const Button = ({
  children,
  variant = 'primary', // 'primary', 'secondary', 'accent', 'outline', 'ghost', 'danger'
  size = 'md', // 'sm', 'md', 'lg'
  isLoading = false,
  disabled = false,
  className = '',
  type = 'button',
  icon: Icon,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-focus-ring disabled:opacity-50 disabled:cursor-not-allowed select-none';

  const sizeStyles = {
    sm: 'text-xs px-2.5 py-1.5 gap-1.5',
    md: 'text-sm px-4 py-2 gap-2',
    lg: 'text-base px-6 py-2.5 gap-2.5',
  };

  const variantStyles = {
    primary: 'bg-primary hover:bg-primary-hover text-white shadow-subtle active:scale-[0.99]',
    secondary: 'bg-secondary text-white hover:opacity-95 shadow-subtle active:scale-[0.99]',
    accent: 'bg-accent hover:bg-accent-hover text-black font-semibold shadow-subtle active:scale-[0.99]',
    outline: 'border border-border bg-surface hover:bg-surface-elevated text-text shadow-subtle',
    ghost: 'text-text hover:bg-surface-elevated active:bg-border/40',
    danger: 'bg-danger hover:bg-danger/90 text-white shadow-subtle',
    clay: 'clay-btn bg-surface hover:bg-surface-elevated text-text border border-border/60',
    'clay-primary': 'clay-btn bg-primary hover:bg-primary-hover text-white border border-white/20',
  };

  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      className={`${baseStyles} ${sizeStyles[size]} ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
          <span>Processing...</span>
        </>
      ) : (
        <>
          {Icon && <Icon className="w-4 h-4 shrink-0" />}
          {children}
        </>
      )}
    </button>
  );
};
