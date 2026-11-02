import { useEffect, useState } from 'react';
import { ArrowIcon, CloseIcon } from './Icons.jsx';

// Grid layout for any photo count, so the owner's uploads never leave gaps at the top:
// 1 or 2 photos fill the row; multiples of 3 show the first photo large.
const gridClass = (count) => {
  if (count <= 2) return `gallery gallery--${count}`;
  return count % 3 === 0 ? 'gallery gallery--feature' : 'gallery';
};

export function Gallery({ tabs, onOpen }) {
  const [activeId, setActiveId] = useState(tabs[0].id);
  const active = tabs.find((t) => t.id === activeId);

  return (
    <section className="section section--tint" id="gallery">
      <div className="container">
        <div className="section__head">
          <p className="eyebrow">Our work</p>
          <h2>Gallery</h2>
        </div>

        <div className="tabs" role="tablist" aria-label="Gallery">
          {tabs.map((t) => (
            <button
              key={t.id}
              role="tab"
              id={`gallery-tab-${t.id}`}
              aria-selected={t.id === active.id}
              aria-controls="gallery-panel"
              className={`tab${t.id === active.id ? ' tab--active' : ''}`}
              onClick={() => setActiveId(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div id="gallery-panel" role="tabpanel" aria-labelledby={`gallery-tab-${active.id}`}>
          {active.photos.length > 0 ? (
            <div className={gridClass(active.photos.length)}>
              {active.photos.map((p) => (
                <button key={p.src} className="photo gallery__item" onClick={() => onOpen(p.src)}>
                  <img src={p.src} alt={p.alt} loading="lazy" />
                </button>
              ))}
            </div>
          ) : (
            <p className="gallery__empty">Photos coming soon.</p>
          )}
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
