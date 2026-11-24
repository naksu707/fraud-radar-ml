"""Turns raw transactions into model features (exactly like 02_modeling.ipynb) and scores them."""
from __future__ import annotations

import json
from pathlib import Path
from typing import Any

import joblib
import numpy as np
import pandas as pd

from .config import HIGH_RISK_SCORE

IDENTITY_FIELDS = ("DeviceType", "DeviceInfo")


def _key(value: Any) -> str:
    """Same key format used when the frequency maps were saved (str of the original value)."""
    if isinstance(value, (int, float, np.integer, np.floating)) and not isinstance(value, bool):
        return str(float(value))
    return str(value)


def _describe(feature: str, readable: dict[str, str]) -> str:
    if feature in readable:
        return readable[feature]
    if feature.startswith("V"):
        return f"Vesta risk signal ({feature})"
    if feature.startswith("C"):
        return f"Linked cards/addresses count ({feature})"
    if feature.startswith("D"):
        return f"Time since previous activity ({feature})"
    if feature.startswith("M"):
        return f"Match check ({feature})"
    if feature.startswith("id_"):
        return f"Device/identity signal ({feature})"
    return feature


class FraudScorer:
    def __init__(self, model_dir: Path):
        self.model = joblib.load(model_dir / "fraud_xgb.joblib")
        art = joblib.load(model_dir / "artifacts.joblib")
        self.features: list[str] = art["features"]
        self.cat_cols: list[str] = art["categorical_columns"]
        self.cat_index = {c: {v: i for i, v in enumerate(vals)} for c, vals in art["categories"].items()}
        self.categories: dict[str, list[str]] = art["categories"]
        self.freq_maps: dict[str, dict[str, float]] = art["freq_maps"]
        self.card_mean: dict[str, float] = art["card_mean"]
        self.threshold: float = float(art["threshold"])
        self.readable: dict[str, str] = art.get("readable_names", {})
        metrics_file = model_dir / "metrics.json"
        self.metrics = json.loads(metrics_file.read_text()) if metrics_file.exists() else {}
        profile_file = model_dir / "typical_profile.json"
        self.profile: dict = json.loads(profile_file.read_text()) if profile_file.exists() else {}
        best = getattr(self.model, "best_iteration", None)
        self.iteration_range = (0, best + 1) if best is not None else None

    def with_profile(self, raw: dict) -> dict:
        """Fill every field the user did not send with the typical transaction's value."""
        given = {k: v for k, v in raw.items() if v is not None}
        return {**self.profile, **given}

    # ---------- feature engineering (mirrors notebook 02, section 3) ----------
    def prepare(self, raw: pd.DataFrame) -> pd.DataFrame:
        df = raw.copy()
        amt = pd.to_numeric(df["TransactionAmt"], errors="coerce").astype("float32")

        if "TransactionDT" in df and df["TransactionDT"].notna().any():
            dt = pd.to_numeric(df["TransactionDT"], errors="coerce")
            df["hour"] = df.get("hour", (dt // 3600) % 24)
            df["weekday"] = df.get("weekday", (dt // 86400) % 7)
        if "has_identity" not in df:
            present = [c for c in IDENTITY_FIELDS if c in df]
            df["has_identity"] = df[present].notna().any(axis=1).astype("int8") if present else 0

        df["amt_log"] = np.log1p(amt)
        df["amt_cents"] = (amt - np.floor(amt)).round(3)
        df["amt_is_tiny"] = (amt < 1).astype("int8")
        if "P_emaildomain" in df and "R_emaildomain" in df:
            df["email_match"] = (df["P_emaildomain"].astype("object") == df["R_emaildomain"].astype("object")).astype("int8")
        else:
            df["email_match"] = 0

        for col, mapping in self.freq_maps.items():
            if col in df:
                df[f"{col}_freq"] = [mapping.get(_key(v), 0.0) if pd.notna(v) else 0.0 for v in df[col]]
            else:
                df[f"{col}_freq"] = 0.0
        if "card1" in df:
            means = [self.card_mean.get(_key(v), np.nan) if pd.notna(v) else np.nan for v in df["card1"]]
            df["amt_vs_card_mean"] = amt / pd.Series(means, index=df.index, dtype="float32")
        else:
            df["amt_vs_card_mean"] = np.nan

        for col in self.cat_cols:
            if col in df:
                idx = self.cat_index[col]
                df[col] = [idx.get(str(v), -1) if pd.notna(v) else -1 for v in df[col]]
            else:
                df[col] = -1

        return df.reindex(columns=self.features).astype("float32")

    # ---------- scoring ----------
    def score(self, raw: pd.DataFrame, n_reasons: int = 5) -> list[dict]:
        import xgboost as xgb

        X = self.prepare(raw)
        proba = self.model.predict_proba(X)[:, 1]
        booster = self.model.get_booster()
        kwargs = {"iteration_range": self.iteration_range} if self.iteration_range else {}
        contribs = booster.predict(xgb.DMatrix(X), pred_contribs=True, **kwargs)[:, :-1]

        results = []
        for i, p in enumerate(proba):
            top = np.argsort(-np.abs(contribs[i]))[:n_reasons]
            reasons = []
            for j in top:
                feat = self.features[j]
                value = X.iat[i, j]
                if feat in self.categories:
                    value = self.categories[feat][int(value)] if value >= 0 else "missing"
                elif pd.isna(value):
                    value = None
                else:
                    value = round(float(value), 4)
                reasons.append({
                    "feature": feat,
                    "reason": _describe(feat, self.readable),
                    "value": value,
                    "impact": round(float(contribs[i, j]), 4),
                    "direction": "raises" if contribs[i, j] > 0 else "lowers",
                })
            results.append({
                "risk_score": round(float(p) * 100, 2),
                "alert": bool(p >= self.threshold),
                "risk_level": "high" if p >= HIGH_RISK_SCORE else ("medium" if p >= self.threshold else "low"),
                "reasons": reasons,
            })
        return results
