
from flask import Blueprint, request, jsonify
import supabase_client as db
from auth import require_token

subscriptions_bp = Blueprint("subscriptions", __name__)

@subscriptions_bp.route("/api/subscriptions/log", methods=["POST"])
def log_subscription():
    """Log a new subscription event."""
    token = require_token()
    data = request.get_json()
    
    # Required fields
    user_id = data.get("user_id")
    if not user_id:
        return jsonify({"error": "user_id is required"}), 400
        
    try:
        # 1. Insert into detailed audit table: subscription_logs
        new_log = {
            "user_id": user_id,
            "full_name": data.get("full_name"),
            "email": data.get("email"),
            "plan_name": data.get("plan_name", "Pro Plan"),
            "amount": data.get("amount", "999"),
            "created_at": "now()"
        }
        db.insert("subscription_logs", new_log, token=token)

        # 2. Insert into the main 'subscriptions' table (as seen in user's screenshot)
        import datetime
        next_year = (datetime.datetime.now() + datetime.timedelta(days=365)).isoformat()
        
        main_subscription = {
            "user_id": user_id,
            "plan_type": data.get("plan_name", "Pro Plan"),
            "amount": float(data.get("amount", 0)),
            "status": "active",
            "billing_cycle": "yearly",
            "next_billing_date": next_year
        }
        result = db.insert("subscriptions", main_subscription, token=token)
        
        return jsonify(result), 201
        
    except Exception as e:
        import traceback
        error_msg = f"ERROR in log_subscription: {str(e)}\n{traceback.format_exc()}"
        print(error_msg)
        with open("error_log.txt", "a") as f:
            f.write(error_msg + "\n")
        return jsonify({"error": str(e)}), 500

@subscriptions_bp.route("/api/subscriptions/logs", methods=["GET"])
def get_subscription_logs():
    """Fetch all subscription logs for Admin."""
    require_token()
    
    try:
        logs = db.select(
            "subscription_logs",
            columns="*",
            order="created_at.desc"
        )
        return jsonify(logs)
        
    except Exception as e:
        with open("error_log.txt", "a") as f:
            f.write(f"ERROR in get_subscription_logs: {str(e)}\n")
        return jsonify({"error": str(e)}), 500
