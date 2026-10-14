# Sri Saravana Interlock Bricks Manufacturing — Billing App

Records raw-material purchases, daily brick production, and customer orders, and prints/downloads A4 invoices. One Admin user.

Lives alongside the Mandram app in this repo but shares nothing with it except the MySQL server: its own schema (`saravana_bricks_db`), its own backend (port **5002**) and its own frontend (port **3001**).

```
saravana-bricks/
├── backend/            Flask + SQLAlchemy + Alembic (Flask-Migrate), MySQL
│   ├── app.py          app factory, error handling, CLI: create-admin / reset-admin-password
│   ├── models.py       tables (DECIMAL money columns)
│   ├── routes/         auth, profile, purchases, production, orders, dashboard
│   ├── services/       calc.py (money rules), validation.py, auth.py (sessions), common.py (invoice numbers)
│   ├── migrations/     schema + reporting views
│   ├── scripts/mysql_smoke_test.py
│   └── tests/          pytest (SQLite in-memory)
└── frontend/           React 18 + Vite
    ├── public/login-wallpaper.svg
    └── src/            pages/, components/, utils/ (format + money preview, with vitest tests)
```

## Database

Schema `saravana_bricks_db` (utf8mb4).

| Table | Purpose |
|---|---|
| `admin_users` | The single Admin (password stored as a salted hash) |
| `admin_sessions` | Server-side login sessions (only a SHA-256 of the cookie token is stored) |
| `business_profile` | Name, address, optional phone/email/GSTIN/logo, invoice terms, payment-tracking switch |
| `material_purchases` | Raw-material purchases; voided rather than deleted |
| `production_entries` | Daily production; several entries per date are summed |
| `customer_orders` | Orders with server-calculated totals and unique invoice numbers |
| `invoice_counters` | Last invoice number per year (only ever increases) |
| `employees` | Team members (start date, active flag) |
| `attendance_exceptions` | Half days (0.5) and leave (0) only; no row means a full day |
| `work_holidays` | Days nobody works; not counted for anyone |

Reporting views (MySQL only; voided purchases and cancelled orders are already excluded):
`v_daily_production`, `v_monthly_production`, `v_monthly_purchases`, `v_monthly_orders`, `v_invoice_details`.

## First-time setup

Prerequisites: Python 3.12, Node 20+, MySQL 8.

```powershell
# 1. Backend
cd saravana-bricks\backend
python -m venv venv
venv\Scripts\python.exe -m pip install -r requirements.txt
copy .env.example .env          # then edit DATABASE_URL (URL-encode @ in passwords as %40)

# 2. Create the schema (once)
mysql -u root -p -e "CREATE DATABASE saravana_bricks_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci"

# 3. Tables + views
$env:FLASK_APP = "app.py"
venv\Scripts\flask.exe db upgrade

# 4. Create the Admin (prompts for a password, min 8 characters, typed twice)
venv\Scripts\flask.exe create-admin --login-id <phone-or-email>

# 5. Frontend
cd ..\frontend
npm install
```

There is no default password and no public sign-up. If the password is lost:

```powershell
cd saravana-bricks\backend; $env:FLASK_APP = "app.py"
venv\Scripts\flask.exe reset-admin-password      # also signs out every session
```

## Run locally (development)

Two terminals:

```powershell
# Terminal 1 – API on http://127.0.0.1:5002
cd saravana-bricks\backend; venv\Scripts\python.exe app.py

# Terminal 2 – UI on http://localhost:3001 (proxies /api to 5002)
cd saravana-bricks\frontend; npm run dev
```

Open http://localhost:3001.

## Production / single-port mode

`npm run build` writes `frontend/dist`. When that folder exists, Flask serves the app itself, so only port 5002 is needed: open http://127.0.0.1:5002. For a real deployment:

- Run Flask behind a production WSGI server (e.g. `waitress-serve --port=5002 app:app` on Windows) and a reverse proxy with **HTTPS**.
- Set `SESSION_COOKIE_SECURE=True` and `DEBUG=False` in `.env`.
- Never commit `.env`.

## Tests

```powershell
cd saravana-bricks\backend;  venv\Scripts\python.exe -m pytest -q          # 31 tests: money, tax, validation, production totals, invoice numbering, auth
venv\Scripts\python.exe scripts\mysql_smoke_test.py                          # real MySQL, throwaway schema, parallel invoice numbering
cd ..\frontend;  npm test                                                     # 10 tests: preview maths, ₹ / DD-MM-YYYY formatting, IST date
```

## Business rules implemented

- **Money** is `DECIMAL(12,2)` in MySQL and Python `Decimal` on the server, rounded half-up to paise. The browser shows a live preview using integer paise, but the totals that get saved are always recalculated on the server. Totals sent by the browser are ignored.
- **Order total** = quantity × rate − discount + GST + additional charges. The rate is typed for every order and nothing is hard-coded.
- **GST** is optional and its rate is never assumed. *CGST + SGST* (within Tamil Nadu) splits the rate in half; *IGST* (other state) applies the whole rate. All three are never charged on the same amount. Purchases can also take tax amounts typed straight from the supplier bill.
- **Invoice numbers** look like `SSB-2026-0001`. They are issued by the server inside a locked transaction, one sequence per year of the order date. Numbers are never reused, including for cancelled orders. Each order form sends an `Idempotency-Key`, so a double-click creates only one order.
- **Cancel / void**: orders are cancelled and purchases are voided rather than deleted. Both stay on record and are excluded from totals. Production entries can be deleted after a confirmation.
- **Team amount (labour)**: each production entry stores bricks × team rate per brick. The rate defaults to ₹1.00 from Admin Profile and can be changed for a single entry. Changing the profile rate affects only new entries; past entries keep the rate they were saved with.
- **Employees / attendance** is recorded by exception. Every active member counts as 1 (full day) on every working day unless marked ½ (half day) or 0 (leave), so only those days are stored (`attendance_exceptions`). Days marked as holidays (`work_holidays`) and future dates are not counted. Each member is counted from their "Counted from" date while active.
- **Dates** are calendar dates in Asia/Kolkata and are shown as DD-MM-YYYY. "Today" and the current month are worked out in IST.
- **Not shown on purpose**: profit (cost data is incomplete) and available stock (sales deliveries, wastage and opening stock aren't tracked). "Order value" is the billed amount, not money collected.

## Login wallpaper

The login page uses the owner's factory photo, `frontend/public/login-factory.jpg`. It was converted from `saravana-bricks/20261013190855126176.png`, which drops it from 3.9 MB to 345 KB. The photo covers the whole screen and the login card sits on the left over a soft dark gradient. To use a different image, put it in `frontend/public/` and change `--login-wallpaper` at the top of `frontend/src/styles.css`. Wide landscape photos work best.

Earlier alternatives are still in the folder: `login-bg.jpg` (the square logo) and `login-wallpaper.svg` (an illustration).

## Logo

`frontend/public/logo.jpg` is cropped from the owner-supplied image `saravana-bricks/20261013183828976226.jpg`. It is used as the app icon and brand mark. The invoice logo is stored separately in the business profile and can be changed or removed from Admin Profile.

## 2025 sample data

ackend/scripts/seed_2025_sample.py loads a full year of **2025 test data** into every tab: holidays, 5 TEST employees with attendance, about 320 production entries, 120 purchases and 152 orders. It goes through the real API, then cross-checks the API's totals against plain SQL. Sample rows are marked `[TEST 2025]` in their notes or start with `TEST ` in their names. 2026 data is never touched.

```powershell
cd saravana-bricks\backend
venv\Scripts\python.exe scripts\seed_2025_sample.py            # load + verify (refuses if 2025 data exists)
venv\Scripts\python.exe scripts\seed_2025_sample.py --verify   # re-run the checks only
venv\Scripts\python.exe scripts\seed_2025_sample.py --remove   # delete ALL 2025 data + TEST employees
```

## Backups

```powershell
mysqldump -u root -p --routines --single-transaction saravana_bricks_db > ssb-backup-YYYY-MM-DD.sql
# restore
mysql -u root -p saravana_bricks_db < ssb-backup-YYYY-MM-DD.sql
```

Each list page can also export a CSV.

## Owner decisions still open

- Exact address spelling and postal code (the default is "Rattaivaikkal, Salangapalayam, Kavindapadi, Erode, Tamil Nadu, India", editable in Admin Profile)
- Business phone, email and GSTIN. These are blank until entered and printed only when set.
- Tax treatment and invoice wording, to be confirmed with the accountant
- Whether to keep payment tracking. It is on by default and can be switched off in Admin Profile.
- Whether different brick types need different rates, and whether to track inventory, wastage and deliveries later
- Hosting and backup schedule
