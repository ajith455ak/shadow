"""Shadow Nexus — Enterprise TOTP 2FA Service.
Generates secret keys, base64 QR code image strings, and validates 6-digit TOTP codes.
"""
from __future__ import annotations

import base64
import io
import random
import string
from typing import Dict, List, Tuple
import pyotp
import qrcode


def generate_totp_secret() -> str:
    """Generate a random 32-character base32 TOTP secret key."""
    return pyotp.random_base32()


def generate_recovery_codes(count: int = 8) -> List[str]:
    """Generate random 8-character recovery codes."""
    codes = []
    for _ in range(count):
        code = "".join(random.choices(string.ascii_uppercase + string.digits, k=8))
        codes.append(f"{code[:4]}-{code[4:]}")
    return codes


def get_totp_uri(secret: str, username: str, issuer_name: str = "Shadow Nexus") -> str:
    """Generate standard otpauth:// URI."""
    totp = pyotp.TOTP(secret)
    return totp.provisioning_uri(name=username, issuer_name=issuer_name)


def generate_qr_code_base64(otpauth_uri: str) -> str:
    """Generate base64 encoded PNG image data string of QR code."""
    qr = qrcode.QRCode(version=1, box_size=6, border=2)
    qr.add_data(otpauth_uri)
    qr.make(fit=True)
    img = qr.make_image(fill_color="#00F0FF", back_color="#05060A")

    buf = io.BytesIO()
    img.save(buf, format="PNG")
    b64_str = base64.b64encode(buf.getvalue()).decode("ascii")
    return f"data:image/png;base64,{b64_str}"


def verify_totp_code(secret: str, code: str) -> bool:
    """Verify 6-digit TOTP code with time drift window."""
    totp = pyotp.TOTP(secret)
    return totp.verify(code.strip(), valid_window=1)
