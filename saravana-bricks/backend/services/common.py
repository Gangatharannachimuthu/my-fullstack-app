import csv
import io
from datetime import datetime
from zoneinfo import ZoneInfo

from flask import Response, current_app
from sqlalchemy.exc import IntegrityError

from extensions import db
from models import BusinessProfile, InvoiceCounter


def today_local():
    return datetime.now(ZoneInfo(current_app.config["BUSINESS_TIMEZONE"])).date()


def get_profile():
    profile = BusinessProfile.query.first()
    if profile is None:
        profile = BusinessProfile(
            business_name=current_app.config["DEFAULT_BUSINESS_NAME"],
            address=current_app.config["DEFAULT_BUSINESS_ADDRESS"],
            payment_tracking_enabled=True,
        )
        db.session.add(profile)
        db.session.commit()
    return profile


def _ensure_counter(year):
    # Created in its own short transaction: locking a row that does not exist yet
    # takes MySQL gap locks, and parallel first orders of a year then deadlock.
    if db.session.get(InvoiceCounter, year) is not None:
        return
    try:
        db.session.add(InvoiceCounter(year=year, last_number=0))
        db.session.commit()
    except IntegrityError:
        db.session.rollback()  # another request created it first - fine


def next_invoice_number(year):
    """Reserve the next invoice number for `year` inside the caller's transaction.

    The counter row is locked (SELECT ... FOR UPDATE on MySQL) so two orders saved
    at the same moment cannot receive the same number. The counter only moves
    forward, so a cancelled order's number is never handed out again.
    """
    _ensure_counter(year)
    counter = (
        db.session.query(InvoiceCounter)
        .filter_by(year=year)
        .with_for_update()
        .populate_existing()
        .one()
    )
    counter.last_number += 1
    prefix = current_app.config["INVOICE_PREFIX"]
    return f"{prefix}-{year}-{counter.last_number:04d}"


def _safe_cell(value):
    # Stop spreadsheet apps from treating a cell as a formula.
    if isinstance(value, str) and value[:1] in ("=", "+", "-", "@", "\t", "\r"):
        return "'" + value
    return "" if value is None else value


def csv_response(filename, header, rows):
    buffer = io.StringIO()
    buffer.write("﻿")  # BOM so Excel opens the ₹ and Tamil text correctly.
    writer = csv.writer(buffer)
    writer.writerow(header)
    for row in rows:
        writer.writerow([_safe_cell(v) for v in row])
    return Response(
        buffer.getvalue(),
        mimetype="text/csv; charset=utf-8",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )
