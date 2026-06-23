import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * TrackYT animated eye logo that follows the cursor.
 * 
 * Props:
 *  - size: number (px) — overall width/height of the eye (default 48)
 *  - variant: 'navbar' | 'hero' — styling variant
 *  - className: additional CSS classes
 *  - glowColor: string — the accent glow colour (default matches accent-500)
 */
export default function TrackYTLogo({ size = 48, variant = 'navbar', className = '', glowColor }) {
  const eyeRef = useRef(null);
  const [pupilOffset, setPupilOffset] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const frameRef = useRef(null);
  const targetRef = useRef({ x: 0, y: 0 });
  const currentRef = useRef({ x: 0, y: 0 });

  // Smooth lerp animation loop
  const animate = useCallback(() => {
    const lerp = 0.12;
    currentRef.current.x += (targetRef.current.x - currentRef.current.x) * lerp;
    currentRef.current.y += (targetRef.current.y - currentRef.current.y) * lerp;
    setPupilOffset({ x: currentRef.current.x, y: currentRef.current.y });
    frameRef.current = requestAnimationFrame(animate);
  }, []);

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!eyeRef.current) return;

      const rect = eyeRef.current.getBoundingClientRect();
      const eyeCenterX = rect.left + rect.width / 2;
      const eyeCenterY = rect.top + rect.height / 2;

      const dx = e.clientX - eyeCenterX;
      const dy = e.clientY - eyeCenterY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);

      // Max pupil movement is ~25% of the eye size
      const maxOffset = size * 0.2;
      // Ease the offset — the further the cursor, the more the pupil moves (capped)
      const clampedDist = Math.min(distance, 400);
      const ratio = clampedDist / 400;
      const offset = maxOffset * ratio;

      targetRef.current = {
        x: Math.cos(angle) * offset,
        y: Math.sin(angle) * offset,
      };
    };

    window.addEventListener('mousemove', handleMouseMove);
    frameRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, [size, animate]);

  const isHero = variant === 'hero';
  const accent = glowColor || '#E63B2E';

  // Derived measurements
  const eyeW = size;
  const eyeH = size * 0.55;
  const pupilR = size * 0.16;
  const irisR = size * 0.24;
  const highlightR = size * 0.06;

  return (
    <div
      ref={eyeRef}
      className={`trackyt-eye-logo ${variant} ${className}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        width: eyeW,
        height: eyeW, // square container for the eye
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        cursor: 'pointer',
      }}
    >
      {/* Outer glow for hero variant */}
      {isHero && (
        <div
          className="eye-outer-glow"
          style={{
            position: 'absolute',
            inset: -8,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${accent}22 0%, transparent 70%)`,
            filter: 'blur(12px)',
            opacity: isHovered ? 1 : 0.6,
            transition: 'opacity 0.4s ease',
            pointerEvents: 'none',
          }}
        />
      )}

      <svg
        viewBox={`0 0 ${eyeW} ${eyeH}`}
        width={eyeW}
        height={eyeH}
        style={{ overflow: 'visible' }}
      >
        <defs>
          {/* Iris gradient — warm red-to-amber like TrackYT's accent */}
          <radialGradient id={`iris-grad-${size}-${variant}`} cx="50%" cy="45%" r="50%">
            <stop offset="0%" stopColor="#FF6B4F" />
            <stop offset="55%" stopColor={accent} />
            <stop offset="100%" stopColor="#B82E22" />
          </radialGradient>

          {/* Sclera (white part) gradient for depth */}
          <radialGradient id={`sclera-grad-${size}-${variant}`} cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="100%" stopColor="#F5F0E8" />
          </radialGradient>

          {/* Eye shape clip — almond / leaf shape */}
          <clipPath id={`eye-clip-${size}-${variant}`}>
            <ellipse cx={eyeW / 2} cy={eyeH / 2} rx={eyeW * 0.46} ry={eyeH * 0.48} />
          </clipPath>

          {/* Shadow filter */}
          <filter id={`eye-shadow-${size}-${variant}`} x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="1" stdDeviation="2" floodColor="#1A1A1A" floodOpacity="0.15" />
          </filter>

          {/* Glow on iris */}
          <filter id={`iris-glow-${size}-${variant}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* === Eye outline (neo-brutalism thick border) === */}
        <g filter={`url(#eye-shadow-${size}-${variant})`}>
          {/* Almond eye shape using two quadratic arcs */}
          <path
            d={`
              M ${eyeW * 0.04} ${eyeH * 0.5}
              Q ${eyeW * 0.25} ${eyeH * -0.15}, ${eyeW * 0.5} ${eyeH * 0.02}
              Q ${eyeW * 0.75} ${eyeH * -0.15}, ${eyeW * 0.96} ${eyeH * 0.5}
              Q ${eyeW * 0.75} ${eyeH * 1.15}, ${eyeW * 0.5} ${eyeH * 0.98}
              Q ${eyeW * 0.25} ${eyeH * 1.15}, ${eyeW * 0.04} ${eyeH * 0.5}
              Z
            `}
            fill={`url(#sclera-grad-${size}-${variant})`}
            stroke="#1A1A1A"
            strokeWidth={isHero ? 3 : 2.5}
            strokeLinejoin="round"
          />
        </g>

        {/* === Iris === */}
        <g
          style={{
            transform: `translate(${pupilOffset.x}px, ${pupilOffset.y}px)`,
            transition: 'none',
          }}
        >
          {/* Iris circle */}
          <circle
            cx={eyeW / 2}
            cy={eyeH / 2}
            r={irisR}
            fill={`url(#iris-grad-${size}-${variant})`}
            filter={isHovered ? `url(#iris-glow-${size}-${variant})` : undefined}
          />

          {/* Iris texture rings */}
          <circle
            cx={eyeW / 2}
            cy={eyeH / 2}
            r={irisR * 0.8}
            fill="none"
            stroke={accent}
            strokeWidth="0.5"
            opacity="0.3"
          />
          <circle
            cx={eyeW / 2}
            cy={eyeH / 2}
            r={irisR * 0.6}
            fill="none"
            stroke="#FFD56B"
            strokeWidth="0.3"
            opacity="0.25"
          />

          {/* Pupil */}
          <circle
            cx={eyeW / 2}
            cy={eyeH / 2}
            r={isHovered ? pupilR * 1.2 : pupilR}
            fill="#0D0D0D"
            style={{ transition: 'r 0.3s ease' }}
          />

          {/* Highlight / reflection */}
          <circle
            cx={eyeW / 2 - pupilR * 0.5}
            cy={eyeH / 2 - pupilR * 0.6}
            r={highlightR}
            fill="white"
            opacity="0.9"
          />
          <circle
            cx={eyeW / 2 + pupilR * 0.4}
            cy={eyeH / 2 + pupilR * 0.3}
            r={highlightR * 0.5}
            fill="white"
            opacity="0.5"
          />
        </g>

        {/* === Upper eyelid subtle shadow === */}
        <path
          d={`
            M ${eyeW * 0.04} ${eyeH * 0.5}
            Q ${eyeW * 0.25} ${eyeH * -0.15}, ${eyeW * 0.5} ${eyeH * 0.02}
            Q ${eyeW * 0.75} ${eyeH * -0.15}, ${eyeW * 0.96} ${eyeH * 0.5}
          `}
          fill="none"
          stroke="#1A1A1A"
          strokeWidth="0.5"
          opacity="0.1"
          transform={`translate(0, ${eyeH * 0.06})`}
        />

        {/* === Play button triangle inside pupil (YouTube / TrackYT reference) === */}
        <g
          style={{
            transform: `translate(${pupilOffset.x}px, ${pupilOffset.y}px)`,
          }}
        >
          <polygon
            points={`
              ${eyeW / 2 - pupilR * 0.25},${eyeH / 2 - pupilR * 0.35}
              ${eyeW / 2 + pupilR * 0.45},${eyeH / 2}
              ${eyeW / 2 - pupilR * 0.25},${eyeH / 2 + pupilR * 0.35}
            `}
            fill={accent}
            opacity={isHovered ? 0.95 : 0.7}
            style={{ transition: 'opacity 0.3s ease' }}
          />
        </g>
      </svg>

      {/* Animated ring pulse on hover (hero only) */}
      {isHero && isHovered && (
        <div
          className="eye-pulse-ring"
          style={{
            position: 'absolute',
            inset: -4,
            borderRadius: '50%',
            border: `2px solid ${accent}`,
            animation: 'eyePulseRing 1.2s ease-out infinite',
            pointerEvents: 'none',
          }}
        />
      )}
    </div>
  );
}
