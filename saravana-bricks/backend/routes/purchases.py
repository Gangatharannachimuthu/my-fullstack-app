from decimal import Decimal

from flask import Blueprint, jsonify, request
from sqlalchemy import func, or_

from extensions import db
from models import TAX_TYPES, MaterialPurchase, utcnow
from services.auth import require_auth
from services.calc import ZERO, compute_purchase, round_money
from services.common import csv_response
from services.validation import Parser, ValidationError, pagination, resolve_period

purchases_bp = Blueprint("purchases", __name__, url_prefix="/api/purchases")

UNITS = ("kg", "tonne", "bag", "load", "unit", "litre", "piece", "cubic ft", "other")


def _parse(data):
    p = Parser(data)
    values = {
        "purchase_date": p.date("purchase_date", "Purchase date", required=True),
        "material_name": p.text("material_name", "Material/item name", required=True, max_len=150),
        "quantity": p.decimal("quantity", "Quantity", places=3, max_value=Decimal("999999999")),
        "unit": p.text("unit", "Unit", max_len=30),
        "rate_per_unit": p.money("rate_per_unit", "Unit rate", default=None),
        "supplier_name": p.text("supplier_name", "Supplier/shop name", max_len=150),
        "supplier_phone": p.phone("supplier_phone", "Supplier phone"),
        "supplier_place": p.text("supplier_place", "Purchase place", max_len=255),
        "supplier_invoice_number": p.text("supplier_invoice_number", "Supplier invoice/reference", max_len=100),
        "notes": p.text("notes", "Notes", max_len=2000),
    }
    tax_type = p.choice("tax_type", "Tax treatment", TAX_TYPES, default="none")
    tax_entry = p.choice("tax_entry", "Tax entry", ("rate", "manual"), default="rate")
    gst_rate = p.decimal("gst_rate", "GST rate", places=2, max_value=Decimal("100"))
    discount = p.money("discount_amount", "Discount")
    other = p.money("other_charges", "Other charges")
    manual = (
        p.money("cgst_amount", "CGST amount"),
        p.money("sgst_amount", "SGST amount"),
        p.money("igst_amount", "IGST amount"),
    )

    # Quantity × rate decides the subtotal when both are given; otherwise the
    # bill's own subtotal is entered directly.
    if values["quantity"] is not None and values["rate_per_unit"] is not None:
        subtotal = round_money(values["quantity"] * values["rate_per_unit"])
    else:
        subtotal = p.money("subtotal", "Taxable subtotal", required=True, default=None)
    if tax_type != "none" and tax_entry == "rate" and gst_rate is None:
        p.fail("gst_rate", "Enter the GST rate, or choose manual tax entry.")
    p.raise_if_errors()

    values.update(compute_purchase(
        subtotal, discount=discount, tax_type=tax_type, tax_entry=tax_entry,
        gst_rate=gst_rate if tax_type != "none" else None,
        manual_tax=manual, other_charges=other,
    ))
    values["tax_type"] = tax_type
    values["gst_rate"] = gst_rate if tax_type != "none" else None
    return values


def _filtered(args):
    start, end = resolve_period(args)
    query = MaterialPurchase.query
    if args.get("include_voided") != "true":
        query = query.filter(MaterialPurchase.is_voided.is_(False))
    if start:
        query = query.filter(MaterialPurchase.purchase_date >= start)
    if end:
        query = query.filter(MaterialPurchase.purchase_date <= end)
    if args.get("material"):
        query = query.filter(MaterialPurchase.material_name == args["material"])
    q = (args.get("q") or "").strip()
    if q:
        like = f"%{q}%"
        query = query.filter(or_(
            MaterialPurchase.material_name.ilike(like),
            MaterialPurchase.supplier_name.ilike(like),
            MaterialPurchase.supplier_place.ilike(like),
            MaterialPurchase.supplier_invoice_number.ilike(like),
        ))
    return query


def _money_str(value):
    return f"{(value or ZERO):.2f}"


@purchases_bp.get("")
@require_auth
def list_purchases():
    query = _filtered(request.args)
    page, per_page = pagination(request.args)

    # Voided rows may be listed for audit, but never count toward totals.
    active = query.filter(MaterialPurchase.is_voided.is_(False)).with_entities(
        func.count(MaterialPurchase.id),
        func.sum(MaterialPurchase.taxable_amount),
        func.sum(MaterialPurchase.cgst_amount),
        func.sum(MaterialPurchase.sgst_amount),
        func.sum(MaterialPurchase.igst_amount),
        func.sum(MaterialPurchase.total_amount),
    ).order_by(None).one()

    total_rows = query.order_by(None).count()
    items = (
        query.order_by(MaterialPurchase.purchase_date.desc(), MaterialPurchase.id.desc())
        .offset((page - 1) * per_page).limit(per_page).all()
    )
    return jsonify({
        "items": [i.to_dict() for i in items],
        "page": page,
        "per_page": per_page,
        "total_rows": total_rows,
        "totals": {
            "count": active[0],
            "taxable_amount": _money_str(active[1]),
            "cgst_amount": _money_str(active[2]),
            "sgst_amount": _money_str(active[3]),
            "igst_amount": _money_str(active[4]),
            "total_amount": _money_str(active[5]),
        },
    })


@purchases_bp.get("/materials")
@require_auth
def materials():
    rows = (
        db.session.query(MaterialPurchase.material_name)
        .distinct().order_by(MaterialPurchase.material_name).all()
    )
    return jsonify({"materials": [r[0] for r in rows], "units": list(UNITS)})


@purchases_bp.get("/export.csv")
@require_auth
def export_csv():
    rows = _filtered(request.args).order_by(
        MaterialPurchase.purchase_date.desc(), MaterialPurchase.id.desc()
    ).all()
    header = [
        "Purchase Date", "Material", "Quantity", "Unit", "Unit Rate", "Supplier", "Place",
        "Supplier Phone", "Supplier Invoice", "Subtotal", "Discount", "Taxable Amount",
        "GST Rate %", "CGST", "SGST", "IGST", "Other Charges", "Grand Total", "Status", "Notes",
    ]
    data = []
    for r in rows:
        d = r.to_dict()
        data.append([
            r.purchase_date.strftime("%d-%m-%Y"), d["material_name"], d["quantity"], d["unit"],
            d["rate_per_unit"], d["supplier_name"], d["supplier_place"], d["supplier_phone"],
            d["supplier_invoice_number"], d["subtotal"], d["discount_amount"], d["taxable_amount"],
            d["gst_rate"], d["cgst_amount"], d["sgst_amount"], d["igst_amount"],
            d["other_charges"], d["total_amount"], "Voided" if r.is_voided else "Active", d["notes"],
        ])
    return csv_response("raw-material-purchases.csv", header, data)


@purchases_bp.post("")
@require_auth
def create():
    values = _parse(request.get_json(silent=True))
    purchase = MaterialPurchase(**values)
    db.session.add(purchase)
    db.session.commit()
    return jsonify(purchase.to_dict()), 201


@purchases_bp.get("/<int:purchase_id>")
@require_auth
def get_one(purchase_id):
    return jsonify(db.get_or_404(MaterialPurchase, purchase_id).to_dict())


@purchases_bp.put("/<int:purchase_id>")
@require_auth
def update(purchase_id):
    purchase = db.get_or_404(MaterialPurchase, purchase_id)
    if purchase.is_voided:
        raise ValidationError({}, "A voided purchase cannot be edited.")
    for key, value in _parse(request.get_json(silent=True)).items():
        setattr(purchase, key, value)
    db.session.commit()
    return jsonify(purchase.to_dict())


@purchases_bp.post("/<int:purchase_id>/void")
@require_auth
def void(purchase_id):
    purchase = db.get_or_404(MaterialPurchase, purchase_id)
    if purchase.is_voided:
        raise ValidationError({}, "This purchase is already voided.")
    reason = Parser(request.get_json(silent=True)).text("reason", "Reason", max_len=255)
    purchase.is_voided = True
    purchase.voided_at = utcnow()
    purchase.void_reason = reason
    db.session.commit()
    return jsonify(purchase.to_dict())
