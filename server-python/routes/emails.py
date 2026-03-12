"""
Email API routes — Flask version.
Handles sending project notification emails to contractors & startups.
"""

from flask import Blueprint, request, jsonify
import supabase_client as db
from auth import require_token
from email_service import send_project_email

emails_bp = Blueprint("emails", __name__)


def _get_current_user_id(token):
    """Verify the JWT and return the authenticated user's ID."""
    user = db.get_user(token)
    if not user or not user.get("id"):
        from flask import abort
        abort(401, description="Invalid Token")
    return user["id"]


# ---------- POST send project email blast ----------

@emails_bp.route("/api/emails/send-project", methods=["POST"])
def send_project_notification():
    """
    Send a project notification email to all contractors and startups.

    Request body:
        project_id (str): ID of the project to send notifications for
        roles (list, optional): Roles to notify. Default: ['contractor', 'startup']
    """
    token = require_token()
    body = request.get_json()

    project_id = body.get("project_id")
    target_roles = body.get("roles", ["contractor", "startup"])

    if not project_id:
        return jsonify({"error": "project_id is required"}), 400

    try:
        # 1. Fetch the project details
        project = db.select(
            "projects",
            columns="*",
            filters={"id": project_id},
            single=True,
            use_service_key=True,
        )

        if not project:
            return jsonify({"error": "Project not found"}), 404

        # 2. Fetch all profiles with the target roles
        #    Since the supabase_client only supports eq filters,
        #    we fetch all profiles and filter in Python.
        all_profiles = db.select(
            "profiles",
            columns="id,email,full_name,role",
            use_service_key=True,
        )

        # Filter to only target roles and only those with an email
        recipients = [
            {"email": p["email"], "full_name": p.get("full_name", "")}
            for p in all_profiles
            if p.get("role") in target_roles and p.get("email")
        ]

        if not recipients:
            return jsonify({
                "error": "No recipients found",
                "message": f"No users with roles {target_roles} have registered emails.",
                "sent": 0,
                "failed": 0,
            }), 200

        print(f"📧 Sending project email for '{project.get('title')}' to {len(recipients)} recipients...")

        # 3. Send the emails
        result = send_project_email(project, recipients)

        print(f"📧 Email blast complete: {result['sent']} sent, {result['failed']} failed")

        return jsonify({
            "success": True,
            "message": f"Email sent to {result['sent']} recipients",
            "total_recipients": len(recipients),
            **result,
        })

    except Exception as e:
        print(f"❌ Email blast error: {e}")
        return jsonify({"error": str(e)}), 500


# ---------- POST send project email to specific users ----------

@emails_bp.route("/api/emails/send-project-custom", methods=["POST"])
def send_project_custom():
    """
    Send a project notification to specific email addresses.

    Request body:
        project_id (str): ID of the project
        emails (list): List of email addresses to send to
    """
    token = require_token()
    body = request.get_json()

    project_id = body.get("project_id")
    email_list = body.get("emails", [])

    if not project_id:
        return jsonify({"error": "project_id is required"}), 400
    if not email_list:
        return jsonify({"error": "emails list is required"}), 400

    try:
        project = db.select(
            "projects",
            columns="*",
            filters={"id": project_id},
            single=True,
            use_service_key=True,
        )

        if not project:
            return jsonify({"error": "Project not found"}), 404

        recipients = [{"email": e, "full_name": ""} for e in email_list]

        print(f"📧 Sending custom project email for '{project.get('title')}' to {len(recipients)} recipients...")

        result = send_project_email(project, recipients)

        return jsonify({
            "success": True,
            "message": f"Email sent to {result['sent']} recipients",
            **result,
        })

    except Exception as e:
        print(f"❌ Custom email error: {e}")
        return jsonify({"error": str(e)}), 500
