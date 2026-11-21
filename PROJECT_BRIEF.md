# PROJECT BRIEF: NORTHEAST CONNECT — Community Emergency Assistant (PS05)

## 0. HOW YOU (THE AI BUILDER) MUST WORK
You are acting as a senior full-stack engineer, product architect and UI/UX designer.
Context: a 5-hour solo/small-team "vibe coding" hackathon. Judges score PROBLEM SOLVING and IDEA STRENGTH. The builder is a beginner programmer, so the code must be simple, readable and easy to run.

Rules:
1. Do NOT ask for approval before coding. Read this whole brief, then build phase by phase (Section 14).
2. After each phase: make sure the app runs without errors, give a 3-line summary, then continue to the next phase.
3. Build ONE feature at a time. Never leave half-working features. If a Should-Have feature breaks and cannot be fixed quickly, remove it.
4. Every button must do something real. No fake buttons, no simulated integrations presented as real.
5. Never claim a feature works unless you ran it. Report what you tested and what you did not.
6. Keep dependencies minimal. No paid APIs, no API keys required to run the demo.
7. Do not add AI chatbots, predictions, or features that do not solve a listed problem.
8. At the end, provide: run instructions, deploy instructions, a demo script, and a list of known limitations.

## 1. PRODUCT
**Name:** Northeast Connect
**Tagline:** Stay Informed. Stay Connected. Stay Prepared.
**Problem statement (PS05):** Several regions of North East India face floods, landslides and other disasters. During emergencies, communities struggle to access important safety information and emergency resources. Build a web-based platform that helps people access essential emergency information, stay informed and connect with relevant assistance.

**Core insight:** Information is useful only if people can access it, trust it and act on it. During disasters, networks fail and information is scattered (WhatsApp forwards, rumours, separate official notices).

**Solution in one line:** An offline-first, community-driven emergency web app where people can read safety guidance and road/shelter status, report hazards or request help (even as a group), see which information is verified, and where coordinators verify reports and update statuses.

**Four differentiators (use these in the pitch):**
1. Offline resilience: guides, helplines and last-synced data work with no internet; submissions queue and sync later.
2. Trust layer: every item shows Verified / Unverified / Demo / Stale badges.
3. Proxy/group SOS: a village head, ASHA worker or volunteer can report for many families at once.
4. Lifeline corridor board: highway/road/ferry passability by district, which matters in NE India where one blocked highway cuts off regions.

## 2. USERS
- Affected citizens (including rural, elderly, low-digital-literacy users)
- Stranded travellers (may not know village or district; use landmark and highway name)
- Proxy reporters (village head / Gaon Burah, ASHA workers, youth club volunteers)
- Coordinators/volunteers (verify reports, update statuses, merge duplicates)
Design for stress: large tap targets, plain language, few steps, high contrast.

## 3. HARD CONSTRAINTS AND HONESTY RULES (MUST BE ENFORCED IN THE UI)
- The app is an information and coordination tool. It does NOT replace official emergency services. Show a permanent line: "In immediate danger, call 112."
- An offline submission has NOT reached anyone. Show: "Saved on your device. Not yet sent."
- Acceptance by a volunteer does NOT mean rescue is complete. Keep separate statuses.
- Never show unverified shelters/roads as safe. Unknown status is displayed as "Unknown / not confirmed".
- All seed data must carry is_demo_data = true and show a "SAMPLE DEMO DATA" badge. Never present it as real-time conditions.
- Helpline numbers in the code must be marked "verify before real use" in a comment/README.
- Coordinator PIN login is a DEMO access control only. Say so in the README. It is not production security.
- The SMS fallback only opens the phone's SMS app with a pre-filled message. Delivery is not tracked and nothing is received by the server. Label it exactly like this in the UI: "Opens your SMS app. We cannot confirm delivery."

## 4. TECH STACK (SIMPLE, DEPLOYABLE ON FREE HOSTING)
- Frontend: React 18 + Vite + Tailwind CSS (JavaScript is fine; TypeScript optional)
- Icons: lucide-react (bundled locally)
- Offline/PWA: vite-plugin-pwa (Workbox) + idb-keyval (IndexedDB) for the outbox and cached data
- Routing: react-router-dom
- Map (Should-Have): Leaflet + OpenStreetMap tiles, with a graceful fallback list when tiles fail
- Data layer: a single `dataService` module with an interface, and TWO adapters:
  1. LocalAdapter (DEFAULT): data stored in browser localStorage/IndexedDB, seeded from `seed.js`. Works with zero setup and zero hosting risk.
  2. SupabaseAdapter (OPTIONAL, only if time permits): same interface, uses Supabase free tier (Postgres). Enabled only if env vars exist.
  The UI must never call storage directly, only `dataService`. This keeps the demo safe if the backend fails.
- Deployment: Vercel or Netlify (static). Do NOT use Express + SQLite on Vercel/Netlify (no persistent disk). If a custom backend is truly required, use Render.
- Language: English first; Assamese and Hindi toggle for guides and main labels (Should-Have).

## 5. HIGH-LEVEL ARCHITECTURE
Browser (PWA)
- UI pages: Situation Board, Report/Request Help, Shelters & Guides, Coordinator Desk
- Service worker: precache app shell, guides JSON, helplines JSON (CacheFirst)
- dataService (adapter pattern): LocalAdapter | SupabaseAdapter
- IndexedDB stores: outbox_queue, cached_feeds, device_meta
- Sync engine: flushes outbox when online
- Optional external, no key: Open-Meteo rainfall API (labelled "indicator, not an official forecast")

## 6. MODULES AND FEATURES

### Module 1: Situation Board (home)
Problem: information is scattered; people do not know what is blocked or active.
- Top bar: connection status (Online / Offline – cached data) and "Last synced: X min ago".
- Persistent emergency strip: "Immediate danger? Call 112".
- District selector (saved in device_meta).
- Advisories list with severity (Red / Orange / Yellow), source, issued/expiry time, trust badge.
- Rainfall risk indicator (Should-Have): Open-Meteo precipitation for the selected district's coordinates, shown as Low / Medium / High with the label "Rainfall indicator. Not an official forecast." Handle API failure gracefully.
- Lifeline Corridor Board: roads/highways/bridges/ferries with status PASSABLE / SINGLE_LANE / LANDSLIDE_BLOCKED / SUBMERGED / CLOSED, advisory note, last confirmed time, trust badge.
- Community report feed: category, location text, time, people affected (if help request), verification badge, "+1 Confirm" button (one confirmation per device).
- Staleness rule: any corridor/resource/report older than 6 hours shows an amber "Stale – verify locally" tag.

### Module 2: Report / Request Help (unified triage form)
Problem: under stress, people cannot decide which form to use; proxy reporters need group support.
- Step 1 toggle: "Report a hazard" or "Request urgent help".
- Fields: district, block/highway corridor, locality/landmark (required), optional GPS button (uses navigator.geolocation; if denied or fails, manual entry still works), category, severity, description, people affected (1–500), vulnerability tags (Elderly, Infants, Pregnant, Medical need, Disabled), needs (Rescue, Medical, Food/Water, Shelter), contact phone (optional for hazard, required for help request), reporter name/label (optional).
- Group/proxy toggle: "I am reporting for others".
- Validation: required fields, phone format, count bounds, max text length. Clear inline error messages.
- Submit logic:
  - Generate client_uuid (crypto.randomUUID()) and created_at.
  - Online: submit through dataService; on success show "Submitted" and add to feed marked UNVERIFIED.
  - Offline or failure: save to outbox_queue with sync_status LOCAL_QUEUED and show "Saved on your device. Not yet sent."
- "My Outbox" drawer: lists queued items with status, retry, edit, delete, "Share via SMS" button.
- SMS fallback: builds an `sms:` URI with a compact text such as `NE-SOS|DHEMAJI|NH15-GOGAMUKH|RESCUE|PAX:14|VULN:ELD|Near LP School|08:45` to a coordinator phone number. Label: "Opens your SMS app. We cannot confirm delivery."
- Duplicate hint (Should-Have): before submit, warn if a similar report (same district + category + landmark text match within 3 hours) exists, with a "+1 Confirm existing report" option.

### Module 3: Shelters, Resources and Survival Guides
Problem: people travel to full or unstocked camps; guidance is not available offline.
- Resource directory: relief camps, medical posts, water/ration points, boat rescue points.
- Fields shown: name, district/area, landmark, contact (tel: link), capacity status (OPEN_AVAILABLE / NEAR_CAPACITY / FULL / TEMPORARILY_CLOSED / UNKNOWN), supplies tags, last confirmed time, trust badge. Filter by district and type.
- Helplines: 112 (national emergency), 108 (ambulance), 100 (police), 101 (fire), 1070 (Assam state disaster control), 1077 (district control room). Click-to-call (tel:). Mark "verify before real use" in code.
- Survival guides (bundled offline JSON): Flood, Landslide, Earthquake, each with Before / During / After checklists, large text, icons. English first; Assamese/Hindi toggle if time permits.
- Optional map view (Should-Have): Leaflet pins for resources and reports; if tiles do not load, show a message and keep the list usable.

### Module 4: Coordinator Desk
Problem: community reports become misinformation without review; duplicates cause confusion.
- Demo PIN login (PIN from env or config; labelled demo).
- Inbox of reports/requests with filters (district, type, verification status, assistance status).
- Actions: set verification (UNDER_REVIEW, VERIFIED, REJECTED), set assistance status (SUBMITTED, ACCEPTED, DISPATCHED, RESOLVED), assign volunteer label, add note, merge duplicates (set merged_into_id and add confirmations to parent).
- Update corridor status and resource capacity status (updates last_confirmed_at and records who/when).
- Every action writes a status_events/audit entry (who, previous value, new value, timestamp).
- Show full phone numbers only here; public views mask phones (e.g., 98765XXXXX).
- Dashboard counters: open help requests, unverified reports, blocked corridors, resources near capacity.

## 7. THREE SEPARATE STATUS FIELDS (DO NOT MIX THEM)
- sync_status (device/network): LOCAL_QUEUED, SYNCING, SYNCED, FAILED
- verification_status (information trust): UNVERIFIED, UNDER_REVIEW, VERIFIED, REJECTED
- assistance_status (help workflow): SUBMITTED, ACCEPTED, DISPATCHED, RESOLVED (only for help requests)

## 8. DATA MODEL
reports
- id, client_uuid (unique), entry_type (HAZARD_REPORT | ASSISTANCE_REQUEST), category, severity, district, corridor_or_block, locality_landmark, latitude (nullable), longitude (nullable), people_affected, vulnerabilities (array), needs (array), description, reporter_label, reporter_phone, verification_status, assistance_status (nullable), confirmations_count, merged_into_id (nullable), is_proxy_report (bool), is_demo_data (bool), observed_at, created_at, synced_at, updated_at

confirmations
- id, report_id, device_token, created_at; unique(report_id, device_token)

corridors
- id, district, corridor_name, corridor_type (HIGHWAY, RURAL_ROAD, BRIDGE, FERRY_GHAT), status (PASSABLE, SINGLE_LANE, LANDSLIDE_BLOCKED, SUBMERGED, CLOSED, UNKNOWN), advisory_note, verification_status, is_demo_data, last_confirmed_at, updated_by

resources
- id, district, area, name, type (RELIEF_CAMP, MEDICAL_POST, WATER_RATION_POINT, BOAT_RESCUE_POINT), capacity_status, supplies (array), landmark, contact_phone, latitude/longitude (nullable), verification_status, is_demo_data, last_confirmed_at, updated_by

advisories
- id, district (or ALL_NE), hazard_type (FLOOD, FLASH_FLOOD, LANDSLIDE, STORM, GENERAL), severity (RED, ORANGE, YELLOW), title, instructions_en, instructions_as (nullable), instructions_hi (nullable), source_label, is_demo_data, issued_at, expires_at

status_events
- id, record_type, record_id, field, previous_value, new_value, updated_by, note, created_at

Local-only device_meta: device_token (UUID), selected_district, language, last_bootstrap_at.

## 9. DATA SERVICE INTERFACE (BOTH ADAPTERS MUST IMPLEMENT)
- getBootstrap(district) -> { advisories, corridors, resources, reports, serverTime }
- listReports(filters)
- createReport(payload) -> idempotent on client_uuid
- syncBatch(items[]) -> [{ client_uuid, result: SYNCED | ALREADY_SYNCED | INVALID, id }]
- confirmReport(reportId, deviceToken) -> one per device
- coordinatorLogin(pin)
- coordinatorListReports(filters)
- updateReport(id, changes, actor) -> writes status_events; supports merge
- upsertCorridor(data, actor), upsertResource(data, actor)

## 10. OFFLINE-FIRST DESIGN
- Precache (CacheFirst): app shell, JS/CSS, icons, guides.json, helplines.json.
- Runtime data: try network first with 3-second timeout; on failure serve the last cached snapshot from IndexedDB and show "Offline – last synced X min ago".
- Outbox: submissions saved in IndexedDB keyed by client_uuid. States: LOCAL_QUEUED -> SYNCING -> SYNCED or FAILED.
- Sync triggers: window "online" event, manual "Sync now" button, and a 30-second retry while items are queued, with exponential backoff and retry_count.
- Idempotency: the same client_uuid must never create a duplicate record.
- Preserve the original created_at; record synced_at separately.

## 11. SECURITY, PRIVACY AND RELIABILITY
- Mask phone numbers on all public views; show full numbers only in the Coordinator Desk.
- Validate and sanitize all input; escape rendered text (no raw HTML injection).
- Collect minimal personal data; contact phone is optional for hazard reports.
- Anti-spam (client side + adapter level): cooldown between submissions, one confirmation per device, max 25 items per sync batch.
- Coordinator PIN is demo-only; never hard-code a real secret; read from env/config and document this.
- Every list view must have: loading skeleton, empty state, offline state, and error state with retry. Failed saves must never lose the user's typed data.
- Error boundary at app level with a friendly message and a "reload" button.

## 12. UI/UX DESIGN SYSTEM
- Mobile-first, responsive (mobile, tablet, desktop). Bottom navigation on mobile with 4 tabs: Situation, Report/Help, Resources, Coordinator.
- Palette: deep slate/navy base for readability and battery saving, calm blue primary, alert red for SOS/critical, amber for stale/warning, green for verified/passable. Support a light theme toggle.
- Typography: system fonts or a bundled font, base size 16px or larger, high contrast (WCAG AA).
- Components: TrustBadge, StatusPill, SeverityBadge, OfflineBanner, OutboxDrawer, EmergencyStrip, SkeletonCard, EmptyState.
- A large, always reachable "Request Help" button on the home screen.
- Accessibility: labels on all inputs, focus states, aria attributes, tap targets of 44px or more.

## 13. SEED DATA (ALL is_demo_data = true; REALISTIC BUT CLEARLY SAMPLE)
Districts: Kamrup Metropolitan (Guwahati), Dhemaji, Lakhimpur, Majuli, Barpeta, Dibrugarh, Cachar, etc.

## 14. BUILD PHASES
Phase 1: Setup and design system
Phase 2: Data layer (seed, LocalAdapter, dataService, device_meta)
Phase 3: Situation Board (advisories, corridors, feed, +1 confirm)
Phase 4: Report / Request Help (form, group/proxy, outbox, SMS fallback)
Phase 5: Shelters and Guides (directory, filters, helplines, guides, map)
Phase 6: Coordinator Desk (PIN login, verify, merge, corridor/resource edit, audit log)
Phase 7: PWA and offline (service worker, cache, sync engine)
Phase 8: Polish, README, demo script, tests
