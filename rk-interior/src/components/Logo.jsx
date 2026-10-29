// RK Interior logo, redrawn from the brochure: roof outline, orange R, dark K, "Interior".
// `light` is for dark backgrounds.
export default function Logo({ light = false, slogan = false }) {
  const dark = light ? '#ffffff' : '#262626';
  return (
    <span className="logo">
      <svg viewBox="0 0 200 74" width="150" height="56" aria-hidden="true">
        <path
          d="M8 34 46 6l38 28M38 12V4h8M60 22 92 2l40 30"
          fill="none"
          stroke={light ? '#bdbdbd' : '#555'}
          strokeWidth="4"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <text x="6" y="70" fontFamily="Poppins, sans-serif" fontSize="40" fontWeight="500" fill="#f47920">
          R
        </text>
        <text x="36" y="70" fontFamily="Poppins, sans-serif" fontSize="40" fontWeight="500" fill={dark}>
          K
        </text>
        <text x="72" y="68" fontFamily="Poppins, sans-serif" fontSize="25" fill={light ? '#e0e0e0' : '#444'}>
          Interior
        </text>
      </svg>
      {slogan && <span className="logo__slogan">We Design Your Dream Space</span>}
      <span className="sr-only">RK Interior</span>
    </span>
  );
}
