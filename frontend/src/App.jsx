import { useState, useEffect } from 'react';
import RepoInput from './components/RepoInput';
import Loader from './components/Loader';
import RoastCard from './components/RoastCard';
import ShareButton from './components/ShareButton';
import { submitRoast } from './api/roast';

const BOOT_LINES = [
  'AI ROAST MY CODE v1.0.0',
  'Loading judgment engine...',
  'Calibrating sarcasm levels...',
  'Ready. Paste a repo. Get destroyed.',
];

function App() {
  const [booting, setBooting] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [roastData, setRoastData] = useState(null);
  const [brutality, setBrutality] = useState(3);

  useEffect(() => {
    const timer = setTimeout(() => setBooting(false), BOOT_LINES.length * 200 + 800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    document.body.setAttribute('data-brutality', String(brutality));
  }, [brutality]);

  async function handleSubmit(repoUrl, selectedBrutality) {
    setBrutality(selectedBrutality);
    setError('');
    setRoastData(null);
    setLoading(true);

    try {
      const data = await submitRoast(repoUrl, selectedBrutality);
      setRoastData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleRoastAnother() {
    setRoastData(null);
    setError('');
  }

  if (booting) {
    return (
      <div className="app">
        <div className="boot-screen">
          {BOOT_LINES.map((line, i) => (
            <div className="boot-line mono" key={i}>
              <span className="text-green">&gt; </span>{line}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1 className="app-title">
          <span className="text-green">{'{'}</span>
          {' AI Roast My Code '}
          <span className="text-green">{'}'}</span>
        </h1>
        <p className="app-tagline text-muted mono">
          Paste a GitHub repo. Get destroyed.
        </p>
      </header>

      <main className="app-main">
        {!loading && !roastData && (
          <RepoInput onSubmit={handleSubmit} loading={loading} />
        )}

        {error && <div className="error-message">{error}</div>}

        {loading && <Loader />}

        {roastData && (
          <div className="roast-results">
            <RoastCard data={roastData} />
            <div className="roast-actions">
              <ShareButton
                roastId={roastData.roast_id}
                score={roastData.overall_score}
                grade={roastData.grade}
                savageQuote={roastData.savage_quote}
              />
              <button className="roast-again-btn" onClick={handleRoastAnother}>
                Roast Another
              </button>
            </div>
          </div>
        )}
      </main>

      <footer className="app-footer">
        <span className="text-muted mono">roastmycode.vercel.app</span>
      </footer>

      <style>{`
        .app {
          width: 100%;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 2rem 1rem;
        }

        /* --- Boot Screen --- */
        .boot-screen {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          justify-content: center;
          min-height: 60vh;
          font-family: var(--font-mono);
          font-size: 0.95rem;
          color: var(--white);
        }

        /* --- Header --- */
        .app-header {
          text-align: center;
          margin-bottom: 2.5rem;
        }

        .app-title {
          font-family: var(--font-display);
          font-size: 2.5rem;
          font-weight: 800;
          color: var(--white);
        }

        .app-tagline {
          font-size: 0.9rem;
          margin-top: 0.5rem;
        }

        /* --- Main --- */
        .app-main {
          width: 100%;
          max-width: 700px;
          display: flex;
          flex-direction: column;
          align-items: center;
          flex: 1;
        }

        /* --- Results --- */
        .roast-results {
          width: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
        }

        .roast-actions {
          display: flex;
          align-items: center;
          gap: 1rem;
          flex-wrap: wrap;
          justify-content: center;
        }

        .roast-again-btn {
          font-family: var(--font-mono);
          font-size: 0.85rem;
          padding: 0.65rem 1.25rem;
          color: var(--muted);
          border: 1px solid var(--green-dim);
          background: var(--bg-surface);
          border-radius: 4px;
          cursor: pointer;
          transition:
            color var(--transition-base),
            border-color var(--transition-base);
        }

        .roast-again-btn:hover {
          color: var(--green);
          border-color: var(--green);
        }

        /* --- Footer --- */
        .app-footer {
          margin-top: 3rem;
          padding: 1rem 0;
          font-size: 0.8rem;
        }

        /* --- Error in main area --- */
        .app-main > .error-message {
          margin-top: 1rem;
          max-width: 600px;
          width: 100%;
        }

        @media (max-width: 768px) {
          .app-title {
            font-size: 1.6rem;
          }

          .app {
            padding: 1.5rem 0.75rem;
          }
        }
      `}</style>
    </div>
  );
}

export default App;
