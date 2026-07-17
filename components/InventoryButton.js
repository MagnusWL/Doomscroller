export default function InventoryButton({ count, onClick }) {
  return (
    <button className="action-btn inventory-btn" onClick={onClick} title="Open your inventory">
      🎒 Bag
      {count > 0 && <span className="inv-count">{count}</span>}
    </button>
  );
}
