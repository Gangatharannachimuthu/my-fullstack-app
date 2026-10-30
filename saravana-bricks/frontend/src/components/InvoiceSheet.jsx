import { forwardRef } from 'react';
import { formatCount, formatDate, formatINR, rupeesInWords } from '../utils/format';

// Company owner's contact numbers, printed on every invoice.
const OWNER_PHONES = ['8056719423', '8300856003'];

const nonZero = (v) => v && Number(v) !== 0;
const half = (rate) => `${Number(rate) / 2}%`;

/** A4 invoice. Used for the on-screen preview, printing and the PDF download. */
const InvoiceSheet = forwardRef(function InvoiceSheet({ order: o, business: b }, ref) {
  const tracking = b.payment_tracking_enabled && o.amount_paid !== null;
  const description = o.brick_type ? `Interlock bricks — ${o.brick_type}` : 'Interlock bricks';
  const showTaxable = nonZero(o.discount_amount) || o.tax_type !== 'none';
  const phones = [...new Set([...OWNER_PHONES, b.phone].filter(Boolean))].join(', ');
  const businessName = b.business_name.replace(/\s+Manufacturing$/i, '');

  return (
    <article className="invoice" ref={ref} aria-label={`Invoice ${o.invoice_number}`}>
      {o.order_status === 'Cancelled' && <div className="invoice-stamp" aria-hidden="true">CANCELLED</div>}

      <header className="inv-head">
        <div className="inv-seller">
          {b.logo_data && <img src={b.logo_data} alt="" className="inv-logo" />}
          <div>
            <h1>{businessName}</h1>
            <p>{b.address}</p>
            <p>{[`Phone: ${phones}`, b.email && `Email: ${b.email}`].filter(Boolean).join(' · ')}</p>
            {b.gstin && <p><strong>GSTIN:</strong> {b.gstin}</p>}
          </div>
        </div>
        <div className="inv-title">
          <h2>INVOICE</h2>
          <table>
            <tbody>
              <tr><th>Invoice No.</th><td>{o.invoice_number}</td></tr>
              <tr><th>Date</th><td>{formatDate(o.order_date)}</td></tr>
              {o.delivery_date && <tr><th>Delivery</th><td>{formatDate(o.delivery_date)}</td></tr>}
              <tr><th>Status</th><td>{o.order_status}</td></tr>
            </tbody>
          </table>
        </div>
      </header>

      <section className="inv-parties">
        <div>
          <h3>Bill to</h3>
          <p className="inv-strong">{o.customer_name}</p>
          <p>Phone: {o.customer_phone}</p>
          {o.customer_address && <p className="pre">{o.customer_address}</p>}
        </div>
        {o.delivery_address && (
          <div>
            <h3>Deliver to</h3>
            <p className="pre">{o.delivery_address}</p>
          </div>
        )}
      </section>

      <table className="inv-items">
        <thead>
          <tr><th className="c-sn">S.No.</th><th>Description</th><th className="num">Quantity</th><th className="num">Rate / brick</th><th className="num">Amount</th></tr>
        </thead>
        <tbody>
          <tr>
            <td className="c-sn">1</td>
            <td>{description}</td>
            <td className="num">{formatCount(o.quantity)}</td>
            <td className="num">{formatINR(o.rate_per_brick)}</td>
            <td className="num">{formatINR(o.subtotal)}</td>
          </tr>
        </tbody>
      </table>

      <section className="inv-bottom">
        <div className="inv-words">
          <h3>Amount in words</h3>
          <p>{rupeesInWords(o.total_amount)}</p>
          {o.notes && (
            <>
              <h3>Notes</h3>
              <p className="pre">{o.notes}</p>
            </>
          )}
        </div>
        <table className="inv-totals">
          <tbody>
            <tr><th>Subtotal</th><td>{formatINR(o.subtotal)}</td></tr>
            {nonZero(o.discount_amount) && <tr><th>Discount</th><td>− {formatINR(o.discount_amount)}</td></tr>}
            {showTaxable && <tr><th>Taxable amount</th><td>{formatINR(o.taxable_amount)}</td></tr>}
            {o.tax_type === 'cgst_sgst' && (
              <>
                <tr><th>CGST @ {half(o.gst_rate)}</th><td>{formatINR(o.cgst_amount)}</td></tr>
                <tr><th>SGST @ {half(o.gst_rate)}</th><td>{formatINR(o.sgst_amount)}</td></tr>
              </>
            )}
            {o.tax_type === 'igst' && <tr><th>IGST @ {o.gst_rate}%</th><td>{formatINR(o.igst_amount)}</td></tr>}
            {nonZero(o.additional_charges) && <tr><th>Additional charges</th><td>{formatINR(o.additional_charges)}</td></tr>}
            <tr className="inv-grand"><th>Grand total</th><td>{formatINR(o.total_amount)}</td></tr>
            {tracking && (
              <>
                <tr><th>Amount paid</th><td>{formatINR(o.amount_paid)}</td></tr>
                <tr className="inv-balance"><th>Balance due</th><td>{formatINR(o.balance_due)}</td></tr>
              </>
            )}
          </tbody>
        </table>
      </section>

      <footer className="inv-foot">
        <div className="inv-terms">
          {b.invoice_terms && (
            <>
              <h3>Terms</h3>
              <p className="pre">{b.invoice_terms}</p>
            </>
          )}
        </div>
        <div className="inv-sign">
          <p>For {businessName}</p>
          <div className="inv-sign-line" />
          <p>Authorised Signatory</p>
        </div>
      </footer>
    </article>
  );
});

export default InvoiceSheet;
