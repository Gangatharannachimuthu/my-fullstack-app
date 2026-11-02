// Eyebrow + heading + optional intro used at the top of each page.
// Each page is its own view, so its main heading is the page's h1.
export default function PageHead({ eyebrow, title, intro, id, as: Heading = 'h1', center = false }) {
  return (
    <div className={`page-head${center ? ' page-head--center' : ''}`}>
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <Heading id={id} className="page-head__title">
        {title}
      </Heading>
      {intro && <p className="page-head__intro">{intro}</p>}
    </div>
  );
}
