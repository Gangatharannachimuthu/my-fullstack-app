import { useEffect, useState } from 'react';
import { BUSINESS } from '../data.js';
import Logo from './Logo.jsx';
import { CloseIcon, MenuIcon, PhoneIcon } from './Icons.jsx';

const LINKS = [
  { href: '#about', label: 'About' },
  { href: '#services', label: 'Services' },
  { href: '#spaces', label: 'Spaces' },
  { href: '#gallery', label: 'Gallery' },
  { href: '#reviews', label: 'Reviews' },
  { href: '#contact', label: 'Contact' },
];

export default function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`header${scrolled ? ' header--scrolled' : ''}`}>
      <div className="container header__inner">
        <a href="#top" className="header__brand" onClick={() => setOpen(false)}>
          <Logo />
        </a>

        <nav className={`nav${open ? ' nav--open' : ''}`} aria-label="Main">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)}>
              {l.label}
            </a>
          ))}
          <a className="btn btn--orange nav__call" href={`tel:${BUSINESS.phones[0].tel}`}>
            <PhoneIcon width={18} height={18} /> {BUSINESS.phones[0].display}
          </a>
        </nav>

        <button
          className="header__toggle"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>
    </header>
  );
}
