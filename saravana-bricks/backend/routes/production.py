from decimal import ROUND_HALF_UP, Decimal

from flask import Blueprint, jsonify, request
from sqlalchemy import func

from extensions import db
from models import ProductionEntry
from services.auth import require_auth
from services.calc import ZERO, round_money
from services.common import csv_response, get_profile
from services.validation import Parser, ValidationError, pagination, resolve_period

production_bp = Blueprint("production", __name__, url_prefix="/api/production")


def _parse(data):
    p = Parser(data)
    values = {
        "production_date": p.date("production_date", "Production date", required=True),
        "brick_type": p.text("brick_type", "Brick type/size", max_len=100),
        "quantity_produced": p.positive_int("quantity_produced", "Quantity produced"),
        "shift_note": p.text("shift_note", "Employee/team/shift note", max_len=255),
        "notes": p.text("notes", "Notes", max_len=2000),
    }
    rate = p.money("labour_rate", "Team rate per brick", default=None)
    p.raise_if_errors()
    if rate is None:
        rate = get_profile().labour_rate_per_brick
    # Team pay is always worked out here from bricks × rate, never taken from the browser.
    values["labour_rate"] = rate
    values["labour_amount"] = round_money(Decimal(values["quantity_produced"]) * rate)
    return values


def _filtered(args):
    start, end = resolve_period(args)
    query = ProductionEntry.query
    if start:
        query = query.filter(ProductionEntry.production_date >= start)
    if end:
        query = query.filter(ProductionEntry.production_date <= end)
    if args.get("brick_type"):
        query = query.filter(ProductionEntry.brick_type == args["brick_type"])
    return query


def summarize(query):
    """Totals for a filtered set. Several entries on one date add up, never overwrite."""
    daily_rows = (
        query.with_entities(
            ProductionEntry.production_date,
            func.sum(ProductionEntry.quantity_produced),
            func.sum(ProductionEntry.labour_amount),
        )
        .group_by(ProductionEntry.production_date)
        .order_by(ProductionEntry.production_date.desc())
        .all()
    )
    daily = [
        {"date": d.isoformat(), "quantity": int(q), "labour_amount": f"{(amt or ZERO):.2f}"}
        for d, q, amt in daily_rows
    ]
    total = sum(row["quantity"] for row in daily)
    labour_total = sum((amt or ZERO for _, _, amt in daily_rows), ZERO)
    days = len(daily)
    average = (
        (Decimal(total) / days).quantize(Decimal("0.1"), rounding=ROUND_HALF_UP) if days else Decimal("0")
    )
    return {
        "total_bricks": total,
        "labour_amount": f"{labour_total:.2f}",
        "production_days": days,
        "average_per_day": format(average, "f"),
        "daily": daily,
    }


@production_bp.get("")
@require_auth
def list_entries():
    query = _filtered(request.args)
    page, per_page = pagination(request.args, default=31)
    total_rows = query.count()
    items = (
        query.order_by(ProductionEntry.production_date.desc(), ProductionEntry.id.desc())
        .offset((page - 1) * per_page).limit(per_page).all()
    )
    return jsonify({
        "items": [i.to_dict() for i in items],
        "page": page,
        "per_page": per_page,
        "total_rows": total_rows,
        "summary": summarize(query.order_by(None)),
    })


@production_bp.get("/monthly")
@require_auth
def monthly():
    year = request.args.get("year", "")
    if not year.isdigit() or len(year) != 4:
        raise ValidationError({"year": "Year must be four digits."})
    start, end = resolve_period({"year": year})
    rows = (
        db.session.query(
            ProductionEntry.production_date, ProductionEntry.quantity_produced, ProductionEntry.labour_amount
        )
        .filter(ProductionEntry.production_date.between(start, end))
        .all()
    )
    # Grouping in Python keeps this identical on MySQL and the SQLite test database.
    months = {m: {"total_bricks": 0, "labour": ZERO, "dates": set()} for m in range(1, 13)}
    for d, qty, labour in rows:
        months[d.month]["total_bricks"] += qty
        months[d.month]["labour"] += labour
        months[d.month]["dates"].add(d)
    return jsonify({
        "year": int(year),
        "months": [
            {
                "month": f"{year}-{m:02d}",
                "total_bricks": v["total_bricks"],
                "production_days": len(v["dates"]),
                "labour_amount": f"{v['labour']:.2f}",
            }
            for m, v in months.items()
        ],
    })


@production_bp.get("/brick-types")
@require_auth
def brick_types():
    rows = (
        db.session.query(ProductionEntry.brick_type)
        .filter(ProductionEntry.brick_type.isnot(None))
        .distinct().order_by(ProductionEntry.brick_type).all()
    )
    return jsonify({"brick_types": [r[0] for r in rows]})


@production_bp.get("/export.csv")
@require_auth
def export_csv():
    rows = _filtered(request.args).order_by(
        ProductionEntry.production_date.desc(), ProductionEntry.id.desc()
    ).all()
    return csv_response(
        "daily-production.csv",
        ["Production Date", "Brick Type/Size", "Quantity Produced", "Team Rate/Brick", "Team Amount",
         "Shift/Team", "Notes"],
        [
            [r.production_date.strftime("%d-%m-%Y"), r.brick_type, r.quantity_produced,
             f"{r.labour_rate:.2f}", f"{r.labour_amount:.2f}", r.shift_note, r.notes]
            for r in rows
        ],
    )


@production_bp.post("")
@require_auth
def create():
    entry = ProductionEntry(**_parse(request.get_json(silent=True)))
    db.session.add(entry)
    db.session.commit()
    return jsonify(entry.to_dict()), 201


@production_bp.get("/<int:entry_id>")
@require_auth
def get_one(entry_id):
    return jsonify(db.get_or_404(ProductionEntry, entry_id).to_dict())


@production_bp.put("/<int:entry_id>")
@require_auth
def update(entry_id):
    entry = db.get_or_404(ProductionEntry, entry_id)
    for key, value in _parse(request.get_json(silent=True)).items():
        setattr(entry, key, value)
    db.session.commit()
    return jsonify(entry.to_dict())


@production_bp.delete("/<int:entry_id>")
@require_auth
def delete(entry_id):
    entry = db.get_or_404(ProductionEntry, entry_id)
    db.session.delete(entry)
    db.session.commit()
    return jsonify({"ok": True})
