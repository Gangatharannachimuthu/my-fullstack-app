"""Employees and daily attendance.

Attendance is recorded by exception: every active member counts as a full day (1)
on every working day unless marked half day (0.5) or leave (0). Holidays and
future dates are not counted.
"""

from datetime import timedelta
from decimal import Decimal

from flask import Blueprint, jsonify, request
from sqlalchemy import or_

from extensions import db
from models import AttendanceException, Employee, WorkHoliday
from services.auth import require_auth
from services.common import csv_response, today_local
from services.validation import Parser, ValidationError, resolve_period

employees_bp = Blueprint("employees", __name__, url_prefix="/api")

FULL, HALF, LEAVE = Decimal("1"), Decimal("0.5"), Decimal("0")
MAX_DAYS = 62


def _num(value):
    # 1, 0.5, 0 -> "1", "0.5", "0"
    return format(value.normalize(), "f") if value != 0 else "0"


# --- Employees -------------------------------------------------------------

def _parse_employee(data):
    p = Parser(data)
    values = {
        "name": p.text("name", "Name", required=True, max_len=100),
        "phone": p.phone("phone", "Phone"),
        "start_date": p.date("start_date", "Start date", required=True),
        "end_date": p.date("end_date", "Counted until"),
    }
    if values["start_date"] and values["end_date"] and values["end_date"] < values["start_date"]:
        p.fail("end_date", "Must be on or after the start date.")
    p.raise_if_errors()
    # "Active" simply means still working: no end date, or one not yet passed.
    values["is_active"] = values["end_date"] is None or values["end_date"] >= today_local()
    return values


@employees_bp.get("/employees")
@require_auth
def list_employees():
    rows = Employee.query.order_by(Employee.end_date.isnot(None), Employee.end_date.desc(), Employee.id).all()
    return jsonify({"employees": [e.to_dict() for e in rows]})


@employees_bp.post("/employees")
@require_auth
def create_employee():
    employee = Employee(**_parse_employee(request.get_json(silent=True)))
    db.session.add(employee)
    db.session.commit()
    return jsonify(employee.to_dict()), 201


@employees_bp.put("/employees/<int:employee_id>")
@require_auth
def update_employee(employee_id):
    employee = db.get_or_404(Employee, employee_id)
    for key, value in _parse_employee(request.get_json(silent=True)).items():
        setattr(employee, key, value)
    db.session.commit()
    return jsonify(employee.to_dict())


# --- Attendance ------------------------------------------------------------

def build_attendance(start, end):
    """Grid of members × days with totals. Shared by the API, CSV and the dashboard."""
    today = today_local()
    # Everyone employed at any point in the period - including people who have left since.
    employees = (
        Employee.query.filter(
            Employee.start_date <= end,
            or_(Employee.end_date.is_(None), Employee.end_date >= start),
        ).order_by(Employee.id).all()
    )
    exceptions = {
        (a.employee_id, a.work_date): a
        for a in AttendanceException.query.filter(AttendanceException.work_date.between(start, end))
    }
    holidays = {
        h.work_date: h for h in WorkHoliday.query.filter(WorkHoliday.work_date.between(start, end))
    }

    per_employee = {e.id: {"days_worked": Decimal("0"), "full_days": 0, "half_days": 0, "leave_days": 0}
                    for e in employees}
    days = []
    day = start
    while day <= end:
        holiday = holidays.get(day)
        countable = day <= today and holiday is None
        marks, total = {}, Decimal("0")
        for e in employees:
            if day < e.start_date or (e.end_date and day > e.end_date):
                marks[str(e.id)] = None  # not employed on this day
                continue
            exc = exceptions.get((e.id, day))
            value = exc.value if exc else FULL
            marks[str(e.id)] = {"value": _num(value), "note": exc.note if exc else None}
            if countable:
                total += value
                stats = per_employee[e.id]
                stats["days_worked"] += value
                if value == FULL:
                    stats["full_days"] += 1
                elif value == HALF:
                    stats["half_days"] += 1
                else:
                    stats["leave_days"] += 1
        days.append({
            "date": day.isoformat(),
            "holiday": holiday is not None,
            "holiday_note": holiday.note if holiday else None,
            "future": day > today,
            "marks": marks,
            "total": _num(total) if countable else None,
        })
        day += timedelta(days=1)

    working_days = sum(1 for d in days if d["total"] is not None)
    summary = [
        {**e.to_dict(), **{k: (_num(v) if k == "days_worked" else v) for k, v in per_employee[e.id].items()}}
        for e in employees
    ]
    team_days = sum((per_employee[e.id]["days_worked"] for e in employees), Decimal("0"))
    return {
        "from": start.isoformat(),
        "to": end.isoformat(),
        "employees": [e.to_dict() for e in employees],
        "days": days,
        "summary": summary,
        "totals": {
            "working_days": working_days,
            "holidays": sum(1 for d in days if d["holiday"]),
            "team_days_worked": _num(team_days),
            "half_days": sum(s["half_days"] for s in per_employee.values()),
            "leave_days": sum(s["leave_days"] for s in per_employee.values()),
        },
    }


def _range_from_args(args):
    if not any(args.get(k) for k in ("month", "from", "to")):
        args = {"month": today_local().strftime("%Y-%m")}
    start, end = resolve_period(args)
    if not start or not end:
        raise ValidationError({"from": "Choose a day or a month."})
    if (end - start).days >= MAX_DAYS:
        raise ValidationError({"to": f"Choose at most {MAX_DAYS} days."})
    return start, end


@employees_bp.get("/attendance")
@require_auth
def attendance():
    return jsonify(build_attendance(*_range_from_args(request.args)))


@employees_bp.get("/attendance/export.csv")
@require_auth
def attendance_csv():
    data = build_attendance(*_range_from_args(request.args))
    names = [e["name"] for e in data["employees"]]
    rows = []
    for d in data["days"]:
        y, m, dd = d["date"].split("-")
        cells = []
        for e in data["employees"]:
            mark = d["marks"][str(e["id"])]
            cells.append("" if mark is None or d["holiday"] or d["future"] else mark["value"])
        status = "Holiday" if d["holiday"] else ("" if not d["future"] else "Upcoming")
        rows.append([f"{dd}-{m}-{y}", status, *cells, d["total"] or ""])
    rows.append(["Days worked", "", *[s["days_worked"] for s in data["summary"]], data["totals"]["team_days_worked"]])
    return csv_response("attendance.csv", ["Date", "Status", *names, "Day total"], rows)


@employees_bp.put("/attendance/<work_date>")
@require_auth
def mark(work_date):
    data = request.get_json(silent=True) or {}
    p = Parser({**data, "work_date": work_date})
    day = p.date("work_date", "Date", required=True)
    note = p.text("note", "Note", max_len=255)
    value = str(data.get("value", "")).strip()
    if value not in ("1", "0.5", "0"):
        p.fail("value", "Choose full day (1), half day (0.5) or leave (0).")
    p.raise_if_errors()

    employee = db.get_or_404(Employee, data.get("employee_id"))
    if day < employee.start_date:
        raise ValidationError({}, f"{employee.name} starts on {employee.start_date.strftime('%d-%m-%Y')}.")
    if employee.end_date and day > employee.end_date:
        raise ValidationError({}, f"{employee.name} left on {employee.end_date.strftime('%d-%m-%Y')}.")
    exc = AttendanceException.query.filter_by(employee_id=employee.id, work_date=day).first()
    if value == "1":
        if exc:
            db.session.delete(exc)
    elif exc:
        exc.value, exc.note = Decimal(value), note
    else:
        db.session.add(AttendanceException(employee_id=employee.id, work_date=day, value=Decimal(value), note=note))
    db.session.commit()
    return jsonify(build_attendance(day, day)["days"][0])


@employees_bp.put("/attendance/<work_date>/holiday")
@require_auth
def set_holiday(work_date):
    data = request.get_json(silent=True) or {}
    p = Parser({**data, "work_date": work_date})
    day = p.date("work_date", "Date", required=True)
    note = p.text("note", "Holiday note", max_len=255)
    p.raise_if_errors()
    existing = db.session.get(WorkHoliday, day)
    if data.get("holiday"):
        if existing:
            existing.note = note
        else:
            db.session.add(WorkHoliday(work_date=day, note=note))
    elif existing:
        db.session.delete(existing)
    db.session.commit()
    return jsonify(build_attendance(day, day)["days"][0])
