from conftest import TEST_LOGIN, order_payload


# --- Authentication ---------------------------------------------------------

def test_api_requires_login(anon):
    for path in ("/api/dashboard", "/api/purchases", "/api/production", "/api/orders", "/api/profile"):
        assert anon.get(path).status_code == 401
    assert anon.post("/api/orders", json=order_payload()).status_code == 401


def test_wrong_password_rejected(anon):
    bad = anon.post("/api/auth/login", json={"login_identifier": TEST_LOGIN, "password": "nope"})
    assert bad.status_code == 401
    assert anon.get("/api/auth/me").status_code == 401


def test_logout_invalidates_cookie(client):
    assert client.get("/api/auth/me").status_code == 200
    client.post("/api/auth/logout")
    assert client.get("/api/auth/me").status_code == 401


def test_no_public_registration_route(anon):
    assert anon.post("/api/auth/register", json={}).status_code in (404, 405)


# --- Validation -------------------------------------------------------------

def test_order_quantity_must_be_positive_integer(client):
    for bad in ("0", "-5", "10.5", "abc"):
        res = client.post("/api/orders", json=order_payload(quantity=bad))
        assert res.status_code == 400, bad
        assert "quantity" in res.get_json()["fields"]


def test_order_required_fields_and_negative_money(client):
    res = client.post("/api/orders", json={"order_date": "2026-10-05"})
    fields = res.get_json()["fields"]
    assert res.status_code == 400
    for name in ("customer_name", "customer_phone", "customer_address", "quantity", "rate_per_brick"):
        assert name in fields
    res = client.post("/api/orders", json=order_payload(discount_amount="-1"))
    assert "discount_amount" in res.get_json()["fields"]


def test_production_quantity_validation(client):
    res = client.post("/api/production", json={"production_date": "2026-10-01", "quantity_produced": "0"})
    assert res.status_code == 400
    res = client.post("/api/production", json={"production_date": "not-a-date", "quantity_produced": "500"})
    assert "production_date" in res.get_json()["fields"]


# --- Orders: server totals and invoice numbers ------------------------------

def test_server_ignores_client_totals(client):
    res = client.post("/api/orders", json=order_payload(total_amount="1.00", subtotal="1.00"))
    assert res.status_code == 201
    body = res.get_json()
    assert body["subtotal"] == "8500.00"
    assert body["total_amount"] == "8500.00"
    assert body["payment_status"] == "Unpaid"
    assert body["balance_due"] == "8500.00"


def test_invoice_numbers_are_sequential_and_unique(client):
    numbers = [
        client.post("/api/orders", json=order_payload()).get_json()["invoice_number"] for _ in range(3)
    ]
    assert numbers == ["SSB-2026-0001", "SSB-2026-0002", "SSB-2026-0003"]


def test_invoice_sequence_restarts_per_year(client):
    client.post("/api/orders", json=order_payload(order_date="2026-12-31"))
    first_2027 = client.post("/api/orders", json=order_payload(order_date="2027-01-01")).get_json()
    assert first_2027["invoice_number"] == "SSB-2027-0001"


def test_cancelled_invoice_number_is_never_reused(client):
    first = client.post("/api/orders", json=order_payload()).get_json()
    assert client.post(f"/api/orders/{first['id']}/cancel").status_code == 200
    second = client.post("/api/orders", json=order_payload()).get_json()
    assert second["invoice_number"] == "SSB-2026-0002"
    # Cancelled orders stay listed but do not count toward order value.
    totals = client.get("/api/orders?month=2026-10").get_json()["totals"]
    assert totals["count"] == 2
    assert totals["order_value"] == "8500.00"


def test_repeated_submit_with_same_key_creates_one_order(client):
    headers = {"Idempotency-Key": "form-123"}
    a = client.post("/api/orders", json=order_payload(), headers=headers)
    b = client.post("/api/orders", json=order_payload(), headers=headers)
    assert a.status_code == 201 and b.status_code == 200
    assert a.get_json()["invoice_number"] == b.get_json()["invoice_number"]
    assert client.get("/api/orders").get_json()["total_rows"] == 1


def test_edit_keeps_invoice_number_and_recalculates(client):
    order = client.post("/api/orders", json=order_payload()).get_json()
    res = client.put(f"/api/orders/{order['id']}",
                     json=order_payload(quantity="2000", amount_paid="17000.00"))
    body = res.get_json()
    assert body["invoice_number"] == order["invoice_number"]
    assert body["total_amount"] == "17000.00"
    assert body["payment_status"] == "Paid"


def test_order_search(client):
    client.post("/api/orders", json=order_payload(customer_name="Murugan Traders", customer_phone="9876500000"))
    client.post("/api/orders", json=order_payload(customer_name="Kavin", customer_phone="9123400000"))
    assert client.get("/api/orders?q=murugan").get_json()["total_rows"] == 1
    assert client.get("/api/orders?q=91234").get_json()["total_rows"] == 1
    assert client.get("/api/orders?q=SSB-2026-0002").get_json()["total_rows"] == 1


# --- Production totals ------------------------------------------------------

def test_monthly_production_total_sums_same_day_entries(client):
    for d, q in [("2026-09-30", 999), ("2026-10-01", 500), ("2026-10-01", 250),
                 ("2026-10-15", 1000), ("2026-10-31", 750), ("2026-11-01", 888)]:
        assert client.post("/api/production", json={"production_date": d, "quantity_produced": str(q)}).status_code == 201

    summary = client.get("/api/production?month=2026-10").get_json()["summary"]
    assert summary["total_bricks"] == 2500
    assert summary["production_days"] == 3
    assert summary["average_per_day"] == "833.3"
    assert {"date": "2026-10-01", "quantity": 750, "labour_amount": "750.00"} in summary["daily"]

    months = client.get("/api/production/monthly?year=2026").get_json()["months"]
    assert months[9] == {"month": "2026-10", "total_bricks": 2500, "production_days": 3, "labour_amount": "2500.00"}
    assert months[8]["total_bricks"] == 999


def test_team_amount_is_bricks_times_rate(client):
    # Default rate comes from the profile: ₹1.00 per brick.
    a = client.post("/api/production", json={"production_date": "2026-10-13", "quantity_produced": "1000",
                                             "labour_amount": "5"}).get_json()
    assert (a["labour_rate"], a["labour_amount"]) == ("1.00", "1000.00")  # client amount ignored
    b = client.post("/api/production", json={"production_date": "2026-10-13", "quantity_produced": "333",
                                             "labour_rate": "1.25"}).get_json()
    assert b["labour_amount"] == "416.25"

    summary = client.get("/api/production?month=2026-10").get_json()["summary"]
    assert summary["labour_amount"] == "1416.25"
    assert summary["daily"][0]["labour_amount"] == "1416.25"
    assert client.get("/api/production/monthly?year=2026").get_json()["months"][9]["labour_amount"] == "1416.25"
    assert client.get("/api/dashboard?month=2026-10").get_json()["production"]["labour_amount"] == "1416.25"


def test_changing_profile_rate_does_not_change_past_entries(client):
    old = client.post("/api/production", json={"production_date": "2026-10-01", "quantity_produced": "100"}).get_json()
    profile = client.get("/api/profile").get_json()
    body = {**profile["business"], "display_name": "Admin", "login_identifier": profile["admin"]["login_identifier"],
            "labour_rate_per_brick": "1.50"}
    assert client.put("/api/profile", json=body).status_code == 200
    new = client.post("/api/production", json={"production_date": "2026-10-02", "quantity_produced": "100"}).get_json()
    assert new["labour_amount"] == "150.00"
    assert client.get(f"/api/production/{old['id']}").get_json()["labour_amount"] == "100.00"


def test_team_rate_cannot_be_negative(client):
    res = client.post("/api/production", json={"production_date": "2026-10-01", "quantity_produced": "10",
                                               "labour_rate": "-1"})
    assert res.status_code == 400 and "labour_rate" in res.get_json()["fields"]


# --- Purchases --------------------------------------------------------------

def test_purchase_void_excluded_from_totals(client):
    base = {"purchase_date": "2026-10-02", "material_name": "Cement", "quantity": "50", "unit": "bag",
            "rate_per_unit": "400.00", "tax_type": "cgst_sgst", "gst_rate": "28"}
    a = client.post("/api/purchases", json=base).get_json()
    assert a["subtotal"] == "20000.00" and a["total_amount"] == "25600.00"
    b = client.post("/api/purchases", json={**base, "material_name": "Fly ash", "subtotal": "5000",
                                            "quantity": None, "tax_type": "none"}).get_json()
    assert b["total_amount"] == "5000.00"

    assert client.get("/api/purchases?month=2026-10").get_json()["totals"]["total_amount"] == "30600.00"
    client.post(f"/api/purchases/{b['id']}/void", json={"reason": "Entered twice"})
    listing = client.get("/api/purchases?month=2026-10").get_json()
    assert listing["totals"]["total_amount"] == "25600.00"
    assert listing["total_rows"] == 1
    assert client.get("/api/purchases?q=fly&include_voided=true").get_json()["total_rows"] == 1


def test_csv_export_neutralises_formulas(client):
    client.post("/api/purchases", json={"purchase_date": "2026-10-02", "material_name": "=HYPERLINK(1)",
                                        "subtotal": "10"})
    text = client.get("/api/purchases/export.csv").get_data(as_text=True)
    assert "'=HYPERLINK(1)" in text


# --- Dashboard / profile ----------------------------------------------------

def test_dashboard_period_totals(client):
    client.post("/api/production", json={"production_date": "2026-10-03", "quantity_produced": "500"})
    client.post("/api/orders", json=order_payload())
    client.post("/api/purchases", json={"purchase_date": "2026-10-02", "material_name": "Sand", "subtotal": "1200"})
    body = client.get("/api/dashboard?month=2026-10").get_json()
    assert body["production"]["total_bricks"] == 500
    assert body["orders"]["count"] == 1
    assert body["orders"]["order_value"] == "8500.00"
    assert body["purchases"]["total_amount"] == "1200.00"


def test_profile_defaults_have_no_invented_details(client):
    business = client.get("/api/profile").get_json()["business"]
    assert business["business_name"] == "Sri Saravana Interlock Bricks Manufacturing"
    assert business["phone"] is None and business["gstin"] is None and business["email"] is None


def test_password_change_requires_current_password(client):
    res = client.post("/api/profile/password", json={
        "current_password": "wrong", "new_password": "another-pass-1", "confirm_password": "another-pass-1"})
    assert res.status_code == 400
    assert "current_password" in res.get_json()["fields"]
