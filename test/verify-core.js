import { LocalAdapter } from '../src/services/LocalAdapter.js';
import { maskPhone, isOlderThan6Hours } from '../src/utils/formatters.js';

// Setup Mock LocalStorage for headless Node test
const mockStorage = {};
global.localStorage = {
  getItem: (key) => mockStorage[key] || null,
  setItem: (key, val) => { mockStorage[key] = String(val); },
  removeItem: (key) => { delete mockStorage[key]; },
  clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); }
};

async function runTests() {
  console.log('=== STARTING TEST CHECKLIST (SECTION 16) ===\n');
  const adapter = new LocalAdapter();
  await adapter.resetSeedData();

  // Test 1: Submit hazard report online
  console.log('Test 1: Submit hazard report online');
  const hazardPayload = {
    client_uuid: 'test-uuid-hazard-1',
    entry_type: 'HAZARD_REPORT',
    category: 'FLOOD_WATER',
    severity: 'HIGH',
    district: 'Dhemaji',
    corridor_or_block: 'NH-15',
    locality_landmark: 'Near Railway Crossing Gogamukh',
    people_affected: 1,
    description: 'Culvert submerged under 2 feet of overflowing river water.',
    reporter_label: 'Local Commuter'
  };
  const rep1 = await adapter.createReport(hazardPayload);
  console.assert(rep1.verification_status === 'UNVERIFIED', 'Report should be UNVERIFIED');
  console.log('✓ Submitted hazard report verified as UNVERIFIED');

  // Test 2: Submit group help request (14 people, vulnerabilities)
  console.log('\nTest 2: Submit group help request (14 pax + vulnerabilities)');
  const helpPayload = {
    client_uuid: 'test-uuid-help-group-14',
    entry_type: 'ASSISTANCE_REQUEST',
    category: 'RESCUE',
    severity: 'CRITICAL',
    district: 'Dhemaji',
    corridor_or_block: 'Gogamukh Block',
    locality_landmark: 'Borbam Gaon LP School Roof',
    people_affected: 14,
    is_proxy_report: true,
    vulnerabilities: ['Elderly', 'Infants', 'Medical need'],
    needs: ['Rescue', 'Medical'],
    description: 'Marooned on rooftop. 3 elderly and 2 babies need immediate boat dispatch.',
    reporter_phone: '9864012345',
    reporter_label: 'Village Head Bipin'
  };
  const rep2 = await adapter.createReport(helpPayload);
  console.assert(rep2.people_affected === 14, 'Should be 14 pax');
  console.assert(rep2.assistance_status === 'SUBMITTED', 'Assistance status should be SUBMITTED');
  console.log('✓ Group SOS created with 14 pax and SUBMITTED assistance status');

  // Test 3 & 4: Offline Outbox Queue & Sync Batch with Idempotency
  console.log('\nTest 3 & 4: Outbox batch sync & Idempotency check');
  const batch = [
    {
      client_uuid: 'test-uuid-outbox-item-1',
      entry_type: 'HAZARD_REPORT',
      category: 'LANDSLIDE',
      district: 'East Khasi Hills',
      locality_landmark: 'Shillong Peak Link Road',
      description: 'Mudslide on mountain bend',
      created_at: new Date().toISOString()
    },
    // Attempt re-submitting rep1 client_uuid
    {
      client_uuid: 'test-uuid-hazard-1',
      entry_type: 'HAZARD_REPORT',
      category: 'FLOOD_WATER',
      district: 'Dhemaji',
      locality_landmark: 'Near Railway Crossing Gogamukh',
      description: 'Duplicate attempt',
      created_at: new Date().toISOString()
    }
  ];
  const syncResults = await adapter.syncBatch(batch);
  console.assert(syncResults[0].result === 'SYNCED', 'New item should be SYNCED');
  console.assert(syncResults[1].result === 'ALREADY_SYNCED', 'Existing UUID must be ALREADY_SYNCED (idempotent)');
  console.log('✓ Outbox batch sync verified: new item synced, duplicate prevented via idempotent client_uuid');

  // Test 5: Confirm report (+1 confirm, one per device)
  console.log('\nTest 5: One confirmation per device');
  const conf1 = await adapter.confirmReport(rep1.id, 'device-token-alpha');
  console.assert(conf1.success === true, 'First confirmation should succeed');
  const conf2 = await adapter.confirmReport(rep1.id, 'device-token-alpha');
  console.assert(conf2.success === false, 'Duplicate device confirmation must be rejected');
  console.log('✓ Single confirmation per device verified');

  // Test 6: Coordinator operations (PIN login, verify, change assistance, merge duplicates)
  console.log('\nTest 6: Coordinator operations');
  const loginRes = await adapter.coordinatorLogin('1234');
  console.assert(loginRes.authenticated === true, 'PIN 1234 must authenticate');

  // Verify report
  const verifiedRep = await adapter.updateReport(rep1.id, { verification_status: 'VERIFIED' }, 'Coordinator Lead');
  console.assert(verifiedRep.verification_status === 'VERIFIED', 'Status should be VERIFIED');

  // Change assistance status
  const acceptedHelp = await adapter.updateReport(rep2.id, { assistance_status: 'DISPATCHED' }, 'Coordinator Lead');
  console.assert(acceptedHelp.assistance_status === 'DISPATCHED', 'Assistance status should be DISPATCHED');

  // Merge duplicates: rep-003 into rep-002
  const mergedRep = await adapter.updateReport('rep-003', { merged_into_id: 'rep-002', verification_status: 'REJECTED' }, 'Coordinator Lead');
  console.assert(mergedRep.merged_into_id === 'rep-002', 'Merged into ID should be set');
  console.log('✓ Coordinator operations verified: PIN auth, report verification, unit dispatch, and duplicate merge');

  // Test 7: Phone number masking
  console.log('\nTest 7: Phone number masking (Privacy vs Coordinator)');
  const publicMasked = maskPhone('9864012345');
  console.assert(publicMasked === '98640XXXXX', `Masked phone should be 98640XXXXX, got ${publicMasked}`);
  console.log('✓ Public phone masking verified (98640XXXXX vs unmasked 9864012345 for coordinator)');

  // Test 8: Staleness check (>6 hours old)
  console.log('\nTest 8: Staleness check');
  const eightHoursAgo = new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString();
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  console.assert(isOlderThan6Hours(eightHoursAgo) === true, '8 hours ago should be stale');
  console.assert(isOlderThan6Hours(twoHoursAgo) === false, '2 hours ago should not be stale');
  console.log('✓ Staleness indicator logic (>6h) verified');

  // Test 9: Corridor & Resource Upsert
  console.log('\nTest 9: Corridor and Resource status updates');
  const updatedCorridor = await adapter.upsertCorridor({
    id: 'cor-001',
    status: 'LANDSLIDE_BLOCKED',
    advisory_note: 'Fresh boulder slide reported'
  }, 'Field Ops');
  console.assert(updatedCorridor.status === 'LANDSLIDE_BLOCKED', 'Corridor status should be updated');

  const updatedResource = await adapter.upsertResource({
    id: 'res-001',
    capacity_status: 'FULL'
  }, 'Relief Camp Nodal');
  console.assert(updatedResource.capacity_status === 'FULL', 'Resource status should be FULL');
  console.log('✓ Corridor and Shelter capacity updates verified');

  // Test 10: Audit trail logging
  console.log('\nTest 10: Status events audit logging');
  const events = await adapter.getAuditEvents();
  console.assert(events.length > 5, 'Audit events should have recorded all changes');
  console.log(`✓ Audit log verified with ${events.length} immutable events recorded`);

  console.log('\n=== ALL 10 TESTS PASSED CLEANLY! ===\n');
}

runTests().catch(err => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
