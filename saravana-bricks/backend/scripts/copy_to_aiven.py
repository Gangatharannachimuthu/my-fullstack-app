"""Copy the local saravana_bricks_db to an Aiven MySQL service (tables, views, all rows).

    set AIVEN_DATABASE_URL=mysql+pymysql://avnadmin:<password>@<host>:<port>/saravana_bricks_db?ssl_ca=ca.pem
    venv\\Scripts\\python.exe scripts\\copy_to_aiven.py

1. Creates the target database on the Aiven server if it doesn't exist.
2. Builds tables + reporting views with the app's own migrations.
3. Clears the starter rows the migrations insert (Member 1-4), so IDs don't clash.
4. Copies every row with the same IDs (login sessions are skipped - just sign in again).
5. Compares row counts and money totals table by table.

The source is whatever .env's DATABASE_URL points to (your local MySQL); it is only
read. Refuses to run if the target already holds real data (admin accounts).
The server certificate is always verified against ca.pem.
"""

import os
import subprocess
import sys

BACKEND = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, BACKEND)

from sqlalchemy import MetaData, create_engine, inspect, text  # noqa: E402
from sqlalchemy.engine.url import make_url  # noqa: E402

from config import Config  # noqa: E402

SKIP = {"alembic_version", "admin_sessions"}
# Parents before children so foreign keys are satisfied even with checks on.
ORDER = ["admin_users", "business_profile", "employees", "attendance_exceptions", "work_holidays",
         "material_purchases", "production_entries", "invoice_counters", "customer_orders"]
MONEY_CHECKS = {
    "customer_orders": "total_amount", "material_purchases": "total_amount",
    "production_entries": "labour_amount", "attendance_exceptions": "value",
}


def resolve_ca(url):
    u = make_url(url)
    ca = u.query.get("ssl_ca")
    if ca and not os.path.isabs(ca):
        u = u.update_query_dict({"ssl_ca": os.path.join(BACKEND, ca)})
    return u


def connect_args(u):
    ca = u.query.get("ssl_ca")
    if not ca or not os.path.exists(ca):
        sys.exit(f"CA certificate not found: {ca}. Download it from the Aiven service page.")
    # Only the ssl dict: PyMySQL rebuilds (and drops "ca" from) it if ssl_verify_* kwargs are also passed.
    # With a CA set, PyMySQL requires a valid certificate and checks the host name.
    return {"ssl": {"ca": ca, "check_hostname": True}}


def main():
    target_raw = os.environ.get("AIVEN_DATABASE_URL")
    if not target_raw:
        sys.exit("Set AIVEN_DATABASE_URL first (see the top of this script).")
    source_url = Config.SQLALCHEMY_DATABASE_URI
    if "aivencloud" in source_url:
        sys.exit(".env already points to Aiven - point it back to the local MySQL to copy from it.")

    target = resolve_ca(target_raw)
    db_name = target.database
    args = connect_args(target)
    print(f"Source : {make_url(source_url).render_as_string(hide_password=True)}")
    print(f"Target : {target.render_as_string(hide_password=True)}")

    # 1. Create the database on the Aiven server.
    server = create_engine(target.set(database="defaultdb"), connect_args=args)
    with server.connect() as c:
        c.execute(text(f"CREATE DATABASE IF NOT EXISTS `{db_name}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"))
    print(f"[1/5] database `{db_name}` ready")

    dst = create_engine(target, connect_args=args)
    with dst.connect() as c:
        tables = set(inspect(c).get_table_names())
        if "admin_users" in tables and c.execute(text("SELECT COUNT(*) FROM admin_users")).scalar():
            sys.exit("Target already has admin accounts - stopping so nothing is overwritten.")

    # 2. Tables + views via migrations (DATABASE_URL in this child process only).
    env = {**os.environ, "DATABASE_URL": target.render_as_string(hide_password=False), "FLASK_APP": "app.py"}
    flask = os.path.join(BACKEND, "venv", "Scripts", "flask.exe")
    run = subprocess.run([flask, "db", "upgrade"], cwd=BACKEND, env=env, capture_output=True, text=True)
    if run.returncode:
        sys.exit("flask db upgrade failed:\n" + run.stderr[-2000:])
    print("[2/5] tables and views created by migrations")

    src = create_engine(source_url)
    meta = MetaData()
    meta.reflect(bind=src, views=False)
    names = [t for t in ORDER if t in meta.tables] + sorted(set(meta.tables) - set(ORDER) - SKIP)

    with src.connect() as s, dst.begin() as d:
        # 3. Clear starter rows, children first.
        d.execute(text("SET FOREIGN_KEY_CHECKS = 0"))
        for name in reversed(names):
            d.execute(text(f"DELETE FROM `{name}`"))
        print("[3/5] starter rows cleared")

        # 4. Copy rows with their original IDs.
        for name in names:
            table = meta.tables[name]
            rows = [dict(r._mapping) for r in s.execute(table.select())]
            for i in range(0, len(rows), 500):
                d.execute(table.insert(), rows[i:i + 500])
            print(f"      copied {len(rows):5}  {name}")
        d.execute(text("SET FOREIGN_KEY_CHECKS = 1"))
    print("[4/5] rows copied")

    # 5. Verify.
    ok = True
    with src.connect() as s, dst.connect() as d:
        for name in names:
            n1 = s.execute(text(f"SELECT COUNT(*) FROM `{name}`")).scalar()
            n2 = d.execute(text(f"SELECT COUNT(*) FROM `{name}`")).scalar()
            extra = ""
            if name in MONEY_CHECKS:
                col = MONEY_CHECKS[name]
                m1 = s.execute(text(f"SELECT COALESCE(SUM(`{col}`),0) FROM `{name}`")).scalar()
                m2 = d.execute(text(f"SELECT COALESCE(SUM(`{col}`),0) FROM `{name}`")).scalar()
                extra = f"  sum({col}) {m1} vs {m2}"
                ok &= m1 == m2
            ok &= n1 == n2
            print(f"      {'OK  ' if n1 == n2 else 'DIFF'} {name:24} local {n1:5}  aiven {n2:5}{extra}")
        views = sorted(inspect(d).get_view_names())
        print(f"      views on Aiven: {', '.join(views)}")
        rev = d.execute(text("SELECT version_num FROM alembic_version")).scalar()
        print(f"      migration version on Aiven: {rev}")
    print("[5/5] " + ("ALL CHECKS PASSED" if ok else "MISMATCH - see above"))
    sys.exit(0 if ok else 1)


if __name__ == "__main__":
    main()
