// All business content lives here. Update this file to change the website text,
// phone numbers or photos - no other file needs editing for content changes.
// Content is taken from Vallangarai_Traders_Real_Photo_Brochure.pdf.

export const BUSINESS = {
  name: 'Vallangarai Traders',
  tagline: 'Aluminium | PVC Doors | UPVC Windows | Curtains | Blinds',
  phones: [
    { display: '84895 10293', tel: '+918489510293' },
    { display: '96298 95176', tel: '+919629895176' },
  ],
  // TODO: confirm which number is on WhatsApp with the owner.
  whatsapp: '918489510293',
  addressLines: [
    'Shop No: 1, KS Complex,',
    'Vagai Bakery Opposite,',
    'Kodumudi, Vengamedu,',
    'Erode District, Tamil Nadu',
  ],
  mapQuery: 'KS Complex, Vagai Bakery, Kodumudi, Erode, Tamil Nadu',
};

export const whatsappLink = (text = '') =>
  `https://wa.me/${BUSINESS.whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ''}`;

export const mapEmbedUrl = `https://www.google.com/maps?q=${encodeURIComponent(BUSINESS.mapQuery)}&output=embed`;
export const mapLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(BUSINESS.mapQuery)}`;

const img = (file, alt) => ({ src: `/images/${file}`, alt });

export const PHOTOS = {
  aluminiumPartition: img('aluminium-partition.jpg', 'Black aluminium partition with glass and white panels in an office'),
  aluminiumGlassPanel: img('aluminium-glass-panel.jpg', 'Aluminium partition with tinted glass top and panel bottom'),
  aluminiumWindow: img('aluminium-window.jpg', 'Aluminium sliding window with patterned glass'),
  upvcWindow: img('upvc-window.jpg', 'White UPVC openable window'),
  upvcCupboard: img('upvc-cupboard.jpg', 'Sliding UPVC wardrobe in sage green with line pattern'),
  blackoutCurtains: img('blackout-curtains.jpg', 'Brown blackout curtains layered with white sheer curtains'),
  sheerCurtains: img('sheer-curtains.jpg', 'White pleated sheer curtains on a ceiling track'),
  flutedInterior: img('fluted-interior.jpg', 'TV feature wall with wood-tone fluted panels and marble finish'),
  flutedExterior: img('fluted-exterior.jpg', 'Exterior fluted panels in wood, white and grey shades'),
};

export const CATEGORIES = [
  {
    id: 'aluminium',
    title: 'Aluminium Works',
    short: 'Partitions, windows and fixed elevation glass for homes, offices and shops.',
    photos: [PHOTOS.aluminiumPartition, PHOTOS.aluminiumGlassPanel, PHOTOS.aluminiumWindow],
    items: [
      {
        name: 'Aluminium Partition Works',
        text: 'Aluminium framed partitions for homes, offices and shops. Available with powder-coated or non-powder-coated finish, with glass/panel combinations.',
      },
      {
        name: 'Aluminium Partition – Glass & Panel',
        text: 'Custom partition layouts with clear, tinted or decorative glass and panel sections. Suitable for room division and commercial interiors.',
      },
      {
        name: 'Aluminium Windows',
        text: 'Aluminium window systems including sliding and openable styles, with different glass choices for ventilation, daylight and privacy.',
      },
      {
        name: 'Fixed Elevation Glasses',
        text: 'Fixed glass elevation solutions for modern fronts and shop façades. Large glazed areas create a clean, bright appearance.',
      },
    ],
  },
  {
    id: 'upvc',
    title: 'UPVC Works',
    short: 'Open and sliding windows, doors and fixed partitions made to your opening size.',
    photos: [PHOTOS.upvcWindow],
    items: [
      {
        name: 'UPVC Open Windows',
        text: 'Openable UPVC windows for bedrooms, halls and utility areas. Designed for ventilation, daylight and easy operation.',
      },
      {
        name: 'UPVC Sliding Windows',
        text: 'Sliding UPVC window systems with smooth operation and space-saving opening. Different glass and profile options can be selected.',
      },
      {
        name: 'UPVC Doors',
        text: 'UPVC doors for residential and utility applications, with glass or panel inserts. Made to measured opening sizes with selected profile, hardware and finish. Smooth surfaces make cleaning simple.',
      },
      {
        name: 'UPVC Fixed Partition',
        text: 'UPVC framed fixed partitions for rooms, offices and commercial spaces. Glass panels divide areas while keeping natural light. Profile colour, glass type and panel arrangement can be selected.',
      },
    ],
  },
  {
    id: 'pvc',
    title: 'PVC Doors & Cupboards',
    short: 'Sarvesh UPVC cupboards, Cheran and Lotus PVC doors for every room.',
    photos: [PHOTOS.upvcCupboard],
    items: [
      {
        name: 'Sarvesh UPVC Cupboards',
        text: 'Cupboard solutions for bedrooms, kitchens, utility areas and storage. Available in Heavy (high-use, larger cupboards), Medium (regular household storage) and Light (budget-focused) options.',
      },
      {
        name: 'Cheran PVC Doors',
        text: 'A moisture-friendly choice for bathrooms, utility areas and other indoor spaces. Easy to wipe clean, with colour, pattern, size and hardware to choose from.',
      },
      {
        name: 'Lotus PVC Doors',
        text: 'Decorative PVC doors in multiple patterns and colour styles, for bathrooms, utility rooms and indoor use. Measured, fabricated and fitted to your opening.',
      },
    ],
  },
  {
    id: 'curtains',
    title: 'Curtains & Hardware',
    short: 'Blackout and sheer curtains, jumbo tracks and SS curtain pipes.',
    photos: [PHOTOS.blackoutCurtains, PHOTOS.sheerCurtains],
    items: [
      {
        name: 'Blackout Curtains',
        text: 'Strong light control and privacy for bedrooms, TV rooms and media spaces. Can be paired with sheer curtains for layered styling.',
      },
      {
        name: 'Sheer Curtains',
        text: 'Light-filtering curtains that soften daylight while keeping the room bright and airy. Ideal for living rooms and layered setups.',
      },
      {
        name: 'Jumbo Track',
        text: 'Heavy-duty track for wider windows and heavier fabrics, with smooth opening and closing. Suits large windows, sliding doors and full-height curtains.',
      },
      {
        name: 'SS Pipes',
        text: 'Strong, clean-looking stainless steel curtain pipes, supplied with brackets and end accessories for doors and windows.',
      },
    ],
  },
  {
    id: 'fluted',
    title: 'Fluted Panels',
    short: 'Interior feature walls and exterior cladding in wood, neutral and dark tones.',
    photos: [PHOTOS.flutedInterior, PHOTOS.flutedExterior],
    items: [
      {
        name: 'Interior Fluted Panels',
        text: 'Decorative fluted-panel styling for TV units, feature walls, bedrooms, pooja areas, reception spaces and modern interiors.',
      },
      {
        name: 'Exterior Fluted Panels',
        text: 'Fluted exterior cladding for entrances, balconies, porch areas and feature façades. Material grade is matched to the installation environment.',
      },
      {
        name: 'Colour & Layout',
        text: 'Choose from wood tones, neutral shades and darker contemporary finishes. Panel layout, trims, backing and finishing are planned for your site.',
      },
    ],
  },
];

export const STRENGTHS = [
  { title: 'Measured at your site', text: 'Every job is made to the measured opening size, not a stock size.' },
  { title: 'Choose your finish', text: 'Profile colour, glass type, panel, pattern and hardware are your choice.' },
  { title: 'Fabricated & fitted', text: 'Measured, fabricated and fitted to the required opening.' },
  { title: 'Confirmed before we make it', text: 'Model, colour, profile, glass, hardware and size are agreed with you before fabrication.' },
];
