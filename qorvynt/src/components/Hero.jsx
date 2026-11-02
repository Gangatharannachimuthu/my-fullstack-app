import { HERO } from '../data.js';
import HeroVisual from './HeroVisual.jsx';
import Icon from './Icons.jsx';

export default function Hero() {
  return (
    <section className="page hero" aria-labelledby="hero-title">
      <div className="hero__grid-bg" aria-hidden="true" />
      <div className="container hero__inner">
        <div className="hero__copy">
          <p className="eyebrow rise" style={{ '--i': 0 }}>
            {HERO.eyebrow}
          </p>
          <h1 id="hero-title" className="hero__title rise" style={{ '--i': 1 }}>
            We Build Technology That <span className="text-grad">Moves Your Business</span> Forward.
          </h1>
          <p className="hero__text rise" style={{ '--i': 2 }}>
            {HERO.text}
          </p>
          <div className="hero__actions rise" style={{ '--i': 3 }}>
            <a className="btn btn--primary btn--lg" href="#contact">
              Start Your Project <Icon name="arrow" size={18} />
            </a>
            <a className="btn btn--ghost btn--lg" href="#services">
              Explore Our Services
            </a>
          </div>
          <p className="hero__tagline rise" style={{ '--i': 4 }}>
            Engineering Tomorrow, Today.
          </p>
        </div>
        <HeroVisual />
      </div>
    </section>
  );
}
