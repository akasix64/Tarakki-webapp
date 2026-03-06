"""
Profiles API routes — Flask version.
Converted from: server/routes/profiles.js
"""

from flask import Blueprint, request, jsonify
import supabase_client as db
from auth import require_token, get_token

profiles_bp = Blueprint("profiles", __name__)


# ---------- GET all profiles ----------

@profiles_bp.route("/api/profiles", methods=["GET"])
def get_all_profiles():
    """Fetch all profiles (typically for Admin Dashboard users tab)."""
    require_token()

    try:
        data = db.select(
            "profiles",
            columns="*",
            order="created_at.desc",
        )
        return jsonify(data)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---------- GET single profile by ID ----------

@profiles_bp.route("/api/profiles/<profile_id>", methods=["GET"])
def get_profile(profile_id):
    """Fetch a single profile by ID."""
    try:
        data = db.select(
            "profiles",
            columns="*",
            filters={"id": profile_id},
            single=True,
        )

        if not data:
            return jsonify({"error": "Profile not found"}), 404

        return jsonify(data)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---------- PUT update profile ----------

@profiles_bp.route("/api/profiles/<profile_id>", methods=["PUT"])
def update_profile(profile_id):
    """Update (or upsert) a profile by ID."""
    token = require_token()
    updates = request.get_json()
    updates["id"] = profile_id

    try:
        data = db.upsert(
            "profiles",
            updates,
            columns="*",
            token=token,
        )

        if not data:
            return jsonify({"error": "Failed to update profile"}), 500

        return jsonify(data)

    except Exception as e:
        return jsonify({"error": str(e)}), 500
