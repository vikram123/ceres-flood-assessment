import { useState } from 'react';
import { captureLocation } from '../utils/geolocation.js';

const CONDITIONS = [
  { key: 'good', label: 'Good' },
  { key: 'moderate', label: 'Moderate' },
  { key: 'bad', label: 'Bad' }
];

export default function AssessmentForm({ onSave, onCancel }) {
  const [address, setAddress] = useState('');
  const [location, setLocation] = useState(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [condition, setCondition] = useState('good');
  const [chickenCount, setChickenCount] = useState(0);
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState([]); // [{ id, blob, url, name }]
  const [error, setError] = useState('');

  async function handleCaptureLocation() {
    setLocating(true);
    setLocationError('');
    try {
      const loc = await captureLocation();
      setLocation(loc);
    } catch (err) {
      setLocationError(
        err.code === 1
          ? 'Location permission denied. Enable it in device settings.'
          : 'Could not get a GPS fix — try stepping into the open.'
      );
    } finally {
      setLocating(false);
    }
  }

  function handlePhotoSelect(e) {
    const files = Array.from(e.target.files || []);
    const next = files.map((file) => ({
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      blob: file,
      url: URL.createObjectURL(file),
      name: file.name
    }));
    setPhotos((prev) => [...prev, ...next]);
    e.target.value = '';
  }

  function removePhoto(id) {
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  }

  function adjustChickenCount(delta) {
    setChickenCount((prev) => Math.max(0, prev + delta));
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!address.trim()) {
      setError('Add an address or site description before saving.');
      return;
    }
    setError('');
    onSave({
      address: address.trim(),
      latitude: location?.latitude ?? null,
      longitude: location?.longitude ?? null,
      gpsAccuracy: location?.accuracy ?? null,
      condition,
      chickenCount,
      notes: notes.trim(),
      photos
    });
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-header">
        <button type="button" className="back-button" onClick={onCancel} aria-label="Cancel">
          ←
        </button>
        <h1>New site assessment</h1>
      </div>

      {error && <div className="form-error">{error}</div>}

      <div className="field-group">
        <label className="field-label" htmlFor="address">Address / site description</label>
        <input
          id="address"
          className="text-input"
          type="text"
          placeholder="e.g. 214 Mill Creek Rd, Marshall NC"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
        />
      </div>

      <div className="field-group">
        <label className="field-label">GPS coordinates</label>
        <div className="gps-row">
          <div className="gps-row__coords">
            {location ? (
              <>
                {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
                <span className="gps-row__accuracy">±{Math.round(location.accuracy)}m accuracy</span>
              </>
            ) : (
              <span className="placeholder">No fix captured yet</span>
            )}
          </div>
          <button type="button" className="gps-button" onClick={handleCaptureLocation} disabled={locating}>
            {locating ? 'Locating…' : location ? 'Retake' : 'Capture GPS'}
          </button>
        </div>
        {locationError && <p className="hint-text" style={{ color: 'var(--color-bad)' }}>{locationError}</p>}
        <p className="hint-text">GPS uses satellites, not signal — this works with zero bars.</p>
      </div>

      <div className="field-group">
        <label className="field-label">Farm condition</label>
        <div className="condition-picker">
          {CONDITIONS.map((c) => (
            <button
              type="button"
              key={c.key}
              className={`condition-option condition-option--${c.key} ${condition === c.key ? 'is-selected' : ''}`}
              onClick={() => setCondition(c.key)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      <div className="field-group">
        <label className="field-label" htmlFor="chickenCount">Total number of chickens</label>
        <div className="stepper">
          <button type="button" onClick={() => adjustChickenCount(-10)} aria-label="Decrease by 10">−10</button>
          <input
            id="chickenCount"
            type="number"
            inputMode="numeric"
            min="0"
            value={chickenCount}
            onChange={(e) => setChickenCount(Math.max(0, Number(e.target.value) || 0))}
          />
          <button type="button" onClick={() => adjustChickenCount(10)} aria-label="Increase by 10">+10</button>
        </div>
      </div>

      <div className="field-group">
        <label className="field-label">Photos of the farm</label>
        <div className="photo-grid">
          {photos.map((p) => (
            <div className="photo-tile" key={p.id}>
              <img src={p.url} alt="Farm site" />
              <button type="button" className="photo-tile__remove" onClick={() => removePhoto(p.id)} aria-label="Remove photo">
                ×
              </button>
            </div>
          ))}
          <label className="photo-add">
            <input
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              onChange={handlePhotoSelect}
            />
            <span style={{ fontSize: 20 }}>+</span>
            <span>Add photo</span>
          </label>
        </div>
      </div>

      <div className="field-group">
        <label className="field-label" htmlFor="notes">Notes (optional)</label>
        <textarea
          id="notes"
          className="textarea-input"
          placeholder="Anything field teams should know — access issues, structural damage, hazards…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </div>

      <button type="submit" className="submit-button">Save assessment</button>
      <p className="hint-text" style={{ textAlign: 'center' }}>
        Saved to this device instantly. Syncs automatically once you're back online.
      </p>
    </form>
  );
}
