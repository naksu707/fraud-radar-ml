"""Request and response models for the API."""
from typing import Literal, Optional, Union

from pydantic import BaseModel, Field


class TransactionIn(BaseModel):
    """A transaction to score. Only `amount` is required; missing fields are treated as unknown,
    just like missing values in the training data."""

    amount: Optional[float] = Field(None, gt=0, description="Transaction amount in USD. Required unless base_transaction_id is sent", examples=[0.79])
    product_code: Optional[Literal["W", "H", "C", "S", "R"]] = Field(None, examples=["C"])
    card_network: Optional[str] = Field(None, description="visa, mastercard, american express, discover", examples=["discover"])
    card_type: Optional[str] = Field(None, description="credit or debit", examples=["credit"])
    card_id: Optional[float] = Field(None, description="Anonymized card identifier (card1)")
    card2: Optional[float] = None
    card3: Optional[float] = None
    card5: Optional[float] = None
    address: Optional[float] = Field(None, description="Anonymized billing region (addr1)")
    distance: Optional[float] = Field(None, description="Distance between addresses (dist1)")
    purchaser_email_domain: Optional[str] = Field(None, examples=["outlook.com"])
    recipient_email_domain: Optional[str] = None
    device_type: Optional[Literal["mobile", "desktop"]] = Field(None, examples=["mobile"])
    device_info: Optional[str] = Field(None, examples=["iOS Device"])
    hour: Optional[int] = Field(None, ge=0, le=23, description="Hour of day (relative, as in the dataset)")
    weekday: Optional[int] = Field(None, ge=0, le=6)
    base_transaction_id: Optional[int] = Field(
        None, description="Start from a real demo transaction (all its fields) and override only what you send"
    )
    fill_typical: bool = Field(
        True, description="Fill fields you don't send with a typical transaction's values (recommended). "
                          "If false, missing fields stay empty."
    )
    extra: dict[str, Union[float, str, None]] = Field(
        default_factory=dict, description="Any other raw IEEE-CIS column, e.g. {'C1': 3, 'V258': 1}"
    )

    def to_raw(self) -> dict:
        raw = {
            "TransactionAmt": self.amount, "ProductCD": self.product_code, "card4": self.card_network,
            "card6": self.card_type, "card1": self.card_id, "card2": self.card2, "card3": self.card3,
            "card5": self.card5, "addr1": self.address, "dist1": self.distance,
            "P_emaildomain": self.purchaser_email_domain, "R_emaildomain": self.recipient_email_domain,
            "DeviceType": self.device_type, "DeviceInfo": self.device_info,
            "hour": self.hour, "weekday": self.weekday,
        }
        raw.update(self.extra)
        return raw


class Reason(BaseModel):
    feature: str
    reason: str
    value: Union[float, str, None]
    impact: float
    direction: Literal["raises", "lowers"]


class ScoreOut(BaseModel):
    risk_score: float = Field(..., description="0–100. An uncalibrated risk score, not a probability")
    alert: bool
    risk_level: Literal["low", "medium", "high"]
    threshold: float = Field(..., description="Alert threshold on the same 0–100 scale")
    filled_from_profile: int = Field(0, description="Fields filled with typical values")
    prediction_id: Optional[int] = Field(None, description="ID of the saved prediction in your history")
    reasons: list[Reason]
