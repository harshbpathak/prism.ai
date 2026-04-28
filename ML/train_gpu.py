"""
Supply Chain Risk Classification — DistilBERT GPU Training Script
Run with: python train_gpu.py
RTX 4050 Laptop (6GB) — expected ~15-20 min for 3 epochs
"""

import warnings
warnings.filterwarnings("ignore")

import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, f1_score, classification_report
import torch
from transformers import (
    AutoTokenizer,
    AutoModelForSequenceClassification,
    TrainingArguments,
    Trainer,
)
from datasets import Dataset

# ─── 0. Sanity check ──────────────────────────────────────────────────────────
print(f"PyTorch : {torch.__version__}")
print(f"CUDA    : {torch.cuda.is_available()}")
if torch.cuda.is_available():
    print(f"GPU     : {torch.cuda.get_device_name(0)}")
    print(f"VRAM    : {torch.cuda.get_device_properties(0).total_memory / 1e9:.1f} GB")
else:
    print("⚠️  No GPU found — training on CPU (will be slow)")

device = "cuda" if torch.cuda.is_available() else "cpu"

# ─── 1. Load merged dataset ───────────────────────────────────────────────────
print("\n[1/6] Loading data...")
df = pd.read_csv("merged_supply_chain_with_news.csv")
print(f"Shape : {df.shape}")
print(f"Labels:\n{df['risk_classification'].value_counts()}")

# ─── 2. Label encoding ────────────────────────────────────────────────────────
label2id = {"Low Risk": 0, "Moderate Risk": 1, "High Risk": 2}
id2label  = {v: k for k, v in label2id.items()}

df["label"] = df["risk_classification"].map(label2id)
df = df.dropna(subset=["label"])
df["label"] = df["label"].astype(int)

# ─── 3. Feature serialization ─────────────────────────────────────────────────
NUMERIC_FEATURES = [
    "fuel_consumption_rate", "eta_variation_hours", "traffic_congestion_level",
    "warehouse_inventory_level", "loading_unloading_time",
    "handling_equipment_availability", "weather_condition_severity",
    "port_congestion_level", "shipping_costs", "supplier_reliability_score",
    "lead_time_days", "route_risk_level", "customs_clearance_time",
    "driver_behavior_score", "fatigue_monitoring_score",
    "disruption_likelihood_score", "delay_probability", "delivery_time_deviation",
]
NUMERIC_FEATURES = [f for f in NUMERIC_FEATURES if f in df.columns]
print(f"\n[2/6] Serializing {len(NUMERIC_FEATURES)} features into text...")

def serialize_row(row):
    parts = [f"{col.replace('_', ' ')} is {round(float(row[col]), 3)}"
             for col in NUMERIC_FEATURES]
    headline = str(row["headline"]) if pd.notna(row.get("headline")) else "No relevant news"
    return ". ".join(parts) + f". News: {headline}"

df["input_text"] = df.apply(serialize_row, axis=1)
print("Serialization done.")

# ─── 4. Train / val / test split ──────────────────────────────────────────────
print("\n[3/6] Splitting dataset...")
model_df = df[["input_text", "label"]].dropna()
train_df, temp_df = train_test_split(model_df, test_size=0.2, random_state=42, stratify=model_df["label"])
val_df,  test_df  = train_test_split(temp_df,  test_size=0.5, random_state=42, stratify=temp_df["label"])
print(f"Train: {len(train_df):,}  |  Val: {len(val_df):,}  |  Test: {len(test_df):,}")
print(f"Label dist (train): {train_df['label'].value_counts().to_dict()}")

# ─── 5. Tokenize ──────────────────────────────────────────────────────────────
MODEL_NAME = "distilbert-base-uncased"
MAX_LEN    = 512

print(f"\n[4/6] Tokenizing with {MODEL_NAME}...")
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)

def tokenize(batch):
    return tokenizer(batch["input_text"], truncation=True, padding="max_length", max_length=MAX_LEN)

train_ds = Dataset.from_pandas(train_df.reset_index(drop=True)).map(tokenize, batched=True)
val_ds   = Dataset.from_pandas(val_df.reset_index(drop=True)).map(tokenize,   batched=True)
test_ds  = Dataset.from_pandas(test_df.reset_index(drop=True)).map(tokenize,  batched=True)

cols = ["input_ids", "attention_mask", "label"]
for ds in [train_ds, val_ds, test_ds]:
    ds.set_format(type="torch", columns=cols)
print("Tokenization done.")

# ─── 6. Model ─────────────────────────────────────────────────────────────────
print(f"\n[5/6] Loading model...")
model = AutoModelForSequenceClassification.from_pretrained(
    MODEL_NAME, num_labels=3, id2label=id2label, label2id=label2id
)

total = sum(p.numel() for p in model.parameters())
print(f"Parameters: {total:,}")

# ─── 7. Class weights to handle imbalance (75% High Risk) ────────────────────
label_counts = train_df["label"].value_counts().sort_index()
class_weights = (1.0 / label_counts).values
class_weights = class_weights / class_weights.sum() * len(class_weights)
weights_tensor = torch.tensor(class_weights, dtype=torch.float).to(device)
print(f"Class weights: {dict(zip(id2label.values(), class_weights.round(3)))}")

# Custom trainer with weighted loss
class WeightedTrainer(Trainer):
    def compute_loss(self, model, inputs, return_outputs=False, **kwargs):
        labels = inputs.pop("labels")
        outputs = model(**inputs)
        logits  = outputs.logits
        loss = torch.nn.functional.cross_entropy(logits, labels, weight=weights_tensor)
        return (loss, outputs) if return_outputs else loss

# ─── 8. Training ──────────────────────────────────────────────────────────────
def compute_metrics(eval_pred):
    logits, labels = eval_pred
    preds = np.argmax(logits, axis=1)
    return {
        "accuracy":    accuracy_score(labels, preds),
        "f1_weighted": f1_score(labels, preds, average="weighted"),
        "f1_macro":    f1_score(labels, preds, average="macro"),
    }

training_args = TrainingArguments(
    output_dir="./distilbert_risk_model",

    # Epochs & batch — tuned for 6GB VRAM
    num_train_epochs=3,
    per_device_train_batch_size=16,   # reduce to 8 if OOM
    per_device_eval_batch_size=32,

    # Optimizer
    learning_rate=2e-5,
    weight_decay=0.01,
    warmup_steps=200,

    # Eval & saving
    eval_strategy="epoch",
    save_strategy="epoch",
    load_best_model_at_end=True,
    metric_for_best_model="f1_macro",   # macro catches minority classes better
    greater_is_better=True,

    # Logging
    logging_steps=100,
    report_to="none",

    # GPU flags  ← THE KEY CHANGES
    fp16=True,              # half-precision on CUDA — cuts VRAM usage in half, ~2x faster
    dataloader_num_workers=0,  # Windows-safe

    seed=42,
)

trainer = WeightedTrainer(
    model=model,
    args=training_args,
    train_dataset=train_ds,
    eval_dataset=val_ds,
    compute_metrics=compute_metrics,
)

print(f"\n[6/6] Fine-tuning on {device.upper()}...")
print("Expected time: ~15-20 min on RTX 4050 (6GB)\n")
train_result = trainer.train()

print(f"\n=== Training Complete ===")
print(f"Steps        : {train_result.global_step}")
print(f"Training loss: {train_result.training_loss:.4f}")

# ─── 9. Test set evaluation ───────────────────────────────────────────────────
print("\n=== Test Set Evaluation ===")
test_output = trainer.predict(test_ds)
preds = np.argmax(test_output.predictions, axis=1)
labels = test_output.label_ids

print(classification_report(labels, preds, target_names=list(label2id.keys())))

# ─── 10. Save ─────────────────────────────────────────────────────────────────
SAVE_DIR = "./distilbert_risk_model_final"
trainer.save_model(SAVE_DIR)
tokenizer.save_pretrained(SAVE_DIR)
print(f"\nModel saved to: {SAVE_DIR}/")
print("Done! 🎉")
