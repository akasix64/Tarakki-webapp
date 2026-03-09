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
    """Update a profile by ID."""
    token = require_token()
    updates = request.get_json()

    try:
        # Use update (PATCH) instead of upsert for safer partial updates
        data = db.update(
            "profiles",
            updates,
            filters={"id": profile_id},
            columns="*",
            token=token,
        )

        if not data:
            # If update didn't find the record, try upserting as fallback
            # (though normally profile exists if they are logged in)
            updates["id"] = profile_id
            data = db.upsert(
                "profiles",
                updates,
                columns="*",
                token=token,
            )

        if not data:
            return jsonify({"error": "Failed to update profile"}), 500

        # db.update returns a list, return the first item
        return jsonify(data[0] if isinstance(data, list) else data)

    except Exception as e:
        return jsonify({"error": str(e)}), 500
