import { useState, useEffect } from 'react';

const MESSAGES = [
  "Initializing judgment protocol...",
  "Summoning the code demons...",
  "Reading your spaghetti...",
  "Counting the TODO comments...",
  "Judging your variable names...",
  "Calculating technical debt...",
  "Preparing the damage report...",
  "Consulting the ancient scrolls of Stack Overflow...",
  "Sharpening the critique...",
];

function Loader() {
  const [messageIndex, setMessageIndex] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const rotator = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % MESSAGES.length);
    }, 3000);
    return () => clearInterval(rotator);
  }, []);

  return (
    <div className="loader">
      <div className="loader-terminal">
        <div className="loader-line" key={messageIndex}>
          <span className="loader-prompt">{'>'} </span>
          <span className="loader-text">{MESSAGES[messageIndex]}</span>
          <span className="loader-cursor" />
        </div>
      </div>
      <div className="loader-elapsed">Roasting... ({elapsed}s)</div>

      <style>{`
        .loader {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
          padding: 3rem 1rem;
        }

        .loader-terminal {
          background: var(--bg-surface);
          border: var(--border);
          border-radius: 6px;
          padding: 1.25rem 1.5rem;
          min-width: 480px;
          max-width: 600px;
          min-height: 52px;
          display: flex;
          align-items: center;
        }

        .loader-line {
          display: flex;
          align-items: center;
          font-family: var(--font-mono);
          font-size: 0.95rem;
          overflow: hidden;
          white-space: nowrap;
        }

        .loader-prompt {
          color: var(--green);
          font-weight: 700;
          flex-shrink: 0;
        }

        .loader-text {
          display: inline-block;
          color: var(--white);
          overflow: hidden;
          white-space: nowrap;
          width: 0;
          animation: typewriter 1.5s steps(40) forwards;
        }

        .loader-cursor {
          display: inline-block;
          width: 8px;
          height: 1.1em;
          background: var(--green);
          margin-left: 2px;
          flex-shrink: 0;
          animation: blink-caret 0.75s step-end infinite;
        }

        .loader-elapsed {
          font-family: var(--font-mono);
          font-size: 0.85rem;
          color: var(--muted);
          letter-spacing: 0.04em;
        }

        @media (max-width: 768px) {
          .loader-terminal {
            min-width: 0;
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}

export default Loader;
