import { useCallback, useState } from 'react';
import { GALLERY, PHOTOS } from './data.js';
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
const ALL_PHOTOS = [...new Map([...GALLERY, ...Object.values(PHOTOS)].map((p) => [p.src, p])).values()];

export default function App() {
  const [photoIndex, setPhotoIndex] = useState(null);

  const openPhoto = (src) => setPhotoIndex(ALL_PHOTOS.findIndex((p) => p.src === src));
  const closePhoto = useCallback(() => setPhotoIndex(null), []);
  const movePhoto = useCallback(
    (step) => setPhotoIndex((i) => (i + step + ALL_PHOTOS.length) % ALL_PHOTOS.length),
    [],
  );

  return (
    <>
      <Header />
      <main>
        <Hero />
        <About onOpenPhoto={openPhoto} />
        <Services />
        <Spaces onOpenPhoto={openPhoto} />
        <Process />
        <Gallery photos={GALLERY} onOpen={openPhoto} />
        <Reviews />
        <Contact />
      </main>
      <Footer />
      <FloatingWhatsApp />
      {photoIndex !== null && (
        <Lightbox photos={ALL_PHOTOS} index={photoIndex} onClose={closePhoto} onMove={movePhoto} />
      )}
    </>
  );
}
