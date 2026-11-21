import { LocalAdapter } from './LocalAdapter.js';

// Default adapter is LocalAdapter
const adapter = new LocalAdapter();

export const dataService = {
  getBootstrap: (district) => adapter.getBootstrap(district),
  listReports: (filters) => adapter.listReports(filters),
  createReport: (payload) => adapter.createReport(payload),
  syncBatch: (items) => adapter.syncBatch(items),
  confirmReport: (reportId, deviceToken) => adapter.confirmReport(reportId, deviceToken),
  coordinatorLogin: (pin) => adapter.coordinatorLogin(pin),
  coordinatorListReports: (filters) => adapter.coordinatorListReports(filters),
  updateReport: (id, changes, actor) => adapter.updateReport(id, changes, actor),
  upsertCorridor: (data, actor) => adapter.upsertCorridor(data, actor),
  upsertResource: (data, actor) => adapter.upsertResource(data, actor),
  resetSeedData: () => adapter.resetSeedData(),
  getAuditEvents: (recordId) => adapter.getAuditEvents(recordId),
  getCachedSnapshot: () => adapter.getCachedSnapshot()
};
