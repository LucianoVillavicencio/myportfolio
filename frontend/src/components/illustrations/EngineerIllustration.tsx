import React from 'react';

/**
 * Hand-drawn Hardware, Network & Software Engineer at Workbench
 * Styled with the exact charcoal (#1e1e1e), cream (#f4eee2), and warm yellow (#f0b420)
 * boil-line aesthetic of jager.ar, with animated character & lab equipment movement.
 */
export const HardwareNetworkEngineerIllustration: React.FC = () => (
  <svg
    viewBox="0 0 480 410"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="hero-art-svg boil-anim"
    aria-label="Illustration of an engineer working at a desk with hardware, router, and laptop"
  >
    {/* Floating Wall Shelf: Oscilloscope + Dual-Antenna Router */}
    <g className="shelf-rig">
      {/* Shelf plank & brackets */}
      <path
        d="M210 212 H385"
        stroke="#f4eee2"
        strokeWidth="4"
        strokeLinecap="round"
      />
      <path
        d="M235 212 V226 M360 212 V226"
        stroke="#f4eee2"
        strokeWidth="3"
        strokeLinecap="round"
      />

      {/* Stacked Hardware Manuals / Databooks on Shelf */}
      <rect
        x="222"
        y="196"
        width="54"
        height="13"
        rx="2"
        fill="#f4eee2"
        stroke="#1e1e1e"
        strokeWidth="2.5"
      />
      <rect
        x="226"
        y="182"
        width="46"
        height="13"
        rx="2"
        fill="#f4eee2"
        stroke="#1e1e1e"
        strokeWidth="2.5"
      />

      {/* Oscilloscope / Logic Analyzer on Shelf */}
      <rect
        x="286"
        y="164"
        width="64"
        height="45"
        rx="5"
        fill="#f4eee2"
        stroke="#1e1e1e"
        strokeWidth="3"
      />
      <rect
        x="293"
        y="171"
        width="38"
        height="30"
        rx="3"
        fill="#1e1e1e"
      />
      {/* Live moving waveform inside Oscilloscope */}
      <path
        className="osc-wave"
        d="M296 186 Q302 174 307 186 T318 186 T329 186"
        stroke="#f0b420"
        strokeWidth="2.8"
        strokeLinecap="round"
        fill="none"
      />
      <circle cx="340" cy="179" r="3.5" fill="#f36c5a" />
      <circle cx="340" cy="193" r="3.5" fill="#1e1e1e" />

      {/* Dual-Antenna Router with Pulsing Packet Waves */}
      <path
        d="M362 192 L357 166 M376 192 L382 166"
        stroke="#f4eee2"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <rect
        x="356"
        y="192"
        width="26"
        height="17"
        rx="3"
        fill="#f4eee2"
        stroke="#1e1e1e"
        strokeWidth="2.5"
      />
      <circle className="led-dot d-a" cx="364" cy="200" r="2.2" fill="#f0b420" />
      <circle className="led-dot d-b" cx="373" cy="200" r="2.2" fill="#f36c5a" />
      {/* Radio Signal Arcs */}
      <path
        className="signal-arc s-1"
        d="M362 156 Q370 148 378 156"
        stroke="#b0a5fa"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
      <path
        className="signal-arc s-2"
        d="M356 148 Q370 136 384 148"
        stroke="#f0b420"
        strokeWidth="2.8"
        strokeLinecap="round"
      />
    </g>

    {/* Desk, Laptop & Mini Network Switch */}
    <g className="desk-rig">
      {/* Laptop Screen */}
      <path
        d="M222 308 L238 250 C240 244 246 241 253 241 H312 C318 241 322 246 320 253 L304 308 Z"
        fill="#f4eee2"
        stroke="#1e1e1e"
        strokeWidth="3.5"
      />
      {/* Video call / Network Topology inside Laptop */}
      <circle
        cx="277"
        cy="274"
        r="11"
        fill="#f4eee2"
        stroke="#1e1e1e"
        strokeWidth="3.2"
      />
      <path
        d="M258 302 C258 289 296 289 296 302"
        stroke="#1e1e1e"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <path
        d="M256 276 C256 262 263 258 266 272"
        stroke="#1e1e1e"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      <path
        d="M294 274 C297 260 304 262 301 280"
        stroke="#1e1e1e"
        strokeWidth="3.2"
        strokeLinecap="round"
      />
      {/* Laptop Base */}
      <rect
        x="200"
        y="306"
        width="108"
        height="8"
        rx="4"
        fill="#f4eee2"
        stroke="#1e1e1e"
        strokeWidth="3"
      />

      {/* Mini Desktop Network Switch / Rack Unit on Right of Desk */}
      <rect
        x="328"
        y="272"
        width="62"
        height="42"
        rx="4"
        fill="#262320"
        stroke="#f4eee2"
        strokeWidth="3"
      />
      <line x1="334" y1="293" x2="384" y2="293" stroke="#f4eee2" strokeWidth="2.2" />
      <circle className="led-dot d-a" cx="342" cy="282" r="2.8" fill="#f0b420" />
      <circle className="led-dot d-b" cx="352" cy="282" r="2.8" fill="#f36c5a" />
      <circle className="led-dot d-c" cx="362" cy="282" r="2.8" fill="#b0a5fa" />
      <circle className="led-dot d-a" cx="342" cy="303" r="2.8" fill="#f0b420" />
      <circle className="led-dot d-c" cx="352" cy="303" r="2.8" fill="#b0a5fa" />

      {/* Patch Cable looping from Switch */}
      <path
        d="M376 282 C406 284 404 310 374 304"
        stroke="#f36c5a"
        strokeWidth="3.2"
        strokeLinecap="round"
      />

      {/* Desk Plank */}
      <rect
        x="130"
        y="314"
        width="270"
        height="8"
        rx="4"
        fill="#f4eee2"
      />
      {/* Desk Legs */}
      <path
        d="M166 322 L148 396 M355 322 L374 396"
        stroke="#57534e"
        strokeWidth="3.5"
        strokeLinecap="round"
      />
    </g>

    {/* Celebrating / Stretching Engineer Character */}
    <g className="character-rig">
      {/* Shoes */}
      <ellipse
        cx="102"
        cy="390"
        rx="30"
        ry="10"
        fill="#f4eee2"
        stroke="#1e1e1e"
        strokeWidth="3.5"
      />
      <ellipse
        cx="160"
        cy="384"
        rx="28"
        ry="9.5"
        fill="#f4eee2"
        stroke="#1e1e1e"
        strokeWidth="3.5"
      />

      {/* Cream Trousers */}
      <path
        d="M56 292 L65 388 H120 L126 334 L135 380 H176 L156 292 Z"
        fill="#f4eee2"
        stroke="#1e1e1e"
        strokeWidth="3.8"
        strokeLinejoin="round"
      />
      <path
        d="M122 310 L126 376"
        stroke="#1e1e1e"
        strokeWidth="3.2"
        strokeLinecap="round"
      />

      {/* Animated Torso & Arms */}
      <g className="char-torso-sway">
        {/* Yellow Sweater (#f0b420) */}
        <path
          d="M58 290 C44 248 48 188 58 144 C62 125 82 128 84 146 C80 178 82 204 93 214 C108 210 128 210 142 214 C150 196 145 164 130 138 C118 120 138 106 152 124 C176 154 185 214 166 264 L158 294 Z"
          fill="#f0b420"
          stroke="#1e1e1e"
          strokeWidth="3.8"
          strokeLinejoin="round"
        />

        {/* Left Raised Hand holding a PCB / Microchip */}
        <g className="char-hand-left">
          <g transform="translate(50, 92)">
            {/* Small Hardware PCB in hand */}
            <rect
              x="-8"
              y="-18"
              width="34"
              height="24"
              rx="3"
              fill="#262320"
              stroke="#f4eee2"
              strokeWidth="2.5"
            />
            <path
              d="M-1 -8 H14 M-1 -1 H10"
              stroke="#f0b420"
              strokeWidth="2.2"
              strokeLinecap="round"
            />
            <circle className="led-dot d-b" cx="19" cy="-10" r="2.8" fill="#f36c5a" />
            {/* Fist */}
            <rect
              x="4"
              y="4"
              width="30"
              height="28"
              rx="10"
              fill="#f4eee2"
              stroke="#1e1e1e"
              strokeWidth="3.5"
            />
            <path
              d="M12 4 V15 M20 4 V15 M27 4 V15"
              stroke="#1e1e1e"
              strokeWidth="2.8"
              strokeLinecap="round"
            />
          </g>
        </g>

        {/* Right Raised Hand holding a Network Patch Cable */}
        <g className="char-hand-right">
          <g transform="translate(104, 76) rotate(-16)">
            {/* Ethernet RJ45 connector & tail */}
            <path
              d="M28 10 C48 2 58 24 44 42"
              stroke="#b0a5fa"
              strokeWidth="3.5"
              strokeLinecap="round"
              fill="none"
            />
            <rect
              x="4"
              y="4"
              width="30"
              height="28"
              rx="10"
              fill="#f4eee2"
              stroke="#1e1e1e"
              strokeWidth="3.5"
            />
            <path
              d="M12 4 V15 M20 4 V15 M27 4 V15"
              stroke="#1e1e1e"
              strokeWidth="2.8"
              strokeLinecap="round"
            />
          </g>
        </g>

        {/* Head */}
        <g className="char-head-bob">
          <circle
            cx="120"
            cy="206"
            r="26"
            fill="#f4eee2"
            stroke="#1e1e1e"
            strokeWidth="3.8"
          />
          {/* Hair cap */}
          <path
            d="M96 200 C98 178 142 178 145 200 C130 196 108 196 96 200 Z"
            fill="#1e1e1e"
          />
          {/* Happy eyes & smile */}
          <path
            d="M111 206 Q115 201 120 206"
            stroke="#1e1e1e"
            strokeWidth="2.8"
            strokeLinecap="round"
          />
          <path
            d="M126 206 Q130 201 135 206"
            stroke="#1e1e1e"
            strokeWidth="2.8"
            strokeLinecap="round"
          />
          <path
            d="M118 216 Q125 222 132 215"
            stroke="#1e1e1e"
            strokeWidth="2.8"
            strokeLinecap="round"
          />
        </g>
      </g>
    </g>
  </svg>
);
