from flask import Blueprint, jsonify, request

from extensions import db
from models import JoiningDue, JoiningPayment, Meeting, Member
from services.auth_service import admin_required
from services.guards import ensure_meeting_editable
from services.joining_service import joining_status, suggest_joining_amount

joining_bp = Blueprint("joining", __name__)


@joining_bp.get("/api/joining-dues")
def list_joining_dues():
    """Every member who owes a joining contribution, with progress."""
    dues = JoiningDue.query.all()
    payload = []
    for due in dues:
        data = due.to_dict()
        data.update(joining_status(due.member_id) or {})
        payload.append(data)
    payload.sort(key=lambda d: (d.get("is_cleared", False), d.get("member_name") or ""))
    return jsonify(payload)


@joining_bp.get("/api/members/<int:member_id>/joining-status")
def member_joining_status(member_id):
    Member.query.get_or_404(member_id)
    status = joining_status(member_id)
    return jsonify(status or {"member_id": member_id, "has_due": False})


@joining_bp.get("/api/members/<int:member_id>/joining-suggestion")
@admin_required
def member_joining_suggestion(member_id):
    """What this member ought to pay to buy in, with the working shown."""
    Member.query.get_or_404(member_id)
    return jsonify(suggest_joining_amount(member_id))


@joining_bp.get("/api/joining-candidates")
@admin_required
def joining_candidates():
    """Members who joined after the group started but have no due recorded yet.

    This is the list the admin acts on - it is what stops a late joiner from
    quietly slipping through with no buy-in, which is exactly how the gap that
    prompted this endpoint arose.
    """
    have_dues = {d.member_id for d in JoiningDue.query.all()}
    candidates = []
    for member in Member.query.order_by(Member.name).all():
        if member.id in have_dues:
            continue
        suggestion = suggest_joining_amount(member.id)
        if suggestion and suggestion.get("applicable"):
            candidates.append(suggestion)
    return jsonify(candidates)


@joining_bp.post("/api/joining-dues")
@admin_required
def create_joining_due():
    data = request.get_json(force=True)

    member_id = data.get("member_id")
    total_amount = data.get("total_amount")
    if member_id is None or total_amount is None:
        return jsonify({"error": "member_id and total_amount are required"}), 400
    Member.query.get_or_404(member_id)

    try:
        if float(total_amount) <= 0:
            return jsonify({"error": "total_amount must be positive"}), 400
    except (TypeError, ValueError):
        return jsonify({"error": "total_amount must be a number"}), 400

    if JoiningDue.query.filter_by(member_id=member_id).first():
        return jsonify({"error": "This member already has a joining due"}), 409

    basis_meeting_id = data.get("basis_meeting_id")
    if basis_meeting_id:
        Meeting.query.get_or_404(basis_meeting_id)

    due = JoiningDue(
        member_id=member_id,
        total_amount=total_amount,
        basis_meeting_id=basis_meeting_id,
        note=data.get("note"),
    )
    db.session.add(due)
    db.session.commit()

    result = due.to_dict()
    result.update(joining_status(member_id) or {})
    return jsonify(result), 201


@joining_bp.put("/api/joining-dues/<int:due_id>")
@admin_required
def update_joining_due(due_id):
    due = JoiningDue.query.get_or_404(due_id)
    data = request.get_json(force=True)

    if "total_amount" in data:
        try:
            if float(data["total_amount"]) <= 0:
                return jsonify({"error": "total_amount must be positive"}), 400
        except (TypeError, ValueError):
            return jsonify({"error": "total_amount must be a number"}), 400
        due.total_amount = data["total_amount"]
    if "note" in data:
        due.note = data["note"]
    if "basis_meeting_id" in data:
        if data["basis_meeting_id"]:
            Meeting.query.get_or_404(data["basis_meeting_id"])
        due.basis_meeting_id = data["basis_meeting_id"]

    db.session.commit()
    result = due.to_dict()
    result.update(joining_status(due.member_id) or {})
    return jsonify(result)


@joining_bp.delete("/api/joining-dues/<int:due_id>")
@admin_required
def delete_joining_due(due_id):
    due = JoiningDue.query.get_or_404(due_id)

    # Payments are real cash the member handed over and they feed past months'
    # balances, so removing the due must not silently delete them.
    paid_count = JoiningPayment.query.filter_by(member_id=due.member_id).count()
    if paid_count and not request.args.get("force"):
        return (
            jsonify(
                {
                    "error": (
                        f"This member has {paid_count} joining payment(s) recorded. "
                        f"Remove those first, or call again with ?force=1 to drop the "
                        f"due and leave the payments in place."
                    )
                }
            ),
            409,
        )

    db.session.delete(due)
    db.session.commit()
    return jsonify({"message": "Joining due removed"})


@joining_bp.get("/api/meetings/<int:meeting_id>/joining-payments")
def list_meeting_joining_payments(meeting_id):
    Meeting.query.get_or_404(meeting_id)
    payments = JoiningPayment.query.filter_by(meeting_id=meeting_id).all()
    return jsonify([p.to_dict() for p in payments])


@joining_bp.post("/api/meetings/<int:meeting_id>/joining-payments")
def upsert_joining_payment(meeting_id):
    """Record (or correct) what a member paid toward their due in this meeting."""
    Meeting.query.get_or_404(meeting_id)
    data = request.get_json(force=True)

    member_id = data.get("member_id")
    amount = data.get("amount")
    if member_id is None or amount is None:
        return jsonify({"error": "member_id and amount are required"}), 400
    Member.query.get_or_404(member_id)

    try:
        amount_value = float(amount)
    except (TypeError, ValueError):
        return jsonify({"error": "amount must be a number"}), 400
    if amount_value < 0:
        return jsonify({"error": "amount cannot be negative"}), 400

    if not JoiningDue.query.filter_by(member_id=member_id).first():
        return jsonify({"error": "This member has no joining due to pay toward"}), 400

    ensure_meeting_editable(meeting_id)

    payment = JoiningPayment.query.filter_by(member_id=member_id, meeting_id=meeting_id).first()
    if amount_value == 0:
        # Clearing the box removes the row rather than storing a zero.
        if payment:
            db.session.delete(payment)
            db.session.commit()
        return jsonify(joining_status(member_id) or {})

    if payment:
        payment.amount = amount
    else:
        payment = JoiningPayment(member_id=member_id, meeting_id=meeting_id, amount=amount)
        db.session.add(payment)
    db.session.commit()

    result = payment.to_dict()
    result["status"] = joining_status(member_id)
    return jsonify(result), 201


@joining_bp.delete("/api/joining-payments/<int:payment_id>")
def delete_joining_payment(payment_id):
    payment = JoiningPayment.query.get_or_404(payment_id)
    ensure_meeting_editable(payment.meeting_id)
    db.session.delete(payment)
    db.session.commit()
    return jsonify({"message": "Joining payment removed"})
