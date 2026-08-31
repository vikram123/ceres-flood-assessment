const LABELS = { good: 'Good', moderate: 'Moderate', bad: 'Bad' };

export default function ConditionTag({ condition }) {
  return (
    <span className={`condition-tag condition-tag--${condition}`}>
      {LABELS[condition] || condition}
    </span>
  );
}
