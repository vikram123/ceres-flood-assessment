import ConditionTag from './ConditionTag.jsx';

export default function AssessmentDetail({ assessment, onBack, onDelete }) {
  if (!assessment) return null;

  const coords =
    assessment.latitude != null
      ? `${assessment.latitude.toFixed(6)}, ${assessment.longitude.toFixed(6)}`
      : 'No GPS fix recorded';

  return (
    <div>
      <div className="form-header">
        <button type="button" className="back-button" onClick={onBack} aria-label="Back">
          ←
        </button>
        <h1>Site detail</h1>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20, margin: '0 0 4px' }}>
          {assessment.address}
        </h2>
        <ConditionTag condition={assessment.condition} />
      </div>

      <div className="detail-row">
        <span className="detail-row__label">Coordinates</span>
        <span className="detail-row__value" style={{ fontFamily: 'var(--font-mono)' }}>{coords}</span>
      </div>
      <div className="detail-row">
        <span className="detail-row__label">Chickens counted</span>
        <span className="detail-row__value">{assessment.chickenCount}</span>
      </div>
      <div className="detail-row">
        <span className="detail-row__label">Captured</span>
        <span className="detail-row__value">{new Date(assessment.createdAt).toLocaleString()}</span>
      </div>
      <div className="detail-row">
        <span className="detail-row__label">Sync status</span>
        <span className="detail-row__value">{assessment.syncStatus === 'synced' ? 'Synced' : 'Pending upload'}</span>
      </div>

      {assessment.notes && (
        <div style={{ marginTop: 14 }}>
          <p className="field-label">Notes</p>
          <p style={{ fontSize: 14, lineHeight: 1.5 }}>{assessment.notes}</p>
        </div>
      )}

      {assessment.photos?.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <p className="field-label">Photos ({assessment.photos.length})</p>
          <div className="detail-photos">
            {assessment.photos.map((p) => (
              <img key={p.id} src={p.url} alt="Farm site" />
            ))}
          </div>
        </div>
      )}

      <button type="button" className="delete-button" onClick={() => onDelete(assessment.id)}>
        Delete this assessment
      </button>
    </div>
  );
}
