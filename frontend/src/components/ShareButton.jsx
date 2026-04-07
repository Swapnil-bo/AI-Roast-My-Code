const BACKEND_URL = import.meta.env.VITE_API_URL || '';

function ShareButton({ roastId, score, grade, savageQuote }) {
  function handleShare() {
    const tweetText = encodeURIComponent(
      `My code got roasted ${score}/100 (${grade})\n\n"${savageQuote}"\n\n🔥 via AI Roast My Code`
    );
    const cardUrl = encodeURIComponent(`${BACKEND_URL}/api/card/${roastId}`);
    const tweetUrl = `https://twitter.com/intent/tweet?text=${tweetText}&url=${cardUrl}`;
    window.open(tweetUrl, '_blank');
  }

  return (
    <button className="share-btn" onClick={handleShare}>
      <span className="share-x-logo">𝕏</span>
      <span>Share on 𝕏</span>

      <style>{`
        .share-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          font-family: var(--font-mono);
          font-size: 0.9rem;
          font-weight: 600;
          padding: 0.65rem 1.25rem;
          color: var(--white);
          background: var(--bg-surface);
          border: 1px solid var(--white);
          border-radius: 4px;
          cursor: pointer;
          transition:
            background-color var(--transition-base),
            border-color var(--transition-base),
            box-shadow var(--transition-base);
        }

        .share-btn:hover {
          background: var(--bg-elevated);
          border-color: var(--white);
          box-shadow: 0 0 16px rgba(232, 232, 240, 0.1);
        }

        .share-x-logo {
          font-size: 1.1rem;
          font-weight: 800;
        }
      `}</style>
    </button>
  );
}

export default ShareButton;
