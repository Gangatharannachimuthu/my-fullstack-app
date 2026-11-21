import { useRef } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Download, Printer } from 'lucide-react';
import { api } from '../api';
import { useBusiness } from '../business';
import GroupInvoiceSheet from '../components/GroupInvoiceSheet';
import { ErrorBox, Loading, useLoader } from '../components/ui';
import { useInvoicePdf } from '../utils/invoicePdf';

/** The invoices ticked on an order, shown together as one printable invoice. */
export default function GroupInvoicePage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const ids = params.get('ids') || '';
  const { business, error: businessError } = useBusiness();
  const group = useLoader(() => api.get('/orders/group', { ids }), [ids]);
  const sheet = useRef(null);
  const pdf = useInvoicePdf(sheet, { multiPage: true });

  const g = group.data;
  const ready = g && business;
  const fileName = () => `Invoice-${g.items.map((o) => o.invoice_number).join('_')}.pdf`;

  return (
    <div className="page invoice-page">
      <div className="page-head no-print">
        <div>
          <Link to={`/orders/${id}`} className="link back"><ArrowLeft size={16} aria-hidden="true" /> Order #{id}</Link>
          <h1>Grouped invoice</h1>
          {g && <p className="muted">{g.items.length} invoices for {g.customer.name} on one page.</p>}
        </div>
        <div className="actions">
          <button type="button" className="btn btn-secondary" onClick={() => window.print()} disabled={!ready}>
            <Printer size={18} aria-hidden="true" /> Print
          </button>
          <button type="button" className="btn btn-primary" disabled={!ready || pdf.busy}
            onClick={() => pdf.download(fileName())}>
            <Download size={18} aria-hidden="true" /> {pdf.busy ? 'Creating PDF…' : 'Download PDF'}
          </button>
        </div>
      </div>

      <div className="no-print">
        <ErrorBox error={group.error || businessError || pdf.error} onRetry={group.error ? group.reload : undefined} />
      </div>
      {!group.error && !ready && <Loading label="Preparing invoice…" />}
      {ready && (
        <div className="invoice-scroll">
          <GroupInvoiceSheet ref={sheet} group={g} business={business} />
        </div>
      )}
    </div>
  );
}
