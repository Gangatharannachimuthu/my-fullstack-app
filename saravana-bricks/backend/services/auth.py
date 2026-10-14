import hashlib
import secrets
import threading
import time
from datetime import timedelta
from functools import wraps

from flask import current_app, g, jsonify, request

from extensions import db
from models import AdminSession, utcnow


def _hash_token(token):
    return hashlib.sha256(token.encode()).hexdigest()


def start_session(admin):
    token = secrets.token_urlsafe(32)
    db.session.add(AdminSession(
        token_hash=_hash_token(token),
        admin_id=admin.id,
        expires_at=utcnow() + timedelta(days=current_app.config["SESSION_DAYS"]),
    ))
    # Expired rows are dead weight; sweep them whenever someone logs in.
    AdminSession.query.filter(AdminSession.expires_at < utcnow()).delete()
    db.session.commit()
    return token


def set_session_cookie(response, token):
    cfg = current_app.config
    response.set_cookie(
        cfg["SESSION_COOKIE_NAME"], token,
        max_age=cfg["SESSION_DAYS"] * 86400,
        httponly=True, samesite="Lax", secure=cfg["SESSION_COOKIE_SECURE"], path="/",
    )
    return response


def clear_session_cookie(response):
    response.delete_cookie(current_app.config["SESSION_COOKIE_NAME"], path="/")
    return response


def current_session():
    token = request.cookies.get(current_app.config["SESSION_COOKIE_NAME"])
    if not token:
        return None
    session = AdminSession.query.filter_by(token_hash=_hash_token(token)).first()
    if not session or session.expires_at < utcnow():
        return None
    return session


def end_session():
    session = current_session()
    if session:
        db.session.delete(session)
        db.session.commit()


def end_other_sessions(admin_id, keep_session_id):
    AdminSession.query.filter(
        AdminSession.admin_id == admin_id, AdminSession.id != keep_session_id
    ).delete()


def require_auth(view):
    @wraps(view)
    def wrapper(*args, **kwargs):
        session = current_session()
        if not session:
            return jsonify({"error": "Please log in to continue."}), 401
        g.admin = session.admin
        g.session = session
        return view(*args, **kwargs)

    return wrapper


class LoginThrottle:
    """Slows password guessing: 5 failures per identifier in 15 minutes locks it briefly.

    Kept in memory on purpose - it is a speed bump, not business data.
    """

    LIMIT = 5
    WINDOW = 15 * 60

    def __init__(self):
        self._failures = {}
        self._lock = threading.Lock()

    def _recent(self, key, now):
        return [t for t in self._failures.get(key, []) if now - t < self.WINDOW]

    def blocked(self, key):
        with self._lock:
            return len(self._recent(key, time.monotonic())) >= self.LIMIT

    def fail(self, key):
        with self._lock:
            now = time.monotonic()
            self._failures[key] = self._recent(key, now) + [now]

    def reset(self, key):
        with self._lock:
            self._failures.pop(key, None)


login_throttle = LoginThrottle()
