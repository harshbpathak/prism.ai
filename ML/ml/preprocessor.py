"""
Reusable preprocessing — fits on training data, applies on inference.
Saves/loads as a pickle alongside the XGBoost model.
"""

import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder
import joblib


# ── Columns dropped before ANY processing ─────────────────────────────────────
LEAKY = [
    "Delivery Status",
    "Days for shipping (real)",
    "shipping date (DateOrders)",
]
PII_OR_ID = [
    "Customer Email", "Customer Fname", "Customer Lname", "Customer Password",
    "Customer Street", "Customer Zipcode", "Order Zipcode",
    "Customer Id", "Order Customer Id", "Order Id", "Order Item Id",
    "Order Item Cardprod Id", "Product Card Id", "Product Category Id",
    "Product Description", "Product Image", "Product Status",
    "Category Id", "Department Id",
]
FLAT = ["Customer Country"]
TARGET = "Late_delivery_risk"

DROP_ALL = LEAKY + PII_OR_ID + FLAT

# ── Target-encoding columns ────────────────────────────────────────────────────
TE_COLS = [
    "Shipping Mode", "Order Region", "Market", "Department Name",
    "Category Name", "Product Name", "Customer Segment",
    "Order Status", "Order Country", "Order City",
]


class SupplyChainPreprocessor:
    def __init__(self, smoothing: float = 20.0):
        self.smoothing      = smoothing
        self.global_mean_   = None
        self.te_maps_       = {}          # col -> {value: encoded_risk}
        self.label_encoders_= {}          # col -> fitted LabelEncoder
        self.feature_cols_  = None        # ordered list used at train time

    # ─────────────────────────────────────────────────────────────────────────
    def fit_transform(self, df: pd.DataFrame, y: pd.Series) -> pd.DataFrame:
        df = df.copy()
        self.global_mean_ = y.mean()

        # ── temporal ────────────────────────────────────────────────────────
        df = self._make_temporal(df)

        # ── scheduled risk flags ────────────────────────────────────────────
        df["scheduled_window"]    = df["Days for shipment (scheduled)"]
        df["tight_schedule"]      = (df["scheduled_window"] <= 2).astype(int)
        df["very_tight_schedule"] = (df["scheduled_window"] == 1).astype(int)

        # ── financial ───────────────────────────────────────────────────────
        df = self._make_financial(df, fit=True)

        # ── target encoding (fit) ───────────────────────────────────────────
        for col in TE_COLS:
            if col not in df.columns:
                continue
            stats = y.groupby(df[col]).agg(["sum", "count"])
            smooth = (stats["sum"] + self.smoothing * self.global_mean_) / \
                     (stats["count"] + self.smoothing)
            self.te_maps_[col] = smooth.to_dict()
            df[f"{col.lower().replace(' ','_')}_risk"] = df[col].map(smooth)

        # ── interactions ────────────────────────────────────────────────────
        df = self._make_interactions(df)

        # ── order features ──────────────────────────────────────────────────
        df["order_value_per_item"] = df["Order Item Total"] / (df["Order Item Quantity"] + 1)
        df["benefit_ratio"]        = df["Benefit per order"] / (df["Sales per customer"] + 1)

        # ── label encode remaining object cols ──────────────────────────────
        cat_cols = df.select_dtypes(include="object").columns.tolist()
        for col in cat_cols:
            le = LabelEncoder()
            # Include __missing__ sentinel so unseen values are handled at transform time
            values = df[col].fillna("__missing__").astype(str).tolist() + ["__missing__"]
            le.fit(values)
            df[col] = le.transform(df[col].fillna("__missing__").astype(str))
            self.label_encoders_[col] = le

        df = df.fillna(-1)
        self.feature_cols_ = list(df.columns)
        return df

    # ─────────────────────────────────────────────────────────────────────────
    def transform(self, df: pd.DataFrame) -> pd.DataFrame:
        df = df.copy()

        df = self._make_temporal(df)
        df["scheduled_window"]    = df["Days for shipment (scheduled)"]
        df["tight_schedule"]      = (df["scheduled_window"] <= 2).astype(int)
        df["very_tight_schedule"] = (df["scheduled_window"] == 1).astype(int)
        df = self._make_financial(df, fit=False)

        for col in TE_COLS:
            if col not in df.columns:
                continue
            risk_col = f"{col.lower().replace(' ','_')}_risk"
            df[risk_col] = df[col].map(self.te_maps_.get(col, {})).fillna(self.global_mean_)

        df = self._make_interactions(df)
        df["order_value_per_item"] = df["Order Item Total"] / (df["Order Item Quantity"] + 1)
        df["benefit_ratio"]        = df["Benefit per order"] / (df["Sales per customer"] + 1)

        cat_cols = df.select_dtypes(include="object").columns.tolist()
        for col in cat_cols:
            le = self.label_encoders_.get(col)
            if le:
                df[col] = df[col].fillna("__missing__").astype(str)
                known    = set(le.classes_)
                df[col]  = df[col].apply(lambda v: v if v in known else "__missing__")
                df[col]  = le.transform(df[col])
            else:
                df[col] = -1

        df = df.fillna(-1)

        # align columns to training order
        for c in self.feature_cols_:
            if c not in df.columns:
                df[c] = -1
        return df[self.feature_cols_]

    # ─────────────────────────────────────────────────────────────────────────
    def save(self, path: str):
        joblib.dump(self, path)

    @staticmethod
    def load(path: str) -> "SupplyChainPreprocessor":
        return joblib.load(path)

    # ── private helpers ───────────────────────────────────────────────────────
    def _make_temporal(self, df):
        df["order_date"]        = pd.to_datetime(df["order date (DateOrders)"], errors="coerce")
        df["order_month"]       = df["order_date"].dt.month
        df["order_dayofweek"]   = df["order_date"].dt.dayofweek
        df["order_quarter"]     = df["order_date"].dt.quarter
        df["order_year"]        = df["order_date"].dt.year
        df["order_weekofyear"]  = df["order_date"].dt.isocalendar().week.astype(int)
        df["is_weekend_order"]  = (df["order_dayofweek"] >= 5).astype(int)
        df["is_month_end"]      = df["order_date"].dt.is_month_end.astype(int)
        df["is_q_end"]          = df["order_date"].dt.is_quarter_end.astype(int)
        df.drop(columns=["order date (DateOrders)", "order_date"], inplace=True, errors="ignore")
        return df

    def _make_financial(self, df, fit: bool):
        df["high_discount"]   = (df["Order Item Discount Rate"] > 0.2).astype(int)
        df["negative_profit"] = (df["Order Profit Per Order"] < 0).astype(int)
        if fit:
            df["profit_bin"] = pd.qcut(
                df["Order Profit Per Order"].clip(-500, 500),
                q=5, labels=False, duplicates="drop"
            )
            df["sales_bin"] = pd.qcut(
                df["Sales per customer"].clip(0, 2000),
                q=5, labels=False, duplicates="drop"
            )
        else:
            df["profit_bin"] = 2   # median bin as default
            df["sales_bin"]  = 2
        return df

    def _make_interactions(self, df):
        sm_risk  = df.get("shipping_mode_risk",  self.global_mean_)
        or_risk  = df.get("order_region_risk",   self.global_mean_)
        sched    = df.get("scheduled_window",     3)
        disc     = df.get("Order Item Discount Rate", 0)
        df["mode_x_region"]   = sm_risk * or_risk
        df["mode_x_schedule"] = sm_risk * sched
        df["region_x_schedule"] = or_risk * sched
        df["mode_x_discount"] = sm_risk * disc
        return df
