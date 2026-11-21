import React from 'react';
import { ShieldCheck, AlertTriangle, Clock, XCircle, Database, AlertOctagon } from 'lucide-react';

export default function TrustBadge({ status, isDemo = false, isStale = false, className = '' }) {
  return (
    <div className={`inline-flex items-center gap-1.5 flex-wrap ${className}`}>
      {isDemo && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-900/60 text-purple-200 border border-purple-700/50 shadow-sm" title="This is simulated sample data for testing and demonstration">
          <Database className="w-3 h-3 text-purple-300" />
          SAMPLE DEMO DATA
        </span>
      )}

      {isStale && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-950/80 text-amber-300 border border-amber-600/60 shadow-sm" title="Older than 6 hours. Conditions may have changed.">
          <AlertOctagon className="w-3 h-3 text-amber-400" />
          Stale – verify locally
        </span>
      )}

      {status === 'VERIFIED' && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-950/70 text-emerald-300 border border-emerald-600/50">
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
          Verified
        </span>
      )}

      {status === 'UNDER_REVIEW' && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-950/70 text-amber-300 border border-amber-600/50">
          <Clock className="w-3 h-3 text-amber-400" />
          Under Review
        </span>
      )}

      {status === 'UNVERIFIED' && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-800 text-slate-300 border border-slate-700">
          <AlertTriangle className="w-3 h-3 text-slate-400" />
          Unverified Report
        </span>
      )}

      {status === 'REJECTED' && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-950/70 text-rose-300 border border-rose-600/50">
          <XCircle className="w-3 h-3 text-rose-400" />
          Rejected / False
        </span>
      )}
    </div>
  );
}
