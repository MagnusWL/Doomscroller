export default function BuyAdButton({ disabled, busy, onClick }) {
  return (
    <button
      className="action-btn"
      onClick={onClick}
      disabled={disabled || busy}
      title={disabled ? 'Waiting for this ad to load' : 'Buy this ad'}
    >
      <span className="action-icon">{busy ? '📸' : '🛒'}</span>
      <span className="action-label">{busy ? 'Buying…' : 'Buy ad'}</span>
    </button>
  );
}
