import React from 'react';
import { Wifi, WifiOff, RefreshCw, AlertCircle } from 'lucide-react';

export default function OfflineBanner({ isOnline, lastSyncedAt, outboxCount = 0, onSyncNow, isSyncing = false }) {
  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return 'Never';
    const diffMs = Date.now() - new Date(timestamp).getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHr = Math.floor(diffMin / 60);

    if (diffSec < 60) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHr < 24) return `${diffHr}h ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className={`px-4 py-2 border-b text-xs sm:text-sm transition-colors ${
      isOnline 
        ? 'bg-slate-800/90 border-slate-700/80 text-slate-300' 
        : 'bg-amber-950/90 border-amber-600/70 text-amber-200'
    }`}>
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {isOnline ? (
            <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <Wifi className="w-4 h-4" />
              Online
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-amber-300 font-bold">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <WifiOff className="w-4 h-4" />
              Offline — Using cached data
            </span>
          )}

          <span className="text-slate-500">•</span>
          <span className="text-xs text-slate-400">
            Last synced: <span className="text-slate-200 font-medium">{formatTimeAgo(lastSyncedAt)}</span>
          </span>
        </div>

        <div className="flex items-center gap-2 ml-auto">
          {outboxCount > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/50">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              <span>{outboxCount} {outboxCount === 1 ? 'item' : 'items'} queued to sync</span>
            </div>
          )}

          {isOnline && onSyncNow && (
            <button
              onClick={onSyncNow}
              disabled={isSyncing}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-slate-700 hover:bg-slate-600 active:bg-slate-500 text-xs font-medium text-slate-200 transition-colors disabled:opacity-50"
              title="Fetch latest updates from data service"
            >
              <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin text-sky-400' : ''}`} />
              <span>{isSyncing ? 'Syncing...' : 'Sync Now'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
