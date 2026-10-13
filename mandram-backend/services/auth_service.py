from functools import wraps

from flask import jsonify, request

from models import User


def current_user():
    """The signed-in account, from the X-Username header mandramApi.js attaches.

    Not real authentication - the header is set by the client from its stored
    session and can be spoofed by anything talking to the API directly. It is
    enough to keep the app itself honest about who is looking.
    """
    username = (request.headers.get("X-Username") or "").strip()
    return User.query.filter_by(username=username).first() if username else None


def scoped_member_id(requested_member_id):
    """Which member's rows the caller may see.

    A viewer is pinned to their own linked member regardless of what they asked
    for. An admin gets whatever they filtered on, or None for everyone.
    """
    user = current_user()
    if user and user.role == "viewer":
        return user.member_id if user.member_id else -1  # -1 matches no member
    return requested_member_id


def admin_required(view):
    """Only an account with role=admin may use this endpoint."""

    @wraps(view)
    def wrapper(*args, **kwargs):
        user = current_user()
        if not user or user.role != "admin":
            return jsonify({"error": "Admin access required"}), 403
        return view(*args, **kwargs)

    return wrapper
