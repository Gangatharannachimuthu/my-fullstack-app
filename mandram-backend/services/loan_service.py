from extensions import db
from models import LoanPayment, Meeting


def closing_meeting_ids(loan_ids):
    """Map loan_id -> the meeting whose payment cleared the balance.

    Derived from `loan_payments` rather than stored on the loan, so it stays
    correct when a payment is edited or removed and the loan reopens. A loan
    closed by hand (status flipped with no settling payment) is absent from the
    result - there is no month to attribute the closure to.
    """
    if not loan_ids:
        return {}

    rows = (
        db.session.query(LoanPayment.loan_id, LoanPayment.meeting_id, Meeting.year, Meeting.month)
        .join(Meeting, Meeting.id == LoanPayment.meeting_id)
        .filter(LoanPayment.loan_id.in_(loan_ids), LoanPayment.outstanding_balance_after == 0)
        .all()
    )

    latest = {}
    for loan_id, meeting_id, year, month in rows:
        key = (year, month)
        if loan_id not in latest or key > latest[loan_id][0]:
            latest[loan_id] = (key, meeting_id)
    return {loan_id: meeting_id for loan_id, (_, meeting_id) in latest.items()}


def closing_meeting_id(loan_id):
    """The single meeting that closed this loan, or None if it is still running."""
    return closing_meeting_ids([loan_id]).get(loan_id)
