import { ABOUT, BUSINESS, INSTAGRAM } from '../data.js';
import { InstagramIcon, MailIcon, PhoneIcon } from './Icons.jsx';

export default function About() {
  return (
    <section className="section" id="about">
      <div className="container about">
        <figure className="about__portrait">
          <img src={BUSINESS.owner.photo} alt={`${BUSINESS.owner.name}, ${BUSINESS.owner.role}`} />
        </figure>

        <div className="about__text">
          <h2 className="tag">About us</h2>
          <p className="about__lead">{ABOUT}</p>

          <div className="owner">
            <div className="owner__head">
              <strong>{BUSINESS.owner.name}</strong>
              <span>{BUSINESS.owner.role}</span>
            </div>
            <a className="owner__row" href={`tel:${BUSINESS.phones[0].tel}`}>
              <span className="owner__icon">
                <PhoneIcon width={22} height={22} />
              </span>
              <div>
                <span>Mobile</span>
                <strong>{BUSINESS.phones[0].display}</strong>
              </div>
            </a>
            <a className="owner__row" href={`mailto:${BUSINESS.email}`}>
              <span className="owner__icon">
                <MailIcon width={22} height={22} />
              </span>
              <div>
                <span>Email</span>
                <strong>{BUSINESS.email}</strong>
              </div>
            </a>
            <a className="owner__row" href={INSTAGRAM.url} target="_blank" rel="noreferrer">
              <span className="owner__icon">
                <InstagramIcon width={22} height={22} />
              </span>
              <div>
                <span>Instagram</span>
                <strong>@{INSTAGRAM.handle}</strong>
              </div>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
