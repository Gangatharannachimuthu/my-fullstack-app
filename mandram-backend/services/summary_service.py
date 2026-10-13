from decimal import Decimal

from extensions import db
from models import (
    Chit,
    ExpenditureEntry,
    InvestmentEntry,
    JoiningPayment,
    Loan,
    LoanPayment,
    Meeting,
    OtherIncomeEntry,
    Penalty,
    PersonalLoan,
    ShareContribution,
)


def _meeting_key(meeting_id):
    if meeting_id is None:
        return None
    meeting = Meeting.query.get(meeting_id)
    return (meeting.year, meeting.month) if meeting else None


def _loan_outstanding_as_of(loan, this_key):
    """Reconstructs what a loan's outstanding balance actually was as of a given
    (year, month), from its payment history - not its present-day balance."""
    last_payment = (
        LoanPayment.query.join(Meeting, Meeting.id == LoanPayment.meeting_id)
        .filter(LoanPayment.loan_id == loan.id)
        .filter((Meeting.year < this_key[0]) | ((Meeting.year == this_key[0]) & (Meeting.month <= this_key[1])))
        .order_by(Meeting.year.desc(), Meeting.month.desc())
        .first()
    )
    if last_payment:
        return Decimal(last_payment.outstanding_balance_after)
    return Decimal(loan.principal_amount)


def _outstanding_emi_loans_as_of(this_key):
    total = Decimal(0)
    for loan in Loan.query.all():
        start_key = _meeting_key(loan.start_meeting_id)
        if start_key and start_key > this_key:
            continue  # this loan didn't exist yet as of this meeting
        total += _loan_outstanding_as_of(loan, this_key)
    return total


def _outstanding_personal_loans_as_of(this_key):
    total = Decimal(0)
    for loan in PersonalLoan.query.all():
        disbursed_key = _meeting_key(loan.disbursed_meeting_id)
        if not disbursed_key or disbursed_key > this_key:
            continue  # not disbursed yet as of this meeting
        if loan.status == "repaid":
            repaid_key = _meeting_key(loan.repaid_meeting_id)
            if repaid_key and repaid_key <= this_key:
                continue  # already repaid by this meeting
        total += Decimal(loan.amount)
    return total


def _sum_upto(model, amount_col, meeting_col, this_key):
    """Sum a column across every row whose meeting is on or before (year, month)."""
    year, month = this_key
    result = (
        db.session.query(db.func.coalesce(db.func.sum(amount_col), 0))
        .select_from(model)
        .join(Meeting, Meeting.id == meeting_col)
        .filter((Meeting.year < year) | ((Meeting.year == year) & (Meeting.month <= month)))
        .scalar()
    )
    return Decimal(result or 0)


def _investment_position_as_of(this_key):
    """What the mandram still holds outside its cash box as of a given month.

    Everything paid into chits, gold and deposits up to then, less the chit lump
    sums already taken back. This money is *placed*, not spent - it is still the
    group's wealth - so it belongs in the trust's total value even though it has
    left the cash balance."""
    paid_in = _sum_upto(InvestmentEntry, InvestmentEntry.amount, InvestmentEntry.meeting_id, this_key)
    taken_back = _sum_upto(Chit, Chit.amount_taken, Chit.meeting_id, this_key)
    return paid_in - taken_back


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


def resolve_all_opening_balances():
    """Opening balance for every meeting, in a single chronological pass.

    Same result as calling resolve_opening_balance() per meeting, but it carries the
    running balance forward instead of re-walking the chain from each meeting back to
    the last finalized one (which is O(n^2), and drags the outstanding-loan scans along
    for a figure that doesn't need them). Returns {meeting_id: Decimal}."""
    balances = {}
    running = Decimal(0)
    for meeting in Meeting.query.order_by(Meeting.year, Meeting.month).all():
        if meeting.status == "finalized":
            opening = Decimal(meeting.opening_balance or 0)
            closing = Decimal(meeting.closing_balance or 0)
        else:
            opening = running
            closing = opening + _month_components(meeting.id)["delta"]
        balances[meeting.id] = opening
        running = closing
    return balances


def _month_components(meeting_id):
    """Every figure in a meeting's summary that comes from its own rows only, plus
    `delta` - the amount this meeting moves the balance by (closing minus opening).
    Independent of any other meeting, so it is safe to call in a forward walk."""
    total_share_income = _sum_col(ShareContribution.amount, ShareContribution.meeting_id == meeting_id)
    total_emi_interest = _sum_col(LoanPayment.interest_paid, LoanPayment.meeting_id == meeting_id)
    total_personal_loan_interest = _sum_col(
        PersonalLoan.interest_amount, PersonalLoan.repaid_meeting_id == meeting_id
    )
    # Penalties are cash the member actually hands over, so they are income for the
    # month and feed the closing balance like any other collection.
    penalty_income = _sum_col(Penalty.amount, Penalty.meeting_id == meeting_id)
    other_income = _sum_col(OtherIncomeEntry.amount, OtherIncomeEntry.meeting_id == meeting_id)
    # Chit auction dividend coming back to us. This *is* income - the same kind of
    # thing as loan interest: a return on money the mandram placed in an outside
    # chit, not its own money coming back. It therefore joins total_income and
    # reaches the closing balance through net_income, and must NOT also be added
    # to `delta` separately or it would be counted twice.
    total_investment_commission = _sum_col(
        InvestmentEntry.commission_amount, InvestmentEntry.meeting_id == meeting_id
    )

    # Buy-in installments from members who joined after the group was established.
    # Real cash collected this month, so it has to reach the closing balance; it sits
    # in income alongside share contributions, which are likewise members' own capital.
    joining_collected = _sum_col(JoiningPayment.amount, JoiningPayment.meeting_id == meeting_id)

    total_income = (
        total_share_income
        + total_emi_interest
        + total_personal_loan_interest
        + penalty_income
        + other_income
        + total_investment_commission
        + joining_collected
    )

    total_expenditure = _sum_col(ExpenditureEntry.amount, ExpenditureEntry.meeting_id == meeting_id)
    net_income = total_income - total_expenditure

    emi_principal_collected = _sum_col(LoanPayment.installment_paid, LoanPayment.meeting_id == meeting_id)
    personal_loan_collected = _sum_col(PersonalLoan.amount, PersonalLoan.repaid_meeting_id == meeting_id)
    new_personal_loans_disbursed = _sum_col(
        PersonalLoan.amount, PersonalLoan.disbursed_meeting_id == meeting_id
    )
    new_emi_loans_disbursed = _sum_col(Loan.principal_amount, Loan.start_meeting_id == meeting_id)
    total_investment_outflow = _sum_col(InvestmentEntry.amount, InvestmentEntry.meeting_id == meeting_id)
    # Lump sums the mandram received from winning a chit auction this month. Cash in,
    # but not "income" - like a loan repayment coming back, it moves the balance
    # without being earnings, so it stays out of total_income.
    total_chit_taken = _sum_col(Chit.amount_taken, Chit.meeting_id == meeting_id)

    delta = (
        net_income
        + emi_principal_collected
        + personal_loan_collected
        - new_personal_loans_disbursed
        - new_emi_loans_disbursed
        - total_investment_outflow
        + total_chit_taken
    )

    return {
        "share_income": total_share_income,
        "emi_loan_interest": total_emi_interest,
        "personal_loan_interest": total_personal_loan_interest,
        "penalty_income": penalty_income,
        "other_income": other_income,
        "joining_collected": joining_collected,
        "total_income": total_income,
        "total_expenditure": total_expenditure,
        "net_income": net_income,
        "emi_principal_collected": emi_principal_collected,
        "personal_loan_collected": personal_loan_collected,
        "new_personal_loans_disbursed": new_personal_loans_disbursed,
        "new_emi_loans_disbursed": new_emi_loans_disbursed,
        "total_investment_outflow": total_investment_outflow,
        "total_investment_commission": total_investment_commission,
        "total_chit_taken": total_chit_taken,
        "delta": delta,
    }


def compute_summary(meeting_id):
    meeting = Meeting.query.get(meeting_id)
    if not meeting:
        return None

    opening_balance = resolve_opening_balance(meeting)
    c = _month_components(meeting_id)
    closing_balance = opening_balance + c["delta"]

    this_key = (meeting.year, meeting.month)
    outstanding_emi_loans = _outstanding_emi_loans_as_of(this_key)
    outstanding_personal_loans = _outstanding_personal_loans_as_of(this_key)
    investments_held = _investment_position_as_of(this_key)

    # Everything the mandram owns, not just what is in the cash box: money lent to
    # members and money placed in chits/gold/deposits are still its assets. This
    # equals (all income ever collected - all expenditure ever spent), the two views
    # reconciling exactly, and is why it can far exceed the closing balance in a
    # month where most of the funds are out working.
    trust_total_value = (
        closing_balance + outstanding_emi_loans + outstanding_personal_loans + investments_held
    )

    return {
        "meeting_id": meeting_id,
        "opening_balance": float(opening_balance),
        "income": {
            "share_income": float(c["share_income"]),
            "emi_loan_interest": float(c["emi_loan_interest"]),
            "personal_loan_interest": float(c["personal_loan_interest"]),
            "penalty_income": float(c["penalty_income"]),
            "other_income": float(c["other_income"]),
            "joining_collected": float(c["joining_collected"]),
            "total_income": float(c["total_income"]),
        },
        "expenditure": {
            "total_expenditure": float(c["total_expenditure"]),
        },
        "net_income": float(c["net_income"]),
        "collections": {
            "emi_principal_collected": float(c["emi_principal_collected"]),
            "personal_loan_collected": float(c["personal_loan_collected"]),
        },
        "new_personal_loans_disbursed": float(c["new_personal_loans_disbursed"]),
        "new_emi_loans_disbursed": float(c["new_emi_loans_disbursed"]),
        "total_investment_outflow": float(c["total_investment_outflow"]),
        "total_investment_commission": float(c["total_investment_commission"]),
        "total_chit_taken": float(c["total_chit_taken"]),
        "closing_balance": float(closing_balance),
        "outstanding_emi_loans": float(outstanding_emi_loans),
        "outstanding_personal_loans": float(outstanding_personal_loans),
        "investments_held": float(investments_held),
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
