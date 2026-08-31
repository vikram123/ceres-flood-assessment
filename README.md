# Flood Damage Assessment — Madison County (Frontend)

An offline-first, mobile-friendly React app for field assessors documenting
flood damage at chicken farms in Madison County, NC, for Ceres.

## Setup

```bash
npm install
npm run dev       # local dev server
npm run build      # production build → dist/
npm run preview    # preview the production build
```

Optionally point the app at a backend API for syncing:

```bash
# .env
VITE_API_BASE_URL=https://your-api.example.com
```

If unset, the app still works fully offline — captured data just accumulates
locally until an API base URL is configured and connectivity is available.

## The core constraint: no internet in the field

The brief states assessors only get reliable internet back at the hotel.
Every design decision here follows from that:

- **Data is written to IndexedDB first, always.** The network is never in
  the critical path of saving a site visit — `saveAssessment()` in `db.js`
  is a pure local write. A save can never fail because of a bad connection.
- **IndexedDB over localStorage.** Each site can have several photos;
  localStorage's ~5MB string-only quota fills up fast once photos are
  involved. IndexedDB stores `Blob`/`File` objects natively and has a much
  higher practical quota.
- **GPS instead of address geocoding.** `navigator.geolocation` uses
  satellites, not cell signal, so lat/long capture works with zero bars.
  Reverse-geocoding the address is deliberately *not* done client-side (that
  would need network) — the assessor types the address themselves.
- **The app shell is precached (PWA plugin)** so the app itself opens and
  works with no connectivity at all, not just the data layer.
- **Sync is opportunistic, not required.** A status bar shows online/offline
  and a pending-sync count. Sync fires automatically when the browser
  detects it's back online, or on manual tap. A failed upload just leaves
  that record `pending` for the next attempt — nothing is lost or blocked.

## Architecture

```
src/
  db.js                  IndexedDB wrapper — the single source of truth
  utils/geolocation.js   GPS capture
  utils/syncService.js   Uploads pending records when online
  components/
    AssessmentForm.jsx    Capture screen (address, GPS, condition, count, photos, notes)
    AssessmentList.jsx    Home screen — all logged sites
    AssessmentDetail.jsx  Single site view + delete
    ConditionTag.jsx      Good/Moderate/Bad visual tag
    SyncBar.jsx           Pending-sync banner + manual sync
    ConnectionPill.jsx    Online/offline/syncing indicator
  App.jsx                 View routing + sync orchestration
  App.css                 All styling (no CSS framework)
```

Each assessment record:

```js
{
  id, address, latitude, longitude, gpsAccuracy,
  condition,        // 'good' | 'moderate' | 'bad'
  chickenCount,
  notes,
  photos: [{ id, blob, name }],   // raw File blobs, stored in IndexedDB
  syncStatus,        // 'pending' | 'syncing' | 'synced'
  createdAt
}
```

No client-side routing library — three views (`list` / `form` / `detail`)
are simple local state in `App.jsx`. A field tool with three screens doesn't
need React Router; adding one would be complexity the brief doesn't ask for.

No state-management library — `App.jsx` owns the assessments array and
passes callbacks down. At this scale, prop drilling is more legible than a
store.

## Assumptions

- **The extra fields beyond the four required** (address, condition,
  chicken count, photos) are GPS lat/long (required) plus a free-text
  **notes** field for anything field teams should flag — access issues,
  structural damage, hazards — since the brief invited useful additions for
  field teams.
- **Photos are captured, not selected from a gallery**, via
  `capture="environment"` on the file input, so the flow is camera-first on
  a phone — but a device without a camera (or desktop testing) can still
  pick existing image files.
- **No login/auth** is implemented — out of scope for the assignment brief,
  and there was no mention of multiple assessor accounts needing to be
  distinguished. This would be a straightforward addition to `syncService.js`
  (bearer token on the upload request) if the backend requires it.
- **The sync target is a placeholder contract**, not a live backend:
  `syncService.js` POSTs `multipart/form-data` to `POST {API_BASE_URL}/api/assessments`
  with the record fields and photo files attached. This is intentionally the
  natural shape for a .NET Web API `[FromForm]` endpoint to receive, but no
  backend is included here — only the frontend was requested.
- **One device per assessor, no multi-device merge.** Conflict resolution
  across devices isn't handled — each assessor's IndexedDB is local to their
  phone.

## Known limitations (would address before production)

- No retry backoff/queueing beyond "leave it pending and try again next
  sync" — fine for a handful of records a day, not for high volume.
- No image compression before storage/upload — worth adding if storage or
  upload bandwidth becomes a concern.
- No automated tests included given the assignment's time scope.
