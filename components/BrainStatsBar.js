export default function BrainStatsBar({ braincells, brainrotSpeed }) {
  return (
    <div className="brain-stats">
      <span>
        <span className="label">🧠 Braincells</span>
        {Math.round(braincells).toLocaleString()}
      </span>
      <span>
        <span className="label">📈 Brainrot speed</span>
        {Math.round(brainrotSpeed).toLocaleString()}/scroll
      </span>
    </div>
  );
}
