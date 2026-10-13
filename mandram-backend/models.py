from datetime import datetime

from extensions import db


def _f(value):
    return float(value) if value is not None else None


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(100), nullable=False, unique=True)
    password_hash = db.Column(db.String(255), nullable=False)
    role = db.Column(db.Enum("admin", "viewer", name="user_role"), nullable=False, default="viewer")
    # Which member in the ledger this login belongs to. A viewer only ever sees this
    # member's loans; an admin normally has none, since they act for the whole trust.
    member_id = db.Column(db.Integer, db.ForeignKey("members.id"), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        member = Member.query.get(self.member_id) if self.member_id else None
        return {
            "id": self.id,
            "username": self.username,
            "role": self.role,
            "member_id": self.member_id,
            "member_name": member.name if member else None,
        }


class Member(db.Model):
    __tablename__ = "members"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    phone = db.Column(db.String(20))
    joined_date = db.Column(db.Date)
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "phone": self.phone,
            "joined_date": self.joined_date.isoformat() if self.joined_date else None,
            "is_active": self.is_active,
        }


class Meeting(db.Model):
    __tablename__ = "meetings"

    id = db.Column(db.Integer, primary_key=True)
    meeting_date = db.Column(db.Date, nullable=False)
    month = db.Column(db.SmallInteger, nullable=False)
    year = db.Column(db.SmallInteger, nullable=False)
    opening_balance = db.Column(db.Numeric(12, 2), nullable=False, default=0)
    closing_balance = db.Column(db.Numeric(12, 2))
    trust_total_value = db.Column(db.Numeric(12, 2))
    status = db.Column(db.Enum("draft", "finalized", name="meeting_status"), default="draft")
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (db.UniqueConstraint("month", "year", name="uq_month_year"),)

    def to_dict(self):
        return {
            "id": self.id,
            "meeting_date": self.meeting_date.isoformat(),
            "month": self.month,
            "year": self.year,
            "opening_balance": _f(self.opening_balance),
            "closing_balance": _f(self.closing_balance),
            "trust_total_value": _f(self.trust_total_value),
            "status": self.status,
            "notes": self.notes,
        }


class ShareContribution(db.Model):
    __tablename__ = "share_contributions"

    id = db.Column(db.Integer, primary_key=True)
    member_id = db.Column(db.Integer, db.ForeignKey("members.id"), nullable=False)
    meeting_id = db.Column(db.Integer, db.ForeignKey("meetings.id"), nullable=False)
    amount = db.Column(db.Numeric(12, 2), nullable=False)

    __table_args__ = (db.UniqueConstraint("member_id", "meeting_id", name="uq_member_meeting_share"),)

    def to_dict(self):
        return {
            "id": self.id,
            "member_id": self.member_id,
            "meeting_id": self.meeting_id,
            "amount": _f(self.amount),
        }


class Loan(db.Model):
    __tablename__ = "loans"

    id = db.Column(db.Integer, primary_key=True)
    member_id = db.Column(db.Integer, db.ForeignKey("members.id"), nullable=False)
    principal_amount = db.Column(db.Numeric(12, 2), nullable=False)
    start_meeting_id = db.Column(db.Integer, db.ForeignKey("meetings.id"))
    status = db.Column(db.Enum("active", "closed", name="loan_status"), default="active")
    current_outstanding_balance = db.Column(db.Numeric(12, 2), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "member_id": self.member_id,
            "principal_amount": _f(self.principal_amount),
            "start_meeting_id": self.start_meeting_id,
            "status": self.status,
            "current_outstanding_balance": _f(self.current_outstanding_balance),
        }


class LoanPayment(db.Model):
    __tablename__ = "loan_payments"

    id = db.Column(db.Integer, primary_key=True)
    loan_id = db.Column(db.Integer, db.ForeignKey("loans.id"), nullable=False)
    meeting_id = db.Column(db.Integer, db.ForeignKey("meetings.id"), nullable=False)
    installment_paid = db.Column(db.Numeric(12, 2), nullable=False, default=0)
    interest_paid = db.Column(db.Numeric(12, 2), nullable=False, default=0)
    outstanding_balance_after = db.Column(db.Numeric(12, 2), nullable=False)

    __table_args__ = (db.UniqueConstraint("loan_id", "meeting_id", name="uq_loan_meeting"),)

    def to_dict(self):
        return {
            "id": self.id,
            "loan_id": self.loan_id,
            "meeting_id": self.meeting_id,
            "installment_paid": _f(self.installment_paid),
            "interest_paid": _f(self.interest_paid),
            "outstanding_balance_after": _f(self.outstanding_balance_after),
        }


class PersonalLoan(db.Model):
    __tablename__ = "personal_loans"

    id = db.Column(db.Integer, primary_key=True)
    member_id = db.Column(db.Integer, db.ForeignKey("members.id"), nullable=False)
    amount = db.Column(db.Numeric(12, 2), nullable=False)
    disbursed_meeting_id = db.Column(db.Integer, db.ForeignKey("meetings.id"), nullable=False)
    expected_repay_meeting_id = db.Column(db.Integer, db.ForeignKey("meetings.id"))
    status = db.Column(db.Enum("outstanding", "repaid", name="personal_loan_status"), default="outstanding")
    interest_amount = db.Column(db.Numeric(12, 2))
    repaid_meeting_id = db.Column(db.Integer, db.ForeignKey("meetings.id"))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "member_id": self.member_id,
            "amount": _f(self.amount),
            "disbursed_meeting_id": self.disbursed_meeting_id,
            "expected_repay_meeting_id": self.expected_repay_meeting_id,
            "status": self.status,
            "interest_amount": _f(self.interest_amount),
            "repaid_meeting_id": self.repaid_meeting_id,
        }


class Penalty(db.Model):
    __tablename__ = "penalties"

    id = db.Column(db.Integer, primary_key=True)
    member_id = db.Column(db.Integer, db.ForeignKey("members.id"), nullable=False)
    meeting_id = db.Column(db.Integer, db.ForeignKey("meetings.id"), nullable=False)
    amount = db.Column(db.Numeric(12, 2), nullable=False)
    reason = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "member_id": self.member_id,
            "meeting_id": self.meeting_id,
            "amount": _f(self.amount),
            "reason": self.reason,
        }


class ExpenditureCategory(db.Model):
    __tablename__ = "expenditure_categories"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)

    def to_dict(self):
        return {"id": self.id, "name": self.name}


class ExpenditureEntry(db.Model):
    __tablename__ = "expenditure_entries"

    id = db.Column(db.Integer, primary_key=True)
    meeting_id = db.Column(db.Integer, db.ForeignKey("meetings.id"), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey("expenditure_categories.id"), nullable=False)
    amount = db.Column(db.Numeric(12, 2), nullable=False)
    note = db.Column(db.String(255))

    category = db.relationship("ExpenditureCategory")

    def to_dict(self):
        return {
            "id": self.id,
            "meeting_id": self.meeting_id,
            "category_id": self.category_id,
            "category_name": self.category.name if self.category else None,
            "amount": _f(self.amount),
            "note": self.note,
        }


class InvestmentCategory(db.Model):
    __tablename__ = "investment_categories"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False, unique=True)

    def to_dict(self):
        return {"id": self.id, "name": self.name}


class InvestmentEntry(db.Model):
    __tablename__ = "investment_entries"

    id = db.Column(db.Integer, primary_key=True)
    meeting_id = db.Column(db.Integer, db.ForeignKey("meetings.id"), nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey("investment_categories.id"), nullable=False)
    amount = db.Column(db.Numeric(12, 2), nullable=False)
    # Chit auction dividend returned to the mandram when another member wins the
    # auction: `amount` stays the full chit value, and this comes back to us, so the
    # real cash out for the month is amount - commission_amount.
    commission_amount = db.Column(db.Numeric(12, 2), nullable=False, default=0)
    # What the chit was auctioned for this month (the winning bid). Tracked for the
    # record only - the month's cash out is still `amount` and the dividend back to
    # us is still `commission_amount`; this feeds no calculation.
    auction_amount = db.Column(db.Numeric(12, 2))
    # Which chit scheme this month's entry belongs to, when it is a chit at all.
    # Nullable: Gold/FD entries have no chit, and chit entries predating the Chit
    # Management tab are unlinked until someone attaches them.
    chit_id = db.Column(db.Integer, db.ForeignKey("chits.id"), nullable=True)
    note = db.Column(db.String(255))

    category = db.relationship("InvestmentCategory")

    def to_dict(self):
        return {
            "id": self.id,
            "meeting_id": self.meeting_id,
            "category_id": self.category_id,
            "category_name": self.category.name if self.category else None,
            "amount": _f(self.amount),
            "commission_amount": _f(self.commission_amount) or 0.0,
            "auction_amount": _f(self.auction_amount),
            "chit_id": self.chit_id,
            "note": self.note,
        }


class OtherIncomeEntry(db.Model):
    __tablename__ = "other_income_entries"

    id = db.Column(db.Integer, primary_key=True)
    meeting_id = db.Column(db.Integer, db.ForeignKey("meetings.id"), nullable=False)
    description = db.Column(db.String(255))
    amount = db.Column(db.Numeric(12, 2), nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "meeting_id": self.meeting_id,
            "description": self.description,
            "amount": _f(self.amount),
        }


class Chit(db.Model):
    """A chit scheme the mandram has *won* an auction in.

    Deliberately higher-level than InvestmentEntry: an investment entry is the
    month-by-month cash (what we paid in, what commission came back), while a chit
    row is recorded once, at the point we take the chit, and carries the scheme's
    headline details plus the lump sum we received.
    """

    __tablename__ = "chits"

    id = db.Column(db.Integer, primary_key=True)
    # The meeting we took the chit in. This is what places `amount_taken` in a
    # specific month's Balance Roll-Forward.
    meeting_id = db.Column(db.Integer, db.ForeignKey("meetings.id"), nullable=False)
    # When the chit scheme itself started, which is usually well before the month we
    # won it. Purely informational: the money still lands in the Balance Roll-Forward
    # on `meeting_id` (the month taken), never on this date.
    initiate_date = db.Column(db.Date)
    host_name = db.Column(db.String(150), nullable=False)
    # The fixed amount the mandram pays into the chit each month.
    agent_amount = db.Column(db.Numeric(12, 2), nullable=False, default=0)
    # How many auction cycles the scheme runs for.
    auction_count = db.Column(db.Integer, nullable=False, default=0)
    # The lump sum we actually received on winning the auction - cash in.
    amount_taken = db.Column(db.Numeric(12, 2), nullable=False, default=0)
    note = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    meeting = db.relationship("Meeting")

    def to_dict(self):
        return {
            "id": self.id,
            "meeting_id": self.meeting_id,
            "meeting_month": self.meeting.month if self.meeting else None,
            "meeting_year": self.meeting.year if self.meeting else None,
            "initiate_date": self.initiate_date.isoformat() if self.initiate_date else None,
            "host_name": self.host_name,
            "agent_amount": _f(self.agent_amount),
            "auction_count": self.auction_count,
            "amount_taken": _f(self.amount_taken),
            "total_committed": _f(self.agent_amount) * (self.auction_count or 0),
            "note": self.note,
        }


class JoiningDue(db.Model):
    """What a member joining an established mandram owes to buy in.

    A member who joins after the group has been running is buying an equal share of
    what the existing members have already built (the trust's total value the month
    before they joined, divided by the number of members at that point). It is a
    one-off capital amount, entirely separate from the monthly share contribution -
    the monthly share keeps everyone level going forward, this settles the past.
    """

    __tablename__ = "joining_dues"

    id = db.Column(db.Integer, primary_key=True)
    member_id = db.Column(db.Integer, db.ForeignKey("members.id"), nullable=False, unique=True)
    total_amount = db.Column(db.Numeric(12, 2), nullable=False)
    # The meeting whose net worth the figure was derived from, kept so the amount can
    # be justified later rather than looking arbitrary.
    basis_meeting_id = db.Column(db.Integer, db.ForeignKey("meetings.id"))
    note = db.Column(db.String(255))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    member = db.relationship("Member")
    basis_meeting = db.relationship("Meeting")

    def to_dict(self):
        return {
            "id": self.id,
            "member_id": self.member_id,
            "member_name": self.member.name if self.member else None,
            "total_amount": _f(self.total_amount),
            "basis_meeting_id": self.basis_meeting_id,
            "basis_label": (
                f"{self.basis_meeting.month}/{self.basis_meeting.year}" if self.basis_meeting else None
            ),
            "note": self.note,
        }


class JoiningPayment(db.Model):
    """One installment a member paid toward their joining due, in one meeting."""

    __tablename__ = "joining_payments"

    id = db.Column(db.Integer, primary_key=True)
    member_id = db.Column(db.Integer, db.ForeignKey("members.id"), nullable=False)
    meeting_id = db.Column(db.Integer, db.ForeignKey("meetings.id"), nullable=False)
    amount = db.Column(db.Numeric(12, 2), nullable=False)

    # One row per member per meeting - a correction edits it rather than stacking.
    __table_args__ = (
        db.UniqueConstraint("member_id", "meeting_id", name="uq_member_meeting_joining"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "member_id": self.member_id,
            "meeting_id": self.meeting_id,
            "amount": _f(self.amount),
        }
