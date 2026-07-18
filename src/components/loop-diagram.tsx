/**
 * The habit loop, and where this app breaks it.
 *
 * Drawn entirely as inline SVG. A raster illustration would add weight to the repository
 * and a network request to the first paint; this costs neither, scales perfectly, and
 * adapts to the active theme because it inherits CSS custom properties.
 *
 * Marked aria-hidden and paired with a text description in the surrounding markup — the
 * diagram is a restatement of the prose, not a replacement for it.
 */

export function LoopDiagram() {
  return (
    <svg
      viewBox="0 0 400 400"
      className="h-full w-full"
      aria-hidden="true"
      focusable="false"
      role="presentation"
    >
      <defs>
        <radialGradient id="cb-core" cx="50%" cy="50%">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.35" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="cb-arc" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.85" />
          <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.15" />
        </linearGradient>
      </defs>

      {/* Ambient core glow */}
      <circle cx="200" cy="200" r="150" fill="url(#cb-core)" />

      {/* Concentric field rings */}
      <circle cx="200" cy="200" r="148" fill="none" stroke="var(--hairline)" strokeWidth="1" />
      <circle cx="200" cy="200" r="112" fill="none" stroke="var(--hairline)" strokeWidth="1" />

      {/* The loop itself: cue to routine to reward, running automatically */}
      <circle
        cx="200"
        cy="200"
        r="130"
        fill="none"
        stroke="url(#cb-arc)"
        strokeWidth="2"
        strokeDasharray="6 10"
        strokeLinecap="round"
        className="origin-center [animation:spin_44s_linear_infinite]"
      />

      {/* The three stations of the loop */}
      {[
        { angle: -90, label: "CUE" },
        { angle: 30, label: "ROUTINE" },
        { angle: 150, label: "REWARD" },
      ].map((node) => {
        const radians = (node.angle * Math.PI) / 180;
        const x = 200 + 130 * Math.cos(radians);
        const y = 200 + 130 * Math.sin(radians);
        return (
          <g key={node.label}>
            <circle cx={x} cy={y} r="26" fill="var(--surface-raised)" stroke="var(--hairline)" />
            <circle cx={x} cy={y} r="4" fill="var(--accent)" />
            <text
              x={x}
              y={y + 44}
              textAnchor="middle"
              fill="var(--text-muted)"
              fontSize="9.5"
              fontWeight="600"
              letterSpacing="1.6"
            >
              {node.label}
            </text>
          </g>
        );
      })}

      {/* The interruption: the breaker sits in the loop between cue and routine */}
      <g transform="translate(200 200)">
        <circle r="58" fill="var(--surface-raised)" stroke="var(--hairline)" strokeWidth="1" />
        <circle
          r="58"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="1"
          opacity="0.5"
          className="pulse-ring origin-center"
        />
        <path
          d="M6 -26 -14 4h12l-4 22 20-30h-12z"
          fill="var(--accent)"
          className="origin-center"
        />
      </g>
    </svg>
  );
}
