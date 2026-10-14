import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, ChevronLeft, ChevronRight, Inbox, Loader2 } from 'lucide-react';

export function Loading({ label = 'Loading…' }) {
  return (
    <div className="state" role="status">
      <Loader2 className="spin" size={22} aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function ErrorBox({ error, onRetry }) {
  if (!error) return null;
  return (
    <div className="alert alert-error" role="alert">
      <AlertTriangle size={18} aria-hidden="true" />
      <span>{typeof error === 'string' ? error : error.message}</span>
      {onRetry && (
        <button type="button" className="btn btn-small btn-ghost" onClick={onRetry}>Try again</button>
      )}
    </div>
  );
}

export function Empty({ title, children }) {
  return (
    <div className="state state-empty">
      <Inbox size={28} aria-hidden="true" />
      <strong>{title}</strong>
      {children && <span>{children}</span>}
    </div>
  );
}

/**
 * One labelled form control. `as` picks input/select/textarea; errors are tied
 * to the control with aria-describedby so screen readers announce them.
 */
export function Field({
  label, name, form, onChange, errors = {}, required, hint, as = 'input', options, className = '', idPrefix = 'f', ...rest
}) {
  const id = `${idPrefix}-${name}`;
  const error = errors[name];
  const describedBy = [error && `${id}-err`, hint && `${id}-hint`].filter(Boolean).join(' ') || undefined;
  const common = {
    id,
    name,
    value: form[name] ?? '',
    onChange: (e) => onChange(name, e.target.value),
    'aria-invalid': error ? 'true' : undefined,
    'aria-describedby': describedBy,
    required,
    ...rest,
  };
  let control;
  if (as === 'select') {
    control = (
      <select {...common}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    );
  } else if (as === 'textarea') {
    control = <textarea rows={3} {...common} />;
  } else {
    control = <input {...common} />;
  }
  return (
    <div className={`field ${error ? 'has-error' : ''} ${className}`}>
      <label htmlFor={id}>
        {label}
        {required && <span className="req" aria-hidden="true"> *</span>}
      </label>
      {control}
      {hint && <small id={`${id}-hint`} className="hint">{hint}</small>}
      {error && <small id={`${id}-err`} className="field-error">{error}</small>}
    </div>
  );
}

export function useFormState(initial) {
  const [form, setForm] = useState(initial);
  const [errors, setErrors] = useState({});
  const set = (name, value) => {
    setForm((f) => ({ ...f, [name]: value }));
    setErrors((e) => (e[name] ? { ...e, [name]: undefined } : e));
  };
  return { form, setForm, set, errors, setErrors };
}

/** Accessible confirm dialog built on <dialog>, optionally collecting a reason. */
export function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', danger, withReason, onConfirm, onClose }) {
  const ref = useRef(null);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const dlg = ref.current;
    if (!dlg) return;
    if (open && !dlg.open) {
      setReason('');
      setError(null);
      dlg.showModal();
    } else if (!open && dlg.open) {
      dlg.close();
    }
  }, [open]);

  const confirm = async () => {
    setBusy(true);
    setError(null);
    try {
      await onConfirm(reason);
      onClose();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <dialog ref={ref} className="dialog" onClose={onClose} aria-labelledby="dlg-title">
      <h2 id="dlg-title">{title}</h2>
      <p>{message}</p>
      {withReason && (
        <div className="field">
          <label htmlFor="dlg-reason">Reason (optional)</label>
          <input id="dlg-reason" value={reason} maxLength={255} onChange={(e) => setReason(e.target.value)} />
        </div>
      )}
      <ErrorBox error={error} />
      <div className="dialog-actions">
        <button type="button" className="btn btn-ghost" onClick={onClose} disabled={busy}>Go back</button>
        <button type="button" className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`} onClick={confirm} disabled={busy}>
          {busy ? 'Please wait…' : confirmLabel}
        </button>
      </div>
    </dialog>
  );
}

export function Pagination({ page, perPage, total, onPage }) {
  const pages = Math.max(1, Math.ceil(total / perPage));
  if (pages <= 1) return null;
  return (
    <nav className="pagination" aria-label="Pagination">
      <button type="button" className="btn btn-small btn-ghost" disabled={page <= 1} onClick={() => onPage(page - 1)}>
        <ChevronLeft size={16} aria-hidden="true" /> Previous
      </button>
      <span>Page {page} of {pages}</span>
      <button type="button" className="btn btn-small btn-ghost" disabled={page >= pages} onClick={() => onPage(page + 1)}>
        Next <ChevronRight size={16} aria-hidden="true" />
      </button>
    </nav>
  );
}

export function useDebounced(value, delay = 350) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/** Generic async loader with loading/error state and a reload function. */
export function useLoader(fn, deps) {
  const [state, setState] = useState({ data: null, loading: true, error: null });
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let alive = true;
    setState((s) => ({ ...s, loading: true, error: null }));
    fn()
      .then((data) => alive && setState({ data, loading: false, error: null }))
      .catch((error) => alive && setState((s) => ({ ...s, loading: false, error })));
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick]);
  return { ...state, reload: () => setTick((t) => t + 1) };
}

export function StatusBadge({ value }) {
  if (!value) return <span className="muted">—</span>;
  const tone = {
    Draft: 'neutral', Confirmed: 'info', Completed: 'success', Cancelled: 'danger',
    Unpaid: 'danger', 'Partially Paid': 'warning', Paid: 'success', Voided: 'danger',
  }[value] || 'neutral';
  return <span className={`badge badge-${tone}`}>{value}</span>;
}
