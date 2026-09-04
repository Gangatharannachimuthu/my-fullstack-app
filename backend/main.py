from fastapi import FastAPI, Depends
from fastapi.cors import CORSMiddleware
from sqlalchemy.orm import Session
from config import settings
from database import engine, Base, get_db
from models import User, Settings as DBSettings
import models
import schemas

# Create tables
Base.metadata.create_all(bind=engine)

# Initialize FastAPI app
app = FastAPI(title=settings.APP_NAME, version="1.0.0")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {
        "message": "Welcome to Member Savings & Loan Management System",
        "version": "1.0.0",
        "status": "running"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}

@app.post("/api/auth/login", response_model=schemas.Token)
def login(user: schemas.UserLogin, db: Session = Depends(get_db)):
    from utils import verify_password, create_access_token
    
    db_user = db.query(models.User).filter(models.User.username == user.username).first()
    if not db_user or not verify_password(user.password, db_user.password_hash):
        return {"detail": "Invalid credentials"}, 401
    
    access_token = create_access_token(data={"sub": db_user.username, "role": db_user.role})
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/members", response_model=list[schemas.MemberResponse])
def get_members(skip: int = 0, limit: int = 100, status: str = None, db: Session = Depends(get_db)):
    query = db.query(models.Member)
    if status:
        query = query.filter(models.Member.status == status)
    return query.offset(skip).limit(limit).all()

@app.post("/api/members", response_model=schemas.MemberResponse)
def create_member(member: schemas.MemberCreate, db: Session = Depends(get_db)):
    db_member = models.Member(**member.dict())
    db.add(db_member)
    db.commit()
    db.refresh(db_member)
    return db_member

@app.get("/api/loans", response_model=list[schemas.LoanResponse])
def get_loans(member_id: int = None, status: str = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    query = db.query(models.Loan)
    if member_id:
        query = query.filter(models.Loan.member_id == member_id)
    if status:
        query = query.filter(models.Loan.loan_status == status)
    return query.offset(skip).limit(limit).all()

@app.post("/api/loans", response_model=schemas.LoanResponse)
def create_loan(loan: schemas.LoanCreate, db: Session = Depends(get_db)):
    from utils import generate_loan_number
    
    loan_number = generate_loan_number(db)
    db_loan = models.Loan(
        loan_number=loan_number,
        outstanding_principal=loan.principal_amount,
        **loan.dict()
    )
    db.add(db_loan)
    db.commit()
    db.refresh(db_loan)
    return db_loan

@app.get("/api/dashboard/stats", response_model=schemas.DashboardStats)
def get_dashboard_stats(db: Session = Depends(get_db)):
    from utils import calculate_dashboard_stats
    return calculate_dashboard_stats(db)

@app.get("/api/settings", response_model=schemas.SettingsResponse)
def get_settings(db: Session = Depends(get_db)):
    settings_obj = db.query(DBSettings).first()
    if not settings_obj:
        settings_obj = DBSettings()
        db.add(settings_obj)
        db.commit()
        db.refresh(settings_obj)
    return settings_obj

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
