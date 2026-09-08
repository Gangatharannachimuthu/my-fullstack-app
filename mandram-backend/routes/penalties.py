from flask import Blueprint, jsonify, request

from extensions import db
from models import Meeting, Penalty
from services.guards import ensure_meeting_editable

penalties_bp = Blueprint("penalties", __name__)


@penalties_bp.get("/api/penalties")
def list_penalties():
    query = Penalty.query
    meeting_id = request.args.get("meeting_id", type=int)
    member_id = request.args.get("member_id", type=int)
    if meeting_id:
        query = query.filter_by(meeting_id=meeting_id)
    if member_id:
        query = query.filter_by(member_id=member_id)
    penalties = query.order_by(Penalty.created_at.desc()).all()
    return jsonify([p.to_dict() for p in penalties])


@penalties_bp.post("/api/penalties")
def create_penalty():
    data = request.get_json(force=True)
    member_id = data.get("member_id")
    meeting_id = data.get("meeting_id")
    amount = data.get("amount")
    reason = data.get("reason")

    if not all([member_id, meeting_id, amount, reason]):
        return jsonify({"error": "member_id, meeting_id, amount and reason are required"}), 400
    if float(amount) <= 0:
        return jsonify({"error": "amount must be positive"}), 400

    Meeting.query.get_or_404(meeting_id)
    ensure_meeting_editable(meeting_id)

    penalty = Penalty(member_id=member_id, meeting_id=meeting_id, amount=amount, reason=reason)
    db.session.add(penalty)
    db.session.commit()
    return jsonify(penalty.to_dict()), 201


@penalties_bp.put("/api/penalties/<int:penalty_id>")
def update_penalty(penalty_id):
    penalty = Penalty.query.get_or_404(penalty_id)
    ensure_meeting_editable(penalty.meeting_id)

    data = request.get_json(force=True)
    if "amount" in data:
        if float(data["amount"]) <= 0:
            return jsonify({"error": "amount must be positive"}), 400
        penalty.amount = data["amount"]
    if "reason" in data:
        if not data["reason"]:
            return jsonify({"error": "reason cannot be empty"}), 400
        penalty.reason = data["reason"]

    db.session.commit()
    return jsonify(penalty.to_dict())


@penalties_bp.delete("/api/penalties/<int:penalty_id>")
def delete_penalty(penalty_id):
    penalty = Penalty.query.get_or_404(penalty_id)
    ensure_meeting_editable(penalty.meeting_id)
    db.session.delete(penalty)
    db.session.commit()
    return jsonify({"message": "Penalty removed"})
