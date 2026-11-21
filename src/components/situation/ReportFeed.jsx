import React, { useState } from 'react';
import { 
  Users, 
  MapPin, 
  Clock, 
  ThumbsUp, 
  Phone, 
  AlertCircle, 
  Check, 
  Layers,
  HeartHandshake
} from 'lucide-react';
import TrustBadge from '../common/TrustBadge';
import StatusPill from '../common/StatusPill';
import { maskPhone, formatTimeAgo, isOlderThan6Hours } from '../../utils/formatters';
import { useApp } from '../../context/AppContext';
import { dataService } from '../../services/dataService';

export default function ReportFeed({ reports = [], onReportConfirmed }) {
  const { deviceToken } = useApp();
  const [confirmingId, setConfirmingId] = useState(null);
  const [confirmedReports, setConfirmedReports] = useState(() => {
    try {
      const stored = localStorage.getItem('ne_device_confirmations');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const handleConfirm = async (reportId) => {
    if (confirmedReports.includes(reportId) || confirmingId === reportId) return;
    setConfirmingId(reportId);

    try {
      const res = await dataService.confirmReport(reportId, deviceToken);
      if (res.success) {
        const next = [...confirmedReports, reportId];
        setConfirmedReports(next);
        localStorage.setItem('ne_device_confirmations', JSON.stringify(next));
        if (onReportConfirmed) onReportConfirmed(reportId, res.count);
      } else {
        alert(res.message || 'Already confirmed from this device.');
      }
    } catch (err) {
      console.error('Confirmation error:', err);
    } finally {
      setConfirmingId(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-sky-400" />
          <h2 className="text-base font-bold text-white tracking-tight">Ground Reports & Urgent Requests</h2>
        </div>
        <span className="text-xs text-slate-400 font-medium">
          {reports.length} Reports
        </span>
      </div>

      <p className="text-xs text-slate-400">
        Citizen reports, village head proxy alerts, and emergency rescue calls. Verified by local coordinators.
      </p>

      {reports.length === 0 ? (
        <div className="p-8 rounded-xl bg-slate-800/40 border border-slate-700/60 text-center text-xs text-slate-400">
          No active ground reports for this district.
        </div>
      ) : (
        <div className="space-y-3">
          {reports.map((rep) => {
            const isStale = isOlderThan6Hours(rep.created_at);
            const isAssistance = rep.entry_type === 'ASSISTANCE_REQUEST';
            const hasConfirmed = confirmedReports.includes(rep.id);

            return (
              <div
                key={rep.id}
                className={`p-4 rounded-xl border transition-all shadow-sm ${
                  isAssistance
                    ? 'bg-slate-850/90 border-rose-900/50 hover:border-rose-700/60'
                    : 'bg-slate-800/90 border-slate-700/80 hover:border-slate-600'
                }`}
              >
                {/* Header row */}
                <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                      isAssistance ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-sky-950 text-sky-300 border border-sky-800'
                    }`}>
                      {isAssistance ? 'HELP REQUEST' : 'HAZARD REPORT'}
                    </span>

                    <span className="text-xs font-bold text-white">
                      {rep.category.replace(/_/g, ' ')}
                    </span>

                    {rep.assistance_status && (
                      <StatusPill type="assistance" value={rep.assistance_status} />
                    )}
                  </div>

                  <TrustBadge
                    status={rep.verification_status}
                    isDemo={rep.is_demo_data}
                    isStale={isStale}
                  />
                </div>

                {/* Location & Reporter Info */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-300 mb-2 font-medium">
                  <div className="flex items-center gap-1 text-sky-300 font-semibold">
                    <MapPin className="w-3.5 h-3.5 text-sky-400" />
                    <span>{rep.district} • {rep.locality_landmark}</span>
                  </div>

                  {rep.corridor_or_block && (
                    <span className="text-slate-400">({rep.corridor_or_block})</span>
                  )}
                </div>

                {/* Group SOS banner if proxy or multiple people affected */}
                {rep.people_affected > 1 && (
                  <div className="mb-2 p-2 rounded-lg bg-sky-950/60 border border-sky-700/40 text-xs text-sky-200 flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-1 font-bold text-sky-300">
                      <Users className="w-3.5 h-3.5" />
                      <span>Group SOS: {rep.people_affected} people affected</span>
                    </div>
                    {rep.is_proxy_report && (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-sky-900/80 text-sky-100 font-semibold">
                        Reported by Proxy / Village Leader
                      </span>
                    )}
                  </div>
                )}

                {/* Vulnerability tags */}
                {rep.vulnerabilities && rep.vulnerabilities.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 mb-2">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Vulnerabilities:</span>
                    {rep.vulnerabilities.map((v, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-950/70 text-rose-300 border border-rose-800/60">
                        {v}
                      </span>
                    ))}
                  </div>
                )}

                {/* Needs tags */}
                {rep.needs && rep.needs.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 mb-2">
                    <span className="text-[10px] text-slate-400 uppercase font-bold">Urgent Needs:</span>
                    {rep.needs.map((n, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-950/70 text-amber-300 border border-amber-800/60">
                        {n}
                      </span>
                    ))}
                  </div>
                )}

                {/* Description */}
                <p className="text-xs sm:text-sm text-slate-200 leading-relaxed bg-slate-900/60 p-3 rounded-lg border border-slate-750 font-normal">
                  {rep.description}
                </p>

                {/* Footer bar with masked phone, time, reporter, and +1 confirm */}
                <div className="mt-3 pt-2.5 border-t border-slate-750 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex flex-wrap items-center gap-3 text-slate-400 text-[11px]">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-500" />
                      <span>{formatTimeAgo(rep.created_at)}</span>
                    </div>

                    <span>By: <strong className="text-slate-300">{rep.reporter_label || 'Citizen'}</strong></span>

                    {/* MASKED PHONE ON PUBLIC FEED */}
                    {rep.reporter_phone && (
                      <div className="flex items-center gap-1 text-slate-300 font-mono" title="Phone masked for public privacy. Coordinators see full number.">
                        <Phone className="w-3 h-3 text-slate-500" />
                        <span>{maskPhone(rep.reporter_phone)}</span>
                      </div>
                    )}
                  </div>

                  {/* +1 Confirm button */}
                  <button
                    onClick={() => handleConfirm(rep.id)}
                    disabled={hasConfirmed || confirmingId === rep.id}
                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-sm ${
                      hasConfirmed
                        ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-700/60 cursor-default'
                        : 'bg-slate-700 hover:bg-slate-650 active:bg-slate-600 text-slate-100 border border-slate-600'
                    }`}
                    title={hasConfirmed ? 'You have confirmed this report' : 'Confirm this condition from your location'}
                  >
                    {hasConfirmed ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Confirmed ({rep.confirmations_count || 1})</span>
                      </>
                    ) : (
                      <>
                        <ThumbsUp className={`w-3.5 h-3.5 ${confirmingId === rep.id ? 'animate-bounce text-sky-400' : 'text-slate-300'}`} />
                        <span>+1 Confirm ({rep.confirmations_count || 1})</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
