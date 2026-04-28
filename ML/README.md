# 🚚 Supply Chain Delivery Risk Predictor

<p align="center">
  <img src="https://img.shields.io/badge/Model-XGBoost-orange?style=for-the-badge&logo=python" />
  <img src="https://img.shields.io/badge/API-FastAPI-009688?style=for-the-badge&logo=fastapi" />
  <img src="https://img.shields.io/badge/GPU-CUDA%2012.1-76b900?style=for-the-badge&logo=nvidia" />
  <img src="https://img.shields.io/badge/AUC-0.885-blue?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Accuracy-79.4%25-success?style=for-the-badge" />
</p>

> **Binary classification** — predicts whether a supply chain order will arrive **High Risk (late)** or **Low Risk (on time)** using the DataCo Smart Supply Chain dataset with rich feature engineering and an XGBoost model served via FastAPI.

---

## 📊 Model Performance

| Metric | Validation | Test |
|--------|-----------|------|
| **ROC-AUC** | 0.883 | **0.885** |
| **Accuracy** | 78.7% | **79.4%** |
| **F1 (weighted)** | 0.787 | **0.794** |
| **Training time** | — | **6.9s (RTX 4050)** |

```
              precision    recall    f1
  Low Risk       0.73      0.86    0.79    ← 45% of orders
 High Risk       0.87      0.74    0.80    ← 55% of orders
```

---

## 🗂 Project Structure

```
Supply-chain-model/
│
├── ml/
│   ├── preprocessor.py       # Reusable feature engineering class (fit → save → load)
│   └── train.py              # Full training script (GPU-accelerated)
│
├── api/
│   └── main.py               # FastAPI — predict, batch predict, meta, options
│
├── artifacts/                # Generated after training
│   ├── xgb_model.pkl         # Trained XGBoost classifier
│   ├── preprocessor.pkl      # Fitted preprocessor (target encoders + label encoders)
│   └── meta.json             # Model metrics + feature importances
│
├── DataCoSupplyChainDataset.csv   # Raw dataset (180k orders)
├── pipeline.py               # Standalone exploratory pipeline (deprecated by ml/)
└── README.md
```

---

## ⚙️ Setup

### 1. Install dependencies

```bash
pip install xgboost scikit-learn pandas numpy fastapi uvicorn python-multipart joblib shap
```

### 2. Dataset

Download the **DataCo Smart Supply Chain** dataset from Kaggle:

```
https://www.kaggle.com/datasets/shashwatwork/dataco-smart-supply-chain-for-big-data-analysis
```

Place `DataCoSupplyChainDataset.csv` in the project root.

### 3. Train the model

```bash
python ml/train.py
```

Outputs to `artifacts/` — takes ~7 seconds on GPU, ~2 min on CPU.

### 4. Start the API

```bash
uvicorn api.main:app --reload --port 8001
```

📖 Interactive docs → **http://localhost:8001/docs**

---

## 🔌 API Reference

### `GET /api/health`
```json
{ "status": "ok", "model": "XGBClassifier", "features": 59 }
```

### `GET /api/meta`
Returns model metrics, best iteration, top feature importances, and class definitions.

### `GET /api/options`
Returns valid dropdown values for all categorical fields (shipping modes, regions, departments, etc.)

### `POST /api/predict`
Single order → risk prediction.

**Request:**
```json
{
  "shipping_mode":            "First Class",
  "days_scheduled":           2,
  "customer_segment":         "Consumer",
  "market":                   "USCA",
  "order_region":             "East of USA",
  "order_status":             "COMPLETE",
  "department_name":          "Fan Shop",
  "category_name":            "Clothing",
  "order_item_discount_rate": 0.05,
  "order_item_quantity":      1,
  "order_profit_per_order":   15.0,
  "order_date":               "2016-06-15 10:00:00"
}
```

**Response:**
```json
{
  "risk_label":  "High Risk",
  "risk_score":  0.9941,
  "confidence":  0.9941,
  "top_factors": {
    "shipping_mode_risk":  0.4351,
    "Shipping Mode":       0.1463,
    "very_tight_schedule": 0.1266,
    "tight_schedule":      0.0819,
    "scheduled_window":    0.0383
  }
}
```

### `POST /api/predict/batch`
Upload a CSV file of orders → predictions for every row.

```bash
curl -X POST http://localhost:8001/api/predict/batch \
  -F "file=@DataCoSupplyChainDataset.csv"
```

**Response:**
```json
{
  "summary": {
    "total":     180519,
    "high_risk": 98977,
    "low_risk":  81542,
    "avg_score": 0.547
  },
  "predictions": [
    { "risk_score": 0.994, "risk_label": "High Risk" },
    ...
  ]
}
```

---

## 🧠 Feature Engineering

The model uses **59 features** engineered from the 30 raw order-time columns. Key groups:

| Group | Features | Signal |
|-------|----------|--------|
| **Shipping Mode** | Raw + target-encoded risk | Strongest single predictor (AUC ~0.81 alone) |
| **Schedule window** | `days_scheduled`, `tight_schedule`, `very_tight_schedule` | 1-day windows fail ~95% of the time |
| **Target encodings** | Historical late rate per mode, region, market, city, product, dept | Smoothed Bayesian encoding (smoothing=20) |
| **Interactions** | `mode × region`, `mode × schedule`, `region × schedule` | Capture combined risk |
| **Temporal** | month, day of week, quarter, is_weekend, is_month_end | Seasonality effects |
| **Financial** | discount rate, profit ratio, profit bins | Order priority proxies |

### Top 5 features by importance (SHAP)
```
Shipping Mode          ███████████████████████  (dominant)
shipping_mode_risk     ████████████████
mode_x_region          █████████████
order_status_risk      █████████████
very_tight_schedule    ███████
```

---

## 🔍 Key Findings

- **`Shipping Mode` is the dominant predictor** — First Class has a 95% late rate despite the premium name (tighter promised window → higher failure rate)
- **Short scheduled windows are almost always missed** — 1-day schedules fail 95% of the time, 2-day fail 77%
- **Geography, market, and product category contribute marginally** — all hover around 55% risk regardless of value
- **News headlines have negligible signal** for individual order delivery prediction — noise, not signal

---

## 🚀 Why XGBoost over BERT?

This is a **tabular + categorical** problem. There is no free text. Using BERT here would mean:
- Serializing numbers as sentences ("days scheduled is 2") — artificial
- 66M parameter inference for a decision that an 800-tree XGBoost makes in milliseconds
- ~10× slower inference, ~0% accuracy improvement

XGBoost trains in **7 seconds**, runs inference in **< 1ms** per order, and achieves **AUC 0.885** — the right tool for the right job.

---

## 📦 Dataset

**DataCo Smart Supply Chain for Big Data Analysis**
- 180,519 orders across 4 years (2015–2018)
- 53 raw columns: order details, shipping, customer, product, logistics metrics
- 5 markets: LATAM, Pacific Asia, USCA, Europe, Africa
- Products: Clothing, Sports, Electronics

> Source: Fabian Constante, Instituto Politécnico de Leiria — [Mendeley Data](https://data.mendeley.com/datasets/8gx2fvg2k6/5)

---

## 📝 License

Dataset: **CC0 Public Domain**  
Code: **MIT**

---

<p align="center">Built with XGBoost · FastAPI · CUDA · Python 3.12</p>
