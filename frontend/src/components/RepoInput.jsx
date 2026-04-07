import { useState } from 'react';
import BrutalitySlider from './BrutalitySlider';

const GITHUB_URL_RE = /^https:\/\/github\.com\/[^/]+\/[^/]+/;

function RepoInput({ onSubmit, loading }) {
  const [url, setUrl] = useState('');
  const [brutality, setBrutality] = useState(3);
  const [error, setError] = useState('');

  function handleSubmit(e) {
    e.preventDefault();
    setError('');

    const trimmed = url.trim();
    if (!GITHUB_URL_RE.test(trimmed)) {
      setError("That doesn't look like a GitHub repo URL. Try https://github.com/owner/repo");
      return;
    }

    onSubmit(trimmed, brutality);
  }

  function handleUrlChange(e) {
    setUrl(e.target.value);
    if (error) setError('');
  }

  const isMax = brutality === 5;

  return (
    <form className="repo-input" onSubmit={handleSubmit}>
      <div className="repo-input-field">
        <span className="repo-input-prompt">&gt;_</span>
        <input
          type="text"
          value={url}
          onChange={handleUrlChange}
          placeholder="https://github.com/owner/repo"
          spellCheck="false"
          autoComplete="off"
          disabled={loading}
        />
      </div>

      {error && <div className="error-message">{error}</div>}

      <BrutalitySlider value={brutality} onChange={setBrutality} />

      <button
        type="submit"
        disabled={loading}
        className={`roast-btn ${isMax ? 'roast-btn-max' : ''}`}
      >
        {isMax ? 'DESTROY MY CODE 🔥' : 'Roast My Code 🔥'}
      </button>

      <style>{`
        .repo-input {
          width: 100%;
          max-width: 600px;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .repo-input-field {
          display: flex;
          align-items: center;
          background: var(--bg-elevated);
          border: var(--border);
          border-radius: 4px;
          padding-left: 1rem;
          transition: border-color var(--transition-base), box-shadow var(--transition-base);
        }

        .repo-input-field:focus-within {
          border-color: var(--green);
          box-shadow: 0 0 12px var(--green-glow);
        }

        .repo-input-prompt {
          font-family: var(--font-mono);
          font-weight: 700;
          color: var(--green);
          user-select: none;
          flex-shrink: 0;
          margin-right: 0.5rem;
        }

        .repo-input-field input {
          background: transparent;
          border: none;
          font-family: var(--font-mono);
          font-size: 1rem;
          color: var(--white);
          flex: 1;
          padding: 0.75rem 1rem 0.75rem 0;
          outline: none;
        }

        .repo-input-field input::placeholder {
          color: var(--muted);
        }

        .repo-input-field input:disabled {
          opacity: 0.5;
        }

        .roast-btn {
          width: 100%;
          padding: 0.85rem 1.5rem;
          font-family: var(--font-mono);
          font-size: 1.05rem;
          font-weight: 700;
          letter-spacing: 0.03em;
          text-transform: uppercase;
          border: var(--border-bright);
          color: var(--green);
          background: var(--bg-surface);
          border-radius: 4px;
          cursor: pointer;
          transition:
            background-color var(--transition-base),
            border-color var(--transition-base),
            color var(--transition-base),
            box-shadow var(--transition-base),
            transform var(--transition-fast);
        }

        .roast-btn:hover:not(:disabled) {
          background: var(--green-glow);
          box-shadow: 0 0 24px var(--green-glow);
        }

        .roast-btn:active:not(:disabled) {
          transform: scale(0.97);
        }

        .roast-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .roast-btn-max {
          border-color: var(--crimson);
          color: var(--crimson);
          animation: crimson-pulse 1.5s ease-in-out infinite;
        }

        .roast-btn-max:hover:not(:disabled) {
          background: rgba(255, 51, 85, 0.08);
          box-shadow: 0 0 24px rgba(255, 51, 85, 0.3);
        }
      `}</style>
    </form>
  );
}

export default RepoInput;
