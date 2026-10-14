import logging
import os

import click
from flask import Flask, jsonify, request, send_from_directory
from werkzeug.exceptions import HTTPException
from werkzeug.security import generate_password_hash

from config import Config
from extensions import db, migrate
from services.validation import ValidationError

FRONTEND_DIST = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")


def create_app(config_class=Config):
    app = Flask(__name__, static_folder=None)
    app.config.from_object(config_class)

    db.init_app(app)
    migrate.init_app(app, db)

    from routes.auth import auth_bp
    from routes.dashboard import dashboard_bp
    from routes.employees import employees_bp
    from routes.orders import orders_bp
    from routes.production import production_bp
    from routes.profile import profile_bp
    from routes.purchases import purchases_bp

    for bp in (auth_bp, profile_bp, purchases_bp, production_bp, orders_bp, dashboard_bp, employees_bp):
        app.register_blueprint(bp)

    @app.get("/api/health")
    def health():
        return jsonify({"status": "healthy"})

    @app.errorhandler(ValidationError)
    def handle_validation(err):
        db.session.rollback()
        return jsonify({"error": err.message, "fields": err.fields}), 400

    @app.errorhandler(HTTPException)
    def handle_http(err):
        messages = {404: "Not found.", 405: "Method not allowed."}
        return jsonify({"error": messages.get(err.code, err.description)}), err.code

    @app.errorhandler(Exception)
    def handle_unexpected(err):
        # Log the failure type and path only - request bodies hold customer details.
        db.session.rollback()
        app.logger.error("Unhandled %s on %s %s", type(err).__name__, request.method, request.path,
                         exc_info=app.debug)
        return jsonify({"error": "Something went wrong on the server. Please try again."}), 500

    @app.after_request
    def security_headers(response):
        response.headers.setdefault("X-Content-Type-Options", "nosniff")
        response.headers.setdefault("X-Frame-Options", "DENY")
        response.headers.setdefault("Referrer-Policy", "same-origin")
        if request.path.startswith("/api/"):
            response.headers["Cache-Control"] = "no-store"
        return response

    # In production the built React app is served from here, so the browser talks
    # to a single origin and the session cookie needs no CORS.
    @app.get("/", defaults={"path": ""})
    @app.get("/<path:path>")
    def frontend(path):
        if path.startswith("api/"):
            return jsonify({"error": "Not found."}), 404
        dist = os.path.abspath(FRONTEND_DIST)
        if not os.path.isdir(dist):
            return jsonify({"message": "Sri Saravana Bricks API", "status": "running"})
        if path and os.path.isfile(os.path.join(dist, path)):
            return send_from_directory(dist, path)
        return send_from_directory(dist, "index.html")

    register_cli(app)
    return app


def register_cli(app):
    from models import AdminUser

    @app.cli.command("create-admin")
    @click.option("--login-id", prompt="Login ID (phone or email)", help="Identifier used to log in.")
    @click.option("--display-name", default="Admin", show_default=True)
    @click.option("--phone", default=None)
    @click.password_option(envvar="SSB_ADMIN_PASSWORD", help="Prompted if not given; or set SSB_ADMIN_PASSWORD.")
    def create_admin(login_id, display_name, phone, password):
        """Create the single Admin account (refuses if one already exists)."""
        if AdminUser.query.first():
            raise click.ClickException("An Admin already exists. Use reset-admin-password instead.")
        if len(password) < 8:
            raise click.ClickException("Password must be at least 8 characters.")
        db.session.add(AdminUser(
            display_name=display_name, login_identifier=login_id.strip(), phone=phone,
            password_hash=generate_password_hash(password),
        ))
        db.session.commit()
        click.echo(f"Admin '{login_id}' created.")

    @app.cli.command("reset-admin-password")
    @click.password_option(envvar="SSB_ADMIN_PASSWORD", help="Prompted if not given; or set SSB_ADMIN_PASSWORD.")
    def reset_admin_password(password):
        """Set a new Admin password and sign out every session."""
        from models import AdminSession

        admin = AdminUser.query.first()
        if not admin:
            raise click.ClickException("No Admin exists yet. Run create-admin first.")
        if len(password) < 8:
            raise click.ClickException("Password must be at least 8 characters.")
        admin.password_hash = generate_password_hash(password)
        AdminSession.query.delete()
        db.session.commit()
        click.echo(f"Password reset for '{admin.login_identifier}'. All sessions signed out.")


app = create_app()

if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    app.run(host="127.0.0.1", port=Config.PORT, debug=Config.DEBUG)
