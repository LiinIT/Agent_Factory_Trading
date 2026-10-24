/**
 * Bộ lọc phát sáng và gradient kính dùng chung cho mọi vật thể trong thế giới.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-16
 */
export function WorldDefs() {
  return (
    <defs>
      <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="3.5" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>
      <filter id="halo" x="-80%" y="-80%" width="260%" height="260%">
        <feGaussianBlur stdDeviation="14" />
      </filter>
      <linearGradient id="glass-face" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="var(--neon)" stopOpacity="0.22" />
        <stop offset="100%" stopColor="var(--neon)" stopOpacity="0.04" />
      </linearGradient>
      <linearGradient id="card-face-active" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="var(--neon)" stopOpacity="0.55" />
        <stop offset="100%" stopColor="var(--neon)" stopOpacity="0.12" />
      </linearGradient>
      <pattern id="hex-grid" width="34" height="58.9" patternUnits="userSpaceOnUse" patternTransform="scale(0.9)">
        <path d="M17 0 L34 9.8 L34 29.4 L17 39.3 L0 29.4 L0 9.8 Z M17 39.3 L17 58.9" fill="none" stroke="var(--hex)" strokeWidth="0.8" />
      </pattern>
      <radialGradient id="floor-fade" cx="50%" cy="48%" r="60%">
        <stop offset="0%" stopColor="#fff" stopOpacity="1" />
        <stop offset="100%" stopColor="#fff" stopOpacity="0" />
      </radialGradient>
      <mask id="floor-mask">
        <rect x="-450" y="-270" width="900" height="700" fill="url(#floor-fade)" />
      </mask>
      <linearGradient id="body-face" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#1b2740" />
        <stop offset="100%" stopColor="#0d1424" />
      </linearGradient>
      <linearGradient id="body-face-active" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#1f4e7a" />
        <stop offset="100%" stopColor="#0f2238" />
      </linearGradient>
      <radialGradient id="core-light">
        <stop offset="0%" stopColor="var(--neon)" stopOpacity="0.7" />
        <stop offset="100%" stopColor="var(--neon)" stopOpacity="0" />
      </radialGradient>
    </defs>
  );
}
