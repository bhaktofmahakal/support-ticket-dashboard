import React from 'react';

export function SkeletonBlock({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-surface-raised rounded-md ${className}`}
      aria-hidden="true"
    />
  );
}

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4" aria-label="Loading statistics...">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="p-4 bg-surface rounded-lg border border-border animate-pulse">
          <div className="flex items-center justify-between">
            <div className="h-4 w-16 bg-surface-raised rounded" />
            <div className="h-5 w-5 bg-surface-raised rounded-full" />
          </div>
          <div className="h-8 w-12 bg-surface-raised rounded mt-3" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton() {
  return (
    <div className="bg-surface rounded-lg border border-border overflow-hidden" aria-label="Loading tickets...">
      <div className="divide-y divide-border">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="p-4 flex items-center justify-between animate-pulse">
            <div className="space-y-2 flex-1 max-w-md">
              <div className="h-5 bg-surface-raised rounded w-3/4" />
              <div className="h-4 bg-surface-raised/60 rounded w-1/2" />
            </div>
            <div className="flex items-center gap-4">
              <div className="h-6 w-16 bg-surface-raised rounded-full" />
              <div className="h-6 w-14 bg-surface-raised rounded" />
              <div className="h-4 w-20 bg-surface-raised/60 rounded hidden md:block" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
