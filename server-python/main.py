"""
Tarakki API — Flask Server
Converted from: server/index.js (Node.js / Express)

Run with:
    cd server-python
    pip install -r requirements.txt
    python main.py
"""

import os
from dotenv import load_dotenv

# Load environment variables BEFORE importing anything that uses them
load_dotenv()

from flask import Flask, jsonify
from flask_cors import CORS

# Import route blueprints
from routes.applications import applications_bp
from routes.projects import projects_bp
from routes.profiles import profiles_bp
from routes.notifications import notifications_bp
from routes.resume_parser import resume_parser_bp
from routes.ai_match import ai_match_bp
from routes.subscriptions import subscriptions_bp
from routes.bids import bids_bp

# ---------- App Setup ----------

app = Flask(__name__)

# CORS — allow all origins (same as the Express cors() default)
# CORS is initialized after blueprints for better compatibility


# ---------- Health Check ----------

@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({"status": "ok", "message": "Tarakki API is running"})


# ---------- Register Blueprints ----------

app.register_blueprint(applications_bp)
app.register_blueprint(projects_bp)
app.register_blueprint(profiles_bp)
app.register_blueprint(notifications_bp)
app.register_blueprint(resume_parser_bp)
app.register_blueprint(ai_match_bp)
app.register_blueprint(subscriptions_bp)
app.register_blueprint(bids_bp)


# ---------- CORS Initialization ----------

# We initialize CORS after all blueprints are registered to ensure 
# it applies to all routes correctly.
CORS(app)


# ---------- Error Handlers ----------

@app.errorhandler(401)
@app.errorhandler(404)
@app.errorhandler(405)
@app.errorhandler(500)
def handle_http_error(e):
    """Return JSON instead of HTML for standard HTTP errors."""
    return jsonify({
        "error": e.name,
        "message": e.description if hasattr(e, 'description') else str(e)
    }), e.code


@app.errorhandler(Exception)
def handle_exception(e):
    """Catch-all for any other unhandled errors."""
    # Print the error for debugging purposes
    print(f"Unhandled Exception: {e}")
    
    return jsonify({
        "error": "Internal Server Error",
        "message": str(e)
    }), 500


# ---------- Entry Point ----------

if __name__ == "__main__":
    port = int(os.getenv("PORT", 3001))
    print(f"🚀 Tarakki Flask server starting on port {port}")
    app.run(host="0.0.0.0", port=port, debug=True)
