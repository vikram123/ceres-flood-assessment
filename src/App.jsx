import { useEffect, useState, useCallback } from 'react';
import './App.css';
import ConnectionPill from './components/ConnectionPill.jsx';
import SyncBar from './components/SyncBar.jsx';
import AssessmentList from './components/AssessmentList.jsx';
import AssessmentForm from './components/AssessmentForm.jsx';
import AssessmentDetail from './components/AssessmentDetail.jsx';
import { saveAssessment, getAllAssessments, deleteAssessment, generateId, countPendingSync } from './db.js';
import { syncPendingAssessments } from './utils/syncService.js';

// Attaches a fresh, in-memory object URL to each photo blob so images can be
// displayed. Blobs themselves are the durable thing stored in IndexedDB;
// object URLs are just a browser-session-scoped pointer to them and get
// regenerated every time records are loaded.
function withPhotoUrls(record) {
  return {
    ...record,
    photos: (record.photos || []).map((p) => ({ ...p, url: p.url || URL.createObjectURL(p.blob) }))
  };
}

export default function App() {
  const [view, setView] = useState('list'); // 'list' | 'form' | 'detail'
  const [assessments, setAssessments] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [online, setOnline] = useState(navigator.onLine);
  const [syncing, setSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  const refresh = useCallback(async () => {
    const all = await getAllAssessments();
    setAssessments(all.map(withPhotoUrls));
    setPendingCount(await countPendingSync());
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    function goOnline() {
      setOnline(true);
      // Auto-sync the moment connectivity returns (e.g. assessor arrives
      // back at the hotel) — no need for them to remember to tap sync.
      handleSync();
    }
    function goOffline() {
      setOnline(false);
    }
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSave(formData) {
    const record = {
      id: generateId(),
      ...formData,
      photos: formData.photos.map(({ url, ...rest }) => rest), // store blobs only
      syncStatus: 'pending',
      createdAt: Date.now()
    };
    await saveAssessment(record);
    await refresh();
    setView('list');
  }

  async function handleDelete(id) {
    await deleteAssessment(id);
    await refresh();
    setView('list');
  }

  async function handleSync() {
    setSyncing(true);
    try {
      await syncPendingAssessments();
    } finally {
      setSyncing(false);
      await refresh();
    }
  }

  const selected = assessments.find((a) => a.id === selectedId) || null;

  return (
    <div className="app">
      <div className="status-bar">
        <div className="status-bar__brand">
          CERES <span>Flood Damage Assessment · Madison Co.</span>
        </div>
        <ConnectionPill online={online} syncing={syncing} />
      </div>

      {view === 'list' && (
        <SyncBar pendingCount={pendingCount} online={online} syncing={syncing} onSync={handleSync} />
      )}

      <div className="content">
        {view === 'list' && (
          <>
            <p className="section-eyebrow">{assessments.length} site{assessments.length === 1 ? '' : 's'} logged</p>
            <AssessmentList
              assessments={assessments}
              onOpen={(id) => {
                setSelectedId(id);
                setView('detail');
              }}
            />
          </>
        )}

        {view === 'form' && (
          <AssessmentForm onSave={handleSave} onCancel={() => setView('list')} />
        )}

        {view === 'detail' && (
          <AssessmentDetail assessment={selected} onBack={() => setView('list')} onDelete={handleDelete} />
        )}
      </div>

      {view === 'list' && (
        <button className="fab" onClick={() => setView('form')}>
          + New site assessment
        </button>
      )}
    </div>
  );
}
