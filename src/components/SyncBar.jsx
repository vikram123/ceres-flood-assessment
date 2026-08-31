export default function SyncBar({ pendingCount, online, syncing, onSync }) {
  if (pendingCount === 0) return null;

  return (
    <div className="sync-bar">
      <span className="sync-bar__label">
        <span className="sync-bar__count">{pendingCount}</span>{' '}
        {pendingCount === 1 ? 'assessment' : 'assessments'} waiting to sync
      </span>
      <button onClick={onSync} disabled={!online || syncing}>
        {syncing ? 'Syncing…' : online ? 'Sync now' : 'No signal'}
      </button>
    </div>
  );
}
