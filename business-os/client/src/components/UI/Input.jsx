import React, { forwardRef } from 'react';
import { Search } from 'lucide-react';

export const Input = forwardRef(function Input(
  { label, error, icon: Icon, className = '', hint, ...props },
  ref
) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-300 mb-1.5">{label}</label>
      )}
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none">
            <Icon className="w-4 h-4 text-gray-500" />
          </div>
        )}
        <input
          ref={ref}
          className={`
            w-full bg-dark-card border rounded-lg px-3 py-2 text-white text-sm
            placeholder-gray-500
            focus:outline-none focus:ring-1 transition-all
            disabled:opacity-50 disabled:cursor-not-allowed
            ${Icon ? 'pl-9' : ''}
            ${
              error
                ? 'border-red-500/50 focus:border-red-500/70 focus:ring-red-500/20'
                : 'border-dark-border focus:border-gold/50 focus:ring-gold/20'
            }
            ${className}
          `}
          {...props}
        />
      </div>
      {hint && !error && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
});

export const Textarea = forwardRef(function Textarea(
  { label, error, className = '', rows = 3, hint, ...props },
  ref
) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-300 mb-1.5">{label}</label>
      )}
      <textarea
        ref={ref}
        rows={rows}
        className={`
          w-full bg-dark-card border rounded-lg px-3 py-2 text-white text-sm
          placeholder-gray-500 resize-none
          focus:outline-none focus:ring-1 transition-all
          disabled:opacity-50 disabled:cursor-not-allowed
          ${
            error
              ? 'border-red-500/50 focus:border-red-500/70 focus:ring-red-500/20'
              : 'border-dark-border focus:border-gold/50 focus:ring-gold/20'
          }
          ${className}
        `}
        {...props}
      />
      {hint && !error && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
});

export const Select = forwardRef(function Select(
  { label, error, className = '', children, hint, ...props },
  ref
) {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-300 mb-1.5">{label}</label>
      )}
      <select
        ref={ref}
        className={`
          w-full bg-dark-card border rounded-lg px-3 py-2 text-white text-sm
          focus:outline-none focus:ring-1 transition-all
          disabled:opacity-50 disabled:cursor-not-allowed
          appearance-none
          ${
            error
              ? 'border-red-500/50 focus:border-red-500/70 focus:ring-red-500/20'
              : 'border-dark-border focus:border-gold/50 focus:ring-gold/20'
          }
          ${className}
        `}
        {...props}
      >
        {children}
      </select>
      {hint && !error && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
});

export function SearchInput({ value, onChange, placeholder = 'Search...', className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-dark-card border border-dark-border rounded-lg pl-9 pr-3 py-2 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-gold/50 focus:ring-1 focus:ring-gold/20 transition-all"
      />
    </div>
  );
}

export default Input;
