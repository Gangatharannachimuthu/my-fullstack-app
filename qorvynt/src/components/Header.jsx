import { useEffect, useState } from 'react';
import { NAV } from '../data.js';
import Logo from './Logo.jsx';
import Icon from './Icons.jsx';

// Pages without their own menu item highlight their parent item instead.
const SUB_PAGES = { mobile: 'services' };

export default function Header({ page }) {
  const [open, setOpen] = useState(false);

  // Close the mobile menu on page change and with Escape; lock page scroll while it is open.
  useEffect(() => setOpen(false), [page]);
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    document.body.classList.add('no-scroll');
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.classList.remove('no-scroll');
    };
  }, [open]);

  return (
    <header className="header">
      <div className="container header__inner">
        <a href="#home" className="header__brand" aria-label="QORVYNT Technologies & Solutions - Home">
          <Logo />
        </a>

        <nav id="main-nav" className={`nav${open ? ' nav--open' : ''}`} aria-label="Main">
          {NAV.map((l) => (
            <a
              key={l.id}
              href={`#${l.id}`}
              className="nav__link"
              aria-current={l.id === (SUB_PAGES[page] || page) ? 'page' : undefined}
              onClick={() => setOpen(false)}
            >
              {l.label}
            </a>
          ))}
          <a className="btn btn--primary nav__cta" href="#contact" onClick={() => setOpen(false)}>
            Let’s Talk
          </a>
        </nav>

        <button
          type="button"
          className="header__toggle"
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          aria-controls="main-nav"
          onClick={() => setOpen((o) => !o)}
        >
          <Icon name={open ? 'close' : 'menu'} />
        </button>
      </div>
    </header>
  );
}
