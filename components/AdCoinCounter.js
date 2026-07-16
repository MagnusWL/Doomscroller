export default function AdCoinCounter({ coins }) {
  return (
    <div className="coin-counter">
      <span className="coin-value">🪙 {coins.toLocaleString()}</span>
      <span className="label">Ad coins</span>
    </div>
  );
}
