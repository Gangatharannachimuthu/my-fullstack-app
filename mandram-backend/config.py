import os
from dotenv import load_dotenv

load_dotenv()


class Config:
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URL", "mysql+pymysql://root:@localhost:3306/mandram_db"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    PORT = int(os.getenv("PORT", 5001))
    DEBUG = os.getenv("DEBUG", "True") == "True"

    # Used once, to create the first admin on an empty database. Every other
    # account is created by that admin from the Users tab.
    BOOTSTRAP_ADMIN_USERNAME = os.getenv("BOOTSTRAP_ADMIN_USERNAME", "admin")
    BOOTSTRAP_ADMIN_PASSWORD = os.getenv("BOOTSTRAP_ADMIN_PASSWORD", "Mandram@2026")
