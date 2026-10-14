import { useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Download, Printer } from 'lucide-react';
import { api } from '../api';
import { useBusiness } from '../business';
import InvoiceSheet from '../components/InvoiceSheet';
import { ErrorBox, Loading, useLoader } from '../components/ui';

export default function InvoicePage() {
  const { id } = useParams();
  const { business, error: businessError } = useBusiness();
  const order = useLoader(() => api.get(`/orders/${id}`), [id]);
  const sheet = useRef(null);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfError, setPdfError] = useState(null);

  // Reprinting reads the saved order - it never creates a new order or number.
  const downloadPdf = async () => {
    setPdfBusy(true);
    setPdfError(null);
    sheet.current.classList.add('pdf-export');
    try {
      const { default: html2pdf } = await import('html2pdf.js');
      await html2pdf()
        .set({
          margin: 0,
          filename: `Invoice-${order.data.invoice_number}.pdf`,
          image: { type: 'jpeg', quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
          pagebreak: { mode: ['avoid-all'] },
        })
        .from(sheet.current)
        .save();
    } catch {
      setPdfError('Could not create the PDF. You can use Print and choose "Save as PDF" instead.');
    } finally {
      sheet.current?.classList.remove('pdf-export');
      setPdfBusy(false);
    }
  };

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
          <button type="button" className="btn btn-primary" onClick={downloadPdf} disabled={pdfBusy}>
            <Download size={18} aria-hidden="true" /> {pdfBusy ? 'Creating PDF…' : 'Download PDF'}
          </button>
        </div>
      </div>
      <div className="no-print"><ErrorBox error={pdfError} /></div>
      <div className="invoice-scroll">
        <InvoiceSheet ref={sheet} order={order.data} business={business} />
      </div>
    </div>
  );
}
