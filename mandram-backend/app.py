from flask import Flask, jsonify
from flask_cors import CORS

from config import Config
from extensions import db
from seed import seed_categories
from services.guards import MeetingFinalizedError


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    db.init_app(app)
    CORS(app)

    from routes.expenditures import expenditures_bp
    from routes.investments import investments_bp
    from routes.loans import loans_bp
    from routes.meetings import meetings_bp
    from routes.members import members_bp
    from routes.penalties import penalties_bp
    from routes.personal_loans import personal_loans_bp
    from routes.reports import reports_bp

    app.register_blueprint(members_bp)
    app.register_blueprint(meetings_bp)
    app.register_blueprint(loans_bp)
    app.register_blueprint(personal_loans_bp)
    app.register_blueprint(penalties_bp)
    app.register_blueprint(expenditures_bp)
    app.register_blueprint(investments_bp)
    app.register_blueprint(reports_bp)

    @app.get("/")
    def index():
        return jsonify({"message": "Masiriyamman Mandram Ledger API", "status": "running"})

    @app.get("/health")
    def health():
        return jsonify({"status": "healthy"})

    @app.errorhandler(MeetingFinalizedError)
    def handle_finalized(err):
        return jsonify({"error": str(err)}), 409

    with app.app_context():
        db.create_all()
        seed_categories()

    return app


app = create_app()

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=Config.PORT, debug=Config.DEBUG)
