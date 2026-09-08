from datetime import datetime

from flask import Blueprint, jsonify, request

from extensions import db
from models import (
    ExpenditureEntry,
    InvestmentEntry,
    LoanPayment,
    Member,
    Meeting,
    Penalty,
    PersonalLoan,
    ShareContribution,
)
from services.guards import ensure_meeting_editable
from services.ledger_service import build_ledger_row
from services.summary_service import compute_summary, finalize_meeting, resolve_opening_balance

meetings_bp = Blueprint("meetings", __name__)


def _meeting_dict(meeting):
    data = meeting.to_dict()
    data["opening_balance"] = float(resolve_opening_balance(meeting))
    return data


@meetings_bp.get("/api/meetings")
def list_meetings():
    meetings = Meeting.query.order_by(Meeting.year.desc(), Meeting.month.desc()).all()
    return jsonify([_meeting_dict(m) for m in meetings])


@meetings_bp.post("/api/meetings")
def create_meeting():
    data = request.get_json(force=True)
    meeting_date_str = data.get("meeting_date")
    if not meeting_date_str:
        return jsonify({"error": "meeting_date is required"}), 400

    meeting_date = datetime.strptime(meeting_date_str, "%Y-%m-%d").date()
    month = data.get("month", meeting_date.month)
    year = data.get("year", meeting_date.year)

    existing = Meeting.query.filter_by(month=month, year=year).first()
    if existing:
        return jsonify({"error": f"A meeting for {month}/{year} already exists"}), 409

    meeting = Meeting(
        meeting_date=meeting_date,
        month=month,
        year=year,
        opening_balance=0,
        status="draft",
        notes=data.get("notes"),
    )
    db.session.add(meeting)
    db.session.commit()
    return jsonify(_meeting_dict(meeting)), 201


@meetings_bp.get("/api/meetings/<int:meeting_id>")
def get_meeting(meeting_id):
    meeting = Meeting.query.get_or_404(meeting_id)
    return jsonify(_meeting_dict(meeting))


@meetings_bp.put("/api/meetings/<int:meeting_id>")
def update_meeting(meeting_id):
    meeting = Meeting.query.get_or_404(meeting_id)
    data = request.get_json(force=True)

    if "notes" in data:
        meeting.notes = data["notes"]

    if "meeting_date" in data:
        if meeting.status == "finalized":
            return jsonify({"error": "Cannot change the date of a finalized meeting"}), 409
        new_date = datetime.strptime(data["meeting_date"], "%Y-%m-%d").date()
        new_month, new_year = new_date.month, new_date.year
        conflict = Meeting.query.filter(
            Meeting.month == new_month, Meeting.year == new_year, Meeting.id != meeting_id
        ).first()
        if conflict:
            return jsonify({"error": f"A meeting for {new_month}/{new_year} already exists"}), 409
        meeting.meeting_date = new_date
        meeting.month = new_month
        meeting.year = new_year

    db.session.commit()
    return jsonify(_meeting_dict(meeting))


@meetings_bp.delete("/api/meetings/<int:meeting_id>")
def delete_meeting(meeting_id):
    meeting = Meeting.query.get_or_404(meeting_id)
    if meeting.status == "finalized":
        return jsonify({"error": "Cannot delete a finalized meeting"}), 409

    has_data = (
        ShareContribution.query.filter_by(meeting_id=meeting_id).first()
        or LoanPayment.query.filter_by(meeting_id=meeting_id).first()
        or PersonalLoan.query.filter(
            (PersonalLoan.disbursed_meeting_id == meeting_id) | (PersonalLoan.repaid_meeting_id == meeting_id)
        ).first()
        or Penalty.query.filter_by(meeting_id=meeting_id).first()
        or ExpenditureEntry.query.filter_by(meeting_id=meeting_id).first()
        or InvestmentEntry.query.filter_by(meeting_id=meeting_id).first()
    )
    if has_data:
        return jsonify(
            {"error": "Cannot delete a meeting with recorded ledger entries. Remove them first."}
        ), 409

    db.session.delete(meeting)
    db.session.commit()
    return jsonify({"message": "Meeting removed"})


@meetings_bp.get("/api/meetings/<int:meeting_id>/ledger")
def get_meeting_ledger(meeting_id):
    meeting = Meeting.query.get_or_404(meeting_id)
    members = Member.query.filter_by(is_active=True).order_by(Member.name).all()
    rows = [build_ledger_row(member, meeting.id) for member in members]
    return jsonify({"meeting": _meeting_dict(meeting), "rows": rows})


@meetings_bp.post("/api/meetings/<int:meeting_id>/share-contributions")
def upsert_share_contribution(meeting_id):
    Meeting.query.get_or_404(meeting_id)
    ensure_meeting_editable(meeting_id)
    data = request.get_json(force=True)
    member_id = data.get("member_id")
    amount = data.get("amount")
    if member_id is None or amount is None:
        return jsonify({"error": "member_id and amount are required"}), 400
    if float(amount) < 0:
        return jsonify({"error": "amount cannot be negative"}), 400

    contribution = ShareContribution.query.filter_by(member_id=member_id, meeting_id=meeting_id).first()
    if contribution:
        contribution.amount = amount
    else:
        contribution = ShareContribution(member_id=member_id, meeting_id=meeting_id, amount=amount)
        db.session.add(contribution)
    db.session.commit()
    return jsonify(contribution.to_dict()), 200


@meetings_bp.get("/api/meetings/<int:meeting_id>/summary")
def get_meeting_summary(meeting_id):
    Meeting.query.get_or_404(meeting_id)
    summary = compute_summary(meeting_id)
    return jsonify(summary)


@meetings_bp.post("/api/meetings/<int:meeting_id>/finalize")
def finalize(meeting_id):
    meeting = Meeting.query.get_or_404(meeting_id)
    if meeting.status == "finalized":
        return jsonify({"error": "Meeting is already finalized"}), 409
    meeting = finalize_meeting(meeting_id)
    return jsonify(_meeting_dict(meeting))
