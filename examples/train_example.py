"""
examples/train_example.py
--------------------------
Minimal example of the XGBoost churn-prediction training pipeline.

This shows the pattern used in the full project:
  1. Load one or more CSV datasets
  2. Standardise column names across sources
  3. Label-encode categoricals, fill NaN with medians/modes
  4. Train XGBoost with GridSearchCV
  5. Save the model and feature stats for the FastAPI backend

To use this example:
  1. Place your own CSV file(s) in the project root.
  2. Update DATASET_PATH and COLUMN_MAP below to match your column names.
  3. Run:
        pip install pandas scikit-learn xgboost joblib
        python examples/train_example.py

The backend (backend/main.py) loads best_model_xgboost.pkl and
feature_stats.json automatically on startup. If those files are missing
it falls back to a lightweight rule-based estimator so the API still works.
"""

import os
import json
import logging
import pandas as pd
import joblib
from xgboost import XGBClassifier
from sklearn.model_selection import train_test_split, GridSearchCV
from sklearn.metrics import accuracy_score, precision_score, recall_score, f1_score, roc_auc_score

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger("ChurnTrainer")

# ---------------------------------------------------------------------------
# Configuration — edit these to match your dataset
# ---------------------------------------------------------------------------

# Path to your CSV file (relative to the project root)
DATASET_PATH = "your_churn_dataset.csv"

# The column in your CSV that contains the churn label (Yes/No or True/False or 1/0)
TARGET_COL = "Churn"

# Columns to drop before training (IDs, free-text, leakage columns, etc.)
DROP_COLS = ["CustomerID"]

# Optional: rename your CSV columns to the names expected by the backend.
# Left side = your CSV column name, right side = backend-expected name.
# Remove or leave empty ({}) if your column names already match.
COLUMN_MAP = {
    "tenure":          "MonthsInService",
    "MonthlyCharges":  "MonthlyRevenue",
}

# Where to save the trained artifacts (backend reads from these paths)
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "..", "backend")


# ---------------------------------------------------------------------------
# Load data
# ---------------------------------------------------------------------------

def load_data() -> pd.DataFrame:
    path = os.path.join(os.path.dirname(__file__), "..", DATASET_PATH)
    if not os.path.exists(path):
        raise FileNotFoundError(
            f"Dataset not found at: {path}\n"
            "Update DATASET_PATH in examples/train_example.py to point to your CSV file."
        )

    df = pd.read_csv(path)
    logger.info(f"Loaded {df.shape[0]:,} rows × {df.shape[1]} columns from {DATASET_PATH}")

    # Rename columns if a mapping is provided
    if COLUMN_MAP:
        df = df.rename(columns=COLUMN_MAP)

    # Drop unwanted columns
    df.drop(columns=[c for c in DROP_COLS if c in df.columns], inplace=True)

    # Normalise the target column to integers (0 / 1)
    col = df[TARGET_COL]
    if col.dtype == object:
        df[TARGET_COL] = col.str.strip().str.lower().map(
            {"yes": 1, "no": 0, "true": 1, "false": 0}
        )
    elif col.dtype == bool:
        df[TARGET_COL] = col.astype(int)

    df = df[df[TARGET_COL].isin([0, 1])].copy()
    logger.info(f"Churn rate: {df[TARGET_COL].mean():.3f}")
    return df


# ---------------------------------------------------------------------------
# Preprocessing — encode categoricals and fill NaN
# ---------------------------------------------------------------------------

def preprocess(df: pd.DataFrame):
    y = df[TARGET_COL]
    X = df.drop(columns=[TARGET_COL])

    encoders = {}
    defaults = {}

    for col in X.columns:
        coerced = pd.to_numeric(X[col], errors="coerce")
        is_numeric = coerced.notna().mean() > 0.8

        if is_numeric:
            X[col] = coerced
            median = X[col].median()
            X[col] = X[col].fillna(median)
            defaults[col] = float(median)
        else:
            mode = X[col].mode(dropna=True)
            mode = mode.iloc[0] if not mode.empty else "Unknown"
            X[col] = X[col].fillna(mode)
            uniques = sorted(X[col].astype(str).unique().tolist())
            mapping = {v: i for i, v in enumerate(uniques)}
            encoders[col] = mapping
            X[col] = X[col].astype(str).map(mapping).astype(int)
            defaults[col] = int(mapping[str(mode)])

    feature_stats = {
        "features": X.columns.tolist(),
        "defaults": defaults,
        "encoders": encoders,
    }
    return X, y, feature_stats


# ---------------------------------------------------------------------------
# Training — XGBoost with GridSearchCV
# ---------------------------------------------------------------------------

def train(X: pd.DataFrame, y: pd.Series):
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    # Weight to handle class imbalance (common in churn datasets)
    neg, pos = (y_train == 0).sum(), (y_train == 1).sum()
    scale = neg / pos
    logger.info(f"Class balance — non-churn: {neg:,}  churn: {pos:,}  scale_pos_weight: {scale:.2f}")

    model = XGBClassifier(
        random_state=42,
        eval_metric="logloss",
        scale_pos_weight=scale,
        subsample=0.8,
        colsample_bytree=0.8,
    )

    # Tune hyperparameters — reduce ranges if training is slow
    param_grid = {
        "n_estimators":  [100, 200],
        "max_depth":     [3, 5],
        "learning_rate": [0.05, 0.1],
    }

    grid = GridSearchCV(model, param_grid, scoring="roc_auc", cv=3, verbose=1, n_jobs=-1)
    grid.fit(X_train, y_train)
    best = grid.best_estimator_

    y_pred = best.predict(X_test)
    y_prob = best.predict_proba(X_test)[:, 1]

    logger.info(
        f"\nResults — Accuracy: {accuracy_score(y_test, y_pred):.4f}  "
        f"Precision: {precision_score(y_test, y_pred):.4f}  "
        f"Recall: {recall_score(y_test, y_pred):.4f}  "
        f"F1: {f1_score(y_test, y_pred):.4f}  "
        f"ROC-AUC: {roc_auc_score(y_test, y_prob):.4f}"
    )
    logger.info(f"Best params: {grid.best_params_}")
    return best


# ---------------------------------------------------------------------------
# Save artifacts for the backend to load
# ---------------------------------------------------------------------------

def save_artifacts(model, feature_stats: dict):
    model_path = os.path.join(OUTPUT_DIR, "best_model_xgboost.pkl")
    stats_path = os.path.join(OUTPUT_DIR, "feature_stats.json")

    joblib.dump(model, model_path)
    logger.info(f"Model saved → {model_path}")

    with open(stats_path, "w") as f:
        json.dump(feature_stats, f, indent=2)
    logger.info(f"Feature stats saved → {stats_path}")
    logger.info("Restart the backend (backend/main.py) to load the new model.")


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    df = load_data()
    X, y, feature_stats = preprocess(df)
    logger.info(f"Features: {len(feature_stats['features'])}  Categorical encoders: {len(feature_stats['encoders'])}")
    model = train(X, y)
    save_artifacts(model, feature_stats)
