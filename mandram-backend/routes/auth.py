from flask import Blueprint, jsonify, request
from werkzeug.security import check_password_hash

from models import User

auth_bp = Blueprint("auth", __name__)


@auth_bp.post("/api/auth/login")
def login():
    data = request.get_json(force=True)
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""

    if not username or not password:
        return jsonify({"error": "username and password are required"}), 400

    # Every account lives in the users table - an unknown username is a failed
    # login, not an implicit admin.
    user = User.query.filter_by(username=username).first()
    if not user or not check_password_hash(user.password_hash, password):
        return jsonify({"error": "Invalid credentials"}), 401

    # to_dict carries member_id/member_name, which the UI uses to scope a viewer's
    # loan tabs to their own rows.
    return jsonify(user.to_dict())
