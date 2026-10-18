import React from 'react';

export const LoadingSkeleton = ({ count = 3, className = 'h-12 w-full', containerClassName = 'space-y-3' }) => {
  return (
    <div className={containerClassName}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`animate-pulse rounded-lg bg-border/60 ${className}`}
        />
      ))}
    </div>
  );
};
