import { useState } from 'react';
import { BUSINESS, INSTAGRAM, SPACES, mapEmbedUrl, mapLink, whatsappLink } from '../data.js';
import { InstagramIcon, MailIcon, PhoneIcon, PinIcon, WhatsAppIcon } from './Icons.jsx';

const WORK_TYPES = ['Full home interior', 'Commercial / office interior', ...SPACES.map((s) => s.title), 'Other'];

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
    <section className="section" id="contact">
      <div className="container">
        <div className="section__head">
          <p className="eyebrow">Contact</p>
          <h2>Let's design your dream space</h2>
        </div>

        <div className="contact">
          <div className="contact__info">
            <div className="contact__card">
              <h3>
                <PhoneIcon /> Call {BUSINESS.owner.name}
              </h3>
              {BUSINESS.phones.map((p) => (
                <a key={p.tel} className="contact__phone" href={`tel:${p.tel}`}>
                  {p.display}
                </a>
              ))}
              <a className="btn btn--whatsapp" href={whatsappLink()} target="_blank" rel="noreferrer">
                <WhatsAppIcon /> Chat on WhatsApp
              </a>
            </div>

            <div className="contact__card">
              <h3>
                <MailIcon /> Email &amp; Instagram
              </h3>
              <a className="link" href={`mailto:${BUSINESS.email}`}>
                {BUSINESS.email}
              </a>
              <a className="btn btn--instagram" href={INSTAGRAM.url} target="_blank" rel="noreferrer">
                <InstagramIcon /> Follow @{INSTAGRAM.handle}
              </a>
            </div>

            <div className="contact__card">
              <h3>
                <PinIcon /> Location
              </h3>
              <address>
                {BUSINESS.addressLines.map((l) => (
                  <span key={l}>{l}</span>
                ))}
              </address>
              <a className="link" href={mapLink} target="_blank" rel="noreferrer">
                Get directions on Google Maps →
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
            <h3>Request a quote</h3>
            <p className="form__note">Your enquiry opens in WhatsApp, ready to send.</p>
            <label>
              Name *
              <input value={form.name} onChange={set('name')} autoComplete="name" />
            </label>
            <label>
              Phone *
              <input value={form.phone} onChange={set('phone')} type="tel" inputMode="tel" autoComplete="tel" />
            </label>
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
            <label>
              Details
              <textarea
                rows="4"
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
            <button className="btn btn--orange btn--lg" type="submit">
              <WhatsAppIcon /> Send enquiry
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
