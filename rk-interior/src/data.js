// All business content lives here. Update this file to change the website text,
// phone numbers or photos - no other file needs editing for content changes.
// Content is taken from the client's RK Interior brochure.
// Gallery photos are in content/gallery.json, which the owner edits from /admin (Decap CMS).
import gallery from './content/gallery.json';

export const BUSINESS = {
  name: 'RK Interior',
  slogan: 'We Design Your Dream Space',
  owner: { name: 'R Ranjith Babu', role: 'Managing Director' },
  phones: [{ display: '97253 55524', tel: '+919725355524' }],
  // WhatsApp number: country code, no +.
  whatsapp: '919725355524',
  email: 'rkinterior79@gmail.com',
  // TODO: full shop / office address (door no, street) from the owner.
  addressLines: ['Kavinthapadi,', 'Erode District,', 'Tamil Nadu'],
  area: 'Kavinthapadi · Erode District',
  // Google Maps spells the town "Kavindapadi".
  mapQuery: 'Kavindapadi, Erode, Tamil Nadu',
};

// Instagram handle (without @).
export const INSTAGRAM = {
  handle: 'rk_interior79',
  get url() {
    return `https://www.instagram.com/${this.handle}/`;
  },
};

// Ratings are collected on Google. TODO: once the Google Business Profile is live, set
// reviewUrl to its "Ask for reviews" link (https://g.page/r/.../review), and fill in
// rating / count from the profile. Until then the button opens a Google Maps search.
export const GOOGLE = {
  reviewUrl: '',
  rating: null, // e.g. 4.9
  count: null, // e.g. 27
};
export const googleReviewLink =
  GOOGLE.reviewUrl ||
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent('RK Interior Kavindapadi Erode')}`;

// Real client reviews only (copy them from Google). Example:
// { name: 'Client name', place: 'Erode', stars: 5, text: 'What they said.' },
export const REVIEWS = [];

export const whatsappLink = (text = '') =>
  `https://wa.me/${BUSINESS.whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ''}`;

export const mapEmbedUrl = `https://www.google.com/maps?q=${encodeURIComponent(BUSINESS.mapQuery)}&output=embed`;
export const mapLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(BUSINESS.mapQuery)}`;

export const ABOUT =
  'At RK Interiors, we create beautiful and functional spaces that reflect your style. ' +
  'We offer complete interior solutions for homes and commercial spaces, with a focus on ' +
  'quality, design, and timely execution.';

const img = (file, alt) => ({ src: `/images/${file}`, alt });

export const PHOTOS = {
  livingRoomTv: img('living-room-tv.jpg', 'Living room with navy fluted TV wall, wooden shelves and ceiling lights'),
  lounge: img('lounge.jpg', 'RK Interior lounge with wooden slat wall, gold accent and lounge chairs'),
  kitchen: img('kitchen.jpg', 'White modular kitchen with island and pendant lights'),
  office: img('office.jpg', 'Minimal office room with wooden desk'),
  livingRoom: img('living-room.jpg', 'Living room with wooden TV wall and sofa'),
  lobby: img('lobby.jpg', 'Bright lobby with glass walls and lounge seating'),
};

export const GALLERY = gallery.photos
  .filter((p) => p.image)
  .map((p) => ({ src: p.image, alt: p.caption || 'RK Interior work' }));

// `icon` matches a key in ServiceIcon (components/Icons.jsx).
export const SERVICES = [
  { icon: 'home', title: 'Residential & Commercial Interiors' },
  { icon: 'kitchen', title: 'Modular Kitchens & Wardrobes' },
  { icon: 'tv', title: 'TV Units & Wall Paneling' },
  { icon: 'ceiling', title: 'False Ceilings (Gypsum/Wood)' },
  { icon: 'sofa', title: 'Custom Furniture & Storage Solutions' },
  { icon: 'door', title: 'Aluminium Doors & Glass Partitions' },
  { icon: 'roller', title: 'Painting & Designer Wallpapers' },
  { icon: 'clipboard', title: 'End-to-End Project Execution' },
  { icon: 'plan', title: '2D, 3D Design & Building Plan' },
];

export const SPACES = [
  {
    icon: 'pot',
    title: 'Kitchen Room',
    text: 'An efficient, stylish space for cooking, dining, and gathering.',
    photo: PHOTOS.kitchen,
  },
  {
    icon: 'desk',
    title: 'Office Room',
    text: 'A functional workspace designed for productivity.',
    photo: PHOTOS.office,
  },
  {
    icon: 'sofa',
    title: 'Living Room',
    text: 'A social, multifunctional area for relaxing and entertaining.',
    photo: PHOTOS.livingRoom,
  },
  {
    icon: 'door',
    title: 'Lobby',
    text: 'A welcoming, stylish entrance that sets the tone for your space.',
    photo: PHOTOS.lobby,
  },
];

export const PROCESS = [
  { title: 'Site visit', text: 'We visit your site, take measurements and understand your needs and budget.' },
  { title: '2D & 3D design', text: 'You see the layout and 3D design before any work starts.' },
  { title: 'Execution', text: 'Our team makes and installs everything with the materials you approve.' },
  { title: 'Handover', text: 'We check every detail with you and hand over on time.' },
];
