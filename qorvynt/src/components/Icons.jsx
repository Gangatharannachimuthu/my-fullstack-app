// Minimal line icons (24×24, drawn with currentColor). Add new ones to PATHS by name.
const PATHS = {
  users: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5M15.5 4.8a3.5 3.5 0 0 1 0 6.4M18 14.8c2 .7 3.2 2.4 3.5 5.2" />
    </>
  ),
  shield: (
    <>
      <path d="M12 3 4.5 6v5.5c0 4.6 3.1 8.2 7.5 9.5 4.4-1.3 7.5-4.9 7.5-9.5V6L12 3Z" />
      <path d="m8.8 12 2.2 2.2 4.4-4.4" />
    </>
  ),
  chat: (
    <>
      <path d="M4 5.5h16v10.5H9.5L5 20v-4H4z" />
      <path d="M8 9.5h8M8 12.5h5" />
    </>
  ),
  layers: (
    <>
      <path d="m12 3 9 4.8-9 4.8-9-4.8L12 3Z" />
      <path d="m3 12.2 9 4.8 9-4.8M3 16.4l9 4.8 9-4.8" />
    </>
  ),
  handshake: (
    <>
      <path d="m2.5 11 3.8-4 4.2 1.5L13 7l5 4.5M21.5 11l-3.5 3.5" />
      <path d="m10.5 8.5-2.8 2.8a1.4 1.4 0 0 0 2 2l2.3-2.1 4.5 4a1.3 1.3 0 0 1-1.8 1.9l-1-.9M11.4 15.4l1.9 1.8a1.3 1.3 0 0 1-1.8 1.9l-1.7-1.5M6.3 15.5l1.4 1.3" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1" />
    </>
  ),
  eye: (
    <>
      <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  check: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m8 12.3 2.7 2.7L16 9.6" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="10.5" width="14" height="10" rx="2" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3M12 14.5v2" />
    </>
  ),
  sliders: (
    <>
      <path d="M4 6.5h9M17 6.5h3M4 12h3M11 12h9M4 17.5h11M19 17.5h1" />
      <circle cx="15" cy="6.5" r="2" />
      <circle cx="9" cy="12" r="2" />
      <circle cx="17" cy="17.5" r="2" />
    </>
  ),
  wrench: <path d="M14.5 6.5a4 4 0 0 0 5.2 5.2L12 19.4a2.1 2.1 0 0 1-3-3l7.7-7.7M14.5 6.5A4 4 0 0 1 19 3.2l-2.6 2.6.4 1.8 1.8.4 2.6-2.6a4 4 0 0 1-1.5 6.3" />,
  code: (
    <>
      <path d="m8.5 7.5-5 4.5 5 4.5M15.5 7.5l5 4.5-5 4.5M13.5 5l-3 14" />
    </>
  ),
  browser: (
    <>
      <rect x="3" y="4.5" width="18" height="15" rx="2" />
      <path d="M3 9h18M6 6.8h.01M8.5 6.8h.01M7 13h6M7 16h10" />
    </>
  ),
  mobile: (
    <>
      <rect x="6.5" y="2.5" width="11" height="19" rx="2.5" />
      <path d="M10.5 18.5h3" />
    </>
  ),
  spark: (
    <>
      <path d="M12 3.5 13.8 9 19.5 10.8 13.8 12.6 12 18.5 10.2 12.6 4.5 10.8 10.2 9Z" />
      <path d="M18.5 16v4M16.5 18h4" />
    </>
  ),
  cloud: (
    <>
      <path d="M7 18.5h10.5a4 4 0 0 0 .4-8 6 6 0 0 0-11.6 1.3A3.4 3.4 0 0 0 7 18.5Z" />
    </>
  ),
  compass: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="m15.5 8.5-2 5-5 2 2-5 5-2Z" />
    </>
  ),
  plug: (
    <>
      <path d="M9 3v4M15 3v4M6.5 7h11v3.5a5.5 5.5 0 0 1-11 0V7ZM12 16v5" />
    </>
  ),
  chart: (
    <>
      <path d="M4 3.5v16.5h16.5" />
      <path d="M8 16v-4M12 16V8M16 16v-6.5" />
    </>
  ),
  building: (
    <>
      <path d="M4.5 21V4.5h10V21M14.5 9.5h5V21M3 21h18" />
      <path d="M8 8h3M8 11.5h3M8 15h3M17 13h.01M17 16.5h.01" />
    </>
  ),
  factory: (
    <>
      <path d="M3 20.5V10l5 3V10l5 3V10l5 3V4h3v16.5H3Z" />
      <path d="M7 17h2M12 17h2" />
    </>
  ),
  cart: (
    <>
      <path d="M3 4h2.5l2.2 11h10.6l2-7.5H6.6" />
      <circle cx="9" cy="19" r="1.5" />
      <circle cx="17" cy="19" r="1.5" />
    </>
  ),
  heart: (
    <>
      <path d="M12 20s-8-4.6-8-10.4A4.4 4.4 0 0 1 12 7a4.4 4.4 0 0 1 8 2.6C20 15.4 12 20 12 20Z" />
      <path d="M7.5 12h2.5l1.2-2 1.6 4 1.2-2h2.5" />
    </>
  ),
  bank: (
    <>
      <path d="M3 9.5 12 4l9 5.5H3ZM5 9.5v8M9.7 9.5v8M14.3 9.5v8M19 9.5v8M3 20.5h18" />
    </>
  ),
  truck: (
    <>
      <path d="M2.5 6.5h11v10h-11zM13.5 10h4l3 3.5v3h-7" />
      <circle cx="6.5" cy="18" r="1.8" />
      <circle cx="17" cy="18" r="1.8" />
    </>
  ),
  book: (
    <>
      <path d="M12 6.5C10 5 7 4.5 3.5 5v13.5c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5C17 4.5 14 5 12 6.5ZM12 6.5V20" />
    </>
  ),
  store: (
    <>
      <path d="M4 9.5V20.5h16V9.5M3 9.5 4.8 4h14.4L21 9.5a3 3 0 0 1-6 0 3 3 0 0 1-6 0 3 3 0 0 1-6 0" />
      <path d="M9.5 20.5v-5h5v5" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m3.5 6.5 8.5 6.5 8.5-6.5" />
    </>
  ),
  phone: <path d="M6.6 3.5h-2a1.5 1.5 0 0 0-1.5 1.6A16.5 16.5 0 0 0 18.9 20.9a1.5 1.5 0 0 0 1.6-1.5v-2a1.5 1.5 0 0 0-1.1-1.4l-3.1-.8a1.5 1.5 0 0 0-1.5.4l-1.2 1.2a12.5 12.5 0 0 1-5.4-5.4l1.2-1.2a1.5 1.5 0 0 0 .4-1.5L8 4.6a1.5 1.5 0 0 0-1.4-1.1Z" />,
  pin: (
    <>
      <path d="M12 21s-6.5-5.7-6.5-11a6.5 6.5 0 0 1 13 0c0 5.3-6.5 11-6.5 11Z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M3.5 12h17M12 3.5c2.3 2.4 3.5 5.2 3.5 8.5s-1.2 6.1-3.5 8.5c-2.3-2.4-3.5-5.2-3.5-8.5S9.7 5.9 12 3.5Z" />
    </>
  ),
  box: (
    <>
      <path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Z" />
      <path d="m4 7.5 8 4.5 8-4.5M12 12v9" />
    </>
  ),
  bot: (
    <>
      <rect x="4.5" y="8" width="15" height="11" rx="3" />
      <path d="M12 4.5V8M9.5 13h.01M14.5 13h.01M9.5 16h5M2.5 12.5v2M21.5 12.5v2" />
      <circle cx="12" cy="4" r="1" />
    </>
  ),
  flow: (
    <>
      <rect x="3" y="4" width="6" height="5" rx="1.5" />
      <rect x="15" y="15" width="6" height="5" rx="1.5" />
      <path d="M9 6.5h4a2.5 2.5 0 0 1 2.5 2.5v6M13 12.5l2.5 2.5 2.5-2.5" />
    </>
  ),
  tablet: (
    <>
      <rect x="4.5" y="2.5" width="15" height="19" rx="2.5" />
      <path d="M10.5 18.5h3" />
    </>
  ),
  devices: (
    <>
      <rect x="2.5" y="4.5" width="9" height="15" rx="2" />
      <rect x="13.5" y="7.5" width="8" height="12" rx="2" />
      <path d="M6 16.5h2M16.5 16.5h2" />
    </>
  ),
  pen: (
    <>
      <path d="m14.5 5.5 4 4L9 19l-5 1 1-5 9.5-9.5Z" />
      <path d="m12.5 7.5 4 4" />
    </>
  ),
  server: (
    <>
      <rect x="3.5" y="4" width="17" height="7" rx="2" />
      <rect x="3.5" y="13" width="17" height="7" rx="2" />
      <path d="M7 7.5h.01M7 16.5h.01M11 7.5h6M11 16.5h6" />
    </>
  ),
  headset: (
    <>
      <path d="M4.5 14v-2a7.5 7.5 0 0 1 15 0v2" />
      <rect x="3.5" y="13" width="4" height="6" rx="1.5" />
      <rect x="16.5" y="13" width="4" height="6" rx="1.5" />
      <path d="M18.5 19c0 1.2-1.3 2-3.5 2h-2" />
    </>
  ),
  rocket: (
    <>
      <path d="M14 4.5c3-1.5 5.5-1 5.5-1s.5 2.5-1 5.5L13 14.5 9.5 11 14 4.5Z" />
      <path d="M9.5 11 6 10.5 8.5 8l4-.5M13 14.5l.5 3.5 2.5-2.5.5-4M7 15.5c-1.5.5-2.5 2-2.5 4 2 0 3.5-1 4-2.5" />
    </>
  ),
  clipboard: (
    <>
      <rect x="5" y="4.5" width="14" height="16.5" rx="2" />
      <path d="M9 4.5V3h6v1.5M8.5 10h7M8.5 13.5h7M8.5 17h4" />
    </>
  ),
  upload: <path d="M12 15.5V4M7.5 8.5 12 4l4.5 4.5M4.5 15v3.5a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2V15" />,
  whatsapp: (
    <>
      <path d="M3.8 20.2 5 16.3A8.6 8.6 0 1 1 8 19.1l-4.2 1.1Z" />
      <path d="M9.2 8.4c-.4.9-.3 2.1.6 3.5 1 1.5 2.4 2.6 3.8 3 1 .3 1.8 0 2.2-.6l.2-.6-1.8-.9-.8.8c-.9-.3-2-1.3-2.4-2.2l.7-.8-.8-1.8-.6.1c-.5.1-.9.3-1.1.5Z" />
    </>
  ),
  palette: (
    <>
      <path d="M12 3.5a8.5 8.5 0 0 0 0 17c1.2 0 1.8-.9 1.5-1.9-.4-1.2.4-2.4 1.7-2.4h1.6a3.7 3.7 0 0 0 3.7-3.7c0-5-3.8-9-8.5-9Z" />
      <circle cx="7.8" cy="11.5" r="1.2" />
      <circle cx="10.5" cy="7.6" r="1.2" />
      <circle cx="15" cy="8" r="1.2" />
    </>
  ),
  arrow: <path d="M5 12h14M13 6l6 6-6 6" />,
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
};

export default function Icon({ name, size = 24, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {PATHS[name]}
    </svg>
  );
}
