from models import Meeting


class MeetingFinalizedError(Exception):
    pass


def ensure_meeting_editable(meeting_id):
    """Raise if the given meeting has already been finalized (locked)."""
    if meeting_id is None:
        return
    meeting = Meeting.query.get(meeting_id)
    if meeting and meeting.status == "finalized":
        raise MeetingFinalizedError(f"Meeting {meeting.month}/{meeting.year} is finalized and read-only")
