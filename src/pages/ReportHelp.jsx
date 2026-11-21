import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { 
  AlertTriangle, 
  MapPin, 
  Phone, 
  Users, 
  Navigation, 
  CheckCircle2, 
  Send, 
  Smartphone, 
  HelpCircle, 
  ShieldAlert, 
  Info,
  Clock,
  ThumbsUp
} from 'lucide-react';
import { DISTRICTS } from '../constants/districts';
import { useApp } from '../context/AppContext';
import { dataService } from '../services/dataService';
import { get, set } from 'idb-keyval';

const VULNERABILITY_OPTIONS = [
  'Elderly',
  'Infants',
  'Pregnant',
  'Medical need',
  'Disabled'
];

const NEEDS_OPTIONS = [
  'Rescue',
  'Medical',
  'Food/Water',
  'Shelter'
];

const HAZARD_CATEGORIES = [
  { id: 'FLOOD_WATER', label: 'Flood Water Overflow' },
  { id: 'LANDSLIDE', label: 'Landslide / Mudslide' },
  { id: 'ROAD_BLOCKAGE', label: 'Road / Highway Blockage' },
  { id: 'EMBANKMENT_BREACH', label: 'Embankment / Dyke Breach' },
  { id: 'BRIDGE_DAMAGE', label: 'Bridge Damage' },
  { id: 'WATERLOGGING', label: 'Severe Waterlogging' },
  { id: 'UNSAFE_LOCATION', label: 'Dangerous Unstable Structure' },
];

const HELP_CATEGORIES = [
  { id: 'RESCUE', label: 'Emergency Evacuation & Boat Rescue' },
  { id: 'MEDICAL', label: 'Critical Medical & First Aid' },
  { id: 'FOOD_WATER', label: 'Drinking Water & Emergency Rations' },
  { id: 'SHELTER', label: 'Temporary Dry Shelter & Evacuation' },
];

export default function ReportHelp() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { selectedDistrict, isOnline, deviceToken, refreshOutbox, setIsOutboxOpen } = useApp();

  // Form Type: 'hazard' | 'help'
  const initialType = searchParams.get('type') === 'hazard' ? 'HAZARD_REPORT' : 'ASSISTANCE_REQUEST';
  const [entryType, setEntryType] = useState(initialType);

  // Form Fields
  const [district, setDistrict] = useState(selectedDistrict === 'ALL_NE' ? 'Dhemaji' : selectedDistrict);
  const [corridorOrBlock, setCorridorOrBlock] = useState('');
  const [localityLandmark, setLocalityLandmark] = useState('');
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsError, setGpsError] = useState(null);

  const [category, setCategory] = useState(initialType === 'HAZARD_REPORT' ? 'FLOOD_WATER' : 'RESCUE');
  const [severity, setSeverity] = useState('HIGH');
  const [peopleAffected, setPeopleAffected] = useState(1);
  const [isProxyReport, setIsProxyReport] = useState(false);
  const [selectedVulnerabilities, setSelectedVulnerabilities] = useState([]);
  const [selectedNeeds, setSelectedNeeds] = useState([]);
  const [description, setDescription] = useState('');
  const [reporterPhone, setReporterPhone] = useState('');
  const [reporterLabel, setReporterLabel] = useState('');

  // UI States
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submissionResult, setSubmissionResult] = useState(null);
  const [duplicateMatch, setDuplicateMatch] = useState(null);

  // Sync category default when entryType changes
  const handleTypeChange = (newType) => {
    setEntryType(newType);
    setCategory(newType === 'HAZARD_REPORT' ? 'FLOOD_WATER' : 'RESCUE');
    setErrors({});
  };

  // Optional GPS coordinates retrieval
  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported by your browser.');
      return;
    }

    setGpsLoading(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(parseFloat(pos.coords.latitude.toFixed(5)));
        setLongitude(parseFloat(pos.coords.longitude.toFixed(5)));
        setGpsLoading(false);
      },
      (err) => {
        setGpsLoading(false);
        setGpsError('Unable to get GPS location. Manual address entry is fully valid.');
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  // Duplicate Hint check (Section 6 Module 2)
  useEffect(() => {
    let active = true;
    const checkDuplicates = async () => {
      if (!localityLandmark || localityLandmark.trim().length < 4) {
        setDuplicateMatch(null);
        return;
      }

      try {
        const { reports } = await dataService.listReports({ district });
        const threeHoursAgo = Date.now() - 3 * 60 * 60 * 1000;
        const landmarkLower = localityLandmark.toLowerCase().trim();

        const match = reports.find((r) => {
          if (r.category !== category) return false;
          if (new Date(r.created_at).getTime() < threeHoursAgo) return false;
          const repLandmark = (r.locality_landmark || '').toLowerCase();
          return repLandmark.includes(landmarkLower) || landmarkLower.includes(repLandmark);
        });

        if (active) {
          setDuplicateMatch(match || null);
        }
      } catch (e) {
        // ignore duplicate check failure
      }
    };

    const timer = setTimeout(checkDuplicates, 400);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [district, category, localityLandmark]);

  // Validation
  const validate = () => {
    const errs = {};

    if (!district || district === 'ALL_NE') {
      errs.district = 'Please select a specific district.';
    }

    if (!localityLandmark || localityLandmark.trim().length < 3) {
      errs.localityLandmark = 'Please enter a clear locality name or prominent landmark (required).';
    }

    if (!description || description.trim().length < 10) {
      errs.description = 'Please provide a brief description (at least 10 characters).';
    } else if (description.length > 500) {
      errs.description = 'Description must not exceed 500 characters.';
    }

    const paxNum = Number(peopleAffected);
    if (isNaN(paxNum) || paxNum < 1 || paxNum > 500) {
      errs.peopleAffected = 'People affected must be between 1 and 500.';
    }

    // Phone validation
    const phoneClean = reporterPhone.replace(/\D/g, '');
    if (entryType === 'ASSISTANCE_REQUEST') {
      if (!phoneClean) {
        errs.reporterPhone = 'Contact phone number is required for rescue assistance requests.';
      } else if (!/^[6-9]\d{9}$/.test(phoneClean)) {
        errs.reporterPhone = 'Please enter a valid 10-digit Indian phone number starting with 6, 7, 8, or 9.';
      }
    } else if (phoneClean && !/^[6-9]\d{9}$/.test(phoneClean)) {
      errs.reporterPhone = 'Invalid phone number format.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleToggleVulnerability = (item) => {
    setSelectedVulnerabilities((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const handleToggleNeed = (item) => {
    setSelectedNeeds((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    const client_uuid = window.crypto?.randomUUID ? window.crypto.randomUUID() : 'uuid-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8);
    const created_at = new Date().toISOString();

    const payload = {
      client_uuid,
      entry_type: entryType,
      category,
      severity,
      district,
      corridor_or_block: corridorOrBlock.trim(),
      locality_landmark: localityLandmark.trim(),
      latitude,
      longitude,
      people_affected: Number(peopleAffected),
      is_proxy_report: isProxyReport,
      vulnerabilities: selectedVulnerabilities,
      needs: selectedNeeds,
      description: description.trim(),
      reporter_phone: reporterPhone.trim() || null,
      reporter_label: reporterLabel.trim() || (isProxyReport ? 'Proxy Reporter' : 'Citizen Reporter'),
      created_at
    };

    try {
      if (navigator.onLine) {
        // Submit directly through dataService
        const res = await dataService.createReport(payload);
        setSubmissionResult({
          status: 'ONLINE_SUCCESS',
          report: res,
          message: 'Your report has been submitted and added to the community board.'
        });
      } else {
        // Offline submit to outbox queue in IndexedDB
        const queue = (await get('ne_outbox_queue')) || [];
        queue.push({
          ...payload,
          sync_status: 'LOCAL_QUEUED'
        });
        await set('ne_outbox_queue', queue);
        await refreshOutbox();

        setSubmissionResult({
          status: 'OFFLINE_QUEUED',
          report: payload,
          message: 'Saved on your device. Not yet sent.'
        });
      }
    } catch (err) {
      console.warn('Online submit failed, queuing offline:', err);
      // Fallback queue in IndexedDB
      const queue = (await get('ne_outbox_queue')) || [];
      queue.push({
        ...payload,
        sync_status: 'LOCAL_QUEUED'
      });
      await set('ne_outbox_queue', queue);
      await refreshOutbox();

      setSubmissionResult({
        status: 'OFFLINE_QUEUED',
        report: payload,
        message: 'Saved on your device. Not yet sent.'
      });
    } finally {
      setSubmitting(false);
    }
  };

  // SMS Fallback triggered from form
  const handleSendViaSms = () => {
    if (!submissionResult?.report) return;
    const rep = submissionResult.report;
    const coordinatorPhone = '9435012345';
    const pax = rep.people_affected || 1;
    const vulnStr = (rep.vulnerabilities && rep.vulnerabilities.length > 0)
      ? rep.vulnerabilities.map(v => v.substring(0, 3).toUpperCase()).join(',')
      : 'NONE';
    const timeStr = new Date(rep.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const landmark = (rep.locality_landmark || 'Unknown').replace(/\|/g, '-');
    const corridor = (rep.corridor_or_block || 'N/A').replace(/\|/g, '-');
    const dist = (rep.district || 'NE').toUpperCase();
    const cat = (rep.category || rep.entry_type).toUpperCase();

    const smsBody = `NE-SOS|${dist}|${corridor}|${cat}|PAX:${pax}|VULN:${vulnStr}|${landmark}|${timeStr}`;
    window.location.href = `sms:${coordinatorPhone}?body=${encodeURIComponent(smsBody)}`;
  };

  // Confirmation of existing duplicate
  const handleConfirmDuplicate = async () => {
    if (!duplicateMatch) return;
    try {
      await dataService.confirmReport(duplicateMatch.id, deviceToken);
      alert('Confirmed existing report! Thank you for reducing duplicate reports.');
      navigate('/');
    } catch (err) {
      console.error(err);
    }
  };

  if (submissionResult) {
    const isOffline = submissionResult.status === 'OFFLINE_QUEUED';

    return (
      <div className="max-w-2xl mx-auto py-8 px-4">
        <div className={`p-6 sm:p-8 rounded-2xl border text-center shadow-xl ${
          isOffline 
            ? 'bg-amber-950/40 border-amber-600/70' 
            : 'bg-slate-800/90 border-emerald-600/60'
        }`}>
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${
            isOffline ? 'bg-amber-900/60 text-amber-300' : 'bg-emerald-950/80 text-emerald-400'
          }`}>
            {isOffline ? <Clock className="w-8 h-8" /> : <CheckCircle2 className="w-8 h-8" />}
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white mb-2">
            {isOffline ? 'Saved Offline' : 'Report Successfully Submitted'}
          </h2>

          <div className={`p-3 rounded-xl font-bold text-sm mb-4 inline-block ${
            isOffline ? 'bg-amber-950 text-amber-200 border border-amber-700' : 'bg-emerald-950 text-emerald-200 border border-emerald-700'
          }`}>
            {submissionResult.message}
          </div>

          <p className="text-xs sm:text-sm text-slate-300 max-w-md mx-auto mb-6">
            {isOffline
              ? 'Your device currently has limited or no connectivity. When you reconnect to data or Wi-Fi, this item will automatically upload to the central dispatch board.'
              : 'Your report is now live on the public feed as UNVERIFIED. Emergency coordinators and local verification teams have been notified.'}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {isOffline ? (
              <>
                <button
                  onClick={handleSendViaSms}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-500 font-bold text-white text-xs rounded-xl shadow transition-colors"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Share via SMS Fallback</span>
                </button>

                <button
                  onClick={() => setIsOutboxOpen(true)}
                  className="w-full sm:w-auto px-4 py-2.5 bg-slate-700 hover:bg-slate-650 font-semibold text-slate-200 text-xs rounded-xl transition-colors"
                >
                  View My Outbox
                </button>
              </>
            ) : (
              <button
                onClick={() => navigate('/')}
                className="w-full sm:w-auto px-6 py-2.5 bg-sky-600 hover:bg-sky-500 font-bold text-white text-xs rounded-xl shadow transition-colors"
              >
                View on Situation Board
              </button>
            )}

            <button
              onClick={() => {
                setSubmissionResult(null);
                setDescription('');
                setLocalityLandmark('');
                setDuplicateMatch(null);
              }}
              className="w-full sm:w-auto px-4 py-2.5 bg-slate-800 hover:bg-slate-750 text-slate-300 text-xs font-semibold rounded-xl border border-slate-700 transition-colors"
            >
              Submit Another Report
            </button>
          </div>

          {isOffline && (
            <p className="text-[11px] text-slate-400 mt-4 italic">
              Opens your SMS app. We cannot confirm delivery.
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          Unified Emergency Triage
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 mt-1">
          Report hazards (floods, landslides, blocked roads) or request urgent assistance. Works completely offline.
        </p>
      </div>

      {/* Step 1 Toggle: Hazard vs Help */}
      <div className="grid grid-cols-2 p-1.5 bg-slate-800/90 rounded-2xl border border-slate-700/80 gap-1.5 shadow-sm">
        <button
          type="button"
          onClick={() => handleTypeChange('ASSISTANCE_REQUEST')}
          className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all ${
            entryType === 'ASSISTANCE_REQUEST'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-950/50'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-750'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Request Urgent Help</span>
        </button>

        <button
          type="button"
          onClick={() => handleTypeChange('HAZARD_REPORT')}
          className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm transition-all ${
            entryType === 'HAZARD_REPORT'
              ? 'bg-sky-600 text-white shadow-md shadow-sky-950/50'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-750'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Report a Hazard</span>
        </button>
      </div>

      {/* Duplicate Hint Banner (Section 6 Module 2) */}
      {duplicateMatch && (
        <div className="p-4 rounded-xl bg-amber-950/70 border border-amber-600/70 shadow-md space-y-2">
          <div className="flex items-center gap-2 text-amber-300 font-bold text-xs sm:text-sm">
            <Info className="w-4 h-4 text-amber-400 flex-shrink-0" />
            <span>Similar Active Report Found Nearby</span>
          </div>
          <p className="text-xs text-amber-100">
            A report for <strong className="text-white">{duplicateMatch.category}</strong> at "{duplicateMatch.locality_landmark}" was already logged recently.
          </p>
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleConfirmDuplicate}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-lg transition-colors shadow"
            >
              <ThumbsUp className="w-3.5 h-3.5" />
              <span>+1 Confirm Existing Report Instead</span>
            </button>
            <span className="text-[11px] text-amber-300">or continue filing a new report below</span>
          </div>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="p-5 sm:p-6 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-5 shadow-lg">
        {/* District & Location */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-1.5">
              District <span className="text-rose-400">*</span>
            </label>
            <select
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-slate-100 font-medium"
            >
              {DISTRICTS.filter(d => d.id !== 'ALL_NE').map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.state})
                </option>
              ))}
            </select>
            {errors.district && <p className="text-[11px] text-rose-400 mt-1">{errors.district}</p>}
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-200 mb-1.5">
              Corridor / Highway / Block Name
            </label>
            <input
              type="text"
              value={corridorOrBlock}
              onChange={(e) => setCorridorOrBlock(e.target.value)}
              placeholder="e.g. NH-15, Gogamukh Block, Sonapur stretch"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-500"
            />
          </div>
        </div>

        {/* Locality & Landmark */}
        <div>
          <label className="block text-xs font-bold text-slate-200 mb-1.5">
            Locality & Landmark <span className="text-rose-400">*</span>
          </label>
          <input
            type="text"
            value={localityLandmark}
            onChange={(e) => setLocalityLandmark(e.target.value)}
            placeholder="e.g. Near LP School, Borbam Village, House #14"
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-500"
          />
          {errors.localityLandmark && <p className="text-[11px] text-rose-400 mt-1">{errors.localityLandmark}</p>}
        </div>

        {/* Optional GPS Button */}
        <div className="p-3 bg-slate-850 rounded-xl border border-slate-750 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Navigation className="w-4 h-4 text-sky-400 flex-shrink-0" />
            <div className="text-xs">
              <span className="font-semibold text-slate-200">Device GPS Coordinates (Optional): </span>
              {latitude && longitude ? (
                <span className="text-emerald-400 font-mono font-bold">{latitude}° N, {longitude}° E</span>
              ) : (
                <span className="text-slate-400">Not recorded</span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {latitude && longitude ? (
              <button
                type="button"
                onClick={() => { setLatitude(null); setLongitude(null); }}
                className="text-xs text-rose-400 hover:text-rose-300 font-medium px-2 py-1"
              >
                Clear GPS
              </button>
            ) : (
              <button
                type="button"
                onClick={handleGetLocation}
                disabled={gpsLoading}
                className="px-3 py-1 bg-slate-700 hover:bg-slate-650 text-sky-300 text-xs font-bold rounded-lg transition-colors"
              >
                {gpsLoading ? 'Detecting...' : 'Detect My Location'}
              </button>
            )}
          </div>
          {gpsError && <p className="text-[11px] text-amber-300 w-full mt-1">{gpsError}</p>}
        </div>

        {/* Category & Severity */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-1.5">
              Category <span className="text-rose-400">*</span>
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-slate-100 font-medium"
            >
              {(entryType === 'HAZARD_REPORT' ? HAZARD_CATEGORIES : HELP_CATEGORIES).map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-200 mb-1.5">
              Severity Level <span className="text-rose-400">*</span>
            </label>
            <select
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-slate-100 font-medium"
            >
              <option value="CRITICAL">CRITICAL (Immediate danger / marooned / breach)</option>
              <option value="HIGH">HIGH (Severe obstruction / rising water)</option>
              <option value="MODERATE">MODERATE (Cautious movement / waterlogging)</option>
            </select>
          </div>
        </div>

        {/* Proxy / Group SOS Toggle (Section 1 Differentiator 3) */}
        <div className="p-3.5 rounded-xl bg-slate-850 border border-slate-750 space-y-3">
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isProxyReport}
              onChange={(e) => setIsProxyReport(e.target.checked)}
              className="w-4 h-4 rounded text-sky-600 focus:ring-sky-500 bg-slate-900 border-slate-700"
            />
            <span className="text-xs sm:text-sm font-bold text-white">
              I am reporting on behalf of others (Proxy / Village Leader / Group SOS)
            </span>
          </label>

          {isProxyReport && (
            <p className="text-[11px] text-sky-300">
              Gaon Burahs, ASHA workers, and youth club volunteers can report marooned clusters and stranded families simultaneously.
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1">
                Number of People Affected (1–500) <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                min="1"
                max="500"
                value={peopleAffected}
                onChange={(e) => setPeopleAffected(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs sm:text-sm text-white font-mono"
              />
              {errors.peopleAffected && <p className="text-[11px] text-rose-400 mt-1">{errors.peopleAffected}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-200 mb-1">
                Reporter Role / Title (Optional)
              </label>
              <input
                type="text"
                value={reporterLabel}
                onChange={(e) => setReporterLabel(e.target.value)}
                placeholder="e.g. Village Head Bipin, ASHA Worker, Student Volunteer"
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs sm:text-sm text-white placeholder:text-slate-500"
              />
            </div>
          </div>
        </div>

        {/* Vulnerabilities (Section 6 Module 2) */}
        <div>
          <label className="block text-xs font-bold text-slate-200 mb-1.5">
            Vulnerability Factors Present (Select all that apply)
          </label>
          <div className="flex flex-wrap gap-2">
            {VULNERABILITY_OPTIONS.map((vuln) => {
              const selected = selectedVulnerabilities.includes(vuln);
              return (
                <button
                  type="button"
                  key={vuln}
                  onClick={() => handleToggleVulnerability(vuln)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    selected
                      ? 'bg-rose-950 text-rose-300 border border-rose-600'
                      : 'bg-slate-900 text-slate-400 border border-slate-700 hover:text-slate-200'
                  }`}
                >
                  {selected ? '✓ ' : '+ '}{vuln}
                </button>
              );
            })}
          </div>
        </div>

        {/* Specific Needs */}
        {entryType === 'ASSISTANCE_REQUEST' && (
          <div>
            <label className="block text-xs font-bold text-slate-200 mb-1.5">
              Specific Needs Required
            </label>
            <div className="flex flex-wrap gap-2">
              {NEEDS_OPTIONS.map((need) => {
                const selected = selectedNeeds.includes(need);
                return (
                  <button
                    type="button"
                    key={need}
                    onClick={() => handleToggleNeed(need)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      selected
                        ? 'bg-amber-950 text-amber-300 border border-amber-600'
                        : 'bg-slate-900 text-slate-400 border border-slate-700 hover:text-slate-200'
                    }`}
                  >
                    {selected ? '✓ ' : '+ '}{need}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Description */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="block text-xs font-bold text-slate-200">
              Situation Description <span className="text-rose-400">*</span>
            </label>
            <span className="text-[11px] text-slate-400">
              {description.length}/500
            </span>
          </div>
          <textarea
            rows="3"
            maxLength={500}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the current ground condition, depth of water, number of infants, or any immediate hazards..."
            className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-500"
          ></textarea>
          {errors.description && <p className="text-[11px] text-rose-400 mt-1">{errors.description}</p>}
        </div>

        {/* Phone Input */}
        <div>
          <label className="block text-xs font-bold text-slate-200 mb-1.5">
            Contact Phone Number {entryType === 'ASSISTANCE_REQUEST' ? <span className="text-rose-400">*</span> : <span className="text-slate-400 font-normal">(Optional)</span>}
          </label>
          <div className="relative">
            <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
            <input
              type="tel"
              value={reporterPhone}
              onChange={(e) => setReporterPhone(e.target.value)}
              placeholder="e.g. 9864012345 (10-digit number)"
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-500 font-mono"
            />
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Privacy notice: Phone numbers are masked (e.g. 98640XXXXX) on public views and only visible to authorized coordinators.
          </p>
          {errors.reporterPhone && <p className="text-[11px] text-rose-400 mt-1">{errors.reporterPhone}</p>}
        </div>

        {/* Submission Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting}
            className={`w-full py-3.5 px-4 rounded-xl font-bold text-sm text-white shadow-lg transition-all flex items-center justify-center gap-2 ${
              entryType === 'ASSISTANCE_REQUEST'
                ? 'bg-rose-600 hover:bg-rose-500 active:bg-rose-700 shadow-rose-950/60'
                : 'bg-sky-600 hover:bg-sky-500 active:bg-sky-700 shadow-sky-950/60'
            }`}
          >
            <Send className="w-4 h-4" />
            <span>
              {submitting
                ? 'Saving Report...'
                : isOnline
                ? entryType === 'ASSISTANCE_REQUEST' ? 'Submit Urgent Help Request' : 'Submit Hazard Report'
                : 'Save Offline to Device Outbox'}
            </span>
          </button>
        </div>

        {!isOnline && (
          <div className="p-3 rounded-xl bg-amber-950/50 border border-amber-600/50 text-xs text-amber-200 text-center font-medium">
            You are offline. Submitting will securely store this report in your local device queue and trigger auto-sync when back online.
          </div>
        )}
      </form>
    </div>
  );
}
