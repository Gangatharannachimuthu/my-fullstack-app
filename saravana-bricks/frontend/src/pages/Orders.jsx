import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search } from 'lucide-react';
import { api } from '../api';
import PeriodFilter, { newEntryLink, periodInvalid, periodParams, usePeriod } from '../components/PeriodFilter';
import { Empty, ErrorBox, Loading, Pagination, useDebounced, useLoader } from '../components/ui';
import { formatCount, formatDate, formatINR } from '../utils/format';

export function DeliveryBadge({ order: b }) {
  if (b.remaining_quantity <= 0) return <span className="badge badge-success">Delivered</span>;
  if (b.delivered_quantity > 0) return <span className="badge badge-warning">Part delivered</span>;
  return <span className="badge badge-neutral">Not delivered</span>;
}

export default function Orders() {
  const [period, setPeriod] = usePeriod('bookings', 'all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const q = useDebounced(search);
  const invalid = periodInvalid(period);

  const params = { ...periodParams(period), q };
  const list = useLoader(
    () => (invalid ? Promise.resolve(null) : api.get('/bookings', { ...params, page })),
    [JSON.stringify(params), page],
  );
  const change = (fn) => (v) => {
    setPage(1);
    fn(v);
  };

  const d = list.data;
  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Orders</h1>
          <p className="muted">Customer orders. Open an order to create its invoices.</p>
        </div>
        <div className="actions">
          <Link to={newEntryLink('/orders/new', period)} className="btn btn-primary"><Plus size={18} aria-hidden="true" /> Create Order</Link>
        </div>
      </div>

      <div className="toolbar">
        <div className="field field-inline search">
          <label htmlFor="b-search">Search</label>
          <div className="input-icon">
            <Search size={16} aria-hidden="true" />
            <input id="b-search" type="search" placeholder="Customer or phone"
              value={search} onChange={(e) => change(setSearch)(e.target.value)} />
          </div>
        </div>
        <PeriodFilter value={period} onChange={change(setPeriod)} modes={['day', 'week', 'month', 'range', 'all']} idPrefix="bp" />
      </div>

      <ErrorBox error={list.error} onRetry={list.reload} />

      <section className="card">
        {list.loading && !d && <Loading />}
        {d && d.items.length === 0 && <Empty title="No orders found">Try another period or search, or create an order.</Empty>}
        {d && d.items.length > 0 && (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Order</th><th>Date</th><th>Customer</th><th>Phone</th><th className="num">Booked</th>
                  <th className="num">Delivered</th><th className="num">Invoices</th><th className="num">Invoiced</th>
                  <th className="num">Balance due</th><th>Delivery</th>
                </tr>
              </thead>
              <tbody>
                {d.items.map((b) => (
                  <tr key={b.id}>
                    <td><Link className="link strong" to={`/orders/${b.id}`}>#{b.id}</Link></td>
                    <td>{formatDate(b.order_date)}</td>
                    <td>{b.customer_name}</td>
                    <td>{b.customer_phone}</td>
                    <td className="num">{formatCount(b.booked_quantity)}</td>
                    <td className="num">{formatCount(b.delivered_quantity)}</td>
                    <td className="num">{b.invoice_count}</td>
                    <td className="num strong">{formatINR(b.invoiced_amount)}</td>
                    <td className="num">{formatINR(b.balance_due)}</td>
                    <td><DeliveryBadge order={b} /></td>
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
