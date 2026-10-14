from flask import Blueprint, g, jsonify, make_response, request
from werkzeug.security import check_password_hash

from models import AdminUser
from services.auth import (
    clear_session_cookie,
    end_session,
    login_throttle,
    require_auth,
    set_session_cookie,
    start_session,
)

auth_bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@auth_bp.post("/login")
def login():
    data = request.get_json(silent=True) or {}
    identifier = (data.get("login_identifier") or "").strip()
    password = data.get("password") or ""

    fields = {}
    if not identifier:
        fields["login_identifier"] = "Enter your login ID."
    if not password:
        fields["password"] = "Enter your password."
    if fields:
        return jsonify({"error": "Please fill in both fields.", "fields": fields}), 400

    key = identifier.lower()
    if login_throttle.blocked(key):
        return jsonify({"error": "Too many failed attempts. Please wait 15 minutes and try again."}), 429

    admin = AdminUser.query.filter_by(login_identifier=identifier).first()
    if not admin or not check_password_hash(admin.password_hash, password):
        login_throttle.fail(key)
        return jsonify({"error": "Login ID or password is incorrect."}), 401

    login_throttle.reset(key)
    token = start_session(admin)
    return set_session_cookie(make_response(jsonify({"admin": admin.to_dict()})), token)


@auth_bp.post("/logout")
def logout():
    end_session()
    return clear_session_cookie(make_response(jsonify({"ok": True})))


@auth_bp.get("/me")
@require_auth
def me():
    return jsonify({"admin": g.admin.to_dict()})
