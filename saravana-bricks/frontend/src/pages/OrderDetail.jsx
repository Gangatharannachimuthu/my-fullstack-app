import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, FileText, Files, Pencil, Plus, Trash2 } from 'lucide-react';
import { api } from '../api';
import { useBusiness } from '../business';
import { ConfirmDialog, Empty, ErrorBox, Loading, StatusBadge, useLoader } from '../components/ui';
import { formatCount, formatDate, formatINR } from '../utils/format';
import { DeliveryBadge } from './Orders';

export default function OrderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { business } = useBusiness();
  const tracking = business?.payment_tracking_enabled;
  const order = useLoader(() => api.get(`/bookings/${id}`), [id]);
  const [ticked, setTicked] = useState(() => new Set());
  const [deleting, setDeleting] = useState(false);

  if (order.loading && !order.data) return <Loading />;
  if (order.error) return <div className="page"><ErrorBox error={order.error} onRetry={order.reload} /></div>;
  const b = order.data;
  // Cancelled invoices can't be grouped.
  const groupable = b.invoices.filter((i) => i.order_status !== 'Cancelled');
  const chosen = groupable.filter((i) => ticked.has(i.id));
  const allTicked = groupable.length > 0 && chosen.length === groupable.length;

  const toggle = (invoiceId) => setTicked((t) => {
    const next = new Set(t);
    if (next.has(invoiceId)) next.delete(invoiceId);
    else next.add(invoiceId);
    return next;
  });
  const toggleAll = () => setTicked(allTicked ? new Set() : new Set(groupable.map((i) => i.id)));

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <Link to="/orders" className="link back"><ArrowLeft size={16} aria-hidden="true" /> Orders</Link>
          <h1>Order #{b.id} · {b.customer_name}</h1>
          <p className="muted">{formatDate(b.order_date)} · <DeliveryBadge order={b} /></p>
        </div>
        <div className="actions">
          {b.invoice_count === 0 && (
            <button type="button" className="btn btn-ghost danger-text" onClick={() => setDeleting(true)}>
              <Trash2 size={18} aria-hidden="true" /> Delete
            </button>
          )}
          <Link to={`/orders/${b.id}/edit`} className="btn btn-secondary"><Pencil size={18} aria-hidden="true" /> Edit order</Link>
          <Link to={`/orders/${b.id}/invoices/new`} className="btn btn-primary"><Plus size={18} aria-hidden="true" /> Create invoice</Link>
        </div>
      </div>

      <section className="totals-bar" aria-label="Order progress">
        <div><span>Booked</span><strong>{formatCount(b.booked_quantity)}</strong></div>
        <div><span>Delivered</span><strong>{formatCount(b.delivered_quantity)}</strong></div>
        <div><span>{b.remaining_quantity < 0 ? 'Delivered extra' : 'Remaining'}</span><strong>{formatCount(Math.abs(b.remaining_quantity))}</strong></div>
        <div className="totals-main"><span>Invoiced</span><strong>{formatINR(b.invoiced_amount)}</strong></div>
        {tracking && <div><span>Paid</span><strong>{formatINR(b.amount_paid)}</strong></div>}
        {tracking && <div><span>Balance due</span><strong>{formatINR(b.balance_due)}</strong></div>}
      </section>

      <section className="card">
        <div className="card-head">
          <h2>Invoices</h2>
          <Link
            to={`/orders/${b.id}/group?ids=${chosen.map((i) => i.id).join(',')}`}
            className={`btn btn-primary ${chosen.length ? '' : 'disabled'}`}
            aria-disabled={chosen.length ? undefined : 'true'}
            onClick={(e) => { if (!chosen.length) e.preventDefault(); }}
          >
            <Files size={18} aria-hidden="true" /> Group invoices{chosen.length ? ` (${chosen.length})` : ''}
          </Link>
        </div>
        {b.invoices.length === 0 ? (
          <Empty title="No invoices yet">
            <Link to={`/orders/${b.id}/invoices/new`} className="link">Create the first invoice</Link> for this order.
          </Empty>
        ) : (
          <>
            <p className="muted small">Tick the invoices to put on one page, then click Group invoices.</p>
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th className="c-check">
                      <input type="checkbox" checked={allTicked} onChange={toggleAll} disabled={!groupable.length}
                        aria-label="Tick all invoices" />
                    </th>
                    <th>Invoice No.</th><th>Date</th><th>Brick type</th><th className="num">Bricks</th>
                    <th className="num">Rate</th><th className="num">Total</th><th>Status</th>
                    {tracking && <th>Payment</th>}<th><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody>
                  {b.invoices.map((o) => {
                    const cancelled = o.order_status === 'Cancelled';
                    return (
                      <tr key={o.id} className={cancelled ? 'row-voided' : ''}>
                        <td className="c-check">
                          <input type="checkbox" checked={!cancelled && ticked.has(o.id)} disabled={cancelled}
                            onChange={() => toggle(o.id)} aria-label={`Tick invoice ${o.invoice_number}`} />
                        </td>
                        <td><Link className="link strong" to={`/invoices/${o.id}`}>{o.invoice_number}</Link></td>
                        <td>{formatDate(o.order_date)}</td>
                        <td>{o.brick_type || '—'}</td>
                        <td className="num">{formatCount(o.quantity)}</td>
                        <td className="num">{formatINR(o.rate_per_brick)}</td>
                        <td className="num strong">{formatINR(o.total_amount)}</td>
                        <td><StatusBadge value={o.order_status} /></td>
                        {tracking && <td><StatusBadge value={o.payment_status} /></td>}
                        <td className="row-actions">
                          <Link className="btn btn-small btn-ghost" to={`/invoices/${o.id}/print`}
                            aria-label={`Print invoice ${o.invoice_number}`}>
                            <FileText size={15} aria-hidden="true" /> Invoice
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </>
        )}
      </section>

      <section className="card">
        <h2>Customer</h2>
        <dl className="details">
          <div><dt>Phone</dt><dd>{b.customer_phone}</dd></div>
          <div><dt>Address</dt><dd className="pre">{b.customer_address}</dd></div>
          <div><dt>Delivery address</dt><dd className="pre">{b.delivery_address || 'Same as customer address'}</dd></div>
          <div><dt>Brick type</dt><dd>{b.brick_type || '—'}</dd></div>
          {b.notes && <div><dt>Notes</dt><dd className="pre">{b.notes}</dd></div>}
        </dl>
      </section>

      <ConfirmDialog
        open={deleting}
        title={`Delete order #${b.id}?`}
        message={`The order for ${b.customer_name} has no invoices and will be permanently deleted.`}
        confirmLabel="Delete permanently"
        danger
        onConfirm={async () => {
          await api.del(`/bookings/${b.id}`);
          navigate('/orders', { replace: true });
        }}
        onClose={() => setDeleting(false)}
      />
    </div>
  );
}
