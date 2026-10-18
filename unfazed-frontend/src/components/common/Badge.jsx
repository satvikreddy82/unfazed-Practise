import React from 'react';

export const Badge = ({
  children,
  variant = 'default', // 'primary', 'accent', 'success', 'warning', 'danger', 'neutral', 'clay'
  size = 'md', // 'sm', 'md'
  clay = false,
  className = '',
}) => {
  const sizeStyles = {
    sm: 'text-[10px] px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-medium',
  };

  const variantStyles = {
    default: 'bg-surface-elevated text-text border border-border',
    primary: 'bg-primary/10 text-primary border border-primary/20',
    accent: 'bg-accent/20 text-text border border-accent/30',
    success: 'bg-success/15 text-success border border-success/30',
    warning: 'bg-warning/15 text-warning border border-warning/30',
    danger: 'bg-danger/15 text-danger border border-danger/30',
    neutral: 'bg-text-muted/10 text-text-muted border border-border',
    clay: 'clay-badge bg-surface text-primary border border-white/40',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 uppercase tracking-wider ${clay ? 'clay-badge' : 'rounded-full'} ${sizeStyles[size]} ${variantStyles[variant] || variantStyles.default} ${className}`}
    >
      {children}
    </span>
  );
};
