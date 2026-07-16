export default function BuyAdButton({ disabled, busy, onClick }) {
  return (
    <button
      className="top-btn"
      onClick={onClick}
      disabled={disabled || busy}
      // Banner slides are the disabled case, and the reason isn't guessable
      // from a greyed-out button.
      title={disabled ? "Only video ads can be bought — banners can't be captured" : 'Buy this ad'}
    >
      {busy ? '📸 Buying…' : '🛒 Buy ad'}
    </button>
  );
}
