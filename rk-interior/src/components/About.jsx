import { ABOUT, BUSINESS, INSTAGRAM, PHOTOS } from '../data.js';
import { InstagramIcon, MailIcon, PhoneIcon, UserIcon } from './Icons.jsx';

export default function About({ onOpenPhoto }) {
  return (
    <section className="section" id="about">
      <div className="container about">
        <button className="photo about__photo" onClick={() => onOpenPhoto(PHOTOS.lounge.src)}>
          <img src={PHOTOS.lounge.src} alt={PHOTOS.lounge.alt} loading="lazy" />
        </button>

        <div className="about__text">
          <h2 className="tag">About us</h2>
          <p className="about__lead">{ABOUT}</p>

          <div className="owner">
            <div className="owner__row">
              <span className="owner__icon">
                <UserIcon width={24} height={24} />
              </span>
              <div>
                <strong>{BUSINESS.owner.name}</strong>
                <span>{BUSINESS.owner.role}</span>
              </div>
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
