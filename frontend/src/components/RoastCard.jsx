import { useRef } from 'react';
import html2canvas from 'html2canvas';

const CATEGORY_LABELS = {
  code_quality: 'Code Quality',
  naming_conventions: 'Naming',
  error_handling: 'Error Handling',
  architecture: 'Architecture',
  documentation: 'Documentation',
};

const CATEGORY_ORDER = [
  'code_quality',
  'naming_conventions',
  'error_handling',
  'architecture',
  'documentation',
];

const RING_RADIUS = 54;
const RING_CIRCUMFERENCE = 2 * Math.PI * RING_RADIUS;

function scoreColor(score) {
  if (score >= 70) return 'var(--green)';
  if (score >= 40) return 'var(--amber)';
  return 'var(--crimson)';
}

function RoastCard({ data }) {
  const cardRef = useRef(null);

  const {
    overall_score,
    grade,
    headline,
    roast,
    categories,
    savage_quote,
    one_good_thing,
  } = data;

  const ringOffset = RING_CIRCUMFERENCE - (RING_CIRCUMFERENCE * overall_score) / 100;
  const mainColor = scoreColor(overall_score);

  async function handleDownload() {
    if (!cardRef.current) return;
    const canvas = await html2canvas(cardRef.current, {
      backgroundColor: '#0a0a0f',
      scale: 2,
    });
    const link = document.createElement('a');
    link.download = `roast-${grade}-${overall_score}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  return (
    <div className="roast-card-wrapper">
      <div className="roast-card" ref={cardRef}>
        {/* --- Header: Score Ring + Grade --- */}
        <div className="roast-card-header">
          <div className="score-ring-container">
            <svg width="120" height="120" viewBox="0 0 120 120">
              <circle
                cx="60"
                cy="60"
                r={RING_RADIUS}
                fill="none"
                stroke="var(--bg-elevated)"
                strokeWidth="8"
              />
              <circle
                cx="60"
                cy="60"
                r={RING_RADIUS}
                fill="none"
                stroke={mainColor}
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={RING_CIRCUMFERENCE}
                strokeDashoffset={RING_CIRCUMFERENCE}
                className="score-ring-animated"
                style={{
                  '--ring-circumference': RING_CIRCUMFERENCE,
                  '--ring-offset': ringOffset,
                }}
                transform="rotate(-90 60 60)"
              />
              <text
                x="60"
                y="60"
                textAnchor="middle"
                dominantBaseline="central"
                fill={mainColor}
                fontSize="28"
                fontWeight="700"
                fontFamily="var(--font-mono)"
              >
                {overall_score}
              </text>
            </svg>
          </div>
          <div className="grade-badge grade-animated" style={{ borderColor: mainColor, color: mainColor }}>
            {grade}
          </div>
        </div>

        {/* --- Headline --- */}
        <h2 className="roast-headline">{headline}</h2>

        {/* --- Roast Text --- */}
        <blockquote className="roast-text">
          {roast.split('\n').map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </blockquote>

        {/* --- Category Bars --- */}
        <div className="roast-categories">
          {CATEGORY_ORDER.map((key, i) => {
            const cat = categories[key];
            if (!cat) return null;
            const color = scoreColor(cat.score);
            return (
              <div className="category-row" key={key}>
                <span className="category-label">{CATEGORY_LABELS[key]}</span>
                <div className="category-bar-track">
                  <div
                    className="category-bar-fill"
                    style={{
                      '--bar-width': `${cat.score}%`,
                      background: color,
                      animationDelay: `${i * 100}ms`,
                    }}
                  />
                </div>
                <span className="category-score" style={{ color }}>{cat.score}</span>
                <span className="category-comment">{cat.comment}</span>
              </div>
            );
          })}
        </div>

        {/* --- Savage Quote --- */}
        <div className="savage-quote-block savage-quote-animated">
          <span className="savage-mark">&ldquo;</span>
          <p className="savage-text">{savage_quote}</p>
          <span className="savage-mark savage-mark-close">&rdquo;</span>
        </div>

        {/* --- One Good Thing --- */}
        <div className="one-good-thing">
          <span className="good-check">&#10003;</span>
          <span>{one_good_thing}</span>
        </div>
      </div>

      {/* --- Download Button (outside card ref for clean capture) --- */}
      <button className="download-btn" onClick={handleDownload}>
        Download Card
      </button>

      <style>{`
        .roast-card-wrapper {
          width: 100%;
          max-width: 700px;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1rem;
        }

        .roast-card {
          background: var(--bg-surface);
          border: var(--border);
          border-radius: 8px;
          padding: 2rem;
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        /* --- Header --- */
        .roast-card-header {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 1.5rem;
        }

        .score-ring-container {
          flex-shrink: 0;
        }

        .score-ring-animated {
          animation: score-ring-draw 1.2s ease-out forwards;
        }

        .grade-badge {
          font-family: var(--font-display);
          font-size: 3rem;
          font-weight: 800;
          border: 3px solid;
          border-radius: 10px;
          padding: 0.25rem 1rem;
          line-height: 1.1;
        }

        /* --- Headline --- */
        .roast-headline {
          font-family: var(--font-display);
          font-size: 1.6rem;
          font-weight: 700;
          color: var(--white);
          text-align: center;
        }

        /* --- Roast Text --- */
        .roast-text {
          border-left: 3px solid var(--green);
          padding-left: 1.25rem;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          font-family: var(--font-body);
          font-size: 0.95rem;
          color: var(--white);
          line-height: 1.7;
        }

        /* --- Categories --- */
        .roast-categories {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .category-row {
          display: grid;
          grid-template-columns: 110px 1fr 40px;
          grid-template-rows: auto auto;
          align-items: center;
          gap: 0 0.75rem;
        }

        .category-label {
          font-family: var(--font-mono);
          font-size: 0.8rem;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.04em;
        }

        .category-bar-track {
          height: 10px;
          background: var(--bg-elevated);
          border-radius: 5px;
          overflow: hidden;
        }

        .category-bar-fill {
          height: 100%;
          width: 0%;
          border-radius: 5px;
          animation: bar-sweep 0.8s ease-out forwards;
        }

        .category-score {
          font-family: var(--font-mono);
          font-size: 0.85rem;
          font-weight: 700;
          text-align: right;
        }

        .category-comment {
          grid-column: 1 / -1;
          font-family: var(--font-body);
          font-size: 0.8rem;
          color: var(--muted);
          margin-top: 0.15rem;
        }

        /* --- Savage Quote --- */
        .savage-quote-block {
          position: relative;
          text-align: center;
          padding: 1.5rem 2.5rem;
          background: var(--green-glow);
          border-radius: 6px;
        }

        .savage-mark {
          font-family: var(--font-display);
          font-size: 4rem;
          line-height: 0;
          color: var(--green);
          opacity: 0.4;
          position: absolute;
          top: 1.2rem;
          left: 0.75rem;
        }

        .savage-mark-close {
          left: auto;
          right: 0.75rem;
          top: auto;
          bottom: 0.2rem;
        }

        .savage-text {
          font-family: var(--font-display);
          font-size: 1.15rem;
          font-weight: 600;
          color: var(--green);
          line-height: 1.5;
        }

        /* --- One Good Thing --- */
        .one-good-thing {
          display: flex;
          align-items: flex-start;
          gap: 0.5rem;
          font-family: var(--font-body);
          font-size: 0.9rem;
          color: var(--green);
        }

        .good-check {
          font-size: 1.1rem;
          font-weight: 700;
          flex-shrink: 0;
        }

        /* --- Download Button --- */
        .download-btn {
          font-family: var(--font-mono);
          font-size: 0.85rem;
          padding: 0.6rem 1.25rem;
          color: var(--muted);
          border: 1px solid var(--green-dim);
          background: var(--bg-surface);
          border-radius: 4px;
          cursor: pointer;
          transition:
            color var(--transition-base),
            border-color var(--transition-base);
        }

        .download-btn:hover {
          color: var(--green);
          border-color: var(--green);
        }

        @media (max-width: 768px) {
          .roast-card {
            padding: 1.25rem;
          }

          .roast-card-header {
            flex-direction: column;
            gap: 1rem;
          }

          .grade-badge {
            font-size: 2.25rem;
          }

          .roast-headline {
            font-size: 1.25rem;
          }

          .category-row {
            grid-template-columns: 90px 1fr 36px;
          }

          .savage-quote-block {
            padding: 1.25rem 1.75rem;
          }
        }
      `}</style>
    </div>
  );
}

export default RoastCard;
