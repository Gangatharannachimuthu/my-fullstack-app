"""Field parsing shared by every write route.

Each parser records a human-readable message against the field name instead of
raising immediately, so the client can show every problem at once.
"""

import calendar
import re
from datetime import date, datetime
from decimal import Decimal, InvalidOperation

PHONE_RE = re.compile(r"^\+?[0-9][0-9\s-]{5,18}[0-9]$")
GSTIN_RE = re.compile(r"^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$")
EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
MONTH_RE = re.compile(r"^(\d{4})-(\d{2})$")


class ValidationError(Exception):
    def __init__(self, fields, message="Please correct the highlighted fields."):
        super().__init__(message)
        self.fields = fields
        self.message = message


class Parser:
    def __init__(self, data):
        self.data = data if isinstance(data, dict) else {}
        self.errors = {}

    def _raw(self, field):
        value = self.data.get(field)
        if isinstance(value, str):
            value = value.strip()
        return None if value in (None, "") else value

    def fail(self, field, message):
        self.errors.setdefault(field, message)

    def raise_if_errors(self):
        if self.errors:
            raise ValidationError(self.errors)

    def text(self, field, label, required=False, max_len=255):
        value = self._raw(field)
        if value is None:
            if required:
                self.fail(field, f"{label} is required.")
            return None
        value = str(value)
        if len(value) > max_len:
            self.fail(field, f"{label} must be at most {max_len} characters.")
        return value

    def phone(self, field, label, required=False):
        value = self.text(field, label, required=required, max_len=20)
        if value and not PHONE_RE.match(value):
            self.fail(field, f"{label} must be a valid phone number (digits, spaces, + or -).")
        return value

    def date(self, field, label, required=False):
        value = self._raw(field)
        if value is None:
            if required:
                self.fail(field, f"{label} is required.")
            return None
        try:
            return datetime.strptime(str(value), "%Y-%m-%d").date()
        except ValueError:
            self.fail(field, f"{label} must be a valid date.")
            return None

    def decimal(self, field, label, required=False, places=2, max_value=None, default=None):
        value = self._raw(field)
        if value is None:
            if required:
                self.fail(field, f"{label} is required.")
            return default
        if isinstance(value, bool) or isinstance(value, float):
            # Floats lose precision in transit; the client always sends strings.
            value = str(value)
        try:
            number = Decimal(str(value))
        except InvalidOperation:
            self.fail(field, f"{label} must be a number.")
            return default
        if not number.is_finite():
            self.fail(field, f"{label} must be a number.")
            return default
        if number < 0:
            self.fail(field, f"{label} cannot be negative.")
            return default
        if number != number.quantize(Decimal(1).scaleb(-places)):
            self.fail(field, f"{label} can have at most {places} decimal places.")
            return default
        if max_value is not None and number > max_value:
            self.fail(field, f"{label} must not exceed {max_value}.")
            return default
        return number.quantize(Decimal(1).scaleb(-places))

    def money(self, field, label, required=False, default=Decimal("0.00")):
        return self.decimal(
            field, label, required=required, places=2,
            max_value=Decimal("9999999999.99"), default=default,
        )

    def positive_int(self, field, label, required=True):
        value = self._raw(field)
        if value is None:
            if required:
                self.fail(field, f"{label} is required.")
            return None
        if isinstance(value, bool):
            self.fail(field, f"{label} must be a whole number.")
            return None
        text = str(value)
        if not re.fullmatch(r"\d+", text):
            self.fail(field, f"{label} must be a positive whole number.")
            return None
        number = int(text)
        if number <= 0:
            self.fail(field, f"{label} must be greater than zero.")
            return None
        if number > 100_000_000:
            self.fail(field, f"{label} is too large.")
            return None
        return number

    def choice(self, field, label, choices, default=None):
        value = self._raw(field)
        if value is None:
            return default
        if value not in choices:
            self.fail(field, f"{label} must be one of: {', '.join(choices)}.")
            return default
        return value


def resolve_period(args):
    """Turn ?month=YYYY-MM or ?from=&to= (or ?year=) query args into a date range.

    Dates in this app are business-calendar dates in Asia/Kolkata, stored as DATE,
    so a month is simply its first through last calendar day.
    """
    month = (args.get("month") or "").strip()
    start = (args.get("from") or "").strip()
    end = (args.get("to") or "").strip()
    year = (args.get("year") or "").strip()

    if month:
        match = MONTH_RE.match(month)
        if not match or not 1 <= int(match.group(2)) <= 12:
            raise ValidationError({"month": "Month must look like YYYY-MM."})
        y, m = int(match.group(1)), int(match.group(2))
        return date(y, m, 1), date(y, m, calendar.monthrange(y, m)[1])

    if year:
        if not re.fullmatch(r"\d{4}", year):
            raise ValidationError({"year": "Year must be four digits."})
        return date(int(year), 1, 1), date(int(year), 12, 31)

    parsed = {}
    for key, raw in (("from", start), ("to", end)):
        if raw:
            try:
                parsed[key] = datetime.strptime(raw, "%Y-%m-%d").date()
            except ValueError:
                raise ValidationError({key: "Date must be valid (YYYY-MM-DD)."})
    if "from" in parsed and "to" in parsed and parsed["from"] > parsed["to"]:
        raise ValidationError({"to": "End date must be on or after the start date."})
    return parsed.get("from"), parsed.get("to")


def pagination(args, default=20, maximum=100):
    try:
        page = max(int(args.get("page", 1)), 1)
        per_page = min(max(int(args.get("per_page", default)), 1), maximum)
    except ValueError:
        page, per_page = 1, default
    return page, per_page
