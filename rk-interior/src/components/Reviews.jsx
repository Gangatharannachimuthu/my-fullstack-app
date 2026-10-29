import { useState } from 'react';
import { GOOGLE, REVIEWS, googleReviewLink } from '../data.js';
import { StarIcon } from './Icons.jsx';

const Stars = ({ value, size = 18 }) => (
  <span className="stars" aria-label={`${value} out of 5 stars`}>
    {[1, 2, 3, 4, 5].map((n) => (
      <StarIcon key={n} filled={n <= Math.round(value)} width={size} height={size} />
    ))}
  </span>
);

// Ratings are stored on Google: picking a star opens the Google review page.
function RatePicker() {
  const [hover, setHover] = useState(0);
  return (
    <div className="rate">
      <p className="rate__label">Worked with us? Tap a star to rate us on Google</p>
      <div className="rate__stars" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <a
            key={n}
            href={googleReviewLink}
            target="_blank"
            rel="noreferrer"
            aria-label={`Rate ${n} star${n > 1 ? 's' : ''} on Google`}
            onMouseEnter={() => setHover(n)}
            onFocus={() => setHover(n)}
          >
            <StarIcon filled={n <= hover} width={36} height={36} />
          </a>
        ))}
      </div>
      <a className="btn btn--orange" href={googleReviewLink} target="_blank" rel="noreferrer">
        Write a Google review
      </a>
    </div>
  );
}

export default function Reviews() {
  return (
    <section className="section section--tint" id="reviews">
      <div className="container">
        <div className="section__head">
          <p className="eyebrow">Client reviews</p>
          <h2>What our clients say</h2>
        </div>

        <div className="reviews">
          <div className="reviews__summary">
            {GOOGLE.rating ? (
              <>
                <strong className="reviews__score">{GOOGLE.rating.toFixed(1)}</strong>
                <Stars value={GOOGLE.rating} size={22} />
                <span className="reviews__count">
                  {GOOGLE.count} Google review{GOOGLE.count === 1 ? '' : 's'}
                </span>
              </>
            ) : (
              <>
                <strong className="reviews__first">Be the first to rate us</strong>
                <span className="reviews__count">Your feedback helps other families choose with confidence.</span>
              </>
            )}
            <RatePicker />
          </div>

          {REVIEWS.length > 0 && (
            <ul className="reviews__list">
              {REVIEWS.map((r) => (
                <li key={r.name + r.text} className="review">
                  <Stars value={r.stars} />
                  <p>“{r.text}”</p>
                  <span className="review__by">
                    <strong>{r.name}</strong>
                    {r.place && ` · ${r.place}`}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
