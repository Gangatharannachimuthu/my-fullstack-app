from models import Loan, LoanPayment, Member, Penalty, PersonalLoan, ShareContribution


def _f(value):
    return float(value) if value is not None else None


def build_ledger_row(member: Member, meeting_id: int):
    """Sheet-1 equivalent row: one member's ledger entry for one meeting."""
    contribution = ShareContribution.query.filter_by(member_id=member.id, meeting_id=meeting_id).first()

    active_loan = Loan.query.filter_by(member_id=member.id, status="active").first()
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

    personal_loan_pending = (
        PersonalLoan.query.filter_by(member_id=member.id, status="outstanding")
        .filter(PersonalLoan.disbursed_meeting_id != meeting_id)
        .first()
    )

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
