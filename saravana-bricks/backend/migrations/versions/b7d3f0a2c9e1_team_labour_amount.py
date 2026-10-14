"""team (labour) amount on production

Adds the per-brick team rate to the business profile (default ₹1.00) and stores
rate + amount on every production entry. Existing entries are filled in at
₹1.00 per brick, the rate the owner confirmed.

Revision ID: b7d3f0a2c9e1
Revises: a1c9e2b4d5f6
Create Date: 2026-10-13

"""
import sqlalchemy as sa
from alembic import op

revision = 'b7d3f0a2c9e1'
down_revision = 'a1c9e2b4d5f6'
branch_labels = None
depends_on = None

MONEY = sa.Numeric(12, 2)

VIEWS = {
    "v_monthly_production": """
        SELECT DATE_FORMAT(production_date, '%Y-%m') AS month,
               SUM(quantity_produced) AS total_bricks,
               SUM(labour_amount) AS team_amount,
               COUNT(DISTINCT production_date) AS production_days,
               COUNT(*) AS entries
        FROM production_entries
        GROUP BY DATE_FORMAT(production_date, '%Y-%m')
    """,
    "v_daily_production": """
        SELECT production_date,
               SUM(quantity_produced) AS total_bricks,
               SUM(labour_amount) AS team_amount,
               COUNT(*) AS entries
        FROM production_entries
        GROUP BY production_date
    """,
}

OLD_VIEWS = {
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
}


def upgrade():
    with op.batch_alter_table('business_profile') as batch:
        batch.add_column(sa.Column('labour_rate_per_brick', MONEY, nullable=False, server_default='1.00'))
    with op.batch_alter_table('production_entries') as batch:
        batch.add_column(sa.Column('labour_rate', MONEY, nullable=False, server_default='0.00'))
        batch.add_column(sa.Column('labour_amount', MONEY, nullable=False, server_default='0.00'))

    op.execute("UPDATE production_entries SET labour_rate = 1.00, labour_amount = quantity_produced * 1.00")

    if op.get_bind().dialect.name == "mysql":
        for name, sql in VIEWS.items():
            op.execute(f"CREATE OR REPLACE VIEW {name} AS {sql}")


def downgrade():
    if op.get_bind().dialect.name == "mysql":
        for name, sql in OLD_VIEWS.items():
            op.execute(f"CREATE OR REPLACE VIEW {name} AS {sql}")
    with op.batch_alter_table('production_entries') as batch:
        batch.drop_column('labour_amount')
        batch.drop_column('labour_rate')
    with op.batch_alter_table('business_profile') as batch:
        batch.drop_column('labour_rate_per_brick')
