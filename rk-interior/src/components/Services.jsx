import { SERVICES } from '../data.js';
import { ServiceIcon } from './Icons.jsx';

export default function Services() {
  return (
    <section className="section section--tint" id="services">
      <div className="container">
        <div className="section__head">
          <p className="eyebrow">What we do</p>
          <h2>Our services</h2>
        </div>
        <ul className="services">
          {SERVICES.map((s) => (
            <li key={s.title} className="service">
              <span className="service__icon">
                <ServiceIcon id={s.icon} width={26} height={26} />
              </span>
              <h3>{s.title}</h3>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
