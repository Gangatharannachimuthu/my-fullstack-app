from werkzeug.security import generate_password_hash

from config import Config
from extensions import db
from models import ExpenditureCategory, InvestmentCategory, User

DEFAULT_EXPENDITURE_CATEGORIES = ["Electricity", "Hall Rent", "Stationery", "Miscellaneous"]
DEFAULT_INVESTMENT_CATEGORIES = ["Gold", "Outside Chit", "Fixed Deposit"]


def seed_categories():
    if ExpenditureCategory.query.count() == 0:
        db.session.add_all([ExpenditureCategory(name=name) for name in DEFAULT_EXPENDITURE_CATEGORIES])
    if InvestmentCategory.query.count() == 0:
        db.session.add_all([InvestmentCategory(name=name) for name in DEFAULT_INVESTMENT_CATEGORIES])
    db.session.commit()


def seed_admin():
    """Create the first admin only when no admin exists yet.

    Member logins are not seeded from code - the admin creates them from the
    Users tab, and they live in the users table.
    """
    if User.query.filter_by(role="admin").first():
        return

    db.session.add(
        User(
            username=Config.BOOTSTRAP_ADMIN_USERNAME,
            password_hash=generate_password_hash(Config.BOOTSTRAP_ADMIN_PASSWORD),
            role="admin",
        )
    )
    db.session.commit()
