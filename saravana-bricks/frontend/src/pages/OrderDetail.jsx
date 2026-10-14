import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Ban, FileText, Pencil } from 'lucide-react';
import { api } from '../api';
import { useBusiness } from '../business';
import { ConfirmDialog, ErrorBox, Loading, StatusBadge, useLoader } from '../components/ui';
import { formatCount, formatDate, formatINR } from '../utils/format';
import { TaxBreakdown } from './taxes';

export default function OrderDetail() {
  const { id } = useParams();
  const { business } = useBusiness();
  const order = useLoader(() => api.get(`/orders/${id}`), [id]);
  const [cancelling, setCancelling] = useState(false);

  if (order.loading && !order.data) return <Loading />;
  if (order.error) return <div className="page"><ErrorBox error={order.error} onRetry={order.reload} /></div>;
  const o = order.data;
  const cancelled = o.order_status === 'Cancelled';
  const tracking = business?.payment_tracking_enabled && o.amount_paid !== null;

  const preview = {
    subtotal: o.subtotal, discount: o.discount_amount, taxable: o.taxable_amount,
    cgst: o.cgst_amount, sgst: o.sgst_amount, igst: o.igst_amount,
    additional: o.additional_charges, total: o.total_amount,
  };

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <Link to="/orders" className="link back"><ArrowLeft size={16} aria-hidden="true" /> Orders &amp; Bills</Link>
          <h1>Order {o.invoice_number}</h1>
          <p className="muted">
            {formatDate(o.order_date)} · <StatusBadge value={o.order_status} />
            {tracking && <> · <StatusBadge value={o.payment_status} /></>}
          </p>
        </div>
        <div className="actions">
          {!cancelled && (
            <>
              <button type="button" className="btn btn-ghost danger-text" onClick={() => setCancelling(true)}>
                <Ban size={18} aria-hidden="true" /> Cancel order
              </button>
              <Link to={`/orders/${o.id}/edit`} className="btn btn-secondary"><Pencil size={18} aria-hidden="true" /> Edit</Link>
            </>
          )}
          <Link to={`/orders/${o.id}/invoice`} className="btn btn-primary"><FileText size={18} aria-hidden="true" /> Invoice / Print / PDF</Link>
        </div>
      </div>

      {cancelled && (
        <div className="alert alert-warning" role="status">
          This order was cancelled. Its invoice number {o.invoice_number} stays reserved and will not be reused.
        </div>
      )}

      <div className="grid-2">
        <section className="card">
          <h2>Customer</h2>
          <dl className="details">
            <div><dt>Name</dt><dd>{o.customer_name}</dd></div>
            <div><dt>Phone</dt><dd>{o.customer_phone}</dd></div>
            <div><dt>Address</dt><dd className="pre">{o.customer_address || '—'}</dd></div>
            <div><dt>Delivery address</dt><dd className="pre">{o.delivery_address || 'Same as customer address'}</dd></div>
            <div><dt>Delivery date</dt><dd>{formatDate(o.delivery_date)}</dd></div>
          </dl>
          <h2>Order</h2>
          <dl className="details">
            <div><dt>Brick type</dt><dd>{o.brick_type || '—'}</dd></div>
            <div><dt>Quantity</dt><dd>{formatCount(o.quantity)} bricks</dd></div>
            <div><dt>Rate per brick</dt><dd>{formatINR(o.rate_per_brick)}</dd></div>
            {o.notes && <div><dt>Notes</dt><dd className="pre">{o.notes}</dd></div>}
          </dl>
        </section>
        <section className="card">
          <h2>Bill</h2>
          <TaxBreakdown preview={preview} taxType={o.tax_type} gstRate={o.gst_rate}
            extraLabel="Additional charges" extraKey="additional">
            {tracking && (
              <>
                <div><dt>Amount paid</dt><dd>{formatINR(o.amount_paid)}</dd></div>
                <div><dt>Balance due</dt><dd>{formatINR(o.balance_due)}</dd></div>
              </>
            )}
          </TaxBreakdown>
        </section>
      </div>

      <ConfirmDialog
        open={cancelling}
        title={`Cancel order ${o.invoice_number}?`}
        message="The order will be marked Cancelled and removed from order-value totals. It stays on record, cannot be edited afterwards, and its invoice number is never reused."
        confirmLabel="Cancel order"
        danger
        onConfirm={async () => {
          await api.post(`/orders/${o.id}/cancel`);
          order.reload();
        }}
        onClose={() => setCancelling(false)}
      />
    </div>
  );
}
