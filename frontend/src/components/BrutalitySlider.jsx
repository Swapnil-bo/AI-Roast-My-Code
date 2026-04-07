const LEVELS = [
  { value: 1, label: 'Gentle Mentor' },
  { value: 2, label: 'Code Reviewer' },
  { value: 3, label: 'Senior Dev' },
  { value: 4, label: 'Tech Lead on Monday' },
  { value: 5, label: 'Gordon Ramsay Mode' },
];

const TRACK_COLORS = {
  1: 'var(--green)',
  2: 'var(--green)',
  3: 'var(--amber)',
  4: 'var(--amber)',
  5: 'var(--crimson)',
};

function BrutalitySlider({ value, onChange }) {
  const trackColor = TRACK_COLORS[value];
  const fillPercent = ((value - 1) / 4) * 100;

  function handleChange(e) {
    onChange(Number(e.target.value));
  }

  return (
    <div className={`brutality-slider ${value === 5 ? 'brutality-max' : ''}`}>
      <div className="brutality-header">
        <span className="brutality-label">Brutality</span>
        <span className="brutality-level" style={{ color: trackColor }}>
          {LEVELS[value - 1].label}
        </span>
      </div>

      <div className="brutality-track-wrapper">
        <input
          type="range"
          min="1"
          max="5"
          step="1"
          value={value}
          onChange={handleChange}
          className="brutality-range"
          style={{
            '--track-color': trackColor,
            '--fill-percent': `${fillPercent}%`,
          }}
        />
        <div className="brutality-ticks">
          {LEVELS.map((level) => (
            <div
              key={level.value}
              className={`brutality-tick ${value === level.value ? 'active' : ''}`}
            >
              <div
                className="tick-dot"
                style={{ background: value >= level.value ? trackColor : 'var(--muted)' }}
              />
              <span className="tick-label">{level.value}</span>
            </div>
          ))}
        </div>
      </div>

      <style>{`
        .brutality-slider {
          width: 100%;
          padding: 1rem 0;
        }

        .brutality-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 0.75rem;
        }

        .brutality-label {
          font-family: var(--font-mono);
          font-size: 0.85rem;
          color: var(--muted);
          text-transform: uppercase;
          letter-spacing: 0.08em;
        }

        .brutality-level {
          font-family: var(--font-mono);
          font-size: 0.85rem;
          font-weight: 600;
          transition: color var(--transition-base);
        }

        .brutality-track-wrapper {
          position: relative;
        }

        /* --- Range input reset & custom styling --- */
        .brutality-range {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 6px;
          border-radius: 3px;
          outline: none;
          cursor: pointer;
          background: linear-gradient(
            to right,
            var(--track-color) 0%,
            var(--track-color) var(--fill-percent),
            var(--bg-elevated) var(--fill-percent),
            var(--bg-elevated) 100%
          );
          transition: box-shadow var(--transition-base);
        }

        /* Webkit thumb */
        .brutality-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: var(--track-color);
          border: 2px solid var(--bg-void);
          box-shadow: 0 0 8px var(--track-color);
          cursor: pointer;
          transition: box-shadow var(--transition-base), transform var(--transition-fast);
        }

        .brutality-range::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 0 16px var(--track-color);
        }

        /* Firefox thumb */
        .brutality-range::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: var(--track-color);
          border: 2px solid var(--bg-void);
          box-shadow: 0 0 8px var(--track-color);
          cursor: pointer;
        }

        .brutality-range::-moz-range-track {
          height: 6px;
          border-radius: 3px;
          background: transparent;
        }

        /* --- Tick marks --- */
        .brutality-ticks {
          display: flex;
          justify-content: space-between;
          padding: 0 2px;
          margin-top: 0.5rem;
        }

        .brutality-tick {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        .tick-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          transition: background var(--transition-base);
        }

        .tick-label {
          font-family: var(--font-mono);
          font-size: 0.7rem;
          color: var(--muted);
        }

        .brutality-tick.active .tick-label {
          color: var(--white);
        }

        /* --- Brutality 5 crimson pulse --- */
        .brutality-max .brutality-range {
          animation: slider-crimson-pulse 1.5s ease-in-out infinite;
        }

        @keyframes slider-crimson-pulse {
          0%, 100% { box-shadow: 0 0 6px rgba(255, 51, 85, 0.3); }
          50%      { box-shadow: 0 0 20px rgba(255, 51, 85, 0.6); }
        }
      `}</style>
    </div>
  );
}

export default BrutalitySlider;
