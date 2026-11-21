import React from 'react';
import { AlertCircle, Clock, ShieldAlert, Radio } from 'lucide-react';
import SeverityBadge from '../common/SeverityBadge';
import TrustBadge from '../common/TrustBadge';
import { formatTimeAgo, isOlderThan6Hours } from '../../utils/formatters';
import { useApp } from '../../context/AppContext';

export default function AdvisoriesList({ advisories = [] }) {
  const { language } = useApp();

  if (advisories.length === 0) {
    return null;
  }

  const getInstructions = (adv) => {
    if (language === 'as' && adv.instructions_as) return adv.instructions_as;
    if (language === 'hi' && adv.instructions_hi) return adv.instructions_hi;
    return adv.instructions_en;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Radio className="w-5 h-5 text-rose-400 animate-pulse" />
          <h2 className="text-base font-bold text-white tracking-tight">Active Disaster Advisories</h2>
        </div>
        <span className="text-xs text-slate-400 font-medium">
          {advisories.length} Active
        </span>
      </div>

      <div className="space-y-2.5">
        {advisories.map((adv) => {
          const isStale = isOlderThan6Hours(adv.issued_at);
          const instructions = getInstructions(adv);

          return (
            <div
              key={adv.id}
              className="p-4 rounded-xl bg-slate-800/95 border border-slate-700/80 hover:border-slate-600 transition-all shadow-md"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <SeverityBadge severity={adv.severity} />
                  <span className="text-xs font-semibold text-slate-300">
                    {adv.district === 'ALL_NE' ? 'Regional Warning' : adv.district}
                  </span>
                </div>

                <TrustBadge
                  status="VERIFIED"
                  isDemo={adv.is_demo_data}
                  isStale={isStale}
                />
              </div>

              <h3 className="text-base font-bold text-white mb-1.5">{adv.title}</h3>
              <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-normal bg-slate-900/60 p-3 rounded-lg border border-slate-750">
                {instructions}
              </p>

              <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-400">
                <span className="font-medium text-slate-300">Source: {adv.source_label}</span>
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Clock className="w-3.5 h-3.5 text-slate-500" />
                  <span>Issued {formatTimeAgo(adv.issued_at)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
