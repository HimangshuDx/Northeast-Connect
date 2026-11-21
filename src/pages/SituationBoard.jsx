import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, PlusCircle, RefreshCw, Radio } from 'lucide-react';
import AdvisoriesList from '../components/situation/AdvisoriesList';
import CorridorBoard from '../components/situation/CorridorBoard';
import ReportFeed from '../components/situation/ReportFeed';
import RainfallIndicator from '../components/situation/RainfallIndicator';
import SkeletonCard from '../components/common/SkeletonCard';
import { useApp } from '../context/AppContext';
import { dataService } from '../services/dataService';

export default function SituationBoard() {
  const { selectedDistrict } = useApp();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    advisories: [],
    corridors: [],
    reports: []
  });
  const [error, setError] = useState(null);

  const loadSituation = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await dataService.getBootstrap(selectedDistrict);
      setData({
        advisories: res.advisories || [],
        corridors: res.corridors || [],
        reports: res.reports || []
      });
    } catch (err) {
      console.error('Failed to load situation board data:', err);
      setError('Unable to load latest feed. Displaying cached offline reports if available.');
      // Attempt cached snapshot
      const cached = await dataService.getCachedSnapshot();
      if (cached) {
        setData({
          advisories: cached.advisories || [],
          corridors: cached.corridors || [],
          reports: cached.reports || []
        });
      }
    } finally {
      setLoading(false);
    }
  }, [selectedDistrict]);

  useEffect(() => {
    loadSituation();
  }, [loadSituation]);

  const handleReportConfirmed = (reportId, newCount) => {
    setData((prev) => ({
      ...prev,
      reports: prev.reports.map((r) =>
        r.id === reportId ? { ...r, confirmations_count: newCount } : r
      )
    }));
  };

  return (
    <div className="space-y-6">
      {/* Hero / Action Bar */}
      <div className="bg-gradient-to-r from-slate-800 via-slate-850 to-slate-800 border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-lg flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping"></span>
            <span className="text-xs font-bold text-rose-300 uppercase tracking-wider">Live Coordination Net</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
            Northeast Community Situation Board
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-xl">
            Real-time flood, mudslide, and lifeline corridor updates across Assam, Meghalaya, and Northeast India.
          </p>
        </div>

        {/* Large Emergency Buttons */}
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <Link
            to="/report?type=help"
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl font-black text-sm bg-rose-600 hover:bg-rose-500 active:bg-rose-700 text-white shadow-lg shadow-rose-950/60 transition-all border border-rose-400/40"
          >
            <AlertTriangle className="w-4 h-4 text-white" />
            <span>Request Help / SOS</span>
          </Link>

          <Link
            to="/report?type=hazard"
            className="flex-1 md:flex-initial inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl font-bold text-sm bg-slate-700 hover:bg-slate-650 active:bg-slate-600 text-slate-100 shadow transition-all border border-slate-600"
          >
            <PlusCircle className="w-4 h-4 text-sky-400" />
            <span>Report Hazard</span>
          </Link>
        </div>
      </div>

      {/* Rainfall Risk Indicator */}
      <RainfallIndicator districtId={selectedDistrict} />

      {/* Content Feed with Skeleton and Error States */}
      {loading ? (
        <div className="space-y-6">
          <SkeletonCard count={2} />
          <SkeletonCard count={3} type="detailed" />
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-amber-950/60 border border-amber-700/60 text-amber-200 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={loadSituation}
            className="px-3 py-1 bg-amber-800 hover:bg-amber-700 rounded-lg text-xs font-bold text-white transition-colors flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Active Advisories */}
          <AdvisoriesList advisories={data.advisories} />

          {/* Lifeline Corridor Board */}
          <CorridorBoard corridors={data.corridors} />

          {/* Ground Reports Feed */}
          <ReportFeed
            reports={data.reports}
            onReportConfirmed={handleReportConfirmed}
          />
        </div>
      )}
    </div>
  );
}
