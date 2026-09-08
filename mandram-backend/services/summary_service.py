from decimal import Decimal

from extensions import db
from models import (
    ExpenditureEntry,
    InvestmentEntry,
    Loan,
    LoanPayment,
    Meeting,
    OtherIncomeEntry,
    PersonalLoan,
    ShareContribution,
)


def find_previous_meeting(meeting):
    return (
        Meeting.query.filter(
            (Meeting.year < meeting.year) | ((Meeting.year == meeting.year) & (Meeting.month < meeting.month))
        )
        .order_by(Meeting.year.desc(), Meeting.month.desc())
        .first()
    )


def resolve_opening_balance(meeting):
    """The running opening balance for a meeting: the previous meeting's closing
    balance if it's finalized (frozen), otherwise its live-computed closing balance
    (since drafts can still change), or 0 if there is no previous meeting."""
    if meeting.status == "finalized":
        return Decimal(meeting.opening_balance or 0)

    previous_meeting = find_previous_meeting(meeting)
    if not previous_meeting:
        return Decimal(0)
    if previous_meeting.status == "finalized":
        return Decimal(previous_meeting.closing_balance or 0)
    return Decimal(str(compute_summary(previous_meeting.id)["closing_balance"]))


def compute_summary(meeting_id):
    meeting = Meeting.query.get(meeting_id)
    if not meeting:
        return None

    opening_balance = resolve_opening_balance(meeting)

    total_share_income = _sum_col(ShareContribution.amount, ShareContribution.meeting_id == meeting_id)
    total_emi_interest = _sum_col(LoanPayment.interest_paid, LoanPayment.meeting_id == meeting_id)
    total_personal_loan_interest = _sum_col(
        PersonalLoan.interest_amount, PersonalLoan.repaid_meeting_id == meeting_id
    )
    other_income = _sum_col(OtherIncomeEntry.amount, OtherIncomeEntry.meeting_id == meeting_id)

    total_income = total_share_income + total_emi_interest + total_personal_loan_interest + other_income

    total_expenditure = _sum_col(ExpenditureEntry.amount, ExpenditureEntry.meeting_id == meeting_id)
    net_income = total_income - total_expenditure

    emi_principal_collected = _sum_col(LoanPayment.installment_paid, LoanPayment.meeting_id == meeting_id)
    personal_loan_collected = _sum_col(PersonalLoan.amount, PersonalLoan.repaid_meeting_id == meeting_id)
    new_personal_loans_disbursed = _sum_col(
        PersonalLoan.amount, PersonalLoan.disbursed_meeting_id == meeting_id
    )
    new_emi_loans_disbursed = _sum_col(Loan.principal_amount, Loan.start_meeting_id == meeting_id)
    total_investment_outflow = _sum_col(InvestmentEntry.amount, InvestmentEntry.meeting_id == meeting_id)

    closing_balance = (
        opening_balance
        + net_income
        + emi_principal_collected
        + personal_loan_collected
        - new_personal_loans_disbursed
        - new_emi_loans_disbursed
        - total_investment_outflow
    )

    outstanding_emi_loans = _sum_col(Loan.current_outstanding_balance, Loan.status == "active")
    outstanding_personal_loans = _sum_col(PersonalLoan.amount, PersonalLoan.status == "outstanding")
    trust_total_value = closing_balance

    return {
        "meeting_id": meeting_id,
        "opening_balance": float(opening_balance),
        "income": {
            "share_income": float(total_share_income),
            "emi_loan_interest": float(total_emi_interest),
            "personal_loan_interest": float(total_personal_loan_interest),
            "other_income": float(other_income),
            "total_income": float(total_income),
        },
        "expenditure": {
            "total_expenditure": float(total_expenditure),
        },
        "net_income": float(net_income),
        "collections": {
            "emi_principal_collected": float(emi_principal_collected),
            "personal_loan_collected": float(personal_loan_collected),
        },
        "new_personal_loans_disbursed": float(new_personal_loans_disbursed),
        "new_emi_loans_disbursed": float(new_emi_loans_disbursed),
        "total_investment_outflow": float(total_investment_outflow),
        "closing_balance": float(closing_balance),
        "outstanding_emi_loans": float(outstanding_emi_loans),
        "outstanding_personal_loans": float(outstanding_personal_loans),
        "trust_total_value": float(trust_total_value),
    }


def _sum_col(column, condition):
    result = db.session.query(db.func.coalesce(db.func.sum(column), 0)).filter(condition).scalar()
    return Decimal(result or 0)


def finalize_meeting(meeting_id):
    meeting = Meeting.query.get(meeting_id)
    if not meeting:
        return None
    if meeting.status == "finalized":
        return meeting

    summary = compute_summary(meeting_id)
    meeting.opening_balance = summary["opening_balance"]
    meeting.closing_balance = summary["closing_balance"]
    meeting.trust_total_value = summary["trust_total_value"]
    meeting.status = "finalized"
    db.session.commit()
    return meeting
