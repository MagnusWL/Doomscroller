export default function InventoryButton({ count, onClick }) {
  return (
    <button className="action-btn" onClick={onClick} title="Open your inventory">
      <span className="action-icon">🎒</span>
      <span className="action-label">Inventory</span>
      {count > 0 && <span className="inv-count">{count}</span>}
    </button>
  );
}
