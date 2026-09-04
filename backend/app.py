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
    'database': os.getenv('DB_NAME', 'myapp_db'),
    'port': int(os.getenv('DB_PORT', 3306))
}

def get_db_connection():
    try:
        connection = mysql.connector.connect(**db_config)
        return connection
    except Error as e:
        print(f"Error while connecting to MySQL: {e}")
        return None

# Routes
@app.route('/', methods=['GET'])
def health():
    return jsonify({'status': 'ok', 'message': 'Flask backend running'}), 200

@app.route('/api/users', methods=['GET'])
def get_users():
    connection = get_db_connection()
    if not connection:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = connection.cursor(dictionary=True)
        cursor.execute('SELECT * FROM users')
        users = cursor.fetchall()
        return jsonify(users), 200
    except Error as e:
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        connection.close()

@app.route('/api/users', methods=['POST'])
def add_user():
    data = request.json
    connection = get_db_connection()
    if not connection:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = connection.cursor()
        query = 'INSERT INTO users (name, email, age) VALUES (%s, %s, %s)'
        cursor.execute(query, (data.get('name'), data.get('email'), data.get('age')))
        connection.commit()
        return jsonify({'id': cursor.lastrowid, 'message': 'User added'}), 201
    except Error as e:
        connection.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        connection.close()

@app.route('/api/users/<int:user_id>', methods=['DELETE'])
def delete_user(user_id):
    connection = get_db_connection()
    if not connection:
        return jsonify({'error': 'Database connection failed'}), 500
    
    try:
        cursor = connection.cursor()
        cursor.execute('DELETE FROM users WHERE id = %s', (user_id,))
        connection.commit()
        return jsonify({'message': 'User deleted'}), 200
    except Error as e:
        connection.rollback()
        return jsonify({'error': str(e)}), 500
    finally:
        cursor.close()
        connection.close()

if __name__ == '__main__':
    app.run(debug=True, port=5000, host='0.0.0.0')
