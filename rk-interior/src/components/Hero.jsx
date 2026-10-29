import { BUSINESS, PHOTOS, SERVICES, whatsappLink } from '../data.js';
import { PhoneIcon, PinIcon, WhatsAppIcon } from './Icons.jsx';

export default function Hero() {
  return (
    <section className="hero" id="top">
      <div className="container hero__inner">
        <div className="hero__text">
          <p className="eyebrow">{BUSINESS.slogan}</p>
          <h1>
            Build your <span className="hl">Dream Home</span> with us
          </h1>
          <p className="hero__lead">
            Complete interior solutions for homes and commercial spaces: modular kitchens,
            wardrobes, TV units, false ceilings, furniture and 2D / 3D design.
          </p>
          <div className="hero__actions">
            <a
              className="btn btn--orange btn--lg"
              href={whatsappLink(`Hi ${BUSINESS.name}, I would like to discuss my interior work.`)}
              target="_blank"
              rel="noreferrer"
            >
              <WhatsAppIcon /> Get a quote
            </a>
            <a className="btn btn--outline btn--lg" href={`tel:${BUSINESS.phones[0].tel}`}>
              <PhoneIcon /> Call {BUSINESS.phones[0].display}
            </a>
          </div>
          <p className="hero__address">
            <PinIcon width={18} height={18} /> {BUSINESS.area}
          </p>
        </div>

        <div className="hero__media">
          <img src={PHOTOS.livingRoomTv.src} alt={PHOTOS.livingRoomTv.alt} />
        </div>
      </div>

      <div className="strip">
        <div className="container strip__inner">
          {SERVICES.slice(1, 6).map((s) => (
            <span key={s.title}>{s.title}</span>
          ))}
        </div>
      </div>
    </section>
  );
}
