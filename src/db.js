// Offline-first data layer.
//
// Why IndexedDB and not localStorage: assessors capture several photos per
// site, and localStorage's ~5MB string-only quota fills up almost
// immediately once photos are involved. IndexedDB gives us much higher
// storage limits and can store Blobs natively (no base64 bloat), which
// matters when a single assessor might log a dozen sites in a day before
// getting back to the hotel.
//
// Every record is written here FIRST and only here. The network is never in
// the critical path of saving a site visit. A background "sync" step (see
// syncService.js) is the only thing that talks to the server, and it does so
// opportunistically when connectivity is available.

const DB_NAME = 'ceres-flood-assessment';
const DB_VERSION = 1;
const STORE = 'assessments';

let dbPromise = null;

function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' });
        store.createIndex('syncStatus', 'syncStatus', { unique: false });
        store.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function tx(storeName, mode) {
  return openDb().then((db) => db.transaction(storeName, mode).objectStore(storeName));
}

export function generateId() {
  return `site_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

export async function saveAssessment(record) {
  const store = await tx(STORE, 'readwrite');
  return new Promise((resolve, reject) => {
    const req = store.put(record);
    req.onsuccess = () => resolve(record);
    req.onerror = () => reject(req.error);
  });
}

export async function getAllAssessments() {
  const store = await tx(STORE, 'readonly');
  return new Promise((resolve, reject) => {
    const req = store.getAll();
    req.onsuccess = () => {
      const results = req.result || [];
      results.sort((a, b) => b.createdAt - a.createdAt);
      resolve(results);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function getAssessment(id) {
  const store = await tx(STORE, 'readonly');
  return new Promise((resolve, reject) => {
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

export async function deleteAssessment(id) {
  const store = await tx(STORE, 'readwrite');
  return new Promise((resolve, reject) => {
    const req = store.delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

export async function updateSyncStatus(id, syncStatus) {
  const record = await getAssessment(id);
  if (!record) return null;
  record.syncStatus = syncStatus;
  return saveAssessment(record);
}

export async function countPendingSync() {
  const all = await getAllAssessments();
  return all.filter((a) => a.syncStatus !== 'synced').length;
}
