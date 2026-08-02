import { useState, useEffect, useRef, useCallback, useMemo } from 'react';

/**
 * VaporizeTextCycle — Cycles through an array of text strings with a
 * "vaporize" particle-dissolution effect.  Each text is displayed for
 * `waitDuration`, then characters dissolve into particles that drift in
 * the configured `direction`.  The next text fades in over `fadeInDuration`.
 *
 * Props
 * ─────
 * texts        : string[]   — texts to cycle through
 * font         : object     — { fontFamily, fontSize, fontWeight }
 * color        : string     — CSS color (e.g. "rgb(255,165,0)")
 * spread       : number     — how far particles spread (px multiplier)
 * density      : number     — particles per character
 * animation    : object     — { vaporizeDuration, fadeInDuration, waitDuration } (seconds)
 * direction    : string     — "left-to-right" | "right-to-left" | "top" | "bottom"
 * alignment    : string     — "center" | "left" | "right"
 * tag          : string     — HTML tag to render (e.g. "h1")
 */

// ── tiny helpers ──────────────────────────────────────────────────────
function parseColor(color) {
  const m = color.match(/(\d+)/g);
  return m ? m.map(Number) : [255, 165, 0];
}

function directionVector(dir) {
  switch (dir) {
    case 'right-to-left': return { x: -1, y: 0 };
    case 'top':           return { x: 0, y: -1 };
    case 'bottom':        return { x: 0, y: 1 };
    case 'left-to-right':
    default:              return { x: 1, y: 0 };
  }
}

// ── phases ────────────────────────────────────────────────────────────
const PHASE_SHOW     = 'show';
const PHASE_VAPORIZE = 'vaporize';
const PHASE_FADEIN   = 'fadein';

const FINAL_TEXT = 'DSA FORGE';

export default function VaporizeTextCycle({
  texts = [
    'MASTER DSA',
    'CRACK INTERVIEWS',
    'BUILD CONSISTENCY',
    'DSA FORGE',
  ],
  font = {},
  color = 'rgb(210,210,210)',
  spread = 6,
  density = 5,
  animation = {},
  direction = 'left-to-right',
  alignment = 'center',
  tag = 'h1',
}) {
  const {
    vaporizeDuration = 2,
    fadeInDuration   = 1,
    waitDuration     = 0.5,
  } = animation;

  const containerRef = useRef(null);
  const canvasRef    = useRef(null);
  const textRef      = useRef(null);
  const rafRef       = useRef(null);
  const particlesRef = useRef([]);
  const phaseRef     = useRef(PHASE_SHOW);
  const startRef     = useRef(null);

  const [index, setIndex] = useState(0);
  const [textOpacity, setTextOpacity] = useState(1);
  const [isFinished, setIsFinished] = useState(false);
  const [animationState, setAnimationState] = useState('static');

  // Keep a ref in sync to stop RAF cleanly inside tick()
  const isFinishedRef = useRef(false);

  const [r, g, b] = useMemo(() => parseColor(color), [color]);
  const dir = useMemo(() => directionVector(direction), [direction]);

  const renderFinalTextToCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const globalDpr = window.devicePixelRatio || 1;

    const cssW = Math.max(1, Math.floor(rect.width));
    const cssH = Math.max(1, Math.floor(rect.height));

    canvas.width = Math.floor(cssW * globalDpr);
    canvas.height = Math.floor(cssH * globalDpr);

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.save();
    ctx.scale(globalDpr, globalDpr);
    ctx.fillStyle = 'rgb(220,220,220)';
    ctx.font = `600 ${96}px JetBrains Mono, Fira Code, monospace`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(FINAL_TEXT, cssW / 2, cssH / 2);
    ctx.restore();
  }, []);

  // ── build particles from the current text element ──────────────────
  const buildParticles = useCallback(() => {
    const el = textRef.current;
    const canvas = canvasRef.current;
    if (!el || !canvas) return;

    const rect = el.getBoundingClientRect();
    const containerRect = containerRef.current.getBoundingClientRect();
    canvas.width = containerRect.width;
    canvas.height = containerRect.height;

    const text = el.textContent || '';
    const particles = [];

    // measure each character position
    const range = document.createRange();
    const textNode = el.firstChild;
    if (!textNode) return;

    for (let i = 0; i < text.length; i++) {
      if (text[i] === ' ') continue;
      range.setStart(textNode, i);
      range.setEnd(textNode, i + 1);
      const charRect = range.getBoundingClientRect();

      const cx = charRect.left - containerRect.left + charRect.width / 2;
      const cy = charRect.top - containerRect.top + charRect.height / 2;

      for (let d = 0; d < density; d++) {
        particles.push({
          x: cx + (Math.random() - 0.5) * charRect.width * 0.6,
          y: cy + (Math.random() - 0.5) * charRect.height * 0.6,
          vx: dir.x * (1 + Math.random() * spread) + (Math.random() - 0.5) * spread * 0.5,
          vy: dir.y * (1 + Math.random() * spread) + (Math.random() - 0.5) * spread * 0.5,
          size: 1.5 + Math.random() * 2.5,
          life: 1,
          decay: 0.6 + Math.random() * 0.4, // normalised 0–1, actual speed scaled later
        });
      }
    }

    particlesRef.current = particles;
  }, [density, spread, dir]);

  // ── animation loop ─────────────────────────────────────────────────
  const tick = useCallback((ts) => {
    // Prevent animation loop restart
    if (isFinishedRef.current || animationState === 'finished') {
      renderFinalTextToCanvas();
      return;
    }

    if (startRef.current === null) startRef.current = ts;
    const elapsed = (ts - startRef.current) / 1000;
    const phase = phaseRef.current;

    // ── SHOW phase (wait) ──
    if (phase === PHASE_SHOW) {
      setAnimationState('show');
      if (elapsed >= waitDuration) {
        phaseRef.current = PHASE_VAPORIZE;
        startRef.current = ts;
        buildParticles();
        setTextOpacity(0); // hide text immediately; particles take over
      }
      rafRef.current = requestAnimationFrame(tick);
      return;
    }

    // ── VAPORIZE phase ──
    if (phase === PHASE_VAPORIZE) {
      setAnimationState('vaporize');
      const canvas = canvasRef.current;
      if (!canvas) { rafRef.current = requestAnimationFrame(tick); return; }
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const progress = Math.min(elapsed / vaporizeDuration, 1);
      let alive = 0;

      particlesRef.current.forEach((p) => {
        p.life -= p.decay * (1 / (vaporizeDuration * 60)); // rough per-frame decay
        if (p.life <= 0) return;
        alive++;

        p.x += p.vx * 0.6;
        p.y += p.vy * 0.6;

        const alpha = p.life * (1 - progress * 0.5);
        ctx.fillStyle = `rgba(${r},${g},${b},${Math.max(0, alpha).toFixed(2)})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
        ctx.fill();
      });

      // After vaporization completes: finish and show final static text.
      if (progress >= 1 || alive === 0) {
        setAnimationState('finished');
        setIsFinished(true);
        isFinishedRef.current = true;

        // Swap to final text and render it once on canvas.
        setTextOpacity(0);
        renderFinalTextToCanvas();
        return;
      }

      rafRef.current = requestAnimationFrame(tick);
      return;
    }

    // Disable fade-in cycling completely (single-run animation).
  }, [
    waitDuration,
    vaporizeDuration,
    buildParticles,
    r,
    g,
    b,
    isFinished,
    animationState,
    renderFinalTextToCanvas,
  ]);

  useEffect(() => {
    phaseRef.current = PHASE_SHOW;
    startRef.current = null;
    setTextOpacity(1);
    setIsFinished(false);
    setAnimationState('static');
    isFinishedRef.current = false;
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [tick]);

  // ── render ─────────────────────────────────────────────────────────
  const Tag = tag || 'h1';

  const textAlign = alignment === 'left' ? 'left' : alignment === 'right' ? 'right' : 'center';

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        textAlign,
        overflow: 'hidden',
      }}
    >
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />
      <Tag
        ref={textRef}
        style={{
          ...font,
          color,
          opacity: textOpacity,
          transition: 'none',
          margin: 0,
          position: 'relative',
          zIndex: 0,
          lineHeight: 1.1,
          whiteSpace: 'nowrap',
        }}
      >
        {animationState === 'finished' ? FINAL_TEXT : texts[index]}
      </Tag>
    </div>
  );
}
