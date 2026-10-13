"""Joining dues: what a late-joining member owes to buy into an established fund.

Kept separate from share contributions on purpose. The monthly share keeps every
member level going *forward*; the joining due settles the *past* - the member's
equal share of what the group had already built before they arrived. Mixing the two
would make it impossible to tell whether someone had actually cleared their buy-in.
"""

from decimal import Decimal

from extensions import db
from models import JoiningDue, JoiningPayment, Meeting, Member


def _paid_total(member_id, upto_meeting_id=None):
    """Everything paid toward the due, optionally only up to a given meeting."""
    query = db.session.query(db.func.coalesce(db.func.sum(JoiningPayment.amount), 0)).filter(
        JoiningPayment.member_id == member_id
    )
    if upto_meeting_id is not None:
        meeting = Meeting.query.get(upto_meeting_id)
        if meeting:
            query = query.join(Meeting, Meeting.id == JoiningPayment.meeting_id).filter(
                (Meeting.year < meeting.year)
                | ((Meeting.year == meeting.year) & (Meeting.month <= meeting.month))
            )
    return Decimal(query.scalar() or 0)


def joining_status(member_id, upto_meeting_id=None):
    """Where a member stands on their joining due.

    Returns None when the member has no due at all, which is the normal case for
    founding members - callers treat that as "nothing owed, no restriction".
    """
    due = JoiningDue.query.filter_by(member_id=member_id).first()
    if not due:
        return None

    total = Decimal(due.total_amount or 0)
    paid = _paid_total(member_id, upto_meeting_id)
    remaining = total - paid
    if remaining < 0:
        remaining = Decimal(0)  # overpaid; treat as settled rather than negative

    return {
        "due_id": due.id,
        "member_id": member_id,
        "total_amount": float(total),
        "paid": float(paid),
        "remaining": float(remaining),
        "is_cleared": remaining <= 0,
        "basis_meeting_id": due.basis_meeting_id,
        "note": due.note,
    }


def outstanding_joining_due(member_id):
    """Decimal still owed. Zero when there is no due or it is fully paid."""
    status = joining_status(member_id)
    return Decimal(str(status["remaining"])) if status else Decimal(0)


def blocking_message(member_id):
    """Why a member may not borrow yet, or None if they may.

    Loan eligibility is the whole point of tracking the due: until a member has
    bought in, the money they would borrow is mostly the other members' capital.
    """
    status = joining_status(member_id)
    if not status or status["is_cleared"]:
        return None
    return (
        f"This member has not cleared their joining contribution - "
        f"Rs.{status['remaining']:,.2f} of Rs.{status['total_amount']:,.2f} is still outstanding. "
        f"They become eligible for loans once it is fully paid."
    )


def suggest_joining_amount(member_id):
    """Work out what a member should pay to buy in, from their joining date.

    Basis is the last meeting held in a month *strictly before* the month they
    joined - what the fund was worth before they arrived. That figure is divided by
    the members who had already joined by then: the existing per-member stake.
    Dividing by the new headcount instead would quietly dilute the existing members
    (see the "Joining contribution" section of MANDRAM-APP-FLOW.md).

    Returns a dict showing its working so the admin can see *why* the number is what
    it is, or a dict with `applicable: False` and a reason when it cannot be derived.
    """
    # Imported here rather than at module scope: summary_service is the heavier
    # module and only this one function needs it.
    from services.summary_service import compute_summary

    member = Member.query.get(member_id)
    if not member:
        return None
    if not member.joined_date:
        return {
            "applicable": False,
            "reason": "This member has no joining date set, so there is no month to value the fund at.",
        }

    join_key = (member.joined_date.year, member.joined_date.month)

    basis = (
        Meeting.query.filter(
            (Meeting.year < join_key[0])
            | ((Meeting.year == join_key[0]) & (Meeting.month < join_key[1]))
        )
        .order_by(Meeting.year.desc(), Meeting.month.desc())
        .first()
    )
    if not basis:
        return {
            "applicable": False,
            "reason": (
                "No meeting exists before this member joined - they were there from the "
                "start, so there is nothing to buy into."
            ),
        }

    basis_key = (basis.year, basis.month)

    # Everyone whose joining month is on or before the basis month: the people who
    # had built the fund by that point.
    existing = [
        m
        for m in Member.query.all()
        if m.joined_date and (m.joined_date.year, m.joined_date.month) <= basis_key
    ]
    if not existing:
        return {
            "applicable": False,
            "reason": "No other member had joined by then, so there is no stake to match.",
        }

    summary = compute_summary(basis.id)
    net_worth = Decimal(str(summary["trust_total_value"]))
    count = len(existing)
    suggested = net_worth / count

    return {
        "applicable": True,
        "member_id": member_id,
        "member_name": member.name,
        "joined_date": member.joined_date.isoformat(),
        "basis_meeting_id": basis.id,
        "basis_label": f"{basis.month}/{basis.year}",
        "net_worth": float(net_worth),
        "cash": summary["closing_balance"],
        "loans_out": summary["outstanding_emi_loans"] + summary["outstanding_personal_loans"],
        "investments_held": summary["investments_held"],
        "member_count": count,
        "member_names": [m.name for m in existing],
        "suggested_amount": float(round(suggested, 2)),
        "working": (
            f"Rs.{float(net_worth):,.2f} (fund value at {basis.month}/{basis.year}) "
            f"/ {count} members = Rs.{float(suggested):,.2f}"
        ),
    }
