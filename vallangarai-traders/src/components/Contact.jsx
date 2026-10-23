import { useState } from 'react';
import { BUSINESS, CATEGORIES, mapEmbedUrl, mapLink, whatsappLink } from '../data.js';
import { PhoneIcon, PinIcon, WhatsAppIcon } from './Icons.jsx';

export default function Contact() {
  const [form, setForm] = useState({ name: '', phone: '', service: '', message: '' });
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
      'Hi Vallangarai Traders, I have an enquiry.',
      `Name: ${form.name.trim()}`,
      `Phone: ${form.phone.trim()}`,
      form.service && `Service: ${form.service}`,
      form.message.trim() && `Details: ${form.message.trim()}`,
    ].filter(Boolean);
    window.open(whatsappLink(lines.join('\n')), '_blank', 'noopener');
  };

  return (
    <section className="section section--tint" id="contact">
      <div className="container">
        <div className="section__head">
          <p className="eyebrow">Contact</p>
          <h2>Visit our shop or send an enquiry</h2>
        </div>

        <div className="contact">
          <div className="contact__info">
            <div className="contact__card">
              <h3>
                <PhoneIcon /> Call us
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
                <PinIcon /> Shop address
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
                title="Vallangarai Traders location map"
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
              Service
              <select value={form.service} onChange={set('service')}>
                <option value="">Select a service</option>
                {CATEGORIES.map((c) => (
                  <option key={c.id}>{c.title}</option>
                ))}
                <option>Blinds</option>
                <option>Other</option>
              </select>
            </label>
            <label>
              Details
              <textarea
                rows="4"
                value={form.message}
                onChange={set('message')}
                placeholder="e.g. 2 sliding windows, approx 5 ft × 4 ft, Kodumudi"
              />
            </label>
            {error && (
              <p className="form__error" role="alert">
                {error}
              </p>
            )}
            <button className="btn btn--blue btn--lg" type="submit">
              <WhatsAppIcon /> Send enquiry
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
