import { useState } from 'react';
import { BUSINESS, SPACES, mapEmbedUrl, mapLink, whatsappLink } from '../data.js';
import { PhoneIcon, PinIcon, WhatsAppIcon } from './Icons.jsx';

const WORK_TYPES = ['Full home interior', 'Commercial / office interior', ...SPACES.map((s) => s.title), 'Other'];

// Kept compact so the Contact page and its footer fit one desktop screen; the footer
// already lists email, Instagram and address, so they are not repeated here.
export default function Contact() {
  const [form, setForm] = useState({ name: '', phone: '', work: '', location: '', message: '' });
  const [error, setError] = useState('');
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  // There is no server: the enquiry opens WhatsApp with the details filled in.
  const submit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.phone.trim()) {
      setError('Please enter your name and phone number.');
      return;
    }
    setError('');
    const lines = [
      `Hi ${BUSINESS.name}, I have an enquiry.`,
      `Name: ${form.name.trim()}`,
      `Phone: ${form.phone.trim()}`,
      form.work && `Work: ${form.work}`,
      form.location.trim() && `Site location: ${form.location.trim()}`,
      form.message.trim() && `Details: ${form.message.trim()}`,
    ].filter(Boolean);
    window.open(whatsappLink(lines.join('\n')), '_blank', 'noopener');
  };

  return (
    <section className="section section--compact" id="contact">
      <div className="container">
        <div className="section__head section__head--compact">
          <p className="eyebrow">Contact</p>
          <h2>Let's design your dream space</h2>
        </div>

        <div className="contact">
          <div className="contact__info">
            <div className="contact__actions">
              <a className="btn btn--orange" href={`tel:${BUSINESS.phones[0].tel}`}>
                <PhoneIcon /> Call {BUSINESS.phones[0].display}
              </a>
              <a className="btn btn--whatsapp" href={whatsappLink()} target="_blank" rel="noreferrer">
                <WhatsAppIcon /> WhatsApp
              </a>
              <a className="btn btn--outline" href={mapLink} target="_blank" rel="noreferrer">
                <PinIcon /> Directions
              </a>
            </div>
            <div className="map">
              <iframe
                title={`${BUSINESS.name} location map`}
                src={mapEmbedUrl}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            </div>
          </div>

          <form className="form" onSubmit={submit} noValidate>
            <div className="form__title">
              <h3>Request a quote</h3>
              <p className="form__note">Opens in WhatsApp, ready to send.</p>
            </div>
            <div className="form__row">
              <label>
                Name *
                <input value={form.name} onChange={set('name')} autoComplete="name" />
              </label>
              <label>
                Phone *
                <input value={form.phone} onChange={set('phone')} type="tel" inputMode="tel" autoComplete="tel" />
              </label>
            </div>
            <div className="form__row">
              <label>
                Type of work
                <select value={form.work} onChange={set('work')}>
                  <option value="">Select</option>
                  {WORK_TYPES.map((w) => (
                    <option key={w}>{w}</option>
                  ))}
                </select>
              </label>
              <label>
                Site location
                <input value={form.location} onChange={set('location')} placeholder="Area / town" />
              </label>
            </div>
            <label>
              Details
              <textarea
                rows="2"
                value={form.message}
                onChange={set('message')}
                placeholder="e.g. New 2 BHK, need kitchen, 2 wardrobes and hall false ceiling"
              />
            </label>
            {error && (
              <p className="form__error" role="alert">
                {error}
              </p>
            )}
            <button className="btn btn--orange" type="submit">
              <WhatsAppIcon /> Send enquiry
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
