export default function ScrollHint({ visible }) {
  return (
    <div className={`hint${visible ? '' : ' gone'}`}>
      Swipe or press ↓ for the next ad
    </div>
  );
}
