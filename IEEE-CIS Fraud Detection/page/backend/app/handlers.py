"""Request handlers, independent of the web framework. main.py exposes them with FastAPI."""
from __future__ import annotations

import pandas as pd

from .config import DB_FILE, DEMO_FILE, MODEL_DIR
from .db import Database
from .demo_data import DemoStore
from .schemas import TransactionIn
from .scoring import FraudScorer
from .security import create_token, decode_token
from .services import ServiceError, Services

scorer = FraudScorer(MODEL_DIR)
demo = DemoStore(DEMO_FILE)
services = Services(Database(DB_FILE))


# ---------- auth ----------
def current_user(authorization: str | None) -> dict:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise ServiceError(401, "Please log in.")
    payload = decode_token(authorization.split(" ", 1)[1])
    if not payload:
        raise ServiceError(401, "Your session expired. Please log in again.")
    user = services.user(payload["sub"])
    if not user or not user["active"]:
        raise ServiceError(401, "This account is not active.")
    return user


def require_admin(user: dict) -> None:
    if user["role"] != "ADMIN":
        raise ServiceError(403, "Only administrators can do this.")


def session(user: dict) -> dict:
    return {"token": create_token(user["id"], user["role"]), "user": user}


# ---------- model / scoring ----------
def model_info() -> dict:
    return {
        "model": "XGBoost",
        "features": len(scorer.features),
        "threshold": round(scorer.threshold * 100, 2),
        "typical_profile_loaded": bool(scorer.profile),
        "metrics": scorer.metrics,
    }


def _raw(tx: TransactionIn) -> tuple[dict, int]:
    raw = tx.to_raw()
    if tx.base_transaction_id is not None:
        base = demo.raw(tx.base_transaction_id)
        if base is None:
            raise ServiceError(404, "That transaction is not available as a base (see 'editable' in /api/transactions).")
        return {**base, **{k: v for k, v in raw.items() if v is not None}}, 0
    if tx.amount is None:
        raise ServiceError(422, "Send 'amount' (or a base_transaction_id).")
    if not tx.fill_typical or not scorer.profile:
        return raw, 0
    sent = {k for k, v in raw.items() if v is not None}
    return scorer.with_profile(raw), len(set(scorer.profile) - sent)


def score(tx: TransactionIn, user: dict | None = None) -> dict:
    raw, filled = _raw(tx)
    result = scorer.score(pd.DataFrame([raw]))[0]
    out = {**result, "threshold": round(scorer.threshold * 100, 2), "filled_from_profile": filled}
    if user:
        out["prediction_id"] = services.save_prediction(user["id"], tx.model_dump(exclude_none=True, exclude={"extra", "fill_typical"}), out)
    return out


def score_batch(txs: list[TransactionIn]) -> list[dict]:
    if len(txs) > 1000:
        raise ServiceError(413, "Send at most 1,000 transactions per request.")
    if not txs:
        return []
    prepared = [_raw(t) for t in txs]
    results = scorer.score(pd.DataFrame([r for r, _ in prepared]))
    return [{**r, "threshold": round(scorer.threshold * 100, 2), "filled_from_profile": f}
            for r, (_, f) in zip(results, prepared)]


# ---------- dashboard data (with review status) ----------
def _with_reviews(page: dict) -> dict:
    reviews = services.reviews_for([t["transaction_id"] for t in page["items"]])
    for t in page["items"]:
        t["review"] = reviews.get(t["transaction_id"])
    return page


def stats() -> dict:
    out = demo.stats()
    if out.get("available"):
        out["reviews"] = services.review_summary()
    return out


def transactions(limit: int, offset: int, only_alerts: bool) -> dict:
    return _with_reviews(demo.transactions(limit, offset, only_alerts))


def transaction(transaction_id: int) -> dict:
    tx = demo.get(transaction_id)
    if tx is None:
        raise ServiceError(404, "Transaction not found in the demo data.")
    tx["review"] = services.reviews_for([transaction_id]).get(transaction_id)
    return tx


def review(user: dict, transaction_id: int, decision: str, note: str | None) -> dict:
    if demo.get(transaction_id) is None:
        raise ServiceError(404, "Transaction not found in the demo data.")
    return services.review(user["id"], transaction_id, decision, note)
