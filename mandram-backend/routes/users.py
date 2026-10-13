from flask import Blueprint, jsonify, request
from werkzeug.security import generate_password_hash

from extensions import db
from models import Member, User
from services.auth_service import admin_required

users_bp = Blueprint("users", __name__)

MIN_PASSWORD_LENGTH = 6
VALID_ROLES = ("admin", "viewer")


def _validate(username, password, role, require_password=True):
    """Return an error message for bad input, or None when it is usable."""
    if not username:
        return "username is required"
    if role not in VALID_ROLES:
        return f"role must be one of {', '.join(VALID_ROLES)}"
    if require_password or password:
        if len(password) < MIN_PASSWORD_LENGTH:
            return f"password must be at least {MIN_PASSWORD_LENGTH} characters"
    return None


def _validate_member_link(member_id, exclude_user_id=None):
    """A login may be tied to one member, and a member to one login."""
    if member_id is None:
        return None
    if not Member.query.get(member_id):
        return f"No member with id {member_id}"

    query = User.query.filter(User.member_id == member_id)
    if exclude_user_id is not None:
        query = query.filter(User.id != exclude_user_id)
    clash = query.first()
    if clash:
        return f"Member is already linked to the login '{clash.username}'"
    return None


@users_bp.get("/api/users")
@admin_required
def list_users():
    users = User.query.order_by(User.role, User.username).all()
    return jsonify([u.to_dict() for u in users])


@users_bp.post("/api/users")
@admin_required
def create_user():
    data = request.get_json(force=True)
    username = (data.get("username") or "").strip()
    password = data.get("password") or ""
    role = data.get("role") or "viewer"
    member_id = data.get("member_id") or None

    error = _validate(username, password, role)
    if error:
        return jsonify({"error": error}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({"error": f"Username '{username}' already exists"}), 409

    error = _validate_member_link(member_id)
    if error:
        return jsonify({"error": error}), 409

    user = User(
        username=username,
        password_hash=generate_password_hash(password),
        role=role,
        member_id=member_id,
    )
    db.session.add(user)
    db.session.commit()
    return jsonify(user.to_dict()), 201


@users_bp.put("/api/users/<int:user_id>")
@admin_required
def update_user(user_id):
    user = User.query.get_or_404(user_id)
    data = request.get_json(force=True)

    username = (data.get("username") or user.username).strip()
    password = data.get("password") or ""
    role = data.get("role") or user.role

    # Password is optional on update - blank means "leave it alone".
    error = _validate(username, password, role, require_password=False)
    if error:
        return jsonify({"error": error}), 400

    clash = User.query.filter(User.username == username, User.id != user.id).first()
    if clash:
        return jsonify({"error": f"Username '{username}' already exists"}), 409

    # Never let the last admin be demoted - that would lock everyone out of
    # user management with no way back in.
    if user.role == "admin" and role != "admin" and User.query.filter_by(role="admin").count() == 1:
        return jsonify({"error": "Cannot demote the only admin"}), 409

    # Absent key = leave the link alone; explicit null = unlink.
    if "member_id" in data:
        member_id = data.get("member_id") or None
        error = _validate_member_link(member_id, exclude_user_id=user.id)
        if error:
            return jsonify({"error": error}), 409
        user.member_id = member_id

    user.username = username
    user.role = role
    if password:
        user.password_hash = generate_password_hash(password)

    db.session.commit()
    return jsonify(user.to_dict())


@users_bp.delete("/api/users/<int:user_id>")
@admin_required
def delete_user(user_id):
    user = User.query.get_or_404(user_id)

    if user.role == "admin" and User.query.filter_by(role="admin").count() == 1:
        return jsonify({"error": "Cannot delete the only admin"}), 409

    db.session.delete(user)
    db.session.commit()
    return jsonify({"message": f"User '{user.username}' removed"})
