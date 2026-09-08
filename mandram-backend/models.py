from datetime import datetime

from extensions import db


def _f(value):
    return float(value) if value is not None else None


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
    note = db.Column(db.String(255))

    category = db.relationship("InvestmentCategory")

    def to_dict(self):
        return {
            "id": self.id,
            "meeting_id": self.meeting_id,
            "category_id": self.category_id,
            "category_name": self.category.name if self.category else None,
            "amount": _f(self.amount),
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
