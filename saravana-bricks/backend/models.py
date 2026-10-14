from datetime import datetime, timezone
from decimal import Decimal

from extensions import db

MONEY = db.Numeric(12, 2)
RATE = db.Numeric(5, 2)
QTY = db.Numeric(12, 3)

ORDER_STATUSES = ("Draft", "Confirmed", "Completed", "Cancelled")
PAYMENT_STATUSES = ("Unpaid", "Partially Paid", "Paid")
TAX_TYPES = ("none", "cgst_sgst", "igst")


def utcnow():
    return datetime.now(timezone.utc).replace(tzinfo=None)


def _iso_utc(value):
    return value.isoformat() + "Z" if value else None


def _date(value):
    return value.isoformat() if value else None


def _money(value):
    return f"{value:.2f}" if value is not None else None


def _plain(value):
    # Quantities and rates go out as plain strings so the browser never sees floats.
    return format(value.normalize(), "f") if value is not None else None


class TimestampMixin:
    created_at = db.Column(db.DateTime, nullable=False, default=utcnow)
    updated_at = db.Column(db.DateTime, nullable=False, default=utcnow, onupdate=utcnow)


class AdminUser(TimestampMixin, db.Model):
    __tablename__ = "admin_users"

    id = db.Column(db.Integer, primary_key=True)
    display_name = db.Column(db.String(100), nullable=False, default="Admin")
    login_identifier = db.Column(db.String(150), nullable=False, unique=True)
    password_hash = db.Column(db.String(255), nullable=False)
    phone = db.Column(db.String(20))

    def to_dict(self):
        return {
            "id": self.id,
            "display_name": self.display_name,
            "login_identifier": self.login_identifier,
            "phone": self.phone,
        }


class AdminSession(db.Model):
    """Server-side session; the browser holds only the random token in an HttpOnly cookie."""

    __tablename__ = "admin_sessions"

    id = db.Column(db.Integer, primary_key=True)
    token_hash = db.Column(db.String(64), nullable=False, unique=True)
    admin_id = db.Column(db.Integer, db.ForeignKey("admin_users.id", ondelete="CASCADE"), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=utcnow)
    expires_at = db.Column(db.DateTime, nullable=False, index=True)

    admin = db.relationship("AdminUser")


class BusinessProfile(TimestampMixin, db.Model):
    __tablename__ = "business_profile"

    id = db.Column(db.Integer, primary_key=True)
    business_name = db.Column(db.String(200), nullable=False)
    address = db.Column(db.String(500), nullable=False)
    phone = db.Column(db.String(20))
    email = db.Column(db.String(150))
    gstin = db.Column(db.String(15))
    logo_data = db.Column(db.Text().with_variant(db.Text(length=2**24 - 1), "mysql"))
    invoice_terms = db.Column(db.Text)
    payment_tracking_enabled = db.Column(db.Boolean, nullable=False, default=True)
    # Team (labour) pay per brick produced; pre-fills each new production entry.
    labour_rate_per_brick = db.Column(MONEY, nullable=False, default=Decimal("1.00"))

    def to_dict(self):
        return {
            "labour_rate_per_brick": _money(self.labour_rate_per_brick),
            "business_name": self.business_name,
            "address": self.address,
            "phone": self.phone,
            "email": self.email,
            "gstin": self.gstin,
            "logo_data": self.logo_data,
            "invoice_terms": self.invoice_terms,
            "payment_tracking_enabled": self.payment_tracking_enabled,
        }


class MaterialPurchase(TimestampMixin, db.Model):
    __tablename__ = "material_purchases"

    id = db.Column(db.Integer, primary_key=True)
    purchase_date = db.Column(db.Date, nullable=False, index=True)
    material_name = db.Column(db.String(150), nullable=False, index=True)
    quantity = db.Column(QTY)
    unit = db.Column(db.String(30))
    rate_per_unit = db.Column(MONEY)
    supplier_name = db.Column(db.String(150), index=True)
    supplier_phone = db.Column(db.String(20))
    supplier_place = db.Column(db.String(255))
    supplier_invoice_number = db.Column(db.String(100), index=True)
    subtotal = db.Column(MONEY, nullable=False, default=0)
    discount_amount = db.Column(MONEY, nullable=False, default=0)
    taxable_amount = db.Column(MONEY, nullable=False, default=0)
    tax_type = db.Column(db.String(10), nullable=False, default="none")
    gst_rate = db.Column(RATE)
    cgst_amount = db.Column(MONEY, nullable=False, default=0)
    sgst_amount = db.Column(MONEY, nullable=False, default=0)
    igst_amount = db.Column(MONEY, nullable=False, default=0)
    other_charges = db.Column(MONEY, nullable=False, default=0)
    total_amount = db.Column(MONEY, nullable=False, default=0)
    notes = db.Column(db.Text)
    # Voided rather than deleted, so the purchase history stays auditable.
    is_voided = db.Column(db.Boolean, nullable=False, default=False, index=True)
    voided_at = db.Column(db.DateTime)
    void_reason = db.Column(db.String(255))

    def to_dict(self):
        return {
            "id": self.id,
            "purchase_date": _date(self.purchase_date),
            "material_name": self.material_name,
            "quantity": _plain(self.quantity),
            "unit": self.unit,
            "rate_per_unit": _money(self.rate_per_unit),
            "supplier_name": self.supplier_name,
            "supplier_phone": self.supplier_phone,
            "supplier_place": self.supplier_place,
            "supplier_invoice_number": self.supplier_invoice_number,
            "subtotal": _money(self.subtotal),
            "discount_amount": _money(self.discount_amount),
            "taxable_amount": _money(self.taxable_amount),
            "tax_type": self.tax_type,
            "gst_rate": _plain(self.gst_rate),
            "cgst_amount": _money(self.cgst_amount),
            "sgst_amount": _money(self.sgst_amount),
            "igst_amount": _money(self.igst_amount),
            "other_charges": _money(self.other_charges),
            "total_amount": _money(self.total_amount),
            "notes": self.notes,
            "is_voided": self.is_voided,
            "voided_at": _iso_utc(self.voided_at),
            "void_reason": self.void_reason,
            "created_at": _iso_utc(self.created_at),
            "updated_at": _iso_utc(self.updated_at),
        }


class ProductionEntry(TimestampMixin, db.Model):
    __tablename__ = "production_entries"

    id = db.Column(db.Integer, primary_key=True)
    production_date = db.Column(db.Date, nullable=False, index=True)
    brick_type = db.Column(db.String(100))
    quantity_produced = db.Column(db.Integer, nullable=False)
    # Rate is stored on the entry so a later rate change never alters past pay.
    labour_rate = db.Column(MONEY, nullable=False, default=Decimal("0.00"))
    labour_amount = db.Column(MONEY, nullable=False, default=Decimal("0.00"))
    shift_note = db.Column(db.String(255))
    notes = db.Column(db.Text)

    __table_args__ = (
        db.CheckConstraint("quantity_produced > 0", name="ck_production_qty_positive"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "production_date": _date(self.production_date),
            "brick_type": self.brick_type,
            "quantity_produced": self.quantity_produced,
            "labour_rate": _money(self.labour_rate),
            "labour_amount": _money(self.labour_amount),
            "shift_note": self.shift_note,
            "notes": self.notes,
            "created_at": _iso_utc(self.created_at),
            "updated_at": _iso_utc(self.updated_at),
        }


class Employee(TimestampMixin, db.Model):
    __tablename__ = "employees"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(20))
    # Attendance is counted from start_date through end_date (open-ended if null),
    # so past months keep showing people who have since left.
    start_date = db.Column(db.Date, nullable=False)
    end_date = db.Column(db.Date)
    is_active = db.Column(db.Boolean, nullable=False, default=True, index=True)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "phone": self.phone,
            "start_date": _date(self.start_date),
            "end_date": _date(self.end_date),
            "is_active": self.is_active,
        }


class AttendanceException(db.Model):
    """Only days someone was NOT fully present are stored; no row means a full day (1)."""

    __tablename__ = "attendance_exceptions"

    id = db.Column(db.Integer, primary_key=True)
    employee_id = db.Column(db.Integer, db.ForeignKey("employees.id", ondelete="CASCADE"), nullable=False)
    work_date = db.Column(db.Date, nullable=False, index=True)
    # 0.5 = half day, 0 = leave
    value = db.Column(db.Numeric(2, 1), nullable=False)
    note = db.Column(db.String(255))
    updated_at = db.Column(db.DateTime, nullable=False, default=utcnow, onupdate=utcnow)

    __table_args__ = (
        db.UniqueConstraint("employee_id", "work_date", name="uq_attendance_employee_date"),
        db.CheckConstraint("value IN (0, 0.5)", name="ck_attendance_value"),
    )


class WorkHoliday(db.Model):
    """A day nobody works (Sunday, festival, shutdown); not counted for anyone."""

    __tablename__ = "work_holidays"

    work_date = db.Column(db.Date, primary_key=True)
    note = db.Column(db.String(255))


class InvoiceCounter(db.Model):
    """Last issued invoice sequence per year. Only ever moves forward."""

    __tablename__ = "invoice_counters"

    year = db.Column(db.Integer, primary_key=True, autoincrement=False)
    last_number = db.Column(db.Integer, nullable=False, default=0)


class CustomerOrder(TimestampMixin, db.Model):
    __tablename__ = "customer_orders"

    id = db.Column(db.Integer, primary_key=True)
    invoice_number = db.Column(db.String(30), nullable=False, unique=True)
    # Lets a double-clicked submit return the first order instead of creating two.
    client_request_id = db.Column(db.String(64), unique=True)
    order_date = db.Column(db.Date, nullable=False, index=True)
    customer_name = db.Column(db.String(150), nullable=False, index=True)
    customer_phone = db.Column(db.String(20), nullable=False, index=True)
    customer_address = db.Column(db.String(500))
    delivery_address = db.Column(db.String(500))
    brick_type = db.Column(db.String(100))
    quantity = db.Column(db.Integer, nullable=False)
    rate_per_brick = db.Column(MONEY, nullable=False)
    subtotal = db.Column(MONEY, nullable=False)
    discount_amount = db.Column(MONEY, nullable=False, default=0)
    taxable_amount = db.Column(MONEY, nullable=False)
    tax_type = db.Column(db.String(10), nullable=False, default="none")
    gst_rate = db.Column(RATE)
    cgst_amount = db.Column(MONEY, nullable=False, default=0)
    sgst_amount = db.Column(MONEY, nullable=False, default=0)
    igst_amount = db.Column(MONEY, nullable=False, default=0)
    additional_charges = db.Column(MONEY, nullable=False, default=0)
    total_amount = db.Column(MONEY, nullable=False)
    amount_paid = db.Column(MONEY)
    balance_due = db.Column(MONEY)
    delivery_date = db.Column(db.Date)
    order_status = db.Column(db.String(20), nullable=False, default="Confirmed", index=True)
    payment_status = db.Column(db.String(20), index=True)
    notes = db.Column(db.Text)
    cancelled_at = db.Column(db.DateTime)

    __table_args__ = (
        db.CheckConstraint("quantity > 0", name="ck_order_qty_positive"),
        db.CheckConstraint("rate_per_brick >= 0", name="ck_order_rate_non_negative"),
    )

    def to_dict(self):
        return {
            "id": self.id,
            "invoice_number": self.invoice_number,
            "order_date": _date(self.order_date),
            "customer_name": self.customer_name,
            "customer_phone": self.customer_phone,
            "customer_address": self.customer_address,
            "delivery_address": self.delivery_address,
            "brick_type": self.brick_type,
            "quantity": self.quantity,
            "rate_per_brick": _money(self.rate_per_brick),
            "subtotal": _money(self.subtotal),
            "discount_amount": _money(self.discount_amount),
            "taxable_amount": _money(self.taxable_amount),
            "tax_type": self.tax_type,
            "gst_rate": _plain(self.gst_rate),
            "cgst_amount": _money(self.cgst_amount),
            "sgst_amount": _money(self.sgst_amount),
            "igst_amount": _money(self.igst_amount),
            "additional_charges": _money(self.additional_charges),
            "total_amount": _money(self.total_amount),
            "amount_paid": _money(self.amount_paid),
            "balance_due": _money(self.balance_due),
            "delivery_date": _date(self.delivery_date),
            "order_status": self.order_status,
            "payment_status": self.payment_status,
            "notes": self.notes,
            "cancelled_at": _iso_utc(self.cancelled_at),
            "created_at": _iso_utc(self.created_at),
            "updated_at": _iso_utc(self.updated_at),
        }
