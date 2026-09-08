from extensions import db
from models import ExpenditureCategory, InvestmentCategory

DEFAULT_EXPENDITURE_CATEGORIES = ["Electricity", "Hall Rent", "Stationery", "Miscellaneous"]
DEFAULT_INVESTMENT_CATEGORIES = ["Gold", "Outside Chit", "Fixed Deposit"]


def seed_categories():
    if ExpenditureCategory.query.count() == 0:
        db.session.add_all([ExpenditureCategory(name=name) for name in DEFAULT_EXPENDITURE_CATEGORIES])
    if InvestmentCategory.query.count() == 0:
        db.session.add_all([InvestmentCategory(name=name) for name in DEFAULT_INVESTMENT_CATEGORIES])
    db.session.commit()
