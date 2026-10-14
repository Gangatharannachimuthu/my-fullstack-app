"""Load (or remove) a full year of 2025 SAMPLE data for testing.

Everything goes through the real API in-process (validation, server-side money
maths, invoice numbering), then the API's totals are cross-checked against
plain SQL sums so any mismatch shows up as a failed check.

All sample rows are dated 2025 and marked "[TEST 2025]" (notes) or "TEST "
(employee / customer names). 2026 data is never touched.

    venv\\Scripts\\python.exe scripts\\seed_2025_sample.py            # load + verify
    venv\\Scripts\\python.exe scripts\\seed_2025_sample.py --verify   # verify only
    venv\\Scripts\\python.exe scripts\\seed_2025_sample.py --remove   # delete all 2025 sample data
"""

import os
import random
import sys
from datetime import date, timedelta
from decimal import ROUND_HALF_UP, Decimal

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import extract, func, text  # noqa: E402

from app import app  # noqa: E402
from config import Config  # noqa: E402
from extensions import db  # noqa: E402
from models import (  # noqa: E402
    AdminSession, AdminUser, AttendanceException, CustomerOrder, Employee, InvoiceCounter,
    MaterialPurchase, ProductionEntry, WorkHoliday,
)
from services.auth import start_session  # noqa: E402

YEAR = 2025
TAG = "[TEST 2025]"
START, END = date(YEAR, 1, 1), date(YEAR, 12, 31)
rng = random.Random(2025)  # same data every run

FESTIVALS = {
    date(2025, 1, 14): "Pongal", date(2025, 1, 15): "Mattu Pongal", date(2025, 1, 26): "Republic Day",
    date(2025, 4, 14): "Tamil New Year", date(2025, 5, 1): "May Day", date(2025, 8, 15): "Independence Day",
    date(2025, 8, 27): "Vinayagar Chaturthi", date(2025, 10, 1): "Ayudha Pooja",
    date(2025, 10, 2): "Gandhi Jayanti", date(2025, 10, 20): "Deepavali", date(2025, 12, 25): "Christmas",
}
EMPLOYEES = [
    ("TEST Kumar", date(2025, 1, 1), date(2025, 12, 31)),
    ("TEST Selvam", date(2025, 1, 1), date(2025, 12, 31)),
    ("TEST Murugan", date(2025, 1, 1), date(2025, 12, 31)),
    ("TEST Ravi", date(2025, 1, 1), date(2025, 6, 30)),      # left mid-year
    ("TEST Arun", date(2025, 7, 1), date(2025, 12, 31)),     # replaced Ravi
]
BRICKS = [("Zig-zag 80mm", (Decimal("9.00"), Decimal("12.50")), 6),
          ("Rectangle 60mm", (Decimal("8.00"), Decimal("10.50")), 3),
          ("I-shape 80mm", (Decimal("9.50"), Decimal("12.00")), 1)]
TOWNS = ["Erode", "Gobichettipalayam", "Bhavani", "Perundurai", "Kavindapadi", "Sathyamangalam",
         "Anthiyur", "Chennimalai", "Salangapalayam", "Nambiyur"]
CUSTOMERS = [f"TEST {n}" for n in [
    "Kumar Builders", "Sakthi Constructions", "Lakshmi Homes", "Vel Traders", "Annai Builders",
    "Senthil Kumar", "Priya Residency", "Arul Promoters", "Kongu Infra", "Balaji Developers",
    "Meena Ganesh", "Raja Contractors", "Sri Amman Builders", "Karthik Civil Works", "Sun Estates",
    "Muthu Engineering", "Ganapathy Housing", "Thangam Constructions", "Velan Farms", "Saravana Temple Trust",
]]
# material: (unit, rate range, qty range, tax_type, gst rate, qty decimals)
MATERIALS = {
    "Cement (OPC 53)": ("bag", (360, 420), (50, 200), "cgst_sgst", "28", 0),
    "Fly ash": ("load", (4000, 6000), (1, 3), "none", None, 0),
    "M-sand": ("load", (4500, 6500), (1, 2), "cgst_sgst", "5", 0),
    "Quarry dust": ("load", (2500, 3500), (1, 3), "none", None, 0),
    "Red oxide pigment": ("kg", (60, 90), (25, 100), "igst", "18", 0),
    "Diesel": ("litre", (88, 95), (50, 200), "none", None, 1),
    "Machine spare parts": ("piece", None, None, "igst", "18", 0),
}
SUPPLIERS = {
    "Cement (OPC 53)": [("TEST Sri Murugan Traders", "Kavindapadi"), ("TEST Kongu Cements", "Erode")],
    "Fly ash": [("TEST Mettur Ash Suppliers", "Mettur")],
    "M-sand": [("TEST Bhavani Sands", "Bhavani")],
    "Quarry dust": [("TEST Chennimalai Blue Metals", "Chennimalai")],
    "Red oxide pigment": [("TEST Gujarat Colours", "Ahmedabad")],
    "Diesel": [("TEST Indian Oil Bunk", "Kavindapadi")],
    "Machine spare parts": [("TEST Coimbatore Machine Works", "Coimbatore")],
}


def money(x):
    return str(Decimal(x).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP))


def days_of_year():
    d = START
    while d <= END:
        yield d
        d += timedelta(days=1)


def holidays():
    hol = {d: "Sunday" for d in days_of_year() if d.weekday() == 6}
    hol.update(FESTIVALS)
    return hol


class Api:
    """Signed-in in-process client using a short-lived session for the first Admin."""

    def __init__(self):
        self.client = app.test_client()
        admin = AdminUser.query.first()
        if not admin:
            sys.exit("No Admin account - run `flask create-admin` first.")
        token = start_session(admin)
        self.client.set_cookie(Config.SESSION_COOKIE_NAME, token)
        self.calls = 0

    def __call__(self, method, path, body=None, expect=(200, 201)):
        self.calls += 1
        res = getattr(self.client, method)(f"/api{path}", json=body)
        if res.status_code not in expect:
            raise SystemExit(f"API {method.upper()} {path} -> {res.status_code}: {res.get_data(as_text=True)[:400]}\nbody={body}")
        return res.get_json()

    def close(self):
        self.client.post("/api/auth/logout")


# --- Loading ---------------------------------------------------------------

def load(api):
    hol = holidays()
    for d, name in sorted(hol.items()):
        api("put", f"/attendance/{d.isoformat()}/holiday", {"holiday": True, "note": f"{name} {TAG}"})
    print(f"  holidays: {len(hol)}")

    emp_ids = {}
    for name, start, end in EMPLOYEES:
        emp = api("post", "/employees", {"name": name, "start_date": start.isoformat(), "end_date": end.isoformat()})
        emp_ids[name] = (emp["id"], start, end)
    print(f"  employees: {len(emp_ids)}")

    working = [d for d in days_of_year() if d not in hol]

    # Attendance: ~4% half days, ~3% leave.
    marks = 0
    for d in working:
        for name, (eid, start, end) in emp_ids.items():
            if not (start <= d <= end):
                continue
            r = rng.random()
            if r < 0.04:
                api("put", f"/attendance/{d.isoformat()}", {"employee_id": eid, "value": "0.5", "note": TAG})
                marks += 1
            elif r < 0.07:
                api("put", f"/attendance/{d.isoformat()}", {"employee_id": eid, "value": "0", "note": TAG})
                marks += 1
    print(f"  attendance exceptions: {marks}")

    # Production: most working days, sometimes a second shift; labour rate rises in July.
    prod = 0
    for d in working:
        if rng.random() < 0.03:  # machine breakdown, nothing produced
            continue
        rate = "1.00" if d.month <= 6 else "1.10"
        low, high = (600, 1200) if d.month in (10, 11) else (800, 1600)  # monsoon
        brick = rng.choices([b[0] for b in BRICKS], weights=[b[2] for b in BRICKS])[0]
        api("post", "/production", {"production_date": d.isoformat(), "brick_type": brick,
                                    "quantity_produced": str(rng.randrange(low, high + 1, 50)),
                                    "labour_rate": rate, "shift_note": "Day shift", "notes": TAG})
        prod += 1
        if rng.random() < 0.10:
            api("post", "/production", {"production_date": d.isoformat(), "brick_type": brick,
                                        "quantity_produced": str(rng.randrange(200, 501, 50)),
                                        "labour_rate": rate, "shift_note": "Evening shift", "notes": TAG})
            prod += 1
    print(f"  production entries: {prod}")

    # Purchases: ~10 a month.
    purchases = []
    for month in range(1, 13):
        days = sorted(rng.sample([d for d in working if d.month == month], 10))
        for d in days:
            material = rng.choices(list(MATERIALS), weights=[4, 2, 2, 2, 1, 3, 1])[0]
            unit, rate_rng, qty_rng, tax_type, gst, qdec = MATERIALS[material]
            supplier, place = rng.choice(SUPPLIERS[material])
            body = {"purchase_date": d.isoformat(), "material_name": material, "unit": unit,
                    "supplier_name": supplier, "supplier_place": place,
                    "supplier_phone": f"90000{rng.randrange(10000, 99999)}",
                    "supplier_invoice_number": f"T25/{month:02d}/{rng.randrange(100, 999)}",
                    "tax_type": tax_type, "notes": TAG}
            if material == "Machine spare parts":
                subtotal = Decimal(rng.randrange(2000, 25000))
                igst = (subtotal * Decimal("0.18")).quantize(Decimal("0.01"))
                body.update(subtotal=money(subtotal), quantity="1", tax_entry="manual", igst_amount=money(igst))
            else:
                qty = Decimal(rng.randint(*qty_rng)) + (Decimal(rng.randint(0, 9)) / 10 if qdec else 0)
                body.update(quantity=str(qty), rate_per_unit=money(rng.uniform(*rate_rng)),
                            tax_entry="rate", gst_rate=gst)
            if rng.random() < 0.15:
                body["discount_amount"] = money(rng.randrange(100, 1000, 50))
            if rng.random() < 0.35:
                body["other_charges"] = money(rng.randrange(300, 2500, 100))
            purchases.append(api("post", "/purchases", body))
    for p in rng.sample(purchases, 3):
        api("post", f"/purchases/{p['id']}/void", {"reason": f"Entered twice {TAG}"})
    edited = rng.choice([p for p in purchases if p["rate_per_unit"]])
    api("put", f"/purchases/{edited['id']}", {**edited, "quantity": str(Decimal(edited["quantity"]) + 5),
                                               "tax_entry": "rate" if edited["gst_rate"] else "manual"})
    print(f"  purchases: {len(purchases)} (3 voided, 1 edited)")

    # Orders: 10-16 a month, created in date order so invoice numbers follow dates.
    orders = []
    order_days = []
    for month in range(1, 13):
        n = rng.randint(10, 16)
        order_days += rng.choices([d for d in working if d.month == month], k=n)
    for d in sorted(order_days):
        brick, (rmin, rmax), _ = rng.choices(BRICKS, weights=[b[2] for b in BRICKS])[0]
        rate = Decimal(rng.randrange(int(rmin * 4), int(rmax * 4) + 1)) / 4  # quarter-rupee steps
        town = rng.choice(TOWNS)
        body = {"order_date": d.isoformat(), "customer_name": rng.choice(CUSTOMERS),
                "customer_phone": f"90000{rng.randrange(10000, 99999)}",
                "customer_address": f"{rng.randint(1, 250)}, Main Road, {town}, Erode District",
                "brick_type": brick, "quantity": str(rng.randrange(500, 8001, 100)),
                "rate_per_brick": money(rate), "notes": TAG,
                "delivery_date": (d + timedelta(days=rng.randint(0, 7))).isoformat()}
        if rng.random() < 0.25:
            body["delivery_address"] = f"Site at {rng.choice(TOWNS)}"
        r = rng.random()
        if r < 0.30:
            body.update(tax_type="cgst_sgst", gst_rate=rng.choice(["5", "12", "18"]))
        elif r < 0.35:
            body.update(tax_type="igst", gst_rate="12")
        if rng.random() < 0.20:
            body["discount_amount"] = money(rng.randrange(100, 2001, 100))
        if rng.random() < 0.50:
            body["additional_charges"] = money(rng.randrange(500, 3001, 250))
        late_dec = d >= date(2025, 12, 20)
        body["order_status"] = "Draft" if late_dec and rng.random() < 0.5 else (
            "Confirmed" if late_dec or rng.random() < 0.08 else "Completed")
        created = api("post", "/orders", body)
        total = Decimal(created["total_amount"])
        pr = rng.random()
        if body["order_status"] == "Completed":
            paid = total if pr < 0.80 else (total * Decimal(rng.choice(["0.25", "0.5", "0.75"])) if pr < 0.95 else None)
        else:
            paid = (total * Decimal("0.3")) if pr < 0.4 else None
        if paid is not None:
            created = api("put", f"/orders/{created['id']}", {**body, "amount_paid": money(paid)})
        orders.append(created)
    cancelled = rng.sample(orders, max(1, len(orders) // 20))
    for o in cancelled:
        api("post", f"/orders/{o['id']}/cancel")
    print(f"  orders: {len(orders)} ({len(cancelled)} cancelled)")


# --- Verification ----------------------------------------------------------

def verify(api):
    """Cross-check API figures against independent SQL. Returns a list of failures."""
    fails = []

    def check(label, got, want):
        ok = str(got) == str(want)
        print(f"  [{'OK' if ok else 'FAIL'}] {label}: api={got} sql={want}")
        if not ok:
            fails.append(label)

    y = extract("year", ProductionEntry.production_date) == YEAR
    sql_bricks = db.session.query(func.coalesce(func.sum(ProductionEntry.quantity_produced), 0)).filter(y).scalar()
    sql_labour = db.session.query(func.coalesce(func.sum(ProductionEntry.labour_amount), 0)).filter(y).scalar()
    monthly = api("get", f"/production/monthly?year={YEAR}")["months"]
    check("production bricks (year, monthly endpoint)", sum(m["total_bricks"] for m in monthly), sql_bricks)
    check("team amount (year)", money(sum(Decimal(m["labour_amount"]) for m in monthly)), money(sql_labour))
    bad_labour = db.session.query(func.count()).filter(
        y, ProductionEntry.labour_amount != ProductionEntry.quantity_produced * ProductionEntry.labour_rate).scalar()
    check("entries where team amount != bricks x rate", bad_labour, 0)
    for m in (1, 7, 12):
        api_m = api("get", f"/production?month={YEAR}-{m:02d}")["summary"]["total_bricks"]
        sql_m = db.session.query(func.coalesce(func.sum(ProductionEntry.quantity_produced), 0)).filter(
            y, extract("month", ProductionEntry.production_date) == m).scalar()
        check(f"production month {m:02d}", api_m, sql_m)

    yp = (extract("year", MaterialPurchase.purchase_date) == YEAR, MaterialPurchase.is_voided.is_(False))
    sql_purch = db.session.query(func.coalesce(func.sum(MaterialPurchase.total_amount), 0)).filter(*yp).scalar()
    api_purch = api("get", f"/purchases?from={YEAR}-01-01&to={YEAR}-12-31")["totals"]["total_amount"]
    check("purchases total (excl. voided)", api_purch, money(sql_purch))
    bad_purch = db.session.query(func.count()).filter(
        extract("year", MaterialPurchase.purchase_date) == YEAR,
        MaterialPurchase.total_amount != MaterialPurchase.taxable_amount + MaterialPurchase.cgst_amount
        + MaterialPurchase.sgst_amount + MaterialPurchase.igst_amount + MaterialPurchase.other_charges).scalar()
    check("purchases whose total != parts", bad_purch, 0)
    mixed = db.session.query(func.count()).filter(
        extract("year", MaterialPurchase.purchase_date) == YEAR,
        MaterialPurchase.igst_amount > 0, MaterialPurchase.cgst_amount > 0).scalar()
    check("purchases charging IGST and CGST together", mixed, 0)

    yo = (extract("year", CustomerOrder.order_date) == YEAR,)
    sql_val = db.session.query(func.coalesce(func.sum(CustomerOrder.total_amount), 0)).filter(
        *yo, CustomerOrder.order_status != "Cancelled").scalar()
    dash = api("get", f"/dashboard?from={YEAR}-01-01&to={YEAR}-12-31")
    check("dashboard order value", dash["orders"]["order_value"], money(sql_val))
    check("dashboard bricks", dash["production"]["total_bricks"], sql_bricks)
    check("dashboard purchases", dash["purchases"]["total_amount"], money(sql_purch))
    bad_orders = db.session.query(func.count()).filter(
        *yo, CustomerOrder.subtotal != CustomerOrder.quantity * CustomerOrder.rate_per_brick).scalar()
    check("orders whose subtotal != qty x rate", bad_orders, 0)
    bad_bal = db.session.query(func.count()).filter(
        *yo, CustomerOrder.balance_due != CustomerOrder.total_amount - CustomerOrder.amount_paid).scalar()
    check("orders whose balance != total - paid", bad_bal, 0)
    nums = [r[0] for r in db.session.query(CustomerOrder.invoice_number).filter(*yo).order_by(CustomerOrder.id)]
    expected = [f"{Config.INVOICE_PREFIX}-{YEAR}-{i:04d}" for i in range(1, len(nums) + 1)]
    check("invoice numbers sequential & unique", nums == expected, True)
    counter = db.session.get(InvoiceCounter, YEAR)
    check("invoice counter = orders issued", counter.last_number if counter else 0, len(nums))
    order_dates = [r[0] for r in db.session.query(CustomerOrder.order_date).filter(*yo).order_by(CustomerOrder.id)]
    check("invoice order follows order dates", order_dates == sorted(order_dates), True)

    att = {"days": 0}
    total_team = Decimal("0")
    hol = {h.work_date for h in WorkHoliday.query.filter(extract("year", WorkHoliday.work_date) == YEAR)}
    for m in range(1, 13):
        data = api("get", f"/attendance?month={YEAR}-{m:02d}")
        total_team += Decimal(data["totals"]["team_days_worked"])
        att["days"] += data["totals"]["working_days"]
    exc = {(a.employee_id, a.work_date): a.value
           for a in AttendanceException.query.filter(extract("year", AttendanceException.work_date) == YEAR)}
    staff = Employee.query.filter(Employee.start_date <= END,
                                  (Employee.end_date.is_(None)) | (Employee.end_date >= START)).all()
    expect_team = Decimal("0")
    for d in days_of_year():
        if d in hol:
            continue
        for e in staff:
            if e.start_date <= d and (e.end_date is None or d <= e.end_date):
                expect_team += exc.get((e.id, d), Decimal("1"))
    check("attendance working days", att["days"], 365 - len(hol))
    check("attendance team days worked (year)", format(total_team.normalize(), "f"),
          format(expect_team.normalize(), "f"))
    ravi = next(e for e in staff if e.name == "TEST Ravi")
    july = api("get", f"/attendance?month={YEAR}-07")
    check("member who left in June absent from July", any(e["id"] == ravi.id for e in july["employees"]), False)
    june = api("get", f"/attendance?month={YEAR}-06")
    check("member who left in June present in June", any(e["id"] == ravi.id for e in june["employees"]), True)

    view = db.session.execute(text(
        f"SELECT COALESCE(SUM(total_bricks),0), COALESCE(SUM(team_amount),0) FROM v_monthly_production WHERE month LIKE '{YEAR}-%'"
    )).one() if db.engine.dialect.name == "mysql" else (sql_bricks, sql_labour)
    check("view v_monthly_production bricks", int(view[0]), sql_bricks)
    view_o = db.session.execute(text(
        f"SELECT COALESCE(SUM(order_value),0) FROM v_monthly_orders WHERE month LIKE '{YEAR}-%'"
    )).scalar() if db.engine.dialect.name == "mysql" else sql_val
    check("view v_monthly_orders value", money(view_o), money(sql_val))

    for path in ("/production/export.csv", "/purchases/export.csv", "/orders/export.csv"):
        res = api.client.get(f"/api{path}?from={YEAR}-01-01&to={YEAR}-12-31")
        check(f"CSV {path} downloads", res.status_code, 200)
    res = api.client.get(f"/api/attendance/export.csv?month={YEAR}-03")
    check("CSV attendance downloads", res.status_code, 200)
    return fails


# --- Removal ---------------------------------------------------------------

def remove():
    y = YEAR
    counts = {
        "customer_orders": CustomerOrder.query.filter(extract("year", CustomerOrder.order_date) == y).delete(synchronize_session=False),
        "invoice_counters": InvoiceCounter.query.filter(InvoiceCounter.year == y).delete(synchronize_session=False),
        "material_purchases": MaterialPurchase.query.filter(extract("year", MaterialPurchase.purchase_date) == y).delete(synchronize_session=False),
        "production_entries": ProductionEntry.query.filter(extract("year", ProductionEntry.production_date) == y).delete(synchronize_session=False),
        "attendance_exceptions": AttendanceException.query.filter(extract("year", AttendanceException.work_date) == y).delete(synchronize_session=False),
        "work_holidays": WorkHoliday.query.filter(extract("year", WorkHoliday.work_date) == y).delete(synchronize_session=False),
        "employees (TEST)": Employee.query.filter(Employee.name.like("TEST %")).delete(synchronize_session=False),
    }
    db.session.commit()
    for k, v in counts.items():
        print(f"  deleted {v:>5}  {k}")


def existing_2025():
    return sum([
        CustomerOrder.query.filter(extract("year", CustomerOrder.order_date) == YEAR).count(),
        MaterialPurchase.query.filter(extract("year", MaterialPurchase.purchase_date) == YEAR).count(),
        ProductionEntry.query.filter(extract("year", ProductionEntry.production_date) == YEAR).count(),
    ])


def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else "--load"
    with app.app_context():
        if mode == "--remove":
            print(f"Removing all {YEAR} sample data...")
            remove()
            return
        api = Api()
        try:
            if mode == "--load":
                if existing_2025():
                    sys.exit(f"{YEAR} data already exists - run with --remove first, or --verify.")
                print(f"Loading {YEAR} sample data through the API...")
                load(api)
                print(f"  ({api.calls} API calls)")
            print("Verifying API figures against SQL...")
            fails = verify(api)
        finally:
            api.close()
            AdminSession.query.filter(AdminSession.expires_at < func.now()).delete(synchronize_session=False)
            db.session.commit()
        print(f"\n{'ALL CHECKS PASSED' if not fails else f'{len(fails)} CHECK(S) FAILED: ' + ', '.join(fails)}")
        sys.exit(1 if fails else 0)


if __name__ == "__main__":
    main()
