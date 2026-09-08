from models import Loan, LoanPayment, Meeting, Member, Penalty, PersonalLoan, ShareContribution


def _f(value):
    return float(value) if value is not None else None


def _meeting_key(meeting_id):
    """(year, month) tuple for chronological comparison, or None if unknown."""
    if meeting_id is None:
        return None
    meeting = Meeting.query.get(meeting_id)
    return (meeting.year, meeting.month) if meeting else None


def build_ledger_row(member: Member, meeting_id: int):
    """Sheet-1 equivalent row: one member's ledger entry for one meeting.

    Loan and personal-loan activity is scoped chronologically by (year, month): a loan
    taken in a later meeting must never appear in an earlier meeting's row, and a loan's
    effects only ever show up from its own month onward.
    """
    this_key = _meeting_key(meeting_id)

    contribution = ShareContribution.query.filter_by(member_id=member.id, meeting_id=meeting_id).first()

    active_loan = Loan.query.filter_by(member_id=member.id, status="active").first()
    if active_loan and active_loan.start_meeting_id:
        start_key = _meeting_key(active_loan.start_meeting_id)
        if start_key and this_key and start_key > this_key:
            # This loan didn't exist yet as of the meeting being viewed.
            active_loan = None

    loan_payment = None
    just_given_emi = False
    if active_loan:
        just_given_emi = active_loan.start_meeting_id == meeting_id
        if not just_given_emi:
            loan_payment = LoanPayment.query.filter_by(loan_id=active_loan.id, meeting_id=meeting_id).first()

    personal_loan_repaid = PersonalLoan.query.filter_by(
        member_id=member.id, repaid_meeting_id=meeting_id
    ).first()

    personal_loan_new = PersonalLoan.query.filter_by(
        member_id=member.id, disbursed_meeting_id=meeting_id
    ).first()
    if personal_loan_new and personal_loan_repaid and personal_loan_new.id == personal_loan_repaid.id:
        # Same loan disbursed and repaid within this meeting - the "repaid" block already covers it.
        personal_loan_new = None

    personal_loan_pending = None
    for candidate in PersonalLoan.query.filter_by(member_id=member.id, status="outstanding").all():
        if candidate.disbursed_meeting_id == meeting_id:
            continue  # that's "new", not "pending"
        disbursed_key = _meeting_key(candidate.disbursed_meeting_id)
        if disbursed_key and this_key and disbursed_key < this_key:
            personal_loan_pending = candidate
            break

    penalties = Penalty.query.filter_by(member_id=member.id, meeting_id=meeting_id).all()

    return {
        "member_id": member.id,
        "member_name": member.name,
        "share_amount": _f(contribution.amount) if contribution else None,
        "emi_loan": {
            "loan_id": active_loan.id if active_loan else None,
            "just_given": just_given_emi,
            "principal_amount": _f(active_loan.principal_amount) if active_loan else None,
            "installment_paid": _f(loan_payment.installment_paid) if loan_payment else None,
            "interest_paid": _f(loan_payment.interest_paid) if loan_payment else None,
            "outstanding_balance": _f(
                loan_payment.outstanding_balance_after
                if loan_payment
                else (active_loan.current_outstanding_balance if active_loan else None)
            ),
        }
        if active_loan
        else None,
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
