from flask import Blueprint, jsonify, request
from sqlalchemy import or_
from sqlalchemy.orm import selectinload

from extensions import db
from models import Booking
from services.auth import require_auth
from services.validation import Parser, ValidationError, pagination, resolve_period

bookings_bp = Blueprint("bookings", __name__, url_prefix="/api/bookings")

# Copied onto every invoice of the order, so a printed bill always shows them.
CUSTOMER_FIELDS = ("customer_name", "customer_phone", "customer_address", "delivery_address")


def _parse(data):
    p = Parser(data)
    values = {
        "order_date": p.date("order_date", "Order date", required=True),
        "customer_name": p.text("customer_name", "Customer name", required=True, max_len=150),
        "customer_phone": p.phone("customer_phone", "Customer phone", required=True),
        "customer_address": p.text("customer_address", "Customer address", required=True, max_len=500),
        "delivery_address": p.text("delivery_address", "Delivery address", max_len=500),
        "brick_type": p.text("brick_type", "Brick type/size", max_len=100),
        "booked_quantity": p.positive_int("booked_quantity", "Bricks booked"),
        "notes": p.text("notes", "Notes", max_len=2000),
    }
    p.raise_if_errors()
    return values


@bookings_bp.get("")
@require_auth
def list_bookings():
    start, end = resolve_period(request.args)
    query = Booking.query.options(selectinload(Booking.invoices))
    if start:
        query = query.filter(Booking.order_date >= start)
    if end:
        query = query.filter(Booking.order_date <= end)
    q = (request.args.get("q") or "").strip()
    if q:
        like = f"%{q}%"
        query = query.filter(or_(Booking.customer_name.ilike(like), Booking.customer_phone.ilike(like)))
    page, per_page = pagination(request.args)
    total = query.order_by(None).count()
    items = (
        query.order_by(Booking.order_date.desc(), Booking.id.desc())
        .offset((page - 1) * per_page).limit(per_page).all()
    )
    return jsonify({
        "items": [b.to_dict() for b in items],
        "page": page,
        "per_page": per_page,
        "total_rows": total,
    })


@bookings_bp.post("")
@require_auth
def create():
    booking = Booking(**_parse(request.get_json(silent=True)))
    db.session.add(booking)
    db.session.commit()
    return jsonify(booking.to_dict(with_invoices=True)), 201


@bookings_bp.get("/<int:booking_id>")
@require_auth
def get_one(booking_id):
    return jsonify(db.get_or_404(Booking, booking_id).to_dict(with_invoices=True))


@bookings_bp.put("/<int:booking_id>")
@require_auth
def update(booking_id):
    booking = db.get_or_404(Booking, booking_id)
    for key, value in _parse(request.get_json(silent=True)).items():
        setattr(booking, key, value)
    # Keep the customer on the order's bills in step, except ones already cancelled.
    for invoice in booking.invoices:
        if invoice.order_status != "Cancelled":
            for key in CUSTOMER_FIELDS:
                setattr(invoice, key, getattr(booking, key))
    db.session.commit()
    return jsonify(booking.to_dict(with_invoices=True))


@bookings_bp.delete("/<int:booking_id>")
@require_auth
def delete(booking_id):
    booking = db.get_or_404(Booking, booking_id)
    if booking.invoices:
        raise ValidationError({}, "This order still has invoices. Delete them first.")
    db.session.delete(booking)
    db.session.commit()
    return jsonify({"ok": True})
