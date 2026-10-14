import os

from dotenv import load_dotenv

load_dotenv()

BACKEND_DIR = os.path.dirname(os.path.abspath(__file__))


def _database_url():
    """DATABASE_URL, with a relative ?ssl_ca= (e.g. ca.pem for Aiven) resolved
    against this folder, so it works whatever directory the app is started from."""
    url = os.getenv("DATABASE_URL", "mysql+pymysql://root:@localhost:3306/saravana_bricks_db")
    if "ssl_ca=" not in url:
        return url
    from sqlalchemy.engine.url import make_url

    parsed = make_url(url)
    ca = parsed.query.get("ssl_ca")
    if ca and not os.path.isabs(ca):
        parsed = parsed.update_query_dict({"ssl_ca": os.path.join(BACKEND_DIR, ca)})
    return parsed.render_as_string(hide_password=False)


class Config:
    SQLALCHEMY_DATABASE_URI = _database_url()
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {"pool_pre_ping": True}
    PORT = int(os.getenv("PORT", 5002))
    DEBUG = os.getenv("DEBUG", "False") == "True"

    # The session cookie is HttpOnly always; mark it Secure once served over HTTPS.
    SESSION_COOKIE_NAME = "ssb_session"
    SESSION_COOKIE_SECURE = os.getenv("SESSION_COOKIE_SECURE", "False") == "True"
    SESSION_DAYS = int(os.getenv("SESSION_DAYS", 7))

    BUSINESS_TIMEZONE = "Asia/Kolkata"
    INVOICE_PREFIX = os.getenv("INVOICE_PREFIX", "SSB")

    # Defaults for the business profile row, editable later from Admin Profile.
    # Phone, GSTIN, email and logo are deliberately left empty - never invented.
    DEFAULT_BUSINESS_NAME = "Sri Saravana Interlock Bricks Manufacturing"
    DEFAULT_BUSINESS_ADDRESS = (
        "Rattaivaikkal, Salangapalayam, Kavindapadi, Erode, Tamil Nadu, India"
    )

    # Logos are stored in the database as data URLs; keep them small.
    MAX_LOGO_BYTES = 300 * 1024


class TestConfig(Config):
    TESTING = True
    SQLALCHEMY_DATABASE_URI = "sqlite://"
    SQLALCHEMY_ENGINE_OPTIONS = {}
