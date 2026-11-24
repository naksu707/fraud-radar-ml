"""Quick end-to-end check of the running API (no extra libraries needed).

1. Start the API in one terminal:   uvicorn app.main:app --reload
2. In a second terminal, from page/backend:   python -m scripts.try_api
"""
import json
import urllib.error
import urllib.request

API = "http://localhost:8000/api"


TOKEN = None


def call(method: str, path: str, body: dict | None = None) -> dict:
    data = json.dumps(body).encode() if body is not None else None
    headers = {"Content-Type": "application/json", **({"Authorization": f"Bearer {TOKEN}"} if TOKEN else {})}
    req = urllib.request.Request(f"{API}{path}", data=data, method=method, headers=headers)
    try:
        with urllib.request.urlopen(req) as res:
            return json.loads(res.read())
    except urllib.error.HTTPError as e:
        raise SystemExit(f"❌ {method} {path} → {e.code}: {e.read().decode()}")
    except urllib.error.URLError:
        raise SystemExit("❌ The API is not running. Start it first with: uvicorn app.main:app --reload")


def show(title: str, result: dict) -> None:
    print(f"\n{title}")
    print(f"   Risk score: {result['risk_score']:.2f} / 100 · alert: {'YES 🚨' if result['alert'] else 'no'} "
          f"· level: {result['risk_level']}")
    print("   Main reasons:")
    for r in result["reasons"]:
        arrow = "↑" if r["direction"] == "raises" else "↓"
        print(f"     {arrow} {r['reason']:<40} value = {r['value']}")


# 1 · Health
health = call("GET", "/health")
print(f"✅ API running · demo data loaded: {health['demo_data']}")
TOKEN = call("POST", "/auth/login", {"email": "admin@fraudradar.dev", "password": "admin1234"})["token"]
print("🔑 Logged in as the default admin")

# 2 · Take the riskiest real alert
alerts = call("GET", "/alerts?limit=1")
if not alerts["items"]:
    raise SystemExit("❌ No demo data. Run first: python -m scripts.build_demo_data")
alert = alerts["items"][0]
tid = alert["transaction_id"]
print(f"\n📋 Top alert: transaction {tid} · amount ${alert['amount']:,.2f} · product {alert['product']} "
      f"· email {alert['email_domain']} · confirmed fraud: {'yes' if alert['is_fraud'] else 'no'}")
print(f"   Score stored in the dashboard data: {alert['risk_score']:.2f}")

# 3 · Re-score the same transaction (should match)
same = call("POST", "/score", {"base_transaction_id": tid})
show("🔁 Re-scored with no changes (should match the stored score):", same)

# 4 · What if the amount and email were different?
changes = {"amount": 500, "purchaser_email_domain": "gmail.com"}
edited = call("POST", "/score", {"base_transaction_id": tid, **changes})
show(f"✏️  Same transaction with {changes}:", edited)

diff = edited["risk_score"] - same["risk_score"]
print(f"\n📊 Change in risk score: {diff:+.2f} points")
