import React from 'react';

/**
 * SVG Filter that creates the authentic organic ink-bleed / boiled-line look
 * on Stellost display headings AND hand-drawn illustrations (exactly like jager.ar's #ink-bleed + frame boil)
 */
export const InkBleedFilters: React.FC = () => (
  <svg
    width="0"
    height="0"
    style={{ position: 'absolute' }}
    aria-hidden="true"
  >
    <defs>
      {/* Static organic ink-bleed for display typography */}
      <filter id="ink-bleed">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.035"
          numOctaves="3"
          result="n"
        />
        <feDisplacementMap
          in="SourceGraphic"
          in2="n"
          scale="1.7"
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>

      {/* Frame-by-frame animated hand-drawn boil filter (like a 2-frame hand-drawn GIF!) */}
      <filter id="boil-1">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.04"
          numOctaves="3"
          seed="2"
          result="n1"
        />
        <feDisplacementMap
          in="SourceGraphic"
          in2="n1"
          scale="2.1"
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>
      <filter id="boil-2">
        <feTurbulence
          type="fractalNoise"
          baseFrequency="0.04"
          numOctaves="3"
          seed="9"
          result="n2"
        />
        <feDisplacementMap
          in="SourceGraphic"
          in2="n2"
          scale="2.1"
          xChannelSelector="R"
          yChannelSelector="G"
        />
      </filter>
    </defs>
  </svg>
);
