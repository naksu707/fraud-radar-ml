"""Paths and settings. Everything can be overridden with environment variables (used by Docker)."""
import os
from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parents[1]          # page/backend
PROJECT_DIR = BACKEND_DIR.parents[1]                        # IEEE-CIS Fraud Detection

MODEL_DIR = Path(os.getenv("MODEL_DIR", PROJECT_DIR / "model"))
DATA_DIR = Path(os.getenv("DATA_DIR", BACKEND_DIR / "data"))
DEMO_FILE = DATA_DIR / "demo_transactions.json"
DB_FILE = Path(os.getenv("DB_FILE", DATA_DIR / "fraud_radar.db"))

CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")

# Risk levels (scores are uncalibrated risk scores, not probabilities)
HIGH_RISK_SCORE = float(os.getenv("HIGH_RISK_SCORE", 0.5))

# Auth
SECRET_KEY = os.getenv("SECRET_KEY", "change-me-in-production")
TOKEN_HOURS = int(os.getenv("TOKEN_HOURS", 12))
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@fraudradar.dev")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin1234")

ROLES = ("ANALYST", "ADMIN")
REVIEW_DECISIONS = ("confirmed_fraud", "legit", "escalated")
