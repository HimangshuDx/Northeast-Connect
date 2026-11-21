import { 
  SEED_ADVISORIES, 
  SEED_CORRIDORS, 
  SEED_RESOURCES, 
  SEED_REPORTS, 
  SEED_STATUS_EVENTS 
} from './seed.js';
import { set, get } from 'idb-keyval';

const STORAGE_KEYS = {
  ADVISORIES: 'ne_data_advisories',
  CORRIDORS: 'ne_data_corridors',
  RESOURCES: 'ne_data_resources',
  REPORTS: 'ne_data_reports',
  CONFIRMATIONS: 'ne_data_confirmations',
  EVENTS: 'ne_data_status_events',
  INITIALIZED: 'ne_data_initialized_v1'
};

// Coordinator demo PIN configured per Section 6 Module 4
const DEMO_COORDINATOR_PIN = '1234';

function loadOrSeed(key, seedData) {
  try {
    const existing = localStorage.getItem(key);
    if (!existing) {
      localStorage.setItem(key, JSON.stringify(seedData));
      return seedData;
    }
    return JSON.parse(existing);
  } catch (err) {
    console.error(`Error reading ${key}:`, err);
    return seedData;
  }
}

function save(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`Error saving ${key}:`, err);
  }
}

export class LocalAdapter {
  constructor() {
    this.ensureInitialized();
  }

  ensureInitialized() {
    if (!localStorage.getItem(STORAGE_KEYS.INITIALIZED)) {
      this.resetSeedData();
    }
  }

  async resetSeedData() {
    save(STORAGE_KEYS.ADVISORIES, SEED_ADVISORIES);
    save(STORAGE_KEYS.CORRIDORS, SEED_CORRIDORS);
    save(STORAGE_KEYS.RESOURCES, SEED_RESOURCES);
    save(STORAGE_KEYS.REPORTS, SEED_REPORTS);
    save(STORAGE_KEYS.CONFIRMATIONS, []);
    save(STORAGE_KEYS.EVENTS, SEED_STATUS_EVENTS);
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, 'true');

    // Also prime IndexedDB cache snapshot
    try {
      await set('ne_cached_feeds', {
        advisories: SEED_ADVISORIES,
        corridors: SEED_CORRIDORS,
        resources: SEED_RESOURCES,
        reports: SEED_REPORTS,
        serverTime: new Date().toISOString()
      });
    } catch (e) {
      console.warn('Could not write seed to IndexedDB cache:', e);
    }
  }

  async getBootstrap(district = 'ALL_NE') {
    const advisories = loadOrSeed(STORAGE_KEYS.ADVISORIES, SEED_ADVISORIES);
    const corridors = loadOrSeed(STORAGE_KEYS.CORRIDORS, SEED_CORRIDORS);
    const resources = loadOrSeed(STORAGE_KEYS.RESOURCES, SEED_RESOURCES);
    const reports = loadOrSeed(STORAGE_KEYS.REPORTS, SEED_REPORTS);

    const filterByDist = (list) => {
      if (!district || district === 'ALL_NE') return list;
      return list.filter(item => item.district === district || item.district === 'ALL_NE');
    };

    const snapshot = {
      advisories: filterByDist(advisories),
      corridors: filterByDist(corridors),
      resources: filterByDist(resources),
      reports: filterByDist(reports).filter(r => !r.merged_into_id), // Exclude merged duplicates from public feed
      serverTime: new Date().toISOString()
    };

    // Update IndexedDB cached snapshot for true offline resilience
    try {
      await set('ne_cached_feeds', snapshot);
    } catch (e) {
      // ignore
    }

    return snapshot;
  }

  async listReports(filters = {}) {
    let reports = loadOrSeed(STORAGE_KEYS.REPORTS, SEED_REPORTS);

    if (filters.district && filters.district !== 'ALL_NE') {
      reports = reports.filter(r => r.district === filters.district);
    }
    if (filters.entry_type) {
      reports = reports.filter(r => r.entry_type === filters.entry_type);
    }
    if (filters.verification_status) {
      reports = reports.filter(r => r.verification_status === filters.verification_status);
    }
    if (filters.exclude_merged) {
      reports = reports.filter(r => !r.merged_into_id);
    }

    // Sort newest first
    reports.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return {
      reports,
      total: reports.length
    };
  }

  async createReport(payload) {
    const reports = loadOrSeed(STORAGE_KEYS.REPORTS, SEED_REPORTS);

    // Idempotency check on client_uuid per Section 9
    const existing = reports.find(r => r.client_uuid === payload.client_uuid);
    if (existing) {
      return { ...existing, alreadyExisted: true };
    }

    const now = new Date().toISOString();
    const newReport = {
      id: 'rep-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      client_uuid: payload.client_uuid || (window.crypto?.randomUUID ? window.crypto.randomUUID() : 'cuuid-' + Date.now()),
      entry_type: payload.entry_type || 'HAZARD_REPORT',
      category: payload.category || 'OTHER',
      severity: payload.severity || 'MODERATE',
      district: payload.district,
      corridor_or_block: payload.corridor_or_block || '',
      locality_landmark: payload.locality_landmark,
      latitude: payload.latitude || null,
      longitude: payload.longitude || null,
      people_affected: Number(payload.people_affected) || 1,
      vulnerabilities: Array.isArray(payload.vulnerabilities) ? payload.vulnerabilities : [],
      needs: Array.isArray(payload.needs) ? payload.needs : [],
      description: payload.description || '',
      reporter_label: payload.reporter_label || 'Citizen Reporter',
      reporter_phone: payload.reporter_phone || null,
      verification_status: 'UNVERIFIED',
      assistance_status: payload.entry_type === 'ASSISTANCE_REQUEST' ? 'SUBMITTED' : null,
      confirmations_count: 1,
      merged_into_id: null,
      is_proxy_report: Boolean(payload.is_proxy_report),
      is_demo_data: true, // honest demo flag
      observed_at: payload.observed_at || now,
      created_at: payload.created_at || now, // preserve client created_at
      synced_at: now,
      updated_at: now
    };

    reports.unshift(newReport);
    save(STORAGE_KEYS.REPORTS, reports);

    // Log creation status event
    this.recordStatusEvent({
      record_type: 'report',
      record_id: newReport.id,
      field: 'verification_status',
      previous_value: null,
      new_value: 'UNVERIFIED',
      updated_by: newReport.reporter_label,
      note: 'Report submitted by community reporter'
    });

    return newReport;
  }

  async syncBatch(items = []) {
    if (!Array.isArray(items) || items.length === 0) return [];
    
    // Anti-spam rule: max 25 items per sync batch per Section 11
    const batch = items.slice(0, 25);
    const results = [];

    for (const item of batch) {
      try {
        if (!item.client_uuid || !item.district || !item.locality_landmark) {
          results.push({ client_uuid: item.client_uuid, result: 'INVALID' });
          continue;
        }

        const res = await this.createReport(item);
        if (res.alreadyExisted) {
          results.push({ client_uuid: item.client_uuid, result: 'ALREADY_SYNCED', id: res.id });
        } else {
          results.push({ client_uuid: item.client_uuid, result: 'SYNCED', id: res.id });
        }
      } catch (err) {
        console.error('Batch sync item failed:', err);
        results.push({ client_uuid: item.client_uuid, result: 'FAILED' });
      }
    }

    return results;
  }

  async confirmReport(reportId, deviceToken) {
    if (!reportId || !deviceToken) {
      throw new Error('Report ID and Device Token are required');
    }

    const confirmations = loadOrSeed(STORAGE_KEYS.CONFIRMATIONS, []);
    const existing = confirmations.find(c => c.report_id === reportId && c.device_token === deviceToken);
    
    if (existing) {
      return { success: false, message: 'You have already confirmed this report.' };
    }

    // Add confirmation
    confirmations.push({
      id: 'conf-' + Date.now(),
      report_id: reportId,
      device_token: deviceToken,
      created_at: new Date().toISOString()
    });
    save(STORAGE_KEYS.CONFIRMATIONS, confirmations);

    // Increment count on report
    const reports = loadOrSeed(STORAGE_KEYS.REPORTS, SEED_REPORTS);
    const report = reports.find(r => r.id === reportId);
    if (report) {
      report.confirmations_count = (report.confirmations_count || 1) + 1;
      report.updated_at = new Date().toISOString();
      save(STORAGE_KEYS.REPORTS, reports);
    }

    return { success: true, count: report ? report.confirmations_count : 1 };
  }

  async coordinatorLogin(pin) {
    // Demo PIN login per Section 6 Module 4 & Section 3
    if (String(pin).trim() === DEMO_COORDINATOR_PIN) {
      return {
        authenticated: true,
        user: { name: 'Demo Emergency Coordinator', role: 'COORDINATOR' },
        token: 'demo-coord-session-' + Date.now()
      };
    }
    return { authenticated: false, message: 'Invalid Coordinator PIN. (Hint: Use demo PIN 1234)' };
  }

  async coordinatorListReports(filters = {}) {
    let reports = loadOrSeed(STORAGE_KEYS.REPORTS, SEED_REPORTS);

    if (filters.district && filters.district !== 'ALL_NE') {
      reports = reports.filter(r => r.district === filters.district);
    }
    if (filters.entry_type) {
      reports = reports.filter(r => r.entry_type === filters.entry_type);
    }
    if (filters.verification_status && filters.verification_status !== 'ALL') {
      reports = reports.filter(r => r.verification_status === filters.verification_status);
    }
    if (filters.assistance_status && filters.assistance_status !== 'ALL') {
      reports = reports.filter(r => r.assistance_status === filters.assistance_status);
    }

    reports.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    return reports;
  }

  async updateReport(id, changes, actor = 'Coordinator') {
    const reports = loadOrSeed(STORAGE_KEYS.REPORTS, SEED_REPORTS);
    const report = reports.find(r => r.id === id);
    if (!report) throw new Error('Report not found');

    const previousValues = {};
    for (const key of Object.keys(changes)) {
      previousValues[key] = report[key];
      report[key] = changes[key];
    }
    report.updated_at = new Date().toISOString();
    save(STORAGE_KEYS.REPORTS, reports);

    // If merging duplicates per Section 6 Module 4:
    // changes.merged_into_id transfers confirmations to target report
    if (changes.merged_into_id) {
      const parentReport = reports.find(r => r.id === changes.merged_into_id);
      if (parentReport) {
        parentReport.confirmations_count = (parentReport.confirmations_count || 1) + (report.confirmations_count || 1);
        parentReport.updated_at = new Date().toISOString();
        save(STORAGE_KEYS.REPORTS, reports);

        this.recordStatusEvent({
          record_type: 'report',
          record_id: changes.merged_into_id,
          field: 'confirmations_count',
          previous_value: parentReport.confirmations_count - (report.confirmations_count || 1),
          new_value: parentReport.confirmations_count,
          updated_by: actor,
          note: `Merged duplicate report #${report.id} into this report`
        });
      }
    }

    // Write audit status event
    for (const key of Object.keys(changes)) {
      if (previousValues[key] !== changes[key]) {
        this.recordStatusEvent({
          record_type: 'report',
          record_id: id,
          field: key,
          previous_value: previousValues[key],
          new_value: changes[key],
          updated_by: actor,
          note: changes.note || `Updated ${key} to ${changes[key]}`
        });
      }
    }

    return report;
  }

  async upsertCorridor(data, actor = 'Coordinator') {
    const corridors = loadOrSeed(STORAGE_KEYS.CORRIDORS, SEED_CORRIDORS);
    let corridor = corridors.find(c => c.id === data.id);
    const now = new Date().toISOString();

    if (corridor) {
      const oldStatus = corridor.status;
      corridor.status = data.status || corridor.status;
      corridor.advisory_note = data.advisory_note || corridor.advisory_note;
      corridor.verification_status = data.verification_status || corridor.verification_status;
      corridor.last_confirmed_at = now;
      corridor.updated_by = actor;

      this.recordStatusEvent({
        record_type: 'corridor',
        record_id: corridor.id,
        field: 'status',
        previous_value: oldStatus,
        new_value: corridor.status,
        updated_by: actor,
        note: data.advisory_note || 'Corridor status updated'
      });
    } else {
      corridor = {
        id: data.id || 'cor-' + Date.now(),
        district: data.district,
        corridor_name: data.corridor_name,
        corridor_type: data.corridor_type || 'HIGHWAY',
        status: data.status || 'UNKNOWN',
        advisory_note: data.advisory_note || '',
        verification_status: 'VERIFIED',
        is_demo_data: true,
        last_confirmed_at: now,
        updated_by: actor
      };
      corridors.push(corridor);
    }

    save(STORAGE_KEYS.CORRIDORS, corridors);
    return corridor;
  }

  async upsertResource(data, actor = 'Coordinator') {
    const resources = loadOrSeed(STORAGE_KEYS.RESOURCES, SEED_RESOURCES);
    let resource = resources.find(r => r.id === data.id);
    const now = new Date().toISOString();

    if (resource) {
      const oldCapacity = resource.capacity_status;
      resource.capacity_status = data.capacity_status || resource.capacity_status;
      if (data.supplies) resource.supplies = data.supplies;
      if (data.contact_phone) resource.contact_phone = data.contact_phone;
      resource.last_confirmed_at = now;
      resource.updated_by = actor;

      this.recordStatusEvent({
        record_type: 'resource',
        record_id: resource.id,
        field: 'capacity_status',
        previous_value: oldCapacity,
        new_value: resource.capacity_status,
        updated_by: actor,
        note: 'Resource capacity updated'
      });
    } else {
      resource = {
        id: data.id || 'res-' + Date.now(),
        district: data.district,
        area: data.area || '',
        name: data.name,
        type: data.type || 'RELIEF_CAMP',
        capacity_status: data.capacity_status || 'UNKNOWN',
        supplies: data.supplies || [],
        landmark: data.landmark || '',
        contact_phone: data.contact_phone || '',
        latitude: data.latitude || null,
        longitude: data.longitude || null,
        verification_status: 'VERIFIED',
        is_demo_data: true,
        last_confirmed_at: now,
        updated_by: actor
      };
      resources.push(resource);
    }

    save(STORAGE_KEYS.RESOURCES, resources);
    return resource;
  }

  recordStatusEvent({ record_type, record_id, field, previous_value, new_value, updated_by, note }) {
    const events = loadOrSeed(STORAGE_KEYS.EVENTS, SEED_STATUS_EVENTS);
    events.unshift({
      id: 'evt-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      record_type,
      record_id,
      field,
      previous_value: previous_value ? String(previous_value) : null,
      new_value: String(new_value),
      updated_by,
      note: note || '',
      created_at: new Date().toISOString()
    });
    save(STORAGE_KEYS.EVENTS, events);
  }

  async getAuditEvents(recordId = null) {
    const events = loadOrSeed(STORAGE_KEYS.EVENTS, SEED_STATUS_EVENTS);
    if (recordId) {
      return events.filter(e => e.record_id === recordId);
    }
    return events;
  }

  async getCachedSnapshot() {
    try {
      const snap = await get('ne_cached_feeds');
      if (snap) return snap;
    } catch (e) {
      console.warn('Could not read from IndexedDB cache:', e);
    }
    return this.getBootstrap('ALL_NE');
  }
}
