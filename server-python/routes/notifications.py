"""
Notifications API routes — Flask version.
Converted from: server/routes/notifications.js
"""

from flask import Blueprint, request, jsonify
import supabase_client as db
from auth import require_token

notifications_bp = Blueprint("notifications", __name__)


def _get_current_user_id(token):
    """Verify the JWT and return the authenticated user's ID."""
    user = db.get_user(token)
    if not user or not user.get("id"):
        from flask import abort
        abort(401, description="Invalid Token")
    return user["id"]


# ---------- GET all notifications for current user ----------

@notifications_bp.route("/api/notifications", methods=["GET"])
def get_notifications():
    """Fetch all notifications for the authenticated user."""
    token = require_token()
    user_id = _get_current_user_id(token)

    try:
        data = db.select(
            "notifications",
            columns="*",
            filters={"user_id": user_id},
            order="created_at.desc",
            token=token,
        )
        return jsonify(data)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---------- PUT mark all notifications as read ----------

@notifications_bp.route("/api/notifications/read-all", methods=["PUT"])
def mark_all_read():
    """Mark all unread notifications as read for the authenticated user."""
    token = require_token()
    user_id = _get_current_user_id(token)

    try:
        db.update(
            "notifications",
            updates={"is_read": True},
            filters={"user_id": user_id, "is_read": False},
            columns="*",
            token=token,
        )
        return jsonify({"success": True, "message": "Marked all as read"})

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---------- DELETE clear all notifications ----------

@notifications_bp.route("/api/notifications/clear-all", methods=["DELETE"])
def clear_all_notifications():
    """Delete all notifications for the authenticated user."""
    token = require_token()
    user_id = _get_current_user_id(token)

    try:
        db.delete(
            "notifications",
            filters={"user_id": user_id},
            token=token,
        )
        return jsonify({"success": True, "message": "Cleared all notifications"})

    except Exception as e:
        return jsonify({"error": str(e)}), 500
