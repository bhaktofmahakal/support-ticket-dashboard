import React from 'react';

export function SkeletonBlock({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-slate-200 rounded ${className}`}
      aria-hidden="true"
    />
  );
}

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4" aria-label="Loading statistics...">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm animate-pulse">
          <div className="flex items-center justify-between">
            <div className="h-4 w-16 bg-slate-200 rounded" />
            <div className="h-5 w-5 bg-slate-200 rounded-full" />
          </div>
          <div className="h-8 w-12 bg-slate-300 rounded mt-3" />
        </div>
      ))}
    </div>
  );
}

export function TableSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden" aria-label="Loading tickets...">
      <div className="divide-y divide-slate-100">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="p-4 flex items-center justify-between animate-pulse">
            <div className="space-y-2 flex-1 max-w-md">
              <div className="h-5 bg-slate-200 rounded w-3/4" />
              <div className="h-4 bg-slate-100 rounded w-1/2" />
            </div>
            <div className="flex items-center gap-4">
              <div className="h-6 w-16 bg-slate-200 rounded-full" />
              <div className="h-6 w-14 bg-slate-200 rounded" />
              <div className="h-4 w-20 bg-slate-100 rounded hidden md:block" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
