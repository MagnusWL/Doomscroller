// Before purchase this is a buy button, gated on price; the checkbox toggle
// only exists once the viewer owns the feature.
export default function AutoScrollToggle({ unlocked, enabled, onChange, coins, price, onBuy }) {
  if (!unlocked) {
    const canAfford = coins >= price;
    return (
      <button
        className="action-btn"
        onClick={onBuy}
        disabled={!canAfford}
        title={canAfford ? `Buy autoscroll for ${price} coins` : `Need ${price - coins} more coins`}
      >
        🔁 Buy Autoscroll · {price}🪙
      </button>
    );
  }

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
