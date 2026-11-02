import Icon from './Icons.jsx';

// Icon card used by Services, Industries and Why Choose. `i` staggers the entry animation.
export default function Card({ icon, title, text, i = 0, as: Heading = 'h2', className = '' }) {
  return (
    <article className={`card rise ${className}`} style={{ '--i': i }}>
      <span className="card__icon">
        <Icon name={icon} />
      </span>
      <Heading className="card__title">{title}</Heading>
      {text && <p className="card__text">{text}</p>}
    </article>
  );
}
