# Fraud Radar · Backend

FastAPI service: loads the trained XGBoost model, scores transactions, and stores users, predictions,
alert reviews and an activity log in SQLite.

## Run locally

From `IEEE-CIS Fraud Detection/page/backend`, with the virtual environment active:

```bash
pip install -r requirements.txt
python -m scripts.build_demo_data      # once: scores 5,000 test-period transactions for the dashboard
uvicorn app.main:app --reload
```

Interactive docs: http://localhost:8000/docs — log in with `POST /api/auth/login`, copy the `token`
and paste it in **Authorize** to try protected endpoints.

## Users and roles

| Role | Access |
|---|---|
| Visitor (no login) | `/api/health`, `/api/model`, register and login |
| `ANALYST` (default for new accounts) | Dashboard data, scoring, alert reviews, own prediction history, own profile |
| `ADMIN` | Everything above + user management, all predictions and the activity log |

A default administrator is created on first start:
**admin@fraudradar.dev / admin1234** — change it with the `ADMIN_EMAIL` / `ADMIN_PASSWORD`
environment variables, and set a private `SECRET_KEY` before deploying.

Passwords are hashed with PBKDF2-SHA256 and sessions use signed tokens (12 h by default).

## Endpoints

| Method | Endpoint | Who |
|---|---|---|
| GET | `/api/health`, `/api/model` | Public |
| POST | `/api/auth/register`, `/api/auth/login` | Public |
| GET / PATCH | `/api/auth/me` | Logged in |
| POST | `/api/auth/password` | Logged in |
| POST | `/api/score` | Logged in · saved to the user's history |
| POST | `/api/score/batch` | Logged in |
| GET | `/api/predictions` | Logged in · own history |
| GET | `/api/stats`, `/api/alerts`, `/api/transactions`, `/api/transactions/{id}` | Logged in |
| PUT | `/api/transactions/{id}/review` | Logged in · `confirmed_fraud`, `legit` or `escalated` |
| GET / PATCH | `/api/admin/users`, `/api/admin/users/{id}` | Admin |
| GET | `/api/admin/activity`, `/api/admin/predictions` | Admin |

## Quick check

With the API running, in a second terminal:

```bash
python -m scripts.try_api
```

## Notes
- The model files are read from `IEEE-CIS Fraud Detection/model/` (override with `MODEL_DIR`).
- `data/` holds the generated demo data and the SQLite database. Neither is committed: the demo data
  follows the Kaggle competition rules, and the database contains user accounts.
