import { BUSINESS, PHOTOS, whatsappLink } from '../data.js';
import { PhoneIcon, PinIcon, WhatsAppIcon } from './Icons.jsx';

export default function Hero() {
  return (
    <section className="hero" id="top">
      <div className="container hero__inner">
        <div className="hero__text">
          <p className="eyebrow">Kodumudi · Erode District</p>
          <h1>
            Aluminium, UPVC &amp; PVC works, <span className="hl">curtains</span> and fluted panels
          </h1>
          <p className="hero__lead">
            Partitions, windows, doors, cupboards and curtains for homes, offices and shops,
            measured, fabricated and fitted to your site.
          </p>
          <div className="hero__actions">
            <a className="btn btn--yellow btn--lg" href={`tel:${BUSINESS.phones[0].tel}`}>
              <PhoneIcon /> Call {BUSINESS.phones[0].display}
            </a>
            <a
              className="btn btn--whatsapp btn--lg"
              href={whatsappLink('Hi Vallangarai Traders, I would like a quote.')}
              target="_blank"
              rel="noreferrer"
            >
              <WhatsAppIcon /> WhatsApp
            </a>
          </div>
          <p className="hero__address">
            <PinIcon width={18} height={18} /> KS Complex, opp. Vagai Bakery, Kodumudi
          </p>
        </div>

        <div className="hero__collage" aria-hidden="true">
          <img className="hero__img hero__img--a" src={PHOTOS.flutedInterior.src} alt="" />
          <img className="hero__img hero__img--b" src={PHOTOS.aluminiumPartition.src} alt="" />
          <img className="hero__img hero__img--c" src={PHOTOS.blackoutCurtains.src} alt="" />
        </div>
      </div>

      <div className="strip">
        <div className="container strip__inner">
          {BUSINESS.tagline.split('|').map((t) => (
            <span key={t}>{t.trim()}</span>
          ))}
        </div>
      </div>
    </section>
  );
}
