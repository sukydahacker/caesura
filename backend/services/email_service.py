"""
Email notifications via Resend (https://resend.com)
Docs: https://resend.com/docs/api-reference/emails/send-email

Set RESEND_API_KEY in backend/.env to enable.
If not set, emails are logged but not sent.
"""

import os
import logging
import httpx

logger = logging.getLogger(__name__)

_RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "")
_FROM = os.environ.get("EMAIL_FROM", "Caesura <noreply@caesura.in>")
_RESEND_URL = "https://api.resend.com/emails"


async def _send(to: str, subject: str, html: str) -> bool:
    """Send a single email via Resend. Returns True on success."""
    if not _RESEND_API_KEY:
        logger.warning(f"[email] RESEND_API_KEY not set — skipping email to {to}: {subject}")
        return False
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                _RESEND_URL,
                headers={"Authorization": f"Bearer {_RESEND_API_KEY}", "Content-Type": "application/json"},
                json={"from": _FROM, "to": [to], "subject": subject, "html": html},
                timeout=10.0,
            )
        if resp.status_code in (200, 201):
            logger.info(f"[email] Sent '{subject}' to {to}")
            return True
        else:
            logger.error(f"[email] Failed to send '{subject}' to {to}: {resp.status_code} {resp.text}")
            return False
    except Exception as e:
        logger.error(f"[email] Exception sending '{subject}' to {to}: {e}")
        return False


# ── Email templates ───────────────────────────────────────────────────────────

def _base(content: str) -> str:
    return f"""
    <div style="background:#0A0A0B;padding:40px 0;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
      <div style="max-width:560px;margin:0 auto;background:#141416;border:1px solid rgba(255,255,255,0.08);border-radius:8px;overflow:hidden;">
        <div style="background:#141416;padding:28px 36px;border-bottom:1px solid rgba(255,255,255,0.06);">
          <span style="font-size:22px;font-weight:700;color:#FAFAF9;letter-spacing:-0.5px;">CAESURA</span>
        </div>
        <div style="padding:36px;">
          {content}
        </div>
        <div style="padding:20px 36px;border-top:1px solid rgba(255,255,255,0.06);text-align:center;">
          <p style="margin:0;font-size:12px;color:#5A5A5E;">© 2026 Caesura. All rights reserved.</p>
        </div>
      </div>
    </div>
    """


async def send_order_confirmation(
    buyer_email: str,
    buyer_name: str,
    order_id: str,
    items: list,
    total_amount: float,
    shipping_address: dict,
) -> bool:
    """Send order confirmation to buyer after successful purchase."""
    items_html = "".join(
        f"""<tr>
          <td style="padding:10px 0;color:#FAFAF9;font-size:14px;">{i.get('title','Item')} ({i.get('size','')})</td>
          <td style="padding:10px 0;color:#FAFAF9;font-size:14px;text-align:right;">x{i.get('quantity',1)}</td>
          <td style="padding:10px 0;color:#C8FF00;font-size:14px;text-align:right;font-weight:600;">₹{i.get('price',0) * i.get('quantity',1)}</td>
        </tr>"""
        for i in items
    )
    addr = shipping_address
    content = f"""
      <h2 style="margin:0 0 8px;color:#FAFAF9;font-size:24px;font-weight:700;">Order Confirmed</h2>
      <p style="margin:0 0 28px;color:#9A9A9D;font-size:15px;">Thanks {buyer_name}, your order is on its way to print.</p>

      <div style="background:#1C1C1F;border-radius:6px;padding:20px;margin-bottom:24px;">
        <p style="margin:0 0 4px;color:#5A5A5E;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;">Order ID</p>
        <p style="margin:0;color:#FAFAF9;font-size:14px;font-family:monospace;">{order_id}</p>
      </div>

      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <tr style="border-bottom:1px solid rgba(255,255,255,0.06);">
          <th style="padding:8px 0;color:#5A5A5E;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;text-align:left;font-weight:500;">Item</th>
          <th style="padding:8px 0;color:#5A5A5E;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;text-align:right;font-weight:500;">Qty</th>
          <th style="padding:8px 0;color:#5A5A5E;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;text-align:right;font-weight:500;">Price</th>
        </tr>
        {items_html}
        <tr style="border-top:1px solid rgba(255,255,255,0.06);">
          <td colspan="2" style="padding:14px 0 0;color:#FAFAF9;font-size:15px;font-weight:700;">Total</td>
          <td style="padding:14px 0 0;color:#C8FF00;font-size:15px;font-weight:700;text-align:right;">₹{total_amount}</td>
        </tr>
      </table>

      <div style="background:#1C1C1F;border-radius:6px;padding:20px;">
        <p style="margin:0 0 8px;color:#5A5A5E;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;">Shipping to</p>
        <p style="margin:0;color:#FAFAF9;font-size:14px;line-height:1.6;">
          {addr.get('name','')}<br>
          {addr.get('address','')}{', ' + addr.get('address2','') if addr.get('address2') else ''}<br>
          {addr.get('city','')}, {addr.get('state','')} – {addr.get('pincode','')}
        </p>
      </div>

      <p style="margin:28px 0 0;color:#5A5A5E;font-size:13px;line-height:1.6;">
        Your item is being printed and will be dispatched soon. You'll receive a tracking update when it ships.
      </p>
    """
    return await _send(
        to=buyer_email,
        subject=f"Order confirmed — {order_id}",
        html=_base(content),
    )


async def send_design_approved(
    creator_email: str,
    creator_name: str,
    design_title: str,
    product_id: str,
    frontend_url: str,
) -> bool:
    """Notify creator that their design was approved and is now live."""
    product_url = f"{frontend_url}/product/{product_id}"
    content = f"""
      <h2 style="margin:0 0 8px;color:#FAFAF9;font-size:24px;font-weight:700;">Your design is live 🎉</h2>
      <p style="margin:0 0 28px;color:#9A9A9D;font-size:15px;">Hey {creator_name}, your design has been approved and is now on the Caesura marketplace.</p>

      <div style="background:#1C1C1F;border-radius:6px;padding:20px;margin-bottom:24px;">
        <p style="margin:0 0 4px;color:#5A5A5E;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;">Design</p>
        <p style="margin:0;color:#FAFAF9;font-size:15px;font-weight:600;">{design_title}</p>
      </div>

      <a href="{product_url}" style="display:inline-block;background:#C8FF00;color:#0A0A0B;padding:14px 28px;border-radius:999px;font-size:14px;font-weight:700;text-decoration:none;letter-spacing:0.02em;">
        View your product →
      </a>

      <p style="margin:28px 0 0;color:#5A5A5E;font-size:13px;line-height:1.6;">
        Every time someone buys your product you earn 80% of the profit. Track your earnings on your dashboard.
      </p>
    """
    return await _send(
        to=creator_email,
        subject=f"Your design '{design_title}' is now live on Caesura",
        html=_base(content),
    )


async def send_design_rejected(
    creator_email: str,
    creator_name: str,
    design_title: str,
    reason: str,
    frontend_url: str,
) -> bool:
    """Notify creator that their design was rejected, with reason."""
    content = f"""
      <h2 style="margin:0 0 8px;color:#FAFAF9;font-size:24px;font-weight:700;">Design not approved</h2>
      <p style="margin:0 0 28px;color:#9A9A9D;font-size:15px;">Hey {creator_name}, unfortunately your design couldn't be approved at this time.</p>

      <div style="background:#1C1C1F;border-radius:6px;padding:20px;margin-bottom:16px;">
        <p style="margin:0 0 4px;color:#5A5A5E;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;">Design</p>
        <p style="margin:0;color:#FAFAF9;font-size:15px;font-weight:600;">{design_title}</p>
      </div>

      <div style="background:#1C1C1F;border-left:3px solid #FF3D00;border-radius:0 6px 6px 0;padding:16px 20px;margin-bottom:24px;">
        <p style="margin:0 0 4px;color:#5A5A5E;font-size:11px;text-transform:uppercase;letter-spacing:0.08em;">Reason</p>
        <p style="margin:0;color:#FAFAF9;font-size:14px;line-height:1.6;">{reason}</p>
      </div>

      <a href="{frontend_url}/sell" style="display:inline-block;background:#1C1C1F;color:#FAFAF9;padding:14px 28px;border-radius:999px;font-size:14px;font-weight:600;text-decoration:none;border:1px solid rgba(255,255,255,0.12);">
        Submit a new design →
      </a>

      <p style="margin:28px 0 0;color:#5A5A5E;font-size:13px;line-height:1.6;">
        You're welcome to revise your design and resubmit. If you have questions, reply to this email.
      </p>
    """
    return await _send(
        to=creator_email,
        subject=f"Update on your design '{design_title}'",
        html=_base(content),
    )
