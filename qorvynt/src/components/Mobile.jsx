import { MOBILE } from '../data.js';
import PageHead from './PageHead.jsx';
import Icon from './Icons.jsx';
import Phone from './Phone.jsx';

export default function Mobile() {
  return (
    <section className="page page--mobile">
      <div className="container mobile">
        <div className="mobile__main">
          <PageHead eyebrow="Android & iOS App Development" title={MOBILE.title} intro={MOBILE.intro} />
          <div className="grid grid--mobile">
            {MOBILE.services.map((s, i) => (
              <article key={s.title} className="card card--mobile rise" style={{ '--i': i }}>
                <div className="card__head">
                  <span className="card__icon">
                    <Icon name={s.icon} />
                  </span>
                  <h2 className="card__title">{s.title}</h2>
                </div>
                <ul className="ticks">
                  {s.points.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
          <div className="mobile__cta rise" style={{ '--i': 6 }}>
            <a className="btn btn--primary btn--lg" href="#contact">
              Build Your Mobile App <Icon name="arrow" size={18} />
            </a>
            <p className="mobile__note">{MOBILE.note}</p>
          </div>
        </div>

        <figure className="devices rise" style={{ '--i': 3 }}>
          <div className="devices__stage">
            <Phone variant="android" className="devices__android" />
            <Phone variant="ios" className="devices__ios" />
          </div>
          <figcaption className="devices__caption">
            <span className="tag-sample">Illustrative mockup</span>
            Sample Android &amp; iOS business app - not a client project or published app.
          </figcaption>
        </figure>
      </div>
    </section>
  );
}
