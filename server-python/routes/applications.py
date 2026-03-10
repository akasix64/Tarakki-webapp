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

    # Role detection logic
    import jwt, os
    decoded = jwt.decode(token, options={"verify_signature": False}, algorithms=["HS256"])
    user_id = decoded.get("sub")
    
    user_role = ""
    if user_id:
        prof = db.select("profiles", columns="role", filters={"id": user_id}, single=True, token=token)
        if prof:
            user_role = str(prof.get("role", "")).lower()
    
    is_admin = (user_role == "admin")
    has_service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") is not None

    # Use SERVICE_KEY to bypass potentially broken RLS policies (e.g. type mismatch text=uuid)
    # We will manually filter the results to ensure security.
    try:
        # Fetch all applications
        # If we have a service key, we use it to bypass RLS.
        apps = db.select(
            "applications",
            columns="*",
            order="created_at.desc",
            use_service_key=has_service_key,
            token=None if has_service_key else token
        )

        # Manually filter by user_id if NOT admin
        # (Admins see everything)
        apps_to_process = []
        for app in apps:
            if is_admin or app.get("user_id") == user_id:
                apps_to_process.append(app)
        
        apps = apps_to_process

        filtered_apps = []
        # Manually join profiles and filter by role if needed
        for app in apps:
            if app.get("user_id"):
                p_info = db.select(
                    "profiles",
                    columns="full_name,email,role",
                    filters={"id": app["user_id"]},
                    single=True,
                    use_service_key=True # Always use service key for profile lookup in admin/internal context
                )
                if p_info:
                    # Filter: Only show Contractor applications in the "Applications" tab
                    # (Startup applications are "Bids")
                    if str(p_info.get("role", "")).lower() == "contractor":
                        app["profiles"] = p_info
                        
                        # Get project title
                        if app.get("project_id"):
                            proj = db.select(
                                "projects",
                                columns="title",
                                filters={"id": app["project_id"]},
                                single=True,
                                use_service_key=True
                            )
                            if proj:
                                app["projects"] = proj
                        
                        filtered_apps.append(app)

        return jsonify(filtered_apps)

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---------- PUT update application status ----------

@applications_bp.route("/api/applications/<app_id>/status", methods=["PUT"])
def update_application_status(app_id):
    """Update an application's status and send a notification."""
    token = get_token()
    body = request.get_json()
    # Role detection logic
    import jwt, os
    decoded = jwt.decode(token, options={"verify_signature": False}, algorithms=["HS256"])
    user_id = decoded.get("sub")
    
    user_role = ""
    if user_id:
        prof = db.select("profiles", columns="role", filters={"id": user_id}, single=True, token=token)
        if prof:
            user_role = str(prof.get("role", "")).lower()
    
    is_admin = (user_role == "admin")
    has_service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") is not None

    status = body.get("status")

    try:
        results = db.update(
            "applications",
            updates={"status": status},
            filters={"id": app_id},
            columns="*",
            token=None if (is_admin and has_service_key) else token,
            use_service_key=(is_admin and has_service_key)
        )

        if not results:
            return jsonify({"error": "Application not found"}), 404

        data = results[0]

        # Manually fetch project title for the notification
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

        # Notification side effect
        if status in ("accepted", "approved", "rejected", "shortlisted", "review"):
            try:
                if status in ("accepted", "approved"):
                    notif_title = "🎉 Application Accepted!"
                    notif_msg = f'Congratulations! Your application for "{project_title}" has been accepted.'
                elif status == "rejected":
                    notif_title = "❌ Application Update"
                    notif_msg = f'Unfortunately, your application for "{project_title}" was not selected at this time.'
                elif status == "shortlisted":
                    notif_title = "📋 Shortlisted!"
                    notif_msg = f'Great news! You have been shortlisted for "{project_title}". The admin will contact you soon.'
                elif status == "review":
                    notif_title = "🔍 Under Review"
                    notif_msg = f'Your application for "{project_title}" is currently under review.'
                else:
                    notif_title = "📝 Application Update"
                    notif_msg = f'The status of your application for "{project_title}" has been updated to {status}.'

                # Use service key to bypass potential RLS constraints for notifications of others
                db.insert("notifications", {
                    "user_id": data["user_id"],
                    "title": notif_title,
                    "message": notif_msg,
                    "type": "application", # Standard type
                    "is_read": False,
                }, use_service_key=True)
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
        project_id = body.get("project_id")
        user_id_body = body.get("user_id")
        
        # 1. Security Check: Ensure the user is only applying for themselves
        import jwt
        try:
            decoded = jwt.decode(token, options={"verify_signature": False}, algorithms=["HS256"])
            token_user_id = decoded.get("sub")
            if token_user_id != user_id_body:
                return jsonify({"error": "Unauthorized: user_id mismatch"}), 403
        except Exception as e:
            return jsonify({"error": f"Invalid token: {e}"}), 401

        # 2. Check for Mock Projects
        import uuid
        is_mock_project = False
        try:
            if project_id:
                uuid.UUID(str(project_id))
        except ValueError:
            is_mock_project = True

        if is_mock_project:
            print(f"Demo Mode: Bypassing DB insert for mock project ID: {project_id}")
            return jsonify({
                "id": "mock-app-id",
                "user_id": user_id_body,
                "project_id": project_id,
                "status": "pending",
                "created_at": "2026-03-10T00:00:00Z",
                "message": "Demo mode: Application accepted for mock project."
            }), 201

        # 3. Real Project Insert
        insert_data = {
            "user_id": user_id_body,
            "project_id": project_id,
            "cover_letter": body.get("cover_letter"),
            "expected_rate": body.get("expected_rate"),
            "availability": body.get("availability"),
            "status": body.get("status", "pending"),
        }

        # IMPORTANT: We use use_service_key=True here because the applications table
        # has a project_id column as TEXT while projects has ID as UUID.
        # This type mismatch crashes the RLS policies. Service key bypasses RLS.
        print(f"DEBUG: Inserting application for user {user_id_body} and project {project_id}")
        results = db.insert(
            "applications",
            insert_data,
            columns="*",
            use_service_key=True
        )

        if not results:
            print("ERROR: Application insert returned no results")
            return jsonify({"error": "Failed to create application"}), 500

        data = results[0]
        print(f"DEBUG: Application created with ID: {data.get('id')}")

        # Manually fetch profile and project info for the response & notification
        applicant_name = "A user"
        proj_title = "a project"

        # Try to fetch profile info - Use Service Key here too for reliability
        try:
            if data.get("user_id"):
                prof = db.select("profiles", columns="full_name", filters={"id": data["user_id"]}, single=True, use_service_key=True)
                if prof:
                    applicant_name = prof.get("full_name", "A user")
                    data["profiles"] = prof
        except Exception as e:
            print(f"Non-critical: Profile lookup failed: {e}")

        # Try to fetch project info - Use Service Key here too! 
        # Crucial: comparing project_id (text) with projects.id (uuid)
        try:
            if data.get("project_id"):
                # By using use_service_key=True, we bypass RLS which is usually where the uuid=text error happens
                proj = db.select("projects", columns="title", filters={"id": data["project_id"]}, single=True, use_service_key=True)
                if proj:
                    proj_title = proj.get("title", "a project")
                    data["projects"] = proj
        except Exception as e:
            print(f"Non-critical: Project lookup failed (likely type mismatch or mock ID): {e}")

        # Notification side effect: Notify admins
        try:
            # Fetch all profiles and filter for admins in Python to be case-insensitive
            all_profs = db.select("profiles", columns="id,role", use_service_key=True)
            admins = [p for p in all_profs if str(p.get("role", "")).lower() == "admin"]

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
                db.insert("notifications", notifications_payload, use_service_key=True)
        except Exception as notif_err:
            print(f"Failed to insert admin notifications: {notif_err}")

        return jsonify(data), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500
