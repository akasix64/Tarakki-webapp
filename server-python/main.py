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


# ---------- App Setup ----------

app = Flask(__name__)

# CORS — allow all origins (same as the Express cors() default)
CORS(app)


# ---------- Health Check ----------

@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({"status": "ok", "message": "Tarakki API is running"})


# ---------- Register Blueprints ----------

app.register_blueprint(applications_bp)
app.register_blueprint(projects_bp)
app.register_blueprint(profiles_bp)
app.register_blueprint(notifications_bp)


# ---------- Error Handlers ----------

@app.errorhandler(401)
def unauthorized(e):
    return jsonify({"error": str(e.description)}), 401


@app.errorhandler(404)
def not_found(e):
    return jsonify({"error": str(e.description)}), 404


# ---------- Entry Point ----------

if __name__ == "__main__":
    port = int(os.getenv("PORT", 3001))
    print(f"🚀 Tarakki Flask server starting on port {port}")
    app.run(host="0.0.0.0", port=port, debug=True)
