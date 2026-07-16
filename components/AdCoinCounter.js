export default function AdCoinCounter({ coins }) {
  return (
    <div className="coin-counter">
      <span className="label">🪙 Ad coins</span>
      {coins.toLocaleString()}
    </div>
  );
}
