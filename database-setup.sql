-- Create database
CREATE DATABASE IF NOT EXISTS todo_app_db;
USE todo_app_db;

-- Create todos table
CREATE TABLE IF NOT EXISTS todos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insert sample data
INSERT INTO todos (title, description, completed) VALUES 
('Learn React', 'Study React hooks and state management', FALSE),
('Build Todo App', 'Create a full-stack todo application', FALSE),
('Setup Database', 'Configure MySQL and create tables', TRUE),
('Deploy Application', 'Deploy to production server', FALSE);

-- Verify
SELECT * FROM todos;
