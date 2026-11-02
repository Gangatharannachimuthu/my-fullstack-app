import { useEffect, useState } from 'react';
import { BUSINESS, HERO_SLIDES } from '../data.js';

const SLIDE_MS = 2500;

// Full-screen home page: the photos fill the screen behind the headline, each slowly zooming,
// with clickable room labels whose bars fill up while that photo is shown.
export default function Hero() {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reduceMotion] = useState(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches);

  useEffect(() => {
    if (paused || reduceMotion) return undefined;
    const id = setTimeout(() => setIndex((i) => (i + 1) % HERO_SLIDES.length), SLIDE_MS);
    return () => clearTimeout(id);
  }, [paused, reduceMotion, index]);

  return (
    <section
      className={`hero${paused ? ' hero--paused' : ''}`}
      id="top"
      style={{ '--slide-ms': `${SLIDE_MS}ms` }}
    >
      <div className="hero__slides">
        {HERO_SLIDES.map((s, i) => (
          <img
            key={s.src}
            src={s.src}
            alt={s.alt}
            className={i === index ? 'is-active' : undefined}
            aria-hidden={i !== index}
          />
        ))}
      </div>

      <div className="container hero__content">
        <p className="eyebrow eyebrow--light hero__rise">{BUSINESS.slogan}</p>
        <h1 className="hero__rise">
          Build your <span className="hl">Dream Home</span> with us
        </h1>
        <p className="hero__lead hero__rise">
          Complete interior solutions for homes and commercial spaces, designed in 2D / 3D and
          built to finish by one team.
        </p>
      </div>

      <div
        className="container hero__nav"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {HERO_SLIDES.map((s, i) => (
          <button
            key={s.src}
            className={`hero__tab${i === index ? ' is-active' : ''}`}
            aria-label={`Show ${s.label} photo`}
            aria-current={i === index}
            onClick={() => setIndex(i)}
          >
            <span className="hero__tab-num">{String(i + 1).padStart(2, '0')}</span>
            <span className="hero__tab-label">{s.label}</span>
            <span className="hero__tab-bar">
              {i === index && !reduceMotion && <span key={index} className="hero__tab-fill" />}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
