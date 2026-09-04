from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
from mysql.connector import Error
from datetime import datetime
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
CORS(app)

# Database config
db_config = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'user': os.getenv('DB_USER', 'root'),
    'password': os.getenv('DB_PASSWORD', ''),
    'database': os.getenv('DB_NAME', 'todo_app_db'),
    'port': int(os.getenv('DB_PORT', 3306))
}

def get_db_connection():
    try:
        connection = mysql.connector.connect(**db_config)
        return connection
    except Error as e:
        print(f"Error while connecting to MySQL: {e}")
        return None

# Health check
@app.route('/', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'message': 'Todo API running'}), 200

# GET all todos
@app.route('/api/todos', methods=['GET'])
def get_todos():
    connection = get_db_connection()
    if not connection:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = connection.cursor(dictionary=True)
        cursor.execute('SELECT * FROM todos ORDER BY created_at DESC')
        todos = cursor.fetchall()
        return jsonify(todos), 200
    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        connection.close()

# GET single todo
@app.route('/api/todos/<int:todo_id>', methods=['GET'])
def get_todo(todo_id):
    connection = get_db_connection()
    if not connection:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = connection.cursor(dictionary=True)
        cursor.execute('SELECT * FROM todos WHERE id = %s', (todo_id,))
        todo = cursor.fetchone()
        if not todo:
            return jsonify({'error': 'Todo not found'}), 404
        return jsonify(todo), 200
    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        connection.close()

# POST - Create new todo
@app.route('/api/todos', methods=['POST'])
def create_todo():
    data = request.json
    connection = get_db_connection()
    if not connection:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = connection.cursor()
        query = 'INSERT INTO todos (title, description, completed) VALUES (%s, %s, %s)'
        cursor.execute(query, (data.get('title'), data.get('description', ''), False))
        connection.commit()
        return jsonify({'id': cursor.lastrowid, 'message': 'Todo created'}), 201
    except Error as e:
        connection.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        connection.close()

# PUT - Update todo
@app.route('/api/todos/<int:todo_id>', methods=['PUT'])
def update_todo(todo_id):
    data = request.json
    connection = get_db_connection()
    if not connection:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = connection.cursor()
        query = 'UPDATE todos SET title = %s, description = %s, completed = %s WHERE id = %s'
        cursor.execute(query, (data.get('title'), data.get('description', ''), data.get('completed', False), todo_id))
        connection.commit()
        return jsonify({'message': 'Todo updated'}), 200
    except Error as e:
        connection.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        connection.close()

# DELETE todo
@app.route('/api/todos/<int:todo_id>', methods=['DELETE'])
def delete_todo(todo_id):
    connection = get_db_connection()
    if not connection:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = connection.cursor()
        cursor.execute('DELETE FROM todos WHERE id = %s', (todo_id,))
        connection.commit()
        return jsonify({'message': 'Todo deleted'}), 200
    except Error as e:
        connection.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        connection.close()

if __name__ == '__main__':
    app.run(debug=True, port=5000, host='0.0.0.0')
