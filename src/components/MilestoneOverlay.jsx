import React, { useEffect, useState } from 'react';

const PERFECT_OPTIONS = [
  { emoji: 'local_fire_department', title: 'On Fire!',      subtitle: 'Perfect round — all correct!' },
  { emoji: 'bolt', title: 'Unstoppable!',  subtitle: 'You nailed every question!' },
  { emoji: 'auto_awesome', title: 'Flawless!',     subtitle: 'Not a single mistake!' },
];

const GOOD_OPTIONS = [
  { emoji: 'fitness_center', title: 'Great Job!',    subtitle: 'Keep the momentum going!' },
  { emoji: 'waving_hand', title: 'Well Done!',    subtitle: "You're doing fantastic!" },
  { emoji: 'track_changes', title: 'Nice Work!',    subtitle: 'Almost perfect!' },
];

const BURST_COLORS = ['#58cc02', '#ffd900', '#ff9600', '#ce82ff', '#00d4ff', '#ff6ec7'];

function BurstParticles() {
  return (
    <div className="milestone-burst" aria-hidden="true">
      {Array.from({ length: 12 }).map((_, i) => (
        <div
          key={i}
          className="burst-particle"
          style={{
            '--angle': `${i * 30}deg`,
            '--color': BURST_COLORS[i % BURST_COLORS.length],
            animationDelay: `${i * 0.03}s`,
          }}
        />
      ))}
    </div>
  );
}

export default function MilestoneOverlay({ correctCount, totalInBlock, onDismiss }) {
  const [dismissing, setDismissing] = useState(false);
  const [msg] = useState(() => {
    if (correctCount === totalInBlock) {
      return PERFECT_OPTIONS[Math.floor(Math.random() * PERFECT_OPTIONS.length)];
    }
    return GOOD_OPTIONS[Math.floor(Math.random() * GOOD_OPTIONS.length)];
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setDismissing(true);
      const closeTimer = setTimeout(() => {
        if (onDismiss) onDismiss();
      }, 400);
      return () => clearTimeout(closeTimer);
    }, 2400);

    return () => clearTimeout(timer);
  }, [onDismiss]);

  const isPerfect = correctCount === totalInBlock;

  return (
    <div
      className={`milestone-overlay ${dismissing ? 'dismissing' : ''}`}
      onClick={() => { setDismissing(true); setTimeout(() => onDismiss?.(), 400); }}
    >
      <BurstParticles />

      <div className={`milestone-card ${isPerfect ? 'perfect' : ''}`}>
        <div className="milestone-emoji ms">{msg.emoji}</div>
        <div className="milestone-text">{msg.title}</div>
        <div className="milestone-subtext">{msg.subtitle}</div>

        <div className="milestone-score-ring">
          <svg className="milestone-ring-svg" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="44" className="ring-bg" />
            <circle
              cx="50" cy="50" r="44"
              className="ring-fill"
              style={{ '--fill-pct': `${(correctCount / totalInBlock) * 276}` }}
            />
          </svg>
          <span className="milestone-score-text">{correctCount}/{totalInBlock}</span>
        </div>

        <div className="milestone-tap-hint">Tap to continue</div>
      </div>
    </div>
  );
}
