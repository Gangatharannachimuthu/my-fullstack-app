from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, ForeignKey
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True)
    username = Column(String(50), unique=True, index=True)
    email = Column(String(100), unique=True, index=True)
    password_hash = Column(String(255))
    role = Column(String(20), default="user")
    active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Member(Base):
    __tablename__ = "members"
    id = Column(Integer, primary_key=True)
    member_number = Column(String(20), unique=True, index=True)
    name = Column(String(100))
    phone_number = Column(String(20))
    address = Column(Text)
    join_date = Column(String(20))
    monthly_sandha_amount = Column(Float, default=1000.0)
    status = Column(String(20), default="active")
    created_at = Column(DateTime, default=datetime.utcnow)

class Loan(Base):
    __tablename__ = "loans"
    id = Column(Integer, primary_key=True)
    loan_number = Column(String(20), unique=True, index=True)
    member_id = Column(Integer, ForeignKey("members.id"))
    principal_amount = Column(Float)
    interest_rate = Column(Float, default=1.0)
    loan_type = Column(String(20))
    loan_status = Column(String(20), default="active")
    outstanding_principal = Column(Float)
    outstanding_interest = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)

class MemberContribution(Base):
    __tablename__ = "member_contributions"
    id = Column(Integer, primary_key=True)
    member_id = Column(Integer, ForeignKey("members.id"))
    contribution_month = Column(String(20))
    amount = Column(Float)
    payment_status = Column(String(20), default="pending")
    created_at = Column(DateTime, default=datetime.utcnow)

class LoanRepayment(Base):
    __tablename__ = "loan_repayments"
    id = Column(Integer, primary_key=True)
    loan_id = Column(Integer, ForeignKey("loans.id"))
    payment_date = Column(String(20))
    principal_amount = Column(Float)
    interest_amount = Column(Float)
    total_amount = Column(Float)
    created_at = Column(DateTime, default=datetime.utcnow)

class Settings(Base):
    __tablename__ = "settings"
    id = Column(Integer, primary_key=True)
    default_sandha = Column(Float, default=1000.0)
    default_interest_rate = Column(Float, default=1.0)
    monthly_repayment_percentage = Column(Float, default=10.0)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
