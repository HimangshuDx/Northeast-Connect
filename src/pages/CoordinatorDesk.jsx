import React, { useState, useEffect, useCallback } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  LogOut, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Merge, 
  MapPin, 
  Phone, 
  AlertTriangle, 
  Filter, 
  History, 
  Edit3, 
  Download, 
  Truck,
  Users,
  Navigation,
  Building2,
  RefreshCw,
  Info
} from 'lucide-react';
import StatusPill from '../components/common/StatusPill';
import TrustBadge from '../components/common/TrustBadge';
import { DISTRICTS } from '../constants/districts';
import { formatTimeAgo, isOlderThan6Hours } from '../utils/formatters';
import { dataService } from '../services/dataService';

export default function CoordinatorDesk() {
  // Authentication state (Session in localStorage/memory)
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('ne_coord_auth') === 'true';
  });
  const [pinInput, setPinInput] = useState('');
  const [loginError, setLoginError] = useState(null);

  // Data states
  const [reports, setReports] = useState([]);
  const [corridors, setCorridors] = useState([]);
  const [resources, setResources] = useState([]);
  const [auditEvents, setAuditEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  // Filter states
  const [filterDistrict, setFilterDistrict] = useState('ALL_NE');
  const [filterType, setFilterType] = useState('ALL');
  const [filterVerification, setFilterVerification] = useState('ALL');
  const [filterAssistance, setFilterAssistance] = useState('ALL');

  // Active modal/action states
  const [activeTab, setActiveTab] = useState('inbox'); // 'inbox' | 'corridors' | 'resources' | 'audit'
  const [selectedReport, setSelectedReport] = useState(null);
  const [actionNote, setActionNote] = useState('');
  const [volunteerLabel, setVolunteerLabel] = useState('');
  const [mergeTargetId, setMergeTargetId] = useState('');

  // Editing Corridor / Resource states
  const [editingCorridor, setEditingCorridor] = useState(null);
  const [editingResource, setEditingResource] = useState(null);

  // Load Coordinator Data
  const loadData = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    try {
      const allReports = await dataService.coordinatorListReports({
        district: filterDistrict,
        entry_type: filterType === 'ALL' ? undefined : filterType,
        verification_status: filterVerification,
        assistance_status: filterAssistance
      });
      setReports(allReports);

      const bootstrap = await dataService.getBootstrap('ALL_NE');
      setCorridors(bootstrap.corridors || []);
      setResources(bootstrap.resources || []);

      const events = await dataService.getAuditEvents();
      setAuditEvents(events);
    } catch (err) {
      console.error('Coordinator data fetch failed:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, filterDistrict, filterType, filterVerification, filterAssistance]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Handle Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError(null);
    const res = await dataService.coordinatorLogin(pinInput);
    if (res.authenticated) {
      setIsAuthenticated(true);
      localStorage.setItem('ne_coord_auth', 'true');
    } else {
      setLoginError(res.message);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('ne_coord_auth');
  };

  // Status updates
  const handleUpdateVerification = async (reportId, newStatus) => {
    try {
      await dataService.updateReport(reportId, {
        verification_status: newStatus,
        note: actionNote || `Verification set to ${newStatus}`
      }, 'Coordinator Desk');
      setActionNote('');
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleUpdateAssistance = async (reportId, newStatus) => {
    try {
      const changes = {
        assistance_status: newStatus,
        note: actionNote || `Assistance status set to ${newStatus}`
      };
      if (volunteerLabel.trim()) {
        changes.updated_by = volunteerLabel.trim();
      }
      await dataService.updateReport(reportId, changes, 'Coordinator Desk');
      setActionNote('');
      setVolunteerLabel('');
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Merge Duplicates
  const handleMergeDuplicate = async (sourceReportId) => {
    if (!mergeTargetId) {
      alert('Please select a parent report to merge into.');
      return;
    }
    if (sourceReportId === mergeTargetId) {
      alert('Cannot merge a report into itself.');
      return;
    }

    try {
      await dataService.updateReport(sourceReportId, {
        merged_into_id: mergeTargetId,
        verification_status: 'REJECTED',
        note: `Merged duplicate report #${sourceReportId} into parent #${mergeTargetId}`
      }, 'Coordinator Desk');

      setMergeTargetId('');
      setSelectedReport(null);
      loadData();
      alert(`Report #${sourceReportId} successfully merged into #${mergeTargetId}. Confirmations combined!`);
    } catch (err) {
      alert(err.message);
    }
  };

  // Save Corridor changes
  const handleSaveCorridor = async (e) => {
    e.preventDefault();
    if (!editingCorridor) return;
    try {
      await dataService.upsertCorridor(editingCorridor, 'Coordinator Desk');
      setEditingCorridor(null);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Save Resource changes
  const handleSaveResource = async (e) => {
    e.preventDefault();
    if (!editingResource) return;
    try {
      await dataService.upsertResource(editingResource, 'Coordinator Desk');
      setEditingResource(null);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  // CSV Export (Should-Have requirement)
  const handleExportCSV = () => {
    if (reports.length === 0) return;
    const headers = [
      'ID',
      'Entry Type',
      'Category',
      'Severity',
      'District',
      'Locality',
      'People Affected',
      'Phone (Full)',
      'Reporter',
      'Verification Status',
      'Assistance Status',
      'Confirmations',
      'Created At'
    ];

    const rows = reports.map(r => [
      r.id,
      r.entry_type,
      r.category,
      r.severity,
      `"${r.district}"`,
      `"${(r.locality_landmark || '').replace(/"/g, '""')}"`,
      r.people_affected || 1,
      r.reporter_phone || 'N/A',
      `"${(r.reporter_label || '').replace(/"/g, '""')}"`,
      r.verification_status,
      r.assistance_status || 'N/A',
      r.confirmations_count || 1,
      r.created_at
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ne_connect_manifest_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 1. PIN LOGIN SCREEN
  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto py-12 px-4">
        <div className="p-6 sm:p-8 rounded-2xl bg-slate-800/90 border border-slate-700 shadow-xl space-y-5 text-center">
          <div className="w-14 h-14 bg-sky-950 text-sky-400 rounded-full flex items-center justify-center mx-auto border border-sky-600/40">
            <Lock className="w-7 h-7" />
          </div>

          <div>
            <h1 className="text-xl font-black text-white">Emergency Coordinator Portal</h1>
            <p className="text-xs text-slate-400 mt-1">
              Authorized access for verification officers, dispatchers, and relief nodal leads.
            </p>
          </div>

          {/* Hard Constraint Honesty Disclaimer */}
          <div className="p-3 rounded-xl bg-amber-950/60 border border-amber-600/60 text-xs text-amber-200 text-left space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-amber-300">
              <Info className="w-4 h-4 flex-shrink-0" />
              <span>Demonstration Access Control</span>
            </div>
            <p className="text-[11px] text-amber-100">
              Coordinator PIN login is a demo access control only. It is not production security. Use PIN: <strong className="text-white underline font-mono">1234</strong>
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 text-left">
                Enter Coordinator PIN
              </label>
              <input
                type="password"
                maxLength={8}
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                placeholder="Enter 1234"
                className="w-full text-center tracking-widest text-lg font-mono py-2.5 px-4 bg-slate-900 border border-slate-700 rounded-xl text-white focus:ring-2 focus:ring-sky-500"
                autoFocus
              />
            </div>

            {loginError && (
              <p className="text-xs text-rose-400 font-semibold">{loginError}</p>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-sky-600 hover:bg-sky-500 font-bold text-white text-sm rounded-xl shadow-lg transition-colors"
            >
              Sign In to Coordinator Desk
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Dashboard Counters
  const countOpenHelp = reports.filter(r => r.entry_type === 'ASSISTANCE_REQUEST' && r.assistance_status !== 'RESOLVED' && !r.merged_into_id).length;
  const countUnverified = reports.filter(r => r.verification_status === 'UNVERIFIED' && !r.merged_into_id).length;
  const countBlockedCorridors = corridors.filter(c => c.status === 'LANDSLIDE_BLOCKED' || c.status === 'SUBMERGED' || c.status === 'CLOSED').length;
  const countNearCapacityResources = resources.filter(res => res.capacity_status === 'NEAR_CAPACITY' || res.capacity_status === 'FULL').length;

  return (
    <div className="space-y-6">
      {/* Coordinator Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-2xl bg-slate-800/90 border border-slate-700 shadow-md">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h1 className="text-lg sm:text-xl font-black text-white">Emergency Operations Coordinator Desk</h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Triage ground submissions, verify accuracy, dispatch units, merge duplicates, and audit operations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700 hover:bg-slate-650 text-slate-200 text-xs font-bold transition-colors shadow"
            title="Download CSV manifest of reports"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            <span>Export Manifest (CSV)</span>
          </button>

          <button
            onClick={handleLogout}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-700/60 text-rose-200 text-xs font-bold transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Exit Portal</span>
          </button>
        </div>
      </div>

      {/* 4 Dashboard Metric Counters (Section 6 Module 4) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/50 flex flex-col justify-between">
          <span className="text-[11px] font-bold text-rose-300 uppercase tracking-wider">Open Help Requests</span>
          <div className="text-2xl font-black text-white mt-1">{countOpenHelp}</div>
          <span className="text-[10px] text-rose-400">Marooned & medical urgent</span>
        </div>

        <div className="p-3.5 rounded-xl bg-amber-950/40 border border-amber-800/50 flex flex-col justify-between">
          <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wider">Unverified Reports</span>
          <div className="text-2xl font-black text-white mt-1">{countUnverified}</div>
          <span className="text-[10px] text-amber-400">Needs ground truth check</span>
        </div>

        <div className="p-3.5 rounded-xl bg-sky-950/40 border border-sky-800/50 flex flex-col justify-between">
          <span className="text-[11px] font-bold text-sky-300 uppercase tracking-wider">Blocked Corridors</span>
          <div className="text-2xl font-black text-white mt-1">{countBlockedCorridors}</div>
          <span className="text-[10px] text-sky-400">Submerged / landslide cuts</span>
        </div>

        <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-800/50 flex flex-col justify-between">
          <span className="text-[11px] font-bold text-purple-300 uppercase tracking-wider">Camps Near/At Capacity</span>
          <div className="text-2xl font-black text-white mt-1">{countNearCapacityResources}</div>
          <span className="text-[10px] text-purple-400">Divert incoming evacuees</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-700 bg-slate-800/80 p-1.5 rounded-2xl gap-1">
        <button
          onClick={() => setActiveTab('inbox')}
          className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'inbox' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Triage Reports ({reports.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('corridors')}
          className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'corridors' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Navigation className="w-4 h-4" />
          <span>Manage Corridors ({corridors.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('resources')}
          className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'resources' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Manage Shelters ({resources.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('audit')}
          className={`flex-1 py-2 px-3 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 ${
            activeTab === 'audit' ? 'bg-sky-600 text-white shadow' : 'text-slate-400 hover:text-white'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Audit Log ({auditEvents.length})</span>
        </button>
      </div>

      {/* TAB 1: INBOX / TRIAGE REPORTS */}
      {activeTab === 'inbox' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="p-3.5 rounded-xl bg-slate-800/90 border border-slate-700 flex flex-wrap items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5 text-slate-300 font-bold">
              <Filter className="w-4 h-4 text-sky-400" />
              <span>Filters:</span>
            </div>

            <select
              value={filterDistrict}
              onChange={(e) => setFilterDistrict(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200"
            >
              <option value="ALL_NE">All Districts</option>
              {DISTRICTS.filter(d => d.id !== 'ALL_NE').map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>

            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200"
            >
              <option value="ALL">All Types</option>
              <option value="ASSISTANCE_REQUEST">Help Requests Only</option>
              <option value="HAZARD_REPORT">Hazard Reports Only</option>
            </select>

            <select
              value={filterVerification}
              onChange={(e) => setFilterVerification(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200"
            >
              <option value="ALL">All Verifications</option>
              <option value="UNVERIFIED">UNVERIFIED</option>
              <option value="UNDER_REVIEW">UNDER_REVIEW</option>
              <option value="VERIFIED">VERIFIED</option>
              <option value="REJECTED">REJECTED</option>
            </select>

            <select
              value={filterAssistance}
              onChange={(e) => setFilterAssistance(e.target.value)}
              className="px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-slate-200"
            >
              <option value="ALL">All Assistance Statuses</option>
              <option value="SUBMITTED">SUBMITTED</option>
              <option value="ACCEPTED">ACCEPTED</option>
              <option value="DISPATCHED">DISPATCHED</option>
              <option value="RESOLVED">RESOLVED</option>
            </select>

            <button
              onClick={loadData}
              className="ml-auto p-1.5 bg-slate-700 hover:bg-slate-650 rounded-lg text-slate-200"
              title="Refresh inbox"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* List of Reports */}
          <div className="space-y-3">
            {reports.map((rep) => {
              const isAssistance = rep.entry_type === 'ASSISTANCE_REQUEST';
              const isMerged = Boolean(rep.merged_into_id);

              return (
                <div
                  key={rep.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isMerged
                      ? 'bg-slate-900/60 border-slate-800 opacity-60'
                      : isAssistance
                      ? 'bg-slate-800/95 border-rose-900/60 shadow-sm'
                      : 'bg-slate-800/90 border-slate-700/80 shadow-sm'
                  }`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs font-mono font-bold text-slate-400">#{rep.id}</span>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                        isAssistance ? 'bg-rose-950 text-rose-300 border border-rose-800' : 'bg-sky-950 text-sky-300 border border-sky-800'
                      }`}>
                        {rep.category}
                      </span>

                      {rep.assistance_status && (
                        <StatusPill type="assistance" value={rep.assistance_status} />
                      )}

                      {isMerged && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-950 text-purple-300 border border-purple-800">
                          Merged into #{rep.merged_into_id}
                        </span>
                      )}
                    </div>

                    <TrustBadge
                      status={rep.verification_status}
                      isDemo={rep.is_demo_data}
                      isStale={isOlderThan6Hours(rep.created_at)}
                    />
                  </div>

                  {/* Location & Contact */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs mb-2">
                    <div className="flex items-center gap-1.5 text-slate-300 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-sky-400" />
                      <span>{rep.district} • {rep.locality_landmark} {rep.corridor_or_block && `(${rep.corridor_or_block})`}</span>
                    </div>

                    {/* UNMASKED FULL PHONE NUMBER FOR COORDINATOR */}
                    <div className="flex items-center gap-1.5 text-slate-200">
                      <Phone className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Reporter Phone (Full): </span>
                      {rep.reporter_phone ? (
                        <a
                          href={`tel:${rep.reporter_phone}`}
                          className="font-mono font-bold text-emerald-400 hover:underline flex items-center gap-1 bg-slate-900 px-2 py-0.5 rounded border border-slate-700"
                        >
                          {rep.reporter_phone}
                        </a>
                      ) : (
                        <span className="text-slate-500 italic">None provided</span>
                      )}
                    </div>
                  </div>

                  {/* Details */}
                  {rep.people_affected > 1 && (
                    <div className="p-2 rounded bg-sky-950/40 border border-sky-800/40 text-xs text-sky-200 mb-2 font-semibold">
                      Group SOS: {rep.people_affected} people • {rep.vulnerabilities?.join(', ') || 'General'}
                    </div>
                  )}

                  <p className="text-xs sm:text-sm text-slate-200 bg-slate-900/70 p-3 rounded-lg border border-slate-750 mb-3">
                    {rep.description}
                  </p>

                  {/* Action Controls for Coordinators */}
                  {!isMerged && (
                    <div className="p-3 rounded-xl bg-slate-850 border border-slate-750 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                        <span className="font-bold text-slate-300">Set Verification Trust:</span>
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleUpdateVerification(rep.id, 'VERIFIED')}
                            className="px-2.5 py-1 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-600 text-emerald-300 font-bold rounded-lg text-xs"
                          >
                            Verify
                          </button>
                          <button
                            onClick={() => handleUpdateVerification(rep.id, 'UNDER_REVIEW')}
                            className="px-2.5 py-1 bg-amber-950/80 hover:bg-amber-900 border border-amber-600 text-amber-300 font-bold rounded-lg text-xs"
                          >
                            Under Review
                          </button>
                          <button
                            onClick={() => handleUpdateVerification(rep.id, 'REJECTED')}
                            className="px-2.5 py-1 bg-rose-950/80 hover:bg-rose-900 border border-rose-600 text-rose-300 font-bold rounded-lg text-xs"
                          >
                            Reject / False
                          </button>
                        </div>
                      </div>

                      {/* Assistance Status Controls (Only for help requests) */}
                      {isAssistance && (
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs border-t border-slate-750 pt-2.5">
                          <span className="font-bold text-slate-300">Dispatch / Assistance Status:</span>
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleUpdateAssistance(rep.id, 'ACCEPTED')}
                              className="px-2 py-1 bg-sky-950/80 hover:bg-sky-900 border border-sky-600 text-sky-300 font-bold rounded-lg text-xs"
                            >
                              Accept
                            </button>
                            <button
                              onClick={() => handleUpdateAssistance(rep.id, 'DISPATCHED')}
                              className="px-2 py-1 bg-purple-950/80 hover:bg-purple-900 border border-purple-600 text-purple-300 font-bold rounded-lg text-xs"
                            >
                              Dispatch Unit
                            </button>
                            <button
                              onClick={() => handleUpdateAssistance(rep.id, 'RESOLVED')}
                              className="px-2 py-1 bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-600 text-emerald-300 font-bold rounded-lg text-xs"
                            >
                              Mark Resolved
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Merge Duplicate Control (Section 6 Module 4) */}
                      <div className="border-t border-slate-750 pt-2.5 flex flex-wrap items-center gap-2 text-xs">
                        <span className="font-bold text-slate-300 flex items-center gap-1">
                          <Merge className="w-3.5 h-3.5 text-purple-400" />
                          Merge Duplicate Into:
                        </span>
                        <select
                          value={mergeTargetId}
                          onChange={(e) => setMergeTargetId(e.target.value)}
                          className="px-2 py-1 bg-slate-900 border border-slate-700 rounded-lg text-slate-200 text-xs"
                        >
                          <option value="">Select Target Parent Report...</option>
                          {reports
                            .filter(r => r.id !== rep.id && !r.merged_into_id)
                            .map(r => (
                              <option key={r.id} value={r.id}>
                                #{r.id} - {r.category} ({r.locality_landmark})
                              </option>
                            ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => handleMergeDuplicate(rep.id)}
                          disabled={!mergeTargetId}
                          className="px-3 py-1 bg-purple-700 hover:bg-purple-600 disabled:opacity-40 text-white font-bold rounded-lg text-xs transition-colors"
                        >
                          Confirm Merge
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: CORRIDORS MANAGEMENT */}
      {activeTab === 'corridors' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">Lifeline Arteries & Highway Passability</h2>
            <span className="text-xs text-slate-400">Updates sync to the public Corridor Board immediately</span>
          </div>

          {editingCorridor ? (
            <form onSubmit={handleSaveCorridor} className="p-5 rounded-2xl bg-slate-800 border border-sky-600/60 space-y-4">
              <h3 className="font-bold text-sm text-sky-400">Edit Corridor #{editingCorridor.id}: {editingCorridor.corridor_name}</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Passability Status</label>
                  <select
                    value={editingCorridor.status}
                    onChange={(e) => setEditingCorridor({ ...editingCorridor, status: e.target.value })}
                    className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                  >
                    <option value="PASSABLE">PASSABLE / CLEAR</option>
                    <option value="SINGLE_LANE">SINGLE LANE ONLY</option>
                    <option value="LANDSLIDE_BLOCKED">LANDSLIDE BLOCKED</option>
                    <option value="SUBMERGED">ROAD SUBMERGED</option>
                    <option value="CLOSED">CLOSED</option>
                    <option value="UNKNOWN">UNKNOWN / NOT CONFIRMED</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Verification Badge</label>
                  <select
                    value={editingCorridor.verification_status}
                    onChange={(e) => setEditingCorridor({ ...editingCorridor, verification_status: e.target.value })}
                    className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                  >
                    <option value="VERIFIED">VERIFIED</option>
                    <option value="UNDER_REVIEW">UNDER REVIEW</option>
                    <option value="UNVERIFIED">UNVERIFIED</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Advisory Note</label>
                <input
                  type="text"
                  value={editingCorridor.advisory_note}
                  onChange={(e) => setEditingCorridor({ ...editingCorridor, advisory_note: e.target.value })}
                  className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 font-bold text-white text-xs rounded-lg shadow"
                >
                  Save & Publish Status
                </button>
                <button
                  type="button"
                  onClick={() => setEditingCorridor(null)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : null}

          <div className="grid grid-cols-1 gap-3">
            {corridors.map((c) => (
              <div key={c.id} className="p-4 rounded-xl bg-slate-800/90 border border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-sky-400">{c.district} • {c.corridor_type}</span>
                    <StatusPill type="corridor" value={c.status} />
                  </div>
                  <h4 className="font-bold text-sm text-white">{c.corridor_name}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">{c.advisory_note || 'No notes'}</p>
                </div>

                <button
                  onClick={() => setEditingCorridor(c)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-650 text-slate-200 text-xs font-bold rounded-lg transition-colors flex-shrink-0"
                >
                  <Edit3 className="w-3.5 h-3.5 text-sky-400" />
                  <span>Update Passability</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: SHELTERS MANAGEMENT */}
      {activeTab === 'resources' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">Relief Shelters, Camps & Medical Staging</h2>
            <span className="text-xs text-slate-400">Manage real-time capacity and contact numbers</span>
          </div>

          {editingResource ? (
            <form onSubmit={handleSaveResource} className="p-5 rounded-2xl bg-slate-800 border border-sky-600/60 space-y-4">
              <h3 className="font-bold text-sm text-sky-400">Edit Shelter #{editingResource.id}: {editingResource.name}</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Capacity Status</label>
                  <select
                    value={editingResource.capacity_status}
                    onChange={(e) => setEditingResource({ ...editingResource, capacity_status: e.target.value })}
                    className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white"
                  >
                    <option value="OPEN_AVAILABLE">OPEN &amp; AVAILABLE</option>
                    <option value="NEAR_CAPACITY">NEAR CAPACITY (&gt;85%)</option>
                    <option value="FULL">CAMP FULL</option>
                    <option value="TEMPORARILY_CLOSED">TEMPORARILY CLOSED</option>
                    <option value="UNKNOWN">UNKNOWN / NOT CONFIRMED</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    value={editingResource.contact_phone}
                    onChange={(e) => setEditingResource({ ...editingResource, contact_phone: e.target.value })}
                    className="w-full p-2 bg-slate-900 border border-slate-700 rounded-lg text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-sky-600 hover:bg-sky-500 font-bold text-white text-xs rounded-lg shadow"
                >
                  Save & Publish Shelter
                </button>
                <button
                  type="button"
                  onClick={() => setEditingResource(null)}
                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs rounded-lg"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : null}

          <div className="grid grid-cols-1 gap-3">
            {resources.map((r) => (
              <div key={r.id} className="p-4 rounded-xl bg-slate-800/90 border border-slate-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs font-semibold text-sky-400">{r.district} • {r.type?.replace(/_/g, ' ')}</span>
                    <StatusPill type="capacity" value={r.capacity_status} />
                  </div>
                  <h4 className="font-bold text-sm text-white">{r.name}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">{r.landmark} • Phone: {r.contact_phone || 'None'}</p>
                </div>

                <button
                  onClick={() => setEditingResource(r)}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-700 hover:bg-slate-650 text-slate-200 text-xs font-bold rounded-lg transition-colors flex-shrink-0"
                >
                  <Edit3 className="w-3.5 h-3.5 text-sky-400" />
                  <span>Update Capacity</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: AUDIT TRAIL / STATUS EVENTS */}
      {activeTab === 'audit' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white">Full Verification & Action Audit Trail</h2>
            <span className="text-xs text-slate-400">{auditEvents.length} events logged</span>
          </div>

          <div className="space-y-2">
            {auditEvents.map((evt) => (
              <div key={evt.id} className="p-3.5 rounded-xl bg-slate-800/90 border border-slate-700 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 font-bold text-slate-200">
                    <span className="px-1.5 py-0.5 rounded text-[10px] uppercase bg-slate-900 border border-slate-750 text-sky-400 font-mono">
                      {evt.record_type} #{evt.record_id}
                    </span>
                    <span>Field: <code className="text-amber-300 font-mono">{evt.field}</code></span>
                    {evt.previous_value && <span className="text-slate-400">({evt.previous_value} → {evt.new_value})</span>}
                  </div>
                  <p className="text-slate-300 mt-1 italic">"{evt.note || 'Status updated'}"</p>
                </div>

                <div className="text-[11px] text-slate-400 flex flex-col sm:items-end">
                  <span className="font-semibold text-slate-300">By {evt.updated_by}</span>
                  <span>{formatTimeAgo(evt.created_at)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
