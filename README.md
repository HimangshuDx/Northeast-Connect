# Northeast Connect — Community Emergency Assistant (PS05)

> **Tagline:** Stay Informed. Stay Connected. Stay Prepared.  
> **Problem Statement (PS05):** Several regions of North East India face floods, landslides, and other disasters. During emergencies, communities struggle to access important safety information and emergency resources. Northeast Connect is an offline-first, community-driven emergency web application where citizens, stranded travellers, and proxy reporters can access safety guidance, check lifeline road/shelter status, and request urgent rescue even when networks fail.

---

## 🛡️ Four Core Differentiators

1. **Offline Resilience**: Offline precache for guides, helplines, and cached feeds; local IndexedDB outbox queue holds reports and synchronizes automatically with duplicate prevention when back online.
2. **Trust & Verification Layer**: Every corridor, advisory, and report clearly displays `VERIFIED`, `UNDER REVIEW`, `UNVERIFIED`, `REJECTED`, `STALE`, or `SAMPLE DEMO DATA` badges.
3. **Proxy & Group SOS**: Gaon Burahs (village heads), ASHA workers, and youth club volunteers can report on behalf of marooned clusters and families (up to 500 people) with specific vulnerability flags (infants, elderly, pregnant, medical needs).
4. **Lifeline Corridor Board**: Live passability monitoring of highways (NH-15, NH-27, NH-6), bridges, and Brahmaputra ferry ghats (Majuli–Nimati) categorized as Passable, Single Lane, Landslide Blocked, Submerged, or Closed.

---

## ⚠️ Hard Honesty Disclaimers

- **Emergency Notice**: This application is an information and coordination tool. It does **not** replace official state emergency response services. If you are in immediate life-threatening danger, call **112**.
- **Offline Submissions**: Submissions made while offline are stored securely on the local device only. They have **not** reached emergency teams until synced. The app clearly states: *"Saved on your device. Not yet sent."*
- **Acceptance Status**: An assistance request accepted by a coordinator does **not** indicate rescue is complete. Strict status separation is maintained (`SUBMITTED` -> `ACCEPTED` -> `DISPATCHED` -> `RESOLVED`).
- **Sample Demo Data**: All initial data is simulated for demonstration and marked with the **SAMPLE DEMO DATA** badge.
- **Helplines**: Helpline numbers in the code and directory must be verified locally before real deployment.
- **Coordinator Login**: Coordinator PIN access (`1234`) is an unhardened demonstration access control, not production security.
- **SMS Fallback**: The SMS fallback opens the device's native SMS application with a compact coded payload. Delivery cannot be guaranteed by the server.

---

## 🛠️ Tech Stack

- **Framework**: React 18 + Vite (ES Modules)
- **Styling**: Tailwind CSS (Deep Slate / Navy emergency palette, accessible contrast)
- **Routing**: React Router DOM (v6)
- **Icons**: Lucide React
- **Offline / PWA**: `vite-plugin-pwa` (Workbox Service Worker) + `idb-keyval` (IndexedDB)
- **Mapping**: Leaflet + OpenStreetMap tiles with graceful offline tile fallback
- **Data Architecture**: Adapter pattern (`dataService` -> `LocalAdapter` default, with zero hosting risk and instant reset)

---

## 🚀 Quick Run Instructions

### Prerequisites
- Node.js (v18+ or v20+)
- npm or pnpm

### 1. Install Dependencies
```bash
npm install
```

### 2. Start Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### 3. Production Build & Preview
```bash
npm run build
npm run preview
```

### 4. Run Core Automated Test Suite
```bash
node test/verify-core.js
```

---

## 🌐 Deployment Instructions

The application is built as a static Single Page Application (SPA) with Progressive Web App (PWA) precaching, making it deployable on any free static hosting provider.

### Option A: Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in the project root.
3. Set build command: `npm run build`
4. Set output directory: `dist`

### Option B: Netlify
1. Connect repository in Netlify or use `netlify deploy --prod --dir=dist`.
2. Build command: `npm run build`
3. Publish directory: `dist`
4. Ensure SPA redirect rule exists (`/* /index.html 200` in `_redirects`).

---

## 🎭 2-Minute Demo Script for Hackathon Judges

1. **Problem (20s)**:
   > *"During monsoons in Northeast India, flash floods and mudslides strike rapidly. Cellular networks drop, roads get cut off, and information is scattered across unverified WhatsApp forwards. Communities need a resilient, offline-first tool to survive and coordinate."*
2. **Situation Board (30s)**:
   > *"Show the home screen: Live disaster advisories, the Lifeline Corridor Board showing NH-15 submerged and Sonapur tunnel blocked, and Open-Meteo rainfall indicator for Dhemaji. Notice the Trust Badges and the Stale indicator for items older than 6 hours."*
3. **Offline Resilience & Group SOS (30s)**:
   > *"Simulate going offline in DevTools (Network -> Offline). The app shell, survival guides, and helplines load instantly. Navigate to 'Report / Help'. Check 'I am reporting on behalf of others', enter 14 people affected with Elderly and Infant tags. Submit: The app honestly displays 'Saved on your device. Not yet sent.' Show the Outbox Drawer and the compact SMS fallback (`NE-SOS|DHEMAJI|...`)."*
4. **Reconnection & Deduplication (20s)**:
   > *"Switch back to Online in DevTools and click 'Sync Now'. The outbox flushes to the central board. If a similar report is filed, the Duplicate Hint warns the user and offers a '+1 Confirm' button instead of cluttering the board."*
5. **Coordinator Desk (20s)**:
   > *"Switch to Coordinator tab. Log in with demo PIN `1234`. Inspect the 14-person SOS with unmasked phone number (`9435012345`), dispatch SDRF Unit, verify report, merge duplicate reports (#rep-003 into #rep-002), and update the NH-15 highway status to 'Passable'. Return to Situation Board to show the public feed automatically reflecting the verified state."*

---

## 📋 Features Implemented & Known Limitations

### ✅ Implemented
- **Module 1 (Situation Board)**: District selector, connection monitor, persistent 112 emergency strip, live advisories with severity, Lifeline Corridor Board, Open-Meteo precipitation indicator, community report feed, +1 Confirm mechanism, staleness tags (>6h).
- **Module 2 (Triage Form & Outbox)**: Hazard vs Help toggle, optional GPS detector, proxy/group reporting (1–500 pax), vulnerability tags, required field validation, IndexedDB outbox queue, My Outbox drawer with SMS fallback formatting, duplicate detection hint.
- **Module 3 (Shelters & Guides)**: Resource directory with district and category filters, interactive Leaflet shelter map with custom SVG pins and offline fallback, click-to-call emergency helplines, bundled offline survival guides (Flood, Landslide, Earthquake) with Before/During/After checklists and English/Assamese/Hindi language support.
- **Module 4 (Coordinator Desk)**: Demo PIN authentication, 4 dashboard metric counters, full triage inbox with filters, verification actions, assistance status transitions, duplicate merge functionality with confirmation merging, corridor/shelter status editors, full phone unmasking for authorized responders, audit logging (`status_events`), and CSV manifest export.
- **Offline / PWA**: Full Service Worker precaching with Workbox, offline banner, and auto-sync retry engine.

### ⚠️ Known Limitations & Future Scope
1. **SMS Gateway**: Current SMS fallback generates a pre-filled `sms:` URI for the user's native messaging client. A production version would integrate an SMS gateway (e.g. Twilio/KooKoo) to parse and ingest inbound `NE-SOS` text messages automatically.
2. **Official Ingestion**: Seed data is simulated demo data. In production, automated webhooks from ASDMA, IMD, and CWC (Central Water Commission) feeds would populate verified alerts.
3. **Authentication**: Coordinator login uses a demo PIN. A production rollout would implement OAuth2 / multi-factor government credentials with district-level Role-Based Access Control (RBAC).
