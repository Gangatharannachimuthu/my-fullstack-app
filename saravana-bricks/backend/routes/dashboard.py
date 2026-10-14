from flask import Blueprint, jsonify, request
from sqlalchemy import func

from extensions import db
from models import CustomerOrder, MaterialPurchase, ProductionEntry
from routes.orders import order_totals
from routes.production import summarize
from services.auth import require_auth
from services.calc import ZERO
from services.common import today_local
from services.validation import ValidationError, resolve_period

dashboard_bp = Blueprint("dashboard", __name__, url_prefix="/api")


def _period():
    args = request.args
    if not any(args.get(k) for k in ("month", "from", "to", "year")):
        args = {"month": today_local().strftime("%Y-%m")}
    return resolve_period(args)


def _between(column, start, end):
    conditions = []
    if start:
        conditions.append(column >= start)
    if end:
        conditions.append(column <= end)
    return conditions


@dashboard_bp.get("/dashboard")
@require_auth
def dashboard():
    start, end = _period()

    production = summarize(
        ProductionEntry.query.filter(*_between(ProductionEntry.production_date, start, end))
    )
    orders = order_totals(
        CustomerOrder.query.filter(*_between(CustomerOrder.order_date, start, end))
    )
    purchase_count, purchase_total = (
        db.session.query(func.count(MaterialPurchase.id), func.sum(MaterialPurchase.total_amount))
        .filter(MaterialPurchase.is_voided.is_(False),
                *_between(MaterialPurchase.purchase_date, start, end))
        .one()
    )

    recent_orders = (
        CustomerOrder.query.filter(*_between(CustomerOrder.order_date, start, end))
        .order_by(CustomerOrder.order_date.desc(), CustomerOrder.id.desc()).limit(5).all()
    )
    recent_purchases = (
        MaterialPurchase.query.filter(
            MaterialPurchase.is_voided.is_(False),
            *_between(MaterialPurchase.purchase_date, start, end),
        )
        .order_by(MaterialPurchase.purchase_date.desc(), MaterialPurchase.id.desc()).limit(5).all()
    )

    return jsonify({
        "period": {"from": start.isoformat() if start else None, "to": end.isoformat() if end else None},
        "today": today_local().isoformat(),
        "production": {k: production[k] for k in ("total_bricks", "production_days", "average_per_day", "labour_amount")},
        "orders": orders,
        "purchases": {"count": purchase_count, "total_amount": f"{(purchase_total or ZERO):.2f}"},
        "recent_orders": [o.to_dict() for o in recent_orders],
        "recent_purchases": [p.to_dict() for p in recent_purchases],
    })


@dashboard_bp.get("/reports/yearly")
@require_auth
def yearly():
    year = request.args.get("year") or str(today_local().year)
    if not year.isdigit() or len(year) != 4:
        raise ValidationError({"year": "Year must be four digits."})
    start, end = resolve_period({"year": year})

    months = {
        m: {"month": f"{year}-{m:02d}", "bricks_produced": 0, "purchase_total": ZERO,
            "order_count": 0, "order_value": ZERO, "labour_amount": ZERO}
        for m in range(1, 13)
    }
    for d, qty, labour in db.session.query(
        ProductionEntry.production_date, ProductionEntry.quantity_produced, ProductionEntry.labour_amount
    ).filter(ProductionEntry.production_date.between(start, end)):
        months[d.month]["bricks_produced"] += qty
        months[d.month]["labour_amount"] += labour
    for d, total in db.session.query(MaterialPurchase.purchase_date, MaterialPurchase.total_amount).filter(
        MaterialPurchase.purchase_date.between(start, end), MaterialPurchase.is_voided.is_(False)
    ):
        months[d.month]["purchase_total"] += total
    for d, total in db.session.query(CustomerOrder.order_date, CustomerOrder.total_amount).filter(
        CustomerOrder.order_date.between(start, end), CustomerOrder.order_status != "Cancelled"
    ):
        months[d.month]["order_count"] += 1
        months[d.month]["order_value"] += total

    rows = []
    for m in months.values():
        rows.append({**m, "purchase_total": f"{m['purchase_total']:.2f}", "order_value": f"{m['order_value']:.2f}",
                     "labour_amount": f"{m['labour_amount']:.2f}"})
    return jsonify({"year": int(year), "months": rows})
