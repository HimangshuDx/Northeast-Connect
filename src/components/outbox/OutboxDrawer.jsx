import React from 'react';
import { X, RefreshCw, Send, Trash2, Smartphone, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { set, get } from 'idb-keyval';

export default function OutboxDrawer() {
  const { isOutboxOpen, setIsOutboxOpen, outboxItems, refreshOutbox, isOnline, triggerSync, isSyncing } = useApp();

  if (!isOutboxOpen) return null;

  const handleDeleteItem = async (client_uuid) => {
    if (!window.confirm('Delete this queued submission from your device?')) return;
    const current = (await get('ne_outbox_queue')) || [];
    const filtered = current.filter(item => item.client_uuid !== client_uuid);
    await set('ne_outbox_queue', filtered);
    refreshOutbox();
  };

  const handleShareViaSms = (item) => {
    // Build compact SMS fallback per Section 6 Module 2
    // NE-SOS|DISTRICT|CORRIDOR|CATEGORY|PAX:count|VULN:tags|LANDMARK|TIME
    const coordinatorPhone = '9435012345'; // Configurable coordinator helpline number
    const pax = item.people_affected || 1;
    const vulnStr = (item.vulnerabilities && item.vulnerabilities.length > 0)
      ? item.vulnerabilities.map(v => v.substring(0, 3).toUpperCase()).join(',')
      : 'NONE';
    const timeStr = new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const landmark = (item.locality_landmark || 'Unknown').replace(/\|/g, '-');
    const corridor = (item.corridor_or_block || 'N/A').replace(/\|/g, '-');
    const dist = (item.district || 'NE').toUpperCase();
    const cat = (item.category || item.entry_type).toUpperCase();

    const smsBody = `NE-SOS|${dist}|${corridor}|${cat}|PAX:${pax}|VULN:${vulnStr}|${landmark}|${timeStr}`;
    const smsUrl = `sms:${coordinatorPhone}?body=${encodeURIComponent(smsBody)}`;
    window.location.href = smsUrl;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/80 backdrop-blur-sm flex justify-end transition-opacity">
      <div className="w-full max-w-md bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
              {outboxItems.length}
            </div>
            <div>
              <h2 className="font-bold text-white text-base">Device Outbox Queue</h2>
              <p className="text-xs text-slate-400">Offline submissions stored on this phone/browser</p>
            </div>
          </div>
          <button
            onClick={() => setIsOutboxOpen(false)}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            aria-label="Close Outbox Drawer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Sync Status Banner */}
        <div className="p-3 bg-slate-850 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs text-slate-300">
            Network status: <strong className={isOnline ? 'text-emerald-400' : 'text-amber-400'}>{isOnline ? 'Online (Ready to sync)' : 'Offline'}</strong>
          </span>
          <button
            onClick={triggerSync}
            disabled={!isOnline || isSyncing || outboxItems.length === 0}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white text-xs font-bold rounded-lg transition-colors shadow"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync All Now'}</span>
          </button>
        </div>

        {/* List of Outbox Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {outboxItems.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <CheckCircle className="w-12 h-12 text-slate-600 mx-auto mb-2" />
              <p className="font-semibold text-slate-300">Outbox is completely clear</p>
              <p className="text-xs mt-1 text-slate-500">All your submissions have been synchronized.</p>
            </div>
          ) : (
            outboxItems.map((item) => (
              <div
                key={item.client_uuid}
                className="p-3.5 rounded-xl bg-slate-800/90 border border-slate-700 space-y-2 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] font-extrabold bg-amber-950 text-amber-300 border border-amber-700/60 uppercase">
                      {item.entry_type === 'ASSISTANCE_REQUEST' ? 'HELP REQUEST' : 'HAZARD REPORT'}
                    </span>
                    <h4 className="font-bold text-slate-200 text-sm mt-1">{item.category}</h4>
                    <p className="text-xs text-slate-400">{item.district} • {item.locality_landmark}</p>
                  </div>

                  <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800">
                    <Clock className="w-3 h-3" />
                    LOCAL_QUEUED
                  </span>
                </div>

                <div className="p-2 rounded bg-amber-950/40 border border-amber-700/40 text-[11px] text-amber-200 font-medium flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                  <span>Saved on your device. Not yet sent.</span>
                </div>

                {item.people_affected > 1 && (
                  <p className="text-xs text-sky-300 font-semibold">
                    Group SOS: {item.people_affected} people affected
                  </p>
                )}

                <p className="text-xs text-slate-300 italic line-clamp-2">"{item.description}"</p>

                {/* Actions */}
                <div className="pt-2 border-t border-slate-750 flex items-center justify-between gap-2">
                  {/* SMS Fallback Button */}
                  <button
                    onClick={() => handleShareViaSms(item)}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 bg-slate-700 hover:bg-slate-650 text-slate-200 rounded-lg text-xs font-semibold transition-colors"
                    title="Opens SMS app with compact code"
                  >
                    <Smartphone className="w-3.5 h-3.5 text-sky-400" />
                    <span>Share via SMS</span>
                  </button>

                  {/* Delete local copy */}
                  <button
                    onClick={() => handleDeleteItem(item.client_uuid)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-700/50 transition-colors"
                    title="Remove from local outbox"
                    aria-label="Delete outbox item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-[10px] text-slate-500 text-center">
                  Opens your SMS app. We cannot confirm delivery.
                </p>
              </div>
            ))
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-400 text-center">
          When your device reconnects to mobile data or Wi-Fi, queued submissions are uploaded automatically.
        </div>
      </div>
    </div>
  );
}
