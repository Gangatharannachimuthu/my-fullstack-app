"""employees and attendance

Attendance is stored by exception (half day / leave only); a missing row means a
full day. Seeds the four team members as "Member 1".."Member 4", starting from
the first day of the current month - rename them in the Employees tab.

Revision ID: c4e8a1d6b2f3
Revises: b7d3f0a2c9e1
Create Date: 2026-10-13

"""
from datetime import datetime, timezone
from zoneinfo import ZoneInfo

import sqlalchemy as sa
from alembic import op

revision = 'c4e8a1d6b2f3'
down_revision = 'b7d3f0a2c9e1'
branch_labels = None
depends_on = None


def upgrade():
    employees = op.create_table(
        'employees',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('name', sa.String(100), nullable=False),
        sa.Column('phone', sa.String(20)),
        sa.Column('start_date', sa.Date(), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('created_at', sa.DateTime(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
    )
    op.create_index('ix_employees_is_active', 'employees', ['is_active'])

    op.create_table(
        'attendance_exceptions',
        sa.Column('id', sa.Integer(), primary_key=True),
        sa.Column('employee_id', sa.Integer(), sa.ForeignKey('employees.id', ondelete='CASCADE'), nullable=False),
        sa.Column('work_date', sa.Date(), nullable=False),
        sa.Column('value', sa.Numeric(2, 1), nullable=False),
        sa.Column('note', sa.String(255)),
        sa.Column('updated_at', sa.DateTime(), nullable=False),
        sa.UniqueConstraint('employee_id', 'work_date', name='uq_attendance_employee_date'),
        sa.CheckConstraint('value IN (0, 0.5)', name='ck_attendance_value'),
    )
    op.create_index('ix_attendance_exceptions_work_date', 'attendance_exceptions', ['work_date'])

    op.create_table(
        'work_holidays',
        sa.Column('work_date', sa.Date(), primary_key=True),
        sa.Column('note', sa.String(255)),
    )

    today = datetime.now(ZoneInfo("Asia/Kolkata")).date()
    now = datetime.now(timezone.utc).replace(tzinfo=None)
    op.bulk_insert(employees, [
        {"name": f"Member {i}", "start_date": today.replace(day=1), "is_active": True,
         "created_at": now, "updated_at": now}
        for i in range(1, 5)
    ])


def downgrade():
    op.drop_table('work_holidays')
    op.drop_index('ix_attendance_exceptions_work_date', table_name='attendance_exceptions')
    op.drop_table('attendance_exceptions')
    op.drop_index('ix_employees_is_active', table_name='employees')
    op.drop_table('employees')
