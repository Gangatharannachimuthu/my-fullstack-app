from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class MemberCreate(BaseModel):
    member_number: str
    name: str
    phone_number: Optional[str] = None
    address: Optional[str] = None
    join_date: str
    monthly_sandha_amount: float = 1000

class MemberResponse(BaseModel):
    id: int
    member_number: str
    name: str
    phone_number: Optional[str]
    address: Optional[str]
    join_date: str
    monthly_sandha_amount: float
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

class LoanCreate(BaseModel):
    member_id: int
    principal_amount: float
    interest_rate: float = 1.0
    loan_type: str

class LoanResponse(BaseModel):
    id: int
    loan_number: str
    member_id: int
    principal_amount: float
    interest_rate: float
    loan_type: str
    loan_status: str
    outstanding_principal: float
    outstanding_interest: float
    created_at: datetime

    class Config:
        from_attributes = True

class DashboardStats(BaseModel):
    total_members: int
    active_members: int
    total_loans: int
    active_loans: int
    total_sandha_collected: float
    outstanding_loans: float
    interest_collected: float
    current_cash_balance: float

class SettingsResponse(BaseModel):
    id: int
    default_sandha: float
    default_interest_rate: float
    monthly_repayment_percentage: float

    class Config:
        from_attributes = True
