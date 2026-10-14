import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { api } from '../api';
import { useBusiness } from '../business';
import { useInitialDate } from '../components/PeriodFilter';
import { ErrorBox, Field, Loading, useFormState, useLoader } from '../components/ui';
import { formatINR } from '../utils/format';
import { previewOrder } from '../utils/money';
import { TAX_OPTIONS, TaxBreakdown } from './taxes';

const EMPTY = {
  order_date: '', order_status: 'Confirmed', delivery_date: '',
  customer_name: '', customer_phone: '', customer_address: '', delivery_address: '',
  brick_type: '', quantity: '', rate_per_brick: '',
  discount_amount: '', tax_type: 'none', gst_rate: '', additional_charges: '', amount_paid: '', notes: '',
};

const blankZero = (v) => (v && Number(v) !== 0 ? v : '');

function newRequestId() {
  return crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export default function OrderForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { business } = useBusiness();
  const tracking = business?.payment_tracking_enabled;
  const initialDate = useInitialDate();
  const { form, setForm, set, errors, setErrors } = useFormState({ ...EMPTY, order_date: initialDate });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  // One key per form visit: a double-click or a retry after a network drop
  // returns the same order instead of issuing a second invoice number.
  const requestId = useRef(newRequestId());
  const existing = useLoader(() => (id ? api.get(`/orders/${id}`) : Promise.resolve(null)), [id]);

  useEffect(() => {
    const o = existing.data;
    if (!o) return;
    setForm({
      ...EMPTY,
      ...Object.fromEntries(Object.keys(EMPTY).map((k) => [k, o[k] == null ? '' : String(o[k])])),
      discount_amount: blankZero(o.discount_amount),
      additional_charges: blankZero(o.additional_charges),
      amount_paid: blankZero(o.amount_paid),
      order_status: o.order_status === 'Cancelled' ? 'Confirmed' : o.order_status,
    });
  }, [existing.data, setForm]);

  const preview = previewOrder({
    quantity: form.quantity,
    rate: form.rate_per_brick,
    discount: form.discount_amount,
    taxType: form.tax_type,
    gstRate: form.gst_rate,
    additional: form.additional_charges,
    amountPaid: tracking ? form.amount_paid : '',
  });

  const submit = async (e) => {
    e.preventDefault();
    if (saving) return;
    const local = {};
    if (!form.order_date) local.order_date = 'Order date is required.';
    if (!form.customer_name.trim()) local.customer_name = 'Customer name is required.';
    if (!form.customer_phone.trim()) local.customer_phone = 'Customer phone is required.';
    if (!form.customer_address.trim()) local.customer_address = 'Customer address is required.';
    if (!/^\d+$/.test(form.quantity.trim()) || Number(form.quantity) <= 0) local.quantity = 'Enter a whole number of bricks greater than zero.';
    if (!form.rate_per_brick.trim()) local.rate_per_brick = 'Enter the rate per brick for this order.';
    if (form.tax_type !== 'none' && !form.gst_rate.trim()) local.gst_rate = 'Enter the GST rate.';
    if (Object.keys(local).length) {
      setErrors(local);
      return;
    }

    setSaving(true);
    setError(null);
    const body = { ...form, gst_rate: form.tax_type === 'none' ? '' : form.gst_rate };
    if (!tracking) delete body.amount_paid;
    try {
      const saved = id
        ? await api.put(`/orders/${id}`, body)
        : await api.post('/orders', body, { 'Idempotency-Key': requestId.current });
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
  if (existing.data?.order_status === 'Cancelled') {
    return <div className="page"><ErrorBox error="A cancelled order cannot be edited." /></div>;
  }
  const f = { form, onChange: set, errors };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <Link to={id ? `/orders/${id}` : '/orders'} className="link back"><ArrowLeft size={16} aria-hidden="true" /> {id ? 'Order' : 'Orders & Bills'}</Link>
          <h1>{id ? `Edit order ${existing.data?.invoice_number || ''}` : 'Create order'}</h1>
          {!id && <p className="muted">The invoice number is issued by the server when you save.</p>}
        </div>
      </div>

      <form className="form-layout" onSubmit={submit} noValidate>
        <div className="form-main">
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
              <Field label="Order status" name="order_status" as="select" {...f}
                options={['Draft', 'Confirmed', 'Completed'].map((s) => ({ value: s, label: s }))} />
              <Field label="Brick type / size" name="brick_type" placeholder="e.g. Zig-zag 80mm" {...f} />
              <Field label="Number of bricks" name="quantity" inputMode="numeric" required {...f} />
              <Field label="Rate per brick (₹)" name="rate_per_brick" inputMode="decimal" required
                hint="Enter the agreed rate for this order." {...f} />
              <Field label="Delivery date" name="delivery_date" type="date" {...f} />
            </div>
          </fieldset>

          <fieldset className="card">
            <legend>Discount, tax &amp; charges</legend>
            <div className="form-grid">
              <Field label="Discount (₹)" name="discount_amount" inputMode="decimal" {...f} />
              <Field label="GST / tax treatment" name="tax_type" as="select" options={TAX_OPTIONS} {...f}
                hint="Confirm GST settings with your accountant." />
              {form.tax_type !== 'none' && <Field label="GST rate (%)" name="gst_rate" inputMode="decimal" required {...f} />}
              <Field label="Additional charges (₹)" name="additional_charges" inputMode="decimal" hint="Transport, loading, etc." {...f} />
            </div>
          </fieldset>

          {tracking && (
            <fieldset className="card">
              <legend>Payment</legend>
              <div className="form-grid">
                <Field label="Amount paid (₹)" name="amount_paid" inputMode="decimal" hint="Leave blank if nothing is paid yet." {...f} />
              </div>
            </fieldset>
          )}

          <fieldset className="card">
            <legend>Notes</legend>
            <Field label="Notes" name="notes" as="textarea" {...f} />
          </fieldset>
        </div>

        <aside className="form-side">
          <div className="card sticky">
            <h2>Bill summary</h2>
            {preview && (
              <p className="muted small">{form.quantity} bricks × {formatINR(form.rate_per_brick)}</p>
            )}
            <TaxBreakdown preview={preview} taxType={form.tax_type} gstRate={form.gst_rate}
              extraLabel="Additional charges" extraKey="additional">
              {tracking && preview && (
                <>
                  <div><dt>Amount paid</dt><dd>{formatINR(preview.paid)}</dd></div>
                  <div><dt>Balance due</dt><dd>{formatINR(preview.balance)}</dd></div>
                  {preview.overpaid && <p className="field-error">Amount paid is more than the total.</p>}
                </>
              )}
            </TaxBreakdown>
            <p className="muted small">Final amounts are calculated and saved by the server.</p>
            <button type="submit" className="btn btn-primary btn-block" disabled={saving}>
              <Save size={18} aria-hidden="true" /> {saving ? 'Saving…' : id ? 'Save changes' : 'Create order'}
            </button>
          </div>
        </aside>
      </form>
    </div>
  );
}
