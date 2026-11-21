import { useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Download, Printer } from 'lucide-react';
import { api } from '../api';
import { useBusiness } from '../business';
import InvoiceSheet from '../components/InvoiceSheet';
import { ErrorBox, Loading, useLoader } from '../components/ui';
import { useInvoicePdf } from '../utils/invoicePdf';

export default function InvoicePage() {
  const { id } = useParams();
  const { business, error: businessError } = useBusiness();
  const order = useLoader(() => api.get(`/orders/${id}`), [id]);
  const sheet = useRef(null);
  // Reprinting reads the saved order - it never creates a new order or number.
  const pdf = useInvoicePdf(sheet);

  if (order.loading || (!business && !businessError)) return <Loading label="Preparing invoice…" />;
  if (order.error || businessError) {
    return <div className="page"><ErrorBox error={order.error || businessError} onRetry={order.reload} /></div>;
  }

  return (
    <div className="page invoice-page">
      <div className="page-head no-print">
        <div>
          <Link to={`/orders/${id}`} className="link back"><ArrowLeft size={16} aria-hidden="true" /> Order {order.data.invoice_number}</Link>
          <h1>Invoice preview</h1>
        </div>
        <div className="actions">
          <button type="button" className="btn btn-secondary" onClick={() => window.print()}>
            <Printer size={18} aria-hidden="true" /> Print
          </button>
          <button type="button" className="btn btn-primary" disabled={pdf.busy}
            onClick={() => pdf.download(`Invoice-${order.data.invoice_number}.pdf`)}>
            <Download size={18} aria-hidden="true" /> {pdf.busy ? 'Creating PDF…' : 'Download PDF'}
          </button>
        </div>
      </div>
      <div className="no-print"><ErrorBox error={pdf.error} /></div>
      <div className="invoice-scroll">
        <InvoiceSheet ref={sheet} order={order.data} business={business} />
      </div>
    </div>
  );
}
