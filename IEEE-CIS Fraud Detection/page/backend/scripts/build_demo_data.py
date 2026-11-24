"""Builds data/demo_transactions.json for the dashboard.

Takes a sample of real transactions from the TEST period (last 15% of the timeline, never used for training),
scores them with the same scorer the API uses, and keeps only the fields the dashboard shows.

Run from page/backend:
    python -m scripts.build_demo_data            # 5,000 transactions (default)
    python -m scripts.build_demo_data --n 10000
"""
import argparse
import json
import sys
from pathlib import Path

import numpy as np
import pandas as pd

sys.path.append(str(Path(__file__).resolve().parents[1]))
from app.config import DEMO_FILE, MODEL_DIR, PROJECT_DIR  # noqa: E402
from app.scoring import FraudScorer  # noqa: E402

DISPLAY = {
    "TransactionID": "transaction_id", "TransactionAmt": "amount", "ProductCD": "product",
    "card4": "card_network", "card6": "card_type", "P_emaildomain": "email_domain",
    "DeviceType": "device_type", "DeviceInfo": "device_info", "hour": "hour", "day": "day", "isFraud": "is_fraud",
}


ID_LIKE = {"card1", "card2", "card3", "card5", "addr1", "addr2"}
SKIP = {"isFraud", "TransactionID", "TransactionDT", "day", "split", "has_identity"}


def build_profile(train: pd.DataFrame) -> dict:
    """A 'typical transaction': median (numeric) or most common value (categorical / ID-like) of each column
    in the training period. Columns that are usually empty (>50% missing) stay empty, as they would in real data."""
    profile = {}
    for col in train.columns:
        if col in SKIP or train[col].isna().mean() > 0.5:
            continue
        s = train[col].dropna()
        if isinstance(train[col].dtype, pd.CategoricalDtype) or col in ID_LIKE:
            value = s.mode().iloc[0]
            profile[col] = value if isinstance(value, str) else float(value)
        else:
            profile[col] = float(s.median())
    if "day" in train:
        profile["weekday"] = float((train["day"] % 7).median())
    return profile


def main(n: int, seed: int) -> None:
    src = PROJECT_DIR / "dataset" / "processed" / "train_merged.pkl"
    print(f"Loading {src} ...")
    df = pd.read_pickle(src).sort_values("TransactionDT")
    test = df[df["TransactionDT"] > df["TransactionDT"].quantile(0.85)]
    train = df[df["TransactionDT"] <= df["TransactionDT"].quantile(0.70)]

    profile = build_profile(train)
    (MODEL_DIR / "typical_profile.json").write_text(json.dumps(profile, indent=1))
    print(f"Saved typical transaction profile ({len(profile)} fields) → {MODEL_DIR / 'typical_profile.json'}")
    sample = test.sample(min(n, len(test)), random_state=seed)
    print(f"Scoring {len(sample):,} test-period transactions ...")

    scorer = FraudScorer(MODEL_DIR)
    raw = sample.drop(columns=["isFraud", "split"], errors="ignore")
    scored = []
    for start in range(0, len(raw), 1000):
        scored += scorer.score(raw.iloc[start:start + 1000])

    out = sample[list(DISPLAY)].rename(columns=DISPLAY)
    for col in ("product", "card_network", "card_type", "email_domain", "device_type", "device_info"):
        out[col] = out[col].astype("object").where(out[col].notna(), None)
    out["amount"] = out["amount"].astype(float).round(2)
    out["risk_score"] = [s["risk_score"] for s in scored]
    out["alert"] = [s["alert"] for s in scored]
    out["risk_level"] = [s["risk_level"] for s in scored]
    out["reasons"] = [s["reasons"] for s in scored]

    DEMO_FILE.parent.mkdir(parents=True, exist_ok=True)
    DEMO_FILE.write_text(json.dumps(json.loads(out.to_json(orient="records"))))

    # Full raw rows (all columns) for alerts + a sample of other transactions, so the
    # "Evaluate" form can start from a real transaction and change a few fields
    keep = out["alert"].to_numpy() | (np.random.default_rng(seed).random(len(out)) < 0.06)
    raw_keep = raw[keep].copy()
    for col in raw_keep.columns:
        if isinstance(raw_keep[col].dtype, pd.CategoricalDtype):
            raw_keep[col] = raw_keep[col].astype("object")
    raw_records = json.loads(raw_keep.to_json(orient="records"))
    (DEMO_FILE.parent / "demo_raw.json").write_text(
        json.dumps({str(int(r["TransactionID"])): r for r in raw_records}))
    print(f"Saved full details of {len(raw_records):,} transactions → {DEMO_FILE.parent / 'demo_raw.json'}")
    print(f"Saved {len(out):,} transactions → {DEMO_FILE}")
    print(f"Alerts: {out['alert'].sum():,} · confirmed fraud: {int(out['is_fraud'].sum()):,} · "
          f"fraud caught: {int((out['alert'] & (out['is_fraud'] == 1)).sum()):,}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--n", type=int, default=5000)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()
    main(args.n, args.seed)
