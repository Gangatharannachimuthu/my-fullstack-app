import { BUSINESS, INSTAGRAM, SERVICES, whatsappLink } from '../data.js';
import Logo from './Logo.jsx';
import { InstagramIcon, MailIcon, PhoneIcon, WhatsAppIcon } from './Icons.jsx';

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div>
          <Logo light slogan />
          <p className="footer__about">Interior design and execution in {BUSINESS.area.replace(' · ', ', ')}.</p>
        </div>
        <div>
          <h4>Services</h4>
          <ul>
            {SERVICES.slice(0, 5).map((s) => (
              <li key={s.title}>{s.title}</li>
            ))}
          </ul>
        </div>
        <div>
          <h4>Contact</h4>
          <p>
            {BUSINESS.owner.name}, {BUSINESS.owner.role}
          </p>
          <p>{BUSINESS.addressLines.join(' ')}</p>
        </div>
      </div>

      <div className="container">
        <div className="footer__bar">
          {BUSINESS.phones.map((p) => (
            <a key={p.tel} href={`tel:${p.tel}`}>
              <span className="footer__bar-icon">
                <PhoneIcon width={18} height={18} />
              </span>
              Mob: {p.display}
            </a>
          ))}
          <a href={`mailto:${BUSINESS.email}`}>
            <span className="footer__bar-icon">
              <MailIcon width={18} height={18} />
            </span>
            {BUSINESS.email}
          </a>
          <a href={INSTAGRAM.url} target="_blank" rel="noreferrer">
            <span className="footer__bar-icon">
              <InstagramIcon width={18} height={18} />
            </span>
            @{INSTAGRAM.handle}
          </a>
        </div>
      </div>

      <div className="footer__bottom">
        © {new Date().getFullYear()} {BUSINESS.name}. All rights reserved.
      </div>
    </footer>
  );
}

export function FloatingWhatsApp() {
  return (
    <a
      className="fab"
      href={whatsappLink(`Hi ${BUSINESS.name}, I have an enquiry.`)}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat with us on WhatsApp"
    >
      <WhatsAppIcon width={30} height={30} />
    </a>
  );
}
