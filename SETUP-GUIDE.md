# My Fullstack App - Complete Setup Guide

**Application**: Member Savings & Loan Management System
**Technology**: React + FastAPI + MySQL
**Status**: Production Ready

---

## 📋 Prerequisites

- Python 3.8 or higher
- Node.js 14 or higher (LTS recommended)
- MySQL 5.7 or higher
- Git (optional)
- Terminal/PowerShell/Command Prompt

---

## 🚀 Quick Setup (10 minutes)

### Extract Project
```
member-loan-app.zip → C:\Users\Canny_831013\Documents\GIT\my-fullstack-app\
```

### Terminal 1 - Database & Backend
```powershell
# Setup Database
mysql -u root < database-setup.sql

# Navigate to backend
cd C:\Users\Canny_831013\Documents\GIT\my-fullstack-app\backend

# Create & activate virtual environment
python -m venv venv
venv\Scripts\activate

# Install & run
pip install -r requirements.txt
python main.py
```

**✅ Backend: http://localhost:8000**

### Terminal 2 - Frontend
```powershell
# Navigate to frontend
cd C:\Users\Canny_831013\Documents\GIT\my-fullstack-app\frontend

# Install & run
npm install
npm start
```

**✅ Frontend: http://localhost:3000**

---

## 📖 Detailed Setup Steps

### Step 1: Extract Project Files

1. Download `my-fullstack-app.zip`
2. Right-click → Extract All
3. Navigate to: `C:\Users\Canny_831013\Documents\GIT\`
4. Paste extracted folder

Result: `C:\Users\Canny_831013\Documents\GIT\my-fullstack-app\`

### Step 2: Setup MySQL Database

#### Option A: Using MySQL Workbench (GUI)
1. Open MySQL Workbench
2. Double-click your MySQL connection
3. File → Open SQL Script
4. Select `database-setup.sql` from project root
5. Click Execute (or Ctrl + Shift + Enter)
6. Wait for completion

✅ Database `member_loan_db` created with sample data

#### Option B: Using Command Line
1. Open PowerShell/Command Prompt
2. Run:
```powershell
mysql -u root < C:\Users\Canny_831013\Documents\GIT\my-fullstack-app\database-setup.sql
```

Verify creation:
```sql
mysql -u root
SHOW DATABASES;
USE member_loan_db;
SHOW TABLES;
```

### Step 3: Configure Backend Environment

1. Navigate to backend folder:
```powershell
cd C:\Users\Canny_831013\Documents\GIT\my-fullstack-app\backend
```

2. Copy environment file:
```powershell
copy .env.example .env
```

3. Edit `.env` if needed (default works for local development):
```
DATABASE_URL=mysql+pymysql://root:@localhost:3306/member_loan_db
SECRET_KEY=your-secret-key-change-in-production
DEBUG=True
```

### Step 4: Setup Backend Server

```powershell
# Create virtual environment
python -m venv venv

# Activate it
venv\Scripts\activate

# Verify activation (should show (venv) prefix)
# Install dependencies
pip install -r requirements.txt

# Run server
python main.py
```

Expected output:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete
```

✅ **Backend is running on http://localhost:8000**

**Keep this terminal open!**

### Step 5: Setup Frontend

Open **NEW** PowerShell/Command Prompt window:

```powershell
# Navigate to frontend
cd C:\Users\Canny_831013\Documents\GIT\my-fullstack-app\frontend

# Install Node packages (2-3 minutes)
npm install

# Start development server
npm start
```

Browser opens automatically. If not, visit: `http://localhost:3000`

✅ **Frontend is running on http://localhost:3000**

---

## ✅ Verification

### Check Backend
1. Open browser
2. Visit: `http://localhost:8000`
3. Should see: `{"message": "Welcome to Member Savings & Loan Management System", "version": "1.0.0", "status": "running"}`
4. API Docs: `http://localhost:8000/docs`

### Check Frontend
1. Browser should open automatically
2. Or visit: `http://localhost:3000`
3. Should see login page

### Check Database
```powershell
mysql -u root
USE member_loan_db;
SELECT COUNT(*) FROM members;  -- Should show 10
SELECT COUNT(*) FROM loans;     -- Should show 5
EXIT;
```

---

## 🔐 Login

### First Time

**Option 1: Create New Account**
1. Go to http://localhost:3000
2. Click "Register"
3. Create new user account
4. Login with new credentials

**Option 2: Use Sample Admin Account**
- Username: `admin`
- Email: `admin@loansystem.com`
- Password: Create via registration (default is hashed)

---

## 📊 Sample Data

After database setup, you have:

**Members**: 10 active members
- Names, phone numbers, addresses
- Join dates (2023-2024)
- Monthly contributions (₹1,000-₹1,500)

**Loans**: 5 loans
- Organization loans (1% interest)
- Individual loans (2-2.5% interest)
- Various amounts (₹20,000-₹100,000)
- Mixed statuses (active, partially paid)

**Contributions**: 8 records
- Monthly Sandha tracking
- Various payment statuses (paid, pending, partial)

**Payments**: 5 repayments
- Automatic principal/interest splitting
- Different payment methods and dates

**Transactions**: Income, expenses, and closing

---

## 🛠️ Troubleshooting

### Python Issues

**Error: "python not found"**
```
Solution: Install Python from https://www.python.org/downloads/
During installation, CHECK "Add Python to PATH"
```

**Error: "No module named 'fastapi'"**
```
Solution: 
1. Verify (venv) is active
2. Run: pip install -r requirements.txt
3. Check internet connection
```

**Error: Database connection failed**
```
Solution:
1. Check MySQL is running (System Tray → MySQL icon)
2. Verify DATABASE_URL in .env matches your setup
3. Default: mysql+pymysql://root:@localhost:3306/member_loan_db
4. Test: mysql -u root (should connect)
```

### Node/npm Issues

**Error: "npm not found"**
```
Solution: Install Node.js from https://nodejs.org/ (LTS version)
```

**Error: "Port 3000 already in use"**
```
Solution:
1. Option A: Kill existing process
   netstat -ano | findstr :3000
   taskkill /PID [PID_NUMBER] /F

2. Option B: Use different port
   npm start -- --port 3001
```

**Error: npm install fails**
```
Solution:
1. Clear npm cache: npm cache clean --force
2. Delete node_modules folder: rmdir node_modules
3. Delete package-lock.json
4. Retry: npm install
5. Check internet connection
```

### Port Issues

**Error: "Port 8000 already in use"**
```powershell
# Find and kill process
netstat -ano | findstr :8000
taskkill /PID [PID_NUMBER] /F

# Or change FastAPI port in main.py
```

**Check all required ports**
```powershell
netstat -ano | findstr :3000
netstat -ano | findstr :8000
netstat -ano | findstr :3306
```

---

## 🔧 Configuration

### Backend (.env file)

```
# Database
DATABASE_URL=mysql+pymysql://root:password@localhost:3306/member_loan_db

# JWT
SECRET_KEY=your-secret-key-256-bits-minimum
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# App
DEBUG=True
APP_NAME=Member Savings & Loan Management System
```

### Frontend (.env file - optional)

Create `frontend/.env`:
```
REACT_APP_API_URL=http://localhost:8000/api
```

---

## 📱 Features Available

After setup, you can:

✅ **Members**
- View 10 sample members
- Add new members
- Edit member details
- View member profiles with statistics

✅ **Contributions**
- Track monthly Sandha contributions
- Mark as paid/pending
- View collection status

✅ **Loans**
- View 5 sample loans
- Create new loans (organization & individual)
- Track loan status
- View outstanding amounts

✅ **Repayments**
- Record loan payments
- Automatic principal/interest calculation
- View payment history

✅ **Dashboard**
- View key statistics
- Total members, loans, contributions
- Outstanding loan amounts
- Interest collected
- Cash balance

✅ **Reports**
- Member statements
- Financial summaries
- Loan analytics

✅ **Settings** (Admin only)
- Configure system settings
- Set interest rates
- Define expense categories

---

## 📈 Testing Workflow

1. **View Dashboard**: Check statistics
2. **Explore Members**: See 10 sample members
3. **Check Loans**: View loan details and calculations
4. **Review Reports**: Understand financial summaries
5. **Test Features**: Add member, create loan, record payment
6. **Verify Calculations**: Check automatic interest calculation

---

## 🚀 Next Steps

1. **Explore UI**: Navigate all pages
2. **Understand Data**: Review sample data
3. **Test Operations**: Try adding/editing data
4. **Review Reports**: Check financial reports
5. **Read API Docs**: Visit http://localhost:8000/docs
6. **Customize**: Modify settings and configurations
7. **Deploy**: Follow production deployment guide

---

## 📚 Documentation

- **README.md**: Feature documentation
- **SETUP-WINDOWS.md**: Quick Windows setup
- **SETUP-GUIDE.md**: This file (detailed setup)
- **API Docs**: http://localhost:8000/docs
- **Database Schema**: database-setup.sql

---

## 💾 Backup & Reset

### Backup Database
```powershell
mysqldump -u root member_loan_db > backup.sql
```

### Reset Database
```powershell
mysql -u root < database-setup.sql
```

### Full Reset
```powershell
# Delete database
mysql -u root -e "DROP DATABASE member_loan_db;"

# Recreate from scratch
mysql -u root < database-setup.sql
```

---

## 🎯 Common Tasks

### Change Default Interest Rate
1. Go to Settings (Admin only)
2. Update "Default Interest Rate" (currently 1%)
3. Click Save

### Add Expense Category
1. Go to Settings
2. Add new expense category
3. Use in expense tracking

### Create New Loan
1. Go to Loans
2. Click "Add Loan"
3. Select member, enter amount, set rate
4. Submit

### Record Loan Payment
1. Go to Repayments
2. Click "Add Repayment"
3. Select loan, enter amount
4. Submit (principal/interest calculated automatically)

---

## ⚡ Performance Tips

- Keep both servers running
- Use Chrome/Firefox for best performance
- Clear browser cache if UI updates slowly
- Close unused tabs/windows
- Ensure adequate RAM (2GB minimum)

---

## 📞 Support

### Check Logs
- **Backend**: Terminal where `python main.py` is running
- **Frontend**: Browser Console (F12 → Console tab)
- **Database**: MySQL error log

### Common Fixes
1. Restart backend server
2. Restart frontend (Ctrl+C, then npm start)
3. Clear browser cache (Ctrl+Shift+Delete)
4. Verify database connection
5. Check all ports are available

---

## ✅ System Ready!

Your Member Savings & Loan Management System is ready for use!

- **Dashboard**: http://localhost:3000
- **API Docs**: http://localhost:8000/docs
- **Database**: member_loan_db

**Happy using!** 🎉

---

**Version**: 1.0.0
**Last Updated**: September 2024
**Status**: Production Ready
