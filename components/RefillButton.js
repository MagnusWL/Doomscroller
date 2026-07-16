export default function RefillButton({ visible, onClick }) {
  return (
    <button className={`refill-btn${visible ? ' show' : ''}`} onClick={onClick}>
      🧠 Get more braincells
    </button>
  );
}
