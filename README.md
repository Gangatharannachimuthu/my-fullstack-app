# My Fullstack App - Member Savings & Loan Management System

A comprehensive full-stack web application for managing member-based savings and lending organizations. Built with React, FastAPI, and MySQL.

## 🎯 Features

### Core Features
- **Member Management**: Add, edit, view, and manage members
- **Monthly Contributions**: Track Sandha/share contributions from members
- **Loan Management**: Create, approve, and manage organization and individual loans
- **Loan Repayments**: Record and track loan repayments with automatic calculations
- **Income Tracking**: Track all income sources (contributions, interest, etc.)
- **Expense Management**: Record and categorize expenses
- **Monthly Closing**: Complete month-end financial closing process
- **Dashboard**: Real-time analytics and statistics
- **Reports**: Comprehensive financial and member reports
- **Audit Logs**: Track all system activities
- **Authentication**: Secure login with role-based access control

## 🚀 Quick Start

### Prerequisites
- Python 3.8+
- Node.js 14+
- MySQL 5.7+

### 1. Database Setup

Run in MySQL Workbench:
```bash
mysql -u root < database-setup.sql
```

### 2. Backend Setup (Terminal 1)

```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
python main.py
```

✅ Backend: `http://localhost:8000`

### 3. Frontend Setup (Terminal 2)

```bash
cd frontend
npm install
npm start
```

✅ Frontend: `http://localhost:3000`

## 📊 Tech Stack

- **Frontend**: React 18, Axios, React Router, Tailwind CSS
- **Backend**: FastAPI, SQLAlchemy, Pydantic, PyJWT
- **Database**: MySQL

## 🔐 Default Credentials

- Username: `admin`
- Email: `admin@loansystem.com`

## 💾 Sample Data

- 10 Members
- 5 Loans (Organization & Individual)
- Sample Contributions & Payments
- Income & Expense transactions

## 📞 Support

See SETUP-GUIDE.md for detailed Windows setup instructions.

---

**Version**: 1.0.0 | **Status**: Production Ready
