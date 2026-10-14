from decimal import Decimal

from flask import Blueprint, jsonify, request
from sqlalchemy import func, or_
from sqlalchemy.exc import IntegrityError, OperationalError

from extensions import db
from models import ORDER_STATUSES, PAYMENT_STATUSES, TAX_TYPES, CustomerOrder, utcnow
from services.auth import require_auth
from services.calc import ZERO, compute_order, compute_payment
from services.common import csv_response, get_profile, next_invoice_number
from services.validation import Parser, ValidationError, pagination, resolve_period

orders_bp = Blueprint("orders", __name__, url_prefix="/api/orders")

EDITABLE_STATUSES = ("Draft", "Confirmed", "Completed")


def _parse(data):
    p = Parser(data)
    values = {
        "order_date": p.date("order_date", "Order date", required=True),
        "customer_name": p.text("customer_name", "Customer name", required=True, max_len=150),
        "customer_phone": p.phone("customer_phone", "Customer phone", required=True),
        "customer_address": p.text("customer_address", "Customer address", required=True, max_len=500),
        "delivery_address": p.text("delivery_address", "Delivery address", max_len=500),
        "brick_type": p.text("brick_type", "Brick type/size", max_len=100),
        "quantity": p.positive_int("quantity", "Brick quantity"),
        "rate_per_brick": p.money("rate_per_brick", "Rate per brick", required=True, default=None),
        "delivery_date": p.date("delivery_date", "Delivery date"),
        "order_status": p.choice("order_status", "Order status", EDITABLE_STATUSES, default="Confirmed"),
        "notes": p.text("notes", "Notes", max_len=2000),
    }
    tax_type = p.choice("tax_type", "Tax treatment", TAX_TYPES, default="none")
    gst_rate = p.decimal("gst_rate", "GST rate", places=2, max_value=Decimal("100"))
    discount = p.money("discount_amount", "Discount")
    additional = p.money("additional_charges", "Additional charges")
    amount_paid = p.money("amount_paid", "Amount paid", default=None)

    if values["rate_per_brick"] is not None and values["rate_per_brick"] == ZERO:
        p.fail("rate_per_brick", "Rate per brick must be greater than zero.")
    if tax_type != "none" and gst_rate is None:
        p.fail("gst_rate", "Enter the GST rate for the selected tax treatment.")
    if (values["delivery_date"] and values["order_date"]
            and values["delivery_date"] < values["order_date"]):
        p.fail("delivery_date", "Delivery date cannot be before the order date.")
    p.raise_if_errors()

    # Totals come only from here - anything the browser sent as a total is ignored.
    values.update(compute_order(
        values["quantity"], values["rate_per_brick"], discount=discount, tax_type=tax_type,
        gst_rate=gst_rate if tax_type != "none" else None, additional_charges=additional,
    ))
    values["tax_type"] = tax_type
    values["gst_rate"] = gst_rate if tax_type != "none" else None

    if get_profile().payment_tracking_enabled:
        paid, balance, status = compute_payment(values["total_amount"], amount_paid)
        values.update(amount_paid=paid, balance_due=balance, payment_status=status)
    else:
        values.update(amount_paid=None, balance_due=None, payment_status=None)
    return values


def _filtered(args):
    start, end = resolve_period(args)
    query = CustomerOrder.query
    if start:
        query = query.filter(CustomerOrder.order_date >= start)
    if end:
        query = query.filter(CustomerOrder.order_date <= end)
    if args.get("status") in ORDER_STATUSES:
        query = query.filter(CustomerOrder.order_status == args["status"])
    if args.get("payment_status") in PAYMENT_STATUSES:
        query = query.filter(CustomerOrder.payment_status == args["payment_status"])
    q = (args.get("q") or "").strip()
    if q:
        like = f"%{q}%"
        query = query.filter(or_(
            CustomerOrder.invoice_number.ilike(like),
            CustomerOrder.customer_name.ilike(like),
            CustomerOrder.customer_phone.ilike(like),
        ))
    return query


def _money_str(value):
    return f"{(value or ZERO):.2f}"


def order_totals(query):
    """Count every matching order, but value only the ones not cancelled."""
    count = query.order_by(None).count()
    live = query.filter(CustomerOrder.order_status != "Cancelled").with_entities(
        func.count(CustomerOrder.id),
        func.sum(CustomerOrder.quantity),
        func.sum(CustomerOrder.total_amount),
        func.sum(CustomerOrder.amount_paid),
        func.sum(CustomerOrder.balance_due),
    ).order_by(None).one()
    return {
        "count": count,
        "active_count": live[0],
        "bricks_ordered": int(live[1] or 0),
        "order_value": _money_str(live[2]),
        "amount_paid": _money_str(live[3]),
        "balance_due": _money_str(live[4]),
    }


@orders_bp.get("")
@require_auth
def list_orders():
    query = _filtered(request.args)
    page, per_page = pagination(request.args)
    items = (
        query.order_by(CustomerOrder.order_date.desc(), CustomerOrder.id.desc())
        .offset((page - 1) * per_page).limit(per_page).all()
    )
    totals = order_totals(query)
    return jsonify({
        "items": [i.to_dict() for i in items],
        "page": page,
        "per_page": per_page,
        "total_rows": totals["count"],
        "totals": totals,
    })


@orders_bp.get("/export.csv")
@require_auth
def export_csv():
    rows = _filtered(request.args).order_by(
        CustomerOrder.order_date.desc(), CustomerOrder.id.desc()
    ).all()
    header = [
        "Invoice No", "Order Date", "Customer", "Phone", "Address", "Brick Type", "Quantity",
        "Rate/Brick", "Subtotal", "Discount", "Taxable", "GST Rate %", "CGST", "SGST", "IGST",
        "Additional Charges", "Final Total", "Amount Paid", "Balance Due", "Order Status",
        "Payment Status", "Delivery Date",
    ]
    data = []
    for r in rows:
        d = r.to_dict()
        data.append([
            d["invoice_number"], r.order_date.strftime("%d-%m-%Y"), d["customer_name"],
            d["customer_phone"], d["customer_address"], d["brick_type"], d["quantity"],
            d["rate_per_brick"], d["subtotal"], d["discount_amount"], d["taxable_amount"],
            d["gst_rate"], d["cgst_amount"], d["sgst_amount"], d["igst_amount"],
            d["additional_charges"], d["total_amount"], d["amount_paid"], d["balance_due"],
            d["order_status"], d["payment_status"],
            r.delivery_date.strftime("%d-%m-%Y") if r.delivery_date else "",
        ])
    return csv_response("customer-orders.csv", header, data)


def _existing_for_request(request_id):
    if not request_id:
        return None
    return CustomerOrder.query.filter_by(client_request_id=request_id).first()


@orders_bp.post("")
@require_auth
def create():
    request_id = (request.headers.get("Idempotency-Key") or "").strip()[:64] or None
    existing = _existing_for_request(request_id)
    if existing:
        return jsonify(existing.to_dict()), 200

    values = _parse(request.get_json(silent=True))
    for _attempt in range(5):
        try:
            invoice_number = next_invoice_number(values["order_date"].year)
            order = CustomerOrder(invoice_number=invoice_number, client_request_id=request_id, **values)
            db.session.add(order)
            db.session.commit()
            return jsonify(order.to_dict()), 201
        except IntegrityError:
            # The same Idempotency-Key landed twice in parallel: return the winner.
            db.session.rollback()
            existing = _existing_for_request(request_id)
            if existing:
                return jsonify(existing.to_dict()), 200
        except OperationalError as err:
            # MySQL deadlock (1213) / lock wait timeout (1205): nothing was saved, retry.
            db.session.rollback()
            if getattr(err.orig, "args", [None])[0] not in (1205, 1213):
                raise
    raise ValidationError({}, "Could not issue an invoice number. Please try again.")


@orders_bp.get("/<int:order_id>")
@require_auth
def get_one(order_id):
    return jsonify(db.get_or_404(CustomerOrder, order_id).to_dict())


@orders_bp.put("/<int:order_id>")
@require_auth
def update(order_id):
    order = db.get_or_404(CustomerOrder, order_id)
    if order.order_status == "Cancelled":
        raise ValidationError({}, "A cancelled order cannot be edited.")
    # The invoice number stays fixed for the life of the order.
    for key, value in _parse(request.get_json(silent=True)).items():
        setattr(order, key, value)
    db.session.commit()
    return jsonify(order.to_dict())


@orders_bp.post("/<int:order_id>/cancel")
@require_auth
def cancel(order_id):
    order = db.get_or_404(CustomerOrder, order_id)
    if order.order_status == "Cancelled":
        raise ValidationError({}, "This order is already cancelled.")
    order.order_status = "Cancelled"
    order.cancelled_at = utcnow()
    db.session.commit()
    return jsonify(order.to_dict())
