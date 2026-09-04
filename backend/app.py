from flask import Flask, jsonify
from flask_cors import CORS
import mysql.connector

app = Flask(__name__)
CORS(app)

# MySQL Connection
def get_db_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="your_password",  # ← Change this
        database="myapp_db"
    )

# Get all users
@app.route('/api/users', methods=['GET'])
def get_users():
    try:
        db = get_db_connection()
        cursor = db.cursor(dictionary=True)
        cursor.execute("SELECT * FROM users")
        users = cursor.fetchall()
        cursor.close()
        db.close()
        return jsonify(users)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# Add new user
@app.route('/api/users', methods=['POST'])
def add_user():
    from flask import request
    try:
        data = request.json
        db = get_db_connection()
        cursor = db.cursor()
        cursor.execute(
            "INSERT INTO users (name, email, age) VALUES (%s, %s, %s)",
            (data['name'], data['email'], data['age'])
        )
        db.commit()
        cursor.close()
        db.close()
        return jsonify({"message": "User added"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)