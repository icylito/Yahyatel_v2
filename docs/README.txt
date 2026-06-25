# YahyaTel v2 Documentation Hub

Welcome to YahyaTel v2, a telecommunications management platform. This documentation gives a surface-level overview of the public project.

## Table of Contents

1. [User Guide](./user_guide.txt)
   Surface Level: How to use the platform, churn prediction, and the AI assistant.
2. [System Architecture](./architecture.txt)
   Technical Level: The full-stack flow from React to FastAPI, including database and AI proxying.
3. [Machine Learning & AI Deep Dive](./machine_learning.txt)
   Technical Level: How churn prediction works with private model artifacts or the public demo fallback.
4. [Security & Authentication](./security.txt)
   Technical Level: JWT authentication, role-based access control, and password hashing.

## Tech Stack Overview

| Component | Technology |
| :--- | :--- |
| Frontend | React 19, TypeScript, Vite, Tailwind CSS |
| Backend | FastAPI, SQLAlchemy async, Uvicorn |
| Database | PostgreSQL or local development database |
| AI/ML | XGBoost-compatible artifacts, Scikit-learn, Groq LLM, public demo fallback |
