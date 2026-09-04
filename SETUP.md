# Quick Start Setup

## 1. Database Setup
Run this SQL in MySQL Workbench or CLI:
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
INSERT INTO users (name, email, age) VALUES 
('John Doe', 'john@example.com', 30),
('Jane Smith', 'jane@example.com', 28),
('Bob Johnson', 'bob@example.com', 35);
```

Or use the provided script:
```bash
mysql -u root < database-setup.sql
```

## 2. Backend Setup (Terminal 1)
```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env  # Edit .env with your DB credentials
python app.py
```
✅ Backend running: `http://localhost:5000`

## 3. Frontend Setup (Terminal 2)
```bash
cd frontend
npm install
npm start
```
✅ Frontend running: `http://localhost:3000`

## 4. Test the App
- Open `http://localhost:3000` in browser
- View users in table
- Add new user via form
- Delete users with button

## Ports
- Frontend: 3000
- Backend: 5000
- Database: 3306
