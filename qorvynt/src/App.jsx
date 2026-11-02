import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { PAGES, SHOW_THEME_SWITCHER } from './data.js';
import ThemeSwitcher from './components/ThemeSwitcher.jsx';
import Header from './components/Header.jsx';
import Hero from './components/Hero.jsx';
import About from './components/About.jsx';
import Services from './components/Services.jsx';
import Mobile from './components/Mobile.jsx';
import Industries from './components/Industries.jsx';
import Process from './components/Process.jsx';
import Portfolio from './components/Portfolio.jsx';
import Contact from './components/Contact.jsx';
import Footer from './components/Footer.jsx';
import { Privacy, Terms } from './components/Legal.jsx';

// Each menu item is its own page, chosen by the URL hash (#about, #services, ...).
const pageFromHash = () => {
  const id = window.location.hash.slice(1);
  return PAGES[id] ? id : 'home';
};

const PAGE_COMPONENTS = {
  home: Hero,
  about: About,
  services: Services,
  mobile: Mobile,
  industries: Industries,
  process: Process,
  work: Portfolio,
  contact: Contact,
  privacy: Privacy,
  terms: Terms,
};

export default function App() {
  const [page, setPage] = useState(pageFromHash);
  const mainRef = useRef(null);
  const firstRender = useRef(true);

  useEffect(() => {
    const onHashChange = () => setPage(pageFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
    const { title, description } = PAGES[page];
    document.title = title;
    document.querySelector('meta[name="description"]')?.setAttribute('content', description);
    // Move keyboard / screen-reader focus to the new page, but not on first load.
    if (firstRender.current) firstRender.current = false;
    else mainRef.current?.focus({ preventScroll: true });
  }, [page]);

  const Page = PAGE_COMPONENTS[page];
  const skipToContent = (e) => {
    e.preventDefault();
    mainRef.current?.focus();
  };

  return (
    <>
      <a className="skip-link" href="#main" onClick={skipToContent}>
        Skip to content
      </a>
      <Header page={page} />
      <main id="main" ref={mainRef} tabIndex={-1} className={`main main--${page}`}>
        <Page key={page} />
      </main>
      {page === 'contact' && <Footer />}
      {SHOW_THEME_SWITCHER && <ThemeSwitcher />}
    </>
  );
}
