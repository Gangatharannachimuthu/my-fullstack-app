import { useEffect, useState } from 'react';
import { Eye, EyeOff, KeyRound, Save, Trash2, Upload } from 'lucide-react';
import { api } from '../api';
import { useAuth } from '../auth';
import { useBusiness } from '../business';
import { ErrorBox, Field, Loading, useFormState, useLoader } from '../components/ui';

const MAX_LOGO = 300 * 1024;

function ProfileForm({ data, onSaved }) {
  const { form, set, errors, setErrors } = useFormState({
    display_name: data.admin.display_name || '',
    login_identifier: data.admin.login_identifier || '',
    admin_phone: data.admin.phone || '',
    business_name: data.business.business_name || '',
    address: data.business.address || '',
    phone: data.business.phone || '',
    email: data.business.email || '',
    gstin: data.business.gstin || '',
    invoice_terms: data.business.invoice_terms || '',
    payment_tracking_enabled: data.business.payment_tracking_enabled,
    labour_rate_per_brick: data.business.labour_rate_per_brick || '1.00',
    logo_data: data.business.logo_data || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  const pickLogo = (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/webp'].includes(file.type)) {
      setErrors((x) => ({ ...x, logo_data: 'Logo must be a PNG, JPEG or WebP image.' }));
      return;
    }
    if (file.size > MAX_LOGO) {
      setErrors((x) => ({ ...x, logo_data: 'Logo must be smaller than 300 KB.' }));
      return;
    }
    const reader = new FileReader();
    reader.onload = () => set('logo_data', reader.result);
    reader.readAsDataURL(file);
  };

  const submit = async (e) => {
    e.preventDefault();
    if (saving) return;
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await api.put('/profile', form);
      onSaved(res);
      setSaved(true);
    } catch (err) {
      setError(err);
      setErrors(err.fields || {});
    } finally {
      setSaving(false);
    }
  };

  const f = { form, onChange: set, errors };
  return (
    <form className="card" onSubmit={submit} noValidate>
      <h2>Admin &amp; business details</h2>
      <ErrorBox error={error} />
      {saved && <div className="alert alert-success" role="status">Profile saved.</div>}

      <h3 className="subhead">Admin</h3>
      <div className="form-grid">
        <Field label="Display name" name="display_name" required {...f} />
        <Field label="Login ID (phone or email)" name="login_identifier" required autoComplete="username"
          hint="You will use this to sign in." {...f} />
        <Field label="Admin phone" name="admin_phone" type="tel" {...f} />
      </div>

      <h3 className="subhead">Business (printed on invoices)</h3>
      <div className="form-grid">
        <Field label="Business name" name="business_name" required {...f} className="span-2" />
        <Field label="Address" name="address" as="textarea" required {...f} className="span-2"
          hint="Please confirm spelling and add the postal code." />
        <Field label="Business phone" name="phone" type="tel" placeholder="Not set" hint="Printed only if filled in." {...f} />
        <Field label="Business email" name="email" type="email" placeholder="Not set" hint="Printed only if filled in." {...f} />
        <Field label="GSTIN" name="gstin" placeholder="Not set" maxLength={15}
          hint="Only if the business is GST-registered. Leave blank otherwise." {...f} />
      </div>
      <Field label="Invoice footer / terms" name="invoice_terms" as="textarea"
        placeholder="e.g. Goods once sold will not be taken back." {...f} />

      <div className={`field ${errors.logo_data ? 'has-error' : ''}`}>
        <span className="label-like">Logo (optional)</span>
        <div className="logo-row">
          {form.logo_data ? <img src={form.logo_data} alt="Current logo" className="logo-preview" /> : <span className="muted">No logo</span>}
          <label className="btn btn-ghost btn-small file-btn">
            <Upload size={15} aria-hidden="true" /> Choose image
            <input type="file" accept="image/png,image/jpeg,image/webp" onChange={pickLogo} className="sr-only" />
          </label>
          {form.logo_data && (
            <button type="button" className="btn btn-ghost btn-small danger-text" onClick={() => set('logo_data', '')}>
              <Trash2 size={15} aria-hidden="true" /> Remove
            </button>
          )}
        </div>
        <small className="hint">PNG, JPEG or WebP, under 300 KB.</small>
        {errors.logo_data && <small className="field-error">{errors.logo_data}</small>}
      </div>

      <h3 className="subhead">Manufacturing</h3>
      <div className="form-grid">
        <Field label="Team rate per brick (₹)" name="labour_rate_per_brick" inputMode="decimal" required {...f}
          hint="Labour pay per brick produced (e.g. 1.00 → 1,000 bricks = ₹1,000). Used for new entries; past entries keep their rate." />
      </div>

      <label className="check">
        <input type="checkbox" checked={!!form.payment_tracking_enabled}
          onChange={(e) => set('payment_tracking_enabled', e.target.checked)} />
        Track payments (amount paid, balance due, payment status) on orders
      </label>

      <div className="form-actions">
        <button type="submit" className="btn btn-primary" disabled={saving}>
          <Save size={18} aria-hidden="true" /> {saving ? 'Saving…' : 'Save profile'}
        </button>
      </div>
    </form>
  );
}

function PasswordForm() {
  const { form, setForm, set, errors, setErrors } = useFormState({ current_password: '', new_password: '', confirm_password: '' });
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [done, setDone] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (saving) return;
    const local = {};
    if (!form.current_password) local.current_password = 'Enter your current password.';
    if (form.new_password.length < 8) local.new_password = 'New password must be at least 8 characters.';
    if (form.new_password !== form.confirm_password) local.confirm_password = 'Passwords do not match.';
    if (Object.keys(local).length) {
      setErrors(local);
      return;
    }
    setSaving(true);
    setError(null);
    setDone(false);
    try {
      await api.post('/profile/password', form);
      setForm({ current_password: '', new_password: '', confirm_password: '' });
      setDone(true);
    } catch (err) {
      setError(err);
      setErrors(err.fields || {});
    } finally {
      setSaving(false);
    }
  };

  const type = show ? 'text' : 'password';
  const f = { form, onChange: set, errors };
  return (
    <form className="card" onSubmit={submit} noValidate>
      <h2>Change password</h2>
      <ErrorBox error={error} />
      {done && <div className="alert alert-success" role="status">Password changed. Other devices have been signed out.</div>}
      <div className="form-grid">
        <Field label="Current password" name="current_password" type={type} autoComplete="current-password" required {...f} />
        <Field label="New password" name="new_password" type={type} autoComplete="new-password" required hint="At least 8 characters." {...f} />
        <Field label="Confirm new password" name="confirm_password" type={type} autoComplete="new-password" required {...f} />
      </div>
      <div className="form-actions">
        <button type="button" className="btn btn-ghost" onClick={() => setShow((s) => !s)} aria-pressed={show}>
          {show ? <EyeOff size={18} aria-hidden="true" /> : <Eye size={18} aria-hidden="true" />} {show ? 'Hide' : 'Show'} passwords
        </button>
        <button type="submit" className="btn btn-primary" disabled={saving}>
          <KeyRound size={18} aria-hidden="true" /> {saving ? 'Saving…' : 'Change password'}
        </button>
      </div>
    </form>
  );
}

export default function AdminProfile() {
  const { setAdmin } = useAuth();
  const { setBusiness } = useBusiness();
  const profile = useLoader(() => api.get('/profile'), []);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    if (profile.data) setVersion((v) => v + 1);
  }, [profile.data]);

  return (
    <div className="page page-narrow">
      <div className="page-head">
        <div>
          <h1>Admin Profile</h1>
          <p className="muted">Your login and the business details printed on invoices.</p>
        </div>
      </div>
      <ErrorBox error={profile.error} onRetry={profile.reload} />
      {profile.loading && !profile.data && <Loading />}
      {profile.data && (
        <ProfileForm
          key={version}
          data={profile.data}
          onSaved={(res) => {
            setAdmin(res.admin);
            setBusiness(res.business);
          }}
        />
      )}
      <PasswordForm />
    </div>
  );
}
