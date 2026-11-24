"""Demo transactions for the dashboard: real test-period transactions already scored by the model.
The file is generated locally with scripts/build_demo_data.py and is NOT committed (Kaggle rules)."""
from __future__ import annotations

import json
from pathlib import Path

import pandas as pd


class DemoStore:
    def __init__(self, path: Path):
        self.available = path.exists()
        raw_file = path.parent / "demo_raw.json"
        self.raw_rows: dict = json.loads(raw_file.read_text()) if raw_file.exists() else {}
        if self.available:
            self.df = pd.DataFrame(json.loads(path.read_text()))
            self.df["editable"] = self.df["transaction_id"].astype(str).isin(self.raw_rows)
        else:
            self.df = pd.DataFrame(columns=["transaction_id", "risk_score", "alert", "is_fraud", "amount"])

    def _records(self, df: pd.DataFrame) -> list[dict]:
        return json.loads(df.to_json(orient="records"))

    def transactions(self, limit: int, offset: int, only_alerts: bool) -> dict:
        df = self.df[self.df["alert"]] if only_alerts else self.df
        df = df.sort_values("risk_score", ascending=False)
        return {"total": int(len(df)), "items": self._records(df.iloc[offset:offset + limit])}

    def raw(self, transaction_id: int) -> dict | None:
        return self.raw_rows.get(str(transaction_id))

    def get(self, transaction_id: int) -> dict | None:
        row = self.df[self.df["transaction_id"] == transaction_id]
        return self._records(row)[0] if len(row) else None

    def stats(self) -> dict:
        df = self.df
        if df.empty:
            return {"available": False}
        alerts = df[df["alert"]]
        fraud = df[df["is_fraud"] == 1]

        def breakdown(col: str) -> list[dict]:
            g = df.groupby(df[col].fillna("missing").astype(str)).agg(
                transactions=("transaction_id", "size"), alerts=("alert", "sum"), fraud_rate=("is_fraud", "mean"))
            g["alert_rate"] = g["alerts"] / g["transactions"]
            return self._records(g.reset_index().rename(columns={col: "label"}).sort_values("transactions", ascending=False))

        hourly = df.groupby("hour").agg(transactions=("transaction_id", "size"), alerts=("alert", "sum")).reset_index()

        return {
            "available": True,
            "transactions": int(len(df)),
            "alerts": int(len(alerts)),
            "alert_rate": float(len(alerts) / len(df)),
            "amount_total": float(df["amount"].sum()),
            "amount_flagged": float(alerts["amount"].sum()),
            "confirmed_fraud": int(len(fraud)),
            "fraud_caught": int(fraud["alert"].sum()),
            "recall": float(fraud["alert"].mean()) if len(fraud) else None,
            "precision": float(alerts["is_fraud"].mean()) if len(alerts) else None,
            "by_product": breakdown("product"),
            "by_card_type": breakdown("card_type"),
            "by_device": breakdown("device_type"),
            "by_hour": self._records(hourly),
            "score_distribution": self._records(
                pd.cut(df["risk_score"], bins=[0, 2, 6, 10, 25, 50, 75, 100], include_lowest=True)
                  .value_counts(sort=False).rename_axis("band").reset_index(name="transactions")
                  .assign(band=lambda d: d["band"].astype(str))
            ),
        }
