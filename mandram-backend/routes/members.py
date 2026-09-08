from datetime import datetime

from flask import Blueprint, jsonify, request

from extensions import db
from models import Loan, Member, Penalty, PersonalLoan, ShareContribution

members_bp = Blueprint("members", __name__)


@members_bp.get("/api/members")
def list_members():
    active_only = request.args.get("active_only", "false").lower() == "true"
    query = Member.query
    if active_only:
        query = query.filter(Member.is_active.is_(True))
    members = query.order_by(Member.name).all()
    return jsonify([m.to_dict() for m in members])


@members_bp.post("/api/members")
def create_member():
    data = request.get_json(force=True)
    if not data.get("name"):
        return jsonify({"error": "name is required"}), 400

    joined_date = None
    if data.get("joined_date"):
        joined_date = datetime.strptime(data["joined_date"], "%Y-%m-%d").date()

    member = Member(
        name=data["name"],
        phone=data.get("phone"),
        joined_date=joined_date,
        is_active=data.get("is_active", True),
    )
    db.session.add(member)
    db.session.commit()
    return jsonify(member.to_dict()), 201


@members_bp.get("/api/members/<int:member_id>")
def get_member(member_id):
    member = Member.query.get_or_404(member_id)
    return jsonify(member.to_dict())


@members_bp.put("/api/members/<int:member_id>")
def update_member(member_id):
    member = Member.query.get_or_404(member_id)
    data = request.get_json(force=True)

    if "name" in data:
        if not data["name"]:
            return jsonify({"error": "name cannot be empty"}), 400
        member.name = data["name"]
    if "phone" in data:
        member.phone = data["phone"]
    if "joined_date" in data:
        member.joined_date = (
            datetime.strptime(data["joined_date"], "%Y-%m-%d").date() if data["joined_date"] else None
        )
    if "is_active" in data:
        member.is_active = data["is_active"]

    db.session.commit()
    return jsonify(member.to_dict())


@members_bp.delete("/api/members/<int:member_id>")
def delete_member(member_id):
    member = Member.query.get_or_404(member_id)

    has_history = (
        ShareContribution.query.filter_by(member_id=member_id).first()
        or Loan.query.filter_by(member_id=member_id).first()
        or PersonalLoan.query.filter_by(member_id=member_id).first()
        or Penalty.query.filter_by(member_id=member_id).first()
    )
    if has_history:
        return jsonify(
            {"error": "Cannot delete a member with recorded ledger history. Mark them inactive instead."}
        ), 409

    db.session.delete(member)
    db.session.commit()
    return jsonify({"message": "Member removed"})
