"""
FastAPI backend for Supply Chain Risk Prediction
Run: uvicorn api.main:app --reload --port 8001
Docs: http://localhost:8001/docs
"""
import os, sys, json
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import pandas as pd
import numpy as np
import joblib
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import io

# ── Load artifacts ─────────────────────────────────────────────────────────────
ARTIFACTS = os.path.join(os.path.dirname(os.path.dirname(__file__)), "artifacts")

try:
    model = joblib.load(f"{ARTIFACTS}/xgb_model.pkl")
    prep  = joblib.load(f"{ARTIFACTS}/preprocessor.pkl")
    with open(f"{ARTIFACTS}/meta.json") as f:
        meta = json.load(f)
    print("Artifacts loaded.")
except FileNotFoundError:
    raise RuntimeError("Run `python ml/train.py` first to generate artifacts.")

# ── App ────────────────────────────────────────────────────────────────────────
app = FastAPI(title="Supply Chain Risk API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], allow_methods=["*"], allow_headers=["*"],
)



# ── Schemas ────────────────────────────────────────────────────────────────────
class OrderInput(BaseModel):
    Type:                     str   = Field("DEBIT",           description="Payment type")
    shipping_mode:            str   = Field("Standard Class",  description="Shipping mode")
    days_scheduled:           int   = Field(4,                 description="Days for shipment (scheduled)")
    customer_segment:         str   = Field("Consumer",        description="Customer segment")
    market:                   str   = Field("USCA",            description="Market")
    order_region:             str   = Field("East of USA",     description="Order region")
    order_country:            str   = Field("United States",   description="Order country ship to")
    order_city:               str   = Field("Chicago",         description="Destination city")
    order_status:             str   = Field("COMPLETE",        description="Order status")
    department_name:          str   = Field("Fan Shop",        description="Department")
    category_name:            str   = Field("Clothing",        description="Product category")
    product_name:             str   = Field("Nike Men's Dri-FIT Victory Golf Polo", description="Product name")
    order_item_discount_rate: float = Field(0.0,               ge=0, le=1)
    order_item_product_price: float = Field(49.99,             ge=0)
    order_item_quantity:      int   = Field(1,                 ge=1, le=5)
    order_profit_per_order:   float = Field(15.0)
    sales_per_customer:       float = Field(150.0,             ge=0)
    benefit_per_order:        float = Field(20.0)
    order_item_total:         float = Field(49.99,             ge=0)
    order_item_discount:      float = Field(0.0,               ge=0)
    order_item_profit_ratio:  float = Field(0.3,               ge=-1, le=1)
    sales:                    float = Field(49.99,             ge=0)
    latitude:                 float = Field(41.85,             description="Destination latitude")
    longitude:                float = Field(-87.65,            description="Destination longitude")
    customer_state:           str   = Field("IL")
    customer_city:            str   = Field("Chicago")
    order_date:               str   = Field("2016-06-15 10:00:00", description="Order datetime")
    order_state:              str   = Field("IL")


class PredictionResponse(BaseModel):
    risk_label:    str
    risk_score:    float
    confidence:    float
    top_factors:   dict


def _build_row(order: OrderInput) -> pd.DataFrame:
    """Convert API input → DataFrame matching training schema."""
    row = {
        "Type":                          order.Type,
        "Days for shipment (scheduled)": order.days_scheduled,
        "Benefit per order":             order.benefit_per_order,
        "Sales per customer":            order.sales_per_customer,
        "Category Name":                 order.category_name,
        "Customer City":                 order.customer_city,
        "Customer Segment":              order.customer_segment,
        "Customer State":                order.customer_state,
        "Department Name":               order.department_name,
        "Latitude":                      order.latitude,
        "Longitude":                     order.longitude,
        "Market":                        order.market,
        "Order City":                    order.order_city,
        "Order Country":                 order.order_country,
        "order date (DateOrders)":       order.order_date,
        "Order Item Discount":           order.order_item_discount,
        "Order Item Discount Rate":      order.order_item_discount_rate,
        "Order Item Product Price":      order.order_item_product_price,
        "Order Item Profit Ratio":       order.order_item_profit_ratio,
        "Order Item Quantity":           order.order_item_quantity,
        "Sales":                         order.sales,
        "Order Item Total":              order.order_item_total,
        "Order Profit Per Order":        order.order_profit_per_order,
        "Order Region":                  order.order_region,
        "Order State":                   order.order_state,
        "Order Status":                  order.order_status,
        "Product Name":                  order.product_name,
        "Product Price":                 order.order_item_product_price,
        "Shipping Mode":                 order.shipping_mode,
    }
    return pd.DataFrame([row])


# ── Routes ─────────────────────────────────────────────────────────────────────
@app.get("/api/health")
def health():
    return {"status": "ok", "model": meta["model_type"], "features": meta["n_features"]}

@app.get("/api/meta")
def get_meta():
    return meta

@app.post("/api/predict", response_model=PredictionResponse)
def predict(order: OrderInput):
    try:
        df_row = _build_row(order)
        X      = prep.transform(df_row)
        prob   = float(model.predict_proba(X)[0, 1])
        label  = "High Risk" if prob >= 0.5 else "Low Risk"

        # Top contributing features (using XGBoost feature importances × feature value deviation)
        fi    = dict(zip(prep.feature_cols_, model.feature_importances_))
        top5  = dict(sorted(fi.items(), key=lambda x: x[1], reverse=True)[:5])

        return PredictionResponse(
            risk_label  = label,
            risk_score  = round(prob, 4),
            confidence  = round(max(prob, 1-prob), 4),
            top_factors = {k: round(float(v), 4) for k, v in top5.items()},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/predict/batch")
async def predict_batch(file: UploadFile = File(...)):
    """Upload a CSV with order columns, get risk predictions back."""
    try:
        content = await file.read()
        df = pd.read_csv(io.StringIO(content.decode("latin1")))

        # Drop target if present
        df.drop(columns=["Late_delivery_risk", "Delivery Status",
                         "Days for shipping (real)", "shipping date (DateOrders)"],
                inplace=True, errors="ignore")

        X     = prep.transform(df.copy())
        probs = model.predict_proba(X)[:, 1]
        preds = (probs >= 0.5).astype(int)

        df["risk_score"] = probs.round(4)
        df["risk_label"] = ["High Risk" if p else "Low Risk" for p in preds]

        results = df[["risk_score", "risk_label"]].to_dict(orient="records")
        summary = {
            "total":     len(results),
            "high_risk": int(sum(preds)),
            "low_risk":  len(results) - int(sum(preds)),
            "avg_score": round(float(probs.mean()), 4),
        }
        return {"summary": summary, "predictions": results[:500]}  # cap response
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/api/options")
def get_options():
    """Valid dropdown values for the UI form."""
    return {
        "payment_type":       ["CASH", "DEBIT", "PAYMENT", "TRANSFER"],
        "shipping_mode":      ["First Class", "Same Day", "Second Class", "Standard Class"],
        "customer_segment":   ["Consumer", "Corporate", "Home Office"],
        "market":             ["Africa", "Europe", "LATAM", "Pacific Asia", "USCA"],
        "order_region":       ["Canada","Caribbean","Central Africa","Central America",
                               "Central Asia","East Africa","East of USA","Eastern Asia",
                               "Eastern Europe","North Africa","Northern Europe","Oceania",
                               "South America","South Asia","South of  USA ","Southeast Asia",
                               "West Africa","West of USA","Western Europe"],
        "department_name":    ["Apparel","Book Shop","Discs Shop","Fan Shop","Fitness",
                               "Footwear","Golf","Health and Beauty ","Outdoors","Pet Shop","Technology"],
        "order_status":       ["CANCELED","CLOSED","COMPLETE","ON_HOLD","PAYMENT_REVIEW",
                               "PENDING","PENDING_PAYMENT","PROCESSING","SUSPECTED_FRAUD"],
        "category_name":      ["Accessories","Baby ","Basketball","Books ","Cameras ",
                               "Camping & Hiking","Cardio Equipment","Children's Clothing",
                               "Cleats","Clothing","Computers","Consumer Electronics",
                               "Fishing","Football","Golf Bags & Carts","Golf Balls",
                               "Golf Gloves","Hunting & Shooting","Lacrosse","Men's Footwear",
                               "Men's Golf Clubs","Music","Pets","Running","Shop By Sport",
                               "Soccer","Tennis & Racquet","Water Sports","Women's Apparel",
                               "Women's Clubs","Women's Footwear"],
        "days_scheduled":     [1, 2, 3, 4],
    }
