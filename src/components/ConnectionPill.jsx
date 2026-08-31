export default function ConnectionPill({ online, syncing }) {
  const stateClass = syncing ? 'syncing' : online ? 'online' : 'offline';
  const label = syncing ? 'Syncing' : online ? 'Online' : 'Offline';

  return (
    <span className={`connection-pill connection-pill--${stateClass}`}>
      <span className="connection-pill__dot" />
      {label}
    </span>
  );
}
