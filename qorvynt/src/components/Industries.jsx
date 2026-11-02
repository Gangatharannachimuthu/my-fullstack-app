import { INDUSTRIES } from '../data.js';
import PageHead from './PageHead.jsx';
import Card from './Card.jsx';

export default function Industries() {
  return (
    <section className="page">
      <div className="container">
        <PageHead
          center
          eyebrow="Industries We Serve"
          title="Technology for every kind of business"
          intro="These are industries we are ready to support. Every solution is shaped around the specific needs, rules and users of its sector."
        />
        <div className="grid grid--industries">
          {INDUSTRIES.map((ind, i) => (
            <Card key={ind.title} {...ind} i={i} className="card--industry" />
          ))}
        </div>
      </div>
    </section>
  );
}
