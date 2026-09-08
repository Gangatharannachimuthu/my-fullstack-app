from flask import Blueprint, jsonify, request

from extensions import db
from models import ExpenditureCategory, ExpenditureEntry, Meeting
from services.guards import ensure_meeting_editable

expenditures_bp = Blueprint("expenditures", __name__)


@expenditures_bp.get("/api/expenditure-categories")
def list_expenditure_categories():
    categories = ExpenditureCategory.query.order_by(ExpenditureCategory.name).all()
    return jsonify([c.to_dict() for c in categories])


@expenditures_bp.post("/api/expenditure-categories")
def create_expenditure_category():
    data = request.get_json(force=True)
    name = data.get("name")
    if not name:
        return jsonify({"error": "name is required"}), 400
    if ExpenditureCategory.query.filter_by(name=name).first():
        return jsonify({"error": "Category already exists"}), 409
    category = ExpenditureCategory(name=name)
    db.session.add(category)
    db.session.commit()
    return jsonify(category.to_dict()), 201


@expenditures_bp.get("/api/meetings/<int:meeting_id>/expenditures")
def list_meeting_expenditures(meeting_id):
    Meeting.query.get_or_404(meeting_id)
    entries = ExpenditureEntry.query.filter_by(meeting_id=meeting_id).all()
    return jsonify([e.to_dict() for e in entries])


@expenditures_bp.post("/api/meetings/<int:meeting_id>/expenditures")
def create_meeting_expenditure(meeting_id):
    Meeting.query.get_or_404(meeting_id)
    data = request.get_json(force=True)
    category_id = data.get("category_id")
    amount = data.get("amount")
    if category_id is None or amount is None:
        return jsonify({"error": "category_id and amount are required"}), 400
    if float(amount) <= 0:
        return jsonify({"error": "amount must be positive"}), 400
    ensure_meeting_editable(meeting_id)

    entry = ExpenditureEntry(
        meeting_id=meeting_id, category_id=category_id, amount=amount, note=data.get("note")
    )
    db.session.add(entry)
    db.session.commit()
    return jsonify(entry.to_dict()), 201


@expenditures_bp.put("/api/expenditure-entries/<int:entry_id>")
def update_expenditure_entry(entry_id):
    entry = ExpenditureEntry.query.get_or_404(entry_id)
    ensure_meeting_editable(entry.meeting_id)

    data = request.get_json(force=True)
    if "category_id" in data:
        entry.category_id = data["category_id"]
    if "amount" in data:
        if float(data["amount"]) <= 0:
            return jsonify({"error": "amount must be positive"}), 400
        entry.amount = data["amount"]
    if "note" in data:
        entry.note = data["note"]

    db.session.commit()
    return jsonify(entry.to_dict())


@expenditures_bp.delete("/api/expenditure-entries/<int:entry_id>")
def delete_expenditure_entry(entry_id):
    entry = ExpenditureEntry.query.get_or_404(entry_id)
    ensure_meeting_editable(entry.meeting_id)
    db.session.delete(entry)
    db.session.commit()
    return jsonify({"message": "Expenditure entry removed"})
