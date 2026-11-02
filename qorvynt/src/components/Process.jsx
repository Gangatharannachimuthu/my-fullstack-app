import { MOBILE_LIFECYCLE, PROCESS } from '../data.js';
import PageHead from './PageHead.jsx';
import Icon from './Icons.jsx';

export default function Process() {
  return (
    <section className="page">
      <div className="container">
        <PageHead
          center
          eyebrow="Development Process"
          title="A clear path from idea to launch"
          intro="Every project follows a transparent, milestone-based process so you always know what is happening next."
        />
        <ol className="steps">
          {PROCESS.map((s, i) => (
            <li key={s.title} className="step rise" style={{ '--i': i }}>
              <span className="step__num">{String(i + 1).padStart(2, '0')}</span>
              <h2 className="step__title">{s.title}</h2>
              <p className="step__text">{s.text}</p>
            </li>
          ))}
        </ol>

        <div className="lifecycle rise" style={{ '--i': 6 }}>
          <div className="lifecycle__head">
            <h2 className="lifecycle__title">Mobile app lifecycle</h2>
            <p>For Android and iOS projects, the same process adds platform-specific testing and store release preparation.</p>
          </div>
          <ol className="lifecycle__steps">
            {MOBILE_LIFECYCLE.map((s) => (
              <li key={s.title}>
                <span className="lifecycle__icon">
                  <Icon name={s.icon} size={20} />
                </span>
                {s.title}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
