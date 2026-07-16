export default function InventoryButton({ count, onClick }) {
  return (
    <button className="action-btn" onClick={onClick} title="Open your inventory">
      🎒 Inventory
      {count > 0 && <span className="inv-count">{count}</span>}
    </button>
  );
}
