import React from 'react';

const INK = '#1e1e1e';
const CREAM = '#f4eee2';
const ORANGE = '#f4893a';
const SKY = '#8fc1e6';
const PINK = '#e8919a';
const RIVER = '#23292d';
const BANK = '#2b2723';

const wavePath = (y: number, amp: number) => {
  let d = `M0 ${y} Q12 ${y - amp} 24 ${y}`;
  for (let x = 48; x <= 528; x += 24) d += ` T${x} ${y}`;
  return d;
};

/**
 * Sitting on the Paraná riverbank at sunset: laptop on the lap, mate in hand,
 * Monumento a la Bandera on the horizon.
 */
export const RosarioIllustration: React.FC<{ label: string }> = ({ label }) => (
  <svg
    viewBox="0 0 480 410"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="hero-art-svg boil-anim"
    role="img"
    aria-label={label}
  >
    <defs>
      <clipPath id="above-horizon">
        <rect x="0" y="0" width="480" height="330" />
      </clipPath>
      <clipPath id="river-area">
        <rect x="0" y="330" width="480" height="80" />
      </clipPath>
      <clipPath id="scene-shape">
        <rect x="6" y="0" width="468" height="404" rx="36" />
      </clipPath>
    </defs>

    <g clipPath="url(#scene-shape)">
    <g clipPath="url(#above-horizon)">
      <g className="sun-rise">
        <circle cx="318" cy="300" r="84" fill={ORANGE} />
        <rect x="230" y="276" width="180" height="4" fill={INK} />
        <rect x="230" y="292" width="180" height="6" fill={INK} />
        <rect x="230" y="310" width="180" height="8" fill={INK} />
      </g>
    </g>

    <g className="birds">
      <path d="M232 150 q6 -6 12 0 q6 -6 12 0" stroke={CREAM} strokeWidth="2.6" strokeLinecap="round" />
      <path d="M262 128 q5 -5 10 0 q5 -5 10 0" stroke={CREAM} strokeWidth="2.4" strokeLinecap="round" />
    </g>

    <g className="monument">
      <path d="M404 330 L424 330 L420 166 L408 166 Z" fill={CREAM} stroke={INK} strokeWidth="3" strokeLinejoin="round" />
      <rect x="403" y="156" width="22" height="10" rx="2" fill={CREAM} stroke={INK} strokeWidth="3" />
      <path d="M414 156 V144" stroke={CREAM} strokeWidth="3" strokeLinecap="round" />
      <rect x="318" y="298" width="86" height="26" fill={CREAM} stroke={INK} strokeWidth="3" />
      <path d="M332 304 V320 M346 304 V320 M360 304 V320 M374 304 V320 M388 304 V320" stroke={INK} strokeWidth="2.6" strokeLinecap="round" />
      <rect x="300" y="322" width="150" height="8" rx="2" fill={CREAM} stroke={INK} strokeWidth="3" />

      <path d="M306 322 V246" stroke={CREAM} strokeWidth="3" strokeLinecap="round" />
      <g className="flag-wave">
        <path d="M307 248 H337 V256 H307 Z" fill={SKY} />
        <path d="M307 256 H337 V264 H307 Z" fill={CREAM} />
        <circle cx="322" cy="260" r="2.4" fill={ORANGE} />
        <path d="M307 264 H337 V272 H307 Z" fill={SKY} />
      </g>
    </g>

    <rect x="0" y="330" width="480" height="80" fill={RIVER} />
    <g clipPath="url(#river-area)">
      <g className="sun-glint">
        <path d="M282 342 H354 M294 354 H342 M304 366 H332 M312 378 H324" stroke={ORANGE} strokeWidth="3.5" strokeLinecap="round" />
      </g>
      <path className="wave wave-a" d={wavePath(348, 5)} stroke={SKY} strokeWidth="2.6" strokeLinecap="round" opacity="0.7" />
      <path className="wave wave-b" d={wavePath(372, 6)} stroke={SKY} strokeWidth="2.6" strokeLinecap="round" opacity="0.45" />
      <path className="wave wave-a" d={wavePath(396, 5)} stroke={SKY} strokeWidth="2.6" strokeLinecap="round" opacity="0.3" />
    </g>

    <path d="M0 316 C70 308 170 310 252 334 C262 340 262 410 262 410 H0 Z" fill={BANK} />
    <path d="M26 318 l-3 -10 M31 318 l2 -12 M212 322 l-2 -10 M218 324 l3 -11 M236 330 l1 -9" stroke="#57534e" strokeWidth="2.6" strokeLinecap="round" />

    <g className="thermos">
      <rect x="188" y="270" width="22" height="52" rx="7" fill={SKY} stroke={INK} strokeWidth="3" />
      <rect x="190" y="260" width="18" height="12" rx="3" fill={CREAM} stroke={INK} strokeWidth="3" />
      <path d="M192 290 H206" stroke={INK} strokeWidth="2.4" strokeLinecap="round" />
    </g>

    <g className="kid">
      <ellipse cx="70" cy="322" rx="15" ry="7" fill={ORANGE} stroke={INK} strokeWidth="3" />
      <ellipse cx="172" cy="322" rx="15" ry="7" fill={ORANGE} stroke={INK} strokeWidth="3" />
      <path
        d="M62 318 C60 300 92 294 120 302 C148 294 182 300 180 318 C170 332 72 332 62 318 Z"
        fill={CREAM}
        stroke={INK}
        strokeWidth="3.5"
        strokeLinejoin="round"
      />

      <g className="kid-breathe">
        <path
          d="M86 306 C80 270 92 244 120 242 C148 244 160 270 154 306 Z"
          fill={PINK}
          stroke={INK}
          strokeWidth="3.5"
          strokeLinejoin="round"
        />

        <g className="kid-sip">
          <path d="M94 256 C72 262 66 240 76 228" stroke={INK} strokeWidth="15" strokeLinecap="round" />
          <path d="M94 256 C72 262 66 240 76 228" stroke={PINK} strokeWidth="9" strokeLinecap="round" />
          <circle cx="77" cy="226" r="7.5" fill={CREAM} stroke={INK} strokeWidth="3" />
          <path d="M66 208 C64 194 92 194 90 208 C90 220 66 220 66 208 Z" fill={ORANGE} stroke={INK} strokeWidth="3" />
          <path d="M67 210 H89" stroke={INK} strokeWidth="2.2" />
          <ellipse cx="78" cy="198" rx="9" ry="3" fill="#7fa36b" stroke={INK} strokeWidth="2.4" />
          <path d="M80 198 L94 182" stroke="#c8c2b8" strokeWidth="3" strokeLinecap="round" />
          <g className="steam">
            <path d="M70 188 c-5 -6 5 -10 0 -17" stroke={CREAM} strokeWidth="2.4" strokeLinecap="round" />
            <path d="M80 184 c-5 -6 5 -10 0 -17" stroke={CREAM} strokeWidth="2.4" strokeLinecap="round" />
          </g>
        </g>

        <g className="kid-head">
          <circle cx="98" cy="198" r="11" fill={INK} stroke={CREAM} strokeWidth="2" />
          <circle cx="111" cy="189" r="12" fill={INK} stroke={CREAM} strokeWidth="2" />
          <circle cx="127" cy="187" r="12" fill={INK} stroke={CREAM} strokeWidth="2" />
          <circle cx="141" cy="195" r="11" fill={INK} stroke={CREAM} strokeWidth="2" />
          <circle cx="120" cy="216" r="27" fill={CREAM} stroke={INK} strokeWidth="3.5" />
          <path d="M96 206 C100 194 140 192 145 206 C132 200 108 200 96 206 Z" fill={INK} />
          <circle cx="110" cy="219" r="7" stroke={INK} strokeWidth="2.6" />
          <circle cx="131" cy="219" r="7" stroke={INK} strokeWidth="2.6" />
          <path d="M117 219 H124" stroke={INK} strokeWidth="2.6" strokeLinecap="round" />
          <circle className="blink" cx="110" cy="219" r="2" fill={INK} />
          <circle className="blink" cx="131" cy="219" r="2" fill={INK} />
          <path d="M113 232 Q120 237 128 231" stroke={INK} strokeWidth="2.6" strokeLinecap="round" />
          <circle cx="101" cy="230" r="3" fill={PINK} />
          <circle cx="140" cy="230" r="3" fill={PINK} />
        </g>

        <rect x="91" y="262" width="60" height="42" rx="4" fill="#262320" stroke={CREAM} strokeWidth="3" />
        <path d="M98 272 H118" stroke={ORANGE} strokeWidth="2.6" strokeLinecap="round" />
        <path d="M104 280 H132" stroke={SKY} strokeWidth="2.6" strokeLinecap="round" />
        <path d="M104 288 H124" stroke={PINK} strokeWidth="2.6" strokeLinecap="round" />
        <path d="M98 296 H110" stroke={CREAM} strokeWidth="2.6" strokeLinecap="round" />
        <rect className="cursor" x="114" y="292" width="6" height="7" fill={ORANGE} />
        <path d="M84 304 H158 L164 311 H78 Z" fill={CREAM} stroke={INK} strokeWidth="3" strokeLinejoin="round" />

        <path d="M148 256 C166 270 164 294 152 302" stroke={INK} strokeWidth="15" strokeLinecap="round" />
        <path d="M148 256 C166 270 164 294 152 302" stroke={PINK} strokeWidth="9" strokeLinecap="round" />
        <circle className="typing" cx="150" cy="304" r="7" fill={CREAM} stroke={INK} strokeWidth="3" />
      </g>
    </g>
    </g>
  </svg>
);
