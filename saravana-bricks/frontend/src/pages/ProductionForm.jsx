import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { api } from '../api';
import { useBusiness } from '../business';
import { useInitialDate } from '../components/PeriodFilter';
import { ErrorBox, Field, Loading, useFormState, useLoader } from '../components/ui';
import { formatCount, formatINR } from '../utils/format';
import { purchaseSubtotalFromQty } from '../utils/money';

const EMPTY = { production_date: '', brick_type: '', quantity_produced: '', labour_rate: '', shift_note: '', notes: '' };

export default function ProductionForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const initialDate = useInitialDate();
  const { form, setForm, set, errors, setErrors } = useFormState({ ...EMPTY, production_date: initialDate });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const existing = useLoader(() => (id ? api.get(`/production/${id}`) : Promise.resolve(null)), [id]);
  const types = useLoader(() => api.get('/production/brick-types'), []);
  const { business } = useBusiness();

  // New entries start from the Admin Profile rate; edits keep the entry's own rate.
  useEffect(() => {
    if (!id && business && form.labour_rate === '') set('labour_rate', business.labour_rate_per_brick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, business]);

  useEffect(() => {
    if (existing.data) {
      const e = existing.data;
      setForm({
        production_date: e.production_date, brick_type: e.brick_type || '',
        quantity_produced: String(e.quantity_produced), labour_rate: e.labour_rate,
        shift_note: e.shift_note || '', notes: e.notes || '',
      });
    }
  }, [existing.data, setForm]);

  const submit = async (e) => {
    e.preventDefault();
    if (saving) return;
    const local = {};
    if (!form.production_date) local.production_date = 'Production date is required.';
    if (!/^\d+$/.test(form.quantity_produced.trim()) || Number(form.quantity_produced) <= 0) {
      local.quantity_produced = 'Enter a whole number greater than zero, e.g. 500.';
    }
    if (form.labour_rate === '' || purchaseSubtotalFromQty('1', form.labour_rate) === null) {
      local.labour_rate = 'Enter the team rate per brick, e.g. 1.00.';
    }
    if (Object.keys(local).length) {
      setErrors(local);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (id) await api.put(`/production/${id}`, form);
      else await api.post('/production', form);
      navigate('/manufacturing');
    } catch (err) {
      setError(err);
      setErrors(err.fields || {});
    } finally {
      setSaving(false);
    }
  };

  if (id && existing.loading) return <Loading />;
  if (id && existing.error) return <div className="page"><ErrorBox error={existing.error} onRetry={existing.reload} /></div>;
  const f = { form, onChange: set, errors };
  const teamAmount = /^\d+$/.test(form.quantity_produced.trim())
    ? purchaseSubtotalFromQty(form.quantity_produced.trim(), form.labour_rate) : null;

  return (
    <div className="page page-narrow">
      <div className="page-head">
        <div>
          <Link to="/manufacturing" className="link back"><ArrowLeft size={16} aria-hidden="true" /> Manufacturing</Link>
          <h1>{id ? 'Edit production entry' : 'Add production'}</h1>
        </div>
      </div>
      <form className="card" onSubmit={submit} noValidate>
        <ErrorBox error={error} />
        <div className="form-grid">
          <Field label="Production date" name="production_date" type="date" required {...f} />
          <Field label="Quantity produced (bricks)" name="quantity_produced" inputMode="numeric" required
            placeholder="e.g. 500" {...f}
            hint={id ? undefined : 'If this date already has entries, this quantity is added to them.'} />
          <Field label="Brick type / size" name="brick_type" list="brick-types" hint="Optional - if you make more than one type." {...f} />
          <datalist id="brick-types">
            {(types.data?.brick_types || []).map((t) => <option key={t} value={t} />)}
          </datalist>
          <Field label="Employee / team / shift" name="shift_note" {...f} />
          <Field label="Team rate per brick (₹)" name="labour_rate" inputMode="decimal" required {...f}
            hint="Labour pay per brick. Default comes from Admin Profile." />
          <div className="field">
            <span className="label-like">Team amount</span>
            <output className="output">{teamAmount ? formatINR(teamAmount) : '—'}</output>
            <small className="hint">{teamAmount ? `${formatCount(form.quantity_produced)} bricks × ${formatINR(form.labour_rate)}` : 'Bricks × team rate'}</small>
          </div>
        </div>
        <Field label="Notes" name="notes" as="textarea" {...f} />
        <div className="form-actions">
          <Link to="/manufacturing" className="btn btn-ghost">Cancel</Link>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            <Save size={18} aria-hidden="true" /> {saving ? 'Saving…' : 'Save production'}
          </button>
        </div>
      </form>
    </div>
  );
}
