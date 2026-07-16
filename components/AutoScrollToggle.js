export default function AutoScrollToggle({ enabled, onChange }) {
  return (
    <label className="autoscroll-toggle">
      <input
        type="checkbox"
        checked={enabled}
        onChange={e => onChange(e.target.checked)}
      />
      Autoscroll
    </label>
  );
}
