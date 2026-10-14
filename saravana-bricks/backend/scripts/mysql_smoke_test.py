"""End-to-end check against a real MySQL server, in a throwaway schema.

Creates `ssb_smoketest_tmp` on the server from DATABASE_URL, migrates it, runs
parallel order creation (invoice-number locking), purchases, production and the
reporting views, then drops the schema. Your real data is never touched.

    venv\\Scripts\\python.exe scripts\\mysql_smoke_test.py
"""

import os
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor
from urllib.parse import unquote, urlparse

from dotenv import load_dotenv

HERE = os.path.dirname(os.path.abspath(__file__))
BACKEND = os.path.dirname(HERE)
TEMP_DB = "ssb_smoketest_tmp"


def server_conn(url):
    import pymysql

    u = urlparse(url.replace("mysql+pymysql", "mysql"))
    return pymysql.connect(host=u.hostname, port=u.port or 3306, user=u.username,
                           password=unquote(u.password or ""), autocommit=True)


def main():
    load_dotenv(os.path.join(BACKEND, ".env"))
    real_url = os.environ["DATABASE_URL"]
    temp_url = real_url.rsplit("/", 1)[0] + "/" + TEMP_DB
    conn = server_conn(real_url)
    conn.cursor().execute(f"CREATE DATABASE {TEMP_DB} CHARACTER SET utf8mb4")
    try:
        env = {**os.environ, "DATABASE_URL": temp_url, "FLASK_APP": "app.py"}
        subprocess.run([sys.executable, "-m", "flask", "db", "upgrade"], cwd=BACKEND, env=env,
                       check=True, capture_output=True)
        os.environ["DATABASE_URL"] = temp_url
        sys.path.insert(0, BACKEND)
        run_checks()
    finally:
        conn.cursor().execute(f"DROP DATABASE IF EXISTS {TEMP_DB}")
        print("temp schema dropped")


def run_checks():
    from sqlalchemy import text
    from werkzeug.security import generate_password_hash

    from app import create_app
    from config import Config
    from extensions import db
    from models import AdminUser

    Config.SQLALCHEMY_DATABASE_URI = os.environ["DATABASE_URL"]
    app = create_app(Config)
    with app.app_context():
        db.session.add(AdminUser(login_identifier="smoke", password_hash=generate_password_hash("smoke-pass-1")))
        db.session.commit()

    def client():
        c = app.test_client()
        c.post("/api/auth/login", json={"login_identifier": "smoke", "password": "smoke-pass-1"})
        return c

    order = dict(order_date="2026-10-13", customer_name="X", customer_phone="9000000000",
                 customer_address="Erode", quantity="1000", rate_per_brick="8.50",
                 tax_type="cgst_sgst", gst_rate="5", discount_amount="100")

    def place(_):
        res = client().post("/api/orders", json=order)
        return res.status_code, res.get_json()

    with ThreadPoolExecutor(8) as pool:
        results = list(pool.map(place, range(8)))
    failures = [r for r in results if r[0] != 201]
    assert not failures, failures
    numbers = sorted(r[1]["invoice_number"] for r in results)
    assert numbers == [f"SSB-2026-{i:04d}" for i in range(1, 9)], numbers
    print("8 parallel orders -> unique sequential invoices:", numbers[0], "...", numbers[-1])

    body = results[0][1]
    assert (body["subtotal"], body["taxable_amount"], body["cgst_amount"], body["total_amount"]) == \
        ("8500.00", "8400.00", "210.00", "8820.00"), body
    print("order money (MySQL DECIMAL):", body["total_amount"])

    c = client()
    p = c.post("/api/purchases", json=dict(purchase_date="2026-10-10", material_name="Cement", quantity="12.5",
                                           unit="bag", rate_per_unit="410.40", tax_type="igst", gst_rate="28")).get_json()
    assert (p["subtotal"], p["igst_amount"], p["total_amount"]) == ("5130.00", "1436.40", "6566.40"), p
    print("purchase money:", p["total_amount"])

    c.post("/api/production", json=dict(production_date="2026-10-12", quantity_produced="500"))
    c.post("/api/production", json=dict(production_date="2026-10-12", quantity_produced="250"))
    summary = c.get("/api/production?month=2026-10").get_json()["summary"]
    assert summary["daily"] == [{"date": "2026-10-12", "quantity": 750}], summary
    print("production same-day entries summed:", summary["total_bricks"])

    c.post(f"/api/orders/{body['id']}/cancel")
    after = c.post("/api/orders", json=order).get_json()["invoice_number"]
    assert after == "SSB-2026-0009", after
    print("after cancel, next invoice:", after)

    with app.app_context():
        rows = db.session.execute(text("SELECT month, orders, order_value FROM v_monthly_orders")).all()
        assert [tuple(map(str, r)) for r in rows] == [("2026-10", "8", "70560.00")], rows
        print("view v_monthly_orders:", rows)
    print("ALL MYSQL CHECKS PASSED")


if __name__ == "__main__":
    main()
