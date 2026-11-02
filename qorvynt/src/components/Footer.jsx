import { COMPANY, NAV, SERVICE_GROUPS } from '../data.js';
import Logo from './Logo.jsx';
import ContactDetails from './ContactDetails.jsx';

// Shown only on the Contact page, kept slim so that page still fits one desktop screen.
export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__grid">
        <div className="footer__brand">
          <Logo />
          <p>{COMPANY.description}</p>
        </div>
        <nav aria-label="Quick links">
          <h2 className="footer__title">Quick Links</h2>
          <ul className="footer__links">
            {NAV.map((l) => (
              <li key={l.id}>
                <a href={`#${l.id}`}>{l.label}</a>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Services">
          <h2 className="footer__title">Services</h2>
          <ul>
            {SERVICE_GROUPS.map((g) => (
              <li key={g.id}>
                <a href={g.link?.href || '#services'}>{g.title}</a>
              </li>
            ))}
            <li>
              <a href="#work">Our work</a>
            </li>
          </ul>
        </nav>
        <div>
          <h2 className="footer__title">Contact</h2>
          <ContactDetails compact />
        </div>
      </div>
      <div className="container footer__bottom">
        <p>
          © {new Date().getFullYear()} {COMPANY.name}. All rights reserved.
        </p>
        <p className="footer__legal">
          <a href="#privacy">Privacy Policy</a>
          <a href="#terms">Terms of Service</a>
        </p>
      </div>
    </footer>
  );
}
