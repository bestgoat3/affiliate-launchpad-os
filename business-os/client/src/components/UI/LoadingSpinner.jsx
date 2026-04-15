import React from 'react';

export default function LoadingSpinner({ size = 'md', className = '' }) {
  const sizes = {
    sm: 'w-4 h-4 border-2',
    md: 'w-8 h-8 border-2',
    lg: 'w-12 h-12 border-3',
    xl: 'w-16 h-16 border-4',
  };

  return (
    <div
      className={`${sizes[size]} rounded-full border-dark-border border-t-gold animate-spin ${className}`}
    />
  );
}

export function PageLoader() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-dark">
      <div className="flex flex-col items-center gap-4">
        <LoadingSpinner size="xl" />
        <p className="text-gray-400 text-sm">Loading...</p>
      </div>
    </div>
  );
}

export function SectionLoader({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      <LoadingSpinner size="lg" />
      <p className="text-gray-400 text-sm">{message}</p>
    </div>
  );
}

export function SkeletonRow({ cols = 4 }) {
  return (
    <tr className="border-b border-dark-border">
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <div className="h-4 bg-dark-hover rounded animate-pulse" />
        </td>
      ))}
    </tr>
  );
}
