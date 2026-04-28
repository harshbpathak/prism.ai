"""
Training script — saves model + preprocessor to artifacts/
Run: python ml/train.py
"""
import warnings; warnings.filterwarnings("ignore")
import sys, os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, roc_auc_score, accuracy_score, f1_score
import xgboost as xgb
import joblib
import time
import json

from ml.preprocessor import SupplyChainPreprocessor, DROP_ALL, TARGET

ARTIFACTS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "artifacts")
os.makedirs(ARTIFACTS_DIR, exist_ok=True)

# ── 1. Load ───────────────────────────────────────────────────────────────────
print("\n[1/6] Loading data...")
df = pd.read_csv("DataCoSupplyChainDataset.csv", encoding="latin1")
print(f"  Shape: {df.shape}")

y = df[TARGET].astype(int)
df.drop(columns=[c for c in DROP_ALL + [TARGET] if c in df.columns], inplace=True)

# ── 2. Split FIRST (prevent leakage in target encoding) ──────────────────────
print("[2/6] Splitting...")
X_trainval, X_test, y_trainval, y_test = train_test_split(
    df, y, test_size=0.15, random_state=42, stratify=y
)
X_train, X_val, y_train, y_val = train_test_split(
    X_trainval, y_trainval,
    test_size=0.15/0.85, random_state=42, stratify=y_trainval
)
print(f"  Train={len(X_train):,}  Val={len(X_val):,}  Test={len(X_test):,}")

# ── 3. Preprocess ─────────────────────────────────────────────────────────────
print("[3/6] Feature engineering...")
prep = SupplyChainPreprocessor(smoothing=20)
X_train_proc = prep.fit_transform(X_train.copy(), y_train)
X_val_proc   = prep.transform(X_val.copy())
X_test_proc  = prep.transform(X_test.copy())
print(f"  Feature matrix: {X_train_proc.shape[1]} features")

# ── 4. Train ──────────────────────────────────────────────────────────────────
print("[4/6] Training XGBoost (GPU)...")
scale_pw = (y_train == 0).sum() / (y_train == 1).sum()

model = xgb.XGBClassifier(
    n_estimators         = 1500,
    max_depth            = 7,
    min_child_weight     = 5,
    subsample            = 0.8,
    colsample_bytree     = 0.8,
    colsample_bylevel    = 0.8,
    gamma                = 0.1,
    reg_alpha            = 0.1,
    reg_lambda           = 1.0,
    learning_rate        = 0.05,
    scale_pos_weight     = scale_pw,
    eval_metric          = "auc",
    early_stopping_rounds= 40,
    tree_method          = "hist",
    device               = "cuda",
    random_state         = 42,
    n_jobs               = -1,
)

t0 = time.time()
model.fit(X_train_proc, y_train, eval_set=[(X_val_proc, y_val)], verbose=100)
elapsed = time.time() - t0
print(f"  Done in {elapsed:.1f}s  |  best_iter={model.best_iteration}")

# ── 5. Evaluate ───────────────────────────────────────────────────────────────
print("\n[5/6] Evaluation:")
metrics = {}
for name, X_s, y_s in [("val", X_val_proc, y_val), ("test", X_test_proc, y_test)]:
    y_pred = model.predict(X_s)
    y_prob = model.predict_proba(X_s)[:, 1]
    metrics[name] = {
        "accuracy": round(float(accuracy_score(y_s, y_pred)), 4),
        "roc_auc":  round(float(roc_auc_score(y_s, y_prob)), 4),
        "f1":       round(float(f1_score(y_s, y_pred, average="weighted")), 4),
    }
    print(f"\n  --- {name.upper()} ---")
    print(f"  Accuracy={metrics[name]['accuracy']}  AUC={metrics[name]['roc_auc']}  F1={metrics[name]['f1']}")
    print(classification_report(y_s, y_pred, target_names=["Low Risk","High Risk"]))

# ── 6. Save ───────────────────────────────────────────────────────────────────
print("[6/6] Saving artifacts...")
joblib.dump(model, f"{ARTIFACTS_DIR}/xgb_model.pkl")
prep.save(f"{ARTIFACTS_DIR}/preprocessor.pkl")

# Save feature importance
fi = pd.Series(model.feature_importances_, index=X_train_proc.columns)
fi_top = fi.sort_values(ascending=False).head(15).to_dict()

meta = {
    "model_type": "XGBClassifier",
    "n_features": X_train_proc.shape[1],
    "best_iteration": int(model.best_iteration),
    "metrics": metrics,
    "top_features": {k: round(float(v), 4) for k,v in fi_top.items()},
    "classes": {0: "Low Risk", 1: "High Risk"},
    "training_rows": len(X_train),
}
with open(f"{ARTIFACTS_DIR}/meta.json", "w") as f:
    json.dump(meta, f, indent=2)

print(f"  Saved to {ARTIFACTS_DIR}/")
print("\nDone!")
