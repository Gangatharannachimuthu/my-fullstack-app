import { useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Download, Printer } from 'lucide-react';
import { api } from '../api';
import { useBusiness } from '../business';
import ConsolidatedInvoiceSheet from '../components/ConsolidatedInvoiceSheet';
import { Empty, ErrorBox, Loading, useLoader } from '../components/ui';
import { useInvoicePdf } from '../utils/invoicePdf';

export default function ConsolidatedInvoicePage() {
  const [params, setParams] = useSearchParams();
  const phone = params.get('phone') || '';
  const from = params.get('from') || '';
  const to = params.get('to') || '';
  const { business, error: businessError } = useBusiness();
  const statement = useLoader(() => api.get('/orders/statement', { phone, from, to }), [phone, from, to]);
  const sheet = useRef(null);
  const pdf = useInvoicePdf(sheet, { multiPage: true });

  const setDate = (key) => (e) => {
    const next = new URLSearchParams(params);
    if (e.target.value) next.set(key, e.target.value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  const s = statement.data;
  const ready = s && s.customer && business;

  return (
    <div className="page invoice-page">
      <div className="page-head no-print">
        <div>
          <Link to="/orders" className="link back"><ArrowLeft size={16} aria-hidden="true" /> Orders &amp; Bills</Link>
          <h1>Consolidated invoice</h1>
          <p className="muted">All bills for {s?.customer?.name || phone}. Draft and cancelled orders are not included.</p>
        </div>
        <div className="actions">
          <button type="button" className="btn btn-secondary" onClick={() => window.print()} disabled={!ready}>
            <Printer size={18} aria-hidden="true" /> Print
          </button>
          <button type="button" className="btn btn-primary" disabled={!ready || pdf.busy}
            onClick={() => pdf.download(`Consolidated-Invoice-${s.customer.name.replace(/[^\w-]+/g, '-')}.pdf`)}>
            <Download size={18} aria-hidden="true" /> {pdf.busy ? 'Creating PDF…' : 'Download PDF'}
          </button>
        </div>
      </div>

      <div className="toolbar no-print">
        <div className="field field-inline">
          <label htmlFor="ci-from">From</label>
          <input id="ci-from" type="date" value={from} max={to || undefined} onChange={setDate('from')} />
        </div>
        <div className="field field-inline">
          <label htmlFor="ci-to">To</label>
          <input id="ci-to" type="date" value={to} min={from || undefined} onChange={setDate('to')} />
        </div>
        <p className="muted small">Leave both empty to include every bill.</p>
      </div>

      <div className="no-print">
        <ErrorBox error={statement.error || businessError || pdf.error} onRetry={statement.error ? statement.reload : undefined} />
      </div>
      {(statement.loading || (!business && !businessError)) && !s && <Loading label="Preparing invoice…" />}
      {s && !s.customer && (
        <section className="card no-print">
          <Empty title="No bills found">There are no confirmed or completed orders for this customer in the selected dates.</Empty>
        </section>
      )}
      {ready && (
        <div className="invoice-scroll">
          <ConsolidatedInvoiceSheet ref={sheet} statement={s} business={business} />
        </div>
      )}
    </div>
  );
}
