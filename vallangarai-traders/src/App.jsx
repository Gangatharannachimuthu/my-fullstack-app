import { useCallback, useState } from 'react';
import { CATEGORIES } from './data.js';
import Header from './components/Header.jsx';
import Hero from './components/Hero.jsx';
import Services from './components/Services.jsx';
import Products from './components/Products.jsx';
import { Gallery, Lightbox } from './components/Gallery.jsx';
import WhyUs from './components/WhyUs.jsx';
import Contact from './components/Contact.jsx';
import { FloatingWhatsApp, Footer } from './components/Footer.jsx';

// Every photo once, in category order - used by the gallery and the lightbox.
const ALL_PHOTOS = [...new Map(CATEGORIES.flatMap((c) => c.photos).map((p) => [p.src, p])).values()];

export default function App() {
  const [category, setCategory] = useState(CATEGORIES[0].id);
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
        <Services onSelect={setCategory} />
        <Products active={category} onSelect={setCategory} onOpenPhoto={openPhoto} />
        <WhyUs />
        <Gallery photos={ALL_PHOTOS} onOpen={openPhoto} />
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
