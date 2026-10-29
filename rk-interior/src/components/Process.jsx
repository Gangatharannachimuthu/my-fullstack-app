import { PROCESS } from '../data.js';

export default function Process() {
  return (
    <section className="section section--dark" id="process">
      <div className="container">
        <div className="section__head">
          <p className="eyebrow">How we work</p>
          <h2>End-to-end project execution</h2>
        </div>
        <ol className="process">
          {PROCESS.map((s, i) => (
            <li key={s.title} className="step">
              <span className="step__num">{i + 1}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
