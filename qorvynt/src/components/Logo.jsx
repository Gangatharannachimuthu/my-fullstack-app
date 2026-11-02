export function LogoMark({ size = 34 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true" focusable="false">
      <defs>
        <linearGradient id="logo-grad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" style={{ stopColor: 'var(--accent)' }} />
          <stop offset="1" style={{ stopColor: 'var(--primary)' }} />
        </linearGradient>
      </defs>
      <path
        d="M20 3.5 34.3 11.8v16.4L20 36.5 5.7 28.2V11.8Z"
        fill="none"
        stroke="url(#logo-grad)"
        strokeWidth="2.6"
        strokeLinejoin="round"
      />
      <circle cx="20" cy="20" r="6.6" fill="none" style={{ stroke: 'var(--text)' }} strokeWidth="2.6" />
      <path d="m23.8 23.8 5.2 5.2" style={{ stroke: 'var(--accent)' }} strokeWidth="2.8" strokeLinecap="round" />
    </svg>
  );
}

export default function Logo() {
  return (
    <span className="logo">
      <LogoMark />
      <span className="logo__text">
        <span className="logo__name">QORVYNT</span>
        <span className="logo__sub">Technologies &amp; Solutions</span>
      </span>
    </span>
  );
}
