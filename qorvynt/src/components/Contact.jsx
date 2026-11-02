import { useState } from 'react';
import { BUDGETS, CONTACT, FORM_ENDPOINT, PLATFORMS, PROJECT_TYPES, whatsappLink } from '../data.js';
import Icon from './Icons.jsx';
import ContactDetails from './ContactDetails.jsx';

const EMPTY = { name: '', email: '', company: '', projectType: '', platform: '', budget: '', details: '', website: '' };
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

function validate(f) {
  const errors = {};
  if (f.name.trim().length < 2) errors.name = 'Please enter your full name.';
  if (!f.email.trim()) errors.email = 'Please enter your business email.';
  else if (!EMAIL_RE.test(f.email.trim())) errors.email = 'Please enter a valid email address, e.g. name@company.com.';
  if (!f.projectType) errors.projectType = 'Please choose a project type.';
  if (!f.platform) errors.platform = 'Please choose a target platform.';
  if (f.details.trim().length < 20) errors.details = 'Please describe your project in at least 20 characters.';
  return errors;
}

const inquiryText = (f) =>
  [
    'Hi QORVYNT, I have a project inquiry.',
    `Name: ${f.name.trim()}`,
    `Email: ${f.email.trim()}`,
    f.company.trim() && `Company: ${f.company.trim()}`,
    `Project type: ${f.projectType}`,
    `Platform: ${f.platform}`,
    f.budget && `Budget: ${f.budget}`,
    `Details: ${f.details.trim()}`,
  ]
    .filter(Boolean)
    .join('\n');

// status: idle | sending | sent | failed | whatsapp
export default function Contact() {
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle');

  const set = (k) => (e) => {
    const value = e.target.value;
    setForm((f) => ({ ...f, [k]: value }));
    if (errors[k]) setErrors((errs) => ({ ...errs, [k]: undefined }));
    if (status !== 'sending') setStatus('idle');
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = validate(form);
    setErrors(errs);
    const firstInvalid = Object.keys(errs)[0];
    if (firstInvalid) {
      document.getElementById(`f-${firstInvalid}`)?.focus();
      return;
    }
    // Hidden "website" field is a spam trap: real visitors never fill it in.
    if (form.website) return;

    // No backend: open WhatsApp with the inquiry filled in; the visitor taps Send there.
    if (!FORM_ENDPOINT) {
      window.open(whatsappLink(inquiryText(form)), '_blank', 'noopener');
      setStatus('whatsapp');
      return;
    }
    setStatus('sending');
    try {
      const { website, ...payload } = form;
      const res = await fetch(FORM_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setStatus('sent');
      setForm(EMPTY);
    } catch {
      setStatus('failed');
    }
  };

  const mailtoLink = CONTACT.email
    ? `mailto:${CONTACT.email}?subject=${encodeURIComponent(`Project inquiry - ${form.platform || 'General'}`)}&body=${encodeURIComponent(
        inquiryText(form),
      )}`
    : '';

  const field = (k) => ({
    id: `f-${k}`,
    name: k,
    value: form[k],
    onChange: set(k),
    'aria-invalid': errors[k] ? true : undefined,
    'aria-describedby': errors[k] ? `e-${k}` : undefined,
  });
  const error = (k) =>
    errors[k] && (
      <span className="field__error" id={`e-${k}`}>
        {errors[k]}
      </span>
    );

  return (
    <section className="page page--contact">
      <div className="container contact">
        <div className="contact__intro">
          <p className="eyebrow">Contact</p>
          <h1 className="page-head__title">Let’s Build Something Meaningful.</h1>
          <p className="page-head__intro">
            Tell us about your website, software, mobile app or AI idea. We will review your requirements and get back
            to you to discuss the right approach - no obligation.
          </p>
          <ContactDetails className="contact__details" />
        </div>

        <form className="form" onSubmit={submit} noValidate aria-label="Project inquiry">
          <div className="form__row">
            <label className="field" htmlFor="f-name">
              <span className="field__label">Full Name *</span>
              <input {...field('name')} autoComplete="name" required />
              {error('name')}
            </label>
            <label className="field" htmlFor="f-email">
              <span className="field__label">Business Email *</span>
              <input {...field('email')} type="email" autoComplete="email" inputMode="email" required />
              {error('email')}
            </label>
          </div>
          <div className="form__row">
            <label className="field" htmlFor="f-company">
              <span className="field__label">
                Company Name <span className="field__opt">(optional)</span>
              </span>
              <input {...field('company')} autoComplete="organization" />
            </label>
            <label className="field" htmlFor="f-projectType">
              <span className="field__label">Project Type *</span>
              <select {...field('projectType')} required>
                <option value="">Select project type</option>
                {PROJECT_TYPES.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
              {error('projectType')}
            </label>
          </div>
          <div className="form__row">
            <label className="field" htmlFor="f-platform">
              <span className="field__label">Target Platform *</span>
              <select {...field('platform')} required>
                <option value="">Select platform</option>
                {PLATFORMS.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
              {error('platform')}
            </label>
            <label className="field" htmlFor="f-budget">
              <span className="field__label">
                Budget Range <span className="field__opt">(optional)</span>
              </span>
              <select {...field('budget')}>
                <option value="">Select budget</option>
                {BUDGETS.map((b) => (
                  <option key={b}>{b}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="field" htmlFor="f-details">
            <span className="field__label">Project Description *</span>
            <textarea
              {...field('details')}
              rows="3"
              placeholder="What do you want to build or improve? Key features, users, timelines or existing systems."
              required
            />
            {error('details')}
          </label>
          <label className="hp" aria-hidden="true">
            Website
            <input name="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={set('website')} />
          </label>

          <div className="form__footer">
            <button className="btn btn--primary btn--lg" type="submit" disabled={status === 'sending'}>
              {!FORM_ENDPOINT && <Icon name="whatsapp" size={20} />}
              {status === 'sending' ? 'Sending…' : 'Send Inquiry'}
              {FORM_ENDPOINT && <Icon name="arrow" size={18} />}
            </button>
            <p className="form__required">
              {!FORM_ENDPOINT && 'Opens WhatsApp with your details filled in. '}* Required fields
            </p>
          </div>

          <div className="form__status" role="status" aria-live="polite">
            {Object.keys(errors).some((k) => errors[k]) && (
              <p className="alert alert--error">Please fix the highlighted fields and try again.</p>
            )}
            {status === 'sent' && (
              <p className="alert alert--success">Thank you - your inquiry has been sent. We will be in touch soon.</p>
            )}
            {status === 'failed' && (
              <p className="alert alert--error">
                Sorry, your inquiry could not be sent right now. Please try again later
                {CONTACT.email ? <> or email us at <a href={mailtoLink}>{CONTACT.email}</a></> : null}.
              </p>
            )}
            {status === 'whatsapp' && (
              <p className="alert alert--info">
                WhatsApp has opened with your inquiry - tap <strong>Send</strong> there to deliver it. Didn’t open?{' '}
                <a href={whatsappLink(inquiryText(form))} target="_blank" rel="noreferrer">
                  Open WhatsApp
                </a>
                {CONTACT.email && (
                  <>
                    {' '}
                    or <a href={mailtoLink}>send it by email</a>
                  </>
                )}
                .
              </p>
            )}
          </div>
        </form>
      </div>
    </section>
  );
}
