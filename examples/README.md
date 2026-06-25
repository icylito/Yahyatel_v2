# Public Examples

These files let you run and understand the system without any private datasets,
model files, Docker setup, batch scripts, or local environment assumptions.

## Files

| File | Purpose |
|------|---------|
| `public_backend_example.py` | Minimal FastAPI server with a rule-based churn estimator — no model file needed |
| `public_frontend_usage.ts` | Frontend request shape for calling `/predict` |
| `seed_example.py` | How to seed initial users into the database directly via SQLAlchemy |
| `train_example.py` | Full XGBoost training pipeline — bring your own CSV dataset |

---

## Quickstart (no model file)

Install the minimal deps:

```bash
pip install fastapi uvicorn
```

Start the example backend:

```bash
cd examples
uvicorn public_backend_example:app --reload --port 8001
```

Test churn prediction:

```bash
curl -X POST http://127.0.0.1:8001/predict \
  -H "Content-Type: application/json" \
  -d '{"tenure":12,"monthlySpend":70,"paymentDelays":1,"satisfaction":6}'
```

---

## Seeding users

```bash
pip install sqlalchemy asyncpg bcrypt python-dotenv
python examples/seed_example.py
```

Credentials and roles are read from environment variables (see `.env.example`).

---

## Training your own model

1. Place your churn CSV in the project root.
2. Edit `DATASET_PATH` and `COLUMN_MAP` at the top of `train_example.py`.
3. Run:

```bash
pip install pandas scikit-learn xgboost joblib
python examples/train_example.py
```

The script saves `backend/best_model_xgboost.pkl` and `backend/feature_stats.json`.
Restart the backend and it will use your trained model automatically.

---

## Full backend

The production backend is in `backend/main.py`. It uses the same `/predict`
endpoint but also handles authentication, PostgreSQL, AI chat, translation,
contact messages, and admin analytics. See the root `README.md` for setup.
