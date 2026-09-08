from flask import Blueprint, jsonify, request

from extensions import db
from models import Meeting, PersonalLoan
from services.guards import ensure_meeting_editable

personal_loans_bp = Blueprint("personal_loans", __name__)


@personal_loans_bp.get("/api/personal-loans")
def list_personal_loans():
    query = PersonalLoan.query
    member_id = request.args.get("member_id", type=int)
    status = request.args.get("status")
    if member_id:
        query = query.filter_by(member_id=member_id)
    if status:
        query = query.filter_by(status=status)
    loans = query.order_by(PersonalLoan.created_at.desc()).all()
    return jsonify([loan.to_dict() for loan in loans])


@personal_loans_bp.post("/api/personal-loans")
def disburse_personal_loan():
    data = request.get_json(force=True)
    member_id = data.get("member_id")
    amount = data.get("amount")
    disbursed_meeting_id = data.get("disbursed_meeting_id")

    if member_id is None or amount is None or disbursed_meeting_id is None:
        return jsonify({"error": "member_id, amount and disbursed_meeting_id are required"}), 400
    if float(amount) <= 0:
        return jsonify({"error": "amount must be positive"}), 400

    Meeting.query.get_or_404(disbursed_meeting_id)
    ensure_meeting_editable(disbursed_meeting_id)

    if PersonalLoan.query.filter_by(member_id=member_id, status="outstanding").first():
        return jsonify({"error": "This member already has an outstanding personal loan"}), 409

    loan = PersonalLoan(
        member_id=member_id,
        amount=amount,
        disbursed_meeting_id=disbursed_meeting_id,
        expected_repay_meeting_id=data.get("expected_repay_meeting_id"),
        status="outstanding",
    )
    db.session.add(loan)
    db.session.commit()
    return jsonify(loan.to_dict()), 201


@personal_loans_bp.post("/api/personal-loans/<int:loan_id>/repay")
def repay_personal_loan(loan_id):
    loan = PersonalLoan.query.get_or_404(loan_id)
    if loan.status == "repaid":
        return jsonify({"error": "This personal loan is already repaid"}), 409

    data = request.get_json(force=True)
    meeting_id = data.get("meeting_id")
    interest_amount = data.get("interest_amount", 0)
    if not meeting_id:
        return jsonify({"error": "meeting_id is required"}), 400
    if float(interest_amount) < 0:
        return jsonify({"error": "interest_amount cannot be negative"}), 400
    Meeting.query.get_or_404(meeting_id)
    ensure_meeting_editable(meeting_id)

    loan.status = "repaid"
    loan.repaid_meeting_id = meeting_id
    loan.interest_amount = interest_amount
    db.session.commit()
    return jsonify(loan.to_dict())


@personal_loans_bp.put("/api/personal-loans/<int:loan_id>")
def update_personal_loan(loan_id):
    loan = PersonalLoan.query.get_or_404(loan_id)
    data = request.get_json(force=True)

    ensure_meeting_editable(loan.disbursed_meeting_id)
    if loan.repaid_meeting_id:
        ensure_meeting_editable(loan.repaid_meeting_id)

    if "amount" in data:
        if loan.status == "repaid":
            return jsonify({"error": "Cannot change the amount of an already-repaid personal loan"}), 409
        if float(data["amount"]) <= 0:
            return jsonify({"error": "amount must be positive"}), 400
        loan.amount = data["amount"]

    if "interest_amount" in data:
        if float(data["interest_amount"]) < 0:
            return jsonify({"error": "interest_amount cannot be negative"}), 400
        loan.interest_amount = data["interest_amount"]

    if data.get("revert_to_outstanding"):
        loan.status = "outstanding"
        loan.repaid_meeting_id = None
        loan.interest_amount = None

    db.session.commit()
    return jsonify(loan.to_dict())


@personal_loans_bp.delete("/api/personal-loans/<int:loan_id>")
def delete_personal_loan(loan_id):
    loan = PersonalLoan.query.get_or_404(loan_id)

    ensure_meeting_editable(loan.disbursed_meeting_id)
    if loan.repaid_meeting_id:
        ensure_meeting_editable(loan.repaid_meeting_id)

    db.session.delete(loan)
    db.session.commit()
    return jsonify({"message": "Personal loan removed"})
