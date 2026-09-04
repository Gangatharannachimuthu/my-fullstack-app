# My Fullstack App - Windows Setup Guide

Complete step-by-step instructions to run the Member Savings & Loan Management System on Windows.

## Step 1: Database Setup (MySQL Workbench)

1. Open **MySQL Workbench**
2. Double-click your MySQL connection (usually `Local instance MySQL80`)
3. Open `database-setup.sql` file from project root
4. Execute the script (Cmd + Enter or Ctrl + Enter)

✅ Database created with sample data!

Alternatively, use command line:
```powershell
mysql -u root < database-setup.sql
```

## Step 2: Backend Setup

1. Open **PowerShell** or **Command Prompt**
2. Navigate to project:
```powershell
cd C:\Users\Canny_831013\Documents\GIT\my-fullstack-app\backend
```

3. Create virtual environment:
```powershell
python -m venv venv
```

4. Activate virtual environment:
```powershell
venv\Scripts\activate
```

You should see `(venv)` at the start of terminal line.

5. Install dependencies:
```powershell
pip install -r requirements.txt
```

6. Copy and configure `.env`:
```powershell
copy .env.example .env
```

Edit `.env` if needed (default works if MySQL password is empty).

7. Run FastAPI server:
```powershell
python main.py
```

You should see:
```
Uvicorn running on http://0.0.0.0:8000
```

✅ Backend running on port 8000!

**Keep this terminal open.**

## Step 3: Frontend Setup

1. Open **new PowerShell/Command Prompt window**
2. Navigate to frontend:
```powershell
cd C:\Users\Canny_831013\Documents\GIT\my-fullstack-app\frontend
```

3. Install dependencies:
```powershell
npm install
```

This takes 2-3 minutes. Wait for completion.

4. Start development server:
```powershell
npm start
```

A browser window opens automatically at `http://localhost:3000`

✅ Frontend running!

## Step 4: Test the Application

In your browser (http://localhost:3000):

1. ✅ View Dashboard with statistics
2. ✅ See 10 sample members
3. ✅ View 5 sample loans
4. ✅ Track contributions
5. ✅ View loan repayments
6. ✅ Check financial reports

All changes sync instantly with database!

## Troubleshooting Windows

**"python command not found"**
- Install Python: https://www.python.org/downloads/
- During install, check ☑️ "Add Python to PATH"
- Restart terminal

**"node command not found"**
- Install Node.js: https://nodejs.org/
- Install LTS version
- Restart terminal

**"Port 3000 already in use"**
```powershell
netstat -ano | findstr :3000
taskkill /PID [PID_NUMBER] /F
```

**"Port 8000 already in use"**
```powershell
netstat -ano | findstr :8000
taskkill /PID [PID_NUMBER] /F
```

**Backend connection error**
- Ensure MySQL is running (System Tray → MySQL icon)
- Check `.env` file matches your MySQL credentials
- Default: user=root, password=(empty), database=member_loan_db

**npm install slow/stuck**
```powershell
npm cache clean --force
npm install
```

## File Locations

- Database: MySQL (localhost:3306)
- Backend: `C:\Users\Canny_831013\Documents\GIT\my-fullstack-app\backend\`
- Frontend: `C:\Users\Canny_831013\Documents\GIT\my-fullstack-app\frontend\`

## Stopping the App

1. Backend terminal: `Ctrl + C`
2. Frontend terminal: `Ctrl + C`
3. MySQL: Keep running or close

## Restarting Next Time

```powershell
# Terminal 1 - Backend
cd C:\Users\Canny_831013\Documents\GIT\my-fullstack-app\backend
venv\Scripts\activate
python main.py

# Terminal 2 - Frontend
cd C:\Users\Canny_831013\Documents\GIT\my-fullstack-app\frontend
npm start
```

## Ports

Make sure these ports are free:
- **8000**: Backend (FastAPI)
- **3000**: Frontend (React)
- **3306**: MySQL Database

## Default Credentials

- Username: `admin`
- Email: `admin@loansystem.com`
- Password: Use registration to create account

## Features Available

✅ Manage members and contributions
✅ Create and track loans
✅ Record loan payments
✅ View financial dashboards
✅ Generate reports
✅ Track expenses
✅ Monthly closing

---

**System Ready!** 🎉

- Dashboard: http://localhost:3000
- API Docs: http://localhost:8000/docs
