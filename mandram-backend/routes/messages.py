from flask import Blueprint, jsonify

from models import Meeting
from services.auth_service import admin_required
from services.message_service import build_loan_reminders

messages_bp = Blueprint("messages", __name__)


@messages_bp.get("/api/meetings/<int:meeting_id>/loan-reminders")
@admin_required
def loan_reminders(meeting_id):
    """Composed loan reminders for every active member, for one meeting.

    Read-only: it builds the text and hands back a dialable number, and does not
    send anything itself. Admin-only, since it exposes every member's loan
    position in one response.
    """
    Meeting.query.get_or_404(meeting_id)
    reminders = build_loan_reminders(meeting_id)
    return jsonify(reminders)
