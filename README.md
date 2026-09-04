# My Fullstack App - Todo Application

A complete full-stack Todo application with React frontend, Flask backend, and MySQL database.

## Tech Stack
- **Frontend**: React 18 (JavaScript)
- **Backend**: Flask (Python)
- **Database**: MySQL
- **API**: RESTful with CORS

## Features
✅ Add todos with title and description  
✅ Mark todos as complete/incomplete  
✅ Delete todos  
✅ Real-time sync with database  
✅ Beautiful responsive UI  
✅ Error handling & loading states  

## Project Structure
```
sample-todo-app/
├── backend/
│   ├── app.py                 # Flask API server
│   ├── requirements.txt        # Python dependencies
│   ├── .env.example           # Environment template
│   └── venv/                  # Virtual environment (local)
├── frontend/
│   ├── src/
│   │   ├── App.js             # Main Todo component
│   │   ├── App.css            # Component styling
│   │   ├── index.js           # Entry point
│   │   └── index.css          # Global styles
│   ├── public/
│   │   └── index.html         # HTML template
│   ├── package.json           # Node dependencies
│   └── node_modules/          # Dependencies (local)
├── database-setup.sql         # MySQL setup script
├── README.md                  # This file
└── .gitignore
```

## Prerequisites
- Python 3.8+
- Node.js 14+
- MySQL 5.7+

## Quick Start (5 minutes)

### 1. Database Setup

Run in MySQL Workbench or command line:

```bash
mysql -u root < database-setup.sql
```

Or copy-paste in MySQL Workbench:
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

### 2. Backend Setup (Terminal 1)

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Mac/Linux)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy .env template and configure
copy .env.example .env

# Run Flask server
python app.py
```

✅ Backend running: `http://localhost:5000`

### 3. Frontend Setup (Terminal 2)

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm start
```

✅ Frontend running: `http://localhost:3000` (opens automatically)

## API Endpoints

### GET /api/todos
Get all todos

**Response:**
```json
[
  {
    "id": 1,
    "title": "Learn React",
    "description": "Study React hooks",
    "completed": false,
    "created_at": "2024-01-15 10:30:00"
  }
]
```

### POST /api/todos
Create new todo

**Request:**
```json
{
  "title": "My Todo",
  "description": "Description here"
}
```

**Response:**
```json
{
  "id": 5,
  "message": "Todo created"
}
```

### PUT /api/todos/{id}
Update todo

**Request:**
```json
{
  "title": "Updated title",
  "description": "Updated description",
  "completed": true
}
```

### DELETE /api/todos/{id}
Delete todo

## Troubleshooting

**Backend won't start:**
- Verify Python is installed: `python --version`
- Check MySQL is running
- Verify `.env` has correct DB credentials

**Frontend won't start:**
- Verify Node.js is installed: `node --version`
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again
- Check port 3000 isn't in use

**Database connection error:**
- Ensure MySQL server is running
- Check username/password in `.env`
- Verify `todo_app_db` database exists

**CORS error:**
- Ensure backend is running on port 5000
- Ensure frontend is on port 3000
- Backend already has CORS enabled

## Running for Development

**Terminal 1 - Database:**
- Ensure MySQL is running

**Terminal 2 - Backend:**
```bash
cd backend
source venv/bin/activate  # or venv\Scripts\activate on Windows
python app.py
```

**Terminal 3 - Frontend:**
```bash
cd frontend
npm start
```

Open `http://localhost:3000` in your browser.

## Ports
- Frontend: 3000
- Backend: 5000
- Database: 3306

## Next Steps
- Add user authentication
- Add categories/tags to todos
- Add due dates
- Deploy to production
