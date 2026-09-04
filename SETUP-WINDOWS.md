# Windows Setup Guide

Complete step-by-step instructions to run the Todo App on Windows.

## Step 1: Database Setup (MySQL Workbench)

1. Open **MySQL Workbench**
2. Double-click your MySQL connection (usually `Local instance MySQL80`)
3. Paste this and execute:

```sql
CREATE DATABASE todo_app_db;
USE todo_app_db;

CREATE TABLE todos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO todos (title, description, completed) VALUES 
('Learn React', 'Study React hooks and state management', FALSE),
('Build Todo App', 'Create a full-stack todo application', FALSE),
('Setup Database', 'Configure MySQL and create tables', TRUE),
('Deploy Application', 'Deploy to production server', FALSE);
```

✅ Database ready!

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

7. Run Flask server:
```powershell
python app.py
```

You should see:
```
WARNING in app.run() is not recommended...
Running on http://127.0.0.1:5000
```

✅ Backend running on port 5000!

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

## Step 4: Test the App

In your browser:
1. ✅ See 4 sample todos
2. ✅ Click checkbox to mark complete
3. ✅ Type new title and description
4. ✅ Click "Add Todo" button
5. ✅ Click "Delete" button

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

**Backend connection error**
- Ensure MySQL is running (System Tray → MySQL icon)
- Check `.env` file matches your MySQL credentials
- Default: user=root, password=(empty), database=todo_app_db

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
3. MySQL: Keep running

## Restarting Next Time

```powershell
# Terminal 1 - Backend
cd C:\Users\Canny_831013\Documents\GIT\my-fullstack-app\backend
venv\Scripts\activate
python app.py

# Terminal 2 - Frontend
cd C:\Users\Canny_831013\Documents\GIT\my-fullstack-app\frontend
npm start
```

Done! 🎉
