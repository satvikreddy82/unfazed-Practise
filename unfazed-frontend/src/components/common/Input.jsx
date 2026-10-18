import React, { forwardRef } from 'react';

export const Input = forwardRef(({
  label,
  error,
  helperText,
  icon: Icon,
  className = '',
  containerClassName = '',
  id,
  type = 'text',
  ...props
}, ref) => {
  const inputId = id || (label ? label.toLowerCase().replace(/[^a-z0-9]/g, '-') : undefined);

  return (
    <div className={`w-full ${containerClassName}`}>
      {label && (
        <label
          htmlFor={inputId}
          className="block text-xs font-semibold text-text uppercase tracking-wider mb-1.5"
        >
          {label}
        </label>
      )}
      <div className="relative rounded-lg shadow-subtle">
        {Icon && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <input
          ref={ref}
          id={inputId}
          type={type}
          className={`block w-full rounded-lg border bg-surface text-text text-sm transition-all placeholder:text-text-muted/60 focus:outline-none focus:ring-2 focus:ring-focus-ring focus:border-transparent ${
            Icon ? 'pl-9 pr-3' : 'px-3'
          } py-2 ${
            error
              ? 'border-danger focus:ring-danger'
              : 'border-border hover:border-text-muted/40'
          } ${className}`}
          {...props}
        />
      </div>
      {error && (
        <p className="mt-1 text-xs text-danger font-medium">{error}</p>
      )}
      {helperText && !error && (
        <p className="mt-1 text-[11px] text-text-muted">{helperText}</p>
      )}
    </div>
  );
});

Input.displayName = 'Input';
