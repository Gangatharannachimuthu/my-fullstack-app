"""reporting views

Read-only views for looking at the data straight from MySQL (Workbench, Excel,
backups) without repeating the business rules: voided purchases and cancelled
orders are already excluded.

Revision ID: a1c9e2b4d5f6
Revises: f67c3f7a8740
Create Date: 2026-10-13

"""
from alembic import op

revision = 'a1c9e2b4d5f6'
down_revision = 'f67c3f7a8740'
branch_labels = None
depends_on = None

VIEWS = {
    "v_monthly_production": """
        SELECT DATE_FORMAT(production_date, '%Y-%m') AS month,
               SUM(quantity_produced) AS total_bricks,
               COUNT(DISTINCT production_date) AS production_days,
               COUNT(*) AS entries
        FROM production_entries
        GROUP BY DATE_FORMAT(production_date, '%Y-%m')
    """,
    "v_daily_production": """
        SELECT production_date,
               SUM(quantity_produced) AS total_bricks,
               COUNT(*) AS entries
        FROM production_entries
        GROUP BY production_date
    """,
    "v_monthly_purchases": """
        SELECT DATE_FORMAT(purchase_date, '%Y-%m') AS month,
               COUNT(*) AS purchases,
               SUM(taxable_amount) AS taxable_amount,
               SUM(cgst_amount) AS cgst_amount,
               SUM(sgst_amount) AS sgst_amount,
               SUM(igst_amount) AS igst_amount,
               SUM(total_amount) AS total_amount
        FROM material_purchases
        WHERE is_voided = 0
        GROUP BY DATE_FORMAT(purchase_date, '%Y-%m')
    """,
    "v_monthly_orders": """
        SELECT DATE_FORMAT(order_date, '%Y-%m') AS month,
               COUNT(*) AS orders,
               SUM(quantity) AS bricks_ordered,
               SUM(total_amount) AS order_value,
               SUM(amount_paid) AS amount_paid,
               SUM(balance_due) AS balance_due
        FROM customer_orders
        WHERE order_status <> 'Cancelled'
        GROUP BY DATE_FORMAT(order_date, '%Y-%m')
    """,
    "v_invoice_details": """
        SELECT invoice_number, order_date, customer_name, customer_phone, customer_address,
               brick_type, quantity, rate_per_brick, subtotal, discount_amount, taxable_amount,
               tax_type, gst_rate, cgst_amount, sgst_amount, igst_amount, additional_charges,
               total_amount, amount_paid, balance_due, order_status, payment_status, delivery_date
        FROM customer_orders
    """,
}


def upgrade():
    if op.get_bind().dialect.name != "mysql":
        return
    for name, sql in VIEWS.items():
        op.execute(f"CREATE OR REPLACE VIEW {name} AS {sql}")


def downgrade():
    if op.get_bind().dialect.name != "mysql":
        return
    for name in VIEWS:
        op.execute(f"DROP VIEW IF EXISTS {name}")
