import { CATEGORIES } from '../data.js';
import { ArrowIcon, CategoryIcon } from './Icons.jsx';

export default function Services({ onSelect }) {
  return (
    <section className="section" id="services">
      <div className="container">
        <div className="section__head">
          <p className="eyebrow">What we do</p>
          <h2>Our services</h2>
        </div>
        <div className="services">
          {CATEGORIES.map((c) => (
            <a
              key={c.id}
              href="#products"
              className="service"
              onClick={() => onSelect(c.id)}
            >
              <span className="service__icon">
                <CategoryIcon id={c.id} width={26} height={26} />
              </span>
              <h3>{c.title}</h3>
              <p>{c.short}</p>
              <span className="service__more">
                View details <ArrowIcon width={16} height={16} />
              </span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
