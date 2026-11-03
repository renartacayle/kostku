import React from 'react';
import StarCascade from './StarCascade';
import EmojiScale from './EmojiScale';
import HalfStars from './HalfStars';
import ReviewBars from './ReviewBars';
import ThanksMorph from './ThanksMorph';
import { Sparkles } from 'lucide-react';

/**
 * RatingMotionSuite - UI Motion Prompts "Rating 星の評価 Part 1"
 * Excludes Mood Slider per user directive.
 */
export default function RatingMotionSuite() {
  const cards = [
    {
      id: 1,
      num: '1',
      title: 'Star Cascade',
      desc: 'Tap the 4th star: the stars fill one by one with a pop and a gold glow.',
      component: <StarCascade value={4} />
    },
    {
      id: 2,
      num: '2',
      title: 'Emoji Scale',
      desc: 'Tap a face: it grows and lights up, the others shrink and turn gray.',
      component: <EmojiScale value={4} />
    },
    {
      id: 3,
      num: '3',
      title: 'Half Stars',
      desc: 'Drag across the stars: they fill in half steps and the score follows.',
      component: <HalfStars value={3.5} />
    },
    {
      id: 5,
      num: '4', // numbered 4 since Mood Slider was omitted
      title: 'Review Bars',
      desc: 'The score counts up to 4.6 while the five bars grow one after another.',
      component: <ReviewBars targetScore={4.6} totalReviews={128} />
    },
    {
      id: 6,
      num: '5',
      title: 'Thanks Morph',
      desc: 'Tap the 5th star: they fill, gather into one and morph into "Thanks!"',
      component: <ThanksMorph />
    }
  ];

  return (
    <div style={{ marginTop: '2.5rem' }}>
      <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: '4px 14px',
          borderRadius: '999px',
          background: 'rgba(245, 158, 11, 0.15)',
          border: '1px solid rgba(245, 158, 11, 0.35)',
          color: '#f59e0b',
          fontSize: '0.78rem',
          fontWeight: 800,
          textTransform: 'uppercase',
          letterSpacing: '0.04em',
          marginBottom: '0.5rem'
        }}>
          <Sparkles size={14} />
          <span>UI Motion Prompts • Rating Suite (Part 1)</span>
        </div>
        <h3 style={{ margin: 0, fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>
          Star Rating Micro-Interactions (Spring &amp; Morph Physics)
        </h3>
        <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
          Interaksi taktil berbintang responsif tanpa input mood kaku — coba langsung setiap kartu di bawah:
        </p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '1.25rem'
      }}>
        {cards.map((card) => (
          <div
            key={card.id}
            style={{
              background: 'rgba(15, 23, 42, 0.75)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              borderRadius: '20px',
              padding: '1.5rem 1.25rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              minHeight: '220px',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.3)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            {/* Component Interactive Area */}
            <div style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem 0'
            }}>
              {card.component}
            </div>

            {/* Card Footer Info */}
            <div style={{
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              paddingTop: '12px',
              marginTop: '8px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{
                  fontSize: '0.74rem',
                  fontWeight: 900,
                  color: '#38bdf8',
                  background: 'rgba(56, 189, 248, 0.15)',
                  padding: '1px 6px',
                  borderRadius: '4px'
                }}>
                  {card.num}
                </span>
                <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#f8fafc' }}>
                  {card.title}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.74rem', color: '#94a3b8', lineHeight: 1.4 }}>
                {card.desc}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
