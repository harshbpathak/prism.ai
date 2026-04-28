"""
Supply Chain Delivery Risk Pipeline
=====================================
Binary classification: High Risk (1) vs Low Risk (0)
Dataset : DataCoSupplyChainDataset.csv
Model   : XGBoost with rich feature engineering
Run     : python pipeline.py
"""

import warnings
warnings.filterwarnings("ignore")

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split, StratifiedKFold, cross_val_score
from sklearn.metrics import (
    classification_report, confusion_matrix,
    roc_auc_score, f1_score, accuracy_score
)
from sklearn.preprocessing import LabelEncoder
import xgboost as xgb
import joblib
import time

# ── optional but nice ──────────────────────────────────────────────────────────
try:
    import shap
    SHAP_AVAILABLE = True
except ImportError:
    SHAP_AVAILABLE = False
    print("tip: pip install shap  for feature importance plots")

# ══════════════════════════════════════════════════════════════════════════════
# 1. LOAD
# ══════════════════════════════════════════════════════════════════════════════
print("\n" + "="*60)
print(" STEP 1 — Loading DataCo Supply Chain Dataset")
print("="*60)

df = pd.read_csv("DataCoSupplyChainDataset.csv", encoding="latin1")
print(f"Raw shape : {df.shape}")
print(f"Target distribution:\n{df['Late_delivery_risk'].value_counts()}")

# ══════════════════════════════════════════════════════════════════════════════
# 2. DROP LEAKY + USELESS COLUMNS
# ══════════════════════════════════════════════════════════════════════════════
print("\n" + "="*60)
print(" STEP 2 — Dropping leaky / PII / useless columns")
print("="*60)

# These reveal the answer AFTER delivery — can't use them to predict
LEAKY = [
    "Delivery Status",            # literally IS the outcome
    "Days for shipping (real)",   # actual shipping time = outcome
    "shipping date (DateOrders)", # post-delivery info
]

# PII / IDs with no signal
PII_OR_ID = [
    "Customer Email", "Customer Fname", "Customer Lname", "Customer Password",
    "Customer Street", "Customer Zipcode", "Order Zipcode",
    "Customer Id", "Order Customer Id", "Order Id", "Order Item Id",
    "Order Item Cardprod Id", "Product Card Id", "Product Category Id",
    "Product Description", "Product Image", "Product Status",
    # Low-cardinality duplicates
    "Category Id", "Department Id",
]

# Completely flat — no variation
FLAT = ["Customer Country"]   # only 2 values, 99% one value

TARGET = "Late_delivery_risk"

DROP = LEAKY + PII_OR_ID + FLAT
df.drop(columns=[c for c in DROP if c in df.columns], inplace=True)
print(f"Remaining columns: {df.shape[1]-1} features + target")

# ══════════════════════════════════════════════════════════════════════════════
# 3. TARGET — binary High Risk / Low Risk
# ══════════════════════════════════════════════════════════════════════════════
# Late_delivery_risk is already 0/1 — 1 = High Risk, 0 = Low Risk
y = df[TARGET].astype(int)
df.drop(columns=[TARGET], inplace=True)
print(f"\nHigh Risk: {y.sum():,}  ({y.mean()*100:.1f}%)")
print(f"Low Risk : {(y==0).sum():,}  ({(1-y.mean())*100:.1f}%)")

# ══════════════════════════════════════════════════════════════════════════════
# 4. FEATURE ENGINEERING
# ══════════════════════════════════════════════════════════════════════════════
print("\n" + "="*60)
print(" STEP 3 — Feature Engineering")
print("="*60)

# ── 4a. Temporal features ─────────────────────────────────────────────────────
df["order_date"] = pd.to_datetime(df["order date (DateOrders)"], errors="coerce")
df["order_month"]       = df["order_date"].dt.month
df["order_dayofweek"]   = df["order_date"].dt.dayofweek   # 0=Mon, 6=Sun
df["order_quarter"]     = df["order_date"].dt.quarter
df["order_year"]        = df["order_date"].dt.year
df["order_weekofyear"]  = df["order_date"].dt.isocalendar().week.astype(int)
df["is_weekend_order"]  = (df["order_dayofweek"] >= 5).astype(int)  # Sat/Sun
df["is_month_end"]      = df["order_date"].dt.is_month_end.astype(int)
df["is_q_end"]          = df["order_date"].dt.is_quarter_end.astype(int)
df.drop(columns=["order date (DateOrders)", "order_date"], inplace=True)
print("  + Temporal: month, dayofweek, quarter, year, weekend flag, month-end")

# ── 4b. Scheduled window risk ─────────────────────────────────────────────────
# Shorter window = higher failure chance
df["scheduled_window"]       = df["Days for shipment (scheduled)"]
df["tight_schedule"]         = (df["scheduled_window"] <= 2).astype(int)
df["very_tight_schedule"]    = (df["scheduled_window"] == 1).astype(int)
print("  + Scheduled window risk flags")

# ── 4c. Financial features ────────────────────────────────────────────────────
df["high_discount"]     = (df["Order Item Discount Rate"] > 0.2).astype(int)
df["negative_profit"]   = (df["Order Profit Per Order"] < 0).astype(int)
df["profit_bin"]        = pd.qcut(df["Order Profit Per Order"].clip(-500, 500),
                                   q=5, labels=False, duplicates="drop")
df["sales_bin"]         = pd.qcut(df["Sales per customer"].clip(0, 2000),
                                   q=5, labels=False, duplicates="drop")
print("  + Financial: discount flag, negative profit, profit/sales bins")

# ── 4d. Target encoding — historical risk per group ───────────────────────────
# Computed on FULL data here (in production, compute only on train)
def target_encode(col, smoothing=20):
    global_mean = y.mean()
    stats = y.groupby(df[col]).agg(["sum", "count"])
    smooth = (stats["sum"] + smoothing * global_mean) / (stats["count"] + smoothing)
    return df[col].map(smooth)

df["shipping_mode_risk"]     = target_encode("Shipping Mode")
df["order_region_risk"]      = target_encode("Order Region")
df["market_risk"]            = target_encode("Market")
df["department_risk"]        = target_encode("Department Name")
df["category_risk"]          = target_encode("Category Name")
df["product_risk"]           = target_encode("Product Name")
df["customer_segment_risk"]  = target_encode("Customer Segment")
df["order_status_risk"]      = target_encode("Order Status")
df["order_country_risk"]     = target_encode("Order Country")
print("  + Target encoding: shipping mode, region, market, department, category, product, segment")

# ── 4e. Interaction features ──────────────────────────────────────────────────
df["mode_x_region"]          = target_encode("Shipping Mode") * target_encode("Order Region")
df["mode_x_schedule"]        = df["shipping_mode_risk"] * df["scheduled_window"]
df["region_x_schedule"]      = df["order_region_risk"] * df["scheduled_window"]
df["mode_x_discount"]        = df["shipping_mode_risk"] * df["Order Item Discount Rate"]
print("  + Interactions: mode×region, mode×schedule, region×schedule")

# ── 4f. Geographic aggregates ─────────────────────────────────────────────────
# City-level risk (high cardinality — encode with smoothed target)
df["city_risk"]              = target_encode("Order City")
print("  + Geographic: city-level risk")

# ── 4g. Order-level features ──────────────────────────────────────────────────
df["order_value_per_item"]   = df["Order Item Total"] / (df["Order Item Quantity"] + 1)
df["benefit_ratio"]          = df["Benefit per order"] / (df["Sales per customer"] + 1)
print("  + Order: value per item, benefit ratio")

# ══════════════════════════════════════════════════════════════════════════════
# 5. ENCODE CATEGORICAL COLUMNS
# ══════════════════════════════════════════════════════════════════════════════
print("\n" + "="*60)
print(" STEP 4 — Encoding categoricals")
print("="*60)

cat_cols = df.select_dtypes(include="object").columns.tolist()
print(f"  Encoding {len(cat_cols)} categorical columns: {cat_cols}")

le = LabelEncoder()
for col in cat_cols:
    df[col] = df[col].fillna("__missing__")
    df[col] = le.fit_transform(df[col].astype(str))

df = df.fillna(-1)
print(f"  Final feature matrix: {df.shape}")

# ══════════════════════════════════════════════════════════════════════════════
# 6. TRAIN / VAL / TEST SPLIT
# ══════════════════════════════════════════════════════════════════════════════
print("\n" + "="*60)
print(" STEP 5 — Train/Val/Test Split (70/15/15)")
print("="*60)

X = df.copy()
X_trainval, X_test, y_trainval, y_test = train_test_split(
    X, y, test_size=0.15, random_state=42, stratify=y
)
X_train, X_val, y_train, y_val = train_test_split(
    X_trainval, y_trainval, test_size=0.15/0.85, random_state=42, stratify=y_trainval
)

print(f"  Train : {X_train.shape[0]:>7,} rows")
print(f"  Val   : {X_val.shape[0]:>7,} rows")
print(f"  Test  : {X_test.shape[0]:>7,} rows")

# ══════════════════════════════════════════════════════════════════════════════
# 7. CLASS WEIGHT (handle imbalance)
# ══════════════════════════════════════════════════════════════════════════════
scale_pos_weight = (y_train == 0).sum() / (y_train == 1).sum()
print(f"\n  scale_pos_weight (imbalance ratio): {scale_pos_weight:.3f}")

# ══════════════════════════════════════════════════════════════════════════════
# 8. XGBOOST TRAINING
# ══════════════════════════════════════════════════════════════════════════════
print("\n" + "="*60)
print(" STEP 6 — Training XGBoost")
print("="*60)

model = xgb.XGBClassifier(
    # Tree structure
    n_estimators       = 1500,
    max_depth          = 7,
    min_child_weight   = 5,
    
    # Regularization — key for generalization
    subsample          = 0.8,
    colsample_bytree   = 0.8,
    colsample_bylevel  = 0.8,
    gamma              = 0.1,
    reg_alpha          = 0.1,   # L1
    reg_lambda         = 1.0,   # L2
    
    # Learning
    learning_rate      = 0.05,
    
    # Class imbalance
    scale_pos_weight   = scale_pos_weight,
    
    # Early stopping
    early_stopping_rounds = 30,

    # Eval metric
    eval_metric        = "auc",
    
    # Speed
    tree_method        = "hist",    # GPU-accelerated histogram
    device             = "cuda",    # use your RTX 4050
    
    # Reproducibility
    random_state       = 42,
    n_jobs             = -1,
)

t0 = time.time()
model.fit(
    X_train, y_train,
    eval_set=[(X_val, y_val)],
    verbose=50,
)
print(f"\nTraining time: {time.time()-t0:.1f}s")
print(f"Best iteration: {model.best_iteration}")

# ══════════════════════════════════════════════════════════════════════════════
# 9. EVALUATION
# ══════════════════════════════════════════════════════════════════════════════
print("\n" + "="*60)
print(" STEP 7 — Evaluation")
print("="*60)

for split_name, X_s, y_s in [("Val", X_val, y_val), ("Test", X_test, y_test)]:
    y_pred  = model.predict(X_s)
    y_prob  = model.predict_proba(X_s)[:, 1]
    acc     = accuracy_score(y_s, y_pred)
    auc     = roc_auc_score(y_s, y_prob)
    f1      = f1_score(y_s, y_pred, average="weighted")
    
    print(f"\n--- {split_name} Set ---")
    print(f"  Accuracy : {acc:.4f}")
    print(f"  ROC-AUC  : {auc:.4f}")
    print(f"  F1 (wtd) : {f1:.4f}")
    print(classification_report(y_s, y_pred,
                                target_names=["Low Risk", "High Risk"]))

# ══════════════════════════════════════════════════════════════════════════════
# 10. FEATURE IMPORTANCE
# ══════════════════════════════════════════════════════════════════════════════
print("\n" + "="*60)
print(" STEP 8 — Top 20 Most Important Features")
print("="*60)

importances = pd.Series(model.feature_importances_, index=X_train.columns)
top20 = importances.sort_values(ascending=False).head(20)
for feat, imp in top20.items():
    bar = "|" * int(imp * 300)
    print(f"  {feat:<40} {imp:.4f}  {bar}")

# SHAP (if available)
if SHAP_AVAILABLE:
    print("\n Computing SHAP values...")
    explainer   = shap.TreeExplainer(model)
    shap_values = explainer.shap_values(X_test.head(2000))
    shap_importance = pd.Series(
        np.abs(shap_values).mean(axis=0),
        index=X_test.columns
    ).sort_values(ascending=False)
    print("\nTop 10 by SHAP:")
    print(shap_importance.head(10).to_string())

# ══════════════════════════════════════════════════════════════════════════════
# 11. SAVE
# ══════════════════════════════════════════════════════════════════════════════
print("\n" + "="*60)
print(" STEP 9 — Saving model")
print("="*60)

joblib.dump(model, "xgb_supply_chain_risk.pkl")
print("  Saved: xgb_supply_chain_risk.pkl")

# ══════════════════════════════════════════════════════════════════════════════
# 12. INFERENCE EXAMPLE — predict on new order
# ══════════════════════════════════════════════════════════════════════════════
print("\n" + "="*60)
print(" STEP 10 — Inference Example")
print("="*60)

sample = X_test.head(5).copy()
probs  = model.predict_proba(sample)[:, 1]
preds  = model.predict(sample)
actual = y_test.head(5).values

print(f"  {'Actual':<12} {'Predicted':<12} {'High Risk Prob'}")
print(f"  {'-'*40}")
for a, p, prob in zip(actual, preds, probs):
    label_a = "High Risk" if a == 1 else "Low Risk"
    label_p = "High Risk" if p == 1 else "Low Risk"
    flag    = "CORRECT" if a == p else "WRONG"
    print(f"  {label_a:<12} {label_p:<12} {prob:.3f}   [{flag}]")

print("\nDone.")
