import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { api } from '../api';
import { useInitialDate } from '../components/PeriodFilter';
import { ErrorBox, Field, Loading, useFormState, useLoader } from '../components/ui';
import { formatINR, todayLocal } from '../utils/format';
import { previewPurchase, purchaseSubtotalFromQty } from '../utils/money';
import { TAX_OPTIONS, TaxBreakdown } from './taxes';

const EMPTY = {
  purchase_date: todayLocal(), material_name: '', quantity: '', unit: '', rate_per_unit: '',
  supplier_name: '', supplier_place: '', supplier_phone: '', supplier_invoice_number: '',
  subtotal: '', discount_amount: '', tax_type: 'none', tax_entry: 'rate', gst_rate: '',
  cgst_amount: '', sgst_amount: '', igst_amount: '', other_charges: '', notes: '',
};

const blankZero = (v) => (v && Number(v) !== 0 ? v : '');

function fromRecord(p) {
  const manualTax = p.tax_type !== 'none' && !p.gst_rate;
  return {
    ...EMPTY,
    ...Object.fromEntries(Object.entries(p).map(([k, v]) => [k, v ?? ''])),
    discount_amount: blankZero(p.discount_amount),
    other_charges: blankZero(p.other_charges),
    tax_entry: manualTax ? 'manual' : 'rate',
    cgst_amount: blankZero(p.cgst_amount),
    sgst_amount: blankZero(p.sgst_amount),
    igst_amount: blankZero(p.igst_amount),
  };
}

export default function PurchaseForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const initialDate = useInitialDate();
  const { form, setForm, set, errors, setErrors } = useFormState({ ...EMPTY, purchase_date: initialDate });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const lookups = useLoader(() => api.get('/purchases/materials'), []);
  const existing = useLoader(() => (id ? api.get(`/purchases/${id}`) : Promise.resolve(null)), [id]);

  useEffect(() => {
    if (existing.data) setForm(fromRecord(existing.data));
  }, [existing.data, setForm]);

  const autoSubtotal = purchaseSubtotalFromQty(form.quantity, form.rate_per_unit);
  const preview = previewPurchase({
    subtotal: autoSubtotal ?? form.subtotal,
    discount: form.discount_amount,
    taxType: form.tax_type,
    taxEntry: form.tax_entry,
    gstRate: form.gst_rate,
    cgst: form.cgst_amount,
    sgst: form.sgst_amount,
    igst: form.igst_amount,
    other: form.other_charges,
  });

  const submit = async (e) => {
    e.preventDefault();
    if (saving) return;
    const local = {};
    if (!form.purchase_date) local.purchase_date = 'Purchase date is required.';
    if (!form.material_name.trim()) local.material_name = 'Material/item name is required.';
    if (!autoSubtotal && !form.subtotal) local.subtotal = 'Enter the subtotal, or both quantity and unit rate.';
    if (Object.keys(local).length) {
      setErrors(local);
      return;
    }
    setSaving(true);
    setError(null);
    const body = { ...form };
    if (autoSubtotal) delete body.subtotal;
    // Fields hidden by the current tax choice must not carry stale values.
    if (form.tax_type === 'none' || form.tax_entry === 'rate') {
      body.cgst_amount = ''; body.sgst_amount = ''; body.igst_amount = '';
    }
    if (form.tax_type === 'cgst_sgst') body.igst_amount = '';
    if (form.tax_type === 'igst') { body.cgst_amount = ''; body.sgst_amount = ''; }
    if (form.tax_type === 'none' || form.tax_entry === 'manual') body.gst_rate = '';
    try {
      if (id) await api.put(`/purchases/${id}`, body);
      else await api.post('/purchases', body);
      navigate('/raw-materials');
    } catch (err) {
      setError(err);
      setErrors(err.fields || {});
    } finally {
      setSaving(false);
    }
  };

  if (id && existing.loading) return <Loading />;
  if (id && existing.error) return <div className="page"><ErrorBox error={existing.error} onRetry={existing.reload} /></div>;

  const units = lookups.data?.units || [];
  const f = { form, onChange: set, errors };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <Link to="/raw-materials" className="link back"><ArrowLeft size={16} aria-hidden="true" /> Raw Materials</Link>
          <h1>{id ? 'Edit purchase' : 'Add purchase'}</h1>
        </div>
      </div>

      <form className="form-layout" onSubmit={submit} noValidate>
        <div className="form-main">
          <ErrorBox error={error} />
          <fieldset className="card">
            <legend>Purchase</legend>
            <div className="form-grid">
              <Field label="Purchase date" name="purchase_date" type="date" required {...f} />
              <Field label="Material / item name" name="material_name" required list="material-list"
                placeholder="e.g. Cement, Fly ash, M-sand" {...f} />
              <datalist id="material-list">
                {(lookups.data?.materials || []).map((m) => <option key={m} value={m} />)}
              </datalist>
              <Field label="Quantity" name="quantity" inputMode="decimal" hint="Recommended" {...f} />
              <Field label="Unit" name="unit" as="select" {...f}
                options={[{ value: '', label: 'Select unit' }, ...units.map((u) => ({ value: u, label: u }))]} />
              <Field label="Unit rate (₹)" name="rate_per_unit" inputMode="decimal" {...f}
                hint="With quantity, the subtotal is calculated for you." />
            </div>
          </fieldset>

          <fieldset className="card">
            <legend>Supplier</legend>
            <div className="form-grid">
              <Field label="Supplier / shop name" name="supplier_name" {...f} />
              <Field label="Purchase place" name="supplier_place" {...f} />
              <Field label="Supplier phone" name="supplier_phone" type="tel" inputMode="tel" {...f} />
              <Field label="Supplier invoice / reference no." name="supplier_invoice_number" {...f} />
            </div>
          </fieldset>

          <fieldset className="card">
            <legend>Amounts &amp; tax</legend>
            <div className="form-grid">
              {autoSubtotal ? (
                <div className="field">
                  <span className="label-like">Taxable subtotal</span>
                  <output className="output">{formatINR(autoSubtotal)}</output>
                  <small className="hint">Quantity × unit rate</small>
                </div>
              ) : (
                <Field label="Taxable subtotal (₹)" name="subtotal" inputMode="decimal" required {...f} />
              )}
              <Field label="Discount (₹)" name="discount_amount" inputMode="decimal" {...f} />
              <Field label="Tax treatment" name="tax_type" as="select" options={TAX_OPTIONS} {...f}
                hint="Not every purchase has GST - check the supplier bill." />
              {form.tax_type !== 'none' && (
                <Field label="How to enter tax" name="tax_entry" as="select" {...f} options={[
                  { value: 'rate', label: 'Calculate from GST rate' },
                  { value: 'manual', label: 'Type amounts from the bill' },
                ]} />
              )}
              {form.tax_type !== 'none' && form.tax_entry === 'rate' && (
                <Field label="GST rate (%)" name="gst_rate" inputMode="decimal" required {...f} />
              )}
              {form.tax_type === 'cgst_sgst' && form.tax_entry === 'manual' && (
                <>
                  <Field label="CGST amount (₹)" name="cgst_amount" inputMode="decimal" {...f} />
                  <Field label="SGST amount (₹)" name="sgst_amount" inputMode="decimal" {...f} />
                </>
              )}
              {form.tax_type === 'igst' && form.tax_entry === 'manual' && (
                <Field label="IGST amount (₹)" name="igst_amount" inputMode="decimal" {...f} />
              )}
              <Field label="Other charges (₹)" name="other_charges" inputMode="decimal" hint="Transport, loading, etc." {...f} />
            </div>
            <Field label="Notes" name="notes" as="textarea" {...f} />
          </fieldset>
        </div>

        <aside className="form-side">
          <div className="card sticky">
            <h2>Bill summary</h2>
            <TaxBreakdown preview={preview} taxType={form.tax_type} gstRate={form.tax_entry === 'rate' ? form.gst_rate : ''}
              extraLabel="Other charges" extraKey="other" />
            <p className="muted small">Final amounts are calculated and saved by the server.</p>
            <button type="submit" className="btn btn-primary btn-block" disabled={saving}>
              <Save size={18} aria-hidden="true" /> {saving ? 'Saving…' : 'Save purchase'}
            </button>
          </div>
        </aside>
      </form>
    </div>
  );
}
