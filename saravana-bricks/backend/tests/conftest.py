import os
import sys

import pytest
from werkzeug.security import generate_password_hash

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app import create_app  # noqa: E402
from config import TestConfig  # noqa: E402
from extensions import db  # noqa: E402
from models import AdminUser  # noqa: E402

TEST_LOGIN = "owner@example.test"
TEST_PASSWORD = "test-only-password"


@pytest.fixture
def app():
    app = create_app(TestConfig)
    with app.app_context():
        db.create_all()
        db.session.add(AdminUser(
            display_name="Admin", login_identifier=TEST_LOGIN,
            password_hash=generate_password_hash(TEST_PASSWORD),
        ))
        db.session.commit()
        yield app
        db.session.remove()
        db.drop_all()


@pytest.fixture
def anon(app):
    return app.test_client()


@pytest.fixture
def client(app):
    c = app.test_client()
    res = c.post("/api/auth/login", json={"login_identifier": TEST_LOGIN, "password": TEST_PASSWORD})
    assert res.status_code == 200
    return c


def order_payload(**overrides):
    data = {
        "order_date": "2026-10-05",
        "customer_name": "Test Customer",
        "customer_phone": "9000000001",
        "customer_address": "Test Street, Erode",
        "quantity": "1000",
        "rate_per_brick": "8.50",
    }
    data.update(overrides)
    return data
