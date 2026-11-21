import React from 'react';
import { Navigation, Clock, ShieldCheck, MapPin } from 'lucide-react';
import StatusPill from '../common/StatusPill';
import TrustBadge from '../common/TrustBadge';
import { formatTimeAgo, isOlderThan6Hours } from '../../utils/formatters';

export default function CorridorBoard({ corridors = [] }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Navigation className="w-5 h-5 text-sky-400" />
          <h2 className="text-base font-bold text-white tracking-tight">Lifeline Corridor Board</h2>
        </div>
        <span className="text-xs text-slate-400 font-medium">
          {corridors.length} {corridors.length === 1 ? 'Corridor' : 'Corridors'} monitored
        </span>
      </div>

      <p className="text-xs text-slate-400">
        Critical transport arteries, highway cuts, bridge washouts, and Brahmaputra ferry ghat passability.
      </p>

      {corridors.length === 0 ? (
        <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/60 text-center text-xs text-slate-400">
          No corridor status reported for this district yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {corridors.map((cor) => {
            const isStale = isOlderThan6Hours(cor.last_confirmed_at);

            return (
              <div
                key={cor.id}
                className="p-4 rounded-xl bg-slate-800/90 border border-slate-700 hover:border-slate-600 transition-all flex flex-col justify-between gap-3 shadow-sm"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-1.5 text-xs text-sky-400 font-semibold mb-0.5">
                        <MapPin className="w-3.5 h-3.5" />
                        <span>{cor.district} • {cor.corridor_type}</span>
                      </div>
                      <h3 className="font-bold text-sm text-slate-100">{cor.corridor_name}</h3>
                    </div>

                    <StatusPill type="corridor" value={cor.status} />
                  </div>

                  {cor.advisory_note && (
                    <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-750 text-xs text-slate-300 font-medium">
                      {cor.advisory_note}
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-750/70 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Confirmed {formatTimeAgo(cor.last_confirmed_at)}</span>
                    {cor.updated_by && <span className="text-slate-500">by {cor.updated_by}</span>}
                  </div>

                  <TrustBadge
                    status={cor.verification_status}
                    isDemo={cor.is_demo_data}
                    isStale={isStale}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
