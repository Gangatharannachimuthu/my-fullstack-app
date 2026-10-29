const base = { width: 20, height: 20, viewBox: '0 0 24 24', 'aria-hidden': true };
const stroke = { ...base, fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' };

export const PhoneIcon = (p) => (
  <svg {...stroke} {...p}>
    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" />
  </svg>
);

export const WhatsAppIcon = (p) => (
  <svg {...base} fill="currentColor" {...p}>
    <path d="M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2a8.2 8.2 0 0 1-4.2-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.2-.4.2-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5a1 1 0 0 0-.7.3 3 3 0 0 0-.9 2.2 5.2 5.2 0 0 0 1.1 2.7 11.9 11.9 0 0 0 4.6 4c1.7.7 2.4.8 3.2.7.5-.1 1.5-.6 1.8-1.2.2-.6.2-1.1.1-1.2l-.5-.3z" />
  </svg>
);

export const MailIcon = (p) => (
  <svg {...stroke} {...p}>
    <rect x="3" y="5" width="18" height="14" rx="1.5" />
    <path d="m3 6 9 7 9-7" />
  </svg>
);

export const InstagramIcon = (p) => (
  <svg {...stroke} {...p}>
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <path d="M17.5 6.5h.01" />
  </svg>
);

export const StarIcon = ({ filled = true, ...p }) => (
  <svg {...base} {...p}>
    <path
      d="m12 2.8 2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3-4.6-4.4 6.3-.9z"
      fill={filled ? 'currentColor' : 'none'}
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </svg>
);

export const UserIcon = (p) => (
  <svg {...stroke} {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 21a8 8 0 0 1 16 0" />
  </svg>
);

export const PinIcon = (p) => (
  <svg {...stroke} {...p}>
    <path d="M12 22s7-6.1 7-12a7 7 0 1 0-14 0c0 5.9 7 12 7 12z" />
    <circle cx="12" cy="10" r="2.5" />
  </svg>
);

export const MenuIcon = (p) => (
  <svg {...stroke} {...p}>
    <path d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

export const CloseIcon = (p) => (
  <svg {...stroke} {...p}>
    <path d="M18 6 6 18M6 6l12 12" />
  </svg>
);

export const ArrowIcon = ({ dir = 'right', ...p }) => (
  <svg {...stroke} {...p} style={{ transform: dir === 'left' ? 'scaleX(-1)' : undefined }}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

// Line icons for services and spaces, as in the brochure.
export const ServiceIcon = ({ id, ...p }) => {
  const paths = {
    home: (
      <>
        <path d="M3 11 12 3l9 8" />
        <path d="M5 9.5V21h14V9.5M10 21v-6h4v6" />
      </>
    ),
    kitchen: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="1" />
        <path d="M3 10h18M12 3v18M7 6.5h1M16 6.5h1M7 14h1M16 14h1" />
      </>
    ),
    tv: (
      <>
        <rect x="3" y="4" width="18" height="12" rx="1" />
        <path d="M8 20h8M12 16v4" />
      </>
    ),
    ceiling: (
      <>
        <path d="M2 4h20M5 4v4h14V4" />
        <path d="M8 8v3M12 8v5M16 8v3" />
        <path d="M10 13h4l-1 3h-2z" />
      </>
    ),
    sofa: (
      <>
        <path d="M5 10V8a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v2" />
        <path d="M3 12a2 2 0 0 1 4 0v2h10v-2a2 2 0 0 1 4 0v5H3z" />
        <path d="M5 17v2M19 17v2" />
      </>
    ),
    door: (
      <>
        <rect x="5" y="2" width="14" height="20" rx="1" />
        <path d="M9 2v20M15.5 12h.01" />
      </>
    ),
    roller: (
      <>
        <rect x="3" y="3" width="15" height="6" rx="1" />
        <path d="M18 6h3v6h-9v3M10 15h4v6h-4z" />
      </>
    ),
    clipboard: (
      <>
        <rect x="5" y="4" width="14" height="18" rx="1" />
        <path d="M9 2h6v4H9zM9 11h6M9 15h6M9 19h3" />
      </>
    ),
    plan: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="1" />
        <path d="M3 10h7v11M10 14h11M15 3v7" />
      </>
    ),
    pot: (
      <>
        <path d="M4 10h16v6a4 4 0 0 1-4 4H8a4 4 0 0 1-4-4z" />
        <path d="M2 10h20M10 6h4M12 6V4" />
      </>
    ),
    desk: (
      <>
        <path d="M2 11h20M4 11v10M20 11v10M14 11v6h6" />
        <rect x="7" y="3" width="7" height="5" rx="0.5" />
        <path d="M10.5 8v3" />
      </>
    ),
  };
  return <svg {...stroke} {...p}>{paths[id]}</svg>;
};
