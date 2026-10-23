import { BUSINESS, whatsappLink } from '../data.js';
import { WhatsAppIcon } from './Icons.jsx';

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer__inner">
        <div>
          <img className="footer__logo" src="/images/logo.png" alt="Vallangarai Traders" width="240" height="64" />
          <p>{BUSINESS.tagline}</p>
        </div>
        <div>
          <h4>Address</h4>
          <p>{BUSINESS.addressLines.join(' ')}</p>
        </div>
        <div>
          <h4>Phone</h4>
          {BUSINESS.phones.map((p) => (
            <p key={p.tel}>
              <a href={`tel:${p.tel}`}>{p.display}</a>
            </p>
          ))}
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
      href={whatsappLink('Hi Vallangarai Traders, I have an enquiry.')}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat with us on WhatsApp"
    >
      <WhatsAppIcon width={30} height={30} />
    </a>
  );
}
