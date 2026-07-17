export default function BuyAdButton({ price, adLoaded, canAfford, busy, onClick }) {
  const disabled = !adLoaded || !canAfford || busy;
  const title = !adLoaded
    ? 'Waiting for this ad to load'
    : !canAfford
    ? `Need ${price} coins`
    : `Buy for ${price} coins`;

  return (
    <button className="action-btn buy-ad-btn" onClick={onClick} disabled={disabled} title={title}>
      {busy ? '📸 …' : '🛒 Buy'}
      {adLoaded && <span className="btn-badge">{price}🪙</span>}
    </button>
  );
}
