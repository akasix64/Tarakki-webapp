"""
Projects API routes — Flask version.
Converted from: server/routes/projects.js
"""

from flask import Blueprint, request, jsonify
import supabase_client as db
from auth import get_token

projects_bp = Blueprint("projects", __name__)


# ---------- GET all projects ----------

@projects_bp.route("/api/projects", methods=["GET"])
def get_projects():
    """Fetch all projects, ordered by creation date (newest first)."""
    try:
        data = db.select(
            "projects",
            columns="*",
            order="created_at.desc",
        )
        
        import os
        has_service_key = os.getenv("SUPABASE_SERVICE_ROLE_KEY") is not None
        
        try:
            apps = db.select("applications", columns="project_id", use_service_key=has_service_key)
            app_counts = {}
            if apps and isinstance(apps, list):
                for app in apps:
                    pid = str(app.get("project_id"))
                    app_counts[pid] = app_counts.get(pid, 0) + 1
            
            for p in data:
                p["applicant_count"] = app_counts.get(str(p["id"]), 0)
        except Exception as e:
            print(f"Could not fetch application counts: {e}")
            for p in data:
                p["applicant_count"] = 0

        print(f"Fetch projects result: Success ({len(data)} records)")
        return jsonify(data)

    except Exception as e:
        print(f"Fetch projects error: {e}")
        return jsonify({"error": str(e)}), 500


# ---------- POST a new project ----------

@projects_bp.route("/api/projects", methods=["POST"])
def create_project():
    """Create a new project."""
    token = get_token()
    body = request.get_json()
    print(f"POST /projects request body: {body}")

    try:
        insert_data = {
            "title": body.get("title"),
            "description": body.get("description"),
            "location": body.get("location"),
            "type": body.get("type"),
            "budget": body.get("budget"),
            "hourly_rate": body.get("hourly_rate"),
            "monthly_rate": body.get("monthly_rate"),
            "deadline": body.get("deadline"),
            "tags": body.get("tags"),
        }

        results = db.insert(
            "projects",
            insert_data,
            columns="*",
            token=token,
        )

        if not results:
            return jsonify({"error": "Failed to create project"}), 500

        return jsonify(results[0]), 201

    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ---------- DELETE a project ----------

@projects_bp.route("/api/projects/<project_id>", methods=["DELETE"])
def delete_project(project_id):
    """Delete a project by ID."""
    token = get_token()

    try:
        db.delete(
            "projects",
            filters={"id": project_id},
            token=token,
        )
        return "", 204

    except Exception as e:
        return jsonify({"error": str(e)}), 500
