import { PROJECTS } from '../data.js';
import PageHead from './PageHead.jsx';
import Icon from './Icons.jsx';

// Drawn invoice preview for private apps that have no public page to screenshot.
function InvoicePreview() {
  return (
    <div className="invoice" aria-hidden="true">
      <div className="invoice__head">
        <span className="invoice__logo" />
        <span className="invoice__title">INVOICE</span>
      </div>
      {[70, 55, 62, 48].map((w, i) => (
        <span key={i} className="invoice__row">
          <i style={{ width: `${w}%` }} />
          <i />
        </span>
      ))}
      <span className="invoice__total">
        <i />
        <b />
      </span>
    </div>
  );
}

export default function Portfolio() {
  return (
    <section className="page">
      <div className="container">
        <PageHead
          center
          eyebrow="Our Work"
          title="Projects we have delivered"
          intro="Websites and business applications we have designed, built and launched for our clients."
        />
        <div className="grid grid--work">
          {PROJECTS.map((p, i) => (
            <article key={p.client} className="work rise" style={{ '--i': i }}>
              <div className="work__preview">
                {p.image ? (
                  <img src={p.image} alt={`${p.client} website home page`} width="1280" height="800" loading="lazy" />
                ) : (
                  <InvoicePreview />
                )}
              </div>
              <div className="work__body">
                <span className="work__type">{p.type}</span>
                <h2 className="work__client">{p.client}</h2>
                {p.location && (
                  <p className="work__location">
                    <Icon name="pin" size={14} /> {p.location}
                  </p>
                )}
                <p className="work__text">{p.text}</p>
                <ul className="ticks work__features">
                  {p.features.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
                <ul className="project__tags" aria-label="Built with">
                  {p.tags.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
                {p.url ? (
                  <a className="work__link" href={p.url} target="_blank" rel="noopener noreferrer">
                    Visit live site <Icon name="arrow" size={15} />
                    <span className="sr-only"> (opens in a new tab)</span>
                  </a>
                ) : (
                  <p className="work__private">
                    <Icon name="lock" size={14} /> Private business app
                  </p>
                )}
              </div>
            </article>
          ))}
          <a className="project project--cta rise" style={{ '--i': PROJECTS.length }} href="#contact">
            <span className="card__icon">
              <Icon name="rocket" />
            </span>
            <span className="project__title">Your project could be next</span>
            <span className="project__text">Tell us what you want to build and we will help you plan it.</span>
            <span className="project__go">
              Start Your Project <Icon name="arrow" size={16} />
            </span>
          </a>
        </div>
      </div>
    </section>
  );
}
