from flask import Blueprint, jsonify, request

from models import Member, Meeting
from services.ledger_service import build_ledger_row

reports_bp = Blueprint("reports", __name__)


@reports_bp.get("/api/members/<int:member_id>/history")
def member_history(member_id):
    member = Member.query.get_or_404(member_id)
    month = request.args.get("month", type=int)
    year = request.args.get("year", type=int)

    query = Meeting.query
    if month:
        query = query.filter_by(month=month)
    if year:
        query = query.filter_by(year=year)
    meetings = query.order_by(Meeting.year.desc(), Meeting.month.desc()).all()

    rows = []
    for meeting in meetings:
        row = build_ledger_row(member, meeting.id)
        row["meeting"] = meeting.to_dict()
        rows.append(row)

    return jsonify({"member": member.to_dict(), "history": rows})


@reports_bp.get("/api/reports/trust-value-trend")
def trust_value_trend():
    meetings = (
        Meeting.query.filter_by(status="finalized").order_by(Meeting.year, Meeting.month).all()
    )
    return jsonify(
        [
            {
                "meeting_id": m.id,
                "month": m.month,
                "year": m.year,
                "closing_balance": float(m.closing_balance) if m.closing_balance is not None else None,
                "trust_total_value": float(m.trust_total_value) if m.trust_total_value is not None else None,
            }
            for m in meetings
        ]
    )
