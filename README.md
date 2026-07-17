# YahyaTel
Churn prediction and customer retention platform for telecom companies.
Presented at ICBCT 2026 — 3rd International Conference on Business, Computing and Technology. 
Check out certificates/BCT_Conference_Certificate.png 

# Telecom AI Churn Prediction & Customer Management

A full-stack telecom web app with AI-powered churn prediction, a customer chatbot,
multi-language support, and an admin analytics dashboard.

<img width="1913" height="914" alt="image" src="https://github.com/user-attachments/assets/38c138e6-b7ba-4530-82f9-b8c9fac7756e" />


## Tech stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19 + TypeScript + Vite + Tailwind CSS |
| Backend | FastAPI (Python) + SQLAlchemy ORM |
| Database | PostgreSQL (async via asyncpg) |
| ML model | XGBoost churn classifier |
| Chatbot | Groq API (Llama 3.1) |

## What is included

- `src/` React TypeScript frontend (pages, components, cart, admin dashboard)
- `backend/` FastAPI backend (auth, ML prediction, AI chat, contact, analytics)
- `examples/` Simplified runnable examples for onboarding without private files
- `docs/` Architecture, ML pipeline, security, and user guide notes
- `.env.example` Safe environment template (copy to `.env` and fill in your values)

## What is intentionally not included

The repository excludes local/private files such as:

- `.env` your real API keys and database credentials
- Python virtual environments and `node_modules`
- Training datasets (CSV files)
- Trained model artifacts (`best_model_xgboost.pkl`, `feature_stats.json`)
- Deployment/Docker files and batch scripts

The backend automatically falls back to a lightweight rule-based churn estimator
when model artifacts are absent, so the API works out of the box without training.

## Environment setup

Copy `.env.example` to `.env` and fill in your values:

```
GROQ_API_KEY=your_groq_api_key
DATABASE_URL=postgresql://user:password@localhost:5432/yourdb
JWT_SECRET_KEY=your_random_secret
COMPANY_NAME=Your Company Name
```

## Quick start

**Frontend:**

```bash
npm install
npm run dev
```

**Backend:**

```bash
pip install -r backend/requirements.txt
python backend/main.py
```

The backend starts on `http://127.0.0.1:8001`. Interactive docs at `/docs`.

## Training your own model

See `examples/train_example.py` bring your own churn CSV, configure the
column mapping, and run the script. The trained model is saved into `backend/`
and loaded automatically on the next server start.

For the exact datasets used to train the included model and how to download them,
see [SOURCES.md](SOURCES.md).

## Seeding demo users

See `examples/seed_example.py` configures and inserts admin, agent, and
customer accounts into your database. Credentials are read from `.env`.

## Examples (no private files needed)

See `examples/README.md` for a minimal backend that runs without any model
files, datasets, or a database connection.
