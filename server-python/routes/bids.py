"""
Bids API routes — Flask version.
Handles Startup project bids.
"""

import os
from flask import Blueprint, request, jsonify
import supabase_client as db
from auth import get_token, require_token

bids_bp = Blueprint("bids", __name__)


# ---------- GET all bids ----------

@bids_bp.route("/api/bids", methods=["GET"])
def get_bids():
    """Fetch all bids with joined profile and project data."""
    token = require_token()

    try:
        # 1. Decode token to find current user ID
        import jwt
        decoded = jwt.decode(token, options={"verify_signature": False}, algorithms=["HS256"])
        user_id = decoded.get("sub")

        # 2. Check current user's role (Case-insensitive)
        user_role = ""
        if user_id:
            prof = db.select("profiles", columns="role", filters={"id": user_id}, single=True, token=token)
            if prof:
                user_role = str(prof.get("role", "")).lower()

        # 3. Determine if admin or startup
        is_admin = user_role == "admin"
        
        # 4. Fetch Bids
        # If admin, fetch ALL bids (use service key if available or just token if RLS allows)
        # Note: If RLS is ON, admin needs a special policy or we use service key logic.
        # We will attempt to use SERVICE_KEY for Admin to guarantee they see EVERYTHING.
        
        has_service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") is not None
        
        # 4. Fetch Bids IN ONE SINGLE SHOT (Massively faster)
        bids = db.select(
            "bids",
            columns="*,profiles:user_id(full_name,email,role),projects(title)",
            order="created_at.desc",
            token=None if (is_admin and has_service_key) else token,
            use_service_key=(is_admin and has_service_key)
        )

        return jsonify(bids)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---------- POST new bid ----------

@bids_bp.route("/api/bids", methods=["POST"])
def create_bid():
    """Create a new bid and notify admins."""
    token = get_token()
    body = request.get_json()

    try:
        project_id = body.get("project_id")
        
        # Check if project_id is a valid UUID
        import uuid
        is_mock_project = False
        try:
            if project_id:
                uuid.UUID(str(project_id))
        except ValueError:
            is_mock_project = True

        if is_mock_project:
            # For mock projects, bypass DB to avoid constraint/type errors
            print(f"Bypassing DB insert for mock project ID: {project_id}")
            return jsonify({
                "id": "mock-bid-id",
                "user_id": body.get("user_id"),
                "project_id": project_id,
                "status": "pending",
                "created_at": "2026-03-10T00:00:00Z",
                "message": "Demo mode: Bid accepted for mock project."
            }), 201

        insert_data = {
            "user_id": body.get("user_id"),
            "project_id": project_id,
            "bid_amount": body.get("bid_amount"),
            "delivery_time": body.get("delivery_time"),
            "proposal": body.get("proposal"),
            "status": body.get("status", "pending"),
        }

        results = db.insert(
            "bids",
            insert_data,
            columns="*",
            token=token,
        )

        if not results:
            return jsonify({"error": "Failed to create bid"}), 500

        data = results[0]

        # Manually fetch info for notification
        startup_name = "A startup"
        proj_title = "a project"

        # Fetch profile
        try:
            if data.get("user_id"):
                prof = db.select("profiles", columns="full_name", filters={"id": data["user_id"]}, single=True, token=token)
                if prof:
                    startup_name = prof.get("full_name", "A startup")
                    data["profiles"] = prof
        except Exception as e:
            print(f"Non-critical: Profile lookup failed: {e}")

        # Fetch project (might fail for mock IDs)
        try:
            if data.get("project_id"):
                proj = db.select("projects", columns="title", filters={"id": data["project_id"]}, single=True)
                if proj:
                    proj_title = proj.get("title", "a project")
                    data["projects"] = proj
        except Exception as e:
            print(f"Non-critical: Project lookup failed (likely mock ID): {e}")

        # Notify admins
        try:
            # Fetch all profiles and filter for admins in Python to be case-insensitive
            all_profs = db.select("profiles", columns="id,role", use_service_key=True)
            admins = [p for p in all_profs if str(p.get("role", "")).lower() == "admin"]
            
            if admins:
                notifications_payload = [
                    {
                        "user_id": admin["id"],
                        "title": "New Startup Bid Received",
                        "message": f'{startup_name} has placed a bid for "{proj_title}".',
                        "type": "application",
                        "is_read": False,
                    }
                    for admin in admins
                ]
                # Use service key to insert notifications to ensure they are created
                db.insert("notifications", notifications_payload, use_service_key=True)
        except Exception as notif_err:
            print(f"Failed to insert admin notifications: {notif_err}")

        return jsonify(data), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---------- PUT update bid status ----------

@bids_bp.route("/api/bids/<bid_id>/status", methods=["PUT"])
def update_bid_status(bid_id):
    """Update a bid's status and notify the startup."""
    token = get_token()
    body = request.get_json()
    status = body.get("status")

    # Role detection logic
    import jwt
    decoded = jwt.decode(token, options={"verify_signature": False}, algorithms=["HS256"])
    user_id = decoded.get("sub")
    
    user_role = ""
    if user_id:
        prof = db.select("profiles", columns="role", filters={"id": user_id}, single=True, token=token)
        if prof:
            user_role = str(prof.get("role", "")).lower()
    
    is_admin = (user_role == "admin")
    has_service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") is not None

    try:
        results = db.update(
            "bids",
            updates={"status": status},
            filters={"id": bid_id},
            columns="*",
            token=None if (is_admin and has_service_key) else token,
            use_service_key=(is_admin and has_service_key)
        )

        if not results:
            return jsonify({"error": "Bid not found"}), 404

        data = results[0]

        # Manually fetch project title for notification
        project_title = "a project"
        try:
            if data.get("project_id"):
                proj = db.select(
                    "projects",
                    columns="title",
                    filters={"id": data["project_id"]},
                    single=True,
                )
                if proj:
                    project_title = proj.get("title", "a project")
                    data["projects"] = proj
        except Exception as e:
            print(f"Non-critical: Project title lookup failed: {e}")

        if status in ("accepted", "approved", "rejected", "shortlisted"):
            notif_title = "📊 Bid Update"
            if status in ("accepted", "approved"):
                notif_title = "🏆 Bid Accepted!"
                notif_msg = f'Congratulations! Your bid for "{project_title}" has been accepted.'
            elif status == "rejected":
                notif_title = "❌ Bid Update"
                notif_msg = f'Your bid for "{project_title}" was not selected.'
            elif status == "shortlisted":
                notif_title = "📋 Bid Shortlisted"
                notif_msg = f'Your bid for "{project_title}" is in the final list!'
            else:
                notif_msg = f'The status of your bid for "{project_title}" has changed to {status}.'

            db.insert("notifications", {
                "user_id": data["user_id"],
                "title": notif_title,
                "message": notif_msg,
                "type": "application",
                "is_read": False,
            }, use_service_key=True)

        return jsonify(data)

    except Exception as e:
        return jsonify({"error": str(e)}), 500
