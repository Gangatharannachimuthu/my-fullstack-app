"""Production entry point used by the desktop launcher.

Serves the API and the built React app (frontend/dist) on one port with waitress,
a production-grade server, and writes logs to backend/logs/server.log.

    venv\\Scripts\\pythonw.exe serve.py      (no console window)
"""

import logging
import os
from logging.handlers import RotatingFileHandler

from waitress import serve

from app import app
from config import Config

HERE = os.path.dirname(os.path.abspath(__file__))
LOG_DIR = os.path.join(HERE, "logs")
os.makedirs(LOG_DIR, exist_ok=True)

handler = RotatingFileHandler(os.path.join(LOG_DIR, "server.log"), maxBytes=1_000_000, backupCount=3,
                              encoding="utf-8")
handler.setFormatter(logging.Formatter("%(asctime)s %(levelname)s %(name)s: %(message)s"))
for name in ("waitress", app.logger.name):
    logger = logging.getLogger(name)
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)

if __name__ == "__main__":
    app.logger.info("Starting Sri Saravana Bricks on http://127.0.0.1:%s", Config.PORT)
    # Bound to this computer only; nothing on the network can reach it.
    serve(app, host="127.0.0.1", port=Config.PORT, threads=8)
