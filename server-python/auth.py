"""
Helper to extract the Bearer token from the Authorization header.
"""

from flask import request


def get_token():
    """
    Extracts the Bearer token from the Authorization header.
    Returns None if missing.
    """
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        return auth_header.replace("Bearer ", "")
    return None


def require_token():
    """
    Extracts the Bearer token and raises 401 if missing.
    """
    token = get_token()
    if not token:
        from flask import jsonify, abort
        abort(401, description="Missing or invalid Authorization header")
    return token
