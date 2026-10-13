from flask import Blueprint, jsonify, request

from extensions import db
from models import Chit, InvestmentCategory, InvestmentEntry, Meeting
from services.guards import ensure_meeting_editable

investments_bp = Blueprint("investments", __name__)


def _resolve_auction_amount(value):
    """Optional tracking figure - what the chit went for at auction. Returns
    (amount_or_None, error). Blank clears it."""
    if value in (None, ""):
        return None, None
    try:
        amount = float(value)
    except (TypeError, ValueError):
        return None, "auction_amount must be a number"
    if amount < 0:
        return None, "auction_amount cannot be negative"
    return value, None


def _resolve_chit_id(value):
    """Validate an optional chit link. Returns (chit_id, error). A blank value means
    'no chit', which is normal for Gold/FD entries."""
    if value in (None, "", 0):
        return None, None
    if not Chit.query.get(value):
        return None, "chit_id does not match any chit"
    return value, None


@investments_bp.get("/api/investment-categories")
def list_investment_categories():
    categories = InvestmentCategory.query.order_by(InvestmentCategory.name).all()
    return jsonify([c.to_dict() for c in categories])


@investments_bp.post("/api/investment-categories")
def create_investment_category():
    data = request.get_json(force=True)
    name = data.get("name")
    if not name:
        return jsonify({"error": "name is required"}), 400
    if InvestmentCategory.query.filter_by(name=name).first():
        return jsonify({"error": "Category already exists"}), 409
    category = InvestmentCategory(name=name)
    db.session.add(category)
    db.session.commit()
    return jsonify(category.to_dict()), 201


@investments_bp.get("/api/meetings/<int:meeting_id>/investments")
def list_meeting_investments(meeting_id):
    Meeting.query.get_or_404(meeting_id)
    entries = InvestmentEntry.query.filter_by(meeting_id=meeting_id).all()
    return jsonify([e.to_dict() for e in entries])


@investments_bp.post("/api/meetings/<int:meeting_id>/investments")
def create_meeting_investment(meeting_id):
    Meeting.query.get_or_404(meeting_id)
    data = request.get_json(force=True)
    category_id = data.get("category_id")
    amount = data.get("amount")
    if category_id is None or amount is None:
        return jsonify({"error": "category_id and amount are required"}), 400
    if float(amount) <= 0:
        return jsonify({"error": "amount must be positive"}), 400

    commission_amount = data.get("commission_amount") or 0
    if float(commission_amount) < 0:
        return jsonify({"error": "commission_amount cannot be negative"}), 400
    if float(commission_amount) > float(amount):
        return jsonify({"error": "commission_amount cannot exceed the amount"}), 400
    chit_id, chit_error = _resolve_chit_id(data.get("chit_id"))
    if chit_error:
        return jsonify({"error": chit_error}), 400

    auction_amount, auction_error = _resolve_auction_amount(data.get("auction_amount"))
    if auction_error:
        return jsonify({"error": auction_error}), 400

    ensure_meeting_editable(meeting_id)

    entry = InvestmentEntry(
        meeting_id=meeting_id,
        category_id=category_id,
        amount=amount,
        commission_amount=commission_amount,
        auction_amount=auction_amount,
        chit_id=chit_id,
        note=data.get("note"),
    )
    db.session.add(entry)
    db.session.commit()
    return jsonify(entry.to_dict()), 201


@investments_bp.put("/api/investment-entries/<int:entry_id>")
def update_investment_entry(entry_id):
    entry = InvestmentEntry.query.get_or_404(entry_id)
    ensure_meeting_editable(entry.meeting_id)

    data = request.get_json(force=True)
    if "category_id" in data:
        entry.category_id = data["category_id"]
    if "amount" in data:
        if float(data["amount"]) <= 0:
            return jsonify({"error": "amount must be positive"}), 400
        entry.amount = data["amount"]
    if "commission_amount" in data:
        commission_amount = data["commission_amount"] or 0
        if float(commission_amount) < 0:
            return jsonify({"error": "commission_amount cannot be negative"}), 400
        entry.commission_amount = commission_amount
    if "auction_amount" in data:
        auction_amount, auction_error = _resolve_auction_amount(data["auction_amount"])
        if auction_error:
            return jsonify({"error": auction_error}), 400
        entry.auction_amount = auction_amount
    if "chit_id" in data:
        chit_id, chit_error = _resolve_chit_id(data["chit_id"])
        if chit_error:
            return jsonify({"error": chit_error}), 400
        entry.chit_id = chit_id
    if "note" in data:
        entry.note = data["note"]

    if float(entry.commission_amount or 0) > float(entry.amount):
        return jsonify({"error": "commission_amount cannot exceed the amount"}), 400

    db.session.commit()
    return jsonify(entry.to_dict())


@investments_bp.delete("/api/investment-entries/<int:entry_id>")
def delete_investment_entry(entry_id):
    entry = InvestmentEntry.query.get_or_404(entry_id)
    ensure_meeting_editable(entry.meeting_id)
    db.session.delete(entry)
    db.session.commit()
    return jsonify({"message": "Investment entry removed"})
