from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from config import settings
from database import engine, Base, get_db
import models
import schemas

# Create all tables
Base.metadata.create_all(bind=engine)

# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version="1.0.0",
    description="Member Savings & Loan Management System"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routes
@app.get("/")
async def read_root():
    """Root endpoint - check if server is running"""
    return {
        "message": "Welcome to Member Savings & Loan Management System",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

@app.post("/api/auth/login", response_model=schemas.Token)
async def login(user: schemas.UserLogin, db: Session = Depends(get_db)):
    """Login endpoint"""
    return {
        "access_token": "sample-token-jwt-here",
        "token_type": "bearer"
    }

@app.get("/api/members")
async def get_members(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all members"""
    try:
        members = db.query(models.Member).offset(skip).limit(limit).all()
        return members
    except Exception as e:
        return []

@app.post("/api/members")
async def create_member(member: schemas.MemberCreate, db: Session = Depends(get_db)):
    """Create a new member"""
    try:
        db_member = models.Member(**member.dict())
        db.add(db_member)
        db.commit()
        db.refresh(db_member)
        return {"id": db_member.id, "message": "Member created successfully"}
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/loans")
async def get_loans(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all loans"""
    try:
        loans = db.query(models.Loan).offset(skip).limit(limit).all()
        return loans
    except Exception as e:
        return []

@app.post("/api/loans")
async def create_loan(loan: schemas.LoanCreate, db: Session = Depends(get_db)):
    """Create a new loan"""
    try:
        db_loan = models.Loan(**loan.dict())
        db.add(db_loan)
        db.commit()
        db.refresh(db_loan)
        return {"id": db_loan.id, "message": "Loan created successfully"}
    except Exception as e:
        return {"error": str(e)}

@app.get("/api/contributions")
async def get_contributions(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all contributions"""
    try:
        contributions = db.query(models.MemberContribution).offset(skip).limit(limit).all()
        result = []
        for contrib in contributions:
            member = db.query(models.Member).filter(models.Member.id == contrib.member_id).first()
            result.append({
                "id": contrib.id,
                "member_id": contrib.member_id,
                "member_name": member.name if member else "Unknown",
                "member_number": member.member_number if member else "Unknown",
                "contribution_month": contrib.contribution_month,
                "amount": contrib.amount,
                "payment_status": contrib.payment_status,
                "created_at": contrib.created_at
            })
        return result
    except Exception as e:
        return []

@app.get("/api/repayments")
async def get_repayments(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """Get all loan repayments"""
    try:
        repayments = db.query(models.LoanRepayment).offset(skip).limit(limit).all()
        result = []
        for rep in repayments:
            loan = db.query(models.Loan).filter(models.Loan.id == rep.loan_id).first()
            result.append({
                "id": rep.id,
                "loan_id": rep.loan_id,
                "loan_number": loan.loan_number if loan else "Unknown",
                "payment_date": rep.payment_date,
                "principal_amount": rep.principal_amount,
                "interest_amount": rep.interest_amount,
                "total_amount": rep.total_amount,
                "created_at": rep.created_at
            })
        return result
    except Exception as e:
        return []

@app.get("/api/dashboard/stats")
async def get_dashboard_stats(db: Session = Depends(get_db)):
    """Get dashboard statistics"""
    try:
        total_members = db.query(models.Member).count()
        active_members = db.query(models.Member).filter(models.Member.status == "active").count()
        total_loans = db.query(models.Loan).count()
        active_loans = db.query(models.Loan).filter(models.Loan.loan_status == "active").count()
        
        return {
            "total_members": total_members,
            "active_members": active_members,
            "total_loans": total_loans,
            "active_loans": active_loans,
            "total_sandha_collected": 0,
            "outstanding_loans": 0,
            "interest_collected": 0,
            "current_cash_balance": 0,
        }
    except Exception as e:
        return {
            "total_members": 0,
            "active_members": 0,
            "total_loans": 0,
            "active_loans": 0,
            "total_sandha_collected": 0,
            "outstanding_loans": 0,
            "interest_collected": 0,
            "current_cash_balance": 0,
        }

@app.get("/api/settings")
async def get_settings(db: Session = Depends(get_db)):
    """Get system settings"""
    try:
        settings_obj = db.query(models.Settings).first()
        if settings_obj:
            return {
                "id": settings_obj.id,
                "default_sandha": settings_obj.default_sandha,
                "default_interest_rate": settings_obj.default_interest_rate,
                "monthly_repayment_percentage": settings_obj.monthly_repayment_percentage
            }
        return {
            "id": 1,
            "default_sandha": 1000,
            "default_interest_rate": 1.0,
            "monthly_repayment_percentage": 10.0
        }
    except Exception as e:
        return {
            "id": 1,
            "default_sandha": 1000,
            "default_interest_rate": 1.0,
            "monthly_repayment_percentage": 10.0
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
