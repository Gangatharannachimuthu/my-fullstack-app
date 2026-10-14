"""employee end date

Members who left keep appearing in the periods they worked. Anyone already
marked inactive gets an end date of the day they were last updated.

Revision ID: d2a7c5e9f1b4
Revises: c4e8a1d6b2f3
Create Date: 2026-10-13

"""
import sqlalchemy as sa
from alembic import op

revision = 'd2a7c5e9f1b4'
down_revision = 'c4e8a1d6b2f3'
branch_labels = None
depends_on = None


def upgrade():
    with op.batch_alter_table('employees') as batch:
        batch.add_column(sa.Column('end_date', sa.Date()))
    op.execute("UPDATE employees SET end_date = DATE(updated_at) WHERE is_active = 0")


def downgrade():
    with op.batch_alter_table('employees') as batch:
        batch.drop_column('end_date')
