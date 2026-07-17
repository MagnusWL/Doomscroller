'use client';

export default function AdPriceButton({ slideId, price, coins, onBuy, disabled }) {
  const canAfford = coins >= price;
  return (
    <button
      className="ad-price"
      onClick={onBuy}
      disabled={disabled || !canAfford}
      title={canAfford ? `Buy for ${price} coins` : `Need ${price - coins} more coins`}
    >
      <span className="price-amount">{price}</span>
      <span className="price-emoji">🪙</span>
    </button>
  );
}
