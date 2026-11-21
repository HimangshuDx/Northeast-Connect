import React, { useState, useEffect, useCallback } from 'react';
import { 
  Building2, 
  MapPin, 
  Phone, 
  Filter, 
  Package, 
  Clock, 
  Search, 
  BookOpen, 
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import StatusPill from '../components/common/StatusPill';
import TrustBadge from '../components/common/TrustBadge';
import SkeletonCard from '../components/common/SkeletonCard';
import ResourceMap from '../components/resources/ResourceMap';
import SurvivalGuides from '../components/resources/SurvivalGuides';
import HelplinesDirectory from '../components/resources/HelplinesDirectory';
import { formatTimeAgo, isOlderThan6Hours } from '../utils/formatters';
import { useApp } from '../context/AppContext';
import { dataService } from '../services/dataService';
import { DISTRICTS } from '../constants/districts';

const RESOURCE_TYPES = [
  { id: 'ALL', label: 'All Shelters & Points' },
  { id: 'RELIEF_CAMP', label: 'Relief Camps / Shelters' },
  { id: 'MEDICAL_POST', label: 'Medical & First Aid Posts' },
  { id: 'WATER_RATION_POINT', label: 'Drinking Water & Rations' },
  { id: 'BOAT_RESCUE_POINT', label: 'Boat Evacuation Staging' },
];

export default function ResourcesGuides() {
  const { selectedDistrict } = useApp();
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedType, setSelectedType] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('resources'); // 'resources' | 'guides' | 'helplines'

  const loadResources = useCallback(async () => {
    setLoading(true);
    try {
      const res = await dataService.getBootstrap(selectedDistrict);
      setResources(res.resources || []);
    } catch (err) {
      console.warn('Error loading resources, using cached snapshot:', err);
      const cached = await dataService.getCachedSnapshot();
      setResources(cached?.resources || []);
    } finally {
      setLoading(false);
    }
  }, [selectedDistrict]);

  useEffect(() => {
    loadResources();
  }, [loadResources]);

  // Filtered resources
  const filteredResources = resources.filter((res) => {
    if (selectedType !== 'ALL' && res.type !== selectedType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = res.name.toLowerCase().includes(q);
      const matchArea = (res.area || '').toLowerCase().includes(q);
      const matchLandmark = (res.landmark || '').toLowerCase().includes(q);
      const matchSupplies = (res.supplies || []).some(s => s.toLowerCase().includes(q));
      return matchName || matchArea || matchLandmark || matchSupplies;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
          Shelters, Resources & Offline Guides
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 mt-1">
          Find verified relief camps, safe water points, medical aid, and offline disaster safety protocols.
        </p>
      </div>

      {/* Main Section Navigation Tabs */}
      <div className="flex border-b border-slate-700 bg-slate-800/80 p-1.5 rounded-2xl gap-1 shadow-sm">
        <button
          onClick={() => setActiveTab('resources')}
          className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
            activeTab === 'resources'
              ? 'bg-sky-600 text-white shadow-md shadow-sky-950/50'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Shelters Directory</span>
        </button>

        <button
          onClick={() => setActiveTab('guides')}
          className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
            activeTab === 'guides'
              ? 'bg-sky-600 text-white shadow-md shadow-sky-950/50'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Survival Guides</span>
        </button>

        <button
          onClick={() => setActiveTab('helplines')}
          className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
            activeTab === 'helplines'
              ? 'bg-rose-600 text-white shadow-md shadow-rose-950/50'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Phone className="w-4 h-4" />
          <span>Helplines</span>
        </button>
      </div>

      {/* Tab 1: Resources & Shelters */}
      {activeTab === 'resources' && (
        <div className="space-y-6">
          {/* Interactive Leaflet Map View */}
          <ResourceMap
            resources={filteredResources}
            selectedDistrictId={selectedDistrict}
          />

          {/* Search & Filters */}
          <div className="p-4 rounded-2xl bg-slate-800/80 border border-slate-700/80 space-y-3">
            <div className="flex flex-col sm:flex-row gap-3">
              {/* Search Box */}
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search camps, supplies (e.g. food, rations, medicine)..."
                  className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-slate-100 placeholder:text-slate-500"
                />
              </div>

              {/* Type Filter */}
              <div className="sm:w-64">
                <select
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs sm:text-sm text-slate-100 font-semibold cursor-pointer"
                >
                  {RESOURCE_TYPES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span>Showing {filteredResources.length} confirmed facilities</span>
              <span className="text-[11px] text-slate-500">Filtered by {selectedDistrict}</span>
            </div>
          </div>

          {/* Resource Directory Cards */}
          {loading ? (
            <SkeletonCard count={3} type="detailed" />
          ) : filteredResources.length === 0 ? (
            <div className="text-center py-12 rounded-xl bg-slate-800/30 border border-dashed border-slate-700 p-4">
              <Building2 className="w-10 h-10 text-slate-600 mx-auto mb-2" />
              <h3 className="font-bold text-slate-300 text-sm">No Shelters or Resources Found</h3>
              <p className="text-xs text-slate-400 mt-1">Try switching the district or clearing your filter search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredResources.map((res) => {
                const isStale = isOlderThan6Hours(res.last_confirmed_at);

                return (
                  <div
                    key={res.id}
                    className="p-4 sm:p-5 rounded-2xl bg-slate-800/90 border border-slate-700/80 hover:border-slate-600 transition-all flex flex-col justify-between gap-3 shadow-sm"
                  >
                    <div>
                      {/* Top status & type */}
                      <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-1.5 text-xs text-sky-400 font-bold uppercase">
                          <Building2 className="w-4 h-4" />
                          <span>{res.type?.replace(/_/g, ' ')}</span>
                        </div>

                        <StatusPill type="capacity" value={res.capacity_status} />
                      </div>

                      {/* Name & Location */}
                      <h3 className="text-base font-bold text-white mb-1">{res.name}</h3>
                      <div className="flex items-center gap-1 text-xs text-slate-300 font-medium mb-3">
                        <MapPin className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />
                        <span>{res.district} • {res.area} ({res.landmark})</span>
                      </div>

                      {/* Supplies tags */}
                      {res.supplies && res.supplies.length > 0 && (
                        <div className="p-2.5 rounded-xl bg-slate-900/70 border border-slate-750 mb-3 space-y-1.5">
                          <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                            <Package className="w-3 h-3 text-sky-400" />
                            <span>Supplies & Facilities:</span>
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {res.supplies.map((sup, i) => (
                              <span
                                key={i}
                                className="px-2 py-0.5 rounded-md text-[11px] font-medium bg-slate-800 text-slate-200 border border-slate-700"
                              >
                                {sup}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Bottom contact & confirmation metadata */}
                    <div className="pt-3 border-t border-slate-750/80 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-col text-[11px] text-slate-400">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-500" />
                          <span>Updated {formatTimeAgo(res.last_confirmed_at)}</span>
                        </div>
                        {res.updated_by && <span className="text-slate-500">By {res.updated_by}</span>}
                      </div>

                      <div className="flex items-center gap-2">
                        <TrustBadge
                          status={res.verification_status}
                          isDemo={res.is_demo_data}
                          isStale={isStale}
                        />

                        {res.contact_phone && (
                          <a
                            href={`tel:${res.contact_phone}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs transition-colors shadow"
                            aria-label={`Call ${res.name} at ${res.contact_phone}`}
                          >
                            <Phone className="w-3.5 h-3.5" />
                            <span>Call</span>
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Survival Guides */}
      {activeTab === 'guides' && (
        <SurvivalGuides />
      )}

      {/* Tab 3: Official Helplines */}
      {activeTab === 'helplines' && (
        <HelplinesDirectory />
      )}
    </div>
  );
}
