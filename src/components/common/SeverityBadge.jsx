import React from 'react';
import { AlertCircle, Flame, AlertTriangle } from 'lucide-react';

export default function SeverityBadge({ severity, className = '' }) {
  if (!severity) return null;
  const sev = String(severity).toUpperCase();

  if (sev === 'CRITICAL' || sev === 'RED') {
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-rose-600 text-white shadow-sm shadow-rose-950/50 ${className}`}>
        <Flame className="w-3.5 h-3.5 text-white animate-pulse" />
        CRITICAL (RED ALERT)
      </span>
    );
  }

  if (sev === 'HIGH' || sev === 'ORANGE') {
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500 text-slate-950 shadow-sm ${className}`}>
        <AlertTriangle className="w-3.5 h-3.5 text-slate-950" />
        HIGH (ORANGE ALERT)
      </span>
    );
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-yellow-400 text-slate-950 shadow-sm ${className}`}>
      <AlertCircle className="w-3.5 h-3.5 text-slate-950" />
      MODERATE (YELLOW ALERT)
    </span>
  );
}
