const base = { width: 20, height: 20, viewBox: '0 0 24 24', 'aria-hidden': true };
const stroke = { ...base, fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' };

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

export const CheckIcon = (p) => (
  <svg {...stroke} {...p}>
    <path d="m5 12 5 5L20 7" />
  </svg>
);

// Simple line icons for the five service categories.
export const CategoryIcon = ({ id, ...p }) => {
  const paths = {
    aluminium: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="1" />
        <path d="M12 3v18M3 12h18" />
      </>
    ),
    upvc: (
      <>
        <rect x="4" y="3" width="16" height="18" rx="1" />
        <path d="M12 3v18M8 11v2M16 11v2" />
      </>
    ),
    pvc: (
      <>
        <rect x="6" y="2" width="12" height="20" rx="1" />
        <path d="M15 12h.01M9 6h6M9 9h6" />
      </>
    ),
    curtains: (
      <>
        <path d="M2 3h20" />
        <path d="M5 3c0 6 2 12 4 18H4c0-6 0-12 1-18zM19 3c0 6-2 12-4 18h5c0-6 0-12-1-18z" />
      </>
    ),
    fluted: (
      <>
        <rect x="3" y="3" width="18" height="18" rx="1" />
        <path d="M7.5 3v18M12 3v18M16.5 3v18" />
      </>
    ),
  };
  return <svg {...stroke} {...p}>{paths[id]}</svg>;
};
