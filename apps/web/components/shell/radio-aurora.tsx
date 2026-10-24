/**
 * Các dải cực quang trong suốt bao viền màn hình khi trò chuyện.
 * Author: HoNgocKhanh
 * Company: MiaStudio
 * Time: 2026-10-17
 */
export function RadioAurora() {
  return (
    <div className="radio-aurora" aria-hidden="true">
      <svg className="radio-aurora-sky" viewBox="0 0 1440 1000" preserveAspectRatio="none">
        <defs>
          <linearGradient id="radio-aurora-green" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#68ffce" stopOpacity="0" />
            <stop offset="0.66" stopColor="#24e8b2" stopOpacity="0.03" />
            <stop offset="0.94" stopColor="#27f4cf" stopOpacity="0.48" />
            <stop offset="1" stopColor="#b5ffe8" stopOpacity="0.86" />
          </linearGradient>
          <linearGradient id="radio-aurora-blue" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#1688dc" stopOpacity="0" />
            <stop offset="0.76" stopColor="#2b9cfa" stopOpacity="0.06" />
            <stop offset="0.96" stopColor="#64dfff" stopOpacity="0.52" />
            <stop offset="1" stopColor="#c0f6ff" stopOpacity="0.78" />
          </linearGradient>
          <linearGradient id="radio-aurora-rose" x1="0" y1="0" x2="0" y2="1">
            <stop stopColor="#6e63de" stopOpacity="0" />
            <stop offset="0.84" stopColor="#a294f0" stopOpacity="0.06" />
            <stop offset="1" stopColor="#f0c1f6" stopOpacity="0.38" />
          </linearGradient>
        </defs>
        <g id="radio-aurora-curtains">
        <g className="radio-aurora-curtain is-green">
          <path fill="url(#radio-aurora-green)" d="M -200 -250 H 1640 V 330 C 1370 100 1280 570 1010 205 S 520 380 310 180 S -60 540 -200 300 Z" />
        </g>
        <g className="radio-aurora-curtain is-blue">
          <path fill="url(#radio-aurora-blue)" d="M -200 -250 H 1640 V 220 C 1380 490 1190 80 990 290 S 600 50 390 300 S 30 110 -200 370 Z" />
        </g>
        <g className="radio-aurora-curtain is-rose">
          <path fill="url(#radio-aurora-rose)" d="M -200 -250 H 1640 V 160 C 1400 40 1250 310 1060 155 S 650 360 430 145 S 30 240 -200 110 Z" />
        </g>
        </g>
        <use href="#radio-aurora-curtains" transform="translate(1440 1000) rotate(180)" opacity="0.45" />
      </svg>
    </div>
  );
}
