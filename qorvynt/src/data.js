// All website content lives here. Update this file to change text, services or contact
// details - no other file needs editing for content changes.
// Do not add client names, statistics, awards, certifications or store listings that are not real.

export const COMPANY = {
  name: 'QORVYNT Technologies & Solutions',
  short: 'QORVYNT',
  tagline: 'Engineering Tomorrow, Today.',
  description:
    'A software development and IT services company building web, mobile, AI and enterprise solutions for businesses worldwide.',
};

// Empty values show a "to be added" placeholder on the site and are left out of links.
export const CONTACT = {
  email: 'gangatharannachimuthu97@gmail.com',
  phone: { display: '+91 90802 05834', tel: '+919080205834' }, // tel: with country code
  // WhatsApp number: country code, no +. The inquiry form opens a chat to this number.
  whatsapp: '919080205834',
  address: 'Bhavani, Erode, Tamil Nadu',
};

export const whatsappLink = (text = '') =>
  `https://wa.me/${CONTACT.whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ''}`;

// Optional: a form service or backend URL. When empty (the default) the inquiry form opens
// WhatsApp with the details filled in. When set, the form POSTs JSON
// { name, email, company, projectType, platform, budget, details } and treats any 2xx response
// as delivered (Formspree, Getform, or your own API endpoint).
export const FORM_ENDPOINT = '';

export const PAGES = {
  home: {
    title: 'QORVYNT Technologies & Solutions | Software, Mobile App & AI Development',
    description:
      'QORVYNT builds custom software, websites, Android and iOS apps, AI solutions and enterprise systems that help businesses grow.',
  },
  about: {
    title: 'About QORVYNT | Your Technology Partner',
    description:
      'QORVYNT partners with businesses to understand their challenges, build tailored technology solutions and support long-term digital growth.',
  },
  services: {
    title: 'Software Development, AI & IT Services | QORVYNT',
    description:
      'Custom software, website and web app development, SaaS and enterprise applications, API integration, AI chatbots, workflow automation, cloud and IT consulting.',
  },
  mobile: {
    title: 'Android & iOS App Development | QORVYNT',
    description:
      'Native Android (Kotlin) and iOS (Swift) apps, Flutter and React Native cross-platform development, mobile UI/UX design, app backends and maintenance.',
  },
  industries: {
    title: 'Industries We Serve | QORVYNT Technologies & Solutions',
    description:
      'Software and mobile solutions for manufacturing, retail and e-commerce, healthcare, financial services, logistics, education, startups and enterprises.',
  },
  process: {
    title: 'Our Development Process | QORVYNT',
    description:
      'How QORVYNT delivers software and mobile apps: discover, plan, design, develop and test, deploy and maintain.',
  },
  work: {
    title: 'Portfolio – Illustrative Examples | QORVYNT',
    description:
      'Illustrative examples of web applications, Android and iOS apps, AI assistants and analytics dashboards QORVYNT can build.',
  },
  contact: {
    title: 'Start Your Project | Contact QORVYNT',
    description:
      'Tell us about your software, website, mobile app or AI project. QORVYNT will review your requirements and get back to you.',
  },
  privacy: {
    title: 'Privacy Policy | QORVYNT Technologies & Solutions',
    description: 'How QORVYNT Technologies & Solutions handles information shared through this website.',
  },
  terms: {
    title: 'Terms of Service | QORVYNT Technologies & Solutions',
    description: 'Terms for using the QORVYNT Technologies & Solutions website.',
  },
};

// Temporary colour-theme preview (components/ThemeSwitcher.jsx). Once a final theme is chosen,
// make its palette the :root default in styles.css and set this to false.
export const SHOW_THEME_SWITCHER = true;

// `id` matches a [data-theme] block in styles.css ('blue' is the :root default).
// `swatch` colours are only for the switcher and favicon: background, card, primary, accent, heading.
export const THEMES = [
  { id: 'crimson', label: 'Theme 1', name: 'Crimson Midnight', feel: 'Bold, energetic, high-impact', swatch: ['#0e1018', '#181b26', '#f43f5e', '#fda4af', '#f8f8fa'] },
  { id: 'teal', label: 'Theme 2', name: 'Teal Sand', feel: 'Calm, trustworthy, refined', swatch: ['#0a1a1e', '#11262b', '#2dd4bf', '#f2d0a4', '#eefbfa'] },
  { id: 'platinum', label: 'Theme 3', name: 'Platinum Mono', feel: 'Minimal, elegant, enterprise', swatch: ['#0d0f12', '#171a1f', '#cbd5e1', '#f8fafc', '#fafafa'] },
  { id: 'lime', label: 'Theme 4', name: 'Indigo Lime', feel: 'Futuristic, AI-driven, standout', swatch: ['#12122a', '#1c1c3a', '#a3e635', '#d9f99d', '#f4f4ff'] },
  { id: 'blue', label: 'Current', name: 'Blue Cyan', feel: 'The current live colours', swatch: ['#080d1a', '#111827', '#2563eb', '#22d3ee', '#f8fafc'] },
];
export const DEFAULT_THEME = 'blue';

export const NAV = [
  { id: 'home', label: 'Home' },
  { id: 'about', label: 'About' },
  { id: 'services', label: 'Services' },
  { id: 'industries', label: 'Industries' },
  { id: 'process', label: 'Process' },
  { id: 'work', label: 'Portfolio' },
  { id: 'contact', label: 'Contact' },
];

export const HERO = {
  eyebrow: 'Software · Mobile · AI · Enterprise',
  text:
    'From custom software and mobile applications to AI-powered solutions and enterprise systems, we help businesses transform ideas into reliable digital products.',
};

export const ABOUT = {
  title: 'Your Technology Partner for What’s Next.',
  text: [
    'QORVYNT Technologies & Solutions works alongside businesses to understand the challenges they face, then designs and builds web, mobile and AI solutions that fit the way they actually work.',
    'From the first conversation to long after launch, we stay involved - improving, supporting and scaling your products as your business grows.',
  ],
  // `icon` matches a key in Icon (components/Icons.jsx).
  highlights: [
    { icon: 'globe', label: 'Websites & web apps' },
    { icon: 'mobile', label: 'Android & iOS apps' },
    { icon: 'spark', label: 'AI & automation' },
    { icon: 'building', label: 'Enterprise systems' },
    { icon: 'cloud', label: 'Cloud & data' },
  ],
};

export const WHY = [
  { icon: 'users', title: 'Customer-first development', text: 'Your goals and users guide every decision we make.' },
  { icon: 'target', title: 'Tailored business solutions', text: 'Built around your processes - not a one-size template.' },
  { icon: 'eye', title: 'Transparent communication', text: 'Regular updates, shared milestones and honest timelines.' },
  { icon: 'check', title: 'Quality-focused engineering', text: 'Code reviews and testing built into every stage.' },
  { icon: 'shield', title: 'Secure & scalable architecture', text: 'Secure coding and designs that grow with your business.' },
  { icon: 'sliders', title: 'Flexible engagement models', text: 'Fixed-scope projects, dedicated teams or ongoing support.' },
  { icon: 'headset', title: 'Long-term technical support', text: 'Updates, monitoring and improvements after launch.' },
];

export const SERVICE_GROUPS = [
  {
    id: 'software',
    title: 'Software & Web Development',
    items: [
      { icon: 'code', title: 'Custom Software Development', text: 'Software built around your workflows and teams.' },
      { icon: 'globe', title: 'Website Development', text: 'Fast, modern, search-friendly business websites.' },
      { icon: 'browser', title: 'Web Application Development', text: 'Secure portals and web apps for every device.' },
      { icon: 'building', title: 'Enterprise Application Development', text: 'ERP, CRM and line-of-business systems.' },
      { icon: 'plug', title: 'API Development & Integration', text: 'Connect systems, partners and platforms.' },
      { icon: 'box', title: 'SaaS Product Development', text: 'Multi-tenant products from MVP to scale.' },
    ],
  },
  {
    id: 'mobile',
    title: 'Android & iOS App Development',
    link: { href: '#mobile', label: 'Explore mobile services' },
    items: [
      { icon: 'mobile', title: 'Android App Development', text: 'Native Android apps, Kotlin where appropriate.' },
      { icon: 'tablet', title: 'iOS App Development', text: 'iPhone and iPad apps, Swift where appropriate.' },
      { icon: 'devices', title: 'Cross-Platform Apps', text: 'Flutter or React Native for both platforms.' },
      { icon: 'pen', title: 'Mobile UI/UX Design', text: 'Research, prototypes and modern interfaces.' },
      { icon: 'server', title: 'App Backend & Integration', text: 'Auth, APIs, databases and notifications.' },
      { icon: 'wrench', title: 'App Maintenance & Support', text: 'Fixes, OS updates and new features.' },
    ],
  },
  {
    id: 'ai',
    title: 'AI & Emerging Technologies',
    items: [
      { icon: 'spark', title: 'AI Application Development', text: 'Practical AI features inside your products.' },
      { icon: 'bot', title: 'AI Chatbots & Assistants', text: 'Assistants for customers and internal teams.' },
      { icon: 'flow', title: 'Workflow Automation', text: 'Remove repetitive, manual business tasks.' },
      { icon: 'chart', title: 'Data Engineering & Analytics', text: 'Pipelines and dashboards for decisions.' },
      { icon: 'cloud', title: 'Cloud Solutions & Migration', text: 'Secure, cost-aware cloud infrastructure.' },
      { icon: 'compass', title: 'IT Consulting', text: 'Architecture advice and digital roadmaps.' },
      { icon: 'headset', title: 'Maintenance & Technical Support', text: 'Keep applications healthy and up to date.' },
    ],
  },
];

export const MOBILE = {
  title: 'Mobile Applications Built for Your Business.',
  intro:
    'We design, build and support Android and iOS apps - native or cross-platform, chosen after we understand your requirements.',
  services: [
    {
      icon: 'mobile',
      title: 'Android App Development',
      points: ['Native Android applications', 'Kotlin where appropriate', 'Business, customer & enterprise apps', 'Performance, security & device support'],
    },
    {
      icon: 'tablet',
      title: 'iOS App Development',
      points: ['Native iPhone and iPad apps', 'Swift where appropriate', 'Apple ecosystem integration', 'Secure, high-quality experiences'],
    },
    {
      icon: 'devices',
      title: 'Cross-Platform Apps',
      points: ['Flutter or React Native', 'One codebase for Android & iOS', 'Consistent UX on both platforms', 'Efficient build & maintenance'],
    },
    {
      icon: 'pen',
      title: 'Mobile UI/UX Design',
      points: ['User research and wireframes', 'Interactive prototypes', 'Modern mobile interfaces', 'Accessibility & usability'],
    },
    {
      icon: 'server',
      title: 'App Backend & Integration',
      points: ['Authentication & user accounts', 'APIs, databases & cloud', 'Notifications & file uploads', 'Analytics & third-party services'],
    },
    {
      icon: 'wrench',
      title: 'App Maintenance & Support',
      points: ['Bug fixes & performance tuning', 'OS compatibility updates', 'Security updates', 'New features & ongoing support'],
    },
  ],
  note: 'Store submission support is available; final approval rests with Google Play and the Apple App Store.',
};

export const INDUSTRIES = [
  { icon: 'factory', title: 'Manufacturing', text: 'Production tracking, inventory and plant-floor visibility.' },
  { icon: 'cart', title: 'Retail & E-commerce', text: 'Online stores, shopping apps and order management.' },
  { icon: 'heart', title: 'Healthcare', text: 'Patient-facing apps, portals and secure workflows.' },
  { icon: 'bank', title: 'Financial Services', text: 'Secure transaction systems, reporting and automation.' },
  { icon: 'truck', title: 'Logistics', text: 'Shipment tracking, driver apps and route planning tools.' },
  { icon: 'book', title: 'Education', text: 'Learning platforms, student apps and online classrooms.' },
  { icon: 'rocket', title: 'Startups & SMEs', text: 'MVPs and affordable digital tools that help you scale.' },
  { icon: 'building', title: 'Enterprise Businesses', text: 'Large-scale systems, integrations and modernisation.' },
];

export const PROCESS = [
  { title: 'Discover requirements', text: 'Understand your goals, users and business challenge.' },
  { title: 'Plan the solution', text: 'Define scope, architecture, timeline and milestones.' },
  { title: 'Design the experience', text: 'Wireframes, prototypes and polished interface design.' },
  { title: 'Develop and test', text: 'Build in iterations with code reviews and QA testing.' },
  { title: 'Deploy and maintain', text: 'Launch with care and keep improving after release.' },
];

export const MOBILE_LIFECYCLE = [
  { icon: 'clipboard', title: 'Requirements' },
  { icon: 'pen', title: 'UI/UX design' },
  { icon: 'code', title: 'Development' },
  { icon: 'devices', title: 'Testing on Android & iOS' },
  { icon: 'upload', title: 'Release preparation' },
  { icon: 'wrench', title: 'Ongoing maintenance' },
];

// Illustrative examples of the kind of work QORVYNT does - not real client projects.
// `mock` picks the small preview drawn in components/Portfolio.jsx.
export const PROJECTS = [
  { mock: 'table', title: 'Business Management Web Application', text: 'Customers, orders, invoices and staff tasks in one browser-based system.', tags: ['Web App', 'Cloud'] },
  { mock: 'stock', title: 'Inventory Management System', text: 'Real-time stock levels, purchase orders and low-stock alerts across locations.', tags: ['Web', 'API'] },
  { mock: 'android', title: 'Android Business App', text: 'Field team app for job lists, photos, signatures and offline sync.', tags: ['Android', 'Kotlin'] },
  { mock: 'ios', title: 'iOS Customer App', text: 'Booking, payments and order tracking for iPhone customers.', tags: ['iOS', 'Swift'] },
  { mock: 'cross', title: 'Cross-Platform Service App', text: 'One codebase serving Android and iOS users with a shared design system.', tags: ['Flutter', 'React Native'] },
  { mock: 'chat', title: 'AI-Powered Business Assistant', text: 'Answers staff and customer questions from company documents.', tags: ['AI', 'Automation'] },
  { mock: 'bars', title: 'Data Analytics Dashboard', text: 'Sales, operations and finance KPIs with automated reports.', tags: ['Data', 'Analytics'] },
];

export const PROJECT_TYPES = [
  'New product or application',
  'Redesign / modernisation',
  'Add features to an existing system',
  'Maintenance & support',
  'Consulting / discovery',
  'Other',
];

export const PLATFORMS = ['Website', 'Web App', 'Android', 'iOS', 'Android + iOS', 'AI', 'Enterprise Software', 'Other'];

export const BUDGETS = ['Under $5,000', '$5,000 – $15,000', '$15,000 – $50,000', '$50,000 – $100,000', 'Over $100,000', 'Not sure yet'];
