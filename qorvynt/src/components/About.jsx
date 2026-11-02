import { ABOUT, WHY } from '../data.js';
import PageHead from './PageHead.jsx';
import Card from './Card.jsx';
import Icon from './Icons.jsx';

// About + "Why Choose QORVYNT?" side by side so the page fits one desktop screen.
export default function About() {
  return (
    <section className="page">
      <div className="container about">
        <div className="about__intro">
          <PageHead eyebrow="About Us" title={ABOUT.title} />
          {ABOUT.text.map((p) => (
            <p key={p.slice(0, 24)} className="about__text">
              {p}
            </p>
          ))}
          <ul className="highlights" aria-label="What we stand for">
            {ABOUT.highlights.map((h, i) => (
              <li key={h.label} className="highlight rise" style={{ '--i': i }}>
                <Icon name={h.icon} size={20} /> {h.label}
              </li>
            ))}
          </ul>
        </div>

        <div className="about__why">
          <PageHead as="h2" eyebrow="Why Choose QORVYNT?" title="Built around your success" />
          <div className="grid grid--why">
            {WHY.map((w, i) => (
              <Card key={w.title} {...w} i={i} as="h3" className="card--compact" />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
