import Phone from './Phone.jsx';

// Abstract "connected systems" illustration: a code core, orbiting nodes, floating
// analytics / code / AI cards and a phone. SVG + CSS animation (off for reduced motion).
const C = 260;
const polar = (r, deg) => [C + r * Math.cos((deg * Math.PI) / 180), C + r * Math.sin((deg * Math.PI) / 180)];

function Orbit({ r, angles, className }) {
  return (
    <g className={`hv-orbit ${className}`}>
      <circle cx={C} cy={C} r={r} className="hv-ring" />
      {angles.map((a) => {
        const [x, y] = polar(r, a);
        return (
          <g key={a}>
            <line x1={C} y1={C} x2={x} y2={y} className="hv-flow" />
            <circle cx={x} cy={y} r="9" className="hv-node-halo" />
            <circle cx={x} cy={y} r="4.5" className="hv-node" />
          </g>
        );
      })}
    </g>
  );
}

export default function HeroVisual() {
  return (
    <div className="hero__visual rise" style={{ '--i': 2 }}>
      <svg viewBox="0 0 520 520" role="img" aria-label="Abstract illustration of connected software, AI and mobile systems around a code core">
        <defs>
          <linearGradient id="hv-grad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" style={{ stopColor: 'var(--accent)' }} />
            <stop offset="1" style={{ stopColor: 'var(--primary)' }} />
          </linearGradient>
          <radialGradient id="hv-glow">
            <stop offset="0" style={{ stopColor: 'var(--primary)', stopOpacity: 0.35 }} />
            <stop offset="0.55" style={{ stopColor: 'var(--primary)', stopOpacity: 0.1 }} />
            <stop offset="1" style={{ stopColor: 'var(--bg)', stopOpacity: 0 }} />
          </radialGradient>
        </defs>

        <circle cx={C} cy={C} r="250" fill="url(#hv-glow)" />
        <Orbit r={205} angles={[20, 140, 260]} className="hv-orbit--slow" />
        <Orbit r={148} angles={[80, 200, 320]} className="hv-orbit--rev" />
        <circle cx={C} cy={C} r="96" className="hv-ring hv-ring--grad" />

        <g className="hv-core">
          <path
            d="M313.7 291 260 322 206.3 291V229L260 198l53.7 31Z"
            className="hv-core-fill"
            stroke="url(#hv-grad)"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />
          <path
            d="m244 244-16 16 16 16M276 244l16 16-16 16M266 238l-12 44"
            fill="none"
            stroke="url(#hv-grad)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>

        {/* Floating cards: analytics, code and AI */}
        <g className="hv-card hv-card--a">
          <rect x="22" y="58" width="150" height="74" rx="14" className="hv-panel" />
          <rect x="40" y="70" width="60" height="5" rx="2.5" className="hv-m" opacity="0.5" />
          <rect x="40" y="108" width="12" height="12" rx="2" className="hv-a" opacity="0.5" />
          <rect x="58" y="96" width="12" height="24" rx="2" className="hv-a" opacity="0.7" />
          <rect x="76" y="84" width="12" height="36" rx="2" className="hv-a" />
          <rect x="94" y="90" width="12" height="30" rx="2" className="hv-p" opacity="0.8" />
          <rect x="112" y="80" width="12" height="40" rx="2" className="hv-p" />
        </g>
        <g className="hv-card hv-card--b">
          <rect x="22" y="398" width="150" height="74" rx="14" className="hv-panel" />
          <rect x="40" y="414" width="44" height="6" rx="3" className="hv-p" />
          <rect x="90" y="414" width="62" height="6" rx="3" className="hv-m" opacity="0.45" />
          <rect x="52" y="431" width="80" height="6" rx="3" className="hv-a" opacity="0.8" />
          <rect x="52" y="448" width="56" height="6" rx="3" className="hv-m" opacity="0.45" />
        </g>
        <g className="hv-card hv-card--c">
          <rect x="384" y="54" width="112" height="46" rx="23" className="hv-panel" />
          <path d="M412 64l3.2 9.8 9.8 3.2-9.8 3.2-3.2 9.8-3.2-9.8-9.8-3.2 9.8-3.2Z" fill="url(#hv-grad)" />
          <rect x="434" y="70" width="44" height="5" rx="2.5" className="hv-t" opacity="0.7" />
          <rect x="434" y="80" width="30" height="5" rx="2.5" className="hv-m" opacity="0.5" />
        </g>
      </svg>
      <Phone variant="ios" className="hero__phone" />
    </div>
  );
}
