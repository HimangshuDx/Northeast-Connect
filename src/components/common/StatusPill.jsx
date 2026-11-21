import React from 'react';
import { CheckCircle2, AlertTriangle, AlertOctagon, HelpCircle, Ban, ArrowRightCircle } from 'lucide-react';

export default function StatusPill({ type = 'corridor', value, className = '' }) {
  if (!value) return null;

  // CORRIDOR STATUS
  if (type === 'corridor') {
    switch (value) {
      case 'PASSABLE':
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-600/60 ${className}`}>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            PASSABLE / CLEAR
          </span>
        );
      case 'SINGLE_LANE':
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-950/80 text-amber-300 border border-amber-600/60 ${className}`}>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            SINGLE LANE ONLY
          </span>
        );
      case 'LANDSLIDE_BLOCKED':
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-rose-950/90 text-rose-300 border border-rose-600/70 ${className}`}>
            <Ban className="w-3.5 h-3.5 text-rose-400" />
            LANDSLIDE BLOCKED
          </span>
        );
      case 'SUBMERGED':
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-blue-950/90 text-blue-300 border border-blue-600/70 ${className}`}>
            <AlertOctagon className="w-3.5 h-3.5 text-blue-400" />
            ROAD SUBMERGED
          </span>
        );
      case 'CLOSED':
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-rose-950/90 text-rose-300 border border-rose-600/70 ${className}`}>
            <Ban className="w-3.5 h-3.5 text-rose-400" />
            TOTAL CLOSURE
          </span>
        );
      default:
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700 ${className}`}>
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            UNKNOWN / NOT CONFIRMED
          </span>
        );
    }
  }

  // RESOURCE CAPACITY STATUS
  if (type === 'capacity') {
    switch (value) {
      case 'OPEN_AVAILABLE':
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-600/60 ${className}`}>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            OPEN & AVAILABLE
          </span>
        );
      case 'NEAR_CAPACITY':
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-950/80 text-amber-300 border border-amber-600/60 ${className}`}>
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            NEAR CAPACITY (&gt;85%)
          </span>
        );
      case 'FULL':
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-rose-950/90 text-rose-300 border border-rose-600/70 ${className}`}>
            <Ban className="w-3.5 h-3.5 text-rose-400" />
            CAMP FULL
          </span>
        );
      case 'TEMPORARILY_CLOSED':
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-slate-850 text-slate-400 border border-slate-750 ${className}`}>
            <Ban className="w-3.5 h-3.5 text-slate-500" />
            TEMPORARILY CLOSED
          </span>
        );
      default:
        return (
          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-slate-800 text-slate-300 border border-slate-700 ${className}`}>
            <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
            UNKNOWN / NOT CONFIRMED
          </span>
        );
    }
  }

  // ASSISTANCE STATUS
  if (type === 'assistance') {
    switch (value) {
      case 'SUBMITTED':
        return (
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-bold bg-amber-950/60 text-amber-300 border border-amber-700/50 ${className}`}>
            <ArrowRightCircle className="w-3 h-3 text-amber-400" />
            HELP REQUESTED
          </span>
        );
      case 'ACCEPTED':
        return (
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-bold bg-sky-950/70 text-sky-300 border border-sky-600/60 ${className}`}>
            <CheckCircle2 className="w-3 h-3 text-sky-400" />
            ACCEPTED BY TEAM
          </span>
        );
      case 'DISPATCHED':
        return (
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-bold bg-purple-950/70 text-purple-300 border border-purple-600/60 ${className}`}>
            <ArrowRightCircle className="w-3 h-3 text-purple-400 animate-pulse" />
            TEAM DISPATCHED
          </span>
        );
      case 'RESOLVED':
        return (
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-bold bg-emerald-950/70 text-emerald-300 border border-emerald-600/60 ${className}`}>
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            RESCUED / RESOLVED
          </span>
        );
      default:
        return null;
    }
  }

  return null;
}
