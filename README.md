# Fullstack Application

React frontend + Flask backend + MySQL database

## Tech Stack
- **Frontend**: React 18
- **Backend**: Flask
- **Database**: MySQL
- **API**: RESTful with CORS support

## Project Structure
```
fullstack-fresh/
├── backend/
│   ├── app.py           # Flask application
│   ├── requirements.txt  # Python dependencies
│   ├── .env.example     # Environment variables template
│   └── venv/            # Virtual environment (create locally)
├── frontend/
│   ├── src/
│   │   ├── App.js       # Main React component
│   │   ├── App.css      # Component styling
│   │   ├── index.js     # Entry point
│   │   └── index.css    # Global styling
│   ├── public/
│   │   └── index.html   # HTML template
│   ├── package.json     # Node dependencies
│   └── node_modules/    # Dependencies (create locally)
└── README.md            # This file
```

## Prerequisites
- Python 3.8+
- Node.js 14+
- MySQL 5.7+

## Setup

### Backend

1. Create virtual environment:
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

2. Install dependencies:
```bash
pip install -r requirements.txt
```

3. Create `.env` file (copy from `.env.example`):
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=myapp_db
DB_PORT=3306
```

4. Create MySQL database:
```sql
CREATE DATABASE myapp_db;
USE myapp_db;

CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    age INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Optional: Insert test data
INSERT INTO users (name, email, age) VALUES 
('John Doe', 'john@example.com', 30),
('Jane Smith', 'jane@example.com', 28),
('Bob Johnson', 'bob@example.com', 35);
```

5. Run Flask server:
```bash
python app.py
```
Backend runs on `http://localhost:5000`

### Frontend

1. Install dependencies:
```bash
cd frontend
npm install
```

2. Start React dev server:
```bash
npm start
```
Frontend runs on `http://localhost:3000`

## API Endpoints

### GET /api/users
Fetch all users
**Response:**
```json
[
  {
    "id": 1,
    "name": "John Doe",
    "email": "john@example.com",
    "age": 30,
    "created_at": "2024-01-15 10:30:00"
  }
]
```

### POST /api/users
Add new user
**Request:**
```json
{
  "name": "Alice Brown",
  "email": "alice@example.com",
  "age": 27
}
```
**Response:**
```json
{
  "id": 4,
  "message": "User added"
}
```

### DELETE /api/users/{id}
Delete user by ID
**Response:**
```json
{
  "message": "User deleted"
}
```

## Running Locally

1. Start MySQL server
2. Terminal 1 - Backend:
```bash
cd backend
source venv/bin/activate
python app.py
```

3. Terminal 2 - Frontend:
```bash
cd frontend
npm start
```

4. Open `http://localhost:3000` in browser

## Features
- ✅ Display list of users
- ✅ Add new users with form
- ✅ Delete users from table
- ✅ Error handling and loading states
- ✅ CORS enabled for frontend-backend communication

## Troubleshooting

**Database connection error:**
- Verify MySQL is running
- Check `.env` credentials
- Ensure `myapp_db` database exists

**CORS error:**
- Backend has `Flask-CORS` enabled
- Ensure backend is running on port 5000
- Frontend should be on port 3000

**npm install issues:**
- Delete `node_modules` and `package-lock.json`
- Run `npm install` again

## Deployment
See individual README files in backend/ and frontend/ for deployment instructions.
