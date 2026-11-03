import React, { useState, useEffect } from 'react';
import { Star, RefreshCw } from 'lucide-react';

/**
 * ReviewBars - UI Motion Prompts Rating #5
 * "The score counts up to 4.6 while the five bars grow one after another."
 */
const BARS_DATA = [
  { star: 5, pct: 78, count: 100 },
  { star: 4, pct: 15, count: 19 },
  { star: 3, pct: 4, count: 5 },
  { star: 2, pct: 2, count: 3 },
  { star: 1, pct: 1, count: 1 }
];

export default function ReviewBars({ targetScore = 4.6, totalReviews = 128 }) {
  const [currentScore, setCurrentScore] = useState(0.0);
  const [barPcts, setBarPcts] = useState([0, 0, 0, 0, 0]);
  const [animating, setAnimating] = useState(false);

  const triggerAnimation = () => {
    setAnimating(true);
    setCurrentScore(0.0);
    setBarPcts([0, 0, 0, 0, 0]);

    // Animate score count up
    let start = 0;
    const duration = 1200;
    const intervalTime = 30;
    const steps = duration / intervalTime;
    const increment = targetScore / steps;

    const timer = setInterval(() => {
      start += increment;
      if (start >= targetScore) {
        setCurrentScore(targetScore);
        clearInterval(timer);
      } else {
        setCurrentScore(parseFloat(start.toFixed(1)));
      }
    }, intervalTime);

    // Staggered bars animation: 5 bars grow one after another
    BARS_DATA.forEach((bar, idx) => {
      setTimeout(() => {
        setBarPcts((prev) => {
          const next = [...prev];
          next[idx] = bar.pct;
          return next;
        });
      }, 200 + idx * 160);
    });

    setTimeout(() => {
      setAnimating(false);
    }, 200 + BARS_DATA.length * 160 + 400);
  };

  useEffect(() => {
    triggerAnimation();
  }, []);

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '110px 1fr',
      gap: '16px',
      alignItems: 'center',
      background: 'rgba(15, 23, 42, 0.6)',
      border: '1px solid rgba(255, 255, 255, 0.08)',
      borderRadius: '16px',
      padding: '14px 18px',
      position: 'relative'
    }}>
      {/* Left: Score & Stars */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <div style={{
          fontSize: '2.4rem',
          fontWeight: 900,
          color: '#ffffff',
          lineHeight: 1,
          fontFamily: 'monospace'
        }}>
          {currentScore.toFixed(1)}
        </div>

        <div style={{ display: 'flex', gap: '3px', margin: '6px 0 4px' }}>
          {[1, 2, 3, 4, 5].map((s) => (
            <Star key={s} size={14} fill="#f59e0b" color="#f59e0b" />
          ))}
        </div>

        <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>
          {totalReviews} ulasan
        </span>

        <button
          type="button"
          onClick={triggerAnimation}
          disabled={animating}
          title="Putar ulang animasi bar"
          style={{
            marginTop: '8px',
            background: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#38bdf8',
            borderRadius: '6px',
            padding: '3px 8px',
            cursor: 'pointer',
            fontSize: '0.68rem',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <RefreshCw size={10} className={animating ? 'animate-spin' : ''} />
          <span>Replay</span>
        </button>
      </div>

      {/* Right: 5 Staggered Review Bars */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {BARS_DATA.map((bar, idx) => (
          <div key={bar.star} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.74rem', color: '#cbd5e1', width: '12px', fontWeight: 700, fontFamily: 'monospace' }}>
              {bar.star}
            </span>

            {/* Bar Track */}
            <div style={{
              flex: 1,
              height: '8px',
              background: 'rgba(255, 255, 255, 0.08)',
              borderRadius: '999px',
              overflow: 'hidden'
            }}>
              {/* Animated Progress Fill */}
              <div style={{
                height: '100%',
                width: `${barPcts[idx]}%`,
                background: 'linear-gradient(90deg, #f59e0b 0%, #fbbf24 100%)',
                borderRadius: '999px',
                transition: 'width 0.65s cubic-bezier(0.34, 1.3, 0.64, 1)',
                boxShadow: barPcts[idx] > 0 ? '0 0 8px rgba(245, 158, 11, 0.5)' : 'none'
              }} />
            </div>

            <span style={{ fontSize: '0.7rem', color: '#64748b', width: '28px', textAlign: 'right', fontFamily: 'monospace' }}>
              {barPcts[idx]}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
