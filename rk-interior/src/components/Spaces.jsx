import { BUSINESS, SPACES, whatsappLink } from '../data.js';
import { ArrowIcon, ServiceIcon } from './Icons.jsx';

export default function Spaces({ onOpenPhoto }) {
  return (
    <section className="section" id="spaces">
      <div className="container">
        <div className="section__head">
          <p className="eyebrow">Spaces we design</p>
          <h2>Every room, done right</h2>
        </div>
        <div className="spaces">
          {SPACES.map((s) => (
            <article key={s.title} className="space">
              <button className="photo" onClick={() => onOpenPhoto(s.photo.src)}>
                <img src={s.photo.src} alt={s.photo.alt} loading="lazy" />
              </button>
              <div className="space__body">
                <h3>
                  <span className="space__icon">
                    <ServiceIcon id={s.icon} width={20} height={20} />
                  </span>
                  {s.title}
                </h3>
                <p>{s.text}</p>
                <a
                  className="space__link"
                  href={whatsappLink(`Hi ${BUSINESS.name}, I'd like a quote for my ${s.title.toLowerCase()}.`)}
                  target="_blank"
                  rel="noreferrer"
                >
                  Ask for a quote <ArrowIcon width={16} height={16} />
                </a>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
