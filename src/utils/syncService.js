import { getAllAssessments, updateSyncStatus } from '../db.js';

// Point this at whatever backend the team stands up (e.g. the .NET Web API
// covered in the assignment's "backend logic" discussion). It's read from
// an env var so the same build can point at a local API during dev and a
// deployed one later, without a code change.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

async function uploadOne(record) {
  const formData = new FormData();
  formData.append('id', record.id);
  formData.append('address', record.address);
  formData.append('latitude', String(record.latitude ?? ''));
  formData.append('longitude', String(record.longitude ?? ''));
  formData.append('condition', record.condition);
  formData.append('chickenCount', String(record.chickenCount));
  formData.append('notes', record.notes || '');
  formData.append('createdAt', String(record.createdAt));
  record.photos.forEach((photo, i) => {
    formData.append(`photos`, photo.blob, photo.name || `photo_${i}.jpg`);
  });

  const res = await fetch(`${API_BASE_URL}/api/assessments`, {
    method: 'POST',
    body: formData
  });
  if (!res.ok) throw new Error(`Upload failed with status ${res.status}`);
  return res;
}

// Uploads every record that isn't yet synced. Stops at the first failure so
// a bad connection doesn't burn through requests for nothing; whatever
// didn't sync just stays 'pending' and gets retried next time this runs.
export async function syncPendingAssessments(onProgress) {
  if (!navigator.onLine) {
    return { synced: 0, failed: 0, skipped: true };
  }

  const all = await getAllAssessments();
  const pending = all.filter((a) => a.syncStatus !== 'synced');

  let synced = 0;
  let failed = 0;

  for (const record of pending) {
    try {
      await updateSyncStatus(record.id, 'syncing');
      onProgress?.({ id: record.id, status: 'syncing' });
      await uploadOne(record);
      await updateSyncStatus(record.id, 'synced');
      onProgress?.({ id: record.id, status: 'synced' });
      synced += 1;
    } catch (err) {
      await updateSyncStatus(record.id, 'pending');
      onProgress?.({ id: record.id, status: 'failed', error: err.message });
      failed += 1;
      // Keep trying the rest — one flaky record shouldn't block the batch.
    }
  }

  return { synced, failed, skipped: false };
}
