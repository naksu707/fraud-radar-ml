"""Business logic for users, predictions, reviews and activity. Framework-independent (no FastAPI here)."""
from __future__ import annotations

import json

from .config import ADMIN_EMAIL, ADMIN_PASSWORD, REVIEW_DECISIONS, ROLES
from .db import Database
from .security import hash_password, verify_password

PUBLIC_USER = "id, name, email, company, role, active, created_at, last_login"


class ServiceError(Exception):
    def __init__(self, status: int, message: str):
        super().__init__(message)
        self.status = status
        self.message = message


class Services:
    def __init__(self, db: Database):
        self.db = db
        self._seed_admin()

    # ---------- users ----------
    def _seed_admin(self) -> None:
        if not self.db.one("SELECT id FROM users WHERE role = 'ADMIN'"):
            self.db.run(
                "INSERT OR IGNORE INTO users (name, email, company, password_hash, role) VALUES (?, ?, ?, ?, 'ADMIN')",
                ("Administrator", ADMIN_EMAIL, "Fraud Radar", hash_password(ADMIN_PASSWORD)),
            )
        # demo analyst account (only created if it does not exist yet)
        self.db.run(
            "INSERT OR IGNORE INTO users (name, email, company, password_hash, role) VALUES (?, ?, ?, ?, 'ANALYST')",
            ("Demo Analyst", "analyst@fraudradar.dev", "Fraud Radar", hash_password("analyst1234")),
        )

    def user(self, user_id: int) -> dict | None:
        return self.db.one(f"SELECT {PUBLIC_USER} FROM users WHERE id = ?", (user_id,))

    def register(self, name: str, email: str, password: str, company: str | None) -> dict:
        email = email.strip().lower()
        if len(password) < 8:
            raise ServiceError(422, "The password must have at least 8 characters.")
        if self.db.one("SELECT id FROM users WHERE email = ?", (email,)):
            raise ServiceError(409, "There is already an account with that email.")
        uid = self.db.run(
            "INSERT INTO users (name, email, company, password_hash, role, last_login) VALUES (?, ?, ?, ?, 'ANALYST', datetime('now'))",
            (name.strip(), email, (company or "").strip() or None, hash_password(password)),
        )
        self.log(uid, "register", email)
        return self.user(uid)

    def authenticate(self, email: str, password: str) -> dict:
        row = self.db.one("SELECT * FROM users WHERE email = ?", (email.strip().lower(),))
        if not row or not verify_password(password, row["password_hash"]):
            raise ServiceError(401, "Wrong email or password.")
        if not row["active"]:
            raise ServiceError(403, "This account has been deactivated. Contact an administrator.")
        self.db.run("UPDATE users SET last_login = datetime('now') WHERE id = ?", (row["id"],))
        self.log(row["id"], "login")
        return self.user(row["id"])

    def update_profile(self, user_id: int, name: str, company: str | None) -> dict:
        self.db.run("UPDATE users SET name = ?, company = ? WHERE id = ?", (name.strip(), (company or "").strip() or None, user_id))
        return self.user(user_id)

    def change_password(self, user_id: int, current: str, new: str) -> None:
        row = self.db.one("SELECT password_hash FROM users WHERE id = ?", (user_id,))
        if not row or not verify_password(current, row["password_hash"]):
            raise ServiceError(400, "The current password is not correct.")
        if len(new) < 8:
            raise ServiceError(422, "The new password must have at least 8 characters.")
        self.db.run("UPDATE users SET password_hash = ? WHERE id = ?", (hash_password(new), user_id))
        self.log(user_id, "change_password")

    def list_users(self) -> list[dict]:
        return self.db.all(
            f"""SELECT {', '.join('u.' + c.strip() for c in PUBLIC_USER.split(','))},
                       (SELECT COUNT(*) FROM predictions p WHERE p.user_id = u.id) AS predictions,
                       (SELECT COUNT(*) FROM reviews r WHERE r.user_id = u.id) AS reviews
                FROM users u ORDER BY u.created_at"""
        )

    def admin_update_user(self, admin_id: int, user_id: int, role: str | None, active: bool | None) -> dict:
        target = self.user(user_id)
        if not target:
            raise ServiceError(404, "User not found.")
        if user_id == admin_id and (role not in (None, "ADMIN") or active is False):
            raise ServiceError(400, "You cannot remove your own admin access.")
        if role is not None:
            if role not in ROLES:
                raise ServiceError(422, f"Role must be one of {', '.join(ROLES)}.")
            self.db.run("UPDATE users SET role = ? WHERE id = ?", (role, user_id))
        if active is not None:
            self.db.run("UPDATE users SET active = ? WHERE id = ?", (int(active), user_id))
        self.log(admin_id, "update_user", json.dumps({"user": target["email"], "role": role, "active": active}))
        return self.user(user_id)

    # ---------- predictions ----------
    def save_prediction(self, user_id: int, request: dict, result: dict) -> int:
        top = next((r["reason"] for r in result["reasons"] if r["direction"] == "raises"), None)
        pid = self.db.run(
            """INSERT INTO predictions (user_id, base_transaction_id, input_json, risk_score, alert, risk_level, top_reason)
               VALUES (?, ?, ?, ?, ?, ?, ?)""",
            (user_id, request.get("base_transaction_id"), json.dumps(request), result["risk_score"],
             int(result["alert"]), result["risk_level"], top),
        )
        return pid

    def list_predictions(self, user_id: int | None, limit: int = 100) -> list[dict]:
        where, params = ("WHERE p.user_id = ?", (user_id, limit)) if user_id else ("", (limit,))
        rows = self.db.all(
            f"""SELECT p.*, u.name AS user_name FROM predictions p JOIN users u ON u.id = p.user_id
                {where} ORDER BY p.id DESC LIMIT ?""", params)
        for r in rows:
            r["input"] = json.loads(r.pop("input_json"))
            r["alert"] = bool(r["alert"])
        return rows

    # ---------- alert reviews ----------
    def review(self, user_id: int, transaction_id: int, decision: str, note: str | None) -> dict:
        if decision not in REVIEW_DECISIONS:
            raise ServiceError(422, f"Decision must be one of {', '.join(REVIEW_DECISIONS)}.")
        self.db.run(
            """INSERT INTO reviews (transaction_id, user_id, decision, note) VALUES (?, ?, ?, ?)
               ON CONFLICT(transaction_id) DO UPDATE SET user_id = excluded.user_id, decision = excluded.decision,
               note = excluded.note, updated_at = datetime('now')""",
            (transaction_id, user_id, decision, (note or "").strip() or None),
        )
        self.log(user_id, "review", f"{transaction_id}: {decision}")
        return self.reviews_for([transaction_id])[transaction_id]

    def reviews_for(self, ids: list[int]) -> dict[int, dict]:
        if not ids:
            return {}
        marks = ",".join("?" * len(ids))
        rows = self.db.all(
            f"""SELECT r.transaction_id, r.decision, r.note, r.updated_at, u.name AS reviewer
                FROM reviews r JOIN users u ON u.id = r.user_id WHERE r.transaction_id IN ({marks})""", tuple(ids))
        return {r["transaction_id"]: r for r in rows}

    def review_summary(self) -> dict:
        rows = self.db.all("SELECT decision, COUNT(*) AS n FROM reviews GROUP BY decision")
        return {r["decision"]: r["n"] for r in rows}

    # ---------- activity ----------
    def log(self, user_id: int | None, action: str, detail: str | None = None) -> None:
        self.db.run("INSERT INTO activity (user_id, action, detail) VALUES (?, ?, ?)", (user_id, action, detail))

    def activity(self, limit: int = 100) -> list[dict]:
        return self.db.all(
            """SELECT a.id, a.action, a.detail, a.created_at, u.name AS user_name, u.email AS user_email
               FROM activity a LEFT JOIN users u ON u.id = a.user_id ORDER BY a.id DESC LIMIT ?""", (limit,))
