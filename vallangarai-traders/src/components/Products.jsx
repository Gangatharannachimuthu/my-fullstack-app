import { CATEGORIES, whatsappLink } from '../data.js';
import { CategoryIcon, WhatsAppIcon } from './Icons.jsx';

export default function Products({ active, onSelect, onOpenPhoto }) {
  const cat = CATEGORIES.find((c) => c.id === active) || CATEGORIES[0];

  return (
    <section className="section section--tint" id="products">
      <div className="container">
        <div className="section__head">
          <p className="eyebrow">Products</p>
          <h2>Explore by category</h2>
        </div>

        <div className="tabs" role="tablist" aria-label="Product categories">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              role="tab"
              id={`tab-${c.id}`}
              aria-selected={c.id === cat.id}
              aria-controls="product-panel"
              className={`tab${c.id === cat.id ? ' tab--active' : ''}`}
              onClick={() => onSelect(c.id)}
            >
              <CategoryIcon id={c.id} width={18} height={18} />
              {c.title}
            </button>
          ))}
        </div>

        <div className="panel" id="product-panel" role="tabpanel" aria-labelledby={`tab-${cat.id}`}>
          <div className={`panel__photos panel__photos--${Math.min(cat.photos.length, 3)}`}>
            {cat.photos.map((p) => (
              <button key={p.src} className="photo" onClick={() => onOpenPhoto(p.src)}>
                <img src={p.src} alt={p.alt} loading="lazy" />
              </button>
            ))}
          </div>

          <div className="panel__body">
            <h3>{cat.title}</h3>
            <ol className="items">
              {cat.items.map((it, i) => (
                <li key={it.name}>
                  <span className="items__num">{i + 1}</span>
                  <div>
                    <h4>{it.name}</h4>
                    <p>{it.text}</p>
                  </div>
                </li>
              ))}
            </ol>
            <a
              className="btn btn--whatsapp"
              href={whatsappLink(`Hi Vallangarai Traders, I'd like a quote for ${cat.title}.`)}
              target="_blank"
              rel="noreferrer"
            >
              <WhatsAppIcon /> Ask for a quote
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
