import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, FileText, Plus, Search } from 'lucide-react';
import { api, downloadCsv } from '../api';
import { useBusiness } from '../business';
import PeriodFilter, { newEntryLink, periodInvalid, periodParams, usePeriod } from '../components/PeriodFilter';
import { Empty, ErrorBox, Loading, Pagination, StatusBadge, useDebounced, useLoader } from '../components/ui';
import { formatCount, formatDate, formatINR } from '../utils/format';

export default function Orders() {
  const { business } = useBusiness();
  const tracking = business?.payment_tracking_enabled;
  const [period, setPeriod] = usePeriod('orders');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [payment, setPayment] = useState('');
  const [page, setPage] = useState(1);
  const [exportError, setExportError] = useState(null);
  const q = useDebounced(search);
  const invalid = periodInvalid(period);

  const params = { ...periodParams(period), q, status, payment_status: tracking ? payment : '' };
  const list = useLoader(
    () => (invalid ? Promise.resolve(null) : api.get('/orders', { ...params, page })),
    [JSON.stringify(params), page],
  );
  const change = (fn) => (v) => {
    setPage(1);
    fn(v);
  };

  const exportCsv = async () => {
    setExportError(null);
    try {
      await downloadCsv('/orders/export.csv', params, 'customer-orders.csv');
    } catch (e) {
      setExportError(e);
    }
  };

  const d = list.data;
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Orders &amp; Bills</h1>
          <p className="muted">Customer orders and invoices.</p>
        </div>
        <div className="actions">
          <button type="button" className="btn btn-ghost" onClick={exportCsv}><Download size={18} aria-hidden="true" /> Export CSV</button>
          <Link to={newEntryLink('/orders/new', period)} className="btn btn-primary"><Plus size={18} aria-hidden="true" /> Create Order</Link>
        </div>
      </div>

      <div className="toolbar">
        <div className="field field-inline search">
          <label htmlFor="o-search">Search</label>
          <div className="input-icon">
            <Search size={16} aria-hidden="true" />
            <input id="o-search" type="search" placeholder="Invoice no., customer or phone"
              value={search} onChange={(e) => change(setSearch)(e.target.value)} />
          </div>
        </div>
        <PeriodFilter value={period} onChange={change(setPeriod)} modes={['day', 'week', 'month', 'range', 'all']} idPrefix="op" />
        <div className="field field-inline">
          <label htmlFor="o-status">Order status</label>
          <select id="o-status" value={status} onChange={(e) => change(setStatus)(e.target.value)}>
            <option value="">All</option>
            {['Draft', 'Confirmed', 'Completed', 'Cancelled'].map((s) => <option key={s}>{s}</option>)}
          </select>
        </div>
        {tracking && (
          <div className="field field-inline">
            <label htmlFor="o-pay">Payment</label>
            <select id="o-pay" value={payment} onChange={(e) => change(setPayment)(e.target.value)}>
              <option value="">All</option>
              {['Unpaid', 'Partially Paid', 'Paid'].map((s) => <option key={s}>{s}</option>)}
            </select>
          </div>
        )}
      </div>

      <ErrorBox error={exportError} />
      <ErrorBox error={list.error} onRetry={list.reload} />

      {d && (
        <section className="totals-bar" aria-label="Totals for the selected filter">
          <div><span>Orders</span><strong>{d.totals.count}</strong></div>
          <div><span>Bricks ordered</span><strong>{formatCount(d.totals.bricks_ordered)}</strong></div>
          <div className="totals-main"><span>Order value</span><strong>{formatINR(d.totals.order_value)}</strong></div>
          {tracking && <div><span>Recorded paid</span><strong>{formatINR(d.totals.amount_paid)}</strong></div>}
          {tracking && <div><span>Balance due</span><strong>{formatINR(d.totals.balance_due)}</strong></div>}
        </section>
      )}
      {d && d.totals.count !== d.totals.active_count && (
        <p className="muted small">Cancelled orders are listed but not included in the value totals.</p>
      )}

      <section className="card">
        {list.loading && !d && <Loading />}
        {d && d.items.length === 0 && <Empty title="No orders found">Try another period or search, or create an order.</Empty>}
        {d && d.items.length > 0 && (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Invoice No.</th><th>Date</th><th>Customer</th><th>Phone</th><th className="num">Bricks</th>
                  <th className="num">Rate</th><th className="num">Total</th><th>Status</th>
                  {tracking && <th>Payment</th>}<th><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {d.items.map((o) => (
                  <tr key={o.id} className={o.order_status === 'Cancelled' ? 'row-voided' : ''}>
                    <td><Link className="link strong" to={`/orders/${o.id}`}>{o.invoice_number}</Link></td>
                    <td>{formatDate(o.order_date)}</td>
                    <td>{o.customer_name}</td>
                    <td>{o.customer_phone}</td>
                    <td className="num">{formatCount(o.quantity)}</td>
                    <td className="num">{formatINR(o.rate_per_brick)}</td>
                    <td className="num strong">{formatINR(o.total_amount)}</td>
                    <td><StatusBadge value={o.order_status} /></td>
                    {tracking && <td><StatusBadge value={o.payment_status} /></td>}
                    <td className="row-actions">
                      <Link className="btn btn-small btn-ghost" to={`/orders/${o.id}/invoice`}
                        aria-label={`Invoice ${o.invoice_number}`}>
                        <FileText size={15} aria-hidden="true" /> Invoice
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {d && <Pagination page={d.page} perPage={d.per_page} total={d.total_rows} onPage={setPage} />}
      </section>
    </div>
  );
}
