from passlib.context import CryptContext
from jose import JWTError, jwt
from config import settings
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
import models
from decimal import Decimal

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def hash_password(password: str) -> str:
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def create_access_token(data: dict, expires_delta: timedelta = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def generate_loan_number(db: Session) -> str:
    count = db.query(models.Loan).count() + 1
    return f"LN{count:05d}"

def calculate_monthly_interest(principal: Decimal, rate: float) -> Decimal:
    monthly_rate = Decimal(str(rate / 100 / 12))
    return Decimal(str(principal)) * monthly_rate

def calculate_dashboard_stats(db: Session) -> dict:
    total_members = db.query(models.Member).count()
    active_members = db.query(models.Member).filter(models.Member.status == "active").count()
    
    total_loans = db.query(models.Loan).count()
    active_loans = db.query(models.Loan).filter(models.Loan.loan_status == "active").count()
    
    total_sandha = db.query(models.MemberContribution).filter(
        models.MemberContribution.payment_status == "paid"
    ).with_entities(models.MemberContribution.amount).all()
    total_sandha_collected = sum([float(row[0]) for row in total_sandha]) if total_sandha else 0
    
    loans = db.query(models.Loan).all()
    outstanding_loans = sum([float(loan.outstanding_principal or 0) for loan in loans])
    
    repayments = db.query(models.LoanRepayment).all()
    interest_collected = sum([float(rep.interest_amount or 0) for rep in repayments])
    
    current_cash_balance = total_sandha_collected + interest_collected - outstanding_loans
    
    return {
        "total_members": total_members,
        "active_members": active_members,
        "total_loans": total_loans,
        "active_loans": active_loans,
        "total_sandha_collected": total_sandha_collected,
        "outstanding_loans": outstanding_loans,
        "interest_collected": interest_collected,
        "current_cash_balance": current_cash_balance,
    }
