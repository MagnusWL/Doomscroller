export default function BuyAdButton({ disabled, busy, onClick }) {
  return (
    <button
      className="action-btn"
      onClick={onClick}
      disabled={disabled || busy}
      title={disabled ? 'Waiting for this ad to load' : 'Buy this ad'}
    >
      {busy ? '📸 Buying…' : '🛒 Buy ad'}
    </button>
  );
}
