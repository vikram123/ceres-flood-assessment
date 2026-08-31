import ConditionTag from './ConditionTag.jsx';

function formatCoords(lat, lng) {
  if (lat == null || lng == null) return null;
  return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
}

export default function AssessmentList({ assessments, onOpen }) {
  if (assessments.length === 0) {
    return (
      <div className="empty-state">
        <div style={{ fontSize: 40 }}>🐔</div>
        <p className="empty-state__title">No sites logged yet</p>
        <p>Tap "New site assessment" to capture your first farm visit.</p>
      </div>
    );
  }

  return (
    <div>
      {assessments.map((a) => {
        const coords = formatCoords(a.latitude, a.longitude);
        const firstPhoto = a.photos?.[0];
        return (
          <div key={a.id} className="site-card" onClick={() => onOpen(a.id)}>
            <div className="site-card__thumb">
              {firstPhoto ? (
                <img src={firstPhoto.url} alt="" />
              ) : (
                <span>NO PHOTO</span>
              )}
            </div>
            <div className="site-card__body">
              <div className="site-card__top">
                <div>
                  <div className="site-card__address">{a.address || 'Unnamed site'}</div>
                  <div className="site-card__coords">
                    {coords ? coords : 'no GPS fix'}
                  </div>
                </div>
                <ConditionTag condition={a.condition} />
              </div>
              <div className="site-card__meta">
                <span>{a.chickenCount} birds</span>
                <span>·</span>
                <span>{a.photos.length} photo{a.photos.length === 1 ? '' : 's'}</span>
                <span>·</span>
                <span className={`sync-flag sync-flag--${a.syncStatus === 'synced' ? 'synced' : 'pending'}`}>
                  {a.syncStatus === 'synced' ? 'synced' : 'pending'}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
