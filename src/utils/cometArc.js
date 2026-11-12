/**
 * Comet Arc ("Connect Arc") Animation Engine
 * Inspired by UI Motion Prompts: "Add to Cart Part 3 - Option 1: Comet Arc"
 * ("A glowing ball arcs from the button into the cart, leaving a dotted trail.")
 * 
 * 100% 2D Spring Physics & Ballistic Quadratic Bezier Trajectory
 * NO 3D skew or 3D rotations - buttery smooth 60fps GPU-accelerated.
 */

export function triggerCometArc({
  startEl,
  targetEl,
  startCoord = null,
  targetCoord = null,
  color = '#38bdf8', // Neon electric cyan (as in UI motion prompt)
  glowColor = 'rgba(56, 189, 248, 0.7)',
  particleCount = 14,
  duration = 650, // ms
  onComplete
} = {}) {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  // 1. Resolve Start Coordinates
  let x0 = 0;
  let y0 = 0;

  if (startCoord) {
    x0 = startCoord.x;
    y0 = startCoord.y;
  } else if (startEl && startEl.getBoundingClientRect) {
    const rect = startEl.getBoundingClientRect();
    x0 = rect.left + rect.width / 2;
    y0 = rect.top + rect.height / 2;
  } else {
    x0 = window.innerWidth / 2;
    y0 = window.innerHeight / 2;
  }

  // 2. Resolve Target Coordinates
  let x1 = 0;
  let y1 = 0;
  let resolvedTargetEl = targetEl;

  if (!resolvedTargetEl) {
    // Try to find a cart element in DOM with data-cart-target or cart icon
    resolvedTargetEl = document.querySelector('[data-cart-target]') || 
                       document.querySelector('.cart-icon-target') ||
                       document.querySelector('.pos-cart-badge');
  }

  if (targetCoord) {
    x1 = targetCoord.x;
    y1 = targetCoord.y;
  } else if (resolvedTargetEl && resolvedTargetEl.getBoundingClientRect) {
    const rect = resolvedTargetEl.getBoundingClientRect();
    x1 = rect.left + rect.width / 2;
    y1 = rect.top + rect.height / 2;
  } else {
    // Default fallback to top right or bottom right
    x1 = window.innerWidth - 48;
    y1 = 48;
  }

  // 3. Compute Ballistic Quadratic Bezier Arc Control Point
  const dx = x1 - x0;
  const dy = y1 - y0;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Natural arc height based on distance
  const arcHeight = Math.max(70, Math.min(220, dist * 0.35));
  const cx = (x0 + x1) / 2;
  const cy = Math.min(y0, y1) - arcHeight;

  // Bezier point formula B(t) = (1-t)^2 * P0 + 2*(1-t)*t * P_ctrl + t^2 * P1
  function getBezierPoint(t) {
    const mt = 1 - t;
    const x = mt * mt * x0 + 2 * mt * t * cx + t * t * x1;
    const y = mt * mt * y0 + 2 * mt * t * cy + t * t * y1;
    return { x, y };
  }

  // 4. Create Overlay Canvas / Container
  const container = document.createElement('div');
  container.className = 'comet-arc-overlay';
  Object.assign(container.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100vw',
    height: '100vh',
    pointerEvents: 'none',
    zIndex: '999999',
    overflow: 'hidden'
  });
  document.body.appendChild(container);

  // Head ball element
  const head = document.createElement('div');
  Object.assign(head.style, {
    position: 'absolute',
    width: '14px',
    height: '14px',
    borderRadius: '50%',
    background: `radial-gradient(circle at 35% 35%, #ffffff 0%, ${color} 65%, #0284c7 100%)`,
    boxShadow: `0 0 12px ${color}, 0 0 24px ${glowColor}, 0 0 36px ${glowColor}`,
    transform: `translate3d(${x0 - 7}px, ${y0 - 7}px, 0) scale(1)`,
    willChange: 'transform, opacity',
    transition: 'none'
  });
  container.appendChild(head);

  // Trail dots storage
  const trailDots = [];
  const trailIntervalMs = duration / (particleCount * 1.5);
  let lastTrailTime = 0;

  // Ease-out quad / cubic for smooth ballistic motion
  function easeOutCubic(x) {
    return 1 - Math.pow(1 - x, 3);
  }

  const startTime = performance.now();

  function animate(now) {
    const elapsed = now - startTime;
    const rawProgress = Math.min(1, elapsed / duration);
    const t = easeOutCubic(rawProgress);

    const pos = getBezierPoint(t);

    // Update Head Position
    const scale = 1 - 0.25 * t; // slightly tapers as it enters cart
    head.style.transform = `translate3d(${pos.x - 7}px, ${pos.y - 7}px, 0) scale(${scale})`;

    // Spawn Trail Dot every interval
    if (elapsed - lastTrailTime > trailIntervalMs && rawProgress < 0.95) {
      lastTrailTime = elapsed;
      const dot = document.createElement('div');
      const dotSize = Math.max(3, 8 * (1 - rawProgress * 0.5));
      Object.assign(dot.style, {
        position: 'absolute',
        width: `${dotSize}px`,
        height: `${dotSize}px`,
        borderRadius: '50%',
        background: color,
        boxShadow: `0 0 8px ${color}, 0 0 14px ${glowColor}`,
        transform: `translate3d(${pos.x - dotSize / 2}px, ${pos.y - dotSize / 2}px, 0) scale(1)`,
        opacity: '0.85',
        transition: 'opacity 0.4s ease-out, transform 0.4s ease-out',
        willChange: 'transform, opacity'
      });
      container.appendChild(dot);
      trailDots.push(dot);

      // Fade out dot
      setTimeout(() => {
        dot.style.opacity = '0';
        dot.style.transform = `translate3d(${pos.x - dotSize / 2}px, ${pos.y - dotSize / 2}px, 0) scale(0.3)`;
      }, 50);
    }

    if (rawProgress < 1) {
      requestAnimationFrame(animate);
    } else {
      // 5. Landing Impact on Cart
      head.style.opacity = '0';

      // Spawn Impact Ripple on Cart Target
      const ripple = document.createElement('div');
      Object.assign(ripple.style, {
        position: 'absolute',
        width: '32px',
        height: '32px',
        borderRadius: '50%',
        border: `2px solid ${color}`,
        boxShadow: `0 0 16px ${glowColor}`,
        transform: `translate3d(${x1 - 16}px, ${y1 - 16}px, 0) scale(0.5)`,
        opacity: '1',
        transition: 'transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s ease-out',
        willChange: 'transform, opacity'
      });
      container.appendChild(ripple);

      setTimeout(() => {
        ripple.style.transform = `translate3d(${x1 - 16}px, ${y1 - 16}px, 0) scale(1.8)`;
        ripple.style.opacity = '0';
      }, 20);

      // Trigger Cart Bounce on Target Element
      if (resolvedTargetEl) {
        resolvedTargetEl.classList.add('comet-cart-bounce');
        setTimeout(() => {
          resolvedTargetEl.classList.remove('comet-cart-bounce');
        }, 550);
      }

      if (onComplete) onComplete();

      // Cleanup overlay container after trails dissolve
      setTimeout(() => {
        if (container.parentNode) {
          container.parentNode.removeChild(container);
        }
      }, 450);
    }
  }

  requestAnimationFrame(animate);
}
