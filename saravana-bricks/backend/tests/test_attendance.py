from datetime import date
from unittest.mock import patch

import pytest

TODAY = date(2026, 10, 13)


@pytest.fixture
def team(client):
    with patch("routes.employees.today_local", return_value=TODAY):
        ids = [
            client.post("/api/employees", json={"name": f"Member {i}", "start_date": "2026-10-01"}).get_json()["id"]
            for i in range(1, 5)
        ]
    return ids


def get(client, **params):
    with patch("routes.employees.today_local", return_value=TODAY):
        return client.get("/api/attendance", query_string=params).get_json()


def put(client, path, body):
    with patch("routes.employees.today_local", return_value=TODAY):
        return client.put(path, json=body)


def test_everyone_counts_full_day_by_default(client, team):
    data = get(client, month="2026-10")
    # 1st..13th are counted; 14th onwards is in the future.
    assert data["totals"]["working_days"] == 13
    assert data["totals"]["team_days_worked"] == "52"
    day = next(d for d in data["days"] if d["date"] == "2026-10-05")
    assert day["total"] == "4"
    assert next(d for d in data["days"] if d["date"] == "2026-10-20")["total"] is None


def test_half_day_and_leave_reduce_the_day_total(client, team):
    put(client, "/api/attendance/2026-10-05", {"employee_id": team[0], "value": "0.5", "note": "Hospital"})
    res = put(client, "/api/attendance/2026-10-05", {"employee_id": team[1], "value": "0"})
    assert res.get_json()["total"] == "2.5"

    data = get(client, month="2026-10")
    s1 = data["summary"][0]
    assert (s1["days_worked"], s1["half_days"], s1["leave_days"], s1["full_days"]) == ("12.5", 1, 0, 12)
    assert data["summary"][1]["days_worked"] == "12"
    assert data["totals"]["team_days_worked"] == "50.5"
    assert (data["totals"]["half_days"], data["totals"]["leave_days"]) == (1, 1)


def test_marking_full_day_again_clears_the_exception(client, team):
    put(client, "/api/attendance/2026-10-05", {"employee_id": team[0], "value": "0"})
    res = put(client, "/api/attendance/2026-10-05", {"employee_id": team[0], "value": "1"})
    assert res.get_json()["total"] == "4"


def test_holiday_is_not_counted(client, team):
    put(client, "/api/attendance/2026-10-02/holiday", {"holiday": True, "note": "Gandhi Jayanti"})
    data = get(client, month="2026-10")
    assert data["totals"]["working_days"] == 12
    assert data["totals"]["team_days_worked"] == "48"
    assert data["totals"]["holidays"] == 1
    put(client, "/api/attendance/2026-10-02/holiday", {"holiday": False})
    assert get(client, month="2026-10")["totals"]["team_days_worked"] == "52"


def test_single_day_view(client, team):
    put(client, "/api/attendance/2026-10-13", {"employee_id": team[3], "value": "0.5"})
    data = get(client, **{"from": "2026-10-13", "to": "2026-10-13"})
    assert len(data["days"]) == 1 and data["days"][0]["total"] == "3.5"


def test_new_member_counted_from_start_date(client, team):
    with patch("routes.employees.today_local", return_value=TODAY):
        client.post("/api/employees", json={"name": "New joiner", "start_date": "2026-10-11"})
    data = get(client, month="2026-10")
    assert data["summary"][4]["days_worked"] == "3"  # 11, 12, 13
    res = put(client, "/api/attendance/2026-10-05", {"employee_id": data["summary"][4]["id"], "value": "0"})
    assert res.status_code == 400


def test_member_who_left_stays_in_past_periods_only(client, team):
    with patch("routes.employees.today_local", return_value=TODAY):
        client.put(f"/api/employees/{team[3]}", json={"name": "Member 4", "start_date": "2026-10-01", "end_date": "2026-10-05"})
    oct_ = get(client, month="2026-10")
    assert len(oct_["employees"]) == 4                      # still shown for October
    assert oct_["summary"][3]["days_worked"] == "5"         # 1st..5th only
    assert len(get(client, month="2026-11")["employees"]) == 3  # gone from later months
    assert put(client, "/api/attendance/2026-10-06", {"employee_id": team[3], "value": "0"}).status_code == 400
    bad = client.put(f"/api/employees/{team[3]}", json={"name": "M4", "start_date": "2026-10-01", "end_date": "2026-09-01"})
    assert bad.status_code == 400


def test_invalid_values_rejected(client, team):
    assert put(client, "/api/attendance/2026-10-05", {"employee_id": team[0], "value": "0.25"}).status_code == 400
    assert client.post("/api/employees", json={"start_date": "2026-10-01"}).status_code == 400


def test_attendance_requires_login(anon):
    assert anon.get("/api/attendance").status_code == 401
    assert anon.get("/api/employees").status_code == 401
