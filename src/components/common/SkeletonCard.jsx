import React from 'react';

export default function SkeletonCard({ count = 3, type = 'default' }) {
  const items = Array.from({ length: count });

  return (
    <div className="space-y-3">
      {items.map((_, i) => (
        <div key={i} className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/50 animate-pulse space-y-3">
          <div className="flex items-center justify-between">
            <div className="h-4 bg-slate-700 rounded w-1/3"></div>
            <div className="h-5 bg-slate-700 rounded-full w-20"></div>
          </div>
          <div className="h-3 bg-slate-700/70 rounded w-3/4"></div>
          <div className="h-3 bg-slate-700/50 rounded w-1/2"></div>
          {type === 'detailed' && (
            <div className="pt-2 flex gap-2">
              <div className="h-6 bg-slate-700 rounded w-16"></div>
              <div className="h-6 bg-slate-700 rounded w-20"></div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
