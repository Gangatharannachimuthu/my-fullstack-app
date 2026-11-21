import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { api } from '../api';
import { useInitialDate } from '../components/PeriodFilter';
import { ErrorBox, Field, Loading, useFormState, useLoader } from '../components/ui';

const EMPTY = {
  order_date: '', customer_name: '', customer_phone: '', customer_address: '', delivery_address: '',
  brick_type: '', booked_quantity: '', notes: '',
};

/** Create or edit an order: the customer and how many bricks they booked. */
export default function OrderForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const initialDate = useInitialDate();
  const { form, setForm, set, errors, setErrors } = useFormState({ ...EMPTY, order_date: initialDate });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const existing = useLoader(() => (id ? api.get(`/bookings/${id}`) : Promise.resolve(null)), [id]);

  useEffect(() => {
    const b = existing.data;
    if (!b) return;
    setForm(Object.fromEntries(Object.keys(EMPTY).map((k) => [k, b[k] == null ? '' : String(b[k])])));
  }, [existing.data, setForm]);

  const submit = async (e) => {
    e.preventDefault();
    if (saving) return;
    const local = {};
    if (!form.order_date) local.order_date = 'Order date is required.';
    if (!form.customer_name.trim()) local.customer_name = 'Customer name is required.';
    if (!form.customer_phone.trim()) local.customer_phone = 'Customer phone is required.';
    if (!form.customer_address.trim()) local.customer_address = 'Customer address is required.';
    if (!/^\d+$/.test(form.booked_quantity.trim()) || Number(form.booked_quantity) <= 0) {
      local.booked_quantity = 'Enter a whole number of bricks greater than zero.';
    }
    if (Object.keys(local).length) {
      setErrors(local);
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const saved = id ? await api.put(`/bookings/${id}`, form) : await api.post('/bookings', form);
      navigate(`/orders/${saved.id}`, { replace: !id });
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

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <Link to={id ? `/orders/${id}` : '/orders'} className="link back"><ArrowLeft size={16} aria-hidden="true" /> {id ? `Order #${id}` : 'Orders'}</Link>
          <h1>{id ? `Edit order #${id}` : 'Create order'}</h1>
          <p className="muted">
            {id ? 'Customer changes are copied to this order’s invoices, except cancelled ones.' : 'After saving, open the order to create its invoices.'}
          </p>
        </div>
      </div>

      <form className="form-narrow" onSubmit={submit} noValidate>
        <ErrorBox error={error} />
        <fieldset className="card">
          <legend>Customer</legend>
          <div className="form-grid">
            <Field label="Customer name" name="customer_name" required autoComplete="off" {...f} />
            <Field label="Customer phone" name="customer_phone" type="tel" inputMode="tel" required {...f} />
            <Field label="Customer address" name="customer_address" as="textarea" required {...f} className="span-2" />
            <Field label="Delivery address" name="delivery_address" as="textarea" hint="Only if different from the customer address." {...f} className="span-2" />
          </div>
        </fieldset>

        <fieldset className="card">
          <legend>Order</legend>
          <div className="form-grid">
            <Field label="Order date" name="order_date" type="date" required {...f} />
            <Field label="Bricks booked" name="booked_quantity" inputMode="numeric" required
              hint="Total for the whole order. Each invoice delivers part of it." {...f} />
            <Field label="Brick type / size" name="brick_type" placeholder="e.g. Zig-zag 80mm"
              hint="Pre-filled on each new invoice." {...f} />
          </div>
          <Field label="Notes" name="notes" as="textarea" {...f} />
        </fieldset>

        <button type="submit" className="btn btn-primary" disabled={saving}>
          <Save size={18} aria-hidden="true" /> {saving ? 'Saving…' : id ? 'Save changes' : 'Create order'}
        </button>
      </form>
    </div>
  );
}
