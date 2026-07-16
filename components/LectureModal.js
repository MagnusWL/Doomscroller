// videoId is null when closed — the iframe src follows it directly, so
// closing the modal also stops playback with no separate teardown step.
export default function LectureModal({ videoId, onClose }) {
  const open = Boolean(videoId);
  return (
    <div className={`yt-modal${open ? ' show' : ''}`}>
      <div className="yt-modal-box">
        <button className="yt-modal-close" onClick={onClose}>
          ×
        </button>
        <iframe
          src={open ? `https://www.youtube.com/embed/${videoId}?autoplay=1` : ''}
          allow="autoplay; encrypted-media"
          allowFullScreen
        />
      </div>
    </div>
  );
}
