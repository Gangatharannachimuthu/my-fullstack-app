import { SERVICE_GROUPS } from '../data.js';
import PageHead from './PageHead.jsx';
import Icon from './Icons.jsx';

export default function Services() {
  return (
    <section className="page">
      <div className="container">
        <PageHead
          center
          eyebrow="Services"
          title="A complete technology service portfolio"
          intro="Software, web, mobile and AI - designed, built and supported by one partner across the full product lifecycle."
        />
        <div className="groups">
          {SERVICE_GROUPS.map((g, gi) => (
            <section key={g.id} className={`group group--${g.id} rise`} style={{ '--i': gi }} aria-labelledby={`g-${g.id}`}>
              <div className="group__head">
                <h2 id={`g-${g.id}`} className="group__title">
                  {g.title}
                </h2>
                {g.link && (
                  <a className="group__link" href={g.link.href}>
                    {g.link.label} <Icon name="arrow" size={15} />
                  </a>
                )}
              </div>
              <ul className="svc-list">
                {g.items.map((s) => (
                  <li key={s.title} className="svc">
                    <span className="svc__icon">
                      <Icon name={s.icon} size={20} />
                    </span>
                    <span>
                      <h3 className="svc__title">{s.title}</h3>
                      <p className="svc__text">{s.text}</p>
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </section>
  );
}
