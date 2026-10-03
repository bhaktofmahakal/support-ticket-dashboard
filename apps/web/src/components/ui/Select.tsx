import React, { forwardRef } from 'react';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  wrapperClassName?: string;
  error?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  {
    className = '',
    wrapperClassName = '',
    error,
    children,
    disabled,
    'aria-invalid': ariaInvalid,
    style,
    ...props
  },
  ref
) {
  const isInvalid = error || ariaInvalid === true || ariaInvalid === 'true';

  return (
    <div className={`relative w-full min-w-0 ${wrapperClassName}`}>
      <select
        ref={ref}
        disabled={disabled}
        aria-invalid={isInvalid ? true : undefined}
        style={{ colorScheme: 'dark', ...style }}
        className={`w-full min-w-0 appearance-none h-11 sm:h-10 pl-3 pr-9 text-sm rounded-md border transition-colors bg-surface-raised hover:bg-surface-overlay focus:bg-surface-overlay text-text-primary focus-visible:outline-none focus-visible:ring-2 disabled:opacity-50 disabled:cursor-not-allowed truncate ${
          isInvalid
            ? 'border-danger focus-visible:border-danger focus-visible:ring-danger/40'
            : 'border-border hover:border-border-strong focus:border-border-strong focus-visible:ring-focus-ring'
        } ${className}`}
        {...props}
      >
        {children}
      </select>
      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 flex items-center text-text-muted">
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m19 9-7 7-7-7" />
        </svg>
      </div>
    </div>
  );
});

Select.displayName = 'Select';
