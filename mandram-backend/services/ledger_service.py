from extensions import db
from models import (
    JoiningPayment,
    Loan,
    LoanPayment,
    Meeting,
    Member,
    Penalty,
    PersonalLoan,
    ShareContribution,
)
from services.loan_service import closing_meeting_id


def _f(value):
    return float(value) if value is not None else None


def _meeting_key(meeting_id):
    """(year, month) tuple for chronological comparison, or None if unknown."""
    if meeting_id is None:
        return None
    meeting = Meeting.query.get(meeting_id)
    return (meeting.year, meeting.month) if meeting else None


def _resolve_emi_loans(member_id, this_key):
    """Every EMI loan of this member that was running in the given month.

    A loan belongs to every month from the one it was opened through the one it
    was paid off. More than one can qualify: a member may hold several loans at
    once, and a loan cleared this month sits alongside a fresh one opened the
    same month - both belong in the row. Oldest first, so "closed this month"
    reads before "given this month".
    """
    candidates = []
    for loan in Loan.query.filter_by(member_id=member_id).all():
        start_key = _meeting_key(loan.start_meeting_id)
        if start_key and this_key and start_key > this_key:
            continue  # not opened yet as of the meeting being viewed

        closed_id = closing_meeting_id(loan.id) if loan.status == "closed" else None
        closed_key = _meeting_key(closed_id)
        if closed_key and this_key and closed_key < this_key:
            continue  # already paid off before this meeting

        candidates.append((start_key or (0, 0), loan.id, loan, closed_id))

    candidates.sort(key=lambda c: (c[0], c[1]))
    return [(loan, closed_id) for _, _, loan, closed_id in candidates]


def _emi_loan_dict(loan, closed_meeting_id, meeting_id, this_key):
    """One EMI loan as it stood in this meeting."""
    just_given = loan.start_meeting_id == meeting_id
    payment = None
    if not just_given:
        payment = LoanPayment.query.filter_by(loan_id=loan.id, meeting_id=meeting_id).first()

    return {
        "loan_id": loan.id,
        "just_given": just_given,
        # True only in the month the final installment cleared the loan, so the
        # ledger can say "closed this month" instead of showing no loan at all.
        "closed_this_month": closed_meeting_id == meeting_id,
        "status": loan.status,
        "principal_amount": _f(loan.principal_amount),
        "installment_paid": _f(payment.installment_paid) if payment else None,
        "interest_paid": _f(payment.interest_paid) if payment else None,
        "outstanding_balance": _f(payment.outstanding_balance_after)
        if payment
        else _outstanding_as_of(loan, this_key),
    }


def _outstanding_as_of(loan, this_key):
    """Balance after the last payment on or before this meeting, else the principal.

    Falling back to the loan's *current* balance would report a closed loan as
    ₹0 outstanding in historical months where it was still being repaid.
    """
    latest = None
    for payment in LoanPayment.query.filter_by(loan_id=loan.id).all():
        key = _meeting_key(payment.meeting_id)
        if not key or (this_key and key > this_key):
            continue
        if latest is None or key > latest[0]:
            latest = (key, payment)

    return _f(latest[1].outstanding_balance_after) if latest else _f(loan.principal_amount)


def members_in_meeting(meeting):
    """Active members who had already joined by the month of this meeting.

    A member who joins in June belongs in June's ledger and every month after it,
    never in the months before they existed - otherwise a new member appears
    retroactively in years of history they had nothing to do with.

    Matching is by (year, month), not by exact date: someone who joined on the 14th
    still belongs in that month's row even though the meeting was held on the 4th.
    A member with no `joined_date` recorded is treated as always present, since
    there is nothing to exclude them by.
    """
    this_key = (meeting.year, meeting.month)
    with_data = _members_with_data_in(meeting.id)
    return [
        m
        for m in Member.query.filter_by(is_active=True).order_by(Member.name).all()
        if not m.joined_date
        or (m.joined_date.year, m.joined_date.month) <= this_key
        or m.id in with_data
    ]


def _members_with_data_in(meeting_id):
    """Member ids with anything recorded against this meeting.

    A safety net for the joining-month rule above: a member is never hidden from a
    month where money is already booked against them, even if that month predates
    their joining date. Without it, a mis-dated entry would keep counting toward the
    month's income and balance while disappearing from the screen - impossible to
    spot, impossible to correct. Seeing the row is what lets it be fixed.
    """
    ids = set()
    queries = (
        db.session.query(ShareContribution.member_id).filter_by(meeting_id=meeting_id),
        db.session.query(Penalty.member_id).filter_by(meeting_id=meeting_id),
        db.session.query(JoiningPayment.member_id).filter_by(meeting_id=meeting_id),
        db.session.query(Loan.member_id).filter_by(start_meeting_id=meeting_id),
        db.session.query(PersonalLoan.member_id).filter_by(disbursed_meeting_id=meeting_id),
        db.session.query(PersonalLoan.member_id).filter_by(repaid_meeting_id=meeting_id),
        db.session.query(Loan.member_id)
        .join(LoanPayment, LoanPayment.loan_id == Loan.id)
        .filter(LoanPayment.meeting_id == meeting_id),
    )
    for query in queries:
        ids.update(row[0] for row in query.all())
    return ids


def build_ledger_row(member: Member, meeting_id: int):
    """Sheet-1 equivalent row: one member's ledger entry for one meeting.

    Loan and personal-loan activity is scoped chronologically by (year, month): a loan
    taken in a later meeting must never appear in an earlier meeting's row, and a loan's
    effects only ever show up from its own month onward.
    """
    this_key = _meeting_key(meeting_id)

    contribution = ShareContribution.query.filter_by(member_id=member.id, meeting_id=meeting_id).first()

    emi_loans = [
        _emi_loan_dict(loan, closed_id, meeting_id, this_key)
        for loan, closed_id in _resolve_emi_loans(member.id, this_key)
    ]

    personal_loan_repaid = PersonalLoan.query.filter_by(
        member_id=member.id, repaid_meeting_id=meeting_id
    ).first()

    personal_loan_new = PersonalLoan.query.filter_by(
        member_id=member.id, disbursed_meeting_id=meeting_id
    ).first()
    if personal_loan_new and personal_loan_repaid and personal_loan_new.id == personal_loan_repaid.id:
        # Same loan disbursed and repaid within this meeting - the "repaid" block already covers it.
        personal_loan_new = None

    # "Pending" is a statement about the month being viewed, not about today: a loan
    # disbursed in June and repaid in September was genuinely pending in July and
    # August. Filtering on status == "outstanding" erased those months the moment it
    # was repaid, so match the window instead - after disbursement, before repayment.
    personal_loan_pending = None
    for candidate in PersonalLoan.query.filter_by(member_id=member.id).all():
        if candidate.disbursed_meeting_id == meeting_id:
            continue  # that's "new", not "pending"
        if candidate.repaid_meeting_id == meeting_id:
            continue  # that's "repaid", not "pending"

        disbursed_key = _meeting_key(candidate.disbursed_meeting_id)
        if not (disbursed_key and this_key and disbursed_key < this_key):
            continue

        repaid_key = _meeting_key(candidate.repaid_meeting_id)
        if repaid_key and repaid_key < this_key:
            continue  # already settled before the month being viewed

        personal_loan_pending = candidate
        break

    penalties = Penalty.query.filter_by(member_id=member.id, meeting_id=meeting_id).all()

    return {
        "member_id": member.id,
        "member_name": member.name,
        "share_amount": _f(contribution.amount) if contribution else None,
        # A list: a member can hold several loans in one month (§6).
        "emi_loans": emi_loans,
        "personal_loan_repaid": {
            "personal_loan_id": personal_loan_repaid.id,
            "amount": _f(personal_loan_repaid.amount),
            "interest_amount": _f(personal_loan_repaid.interest_amount),
        }
        if personal_loan_repaid
        else None,
        "personal_loan_new": {
            "personal_loan_id": personal_loan_new.id,
            "amount": _f(personal_loan_new.amount),
        }
        if personal_loan_new
        else None,
        "personal_loan_pending": {
            "personal_loan_id": personal_loan_pending.id,
            "amount": _f(personal_loan_pending.amount),
        }
        if personal_loan_pending
        else None,
        "penalties": [{"id": p.id, "amount": _f(p.amount), "reason": p.reason} for p in penalties],
    }
