import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { GALLERY_TABS, PHOTOS } from './data.js';
import Header from './components/Header.jsx';
import Hero from './components/Hero.jsx';
import About from './components/About.jsx';
import Services from './components/Services.jsx';
import Spaces from './components/Spaces.jsx';
import Process from './components/Process.jsx';
import { Gallery, Lightbox } from './components/Gallery.jsx';
import Reviews from './components/Reviews.jsx';
import Contact from './components/Contact.jsx';
import { FloatingWhatsApp, Footer } from './components/Footer.jsx';

// Every photo once (gallery first) - the lightbox can open any photo on the page.
const ALL_PHOTOS = [
  ...new Map(
    [...GALLERY_TABS.flatMap((t) => t.photos), ...Object.values(PHOTOS)].map((p) => [p.src, p]),
  ).values(),
];

// Each menu item is its own page, chosen by the URL hash (#about, #gallery, ...).
const pageFromHash = () => window.location.hash.slice(1);

export default function App() {
  const [page, setPage] = useState(pageFromHash);
  const [photoIndex, setPhotoIndex] = useState(null);

  useEffect(() => {
    const onHashChange = () => setPage(pageFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, [page]);

  const openPhoto = (src) => setPhotoIndex(ALL_PHOTOS.findIndex((p) => p.src === src));
  const closePhoto = useCallback(() => setPhotoIndex(null), []);
  const movePhoto = useCallback(
    (step) => setPhotoIndex((i) => (i + step + ALL_PHOTOS.length) % ALL_PHOTOS.length),
    [],
  );

  const pages = {
    about: <About />,
    services: (
      <>
        <Services />
        <Process />
      </>
    ),
    spaces: <Spaces onOpenPhoto={openPhoto} />,
    gallery: <Gallery tabs={GALLERY_TABS} onOpen={openPhoto} />,
    reviews: <Reviews />,
    contact: <Contact />,
  };

  return (
    <>
      <Header page={page} />
      <main className={page === 'contact' ? undefined : 'main--fill'}>
        {pages[page] || <Hero />}
      </main>
      {page === 'contact' && <Footer />}
      <FloatingWhatsApp />
      {photoIndex !== null && (
        <Lightbox photos={ALL_PHOTOS} index={photoIndex} onClose={closePhoto} onMove={movePhoto} />
      )}
    </>
  );
}
