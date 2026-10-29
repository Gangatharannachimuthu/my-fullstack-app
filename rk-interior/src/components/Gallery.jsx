import { useEffect } from 'react';
import { ArrowIcon, CloseIcon } from './Icons.jsx';

export function Gallery({ photos, onOpen }) {
  return (
    <section className="section section--tint" id="gallery">
      <div className="container">
        <div className="section__head">
          <p className="eyebrow">Our work</p>
          <h2>Gallery</h2>
        </div>
        <div className="gallery">
          {photos.map((p, i) => (
            <button key={p.src} className={`photo gallery__item gallery__item--${i}`} onClick={() => onOpen(p.src)}>
              <img src={p.src} alt={p.alt} loading="lazy" />
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}

export function Lightbox({ photos, index, onClose, onMove }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onMove(1);
      if (e.key === 'ArrowLeft') onMove(-1);
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose, onMove]);

  const p = photos[index];
  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label="Photo viewer" onClick={onClose}>
      <button className="lightbox__close" aria-label="Close" onClick={onClose}>
        <CloseIcon width={28} height={28} />
      </button>
      <button
        className="lightbox__nav lightbox__nav--prev"
        aria-label="Previous photo"
        onClick={(e) => { e.stopPropagation(); onMove(-1); }}
      >
        <ArrowIcon dir="left" width={28} height={28} />
      </button>
      <figure onClick={(e) => e.stopPropagation()}>
        <img src={p.src} alt={p.alt} />
        <figcaption>
          {p.alt} · {index + 1} / {photos.length}
        </figcaption>
      </figure>
      <button
        className="lightbox__nav lightbox__nav--next"
        aria-label="Next photo"
        onClick={(e) => { e.stopPropagation(); onMove(1); }}
      >
        <ArrowIcon width={28} height={28} />
      </button>
    </div>
  );
}
