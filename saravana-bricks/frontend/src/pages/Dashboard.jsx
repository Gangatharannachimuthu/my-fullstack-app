import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Factory, Plus, ReceiptText, Truck } from 'lucide-react';
import { api } from '../api';
import { useBusiness } from '../business';
import PeriodFilter, {
  newEntryLink, periodInvalid, periodParams, periodTitle, usePeriod } from '../components/PeriodFilter';
import { Empty, ErrorBox, Loading, StatusBadge, useLoader } from '../components/ui';
import { formatCount, formatDate, formatINR, shortMonthLabel, todayLocal } from '../utils/format';

export default function Dashboard() {
  const { business } = useBusiness();
  const [period, setPeriod] = usePeriod('dashboard');
  const [year, setYear] = useState(todayLocal().slice(0, 4));
  const invalid = periodInvalid(period);

  const dash = useLoader(
    () => (invalid ? Promise.resolve(null) : api.get('/dashboard', periodParams(period))),
    [JSON.stringify(period)],
  );
  const yearly = useLoader(
    () => (/^\d{4}$/.test(year) ? api.get('/reports/yearly', { year }) : Promise.resolve(null)),
    [year],
  );
  const d = dash.data;
  const tracking = business?.payment_tracking_enabled;

  return (
    <div className="page">
      <div className="page-head">
        <div>
          <h1>Dashboard</h1>
          <p className="muted">Summary for {periodTitle(period)}</p>
        </div>
        <div className="actions">
          <Link to={newEntryLink('/raw-materials/new', period)} className="btn btn-secondary"><Truck size={18} aria-hidden="true" /> Add Purchase</Link>
          <Link to={newEntryLink('/manufacturing/new', period)} className="btn btn-secondary"><Factory size={18} aria-hidden="true" /> Add Production</Link>
          <Link to={newEntryLink('/orders/new', period)} className="btn btn-primary"><Plus size={18} aria-hidden="true" /> Create Order</Link>
        </div>
      </div>

      <div className="toolbar">
        <PeriodFilter value={period} onChange={setPeriod} modes={['day', 'week', 'month', 'range', 'year']} />
      </div>

      <ErrorBox error={dash.error} onRetry={dash.reload} />
      {dash.loading && !d && <Loading />}
      {d && (
        <>
          <section className="stats" aria-label="Totals for the selected period">
            <div className="stat">
              <span className="stat-label">Bricks manufactured</span>
              <strong className="stat-value">{formatCount(d.production.total_bricks)}</strong>
              <span className="stat-sub">{d.production.production_days} production day(s)</span>
            </div>
            <div className="stat">
              <span className="stat-label">Team amount (labour)</span>
              <strong className="stat-value">{formatINR(d.production.labour_amount)}</strong>
              <span className="stat-sub">Pay for bricks produced</span>
            </div>
            <div className="stat">
              <span className="stat-label">Customer orders</span>
              <strong className="stat-value">{formatCount(d.orders.active_count)}</strong>
              <span className="stat-sub">{formatCount(d.orders.bricks_ordered)} bricks ordered · excludes cancelled</span>
            </div>
            <div className="stat">
              <span className="stat-label">Total order value</span>
              <strong className="stat-value">{formatINR(d.orders.order_value)}</strong>
              <span className="stat-sub">
                {tracking ? `Recorded paid ${formatINR(d.orders.amount_paid)} · Balance ${formatINR(d.orders.balance_due)}` : 'Billed value of orders'}
              </span>
            </div>
            <div className="stat">
              <span className="stat-label">Raw-material purchases</span>
              <strong className="stat-value">{formatINR(d.purchases.total_amount)}</strong>
              <span className="stat-sub">{d.purchases.count} purchase(s)</span>
            </div>
          </section>

          <div className="grid-2">
            <section className="card">
              <div className="card-head">
                <h2>Recent orders</h2>
                <Link to="/orders" className="link">View all</Link>
              </div>
              {d.recent_orders.length === 0 ? (
                <Empty title="No orders in this period">
                  <Link to="/orders/new" className="link">Create the first order</Link>
                </Empty>
              ) : (
                <div className="table-wrap">
                  <table className="table">
                    <thead><tr><th>Invoice</th><th>Date</th><th>Customer</th><th className="num">Total</th><th>Status</th></tr></thead>
                    <tbody>
                      {d.recent_orders.map((o) => (
                        <tr key={o.id}>
                          <td><Link className="link" to={`/orders/${o.id}`}>{o.invoice_number}</Link></td>
                          <td>{formatDate(o.order_date)}</td>
                          <td>{o.customer_name}</td>
                          <td className="num">{formatINR(o.total_amount)}</td>
                          <td><StatusBadge value={o.order_status} /></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="card">
              <div className="card-head">
                <h2>Recent purchases</h2>
                <Link to="/raw-materials" className="link">View all</Link>
              </div>
              {d.recent_purchases.length === 0 ? (
                <Empty title="No purchases in this period">
                  <Link to="/raw-materials/new" className="link">Record a purchase</Link>
                </Empty>
              ) : (
                <div className="table-wrap">
                  <table className="table">
                    <thead><tr><th>Date</th><th>Material</th><th>Supplier/Place</th><th className="num">Total</th></tr></thead>
                    <tbody>
                      {d.recent_purchases.map((p) => (
                        <tr key={p.id}>
                          <td>{formatDate(p.purchase_date)}</td>
                          <td>{p.material_name}</td>
                          <td>{p.supplier_name || p.supplier_place || '—'}</td>
                          <td className="num">{formatINR(p.total_amount)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        </>
      )}

      <section className="card">
        <div className="card-head">
          <h2>Monthly report</h2>
          <div className="field field-inline">
            <label htmlFor="report-year">Year</label>
            <input id="report-year" type="number" min="2000" max="2100" value={year} onChange={(e) => setYear(e.target.value)} />
          </div>
        </div>
        <ErrorBox error={yearly.error} onRetry={yearly.reload} />
        {yearly.loading && !yearly.data && <Loading />}
        {yearly.data && (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Month</th><th className="num">Bricks produced</th><th className="num">Team amount</th><th className="num">Purchases</th>
                  <th className="num">Orders</th><th className="num">Order value</th>
                </tr>
              </thead>
              <tbody>
                {yearly.data.months.map((m) => (
                  <tr key={m.month}>
                    <td>{shortMonthLabel(m.month)}</td>
                    <td className="num">{formatCount(m.bricks_produced)}</td>
                    <td className="num">{formatINR(m.labour_amount)}</td>
                    <td className="num">{formatINR(m.purchase_total)}</td>
                    <td className="num">{m.order_count}</td>
                    <td className="num">{formatINR(m.order_value)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <p className="muted small">
          Order value is the billed amount of non-cancelled orders. Profit is not shown because labour,
          wastage, delivery and other costs are not recorded yet.
        </p>
      </section>
    </div>
  );
}
