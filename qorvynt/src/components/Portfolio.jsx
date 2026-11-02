import { PROJECTS } from '../data.js';
import PageHead from './PageHead.jsx';
import Icon from './Icons.jsx';

const MiniPhone = ({ ios }) => (
  <span className={`mini-phone${ios ? ' mini-phone--ios' : ''}`}>
    <i />
    <i />
    <i />
  </span>
);

// Small abstract previews so the illustrative projects need no screenshots.
function Mock({ type }) {
  switch (type) {
    case 'bars':
      return (
        <div className="mock mock--bars">
          {[40, 65, 50, 85, 70, 95].map((h, i) => (
            <span key={i} style={{ height: `${h}%` }} />
          ))}
        </div>
      );
    case 'stock':
      return (
        <svg className="mock" viewBox="0 0 200 80" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 64 30 52 60 58 90 34 120 40 150 20 200 12" fill="none" style={{ stroke: 'var(--accent)' }} strokeWidth="2.5" />
          <path d="M0 70 30 66 60 62 90 54 120 56 150 44 200 40" fill="none" style={{ stroke: 'var(--primary)' }} strokeWidth="2" strokeDasharray="4 4" />
        </svg>
      );
    case 'chat':
      return (
        <div className="mock mock--chat">
          <span className="mock__bubble" />
          <span className="mock__bubble mock__bubble--me" />
          <span className="mock__bubble mock__bubble--short" />
        </div>
      );
    case 'android':
      return (
        <div className="mock mock--phones">
          <MiniPhone />
        </div>
      );
    case 'ios':
      return (
        <div className="mock mock--phones">
          <MiniPhone ios />
        </div>
      );
    case 'cross':
      return (
        <div className="mock mock--phones">
          <MiniPhone />
          <MiniPhone ios />
        </div>
      );
    default:
      return (
        <div className="mock mock--table">
          {[0, 1, 2, 3].map((r) => (
            <span key={r} className="mock__row">
              <i />
              <i />
              <i className={r % 2 ? 'ok' : 'low'} />
            </span>
          ))}
        </div>
      );
  }
}

export default function Portfolio() {
  return (
    <section className="page">
      <div className="container">
        <PageHead
          center
          eyebrow="Portfolio"
          title="What we can build for you"
          intro="Illustrative examples of solutions we build - not completed client projects or real customers."
        />
        <div className="grid grid--projects">
          {PROJECTS.map((p, i) => (
            <article key={p.title} className="project rise" style={{ '--i': i }}>
              <div className="project__preview" aria-hidden="true">
                <Mock type={p.mock} />
              </div>
              <span className="tag-sample">Illustrative example</span>
              <h2 className="project__title">{p.title}</h2>
              <p className="project__text">{p.text}</p>
              <ul className="project__tags" aria-label="Solution type">
                {p.tags.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </article>
          ))}
          <a className="project project--cta rise" style={{ '--i': PROJECTS.length }} href="#contact">
            <span className="card__icon">
              <Icon name="rocket" />
            </span>
            <span className="project__title">Have a project in mind?</span>
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
