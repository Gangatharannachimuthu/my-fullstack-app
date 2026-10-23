import { STRENGTHS } from '../data.js';
import { CheckIcon } from './Icons.jsx';

export default function WhyUs() {
  return (
    <section className="section section--blue" id="why">
      <div className="container">
        <div className="section__head">
          <p className="eyebrow eyebrow--yellow">Why Vallangarai Traders</p>
          <h2>Made for your space, not off the shelf</h2>
        </div>
        <div className="strengths">
          {STRENGTHS.map((s) => (
            <div key={s.title} className="strength">
              <span className="strength__icon">
                <CheckIcon width={22} height={22} />
              </span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
