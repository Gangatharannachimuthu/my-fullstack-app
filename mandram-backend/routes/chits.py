from datetime import datetime

from flask import Blueprint, jsonify, request

from extensions import db
from models import Chit, InvestmentEntry, Meeting
from services.guards import ensure_meeting_editable

chits_bp = Blueprint("chits", __name__)


def _commission_by_chit(chit_ids):
    """Lifetime commission per chit: the sum of every Investments entry linked to it.

    One grouped query for the whole list rather than a query per row. Chits with no
    linked entries simply don't come back, so callers default them to 0.
    """
    if not chit_ids:
        return {}
    rows = (
        db.session.query(
            InvestmentEntry.chit_id,
            db.func.coalesce(db.func.sum(InvestmentEntry.commission_amount), 0),
        )
        .filter(InvestmentEntry.chit_id.in_(chit_ids))
        .group_by(InvestmentEntry.chit_id)
        .all()
    )
    return {chit_id: float(total or 0) for chit_id, total in rows}


def _payload(chits):
    """Chit dicts with `total_commission` folded in (display only - it never feeds
    the Balance Roll-Forward, which already counts commission month by month)."""
    commissions = _commission_by_chit([c.id for c in chits])
    result = []
    for chit in chits:
        data = chit.to_dict()
        data["total_commission"] = commissions.get(chit.id, 0.0)
        result.append(data)
    return result


def _parse_initiate_date(value):
    """Optional YYYY-MM-DD. Returns (date_or_None, error)."""
    if value in (None, ""):
        return None, None
    try:
        return datetime.strptime(value, "%Y-%m-%d").date(), None
    except (ValueError, TypeError):
        return None, "initiate_date must be in YYYY-MM-DD format"


def _validate(host_name, agent_amount, auction_count, amount_taken):
    """Shared field checks. Returns an error string, or None when the values are fine."""
    if not host_name:
        return "host_name is required"
    if agent_amount is None or float(agent_amount) < 0:
        return "agent_amount must be zero or more"
    if auction_count is None or int(auction_count) < 0:
        return "auction_count must be zero or more"
    if amount_taken is None or float(amount_taken) < 0:
        return "amount_taken must be zero or more"
    return None


@chits_bp.get("/api/chits")
def list_chits():
    """Every chit, newest meeting first. The tab is a register across all months,
    so this is not scoped to one meeting; ?meeting_id= and ?year= narrow it."""
    query = Chit.query.join(Meeting, Meeting.id == Chit.meeting_id)

    meeting_id = request.args.get("meeting_id")
    if meeting_id:
        query = query.filter(Chit.meeting_id == int(meeting_id))

    year = request.args.get("year")
    if year:
        query = query.filter(Meeting.year == int(year))

    chits = query.order_by(Meeting.year.desc(), Meeting.month.desc(), Chit.id.desc()).all()
    return jsonify(_payload(chits))


@chits_bp.get("/api/meetings/<int:meeting_id>/chits")
def list_meeting_chits(meeting_id):
    Meeting.query.get_or_404(meeting_id)
    chits = Chit.query.filter_by(meeting_id=meeting_id).order_by(Chit.id.desc()).all()
    return jsonify(_payload(chits))


@chits_bp.post("/api/chits")
def create_chit():
    data = request.get_json(force=True)

    meeting_id = data.get("meeting_id")
    if not meeting_id:
        return jsonify({"error": "meeting_id is required"}), 400
    Meeting.query.get_or_404(meeting_id)

    host_name = (data.get("host_name") or "").strip()
    agent_amount = data.get("agent_amount") or 0
    auction_count = data.get("auction_count") or 0
    amount_taken = data.get("amount_taken") or 0

    error = _validate(host_name, agent_amount, auction_count, amount_taken)
    if error:
        return jsonify({"error": error}), 400

    initiate_date, date_error = _parse_initiate_date(data.get("initiate_date"))
    if date_error:
        return jsonify({"error": date_error}), 400

    ensure_meeting_editable(meeting_id)

    chit = Chit(
        meeting_id=meeting_id,
        initiate_date=initiate_date,
        host_name=host_name,
        agent_amount=agent_amount,
        auction_count=auction_count,
        amount_taken=amount_taken,
        note=data.get("note"),
    )
    db.session.add(chit)
    db.session.commit()
    return jsonify(_payload([chit])[0]), 201


@chits_bp.put("/api/chits/<int:chit_id>")
def update_chit(chit_id):
    chit = Chit.query.get_or_404(chit_id)
    ensure_meeting_editable(chit.meeting_id)

    data = request.get_json(force=True)

    if "meeting_id" in data and data["meeting_id"] != chit.meeting_id:
        Meeting.query.get_or_404(data["meeting_id"])
        # Moving a chit re-points the money, so the destination month must be open too.
        ensure_meeting_editable(data["meeting_id"])
        chit.meeting_id = data["meeting_id"]

    host_name = (data.get("host_name", chit.host_name) or "").strip()
    agent_amount = data.get("agent_amount", chit.agent_amount)
    auction_count = data.get("auction_count", chit.auction_count)
    amount_taken = data.get("amount_taken", chit.amount_taken)

    error = _validate(host_name, agent_amount, auction_count, amount_taken)
    if error:
        return jsonify({"error": error}), 400

    if "initiate_date" in data:
        initiate_date, date_error = _parse_initiate_date(data["initiate_date"])
        if date_error:
            return jsonify({"error": date_error}), 400
        chit.initiate_date = initiate_date

    chit.host_name = host_name
    chit.agent_amount = agent_amount
    chit.auction_count = auction_count
    chit.amount_taken = amount_taken
    if "note" in data:
        chit.note = data["note"]

    db.session.commit()
    return jsonify(_payload([chit])[0])


@chits_bp.delete("/api/chits/<int:chit_id>")
def delete_chit(chit_id):
    chit = Chit.query.get_or_404(chit_id)
    ensure_meeting_editable(chit.meeting_id)

    # Investment entries linked to this chit are real cash records in their own right,
    # so they are unlinked rather than deleted - and unlinking first is also what keeps
    # the FK from rejecting the delete.
    unlinked = InvestmentEntry.query.filter_by(chit_id=chit_id).update(
        {"chit_id": None}, synchronize_session=False
    )

    db.session.delete(chit)
    db.session.commit()
    return jsonify(
        {
            "message": "Chit removed",
            "unlinked_investment_entries": unlinked,
        }
    )
