import React from 'react';
import LoadingSpinner from './LoadingSpinner';

const variants = {
  gold: 'bg-gold hover:bg-gold-light text-dark font-semibold',
  secondary: 'bg-dark-hover hover:bg-dark-border text-white font-medium border border-dark-border',
  ghost: 'hover:bg-dark-hover text-gray-400 hover:text-white font-medium',
  danger: 'bg-red-500/10 hover:bg-red-500/20 text-red-400 font-medium border border-red-500/20',
  success: 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-medium border border-emerald-500/20',
  outline: 'border border-gold/50 text-gold hover:bg-gold/10 font-medium',
};

const sizes = {
  xs: 'px-2.5 py-1 text-xs rounded-md',
  sm: 'px-3 py-1.5 text-sm rounded-lg',
  md: 'px-4 py-2 text-sm rounded-lg',
  lg: 'px-6 py-2.5 text-base rounded-lg',
};

export default function Button({
  children,
  variant = 'gold',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  iconPosition = 'left',
  className = '',
  onClick,
  type = 'button',
  ...props
}) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`
        inline-flex items-center justify-center gap-2
        transition-all duration-150 cursor-pointer
        disabled:opacity-50 disabled:cursor-not-allowed
        ${variants[variant]}
        ${sizes[size]}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <LoadingSpinner size="sm" />
      ) : (
        Icon && iconPosition === 'left' && <Icon className="w-4 h-4 flex-shrink-0" />
      )}
      {children}
      {!loading && Icon && iconPosition === 'right' && (
        <Icon className="w-4 h-4 flex-shrink-0" />
      )}
    </button>
  );
}
