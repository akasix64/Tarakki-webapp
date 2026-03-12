"""
Email Service — Sends project notification emails to contractors & startups.

Uses Python's built-in smtplib + email.mime for HTML email composition.
Supports Gmail App Passwords, SMTP relay services, etc.
"""

import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime


# ─── SMTP Config (loaded from .env) ──────────────────────────────────────────

SMTP_HOST = os.getenv("SMTP_HOST", "smtp.gmail.com")
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD", "")
SMTP_FROM_NAME = os.getenv("SMTP_FROM_NAME", "Tarakki")
SMTP_FROM_EMAIL = os.getenv("SMTP_FROM_EMAIL", SMTP_USER)


def _build_project_email_html(project: dict) -> str:
    """
    Build a beautiful, responsive HTML email template for a project notification.
    """
    title = project.get("title", "New Project")
    description = project.get("description", "")
    location = project.get("location", "Remote")
    proj_type = project.get("type", "Contract")
    budget = project.get("budget", "")
    hourly_rate = project.get("hourly_rate", "")
    monthly_rate = project.get("monthly_rate", "")
    deadline = project.get("deadline", "")
    tags = project.get("tags", [])

    # Format deadline
    deadline_str = ""
    if deadline:
        try:
            deadline_str = datetime.fromisoformat(deadline.replace("Z", "+00:00")).strftime("%B %d, %Y")
        except Exception:
            deadline_str = str(deadline)

    # Build tags HTML
    tags_html = ""
    if tags and isinstance(tags, list):
        tag_items = "".join(
            f'<span style="display:inline-block;background:#fffbeb;color:#92780c;'
            f'font-size:11px;font-weight:700;padding:4px 12px;border-radius:20px;'
            f'margin:0 4px 4px 0;letter-spacing:0.5px;border:1px solid #fde68a;">{t}</span>'
            for t in tags[:6]
        )
        tags_html = f'<div style="margin-top:16px;">{tag_items}</div>'

    # Build budget section
    budget_lines = []
    if budget:
        budget_lines.append(f"<strong>Fixed Budget:</strong> {budget}")
    if hourly_rate:
        budget_lines.append(f"<strong>Hourly Rate:</strong> {hourly_rate}")
    if monthly_rate:
        budget_lines.append(f"<strong>Monthly Rate:</strong> {monthly_rate}")
    budget_html = "<br>".join(budget_lines) if budget_lines else "Negotiable"

    return f"""
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Project Opportunity — {title}</title>
</head>
<body style="margin:0;padding:0;font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;background-color:#f0ebd8;">
  <div style="max-width:640px;margin:0 auto;padding:32px 16px;">

    <!-- Header -->
    <div style="background:#1a1a1a;border-radius:24px 24px 0 0;padding:40px 32px 32px;text-align:center;">
      <div style="display:inline-block;background:#ffdd66;color:#1a1a1a;font-size:13px;font-weight:800;
                  padding:6px 20px;border-radius:20px;letter-spacing:2px;text-transform:uppercase;margin-bottom:20px;">
        NEW OPPORTUNITY
      </div>
      <h1 style="color:#ffffff;font-size:28px;font-weight:700;margin:16px 0 8px;line-height:1.3;">
        {title}
      </h1>
      <p style="color:rgba(255,255,255,0.5);font-size:12px;font-weight:600;
                letter-spacing:2px;text-transform:uppercase;margin:0;">
        Posted by Tarakki
      </p>
    </div>

    <!-- Body -->
    <div style="background:#ffffff;padding:32px;border-left:1px solid #e5e1d0;border-right:1px solid #e5e1d0;">

      <!-- Description -->
      <div style="margin-bottom:24px;">
        <h3 style="font-size:11px;font-weight:800;color:#9ca3af;letter-spacing:2px;
                   text-transform:uppercase;margin:0 0 8px;">PROJECT DESCRIPTION</h3>
        <p style="color:#374151;font-size:15px;line-height:1.7;margin:0;">
          {description or 'No description provided.'}
        </p>
      </div>

      <!-- Info Grid -->
      <div style="display:flex;flex-wrap:wrap;gap:0;margin:0 -1px;">
        <!-- Type -->
        <div style="flex:1;min-width:48%;background:#fafaf7;border:1px solid #f0ece0;
                     border-radius:16px;padding:20px;margin:4px;">
          <p style="font-size:10px;font-weight:800;color:#9ca3af;letter-spacing:2px;
                    text-transform:uppercase;margin:0 0 6px;">TYPE</p>
          <p style="font-size:16px;font-weight:700;color:#1a1a1a;margin:0;">{proj_type}</p>
        </div>
        <!-- Location -->
        <div style="flex:1;min-width:48%;background:#fafaf7;border:1px solid #f0ece0;
                     border-radius:16px;padding:20px;margin:4px;">
          <p style="font-size:10px;font-weight:800;color:#9ca3af;letter-spacing:2px;
                    text-transform:uppercase;margin:0 0 6px;">LOCATION</p>
          <p style="font-size:16px;font-weight:700;color:#1a1a1a;margin:0;">{location}</p>
        </div>
        <!-- Budget -->
        <div style="flex:1;min-width:48%;background:#fafaf7;border:1px solid #f0ece0;
                     border-radius:16px;padding:20px;margin:4px;">
          <p style="font-size:10px;font-weight:800;color:#9ca3af;letter-spacing:2px;
                    text-transform:uppercase;margin:0 0 6px;">COMPENSATION</p>
          <p style="font-size:14px;font-weight:700;color:#ffaa00;margin:0;">{budget_html}</p>
        </div>
        <!-- Deadline -->
        <div style="flex:1;min-width:48%;background:#fafaf7;border:1px solid #f0ece0;
                     border-radius:16px;padding:20px;margin:4px;">
          <p style="font-size:10px;font-weight:800;color:#9ca3af;letter-spacing:2px;
                    text-transform:uppercase;margin:0 0 6px;">DEADLINE</p>
          <p style="font-size:16px;font-weight:700;color:#ef4444;margin:0;">
            {deadline_str or '—'}
          </p>
        </div>
      </div>

      <!-- Tags -->
      {tags_html}

      <!-- CTA Button -->
      <div style="text-align:center;margin-top:32px;">
        <a href="{os.getenv('APP_URL', 'http://localhost:5173')}/dashboard"
           style="display:inline-block;background:#1a1a1a;color:#ffdd66;font-size:14px;
                  font-weight:800;padding:14px 40px;border-radius:50px;text-decoration:none;
                  letter-spacing:1px;text-transform:uppercase;">
          View &amp; Apply Now →
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div style="background:#1a1a1a;border-radius:0 0 24px 24px;padding:28px 32px;text-align:center;">
      <p style="color:rgba(255,255,255,0.4);font-size:11px;margin:0 0 4px;font-weight:600;">
        You received this because you're registered on Tarakki.
      </p>
      <p style="color:rgba(255,255,255,0.25);font-size:10px;margin:0;">
        © {datetime.now().year} Tarakki by EgisEdge. All rights reserved.
      </p>
    </div>

  </div>
</body>
</html>
"""


def send_project_email(project: dict, recipients: list[dict]) -> dict:
    """
    Send a project notification email to a list of recipients.

    Args:
        project: dict with project details (title, description, etc.)
        recipients: list of dicts, each with 'email' and optionally 'full_name'

    Returns:
        dict with 'sent', 'failed', and 'errors' keys
    """
    if not SMTP_USER or not SMTP_PASSWORD:
        return {
            "sent": 0,
            "failed": 0,
            "errors": ["SMTP credentials not configured. Set SMTP_USER and SMTP_PASSWORD in .env"],
        }

    html_body = _build_project_email_html(project)
    subject = f"🚀 New Project Opportunity: {project.get('title', 'Untitled')}"

    results = {"sent": 0, "failed": 0, "errors": []}

    try:
        # Connect once, send to all recipients
        server = smtplib.SMTP(SMTP_HOST, SMTP_PORT, timeout=30)
        server.ehlo()
        server.starttls()
        server.ehlo()
        server.login(SMTP_USER, SMTP_PASSWORD)

        for recipient in recipients:
            email_addr = recipient.get("email")
            if not email_addr:
                continue

            recipient_name = recipient.get("full_name", "")

            try:
                msg = MIMEMultipart("alternative")
                msg["Subject"] = subject
                msg["From"] = f"{SMTP_FROM_NAME} <{SMTP_FROM_EMAIL}>"
                msg["To"] = f"{recipient_name} <{email_addr}>" if recipient_name else email_addr

                # Plain-text fallback
                plain_text = (
                    f"New Project Opportunity on Tarakki!\n\n"
                    f"Title: {project.get('title', 'Untitled')}\n"
                    f"Type: {project.get('type', 'Contract')}\n"
                    f"Location: {project.get('location', 'Remote')}\n\n"
                    f"Description: {project.get('description', 'N/A')}\n\n"
                    f"Log in to Tarakki to view and apply."
                )
                msg.attach(MIMEText(plain_text, "plain"))
                msg.attach(MIMEText(html_body, "html"))

                server.sendmail(SMTP_FROM_EMAIL, email_addr, msg.as_string())
                results["sent"] += 1
                print(f"  ✅ Email sent to {email_addr}")

            except Exception as e:
                results["failed"] += 1
                results["errors"].append(f"{email_addr}: {str(e)}")
                print(f"  ❌ Failed to send to {email_addr}: {e}")

        server.quit()

    except smtplib.SMTPAuthenticationError as e:
        results["errors"].append(f"SMTP Authentication failed: {str(e)}. Check SMTP_USER and SMTP_PASSWORD.")
        print(f"❌ SMTP Auth Error: {e}")
    except Exception as e:
        results["errors"].append(f"SMTP connection error: {str(e)}")
        print(f"❌ SMTP Connection Error: {e}")

    return results
