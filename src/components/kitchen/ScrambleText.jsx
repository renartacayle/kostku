import React, { useState, useEffect, useRef } from 'react';

/**
 * ScrambleText - Inspired by "The Kitchen" by JP (dqnamo)
 * Compact text component that reveals text through an encrypted character scramble.
 */
export default function ScrambleText({
  text = '',
  scrambleChars = '!<>-_\\/[]{}—=+*^?#',
  duration = 600,
  triggerOnHover = true,
  className = '',
  style = {}
}) {
  const [displayText, setDisplayText] = useState(text);
  const isScramblingRef = useRef(false);

  const scramble = () => {
    if (isScramblingRef.current || !text) return;
    isScramblingRef.current = true;

    const length = text.length;
    const startTime = performance.now();

    const update = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      const revealedLength = Math.floor(progress * length);

      let scrambled = '';
      for (let i = 0; i < length; i++) {
        if (i < revealedLength || text[i] === ' ') {
          scrambled += text[i];
        } else {
          scrambled += scrambleChars[Math.floor(Math.random() * scrambleChars.length)];
        }
      }

      setDisplayText(scrambled);

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        setDisplayText(text);
        isScramblingRef.current = false;
      }
    };

    requestAnimationFrame(update);
  };

  useEffect(() => {
    scramble();
  }, [text]);

  return (
    <span
      className={`scramble-text ${className}`}
      onMouseEnter={triggerOnHover ? scramble : undefined}
      style={{
        display: 'inline-block',
        fontVariantNumeric: 'tabular-nums',
        cursor: triggerOnHover ? 'pointer' : 'inherit',
        ...style
      }}
    >
      {displayText}
    </span>
  );
}
