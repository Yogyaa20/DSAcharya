import React from "react";

export default function BackgroundPaths({ className = "" }) {
  return (
    <svg
      className={className}
      viewBox="0 0 1200 800"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="fadeY" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="white" stopOpacity="0.1" />
          <stop offset="0.5" stopColor="white" stopOpacity="0.03" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="fadeX" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="white" stopOpacity="0" />
          <stop offset="0.5" stopColor="white" stopOpacity="0.04" />
          <stop offset="1" stopColor="white" stopOpacity="0" />
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="1200" height="800" fill="transparent" />

      {/* Subtle diagonal flow lines */}
      <g opacity="0.6">
        {Array.from({ length: 16 }).map((_, i) => {
          const y = 40 + i * 48;
          return (
            <path
              key={`d-${i}`}
              d={`M -100 ${y} C 250 ${y - 40}, 520 ${y + 40}, 1300 ${y - 10}`}
              stroke="url(#fadeX)"
              strokeWidth="1"
            />
          );
        })}
      </g>

      {/* Vertical ghost grid */}
      <g opacity="0.5" stroke="url(#fadeY)" strokeWidth="1">
        {Array.from({ length: 22 }).map((_, i) => {
          const x = i * (1200 / 21);
          return <path key={`v-${i}`} d={`M ${x} 0 L ${x} 800`} />;
        })}
      </g>

      {/* Horizontal ghost grid */}
      <g opacity="0.25" stroke="url(#fadeX)" strokeWidth="1">
        {Array.from({ length: 14 }).map((_, i) => {
          const y = i * (800 / 13);
          return <path key={`h-${i}`} d={`M 0 ${y} L 1200 ${y}`} />;
        })}
      </g>
    </svg>
  );
}

