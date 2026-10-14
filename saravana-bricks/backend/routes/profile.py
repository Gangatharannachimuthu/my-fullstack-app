import base64
import re

from flask import Blueprint, current_app, g, jsonify, request
from werkzeug.security import check_password_hash, generate_password_hash

from extensions import db
from models import AdminUser
from services.auth import end_other_sessions, require_auth
from services.common import get_profile
from services.validation import EMAIL_RE, GSTIN_RE, Parser, ValidationError

profile_bp = Blueprint("profile", __name__, url_prefix="/api/profile")

LOGO_RE = re.compile(r"^data:image/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)$")
MIN_PASSWORD = 8


@profile_bp.get("")
@require_auth
def get_all():
    return jsonify({"admin": g.admin.to_dict(), "business": get_profile().to_dict()})


@profile_bp.get("/business")
@require_auth
def business():
    return jsonify(get_profile().to_dict())


@profile_bp.put("")
@require_auth
def update():
    data = request.get_json(silent=True) or {}
    p = Parser(data)
    display_name = p.text("display_name", "Display name", required=True, max_len=100)
    login_identifier = p.text("login_identifier", "Login ID", required=True, max_len=150)
    admin_phone = p.phone("admin_phone", "Admin phone")
    business_name = p.text("business_name", "Business name", required=True, max_len=200)
    address = p.text("address", "Business address", required=True, max_len=500)
    phone = p.phone("phone", "Business phone")
    email = p.text("email", "Business email", max_len=150)
    gstin = p.text("gstin", "GSTIN", max_len=15)
    invoice_terms = p.text("invoice_terms", "Invoice footer/terms", max_len=2000)
    payment_tracking = bool(data.get("payment_tracking_enabled", True))
    labour_rate = p.money("labour_rate_per_brick", "Team rate per brick", required=True, default=None)

    if email and not EMAIL_RE.match(email):
        p.fail("email", "Business email is not valid.")
    if gstin:
        gstin = gstin.upper()
        if not GSTIN_RE.match(gstin):
            p.fail("gstin", "GSTIN must be the 15-character format, e.g. 33ABCDE1234F1Z5.")
    if login_identifier and AdminUser.query.filter(
        AdminUser.login_identifier == login_identifier, AdminUser.id != g.admin.id
    ).first():
        p.fail("login_identifier", "This login ID is already in use.")

    logo = data.get("logo_data")
    if logo:
        match = LOGO_RE.match(logo)
        if not match:
            p.fail("logo_data", "Logo must be a PNG, JPEG or WebP image.")
        elif len(base64.b64decode(match.group(2))) > current_app.config["MAX_LOGO_BYTES"]:
            p.fail("logo_data", "Logo must be smaller than 300 KB.")
    p.raise_if_errors()

    g.admin.display_name = display_name
    g.admin.login_identifier = login_identifier
    g.admin.phone = admin_phone

    profile = get_profile()
    profile.business_name = business_name
    profile.address = address
    profile.phone = phone
    profile.email = email
    profile.gstin = gstin
    profile.invoice_terms = invoice_terms
    profile.payment_tracking_enabled = payment_tracking
    profile.labour_rate_per_brick = labour_rate
    profile.logo_data = logo or None
    db.session.commit()
    return jsonify({"admin": g.admin.to_dict(), "business": profile.to_dict()})


@profile_bp.post("/password")
@require_auth
def change_password():
    data = request.get_json(silent=True) or {}
    current = data.get("current_password") or ""
    new = data.get("new_password") or ""
    confirm = data.get("confirm_password") or ""

    fields = {}
    if not check_password_hash(g.admin.password_hash, current):
        fields["current_password"] = "Current password is incorrect."
    if len(new) < MIN_PASSWORD:
        fields["new_password"] = f"New password must be at least {MIN_PASSWORD} characters."
    elif new == current:
        fields["new_password"] = "New password must be different from the current one."
    if new != confirm:
        fields["confirm_password"] = "Passwords do not match."
    if fields:
        raise ValidationError(fields)

    g.admin.password_hash = generate_password_hash(new)
    # Sign out every other device; this one stays logged in.
    end_other_sessions(g.admin.id, g.session.id)
    db.session.commit()
    return jsonify({"ok": True})
