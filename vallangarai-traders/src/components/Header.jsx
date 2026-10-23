import { useEffect, useState } from 'react';
import { BUSINESS } from '../data.js';
import { CloseIcon, MenuIcon, PhoneIcon } from './Icons.jsx';

const LINKS = [
  { href: '#services', label: 'Services' },
  { href: '#products', label: 'Products' },
  { href: '#gallery', label: 'Gallery' },
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
          <img src="/images/logo-mark.png" alt="" width="54" height="36" />
          <span>
            <strong>Vallangarai</strong> Traders
          </span>
        </a>

        <nav className={`nav${open ? ' nav--open' : ''}`} aria-label="Main">
          {LINKS.map((l) => (
            <a key={l.href} href={l.href} onClick={() => setOpen(false)}>
              {l.label}
            </a>
          ))}
          <a className="btn btn--yellow nav__call" href={`tel:${BUSINESS.phones[0].tel}`}>
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
