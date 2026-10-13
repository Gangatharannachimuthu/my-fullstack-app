"""Composes the per-member loan reminder text sent from the Member Ledger.

Deliberately channel-agnostic: it produces the message and a dialable number and
stops there. The Member Ledger currently hands that to a wa.me link so the admin
sends it from their own WhatsApp (free, no account), but dropping in an SMS or
WhatsApp Business provider later means calling a sender with this same output -
no message-building code has to change.
"""

from models import LoanPayment, Meeting, PersonalLoan
from services.ledger_service import (
    _meeting_key,
    _outstanding_as_of,
    _resolve_emi_loans,
    members_in_meeting,
)

MONTH_NAMES = [
    "",
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
]


def _month_label(meeting_id):
    meeting = Meeting.query.get(meeting_id) if meeting_id else None
    if not meeting:
        return "unknown month"
    return f"{MONTH_NAMES[meeting.month]} {meeting.year}"


def _rupees(value):
    return f"Rs.{float(value or 0):,.2f}"


def normalize_phone(phone, country_code="91"):
    """A bare dialable number for wa.me: digits only, with the country code.

    Members are stored as plain 10-digit Indian mobiles, but tolerate +91, spaces,
    dashes and a leading 0 so a hand-typed number still works. Returns None when
    there is nothing usable to dial.
    """
    if not phone:
        return None

    digits = "".join(ch for ch in str(phone) if ch.isdigit())
    if not digits:
        return None

    if digits.startswith("00"):
        digits = digits[2:]
    if len(digits) == 11 and digits.startswith("0"):
        digits = digits[1:]  # domestic trunk prefix

    if len(digits) == 10:
        return country_code + digits
    if len(digits) > 10:
        return digits  # already carries a country code
    return None  # too short to dial


def _emi_history(loan_id, this_key):
    """Totals paid on an EMI loan up to and including the month being reported,
    plus this month's own payment. History, not present-day state, so a reminder
    sent for an old meeting reports that meeting's position."""
    paid_principal = 0.0
    paid_interest = 0.0
    for payment in LoanPayment.query.filter_by(loan_id=loan_id).all():
        key = _meeting_key(payment.meeting_id)
        if not key or (this_key and key > this_key):
            continue
        paid_principal += float(payment.installment_paid or 0)
        paid_interest += float(payment.interest_paid or 0)
    return paid_principal, paid_interest


def build_member_reminder(member, meeting):
    """The reminder text for one member as of one meeting.

    Returns (message, has_loan_activity). When the member has no loan running that
    month there is nothing to chase, so the message is None.
    """
    this_key = (meeting.year, meeting.month)
    as_of = f"{MONTH_NAMES[meeting.month]} {meeting.year}"

    blocks = []

    for loan, closed_id in _resolve_emi_loans(member.id, this_key):
        paid_principal, paid_interest = _emi_history(loan.id, this_key)
        this_month = LoanPayment.query.filter_by(loan_id=loan.id, meeting_id=meeting.id).first()
        outstanding = _outstanding_as_of(loan, this_key)

        lines = [
            "EMI LOAN",
            f"  Loan taken in : {_month_label(loan.start_meeting_id)}",
            f"  Loan amount   : {_rupees(loan.principal_amount)}",
            f"  Paid so far   : {_rupees(paid_principal)}",
            f"  Interest paid : {_rupees(paid_interest)}",
        ]
        if this_month:
            lines.append(f"  This month    : {_rupees(this_month.installment_paid)} "
                         f"+ {_rupees(this_month.interest_paid)} interest")
        elif loan.start_meeting_id == meeting.id:
            lines.append("  This month    : loan just given, first payment due next meeting")
        else:
            lines.append("  This month    : not yet paid")

        if closed_id == meeting.id:
            lines.append("  Balance       : NIL - loan fully closed. Thank you!")
        else:
            lines.append(f"  Balance to pay: {_rupees(outstanding)}")
        blocks.append("\n".join(lines))

    for loan in PersonalLoan.query.filter_by(member_id=member.id).all():
        disbursed_key = _meeting_key(loan.disbursed_meeting_id)
        if not disbursed_key or disbursed_key > this_key:
            continue  # not given yet as of this meeting
        repaid_key = _meeting_key(loan.repaid_meeting_id)
        if repaid_key and repaid_key < this_key:
            continue  # settled before this meeting

        lines = [
            "PERSONAL LOAN",
            f"  Loan given in : {_month_label(loan.disbursed_meeting_id)}",
            f"  Loan amount   : {_rupees(loan.amount)}",
        ]
        if loan.interest_amount:
            lines.append(f"  Interest      : {_rupees(loan.interest_amount)}")

        if repaid_key and repaid_key == this_key:
            lines.append("  Status        : repaid in full this month. Thank you!")
        else:
            total_due = float(loan.amount or 0) + float(loan.interest_amount or 0)
            lines.append(f"  To repay      : {_rupees(total_due)} (principal + interest)")
        blocks.append("\n".join(lines))

    if not blocks:
        return None, False

    message = (
        f"Masiriyamman Mandram - Loan Statement\n"
        f"Member: {member.name}\n"
        f"As of : {as_of}\n\n"
        + "\n\n".join(blocks)
        + "\n\nPlease bring the due amount to the next meeting.\nThank you."
    )
    return message, True


def build_loan_reminders(meeting_id):
    """One entry per member for the given meeting, in ledger order.

    Members with no loan running that month are still returned, flagged
    has_loan_activity=False, so the admin can see who was skipped rather than
    wondering whether someone was quietly dropped. Members who had not joined yet
    are excluded entirely - the same rule the ledger uses, so the reminder list
    always matches the rows on screen.
    """
    meeting = Meeting.query.get(meeting_id)
    if not meeting:
        return None

    reminders = []
    for member in members_in_meeting(meeting):
        message, has_activity = build_member_reminder(member, meeting)
        reminders.append(
            {
                "member_id": member.id,
                "member_name": member.name,
                "phone": member.phone,
                "phone_dialable": normalize_phone(member.phone),
                "has_loan_activity": has_activity,
                "message": message,
            }
        )
    return reminders
