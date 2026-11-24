"""Fraud Radar API."""
from typing import Literal, Optional

from fastapi import Depends, FastAPI, Header, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, EmailStr, Field

from . import handlers as h
from .config import CORS_ORIGINS
from .schemas import ScoreOut, TransactionIn
from .services import ServiceError

app = FastAPI(
    title="Fraud Radar API",
    description="Fraud risk scoring platform for e-commerce payments (IEEE-CIS / Vesta). "
                "Analysts log in, score transactions, review alerts and keep a history of their predictions. "
                "Use **POST /api/auth/login** and paste the token in **Authorize** to try protected endpoints.",
    version="2.0.0",
)
app.add_middleware(CORSMiddleware, allow_origins=CORS_ORIGINS, allow_methods=["*"], allow_headers=["*"])


@app.exception_handler(ServiceError)
def service_error(_: Request, exc: ServiceError):
    return JSONResponse(status_code=exc.status, content={"detail": exc.message})


# ---------- dependencies ----------
def user_dep(authorization: Optional[str] = Header(None)) -> dict:
    return h.current_user(authorization)


def admin_dep(user: dict = Depends(user_dep)) -> dict:
    h.require_admin(user)
    return user


# ---------- request bodies ----------
class RegisterIn(BaseModel):
    name: str = Field(..., min_length=2, max_length=80)
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    company: Optional[str] = Field(None, max_length=80)


class LoginIn(BaseModel):
    email: EmailStr
    password: str


class ProfileIn(BaseModel):
    name: str = Field(..., min_length=2, max_length=80)
    company: Optional[str] = Field(None, max_length=80)


class PasswordIn(BaseModel):
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=128)


class ReviewIn(BaseModel):
    decision: Literal["confirmed_fraud", "legit", "escalated"]
    note: Optional[str] = Field(None, max_length=500)


class UserUpdateIn(BaseModel):
    role: Optional[Literal["ANALYST", "ADMIN"]] = None
    active: Optional[bool] = None


# ---------- public ----------
@app.get("/api/health", tags=["System"])
def health():
    return {"status": "ok", "model_loaded": True, "demo_data": h.demo.available}


@app.get("/api/model", tags=["Model"])
def model_info():
    return h.model_info()


# ---------- auth ----------
@app.post("/api/auth/register", tags=["Auth"])
def register(body: RegisterIn):
    return h.session(h.services.register(body.name, body.email, body.password, body.company))


@app.post("/api/auth/login", tags=["Auth"])
def login(body: LoginIn):
    return h.session(h.services.authenticate(body.email, body.password))


@app.get("/api/auth/me", tags=["Auth"])
def me(user: dict = Depends(user_dep)):
    return user


@app.patch("/api/auth/me", tags=["Auth"])
def update_me(body: ProfileIn, user: dict = Depends(user_dep)):
    return h.services.update_profile(user["id"], body.name, body.company)


@app.post("/api/auth/password", tags=["Auth"])
def change_password(body: PasswordIn, user: dict = Depends(user_dep)):
    h.services.change_password(user["id"], body.current_password, body.new_password)
    return {"ok": True}


# ---------- scoring ----------
@app.post("/api/score", response_model=ScoreOut, tags=["Scoring"])
def score_transaction(tx: TransactionIn, user: dict = Depends(user_dep)):
    return h.score(tx, user)


@app.post("/api/score/batch", response_model=list[ScoreOut], tags=["Scoring"])
def score_batch(txs: list[TransactionIn], user: dict = Depends(user_dep)):
    return h.score_batch(txs)


@app.get("/api/predictions", tags=["Scoring"])
def my_predictions(limit: int = Query(100, ge=1, le=500), user: dict = Depends(user_dep)):
    return h.services.list_predictions(user["id"], limit)


# ---------- dashboard ----------
@app.get("/api/stats", tags=["Dashboard"])
def stats(user: dict = Depends(user_dep)):
    return h.stats()


@app.get("/api/alerts", tags=["Dashboard"])
def alerts(limit: int = Query(50, ge=1, le=500), offset: int = Query(0, ge=0), user: dict = Depends(user_dep)):
    return h.transactions(limit, offset, True)


@app.get("/api/transactions", tags=["Dashboard"])
def transactions(limit: int = Query(50, ge=1, le=500), offset: int = Query(0, ge=0), only_alerts: bool = False,
                 user: dict = Depends(user_dep)):
    return h.transactions(limit, offset, only_alerts)


@app.get("/api/transactions/{transaction_id}", tags=["Dashboard"])
def transaction_detail(transaction_id: int, user: dict = Depends(user_dep)):
    return h.transaction(transaction_id)


@app.put("/api/transactions/{transaction_id}/review", tags=["Dashboard"])
def review_transaction(transaction_id: int, body: ReviewIn, user: dict = Depends(user_dep)):
    return h.review(user, transaction_id, body.decision, body.note)


# ---------- admin ----------
@app.get("/api/admin/users", tags=["Admin"])
def list_users(admin: dict = Depends(admin_dep)):
    return h.services.list_users()


@app.patch("/api/admin/users/{user_id}", tags=["Admin"])
def update_user(user_id: int, body: UserUpdateIn, admin: dict = Depends(admin_dep)):
    return h.services.admin_update_user(admin["id"], user_id, body.role, body.active)


@app.get("/api/admin/activity", tags=["Admin"])
def activity(limit: int = Query(100, ge=1, le=500), admin: dict = Depends(admin_dep)):
    return h.services.activity(limit)


@app.get("/api/admin/predictions", tags=["Admin"])
def all_predictions(limit: int = Query(200, ge=1, le=500), admin: dict = Depends(admin_dep)):
    return h.services.list_predictions(None, limit)
