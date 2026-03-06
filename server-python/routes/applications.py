"""
Applications API routes — Flask version.
Converted from: server/routes/applications.js
"""

from flask import Blueprint, request, jsonify
import supabase_client as db
from auth import get_token, require_token

applications_bp = Blueprint("applications", __name__)


# ---------- GET all applications ----------

@applications_bp.route("/api/applications", methods=["GET"])
def get_applications():
    """Fetch all applications with joined profile and project data."""
    token = require_token()

    try:
        apps = db.select(
            "applications",
            columns="*",
            order="created_at.desc",
            token=token,
        )

        # Manually join profiles and projects (mirrors Node.js logic)
        for app in apps:
            if app.get("user_id"):
                prof = db.select(
                    "profiles",
                    columns="full_name,email,role",
                    filters={"id": app["user_id"]},
                    single=True,
                )
                if prof:
                    app["profiles"] = prof

            if app.get("project_id"):
                proj = db.select(
                    "projects",
                    columns="title",
                    filters={"id": app["project_id"]},
                    single=True,
                )
                if proj:
                    app["projects"] = proj

        return jsonify(apps)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---------- PUT update application status ----------

@applications_bp.route("/api/applications/<app_id>/status", methods=["PUT"])
def update_application_status(app_id):
    """Update an application's status and send a notification."""
    token = get_token()
    body = request.get_json()
    status = body.get("status")

    try:
        results = db.update(
            "applications",
            updates={"status": status},
            filters={"id": app_id},
            columns="*",
            token=token,
        )

        if not results:
            return jsonify({"error": "Application not found"}), 404

        data = results[0]

        # Manually fetch project title for the notification
        project_title = "a project"
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

        # Notification side effect
        if status in ("approved", "rejected"):
            try:
                if status == "approved":
                    notif_title = "🎉 Application Approved!"
                    notif_msg = f'Your application for "{project_title}" has been approved by the admin.'
                else:
                    notif_title = "❌ Application Rejected"
                    notif_msg = f'Unfortunately, your application for "{project_title}" has been rejected.'

                db.insert("notifications", {
                    "user_id": data["user_id"],
                    "title": notif_title,
                    "message": notif_msg,
                    "type": status,
                    "is_read": False,
                })
            except Exception as notif_err:
                print(f"Failed to create application status notification: {notif_err}")

        return jsonify(data)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---------- POST new application ----------

@applications_bp.route("/api/applications", methods=["POST"])
def create_application():
    """Create a new application and notify admins."""
    token = get_token()
    body = request.get_json()

    try:
        insert_data = {
            "user_id": body.get("user_id"),
            "project_id": body.get("project_id"),
            "cover_letter": body.get("cover_letter"),
            "expected_rate": body.get("expected_rate"),
            "availability": body.get("availability"),
            "status": body.get("status", "pending"),
        }

        results = db.insert(
            "applications",
            insert_data,
            columns="*",
            token=token,
        )

        if not results:
            return jsonify({"error": "Failed to create application"}), 500

        data = results[0]

        # Manually fetch profile and project info for the response & notification
        applicant_name = "A user"
        proj_title = "a project"

        if data.get("user_id"):
            prof = db.select("profiles", columns="full_name", filters={"id": data["user_id"]}, single=True)
            if prof:
                applicant_name = prof.get("full_name", "A user")
                data["profiles"] = prof

        if data.get("project_id"):
            proj = db.select("projects", columns="title", filters={"id": data["project_id"]}, single=True)
            if proj:
                proj_title = proj.get("title", "a project")
                data["projects"] = proj

        # Notification side effect: Notify admins
        try:
            admins = db.select("profiles", columns="id", filters={"role": "admin"})

            if admins:
                notifications_payload = [
                    {
                        "user_id": admin["id"],
                        "title": "New Application Received",
                        "message": f'{applicant_name} has applied for "{proj_title}".',
                        "type": "application",
                        "is_read": False,
                    }
                    for admin in admins
                ]
                db.insert("notifications", notifications_payload)
        except Exception as notif_err:
            print(f"Failed to insert admin notifications: {notif_err}")

        return jsonify(data), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500
