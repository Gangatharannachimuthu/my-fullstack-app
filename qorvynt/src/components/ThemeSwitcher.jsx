import { useEffect, useLayoutEffect, useState } from 'react';
import { DEFAULT_THEME, THEMES } from '../data.js';
import Icon from './Icons.jsx';

// Temporary colour-theme preview. Sets data-theme on <html> so the whole site restyles
// instantly; the choice is remembered in this browser and can be shared with ?theme=1..4.
const STORAGE_KEY = 'qorvynt-theme';

function initialTheme() {
  const param = new URLSearchParams(window.location.search).get('theme');
  const fromUrl = THEMES.find((t) => t.id === param || t.label === `Theme ${param}`);
  if (fromUrl) return fromUrl.id;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (THEMES.some((t) => t.id === saved)) return saved;
  } catch {
    /* storage unavailable - fall back to the default */
  }
  return DEFAULT_THEME;
}

// Favicon in the theme's colours, matching the logo mark.
const faviconFor = ([bg, , primary, accent, text]) =>
  `data:image/svg+xml,${encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${accent}"/><stop offset="1" stop-color="${primary}"/></linearGradient></defs><rect width="40" height="40" rx="9" fill="${bg}"/><path d="M20 4.5 33.4 12.3v15.4L20 35.5 6.6 27.7V12.3Z" fill="none" stroke="url(#g)" stroke-width="2.8" stroke-linejoin="round"/><circle cx="20" cy="20" r="6.4" fill="none" stroke="${text}" stroke-width="2.8"/><path d="m23.8 23.8 5 5" stroke="${accent}" stroke-width="3" stroke-linecap="round"/></svg>`,
  )}`;

export default function ThemeSwitcher() {
  const [theme, setTheme] = useState(initialTheme);
  const [open, setOpen] = useState(false);
  const current = THEMES.find((t) => t.id === theme);

  useLayoutEffect(() => {
    const root = document.documentElement;
    if (theme === DEFAULT_THEME) delete root.dataset.theme;
    else root.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', current.swatch[0]);
    document.querySelector('link[rel="icon"]')?.setAttribute('href', faviconFor(current.swatch));
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* not persisted - still applied for this visit */
    }
  }, [theme, current]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <div className={`themer${open ? ' themer--open' : ''}`}>
      {open && (
        <div className="themer__panel" id="themer-panel" role="dialog" aria-label="Theme preview">
          <div className="themer__head">
            <p className="themer__title">Theme preview</p>
            <p className="themer__hint">Temporary - compare colours before choosing the final brand theme.</p>
          </div>
          <fieldset className="themer__options">
            <legend className="sr-only">Colour theme</legend>
            {THEMES.map((t) => (
              <label key={t.id} className={`themer__option${t.id === theme ? ' is-active' : ''}`}>
                <input
                  type="radio"
                  name="theme"
                  value={t.id}
                  checked={t.id === theme}
                  onChange={() => setTheme(t.id)}
                />
                <span className="themer__swatches" aria-hidden="true">
                  {t.swatch.slice(0, 4).map((c) => (
                    <i key={c} style={{ background: c }} />
                  ))}
                </span>
                <span className="themer__text">
                  <b>
                    {t.label} – {t.name}
                  </b>
                  <small>{t.feel}</small>
                </span>
                {t.id === theme && <span className="themer__check">Selected</span>}
              </label>
            ))}
          </fieldset>
        </div>
      )}
      <button
        type="button"
        className="themer__toggle"
        aria-expanded={open}
        aria-controls="themer-panel"
        onClick={() => setOpen((o) => !o)}
      >
        <Icon name={open ? 'close' : 'palette'} size={18} />
        <span>
          {current.label}
          <span className="themer__toggle-name"> – {current.name}</span>
        </span>
      </button>
    </div>
  );
}
