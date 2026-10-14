import { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LogIn } from 'lucide-react';
import { useAuth } from '../auth';
import { ErrorBox } from '../components/ui';

export default function LoginPage() {
  const { admin, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [loginId, setLoginId] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [fields, setFields] = useState({});
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  if (admin) return <Navigate to={location.state?.from?.pathname || '/dashboard'} replace />;

  const submit = async (e) => {
    e.preventDefault();
    const missing = {};
    if (!loginId.trim()) missing.login_identifier = 'Enter your login ID.';
    if (!password) missing.password = 'Enter your password.';
    setFields(missing);
    setError(null);
    if (Object.keys(missing).length) return;

    setBusy(true);
    try {
      await login(loginId.trim(), password);
      navigate(location.state?.from?.pathname || '/dashboard', { replace: true });
    } catch (err) {
      setError(err);
      setFields(err.fields || {});
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-overlay" />
      <main className="login-card">
        <div className="login-brand">
          <span className="brand-mark brand-mark-lg" aria-hidden="true" />
          <h1>Sri Saravana Interlock Bricks Manufacturing</h1>
          <p>Billing &amp; production records</p>
        </div>
        <form onSubmit={submit} noValidate>
          <ErrorBox error={error} />
          <div className={`field ${fields.login_identifier ? 'has-error' : ''}`}>
            <label htmlFor="login-id">Login ID (phone or email)</label>
            <input
              id="login-id" autoComplete="username" value={loginId} autoFocus
              onChange={(e) => setLoginId(e.target.value)}
              aria-invalid={fields.login_identifier ? 'true' : undefined}
              aria-describedby={fields.login_identifier ? 'login-id-err' : undefined}
            />
            {fields.login_identifier && <small id="login-id-err" className="field-error">{fields.login_identifier}</small>}
          </div>
          <div className={`field ${fields.password ? 'has-error' : ''}`}>
            <label htmlFor="login-pw">Password</label>
            <div className="input-with-button">
              <input
                id="login-pw" type={show ? 'text' : 'password'} autoComplete="current-password"
                value={password} onChange={(e) => setPassword(e.target.value)}
                aria-invalid={fields.password ? 'true' : undefined}
                aria-describedby={fields.password ? 'login-pw-err' : undefined}
              />
              <button type="button" className="icon-btn" onClick={() => setShow((s) => !s)}
                aria-label={show ? 'Hide password' : 'Show password'} aria-pressed={show}>
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {fields.password && <small id="login-pw-err" className="field-error">{fields.password}</small>}
          </div>
          <button type="submit" className="btn btn-primary btn-block" disabled={busy}>
            <LogIn size={18} aria-hidden="true" /> {busy ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <p className="login-foot">Rattaivaikkal, Salangapalayam, Kavindapadi, Erode, Tamil Nadu</p>
      </main>
    </div>
  );
}
