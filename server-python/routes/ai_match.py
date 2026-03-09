"""
AI Match API route — uses OpenRouter AI.
Finds best fit projects for contractors, or best fit contractors for startups.
"""

import os
import json
import requests as http_requests
from flask import Blueprint, request, jsonify
from auth import require_token
import supabase_client as db

ai_match_bp = Blueprint("ai_match", __name__)

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
OPENROUTER_MODEL = "google/gemini-2.0-flash-001"

def _call_ai(prompt: str) -> list | None:
    api_key = os.getenv("OPENROUTER_API_KEY", "")
    if not api_key:
        print("[ai-match] ERROR: OPENROUTER_API_KEY is not set!")
        return None

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json",
        "HTTP-Referer": "http://localhost:3001",
        "X-Title": "Tarakki AI Match",
    }
    payload = {
        "model": OPENROUTER_MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.1,
        "max_tokens": 1024,
    }

    text_response = ""
    try:
        print(f"[ai-match] Calling OpenRouter AI...")
        resp = http_requests.post(OPENROUTER_URL, headers=headers, json=payload, timeout=60)
        if resp.status_code >= 400:
            print(f"[ai-match] API error: {resp.status_code} - {resp.text[:500]}")
            return None
            
        data = resp.json()
        text_response = data["choices"][0]["message"]["content"].strip()
        
        # trim markdown code blocks
        if text_response.startswith("```json"): text_response = text_response[7:]
        if text_response.startswith("```"): text_response = text_response[3:]
        if text_response.endswith("```"): text_response = text_response[:-3]
        text_response = text_response.strip()
        
        return json.loads(text_response)
    except json.JSONDecodeError as e:
        print(f"[ai-match] Failed to parse AI response as JSON: {e}\nRaw: {text_response[:200]}")
        return None
    except Exception as e:
        print(f"[ai-match] Error: {e}")
        return None

@ai_match_bp.route("/api/ai-match/<user_id>", methods=["POST"])
def get_ai_matches(user_id):
    """
    Find best AI matches for the user payload.
    Body: {"role": "contractor" | "startup"}
    """
    token = require_token()
    body = request.get_json() or {}
    role = body.get("role", "contractor").lower()
    
    try:
        # 1. Fetch user's profile
        my_profile_data = db.select("profiles", filters={"id": user_id}, token=token, single=True)
        if not my_profile_data:
            return jsonify({"error": "Profile not found"}), 404
        # handle single True/False result weirdness from supabase SDK port 
        my_profile = my_profile_data[0] if isinstance(my_profile_data, list) else my_profile_data
        
        if role == "contractor":
            # Finding Projects for Contractor
            projects = db.select("projects", token=token)
            
            # Filter projects to Active and format them small to send to AI
            active_projects = [p for p in projects if p.get("status") != "Completed"]
            
            if not active_projects:
                return jsonify({"matches": []})
                
            projects_context = []
            for p in active_projects:
                projects_context.append({
                    "id": p.get("id"),
                    "title": p.get("title"),
                    "description": str(p.get("description", ""))[:200], # Trucate
                    "skills_required": p.get("skills_required"),
                    "budget_range": p.get("budget_range")
                })
                
            prompt = f"""You are an elite AI matchmaker for a freelance platform.
Find the TOP 3 best project matches for this contractor out of the available projects.

CONTRACTOR PROFILE:
Name: {my_profile.get("full_name")}
Skills: {my_profile.get("skills")}
Experience: {my_profile.get("experience_years")} years
About: {my_profile.get("about")}

AVAILABLE PROJECTS:
{json.dumps(projects_context)}

Respond ONLY with a valid JSON array of objects. Do not include markdown formatting or anything else.
Format:
[
    {{
        "project_id": "uuid-here",
        "match_score": 95,
        "reason": "1-sentence explanation why this matches their specific skills"
    }}
]
"""
            matches = _call_ai(prompt)
            if not matches:
                return jsonify({"error": "Failed to calculate matches"}), 500
                
            # enrich matches
            result = []
            for m in matches:
                p = next((x for x in projects if x["id"] == m.get("project_id")), None)
                if p:
                    m["project"] = p
                    result.append(m)
                    
            return jsonify({"matches": result})
            
        else:
            # Finding Contractors for Startup
            my_projects = db.select("projects", filters={"startup_id": user_id}, token=token)
            my_projects = [p for p in my_projects if p.get("status") != "Completed"]
            
            if not my_projects:
                return jsonify({"error": "Make sure you have an active project posted first!"}), 400
                
            contractors = db.select("profiles", filters={"role": "contractor"}, token=token)
            
            contractor_context = []
            for c in contractors:
                contractor_context.append({
                    "id": c.get("id"),
                    "name": c.get("full_name", "Unknown"),
                    "skills": c.get("skills"),
                    "experience": c.get("experience_years")
                })
                
            projects_context = []
            for p in my_projects:
                projects_context.append({
                    "id": p.get("id"),
                    "title": p.get("title"),
                    "skills_required": p.get("skills_required")
                })
                
            prompt = f"""You are an elite AI recruiter. 
Find the TOP 3 best contractor matches for the startup's active projects.

STARTUP PROJECTS:
{json.dumps(projects_context)}

AVAILABLE CONTRACTORS:
{json.dumps(contractor_context)}

Respond ONLY with a valid JSON array of objects. No markdown.
Format:
[
    {{
        "contractor_id": "uuid-here",
        "project_id": "uuid-of-project-they-match",
        "match_score": 92,
        "reason": "1-sentence explanation"
    }}
]
"""
            matches = _call_ai(prompt)
            if not matches:
                return jsonify({"error": "Failed to calculate matches"}), 500
                
            # enrich matches
            result = []
            for m in matches:
                c = next((x for x in contractors if x["id"] == m.get("contractor_id")), None)
                p = next((x for x in my_projects if x["id"] == m.get("project_id")), None)
                if c and p:
                    m["contractor"] = c
                    m["project"] = p
                    result.append(m)
                    
            return jsonify({"matches": result})
            
    except Exception as e:
        print(f"[ai-match] 500 Error: {e}")
        return jsonify({"error": str(e)}), 500
