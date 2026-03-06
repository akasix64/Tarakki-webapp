"""
Supabase REST API helper.
Uses direct HTTP calls to the PostgREST and GoTrue APIs
instead of the supabase-py SDK (avoids Rust/pydantic dependency).
"""

import os
import requests

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL", "")
SUPABASE_KEY = os.getenv("VITE_SUPABASE_ANON_KEY", "")
REST_URL = f"{SUPABASE_URL}/rest/v1"
AUTH_URL = f"{SUPABASE_URL}/auth/v1"


def _headers(token=None):
    """Build standard Supabase headers."""
    h = {
        "apikey": SUPABASE_KEY,
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }
    if token:
        h["Authorization"] = f"Bearer {token}"
    else:
        h["Authorization"] = f"Bearer {SUPABASE_KEY}"
    return h


# ────────────────────────────────────────────
#  SELECT helpers
# ────────────────────────────────────────────

def select(table, columns="*", filters=None, order=None, token=None, single=False):
    """
    SELECT from a table.
    filters: dict of column=value  (eq filters)
    order:   "col.desc" or "col.asc"
    """
    params = {"select": columns}
    headers = _headers(token)

    if order:
        params["order"] = order

    if filters:
        for col, val in filters.items():
            params[col] = f"eq.{val}"

    resp = requests.get(f"{REST_URL}/{table}", headers=headers, params=params)

    if resp.status_code >= 400:
        raise Exception(resp.text)

    data = resp.json()

    if single:
        return data[0] if data else None

    return data


# ────────────────────────────────────────────
#  INSERT helper
# ────────────────────────────────────────────

def insert(table, rows, columns="*", token=None):
    """
    INSERT one or more rows.
    rows: a single dict or a list of dicts.
    Returns the inserted row(s).
    """
    if isinstance(rows, dict):
        rows = [rows]

    params = {"select": columns}
    headers = _headers(token)
    headers["Prefer"] = "return=representation"

    resp = requests.post(f"{REST_URL}/{table}", headers=headers, json=rows, params=params)

    if resp.status_code >= 400:
        raise Exception(resp.text)

    data = resp.json()
    return data


# ────────────────────────────────────────────
#  UPDATE helper
# ────────────────────────────────────────────

def update(table, updates, filters, columns="*", token=None):
    """
    UPDATE rows matching filters.
    filters: dict of column=value (eq filters)
    """
    params = {"select": columns}
    headers = _headers(token)
    headers["Prefer"] = "return=representation"

    for col, val in filters.items():
        params[col] = f"eq.{val}"

    resp = requests.patch(f"{REST_URL}/{table}", headers=headers, json=updates, params=params)

    if resp.status_code >= 400:
        raise Exception(resp.text)

    data = resp.json()
    return data


# ────────────────────────────────────────────
#  UPSERT helper
# ────────────────────────────────────────────

def upsert(table, row, columns="*", token=None):
    """
    UPSERT a row (insert or update based on primary key).
    """
    params = {"select": columns}
    headers = _headers(token)
    headers["Prefer"] = "return=representation,resolution=merge-duplicates"

    resp = requests.post(f"{REST_URL}/{table}", headers=headers, json=row, params=params)

    if resp.status_code >= 400:
        raise Exception(resp.text)

    data = resp.json()
    return data[0] if data else None


# ────────────────────────────────────────────
#  DELETE helper
# ────────────────────────────────────────────

def delete(table, filters, token=None):
    """
    DELETE rows matching filters.
    """
    params = {}
    headers = _headers(token)

    for col, val in filters.items():
        params[col] = f"eq.{val}"

    resp = requests.delete(f"{REST_URL}/{table}", headers=headers, params=params)

    if resp.status_code >= 400:
        raise Exception(resp.text)

    return True


# ────────────────────────────────────────────
#  AUTH helper
# ────────────────────────────────────────────

def get_user(token):
    """
    Verify a JWT and return the user object from Supabase Auth.
    """
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {token}",
    }
    resp = requests.get(f"{AUTH_URL}/user", headers=headers)

    if resp.status_code >= 400:
        return None

    return resp.json()
