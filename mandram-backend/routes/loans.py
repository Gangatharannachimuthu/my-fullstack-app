from flask import Blueprint, jsonify, request

from extensions import db
from models import Loan, LoanPayment, Meeting
from services.guards import ensure_meeting_editable

loans_bp = Blueprint("loans", __name__)


def _has_later_payment(loan_id, meeting_id, meeting):
    return (
        db.session.query(LoanPayment)
        .join(Meeting, Meeting.id == LoanPayment.meeting_id)
        .filter(
            LoanPayment.loan_id == loan_id,
            LoanPayment.meeting_id != meeting_id,
            (Meeting.year > meeting.year) | ((Meeting.year == meeting.year) & (Meeting.month > meeting.month)),
        )
        .first()
        is not None
    )


@loans_bp.get("/api/loans")
def list_loans():
    query = Loan.query
    member_id = request.args.get("member_id", type=int)
    status = request.args.get("status")
    if member_id:
        query = query.filter_by(member_id=member_id)
    if status:
        query = query.filter_by(status=status)
    loans = query.order_by(Loan.created_at.desc()).all()
    return jsonify([loan.to_dict() for loan in loans])


@loans_bp.post("/api/loans")
def create_loan():
    data = request.get_json(force=True)
    member_id = data.get("member_id")
    principal_amount = data.get("principal_amount")
    if member_id is None or principal_amount is None:
        return jsonify({"error": "member_id and principal_amount are required"}), 400
    if float(principal_amount) <= 0:
        return jsonify({"error": "principal_amount must be positive"}), 400

    existing_active = Loan.query.filter_by(member_id=member_id, status="active").first()
    if existing_active:
        return jsonify({"error": "This member already has an active EMI loan"}), 409

    loan = Loan(
        member_id=member_id,
        principal_amount=principal_amount,
        start_meeting_id=data.get("start_meeting_id"),
        current_outstanding_balance=principal_amount,
        status="active",
    )
    db.session.add(loan)
    db.session.commit()
    return jsonify(loan.to_dict()), 201


@loans_bp.post("/api/loans/<int:loan_id>/payments")
def record_loan_payment(loan_id):
    loan = Loan.query.get_or_404(loan_id)
    data = request.get_json(force=True)
    meeting_id = data.get("meeting_id")
    installment_paid = data.get("installment_paid", 0)
    interest_paid = data.get("interest_paid", 0)

    if not meeting_id:
        return jsonify({"error": "meeting_id is required"}), 400
    if float(installment_paid) < 0 or float(interest_paid) < 0:
        return jsonify({"error": "installment_paid and interest_paid cannot be negative"}), 400
    Meeting.query.get_or_404(meeting_id)
    ensure_meeting_editable(meeting_id)

    if LoanPayment.query.filter_by(loan_id=loan_id, meeting_id=meeting_id).first():
        return jsonify({"error": "A payment for this loan and meeting already exists"}), 409

    new_outstanding = float(loan.current_outstanding_balance) - float(installment_paid)
    if new_outstanding < 0:
        return jsonify({"error": "Installment exceeds outstanding balance"}), 400

    payment = LoanPayment(
        loan_id=loan_id,
        meeting_id=meeting_id,
        installment_paid=installment_paid,
        interest_paid=interest_paid,
        outstanding_balance_after=new_outstanding,
    )
    loan.current_outstanding_balance = new_outstanding
    if new_outstanding == 0:
        loan.status = "closed"

    db.session.add(payment)
    db.session.commit()
    return jsonify({"payment": payment.to_dict(), "loan": loan.to_dict()}), 201


@loans_bp.put("/api/loans/<int:loan_id>")
def update_loan(loan_id):
    loan = Loan.query.get_or_404(loan_id)
    data = request.get_json(force=True)

    if "principal_amount" in data:
        if float(data["principal_amount"]) <= 0:
            return jsonify({"error": "principal_amount must be positive"}), 400
        loan.principal_amount = data["principal_amount"]
    if "current_outstanding_balance" in data:
        if float(data["current_outstanding_balance"]) < 0:
            return jsonify({"error": "current_outstanding_balance cannot be negative"}), 400
        loan.current_outstanding_balance = data["current_outstanding_balance"]
    if "status" in data:
        if data["status"] not in ("active", "closed"):
            return jsonify({"error": "status must be 'active' or 'closed'"}), 400
        loan.status = data["status"]

    db.session.commit()
    return jsonify(loan.to_dict())


@loans_bp.put("/api/loans/<int:loan_id>/payments/<int:meeting_id>")
def update_loan_payment(loan_id, meeting_id):
    loan = Loan.query.get_or_404(loan_id)
    payment = LoanPayment.query.filter_by(loan_id=loan_id, meeting_id=meeting_id).first_or_404()
    ensure_meeting_editable(meeting_id)

    meeting = Meeting.query.get(meeting_id)
    if _has_later_payment(loan_id, meeting_id, meeting):
        return jsonify({"error": "Cannot edit a payment that has later payments recorded after it"}), 409

    data = request.get_json(force=True)
    new_installment = data.get("installment_paid", float(payment.installment_paid))
    new_interest = data.get("interest_paid", float(payment.interest_paid))
    if float(new_installment) < 0 or float(new_interest) < 0:
        return jsonify({"error": "installment_paid and interest_paid cannot be negative"}), 400

    outstanding_before_this_payment = float(loan.current_outstanding_balance) + float(payment.installment_paid)
    new_outstanding = outstanding_before_this_payment - float(new_installment)
    if new_outstanding < 0:
        return jsonify({"error": "Installment exceeds outstanding balance"}), 400

    payment.installment_paid = new_installment
    payment.interest_paid = new_interest
    payment.outstanding_balance_after = new_outstanding
    loan.current_outstanding_balance = new_outstanding
    loan.status = "closed" if new_outstanding == 0 else "active"

    db.session.commit()
    return jsonify({"payment": payment.to_dict(), "loan": loan.to_dict()})


@loans_bp.delete("/api/loans/<int:loan_id>/payments/<int:meeting_id>")
def delete_loan_payment(loan_id, meeting_id):
    loan = Loan.query.get_or_404(loan_id)
    payment = LoanPayment.query.filter_by(loan_id=loan_id, meeting_id=meeting_id).first_or_404()
    ensure_meeting_editable(meeting_id)

    meeting = Meeting.query.get(meeting_id)
    if _has_later_payment(loan_id, meeting_id, meeting):
        return jsonify({"error": "Cannot remove a payment that has later payments recorded after it"}), 409

    loan.current_outstanding_balance = float(loan.current_outstanding_balance) + float(payment.installment_paid)
    loan.status = "active"

    db.session.delete(payment)
    db.session.commit()
    return jsonify({"message": "Payment removed", "loan": loan.to_dict()})


@loans_bp.delete("/api/loans/<int:loan_id>")
def delete_loan(loan_id):
    loan = Loan.query.get_or_404(loan_id)

    finalized_payment = (
        db.session.query(LoanPayment)
        .join(Meeting, Meeting.id == LoanPayment.meeting_id)
        .filter(LoanPayment.loan_id == loan_id, Meeting.status == "finalized")
        .first()
    )
    if finalized_payment:
        return jsonify({"error": "Cannot delete a loan with payments recorded in a finalized meeting"}), 409

    LoanPayment.query.filter_by(loan_id=loan_id).delete()
    db.session.delete(loan)
    db.session.commit()
    return jsonify({"message": "Loan removed"})
