import { forwardRef } from 'react';
import { formatCount, formatDate, formatINR, rupeesInWords, todayLocal } from '../utils/format';
import { InvoiceSeller, invoiceBusinessName } from './InvoiceSheet';

function periodLabel(from, to) {
  if (from && to) return `${formatDate(from)} to ${formatDate(to)}`;
  if (from) return `From ${formatDate(from)}`;
  if (to) return `Up to ${formatDate(to)}`;
  return 'All bills';
}

/** A4 consolidated invoice: every bill for one customer, with combined totals. */
const ConsolidatedInvoiceSheet = forwardRef(function ConsolidatedInvoiceSheet({ statement: s, business: b }, ref) {
  const c = s.customer;
  const t = s.totals;
  const tracking = b.payment_tracking_enabled && s.items.some((o) => o.amount_paid !== null);

  return (
    <article className="invoice invoice-multi" ref={ref} aria-label={`Consolidated invoice for ${c.name}`}>
      <header className="inv-head">
        <InvoiceSeller business={b} />
        <div className="inv-title">
          <h2>CONSOLIDATED INVOICE</h2>
          <table>
            <tbody>
              <tr><th>Date</th><td>{formatDate(todayLocal())}</td></tr>
              <tr><th>Period</th><td>{periodLabel(s.from, s.to)}</td></tr>
              <tr><th>Bills</th><td>{s.items.length}</td></tr>
            </tbody>
          </table>
        </div>
      </header>

      <section className="inv-parties">
        <div>
          <h3>Bill to</h3>
          <p className="inv-strong">{c.name}</p>
          <p>Phone: {c.phone}</p>
          {c.address && <p className="pre">{c.address}</p>}
        </div>
      </section>

      <table className="inv-items">
        <thead>
          <tr>
            <th className="c-sn">S.No.</th><th>Invoice No.</th><th>Date</th><th>Description</th>
            <th className="num">Quantity</th><th className="num">Rate / brick</th><th className="num">Amount</th>
            {tracking && <><th className="num">Paid</th><th className="num">Balance</th></>}
          </tr>
        </thead>
        <tbody>
          {s.items.map((o, i) => (
            <tr key={o.id}>
              <td className="c-sn">{i + 1}</td>
              <td className="nowrap">{o.invoice_number}</td>
              <td className="nowrap">{formatDate(o.order_date)}</td>
              <td>{o.brick_type ? `Interlock bricks — ${o.brick_type}` : 'Interlock bricks'}</td>
              <td className="num">{formatCount(o.quantity)}</td>
              <td className="num">{formatINR(o.rate_per_brick)}</td>
              <td className="num">{formatINR(o.total_amount)}</td>
              {tracking && <><td className="num">{formatINR(o.amount_paid)}</td><td className="num">{formatINR(o.balance_due)}</td></>}
            </tr>
          ))}
        </tbody>
      </table>

      <section className="inv-bottom">
        <div className="inv-words">
          <h3>Amount in words</h3>
          <p>{rupeesInWords(t.order_value)}</p>
          <p className="inv-note">Amounts include each bill&apos;s discount, GST and other charges.</p>
        </div>
        <table className="inv-totals">
          <tbody>
            <tr><th>Total bricks</th><td>{formatCount(t.bricks_ordered)}</td></tr>
            <tr className="inv-grand"><th>Grand total</th><td>{formatINR(t.order_value)}</td></tr>
            {tracking && (
              <>
                <tr><th>Amount paid</th><td>{formatINR(t.amount_paid)}</td></tr>
                <tr className="inv-balance"><th>Balance due</th><td>{formatINR(t.balance_due)}</td></tr>
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
          <p>For {invoiceBusinessName(b)}</p>
          <div className="inv-sign-line" />
          <p>Authorised Signatory</p>
        </div>
      </footer>
    </article>
  );
});

export default ConsolidatedInvoiceSheet;
