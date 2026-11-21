"""orders hold several invoices

An order (bookings table) is what the customer booked; each invoice
(customer_orders row) delivers part of it. Every existing invoice becomes its
own order with the same id, customer and quantity, so nothing on it changes.

Revision ID: e5f1a3c7b9d2
Revises: d2a7c5e9f1b4
Create Date: 2026-11-21

"""
import sqlalchemy as sa
from alembic import op

revision = 'e5f1a3c7b9d2'
down_revision = 'd2a7c5e9f1b4'
branch_labels = None
depends_on = None


def upgrade():
    op.create_table(
        'bookings',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('order_date', sa.Date(), nullable=False),
        sa.Column('customer_name', sa.String(length=150), nullable=False),
        sa.Column('customer_phone', sa.String(length=20), nullable=False),
        sa.Column('customer_address', sa.String(length=500), nullable=False),
        sa.Column('delivery_address', sa.String(length=500)),
        sa.Column('brick_type', sa.String(length=100)),
        sa.Column('booked_quantity', sa.Integer(), nullable=False),
        sa.Column('notes', sa.Text()),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.CheckConstraint('booked_quantity > 0', name='ck_booking_qty_positive'),
        sa.PrimaryKeyConstraint('id'),
    )
    op.create_index('ix_bookings_order_date', 'bookings', ['order_date'])
    op.create_index('ix_bookings_customer_name', 'bookings', ['customer_name'])
    op.create_index('ix_bookings_customer_phone', 'bookings', ['customer_phone'])

    with op.batch_alter_table('customer_orders') as batch:
        batch.add_column(sa.Column('booking_id', sa.Integer()))
        batch.create_index('ix_customer_orders_booking_id', ['booking_id'])
        batch.create_foreign_key('fk_customer_orders_booking', 'bookings', ['booking_id'], ['id'])

    op.execute(
        "INSERT INTO bookings (id, order_date, customer_name, customer_phone, customer_address,"
        " delivery_address, brick_type, booked_quantity, created_at, updated_at)"
        " SELECT id, order_date, customer_name, customer_phone, COALESCE(customer_address, ''),"
        " delivery_address, brick_type, quantity, created_at, updated_at FROM customer_orders"
    )
    # Only rows copied above: an invoice saved mid-upgrade must not break the foreign key.
    op.execute("UPDATE customer_orders SET booking_id = id WHERE id IN (SELECT id FROM bookings)")


def downgrade():
    with op.batch_alter_table('customer_orders') as batch:
        batch.drop_constraint('fk_customer_orders_booking', type_='foreignkey')
        batch.drop_index('ix_customer_orders_booking_id')
        batch.drop_column('booking_id')
    op.drop_table('bookings')
